import { CheckCircle, XCircle } from "lucide-react";

// Indicadores de três estados: SIM, NÃO e "Sem informação" (campo ainda não consolidado).
// A ausência de dado nunca é exibida como "NÃO".

export function SimNaoIcone({ valor }: { valor?: string | null }) {
  if (valor === "SIM")
    return <CheckCircle className="h-4 w-4 text-[color:var(--color-success)] mx-auto" />;
  if (valor === "NAO") return <XCircle className="h-4 w-4 text-destructive mx-auto" />;
  return (
    <span className="text-xs text-muted-foreground" title="Sem informação">
      —
    </span>
  );
}

export function SimNaoTexto({ valor }: { valor?: string | null }) {
  if (valor === "SIM")
    return <span className="text-base font-bold text-[color:var(--color-success)]">SIM</span>;
  if (valor === "NAO") return <span className="text-base text-destructive">NÃO</span>;
  return <span className="text-xs text-muted-foreground">Sem informação</span>;
}
