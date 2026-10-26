// Testes das regras usadas pelas telas: ordenação de nomes, política de senha, destino após
// o acesso e etapa em que um diagnóstico salvo reabre. Os módulos TypeScript são transpilados
// para JavaScript e executados como estão no projeto.
// Uso: npm run test:diagnostico
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dir = path.join(raiz, "node_modules", ".cache", `regras-${process.pid}`);
let ordenacao, senha, rotas, completude;

function transpilar(arquivo, destino, trocas = []) {
  let fonte = fs.readFileSync(path.join(raiz, arquivo), "utf8");
  for (const [de, para] of trocas) fonte = fonte.replace(de, para);
  const js = ts.transpileModule(fonte, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  fs.writeFileSync(path.join(dir, destino), js);
  return pathToFileURL(path.join(dir, destino)).href;
}

before(async () => {
  fs.mkdirSync(dir, { recursive: true });
  ordenacao = await import(transpilar("src/lib/ordenacao.ts", "ordenacao.mjs"));
  senha = await import(transpilar("supabase/functions/_shared/politica-senha.ts", "senha.mjs"));
  rotas = await import(transpilar("src/lib/rotas-diagnostico.ts", "rotas.mjs"));
  transpilar("src/lib/dicionario-diagnostico.ts", "dicionario.mjs");
  completude = await import(
    transpilar("src/lib/completude-diagnostico.ts", "completude.mjs", [
      ['from "./dicionario-diagnostico"', 'from "./dicionario.mjs"'],
    ])
  );
});

after(() => fs.rmSync(dir, { recursive: true, force: true }));

// ------------------------------------------------------------------ 1. ordenação

test("ordenação: português do Brasil, sem distinguir acentos nem maiúsculas", () => {
  const esperado = [
    "Acauã",
    "Agricolândia",
    "Água Branca",
    "Alagoinha do Piauí",
    "Alegrete do Piauí",
    "Altos",
    "Anísio de Abreu",
    "São Pedro do Piauí",
    "Teresina",
  ];
  const embaralhado = [
    "Teresina",
    "Água Branca",
    "altos",
    "São Pedro do Piauí",
    "Anísio de Abreu",
    "Alegrete do Piauí",
    "Acauã",
    "Alagoinha do Piauí",
    "Agricolândia",
  ].map((n) => (n === "altos" ? "Altos" : n));
  const lista = embaralhado.map((municipio, i) => ({
    municipio,
    codigo_ibge: String(2200000 + i),
  }));
  const ordenada = ordenacao.ordenarPorTexto(lista, (m) => m.municipio);
  assert.deepEqual(
    ordenada.map((m) => m.municipio),
    esperado,
  );
  assert.ok(
    ordenada.findIndex((m) => m.municipio === "Água Branca") <
      ordenada.findIndex((m) => m.municipio === "Alagoinha do Piauí"),
  );
  // Nomes e códigos preservados; lista original intacta
  assert.equal(ordenada.find((m) => m.municipio === "Água Branca").codigo_ibge, "2200001");
  assert.equal(lista[0].municipio, "Teresina");
  // Comparação usada em tabelas com ordem descendente
  assert.ok(ordenacao.compararTexto("Água Branca", "Teresina") < 0);
  assert.ok(ordenacao.compararTexto("teresina", "Água Branca") > 0);
  assert.equal(ordenacao.compararTexto("ALTOS", "altos"), 0);
  assert.equal(ordenacao.compararTexto(null, ""), 0);
  // A comparação por código (< e >) colocava os nomes acentuados depois do Z
  assert.equal([..."Teresina|Água Branca".split("|")].sort()[1], "Água Branca");
});

test("ordenação: numerais das Promotorias em ordem natural", () => {
  const nomes = [
    "10ª Promotoria de Justiça",
    "2ª Promotoria de Justiça",
    "1ª Promotoria de Justiça",
  ];
  assert.deepEqual([...nomes].sort(ordenacao.compararTexto), [
    "1ª Promotoria de Justiça",
    "2ª Promotoria de Justiça",
    "10ª Promotoria de Justiça",
  ]);
});

// ------------------------------------------------------------------ 2. senha

test("senha: mínimo de 8 caracteres, regra única", () => {
  assert.equal(senha.TAMANHO_MINIMO_SENHA, 8);
  assert.match(senha.validarNovaSenha("Abc-123"), /pelo menos 8/);
  assert.match(senha.validarNovaSenha(""), /pelo menos 8/);
  for (const ok of [
    "Abc-1234",
    "Abc-12345",
    "Abc-123456",
    "Abc-1234567",
    "Abc-12345678",
    "Senha-Definitiva-2026",
  ]) {
    assert.equal(senha.validarNovaSenha(ok, ok), null, ok);
  }
});

test("senha: confirmação diferente é recusada; espaços contam e não são cortados", () => {
  assert.match(senha.validarNovaSenha("Abc-1234", "Abc-1235"), /confirmação não confere/);
  assert.match(senha.validarNovaSenha("Abc-1234", "Abc-1234 "), /confirmação não confere/);
  assert.equal(senha.validarNovaSenha(" 1234567", " 1234567"), null, "8 com o espaço inicial");
  assert.match(senha.validarNovaSenha("1234567 ".trim()), /pelo menos 8/);
});

test("senha: tela e servidor usam a mesma regra e não há outro mínimo no código", () => {
  const tela = fs.readFileSync(
    path.join(raiz, "src/components/diagnostico/AcessoDiagnostico.tsx"),
    "utf8",
  );
  const servidor = fs.readFileSync(
    path.join(raiz, "supabase/functions/contas-promotorias/acoes.ts"),
    "utf8",
  );
  assert.ok(tela.includes("validarNovaSenha(senha, confirmacao)"));
  assert.ok(tela.includes("minLength={TAMANHO_MINIMO_SENHA}"));
  assert.ok(servidor.includes('from "../_shared/politica-senha.ts"'));
  for (const t of [tela, servidor]) {
    assert.doesNotMatch(t, /length\s*<\s*(10|12)\b/);
    assert.doesNotMatch(t, /pelo menos 1[02]/);
  }
});

// ------------------------------------------------------------------ 3. destino após o acesso

test("destino: Promotoria nunca fica em página exclusiva do CAOCRIM", () => {
  const { destinoAutorizado, ROTA_INICIAL_DIAGNOSTICO: inicio } = rotas;
  assert.equal(inicio, "/diagnostico-brigid");
  for (const p of [
    "/diagnostico-brigid/administracao",
    "/diagnostico-brigid/revisao",
    "/diagnostico-brigid/revisao/DGN-1",
  ]) {
    assert.equal(destinoAutorizado(p, false), inicio, p);
    assert.equal(destinoAutorizado(p, true), p, `CAOCRIM mantém ${p}`);
  }
  for (const p of [
    "/diagnostico-brigid",
    "/diagnostico-brigid/meus-diagnosticos",
    "/diagnostico-brigid/formulario/DGN-1",
    "/diagnostico-brigid/novo",
  ]) {
    assert.equal(destinoAutorizado(p, false), p, p);
  }
});

test("destino: endereço externo, fora do módulo ou vazio volta à página inicial do módulo", () => {
  const { destinoAutorizado } = rotas;
  for (const p of [
    "//evil.example",
    "https://evil.example/diagnostico-brigid",
    "/pesos",
    "",
    null,
    "/diagnostico-brigid//evil",
    "/diagnostico-brigidx",
  ]) {
    assert.equal(destinoAutorizado(p, false), "/diagnostico-brigid", String(p));
  }
});

// ------------------------------------------------------------------ 4. retomada

test("retomada: reabre na última etapa aplicável ou na primeira com pendência", () => {
  const { etapaInicial } = completude;
  const civel = {
    promotoria_id: "PRM-001",
    codigo_ibge: "2200053",
    atribuicao: ["civel"],
    periodo_referencia: "2026",
  };
  const secoesCivel = completude.secoesAplicaveis(["civel"]);
  const secoesCriminal = completude.secoesAplicaveis(["criminal"]);
  // Sem etapa registrada: primeira etapa com pendência obrigatória
  const sem = etapaInicial({}, civel, null);
  assert.ok(secoesCivel.includes(sem));
  const { pendencias } = completude.calcularCompletude({}, civel);
  assert.equal(
    sem,
    secoesCivel.find((s) => pendencias.some((p) => p.secao === s)),
  );
  // Etapa registrada e aplicável: reabre nela
  const ultima = secoesCivel.at(-1);
  assert.equal(etapaInicial({}, civel, ultima), ultima);
  // Etapa registrada que não se aplica à atribuição atual: ignorada
  const soCriminal = secoesCriminal.find((s) => !secoesCivel.includes(s));
  assert.ok(soCriminal);
  assert.equal(etapaInicial({}, civel, soCriminal), sem);
  assert.equal(etapaInicial({}, civel, "etapa-inexistente"), sem);
});

test("retomada: Meus Diagnósticos oferece 'Continuar preenchimento' no mesmo diagnóstico", () => {
  const lista = fs.readFileSync(
    path.join(raiz, "src/routes/diagnostico-brigid/meus-diagnosticos.tsx"),
    "utf8",
  );
  assert.ok(lista.includes("Continuar preenchimento"));
  assert.ok(lista.includes('to="/diagnostico-brigid/formulario/$diagnosticoId"'));
  assert.ok(lista.includes("params={{ diagnosticoId: dgn.id }}"));
  const formulario = fs.readFileSync(
    path.join(raiz, "src/components/diagnostico/FormularioDiagnostico.tsx"),
    "utf8",
  );
  // Salvar um diagnóstico aberto usa o ID dele (não cria outro)
  assert.ok(formulario.includes("let id = diag?.id;"));
  assert.ok(formulario.includes("await carregarDiagnostico(diagnosticoId, true);"));
});
