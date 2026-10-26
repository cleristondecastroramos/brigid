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
| `/` | Página inicial | Apresentação do projeto e as duas entradas (painel e diagnóstico). |
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
| `/diagnostico-brigid/administracao` | CAOCRIM | Atribuição funcional das Promotorias, e-mails institucionais e vínculo das contas. |
| `/diagnostico-brigid/redefinir-senha` | Contas das Promotorias | Definição de senha a partir do convite ou do "Esqueci minha senha". |

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
| **Conta da Promotoria** | E-mail institucional da Promotoria e senha | Preencher, salvar e enviar diagnósticos **apenas** das Promotorias às quais a conta está vinculada. |
| **CAOCRIM (administrador)** | Conta registrada em `admin_users` | Revisar, devolver, validar e publicar diagnósticos; administrar Promotorias e contas; editar a base municipal; simular pesos. |

**Contas institucionais.** O acesso ao formulário é feito pela conta do e-mail **da Promotoria**, não pelo e-mail pessoal do titular. Os diagnósticos pertencem à Promotoria.
- Quem preenche informa nome e condição (titular, substituto(a), em respondência).
- A cada envio, declara quem está assinando, e essa declaração fica gravada na versão enviada.
- Na troca de titular nada precisa ser migrado: o novo titular redefine a senha pelo próprio e-mail institucional.

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
│  • Formulário e revisão      │   RPC autenticadas (JWT)          │  • Auth (contas e convites)   │
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
├── docs/
│   └── fluxo-diagnostico.md        # Fluxo do diagnóstico, mapeamento e implantação (detalhado)
├── migrations/                     # Migrations do Supabase (ver ordem abaixo)
│   ├── migration_promotorias.sql   # Promotorias e abrangência territorial (com dados)
│   ├── migration_diagnostico.sql   # Estrutura inicial do diagnóstico
│   ├── migration_rls_admin.sql     # admin_users, is_admin() e RLS das tabelas de dados
│   ├── migration_fluxo_diagnostico.sql   # Versões, revisão, publicação, regras e permissões
│   └── migration_contas_promotorias.sql  # Vínculo em lote das contas institucionais
├── public/
│   ├── data/                       # CSVs de origem, GeoJSON do Piauí e manual técnico (.docx)
│   └── logo_brigid.png, brigid.png, favicon.ico
├── scripts/
│   ├── testes/fluxo-diagnostico.test.mjs  # Testes do fluxo (PGlite)
│   ├── gerar-regras-diagnostico.mjs       # Gera regras de completude a partir do dicionário
│   ├── convidar-contas-promotorias.mjs    # Planilha, SQL e convites das contas das Promotorias
│   ├── gerar_promotorias.py               # Gera seeds de Promotorias e abrangência
│   └── init-db.js, update-manual.cjs, update-md.cjs
├── src/
│   ├── routes/                     # Páginas (rotas por arquivo)
│   │   └── diagnostico-brigid/     # Módulo de coleta, revisão e administração
│   ├── components/                 # Componentes (mapas, KPIs, formulário, shadcn/ui)
│   ├── context/AppContext.tsx      # Sessão, perfil (admin/público), pesos da simulação
│   ├── lib/
│   │   ├── supabase.ts                   # Cliente Supabase
│   │   ├── data-fetching.ts              # Consultas do painel
│   │   ├── useMunicipios.ts              # Score de risco e índices sintéticos
│   │   ├── config.ts                     # Janela oficial e anos parciais do modelo de risco
│   │   ├── dicionario-diagnostico.ts     # Dicionário do formulário (perguntas e regras)
│   │   ├── completude-diagnostico.ts     # Cálculo de completude (espelhado no SQL)
│   │   ├── inconsistencias-diagnostico.ts# Alertas de coerência para a revisão
│   │   └── export.ts                     # PDF/CSV/XLSX com identidade institucional
│   ├── services/                   # Acesso ao banco (diagnóstico, promotorias)
│   └── data/                       # GeoJSON e seeds estáticos
├── schema_e_seed.sql               # Criação e carga inicial de municipios e entregas_estrategicas
├── atualizar_*.sql                 # Atualizações temáticas da base municipal (geradas dos CSVs)
├── gerar_sql_*.py, script_gerador.py  # Geradores dos atualizar_*.sql
├── migration_eventos_risco.sql     # Tabela normalizada de eventos de feminicídio
├── supabase/setup_visitor_counter.sql  # Contador de acessos
└── vercel.json                     # Reescrita de rotas da SPA
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
- **Cadastro aberto desativado:** as contas são criadas ou convidadas pelo CAOCRIM.
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

