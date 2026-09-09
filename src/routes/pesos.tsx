import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { useMunicipios } from "@/lib/useMunicipios";
import { municipiosQueryOptions } from "@/lib/data-fetching";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/risk-badge";
import { Scale, RefreshCw, AlertTriangle, ShieldCheck, UserCheck, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/pesos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: PesosConfigPanel,
});

function PesosConfigPanel() {
  const {
    weights,
    thresholds,
    simulationInfo,
    updateWeights,
    updateThresholds,
    resetToDefaults,
  } = useApp();

  const { data: dynamicMunicipios } = useMunicipios();
  // Carrega os dados brutos estáticos da query original para fins de comparação
  const { data: rawMunicipios } = useSuspenseQuery(municipiosQueryOptions);

  const [sortColumn, setSortColumn] = useState<"pos" | "municipio" | "score_original" | "score_novo" | "risco_original" | "risco_novo">("score_novo");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (col: typeof sortColumn) => {
    if (sortColumn === col) setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDirection("desc"); }
  };
  
  const SortIcon = ({ column }: { column: typeof sortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? <ArrowUp className="ml-1 inline h-4 w-4" /> : <ArrowDown className="ml-1 inline h-4 w-4" />;
  };

  // Ordena os recalculados para ver o impacto no ranking
  const dynamicRanking = [...dynamicMunicipios]
    .map(m => {
      const original = rawMunicipios.find((r) => r.codigo_ibge === m.codigo_ibge);
      return {
        ...m,
        score_original: original?.risco_feminicidio_score ?? 0,
        risco_original: original?.risco_feminicidio_nivel ?? "BAIXO",
      }
    })
    .sort((a, b) => b.risco_feminicidio_score - a.risco_feminicidio_score || b.feminicidios_consumados_2023_2025 - a.feminicidios_consumados_2023_2025)
    .slice(0, 10)
    .sort((a, b) => {
      let valA, valB;
      if (sortColumn === "pos" || sortColumn === "score_novo") { valA = a.risco_feminicidio_score; valB = b.risco_feminicidio_score; }
      else if (sortColumn === "score_original") { valA = a.score_original; valB = b.score_original; }
      else if (sortColumn === "municipio") { valA = a.municipio; valB = b.municipio; }
      else if (sortColumn === "risco_original") { valA = a.risco_original; valB = b.risco_original; }
      else if (sortColumn === "risco_novo") { valA = a.risco_feminicidio_nivel; valB = b.risco_feminicidio_nivel; }

      if (valA === valB) return 0;
      const modifier = sortDirection === "asc" ? 1 : -1;
      if (typeof valA === "string" && typeof valB === "string") return valA.localeCompare(valB) * modifier;
      return ((valA as number) > (valB as number) ? 1 : -1) * modifier;
    });

  const handleWeightChange = (key: keyof typeof weights, val: number) => {
    updateWeights({
      ...weights,
      [key]: val,
    });
  };

  const handleThresholdChange = (key: keyof typeof thresholds, val: number) => {
    updateThresholds({
      ...thresholds,
      [key]: val,
    });
  };

  const handleReset = () => {
    resetToDefaults();
    toast.info("Configurações restauradas para os padrões institucionais.");
  };

  return (
    <div className="space-y-6">
      {/* Simulation Metadata Card */}
      <Card className="border-l-4 border-l-primary bg-primary/5">
        <CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Ambiente de Parametrização e Simulação</h2>
              <p className="text-xs text-muted-foreground">
                Ajuste os parâmetros abaixo para simular cenários territoriais e validar a lógica de pesos no frontend.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 rounded-full bg-background px-2.5 py-1 border border-border">
              <UserCheck className="h-3 w-3 text-primary" /> {simulationInfo.usuario}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-background px-2.5 py-1 border border-border">
              <Calendar className="h-3 w-3 text-primary" /> {simulationInfo.data}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 font-semibold">
              Versão {simulationInfo.versao}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Sliders and Inputs */}
        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ponderação dos Indicadores (Modelo Híbrido)</CardTitle>
              <CardDescription>
                Defina o peso multiplicador. Os cálculos baseiam-se numa combinação de Taxa Relativa (por 100 mil hab.) com o Volume Absoluto (peso 70/30).
                <br /><span className="text-[10px] text-muted-foreground mt-1 inline-block">* Denominador provisório: População Total (o sistema migrará automaticamente para População Feminina quando o dado for inserido na base).</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Peso Feminicidios */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Feminicídios Consumados (2023-2026)</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">
                    Peso {weights.pesoFeminicidios}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={weights.pesoFeminicidios}
                  onChange={(e) => handleWeightChange("pesoFeminicidios", Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                />
              </div>

              {/* Peso Tentativas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Tentativas de Feminicídio (2023-2026)</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">
                    Peso {weights.pesoTentativas}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={weights.pesoTentativas}
                  onChange={(e) => handleWeightChange("pesoTentativas", Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                />
              </div>

              {/* Peso Ausencia OPM */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Ausência de OPM</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">
                    Peso {weights.pesoOPM}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={weights.pesoOPM}
                  onChange={(e) => handleWeightChange("pesoOPM", Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                />
              </div>

              {/* Peso Ausencia CREAS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Ausência de CREAS</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">
                    Peso {weights.pesoCREAS}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={weights.pesoCREAS}
                  onChange={(e) => handleWeightChange("pesoCREAS", Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Limites das Faixas de Risco (Thresholds)</CardTitle>
              <CardDescription>
                Ajuste os valores mínimos de score para classificar as faixas de risco municipal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Medio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Risco Médio a partir de:</span>
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 font-bold text-amber-600">
                    Score {thresholds.medio}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={thresholds.medio}
                  onChange={(e) => handleThresholdChange("medio", Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-amber-500"
                />
              </div>

              {/* Alto */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Risco Alto a partir de:</span>
                  <span className="rounded bg-orange-500/10 px-2 py-0.5 font-bold text-orange-600">
                    Score {thresholds.alto}
                  </span>
                </div>
                <input
                  type="range"
                  min={thresholds.medio + 1}
                  max="100"
                  step="1"
                  value={thresholds.alto}
                  onChange={(e) => handleThresholdChange("alto", Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-orange-500"
                />
              </div>

              {/* Critico */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Risco Crítico a partir de:</span>
                  <span className="rounded bg-red-500/10 px-2 py-0.5 font-bold text-red-600">
                    Score {thresholds.critico}
                  </span>
                </div>
                <input
                  type="range"
                  min={thresholds.alto + 1}
                  max="200"
                  step="1"
                  value={thresholds.critico}
                  onChange={(e) => handleThresholdChange("critico", Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-red-500"
                />
              </div>

              <div className="pt-2">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4" /> Restaurar Padrões Institucionais
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Dynamic Ranking Preview */}
        <div className="space-y-6 lg:col-span-7">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Pré-visualização do Impacto (Top 10)
              </CardTitle>
              <CardDescription>
                Veja em tempo real como o ranking dos municípios prioritários é alterado pelos novos pesos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 cursor-pointer transition-colors hover:bg-white/10" onClick={() => handleSort('pos')}>Pos <SortIcon column="pos" /></TableHead>
                      <TableHead className="cursor-pointer transition-colors hover:bg-white/10" onClick={() => handleSort('municipio')}>Município <SortIcon column="municipio" /></TableHead>
                      <TableHead className="text-center cursor-pointer transition-colors hover:bg-white/10" onClick={() => handleSort('score_original')}>Score original <SortIcon column="score_original" /></TableHead>
                      <TableHead className="text-center cursor-pointer transition-colors hover:bg-white/10" onClick={() => handleSort('score_novo')}>Novo score <SortIcon column="score_novo" /></TableHead>
                      <TableHead className="cursor-pointer transition-colors hover:bg-white/10" onClick={() => handleSort('risco_original')}>Risco original <SortIcon column="risco_original" /></TableHead>
                      <TableHead className="cursor-pointer transition-colors hover:bg-white/10" onClick={() => handleSort('risco_novo')}>Novo risco <SortIcon column="risco_novo" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dynamicRanking.map((m, idx) => {
                      const originalScore = m.score_original;
                      const originalNivel = m.risco_original;
                      const scoreChanged = m.risco_feminicidio_score !== originalScore;
                      const levelChanged = m.risco_feminicidio_nivel !== originalNivel;

                      return (
                        <TableRow key={m.codigo_ibge} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-semibold text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-foreground">{m.municipio}</TableCell>
                          <TableCell className="text-center text-muted-foreground tabular-nums">{originalScore}</TableCell>
                          <TableCell className={`text-center font-semibold tabular-nums ${scoreChanged ? "text-primary bg-primary/5 rounded" : "text-foreground"}`}>
                            {m.risco_feminicidio_score}
                          </TableCell>
                          <TableCell><RiskBadge level={originalNivel} /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <RiskBadge level={m.risco_feminicidio_nivel} />
                              {levelChanged && (
                                <span className="inline-block rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary uppercase">
                                  Alterado
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-800 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-500" />
                <div>
                  <p className="font-semibold">Nota de Simulação</p>
                  <p className="mt-0.5">
                    Estas alterações afetam apenas a sua sessão de visualização em memória. Os dados originais do arquivo CSV institucional permanecem inalterados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
