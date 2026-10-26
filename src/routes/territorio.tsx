import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  HeartHandshake,
  AlertTriangle,
  MapPin,
  ShieldAlert,
  Search,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Eraser,
  ArrowRight,
  Layers,
} from "lucide-react";
import { municipiosQueryOptions, pct } from "@/lib/data-fetching";
import { useMunicipios } from "@/lib/useMunicipios";
import type { Municipio } from "@/lib/types";
import { KpiCard } from "@/components/kpi-card";
import { TerritorialMap } from "@/components/territorial-map";
import { RiskBadge, AlertBadge, YesNoBadge } from "@/components/risk-badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { exportCsv, exportXlsx, exportPdf } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChartHelper } from "@/components/chart-helper";
import { PageTitle } from "@/components/page-title";
import { NotasRodape } from "@/components/rodape-institucional";

export const Route = createFileRoute("/territorio")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: TerritorialIntelligence,
});

type Layer = "consolidada" | "opm" | "creas" | "risco" | "prioridade" | "alerta";

const COLORS = {
  withSvc: "var(--mapa-positivo)", // green
  withoutSvc: "var(--mapa-critico)", // purple
  na: "var(--mapa-neutro)", // grey
  risk: {
    BAIXO: "var(--mapa-positivo)",
    MEDIO: "var(--mapa-atencao)",
    ALTO: "var(--mapa-alto)",
    CRITICO: "var(--mapa-critico)",
    NA: "var(--mapa-neutro)",
  } as Record<string, string>,
  alert: {
    ADEQUADO: "var(--mapa-positivo)",
    ATENCAO: "var(--mapa-atencao)",
    CRITICO: "var(--mapa-critico)",
  } as Record<string, string>,
  priority: {
    ALTA: "var(--mapa-critico)",
    MEDIA: "var(--mapa-atencao)",
    BAIXA: "var(--mapa-positivo)",
  } as Record<string, string>,
  consolidada: {
    criticoSemRede: "var(--mapa-critico)",
    semRede: "var(--mapa-alto)",
    parcial: "var(--mapa-atencao)",
    completo: "var(--mapa-positivo)",
  },
};

const LAYER_LEGENDS: Record<Layer, Array<{ label: string; color: string }>> = {
  opm: [
    { label: "Com OPM", color: COLORS.withSvc },
    { label: "Sem OPM", color: COLORS.withoutSvc },
    { label: "Sem dado", color: COLORS.na },
  ],
  creas: [
    { label: "Com CREAS", color: COLORS.withSvc },
    { label: "Sem CREAS", color: COLORS.withoutSvc },
    { label: "Sem dado", color: COLORS.na },
  ],
  risco: [
    { label: "Baixo", color: COLORS.risk.BAIXO },
    { label: "Moderado", color: COLORS.risk.MEDIO },
    { label: "Alto", color: COLORS.risk.ALTO },
    { label: "Crítico", color: COLORS.risk.CRITICO },
  ],
  prioridade: [
    { label: "Atuação prioritária", color: COLORS.priority.ALTA },
    { label: "Atenção", color: COLORS.priority.MEDIA },
    { label: "Estável", color: COLORS.priority.BAIXA },
  ],
  alerta: [
    { label: "Adequado", color: COLORS.alert.ADEQUADO },
    { label: "Atenção", color: COLORS.alert.ATENCAO },
    { label: "Crítico", color: COLORS.alert.CRITICO },
  ],
  consolidada: [
    { label: "Crítico — sem OPM e sem CREAS", color: COLORS.consolidada.criticoSemRede },
    { label: "Sem OPM ou sem CREAS", color: COLORS.consolidada.semRede },
    { label: "Cobertura parcial / atenção", color: COLORS.consolidada.parcial },
    { label: "Rede consolidada", color: COLORS.consolidada.completo },
  ],
};