> **Atenção:** `schema_e_seed.sql` começa com `DROP TABLE` de `municipios` e `entregas_estrategicas`. Use-o **apenas** para montar um banco do zero, nunca em produção.

Para montar um banco do zero, execute no SQL Editor, nesta ordem:

1. `schema_e_seed.sql` (estrutura e carga inicial de `municipios` e `entregas_estrategicas`)
2. `atualizar_*.sql` (população, OPM, CREAS, diagnóstico da rede, protocolos, assistência, capacitações, gargalos, casos)
3. `migration_eventos_risco.sql` (eventos de feminicídio normalizados)
4. `migrations/migration_promotorias.sql`
5. `migrations/migration_diagnostico.sql`
6. `migrations/migration_rls_admin.sql`
7. `migrations/migration_fluxo_diagnostico.sql`
8. `migrations/migration_contas_promotorias.sql`
9. `supabase/setup_visitor_counter.sql` (contador de acessos)

Num banco que já está em uso, aplique apenas as migrations que ainda não rodaram. Todas as migrations em `migrations/` são idempotentes e podem ser reexecutadas.

---

## Carga e atualização de dados

As informações temáticas da base municipal vêm de planilhas em `public/data/` ou de dados embutidos nos próprios geradores. Cada tema tem um gerador Python que produz o SQL correspondente:

| CSV de origem | Gerador | SQL gerado |
| --- | --- | --- |
| `populacao_pi.csv` | `gerar_sql_populacao.py` | `atualizar_populacao.sql` |
| `rede_protecao_assistencial.csv` | `gerar_sql_assistencia.py` | `atualizar_assistencia.sql` |
| `capacitacoes.csv` | `gerar_sql_capacitacoes.py` | `atualizar_capacitacoes.sql` |
| `diagnostico_rede_protecao_piaui.csv` | `gerar_sql_diagnostico.py` | `atualizar_diagnostico.sql` |
| `gargalos.csv` | `gerar_sql_gargalos.py` | `atualizar_gargalos.sql` |
| Protocolos (dados no próprio script) | `gerar_sql_protocolos.py` | `atualizar_protocolos.sql` |
| OPM (dados no próprio script) | `gerar_sql_opm.py` | `atualizar_opm.sql` |
| CREAS (dados no script, cruzados com `schema_e_seed.sql`) | `gerar_sql_creas.py` | `atualizar_creas.sql` |
| Casos de feminicídio (dados no próprio script) | `script_gerador.py` | `atualizar_casos_feminicidio.sql` |

Fluxo de atualização:
1. Atualize o CSV.
2. Rode o gerador:
   ```bash
   python gerar_sql_populacao.py
   ```
3. Revise o SQL gerado e execute-o no banco.

Com o fluxo de diagnóstico em funcionamento, a forma preferencial de atualizar os campos do diagnóstico da rede passa a ser a **publicação de diagnósticos validados pelo CAOCRIM**, que registra origem, período e confiabilidade de cada valor.

---

## Testes

```bash
npm run test:diagnostico
```

Executa os **scripts SQL reais do projeto** num PostgreSQL embutido (PGlite), simulando os papéis do Supabase (`anon`, `authenticated`) e `auth.uid()`, com RLS ativo. Não precisa de rede nem de banco externo. Os cenários cobertos incluem:

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
- **Contas:** cada envio registra quem assinou, e o vínculo em lote funciona e pode ser repetido.
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
| `npm run test:diagnostico` | Testes do fluxo de diagnóstico (PGlite). |
| `npm run gerar:regras` | Regenera as regras de completude na migration a partir do dicionário. |
| `node scripts/convidar-contas-promotorias.mjs --modelo contas.csv` | Gera a planilha com todas as Promotorias para preencher os e-mails institucionais. |
| `node scripts/convidar-contas-promotorias.mjs contas.csv --sql emails.sql` | Gera o SQL que grava os e-mails institucionais (Lovable Cloud). |
| `node scripts/convidar-contas-promotorias.mjs contas.csv [--simular]` | Convida e vincula as contas de uma vez (exige chave de serviço; Supabase próprio). |

