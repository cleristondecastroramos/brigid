// Testes do fluxo de revisão, validação e publicação do Diagnóstico BRIGID.
// Executa os scripts SQL reais do projeto em um Postgres embutido (PGlite), simulando
// os papéis do Supabase (anon/authenticated) e auth.uid(), com RLS ativo.
// Uso: npm run test:diagnostico
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { carregarDicionario } from "../gerar-regras-diagnostico.mjs";
import ts from "typescript";
import { pathToFileURL } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const sql = (f) => fs.readFileSync(path.join(raiz, f), "utf8");

const ADMIN = "00000000-0000-0000-0000-00000000000a";
const PROMOTOR_A = "00000000-0000-0000-0000-0000000000a1";
const PROMOTOR_B = "00000000-0000-0000-0000-0000000000b1";
const INTRUSO = "00000000-0000-0000-0000-0000000000ff";

let db;
let ctx; // dados escolhidos da base real (município com duas Promotorias)

async function como(uid) {
  await db.exec("RESET ROLE");
  if (uid === "anon") {
    await db.query("SELECT set_config('request.jwt.claim.sub', '', false)");
    await db.exec("SET ROLE anon");
  } else if (uid === "super") {
    await db.query("SELECT set_config('request.jwt.claim.sub', '', false)");
  } else {
    await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [uid]);
    await db.exec("SET ROLE authenticated");
  }
}

async function q(uid, texto, params = []) {
  await como(uid);
  try {
    return (await db.query(texto, params)).rows;
  } finally {
    await como("super");
  }
}

async function falha(uid, texto, params, padrao) {
  await assert.rejects(() => q(uid, texto, params), padrao);
}

async function rpc(uid, fn, ...args) {
  const ph = args.map((_, i) => `$${i + 1}`).join(", ");
  const rows = await q(uid, `SELECT public.${fn}(${ph}) AS r`, args);
  return rows[0].r;
}

async function retratoPublico() {
  return q(
    "super",
    `SELECT (SELECT jsonb_agg(to_jsonb(m) ORDER BY codigo_ibge) FROM public.municipios m) AS municipios,
            (SELECT jsonb_agg(to_jsonb(p) ORDER BY id) FROM public.municipio_dados_publicados p) AS publicados,
            (SELECT jsonb_agg(to_jsonb(e) - 'id' - 'updated_at' ORDER BY municipio_id, ano_fato, tipo_evento, origem_dado)
               FROM public.eventos_feminicidio e) AS eventos`,
  );
}

// Respostas completas para os blocos cíveis ou criminais
function respostasCompletas({
  civel = false,
  criminal = false,
  opm = "funcionamento_regular",
  ano = "2026",
} = {}) {
  const transversal = (p) => ({
    [`${p}_FONTE`]: "oficio",
    [`${p}_CONFIABILIDADE`]: "documento",
    [`${p}_DATA_REF`]: "2026-03-10",
    [`${p}_OBSERVACOES`]: "Observação interna que não pode ser publicada",
  });
  let r = { DGN_SITUACAO: "primeiro", ...transversal("IDEN") };
  if (civel) {
    r = {
      ...r,
      CID_OPM_STATUS: opm,
      CID_OPM_RESPONSAVEL: "Maria da Silva (86) 99999-0000",
      CID_OPM_CAPACIDADE: "parcialmente",
      CID_CREAS_STATUS: "funcionamento_parcial",
      CID_POL_EXISTE: "isoladas",
      ...transversal("CID"),
      FLX_FORMAL: "formal_ato",
      FLX_PROTOCOLO: "desatualizado",
      FLX_SALA: "adequado",
      FLX_RECURSOS: "Equipe reduzida",
      FLX_PSICO: "eventual",
      ...transversal("FLX"),
      SOC_PROTOCOLO: "vigente",
      SOC_FLUXO: "informal",
      SOC_ARTIC_CREAS: "formal_regular",
      SOC_EQUIPE: "nao_aplica",
      SOC_CAPACITA_QTD: 0,
      ...transversal("SOC"),
    };
  }
  if (criminal) {
    r = {
      ...r,
      SEG_PROTO_INV: "sim_aplicado",
      SEG_PROTO_PER: "nao_sabe",
      SEG_PROTO_PER_JUSTIFICATIVA: "Delegacia não respondeu ao ofício",
      SEG_CAPACITA: "sim_recent",
      SEG_ADERENCIA: "parcialmente",
      ...transversal("SEG"),
      VIO_ANO: ano,
      VIO_TENTADOS: 2,
      VIO_TENTADOS_DETALHES: "Vítima identificada — dado sensível",
      VIO_CONSUMADOS: 0,
      ...transversal("VIO"),
      GAR_LISTA: ["demora_pericial", "ausencia_opm"],
      GAR_DETALHES: "Texto interno",
      ...transversal("GAR"),
    };
  }
  return r;
}

