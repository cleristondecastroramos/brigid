// Contas institucionais das Promotorias: planilha-modelo, SQL dos e-mails e convites.
//
// Execute na pasta do projeto (brigid). Três modos:
//
// 1) Gerar a planilha-modelo com todas as Promotorias (preencha a coluna "email"):
//      node scripts/diagnostico/convidar-contas-promotorias.mjs --modelo contas.csv
//    Usa as credenciais públicas do .env do projeto; não precisa de chave de serviço.
//
// 2) Lovable Cloud (sem chave de serviço): gerar o SQL que grava os e-mails institucionais
//      node scripts/diagnostico/convidar-contas-promotorias.mjs contas.csv --sql emails.sql
//    Execute emails.sql no banco, convide os e-mails em More → Users → Add user e clique em
//    "Vincular contas pelo e-mail institucional" na tela Administração do BRIGID.
//
// 3) Com a chave de serviço (Supabase próprio): convidar e vincular de uma vez
//      node scripts/diagnostico/convidar-contas-promotorias.mjs contas.csv --simular
//      node scripts/diagnostico/convidar-contas-promotorias.mjs contas.csv
//    Variáveis: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e BRIGID_URL (endereço do site).
//    A chave de serviço dá acesso total ao banco: só no ambiente, nunca em arquivos.
//
// Opção: --substituir-email (troca o e-mail institucional já cadastrado de uma Promotoria)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const valor = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);
const site = (process.env.BRIGID_URL || "https://brigid-mppi.vercel.app").replace(/\/$/, "");
const redirectTo = `${site}/diagnostico-brigid/redefinir-senha`;

// Credenciais públicas do projeto (leitura das Promotorias, liberada a todos pelo RLS)
function envDoProjeto() {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const arq = path.join(raiz, ".env");
  if (!fs.existsSync(arq)) return {};
  const env = {};
  for (const linha of fs.readFileSync(arq, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

let supabase;
function cliente({ servico }) {
  if (supabase) return supabase;
  const env = envDoProjeto();
  const url = process.env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const chave = servico
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) {
    throw new Error(
      servico
        ? "Este modo exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente. No Lovable Cloud, use --sql."
        : "Não encontrei VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env do projeto.",
    );
  }
  supabase = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
  return supabase;
}

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
  const { data, error } = await cliente({ servico: false })
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

// Lovable Cloud: gera o SQL que grava os e-mails institucionais (sem chave de serviço)
async function gerarSql(caminho, saida) {
  const substituir = flag("--substituir-email");
  const linhas = lerCsv(caminho);
  const invalidos = linhas.filter((l) => !EMAIL.test(l.email));
  const repetidos = [
    ...new Set(linhas.map((l) => l.email).filter((e, i, a) => a.indexOf(e) !== i)),
  ];
  if (invalidos.length || repetidos.length) {
    for (const l of invalidos) console.error(`E-mail inválido: ${l.promotoria_id} <${l.email}>`);
    for (const e of repetidos) console.error(`E-mail repetido em mais de uma Promotoria: ${e}`);
    throw new Error("Corrija a planilha e gere o SQL novamente.");
  }
  let ids = null;
  try {
    ids = new Set((await todasPromotorias()).map((p) => p.id));
  } catch {
    console.warn(
      "Não foi possível conferir os códigos das Promotorias no banco; SQL gerado assim mesmo.",
    );
  }
  const desconhecidas = ids ? linhas.filter((l) => !ids.has(l.promotoria_id)) : [];
  for (const l of desconhecidas)
    console.warn(`IGNORADA ${l.promotoria_id}: Promotoria inexistente.`);
  const validas = linhas.filter((l) => !desconhecidas.includes(l));
  const q = (v) => `'${String(v).replace(/'/g, "''")}'`;
  const sql = [
    "-- E-mails institucionais das Promotorias (gerado por scripts/diagnostico/convidar-contas-promotorias.mjs)",
    substituir
      ? "-- Substitui e-mails já cadastrados."
      : "-- Não altera Promotorias que já tenham outro e-mail cadastrado (use --substituir-email).",
    "BEGIN;",
    ...validas.map(
      (l) =>
        `UPDATE public.promotorias_justica SET email_institucional = ${q(l.email)}, updated_at = now() ` +
        `WHERE id = ${q(l.promotoria_id)}` +
        (substituir
          ? ""
          : ` AND (email_institucional IS NULL OR lower(email_institucional) = ${q(l.email)})`) +
        ";",
    ),
    "COMMIT;",
    "",
  ].join("\n");
  fs.writeFileSync(saida, sql);
  console.log(`${validas.length} e-mail(s) gravado(s) em ${saida}. Execute esse SQL no banco.`);
  console.log("Depois convide cada e-mail (More → Users → Add user → Send invitation) e clique em");
  console.log('"Vincular contas pelo e-mail institucional" na tela Administração do BRIGID.');
}

async function processar(caminho) {
  cliente({ servico: true });
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

    const { error: e1 } = await supabase.from("usuarios_promotoria").upsert(
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
      `Os convites levam a ${redirectTo}; inclua esse endereço nas Redirect URLs da autenticação.`,
    );
  }
}

try {
  if (flag("--modelo")) {
    await gerarModelo(args[args.indexOf("--modelo") + 1] || "contas-promotorias.csv");
  } else if (args[0] && !args[0].startsWith("--") && flag("--sql")) {
    await gerarSql(args[0], valor("--sql") || "emails-promotorias.sql");
  } else if (args[0] && !args[0].startsWith("--")) {
    await processar(args[0]);
  } else {
    console.log(
      "Uso: node scripts/diagnostico/convidar-contas-promotorias.mjs --modelo contas.csv | contas.csv --sql emails.sql | contas.csv [--simular]",
    );
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
