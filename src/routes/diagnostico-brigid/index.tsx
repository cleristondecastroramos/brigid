import { useEffect, useState, type ElementType } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PlusCircle,
  History,
  List,
  ArrowLeft,
  ClipboardCheck,
  Settings,
  ChevronRight,
  Info,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/page-title";
import { promotoriasService } from "@/services/promotorias-service";

export const Route = createFileRoute("/diagnostico-brigid/")({
  component: DiagnosticoBrigidPage,
});

function CartaoAcao({
  to,
  titulo,
  descricao,
  icon: Icon,
}: {
  to: string;
  titulo: string;
  descricao: string;
  icon: ElementType;
}) {
  return (
    <Link to={to} className="group block h-full">
      <Card className="flex h-full flex-col transition-colors group-hover:border-foreground/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            {titulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between">
          <CardDescription className="mb-4 leading-relaxed">{descricao}</CardDescription>
          <span className="mt-auto inline-flex items-center text-sm font-medium text-primary group-hover:underline">
            Abrir
            <ChevronRight className="ml-0.5 h-4 w-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

function DiagnosticoBrigidPage() {
  const { userRole } = useApp();
  // Conta de Promotoria sem vínculo ativo: orienta em vez de deixar a pessoa esbarrar em
  // telas negadas. O banco continua recusando qualquer ação sem vínculo.
  const [semVinculo, setSemVinculo] = useState(false);
  useEffect(() => {
    if (userRole === "admin") {
      setSemVinculo(false);
      return;
    }
    let ativo = true;
    promotoriasService
      .meusVinculos()
      .then((v) => ativo && setSemVinculo(v.length === 0))
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [userRole]);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" />
          Página inicial
        </Link>
      </Button>

      <PageTitle
        secao="Diagnóstico BRIGID"
        titulo="Formulário de diagnóstico da rede de proteção"
        descricao="Coleta padronizada e rastreável de informações sobre a rede de proteção, políticas públicas, segurança e violência de gênero nos municípios piauienses."
      />

      {semVinculo && (
        <div
          role="status"
          className="flex gap-3 rounded-md border border-warning/50 bg-warning/10 p-4 text-sm"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Esta conta não está vinculada a nenhuma Promotoria ativa.
            </p>
            <p className="text-muted-foreground">
              Sem vínculo, não é possível iniciar nem consultar diagnósticos. Solicite ao CAOCRIM a
              aprovação ou a reativação do vínculo da conta institucional da sua Promotoria.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <CartaoAcao
          to="/diagnostico-brigid/novo"
          titulo="Iniciar diagnóstico"
          descricao="Começar o preenchimento de um novo diagnóstico para um município da Promotoria."
          icon={PlusCircle}
        />
        <CartaoAcao
          to="/diagnostico-brigid/meus-diagnosticos"
          titulo="Meus diagnósticos"
          descricao="Continuar rascunhos, corrigir devoluções e acompanhar os envios."
          icon={List}
        />
        <CartaoAcao
          to="/diagnostico-brigid/acompanhamento"
          titulo="Acompanhamento"
          descricao="Mapa e situação da cobertura municipal, separando os blocos cível e criminal."
          icon={History}
        />
      </div>

      {userRole === "admin" && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Área do CAOCRIM
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <CartaoAcao
              to="/diagnostico-brigid/revisao"
              titulo="Revisão CAOCRIM"
              descricao="Analisar diagnósticos enviados, devolver para correção ou validar e publicar."
              icon={ClipboardCheck}
            />
            <CartaoAcao
              to="/diagnostico-brigid/administracao"
              titulo="Promotorias e contas"
              descricao="Configurar atribuições funcionais, e-mails institucionais e o vínculo das contas."
              icon={Settings}
            />
          </div>
        </section>
      )}

      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm">Orientações</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>
              Salvar, concluir ou enviar o diagnóstico{" "}
              <strong className="text-foreground">não publica dados</strong>. As respostas só passam
              a integrar a base consolidada e o painel público após análise e validação expressa do
              CAOCRIM.
            </li>
            <li>
              Os blocos do formulário são definidos pela atribuição da Promotoria (cível/cidadania,
              criminal, cumulativa ou única).
            </li>
            <li>
              Observações, contatos, descrições livres e anexos são de uso interno e não são
              publicados.
            </li>
            <li>Dados referentes ao ciclo de 2026 são preliminares, mesmo após a validação.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
