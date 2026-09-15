import React, { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { municipiosQueryOptions } from "@/lib/data-fetching";
import { diagnosticoService, DiagnosticoFormModel } from "@/services/diagnostico-service";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
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

function AcompanhamentoPage() {
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoFormModel[]>([]);
  const [geoData, setGeoData] = useState<GeoJsonCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredMuni, setHoveredMuni] = useState<{name: string, status: string, pct?: number, pj?: string, x: number, y: number} | null>(null);

  type SortField = 'ibge' | 'municipio' | 'comarca' | 'status' | 'preenchimento' | 'promotoria';
  type SortOrder = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('municipio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const { data: municipios, isLoading: loadingMunis } = useQuery(municipiosQueryOptions);

  const comarcaByIbge = useMemo(() => {
    const map: Record<string, string> = {};
    if (municipios) {
      municipios.forEach(m => {
        map[m.codigo_ibge] = m.comarca;
      });
    }
    return map;
  }, [municipios]);

  useEffect(() => {
    async function loadData() {
      try {
        const diags = await diagnosticoService.getMyDiagnosticos();
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

  // Compute stats
  const stats = useMemo(() => {
    if (!geoData) return { total: 0, concluido: 0, rascunho: 0, naoIniciado: 0, chartData: [], byIbge: {} };
    
    // Group diagnostics by IBGE code (taking the most recent one if multiple)
    const byIbge: Record<string, DiagnosticoFormModel> = {};
    diagnosticos.forEach(d => {
      // Priority: concluido > validacao > rascunho > devolvido
      const existing = byIbge[d.codigo_ibge];
      if (!existing) {
        byIbge[d.codigo_ibge] = d;
      } else {
        if (d.status === 'concluido' || d.status === 'validacao') byIbge[d.codigo_ibge] = d;
      }
    });

    let concluido = 0;
    let rascunho = 0;
    
    Object.values(byIbge).forEach(d => {
      if (d.status === 'concluido' || d.status === 'validacao') concluido++;
      else rascunho++;
    });

    const total = geoData.features.length; // usually 224 for Piauí
    const naoIniciado = total - concluido - rascunho;

    const chartData = [
      { name: 'Concluído', value: concluido, color: '#10b981' }, // emerald-500
      { name: 'Em Rascunho', value: rascunho, color: '#f59e0b' }, // amber-500
      { name: 'Não Iniciado', value: naoIniciado, color: '#e5e7eb' }, // gray-200
    ];

    return { total, concluido, rascunho, naoIniciado, chartData, byIbge };
  }, [diagnosticos, geoData]);

  const { paths, viewBox } = useMemo(() => {
    if (!geoData) return { paths: [], viewBox: "0 0 800 800" };
    
    // Calcula a projeção base e extrai os bounding boxes precisos
    const projection = d3Geo.geoMercator().fitSize([800, 800], geoData as any);
    const pathGenerator = d3Geo.geoPath().projection(projection);
    
    const paths = geoData.features.map(f => ({
      id: f.properties.id,
      name: f.properties.name,
      d: pathGenerator(f as any) || ""
    }));

    const [[x0, y0], [x1, y1]] = pathGenerator.bounds(geoData as any);
    
    return { 
      paths,
      viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}` 
    };
  }, [geoData]);

  const getStatusColor = (status: string | undefined) => {
    if (status === 'concluido' || status === 'validacao') return '#10b981'; // emerald-500
    if (status === 'rascunho' || status === 'devolvido') return '#fde68a'; // amber-200 (brighter for map visibility)
    return '#f3f4f6'; // gray-100 (nao iniciado)
  };

  const getStatusLabel = (status: string | undefined) => {
    if (status === 'concluido') return 'Concluído';
    if (status === 'validacao') return 'Em Validação';
    if (status === 'rascunho') return 'Rascunho';
    if (status === 'devolvido') return 'Devolvido';
    return 'Não Iniciado';
  };

  const sortedFeatures = useMemo(() => {
    if (!geoData) return [];
    return [...geoData.features].sort((a, b) => {
      const ibgeA = a.properties.id;
      const ibgeB = b.properties.id;
      const dA = stats.byIbge[ibgeA];
      const dB = stats.byIbge[ibgeB];
      
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'ibge': 
          valA = ibgeA; valB = ibgeB; break;
        case 'municipio': 
          valA = a.properties.name; valB = b.properties.name; break;
        case 'comarca': 
          valA = comarcaByIbge[ibgeA] || ''; valB = comarcaByIbge[ibgeB] || ''; break;
        case 'preenchimento': 
          valA = dA?.percentual_preenchimento || 0; valB = dB?.percentual_preenchimento || 0; break;
        case 'promotoria': 
          valA = dA?.promotoria_nome || ''; valB = dB?.promotoria_nome || ''; break;
        case 'status': {
          const rank = { 'concluido': 4, 'validacao': 3, 'rascunho': 2, 'devolvido': 1, 'nao_iniciado': 0 };
          valA = rank[(dA?.status || 'nao_iniciado') as keyof typeof rank];
          valB = rank[(dB?.status || 'nao_iniciado') as keyof typeof rank];
          break;
        }
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [geoData, stats, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading || loadingMunis) return <div className="p-8 text-center text-muted-foreground">Carregando painel de acompanhamento...</div>;
  if (!geoData) return <div className="p-8 text-center text-destructive">Erro ao carregar os dados do mapa do Piauí.</div>;

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
        <p className="text-muted-foreground mt-1">
          Visão geral do preenchimento do Diagnóstico BRIGID nos municípios do Piauí.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Municípios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.concluido}</div>
            <p className="text-xs text-muted-foreground">{((stats.concluido/stats.total)*100).toFixed(1)}% do total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Rascunho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.rascunho}</div>
            <p className="text-xs text-muted-foreground">{((stats.rascunho/stats.total)*100).toFixed(1)}% do total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Não Iniciados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.naoIniciado}</div>
            <p className="text-xs text-muted-foreground">{((stats.naoIniciado/stats.total)*100).toFixed(1)}% do total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Progresso Estadual</CardTitle>
            <CardDescription>Distribuição dos status de preenchimento</CardDescription>
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
                <RechartsTooltip formatter={(value: number) => [`${value} municípios`, 'Quantidade']} />
                <Legend verticalAlign="bottom" height={36}/>
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
                    const status = d?.status;
                    const fillColor = getStatusColor(status);

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
                            status: getStatusLabel(status),
                            pct: d?.percentual_preenchimento,
                            pj: d?.promotoria_nome?.replace(/Promotoria de Justiça/gi, "PJ"),
                            x: e.clientX,
                            y: e.clientY
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
                  top: hoveredMuni.y + 15
                }}
              >
                <div className="font-semibold">{hoveredMuni.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{hoveredMuni.status}</Badge>
                  {hoveredMuni.pct !== undefined && <span className="font-medium text-foreground">{hoveredMuni.pct}%</span>}
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
          <CardDescription>Lista completa de municípios e status do diagnóstico</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[500px] overflow-y-auto relative">
            <Table>
              <TableHeader className="sticky top-0 bg-primary [&_th]:text-primary-foreground hover:bg-primary z-10 shadow-sm border-b">
                <TableRow>
                  <TableHead className="w-[100px] text-primary-foreground cursor-pointer select-none" onClick={() => handleSort('ibge')}>
                    <div className="flex items-center justify-center gap-1">IBGE <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                  </TableHead>
                  <TableHead className="min-w-[200px] text-primary-foreground cursor-pointer select-none" onClick={() => handleSort('municipio')}>
                    <div className="flex items-center justify-center gap-1">Município <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                  </TableHead>
                  <TableHead className="min-w-[150px] text-primary-foreground cursor-pointer select-none" onClick={() => handleSort('comarca')}>
                    <div className="flex items-center justify-center gap-1">Comarca <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                  </TableHead>
                  <TableHead className="text-primary-foreground cursor-pointer select-none text-center" onClick={() => handleSort('status')}>
                    <div className="flex items-center justify-center gap-1">Status <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                  </TableHead>
                  <TableHead className="text-center w-[150px] text-primary-foreground cursor-pointer select-none" onClick={() => handleSort('preenchimento')}>
                    <div className="flex items-center justify-center gap-1">Preenchimento <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                  </TableHead>
                  <TableHead className="min-w-[250px] text-primary-foreground cursor-pointer select-none" onClick={() => handleSort('promotoria')}>
                    <div className="flex items-center justify-center gap-1">Responsável (Promotoria) <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_td]:py-2">
                {sortedFeatures.map(feature => {
                    const ibge = feature.properties.id;
                    const d = stats.byIbge[ibge];
                    const comarca = comarcaByIbge[ibge];
                    
                    return (
                      <TableRow key={ibge} className="text-center">
                        <TableCell className="font-medium text-xs text-muted-foreground">{ibge}</TableCell>
                        <TableCell className="font-medium text-left">{feature.properties.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{comarca || <span className="text-gray-300 italic">-</span>}</TableCell>
                        <TableCell>
                          <Badge variant={
                            d?.status === 'concluido' || d?.status === 'validacao' ? 'default' :
                            d?.status === 'rascunho' ? 'secondary' : 'outline'
                          } className={
                            d?.status === 'concluido' || d?.status === 'validacao' ? 'bg-emerald-500 hover:bg-emerald-600' :
                            d?.status === 'rascunho' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200' : 'text-gray-400 font-normal'
                          }>
                            {getStatusLabel(d?.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {d && d.percentual_preenchimento !== undefined ? `${d.percentual_preenchimento}%` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]" title={d?.promotoria_nome}>
                          {d?.promotoria_nome || <span className="text-gray-300 italic">Não vinculado</span>}
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
