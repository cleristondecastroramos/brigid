import { supabase } from "@/lib/supabase";
import type { Respostas } from "@/lib/completude-diagnostico";

// Toda escrita passa pelas funções do banco (database/migrations/05_fluxo_diagnostico.sql),
// que validam perfil, vínculo com a Promotoria e a transição de estado. As tabelas de
// coleta não aceitam INSERT/UPDATE/DELETE direto pela API.

export type StatusDiagnostico =
  | "em_preenchimento"
  | "enviado"
  | "em_analise"
  | "devolvido"
  | "validado"
  | "publicado"
  | "substituido";

export const STATUS_DIAGNOSTICO: Record<StatusDiagnostico, { label: string; className: string }> = {
  em_preenchimento: {
    label: "Em preenchimento",
    className: "bg-secondary text-secondary-foreground",
  },
  enviado: {
    label: "Enviado para análise",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  em_analise: {
    label: "Em análise pelo CAOCRIM",
    className: "bg-warning/20 text-warning-foreground",
  },
  devolvido: { label: "Devolvido para correção", className: "bg-destructive/15 text-destructive" },
  validado: {
    label: "Validado (publicação pendente)",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  publicado: { label: "Publicado", className: "bg-emerald-600 text-white" },
  substituido: {
    label: "Substituído por nova versão",
    className: "bg-muted text-muted-foreground",
  },
};

export const STATUS_EDITAVEIS: StatusDiagnostico[] = ["em_preenchimento", "devolvido"];

// A conta é da Promotoria (e-mail institucional); a pessoa que responde se identifica
// no diagnóstico e declara nome e condição a cada envio.
export type CondicaoResponsavel = "titular" | "substituto" | "respondendo";

export const CONDICOES_RESPONSAVEL: { value: CondicaoResponsavel; label: string }[] = [
  { value: "titular", label: "Titular" },
  { value: "substituto", label: "Substituto(a)" },
  { value: "respondendo", label: "Em respondência" },
];

export function rotuloCondicao(c?: string | null) {
  return CONDICOES_RESPONSAVEL.find((x) => x.value === c)?.label ?? "—";
}

export interface Responsavel {
  nome: string;
  condicao: CondicaoResponsavel;
}

export interface DiagnosticoResumo {
  id: string;
  codigo_ibge: string;
  promotoria_id: string;
  atribuicao: string[];
  periodo_referencia: string;
  responsavel_nome: string | null;
  responsavel_condicao: CondicaoResponsavel | null;
  status: StatusDiagnostico;
  versao_atual: number;
  versao_publicada: number | null;
  percentual_preenchimento: number;
  data_envio: string | null;
  data_criacao: string;
  data_atualizacao: string;
  promotoria_nome: string;
  comarca_sede: string;
  municipio: string;
  comarca: string;
  polo_regional: string;
}

export interface VersaoDiagnostico {
  id: number;
  numero: number;
  status: StatusDiagnostico;
  respostas: Respostas;
  hash_conteudo: string;
  percentual_preenchimento: number;
  criado_em: string;
  atualizado_em: string;
  enviado_em: string | null;
  enviado_por_nome: string | null;
  enviado_por_condicao: CondicaoResponsavel | null;
  analise_iniciada_em: string | null;
  devolvido_em: string | null;
  motivo_devolucao: string | null;
  validado_em: string | null;
  validado_por: string | null;
  observacoes_validacao: string | null;
  publicado_em: string | null;
  substituido_em: string | null;
}

export interface ObservacaoDiagnostico {
  id: number;
  versao: number;
  tipo: "analise" | "devolucao";
  secao: string | null;
  campo_codigo: string | null;
  texto: string;
  visivel_respondente: boolean;
  criado_em: string;
}

export interface AnexoDiagnostico {
  id: number;
  versao: number;
  secao: string;
  nome_arquivo: string;
  storage_path: string;
  tamanho_bytes: number | null;
  tipo_mime: string | null;
  classificacao: "interno" | "publicavel";
  enviado_em: string;
}

export interface EventoAuditoria {
  id: number;
  versao: number | null;
  acao: string;
  valor_anterior: unknown;
  valor_novo: Record<string, unknown> | null;
  data_registro: string;
}

export interface ItemPrevia {
  codigo: string;
  campo_destino: string;
  tipo_destino: string;
  secao: string;
  periodo: string;
  valor_publicado_atual: string | null;
  valor_novo: string | null;
  valor_original: string | null;
  afeta_score: boolean;
  painel: string;
  confiabilidade: string | null;
  carater: "preliminar" | "definitivo";
  ignorado: string | null;
  altera: boolean;
  atualiza_painel: boolean;
  conflito: { promotoria: string; valor: string | null; diagnostico_id: string } | null;
}

export interface PreviaPublicacao {
  diagnostico_id: string;
  versao: number;
  codigo_ibge: string;
  periodo_referencia: string;
  carater: "preliminar" | "definitivo";
  itens: ItemPrevia[];
}

export interface ResultadoPublicacao {
  ok: boolean;
  erro?: string;
  publicacao_id?: number;
  validado?: boolean;
  ja_publicado?: boolean;
}

const BUCKET_ANEXOS = "diagnostico-anexos";

const SELECT_RESUMO =
  "*, promotorias_justica(nome, comarca_sede), municipios(municipio, comarca, polo_regional)";

type LinhaResumo = Omit<
  DiagnosticoResumo,
  "promotoria_nome" | "comarca_sede" | "municipio" | "comarca" | "polo_regional"
> & {
  promotorias_justica: { nome: string; comarca_sede: string } | null;
  municipios: { municipio: string; comarca: string; polo_regional: string } | null;
};

function paraResumo(l: LinhaResumo): DiagnosticoResumo {
  const { promotorias_justica: p, municipios: m, ...resto } = l;
  return {
    ...resto,
    atribuicao: resto.atribuicao ?? [],
    promotoria_nome: p?.nome ?? resto.promotoria_id,
    comarca_sede: p?.comarca_sede ?? "",
    municipio: m?.municipio ?? resto.codigo_ibge,
    comarca: m?.comarca ?? "",
    polo_regional: m?.polo_regional ?? "",
  };
}

function erro(e: { message: string } | null) {
  if (e) throw new Error(e.message);
}

class DiagnosticoService {
  // RLS: o CAOCRIM vê todos; o Promotor, apenas os das Promotorias a que está vinculado
  async listar(): Promise<DiagnosticoResumo[]> {
    const { data, error } = await supabase
      .from("diagnostico_brigid")
      .select(SELECT_RESUMO)
      .order("data_atualizacao", { ascending: false });
    erro(error);
    return (data as LinhaResumo[]).map(paraResumo);
  }

  async obter(id: string): Promise<DiagnosticoResumo | null> {
    const { data, error } = await supabase
      .from("diagnostico_brigid")
      .select(SELECT_RESUMO)
      .eq("id", id)
      .maybeSingle();
    erro(error);
    return data ? paraResumo(data as LinhaResumo) : null;
  }

  async versoes(id: string): Promise<VersaoDiagnostico[]> {
    const { data, error } = await supabase
      .from("diagnostico_versoes")
      .select("*")
      .eq("diagnostico_id", id)
      .order("numero", { ascending: false });
    erro(error);
    return data as VersaoDiagnostico[];
  }

  async observacoes(id: string): Promise<ObservacaoDiagnostico[]> {
    const { data, error } = await supabase
      .from("diagnostico_observacoes")
      .select("*")
      .eq("diagnostico_id", id)
      .order("criado_em", { ascending: true });
    erro(error);
    return data as ObservacaoDiagnostico[];
  }

  async anexos(id: string): Promise<AnexoDiagnostico[]> {
    const { data, error } = await supabase
      .from("diagnostico_anexos")
      .select("*")
      .eq("diagnostico_id", id)
      .order("enviado_em", { ascending: true });
    erro(error);
    return data as AnexoDiagnostico[];
  }

  async auditoria(id: string): Promise<EventoAuditoria[]> {
    const { data, error } = await supabase
      .from("diagnostico_auditoria")
      .select("id, versao, acao, valor_anterior, valor_novo, data_registro")
      .eq("diagnostico_id", id)
      .neq("acao", "rascunho_salvo")
      .order("data_registro", { ascending: true });
    erro(error);
    return data as EventoAuditoria[];
  }

  // --- Promotor ---

  async criar(
    promotoriaId: string,
    codigoIbge: string,
    periodo: string,
    responsavel: Responsavel,
    atribuicao?: string[],
  ) {
    const { data, error } = await supabase.rpc("diagnostico_criar", {
      p_promotoria_id: promotoriaId,
      p_codigo_ibge: codigoIbge,
      p_periodo: periodo,
      p_atribuicao: atribuicao ?? null,
      p_responsavel_nome: responsavel.nome,
      p_responsavel_condicao: responsavel.condicao,
    });
    if (error) {
      const existente = error.message.match(/DIAGNOSTICO_EXISTENTE:(\S+)/);
      if (existente) {
        const e = new Error("Já existe diagnóstico desta Promotoria para o município e período.");
        (e as Error & { diagnosticoExistente?: string }).diagnosticoExistente = existente[1];
        throw e;
      }
      throw new Error(error.message);
    }
    return data as string;
  }

  // responsavel: informado apenas quando a pessoa que responde pela conta mudou
  async salvarRascunho(
    id: string,
    respostas: Respostas,
    atribuicao?: string[],
    responsavel?: Responsavel,
  ) {
    const { data, error } = await supabase.rpc("diagnostico_salvar_rascunho", {
      p_id: id,
      p_respostas: respostas,
      p_atribuicao: atribuicao ?? null,
      p_responsavel_nome: responsavel?.nome ?? null,
      p_responsavel_condicao: responsavel?.condicao ?? null,
    });
    erro(error);
    return data as { percentual: number };
  }

  // A declaração de quem assina fica gravada na versão enviada
  async enviar(id: string, responsavel: Responsavel) {
    const { error } = await supabase.rpc("diagnostico_enviar", {
      p_id: id,
      p_responsavel_nome: responsavel.nome,
      p_responsavel_condicao: responsavel.condicao,
    });
    erro(error);
  }

  async novaVersao(id: string) {
    const { data, error } = await supabase.rpc("diagnostico_nova_versao", { p_id: id });
    erro(error);
    return data as number;
  }

  async enviarAnexo(id: string, secao: string, arquivo: File) {
    const seguro = arquivo.name.normalize("NFD").replace(/[^\w.-]+/g, "_");
    const caminho = `${id}/${crypto.randomUUID()}-${seguro}`;
    const { error: up } = await supabase.storage.from(BUCKET_ANEXOS).upload(caminho, arquivo, {
      contentType: arquivo.type || undefined,
      upsert: false,
    });
    erro(up);
    const { error } = await supabase.rpc("diagnostico_registrar_anexo", {
      p_id: id,
      p_secao: secao,
      p_nome: arquivo.name,
      p_storage_path: caminho,
      p_tamanho: arquivo.size,
      p_mime: arquivo.type || null,
    });
    if (error) {
      await supabase.storage.from(BUCKET_ANEXOS).remove([caminho]);
      throw new Error(error.message);
    }
  }

  async removerAnexo(anexoId: number) {
    const { data, error } = await supabase.rpc("diagnostico_remover_anexo", {
      p_anexo_id: anexoId,
    });
    erro(error);
    await supabase.storage.from(BUCKET_ANEXOS).remove([data as string]);
  }

  async urlAnexo(caminho: string) {
    const { data, error } = await supabase.storage
      .from(BUCKET_ANEXOS)
      .createSignedUrl(caminho, 300);
    erro(error);
    return data!.signedUrl;
  }

  // --- CAOCRIM ---

  async iniciarAnalise(id: string) {
    const { error } = await supabase.rpc("diagnostico_iniciar_analise", { p_id: id });
    erro(error);
  }

  async registrarObservacao(
    id: string,
    versao: number,
    secao: string | null,
    campo: string | null,
    texto: string,
  ) {
    const { error } = await supabase.rpc("diagnostico_registrar_observacao", {
      p_id: id,
      p_versao: versao,
      p_secao: secao,
      p_campo: campo,
      p_texto: texto,
    });
    erro(error);
  }

  async devolver(
    id: string,
    versao: number,
    motivo: string,
    observacoes: { secao: string; campo_codigo: string | null; texto: string }[],
  ) {
    const { error } = await supabase.rpc("diagnostico_devolver", {
      p_id: id,
      p_versao: versao,
      p_motivo: motivo,
      p_observacoes: observacoes,
    });
    erro(error);
  }

  async previaPublicacao(id: string, versao: number): Promise<PreviaPublicacao> {
    const { data, error } = await supabase.rpc("diagnostico_previa_publicacao", {
      p_id: id,
      p_versao: versao,
    });
    erro(error);
    return data as PreviaPublicacao;
  }

  async validarEPublicar(
    id: string,
    versao: number,
    hash: string,
    observacoes: string,
    conflitos: string[],
  ) {
    const { data, error } = await supabase.rpc("diagnostico_validar_e_publicar", {
      p_id: id,
      p_versao: versao,
      p_hash: hash,
      p_observacoes: observacoes || null,
      p_confirmar_conflitos: conflitos,
    });
    erro(error);
    return data as ResultadoPublicacao;
  }

  async publicar(id: string, versao: number, hash: string, conflitos: string[]) {
    const { data, error } = await supabase.rpc("diagnostico_publicar", {
      p_id: id,
      p_versao: versao,
      p_hash: hash,
      p_confirmar_conflitos: conflitos,
    });
    erro(error);
    return data as ResultadoPublicacao;
  }
}

export const diagnosticoService = new DiagnosticoService();
