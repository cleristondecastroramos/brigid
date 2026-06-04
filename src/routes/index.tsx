import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import logoMPPI from "@/assets/logo-mppi.png";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import HeroWave from "@/components/ui/dynamic-wave-canvas-background";
import { AnimatedText } from "@/components/ui/animated-text";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { login } = useApp();
  const navigate = useNavigate();

  const handleAccess = () => {
    login("public");
    toast.success("Acesso ao painel público carregado com sucesso.");
    navigate({ to: "/painel" });
  };

  return (
    <div className="flex min-h-dvh w-full flex-col lg:flex-row bg-[#FAFAFC] overflow-x-hidden selection:bg-purple-100 font-sans">
      {/* Left Column: Institutional and presentation content */}
      <div className="relative flex w-full flex-col justify-between bg-gradient-to-br from-[#1a0525] via-[#2a0845] to-[#1e0a3c] px-8 py-12 md:p-16 lg:w-1/2 overflow-hidden border-b lg:border-b-0 lg:border-r border-purple-900/30">
        {/* Decorative background visual elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <HeroWave />
          {/* Elegant soft glows */}
          <div className="absolute -left-[20%] top-[-10%] h-[600px] w-[600px] rounded-full bg-purple-500/5 blur-[150px]" />
          <div className="absolute -right-[10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[130px]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-between gap-12 lg:gap-16">
          {/* Header info */}
          <header className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <img src={logoMPPI} alt="MPPI" className="h-10 md:h-12 w-auto bg-white/95 p-2 shadow-sm rounded-sm animate-fade-in object-contain" />
            <div className="hidden sm:block h-8 w-[1px] bg-purple-300/20" />
            <span className="text-xs md:text-sm font-semibold tracking-[0.15em] text-purple-200/90 uppercase leading-snug">
              Projeto Feminicídio Zero <br className="hidden sm:block" />
              <span className="text-purple-300/60 font-medium">CAOCRIM / MPPI</span>
            </span>
          </header>

          {/* Main content body */}
          <div className="flex-1 flex flex-col justify-center py-6">
            <span className="inline-block mb-4 px-4 py-1.5 bg-purple-900/30 border border-purple-500/20 rounded-full text-[10px] sm:text-xs font-bold tracking-[0.2em] text-purple-200 uppercase w-fit backdrop-blur-sm shadow-sm">
              Base Estratégica e Territorial
            </span>
            
            <AnimatedText 
              text="BRIGID" 
              className="mb-8 items-start"
              textClassName="text-5xl font-black tracking-[0.1em] text-white md:text-7xl text-left drop-shadow-md"
              underlineGradient="from-purple-400 via-fuchsia-500 to-indigo-500"
              underlineHeight="h-1.5"
              underlineOffset="-bottom-4"
              underlineClassName="rounded-full opacity-80"
            />
            
            <h2 className="text-sm sm:text-base md:text-lg font-semibold tracking-wide text-purple-100 uppercase mb-8 flex flex-col gap-0.5">
              <span className="whitespace-nowrap">Base de Referência Integrada para Gestão, Inteligência e Dados</span>
              <span className="whitespace-nowrap">Do Projeto Feminicídio Zero - CAOCRIM/MPPI</span>
            </h2>

            {/* Continuous paragraph representing combined information */}
            <p className="text-base md:text-lg leading-relaxed text-purple-100/80 text-justify max-w-xl font-light">
              A plataforma <strong className="font-semibold text-white">BRIGID</strong> atua como base integrada de inteligência territorial e monitoramento da rede de proteção. Ao consolidar dados sobre cobertura institucional, fluxos, infraestrutura e indicadores de risco, o sistema subsidia a atuação estratégica do Ministério Público do Estado do Piauí. Seu objetivo é otimizar as políticas públicas nos 224 municípios piauienses, qualificando a resposta estatal no âmbito do Projeto Feminicídio Zero.
            </p>
          </div>

          {/* Institutional footer */}
          <footer className="text-left border-t border-purple-500/10 pt-6 mt-4">
            <p className="text-xs md:text-sm font-medium text-purple-300/50 leading-relaxed max-w-md">
              Ministério Público do Estado do Piauí <br />
              Centro de Apoio Operacional de Apoio às Promotorias Criminais
            </p>
          </footer>
        </div>
      </div>

      {/* Right Column: Brand and Call to Action */}
      <div className="relative flex w-full flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 px-4 sm:px-8 py-16 lg:w-1/2 min-h-[50dvh] lg:min-h-dvh">
        <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center text-center gap-10 bg-white dark:bg-zinc-900 p-8 sm:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-zinc-800">
          
          {/* Logo container */}
          <div className="relative flex h-48 w-48 md:h-56 md:w-56 items-center justify-center bg-transparent group transition-transform duration-500 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-purple-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img 
              src="/logo_brigid.png" 
              alt="BRIGID Logo" 
              className="relative z-10 h-full w-full object-contain drop-shadow-sm"
            />
          </div>

          {/* Action description */}
          <div className="space-y-3">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-zinc-100 tracking-tight">Ambiente de Consulta e Gestão</h3>
            <p className="text-sm md:text-base text-slate-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Acesse indicadores territoriais, mapas de cobertura e painéis de risco atualizados para suporte estratégico.
            </p>
          </div>

          {/* Access Button */}
          <div className="w-full flex flex-col items-center gap-4">
            <button
              onClick={handleAccess}
              className="group relative flex w-full items-center justify-center gap-3 py-4 md:py-5 px-8 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 text-white rounded-2xl font-semibold text-base shadow-[0_8px_20px_rgb(107,33,168,0.2)] hover:shadow-[0_8px_25px_rgb(107,33,168,0.3)] hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              <span className="tracking-wide">Acessar o sistema</span>
              <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1.5 transition-transform duration-300 opacity-90" />
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
            </button>
            
            <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium tracking-wide">
              Acesso público liberado. Área restrita requer autenticação.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
