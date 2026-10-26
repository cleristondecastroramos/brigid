import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tooltip?: string;
  icon?: LucideIcon;
  tone?: "default" | "success" | "warning" | "critical" | "primary";
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}

// O tom só colore o ícone; o número fica sempre na cor do texto, sem fundos tingidos
const toneStyles: Record<string, string> = {
  default: "text-muted-foreground",
  primary: "text-muted-foreground",
  success: "text-[color:var(--color-success)]",
  warning: "text-[color:var(--color-warning)]",
  critical: "text-destructive",
};

export function KpiCard({
  label,
  value,
  hint,
  tooltip,
  icon: Icon,
  tone = "default",
  className,
  onClick,
  isActive,
}: KpiCardProps) {
  return (
    <Card
      onClick={onClick}
      title={tooltip}
      className={cn(
        "border-border transition-colors",
        onClick && "cursor-pointer hover:border-foreground/30",
        isActive && "border-primary ring-1 ring-primary",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground leading-snug">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground leading-none">
              {value}
            </p>
            {hint && (
              <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug">{hint}</p>
            )}
          </div>
          {Icon && <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", toneStyles[tone])} aria-hidden />}
        </div>
      </CardContent>
    </Card>
  );
}
