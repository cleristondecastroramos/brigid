import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, createRootRouteWithContext, HeadContent, Scripts, useRouterState, Link,
} from "@tanstack/react-router";
import { Suspense } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";


function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Página não encontrada.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Ir para o painel</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold text-foreground">Erro ao carregar</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
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
      { rel: "icon", href: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><path d='M24 3 L42 9 V24 C42 34 34 42 24 45 C14 42 6 34 6 24 V9 Z' fill='%23195e6b'/><text x='24' y='30' text-anchor='middle' font-family='Georgia,serif' font-size='22' font-weight='700' fill='white'>B</text></svg>" },
    ],
  }),
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
  "/": "Dashboard Executivo",
  "/opm": "Painel de OPMs",
  "/creas": "Painel de CREAS",
const PAGE_TITLES: Record<string, string> = {
  "/": "Painel Estratégico BRIGID",
  "/opm": "Cobertura de OPMs",
  "/creas": "Cobertura de CREAS",
  "/risco": "Risco de Feminicídio",
  "/territorio": "Inteligência Territorial",
  "/municipios": "Base Territorial",
  "/gestao": "Gestão do Projeto",
  "/relatorios": "Relatórios e Exportações",
};
  let title = PAGE_TITLES[pathname];
  if (!title) {
    if (pathname.startsWith("/municipios/")) title = "Ficha Territorial";
    else title = "Feminicídio Zero";
  }
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground">Ministério Público do Estado do Piauí · CAOCRIM</p>
        <h1 className="text-sm font-semibold text-foreground leading-tight">{title}</h1>
      </div>
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-col">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          BRIGID · MPPI · Projeto Feminicídio Zero
        </p>
        <h1 className="text-sm font-semibold text-foreground leading-tight">{title}</h1>
      </div>
      <div className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground md:flex">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)]" />
          Base oficial · 224 municípios
        </span>
      </div>
    </header>
  );
}
      <SidebarProvider>
        <div className="flex min-h-dvh w-full bg-background">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <PageHeader />
            <main className="flex-1 p-4 md:p-6">
              <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando base territorial…</div>}>
                <Outlet />
              </Suspense>
            </main>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </QueryClientProvider>
  );
}
