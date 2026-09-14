import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { promotoriasService } from "@/services/promotorias-service";
import { Promotoria } from "@/data/promotorias-seed";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Database, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/diagnostico-brigid/administracao")({
  component: AdministracaoPage,
});

function AdministracaoPage() {
  const [promotorias, setPromotorias] = useState<Promotoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarPromotorias();
  }, []);

  const carregarPromotorias = async () => {
    const dados = await promotoriasService.listarPromotorias();
    setPromotorias(dados);
    setLoading(false);
  };

  const handleAtualizarAtribuicao = async (id: string, novaAtribuicao: string) => {
    await promotoriasService.atualizarAtribuicao(id, novaAtribuicao);
    
    // Atualizar apenas a linha na UI sem reload completo
    setPromotorias(prev => prev.map(p => 
      p.id === id ? { ...p, tipo_atribuicao: novaAtribuicao } : p
    ));
    toast.success("Atribuição atualizada com sucesso.");
  };

  const handleExportSQL = async () => {
    const sql = await promotoriasService.exportarScriptSql();
    baixarArquivo("update_atribuicoes.sql", sql, "text/plain");
    toast.success("Script SQL exportado.");
  };

  const handleExportJSON = async () => {
    const json = await promotoriasService.exportarBackupJson();
    baixarArquivo("backup_promotorias.json", json, "application/json");
    toast.success("Backup JSON exportado.");
  };

  const baixarArquivo = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const promotoriasFiltradas = promotorias.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.comarca_sede.toLowerCase().includes(busca.toLowerCase())
  );

  const pendentes = promotorias.filter(p => p.tipo_atribuicao === "pendente_configuracao").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Administração de Promotorias
          </h1>
          <p className="text-muted-foreground mt-1">
            Defina a atribuição funcional de cada Promotoria para habilitar os blocos do formulário automaticamente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJSON}>
            <Database className="mr-2 h-4 w-4" />
            Backup JSON
          </Button>
          <Button onClick={handleExportSQL}>
            <Download className="mr-2 h-4 w-4" />
            Exportar SQL
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Promotorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promotorias.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Configuradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{promotorias.length - pendentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{pendentes}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou comarca..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando lista...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Promotoria de Justiça</TableHead>
                    <TableHead>Comarca Sede</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[250px]">Atribuição Funcional</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotoriasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma promotoria encontrada na busca.
                      </TableCell>
                    </TableRow>
                  ) : (
                    promotoriasFiltradas.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell>{p.comarca_sede}</TableCell>
                        <TableCell>
                          {p.tipo_atribuicao === 'pendente_configuracao' ? (
                            <Badge variant="destructive">Pendente</Badge>
                          ) : (
                            <Badge variant="default" className="bg-success text-success-foreground">Configurada</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={p.tipo_atribuicao} 
                            onValueChange={(val) => handleAtualizarAtribuicao(p.id, val)}
                          >
                            <SelectTrigger className={p.tipo_atribuicao === 'pendente_configuracao' ? 'border-destructive' : ''}>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente_configuracao">Pendente</SelectItem>
                              <SelectItem value="civel">Cidadania/Cível</SelectItem>
                              <SelectItem value="criminal">Criminal</SelectItem>
                              <SelectItem value="cumulativa">Cumulativa</SelectItem>
                              <SelectItem value="unica">Promotoria Única</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
