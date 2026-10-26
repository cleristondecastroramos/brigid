import { createFileRoute } from "@tanstack/react-router";
import { useMunicipios } from "@/lib/useMunicipios";
import { municipiosQueryOptions, pct } from "@/lib/data-fetching";
import { Building2, HeartHandshake, AlertTriangle, MapPin, Activity, Map } from "lucide-react";

import {
  PageHero,
  InstitutionalSummaryCard,
  ModuleNavigationCard,
  QuickStartGuide,
  MacroIndicatorCard,
} from "@/components/home-components";
import { NotasRodape } from "@/components/rodape-institucional";

export const Route = createFileRoute("/apresentacao-do-sistema")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: Dashboard,
});

function Dashboard() {
  const { data: municipios } = useMunicipios();

  const total = municipios.length;
  const comOPM = municipios.filter((m) => m.opm_possui === "SIM").length;
  const comCREAS = municipios.filter((m) => m.creas_possui === "SIM").length;
  const semAmbos = municipios.filter(
    (m) => m.opm_possui !== "SIM" && m.creas_possui !== "SIM",
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHero />

      <InstitutionalSummaryCard />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MacroIndicatorCard
          label="Municípios monitorados"
          value={total}
          hint="Estado do Piauí"
          icon={MapPin}
          tone="default"
        />
        <MacroIndicatorCard
          label="Municípios com OPM"
          value={comOPM}
          hint={`Presente em ${pct(comOPM, total)}`}
          icon={Building2}
          tone="default"
        />
        <MacroIndicatorCard
          label="Municípios com CREAS"
          value={comCREAS}
          hint={`Presente em ${pct(comCREAS, total)}`}
          icon={HeartHandshake}
          tone="default"
        />
        <MacroIndicatorCard
          label="Vazios institucionais"
          value={semAmbos}
          hint={`${pct(semAmbos, total)} sem estrutura mínima`}
          icon={AlertTriangle}
          tone="critical"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Módulos do painel</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <ModuleNavigationCard
            title="Diagnóstico da Rede"
            description="Consolida fluxos, protocolos, infraestrutura e qualificação técnica para entender a capacidade de resposta da rede."
            icon={Activity}
            href="/diagnostico"
          />
          <ModuleNavigationCard
            title="Cobertura OPM"
            description="Identifica municípios com ou sem estrutura institucional de políticas para mulheres, visualizando a distribuição territorial."
            icon={Building2}
            href="/opm"
          />
          <ModuleNavigationCard
            title="Cobertura CREAS"
            description="Mostra a cobertura da assistência social especializada, com foco na presença ou ausência de CREAS."
            icon={HeartHandshake}
            href="/creas"
          />
          <ModuleNavigationCard
            title="Risco de Feminicídio"
            description="Apresenta leitura territorial do risco e criticidade, identificando áreas que exigem atenção prioritária."
            icon={Map}
            href="/risco"
          />
          <ModuleNavigationCard
            title="Inteligência Territorial"
            description="Apoia o cruzamento de indicadores e a identificação de prioridades estratégicas sobre monitoramento."
            icon={MapPin}
            href="/territorio"
          />
        </div>
      </div>

      <QuickStartGuide />

      <NotasRodape
        fontes={["Base consolidada do BRIGID: SEMPI/OPM 2026 (OPM)", "SASC/SUAS 2025 (CREAS)"]}
        notas={[
          "“Vazios institucionais” são os municípios que não possuem OPM nem CREAS em funcionamento.",
        ]}
      />
    </div>
  );
}
