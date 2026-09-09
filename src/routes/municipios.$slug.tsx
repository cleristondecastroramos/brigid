import { useMemo } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  MapPin,
  Users,
  Building2,
  HeartHandshake,
  Download,
  Printer,
  ShieldAlert,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Shield,
  Target,
  Info,
} from "lucide-react";
import { municipiosQueryOptions } from "@/lib/data-fetching";
import { useMunicipios } from "@/lib/useMunicipios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge, AlertBadge, YesNoBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { exportPdf } from "@/lib/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import type { Municipio } from "@/lib/types";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/municipios/$slug")({
  loader: async ({ context, params }) => {
    const all = await context.queryClient.ensureQueryData(municipiosQueryOptions);
    const m = all.find((x) => x.municipio_slug === params.slug);
    if (!m) throw notFound();
    return { slug: params.slug };
  },
  component: MunicipioDetail,
  notFoundComponent: () => (
    <div className="rounded-md border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">Município não encontrado na base oficial.</p>
      <Link to="/municipios" className="mt-3 inline-flex text-sm text-primary hover:underline">
        Voltar à listagem
      </Link>
    </div>
  ),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateStr(dateStr: string | undefined | null) {
  if (!dateStr) return "—";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

const parseAlertToNum = (level: string) => {
  if (level === "CRITICO") return 100;
  if (level === "ALTO") return 75;
  if (level === "ATENCAO") return 40;
  return 0;
};

function flagStatus(val: string | undefined): "ok" | "warn" | "critical" | "neutral" {
  if (val === "SIM") return "ok";
  if (val === "NAO") return "warn";
  if (val === "CRITICO") return "critical";
  if (val === "ATENCAO") return "warn";
  if (val === "ADEQUADO") return "ok";
  return "neutral";
}

const FLAG_COLORS: Record<string, string> = {
  ok: "#16a34a",
  warn: "#7c3aed",
  critical: "#b91c1c",
  neutral: "#94a3b8",
};

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2.5 last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{k}</span>
      <span className="text-base font-semibold text-foreground text-right">{v}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function MunicipioDetail() {
  const { slug } = Route.useParams();
  const { data: all } = useMunicipios();
  const m = all.find((x) => x.municipio_slug === slug)!;

  const poloMunicipios = useMemo(
    () => all.filter((x) => x.polo_regional === m.polo_regional),
    [all, m.polo_regional],
  );

  const stateRank = useMemo(
    () =>
      [...all]
        .sort((a, b) => b.risco_feminicidio_score - a.risco_feminicidio_score)
        .findIndex((x) => x.codigo_ibge === m.codigo_ibge) + 1,
    [all, m],
  );
  const poloRank = useMemo(
    () =>
      [...poloMunicipios]
        .sort((a, b) => b.risco_feminicidio_score - a.risco_feminicidio_score)
        .findIndex((x) => x.codigo_ibge === m.codigo_ibge) + 1,
    [poloMunicipios, m],
  );

  const maxRisco = Math.max(...all.map((x) => x.risco_feminicidio_score));
  const maxConsumado = Math.max(...all.map((x) => x.feminicidios_consumados_2023_2025));
  const maxTentativa = Math.max(...all.map((x) => x.feminicidios_tentados_2023_2025));

  const compileRadarData = (source: typeof m | (typeof m)[]) => {
    const isArr = Array.isArray(source);
    const getAvg = (fn: (x: typeof m) => number) =>
      isArr
        ? (source as (typeof m)[]).reduce((acc, x) => acc + fn(x), 0) /
          (source as (typeof m)[]).length
        : fn(source as typeof m);
    return {
      cobertura_opm: getAvg((x) => (x.opm_possui === "SIM" ? 100 : 0)),
      cobertura_creas: getAvg((x) => (x.creas_possui === "SIM" ? 100 : 0)),
      risco: getAvg((x) => (x.risco_feminicidio_score / maxRisco) * 100),
      violencia: getAvg((x) =>
        maxConsumado > 0 ? (x.feminicidios_consumados_2023_2025 / maxConsumado) * 100 : 0,
      ),
      alerta: getAvg((x) => parseAlertToNum(x.painel_alerta_rede)),
    };
  };

  const radarM = compileRadarData(m);
  const radarPolo = compileRadarData(poloMunicipios);
  const radarState = compileRadarData(all);

  const radarData = [
    {
      dim: "OPM",
      Mun: radarM.cobertura_opm,
      Polo: radarPolo.cobertura_opm,
      Estado: radarState.cobertura_opm,
    },
    {
      dim: "CREAS",
      Mun: radarM.cobertura_creas,
      Polo: radarPolo.cobertura_creas,
      Estado: radarState.cobertura_creas,
    },
    {
      dim: "Violência",
      Mun: radarM.violencia,
      Polo: radarPolo.violencia,
      Estado: radarState.violencia,
    },
    { dim: "Criticidade", Mun: radarM.risco, Polo: radarPolo.risco, Estado: radarState.risco },
    { dim: "Alerta Rede", Mun: radarM.alerta, Polo: radarPolo.alerta, Estado: radarState.alerta },
  ];

  const chartData = [
    { year: "2023", consumados: m.consumado_2023, tentados: m.tentado_2023 },
    { year: "2024", consumados: m.consumado_2024, tentados: m.tentado_2024 },
    { year: "2025", consumados: m.consumado_2025, tentados: m.tentado_2025 },
    { year: "2026", consumados: m.consumado_2026, tentados: m.tentado_2026 },
  ];

  const handleExportFicha = () => {
    const tableData = [
      { param: "População Geral", val: m.populacao.toString() },
      { param: "Risco Score", val: m.risco_feminicidio_score.toString() },
      { param: "Posição no Estado", val: `${stateRank}º de ${all.length}` },
      { param: "Posição no Polo", val: `${poloRank}º de ${poloMunicipios.length}` },
      { param: "Feminicídios Consumados", val: m.feminicidios_consumados_2023_2025.toString() },
      { param: "Feminicídios Tentados", val: m.feminicidios_tentados_2023_2025.toString() },
      { param: "Possui OPM", val: m.opm_possui },
      { param: "Possui CREAS", val: m.creas_possui },
      { param: "Alerta da Rede", val: m.painel_alerta_rede },
    ];
    exportPdf(
      `ficha_${m.municipio_slug}.pdf`,
      `Ficha Técnica Municipal: ${m.municipio}`,
      tableData,
      {
        subtitle: `IBGE: ${m.codigo_ibge} | Polo: ${m.polo_regional} | Score: ${m.risco_feminicidio_score.toFixed(1)}`,
      },
    );
  };

  // Dados para análise integrada
  const acimaPolo = m.risco_feminicidio_score > radarPolo.risco * (maxRisco / 100);
  const acimaEstado = radarM.risco > radarState.risco;
  const redeCompleta = m.opm_possui === "SIM" && m.creas_possui === "SIM";
  const redemParcial = m.opm_possui === "SIM" || m.creas_possui === "SIM";
  const redeLabel = redeCompleta
    ? "rede formal completa"
    : redemParcial
      ? "rede parcial"
      : "vazio institucional";
  const totalRegistros = m.feminicidios_consumados_2023_2025 + m.feminicidios_tentados_2023_2025;
  const crescimento2526 = m.consumado_2025 + m.tentado_2025 - (m.consumado_2024 + m.tentado_2024);

  // Callouts
  const vantagem = redeCompleta
    ? "Cobertura institucional completa (OPM + CREAS)"
    : m.risco_feminicidio_score < radarPolo.risco * (maxRisco / 100)
      ? "Score de risco abaixo da média do polo regional"
      : "Presença em monitoramento ativo do sistema";

  const fragilidade =
    m.necessita_atuacao_prioritaria === "SIM"
      ? "Identificado como município de atuação prioritária"
      : !redeCompleta
        ? `Ausência de ${m.opm_possui !== "SIM" ? "OPM" : "CREAS"} na estrutura local`
        : m.painel_alerta_rede === "CRITICO"
          ? "Alerta de rede em nível crítico"
          : "Monitoramento contínuo necessário";

  const recomendacao =
    m.necessita_atuacao_prioritaria === "SIM"
      ? "Atuação prioritária imediata com foco na rede de proteção"
      : m.painel_alerta_rede === "CRITICO"
        ? "Reforço urgente da estrutura de atendimento e monitoramento"
        : m.painel_alerta_rede === "ATENCAO"
          ? "Monitoramento intensificado e fortalecimento institucional"
          : "Manutenção e fortalecimento contínuo da rede local";

  return (
    <div className="pb-12">
      {/* ── 1. CABEÇALHO TÉCNICO INSTITUCIONAL ─────────────────────────── */}
      <MunicipioTechnicalHeader
        m={m}
        stateRank={stateRank}
        poloRank={poloRank}
        totalMunicipios={all.length}
        poloTotal={poloMunicipios.length}
        onExport={handleExportFicha}
      />

      <div className="space-y-8 mt-8 px-0">
        {/* ── 2. KPIs EXECUTIVOS ──────────────────────────────────────────── */}
        <MunicipioExecutiveKpis
          m={m}
          stateRank={stateRank}
          poloRank={poloRank}
          totalMunicipios={all.length}
          poloTotal={poloMunicipios.length}
        />

        {/* ── 3. TRÊS GRÁFICOS ANALÍTICOS ────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-3">
              Painel Analítico
            </span>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <MunicipioRadarChartCard radarData={radarData} />
            <MunicipioHistoricalSeriesCard chartData={chartData} />
            <MunicipioSystemFlagsCard m={m} />
          </div>
        </section>

        {/* ── 4. SUPERANÁLISE TÉCNICA INTEGRADA ──────────────────────────── */}
        <MunicipioIntegratedAnalysis
          m={m}
          acimaPolo={acimaPolo}
          acimaEstado={acimaEstado}
          redeLabel={redeLabel}
          redeCompleta={redeCompleta}
          crescimento2526={crescimento2526}
          totalRegistros={totalRegistros}
          poloRank={poloRank}
          stateRank={stateRank}
          totalMunicipios={all.length}
          poloTotal={poloMunicipios.length}
          vantagem={vantagem}
          fragilidade={fragilidade}
          recomendacao={recomendacao}
          radarM={radarM}
          radarPolo={radarPolo}
          radarState={radarState}
          maxRisco={maxRisco}
        />

        {/* ── 5. REDE DE PROTEÇÃO ─────────────────────────────────────────── */}
        <MunicipioNetworkSection m={m} />

        {/* ── 6. METADADOS E FONTES ──────────────────────────────────────── */}
        <MunicipioMetadataFooter m={m} />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTES
// ═════════════════════════════════════════════════════════════════════════════

// ─── 1. Header Técnico ────────────────────────────────────────────────────────

interface HeaderProps {
  m: Municipio;
  stateRank: number;
  poloRank: number;
  totalMunicipios: number;
  poloTotal: number;
  onExport: () => void;
}

function MunicipioTechnicalHeader({
  m,
  stateRank,
  poloRank,
  totalMunicipios,
  poloTotal,
  onExport,
}: HeaderProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #15052c 0%, #2e0854 45%, #100224 100%)",
        borderRadius: "0",
        marginLeft: "-1.5rem",
        marginRight: "-1.5rem",
        marginTop: "-1.5rem",
        padding: "2rem 2.5rem 2rem",
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Link
          to="/municipios"
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            textDecoration: "none",
          }}
          className="hover:text-white transition-colors"
        >
          <ArrowLeft style={{ width: "14px", height: "14px" }} />
          Municípios
        </Link>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px" }}>/</span>
        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", fontWeight: 500 }}>
          {m.municipio}
        </span>
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          {/* Label superior */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "6px",
              padding: "4px 10px",
              marginBottom: "12px",
            }}
          >
            <MapPin style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.7)" }} />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.85)",
                textTransform: "uppercase",
              }}
            >
              Ficha Técnica Municipal
            </span>
          </div>

          {/* Nome do município */}
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              margin: "0 0 10px",
            }}
          >
            {m.municipio}
          </h1>

          {/* Linha secundária */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", alignItems: "center" }}>
            <MetaChip label="IBGE" value={m.codigo_ibge} />
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <MetaChip label="Comarca" value={m.comarca} />
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <MetaChip label="Polo Regional" value={m.polo_regional} />
          </div>
        </div>

        {/* Direita: badges + ações */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}
        >
          {/* Badges de risco e alerta */}
          <div
            style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}
          >
            <HeaderBadge
              label="Risco"
              value={m.risco_feminicidio_nivel}
              level={m.risco_feminicidio_nivel}
            />
            <HeaderBadge
              label="Alerta da Rede"
              value={m.painel_alerta_rede}
              level={m.painel_alerta_rede}
            />
            {m.necessita_atuacao_prioritaria === "SIM" && (
              <div
                style={{
                  background: "rgba(239,68,68,0.25)",
                  border: "1px solid rgba(239,68,68,0.5)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <AlertTriangle style={{ width: "12px", height: "12px", color: "#fca5a5" }} />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#fca5a5",
                    letterSpacing: "0.06em",
                  }}
                >
                  ATUAÇÃO PRIORITÁRIA
                </span>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onExport}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                width: "150px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                padding: "8px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            >
              <Download style={{ width: "14px", height: "14px" }} />
              Exportar Ficha
            </button>
            <button
              onClick={() => window.print()}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                width: "150px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.8)",
                padding: "8px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            >
              <Printer style={{ width: "14px", height: "14px" }} />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)" }}>
      <span style={{ color: "rgba(255,255,255,0.4)", marginRight: "4px" }}>{label}:</span>
      <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{value}</span>
    </span>
  );
}

