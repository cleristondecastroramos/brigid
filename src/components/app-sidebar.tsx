import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, HeartHandshake, AlertTriangle,
  MapPin, ListChecks, FileText, Map as MapIcon, LogOut, Sliders
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { BrigidMark } from "@/components/brigid-mark";
import { useApp } from "@/context/AppContext";

const groups = [
  {
    label: "Monitoramento",
    items: [
      { title: "Painel Estratégico", url: "/painel", icon: LayoutDashboard },
      { title: "Diagnóstico da Rede", url: "/diagnostico", icon: FileText },
      { title: "Cobertura OPM", url: "/opm", icon: Building2 },
      { title: "Cobertura CREAS", url: "/creas", icon: HeartHandshake },
      { title: "Risco de Feminicídio", url: "/risco", icon: AlertTriangle },
    ],
  },
  {
    label: "Territorial",
    items: [
      { title: "Inteligência Territorial", url: "/territorio", icon: MapIcon },
      { title: "Base Territorial", url: "/municipios", icon: MapPin },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Gestão do Projeto", url: "/gestao", icon: ListChecks },
      { title: "Relatórios", url: "/relatorios", icon: FileText },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (pathname.startsWith(url) && (url !== "/" || pathname === "/"));
  const { userRole, logout } = useApp();

  const sidebarGroups = groups.map((g) => {
    if (g.label === "Gestão" && userRole === "admin") {
      return {
        ...g,
        items: [
          ...g.items,
          { title: "Gestão da Base Municipal", url: "/base", icon: MapPin },
          { title: "Ponderação de Pesos", url: "/pesos", icon: Sliders },
        ],
      };
    }
    return g;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center px-2 py-3 text-sidebar-primary">
          <div className="hidden w-full items-center justify-center group-data-[collapsible=icon]:flex">
            <BrigidMark size={36} />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-base font-semibold tracking-[0.18em] text-sidebar-foreground">BRIGID</span>
            <span className="text-[10px] tracking-wider text-sidebar-foreground/60 leading-tight">
              Base de Referência Integrada para Gestão, Inteligência e Dados do Projeto Feminicídio Zero - CAOCRIM/MPPI.
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarGroups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex flex-col gap-2 px-2 py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="justify-center bg-sidebar-accent/50 text-sidebar-accent-foreground hover:bg-sidebar-accent" tooltip="Sair do sistema">
                <Link to="/" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4 opacity-70" />
                  <span>Sair do sistema</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
