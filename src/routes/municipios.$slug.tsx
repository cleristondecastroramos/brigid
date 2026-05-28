import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Users, Building2, HeartHandshake } from "lucide-react";
import { municipiosQueryOptions } from "@/lib/csv-data";
import { useMunicipios } from "@/lib/useMunicipios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge, AlertBadge, YesNoBadge } from "@/components/risk-badge";
import { KpiCard } from "@/components/kpi-card";

export const Route = createFileRoute("/municipios/$slug")({
  loader: async ({ context, params }) => {
    const all = await context.queryClient.ensureQueryData(municipiosQueryOptions);
    const m = all.find((x) => x.municipio_slug === params.slug);
    if (!m) throw notFound();
    return { slug: params.slug };
  },
  component: MunicipioDetail,
  notFoundComponent: () => (
    <div className="rounded-md border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">Município não encontrado na base oficial.</p>
      <Link to="/municipios" className="mt-3 inline-flex text-sm text-primary hover:underline">Voltar à listagem</Link>
    </div>
  ),
});

function MunicipioDetail() {
  const { slug } = Route.useParams();
  const { data: all } = useMunicipios();
  const m = all.find((x) => x.municipio_slug === slug)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/municipios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Municípios
        </Link>
        <div className="flex items-center gap-2">
          <RiskBadge level={m.risco_feminicidio_nivel} />
          <AlertBadge level={m.painel_alerta_rede} />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ficha territorial</p>
              <h2 className="text-2xl font-semibold text-foreground">{m.municipio}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Código IBGE {m.codigo_ibge} · Comarca {m.comarca} · Polo {m.polo_regional}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="População" value={m.populacao.toLocaleString("pt-BR")} icon={Users} tone="primary" />
        <KpiCard label="Score de risco" value={m.risco_feminicidio_score} hint={m.risco_feminicidio_nivel} tone={m.risco_feminicidio_nivel === "CRITICO" ? "critical" : "default"} />
        <KpiCard label="Feminicídios 2023–26" value={m.feminicidios_total_2023_2026} tone="critical" />
        <KpiCard label="Tentativas 2023–26" value={m.tentativas_total_2023_2026} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Organismo de Políticas para Mulheres</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Possui OPM" v={<YesNoBadge value={m.opm_possui} />} />
            <Row k="Status políticas públicas" v={m.opm_status_politicas_publicas || "—"} />
            <Row k="Tipologia" v={m.opm_orgaotipo || "—"} />
            <Row k="Estrutura ativa" v={<YesNoBadge value={m.opm_possui_estrutura_ativa} />} />
            <Row k="Prioridade fomento OPM" v={m.prioridade_fomento_opm || "—"} />
            <Row k="Fonte" v={<span className="text-muted-foreground">{m.fonte_base_opm}</span>} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><HeartHandshake className="h-4 w-4" /> CREAS</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row k="Possui CREAS" v={<YesNoBadge value={m.creas_possui} />} />
            <Row k="Status" v={m.creas_status || "—"} />
            <Row k="Ausente" v={<YesNoBadge value={m.creas_ausente} positiveIsGood={false} />} />
            <Row k="Prioridade implantação CREAS" v={m.prioridade_implantacao_creas || "—"} />
            <Row k="Fonte" v={<span className="text-muted-foreground">{m.fonte_base_creas}</span>} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Indicadores de violência de gênero e risco</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <Row k="Consumados 2023" v={m.consumado_2023} />
              <Row k="Consumados 2024" v={m.consumado_2024} />
              <Row k="Consumados 2025" v={m.consumado_2025} />
              <Row k="Consumados 2026" v={m.consumado_2026} />
              <Row k="Total consumados" v={<strong>{m.feminicidios_total_2023_2026}</strong>} />
            </div>
            <div className="space-y-2 text-sm">
              <Row k="Tentados 2023" v={m.tentado_2023} />
              <Row k="Tentados 2024" v={m.tentado_2024} />
              <Row k="Tentados 2025" v={m.tentado_2025} />
              <Row k="Tentados 2026" v={m.tentado_2026} />
              <Row k="Total tentativas" v={<strong>{m.tentativas_total_2023_2026}</strong>} />
            </div>
            <div className="md:col-span-2 space-y-2 text-sm border-t border-border pt-3">
              <Row k="Ocorrências monitoradas" v={m.ocorrencias_total_violencia_genero_monitoradas} />
              <Row k="Tem feminicídio consumado" v={<YesNoBadge value={m.indicador_tem_feminicidio_consumado} positiveIsGood={false} />} />
              <Row k="Tem tentativa" v={<YesNoBadge value={m.indicador_tem_tentativa_feminicidio} positiveIsGood={false} />} />
              <Row k="Alerta da rede" v={<AlertBadge level={m.painel_alerta_rede} />} />
              <Row k="Necessita atuação prioritária" v={<YesNoBadge value={m.necessita_atuacao_prioritaria} positiveIsGood={false} />} />
              <Row k="Última atualização" v={<span className="text-muted-foreground">{m.ultima_atualizacao_referencia}</span>} />
              {m.observacoes_sistema && <Row k="Observações" v={<span className="text-muted-foreground">{m.observacoes_sistema}</span>} />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-1.5 last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{k}</span>
      <span className="text-sm text-foreground">{v}</span>
    </div>
  );
}
