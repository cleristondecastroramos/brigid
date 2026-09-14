export type SecaoId = 'identificacao' | 'cidadania' | 'fluxos' | 'socioassistencial' | 'penal_seguranca' | 'penal_violencia' | 'gargalos';

export interface CampoDicionario {
  id: string;
  codigo_tecnico: string;
  secao: SecaoId;
  rotulo: string;
  descricao?: string;
  tipo_controle: 'radio' | 'select' | 'text' | 'textarea' | 'number' | 'checkbox_group';
  opcoes?: { label: string; value: string }[];
  obrigatorio?: boolean;
  regra_exibicao?: (respostas: any, atribuicao: string[]) => boolean;
}

export const dicionarioDiagnostico: CampoDicionario[] = [
  // IDENTIFICAÇÃO
  {
    id: 'DGN_SITUACAO',
    codigo_tecnico: 'DGN_SITUACAO',
    secao: 'identificacao',
    rotulo: 'Situação do diagnóstico',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Primeiro diagnóstico', value: 'primeiro' },
      { label: 'Atualização de diagnóstico anterior', value: 'atualizacao' },
      { label: 'Revisão de informações', value: 'revisao' },
      { label: 'Complementação de dados', value: 'complementacao' },
      { label: 'Correção de informação', value: 'correcao' },
    ],
    obrigatorio: true,
  },
  
  // CIDADANIA E INFRAESTRUTURA
  {
    id: 'INF_OPM_STATUS',
    codigo_tecnico: 'INF_OPM_STATUS',
    secao: 'cidadania',
    rotulo: 'O município possui OPM (Secretaria, Coordenadoria, etc)?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, em funcionamento regular', value: 'funcionamento_regular' },
      { label: 'Sim, com funcionamento parcial', value: 'funcionamento_parcial' },
      { label: 'Sim, formalmente criado, mas inativo', value: 'criado_inativo' },
      { label: 'Em implantação', value: 'em_implantacao' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: 'INF_CREAS_STATUS',
    codigo_tecnico: 'INF_CREAS_STATUS',
    secao: 'cidadania',
    rotulo: 'O município possui CREAS em funcionamento?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, com funcionamento regular', value: 'funcionamento_regular' },
      { label: 'Sim, com funcionamento parcial', value: 'funcionamento_parcial' },
      { label: 'Sim, mas sem atendimento especializado para mulheres', value: 'sem_especializado' },
      { label: 'Em implantação', value: 'em_implantacao' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  
  // FLUXOS
  {
    id: 'FLX_FORMAL',
    codigo_tecnico: 'FLX_FORMAL',
    secao: 'fluxos',
    rotulo: 'O município possui fluxo formal de atendimento às mulheres vítimas de violência?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, formalizado por ato normativo', value: 'formal_ato' },
      { label: 'Sim, mas não formalizado', value: 'nao_formal' },
      { label: 'Em elaboração', value: 'elaboracao' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  
  // PENAL - SEGURANÇA E INVESTIGAÇÃO
  {
    id: 'SEG_PROTO_INV',
    codigo_tecnico: 'SEG_PROTO_INV',
    secao: 'penal_seguranca',
    rotulo: 'Existe protocolo de investigação para crimes de violência de gênero e feminicídio?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, vigente e aplicado', value: 'sim_aplicado' },
      { label: 'Sim, vigente, mas aplicado parcialmente', value: 'sim_parcial' },
      { label: 'Existe, mas não é aplicado', value: 'nao_aplicado' },
      { label: 'Em elaboração', value: 'elaboracao' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: 'SEG_PROTO_PER',
    codigo_tecnico: 'SEG_PROTO_PER',
    secao: 'penal_seguranca',
    rotulo: 'Existe protocolo ou procedimento operacional para realização das perícias?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, aplicado regularmente', value: 'sim_aplicado' },
      { label: 'Sim, aplicado parcialmente', value: 'sim_parcial' },
      { label: 'Existe, mas não é aplicado', value: 'nao_aplicado' },
      { label: 'Em elaboração', value: 'elaboracao' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },

  // PENAL - VIOLÊNCIA
  {
    id: 'VIO_ANO',
    codigo_tecnico: 'VIO_ANO',
    secao: 'penal_violencia',
    rotulo: 'Ano de Referência',
    tipo_controle: 'select',
    opcoes: [
      { label: '2023', value: '2023' },
      { label: '2024', value: '2024' },
      { label: '2025', value: '2025' },
      { label: '2026 (Preliminar / Ciclo Aberto)', value: '2026' },
    ],
    obrigatorio: true,
  },
  {
    id: 'VIO_TENTADOS',
    codigo_tecnico: 'VIO_TENTADOS',
    secao: 'penal_violencia',
    rotulo: 'Quantidade de feminicídios tentados',
    tipo_controle: 'number',
    obrigatorio: true,
  },
  {
    id: 'VIO_CONSUMADOS',
    codigo_tecnico: 'VIO_CONSUMADOS',
    secao: 'penal_violencia',
    rotulo: 'Quantidade de feminicídios consumados',
    tipo_controle: 'number',
    obrigatorio: true,
  },

  // OBSERVACOES E FONTES (Geral)
  {
    id: 'OBSERVACOES',
    codigo_tecnico: 'OBSERVACOES',
    secao: 'identificacao',
    rotulo: 'Observações Gerais e Fontes',
    descricao: 'Informações complementares sobre a metodologia da coleta de dados.',
    tipo_controle: 'textarea',
  },
];
