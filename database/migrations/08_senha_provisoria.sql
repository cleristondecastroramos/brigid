-- =====================================================================================
-- Migration: cadastro das Promotorias pelo CAOCRIM com senha provisória padrão
-- =====================================================================================
-- Executar depois de 07_contador_acessos.sql. Pode ser repetida.
--
-- Substitui o fluxo de convite por e-mail (links de "definir senha"):
--   1. O CAOCRIM aprova a Promotoria na tela Administração. A função de borda
--      supabase/functions/contas-promotorias cria a conta com a senha provisória padrão e
--      marca app_metadata.senha_provisoria = true (só a chave de serviço altera app_metadata).
--   2. Enquanto a marca estiver ativa, a conta não acessa nenhum diagnóstico: o vínculo com a
--      Promotoria só vale depois que a própria Promotoria troca a senha.
--   3. "Redefinir senha" no painel volta a conta à senha provisória e reativa a marca.
--   4. A senha provisória vale por 72 horas para a troca (conferido na função de borda);
--      depois disso, só uma nova redefinição pelo CAOCRIM libera a troca.
-- As funções abaixo validam o CAOCRIM e os dados; a criação da conta e a troca de senha
-- ficam na função de borda, que é a única com a chave de serviço.

-- -------------------------------------------------------------------------------------
-- 1. Marca de senha provisória (lida da conta, sempre atual)
-- -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.senha_provisoria_ativa()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT (au.raw_app_meta_data ->> 'senha_provisoria')::boolean
     FROM auth.users au WHERE au.id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.senha_provisoria_ativa() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.senha_provisoria_ativa() TO authenticated;

-- Com senha provisória, a conta não age em nome da Promotoria (leitura, criação e envio)
CREATE OR REPLACE FUNCTION public.usuario_vinculado(p_promotoria_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT public.senha_provisoria_ativa() AND EXISTS (
    SELECT 1 FROM public.usuarios_promotoria
    WHERE user_id = auth.uid() AND promotoria_id = p_promotoria_id AND ativo
  );
$$;

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
  WHERE u.user_id = auth.uid() AND u.ativo AND NOT public.senha_provisoria_ativa()
  ORDER BY p.nome;
$$;

-- -------------------------------------------------------------------------------------
-- 2. Aprovação do cadastro (chamadas pela função de borda com o token do CAOCRIM)
-- -------------------------------------------------------------------------------------
-- Confere a Promotoria e o e-mail antes de criar a conta. Devolve a conta já existente com
-- esse e-mail (user_id NULL quando ela ainda precisa ser criada) e se a senha dela deve ser
-- mantida: só quando já é conta de Promotoria e tem senha definitiva. Uma conta existente
-- que não é de Promotoria volta à senha provisória ao ser aprovada.
DROP FUNCTION IF EXISTS public.admin_preparar_conta_promotoria(TEXT, TEXT);
CREATE FUNCTION public.admin_preparar_conta_promotoria(p_promotoria_id TEXT, p_email TEXT)
RETURNS TABLE (user_id UUID, manter_senha BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT := lower(btrim(COALESCE(p_email, '')));
  outra TEXT;
  uid UUID;
  manter BOOLEAN := false;
BEGIN
  PERFORM public._exigir_admin();
  IF v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'E-mail inválido: %.', p_email;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.promotorias_justica WHERE id = p_promotoria_id AND ativa) THEN
    RAISE EXCEPTION 'Promotoria não encontrada.';
  END IF;
  SELECT nome INTO outra FROM public.promotorias_justica
  WHERE lower(email_institucional) = v_email AND id <> p_promotoria_id;
  IF outra IS NOT NULL THEN
    RAISE EXCEPTION 'O e-mail % já é o e-mail institucional da %.', v_email, outra;
  END IF;
  SELECT au.id,
         COALESCE(au.encrypted_password, '') <> ''
           AND NOT COALESCE((au.raw_app_meta_data ->> 'senha_provisoria')::boolean, false)
           AND EXISTS (SELECT 1 FROM public.usuarios_promotoria up WHERE up.user_id = au.id)
  INTO uid, manter
  FROM auth.users au WHERE lower(au.email) = v_email;
  IF uid IS NOT NULL AND EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = uid) THEN
    RAISE EXCEPTION 'O e-mail % pertence a uma conta do CAOCRIM e não pode ser usado por uma Promotoria.', v_email;
  END IF;
  RETURN QUERY SELECT uid, COALESCE(manter, false);
