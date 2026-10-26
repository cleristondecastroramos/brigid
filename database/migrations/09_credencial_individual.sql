-- =====================================================================================
-- Migration: credencial provisória individual para o primeiro acesso das Promotorias
-- =====================================================================================
-- Executar depois de 08_senha_provisoria.sql (já aplicada). Pode ser repetida.
-- Não altera senhas, contas nem vínculos existentes: só cria estruturas e funções.
--
-- Substitui a senha provisória compartilhada por uma credencial individual e aleatória,
-- gerada na função de borda supabase/functions/contas-promotorias a cada aprovação de conta
-- nova ou "Redefinir senha":
--   - a credencial nunca é gravada; aqui fica só o hash SHA-256 dela, com emissão e validade
--     (72 horas, pelo relógio do servidor), em uma tabela que só a chave de serviço lê;
--   - a marca app_metadata.senha_provisoria (08) continua bloqueando os diagnósticos;
--   - para definir a senha definitiva, a Promotoria informa a credencial recebida, que é
--     conferida com o hash. Sem registro aqui (contas da senha compartilhada anterior),
--     a definição é recusada até o CAOCRIM usar "Redefinir senha".

-- -------------------------------------------------------------------------------------
-- 1. Credenciais provisórias emitidas (somente hash; acesso exclusivo da chave de serviço)
-- -------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credenciais_provisorias (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hash_credencial TEXT NOT NULL,
    emitida_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    expira_em TIMESTAMPTZ NOT NULL,
    emitida_por UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.credenciais_provisorias ENABLE ROW LEVEL SECURITY;
-- Sem políticas: anon e authenticated não leem nem gravam, nem pela API
REVOKE ALL ON TABLE public.credenciais_provisorias FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public.credenciais_provisorias FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.credenciais_provisorias FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.credenciais_provisorias TO service_role;
  END IF;
END;
$$;

-- -------------------------------------------------------------------------------------
-- 2. Situação de uma conta antes da aprovação (chamada pela função de borda com o token
--    do CAOCRIM). A aprovação decide por ela e nunca altera senha de conta existente.
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_situacao_conta_promotoria(p_promotoria_id TEXT, p_email TEXT)
RETURNS TABLE (user_id UUID, tem_senha BOOLEAN, provisoria BOOLEAN, credencial_individual BOOLEAN,
               credencial_expirada BOOLEAN, expira_em TIMESTAMPTZ, vinculada_promotoria BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT := lower(btrim(COALESCE(p_email, '')));
BEGIN
  -- Confere o CAOCRIM, o e-mail, a Promotoria e se a conta é do CAOCRIM (migration 08)
  PERFORM * FROM public.admin_preparar_conta_promotoria(p_promotoria_id, p_email);
  RETURN QUERY
  SELECT au.id,
         COALESCE(au.encrypted_password, '') <> '',
         COALESCE((au.raw_app_meta_data ->> 'senha_provisoria')::boolean, false),
         c.user_id IS NOT NULL,
         c.user_id IS NOT NULL AND c.expira_em <= now(),
         c.expira_em,
         EXISTS (SELECT 1 FROM public.usuarios_promotoria up WHERE up.user_id = au.id)
  FROM auth.users au
  LEFT JOIN public.credenciais_provisorias c ON c.user_id = au.id
  WHERE lower(au.email) = v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_situacao_conta_promotoria(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_situacao_conta_promotoria(TEXT, TEXT) TO authenticated;

-- -------------------------------------------------------------------------------------
-- 3. Encerramento das sessões de uma conta na redefinição (só a chave de serviço chama).
--    Remove as sessões e os tokens de renovação; o token de acesso já emitido vale até
--    expirar (1 hora por padrão), mas a marca provisória já bloqueia os diagnósticos.
--    Devolve -1 se o banco não permitir a remoção (a redefinição segue e o painel avisa).
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.encerrar_sessoes_conta(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  n INTEGER;
BEGIN
  DELETE FROM auth.sessions WHERE user_id = p_user_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
EXCEPTION WHEN others THEN
  RETURN -1;
END;
$$;

REVOKE ALL ON FUNCTION public.encerrar_sessoes_conta(UUID) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION public.encerrar_sessoes_conta(UUID) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION public.encerrar_sessoes_conta(UUID) FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.encerrar_sessoes_conta(UUID) TO service_role;
  END IF;
END;
$$;

-- -------------------------------------------------------------------------------------
-- 4. Lista de contas no painel: situação calculada pelo relógio do servidor
--    (nunca devolve credencial nem hash)
-- -------------------------------------------------------------------------------------
-- Recriada aqui para não depender da versão da 08 aplicada
CREATE OR REPLACE FUNCTION public._data_metadado(p_valor TEXT)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  RETURN NULLIF(p_valor, '')::timestamptz;
EXCEPTION WHEN others THEN
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public._data_metadado(TEXT) FROM PUBLIC;

DROP FUNCTION IF EXISTS public.admin_listar_vinculos();
CREATE FUNCTION public.admin_listar_vinculos()
RETURNS TABLE (id BIGINT, user_id UUID, email TEXT, promotoria_id TEXT, promotoria_nome TEXT,
               comarca_sede TEXT, nome_responsavel TEXT, ativo BOOLEAN, senha_provisoria BOOLEAN,
               credencial_individual BOOLEAN, senha_provisoria_em TIMESTAMPTZ,
               senha_provisoria_expira_em TIMESTAMPTZ, senha_provisoria_expirada BOOLEAN,
               senha_definida_em TIMESTAMPTZ, ultimo_acesso TIMESTAMPTZ, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public._exigir_admin();
  RETURN QUERY
  SELECT u.id, u.user_id, au.email::text, u.promotoria_id, p.nome, p.comarca_sede, u.nome_responsavel,
         u.ativo,
         COALESCE((au.raw_app_meta_data ->> 'senha_provisoria')::boolean, false),
         c.user_id IS NOT NULL,
         COALESCE(c.emitida_em, public._data_metadado(au.raw_app_meta_data ->> 'senha_provisoria_em')),
         c.expira_em,
         -- Provisória sem credencial individual (senha compartilhada anterior) conta como expirada
         COALESCE((au.raw_app_meta_data ->> 'senha_provisoria')::boolean, false)
           AND (c.user_id IS NULL OR c.expira_em <= now()),
         public._data_metadado(au.raw_app_meta_data ->> 'senha_definida_em'),
         au.last_sign_in_at, u.created_at
  FROM public.usuarios_promotoria u
  JOIN auth.users au ON au.id = u.user_id
  JOIN public.promotorias_justica p ON p.id = u.promotoria_id
  LEFT JOIN public.credenciais_provisorias c ON c.user_id = u.user_id
  ORDER BY p.nome, au.email;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_listar_vinculos() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_listar_vinculos() TO authenticated;
