-- Migration: Autenticação de administradores via Supabase Auth + Row Level Security
-- Execute este script no SQL Editor do Supabase.
--
-- ATENÇÃO: o passo 3 remove TODAS as políticas existentes nas tabelas listadas
-- (inclusive políticas permissivas criadas pelo painel) e recria apenas as definidas aqui.
--
-- Depois de executar, cadastre o administrador:
--   1. Authentication > Users > "Add user" (e-mail + senha, marque "Auto Confirm User").
--   2. Rode: INSERT INTO public.admin_users (user_id)
--            SELECT id FROM auth.users WHERE email = 'caocrim@mppi.mp.br';
--   3. Em Authentication > Sign In / Providers, desative "Allow new users to sign up".

-- 1. Tabela de administradores (vínculo com auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- Sem políticas: ninguém lê ou altera via API; o acesso é feito apenas por is_admin().

-- 2. Função que informa se o usuário autenticado é administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 3. RLS nas tabelas de dados
--    leitura pública: dados exibidos no painel aberto
--    leitura restrita: dados ainda internos (diagnóstico)
--    escrita: somente administradores
DO $$
DECLARE
  t TEXT;
  pol RECORD;
  tabelas_publicas TEXT[] := ARRAY[
    'municipios',
    'eventos_feminicidio',
    'entregas_estrategicas',
    'promotorias_justica',
    'promotoria_municipios'
  ];
  tabelas_restritas TEXT[] := ARRAY[
    'diagnostico_brigid',
    'diagnostico_respostas',
    'diagnostico_gargalos',
    'diagnostico_auditoria'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas_publicas || tabelas_restritas LOOP
    -- Ignora tabelas que ainda não foram criadas neste projeto
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'Tabela public.% não existe, ignorada.', t;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;

    IF t = ANY (tabelas_publicas) THEN
      EXECUTE format(
        'CREATE POLICY "leitura_publica" ON public.%I FOR SELECT TO anon, authenticated USING (true)',
        t
      );
    ELSE
      EXECUTE format(
        'CREATE POLICY "leitura_admin" ON public.%I FOR SELECT TO authenticated USING ((SELECT public.is_admin()))',
        t
      );
    END IF;

    EXECUTE format(
      'CREATE POLICY "insercao_admin" ON public.%I FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()))',
      t
    );
    EXECUTE format(
      'CREATE POLICY "edicao_admin" ON public.%I FOR UPDATE TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()))',
      t
    );
    EXECUTE format(
      'CREATE POLICY "exclusao_admin" ON public.%I FOR DELETE TO authenticated USING ((SELECT public.is_admin()))',
      t
    );
  END LOOP;
END;
$$;

-- 4. Contador de acessos: a leitura agregada já é feita por get_visitor_stats() (SECURITY DEFINER),
--    então a leitura direta da tabela (que expunha os session_id) deixa de ser necessária.
DROP POLICY IF EXISTS "Permitir leitura pública das visitas" ON public.site_visits;
