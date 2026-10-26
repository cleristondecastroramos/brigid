import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  HeartHandshake,
  ShieldAlert,
  Award,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  ArrowRight,
  Users,
  GraduationCap,
  HardHat,
  FileText,
  ChevronRight,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Download,
} from "lucide-react";
import { municipiosQueryOptions, pct } from "@/lib/data-fetching";
import { exportCsv, exportPdf } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMunicipios } from "@/lib/useMunicipios";
import { KpiCard } from "@/components/kpi-card";
import { PiauiMap } from "@/components/piaui-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ChartHelper } from "@/components/chart-helper";
import { SimNaoIcone, SimNaoTexto } from "@/components/sim-nao";
import type { Municipio } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { PageTitle } from "@/components/page-title";
import { NotasRodape } from "@/components/rodape-institucional";
import { compararTexto } from "@/lib/ordenacao";

export const Route = createFileRoute("/diagnostico")({
  loader: ({ context }) => context.queryClient.ensureQueryData(municipiosQueryOptions),
  component: DiagnosticoPanel,
});

const COLOR_OK = "var(--mapa-positivo)";
const COLOR_WARN = "var(--mapa-atencao)";
const COLOR_CRIT = "var(--mapa-critico)";
const COLOR_GRAY = "var(--mapa-neutro)";
const COLOR_DARK_PURPLE = "var(--mapa-critico)";

const LacunaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isCritical = data.lacuna_percentual >= 70;
    const isWarning = data.lacuna_percentual >= 40 && data.lacuna_percentual < 70;
    const colorClass = isCritical
      ? "text-destructive"
      : isWarning
        ? "text-warning-foreground"
        : "text-primary";
    const fillColor = isCritical ? COLOR_CRIT : isWarning ? COLOR_WARN : COLOR_OK;

    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border/60 p-3 rounded-xl shadow-sm min-w-[280px] z-50 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 w-1.5 h-full"
          style={{ backgroundColor: fillColor }}
        />

        <p className="font-bold text-[15px] mb-3 border-b border-border/50 pb-2 pl-3">{label}</p>

        <div className="flex flex-col gap-3 mb-4 pl-3">
          <div className="flex justify-between items-center gap-4">
            <span className="font-bold text-muted-foreground uppercase tracking-wider text-[11px]">
              Lacuna Institucional:
            </span>
            <span className={cn("font-semibold text-2xl", colorClass)}>
              {data.lacuna_percentual}%
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
              Cobertura Formativa:
            </span>
            <span className="font-bold text-sm text-primary">{data.cobertura_percentual}%</span>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-3 mx-2 mb-1 flex flex-col gap-2.5 text-xs border border-border/30 shadow-inner">
          <p className="font-semibold text-muted-foreground mb-0.5 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
            <HelpCircle className="w-3 h-3" /> Volume Absoluto
          </p>
          <div className="flex justify-between items-center">
            <span
              className="flex items-center gap-1.5 font-medium opacity-90"
              style={{ color: COLOR_DARK_PURPLE }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: COLOR_DARK_PURPLE }}
              />{" "}
              Demandas territoriais:
            </span>
            <span className="font-bold text-foreground">{data.ocorrencias}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-primary flex items-center gap-1.5 font-medium opacity-90">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Respostas institucionais:
            </span>
            <span className="font-bold text-foreground">{data.capacitacoes}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

