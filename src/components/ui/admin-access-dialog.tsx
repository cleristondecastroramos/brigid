import React, { useState } from "react";
import { ShieldCheck, Lock, ArrowRight, User, AlertCircle, LogOut } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminAccessDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { userRole, loginAdmin, logout, enterPublic, userEmail } = useApp();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    setSubmitting(true);
    const { error } = await loginAdmin(email, password);
    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
      toast.error("Falha na autenticação administrativa.");
      return;
    }

    toast.success("Acesso de Administrador autorizado com sucesso!");
    setOpen(false);
    setEmail("");
    setPassword("");
  };

  const handleLogout = async () => {
    await logout();
    enterPublic();
    toast.info("Sessão administrativa encerrada. Retornando ao acesso público.");
  };

  // If already authenticated as administrator, show the indicator and the logout action button
  if (userRole === "admin") {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 text-[11px] text-white/70 sm:flex">
          <ShieldCheck className="h-3.5 w-3.5" />
          Sessão administrativa
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-sm border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          title="Sair do modo restrito"
        >
          <LogOut className="h-3 w-3" />
          <span>Encerrar sessão</span>
        </button>
      </div>
    );
  }

  // Respondente (Promotor) autenticado no módulo de diagnóstico
  if (userEmail) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden md:inline text-[11px] text-white/70">{userEmail}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-sm border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          title="Encerrar sessão"
        >
          <LogOut className="h-3 w-3" />
          <span>Sair</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          setErrorMsg("");
          setOpen(true);
        }}
        className="flex items-center gap-1.5 rounded-sm border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Acesso restrito</span>
      </button>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setErrorMsg("");
        }}
      >
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4 text-left">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              CAOCRIM
            </span>
            <DialogTitle className="text-base font-semibold">
              Autenticação administrativa
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdminLogin} className="p-6 space-y-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Informe as credenciais de acesso para liberar a edição da base e ferramentas de
              simulação.
            </p>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin_email"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                E-mail institucional
              </label>
              <input
                type="email"
                id="admin_email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="exemplo@mppi.mp.br"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin_password"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Senha de acesso
              </label>
              <input
                type="password"
                id="admin_password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="••••••••"
                required
              />
            </div>

            <DialogFooter className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-muted cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                <span>{submitting ? "Verificando..." : "Confirmar"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
