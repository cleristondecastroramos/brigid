import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { dicionarioDiagnostico, SecaoId } from "@/lib/dicionario-diagnostico";
import { diagnosticoService, DiagnosticoFormModel } from "@/services/diagnostico-service";
import { promotoriasService } from "@/services/promotorias-service";
import { Promotoria, PromotoriaMunicipio } from "@/data/promotorias-seed";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SelecaoPromotoria } from "./SelecaoPromotoria";
import { toast } from "sonner";

interface FormularioDiagnosticoProps {
  isNew: boolean;
  diagnosticoId?: string;
}

export function FormularioDiagnostico({ isNew, diagnosticoId }: FormularioDiagnosticoProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [activeTab, setActiveTab] = useState<SecaoId>("identificacao");

  // Novo fluxo
  const [promotoriaObj, setPromotoriaObj] = useState<Promotoria | null>(null);
  const [municipiosVinculados, setMunicipiosVinculados] = useState<PromotoriaMunicipio[]>([]);
  const [loadingVinculos, setLoadingVinculos] = useState(false);

  const [formData, setFormData] = useState<Partial<DiagnosticoFormModel>>({
    respostas: {},
    atribuicao: [],
    status: 'rascunho',
  });

  useEffect(() => {
    if (!isNew && diagnosticoId) {
      diagnosticoService.getById(diagnosticoId).then(async (res) => {
        if (res) {
          setFormData(res);
          // Rehydrate promotoria state
          if (res.promotoria_id) {
            const p = await promotoriasService.buscarPromotoriaPorId(res.promotoria_id);
            if (p) setPromotoriaObj(p);
            const muns = await promotoriasService.listarMunicipiosDaPromotoria(res.promotoria_id);
            setMunicipiosVinculados(muns);
          }
        } else {
          toast.error("Diagnóstico não encontrado.");
          navigate({ to: "/diagnostico-brigid" });
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [isNew, diagnosticoId, navigate]);

  const handleChangePromotoria = async (pid: string) => {
    if (formData.promotoria_id && formData.promotoria_id !== pid) {
      const temRespostas = Object.keys(formData.respostas || {}).length > 0;
      if (temRespostas) {
        const confirmar = window.confirm("A alteração da Promotoria de Justiça modificará os municípios disponíveis e poderá alterar os blocos do diagnóstico conforme a atribuição funcional. Os dados territoriais vinculados à seleção atual serão redefinidos. Deseja continuar?");
        if (!confirmar) return;
      }
    }

    setLoadingVinculos(true);
    const p = await promotoriasService.buscarPromotoriaPorId(pid);
    const muns = await promotoriasService.listarMunicipiosDaPromotoria(pid);
    
    setPromotoriaObj(p || null);
    setMunicipiosVinculados(muns);
    setLoadingVinculos(false);

    let nextMun = "";
    let nextIbge = "";
    let nextComarca = "";
    let nextPolo = "";

    if (muns.length === 1) {
      nextMun = muns[0].municipio;
      nextIbge = muns[0].codigo_ibge;
      nextComarca = muns[0].comarca;
      nextPolo = muns[0].polo_regional;
    }

    setFormData(prev => ({
      ...prev,
      promotoria_id: pid,
      promotoria_nome: p?.nome,
      codigo_ibge: nextIbge,
      municipio: nextMun,
      comarca: nextComarca,
      polo_regional: nextPolo,
      atribuicao: p && p.tipo_atribuicao !== 'pendente_configuracao' ? [p.tipo_atribuicao] : [],
      respostas: prev.promotoria_id === pid ? prev.respostas : {} // limpa condicionais se trocar
    }));
  };

  const handleChangeMunicipio = (ibge: string) => {
    const mun = municipiosVinculados.find(m => m.codigo_ibge === ibge);
    if (mun) {
      setFormData(prev => ({
        ...prev,
        codigo_ibge: ibge,
        municipio: mun.municipio,
        comarca: mun.comarca,
        polo_regional: mun.polo_regional
      }));
    }
  };

  const handleSave = async (concluir = false) => {
    if (concluir) {
      if (!formData.promotoria_id) return toast.error("Selecione a Promotoria respondente.");
      if (!formData.codigo_ibge) return toast.error("Selecione o Município avaliado.");
      if (!formData.atribuicao || formData.atribuicao.length === 0) return toast.error("A atribuição funcional é obrigatória.");
    }

    try {
      const dataToSave = {
        ...formData,
        status: concluir ? 'concluido' : 'rascunho',
      } as DiagnosticoFormModel;
      
      const saved = await diagnosticoService.save(dataToSave);
      setFormData(saved);
      toast.success(`Diagnóstico ${concluir ? 'enviado' : 'salvo'} com sucesso!`);
      if (concluir) {
        navigate({ to: "/diagnostico-brigid/meus-diagnosticos" });
      } else if (isNew) {
        navigate({ to: `/diagnostico-brigid/formulario/${saved.id}` });
      }
    } catch (error) {
      toast.error("Erro ao salvar o diagnóstico.");
    }
  };

  const handleChangeResposta = (codigo: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      respostas: {
        ...(prev.respostas || {}),
        [codigo]: value
      }
    }));
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando formulário...</div>;

  const atribuicaoDefinida = formData.atribuicao && formData.atribuicao.length > 0;
  
  // Apenas libera os blocos baseado na atribuição
  const isCivel = formData.atribuicao?.includes('civel') || formData.atribuicao?.includes('unica');
  const isCriminal = formData.atribuicao?.includes('criminal') || formData.atribuicao?.includes('unica');

  const secoes = [
    { id: "identificacao" as SecaoId, label: "Identificação", visible: true },
    { id: "cidadania" as SecaoId, label: "Cidadania", visible: isCivel },
    { id: "fluxos" as SecaoId, label: "Fluxos", visible: isCivel },
    { id: "socioassistencial" as SecaoId, label: "Socioassistencial", visible: isCivel },
    { id: "penal_seguranca" as SecaoId, label: "Segurança", visible: isCriminal },
    { id: "penal_violencia" as SecaoId, label: "Violência", visible: isCriminal },
    { id: "gargalos" as SecaoId, label: "Gargalos", visible: isCriminal },
  ].filter(s => s.visible);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isNew ? "Novo Diagnóstico" : `Editando Diagnóstico ${formData.id}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SecaoId)}>
          <TabsList className="mb-4 flex flex-wrap h-auto">
            {secoes.map((s) => (
              <TabsTrigger key={s.id} value={s.id}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {secoes.map((s) => (
            <TabsContent key={s.id} value={s.id} className="space-y-4">
              
              {/* Special logic for the very first step: Identificação */}
              {s.id === 'identificacao' && (
                <div className="space-y-6 mb-8 p-6 bg-muted/10 border rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Promotoria de Justiça respondente <span className="text-destructive">*</span></label>
                    <SelecaoPromotoria
                      value={formData.promotoria_id}
                      onChange={handleChangePromotoria}
                    />
                  </div>

                  {formData.promotoria_id && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Município Avaliado <span className="text-destructive">*</span></label>
                      <Select
                        value={formData.codigo_ibge}
                        onValueChange={handleChangeMunicipio}
                        disabled={loadingVinculos || municipiosVinculados.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            loadingVinculos ? "Carregando municípios..." :
                            municipiosVinculados.length === 0 ? "Nenhum município vinculado" :
                            "Selecione o Município"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {municipiosVinculados.map(m => (
                            <SelectItem key={m.codigo_ibge} value={m.codigo_ibge}>
                              {m.municipio}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {municipiosVinculados.length === 0 && !loadingVinculos && (
                        <p className="text-sm text-destructive mt-1">
                          Não foram identificados municípios vinculados a esta Promotoria de Justiça. Verifique o cadastro de abrangência territorial ou contate o administrador do BRIGID.
                        </p>
                      )}
                    </div>
                  )}
                  
                  {formData.promotoria_id && promotoriaObj?.tipo_atribuicao === 'pendente_configuracao' && (
                    <div className="space-y-2 mt-4 p-4 border border-warning/50 bg-warning/10 rounded-md">
                      <label className="text-sm font-medium text-warning-foreground">
                        A atribuição funcional desta Promotoria ainda não está configurada. Selecione a atribuição aplicável para definir os blocos do diagnóstico.
                      </label>
                      <Select
                        value={formData.atribuicao?.[0] || ""}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, atribuicao: [val] }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Selecione a atribuição..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="civel">Cidadania/Cível</SelectItem>
                          <SelectItem value="criminal">Criminal</SelectItem>
                          <SelectItem value="cumulativa">Cumulativa</SelectItem>
                          <SelectItem value="unica">Promotoria Única</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.codigo_ibge && (
                    <div className="mt-6 bg-background p-4 rounded-md border text-sm space-y-2">
                      <h4 className="font-semibold text-foreground mb-3">Resumo Territorial Automático</h4>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <div><strong className="text-foreground">Promotoria:</strong> {formData.promotoria_nome}</div>
                        <div><strong className="text-foreground">Município:</strong> {formData.municipio}</div>
                        <div><strong className="text-foreground">Comarca:</strong> {formData.comarca}</div>
                        <div><strong className="text-foreground">Código IBGE:</strong> {formData.codigo_ibge}</div>
                        <div><strong className="text-foreground">Polo Regional:</strong> {formData.polo_regional}</div>
                        <div><strong className="text-foreground">Atribuição:</strong> {atribuicaoDefinida ? formData.atribuicao.join(', ') : 'Pendente'}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Render dictionary fields for this section */}
              {(!isNew || atribuicaoDefinida) && (
                <div className="grid gap-6">
                  {dicionarioDiagnostico
                    .filter((campo) => campo.secao === s.id)
                    .map((campo) => {
                      return (
                        <div key={campo.id} className="space-y-2">
                          <label className="text-sm font-medium">{campo.rotulo} {campo.obrigatorio && <span className="text-destructive">*</span>}</label>
                          {campo.descricao && (
                            <p className="text-xs text-muted-foreground">{campo.descricao}</p>
                          )}
                          
                          {campo.tipo_controle === 'select' && (
                            <Select
                              value={formData.respostas?.[campo.codigo_tecnico] || ''}
                              onValueChange={(v) => handleChangeResposta(campo.codigo_tecnico, v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {campo.opcoes?.map(op => (
                                  <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {campo.tipo_controle === 'number' && (
                            <Input
                              type="number"
                              value={formData.respostas?.[campo.codigo_tecnico] || ''}
                              onChange={(e) => handleChangeResposta(campo.codigo_tecnico, e.target.value)}
                            />
                          )}

                          {campo.tipo_controle === 'textarea' && (
                            <textarea
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={formData.respostas?.[campo.codigo_tecnico] || ''}
                              onChange={(e) => handleChangeResposta(campo.codigo_tecnico, e.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 mt-4 bg-muted/10">
        <Button variant="outline" onClick={() => navigate({ to: '/diagnostico-brigid' })}>
          Cancelar
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleSave(false)}>
            Salvar Rascunho
          </Button>
          <Button onClick={() => handleSave(true)}>
            Concluir / Enviar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
