import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Lock,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  dicionarioDiagnostico,
  ATRIBUICOES,
  SECOES,
  VALOR_NAO_SABE,
  sufixoJustificativa,
  rotuloAtribuicao,
  type CampoDicionario,
  type SecaoId,
} from "@/lib/dicionario-diagnostico";
import {
  calcularCompletude,
  campoVisivel,
  etapaInicial,
  sanitizarRespostas,
  secoesAplicaveis,
  MOTIVO_PENDENCIA,
  type Respostas,
} from "@/lib/completude-diagnostico";
import {
  diagnosticoService,
  STATUS_DIAGNOSTICO,
  STATUS_EDITAVEIS,
  CONDICOES_RESPONSAVEL,
  rotuloCondicao,
  type CondicaoResponsavel,
  type Responsavel,
  type AnexoDiagnostico,
  type DiagnosticoResumo,
  type ObservacaoDiagnostico,
  type VersaoDiagnostico,
} from "@/services/diagnostico-service";
import {
  promotoriasService,
  type PromotoriaMunicipio,
  type Vinculo,
} from "@/services/promotorias-service";
import { useApp } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// Ciclos aceitos; anos a partir de 2026 são preliminares (RISK_MODEL_CONFIG.anosParciais)
const PERIODOS = [
  { value: "2026", label: "2026 (ciclo aberto — preliminar)" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
];

interface FormularioDiagnosticoProps {
  diagnosticoId?: string;
}

// Última etapa aberta de cada diagnóstico, só neste navegador (conveniência de navegação; as
// respostas ficam no banco). Falhas de armazenamento são ignoradas.
const chaveEtapa = (id: string) => `brigid_etapa_${id}`;
function lerEtapa(id: string): string | null {
  try {
    return localStorage.getItem(chaveEtapa(id));
  } catch {
    return null;
  }
}
function gravarEtapa(id: string, etapa: string) {
  try {
    localStorage.setItem(chaveEtapa(id), etapa);
  } catch {
    // sem armazenamento local: reabre pela primeira pendência
  }
}

export function FormularioDiagnostico({ diagnosticoId }: FormularioDiagnosticoProps) {
  const navigate = useNavigate();
  const { userRole } = useApp();
  const isNew = !diagnosticoId;

  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [confirmarEnvio, setConfirmarEnvio] = useState(false);
  const [activeTab, setActiveTab] = useState<SecaoId>("identificacao");

  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [municipios, setMunicipios] = useState<PromotoriaMunicipio[]>([]);

  const [diag, setDiag] = useState<DiagnosticoResumo | null>(null);
  const [versao, setVersao] = useState<VersaoDiagnostico | null>(null);
  const [observacoes, setObservacoes] = useState<ObservacaoDiagnostico[]>([]);
  const [anexos, setAnexos] = useState<AnexoDiagnostico[]>([]);

  // Identificação (novo diagnóstico)
  const [promotoriaId, setPromotoriaId] = useState("");
  const [codigoIbge, setCodigoIbge] = useState("");
  const [periodo, setPeriodo] = useState("2026");
  const [atribuicao, setAtribuicao] = useState<string[]>([]);
  const [respostas, setRespostas] = useState<Respostas>({});
  // Quem responde pela conta institucional da Promotoria neste diagnóstico
  const [respNome, setRespNome] = useState("");
  const [respCondicao, setRespCondicao] = useState<CondicaoResponsavel | "">("");
  const [declaracao, setDeclaracao] = useState(false);

  const vinculo = vinculos.find((v) => v.promotoria_id === (diag?.promotoria_id ?? promotoriaId));
  const atribuicaoPendente = vinculo?.tipo_atribuicao === "pendente_configuracao";

  // posicionar: só na abertura do diagnóstico; depois de salvar, a etapa atual é mantida
  const carregarDiagnostico = useCallback(
    async (id: string, posicionar = false) => {
      const [d, vs, obs, ax] = await Promise.all([
        diagnosticoService.obter(id),
        diagnosticoService.versoes(id),
        diagnosticoService.observacoes(id),
        diagnosticoService.anexos(id),
      ]);
      if (!d) {
        toast.error("Diagnóstico não encontrado ou sem permissão de acesso.");
        navigate({ to: "/diagnostico-brigid/meus-diagnosticos" });
        return;
      }
      const atual = vs.find((v) => v.numero === d.versao_atual) ?? null;
      setDiag(d);
      setVersao(atual);
      setObservacoes(obs);
      setAnexos(ax);
      setAtribuicao(d.atribuicao);
      setRespostas(atual?.respostas ?? {});
      setRespNome(d.responsavel_nome ?? "");
      setRespCondicao(d.responsavel_condicao ?? "");
      if (posicionar) {
        setActiveTab(
          etapaInicial(
            atual?.respostas ?? {},
            {
              promotoria_id: d.promotoria_id,
              codigo_ibge: d.codigo_ibge,
              atribuicao: d.atribuicao,
              periodo_referencia: d.periodo_referencia,
            },
            lerEtapa(id),
          ),
        );
      }
    },
    [navigate],
  );

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErroCarregamento(null);
    (async () => {
      try {
        const vs = await promotoriasService.meusVinculos();
        if (!ativo) return;
        setVinculos(vs);
        if (diagnosticoId) {
          await carregarDiagnostico(diagnosticoId, true);
        } else if (vs.length === 1) {
          await selecionarPromotoria(vs[0].promotoria_id, vs);
        }
      } catch (e) {
        // Sem os dados completos, o formulário não é exibido (evita editar sobre uma tela vazia)
        if (ativo) setErroCarregamento((e as Error).message);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnosticoId, tentativa]);

  // Guarda a etapa aberta para retomar dela
  useEffect(() => {
    if (diag?.id) gravarEtapa(diag.id, activeTab);
  }, [diag?.id, activeTab]);

  const selecionarPromotoria = async (pid: string, lista = vinculos) => {
    const v = lista.find((x) => x.promotoria_id === pid);
    setPromotoriaId(pid);
    setCodigoIbge("");
    setAtribuicao(v && v.tipo_atribuicao !== "pendente_configuracao" ? [v.tipo_atribuicao] : []);
    const muns = await promotoriasService.listarMunicipiosDaPromotoria(pid);
    setMunicipios(muns);
    if (muns.length === 1) setCodigoIbge(muns[0].codigo_ibge);
  };

  const status = diag?.status ?? "em_preenchimento";
  const editavel =
    !!vinculo &&
    (isNew || (STATUS_EDITAVEIS.includes(status) && versao?.numero === diag?.versao_atual));

  const identificacao = {
    promotoria_id: diag?.promotoria_id ?? promotoriaId,
    codigo_ibge: diag?.codigo_ibge ?? codigoIbge,
    atribuicao,
    periodo_referencia: diag?.periodo_referencia ?? periodo,
  };
  const completude = useMemo(
    () => calcularCompletude(respostas, identificacao),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [respostas, atribuicao, promotoriaId, codigoIbge, periodo, diag],
  );
  const secoesVisiveis = SECOES.filter((s) => secoesAplicaveis(atribuicao).includes(s.id));
  const indiceAtual = secoesVisiveis.findIndex((s) => s.id === activeTab);

  // Observações de devolução da versão atual, por campo
  const devolucoes = observacoes.filter(
    (o) => o.tipo === "devolucao" && o.versao === diag?.versao_atual,
  );
  const motivoGeral = devolucoes.find((o) => !o.campo_codigo && !o.secao);
  const porCampo = new Map(
    devolucoes.filter((o) => o.campo_codigo).map((o) => [o.campo_codigo!, o.texto]),
  );
  const porSecao = new Map(
    devolucoes.filter((o) => o.secao && !o.campo_codigo).map((o) => [o.secao!, o.texto]),
  );

  const alterarResposta = (codigo: string, valor: unknown) => {
    setRespostas((prev) => ({ ...prev, [codigo]: valor }));
  };

  const responsavelValido = respNome.trim().length >= 3 && respCondicao !== "";
  const responsavel = (): Responsavel => ({
    nome: respNome.trim(),
    condicao: respCondicao as CondicaoResponsavel,
  });
  const responsavelAlterado =
    !!diag &&
    responsavelValido &&
    (respNome.trim() !== (diag.responsavel_nome ?? "") ||
      respCondicao !== (diag.responsavel_condicao ?? ""));

  const salvar = async (): Promise<string | null> => {
    if (!editavel) return null;
    if (!responsavelValido) {
      toast.error(
        "Informe o nome e a condição do(a) Promotor(a) responsável na aba Identificação.",
      );
      setActiveTab("identificacao");
      return null;
    }
    setSalvando(true);
    try {
      let id = diag?.id;
      if (!id) {
        if (!promotoriaId || !codigoIbge || !periodo || atribuicao.length === 0) {
          toast.error("Informe Promotoria, município, período e atribuição antes de salvar.");
          return null;
        }
        try {
          id = await diagnosticoService.criar(
            promotoriaId,
            codigoIbge,
            periodo,
            responsavel(),
            atribuicaoPendente ? atribuicao : undefined,
          );
        } catch (e) {
          const existente = (e as Error & { diagnosticoExistente?: string }).diagnosticoExistente;
          if (existente) {
            toast.error(
              "Já existe diagnóstico desta Promotoria para o município e período. Abrindo o existente.",
            );
            navigate({
              to: "/diagnostico-brigid/formulario/$diagnosticoId",
              params: { diagnosticoId: existente },
            });
            return null;
          }
          throw e;
        }
      }
      const limpas = sanitizarRespostas(respostas, atribuicao);
      await diagnosticoService.salvarRascunho(
        id,
        limpas,
        atribuicaoPendente && status === "em_preenchimento" ? atribuicao : undefined,
        responsavelAlterado ? responsavel() : undefined,
      );
      toast.success("Rascunho salvo. Nenhuma informação foi publicada.");
      if (isNew) {
        navigate({
          to: "/diagnostico-brigid/formulario/$diagnosticoId",
          params: { diagnosticoId: id },
        });
      } else {
        await carregarDiagnostico(id);
      }
      return id;
    } catch (e) {
      toast.error("Erro ao salvar: " + (e as Error).message);
      return null;
    } finally {
      setSalvando(false);
    }
  };

  const enviar = async () => {
    setConfirmarEnvio(false);
    const id = await salvar();
    if (!id) return;
    try {
      await diagnosticoService.enviar(id, responsavel());
      toast.success("Diagnóstico enviado para análise do CAOCRIM.");
      navigate({ to: "/diagnostico-brigid/meus-diagnosticos" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const novaVersao = async () => {
    if (!diag) return;
    try {
      const n = await diagnosticoService.novaVersao(diag.id);
      toast.success(
        `Versão ${n} criada. A versão publicada continua no painel até nova aprovação.`,
      );
      await carregarDiagnostico(diag.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const enviarAnexo = async (secao: SecaoId, arquivo: File) => {
    if (!diag) {
      toast.error("Salve o rascunho antes de anexar documentos.");
      return;
    }
    try {
      await diagnosticoService.enviarAnexo(diag.id, secao, arquivo);
      setAnexos(await diagnosticoService.anexos(diag.id));
      toast.success("Anexo incluído (uso interno, não é publicado).");
    } catch (e) {
      toast.error("Erro ao anexar: " + (e as Error).message);
    }
  };

  const removerAnexo = async (a: AnexoDiagnostico) => {
    if (!diag) return;
    try {
      await diagnosticoService.removerAnexo(a.id);
      setAnexos(await diagnosticoService.anexos(diag.id));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const abrirAnexo = async (a: AnexoDiagnostico) => {
    try {
      window.open(await diagnosticoService.urlAnexo(a.storage_path), "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (carregando) {
    return <div className="p-8 text-center text-muted-foreground">Carregando formulário...</div>;
  }

  if (erroCarregamento) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center text-sm">
          <p className="font-medium text-foreground">Não foi possível abrir o diagnóstico.</p>
          <p className="text-muted-foreground">{erroCarregamento}</p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/diagnostico-brigid/meus-diagnosticos" })}
            >
              Voltar a Meus Diagnósticos
            </Button>
            <Button onClick={() => setTentativa((n) => n + 1)}>Tentar novamente</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (vinculos.length === 0 && userRole !== "admin") {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Esta conta ainda não está vinculada a nenhuma Promotoria de Justiça. Solicite o vínculo ao
          CAOCRIM.
        </CardContent>
      </Card>
    );
  }

  const municipioLabel =
    diag?.municipio ?? municipios.find((m) => m.codigo_ibge === codigoIbge)?.municipio;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>
            {isNew ? "Novo Diagnóstico" : `${diag?.municipio} — ${diag?.promotoria_nome}`}
          </CardTitle>
          {diag && (
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">Versão {diag.versao_atual}</Badge>
              <Badge className={STATUS_DIAGNOSTICO[status].className}>
                {STATUS_DIAGNOSTICO[status].label}
              </Badge>
              <Badge variant="outline">
                {diag.versao_publicada
                  ? `Publicação: versão ${diag.versao_publicada} no painel`
                  : "Publicação: não publicado"}
              </Badge>
            </div>
          )}
        </div>

        {status === "devolvido" && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Devolvido para correção pelo CAOCRIM
            </div>
            {motivoGeral && <p className="mt-2 text-foreground">{motivoGeral.texto}</p>}
            {(porCampo.size > 0 || porSecao.size > 0) && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {[...porSecao].map(([s, t]) => (
                  <li key={s}>
                    <strong>Bloco {SECOES.find((x) => x.id === s)?.label ?? s}:</strong> {t}
                  </li>
                ))}
                {[...porCampo].map(([c, t]) => (
                  <li key={c}>
                    <strong>
                      {dicionarioDiagnostico.find((x) => x.codigo_tecnico === c)?.rotulo ?? c}:
                    </strong>{" "}
                    {t}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Corrija os pontos indicados e reenvie. Os dados já publicados no painel não são
              alterados por esta devolução.
            </p>
          </div>
        )}

        {diag && !editavel && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/30 p-4 text-sm">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              {status === "enviado" &&
                "Enviado para análise. A edição fica bloqueada até a manifestação do CAOCRIM."}
              {status === "em_analise" && "Em análise pelo CAOCRIM. A edição fica bloqueada."}
              {status === "validado" && "Validado pelo CAOCRIM; publicação em processamento."}
              {status === "publicado" && "Esta versão está publicada no painel público."}
              {!vinculo && "Somente leitura: esta conta não está vinculada a esta Promotoria."}
            </div>
            {status === "publicado" && vinculo && (
              <Button size="sm" variant="outline" onClick={novaVersao}>
                Abrir nova versão para atualização
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SecaoId)}>
          <TabsList className="mb-4 flex h-auto flex-wrap">
            {secoesVisiveis.map((s) => {
              const pc = completude.porSecao[s.id]?.percentual ?? 100;
              return (
                <TabsTrigger key={s.id} value={s.id} className="gap-1.5">
                  {s.label}
                  {pc === 100 ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--color-success)]" />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">{pc}%</span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Completude dos requisitos obrigatórios aplicáveis ({completude.preenchidos}/
                {completude.total})
              </span>
              <span className="font-medium">{completude.percentual}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${completude.percentual}%` }}
              />
            </div>
            {completude.pendencias.length > 0 && editavel && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer select-none">
                  {completude.pendencias.length} pendência(s) obrigatória(s)
                </summary>
                <ul className="mt-2 space-y-1">
                  {completude.pendencias.map((p) => (
                    <li key={p.codigo}>
                      <button
                        type="button"
                        className="text-left hover:underline"
                        onClick={() => setActiveTab(p.secao)}
                      >
                        [{SECOES.find((s) => s.id === p.secao)?.label}] {p.rotulo} —{" "}
                        {MOTIVO_PENDENCIA[p.motivo]}
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {secoesVisiveis.map((s) => (
            <TabsContent key={s.id} value={s.id} className="space-y-4">
              {s.id === "identificacao" && (
                <div className="mb-8 space-y-6 rounded-lg border bg-muted/10 p-6">
                  {isNew ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Promotoria de Justiça respondente{" "}
                          <span className="text-destructive">*</span>
                        </label>
                        <Select value={promotoriaId} onValueChange={(v) => selecionarPromotoria(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma das Promotorias vinculadas ao seu usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            {vinculos.map((v) => (
                              <SelectItem key={v.promotoria_id} value={v.promotoria_id}>
                                {v.nome} — Comarca de {v.comarca_sede}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {promotoriaId && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Município avaliado <span className="text-destructive">*</span>
                          </label>
                          <Select
                            value={codigoIbge}
                            onValueChange={setCodigoIbge}
                            disabled={municipios.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  municipios.length === 0
                                    ? "Nenhum município vinculado"
                                    : "Selecione o município"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {municipios.map((m) => (
                                <SelectItem key={m.codigo_ibge} value={m.codigo_ibge}>
                                  {m.municipio}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {municipios.length === 0 && (
                            <p className="mt-1 text-sm text-destructive">
                              Não há municípios vinculados a esta Promotoria. Contate o CAOCRIM.
                            </p>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Período de referência <span className="text-destructive">*</span>
                        </label>
                        <Select value={periodo} onValueChange={setPeriodo}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PERIODOS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : null}

                  {(isNew ? promotoriaId : diag) &&
                    atribuicaoPendente &&
                    editavel &&
                    status === "em_preenchimento" && (
                      <div className="space-y-2 rounded-md border border-warning/50 bg-warning/10 p-4">
                        <label className="text-sm font-medium text-warning-foreground">
                          A atribuição funcional desta Promotoria ainda não foi configurada pelo
                          CAOCRIM. Declare a atribuição aplicável; ela será conferida na análise.
                        </label>
                        <Select
                          value={atribuicao[0] ?? ""}
                          onValueChange={(v) => setAtribuicao([v])}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione a atribuição..." />
                          </SelectTrigger>
                          <SelectContent>
                            {ATRIBUICOES.map((a) => (
                              <SelectItem key={a.value} value={a.value}>
                                {a.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                  {(isNew ? promotoriaId : diag) && (
                    <div className="space-y-3 rounded-md border bg-background p-4">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Promotor(a) de Justiça responsável{" "}
                          <span className="text-destructive">*</span>
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          O acesso é feito pela conta institucional da Promotoria. Identifique quem
                          responde por este diagnóstico; em caso de substituição ou mudança de
                          titular, atualize estes dados antes do envio.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                        <Input
                          placeholder="Nome completo"
                          value={respNome}
                          disabled={!editavel}
                          onChange={(e) => setRespNome(e.target.value)}
                        />
                        <Select
                          value={respCondicao}
                          disabled={!editavel}
                          onValueChange={(v) => setRespCondicao(v as CondicaoResponsavel)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Condição" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDICOES_RESPONSAVEL.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {(diag || codigoIbge) && (
                    <div className="space-y-2 rounded-md border bg-background p-4 text-sm">
                      <h4 className="mb-3 font-semibold text-foreground">
                        Resumo da identificação
                      </h4>
                      <div className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-2">
                        <div>
                          <strong className="text-foreground">Promotoria:</strong>{" "}
                          {diag?.promotoria_nome ?? vinculo?.nome}
                        </div>
                        <div>
                          <strong className="text-foreground">Município:</strong> {municipioLabel}
                        </div>
                        <div>
                          <strong className="text-foreground">Código IBGE:</strong>{" "}
                          {identificacao.codigo_ibge}
                        </div>
                        <div>
                          <strong className="text-foreground">Período:</strong>{" "}
                          {identificacao.periodo_referencia}
                        </div>
                        <div>
                          <strong className="text-foreground">Atribuição:</strong>{" "}
                          {atribuicao.length
                            ? atribuicao.map(rotuloAtribuicao).join(", ")
                            : "Pendente"}
                        </div>
                        <div>
                          <strong className="text-foreground">Responsável:</strong>{" "}
                          {respNome ? `${respNome} (${rotuloCondicao(respCondicao)})` : "—"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {porSecao.get(s.id) && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  Observação do CAOCRIM para este bloco: {porSecao.get(s.id)}
                </div>
              )}

              {atribuicao.length > 0 && (
                <div className="grid gap-6">
                  {dicionarioDiagnostico
                    .filter((campo) => campo.secao === s.id && campoVisivel(campo, respostas))
                    .map((campo) => (
                      <CampoFormulario
                        key={campo.id}
                        campo={campo}
                        respostas={respostas}
                        onChange={alterarResposta}
                        disabled={!editavel}
                        devolucao={porCampo.get(campo.codigo_tecnico)}
                        pendente={
                          completude.pendencias.find((p) => p.codigo === campo.codigo_tecnico)
                            ?.motivo
                        }
                      />
                    ))}
                </div>
              )}

              {s.id !== "identificacao" && (
                <AnexosBloco
                  anexos={anexos.filter((a) => a.secao === s.id)}
                  podeEditar={editavel && !!diag}
                  versaoAtual={diag?.versao_atual}
                  onEnviar={(f) => enviarAnexo(s.id, f)}
                  onRemover={removerAnexo}
                  onAbrir={abrirAnexo}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      <CardFooter className="mt-4 flex flex-wrap justify-between gap-2 border-t bg-muted/10 p-4">
        <Button variant="outline" onClick={() => navigate({ to: "/diagnostico-brigid" })}>
          Voltar
        </Button>
        {editavel && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => salvar()} disabled={salvando}>
              Salvar rascunho
            </Button>
            {indiceAtual < secoesVisiveis.length - 1 ? (
              <Button onClick={() => setActiveTab(secoesVisiveis[indiceAtual + 1].id)}>
                Avançar
              </Button>
            ) : (
              <Button
                onClick={() => setConfirmarEnvio(true)}
                disabled={salvando || completude.percentual < 100}
                title={
                  completude.percentual < 100
                    ? "O envio requer 100% dos requisitos obrigatórios aplicáveis"
                    : undefined
                }
              >
                Enviar para análise
              </Button>
            )}
          </div>
        )}
      </CardFooter>

      <AlertDialog
        open={confirmarEnvio}
        onOpenChange={(o) => {
          setConfirmarEnvio(o);
          if (!o) setDeclaracao(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar diagnóstico para análise?</AlertDialogTitle>
            <AlertDialogDescription>
              Após o envio, a edição fica bloqueada até a análise do CAOCRIM. O envio não publica
              dados: as informações só passam ao painel público após validação expressa do CAOCRIM.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
              <Input
                placeholder="Nome do(a) Promotor(a) responsável"
                value={respNome}
                onChange={(e) => setRespNome(e.target.value)}
              />
              <Select
                value={respCondicao}
                onValueChange={(v) => setRespCondicao(v as CondicaoResponsavel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Condição" />
                </SelectTrigger>
                <SelectContent>
                  {CONDICOES_RESPONSAVEL.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-start gap-2 rounded-md border p-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={declaracao}
                onChange={(e) => setDeclaracao(e.target.checked)}
              />
              <span>
                Declaro que sou {respNome.trim() || "[nome]"},{" "}
                {respCondicao ? rotuloCondicao(respCondicao).toLowerCase() : "[condição]"} da{" "}
                {diag?.promotoria_nome ?? vinculo?.nome}, e que as informações deste diagnóstico
                foram revisadas por mim.
              </span>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={enviar} disabled={!declaracao || !responsavelValido}>
              Confirmar envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

interface CampoFormularioProps {
  campo: CampoDicionario;
  respostas: Respostas;
  onChange: (codigo: string, valor: unknown) => void;
  disabled: boolean;
  devolucao?: string;
  pendente?: string;
}

function CampoFormulario({
  campo,
  respostas,
  onChange,
  disabled,
  devolucao,
  pendente,
}: CampoFormularioProps) {
  const codigo = campo.codigo_tecnico;
  const valor = respostas[codigo];
  const naoSabe = valor === VALOR_NAO_SABE;
  const texto = typeof valor === "string" || typeof valor === "number" ? String(valor) : "";

  return (
    <div
      className={cn(
        "space-y-2",
        devolucao && "rounded-md border border-destructive/50 bg-destructive/5 p-3",
      )}
    >
      <label className="text-sm font-medium">
        {campo.rotulo} {campo.obrigatorio && <span className="text-destructive">*</span>}
      </label>
      {campo.descricao && <p className="text-xs text-muted-foreground">{campo.descricao}</p>}
      {devolucao && <p className="text-xs font-medium text-destructive">CAOCRIM: {devolucao}</p>}

      {campo.tipo_controle === "select" && (
        <Select value={texto} onValueChange={(v) => onChange(codigo, v)} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {campo.opcoes?.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {(campo.tipo_controle === "text" || campo.tipo_controle === "date") && (
        <Input
          type={campo.tipo_controle}
          value={texto}
          disabled={disabled}
          onChange={(e) => onChange(codigo, e.target.value)}
        />
      )}

      {campo.tipo_controle === "number" && (
        <div className="flex flex-wrap items-center gap-4">
          <Input
            type="number"
            min={0}
            step={1}
            className="max-w-[200px]"
            disabled={disabled || naoSabe}
            value={naoSabe ? "" : texto}
            onChange={(e) => onChange(codigo, e.target.value === "" ? "" : Number(e.target.value))}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              disabled={disabled}
              checked={naoSabe}
              onChange={(e) => onChange(codigo, e.target.checked ? VALOR_NAO_SABE : "")}
            />
            Não soube informar
          </label>
        </div>
      )}

      {campo.tipo_controle === "textarea" && (
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-70"
          value={texto}
          disabled={disabled}
          onChange={(e) => onChange(codigo, e.target.value)}
        />
      )}

      {campo.tipo_controle === "checkbox_group" && (
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          {campo.opcoes?.map((op) => {
            const selecionados = (Array.isArray(valor) ? valor : []) as string[];
            return (
              <label key={op.value} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  checked={selecionados.includes(op.value)}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(
                      codigo,
                      e.target.checked
                        ? [...selecionados, op.value]
                        : selecionados.filter((v) => v !== op.value),
                    )
                  }
                />
                <span>{op.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {naoSabe && (
        <div className="space-y-1 pl-3">
          <label className="text-xs font-medium">
            Justificativa para "Não soube informar" <span className="text-destructive">*</span>
          </label>
          <textarea
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={String(respostas[codigo + sufixoJustificativa] ?? "")}
            disabled={disabled}
            placeholder="Explique por que a informação não pôde ser obtida (ex.: ofício sem resposta)"
            onChange={(e) => onChange(codigo + sufixoJustificativa, e.target.value)}
          />
        </div>
      )}

      {pendente && !disabled && (
        <p className="text-[11px] text-muted-foreground">
          {MOTIVO_PENDENCIA[pendente as keyof typeof MOTIVO_PENDENCIA]}
        </p>
      )}
    </div>
  );
}

interface AnexosBlocoProps {
  anexos: AnexoDiagnostico[];
  podeEditar: boolean;
  versaoAtual?: number;
  onEnviar: (f: File) => void;
  onRemover: (a: AnexoDiagnostico) => void;
  onAbrir: (a: AnexoDiagnostico) => void;
}

export function AnexosBloco({
  anexos,
  podeEditar,
  versaoAtual,
  onEnviar,
  onRemover,
  onAbrir,
}: AnexosBlocoProps) {
  return (
    <div className="mt-6 space-y-2 rounded-md border border-dashed p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4" /> Anexos do bloco
          <span className="text-xs font-normal text-muted-foreground">
            (uso interno — não publicados)
          </span>
        </span>
        {podeEditar && (
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs hover:bg-accent">
            <Upload className="h-3.5 w-3.5" /> Anexar arquivo
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onEnviar(f);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      {anexos.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum anexo.</p>
      ) : (
        <ul className="space-y-1">
          {anexos.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="flex items-center gap-2 text-left hover:underline"
                onClick={() => onAbrir(a)}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                {a.nome_arquivo}
                <span className="text-xs text-muted-foreground">(v{a.versao})</span>
              </button>
              {podeEditar && a.versao === versaoAtual && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemover(a)}
                  title="Remover anexo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
