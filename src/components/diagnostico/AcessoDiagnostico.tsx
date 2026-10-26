import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Lock, LogOut, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Acesso ao módulo de coleta: somente contas criadas pelo CAOCRIM e vinculadas a uma
// Promotoria (ou o próprio CAOCRIM). O vínculo é conferido no banco a cada ação.
export function AcessoDiagnostico() {
  const { loginRespondente } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!email || !password) {
      setErro("Por favor, preencha todos os campos.");
      return;
    }
    setEnviando(true);
    const { error } = await loginRespondente(email, password);
    setEnviando(false);
    if (error) {
      setErro(error);
      return;
    }
    toast.success("Acesso ao módulo de diagnóstico autorizado.");
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <Button variant="outline" size="sm" asChild>
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <div className="mb-1 w-fit text-muted-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Diagnóstico BRIGID</CardTitle>
          <CardDescription>
            Acesso pela conta institucional da Promotoria de Justiça, cadastrada pelo CAOCRIM. No
            primeiro acesso, use a senha provisória informada pelo CAOCRIM; o sistema pedirá uma
            senha definitiva antes de liberar o formulário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={entrar} className="space-y-4">
            {erro && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {erro}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="diag_email" className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-3.5 w-3.5" /> E-mail institucional da Promotoria
              </label>
              <Input
                id="diag_email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="promotoria@mppi.mp.br"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="diag_senha" className="flex items-center gap-1.5 text-sm font-medium">
                <Lock className="h-3.5 w-3.5" /> Senha
              </label>
              <Input
                id="diag_senha"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Verificando..." : "Entrar"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Esqueceu a senha ou houve mudança de titular? Solicite ao CAOCRIM a redefinição: será
              emitida uma nova credencial provisória, e a senha definitiva deverá ser criada no
              próximo acesso.
            </p>
            <p className="text-xs text-muted-foreground">
              As respostas registradas aqui não são publicadas automaticamente: somente diagnósticos
              completos e validados pelo CAOCRIM passam a integrar o painel público.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Exibida no lugar do módulo enquanto a conta não definiu a senha definitiva (primeiro acesso
// ou após redefinição pelo CAOCRIM). O banco também bloqueia os diagnósticos nesse estado, e
// a função de borda confere a credencial, a validade e a conta antes de liberar.
export function TrocaSenhaObrigatoria() {
  const { userEmail, definirSenhaDefinitiva, logout } = useApp();
  const [credencial, setCredencial] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (!credencial.trim()) {
      setErro("Informe a credencial provisória recebida do CAOCRIM.");
      return;
    }
    if (senha.length < 12) {
      setErro("A nova senha deve ter pelo menos 12 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }
    setSalvando(true);
    const { error } = await definirSenhaDefinitiva(credencial, senha);
    setSalvando(false);
    if (error) {
      setErro(error);
      return;
    }
    setCredencial("");
    toast.success("Senha definida. Use a nova senha nos próximos acessos.");
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader>
          <div className="mb-1 w-fit text-muted-foreground">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle>Definir senha definitiva</CardTitle>
          <CardDescription>
            Primeiro acesso da conta{" "}
            <span className="font-medium text-foreground">{userEmail}</span>. Informe a credencial
            provisória recebida do CAOCRIM e defina uma senha definitiva para liberar o acesso ao
            Diagnóstico BRIGID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-4">
            {erro && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {erro}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="credencial_provisoria" className="text-sm font-medium">
                Credencial provisória
              </label>
              <Input
                id="credencial_provisoria"
                type="password"
                autoComplete="current-password"
                value={credencial}
                onChange={(e) => setCredencial(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="nova_senha" className="text-sm font-medium">
                Nova senha
              </label>
              <Input
                id="nova_senha"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo de 12 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirma_senha" className="text-sm font-medium">
                Confirme a nova senha
              </label>
              <Input
                id="confirma_senha"
                type="password"
                autoComplete="new-password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar nova senha"}
            </Button>
            <p className="text-xs text-muted-foreground">
              A senha é da conta institucional da Promotoria. Guarde-a em local seguro; em caso de
              esquecimento, o CAOCRIM pode emitir uma nova credencial provisória.
            </p>
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function SomenteCaocrim({ children }: { children: React.ReactNode }) {
  const { userRole } = useApp();
  if (userRole !== "admin") {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Acesso restrito</p>
        <h1 className="mt-2 text-lg font-semibold">Área exclusiva do CAOCRIM</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta seção é destinada à revisão, validação e administração do Diagnóstico BRIGID.
        </p>
        <Button variant="outline" size="sm" className="mt-6" asChild>
          <Link to="/diagnostico-brigid">Voltar ao módulo</Link>
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}
