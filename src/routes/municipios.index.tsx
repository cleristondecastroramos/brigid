import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { municipiosQueryOptions } from "@/lib/csv-data";
import { useMunicipios } from "@/lib/useMunicipios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge, AlertBadge, YesNoBadge } from "@/components/risk-badge";
import { exportCsv } from "@/lib/export";

export const Route = createFileRoute("/municipios/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: MunicipiosList,
});

function MunicipiosList() {
  const { data: municipios } = useMunicipios();
  const [q, setQ] = useState("");
  const [polo, setPolo] = useState("__all");
  const [risco, setRisco] = useState("__all");
  const [sortColumn, setSortColumn] = useState<keyof typeof municipios[0]>("municipio");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const polos = useMemo(() => Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'pt-BR')), [municipios]);

  const filtered = useMemo(() => {
    let result = municipios.filter((m) => {
      if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
      if (polo !== "__all" && m.polo_regional !== polo) return false;
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
  }, [municipios, q, polo, risco, sortColumn, sortDirection]);

  const handleSort = (column: keyof typeof municipios[0]) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: keyof typeof municipios[0] }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4 inline" /> : <ChevronDown className="ml-1 h-4 w-4 inline" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Municípios do Piauí — {municipios.length} no universo</CardTitle>
          <Button size="sm" variant="outline" onClick={() => exportCsv("municipios.csv", filtered)}>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Buscar município…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={polo} onValueChange={setPolo}>
              <SelectTrigger><SelectValue placeholder="Polo regional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os polos</SelectItem>
                {polos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={risco} onValueChange={setRisco}>
              <SelectTrigger><SelectValue placeholder="Nível de risco" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os níveis</SelectItem>
                <SelectItem value="BAIXO">Baixo</SelectItem>
                <SelectItem value="MEDIO">Médio</SelectItem>
                <SelectItem value="ALTO">Alto</SelectItem>
                <SelectItem value="CRITICO">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort("municipio")}>Município <SortIcon column="municipio" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort("comarca")}>Comarca <SortIcon column="comarca" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort("polo_regional")}>Polo <SortIcon column="polo_regional" /></TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort("populacao")}>População <SortIcon column="populacao" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort("opm_possui")}>OPM <SortIcon column="opm_possui" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort("creas_possui")}>CREAS <SortIcon column="creas_possui" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort("risco_feminicidio_score")}>Risco <SortIcon column="risco_feminicidio_score" /></TableHead>
                  <TableHead className="cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => handleSort("painel_alerta_rede")}>Alerta <SortIcon column="painel_alerta_rede" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 120).map((m) => (
                  <TableRow key={m.codigo_ibge}>
                    <TableCell>
                      <Link to="/municipios/$slug" params={{ slug: m.municipio_slug }} className="font-medium text-foreground hover:underline">
                        {m.municipio}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.comarca}</TableCell>
                    <TableCell className="text-muted-foreground">{m.polo_regional}</TableCell>
                    <TableCell className="text-right tabular-nums">{m.populacao.toLocaleString("pt-BR")}</TableCell>
                    <TableCell><YesNoBadge value={m.opm_possui} /></TableCell>
                    <TableCell><YesNoBadge value={m.creas_possui} /></TableCell>
                    <TableCell><RiskBadge level={m.risco_feminicidio_nivel} /></TableCell>
                    <TableCell><AlertBadge level={m.painel_alerta_rede} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">Exibindo {Math.min(filtered.length, 120)} de {filtered.length}.</p>
        </CardContent>
      </Card>
    </div>
  );
}
