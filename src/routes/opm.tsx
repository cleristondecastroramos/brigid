import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Building2, Search, Eraser, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
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
import { exportCsv } from "@/lib/export";
import { getFaixaPopulacional, type FaixaPop } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/opm")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: OpmPanel,
});

const COLOR_WITH = "oklch(0.35 0.15 300)";
const COLOR_WITHOUT = "oklch(0.6 0 0)";
const COLOR_PENDING = "oklch(0.65 0.15 300)";
const COLOR_NA = "oklch(0.95 0 0)";

function OpmPanel() {
  const { data: municipios } = useMunicipios();
  const [q, setQ] = useState("");
  const [comarca, setComarca] = useState("__all");
  const [polo, setPolo] = useState("__all");
  const [faixaPop, setFaixaPop] = useState<FaixaPop>("__all");
  const [status, setStatus] = useState("__all");
  const [tipo, setTipo] = useState("__all");
  const [sortColumn, setSortColumn] = useState<keyof typeof municipios[0]>("municipio");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filtroKpi, setFiltroKpi] = useState<string | null>(null);

  const handleKpiClick = (filtro: string) => {
    setFiltroKpi(prev => prev === filtro ? null : filtro);
  };

  const handleSort = (col: keyof typeof municipios[0]) => {
    if (sortColumn === col) setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    else { setSortColumn(col); setSortDirection("asc"); }
  };
  
  const SortIcon = ({ column }: { column: keyof typeof municipios[0] }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? <ArrowUp className="ml-1 inline h-4 w-4" /> : <ArrowDown className="ml-1 inline h-4 w-4" />;
  };

  const comarcas = useMemo(() => Array.from(new Set(municipios.map((m) => m.comarca).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR')), [municipios]);
  const polos = useMemo(() => Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR')), [municipios]);
  const tipos = useMemo(() => Array.from(new Set(municipios.map((m) => m.opm_orgaotipo).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR')), [municipios]);

  const baseFiltered = useMemo(() => municipios.filter((m) => {
    if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
    if (comarca !== "__all" && m.comarca !== comarca) return false;
    if (polo !== "__all" && m.polo_regional !== polo) return false;
    if (faixaPop !== "__all" && getFaixaPopulacional(m.populacao) !== faixaPop) return false;
    if (status !== "__all" && m.opm_possui !== status) return false;
    if (tipo !== "__all" && m.opm_orgaotipo !== tipo) return false;
    return true;
  }), [municipios, q, comarca, polo, faixaPop, status, tipo]);

  const filtered = useMemo(() => baseFiltered.filter((m) => {
    if (filtroKpi === "com") return m.opm_possui === "SIM";
    if (filtroKpi === "sem") return m.opm_possui === "NAO";
    if (filtroKpi === "pendentes") return m.opm_possui === "SIM" && m.opm_orgaotipo === "A_VERIFICAR_DETALHE";
    return true;
  }).sort((a, b) => {
    const valA = a[sortColumn];
    const valB = b[sortColumn];
    if (valA === valB) return 0;
    const modifier = sortDirection === "asc" ? 1 : -1;
    if (typeof valA === "string" && typeof valB === "string") return valA.localeCompare(valB, 'pt-BR') * modifier;
    return ((valA ?? 0) > (valB ?? 0) ? 1 : -1) * modifier;
  }), [baseFiltered, filtroKpi, sortColumn, sortDirection]);

  const total = baseFiltered.length;
  const com = baseFiltered.filter((m) => m.opm_possui === "SIM").length;
  const sem = baseFiltered.filter((m) => m.opm_possui === "NAO").length;
  const pendentes = baseFiltered.filter((m) => m.opm_possui === "SIM" && m.opm_orgaotipo === "A_VERIFICAR_DETALHE").length;

  const semList = filtered.filter((m) => m.opm_possui !== "SIM");
  const pendentesList = filtered.filter((m) => m.opm_possui === "SIM" && m.opm_orgaotipo === "A_VERIFICAR_DETALHE");

  // Chart Data
  const chartData = useMemo(() => {
    const counts = {
      "Secretaria": 0,
      "Coordenadoria": 0,
      "Diretoria": 0,
      "Departamento": 0,
      "Gerência": 0,
      "Outro": 0,
      "A Verificar": 0
    };
    
    filtered.forEach(m => {
      if (m.opm_possui === "SIM") {
        const t = m.opm_orgaotipo;
        if (t === "Secretaria") counts["Secretaria"]++;
        else if (t === "Coordenadoria") counts["Coordenadoria"]++;
        else if (t === "Diretoria") counts["Diretoria"]++;
        else if (t === "Departamento") counts["Departamento"]++;
        else if (t === "Gerência") counts["Gerência"]++;
        else if (t === "Outro") counts["Outro"]++;
        else counts["A Verificar"]++;
      }
    });

    return Object.entries(counts).map(([nome, valor]) => ({ nome, valor })).filter(d => d.valor > 0).sort((a, b) => b.valor - a.valor);
  }, [filtered]);

  const colorFn = (m: any) => {
    if (!m) return COLOR_NA;
    const isFilteredIn = filtered.some(fm => fm.codigo_ibge === m.codigo_ibge);
    if (!isFilteredIn) return COLOR_NA;
    
    if (m.opm_possui === "SIM") {
      return m.opm_orgaotipo === "A_VERIFICAR_DETALHE" ? COLOR_PENDING : COLOR_WITH;
    }
    return COLOR_WITHOUT;
  };

  const hasFilter = q !== "" || comarca !== "__all" || polo !== "__all" || faixaPop !== "__all" || status !== "__all" || tipo !== "__all";
  const clearFilters = () => {
    setQ(""); setComarca("__all"); setPolo("__all"); setFaixaPop("__all"); setStatus("__all"); setTipo("__all");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Filtros de Análise:</span>
              {hasFilter && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Filtros ativos</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar município…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
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
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos (status)</SelectItem>
                  <SelectItem value="SIM">Com OPM</SelectItem>
                  <SelectItem value="NAO">Sem OPM</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Tipologia" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas (tipologia)</SelectItem>
                  {tipos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters} disabled={!hasFilter}>
                <Eraser className="mr-2 h-4 w-4" /> Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard label="Municípios (Recorte)" value={total} hint={hasFilter ? "Filtrado" : "Universo"} icon={Building2} tone="primary" onClick={() => setFiltroKpi(null)} isActive={filtroKpi === null} />
        <KpiCard label="Com OPM" value={com} hint={pct(com, total)} tone="success" onClick={() => handleKpiClick("com")} isActive={filtroKpi === "com"} />
        <KpiCard label="Sem OPM" value={sem} hint={pct(sem, total)} tone="critical" onClick={() => handleKpiClick("sem")} isActive={filtroKpi === "sem"} />
        <KpiCard label="Cobertura Total" value={pct(com, total)} tone="primary" onClick={() => handleKpiClick("com")} isActive={filtroKpi === "com"} />
        <KpiCard label="Pendente Detalhamento" value={pendentes} hint="Tipologia a verificar" tone="warning" onClick={() => handleKpiClick("pendentes")} isActive={filtroKpi === "pendentes"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 relative">
            <ChartHelper>
              <p>
                Monitora a implantação de Organismos de Políticas para as Mulheres (OPMs) no território.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong className="text-foreground/80">Qualificado:</strong> OPM instituído por lei, com dotação orçamentária e equipe mínima.</li>
                <li><strong className="text-foreground/80">Sem OPM:</strong> Inexistência formal do órgão ou estrutura inadequada (desativado).</li>
              </ul>
              <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                <p className="text-primary-700 dark:text-primary-300 font-medium">
                  A ausência de OPM prejudica a articulação de políticas públicas de gênero na base municipal e fragiliza a prevenção à violência.
                </p>
              </div>
            </ChartHelper>
            <CardTitle className="text-base pr-8">Cobertura territorial de OPMs</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <PiauiMap height={850}
              colorFn={colorFn}
              legend={[
                { label: "Com OPM (Qualificado)", color: COLOR_WITH },
                { label: "Com OPM (Pendente Detalhe)", color: COLOR_PENDING },
                { label: "Sem OPM", color: COLOR_WITHOUT },
                { label: "Fora do filtro", color: COLOR_NA },
              ]}
            />

            <div className="absolute bottom-8 right-8 w-[270px] h-[250px] rounded-lg border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur-sm pointer-events-auto flex flex-col">
              <p className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Distribuição por cobertura</p>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Qualificado", total: com - pendentes, color: COLOR_WITH },
                        { name: "Pendente Det.", total: pendentes, color: COLOR_PENDING },
                        { name: "Sem OPM", total: sem, color: COLOR_WITHOUT }
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
                      {[
                        { name: "Qualificado", total: com - pendentes, color: COLOR_WITH },
                        { name: "Pendente Det.", total: pendentes, color: COLOR_PENDING },
                        { name: "Sem OPM", total: sem, color: COLOR_WITHOUT }
                      ].filter(d => d.total > 0).map((entry, index) => (
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

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 relative">
            <ChartHelper><p>
                      Classifica as estruturas de políticas para mulheres (OPMs) com base no seu nível hierárquico na prefeitura.
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong className="text-foreground/80">Secretaria:</strong> Maior orçamento e autonomia.</li>
                      <li><strong className="text-foreground/80">Coordenação:</strong> Estruturas menores, geralmente subordinadas.</li>
                    </ul>
                    <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                      <p className="text-primary-700 dark:text-primary-300 font-medium">
                        Identifique a <strong className="font-bold">Tipologia</strong> para direcionar recomendações sobre o fortalecimento da autonomia gerencial.
                      </p>
                    </div></ChartHelper>
            <CardTitle className="text-base pr-8">Distribuição por Tipologia</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="nome" type="category" tick={{ fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="valor" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={24}>
                    <LabelList dataKey="valor" position="right" style={{ fill: "var(--color-foreground)", fontSize: 11, fontWeight: 500 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>



      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 relative">
            <ChartHelper><p>
                      Visão analítica individual dos municípios quanto à implementação e funcionamento dos órgãos de política para mulheres.
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong className="text-foreground/80">Base Legal:</strong> Leis de criação aprovadas.</li>
                      <li><strong className="text-foreground/80">Qualificação:</strong> Atendimento aos critérios mínimos de operação.</li>
                    </ul>
                    <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                      <p className="text-primary-700 dark:text-primary-300 font-medium">
                        Utilize a <strong className="font-bold">Exportação de Planilha</strong> para fundamentar inquéritos voltados à regularização de OPMs inativas.
                      </p>
                    </div></ChartHelper>
            <CardTitle className="text-base pr-8">Municípios — detalhamento</CardTitle>
          <Button size="sm" variant="outline" onClick={() => exportCsv("municipios_opm_filtro.csv", filtered.map((m) => ({
            municipio: m.municipio, codigo_ibge: m.codigo_ibge, polo_regional: m.polo_regional, comarca: m.comarca, populacao: m.populacao,
            opm_possui: m.opm_possui, opm_orgaotipo: m.opm_orgaotipo, opm_status_politicas_publicas: m.opm_status_politicas_publicas
          })))}>
            <Download className="mr-2 h-4 w-4" /> Exportar Tabela
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('municipio')}>Município <SortIcon column="municipio" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('comarca')}>Comarca <SortIcon column="comarca" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('polo_regional')}>Polo <SortIcon column="polo_regional" /></TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('populacao')}>População <SortIcon column="populacao" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('opm_possui')}>OPM <SortIcon column="opm_possui" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('opm_orgaotipo')}>Tipologia <SortIcon column="opm_orgaotipo" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('opm_status_politicas_publicas')}>Políticas Efetivas <SortIcon column="opm_status_politicas_publicas" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('opm_possui_estrutura_ativa')}>Estrutura Ativa <SortIcon column="opm_possui_estrutura_ativa" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 80).map((m) => (
                  <TableRow key={m.codigo_ibge}>
                    <TableCell><Link to="/municipios/$slug" params={{ slug: m.municipio_slug }} className="font-medium text-foreground hover:underline">{m.municipio}</Link></TableCell>
                    <TableCell className="text-muted-foreground">{m.comarca}</TableCell>
                    <TableCell className="text-muted-foreground">{m.polo_regional}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{m.populacao.toLocaleString("pt-BR")}</TableCell>
                    <TableCell><YesNoBadge value={m.opm_possui} /></TableCell>
                    <TableCell className="text-muted-foreground">{m.opm_orgaotipo || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.opm_status_politicas_publicas || "—"}</TableCell>
                    <TableCell><YesNoBadge value={m.opm_possui_estrutura_ativa} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">Exibindo {Math.min(filtered.length, 80)} de {filtered.length} resultados.</p>
        </CardContent>
      </Card>
    </div>
  );
}
