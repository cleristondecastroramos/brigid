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

const toneStyles: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
  warning: "bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)]",
  critical: "bg-destructive/15 text-destructive",
};

export function KpiCard({ label, value, hint, tooltip, icon: Icon, tone = "default", className, onClick, isActive }: KpiCardProps) {
  return (
    <Card 
      onClick={onClick}
      title={tooltip}
      className={cn(
        "border-border/70 transition-colors", 
        onClick && "cursor-pointer hover:bg-accent/40",
        isActive && "ring-2 ring-primary border-primary",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          {Icon && (
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", toneStyles[tone])}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

