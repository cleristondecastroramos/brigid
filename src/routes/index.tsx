import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Lock,
  MapIcon,
  BarChart2,
  Shield,
  Database,
  User,
  AlertCircle,
  FileText,
} from "lucide-react";
import logoMPPI from "@/assets/logo-mppi.png";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { VisitorCounter } from "@/components/VisitorCounter";
import {
  ContainerAnimated,
  ContainerStagger,
  GalleryGrid,
  GalleryGridCell,
} from "@/components/blocks/cta-section-with-gallery";
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
import { Component as Background } from "@/components/ui/background-snippets";

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

  const handleAccessDiagnostico = () => {
    // Optionally login if needed, or simply navigate
    navigate({ to: "/diagnostico-brigid" });
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
    <div className="flex min-h-dvh w-full flex-col relative overflow-hidden font-sans text-foreground">
      <Background />
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
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 md:py-16">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Text and Actions */}
          <ContainerStagger className="flex flex-col text-left">
            <ContainerAnimated className="mb-4">
              <img src="/logo_brigid.png" alt="BRIGID" className="h-16 w-auto object-contain" />
            </ContainerAnimated>

            <ContainerAnimated className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] bg-gradient-to-r from-fuchsia-600 to-rose-500 bg-clip-text text-transparent md:text-sm">
              Projeto Feminicídio Zero
            </ContainerAnimated>

            <ContainerAnimated className="text-4xl font-bold md:text-[2.6rem] tracking-tight text-foreground leading-[1.1]">
              BRÍGID — Base de Referência Integrada para Gestão, Inteligência e Dados
            </ContainerAnimated>

            <ContainerAnimated className="my-6 text-base text-muted-foreground md:text-lg leading-relaxed max-w-xl">
              Plataforma institucional de inteligência territorial e monitoramento estratégico.
              Consolida dados sobre cobertura institucional, fluxos, infraestrutura e indicadores de
              risco para otimizar as políticas públicas nos municípios piauienses e qualificar a
              resposta estatal.
            </ContainerAnimated>

            <ContainerAnimated className="flex flex-col sm:flex-row gap-4 mt-2">
              <Button
                onClick={handleAccessPublic}
                className="h-12 px-8 text-base shadow-sm"
                variant="default"
              >
                Acessar painel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                onClick={handleAccessDiagnostico}
                className="h-12 px-8 text-base shadow-sm"
                variant="secondary"
              >
                Diagnóstico BRIGID
                <FileText className="ml-2 h-4 w-4" />
              </Button>

              <Dialog
                open={openDialog}
                onOpenChange={(isOpen) => {
                  setOpenDialog(isOpen);
                  if (!isOpen) setErrorMsg("");
                }}
              >
                <DialogTrigger asChild>
                  <Button className="h-12 px-8 text-base" variant="outline">
                    Área restrita
                    <Lock className="ml-2 h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] rounded-none border border-border bg-card p-0 shadow-none">
                  <DialogHeader className="bg-primary text-primary-foreground p-5 border-none flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary-foreground/80">
                      Segunda Camada de Segurança
                    </span>
                    <DialogTitle className="text-primary-foreground text-lg font-bold mt-1">
                      Autenticação Administrativa
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleAdminLogin} className="p-6 space-y-5">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Informe as credenciais de acesso para liberar a edição da base e ferramentas
                      de simulação.
                    </p>

                    {errorMsg && (
                      <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label
                        htmlFor="admin_email"
                        className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                      >
                        <User className="h-3.5 w-3.5 text-primary" />
                        E-mail institucional
                      </label>
                      <input
                        type="email"
                        id="admin_email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-none border border-input bg-background px-3.5 py-2 text-sm shadow-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="exemplo@mppi.mp.br"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="admin_password"
                        className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                      >
                        <Lock className="h-3.5 w-3.5 text-primary" />
                        Senha de acesso
                      </label>
                      <input
                        type="password"
                        id="admin_password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
            </ContainerAnimated>
          </ContainerStagger>

          {/* Animated Gallery */}
          <GalleryGrid className="hidden sm:grid">
            {[
              "https://i.postimg.cc/qMjyCWB5/intimus-ilustracao-juntas-06.jpg", // Apoio e união entre mulheres
              "https://i.postimg.cc/wv2TG8rj/pilar-05-tema-01-arte-txt.jpg", // Justiça e direito
              "https://i.postimg.cc/MT5KF2Lz/55182445-2728-40df-921e-bad7f458a394-93463115-m-e1566591750748-810x569-1.jpg", // Mãos que pedem um basta
              "https://i.postimg.cc/26G8KRtm/20210720093526475380u.webp", // Esperança e recomeço
            ].map((imageUrl, index) => (
              <GalleryGridCell index={index} key={index}>
                <img
                  className="size-full object-cover object-center"
                  width="100%"
                  height="100%"
                  src={imageUrl}
                  alt={`Imagem de contexto ${index + 1}`}
                />
              </GalleryGridCell>
            ))}
          </GalleryGrid>
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
