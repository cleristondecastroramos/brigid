import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, HeartHandshake, Search, Eraser, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { municipiosQueryOptions, pct } from "@/lib/csv-data";
import { useMunicipios } from "@/lib/useMunicipios";
import { KpiCard } from "@/components/kpi-card";
import { ChartHelper } from "@/components/chart-helper";
import { PiauiMap } from "@/components/piaui-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { YesNoBadge } from "@/components/risk-badge";
import { exportCsv, exportPdf } from "@/lib/export";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getFaixaPopulacional, type FaixaPop } from "@/lib/utils";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
export const Route = createFileRoute("/creas")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: CreasPanel,
});

const COLOR_WITH = "oklch(0.55 0.13 175)";
const COLOR_WITHOUT = "var(--color-primary)";
const COLOR_NA = "oklch(0.92 0.01 230)";

function CreasPanel() {
  const { data: municipios } = useMunicipios();
  const [q, setQ] = useState("");
  const [comarca, setComarca] = useState("__all");
  const [polo, setPolo] = useState("__all");
  const [faixaPop, setFaixaPop] = useState<FaixaPop>("__all");
  const [status, setStatus] = useState("__all");
  const [filtroKpi, setFiltroKpi] = useState<string | null>(null);

  const [sortCol, setSortCol] = useState<string>("municipio");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />;
  };

  const handleKpiClick = (filtro: string) => {
    setFiltroKpi(prev => prev === filtro ? null : filtro);
  };

  const comarcas = useMemo(() => Array.from(new Set(municipios.map((m) => m.comarca).filter(Boolean))).sort(), [municipios]);
  const polos = useMemo(() => Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort(), [municipios]);

  const baseFiltered = useMemo(() => municipios.filter((m) => {
    if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
    if (comarca !== "__all" && m.comarca !== comarca) return false;
    if (polo !== "__all" && m.polo_regional !== polo) return false;
    if (faixaPop !== "__all" && getFaixaPopulacional(m.populacao) !== faixaPop) return false;
    if (status !== "__all" && m.creas_possui !== status) return false;
    return true;
  }), [municipios, q, comarca, polo, faixaPop, status]);

  const filtered = useMemo(() => baseFiltered.filter((m) => {
    if (filtroKpi === "com") return m.creas_possui === "SIM";
    if (filtroKpi === "sem") return m.creas_possui !== "SIM";
    if (filtroKpi === "altaPrio") return m.creas_possui !== "SIM" && Number(m.populacao) > 10000;
    return true;
  }), [baseFiltered, filtroKpi]);

  const total = baseFiltered.length;
  const com = baseFiltered.filter((m) => m.creas_possui === "SIM").length;
  const sem = total - com;
  const altaPrio = baseFiltered.filter((m) => m.creas_possui !== "SIM" && Number(m.populacao) > 10000).length;

  const semList = filtered.filter((m) => m.creas_possui !== "SIM");

  const sortedData = useMemo(() => {
    return [...filtered].sort((a: any, b: any) => {
      let valA = a[sortCol] || "";
      let valB = b[sortCol] || "";
      
      if (sortCol === "populacao") {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const colorFn = (m: any) => {
    if (!m) return COLOR_NA;
    // If there is a filter active, we want to color only the filtered ones. 
    // Wait, the map needs to dim or hide the ones not in 'filtered'.
    // In PiauiMap it receives colorFn. Let's just color the non-filtered as NA if they are filtered out.
    const isFilteredIn = filtered.some(fm => fm.codigo_ibge === m.codigo_ibge);
    if (!isFilteredIn) return COLOR_NA;
    
    return m.creas_possui === "SIM" ? COLOR_WITH : COLOR_WITHOUT;
  };

  const hasFilter = q !== "" || comarca !== "__all" || polo !== "__all" || faixaPop !== "__all" || status !== "__all";
  const clearFilters = () => {
    setQ(""); setComarca("__all"); setPolo("__all"); setFaixaPop("__all"); setStatus("__all");
  };

  const isDestaque20k = faixaPop === "acima_20k";

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Filtros de Análise:</span>
            {hasFilter && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Filtros ativos</span>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative w-full md:w-[500px] shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar município…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-9" />
            </div>
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <Select value={polo} onValueChange={setPolo}>
                <SelectTrigger className="w-[280px] h-9"><SelectValue placeholder="Polo Regional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos os Polos Regionais</SelectItem>
                  {polos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={comarca} onValueChange={setComarca}>
                <SelectTrigger className="w-[280px] h-9"><SelectValue placeholder="Comarca" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas as comarcas</SelectItem>
                  {comarcas.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={faixaPop} onValueChange={(v) => setFaixaPop(v as FaixaPop)}>
                <SelectTrigger className="w-[280px] h-9"><SelectValue placeholder="Faixa populacional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas as faixas</SelectItem>
                  <SelectItem value="ate_5k">Até 5.000 hab.</SelectItem>
                  <SelectItem value="5k_10k">5.001 a 10.000 hab.</SelectItem>
                  <SelectItem value="10k_20k">10.001 a 20.000 hab.</SelectItem>
                  <SelectItem value="acima_20k">Acima de 20.000 hab.</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[280px] h-9"><SelectValue placeholder="Situação" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos (status)</SelectItem>
                  <SelectItem value="SIM">Com CREAS</SelectItem>
                  <SelectItem value="NAO">Sem CREAS</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={clearFilters} disabled={!hasFilter} className="h-9">
                <Eraser className="mr-2 h-4 w-4" /> Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Municípios (Recorte)" value={total} hint={hasFilter ? "Filtrado" : "Universo"} icon={HeartHandshake} tone="primary" onClick={() => setFiltroKpi(null)} isActive={filtroKpi === null} />
        <KpiCard label="Com CREAS" value={com} hint={pct(com, total)} tone="success" onClick={() => handleKpiClick("com")} isActive={filtroKpi === "com"} />
        <KpiCard label="Sem CREAS" value={sem} hint={pct(sem, total)} tone="critical" onClick={() => handleKpiClick("sem")} isActive={filtroKpi === "sem"} />
        <KpiCard label="Prioridade ALTA" value={altaPrio} hint="Sem CREAS e pop. > 10.000 hab." tone="warning" onClick={() => handleKpiClick("altaPrio")} isActive={filtroKpi === "altaPrio"} />
      </div>

      {isDestaque20k && (
        <Card className="border-warning bg-warning/5">
          <CardHeader className="pb-2 relative">
            <ChartHelper><p>
                      Mapeia a capacidade de cada município em ofertar assistência qualificada a mulheres em situação de violência.
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong className="text-foreground/80">Estrutura:</strong> Presença de Centro de Referência.</li>
                      <li><strong className="text-foreground/80">Atendimento:</strong> Equipes e articulação com a rede local.</li>
                    </ul>
                    <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                      <p className="text-primary-700 dark:text-primary-300 font-medium">
                        Cruze os dados de <strong className="font-bold">Profissionais Capacitados</strong> e avalie se a estrutura física está acompanhada de preparo técnico.
                      </p>
                    </div></ChartHelper>
            <CardTitle className="text-warning-foreground flex items-center gap-2 pr-8">
              Destaque Analítico: Municípios acima de 20 mil habitantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este recorte atende à etapa estratégica do projeto que prioriza a identificação e atuação sobre municípios de maior porte que ainda não possuem CREAS implementado.
            </p>
            <div className="flex gap-4">
              <div className="rounded-md bg-background p-3 border border-border">
                <p className="text-xs text-muted-foreground">Total nesta faixa</p>
                <p className="text-xl font-bold">{total}</p>
              </div>
              <div className="rounded-md bg-background p-3 border border-border">
                <p className="text-xs text-muted-foreground">Com CREAS</p>
                <p className="text-xl font-bold text-[color:var(--color-success)]">{com}</p>
              </div>
              <div className="rounded-md bg-background p-3 border border-border">
                <p className="text-xs text-muted-foreground">Sem CREAS (Déficit)</p>
                <p className="text-xl font-bold text-destructive">{sem}</p>
              </div>
            </div>
            {sem > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Lista nominal do déficit (&gt; 20 mil hab.):</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm" variant="outline"
                        className="border-warning text-warning-foreground hover:bg-warning/10"
                      >
                        <Download className="mr-2 h-4 w-4" /> Exportar lista de déficit
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        const data = semList.map((m) => ({
                          municipio: m.municipio, codigo_ibge: m.codigo_ibge, populacao: m.populacao,
                          comarca: m.comarca, polo_regional: m.polo_regional, prioridade: m.prioridade_implantacao_creas
                        }));
                        exportCsv("municipios_acima_20k_sem_creas.csv", data);
                      }}>
                        Exportar CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const data = semList.map((m) => ({
                          municipio: m.municipio, codigo_ibge: m.codigo_ibge, populacao: m.populacao,
                          comarca: m.comarca, polo_regional: m.polo_regional, prioridade: m.prioridade_implantacao_creas
                        }));
                        exportPdf("municipios_acima_20k_sem_creas.pdf", "Déficit de CREAS (> 20 mil hab.)", data, {
                          subtitle: "Lista nominal de municípios acima de 20 mil habitantes sem CREAS implantado",
                          kpis: [
                            { label: "Municípios no Déficit", value: data.length },
                            { label: "População Desassistida", value: data.reduce((acc, r) => acc + (Number(r.populacao) || 0), 0).toLocaleString("pt-BR") }
                          ]
                        });
                      }}>
                        Exportar PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-2">
                  {semList.map(m => (
                    <span key={m.codigo_ibge} className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium">
                      {m.municipio} <span className="ml-1 text-[10px] text-muted-foreground">({m.populacao.toLocaleString("pt-BR")})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2 relative">
              <ChartHelper>
                <p>
                  Mapeia a presença de Centros de Referência Especializados de Assistência Social (CREAS) nos municípios.
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong className="text-foreground/80">Com CREAS:</strong> Municípios que já possuem a estrutura básica de proteção social especial instalada.</li>
                  <li><strong className="text-foreground/80">Sem CREAS:</strong> Municípios com vulnerabilidade estrutural na rede de proteção a vítimas.</li>
                </ul>
                <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                  <p className="text-primary-700 dark:text-primary-300 font-medium">
                    A ausência de CREAS em áreas com alta densidade populacional ou altos índices de violência indica lacuna grave de assistência do Estado e exige atuação preventiva do Ministério Público.
                  </p>
                </div>
              </ChartHelper>
              <CardTitle className="text-lg pr-8">Cobertura territorial de CREAS</CardTitle>
            </CardHeader>
            <CardContent className="relative">
            <PiauiMap height={850}
              colorFn={colorFn}
              legend={[
                { label: "Com CREAS", color: COLOR_WITH },
                { label: "Sem CREAS", color: COLOR_WITHOUT },
                { label: "Sem dado / Fora do filtro", color: COLOR_NA },
              ]}
            />
            
            <div className="absolute bottom-8 right-8 w-[270px] h-[250px] rounded-lg border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur-sm pointer-events-auto flex flex-col">
              <p className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Distribuição por cobertura</p>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Com CREAS", total: com, color: COLOR_WITH },
                        { name: "Sem CREAS", total: sem, color: COLOR_WITHOUT }
                      ].filter(d => d.total > 0)}
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
                            x={x} y={y} 
                            fill={fill} 
                            textAnchor={x > cx ? 'start' : 'end'} 
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
                      {[{ name: "Com CREAS", total: com, color: COLOR_WITH }, { name: "Sem CREAS", total: sem, color: COLOR_WITHOUT }].filter(d => d.total > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, "Municípios"]}
                      contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 11 }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 relative">
            <ChartHelper><p>
                      Mapeia a capacidade de cada município em ofertar assistência qualificada a mulheres em situação de violência.
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong className="text-foreground/80">Estrutura:</strong> Presença de Centro de Referência.</li>
                      <li><strong className="text-foreground/80">Atendimento:</strong> Equipes e articulação com a rede local.</li>
                    </ul>
                    <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                      <p className="text-primary-700 dark:text-primary-300 font-medium">
                        Cruze os dados de <strong className="font-bold">Profissionais Capacitados</strong> e avalie se a estrutura física está acompanhada de preparo técnico.
                      </p>
                    </div></ChartHelper>
            <CardTitle className="text-lg pr-16">Detalhamento por Municípios</CardTitle>
          <div className="absolute top-4 right-12 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1 rounded-full hover:bg-muted/50"
                  title={`Exportar Tabela (${filtroKpi === "com" ? "Com CREAS" : filtroKpi === "sem" ? "Sem CREAS" : filtroKpi === "altaPrio" ? "Prioridade ALTA" : "Filtro atual"})`}
                >
                  <Download className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  const filename = filtroKpi === "com" ? "municipios_com_creas.csv" :
                                   filtroKpi === "sem" ? "municipios_sem_creas.csv" :
                                   filtroKpi === "altaPrio" ? "municipios_prioridade_alta.csv" :
                                   "municipios_filtro_atual.csv";
                  const data = filtered.map((m) => ({
                    municipio: m.municipio, codigo_ibge: m.codigo_ibge, polo_regional: m.polo_regional,
                    comarca: m.comarca, populacao: m.populacao, creas_possui: m.creas_possui,
                    risco: m.risco_feminicidio_nivel, alerta: m.painel_alerta_rede,
                  }));
                  exportCsv(filename, data);
                }}>
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const filename = filtroKpi === "com" ? "municipios_com_creas.pdf" :
                                   filtroKpi === "sem" ? "municipios_sem_creas.pdf" :
                                   filtroKpi === "altaPrio" ? "municipios_prioridade_alta.pdf" :
                                   "municipios_filtro_atual.pdf";
                  const data = filtered.map((m) => ({
                    municipio: m.municipio, codigo_ibge: m.codigo_ibge, polo_regional: m.polo_regional,
                    comarca: m.comarca, populacao: m.populacao, creas_possui: m.creas_possui,
                    risco: m.risco_feminicidio_nivel, alerta: m.painel_alerta_rede,
                  }));
                  exportPdf(filename, "Detalhamento por Municípios (CREAS)", data, {
                    subtitle: `Filtro ativo: ${filtroKpi === "com" ? "Com CREAS" : filtroKpi === "sem" ? "Sem CREAS" : filtroKpi === "altaPrio" ? "Prioridade ALTA" : "Todos"}`,
                    kpis: [
                      { label: "Total Filtrado", value: data.length },
                      { label: "Com CREAS", value: data.filter(d => d.creas_possui === "SIM").length }
                    ]
                  });
                }}>
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="text-base">
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("municipio")}>
                    <div className="flex items-center">Município <SortIcon col="municipio" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("comarca")}>
                    <div className="flex items-center">Comarca <SortIcon col="comarca" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("polo_regional")}>
                    <div className="flex items-center">Polo Regional <SortIcon col="polo_regional" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("populacao")}>
                    <div className="flex items-center justify-end">População <SortIcon col="populacao" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("creas_possui")}>
                    <div className="flex items-center">CREAS <SortIcon col="creas_possui" /></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.slice(0, 80).map((m) => (
                  <TableRow key={m.codigo_ibge} className="text-base">
                    <TableCell>
                      <Link to="/municipios/$slug" params={{ slug: m.municipio_slug }} className="font-medium text-foreground hover:underline">
                        {m.municipio}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.comarca}</TableCell>
                    <TableCell className="text-muted-foreground">{m.polo_regional}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{m.populacao.toLocaleString("pt-BR")}</TableCell>
                    <TableCell><YesNoBadge value={m.creas_possui} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground">Exibindo {Math.min(filtered.length, 80)} de {filtered.length} resultados.</p>
        </CardContent>
          </Card>
        </div>
    </div>
  );
}

