import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { useMunicipios } from "@/lib/useMunicipios";
import { municipiosQueryOptions } from "@/lib/csv-data";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge } from "@/components/risk-badge";
import { Scale, RefreshCw, AlertTriangle, ShieldCheck, UserCheck, Calendar } from "lucide-react";
import { toast } from "sonner";

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

  // Ordena os recalculados para ver o impacto no ranking
  const dynamicRanking = [...dynamicMunicipios]
    .sort((a, b) => b.risco_feminicidio_score - a.risco_feminicidio_score || b.feminicidios_total_2023_2026 - a.feminicidios_total_2023_2026)
    .slice(0, 10);

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
              <CardTitle className="text-base">Ponderação dos Indicadores</CardTitle>
              <CardDescription>
                Defina o peso multiplicador para ocorrências e fatores institucionais.
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
                  max="20"
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
                  max="40"
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
                  max="100"
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
                      <TableHead className="w-10">Pos</TableHead>
                      <TableHead>Município</TableHead>
                      <TableHead className="text-center">Score original</TableHead>
                      <TableHead className="text-center">Novo score</TableHead>
                      <TableHead>Risco original</TableHead>
                      <TableHead>Novo risco</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dynamicRanking.map((m, idx) => {
                      const original = rawMunicipios.find((r) => r.codigo_ibge === m.codigo_ibge);
                      const originalScore = original?.risco_feminicidio_score ?? 0;
                      const originalNivel = original?.risco_feminicidio_nivel ?? "BAIXO";
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
