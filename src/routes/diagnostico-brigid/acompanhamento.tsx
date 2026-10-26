import React, { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { municipiosQueryOptions } from "@/lib/data-fetching";
import {
  diagnosticoService,
  STATUS_DIAGNOSTICO,
  type DiagnosticoResumo,
} from "@/services/diagnostico-service";
import { useApp } from "@/context/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { ArrowUpDown, ArrowLeft } from "lucide-react";
import * as d3Geo from "d3-geo";
import piauiMapFixed from "@/data/piaui-map-fixed.json";

export const Route = createFileRoute("/diagnostico-brigid/acompanhamento")({
  component: AcompanhamentoPage,
});

interface GeoFeature {
  type: string;
  properties: {
    id: string; // IBGE code
    name: string; // Municipality name
    description?: string;
  };
  geometry: any;
}

interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

const cobreCivel = (a: string[]) => a.some((v) => ["civel", "cumulativa", "unica"].includes(v));
const cobreCriminal = (a: string[]) =>
  a.some((v) => ["criminal", "cumulativa", "unica"].includes(v));

type SituacaoMunicipal = "completo" | "parcial" | "andamento" | "nao_iniciado";

const SITUACAO: Record<
  SituacaoMunicipal,
  { label: string; cor: string; badge: string; rank: number }
> = {
  completo: {
    label: "Cível e criminal publicados",
    cor: "#10b981",
    badge: "bg-emerald-500 text-white",
    rank: 3,
  },
  parcial: {
    label: "Cobertura parcial publicada",
    cor: "#6ee7b7",
    badge: "bg-emerald-100 text-emerald-800",
    rank: 2,
  },
  andamento: {
    label: "Em andamento (não publicado)",
    cor: "#fde68a",
    badge: "bg-amber-100 text-amber-800",
    rank: 1,
  },
  nao_iniciado: {
    label: "Não iniciado",
    cor: "#f3f4f6",
    badge: "text-gray-400 font-normal",
    rank: 0,
  },
};

interface CoberturaMunicipio {
  situacao: SituacaoMunicipal;
  civel?: DiagnosticoResumo;
  criminal?: DiagnosticoResumo;
  civelPublicado: boolean;
  criminalPublicado: boolean;
  promotorias: string[];
}

// Cobertura municipal: o município só é considerado totalmente diagnosticado quando os
// blocos cíveis e criminais têm versão publicada (mesmo que por Promotorias diferentes).
function calcularCobertura(diags: DiagnosticoResumo[]): Record<string, CoberturaMunicipio> {
  const porIbge: Record<string, CoberturaMunicipio> = {};
  for (const d of diags) {
    const c = (porIbge[d.codigo_ibge] ??= {
      situacao: "andamento",
      civelPublicado: false,
      criminalPublicado: false,
      promotorias: [],
    });
    if (!c.promotorias.includes(d.promotoria_nome)) c.promotorias.push(d.promotoria_nome);
    const publicado = d.versao_publicada !== null;
    if (cobreCivel(d.atribuicao)) {
      if (!c.civel || publicado) c.civel = d;
      c.civelPublicado ||= publicado;
    }
    if (cobreCriminal(d.atribuicao)) {
      if (!c.criminal || publicado) c.criminal = d;
      c.criminalPublicado ||= publicado;
    }
  }
  for (const c of Object.values(porIbge)) {
    c.situacao =
      c.civelPublicado && c.criminalPublicado
        ? "completo"
        : c.civelPublicado || c.criminalPublicado
          ? "parcial"
          : "andamento";
  }
  return porIbge;
}

function AcompanhamentoPage() {
  const { userRole } = useApp();
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoResumo[]>([]);
  const [periodo, setPeriodo] = useState("2026");
  const [geoData, setGeoData] = useState<GeoJsonCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredMuni, setHoveredMuni] = useState<{
    name: string;
    status: string;
    pj?: string;
    x: number;
    y: number;
  } | null>(null);

  type SortField = "ibge" | "municipio" | "comarca" | "status" | "preenchimento" | "promotoria";
  type SortOrder = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("municipio");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const { data: municipios, isLoading: loadingMunis } = useQuery(municipiosQueryOptions);

  const comarcaByIbge = useMemo(() => {
    const map: Record<string, string> = {};
    if (municipios) {
      municipios.forEach((m) => {
        map[m.codigo_ibge] = m.comarca;
      });
    }
    return map;
  }, [municipios]);

  useEffect(() => {
    async function loadData() {
      try {
        const diags = await diagnosticoService.listar();
        setDiagnosticos(diags);
        setGeoData(piauiMapFixed as any);
      } catch (e) {
        console.error("Error loading acompanhamento data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const periodos = useMemo(
    () => [...new Set(["2026", ...diagnosticos.map((d) => d.periodo_referencia)])].sort().reverse(),
    [diagnosticos],
  );

  const stats = useMemo(() => {
    const vazio = { completo: 0, parcial: 0, andamento: 0, nao_iniciado: 0 };
    if (!geoData)
      return {
        total: 0,
        contagem: vazio,
        chartData: [],
        byIbge: {} as Record<string, CoberturaMunicipio>,
      };
    const byIbge = calcularCobertura(diagnosticos.filter((d) => d.periodo_referencia === periodo));
    const contagem = { ...vazio };
    for (const f of geoData.features)
      contagem[byIbge[f.properties.id]?.situacao ?? "nao_iniciado"]++;
    const total = geoData.features.length;
    const chartData = (Object.keys(SITUACAO) as SituacaoMunicipal[]).map((k) => ({
      name: SITUACAO[k].label,
      value: contagem[k],
      color: SITUACAO[k].cor === "#f3f4f6" ? "#e5e7eb" : SITUACAO[k].cor,
    }));
    return { total, contagem, chartData, byIbge };
  }, [diagnosticos, geoData, periodo]);

  const { paths, viewBox } = useMemo(() => {
    if (!geoData) return { paths: [], viewBox: "0 0 800 800" };

    // Calcula a projeção base e extrai os bounding boxes precisos
    const projection = d3Geo.geoMercator().fitSize([800, 800], geoData as any);
    const pathGenerator = d3Geo.geoPath().projection(projection);

    const paths = geoData.features.map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      d: pathGenerator(f as any) || "",
    }));

    const [[x0, y0], [x1, y1]] = pathGenerator.bounds(geoData as any);

    return {
      paths,
      viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}`,
    };
  }, [geoData]);

  const situacaoDe = (ibge: string): SituacaoMunicipal =>
    stats.byIbge[ibge]?.situacao ?? "nao_iniciado";

  const sortedFeatures = useMemo(() => {
    if (!geoData) return [];
    return [...geoData.features].sort((a, b) => {
      const ibgeA = a.properties.id;
      const ibgeB = b.properties.id;
      const dA = stats.byIbge[ibgeA];
      const dB = stats.byIbge[ibgeB];

      let valA: any = "";
      let valB: any = "";

      switch (sortField) {
        case "ibge":
          valA = ibgeA;
          valB = ibgeB;
          break;
        case "municipio":
          valA = a.properties.name;
          valB = b.properties.name;
          break;
        case "comarca":
          valA = comarcaByIbge[ibgeA] || "";
          valB = comarcaByIbge[ibgeB] || "";
          break;
        case "preenchimento":
          valA = Math.max(
            dA?.civel?.percentual_preenchimento ?? 0,
            dA?.criminal?.percentual_preenchimento ?? 0,
          );
          valB = Math.max(
            dB?.civel?.percentual_preenchimento ?? 0,
            dB?.criminal?.percentual_preenchimento ?? 0,
          );
          break;
        case "promotoria":
          valA = dA?.promotorias.join(", ") || "";
          valB = dB?.promotorias.join(", ") || "";
          break;
        case "status":
          valA = SITUACAO[situacaoDe(ibgeA)].rank;
          valB = SITUACAO[situacaoDe(ibgeB)].rank;
          break;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [geoData, stats, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (loading || loadingMunis)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando painel de acompanhamento...
      </div>
    );
  if (!geoData)
    return (
      <div className="p-8 text-center text-destructive">
        Erro ao carregar os dados do mapa do Piauí.
      </div>
    );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/diagnostico-brigid">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Painel de Acompanhamento
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground mt-1">
            Cobertura do Diagnóstico BRIGID nos municípios do Piauí. Um município só aparece como
            totalmente diagnosticado quando os blocos cíveis e criminais têm versão publicada.
            {userRole !== "admin" && " Visão limitada às Promotorias vinculadas ao seu usuário."}
          </p>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p} value={p}>
                  Período {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Municípios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        {(Object.keys(SITUACAO) as SituacaoMunicipal[]).map((k) => (
          <Card key={k}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {SITUACAO[k].label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contagem[k]}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total ? ((stats.contagem[k] / stats.total) * 100).toFixed(1) : "0"}% do total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Progresso Estadual</CardTitle>
            <CardDescription>Situação da cobertura municipal no período {periodo}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center min-h-[400px]">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={stats.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number) => [`${value} municípios`, "Quantidade"]}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="relative overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle>Mapa de Preenchimento</CardTitle>
            <CardDescription>Piauí ({stats.total} municípios)</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex justify-center items-center overflow-hidden relative">
            {paths.length > 0 && (
              <svg
                viewBox={viewBox}
                className="w-full h-full max-h-[450px]"
                preserveAspectRatio="xMidYMid meet"
              >
                <g>
                  {paths.map((p) => {
                    const ibge = p.id;
                    const name = p.name;
                    const d = stats.byIbge[ibge];
                    const fillColor = SITUACAO[situacaoDe(ibge)].cor;

                    return (
                      <path
                        key={ibge}
                        d={p.d}
                        fill={fillColor}
                        stroke="#9ca3af"
                        strokeWidth={0.5}
                        className="transition-colors duration-200 hover:opacity-80 hover:stroke-black hover:stroke-[1.5px] cursor-pointer"
                        onMouseEnter={(e) => {
                          setHoveredMuni({
                            name,
                            status: SITUACAO[situacaoDe(ibge)].label,
                            pj: d?.promotorias.join(", ").replace(/Promotoria de Justiça/gi, "PJ"),
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                        onMouseLeave={() => setHoveredMuni(null)}
                      />
                    );
                  })}
                </g>
              </svg>
            )}

            {/* Custom Map Tooltip */}
            {hoveredMuni && (
              <div
                className="fixed bg-popover text-popover-foreground border shadow-md px-3 py-2 rounded text-sm pointer-events-none z-50 transition-opacity flex flex-col gap-1"
                style={{
                  left: hoveredMuni.x + 15,
                  top: hoveredMuni.y + 15,
                }}
              >
                <div className="font-semibold">{hoveredMuni.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {hoveredMuni.status}
                  </Badge>
                </div>
                {hoveredMuni.pj && (
                  <div className="text-[11px] text-muted-foreground mt-0.5 border-t pt-1">
                    {hoveredMuni.pj}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Município</CardTitle>
          <CardDescription>
            Situação por município e por bloco (cível / criminal) no período {periodo}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[500px] overflow-y-auto relative">
            <Table>
              <TableHeader className="sticky top-0 bg-primary [&_th]:text-primary-foreground hover:bg-primary z-10 shadow-sm border-b">
                <TableRow>
                  <TableHead
                    className="w-[100px] text-primary-foreground cursor-pointer select-none"
                    onClick={() => handleSort("ibge")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      IBGE <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="min-w-[200px] text-primary-foreground cursor-pointer select-none"
                    onClick={() => handleSort("municipio")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Município <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="min-w-[150px] text-primary-foreground cursor-pointer select-none"
                    onClick={() => handleSort("comarca")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Comarca <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-primary-foreground cursor-pointer select-none text-center"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Cobertura municipal <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-center min-w-[170px] text-primary-foreground cursor-pointer select-none"
                    onClick={() => handleSort("preenchimento")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Bloco cível <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </TableHead>
                  <TableHead className="text-center min-w-[170px] text-primary-foreground">
                    Bloco criminal
                  </TableHead>
                  <TableHead
                    className="min-w-[250px] text-primary-foreground cursor-pointer select-none"
                    onClick={() => handleSort("promotoria")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Promotorias respondentes <ArrowUpDown className="h-3 w-3 opacity-50" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_td]:py-2">
                {sortedFeatures.map((feature) => {
                  const ibge = feature.properties.id;
                  const d = stats.byIbge[ibge];
                  const comarca = comarcaByIbge[ibge];

                  return (
                    <TableRow key={ibge} className="text-center">
                      <TableCell className="font-medium text-xs text-muted-foreground">
                        {ibge}
                      </TableCell>
                      <TableCell className="font-medium text-left">
                        {feature.properties.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {comarca || <span className="text-gray-300 italic">-</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={SITUACAO[situacaoDe(ibge)].badge}>
                          {SITUACAO[situacaoDe(ibge)].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <SituacaoBloco d={d?.civel} publicado={d?.civelPublicado} />
                      </TableCell>
                      <TableCell className="text-xs">
                        <SituacaoBloco d={d?.criminal} publicado={d?.criminalPublicado} />
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground truncate max-w-[300px]"
                        title={d?.promotorias.join(", ")}
                      >
                        {d?.promotorias.join(", ") || (
                          <span className="text-gray-300 italic">Sem diagnóstico</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SituacaoBloco({ d, publicado }: { d?: DiagnosticoResumo; publicado?: boolean }) {
  if (!d) return <span className="text-gray-300 italic">Não iniciado</span>;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span>
        {STATUS_DIAGNOSTICO[d.status].label} · {d.percentual_preenchimento}%
      </span>
      <span className="text-[10px] text-muted-foreground">
        {publicado ? `Publicado (v${d.versao_publicada ?? "anterior"})` : "Não publicado"}
      </span>
    </div>
  );
}
