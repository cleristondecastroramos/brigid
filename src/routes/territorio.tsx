import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2, HeartHandshake, AlertTriangle, MapPin, ShieldAlert, Search, X,
  Download, FileSpreadsheet, FileText, Eraser, ArrowRight, Layers,
} from "lucide-react";
import { municipiosQueryOptions, pct } from "@/lib/csv-data";
import { useMunicipios } from "@/lib/useMunicipios";
import type { Municipio } from "@/lib/types";
import { KpiCard } from "@/components/kpi-card";
import { TerritorialMap } from "@/components/territorial-map";
import { RiskBadge, AlertBadge, YesNoBadge } from "@/components/risk-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { exportCsv, exportXlsx, exportPdf } from "@/lib/export";

export const Route = createFileRoute("/territorio")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: TerritorialIntelligence,
});

type Layer =
  | "consolidada"
  | "opm"
  | "creas"
  | "risco"
  | "prioridade"
  | "alerta";

const COLORS = {
  withSvc: "oklch(0.62 0.13 175)",
  withoutSvc: "oklch(0.62 0.2 27)",
  na: "oklch(0.92 0.01 230)",
  risk: {
    BAIXO: "oklch(0.72 0.12 160)",
    MEDIO: "oklch(0.78 0.15 85)",
    ALTO: "oklch(0.62 0.18 45)",
    CRITICO: "oklch(0.52 0.22 27)",
  } as Record<string, string>,
  alert: {
    ADEQUADO: "oklch(0.72 0.12 160)",
    ATENCAO: "oklch(0.78 0.15 85)",
    CRITICO: "oklch(0.52 0.22 27)",
  } as Record<string, string>,
  priority: {
    ALTA: "oklch(0.52 0.22 27)",
    MEDIA: "oklch(0.78 0.15 85)",
    BAIXA: "oklch(0.72 0.12 160)",
  } as Record<string, string>,
  consolidada: {
    criticoSemRede: "oklch(0.45 0.24 25)",
    semRede: "oklch(0.62 0.2 27)",
    parcial: "oklch(0.78 0.15 85)",
    completo: "oklch(0.62 0.13 175)",
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
      if (semOpm && semCreas && m.painel_alerta_rede === "CRITICO") return COLORS.consolidada.criticoSemRede;
      if (semOpm && semCreas) return COLORS.consolidada.semRede;
      if (semOpm || semCreas || m.painel_alerta_rede === "ATENCAO") return COLORS.consolidada.parcial;
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

  const comarcas = useMemo(
    () => Array.from(new Set(municipios.map((m) => m.comarca).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b, 'pt-BR'), 'pt-BR')),
    [municipios],
  );
  const polos = useMemo(
    () => Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b, 'pt-BR'), 'pt-BR')),
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
    q !== "" || comarca !== "__all" || polo !== "__all" || opm !== "__all" || creas !== "__all" || risco !== "__all";

  const total = filtered.length;
  const comOPM = filtered.filter((m) => m.opm_possui === "SIM").length;
  const comCREAS = filtered.filter((m) => m.creas_possui === "SIM").length;
  const criticos = filtered.filter((m) => m.painel_alerta_rede === "CRITICO").length;
  const prioritarios = filtered.filter((m) => m.necessita_atuacao_prioritaria === "SIM").length;
  const semAmbos = filtered.filter((m) => m.opm_possui !== "SIM" && m.creas_possui !== "SIM").length;

  const ranking = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          b.risco_feminicidio_score - a.risco_feminicidio_score ||
          b.feminicidios_total_2023_2026 - a.feminicidios_total_2023_2026,
      ),
    [filtered],
  );

  const colorFn = (m: Municipio | undefined) => colorByLayer(layer, m);

  const clearFilters = () => {
    setQ(""); setComarca("__all"); setPolo("__all");
    setOpm("__all"); setCreas("__all"); setRisco("__all");
  };

  const exportRows = () =>
    filtered.map((m) => ({
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
      feminicidios_2023_2026: m.feminicidios_total_2023_2026,
      tentativas_2023_2026: m.tentativas_total_2023_2026,
      ocorrencias_monitoradas: m.ocorrencias_total_violencia_genero_monitoradas,
    }));

  const openMunicipio = (m: Municipio | undefined) => {
    if (!m) return;
    setSelected(m);
    setOpenSheet(true);
  };

  return (
    <div className="space-y-5">
      {/* Header tabs (layers) */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Inteligência territorial</p>
              <p className="text-sm font-semibold text-foreground">Camada temática</p>
            </div>
          </div>
          <Tabs value={layer} onValueChange={(v) => setLayer(v as Layer)}>
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="consolidada">Consolidada</TabsTrigger>
              <TabsTrigger value="opm">OPM</TabsTrigger>
              <TabsTrigger value="creas">CREAS</TabsTrigger>
              <TabsTrigger value="risco">Risco</TabsTrigger>
              <TabsTrigger value="prioridade">Prioridade</TabsTrigger>
              <TabsTrigger value="alerta">Alerta</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* KPIs (filtered) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Municípios" value={total} hint={hasFilter ? "Filtrado" : "Universo"} icon={MapPin} tone="primary" />
        <KpiCard label="Com OPM" value={comOPM} hint={pct(comOPM, total)} icon={Building2} tone="success" />
        <KpiCard label="Com CREAS" value={comCREAS} hint={pct(comCREAS, total)} icon={HeartHandshake} tone="success" />
        <KpiCard label="Sem OPM e CREAS" value={semAmbos} hint={pct(semAmbos, total)} icon={ShieldAlert} tone="critical" />
        <KpiCard label="Alerta crítico" value={criticos} hint={pct(criticos, total)} icon={AlertTriangle} tone="critical" />
        <KpiCard label="Prioritários" value={prioritarios} hint={pct(prioritarios, total)} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Map + filters */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar município por nome…"
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
                <Select value={opm} onValueChange={setOpm}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="OPM" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">OPM (todas)</SelectItem>
                    <SelectItem value="SIM">Com OPM</SelectItem>
                    <SelectItem value="NAO">Sem OPM</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={creas} onValueChange={setCreas}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="CREAS" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">CREAS (todas)</SelectItem>
                    <SelectItem value="SIM">Com CREAS</SelectItem>
                    <SelectItem value="NAO">Sem CREAS</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={risco} onValueChange={setRisco}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Risco" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">Risco (todos)</SelectItem>
                    <SelectItem value="BAIXO">Baixo</SelectItem>
                    <SelectItem value="MEDIO">Moderado</SelectItem>
                    <SelectItem value="ALTO">Alto</SelectItem>
                    <SelectItem value="CRITICO">Crítico</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilter}>
                  <Eraser className="mr-1.5 h-4 w-4" /> Limpar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TerritorialMap height={850}
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

          {/* Export */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Exportar recorte territorial</CardTitle>
                <p className="text-xs text-muted-foreground">{filtered.length} municípios visíveis · camada {LAYER_TITLES[layer]}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => exportCsv(`territorio_${layer}.csv`, exportRows())}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportXlsx(`territorio_${layer}.xlsx`, exportRows())}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                </Button>
                <Button size="sm" variant="outline" onClick={() => exportPdf(`territorio_${layer}.pdf`, `Recorte territorial — ${LAYER_TITLES[layer]}`, exportRows())}>
                  <FileText className="mr-2 h-4 w-4" /> PDF
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Ranking lateral */}
        <Card className="h-fit lg:sticky lg:top-16">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ranking territorial</CardTitle>
            <p className="text-xs text-muted-foreground">Municípios visíveis ordenados por score de risco.</p>
          </CardHeader>
          <CardContent className="max-h-[640px] overflow-y-auto p-2">
            {ranking.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nenhum município no recorte atual.</p>
            ) : (
              <ul className="divide-y divide-border">
                {ranking.slice(0, 60).map((m, i) => (
                  <li key={m.codigo_ibge}>
                    <button
                      onClick={() => openMunicipio(m)}
                      className="flex w-full items-center justify-between gap-2 px-2 py-2 text-left hover:bg-accent/40"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{m.municipio}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{m.polo_regional} · score {m.risco_feminicidio_score}</p>
                        </div>
                      </div>
                      <RiskBadge level={m.risco_feminicidio_nivel} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
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
                  Código IBGE {selected.codigo_ibge} · {selected.populacao.toLocaleString("pt-BR")} hab.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <RiskBadge level={selected.risco_feminicidio_nivel} />
                  <AlertBadge level={selected.painel_alerta_rede} />
                  {selected.necessita_atuacao_prioritaria === "SIM" && (
                    <span className="inline-flex items-center rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Atuação prioritária
                    </span>
                  )}
                </div>

                <Section title="Vínculo institucional">
                  <Row k="Comarca" v={selected.comarca || "—"} />
                  <Row k="Polo regional" v={selected.polo_regional || "—"} />
                  <Row k="Status monitoramento" v={selected.status_monitoramento || "—"} />
                </Section>

                <Section title="Rede de proteção">
                  <Row k="OPM" v={<YesNoBadge value={selected.opm_possui} />} />
                  <Row k="Status OPM" v={selected.opm_status_politicas_publicas || "—"} />
                  <Row k="CREAS" v={<YesNoBadge value={selected.creas_possui} />} />
                  <Row k="Prioridade implantação CREAS" v={selected.prioridade_implantacao_creas || "—"} />
                  <Row k="Prioridade fomento OPM" v={selected.prioridade_fomento_opm || "—"} />
                </Section>

                <Section title="Risco e ocorrências">
                  <Row k="Nível de risco" v={<RiskBadge level={selected.risco_feminicidio_nivel} />} />
                  <Row k="Score" v={<strong>{selected.risco_feminicidio_score}</strong>} />
                  <Row k="Feminicídios 2023–26" v={selected.feminicidios_total_2023_2026} />
                  <Row k="Tentativas 2023–26" v={selected.tentativas_total_2023_2026} />
                  <Row k="Ocorrências monitoradas" v={selected.ocorrencias_total_violencia_genero_monitoradas} />
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
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
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
