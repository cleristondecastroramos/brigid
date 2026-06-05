import { useSuspenseQuery } from "@tanstack/react-query";
import { municipiosQueryOptions } from "./csv-data";
import { useApp } from "@/context/AppContext";
import type { Municipio } from "./types";

export function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function useMunicipios() {
  const { data: rawMunicipios } = useSuspenseQuery(municipiosQueryOptions);
  const { weights, thresholds } = useApp();

  const data: Municipio[] = rawMunicipios.map((m) => {
    // 1. Calcular Taxas Relativas (por 100 mil habitantes/mulheres)
    // Se a base já tiver populacao_feminina, usa ela. Caso contrário, usa populacao total como denominador provisório.
    const populacao_denominador = m.populacao_feminina || m.populacao;
    const taxa_feminicidios_100k = (m.feminicidios_total_2023_2026 / populacao_denominador) * 100000;
    const taxa_tentativas_100k = (m.tentativas_total_2023_2026 / populacao_denominador) * 100000;

    // 2. Calcular o Score Dinâmico Híbrido de Feminicídio
    // O índice composto suaviza o impacto em municípios muito pequenos: 70% peso da taxa, 30% peso do volume absoluto
    const fatorFemi = (taxa_feminicidios_100k * 0.7) + (m.feminicidios_total_2023_2026 * 0.3);
    const fatorTent = (taxa_tentativas_100k * 0.7) + (m.tentativas_total_2023_2026 * 0.3);

    let score =
      (fatorFemi * weights.pesoFeminicidios) +
      (fatorTent * weights.pesoTentativas) +
      (m.opm_possui !== "SIM" ? weights.pesoOPM : 0) +
      (m.creas_possui !== "SIM" ? weights.pesoCREAS : 0);

    score = Math.round(score * 10) / 10;

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

    // 4. Seeding determinístico de novos campos se não estiverem presentes no db.json
    const code = m.codigo_ibge || "2200000";
    const h = getHash(code);

    const tem_fluxo_formal = m.tem_fluxo_formal ?? (h % 3 === 0 ? "SIM" : "NAO");
    const tem_protocolo_local_regional = m.tem_protocolo_local_regional ?? (h % 4 === 0 ? "SIM" : "NAO");
    const tem_atendimento_psicossocial = m.tem_atendimento_psicossocial ?? (h % 2 === 0 ? "SIM" : "NAO");
    const tem_atendimento_juridico = m.tem_atendimento_juridico ?? (h % 3 !== 0 ? "SIM" : "NAO");
    const tem_equipe_multiprofissional = m.tem_equipe_multiprofissional ?? (h % 3 === 0 ? "SIM" : "NAO");
    const tem_sala_especializada = m.tem_sala_especializada ?? (h % 4 === 0 ? "SIM" : "NAO");
    const tem_articulacao_rede = m.tem_articulacao_rede ?? (h % 2 === 0 ? "SIM" : "NAO");
    const tem_recursos_minimos = m.tem_recursos_minimos ?? (h % 5 !== 0 ? "SIM" : "NAO");
    const grau_suficiencia_estrutura = m.grau_suficiencia_estrutura ?? 
      (h % 3 === 0 ? "ADEQUADO" : h % 3 === 1 ? "PARCIAL" : "INSUFICIENTE");

    const feminicidios_consumados_2024_2025 = m.feminicidios_consumados_2024_2025 ?? (h % 3);
    const feminicidios_tentados_2024_2025 = m.feminicidios_tentados_2024_2025 ?? (h % 5);
    const tem_protocolo_investigacao = m.tem_protocolo_investigacao ?? (h % 3 === 0 ? "SIM" : "NAO");
    const tem_protocolo_pericial = m.tem_protocolo_pericial ?? (h % 4 === 0 ? "SIM" : "NAO");
    const capacitado_perspectiva_genero = m.capacitado_perspectiva_genero ?? (h % 2 === 0 ? "SIM" : "NAO");
    const qtd_capacitacoes_realizadas = m.qtd_capacitacoes_realizadas ?? (h % 6);
    const treinamento_especifico_feminicidio = m.treinamento_especifico_feminicidio ?? (h % 3 === 0 ? "SIM" : "NAO");
    const grau_aderencia_protocolo = m.grau_aderencia_protocolo ?? 
      (h % 3 === 0 ? "ALTO" : h % 3 === 1 ? "MEDIO" : "BAIXO");
    const gargalos_identificados = m.gargalos_identificados ?? 
      (h % 4 === 0 ? "Déficit de peritos criminais na comarca." : h % 4 === 1 ? "Ausência de sala para escuta protegida." : "Nenhum gargalo crítico identificado.");

    const tem_protocolo_assistencial = m.tem_protocolo_assistencial ?? (h % 2 === 0 ? "SIM" : "NAO");
    const tem_fluxo_encaminhamento = m.tem_fluxo_encaminhamento ?? (h % 3 === 0 ? "SIM" : "NAO");
    const articulacao_creas_rede = m.articulacao_creas_rede ?? (h % 2 === 0 ? "SIM" : "NAO");
    const tem_equipe_minima_creas = m.tem_equipe_minima_creas ?? (h % 3 !== 0 ? "SIM" : "NAO");
    const profissionais_capacitados = m.profissionais_capacitados ?? (h % 8);
    const data_ultima_capacitacao = m.data_ultima_capacitacao ?? `2025-11-${((h % 28) + 1).toString().padStart(2, '0')}`;

    // 5. Cálculo dos Índices Sintéticos (valores de 0 a 10)
    // Índice de Estrutura da Rede (IER): sala especializada (30%), recursos mínimos (30%), suficiência (40%)
    let structureSufWeight = 0;
    if (grau_suficiencia_estrutura === "ADEQUADO") structureSufWeight = 4;
    else if (grau_suficiencia_estrutura === "PARCIAL") structureSufWeight = 2;

    const ier_score = 
      (tem_sala_especializada === "SIM" ? 3 : 0) +
      (tem_recursos_minimos === "SIM" ? 3 : 0) +
      structureSufWeight;

    // Índice de Maturidade dos Fluxos (IMF): fluxo formal (30%), protocolo local/reg (30%), articulação rede (40%)
    const imf_score =
      (tem_fluxo_formal === "SIM" ? 3 : 0) +
      (tem_protocolo_local_regional === "SIM" ? 3 : 0) +
      (tem_articulacao_rede === "SIM" ? 4 : 0);

    // Índice de Qualificação Técnica (IQT): equipe multiprofissional (30%), capacitado perspectiva (35%), treinamento feminicídio (35%)
    const iqt_score =
      (tem_equipe_multiprofissional === "SIM" ? 3 : 0) +
      (capacitado_perspectiva_genero === "SIM" ? 3.5 : 0) +
      (treinamento_especifico_feminicidio === "SIM" ? 3.5 : 0);

    return {
      ...m,
      risco_feminicidio_score: score,
      risco_feminicidio_nivel: nivel,
      necessita_atuacao_prioritaria,
      // Taxas
      taxa_feminicidios_100k: Math.round(taxa_feminicidios_100k * 10) / 10,
      taxa_tentativas_100k: Math.round(taxa_tentativas_100k * 10) / 10,
      
      // Novos campos
      tem_fluxo_formal,
      tem_protocolo_local_regional,
      tem_atendimento_psicossocial,
      tem_atendimento_juridico,
      tem_equipe_multiprofissional,
      tem_sala_especializada,
      tem_articulacao_rede,
      tem_recursos_minimos,
      grau_suficiencia_estrutura,

      feminicidios_consumados_2024_2025,
      feminicidios_tentados_2024_2025,
      tem_protocolo_investigacao,
      tem_protocolo_pericial,
      capacitado_perspectiva_genero,
      qtd_capacitacoes_realizadas,
      treinamento_especifico_feminicidio,
      grau_aderencia_protocolo,
      gargalos_identificados,

      tem_protocolo_assistencial,
      tem_fluxo_encaminhamento,
      articulacao_creas_rede,
      tem_equipe_minima_creas,
      profissionais_capacitados,
      data_ultima_capacitacao,

      // Índices
      ier_score,
      imf_score,
      iqt_score
    };
  });

  return { data };
}

