import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  promotoriasService,
  senhaProvisoriaExpirada,
  VALIDADE_PROVISORIA_HORAS,
  type ContaAtivada,
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
import { ArrowLeft, CheckCircle2, Database, KeyRound, Search, UserCheck } from "lucide-react";
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
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Administração de Promotorias
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Defina a atribuição funcional de cada Promotoria e aprove a conta institucional que
            responde por ela. As alterações são gravadas diretamente na base.
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
      <VinculosUsuarios
        promotorias={promotorias}
        onEmailRegistrado={(id, email) =>
          setPromotorias((prev) =>
            prev.map((x) => (x.id === id ? { ...x, email_institucional: email } : x)),
          )
        }
      />
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
  // Última conta aprovada ou redefinida: o painel informa o e-mail e a senha provisória
  const [aviso, setAviso] = useState<
    (ContaAtivada & { tipo: "ativada" | "redefinida"; promotoria: string }) | null
  >(null);
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
      setAviso({ ...r, tipo: "ativada", promotoria: nome });
      onEmailRegistrado(promotoriaId, r.email);
      setNovo({ email: "", promotoria: "" });
      toast.success(
        r.senha_mantida
          ? "Conta vinculada; a senha atual foi mantida."
          : "Cadastro aprovado e ativo.",
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
      setAviso({ ...r, tipo: "redefinida", promotoria: v.promotoria_nome });
      toast.success("Senha redefinida para a senha provisória.");
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
            A conta é criada com a senha provisória padrão, a mesma para todas as Promotorias. Ela é
            exibida aqui após a aprovação, para ser informada à Promotoria.
          </li>
          <li>
            No primeiro acesso, a Promotoria é obrigada a trocar a senha provisória por uma senha
            definitiva antes de usar o Diagnóstico. A troca deve ocorrer em até{" "}
            {VALIDADE_PROVISORIA_HORAS} horas; depois disso, é preciso redefinir a senha.
          </li>
          <li>
            Esquecimento de senha ou troca de titular: use "Redefinir senha". A senha volta a ser a
            provisória e a troca é exigida de novo no próximo acesso.
          </li>
        </ol>
        <p className="mt-2 text-sm text-muted-foreground">
          Como a senha provisória é a mesma para todas as contas, aprove ou redefina somente quando
          a Promotoria estiver pronta para entrar, e peça que confira a data em "Senha definida em".
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
                {aviso.tipo === "ativada" ? "Cadastro ativo" : "Senha redefinida"}
                {aviso.promotoria ? ` — ${aviso.promotoria}` : ""}.
              </p>
              {aviso.senha_mantida ? (
                <p className="text-muted-foreground">
                  A conta <span className="font-medium text-foreground">{aviso.email}</span> já
                  tinha senha definitiva e foi apenas vinculada; a senha não mudou. Se a Promotoria
                  não lembrar a senha, use "Redefinir senha".
                </p>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Informe à Promotoria os dados de acesso ao Diagnóstico BRIGID:
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                    <dt className="text-muted-foreground">E-mail</dt>
                    <dd className="font-medium text-foreground">{aviso.email}</dd>
                    <dt className="text-muted-foreground">Senha provisória</dt>
                    <dd className="font-mono font-medium text-foreground">
                      {aviso.senha_provisoria}
                    </dd>
                  </dl>
                  <p className="text-muted-foreground">
                    No próximo acesso, em até {VALIDADE_PROVISORIA_HORAS} horas, a Promotoria deverá
                    trocar a senha provisória por uma senha definitiva.
                    {aviso.conta_existente &&
                      " A conta já existia: a senha anterior deixou de valer."}
                  </p>
                </>
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
                      ) : v.senha_provisoria && senhaProvisoriaExpirada(v) ? (
                        <Badge variant="outline" className="border-destructive/40 text-destructive">
                          Senha provisória expirada
                        </Badge>
                      ) : v.senha_provisoria ? (
                        <Badge variant="outline">Aguardando troca de senha</Badge>
                      ) : (
                        <Badge className="bg-success text-success-foreground">Ativa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.senha_definida_em
                        ? new Date(v.senha_definida_em).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
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
            <AlertDialogDescription>
              A senha de <strong>{redefinir?.email}</strong> ({redefinir?.promotoria_nome}) volta a
              ser a senha provisória padrão. A senha atual deixa de valer e a Promotoria deverá
              criar uma nova senha no próximo acesso, em até {VALIDADE_PROVISORIA_HORAS} horas.
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
