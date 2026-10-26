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
  user_id: string;
  email: string;
  promotoria_id: string;
  promotoria_nome: string;
  comarca_sede: string;
  nome_responsavel: string | null;
  ativo: boolean;
  // true enquanto a conta usa a senha provisória padrão (troca obrigatória no próximo acesso)
  senha_provisoria: boolean;
  senha_provisoria_em: string | null;
  // Quando a Promotoria definiu a senha atual (para ela confirmar que foi ela)
  senha_definida_em: string | null;
  ultimo_acesso: string | null;
  created_at: string;
}

// Resposta da função de borda. A senha provisória só existe no servidor e vem nesta resposta,
// para o CAOCRIM; ela não fica no código enviado ao navegador.
export interface ContaAtivada {
  email: string;
  senha_provisoria?: string;
  conta_existente?: boolean;
  // Conta de Promotoria que já tinha senha definitiva: foi só vinculada, sem trocar a senha
  senha_mantida?: boolean;
}

// Prazo para a troca da senha provisória (o mesmo da função de borda)
export const VALIDADE_PROVISORIA_HORAS = 72;

export function senhaProvisoriaExpirada(v: Pick<VinculoAdmin, "senha_provisoria_em">) {
  if (!v.senha_provisoria_em) return true;
  return Date.now() - Date.parse(v.senha_provisoria_em) > VALIDADE_PROVISORIA_HORAS * 3600 * 1000;
}

function erro(e: { message: string } | null) {
  if (e) throw new Error(e.message);
}

// Chama a função de borda das contas (supabase/functions/contas-promotorias), que é a única
// com a chave de serviço. A mensagem de erro em português vem no corpo da resposta.
export async function chamarContasPromotorias<T>(corpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("contas-promotorias", { body: corpo });
  if (error) {
    const detalhe = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(
      detalhe?.erro ??
        "Não foi possível falar com o serviço de contas. Verifique se a função contas-promotorias foi publicada.",
    );
  }
  return data as T;
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

  // Aprova o cadastro: cria (ou reativa) a conta com a senha provisória padrão e a vincula
  async ativarConta(promotoriaId: string, email: string): Promise<ContaAtivada> {
    return chamarContasPromotorias<ContaAtivada>({
      acao: "ativar",
      promotoria_id: promotoriaId,
      email: email.trim().toLowerCase(),
    });
  }

  // Volta a conta à senha provisória padrão; a troca é exigida no próximo acesso
  async redefinirSenha(userId: string): Promise<ContaAtivada> {
    return chamarContasPromotorias<ContaAtivada>({ acao: "redefinir", user_id: userId });
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
