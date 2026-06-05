import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ShieldAlert, TrendingUp, Skull, Download, Search, Eraser, ArrowUp, ArrowDown } from "lucide-react";
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
import { RiskBadge, AlertBadge, YesNoBadge } from "@/components/risk-badge";
import { exportCsv } from "@/lib/export";
import { getFaixaPopulacional, type FaixaPop } from "@/lib/utils";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export const Route = createFileRoute("/risco")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: RiscoPanel,
});

const RISK_COLORS: Record<string, string> = {
  BAIXO: "oklch(0.65 0.15 150)",
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
  const [sortColumn, setSortColumn] = useState<keyof typeof municipios[0]>("risco_feminicidio_score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filtroKpi, setFiltroKpi] = useState<string | null>(null);

  const handleKpiClick = (filtro: string) => {
    setFiltroKpi(prev => prev === filtro ? null : filtro);
  };

  const handleSort = (col: keyof typeof municipios[0]) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ column }: { column: keyof typeof municipios[0] }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? <ArrowUp className="ml-1 inline h-4 w-4" /> : <ArrowDown className="ml-1 inline h-4 w-4" />;
  };

  const comarcas = useMemo(() => Array.from(new Set(municipios.map((m) => m.comarca).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR')), [municipios]);
  const polos = useMemo(() => Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR')), [municipios]);

  const baseFiltered = useMemo(() => municipios.filter((m) => {
    if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
    if (comarca !== "__all" && m.comarca !== comarca) return false;
    if (polo !== "__all" && m.polo_regional !== polo) return false;
    if (faixaPop !== "__all" && getFaixaPopulacional(m.populacao) !== faixaPop) return false;
    if (nivel !== "__all" && m.risco_feminicidio_nivel !== nivel) return false;
    return true;
  }), [municipios, q, comarca, polo, faixaPop, nivel]);

  const filtered = useMemo(() => baseFiltered.filter((m) => {
    if (filtroKpi === "feminicidios") return m.feminicidios_total_2023_2026 > 0;
    if (filtroKpi === "tentativas") return m.tentativas_total_2023_2026 > 0;
    if (filtroKpi === "ocorrencias") return m.ocorrencias_total_violencia_genero_monitoradas > 0;
    if (filtroKpi === "criticos") return m.painel_alerta_rede === "CRITICO";
    if (filtroKpi === "semOPMcomFem") return m.opm_possui !== "SIM" && m.feminicidios_total_2023_2026 > 0;
    if (filtroKpi === "semCREAScomFem") return m.creas_possui !== "SIM" && m.feminicidios_total_2023_2026 > 0;
    if (filtroKpi === "semAmbosCriticos") return m.opm_possui !== "SIM" && m.creas_possui !== "SIM" && (m.feminicidios_total_2023_2026 > 0 || m.painel_alerta_rede === "CRITICO");
    return true;
  }).sort((a, b) => {
    const valA = a[sortColumn];
    const valB = b[sortColumn];
    if (valA === valB) return 0;
    const modifier = sortDirection === "asc" ? 1 : -1;
    if (typeof valA === "string" && typeof valB === "string") {
      return valA.localeCompare(valB, 'pt-BR') * modifier;
    }
    return ((valA ?? 0) > (valB ?? 0) ? 1 : -1) * modifier;
  }), [baseFiltered, filtroKpi, sortColumn, sortDirection]);

  const total = baseFiltered.length;
  const feminicidios = baseFiltered.reduce((s, m) => s + m.feminicidios_total_2023_2026, 0);
  const tentativas = baseFiltered.reduce((s, m) => s + m.tentativas_total_2023_2026, 0);
  const ocorrencias = baseFiltered.reduce((s, m) => s + m.ocorrencias_total_violencia_genero_monitoradas, 0);
  const criticos = baseFiltered.filter((m) => m.painel_alerta_rede === "CRITICO").length;

  const semOPMcomFem = baseFiltered.filter((m) => m.opm_possui !== "SIM" && m.feminicidios_total_2023_2026 > 0).length;
  const semCREAScomFem = baseFiltered.filter((m) => m.creas_possui !== "SIM" && m.feminicidios_total_2023_2026 > 0).length;
  const semAmbosCriticos = baseFiltered.filter((m) => m.opm_possui !== "SIM" && m.creas_possui !== "SIM" && (m.feminicidios_total_2023_2026 > 0 || m.painel_alerta_rede === "CRITICO")).length;

  const colorFn = (m: any) => {
    if (!m) return "oklch(0.95 0 0)";
    const isFilteredIn = filtered.some(fm => fm.codigo_ibge === m.codigo_ibge);
    if (!isFilteredIn) return "oklch(0.95 0 0)";
    return RISK_COLORS[m.risco_feminicidio_nivel] ?? "oklch(0.95 0 0)";
  };

  const hasFilter = q !== "" || comarca !== "__all" || polo !== "__all" || faixaPop !== "__all" || nivel !== "__all";
  const clearFilters = () => {
    setQ(""); setComarca("__all"); setPolo("__all"); setFaixaPop("__all"); setNivel("__all");
  };

  return (
    <div className="space-y-5">
      {/* 1. Header com Título e Contexto + Filtros */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex flex-col gap-1">
          <h2 className="text-lg font-bold text-foreground">Monitoramento Territorial de Risco</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhamento integrado de indicadores de risco, cobertura da rede de proteção e volume de ocorrências de violência de gênero por município.
          </p>
        </div>
        
        {/* Barra de Filtros compacta */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-3 bg-background/50">
          <div className="relative flex-1 md:max-w-sm">
             <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
             <Input 
                placeholder="Buscar município principal…" 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                className="pl-9 h-9 border-border/60 bg-background focus-visible:ring-1" 
             />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:ml-auto shrink-0">
             <Select value={comarca} onValueChange={setComarca}>
                <SelectTrigger className="w-[180px] border-border/60"><SelectValue placeholder="Comarca" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="__all">Todas as comarcas</SelectItem>
                   {comarcas.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
             </Select>
             <Select value={polo} onValueChange={setPolo}>
                <SelectTrigger className="w-[180px] border-border/60"><SelectValue placeholder="Polo regional" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="__all">Todos os polos</SelectItem>
                   {polos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
             </Select>
             <Select value={faixaPop} onValueChange={(v) => setFaixaPop(v as FaixaPop)}>
                <SelectTrigger className="w-[180px] border-border/60"><SelectValue placeholder="Faixa pop." /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="__all">Todas as faixas</SelectItem>
                   <SelectItem value="ate_5k">Até 5.000 hab.</SelectItem>
                   <SelectItem value="5k_10k">5.001 a 10.000 hab.</SelectItem>
                   <SelectItem value="10k_20k">10.001 a 20.000 hab.</SelectItem>
                   <SelectItem value="acima_20k">Acima de 20.000 hab.</SelectItem>
                </SelectContent>
             </Select>
             <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="w-[150px] border-border/60"><SelectValue placeholder="Nível de risco" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="__all">Todos (risco)</SelectItem>
                   <SelectItem value="BAIXO">Baixo</SelectItem>
                   <SelectItem value="MEDIO">Médio</SelectItem>
                   <SelectItem value="ALTO">Alto</SelectItem>
                   <SelectItem value="CRITICO">Crítico</SelectItem>
                </SelectContent>
             </Select>
             
             {hasFilter && (
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                  <Eraser className="mr-2 h-4 w-4" /> Limpar
                </Button>
             )}
          </div>
        </div>
      </Card>

      {/* 2. KPIs Estratégicos */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
         <KpiCard label="Feminicídios (23-26)" value={feminicidios} icon={Skull} tone="critical" onClick={() => handleKpiClick("feminicidios")} isActive={filtroKpi === "feminicidios"} />
         <KpiCard label="Tentativas (23-26)" value={tentativas} icon={AlertTriangle} tone="warning" onClick={() => handleKpiClick("tentativas")} isActive={filtroKpi === "tentativas"} />
         <KpiCard label="Ocorrências" value={ocorrencias} icon={TrendingUp} tone="primary" onClick={() => handleKpiClick("ocorrencias")} isActive={filtroKpi === "ocorrencias"} />
         <KpiCard label="Alerta crítico" value={criticos} hint={`${pct(criticos, total)} do total`} icon={ShieldAlert} tone="critical" onClick={() => handleKpiClick("criticos")} isActive={filtroKpi === "criticos"} />
         <KpiCard label="S/ OPM c/ Fem." value={semOPMcomFem} tone="critical" onClick={() => handleKpiClick("semOPMcomFem")} isActive={filtroKpi === "semOPMcomFem"} />
         <KpiCard label="S/ CREAS c/ Fem." value={semCREAScomFem} tone="critical" onClick={() => handleKpiClick("semCREAScomFem")} isActive={filtroKpi === "semCREAScomFem"} />
         <KpiCard label="Crítico S/ Rede" value={semAmbosCriticos} tone="critical" onClick={() => handleKpiClick("semAmbosCriticos")} isActive={filtroKpi === "semAmbosCriticos"} />
      </div>

      {/* 3. Mapa e Ranking (2 colunas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <Card className="lg:col-span-1 flex flex-col shadow-sm">
           <CardHeader className="pb-2 relative">
              <ChartHelper>
                <p>
                  Visão consolidada da vulnerabilidade de gênero por território.
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong className="text-foreground/80">Crítico / Alto:</strong> Alerta máximo para subnotificação ou escalada de feminicídios.</li>
                  <li><strong className="text-foreground/80">Médio / Baixo:</strong> Cenário monitorado.</li>
                </ul>
                <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2 text-[11px] md:text-xs">
                  <p className="text-primary-700 dark:text-primary-300 font-medium mb-1.5">
                    O Índice de Risco utiliza um <strong className="font-bold">modelo híbrido ponderado</strong>. Ele corrige a distorção gerada por volumes absolutos altos em grandes cidades, dando 70% de peso à <strong className="font-bold">Taxa Relativa</strong> (por 100 mil) e 30% ao <strong className="font-bold">Volume Absoluto</strong>. A esse cálculo, soma-se o bônus de vulnerabilidade por ausência de OPM e CREAS.
                  </p>
                  <p className="text-primary-700/80 dark:text-primary-300/80 italic">
                    * Nota metodológica: O denominador atual provisório utiliza a População Total do município. O sistema já está preparado arquiteturalmente para migrar para População Feminina assim que os dados estiverem disponíveis na base oficial.
                  </p>
                </div>
              </ChartHelper>
              <CardTitle className="text-base text-foreground pr-8">Distribuição Geográfica do Risco</CardTitle>
           </CardHeader>
           <CardContent className="flex-1 min-h-[650px] md:min-h-[910px] relative p-2 md:p-6">
              <PiauiMap height={850}
                colorFn={colorFn}
                legend={[
                  { label: "Baixo", color: RISK_COLORS.BAIXO },
                  { label: "Médio", color: RISK_COLORS.MEDIO },
                  { label: "Alto", color: RISK_COLORS.ALTO },
                  { label: "Crítico", color: RISK_COLORS.CRITICO },
                  { label: "Fora do filtro", color: "oklch(0.95 0 0)" },
                ]}
              />

              <div className="absolute bottom-8 right-8 w-[270px] h-[250px] rounded-lg border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur-sm pointer-events-auto flex flex-col">
                <p className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Distribuição por risco</p>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Baixo", total: filtered.filter(m => m.risco_feminicidio_nivel === "BAIXO").length, color: RISK_COLORS.BAIXO },
                          { name: "Médio", total: filtered.filter(m => m.risco_feminicidio_nivel === "MEDIO").length, color: RISK_COLORS.MEDIO },
                          { name: "Alto", total: filtered.filter(m => m.risco_feminicidio_nivel === "ALTO").length, color: RISK_COLORS.ALTO },
                          { name: "Crítico", total: filtered.filter(m => m.risco_feminicidio_nivel === "CRITICO").length, color: RISK_COLORS.CRITICO }
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
                          { name: "Baixo", total: filtered.filter(m => m.risco_feminicidio_nivel === "BAIXO").length, color: RISK_COLORS.BAIXO },
                          { name: "Médio", total: filtered.filter(m => m.risco_feminicidio_nivel === "MEDIO").length, color: RISK_COLORS.MEDIO },
                          { name: "Alto", total: filtered.filter(m => m.risco_feminicidio_nivel === "ALTO").length, color: RISK_COLORS.ALTO },
                          { name: "Crítico", total: filtered.filter(m => m.risco_feminicidio_nivel === "CRITICO").length, color: RISK_COLORS.CRITICO }
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
         
         <Card className="lg:col-span-1 flex flex-col shadow-sm overflow-hidden">
           <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 border-b border-border/40 bg-muted/10 relative">
            <ChartHelper><p>
                      Tabela completa contendo a base de cálculo para a formulação do Índice de Qualidade Territorial (IQT).
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong className="text-foreground/80">Variáveis:</strong> Frequência de violência e estrutura.</li>
                      <li><strong className="text-foreground/80">Pesos:</strong> Impactos combinados no território.</li>
                    </ul>
                    <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                      <p className="text-primary-700 dark:text-primary-300 font-medium">
                        Utilize a <strong className="font-bold">exportação de dados</strong> (CSV) para gerar planilhas e cruzar as informações brutas com outros sistemas internos do MPPI.
                      </p>
                    </div></ChartHelper>
            <CardTitle className="text-lg font-bold pr-8">Base Analítica e Exportação</CardTitle>
             <div className="flex items-center gap-2">
               <Button
                 size="sm" variant="outline"
                 onClick={() => exportCsv("risco_feminicidio.csv", filtered.map((m) => ({
                   municipio: m.municipio, codigo_ibge: m.codigo_ibge, polo_regional: m.polo_regional,
                   comarca: m.comarca, populacao: m.populacao,
                   risco: m.risco_feminicidio_nivel, score: m.risco_feminicidio_score,
                   taxa_femi_100k: m.taxa_feminicidios_100k, feminicidios: m.feminicidios_total_2023_2026,
                   taxa_tentativas_100k: m.taxa_tentativas_100k, tentativas: m.tentativas_total_2023_2026,
                   ocorrencias: m.ocorrencias_total_violencia_genero_monitoradas,
                   opm: m.opm_possui, creas: m.creas_possui, alerta: m.painel_alerta_rede,
                   atuacao_prioritaria: m.necessita_atuacao_prioritaria,
                 })))}
               >
                 <Download className="mr-2 h-4 w-4" /> Exportar Base
               </Button>
             </div>
           </CardHeader>
           <CardContent className="flex-1 p-0">
             <div className="h-[650px] md:h-[910px] overflow-auto px-4 py-2">
               <div className="rounded-md border border-border">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('municipio')}>Município <SortIcon column="municipio" /></TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('comarca')}>Comarca <SortIcon column="comarca" /></TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('polo_regional')}>Polo <SortIcon column="polo_regional" /></TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors text-right" onClick={() => handleSort('populacao')}>População <SortIcon column="populacao" /></TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('risco_feminicidio_nivel')}>Risco <SortIcon column="risco_feminicidio_nivel" /></TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors text-right" onClick={() => handleSort('risco_feminicidio_score')}>Score <SortIcon column="risco_feminicidio_score" /></TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors text-right" onClick={() => handleSort('taxa_feminicidios_100k')}>
                          <div className="flex flex-col items-end">
                             <span>Feminicídios <SortIcon column="taxa_feminicidios_100k" /></span>
                             <span className="text-[10px] font-normal opacity-70">Taxa 100k (Abs)</span>
                          </div>
                       </TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors text-right" onClick={() => handleSort('taxa_tentativas_100k')}>
                          <div className="flex flex-col items-end">
                             <span>Tentativas <SortIcon column="taxa_tentativas_100k" /></span>
                             <span className="text-[10px] font-normal opacity-70">Taxa 100k (Abs)</span>
                          </div>
                       </TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('opm_possui')}>OPM <SortIcon column="opm_possui" /></TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('creas_possui')}>CREAS <SortIcon column="creas_possui" /></TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('painel_alerta_rede')}>Alerta <SortIcon column="painel_alerta_rede" /></TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort('necessita_atuacao_prioritaria')}>Prioritária <SortIcon column="necessita_atuacao_prioritaria" /></TableHead>
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
                         <TableCell className="text-right tabular-nums">
                            <span className="font-semibold">{m.taxa_feminicidios_100k}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">({m.feminicidios_total_2023_2026})</span>
                         </TableCell>
                         <TableCell className="text-right tabular-nums">
                            <span className="font-semibold">{m.taxa_tentativas_100k}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">({m.tentativas_total_2023_2026})</span>
                         </TableCell>
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
             </div>
           </CardContent>
         </Card>
      </div>


    </div>
  );
}
