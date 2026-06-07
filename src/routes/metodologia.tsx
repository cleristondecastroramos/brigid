import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  BookOpen, Building2, HeartHandshake, GraduationCap, AlertTriangle, 
  Calculator, FileText, CheckCircle2, Shield, Info, Database, Scale, 
  Eye, MonitorPlay, AlertCircle 
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/metodologia")({
  component: MetodologiaPage,
});

function MetodologiaPage() {
  return (
    <div className="space-y-12 max-w-[1000px] mx-auto pb-16 pt-8">
      {/* 1. APRESENTAÇÃO INSTITUCIONAL */}
      <section className="flex flex-col gap-4">

        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Nota Técnica Metodológica
        </h1>
        <p className="text-muted-foreground text-xl leading-relaxed font-medium">
          Governança Analítica e Rastreabilidade de Critérios do Sistema BRIGID.
        </p>
        <div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground mt-4 leading-relaxed text-justify">
          <p>
            O <strong>BRIGID — Feminicídio Zero</strong> é uma plataforma de monitoramento territorial e diagnóstico da rede de proteção, desenvolvida para apoiar o Ministério Público do Estado do Piauí (MPPI) na leitura estratégica da estrutura municipal, da maturidade dos fluxos e do risco territorial relacionado à violência de gênero e ao feminicídio.
          </p>
          <p>
            O sistema converte um vasto repositório de dados administrativos, estruturais e criminais em indicadores padronizados. Essa transformação permite a comparabilidade territorial, a priorização de intervenções, a visualização geográfica precisa e, em última instância, a indução de políticas públicas baseadas em evidências concretas.
          </p>
        </div>
      </section>

      {/* 2. PRINCÍPIOS METODOLÓGICOS */}
      <section>
        <Card className="border-border/60 shadow-sm bg-muted/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Princípios Metodológicos
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Diretrizes que fundamentam a modelagem e a conversão de dados do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">Padronização da Leitura</h4>
                  <p className="text-sm text-muted-foreground">Estabelecimento de critérios uniformes aplicáveis a todos os municípios, independentemente do porte populacional.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">Comparabilidade Territorial</h4>
                  <p className="text-sm text-muted-foreground">Transformação de dados heterogêneos em escalas normalizadas (0 a 10) para facilitar o contraste macrorregional.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">Transparência dos Pesos</h4>
                  <p className="text-sm text-muted-foreground">Abertura completa das fórmulas e da distribuição de relevância de cada variável na composição da nota final.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">Atualização Dinâmica</h4>
                  <p className="text-sm text-muted-foreground">Processamento contínuo dos escores à medida que a base de dados subjacente recebe atualizações e correções.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">Rastreabilidade</h4>
                  <p className="text-sm text-muted-foreground">Garantia de que qualquer nota ou alerta gerado pelo sistema possa ser auditado até a sua variável de origem.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-foreground">Orientação à Priorização</h4>
                  <p className="text-sm text-muted-foreground">O sistema fornece alertas e focalização preventiva, atuando de forma complementar — e não substitutiva — à análise técnica humana da Promotoria.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. BLOCOS COMPLETOS DOS ÍNDICES */}
      <div className="space-y-12">
        
        {/* === ÍNDICE DE ESTRUTURA DA REDE (IER) === */}
        <section>
          <Card className="border-border/60 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-border/40 pb-6 rounded-t-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl text-primary">Índice de Estrutura da Rede (IER)</CardTitle>
              </div>
              <CardDescription className="text-base font-medium text-foreground/80 mt-2">
                Indicador sintético destinado a medir a capacidade física e material mínima da rede local de proteção à mulher.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Definição Conceitual e Finalidade</h3>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  O <strong>IER</strong> traduz em uma escala numérica de 0 a 10 a robustez da infraestrutura instalada no município. Sua finalidade analítica é permitir o ranqueamento de municípios segundo sua adequação material, identificando "vazios institucionais" e orientando a priorização de providências ministeriais, pactuações e emissão de recomendações.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold">Variáveis de Entrada e Regra de Pontuação</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2">1. Sala Especializada</h4>
                    <p className="text-sm text-muted-foreground mb-3">Mede a existência de espaço privativo, reservado e adequado para acolhimento e atendimento.</p>
                    <div className="bg-background border rounded p-2 text-sm">
                      <span className="font-bold text-primary">Peso: 30%</span> (Máx. 3 pts)<br/>
                      <span className="text-muted-foreground">Sim = +3 pts | Não = 0 pts</span>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2">2. Recursos Mínimos</h4>
                    <p className="text-sm text-muted-foreground mb-3">Mede a disponibilidade de insumos básicos operacionais e de informática para funcionamento institucional.</p>
                    <div className="bg-background border rounded p-2 text-sm">
                      <span className="font-bold text-primary">Peso: 30%</span> (Máx. 3 pts)<br/>
                      <span className="text-muted-foreground">Sim = +3 pts | Não = 0 pts</span>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2">3. Suficiência da Estrutura</h4>
                    <p className="text-sm text-muted-foreground mb-3">Mede a adequação global da estrutura à demanda populacional local, categorizada em três níveis.</p>
                    <div className="bg-background border rounded p-2 text-sm">
                      <span className="font-bold text-primary">Peso: 40%</span> (Máx. 4 pts)<br/>
                      <span className="text-muted-foreground">Adequado = +4 pts<br/>Parcial = +2 pts<br/>Insuficiente = 0 pts</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold">Fórmula de Composição</h3>
                <div className="bg-muted/30 border border-border p-6 rounded-xl flex flex-col gap-4">
                  <div className="flex items-center gap-3 flex-wrap justify-center font-medium text-base">
                    <strong className="text-primary text-2xl font-black mr-2">IER</strong>
                    <span className="text-muted-foreground text-xl">=</span>
                    <span className="bg-background border border-border/60 px-4 py-2 rounded-lg shadow-sm">Sala <span className="text-muted-foreground font-normal ml-1">(0 ou 3)</span></span>
                    <span className="text-muted-foreground text-xl">+</span>
                    <span className="bg-background border border-border/60 px-4 py-2 rounded-lg shadow-sm">Recursos <span className="text-muted-foreground font-normal ml-1">(0 ou 3)</span></span>
                    <span className="text-muted-foreground text-xl">+</span>
                    <span className="bg-background border border-border/60 px-4 py-2 rounded-lg shadow-sm">Suficiência <span className="text-muted-foreground font-normal ml-1">(0, 2 ou 4)</span></span>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    A soma linear dos componentes define a nota estrutural do município, com teto máximo de <strong>10.0 pontos</strong>.
                  </p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                <h4 className="font-bold text-primary flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5" />
                  Exemplos Práticos de Conversão
                </h4>
                <div className="space-y-4">
                  <div className="bg-background p-3 rounded shadow-sm text-sm border-l-4 border-l-green-500">
                    <strong>Cenário Ideal:</strong> Município com sala especializada instalada (+3), recursos mínimos disponíveis (+3) e estrutura globalmente adequada (+4).<br/>
                    <span className="font-mono text-lg font-bold mt-1 inline-block">Resultado: IER 10.0</span>
                  </div>
                  <div className="bg-background p-3 rounded shadow-sm text-sm border-l-4 border-l-yellow-500">
                    <strong>Cenário Parcial:</strong> Município sem sala especializada (0), porém possui recursos mínimos (+3) e uma suficiência classificada como parcial (+2).<br/>
                    <span className="font-mono text-lg font-bold mt-1 inline-block">Resultado: IER 5.0</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5">
                <h4 className="font-bold text-amber-800 dark:text-amber-500 flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  Interpretação e Limitações Metodológicas
                </h4>
                <p className="text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed text-justify">
                  <strong>Interpretação Gerencial:</strong> Notas abaixo de 4.0 indicam altíssima vulnerabilidade física, demandando ação fiscalizatória imediata. Notas entre 4.0 e 6.9 requerem Termos de Ajustamento de Conduta pontuais.<br/><br/>
                  <strong>Limitações:</strong> O IER foca na capacidade instalada. Um município pode obter IER 10.0 (prédio excelente) e falhar na prestação do serviço por deficiência de protocolos ou falta de pessoal humano qualificado, motivo pelo qual a análise territorial exige o cruzamento com o IMF e o IQT.
                </p>
              </div>

            </CardContent>
          </Card>
        </section>

        {/* === ÍNDICE DE MATURIDADE DOS FLUXOS (IMF) === */}
        <section>
          <Card className="border-border/60 shadow-md">
            <CardHeader className="bg-[color:var(--color-success)]/5 border-b border-border/40 pb-6 rounded-t-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[color:var(--color-success)]/20 rounded-lg">
                  <HeartHandshake className="h-6 w-6 text-[color:var(--color-success)]" />
                </div>
                <CardTitle className="text-2xl text-[color:var(--color-success)]">Índice de Maturidade dos Fluxos (IMF)</CardTitle>
              </div>
              <CardDescription className="text-base font-medium text-foreground/80 mt-2">
                Mede o grau de formalização, previsibilidade e institucionalização dos mecanismos de resposta intersetorial à violência.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Definição Conceitual e Finalidade</h3>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  O <strong>IMF</strong> avalia se o município opera mediante normas padronizadas (fluxo formal, protocolos e arranjos normativos coordenados) ou se a resposta estatal baseia-se na improvisação e voluntariedade dos agentes. Sua finalidade é mensurar a integração entre delegacias, saúde, e assistência social. O IMF diferencia a mera <em>existência de um equipamento</em> da <em>existência de uma Rede de fato articulada</em>.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold">Variáveis de Entrada e Regra de Pontuação</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2">1. Fluxo Formal Local</h4>
                    <p className="text-sm text-muted-foreground mb-3">Existência de documento oficializado ditando os passos e responsabilidades de encaminhamento das vítimas.</p>
                    <div className="bg-background border rounded p-2 text-sm">
                      <span className="font-bold text-[color:var(--color-success)]">Peso: 30%</span> (Máx. 3 pts)<br/>
                      <span className="text-muted-foreground">Formalizado = +3 pts<br/>Não formalizado = 0 pts</span>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2">2. Protocolo Regional</h4>
                    <p className="text-sm text-muted-foreground mb-3">Adesão oficial do município a um protocolo padronizado estadual ou do respectivo Polo Regional.</p>
                    <div className="bg-background border rounded p-2 text-sm">
                      <span className="font-bold text-[color:var(--color-success)]">Peso: 30%</span> (Máx. 3 pts)<br/>
                      <span className="text-muted-foreground">Aderente = +3 pts<br/>Não aderente = 0 pts</span>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2">3. Articulação em Rede</h4>
                    <p className="text-sm text-muted-foreground mb-3">Frequência e sistemática de reuniões interinstitucionais e uso de sistemas integrados de comunicação.</p>
                    <div className="bg-background border rounded p-2 text-sm">
                      <span className="font-bold text-[color:var(--color-success)]">Peso: 40%</span> (Máx. 4 pts)<br/>
                      <span className="text-muted-foreground">Consolidada = +4 pts<br/>Incipiente = +2 pts<br/>Inexistente = 0 pts</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold">Fórmula de Composição</h3>
                <div className="bg-muted/30 border border-border p-6 rounded-xl flex flex-col gap-4">
                  <div className="flex items-center gap-3 flex-wrap justify-center font-medium text-base">
                    <strong className="text-[color:var(--color-success)] text-2xl font-black mr-2">IMF</strong>
                    <span className="text-muted-foreground text-xl">=</span>
                    <span className="bg-background border border-border/60 px-4 py-2 rounded-lg shadow-sm">Fluxo Formal <span className="text-muted-foreground font-normal ml-1">(0 ou 3)</span></span>
                    <span className="text-muted-foreground text-xl">+</span>
                    <span className="bg-background border border-border/60 px-4 py-2 rounded-lg shadow-sm">Protocolo <span className="text-muted-foreground font-normal ml-1">(0 ou 3)</span></span>
                    <span className="text-muted-foreground text-xl">+</span>
                    <span className="bg-background border border-border/60 px-4 py-2 rounded-lg shadow-sm">Articulação <span className="text-muted-foreground font-normal ml-1">(0, 2 ou 4)</span></span>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    A pontuação máxima alcança <strong>10.0 pontos</strong>, denotando uma rede plenamente institucionalizada.
                  </p>
                </div>
              </div>

              <div className="bg-[color:var(--color-success)]/5 border border-[color:var(--color-success)]/20 rounded-xl p-5">
                <h4 className="font-bold text-[color:var(--color-success)] flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5" />
                  Exemplos Práticos de Conversão
                </h4>
                <div className="space-y-4">
                  <div className="bg-background p-3 rounded shadow-sm text-sm border-l-4 border-l-yellow-500">
                    <strong>Maturidade Intermediária:</strong> Município possui um fluxo formal assinado (+3), mas não aderiu à matriz de protocolo regional do estado (0) e possui uma rotina de articulação apenas incipiente, com reuniões esporádicas (+2).<br/>
                    <span className="font-mono text-lg font-bold mt-1 inline-block">Resultado: IMF 5.0</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </section>

        {/* === ÍNDICE DE QUALIFICAÇÃO TÉCNICA (IQT) === */}
        <section>
          <Card className="border-border/60 shadow-md">
            <CardHeader className="bg-warning/10 border-b border-border/40 pb-6 rounded-t-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-warning/20 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-warning-foreground" />
                </div>
                <CardTitle className="text-2xl text-warning-foreground">Índice de Qualificação Técnica (IQT)</CardTitle>
              </div>
              <CardDescription className="text-base font-medium text-foreground/80 mt-2">
                Mede o nível de especialização técnica e capacitação do capital humano que realiza o atendimento na ponta.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Definição Conceitual e Finalidade</h3>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  A resposta estatal à violência de gênero requer sensibilidade e técnica específicas. O <strong>IQT</strong> avalia a composição multidisciplinar das equipes (psicologia, serviço social, assessoria jurídica) e o histórico de letramento e capacitações especializadas em feminicídio. A métrica separa a avaliação do "equipamento de concreto" da "preparação humana", expondo gargalos de recursos humanos.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold">Variáveis de Entrada e Regra de Pontuação</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2">1. Composição Multidisciplinar</h4>
                    <p className="text-sm text-muted-foreground mb-3">Presença mínima e concomitante de profissionais de serviço social e psicologia compondo a rede de acolhimento.</p>
                    <div className="bg-background border rounded p-2 text-sm">
                      <span className="font-bold text-warning-foreground">Peso: 30%</span> (Máx. 3 pts)<br/>
                      <span className="text-muted-foreground">Equipe Completa = +3 pts<br/>Incompleta/Ausente = 0 pts</span>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2">2. Formação em Gênero</h4>
                    <p className="text-sm text-muted-foreground mb-3">Percentual de profissionais do quadro submetidos a cursos sobre violência doméstica, tipologias e viés de gênero.</p>
                    <div className="bg-background border rounded p-2 text-sm">
                      <span className="font-bold text-warning-foreground">Peso: 35%</span> (Máx. 3.5 pts)<br/>
                      <span className="text-muted-foreground">Realizado = +3.5 pts<br/>Não realizado = 0 pts</span>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-2">3. Capacitação Feminicídio</h4>
                    <p className="text-sm text-muted-foreground mb-3">Treinamento específico no protocolo estadual de avaliação de risco letal e resposta preventiva ao feminicídio.</p>
                    <div className="bg-background border rounded p-2 text-sm">
                      <span className="font-bold text-warning-foreground">Peso: 35%</span> (Máx. 3.5 pts)<br/>
                      <span className="text-muted-foreground">Realizado = +3.5 pts<br/>Não realizado = 0 pts</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold">Fórmula de Composição</h3>
                <div className="bg-muted/30 border border-border p-6 rounded-xl flex flex-col gap-4">
                  <div className="flex items-center gap-3 flex-wrap justify-center font-medium text-base">
                    <strong className="text-warning-foreground text-2xl font-black mr-2">IQT</strong>
                    <span className="text-muted-foreground text-xl">=</span>
                    <span className="bg-background border border-border/60 px-4 py-2 rounded-lg shadow-sm">Equipe <span className="text-muted-foreground font-normal ml-1">(0 ou 3.0)</span></span>
                    <span className="text-muted-foreground text-xl">+</span>
                    <span className="bg-background border border-border/60 px-4 py-2 rounded-lg shadow-sm">Formação Gênero <span className="text-muted-foreground font-normal ml-1">(0 ou 3.5)</span></span>
                    <span className="text-muted-foreground text-xl">+</span>
                    <span className="bg-background border border-border/60 px-4 py-2 rounded-lg shadow-sm">Capac. Feminicídio <span className="text-muted-foreground font-normal ml-1">(0 ou 3.5)</span></span>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    O somatório atinge <strong>10.0 pontos</strong>, revelando alta qualificação e letramento técnico especializado da equipe.
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </section>

        {/* === MATRIZ DE RISCO TERRITORIAL === */}
        <section>
          <Card className="border-border/60 shadow-lg border-destructive/20 overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] dark:opacity-[0.12] pointer-events-none z-0 overflow-hidden">
              <img src="/logo_brigid.png" alt="" className="w-[500px] h-[500px] object-contain blur-[3px] mix-blend-multiply dark:mix-blend-screen grayscale" />
            </div>
            <CardHeader className="bg-destructive/5 border-b border-destructive/20 pb-6 rounded-t-xl relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-2xl text-destructive">Matriz Híbrida de Risco Territorial</CardTitle>
              </div>
              <CardDescription className="text-base font-medium text-foreground/80 mt-2">
                Modelagem bidimensional cruzando ocorrências criminais (a ameaça) com a fragilidade da rede (a vulnerabilidade).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8 relative z-10">
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Definição Conceitual da Matriz</h3>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Para gerar o mapa de Risco de Feminicídio, o BRIGID não confia exclusivamente em números criminais brutos (que distorcem a leitura em desfavor das capitais) nem em taxas puramente relativas (que geram superdimensionamento em pequenos interiores). O sistema adota uma <strong>Modelagem Híbrida Ponderada</strong>, baseada no princípio de Risco de Desastres: <code className="bg-muted px-1.5 py-0.5 rounded text-sm text-foreground">Risco = Ameaça × Vulnerabilidade</code>.
                </p>
              </div>

              <div className="grid gap-6">
                <div className="bg-muted/50 p-6 rounded-xl border border-border">
                  <h4 className="font-bold text-foreground text-lg mb-3">Eixo X: Pressão Criminal Ponderada (Fator Ameaça)</h4>
                  <p className="text-sm text-muted-foreground mb-4 text-justify">
                    Para aferir a verdadeira carga da violência criminal, o sistema descarta o ranqueamento por <strong>volume absoluto</strong> de registros (Boletins de Ocorrência, MPU e feminicídios). Se adotasse números brutos, grandes centros populacionais como a capital, Teresina, figurariam permanentemente no topo do alerta de risco unicamente por sua escala demográfica, invisibilizando a gravidade real do adoecimento social em cidades do interior.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4 text-justify">
                    Para corrigir essa distorção e garantir rigor metodológico, o cálculo emprega uma <strong>Incidência Relativa Ponderada pela População Feminina Local</strong>. O algoritmo cruza o montante de crimes e ameaças com a fatia demográfica de mulheres residentes no município (base IBGE). Isso revela a frequência matemática da violência em proporção ao público-alvo exposto no território.
                  </p>
                  
                  <div className="bg-background border border-border/60 rounded-lg p-3 text-sm font-mono text-muted-foreground shadow-sm mb-4">
                    Taxa de Incidência = (Total de Ocorrências / População Feminina Local) × 10.000
                  </div>

                  <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4 text-justify">
                    <li><strong>Equidade Territorial:</strong> Expõe municípios de pequeno e médio porte onde a densidade per capita do crime é estatisticamente crônica e severa.</li>
                    <li><strong>Alerta Real:</strong> Demonstra o nível de sobrecarga (pressão) que incide individualmente sobre a mulher e sobre a rede que deverá ampará-la.</li>
                  </ul>
                </div>

                <div className="bg-muted/50 p-6 rounded-xl border border-border">
                  <h4 className="font-bold text-foreground text-lg mb-3">Eixo Y: Vulnerabilidade Institucional (Fator Agravante)</h4>
                  <p className="text-sm text-muted-foreground mb-4 text-justify">Fator estrutural extraído diretamente do Diagnóstico em Rede. O sistema utiliza a <strong>Média Geral</strong> da matriz institucional do município <code>(IER + IMF + IQT) / 3</code> como um peso balanceador contra a Ameaça.</p>
                  <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4 text-justify">
                    <li>Se a Média Geral for crítica (abaixo de 4.0), a total ausência de serviços de proteção agrava exponencialmente a nota final de Risco de Feminicídio.</li>
                    <li>Por outro lado, Redes de Proteção sólidas, com alta maturidade de fluxo e servidores capacitados, atuam como um fator atenuante, mitigando parcialmente a probabilidade do desfecho letal mesmo em cenários de alta pressão criminal.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold">Classificação Normativa do Alerta</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-3 border rounded-lg bg-background">
                    <div className="w-4 h-4 rounded-full mt-0.5 shrink-0 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                    <div>
                      <h4 className="font-bold text-foreground">Risco Crítico Iminente</h4>
                      <p className="text-sm text-muted-foreground">Cruzamento letal: altíssimo volume/taxa de denúncias associado a um completo vazio assistencial institucional na ponta. Aciona alertas prioritários para os Grupos de Atuação Especial do MPPI.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 border rounded-lg bg-background">
                    <div className="w-4 h-4 rounded-full mt-0.5 shrink-0 bg-orange-500"></div>
                    <div>
                      <h4 className="font-bold text-foreground">Risco Alto</h4>
                      <p className="text-sm text-muted-foreground">Pressão criminal elevada com lacunas institucionais significativas. Demanda planejamento de intervenções em médio prazo pelas promotorias locais.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 border rounded-lg bg-background">
                    <div className="w-4 h-4 rounded-full mt-0.5 shrink-0 bg-yellow-500"></div>
                    <div>
                      <h4 className="font-bold text-foreground">Risco Moderado</h4>
                      <p className="text-sm text-muted-foreground">Estabilidade relativa nos índices de violência acompanhada de resposta estatal razoavelmente consolidada.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-3 border rounded-lg bg-background">
                    <div className="w-4 h-4 rounded-full mt-0.5 shrink-0 bg-green-500"></div>
                    <div>
                      <h4 className="font-bold text-foreground">Risco Baixo</h4>
                      <p className="text-sm text-muted-foreground">Baixa incidência associada à capacidade institucional instalada para acompanhamento protetivo.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5">
                <h4 className="font-bold text-amber-800 dark:text-amber-500 flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  Ressalvas de Governança
                </h4>
                <p className="text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed text-justify">
                  A classificação matemática de risco gerada pelo BRIGID atua estritamente como ferramenta de "Indução Analítica e Triagem Focalizada". Ela <strong>não substitui a avaliação técnico-qualitativa da Promotoria de Justiça</strong>. O algoritmo é um orientador estratégico territorial, incapaz de julgar nuances processuais subjetivas ou dinâmicas locais excepcionais.
                </p>
              </div>

            </CardContent>
          </Card>
        </section>

        <Separator className="my-10" />

        <div className="grid md:grid-cols-2 gap-8">
          {/* 4. FONTES DE DADOS E ATUALIZAÇÃO */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Database className="h-6 w-6 text-primary" />
              Fontes de Dados
            </h2>
            <div className="prose prose-slate dark:prose-invert text-sm text-muted-foreground leading-relaxed text-justify">
              <p>O sistema processa informações oriundas de múltiplas matrizes originárias:</p>
              <ul>
                <li><strong>Dados Administrativos:</strong> Formulários preenchidos periodicamente por secretarias de segurança e assistência, consolidados via portal interativo do Ministério Público.</li>
                <li><strong>Dados Estruturais:</strong> Base do IBGE e relatórios de inspeção in-loco (painel OPM/CREAS).</li>
                <li><strong>Dados Criminais:</strong> Importação sistemática de ocorrências da Secretaria de Segurança Pública e Tribunais de Justiça.</li>
              </ul>
              <p><strong>Periodicidade e Responsabilidade:</strong> As informações estruturais e os diagnósticos da rede são alimentados através de ciclos semestrais ou anuais de avaliação. Casos de notificação compulsória, entretanto, possuem esteiras de integração contínua (D+1).</p>
            </div>
          </section>

          {/* 5. LIMITAÇÕES GERAIS */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Limitações e Viés Analítico
            </h2>
            <div className="prose prose-slate dark:prose-invert text-sm text-muted-foreground leading-relaxed text-justify">
              <p>Em obediência ao princípio da transparência pública algorítmica, o MPPI declara as seguintes limitações do sistema BRIGID:</p>
              <ul>
                <li><strong>Dependência Qualitativa:</strong> A confiabilidade do sistema é diretamente atrelada à veracidade do preenchimento das respostas pelos entes jurisdicionados nos formulários de diagnóstico.</li>
                <li><strong>Subnotificação Crônica:</strong> O risco criminal reflete ocorrências <em>registradas</em>. Vazios nos mapas podem significar subnotificação aguda na localidade, e não pacificação social real.</li>
                <li><strong>Reducionismo Numérico:</strong> Indicadores sintéticos operam através de simplificações matemáticas. Fenômenos sociais complexos de violência perdem contornos finos ao serem reduzidos a uma nota decimal, justificando a intervenção interpretativa dos promotores.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* 6. LEITURA OPERACIONAL */}
        <section className="mt-8">
          <Card className="bg-primary text-primary-foreground border-transparent shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-primary-foreground">
                <MonitorPlay className="h-5 w-5" />
                Como interpretar os resultados no Painel (Leitura Operacional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-primary-foreground/90 text-sm">
                <div>
                  <h4 className="font-bold text-white mb-1">Mapas Temáticos</h4>
                  <p>A cor municipal reage dinamicamente às notas. Roxo escuro/Vermelho = Vazio assistencial ou lacuna; Verde = Estrutura adequada. O mapa reflete o cálculo direto das fórmulas desta página.</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">KPIs (Cartões Superiores)</h4>
                  <p>Exibem a média geral consolidada da área territorial filtrada. Modificam em tempo real mediante filtros demográficos ou espaciais selecionados no painel de controle.</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Tabelas e Rankings</h4>
                  <p>Ordenam a matriz de resultados do pior para o melhor. As tabelas expõem as lacunas, funcionando como o guia prático para ações institucionais.</p>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Exportação Analítica</h4>
                  <p>Os dados tratados nesta metodologia podem ser auditados baixando-se as matrizes brutas via CSV/Excel, permitindo cruzamentos independentes por pesquisadores e órgãos de controle.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
