-- =====================================================================================
-- Migration: Fluxo de revisão, validação e publicação do Diagnóstico BRIGID
-- =====================================================================================
-- Ordem de execução no SQL Editor do Supabase:
--   1. migrations/migration_promotorias.sql   (Promotorias e abrangência territorial)
--   2. migrations/migration_diagnostico.sql   (estrutura inicial do diagnóstico)
--   3. migrations/migration_rls_admin.sql     (admin_users, is_admin(), RLS base)
--   4. ESTE ARQUIVO
--
-- Princípios:
--   * Coleta (diagnostico_brigid, diagnostico_versoes, observações, anexos, auditoria) e
--     base publicada (municipio_dados_publicados, municipios, eventos_feminicidio) são
--     separadas. As tabelas de coleta não têm leitura pública.
--   * Nenhuma tabela de coleta aceita INSERT/UPDATE/DELETE direto pela API: toda escrita
--     passa pelas funções abaixo (SECURITY DEFINER), que validam perfil, vínculo e estado.
--   * Só a função de validação/publicação, restrita a is_admin(), grava na base pública,
--     em uma única transação, para a versão exata revisada (hash do conteúdo).
-- =====================================================================================

DO $$
BEGIN
  IF to_regclass('public.promotorias_justica') IS NULL
     OR to_regclass('public.promotoria_municipios') IS NULL THEN
    RAISE EXCEPTION 'Execute antes migrations/migration_promotorias.sql.';
  END IF;
  IF to_regclass('public.diagnostico_brigid') IS NULL THEN
    RAISE EXCEPTION 'Execute antes migrations/migration_diagnostico.sql.';
  END IF;
  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'Execute antes migrations/migration_rls_admin.sql.';
  END IF;
END;
$$;

-- -------------------------------------------------------------------------------------
-- 1. Colunas de destino da base consolidada (já criadas pelos scripts atualizar_*.sql;
--    repetidas aqui para que a publicação não dependa da ordem desses scripts)
-- -------------------------------------------------------------------------------------
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS tem_fluxo_formal TEXT;
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS tem_protocolo_local_regional TEXT;
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS tem_sala_especializada TEXT;
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS tem_atendimento_psicossocial TEXT;
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS tem_protocolo_assistencial VARCHAR(10);
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS tem_fluxo_encaminhamento VARCHAR(10);
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS articulacao_creas_rede VARCHAR(10);
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS tem_equipe_minima_creas VARCHAR(10);
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS profissionais_capacitados INT;
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS tem_protocolo_investigacao VARCHAR(10);
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS tem_protocolo_pericial VARCHAR(10);
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS capacitado_perspectiva_genero VARCHAR(10);
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS grau_aderencia_protocolo VARCHAR(20);
ALTER TABLE public.municipios ADD COLUMN IF NOT EXISTS gargalos_identificados TEXT;

-- Eventos publicados pelo diagnóstico ficam rastreáveis até a publicação de origem
DO $$
BEGIN
  IF to_regclass('public.eventos_feminicidio') IS NOT NULL THEN
    ALTER TABLE public.eventos_feminicidio ADD COLUMN IF NOT EXISTS publicacao_id BIGINT;
  END IF;
END;
$$;

-- -------------------------------------------------------------------------------------
-- 2. Vínculo usuário ↔ Promotoria (quem pode responder em nome de qual unidade)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usuarios_promotoria (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    promotoria_id TEXT NOT NULL REFERENCES public.promotorias_justica(id) ON DELETE CASCADE,
    nome_responsavel TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, promotoria_id)
);

CREATE OR REPLACE FUNCTION public.usuario_vinculado(p_promotoria_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_promotoria
    WHERE user_id = auth.uid() AND promotoria_id = p_promotoria_id AND ativo
  );
$$;

-- -------------------------------------------------------------------------------------
-- 3. Diagnóstico (unidade de trabalho: Promotoria + município + período)
-- -------------------------------------------------------------------------------------
ALTER TABLE public.diagnostico_brigid DROP CONSTRAINT IF EXISTS diagnostico_brigid_status_check;
ALTER TABLE public.diagnostico_brigid DROP CONSTRAINT IF EXISTS diagnostico_brigid_status_chk;

ALTER TABLE public.diagnostico_brigid
  ALTER COLUMN id SET DEFAULT ('DGN-' || replace(gen_random_uuid()::text, '-', '')),
  ADD COLUMN IF NOT EXISTS atribuicao TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS periodo_referencia TEXT,
  ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS responsavel_nome TEXT,
  ADD COLUMN IF NOT EXISTS versao_atual INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS versao_publicada INT,
  ADD COLUMN IF NOT EXISTS percentual_preenchimento INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_envio TIMESTAMPTZ;

-- Estados antigos (nunca usados em produção; o protótipo gravava só no navegador)
UPDATE public.diagnostico_brigid SET status = CASE status
  WHEN 'rascunho' THEN 'em_preenchimento'
  WHEN 'concluido' THEN 'enviado'
  WHEN 'validacao' THEN 'em_analise'
  ELSE status END;

ALTER TABLE public.diagnostico_brigid ADD CONSTRAINT diagnostico_brigid_status_chk CHECK (status IN (
  'em_preenchimento', 'enviado', 'em_analise', 'devolvido', 'validado', 'publicado', 'substituido'
));
ALTER TABLE public.diagnostico_brigid ALTER COLUMN status SET DEFAULT 'em_preenchimento';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'diagnostico_brigid_promotoria_fk') THEN
    ALTER TABLE public.diagnostico_brigid
      ADD CONSTRAINT diagnostico_brigid_promotoria_fk
      FOREIGN KEY (promotoria_id) REFERENCES public.promotorias_justica(id);
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_diagnostico_unidade_municipio_periodo
  ON public.diagnostico_brigid (promotoria_id, codigo_ibge, periodo_referencia)
  WHERE periodo_referencia IS NOT NULL;

-- -------------------------------------------------------------------------------------
-- 4. Versões do diagnóstico (o conteúdo respondido; cada aprovação aponta para uma versão)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostico_versoes (
    id BIGSERIAL PRIMARY KEY,
    diagnostico_id TEXT NOT NULL REFERENCES public.diagnostico_brigid(id) ON DELETE CASCADE,
    numero INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'em_preenchimento' CHECK (status IN (
      'em_preenchimento', 'enviado', 'em_analise', 'devolvido', 'validado', 'publicado', 'substituido'
    )),
    respostas JSONB NOT NULL DEFAULT '{}',
    hash_conteudo TEXT NOT NULL DEFAULT '',
    percentual_preenchimento INT NOT NULL DEFAULT 0,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    criado_por UUID,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_por UUID,
    enviado_em TIMESTAMPTZ,
    enviado_por UUID,
    analise_iniciada_em TIMESTAMPTZ,
    analise_por UUID,
    devolvido_em TIMESTAMPTZ,
    devolvido_por UUID,
    motivo_devolucao TEXT,
    validado_em TIMESTAMPTZ,
    validado_por UUID,
    observacoes_validacao TEXT,
    publicado_em TIMESTAMPTZ,
    publicado_por UUID,
    substituido_em TIMESTAMPTZ,
    UNIQUE (diagnostico_id, numero)
);

-- Migra respostas da estrutura antiga (uma linha por bloco), se houver, para a versão 1
INSERT INTO public.diagnostico_versoes (diagnostico_id, numero, status, respostas)
SELECT d.id, 1, d.status,
  COALESCE((
    SELECT jsonb_object_agg(e.key, e.value)
    FROM public.diagnostico_respostas r, jsonb_each(r.respostas) e
    WHERE r.diagnostico_id = d.id
  ), '{}'::jsonb)
FROM public.diagnostico_brigid d
WHERE NOT EXISTS (SELECT 1 FROM public.diagnostico_versoes v WHERE v.diagnostico_id = d.id);

-- A tabela por bloco é substituída por diagnostico_versoes.respostas
DROP TABLE IF EXISTS public.diagnostico_respostas;

-- -------------------------------------------------------------------------------------
-- 5. Observações de análise / devolução (internas do fluxo; nunca publicadas)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostico_observacoes (
    id BIGSERIAL PRIMARY KEY,
    diagnostico_id TEXT NOT NULL REFERENCES public.diagnostico_brigid(id) ON DELETE CASCADE,
    versao INT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('analise', 'devolucao')),
    secao TEXT,
    campo_codigo TEXT,
    texto TEXT NOT NULL,
    visivel_respondente BOOLEAN NOT NULL DEFAULT false,
    autor_id UUID,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diag_obs_diag ON public.diagnostico_observacoes (diagnostico_id, versao);

