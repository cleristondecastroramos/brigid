import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { geoMercator, geoPath } from "d3-geo";
import { Link } from "@tanstack/react-router";
import { geoQueryOptions, municipiosQueryOptions } from "@/lib/csv-data";
import type { Municipio } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ColorFn = (m: Municipio | undefined) => string;

interface PiauiMapProps {
  colorFn: ColorFn;
  height?: number;
  legend?: Array<{ label: string; color: string }>;
  title?: string;
}

export function PiauiMap({ colorFn, height = 520, legend, title }: PiauiMapProps) {
  const { data: geo } = useSuspenseQuery(geoQueryOptions);
  const { data: municipios } = useSuspenseQuery(municipiosQueryOptions);
  const [hover, setHover] = useState<{ name: string; m?: Municipio; x: number; y: number } | null>(null);

  const bySlug = useMemo(() => {
    const map = new Map<string, Municipio>();
    municipios.forEach((m) => {
      map.set(m.codigo_ibge, m);
      map.set(m.municipio_slug, m);
      map.set(norm(m.municipio), m);
    });
    return map;
  }, [municipios]);

  const { paths, viewBox } = useMemo(() => {
    const projection = geoMercator().fitSize([800, 800], geo as any);
    const path = geoPath(projection);
    const paths = geo.features.map((f) => ({
      id: f.properties.id,
      name: f.properties.name,
      d: path(f as any) ?? "",
    }));
    const [[x0, y0], [x1, y1]] = path.bounds(geo as any);
    return { paths, viewBox: `${x0} ${y0} ${x1 - x0} ${y1 - y0}` };
  }, [geo]);

  return (
    <div className="relative w-full">
      {title && <p className="mb-2 text-sm font-medium text-foreground">{title}</p>}
      <div className="relative rounded-lg border border-border bg-card flex justify-center p-4">
        <svg viewBox={viewBox} className="h-auto w-full max-h-[720px]" role="img" aria-label="Mapa do Piauí">
          <g>
            {paths.map((p) => {
              const m = bySlug.get(p.id) || bySlug.get(norm(p.name));
              const fill = colorFn(m);
              return (
                <Link
                  key={p.id}
                  to="/municipios/$slug"
                  params={{ slug: m?.municipio_slug ?? norm(p.name) }}
                >
                  <path
                    d={p.d}
                    fill={fill}
                    stroke="oklch(1 0 0 / 0.6)"
                    strokeWidth={0.4}
                    className="cursor-pointer transition-opacity hover:opacity-80"
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
                <p>OPM: <span className={cn("font-medium", hover.m.opm_possui === "SIM" ? "text-[color:var(--color-success)]" : "text-destructive")}>{hover.m.opm_possui || "—"}</span></p>
                <p>CREAS: <span className={cn("font-medium", hover.m.creas_possui === "SIM" ? "text-[color:var(--color-success)]" : "text-destructive")}>{hover.m.creas_possui || "—"}</span></p>
                <p>Risco: <span className="font-medium">{hover.m.risco_feminicidio_nivel}</span></p>
                <p>Alerta: <span className="font-medium">{hover.m.painel_alerta_rede}</span></p>
              </div>
            )}
          </div>
        )}
      </div>
      {legend && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border border-border" style={{ background: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
