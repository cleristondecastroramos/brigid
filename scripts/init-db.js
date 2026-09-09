import fs from "fs";
import path from "path";
import Papa from "papaparse";

const csvPath = path.resolve("src/data/base_mppi_caocrim.csv");
const dbPath = path.resolve("db.json");

const NUMERIC_FIELDS = [
  "populacao",
  "consumado",
  "tentado",
  "consumado_2023",
  "consumado_2024",
  "consumado_2025",
  "consumado_2026",
  "tentado_2023",
  "tentado_2024",
  "tentado_2025",
  "tentado_2026",
  "feminicidios_total_2023_2026",
  "tentativas_total_2023_2026",
  "ocorrencias_total_violencia_genero_monitoradas",
  "risco_feminicidio_score",
];

const csvText = fs.readFileSync(csvPath, "utf-8");

const parsed = Papa.parse(csvText, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (h) =>
    h
      .replace(/^\ufeff/, "")
      .trim()
      .replace("população", "populacao"),
});

const municipios = parsed.data.map((row) => {
  const m = { ...row };
  for (const f of NUMERIC_FIELDS) {
    m[f] = Number(row[f] ?? row[f.replace("populacao", "população")] ?? 0) || 0;
  }
  // json-server requires an 'id' field for each object to perform CRUD.
  // We'll map 'codigo_ibge' to 'id'.
  if (m.codigo_ibge) {
    m.id = String(m.codigo_ibge);
  }
  return m;
});

const db = {
  municipios: municipios,
};

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
console.log(`db.json gerado com sucesso! ${municipios.length} municípios incluídos.`);
