import Papa from "papaparse";
import { queryOptions } from "@tanstack/react-query";
import type { Municipio } from "./types";
import csvText from "@/data/base_mppi_caocrim.csv?raw";
import geoJson from "@/data/piaui-map-fixed.json";

import { supabase } from "./supabase";

const NUMERIC_FIELDS: Array<keyof Municipio> = [
  "populacao", "populacao_feminina", "consumado", "tentado",
  "consumado_2023", "consumado_2024", "consumado_2025", "consumado_2026",
  "tentado_2023", "tentado_2024", "tentado_2025", "tentado_2026",
  "feminicidios_consumados_2024_2025", "feminicidios_tentados_2024_2025",
  "ocorrencias_total_violencia_genero_monitoradas", "risco_feminicidio_score",
];

async function fetchMunicipios(): Promise<Municipio[]> {
  const { data, error } = await supabase.from('municipios').select('*, eventos_feminicidio(*)');
  
  let sourceData = data;

  if (error) {
    console.error("Erro ao buscar municípios no Supabase (pode ser erro de tabela inexistente se não migrou):", error);
    // Fallback para o CSV caso o Supabase não esteja populado ainda ou a migração não tenha rodado
    console.warn("Usando fallback do CSV/dados em memória...");
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/^\ufeff/, "").trim().replace("população", "populacao"),
    });
    sourceData = parsed.data.map((row) => {
      const m: any = { ...row };
      for (const f of NUMERIC_FIELDS) {
        m[f] = Number(row[f as string] ?? row[(f as string).replace("populacao", "população")] ?? 0) || 0;
      }
      if (m.codigo_ibge) m.id = String(m.codigo_ibge);
      return m;
    });
  }
  
  return (sourceData as Municipio[]).map(m => {
    // Synthesize the array if it's missing (happens on CSV fallback or if migration hasn't run)
    if (!m.eventos_feminicidio || m.eventos_feminicidio.length === 0) {
       m.eventos_feminicidio = [
         { municipio_id: m.id, ano_fato: 2023, tipo_evento: 'CONSUMADO', quantidade: m.consumado_2023 || 0, status_periodo: 'janela_oficial', considera_no_score: true, versao_metodologia: 'risco_v3_2023_2025' },
         { municipio_id: m.id, ano_fato: 2023, tipo_evento: 'TENTADO', quantidade: m.tentado_2023 || 0, status_periodo: 'janela_oficial', considera_no_score: true, versao_metodologia: 'risco_v3_2023_2025' },
         { municipio_id: m.id, ano_fato: 2024, tipo_evento: 'CONSUMADO', quantidade: m.consumado_2024 || 0, status_periodo: 'janela_oficial', considera_no_score: true, versao_metodologia: 'risco_v3_2023_2025' },
         { municipio_id: m.id, ano_fato: 2024, tipo_evento: 'TENTADO', quantidade: m.tentado_2024 || 0, status_periodo: 'janela_oficial', considera_no_score: true, versao_metodologia: 'risco_v3_2023_2025' },
         { municipio_id: m.id, ano_fato: 2025, tipo_evento: 'CONSUMADO', quantidade: m.consumado_2025 || 0, status_periodo: 'janela_oficial', considera_no_score: true, versao_metodologia: 'risco_v3_2023_2025' },
         { municipio_id: m.id, ano_fato: 2025, tipo_evento: 'TENTADO', quantidade: m.tentado_2025 || 0, status_periodo: 'janela_oficial', considera_no_score: true, versao_metodologia: 'risco_v3_2023_2025' },
         { municipio_id: m.id, ano_fato: 2026, tipo_evento: 'CONSUMADO', quantidade: m.consumado_2026 || 0, status_periodo: 'parcial_corrente', considera_no_score: false, versao_metodologia: 'risco_v3_2023_2025' },
         { municipio_id: m.id, ano_fato: 2026, tipo_evento: 'TENTADO', quantidade: m.tentado_2026 || 0, status_periodo: 'parcial_corrente', considera_no_score: false, versao_metodologia: 'risco_v3_2023_2025' },
       ].filter(e => e.quantidade > 0) as any[];
    }
    return m;
  });
}

export const municipiosQueryOptions = queryOptions({
  queryKey: ["municipios"],
  queryFn: fetchMunicipios,
  staleTime: Infinity,
});

export interface PiauiGeoJSON {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { id: string; name: string; description: string };
    geometry: { type: "Polygon" | "MultiPolygon"; coordinates: any };
  }>;
}

async function fetchGeo(): Promise<PiauiGeoJSON> {
  return geoJson as PiauiGeoJSON;
}

export const geoQueryOptions = queryOptions({
  queryKey: ["piaui-geo-fixed"],
  queryFn: fetchGeo,
  staleTime: Infinity,
});

// Helpers
export function pct(part: number, total: number): string {
  if (!total) return "0%";
  return ((part / total) * 100).toFixed(1) + "%";
}
