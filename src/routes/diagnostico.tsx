import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Building2, HeartHandshake, ShieldAlert, Award, 
  MapPin, CheckCircle, AlertCircle, XCircle, Search, 
  ArrowRight, Users, GraduationCap, HardHat, FileText, ChevronRight, HelpCircle
} from "lucide-react";
import { municipiosQueryOptions, pct } from "@/lib/csv-data";
import { useMunicipios } from "@/lib/useMunicipios";
import { KpiCard } from "@/components/kpi-card";
import { PiauiMap } from "@/components/piaui-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export const Route = createFileRoute("/diagnostico")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: DiagnosticoPanel,
});

// Cores HSL harmoniosas
const COLOR_OK = "oklch(0.55 0.13 175)"; // Verde
const COLOR_WARN = "oklch(0.75 0.15 70)"; // Amarelo
const COLOR_CRIT = "oklch(0.65 0.2 27)"; // Vermelho
const COLOR_GRAY = "oklch(0.92 0.01 230)"; // Cinza

function DiagnosticoPanel() {
  const { data: municipios } = useMunicipios();
  
  // Estado de nível hierárquico e filtros
  const [selectedPolo, setSelectedPolo] = useState("__all");
  const [selectedComarca, setSelectedComarca] = useState("__all");
  const [selectedMunicipio, setSelectedMunicipio] = useState("__all");
  const [tab, setTab] = useState("infra");
  const [q, setQ] = useState("");

  const comarcas = useMemo(() => {
    let list = municipios;
    if (selectedPolo !== "__all") {
      list = list.filter((m) => m.polo_regional === selectedPolo);
    }
    return Array.from(new Set(list.map((m) => m.comarca).filter(Boolean))).sort();
  }, [municipios, selectedPolo]);
  const polos = useMemo(() => Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort(), [municipios]);
  const municipiosDropdown = useMemo(() => {
    let list = municipios;
    if (selectedPolo !== "__all") list = list.filter(m => m.polo_regional === selectedPolo);
    if (selectedComarca !== "__all") list = list.filter(m => m.comarca === selectedComarca);
    return list.map(m => ({ label: m.municipio, value: m.codigo_ibge })).sort((a,b) => a.label.localeCompare(b.label));
  }, [municipios, selectedPolo, selectedComarca]);

  // Hierarquia ativa determinada dinamicamente
  const activeLevel = useMemo(() => {
    if (selectedMunicipio !== "__all") return "municipio";
    if (selectedComarca !== "__all") return "comarca";
    if (selectedPolo !== "__all") return "polo";
    return "estado";
  }, [selectedMunicipio, selectedComarca, selectedPolo]);

  // Filtragem territorial da base
  const filteredMunicipios = useMemo(() => {
    return municipios.filter((m) => {
      if (selectedMunicipio !== "__all" && m.codigo_ibge !== selectedMunicipio) return false;
      if (selectedComarca !== "__all" && m.comarca !== selectedComarca) return false;
      if (selectedPolo !== "__all" && m.polo_regional !== selectedPolo) return false;
      if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [municipios, selectedMunicipio, selectedComarca, selectedPolo, q]);

  // Handlers para Drilldown interativo no mapa ou listas
  const handleSelectPolo = (poloName: string) => {
    setSelectedPolo(poloName);
    setSelectedComarca("__all");
    setSelectedMunicipio("__all");
  };

  const handleSelectComarca = (comarcaName: string) => {
    setSelectedComarca(comarcaName);
    setSelectedMunicipio("__all");
  };

  const handleSelectMunicipio = (ibgeCode: string) => {
    const m = municipios.find(x => x.codigo_ibge === ibgeCode);
    if (m) {
      setSelectedPolo(m.polo_regional);
      setSelectedComarca(m.comarca);
      setSelectedMunicipio(ibgeCode);
    }
  };

  const handleResetFilters = () => {
    setSelectedPolo("__all");
    setSelectedComarca("__all");
    setSelectedMunicipio("__all");
    setQ("");
  };

  // ----------------------------------------------------
  // CÁLCULOS DOS INDICADORES E ÍNDICES SINTÉTICOS
  // ----------------------------------------------------
  const stats = useMemo(() => {
    const count = filteredMunicipios.length;
    if (count === 0) return {
      ierMedio: 0, imfMedio: 0, iqtMedio: 0,
      pctFluxoFormal: "0%", pctSalaEsp: "0%", pctRecursosMin: "0%",
      pctAtendPsicossocial: "0%", pctAtendJuridico: "0%", pctArticulacaoRede: "0%",
      totalFeminicidiosConsumados: 0, totalFeminicidiosTentados: 0,
      pctProtInvestigacao: "0%", pctProtPericial: "0%", pctCapacitadoPersp: "0%",
      pctTreinamentoFem: "0%", totalCapacitacoes: 0,
      pctProtAssistencial: "0%", pctFluxoEncam: "0%", pctArticCreasRede: "0%",
      pctEquipeMinimaCreas: "0%", totalProfCapacitados: 0
    };

    const sumIER = filteredMunicipios.reduce((acc, m) => acc + (m.ier_score ?? 0), 0);
    const sumIMF = filteredMunicipios.reduce((acc, m) => acc + (m.imf_score ?? 0), 0);
    const sumIQT = filteredMunicipios.reduce((acc, m) => acc + (m.iqt_score ?? 0), 0);

    const fluxos = filteredMunicipios.filter(m => m.tem_fluxo_formal === "SIM").length;
    const salaEsp = filteredMunicipios.filter(m => m.tem_sala_especializada === "SIM").length;
    const recursos = filteredMunicipios.filter(m => m.tem_recursos_minimos === "SIM").length;
    const psico = filteredMunicipios.filter(m => m.tem_atendimento_psicossocial === "SIM").length;
    const jur = filteredMunicipios.filter(m => m.tem_atendimento_juridico === "SIM").length;
    const articulacao = filteredMunicipios.filter(m => m.tem_articulacao_rede === "SIM").length;

    const femCons = filteredMunicipios.reduce((acc, m) => acc + (m.feminicidios_consumados_2024_2025 ?? 0), 0);
    const femTent = filteredMunicipios.reduce((acc, m) => acc + (m.feminicidios_tentados_2024_2025 ?? 0), 0);
    const protInv = filteredMunicipios.filter(m => m.tem_protocolo_investigacao === "SIM").length;
    const protPer = filteredMunicipios.filter(m => m.tem_protocolo_pericial === "SIM").length;
    const capPersp = filteredMunicipios.filter(m => m.capacitado_perspectiva_genero === "SIM").length;
    const treinFem = filteredMunicipios.filter(m => m.treinamento_especifico_feminicidio === "SIM").length;
    const totalCaps = filteredMunicipios.reduce((acc, m) => acc + (m.qtd_capacitacoes_realizadas ?? 0), 0);

    const protAssist = filteredMunicipios.filter(m => m.tem_protocolo_assistencial === "SIM").length;
    const fluxoEncam = filteredMunicipios.filter(m => m.tem_fluxo_encaminhamento === "SIM").length;
    const articCreas = filteredMunicipios.filter(m => m.articulacao_creas_rede === "SIM").length;
    const equipeMinCreas = filteredMunicipios.filter(m => m.tem_equipe_minima_creas === "SIM").length;
    const profCaps = filteredMunicipios.reduce((acc, m) => acc + (m.profissionais_capacitados ?? 0), 0);

    return {
      ierMedio: Number((sumIER / count).toFixed(1)),
      imfMedio: Number((sumIMF / count).toFixed(1)),
      iqtMedio: Number((sumIQT / count).toFixed(1)),
      pctFluxoFormal: pct(fluxos, count),
      pctSalaEsp: pct(salaEsp, count),
      pctRecursosMin: pct(recursos, count),
      pctAtendPsicossocial: pct(psico, count),
      pctAtendJuridico: pct(jur, count),
      pctArticulacaoRede: pct(articulacao, count),

      totalFeminicidiosConsumados: femCons,
      totalFeminicidiosTentados: femTent,
      pctProtInvestigacao: pct(protInv, count),
      pctProtPericial: pct(protPer, count),
      pctCapacitadoPersp: pct(capPersp, count),
      pctTreinamentoFem: pct(treinFem, count),
      totalCapacitacoes: totalCaps,

      pctProtAssistencial: pct(protAssist, count),
      pctFluxoEncam: pct(fluxoEncam, count),
      pctArticCreasRede: pct(articCreas, count),
      pctEquipeMinimaCreas: pct(equipeMinCreas, count),
      totalProfCapacitados: profCaps
    };
  }, [filteredMunicipios]);

  // Ranking de polos com menores índices (maiores lacunas)
  const rankingLacunas = useMemo(() => {
    const poloStats: Record<string, { name: string; sumIER: number; sumIMF: number; sumIQT: number; count: number }> = {};
    municipios.forEach(m => {
      if (!m.polo_regional) return;
      if (!poloStats[m.polo_regional]) {
        poloStats[m.polo_regional] = { name: m.polo_regional, sumIER: 0, sumIMF: 0, sumIQT: 0, count: 0 };
      }
      poloStats[m.polo_regional].sumIER += m.ier_score ?? 0;
      poloStats[m.polo_regional].sumIMF += m.imf_score ?? 0;
      poloStats[m.polo_regional].sumIQT += m.iqt_score ?? 0;
      poloStats[m.polo_regional].count += 1;
    });

    return Object.values(poloStats).map(p => {
      const ier = p.sumIER / p.count;
      const imf = p.sumIMF / p.count;
      const iqt = p.sumIQT / p.count;
      const mediaGeral = (ier + imf + iqt) / 3;
      return {
        polo: p.name,
        ier: Number(ier.toFixed(1)),
        imf: Number(imf.toFixed(1)),
        iqt: Number(iqt.toFixed(1)),
        media: Number(mediaGeral.toFixed(1)),
        prioridade: mediaGeral < 4 ? "CRÍTICA" : mediaGeral < 6.5 ? "MÉDIA" : "ESTÁVEL"
      };
    }).sort((a, b) => a.media - b.media); // Ordem crescente: piores médias primeiro
  }, [municipios]);

  // Cruzamento do Painel 2: Ocorrências vs Capacitação (exibir por polo)
  const poloCruzamentoData = useMemo(() => {
    const poloStats: Record<string, { polo: string; ocorrencias: number; capacitacoes: number }> = {};
    municipios.forEach(m => {
      if (!m.polo_regional) return;
      if (!poloStats[m.polo_regional]) {
        poloStats[m.polo_regional] = { polo: m.polo_regional, ocorrencias: 0, capacitacoes: 0 };
      }
      poloStats[m.polo_regional].ocorrencias += (m.feminicidios_consumados_2024_2025 ?? 0) + (m.feminicidios_tentados_2024_2025 ?? 0);
      poloStats[m.polo_regional].capacitacoes += m.qtd_capacitacoes_realizadas ?? 0;
    });
    return Object.values(poloStats);
  }, [municipios]);

  // Lista de gargalos destacados
  const listGargalos = useMemo(() => {
    return filteredMunicipios
      .filter(m => m.gargalos_identificados && m.gargalos_identificados !== "Nenhum gargalo crítico identificado.")
      .slice(0, 8);
  }, [filteredMunicipios]);

  // Determinar cores do mapa temático dependendo do painel ativo
  const mapColorFn = (m: any) => {
    if (!m) return COLOR_GRAY;
    // Highlight based on current filtered state
    const isIncluded = filteredMunicipios.some(fm => fm.codigo_ibge === m.codigo_ibge);
    if (!isIncluded) return "oklch(0.96 0.005 240)"; // dim if filtered out

    if (tab === "infra") {
      const score = m.ier_score ?? 0;
      return score >= 7 ? COLOR_OK : score >= 4 ? COLOR_WARN : COLOR_CRIT;
    } else if (tab === "violencia") {
      const score = m.iqt_score ?? 0;
      return score >= 7 ? COLOR_OK : score >= 4 ? COLOR_WARN : COLOR_CRIT;
    } else {
      const score = m.imf_score ?? 0;
      return score >= 7 ? COLOR_OK : score >= 4 ? COLOR_WARN : COLOR_CRIT;
    }
  };

  const mapLegend = useMemo(() => {
    let labelSuf = "Pontuação";
    if (tab === "infra") labelSuf = "Estrutura (IER)";
    else if (tab === "violencia") labelSuf = "Qualificação (IQT)";
    else labelSuf = "Maturidade (IMF)";

    return [
      { label: `Adequada / Alta (>= 7) — ${labelSuf}`, color: COLOR_OK },
      { label: `Regular / Média (4 a 6.9) — ${labelSuf}`, color: COLOR_WARN },
      { label: `Insuficiente / Crítica (< 4) — ${labelSuf}`, color: COLOR_CRIT }
    ];
  }, [tab]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Inteligência Territorial */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Diagnóstico Integrado da Rede e Fluxos
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitoramento operacional do Termo de Adesão e Participação (Etapas 03, 04 e 05)
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedPolo} onValueChange={(v) => { setSelectedPolo(v); setSelectedComarca("__all"); setSelectedMunicipio("__all"); }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Polo Regional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos os Polos</SelectItem>
                  {polos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedComarca} onValueChange={(v) => { setSelectedComarca(v); setSelectedMunicipio("__all"); }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Comarca" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas as Comarcas</SelectItem>
                  {comarcas.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedMunicipio} onValueChange={handleSelectMunicipio}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Município" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos os Municípios</SelectItem>
                  {municipiosDropdown.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>

              {(selectedPolo !== "__all" || selectedComarca !== "__all" || selectedMunicipio !== "__all" || q) && (
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>

          {/* Breadcrumb da Leitura Territorial */}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3">
            <span className="font-semibold text-foreground uppercase text-[10px]">Escopo Territorial:</span>
            <span className={cn("px-2 py-0.5 rounded-full border", activeLevel === "estado" ? "bg-primary/10 border-primary/20 text-primary font-medium" : "bg-muted")}>
              Estadual
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className={cn("px-2 py-0.5 rounded-full border", activeLevel === "polo" ? "bg-primary/10 border-primary/20 text-primary font-medium" : "bg-muted", selectedPolo === "__all" && "opacity-50")}>
              Polo: {selectedPolo === "__all" ? "Geral" : selectedPolo}
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className={cn("px-2 py-0.5 rounded-full border", activeLevel === "comarca" ? "bg-primary/10 border-primary/20 text-primary font-medium" : "bg-muted", selectedComarca === "__all" && "opacity-50")}>
              Comarca: {selectedComarca === "__all" ? "Geral" : selectedComarca}
            </span>
            <ChevronRight className="h-3 w-3" />
            <span className={cn("px-2 py-0.5 rounded-full border", activeLevel === "municipio" ? "bg-primary/10 border-primary/20 text-primary font-medium" : "bg-muted", selectedMunicipio === "__all" && "opacity-50")}>
              Município: {selectedMunicipio === "__all" ? "Geral" : municipios.find(m=>m.codigo_ibge===selectedMunicipio)?.municipio}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards dos Índices Sintéticos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-primary/70">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Estrutura da Rede (IER Médio)</CardDescription>
            <CardTitle className="text-3xl font-extrabold flex items-baseline gap-2">
              {stats.ierMedio} <span className="text-xs font-normal text-muted-foreground">/ 10</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.ierMedio * 10} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-2">
              Sala especializada, recursos mínimos e suficiência do atendimento físico local.
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success/70">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Maturidade dos Fluxos (IMF Médio)</CardDescription>
            <CardTitle className="text-3xl font-extrabold flex items-baseline gap-2">
              {stats.imfMedio} <span className="text-xs font-normal text-muted-foreground">/ 10</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.imfMedio * 10} className="h-1.5 bg-muted" />
            <p className="text-[10px] text-muted-foreground mt-2">
              Existência de fluxos formais de acolhimento e articulação de rede interinstitucional.
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning/70">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Qualificação Técnica (IQT Médio)</CardDescription>
            <CardTitle className="text-3xl font-extrabold flex items-baseline gap-2">
              {stats.iqtMedio} <span className="text-xs font-normal text-muted-foreground">/ 10</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.iqtMedio * 10} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-2">
              Mão de obra capacitada em gênero, comarcas com treinamento específico em feminicídio.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais dos Painéis Temáticos */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card/75 border border-border/60 shadow-md hover:shadow-lg transition-all p-1.5 rounded-xl gap-1">
          <TabsTrigger 
            value="infra" 
            className="text-xs font-semibold py-2.5 rounded-lg transition-all duration-200 hover:bg-muted/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md cursor-pointer"
          >
            Fluxos e Infraestrutura
          </TabsTrigger>
          <TabsTrigger 
            value="violencia" 
            className="text-xs font-semibold py-2.5 rounded-lg transition-all duration-200 hover:bg-muted/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md cursor-pointer"
          >
            Violência, Investigação e Perícias
          </TabsTrigger>
          <TabsTrigger 
            value="assistencia" 
            className="text-xs font-semibold py-2.5 rounded-lg transition-all duration-200 hover:bg-muted/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md cursor-pointer"
          >
            Assistência Social e Capacitação
          </TabsTrigger>
        </TabsList>

        {/* ========================================================
            PAINEL 1: FLUXOS E INFRAESTRUTURA DE ATENDIMENTO
            ======================================================== */}
        <TabsContent value="infra" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Mapa Temático de Estrutura */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Mapa Temático de Estrutura da Rede (IER)</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Exibindo {filteredMunicipios.length} municípios
                  </span>
                </CardTitle>
                <CardDescription className="text-xs">
                  A cor do município no mapa representa o grau de adequação do Índice de Estrutura da Rede (IER). Clicar no município abre a ficha detalhada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PiauiMap 
                  colorFn={mapColorFn} 
                  legend={mapLegend} 
                  height={500}
                />
              </CardContent>
            </Card>

            {/* Quadro de Cobertura e Ranking */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Indicadores do Recorte Territorial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Fluxo Formal de Atendimento</span>
                      <span className="font-semibold">{stats.pctFluxoFormal}</span>
                    </div>
                    <Progress value={parseFloat(stats.pctFluxoFormal)} className="h-1 bg-muted" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Sala / Estrutura Especializada</span>
                      <span className="font-semibold">{stats.pctSalaEsp}</span>
                    </div>
                    <Progress value={parseFloat(stats.pctSalaEsp)} className="h-1 bg-muted" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Recursos Materiais Mínimos</span>
                      <span className="font-semibold">{stats.pctRecursosMin}</span>
                    </div>
                    <Progress value={parseFloat(stats.pctRecursosMin)} className="h-1 bg-muted" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Atendimento Psicossocial Local</span>
                      <span className="font-semibold">{stats.pctAtendPsicossocial}</span>
                    </div>
                    <Progress value={parseFloat(stats.pctAtendPsicossocial)} className="h-1 bg-muted" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Atendimento Jurídico na Rede</span>
                      <span className="font-semibold">{stats.pctAtendJuridico}</span>
                    </div>
                    <Progress value={parseFloat(stats.pctAtendJuridico)} className="h-1 bg-muted" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Articulação da Rede de Segurança/Saúde</span>
                      <span className="font-semibold">{stats.pctArticulacaoRede}</span>
                    </div>
                    <Progress value={parseFloat(stats.pctArticulacaoRede)} className="h-1 bg-muted" />
                  </div>
                </CardContent>
              </Card>

              {/* Ranking de fragilidade territorial */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Polos Regionais Críticos (Geral)</CardTitle>
                  <CardDescription className="text-[10px]">
                    Polos com menores médias nos índices de estrutura, fluxos e treinamento.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[220px] overflow-y-auto px-4 pb-4">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="py-1 text-xs">Polo</TableHead>
                          <TableHead className="py-1 text-xs text-right">Média</TableHead>
                          <TableHead className="py-1 text-xs text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankingLacunas.slice(0, 5).map((r) => (
                          <TableRow key={r.polo} className="hover:bg-muted/30 cursor-pointer" onClick={() => handleSelectPolo(r.polo)}>
                            <TableCell className="py-2 text-xs font-medium">{r.polo}</TableCell>
                            <TableCell className="py-2 text-xs text-right font-bold">{r.media}</TableCell>
                            <TableCell className="py-2 text-xs text-center">
                              <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-semibold", 
                                r.prioridade === "CRÍTICA" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning-foreground"
                              )}>
                                {r.prioridade}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Matriz de presenca/ausencia de serviços */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Matriz Territorial de Estrutura por Município</CardTitle>
              <CardDescription className="text-xs">
                Visão tabular comparativa detalhando a presença ou ausência de recursos de infraestrutura fundamentais nos municípios selecionados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/70 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-xs">Município</TableHead>
                      <TableHead className="text-xs">Comarca</TableHead>
                      <TableHead className="text-xs text-center">Sala Esp.</TableHead>
                      <TableHead className="text-xs text-center">Recursos Mín.</TableHead>
                      <TableHead className="text-xs text-center">Atend. Psico</TableHead>
                      <TableHead className="text-xs text-center">Atend. Jurídico</TableHead>
                      <TableHead className="text-xs text-center">Fluxo Formal</TableHead>
                      <TableHead className="text-xs text-center">Suficiência</TableHead>
                      <TableHead className="text-xs text-right">Score IER</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMunicipios.slice(0, 15).map(m => (
                      <TableRow key={m.codigo_ibge} className="hover:bg-muted/50">
                        <TableCell className="font-semibold text-xs py-2 text-foreground">
                          <Link to="/municipios/$slug" params={{ slug: m.municipio_slug }} className="hover:underline text-primary">
                            {m.municipio}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">{m.comarca}</TableCell>
                        <TableCell className="py-2 text-center">
                          {m.tem_sala_especializada === "SIM" ? <CheckCircle className="h-4 w-4 text-[color:var(--color-success)] mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {m.tem_recursos_minimos === "SIM" ? <CheckCircle className="h-4 w-4 text-[color:var(--color-success)] mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {m.tem_atendimento_psicossocial === "SIM" ? <CheckCircle className="h-4 w-4 text-[color:var(--color-success)] mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {m.tem_atendimento_juridico === "SIM" ? <CheckCircle className="h-4 w-4 text-[color:var(--color-success)] mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {m.tem_fluxo_formal === "SIM" ? <CheckCircle className="h-4 w-4 text-[color:var(--color-success)] mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", 
                            m.grau_suficiencia_estrutura === "ADEQUADO" ? "bg-success/15 text-[color:var(--color-success)]" :
                            m.grau_suficiencia_estrutura === "PARCIAL" ? "bg-warning/15 text-warning-foreground" :
                            "bg-destructive/15 text-destructive"
                          )}>
                            {m.grau_suficiencia_estrutura}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-2 font-bold text-xs">{m.ier_score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredMunicipios.length > 15 && (
                <p className="text-[11px] text-muted-foreground mt-2 text-center">
                  Exibindo 15 de {filteredMunicipios.length} municípios cadastrados no recorte. Use a pesquisa ou filtros no topo para detalhar.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================
            PAINEL 2: VIOLÊNCIA DE GÊNERO, INVESTIGAÇÃO E PERÍCIAS
            ======================================================== */}
        <TabsContent value="violencia" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <KpiCard label="Feminicídios Consumados (Recorte)" value={stats.totalFeminicidiosConsumados} hint="2024-2025 consolidado" tone="critical" icon={ShieldAlert} />
            <KpiCard label="Feminicídios Tentados (Recorte)" value={stats.totalFeminicidiosTentados} hint="2024-2025 consolidado" tone="warning" icon={ShieldAlert} />
            <KpiCard label="Protocolo de Investigação" value={stats.pctProtInvestigacao} hint="Mapeado na polícia" tone="primary" icon={FileText} />
            <KpiCard label="Total de Capacitações" value={stats.totalCapacitacoes} hint="Realizadas na segurança" tone="success" icon={GraduationCap} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Gráfico de Correlação: Volume de Ocorrências vs Capacitação */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Mapeamento de Lacuna: Ocorrências vs Capacitação (Por Polo)</CardTitle>
                <CardDescription className="text-xs">
                  Gráfico identificando polos com alto volume de violência de gênero e necessidade urgente de ampliação do nível de capacitação técnica.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[320px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={poloCruzamentoData} margin={{ top: 25, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="polo" fontSize={11} />
                    <YAxis hide={true} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar 
                      dataKey="ocorrencias" 
                      name="Ocorrências Feminicídio (Cons. + Tent.)" 
                      fill="oklch(0.65 0.2 27)" 
                      radius={[4, 4, 0, 0]} 
                      label={{ position: "top", fontSize: 10, fontWeight: "600", fill: "oklch(0.3 0.02 240)" }}
                    />
                    <Bar 
                      dataKey="capacitacoes" 
                      name="Capacitações de Equipes" 
                      fill="oklch(0.55 0.13 175)" 
                      radius={[4, 4, 0, 0]} 
                      label={{ position: "top", fontSize: 10, fontWeight: "600", fill: "oklch(0.3 0.02 240)" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lista de Gargalos Técnicos Identificados */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Gargalos Críticos Identificados</CardTitle>
                <CardDescription className="text-[10px]">
                  Fatos reportados pelas equipes de investigação e perícias locais.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[280px] overflow-y-auto px-4 pb-4 space-y-3">
                  {listGargalos.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Nenhum gargalo reportado no recorte atual.</p>
                  ) : (
                    listGargalos.map((m, idx) => (
                      <div key={m.codigo_ibge} className="border-b border-border/40 pb-2 last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">{m.municipio}</span>
                          <span className="text-[9px] text-muted-foreground">{m.polo_regional}</span>
                        </div>
                        <p className="text-[11px] text-destructive mt-1 italic">
                          &ldquo;{m.gargalos_identificados}&rdquo;
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Matriz Qualitativa do Painel 2 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Protocolos Técnicos e Aderência por Município</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[260px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/70 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-xs">Município</TableHead>
                      <TableHead className="text-xs text-center">Prot. Investigação</TableHead>
                      <TableHead className="text-xs text-center">Prot. Pericial</TableHead>
                      <TableHead className="text-xs text-center">Capacitado Gênero</TableHead>
                      <TableHead className="text-xs text-center">Treinamento Específico</TableHead>
                      <TableHead className="text-xs text-center">Qtd. Capacitações</TableHead>
                      <TableHead className="text-xs text-center">Aderência Técnica</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMunicipios.slice(0, 15).map(m => (
                      <TableRow key={m.codigo_ibge}>
                        <TableCell className="font-semibold text-xs py-2 text-primary">{m.municipio}</TableCell>
                        <TableCell className="py-2 text-center">
                          {m.tem_protocolo_investigacao === "SIM" ? <span className="text-xs font-bold text-[color:var(--color-success)]">SIM</span> : <span className="text-xs text-destructive">NÃO</span>}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {m.tem_protocolo_pericial === "SIM" ? <span className="text-xs font-bold text-[color:var(--color-success)]">SIM</span> : <span className="text-xs text-destructive">NÃO</span>}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {m.capacitado_perspectiva_genero === "SIM" ? <span className="text-xs font-bold text-[color:var(--color-success)]">SIM</span> : <span className="text-xs text-destructive">NÃO</span>}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          {m.treinamento_especifico_feminicidio === "SIM" ? <span className="text-xs font-bold text-[color:var(--color-success)]">SIM</span> : <span className="text-xs text-destructive">NÃO</span>}
                        </TableCell>
                        <TableCell className="py-2 text-center text-xs font-medium">{m.qtd_capacitacoes_realizadas}</TableCell>
                        <TableCell className="py-2 text-center">
                          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", 
                            m.grau_aderencia_protocolo === "ALTO" ? "bg-success/15 text-[color:var(--color-success)]" :
                            m.grau_aderencia_protocolo === "MEDIO" ? "bg-warning/15 text-warning-foreground" :
                            "bg-destructive/15 text-destructive"
                          )}>
                            {m.grau_aderencia_protocolo}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================
            PAINEL 3: ASSISTÊNCIA SOCIAL, PROTOCOLOS E CAPACITAÇÃO
            ======================================================== */}
        <TabsContent value="assistencia" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Protocolos Socioassistenciais</CardTitle>
                <CardDescription className="text-xs">Estrutura CREAS e fluxos de atendimento específicos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Protocolo de Atendimento Socioassistencial</span>
                    <span className="font-semibold text-foreground">{stats.pctProtAssistencial}</span>
                  </div>
                  <Progress value={parseFloat(stats.pctProtAssistencial)} className="h-1 bg-muted" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Fluxo Formal de Encaminhamento</span>
                    <span className="font-semibold text-foreground">{stats.pctFluxoEncam}</span>
                  </div>
                  <Progress value={parseFloat(stats.pctFluxoEncam)} className="h-1 bg-muted" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Articulação CREAS com Rede de Proteção</span>
                    <span className="font-semibold text-foreground">{stats.pctArticCreasRede}</span>
                  </div>
                  <Progress value={parseFloat(stats.pctArticCreasRede)} className="h-1 bg-muted" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Equipe Técnica Mínima Completa</span>
                    <span className="font-semibold text-foreground">{stats.pctEquipeMinimaCreas}</span>
                  </div>
                  <Progress value={parseFloat(stats.pctEquipeMinimaCreas)} className="h-1 bg-muted" />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Detalhamento dos Recursos e Cobertura Assistencial</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[300px] overflow-y-auto px-4 pb-4">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs">Município</TableHead>
                        <TableHead className="text-xs text-center">CREAS Ativo</TableHead>
                        <TableHead className="text-xs text-center">Equipe Mínima</TableHead>
                        <TableHead className="text-xs text-center">Articulação CREAS</TableHead>
                        <TableHead className="text-xs text-center">Prof. Capacitados</TableHead>
                        <TableHead className="text-xs">Última Capacitação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMunicipios.slice(0, 15).map(m => (
                        <TableRow key={m.codigo_ibge} className="hover:bg-muted/30">
                          <TableCell className="font-semibold text-xs py-2 text-primary">{m.municipio}</TableCell>
                          <TableCell className="py-2 text-center text-xs">
                            {m.creas_possui === "SIM" ? (
                              <span className="text-[10px] bg-success/10 text-[color:var(--color-success)] px-1.5 py-0.5 rounded font-semibold">ATIVO</span>
                            ) : (
                              <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-semibold">INATIVO</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {m.tem_equipe_minima_creas === "SIM" ? <CheckCircle className="h-4 w-4 text-[color:var(--color-success)] mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {m.articulacao_creas_rede === "SIM" ? <CheckCircle className="h-4 w-4 text-[color:var(--color-success)] mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" />}
                          </TableCell>
                          <TableCell className="py-2 text-center text-xs font-bold">{m.profissionais_capacitados}</TableCell>
                          <TableCell className="py-2 text-xs text-muted-foreground">{m.data_ultima_capacitacao || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Visão de Ficha Territorial Completa para Municípios Únicos */}
      {selectedMunicipio !== "__all" && filteredMunicipios[0] && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <MapPin className="h-5 w-5" />
              Ficha Territorial Completa do Município: {filteredMunicipios[0].municipio}
            </CardTitle>
            <CardDescription className="text-xs">
              Consolidado de informações diagnósticas, infraestrutura, protocolos e violência doméstica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1 bg-background p-3 rounded-lg border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">População</p>
                <p className="text-sm font-semibold">{filteredMunicipios[0].populacao.toLocaleString("pt-BR")} hab.</p>
              </div>
              <div className="space-y-1 bg-background p-3 rounded-lg border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Comarca / Polo</p>
                <p className="text-sm font-semibold">{filteredMunicipios[0].comarca} / {filteredMunicipios[0].polo_regional}</p>
              </div>
              <div className="space-y-1 bg-background p-3 rounded-lg border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Score Geral IER</p>
                <p className="text-sm font-semibold text-primary">{filteredMunicipios[0].ier_score} / 10</p>
              </div>
              <div className="space-y-1 bg-background p-3 rounded-lg border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Última Atualização</p>
                <p className="text-sm font-semibold">{filteredMunicipios[0].ultima_atualizacao_referencia || "2026-05-28"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-6">
              <div className="space-y-2 bg-background/50 p-4 rounded-lg border border-border/40">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1.5 mb-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" /> Infraestrutura e Fluxos
                </h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex justify-between"><span>Sala Especializada:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].tem_sala_especializada}</span></li>
                  <li className="flex justify-between"><span>Recursos Mínimos:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].tem_recursos_minimos}</span></li>
                  <li className="flex justify-between"><span>Estrutura Geral:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].grau_suficiencia_estrutura}</span></li>
                  <li className="flex justify-between"><span>Fluxo Formal:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].tem_fluxo_formal}</span></li>
                  <li className="flex justify-between"><span>Articulação Rede:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].tem_articulacao_rede}</span></li>
                </ul>
              </div>

              <div className="space-y-2 bg-background/50 p-4 rounded-lg border border-border/40">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1.5 mb-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" /> Investigação e Perícias
                </h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex justify-between"><span>Protocolo Investigação:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].tem_protocolo_investigacao}</span></li>
                  <li className="flex justify-between"><span>Protocolo Pericial:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].tem_protocolo_pericial}</span></li>
                  <li className="flex justify-between"><span>Aderência Protocolo:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].grau_aderencia_protocolo}</span></li>
                  <li className="flex justify-between"><span>Capacitações na Segurança:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].qtd_capacitacoes_realizadas}</span></li>
                  <li className="flex justify-between"><span>Treinamento Feminicídio:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].treinamento_especifico_feminicidio}</span></li>
                </ul>
              </div>

              <div className="space-y-2 bg-background/50 p-4 rounded-lg border border-border/40">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1.5 mb-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" /> Assistência Social
                </h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex justify-between"><span>Protocolo Socioassistencial:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].tem_protocolo_assistencial}</span></li>
                  <li className="flex justify-between"><span>Encaminhamento Formal:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].tem_fluxo_encaminhamento}</span></li>
                  <li className="flex justify-between"><span>Articulação CREAS:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].articulacao_creas_rede}</span></li>
                  <li className="flex justify-between"><span>Equipe Mínima CREAS:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].tem_equipe_minima_creas}</span></li>
                  <li className="flex justify-between"><span>Profissionais Capacitados:</span> <span className="font-semibold text-foreground">{filteredMunicipios[0].profissionais_capacitados}</span></li>
                </ul>
              </div>
            </div>
            {filteredMunicipios[0].gargalos_identificados && (
              <div className="mt-4 p-3 bg-destructive/5 rounded-lg border border-destructive/20 text-xs">
                <span className="font-bold text-destructive">Gargalos Críticos:</span> {filteredMunicipios[0].gargalos_identificados}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
