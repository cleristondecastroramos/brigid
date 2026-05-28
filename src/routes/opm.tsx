import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Download, Building2 } from "lucide-react";
import { municipiosQueryOptions, pct } from "@/lib/csv-data";
import { KpiCard } from "@/components/kpi-card";
import { PiauiMap } from "@/components/piaui-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { YesNoBadge } from "@/components/risk-badge";
import { exportCsv } from "@/lib/export";

export const Route = createFileRoute("/opm")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: OpmPanel,
});

const COLOR_WITH = "oklch(0.55 0.12 195)";
const COLOR_WITHOUT = "oklch(0.65 0.2 27)";
const COLOR_NA = "oklch(0.92 0.01 230)";

function OpmPanel() {
  const { data: municipios } = useSuspenseQuery(municipiosQueryOptions);
  const [q, setQ] = useState("");
  const [polo, setPolo] = useState("__all");
  const [status, setStatus] = useState("__all");
  const [tipo, setTipo] = useState("__all");

  const polos = useMemo(() => Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort(), [municipios]);
  const tipos = useMemo(() => Array.from(new Set(municipios.map((m) => m.opm_orgaotipo).filter(Boolean))).sort(), [municipios]);

  const filtered = useMemo(() => municipios.filter((m) => {
    if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
    if (polo !== "__all" && m.polo_regional !== polo) return false;
    if (status !== "__all" && m.opm_possui !== status) return false;
    if (tipo !== "__all" && m.opm_orgaotipo !== tipo) return false;
    return true;
  }), [municipios, q, polo, status, tipo]);

  const total = municipios.length;
  const com = municipios.filter((m) => m.opm_possui === "SIM").length;
  const sem = total - com;
  const ativa = municipios.filter((m) => m.opm_possui_estrutura_ativa === "SIM").length;

  const semList = municipios.filter((m) => m.opm_possui !== "SIM");

  const colorFn = (m: any) => !m ? COLOR_NA : m.opm_possui === "SIM" ? COLOR_WITH : COLOR_WITHOUT;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Municípios" value={total} icon={Building2} tone="primary" />
        <KpiCard label="Com OPM" value={com} hint={pct(com, total)} tone="success" />
        <KpiCard label="Sem OPM" value={sem} hint={pct(sem, total)} tone="critical" />
        <KpiCard label="Estrutura ativa" value={ativa} hint={pct(ativa, total)} tone="warning" />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Cobertura territorial de OPMs</CardTitle></CardHeader>
        <CardContent>
          <PiauiMap
            colorFn={colorFn}
            legend={[
              { label: "Com OPM", color: COLOR_WITH },
              { label: "Sem OPM", color: COLOR_WITHOUT },
              { label: "Sem dado", color: COLOR_NA },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">Municípios — detalhamento</CardTitle>
          <Button
            size="sm" variant="outline"
            onClick={() => exportCsv("municipios_sem_opm.csv", semList.map((m) => ({
              municipio: m.municipio, codigo_ibge: m.codigo_ibge, polo_regional: m.polo_regional,
              comarca: m.comarca, populacao: m.populacao, prioridade: m.prioridade_fomento_opm,
              risco: m.risco_feminicidio_nivel, alerta: m.painel_alerta_rede,
            })))}
          >
            <Download className="mr-2 h-4 w-4" /> Exportar municípios sem OPM
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <Input placeholder="Buscar município…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={polo} onValueChange={setPolo}>
              <SelectTrigger><SelectValue placeholder="Polo regional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os polos</SelectItem>
                {polos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os status</SelectItem>
                <SelectItem value="SIM">Com OPM</SelectItem>
                <SelectItem value="NAO">Sem OPM</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue placeholder="Tipologia" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todas as tipologias</SelectItem>
                {tipos.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Município</TableHead>
                  <TableHead>Polo</TableHead>
                  <TableHead>OPM</TableHead>
                  <TableHead>Tipologia</TableHead>
                  <TableHead>Estrutura ativa</TableHead>
                  <TableHead>Prioridade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 80).map((m) => (
                  <TableRow key={m.codigo_ibge}>
                    <TableCell>
                      <Link to="/municipios/$slug" params={{ slug: m.municipio_slug }} className="font-medium text-foreground hover:underline">
                        {m.municipio}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.polo_regional}</TableCell>
                    <TableCell><YesNoBadge value={m.opm_possui} /></TableCell>
                    <TableCell className="text-muted-foreground">{m.opm_orgaotipo || "—"}</TableCell>
                    <TableCell><YesNoBadge value={m.opm_possui_estrutura_ativa} /></TableCell>
                    <TableCell className="text-muted-foreground">{m.prioridade_fomento_opm || "—"}</TableCell>
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