function colorByLayer(layer: Layer, m: Municipio | undefined): string {
  if (!m) return COLORS.na;
  switch (layer) {
    case "opm":
      return m.opm_possui === "SIM" ? COLORS.withSvc : COLORS.withoutSvc;
    case "creas":
      return m.creas_possui === "SIM" ? COLORS.withSvc : COLORS.withoutSvc;
    case "risco":
      return COLORS.risk[m.risco_feminicidio_nivel] ?? COLORS.na;
    case "alerta":
      return COLORS.alert[m.painel_alerta_rede] ?? COLORS.na;
    case "prioridade":
      if (m.necessita_atuacao_prioritaria === "SIM") return COLORS.priority.ALTA;
      if (m.painel_alerta_rede === "ATENCAO") return COLORS.priority.MEDIA;
      return COLORS.priority.BAIXA;
    case "consolidada": {
      const semOpm = m.opm_possui !== "SIM";
      const semCreas = m.creas_possui !== "SIM";
      if (semOpm && semCreas && m.painel_alerta_rede === "CRITICO")
        return COLORS.consolidada.criticoSemRede;
      if (semOpm && semCreas) return COLORS.consolidada.semRede;
      if (semOpm || semCreas || m.painel_alerta_rede === "ATENCAO")
        return COLORS.consolidada.parcial;
      return COLORS.consolidada.completo;
    }
  }
}

