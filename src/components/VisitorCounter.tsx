import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, UserCheck, CalendarDays, BarChart2 } from 'lucide-react';

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
        let sessionId = sessionStorage.getItem('brigid_session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('brigid_session_id', sessionId);
        }

        // 2. Registrar acesso caso ainda não tenha sido feito nesta sessão
        const hasRegistered = sessionStorage.getItem('brigid_visit_registered');
        if (!hasRegistered) {
          const { error: insertError } = await supabase
            .from('site_visits')
            .insert([{ session_id: sessionId }]);
            
          if (!insertError) {
            sessionStorage.setItem('brigid_visit_registered', 'true');
          }
        }

        // 3. Buscar estatísticas através do RPC
        const { data, error } = await supabase.rpc('get_visitor_stats');
        
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

  return (
    <div className="flex flex-wrap items-center justify-start gap-4 mt-8 pt-4 border-t border-purple-500/10 text-purple-200/60 font-medium">
      <div className="flex items-center gap-1.5" title="Acessos Totais">
        <BarChart2 className="w-3.5 h-3.5 text-purple-300/50" />
        <span className="text-[10px] uppercase tracking-wider">Totais:</span>
        <span className="text-[11px] text-purple-200/90">{stats.total.toLocaleString('pt-BR')}</span>
      </div>
      
      <div className="flex items-center gap-1.5" title="Visitantes Únicos">
        <UserCheck className="w-3.5 h-3.5 text-purple-300/50" />
        <span className="text-[10px] uppercase tracking-wider">Únicos:</span>
        <span className="text-[11px] text-purple-200/90">{stats.unique.toLocaleString('pt-BR')}</span>
      </div>
      
      <div className="flex items-center gap-1.5" title="Acessos neste Mês">
        <CalendarDays className="w-3.5 h-3.5 text-purple-300/50" />
        <span className="text-[10px] uppercase tracking-wider">Mês:</span>
        <span className="text-[11px] text-purple-200/90">{stats.monthly.toLocaleString('pt-BR')}</span>
      </div>
      
      <div className="flex items-center gap-1.5" title="Acessos Hoje">
        <Users className="w-3.5 h-3.5 text-purple-300/50" />
        <span className="text-[10px] uppercase tracking-wider">Hoje:</span>
        <span className="text-[11px] text-purple-200/90">{stats.daily.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
}
