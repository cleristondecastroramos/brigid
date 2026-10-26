import { supabase } from "@/lib/supabase";

export interface Promotoria {
  id: string;
  nome: string;
  nome_normalizado?: string;
  comarca_sede: string;
  tipo_atribuicao: string;
  email_institucional?: string | null;
}

export interface PromotoriaMunicipio {
  promotoria_id: string;
  codigo_ibge: string;
  municipio: string;
  comarca: string;
  polo_regional: string;
}

export interface Vinculo {
  promotoria_id: string;
  nome: string;
  comarca_sede: string;
  tipo_atribuicao: string;
  nome_responsavel: string | null;
}

export interface VinculoAdmin {
  id: number;
  email: string;
  promotoria_id: string;
  promotoria_nome: string;
  comarca_sede: string;
  nome_responsavel: string | null;
  ativo: boolean;
  created_at: string;
}

function erro(e: { message: string } | null) {
  if (e) throw new Error(e.message);
}

// Promotorias e abrangência territorial lidas do banco (promotorias_justica,
// promotoria_municipios). A atribuição funcional é alterada só pelo CAOCRIM (RLS).
class PromotoriasService {
  async listarPromotorias(): Promise<Promotoria[]> {
    const { data, error } = await supabase
      .from("promotorias_justica")
      .select("id, nome, nome_normalizado, comarca_sede, tipo_atribuicao, email_institucional")
      .eq("ativa", true)
      .order("nome");
    erro(error);
    return data as Promotoria[];
  }

  async listarMunicipiosDaPromotoria(promotoriaId: string): Promise<PromotoriaMunicipio[]> {
    const { data, error } = await supabase
      .from("promotoria_municipios")
      .select("promotoria_id, codigo_ibge, municipio, comarca, municipios(polo_regional)")
      .eq("promotoria_id", promotoriaId)
      .eq("ativo", true)
      .order("municipio");
    erro(error);
    // Relação muitos-para-um: o PostgREST devolve objeto (a inferência sem tipos gerados supõe lista)
    return (
      data as unknown as (Omit<PromotoriaMunicipio, "polo_regional"> & {
        municipios: { polo_regional: string } | null;
      })[]
    ).map(({ municipios, ...m }) => ({ ...m, polo_regional: municipios?.polo_regional ?? "" }));
  }

  async meusVinculos(): Promise<Vinculo[]> {
    const { data, error } = await supabase.rpc("meus_vinculos");
    erro(error);
    return data as Vinculo[];
  }

  // --- CAOCRIM ---

  async atualizarAtribuicao(id: string, tipo_atribuicao: string): Promise<void> {
    const { data, error } = await supabase
      .from("promotorias_justica")
      .update({ tipo_atribuicao, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id");
    erro(error);
    if (!data || data.length === 0) throw new Error("Sem permissão para alterar a atribuição.");
  }

  async listarVinculos(): Promise<VinculoAdmin[]> {
    const { data, error } = await supabase.rpc("admin_listar_vinculos");
    erro(error);
    return data as VinculoAdmin[];
  }

  // Vincula a conta (normalmente o e-mail institucional da Promotoria)
  async vincularUsuario(email: string, promotoriaId: string, descricao?: string) {
    const { error } = await supabase.rpc("admin_vincular_usuario", {
      p_email: email,
      p_promotoria_id: promotoriaId,
      p_descricao: descricao || null,
    });
    erro(error);
  }

  // Liga cada Promotoria à conta cujo e-mail coincide com o institucional (repetível)
  async vincularContasPorEmail(): Promise<
    { promotoria_id: string; promotoria_nome: string; email: string; situacao: string }[]
  > {
    const { data, error } = await supabase.rpc("admin_vincular_contas_por_email");
    erro(error);
    return data;
  }

  async atualizarEmailInstitucional(id: string, email: string) {
    const valor = email.trim().toLowerCase() || null;
    const { data, error } = await supabase
      .from("promotorias_justica")
      .update({ email_institucional: valor, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id");
    erro(error);
    if (!data || data.length === 0) throw new Error("Sem permissão para alterar o e-mail.");
  }

  async desativarVinculo(id: number) {
    const { error } = await supabase.rpc("admin_desativar_vinculo", { p_vinculo_id: id });
    erro(error);
  }

  async exportarBackupJson(): Promise<string> {
    return JSON.stringify(await this.listarPromotorias(), null, 2);
  }
}

export const promotoriasService = new PromotoriasService();
