-- Setup do Supabase: Contador de Acessos
-- Execute este script no SQL Editor do Supabase para preparar a base de dados.

-- 1. Cria a tabela para armazenar as visitas
CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  visited_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ativa o Row Level Security (RLS)
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- 3. Cria uma política permitindo que qualquer pessoa (anônimos/público) insira registros
CREATE POLICY "Permitir inserção anônima de visitas" ON public.site_visits
FOR INSERT
WITH CHECK (true);

-- 4. Cria uma política permitindo que qualquer pessoa leia a tabela
CREATE POLICY "Permitir leitura pública das visitas" ON public.site_visits
FOR SELECT
USING (true);

-- 5. Adiciona índices para acelerar agregações por data e consultas de session_id
CREATE INDEX IF NOT EXISTS idx_site_visits_visited_at ON public.site_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_session_id ON public.site_visits(session_id);

-- 6. Cria a função RPC para calcular as estatísticas agregadas (total, mensal, diária e únicos)
CREATE OR REPLACE FUNCTION get_visitor_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_visits int;
  monthly_visits int;
  daily_visits int;
  unique_visitors int;
BEGIN
  -- Total de acessos
  SELECT count(*) INTO total_visits FROM site_visits;
  
  -- Acessos no mês atual
  SELECT count(*) INTO monthly_visits FROM site_visits 
  WHERE date_trunc('month', visited_at) = date_trunc('month', timezone('utc'::text, now()));
  
  -- Acessos no dia atual
  SELECT count(*) INTO daily_visits FROM site_visits 
  WHERE date_trunc('day', visited_at) = date_trunc('day', timezone('utc'::text, now()));
  
  -- Visitantes únicos
  SELECT count(distinct session_id) INTO unique_visitors FROM site_visits;
  
  -- Retorna um objeto JSON com as estatísticas
  RETURN json_build_object(
    'total', total_visits,
    'monthly', monthly_visits,
    'daily', daily_visits,
    'unique', unique_visitors
  );
END;
$$;
