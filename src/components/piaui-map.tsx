import { useEffect, useMemo, useRef, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { geoMercator, geoPath } from "d3-geo";
import { Link } from "@tanstack/react-router";
import { geoQueryOptions } from "@/lib/data-fetching";
import { useMunicipios } from "@/lib/useMunicipios";
import type { Municipio } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Lock, Unlock, ZoomIn, ZoomOut } from "lucide-react";

export type ColorFn = (m: Municipio | undefined) => string;

interface PiauiMapProps {
  colorFn: ColorFn;
  height?: number;
  legend?: Array<{ label: string; color: string }>;
  title?: string;
}

export function PiauiMap({ colorFn, height = 520, legend, title }: PiauiMapProps) {
  const { data: geo } = useSuspenseQuery(geoQueryOptions);
  const { data: municipios } = useMunicipios();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<{ name: string; m?: Municipio; x: number; y: number } | null>(
    null,
  );

  // Estados de Controle de Zoom e Pan
  const [zoom, setZoom] = useState(1);
  const [zoomLocked, setZoomLocked] = useState(true);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const bySlug = useMemo(() => {
    const map = new Map<string, Municipio>();
    municipios.forEach((m) => {
      map.set(m.codigo_ibge, m);
      map.set(m.municipio_slug, m);
      map.set(norm(m.municipio), m);
    });
    return map;
  }, [municipios]);

  const { paths, viewBox, originalBounds } = useMemo(() => {
    const projection = geoMercator().fitSize([800, 800], geo as any);
    const path = geoPath(projection);
    const paths = geo.features.map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      d: path(f as any) ?? "",
    }));
    const [[x0, y0], [x1, y1]] = path.bounds(geo as any);
    return {
      paths,
      viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}`,
      originalBounds: { x0, y0, w: x1 - x0, h: y1 - y0 },
    };
  }, [geo]);

  // Efeito de Zoom via roda do Mouse (Scroll)
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (zoomLocked) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setZoom((z) => Math.min(8, Math.max(1, z * (1 + delta))));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoomLocked]);

  // Handlers para arrastar o mapa (Pan)
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setTx(dragRef.current.tx + (e.clientX - dragRef.current.x));
    setTy(dragRef.current.ty + (e.clientY - dragRef.current.y));
  };

  const stopDrag = () => {
    dragRef.current = null;
  };

  return (
    <div className="relative w-full select-none">
      {title && <p className="mb-2 text-sm font-medium text-foreground">{title}</p>}

      {/* Controles de Zoom e Legenda no Canto Superior Esquerdo */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        {/* Controle do Zoom Horizontal */}
        <div className="flex flex-row gap-1 rounded-md border border-border bg-card/95 p-1 shadow-sm backdrop-blur w-fit">
          <button
            aria-label="Afastar"
            onClick={() => !zoomLocked && setZoom((z) => Math.max(1, z / 1.3))}
            className="flex h-7 w-7 items-center justify-center rounded text-sm text-foreground hover:bg-accent disabled:opacity-50 transition-opacity"
            disabled={zoomLocked}
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            aria-label="Travar zoom"
            onClick={() => setZoomLocked(!zoomLocked)}
            className="flex h-7 w-7 items-center justify-center rounded text-sm text-foreground hover:bg-accent"
          >
            {zoomLocked ? (
              <Lock className="h-4 w-4 text-[color:var(--color-critical)]" />
            ) : (
              <Unlock className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <button
            aria-label="Aproximar"
            onClick={() => !zoomLocked && setZoom((z) => Math.min(8, z * 1.3))}
            className="flex h-7 w-7 items-center justify-center rounded text-sm text-foreground hover:bg-accent disabled:opacity-50 transition-opacity"
            disabled={zoomLocked}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Legenda do Mapa */}
        {legend && (
          <div className="flex flex-col gap-1.5 rounded-md border border-border bg-card/95 p-3 shadow-sm backdrop-blur text-xs w-fit max-w-[280px]">
            {legend.map((l) => (
              <div key={l.label} className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="inline-block h-3 w-3 rounded-sm border border-border flex-shrink-0"
                  style={{ background: l.color }}
                />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative rounded-lg border border-border bg-card overflow-hidden flex justify-center">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          style={{ maxHeight: height }}
          className={cn("h-auto w-full", dragRef.current ? "cursor-grabbing" : "cursor-grab")}
          role="img"
          aria-label="Mapa do Piauí"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrag}
          onMouseLeave={() => {
            stopDrag();
            setHover(null);
          }}
        >
          <g transform={`translate(${tx} ${ty}) scale(${zoom})`}>
            {paths.map((p) => {
              const m = bySlug.get(p.id) || bySlug.get(norm(p.name));
              const fill = colorFn(m);
              return (
                <Link
                  key={p.id}
                  to="/municipios/$slug"
                  params={{ slug: m?.municipio_slug ?? norm(p.name) }}
                  disabled={!!dragRef.current} // Desabilita clique se estiver arrastando
                >
                  <path
                    d={p.d}
                    fill={fill}
                    stroke="oklch(1 0 0 / 0.6)"
                    strokeWidth={0.4 / zoom}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onMouseMove={(e) => {
                      const rect = (
                        e.currentTarget.ownerSVGElement as SVGSVGElement
                      ).getBoundingClientRect();
                      // Ajustar a posição do tooltip com base no zoom
                      setHover({
                        name: p.name,
                        m,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                  />
                </Link>
              );
            })}
          </g>
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md"
            style={{ left: Math.min(hover.x + 12, 600), top: hover.y + 12 }}
          >
            <p className="font-semibold text-foreground">{hover.name}</p>
            {hover.m && (
              <div className="mt-1 space-y-0.5 text-muted-foreground">
                <p>
                  OPM:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      hover.m.opm_possui === "SIM"
                        ? "text-[color:var(--color-success)]"
                        : "text-destructive",
                    )}
                  >
                    {hover.m.opm_possui || "—"}
                  </span>
                </p>
                <p>
                  CREAS:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      hover.m.creas_possui === "SIM"
                        ? "text-[color:var(--color-success)]"
                        : "text-destructive",
                    )}
                  >
                    {hover.m.creas_possui || "—"}
                  </span>
                </p>
                <p>
                  Score:{" "}
                  <span className="font-medium">{hover.m.risco_feminicidio_score.toFixed(1)}</span>
                </p>
                <p>
                  Risco: <span className="font-medium">{hover.m.risco_feminicidio_nivel}</span>
                </p>
                <p>
                  Alerta: <span className="font-medium">{hover.m.painel_alerta_rede}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}
