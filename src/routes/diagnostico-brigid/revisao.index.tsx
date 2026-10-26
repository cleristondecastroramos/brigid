import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  diagnosticoService,
  STATUS_DIAGNOSTICO,
  type DiagnosticoResumo,
  type StatusDiagnostico,
} from "@/services/diagnostico-service";
import { ATRIBUICOES, rotuloAtribuicao } from "@/lib/dicionario-diagnostico";
import { SomenteCaocrim } from "@/components/diagnostico/AcessoDiagnostico";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/diagnostico-brigid/revisao/")({
  component: () => (
    <SomenteCaocrim>
      <FilaRevisaoPage />
    </SomenteCaocrim>
  ),
});

const PENDENTES: StatusDiagnostico[] = ["enviado", "em_analise", "validado"];

function FilaRevisaoPage() {
  const [diags, setDiags] = useState<DiagnosticoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [f, setF] = useState({
    municipio: "all",
    comarca: "all",
    polo: "all",
    promotoria: "all",
    atribuicao: "all",
    periodo: "all",
    status: "pendentes",
    publicacao: "all",
  });

  useEffect(() => {
    diagnosticoService
      .listar()
      .then(setDiags)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setCarregando(false));
  }, []);

  const opcoes = useMemo(() => {
    const uniq = (xs: string[]) =>
      [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return {
      municipio: uniq(diags.map((d) => d.municipio)),
      comarca: uniq(diags.map((d) => d.comarca)),
      polo: uniq(diags.map((d) => d.polo_regional)),
      promotoria: uniq(diags.map((d) => d.promotoria_nome)),
      periodo: uniq(diags.map((d) => d.periodo_referencia)).reverse(),
    };
  }, [diags]);

  const filtrados = useMemo(
    () =>
      diags
        .filter((d) => f.municipio === "all" || d.municipio === f.municipio)
        .filter((d) => f.comarca === "all" || d.comarca === f.comarca)
        .filter((d) => f.polo === "all" || d.polo_regional === f.polo)
        .filter((d) => f.promotoria === "all" || d.promotoria_nome === f.promotoria)
        .filter((d) => f.atribuicao === "all" || d.atribuicao.includes(f.atribuicao))
        .filter((d) => f.periodo === "all" || d.periodo_referencia === f.periodo)
        .filter((d) =>
          f.status === "pendentes"
            ? PENDENTES.includes(d.status)
            : f.status === "all" || d.status === f.status,
        )
        .filter((d) =>
          f.publicacao === "all"
            ? true
            : f.publicacao === "publicado"
              ? d.versao_publicada !== null
              : d.versao_publicada === null,
        )
        .sort((a, b) =>
          (a.data_envio ?? a.data_atualizacao).localeCompare(b.data_envio ?? b.data_atualizacao),
        ),
    [diags, f],
  );

  const filtro = (
    chave: keyof typeof f,
    rotulo: string,
    itens: { value: string; label: string }[],
  ) => (
    <Select value={f[chave]} onValueChange={(v) => setF((x) => ({ ...x, [chave]: v }))}>
      <SelectTrigger className="h-8 w-[170px] text-xs">
        <SelectValue placeholder={rotulo} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{rotulo}: todos</SelectItem>
        {itens.map((i) => (
          <SelectItem key={i.value} value={i.value}>
            {i.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  const lista = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/diagnostico-brigid">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Revisão CAOCRIM</h1>
        </div>
        <p className="text-muted-foreground">
          Fila de análise dos diagnósticos enviados. Cada aprovação corresponde a uma versão
          revisada individualmente; não há validação em massa.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filtros
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {filtro("municipio", "Município", lista(opcoes.municipio))}
            {filtro("comarca", "Comarca", lista(opcoes.comarca))}
            {filtro("polo", "Polo regional", lista(opcoes.polo))}
            {filtro("promotoria", "Promotoria", lista(opcoes.promotoria))}
            {filtro("atribuicao", "Atribuição", ATRIBUICOES)}
            {filtro("periodo", "Período", lista(opcoes.periodo))}
            <Select value={f.status} onValueChange={(v) => setF((x) => ({ ...x, status: v }))}>
              <SelectTrigger className="h-8 w-[200px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendentes">Situação: aguardando CAOCRIM</SelectItem>
                <SelectItem value="all">Situação: todas</SelectItem>
                {(Object.keys(STATUS_DIAGNOSTICO) as StatusDiagnostico[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_DIAGNOSTICO[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtro("publicacao", "Publicação", [
              { value: "publicado", label: "Com versão publicada" },
              { value: "nao_publicado", label: "Não publicado" },
            ])}
          </div>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum diagnóstico para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-none [&_th]:bg-primary [&_th]:font-semibold [&_th]:text-primary-foreground">
                    <TableHead>Município</TableHead>
                    <TableHead className="min-w-[200px]">Promotoria respondente</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Atribuição</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-center">Completude</TableHead>
                    <TableHead>Envio</TableHead>
                    <TableHead className="min-w-[160px]">Situação da análise</TableHead>
                    <TableHead>Publicação</TableHead>
                    <TableHead className="text-center">Versão</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        {d.municipio}
                        <div className="text-[11px] text-muted-foreground">
                          {d.comarca} · {d.polo_regional}
                        </div>
                      </TableCell>
                      <TableCell>{d.promotoria_nome}</TableCell>
                      <TableCell className="text-sm">{d.responsavel_nome ?? "—"}</TableCell>
                      <TableCell className="text-xs">
                        {d.atribuicao.map(rotuloAtribuicao).join(", ")}
                      </TableCell>
                      <TableCell>{d.periodo_referencia}</TableCell>
                      <TableCell className="text-center">{d.percentual_preenchimento}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {d.data_envio ? new Date(d.data_envio).toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_DIAGNOSTICO[d.status].className}>
                          {STATUS_DIAGNOSTICO[d.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {d.versao_publicada ? `v${d.versao_publicada} publicada` : "Não publicado"}
                      </TableCell>
                      <TableCell className="text-center">{d.versao_atual}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            to="/diagnostico-brigid/revisao/$diagnosticoId"
                            params={{ diagnosticoId: d.id }}
                          >
                            <Eye className="mr-1.5 h-4 w-4" /> Revisar
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
