import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface VisitorStats {
  total: number;
  monthly: number;
  daily: number;
  unique: number;
}

export function VisitorCounter() {
  const [stats, setStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    const registerAndFetch = async () => {
      try {
        // 1. Obter ou gerar session ID
        let sessionId = sessionStorage.getItem("brigid_session_id");
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem("brigid_session_id", sessionId);
        }

        // 2. Registrar acesso caso ainda não tenha sido feito nesta sessão
        const hasRegistered = sessionStorage.getItem("brigid_visit_registered");
        if (!hasRegistered) {
          const { error: insertError } = await supabase
            .from("site_visits")
            .insert([{ session_id: sessionId }]);

          if (!insertError) {
            sessionStorage.setItem("brigid_visit_registered", "true");
          }
        }

        // 3. Buscar estatísticas através do RPC
        const { data, error } = await supabase.rpc("get_visitor_stats");

        if (!error && data) {
          setStats(data as VisitorStats);
        }
      } catch (error) {
        console.error("Erro ao carregar métricas de acesso:", error);
      }
    };

    registerAndFetch();
  }, []);

  if (!stats) return null;

  const itens: [string, number][] = [
    ["Acessos totais", stats.total],
    ["Visitantes únicos", stats.unique],
    ["No mês", stats.monthly],
    ["Hoje", stats.daily],
  ];

  return (
    <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
      {itens.map(([rotulo, valor]) => (
        <div key={rotulo} className="flex items-baseline gap-1.5">
          <dt>{rotulo}:</dt>
          <dd className="font-medium tabular-nums text-foreground/80">
            {valor.toLocaleString("pt-BR")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
