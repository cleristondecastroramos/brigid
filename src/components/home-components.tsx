import React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/page-title";

// 1. Cabeçalho da apresentação
export function PageHero() {
  return (
    <PageTitle
      secao="Apresentação do sistema"
      titulo="BRIGID — Base de Referência Integrada para Gestão, Inteligência e Dados"
      descricao="Plataforma de monitoramento e análise estratégica que apoia a atuação do Ministério Público do Estado do Piauí no enfrentamento à violência de gênero e ao feminicídio: organiza dados, evidencia lacunas da rede de proteção e orienta a priorização territorial."
    />
  );
}

// 2. Contexto institucional
export function InstitutionalSummaryCard() {
  return (
    <Card>
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Contexto e finalidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          O Projeto Feminicídio Zero surge como resposta institucional a um cenário de elevada
          gravidade, marcado pela necessidade de fortalecer a rede de enfrentamento à violência
          contra a mulher, corrigir lacunas estruturais e qualificar a atuação pública em todo o
          estado.
        </p>
        <p>
          Nesse contexto, o BRIGID transforma dados dispersos em informação estratégica, permitindo
          identificar vazios de cobertura, fragilidades dos fluxos, déficits de capacitação e áreas
          territoriais que demandam atenção prioritária.
        </p>
        <p className="text-foreground">
          O objetivo central é apoiar o fortalecimento integrado da rede, por meio da estruturação
          institucional, da qualificação técnica, da padronização do atendimento e da atuação
          ministerial orientada por evidências.
        </p>
      </CardContent>
    </Card>
  );
}

// 3. Acesso aos módulos
interface NavCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

export function ModuleNavigationCard({ title, description, icon: Icon, href }: NavCardProps) {
  return (
    <Link to={href} className="group block h-full">
      <Card className="flex h-full flex-col transition-colors group-hover:border-foreground/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between">
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
          <span className="mt-auto inline-flex items-center text-sm font-medium text-primary group-hover:underline">
            Acessar módulo
            <ChevronRight className="ml-0.5 h-4 w-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

// 4. Roteiro de uso
export function QuickStartGuide() {
  const steps = [
    {
      label: "examinar fluxos, protocolos e capacidade institucional",
      dest: "Diagnóstico da Rede",
      href: "/diagnostico",
    },
    {
      label: "identificar municípios sem estrutura institucional",
      dest: "Cobertura OPM",
      href: "/opm",
    },
    {
      label: "verificar vazios da assistência social especializada",
      dest: "Cobertura CREAS",
      href: "/creas",
    },
    {
      label: "fazer a leitura territorial de criticidade",
      dest: "Risco de Feminicídio",
      href: "/risco",
    },
    {
      label: "cruzar dados e apoiar a priorização estratégica",
      dest: "Inteligência Territorial",
      href: "/territorio",
    },
  ];

  return (
    <Card>
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base">Como usar o sistema</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ol className="space-y-2.5">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="w-5 shrink-0 text-right font-medium tabular-nums text-foreground/70">
                {i + 1}.
              </span>
              <span>
                Para {step.label}, acesse{" "}
                <Link to={step.href} className="font-medium text-primary hover:underline">
                  {step.dest}
                </Link>
                .
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

// 5. Indicador macro (sem fundos tingidos: o tom só marca o ícone)
const TONS: Record<string, string> = {
  default: "text-muted-foreground",
  primary: "text-muted-foreground",
  success: "text-[color:var(--color-success)]",
  warning: "text-[color:var(--color-warning)]",
  critical: "text-destructive",
};

export function MacroIndicatorCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ElementType;
  tone?: keyof typeof TONS;
}) {
  return (
    <div className="flex flex-col rounded-md border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${TONS[tone] ?? TONS.default}`} aria-hidden />
      </div>
      <span className="mt-3 text-3xl font-semibold tabular-nums text-foreground">{value}</span>
      {hint && <span className="mt-1 text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
