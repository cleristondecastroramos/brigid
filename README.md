# BRIGID

**Base de Referência Integrada para Gestão, Inteligência e Dados do Projeto Feminicídio Zero**

Plataforma institucional do **Ministério Público do Estado do Piauí (MPPI)**, mantida pelo **CAOCRIM**, para monitorar a rede de proteção às mulheres em situação de violência e o risco de feminicídio nos 224 municípios piauienses. O BRIGID reúne dados de estrutura (OPM, CREAS, fluxos, protocolos, capacitação), de ocorrências de feminicídio consumado e tentado e de diagnósticos prestados pelas Promotorias de Justiça. Com esses dados, calcula indicadores de risco e de maturidade da rede e os apresenta em painéis, mapas, fichas municipais e relatórios exportáveis.

- **Produção:** https://brigid-mppi.vercel.app
- **Módulo de coleta (Diagnóstico BRIGID):** https://brigid-mppi.vercel.app/diagnostico-brigid

---

## Sumário

1. [Visão geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Perfis de acesso](#perfis-de-acesso)
4. [Arquitetura](#arquitetura)
5. [Tecnologias](#tecnologias)
6. [Estrutura do repositório](#estrutura-do-repositório)
7. [Modelo de dados](#modelo-de-dados)
8. [Metodologia de risco e índices](#metodologia-de-risco-e-índices)
9. [Diagnóstico BRIGID: coleta, revisão e publicação](#diagnóstico-brigid-coleta-revisão-e-publicação)
10. [Segurança](#segurança)
11. [Executando localmente](#executando-localmente)
12. [Banco de dados: criação e migrations](#banco-de-dados-criação-e-migrations)
13. [Carga e atualização de dados](#carga-e-atualização-de-dados)
14. [Testes](#testes)
15. [Scripts disponíveis](#scripts-disponíveis)
16. [Implantação](#implantação)
17. [Operação do dia a dia](#operação-do-dia-a-dia)
18. [Limitações conhecidas e pendências técnicas](#limitações-conhecidas-e-pendências-técnicas)
19. [Documentação complementar](#documentação-complementar)

---

## Visão geral

O BRIGID tem duas entradas, com finalidades distintas:

| Entrada | Para quem | O que faz |
| --- | --- | --- |
| **Acessar painel** | Qualquer pessoa | Consulta pública dos dados **consolidados e autorizados**: dashboards, mapas, indicadores, fichas municipais e relatórios. |
| **Diagnóstico BRIGID** | Promotorias de Justiça e CAOCRIM | Coleta estruturada de informações sobre a rede de proteção de cada município, com revisão e validação pelo CAOCRIM antes de qualquer publicação. |

**Regra central do sistema:** *diagnóstico completo + aprovação expressa do CAOCRIM = autorização para integrar a base consolidada e o painel público.* Nada do que é coletado aparece no painel sem essa aprovação.

---

## Funcionalidades

### Painel público

| Rota | Página | Conteúdo |
| --- | --- | --- |
| `/` | Página inicial | Apresentação do projeto com imagens ilustrativas, as duas entradas (painel e diagnóstico) e o panorama estadual. |
| `/apresentacao-do-sistema` | Apresentação do Sistema | Visão geral dos módulos e do propósito da plataforma. |
| `/diagnostico` | Diagnóstico da Rede e Fluxos | Infraestrutura, fluxos, protocolos, investigação/perícia, assistência social e gargalos. Inclui índices IER, IMF e IQT, mapa temático, ranking de polos regionais e matrizes por município. |
| `/opm` | Cobertura de OPMs | Presença e efetividade de Organismos de Políticas para Mulheres. |
| `/creas` | Cobertura de CREAS | Presença de CREAS e prioridade de implantação. |
| `/risco` | Risco de Feminicídio | Score de risco, faixas (baixo, médio, alto, crítico), mapa e base analítica. |
| `/territorio` | Inteligência Territorial | Cruzamento de indicadores por município, comarca e polo regional. |
| `/municipios` e `/municipios/:slug` | Municípios e Ficha Territorial | Lista e ficha executiva de cada município (KPIs, radar, OPM, CREAS, eventos e dados do diagnóstico validados pelo CAOCRIM). |
| `/gestao` | Gestão do Projeto | Entregas estratégicas do Projeto Feminicídio Zero e seu andamento. |
| `/relatorios` | Relatórios e Exportações | Relatórios consolidados em PDF, CSV e XLSX, com identidade institucional. |
| `/metodologia` | Metodologia de Cálculos | Fórmulas, pesos, limiares e janelas temporais usadas nos indicadores. |
| `/manual` | Manual Técnico | Manual do sistema. |

Recursos transversais: filtros por polo regional, comarca e município; mapas interativos do Piauí (d3-geo); exportação em PDF, CSV e XLSX; tema claro/escuro; contador de acessos.

### Área administrativa do painel (CAOCRIM)

| Rota | Página | Conteúdo |
| --- | --- | --- |
| `/base` | Gestão da Base Municipal | Edição dos dados consolidados de cada município. |
| `/pesos` | Ponderação e Simulação de Pesos | Simulação de pesos e limiares do score de risco, válida só para a sessão: não altera a metodologia oficial. |

### Módulo Diagnóstico BRIGID (`/diagnostico-brigid`)

| Rota | Quem usa | Conteúdo |
| --- | --- | --- |
| `/diagnostico-brigid` | Todos os autenticados | Página inicial do módulo. |
| `/diagnostico-brigid/novo` e `/formulario/:id` | Contas das Promotorias | Formulário por blocos, conforme a atribuição da Promotoria. Mostra a completude por bloco, aceita anexos, salva rascunhos e envia para análise. |
| `/diagnostico-brigid/meus-diagnosticos` | Contas das Promotorias | Diagnósticos da Promotoria, com completude, situação, publicação e versão. |
| `/diagnostico-brigid/acompanhamento` | Todos os autenticados | Mapa e tabela da cobertura municipal, separando os blocos cível e criminal. |
| `/diagnostico-brigid/revisao` | CAOCRIM | Fila de revisão com filtros (município, comarca, polo, Promotoria, atribuição, período, situação). |
| `/diagnostico-brigid/revisao/:id` | CAOCRIM | Revisão completa do diagnóstico. Ver detalhes abaixo. |
| `/diagnostico-brigid/administracao` | CAOCRIM | Atribuição funcional das Promotorias, e-mails institucionais, aprovação das contas e redefinição de senha. |

Enquanto a conta da Promotoria não definir a senha definitiva, qualquer rota do módulo mostra só a tela **"Definir senha definitiva"**.

A revisão completa (`/revisao/:id`) reúne:
- respostas por bloco, pendências e inconsistências;
- fontes e anexos;
- comparação entre o que está publicado e o que foi proposto;
- histórico e auditoria;
- devolução com comentário por campo;
- **Validar e publicar**.

---

## Perfis de acesso

| Perfil | Como entra | Pode |
| --- | --- | --- |
| **Visitante** | "Acessar painel", sem login | Consultar o painel público, que só mostra dados consolidados. |
| **Conta da Promotoria** | E-mail institucional da Promotoria e senha (provisória no primeiro acesso, com troca obrigatória) | Preencher, salvar e enviar diagnósticos **apenas** das Promotorias às quais a conta está vinculada. |
| **CAOCRIM (administrador)** | Conta registrada em `admin_users` | Revisar, devolver, validar e publicar diagnósticos; administrar Promotorias e contas; editar a base municipal; simular pesos. |

**Contas institucionais.** O acesso ao formulário é feito pela conta do e-mail **da Promotoria**, não pelo e-mail pessoal do titular. Os diagnósticos pertencem à Promotoria.
- Quem preenche informa nome e condição (titular, substituto(a), em respondência).
- A cada envio, declara quem está assinando, e essa declaração fica gravada na versão enviada.
- Na troca de titular nada precisa ser migrado: o CAOCRIM redefine a senha para a provisória e o novo titular cria a sua no primeiro acesso.

O perfil é sempre conferido no banco, pela função `is_admin()` e pelo vínculo em `usuarios_promotoria`. Esconder botões na interface é só conveniência e não protege nada.

---

## Arquitetura

```
┌──────────────────────────────┐        HTTPS (supabase-js)        ┌───────────────────────────────┐
│  SPA React (Vite) – Vercel   │ ────────────────────────────────▶ │  Supabase (Lovable Cloud)     │
│                              │                                   │                               │
│  • TanStack Router (rotas)   │   leitura pública (anon + RLS)    │  • PostgreSQL + RLS           │
│  • TanStack Query (cache)    │ ◀──────────────────────────────── │  • Funções SECURITY DEFINER   │
│  • Painéis, mapas, PDFs      │                                   │    (fluxo do diagnóstico)     │
│  • Formulário e revisão      │   RPC autenticadas (JWT)          │  • Auth + função de borda     │
│                              │ ────────────────────────────────▶ │  • Storage privado (anexos)   │
└──────────────────────────────┘                                   └───────────────────────────────┘
```

- **Sem servidor próprio.** O frontend é estático (SPA) e fala direto com o Supabase usando a chave pública. A segurança fica no banco: RLS em todas as tabelas e funções que validam perfil, vínculo e estado.
- **Cálculos no navegador.** O score de risco e os índices sintéticos são calculados em `src/lib/useMunicipios.ts` a partir de `municipios` e `eventos_feminicidio`. Assim a simulação de pesos funciona sem alterar o banco.
- **Publicação no banco.** A validação e publicação de diagnósticos roda numa única transação no PostgreSQL. Se algo falha, nada da base pública muda.

---

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Linguagem | TypeScript 5, React 19 |
| Build | Vite 7 (`@vitejs/plugin-react`, `vite-tsconfig-paths`) |
| Rotas | TanStack Router, com rotas por arquivo em `src/routes` e árvore gerada em `src/routeTree.gen.ts` |
| Dados | TanStack Query, `@supabase/supabase-js` |
| UI | Tailwind CSS 4, shadcn/ui (Radix UI), lucide-react, framer-motion |
| Gráficos e mapas | Recharts, d3-geo (GeoJSON dos municípios do Piauí) |
| Exportação | jsPDF + jspdf-autotable (PDF), xlsx (planilhas), CSV próprio |
| Backend | Supabase via Lovable Cloud: PostgreSQL, Auth e Storage |
| Testes | `node:test` + PGlite (PostgreSQL embutido) |
| Qualidade | ESLint 9, Prettier 3 |
| Hospedagem | Vercel |

---

## Estrutura do repositório

```
brigid/
├── database/                        # Tudo o que é banco de dados (ver database/README.md)
│   ├── carga-inicial/               #   base_municipios.sql: estrutura e carga inicial (destrutivo)
│   ├── cargas/                      #   atualizações temáticas da base municipal (opm.sql, creas.sql…)
│   ├── migrations/                  #   evolução do esquema, numerada na ordem de execução (01…07)
│   └── fontes/                      #   dados de origem (CSV/JSON) usados pelos geradores
├── docs/
│   ├── fluxo-diagnostico.md         # Fluxo do diagnóstico, mapeamento e implantação (detalhado)
│   ├── manual-tecnico.md            # Manual técnico em texto
│   └── manual-tecnico-sistema-brigid.docx
├── public/                          # Arquivos estáticos servidos pelo site (logos e favicon)
├── scripts/
│   ├── dados/                       # Geradores Python dos SQL de carga (gerar_sql_*.py)
│   ├── diagnostico/                 # Gerador das regras de completude
│   └── testes/                      # Testes do fluxo de diagnóstico (PGlite) e das contas
├── src/
│   ├── routes/                      # Páginas (rotas por arquivo)
│   │   └── diagnostico-brigid/      # Módulo de coleta, revisão e administração
│   ├── components/                  # Componentes (mapas, KPIs, formulário, shadcn/ui em ui/)
│   ├── context/AppContext.tsx       # Sessão, perfil (admin/público), pesos da simulação
│   ├── lib/
│   │   ├── supabase.ts                    # Cliente Supabase
│   │   ├── data-fetching.ts               # Consultas do painel
│   │   ├── useMunicipios.ts               # Score de risco e índices sintéticos
│   │   ├── config.ts                      # Janela oficial e anos parciais do modelo de risco
│   │   ├── dicionario-diagnostico.ts      # Dicionário do formulário (perguntas e regras)
│   │   ├── completude-diagnostico.ts      # Cálculo de completude (espelhado no SQL)
│   │   ├── inconsistencias-diagnostico.ts # Alertas de coerência para a revisão
│   │   └── export.ts                      # PDF/CSV/XLSX com identidade institucional
│   ├── services/                    # Acesso ao banco (diagnóstico, promotorias)
│   ├── integrations/supabase/       # Cliente e tipos gerados pelo Lovable (não usados pelo app)
│   └── data/                        # GeoJSON dos municípios do Piauí
├── supabase/
│   ├── config.toml                  # Identificação do projeto no Lovable Cloud
│   └── functions/contas-promotorias/ # Função de borda: cria contas e altera senhas (index.ts) e suas regras (acoes.ts)
├── .lovable/, bun.lock, bunfig.toml # Arquivos do ambiente Lovable (mantidos para a integração)
└── vercel.json                      # Reescrita de rotas da SPA
```

---

## Modelo de dados

### Base consolidada (leitura pública)

| Tabela | Conteúdo |
| --- | --- |
| `municipios` | Uma linha por município: população (total e feminina), comarca, polo regional, OPM, CREAS, campos do diagnóstico da rede (fluxos, protocolos, sala especializada, recursos mínimos, suficiência, assistência, capacitação, gargalos) e fontes. É a principal fonte do painel. |
| `eventos_feminicidio` | Eventos por município, ano e tipo (`CONSUMADO`/`TENTADO`), com `status_periodo` (`janela_oficial`, `parcial_corrente`, `historico_fechado`), `considera_no_score` e `origem_dado`. |
| `municipio_dados_publicados` | Valores aprovados pelo CAOCRIM por município, campo e período, com confiabilidade, fonte e caráter (preliminar/definitivo). |
| `entregas_estrategicas` | Entregas do Projeto Feminicídio Zero (página Gestão). |
| `promotorias_justica`, `promotoria_municipios` | Promotorias, atribuição funcional, e-mail institucional e municípios de abrangência. |
| `diagnostico_campos_regras`, `diagnostico_mapeamento_publicacao` | Regras de completude e lista fechada de campos publicáveis (transparência). |

### Coleta e fluxo (sem leitura pública)

| Tabela | Conteúdo |
| --- | --- |
| `diagnostico_brigid` | Diagnóstico de uma Promotoria para um município e período: atribuição, responsável, situação, versão atual e versão publicada. |
| `diagnostico_versoes` | Respostas de cada versão, hash do conteúdo, datas de envio, análise, devolução, validação e publicação, e quem assinou o envio. |
| `diagnostico_observacoes` | Observações internas e comentários de devolução, por bloco ou campo. |
| `diagnostico_anexos` | Metadados dos anexos (arquivos no bucket privado `diagnostico-anexos`). |
| `diagnostico_auditoria` | Trilha de auditoria de todas as ações. |
| `diagnostico_publicacoes` | Registro de cada publicação: versão, hash, quem validou e quando, e resultado. |
| `usuarios_promotoria` | Vínculo entre contas e Promotorias. |
| `admin_users` | Contas do CAOCRIM com perfil administrativo. |

---

## Metodologia de risco e índices

A metodologia completa está na página `/metodologia`. Em resumo:

**Janela oficial.** O score usa os eventos de **2023 a 2025** com `considera_no_score = true` (`src/lib/config.ts`). 2026 é tratado como **ciclo aberto, preliminar**, e não entra no score.

**Score de risco (modelo híbrido: ameaça × vulnerabilidade)**

```
taxa_consumados  = feminicídios consumados (2023–2025) / população feminina × 100.000
taxa_tentativas  = feminicídios tentados   (2023–2025) / população feminina × 100.000

ameaça           = 1 + taxa_consumados × peso_feminicídios + taxa_tentativas × peso_tentativas
vulnerabilidade  = 1 + (sem OPM ? peso_OPM/100 : 0) + (sem CREAS ? peso_CREAS/100 : 0)

score            = ameaça × vulnerabilidade
```

| Parâmetro | Padrão |
| --- | --- |
| Peso feminicídios consumados | 3 |
| Peso tentativas | 1 |
| Peso ausência de OPM | 2 |
| Peso ausência de CREAS | 2 |
| Limiar **médio** | 140 |
| Limiar **alto** | 270 |
| Limiar **crítico** | 390 |

Municípios em risco **alto** ou **crítico** são marcados como de atuação prioritária. Na página `/pesos`, o CAOCRIM pode simular outros pesos e limiares na sessão, sem alterar os valores oficiais.

**Índices sintéticos (0 a 10)**

| Índice | Composição |
| --- | --- |
| **IER** – Estrutura da Rede | sala especializada (3) + recursos mínimos (3) + suficiência da estrutura (adequada 4 / parcial 2) |
| **IMF** – Maturidade dos Fluxos | fluxo formal (3) + protocolo local/regional (3) + articulação da rede (4) |
| **IQT** – Qualificação Técnica | equipe multiprofissional (3) + capacitação em gênero (3,5) + treinamento específico em feminicídio (3,5) |

**Campos sem informação** aparecem como "Sem informação" e não somam pontos. O sistema **nunca** preenche valores artificialmente.

---

## Diagnóstico BRIGID: coleta, revisão e publicação

O detalhamento completo está em [`docs/fluxo-diagnostico.md`](docs/fluxo-diagnostico.md): estados, completude, mapeamento campo a campo, publicação e implantação.

**Estados** (completude, análise e publicação são informações independentes):

```
em preenchimento → enviado → em análise ─┬─▶ devolvido → (correção) → enviado …
                                          └─▶ validado → publicado → substituído (por nova versão)
```

**Formulário**
- **Blocos por atribuição:** cível → Cidadania, Fluxos e Socioassistencial; criminal → Segurança, Violência e Gargalos; cumulativa ou única → todos.
- **Completude:** considera só os campos obrigatórios aplicáveis e visíveis pelas regras condicionais. O mesmo cálculo roda no navegador e no banco, e um teste garante que os dois coincidem.
- **Tipos de resposta:** "Não", "Não se aplica", zero e "Não soube informar" são respostas distintas. "Não soube informar" exige justificativa e nunca vira "Não" ou zero.
- **Perguntas e regras:** vêm de `src/lib/dicionario-diagnostico.ts`. Se o dicionário mudar, rode `npm run gerar:regras` e reaplique a migration do fluxo.

**Revisão e publicação**
- **Revisão:** o CAOCRIM vê todas as respostas, pendências e inconsistências, fontes e anexos, a comparação com os dados publicados e o histórico. Pode registrar observações internas e devolver o diagnóstico com comentários por campo.
- **Validar e publicar:**
  - exige diagnóstico completo, a versão exata revisada (conferida por hash) e confirmação expressa;
  - conflitos com dados aprovados de outra Promotoria exigem confirmação campo a campo;
  - a publicação é transacional e idempotente, e preserva os blocos não publicados;
  - os campos que vão ao painel seguem uma **regra conservadora**: por exemplo, SIM somente para "funcionamento regular";
  - contagens de feminicídio informadas pelas Promotorias ficam **fora do score**.
- **Nunca são publicados:** observações, contatos, descrições livres, justificativas, anexos e dados de quem respondeu.

---

## Segurança

- **RLS em todas as tabelas.**
  - Base consolidada: leitura pública e escrita apenas do CAOCRIM.
  - Tabelas de coleta: leitura pelo CAOCRIM ou pela conta vinculada à Promotoria.
  - Nenhuma escrita direta pela API, nem do CAOCRIM. Toda escrita da coleta passa por funções `SECURITY DEFINER` com `search_path` fixo, que conferem perfil, vínculo e estado e registram auditoria.
- **Administração no banco:** o perfil administrativo vem de `admin_users` e é conferido por `is_admin()`.
- **Anexos:** ficam em bucket privado, acessíveis só pelo CAOCRIM e pela Promotoria dona do diagnóstico, por URL assinada de 5 minutos.
- **Contas das Promotorias:** criadas só pelo CAOCRIM (cadastro aberto desativado), com credencial provisória individual e definição obrigatória de senha no primeiro acesso.
  - A credencial é aleatória, gerada no servidor a cada emissão, exibida uma única vez ao CAOCRIM e guardada só como hash, numa tabela que só a chave de serviço lê. Vale por 72 horas, pelo relógio do servidor.
  - Enquanto a senha definitiva não for definida, o banco bloqueia todo acesso aos diagnósticos, e a marca só sai pela função de borda.
  - A definição de senha só é aceita para a própria conta, com a credencial correta e dentro da validade; contas definitivas e do CAOCRIM são recusadas.
  - Aprovar ou vincular nunca altera a senha de uma conta existente: só "Redefinir senha" emite nova credencial.
  - A API do Supabase ainda permite que uma sessão válida troque a própria senha ou e-mail: ative *Secure password change* e *Secure email change* no Supabase (ver [`docs/fluxo-diagnostico.md`](docs/fluxo-diagnostico.md)).
- **Chaves:** a chave pública (`VITE_SUPABASE_PUBLISHABLE_KEY`) vai no código do navegador, por definição. A **chave de serviço nunca deve ir para o repositório** nem para variáveis com prefixo `VITE_`.

---

## Executando localmente

### Pré-requisitos

- Node.js **20.19 ou superior** (recomendado 22 LTS) e npm.
- Acesso a um projeto Supabase com as migrations aplicadas (ver abaixo).

### Passos

```bash
git clone https://github.com/cleristondecastroramos/brigid.git
cd brigid
npm install
```

Crie (ou confira) o arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL="https://<projeto>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<chave pública (anon)>"
VITE_SUPABASE_PROJECT_ID="<id do projeto>"
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O app abre em `http://localhost:5173`. Ele consulta o banco configurado no `.env`; se for o de produção, os dados exibidos são os reais.

---

## Banco de dados: criação e migrations

Todos os scripts SQL ficam em [`database/`](database/README.md). Para montar um banco do zero, execute no SQL Editor, nesta ordem:

1. `database/carga-inicial/base_municipios.sql`: estrutura e carga inicial de `municipios` e `entregas_estrategicas`.
   > **Atenção:** começa com `DROP TABLE`. Use **apenas** num banco novo, nunca em produção.
2. `database/cargas/*.sql`: população, OPM, CREAS, diagnóstico da rede, protocolos, assistência, capacitações, gargalos e casos.
3. `database/migrations/01_…` a `09_…`, em ordem numérica:
   - eventos de feminicídio;
   - Promotorias;
   - diagnóstico;
   - RLS e administração;
   - fluxo do diagnóstico;
   - contas das Promotorias;
   - contador de acessos;
   - bloqueio das contas das Promotorias até o primeiro acesso;
   - credencial provisória individual.

Num banco que já está em uso, aplique apenas as migrations que ainda não rodaram. As migrations `02` a `09` podem ser reexecutadas. A `01` não pode, porque duplicaria os eventos. A tabela de [`database/README.md`](database/README.md) relaciona os nomes atuais aos nomes antigos dos arquivos.

---

## Carga e atualização de dados

As informações temáticas da base municipal vêm de planilhas em `database/fontes/` ou de dados embutidos nos próprios geradores. Cada tema tem um gerador Python em `scripts/dados/` que produz o SQL correspondente:

| Origem | Gerador (`scripts/dados/`) | SQL gerado |
| --- | --- | --- |
| `fontes/municipios_base.json` | `gerar_sql_base_municipios.py` | `carga-inicial/base_municipios.sql` |
| `fontes/populacao_pi.csv` | `gerar_sql_populacao.py` | `cargas/populacao.sql` |
| `fontes/rede_protecao_assistencial.csv` | `gerar_sql_assistencia.py` | `cargas/assistencia.sql` |
| `fontes/capacitacoes.csv` | `gerar_sql_capacitacoes.py` | `cargas/capacitacoes.sql` |
| `fontes/diagnostico_rede_protecao_piaui.csv` | `gerar_sql_diagnostico.py` | `cargas/diagnostico.sql` |
| `fontes/gargalos.csv` | `gerar_sql_gargalos.py` | `cargas/gargalos.sql` |
| Protocolos (dados no próprio script) | `gerar_sql_protocolos.py` | `cargas/protocolos.sql` |
| OPM (dados no próprio script) | `gerar_sql_opm.py` | `cargas/opm.sql` |
| CREAS (dados no script, cruzados com a carga inicial) | `gerar_sql_creas.py` | `cargas/creas.sql` |
| Casos de feminicídio (dados no próprio script) | `gerar_sql_casos_feminicidio.py` | `cargas/casos_feminicidio.sql` |
| `fontes/promotorias.csv` + `fontes/municipios_base.json` | `gerar_sql_promotorias.py` | `migrations/02_promotorias.sql` |

Os caminhos da tabela são relativos a `database/`. Os geradores podem ser executados de qualquer pasta.

Fluxo de atualização:
1. Atualize o arquivo de origem.
2. Rode o gerador:
   ```bash
   python scripts/dados/gerar_sql_populacao.py
   ```
3. Revise o SQL gerado e execute-o no banco.

Com o fluxo de diagnóstico em funcionamento, a forma preferencial de atualizar os campos do diagnóstico da rede passa a ser a **publicação de diagnósticos validados pelo CAOCRIM**, que registra origem, período e confiabilidade de cada valor.

---

## Testes

```bash
npm run test:diagnostico
```

Executa os **scripts SQL reais do projeto** num PostgreSQL embutido (PGlite), simulando os papéis do Supabase (`anon`, `authenticated`) e `auth.uid()`, com RLS ativo, e as regras da função de borda `contas-promotorias` com dublês do banco e da autenticação. Não precisa de rede nem de banco externo. Os cenários cobertos incluem:

- **O que não publica:** rascunho, diagnóstico 100% sem aprovação, diagnóstico enviado e devolução não alteram a base pública.
- **Validação:** diagnóstico incompleto ou com conteúdo diferente do revisado não pode ser validado.
- **Permissões:** contas sem perfil administrativo não publicam nem por chamada direta à API, e escrita direta nas tabelas é bloqueada.
- **Publicação:**
  - integra os dados aprovados à base consolidada;
  - repeti-la não duplica registros;
  - uma falha no meio não deixa nada pela metade;
  - publicar um bloco não apaga os outros;
  - conflitos entre Promotorias exigem confirmação.
- **Privacidade e caráter:** dados privados não vazam, e dados preliminares continuam preliminares.
- **Regras de conversão:** recursos mínimos, suficiência e capacitações.
- **Contas:** só o CAOCRIM aprova e redefine; a credencial é individual a cada emissão e nunca aparece em consultas ou logs; a marca provisória bloqueia diagnósticos e anexos e não pode ser alterada pelo cliente; reaprovar ou vincular não altera senha nem credencial; a definição de senha recusa conta definitiva, conta do CAOCRIM, outro usuário, credencial errada ou expirada e falhas parciais; não há senha fixa no código do navegador; cada envio registra quem assinou.
- **Completude:** o cálculo do navegador e o do banco coincidem em 400 casos aleatórios.

Também é recomendável rodar antes de publicar alterações:

```bash
npm run build
npx tsc --noEmit
npm run lint
```

---

## Scripts disponíveis

| Comando | Função |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (Vite). |
| `npm run build` | Build de produção em `dist/` (também regenera `src/routeTree.gen.ts`). |
| `npm run preview` | Serve o build localmente. |
| `npm run lint` | ESLint. |
| `npm run format` | Prettier em todo o projeto. |
| `npm run test:diagnostico` | Testes do fluxo de diagnóstico (PGlite) e da função de contas. |
| `npm run gerar:regras` | Regenera as regras de completude na migration a partir do dicionário. |

---

## Implantação

### Frontend (Vercel)

- **Deploy:** a Vercel publica a partir da branch `main`. O comando de build é `npm run build` e a saída é `dist/`.
- **Rotas:** `vercel.json` reescreve todas as rotas para `index.html`, como exige uma SPA.
- **Variáveis de ambiente** no projeto da Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID`.

### Backend (Lovable Cloud / Supabase)

- **Migrations:** aplicar conforme a seção [Banco de dados](#banco-de-dados-criação-e-migrations).
- **Função de borda `contas-promotorias`** (`supabase/functions/contas-promotorias/`): cria as contas das Promotorias e altera senhas com a chave de serviço, que fica só no servidor e nunca vai para o navegador. No Lovable Cloud, é publicada pelo próprio Lovable; confira em **More → Edge Functions** e, se não aparecer, peça a publicação no chat do Lovable. No Supabase próprio: `supabase functions deploy contas-promotorias`.
- **More → Users → Settings:** ativar **Disable sign-up**, **Secure password change** e **Secure email change**. O sistema não usa e-mails de convite nem de recuperação de senha.
- **CAOCRIM:** criar a conta em **More → Users → Add user → Create new user** e marcá-la como administradora:
  ```sql
  INSERT INTO public.admin_users (user_id)
  SELECT id FROM auth.users WHERE email = 'caocrim@mppi.mp.br';
  ```
- **Contas das Promotorias:** ver [Operação do dia a dia](#operação-do-dia-a-dia).

---

## Operação do dia a dia

### Cadastrar as contas das Promotorias

Tudo é feito em **Diagnóstico BRIGID → Administração → Contas das Promotorias**; nenhum e-mail é enviado pelo sistema.

1. Escolha a Promotoria, informe o e-mail institucional e clique em **"Aprovar e ativar cadastro"**.
2. Para uma conta nova, o painel mostra **uma única vez** o e-mail, a **credencial provisória individual** gerada pelo sistema e a validade. Entregue-a somente à Promotoria, por canal seguro; ela não pode ser consultada depois.
3. No primeiro acesso, a Promotoria entra com o e-mail e a credencial e é obrigada a definir uma senha definitiva (mínimo de 12 caracteres), informando de novo a credencial. Até lá, o formulário fica bloqueado, inclusive no banco.

A credencial vale por **72 horas**; depois disso, a coluna **Situação** mostra "Credencial provisória expirada" e é preciso redefinir a senha. Antes, a situação é "Aguardando primeiro acesso". A coluna **Senha definida em** mostra quando a Promotoria criou a senha atual, para ela confirmar que foi ela. Aprovar de novo ou vincular uma conta existente nunca altera a senha (a tabela completa está em [`docs/fluxo-diagnostico.md`](docs/fluxo-diagnostico.md)).

### Esquecimento de senha e troca de titular

- Clique em **"Redefinir senha"** na linha da conta e confirme. A senha anterior deixa de valer, as sessões abertas são encerradas e uma nova credencial individual é emitida, válida por 72 horas. A redefinição vale para a conta em todos os seus vínculos.
- O novo titular informa o próprio nome e a condição no diagnóstico; o histórico preserva quem assinou cada envio anterior.

Recomenda-se redefinir a senha sempre que o titular mudar.

### Revisar e publicar diagnósticos

1. Abra **Diagnóstico BRIGID → Revisão CAOCRIM** e escolha um diagnóstico enviado.
2. Clique em **Iniciar análise** e revise as respostas, pendências, inconsistências, anexos e a comparação com o publicado.
3. Para devolver, comente os campos que precisam de correção e use **Devolver para correção**.
4. Para aprovar, use **Validar e publicar**: confira o resumo das alterações, confirme os conflitos se houver, e marque a declaração de revisão.

### Alterar perguntas do formulário

1. Edite `src/lib/dicionario-diagnostico.ts`.
2. Rode `npm run gerar:regras`.
3. Se a pergunta alimentar o painel, inclua a regra em `diagnostico_mapeamento_publicacao` (na migration do fluxo) e atualize `docs/fluxo-diagnostico.md`.
4. Rode `npm run test:diagnostico` e reaplique a migration no banco.

---

## Limitações conhecidas e pendências técnicas

- **Edição direta da base:** a página `/base` permite ao CAOCRIM editar `municipios` diretamente, fora do fluxo de validação. Use-a só para correções da carga histórica.
- **Campos sem pergunta no formulário:** `tem_atendimento_juridico`, `tem_equipe_multiprofissional`, `tem_articulacao_rede` e `treinamento_especifico_feminicidio` não têm pergunta e aparecem como "Sem informação" enquanto não houver carga. Isso reduz os índices IMF e IQT.
- **Credencial provisória:** quem obtiver a credencial de uma conta ainda não ativada, dentro das 72 horas, pode ativá-la antes da Promotoria. Entregue-a por canal seguro, aprove perto do momento de uso e peça à Promotoria que confira "Senha definida em". A credencial expirada ainda autentica no Supabase, mas não dá acesso a nada nem permite definir a senha.
- **Dois clientes Supabase:** `src/lib/supabase.ts`, o usado, e `src/integrations/supabase/`, gerado e mantido pelo Lovable.
- **Dois gerenciadores de pacotes:** o projeto usa npm (`package-lock.json`), mas o ambiente Lovable mantém `bun.lock` e `bunfig.toml`. Ao mudar dependências, convém atualizar os dois ou padronizar num só.
- **`.env` versionado:** o arquivo está no repositório, hoje só com a chave pública. Recomenda-se incluí-lo no `.gitignore` e configurar as variáveis em cada ambiente.
- **Erro antigo de tipagem** em `src/components/blocks/cta-section-with-gallery.tsx`, sem efeito no build.
- **Bundle grande:** o pacote principal passa de 500 kB, e caberia dividir em pedaços (code splitting).

---

## Documentação complementar

- [`docs/fluxo-diagnostico.md`](docs/fluxo-diagnostico.md): fluxo do diagnóstico, completude, mapeamento formulário → painel, publicação, contas e implantação.
- Página **Metodologia de Cálculos** (`/metodologia`): fórmulas e critérios dos indicadores.
- [`database/README.md`](database/README.md): organização dos scripts SQL, ordem de execução e dados de origem.
- **Manual Técnico**: página `/manual`, [`docs/manual-tecnico.md`](docs/manual-tecnico.md) e [`docs/manual-tecnico-sistema-brigid.docx`](docs/manual-tecnico-sistema-brigid.docx).

---

**Ministério Público do Estado do Piauí · CAOCRIM · Projeto Feminicídio Zero**
