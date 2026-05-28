import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/gestao")({
  component: Gestao,
});

interface Entrega {
  titulo: string;
  responsavel: string;
  prazo: string;
  status: "concluida" | "andamento" | "planejada";
  progresso: number;
  descricao: string;
}

const ENTREGAS: Entrega[] = [
  { titulo: "Painel BI de OPMs com mapa interativo", responsavel: "CAOCRIM · NTI", prazo: "2026-Q1", status: "andamento", progresso: 70, descricao: "Visualização da cobertura de Organismos de Políticas para Mulheres por município, tipologia e território." },
  { titulo: "Painel BI de CREAS com mapa interativo", responsavel: "CAOCRIM · SASC", prazo: "2026-Q1", status: "andamento", progresso: 65, descricao: "Mapeamento de cobertura de CREAS e identificação de municípios prioritários para implantação." },
  { titulo: "Painel de Indicadores de Violência e Risco de Feminicídio", responsavel: "CAOCRIM · Inteligência", prazo: "2026-Q2", status: "andamento", progresso: 55, descricao: "Cruzamento de feminicídios consumados, tentativas e cobertura institucional para suporte à decisão." },
  { titulo: "Diagnóstico das Secretarias e Coordenadorias da Mulher", responsavel: "CAOCRIM · SEMPI", prazo: "2026-Q2", status: "andamento", progresso: 40, descricao: "Levantamento institucional sobre presença, estrutura e funcionamento das OPMs em todos os 224 municípios." },
  { titulo: "Plano de fomento para implantação de CREAS em municípios descobertos", responsavel: "SASC/SUAS · MPPI", prazo: "2026-Q3", status: "planejada", progresso: 10, descricao: "Construção de plano interinstitucional de articulação para implantação de CREAS em municípios sem cobertura." },
  { titulo: "Padronização do fluxo de atendimento às vítimas", responsavel: "CAOCRIM · Rede de Proteção", prazo: "2026-Q3", status: "planejada", progresso: 5, descricao: "Manual e protocolo de atendimento integrado entre Ministério Público, CREAS, OPMs e Segurança Pública." },
  { titulo: "Programa educativo de enfrentamento à violência de gênero", responsavel: "MPPI · Educação", prazo: "2026-Q4", status: "planejada", progresso: 0, descricao: "Ações educativas e formativas voltadas a escolas, redes municipais e comunidades." },
  { titulo: "Carta-compromisso institucional com municípios prioritários", responsavel: "PGJ-MPPI", prazo: "2025-Q4", status: "concluida", progresso: 100, descricao: "Pactuação formal com gestores municipais para fortalecimento da rede de enfrentamento." },
];

const STATUS_LABEL: Record<Entrega["status"], { label: string; icon: any; cls: string }> = {
  concluida: { label: "Concluída", icon: CheckCircle2, cls: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] border-[color:var(--color-success)]/30" },
  andamento: { label: "Em andamento", icon: Clock, cls: "bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/40" },
  planejada: { label: "Planejada", icon: Circle, cls: "bg-muted text-muted-foreground border-border" },
};

function Gestao() {
  const total = ENTREGAS.length;
  const concluidas = ENTREGAS.filter((e) => e.status === "concluida").length;
  const andamento = ENTREGAS.filter((e) => e.status === "andamento").length;
  const planejadas = ENTREGAS.filter((e) => e.status === "planejada").length;
  const progressoMedio = Math.round(ENTREGAS.reduce((s, e) => s + e.progresso, 0) / total);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          <Stat label="Entregas totais" value={total} />
          <Stat label="Concluídas" value={concluidas} tone="success" />
          <Stat label="Em andamento" value={andamento} tone="warning" />
          <Stat label="Planejadas" value={planejadas} />
          <div className="md:col-span-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso médio do projeto</span>
              <span className="tabular-nums font-medium text-foreground">{progressoMedio}%</span>
            </div>
            <Progress value={progressoMedio} className="mt-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Entregas estratégicas — Feminicídio Zero</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {ENTREGAS.map((e) => {
            const s = STATUS_LABEL[e.status];
            const Icon = s.icon;
            return (
              <div key={e.titulo} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{e.titulo}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{e.descricao}</p>
                  </div>
                  <Badge variant="outline" className={s.cls}>
                    <Icon className="mr-1 h-3 w-3" /> {s.label}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span><strong className="text-foreground">Responsável:</strong> {e.responsavel}</span>
                  <span><strong className="text-foreground">Prazo:</strong> {e.prazo}</span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progresso</span><span className="tabular-nums">{e.progresso}%</span>
                  </div>
                  <Progress value={e.progresso} className="mt-1.5" />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" }) {
  const cls = tone === "success" ? "text-[color:var(--color-success)]" : tone === "warning" ? "text-[color:var(--color-warning)]" : "text-foreground";
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${cls}`}>{value}</p>
    </div>
  );
}
