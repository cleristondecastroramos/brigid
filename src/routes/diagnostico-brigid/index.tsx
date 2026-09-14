import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, PlusCircle, History, List, BarChart, Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/diagnostico-brigid/")({
  component: DiagnosticoBrigidPage,
});

function DiagnosticoBrigidPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Formulário de Diagnóstico BRIGID
        </h1>
        <p className="text-muted-foreground">
          Coleta padronizada e rastreável de informações sobre a rede de proteção, políticas públicas, 
          segurança e violência de gênero nos municípios piauienses.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/diagnostico-brigid/novo" className="block group">
          <Card className="h-full border-border/60 bg-card/60 hover:bg-card/80 transition-colors shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Iniciar Diagnóstico</CardTitle>
              </div>
              <CardDescription>
                Iniciar um novo diagnóstico territorial ou institucional
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/diagnostico-brigid/meus-diagnosticos" className="block group">
          <Card className="h-full border-border/60 bg-card/60 hover:bg-card/80 transition-colors shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <List className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Meus Diagnósticos</CardTitle>
              </div>
              <CardDescription>
                Continuar preenchimento, revisar rascunhos e acompanhar envios
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/diagnostico-brigid/acompanhamento" className="block group">
          <Card className="h-full border-border/60 bg-card/60 hover:bg-card/80 transition-colors shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-warning/10 text-warning-foreground">
                  <History className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Acompanhamento</CardTitle>
              </div>
              <CardDescription>
                Validar respostas, acompanhar completude e gerenciar diagnósticos da unidade
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/diagnostico" className="block group">
          <Card className="h-full border-border/60 bg-card/60 hover:bg-card/80 transition-colors shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-success/10 text-success-foreground">
                  <BarChart className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg">Painel Analítico</CardTitle>
              </div>
              <CardDescription>
                Visualizar os indicadores consolidados e mapas territoriais (Painel BRIGID)
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