END;
$$;

-- Liga a conta (já criada com a senha provisória) à Promotoria e registra o e-mail institucional
CREATE OR REPLACE FUNCTION public.admin_vincular_conta_promotoria(p_user_id UUID, p_promotoria_id TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT;
  novo BIGINT;
BEGIN
  PERFORM public._exigir_admin();
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Conta não encontrada.'; END IF;
  -- Revalida a Promotoria, o e-mail e a conta (não pode ser do CAOCRIM)
  PERFORM * FROM public.admin_preparar_conta_promotoria(p_promotoria_id, v_email);

  INSERT INTO public.usuarios_promotoria (user_id, promotoria_id, nome_responsavel, ativo, created_by)
  VALUES (p_user_id, p_promotoria_id, 'Conta institucional da Promotoria', true, auth.uid())
  ON CONFLICT (user_id, promotoria_id) DO UPDATE SET ativo = true
  RETURNING id INTO novo;
  UPDATE public.promotorias_justica SET email_institucional = v_email, updated_at = now()
  WHERE id = p_promotoria_id;
  RETURN novo;
END;
$$;

-- Redefinição de senha: só para contas de Promotoria (nunca para contas do CAOCRIM)
CREATE OR REPLACE FUNCTION public.admin_conferir_conta_promotoria(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email TEXT;
BEGIN
  PERFORM public._exigir_admin();
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN RAISE EXCEPTION 'Conta não encontrada.'; END IF;
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Contas do CAOCRIM não são redefinidas por esta tela.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.usuarios_promotoria WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'A conta % não está vinculada a nenhuma Promotoria.', v_email;
  END IF;
  RETURN v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_preparar_conta_promotoria(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_vincular_conta_promotoria(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_conferir_conta_promotoria(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_preparar_conta_promotoria(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_vincular_conta_promotoria(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_conferir_conta_promotoria(UUID) TO authenticated;

-- -------------------------------------------------------------------------------------
-- 3. Lista de contas no painel: situação da senha, datas da senha e último acesso
-- -------------------------------------------------------------------------------------
-- A data da senha definitiva permite à Promotoria confirmar que foi ela quem a definiu
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

DROP FUNCTION IF EXISTS public.admin_listar_vinculos();
CREATE FUNCTION public.admin_listar_vinculos()
RETURNS TABLE (id BIGINT, user_id UUID, email TEXT, promotoria_id TEXT, promotoria_nome TEXT,
               comarca_sede TEXT, nome_responsavel TEXT, ativo BOOLEAN, senha_provisoria BOOLEAN,
               senha_provisoria_em TIMESTAMPTZ, senha_definida_em TIMESTAMPTZ,
               ultimo_acesso TIMESTAMPTZ, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public._exigir_admin();
  RETURN QUERY
  SELECT u.id, u.user_id, au.email::text, u.promotoria_id, p.nome, p.comarca_sede, u.nome_responsavel,
         u.ativo, COALESCE((au.raw_app_meta_data ->> 'senha_provisoria')::boolean, false),
         public._data_metadado(au.raw_app_meta_data ->> 'senha_provisoria_em'),
         public._data_metadado(au.raw_app_meta_data ->> 'senha_definida_em'),
         au.last_sign_in_at, u.created_at
  FROM public.usuarios_promotoria u
  JOIN auth.users au ON au.id = u.user_id
  JOIN public.promotorias_justica p ON p.id = u.promotoria_id
  ORDER BY p.nome, au.email;
END;
$$;

REVOKE ALL ON FUNCTION public._data_metadado(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_listar_vinculos() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_listar_vinculos() TO authenticated;

-- O vínculo em lote por e-mail (06_contas_promotorias.sql) dependia dos convites: removido
DROP FUNCTION IF EXISTS public.admin_vincular_contas_por_email();
