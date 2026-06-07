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
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border border-border/60 shadow-sm">
        <CardContent className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
          <Stat label="Entregas totais" value={total} />
          <Stat label="Concluídas" value={concluidas} tone="success" />
          <Stat label="Em andamento" value={andamento} tone="warning" />
          <Stat label="Planejadas" value={planejadas} />
          <div className="md:col-span-4 mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-medium uppercase tracking-wider">Progresso Geral do Projeto</span>
              <span className="tabular-nums font-bold text-foreground text-sm">{progressoMedio}%</span>
            </div>
            <Progress value={progressoMedio} className="h-3 shadow-inner" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/40 py-4"><CardTitle className="text-base font-bold text-primary">Entregas estratégicas — Feminicídio Zero</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-muted-foreground border-collapse">
              <thead className="bg-muted/30 text-xs uppercase text-foreground/70 border-b border-border/60">
                <tr>
                  <th className="px-5 py-4 font-semibold w-2/5">Entrega e Descrição</th>
                  <th className="px-5 py-4 font-semibold w-32">Responsável</th>
                  <th className="px-5 py-4 font-semibold w-28">Prazo</th>
                  <th className="px-5 py-4 font-semibold w-36">Status</th>
                  <th className="px-5 py-4 font-semibold w-40">Progresso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {[...entregas].sort((a, b) => {
                  const parsePrazo = (p: string) => {
                    if (!p) return 99999;
                    const yearMatch = p.match(/(\d{4})/);
                    const qMatch = p.match(/Q(\d)/i);
                    if (yearMatch && qMatch) {
                      return parseInt(yearMatch[1]) * 10 + parseInt(qMatch[1]); // ex: 20254
                    }
                    return 99999;
                  };
                  return parsePrazo(a.prazo) - parsePrazo(b.prazo);
                }).map((e) => {
                  const s = STATUS_LABEL[e.status] || STATUS_LABEL.planejada;
                  const Icon = s.icon;
                  return (
                    <tr key={e.titulo} className="hover:bg-muted/30 transition-colors bg-card">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground text-sm">{e.titulo}</div>
                        <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{e.descricao}</div>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-foreground/80">{e.responsavel}</td>
                      <td className="px-5 py-4 text-xs tabular-nums text-foreground/80">{e.prazo}</td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className={s.cls + " font-semibold py-0.5 whitespace-nowrap shadow-sm"}>
                          <Icon className="mr-1.5 h-3.5 w-3.5" /> {s.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-between text-xs mb-2 font-bold text-foreground/80">
                          <span>{e.progresso || 0}%</span>
                        </div>
                        <Progress value={e.progresso || 0} className="h-2.5 shadow-inner" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
