import { createFileRoute, Link } from "@tanstack/react-router";
import { FormularioDiagnostico } from "@/components/diagnostico/FormularioDiagnostico";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/diagnostico-brigid/novo")({
  component: NovoDiagnosticoPage,
});

function NovoDiagnosticoPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/diagnostico-brigid">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Novo Diagnóstico BRIGID
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Inicie um novo preenchimento. Selecione a unidade e sua atribuição para carregar os blocos adequados.
        </p>
      </div>

      <FormularioDiagnostico />
    </div>
  );
}
