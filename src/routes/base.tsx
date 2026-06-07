import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { municipiosQueryOptions } from "@/lib/csv-data";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { Search, Save, Pencil, ArrowUpDown, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Municipio } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export const Route = createFileRoute("/base")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: GestaoBaseMunicipal,
});

function FieldLabel({ children, tooltip }: { children: React.ReactNode; tooltip: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex items-center gap-1.5 mb-1">
        <Label className="text-xs text-foreground font-semibold">{children}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors flex-shrink-0" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px] text-justify bg-slate-900 border border-slate-800 text-white p-2 rounded-md shadow-md text-[11px] leading-relaxed">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

const GARGALOS_OPTIONS = [
  "Nenhum gargalo crítico identificado.",
  "Déficit de peritos criminais na comarca.",
  "Ausência de sala para escuta protegida.",
  "Demora na conclusão de perícias tanatológicas.",
  "Carência de defensores públicos ou núcleos especializados.",
  "Dificuldades de integração com o sistema de justiça local.",
  "Baixo efetivo policial para cumprimento de medidas protetivas.",
  "Ausência de equipe psicossocial para atendimento imediato.",
  "Indisponibilidade de transporte para deslocamento da vítima.",
  "Falta de abrigo ou alojamento provisório de urgência."
];

function GestaoBaseMunicipal() {
  const { userRole } = useApp();
  const { data: municipios } = useSuspenseQuery(municipiosQueryOptions);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Municipio>("municipio");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [editData, setEditData] = useState<Partial<Municipio>>({});
  const [originalData, setOriginalData] = useState<Partial<Municipio>>({});

  // Verifica campos alterados
  const dirtyFieldsCount = Object.keys(editData).filter((key) => {
    return editData[key as keyof Municipio] !== originalData[key as keyof Municipio];
  }).length;
  const isDirty = dirtyFieldsCount > 0;

  const updateMutation = useMutation({
    mutationFn: async (m: Partial<Municipio>) => {
      const { data, error } = await supabase
        .from('municipios')
        .update(m)
        .eq('codigo_ibge', m.codigo_ibge)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipios"] });
      setEditingId(null);
      toast.success("Município atualizado com sucesso!");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Erro ao salvar no banco de dados.");
    }
  });

  if (userRole !== "admin") {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito a administradores.</div>;
  }

  let filtered = municipios.filter((m) =>
    m.municipio.toLowerCase().includes(search.toLowerCase())
  );

  filtered = filtered.sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal === bVal) return 0;
    
    const modifier = sortDirection === "asc" ? 1 : -1;
    
    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal) * modifier;
    }
    
    return ((aVal as any) < (bVal as any) ? -1 : 1) * modifier;
  });

  const handleSort = (column: keyof Municipio) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: keyof Municipio }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />;
  };

  const handleEdit = (m: Municipio) => {
    setEditData({ ...m });
    setOriginalData({ ...m });
    setEditingId(m.id ?? m.codigo_ibge);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (isDirty) {
        if (!window.confirm("Você tem alterações não salvas no município. Tem certeza que deseja descartar essas alterações?")) {
          return;
        }
      }
      setEditingId(null);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleToggleGargalo = (gargalo: string) => {
    setEditData((prev) => {
      // Parse current list — empty string or undefined means nothing selected
      let currentList = prev.gargalos_identificados
        ? prev.gargalos_identificados.split(";").map(x => x.trim()).filter(Boolean)
        : [];

      if (gargalo === "Nenhum gargalo crítico identificado.") {
        // Toggle "Nenhum": if already selected → clear; else → set as sole option
        if (currentList.includes("Nenhum gargalo crítico identificado.")) {
          currentList = []; // User explicitly unchecked it — allow empty state
        } else {
          currentList = ["Nenhum gargalo crítico identificado."];
        }
      } else {
        // Any other option: remove "Nenhum" and toggle the selected item
        currentList = currentList.filter(x => x !== "Nenhum gargalo crítico identificado.");
        if (currentList.includes(gargalo)) {
          currentList = currentList.filter(x => x !== gargalo);
        } else {
          currentList.push(gargalo);
        }
      }

      // Do NOT auto-reset to "Nenhum" — let the user freely manage selections
      return {
        ...prev,
        gargalos_identificados: currentList.join("; ")
      };
    });
  };

  const handleChange = (field: keyof Municipio, value: any) => {
    setEditData((prev) => {
      const next = { ...prev, [field]: value };
      
      // OPM logic
      if (field === "opm_possui") {
        if (value === "NAO") {
          next.opm_status_politicas_publicas = "";
          next.opm_orgaotipo = "";
        } else if (value === "SIM" && !next.opm_orgaotipo) {
          next.opm_orgaotipo = "A_VERIFICAR_DETALHE";
        }
      }

      // Auto-calculate Totals and Flags for Consumado
      if (field.startsWith("consumado_")) {
        next.feminicidios_consumados_2024_2025 = 
          (Number(next.consumado_2023) || 0) + 
          (Number(next.consumado_2024) || 0) + 
          (Number(next.consumado_2025) || 0) + 
          (Number(next.consumado_2026) || 0);
          
        next.indicador_tem_feminicidio_consumado = next.feminicidios_consumados_2024_2025 > 0 ? "SIM" : "NAO";
      }
      
      // Auto-calculate Totals and Flags for Tentativas
      if (field.startsWith("tentado_")) {
        next.feminicidios_tentados_2024_2025 = 
          (Number(next.tentado_2023) || 0) + 
          (Number(next.tentado_2024) || 0) + 
          (Number(next.tentado_2025) || 0) + 
          (Number(next.tentado_2026) || 0);
          
        next.indicador_tem_tentativa_feminicidio = next.feminicidios_tentados_2024_2025 > 0 ? "SIM" : "NAO";
      }
      
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border/50 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Gestão da Base Municipal</h2>
          <p className="text-sm text-muted-foreground mt-1">Edição administrativa dos dados municipais, infraestrutura da rede e registros monitorados.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar município..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full border-muted-foreground/30 focus-visible:ring-primary/50 transition-colors shadow-sm"
              />
            </div>
            {/* Secondary technical filter/sort */}
            <Select value={sortColumn as string} onValueChange={(v) => handleSort(v as any)}>
              <SelectTrigger className="w-[200px] text-xs h-9 bg-background">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="municipio">Município</SelectItem>
                <SelectItem value="comarca">Comarca</SelectItem>
                <SelectItem value="polo_regional">Polo Regional</SelectItem>
                <SelectItem value="risco_feminicidio_score">Score de Risco</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[70vh] relative">
            <table className="w-full text-sm text-left text-muted-foreground border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-20 bg-[#2e1065] text-xs uppercase text-white/90 backdrop-blur-sm shadow-[0_1px_0_hsl(var(--border))]">
                <tr>
                  <th className="sticky left-0 z-30 px-4 py-3 font-semibold cursor-pointer hover:bg-[#3b1582] transition-colors bg-[#2e1065] shadow-[1px_0_0_hsl(var(--border))]" onClick={() => handleSort("municipio")}>
                    <div className="flex items-center gap-1.5">Município <SortIcon column="municipio" /></div>
                  </th>
                  <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-[#3b1582] transition-colors" onClick={() => handleSort("comarca")}>
                    <div className="flex items-center gap-1.5">Comarca <SortIcon column="comarca" /></div>
                  </th>
                  <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-[#3b1582] transition-colors" onClick={() => handleSort("polo_regional")}>
                    <div className="flex items-center gap-1.5">Polo Regional <SortIcon column="polo_regional" /></div>
                  </th>
                  <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-[#3b1582] transition-colors text-center" onClick={() => handleSort("opm_possui")}>
                    <div className="flex items-center justify-center gap-1.5">OPM <SortIcon column="opm_possui" /></div>
                  </th>
                  <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-[#3b1582] transition-colors text-center" onClick={() => handleSort("creas_possui")}>
                    <div className="flex items-center justify-center gap-1.5">CREAS <SortIcon column="creas_possui" /></div>
                  </th>
                  <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-[#3b1582] transition-colors text-center" onClick={() => handleSort("feminicidios_consumados_2024_2025")}>
                    <div className="flex items-center justify-center gap-1.5">Feminicídios <SortIcon column="feminicidios_consumados_2024_2025" /></div>
                  </th>
                  <th className="px-4 py-3 font-semibold cursor-pointer hover:bg-[#3b1582] transition-colors text-center" onClick={() => handleSort("feminicidios_tentados_2024_2025")}>
                    <div className="flex items-center justify-center gap-1.5">Tentativas <SortIcon column="feminicidios_tentados_2024_2025" /></div>
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((m) => (
                  <tr key={m.codigo_ibge} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="sticky left-0 z-10 px-4 py-3 font-semibold text-foreground bg-white dark:bg-background group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 shadow-[1px_0_0_hsl(var(--border)/0.5)] transition-colors">
                      {m.municipio}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.comarca || "-"}</td>
                    <td className="px-4 py-3">{m.polo_regional}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide",
                        m.opm_possui === "SIM" 
                          ? "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {m.opm_possui || "NÃO"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide",
                        m.creas_possui === "SIM" 
                          ? "bg-emerald-100/60 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" 
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {m.creas_possui || "NÃO"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-foreground">{m.feminicidios_consumados_2023_2025}</td>
                    <td className="px-4 py-3 text-center font-medium text-foreground">{m.feminicidios_tentados_2023_2025}</td>
                    <td className="px-4 py-3 text-right">
                      <Dialog open={editingId === (m.id ?? m.codigo_ibge)} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(m)} className="h-8 px-3 hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground">
                                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                  <span className="text-xs font-medium">Editar</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar dados do município</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[850px] flex flex-col h-full max-h-[95vh] p-0 border-none rounded-xl overflow-hidden bg-background shadow-2xl [&>button]:text-white [&>button]:opacity-80 hover:[&>button]:opacity-100 [&>button]:bg-black/20 hover:[&>button]:bg-black/40 [&>button]:rounded-full [&>button]:p-1.5 [&>button]:top-5 [&>button]:right-5 [&>button]:transition-all">
                          <DialogHeader className="bg-[#2e1065] text-primary-foreground p-6 border-b border-white/10 flex flex-col text-left shrink-0 relative overflow-hidden">
                            {/* Efeito visual sutil de fundo */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                            
                            <div className="flex items-center gap-2 mb-1.5 relative z-10">
                              <span className="text-[10px] uppercase font-bold tracking-widest text-primary-foreground/70 bg-black/20 px-2 py-0.5 rounded-full">Edição Administrativa</span>
                              {isDirty && <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 animate-in fade-in zoom-in duration-300">Alterações Pendentes</span>}
                            </div>
                            <DialogTitle className="text-white text-[28px] font-extrabold mt-1 leading-tight tracking-tight relative z-10">{m.municipio}</DialogTitle>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-primary-foreground/80 font-medium relative z-10">
                              <span className="flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded-md"><span className="opacity-60">IBGE:</span> {m.codigo_ibge}</span>
                              {m.comarca && (
                                <span className="flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded-md"><span className="opacity-60">Comarca:</span> {m.comarca}</span>
                              )}
                              {m.polo_regional && (
                                <span className="flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded-md"><span className="opacity-60">Polo:</span> {m.polo_regional}</span>
                              )}
                            </div>
                          </DialogHeader>
                          
                          <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
                            <Tabs defaultValue="infra" className="w-full">
                              <TabsList className="flex flex-wrap md:grid md:grid-cols-6 mb-6 bg-muted/50 p-1.5 rounded-xl border border-border/50 shadow-sm h-auto">
                                <TabsTrigger value="infra" className="text-xs font-semibold rounded-lg data-[state=active]:bg-[#2e1065] data-[state=active]:shadow-md data-[state=active]:text-white transition-all py-2.5 hover:bg-muted/80 data-[state=active]:hover:bg-[#2e1065]">Infraestrutura</TabsTrigger>
                                <TabsTrigger value="fluxos" className="text-xs font-semibold rounded-lg data-[state=active]:bg-[#2e1065] data-[state=active]:shadow-md data-[state=active]:text-white transition-all py-2.5 hover:bg-muted/80 data-[state=active]:hover:bg-[#2e1065]">Fluxos</TabsTrigger>
                                <TabsTrigger value="seguranca" className="text-xs font-semibold rounded-lg data-[state=active]:bg-[#2e1065] data-[state=active]:shadow-md data-[state=active]:text-white transition-all py-2.5 hover:bg-muted/80 data-[state=active]:hover:bg-[#2e1065]">Segurança</TabsTrigger>
                                <TabsTrigger value="assistencia" className="text-xs font-semibold rounded-lg data-[state=active]:bg-[#2e1065] data-[state=active]:shadow-md data-[state=active]:text-white transition-all py-2.5 hover:bg-muted/80 data-[state=active]:hover:bg-[#2e1065]">Socioassistencial</TabsTrigger>
                                <TabsTrigger value="violencia" className="text-xs font-semibold rounded-lg data-[state=active]:bg-[#2e1065] data-[state=active]:shadow-md data-[state=active]:text-white transition-all py-2.5 hover:bg-muted/80 data-[state=active]:hover:bg-[#2e1065]">Violência</TabsTrigger>
                                <TabsTrigger value="alertas" className="text-xs font-semibold rounded-lg data-[state=active]:bg-[#2e1065] data-[state=active]:shadow-md data-[state=active]:text-white transition-all py-2.5 hover:bg-muted/80 data-[state=active]:hover:bg-[#2e1065]">Alertas</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="infra" className="space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  {/* Destaque OPM */}
                                  <div className="grid gap-2 p-4 bg-primary/[0.03] border border-primary/10 rounded-xl shadow-sm">
                                    <FieldLabel tooltip="Identifica se o município possui Organismo de Políticas para as Mulheres (Secretaria, Coordenadoria, Diretoria, etc) ativo.">
                                      <span className="text-primary font-bold">Possui OPM?</span>
                                    </FieldLabel>
                                    <Select value={editData.opm_possui || ""} onValueChange={(v) => handleChange("opm_possui", v)}>
                                      <SelectTrigger className="font-semibold border-primary/20 bg-background focus:ring-primary/40"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Destaque CREAS */}
                                  <div className="grid gap-2 p-4 bg-primary/[0.03] border border-primary/10 rounded-xl shadow-sm">
                                    <FieldLabel tooltip="Identifica se o município possui Centro de Referência Especializado de Assistência Social implementado.">
                                      <span className="text-primary font-bold">Possui CREAS?</span>
                                    </FieldLabel>
                                    <Select value={editData.creas_possui || ""} onValueChange={(v) => handleChange("creas_possui", v)}>
                                      <SelectTrigger className="font-semibold border-primary/20 bg-background focus:ring-primary/40"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Demais campos de infra */}
                                  <div className="grid gap-2 p-1">
                                    <FieldLabel tooltip="Verifica se a estrutura do OPM executa ações e programas de forma contínua e relevante.">Efetiva nas políticas públicas?</FieldLabel>
                                    <Select 
                                      value={editData.opm_status_politicas_publicas || ""} 
                                      onValueChange={(v) => handleChange("opm_status_politicas_publicas", v)}
                                      disabled={editData.opm_possui === "NAO"}
                                    >
                                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                        <SelectItem value="A_VERIFICAR">A Verificar</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="grid gap-2 p-1">
                                    <FieldLabel tooltip="A classificação administrativa do OPM (Ex: Secretaria Municipal da Mulher).">Tipologia do OPM</FieldLabel>
                                    <Select 
                                      value={editData.opm_orgaotipo || ""} 
                                      onValueChange={(v) => handleChange("opm_orgaotipo", v)}
                                      disabled={editData.opm_possui === "NAO"}
                                    >
                                      <SelectTrigger><SelectValue placeholder="Selecione a Tipologia" /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Secretaria">Secretaria</SelectItem>
                                        <SelectItem value="Coordenadoria">Coordenadoria</SelectItem>
                                        <SelectItem value="Diretoria">Diretoria</SelectItem>
                                        <SelectItem value="Departamento">Departamento</SelectItem>
                                        <SelectItem value="Gerência">Gerência</SelectItem>
                                        <SelectItem value="Outro">Outro</SelectItem>
                                        <SelectItem value="A_VERIFICAR_DETALHE">A Verificar Detalhe</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="grid gap-2 p-1">
                                    <FieldLabel tooltip="A população atual do município segundo os últimos dados demográficos oficiais.">População</FieldLabel>
                                    <Input 
                                      type="number" 
                                      value={editData.populacao || ""} 
                                      onChange={(e) => handleChange("populacao", parseInt(e.target.value) || 0)} 
                                    />
                                  </div>
                                  <div className="grid gap-2 p-1">
                                    <FieldLabel tooltip="A população feminina residente no município (IBGE). Utilizada como denominador da Taxa de Incidência de Risco.">Pop. Feminina</FieldLabel>
                                    <Input 
                                      type="number" 
                                      value={editData.populacao_feminina || ""} 
                                      onChange={(e) => handleChange("populacao_feminina", parseInt(e.target.value) || 0)} 
                                    />
                                  </div>
                                  
                                  <div className="grid gap-2 col-span-1 md:col-span-2 p-1 mt-2">
                                    <FieldLabel tooltip="Espaço para anotações técnicas e notas operacionais de acompanhamento.">Observações Sistema</FieldLabel>
                                    <Textarea 
                                      placeholder="Observações técnicas sobre os órgãos..."
                                      className="min-h-[100px] resize-y"
                                      value={editData.observacoes_sistema || ""}
                                      onChange={(e) => handleChange("observacoes_sistema", e.target.value)}
                                    />
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="fluxos" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Existência de fluxograma pactuado de atendimento às mulheres vítimas de violência.">Fluxo Formal de Atendimento</FieldLabel>
                                    <Select value={editData.tem_fluxo_formal || ""} onValueChange={(v) => handleChange("tem_fluxo_formal", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Presença de protocolo formalizado para fluxo de atendimento e acolhimento.">Protocolo Local/Regional</FieldLabel>
                                    <Select value={editData.tem_protocolo_local_regional || ""} onValueChange={(v) => handleChange("tem_protocolo_local_regional", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Disponibilidade de sala física adaptada e acolhedora no município para o atendimento às vítimas.">Sala Especializada</FieldLabel>
                                    <Select value={editData.tem_sala_especializada || ""} onValueChange={(v) => handleChange("tem_sala_especializada", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Presença de insumos básicos (computador, internet, telefone, etc) para a equipe técnica trabalhar.">Recursos Mínimos</FieldLabel>
                                    <Select value={editData.tem_recursos_minimos || ""} onValueChange={(v) => handleChange("tem_recursos_minimos", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Classificação da adequação geral da estrutura de atendimento (Adequado, Parcial ou Insuficiente).">Suficiência da Estrutura</FieldLabel>
                                    <Select value={editData.grau_suficiencia_estrutura || ""} onValueChange={(v) => handleChange("grau_suficiencia_estrutura", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ADEQUADO">Adequado</SelectItem>
                                        <SelectItem value="PARCIAL">Parcial</SelectItem>
                                        <SelectItem value="INSUFICIENTE">Insuficiente</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Disponibilidade de profissionais de psicologia ou assistência social para acompanhamento terapêutico.">Atendimento Psicossocial</FieldLabel>
                                    <Select value={editData.tem_atendimento_psicossocial || ""} onValueChange={(v) => handleChange("tem_atendimento_psicossocial", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="seguranca" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Existência de diretrizes específicas no município para a investigação de feminicídios.">Protocolo Investigação</FieldLabel>
                                    <Select value={editData.tem_protocolo_investigacao || ""} onValueChange={(v) => handleChange("tem_protocolo_investigacao", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Uso de guias de coleta de vestígios e laudos em perspectiva de gênero na perícia.">Protocolo Pericial</FieldLabel>
                                    <Select value={editData.tem_protocolo_pericial || ""} onValueChange={(v) => handleChange("tem_protocolo_pericial", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Se as equipes locais de segurança pública passaram por capacitação em direitos das mulheres e gênero.">Capacitado em Gênero</FieldLabel>
                                    <Select value={editData.capacitado_perspectiva_genero || ""} onValueChange={(v) => handleChange("capacitado_perspectiva_genero", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="O nível de alinhamento das equipes policiais locais aos protocolos técnicos nacionais.">Aderência Técnica</FieldLabel>
                                    <Select value={editData.grau_aderencia_protocolo || ""} onValueChange={(v) => handleChange("grau_aderencia_protocolo", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ALTO">Alto</SelectItem>
                                        <SelectItem value="MEDIO">Médio</SelectItem>
                                        <SelectItem value="BAIXO">Baixo</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Quantidade de treinamentos/capacitações realizadas no município sobre o tema (Período: 2024-2025).">Qtd. Capacitações</FieldLabel>
                                    <Input 
                                      type="number" 
                                      className="h-8 text-xs" 
                                      value={editData.qtd_capacitacoes_realizadas ?? ""} 
                                      onChange={(e) => handleChange("qtd_capacitacoes_realizadas", parseInt(e.target.value) || 0)} 
                                    />
                                  </div>
                                  <div className="grid gap-1.5 col-span-2 mt-4 border-t border-border/40 pt-4">
                                    <div className="flex items-center justify-between mb-1">
                                      <FieldLabel tooltip="Problemas práticos que dificultam o fluxo de investigação, perícia ou acolhimento.">Gargalos Identificados</FieldLabel>
                                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        {editData.gargalos_identificados ? editData.gargalos_identificados.split(";").map(x => x.trim()).filter(Boolean).length : 0} selecionados
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-border/60 rounded-lg p-3 max-h-[220px] overflow-y-auto bg-muted/20 custom-scrollbar shadow-inner">
                                      {GARGALOS_OPTIONS.map((opt) => {
                                        // Parse real state — empty/null means nothing is checked yet
                                        const currentList = editData.gargalos_identificados
                                          ? editData.gargalos_identificados.split(";").map(x => x.trim()).filter(Boolean)
                                          : [];
                                        const checked = currentList.includes(opt);
                                        // Disable other options only when "Nenhum" is explicitly checked
                                        const isDisabled = opt !== "Nenhum gargalo crítico identificado." &&
                                          currentList.includes("Nenhum gargalo crítico identificado.");
                                        
                                        return (
                                          <label 
                                            key={opt} 
                                            className={cn(
                                              "flex items-start gap-2.5 text-xs cursor-pointer p-2.5 rounded-md transition-all border",
                                              checked 
                                                ? "bg-primary/5 border-primary/30 font-medium text-foreground shadow-sm dark:bg-primary/10" 
                                                : "bg-background border-border/40 hover:bg-muted/50 hover:border-border",
                                              isDisabled && "opacity-40 cursor-not-allowed grayscale"
                                            )}
                                          >
                                            <input
                                              type="checkbox"
                                              className="mt-0.5 rounded border-primary/30 text-primary focus:ring-primary focus:ring-offset-1 cursor-pointer disabled:cursor-not-allowed w-3.5 h-3.5"
                                              checked={checked}
                                              disabled={isDisabled}
                                              onChange={() => handleToggleGargalo(opt)}
                                            />
                                            <span className="leading-snug">{opt}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="assistencia" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Existência de fluxo socioassistencial formal para vítimas no CRAS/CREAS.">Protocolo Assistencial</FieldLabel>
                                    <Select value={editData.tem_protocolo_assistencial || ""} onValueChange={(v) => handleChange("tem_protocolo_assistencial", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Existência de canais oficiais e formalizados para encaminhamento da rede assistencial à justiça/saúde.">Fluxo Encaminhamento</FieldLabel>
                                    <Select value={editData.tem_fluxo_encaminhamento || ""} onValueChange={(v) => handleChange("tem_fluxo_encaminhamento", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Grau de integração operacional entre o CRAS/CREAS, saúde, segurança e comarca.">Articulação CREAS</FieldLabel>
                                    <Select value={editData.articulacao_creas_rede || ""} onValueChange={(v) => handleChange("articulacao_creas_rede", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Se o equipamento assistencial conta com assistente social, psicólogo e advogado conforme as normas.">Equipe Mínima CREAS</FieldLabel>
                                    <Select value={editData.tem_equipe_minima_creas || ""} onValueChange={(v) => handleChange("tem_equipe_minima_creas", v)}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Quantidade de profissionais locais que participaram das capacitações (Período: 2024-2025).">Profissionais Capacitados</FieldLabel>
                                    <Input 
                                      type="number" 
                                      className="h-8 text-xs" 
                                      value={editData.profissionais_capacitados ?? ""} 
                                      onChange={(e) => handleChange("profissionais_capacitados", parseInt(e.target.value) || 0)} 
                                    />
                                  </div>
                                  <div className="grid gap-1.5">
                                    <FieldLabel tooltip="Data em que ocorreu a última formação continuada para os agentes da rede local.">Última Capacitação</FieldLabel>
                                    <Input 
                                      type="date" 
                                      className="h-8 text-xs" 
                                      value={editData.data_ultima_capacitacao || ""} 
                                      onChange={(e) => handleChange("data_ultima_capacitacao", e.target.value)} 
                                    />
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="violencia" className="space-y-6 animate-in fade-in duration-300">
                                {/* Bloco Oficial */}
                                <div className="border border-primary/20 rounded-xl p-5 bg-primary/[0.02] shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/60"></div>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                      <h3 className="text-sm font-bold text-foreground">Score Oficial (2023–2025)</h3>
                                      <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">Monitoramento Oficial</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-5 max-w-2xl leading-relaxed">Estes dados consolidam a série histórica oficial e têm peso direto no cálculo automatizado do Score de Risco do município.</p>
                                  
                                  <div className="space-y-4">
                                    {/* 2023 */}
                                    <div className="grid grid-cols-12 gap-4 items-center bg-background border border-border/50 rounded-lg p-3">
                                      <div className="col-span-12 sm:col-span-4 font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground font-bold">23</div>
                                        Ano Base
                                      </div>
                                      <div className="col-span-6 sm:col-span-4 grid gap-1.5">
                                        <FieldLabel tooltip="Feminicídios consumados oficialmente registrados em 2023.">Consumados</FieldLabel>
                                        <Input type="number" value={editData.consumado_2023 ?? 0} onChange={(e) => handleChange("consumado_2023", parseInt(e.target.value) || 0)} className="font-semibold bg-muted/20" />
                                      </div>
                                      <div className="col-span-6 sm:col-span-4 grid gap-1.5">
                                        <FieldLabel tooltip="Tentativas de feminicídio oficialmente registradas em 2023.">Tentados</FieldLabel>
                                        <Input type="number" value={editData.tentado_2023 ?? 0} onChange={(e) => handleChange("tentado_2023", parseInt(e.target.value) || 0)} className="font-semibold bg-muted/20" />
                                      </div>
                                    </div>

                                    {/* 2024 */}
                                    <div className="grid grid-cols-12 gap-4 items-center bg-background border border-border/50 rounded-lg p-3">
                                      <div className="col-span-12 sm:col-span-4 font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground font-bold">24</div>
                                        Ano Base
                                      </div>
                                      <div className="col-span-6 sm:col-span-4 grid gap-1.5">
                                        <FieldLabel tooltip="Feminicídios consumados oficialmente registrados em 2024.">Consumados</FieldLabel>
                                        <Input type="number" value={editData.consumado_2024 ?? 0} onChange={(e) => handleChange("consumado_2024", parseInt(e.target.value) || 0)} className="font-semibold bg-muted/20" />
                                      </div>
                                      <div className="col-span-6 sm:col-span-4 grid gap-1.5">
                                        <FieldLabel tooltip="Tentativas de feminicídio oficialmente registradas em 2024.">Tentados</FieldLabel>
                                        <Input type="number" value={editData.tentado_2024 ?? 0} onChange={(e) => handleChange("tentado_2024", parseInt(e.target.value) || 0)} className="font-semibold bg-muted/20" />
                                      </div>
                                    </div>

                                    {/* 2025 */}
                                    <div className="grid grid-cols-12 gap-4 items-center bg-background border border-border/50 rounded-lg p-3">
                                      <div className="col-span-12 sm:col-span-4 font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground font-bold">25</div>
                                        Ano Base
                                      </div>
                                      <div className="col-span-6 sm:col-span-4 grid gap-1.5">
                                        <FieldLabel tooltip="Feminicídios consumados oficialmente registrados em 2025.">Consumados</FieldLabel>
                                        <Input type="number" value={editData.consumado_2025 ?? 0} onChange={(e) => handleChange("consumado_2025", parseInt(e.target.value) || 0)} className="font-semibold bg-muted/20" />
                                      </div>
                                      <div className="col-span-6 sm:col-span-4 grid gap-1.5">
                                        <FieldLabel tooltip="Tentativas de feminicídio oficialmente registradas em 2025.">Tentados</FieldLabel>
                                        <Input type="number" value={editData.tentado_2025 ?? 0} onChange={(e) => handleChange("tentado_2025", parseInt(e.target.value) || 0)} className="font-semibold bg-muted/20" />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Bloco Parcial */}
                                <div className="border border-amber-500/20 rounded-xl p-5 bg-amber-500/[0.02] shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50"></div>
                                  <div className="flex items-center gap-2.5 mb-2">
                                    <h3 className="text-sm font-bold text-foreground">Ciclo em Aberto (2026)</h3>
                                    <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">Monitoramento Parcial</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-4 max-w-2xl leading-relaxed">Estes dados referem-se ao ano em curso. Eles ajudam a compor os alertas da rede, mas ainda não fecharam a série histórica principal.</p>
                                  <div className="grid grid-cols-12 gap-4 items-center bg-background border border-border/50 rounded-lg p-3">
                                    <div className="col-span-12 sm:col-span-4 font-semibold text-sm text-amber-600/80 flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-700 font-bold">26</div>
                                      Em curso
                                    </div>
                                    <div className="col-span-6 sm:col-span-4 grid gap-1.5">
                                      <FieldLabel tooltip="Registros parciais de feminicídios consumados em 2026.">Consumados (Parcial)</FieldLabel>
                                      <Input type="number" value={editData.consumado_2026 ?? 0} onChange={(e) => handleChange("consumado_2026", parseInt(e.target.value) || 0)} className="font-semibold bg-muted/10 border-amber-500/20 focus-visible:ring-amber-500/30" />
                                    </div>
                                    <div className="col-span-6 sm:col-span-4 grid gap-1.5">
                                      <FieldLabel tooltip="Registros parciais de tentativas de feminicídio em 2026.">Tentados (Parcial)</FieldLabel>
                                      <Input type="number" value={editData.tentado_2026 ?? 0} onChange={(e) => handleChange("tentado_2026", parseInt(e.target.value) || 0)} className="font-semibold bg-muted/10 border-amber-500/20 focus-visible:ring-amber-500/30" />
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="alertas" className="space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  {/* Destaque Alerta e Prioridade */}
                                  <div className="grid gap-2 p-4 bg-rose-500/[0.03] border border-rose-500/10 rounded-xl shadow-sm">
                                    <FieldLabel tooltip="Grau de atenção ou urgência na estruturação local da rede.">
                                      <span className="text-rose-600 dark:text-rose-400 font-bold">Alerta da Rede</span>
                                    </FieldLabel>
                                    <Select value={editData.painel_alerta_rede || ""} onValueChange={(v) => handleChange("painel_alerta_rede", v)}>
                                      <SelectTrigger className="font-semibold border-rose-500/20 bg-background focus:ring-rose-500/40"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ADEQUADO">Adequado</SelectItem>
                                        <SelectItem value="ATENCAO">Atenção</SelectItem>
                                        <SelectItem value="CRITICO">Crítico</SelectItem>
                                        <SelectItem value="-">N/D</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="grid gap-2 p-4 bg-rose-500/[0.03] border border-rose-500/10 rounded-xl shadow-sm">
                                    <FieldLabel tooltip="Classificação para intervenção prioritária do MPPI e órgãos de apoio.">
                                      <span className="text-rose-600 dark:text-rose-400 font-bold">Atuação Prioritária?</span>
                                    </FieldLabel>
                                    <Select value={editData.necessita_atuacao_prioritaria || ""} onValueChange={(v) => handleChange("necessita_atuacao_prioritaria", v)}>
                                      <SelectTrigger className="font-semibold border-rose-500/20 bg-background focus:ring-rose-500/40"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="grid gap-2 col-span-1 md:col-span-2 p-1 mt-2">
                                    <FieldLabel tooltip="Casos de medidas protetivas e monitoramento ativo pela rede de segurança.">Ocorrências Monitoradas (Violência de Gênero)</FieldLabel>
                                    <Input 
                                      type="number" 
                                      value={editData.ocorrencias_total_violencia_genero_monitoradas ?? 0} 
                                      onChange={(e) => handleChange("ocorrencias_total_violencia_genero_monitoradas", parseInt(e.target.value) || 0)} 
                                    />
                                  </div>
                                  <div className="grid gap-2 p-1">
                                    <FieldLabel tooltip="Flag se o território já registrou feminicídio consumado no ciclo.">Tem Feminicídio Consumado?</FieldLabel>
                                    <Select value={editData.indicador_tem_feminicidio_consumado || ""} onValueChange={(v) => handleChange("indicador_tem_feminicidio_consumado", v)}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2 p-1">
                                    <FieldLabel tooltip="Flag se o território já registrou tentativa de feminicídio no ciclo.">Tem Tentativa?</FieldLabel>
                                    <Select value={editData.indicador_tem_tentativa_feminicidio || ""} onValueChange={(v) => handleChange("indicador_tem_tentativa_feminicidio", v)}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
 
                          <DialogFooter className="bg-muted/30 px-6 py-4 border-t border-border/50 flex flex-row items-center justify-between shrink-0">
                            <div className="text-xs text-muted-foreground font-medium">
                              {isDirty ? (
                                <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                  {dirtyFieldsCount} campo{dirtyFieldsCount > 1 ? "s" : ""} modificado{dirtyFieldsCount > 1 ? "s" : ""}
                                </span>
                              ) : (
                                "Nenhuma alteração pendente"
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
                              <Button 
                                onClick={handleSave} 
                                disabled={updateMutation.isPending || !isDirty}
                                className={cn(
                                  "min-w-[160px] font-semibold transition-all", 
                                  isDirty ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground"
                                )}
                              >
                                {updateMutation.isPending ? (
                                  <>
                                    <span className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full mr-2"></span>
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                                  </>
                                )}
                              </Button>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
