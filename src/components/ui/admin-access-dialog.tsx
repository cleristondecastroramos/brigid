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
  const { userRole, login, logout } = useApp();

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    // Admin validation logic matching the project's strategy
    if (email.toLowerCase().trim() === "caocrim@mppi.mp.br") {
      login("admin");
      toast.success("Acesso de Administrador autorizado com sucesso!");
      setOpen(false);
      setEmail("");
      setPassword("");
    } else {
      setErrorMsg("Credenciais de administrador inválidas. Verifique os dados informados.");
      toast.error("Falha na autenticação administrativa.");
    }
  };

  const handleLogout = () => {
    logout();
    toast.info("Sessão administrativa encerrada. Retornando ao acesso público.");
  };

  // If already authenticated as administrator, show the indicator and the logout action button
  if (userRole === "admin") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-none border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Sessão Admin Ativa
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-none border border-white/20 bg-white/10 px-3 py-1.5 text-white shadow-none hover:bg-white/20 transition-all font-medium uppercase tracking-wide text-[10px] cursor-pointer"
          title="Sair do modo restrito"
        >
          <LogOut className="h-3 w-3" />
          <span>Sair do modo restrito</span>
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
        className="group flex items-center gap-1.5 rounded-none border border-white/20 bg-white/10 px-3 py-1.5 shadow-none hover:bg-white/20 transition-all cursor-pointer"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-white" />
        <span className="font-semibold text-white tracking-wide uppercase text-[10px]">
          Acesso Restrito
        </span>
      </button>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setErrorMsg("");
        }}
      >
        <DialogContent className="sm:max-w-[400px] border border-purple-100 dark:border-purple-950 bg-background/98 backdrop-blur-md rounded-2xl p-0 overflow-hidden shadow-2xl">
          {/* Header styled with the brand color */}
          <DialogHeader className="bg-gradient-to-r from-[#2e1065] via-[#3b0764] to-[#1e0a3c] text-white p-5 border-none flex flex-col text-left">
            <span className="text-[10px] uppercase font-bold tracking-widest text-purple-200/80">
              Segunda Camada de Segurança
            </span>
            <DialogTitle className="text-white text-lg font-bold mt-1">
              Autenticação Administrativa
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdminLogin} className="p-6 space-y-5">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Informe as credenciais de acesso para liberar a edição da base e ferramentas de
              simulação.
            </p>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 p-3 text-xs text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin_email"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <User className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                E-mail institucional
              </label>
              <input
                type="email"
                id="admin_email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-input bg-background/50 px-3.5 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition-colors"
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
                <Lock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                Senha de acesso
              </label>
              <input
                type="password"
                id="admin_password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-input bg-background/50 px-3.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <DialogFooter className="flex justify-end gap-2.5 pt-3 border-t border-purple-100/10">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-[#2e1065] hover:bg-[#1e0a3c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-md hover:shadow cursor-pointer"
              >
                <span>Confirmar</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
