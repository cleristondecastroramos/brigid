import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ShieldAlert, TrendingUp, Skull, Download, Search, Eraser, ArrowUp, ArrowDown } from "lucide-react";
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

  const comarcas = useMemo(() => Array.from(new Set(municipios.map((m) => m.comarca).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b, 'pt-BR'), 'pt-BR')), [municipios]);
  const polos = useMemo(() => Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b, 'pt-BR'), 'pt-BR')), [municipios]);

  const filtered = useMemo(() => municipios.filter((m) => {
    if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
    if (comarca !== "__all" && m.comarca !== comarca) return false;
    if (polo !== "__all" && m.polo_regional !== polo) return false;
    if (faixaPop !== "__all" && getFaixaPopulacional(m.populacao) !== faixaPop) return false;
    if (nivel !== "__all" && m.risco_feminicidio_nivel !== nivel) return false;
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
  }), [municipios, q, comarca, polo, faixaPop, nivel, sortColumn, sortDirection]);

  const total = filtered.length;
  const feminicidios = filtered.reduce((s, m) => s + m.feminicidios_total_2023_2026, 0);
  const tentativas = filtered.reduce((s, m) => s + m.tentativas_total_2023_2026, 0);
  const ocorrencias = filtered.reduce((s, m) => s + m.ocorrencias_total_violencia_genero_monitoradas, 0);
  const criticos = filtered.filter((m) => m.painel_alerta_rede === "CRITICO").length;

  const semOPMcomFem = filtered.filter((m) => m.opm_possui !== "SIM" && m.feminicidios_total_2023_2026 > 0).length;
  const semCREAScomFem = filtered.filter((m) => m.creas_possui !== "SIM" && m.feminicidios_total_2023_2026 > 0).length;
  const semAmbosCriticos = filtered.filter((m) => m.opm_possui !== "SIM" && m.creas_possui !== "SIM" && (m.feminicidios_total_2023_2026 > 0 || m.painel_alerta_rede === "CRITICO")).length;

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
         <KpiCard label="Feminicídios (23-26)" value={feminicidios} icon={Skull} tone="critical" />
         <KpiCard label="Tentativas (23-26)" value={tentativas} icon={AlertTriangle} tone="warning" />
         <KpiCard label="Ocorrências" value={ocorrencias} icon={TrendingUp} tone="primary" />
         <KpiCard label="Alerta crítico" value={criticos} hint={`${pct(criticos, total)} do total`} icon={ShieldAlert} tone="critical" />
         <KpiCard label="S/ OPM c/ Fem." value={semOPMcomFem} tone="critical" />
         <KpiCard label="S/ CREAS c/ Fem." value={semCREAScomFem} tone="critical" />
         <KpiCard label="Crítico S/ Rede" value={semAmbosCriticos} tone="critical" />
      </div>

      {/* 3. Mapa e Ranking (2 colunas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <Card className="lg:col-span-1 flex flex-col shadow-sm">
           <CardHeader className="pb-0 border-b-0">
             <div className="flex flex-col gap-1">
               <CardTitle className="text-base text-foreground">Distribuição Geográfica do Risco</CardTitle>
               <p className="text-xs text-muted-foreground">
                 Visualização territorial dos níveis de risco de feminicídio com base nos indicadores da rede.
               </p>
             </div>
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
           </CardContent>
         </Card>
         
         <Card className="lg:col-span-1 flex flex-col shadow-sm overflow-hidden">
           <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3 border-b border-border/40 bg-muted/10">
             <CardTitle className="text-lg font-bold">Base Analítica e Exportação</CardTitle>
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
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors text-right" onClick={() => handleSort('feminicidios_total_2023_2026')}>Feminicídios <SortIcon column="feminicidios_total_2023_2026" /></TableHead>
                       <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors text-right" onClick={() => handleSort('tentativas_total_2023_2026')}>Tentativas <SortIcon column="tentativas_total_2023_2026" /></TableHead>
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
             </div>
           </CardContent>
         </Card>
      </div>


    </div>
  );
}
