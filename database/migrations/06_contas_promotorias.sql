-- =====================================================================================
-- Migration: vínculo em lote das contas institucionais das Promotorias
-- =====================================================================================
-- Executar depois de 05_fluxo_diagnostico.sql.
--
-- Uso no Lovable Cloud (sem chave de serviço):
--   1. Preencha promotorias_justica.email_institucional (tela Administração ou o SQL gerado
--      por scripts/diagnostico/convidar-contas-promotorias.mjs --sql).
--   2. Convide cada e-mail em More → Users → Add user → Send invitation.
--   3. Na tela Administração, clique em "Vincular contas pelo e-mail institucional".
--      A função liga cada Promotoria à conta cujo e-mail coincide com o institucional.
-- Pode ser repetida sem duplicar vínculos.

CREATE OR REPLACE FUNCTION public.admin_vincular_contas_por_email()
RETURNS TABLE (promotoria_id TEXT, promotoria_nome TEXT, email TEXT, situacao TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  p RECORD;
  uid UUID;
BEGIN
  PERFORM public._exigir_admin();

  FOR p IN
    SELECT pj.id, pj.nome, lower(btrim(pj.email_institucional)) AS email
    FROM public.promotorias_justica pj
    WHERE COALESCE(btrim(pj.email_institucional), '') <> ''
    ORDER BY pj.nome
  LOOP
    promotoria_id := p.id;
    promotoria_nome := p.nome;
    email := p.email;

    SELECT au.id INTO uid FROM auth.users au WHERE lower(au.email) = p.email;
    IF uid IS NULL THEN
      situacao := 'conta_inexistente';
    ELSIF EXISTS (
      SELECT 1 FROM public.usuarios_promotoria u
      WHERE u.user_id = uid AND u.promotoria_id = p.id AND u.ativo
    ) THEN
      situacao := 'ja_vinculada';
    ELSE
      INSERT INTO public.usuarios_promotoria (user_id, promotoria_id, nome_responsavel, ativo, created_by)
      VALUES (uid, p.id, 'Conta institucional da Promotoria', true, auth.uid())
      ON CONFLICT ON CONSTRAINT usuarios_promotoria_user_id_promotoria_id_key DO UPDATE SET ativo = true;
      situacao := 'vinculada';
    END IF;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_vincular_contas_por_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_vincular_contas_por_email() TO authenticated;
