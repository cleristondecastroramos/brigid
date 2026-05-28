import { useEffect, useMemo, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { geoMercator, geoPath } from "d3-geo";
import { geoQueryOptions, municipiosQueryOptions } from "@/lib/csv-data";
import type { Municipio } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ColorFn = (m: Municipio | undefined) => string;

export function normName(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

interface Props {
  colorFn: ColorFn;
  selectedSlug?: string | null;
  highlightSlugs?: Set<string>;
  dimNonHighlighted?: boolean;
  onSelect?: (m: Municipio | undefined, name: string) => void;
  height?: number;
}

export function TerritorialMap({
  colorFn,
  selectedSlug,
  highlightSlugs,
  dimNonHighlighted,
  onSelect,
  height = 620,
}: Props) {
  const { data: geo } = useSuspenseQuery(geoQueryOptions);
  const { data: municipios } = useSuspenseQuery(municipiosQueryOptions);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<{ name: string; m?: Municipio; x: number; y: number } | null>(null);

  const [zoom, setZoom] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const bySlug = useMemo(() => {
    const map = new Map<string, Municipio>();
    municipios.forEach((m) => {
      map.set(m.codigo_ibge, m);
      map.set(m.municipio_slug, m);
      map.set(normName(m.municipio), m);
    });
    return map;
  }, [municipios]);

  const width = 900;
  const { paths } = useMemo(() => {
    const projection = geoMercator().fitSize([width, height], geo as any);
    const path = geoPath(projection);
    const paths = geo.features.map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      d: path(f as any) ?? "",
    }));
    return { paths };
  }, [geo, height]);

  // wheel zoom on the SVG
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setZoom((z) => Math.min(8, Math.max(1, z * (1 + delta))));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setTx(dragRef.current.tx + (e.clientX - dragRef.current.x));
    setTy(dragRef.current.ty + (e.clientY - dragRef.current.y));
  };
  const stopDrag = () => { dragRef.current = null; };

  const reset = () => { setZoom(1); setTx(0); setTy(0); };

  return (
    <div className="relative w-full select-none">
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1 rounded-md border border-border bg-card/95 p-1 shadow-sm backdrop-blur">
        <button
          aria-label="Aproximar"
          onClick={() => setZoom((z) => Math.min(8, z * 1.3))}
          className="flex h-7 w-7 items-center justify-center rounded text-sm text-foreground hover:bg-accent"
        >+</button>
        <button
          aria-label="Afastar"
          onClick={() => setZoom((z) => Math.max(1, z / 1.3))}
          className="flex h-7 w-7 items-center justify-center rounded text-sm text-foreground hover:bg-accent"
        >−</button>
        <button
          aria-label="Resetar"
          onClick={reset}
          className="flex h-7 w-7 items-center justify-center rounded text-[10px] text-muted-foreground hover:bg-accent"
        >⌂</button>
      </div>

      <div className="relative rounded-lg border border-border bg-card overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className={cn("h-auto w-full", dragRef.current ? "cursor-grabbing" : "cursor-grab")}
          role="img"
          aria-label="Mapa interativo do Piauí"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={() => { stopDrag(); setHover(null); }}
        >
          <g transform={`translate(${tx} ${ty}) scale(${zoom})`}>
            {paths.map((p) => {
              const m = bySlug.get(p.id) || bySlug.get(normName(p.name));
              const slug = m?.municipio_slug ?? normName(p.name);
              const fill = colorFn(m);
              const isSelected = selectedSlug && slug === selectedSlug;
              const isHighlighted = !highlightSlugs || highlightSlugs.has(slug);
              const opacity = dimNonHighlighted && !isHighlighted ? 0.18 : 1;
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill={fill}
                  fillOpacity={opacity}
                  stroke={isSelected ? "oklch(0.25 0.05 250)" : "oklch(1 0 0 / 0.5)"}
                  strokeWidth={isSelected ? 1.8 / zoom : 0.4 / zoom}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(m, p.name);
                  }}
                  onMouseMove={(e) => {
                    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({
                      name: p.name,
                      m,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}
          </g>
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md"
            style={{ left: Math.min(hover.x + 14, 720), top: Math.min(hover.y + 14, height - 80) }}
          >
            <p className="font-semibold text-foreground">{hover.name}</p>
            {hover.m && (
              <div className="mt-1 space-y-0.5 text-muted-foreground">
                <p>Comarca: <span className="text-foreground">{hover.m.comarca || "—"}</span></p>
                <p>Polo: <span className="text-foreground">{hover.m.polo_regional || "—"}</span></p>
                <p>Risco: <span className="text-foreground">{hover.m.risco_feminicidio_nivel}</span> · score {hover.m.risco_feminicidio_score}</p>
                <p className="text-[10px]">Clique para detalhar</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