function DiagnosticoPanel() {
  const { data: municipios } = useMunicipios();

  // Estado de nível hierárquico e filtros
  const [selectedPolo, setSelectedPolo] = useState("__all");
  const [selectedComarca, setSelectedComarca] = useState("__all");
  const [selectedMunicipio, setSelectedMunicipio] = useState("__all");
  const [tab, setTab] = useState("infra");
  const [q, setQ] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof (typeof municipios)[0]>("municipio");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [mapMode, setMapMode] = useState<"IER" | "IMF" | "IQT">("IER");
  const [assistenciaPage, setAssistenciaPage] = useState(1);
  const [estruturaPage, setEstruturaPage] = useState(1);
  const handleSort = (col: keyof (typeof municipios)[0]) => {
    if (sortColumn === col) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: keyof (typeof municipios)[0] }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 inline h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 inline h-4 w-4" />
    );
  };

  const [poloSortColumn, setPoloSortColumn] = useState<
    "polo" | "ier" | "imf" | "iqt" | "_mediaRaw"
  >("_mediaRaw");
  const [poloSortDirection, setPoloSortDirection] = useState<"asc" | "desc">("asc");
  const handlePoloSort = (col: "polo" | "ier" | "imf" | "iqt" | "_mediaRaw") => {
    if (poloSortColumn === col) setPoloSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setPoloSortColumn(col);
      setPoloSortDirection("asc");
    }
  };

  const PoloSortIcon = ({ column }: { column: "polo" | "ier" | "imf" | "iqt" | "_mediaRaw" }) => {
    if (poloSortColumn !== column) return null;
    return poloSortDirection === "asc" ? (
      <ArrowUp className="ml-1 inline h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 inline h-4 w-4" />
    );
  };

  const comarcas = useMemo(() => {
    let list = municipios;
    if (selectedPolo !== "__all") {
      list = list.filter((m) => m.polo_regional === selectedPolo);
    }
    return Array.from(new Set(list.map((m) => m.comarca).filter(Boolean))).sort((a, b) =>
      compararTexto(String(a), String(b)),
    );
  }, [municipios, selectedPolo]);
  const polos = useMemo(
    () =>
      Array.from(new Set(municipios.map((m) => m.polo_regional).filter(Boolean))).sort((a, b) =>
        compararTexto(String(a), String(b)),
      ),
    [municipios],
  );
  const municipiosDropdown = useMemo(() => {
    let list = municipios;
    if (selectedPolo !== "__all") list = list.filter((m) => m.polo_regional === selectedPolo);
    if (selectedComarca !== "__all") list = list.filter((m) => m.comarca === selectedComarca);
    return list
      .map((m) => ({ label: m.municipio, value: m.codigo_ibge }))
      .sort((a, b) => compararTexto(a.label, b.label));
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
    return municipios
      .filter((m) => {
        if (selectedMunicipio !== "__all" && m.codigo_ibge !== selectedMunicipio) return false;
        if (selectedComarca !== "__all" && m.comarca !== selectedComarca) return false;
        if (selectedPolo !== "__all" && m.polo_regional !== selectedPolo) return false;
        if (q && !m.municipio.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        const modifier = sortDirection === "asc" ? 1 : -1;
        if (typeof valA === "string" && typeof valB === "string")
          return compararTexto(valA, valB) * modifier;
        return ((valA ?? 0) > (valB ?? 0) ? 1 : -1) * modifier;
      });
  }, [municipios, selectedMunicipio, selectedComarca, selectedPolo, q, sortColumn, sortDirection]);

  const totalAssistenciaPages = Math.ceil(filteredMunicipios.length / 20) || 1;
  const safeAssistenciaPage = Math.min(assistenciaPage, totalAssistenciaPages);
  const assistenciaPaginated = filteredMunicipios.slice(
    (safeAssistenciaPage - 1) * 20,
    safeAssistenciaPage * 20,
  );

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
    const m = municipios.find((x) => x.codigo_ibge === ibgeCode);
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
    if (count === 0)
      return {
        ierMedio: 0,
        imfMedio: 0,
        iqtMedio: 0,
        pctFluxoFormal: "0%",
        pctSalaEsp: "0%",
        pctRecursosMin: "0%",
        pctAtendPsicossocial: "0%",
        pctAtendJuridico: "0%",
        pctArticulacaoRede: "0%",
        totalFeminicidiosConsumados: 0,
        totalFeminicidiosTentados: 0,
        pctProtInvestigacao: "0%",
        pctProtPericial: "0%",
        pctCapacitadoPersp: "0%",
        pctTreinamentoFem: "0%",
        totalCapacitacoes: 0,
        pctProtAssistencial: "0%",
        pctFluxoEncam: "0%",
        pctArticCreasRede: "0%",
        pctEquipeMinimaCreas: "0%",
        totalProfCapacitados: 0,
      };

    // Percentual de municípios com SIM; quando nenhum município do recorte tem o campo
    // consolidado, exibe "Sem informação" em vez de 0%.
    const pctSim = (campo: keyof Municipio, sim: number) =>
      filteredMunicipios.some((m) => m[campo] === "SIM" || m[campo] === "NAO")
        ? pct(sim, count)
        : "Sem informação";

    const sumIER = filteredMunicipios.reduce((acc, m) => acc + (m.ier_score ?? 0), 0);
    const sumIMF = filteredMunicipios.reduce((acc, m) => acc + (m.imf_score ?? 0), 0);
    const sumIQT = filteredMunicipios.reduce((acc, m) => acc + (m.iqt_score ?? 0), 0);

    const fluxos = filteredMunicipios.filter((m) => m.tem_fluxo_formal === "SIM").length;
    const salaEsp = filteredMunicipios.filter((m) => m.tem_sala_especializada === "SIM").length;
    const recursos = filteredMunicipios.filter((m) => m.tem_recursos_minimos === "SIM").length;
    const psico = filteredMunicipios.filter((m) => m.tem_atendimento_psicossocial === "SIM").length;
    const jur = filteredMunicipios.filter((m) => m.tem_atendimento_juridico === "SIM").length;
    const articulacao = filteredMunicipios.filter((m) => m.tem_articulacao_rede === "SIM").length;

    const femCons = filteredMunicipios.reduce(
      (acc, m) => acc + (m.feminicidios_consumados_2023_2025 ?? 0),
      0,
    );
    const femTent = filteredMunicipios.reduce(
      (acc, m) => acc + (m.feminicidios_tentados_2023_2025 ?? 0),
      0,
    );
    const protInv = filteredMunicipios.filter((m) => m.tem_protocolo_investigacao === "SIM").length;
    const protPer = filteredMunicipios.filter((m) => m.tem_protocolo_pericial === "SIM").length;
    const capPersp = filteredMunicipios.filter(
      (m) => m.capacitado_perspectiva_genero === "SIM",
    ).length;
    const treinFem = filteredMunicipios.filter(
      (m) => m.treinamento_especifico_feminicidio === "SIM",
    ).length;
    const totalCaps = filteredMunicipios.reduce(
      (acc, m) => acc + (m.qtd_capacitacoes_realizadas ?? 0),
      0,
    );

    const protAssist = filteredMunicipios.filter(
      (m) => m.tem_protocolo_assistencial === "SIM",
    ).length;
    const fluxoEncam = filteredMunicipios.filter(
      (m) => m.tem_fluxo_encaminhamento === "SIM",
    ).length;
    const articCreas = filteredMunicipios.filter((m) => m.articulacao_creas_rede === "SIM").length;
    const equipeMinCreas = filteredMunicipios.filter(
      (m) => m.tem_equipe_minima_creas === "SIM",
    ).length;
    const profCaps = filteredMunicipios.reduce(
      (acc, m) => acc + (m.profissionais_capacitados ?? 0),
      0,
    );

    return {
      ierMedio: Number((sumIER / count).toFixed(1)),
      imfMedio: Number((sumIMF / count).toFixed(1)),
      iqtMedio: Number((sumIQT / count).toFixed(1)),
      pctFluxoFormal: pctSim("tem_fluxo_formal", fluxos),
      pctSalaEsp: pctSim("tem_sala_especializada", salaEsp),
      pctRecursosMin: pctSim("tem_recursos_minimos", recursos),
      pctAtendPsicossocial: pctSim("tem_atendimento_psicossocial", psico),
      pctAtendJuridico: pctSim("tem_atendimento_juridico", jur),
      pctArticulacaoRede: pctSim("tem_articulacao_rede", articulacao),

      totalFeminicidiosConsumados: femCons,
      totalFeminicidiosTentados: femTent,
      pctProtInvestigacao: pctSim("tem_protocolo_investigacao", protInv),
      pctProtPericial: pctSim("tem_protocolo_pericial", protPer),
      pctCapacitadoPersp: pctSim("capacitado_perspectiva_genero", capPersp),
      pctTreinamentoFem: pctSim("treinamento_especifico_feminicidio", treinFem),
      totalCapacitacoes: totalCaps,

      pctProtAssistencial: pctSim("tem_protocolo_assistencial", protAssist),
      pctFluxoEncam: pctSim("tem_fluxo_encaminhamento", fluxoEncam),
      pctArticCreasRede: pctSim("articulacao_creas_rede", articCreas),
      pctEquipeMinimaCreas: pctSim("tem_equipe_minima_creas", equipeMinCreas),
      totalProfCapacitados: profCaps,
    };
  }, [filteredMunicipios]);

  // Ranking de polos com menores índices (maiores lacunas)
  const rankingLacunas = useMemo(() => {
    const poloStats: Record<
      string,
      { name: string; sumIER: number; sumIMF: number; sumIQT: number; count: number }
    > = {};
    municipios.forEach((m) => {
      if (!m.polo_regional) return;
      if (!poloStats[m.polo_regional]) {
        poloStats[m.polo_regional] = {
          name: m.polo_regional,
          sumIER: 0,
          sumIMF: 0,
          sumIQT: 0,
          count: 0,
        };
      }
      poloStats[m.polo_regional].sumIER += m.ier_score ?? 0;
      poloStats[m.polo_regional].sumIMF += m.imf_score ?? 0;
      poloStats[m.polo_regional].sumIQT += m.iqt_score ?? 0;
      poloStats[m.polo_regional].count += 1;
    });

    return Object.values(poloStats)
      .map((p) => {
        const ier = p.sumIER / p.count;
        const imf = p.sumIMF / p.count;
        const iqt = p.sumIQT / p.count;
        const mediaGeral = (ier + imf + iqt) / 3;
        return {
          polo: p.name,
          ier: ier.toFixed(1),
          imf: imf.toFixed(1),
          iqt: iqt.toFixed(1),
          media: mediaGeral.toFixed(1),
          _mediaRaw: mediaGeral,
          prioridade: mediaGeral < 4 ? "CRÍTICA" : mediaGeral < 6.5 ? "MÉDIA" : "ESTÁVEL",
        };
      })
      .sort((a, b) => {
        let valA: any = a[poloSortColumn];
        let valB: any = b[poloSortColumn];

        if (poloSortColumn !== "polo") {
          valA = Number(valA);
          valB = Number(valB);
        }

        if (typeof valA === "string" && typeof valB === "string") {
          const c = compararTexto(valA, valB);
          return poloSortDirection === "asc" ? c : -c;
        }
        if (valA < valB) return poloSortDirection === "asc" ? -1 : 1;
        if (valA > valB) return poloSortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [municipios, poloSortColumn, poloSortDirection]);

  // Cruzamento do Painel 2: Ocorrências vs Capacitação (exibir por polo ordenado por déficit percentual)
  const poloCruzamentoData = useMemo(() => {
    const poloStats: Record<string, { polo: string; ocorrencias: number; capacitacoes: number }> =
      {};
    municipios.forEach((m) => {
      if (!m.polo_regional) return;
      if (!poloStats[m.polo_regional]) {
        poloStats[m.polo_regional] = { polo: m.polo_regional, ocorrencias: 0, capacitacoes: 0 };
      }
      poloStats[m.polo_regional].ocorrencias +=
        (m.feminicidios_consumados_2023_2025 ?? 0) + (m.feminicidios_tentados_2023_2025 ?? 0);
      poloStats[m.polo_regional].capacitacoes += m.qtd_capacitacoes_realizadas ?? 0;
    });
    return Object.values(poloStats)
      .map((p) => {
        let cobertura_percentual = p.ocorrencias > 0 ? (p.capacitacoes / p.ocorrencias) * 100 : 100;
        cobertura_percentual = Math.min(100, Math.max(0, cobertura_percentual));
        const lacuna_percentual = 100 - cobertura_percentual;
        return {
          ...p,
          cobertura_percentual: Number(cobertura_percentual.toFixed(1)),
          lacuna_percentual: Number(lacuna_percentual.toFixed(1)),
        };
      })
      .sort((a, b) => b.lacuna_percentual - a.lacuna_percentual);
  }, [municipios]);

  // Lista de gargalos destacados
  const listGargalos = useMemo(() => {
    return filteredMunicipios
      .filter(
        (m) =>
          m.gargalos_identificados &&
          m.gargalos_identificados !== "Nenhum gargalo crítico identificado.",
      )
      .slice(0, 8);
  }, [filteredMunicipios]);

  // Determinar cores do mapa temático dependendo do painel ativo
  const mapColorFn = (m: any) => {
    if (!m) return COLOR_GRAY;
    // Highlight based on current filtered state
    const isIncluded = filteredMunicipios.some((fm) => fm.codigo_ibge === m.codigo_ibge);
    if (!isIncluded) return "oklch(0.96 0.005 240)"; // dim if filtered out

    if (mapMode === "IER") {
      const score = m.ier_score ?? 0;
      return score >= 7 ? COLOR_OK : score >= 4 ? COLOR_WARN : COLOR_CRIT;
    } else if (mapMode === "IQT") {
      const score = m.iqt_score ?? 0;
      return score >= 7 ? COLOR_OK : score >= 4 ? COLOR_WARN : COLOR_CRIT;
    } else {
      const score = m.imf_score ?? 0;
      return score >= 7 ? COLOR_OK : score >= 4 ? COLOR_WARN : COLOR_CRIT;
    }
  };

  const mapLegend = useMemo(() => {
    let labelSuf = "Pontuação";
    if (mapMode === "IER") labelSuf = "Estrutura (IER)";
    else if (mapMode === "IQT") labelSuf = "Qualificação (IQT)";
    else labelSuf = "Maturidade (IMF)";

    return [
      { label: `Adequada / Alta (>= 7) — ${labelSuf}`, color: COLOR_OK },
      { label: `Regular / Média (4 a 6.9) — ${labelSuf}`, color: COLOR_WARN },
      { label: `Insuficiente / Crítica (< 4) — ${labelSuf}`, color: COLOR_CRIT },
    ];
  }, [mapMode]);

  return (
    <div className="space-y-4">
      <PageTitle
        secao="Monitoramento"
        titulo="Diagnóstico da Rede e Fluxos"
        descricao="Infraestrutura, fluxos de atendimento, protocolos, investigação e perícia, assistência social e gargalos da rede de proteção, sintetizados nos índices IER, IMF e IQT."
      />
      {/* ── PAINEL DE CONTROLE UNIFICADO ─────────────────────────────────────── */}
      <Card className="overflow-hidden">
        {/* Linha 1 — KPIs + Filtros */}
        <div className="flex flex-col border-b border-border xl:flex-row xl:items-center">
          {/* Índices sintéticos: clicar alterna a camada do mapa */}
          <div className="grid w-full grid-cols-3 gap-2 p-2 xl:w-[52%] xl:shrink-0">
            <IndiceTile
              sigla="IER"
              rotulo="Estrutura da rede"
              valor={stats.ierMedio}
              icon={Building2}
              ativo={mapMode === "IER"}
              onClick={() => setMapMode("IER")}
            />
            <IndiceTile
              sigla="IMF"
              rotulo="Maturidade dos fluxos"
              valor={stats.imfMedio}
              icon={HeartHandshake}
              ativo={mapMode === "IMF"}
              onClick={() => setMapMode("IMF")}
            />
            <IndiceTile
              sigla="IQT"
              rotulo="Qualificação técnica"
              valor={stats.iqtMedio}
              icon={GraduationCap}
              ativo={mapMode === "IQT"}
              onClick={() => setMapMode("IQT")}
            />
          </div>

          {/* Bloco: Filtros alinhados à direita */}
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3 border-border px-4 py-2 xl:border-l">
            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Polo Regional
              </label>
              <Select
                value={selectedPolo}
                onValueChange={(v) => {
                  setSelectedPolo(v);
                  setSelectedComarca("__all");
                  setSelectedMunicipio("__all");
                }}
              >
                <SelectTrigger className="w-[210px] text-sm">
                  <SelectValue placeholder="Todos os Polos Regionais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos os Polos Regionais</SelectItem>
                  {polos.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Comarca
              </label>
              <Select
                value={selectedComarca}
                onValueChange={(v) => {
                  setSelectedComarca(v);
                  setSelectedMunicipio("__all");
                }}
              >
                <SelectTrigger className="w-[210px] text-sm">
                  <SelectValue placeholder="Todas as Comarcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todas as Comarcas</SelectItem>
                  {comarcas.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Município
              </label>
              <Select value={selectedMunicipio} onValueChange={handleSelectMunicipio}>
                <SelectTrigger className="w-[210px] text-sm">
                  <SelectValue placeholder="Todos os Municípios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Todos os Municípios</SelectItem>
                  {municipiosDropdown.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedPolo !== "__all" ||
              selectedComarca !== "__all" ||
              selectedMunicipio !== "__all" ||
              q) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-base text-muted-foreground hover:text-foreground mt-4"
                onClick={handleResetFilters}
              >
                ✕ Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Linha 2 — Breadcrumb + Tabs integradas */}
        <div className="flex items-center justify-between px-4 py-0 bg-muted/20">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-base text-muted-foreground py-1.5">
            <span className="font-semibold text-foreground/60 uppercase tracking-wider">
              Escopo:
            </span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded font-medium transition-colors",
                activeLevel === "estado" ? "text-primary font-semibold" : "text-muted-foreground",
              )}
            >
              Estadual
            </span>
            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/50" />
            <span
              className={cn(
                "px-1.5 py-0.5 rounded font-medium transition-colors",
                activeLevel === "polo" ? "text-primary font-semibold" : "text-muted-foreground",
                selectedPolo === "__all" && "opacity-40",
              )}
            >
              {selectedPolo === "__all"
                ? "Todos os Polos Regionais"
                : `Polo Regional: ${selectedPolo}`}
            </span>
            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/50" />
            <span
              className={cn(
                "px-1.5 py-0.5 rounded font-medium transition-colors",
                activeLevel === "comarca" ? "text-primary font-semibold" : "text-muted-foreground",
                selectedComarca === "__all" && "opacity-40",
              )}
            >
              {selectedComarca === "__all" ? "Todas as Comarcas" : `Comarca: ${selectedComarca}`}
            </span>
            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/50" />
            <span
              className={cn(
                "px-1.5 py-0.5 rounded font-medium transition-colors",
                activeLevel === "municipio"
                  ? "text-primary font-semibold"
                  : "text-muted-foreground",
                selectedMunicipio === "__all" && "opacity-40",
              )}
            >
              {selectedMunicipio === "__all"
                ? "Todos os Municípios"
                : municipios.find((m) => m.codigo_ibge === selectedMunicipio)?.municipio}
            </span>
          </div>

          {/* Tabs de navegação integradas no rodapé do card */}
          <div className="flex items-center gap-2 px-4 py-2">
            {[
              { value: "infra", label: "Fluxos e Infraestrutura" },
              { value: "violencia", label: "Violência e Perícias" },
              { value: "assistencia", label: "Assistência Social" },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "relative px-4 py-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap rounded-md border",
                  tab === t.value
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "border-foreground/20 text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tabs Principais dos Painéis Temáticos */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="hidden">
          <TabsTrigger value="infra">Fluxos e Infraestrutura</TabsTrigger>
          <TabsTrigger value="violencia">Violência, Investigação e Perícias</TabsTrigger>
          <TabsTrigger value="assistencia">Assistência Social e Capacitação</TabsTrigger>
        </TabsList>

        {/* ========================================================
            PAINEL 1: FLUXOS E INFRAESTRUTURA DE ATENDIMENTO
            ======================================================== */}
        <TabsContent value="infra" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Mapa Temático */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3 relative">
                <ChartHelper>
                  {mapMode === "IER" && (
                    <>
                      <p className="mb-2">
                        <strong>Índice de Estrutura da Rede (IER)</strong>
                      </p>
                      <p className="text-sm mb-3">
                        Avalia a capacidade física e material da rede de proteção à mulher no
                        município, com nota de 0 a 10.
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        <li>
                          <strong className="text-foreground/80">Sala Especializada (30%):</strong>{" "}
                          +3 pts se possuir ambiente exclusivo.
                        </li>
                        <li>
                          <strong className="text-foreground/80">Recursos Mínimos (30%):</strong> +3
                          pts se dispuser de insumos fundamentais.
                        </li>
                        <li>
                          <strong className="text-foreground/80">
                            Suficiência da Estrutura (40%):
                          </strong>{" "}
                          +4 pts (Adequado), +2 pts (Parcial), +0 pts (Insuficiente).
                        </li>
                      </ul>
                      <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-3 text-xs">
                        O IER mapeia o nível de prontidão estrutural e guia a priorização de
                        vistorias técnicas do MPPI.
                      </div>
                    </>
                  )}
                  {mapMode === "IMF" && (
                    <>
                      <p className="mb-2">
                        <strong>Índice de Maturidade dos Fluxos (IMF)</strong>
                      </p>
                      <p className="text-sm mb-3">
                        Avalia a formalização e articulação dos protocolos de atendimento da rede,
                        com nota de 0 a 10.
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        <li>
                          <strong className="text-foreground/80">Fluxo Formal (30%):</strong> +3 pts
                          se possuir diretrizes oficiais de encaminhamento.
                        </li>
                        <li>
                          <strong className="text-foreground/80">Protocolo Regional (30%):</strong>{" "}
                          +3 pts se aderir a um protocolo padronizado.
                        </li>
                        <li>
                          <strong className="text-foreground/80">Articulação em Rede (40%):</strong>{" "}
                          +4 pts se houver articulação integrada de saúde e segurança.
                        </li>
                      </ul>
                      <div className="bg-[color:var(--color-success)]/10 p-2.5 rounded-md border border-[color:var(--color-success)]/20 mt-3 text-xs">
                        O IMF ajuda a identificar deficiências na articulação interinstitucional.
                      </div>
                    </>
                  )}
                  {mapMode === "IQT" && (
                    <>
                      <p className="mb-2">
                        <strong>Índice de Qualificação Técnica (IQT)</strong>
                      </p>
                      <p className="text-sm mb-3">
                        Avalia a expertise e preparo dos profissionais da rede no atendimento às
                        vítimas, com nota de 0 a 10.
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        <li>
                          <strong className="text-foreground/80">
                            Equipe Multiprofissional (30%):
                          </strong>{" "}
                          +3 pts se possuir equipe técnica diversificada.
                        </li>
                        <li>
                          <strong className="text-foreground/80">
                            Capacitação em Gênero (35%):
                          </strong>{" "}
                          +3.5 pts se houver formação na perspectiva de gênero.
                        </li>
                        <li>
                          <strong className="text-foreground/80">
                            Treinamento Feminicídio (35%):
                          </strong>{" "}
                          +3.5 pts se houver treinamento específico de resposta ao feminicídio.
                        </li>
                      </ul>
                      <div className="bg-warning/10 p-2.5 rounded-md border border-warning/20 mt-3 text-xs text-warning-foreground">
                        O IQT direciona a promoção de cursos de aperfeiçoamento e capacitação.
                      </div>
                    </>
                  )}
                </ChartHelper>
                <CardTitle className="text-lg flex items-center justify-between pr-8">
                  <span>
                    Mapa Temático de{" "}
                    {mapMode === "IER"
                      ? "Estrutura da Rede (IER)"
                      : mapMode === "IMF"
                        ? "Maturidade dos Fluxos (IMF)"
                        : "Qualificação Técnica (IQT)"}
                  </span>
                  <span className="text-base font-normal text-muted-foreground">
                    Exibindo {filteredMunicipios.length} municípios
                  </span>
                </CardTitle>
                <CardDescription className="text-base">
                  A cor do município no mapa representa o grau de adequação do índice. Clique para
                  interagir e visualizar a distribuição.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <PiauiMap colorFn={mapColorFn} legend={mapLegend} height={850} />

                <div className="absolute bottom-8 right-8 w-[270px] h-[250px] rounded-lg border border-border/60 bg-background/95 p-4 shadow-sm backdrop-blur-sm pointer-events-auto flex flex-col">
                  <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Distribuição das classificações
                  </p>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Adequada / Alta",
                              total: filteredMunicipios.filter((m) => {
                                let score = 0;
                                if (mapMode === "IER") score = m.ier_score ?? 0;
                                else if (mapMode === "IQT") score = m.iqt_score ?? 0;
                                else score = m.imf_score ?? 0;
                                return score >= 7;
                              }).length,
                              color: COLOR_OK,
                            },
                            {
                              name: "Regular / Média",
                              total: filteredMunicipios.filter((m) => {
                                let score = 0;
                                if (mapMode === "IER") score = m.ier_score ?? 0;
                                else if (mapMode === "IQT") score = m.iqt_score ?? 0;
                                else score = m.imf_score ?? 0;
                                return score >= 4 && score < 7;
                              }).length,
                              color: COLOR_WARN,
                            },
                            {
                              name: "Insufic. / Crítica",
                              total: filteredMunicipios.filter((m) => {
                                let score = 0;
                                if (mapMode === "IER") score = m.ier_score ?? 0;
                                else if (mapMode === "IQT") score = m.iqt_score ?? 0;
                                else score = m.imf_score ?? 0;
                                return score < 4;
                              }).length,
                              color: COLOR_CRIT,
                            },
                          ].filter((d) => d.total > 0)}
                          dataKey="total"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          label={({ cx, cy, midAngle, outerRadius, percent, name, fill }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius * 1.3;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text
                                x={x}
                                y={y}
                                fill={fill}
                                textAnchor={x > cx ? "start" : "end"}
                                dominantBaseline="central"
                                fontSize={10}
                                fontWeight={600}
                              >
                                {`${name} ${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                          labelLine={false}
                          stroke="var(--color-background)"
                          strokeWidth={2}
                        >
                          {[
                            {
                              name: "Adequada / Alta",
                              total: filteredMunicipios.filter((m) => {
                                let score = 0;
                                if (mapMode === "IER") score = m.ier_score ?? 0;
                                else if (mapMode === "IQT") score = m.iqt_score ?? 0;
                                else score = m.imf_score ?? 0;
                                return score >= 7;
                              }).length,
                              color: COLOR_OK,
                            },
                            {
                              name: "Regular / Média",
                              total: filteredMunicipios.filter((m) => {
                                let score = 0;
                                if (mapMode === "IER") score = m.ier_score ?? 0;
                                else if (mapMode === "IQT") score = m.iqt_score ?? 0;
                                else score = m.imf_score ?? 0;
                                return score >= 4 && score < 7;
                              }).length,
                              color: COLOR_WARN,
                            },
                            {
                              name: "Insufic. / Crítica",
                              total: filteredMunicipios.filter((m) => {
                                let score = 0;
                                if (mapMode === "IER") score = m.ier_score ?? 0;
                                else if (mapMode === "IQT") score = m.iqt_score ?? 0;
                                else score = m.imf_score ?? 0;
                                return score < 4;
                              }).length,
                              color: COLOR_CRIT,
                            },
                          ]
                            .filter((d) => d.total > 0)
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [value, "Municípios"]}
                          contentStyle={{
                            background: "var(--color-popover)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quadro de Cobertura e Ranking */}
            <div className="space-y-6 lg:col-span-1">
              <Card>
                <CardHeader className="pb-2 relative">
                  <ChartHelper>
                    <p>
                      Apresenta o percentual de cobertura dos serviços essenciais de proteção no
                      recorte selecionado.
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>
                        <strong className="text-foreground/80">Fluxo Formal:</strong> Existência de
                        diretrizes oficiais de encaminhamento.
                      </li>
                      <li>
                        <strong className="text-foreground/80">Sala Especializada:</strong> Espaços
                        de escuta protegida.
                      </li>
                    </ul>
                    <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                      <p className="text-primary-700 dark:text-primary-300 font-medium">
                        Identifique rapidamente quais{" "}
                        <strong className="font-bold">eixos da rede de atendimento</strong> estão
                        mais defasados e necessitam de articulação interinstitucional.
                      </p>
                    </div>
                  </ChartHelper>
                  <CardTitle className="text-lg pr-8">Indicadores do Recorte Territorial</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <div>
                    <div className="flex items-center justify-between text-base mb-2">
                      <span className="font-medium text-foreground">
                        Fluxo Formal de Atendimento
                      </span>
                      <span className="font-bold text-primary">{stats.pctFluxoFormal}</span>
                    </div>
                    <Progress
                      value={parseFloat(stats.pctFluxoFormal) || 0}
                      className="h-5 md:h-6 bg-muted/60 border border-border/50"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-base mb-2">
                      <span className="font-medium text-foreground">
                        Sala / Estrutura Especializada
                      </span>
                      <span className="font-bold text-primary">{stats.pctSalaEsp}</span>
                    </div>
                    <Progress
                      value={parseFloat(stats.pctSalaEsp) || 0}
                      className="h-5 md:h-6 bg-muted/60 border border-border/50"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-base mb-2">
                      <span className="font-medium text-foreground">
                        Recursos Materiais Mínimos
                      </span>
                      <span className="font-bold text-primary">{stats.pctRecursosMin}</span>
                    </div>
                    <Progress
                      value={parseFloat(stats.pctRecursosMin) || 0}
                      className="h-5 md:h-6 bg-muted/60 border border-border/50"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-base mb-2">
                      <span className="font-medium text-foreground">
                        Atendimento Psicossocial Local
                      </span>
                      <span className="font-bold text-primary">{stats.pctAtendPsicossocial}</span>
                    </div>
                    <Progress
                      value={parseFloat(stats.pctAtendPsicossocial) || 0}
                      className="h-5 md:h-6 bg-muted/60 border border-border/50"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-base mb-2">
                      <span className="font-medium text-foreground">
                        Atendimento Jurídico na Rede
                      </span>
                      <span className="font-bold text-primary">{stats.pctAtendJuridico}</span>
                    </div>
                    <Progress
                      value={parseFloat(stats.pctAtendJuridico) || 0}
                      className="h-5 md:h-6 bg-muted/60 border border-border/50"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-base mb-2">
                      <span className="font-medium text-foreground">
                        Articulação da Rede de Segurança/Saúde
                      </span>
                      <span className="font-bold text-primary">{stats.pctArticulacaoRede}</span>
                    </div>
                    <Progress
                      value={parseFloat(stats.pctArticulacaoRede) || 0}
                      className="h-5 md:h-6 bg-muted/60 border border-border/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Ranking de fragilidade territorial */}
              <Card>
                <CardHeader className="pb-2 relative">
                  <ChartHelper>
                    <p>
                      Ranqueia as regiões de acordo com o nível médio de fragilidade de suas redes
                      de proteção.
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>
                        <strong className="text-foreground/80">Média:</strong> Agregação dos índices
                        de estrutura, fluxos e treinamento.
                      </li>
                      <li>
                        <strong className="text-foreground/80">Status:</strong> Nível de atenção
                        exigida pela região.
                      </li>
                    </ul>
                    <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                      <p className="text-primary-700 dark:text-primary-300 font-medium">
                        A classificação de <strong className="font-bold">Criticidade</strong>{" "}
                        norteia a atuação estratégica por macrorregião, otimizando o esforço
                        fiscalizatório.
                      </p>
                    </div>
                  </ChartHelper>
                  <CardTitle className="text-lg pr-16">
                    Criticidade por Polos Regionais (Geral)
                  </CardTitle>
                  <CardDescription className="text-base pr-16">
                    Polos Regionais com menores médias nos índices de estrutura, fluxos e
                    treinamento.
                  </CardDescription>
                  <div className="absolute top-4 right-12 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1 rounded-sm hover:bg-muted/50"
                          title="Exportar Tabela"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            exportCsv("criticidade_polos_regionais.csv", rankingLacunas)
                          }
                        >
                          Exportar CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            exportPdf(
                              "criticidade_polos_regionais.pdf",
                              "Criticidade por Polos Regionais",
                              rankingLacunas,
                              {
                                subtitle:
                                  "Ranking dos polos com menores médias nos índices de estrutura, fluxos e treinamento.",
                                kpis: [
                                  { label: "Polos Analisados", value: rankingLacunas.length },
                                  {
                                    label: "Criticidade ALTA",
                                    value: rankingLacunas.filter((r) => r.prioridade === "CRÍTICA")
                                      .length,
                                  },
                                ],
                              },
                            )
                          }
                        >
                          Exportar PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto px-4 pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="py-1 text-base cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => handlePoloSort("polo")}
                          >
                            Polo Regional <PoloSortIcon column="polo" />
                          </TableHead>
                          <TableHead
                            className="py-1 text-base text-right cursor-pointer hover:bg-white/10 transition-colors"
                            title="Índice de Estrutura da Rede"
                            onClick={() => handlePoloSort("ier")}
                          >
                            IER <PoloSortIcon column="ier" />
                          </TableHead>
                          <TableHead
                            className="py-1 text-base text-right cursor-pointer hover:bg-white/10 transition-colors"
                            title="Índice de Maturidade dos Fluxos"
                            onClick={() => handlePoloSort("imf")}
                          >
                            IMF <PoloSortIcon column="imf" />
                          </TableHead>
                          <TableHead
                            className="py-1 text-base text-right cursor-pointer hover:bg-white/10 transition-colors"
                            title="Índice de Qualificação Técnica"
                            onClick={() => handlePoloSort("iqt")}
                          >
                            IQT <PoloSortIcon column="iqt" />
                          </TableHead>
                          <TableHead
                            className="py-1 text-base text-right cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => handlePoloSort("_mediaRaw")}
                          >
                            Média Geral <PoloSortIcon column="_mediaRaw" />
                          </TableHead>
                          <TableHead className="py-1 text-base text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankingLacunas.map((r) => (
                          <TableRow
                            key={r.polo}
                            className="hover:bg-muted/30 cursor-pointer"
                            onClick={() => handleSelectPolo(r.polo)}
                          >
                            <TableCell className="py-2 text-base font-medium">{r.polo}</TableCell>
                            <TableCell className="py-2 text-base text-right font-medium text-muted-foreground">
                              {r.ier}
                            </TableCell>
                            <TableCell className="py-2 text-base text-right font-medium text-muted-foreground">
                              {r.imf}
                            </TableCell>
                            <TableCell className="py-2 text-base text-right font-medium text-muted-foreground">
                              {r.iqt}
                            </TableCell>
                            <TableCell className="py-2 text-base text-right font-bold text-primary">
                              {r.media}
                            </TableCell>
                            <TableCell className="py-2 text-base text-center">
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-semibold",
                                  r.prioridade === "CRÍTICA"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-warning/10 text-warning-foreground",
                                )}
                              >
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
            <CardHeader className="pb-2 relative">
              <ChartHelper>
                <p>
                  Visão tabular comparativa da presença de recursos de infraestrutura fundamentais
                  em cada município.
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <strong className="text-foreground/80">Recursos Mínimos:</strong> Itens
                    operacionais básicos.
                  </li>
                  <li>
                    <strong className="text-foreground/80">Atendimento:</strong> Presença de
                    profissionais qualificados.
                  </li>
                </ul>
                <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                  <p className="text-primary-700 dark:text-primary-300 font-medium">
                    Utilize a ordenação por <strong className="font-bold">Suficiência</strong> para
                    extrair a lista exata de alvos para recomendações diretas.
                  </p>
                </div>
              </ChartHelper>
              <CardTitle className="text-lg pr-16">
                Matriz Territorial de Estrutura por Município
              </CardTitle>
              <CardDescription className="text-base pr-16">
                Visão tabular comparativa detalhando a presença, ausência e status das estruturas
                físicas, fluxos de atendimento, protocolos operacionais e equipes da rede de
                proteção.
              </CardDescription>
              <div className="absolute top-4 right-12 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1 rounded-sm hover:bg-muted/50"
                      title="Exportar Tabela"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        const data = filteredMunicipios.map((m) => ({
                          municipio: m.municipio,
                          comarca: m.comarca,
                          polo_regional: m.polo_regional,
                          tem_sala_especializada: m.tem_sala_especializada,
                          tem_recursos_minimos: m.tem_recursos_minimos,
                          tem_atendimento_psicossocial: m.tem_atendimento_psicossocial,
                          tem_atendimento_juridico: m.tem_atendimento_juridico,
                          tem_fluxo_formal: m.tem_fluxo_formal,
                          tem_protocolo_local_regional: m.tem_protocolo_local_regional,
                          tem_articulacao_rede: m.tem_articulacao_rede,
                          tem_equipe_multiprofissional: m.tem_equipe_multiprofissional,
                          capacitado_perspectiva_genero: m.capacitado_perspectiva_genero,
                          treinamento_especifico_feminicidio: m.treinamento_especifico_feminicidio,
                          grau_suficiencia_estrutura: m.grau_suficiencia_estrutura,
                          ier_score: m.ier_score,
                          imf_score: m.imf_score,
                          iqt_score: m.iqt_score,
                        }));
                        exportCsv("matriz_estrutura_municipios.csv", data);
                      }}
                    >
                      Exportar CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const data = filteredMunicipios.map((m) => ({
                          municipio: m.municipio,
                          comarca: m.comarca,
                          polo_regional:
                            m.polo_regional === "São Raimundo Nonato"
                              ? "São Rdo Nonato"
                              : m.polo_regional,
                          tem_sala_especializada: m.tem_sala_especializada,
                          tem_recursos_minimos: m.tem_recursos_minimos,
                          tem_atendimento_psicossocial: m.tem_atendimento_psicossocial,
                          tem_atendimento_juridico: m.tem_atendimento_juridico,
                          tem_fluxo_formal: m.tem_fluxo_formal,
                          tem_protocolo_local_regional: m.tem_protocolo_local_regional,
                          tem_articulacao_rede: m.tem_articulacao_rede,
                          tem_equipe_multiprofissional: m.tem_equipe_multiprofissional,
                          capacitado_perspectiva_genero: m.capacitado_perspectiva_genero,
                          treinamento_especifico_feminicidio: m.treinamento_especifico_feminicidio,
                          grau_suficiencia_estrutura: m.grau_suficiencia_estrutura,
                          ier_score: m.ier_score,
                          imf_score: m.imf_score,
                          iqt_score: m.iqt_score,
                        }));
                        exportPdf(
                          "matriz_estrutura_municipios.pdf",
                          "Matriz Territorial de Estrutura",
                          data,
                          {
                            subtitle:
                              "Visão tabular comparativa da presença ou ausência de recursos de infraestrutura",
                            kpis: [
                              { label: "Municípios Avaliados", value: data.length },
                              {
                                label: "Estrutura Adequada",
                                value: data.filter(
                                  (d) => d.grau_suficiencia_estrutura === "ADEQUADO",
                                ).length,
                              },
                            ],
                          },
                        );
                      }}
                    >
                      Exportar PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                      <TableHead
                        className="text-base cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("municipio")}
                      >
                        Município <SortIcon column="municipio" />
                      </TableHead>
                      <TableHead
                        className="text-base cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("comarca")}
                      >
                        Comarca <SortIcon column="comarca" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("tem_sala_especializada")}
                      >
                        Sala
                        <br />
                        Especializada <SortIcon column="tem_sala_especializada" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("tem_recursos_minimos")}
                      >
                        Recursos
                        <br />
                        Mínimos <SortIcon column="tem_recursos_minimos" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("tem_atendimento_psicossocial")}
                      >
                        Atendimento
                        <br />
                        Psicossocial <SortIcon column="tem_atendimento_psicossocial" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("tem_atendimento_juridico")}
                      >
                        Atendimento
                        <br />
                        Jurídico <SortIcon column="tem_atendimento_juridico" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("tem_fluxo_formal")}
                      >
                        Fluxo
                        <br />
                        Formal <SortIcon column="tem_fluxo_formal" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("tem_protocolo_local_regional")}
                      >
                        Protocolo
                        <br />
                        Regional <SortIcon column="tem_protocolo_local_regional" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("tem_articulacao_rede")}
                      >
                        Articulação
                        <br />
                        em Rede <SortIcon column="tem_articulacao_rede" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("tem_equipe_multiprofissional")}
                      >
                        Equipe
                        <br />
                        Multiprofissional <SortIcon column="tem_equipe_multiprofissional" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("capacitado_perspectiva_genero")}
                      >
                        Capacitação
                        <br />
                        em Gênero <SortIcon column="capacitado_perspectiva_genero" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("treinamento_especifico_feminicidio")}
                      >
                        Treinamento
                        <br />
                        Feminicídio <SortIcon column="treinamento_especifico_feminicidio" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("grau_suficiencia_estrutura")}
                      >
                        Suficiência <SortIcon column="grau_suficiencia_estrutura" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-right cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("ier_score")}
                      >
                        Score
                        <br />
                        IER <SortIcon column="ier_score" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-right cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("imf_score")}
                      >
                        Score
                        <br />
                        IMF <SortIcon column="imf_score" />
                      </TableHead>
                      <TableHead
                        className="text-base leading-tight text-right cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("iqt_score")}
                      >
                        Score
                        <br />
                        IQT <SortIcon column="iqt_score" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const totalEstruturaPages = Math.ceil(filteredMunicipios.length / 20) || 1;
                      const safeEstruturaPage = Math.min(estruturaPage, totalEstruturaPages);
                      const estruturaPaginated = filteredMunicipios.slice(
                        (safeEstruturaPage - 1) * 20,
                        safeEstruturaPage * 20,
                      );
                      return estruturaPaginated.map((m) => (
                        <TableRow key={m.codigo_ibge} className="hover:bg-muted/50">
                          <TableCell className="font-semibold text-base py-2 text-foreground">
                            <Link
                              to="/municipios/$slug"
                              params={{ slug: m.municipio_slug }}
                              className="hover:underline text-primary"
                            >
                              {m.municipio}
                            </Link>
                          </TableCell>
                          <TableCell className="text-base py-2 text-muted-foreground">
                            {m.comarca}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.tem_sala_especializada} />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.tem_recursos_minimos} />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.tem_atendimento_psicossocial} />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.tem_atendimento_juridico} />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.tem_fluxo_formal} />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.tem_protocolo_local_regional} />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.tem_articulacao_rede} />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.tem_equipe_multiprofissional} />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.capacitado_perspectiva_genero} />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.treinamento_especifico_feminicidio} />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-xs font-semibold",
                                m.grau_suficiencia_estrutura === "ADEQUADO"
                                  ? "bg-success/15 text-[color:var(--color-success)]"
                                  : m.grau_suficiencia_estrutura === "PARCIAL"
                                    ? "bg-warning/15 text-warning-foreground"
                                    : m.grau_suficiencia_estrutura
                                      ? "bg-destructive/15 text-destructive"
                                      : "text-muted-foreground font-normal",
                              )}
                            >
                              {m.grau_suficiencia_estrutura ?? "Sem informação"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right py-2 font-bold text-base">
                            {m.ier_score}
                          </TableCell>
                          <TableCell className="text-right py-2 font-bold text-base">
                            {m.imf_score}
                          </TableCell>
                          <TableCell className="text-right py-2 font-bold text-base">
                            {m.iqt_score}
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
              {(() => {
                const totalEstruturaPages = Math.ceil(filteredMunicipios.length / 20) || 1;
                const safeEstruturaPage = Math.min(estruturaPage, totalEstruturaPages);
                if (totalEstruturaPages <= 1) return null;
                return (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/10 mt-2 rounded-b-lg">
                    <div className="text-base text-muted-foreground">
                      Exibindo {(safeEstruturaPage - 1) * 20 + 1} a{" "}
                      {Math.min(safeEstruturaPage * 20, filteredMunicipios.length)} de{" "}
                      {filteredMunicipios.length} municípios
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-base"
                        onClick={() => setEstruturaPage((p) => Math.max(1, p - 1))}
                        disabled={safeEstruturaPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-base font-medium px-2">
                        Página {safeEstruturaPage} de {totalEstruturaPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-base"
                        onClick={() =>
                          setEstruturaPage((p) => Math.min(totalEstruturaPages, p + 1))
                        }
                        disabled={safeEstruturaPage === totalEstruturaPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================
            PAINEL 2: VIOLÊNCIA DE GÊNERO, INVESTIGAÇÃO E PERÍCIAS
            ======================================================== */}
        <TabsContent value="violencia" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <KpiCard
              label="Feminicídios Consumados (Recorte)"
              value={stats.totalFeminicidiosConsumados}
              hint="2023-2025 consolidado"
              tone="critical"
              icon={ShieldAlert}
            />
            <KpiCard
              label="Feminicídios Tentados (Recorte)"
              value={stats.totalFeminicidiosTentados}
              hint="2023-2025 consolidado"
              tone="warning"
              icon={ShieldAlert}
            />
            <KpiCard
              label="Protocolo de Investigação"
              value={stats.pctProtInvestigacao}
              hint="Mapeado na polícia"
              tone="primary"
              icon={FileText}
            />
            <KpiCard
              label="Total de Capacitações"
              value={stats.totalCapacitacoes}
              hint="Realizadas na segurança"
              tone="success"
              icon={GraduationCap}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Gráfico de Correlação: Volume de Ocorrências vs Capacitação */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3 border-b border-border/50 relative">
                <ChartHelper>
                  <p>
                    Este painel mede a eficiência da resposta institucional do MPPI frente às
                    pressões territoriais (demandas).
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong className="text-foreground/80">Demandas:</strong> Ocorrências
                      criminais reportadas.
                    </li>
                    <li>
                      <strong className="text-foreground/80">Respostas:</strong> Esforço formativo e
                      capacitações executadas.
                    </li>
                  </ul>
                  <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                    <p className="text-primary-700 dark:text-primary-300 font-medium">
                      A <strong className="font-bold">Lacuna Institucional (%)</strong> aponta o
                      percentual da demanda que ainda carece de resposta proporcional. Polos
                      Regionais com maior déficit ficam no topo com cores de alerta.
                    </p>
                  </div>
                </ChartHelper>
                <CardTitle className="text-lg text-foreground pr-8">
                  Lacuna Institucional de Capacitação por Polo
                </CardTitle>
                <CardDescription className="text-base leading-relaxed mt-1 text-muted-foreground/90 pr-8">
                  Comparativo padronizado entre pressão territorial de ocorrências e resposta
                  formativa, com foco no déficit percentual de cobertura.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[800px] flex items-center justify-center pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={poloCruzamentoData}
                    margin={{ top: 10, right: 60, left: 20, bottom: 10 }}
                    onClick={(e) => {
                      if (e && e.activeLabel) {
                        handleSelectPolo(e.activeLabel);
                      }
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.15}
                      horizontal={true}
                      vertical={true}
                    />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      type="category"
                      dataKey="polo"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 14, fontWeight: 700, fill: "var(--color-foreground)" }}
                      width={180}
                    />
                    <Tooltip
                      content={<LacunaTooltip />}
                      cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                    />
                    <Bar
                      dataKey="lacuna_percentual"
                      name="Lacuna Institucional (%)"
                      radius={[0, 4, 4, 0]}
                      barSize={32}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <LabelList
                        dataKey="lacuna_percentual"
                        position="right"
                        formatter={(val: number) => `${val.toFixed(1)}%`}
                        style={{ fill: "var(--color-foreground)", fontSize: 14, fontWeight: 700 }}
                      />
                      {poloCruzamentoData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.lacuna_percentual >= 70
                              ? COLOR_CRIT
                              : entry.lacuna_percentual >= 40
                                ? COLOR_WARN
                                : COLOR_OK
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lista de Gargalos Técnicos Identificados */}
            <Card className="flex flex-col">
              <CardHeader className="pb-2 relative">
                <ChartHelper>
                  <p>
                    Mapeia os principais bloqueios práticos ao atendimento qualificado, conforme
                    reportado em campo.
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong className="text-foreground/80">Infraestrutura:</strong> Falta de
                      viaturas, espaço físico ou material.
                    </li>
                    <li>
                      <strong className="text-foreground/80">Pessoal:</strong> Déficit de
                      profissionais especializados.
                    </li>
                  </ul>
                  <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                    <p className="text-primary-700 dark:text-primary-300 font-medium">
                      Os <strong className="font-bold">Gargalos reportados</strong> são evidências
                      qualitativas fortíssimas para embasar Ações Civis Públicas (ACPs).
                    </p>
                  </div>
                </ChartHelper>
                <CardTitle className="text-lg pr-8">Gargalos Críticos Identificados</CardTitle>
                <CardDescription className="text-base pr-8">
                  Fatos reportados pelas equipes de investigação e perícias locais.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[800px] overflow-y-auto px-4 pb-4 space-y-3">
                  {listGargalos.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-8">
                      Nenhum gargalo reportado no recorte atual.
                    </p>
                  ) : (
                    listGargalos.map((m, idx) => (
                      <div
                        key={m.codigo_ibge}
                        className="border-b border-border/40 pb-2 last:border-0"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-lg font-bold text-foreground">{m.municipio}</span>
                          <span className="text-base font-medium text-muted-foreground">
                            {m.polo_regional}
                          </span>
                        </div>
                        <div className="text-base text-destructive flex flex-col gap-2">
                          {m.gargalos_identificados?.split(";").map((g, i) => {
                            const text = g.trim();
                            if (!text) return null;
                            return (
                              <div
                                key={i}
                                className="flex items-start gap-2 bg-destructive/5 px-3 py-2 rounded-md border border-destructive/10 shadow-sm"
                              >
                                <span className="mt-0.5 text-[12px]">🔴</span>
                                <span className="italic leading-relaxed font-medium">{text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Matriz Qualitativa do Painel 2 */}
          <Card>
            <CardHeader className="pb-2 relative">
              <ChartHelper>
                <p>
                  Monitora a formalização das diretrizes de investigação e perícia técnica na
                  segurança pública.
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <strong className="text-foreground/80">Protocolos:</strong> Existência de regras
                    oficiais de apuração.
                  </li>
                  <li>
                    <strong className="text-foreground/80">Capacitações:</strong> Volume de
                    treinamento para aplicação das regras.
                  </li>
                </ul>
                <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                  <p className="text-primary-700 dark:text-primary-300 font-medium">
                    O <strong className="font-bold">Grau de Aderência Técnica</strong> mede não
                    apenas a teoria formal, mas a efetiva preparação policial na ponta.
                  </p>
                </div>
              </ChartHelper>
              <CardTitle className="text-lg pr-8">
                Protocolos Técnicos e Aderência por Município
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[650px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                      <TableHead
                        className="text-base cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("municipio")}
                      >
                        Município <SortIcon column="municipio" />
                      </TableHead>
                      <TableHead
                        className="text-base text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("tem_protocolo_investigacao")}
                      >
                        Protocolo de
                        <br />
                        Investigação <SortIcon column="tem_protocolo_investigacao" />
                      </TableHead>
                      <TableHead
                        className="text-base text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("tem_protocolo_pericial")}
                      >
                        Protocolo
                        <br />
                        Pericial <SortIcon column="tem_protocolo_pericial" />
                      </TableHead>
                      <TableHead
                        className="text-base text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("capacitado_perspectiva_genero")}
                      >
                        Capacitado em
                        <br />
                        Gênero <SortIcon column="capacitado_perspectiva_genero" />
                      </TableHead>
                      <TableHead
                        className="text-base text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("treinamento_especifico_feminicidio")}
                      >
                        Treinamento
                        <br />
                        Específico <SortIcon column="treinamento_especifico_feminicidio" />
                      </TableHead>
                      <TableHead
                        className="text-base text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("qtd_capacitacoes_realizadas")}
                      >
                        Quantidade de
                        <br />
                        Capacitações <SortIcon column="qtd_capacitacoes_realizadas" />
                      </TableHead>
                      <TableHead
                        className="text-base text-center cursor-pointer transition-colors hover:bg-white/10"
                        onClick={() => handleSort("grau_aderencia_protocolo")}
                      >
                        Aderência
                        <br />
                        Técnica <SortIcon column="grau_aderencia_protocolo" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMunicipios.slice(0, 50).map((m) => (
                      <TableRow key={m.codigo_ibge}>
                        <TableCell className="font-semibold text-base py-2 text-primary">
                          {m.municipio}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <SimNaoTexto valor={m.tem_protocolo_investigacao} />
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <SimNaoTexto valor={m.tem_protocolo_pericial} />
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <SimNaoTexto valor={m.capacitado_perspectiva_genero} />
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <SimNaoTexto valor={m.treinamento_especifico_feminicidio} />
                        </TableCell>
                        <TableCell className="py-2 text-center text-base font-medium">
                          {m.qtd_capacitacoes_realizadas ?? "—"}
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-md text-sm font-bold shadow-sm",
                              m.grau_aderencia_protocolo === "ALTO"
                                ? "bg-success/15 text-[color:var(--color-success)]"
                                : m.grau_aderencia_protocolo === "MEDIO"
                                  ? "bg-warning/15 text-warning-foreground"
                                  : m.grau_aderencia_protocolo
                                    ? "bg-destructive/15 text-destructive"
                                    : "text-muted-foreground font-normal shadow-none",
                            )}
                          >
                            {m.grau_aderencia_protocolo ?? "Sem informação"}
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
            {(() => {
              const assistenciaMetrics = [
                {
                  id: "prot",
                  label: "Protocolo de Atendimento",
                  desc: "Diretrizes padronizadas de assistência.",
                  valStr: stats.pctProtAssistencial,
                  val: parseFloat(stats.pctProtAssistencial) || 0,
                },
                {
                  id: "fluxo",
                  label: "Fluxo Formal de Encaminhamento",
                  desc: "Estruturação de direcionamento oficial.",
                  valStr: stats.pctFluxoEncam,
                  val: parseFloat(stats.pctFluxoEncam) || 0,
                },
                {
                  id: "rede",
                  label: "Articulação com a Rede",
                  desc: "Comunicação interinstitucional ativa.",
                  valStr: stats.pctArticCreasRede,
                  val: parseFloat(stats.pctArticCreasRede) || 0,
                },
                {
                  id: "equipe",
                  label: "Equipe Técnica Mínima",
                  desc: "Profissionais básicos exigidos em lei.",
                  valStr: stats.pctEquipeMinimaCreas,
                  val: parseFloat(stats.pctEquipeMinimaCreas) || 0,
                },
              ].sort((a, b) => b.val - a.val);

              const assistenciaAvg =
                assistenciaMetrics.reduce((acc, curr) => acc + curr.val, 0) /
                (assistenciaMetrics.length || 1);
              const bestMetric = assistenciaMetrics[0];
              const worstMetric = assistenciaMetrics[assistenciaMetrics.length - 1];

              const getSemanticColorClass = (val: number) => {
                if (val >= 75) return "[&>div]:bg-primary";
                if (val >= 40) return "[&>div]:bg-primary/50";
                return "[&>div]:bg-destructive/70";
              };

              return (
                <Card className="flex flex-col min-h-[750px]">
                  <CardHeader className="pb-2 border-b border-border/50 relative">
                    <ChartHelper>
                      <p>
                        Sintetiza a capacidade instalada da rede de proteção social especial (CREAS
                        e afins).
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>
                          <strong className="text-foreground/80">Força/Lacuna:</strong> O indicador
                          de melhor/pior desempenho relativo.
                        </li>
                        <li>
                          <strong className="text-foreground/80">Articulação:</strong> Nível de
                          integração com a segurança e justiça.
                        </li>
                      </ul>
                      <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                        <p className="text-primary-700 dark:text-primary-300 font-medium">
                          A <strong className="font-bold">Média Geral de Maturidade</strong> aponta
                          o quão preparada a assistência social está para amparar as vítimas
                          encaminhadas.
                        </p>
                      </div>
                    </ChartHelper>
                    <CardTitle className="text-lg pr-8">Maturidade Socioassistencial</CardTitle>
                    <CardDescription className="text-base pr-8">
                      Diagnóstico executivo de fluxos e estrutura dos CREAS.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 flex flex-col">
                    {/* Síntese Executiva Topo */}
                    <div className="grid grid-cols-3 gap-3 mb-8 p-3 bg-muted/20 rounded-lg border border-border/40">
                      <div className="flex flex-col items-center justify-center text-center p-2 border border-foreground/20 rounded-md bg-background/50 shadow-sm">
                        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                          Média Geral
                        </span>
                        <span className="text-xl font-semibold text-primary">
                          {assistenciaAvg.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center p-2 border border-foreground/20 rounded-md bg-background/50 shadow-sm">
                        <span
                          className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1 line-clamp-1"
                          title="Maior Força"
                        >
                          Maior Força
                        </span>
                        <span
                          className="text-sm font-bold text-foreground leading-tight line-clamp-2 h-8 flex items-center justify-center"
                          title={bestMetric.label}
                        >
                          {bestMetric.label}
                        </span>
                        <span className="text-sm font-semibold text-primary mt-1">
                          {bestMetric.valStr}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center p-2 border border-foreground/20 rounded-md bg-background/50 shadow-sm">
                        <span
                          className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1 line-clamp-1"
                          title="Maior Lacuna"
                        >
                          Maior Lacuna
                        </span>
                        <span
                          className="text-sm font-bold text-foreground leading-tight line-clamp-2 h-8 flex items-center justify-center"
                          title={worstMetric.label}
                        >
                          {worstMetric.label}
                        </span>
                        <span className="text-sm font-semibold text-destructive mt-1">
                          {worstMetric.valStr}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-7 flex-1 flex flex-col justify-center">
                      {assistenciaMetrics.map((m) => (
                        <div key={m.id} className="group">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex flex-col pr-4">
                              <span className="font-bold text-foreground text-[15px] group-hover:text-primary transition-colors">
                                {m.label}
                              </span>
                              <span className="text-[15px] font-medium text-muted-foreground leading-snug mt-0.5">
                                {m.desc}
                              </span>
                            </div>
                            <span className="font-semibold text-primary text-xl mt-0.5 tabular-nums">
                              {m.valStr}
                            </span>
                          </div>
                          <Progress
                            value={m.val}
                            className={cn(
                              "h-8 bg-muted/60 border border-border/50 shadow-sm",
                              getSemanticColorClass(m.val),
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            <Card className="md:col-span-2">
              <CardHeader className="pb-2 relative">
                <ChartHelper>
                  <p>Visão exaustiva por município da rede de suporte assistencial às vítimas.</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong className="text-foreground/80">CREAS Ativo:</strong> Existência do
                      equipamento primário de proteção.
                    </li>
                    <li>
                      <strong className="text-foreground/80">Equipe Mínima:</strong> Atendimento à
                      Norma Operacional Básica.
                    </li>
                  </ul>
                  <div className="bg-primary/10 p-2.5 rounded-md border border-primary/20 mt-2">
                    <p className="text-primary-700 dark:text-primary-300 font-medium">
                      Exportando esta base, é possível mapear rapidamente onde o MPPI deve intervir
                      para <strong className="font-bold">abertura de novos equipamentos</strong>{" "}
                      sociais.
                    </p>
                  </div>
                </ChartHelper>
                <CardTitle className="text-lg pr-8">
                  Detalhamento dos Recursos e Cobertura Assistencial
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[750px] overflow-y-auto px-4 pb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="text-base cursor-pointer transition-colors hover:bg-white/10"
                          onClick={() => handleSort("municipio")}
                        >
                          Município <SortIcon column="municipio" />
                        </TableHead>
                        <TableHead
                          className="text-base text-center cursor-pointer transition-colors hover:bg-white/10"
                          onClick={() => handleSort("creas_possui")}
                        >
                          CREAS Ativo <SortIcon column="creas_possui" />
                        </TableHead>
                        <TableHead
                          className="text-base text-center cursor-pointer transition-colors hover:bg-white/10"
                          onClick={() => handleSort("tem_equipe_minima_creas")}
                        >
                          Equipe
                          <br />
                          Mínima <SortIcon column="tem_equipe_minima_creas" />
                        </TableHead>
                        <TableHead
                          className="text-base text-center cursor-pointer transition-colors hover:bg-white/10"
                          onClick={() => handleSort("articulacao_creas_rede")}
                        >
                          Articulação
                          <br />
                          do CREAS <SortIcon column="articulacao_creas_rede" />
                        </TableHead>
                        <TableHead
                          className="text-base text-center cursor-pointer transition-colors hover:bg-white/10"
                          onClick={() => handleSort("profissionais_capacitados")}
                        >
                          Profissionais
                          <br />
                          Capacitados <SortIcon column="profissionais_capacitados" />
                        </TableHead>
                        <TableHead
                          className="text-base cursor-pointer transition-colors hover:bg-white/10"
                          onClick={() => handleSort("data_ultima_capacitacao")}
                        >
                          Última
                          <br />
                          Capacitação <SortIcon column="data_ultima_capacitacao" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assistenciaPaginated.map((m) => (
                        <TableRow key={m.codigo_ibge} className="hover:bg-muted/30">
                          <TableCell className="font-semibold text-base py-2 text-primary">
                            {m.municipio}
                          </TableCell>
                          <TableCell className="py-2 text-center text-base">
                            {m.creas_possui === "SIM" ? (
                              <span className="text-base bg-success/10 text-[color:var(--color-success)] px-1.5 py-0.5 rounded font-semibold">
                                ATIVO
                              </span>
                            ) : (
                              <span className="text-base bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-semibold">
                                INATIVO
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.tem_equipe_minima_creas} />
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <SimNaoIcone valor={m.articulacao_creas_rede} />
                          </TableCell>
                          <TableCell className="py-2 text-center text-base font-bold">
                            {m.profissionais_capacitados ?? "—"}
                          </TableCell>
                          <TableCell className="py-2 text-base text-muted-foreground">
                            {m.data_ultima_capacitacao
                              ? m.data_ultima_capacitacao.split("-").reverse().join("/")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalAssistenciaPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/10">
                    <div className="text-base text-muted-foreground">
                      Exibindo {(safeAssistenciaPage - 1) * 20 + 1} a{" "}
                      {Math.min(safeAssistenciaPage * 20, filteredMunicipios.length)} de{" "}
                      {filteredMunicipios.length} municípios
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-base"
                        onClick={() => setAssistenciaPage((p) => Math.max(1, p - 1))}
                        disabled={safeAssistenciaPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-base font-medium px-2">
                        Página {safeAssistenciaPage} de {totalAssistenciaPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-base"
                        onClick={() =>
                          setAssistenciaPage((p) => Math.min(totalAssistenciaPages, p + 1))
                        }
                        disabled={safeAssistenciaPage === totalAssistenciaPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Visão de Ficha Territorial Completa para Municípios Únicos */}
      {selectedMunicipio !== "__all" && filteredMunicipios[0] && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <MapPin className="h-5 w-5" />
              Ficha Territorial Completa do Município: {filteredMunicipios[0].municipio}
            </CardTitle>
            <CardDescription className="text-base">
              Consolidado de informações diagnósticas, infraestrutura, protocolos e violência
              doméstica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1 bg-background p-3 rounded-lg border border-border/40">
                <p className="text-base text-muted-foreground uppercase font-bold">População</p>
                <p className="text-base font-semibold">
                  {filteredMunicipios[0].populacao.toLocaleString("pt-BR")} hab.
                </p>
              </div>
              <div className="space-y-1 bg-background p-3 rounded-lg border border-border/40">
                <p className="text-base text-muted-foreground uppercase font-bold">
                  Comarca / Polo
                </p>
                <p className="text-base font-semibold">
                  {filteredMunicipios[0].comarca} / {filteredMunicipios[0].polo_regional}
                </p>
              </div>
              <div className="space-y-1 bg-background p-3 rounded-lg border border-border/40">
                <p className="text-base text-muted-foreground uppercase font-bold">
                  Score Geral IER
                </p>
                <p className="text-base font-semibold text-primary">
                  {filteredMunicipios[0].ier_score} / 10
                </p>
              </div>
              <div className="space-y-1 bg-background p-3 rounded-lg border border-border/40">
                <p className="text-base text-muted-foreground uppercase font-bold">
                  Última Atualização
                </p>
                <p className="text-base font-semibold">
                  {filteredMunicipios[0].ultima_atualizacao_referencia || "2026-05-28"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-6">
              <div className="space-y-2 bg-background/50 p-4 rounded-lg border border-border/40">
                <h4 className="text-base font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1.5 mb-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" /> Infraestrutura e Fluxos
                </h4>
                <ul className="space-y-1 text-base text-muted-foreground">
                  <li className="flex justify-between">
                    <span>Sala Especializada:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].tem_sala_especializada}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Recursos Mínimos:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].tem_recursos_minimos}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Estrutura Geral:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].grau_suficiencia_estrutura}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Fluxo Formal:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].tem_fluxo_formal}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Articulação Rede:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].tem_articulacao_rede}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 bg-background/50 p-4 rounded-lg border border-border/40">
                <h4 className="text-base font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1.5 mb-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" /> Investigação e Perícias
                </h4>
                <ul className="space-y-1 text-base text-muted-foreground">
                  <li className="flex justify-between">
                    <span>Protocolo Investigação:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].tem_protocolo_investigacao}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Protocolo Pericial:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].tem_protocolo_pericial}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Aderência Protocolo:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].grau_aderencia_protocolo}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Capacitações na Segurança:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].qtd_capacitacoes_realizadas}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Treinamento Feminicídio:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].treinamento_especifico_feminicidio}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 bg-background/50 p-4 rounded-lg border border-border/40">
                <h4 className="text-base font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-1.5 mb-2">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" /> Assistência Social
                </h4>
                <ul className="space-y-1 text-base text-muted-foreground">
                  <li className="flex justify-between">
                    <span>Protocolo Socioassistencial:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].tem_protocolo_assistencial}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Encaminhamento Formal:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].tem_fluxo_encaminhamento}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Articulação CREAS:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].articulacao_creas_rede}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Equipe Mínima CREAS:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].tem_equipe_minima_creas}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>Profissionais Capacitados:</span>{" "}
                    <span className="font-semibold text-foreground">
                      {filteredMunicipios[0].profissionais_capacitados}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            {filteredMunicipios[0].gargalos_identificados && (
              <div className="mt-4 p-3 bg-destructive/5 rounded-lg border border-destructive/20 text-base">
                <span className="font-bold text-destructive mb-2 block">Gargalos Críticos:</span>
                <ul className="list-disc pl-5 space-y-1">
                  {filteredMunicipios[0].gargalos_identificados.split(";").map((g, i) => {
                    const text = g.trim();
                    if (!text) return null;
                    return (
                      <li key={i} className="text-foreground/90">
                        {text}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <NotasRodape
        fontes={[
          "carga do diagnóstico da rede de proteção do Piauí (CAOCRIM)",
          "diagnósticos das Promotorias de Justiça validados pelo CAOCRIM (Diagnóstico BRIGID)",
        ]}
        notas={[
          "IER (estrutura), IMF (fluxos) e IQT (qualificação técnica) variam de 0 a 10; a composição de cada índice está na Metodologia de Cálculos.",
          "Campos sem informação consolidada aparecem como “Sem informação” e não somam pontos nos índices.",
        ]}
      />
    </div>
  );
}

function IndiceTile({
  sigla,
  rotulo,
  valor,
  icon: Icon,
  ativo,
  onClick,
}: {
  sigla: string;
  rotulo: string;
  valor: number;
  icon: React.ElementType;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      title={`Exibir ${sigla} no mapa`}
      className={cn(
        "flex min-w-0 flex-col rounded-md border px-3 py-2 text-left transition-colors",
        ativo ? "border-primary ring-1 ring-primary" : "border-border hover:border-foreground/30",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </span>
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </span>
      <span className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {valor.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">/10</span>
        <span className="ml-auto text-[11px] font-medium text-muted-foreground">{sigla}</span>
      </span>
      <Progress value={valor * 10} className="mt-1.5 h-[3px]" />
    </button>
  );
}
