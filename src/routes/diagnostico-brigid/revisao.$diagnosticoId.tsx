import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  MessageSquarePlus,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  diagnosticoService,
  STATUS_DIAGNOSTICO,
  rotuloCondicao,
  type AnexoDiagnostico,
  type DiagnosticoResumo,
  type EventoAuditoria,
  type ObservacaoDiagnostico,
  type PreviaPublicacao,
  type VersaoDiagnostico,
} from "@/services/diagnostico-service";
import {
  dicionarioDiagnostico,
  SECOES,
  VALOR_NAO_SABE,
  sufixoJustificativa,
  rotuloAtribuicao,
  type SecaoId,
} from "@/lib/dicionario-diagnostico";
import {
  calcularCompletude,
  campoVisivel,
  secoesAplicaveis,
  MOTIVO_PENDENCIA,
} from "@/lib/completude-diagnostico";
import { rotuloResposta, verificarInconsistencias } from "@/lib/inconsistencias-diagnostico";
import { SomenteCaocrim } from "@/components/diagnostico/AcessoDiagnostico";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/diagnostico-brigid/revisao/$diagnosticoId")({
  component: () => (
    <SomenteCaocrim>
      <RevisaoDiagnosticoPage />
    </SomenteCaocrim>
  ),
});

const ACOES_AUDITORIA: Record<string, string> = {
  criacao: "Diagnóstico criado",
  envio_analise: "Enviado para análise",
  analise_iniciada: "Análise iniciada pelo CAOCRIM",
  devolucao: "Devolvido para correção",
  nova_versao: "Nova versão aberta",
  validacao: "Validado pelo CAOCRIM",
  publicacao: "Publicado na base consolidada",
  publicacao_falhou: "Falha na publicação (base anterior preservada)",
  anexo_incluido: "Anexo incluído",
  anexo_removido: "Anexo removido",
};

