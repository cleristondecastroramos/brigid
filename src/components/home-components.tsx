import React from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  HeartHandshake, 
  AlertTriangle, 
  Activity, 
  Map, 
  ChevronRight, 
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

// 1. PageHero
export function PageHero() {
  return (
    <div className="bg-primary/5 border border-primary/10 rounded-xl p-8 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <img src="/logo_brigid.png" alt="Logo BRIGID" className="w-64 h-64 object-contain mix-blend-multiply dark:mix-blend-screen" />
      </div>
      <div className="relative z-10 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-4">BRIGID</h1>
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-6">
          Base de Referência Integrada para Gestão, Inteligência e Dados do Projeto Feminicídio Zero.
        </h2>
        <div className="space-y-4 text-muted-foreground text-base leading-relaxed max-w-3xl">
          <p>
            O BRIGID é a plataforma de monitoramento e análise estratégica desenvolvida para apoiar a atuação institucional no enfrentamento à violência de gênero e ao feminicídio no Estado do Piauí.
          </p>
          <p>
            Sua finalidade é organizar dados, evidenciar lacunas da rede de proteção, apoiar a priorização territorial e oferecer inteligência para a tomada de decisão baseada em evidências.
          </p>
        </div>
      </div>
    </div>
  );
}

// 2. InstitutionalSummaryCard
export function InstitutionalSummaryCard() {
  return (
    <Card className="mb-8 border-border/60 shadow-sm">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <Info className="w-5 h-5 text-primary" />
          Por que este sistema existe?
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 space-y-4 text-base text-muted-foreground leading-relaxed">
        <p>
          O Projeto Feminicídio Zero surge como resposta institucional a um cenário de elevada gravidade, marcado pela necessidade de fortalecer a rede de enfrentamento à violência contra a mulher, corrigir lacunas estruturais e qualificar a atuação pública em todo o estado.
        </p>
        <p>
          Nesse contexto, o BRIGID foi concebido para transformar dados dispersos em inteligência estratégica, permitindo identificar vazios de cobertura, fragilidades dos fluxos, déficits de capacitação e áreas territoriais que demandam atenção prioritária.
        </p>
        <p className="font-medium text-foreground">
          O objetivo central da plataforma é apoiar o fortalecimento integrado da rede, por meio da estruturação institucional, qualificação técnica, padronização do atendimento e atuação ministerial orientada por evidências.
        </p>
      </CardContent>
    </Card>
  );
}

// 3. ModuleNavigationCard
interface NavCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  colorClass: string;
}

export function ModuleNavigationCard({ title, description, icon: Icon, href, colorClass }: NavCardProps) {
  return (
    <Link to={href} className="block h-full group">
      <Card className="h-full hover:shadow-md transition-all duration-300 border-border/60 hover:border-primary/40 flex flex-col">
        <CardHeader className="pb-3">
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors", colorClass)}>
            <Icon className="w-6 h-6" />
          </div>
          <CardTitle className="text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {description}
          </p>
          <div className="flex items-center text-sm font-semibold text-primary mt-auto">
            Acessar módulo <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// 4. QuickStartGuide
export function QuickStartGuide() {
  const steps = [
    { label: "examinar fluxos, protocolos e capacidade institucional", dest: "Diagnóstico da Rede", href: "/diagnostico" },
    { label: "identificar municípios sem estrutura institucional", dest: "Cobertura OPM", href: "/opm" },
    { label: "verificar vazios da assistência social especializada", dest: "Cobertura CREAS", href: "/creas" },
    { label: "leitura territorial de criticidade", dest: "Risco de Feminicídio", href: "/risco" },
    { label: "cruzar dados e apoiar priorização estratégica", dest: "Inteligência Territorial", href: "/territorio" }
  ];

  return (
    <Card className="border-border/60 shadow-sm bg-muted/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Como usar o sistema</CardTitle>
        <CardDescription className="text-base">Use o sistema conforme sua necessidade de análise:</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="text-base text-muted-foreground">
                Para {step.label}, acesse <Link to={step.href} className="font-semibold text-primary hover:underline">{step.dest}</Link>.
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// 5. MacroIndicatorCard
export function MacroIndicatorCard({ label, value, hint, icon: Icon, tone = "default" }: any) {
  const colors = {
    default: "bg-muted text-foreground border-border",
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-[color:var(--color-success)] border-success/20",
    warning: "bg-warning/10 text-warning-foreground border-warning/20",
    critical: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const currentTone = colors[tone as keyof typeof colors] || colors.default;

  return (
    <div className={cn("rounded-xl border p-5 flex flex-col relative overflow-hidden transition-all", currentTone)}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold uppercase tracking-wider opacity-80">{label}</span>
        <Icon className="w-5 h-5 opacity-70" />
      </div>
      <div className="flex items-end justify-between mt-auto">
        <span className="text-3xl font-black">{value}</span>
        {hint && <span className="text-sm font-medium opacity-80 mb-1">{hint}</span>}
      </div>
    </div>
  );
}
