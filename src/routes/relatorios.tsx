import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, ShieldAlert, BarChart3, CheckCircle2, ChevronRight, Filter } from "lucide-react";
import { municipiosQueryOptions } from "@/lib/data-fetching";
import { useMunicipios } from "@/lib/useMunicipios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportCsv, exportXlsx, exportPdf, BRIGID_BRAND } from "@/lib/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/relatorios")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: Relatorios,
});

function Relatorios() {
  const { data: m } = useMunicipios();

  const relatoriosPrioritarios = [
    {
      titulo: "Municípios Prioritários Imediatos",
      descricao: "Foca em municípios com risco crítico e vazios de proteção (Sem OPM/CREAS) e sem protocolo.",
      utilidade: "Ação de Intervenção Imediata / Cobrança",
      badge: { label: "Prioridade Máxima", class: "bg-destructive/10 text-destructive border-destructive/20" },
      filtros: "Risco Alto/Crítico + Sem OPM/CREAS + Sem Protocolo",
      rows: m.filter(x => 
        (x.risco_feminicidio_nivel === "ALTO" || x.risco_feminicidio_nivel === "CRITICO") &&
        (x.opm_possui !== "SIM" || x.creas_possui !== "SIM") &&
        (x.tem_protocolo_local_regional !== "SIM")
      ).map(x => ({
        municipio: x.municipio,
        polo: x.polo_regional,
        comarca: x.comarca,
        risco: x.risco_feminicidio_nivel,
        falta_opm: x.opm_possui === "SIM" ? "Não" : "Sim",
        falta_creas: x.creas_possui === "SIM" ? "Não" : "Sim",
        falta_protocolo: "Sim",
        ocorrencias_totais: x.ocorrencias_total_violencia_genero_monitoradas || 0
      })),
      file: "prioridade_imediata.csv",
      pdfOptions: (rows: any[]) => ({
        subtitle: "Relatório Operacional de Municípios com Lacunas Críticas e Risco Elevado",
        criterios: "Municípios que apresentam risco de feminicídio 'Alto' ou 'Crítico', associado à ausência de estruturas básicas de atendimento (OPM ou CREAS) e ausência de protocolos locais formalizados.",
        kpis: [
          { label: "Total de Municípios", value: rows.length },
          { label: "Falta OPM/CREAS", value: rows.filter(r => r.falta_opm === "Sim" || r.falta_creas === "Sim").length },
        ]
      })
    },
    {
      titulo: "Rede Insuficiente com Ocorrência Letal",
      descricao: "Municípios que registraram feminicídio no período, mas possuem cobertura de rede falha.",
      utilidade: "Ofícios de Responsabilização e Estruturação",
      badge: { label: "Alerta Crítico", class: "bg-destructive/10 text-destructive border-destructive/20" },
      filtros: "Feminicídios > 0 + Sem OPM/CREAS",
      rows: m.filter(x => 
        ((x.feminicidios_consumados_2023_2025 || 0) > 0 || (x.feminicidios_tentados_2023_2025 || 0) > 0) &&
        (x.opm_possui !== "SIM" || x.creas_possui !== "SIM")
      ).map(x => ({
        municipio: x.municipio,
        polo: x.polo_regional,
        comarca: x.comarca,
        consumados: x.feminicidios_consumados_2023_2025 || 0,
        tentados: x.feminicidios_tentados_2023_2025 || 0,
        opm: x.opm_possui,
        creas: x.creas_possui,
      })),
      file: "ocorrencia_letal_sem_rede.csv",
      pdfOptions: (rows: any[]) => ({
        subtitle: "Relatório de Incidência Letal em Territórios Descobertos",
        criterios: "Municípios que registraram ao menos um caso de feminicídio (consumado ou tentado) no recorte temporal, mas que não dispõem de cobertura institucional completa (Sem OPM ou Sem CREAS).",
        kpis: [
          { label: "Municípios Atingidos", value: rows.length },
          { label: "Consumados Registrados", value: rows.reduce((acc, r) => acc + (r.consumados || 0), 0) },
          { label: "Tentados Registrados", value: rows.reduce((acc, r) => acc + (r.tentados || 0), 0) },
        ]
      })
    }
  ];

  const relatoriosExecutivos = [
    {
      titulo: "Resumo Executivo Estadual",
      descricao: "Visão panorâmica da rede de proteção do Estado. Agrega KPIs de infraestrutura e gestão para rápida leitura.",
      utilidade: "Reuniões do CAOCRIM e Apresentações",
      badge: { label: "Executivo", class: "bg-primary/10 text-primary border-primary/20" },
      filtros: "Todos os 224 Municípios (Base Oficial)",
      rows: m.map(x => ({
        municipio: x.municipio,
        polo: x.polo_regional,
        score_ier: x.ier_score,
        score_imf: x.imf_score,
        score_iqt: x.iqt_score,
        risco: x.risco_feminicidio_nivel,
        alerta_rede: x.painel_alerta_rede
      })),
      file: "resumo_executivo_estadual.csv",
      pdfOptions: (rows: any[]) => ({
        subtitle: "Diagnóstico Geral de Infraestrutura e Risco no Piauí",
        criterios: "Levantamento global dos 224 municípios mapeando os Scores Sintéticos de Estrutura (IER), Maturidade (IMF) e Qualificação (IQT).",
        kpis: [
          { label: "Municípios", value: rows.length },
          { label: "Risco Alto/Crítico", value: rows.filter(r => r.risco === "ALTO" || r.risco === "CRITICO").length },
          { label: "Estrutura Crítica", value: rows.filter(r => Number(r.score_ier) < 4).length },
        ]
      })
    },
    {
      titulo: "Monitoramento da Expansão da Rede",
      descricao: "Levantamento da presença institucional (OPM/CREAS). Usado para verificar a estagnação ou avanço da cobertura.",
      utilidade: "Planejamento Estratégico e Cobrança Governamental",
      badge: { label: "Monitoramento", class: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
      filtros: "Situação OPM e CREAS (Estado Completo)",
      rows: m.map(x => ({
        municipio: x.municipio,
        polo: x.polo_regional,
        populacao: x.populacao,
        opm: x.opm_possui,
        creas: x.creas_possui,
        status: (x.opm_possui === "SIM" && x.creas_possui === "SIM") ? "Coberto" : (x.opm_possui === "SIM" || x.creas_possui === "SIM") ? "Parcial" : "Descoberto"
      })),
      file: "expansao_rede_opm_creas.csv",
      pdfOptions: (rows: any[]) => ({
        subtitle: "Situação da Cobertura Institucional (OPM/CREAS)",
        criterios: "Avaliação do nível de implementação de Organismos de Políticas para Mulheres (OPM) e Centros de Referência Especializados de Assistência Social (CREAS).",
        kpis: [
          { label: "Cobertos (OPM+CREAS)", value: rows.filter(r => r.status === "Coberto").length },
          { label: "Cobertura Parcial", value: rows.filter(r => r.status === "Parcial").length },
          { label: "Sem Nenhuma Rede", value: rows.filter(r => r.status === "Descoberto").length },
        ]
      })
    }
  ];

  const relatoriosOperacionais = [
    {
      titulo: "Subsídio para Expedição / Ofício",
      descricao: "Foca em cidades zeradas de cobertura institucional, fornecendo dados prontos para fundamentar expedientes.",
      utilidade: "Apoio Técnico a Promotorias Locais",
      badge: { label: "Subsídio Operacional", class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      filtros: "Vazios de Cobertura (Sem OPM + Sem CREAS)",
      rows: m.filter(x => x.opm_possui !== "SIM" && x.creas_possui !== "SIM").map(x => ({
        municipio: x.municipio,
        comarca: x.comarca,
        polo: x.polo_regional,
        prioridade_creas: x.prioridade_implantacao_creas,
        prioridade_opm: x.prioridade_fomento_opm,
        populacao_feminina: x.populacao_feminina || 0
      })),
      file: "subsidio_oficio_lacunas.csv",
      pdfOptions: (rows: any[]) => ({
        subtitle: "Relação de Municípios sem Estruturas de Atendimento à Mulher",
        criterios: "Listagem de cidades que apresentam vazios de cobertura institucional, sem registro de OPM nem CREAS implantados em atividade.",
        kpis: [
          { label: "Cidades Desassistidas", value: rows.length },
          { label: "População Feminina Afetada", value: rows.reduce((acc, r) => acc + (Number(r.populacao_feminina) || 0), 0).toLocaleString('pt-BR') }
        ]
      })
    },
    {
      titulo: "Fiscalização de Salas Especializadas e Protocolos",
      descricao: "Auditoria direta sobre o serviço oferecido na ponta. Ajuda a induzir melhorias nos espaços e processos locais.",
      utilidade: "Fiscalização e Indução de Políticas",
      badge: { label: "Fiscalização", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
      filtros: "Itens de Atendimento, Fluxo e Recursos",
      rows: m.map(x => ({
        municipio: x.municipio,
        sala_especializada: x.tem_sala_especializada,
        recursos_minimos: x.tem_recursos_minimos,
        fluxo_formal: x.tem_fluxo_formal,
        protocolo_regional: x.tem_protocolo_local_regional,
        suficiencia: x.grau_suficiencia_estrutura
      })),
      file: "auditoria_salas_protocolos.csv",
      pdfOptions: (rows: any[]) => ({
        subtitle: "Prontidão da Estrutura de Atendimento à Mulher",
        criterios: "Auditoria das estruturas físicas (salas especializadas e insumos mínimos) e dos fluxos processuais (protocolos e diretrizes).",
        kpis: [
          { label: "Possuem Sala Espec.", value: rows.filter(r => r.sala_especializada === "SIM").length },
          { label: "Possuem Fluxo Formal", value: rows.filter(r => r.fluxo_formal === "SIM").length },
          { label: "Estrutura Adequada", value: rows.filter(r => r.suficiencia === "ADEQUADO").length },
        ]
      })
    }
  ];

  const sessoes = [
    { titulo: "Relatórios Prioritários", icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", list: relatoriosPrioritarios },
    { titulo: "Visões Executivas e Territoriais", icon: BarChart3, color: "text-primary", bg: "bg-primary/10", list: relatoriosExecutivos },
    { titulo: "Rede, Cobertura e Atuação Institucional", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10", list: relatoriosOperacionais },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Central de Inteligência Estratégica</h1>
          <p className="text-muted-foreground text-sm max-w-3xl">
            Bem-vindo à área de relatórios do <strong className="text-foreground">{BRIGID_BRAND.project}</strong>. Aqui você pode gerar documentos com alto valor acionável para embasar decisões ministeriais, instruir inquéritos e fiscalizar a rede de proteção à mulher no Piauí.
          </p>
          <div className="bg-primary/5 p-3 rounded-md border border-primary/10 mt-3 flex items-start gap-3">
            <div className="bg-primary/20 p-1.5 rounded-full mt-0.5">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-primary-700 dark:text-primary-300">
              Todos os PDFs gerados contam com <strong className="font-semibold">formatação institucional oficial</strong> (com cabeçalhos sóbrios, blocos de metadados analíticos e critérios transparentes), prontos para serem juntados em despachos e recomendações.
            </p>
          </div>
        </div>
      </div>

      {sessoes.map((sessao) => (
        <section key={sessao.titulo} className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", sessao.bg)}>
              <sessao.icon className={cn("h-4 w-4", sessao.color)} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">{sessao.titulo}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {sessao.list.map((r) => {
              const base = r.file.replace(/\.csv$/i, "");
              const isPrioritySection = sessao.titulo === "Relatórios Prioritários";
              return (
                <Card key={r.titulo} className={cn("overflow-hidden transition-all duration-200", isPrioritySection ? "border-destructive/30 shadow-sm hover:border-destructive/50" : "hover:border-primary/40")}>
                  <CardHeader className="pb-3 bg-muted/20">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-bold leading-tight">{r.titulo}</CardTitle>
                      <Badge variant="outline" className={r.badge.class}>{r.badge.label}</Badge>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground mt-1.5 line-clamp-2 min-h-[40px]">
                      {r.descricao}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5">
                        <Filter className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Filtro Ativo</p>
                          <p className="text-sm text-muted-foreground">{r.filtros}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Utilidade Prática</p>
                          <p className="text-sm font-medium text-foreground">{r.utilidade}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
                      <span className="text-xs font-bold text-muted-foreground px-2 py-1 bg-muted rounded-md">{r.rows.length} Registros</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 hover:bg-muted/50" title="Exportar CSV" onClick={() => exportCsv(`${base}.csv`, r.rows)}>
                          CSV
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 hover:bg-muted/50" title="Exportar Excel" onClick={() => exportXlsx(`${base}.xlsx`, r.rows)}>
                          XLSX
                        </Button>
                        <Button size="sm" className="h-8 shadow-sm" title="Exportar Relatório PDF" onClick={() => exportPdf(`${base}.pdf`, r.titulo, r.rows, r.pdfOptions(r.rows))}>
                          <Download className="mr-1.5 h-3.5 w-3.5" /> PDF Executivo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
