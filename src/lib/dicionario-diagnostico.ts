export type SecaoId = 'identificacao' | 'cidadania' | 'fluxos' | 'socioassistencial' | 'penal_seguranca' | 'penal_violencia' | 'gargalos';

// Regra de exibição declarativa: o mesmo critério é avaliado no navegador
// (src/lib/completude-diagnostico.ts) e no banco (tabela diagnostico_campos_regras).
export interface CondicaoExibicao {
  campo: string;
  valores?: string[];
  maiorQue?: number;
}

export interface CampoDicionario {
  id: string;
  codigo_tecnico: string;
  secao: SecaoId;
  rotulo: string;
  descricao?: string;
  tipo_controle: 'radio' | 'select' | 'text' | 'textarea' | 'number' | 'checkbox_group' | 'date';
  opcoes?: { label: string; value: string }[];
  obrigatorio?: boolean;
  condicao?: CondicaoExibicao;
}

// Valor gravado quando o respondente declara não saber informar (selects e campos numéricos).
// Nunca é convertido em "Não" ou zero; exige justificativa no campo <codigo>_JUSTIFICATIVA.
export const VALOR_NAO_SABE = 'nao_sabe';
export const sufixoJustificativa = '_JUSTIFICATIVA';

export const SECOES: { id: SecaoId; label: string; grupo: 'comum' | 'civel' | 'criminal' }[] = [
  { id: 'identificacao', label: 'Identificação', grupo: 'comum' },
  { id: 'cidadania', label: 'Cidadania', grupo: 'civel' },
  { id: 'fluxos', label: 'Fluxos', grupo: 'civel' },
  { id: 'socioassistencial', label: 'Socioassistencial', grupo: 'civel' },
  { id: 'penal_seguranca', label: 'Segurança', grupo: 'criminal' },
  { id: 'penal_violencia', label: 'Violência', grupo: 'criminal' },
  { id: 'gargalos', label: 'Gargalos', grupo: 'criminal' },
];

export const ATRIBUICOES: { value: string; label: string }[] = [
  { value: 'civel', label: 'Cidadania/Cível' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'cumulativa', label: 'Cumulativa' },
  { value: 'unica', label: 'Promotoria Única' },
];

export function rotuloAtribuicao(valor?: string) {
  return ATRIBUICOES.find((a) => a.value === valor)?.label ?? valor ?? 'Pendente';
}

// Helper para adicionar os campos transversais em todas as seções, se precisássemos mapear dinamicamente, mas vamos adicionar manualmente para controle de ID.
const addTransversais = (secao: SecaoId, prefixo: string): CampoDicionario[] => [
  {
    id: `${prefixo}_FONTE`,
    codigo_tecnico: `${prefixo}_FONTE`,
    secao,
    rotulo: 'Fonte da informação',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Ofício', value: 'oficio' },
      { label: 'Relatório institucional', value: 'relatorio' },
      { label: 'Sistema oficial', value: 'sistema' },
      { label: 'Procedimento administrativo', value: 'procedimento' },
      { label: 'Reunião técnica', value: 'reuniao' },
      { label: 'Informação prestada por órgão público', value: 'info_orgao' },
      { label: 'Conhecimento direto da unidade', value: 'conhecimento' },
      { label: 'Consulta a documento', value: 'documento' },
      { label: 'Outra fonte', value: 'outra' },
    ],
    obrigatorio: true,
  },
  {
    id: `${prefixo}_CONFIABILIDADE`,
    codigo_tecnico: `${prefixo}_CONFIABILIDADE`,
    secao,
    rotulo: 'Grau de confiabilidade',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Confirmado por documento', value: 'documento' },
      { label: 'Confirmado por mais de uma fonte', value: 'multiplas_fontes' },
      { label: 'Informação declaratória', value: 'declaratoria' },
      { label: 'Estimativa', value: 'estimativa' },
      { label: 'Pendente de validação', value: 'pendente' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: `${prefixo}_DATA_REF`,
    codigo_tecnico: `${prefixo}_DATA_REF`,
    secao,
    rotulo: 'Data de referência',
    descricao: 'Data de coleta ou referência das informações fornecidas neste bloco',
    tipo_controle: 'text',
    obrigatorio: true,
  },
  {
    id: `${prefixo}_OBSERVACOES`,
    codigo_tecnico: `${prefixo}_OBSERVACOES`,
    secao,
    rotulo: 'Observações do bloco e indicação de Anexos',
    descricao: 'Registrar informações relevantes, indicação de documentos anexados, fontes consultadas, limitações do diagnóstico, etc.',
    tipo_controle: 'textarea',
  }
];

