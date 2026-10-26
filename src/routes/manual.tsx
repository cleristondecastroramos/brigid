import { createFileRoute } from "@tanstack/react-router";
import { Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/manual")({
  component: Manual,
});

function Manual() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 print:max-w-none print:pb-0">
      <style>{`
        @media print {
          @page {
            margin-bottom: 20mm;
          }
          @page :first {
            margin-bottom: 0mm;
          }
          #print-footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            padding-bottom: 8px;
            font-size: 10px;
            color: #64748b;
            display: flex !important;
            justify-content: space-between;
            align-items: center;
            background: white;
            z-index: 10;
          }
          /* Numeração nativa de página via margens do navegador (se suportado) */
          @page {
            @bottom-right {
              content: "Página " counter(page);
              font-family: sans-serif;
              font-size: 10px;
              color: #64748b;
            }
          }
          @page :first {
            @bottom-right {
              content: normal;
            }
          }
        }
      `}</style>

      {/* RODAPÉ DE IMPRESSÃO FIXO */}
      <div id="print-footer" className="hidden">
        <span className="font-medium">
          BRÍGID — Base de Referência Integrada para Gestão, Inteligência e Dados | Do Projeto
          Feminicídio Zero - CAOCRIM/MPPI
        </span>
        {/* Span reservado, a numeração fixa que mostrava '0' foi removida. O navegador deve gerenciar as páginas. */}
        <span id="print-page-number"></span>
      </div>

      {/* CAPA DE IMPRESSÃO */}
      {/* O fundo branco e z-index ocultam o rodapé fixo apenas na capa */}
      <div className="hidden print:flex min-h-screen flex-col items-center justify-center text-center px-12 break-after-page relative bg-white z-50">
        <div className="mb-12 flex flex-col items-center">
          <div className="h-40 w-40 mb-8 rounded-full border-4 border-slate-900 flex items-center justify-center overflow-hidden bg-white shadow-sm">
            <img src="/logo_brigid.png" alt="BRIGID Logo" className="h-32 w-32 object-contain" />
          </div>
          <h1 className="text-3xl font-semibold uppercase tracking-widest text-slate-900 mb-6 border-b-4 border-slate-900 pb-4 inline-block">
            BRÍGID
          </h1>
          <h2 className="text-3xl font-semibold text-slate-800 leading-snug">
            Base de Referência Integrada para Gestão,
            <br />
            Inteligência e Dados
          </h2>
          <p className="text-xl text-slate-600 mt-10 uppercase tracking-widest font-bold">
            Do Projeto Feminicídio Zero - CAOCRIM/MPPI
          </p>
          <p className="text-lg text-slate-500 mt-4 uppercase tracking-widest font-medium">
            Manual Técnico e Tutorial de Uso
          </p>
        </div>
        <div className="mt-32 pt-12 border-t border-slate-300 w-full">
          <p className="text-slate-800 font-bold text-2xl uppercase tracking-wider">
            Ministério Público do Estado do Piauí
          </p>
          <p className="text-slate-500 mt-3 font-semibold text-lg">{new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Manual Técnico e Tutorial de Uso do Sistema BRÍGID
          </h1>
        </div>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="gap-2 font-semibold shadow-sm hover:bg-primary hover:text-primary-foreground border-primary/20 transition-all"
        >
          <Printer className="w-4 h-4" /> Exportar PDF
        </Button>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="p-8 md:p-12 space-y-10 text-slate-800 dark:text-slate-300 print:p-0 print:text-black">
          {/* 1. Apresentação */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              1. Apresentação
            </h2>
            <p className="leading-relaxed text-justify">
              O BRÍGID é o sistema de monitoramento integrado e prevenção ao feminicídio do
              Ministério Público do Estado do Piauí, concebido para consolidar, cruzar, interpretar
              e operacionalizar dados sobre violência de gênero e estrutura territorial da rede de
              proteção à mulher nos 224 municípios do estado. Este manual técnico reúne orientações
              de uso, lógica funcional, fluxo administrativo e fundamentos metodológicos, com foco
              nas rotinas reais de operação da plataforma.
            </p>
            <p className="leading-relaxed text-justify">
              O documento foi estruturado para servir simultaneamente como material de referência
              institucional, guia de treinamento para usuários e base de consulta para equipes
              técnicas e administrativas. O conteúdo cobre a navegação geral do sistema, os filtros
              territoriais, o uso das páginas principais, o funcionamento da área restrita, o modal
              de edição, as regras de monitoramento e a interpretação metodológica dos indicadores e
              alertas.
            </p>
          </section>

          {/* 2. Origem do nome BRÍGID */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              2. Origem do nome BRÍGID
            </h2>
            <p className="leading-relaxed text-justify">
              O nome BRÍGID foi escolhido como referência simbólica a Santa Brígida da Irlanda
              (também conhecida como Brigid of Kildare), figura histórica e religiosa do século V
              associada à proteção, à compaixão, à liderança comunitária e ao cuidado com pessoas em
              situação de vulnerabilidade. Brígida é reconhecida como uma das três padroeiras da
              Irlanda e foi fundadora de uma importante comunidade monástica em Kildare, que se
              tornou centro de acolhimento, organização social, espiritualidade e formação.
            </p>
            <p className="leading-relaxed text-justify">
              Na tradição histórica e cultural, Brígida passou a ser lembrada por valores como
              caridade, proteção, cura, hospitalidade, justiça social e amparo aos mais frágeis,
              atributos que dialogam diretamente com a missão institucional do sistema. Em
              diferentes relatos sobre sua trajetória, ela aparece como uma liderança feminina de
              grande relevância, ligada à assistência aos necessitados, à organização de comunidades
              e à defesa concreta da dignidade humana.
            </p>
            <p className="leading-relaxed text-justify">
              A escolha desse nome para o sistema BRÍGID está vinculada ao propósito central do
              projeto: monitorar, organizar e qualificar a resposta institucional à violência de
              gênero, fortalecendo a rede de proteção à mulher nos municípios piauienses. Assim como
              Brígida é tradicionalmente associada à proteção e ao cuidado, o sistema foi concebido
              para apoiar o Ministério Público na identificação de vulnerabilidades territoriais, no
              acompanhamento da infraestrutura de atendimento e na priorização de ações voltadas à
              prevenção do feminicídio e à defesa das mulheres em situação de risco.
            </p>
            <p className="leading-relaxed text-justify">
              Nesse sentido, o nome BRÍGID cumpre dupla função: ele oferece uma identidade forte,
              feminina e institucional para a plataforma, e ao mesmo tempo traduz, em chave
              simbólica, os valores que orientam o projeto — proteção, vigilância, acolhimento,
              inteligência territorial e atuação preventiva. O sistema não utiliza esse nome apenas
              como homenagem histórica, mas como expressão de uma lógica de trabalho comprometida
              com cuidado qualificado, leitura estratégica do território e fortalecimento da
              resposta pública diante da violência contra a mulher.
            </p>
          </section>

          {/* 3. Finalidade do sistema */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              3. Finalidade do sistema
            </h2>
            <p className="leading-relaxed text-justify">
              O sistema BRÍGID foi desenhado para atender a quatro objetivos centrais:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">
                consolidar dados municipais em uma base única e padronizada;
              </li>
              <li className="text-justify">
                oferecer leitura territorial e comparativa sobre risco de feminicídio e capacidade
                institucional;
              </li>
              <li className="text-justify">
                apoiar decisões do Ministério Público com fichas técnicas, mapas e alertas
                operacionais;
              </li>
              <li className="text-justify">
                permitir atualização administrativa controlada da base, em ambiente restrito, com
                impacto direto nas visualizações e diagnósticos do sistema.
              </li>
            </ul>
          </section>

          {/* 4. Estrutura geral da plataforma */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              4. Estrutura geral da plataforma
            </h2>
            <p className="leading-relaxed text-justify">
              A plataforma possui duas grandes camadas de acesso.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              4.1. Camada pública/técnica base
            </h3>
            <p className="leading-relaxed text-justify">
              A camada pública ou técnica base é voltada à visualização dos painéis, mapas, filtros,
              fichas executivas e indicadores territoriais. Nessa camada, o usuário pode consultar a
              situação dos municípios, navegar pelos painéis de monitoramento e acessar os recursos
              analíticos que apoiam a compreensão da violência de gênero e da infraestrutura da rede
              de proteção.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              4.2. Camada administrativa restrita
            </h3>
            <p className="leading-relaxed text-justify">
              A camada restrita é acessível apenas mediante autenticação institucional. Nela, são
              liberados os recursos de gestão da base municipal, edição direta de registros,
              manutenção de parâmetros operacionais, controle de monitoramento e uso dos modais de
              atualização de dados municipais.
            </p>
          </section>

          {/* 5. Autenticação e gestão de perfil */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              5. Autenticação e gestão de perfil
            </h2>
            <p className="leading-relaxed text-justify">
              A autenticação do sistema é realizada a partir do cabeçalho geral da aplicação,
              normalmente no canto superior direito, por meio do botão de acesso à área restrita. Ao
              acionar esse recurso, o sistema apresenta um modal de credenciais para entrada das
              informações institucionais do usuário com perfil administrativo.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              5.1. Como acessar a área restrita
            </h3>
            <ul className="list-decimal pl-6 space-y-2">
              <li className="text-justify">
                Localizar o botão Área Restrita no topo da interface.
              </li>
              <li className="text-justify">Clicar para abrir o modal de autenticação.</li>
              <li className="text-justify">Informar as credenciais institucionais válidas.</li>
              <li className="text-justify">
                Confirmar o envio para habilitar a sessão administrativa.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              5.2. Efeitos da autenticação administrativa
            </h3>
            <p className="leading-relaxed text-justify">
              Após o login administrativo, o sistema altera o estado da interface e revela recursos
              antes indisponíveis. Entre as mudanças mais importantes estão:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">exibição dos menus de gestão da base;</li>
              <li className="text-justify">habilitação dos botões de edição;</li>
              <li className="text-justify">liberação de recursos de manutenção e simulação;</li>
              <li className="text-justify">exibição de um indicador visual de sessão ativa;</li>
              <li className="text-justify">disponibilização da ação Sair do modo restrito.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              5.3. Sessão ativa e encerramento
            </h3>
            <p className="leading-relaxed text-justify">
              Enquanto a sessão administrativa estiver aberta, o sistema mantém um selo de sessão
              ativa em destaque e preserva o estado administrativo até que o usuário decida encerrar
              o modo restrito. O encerramento da sessão deve ser feito por meio do botão específico
              de saída, para evitar permanência indevida do perfil de administrador em ambientes
              compartilhados.
            </p>
          </section>

          {/* 6. Navegação principal do sistema */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              6. Navegação principal do sistema
            </h2>
            <p className="leading-relaxed text-justify">
              A navegação principal é organizada por menu lateral e páginas temáticas. Embora a
              nomenclatura possa variar ao longo da evolução do produto, o sistema está estruturado
              em torno dos seguintes grupos funcionais:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">apresentação institucional do sistema;</li>
              <li className="text-justify">páginas de monitoramento e diagnóstico da rede;</li>
              <li className="text-justify">
                páginas territoriais, como inteligência territorial, municípios e fichas detalhadas;
              </li>
              <li className="text-justify">
                páginas de gestão, relatórios e administração da base;
              </li>
              <li className="text-justify">
                páginas metodológicas com explicação dos critérios de cálculo e ponderação.
              </li>
            </ul>
          </section>

          {/* 7. Painel principal de monitoramento e mapa interativo */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              7. Painel principal de monitoramento e mapa interativo
            </h2>
            <p className="leading-relaxed text-justify">
              A página principal de inteligência territorial constitui o núcleo analítico do
              sistema. Ela reúne mapa interativo, filtros territoriais, indicadores sintéticos e
              listagem de municípios, permitindo leitura simultânea de distribuição espacial,
              condição estrutural e sinais de risco.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              7.1. Mapa coroplético
            </h3>
            <p className="leading-relaxed text-justify">
              O mapa do estado do Piauí exibe os municípios por variação de cor, conforme a métrica
              ativa selecionada pelo usuário. Essa visualização foi concebida para oferecer leitura
              geográfica imediata do cenário territorial.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              7.2. Métricas do mapa
            </h3>
            <p className="leading-relaxed text-justify">
              O sistema permite alternar, pelo menos, entre duas leituras principais:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">
                Score de Risco, que colore o mapa segundo a classificação de risco de feminicídio do
                município;
              </li>
              <li className="text-justify">
                Alerta da Rede, que colore o mapa conforme a situação da infraestrutura local de
                atendimento e resposta institucional.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              7.3. Filtros territoriais e estruturais
            </h3>
            <p className="leading-relaxed text-justify">
              Os filtros localizados no topo ou na lateral da página refinam toda a visão ativa da
              interface. Eles afetam mapa, indicadores, tabela e, quando aplicável, gráficos
              derivados do subconjunto filtrado.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              7.4. Principais filtros
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">
                Busca por nome: permite localizar rapidamente um município específico;
              </li>
              <li className="text-justify">
                Filtro de polo regional ou macro: restringe o universo exibido a determinada
                regionalização;
              </li>
              <li className="text-justify">
                Filtro de comarca: limita a visualização aos municípios vinculados à comarca
                selecionada;
              </li>
              <li className="text-justify">
                Filtros de OPM e CREAS: permitem recortar municípios segundo presença ou ausência de
                estruturas essenciais da rede;
              </li>
              <li className="text-justify">
                Demais filtros territoriais ou institucionais: podem ser disponibilizados conforme a
                evolução da base e das necessidades de monitoramento.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              7.5. Comportamento esperado dos filtros
            </h3>
            <p className="leading-relaxed text-justify">
              Ao alterar um filtro, o sistema deve recalcular imediatamente os totais, atualizar o
              mapa e restringir a lista de municípios à nova condição selecionada. Em operações
              combinadas, os filtros funcionam de forma cumulativa, ou seja, o resultado final
              corresponde à interseção de todos os critérios ativos.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              7.6. Indicadores gerais
            </h3>
            <p className="leading-relaxed text-justify">
              Na área superior da página principal, o sistema apresenta indicadores sintéticos que
              resumem o recorte atual, como universo municipal considerado, cobertura estrutural,
              contagens parciais e outros totais estratégicos. Esses indicadores são úteis para
              leitura rápida do cenário atual após aplicação de filtros.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              7.7. Tabela ou lista rápida de municípios
            </h3>
            <p className="leading-relaxed text-justify">
              Abaixo dos indicadores e do mapa, o sistema exibe uma listagem dos municípios
              compatíveis com o filtro vigente. Essa listagem funciona como porta de entrada para o
              detalhamento municipal.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              7.8. Ação principal da listagem
            </h3>
            <p className="leading-relaxed text-justify">
              Ao clicar em uma linha da tabela de resultados, o usuário é redirecionado para a ficha
              técnica executiva do município selecionado.
            </p>
          </section>

          {/* 8. Ficha Técnica Executiva do Município */}
          <section className="space-y-4 break-before-page">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              8. Ficha Técnica Executiva do Município
            </h2>
            <p className="leading-relaxed text-justify">
              A ficha técnica municipal é a página de detalhamento territorial do sistema. Ela foi
              concebida como documento executivo-digital, reunindo contexto institucional,
              indicadores centrais, painéis analíticos e blocos de metadados relevantes para leitura
              do município.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              8.1. Objetivo da ficha
            </h3>
            <p className="leading-relaxed text-justify">
              A ficha técnica tem a função de apresentar, em uma única página, um diagnóstico
              consolidado do município, com linguagem institucional, recursos analíticos e elementos
              úteis para atuação ministerial, acompanhamento técnico e geração de documentação de
              apoio.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              8.2. Cabeçalho estratégico
            </h3>
            <p className="leading-relaxed text-justify">
              No topo da ficha técnica, o sistema exibe um cabeçalho de caráter executivo contendo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">nome do município;</li>
              <li className="text-justify">polo regional;</li>
              <li className="text-justify">comarca associada;</li>
              <li className="text-justify">código IBGE;</li>
              <li className="text-justify">data da última atualização, quando disponível;</li>
              <li className="text-justify">
                botões de ação rápida, como impressão de relatório e exportação para PDF.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              8.3. KPIs executivos
            </h3>
            <p className="leading-relaxed text-justify">
              A área de KPIs sintetiza os principais sinais estratégicos do município. Em regra, o
              sistema destaca pelo menos os seguintes elementos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">classificação do risco de feminicídio;</li>
              <li className="text-justify">situação do alerta da rede;</li>
              <li className="text-justify">
                casos oficiais consumados da série histórica considerada;
              </li>
              <li className="text-justify">
                outros indicadores complementares, como tentativas, população e posição relativa, a
                depender da versão da ficha.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              8.4. Superanálise técnica e comparativa
            </h3>
            <p className="leading-relaxed text-justify">
              Uma das funções mais estratégicas da ficha é a geração de um texto síntese
              automatizado, capaz de fundir leitura comparativa, análise institucional e prioridade
              operacional. Esse bloco interpreta simultaneamente risco, infraestrutura, registros de
              violência, condição da rede e necessidade de atuação ministerial.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              8.5. Conteúdo esperado da análise integrada
            </h3>
            <p className="leading-relaxed text-justify">
              A superanálise deve considerar, de forma articulada:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">o score e sua classificação;</li>
              <li className="text-justify">presença ou ausência de OPM;</li>
              <li className="text-justify">presença ou ausência de CREAS;</li>
              <li className="text-justify">sinais da série histórica de violência;</li>
              <li className="text-justify">alerta da rede;</li>
              <li className="text-justify">
                necessidade de monitoramento, cobrança institucional ou priorização estratégica.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              8.6. Forma de apresentação
            </h3>
            <p className="leading-relaxed text-justify">
              O texto pode ser estruturado em parágrafos institucionais, pontos de destaque ou
              combinação de ambos, sempre com foco em legibilidade executiva. A lógica de semáforo
              textual, quando adotada, facilita a leitura por membros e equipes técnicas do MPPI.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              8.7. Painéis complementares e metadados
            </h3>
            <p className="leading-relaxed text-justify">
              Além dos indicadores principais, a ficha reúne blocos complementares com atributos do
              município, incluindo situação da estrutura policial, protocolos, gargalos
              identificados e outros elementos operacionais. Esses painéis ajudam a contextualizar o
              cenário local e dão materialidade à análise principal.
            </p>
          </section>

          {/* 9. Página de Gestão da Base Municipal */}
          <section className="space-y-4 break-before-page">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              9. Página de Gestão da Base Municipal
            </h2>
            <p className="leading-relaxed text-justify">
              A página de gestão da base é o ambiente central de manutenção administrativa dos dados
              municipais. Seu desenho privilegia velocidade operacional e edição estruturada,
              funcionando como uma base avançada de cadastro e atualização.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              9.1. Finalidade da página
            </h3>
            <p className="leading-relaxed text-justify">
              A página de gestão existe para permitir que administradores atualizem com segurança os
              dados que alimentam mapas, fichas técnicas, indicadores e alertas do sistema. Qualquer
              alteração nessa base pode refletir diretamente nas visualizações analíticas e no
              comportamento da plataforma.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              9.2. Estrutura da tabela administrativa
            </h3>
            <p className="leading-relaxed text-justify">
              A principal área da página é uma tabela administrativa com os municípios do estado e
              colunas relevantes para leitura rápida de status e acesso ao modo de edição.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              9.3. Recursos operacionais da tabela
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">
                Cabeçalho fixo (sticky header): mantém os rótulos de coluna visíveis durante a
                rolagem longa;
              </li>
              <li className="text-justify">
                Coluna de município congelada: preserva a identificação da cidade em rolagens
                horizontais;
              </li>
              <li className="text-justify">
                Busca instantânea: filtra rapidamente a lista conforme a digitação;
              </li>
              <li className="text-justify">
                Ordenação por select ou critério configurado: permite reorganizar a base por ordem
                alfabética ou critérios estratégicos, como score de risco.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              9.4. Uso da busca e ordenação
            </h3>
            <p className="leading-relaxed text-justify">
              Para encontrar rapidamente um município, o administrador deve utilizar o campo de
              busca superior. Ao digitar parte do nome, a tabela deve aplicar filtro instantâneo.
              Quando houver menu de ordenação, ele pode ser usado para reorganizar a base sem
              alterar os dados, apenas modificando a visualização atual.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              9.5. Ações da tabela
            </h3>
            <p className="leading-relaxed text-justify">
              Cada linha da tabela possui uma ação de edição. Ao acionar esse botão, o sistema abre
              o modal administrativo do município correspondente.
            </p>
          </section>

          {/* 10. Modal de edição de município */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              10. Modal de edição de município
            </h2>
            <p className="leading-relaxed text-justify">
              O modal de edição é o principal mecanismo de manutenção detalhada da base municipal.
              Ele foi estruturado em abas temáticas para tornar a atualização mais clara e reduzir
              erros de preenchimento.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              10.1. Objetivos do modal
            </h3>
            <p className="leading-relaxed text-justify">O modal serve para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">atualizar infraestrutura municipal;</li>
              <li className="text-justify">
                registrar presença ou ausência de estruturas da rede;
              </li>
              <li className="text-justify">informar protocolos, fluxos e gargalos;</li>
              <li className="text-justify">alimentar a série de violência;</li>
              <li className="text-justify">definir estados de alerta e atuação prioritária;</li>
              <li className="text-justify">registrar observações administrativas relevantes.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              10.2. Estado limpo e estado sujo (dirty state)
            </h3>
            <p className="leading-relaxed text-justify">
              O sistema utiliza a lógica de comparação entre o estado original do formulário e o
              estado atual dos campos. Quando o usuário altera um dado, o modal entra em estado
              sujo. Esse mecanismo é importante porque:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">
                habilita o botão de salvar apenas quando há alteração real;
              </li>
              <li className="text-justify">evita requisições desnecessárias;</li>
              <li className="text-justify">
                permite alertar o administrador antes de descartar mudanças;
              </li>
              <li className="text-justify">melhora a confiabilidade do fluxo de edição.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              10.3. Interceptação de fechamento
            </h3>
            <p className="leading-relaxed text-justify">
              Se o usuário tentar fechar o modal após editar algum campo sem salvar, o sistema deve
              apresentar uma confirmação explícita para descartar as alterações. Essa proteção reduz
              o risco de perda acidental de dados durante a rotina administrativa.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              10.4. Rodapé inteligente
            </h3>
            <p className="leading-relaxed text-justify">
              O rodapé do modal foi concebido para refletir o estado atual da edição. Entre os
              comportamentos esperados estão:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">informar quantos campos foram modificados;</li>
              <li className="text-justify">
                manter o botão Salvar Alterações desabilitado enquanto não houver mudança real;
              </li>
              <li className="text-justify">
                indicar claramente a distinção entre ação principal e secundária;
              </li>
              <li className="text-justify">
                manter o salvamento acessível em formulários extensos.
              </li>
            </ul>
          </section>

          {/* 11. Organização por abas do modal */}
          <section className="space-y-4 break-before-page">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              11. Organização por abas do modal
            </h2>
            <p className="leading-relaxed text-justify">
              O modal administrativo é dividido em seis abas temáticas.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              11.1. Aba Infraestrutura
            </h3>
            <p className="leading-relaxed text-justify">
              A aba de infraestrutura reúne dados básicos e estruturais do município, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">presença de OPM;</li>
              <li className="text-justify">presença de CREAS;</li>
              <li className="text-justify">
                efetividade nas políticas públicas, quando houver esse campo;
              </li>
              <li className="text-justify">tipologia da OPM;</li>
              <li className="text-justify">população total;</li>
              <li className="text-justify">população feminina;</li>
              <li className="text-justify">observações técnicas ou observações do sistema.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              11.2. Como preencher
            </h3>
            <p className="leading-relaxed text-justify">
              Os campos booleanos devem ser preenchidos com atenção à situação real e vigente do
              município. Em especial, a presença de OPM e CREAS deve refletir a estrutura formal
              validada pela base administrativa, pois esses elementos influenciam leituras de
              vulnerabilidade e alertas do sistema.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              11.3. Observações do sistema
            </h3>
            <p className="leading-relaxed text-justify">
              O campo de observações é importante para registrar anotações livres sobre ofícios,
              comunicações, inaugurações, validações documentais ou qualquer mudança relevante
              informada por órgãos oficiais. Esse registro ajuda a dar rastreabilidade qualitativa à
              atualização da base.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              11.4. Aba Fluxos
            </h3>
            <p className="leading-relaxed text-justify">
              A aba de fluxos concentra informações sobre protocolos operacionais, articulação de
              atendimento e suficiência estrutural para resposta local à violência de gênero.
            </p>

            <p className="font-semibold mt-2">Campos típicos</p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">fluxo formal de atendimento;</li>
              <li className="text-justify">protocolo local ou regional;</li>
              <li className="text-justify">existência de sala especializada;</li>
              <li className="text-justify">recursos mínimos;</li>
              <li className="text-justify">suficiência da estrutura;</li>
              <li className="text-justify">atendimento psicossocial.</li>
            </ul>

            <p className="font-semibold mt-2">Uso prático</p>
            <p className="leading-relaxed text-justify">
              Esses campos ajudam a qualificar o funcionamento territorial da rede. O preenchimento
              deve refletir não apenas a existência formal de mecanismos, mas o nível mínimo de
              efetividade operacional identificado ou confirmado na base técnica.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              11.5. Aba Segurança
            </h3>
            <p className="leading-relaxed text-justify">
              A aba de segurança traz elementos relacionados à resposta policial e pericial, bem
              como a identificação de gargalos críticos do sistema local de proteção e investigação.
            </p>

            <p className="font-semibold mt-2">Campos típicos</p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">protocolo de investigação;</li>
              <li className="text-justify">protocolo pericial;</li>
              <li className="text-justify">capacitação em gênero;</li>
              <li className="text-justify">aderência técnica;</li>
              <li className="text-justify">quantidade de capacitações;</li>
              <li className="text-justify">lista de gargalos múltiplos.</li>
            </ul>

            <p className="font-semibold mt-2">Gargalos múltiplos</p>
            <p className="leading-relaxed text-justify">
              A lista de gargalos representa um conjunto de problemas estruturais ou operacionais
              passíveis de marcação múltipla. O sistema pode exibir contador de itens selecionados,
              melhorando a leitura rápida da gravidade institucional do território.
            </p>

            <p className="font-semibold mt-2">Recomendação de preenchimento</p>
            <p className="leading-relaxed text-justify">
              Marcar apenas os gargalos efetivamente reconhecidos ou documentados. O uso excessivo
              ou indiscriminado da lista reduz a qualidade analítica da base e pode distorcer
              leituras internas sobre prioridade territorial.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              11.6. Aba Socioassistencial
            </h3>
            <p className="leading-relaxed text-justify">
              A aba socioassistencial reúne dados sobre equipe, fluxos do CREAS, articulação de
              atendimento e condições mínimas de resposta do eixo social.
            </p>

            <p className="font-semibold mt-2">Campos típicos</p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">protocolo assistencial;</li>
              <li className="text-justify">fluxo de encaminhamento;</li>
              <li className="text-justify">articulação CREAS;</li>
              <li className="text-justify">equipe mínima do CREAS;</li>
              <li className="text-justify">profissionais capacitados;</li>
              <li className="text-justify">data da última capacitação.</li>
            </ul>

            <p className="font-semibold mt-2">Cuidados de uso</p>
            <p className="leading-relaxed text-justify">
              Sempre que houver preenchimento de datas ou quantitativos, o administrador deve
              verificar consistência temporal e evitar lançar números sem validação mínima. Esses
              dados são relevantes para leitura da capacidade local de resposta socioassistencial.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              11.7. Aba Violência
            </h3>
            <p className="leading-relaxed text-justify">
              A aba de violência é uma das mais sensíveis do sistema, pois alimenta diretamente o
              cálculo do score, o acompanhamento da série oficial e parte dos alertas locais.
            </p>

            <p className="font-semibold mt-2">Organização em painéis anuais</p>
            <p className="leading-relaxed text-justify">
              A seção é normalmente dividida em dois grandes grupos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">
                Score oficial (2023–2025): reúne os dados consolidados que compõem a série histórica
                oficial usada no cálculo principal do risco;
              </li>
              <li className="text-justify">
                Ciclo em aberto ou monitoramento parcial (2026): reúne dados do ano corrente ou
                ainda não fechados, utilizados em monitoramento, mas sem incorporação imediata à
                série oficial consolidada.
              </li>
            </ul>

            <p className="font-semibold mt-2">Campos principais</p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">consumados 2023;</li>
              <li className="text-justify">tentados 2023;</li>
              <li className="text-justify">consumados 2024;</li>
              <li className="text-justify">tentados 2024;</li>
              <li className="text-justify">consumados 2025;</li>
              <li className="text-justify">tentados 2025;</li>
              <li className="text-justify">consumados 2026;</li>
              <li className="text-justify">tentados 2026.</li>
            </ul>

            <p className="font-semibold mt-2">Regra de preenchimento</p>
            <p className="leading-relaxed text-justify">
              Os dados da série oficial devem ser tratados como base consolidada, exigindo maior
              cuidado na atualização. Já os dados do ciclo em aberto podem refletir acompanhamento
              parcial, desde que fiquem claramente separados dos dados que compõem o score
              consolidado.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              11.8. Aba Alertas
            </h3>
            <p className="leading-relaxed text-justify">
              A aba de alertas concentra controles estratégicos de classificação institucional e
              resposta territorial.
            </p>

            <p className="font-semibold mt-2">Campos típicos</p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">ocorrências monitoradas;</li>
              <li className="text-justify">tem feminicídio consumado;</li>
              <li className="text-justify">tem tentativa;</li>
              <li className="text-justify">alerta da rede;</li>
              <li className="text-justify">atuação prioritária.</li>
            </ul>

            <p className="font-semibold mt-2">Importância da atuação prioritária</p>
            <p className="leading-relaxed text-justify">
              O campo Atuação Prioritária possui forte peso operacional, pois pode elevar
              diretamente o grau de urgência percebido no município. Seu uso deve ser
              institucionalmente criterioso e alinhado às definições estratégicas do Ministério
              Público.
            </p>
          </section>

          {/* 12. Botões, controles e comportamentos do modal */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              12. Botões, controles e comportamentos do modal
            </h2>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              12.1. Botão Cancelar
            </h3>
            <p className="leading-relaxed text-justify">
              A ação Cancelar fecha o modal sem persistir as alterações. Quando o formulário estiver
              em estado sujo, o sistema deve interromper o fechamento e exigir confirmação explícita
              do usuário para descarte dos dados alterados.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              12.2. Botão Salvar Alterações
            </h3>
            <p className="leading-relaxed text-justify">
              A ação Salvar Alterações persiste os dados do formulário no banco ou na camada de
              persistência do sistema. O botão deve permanecer indisponível até que haja alteração
              real e, após o envio, deve informar claramente o sucesso ou eventual falha do
              processo.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              12.3. Inputs, selects e checkboxes
            </h3>
            <p className="leading-relaxed text-justify">
              Os campos do sistema podem aparecer em diferentes formatos, incluindo entradas
              numéricas, campos de texto, seletores do tipo sim/não, listas de opções, campos de
              data e caixas de múltipla seleção. O administrador deve respeitar o tipo esperado de
              cada campo e evitar uso de valores improvisados ou inconsistentes com a lógica da
              base.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              12.4. Tooltips e ícones de ajuda
            </h3>
            <p className="leading-relaxed text-justify">
              Os ícones de ajuda têm a função de explicar rapidamente campos específicos,
              especialmente aqueles com impacto metodológico ou ambiguidade operacional. Sempre que
              houver dúvida sobre o escopo de um campo, o usuário deve priorizar a leitura do
              tooltip antes de salvar alterações.
            </p>
          </section>

          {/* 13. Página metodológica e critérios de cálculo */}
          <section className="space-y-4 break-before-page">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              13. Página metodológica e critérios de cálculo
            </h2>
            <p className="leading-relaxed text-justify">
              A plataforma incorpora uma lógica metodológica própria para transformar dados brutos
              em score de risco e alertas de rede. Essa lógica é central para a leitura analítica do
              sistema e deve ser conhecida por operadores e administradores.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              13.1. Matriz de risco
            </h3>
            <p className="leading-relaxed text-justify">
              O risco de feminicídio não decorre de simples contagem absoluta de casos. O sistema
              considera uma matriz de ponderação baseada na combinação entre exposição populacional,
              série oficial de violência e fragilidade estrutural da rede.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              13.2. Indicadores puxadores
            </h3>
            <p className="leading-relaxed text-justify">
              Os feminicídios consumados da série base possuem peso maior no cálculo do risco,
              enquanto as tentativas também compõem o índice, porém com peso inferior. Segundo a
              especificação funcional apresentada, consumados têm peso 2 e tentativas têm peso 1 na
              matriz principal.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              13.3. Fator de exposição
            </h3>
            <p className="leading-relaxed text-justify">
              O sistema leva em conta a população feminina como fator de exposição. Assim, a leitura
              do risco não se limita a números absolutos; ela considera o contexto populacional do
              município para evitar comparações distorcidas entre realidades muito diferentes.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              13.4. Agravantes estruturais
            </h3>
            <p className="leading-relaxed text-justify">
              A ausência de estruturas como OPM e CREAS atua como agravante territorial. Isso
              significa que municípios com registros de violência e rede deficiente podem sofrer
              elevação relativa na classificação do score, refletindo maior vulnerabilidade
              institucional.
            </p>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              13.5. Alertas de rede
            </h3>
            <p className="leading-relaxed text-justify">
              O alerta da rede é calculado a partir de fatores condicionantes ligados à
              infraestrutura e à capacidade mínima de atendimento. Entre os gatilhos relevantes
              estão:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">ausência de protocolo intersetorial;</li>
              <li className="text-justify">ausência de sala especializada;</li>
              <li className="text-justify">fragilidades estruturais relevantes;</li>
              <li className="text-justify">
                marcação administrativa de prioridade pelo próprio sistema ministerial.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              13.6. Substituição por marcação estratégica
            </h3>
            <p className="leading-relaxed text-justify">
              Quando o campo Atuação Prioritária = Sim é marcado na camada administrativa, essa
              sinalização pode se sobrepor a avaliações automáticas e promover o município a
              condição crítica ou prioritária nas leituras institucionais da plataforma.
            </p>
          </section>

          {/* 14. Relação entre atualização da base e efeitos no sistema */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              14. Relação entre atualização da base e efeitos no sistema
            </h2>
            <p className="leading-relaxed text-justify">
              Um dos aspectos mais importantes do uso administrativo do BRÍGID é compreender que a
              atualização da base municipal afeta diretamente outros módulos da plataforma. Em
              especial:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">
                alterações na aba Violência impactam o mapa e o score;
              </li>
              <li className="text-justify">
                alterações em OPM e CREAS influenciam alertas e leitura de vulnerabilidade;
              </li>
              <li className="text-justify">
                alterações em protocolos, fluxos e gargalos repercutem na interpretação territorial
                e nos textos executivos automatizados;
              </li>
              <li className="text-justify">
                alterações em atuação prioritária afetam a classificação institucional do município.
              </li>
            </ul>
          </section>

          {/* 15. Boas práticas operacionais */}
          <section className="space-y-4 break-before-page">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              15. Boas práticas operacionais
            </h2>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              15.1. Antes de editar
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">confirmar que está no município correto;</li>
              <li className="text-justify">
                verificar se há documento, ofício ou fonte que sustente a mudança;
              </li>
              <li className="text-justify">
                revisar o estado atual do formulário antes de iniciar alterações;
              </li>
              <li className="text-justify">
                checar se outro operador não está realizando atualização paralela no mesmo
                território, quando houver rotina compartilhada.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              15.2. Durante a edição
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">preencher apenas campos com informação validada;</li>
              <li className="text-justify">
                usar observações do sistema para registrar contexto da alteração;
              </li>
              <li className="text-justify">
                evitar substituição de informação consolidada por impressão informal;
              </li>
              <li className="text-justify">
                revisar especialmente os campos que impactam score, alerta e prioridade.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              15.3. Antes de salvar
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">verificar o contador de campos modificados;</li>
              <li className="text-justify">reler os campos críticos;</li>
              <li className="text-justify">confirmar se o município e a aba estão corretos;</li>
              <li className="text-justify">
                observar se a alteração é realmente intencional e coerente com a base documental.
              </li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              15.4. Após salvar
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">confirmar mensagem de sucesso;</li>
              <li className="text-justify">verificar se o sistema retornou ao estado limpo;</li>
              <li className="text-justify">
                reabrir o município se necessário para validar persistência;
              </li>
              <li className="text-justify">
                observar reflexos em mapas, fichas ou indicadores, quando a alteração tiver impacto
                analítico.
              </li>
            </ul>
          </section>

          {/* 16. Roteiro resumido de uso por perfil */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              16. Roteiro resumido de uso por perfil
            </h2>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              16.1. Usuário técnico/consultivo
            </h3>
            <p className="leading-relaxed text-justify">
              O usuário técnico que não atua na manutenção administrativa utiliza predominantemente:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">a página principal de monitoramento;</li>
              <li className="text-justify">os filtros territoriais e estruturais;</li>
              <li className="text-justify">o mapa interativo;</li>
              <li className="text-justify">a tabela de municípios;</li>
              <li className="text-justify">a ficha técnica executiva de cada município.</li>
            </ul>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 print:text-black">
              16.2. Usuário administrador
            </h3>
            <p className="leading-relaxed text-justify">
              O usuário administrador, além dos recursos acima, utiliza:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li className="text-justify">autenticação na área restrita;</li>
              <li className="text-justify">página de gestão da base municipal;</li>
              <li className="text-justify">tabela administrativa com busca, ordenação e edição;</li>
              <li className="text-justify">modal por abas para manutenção detalhada;</li>
              <li className="text-justify">
                mecanismos de confirmação, dirty state e salvamento controlado.
              </li>
            </ul>
          </section>

          {/* 16. Glossário funcional */}
          <section className="space-y-4 break-before-page">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              16. Glossário funcional
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 print:text-black">
                  OPM
                </h3>
                <p className="leading-relaxed text-justify">
                  Organismo de Políticas para as Mulheres. Estrutura institucional relevante para a
                  leitura da capacidade local de formulação, articulação e resposta em políticas
                  públicas voltadas à mulher.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 print:text-black">
                  CREAS
                </h3>
                <p className="leading-relaxed text-justify">
                  Centro de Referência Especializado de Assistência Social. Equipamento essencial
                  para o atendimento especializado em situações de violação de direitos, incluindo
                  contextos de violência de gênero.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 print:text-black">
                  Score de risco
                </h3>
                <p className="leading-relaxed text-justify">
                  Indicador composto que expressa o nível relativo de risco do município com base em
                  série histórica, exposição populacional e agravantes estruturais.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 print:text-black">
                  Alerta da rede
                </h3>
                <p className="leading-relaxed text-justify">
                  Classificação institucional do grau de adequação, atenção ou criticidade da rede
                  local, considerando infraestrutura, protocolos, fluxos e prioridade estratégica.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 print:text-black">
                  Atuação prioritária
                </h3>
                <p className="leading-relaxed text-justify">
                  Marcador administrativo de urgência estratégica que pode elevar a prioridade
                  institucional de determinado município independentemente de parte dos critérios
                  automatizados.
                </p>
              </div>
            </div>
          </section>

          {/* 17. Considerações finais */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white border-b pb-2 print:text-black">
              17. Considerações finais
            </h2>
            <p className="leading-relaxed text-justify">
              O BRÍGID não é apenas uma base de consulta, mas um sistema de inteligência territorial
              e gestão institucional orientado à prevenção e ao monitoramento qualificado da
              violência de gênero. Seu valor depende da qualidade da base, da consistência
              metodológica e do uso responsável dos recursos analíticos e administrativos
              disponíveis.
            </p>
            <p className="leading-relaxed text-justify">
              O uso correto dos filtros, da ficha técnica, da gestão da base e do modal de edição
              fortalece a capacidade de leitura territorial do MPPI e melhora a confiabilidade das
              respostas institucionais construídas a partir da plataforma.
            </p>
          </section>
        </div>
      </div>

      {/* CSS PARA IMPRESSÃO */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body { background: white !important; color: black !important; }
          /* Ocultar elementos da interface gráfica e barra lateral */
          nav, aside, header, #sidebar, [data-sidebar="sidebar"], .lucide-menu, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; width: 100% !important; overflow: visible !important; }
          @page { margin: 2cm; size: A4 portrait; }
          h1, h2, h3, p, li { page-break-inside: avoid; }
          .break-after-page { page-break-after: always !important; break-after: page !important; }
          .break-before-page { page-break-before: always !important; break-before: page !important; }
        }
      `,
        }}
      />
    </div>
  );
}
