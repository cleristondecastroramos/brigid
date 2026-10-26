// Cria (por convite) as contas institucionais das Promotorias e as vincula no BRIGID.
//
// A chave de serviço dá acesso total ao banco: use-a apenas localmente, por variável de
// ambiente, e nunca a grave em arquivos do projeto.
//
// 1) Gerar a planilha-modelo com todas as Promotorias (preencha a coluna email):
//      node scripts/convidar-contas-promotorias.mjs --modelo contas.csv
// 2) Conferir sem alterar nada:
//      node scripts/convidar-contas-promotorias.mjs contas.csv --simular
// 3) Enviar os convites e gravar os vínculos:
//      node scripts/convidar-contas-promotorias.mjs contas.csv
//
// Variáveis: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e, opcionalmente, BRIGID_URL
// (endereço do site, para o link do convite; padrão http://localhost:5173).
// Opções: --substituir-email (troca o e-mail institucional já cadastrado de uma Promotoria)
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = (process.env.BRIGID_URL || "http://localhost:5173").replace(/\/$/, "");
const redirectTo = `${site}/diagnostico-brigid/redefinir-senha`;

if (!url || !chave) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  process.exit(1);
}
const supabase = createClient(url, chave, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const csvLinha = (v) =>
  /[",\n;]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? "");

function lerCsv(caminho) {
  const texto = fs.readFileSync(caminho, "utf8").replace(/^﻿/, "");
  const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
  const sep = linhas[0].includes(";") ? ";" : ",";
  const partir = (l) => {
    const out = [];
    let atual = "";
    let aspas = false;
    for (const c of l) {
      if (c === '"') aspas = !aspas;
      else if (c === sep && !aspas) {
        out.push(atual);
        atual = "";
      } else atual += c;
    }
    out.push(atual);
    return out.map((x) => x.trim());
  };
  const cab = partir(linhas[0]).map((c) => c.toLowerCase());
  const iId = cab.indexOf("promotoria_id");
  const iEmail = cab.indexOf("email");
  if (iId < 0 || iEmail < 0)
    throw new Error("A planilha precisa das colunas promotoria_id e email.");
  return linhas
    .slice(1)
    .map(partir)
    .map((c) => ({ promotoria_id: c[iId], email: (c[iEmail] || "").toLowerCase() }))
    .filter((l) => l.promotoria_id && l.email);
}

async function todasPromotorias() {
  const { data, error } = await supabase
    .from("promotorias_justica")
    .select("id, nome, comarca_sede, email_institucional")
    .order("nome");
  if (error) throw new Error(error.message);
  return data;
}

async function todosUsuarios() {
  const porEmail = new Map();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    for (const u of data.users) if (u.email) porEmail.set(u.email.toLowerCase(), u);
    if (data.users.length < 1000) return porEmail;
  }
}

async function gerarModelo(caminho) {
  const ps = await todasPromotorias();
  const linhas = ["promotoria_id;nome;comarca_sede;email"].concat(
    ps.map((p) =>
      [p.id, p.nome, p.comarca_sede, p.email_institucional ?? ""].map(csvLinha).join(";"),
    ),
  );
  fs.writeFileSync(caminho, "﻿" + linhas.join("\n"));
  console.log(
    `Modelo com ${ps.length} Promotorias gravado em ${caminho}. Preencha a coluna email.`,
  );
}

async function processar(caminho) {
  const simular = flag("--simular");
  const substituir = flag("--substituir-email");
  const linhas = lerCsv(caminho);
  const promotorias = new Map((await todasPromotorias()).map((p) => [p.id, p]));
  const usuarios = await todosUsuarios();
  const resumo = { convidadas: 0, existentes: 0, vinculadas: 0, ignoradas: 0 };

  const repetidos = linhas.map((l) => l.email).filter((e, i, a) => a.indexOf(e) !== i);
  if (repetidos.length) {
    console.warn(
      `Atenção: e-mails usados por mais de uma Promotoria: ${[...new Set(repetidos)].join(", ")}`,
    );
  }

  for (const { promotoria_id, email } of linhas) {
    const p = promotorias.get(promotoria_id);
    const rotulo = `${promotoria_id} <${email}>`;
    if (!p) {
      console.warn(`IGNORADA ${rotulo}: Promotoria inexistente.`);
      resumo.ignoradas++;
      continue;
    }
    if (!EMAIL.test(email)) {
      console.warn(`IGNORADA ${rotulo}: e-mail inválido.`);
      resumo.ignoradas++;
      continue;
    }
    if (p.email_institucional && p.email_institucional.toLowerCase() !== email && !substituir) {
      console.warn(
        `IGNORADA ${rotulo}: a Promotoria já tem ${p.email_institucional} (use --substituir-email).`,
      );
      resumo.ignoradas++;
      continue;
    }

    let usuario = usuarios.get(email);
    if (simular) {
      console.log(`${usuario ? "VINCULARIA" : "CONVIDARIA"} ${rotulo} — ${p.nome}`);
      continue;
    }

    if (!usuario) {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo });
      if (error) {
        console.error(`ERRO ${rotulo}: convite não enviado — ${error.message}`);
        resumo.ignoradas++;
        continue;
      }
      usuario = data.user;
      usuarios.set(email, usuario);
      resumo.convidadas++;
    } else {
      resumo.existentes++;
    }

    const { error: e1 } = await supabase
      .from("usuarios_promotoria")
      .upsert(
        {
          user_id: usuario.id,
          promotoria_id,
          nome_responsavel: "Conta institucional da Promotoria",
          ativo: true,
        },
        { onConflict: "user_id,promotoria_id" },
      );
    const { error: e2 } = await supabase
      .from("promotorias_justica")
      .update({ email_institucional: email, updated_at: new Date().toISOString() })
      .eq("id", promotoria_id);
    if (e1 || e2) {
      console.error(`ERRO ${rotulo}: vínculo não gravado — ${(e1 || e2).message}`);
      resumo.ignoradas++;
      continue;
    }
    resumo.vinculadas++;
    console.log(`OK ${rotulo} — ${p.nome}`);
  }

  console.log(
    simular
      ? "Simulação concluída: nada foi alterado."
      : `Concluído: ${resumo.convidadas} convite(s), ${resumo.existentes} conta(s) já existente(s), ` +
          `${resumo.vinculadas} vínculo(s) gravado(s), ${resumo.ignoradas} ignorada(s).`,
  );
  if (!simular && resumo.convidadas) {
    console.log(
      `Os convites levam a ${redirectTo}; inclua esse endereço em Authentication > URL Configuration.`,
    );
  }
}

try {
  if (flag("--modelo")) {
    await gerarModelo(args[args.indexOf("--modelo") + 1] || "contas-promotorias.csv");
  } else if (args[0] && !args[0].startsWith("--")) {
    await processar(args[0]);
  } else {
    console.log(
      "Uso: node scripts/convidar-contas-promotorias.mjs --modelo contas.csv | contas.csv [--simular]",
    );
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
