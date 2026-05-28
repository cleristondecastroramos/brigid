import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { municipiosQueryOptions } from "@/lib/csv-data";
import { useMunicipios } from "@/lib/useMunicipios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportCsv } from "@/lib/export";

export const Route = createFileRoute("/relatorios")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: Relatorios,
});

function Relatorios() {
  const { data: m } = useMunicipios();

  const reports: Array<{ titulo: string; descricao: string; rows: Record<string, any>[]; file: string }> = [
    {
      titulo: "Base oficial completa (224 municípios)",
      descricao: "Exporta o universo territorial completo da base oficial do sistema, conforme CSV CAOCRIM.",
      rows: m,
      file: "base_mppi_caocrim.csv",
    },
    {
      titulo: "Municípios sem OPM",
      descricao: "Listagem nominal de municípios sem Organismo de Políticas para Mulheres, com prioridade institucional.",
      rows: m.filter((x) => x.opm_possui !== "SIM").map((x) => ({
        municipio: x.municipio, polo: x.polo_regional, comarca: x.comarca, populacao: x.populacao,
        prioridade: x.prioridade_fomento_opm, risco: x.risco_feminicidio_nivel, alerta: x.painel_alerta_rede,
      })),
      file: "sem_opm.csv",
    },
    {
      titulo: "Municípios sem CREAS",
      descricao: "Listagem nominal de municípios sem CREAS, com prioridade institucional para implantação.",
      rows: m.filter((x) => x.creas_possui !== "SIM").map((x) => ({
        municipio: x.municipio, polo: x.polo_regional, comarca: x.comarca, populacao: x.populacao,
        prioridade: x.prioridade_implantacao_creas, risco: x.risco_feminicidio_nivel, alerta: x.painel_alerta_rede,
      })),
      file: "sem_creas.csv",
    },
    {
      titulo: "Municípios em alerta crítico",
      descricao: "Municípios marcados como críticos no painel de alerta da rede de proteção.",
      rows: m.filter((x) => x.painel_alerta_rede === "CRITICO"),
      file: "alerta_critico.csv",
    },
    {
      titulo: "Sem OPM e sem CREAS",
      descricao: "Municípios vazios de cobertura institucional (sem OPM e sem CREAS).",
      rows: m.filter((x) => x.opm_possui !== "SIM" && x.creas_possui !== "SIM"),
      file: "vazios_cobertura.csv",
    },
    {
      titulo: "Atuação prioritária",
      descricao: "Municípios que necessitam de atuação prioritária do MPPI.",
      rows: m.filter((x) => x.necessita_atuacao_prioritaria === "SIM"),
      file: "atuacao_prioritaria.csv",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Relatórios e exportações</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {reports.map((r) => (
            <div key={r.titulo} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{r.titulo}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{r.descricao}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{r.rows.length} registros</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => exportCsv(r.file, r.rows)}>
                    <Download className="mr-2 h-4 w-4" /> Exportar CSV
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
