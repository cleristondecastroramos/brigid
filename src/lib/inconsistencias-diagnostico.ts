import {
  dicionarioDiagnostico,
  SECOES,
  VALOR_NAO_SABE,
  type SecaoId,
} from "./dicionario-diagnostico";
import type { Respostas } from "./completude-diagnostico";

// Verificações de coerência exibidas ao CAOCRIM durante a revisão. Não bloqueiam o envio
// nem a validação: apontam respostas que merecem conferência antes da aprovação.

export interface Inconsistencia {
  secao: SecaoId;
  campos: string[];
  mensagem: string;
  nivel: "inconsistencia" | "atencao";
}

const PREFIXOS: [SecaoId, string][] = [
  ["identificacao", "IDEN"],
  ["cidadania", "CID"],
  ["fluxos", "FLX"],
  ["socioassistencial", "SOC"],
  ["penal_seguranca", "SEG"],
  ["penal_violencia", "VIO"],
  ["gargalos", "GAR"],
];

export function verificarInconsistencias(
  r: Respostas,
  periodo: string | null | undefined,
): Inconsistencia[] {
  const out: Inconsistencia[] = [];
  const v = (c: string) => (r[c] === undefined || r[c] === null ? "" : String(r[c]));
  const gargalos = Array.isArray(r.GAR_LISTA) ? (r.GAR_LISTA as string[]) : [];

  if (
    v("CID_CREAS_STATUS") === "nao" &&
    v("SOC_ARTIC_CREAS") &&
    v("SOC_ARTIC_CREAS") !== "sem_creas"
  ) {
    out.push({
      secao: "socioassistencial",
      campos: ["CID_CREAS_STATUS", "SOC_ARTIC_CREAS"],
      mensagem: "O município foi informado sem CREAS, mas há articulação com o CREAS declarada.",
      nivel: "inconsistencia",
    });
  }
  if (v("CID_CREAS_STATUS") === "nao" && ["sim", "parcialmente"].includes(v("SOC_EQUIPE"))) {
    out.push({
      secao: "socioassistencial",
      campos: ["CID_CREAS_STATUS", "SOC_EQUIPE"],
      mensagem: "O município foi informado sem CREAS, mas a equipe do CREAS foi avaliada.",
      nivel: "inconsistencia",
    });
  }
  if (v("FLX_FORMAL") === "nao" && v("SOC_FLUXO") === "integrado") {
    out.push({
      secao: "fluxos",
      campos: ["FLX_FORMAL", "SOC_FLUXO"],
      mensagem:
        "Não há fluxo formal municipal, mas o fluxo socioassistencial foi declarado integrado.",
      nivel: "atencao",
    });
  }
  if (
    gargalos.length > 0 &&
    v("CID_OPM_STATUS") === "funcionamento_regular" &&
    gargalos.includes("ausencia_opm")
  ) {
    out.push({
      secao: "gargalos",
      campos: ["CID_OPM_STATUS", "GAR_LISTA"],
      mensagem:
        "Gargalo 'Ausência de OPM' marcado, mas o OPM foi informado em funcionamento regular.",
      nivel: "inconsistencia",
    });
  }
  if (
    gargalos.length > 0 &&
    v("CID_CREAS_STATUS") === "funcionamento_regular" &&
    gargalos.includes("ausencia_creas")
  ) {
    out.push({
      secao: "gargalos",
      campos: ["CID_CREAS_STATUS", "GAR_LISTA"],
      mensagem:
        "Gargalo 'Ausência de CREAS' marcado, mas o CREAS foi informado em funcionamento regular.",
      nivel: "inconsistencia",
    });
  }
  if (v("VIO_ANO") && periodo && v("VIO_ANO") !== periodo) {
    out.push({
      secao: "penal_violencia",
      campos: ["VIO_ANO"],
      mensagem: `As contagens de violência referem-se a ${v("VIO_ANO")}, diferente do período do diagnóstico (${periodo}).`,
      nivel: "atencao",
    });
  }

  for (const [secao, prefixo] of PREFIXOS) {
    const conf = v(`${prefixo}_CONFIABILIDADE`);
    if (["estimativa", "pendente", VALOR_NAO_SABE].includes(conf)) {
      out.push({
        secao,
        campos: [`${prefixo}_CONFIABILIDADE`],
        mensagem: `Bloco ${SECOES.find((s) => s.id === secao)?.label} com confiabilidade "${rotuloResposta(`${prefixo}_CONFIABILIDADE`, conf)}".`,
        nivel: "atencao",
      });
    }
  }

  const naoSabe = dicionarioDiagnostico.filter(
    (c) => v(c.codigo_tecnico) === VALOR_NAO_SABE && !c.codigo_tecnico.endsWith("_CONFIABILIDADE"),
  );
  if (naoSabe.length > 0) {
    out.push({
      secao: naoSabe[0].secao,
      campos: naoSabe.map((c) => c.codigo_tecnico),
      mensagem: `${naoSabe.length} resposta(s) "Não soube informar" — não alteram o valor publicado.`,
      nivel: "atencao",
    });
  }
  return out;
}

export function rotuloResposta(codigo: string, valor: unknown): string {
  if (valor === undefined || valor === null || valor === "") return "—";
  if (valor === VALOR_NAO_SABE) return "Não soube informar";
  const campo = dicionarioDiagnostico.find((c) => c.codigo_tecnico === codigo);
  const rotulo = (x: string) => campo?.opcoes?.find((o) => o.value === x)?.label ?? x;
  if (Array.isArray(valor)) return valor.map((x) => rotulo(String(x))).join("; ");
  return rotulo(String(valor));
}
