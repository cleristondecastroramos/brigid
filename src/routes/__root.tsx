import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouterState,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { Suspense, useState, useEffect } from "react";
import { Sun, Moon, ShieldCheck } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import logo from "@/assets/logo-mppi.png";
import { AppProvider, useApp } from "@/context/AppContext";
import AdminAccessDialog from "@/components/ui/admin-access-dialog";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">BRIGID</p>
        <h1 className="mt-2 text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Página não encontrada na base institucional.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Voltar à Apresentação do Sistema
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">BRIGID</p>
        <h1 className="mt-2 text-lg font-semibold text-foreground">Erro ao carregar a base</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  );
}

const FAVICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><path d='M24 3 L42 9 V24 C42 34 34 42 24 45 C14 42 6 34 6 24 V9 Z' fill='%236B21A8'/><text x='24' y='31' text-anchor='middle' font-family='Georgia,serif' font-size='22' font-weight='700' fill='white'>B</text></svg>";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const PAGE_TITLES: Record<string, string> = {
  "/": "Apresentação do Sistema",
  "/apresentacao-do-sistema": "Apresentação do Sistema",
  "/diagnostico": "Diagnóstico da Rede e Fluxos",
  "/opm": "Cobertura de OPMs",
  "/creas": "Cobertura de CREAS",
  "/risco": "Risco de Feminicídio",
  "/territorio": "Inteligência Territorial",
  "/municipios": "Municípios",
  "/gestao": "Gestão do Projeto",
  "/relatorios": "Relatórios e Exportações",
  "/pesos": "Ponderação e Simulação de Pesos",
  "/diagnostico-brigid": "Diagnóstico BRIGID",
};

function PageHeader() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  let title = PAGE_TITLES[pathname];
  if (!title) {
    if (pathname.startsWith("/municipios/")) title = "Ficha Territorial";
    else title = "BRIGID";
  }
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-[var(--color-sidebar)] px-4 transition-colors m-0 p-0 border-t-0 w-full">
      {!pathname.startsWith("/diagnostico-brigid") && (
        <SidebarTrigger className="-ml-1 text-white/80 hover:text-white" />
      )}

      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center">
          <img src="/logo_brigid.png" alt="BRIGID" className="h-full w-full object-contain" />
        </div>
        <span className="font-bold text-xs tracking-wider text-white hidden sm:inline">BRIGID</span>
        <div className="h-4 w-[1px] bg-white/20 hidden sm:block" />
        <span className="text-[11px] font-semibold text-white/75 tracking-wide">{title}</span>
      </div>

      <div className="ml-auto flex items-center gap-3 text-xs">
        <AdminAccessDialog />

        <button
          onClick={toggleTheme}
          className="inline-flex h-8 w-8 items-center justify-center border border-white/20 bg-white/10 text-white shadow-none transition-all hover:bg-white/20"
          title={theme === "light" ? "Mudar para modo escuro" : "Mudar para modo claro"}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <RootInner />
      </AppProvider>
    </QueryClientProvider>
  );
}

function RootInner() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { userRole } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if ((pathname === "/pesos" || pathname === "/base") && userRole !== "admin") {
      navigate({ to: "/apresentacao-do-sistema" });
      toast.warning("Acesso restrito. Autentique-se como administrador para acessar essa área.");
    }
  }, [pathname, userRole, navigate]);

  const isLandingPage = pathname === "/";
  const isDiagnosticoBrigid = pathname.startsWith("/diagnostico-brigid");

  if (isLandingPage || isDiagnosticoBrigid) {
    return (
      <>
        <Suspense fallback={<div className="min-h-dvh bg-[#F8FAFC]" />}>
          {isDiagnosticoBrigid ? (
            <div className="flex flex-col min-h-screen bg-background">
              <PageHeader />
              <main className="flex-1 p-4 md:p-6 m-0">
                <Outlet />
              </main>
            </div>
          ) : (
            <Outlet />
          )}
        </Suspense>
        <Toaster />
      </>
    );
  }

  return (
    <SidebarProvider className="m-0 p-0">
      <AppSidebar />
      <SidebarInset className="flex flex-col min-w-0 m-0 p-0 border-t-0 bg-transparent">
        <PageHeader />
        <main className="flex-1 p-4 md:p-6 bg-background m-0">
          <Suspense
            fallback={
              <div className="flex h-[calc(100vh-56px)] items-center justify-center">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">BRIGID</p>
                  <p className="mt-2 text-sm text-muted-foreground">Carregando base territorial…</p>
                </div>
              </div>
            }
          >
            <Outlet />
          </Suspense>
          <footer className="mt-10 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <span className="font-semibold tracking-[0.18em] text-foreground">BRIGID</span>
              {" — "}Base de Referência Integrada para Gestão, Inteligência e Dados do Projeto
              Feminicídio Zero.
            </p>
            <p className="mt-1 text-muted-foreground/80">
              Ministério Público do Estado do Piauí · CAOCRIM · Plataforma institucional de
              monitoramento, análise territorial e gestão estratégica baseada em evidências.
            </p>
          </footer>
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
