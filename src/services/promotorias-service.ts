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
  // true enquanto a conta não definiu a senha definitiva (diagnósticos bloqueados no banco)
  senha_provisoria: boolean;
  // false: conta provisória da senha compartilhada anterior (exige "Redefinir senha")
  credencial_individual: boolean;
  senha_provisoria_em: string | null;
  senha_provisoria_expira_em: string | null;
  // Calculado pelo relógio do servidor
  senha_provisoria_expirada: boolean;
  // Quando a Promotoria definiu a senha atual (para ela confirmar que foi ela)
  senha_definida_em: string | null;
  ultimo_acesso: string | null;
  created_at: string;
}

// Resposta da função de borda. A credencial provisória é individual, gerada no servidor, e
// só vem na resposta da aprovação de conta nova ou da redefinição: fica apenas no estado da
// tela do CAOCRIM até ser fechada (nunca em localStorage).
export type SituacaoConta =
  | "conta_criada"
  | "credencial_emitida"
  | "senha_preservada"
  | "provisoria_preservada"
  | "provisoria_expirada"
  | "provisoria_legada"
  | "redefinida";

export interface ResultadoConta {
  email: string;
  situacao: SituacaoConta;
  credencial_provisoria?: string;
  expira_em?: string | null;
  sessoes_encerradas?: boolean;
}

// Validade da credencial provisória (conferida no servidor; aqui só para os textos)
export const VALIDADE_PROVISORIA_HORAS = 72;

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

  // Aprova o cadastro: cria a conta com credencial individual ou só vincula a conta existente
  // (a aprovação nunca altera a senha de uma conta existente)
  async ativarConta(promotoriaId: string, email: string): Promise<ResultadoConta> {
    return chamarContasPromotorias<ResultadoConta>({
      acao: "ativar",
      promotoria_id: promotoriaId,
      email: email.trim().toLowerCase(),
    });
  }

  // Emite nova credencial provisória individual; a definição de senha é exigida de novo
  async redefinirSenha(userId: string): Promise<ResultadoConta> {
    return chamarContasPromotorias<ResultadoConta>({ acao: "redefinir", user_id: userId });
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
