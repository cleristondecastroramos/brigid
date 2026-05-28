import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { municipiosQueryOptions } from "@/lib/csv-data";
import { useApp } from "@/context/AppContext";
import { Search, Save, Pencil, ArrowUpDown, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
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

  const updateMutation = useMutation({
    mutationFn: async (m: Partial<Municipio>) => {
      const res = await fetch(`http://localhost:3001/municipios/${m.id ?? m.codigo_ibge}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(m),
      });
      if (!res.ok) throw new Error("Erro ao atualizar município");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipios"] });
      setEditingId(null);
    },
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
    setEditingId(m.id ?? m.codigo_ibge);
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
        next.feminicidios_total_2023_2026 = 
          (Number(next.consumado_2023) || 0) + 
          (Number(next.consumado_2024) || 0) + 
          (Number(next.consumado_2025) || 0) + 
          (Number(next.consumado_2026) || 0);
          
        next.indicador_tem_feminicidio_consumado = next.feminicidios_total_2023_2026 > 0 ? "SIM" : "NAO";
      }
      
      // Auto-calculate Totals and Flags for Tentativas
      if (field.startsWith("tentado_")) {
        next.tentativas_total_2023_2026 = 
          (Number(next.tentado_2023) || 0) + 
          (Number(next.tentado_2024) || 0) + 
          (Number(next.tentado_2025) || 0) + 
          (Number(next.tentado_2026) || 0);
          
        next.indicador_tem_tentativa_feminicidio = next.tentativas_total_2023_2026 > 0 ? "SIM" : "NAO";
      }
      
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Gestão da Base Municipal</h2>
          <p className="text-sm text-muted-foreground">Edição administrativa completa de dados, infraestrutura e violência de gênero.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar município..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <table className="w-full text-sm text-left text-muted-foreground">
              <thead className="border-b border-border bg-slate-200 dark:bg-slate-800 text-xs uppercase text-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort("municipio")}>
                    <div className="flex items-center">Município <SortIcon column="municipio" /></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort("comarca")}>
                    <div className="flex items-center">Comarca <SortIcon column="comarca" /></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort("polo_regional")}>
                    <div className="flex items-center">Polo <SortIcon column="polo_regional" /></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort("opm_possui")}>
                    <div className="flex items-center">OPM <SortIcon column="opm_possui" /></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort("creas_possui")}>
                    <div className="flex items-center">CREAS <SortIcon column="creas_possui" /></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort("feminicidios_total_2023_2026")}>
                    <div className="flex items-center">Feminicídios <SortIcon column="feminicidios_total_2023_2026" /></div>
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" onClick={() => handleSort("tentativas_total_2023_2026")}>
                    <div className="flex items-center">Tentativas <SortIcon column="tentativas_total_2023_2026" /></div>
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.codigo_ibge} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="px-4 py-3 font-medium text-foreground">{m.municipio}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.comarca || "-"}</td>
                    <td className="px-4 py-3">{m.polo_regional}</td>
                    <td className="px-4 py-3">
                      <span className={m.opm_possui === "SIM" ? "text-[color:var(--color-success)] font-medium" : ""}>
                        {m.opm_possui || "NAO"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={m.creas_possui === "SIM" ? "text-[color:var(--color-success)] font-medium" : ""}>
                        {m.creas_possui || "NAO"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{m.feminicidios_total_2023_2026}</td>
                    <td className="px-4 py-3">{m.tentativas_total_2023_2026}</td>
                    <td className="px-4 py-3 text-right">
                      <Dialog open={editingId === (m.id ?? m.codigo_ibge)} onOpenChange={(open) => !open && setEditingId(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[850px] max-h-[95vh] overflow-y-auto p-0 border-none rounded-xl overflow-hidden bg-background [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:opacity-100">
                          <DialogHeader className="bg-[#195e6b] text-white p-5 border-none flex flex-col text-left">
                            <span className="text-[10px] uppercase font-medium tracking-widest opacity-70">Editar Município:</span>
                            <DialogTitle className="text-white text-[22px] font-bold mt-1.5 leading-tight">{m.municipio}</DialogTitle>
                          </DialogHeader>
                          
                          <div className="px-6 py-4">
                            <Tabs defaultValue="infra" className="w-full">
                              <TabsList className="grid w-full grid-cols-7 mb-4 bg-muted/65 p-1 rounded-lg">
                                <TabsTrigger value="infra" className="text-xs">Infra</TabsTrigger>
                                <TabsTrigger value="fluxos" className="text-xs">Fluxos</TabsTrigger>
                                <TabsTrigger value="seguranca" className="text-xs">Segurança</TabsTrigger>
                                <TabsTrigger value="assistencia" className="text-xs">Social</TabsTrigger>
                                <TabsTrigger value="consumados" className="text-xs">Consumados</TabsTrigger>
                                <TabsTrigger value="tentativas" className="text-xs">Tentativas</TabsTrigger>
                                <TabsTrigger value="alertas" className="text-xs">Alertas</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="infra" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Identifica se o município possui Organismo de Políticas para as Mulheres (Secretaria, Coordenadoria, Diretoria, etc) ativo.">Possui OPM?</FieldLabel>
                                    <Select value={editData.opm_possui || ""} onValueChange={(v) => handleChange("opm_possui", v)}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Identifica se o município possui Centro de Referência Especializado de Assistência Social implementado.">Possui CREAS?</FieldLabel>
                                    <Select value={editData.creas_possui || ""} onValueChange={(v) => handleChange("creas_possui", v)}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
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
                                  <div className="grid gap-2">
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
                                  <div className="grid gap-2 col-span-2">
                                    <FieldLabel tooltip="A população atual do município segundo os últimos dados demográficos oficiais.">População</FieldLabel>
                                    <Input 
                                      type="number" 
                                      value={editData.populacao || ""} 
                                      onChange={(e) => handleChange("populacao", parseInt(e.target.value) || 0)} 
                                    />
                                  </div>
                                  <div className="grid gap-2 col-span-2">
                                    <FieldLabel tooltip="Espaço para anotações técnicas e notas operacionais de acompanhamento.">Observações Sistema</FieldLabel>
                                    <Textarea 
                                      placeholder="Observações técnicas sobre os órgãos..."
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
                                  <div className="grid gap-1.5 col-span-2">
                                    <FieldLabel tooltip="Problemas práticos que dificultam o fluxo de investigação, perícia ou acolhimento.">Gargalos Identificados (Múltiplas Escolhas)</FieldLabel>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-border rounded-md p-3 max-h-[160px] overflow-y-auto bg-card">
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
                                              "flex items-start gap-2 text-xs cursor-pointer p-1.5 rounded transition-colors hover:bg-muted/40",
                                              checked && "bg-muted font-medium text-foreground",
                                              isDisabled && "opacity-50 cursor-not-allowed"
                                            )}
                                          >
                                            <input
                                              type="checkbox"
                                              className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                                              checked={checked}
                                              disabled={isDisabled}
                                              onChange={() => handleToggleGargalo(opt)}
                                            />
                                            <span>{opt}</span>
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
                                </div>
                              </TabsContent>

                              <TabsContent value="consumados" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Número de óbitos decorrentes de feminicídio consumado em 2023.">Consumados 2023</FieldLabel>
                                    <Input type="number" value={editData.consumado_2023 ?? 0} onChange={(e) => handleChange("consumado_2023", parseInt(e.target.value) || 0)} />
                                  </div>
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Número de óbitos decorrentes de feminicídio consumado em 2024.">Consumados 2024</FieldLabel>
                                    <Input type="number" value={editData.consumado_2024 ?? 0} onChange={(e) => handleChange("consumado_2024", parseInt(e.target.value) || 0)} />
                                  </div>
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Número de óbitos decorrentes de feminicídio consumado em 2025.">Consumados 2025</FieldLabel>
                                    <Input type="number" value={editData.consumado_2025 ?? 0} onChange={(e) => handleChange("consumado_2025", parseInt(e.target.value) || 0)} />
                                  </div>
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Número de óbitos decorrentes de feminicídio consumado em 2026.">Consumados 2026</FieldLabel>
                                    <Input type="number" value={editData.consumado_2026 ?? 0} onChange={(e) => handleChange("consumado_2026", parseInt(e.target.value) || 0)} />
                                  </div>
                                  <div className="grid gap-2 col-span-2 border-t pt-4 mt-2 border-border">
                                    <FieldLabel tooltip="Soma de todos os feminicídios consumados no período monitorado.">Feminicídios Total (2023-2026)</FieldLabel>
                                    <Input 
                                      type="number" 
                                      className="bg-accent/30 font-medium"
                                      value={editData.feminicidios_total_2023_2026 ?? 0} 
                                      onChange={(e) => handleChange("feminicidios_total_2023_2026", parseInt(e.target.value) || 0)} 
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Este total é calculado automaticamente a partir dos anos, mas pode ser sobreposto caso desejado.</p>
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="tentativas" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Número de tentativas registradas de feminicídio em 2023.">Tentados 2023</FieldLabel>
                                    <Input type="number" value={editData.tentado_2023 ?? 0} onChange={(e) => handleChange("tentado_2023", parseInt(e.target.value) || 0)} />
                                  </div>
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Número de tentativas registradas de feminicídio em 2024.">Tentados 2024</FieldLabel>
                                    <Input type="number" value={editData.tentado_2024 ?? 0} onChange={(e) => handleChange("tentado_2024", parseInt(e.target.value) || 0)} />
                                  </div>
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Número de tentativas registradas de feminicídio em 2025.">Tentados 2025</FieldLabel>
                                    <Input type="number" value={editData.tentado_2025 ?? 0} onChange={(e) => handleChange("tentado_2025", parseInt(e.target.value) || 0)} />
                                  </div>
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Número de tentativas registradas de feminicídio em 2026.">Tentados 2026</FieldLabel>
                                    <Input type="number" value={editData.tentado_2026 ?? 0} onChange={(e) => handleChange("tentado_2026", parseInt(e.target.value) || 0)} />
                                  </div>
                                  <div className="grid gap-2 col-span-2 border-t pt-4 mt-2 border-border">
                                    <FieldLabel tooltip="Soma de todas as tentativas de feminicídio no período.">Tentativas Total (2023-2026)</FieldLabel>
                                    <Input 
                                      type="number" 
                                      className="bg-accent/30 font-medium"
                                      value={editData.tentativas_total_2023_2026 ?? 0} 
                                      onChange={(e) => handleChange("tentativas_total_2023_2026", parseInt(e.target.value) || 0)} 
                                    />
                                  </div>
                                </div>
                              </TabsContent>

                              <TabsContent value="alertas" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid gap-2 col-span-2">
                                    <FieldLabel tooltip="Casos de medidas protetivas e monitoramento ativo pela rede de segurança.">Ocorrências Monitoradas (Violência de Gênero)</FieldLabel>
                                    <Input 
                                      type="number" 
                                      value={editData.ocorrencias_total_violencia_genero_monitoradas ?? 0} 
                                      onChange={(e) => handleChange("ocorrencias_total_violencia_genero_monitoradas", parseInt(e.target.value) || 0)} 
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Flag se o território já registrou feminicídio consumado no ciclo.">Tem Feminicídio Consumado?</FieldLabel>
                                    <Select value={editData.indicador_tem_feminicidio_consumado || ""} onValueChange={(v) => handleChange("indicador_tem_feminicidio_consumado", v)}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Flag se o território já registrou tentativa de feminicídio no ciclo.">Tem Tentativa?</FieldLabel>
                                    <Select value={editData.indicador_tem_tentativa_feminicidio || ""} onValueChange={(v) => handleChange("indicador_tem_tentativa_feminicidio", v)}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SIM">Sim</SelectItem>
                                        <SelectItem value="NAO">Não</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Grau de atenção ou urgência na estruturação local da rede.">Alerta da Rede</FieldLabel>
                                    <Select value={editData.painel_alerta_rede || ""} onValueChange={(v) => handleChange("painel_alerta_rede", v)}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ADEQUADO">Adequado</SelectItem>
                                        <SelectItem value="ATENCAO">Atenção</SelectItem>
                                        <SelectItem value="CRITICO">Crítico</SelectItem>
                                        <SelectItem value="-">N/D</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid gap-2">
                                    <FieldLabel tooltip="Classificação para intervenção prioritária do MPPI e órgãos de apoio.">Atuação Prioritária?</FieldLabel>
                                    <Select value={editData.necessita_atuacao_prioritaria || ""} onValueChange={(v) => handleChange("necessita_atuacao_prioritaria", v)}>
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
 
                          <DialogFooter className="px-6 pb-5 pt-3 mb-2 mt-auto border-t border-border/20 flex flex-row gap-2 justify-end">
                            <Button variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={updateMutation.isPending}>
                              <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                            </Button>
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
