// Testes das ações da função de borda contas-promotorias (supabase/functions/contas-promotorias/acoes.ts).
// O módulo é transpilado para JavaScript e executado com dublês do banco e da autenticação:
// cada teste confere o que seria gravado na conta e quais funções do banco seriam chamadas.
// Uso: npm run test:diagnostico
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dir = path.join(raiz, "node_modules", ".cache", `contas-${process.pid}`);
let m; // módulo acoes.ts transpilado

const AGORA = new Date("2026-10-26T12:00:00.000Z");
const horasAtras = (h) => new Date(AGORA.getTime() - h * 3600 * 1000).toISOString();

before(async () => {
  const fonte = fs.readFileSync(
    path.join(raiz, "supabase/functions/contas-promotorias/acoes.ts"),
    "utf8",
  );
  fs.mkdirSync(dir, { recursive: true });
  const js = ts.transpileModule(fonte, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  fs.writeFileSync(path.join(dir, "acoes.mjs"), js);
  m = await import(pathToFileURL(path.join(dir, "acoes.mjs")).href);
});

after(() => fs.rmSync(dir, { recursive: true, force: true }));

// Dublê das dependências: respostas do banco por função e registro das chamadas
function dubles(respostasRpc = {}) {
  const chamadas = { rpc: [], criadas: [], atualizadas: [] };
  return {
    chamadas,
    deps: {
      rpc: async (fn, args) => {
        chamadas.rpc.push([fn, args]);
        const r = respostasRpc[fn];
        if (r instanceof Error) throw r;
        return typeof r === "function" ? r(args) : r;
      },
      criarConta: async (email, senha, appMetadata) => {
        chamadas.criadas.push({ email, senha, appMetadata });
        return "nova-conta";
      },
      atualizarConta: async (userId, dados) => {
        chamadas.atualizadas.push({ userId, ...dados });
      },
      agora: () => AGORA,
    },
  };
}

const CAOCRIM = { id: "caocrim", app_metadata: {} };

test("ativar: cria a conta nova com a senha provisória e a data, e vincula", async () => {
  const { deps, chamadas } = dubles({
    admin_preparar_conta_promotoria: [{ user_id: null, manter_senha: false }],
  });
  const r = await m.executarAcao(
    { acao: "ativar", email: " PJ.X@mppi.mp.br ", promotoria_id: "pj-x" },
    CAOCRIM,
    deps,
  );
  assert.deepEqual(r, {
    email: "pj.x@mppi.mp.br",
    senha_provisoria: m.SENHA_PROVISORIA,
    conta_existente: false,
    senha_mantida: false,
  });
  assert.deepEqual(chamadas.criadas, [
    {
      email: "pj.x@mppi.mp.br",
      senha: m.SENHA_PROVISORIA,
      appMetadata: { senha_provisoria: true, senha_provisoria_em: AGORA.toISOString() },
    },
  ]);
  assert.deepEqual(chamadas.rpc.at(-1), [
    "admin_vincular_conta_promotoria",
    { p_user_id: "nova-conta", p_promotoria_id: "pj-x" },
  ]);
});

test("ativar: conta de Promotoria com senha definitiva só é vinculada, sem trocar a senha", async () => {
  const { deps, chamadas } = dubles({
    admin_preparar_conta_promotoria: [{ user_id: "conta-a", manter_senha: true }],
  });
  const r = await m.executarAcao(
    { acao: "ativar", email: "pj.a@mppi.mp.br", promotoria_id: "pj-b" },
    CAOCRIM,
    deps,
  );
  assert.deepEqual(r, { email: "pj.a@mppi.mp.br", conta_existente: true, senha_mantida: true });
  assert.equal(r.senha_provisoria, undefined);
  assert.deepEqual(chamadas.atualizadas, []);
  assert.deepEqual(chamadas.criadas, []);
  assert.deepEqual(chamadas.rpc.at(-1), [
    "admin_vincular_conta_promotoria",
    { p_user_id: "conta-a", p_promotoria_id: "pj-b" },
  ]);
});

test("ativar: conta existente sem senha definitiva volta à senha provisória", async () => {
  const { deps, chamadas } = dubles({
    admin_preparar_conta_promotoria: [{ user_id: "conta-c", manter_senha: false }],
  });
  const r = await m.executarAcao(
    { acao: "ativar", email: "pj.c@mppi.mp.br", promotoria_id: "pj-c" },
    CAOCRIM,
    deps,
  );
  assert.equal(r.conta_existente, true);
  assert.equal(r.senha_mantida, false);
  assert.deepEqual(chamadas.atualizadas, [
    {
      userId: "conta-c",
      password: m.SENHA_PROVISORIA,
      email_confirm: true,
      app_metadata: {
        senha_provisoria: true,
        senha_provisoria_em: AGORA.toISOString(),
        senha_definida_em: null,
      },
    },
  ]);
});

test("ativar e redefinir: recusa do banco (não é CAOCRIM) impede qualquer alteração de conta", async () => {
  const negado = new m.ErroSolicitacao("Ação restrita ao CAOCRIM.", 403);
  const { deps, chamadas } = dubles({
    admin_preparar_conta_promotoria: negado,
    admin_conferir_conta_promotoria: negado,
  });
  const promotoria = { id: "conta-a", app_metadata: {} };
  await assert.rejects(
    m.executarAcao({ acao: "ativar", email: "x@mppi.mp.br", promotoria_id: "p" }, promotoria, deps),
    (e) => e.status === 403,
  );
  await assert.rejects(
    m.executarAcao({ acao: "redefinir", user_id: "conta-b" }, promotoria, deps),
    (e) => e.status === 403,
  );
  assert.deepEqual(chamadas.criadas, []);
  assert.deepEqual(chamadas.atualizadas, []);
});

test("redefinir: volta à senha provisória com nova data e apaga a data da senha definitiva", async () => {
  const { deps, chamadas } = dubles({ admin_conferir_conta_promotoria: "pj.a@mppi.mp.br" });
  const r = await m.executarAcao({ acao: "redefinir", user_id: "conta-a" }, CAOCRIM, deps);
  assert.deepEqual(r, { email: "pj.a@mppi.mp.br", senha_provisoria: m.SENHA_PROVISORIA });
  assert.deepEqual(chamadas.atualizadas, [
    {
      userId: "conta-a",
      password: m.SENHA_PROVISORIA,
      app_metadata: {
        senha_provisoria: true,
        senha_provisoria_em: AGORA.toISOString(),
        senha_definida_em: null,
      },
    },
  ]);
});

const provisoria = (h) => ({
  id: "conta-a",
  app_metadata: { senha_provisoria: true, senha_provisoria_em: horasAtras(h) },
});

test("trocar_senha: dentro do prazo, grava a nova senha e a data, e retira a marca", async () => {
  const { deps, chamadas } = dubles();
  const r = await m.executarAcao(
    { acao: "trocar_senha", nova_senha: "Senha-Definitiva-2026" },
    provisoria(1),
    deps,
  );
  assert.deepEqual(r, { ok: true });
  assert.deepEqual(chamadas.atualizadas, [
    {
      userId: "conta-a",
      password: "Senha-Definitiva-2026",
      app_metadata: {
        senha_provisoria: false,
        senha_provisoria_em: null,
        senha_definida_em: AGORA.toISOString(),
      },
    },
  ]);
});

test("trocar_senha: recusa conta sem a marca provisória, inclusive do CAOCRIM", async () => {
  for (const usuario of [
    CAOCRIM,
    { id: "conta-a", app_metadata: { senha_provisoria: false } },
    { id: "conta-a" },
  ]) {
    const { deps, chamadas } = dubles();
    await assert.rejects(
      m.executarAcao({ acao: "trocar_senha", nova_senha: "Senha-Definitiva-2026" }, usuario, deps),
      (e) => e.status === 403 && /não está com a senha provisória/.test(e.message),
    );
    assert.deepEqual(chamadas.atualizadas, []);
  }
});

test("trocar_senha: senha provisória expirada ou sem data exige nova redefinição", async () => {
  const semData = { id: "conta-a", app_metadata: { senha_provisoria: true } };
  for (const usuario of [provisoria(m.VALIDADE_PROVISORIA_HORAS + 1), semData]) {
    const { deps, chamadas } = dubles();
    await assert.rejects(
      m.executarAcao({ acao: "trocar_senha", nova_senha: "Senha-Definitiva-2026" }, usuario, deps),
      (e) => e.status === 403 && /expirou/.test(e.message),
    );
    assert.deepEqual(chamadas.atualizadas, []);
  }
  // No limite do prazo ainda vale
  const { deps } = dubles();
  await m.executarAcao(
    { acao: "trocar_senha", nova_senha: "Senha-Definitiva-2026" },
    provisoria(m.VALIDADE_PROVISORIA_HORAS),
    deps,
  );
});

test("trocar_senha: recusa senha curta ou igual à provisória", async () => {
  for (const [nova, padrao] of [
    ["curta", /pelo menos 10/],
    ["", /pelo menos 10/],
    [` ${m.SENHA_PROVISORIA.toUpperCase()} `, /não pode ser a senha provisória/],
  ]) {
    const { deps, chamadas } = dubles();
    await assert.rejects(
      m.executarAcao({ acao: "trocar_senha", nova_senha: nova }, provisoria(1), deps),
      (e) => e.status === 400 && padrao.test(e.message),
    );
    assert.deepEqual(chamadas.atualizadas, []);
  }
});

test("ação desconhecida é recusada", async () => {
  const { deps } = dubles();
  await assert.rejects(m.executarAcao({ acao: "apagar" }, CAOCRIM, deps), /Ação desconhecida/);
});
