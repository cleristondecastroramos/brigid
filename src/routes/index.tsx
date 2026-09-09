import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, MapIcon, BarChart2, Shield, Database, User, AlertCircle } from "lucide-react";
import logoMPPI from "@/assets/logo-mppi.png";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { VisitorCounter } from "@/components/VisitorCounter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  const handleAccessPublic = () => {
    login("public");
    toast.success("Acesso ao painel público carregado com sucesso.");
    navigate({ to: "/apresentacao-do-sistema" });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    if (email.toLowerCase().trim() === "caocrim@mppi.mp.br") {
      login("admin");
      toast.success("Acesso de Administrador autorizado com sucesso!");
      setOpenDialog(false);
      setEmail("");
      setPassword("");
      navigate({ to: "/apresentacao-do-sistema" });
    } else {
      setErrorMsg("Credenciais de administrador inválidas. Verifique os dados informados.");
      toast.error("Falha na autenticação administrativa.");
    }
  };

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background font-sans text-foreground">
      {/* Header institucional */}
      <header className="flex w-full items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <img src={logoMPPI} alt="MPPI" className="h-12 w-auto object-contain" />
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Ministério Público do Estado do Piauí
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">
              CAOCRIM / Projeto Feminicídio Zero
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 md:py-20">
        <div className="flex w-full max-w-4xl flex-col items-center text-center">
          <img src="/logo_brigid.png" alt="BRIGID" className="mb-8 h-32 w-auto object-contain" />
          
          <h1 className="mb-4 text-3xl font-bold uppercase tracking-tight text-primary md:text-4xl">
            BRÍGID — Sistema de Monitoramento Integrado e Prevenção ao Feminicídio
          </h1>
          
          <p className="mb-10 max-w-2xl text-base text-muted-foreground md:text-lg">
            Plataforma institucional de inteligência territorial e monitoramento estratégico. Consolida dados sobre cobertura institucional, fluxos, infraestrutura e indicadores de risco para otimizar as políticas públicas nos municípios piauienses e qualificar a resposta estatal.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row mb-16 w-full max-w-md justify-center">
            <Button onClick={handleAccessPublic} className="w-full sm:w-auto h-12 px-8 text-base" variant="default">
              Acessar painel
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Dialog open={openDialog} onOpenChange={(isOpen) => {
              setOpenDialog(isOpen);
              if (!isOpen) setErrorMsg('');
            }}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-12 px-8 text-base" variant="outline">
                  Área restrita
                  <Lock className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] rounded-none border border-border bg-card p-0 shadow-none">
                <DialogHeader className="bg-primary text-primary-foreground p-5 border-none flex flex-col text-left">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary-foreground/80">Segunda Camada de Segurança</span>
                  <DialogTitle className="text-primary-foreground text-lg font-bold mt-1">Autenticação Administrativa</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleAdminLogin} className="p-6 space-y-5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Informe as credenciais de acesso para liberar a edição da base e ferramentas de simulação.
                  </p>

                  {errorMsg && (
                    <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label htmlFor="admin_email" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      E-mail institucional
                    </label>
                    <input
                      type="email"
                      id="admin_email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="block w-full rounded-none border border-input bg-background px-3.5 py-2 text-sm shadow-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="exemplo@mppi.mp.br"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="admin_password" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      Senha de acesso
                    </label>
                    <input
                      type="password"
                      id="admin_password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="block w-full rounded-none border border-input bg-background px-3.5 py-2 text-sm shadow-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <DialogFooter className="flex justify-end gap-2.5 pt-3 border-t border-border mt-4">
                    <Button
                      type="button"
                      onClick={() => setOpenDialog(false)}
                      variant="secondary"
                    >
                      Cancelar
                    </Button>

                    <Button type="submit" variant="default">
                      Confirmar
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Módulos Principais */}
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 border-t border-border pt-12 text-left">
            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center bg-muted text-primary">
                <MapIcon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold uppercase text-foreground">Monitoramento Territorial</h3>
              <p className="text-xs text-muted-foreground">Mapeamento georreferenciado e inteligência analítica municipal.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center bg-muted text-primary">
                <BarChart2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold uppercase text-foreground">Indicadores</h3>
              <p className="text-xs text-muted-foreground">Painéis de controle com métricas e índices de risco.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center bg-muted text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold uppercase text-foreground">Rede de Proteção</h3>
              <p className="text-xs text-muted-foreground">Dados estruturais e de capacidade de atendimento institucional.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center bg-muted text-primary">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold uppercase text-foreground">Gestão da Base</h3>
              <p className="text-xs text-muted-foreground">Administração de dados, ponderação de pesos e auditoria.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex w-full flex-col items-center justify-between border-t border-border bg-card px-6 py-4 sm:flex-row">
        <span className="text-xs text-muted-foreground mb-4 sm:mb-0">
          © {new Date().getFullYear()} Ministério Público do Estado do Piauí.
        </span>
        <VisitorCounter />
      </footer>
    </div>
  );
}
