import { cn } from "@/lib/utils";

const RISK_TOKENS: Record<string, string> = {
  BAIXO: "bg-[color:var(--color-risk-low)]/15 text-[color:var(--color-risk-low)] border-[color:var(--color-risk-low)]/30",
  MEDIO: "bg-[color:var(--color-risk-medium)]/20 text-[color:var(--color-risk-medium)] border-[color:var(--color-risk-medium)]/40",
  ALTO: "bg-[color:var(--color-risk-high)]/20 text-[color:var(--color-risk-high)] border-[color:var(--color-risk-high)]/40",
  CRITICO: "bg-destructive/15 text-destructive border-destructive/40",
};

const ALERT_TOKENS: Record<string, string> = {
  ADEQUADO: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] border-[color:var(--color-success)]/30",
  ATENCAO: "bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/40",
  CRITICO: "bg-destructive/15 text-destructive border-destructive/40",
};

export function RiskBadge({ level }: { level: string }) {
  const cls = RISK_TOKENS[level] ?? "bg-muted text-muted-foreground border-border";
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", cls)}>{level || "—"}</span>;
}

export function AlertBadge({ level }: { level: string }) {
  const cls = ALERT_TOKENS[level] ?? "bg-muted text-muted-foreground border-border";
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", cls)}>{level || "—"}</span>;
}

export function YesNoBadge({ value, positiveIsGood = true }: { value: string; positiveIsGood?: boolean }) {
  const yes = value === "SIM";
  const good = positiveIsGood ? yes : !yes;
  const cls = good
    ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] border-[color:var(--color-success)]/30"
    : "bg-destructive/10 text-destructive border-destructive/30";
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", cls)}>{value || "—"}</span>;
}
