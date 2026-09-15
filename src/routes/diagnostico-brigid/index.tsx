import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusCircle, History, List, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/diagnostico-brigid/")({
  component: DiagnosticoBrigidPage,
});

function DiagnosticoBrigidPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Formulário de Diagnóstico BRIGID
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Coleta padronizada e rastreável de informações sobre a rede de proteção, políticas públicas, 
          segurança e violência de gênero nos municípios piauienses.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-4">
        <Link to="/diagnostico-brigid/novo" className="block group">
          <Card className="h-full border-primary/30 bg-card hover:bg-accent/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-xl bg-primary/10 text-primary w-fit group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <CardTitle className="text-xl font-bold mt-2">Iniciar Diagnóstico</CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed mt-2">
                Iniciar o preenchimento de um novo diagnóstico territorial ou institucional.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/diagnostico-brigid/meus-diagnosticos" className="block group">
          <Card className="h-full border-border bg-card hover:bg-accent/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-600 w-fit group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                  <List className="w-7 h-7" />
                </div>
                <CardTitle className="text-xl font-bold mt-2">Meus Diagnósticos</CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed mt-2">
                Continuar preenchimentos em andamento, revisar rascunhos e acompanhar envios.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/diagnostico-brigid/acompanhamento" className="block group">
          <Card className="h-full border-border bg-card hover:bg-accent/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 w-fit group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                  <History className="w-7 h-7" />
                </div>
                <CardTitle className="text-xl font-bold mt-2">Acompanhamento</CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed mt-2">
                Acompanhar o painel gerencial, mapa estadual e métricas gerais de preenchimento.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Card className="border-border/60 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
            Avisos Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • As respostas fornecidas alimentam a base oficial do Projeto Feminicídio Zero.
          </p>
          <p>
            • Os blocos do formulário são disponibilizados automaticamente com base na <strong>atribuição da sua Promotoria</strong> (Cível/Cidadania, Criminal ou Única).
          </p>
          <p>
            • Dados referentes ao ciclo de 2026 são considerados <strong>preliminares</strong> até a validação oficial do CAOCRIM.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