function TerritorialIntelligence() {
  const { data: municipios } = useMunicipios();

  const [layer, setLayer] = useState<Layer>("consolidada");
  const [q, setQ] = useState("");
  const [comarca, setComarca] = useState("__all");
  const [polo, setPolo] = useState("__all");
  const [opm, setOpm] = useState("__all");
  const [creas, setCreas] = useState("__all");
  const [risco, setRisco] = useState("__all");
  const [selected, setSelected] = useState<Municipio | null>(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [rankingPage, setRankingPage] = useState(1);

  useEffect(() => {
    setRankingPage(1);
  }, [layer, q, comarca, polo, opm, creas, risco]);

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

  const filtered = useMemo(
    () =>
      municipios.filter((m) => {
        if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
        if (comarca !== "__all" && m.comarca !== comarca) return false;
        if (polo !== "__all" && m.polo_regional !== polo) return false;
        if (opm !== "__all" && m.opm_possui !== opm) return false;
        if (creas !== "__all" && m.creas_possui !== creas) return false;
        if (risco !== "__all" && m.risco_feminicidio_nivel !== risco) return false;
        return true;
      }),
    [municipios, q, comarca, polo, opm, creas, risco],
  );

  const filteredSlugs = useMemo(() => new Set(filtered.map((m) => m.municipio_slug)), [filtered]);
  const hasFilter =
    q !== "" ||
    comarca !== "__all" ||
    polo !== "__all" ||
    opm !== "__all" ||
    creas !== "__all" ||
    risco !== "__all";

  const total = filtered.length;
  const comOPM = filtered.filter((m) => m.opm_possui === "SIM").length;
  const comCREAS = filtered.filter((m) => m.creas_possui === "SIM").length;
  const criticos = filtered.filter((m) => m.painel_alerta_rede === "CRITICO").length;
  const prioritarios = filtered.filter((m) => m.necessita_atuacao_prioritaria === "SIM").length;
  const semAmbos = filtered.filter(
    (m) => m.opm_possui !== "SIM" && m.creas_possui !== "SIM",
  ).length;

  const ranking = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          b.risco_feminicidio_score - a.risco_feminicidio_score ||
          b.feminicidios_consumados_2023_2025 - a.feminicidios_consumados_2023_2025,
      ),
    [filtered],
  );

  const ITEMS_PER_PAGE = 15;
  const totalPages = Math.ceil(ranking.length / ITEMS_PER_PAGE);
  const paginatedRanking = ranking.slice(
    (rankingPage - 1) * ITEMS_PER_PAGE,
    rankingPage * ITEMS_PER_PAGE,
  );

  const colorFn = (m: Municipio | undefined) => colorByLayer(layer, m);

  const clearFilters = () => {
    setQ("");
    setComarca("__all");
    setPolo("__all");
    setOpm("__all");
    setCreas("__all");
    setRisco("__all");
  };

  const exportRows = () =>
    ranking.map((m) => ({
      municipio: m.municipio,
      codigo_ibge: m.codigo_ibge,
      comarca: m.comarca,
      polo_regional: m.polo_regional,
      populacao: m.populacao,
      opm: m.opm_possui,
      creas: m.creas_possui,
      risco: m.risco_feminicidio_nivel,
      score: m.risco_feminicidio_score,
      alerta: m.painel_alerta_rede,
      prioritario: m.necessita_atuacao_prioritaria,
      feminicidios_2023_2026: m.feminicidios_consumados_2023_2025,
      tentativas_2023_2026: m.feminicidios_tentados_2023_2025,
      ocorrencias_monitoradas: m.ocorrencias_total_violencia_genero_monitoradas,
    }));

  const openMunicipio = (m: Municipio | undefined) => {
    if (!m) return;
    setSelected(m);
    setOpenSheet(true);
  };

  return (
    <div className="space-y-5">
      <PageTitle
        secao="Territorial"
        titulo="Inteligência Territorial"
        descricao="Cruzamento das camadas de estrutura, risco, alerta da rede e prioridade por município, comarca e polo regional."
      />
      {/* Header tabs (layers) */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Inteligência territorial
                </p>
                <p className="text-sm font-semibold text-foreground">Camada temática</p>
              </div>
            </div>
            <Tabs value={layer} onValueChange={(v) => setLayer(v as Layer)}>
              <TabsList className="flex flex-wrap">
                <TabsTrigger
                  value="consolidada"
                  className="w-[130px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Consolidada
                </TabsTrigger>
                <TabsTrigger
                  value="opm"
                  className="w-[130px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  OPM
                </TabsTrigger>
                <TabsTrigger
                  value="creas"
                  className="w-[130px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  CREAS
                </TabsTrigger>
                <TabsTrigger
                  value="risco"
                  className="w-[130px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Risco
                </TabsTrigger>
                <TabsTrigger
                  value="prioridade"
                  className="w-[130px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Prioridade
                </TabsTrigger>
                <TabsTrigger
                  value="alerta"
                  className="w-[130px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Alerta
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="h-px bg-border/40" />
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[500px] shrink-0">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar município por nome…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-8 w-full bg-background"
              />
            </div>
            <Select value={polo} onValueChange={setPolo}>
              <SelectTrigger className="w-[280px] bg-background">
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
              <SelectTrigger className="w-[280px] bg-background">
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
            <Select value={opm} onValueChange={setOpm}>
              <SelectTrigger className="w-[280px] bg-background">
                <SelectValue placeholder="OPM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">OPM (todas)</SelectItem>
                <SelectItem value="SIM">Com OPM</SelectItem>
                <SelectItem value="NAO">Sem OPM</SelectItem>
              </SelectContent>
            </Select>
            <Select value={creas} onValueChange={setCreas}>
              <SelectTrigger className="w-[280px] bg-background">
                <SelectValue placeholder="CREAS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">CREAS (todas)</SelectItem>
                <SelectItem value="SIM">Com CREAS</SelectItem>
                <SelectItem value="NAO">Sem CREAS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={risco} onValueChange={setRisco}>
              <SelectTrigger className="w-[280px] bg-background">
                <SelectValue placeholder="Risco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Risco (todos)</SelectItem>
                <SelectItem value="BAIXO">Baixo</SelectItem>
                <SelectItem value="MEDIO">Moderado</SelectItem>
                <SelectItem value="ALTO">Alto</SelectItem>
                <SelectItem value="CRITICO">Crítico</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!hasFilter}
              className="h-10"
            >
              <Eraser className="mr-1.5 h-4 w-4" /> Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Map */}
        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 relative border-b border-border/40">
            <ChartHelper>
              <p>
                O <strong>Mapa Territorial</strong> permite sobrepor as camadas de cobertura
                institucional (OPM, CREAS) aos indicadores de risco de feminicídio e criticidade.
              </p>
              <ul className="list-disc pl-4 space-y-1 mt-2">
                <li>
                  <strong className="text-foreground/80">Cores:</strong> Indicam a suficiência ou
                  severidade na camada selecionada. O Roxo indica alerta ou déficit, e o Verde
                  indica suficiência.
                </li>
                <li>
                  <strong className="text-foreground/80">Filtros:</strong> Restringem tanto o mapa
                  quanto a exportação de dados no ícone de download.
                </li>
              </ul>
            </ChartHelper>
            <CardTitle className="text-lg pr-16">Visão Geoespacial do MPPI</CardTitle>
            <div className="absolute top-4 right-12 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1 rounded-sm hover:bg-muted/50"
                    title="Exportar Tabela"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => exportCsv(`territorio_${layer}.csv`, exportRows())}
                  >
                    Exportar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      exportPdf(
                        `territorio_${layer}.pdf`,
                        `Recorte Territorial — ${LAYER_TITLES[layer]}`,
                        exportRows(),
                        {
                          subtitle: `Filtros aplicados. Municípios visíveis: ${filtered.length}`,
                          kpis: [
                            { label: "Visíveis no Mapa", value: filtered.length },
                            {
                              label: "Com OPM e CREAS",
                              value: filtered.filter(
                                (m) => m.opm_possui === "SIM" && m.creas_possui === "SIM",
                              ).length,
                            },
                          ],
                        },
                      )
                    }
                  >
                    Exportar PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col items-center justify-center min-h-[700px]">
            <TerritorialMap
              municipios={municipios}
              height={700}
              colorFn={colorFn}
              selectedSlug={selected?.municipio_slug}
              highlightSlugs={hasFilter ? filteredSlugs : undefined}
              dimNonHighlighted={hasFilter}
              onSelect={(m) => openMunicipio(m)}
              legend={LAYER_LEGENDS[layer]}
              legendTitle={`Legenda · ${LAYER_TITLES[layer]}`}
            />
          </CardContent>
        </Card>

        {/* Ranking lateral */}
        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 relative border-b border-border/40">
            <ChartHelper>
              <p>
                O <strong>Ranking Territorial</strong> lista os municípios do recorte atual
                ordenados pelo seu score de risco (do maior para o menor).
              </p>
              <ul className="list-disc pl-4 space-y-1 mt-2">
                <li>
                  <strong className="text-foreground/80">Exportação:</strong> Utilize o ícone de
                  download para exportar a lista visível já ordenada.
                </li>
                <li>
                  <strong className="text-foreground/80">Interatividade:</strong> Clique em um
                  município para abrir sua ficha detalhada.
                </li>
              </ul>
            </ChartHelper>
            <div className="flex-1 pr-8">
              <CardTitle className="text-base">Ranking territorial</CardTitle>
              <p className="text-xs text-muted-foreground">
                Municípios visíveis ordenados por score de risco.
              </p>
            </div>
            <div className="absolute top-4 right-12 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1 rounded-sm hover:bg-muted/50"
                    title="Exportar Ranking"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => exportCsv(`ranking_territorial_${layer}.csv`, exportRows())}
                  >
                    Exportar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      exportPdf(
                        `ranking_territorial_${layer}.pdf`,
                        `Ranking Territorial — ${LAYER_TITLES[layer]}`,
                        exportRows(),
                        {
                          subtitle: `Filtros aplicados. Total de municípios no ranking: ${ranking.length}`,
                        },
                      )
                    }
                  >
                    Exportar PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {ranking.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Nenhum município no recorte atual.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {paginatedRanking.map((m, i) => {
                  const absoluteIndex = (rankingPage - 1) * ITEMS_PER_PAGE + i;
                  return (
                    <li key={m.codigo_ibge}>
                      <button
                        onClick={() => openMunicipio(m)}
                        className="flex w-full items-center justify-between gap-2 px-2 py-2 text-left hover:bg-accent/40"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                            {absoluteIndex + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {m.municipio}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {m.polo_regional} · score {m.risco_feminicidio_score}
                            </p>
                          </div>
                        </div>
                        <RiskBadge level={m.risco_feminicidio_nivel} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/40 p-3 bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRankingPage((p) => Math.max(1, p - 1))}
                disabled={rankingPage === 1}
              >
                Anterior
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                Pág. {rankingPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRankingPage((p) => Math.min(totalPages, p + 1))}
                disabled={rankingPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Side detail sheet */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> {selected.municipio}
                </SheetTitle>
                <SheetDescription>
                  Código IBGE {selected.codigo_ibge} · {selected.populacao.toLocaleString("pt-BR")}{" "}
                  hab.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <RiskBadge level={selected.risco_feminicidio_nivel} />
                  <AlertBadge level={selected.painel_alerta_rede} />
                  {selected.necessita_atuacao_prioritaria === "SIM" && (
                    <span className="inline-flex items-center rounded-sm border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Atuação prioritária
                    </span>
                  )}
                </div>

                <Section title="Vínculo institucional">
                  <Row k="Comarca" v={selected.comarca || "—"} />
                  <Row k="Polo Regional" v={selected.polo_regional || "—"} />
                  <Row k="Status monitoramento" v={selected.status_monitoramento || "—"} />
                </Section>

                <Section title="Rede de proteção">
                  <Row k="OPM" v={<YesNoBadge value={selected.opm_possui} />} />
                  <Row k="Status OPM" v={selected.opm_status_politicas_publicas || "—"} />
                  <Row k="CREAS" v={<YesNoBadge value={selected.creas_possui} />} />
                  <Row
                    k="Prioridade implantação CREAS"
                    v={selected.prioridade_implantacao_creas || "—"}
                  />
                  <Row k="Prioridade fomento OPM" v={selected.prioridade_fomento_opm || "—"} />
                </Section>

                <Section title="Risco e ocorrências">
                  <Row
                    k="Nível de risco"
                    v={<RiskBadge level={selected.risco_feminicidio_nivel} />}
                  />
                  <Row k="Score" v={<strong>{selected.risco_feminicidio_score}</strong>} />
                  <Row k="Feminicídios 2023–26" v={selected.feminicidios_consumados_2023_2025} />
                  <Row k="Tentativas 2023–26" v={selected.feminicidios_tentados_2023_2025} />
                  <Row
                    k="Ocorrências monitoradas"
                    v={selected.ocorrencias_total_violencia_genero_monitoradas}
                  />
                  <Row k="Alerta da rede" v={<AlertBadge level={selected.painel_alerta_rede} />} />
                </Section>

                <Link
                  to="/municipios/$slug"
                  params={{ slug: selected.municipio_slug }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  onClick={() => setOpenSheet(false)}
                >
                  Abrir ficha completa <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={() => setOpenSheet(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                >
                  <X className="h-4 w-4" /> Fechar
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <NotasRodape
        fontes={[
          "Base de feminicídios 2023–2026, consolidada pelo CAOCRIM",
          "SEMPI/OPM 2026",
          "SASC/SUAS 2025",
        ]}
        notas={[
          "Classificações de risco e prioridade calculadas conforme a metodologia oficial vigente.",
        ]}
      />
    </div>
  );
}

const LAYER_TITLES: Record<Layer, string> = {
  consolidada: "Visão consolidada",
  opm: "Cobertura de OPM",
  creas: "Cobertura de CREAS",
  risco: "Risco de feminicídio",
  prioridade: "Prioridade institucional",
  alerta: "Alerta da rede",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-1 last:border-0 last:pb-0">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</span>
      <span className="text-sm text-foreground">{v}</span>
    </div>
  );
}