function HeaderBadge({ label, value, level }: { label: string; value: string; level: string }) {
  const isCritical = level === "CRITICO";
  const isHigh = level === "ALTO";
  const isAtencao = level === "ATENCAO";
  const isOk = level === "BAIXO" || level === "ADEQUADO";

  const bg = isCritical
    ? "rgba(239,68,68,0.2)"
    : isHigh
      ? "rgba(124,58,237,0.3)"
      : isAtencao
        ? "rgba(245,158,11,0.2)"
        : isOk
          ? "rgba(22,163,74,0.2)"
          : "rgba(255,255,255,0.1)";

  const border = isCritical
    ? "rgba(239,68,68,0.4)"
    : isHigh
      ? "rgba(167,139,250,0.4)"
      : isAtencao
        ? "rgba(245,158,11,0.4)"
        : isOk
          ? "rgba(74,222,128,0.4)"
          : "rgba(255,255,255,0.15)";

  const color = isCritical
    ? "#fca5a5"
    : isHigh
      ? "#c4b5fd"
      : isAtencao
        ? "#fcd34d"
        : isOk
          ? "#86efac"
          : "rgba(255,255,255,0.75)";

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "6px",
        padding: "4px 10px",
        width: "130px",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color,
          letterSpacing: "0.05em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

// ─── 2. KPIs Executivos ───────────────────────────────────────────────────────

interface KpisProps {
  m: Municipio;
  stateRank: number;
  poloRank: number;
  totalMunicipios: number;
  poloTotal: number;
}

function MunicipioExecutiveKpis({ m, stateRank, poloRank, totalMunicipios, poloTotal }: KpisProps) {
  const isCritical =
    m.risco_feminicidio_nivel === "CRITICO" || m.risco_feminicidio_nivel === "ALTO";

  return (
    <section>
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
        Métricas Executivas
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Score de Risco — destaque maior */}
        <div
          className="col-span-2 sm:col-span-2"
          style={{
            background: isCritical
              ? "linear-gradient(135deg, #f5f3ff, #ede9fe)"
              : "linear-gradient(135deg, #fafafa, #f4f4f5)",
            border: isCritical ? "1.5px solid #7c3aed" : "1px solid rgba(0, 0, 0, 0.15)",
            borderRadius: "12px",
            padding: "14px 16px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {isCritical && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: "linear-gradient(90deg, #7c3aed, #a855f7)",
              }}
            />
          )}
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: isCritical ? "#7c3aed" : "#6b7280",
              marginBottom: "6px",
            }}
          >
            Score de Risco
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span
              style={{
                fontSize: "2.25rem",
                fontWeight: 900,
                fontVariantNumeric: "tabular-nums",
                color: isCritical ? "#5b21b6" : "#111827",
                lineHeight: 1,
              }}
            >
              {m.risco_feminicidio_score.toFixed(1)}
            </span>
            <span
              style={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: isCritical ? "#7c3aed" : "#9ca3af",
              }}
            >
              {m.risco_feminicidio_nivel}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
            {stateRank}º de {totalMunicipios} no estado
          </p>
        </div>

        {/* Pop Total */}
        <ExecKpiCard
          label="Pop. Total"
          value={m.populacao.toLocaleString("pt-BR")}
          hint="habitantes"
          icon={<Users style={{ width: "16px", height: "16px" }} />}
        />

        {/* Pop Feminina */}
        <ExecKpiCard
          label="Pop. Feminina"
          value={(m.populacao_feminina || 0).toLocaleString("pt-BR")}
          hint="mulheres"
        />

        {/* Feminicídios */}
        <ExecKpiCard
          label="Consumados"
          value={m.feminicidios_consumados_2023_2025}
          hint="2023–2025"
          accentColor="#dc2626"
        />

        {/* Tentativas */}
        <ExecKpiCard
          label="Tentativas"
          value={m.feminicidios_tentados_2023_2025}
          hint="2023–2025"
          accentColor="#7c3aed"
        />

        {/* Posição Polo */}
        <ExecKpiCard label="No Polo" value={`${poloRank}º`} hint={`de ${poloTotal} municípios`} />

        {/* Status Rede */}
        <ExecKpiCard
          label="Alerta da Rede"
          value={m.painel_alerta_rede}
          hint={
            m.necessita_atuacao_prioritaria === "SIM" ? "Atuação prioritária" : "Em monitoramento"
          }
          accentColor={
            m.painel_alerta_rede === "CRITICO"
              ? "#dc2626"
              : m.painel_alerta_rede === "ATENCAO"
                ? "#7c3aed"
                : "#16a34a"
          }
        />
      </div>
    </section>
  );
}

