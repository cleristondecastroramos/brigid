// Gera as regras de completude (tabela diagnostico_campos_regras) a partir de
// src/lib/dicionario-diagnostico.ts e as grava entre os marcadores da migration.
// Uso: npm run gerar:regras
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MIGRATION = path.join(raiz, "database", "migrations", "05_fluxo_diagnostico.sql");
const INICIO = "-- >>> REGRAS GERADAS (scripts/diagnostico/gerar-regras-diagnostico.mjs) >>>";
const FIM = "-- <<< REGRAS GERADAS <<<";

export async function carregarDicionario() {
  const fonte = fs.readFileSync(path.join(raiz, "src/lib/dicionario-diagnostico.ts"), "utf8");
  const js = ts.transpileModule(fonte, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const tmp = path.join(raiz, "node_modules", ".cache", `dicionario-${process.pid}.mjs`);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, js);
  try {
    return await import(pathToFileURL(tmp).href);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

const q = (v) => (v === undefined || v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const arr = (a) => (a ? `ARRAY[${a.map(q).join(", ")}]::text[]` : "NULL");

export function gerarSql(dicionario) {
  const linhas = dicionario.map((c, i) => {
    const cond = c.condicao ?? {};
    return `  (${q(c.codigo_tecnico)}, ${q(c.secao)}, ${q(c.tipo_controle)}, ${c.obrigatorio ? "true" : "false"}, ${q(cond.campo)}, ${arr(cond.valores)}, ${cond.maiorQue ?? "NULL"}, ${q(c.rotulo)}, ${i + 1})`;
  });
  return [
    INICIO,
    "DELETE FROM public.diagnostico_campos_regras;",
    "INSERT INTO public.diagnostico_campos_regras",
    "  (codigo, secao, tipo_controle, obrigatorio, cond_campo, cond_valores, cond_maior_que, rotulo, ordem)",
    "VALUES",
    linhas.join(",\n") + ";",
    FIM,
  ].join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { dicionarioDiagnostico } = await carregarDicionario();
  const sql = fs.readFileSync(MIGRATION, "utf8");
  const ini = sql.indexOf(INICIO);
  const fim = sql.indexOf(FIM);
  if (ini < 0 || fim < 0) throw new Error("Marcadores de regras não encontrados na migration.");
  const novo = sql.slice(0, ini) + gerarSql(dicionarioDiagnostico) + sql.slice(fim + FIM.length);
  fs.writeFileSync(MIGRATION, novo);
  console.log(
    `${dicionarioDiagnostico.length} regras gravadas em ${path.relative(raiz, MIGRATION)}`,
  );
}