before(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id UUID PRIMARY KEY, email TEXT);
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS
      $$ SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
    CREATE SCHEMA extensions;
    CREATE FUNCTION extensions.uuid_generate_v4() RETURNS UUID LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
    GRANT USAGE ON SCHEMA public, extensions TO anon, authenticated;
    GRANT EXECUTE ON FUNCTION extensions.uuid_generate_v4() TO anon, authenticated;
    -- Como no Supabase: privilégios amplos nas tabelas, contidos pelo RLS
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
  `);
  await db.exec(sql("schema_e_seed.sql"));
  await db.exec("ALTER TABLE public.municipios ADD CONSTRAINT municipios_id_key UNIQUE (id)");
  for (const f of [
    "atualizar_diagnostico.sql",
    "atualizar_protocolos.sql",
    "atualizar_assistencia.sql",
    "atualizar_capacitacoes.sql",
    "atualizar_gargalos.sql",
    "migration_eventos_risco.sql",
    "migrations/migration_promotorias.sql",
    "migrations/migration_diagnostico.sql",
    "migrations/migration_rls_admin.sql",
    "migrations/migration_fluxo_diagnostico.sql",
  ]) {
    await db.exec(sql(f));
  }

  await db.query(
    `INSERT INTO auth.users (id, email) VALUES ($1,'caocrim@mppi.mp.br'),($2,'promotor.a@mppi.mp.br'),($3,'promotor.b@mppi.mp.br'),($4,'intruso@mppi.mp.br')`,
    [ADMIN, PROMOTOR_A, PROMOTOR_B, INTRUSO],
  );
  await db.query("INSERT INTO public.admin_users (user_id) VALUES ($1)", [ADMIN]);

  // Município atendido por duas Promotorias (blocos complementares)
  const [m] = (
    await db.query(`
      SELECT codigo_ibge, array_agg(promotoria_id ORDER BY promotoria_id) AS ps
      FROM public.promotoria_municipios GROUP BY codigo_ibge HAVING count(*) >= 2
      ORDER BY codigo_ibge LIMIT 1`)
  ).rows;
  ctx = { ibge: m.codigo_ibge, pA: m.ps[0], pB: m.ps[1] };
  await db.query("UPDATE public.promotorias_justica SET tipo_atribuicao = 'civel' WHERE id = $1", [
    ctx.pA,
  ]);
  await db.query(
    "UPDATE public.promotorias_justica SET tipo_atribuicao = 'criminal' WHERE id = $1",
    [ctx.pB],
  );

  // Vínculos criados pela função administrativa
  await rpc(ADMIN, "admin_vincular_usuario", "promotor.a@mppi.mp.br", ctx.pA, "Promotor A");
  await rpc(ADMIN, "admin_vincular_usuario", "promotor.b@mppi.mp.br", ctx.pB, "Promotor B");
});

test("vínculo: só o CAOCRIM vincula usuários, e o vínculo limita a Promotoria", async () => {
  await falha(
    PROMOTOR_A,
    "SELECT public.admin_vincular_usuario('intruso@mppi.mp.br', $1, 'X')",
    [ctx.pA],
    /restrita ao CAOCRIM/,
  );
  await falha(
    INTRUSO,
    "SELECT public.diagnostico_criar($1, $2, '2026')",
    [ctx.pA, ctx.ibge],
    /não vinculado/,
  );
  await falha(
    PROMOTOR_A,
    "SELECT public.diagnostico_criar($1, $2, '2026')",
    [ctx.pB, ctx.ibge],
    /não vinculado/,
  );
  await falha(
    PROMOTOR_A,
    "INSERT INTO public.usuarios_promotoria (user_id, promotoria_id, nome_responsavel) VALUES ($1, $2, 'x')",
    [PROMOTOR_A, ctx.pB],
    /row-level security/,
  );
  const vinc = await q(PROMOTOR_A, "SELECT * FROM public.meus_vinculos()");
  assert.deepEqual(
    vinc.map((v) => v.promotoria_id),
    [ctx.pA],
  );
});

test("ciclo completo: rascunho, 100%, envio e devolução não alteram a base pública", async () => {
  const antes = await retratoPublico();

  const id = await rpc(PROMOTOR_A, "diagnostico_criar", ctx.pA, ctx.ibge, "2026", null);
  ctx.diagA = id;
  await falha(
    PROMOTOR_A,
    "SELECT public.diagnostico_criar($1, $2, '2026')",
    [ctx.pA, ctx.ibge],
    /DIAGNOSTICO_EXISTENTE/,
  );

  // Rascunho parcial
  const parcial = await rpc(
    PROMOTOR_A,
    "diagnostico_salvar_rascunho",
    id,
    JSON.stringify({ DGN_SITUACAO: "primeiro" }),
    null,
  );
  assert.ok(parcial.percentual < 100);
  await falha(PROMOTOR_A, "SELECT public.diagnostico_enviar($1)", [id], /pendência/);
  assert.deepEqual(await retratoPublico(), antes, "rascunho parcial alterou a base pública");

  // Visitante anônimo e outro Promotor não leem a coleta
  assert.equal((await q("anon", "SELECT * FROM public.diagnostico_brigid")).length, 0);
  assert.equal((await q("anon", "SELECT * FROM public.diagnostico_versoes")).length, 0);
  assert.equal(
    (
      await q(PROMOTOR_B, "SELECT * FROM public.diagnostico_versoes WHERE diagnostico_id = $1", [
        id,
      ])
    ).length,
    0,
  );
  await falha(
    PROMOTOR_B,
    "SELECT public.diagnostico_salvar_rascunho($1, '{}'::jsonb)",
    [id],
    /não vinculado/,
  );

  // 100% preenchido, sem aprovação
  const completo = await rpc(
    PROMOTOR_A,
    "diagnostico_salvar_rascunho",
    id,
    JSON.stringify(respostasCompletas({ civel: true })),
    null,
  );
  assert.equal(completo.percentual, 100, JSON.stringify(completo.pendencias));
  assert.deepEqual(await retratoPublico(), antes, "diagnóstico 100% sem aprovação alterou a base");

  // Enviado para análise
  await rpc(PROMOTOR_A, "diagnostico_enviar", id);
  assert.deepEqual(await retratoPublico(), antes, "diagnóstico enviado alterou a base");
  await falha(
    PROMOTOR_A,
    "SELECT public.diagnostico_salvar_rascunho($1, '{}'::jsonb)",
    [id],
    /não pode ser editada/,
  );

  // CAOCRIM revisa todas as respostas
  const [vAdmin] = await q(
    ADMIN,
    "SELECT respostas FROM public.diagnostico_versoes WHERE diagnostico_id = $1",
    [id],
  );
  assert.equal(vAdmin.respostas.CID_OPM_STATUS, "funcionamento_regular");
  assert.equal(vAdmin.respostas.CID_OPM_RESPONSAVEL, "Maria da Silva (86) 99999-0000");

  // Devolução para correção
  await rpc(ADMIN, "diagnostico_iniciar_analise", id);
  await rpc(
    ADMIN,
    "diagnostico_registrar_observacao",
    id,
    1,
    "cidadania",
    "CID_POL_EXISTE",
    "Nota interna do CAOCRIM",
  );
  await rpc(
    ADMIN,
    "diagnostico_devolver",
    id,
    1,
    "Revisar existência de políticas",
    JSON.stringify([
      { secao: "cidadania", campo_codigo: "CID_POL_EXISTE", texto: "Informar ato normativo" },
    ]),
  );
  assert.deepEqual(await retratoPublico(), antes, "devolução alterou a base");

  const obs = await q(
    PROMOTOR_A,
    "SELECT tipo, campo_codigo, texto FROM public.diagnostico_observacoes WHERE diagnostico_id = $1 ORDER BY id",
    [id],
  );
  assert.deepEqual(
    obs.map((o) => o.tipo),
    ["devolucao", "devolucao"],
    "Promotor viu observação interna",
  );
  assert.ok(obs.some((o) => o.campo_codigo === "CID_POL_EXISTE"));
});

test("somente o CAOCRIM publica, inclusive por chamada direta à API", async () => {
  const id = ctx.diagA;
  await rpc(
    PROMOTOR_A,
    "diagnostico_salvar_rascunho",
    id,
    JSON.stringify({
      ...respostasCompletas({ civel: true }),
      CID_POL_EXISTE: "parcialmente",
      CID_POL_DETALHES: "Lei 123/2025",
    }),
    null,
  );
  await rpc(PROMOTOR_A, "diagnostico_enviar", id);
  await rpc(ADMIN, "diagnostico_iniciar_analise", id);
  const [{ hash_conteudo: hash }] = await q(
    ADMIN,
    "SELECT hash_conteudo FROM public.diagnostico_versoes WHERE diagnostico_id = $1 AND numero = 1",
    [id],
  );

  await falha(
    PROMOTOR_A,
    "SELECT public.diagnostico_validar_e_publicar($1, 1, $2)",
    [id, hash],
    /restrita ao CAOCRIM/,
  );
  await falha(
    PROMOTOR_A,
    "SELECT public.diagnostico_publicar($1, 1, $2)",
    [id, hash],
    /restrita ao CAOCRIM/,
  );
  await falha(
    PROMOTOR_A,
    "SELECT public._diagnostico_aplicar_publicacao($1, 1, '{}')",
    [id],
    /permission denied/,
  );
  await falha(
    PROMOTOR_A,
    "SELECT public.diagnostico_previa_publicacao($1, 1)",
    [id],
    /restrita ao CAOCRIM/,
  );
  await falha("anon", "SELECT public.diagnostico_enviar($1)", [id], /permission denied/);

  // Escrita direta nas tabelas é bloqueada pelo RLS
  const upd = await q(
    PROMOTOR_A,
    "UPDATE public.diagnostico_versoes SET status = 'publicado' WHERE diagnostico_id = $1 RETURNING id",
    [id],
  );
  assert.equal(upd.length, 0);
  const updMun = await q(
    PROMOTOR_A,
    "UPDATE public.municipios SET opm_possui = 'SIM' WHERE codigo_ibge = $1 RETURNING codigo_ibge",
    [ctx.ibge],
  );
  assert.equal(updMun.length, 0);
  await falha(
    PROMOTOR_A,
    "INSERT INTO public.municipio_dados_publicados (codigo_ibge, campo_destino, periodo_referencia, codigo_dicionario, carater, promotoria_id, diagnostico_id, versao, publicacao_id) VALUES ($1,'opm_possui','2026','x','preliminar','x','x',1,1)",
    [ctx.ibge],
    /row-level security/,
  );
  // Admin também não escreve direto: precisa passar pela função auditada
  const updAdmin = await q(
    ADMIN,
    "UPDATE public.diagnostico_versoes SET status = 'publicado' WHERE diagnostico_id = $1 RETURNING id",
    [id],
  );
  assert.equal(updAdmin.length, 0);
});

test("validação exige a versão revisada e diagnóstico completo", async () => {
  const id = ctx.diagA;
  await falha(
    ADMIN,
    "SELECT public.diagnostico_validar_e_publicar($1, 1, 'hash-diferente')",
    [id],
    /mudou desde a revisão/,
  );

  // Diagnóstico incompleto forçado para "em análise" não pode ser validado
  const idInc = await rpc(PROMOTOR_B, "diagnostico_criar", ctx.pB, ctx.ibge, "2025", null);
  await rpc(
    PROMOTOR_B,
    "diagnostico_salvar_rascunho",
    idInc,
    JSON.stringify({ DGN_SITUACAO: "primeiro" }),
    null,
  );
  await q(
    "super",
    "UPDATE public.diagnostico_versoes SET status = 'em_analise' WHERE diagnostico_id = $1",
    [idInc],
  );
  const [{ hash_conteudo }] = await q(
    ADMIN,
    "SELECT hash_conteudo FROM public.diagnostico_versoes WHERE diagnostico_id = $1",
    [idInc],
  );
  await falha(
    ADMIN,
    "SELECT public.diagnostico_validar_e_publicar($1, 1, $2)",
    [idInc, hash_conteudo],
    /incompleto/,
  );
  await q("super", "DELETE FROM public.diagnostico_brigid WHERE id = $1", [idInc]);
});

test("validar e publicar integra os dados aprovados à base consolidada", async () => {
  const id = ctx.diagA;
  const antes = (await retratoPublico())[0];
  const munAntes = antes.municipios.find((m) => m.codigo_ibge === ctx.ibge);
  const [{ hash_conteudo: hash }] = await q(
    ADMIN,
    "SELECT hash_conteudo FROM public.diagnostico_versoes WHERE diagnostico_id = $1 AND numero = 1",
    [id],
  );

  const previa = await rpc(ADMIN, "diagnostico_previa_publicacao", id, 1);
  const item = (c) => previa.itens.find((i) => i.campo_destino === c);
  assert.equal(item("opm_possui").valor_novo, "SIM");
  assert.equal(item("opm_possui").afeta_score, true);
  assert.equal(
    item("creas_possui").valor_novo,
    "NAO",
    "regra conservadora: funcionamento parcial = NAO",
  );
  assert.ok(
    item("tem_equipe_minima_creas").ignorado,
    "'Não se aplica' não deve alterar o valor publicado",
  );
  assert.equal(previa.carater, "preliminar");

  const res = await rpc(
    ADMIN,
    "diagnostico_validar_e_publicar",
    id,
    1,
    hash,
    "Conferido com ofício",
    [],
  );
  assert.equal(res.ok, true, res.erro);

  const [mun] = await q("anon", "SELECT * FROM public.municipios WHERE codigo_ibge = $1", [
    ctx.ibge,
  ]);
  assert.equal(mun.opm_possui, "SIM");
  assert.equal(mun.opm_status_politicas_publicas, "NAO");
  assert.equal(mun.creas_possui, "NAO");
  assert.equal(mun.creas_status, "NAO_IMPLEMENTADO");
  assert.equal(mun.tem_fluxo_formal, "SIM");
  assert.equal(mun.tem_protocolo_local_regional, "NAO");
  assert.equal(mun.tem_sala_especializada, "SIM");
  assert.equal(mun.articulacao_creas_rede, "SIM");
  assert.equal(mun.profissionais_capacitados, 0, "quantidade zero é publicada como zero");
  assert.equal(
    mun.tem_equipe_minima_creas,
    munAntes.tem_equipe_minima_creas,
    "'Não se aplica' alterou a base",
  );
  assert.match(mun.fonte_base_opm, /Diagnóstico BRIGID/);

  const pubs = await q(
    "anon",
    "SELECT * FROM public.municipio_dados_publicados WHERE codigo_ibge = $1",
    [ctx.ibge],
  );
  assert.ok(pubs.length > 0);
  assert.ok(pubs.every((p) => p.carater === "preliminar" && p.periodo_referencia === "2026"));
  assert.ok(pubs.every((p) => p.confiabilidade === "documento"));

  const [d] = await q(
    ADMIN,
    "SELECT status, versao_publicada FROM public.diagnostico_brigid WHERE id = $1",
    [id],
  );
  assert.deepEqual(d, { status: "publicado", versao_publicada: 1 });
  const [aud] = await q(
    ADMIN,
    "SELECT count(*)::int AS n FROM public.diagnostico_auditoria WHERE diagnostico_id = $1 AND acao IN ('validacao','publicacao')",
    [id],
  );
  assert.equal(aud.n, 2);
});

test("publicação repetida da mesma versão não duplica registros", async () => {
  const id = ctx.diagA;
  const antes = await retratoPublico();
  const [{ hash_conteudo: hash }] = await q(
    ADMIN,
    "SELECT hash_conteudo FROM public.diagnostico_versoes WHERE diagnostico_id = $1 AND numero = 1",
    [id],
  );
  const r = await rpc(ADMIN, "diagnostico_publicar", id, 1, hash, []);
  assert.equal(r.ja_publicado, true);
  // Mesmo chamando o núcleo diretamente (como administrador do banco) nada é duplicado
  await como("super");
  await db.query("SELECT set_config('request.jwt.claim.sub', $1, false)", [ADMIN]);
  await db.query("SELECT public._diagnostico_aplicar_publicacao($1, 1, '{}')", [id]);
  await como("super");
  assert.deepEqual(await retratoPublico(), antes);
  const [{ n }] = await q(
    "super",
    "SELECT count(*)::int AS n FROM public.diagnostico_publicacoes WHERE diagnostico_id = $1",
    [id],
  );
  assert.equal(n, 1);
});

test("nova versão em rascunho ou análise preserva a versão pública anterior", async () => {
  const id = ctx.diagA;
  const antes = await retratoPublico();
  const v2 = await rpc(PROMOTOR_A, "diagnostico_nova_versao", id);
  assert.equal(v2, 2);
  await rpc(
    PROMOTOR_A,
    "diagnostico_salvar_rascunho",
    id,
    JSON.stringify({ ...respostasCompletas({ civel: true, opm: "nao" }), CID_POL_EXISTE: "nao" }),
    null,
  );
  await rpc(PROMOTOR_A, "diagnostico_enviar", id);
  await rpc(ADMIN, "diagnostico_iniciar_analise", id);
  assert.deepEqual(await retratoPublico(), antes, "nova versão não aprovada alterou a base");
  const [mun] = await q("anon", "SELECT opm_possui FROM public.municipios WHERE codigo_ibge = $1", [
    ctx.ibge,
  ]);
  assert.equal(mun.opm_possui, "SIM");
});

test("falha na publicação desfaz tudo e preserva a última versão pública", async () => {
  const id = ctx.diagA;
  const antes = await retratoPublico();
  // Falha simulada no meio da publicação: depois de opm_possui/creas_possui já gravados,
  // a gravação de tem_sala_especializada é rejeitada
  await db.exec(`CREATE FUNCTION public._teste_falha() RETURNS trigger LANGUAGE plpgsql AS
                      $$ BEGIN RAISE EXCEPTION 'falha simulada de gravação'; END $$;
                    CREATE TRIGGER teste_falha BEFORE INSERT OR UPDATE ON public.municipio_dados_publicados
                      FOR EACH ROW WHEN (NEW.campo_destino = 'tem_sala_especializada') EXECUTE FUNCTION public._teste_falha();`);
  const [{ hash_conteudo: hash }] = await q(
    ADMIN,
    "SELECT hash_conteudo FROM public.diagnostico_versoes WHERE diagnostico_id = $1 AND numero = 2",
    [id],
  );
  let res;
  try {
    res = await rpc(ADMIN, "diagnostico_validar_e_publicar", id, 2, hash, null, []);
  } finally {
    await db.exec(
      "DROP TRIGGER teste_falha ON public.municipio_dados_publicados; DROP FUNCTION public._teste_falha();",
    );
  }
  assert.equal(res.ok, false);
  assert.match(res.erro, /falha simulada/);
  assert.deepEqual(await retratoPublico(), antes, "falha deixou a base parcialmente atualizada");
  const [v] = await q(
    ADMIN,
    "SELECT status FROM public.diagnostico_versoes WHERE diagnostico_id = $1 AND numero = 2",
    [id],
  );
  assert.equal(v.status, "validado", "validação deve permanecer registrada para nova tentativa");
  const [{ n }] = await q(
    ADMIN,
    "SELECT count(*)::int AS n FROM public.diagnostico_auditoria WHERE diagnostico_id = $1 AND acao = 'publicacao_falhou'",
    [id],
  );
  assert.equal(n, 1);

  // Corrigida a causa, a nova tentativa publica a v2 e substitui a v1
  const ok = await rpc(ADMIN, "diagnostico_publicar", id, 2, hash, []);
  assert.equal(ok.ok, true, ok.erro);
  const [mun] = await q("anon", "SELECT opm_possui FROM public.municipios WHERE codigo_ibge = $1", [
    ctx.ibge,
  ]);
  assert.equal(mun.opm_possui, "NAO");
  const versoes = await q(
    ADMIN,
    "SELECT numero, status FROM public.diagnostico_versoes WHERE diagnostico_id = $1 ORDER BY numero",
    [id],
  );
  assert.deepEqual(versoes, [
    { numero: 1, status: "substituido" },
    { numero: 2, status: "publicado" },
  ]);
});

test("publicar o bloco criminal preserva os dados cíveis já consolidados", async () => {
  const [civelAntes] = await q(
    "anon",
    "SELECT opm_possui, tem_fluxo_formal, creas_possui FROM public.municipios WHERE codigo_ibge = $1",
    [ctx.ibge],
  );
  const [{ tem_protocolo_pericial: pericialAntes }] = await q(
    "anon",
    "SELECT tem_protocolo_pericial FROM public.municipios WHERE codigo_ibge = $1",
    [ctx.ibge],
  );
  const id = await rpc(PROMOTOR_B, "diagnostico_criar", ctx.pB, ctx.ibge, "2026", null);
  ctx.diagB = id;
  const comp = await rpc(
    PROMOTOR_B,
    "diagnostico_salvar_rascunho",
    id,
    JSON.stringify(respostasCompletas({ criminal: true })),
    null,
  );
  assert.equal(comp.percentual, 100, JSON.stringify(comp.pendencias));
  await rpc(PROMOTOR_B, "diagnostico_enviar", id);
  await rpc(ADMIN, "diagnostico_iniciar_analise", id);
  const [{ hash_conteudo: hash }] = await q(
    ADMIN,
    "SELECT hash_conteudo FROM public.diagnostico_versoes WHERE diagnostico_id = $1",
    [id],
  );
  const res = await rpc(ADMIN, "diagnostico_validar_e_publicar", id, 1, hash, null, []);
  assert.equal(res.ok, true, res.erro);

  const [mun] = await q("anon", "SELECT * FROM public.municipios WHERE codigo_ibge = $1", [
    ctx.ibge,
  ]);
  assert.deepEqual(
    {
      opm_possui: mun.opm_possui,
      tem_fluxo_formal: mun.tem_fluxo_formal,
      creas_possui: mun.creas_possui,
    },
    civelAntes,
  );
  assert.equal(mun.tem_protocolo_investigacao, "SIM");
  assert.equal(mun.grau_aderencia_protocolo, "MEDIO");
  assert.equal(mun.gargalos_identificados, "Demora pericial; Ausência de OPM");

  // "Não soube informar" não altera o valor publicado
  assert.equal(mun.tem_protocolo_pericial, pericialAntes);

  // Contagens: fora do score e com caráter preliminar (2026)
  const ev = await q(
    "anon",
    `SELECT e.* FROM public.eventos_feminicidio e JOIN public.municipios m ON m.id = e.municipio_id
                              WHERE m.codigo_ibge = $1 AND e.origem_dado = 'DIAGNOSTICO_MP' ORDER BY tipo_evento`,
    [ctx.ibge],
  );
  assert.deepEqual(
    ev.map((e) => [e.tipo_evento, e.quantidade, e.considera_no_score, e.status_periodo]),
    [
      ["CONSUMADO", 0, false, "parcial_corrente"],
      ["TENTADO", 2, false, "parcial_corrente"],
    ],
  );
});

test("respostas conflitantes de outra unidade exigem confirmação expressa", async () => {
  // Promotoria B passa a ser cumulativa e informa bloco cível divergente para o mesmo período
  await q(
    "super",
    "UPDATE public.promotorias_justica SET tipo_atribuicao = 'cumulativa' WHERE id = $1",
    [ctx.pB],
  );
  await q(
    "super",
    "UPDATE public.diagnostico_brigid SET atribuicao = '{cumulativa}' WHERE id = $1",
    [ctx.diagB],
  );
  await rpc(PROMOTOR_B, "diagnostico_nova_versao", ctx.diagB);
  const r = {
    ...respostasCompletas({ civel: true, criminal: true, opm: "funcionamento_regular" }),
    CID_POL_EXISTE: "nao",
  };
  await rpc(PROMOTOR_B, "diagnostico_salvar_rascunho", ctx.diagB, JSON.stringify(r), null);
  await rpc(PROMOTOR_B, "diagnostico_enviar", ctx.diagB);
  await rpc(ADMIN, "diagnostico_iniciar_analise", ctx.diagB);
  const [{ hash_conteudo: hash }] = await q(
    ADMIN,
    "SELECT hash_conteudo FROM public.diagnostico_versoes WHERE diagnostico_id = $1 AND numero = 2",
    [ctx.diagB],
  );

  const previa = await rpc(ADMIN, "diagnostico_previa_publicacao", ctx.diagB, 2);
  const conflitos = previa.itens.filter((i) => i.conflito).map((i) => i.campo_destino);
  assert.ok(conflitos.includes("opm_possui"), JSON.stringify(conflitos));

  const antes = await retratoPublico();
  await falha(
    ADMIN,
    "SELECT public.diagnostico_validar_e_publicar($1, 2, $2, NULL, '{}')",
    [ctx.diagB, hash],
    /CONFLITO/,
  );
  assert.deepEqual(await retratoPublico(), antes, "conflito não confirmado alterou a base");
  const [v] = await q(
    ADMIN,
    "SELECT status FROM public.diagnostico_versoes WHERE diagnostico_id = $1 AND numero = 2",
    [ctx.diagB],
  );
  assert.equal(v.status, "em_analise");

  const ok = await rpc(
    ADMIN,
    "diagnostico_validar_e_publicar",
    ctx.diagB,
    2,
    hash,
    "Substituição confirmada",
    conflitos,
  );
  assert.equal(ok.ok, true, ok.erro);
  const [mun] = await q("anon", "SELECT opm_possui FROM public.municipios WHERE codigo_ibge = $1", [
    ctx.ibge,
  ]);
  assert.equal(mun.opm_possui, "SIM");
});

test("informações privadas, observações internas e anexos não são expostos", async () => {
  for (const t of [
    "diagnostico_brigid",
    "diagnostico_versoes",
    "diagnostico_observacoes",
    "diagnostico_anexos",
    "diagnostico_auditoria",
    "diagnostico_publicacoes",
    "usuarios_promotoria",
    "admin_users",
  ]) {
    assert.equal((await q("anon", `SELECT * FROM public.${t}`)).length, 0, `anon leu ${t}`);
  }
  const pubs = await q("anon", "SELECT * FROM public.municipio_dados_publicados");
  const mapeados = (
    await q("anon", "SELECT codigo FROM public.diagnostico_mapeamento_publicacao")
  ).map((r) => r.codigo);
  assert.ok(pubs.every((p) => mapeados.includes(p.codigo_dicionario)));
  const texto =
    JSON.stringify(pubs) +
    JSON.stringify(
      await q("anon", "SELECT * FROM public.municipios WHERE codigo_ibge = $1", [ctx.ibge]),
    );
  for (const segredo of [
    "Maria da Silva",
    "99999-0000",
    "Observação interna",
    "dado sensível",
    "Texto interno",
    "Delegacia não respondeu",
    "@mppi.mp.br",
  ]) {
    assert.ok(!texto.includes(segredo), `vazou: ${segredo}`);
  }
  await falha("anon", "SELECT * FROM public.admin_listar_vinculos()", [], /permission denied/);
  await falha(
    PROMOTOR_A,
    "SELECT * FROM public.admin_listar_vinculos()",
    [],
    /restrita ao CAOCRIM/,
  );
});

test("completude calculada no navegador e no banco é idêntica", async () => {
  const fonte = fs
    .readFileSync(path.join(raiz, "src/lib/completude-diagnostico.ts"), "utf8")
    .replace('from "./dicionario-diagnostico"', 'from "./dicionario.mjs"');
  const dir = path.join(raiz, "node_modules", ".cache", `completude-${process.pid}`);
  fs.mkdirSync(dir, { recursive: true });
  const transp = (s) =>
    ts.transpileModule(s, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
    }).outputText;
  fs.writeFileSync(
    path.join(dir, "dicionario.mjs"),
    transp(fs.readFileSync(path.join(raiz, "src/lib/dicionario-diagnostico.ts"), "utf8")),
  );
  fs.writeFileSync(path.join(dir, "completude.mjs"), transp(fonte));
  const { calcularCompletude, sanitizarRespostas } = await import(
    pathToFileURL(path.join(dir, "completude.mjs")).href
  );
  const { dicionarioDiagnostico } = await carregarDicionario();
  fs.rmSync(dir, { recursive: true, force: true });

  let semente = 42;
  const aleatorio = () => (semente = (semente * 1103515245 + 12345) % 2147483648) / 2147483648;
  const atribuicoes = [["civel"], ["criminal"], ["cumulativa"], ["unica"], []];

  for (let n = 0; n < 400; n++) {
    const r = {};
    for (const c of dicionarioDiagnostico) {
      const x = aleatorio();
      if (x < 0.25) continue;
      if (c.tipo_controle === "checkbox_group")
        r[c.codigo_tecnico] = x < 0.4 ? [] : [c.opcoes[0].value];
      else if (c.tipo_controle === "number")
        r[c.codigo_tecnico] = x < 0.4 ? "nao_sabe" : x < 0.5 ? "abc" : Math.floor(x * 4);
      else if (c.opcoes)
        r[c.codigo_tecnico] = c.opcoes[Math.floor(aleatorio() * c.opcoes.length)].value;
      else r[c.codigo_tecnico] = x < 0.35 ? "  " : "texto";
      if (r[c.codigo_tecnico] === "nao_sabe" && aleatorio() < 0.5)
        r[c.codigo_tecnico + "_JUSTIFICATIVA"] = "motivo";
    }
    const atrib = atribuicoes[n % atribuicoes.length];
    const ident = {
      promotoria_id: "P",
      codigo_ibge: "1",
      atribuicao: atrib,
      periodo_referencia: n % 7 ? "2026" : "",
    };
    const js = calcularCompletude(r, ident);
    const [{ c: banco }] = await q(
      "super",
      "SELECT public.diagnostico_completude($1::jsonb, $2::text[], 'P', '1', $3) AS c",
      [JSON.stringify(r), atrib, ident.periodo_referencia],
    );
    assert.equal(js.percentual, banco.percentual, `caso ${n}`);
    assert.deepEqual(
      js.pendencias.map((p) => `${p.codigo}:${p.motivo}`),
      banco.pendencias.map((p) => `${p.codigo}:${p.motivo}`),
      `caso ${n}`,
    );

    const [{ s }] = await q(
      "super",
      "SELECT public._diagnostico_sanitizar($1::jsonb, $2::text[]) AS s",
      [JSON.stringify(r), atrib],
    );
    assert.deepEqual(sanitizarRespostas(r, atrib), s, `sanitização caso ${n}`);
  }
});

test("'Não soube informar' exige justificativa e não vira 'Não' nem zero", async () => {
  const base = respostasCompletas({ criminal: true });
  const [{ c: semJust }] = await q(
    "super",
    "SELECT public.diagnostico_completude($1::jsonb, '{criminal}', 'P', '1', '2026') AS c",
    [JSON.stringify({ ...base, SEG_PROTO_PER_JUSTIFICATIVA: "" })],
  );
  assert.ok(
    semJust.pendencias.some(
      (p) => p.codigo === "SEG_PROTO_PER" && p.motivo === "sem_justificativa",
    ),
  );
  const [{ c: numNs }] = await q(
    "super",
    "SELECT public.diagnostico_completude($1::jsonb, '{criminal}', 'P', '1', '2026') AS c",
    [JSON.stringify({ ...base, VIO_TENTADOS: "nao_sabe" })],
  );
  assert.ok(
    numNs.pendencias.some((p) => p.codigo === "VIO_TENTADOS" && p.motivo === "sem_justificativa"),
  );
  const [{ c: zero }] = await q(
    "super",
    "SELECT public.diagnostico_completude($1::jsonb, '{criminal}', 'P', '1', '2026') AS c",
    [JSON.stringify({ ...base, VIO_TENTADOS: 0 })],
  );
  assert.equal(zero.percentual, 100, "zero é resposta válida");
  const [{ c: civel }] = await q(
    "super",
    "SELECT public.diagnostico_completude($1::jsonb, '{civel}', 'P', '1', '2026') AS c",
    [JSON.stringify(respostasCompletas({ civel: true }))],
  );
  assert.equal(
    civel.percentual,
    100,
    "blocos criminais não podem ser exigidos de atribuição cível",
  );
});
