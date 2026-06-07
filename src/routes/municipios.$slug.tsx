import { useMemo } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Users, Building2, HeartHandshake, Download, Printer, ShieldAlert, BarChart3, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { municipiosQueryOptions } from "@/lib/csv-data";
import { useMunicipios } from "@/lib/useMunicipios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge, AlertBadge, YesNoBadge } from "@/components/risk-badge";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { exportPdf } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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

// Funções de normalização para o Radar Chart
const parseAlertToNum = (level: string) => {
  if (level === "CRITICO") return 100;
  if (level === "ALTO") return 75;
  if (level === "ATENCAO") return 40;
  return 0; // NORMAL
};

function MunicipioDetail() {
  const { slug } = Route.useParams();
  const { data: all } = useMunicipios();
  const m = all.find((x) => x.municipio_slug === slug)!;

  // Cálculos dinâmicos
  const poloMunicipios = useMemo(() => all.filter(x => x.polo_regional === m.polo_regional), [all, m.polo_regional]);
  
  // Raking e Maximos
  const stateRank = useMemo(() => [...all].sort((a,b) => b.risco_feminicidio_score - a.risco_feminicidio_score).findIndex(x => x.codigo_ibge === m.codigo_ibge) + 1, [all, m]);
  const poloRank = useMemo(() => [...poloMunicipios].sort((a,b) => b.risco_feminicidio_score - a.risco_feminicidio_score).findIndex(x => x.codigo_ibge === m.codigo_ibge) + 1, [poloMunicipios, m]);

  const maxRisco = Math.max(...all.map(x => x.risco_feminicidio_score));
  const maxConsumado = Math.max(...all.map(x => x.feminicidios_consumados_2023_2025));
  const maxTentativa = Math.max(...all.map(x => x.feminicidios_tentados_2023_2025));

  // Função para compilar as pontuações do Radar (Município, Média Polo, Média Estado)
  const compileRadarData = (source: typeof m | (typeof m)[]) => {
    const isArr = Array.isArray(source);
    const getAvg = (fn: (x: typeof m) => number) => isArr ? (source.reduce((acc, x) => acc + fn(x), 0) / source.length) : fn(source as typeof m);
    
    return {
      cobertura_opm: getAvg(x => x.opm_possui === "SIM" ? 100 : 0),
      cobertura_creas: getAvg(x => x.creas_possui === "SIM" ? 100 : 0),
      risco: getAvg(x => (x.risco_feminicidio_score / maxRisco) * 100),
      violencia: getAvg(x => maxConsumado > 0 ? (x.feminicidios_consumados_2023_2025 / maxConsumado) * 100 : 0),
      alerta: getAvg(x => parseAlertToNum(x.painel_alerta_rede))
    };
  };

  const radarM = compileRadarData(m);
  const radarPolo = compileRadarData(poloMunicipios);
  const radarState = compileRadarData(all);

  const radarData = [
    { dim: "OPM", Mun: radarM.cobertura_opm, Polo: radarPolo.cobertura_opm, Estado: radarState.cobertura_opm },
    { dim: "CREAS", Mun: radarM.cobertura_creas, Polo: radarPolo.cobertura_creas, Estado: radarState.cobertura_creas },
    { dim: "Violência (Feminicídios)", Mun: radarM.violencia, Polo: radarPolo.violencia, Estado: radarState.violencia },
    { dim: "Criticidade (Risco)", Mun: radarM.risco, Polo: radarPolo.risco, Estado: radarState.risco },
    { dim: "Alerta de Rede", Mun: radarM.alerta, Polo: radarPolo.alerta, Estado: radarState.alerta },
  ];

  const chartData = [
    { year: "2023", consumados: m.consumado_2023, tentados: m.tentado_2023 },
    { year: "2024", consumados: m.consumado_2024, tentados: m.tentado_2024 },
    { year: "2025", consumados: m.consumado_2025, tentados: m.tentado_2025 },
    { year: "2026", consumados: m.consumado_2026, tentados: m.tentado_2026 },
  ];

  // Export PDF Handler
  const handleExportFicha = () => {
    const tableData = [
      { param: "População Geral", val: m.populacao.toString() },
      { param: "Risco Score", val: m.risco_feminicidio_score.toString() },
      { param: "Posição no Estado", val: `${stateRank}º de ${all.length}` },
      { param: "Feminicídios", val: m.feminicidios_consumados_2023_2025.toString() },
      { param: "Possui OPM", val: m.opm_possui },
      { param: "Possui CREAS", val: m.creas_possui },
    ];
    exportPdf(`ficha_${m.municipio_slug}.pdf`, `Ficha Territorial: ${m.municipio}`, tableData, {
      subtitle: `IBGE: ${m.codigo_ibge} | Polo: ${m.polo_regional}`
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. CABEÇALHO DA FICHA */}
      <div className="space-y-4">
        <Link to="/municipios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" /> Voltar para a Base Territorial
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-border/50">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              <MapPin className="h-3.5 w-3.5" /> Ficha Territorial Executiva
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">{m.municipio}</h1>
            <p className="text-lg text-muted-foreground font-medium flex flex-wrap gap-2 items-center">
              <span>IBGE: {m.codigo_ibge}</span>
              <span className="text-border">•</span>
              <span>Comarca: {m.comarca}</span>
              <span className="text-border">•</span>
              <span>Polo Regional: {m.polo_regional}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-lg border border-border/50">
              <RiskBadge level={m.risco_feminicidio_nivel} />
              <AlertBadge level={m.painel_alerta_rede} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="shadow-sm">
                  <Download className="mr-2 h-4 w-4" /> Ações da Ficha
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportFicha}>
                  <Download className="mr-2 h-4 w-4 text-muted-foreground" /> Exportar Ficha (PDF)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4 text-muted-foreground" /> Imprimir Ficha Analítica
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 2. KPIs EXECUTIVOS */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Métricas Chave</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card className="col-span-2 shadow-sm bg-background border-border/60">
            <CardHeader className="p-4 pb-0"><CardTitle className="text-xs font-medium text-muted-foreground">População Total</CardTitle></CardHeader>
            <CardContent className="p-4 pt-1"><div className="text-2xl font-bold tabular-nums">{m.populacao.toLocaleString("pt-BR")}</div></CardContent>
          </Card>
          <Card className="col-span-2 shadow-sm bg-background border-border/60">
            <CardHeader className="p-4 pb-0"><CardTitle className="text-xs font-medium text-muted-foreground">População Feminina</CardTitle></CardHeader>
            <CardContent className="p-4 pt-1"><div className="text-2xl font-bold tabular-nums">{(m.populacao_feminina || 0).toLocaleString("pt-BR")}</div></CardContent>
          </Card>
          <Card className={`col-span-2 shadow-sm border ${m.risco_feminicidio_nivel === "CRITICO" || m.risco_feminicidio_nivel === "ALTO" ? 'bg-destructive/5 border-destructive/20' : 'bg-background border-border/60'}`}>
            <CardHeader className="p-4 pb-0"><CardTitle className="text-xs font-medium text-muted-foreground">Score de Risco</CardTitle></CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="flex items-baseline gap-2">
                <div className={`text-2xl font-bold tabular-nums ${m.risco_feminicidio_nivel === "CRITICO" || m.risco_feminicidio_nivel === "ALTO" ? 'text-destructive' : 'text-foreground'}`}>
                  {m.risco_feminicidio_score.toFixed(1)}
                </div>
                <span className="text-xs text-muted-foreground">{stateRank}º no Estado</span>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1 shadow-sm bg-background border-border/60">
            <CardHeader className="p-4 pb-0"><CardTitle className="text-[10px] font-medium text-muted-foreground uppercase">Consumados</CardTitle></CardHeader>
            <CardContent className="p-4 pt-1"><div className="text-xl font-bold tabular-nums text-destructive">{m.feminicidios_consumados_2023_2025}</div></CardContent>
          </Card>
          <Card className="col-span-1 shadow-sm bg-background border-border/60">
            <CardHeader className="p-4 pb-0"><CardTitle className="text-[10px] font-medium text-muted-foreground uppercase">Tentativas</CardTitle></CardHeader>
            <CardContent className="p-4 pt-1"><div className="text-xl font-bold tabular-nums text-[color:var(--color-warning)]">{m.feminicidios_tentados_2023_2025}</div></CardContent>
          </Card>
        </div>
      </section>

      {/* 3. GRÁFICOS ANALÍTICOS */}
      <section>
        <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground mb-4">Gráficos Analíticos</h2>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-0"><CardTitle className="text-lg">Análise Comparativa (Teia)</CardTitle></CardHeader>
            <CardContent className="p-6 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Município" dataKey="Mun" stroke="#6B21A8" fill="#6B21A8" fillOpacity={0.3} strokeWidth={2} />
                  <Radar name="Média Polo" dataKey="Polo" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeWidth={1} strokeDasharray="3 3" />
                  <Radar name="Média Estado" dataKey="Estado" stroke="#cbd5e1" fill="none" strokeWidth={1} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                  <RechartsTooltip formatter={(value: number) => value.toFixed(1) + " pts"} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-0"><CardTitle className="text-lg">Série Histórica (2023–2026)</CardTitle></CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b' }} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  <Bar name="Consumados" dataKey="consumados" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  <Bar name="Tentativas" dataKey="tentados" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. AVALIAÇÃO E MONITORAMENTO */}
      <section>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm border-border/60 bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Leitura Comparativa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <ul className="space-y-4 text-base text-muted-foreground leading-relaxed">
                <li className="flex gap-3">
                  <div className="mt-0.5"><CheckCircle2 className="h-5 w-5 text-primary" /></div>
                  <span>O risco do município ({m.risco_feminicidio_score}) está <strong>{m.risco_feminicidio_score > radarPolo.risco * (maxRisco / 100) ? 'acima' : 'abaixo'}</strong> da média do seu polo regional. Ocupa a <strong>{poloRank}ª posição</strong> em criticidade local.</span>
                </li>
                <li className="flex gap-3">
                  <div className="mt-0.5"><Building2 className="h-5 w-5 text-primary" /></div>
                  <span>Cobertura institucional (OPM/CREAS): O município {m.opm_possui === "SIM" && m.creas_possui === "SIM" ? "possui rede completa formal." : (m.opm_possui === "SIM" || m.creas_possui === "SIM") ? "possui rede parcial formal." : "apresenta vazio institucional na rede principal."}</span>
                </li>
                <li className="flex gap-3">
                  <div className="mt-0.5"><AlertTriangle className="h-5 w-5 text-primary" /></div>
                  <span>Intensidade de violência letal (2023-26): Encontra-se <strong>{radarM.violencia > radarState.violencia ? 'acima' : 'abaixo'}</strong> da média estadual normalizada.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-2 border-b border-border/50"><CardTitle className="text-lg flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Flags do Sistema</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-4">
              <Row k="Ocorrências Monitoradas" v={<span className="font-bold tabular-nums text-lg">{m.ocorrencias_total_violencia_genero_monitoradas}</span>} />
              <Row k="Alerta de Rede" v={<AlertBadge level={m.painel_alerta_rede} />} />
              <Row k="Atuação Prioritária" v={<YesNoBadge value={m.necessita_atuacao_prioritaria} positiveIsGood={false} />} />
              <Row k="Última Referência" v={<span className="text-muted-foreground">{m.ultima_atualizacao_referencia}</span>} />
              {m.observacoes_sistema && (
                <div className="pt-2">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Nota do Sistema</p>
                  <p className="text-base bg-muted/30 p-3 rounded-md border border-border/50 text-foreground">{m.observacoes_sistema}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. REDE DE PROTEÇÃO */}
      <section>
        <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground mb-4">Estrutura Local da Rede</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-md"><Building2 className="h-6 w-6 text-primary" /></div>
                <div>
                  <CardTitle className="text-lg">OPM</CardTitle>
                  <span className="text-sm text-muted-foreground">Organismo de Políticas para Mulheres</span>
                </div>
              </div>
              <YesNoBadge value={m.opm_possui} />
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <Row k="Tipologia" v={m.opm_orgaotipo || "—"} />
              <Row k="Estrutura ativa" v={<YesNoBadge value={m.opm_possui_estrutura_ativa} />} />
              <Row k="Políticas Públicas" v={m.opm_status_politicas_publicas || "—"} />
              <Row k="Prioridade Fomento" v={<span className="font-medium">{m.prioridade_fomento_opm || "—"}</span>} />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-md"><HeartHandshake className="h-6 w-6 text-primary" /></div>
                <div>
                  <CardTitle className="text-lg">CREAS</CardTitle>
                  <span className="text-sm text-muted-foreground">Centro de Referência Especializado</span>
                </div>
              </div>
              <YesNoBadge value={m.creas_possui} />
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <Row k="Status Atual" v={m.creas_status || "—"} />
              <Row k="Critério Ausência" v={m.creas_ausente === "SIM" ? <span className="text-destructive font-medium">Ausente / Elegível</span> : "—"} />
              <Row k="Prioridade Implantação" v={<span className="font-medium">{m.prioridade_implantacao_creas || "—"}</span>} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 6. SÍNTESE TÉCNICA E 7. METADADOS */}
      <section className="bg-muted/30 border border-border/50 rounded-xl p-6">
        <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" /> Síntese Técnica Institucional
        </h2>
        <p className="text-base text-foreground/90 leading-relaxed mb-6">
          O município de <strong>{m.municipio}</strong> apresenta um quadro de risco <strong>{m.risco_feminicidio_nivel.toLowerCase()}</strong>. 
          Institucionalmente, a localidade {m.opm_possui === "SIM" ? "dispõe de OPM ativa" : "carece de OPM instalada"} e {m.creas_possui === "SIM" ? "conta com estrutura de CREAS" : "não possui CREAS estruturado"}. 
          No eixo da violência, registrou {m.feminicidios_consumados_2023_2025} consumados e {m.feminicidios_tentados_2023_2025} tentativas no período analisado, resultando em um status de rede classificado como <strong>{m.painel_alerta_rede}</strong>.
          {m.necessita_atuacao_prioritaria === "SIM" ? " O sistema recomenda atuação focada e priorização institucional devido aos agravantes territoriais." : " Recomenda-se o monitoramento contínuo das ocorrências e estabilidade institucional."}
        </p>

        <div className="border-t border-border/50 pt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span><strong>Fontes:</strong> SSP-PI, MDS, IBGE</span>
          <span><strong>Metodologia Score:</strong> v1.2</span>
          <span><strong>Data Ref.:</strong> {m.ultima_atualizacao_referencia}</span>
        </div>
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2.5 last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{k}</span>
      <span className="text-base font-semibold text-foreground text-right">{v}</span>
    </div>
  );
}
