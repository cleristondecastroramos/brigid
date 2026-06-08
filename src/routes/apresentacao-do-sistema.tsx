import { createFileRoute } from "@tanstack/react-router";
import { useMunicipios } from "@/lib/useMunicipios";
import { municipiosQueryOptions, pct } from "@/lib/data-fetching";
import {
  Building2,
  HeartHandshake,
  AlertTriangle,
  MapPin,
  Activity,
  Map
} from "lucide-react";

import {
  PageHero,
  InstitutionalSummaryCard,
  ModuleNavigationCard,
  QuickStartGuide,
  MacroIndicatorCard
} from "@/components/home-components";

export const Route = createFileRoute("/apresentacao-do-sistema")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: Dashboard,
});

function Dashboard() {
  const { data: municipios } = useMunicipios();

  const total = municipios.length;
  const comOPM = municipios.filter((m) => m.opm_possui === "SIM").length;
  const comCREAS = municipios.filter((m) => m.creas_possui === "SIM").length;
  const semAmbos = municipios.filter((m) => m.opm_possui !== "SIM" && m.creas_possui !== "SIM").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHero />

      <InstitutionalSummaryCard />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MacroIndicatorCard 
          label="Total de Municípios" 
          value={total} 
          hint="Universo monitorado" 
          icon={MapPin} 
          tone="default" 
        />
        <MacroIndicatorCard 
          label="Cobertura Geral OPM" 
          value={comOPM} 
          hint={`Presente em ${pct(comOPM, total)}`} 
          icon={Building2} 
          tone="primary" 
        />
        <MacroIndicatorCard 
          label="Cobertura Geral CREAS" 
          value={comCREAS} 
          hint={`Presente em ${pct(comCREAS, total)}`} 
          icon={HeartHandshake} 
          tone="success" 
        />
        <MacroIndicatorCard 
          label="Vazios Institucionais" 
          value={semAmbos} 
          hint={`${pct(semAmbos, total)} sem estrutura mínima`} 
          icon={AlertTriangle} 
          tone="critical" 
        />
      </div>

      <div className="space-y-4 mb-8">
        <h3 className="text-xl font-bold text-foreground mb-4 px-1">O que você encontra aqui?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          <ModuleNavigationCard 
            title="Diagnóstico da Rede"
            description="Consolida fluxos, protocolos, infraestrutura e qualificação técnica para entender a capacidade de resposta da rede."
            icon={Activity}
            href="/diagnostico"
            colorClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          />
          <ModuleNavigationCard 
            title="Cobertura OPM"
            description="Identifica municípios com ou sem estrutura institucional de políticas para mulheres, visualizando a distribuição territorial."
            icon={Building2}
            href="/opm"
            colorClass="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
          />
          <ModuleNavigationCard 
            title="Cobertura CREAS"
            description="Mostra a cobertura da assistência social especializada, com foco na presença ou ausência de CREAS."
            icon={HeartHandshake}
            href="/creas"
            colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          />
          <ModuleNavigationCard 
            title="Risco de Feminicídio"
            description="Apresenta leitura territorial do risco e criticidade, identificando áreas que exigem atenção prioritária."
            icon={Map}
            href="/risco"
            colorClass="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
          />
          <ModuleNavigationCard 
            title="Inteligência Territorial"
            description="Apoia o cruzamento de indicadores e a identificação de prioridades estratégicas sobre monitoramento."
            icon={MapPin}
            href="/territorio"
            colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
          />
        </div>
      </div>

      <div className="mt-8">
        <QuickStartGuide />
      </div>

      <div className="mt-8 bg-muted/20 border border-border/40 rounded-xl p-6 text-sm text-muted-foreground text-center">
        <p className="max-w-3xl mx-auto leading-relaxed">
          Esta plataforma foi estruturada para apoiar uma atuação pública mais integrada, responsiva e orientada por evidências no enfrentamento à violência de gênero e ao feminicídio. Mais do que reunir dados, o BRIGID busca transformar informação em capacidade institucional de análise, coordenação e resposta.
        </p>
      </div>

    </div>
  );
}
