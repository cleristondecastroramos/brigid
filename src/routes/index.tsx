import { Suspense, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, ClipboardList, LayoutDashboard, Lock, User } from "lucide-react";
import { toast } from "sonner";
import logoMPPI from "@/assets/logo-mppi.png";
import { useApp } from "@/context/AppContext";
import { useMunicipios } from "@/lib/useMunicipios";
import { VisitorCounter } from "@/components/VisitorCounter";
import { RodapeInstitucional } from "@/components/rodape-institucional";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const MODULOS_PAINEL = [
  "Diagnóstico da rede e fluxos de atendimento",
  "Cobertura de OPMs e de CREAS",
  "Risco de feminicídio por município",
  "Inteligência territorial e fichas municipais",
  "Relatórios em PDF, CSV e planilha",
];

function LandingPage() {
  const { enterPublic, loginAdmin } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAccessPublic = () => {
    enterPublic();
    navigate({ to: "/apresentacao-do-sistema" });
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    setSubmitting(true);
    const { error } = await loginAdmin(email, password);
    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
      toast.error("Falha na autenticação administrativa.");
      return;
    }

    toast.success("Acesso administrativo autorizado.");
    setOpenDialog(false);
    setEmail("");
    setPassword("");
    navigate({ to: "/apresentacao-do-sistema" });
  };

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <img
              src={logoMPPI}
              alt="Ministério Público do Estado do Piauí"
              className="h-11 w-auto object-contain"
            />
            <div className="hidden h-8 w-px bg-border sm:block" />
            <div className="hidden flex-col sm:flex">
              <span className="text-[13px] font-semibold text-foreground">
                Ministério Público do Estado do Piauí
              </span>
              <span className="text-xs text-muted-foreground">
                CAOCRIM · Projeto Feminicídio Zero
              </span>
            </div>
          </div>

          <Dialog
            open={openDialog}
            onOpenChange={(isOpen) => {
              setOpenDialog(isOpen);
              if (!isOpen) setErrorMsg("");
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Lock className="h-3.5 w-3.5" />
                Acesso restrito
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 sm:max-w-[400px]">
              <DialogHeader className="border-b border-border px-6 py-4 text-left">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  CAOCRIM
                </span>
                <DialogTitle className="text-base font-semibold">
                  Autenticação administrativa
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAdminLogin} className="space-y-4 p-6">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Acesso reservado à administração do sistema: edição da base municipal, simulação
                  de pesos e revisão dos diagnósticos.
                </p>

                {errorMsg && (
                  <div className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="admin_email"
                    className="flex items-center gap-1.5 text-xs font-medium"
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    E-mail institucional
                  </label>
                  <input
                    type="email"
                    id="admin_email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="exemplo@mppi.mp.br"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="admin_password"
                    className="flex items-center gap-1.5 text-xs font-medium"
                  >
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Senha
                  </label>
                  <input
                    type="password"
                    id="admin_password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </div>

                <DialogFooter className="gap-2 border-t border-border pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Verificando..." : "Entrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Projeto Feminicídio Zero
              </p>
              <h1 className="mt-3 flex items-center gap-3 text-4xl font-semibold tracking-tight md:text-5xl">
                <img
                  src="/logo_brigid.png"
                  alt=""
                  className="h-10 w-10 object-contain md:h-12 md:w-12"
                />
                BRIGID
              </h1>
              <p className="mt-2 text-lg text-foreground/80 md:text-xl">
                Base de Referência Integrada para Gestão, Inteligência e Dados
              </p>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                Plataforma institucional do Ministério Público do Estado do Piauí para o
                monitoramento da rede de proteção às mulheres em situação de violência e do risco de
                feminicídio nos 224 municípios piauienses. Reúne dados de estrutura, de ocorrências
                e de diagnósticos das Promotorias de Justiça para orientar a atuação ministerial.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-md border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                Painel público
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Consulta aberta aos dados consolidados e autorizados para publicação.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-foreground/80">
                {MODULOS_PAINEL.map((m) => (
                  <li key={m} className="flex gap-2">
                    <span className="mt-[9px] h-1 w-1 shrink-0 bg-foreground/40" />
                    {m}
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-2">
                <Button onClick={handleAccessPublic}>
                  Acessar painel
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col rounded-md border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                Diagnóstico BRIGID
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Módulo de coleta para as Promotorias de Justiça registrarem o diagnóstico da rede de
                proteção nos municípios de sua atribuição.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-foreground/80">
                <li className="flex gap-2">
                  <span className="mt-[9px] h-1 w-1 shrink-0 bg-foreground/40" />
                  Acesso pela conta institucional da Promotoria
                </li>
                <li className="flex gap-2">
                  <span className="mt-[9px] h-1 w-1 shrink-0 bg-foreground/40" />
                  Revisão e validação pelo CAOCRIM antes de qualquer publicação
                </li>
                <li className="flex gap-2">
                  <span className="mt-[9px] h-1 w-1 shrink-0 bg-foreground/40" />
                  Histórico de versões, devoluções e anexos
                </li>
              </ul>
              <div className="mt-6 pt-2">
                <Button variant="outline" onClick={() => navigate({ to: "/diagnostico-brigid" })}>
                  Entrar no módulo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Suspense fallback={null}>
            <PanoramaEstadual />
          </Suspense>

          <div className="mt-8 border-t border-border pt-4">
            <VisitorCounter />
          </div>
        </section>
      </main>

      <RodapeInstitucional />
    </div>
  );
}

// Números da base consolidada, com a mesma metodologia do painel
function PanoramaEstadual() {
  const { data } = useMunicipios();
  const total = data.length;
  const comOpm = data.filter((m) => m.opm_possui === "SIM").length;
  const comCreas = data.filter((m) => m.creas_possui === "SIM").length;
  const altoCritico = data.filter((m) =>
    ["ALTO", "CRITICO"].includes(String(m.risco_feminicidio_nivel)),
  ).length;
  const pct = (n: number) => (total ? `${((n / total) * 100).toFixed(1).replace(".", ",")}%` : "—");

  const itens = [
    { rotulo: "Municípios monitorados", valor: total, nota: "Estado do Piauí" },
    { rotulo: "Com OPM", valor: comOpm, nota: `${pct(comOpm)} dos municípios` },
    { rotulo: "Com CREAS", valor: comCreas, nota: `${pct(comCreas)} dos municípios` },
    { rotulo: "Risco alto ou crítico", valor: altoCritico, nota: "Janela oficial 2023–2025" },
  ];

  return (
    <div className="mt-10">
      <h2 className="text-sm font-semibold">Panorama estadual</h2>
      <dl className="mt-3 grid grid-cols-2 divide-border overflow-hidden rounded-md border border-border bg-card md:grid-cols-4 md:divide-x">
        {itens.map((i) => (
          <div key={i.rotulo} className="border-b border-border p-5 md:border-b-0">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {i.rotulo}
            </dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums">{i.valor}</dd>
            <dd className="mt-1 text-xs text-muted-foreground">{i.nota}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Fonte: base consolidada do BRIGID (SEMPI/OPM 2026; SASC/SUAS 2025; Base de feminicídios
        2023–2026). Classificação de risco conforme a metodologia oficial.
      </p>
    </div>
  );
}
