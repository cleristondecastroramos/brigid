// Testes das ações da função de borda contas-promotorias (supabase/functions/contas-promotorias/acoes.ts).
// O módulo é transpilado para JavaScript e executado com dublês do banco e da autenticação:
// cada teste confere o que seria gravado na conta, na tabela de credenciais e nos logs.
// Uso: npm run test:diagnostico
import { test, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dir = path.join(raiz, "node_modules", ".cache", `contas-${process.pid}`);
let m; // módulo acoes.ts transpilado

const AGORA = new Date("2026-10-26T12:00:00.000Z");
const HORA = 3600 * 1000;
const CAOCRIM = { id: "caocrim", email: "caocrim@mppi.mp.br", app_metadata: {} };

before(async () => {
  const fonte = fs.readFileSync(
    path.join(raiz, "supabase/functions/contas-promotorias/acoes.ts"),
    "utf8",
  );
  fs.mkdirSync(dir, { recursive: true });
  const js = ts.transpileModule(fonte, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  fs.writeFileSync(path.join(dir, "acoes.mjs"), js);
  m = await import(pathToFileURL(path.join(dir, "acoes.mjs")).href);
});

after(() => fs.rmSync(dir, { recursive: true, force: true }));

// Captura tudo o que as ações escreverem no console, para conferir que nenhuma credencial vaza
let logs;
const originais = {};
beforeEach(() => {
  logs = [];
  for (const k of ["log", "info", "warn", "error", "debug"]) {
    originais[k] = console[k];
    console[k] = (...a) => logs.push(a.map(String).join(" "));
  }
});
afterEach(() => Object.assign(console, originais));

// Ambiente simulado: contas do Auth, credenciais (hash), admins, vínculos e sessões
function ambiente({ contas = {}, credenciais = {}, admins = [], vinculos = [], situacao } = {}) {
  const estado = {
    contas: structuredClone(contas),
    credenciais: structuredClone(credenciais),
    sessoes: {},
    rpc: [],
    agora: AGORA,
    falhas: {},
  };
  const deps = {
    rpc: async (fn, args) => {
      estado.rpc.push([fn, args]);
      if (estado.falhas[fn]) throw estado.falhas[fn];
      if (fn === "admin_situacao_conta_promotoria") return situacao ? [situacao] : [];
      if (fn === "admin_conferir_conta_promotoria") return estado.contas[args.p_user_id]?.email;
      return null;
    },
    obterConta: async (id) => (estado.contas[id] ? structuredClone(estado.contas[id]) : null),
    criarConta: async (email, senha, app_metadata) => {
      if (estado.falhas.criarConta) throw estado.falhas.criarConta;
      const id = `nova-${Object.keys(estado.contas).length}`;
      estado.contas[id] = { id, email, senha, app_metadata };
      return id;
    },
    atualizarConta: async (id, dados) => {
      if (estado.falhas.atualizarConta) throw estado.falhas.atualizarConta;
      const c = estado.contas[id];
      if (dados.password) c.senha = dados.password;
      if (dados.app_metadata) c.app_metadata = { ...c.app_metadata, ...dados.app_metadata };
    },
    ehAdmin: async (id) => admins.includes(id),
    temVinculoAtivo: async (id) => vinculos.includes(id),
    lerCredencial: async (id) => estado.credenciais[id] ?? null,
    gravarCredencial: async (id, c) => {
      if (estado.falhas.gravarCredencial) throw estado.falhas.gravarCredencial;
      estado.credenciais[id] = c;
    },
    apagarCredencial: async (id) => {
      delete estado.credenciais[id];
    },
    encerrarSessoes: async (id) => {
      estado.sessoes[id] = "encerradas";
      return 2;
    },
    bytesAleatorios: (n) => new Uint8Array(crypto.randomBytes(n)),
    agora: () => estado.agora,
  };
  return { estado, deps };
}

const situacaoNova = {
  user_id: null,
  tem_senha: false,
  provisoria: false,
  credencial_individual: false,
  credencial_expirada: false,
  expira_em: null,
  vinculada_promotoria: false,
};

// Conta provisória com credencial emitida: devolve o ambiente e a credencial em claro
async function contaProvisoria({ horasDesdeEmissao = 1, admin = false, vinculo = true } = {}) {
  const credencial = m.gerarCredencial((n) => new Uint8Array(crypto.randomBytes(n)));
  const emitida = new Date(AGORA.getTime() - horasDesdeEmissao * HORA);
  const amb = ambiente({
    contas: {
      pa: {
        id: "pa",
        email: "pa@mppi.mp.br",
        senha: credencial,
        app_metadata: { senha_provisoria: true },
      },
    },
    credenciais: {
      pa: {
        hash_credencial: await m.hashCredencial(credencial),
        emitida_em: emitida.toISOString(),
        expira_em: new Date(emitida.getTime() + 72 * HORA).toISOString(),
      },
    },
    admins: admin ? ["pa"] : [],
    vinculos: vinculo ? ["pa"] : [],
  });
  return { ...amb, credencial, usuario: { id: "pa", email: "pa@mppi.mp.br", app_metadata: {} } };
}

const definir = (credencial, nova, extra = {}) => ({
  acao: "definir_senha_definitiva",
  credencial_provisoria: credencial,
  nova_senha: nova,
  ...extra,
});

// ------------------------------------------------------------------ Correção 1: credencial

test("credencial: individual, aleatória, forte e diferente a cada emissão", () => {
  const gerar = () => m.gerarCredencial((n) => new Uint8Array(crypto.randomBytes(n)));
  const amostra = new Set(Array.from({ length: 500 }, gerar));
  assert.equal(amostra.size, 500, "nenhuma repetição em 500 emissões");
  for (const c of amostra) {
    assert.match(c, /^[A-Za-z0-9]{4}(-[A-Za-z0-9]{4}){3}$/);
    assert.match(c, /[A-Z]/);
    assert.match(c, /[a-z]/);
    assert.match(c, /[0-9]/);
    assert.doesNotMatch(c, /[0O1lI]/, "sem caracteres ambíguos");
  }
});

test("conta nova: credencial só na resposta; gravados apenas o hash, a emissão e a validade de 72 h", async () => {
  const { estado, deps } = ambiente({ situacao: situacaoNova });
  const r = await m.executarAcao(
    { acao: "ativar", email: " PJ.X@mppi.mp.br ", promotoria_id: "pj-x" },
    CAOCRIM,
    deps,
  );
  assert.equal(r.situacao, "conta_criada");
  assert.equal(r.email, "pj.x@mppi.mp.br");
  const conta = Object.values(estado.contas)[0];
  assert.equal(conta.senha, r.credencial_provisoria, "a senha da conta é a credencial emitida");
  assert.equal(conta.app_metadata.senha_provisoria, true);
  assert.equal(conta.app_metadata.senha_provisoria_em, AGORA.toISOString());
  assert.equal(
    conta.app_metadata.senha_provisoria_expira_em,
    new Date(AGORA.getTime() + 72 * HORA).toISOString(),
  );
  const reg = estado.credenciais[conta.id];
  assert.deepEqual(Object.keys(reg).sort(), [
    "emitida_em",
    "emitida_por",
    "expira_em",
    "hash_credencial",
  ]);
  assert.equal(reg.hash_credencial, await m.hashCredencial(r.credencial_provisoria));
  assert.notEqual(reg.hash_credencial, r.credencial_provisoria);
  assert.equal(reg.emitida_por, "caocrim");
  assert.equal(r.expira_em, reg.expira_em);
  // Nem a credencial nem o hash aparecem em log ou em chamadas ao banco
  const tudo = JSON.stringify([logs, estado.rpc]);
  assert.ok(!tudo.includes(r.credencial_provisoria));
  assert.ok(!tudo.includes(reg.hash_credencial));
  assert.deepEqual(estado.rpc.at(-1), [
    "admin_vincular_conta_promotoria",
    { p_user_id: conta.id, p_promotoria_id: "pj-x" },
  ]);
});

test("duas contas novas recebem credenciais diferentes", async () => {
  const { deps } = ambiente({ situacao: situacaoNova });
  const a = await m.executarAcao(
    { acao: "ativar", email: "a@mppi.mp.br", promotoria_id: "p" },
    CAOCRIM,
    deps,
  );
  const b = await m.executarAcao(
    { acao: "ativar", email: "b@mppi.mp.br", promotoria_id: "p" },
    CAOCRIM,
    deps,
  );
  assert.notEqual(a.credencial_provisoria, b.credencial_provisoria);
});

test("primeiro acesso: credencial válida define a senha, retira a marca e registra a data", async () => {
  const { estado, deps, credencial, usuario } = await contaProvisoria();
  const r = await m.executarAcao(definir(credencial, "Senha-Definitiva-2026"), usuario, deps);
  assert.deepEqual(r, { ok: true });
  const conta = estado.contas.pa;
  assert.equal(conta.senha, "Senha-Definitiva-2026");
  assert.equal(conta.app_metadata.senha_provisoria, false);
  assert.equal(conta.app_metadata.senha_definida_em, AGORA.toISOString());
  assert.equal(conta.app_metadata.senha_provisoria_expira_em, null);
  assert.equal(estado.credenciais.pa, undefined, "o hash é apagado após o uso");
  assert.ok(!JSON.stringify(logs).includes("Senha-Definitiva-2026"));
  // O fluxo de primeiro acesso não pode ser reutilizado
  await assert.rejects(
    m.executarAcao(definir(credencial, "Outra-Senha-Forte-1"), usuario, deps),
    (e) => e.status === 403 && /já possui senha definitiva/.test(e.message),
  );
});

test("expiração: aceita até o fim das 72 horas e recusa depois, sem alterar a conta", async () => {
  const dentro = await contaProvisoria({ horasDesdeEmissao: 71.9 });
  await m.executarAcao(
    definir(dentro.credencial, "Senha-Definitiva-2026"),
    dentro.usuario,
    dentro.deps,
  );

  for (const horas of [72, 100]) {
    const { estado, deps, credencial, usuario } = await contaProvisoria({
      horasDesdeEmissao: horas,
    });
    await assert.rejects(
      m.executarAcao(definir(credencial, "Senha-Definitiva-2026"), usuario, deps),
      (e) => e.status === 403 && /expirou/.test(e.message),
    );
    assert.equal(estado.contas.pa.senha, credencial);
    assert.equal(estado.contas.pa.app_metadata.senha_provisoria, true, "continua bloqueada");
  }
});

test("primeiro acesso: credencial errada, ausente ou de outra emissão é recusada", async () => {
  const { estado, deps, credencial, usuario } = await contaProvisoria();
  const outra = m.gerarCredencial((n) => new Uint8Array(crypto.randomBytes(n)));
  for (const informada of [outra, "", credencial.toLowerCase()]) {
    await assert.rejects(
      m.executarAcao(definir(informada, "Senha-Definitiva-2026"), usuario, deps),
      (e) => e.status === 403 && /não confere/.test(e.message),
    );
  }
  assert.equal(estado.contas.pa.app_metadata.senha_provisoria, true);
  assert.ok(!JSON.stringify(logs).includes(credencial));
});

test("primeiro acesso: recusa senha curta ou igual à credencial", async () => {
  const { estado, deps, credencial, usuario } = await contaProvisoria();
  for (const [nova, padrao] of [
    ["curta", /pelo menos 12/],
    ["", /pelo menos 12/],
    [credencial, /não pode ser a credencial/],
  ]) {
    await assert.rejects(
      m.executarAcao(definir(credencial, nova), usuario, deps),
      (e) => e.status === 400 && padrao.test(e.message),
    );
  }
  assert.equal(estado.contas.pa.app_metadata.senha_provisoria, true);
});

test("conta da senha compartilhada anterior (sem credencial individual) não conclui o primeiro acesso", async () => {
  const { estado, deps, usuario } = await contaProvisoria();
  delete estado.credenciais.pa;
  await assert.rejects(
    m.executarAcao(definir("qualquer-senha-antiga", "Senha-Definitiva-2026"), usuario, deps),
    (e) => e.status === 403 && /credencial provisória válida/.test(e.message),
  );
  assert.equal(estado.contas.pa.app_metadata.senha_provisoria, true);
});

// ------------------------------------------------------------------ Correção 2: aprovação

test("conta de Promotoria com senha definitiva: só vincula; senha, marca, datas e sessões preservadas", async () => {
  const contas = {
    pa: {
      id: "pa",
      email: "pa@mppi.mp.br",
      senha: "Senha-Definitiva-2026",
      app_metadata: { senha_provisoria: false, senha_definida_em: "2026-10-01T10:00:00.000Z" },
    },
  };
  const { estado, deps } = ambiente({
    contas,
    situacao: {
      user_id: "pa",
      tem_senha: true,
      provisoria: false,
      credencial_individual: false,
      credencial_expirada: false,
      expira_em: null,
      vinculada_promotoria: true,
    },
  });
  for (let i = 0; i < 3; i++) {
    const r = await m.executarAcao(
      { acao: "ativar", email: "pa@mppi.mp.br", promotoria_id: `pj-${i % 2}` },
      CAOCRIM,
      deps,
    );
    assert.deepEqual(r, { email: "pa@mppi.mp.br", situacao: "senha_preservada" });
  }
  assert.deepEqual(
    estado.contas,
    contas,
    "conta intacta após aprovações repetidas e vínculo adicional",
  );
  assert.deepEqual(estado.credenciais, {});
  assert.deepEqual(estado.sessoes, {});
});

test("conta ainda provisória: aprovar de novo não emite credencial nem altera a validade", async () => {
  const { estado, deps, credencial } = await contaProvisoria();
  const antes = structuredClone({ contas: estado.contas, credenciais: estado.credenciais });
  for (const [expirada, esperado] of [
    [false, "provisoria_preservada"],
    [true, "provisoria_expirada"],
  ]) {
    deps.rpc = async (fn) =>
      fn === "admin_situacao_conta_promotoria"
        ? [
            {
              user_id: "pa",
              tem_senha: true,
              provisoria: true,
              credencial_individual: true,
              credencial_expirada: expirada,
              expira_em: antes.credenciais.pa.expira_em,
              vinculada_promotoria: true,
            },
          ]
        : null;
    const r = await m.executarAcao(
      { acao: "ativar", email: "pa@mppi.mp.br", promotoria_id: "pj-2" },
      CAOCRIM,
      deps,
    );
    assert.equal(r.situacao, esperado);
    assert.equal(r.credencial_provisoria, undefined);
  }
  assert.deepEqual({ contas: estado.contas, credenciais: estado.credenciais }, antes);
  assert.equal(estado.contas.pa.senha, credencial);
});

test("conta provisória da senha compartilhada anterior: aprovar indica redefinição, sem emitir credencial", async () => {
  const { deps, estado } = ambiente({
    contas: {
      pa: {
        id: "pa",
        email: "pa@mppi.mp.br",
        senha: "x",
        app_metadata: { senha_provisoria: true },
      },
    },
    situacao: {
      user_id: "pa",
      tem_senha: true,
      provisoria: true,
      credencial_individual: false,
      credencial_expirada: false,
      expira_em: null,
      vinculada_promotoria: true,
    },
  });
  const r = await m.executarAcao(
    { acao: "ativar", email: "pa@mppi.mp.br", promotoria_id: "p" },
    CAOCRIM,
    deps,
  );
  assert.equal(r.situacao, "provisoria_legada");
  assert.equal(r.credencial_provisoria, undefined);
  assert.equal(estado.contas.pa.senha, "x");
});

test("conta existente com senha fora do cadastro das Promotorias: aprovação recusada (titularidade)", async () => {
  const { deps, estado } = ambiente({
    contas: { ex: { id: "ex", email: "ex@mppi.mp.br", senha: "dele", app_metadata: {} } },
    situacao: {
      user_id: "ex",
      tem_senha: true,
      provisoria: false,
      credencial_individual: false,
      credencial_expirada: false,
      expira_em: null,
      vinculada_promotoria: false,
    },
  });
  await assert.rejects(
    m.executarAcao({ acao: "ativar", email: "ex@mppi.mp.br", promotoria_id: "p" }, CAOCRIM, deps),
    (e) => e.status === 409 && /titularidade/.test(e.message),
  );
  assert.equal(estado.contas.ex.senha, "dele");
  assert.equal(
    estado.rpc.some(([fn]) => fn === "admin_vincular_conta_promotoria"),
    false,
  );
});

test("conta existente sem senha (convite antigo): recebe credencial individual", async () => {
  const { deps, estado } = ambiente({
    contas: { cv: { id: "cv", email: "cv@mppi.mp.br", app_metadata: {} } },
    situacao: {
      user_id: "cv",
      tem_senha: false,
      provisoria: false,
      credencial_individual: false,
      credencial_expirada: false,
      expira_em: null,
      vinculada_promotoria: true,
    },
  });
  const r = await m.executarAcao(
    { acao: "ativar", email: "cv@mppi.mp.br", promotoria_id: "p" },
    CAOCRIM,
    deps,
  );
  assert.equal(r.situacao, "credencial_emitida");
  assert.equal(estado.contas.cv.senha, r.credencial_provisoria);
  assert.equal(estado.contas.cv.app_metadata.senha_provisoria, true);
});

test("redefinir: nova credencial, nova validade, sessões encerradas; a anterior deixa de valer", async () => {
  const { estado, deps, credencial } = await contaProvisoria({ horasDesdeEmissao: 100 });
  estado.agora = new Date(AGORA.getTime() + 10 * HORA);
  const r = await m.executarAcao({ acao: "redefinir", user_id: "pa" }, CAOCRIM, deps);
  assert.equal(r.situacao, "redefinida");
  assert.notEqual(r.credencial_provisoria, credencial);
  assert.equal(r.expira_em, new Date(estado.agora.getTime() + 72 * HORA).toISOString());
  assert.equal(r.sessoes_encerradas, true);
  assert.equal(estado.sessoes.pa, "encerradas");
  assert.equal(estado.contas.pa.senha, r.credencial_provisoria);
  // A credencial anterior não serve mais; a nova sim
  const usuario = { id: "pa", app_metadata: {} };
  await assert.rejects(
    m.executarAcao(definir(credencial, "Senha-Definitiva-2026"), usuario, deps),
    /não confere/,
  );
  await m.executarAcao(definir(r.credencial_provisoria, "Senha-Definitiva-2026"), usuario, deps);
  assert.ok(!JSON.stringify(logs).includes(r.credencial_provisoria));
});

test("redefinir conta definitiva volta a exigir o primeiro acesso", async () => {
  const { estado, deps } = ambiente({
    contas: {
      pa: {
        id: "pa",
        email: "pa@mppi.mp.br",
        senha: "Senha-Definitiva-2026",
        app_metadata: { senha_provisoria: false, senha_definida_em: "2026-10-01T10:00:00.000Z" },
      },
    },
    vinculos: ["pa"],
  });
  await m.executarAcao({ acao: "redefinir", user_id: "pa" }, CAOCRIM, deps);
  assert.equal(estado.contas.pa.app_metadata.senha_provisoria, true);
  assert.equal(estado.contas.pa.app_metadata.senha_definida_em, null);
});

test("sem permissão administrativa: aprovar e redefinir são recusados pelo banco, sem alterar contas", async () => {
  const negado = new m.ErroSolicitacao("Ação restrita ao CAOCRIM.", 403);
  const { estado, deps } = ambiente({
    contas: { pb: { id: "pb", email: "pb@mppi.mp.br", senha: "s", app_metadata: {} } },
  });
  estado.falhas.admin_situacao_conta_promotoria = negado;
  estado.falhas.admin_conferir_conta_promotoria = negado;
  const promotoria = { id: "pa", app_metadata: {} };
  await assert.rejects(
    m.executarAcao({ acao: "ativar", email: "x@mppi.mp.br", promotoria_id: "p" }, promotoria, deps),
    (e) => e.status === 403,
  );
  await assert.rejects(
    m.executarAcao({ acao: "redefinir", user_id: "pb" }, promotoria, deps),
    (e) => e.status === 403,
  );
  assert.equal(estado.contas.pb.senha, "s");
  assert.deepEqual(estado.credenciais, {});
});

// ------------------------------------------------------------------ Correção 3: endpoint restrito

test("primeiro acesso: recusa conta definitiva, do CAOCRIM, sem vínculo ativo ou inexistente", async () => {
  const definitiva = await contaProvisoria();
  definitiva.estado.contas.pa.app_metadata.senha_provisoria = false;
  await assert.rejects(
    m.executarAcao(
      definir(definitiva.credencial, "Senha-Definitiva-2026"),
      definitiva.usuario,
      definitiva.deps,
    ),
    (e) => e.status === 403 && /já possui senha definitiva/.test(e.message),
  );

  const admin = await contaProvisoria({ admin: true });
  await assert.rejects(
    m.executarAcao(definir(admin.credencial, "Senha-Definitiva-2026"), admin.usuario, admin.deps),
    (e) => e.status === 403 && /CAOCRIM/.test(e.message),
  );

  const semVinculo = await contaProvisoria({ vinculo: false });
  await assert.rejects(
    m.executarAcao(
      definir(semVinculo.credencial, "Senha-Definitiva-2026"),
      semVinculo.usuario,
      semVinculo.deps,
    ),
    (e) => e.status === 403 && /vinculada/.test(e.message),
  );

  const { deps } = ambiente();
  await assert.rejects(
    m.executarAcao(definir("x", "Senha-Definitiva-2026"), { id: "fantasma" }, deps),
    (e) => e.status === 404,
  );
});

test("primeiro acesso: não altera a senha de outro usuário", async () => {
  const { estado, deps, credencial, usuario } = await contaProvisoria();
  await assert.rejects(
    m.executarAcao(
      definir(credencial, "Senha-Definitiva-2026", { user_id: "outra-conta" }),
      usuario,
      deps,
    ),
    (e) => e.status === 403 && /própria conta/.test(e.message),
  );
  assert.equal(estado.contas.pa.app_metadata.senha_provisoria, true);
});

test("primeiro acesso: a marca vem do servidor, não do token nem do corpo da solicitação", async () => {
  const { estado, deps, credencial } = await contaProvisoria();
  estado.contas.pa.app_metadata.senha_provisoria = false;
  // Token antigo dizendo "provisória" e corpo tentando forçar a marca: ambos ignorados
  const usuario = { id: "pa", app_metadata: { senha_provisoria: true } };
  await assert.rejects(
    m.executarAcao(
      definir(credencial, "Senha-Definitiva-2026", { senha_provisoria: true }),
      usuario,
      deps,
    ),
    /já possui senha definitiva/,
  );
});

test("falha ao gravar a senha no Auth: a conta continua bloqueada e a credencial continua válida", async () => {
  const { estado, deps, credencial, usuario } = await contaProvisoria();
  estado.falhas.atualizarConta = new m.ErroSolicitacao(
    "Não foi possível atualizar a conta: timeout.",
  );
  await assert.rejects(
    m.executarAcao(definir(credencial, "Senha-Definitiva-2026"), usuario, deps),
    /timeout/,
  );
  assert.equal(estado.contas.pa.senha, credencial);
  assert.equal(estado.contas.pa.app_metadata.senha_provisoria, true);
  assert.ok(estado.credenciais.pa, "o hash continua para nova tentativa");
  // Recuperado o Auth, a mesma credencial conclui o primeiro acesso
  delete estado.falhas.atualizarConta;
  await m.executarAcao(definir(credencial, "Senha-Definitiva-2026"), usuario, deps);
  assert.equal(estado.contas.pa.app_metadata.senha_provisoria, false);
});

test("falhas parciais entre Auth e a tabela de credenciais não liberam a conta", async () => {
  // Redefinição: falha ao gravar o hash, a conta não é alterada
  const a = await contaProvisoria();
  a.estado.falhas.gravarCredencial = new m.ErroSolicitacao("falha na tabela");
  await assert.rejects(
    m.executarAcao({ acao: "redefinir", user_id: "pa" }, CAOCRIM, a.deps),
    /falha na tabela/,
  );
  assert.equal(a.estado.contas.pa.senha, a.credencial);

  // Redefinição: hash novo gravado, mas o Auth falha. A conta segue bloqueada e nem a
  // credencial antiga nem a nova (não entregue) concluem o primeiro acesso
  const b = await contaProvisoria();
  b.estado.falhas.atualizarConta = new m.ErroSolicitacao("auth fora do ar");
  await assert.rejects(
    m.executarAcao({ acao: "redefinir", user_id: "pa" }, CAOCRIM, b.deps),
    /auth fora do ar/,
  );
  delete b.estado.falhas.atualizarConta;
  assert.equal(b.estado.contas.pa.app_metadata.senha_provisoria, true);
  await assert.rejects(
    m.executarAcao(definir(b.credencial, "Senha-Definitiva-2026"), b.usuario, b.deps),
    /não confere/,
  );

  // Conta nova: criada no Auth, mas o hash não foi gravado. A conta existe bloqueada e sem
  // credencial válida; "Redefinir senha" resolve
  const c = ambiente({ situacao: situacaoNova });
  c.estado.falhas.gravarCredencial = new m.ErroSolicitacao("falha na tabela");
  await assert.rejects(
    m.executarAcao({ acao: "ativar", email: "n@mppi.mp.br", promotoria_id: "p" }, CAOCRIM, c.deps),
    /falha na tabela/,
  );
  const [criada] = Object.values(c.estado.contas);
  assert.equal(criada.app_metadata.senha_provisoria, true);
  assert.equal(
    c.estado.rpc.some(([fn]) => fn === "admin_vincular_conta_promotoria"),
    false,
    "sem vínculo",
  );
});

test("ação antiga trocar_senha e ações desconhecidas são recusadas", async () => {
  const { deps, credencial, usuario } = await contaProvisoria();
  await assert.rejects(
    m.executarAcao(
      {
        acao: "trocar_senha",
        nova_senha: "Senha-Definitiva-2026",
        credencial_provisoria: credencial,
      },
      usuario,
      deps,
    ),
    /Ação desconhecida/,
  );
  await assert.rejects(m.executarAcao({ acao: "apagar" }, CAOCRIM, deps), /Ação desconhecida/);
});

// ------------------------------------------------------------------ Código enviado ao navegador

test("nenhuma senha inicial fixa no código, nos arquivos públicos ou na documentação", () => {
  const proibidas = ["feminicidio0"];
  const pastas = ["src", "public", "docs", "supabase", "database"];
  const arquivos = ["README.md", "index.html"];
  const encontrados = [];
  const varrer = (p) => {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const f = path.join(p, e.name);
      if (e.isDirectory()) varrer(f);
      else if (/\.(ts|tsx|js|mjs|json|html|md|sql|css|toml|txt)$/.test(e.name)) {
        const t = fs.readFileSync(f, "utf8").toLowerCase();
        for (const s of proibidas)
          if (t.includes(s)) encontrados.push(`${path.relative(raiz, f)}: ${s}`);
      }
    }
  };
  pastas.forEach((p) => varrer(path.join(raiz, p)));
  for (const a of arquivos) {
    const t = fs.readFileSync(path.join(raiz, a), "utf8").toLowerCase();
    for (const s of proibidas) if (t.includes(s)) encontrados.push(`${a}: ${s}`);
  }
  assert.deepEqual(encontrados, []);
  // O navegador não gera credenciais: a geração existe só na função de borda
  const src = fs
    .readdirSync(path.join(raiz, "src"), { recursive: true })
    .filter((f) => /\.(ts|tsx)$/.test(f));
  for (const f of src) {
    const t = fs.readFileSync(path.join(raiz, "src", f), "utf8");
    assert.ok(!t.includes("gerarCredencial") && !t.includes("getRandomValues"), f);
  }
});
