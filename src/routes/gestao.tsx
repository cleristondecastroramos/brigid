import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Circle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

const STATUS_LABEL: Record<Entrega["status"], { label: string; icon: any; cls: string }> = {
  concluida: { label: "Concluída", icon: CheckCircle2, cls: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] border-[color:var(--color-success)]/30" },
  andamento: { label: "Em andamento", icon: Clock, cls: "bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/40" },
  planejada: { label: "Planejada", icon: Circle, cls: "bg-muted text-muted-foreground border-border" },
};

function Gestao() {
  const { data: entregas = [], isLoading, error } = useQuery({
    queryKey: ['entregas_estrategicas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('entregas_estrategicas').select('*').order('id', { ascending: true });
      if (error) throw error;
      return data as Entrega[];
    }
  });

  const total = entregas.length;
  const concluidas = entregas.filter((e) => e.status === "concluida").length;
  const andamento = entregas.filter((e) => e.status === "andamento").length;
  const planejadas = entregas.filter((e) => e.status === "planejada").length;
  const progressoMedio = total > 0 ? Math.round(entregas.reduce((s, e) => s + (e.progresso || 0), 0) / total) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-destructive">
        Erro ao carregar dados do Supabase. Verifique se as tabelas foram criadas.
      </div>
    );
  }

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
          {entregas.map((e) => {
            const s = STATUS_LABEL[e.status] || STATUS_LABEL.planejada;
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
                    <span>Progresso</span><span className="tabular-nums">{e.progresso || 0}%</span>
                  </div>
                  <Progress value={e.progresso || 0} className="mt-1.5" />
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
