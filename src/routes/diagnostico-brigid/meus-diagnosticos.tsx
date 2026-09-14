import React, { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { diagnosticoService, DiagnosticoFormModel } from "@/services/diagnostico-service";
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

  useEffect(() => {
    diagnosticoService.getMyDiagnosticos().then(data => {
      setDiagnosticos(data);
      setLoading(false);
    });
  }, []);

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
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Meus Diagnósticos
        </h1>
        <p className="text-muted-foreground">
          Acompanhe os formulários preenchidos, retome rascunhos ou corrija diagnósticos devolvidos.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Histórico de Preenchimentos</CardTitle>
          <Link to="/diagnostico-brigid/novo">
            <Button size="sm">Iniciar Novo Diagnóstico</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : diagnosticos.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum diagnóstico encontrado para esta unidade.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnosticos.map((dgn) => (
                  <TableRow key={dgn.id}>
                    <TableCell className="font-medium text-xs">{dgn.id}</TableCell>
                    <TableCell>{dgn.municipio}</TableCell>
                    <TableCell>{new Date(dgn.data_atualizacao).toLocaleDateString('pt-BR')} {new Date(dgn.data_atualizacao).toLocaleTimeString('pt-BR')}</TableCell>
                    <TableCell>{getStatusBadge(dgn.status)}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/diagnostico-brigid/formulario/${dgn.id}`}>
                        <Button variant="outline" size="sm">
                          {dgn.status === 'rascunho' || dgn.status === 'devolvido' ? 'Continuar/Editar' : 'Visualizar'}
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
