import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

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

  // O link chega à caixa institucional da Promotoria: o novo titular redefine a senha sozinho
  const esqueciSenha = async () => {
    setErro("");
    if (!email) {
      setErro("Informe o e-mail institucional da Promotoria para receber o link.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/diagnostico-brigid/redefinir-senha`,
    });
    setEnviando(false);
    if (error) {
      setErro("Não foi possível enviar o link agora. Tente novamente em alguns minutos.");
      return;
    }
    toast.success("Se o e-mail estiver cadastrado, o link para definir a senha foi enviado.");
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
          <div className="mb-2 w-fit rounded-xl bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Diagnóstico BRIGID</CardTitle>
          <CardDescription>
            Acesso pela conta institucional da Promotoria de Justiça, cadastrada pelo CAOCRIM. Em
            caso de mudança de titular, use "Esqueci minha senha" para definir uma nova senha.
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
            <button
              type="button"
              onClick={esqueciSenha}
              disabled={enviando}
              className="w-full text-center text-sm text-primary hover:underline"
            >
              Esqueci minha senha
            </button>
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
