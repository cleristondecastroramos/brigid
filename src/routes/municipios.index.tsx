import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  AlertTriangle,
  FileText,
  ChevronRight,
  ShieldAlert,
  HeartHandshake,
} from "lucide-react";
import { municipiosQueryOptions } from "@/lib/data-fetching";
import { useMunicipios } from "@/lib/useMunicipios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/municipios/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: MunicipiosList,
});

function MunicipiosList() {
  const { data: municipios } = useMunicipios();
  const [q, setQ] = useState("");
  const [polo, setPolo] = useState("__all");
  const [comarca, setComarca] = useState("__all");
  const [risco, setRisco] = useState("__all");
  const [sortColumn, setSortColumn] = useState<keyof (typeof municipios)[0]>("municipio");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const polos = useMemo(
    () =>
      Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b), "pt-BR"),
      ),
    [municipios],
  );
  const comarcas = useMemo(
    () =>
      Array.from(new Set(municipios.map((m) => m.comarca).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b), "pt-BR"),
      ),
    [municipios],
  );

  const filtered = useMemo(() => {
    const result = municipios.filter((m) => {
      if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
      if (polo !== "__all" && m.polo_regional !== polo) return false;
      if (comarca !== "__all" && m.comarca !== comarca) return false;
      if (risco !== "__all" && m.risco_feminicidio_nivel !== risco) return false;
      return true;
    });

    return result.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;

      const modifier = sortDirection === "asc" ? 1 : -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal, "pt-BR") * modifier;
      }

      return ((aVal as any) < (bVal as any) ? -1 : 1) * modifier;
    });
  }, [municipios, q, polo, comarca, risco, sortColumn, sortDirection]);

  const kpis = useMemo(() => {
    return {
      total: filtered.length,
      comOpm: filtered.filter((m) => m.opm_possui === "SIM").length,
      comCreas: filtered.filter((m) => m.creas_possui === "SIM").length,
      alertaAltoCritico: filtered.filter(
        (m) => m.painel_alerta_rede === "ALTO" || m.painel_alerta_rede === "CRITICO",
      ).length,
      riscoAltoCritico: filtered.filter(
        (m) => m.risco_feminicidio_nivel === "ALTO" || m.risco_feminicidio_nivel === "CRITICO",
      ).length,
    };
  }, [filtered]);

  const handleSort = (column: keyof (typeof municipios)[0]) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: keyof (typeof municipios)[0] }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline" />
    );
  };

  const activeFiltersText = useMemo(() => {
    const filters = [];
    if (polo !== "__all") filters.push(`Polo: ${polo}`);
    if (comarca !== "__all") filters.push(`Comarca: ${comarca}`);
    if (risco !== "__all") filters.push(`Risco: ${risco}`);
    return filters.length > 0 ? filters.join(" | ") : "Visão Geral do Estado";
  }, [polo, comarca, risco]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Painel Analítico de Municípios
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Base de monitoramento territorial e focalização estratégica.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="shadow-sm">
                <Download className="mr-2 h-4 w-4" /> Exportar Dados
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => exportCsv("painel_municipios_brigid.csv", filtered)}>
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Exportar CSV Bruto</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const data = filtered.map((m) => ({
                    municipio: m.municipio,
                    comarca: m.comarca,
                    polo_regional: m.polo_regional,
                    populacao: m.populacao,
                    opm_possui: m.opm_possui,
                    creas_possui: m.creas_possui,
                    risco_feminicidio_nivel: m.risco_feminicidio_nivel,
                    painel_alerta_rede: m.painel_alerta_rede,
                  }));
                  exportPdf(
                    "painel_municipios_executivo.pdf",
                    "Painel Analítico de Municípios",
                    data,
                    {
                      subtitle: `Filtro: ${activeFiltersText}`,
                      kpis: [
                        { label: "Municípios Filtrados", value: kpis.total },
                        { label: "Com OPM Instalada", value: kpis.comOpm },
                        { label: "Risco Alto/Crítico", value: kpis.riscoAltoCritico },
                      ],
                    },
                  );
                }}
              >
                <FileText className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium">Exportar PDF Executivo</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-primary/5 border-primary/10 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-sm font-medium text-primary">Municípios Listados</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com OPM Instalada
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.comOpm}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com CREAS Instalado
            </CardTitle>
            <HeartHandshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.comCreas}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 bg-[color:var(--color-warning)]/5 border-[color:var(--color-warning)]/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-sm font-medium text-[color:var(--color-warning)]">
              Alerta de Rede (A/C)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-[color:var(--color-warning)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.alertaAltoCritico}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 bg-destructive/5 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
            <CardTitle className="text-sm font-medium text-destructive">
              Risco de Feminicídio (A/C)
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.riscoAltoCritico}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-border/60">
        <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
          <CardTitle className="text-lg flex items-center gap-2">Filtros de Focalização</CardTitle>
          <CardDescription>
            Defina o recorte territorial para refinar o diagnóstico.
          </CardDescription>
          <div className="grid gap-3 md:grid-cols-4 mt-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Buscar por Nome</label>
              <Input
                placeholder="Ex: Teresina..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-background shadow-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Polo Regional</label>
              <Select value={polo} onValueChange={setPolo}>
                <SelectTrigger className="bg-background shadow-sm">
                  <SelectValue placeholder="Polo Regional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos os Polos</SelectItem>
                  {polos.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Comarca</label>
              <Select value={comarca} onValueChange={setComarca}>
                <SelectTrigger className="bg-background shadow-sm">
                  <SelectValue placeholder="Comarca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas as Comarcas</SelectItem>
                  {comarcas.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Filtro Crítico (Risco)
              </label>
              <Select value={risco} onValueChange={setRisco}>
                <SelectTrigger className="bg-background shadow-sm">
                  <SelectValue placeholder="Nível de risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos os níveis</SelectItem>
                  <SelectItem value="BAIXO">Baixo</SelectItem>
                  <SelectItem value="MEDIO">Médio</SelectItem>
                  <SelectItem value="ALTO">Alto</SelectItem>
                  <SelectItem value="CRITICO">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto relative">
            <Table>
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-white/10 transition-colors sticky left-0 z-30 bg-[var(--color-sidebar)]"
                    onClick={() => handleSort("municipio")}
                  >
                    Município <SortIcon column="municipio" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("comarca")}
                  >
                    Comarca <SortIcon column="comarca" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("polo_regional")}
                  >
                    Polo Regional <SortIcon column="polo_regional" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("populacao")}
                  >
                    População <SortIcon column="populacao" />
                  </TableHead>
                  <TableHead
                    className="text-center cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("opm_possui")}
                  >
                    OPM <SortIcon column="opm_possui" />
                  </TableHead>
                  <TableHead
                    className="text-center cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("creas_possui")}
                  >
                    CREAS <SortIcon column="creas_possui" />
                  </TableHead>
                  <TableHead
                    className="text-center cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("risco_feminicidio_score")}
                  >
                    Risco <SortIcon column="risco_feminicidio_score" />
                  </TableHead>
                  <TableHead
                    className="text-center cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("painel_alerta_rede")}
                  >
                    Alerta <SortIcon column="painel_alerta_rede" />
                  </TableHead>
                  <TableHead className="w-[80px] text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                      Nenhum município encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((m) => (
                    <TableRow
                      key={m.codigo_ibge}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <TableCell className="sticky left-0 z-10 bg-background group-hover:bg-muted">
                        <Link
                          to="/municipios/$slug"
                          params={{ slug: m.municipio_slug }}
                          className="font-semibold text-foreground hover:text-primary transition-colors"
                        >
                          {m.municipio}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.comarca}</TableCell>
                      <TableCell className="text-muted-foreground">{m.polo_regional}</TableCell>
                      <TableCell className="tabular-nums font-medium text-foreground/80">
                        {m.populacao.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-center">
                        <YesNoBadge value={m.opm_possui} />
                      </TableCell>
                      <TableCell className="text-center">
                        <YesNoBadge value={m.creas_possui} />
                      </TableCell>
                      <TableCell className="text-center bg-primary/[0.02]">
                        <RiskBadge level={m.risco_feminicidio_nivel} />
                      </TableCell>
                      <TableCell className="text-center bg-primary/[0.02]">
                        <AlertBadge level={m.painel_alerta_rede} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Link to="/municipios/$slug" params={{ slug: m.municipio_slug }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Ver detalhes</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
            <span>Mostrando {filtered.length} registros no território.</span>
            <span>Ordene clicando nos cabeçalhos das colunas.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
