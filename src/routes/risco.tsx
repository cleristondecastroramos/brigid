import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, ShieldAlert, TrendingUp, Skull, Download } from "lucide-react";
import { municipiosQueryOptions, pct } from "@/lib/csv-data";
import { KpiCard } from "@/components/kpi-card";
import { PiauiMap } from "@/components/piaui-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiskBadge, AlertBadge, YesNoBadge } from "@/components/risk-badge";
import { exportCsv } from "@/lib/export";

export const Route = createFileRoute("/risco")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: RiscoPanel,
});

const RISK_COLORS: Record<string, string> = {
  BAIXO: "oklch(0.7 0.12 160)",
  MEDIO: "oklch(0.75 0.15 85)",
  ALTO: "oklch(0.65 0.18 45)",
  CRITICO: "oklch(0.55 0.22 27)",
};

function RiscoPanel() {
  const { data: municipios } = useSuspenseQuery(municipiosQueryOptions);
  const [nivel, setNivel] = useState("__all");

  const total = municipios.length;
  const feminicidios = municipios.reduce((s, m) => s + m.feminicidios_total_2023_2026, 0);
  const tentativas = municipios.reduce((s, m) => s + m.tentativas_total_2023_2026, 0);
  const ocorrencias = municipios.reduce((s, m) => s + m.ocorrencias_total_violencia_genero_monitoradas, 0);
  const criticos = municipios.filter((m) => m.painel_alerta_rede === "CRITICO").length;

  const semOPMcomFem = municipios.filter((m) => m.opm_possui !== "SIM" && m.feminicidios_total_2023_2026 > 0).length;
  const semCREAScomFem = municipios.filter((m) => m.creas_possui !== "SIM" && m.feminicidios_total_2023_2026 > 0).length;
  const semAmbosCriticos = municipios.filter((m) => m.opm_possui !== "SIM" && m.creas_possui !== "SIM" && (m.feminicidios_total_2023_2026 > 0 || m.painel_alerta_rede === "CRITICO")).length;

  const filtered = useMemo(() => municipios.filter((m) =>
    nivel === "__all" || m.risco_feminicidio_nivel === nivel
  ).sort((a, b) => b.risco_feminicidio_score - a.risco_feminicidio_score), [municipios, nivel]);

  const colorFn = (m: any) => !m ? "oklch(0.92 0.01 230)" : (RISK_COLORS[m.risco_feminicidio_nivel] ?? "oklch(0.85 0.01 230)");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Feminicídios 2023–2026" value={feminicidios} icon={Skull} tone="critical" />
        <KpiCard label="Tentativas 2023–2026" value={tentativas} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Ocorrências monitoradas" value={ocorrencias} icon={TrendingUp} tone="primary" />
        <KpiCard label="Municípios em alerta crítico" value={criticos} hint={pct(criticos, total)} icon={ShieldAlert} tone="critical" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <KpiCard label="Sem OPM × com feminicídio" value={semOPMcomFem} tone="critical" />
        <KpiCard label="Sem CREAS × com feminicídio" value={semCREAScomFem} tone="critical" />
        <KpiCard label="Sem OPM e sem CREAS (críticos)" value={semAmbosCriticos} tone="critical" />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Mapa por faixa de risco</CardTitle></CardHeader>
        <CardContent>
          <PiauiMap
            colorFn={colorFn}
            legend={[
              { label: "Baixo", color: RISK_COLORS.BAIXO },
              { label: "Médio", color: RISK_COLORS.MEDIO },
              { label: "Alto", color: RISK_COLORS.ALTO },
              { label: "Crítico", color: RISK_COLORS.CRITICO },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">Ranking de municípios prioritários</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={nivel} onValueChange={setNivel}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Nível de risco" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Todos os níveis</SelectItem>
                <SelectItem value="BAIXO">Baixo</SelectItem>
                <SelectItem value="MEDIO">Médio</SelectItem>
                <SelectItem value="ALTO">Alto</SelectItem>
                <SelectItem value="CRITICO">Crítico</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm" variant="outline"
              onClick={() => exportCsv("risco_feminicidio.csv", filtered.map((m) => ({
                municipio: m.municipio, codigo_ibge: m.codigo_ibge, polo_regional: m.polo_regional,
                risco: m.risco_feminicidio_nivel, score: m.risco_feminicidio_score,
                feminicidios: m.feminicidios_total_2023_2026, tentativas: m.tentativas_total_2023_2026,
                ocorrencias: m.ocorrencias_total_violencia_genero_monitoradas,
                opm: m.opm_possui, creas: m.creas_possui, alerta: m.painel_alerta_rede,
                atuacao_prioritaria: m.necessita_atuacao_prioritaria,
              })))}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Município</TableHead>
                  <TableHead>Polo</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Feminicídios</TableHead>
                  <TableHead className="text-right">Tentativas</TableHead>
                  <TableHead>OPM</TableHead>
                  <TableHead>CREAS</TableHead>
                  <TableHead>Alerta</TableHead>
                  <TableHead>Prioritária</TableHead>
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
                    <TableCell className="text-muted-foreground">{m.polo_regional}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
