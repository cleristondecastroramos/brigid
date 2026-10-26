import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  promotoriasService,
  type Promotoria,
  type VinculoAdmin,
} from "@/services/promotorias-service";
import { SomenteCaocrim } from "@/components/diagnostico/AcessoDiagnostico";
import { ATRIBUICOES } from "@/lib/dicionario-diagnostico";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/diagnostico-brigid/administracao")({
  component: () => (
    <SomenteCaocrim>
      <AdministracaoPage />
    </SomenteCaocrim>
  ),
});

function AdministracaoPage() {
  const [promotorias, setPromotorias] = useState<Promotoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarPromotorias();
  }, []);

  const carregarPromotorias = async () => {
    try {
      setPromotorias(await promotoriasService.listarPromotorias());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarAtribuicao = async (id: string, novaAtribuicao: string) => {
    try {
      await promotoriasService.atualizarAtribuicao(id, novaAtribuicao);
    } catch (e) {
      toast.error((e as Error).message);
      return;
    }

    // Atualizar apenas a linha na UI sem reload completo
    setPromotorias((prev) =>
      prev.map((p) => (p.id === id ? { ...p, tipo_atribuicao: novaAtribuicao } : p)),
    );
    toast.success("Atribuição atualizada com sucesso.");
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

  const promotoriasFiltradas = promotorias.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.comarca_sede.toLowerCase().includes(busca.toLowerCase()),
  );

  const pendentes = promotorias.filter((p) => p.tipo_atribuicao === "pendente_configuracao").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/diagnostico-brigid">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Administração de Promotorias
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Defina a atribuição funcional de cada Promotoria e vincule os usuários autorizados a
            responder por ela. As alterações são gravadas diretamente na base.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJSON}>
            <Database className="mr-2 h-4 w-4" />
            Backup JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Promotorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promotorias.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Configuradas
            </CardTitle>
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
                    <TableHead className="min-w-[240px]">E-mail institucional</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[250px]">Atribuição Funcional</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotoriasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma promotoria encontrada na busca.
                      </TableCell>
                    </TableRow>
                  ) : (
                    promotoriasFiltradas.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {p.id}
                        </TableCell>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell>{p.comarca_sede}</TableCell>
                        <TableCell>
                          <EmailInstitucional
                            promotoria={p}
                            onSalvo={(email) =>
                              setPromotorias((prev) =>
                                prev.map((x) =>
                                  x.id === p.id ? { ...x, email_institucional: email } : x,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {p.tipo_atribuicao === "pendente_configuracao" ? (
                            <Badge variant="destructive">Pendente</Badge>
                          ) : (
                            <Badge variant="default" className="bg-success text-success-foreground">
                              Configurada
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={p.tipo_atribuicao}
                            onValueChange={(val) => handleAtualizarAtribuicao(p.id, val)}
                          >
                            <SelectTrigger
                              className={
                                p.tipo_atribuicao === "pendente_configuracao"
                                  ? "border-destructive"
                                  : ""
                              }
                            >
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente_configuracao">Pendente</SelectItem>
                              {ATRIBUICOES.map((a) => (
                                <SelectItem key={a.value} value={a.value}>
                                  {a.label}
                                </SelectItem>
                              ))}
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
      <VinculosUsuarios promotorias={promotorias} />
    </div>
  );
}

function VinculosUsuarios({ promotorias }: { promotorias: Promotoria[] }) {
  const [vinculos, setVinculos] = useState<VinculoAdmin[]>([]);
  const [novo, setNovo] = useState({ email: "", promotoria: "", descricao: "" });
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    try {
      setVinculos(await promotoriasService.listarVinculos());
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const vincular = async () => {
    setSalvando(true);
    try {
      await promotoriasService.vincularUsuario(novo.email, novo.promotoria, novo.descricao);
      toast.success("Conta vinculada à Promotoria.");
      setNovo({ email: "", promotoria: "", descricao: "" });
      await carregar();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  const desativar = async (id: number) => {
    try {
      await promotoriasService.desativarVinculo(id);
      await carregar();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base">Contas das Promotorias</CardTitle>
        <p className="text-sm text-muted-foreground">
          O acesso ao formulário é feito pela conta do e-mail institucional da Promotoria, não pelo
          e-mail pessoal do titular. Crie as contas em lote com{" "}
          <code className="text-xs">scripts/convidar-contas-promotorias.mjs</code> ou, uma a uma, em
          Authentication &gt; Users no Supabase, e vincule-as aqui. Na troca de titular não é
          preciso alterar nada: o novo titular redefine a senha pelo próprio e-mail institucional.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid gap-2 md:grid-cols-[1.5fr_1fr_1fr_auto]">
          <Select
            value={novo.promotoria}
            onValueChange={(v) =>
              setNovo((n) => ({
                ...n,
                promotoria: v,
                email: promotorias.find((p) => p.id === v)?.email_institucional ?? n.email,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Promotoria" />
            </SelectTrigger>
            <SelectContent>
              {promotorias.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="E-mail institucional da Promotoria"
            value={novo.email}
            onChange={(e) => setNovo((n) => ({ ...n, email: e.target.value }))}
          />
          <Input
            placeholder="Descrição (opcional)"
            value={novo.descricao}
            onChange={(e) => setNovo((n) => ({ ...n, descricao: e.target.value }))}
          />
          <Button onClick={vincular} disabled={salvando || !novo.email || !novo.promotoria}>
            <UserPlus className="mr-2 h-4 w-4" /> Vincular
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta (e-mail)</TableHead>
                <TableHead>Promotoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vinculos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Nenhum vínculo cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                vinculos.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm">{v.email}</TableCell>
                    <TableCell className="text-sm">{v.promotoria_nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.nome_responsavel ?? "—"}
                    </TableCell>
                    <TableCell>
                      {v.ativo ? (
                        <Badge className="bg-success text-success-foreground">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {v.ativo && (
                        <Button variant="ghost" size="sm" onClick={() => desativar(v.id)}>
                          Desativar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function EmailInstitucional({
  promotoria,
  onSalvo,
}: {
  promotoria: Promotoria;
  onSalvo: (email: string | null) => void;
}) {
  const [valor, setValor] = useState(promotoria.email_institucional ?? "");
  const original = promotoria.email_institucional ?? "";

  const salvar = async () => {
    const novo = valor.trim().toLowerCase();
    if (novo === original) return;
    if (novo && !/^[^s@]+@[^s@]+.[^s@]+$/.test(novo)) {
      toast.error("E-mail institucional inválido.");
      setValor(original);
      return;
    }
    try {
      await promotoriasService.atualizarEmailInstitucional(promotoria.id, novo);
      onSalvo(novo || null);
      toast.success("E-mail institucional atualizado.");
    } catch (e) {
      toast.error((e as Error).message);
      setValor(original);
    }
  };

  return (
    <Input
      className="h-8 text-xs"
      placeholder="promotoria@mppi.mp.br"
      value={valor}
      onChange={(e) => setValor(e.target.value)}
      onBlur={salvar}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}
