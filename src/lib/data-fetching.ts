import { queryOptions } from "@tanstack/react-query";
import type { Municipio } from "./types";
import geoJson from "@/data/piaui-map-fixed.json";

import { supabase } from "./supabase";

async function fetchMunicipios(): Promise<Municipio[]> {
  const { data, error } = await supabase.from("municipios").select("*, eventos_feminicidio(*)");

  if (error) {
    console.error("Erro ao buscar municípios no Supabase:", error);
    throw new Error(
      "Não foi possível carregar os dados dos municípios do banco de dados. " + error.message,
    );
  }

  if (!data || data.length === 0) {
    throw new Error("Banco de dados não populado ou vazio. Execute os scripts SQL no Supabase.");
  }

  // Apenas garante que a estrutura 'eventos_feminicidio' existe,
  // mesmo que vazia, caso a migração ainda não tenha dados na tabela filha.
  return (data as Municipio[]).map((m) => {
    if (!m.eventos_feminicidio) {
      m.eventos_feminicidio = [];
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
