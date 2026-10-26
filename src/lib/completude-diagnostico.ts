import {
  dicionarioDiagnostico,
  SECOES,
  VALOR_NAO_SABE,
  sufixoJustificativa,
  type CampoDicionario,
  type SecaoId,
} from "./dicionario-diagnostico";

// Regras de completude do Diagnóstico BRIGID.
// ATENÇÃO: a função SQL public.diagnostico_completude() replica exatamente estas regras
// (ver database/migrations/05_fluxo_diagnostico.sql). Qualquer alteração aqui deve ser
// refletida lá e validada por scripts/testes/fluxo-diagnostico.test.mjs.

export type Respostas = Record<string, unknown>;

export interface IdentificacaoDiagnostico {
  promotoria_id?: string | null;
  codigo_ibge?: string | null;
  atribuicao?: string[] | null;
  periodo_referencia?: string | null;
}

export interface Pendencia {
  codigo: string;
  rotulo: string;
  secao: SecaoId;
  motivo: "sem_resposta" | "sem_justificativa" | "valor_invalido";
}

export interface ResultadoCompletude {
  percentual: number;
  total: number;
  preenchidos: number;
  pendencias: Pendencia[];
  porSecao: Partial<Record<SecaoId, { total: number; preenchidos: number; percentual: number }>>;
}

// Quantidades são inteiras e não negativas (mesma expressão usada no SQL)
const NUMERO = /^\d+$/;

export function secoesAplicaveis(atribuicao: string[] | null | undefined): SecaoId[] {
  const a = atribuicao ?? [];
  const civel = a.some((v) => ["civel", "cumulativa", "unica"].includes(v));
  const criminal = a.some((v) => ["criminal", "cumulativa", "unica"].includes(v));
  return SECOES.filter(
    (s) =>
      s.grupo === "comum" || (s.grupo === "civel" && civel) || (s.grupo === "criminal" && criminal),
  ).map((s) => s.id);
}

function texto(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export function campoVisivel(campo: CampoDicionario, respostas: Respostas): boolean {
  const c = campo.condicao;
  if (!c) return true;
  const v = texto(respostas[c.campo]);
  if (c.valores) return c.valores.includes(v);
  if (c.maiorQue !== undefined) return NUMERO.test(v) && Number(v) > c.maiorQue;
  return true;
}

export function exigeJustificativa(campo: CampoDicionario, respostas: Respostas): boolean {
  return texto(respostas[campo.codigo_tecnico]) === VALOR_NAO_SABE;
}

export function situacaoCampo(
  campo: CampoDicionario,
  respostas: Respostas,
): "ok" | Pendencia["motivo"] {
  const v = respostas[campo.codigo_tecnico];

  if (campo.tipo_controle === "checkbox_group") {
    return Array.isArray(v) && v.length > 0 ? "ok" : "sem_resposta";
  }

  const t = texto(v);
  if (t === "") return "sem_resposta";

  if (t === VALOR_NAO_SABE) {
    return texto(respostas[campo.codigo_tecnico + sufixoJustificativa]) !== ""
      ? "ok"
      : "sem_justificativa";
  }

  if (campo.tipo_controle === "number" && !NUMERO.test(t)) return "valor_invalido";
  return "ok";
}

export function camposAplicaveis(respostas: Respostas, atribuicao: string[] | null | undefined) {
  const secoes = secoesAplicaveis(atribuicao);
  return dicionarioDiagnostico.filter(
    (c) => secoes.includes(c.secao) && campoVisivel(c, respostas),
  );
}

export function calcularCompletude(
  respostas: Respostas,
  identificacao: IdentificacaoDiagnostico,
): ResultadoCompletude {
  const pendencias: Pendencia[] = [];
  const porSecao: ResultadoCompletude["porSecao"] = {};

  // Requisitos de identificação (colunas do diagnóstico, não do dicionário)
  const base: [string, string, boolean][] = [
    ["promotoria_id", "Promotoria respondente", !!identificacao.promotoria_id],
    ["codigo_ibge", "Município avaliado", !!identificacao.codigo_ibge],
    ["atribuicao", "Atribuição funcional", (identificacao.atribuicao ?? []).length > 0],
    ["periodo_referencia", "Período de referência", !!identificacao.periodo_referencia],
  ];
  let total = base.length;
  let preenchidos = 0;
  const ident = { total: base.length, preenchidos: 0, percentual: 0 };
  for (const [codigo, rotulo, ok] of base) {
    if (ok) {
      preenchidos++;
      ident.preenchidos++;
    } else {
      pendencias.push({ codigo, rotulo, secao: "identificacao", motivo: "sem_resposta" });
    }
  }
  porSecao.identificacao = ident;

  for (const campo of camposAplicaveis(respostas, identificacao.atribuicao)) {
    if (!campo.obrigatorio) continue;
    const s = (porSecao[campo.secao] ??= { total: 0, preenchidos: 0, percentual: 0 });
    total++;
    s.total++;
    const situacao = situacaoCampo(campo, respostas);
    if (situacao === "ok") {
      preenchidos++;
      s.preenchidos++;
    } else {
      pendencias.push({
        codigo: campo.codigo_tecnico,
        rotulo: campo.rotulo,
        secao: campo.secao,
        motivo: situacao,
      });
    }
  }

  for (const s of Object.values(porSecao)) {
    if (s) s.percentual = s.total > 0 ? Math.floor((s.preenchidos / s.total) * 100) : 100;
  }

  return {
    // floor: 100% somente quando não houver nenhuma pendência
    percentual: total > 0 ? Math.floor((preenchidos / total) * 100) : 0,
    total,
    preenchidos,
    pendencias,
    porSecao,
  };
}

// Remove respostas de blocos não aplicáveis, de campos ocultos pelas regras condicionais
// e justificativas que deixaram de ser exigidas. Evita que dados não aplicáveis sejam
// guardados, revisados ou publicados.
export function sanitizarRespostas(respostas: Respostas, atribuicao: string[] | null | undefined) {
  const limpas: Respostas = {};
  for (const campo of camposAplicaveis(respostas, atribuicao)) {
    const v = respostas[campo.codigo_tecnico];
    if (v === undefined || v === null || (typeof v === "string" && v === "")) continue;
    limpas[campo.codigo_tecnico] = v;
    if (exigeJustificativa(campo, respostas)) {
      const j = respostas[campo.codigo_tecnico + sufixoJustificativa];
      if (texto(j) !== "") limpas[campo.codigo_tecnico + sufixoJustificativa] = j;
    }
  }
  return limpas;
}

export const MOTIVO_PENDENCIA: Record<Pendencia["motivo"], string> = {
  sem_resposta: "Sem resposta",
  sem_justificativa: "Justificativa obrigatória para 'Não soube informar'",
  valor_invalido: "Informe um número inteiro maior ou igual a zero",
};

// Etapa em que um diagnóstico salvo reabre: a última acessada, se ainda for aplicável à
// atribuição; senão a primeira etapa aplicável com pendência obrigatória; senão a primeira.
export function etapaInicial(
  respostas: Respostas,
  identificacao: IdentificacaoDiagnostico,
  ultimaAcessada?: string | null,
): SecaoId {
  const visiveis = secoesAplicaveis(identificacao.atribuicao);
  if (ultimaAcessada && visiveis.includes(ultimaAcessada as SecaoId)) {
    return ultimaAcessada as SecaoId;
  }
  const { pendencias } = calcularCompletude(respostas, identificacao);
  return visiveis.find((s) => pendencias.some((p) => p.secao === s)) ?? visiveis[0];
}
