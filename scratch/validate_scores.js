const fs = require('fs');

async function validate() {
  const SUPABASE_URL = "https://kinurnnabyuleiltzhkv.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbnVybm5hYnl1bGVpbHR6aGt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODkwODAsImV4cCI6MjA5NTU2NTA4MH0.nJ9sxKYcFQRYiX-Vp3u1Y_V1VJAySR-NdztkllKusT4";
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/municipios?select=*`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const rawMunicipios = await response.json();
  
  let oldScores = [];
  let newScores = [];

  const weights = { pesoFeminicidios: 3, pesoTentativas: 1, pesoOPM: 2, pesoCREAS: 2 };

  rawMunicipios.forEach(m => {
    // Fake hash fallback
    let h = Math.abs((m.codigo_ibge || "2200000").split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0));
    
    let pop = m.populacao_feminina || m.populacao;
    if (!pop || pop === 0) pop = 1000;

    let f_cons = m.feminicidios_consumados_2024_2025 ?? (h % 3);
    let f_tent = m.feminicidios_tentados_2024_2025 ?? (h % 5);

    let taxa_f = (f_cons / pop) * 100000;
    let taxa_t = (f_tent / pop) * 100000;

    // OLD FORMULA
    let fatorFemi = (taxa_f * 0.7) + (f_cons * 0.3);
    let fatorTent = (taxa_t * 0.7) + (f_tent * 0.3);
    let oldScore = (fatorFemi * weights.pesoFeminicidios) + (fatorTent * weights.pesoTentativas) + (m.opm_possui !== "SIM" ? weights.pesoOPM : 0) + (m.creas_possui !== "SIM" ? weights.pesoCREAS : 0);
    oldScores.push({ mun: m.municipio, score: Math.round(oldScore * 10) / 10 });

    // NEW FORMULA (Ameaça x Vulnerabilidade)
    let ameaca = 1.0 + (taxa_f * weights.pesoFeminicidios) + (taxa_t * weights.pesoTentativas);
    let vul_opm = m.opm_possui !== "SIM" ? (weights.pesoOPM / 100) : 0;
    let vul_creas = m.creas_possui !== "SIM" ? (weights.pesoCREAS / 100) : 0;
    let vul = 1.0 + vul_opm + vul_creas;
    
    let newScore = ameaca * vul;
    newScores.push({ mun: m.municipio, score: Math.round(newScore * 10) / 10, ameaca, vul });
  });

  oldScores.sort((a, b) => b.score - a.score);
  newScores.sort((a, b) => b.score - a.score);

  console.log("=== TOP 5 MUNICÍPIOS (SCORE ANTIGO) ===");
  oldScores.slice(0, 5).forEach((x, i) => console.log(`${i+1}. ${x.mun} -> ${x.score}`));

  console.log("\n=== TOP 5 MUNICÍPIOS (SCORE NOVO: Ameaça x Vul) ===");
  newScores.slice(0, 5).forEach((x, i) => console.log(`${i+1}. ${x.mun} -> ${x.score} (Ameaça: ${Math.round(x.ameaca)}, Vul: ${x.vul})`));
  
  // Percentiles for new score
  const getP = (p) => newScores[Math.floor((newScores.length - 1) * (1 - p))].score;
  console.log(`\n=== DISTRIBUIÇÃO NOVO SCORE ===`);
  console.log(`Máximo: ${newScores[0].score}`);
  console.log(`P90 (Top 10% - Crítico?): ${getP(0.9)}`);
  console.log(`P75 (Top 25% - Alto?): ${getP(0.75)}`);
  console.log(`P50 (Mediana - Médio?): ${getP(0.5)}`);
}

validate().catch(console.error);
