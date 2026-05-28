import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, HeartHandshake, AlertTriangle,
  MapPin, ListChecks, FileText, Map as MapIcon,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { BrigidMark } from "@/components/brigid-mark";
import logo from "@/assets/logo-mppi.png";

const groups = [
  {
    label: "Monitoramento",
    items: [
      { title: "Painel Estratégico", url: "/", icon: LayoutDashboard },
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
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3 text-sidebar-primary">
          <BrigidMark size={36} />
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-base font-semibold tracking-[0.18em] text-sidebar-foreground">BRIGID</span>
            <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
              Projeto Feminicídio Zero · MPPI
            </span>
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
        <div className="flex flex-col gap-2 px-2 py-3 group-data-[collapsible=icon]:hidden">
          <p className="text-[10px] leading-relaxed text-sidebar-foreground/55">
            Base de Referência Integrada para Gestão, Inteligência e Dados do Projeto Feminicídio Zero.
          </p>
          <img src={logo} alt="Ministério Público do Estado do Piauí" className="h-7 w-auto self-start rounded bg-white px-1 py-0.5" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