export const dicionarioDiagnostico: CampoDicionario[] = [
  // ==========================================
  // IDENTIFICAÇÃO
  // ==========================================
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
  ...addTransversais('identificacao', 'IDEN'),

  // ==========================================
  // 5. BLOCO CIDADANIA E INFRAESTRUTURA
  // ==========================================
  // 5.1 OPM
  {
    id: 'CID_OPM_STATUS',
    codigo_tecnico: 'CID_OPM_STATUS',
    secao: 'cidadania',
    rotulo: 'O município possui Secretaria, Coordenadoria ou órgão equivalente de Políticas para as Mulheres?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, em funcionamento regular', value: 'funcionamento_regular' },
      { label: 'Sim, formalmente criado, mas sem funcionamento efetivo', value: 'criado_inativo' },
      { label: 'Em processo de implantação', value: 'em_implantacao' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: 'CID_OPM_NOME',
    codigo_tecnico: 'CID_OPM_NOME',
    secao: 'cidadania',
    rotulo: 'Nome do órgão',
    tipo_controle: 'text',
    condicao: { campo: 'CID_OPM_STATUS', valores: ['funcionamento_regular', 'criado_inativo'] },
  },
  {
    id: 'CID_OPM_TIPO',
    codigo_tecnico: 'CID_OPM_TIPO',
    secao: 'cidadania',
    rotulo: 'Tipo de estrutura',
    tipo_controle: 'text',
    condicao: { campo: 'CID_OPM_STATUS', valores: ['funcionamento_regular', 'criado_inativo'] },
  },
  {
    id: 'CID_OPM_DATA_CRIACAO',
    codigo_tecnico: 'CID_OPM_DATA_CRIACAO',
    secao: 'cidadania',
    rotulo: 'Data de criação e instrumento legal',
    tipo_controle: 'text',
    condicao: { campo: 'CID_OPM_STATUS', valores: ['funcionamento_regular', 'criado_inativo'] },
  },
  {
    id: 'CID_OPM_RESPONSAVEL',
    codigo_tecnico: 'CID_OPM_RESPONSAVEL',
    secao: 'cidadania',
    rotulo: 'Responsável e contato (telefone/e-mail)',
    tipo_controle: 'text',
    condicao: { campo: 'CID_OPM_STATUS', valores: ['funcionamento_regular', 'criado_inativo'] },
  },
  {
    id: 'CID_OPM_ENDERECO',
    codigo_tecnico: 'CID_OPM_ENDERECO',
    secao: 'cidadania',
    rotulo: 'Endereço',
    tipo_controle: 'text',
    condicao: { campo: 'CID_OPM_STATUS', valores: ['funcionamento_regular', 'criado_inativo'] },
  },
  {
    id: 'CID_OPM_EQUIPE',
    codigo_tecnico: 'CID_OPM_EQUIPE',
    secao: 'cidadania',
    rotulo: 'Equipe disponível',
    tipo_controle: 'textarea',
    condicao: { campo: 'CID_OPM_STATUS', valores: ['funcionamento_regular', 'criado_inativo'] },
  },
  {
    id: 'CID_OPM_PLANO',
    codigo_tecnico: 'CID_OPM_PLANO',
    secao: 'cidadania',
    rotulo: 'Existência de plano municipal de políticas e orçamento',
    tipo_controle: 'textarea',
    condicao: { campo: 'CID_OPM_STATUS', valores: ['funcionamento_regular', 'criado_inativo'] },
  },
  {
    id: 'CID_OPM_ACOES',
    codigo_tecnico: 'CID_OPM_ACOES',
    secao: 'cidadania',
    rotulo: 'Público atendido e principais ações realizadas',
    tipo_controle: 'textarea',
    condicao: { campo: 'CID_OPM_STATUS', valores: ['funcionamento_regular', 'criado_inativo'] },
  },
  {
    id: 'CID_OPM_CAPACIDADE',
    codigo_tecnico: 'CID_OPM_CAPACIDADE',
    secao: 'cidadania',
    rotulo: 'O órgão possui capacidade efetiva de executar políticas públicas para mulheres?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, integralmente', value: 'integralmente' },
      { label: 'Sim, parcialmente', value: 'parcialmente' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    condicao: { campo: 'CID_OPM_STATUS', valores: ['funcionamento_regular', 'criado_inativo'] },
  },
  // 5.2 CREAS
  {
    id: 'CID_CREAS_STATUS',
    codigo_tecnico: 'CID_CREAS_STATUS',
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
  {
    id: 'CID_CREAS_ENDERECO',
    codigo_tecnico: 'CID_CREAS_ENDERECO',
    secao: 'cidadania',
    rotulo: 'Endereço e abrangência territorial',
    tipo_controle: 'text',
    condicao: { campo: 'CID_CREAS_STATUS', valores: ['funcionamento_regular', 'funcionamento_parcial', 'sem_especializado'] },
  },
  {
    id: 'CID_CREAS_EQUIPE',
    codigo_tecnico: 'CID_CREAS_EQUIPE',
    secao: 'cidadania',
    rotulo: 'Equipe disponível, horários e capacidade média de atendimento',
    tipo_controle: 'textarea',
    condicao: { campo: 'CID_CREAS_STATUS', valores: ['funcionamento_regular', 'funcionamento_parcial', 'sem_especializado'] },
  },
  {
    id: 'CID_CREAS_ARTICULACAO',
    codigo_tecnico: 'CID_CREAS_ARTICULACAO',
    secao: 'cidadania',
    rotulo: 'Articulação com Promotoria, saúde, segurança e existência de fluxo',
    tipo_controle: 'textarea',
    condicao: { campo: 'CID_CREAS_STATUS', valores: ['funcionamento_regular', 'funcionamento_parcial', 'sem_especializado'] },
  },
  // 5.3 Efetividade
  {
    id: 'CID_POL_EXISTE',
    codigo_tecnico: 'CID_POL_EXISTE',
    secao: 'cidadania',
    rotulo: 'Existem políticas públicas municipais específicas para mulheres em situação de violência?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, plenamente implementadas', value: 'plenamente' },
      { label: 'Sim, parcialmente implementadas', value: 'parcialmente' },
      { label: 'Existem apenas ações isoladas', value: 'isoladas' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: 'CID_POL_DETALHES',
    codigo_tecnico: 'CID_POL_DETALHES',
    secao: 'cidadania',
    rotulo: 'Detalhes sobre plano, orçamento, metas e ações preventivas',
    tipo_controle: 'textarea',
    condicao: { campo: 'CID_POL_EXISTE', valores: ['plenamente', 'parcialmente', 'isoladas'] },
  },
  ...addTransversais('cidadania', 'CID'),

  // ==========================================
  // 6. BLOCO FLUXOS DE ATENDIMENTO
  // ==========================================
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
  {
    id: 'FLX_FORMAL_DETALHES',
    codigo_tecnico: 'FLX_FORMAL_DETALHES',
    secao: 'fluxos',
    rotulo: 'Detalhes do fluxo formal (instrumento, órgãos, órgão coordenador, etc)',
    tipo_controle: 'textarea',
    condicao: { campo: 'FLX_FORMAL', valores: ['formal_ato', 'nao_formal'] },
  },
  {
    id: 'FLX_PROTOCOLO',
    codigo_tecnico: 'FLX_PROTOCOLO',
    secao: 'fluxos',
    rotulo: 'Existe protocolo local ou regional de atendimento?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, vigente', value: 'vigente' },
      { label: 'Sim, desatualizado', value: 'desatualizado' },
      { label: 'Em elaboração', value: 'elaboracao' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: 'FLX_PROTOCOLO_DETALHES',
    codigo_tecnico: 'FLX_PROTOCOLO_DETALHES',
    secao: 'fluxos',
    rotulo: 'O protocolo define responsabilidades, prazos, riscos, e abrange tentativa/consumação?',
    tipo_controle: 'textarea',
    condicao: { campo: 'FLX_PROTOCOLO', valores: ['vigente', 'desatualizado'] },
  },
  {
    id: 'FLX_SALA',
    codigo_tecnico: 'FLX_SALA',
    secao: 'fluxos',
    rotulo: 'Existe sala ou ambiente especializado para atendimento?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, em funcionamento adequado', value: 'adequado' },
      { label: 'Sim, com funcionamento parcial', value: 'parcial' },
      { label: 'Existe, mas não atende aos requisitos necessários', value: 'inadequado' },
      { label: 'Em implantação', value: 'implantacao' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: 'FLX_RECURSOS',
    codigo_tecnico: 'FLX_RECURSOS',
    secao: 'fluxos',
    rotulo: 'A rede municipal dispõe dos recursos mínimos necessários?',
    descricao: 'Avaliar: recursos humanos, espaço, transporte, psicólogo, assistência jurídica, acolhimento...',
    tipo_controle: 'textarea',
    obrigatorio: true,
  },
  {
    id: 'FLX_PSICO',
    codigo_tecnico: 'FLX_PSICO',
    secao: 'fluxos',
    rotulo: 'Existe atendimento psicossocial especializado?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, regular', value: 'regular' },
      { label: 'Sim, eventual', value: 'eventual' },
      { label: 'Sim, mediante encaminhamento', value: 'encaminhamento' },
      { label: 'Em implantação', value: 'implantacao' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: 'FLX_PSICO_DETALHES',
    codigo_tecnico: 'FLX_PSICO_DETALHES',
    secao: 'fluxos',
    rotulo: 'Detalhes do atendimento psicossocial (órgão, profissionais, acesso, etc)',
    tipo_controle: 'textarea',
    condicao: { campo: 'FLX_PSICO', valores: ['regular', 'eventual', 'encaminhamento'] },
  },
  ...addTransversais('fluxos', 'FLX'),

  // ==========================================
  // 7. BLOCO SOCIOASSISTENCIAL
  // ==========================================
  {
    id: 'SOC_PROTOCOLO',
    codigo_tecnico: 'SOC_PROTOCOLO',
    secao: 'socioassistencial',
    rotulo: 'Existe protocolo específico da assistência social para atendimento?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, vigente', value: 'vigente' },
      { label: 'Sim, desatualizado', value: 'desatualizado' },
      { label: 'Em elaboração', value: 'elaboracao' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: 'SOC_FLUXO',
    codigo_tecnico: 'SOC_FLUXO',
    secao: 'socioassistencial',
    rotulo: 'Há fluxo formal de encaminhamento entre Promotoria, CREAS, CRAS, etc?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, integrado', value: 'integrado' },
      { label: 'Sim, parcialmente integrado', value: 'parcialmente' },
      { label: 'Informal', value: 'informal' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: 'SOC_FLUXO_DETALHES',
    codigo_tecnico: 'SOC_FLUXO_DETALHES',
    secao: 'socioassistencial',
    rotulo: 'Detalhes (órgão de entrada, referência, prazos, etc)',
    tipo_controle: 'textarea',
    condicao: { campo: 'SOC_FLUXO', valores: ['integrado', 'parcialmente', 'informal'] },
  },
  {
    id: 'SOC_ARTIC_CREAS',
    codigo_tecnico: 'SOC_ARTIC_CREAS',
    secao: 'socioassistencial',
    rotulo: 'Como ocorre a articulação com o CREAS?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Formal e regular', value: 'formal_regular' },
      { label: 'Formal, mas irregular', value: 'formal_irregular' },
      { label: 'Informal', value: 'informal' },
      { label: 'Não há articulação', value: 'nenhuma' },
      { label: 'O município não possui CREAS', value: 'sem_creas' },
    ],
    obrigatorio: true,
  },
  {
    id: 'SOC_EQUIPE',
    codigo_tecnico: 'SOC_EQUIPE',
    secao: 'socioassistencial',
    rotulo: 'O CREAS possui equipe mínima suficiente para atendimento?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim', value: 'sim' },
      { label: 'Parcialmente', value: 'parcialmente' },
      { label: 'Não', value: 'nao' },
      { label: 'Não se aplica', value: 'nao_aplica' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: 'SOC_EQUIPE_DETALHES',
    codigo_tecnico: 'SOC_EQUIPE_DETALHES',
    secao: 'socioassistencial',
    rotulo: 'Detalhes da equipe (número de assistentes sociais, psicólogos, etc)',
    tipo_controle: 'textarea',
    condicao: { campo: 'SOC_EQUIPE', valores: ['sim', 'parcialmente', 'nao'] },
  },
  {
    id: 'SOC_CAPACITA_QTD',
    codigo_tecnico: 'SOC_CAPACITA_QTD',
    secao: 'socioassistencial',
    rotulo: 'Quantos profissionais da rede foram capacitados em violência de gênero?',
    tipo_controle: 'number',
  },
  {
    id: 'SOC_CAPACITA_DETALHES',
    codigo_tecnico: 'SOC_CAPACITA_DETALHES',
    secao: 'socioassistencial',
    rotulo: 'Detalhes da capacitação (temas, instituição, última data)',
    tipo_controle: 'textarea',
  },
  ...addTransversais('socioassistencial', 'SOC'),

  // ==========================================
  // 8. BLOCO PENAL E SEGURANÇA
  // ==========================================
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
    id: 'SEG_PROTO_INV_DETALHES',
    codigo_tecnico: 'SEG_PROTO_INV_DETALHES',
    secao: 'penal_seguranca',
    rotulo: 'Detalhes do protocolo de investigação',
    tipo_controle: 'textarea',
    condicao: { campo: 'SEG_PROTO_INV', valores: ['sim_aplicado', 'sim_parcial', 'nao_aplicado'] },
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
  {
    id: 'SEG_PROTO_PER_DETALHES',
    codigo_tecnico: 'SEG_PROTO_PER_DETALHES',
    secao: 'penal_seguranca',
    rotulo: 'Detalhes da perícia (preservação do local, prazo, exames, etc)',
    tipo_controle: 'textarea',
    condicao: { campo: 'SEG_PROTO_PER', valores: ['sim_aplicado', 'sim_parcial', 'nao_aplicado'] },
  },
  {
    id: 'SEG_CAPACITA',
    codigo_tecnico: 'SEG_CAPACITA',
    secao: 'penal_seguranca',
    rotulo: 'As equipes de investigação e atendimento receberam capacitação em perspectiva de gênero?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Sim, nos últimos 12 meses', value: 'sim_recent' },
      { label: 'Sim, há mais de 12 meses', value: 'sim_antigo' },
      { label: 'Capacitação eventual', value: 'eventual' },
      { label: 'Não', value: 'nao' },
      { label: 'Não soube informar', value: 'nao_sabe' },
    ],
    obrigatorio: true,
  },
  {
    id: 'SEG_ADERENCIA',
    codigo_tecnico: 'SEG_ADERENCIA',
    secao: 'penal_seguranca',
    rotulo: 'Como a unidade avalia a aderência dos procedimentos locais aos protocolos técnicos?',
    tipo_controle: 'select',
    opcoes: [
      { label: 'Adequada', value: 'adequada' },
      { label: 'Parcialmente adequada', value: 'parcialmente' },
      { label: 'Inadequada', value: 'inadequada' },
      { label: 'Não é possível avaliar', value: 'nao_avalia' },
    ],
    obrigatorio: true,
  },
  {
    id: 'SEG_ADERENCIA_JUST',
    codigo_tecnico: 'SEG_ADERENCIA_JUST',
    secao: 'penal_seguranca',
    rotulo: 'Justificativa / Procedimento exemplificativo',
    tipo_controle: 'textarea',
  },
  ...addTransversais('penal_seguranca', 'SEG'),

  // ==========================================
  // 9. BLOCO VIOLÊNCIA
  // ==========================================
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
    id: 'VIO_PERIODO',
    codigo_tecnico: 'VIO_PERIODO',
    secao: 'penal_violencia',
    rotulo: 'Período de referência (Ex: Jan-Jun)',
    tipo_controle: 'text',
  },
  // Tentados
  {
    id: 'VIO_TENTADOS',
    codigo_tecnico: 'VIO_TENTADOS',
    secao: 'penal_violencia',
    rotulo: 'Quantidade de feminicídios tentados',
    tipo_controle: 'number',
    obrigatorio: true,
  },
  {
    id: 'VIO_TENTADOS_DETALHES',
    codigo_tecnico: 'VIO_TENTADOS_DETALHES',
    secao: 'penal_violencia',
    rotulo: 'Detalhes (vítimas, inquéritos, processos, prisões, autoria, andamento)',
    tipo_controle: 'textarea',
    condicao: { campo: 'VIO_TENTADOS', maiorQue: 0 },
  },
  // Consumados
  {
    id: 'VIO_CONSUMADOS',
    codigo_tecnico: 'VIO_CONSUMADOS',
    secao: 'penal_violencia',
    rotulo: 'Quantidade de feminicídios consumados',
    tipo_controle: 'number',
    obrigatorio: true,
  },
  {
    id: 'VIO_CONSUMADOS_DETALHES',
    codigo_tecnico: 'VIO_CONSUMADOS_DETALHES',
    secao: 'penal_violencia',
    rotulo: 'Detalhes (vítimas, histórico de violência, medidas protetivas, situação do inquérito)',
    tipo_controle: 'textarea',
    condicao: { campo: 'VIO_CONSUMADOS', maiorQue: 0 },
  },
  ...addTransversais('penal_violencia', 'VIO'),

  // ==========================================
  // 10. BLOCO GARGALOS (Multiseleção)
  // ==========================================
  {
    id: 'GAR_LISTA',
    codigo_tecnico: 'GAR_LISTA',
    secao: 'gargalos',
    rotulo: 'Selecione os principais gargalos identificados',
    tipo_controle: 'checkbox_group',
    opcoes: [
      { label: 'Ausência de protocolo', value: 'ausencia_protocolo' },
      { label: 'Protocolo desatualizado', value: 'protocolo_desatualizado' },
      { label: 'Baixa capacitação', value: 'baixa_capacitacao' },
      { label: 'Demora na investigação', value: 'demora_investigacao' },
      { label: 'Demora pericial', value: 'demora_pericial' },
      { label: 'Deficiência de equipe', value: 'deficiencia_equipe' },
      { label: 'Dificuldade de acesso à vítima', value: 'acesso_vitima' },
      { label: 'Falha de comunicação entre órgãos', value: 'comunicacao' },
      { label: 'Ausência de atendimento psicossocial', value: 'ausencia_psicossocial' },
      { label: 'Ausência de CREAS', value: 'ausencia_creas' },
      { label: 'Ausência de OPM', value: 'ausencia_opm' },
      { label: 'Falta de transporte', value: 'falta_transporte' },
      { label: 'Falta de abrigo', value: 'falta_abrigo' },
      { label: 'Ausência de fluxo de encaminhamento', value: 'ausencia_fluxo' },
      { label: 'Falta de estrutura física', value: 'falta_estrutura' },
      { label: 'Falta de dados / subnotificação', value: 'falta_dados' },
      { label: 'Outro', value: 'outro' },
    ],
    obrigatorio: true,
  },
  {
    id: 'GAR_DETALHES',
    codigo_tecnico: 'GAR_DETALHES',
    secao: 'gargalos',
    rotulo: 'Descreva os gargalos selecionados (impacto, frequência, órgão responsável, solução sugerida)',
    tipo_controle: 'textarea',
    obrigatorio: true,
  },
  ...addTransversais('gargalos', 'GAR'),
];
