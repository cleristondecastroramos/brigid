import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Destino dos links de convite e de "Esqueci minha senha": o Supabase abre a sessão a partir
// do link, e a conta da Promotoria define (ou troca) a própria senha.
export const Route = createFileRoute("/diagnostico-brigid/redefinir-senha")({
  component: RedefinirSenhaPage,
});

function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (senha.length < 10) {
      setErro("A senha deve ter pelo menos 10 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);
    if (error) {
      setErro("Não foi possível definir a senha: " + error.message);
      return;
    }
    toast.success("Senha definida. Use-a nos próximos acessos.");
    navigate({ to: "/diagnostico-brigid" });
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader>
          <div className="mb-2 w-fit rounded-xl bg-primary/10 p-3 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle>Definir senha da Promotoria</CardTitle>
          <CardDescription>
            Esta senha dá acesso à conta institucional da Promotoria. Troque-a sempre que houver
            mudança de titular.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="space-y-4">
            {erro && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {erro}
              </div>
            )}
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Nova senha (mínimo de 10 caracteres)"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Confirme a nova senha"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={salvando}>
              {salvando ? "Salvando..." : "Definir senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
