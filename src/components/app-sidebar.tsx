import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, HeartHandshake, AlertTriangle,
  MapPin, ListChecks, FileText, ShieldCheck,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import logo from "@/assets/logo-mppi.png";

const groups = [
  {
    label: "Monitoramento",
    items: [
      { title: "Dashboard Executivo", url: "/", icon: LayoutDashboard },
      { title: "Painel OPMs", url: "/opm", icon: Building2 },
      { title: "Painel CREAS", url: "/creas", icon: HeartHandshake },
      { title: "Risco de Feminicídio", url: "/risco", icon: AlertTriangle },
    ],
  },
  {
    label: "Territorial",
    items: [
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
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">Feminicídio Zero</span>
            <span className="text-[11px] text-sidebar-foreground/70">MPPI · CAOCRIM</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
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
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:hidden">
          <img src={logo} alt="Ministério Público do Piauí" className="h-8 w-auto bg-white rounded px-1" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
