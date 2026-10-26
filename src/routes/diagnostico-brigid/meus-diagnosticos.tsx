import { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Eye, ArrowLeft, Filter, SearchX } from "lucide-react";
import { toast } from "sonner";
import {
  diagnosticoService,
  STATUS_DIAGNOSTICO,
  STATUS_EDITAVEIS,
  type DiagnosticoResumo,
} from "@/services/diagnostico-service";
import { rotuloAtribuicao } from "@/lib/dicionario-diagnostico";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/diagnostico-brigid/meus-diagnosticos")({
  component: MeusDiagnosticosPage,
});

function MeusDiagnosticosPage() {
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoResumo[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterMunicipio, setFilterMunicipio] = useState<string>("all");
  const [filterComarca, setFilterComarca] = useState<string>("all");

  useEffect(() => {
    diagnosticoService
      .listar()
      .then(setDiagnosticos)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const { filteredDiagnosticos, uniqueMunicipios, uniqueComarcas } = useMemo(() => {
    let result = [...diagnosticos];
    if (filterMunicipio !== "all") result = result.filter((d) => d.municipio === filterMunicipio);
    if (filterComarca !== "all") result = result.filter((d) => d.comarca === filterComarca);
    return {
      filteredDiagnosticos: result,
      uniqueMunicipios: [...new Set(diagnosticos.map((d) => d.municipio))].sort((a, b) =>
        a.localeCompare(b),
      ),
      uniqueComarcas: [...new Set(diagnosticos.map((d) => d.comarca).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b),
      ),
    };
  }, [diagnosticos, filterMunicipio, filterComarca]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/diagnostico-brigid">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Meus Diagnósticos</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Acompanhe os formulários das Promotorias vinculadas ao seu usuário, retome rascunhos ou
          corrija diagnósticos devolvidos.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle>Histórico de Preenchimentos</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-md border">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterComarca} onValueChange={setFilterComarca}>
                <SelectTrigger className="h-8 w-[180px] bg-background border-none shadow-none text-xs focus:ring-0">
                  <SelectValue placeholder="Filtrar por Comarca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Comarcas</SelectItem>
                  {uniqueComarcas.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="w-px h-4 bg-border mx-1"></div>
              <Select value={filterMunicipio} onValueChange={setFilterMunicipio}>
                <SelectTrigger className="h-8 w-[180px] bg-background border-none shadow-none text-xs focus:ring-0">
                  <SelectValue placeholder="Filtrar por Município" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Municípios</SelectItem>
                  {uniqueMunicipios.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Link to="/diagnostico-brigid/novo">
              <Button size="sm">Iniciar Novo Diagnóstico</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : filteredDiagnosticos.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="bg-muted/50 p-4 rounded-full mb-4">
                <SearchX className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                Nenhum diagnóstico encontrado
              </h3>
              <p className="text-muted-foreground max-w-sm">
                {filterMunicipio !== "all"
                  ? `Ainda não existe um diagnóstico para o município de ${filterMunicipio}.`
                  : filterComarca !== "all"
                    ? `Ainda não existem diagnósticos para a comarca de ${filterComarca}.`
                    : "Ainda não existem diagnósticos registrados para a sua unidade."}
              </p>
              <Link to="/diagnostico-brigid/novo" className="mt-6">
                <Button variant="outline">Iniciar Novo Diagnóstico agora</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="[&_th]:bg-primary [&_th]:text-primary-foreground [&_th]:font-semibold border-none">
                    <TableHead className="min-w-[200px]">Promotoria</TableHead>
                    <TableHead className="min-w-[150px]">Município</TableHead>
                    <TableHead>Atribuição</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-center">Completude</TableHead>
                    <TableHead className="min-w-[160px]">Situação</TableHead>
                    <TableHead className="min-w-[140px]">Publicação</TableHead>
                    <TableHead className="text-center">Versão</TableHead>
                    <TableHead className="w-[140px]">Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiagnosticos.map((dgn) => {
                    const editavel = STATUS_EDITAVEIS.includes(dgn.status);
                    return (
                      <TableRow key={dgn.id}>
                        <TableCell>{dgn.promotoria_nome}</TableCell>
                        <TableCell>{dgn.municipio}</TableCell>
                        <TableCell className="text-xs">
                          {dgn.atribuicao.map(rotuloAtribuicao).join(", ")}
                        </TableCell>
                        <TableCell>{dgn.periodo_referencia}</TableCell>
                        <TableCell className="text-center">
                          {dgn.percentual_preenchimento}%
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_DIAGNOSTICO[dgn.status].className}>
                            {STATUS_DIAGNOSTICO[dgn.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {dgn.versao_publicada
                            ? `Versão ${dgn.versao_publicada} publicada`
                            : "Não publicado"}
                        </TableCell>
                        <TableCell className="text-center">{dgn.versao_atual}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(dgn.data_atualizacao).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            to="/diagnostico-brigid/formulario/$diagnosticoId"
                            params={{ diagnosticoId: dgn.id }}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              title={editavel ? "Continuar/Editar" : "Visualizar"}
                            >
                              {editavel ? (
                                <Pencil className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