-- -------------------------------------------------------------------------------------
-- 6. Anexos (arquivos no Storage privado; classificação 'interno' por padrão)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostico_anexos (
    id BIGSERIAL PRIMARY KEY,
    diagnostico_id TEXT NOT NULL REFERENCES public.diagnostico_brigid(id) ON DELETE CASCADE,
    versao INT NOT NULL,
    secao TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    tamanho_bytes BIGINT,
    tipo_mime TEXT,
    classificacao TEXT NOT NULL DEFAULT 'interno' CHECK (classificacao IN ('interno', 'publicavel')),
    enviado_por UUID,
    enviado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------------------
-- 7. Auditoria (tabela existente) — passa a registrar a versão
-- -------------------------------------------------------------------------------------
ALTER TABLE public.diagnostico_auditoria ADD COLUMN IF NOT EXISTS versao INT;
CREATE INDEX IF NOT EXISTS idx_diag_auditoria_diag ON public.diagnostico_auditoria (diagnostico_id);

-- -------------------------------------------------------------------------------------
-- 8. Regras de completude (geradas a partir de src/lib/dicionario-diagnostico.ts)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostico_campos_regras (
    codigo TEXT PRIMARY KEY,
    secao TEXT NOT NULL,
    tipo_controle TEXT NOT NULL,
    obrigatorio BOOLEAN NOT NULL,
    cond_campo TEXT,
    cond_valores TEXT[],
    cond_maior_que NUMERIC,
    rotulo TEXT NOT NULL,
    ordem INT NOT NULL
);

-- >>> REGRAS GERADAS (scripts/gerar-regras-diagnostico.mjs) >>>
DELETE FROM public.diagnostico_campos_regras;
INSERT INTO public.diagnostico_campos_regras
  (codigo, secao, tipo_controle, obrigatorio, cond_campo, cond_valores, cond_maior_que, rotulo, ordem)
VALUES
  ('DGN_SITUACAO', 'identificacao', 'select', true, NULL, NULL, NULL, 'Situação do diagnóstico', 1),
  ('IDEN_FONTE', 'identificacao', 'select', true, NULL, NULL, NULL, 'Fonte da informação', 2),
  ('IDEN_CONFIABILIDADE', 'identificacao', 'select', true, NULL, NULL, NULL, 'Grau de confiabilidade', 3),
  ('IDEN_DATA_REF', 'identificacao', 'text', true, NULL, NULL, NULL, 'Data de referência', 4),
  ('IDEN_OBSERVACOES', 'identificacao', 'textarea', false, NULL, NULL, NULL, 'Observações do bloco e indicação de Anexos', 5),
  ('CID_OPM_STATUS', 'cidadania', 'select', true, NULL, NULL, NULL, 'O município possui Secretaria, Coordenadoria ou órgão equivalente de Políticas para as Mulheres?', 6),
  ('CID_OPM_NOME', 'cidadania', 'text', false, 'CID_OPM_STATUS', ARRAY['funcionamento_regular', 'criado_inativo']::text[], NULL, 'Nome do órgão', 7),
  ('CID_OPM_TIPO', 'cidadania', 'text', false, 'CID_OPM_STATUS', ARRAY['funcionamento_regular', 'criado_inativo']::text[], NULL, 'Tipo de estrutura', 8),
  ('CID_OPM_DATA_CRIACAO', 'cidadania', 'text', false, 'CID_OPM_STATUS', ARRAY['funcionamento_regular', 'criado_inativo']::text[], NULL, 'Data de criação e instrumento legal', 9),
  ('CID_OPM_RESPONSAVEL', 'cidadania', 'text', false, 'CID_OPM_STATUS', ARRAY['funcionamento_regular', 'criado_inativo']::text[], NULL, 'Responsável e contato (telefone/e-mail)', 10),
  ('CID_OPM_ENDERECO', 'cidadania', 'text', false, 'CID_OPM_STATUS', ARRAY['funcionamento_regular', 'criado_inativo']::text[], NULL, 'Endereço', 11),
  ('CID_OPM_EQUIPE', 'cidadania', 'textarea', false, 'CID_OPM_STATUS', ARRAY['funcionamento_regular', 'criado_inativo']::text[], NULL, 'Equipe disponível', 12),
  ('CID_OPM_PLANO', 'cidadania', 'textarea', false, 'CID_OPM_STATUS', ARRAY['funcionamento_regular', 'criado_inativo']::text[], NULL, 'Existência de plano municipal de políticas e orçamento', 13),
  ('CID_OPM_ACOES', 'cidadania', 'textarea', false, 'CID_OPM_STATUS', ARRAY['funcionamento_regular', 'criado_inativo']::text[], NULL, 'Público atendido e principais ações realizadas', 14),
  ('CID_OPM_CAPACIDADE', 'cidadania', 'select', false, 'CID_OPM_STATUS', ARRAY['funcionamento_regular', 'criado_inativo']::text[], NULL, 'O órgão possui capacidade efetiva de executar políticas públicas para mulheres?', 15),
  ('CID_CREAS_STATUS', 'cidadania', 'select', true, NULL, NULL, NULL, 'O município possui CREAS em funcionamento?', 16),
  ('CID_CREAS_ENDERECO', 'cidadania', 'text', false, 'CID_CREAS_STATUS', ARRAY['funcionamento_regular', 'funcionamento_parcial', 'sem_especializado']::text[], NULL, 'Endereço e abrangência territorial', 17),
  ('CID_CREAS_EQUIPE', 'cidadania', 'textarea', false, 'CID_CREAS_STATUS', ARRAY['funcionamento_regular', 'funcionamento_parcial', 'sem_especializado']::text[], NULL, 'Equipe disponível, horários e capacidade média de atendimento', 18),
  ('CID_CREAS_ARTICULACAO', 'cidadania', 'textarea', false, 'CID_CREAS_STATUS', ARRAY['funcionamento_regular', 'funcionamento_parcial', 'sem_especializado']::text[], NULL, 'Articulação com Promotoria, saúde, segurança e existência de fluxo', 19),
  ('CID_POL_EXISTE', 'cidadania', 'select', true, NULL, NULL, NULL, 'Existem políticas públicas municipais específicas para mulheres em situação de violência?', 20),
  ('CID_POL_DETALHES', 'cidadania', 'textarea', false, 'CID_POL_EXISTE', ARRAY['plenamente', 'parcialmente', 'isoladas']::text[], NULL, 'Detalhes sobre plano, orçamento, metas e ações preventivas', 21),
  ('CID_FONTE', 'cidadania', 'select', true, NULL, NULL, NULL, 'Fonte da informação', 22),
  ('CID_CONFIABILIDADE', 'cidadania', 'select', true, NULL, NULL, NULL, 'Grau de confiabilidade', 23),
  ('CID_DATA_REF', 'cidadania', 'text', true, NULL, NULL, NULL, 'Data de referência', 24),
  ('CID_OBSERVACOES', 'cidadania', 'textarea', false, NULL, NULL, NULL, 'Observações do bloco e indicação de Anexos', 25),
  ('FLX_FORMAL', 'fluxos', 'select', true, NULL, NULL, NULL, 'O município possui fluxo formal de atendimento às mulheres vítimas de violência?', 26),
  ('FLX_FORMAL_DETALHES', 'fluxos', 'textarea', false, 'FLX_FORMAL', ARRAY['formal_ato', 'nao_formal']::text[], NULL, 'Detalhes do fluxo formal (instrumento, órgãos, órgão coordenador, etc)', 27),
  ('FLX_PROTOCOLO', 'fluxos', 'select', true, NULL, NULL, NULL, 'Existe protocolo local ou regional de atendimento?', 28),
  ('FLX_PROTOCOLO_DETALHES', 'fluxos', 'textarea', false, 'FLX_PROTOCOLO', ARRAY['vigente', 'desatualizado']::text[], NULL, 'O protocolo define responsabilidades, prazos, riscos, e abrange tentativa/consumação?', 29),
  ('FLX_SALA', 'fluxos', 'select', true, NULL, NULL, NULL, 'Existe sala ou ambiente especializado para atendimento?', 30),
  ('FLX_RECURSOS', 'fluxos', 'textarea', true, NULL, NULL, NULL, 'A rede municipal dispõe dos recursos mínimos necessários?', 31),
  ('FLX_PSICO', 'fluxos', 'select', true, NULL, NULL, NULL, 'Existe atendimento psicossocial especializado?', 32),
  ('FLX_PSICO_DETALHES', 'fluxos', 'textarea', false, 'FLX_PSICO', ARRAY['regular', 'eventual', 'encaminhamento']::text[], NULL, 'Detalhes do atendimento psicossocial (órgão, profissionais, acesso, etc)', 33),
  ('FLX_FONTE', 'fluxos', 'select', true, NULL, NULL, NULL, 'Fonte da informação', 34),
  ('FLX_CONFIABILIDADE', 'fluxos', 'select', true, NULL, NULL, NULL, 'Grau de confiabilidade', 35),
  ('FLX_DATA_REF', 'fluxos', 'text', true, NULL, NULL, NULL, 'Data de referência', 36),
  ('FLX_OBSERVACOES', 'fluxos', 'textarea', false, NULL, NULL, NULL, 'Observações do bloco e indicação de Anexos', 37),
  ('SOC_PROTOCOLO', 'socioassistencial', 'select', true, NULL, NULL, NULL, 'Existe protocolo específico da assistência social para atendimento?', 38),
  ('SOC_FLUXO', 'socioassistencial', 'select', true, NULL, NULL, NULL, 'Há fluxo formal de encaminhamento entre Promotoria, CREAS, CRAS, etc?', 39),
  ('SOC_FLUXO_DETALHES', 'socioassistencial', 'textarea', false, 'SOC_FLUXO', ARRAY['integrado', 'parcialmente', 'informal']::text[], NULL, 'Detalhes (órgão de entrada, referência, prazos, etc)', 40),
  ('SOC_ARTIC_CREAS', 'socioassistencial', 'select', true, NULL, NULL, NULL, 'Como ocorre a articulação com o CREAS?', 41),
  ('SOC_EQUIPE', 'socioassistencial', 'select', true, NULL, NULL, NULL, 'O CREAS possui equipe mínima suficiente para atendimento?', 42),
  ('SOC_EQUIPE_DETALHES', 'socioassistencial', 'textarea', false, 'SOC_EQUIPE', ARRAY['sim', 'parcialmente', 'nao']::text[], NULL, 'Detalhes da equipe (número de assistentes sociais, psicólogos, etc)', 43),
  ('SOC_CAPACITA_QTD', 'socioassistencial', 'number', false, NULL, NULL, NULL, 'Quantos profissionais da rede foram capacitados em violência de gênero?', 44),
  ('SOC_CAPACITA_DETALHES', 'socioassistencial', 'textarea', false, NULL, NULL, NULL, 'Detalhes da capacitação (temas, instituição, última data)', 45),
  ('SOC_FONTE', 'socioassistencial', 'select', true, NULL, NULL, NULL, 'Fonte da informação', 46),
  ('SOC_CONFIABILIDADE', 'socioassistencial', 'select', true, NULL, NULL, NULL, 'Grau de confiabilidade', 47),
  ('SOC_DATA_REF', 'socioassistencial', 'text', true, NULL, NULL, NULL, 'Data de referência', 48),
  ('SOC_OBSERVACOES', 'socioassistencial', 'textarea', false, NULL, NULL, NULL, 'Observações do bloco e indicação de Anexos', 49),
  ('SEG_PROTO_INV', 'penal_seguranca', 'select', true, NULL, NULL, NULL, 'Existe protocolo de investigação para crimes de violência de gênero e feminicídio?', 50),
  ('SEG_PROTO_INV_DETALHES', 'penal_seguranca', 'textarea', false, 'SEG_PROTO_INV', ARRAY['sim_aplicado', 'sim_parcial', 'nao_aplicado']::text[], NULL, 'Detalhes do protocolo de investigação', 51),
  ('SEG_PROTO_PER', 'penal_seguranca', 'select', true, NULL, NULL, NULL, 'Existe protocolo ou procedimento operacional para realização das perícias?', 52),
  ('SEG_PROTO_PER_DETALHES', 'penal_seguranca', 'textarea', false, 'SEG_PROTO_PER', ARRAY['sim_aplicado', 'sim_parcial', 'nao_aplicado']::text[], NULL, 'Detalhes da perícia (preservação do local, prazo, exames, etc)', 53),
  ('SEG_CAPACITA', 'penal_seguranca', 'select', true, NULL, NULL, NULL, 'As equipes de investigação e atendimento receberam capacitação em perspectiva de gênero?', 54),
  ('SEG_ADERENCIA', 'penal_seguranca', 'select', true, NULL, NULL, NULL, 'Como a unidade avalia a aderência dos procedimentos locais aos protocolos técnicos?', 55),
  ('SEG_ADERENCIA_JUST', 'penal_seguranca', 'textarea', false, NULL, NULL, NULL, 'Justificativa / Procedimento exemplificativo', 56),
  ('SEG_FONTE', 'penal_seguranca', 'select', true, NULL, NULL, NULL, 'Fonte da informação', 57),
  ('SEG_CONFIABILIDADE', 'penal_seguranca', 'select', true, NULL, NULL, NULL, 'Grau de confiabilidade', 58),
  ('SEG_DATA_REF', 'penal_seguranca', 'text', true, NULL, NULL, NULL, 'Data de referência', 59),
  ('SEG_OBSERVACOES', 'penal_seguranca', 'textarea', false, NULL, NULL, NULL, 'Observações do bloco e indicação de Anexos', 60),
  ('VIO_ANO', 'penal_violencia', 'select', true, NULL, NULL, NULL, 'Ano de Referência', 61),
  ('VIO_PERIODO', 'penal_violencia', 'text', false, NULL, NULL, NULL, 'Período de referência (Ex: Jan-Jun)', 62),
  ('VIO_TENTADOS', 'penal_violencia', 'number', true, NULL, NULL, NULL, 'Quantidade de feminicídios tentados', 63),
  ('VIO_TENTADOS_DETALHES', 'penal_violencia', 'textarea', false, 'VIO_TENTADOS', NULL, 0, 'Detalhes (vítimas, inquéritos, processos, prisões, autoria, andamento)', 64),
  ('VIO_CONSUMADOS', 'penal_violencia', 'number', true, NULL, NULL, NULL, 'Quantidade de feminicídios consumados', 65),
  ('VIO_CONSUMADOS_DETALHES', 'penal_violencia', 'textarea', false, 'VIO_CONSUMADOS', NULL, 0, 'Detalhes (vítimas, histórico de violência, medidas protetivas, situação do inquérito)', 66),
  ('VIO_FONTE', 'penal_violencia', 'select', true, NULL, NULL, NULL, 'Fonte da informação', 67),
  ('VIO_CONFIABILIDADE', 'penal_violencia', 'select', true, NULL, NULL, NULL, 'Grau de confiabilidade', 68),
  ('VIO_DATA_REF', 'penal_violencia', 'text', true, NULL, NULL, NULL, 'Data de referência', 69),
  ('VIO_OBSERVACOES', 'penal_violencia', 'textarea', false, NULL, NULL, NULL, 'Observações do bloco e indicação de Anexos', 70),
  ('GAR_LISTA', 'gargalos', 'checkbox_group', true, NULL, NULL, NULL, 'Selecione os principais gargalos identificados', 71),
  ('GAR_DETALHES', 'gargalos', 'textarea', true, NULL, NULL, NULL, 'Descreva os gargalos selecionados (impacto, frequência, órgão responsável, solução sugerida)', 72),
  ('GAR_FONTE', 'gargalos', 'select', true, NULL, NULL, NULL, 'Fonte da informação', 73),
  ('GAR_CONFIABILIDADE', 'gargalos', 'select', true, NULL, NULL, NULL, 'Grau de confiabilidade', 74),
  ('GAR_DATA_REF', 'gargalos', 'text', true, NULL, NULL, NULL, 'Data de referência', 75),
  ('GAR_OBSERVACOES', 'gargalos', 'textarea', false, NULL, NULL, NULL, 'Observações do bloco e indicação de Anexos', 76);
-- <<< REGRAS GERADAS <<<

-- -------------------------------------------------------------------------------------
-- 9. Mapeamento explícito formulário → base consolidada (lista fechada do que é público)
-- -------------------------------------------------------------------------------------
-- tipo_destino:
--   texto         valor convertido pela regra (origem → destino); chave com valor null = não altera
--   inteiro       quantidade inteira copiada
--   lista_rotulos lista de opções convertida nos rótulos, separados por "; "
--   fonte         texto de procedência gerado na publicação
--   evento        quantidade gravada em eventos_feminicidio (fora do score: considera_no_score = false)
-- "Não soube informar" nunca altera o valor publicado. Respostas sem regra são ignoradas.
CREATE TABLE IF NOT EXISTS public.diagnostico_mapeamento_publicacao (
    codigo TEXT NOT NULL,
    campo_destino TEXT NOT NULL,
    tipo_destino TEXT NOT NULL CHECK (tipo_destino IN ('texto', 'inteiro', 'lista_rotulos', 'fonte', 'evento')),
    regra JSONB,
    afeta_score BOOLEAN NOT NULL DEFAULT false,
    painel TEXT NOT NULL,
    descricao_regra TEXT NOT NULL,
    ordem INT NOT NULL,
    PRIMARY KEY (codigo, campo_destino)
);

DELETE FROM public.diagnostico_mapeamento_publicacao;
INSERT INTO public.diagnostico_mapeamento_publicacao
  (codigo, campo_destino, tipo_destino, regra, afeta_score, painel, descricao_regra, ordem)
VALUES
  ('CID_OPM_STATUS', 'opm_possui', 'texto',
   '{"funcionamento_regular":"SIM","criado_inativo":"NAO","em_implantacao":"NAO","nao":"NAO"}',
   true, 'OPM, Risco, Mapa, Território, Ficha municipal',
   'SIM somente para "funcionamento regular"; demais respostas conhecidas = NAO', 1),
  ('CID_OPM_STATUS', 'fonte_base_opm', 'fonte', NULL,
   false, 'Ficha municipal', 'Procedência: Diagnóstico BRIGID, Promotoria e período publicados', 2),
  ('CID_OPM_CAPACIDADE', 'opm_status_politicas_publicas', 'texto',
   '{"integralmente":"SIM","parcialmente":"NAO","nao":"NAO"}',
   false, 'OPM, Território, Ficha municipal',
   'SIM somente para capacidade integral', 3),
  ('CID_CREAS_STATUS', 'creas_possui', 'texto',
   '{"funcionamento_regular":"SIM","funcionamento_parcial":"NAO","sem_especializado":"NAO","em_implantacao":"NAO","nao":"NAO"}',
   true, 'CREAS, Risco, Mapa, Território, Ficha municipal',
   'SIM somente para "funcionamento regular"; demais respostas conhecidas = NAO', 4),
  ('CID_CREAS_STATUS', 'creas_status', 'texto',
   '{"funcionamento_regular":"IMPLEMENTADO","funcionamento_parcial":"NAO_IMPLEMENTADO","sem_especializado":"NAO_IMPLEMENTADO","em_implantacao":"NAO_IMPLEMENTADO","nao":"NAO_IMPLEMENTADO"}',
   false, 'Ficha municipal', 'IMPLEMENTADO somente para "funcionamento regular"', 5),
  ('CID_CREAS_STATUS', 'fonte_base_creas', 'fonte', NULL,
   false, 'Ficha municipal', 'Procedência: Diagnóstico BRIGID, Promotoria e período publicados', 6),
  ('FLX_FORMAL', 'tem_fluxo_formal', 'texto',
   '{"formal_ato":"SIM","nao_formal":"NAO","elaboracao":"NAO","nao":"NAO"}',
   false, 'Diagnóstico da Rede (IMF), Relatórios', 'SIM somente para fluxo formalizado por ato normativo', 7),
  ('FLX_PROTOCOLO', 'tem_protocolo_local_regional', 'texto',
   '{"vigente":"SIM","desatualizado":"NAO","elaboracao":"NAO","nao":"NAO"}',
   false, 'Diagnóstico da Rede (IMF), Relatórios', 'SIM somente para protocolo vigente', 8),
  ('FLX_SALA', 'tem_sala_especializada', 'texto',
   '{"adequado":"SIM","parcial":"NAO","inadequado":"NAO","implantacao":"NAO","nao":"NAO"}',
   false, 'Diagnóstico da Rede (IER), Relatórios', 'SIM somente para funcionamento adequado', 9),
  ('FLX_PSICO', 'tem_atendimento_psicossocial', 'texto',
   '{"regular":"SIM","eventual":"NAO","encaminhamento":"NAO","implantacao":"NAO","nao":"NAO"}',
   false, 'Diagnóstico da Rede', 'SIM somente para atendimento regular', 10),
  ('SOC_PROTOCOLO', 'tem_protocolo_assistencial', 'texto',
   '{"vigente":"SIM","desatualizado":"NAO","elaboracao":"NAO","nao":"NAO"}',
   false, 'Diagnóstico da Rede (Assistência)', 'SIM somente para protocolo vigente', 11),
  ('SOC_FLUXO', 'tem_fluxo_encaminhamento', 'texto',
   '{"integrado":"SIM","parcialmente":"NAO","informal":"NAO","nao":"NAO"}',
   false, 'Diagnóstico da Rede (Assistência)', 'SIM somente para fluxo integrado', 12),
  ('SOC_ARTIC_CREAS', 'articulacao_creas_rede', 'texto',
   '{"formal_regular":"SIM","formal_irregular":"NAO","informal":"NAO","nenhuma":"NAO","sem_creas":"NAO"}',
   false, 'Diagnóstico da Rede (Assistência)', 'SIM somente para articulação formal e regular', 13),
  ('SOC_EQUIPE', 'tem_equipe_minima_creas', 'texto',
   '{"sim":"SIM","parcialmente":"NAO","nao":"NAO","nao_aplica":null}',
   false, 'Diagnóstico da Rede (Assistência)', 'SIM somente para equipe suficiente; "Não se aplica" não altera', 14),
  ('SOC_CAPACITA_QTD', 'profissionais_capacitados', 'inteiro', NULL,
   false, 'Diagnóstico da Rede (Assistência)', 'Quantidade inteira informada', 15),
  ('SEG_PROTO_INV', 'tem_protocolo_investigacao', 'texto',
   '{"sim_aplicado":"SIM","sim_parcial":"NAO","nao_aplicado":"NAO","elaboracao":"NAO","nao":"NAO"}',
   false, 'Diagnóstico da Rede (Investigação)', 'SIM somente para protocolo vigente e aplicado', 16),
  ('SEG_PROTO_PER', 'tem_protocolo_pericial', 'texto',
   '{"sim_aplicado":"SIM","sim_parcial":"NAO","nao_aplicado":"NAO","elaboracao":"NAO","nao":"NAO"}',
   false, 'Diagnóstico da Rede (Investigação)', 'SIM somente para protocolo aplicado regularmente', 17),
  ('SEG_CAPACITA', 'capacitado_perspectiva_genero', 'texto',
   '{"sim_recent":"SIM","sim_antigo":"NAO","eventual":"NAO","nao":"NAO"}',
   false, 'Diagnóstico da Rede (IQT), Relatórios', 'SIM somente para capacitação nos últimos 12 meses', 18),
  ('SEG_ADERENCIA', 'grau_aderencia_protocolo', 'texto',
   '{"adequada":"ALTO","parcialmente":"MEDIO","inadequada":"BAIXO","nao_avalia":null}',
   false, 'Diagnóstico da Rede (Investigação)', 'Adequada = ALTO, Parcial = MEDIO, Inadequada = BAIXO; "Não é possível avaliar" não altera', 19),
  ('GAR_LISTA', 'gargalos_identificados', 'lista_rotulos',
   '{"ausencia_protocolo":"Ausência de protocolo","protocolo_desatualizado":"Protocolo desatualizado","baixa_capacitacao":"Baixa capacitação","demora_investigacao":"Demora na investigação","demora_pericial":"Demora pericial","deficiencia_equipe":"Deficiência de equipe","acesso_vitima":"Dificuldade de acesso à vítima","comunicacao":"Falha de comunicação entre órgãos","ausencia_psicossocial":"Ausência de atendimento psicossocial","ausencia_creas":"Ausência de CREAS","ausencia_opm":"Ausência de OPM","falta_transporte":"Falta de transporte","falta_abrigo":"Falta de abrigo","ausencia_fluxo":"Ausência de fluxo de encaminhamento","falta_estrutura":"Falta de estrutura física","falta_dados":"Falta de dados / subnotificação","outro":"Outro"}',
   false, 'Diagnóstico da Rede (Gargalos)', 'Rótulos das opções marcadas; descrição livre não é publicada', 20),
  ('VIO_CONSUMADOS', 'feminicidios_consumados_informados', 'evento', '{"tipo_evento":"CONSUMADO"}',
   false, 'Ficha municipal (informado pela Promotoria, fora do score)',
   'Quantidade gravada em eventos_feminicidio com origem DIAGNOSTICO_MP e considera_no_score = false', 21),
  ('VIO_TENTADOS', 'feminicidios_tentados_informados', 'evento', '{"tipo_evento":"TENTADO"}',
   false, 'Ficha municipal (informado pela Promotoria, fora do score)',
   'Quantidade gravada em eventos_feminicidio com origem DIAGNOSTICO_MP e considera_no_score = false', 22);

-- -------------------------------------------------------------------------------------
-- 10. Base publicada: valores aprovados por município, campo e período (leitura pública)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostico_publicacoes (
    id BIGSERIAL PRIMARY KEY,
    diagnostico_id TEXT NOT NULL REFERENCES public.diagnostico_brigid(id),
    versao INT NOT NULL,
    codigo_ibge TEXT NOT NULL,
    promotoria_id TEXT NOT NULL,
    periodo_referencia TEXT NOT NULL,
    hash_conteudo TEXT NOT NULL,
    validado_por UUID NOT NULL,
    validado_em TIMESTAMPTZ NOT NULL,
    observacoes TEXT,
    publicado_por UUID NOT NULL,
    publicado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'publicada' CHECK (status IN ('publicada', 'substituida')),
    resultado JSONB NOT NULL DEFAULT '{}',
    UNIQUE (diagnostico_id, versao)
);

CREATE TABLE IF NOT EXISTS public.municipio_dados_publicados (
    id BIGSERIAL PRIMARY KEY,
    codigo_ibge TEXT NOT NULL REFERENCES public.municipios(codigo_ibge),
    campo_destino TEXT NOT NULL,
    periodo_referencia TEXT NOT NULL,
    valor TEXT,
    valor_original TEXT,
    codigo_dicionario TEXT NOT NULL,
    confiabilidade TEXT,
    fonte_informacao TEXT,
    data_referencia TEXT,
    carater TEXT NOT NULL CHECK (carater IN ('preliminar', 'definitivo')),
    promotoria_id TEXT NOT NULL,
    diagnostico_id TEXT NOT NULL,
    versao INT NOT NULL,
    publicacao_id BIGINT NOT NULL REFERENCES public.diagnostico_publicacoes(id),
    publicado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (codigo_ibge, campo_destino, periodo_referencia)
);

-- -------------------------------------------------------------------------------------
-- 11. Funções auxiliares (internas)
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._diagnostico_secoes_aplicaveis(p_atribuicao TEXT[])
RETURNS TEXT[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT ARRAY['identificacao']
    || CASE WHEN p_atribuicao && ARRAY['civel', 'cumulativa', 'unica']
            THEN ARRAY['cidadania', 'fluxos', 'socioassistencial'] ELSE ARRAY[]::text[] END
    || CASE WHEN p_atribuicao && ARRAY['criminal', 'cumulativa', 'unica']
            THEN ARRAY['penal_seguranca', 'penal_violencia', 'gargalos'] ELSE ARRAY[]::text[] END;
$$;

CREATE OR REPLACE FUNCTION public._diagnostico_campo_visivel(
  p_respostas JSONB, p_cond_campo TEXT, p_cond_valores TEXT[], p_cond_maior_que NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v TEXT;
BEGIN
  IF p_cond_campo IS NULL THEN RETURN true; END IF;
  v := btrim(COALESCE(p_respostas ->> p_cond_campo, ''));
  IF p_cond_valores IS NOT NULL THEN RETURN v = ANY (p_cond_valores); END IF;
  IF p_cond_maior_que IS NOT NULL THEN
    RETURN v ~ '^\d+$' AND v::numeric > p_cond_maior_que;
  END IF;
  RETURN true;
END;
$$;

-- Espelho de situacaoCampo() em src/lib/completude-diagnostico.ts
CREATE OR REPLACE FUNCTION public._diagnostico_situacao_campo(
  p_respostas JSONB, p_codigo TEXT, p_tipo TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  v JSONB := p_respostas -> p_codigo;
  t TEXT := btrim(COALESCE(p_respostas ->> p_codigo, ''));
BEGIN
  IF p_tipo = 'checkbox_group' THEN
    RETURN CASE WHEN jsonb_typeof(v) = 'array' AND jsonb_array_length(v) > 0
                THEN 'ok' ELSE 'sem_resposta' END;
  END IF;
  IF t = '' THEN RETURN 'sem_resposta'; END IF;
  IF t = 'nao_sabe' THEN
    RETURN CASE WHEN btrim(COALESCE(p_respostas ->> (p_codigo || '_JUSTIFICATIVA'), '')) <> ''
                THEN 'ok' ELSE 'sem_justificativa' END;
  END IF;
  IF p_tipo = 'number' AND t !~ '^\d+$' THEN RETURN 'valor_invalido'; END IF;
  RETURN 'ok';
END;
$$;

-- Espelho de calcularCompletude(): requisitos de identificação + campos obrigatórios aplicáveis
CREATE OR REPLACE FUNCTION public.diagnostico_completude(
  p_respostas JSONB, p_atribuicao TEXT[], p_promotoria_id TEXT, p_codigo_ibge TEXT, p_periodo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  secoes TEXT[] := public._diagnostico_secoes_aplicaveis(COALESCE(p_atribuicao, '{}'));
  total INT := 4;
  preenchidos INT := 0;
  pend JSONB := '[]'::jsonb;
  c RECORD;
  sit TEXT;
BEGIN
  IF COALESCE(p_promotoria_id, '') <> '' THEN preenchidos := preenchidos + 1;
  ELSE pend := pend || jsonb_build_object('codigo', 'promotoria_id', 'secao', 'identificacao', 'motivo', 'sem_resposta', 'rotulo', 'Promotoria respondente'); END IF;
  IF COALESCE(p_codigo_ibge, '') <> '' THEN preenchidos := preenchidos + 1;
  ELSE pend := pend || jsonb_build_object('codigo', 'codigo_ibge', 'secao', 'identificacao', 'motivo', 'sem_resposta', 'rotulo', 'Município avaliado'); END IF;
  IF COALESCE(array_length(p_atribuicao, 1), 0) > 0 THEN preenchidos := preenchidos + 1;
  ELSE pend := pend || jsonb_build_object('codigo', 'atribuicao', 'secao', 'identificacao', 'motivo', 'sem_resposta', 'rotulo', 'Atribuição funcional'); END IF;
  IF COALESCE(p_periodo, '') <> '' THEN preenchidos := preenchidos + 1;
  ELSE pend := pend || jsonb_build_object('codigo', 'periodo_referencia', 'secao', 'identificacao', 'motivo', 'sem_resposta', 'rotulo', 'Período de referência'); END IF;

  FOR c IN
    SELECT * FROM public.diagnostico_campos_regras
    WHERE obrigatorio AND secao = ANY (secoes)
    ORDER BY ordem
  LOOP
    IF NOT public._diagnostico_campo_visivel(p_respostas, c.cond_campo, c.cond_valores, c.cond_maior_que) THEN
      CONTINUE;
    END IF;
    total := total + 1;
    sit := public._diagnostico_situacao_campo(p_respostas, c.codigo, c.tipo_controle);
    IF sit = 'ok' THEN
      preenchidos := preenchidos + 1;
    ELSE
      pend := pend || jsonb_build_object('codigo', c.codigo, 'secao', c.secao, 'motivo', sit, 'rotulo', c.rotulo);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'percentual', (preenchidos * 100) / total,
    'total', total,
    'preenchidos', preenchidos,
    'pendencias', pend
  );
END;
$$;

-- Espelho de sanitizarRespostas(): só ficam respostas de campos aplicáveis e visíveis
CREATE OR REPLACE FUNCTION public._diagnostico_sanitizar(p_respostas JSONB, p_atribuicao TEXT[])
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  WITH aplicaveis AS (
    SELECT c.codigo
    FROM public.diagnostico_campos_regras c
    WHERE c.secao = ANY (public._diagnostico_secoes_aplicaveis(COALESCE(p_atribuicao, '{}')))
      AND public._diagnostico_campo_visivel(p_respostas, c.cond_campo, c.cond_valores, c.cond_maior_que)
      AND p_respostas ? c.codigo
      AND jsonb_typeof(p_respostas -> c.codigo) <> 'null'
      AND COALESCE(p_respostas ->> c.codigo, '') <> ''
  )
  SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
  FROM (
    SELECT a.codigo AS k, p_respostas -> a.codigo AS v FROM aplicaveis a
    UNION ALL
    SELECT a.codigo || '_JUSTIFICATIVA', p_respostas -> (a.codigo || '_JUSTIFICATIVA')
    FROM aplicaveis a
    WHERE btrim(p_respostas ->> a.codigo) = 'nao_sabe'
      AND btrim(COALESCE(p_respostas ->> (a.codigo || '_JUSTIFICATIVA'), '')) <> ''
  ) s;
$$;

CREATE OR REPLACE FUNCTION public._diagnostico_hash(p_respostas JSONB, p_atribuicao TEXT[])
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT md5(jsonb_build_object('atribuicao', to_jsonb(COALESCE(p_atribuicao, '{}')), 'respostas', p_respostas)::text);
$$;

-- Ciclo aberto: anos a partir de 2026 são preliminares (ver RISK_MODEL_CONFIG.anosParciais)
CREATE OR REPLACE FUNCTION public._diagnostico_carater(p_periodo TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE WHEN p_periodo ~ '^\d{4}' AND left(p_periodo, 4)::int >= 2026
              THEN 'preliminar' ELSE 'definitivo' END;
$$;

CREATE OR REPLACE FUNCTION public._diagnostico_auditar(
  p_diagnostico_id TEXT, p_versao INT, p_acao TEXT, p_anterior JSONB, p_novo JSONB
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  INSERT INTO public.diagnostico_auditoria (diagnostico_id, versao, usuario_id, acao, valor_anterior, valor_novo)
  VALUES (p_diagnostico_id, p_versao, auth.uid()::text, p_acao, p_anterior, p_novo);
$$;

-- Itens que uma versão publicaria, já convertidos pelas regras de mapeamento.
-- "ignorado" explica por que o item não altera a base (o valor publicado é mantido).
CREATE OR REPLACE FUNCTION public._diagnostico_itens_publicaveis(p_diagnostico_id TEXT, p_versao INT)
RETURNS TABLE (
  codigo TEXT, campo_destino TEXT, tipo_destino TEXT, secao TEXT, periodo TEXT,
  valor TEXT, valor_original TEXT, afeta_score BOOLEAN, painel TEXT,
  confiabilidade TEXT, fonte_informacao TEXT, data_referencia TEXT, ignorado TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.diagnostico_brigid;
  r JSONB;
  m RECORD;
  prefixo TEXT;
  orig TEXT;
  promotoria_nome TEXT;
BEGIN
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = p_diagnostico_id;
  SELECT v.respostas INTO r FROM public.diagnostico_versoes v
  WHERE v.diagnostico_id = p_diagnostico_id AND v.numero = p_versao;
  IF d.id IS NULL OR r IS NULL THEN RAISE EXCEPTION 'Diagnóstico ou versão inexistente.'; END IF;
  SELECT p.nome INTO promotoria_nome FROM public.promotorias_justica p WHERE p.id = d.promotoria_id;

  FOR m IN
    SELECT mp.*, c.secao AS c_secao, c.cond_campo, c.cond_valores, c.cond_maior_que
    FROM public.diagnostico_mapeamento_publicacao mp
    JOIN public.diagnostico_campos_regras c ON c.codigo = mp.codigo
    WHERE c.secao = ANY (public._diagnostico_secoes_aplicaveis(d.atribuicao))
    ORDER BY mp.ordem
  LOOP
    IF NOT public._diagnostico_campo_visivel(r, m.cond_campo, m.cond_valores, m.cond_maior_que) THEN
      CONTINUE;
    END IF;

    prefixo := CASE m.c_secao
      WHEN 'cidadania' THEN 'CID' WHEN 'fluxos' THEN 'FLX' WHEN 'socioassistencial' THEN 'SOC'
      WHEN 'penal_seguranca' THEN 'SEG' WHEN 'penal_violencia' THEN 'VIO' WHEN 'gargalos' THEN 'GAR'
      ELSE 'IDEN' END;

    codigo := m.codigo;
    campo_destino := m.campo_destino;
    tipo_destino := m.tipo_destino;
    secao := m.c_secao;
    afeta_score := m.afeta_score;
    painel := m.painel;
    confiabilidade := r ->> (prefixo || '_CONFIABILIDADE');
    fonte_informacao := r ->> (prefixo || '_FONTE');
    data_referencia := r ->> (prefixo || '_DATA_REF');
    periodo := d.periodo_referencia;
    valor := NULL;
    ignorado := NULL;

    IF m.tipo_destino = 'lista_rotulos' THEN
      valor_original := (r -> m.codigo)::text;
      IF jsonb_typeof(r -> m.codigo) <> 'array' OR jsonb_array_length(r -> m.codigo) = 0 THEN
        ignorado := 'Sem resposta';
      ELSE
        SELECT string_agg(m.regra ->> e.value, '; ' ORDER BY e.ordinality)
        INTO valor
        FROM jsonb_array_elements_text(r -> m.codigo) WITH ORDINALITY AS e(value, ordinality)
        WHERE m.regra ? e.value;
      END IF;
      RETURN NEXT;
      CONTINUE;
    END IF;

    orig := btrim(COALESCE(r ->> m.codigo, ''));
    valor_original := NULLIF(orig, '');

    IF orig = '' THEN
      ignorado := 'Sem resposta';
    ELSIF orig = 'nao_sabe' THEN
      ignorado := 'Não soube informar: o valor publicado é mantido';
    ELSIF m.tipo_destino = 'texto' THEN
      IF NOT (m.regra ? orig) THEN
        ignorado := 'Resposta sem regra de conversão';
      ELSIF jsonb_typeof(m.regra -> orig) = 'null' THEN
        ignorado := 'Não se aplica / não avaliável: o valor publicado é mantido';
      ELSE
        valor := m.regra ->> orig;
      END IF;
    ELSIF m.tipo_destino IN ('inteiro', 'evento') THEN
      IF orig !~ '^\d+$' THEN
        ignorado := 'Quantidade inválida';
      ELSE
        valor := orig;
        IF m.tipo_destino = 'evento' THEN
          periodo := btrim(COALESCE(r ->> 'VIO_ANO', ''));
          IF periodo !~ '^\d{4}$' THEN ignorado := 'Ano de referência ausente'; valor := NULL; END IF;
        END IF;
      END IF;
    ELSIF m.tipo_destino = 'fonte' THEN
      valor := 'Diagnóstico BRIGID — ' || COALESCE(promotoria_nome, d.promotoria_id)
               || ' — período ' || d.periodo_referencia;
      valor_original := NULL;
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$$;

-- -------------------------------------------------------------------------------------
-- 12. Ações do Promotor (vínculo obrigatório com a Promotoria do diagnóstico)
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.meus_vinculos()
RETURNS TABLE (promotoria_id TEXT, nome TEXT, comarca_sede TEXT, tipo_atribuicao TEXT, nome_responsavel TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id, p.nome, p.comarca_sede, p.tipo_atribuicao, u.nome_responsavel
  FROM public.usuarios_promotoria u
  JOIN public.promotorias_justica p ON p.id = u.promotoria_id
  WHERE u.user_id = auth.uid() AND u.ativo
  ORDER BY p.nome;
$$;

CREATE OR REPLACE FUNCTION public.diagnostico_criar(
  p_promotoria_id TEXT, p_codigo_ibge TEXT, p_periodo TEXT, p_atribuicao TEXT[] DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  p public.promotorias_justica;
  atrib TEXT[];
  existente TEXT;
  novo_id TEXT;
  responsavel TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação obrigatória.'; END IF;
  IF NOT public.usuario_vinculado(p_promotoria_id) THEN
    RAISE EXCEPTION 'Usuário não vinculado a esta Promotoria de Justiça.';
  END IF;

  SELECT * INTO p FROM public.promotorias_justica WHERE id = p_promotoria_id;
  IF NOT EXISTS (
    SELECT 1 FROM public.promotoria_municipios
    WHERE promotoria_id = p_promotoria_id AND codigo_ibge = p_codigo_ibge AND COALESCE(ativo, true)
  ) THEN
    RAISE EXCEPTION 'O município informado não integra a abrangência desta Promotoria.';
  END IF;

  IF COALESCE(p_periodo, '') !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'Período de referência inválido.';
  END IF;

  IF p.tipo_atribuicao IS NOT NULL AND p.tipo_atribuicao <> 'pendente_configuracao' THEN
    atrib := ARRAY[p.tipo_atribuicao];
  ELSIF array_length(p_atribuicao, 1) = 1
        AND p_atribuicao[1] IN ('civel', 'criminal', 'cumulativa', 'unica') THEN
    atrib := p_atribuicao;
  ELSE
    RAISE EXCEPTION 'Informe a atribuição funcional da Promotoria.';
  END IF;

  SELECT id INTO existente FROM public.diagnostico_brigid
  WHERE promotoria_id = p_promotoria_id AND codigo_ibge = p_codigo_ibge
    AND periodo_referencia = p_periodo;
  IF existente IS NOT NULL THEN
    RAISE EXCEPTION 'DIAGNOSTICO_EXISTENTE:%', existente;
  END IF;

  SELECT nome_responsavel INTO responsavel FROM public.usuarios_promotoria
  WHERE user_id = auth.uid() AND promotoria_id = p_promotoria_id;

  INSERT INTO public.diagnostico_brigid (
    codigo_ibge, promotoria_id, usuario_id, status, atribuicao, periodo_referencia,
    responsavel_id, responsavel_nome, versao_atual
  ) VALUES (
    p_codigo_ibge, p_promotoria_id, auth.uid()::text, 'em_preenchimento', atrib, p_periodo,
    auth.uid(), responsavel, 1
  ) RETURNING id INTO novo_id;

  INSERT INTO public.diagnostico_versoes (diagnostico_id, numero, status, respostas, hash_conteudo, criado_por, atualizado_por)
  VALUES (novo_id, 1, 'em_preenchimento', '{}', public._diagnostico_hash('{}', atrib), auth.uid(), auth.uid());

  PERFORM public._diagnostico_auditar(novo_id, 1, 'criacao', NULL,
    jsonb_build_object('promotoria_id', p_promotoria_id, 'codigo_ibge', p_codigo_ibge,
                       'periodo_referencia', p_periodo, 'atribuicao', atrib));
  RETURN novo_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.diagnostico_salvar_rascunho(
  p_id TEXT, p_respostas JSONB, p_atribuicao TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.diagnostico_brigid;
  v public.diagnostico_versoes;
  atrib TEXT[];
  limpas JSONB;
  comp JSONB;
  tipo_promotoria TEXT;
BEGIN
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = p_id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Diagnóstico não encontrado.'; END IF;
  IF NOT public.usuario_vinculado(d.promotoria_id) THEN
    RAISE EXCEPTION 'Usuário não vinculado a esta Promotoria de Justiça.';
  END IF;

  SELECT * INTO v FROM public.diagnostico_versoes
  WHERE diagnostico_id = p_id AND numero = d.versao_atual FOR UPDATE;
  IF v.status NOT IN ('em_preenchimento', 'devolvido') THEN
    RAISE EXCEPTION 'Esta versão não pode ser editada (situação: %).', v.status;
  END IF;

  atrib := d.atribuicao;
  IF p_atribuicao IS NOT NULL AND p_atribuicao IS DISTINCT FROM d.atribuicao THEN
    SELECT tipo_atribuicao INTO tipo_promotoria FROM public.promotorias_justica WHERE id = d.promotoria_id;
    IF tipo_promotoria <> 'pendente_configuracao' OR v.status <> 'em_preenchimento' THEN
      RAISE EXCEPTION 'A atribuição funcional não pode ser alterada neste diagnóstico.';
    END IF;
    IF NOT (array_length(p_atribuicao, 1) = 1
            AND p_atribuicao[1] IN ('civel', 'criminal', 'cumulativa', 'unica')) THEN
      RAISE EXCEPTION 'Atribuição funcional inválida.';
    END IF;
    atrib := p_atribuicao;
  END IF;

  limpas := public._diagnostico_sanitizar(COALESCE(p_respostas, '{}'), atrib);
  comp := public.diagnostico_completude(limpas, atrib, d.promotoria_id, d.codigo_ibge, d.periodo_referencia);

  UPDATE public.diagnostico_versoes SET
    respostas = limpas,
    hash_conteudo = public._diagnostico_hash(limpas, atrib),
    percentual_preenchimento = (comp ->> 'percentual')::int,
    atualizado_em = now(),
    atualizado_por = auth.uid()
  WHERE id = v.id;

  UPDATE public.diagnostico_brigid SET
    atribuicao = atrib,
    percentual_preenchimento = (comp ->> 'percentual')::int,
    data_atualizacao = now()
  WHERE id = p_id;

  PERFORM public._diagnostico_auditar(p_id, v.numero, 'rascunho_salvo', NULL,
    jsonb_build_object('percentual', comp -> 'percentual', 'hash', public._diagnostico_hash(limpas, atrib)));
  RETURN comp;
END;
$$;

CREATE OR REPLACE FUNCTION public.diagnostico_enviar(p_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.diagnostico_brigid;
  v public.diagnostico_versoes;
  comp JSONB;
BEGIN
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = p_id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Diagnóstico não encontrado.'; END IF;
  IF NOT public.usuario_vinculado(d.promotoria_id) THEN
    RAISE EXCEPTION 'Usuário não vinculado a esta Promotoria de Justiça.';
  END IF;

  SELECT * INTO v FROM public.diagnostico_versoes
  WHERE diagnostico_id = p_id AND numero = d.versao_atual FOR UPDATE;
  IF v.status NOT IN ('em_preenchimento', 'devolvido') THEN
    RAISE EXCEPTION 'Esta versão não pode ser enviada (situação: %).', v.status;
  END IF;

  comp := public.diagnostico_completude(v.respostas, d.atribuicao, d.promotoria_id, d.codigo_ibge, d.periodo_referencia);
  IF (comp ->> 'percentual')::int < 100 THEN
    RAISE EXCEPTION 'O diagnóstico possui % pendência(s) obrigatória(s) e não pode ser enviado.',
      jsonb_array_length(comp -> 'pendencias');
  END IF;

  UPDATE public.diagnostico_versoes SET status = 'enviado', enviado_em = now(), enviado_por = auth.uid()
  WHERE id = v.id;
  UPDATE public.diagnostico_brigid SET status = 'enviado', data_envio = now(), data_atualizacao = now()
  WHERE id = p_id;
  PERFORM public._diagnostico_auditar(p_id, v.numero, 'envio_analise', jsonb_build_object('status', v.status),
    jsonb_build_object('status', 'enviado', 'hash', v.hash_conteudo));
END;
$$;

-- Nova versão a partir da última publicada (a versão pública anterior continua valendo)
CREATE OR REPLACE FUNCTION public.diagnostico_nova_versao(p_id TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.diagnostico_brigid;
  v public.diagnostico_versoes;
BEGIN
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = p_id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Diagnóstico não encontrado.'; END IF;
  IF NOT public.usuario_vinculado(d.promotoria_id) THEN
    RAISE EXCEPTION 'Usuário não vinculado a esta Promotoria de Justiça.';
  END IF;
  SELECT * INTO v FROM public.diagnostico_versoes WHERE diagnostico_id = p_id AND numero = d.versao_atual;
  IF v.status <> 'publicado' THEN
    RAISE EXCEPTION 'Só é possível abrir nova versão após a publicação da versão atual.';
  END IF;

  INSERT INTO public.diagnostico_versoes (diagnostico_id, numero, status, respostas, hash_conteudo,
    percentual_preenchimento, criado_por, atualizado_por)
  VALUES (p_id, v.numero + 1, 'em_preenchimento', v.respostas, v.hash_conteudo,
    v.percentual_preenchimento, auth.uid(), auth.uid());

  UPDATE public.diagnostico_brigid SET versao_atual = v.numero + 1, status = 'em_preenchimento',
    data_atualizacao = now() WHERE id = p_id;
  PERFORM public._diagnostico_auditar(p_id, v.numero + 1, 'nova_versao', jsonb_build_object('versao_base', v.numero), NULL);
  RETURN v.numero + 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.diagnostico_registrar_anexo(
  p_id TEXT, p_secao TEXT, p_nome TEXT, p_storage_path TEXT, p_tamanho BIGINT, p_mime TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.diagnostico_brigid;
  st TEXT;
  novo BIGINT;
BEGIN
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = p_id;
  IF d.id IS NULL OR NOT public.usuario_vinculado(d.promotoria_id) THEN
    RAISE EXCEPTION 'Usuário não vinculado a esta Promotoria de Justiça.';
  END IF;
  SELECT status INTO st FROM public.diagnostico_versoes WHERE diagnostico_id = p_id AND numero = d.versao_atual;
  IF st NOT IN ('em_preenchimento', 'devolvido') THEN
    RAISE EXCEPTION 'Anexos só podem ser incluídos enquanto o diagnóstico está em preenchimento.';
  END IF;
  IF split_part(p_storage_path, '/', 1) <> p_id THEN
    RAISE EXCEPTION 'Caminho de anexo inválido.';
  END IF;
  INSERT INTO public.diagnostico_anexos (diagnostico_id, versao, secao, nome_arquivo, storage_path,
    tamanho_bytes, tipo_mime, enviado_por)
  VALUES (p_id, d.versao_atual, p_secao, p_nome, p_storage_path, p_tamanho, p_mime, auth.uid())
  RETURNING id INTO novo;
  PERFORM public._diagnostico_auditar(p_id, d.versao_atual, 'anexo_incluido', NULL,
    jsonb_build_object('anexo_id', novo, 'nome', p_nome, 'secao', p_secao));
  RETURN novo;
END;
$$;

CREATE OR REPLACE FUNCTION public.diagnostico_remover_anexo(p_anexo_id BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  a public.diagnostico_anexos;
  d public.diagnostico_brigid;
  st TEXT;
BEGIN
  SELECT * INTO a FROM public.diagnostico_anexos WHERE id = p_anexo_id;
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = a.diagnostico_id;
  IF d.id IS NULL OR NOT public.usuario_vinculado(d.promotoria_id) THEN
    RAISE EXCEPTION 'Usuário não vinculado a esta Promotoria de Justiça.';
  END IF;
  SELECT status INTO st FROM public.diagnostico_versoes WHERE diagnostico_id = d.id AND numero = d.versao_atual;
  IF st NOT IN ('em_preenchimento', 'devolvido') OR a.versao <> d.versao_atual THEN
    RAISE EXCEPTION 'Este anexo não pode mais ser removido.';
  END IF;
  DELETE FROM public.diagnostico_anexos WHERE id = p_anexo_id;
  PERFORM public._diagnostico_auditar(d.id, d.versao_atual, 'anexo_removido', jsonb_build_object('anexo_id', a.id, 'nome', a.nome_arquivo), NULL);
  RETURN a.storage_path;
END;
$$;

-- -------------------------------------------------------------------------------------
-- 13. Ações do CAOCRIM (somente is_admin())
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._exigir_admin()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Ação restrita ao CAOCRIM.' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.diagnostico_iniciar_analise(p_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.diagnostico_brigid;
BEGIN
  PERFORM public._exigir_admin();
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = p_id FOR UPDATE;
  UPDATE public.diagnostico_versoes SET status = 'em_analise', analise_iniciada_em = now(), analise_por = auth.uid()
  WHERE diagnostico_id = p_id AND numero = d.versao_atual AND status = 'enviado';
  IF NOT FOUND THEN RAISE EXCEPTION 'Somente diagnósticos enviados podem entrar em análise.'; END IF;
  UPDATE public.diagnostico_brigid SET status = 'em_analise', data_atualizacao = now() WHERE id = p_id;
  PERFORM public._diagnostico_auditar(p_id, d.versao_atual, 'analise_iniciada', NULL, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.diagnostico_registrar_observacao(
  p_id TEXT, p_versao INT, p_secao TEXT, p_campo TEXT, p_texto TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  novo BIGINT;
BEGIN
  PERFORM public._exigir_admin();
  IF btrim(COALESCE(p_texto, '')) = '' THEN RAISE EXCEPTION 'Informe o texto da observação.'; END IF;
  INSERT INTO public.diagnostico_observacoes (diagnostico_id, versao, tipo, secao, campo_codigo, texto, visivel_respondente, autor_id)
  VALUES (p_id, p_versao, 'analise', p_secao, p_campo, p_texto, false, auth.uid())
  RETURNING id INTO novo;
  RETURN novo;
END;
$$;

-- p_observacoes: [{"secao": "...", "campo_codigo": "...", "texto": "..."}] vinculadas a blocos/campos
CREATE OR REPLACE FUNCTION public.diagnostico_devolver(
  p_id TEXT, p_versao INT, p_motivo TEXT, p_observacoes JSONB DEFAULT '[]'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.diagnostico_brigid;
  o JSONB;
BEGIN
  PERFORM public._exigir_admin();
  IF btrim(COALESCE(p_motivo, '')) = '' THEN RAISE EXCEPTION 'Informe o motivo da devolução.'; END IF;
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = p_id FOR UPDATE;
  IF d.versao_atual <> p_versao THEN RAISE EXCEPTION 'A versão informada não é a versão em análise.'; END IF;

  UPDATE public.diagnostico_versoes SET status = 'devolvido', devolvido_em = now(), devolvido_por = auth.uid(),
    motivo_devolucao = p_motivo
  WHERE diagnostico_id = p_id AND numero = p_versao AND status IN ('enviado', 'em_analise');
  IF NOT FOUND THEN RAISE EXCEPTION 'Somente diagnósticos enviados ou em análise podem ser devolvidos.'; END IF;

  INSERT INTO public.diagnostico_observacoes (diagnostico_id, versao, tipo, secao, campo_codigo, texto, visivel_respondente, autor_id)
  VALUES (p_id, p_versao, 'devolucao', NULL, NULL, p_motivo, true, auth.uid());
  FOR o IN SELECT * FROM jsonb_array_elements(COALESCE(p_observacoes, '[]'))
  LOOP
    IF btrim(COALESCE(o ->> 'texto', '')) <> '' THEN
      INSERT INTO public.diagnostico_observacoes (diagnostico_id, versao, tipo, secao, campo_codigo, texto, visivel_respondente, autor_id)
      VALUES (p_id, p_versao, 'devolucao', o ->> 'secao', o ->> 'campo_codigo', o ->> 'texto', true, auth.uid());
    END IF;
  END LOOP;

  UPDATE public.diagnostico_brigid SET status = 'devolvido', data_atualizacao = now() WHERE id = p_id;
  PERFORM public._diagnostico_auditar(p_id, p_versao, 'devolucao', NULL, jsonb_build_object('motivo', p_motivo));
END;
$$;

-- Prévia: o que a versão alteraria na base pública, comparado ao que está publicado
CREATE OR REPLACE FUNCTION public.diagnostico_previa_publicacao(p_id TEXT, p_versao INT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.diagnostico_brigid;
  i RECORD;
  atual TEXT;
  existente RECORD;
  mais_recente TEXT;
  itens JSONB := '[]'::jsonb;
  mun_id TEXT;
BEGIN
  PERFORM public._exigir_admin();
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = p_id;
  SELECT id INTO mun_id FROM public.municipios WHERE codigo_ibge = d.codigo_ibge;

  FOR i IN SELECT * FROM public._diagnostico_itens_publicaveis(p_id, p_versao)
  LOOP
    atual := NULL;
    IF i.tipo_destino = 'evento' THEN
      IF i.periodo ~ '^\d{4}$' THEN
        SELECT sum(e.quantidade)::text INTO atual FROM public.eventos_feminicidio e
        WHERE e.municipio_id = mun_id AND e.ano_fato = i.periodo::int AND e.origem_dado = 'DIAGNOSTICO_MP'
          AND e.tipo_evento = CASE WHEN i.codigo = 'VIO_CONSUMADOS' THEN 'CONSUMADO' ELSE 'TENTADO' END;
      END IF;
    ELSE
      EXECUTE format('SELECT %I::text FROM public.municipios WHERE codigo_ibge = $1', i.campo_destino)
        INTO atual USING d.codigo_ibge;
    END IF;

    SELECT mdp.valor, mdp.diagnostico_id, mdp.promotoria_id, p.nome AS promotoria_nome, mdp.versao
      INTO existente
    FROM public.municipio_dados_publicados mdp
    LEFT JOIN public.promotorias_justica p ON p.id = mdp.promotoria_id
    WHERE mdp.codigo_ibge = d.codigo_ibge AND mdp.campo_destino = i.campo_destino
      AND mdp.periodo_referencia = i.periodo;

    SELECT max(mdp.periodo_referencia) INTO mais_recente FROM public.municipio_dados_publicados mdp
    WHERE mdp.codigo_ibge = d.codigo_ibge AND mdp.campo_destino = i.campo_destino;

    itens := itens || jsonb_build_object(
      'codigo', i.codigo,
      'campo_destino', i.campo_destino,
      'tipo_destino', i.tipo_destino,
      'secao', i.secao,
      'periodo', i.periodo,
      'valor_publicado_atual', atual,
      'valor_novo', i.valor,
      'valor_original', i.valor_original,
      'afeta_score', i.afeta_score,
      'painel', i.painel,
      'confiabilidade', i.confiabilidade,
      'carater', public._diagnostico_carater(i.periodo),
      'ignorado', i.ignorado,
      'altera', i.ignorado IS NULL AND i.valor IS DISTINCT FROM atual,
      'atualiza_painel', i.ignorado IS NULL AND (i.tipo_destino = 'evento' OR mais_recente IS NULL OR i.periodo >= mais_recente),
      'conflito', CASE
        WHEN i.ignorado IS NULL AND existente.diagnostico_id IS NOT NULL
             AND existente.diagnostico_id <> p_id AND existente.valor IS DISTINCT FROM i.valor
        THEN jsonb_build_object('promotoria', COALESCE(existente.promotoria_nome, existente.promotoria_id),
                                'valor', existente.valor, 'diagnostico_id', existente.diagnostico_id)
        ELSE NULL END
    );
  END LOOP;

  RETURN jsonb_build_object(
    'diagnostico_id', d.id, 'versao', p_versao, 'codigo_ibge', d.codigo_ibge,
    'periodo_referencia', d.periodo_referencia, 'carater', public._diagnostico_carater(d.periodo_referencia),
    'itens', itens
  );
END;
$$;

-- Núcleo da publicação. Executado sempre dentro de uma transação (bloco com EXCEPTION
-- na função chamadora): ou tudo é gravado, ou nada muda na base pública.
CREATE OR REPLACE FUNCTION public._diagnostico_aplicar_publicacao(
  p_id TEXT, p_versao INT, p_confirmar_conflitos TEXT[]
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.diagnostico_brigid;
  v public.diagnostico_versoes;
  prev JSONB;
  i JSONB;
  pub_id BIGINT;
  mun_id TEXT;
  col_tipo TEXT;
  aplicados INT := 0;
  ignorados INT := 0;
BEGIN
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = p_id;
  SELECT * INTO v FROM public.diagnostico_versoes WHERE diagnostico_id = p_id AND numero = p_versao;

  -- Idempotência: a mesma versão publicada de novo não altera nada
  SELECT id INTO pub_id FROM public.diagnostico_publicacoes WHERE diagnostico_id = p_id AND versao = p_versao;
  IF pub_id IS NOT NULL THEN RETURN pub_id; END IF;

  prev := public.diagnostico_previa_publicacao(p_id, p_versao);

  FOR i IN SELECT * FROM jsonb_array_elements(prev -> 'itens')
  LOOP
    IF jsonb_typeof(i -> 'conflito') = 'object'
       AND NOT ((i ->> 'campo_destino') = ANY (COALESCE(p_confirmar_conflitos, '{}'))) THEN
      RAISE EXCEPTION 'CONFLITO: o campo % já possui valor aprovado de outra unidade (%) para o período %. Confirme a substituição expressamente.',
        i ->> 'campo_destino', i -> 'conflito' ->> 'promotoria', i ->> 'periodo';
    END IF;
  END LOOP;

  INSERT INTO public.diagnostico_publicacoes (diagnostico_id, versao, codigo_ibge, promotoria_id, periodo_referencia,
    hash_conteudo, validado_por, validado_em, observacoes, publicado_por)
  VALUES (p_id, p_versao, d.codigo_ibge, d.promotoria_id, d.periodo_referencia,
    v.hash_conteudo, v.validado_por, v.validado_em, v.observacoes_validacao, auth.uid())
  RETURNING id INTO pub_id;

  SELECT id INTO mun_id FROM public.municipios WHERE codigo_ibge = d.codigo_ibge;

  FOR i IN SELECT * FROM jsonb_array_elements(prev -> 'itens')
  LOOP
    IF i ->> 'ignorado' IS NOT NULL THEN
      ignorados := ignorados + 1;
      CONTINUE;
    END IF;

    INSERT INTO public.municipio_dados_publicados AS t (codigo_ibge, campo_destino, periodo_referencia, valor,
      valor_original, codigo_dicionario, confiabilidade, fonte_informacao, data_referencia, carater,
      promotoria_id, diagnostico_id, versao, publicacao_id, publicado_em)
    SELECT d.codigo_ibge, i ->> 'campo_destino', i ->> 'periodo', i ->> 'valor_novo', i ->> 'valor_original',
      i ->> 'codigo', i ->> 'confiabilidade', it.fonte_informacao, it.data_referencia, i ->> 'carater',
      d.promotoria_id, p_id, p_versao, pub_id, now()
    FROM public._diagnostico_itens_publicaveis(p_id, p_versao) it
    WHERE it.campo_destino = i ->> 'campo_destino'
    ON CONFLICT (codigo_ibge, campo_destino, periodo_referencia) DO UPDATE SET
      valor = EXCLUDED.valor, valor_original = EXCLUDED.valor_original,
      codigo_dicionario = EXCLUDED.codigo_dicionario, confiabilidade = EXCLUDED.confiabilidade,
      fonte_informacao = EXCLUDED.fonte_informacao, data_referencia = EXCLUDED.data_referencia,
      carater = EXCLUDED.carater, promotoria_id = EXCLUDED.promotoria_id,
      diagnostico_id = EXCLUDED.diagnostico_id, versao = EXCLUDED.versao,
      publicacao_id = EXCLUDED.publicacao_id, publicado_em = EXCLUDED.publicado_em;

    IF i ->> 'tipo_destino' = 'evento' THEN
      DELETE FROM public.eventos_feminicidio
      WHERE municipio_id = mun_id AND ano_fato = (i ->> 'periodo')::int AND origem_dado = 'DIAGNOSTICO_MP'
        AND tipo_evento = CASE WHEN i ->> 'codigo' = 'VIO_CONSUMADOS' THEN 'CONSUMADO' ELSE 'TENTADO' END;
      INSERT INTO public.eventos_feminicidio (municipio_id, ano_fato, tipo_evento, quantidade, origem_dado,
        status_periodo, considera_no_score, versao_metodologia, publicacao_id)
      VALUES (mun_id, (i ->> 'periodo')::int,
        CASE WHEN i ->> 'codigo' = 'VIO_CONSUMADOS' THEN 'CONSUMADO' ELSE 'TENTADO' END,
        (i ->> 'valor_novo')::int, 'DIAGNOSTICO_MP',
        CASE WHEN public._diagnostico_carater(i ->> 'periodo') = 'preliminar' THEN 'parcial_corrente' ELSE 'janela_oficial' END,
        false, 'risco_v3_2023_2025', pub_id);
    ELSIF (i ->> 'atualiza_painel')::boolean THEN
      SELECT format_type(a.atttypid, a.atttypmod) INTO col_tipo
      FROM pg_attribute a
      WHERE a.attrelid = 'public.municipios'::regclass AND a.attname = i ->> 'campo_destino' AND NOT a.attisdropped;
      IF col_tipo IS NULL THEN
        RAISE EXCEPTION 'Campo de destino inexistente na base consolidada: %', i ->> 'campo_destino';
      END IF;
      EXECUTE format('UPDATE public.municipios SET %I = $1::%s WHERE codigo_ibge = $2', i ->> 'campo_destino', col_tipo)
        USING i ->> 'valor_novo', d.codigo_ibge;
    END IF;
    aplicados := aplicados + 1;
  END LOOP;

  -- Versão publicada anterior deste diagnóstico passa a "substituída"
  UPDATE public.diagnostico_publicacoes SET status = 'substituida'
  WHERE diagnostico_id = p_id AND versao <> p_versao AND status = 'publicada';
  UPDATE public.diagnostico_versoes SET status = 'substituido', substituido_em = now()
  WHERE diagnostico_id = p_id AND numero <> p_versao AND status = 'publicado';

  UPDATE public.diagnostico_versoes SET status = 'publicado', publicado_em = now(), publicado_por = auth.uid()
  WHERE id = v.id;
  UPDATE public.diagnostico_brigid SET status = 'publicado', versao_publicada = p_versao, data_atualizacao = now()
  WHERE id = p_id;

  UPDATE public.diagnostico_publicacoes
  SET resultado = jsonb_build_object('situacao', 'sucesso', 'itens_aplicados', aplicados, 'itens_ignorados', ignorados)
  WHERE id = pub_id;

  PERFORM public._diagnostico_auditar(p_id, p_versao, 'publicacao', NULL,
    jsonb_build_object('publicacao_id', pub_id, 'itens_aplicados', aplicados, 'itens_ignorados', ignorados,
                       'conflitos_confirmados', to_jsonb(COALESCE(p_confirmar_conflitos, '{}'))));
  RETURN pub_id;
END;
$$;

CREATE OR REPLACE FUNCTION public._diagnostico_publicar_seguro(p_id TEXT, p_versao INT, p_confirmar TEXT[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  pub_id BIGINT;
BEGIN
  BEGIN
    pub_id := public._diagnostico_aplicar_publicacao(p_id, p_versao, p_confirmar);
    RETURN jsonb_build_object('ok', true, 'publicacao_id', pub_id);
  EXCEPTION WHEN OTHERS THEN
    -- Tudo o que a publicação gravou é desfeito (savepoint); a base pública anterior é preservada
    PERFORM public._diagnostico_auditar(p_id, p_versao, 'publicacao_falhou', NULL, jsonb_build_object('erro', SQLERRM));
    RETURN jsonb_build_object('ok', false, 'erro', SQLERRM);
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.diagnostico_validar_e_publicar(
  p_id TEXT, p_versao INT, p_hash TEXT, p_observacoes TEXT DEFAULT NULL, p_confirmar_conflitos TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.diagnostico_brigid;
  v public.diagnostico_versoes;
  comp JSONB;
  prev JSONB;
  i JSONB;
BEGIN
  PERFORM public._exigir_admin();
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = p_id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Diagnóstico não encontrado.'; END IF;
  SELECT * INTO v FROM public.diagnostico_versoes WHERE diagnostico_id = p_id AND numero = p_versao FOR UPDATE;

  IF v.id IS NULL OR p_versao <> d.versao_atual THEN
    RAISE EXCEPTION 'A versão informada não é a versão atual do diagnóstico.';
  END IF;
  IF v.status <> 'em_analise' THEN
    RAISE EXCEPTION 'Somente versões em análise pelo CAOCRIM podem ser validadas (situação: %).', v.status;
  END IF;
  -- Impede aprovar conteúdo diferente do que foi revisado na tela
  IF p_hash IS DISTINCT FROM v.hash_conteudo
     OR v.hash_conteudo <> public._diagnostico_hash(v.respostas, d.atribuicao) THEN
    RAISE EXCEPTION 'O conteúdo do diagnóstico mudou desde a revisão. Recarregue e revise novamente.';
  END IF;

  comp := public.diagnostico_completude(v.respostas, d.atribuicao, d.promotoria_id, d.codigo_ibge, d.periodo_referencia);
  IF (comp ->> 'percentual')::int < 100 THEN
    RAISE EXCEPTION 'Diagnóstico incompleto (% pendência(s)): não pode ser validado.', jsonb_array_length(comp -> 'pendencias');
  END IF;

  -- Conflitos sem confirmação expressa impedem a validação (nada é gravado)
  prev := public.diagnostico_previa_publicacao(p_id, p_versao);
  FOR i IN SELECT * FROM jsonb_array_elements(prev -> 'itens')
  LOOP
    IF jsonb_typeof(i -> 'conflito') = 'object'
       AND NOT ((i ->> 'campo_destino') = ANY (COALESCE(p_confirmar_conflitos, '{}'))) THEN
      RAISE EXCEPTION 'CONFLITO: o campo % já possui valor aprovado de outra unidade (%) para o período %. Confirme a substituição expressamente.',
        i ->> 'campo_destino', i -> 'conflito' ->> 'promotoria', i ->> 'periodo';
    END IF;
  END LOOP;

  UPDATE public.diagnostico_versoes SET status = 'validado', validado_em = now(), validado_por = auth.uid(),
    observacoes_validacao = p_observacoes
  WHERE id = v.id;
  UPDATE public.diagnostico_brigid SET status = 'validado', data_atualizacao = now() WHERE id = p_id;
  PERFORM public._diagnostico_auditar(p_id, p_versao, 'validacao', NULL,
    jsonb_build_object('hash', v.hash_conteudo, 'observacoes', p_observacoes));

  RETURN public._diagnostico_publicar_seguro(p_id, p_versao, p_confirmar_conflitos)
         || jsonb_build_object('validado', true);
END;
$$;

-- Nova tentativa de publicação de uma versão já validada (após falha)
CREATE OR REPLACE FUNCTION public.diagnostico_publicar(
  p_id TEXT, p_versao INT, p_hash TEXT, p_confirmar_conflitos TEXT[] DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d public.diagnostico_brigid;
  v public.diagnostico_versoes;
BEGIN
  PERFORM public._exigir_admin();
  SELECT * INTO d FROM public.diagnostico_brigid WHERE id = p_id FOR UPDATE;
  SELECT * INTO v FROM public.diagnostico_versoes WHERE diagnostico_id = p_id AND numero = p_versao FOR UPDATE;
  IF v.status = 'publicado' THEN
    RETURN jsonb_build_object('ok', true, 'ja_publicado', true);
  END IF;
  IF v.status <> 'validado' THEN
    RAISE EXCEPTION 'Somente versões validadas podem ser publicadas (situação: %).', v.status;
  END IF;
  IF p_hash IS DISTINCT FROM v.hash_conteudo THEN
    RAISE EXCEPTION 'O conteúdo do diagnóstico mudou desde a validação.';
  END IF;
  RETURN public._diagnostico_publicar_seguro(p_id, p_versao, p_confirmar_conflitos);
END;
$$;

-- Vínculos de usuários (gestão pelo CAOCRIM; a conta é criada no painel do Supabase)
CREATE OR REPLACE FUNCTION public.admin_vincular_usuario(p_email TEXT, p_promotoria_id TEXT, p_nome TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid UUID;
  novo BIGINT;
BEGIN
  PERFORM public._exigir_admin();
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(btrim(p_email));
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Usuário % não encontrado. Crie a conta em Authentication > Users no Supabase.', p_email;
  END IF;
  IF btrim(COALESCE(p_nome, '')) = '' THEN RAISE EXCEPTION 'Informe o nome do responsável.'; END IF;
  INSERT INTO public.usuarios_promotoria (user_id, promotoria_id, nome_responsavel, ativo, created_by)
  VALUES (uid, p_promotoria_id, btrim(p_nome), true, auth.uid())
  ON CONFLICT (user_id, promotoria_id) DO UPDATE SET ativo = true, nome_responsavel = EXCLUDED.nome_responsavel
  RETURNING id INTO novo;
  RETURN novo;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_desativar_vinculo(p_vinculo_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public._exigir_admin();
  UPDATE public.usuarios_promotoria SET ativo = false WHERE id = p_vinculo_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_listar_vinculos()
RETURNS TABLE (id BIGINT, email TEXT, promotoria_id TEXT, promotoria_nome TEXT, comarca_sede TEXT,
               nome_responsavel TEXT, ativo BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public._exigir_admin();
  RETURN QUERY
  SELECT u.id, au.email::text, u.promotoria_id, p.nome, p.comarca_sede, u.nome_responsavel, u.ativo, u.created_at
  FROM public.usuarios_promotoria u
  JOIN auth.users au ON au.id = u.user_id
  JOIN public.promotorias_justica p ON p.id = u.promotoria_id
  ORDER BY p.nome, u.nome_responsavel;
END;
$$;

-- -------------------------------------------------------------------------------------
-- 14. Permissões (RLS): leitura conforme perfil; nenhuma escrita direta pela API
-- -------------------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'diagnostico_brigid', 'diagnostico_versoes', 'diagnostico_observacoes', 'diagnostico_anexos',
    'diagnostico_auditoria', 'diagnostico_gargalos', 'diagnostico_publicacoes', 'municipio_dados_publicados',
    'usuarios_promotoria', 'diagnostico_campos_regras', 'diagnostico_mapeamento_publicacao'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END;
$$;

CREATE POLICY "leitura_admin_ou_vinculado" ON public.diagnostico_brigid
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()) OR public.usuario_vinculado(promotoria_id));

CREATE POLICY "leitura_admin_ou_vinculado" ON public.diagnostico_versoes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.diagnostico_brigid d WHERE d.id = diagnostico_id
                 AND ((SELECT public.is_admin()) OR public.usuario_vinculado(d.promotoria_id))));

CREATE POLICY "leitura_admin_ou_respondente" ON public.diagnostico_observacoes
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()) OR (visivel_respondente AND EXISTS (
    SELECT 1 FROM public.diagnostico_brigid d WHERE d.id = diagnostico_id AND public.usuario_vinculado(d.promotoria_id))));

CREATE POLICY "leitura_admin_ou_vinculado" ON public.diagnostico_anexos
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.diagnostico_brigid d WHERE d.id = diagnostico_id
                 AND ((SELECT public.is_admin()) OR public.usuario_vinculado(d.promotoria_id))));

CREATE POLICY "leitura_admin" ON public.diagnostico_auditoria
  FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

CREATE POLICY "leitura_admin" ON public.diagnostico_publicacoes
  FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

DO $$
BEGIN
  IF to_regclass('public.diagnostico_gargalos') IS NOT NULL THEN
    CREATE POLICY "leitura_admin" ON public.diagnostico_gargalos
      FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
  END IF;
END;
$$;

CREATE POLICY "leitura_admin_ou_proprio" ON public.usuarios_promotoria
  FOR SELECT TO authenticated USING ((SELECT public.is_admin()) OR user_id = auth.uid());

-- Base publicada e regras: leitura pública (apenas campos da lista explícita de mapeamento)
CREATE POLICY "leitura_publica" ON public.municipio_dados_publicados
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "leitura_publica" ON public.diagnostico_campos_regras
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "leitura_publica" ON public.diagnostico_mapeamento_publicacao
  FOR SELECT TO anon, authenticated USING (true);

-- Funções: internas sem acesso pela API; ações apenas para usuários autenticados
DO $$
DECLARE
  f RECORD;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS assinatura, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND (p.proname LIKE '\_diagnostico%' OR p.proname IN (
      '_exigir_admin', 'usuario_vinculado', 'meus_vinculos', 'diagnostico_completude', 'diagnostico_criar',
      'diagnostico_salvar_rascunho', 'diagnostico_enviar', 'diagnostico_nova_versao', 'diagnostico_registrar_anexo',
      'diagnostico_remover_anexo', 'diagnostico_iniciar_analise', 'diagnostico_registrar_observacao',
      'diagnostico_devolver', 'diagnostico_previa_publicacao', 'diagnostico_validar_e_publicar',
      'diagnostico_publicar', 'admin_vincular_usuario', 'admin_desativar_vinculo', 'admin_listar_vinculos'))
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f.assinatura);
    IF f.proname LIKE '\_%' THEN
      CONTINUE;
    END IF;
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.assinatura);
  END LOOP;
END;
$$;

-- -------------------------------------------------------------------------------------
-- 15. Storage privado para anexos: <diagnostico_id>/<arquivo>
-- -------------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'Schema storage indisponível: bucket de anexos não configurado.';
    RETURN;
  END IF;

  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('diagnostico-anexos', 'diagnostico-anexos', false, 20971520)
  ON CONFLICT (id) DO UPDATE SET public = false;

  DROP POLICY IF EXISTS "anexos_leitura" ON storage.objects;
  DROP POLICY IF EXISTS "anexos_envio" ON storage.objects;
  DROP POLICY IF EXISTS "anexos_remocao" ON storage.objects;

  CREATE POLICY "anexos_leitura" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'diagnostico-anexos' AND EXISTS (
      SELECT 1 FROM public.diagnostico_brigid d WHERE d.id = (storage.foldername(name))[1]
        AND ((SELECT public.is_admin()) OR public.usuario_vinculado(d.promotoria_id))));

  CREATE POLICY "anexos_envio" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'diagnostico-anexos' AND EXISTS (
      SELECT 1 FROM public.diagnostico_brigid d
      JOIN public.diagnostico_versoes v ON v.diagnostico_id = d.id AND v.numero = d.versao_atual
      WHERE d.id = (storage.foldername(name))[1] AND public.usuario_vinculado(d.promotoria_id)
        AND v.status IN ('em_preenchimento', 'devolvido')));

  CREATE POLICY "anexos_remocao" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'diagnostico-anexos' AND EXISTS (
      SELECT 1 FROM public.diagnostico_brigid d
      JOIN public.diagnostico_versoes v ON v.diagnostico_id = d.id AND v.numero = d.versao_atual
      WHERE d.id = (storage.foldername(name))[1] AND public.usuario_vinculado(d.promotoria_id)
        AND v.status IN ('em_preenchimento', 'devolvido')
        AND NOT EXISTS (SELECT 1 FROM public.diagnostico_anexos a WHERE a.storage_path = name)));
END;
$$;