function ExecKpiCard({
  label,
  value,
  hint,
  icon,
  accentColor,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0, 0, 0, 0.15)",
        borderRadius: "10px",
        padding: "12px 14px",
      }}
    >
      <p
        style={{
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#9ca3af",
          marginBottom: "4px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "1.7rem",
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
          color: accentColor || "#111827",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      {hint && <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "3px" }}>{hint}</p>}
    </div>
  );
}

// ─── 3a. Radar Chart ──────────────────────────────────────────────────────────

function MunicipioRadarChartCard({ radarData }: { radarData: any[] }) {
  return (
    <AnalyticsCard
      title="Análise Comparativa"
      subtitle="Comparação padronizada com a média do polo regional e estadual."
    >
      <div style={{ height: "350px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="dim"
              tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Município"
              dataKey="Mun"
              stroke="#6d28d9"
              fill="#7c3aed"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Radar
              name="Polo Regional"
              dataKey="Polo"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.1}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <Radar name="Estado" dataKey="Estado" stroke="#d1d5db" fill="none" strokeWidth={1} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", color: "#6b7280", paddingTop: "8px" }}
            />
            <RechartsTooltip
              formatter={(value: number, name: string) => [`${value.toFixed(1)} pts`, name]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  );
}

// ─── 3b. Série Histórica ──────────────────────────────────────────────────────

function MunicipioHistoricalSeriesCard({ chartData }: { chartData: any[] }) {
  return (
    <AnalyticsCard
      title="Série Histórica"
      subtitle="Evolução recente dos registros monitorados de consumados e tentativas."
      period="2023–2026"
    >
      <div style={{ height: "350px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13, fill: "#9ca3af" }}
            />
            <YAxis axisLine={false} tickLine={false} tick={false} allowDecimals={false} />
            <RechartsTooltip
              cursor={{ fill: "#f8fafc" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number, name: string) => [
                value,
                name === "consumados" ? "Consumados" : "Tentativas",
              ]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", color: "#6b7280", paddingTop: "8px" }}
              formatter={(v) => (v === "consumados" ? "Consumados" : "Tentativas")}
            />
            <Bar
              name="consumados"
              dataKey="consumados"
              fill="#dc2626"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              fillOpacity={0.85}
            >
              <LabelList
                dataKey="consumados"
                position="top"
                style={{ fontSize: "12px", fill: "#4b5563", fontWeight: 700 }}
              />
            </Bar>
            <Bar
              name="tentados"
              dataKey="tentados"
              fill="#7c3aed"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              fillOpacity={0.7}
            >
              <LabelList
                dataKey="tentados"
                position="top"
                style={{ fontSize: "12px", fill: "#4b5563", fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsCard>
  );
}

// ─── 3c. System Flags ─────────────────────────────────────────────────────────

function MunicipioSystemFlagsCard({ m }: { m: Municipio }) {
  const flags = [
    { label: "Tem OPM", val: m.opm_possui, type: "simnao" },
    { label: "OPM Ativa", val: m.opm_possui_estrutura_ativa, type: "simnao" },
    { label: "Tem CREAS", val: m.creas_possui, type: "simnao" },
    { label: "Fem. Consumado", val: m.indicador_tem_feminicidio_consumado, type: "simnao_inv" },
    {
      label: "Tentativa Registrada",
      val: m.indicador_tem_tentativa_feminicidio,
      type: "simnao_inv",
    },
    { label: "Alerta da Rede", val: m.painel_alerta_rede, type: "alerta" },
    { label: "Necessita Prioridade", val: m.necessita_atuacao_prioritaria, type: "simnao_inv" },
    { label: "Status Monitoramento", val: m.status_monitoramento || "ATIVO", type: "text" },
  ];

  return (
    <AnalyticsCard
      title="Flags do Sistema"
      subtitle="Painel sintético dos principais sinais e regras monitoradas."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
        {flags.map((flag) => {
          let color = "#94a3b8";
          const label = flag.val || "—";
          let barFill = 0.3;

          if (flag.type === "simnao") {
            color = flag.val === "SIM" ? "#16a34a" : "#7c3aed";
            barFill = flag.val === "SIM" ? 1 : 0.3;
          } else if (flag.type === "simnao_inv") {
            color = flag.val === "SIM" ? "#dc2626" : "#16a34a";
            barFill = flag.val === "SIM" ? 0.85 : 0.2;
          } else if (flag.type === "alerta") {
            color =
              flag.val === "CRITICO" ? "#dc2626" : flag.val === "ATENCAO" ? "#7c3aed" : "#16a34a";
            barFill = flag.val === "CRITICO" ? 1 : flag.val === "ATENCAO" ? 0.6 : 0.25;
          }

          return (
            <div key={flag.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  width: "130px",
                  flexShrink: 0,
                  fontWeight: 500,
                }}
              >
                {flag.label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: "6px",
                  background: "#f1f5f9",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${barFill * 100}%`,
                    background: color,
                    borderRadius: "3px",
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color,
                  width: "75px",
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </AnalyticsCard>
  );
}

// ─── Wrapper card para gráficos ───────────────────────────────────────────────

function AnalyticsCard({
  title,
  subtitle,
  period,
  children,
}: {
  title: string;
  subtitle: string;
  period?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0, 0, 0, 0.15)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        borderRadius: "14px",
        padding: "18px 18px 14px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            {title}
          </h3>
          {period && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#9ca3af",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "5px",
                padding: "2px 7px",
              }}
            >
              {period}
            </span>
          )}
        </div>
        <p style={{ fontSize: "12.5px", color: "#9ca3af", marginTop: "3px", lineHeight: 1.4 }}>
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}

// ─── 4. Superanálise Integrada ────────────────────────────────────────────────

interface AnalysisProps {
  m: Municipio;
  acimaPolo: boolean;
  acimaEstado: boolean;
  redeLabel: string;
  redeCompleta: boolean;
  crescimento2526: number;
  totalRegistros: number;
  poloRank: number;
  stateRank: number;
  totalMunicipios: number;
  poloTotal: number;
  vantagem: string;
  fragilidade: string;
  recomendacao: string;
  radarM: any;
  radarPolo: any;
  radarState: any;
  maxRisco: number;
}

function MunicipioIntegratedAnalysis({
  m,
  acimaPolo,
  acimaEstado,
  redeLabel,
  redeCompleta,
  crescimento2526,
  totalRegistros,
  poloRank,
  stateRank,
  totalMunicipios,
  poloTotal,
  vantagem,
  fragilidade,
  recomendacao,
  radarM,
  radarPolo,
  radarState,
  maxRisco,
}: AnalysisProps) {
  return (
    <section>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0, 0, 0, 0.15)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        {/* Cabeçalho da seção */}
        <div
          style={{
            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
            padding: "18px 24px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#f9fafb",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              background: "rgba(109,40,217,0.08)",
              borderRadius: "9px",
            }}
          >
            <BarChart3 style={{ width: "18px", height: "18px", color: "#6d28d9" }} />
          </div>
          <div>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "#111827",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Análise Técnica Integrada
            </h2>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>
              Diagnóstico consolidado · Comparação territorial · Encaminhamento institucional
            </p>
          </div>
        </div>

        <div
          style={{ padding: "20px 24px 22px", display: "flex", flexDirection: "column", gap: "0" }}
        >
          {/* Callouts no topo */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <Callout
              icon={<TrendingUp style={{ width: "14px", height: "14px" }} />}
              label="Principal Vantagem"
              value={vantagem}
              color="#6b7280"
              bg="#f9fafb"
              border="rgba(0,0,0,0.08)"
            />
            <Callout
              icon={<AlertTriangle style={{ width: "14px", height: "14px" }} />}
              label="Principal Fragilidade"
              value={fragilidade}
              color="#6b7280"
              bg="#f9fafb"
              border="rgba(0,0,0,0.08)"
            />
            <Callout
              icon={<Target style={{ width: "14px", height: "14px" }} />}
              label="Recomendação"
              value={recomendacao}
              color="#6d28d9"
              bg="rgba(109,40,217,0.04)"
              border="rgba(109,40,217,0.15)"
            />
          </div>

          {/* Texto da análise */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* §1 — Diagnóstico geral */}
            <AnalysisParagraph title="Diagnóstico Geral">
              O município de <strong>{m.municipio}</strong> registra risco de feminicídio
              classificado como <strong>{m.risco_feminicidio_nivel.toLowerCase()}</strong>, com
              score de <strong>{m.risco_feminicidio_score.toFixed(1)} pontos</strong>. O painel de
              alerta da rede encontra-se no nível <strong>{m.painel_alerta_rede}</strong>.
              Institucionalmente, o território apresenta <strong>{redeLabel}</strong>:{" "}
              {m.opm_possui === "SIM" ? "a OPM está instalada" : "não possui OPM"} e{" "}
              {m.creas_possui === "SIM" ? "o CREAS está em operação" : "o CREAS está ausente"}.{" "}
              {m.necessita_atuacao_prioritaria === "SIM"
                ? "O sistema classifica este município como de atuação prioritária, sinalizando agravantes territoriais que demandam resposta institucional focada."
                : "O sistema não identifica necessidade de atuação emergencial neste momento, mas recomenda monitoramento contínuo."}
            </AnalysisParagraph>

            {/* §2 — Comparação territorial */}
            <AnalysisParagraph title="Comparação Territorial">
              Em relação ao polo regional <strong>{m.polo_regional}</strong>, o município ocupa a{" "}
              <strong>{poloRank}ª posição</strong> em criticidade entre os {poloTotal} municípios
              integrantes, com score <strong>{acimaPolo ? "acima" : "abaixo"} da média polo</strong>
              . No contexto estadual, ocupa a <strong>{stateRank}ª posição</strong> entre{" "}
              {totalMunicipios} municípios, com intensidade de violência{" "}
              <strong>{acimaEstado ? "acima" : "abaixo"} da média estadual</strong> normalizada. A
              cobertura de OPM no polo regional situa-se em{" "}
              <strong>{radarPolo.cobertura_opm.toFixed(0)}%</strong> e a de CREAS em{" "}
              <strong>{radarPolo.cobertura_creas.toFixed(0)}%</strong> — o município{" "}
              {radarM.cobertura_opm >= radarPolo.cobertura_opm
                ? "está alinhado ou supera"
                : "está abaixo de"}{" "}
              a cobertura de OPM do polo.
            </AnalysisParagraph>

            {/* §3 — Histórico e implicação */}
            <AnalysisParagraph title="Histórico e Implicação (2023–2026)">
              O período monitorado registra{" "}
              <strong>{m.feminicidios_consumados_2023_2025} feminicídios consumados</strong> e{" "}
              <strong>{m.feminicidios_tentados_2023_2025} tentativas</strong> (2023–2025),
              totalizando <strong>{totalRegistros} ocorrências</strong> na janela oficial de
              análise.
              {crescimento2526 > 0
                ? ` A comparação entre 2024 e 2025 aponta elevação de ${crescimento2526} registro(s), sinalizando pressão crescente sobre a rede de proteção.`
                : crescimento2526 < 0
                  ? ` Há redução de ${Math.abs(crescimento2526)} registro(s) entre 2024 e 2025, o que pode indicar estabilização, mas não elimina a necessidade de vigilância ativa.`
                  : " Os registros de 2024 e 2025 se mantiveram estáveis, sem variação expressiva na intensidade dos eventos."}{" "}
              O dado de 2026 é parcial e deve ser interpretado com cautela no contexto comparativo.
            </AnalysisParagraph>

            {/* §4 — Encaminhamento */}
            <AnalysisParagraph title="Encaminhamento Técnico">
              {m.necessita_atuacao_prioritaria === "SIM"
                ? `Recomenda-se atuação institucional prioritária em ${m.municipio}, com ênfase no fortalecimento da rede de atendimento especializado${!m.creas_possui || m.creas_possui === "NAO" ? ", notadamente na implantação ou estruturação do CREAS" : ""}. A coordenadoria regional e os órgãos de supervisão devem ser acionados para pactuação de plano de intervenção com prazo definido.`
                : m.painel_alerta_rede === "ATENCAO"
                  ? `O monitoramento deve ser intensificado, com revisão trimestral dos indicadores. ${!redeCompleta ? "A complementação da rede institucional deve ser considerada como prioridade de médio prazo." : "A rede instalada deve ser avaliada em termos de capacidade operacional e efetividade do fluxo de atendimento."}`
                  : `Recomenda-se a manutenção do monitoramento regular, com atualização dos indicadores no próximo ciclo de referência. ${redeCompleta ? "A rede institucional completa deve ser preservada e fortalecida em sua capacidade técnica." : "A complementação da cobertura institucional permanece como diretriz de médio prazo."}`}
            </AnalysisParagraph>
          </div>
        </div>
      </div>
    </section>
  );
}

function Callout({
  icon,
  label,
  value,
  color,
  bg,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: "10px",
        padding: "12px 14px",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px", color }}
      >
        {icon}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          fontSize: "13.5px",
          color: "#374151",
          lineHeight: 1.4,
          margin: 0,
          fontWeight: 500,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function AnalysisParagraph({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingLeft: "0" }}>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#6b7280",
          display: "inline-block",
          marginBottom: "4px",
        }}
      >
        {title}
      </span>
      <p style={{ fontSize: "15px", color: "#1f2937", lineHeight: 1.65, margin: 0 }}>{children}</p>
    </div>
  );
}

// ─── 5. Rede de Proteção ──────────────────────────────────────────────────────

function MunicipioNetworkSection({ m }: { m: Municipio }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <Shield style={{ width: "16px", height: "16px", color: "#7c3aed" }} />
        <h2
          style={{
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#9ca3af",
            margin: 0,
          }}
        >
          Estrutura Local da Rede de Proteção
        </h2>
        <div style={{ flex: 1, height: "1px", background: "hsl(var(--border) / 0.4)" }} />
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>
          Evidência de Apoio ao Diagnóstico
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* OPM */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-md">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">OPM</CardTitle>
                <span className="text-xs text-muted-foreground">
                  Organismo de Políticas para Mulheres
                </span>
              </div>
            </div>
            <YesNoBadge value={m.opm_possui} />
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <Row k="Tipologia" v={m.opm_orgaotipo || "—"} />
            <Row k="Estrutura ativa" v={<YesNoBadge value={m.opm_possui_estrutura_ativa} />} />
            <Row k="Políticas Públicas" v={m.opm_status_politicas_publicas || "—"} />
            <Row
              k="Prioridade Fomento"
              v={<span className="font-medium">{m.prioridade_fomento_opm || "—"}</span>}
            />
          </CardContent>
        </Card>

        {/* CREAS */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-md">
                <HeartHandshake className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">CREAS</CardTitle>
                <span className="text-xs text-muted-foreground">
                  Centro de Referência Especializado
                </span>
              </div>
            </div>
            <YesNoBadge value={m.creas_possui} />
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <Row k="Status Atual" v={m.creas_status || "—"} />
            <Row
              k="Critério Ausência"
              v={
                m.creas_ausente === "SIM" ? (
                  <span className="text-destructive font-medium text-sm">Ausente / Elegível</span>
                ) : (
                  "—"
                )
              }
            />
            <Row
              k="Prioridade Implantação"
              v={<span className="font-medium">{m.prioridade_implantacao_creas || "—"}</span>}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// ─── 6. Metadados e Fontes ────────────────────────────────────────────────────

function MunicipioMetadataFooter({ m }: { m: Municipio }) {
  return (
    <footer
      style={{
        background: "#f9fafb",
        border: "1px solid hsl(var(--border) / 0.5)",
        borderRadius: "12px",
        padding: "14px 20px",
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 24px",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9ca3af" }}>
        <FileText style={{ width: "14px", height: "14px" }} />
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Metadados
        </span>
      </div>
      <MetaItem label="Fontes" value="SSP-PI · MDS · IBGE" />
      <span style={{ color: "#e5e7eb" }}>·</span>
      <MetaItem label="Metodologia Score" value="v1.2 — Risco Feminicídio" />
      <span style={{ color: "#e5e7eb" }}>·</span>
      <MetaItem label="Recorte Temporal" value="2023–2026 (jan. oficial + parcial corrente)" />
      <span style={{ color: "#e5e7eb" }}>·</span>
      <MetaItem label="Última Referência" value={formatDateStr(m.ultima_atualizacao_referencia)} />
    </footer>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ fontSize: "12.5px", color: "#9ca3af" }}>
      <span style={{ fontWeight: 600, color: "#6b7280" }}>{label}: </span>
      {value}
    </span>
  );
}
