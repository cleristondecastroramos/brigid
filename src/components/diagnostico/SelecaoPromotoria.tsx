import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { promotoriasService } from "@/services/promotorias-service";
import { Promotoria } from "@/data/promotorias-seed";

interface SelecaoPromotoriaProps {
  value?: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function SelecaoPromotoria({ value, onChange, disabled }: SelecaoPromotoriaProps) {
  const [open, setOpen] = useState(false);
  const [promotorias, setPromotorias] = useState<Promotoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    promotoriasService.listarPromotorias().then((data) => {
      if (mounted) {
        setPromotorias(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const selectedPromotoria = promotorias.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className="w-full justify-between"
        >
          {loading ? (
            "Carregando Promotorias..."
          ) : selectedPromotoria ? (
            `${selectedPromotoria.nome} — Comarca de ${selectedPromotoria.comarca_sede}`
          ) : (
            "Selecione uma Promotoria..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] max-w-[90vw] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar Promotoria de Justiça..." />
          <CommandList>
            <CommandEmpty>Nenhuma Promotoria encontrada.</CommandEmpty>
            <CommandGroup>
              {promotorias.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.nome} ${p.comarca_sede}`}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === p.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {p.nome} — Comarca de {p.comarca_sede}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
