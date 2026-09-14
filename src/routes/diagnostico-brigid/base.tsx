import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/diagnostico-brigid/base")({
  component: BaseConsolidadaPage,
});

function BaseConsolidadaPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Base Consolidada
      </h1>
      <p className="text-muted-foreground">Em desenvolvimento.</p>
    </div>
  );
}
