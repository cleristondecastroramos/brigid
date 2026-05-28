import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Building2, Search, Eraser, AlertCircle } from "lucide-react";
import { municipiosQueryOptions, pct } from "@/lib/csv-data";
import { useMunicipios } from "@/lib/useMunicipios";
import { KpiCard } from "@/components/kpi-card";
import { PiauiMap } from "@/components/piaui-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { YesNoBadge } from "@/components/risk-badge";
import { exportCsv } from "@/lib/export";
import { getFaixaPopulacional, type FaixaPop } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from "recharts";

export const Route = createFileRoute("/opm")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: OpmPanel,
});

const COLOR_WITH = "oklch(0.55 0.12 195)";
const COLOR_WITHOUT = "oklch(0.65 0.2 27)";
const COLOR_PENDING = "oklch(0.75 0.15 85)";
const COLOR_NA = "oklch(0.92 0.01 230)";

function OpmPanel() {
  const { data: municipios } = useMunicipios();
  const [q, setQ] = useState("");
  const [comarca, setComarca] = useState("__all");
  const [polo, setPolo] = useState("__all");
  const [faixaPop, setFaixaPop] = useState<FaixaPop>("__all");
  const [status, setStatus] = useState("__all");
  const [tipo, setTipo] = useState("__all");

  const comarcas = useMemo(() => Array.from(new Set(municipios.map((m) => m.comarca).filter(Boolean))).sort(), [municipios]);
  const polos = useMemo(() => Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort(), [municipios]);
  const tipos = useMemo(() => Array.from(new Set(municipios.map((m) => m.opm_orgaotipo).filter(Boolean))).sort(), [municipios]);

  const filtered = useMemo(() => municipios.filter((m) => {
    if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
    if (comarca !== "__all" && m.comarca !== comarca) return false;
    if (polo !== "__all" && m.polo_regional !== polo) return false;
    if (faixaPop !== "__all" && getFaixaPopulacional(m.populacao) !== faixaPop) return false;
    if (status !== "__all" && m.opm_possui !== status) return false;
    if (tipo !== "__all" && m.opm_orgaotipo !== tipo) return false;
    return true;
  }), [municipios, q, comarca, polo, faixaPop, status, tipo]);

  const total = filtered.length;
  const com = filtered.filter((m) => m.opm_possui === "SIM").length;
  const sem = filtered.filter((m) => m.opm_possui === "NAO").length;
  const pendentes = filtered.filter((m) => m.opm_possui === "SIM" && m.opm_orgaotipo === "A_VERIFICAR_DETALHE").length;

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
        <KpiCard label="Municípios (Recorte)" value={total} hint={hasFilter ? "Filtrado" : "Universo"} icon={Building2} tone="primary" />
        <KpiCard label="Com OPM" value={com} hint={pct(com, total)} tone="success" />
        <KpiCard label="Sem OPM" value={sem} hint={pct(sem, total)} tone="critical" />
        <KpiCard label="Cobertura Total" value={pct(com, total)} tone="primary" />
        <KpiCard label="Pendente Detalhamento" value={pendentes} hint="Tipologia a verificar" tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Cobertura territorial de OPMs</CardTitle></CardHeader>
          <CardContent>
            <PiauiMap
              colorFn={colorFn}
              legend={[
                { label: "Com OPM (Qualificado)", color: COLOR_WITH },
                { label: "Com OPM (Pendente Detalhe)", color: COLOR_PENDING },
                { label: "Sem OPM", color: COLOR_WITHOUT },
                { label: "Fora do filtro", color: COLOR_NA },
              ]}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Distribuição por Tipologia</CardTitle></CardHeader>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-destructive flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5" /> Déficit (Sem OPM)
            </CardTitle>
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">{sem} municípios</span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {semList.length > 0 ? semList.map(m => (
                <Link key={m.codigo_ibge} to="/municipios/$slug" params={{ slug: m.municipio_slug }} className="inline-flex items-center rounded-full border border-destructive/20 bg-background px-2.5 py-0.5 text-xs font-medium hover:bg-destructive/10 transition-colors">
                  {m.municipio}
                </Link>
              )) : <span className="text-sm text-muted-foreground">Nenhum município nesta condição.</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning bg-warning/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-warning-foreground flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5" /> Pendente de Detalhamento
            </CardTitle>
            <span className="rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">{pendentes} municípios</span>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Municípios que informaram possuir OPM, mas a tipologia (Secretaria, Coordenadoria, etc.) ainda não foi qualificada.</p>
            <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
              {pendentesList.length > 0 ? pendentesList.map(m => (
                <Link key={m.codigo_ibge} to="/municipios/$slug" params={{ slug: m.municipio_slug }} className="inline-flex items-center rounded-full border border-warning/30 bg-background px-2.5 py-0.5 text-xs font-medium hover:bg-warning/20 transition-colors">
                  {m.municipio}
                </Link>
              )) : <span className="text-sm text-muted-foreground">Nenhum município nesta condição.</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">Municípios — detalhamento</CardTitle>
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
                  <TableHead>Município</TableHead>
                  <TableHead>Comarca</TableHead>
                  <TableHead>Polo</TableHead>
                  <TableHead className="text-right">População</TableHead>
                  <TableHead>OPM</TableHead>
                  <TableHead>Tipologia</TableHead>
                  <TableHead>Políticas Efetivas</TableHead>
                  <TableHead>Estrutura Ativa</TableHead>
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