const textarea =
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function RevisaoDiagnosticoPage() {
  const { diagnosticoId } = Route.useParams();
  const queryClient = useQueryClient();

  const [diag, setDiag] = useState<DiagnosticoResumo | null>(null);
  const [versoes, setVersoes] = useState<VersaoDiagnostico[]>([]);
  const [numeroSel, setNumeroSel] = useState<number | null>(null);
  const [observacoes, setObservacoes] = useState<ObservacaoDiagnostico[]>([]);
  const [anexos, setAnexos] = useState<AnexoDiagnostico[]>([]);
  const [auditoria, setAuditoria] = useState<EventoAuditoria[]>([]);
  const [previa, setPrevia] = useState<PreviaPublicacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);

  // Comentários por campo/bloco para a devolução
  const [comentarios, setComentarios] = useState<
    Record<string, { secao: string; campo: string | null; texto: string }>
  >({});
  const [comentando, setComentando] = useState<string | null>(null);
  const [dlgDevolver, setDlgDevolver] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [dlgValidar, setDlgValidar] = useState(false);
  const [obsValidacao, setObsValidacao] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [conflitosOk, setConflitosOk] = useState<string[]>([]);
  const [notaInterna, setNotaInterna] = useState({ secao: "geral", texto: "" });

  const carregar = useCallback(async () => {
    const [d, vs, obs, ax, au] = await Promise.all([
      diagnosticoService.obter(diagnosticoId),
      diagnosticoService.versoes(diagnosticoId),
      diagnosticoService.observacoes(diagnosticoId),
      diagnosticoService.anexos(diagnosticoId),
      diagnosticoService.auditoria(diagnosticoId),
    ]);
    setDiag(d);
    setVersoes(vs);
    setObservacoes(obs);
    setAnexos(ax);
    setAuditoria(au);
    if (d) {
      setNumeroSel(d.versao_atual);
      const atual = vs.find((v) => v.numero === d.versao_atual);
      if (atual && ["enviado", "em_analise", "validado"].includes(atual.status)) {
        setPrevia(await diagnosticoService.previaPublicacao(d.id, atual.numero));
      } else {
        setPrevia(null);
      }
    }
  }, [diagnosticoId]);

  useEffect(() => {
    carregar()
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setCarregando(false));
  }, [carregar]);

  const versao = versoes.find((v) => v.numero === numeroSel) ?? null;
  const ehAtual = !!diag && versao?.numero === diag.versao_atual;
  const respostas = versao?.respostas ?? {};

  const completude = useMemo(
    () =>
      diag
        ? calcularCompletude(respostas, {
            promotoria_id: diag.promotoria_id,
            codigo_ibge: diag.codigo_ibge,
            atribuicao: diag.atribuicao,
            periodo_referencia: diag.periodo_referencia,
          })
        : null,
    [diag, respostas],
  );
  const inconsistencias = useMemo(
    () => verificarInconsistencias(respostas, diag?.periodo_referencia),
    [respostas, diag],
  );
  const itensPorCodigo = useMemo(() => {
    const m = new Map<string, PreviaPublicacao["itens"]>();
    for (const i of previa?.itens ?? []) m.set(i.codigo, [...(m.get(i.codigo) ?? []), i]);
    return m;
  }, [previa]);

  if (carregando)
    return <div className="p-8 text-center text-muted-foreground">Carregando diagnóstico...</div>;
  if (!diag || !versao || !completude)
    return <div className="p-8 text-center text-destructive">Diagnóstico não encontrado.</div>;

  const secoes = SECOES.filter((s) => secoesAplicaveis(diag.atribuicao).includes(s.id));
  const alteracoes = (previa?.itens ?? []).filter((i) => i.altera);
  const conflitos = (previa?.itens ?? []).filter((i) => i.conflito);
  const afetaScore = alteracoes.filter((i) => i.afeta_score);

  const executar = async (fn: () => Promise<void>) => {
    setOcupado(true);
    try {
      await fn();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };

  const iniciarAnalise = () =>
    executar(async () => {
      await diagnosticoService.iniciarAnalise(diag.id);
      toast.success("Análise iniciada.");
      await carregar();
    });

  const devolver = () =>
    executar(async () => {
      await diagnosticoService.devolver(
        diag.id,
        versao.numero,
        motivo,
        Object.values(comentarios).map((c) => ({
          secao: c.secao,
          campo_codigo: c.campo,
          texto: c.texto,
        })),
      );
      toast.success("Diagnóstico devolvido ao Promotor. O painel público não foi alterado.");
      setDlgDevolver(false);
      setMotivo("");
      setComentarios({});
      await carregar();
    });

  const validarEPublicar = () =>
    executar(async () => {
      const r =
        versao.status === "validado"
          ? await diagnosticoService.publicar(
              diag.id,
              versao.numero,
              versao.hash_conteudo,
              conflitosOk,
            )
          : await diagnosticoService.validarEPublicar(
              diag.id,
              versao.numero,
              versao.hash_conteudo,
              obsValidacao,
              conflitosOk,
            );
      setDlgValidar(false);
      if (r.ok) {
        toast.success(
          "Versão validada e publicada. O painel público passa a exibir os dados aprovados.",
        );
        await queryClient.invalidateQueries({ queryKey: ["municipios"] });
      } else {
        toast.error(
          `A publicação falhou e a base pública anterior foi preservada. ${r.validado ? "A validação ficou registrada; tente publicar novamente. " : ""}Detalhe: ${r.erro}`,
          { duration: 12000 },
        );
      }
      await carregar();
    });

  const registrarNota = () =>
    executar(async () => {
      const secao = notaInterna.secao === "geral" ? null : notaInterna.secao;
      await diagnosticoService.registrarObservacao(
        diag.id,
        versao.numero,
        secao,
        null,
        notaInterna.texto,
      );
      setNotaInterna({ secao: "geral", texto: "" });
      toast.success("Observação interna registrada.");
      await carregar();
    });

  const abrirAnexo = async (a: AnexoDiagnostico) => {
    try {
      window.open(await diagnosticoService.urlAnexo(a.storage_path), "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const podeDevolver = ehAtual && ["enviado", "em_analise"].includes(versao.status);
  const podeValidar =
    ehAtual && versao.status === "em_analise" && completude.percentual === 100 && !!previa;
  const podeRepublicar = ehAtual && versao.status === "validado" && !!previa;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/diagnostico-brigid/revisao">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Fila de revisão
          </Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          {diag.municipio} — {diag.promotoria_nome}
        </h1>
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <div>
              <strong className="text-foreground">Município:</strong> {diag.municipio} (
              {diag.codigo_ibge})
            </div>
            <div>
              <strong className="text-foreground">Comarca / Polo:</strong> {diag.comarca} ·{" "}
              {diag.polo_regional}
            </div>
            <div>
              <strong className="text-foreground">Período:</strong> {diag.periodo_referencia} (
              {previa?.carater ??
                (Number(diag.periodo_referencia) >= 2026 ? "preliminar" : "definitivo")}
              )
            </div>
            <div>
              <strong className="text-foreground">Atribuição:</strong>{" "}
              {diag.atribuicao.map(rotuloAtribuicao).join(", ")}
            </div>
            <div>
              <strong className="text-foreground">Responsável:</strong>{" "}
              {diag.responsavel_nome
                ? `${diag.responsavel_nome} (${rotuloCondicao(diag.responsavel_condicao)})`
                : "—"}
            </div>
            <div>
              <strong className="text-foreground">Enviado em:</strong>{" "}
              {diag.data_envio ? new Date(diag.data_envio).toLocaleString("pt-BR") : "—"}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Completude {completude.percentual}%</Badge>
              <Badge className={STATUS_DIAGNOSTICO[versao.status].className}>
                {STATUS_DIAGNOSTICO[versao.status].label}
              </Badge>
              <Badge variant="outline">
                {diag.versao_publicada ? `v${diag.versao_publicada} publicada` : "Não publicado"}
              </Badge>
            </div>
            <Select value={String(numeroSel)} onValueChange={(v) => setNumeroSel(Number(v))}>
              <SelectTrigger className="h-8 w-[260px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versoes.map((v) => (
                  <SelectItem key={v.numero} value={String(v.numero)}>
                    Versão {v.numero} — {STATUS_DIAGNOSTICO[v.status].label}
                    {v.numero === diag.versao_atual ? " (atual)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {ehAtual && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="max-w-2xl text-sm text-muted-foreground">
              {versao.status === "enviado" &&
                "Diagnóstico aguardando análise. Inicie a análise para revisar e decidir."}
              {versao.status === "em_analise" &&
                (completude.percentual < 100
                  ? "A versão possui pendências obrigatórias e não pode ser validada; devolva para correção."
                  : "Revise todas as respostas e a comparação com os dados publicados antes de decidir.")}
              {versao.status === "validado" &&
                "Versão validada, mas a publicação não foi concluída. Tente publicar novamente."}
              {versao.status === "devolvido" &&
                "Devolvido ao Promotor; aguardando correção e reenvio."}
              {versao.status === "em_preenchimento" && "Versão em preenchimento pelo Promotor."}
              {versao.status === "publicado" && "Versão publicada no painel público."}
            </p>
            <div className="flex flex-wrap gap-2">
              {versao.status === "enviado" && (
                <Button onClick={iniciarAnalise} disabled={ocupado}>
                  Iniciar análise
                </Button>
              )}
              {podeDevolver && (
                <Button variant="outline" onClick={() => setDlgDevolver(true)} disabled={ocupado}>
                  Devolver para correção
                  {Object.keys(comentarios).length > 0 && ` (${Object.keys(comentarios).length})`}
                </Button>
              )}
              {(podeValidar || podeRepublicar) && (
                <Button
                  onClick={() => {
                    setConfirmado(false);
                    setConflitosOk([]);
                    setDlgValidar(true);
                  }}
                  disabled={ocupado}
                >
                  {podeRepublicar ? "Publicar novamente" : "Validar e publicar"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="respostas">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="respostas">Respostas</TabsTrigger>
          <TabsTrigger value="pendencias">
            Pendências e inconsistências ({completude.pendencias.length + inconsistencias.length})
          </TabsTrigger>
          <TabsTrigger value="comparacao">Comparação com o publicado</TabsTrigger>
          <TabsTrigger value="anexos">Fontes e anexos ({anexos.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="respostas" className="space-y-4">
          {secoes.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{s.label}</span>
                  <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                    {completude.porSecao[s.id]?.percentual ?? 100}% completo
                    {podeDevolver && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setComentando(`secao:${s.id}`)}
                      >
                        <MessageSquarePlus className="mr-1 h-3.5 w-3.5" /> Comentar bloco
                      </Button>
                    )}
                  </span>
                </CardTitle>
                {comentando === `secao:${s.id}` && (
                  <EditorComentario
                    inicial={comentarios[`secao:${s.id}`]?.texto ?? ""}
                    onSalvar={(t) => {
                      setComentarios((c) => {
                        const n = { ...c };
                        if (t) n[`secao:${s.id}`] = { secao: s.id, campo: null, texto: t };
                        else delete n[`secao:${s.id}`];
                        return n;
                      });
                      setComentando(null);
                    }}
                  />
                )}
              </CardHeader>
              <CardContent className="divide-y">
                {dicionarioDiagnostico
                  .filter((c) => c.secao === s.id && campoVisivel(c, respostas))
                  .map((c) => {
                    const valor = respostas[c.codigo_tecnico];
                    const pend = completude.pendencias.find((p) => p.codigo === c.codigo_tecnico);
                    const destinos = itensPorCodigo.get(c.codigo_tecnico) ?? [];
                    const devolucaoAnterior = observacoes.find(
                      (o) =>
                        o.tipo === "devolucao" &&
                        o.campo_codigo === c.codigo_tecnico &&
                        o.versao === versao.numero,
                    );
                    return (
                      <div
                        key={c.codigo_tecnico}
                        className="grid gap-1 py-3 md:grid-cols-[2fr_3fr_auto] md:gap-4"
                      >
                        <div className="text-sm">
                          {c.rotulo}
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {c.codigo_tecnico}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span
                            className={cn(
                              "font-medium",
                              valor === VALOR_NAO_SABE && "text-warning-foreground",
                            )}
                          >
                            {rotuloResposta(c.codigo_tecnico, valor)}
                          </span>
                          {valor === VALOR_NAO_SABE && (
                            <div className="text-xs text-muted-foreground">
                              Justificativa:{" "}
                              {String(respostas[c.codigo_tecnico + sufixoJustificativa] ?? "—")}
                            </div>
                          )}
                          {pend && (
                            <div className="text-xs text-destructive">
                              {MOTIVO_PENDENCIA[pend.motivo]}
                            </div>
                          )}
                          {destinos.map((i) => (
                            <div
                              key={i.campo_destino}
                              className="text-[11px] text-muted-foreground"
                            >
                              Painel: {i.campo_destino} →{" "}
                              {i.ignorado ? <em>{i.ignorado}</em> : (i.valor_novo ?? "—")}
                            </div>
                          ))}
                          {devolucaoAnterior && (
                            <div className="text-[11px] text-destructive">
                              Devolução: {devolucaoAnterior.texto}
                            </div>
                          )}
                          {comentarios[c.codigo_tecnico] && (
                            <div className="text-[11px] text-foreground">
                              Comentário para devolução: {comentarios[c.codigo_tecnico].texto}
                            </div>
                          )}
                          {comentando === c.codigo_tecnico && (
                            <EditorComentario
                              inicial={comentarios[c.codigo_tecnico]?.texto ?? ""}
                              onSalvar={(t) => {
                                setComentarios((x) => {
                                  const n = { ...x };
                                  if (t)
                                    n[c.codigo_tecnico] = {
                                      secao: s.id,
                                      campo: c.codigo_tecnico,
                                      texto: t,
                                    };
                                  else delete n[c.codigo_tecnico];
                                  return n;
                                });
                                setComentando(null);
                              }}
                            />
                          )}
                        </div>
                        {podeDevolver && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setComentando(c.codigo_tecnico)}
                            title="Comentar campo"
                          >
                            <MessageSquarePlus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pendencias">
          <Card>
            <CardContent className="space-y-4 pt-6 text-sm">
              {completude.pendencias.length === 0 ? (
                <p className="flex items-center gap-2 text-[color:var(--color-success)]">
                  <CheckCircle2 className="h-4 w-4" /> Todos os requisitos obrigatórios aplicáveis
                  estão atendidos.
                </p>
              ) : (
                <div>
                  <h3 className="mb-2 font-semibold">
                    Pendências obrigatórias (impedem a validação)
                  </h3>
                  <ul className="list-disc space-y-1 pl-5">
                    {completude.pendencias.map((p) => (
                      <li key={p.codigo}>
                        [{SECOES.find((s) => s.id === p.secao)?.label}] {p.rotulo} —{" "}
                        {MOTIVO_PENDENCIA[p.motivo]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="mb-2 font-semibold">Inconsistências e pontos de atenção</h3>
                {inconsistencias.length === 0 ? (
                  <p className="text-muted-foreground">
                    Nenhuma inconsistência identificada pelas verificações automáticas.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {inconsistencias.map((i, n) => (
                      <li key={n} className="flex items-start gap-2">
                        <AlertTriangle
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            i.nivel === "inconsistencia"
                              ? "text-destructive"
                              : "text-warning-foreground",
                          )}
                        />
                        <span>
                          <strong>{SECOES.find((s) => s.id === i.secao)?.label}:</strong>{" "}
                          {i.mensagem}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparacao">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Respostas propostas × dados publicados</CardTitle>
              <p className="text-sm text-muted-foreground">
                Somente os campos da lista de publicação abaixo podem chegar ao painel. Observações,
                contatos, descrições livres e anexos nunca são publicados.
              </p>
            </CardHeader>
            <CardContent>
              {!previa ? (
                <p className="text-sm text-muted-foreground">
                  A comparação fica disponível para a versão atual enquanto ela está enviada, em
                  análise ou validada.
                </p>
              ) : (
                <TabelaPrevia previa={previa} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anexos">
          <Card>
            <CardContent className="space-y-4 pt-6 text-sm">
              <div>
                <h3 className="mb-2 font-semibold">Fontes declaradas por bloco</h3>
                <ul className="space-y-1">
                  {secoes.map((s) => {
                    const p = {
                      identificacao: "IDEN",
                      cidadania: "CID",
                      fluxos: "FLX",
                      socioassistencial: "SOC",
                      penal_seguranca: "SEG",
                      penal_violencia: "VIO",
                      gargalos: "GAR",
                    }[s.id];
                    return (
                      <li key={s.id}>
                        <strong>{s.label}:</strong>{" "}
                        {rotuloResposta(`${p}_FONTE`, respostas[`${p}_FONTE`])} · confiabilidade{" "}
                        {rotuloResposta(`${p}_CONFIABILIDADE`, respostas[`${p}_CONFIABILIDADE`])} ·
                        referência {String(respostas[`${p}_DATA_REF`] ?? "—")}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  Anexos (classificação interna — não publicados)
                </h3>
                {anexos.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum anexo enviado.</p>
                ) : (
                  <ul className="space-y-1">
                    {anexos.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          className="flex items-center gap-2 hover:underline"
                          onClick={() => abrirAnexo(a)}
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {a.nome_arquivo}
                          <span className="text-xs text-muted-foreground">
                            ({SECOES.find((s) => s.id === a.secao)?.label}, v{a.versao},{" "}
                            {new Date(a.enviado_em).toLocaleDateString("pt-BR")})
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Versões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {versoes.map((v) => (
                <div key={v.numero} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>Versão {v.numero}</strong>
                    <Badge className={STATUS_DIAGNOSTICO[v.status].className}>
                      {STATUS_DIAGNOSTICO[v.status].label}
                    </Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      hash {v.hash_conteudo.slice(0, 10)}
                    </span>
                  </div>
                  <div className="mt-1 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    {v.enviado_em && (
                      <span>
                        Enviada: {new Date(v.enviado_em).toLocaleString("pt-BR")}
                        {v.enviado_por_nome &&
                          ` — por ${v.enviado_por_nome} (${rotuloCondicao(v.enviado_por_condicao)})`}
                      </span>
                    )}
                    {v.devolvido_em && (
                      <span>
                        Devolvida: {new Date(v.devolvido_em).toLocaleString("pt-BR")} —{" "}
                        {v.motivo_devolucao}
                      </span>
                    )}
                    {v.validado_em && (
                      <span>Validada: {new Date(v.validado_em).toLocaleString("pt-BR")}</span>
                    )}
                    {v.observacoes_validacao && (
                      <span>Observações da validação: {v.observacoes_validacao}</span>
                    )}
                    {v.publicado_em && (
                      <span>Publicada: {new Date(v.publicado_em).toLocaleString("pt-BR")}</span>
                    )}
                    {v.substituido_em && (
                      <span>Substituída: {new Date(v.substituido_em).toLocaleString("pt-BR")}</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observações de análise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {observacoes.length === 0 && (
                <p className="text-muted-foreground">Nenhuma observação registrada.</p>
              )}
              {observacoes.map((o) => (
                <div key={o.id} className="rounded-md border p-2">
                  <div className="text-xs text-muted-foreground">
                    v{o.versao} ·{" "}
                    {o.tipo === "devolucao" ? "Devolução (visível ao Promotor)" : "Interna"} ·{" "}
                    {o.campo_codigo ??
                      (o.secao
                        ? `Bloco ${SECOES.find((s) => s.id === o.secao)?.label}`
                        : "Geral")}{" "}
                    · {new Date(o.criado_em).toLocaleString("pt-BR")}
                  </div>
                  {o.texto}
                </div>
              ))}
              {ehAtual && (
                <div className="space-y-2 border-t pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium">
                      Nova observação interna (não visível ao Promotor)
                    </span>
                    <Select
                      value={notaInterna.secao}
                      onValueChange={(v) => setNotaInterna((n) => ({ ...n, secao: v }))}
                    >
                      <SelectTrigger className="h-8 w-[180px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="geral">Geral</SelectItem>
                        {secoes.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <textarea
                    className={textarea}
                    value={notaInterna.texto}
                    onChange={(e) => setNotaInterna((n) => ({ ...n, texto: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!notaInterna.texto.trim() || ocupado}
                    onClick={registrarNota}
                  >
                    Registrar observação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trilha de auditoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {auditoria.map((a) => (
                  <li key={a.id} className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.data_registro).toLocaleString("pt-BR")}
                    </span>
                    <span>{ACOES_AUDITORIA[a.acao] ?? a.acao}</span>
                    {a.versao && (
                      <span className="text-xs text-muted-foreground">(v{a.versao})</span>
                    )}
                    {a.acao === "publicacao_falhou" && a.valor_novo && (
                      <span className="text-xs text-destructive">
                        {String(a.valor_novo.erro ?? "")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dlgDevolver} onOpenChange={setDlgDevolver}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Devolver para correção</DialogTitle>
            <DialogDescription>
              O Promotor verá o motivo e os comentários abaixo. A devolução não altera os dados
              publicados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <label className="font-medium">
              Motivo da devolução <span className="text-destructive">*</span>
            </label>
            <textarea
              className={textarea}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <div>
              <div className="mb-1 font-medium">Comentários vinculados a blocos e campos</div>
              {Object.keys(comentarios).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum. Use o ícone de comentário ao lado de cada campo na aba Respostas.
                </p>
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-xs">
                  {Object.entries(comentarios).map(([k, c]) => (
                    <li key={k}>
                      <strong>
                        {c.campo
                          ? dicionarioDiagnostico.find((d) => d.codigo_tecnico === c.campo)?.rotulo
                          : `Bloco ${SECOES.find((s) => s.id === c.secao)?.label}`}
                        :
                      </strong>{" "}
                      {c.texto}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgDevolver(false)}>
              Cancelar
            </Button>
            <Button onClick={devolver} disabled={!motivo.trim() || ocupado}>
              Devolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dlgValidar} onOpenChange={setDlgValidar}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>
              {podeRepublicar ? "Publicar versão validada" : "Validar e publicar"}
            </DialogTitle>
            <DialogDescription>
              Confira os dados abaixo. Após a confirmação, as informações aprovadas passarão a
              integrar a base pública e o painel "Acessar painel".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid gap-1 rounded-md border bg-muted/20 p-3 sm:grid-cols-2">
              <div>
                <strong>Município:</strong> {diag.municipio}
              </div>
              <div>
                <strong>Promotoria:</strong> {diag.promotoria_nome}
              </div>
              <div>
                <strong>Período:</strong> {diag.periodo_referencia} ({previa?.carater})
              </div>
              <div>
                <strong>Versão:</strong> {versao.numero}{" "}
                <span className="font-mono text-[10px]">({versao.hash_conteudo.slice(0, 10)})</span>
              </div>
            </div>

            <div>
              <div className="mb-1 font-medium">
                Resumo das alterações na base pública ({alteracoes.length})
              </div>
              {alteracoes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum valor publicado será modificado (os dados aprovados serão registrados).
                </p>
              ) : (
                <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
                  {alteracoes.map((i) => (
                    <li key={i.campo_destino}>
                      <span className="font-mono">{i.campo_destino}</span>:{" "}
                      {i.valor_publicado_atual ?? "sem informação"} →{" "}
                      <strong>{i.valor_novo}</strong>
                      {!i.atualiza_painel && " (período anterior ao vigente: só registrado)"}
                      {i.afeta_score && (
                        <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px]">
                          variável do score
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {afetaScore.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 p-3 text-xs">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                {afetaScore.length} alteração(ões) modifica(m) variáveis estruturais do score de
                risco (OPM/CREAS). A fórmula e os pesos não mudam, mas a classificação de risco do
                município pode mudar.
              </div>
            )}

            {conflitos.length > 0 && (
              <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs">
                <div className="font-medium text-destructive">
                  Conflitos com dados aprovados de outra unidade — confirme cada substituição
                  expressamente:
                </div>
                {conflitos.map((i) => (
                  <label key={i.campo_destino} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4"
                      checked={conflitosOk.includes(i.campo_destino)}
                      onChange={(e) =>
                        setConflitosOk((c) =>
                          e.target.checked
                            ? [...c, i.campo_destino]
                            : c.filter((x) => x !== i.campo_destino),
                        )
                      }
                    />
                    <span>
                      <span className="font-mono">{i.campo_destino}</span> ({i.periodo}):{" "}
                      {i.conflito?.promotoria} aprovou "{i.conflito?.valor ?? "—"}"; esta versão
                      propõe "{i.valor_novo}".
                    </span>
                  </label>
                ))}
              </div>
            )}

            {!podeRepublicar && (
              <div className="space-y-1">
                <label className="font-medium">Observações da validação</label>
                <textarea
                  className={textarea}
                  value={obsValidacao}
                  onChange={(e) => setObsValidacao(e.target.value)}
                />
              </div>
            )}

            <label className="flex items-start gap-2 rounded-md border p-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
              />
              <span>
                Confirmo que revisei integralmente a versão {versao.numero} deste diagnóstico e
                autorizo que os dados aprovados passem a integrar a base pública do BRIGID, mantida
                a classificação {previa?.carater} do período.
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgValidar(false)}>
              Cancelar
            </Button>
            <Button
              onClick={validarEPublicar}
              disabled={
                !confirmado ||
                ocupado ||
                conflitos.some((c) => !conflitosOk.includes(c.campo_destino))
              }
            >
              {podeRepublicar ? "Publicar" : "Validar e publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditorComentario({
  inicial,
  onSalvar,
}: {
  inicial: string;
  onSalvar: (t: string) => void;
}) {
  const [t, setT] = useState(inicial);
  return (
    <div className="mt-2 space-y-1">
      <textarea
        className={textarea}
        value={t}
        onChange={(e) => setT(e.target.value)}
        placeholder="Comentário para o Promotor"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSalvar(t.trim())}>
          Guardar comentário
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onSalvar(inicial)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function TabelaPrevia({ previa }: { previa: PreviaPublicacao }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campo do painel</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Publicado hoje</TableHead>
            <TableHead>Proposto</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead>Painéis afetados</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {previa.itens.map((i) => (
            <TableRow key={i.campo_destino}>
              <TableCell className="font-mono text-xs">
                {i.campo_destino}
                {i.afeta_score && (
                  <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px]">
                    score
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-xs">
                {i.codigo}
                {i.valor_original && (
                  <div className="text-muted-foreground">
                    {rotuloResposta(i.codigo, tryParse(i.valor_original))}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-xs">
                {i.valor_publicado_atual ?? (
                  <em className="text-muted-foreground">sem informação</em>
                )}
              </TableCell>
              <TableCell className="text-xs font-medium">
                {i.ignorado ? "—" : i.valor_novo}
              </TableCell>
              <TableCell className="text-xs">
                {i.ignorado ? (
                  <span className="text-muted-foreground">{i.ignorado}</span>
                ) : i.conflito ? (
                  <span className="text-destructive">
                    Conflito com {i.conflito.promotoria} ("{i.conflito.valor}")
                  </span>
                ) : i.altera ? (
                  <span className="text-foreground">Altera</span>
                ) : (
                  <span className="text-muted-foreground">Sem alteração</span>
                )}
                {!i.ignorado && !i.atualiza_painel && (
                  <div className="text-muted-foreground">Período anterior: só registrado</div>
                )}
                <div className="text-muted-foreground">
                  {i.carater}
                  {i.confiabilidade
                    ? ` · ${rotuloResposta(`${i.codigo.slice(0, 3)}_CONFIABILIDADE`, i.confiabilidade)}`
                    : ""}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{i.painel}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function tryParse(v: string): unknown {
  try {
    return v.startsWith("[") ? JSON.parse(v) : v;
  } catch {
    return v;
  }
}
