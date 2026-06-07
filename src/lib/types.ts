export type SimNao = "SIM" | "NAO" | "";
export type RiscoNivel = "BAIXO" | "MEDIO" | "ALTO" | "CRITICO" | string;
export type AlertaRede = "ADEQUADO" | "ATENCAO" | "CRITICO" | string;

export interface Municipio {
  codigo_ibge: string;
  municipio: string;
  populacao: number;
  populacao_feminina?: number; // Para futura migração de denominador
  comarca: string;
  polo_regional: string;
  municipio_slug: string;
  comarca_slug: string;
  polo_regional_slug: string;
  opm_possui: SimNao;
  opm_status_politicas_publicas: string;
  opm_orgaotipo: string;
  opm_possui_estrutura_ativa: SimNao;
  creas_possui: SimNao;
  creas_status: string;
  creas_ausente: SimNao;
  prioridade_implantacao_creas: string;
  prioridade_fomento_opm: string;
  consumado: number;
  tentado: number;
  consumado_2023: number;
  consumado_2024: number;
  consumado_2025: number;
  consumado_2026: number;
  tentado_2023: number;
  tentado_2024: number;
  tentado_2025: number;
  tentado_2026: number;
  feminicidios_consumados_2023_2025: number;
  feminicidios_tentados_2023_2025: number;
  ocorrencias_total_violencia_genero_monitoradas: number;
  indicador_tem_feminicidio_consumado: SimNao;
  indicador_tem_tentativa_feminicidio: SimNao;
  risco_feminicidio_nivel: RiscoNivel;
  risco_feminicidio_score: number;
  painel_alerta_rede: AlertaRede;
  necessita_atuacao_prioritaria: SimNao;
  status_monitoramento: string;
  fonte_base_opm: string;
  fonte_base_creas: string;
  fonte_base_risco: string;
  observacoes_sistema: string;
  ultima_atualizacao_referencia: string;
  id: string;

  // Campos calculados por população (Taxas por 100k hab)
  taxa_feminicidios_100k?: number;
  taxa_tentativas_100k?: number;

  // Novos campos do módulo de Diagnóstico
  tem_fluxo_formal?: SimNao;
  tem_protocolo_local_regional?: SimNao;
  tem_atendimento_psicossocial?: SimNao;
  tem_atendimento_juridico?: SimNao;
  tem_equipe_multiprofissional?: SimNao;
  tem_sala_especializada?: SimNao;
  tem_articulacao_rede?: SimNao;
  tem_recursos_minimos?: SimNao;
  grau_suficiencia_estrutura?: "ADEQUADO" | "PARCIAL" | "INSUFICIENTE" | string;

  // Painel 2 - Violência de Gênero, Investigação e Perícias
  feminicidios_consumados_2023_2025?: number;
  feminicidios_tentados_2023_2025?: number;
  tem_protocolo_investigacao?: SimNao;
  tem_protocolo_pericial?: SimNao;
  capacitado_perspectiva_genero?: SimNao;
  qtd_capacitacoes_realizadas?: number;
  treinamento_especifico_feminicidio?: SimNao;
  grau_aderencia_protocolo?: "ALTO" | "MEDIO" | "BAIXO" | string;
  gargalos_identificados?: string;

  // Painel 3 - Assistência Social e Capacitação
  tem_protocolo_assistencial?: SimNao;
  tem_fluxo_encaminhamento?: SimNao;
  articulacao_creas_rede?: SimNao;
  tem_equipe_minima_creas?: SimNao;
  profissionais_capacitados?: number;
  data_ultima_capacitacao?: string;

  // Índices Sintéticos (calculados dinamicamente)
  ier_score?: number; // Índice de Estrutura da Rede (0-10)
  imf_score?: number; // Índice de Maturidade dos Fluxos (0-10)
  iqt_score?: number; // Índice de Qualificação Técnica (0-10)

  // Eventos aninhados após migração do banco
  eventos_feminicidio?: EventoFeminicidio[];
}

export interface EventoFeminicidio {
  id?: string;
  municipio_id: string;
  ano_fato: number;
  tipo_evento: "CONSUMADO" | "TENTADO" | string;
  quantidade: number;
  origem_dado?: string;
  status_periodo: "historico_fechado" | "janela_oficial" | "parcial_corrente" | string;
  considera_no_score: boolean;
  versao_metodologia: string;
  updated_at?: string;
}

