import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Building2, HeartHandshake, AlertTriangle, MapPin, ShieldAlert, TrendingUp,
} from "lucide-react";
import { municipiosQueryOptions, pct } from "@/lib/csv-data";
import { KpiCard } from "@/components/kpi-card";
import { PiauiMap } from "@/components/piaui-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge, AlertBadge } from "@/components/risk-badge";
import { Link } from "@tanstack/react-router";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: Dashboard,
});

const RISK_COLORS: Record<string, string> = {
  BAIXO: "oklch(0.7 0.12 160)",
  MEDIO: "oklch(0.75 0.15 85)",
  ALTO: "oklch(0.65 0.18 45)",
  CRITICO: "oklch(0.55 0.22 27)",
};

function Dashboard() {
  const { data: municipios } = useSuspenseQuery(municipiosQueryOptions);

  const total = municipios.length;
  const comOPM = municipios.filter((m) => m.opm_possui === "SIM").length;
  const comCREAS = municipios.filter((m) => m.creas_possui === "SIM").length;
  const alertaCritico = municipios.filter((m) => m.painel_alerta_rede === "CRITICO").length;
  const prioritarios = municipios.filter((m) => m.necessita_atuacao_prioritaria === "SIM").length;
  const semAmbos = municipios.filter((m) => m.opm_possui !== "SIM" && m.creas_possui !== "SIM").length;

  const riskDist = ["BAIXO", "MEDIO", "ALTO", "CRITICO"].map((nivel) => ({
    nivel,
    total: municipios.filter((m) => m.risco_feminicidio_nivel === nivel).length,
  }));

  const ranking = [...municipios]
    .sort((a, b) => (b.risco_feminicidio_score - a.risco_feminicidio_score) || (b.feminicidios_total_2023_2026 - a.feminicidios_total_2023_2026))
    .slice(0, 8);

  const colorFn = (m: any) => {
    if (!m) return "oklch(0.92 0.01 230)";
    return RISK_COLORS[m.risco_feminicidio_nivel] ?? "oklch(0.85 0.01 230)";
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-2xl font-semibold tracking-[0.16em] text-foreground">BRIGID</h2>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Base de Referência Integrada para Gestão, Inteligência e Dados
          </span>
        </div>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground">
          O <span className="font-medium text-foreground">BRIGID</span> consolida as informações estratégicas do
          Projeto Feminicídio Zero, apoia o monitoramento territorial da rede de proteção e fortalece a atuação
          institucional do Ministério Público do Estado do Piauí com base em evidências, integrando cobertura de
          OPMs e CREAS, indicadores de risco e instrumentos de gestão estratégica.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Municípios" value={total} hint="Universo do Piauí" icon={MapPin} tone="primary" />
        <KpiCard label="Com OPM" value={comOPM} hint={`Cobertura ${pct(comOPM, total)}`} icon={Building2} tone="success" />
        <KpiCard label="Com CREAS" value={comCREAS} hint={`Cobertura ${pct(comCREAS, total)}`} icon={HeartHandshake} tone="success" />
        <KpiCard label="Sem OPM nem CREAS" value={semAmbos} hint={pct(semAmbos, total)} icon={ShieldAlert} tone="critical" />
        <KpiCard label="Alerta crítico" value={alertaCritico} hint="Painel da rede" icon={AlertTriangle} tone="critical" />
        <KpiCard label="Atuação prioritária" value={prioritarios} hint={pct(prioritarios, total)} icon={TrendingUp} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mapa do Piauí — Risco de Feminicídio</CardTitle>
          </CardHeader>
          <CardContent>
            <PiauiMap
              colorFn={colorFn}
              legend={[
                { label: "Baixo", color: RISK_COLORS.BAIXO },
                { label: "Médio", color: RISK_COLORS.MEDIO },
                { label: "Alto", color: RISK_COLORS.ALTO },
                { label: "Crítico", color: RISK_COLORS.CRITICO },
                { label: "Sem dado", color: "oklch(0.92 0.01 230)" },
              ]}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Distribuição por risco</CardTitle></CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="nivel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Municípios prioritários</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ranking.map((m) => (
                <Link
                  key={m.codigo_ibge}
                  to="/municipios/$slug"
                  params={{ slug: m.municipio_slug }}
                  className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2 text-sm hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{m.municipio}</p>
                    <p className="text-xs text-muted-foreground">{m.polo_regional} · score {m.risco_feminicidio_score}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <RiskBadge level={m.risco_feminicidio_nivel} />
                    <AlertBadge level={m.painel_alerta_rede} />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
