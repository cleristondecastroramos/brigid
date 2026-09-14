import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  HeartHandshake,
  AlertTriangle,
  MapPin,
  ListChecks,
  FileText,
  Map as MapIcon,
  LogOut,
  Sliders,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { BrigidMark } from "@/components/brigid-mark";
import { useApp } from "@/context/AppContext";

const groups = [
  {
    label: "Monitoramento",
    items: [
      { title: "Diagnóstico Institucional", url: "/diagnostico-brigid", icon: FileText },
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
      { title: "Municípios", url: "/municipios", icon: MapPin },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Gestão do Projeto", url: "/gestao", icon: ListChecks },
      { title: "Relatórios", url: "/relatorios", icon: FileText },
    ],
  },
  {
    label: "Referência",
    items: [
      { title: "Metodologia de Cálculos", url: "/metodologia", icon: BookOpen },
      { title: "Manual Técnico", url: "/manual", icon: FileText },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => pathname.startsWith(url) && (url !== "/" || pathname === "/");
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
      <SidebarHeader className="h-14 border-b border-sidebar-border px-4 py-0 justify-center m-0">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <img
              src="/logo_brigid.png"
              alt="BRIGID Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-base font-bold tracking-[0.15em] text-sidebar-foreground">
              BRIGID
            </span>
            <span className="text-[8px] tracking-wider text-sidebar-foreground/70 leading-tight uppercase font-semibold whitespace-nowrap">
              Projeto Feminicídio Zero
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pb-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/apresentacao-do-sistema")}
                tooltip="Apresentação do Sistema"
              >
                <Link to="/apresentacao-do-sistema">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Apresentação do Sistema</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {sidebarGroups.map((g, index) => (
          <SidebarGroup
            key={g.label}
            className={index > 0 ? "border-t border-white/5 mt-1 pt-3" : "pt-3"}
          >
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
              <SidebarMenuButton
                asChild
                className="justify-center bg-sidebar-accent/50 text-sidebar-accent-foreground hover:bg-sidebar-accent"
                tooltip="Sair do sistema"
              >
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
