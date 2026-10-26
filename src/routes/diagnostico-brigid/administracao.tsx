import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  promotoriasService,
  VALIDADE_PROVISORIA_HORAS,
  type ResultadoConta,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Database,
  KeyRound,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { compararTexto } from "@/lib/ordenacao";

const TODAS_COMARCAS = "__todas__";

const dataHora = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

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
  const [comarca, setComarca] = useState(TODAS_COMARCAS);

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

  // Ordem por comarca e, dentro dela, pelo nome da Promotoria
  const ordenadas = useMemo(
    () =>
      [...promotorias].sort(
        (a, b) => compararTexto(a.comarca_sede, b.comarca_sede) || compararTexto(a.nome, b.nome),
      ),
    [promotorias],
  );
  const comarcas = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const p of ordenadas)
      contagem.set(p.comarca_sede, (contagem.get(p.comarca_sede) ?? 0) + 1);
    return [...contagem];
  }, [ordenadas]);

  const termo = busca.trim().toLowerCase();
  const promotoriasFiltradas = ordenadas.filter(
    (p) =>
      (comarca === TODAS_COMARCAS || p.comarca_sede === comarca) &&
      (!termo ||
        p.nome.toLowerCase().includes(termo) ||
        p.comarca_sede.toLowerCase().includes(termo)),
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
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Administração de Promotorias
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Gerencie o cadastro e a atribuição funcional das Promotorias e as contas institucionais
            que respondem por elas. As alterações são gravadas diretamente na base.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJSON}>
            <Database className="mr-2 h-4 w-4" />
            Backup JSON
          </Button>
        </div>
      </div>

      <Tabs defaultValue="cadastro" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cadastro" className="gap-2">
            <Building2 className="h-4 w-4" />
            Cadastro e atribuições
          </TabsTrigger>
          <TabsTrigger value="contas" className="gap-2">
            <Users className="h-4 w-4" />
            Contas e senhas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cadastro" className="space-y-6">
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
                <div className="text-2xl font-bold text-success">
                  {promotorias.length - pendentes}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{pendentes}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Select value={comarca} onValueChange={setComarca}>
                  <SelectTrigger className="md:w-72" aria-label="Filtrar por comarca">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODAS_COMARCAS}>
                      Todas as comarcas ({promotorias.length} Promotorias)
                    </SelectItem>
                    {comarcas.map(([nome, n]) => (
                      <SelectItem key={nome} value={nome}>
                        {nome} ({n})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-1 items-center gap-2">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou comarca..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <span className="text-sm text-muted-foreground md:ml-auto">
                  {promotoriasFiltradas.length} de {promotorias.length} Promotorias, por comarca
                </span>
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
                        <TableHead>Comarca Sede</TableHead>
                        <TableHead>Promotoria de Justiça</TableHead>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead className="min-w-[240px]">E-mail institucional</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[250px]">Atribuição Funcional</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promotoriasFiltradas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhuma Promotoria encontrada com os filtros aplicados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        promotoriasFiltradas.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{p.comarca_sede}</TableCell>
                            <TableCell className="font-medium">{p.nome}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {p.id}
                            </TableCell>
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
                                <Badge
                                  variant="default"
                                  className="bg-success text-success-foreground"
                                >
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
        </TabsContent>

        <TabsContent value="contas">
          <VinculosUsuarios
            promotorias={promotorias}
            onEmailRegistrado={(id, email) =>
              setPromotorias((prev) =>
                prev.map((x) => (x.id === id ? { ...x, email_institucional: email } : x)),
              )
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VinculosUsuarios({
  promotorias,
  onEmailRegistrado,
}: {
  promotorias: Promotoria[];
  onEmailRegistrado: (promotoriaId: string, email: string) => void;
}) {
  const [vinculos, setVinculos] = useState<VinculoAdmin[]>([]);
  const [novo, setNovo] = useState({ email: "", promotoria: "" });
  const [salvando, setSalvando] = useState(false);
  // Resultado da última aprovação ou redefinição. A credencial provisória fica só neste
  // estado da tela (nunca em localStorage) e some ao fechar o aviso ou sair da página.
  const [aviso, setAviso] = useState<(ResultadoConta & { promotoria: string }) | null>(null);
  const [redefinir, setRedefinir] = useState<VinculoAdmin | null>(null);

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

  const ativar = async (promotoriaId: string, email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Informe um e-mail válido para a Promotoria.");
      return;
    }
    setSalvando(true);
    try {
      const r = await promotoriasService.ativarConta(promotoriaId, email);
      const nome = promotorias.find((p) => p.id === promotoriaId)?.nome ?? "";
      setAviso({ ...r, promotoria: nome });
      onEmailRegistrado(promotoriaId, r.email);
      setNovo({ email: "", promotoria: "" });
      toast.success(
        r.credencial_provisoria
          ? "Cadastro aprovado e ativo."
          : "Vínculo registrado; a senha da conta não foi alterada.",
      );
      await carregar();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarRedefinicao = async () => {
    if (!redefinir) return;
    const v = redefinir;
    setRedefinir(null);
    setSalvando(true);
    try {
      const r = await promotoriasService.redefinirSenha(v.user_id);
      setAviso({ ...r, promotoria: v.promotoria_nome });
      toast.success("Nova credencial provisória emitida.");
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
          e-mail pessoal do titular. Nenhum e-mail é enviado pelo sistema: o CAOCRIM informa os
          dados de acesso à Promotoria.
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Escolha a Promotoria, informe o e-mail institucional e clique em "Aprovar e ativar
            cadastro".
          </li>
          <li>
            A conta nova recebe uma credencial provisória individual, gerada pelo sistema e exibida
            uma única vez, aqui, logo após a aprovação. Entregue-a somente à Promotoria, por canal
            seguro.
          </li>
          <li>
            No primeiro acesso, a Promotoria informa a credencial e define uma senha definitiva
            antes de usar o Diagnóstico. A credencial vale por {VALIDADE_PROVISORIA_HORAS} horas;
            depois disso, é preciso redefinir a senha.
          </li>
          <li>
            Aprovar de novo ou vincular uma conta existente não altera a senha. Esquecimento de
            senha ou troca de titular: use "Redefinir senha", que emite uma nova credencial.
          </li>
        </ol>
        <p className="mt-2 text-sm text-muted-foreground">
          Aprove ou redefina somente quando a Promotoria estiver pronta para entrar, e peça que
          confira a data em "Senha definida em" após o primeiro acesso.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid gap-2 md:grid-cols-[1.5fr_1fr_auto]">
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
            <SelectTrigger aria-label="Promotoria">
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
            type="email"
            aria-label="E-mail institucional da Promotoria"
            placeholder="E-mail institucional da Promotoria"
            value={novo.email}
            onChange={(e) => setNovo((n) => ({ ...n, email: e.target.value }))}
          />
          <Button
            onClick={() => ativar(novo.promotoria, novo.email)}
            disabled={salvando || !novo.email || !novo.promotoria}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            {salvando ? "Processando..." : "Aprovar e ativar cadastro"}
          </Button>
        </div>

        {aviso && (
          <div
            role="status"
            className="flex gap-3 rounded-md border border-success/40 bg-success/10 p-4 text-sm"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {aviso.situacao === "redefinida" ? "Senha redefinida" : "Cadastro ativo"}
                {aviso.promotoria ? ` — ${aviso.promotoria}` : ""}.
              </p>
              {aviso.credencial_provisoria ? (
                <>
                  <p className="text-muted-foreground">
                    Entregue à Promotoria, por canal seguro, os dados de acesso ao Diagnóstico
                    BRIGID. A credencial é exibida só agora e não poderá ser consultada depois.
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                    <dt className="text-muted-foreground">E-mail</dt>
                    <dd className="font-medium text-foreground">{aviso.email}</dd>
                    <dt className="text-muted-foreground">Credencial provisória</dt>
                    <dd className="font-mono font-medium text-foreground">
                      {aviso.credencial_provisoria}
                    </dd>
                    <dt className="text-muted-foreground">Válida até</dt>
                    <dd className="text-foreground">{dataHora(aviso.expira_em)}</dd>
                  </dl>
                  <p className="text-muted-foreground">
                    No primeiro acesso, a Promotoria informa a credencial e define a senha
                    definitiva.
                    {aviso.situacao === "redefinida" &&
                      (aviso.sessoes_encerradas
                        ? " As sessões abertas da conta foram encerradas."
                        : " Não foi possível encerrar as sessões abertas; elas continuam sem acesso aos diagnósticos.")}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  A conta <span className="font-medium text-foreground">{aviso.email}</span> foi
                  vinculada e a senha não foi alterada.{" "}
                  {aviso.situacao === "senha_preservada" &&
                    'A conta já tem senha definitiva. Se a Promotoria não lembrar a senha, use "Redefinir senha".'}
                  {aviso.situacao === "provisoria_preservada" &&
                    `A conta aguarda o primeiro acesso com a credencial já entregue, válida até ${dataHora(aviso.expira_em)}. Se ela se perdeu, use "Redefinir senha".`}
                  {aviso.situacao === "provisoria_expirada" &&
                    'A credencial provisória da conta expirou: use "Redefinir senha" para emitir uma nova.'}
                  {aviso.situacao === "provisoria_legada" &&
                    'A conta ainda usa a senha provisória compartilhada antiga, que não é mais aceita: use "Redefinir senha" para emitir uma credencial individual.'}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAviso(null)}
              className="ml-auto self-start text-xs text-muted-foreground hover:text-foreground"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta (e-mail)</TableHead>
                <TableHead>Promotoria</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Senha definida em</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {vinculos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                    Nenhuma conta cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                vinculos.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-sm">{v.email}</TableCell>
                    <TableCell className="text-sm">{v.promotoria_nome}</TableCell>
                    <TableCell>
                      {!v.ativo ? (
                        <Badge variant="outline">Inativa</Badge>
                      ) : v.senha_provisoria && !v.credencial_individual ? (
                        <Badge variant="outline" className="border-destructive/40 text-destructive">
                          Senha compartilhada antiga: redefinir
                        </Badge>
                      ) : v.senha_provisoria && v.senha_provisoria_expirada ? (
                        <Badge variant="outline" className="border-destructive/40 text-destructive">
                          Credencial provisória expirada
                        </Badge>
                      ) : v.senha_provisoria ? (
                        <Badge
                          variant="outline"
                          title={`Credencial emitida em ${dataHora(v.senha_provisoria_em)}, válida até ${dataHora(v.senha_provisoria_expira_em)}`}
                        >
                          Aguardando primeiro acesso
                        </Badge>
                      ) : (
                        <Badge className="bg-success text-success-foreground">Ativa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.senha_definida_em ? dataHora(v.senha_definida_em) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.ultimo_acesso
                        ? new Date(v.ultimo_acesso).toLocaleDateString("pt-BR")
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {v.ativo ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={salvando}
                            onClick={() => setRedefinir(v)}
                          >
                            <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Redefinir senha
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => desativar(v.id)}>
                            Desativar
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={salvando}
                          onClick={() => ativar(v.promotoria_id, v.email)}
                        >
                          Reativar
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

      <AlertDialog open={redefinir !== null} onOpenChange={(o) => !o && setRedefinir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir a senha da Promotoria?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Conta afetada: <strong>{redefinir?.email}</strong>. A senha atual deixa de valer,
                  as sessões abertas são encerradas e uma nova credencial provisória individual é
                  emitida, válida por {VALIDADE_PROVISORIA_HORAS} horas. A Promotoria deverá definir
                  uma nova senha antes de voltar a usar o Diagnóstico.
                </p>
                <p>
                  A redefinição vale para a conta inteira, inclusive em todos os seus vínculos:{" "}
                  {vinculos
                    .filter((x) => x.user_id === redefinir?.user_id)
                    .map((x) => x.promotoria_nome)
                    .join("; ")}
                  .
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarRedefinicao}>Redefinir senha</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
