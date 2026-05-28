import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ShieldAlert, TrendingUp, Skull, Download, Search, Eraser } from "lucide-react";
import { municipiosQueryOptions, pct } from "@/lib/csv-data";
import { useMunicipios } from "@/lib/useMunicipios";
import { KpiCard } from "@/components/kpi-card";
import { PiauiMap } from "@/components/piaui-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge, AlertBadge, YesNoBadge } from "@/components/risk-badge";
import { exportCsv } from "@/lib/export";
import { getFaixaPopulacional, type FaixaPop } from "@/lib/utils";

export const Route = createFileRoute("/risco")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: RiscoPanel,
});

const RISK_COLORS: Record<string, string> = {
  BAIXO: "oklch(0.7 0.12 160)",
  MEDIO: "oklch(0.75 0.15 85)",
  ALTO: "oklch(0.65 0.18 45)",
  CRITICO: "oklch(0.55 0.22 27)",
};

function RiscoPanel() {
  const { data: municipios } = useMunicipios();
  const [q, setQ] = useState("");
  const [comarca, setComarca] = useState("__all");
  const [polo, setPolo] = useState("__all");
  const [faixaPop, setFaixaPop] = useState<FaixaPop>("__all");
  const [nivel, setNivel] = useState("__all");

  const comarcas = useMemo(() => Array.from(new Set(municipios.map((m) => m.comarca).filter(Boolean))).sort(), [municipios]);
  const polos = useMemo(() => Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort(), [municipios]);

  const filtered = useMemo(() => municipios.filter((m) => {
    if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
    if (comarca !== "__all" && m.comarca !== comarca) return false;
    if (polo !== "__all" && m.polo_regional !== polo) return false;
    if (faixaPop !== "__all" && getFaixaPopulacional(m.populacao) !== faixaPop) return false;
    if (nivel !== "__all" && m.risco_feminicidio_nivel !== nivel) return false;
    return true;
  }).sort((a, b) => b.risco_feminicidio_score - a.risco_feminicidio_score), [municipios, q, comarca, polo, faixaPop, nivel]);

  const total = filtered.length;
  const feminicidios = filtered.reduce((s, m) => s + m.feminicidios_total_2023_2026, 0);
  const tentativas = filtered.reduce((s, m) => s + m.tentativas_total_2023_2026, 0);
  const ocorrencias = filtered.reduce((s, m) => s + m.ocorrencias_total_violencia_genero_monitoradas, 0);
  const criticos = filtered.filter((m) => m.painel_alerta_rede === "CRITICO").length;

  const semOPMcomFem = filtered.filter((m) => m.opm_possui !== "SIM" && m.feminicidios_total_2023_2026 > 0).length;
  const semCREAScomFem = filtered.filter((m) => m.creas_possui !== "SIM" && m.feminicidios_total_2023_2026 > 0).length;
  const semAmbosCriticos = filtered.filter((m) => m.opm_possui !== "SIM" && m.creas_possui !== "SIM" && (m.feminicidios_total_2023_2026 > 0 || m.painel_alerta_rede === "CRITICO")).length;

  const colorFn = (m: any) => {
    if (!m) return "oklch(0.92 0.01 230)";
    const isFilteredIn = filtered.some(fm => fm.codigo_ibge === m.codigo_ibge);
    if (!isFilteredIn) return "oklch(0.92 0.01 230)";
    return RISK_COLORS[m.risco_feminicidio_nivel] ?? "oklch(0.85 0.01 230)";
  };

  const hasFilter = q !== "" || comarca !== "__all" || polo !== "__all" || faixaPop !== "__all" || nivel !== "__all";
  const clearFilters = () => {
    setQ(""); setComarca("__all"); setPolo("__all"); setFaixaPop("__all"); setNivel("__all");
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Filtros de Análise:</span>
              {hasFilter && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Filtros ativos
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar município…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={comarca} onValueChange={setComarca}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Comarca" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas as comarcas</SelectItem>
                  {comarcas.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={polo} onValueChange={setPolo}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Polo regional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos os polos</SelectItem>
                  {polos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={faixaPop} onValueChange={(v) => setFaixaPop(v as FaixaPop)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Faixa pop." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas as faixas</SelectItem>
                  <SelectItem value="ate_5k">Até 5.000 hab.</SelectItem>
                  <SelectItem value="5k_10k">5.001 a 10.000 hab.</SelectItem>
                  <SelectItem value="10k_20k">10.001 a 20.000 hab.</SelectItem>
                  <SelectItem value="acima_20k">Acima de 20.000 hab.</SelectItem>
                </SelectContent>
              </Select>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Nível de risco" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos (risco)</SelectItem>
                  <SelectItem value="BAIXO">Baixo</SelectItem>
                  <SelectItem value="MEDIO">Médio</SelectItem>
                  <SelectItem value="ALTO">Alto</SelectItem>
                  <SelectItem value="CRITICO">Crítico</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters} disabled={!hasFilter}>
                <Eraser className="mr-2 h-4 w-4" /> Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Feminicídios 2023–2026" value={feminicidios} icon={Skull} tone="critical" />
        <KpiCard label="Tentativas 2023–2026" value={tentativas} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Ocorrências monitoradas" value={ocorrencias} icon={TrendingUp} tone="primary" />
        <KpiCard label="Em alerta crítico" value={criticos} hint={pct(criticos, total)} icon={ShieldAlert} tone="critical" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <KpiCard label="Sem OPM × com feminicídio" value={semOPMcomFem} tone="critical" />
        <KpiCard label="Sem CREAS × com feminicídio" value={semCREAScomFem} tone="critical" />
        <KpiCard label="Sem OPM e sem CREAS (críticos)" value={semAmbosCriticos} tone="critical" />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Mapa por faixa de risco</CardTitle></CardHeader>
        <CardContent>
          <PiauiMap
            colorFn={colorFn}
            legend={[
              { label: "Baixo", color: RISK_COLORS.BAIXO },
              { label: "Médio", color: RISK_COLORS.MEDIO },
              { label: "Alto", color: RISK_COLORS.ALTO },
              { label: "Crítico", color: RISK_COLORS.CRITICO },
              { label: "Fora do filtro", color: "oklch(0.92 0.01 230)" },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">Ranking de municípios (Filtro atual)</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm" variant="outline"
              onClick={() => exportCsv("risco_feminicidio.csv", filtered.map((m) => ({
                municipio: m.municipio, codigo_ibge: m.codigo_ibge, polo_regional: m.polo_regional,
                comarca: m.comarca, populacao: m.populacao,
                risco: m.risco_feminicidio_nivel, score: m.risco_feminicidio_score,
                feminicidios: m.feminicidios_total_2023_2026, tentativas: m.tentativas_total_2023_2026,
                ocorrencias: m.ocorrencias_total_violencia_genero_monitoradas,
                opm: m.opm_possui, creas: m.creas_possui, alerta: m.painel_alerta_rede,
                atuacao_prioritaria: m.necessita_atuacao_prioritaria,
              })))}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Município</TableHead>
                  <TableHead>Comarca</TableHead>
                  <TableHead>Polo</TableHead>
                  <TableHead className="text-right">População</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Feminicídios</TableHead>
                  <TableHead className="text-right">Tentativas</TableHead>
                  <TableHead>OPM</TableHead>
                  <TableHead>CREAS</TableHead>
                  <TableHead>Alerta</TableHead>
                  <TableHead>Prioritária</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((m) => (
                  <TableRow key={m.codigo_ibge}>
                    <TableCell>
                      <Link to="/municipios/$slug" params={{ slug: m.municipio_slug }} className="font-medium text-foreground hover:underline">
                        {m.municipio}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.comarca}</TableCell>
                    <TableCell className="text-muted-foreground">{m.polo_regional}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{m.populacao.toLocaleString("pt-BR")}</TableCell>
                    <TableCell><RiskBadge level={m.risco_feminicidio_nivel} /></TableCell>
                    <TableCell className="text-right tabular-nums">{m.risco_feminicidio_score}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.feminicidios_total_2023_2026}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.tentativas_total_2023_2026}</TableCell>
                    <TableCell><YesNoBadge value={m.opm_possui} /></TableCell>
                    <TableCell><YesNoBadge value={m.creas_possui} /></TableCell>
                    <TableCell><AlertBadge level={m.painel_alerta_rede} /></TableCell>
                    <TableCell><YesNoBadge value={m.necessita_atuacao_prioritaria} positiveIsGood={false} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Exibindo {Math.min(filtered.length, 100)} de {filtered.length} resultados.</p>
        </CardContent>
      </Card>
    </div>
  );
}