---

## Implantação

### Frontend (Vercel)

- **Deploy:** a Vercel publica a partir da branch `main`. O comando de build é `npm run build` e a saída é `dist/`.
- **Rotas:** `vercel.json` reescreve todas as rotas para `index.html`, como exige uma SPA.
- **Variáveis de ambiente** no projeto da Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_PROJECT_ID`.

### Backend (Lovable Cloud / Supabase)

- **Migrations:** aplicar conforme a seção [Banco de dados](#banco-de-dados-criação-e-migrations).
- **More → Users → Settings:**
  - ativar **Disable sign-up**;
  - em **Advanced**, definir a **Site URL** como `https://brigid-mppi.vercel.app` e incluir `https://brigid-mppi.vercel.app/diagnostico-brigid/redefinir-senha` em **Redirect URLs**;
  - se esses campos não puderem ser editados, peça a configuração no chat do Lovable.
- **CAOCRIM:** criar a conta em **More → Users → Add user → Create new user** e marcá-la como administradora:
  ```sql
  INSERT INTO public.admin_users (user_id)
  SELECT id FROM auth.users WHERE email = 'caocrim@mppi.mp.br';
  ```
- **Contas das Promotorias:** ver [Operação do dia a dia](#operação-do-dia-a-dia).

---

## Operação do dia a dia

### Cadastrar as contas das Promotorias

1. Gere a planilha:
   ```bash
   node scripts/convidar-contas-promotorias.mjs --modelo contas.csv
   ```
   Preencha a coluna `email` no Excel (separador `;`).
2. Gere o SQL dos e-mails e execute-o no banco:
   ```bash
   node scripts/convidar-contas-promotorias.mjs contas.csv --sql emails.sql
   ```
   Também é possível digitar os e-mails na tela **Administração**.
3. Convide cada e-mail em **More → Users → Add user → Send invitation**. O link do convite leva à tela "Definir senha da Promotoria".
4. Na tela **Administração**, clique em **"Vincular contas pelo e-mail institucional"**. Pode repetir depois de novos convites.

### Troca de titular

Não exige nenhuma ação do CAOCRIM:
- o novo titular usa **"Esqueci minha senha"** na tela de acesso do módulo;
- informa o próprio nome e a condição no diagnóstico;
- o histórico preserva quem assinou cada envio anterior.

Recomenda-se trocar a senha sempre que o titular mudar.

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
- **Convites no Lovable Cloud:** são enviados um a um pela tela do Lovable, que não oferece convite em lote sem chave de serviço.
- **Telas em desenvolvimento:** `/diagnostico-brigid/painel` e `/diagnostico-brigid/base`.
- **Código legado a remover:** `db.json` e o script `server` (json-server), além de utilitários antigos (`script_schema_seed.py`, `scale_fonts.cjs`, pasta `scratch/`).
- **Dois clientes Supabase:** `src/lib/supabase.ts`, o usado, e `src/integrations/supabase/`, gerado pelo Lovable.
- **`.env` versionado:** o arquivo está no repositório, hoje só com a chave pública. Recomenda-se incluí-lo no `.gitignore` e configurar as variáveis em cada ambiente.
- **Erro antigo de tipagem** em `src/components/blocks/cta-section-with-gallery.tsx`, sem efeito no build.
- **Bundle grande:** o pacote principal passa de 500 kB, e caberia dividir em pedaços (code splitting).

---

## Documentação complementar

- [`docs/fluxo-diagnostico.md`](docs/fluxo-diagnostico.md): fluxo do diagnóstico, completude, mapeamento formulário → painel, publicação, contas e implantação.
- Página **Metodologia de Cálculos** (`/metodologia`): fórmulas e critérios dos indicadores.
- **Manual Técnico** (`/manual` e `public/data/manual-tecnico-sistema-brigid.docx`).

---

**Ministério Público do Estado do Piauí · CAOCRIM · Projeto Feminicídio Zero**
