import { useSuspenseQuery } from "@tanstack/react-query";
import { municipiosQueryOptions } from "./csv-data";
import { useApp } from "@/context/AppContext";
import type { Municipio } from "./types";

export function useMunicipios() {
  const { data: rawMunicipios } = useSuspenseQuery(municipiosQueryOptions);
  const { weights, thresholds } = useApp();

  const data: Municipio[] = rawMunicipios.map((m) => {
    // 1. Calcular o Score Dinâmico
    const score =
      m.feminicidios_total_2023_2026 * weights.pesoFeminicidios +
      m.tentativas_total_2023_2026 * weights.pesoTentativas +
      (m.opm_possui !== "SIM" ? weights.pesoOPM : 0) +
      (m.creas_possui !== "SIM" ? weights.pesoCREAS : 0);

    // 2. Classificar a faixa de risco com base nos limites (thresholds)
    let nivel = "BAIXO";
    if (score >= thresholds.critico) {
      nivel = "CRITICO";
    } else if (score >= thresholds.alto) {
      nivel = "ALTO";
    } else if (score >= thresholds.medio) {
      nivel = "MEDIO";
    }

    // 3. Atuação prioritária dinâmica
    const necessita_atuacao_prioritaria = (nivel === "ALTO" || nivel === "CRITICO") ? "SIM" : "NAO";

    return {
      ...m,
      risco_feminicidio_score: score,
      risco_feminicidio_nivel: nivel,
      necessita_atuacao_prioritaria,
    };
  });

  return { data };
}
