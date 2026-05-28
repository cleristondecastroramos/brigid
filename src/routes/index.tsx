import { createFileRoute, Link } from "@tanstack/react-router";
import { BrigidMark } from "@/components/brigid-mark";
import { ArrowRight, Map, Database, Shield } from "lucide-react";
import logo from "@/assets/logo-mppi.png";
import { SmokeyBackground, LoginForm } from "@/components/ui/login-form";
import { AnimatedText } from "@/components/ui/animated-text";
import { ShineBorder } from "@/components/ui/shine-border";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-dvh w-full bg-[#F8FAFC]">
      {/* Left side: Fixed, textual elements */}
      <div className="relative hidden w-full flex-col items-center justify-between border-r border-slate-200/60 bg-white px-8 py-12 lg:flex lg:w-1/2 overflow-y-auto">
        {/* Background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[#195e6b]/5 blur-[120px]" />
          <div className="absolute -right-[5%] bottom-[-10%] h-[600px] w-[600px] rounded-full bg-emerald-600/5 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
        </div>

        <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col flex-1">
          {/* Header */}
          <header className="flex w-full items-center gap-4 mb-12">
            <img src={logo} alt="MPPI" className="h-9 w-auto mix-blend-multiply" />
            <div className="h-5 w-[1px] bg-slate-300" />
            <span className="text-xs font-semibold tracking-widest text-slate-600 uppercase">
              Projeto Feminicídio Zero
            </span>
          </header>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-6 flex flex-col items-center w-fit">
              <div className="mb-6 inline-flex rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <BrigidMark size={64} className="text-[#195e6b]" />
              </div>
              <h2 className="mb-2 text-sm font-medium tracking-[0.2em] text-[#195e6b] uppercase text-center">
                Painel Estratégico
              </h2>
              <AnimatedText 
                text="BRIGID" 
                textClassName="text-5xl font-bold tracking-[0.15em] text-slate-900 md:text-7xl text-center"
                underlineGradient="from-[#0f172a] via-[#195e6b] to-emerald-500"
                underlineHeight="h-1.5"
                delay={0.1}
                duration={0.3}
              />
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold tracking-wider text-slate-500 uppercase whitespace-nowrap">
                Base de Referência Integrada para Gestão, Inteligência e Dados
              </h3>
            </div>

            <p className="w-full text-justify text-base leading-relaxed text-slate-600">
              O <strong className="font-semibold text-slate-900">BRIGID</strong> é a plataforma de referência do Projeto Feminicídio Zero para consolidação e análise de dados estratégicos sobre o Estado do Piauí, reunindo informações dos 224 municípios em uma base integrada de monitoramento territorial, inteligência institucional e gestão orientada por evidências. Por meio da articulação entre dados de cobertura de OPMs e CREAS, indicadores de violência de gênero, risco de feminicídio e instrumentos de acompanhamento estratégico, o sistema fortalece a atuação do Ministério Público do Estado do Piauí na identificação de vulnerabilidades, no planejamento de ações prioritárias e no aprimoramento da rede de proteção às mulheres.
            </p>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <ShineBorder
                className="relative flex w-full flex-col items-start gap-3 bg-white p-5 text-slate-600 shadow-sm border border-slate-100 min-w-0 min-h-0"
                color={["#10b981", "#195e6b", "#3b82f6"]}
                borderWidth={1.5}
              >
                <Map className="h-6 w-6 text-[#195e6b]" />
                <span className="text-xs uppercase tracking-wider font-semibold">Inteligência Territorial</span>
              </ShineBorder>

              <ShineBorder
                className="relative flex w-full flex-col items-start gap-3 bg-white p-5 text-slate-600 shadow-sm border border-slate-100 min-w-0 min-h-0"
                color={["#10b981", "#195e6b", "#3b82f6"]}
                borderWidth={1.5}
              >
                <Shield className="h-6 w-6 text-[#195e6b]" />
                <span className="text-xs uppercase tracking-wider font-semibold">Monitoramento da Rede</span>
              </ShineBorder>

              <ShineBorder
                className="relative flex w-full flex-col items-start gap-3 bg-white p-5 text-slate-600 shadow-sm border border-slate-100 min-w-0 min-h-0"
                color={["#10b981", "#195e6b", "#3b82f6"]}
                borderWidth={1.5}
              >
                <Database className="h-6 w-6 text-[#195e6b]" />
                <span className="text-xs uppercase tracking-wider font-semibold">Gestão Baseada em Evidências</span>
              </ShineBorder>
            </div>
          </div>

          <footer className="mt-12 text-left">
            <p className="text-xs font-medium text-slate-400 whitespace-nowrap">
              &copy; 2026 Ministério Público do Estado do Piauí | Centro de Apoio Operacional de Apoio às Promotorias Criminais (CAOCRIM)
            </p>
          </footer>
        </div>
      </div>

      {/* Right side: Login UI */}
      <div className="relative flex w-full flex-col items-center justify-center bg-slate-900 lg:w-1/2">
        <SmokeyBackground className="absolute inset-0 z-0" color="#195e6b" />
        <div className="relative z-10 flex w-full flex-col items-center justify-center px-4">
          
          {/* Mobile elements (hidden on desktop since left panel handles it) */}
          <div className="mb-8 flex flex-col items-center justify-center lg:hidden">
            <div className="mb-4 inline-flex rounded-2xl bg-white/10 backdrop-blur-md p-4 shadow-xl border border-white/20">
              <BrigidMark size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-[0.15em] text-white">BRIGID</h1>
            <h2 className="mt-2 text-xs font-medium tracking-[0.2em] text-white/70 uppercase">
              Painel Estratégico
            </h2>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
