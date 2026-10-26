import { createFileRoute } from "@tanstack/react-router";
import { FormularioDiagnostico } from "@/components/diagnostico/FormularioDiagnostico";

export const Route = createFileRoute("/diagnostico-brigid/formulario/$diagnosticoId")({
  component: FormularioDiagnosticoPage,
});

function FormularioDiagnosticoPage() {
  const { diagnosticoId } = Route.useParams();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Continuar Diagnóstico
        </h1>
        <p className="text-muted-foreground">Identificador: {diagnosticoId}</p>
      </div>

      <FormularioDiagnostico diagnosticoId={diagnosticoId} />
    </div>
  );
}
