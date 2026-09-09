import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  Skull,
  Download,
  Search,
  Eraser,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { municipiosQueryOptions, pct } from "@/lib/data-fetching";
import { useMunicipios } from "@/lib/useMunicipios";
import { KpiCard } from "@/components/kpi-card";
import { ChartHelper } from "@/components/chart-helper";
import { PiauiMap } from "@/components/piaui-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskBadge, AlertBadge, YesNoBadge } from "@/components/risk-badge";
import { exportCsv, exportPdf } from "@/lib/export";
import { getFaixaPopulacional, type FaixaPop } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export const Route = createFileRoute("/risco")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: RiscoPanel,
});

const RISK_COLORS: Record<string, string> = {
  BAIXO: "oklch(0.55 0.13 175)",
  MEDIO: "oklch(0.7 0.12 300)",
  ALTO: "oklch(0.5 0.18 300)",
  CRITICO: "oklch(0.35 0.15 300)",
};

function RiscoPanel() {
  const { data: municipios } = useMunicipios();
  const [q, setQ] = useState("");
  const [comarca, setComarca] = useState("__all");
  const [polo, setPolo] = useState("__all");
  const [faixaPop, setFaixaPop] = useState<FaixaPop>("__all");
  const [nivel, setNivel] = useState("__all");
  const [sortColumn, setSortColumn] =
    useState<keyof (typeof municipios)[0]>("risco_feminicidio_score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filtroKpi, setFiltroKpi] = useState<string | null>(null);

  const handleKpiClick = (filtro: string) => {
    setFiltroKpi((prev) => (prev === filtro ? null : filtro));
  };

  const handleSort = (col: keyof (typeof municipios)[0]) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ column }: { column: keyof (typeof municipios)[0] }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 inline h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 inline h-4 w-4" />
    );
  };

  const comarcas = useMemo(
    () =>
      Array.from(new Set(municipios.map((m) => m.comarca).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b), "pt-BR"),
      ),
    [municipios],
  );
  const polos = useMemo(
    () =>
      Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b), "pt-BR"),
      ),
    [municipios],
  );

  const baseFiltered = useMemo(
    () =>
      municipios.filter((m) => {
        if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
        if (comarca !== "__all" && m.comarca !== comarca) return false;
        if (polo !== "__all" && m.polo_regional !== polo) return false;
        if (faixaPop !== "__all" && getFaixaPopulacional(m.populacao) !== faixaPop) return false;
        if (nivel !== "__all" && m.risco_feminicidio_nivel !== nivel) return false;
        return true;
      }),
    [municipios, q, comarca, polo, faixaPop, nivel],
  );

  const filtered = useMemo(
    () =>
      baseFiltered
        .filter((m) => {
          if (filtroKpi === "feminicidios") return m.feminicidios_consumados_2023_2025 > 0;
          if (filtroKpi === "tentativas") return m.feminicidios_tentados_2023_2025 > 0;
          if (filtroKpi === "criticos") return m.risco_feminicidio_nivel === "CRITICO";
          if (filtroKpi === "semOPMcomFem")
            return m.opm_possui !== "SIM" && m.risco_feminicidio_nivel === "CRITICO";
          if (filtroKpi === "semCREAScomFem")
            return m.creas_possui !== "SIM" && m.risco_feminicidio_nivel === "CRITICO";
          if (filtroKpi === "semAmbosCriticos")
            return (
              m.opm_possui !== "SIM" &&
              m.creas_possui !== "SIM" &&
              m.risco_feminicidio_nivel === "CRITICO"
            );
          return true;
        })
        .sort((a, b) => {
          const valA = a[sortColumn];
          const valB = b[sortColumn];
          if (valA === valB) return 0;
          const modifier = sortDirection === "asc" ? 1 : -1;
          if (typeof valA === "string" && typeof valB === "string") {
            return valA.localeCompare(valB, "pt-BR") * modifier;
          }
          return ((valA ?? 0) > (valB ?? 0) ? 1 : -1) * modifier;
        }),
    [baseFiltered, filtroKpi, sortColumn, sortDirection],
  );

  const total = baseFiltered.length;
  const feminicidios = baseFiltered.reduce((s, m) => s + m.feminicidios_consumados_2023_2025, 0);
  const tentativas = baseFiltered.reduce((s, m) => s + m.feminicidios_tentados_2023_2025, 0);
  const criticos = baseFiltered.filter((m) => m.risco_feminicidio_nivel === "CRITICO").length;

  const semOPMcomFem = baseFiltered.filter(
    (m) => m.opm_possui !== "SIM" && m.risco_feminicidio_nivel === "CRITICO",
  ).length;
  const semCREAScomFem = baseFiltered.filter(
    (m) => m.creas_possui !== "SIM" && m.risco_feminicidio_nivel === "CRITICO",
  ).length;
  const semAmbosCriticos = baseFiltered.filter(
    (m) =>
      m.opm_possui !== "SIM" && m.creas_possui !== "SIM" && m.risco_feminicidio_nivel === "CRITICO",
  ).length;

  const colorFn = (m: any) => {
    if (!m) return "oklch(0.95 0 0)";
    const isFilteredIn = filtered.some((fm) => fm.codigo_ibge === m.codigo_ibge);
    if (!isFilteredIn) return "oklch(0.95 0 0)";
    return RISK_COLORS[m.risco_feminicidio_nivel] ?? "oklch(0.95 0 0)";
  };

  const hasFilter =
    q !== "" ||
    comarca !== "__all" ||
    polo !== "__all" ||
    faixaPop !== "__all" ||
    nivel !== "__all";
  const clearFilters = () => {
    setQ("");
    setComarca("__all");
    setPolo("__all");
    setFaixaPop("__all");
    setNivel("__all");
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Filtros de Análise:</span>
            {hasFilter && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Filtros ativos
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative w-full md:w-[500px] shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar município…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1">
              <Select value={polo} onValueChange={setPolo}>
                <SelectTrigger className="w-[280px] h-9 border-border/60">
                  <SelectValue placeholder="Polo Regional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos os Polos Regionais</SelectItem>
                  {polos.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={comarca} onValueChange={setComarca}>
                <SelectTrigger className="w-[280px] h-9 border-border/60">
                  <SelectValue placeholder="Comarca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas as comarcas</SelectItem>
                  {comarcas.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={faixaPop} onValueChange={(v) => setFaixaPop(v as FaixaPop)}>
                <SelectTrigger className="w-[280px] h-9 border-border/60">
                  <SelectValue placeholder="Faixa populacional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas as faixas</SelectItem>
                  <SelectItem value="ate_5k">Até 5.000 hab.</SelectItem>
                  <SelectItem value="5k_10k">5.001 a 10.000 hab.</SelectItem>
                  <SelectItem value="10k_20k">10.001 a 20.000 hab.</SelectItem>
                  <SelectItem value="acima_20k">Acima de 20.000 hab.</SelectItem>
                </SelectContent>
              </Select>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="w-[280px] h-9 border-border/60">
                  <SelectValue placeholder="Nível de risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos (risco)</SelectItem>
                  <SelectItem value="BAIXO">Baixo</SelectItem>
                  <SelectItem value="MEDIO">Médio</SelectItem>
                  <SelectItem value="ALTO">Alto</SelectItem>
                  <SelectItem value="CRITICO">Crítico</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={!hasFilter}
                className="h-9"
              >
                <Eraser className="mr-2 h-4 w-4" /> Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. KPIs Estratégicos */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Feminicídios (24-25)"
          value={feminicidios}
          hint="casos consumados no recorte"
          icon={Skull}
          tone="critical"
          onClick={() => handleKpiClick("feminicidios")}
          isActive={filtroKpi === "feminicidios"}
        />
        <KpiCard
          label="Tentativas (24-25)"
          value={tentativas}
          hint="casos tentados no recorte"
          icon={AlertTriangle}
          tone="warning"
          onClick={() => handleKpiClick("tentativas")}
          isActive={filtroKpi === "tentativas"}
        />
        <KpiCard
          label="Municípios em risco crítico"
          value={criticos}
          hint={`${pct(criticos, total)} do total filtrado`}
          icon={ShieldAlert}
          tone="critical"
          onClick={() => handleKpiClick("criticos")}
          isActive={filtroKpi === "criticos"}
        />
        <KpiCard
          label="Críticos sem OPM"
          value={semOPMcomFem}
          hint="municípios críticos sem Organismo de Políticas para as Mulheres"
          tooltip="OPM = estrutura governamental local de políticas para as mulheres, como secretaria, coordenadoria, departamento ou órgão equivalente."
          tone="critical"
          onClick={() => handleKpiClick("semOPMcomFem")}
          isActive={filtroKpi === "semOPMcomFem"}
        />
        <KpiCard
          label="Críticos sem CREAS"
          value={semCREAScomFem}
          hint="municípios críticos sem CREAS"
          tone="critical"
          onClick={() => handleKpiClick("semCREAScomFem")}
          isActive={filtroKpi === "semCREAScomFem"}
        />
        <KpiCard
          label="Críticos sem rede mínima"
          value={semAmbosCriticos}
          hint="municípios críticos sem proteção institucional mínima"
          tone="critical"
          onClick={() => handleKpiClick("semAmbosCriticos")}
          isActive={filtroKpi === "semAmbosCriticos"}
        />
      </div>

      {/* 3. Mapa e Ranking (2 colunas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:col-span-1 flex flex-col shadow-sm">
          <CardHeader className="pb-2 relative">
            <ChartHelper>
              <p>Visão consolidada da vulnerabilidade de gênero por território.</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-foreground/80">Crítico / Alto:</strong> Alerta máximo para
                  subnotificação ou escalada de feminicídios.
                </li>
                <li>
                  <strong className="text-foreground/80">Médio / Baixo:</strong> Cenário monitorado.
                </li>
              </ul>
              <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2 text-[11px] md:text-xs">
                <p className="text-primary-700 dark:text-primary-300 font-medium mb-1.5">
                  O Índice de Risco utiliza uma{" "}
                  <strong className="font-bold">
                    Modelagem Híbrida Ponderada baseada em Risco de Desastres (Risco = Ameaça ×
                    Vulnerabilidade)
                  </strong>
                  . A <strong className="font-bold">Ameaça</strong> é a incidência relativa
                  ponderada pela população feminina local. A{" "}
                  <strong className="font-bold">Vulnerabilidade</strong> atua como multiplicador,
                  agravado pela ausência de rede estrutural (OPM/CREAS).
                </p>
                <p className="text-primary-700 dark:text-primary-300 font-medium mb-1.5 border-t border-primary/20 pt-1.5">
                  <strong className="font-bold">Nota metodológica:</strong> A metodologia vigente do
                  risco utiliza como janela oficial os anos de 2023, 2024 e 2025. Dados de 2026 são
                  armazenados como monitoramento parcial até consolidação do período.
                </p>
                <div className="bg-background/50 p-2 rounded text-[10px] font-mono text-muted-foreground mt-2 border">
                  Score = [1 + (TaxaFemi × PesoF) + (TaxaTent × PesoT)] × [1 + (S/OPM ? PesoO/100 :
                  0) + (S/CREAS ? PesoC/100 : 0)]
                </div>
              </div>
            </ChartHelper>
            <CardTitle className="text-base text-foreground pr-8">
              Distribuição Geográfica do Risco
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[650px] md:min-h-[910px] relative p-2 md:p-6">
            <PiauiMap
              height={850}
              colorFn={colorFn}
              legend={[
                { label: "Baixo (< 140)", color: RISK_COLORS.BAIXO },
                { label: "Médio (≥ 140)", color: RISK_COLORS.MEDIO },
                { label: "Alto (≥ 270)", color: RISK_COLORS.ALTO },
                { label: "Crítico (≥ 390)", color: RISK_COLORS.CRITICO },
              ]}
            />

            <div className="absolute bottom-16 right-8 w-[270px] h-[250px] rounded-lg border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur-sm pointer-events-auto flex flex-col">
              <p className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Distribuição por risco
              </p>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Baixo",
                          total: filtered.filter((m) => m.risco_feminicidio_nivel === "BAIXO")
                            .length,
                          color: RISK_COLORS.BAIXO,
                        },
                        {
                          name: "Médio",
                          total: filtered.filter((m) => m.risco_feminicidio_nivel === "MEDIO")
                            .length,
                          color: RISK_COLORS.MEDIO,
                        },
                        {
                          name: "Alto",
                          total: filtered.filter((m) => m.risco_feminicidio_nivel === "ALTO")
                            .length,
                          color: RISK_COLORS.ALTO,
                        },
                        {
                          name: "Crítico",
                          total: filtered.filter((m) => m.risco_feminicidio_nivel === "CRITICO")
                            .length,
                          color: RISK_COLORS.CRITICO,
                        },
                      ].filter((d) => d.total > 0)}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      label={({ cx, cy, midAngle, outerRadius, percent, name, fill }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius * 1.3;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill={fill}
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                            fontSize={10}
                            fontWeight={600}
                          >
                            {`${name} ${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                      stroke="var(--color-background)"
                      strokeWidth={2}
                    >
                      {[
                        {
                          name: "Baixo",
                          total: filtered.filter((m) => m.risco_feminicidio_nivel === "BAIXO")
                            .length,
                          color: RISK_COLORS.BAIXO,
                        },
                        {
                          name: "Médio",
                          total: filtered.filter((m) => m.risco_feminicidio_nivel === "MEDIO")
                            .length,
                          color: RISK_COLORS.MEDIO,
                        },
                        {
                          name: "Alto",
                          total: filtered.filter((m) => m.risco_feminicidio_nivel === "ALTO")
                            .length,
                          color: RISK_COLORS.ALTO,
                        },
                        {
                          name: "Crítico",
                          total: filtered.filter((m) => m.risco_feminicidio_nivel === "CRITICO")
                            .length,
                          color: RISK_COLORS.CRITICO,
                        },
                      ]
                        .filter((d) => d.total > 0)
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, "Municípios"]}
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 flex flex-col shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 border-b border-border/40 bg-muted/10 relative">
            <ChartHelper>
              <p>
                Tabela completa contendo a base de cálculo para a formulação do Índice de Qualidade
                Territorial (IQT).
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <strong className="text-foreground/80">Variáveis:</strong> Frequência de violência
                  e estrutura.
                </li>
                <li>
                  <strong className="text-foreground/80">Pesos:</strong> Impactos combinados no
                  território.
                </li>
              </ul>
              <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                <p className="text-primary-700 dark:text-primary-300 font-medium">
                  Utilize a <strong className="font-bold">exportação de dados</strong> (CSV) para
                  gerar planilhas e cruzar as informações brutas com outros sistemas internos do
                  MPPI.
                </p>
              </div>
            </ChartHelper>
            <CardTitle className="text-lg font-bold pr-16">Base Analítica e Exportação</CardTitle>
            <div className="absolute top-4 right-12 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1 rounded-full hover:bg-muted/50"
                    title="Exportar Base"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      const data = filtered.map((m) => ({
                        municipio: m.municipio,
                        codigo_ibge: m.codigo_ibge,
                        polo_regional: m.polo_regional,
                        comarca: m.comarca,
                        populacao_total: m.populacao,
                        populacao_feminina: m.populacao_feminina || 0,
                        risco: m.risco_feminicidio_nivel,
                        score: m.risco_feminicidio_score,
                        taxa_femi_100k: m.taxa_feminicidios_100k,
                        feminicidios: m.feminicidios_consumados_2023_2025,
                        taxa_tentativas_100k: m.taxa_tentativas_100k,
                        tentativas: m.feminicidios_tentados_2023_2025,
                        ocorrencias: m.ocorrencias_total_violencia_genero_monitoradas,
                        opm: m.opm_possui,
                        creas: m.creas_possui,
                        alerta: m.painel_alerta_rede,
                        atuacao_prioritaria: m.necessita_atuacao_prioritaria,
                      }));
                      exportCsv("risco_feminicidio.csv", data);
                    }}
                  >
                    Exportar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const data = filtered.map((m) => ({
                        municipio: m.municipio,
                        codigo_ibge: m.codigo_ibge,
                        polo_regional: m.polo_regional,
                        comarca: m.comarca,
                        populacao_total: m.populacao,
                        populacao_feminina: m.populacao_feminina || 0,
                        risco: m.risco_feminicidio_nivel,
                        score: m.risco_feminicidio_score,
                        taxa_femi_100k: m.taxa_feminicidios_100k,
                        feminicidios: m.feminicidios_consumados_2023_2025,
                        taxa_tentativas_100k: m.taxa_tentativas_100k,
                        tentativas: m.feminicidios_tentados_2023_2025,
                        ocorrencias: m.ocorrencias_total_violencia_genero_monitoradas,
                        opm: m.opm_possui,
                        creas: m.creas_possui,
                        alerta: m.painel_alerta_rede,
                        atuacao_prioritaria: m.necessita_atuacao_prioritaria,
                      }));
                      exportPdf(
                        "risco_feminicidio.pdf",
                        "Base Analítica de Risco de Feminicídio",
                        data,
                        {
                          subtitle:
                            "Visão consolidada dos indicadores de violência letal e risco territorial",
                          kpis: [
                            { label: "Municípios Filtrados", value: data.length },
                            {
                              label: "Risco Alto/Crítico",
                              value: data.filter((d) => d.risco === "ALTO" || d.risco === "CRITICO")
                                .length,
                            },
                          ],
                        },
                      );
                    }}
                  >
                    Exportar PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="h-[650px] md:h-[910px] overflow-auto px-4 py-2">
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("municipio")}
                      >
                        Município <SortIcon column="municipio" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("comarca")}
                      >
                        Comarca <SortIcon column="comarca" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("polo_regional")}
                      >
                        Polo Regional <SortIcon column="polo_regional" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer transition-colors text-right hover:bg-white/10"
                        onClick={() => handleSort("populacao")}
                      >
                        População (Geral) <SortIcon column="populacao" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer transition-colors text-right hover:bg-white/10"
                        onClick={() => handleSort("populacao_feminina")}
                      >
                        Pop. Feminina <SortIcon column="populacao_feminina" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("risco_feminicidio_nivel")}
                      >
                        Risco <SortIcon column="risco_feminicidio_nivel" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer transition-colors text-right hover:bg-white/10"
                        onClick={() => handleSort("risco_feminicidio_score")}
                      >
                        Score <SortIcon column="risco_feminicidio_score" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer transition-colors text-right hover:bg-white/10"
                        onClick={() => handleSort("taxa_feminicidios_100k")}
                      >
                        <div className="flex flex-col items-end">
                          <span>
                            Feminicídios <SortIcon column="taxa_feminicidios_100k" />
                          </span>
                          <span className="text-[10px] font-normal opacity-70">
                            Taxa p/ 100k mulheres
                          </span>
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer transition-colors text-right hover:bg-white/10"
                        onClick={() => handleSort("taxa_tentativas_100k")}
                      >
                        <div className="flex flex-col items-end">
                          <span>
                            Tentativas <SortIcon column="taxa_tentativas_100k" />
                          </span>
                          <span className="text-[10px] font-normal opacity-70">
                            Taxa p/ 100k mulheres
                          </span>
                        </div>
                      </TableHead>
                      <TableHead
                        className="min-w-[100px] whitespace-nowrap cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("opm_possui")}
                        title="Organismo de Políticas para as Mulheres"
                      >
                        OPM <SortIcon column="opm_possui" />
                      </TableHead>
                      <TableHead
                        className="min-w-[100px] whitespace-nowrap cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("creas_possui")}
                      >
                        CREAS <SortIcon column="creas_possui" />
                      </TableHead>
                      <TableHead
                        className="min-w-[120px] whitespace-nowrap cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("painel_alerta_rede")}
                      >
                        Alerta <SortIcon column="painel_alerta_rede" />
                      </TableHead>
                      <TableHead
                        className="min-w-[120px] whitespace-nowrap cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("necessita_atuacao_prioritaria")}
                      >
                        Prioritária <SortIcon column="necessita_atuacao_prioritaria" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 100).map((m) => (
                      <TableRow key={m.codigo_ibge}>
                        <TableCell>
                          <Link
                            to="/municipios/$slug"
                            params={{ slug: m.municipio_slug }}
                            className="font-medium text-foreground hover:underline"
                          >
                            {m.municipio}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{m.comarca}</TableCell>
                        <TableCell className="text-muted-foreground">{m.polo_regional}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {m.populacao.toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-foreground font-medium">
                          {(m.populacao_feminina || 0).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <RiskBadge level={m.risco_feminicidio_nivel} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {m.risco_feminicidio_score.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className="font-semibold">{m.taxa_feminicidios_100k}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({m.feminicidios_consumados_2023_2025})
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className="font-semibold">{m.taxa_tentativas_100k}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({m.feminicidios_tentados_2023_2025})
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <YesNoBadge value={m.opm_possui} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <YesNoBadge value={m.creas_possui} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <AlertBadge level={m.painel_alerta_rede} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <YesNoBadge
                            value={m.necessita_atuacao_prioritaria}
                            positiveIsGood={false}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Exibindo {Math.min(filtered.length, 100)} de {filtered.length} resultados.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
