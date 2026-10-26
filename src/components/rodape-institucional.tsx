import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { municipiosQueryOptions } from "@/lib/data-fetching";
import { cn } from "@/lib/utils";

// Rodapé institucional comum a todas as áreas do sistema (painel, página inicial e
// módulo de diagnóstico): identificação do órgão, notas gerais sobre os dados,
// links de referência, data da base e versão publicada.

const NOTAS_GERAIS = [
  "Score de risco calculado com os feminicídios consumados e tentados da janela oficial 2023–2025, por 100 mil mulheres. Os registros de 2026 são preliminares (ciclo aberto) e não compõem o score.",
  "Fontes de estrutura: OPM — SEMPI/OPM 2026; CREAS — SASC/SUAS 2025; ocorrências — Base de feminicídios 2023–2026, consolidada pelo CAOCRIM.",
  "Informações prestadas pelas Promotorias de Justiça só são exibidas após validação expressa do CAOCRIM. Campos ainda não consolidados aparecem como “Sem informação”.",
];

function dataBR(iso?: string | null) {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split("-");
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

export function RodapeInstitucional({
  className,
  mostrarDataBase = true,
}: {
  className?: string;
  mostrarDataBase?: boolean;
}) {
  const { data: municipios } = useQuery({ ...municipiosQueryOptions, enabled: mostrarDataBase });
  const dataBase = mostrarDataBase
    ? dataBR(
        (municipios ?? [])
          .map((m) => m.ultima_atualizacao_referencia)
          .filter(Boolean)
          .sort()
          .at(-1),
      )
    : null;

  return (
    <footer
      className={cn(
        "no-print border-t border-border bg-card text-[12px] leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 md:grid-cols-[1.1fr_1.6fr_0.8fr]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <img src="/logo_brigid.png" alt="" className="h-6 w-6 object-contain" />
            <span className="text-[13px] font-semibold tracking-[0.12em] text-foreground">
              BRIGID
            </span>
          </div>
          <p>
            Base de Referência Integrada para Gestão, Inteligência e Dados do Projeto Feminicídio
            Zero.
          </p>
          <p className="text-foreground/80">
            Ministério Público do Estado do Piauí
            <br />
            CAOCRIM · Projeto Feminicídio Zero
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground">
            Notas sobre os dados
          </h2>
          <ol className="space-y-1.5">
            {NOTAS_GERAIS.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="tabular-nums text-foreground/70">{i + 1}.</span>
                <span>{n}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground">
            Referência
          </h2>
          <ul className="space-y-1.5">
            <li>
              <Link to="/metodologia" className="hover:text-foreground hover:underline">
                Metodologia de cálculos
              </Link>
            </li>
            <li>
              <Link to="/manual" className="hover:text-foreground hover:underline">
                Manual técnico
              </Link>
            </li>
            <li>
              <Link to="/relatorios" className="hover:text-foreground hover:underline">
                Relatórios e exportações
              </Link>
            </li>
            <li>
              <Link to="/diagnostico-brigid" className="hover:text-foreground hover:underline">
                Diagnóstico BRIGID
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-3 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Ministério Público do Estado do Piauí. Uso institucional.
          </span>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {dataBase && <span>Base de referência atualizada em {dataBase}</span>}
            <span>Versão {__BRIGID_VERSAO__}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

// Notas de rodapé de cada página: fontes e observações metodológicas específicas
export function NotasRodape({
  fontes,
  notas = [],
  className,
}: {
  fontes: string[];
  notas?: string[];
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "mt-8 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground",
        className,
      )}
      aria-label="Fontes e notas"
    >
      <p>
        <span className="font-semibold text-foreground/80">
          Fonte{fontes.length > 1 ? "s" : ""}:
        </span>{" "}
        {fontes.join("; ")}.
      </p>
      {notas.map((n, i) => (
        <p key={i} className="mt-1">
          <span className="font-semibold text-foreground/80">
            {notas.length > 1 ? `Nota ${i + 1}:` : "Nota:"}
          </span>{" "}
          {n}
        </p>
      ))}
    </aside>
  );
}
