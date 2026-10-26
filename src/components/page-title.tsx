import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Cabeçalho padrão das páginas: seção, título, descrição e ações à direita
export function PageTitle({
  secao,
  titulo,
  descricao,
  acoes,
  className,
}: {
  secao?: string;
  titulo: string;
  descricao?: ReactNode;
  acoes?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {secao && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {secao}
          </p>
        )}
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {descricao}
          </p>
        )}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  );
}
