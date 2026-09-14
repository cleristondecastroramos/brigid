import { createFileRoute } from "@tanstack/react-router";
import { FormularioDiagnostico } from "@/components/diagnostico/FormularioDiagnostico";

export const Route = createFileRoute("/diagnostico-brigid/novo")({
  component: NovoDiagnosticoPage,
});

function NovoDiagnosticoPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Novo Diagnóstico BRIGID
        </h1>
        <p className="text-muted-foreground">
          Inicie um novo preenchimento. Selecione a unidade e sua atribuição para carregar os blocos adequados.
        </p>
      </div>

      <FormularioDiagnostico isNew={true} />
    </div>
  );
}
