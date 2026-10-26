import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";

interface ChartHelperProps {
  title?: string;
  children: React.ReactNode;
}

export function ChartHelper({ title = "Como funciona esta análise?", children }: ChartHelperProps) {
  return (
    <div className="absolute top-4 right-4 z-10">
      <Popover>
        <PopoverTrigger asChild>
          <button className="text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1 rounded-sm hover:bg-muted/50">
            <HelpCircle className="h-5 w-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 text-sm border-border/60 shadow-sm" align="end">
          <div className="space-y-3">
            <h4 className="font-bold text-foreground">{title}</h4>
            <div className="space-y-3 text-muted-foreground text-xs leading-relaxed">
              {children}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
