import Papa from "papaparse";
import { queryOptions } from "@tanstack/react-query";
import type { Municipio } from "./types";
import csvText from "@/data/base_mppi_caocrim.csv?raw";
import geoJson from "@/data/piaui-map-fixed.json";

const NUMERIC_FIELDS: Array<keyof Municipio> = [
  "populacao", "consumado", "tentado",
  "consumado_2023", "consumado_2024", "consumado_2025", "consumado_2026",
  "tentado_2023", "tentado_2024", "tentado_2025", "tentado_2026",
  "feminicidios_total_2023_2026", "tentativas_total_2023_2026",
  "ocorrencias_total_violencia_genero_monitoradas", "risco_feminicidio_score",
];

async function fetchMunicipios(): Promise<Municipio[]> {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/^\ufeff/, "").trim().replace("população", "populacao"),
  });
  return parsed.data.map((row) => {
    const m: any = { ...row };
    for (const f of NUMERIC_FIELDS) {
      m[f] = Number(row[f as string] ?? row[(f as string).replace("populacao", "população")] ?? 0) || 0;
    }
    return m as Municipio;
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
