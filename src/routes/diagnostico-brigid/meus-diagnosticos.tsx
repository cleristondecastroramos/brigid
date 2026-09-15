import React, { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Eye, ArrowLeft, Filter, SearchX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { municipiosQueryOptions } from "@/lib/data-fetching";
import { diagnosticoService, DiagnosticoFormModel } from "@/services/diagnostico-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/diagnostico-brigid/meus-diagnosticos")({
  component: MeusDiagnosticosPage,
});

function MeusDiagnosticosPage() {
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoFormModel[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterMunicipio, setFilterMunicipio] = useState<string>("all");
  const [filterComarca, setFilterComarca] = useState<string>("all");

  const { data: municipiosData } = useQuery(municipiosQueryOptions);

  const comarcaByMunicipio = useMemo(() => {
    const map: Record<string, string> = {};
    if (municipiosData) {
      municipiosData.forEach(m => {
        map[m.municipio] = m.comarca;
      });
    }
    return map;
  }, [municipiosData]);

  useEffect(() => {
    diagnosticoService.getMyDiagnosticos().then(data => {
      setDiagnosticos(data);
      setLoading(false);
    });
  }, []);

  const { filteredDiagnosticos, uniqueMunicipios, uniqueComarcas } = useMemo(() => {
    let result = [...diagnosticos];

    // Build unique lists from all available database municipalities
    const munis = new Set<string>();
    const comarcas = new Set<string>();
    if (municipiosData) {
      municipiosData.forEach(m => {
        if (m.municipio) munis.add(m.municipio);
        if (m.comarca) comarcas.add(m.comarca);
      });
    }

    if (filterMunicipio !== 'all') {
      result = result.filter(d => d.municipio === filterMunicipio);
    }
    if (filterComarca !== 'all') {
      result = result.filter(d => {
        const c = d.comarca || comarcaByMunicipio[d.municipio || ""];
        return c === filterComarca;
      });
    }

    return { 
      filteredDiagnosticos: result, 
      uniqueMunicipios: Array.from(munis).sort((a, b) => a.localeCompare(b)), 
      uniqueComarcas: Array.from(comarcas).sort((a, b) => a.localeCompare(b)) 
    };
  }, [diagnosticos, filterMunicipio, filterComarca, municipiosData, comarcaByMunicipio]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho': return <Badge variant="secondary">Rascunho</Badge>;
      case 'concluido': return <Badge variant="default" className="bg-success text-success-foreground hover:bg-success/80">Aguardando Validação</Badge>;
      case 'validacao': return <Badge variant="default" className="bg-warning text-warning-foreground hover:bg-warning/80">Em Validação CAOCRIM</Badge>;
      case 'devolvido': return <Badge variant="destructive">Devolvido para Correção</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/diagnostico-brigid">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Meus Diagnósticos
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Acompanhe os formulários preenchidos, retome rascunhos ou corrija diagnósticos devolvidos.
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
                  {uniqueComarcas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="w-px h-4 bg-border mx-1"></div>
              <Select value={filterMunicipio} onValueChange={setFilterMunicipio}>
                <SelectTrigger className="h-8 w-[180px] bg-background border-none shadow-none text-xs focus:ring-0">
                  <SelectValue placeholder="Filtrar por Município" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Municípios</SelectItem>
                  {uniqueMunicipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
              <h3 className="text-lg font-medium text-foreground mb-1">Nenhum diagnóstico encontrado</h3>
              <p className="text-muted-foreground max-w-sm">
                {filterMunicipio !== 'all' 
                  ? `Ainda não existe um diagnóstico em andamento para o município de ${filterMunicipio}.` 
                  : filterComarca !== 'all' 
                    ? `Ainda não existem diagnósticos em andamento para a comarca de ${filterComarca}.` 
                    : 'Ainda não existem diagnósticos registrados para a sua unidade.'}
              </p>
              <Link to="/diagnostico-brigid/novo" className="mt-6">
                <Button variant="outline">Iniciar Novo Diagnóstico agora</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="[&_th]:bg-primary [&_th]:text-primary-foreground [&_th]:font-semibold border-none">
                  <TableHead className="whitespace-nowrap">ID</TableHead>
                  <TableHead className="min-w-[200px]">Promotoria</TableHead>
                  <TableHead className="min-w-[150px]">Município</TableHead>
                  <TableHead className="text-center w-[120px]">Preenchimento</TableHead>
                  <TableHead className="w-[160px]">Última Atualização</TableHead>
                  <TableHead className="w-[160px]">Status</TableHead>
                  <TableHead className="text-right w-[140px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiagnosticos.map((dgn) => (
                  <TableRow key={dgn.id}>
                    <TableCell className="font-medium text-xs whitespace-nowrap">{dgn.id}</TableCell>
                    <TableCell>{dgn.promotoria_nome}</TableCell>
                    <TableCell>{dgn.municipio}</TableCell>
                    <TableCell className="text-center">{dgn.percentual_preenchimento !== undefined ? `${dgn.percentual_preenchimento}%` : '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(dgn.data_atualizacao).toLocaleDateString('pt-BR')} <br/> {new Date(dgn.data_atualizacao).toLocaleTimeString('pt-BR')}</TableCell>
                    <TableCell>{getStatusBadge(dgn.status)}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/diagnostico-brigid/formulario/${dgn.id}`}>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          title={dgn.status === 'rascunho' || dgn.status === 'devolvido' ? 'Continuar/Editar' : 'Visualizar'}
                        >
                          {dgn.status === 'rascunho' || dgn.status === 'devolvido' ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
