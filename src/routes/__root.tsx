import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, createRootRouteWithContext, HeadContent, Scripts, useRouterState, Link, useNavigate,
} from "@tanstack/react-router";
import { Suspense, useState, useEffect } from "react";
import { Sun, Moon, ShieldCheck } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import logo from "@/assets/logo-mppi.png";
import { AppProvider, useApp } from "@/context/AppContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">BRIGID</p>
        <h1 className="mt-2 text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Página não encontrada na base institucional.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Voltar ao Painel Estratégico
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

const FAVICON = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><path d='M24 3 L42 9 V24 C42 34 34 42 24 45 C14 42 6 34 6 24 V9 Z' fill='%23195e6b'/><text x='24' y='31' text-anchor='middle' font-family='Georgia,serif' font-size='22' font-weight='700' fill='white'>B</text></svg>";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BRIGID — Projeto Feminicídio Zero · MPPI" },
      { name: "description", content: "BRIGID — Base de Referência Integrada para Gestão, Inteligência e Dados do Projeto Feminicídio Zero do Ministério Público do Estado do Piauí." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: FAVICON },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Painel Estratégico BRIGID",
  "/opm": "Cobertura de OPMs",
  "/creas": "Cobertura de CREAS",
  "/risco": "Risco de Feminicídio",
  "/territorio": "Inteligência Territorial",
  "/municipios": "Base Territorial",
  "/gestao": "Gestão do Projeto",
  "/relatorios": "Relatórios e Exportações",
  "/pesos": "Ponderação e Simulação de Pesos",
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur transition-colors">
      <SidebarTrigger className="-ml-1" />
      <div className="flex items-center gap-3">
        <img src={logo} alt="MPPI" className="h-7 w-auto rounded bg-white px-1 py-0.5" />
      </div>
      
      <div className="ml-auto flex items-center gap-3 text-xs">
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm transition-all hover:bg-muted/50">
          <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-success)]" />
          <span className="font-medium text-foreground tracking-wide uppercase text-[10px]">Acesso Oficial</span>
        </div>
        
        <button
          onClick={toggleTheme}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-all hover:bg-muted hover:scale-105 active:scale-95"
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
    if (pathname === "/pesos" && userRole !== "admin") {
      navigate({ to: "/" });
    }
  }, [pathname, userRole, navigate]);
  
  const isLandingPage = pathname === "/";

  if (isLandingPage) {
    return (
      <>
        <Suspense fallback={<div className="min-h-dvh bg-[#F8FAFC]" />}>
          <Outlet />
        </Suspense>
        <Toaster />
      </>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-dvh w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <PageHeader />
          <main className="flex-1 p-4 md:p-6">
            <Suspense fallback={
              <div className="flex h-[60vh] items-center justify-center">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">BRIGID</p>
                  <p className="mt-2 text-sm text-muted-foreground">Carregando base territorial…</p>
                </div>
              </div>
            }>
              <Outlet />
            </Suspense>
            <footer className="mt-10 border-t border-border pt-4 text-[11px] leading-relaxed text-muted-foreground">
              <p>
                <span className="font-semibold tracking-[0.18em] text-foreground">BRIGID</span>
                {" — "}Base de Referência Integrada para Gestão, Inteligência e Dados do Projeto Feminicídio Zero.
              </p>
              <p className="mt-1 text-muted-foreground/80">
                Ministério Público do Estado do Piauí · CAOCRIM · Plataforma institucional de monitoramento, análise territorial e gestão estratégica baseada em evidências.
              </p>
            </footer>
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
