# Banco de dados

Scripts SQL e dados de origem do BRIGID (PostgreSQL/Supabase, hospedado no Lovable Cloud).

```
database/
├── carga-inicial/   # Estrutura e carga inicial da base municipal (DESTRUTIVO: recria tabelas)
├── cargas/          # Atualizações temáticas da base municipal, geradas por scripts/dados
├── migrations/      # Evolução do esquema, numerada na ordem de execução
└── fontes/          # Dados de origem (CSV/JSON) usados pelos geradores
```

## Ordem de execução (banco novo)

Execute no SQL Editor, nesta ordem:

1. **`carga-inicial/base_municipios.sql`** — cria e popula `municipios` e `entregas_estrategicas`.
   > Começa com `DROP TABLE`. **Nunca** execute em um banco em uso.
2. **`cargas/*.sql`** — população, OPM, CREAS, efetividade OPM, diagnóstico da rede, protocolos, assistência, capacitações, gargalos e casos de feminicídio.
3. **`migrations/`**, em ordem numérica:

| Migration | Conteúdo | Pode reexecutar? |
| --- | --- | --- |
| `01_eventos_feminicidio.sql` | Tabela `eventos_feminicidio` e migração dos casos 2023–2026 a partir de `municipios` | **Não**: duplica os eventos |
| `02_promotorias.sql` | Promotorias, abrangência territorial e dados (gerada por `scripts/dados/gerar_sql_promotorias.py`) | Sim |
| `03_diagnostico.sql` | Estrutura inicial do diagnóstico | Sim |
| `04_rls_admin.sql` | `admin_users`, `is_admin()` e RLS das tabelas de dados | Sim |
| `05_fluxo_diagnostico.sql` | Versões, revisão, validação, publicação, regras de completude, mapeamento e permissões | Sim |
| `06_contas_promotorias.sql` | Vínculo em lote das contas institucionais das Promotorias (substituído pela 08) | Sim |
| `07_contador_acessos.sql` | Contador de acessos do site (`site_visits`, `get_visitor_stats`) | Sim |
| `08_senha_provisoria.sql` | Cadastro das contas pelo CAOCRIM com senha provisória e troca obrigatória (usa a função de borda `contas-promotorias`) | Sim |

Em um banco que já está em uso, aplique apenas as migrations que ainda não foram executadas.

## Nomes anteriores

Até a reorganização do repositório, os arquivos tinham outros nomes e locais:

| Atual | Anterior |
| --- | --- |
| `carga-inicial/base_municipios.sql` | `schema_e_seed.sql` |
| `cargas/<tema>.sql` | `atualizar_<tema>.sql` |
| `migrations/01_eventos_feminicidio.sql` | `migration_eventos_risco.sql` |
| `migrations/02_promotorias.sql` … `06_contas_promotorias.sql` | `migrations/migration_<nome>.sql` |
| `migrations/07_contador_acessos.sql` | `supabase/setup_visitor_counter.sql` |
| `fontes/*.csv` | `public/data/*.csv` |
| `fontes/municipios_base.json` | `db.json` |
| `fontes/promotorias.csv` | `src/data/promotorias.csv` |

## Dados de origem (`fontes/`)

| Arquivo | Uso |
| --- | --- |
| `municipios_base.json` | Base municipal de referência: origem de `carga-inicial/base_municipios.sql` e da abrangência das Promotorias |
| `promotorias.csv` | Promotorias e municípios atendidos: origem de `migrations/02_promotorias.sql` |
| `populacao_pi.csv` | População total e feminina: origem de `cargas/populacao.sql` |
| `rede_protecao_assistencial.csv` | Assistência social: origem de `cargas/assistencia.sql` |
| `capacitacoes.csv` | Capacitações: origem de `cargas/capacitacoes.sql` |
| `diagnostico_rede_protecao_piaui.csv` | Diagnóstico da rede: origem de `cargas/diagnostico.sql` |
| `gargalos.csv` | Gargalos: origem de `cargas/gargalos.sql` |
| `base_mppi_caocrim.csv`, `BRIGID_matriz_estrutura_municipios.csv`, `tabela_protocolo_tec.csv` | Planilhas originais mantidas como referência histórica (não usadas por geradores) |

Os geradores ficam em [`scripts/dados/`](../scripts/dados) e podem ser executados de qualquer pasta, por exemplo:

```bash
python scripts/dados/gerar_sql_populacao.py
```

Revise o SQL gerado antes de executá-lo no banco. Com o fluxo de diagnóstico em funcionamento, a forma preferencial de atualizar os campos do diagnóstico da rede é a **publicação de diagnósticos validados pelo CAOCRIM**.
