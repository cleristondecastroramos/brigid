import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/diagnostico-brigid/painel")({
  component: PainelFormularioPage,
});

function PainelFormularioPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Painel do Formulário
      </h1>
      <p className="text-muted-foreground">Em desenvolvimento.</p>
    </div>
  );
}
