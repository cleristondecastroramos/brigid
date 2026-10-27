# Metodologia de Análise de Risco Territorial e Índices da Rede de Proteção — Sistema BRÍGID

**Ministério Público do Estado do Piauí — MPPI**  
**Centro de Apoio Operacional Criminal — CAOCRIM**  
**Projeto Feminicídio Zero**  
*Documento de Governança Analítica, Modelagem Matemática e Regras de Negócio*

---

## Sumário Executivo

1. [Apresentação e Finalidade Institucional](#1-apresentação-e-finalidade-institucional)
2. [Fundamento Teórico: Paradigma de Risco Territorial](#2-fundamento-teórico-paradigma-de-risco-territorial)
3. [Fontes de Dados e Ciclos de Integração](#3-fontes-de-dados-e-ciclos-de-integração)
4. [Análise de OPM e CREAS no Modelo de Risco](#4-análise-de-opm-e-creas-no-modelo-de-risco)
   - 4.1 Organismos de Políticas para as Mulheres (OPM)
   - 4.2 Centros de Referência Especializados de Assistência Social (CREAS)
   - 4.3 Critérios de Elegibilidade e Prioridade de Implantação
5. [Variáveis Complementares e Diagnóstico da Rede](#5-variáveis-complementares-e-diagnóstico-da-rede)
   - 5.1 Infraestrutura Material e Recursos Mínimos
   - 5.2 Fluxos e Protocolos Intersetoriais
   - 5.3 Segurança Pública, Investigação e Perícia
   - 5.4 Mapeamento Sistemático de Gargalos
6. [Índices Sintéticos Municipais (Escala 0 a 10)](#6-índices-sintéticos-municipais-escala-0-a-10)
   - 6.1 Índice de Estrutura da Rede (IER)
   - 6.2 Índice de Maturidade dos Fluxos (IMF)
   - 6.3 Índice de Qualificação Técnica (IQT)
   - 6.4 Média Geral Institucional (MGI)
7. [Algoritmo de Cálculo do Score de Risco de Feminicídio](#7-algoritmo-de-cálculo-do-score-de-risco-de-feminicídio)
   - 7.1 Janela Oficial de Eventos e Ponderação Criminal
   - 7.2 Denominador Demográfico e Taxas Relativas
   - 7.3 Modelagem Híbrida: Ameaça × Vulnerabilidade
   - 7.4 Limiares Normativos (Thresholds) e Faixas de Risco
   - 7.5 Atuação Prioritária Dinâmica vs. Marcação Estratégica
8. [Sistema de Alertas da Rede de Proteção](#8-sistema-de-alertas-da-rede-de-proteção)
9. [Análises Espaciais, Comparativas e Relatórios de Intervenção](#9-análises-espaciais-comparativas-e-relatórios-de-intervenção)
   - 9.1 Camadas do Mapa Coroplético Territorial
   - 9.2 Pentágono Radar Multidimensional (Ficha Técnica Municipal)
   - 9.3 Relatórios Operacionais e de Cobrança Institucional
10. [Governança, Rastreabilidade e Transparência Algorítmica](#10-governança-rastreabilidade-e-transparência-algorítmica)

---

## 1. Apresentação e Finalidade Institucional

O **BRÍGID — Base de Referência Integrada para Gestão, Inteligência e Dados** é a plataforma de inteligência analítica e monitoramento territorial do Ministério Público do Estado do Piauí (MPPI), concebida no âmbito do **Projeto Feminicídio Zero** sob governança do **Centro de Apoio Operacional Criminal (CAOCRIM)**.

A plataforma tem como missão converter dados heterogêneos — registros criminais de violência letal, levantamentos demográficos do IBGE, registros de órgãos de assistência e formulários setoriais preenchidos pelas Promotorias de Justiça nos 224 municípios piauienses — em **indicadores padronizados, comparáveis e auditáveis**. 

### Objetivos Analíticos Centrais
1. **Mensuração Territorial do Risco**: Superar distorções geradas por contagens meramente absolutas de homicídios/feminicídios, contextualizando a violência com a escala populacional de mulheres e a vulnerabilidade do aparato estatal local.
2. **Diagnóstico dos Equipamentos da Rede**: Mapear a presença, funcionalidade e carência de estruturas vitais, especialmente **OPM** (Organismos de Políticas para as Mulheres) e **CREAS** (Centros de Referência Especializados de Assistência Social).
3. **Avaliação da Qualidade do Fluxo e Pessoal**: Aferir se os municípios dispõem de protocolos formais de atendimento, perícias técnicas padronizadas e profissionais capacitados em perspectiva de gênero.
4. **Indução Proativa de Atuação Ministerial**: Fornecer subsídios fáticos e jurídicos imediatos (fichas técnicas, rankings de prioridade, termos de ajustamento e relatórios de intervenção) para a atuação das Promotorias de Justiça e da Procuradoria-Geral de Justiça.

---

## 2. Fundamento Teórico: Paradigma de Risco Territorial

A formulação matemática do sistema BRÍGID rejeita o reducionismo de ranquear municípios com base apenas em números brutos de boletins de ocorrência. Em segurança pública e ciências sociais, um município de 800 mil habitantes (como a capital Teresina) apresentará invariavelmente maior volume absoluto de homicídios do que uma cidade de 5 mil habitantes. No entanto, taxas relativas extremas em municípios de pequeno porte, associadas à inexistência de delegacias ou serviços de acolhimento, indicam um **cenário de desamparo institucional letal**.

Para solucionar essa assimetria, o sistema BRÍGID incorpora o modelo internacional de **Análise de Risco de Desastres e Vulnerabilidade Socioinstitucional**:

$$\mathbf{Risco} = \mathbf{Amea\text{ç}a} \times \mathbf{Vulnerabilidade}$$

Onde:
- **Ameaça (Pressão Criminal)**: Representa a densidade matemática e a gravidade dos eventos letais e tentativas de feminicídio ocorridos no território, ponderados pela proporção da população feminina exposta.
- **Vulnerabilidade (Fragilidade Institucional)**: Mede a incapacidade ou ausência de resposta do poder público local, calculada a partir de "vazios assistenciais" (ausência de OPM, ausência de CREAS, falta de sala reservada, carência de protocolos e isolamento intersetorial).

Se um território possui alta pressão criminal, mas conta com rede completa, fluxos ágeis e atendimento especializado, o risco de reiteração e consumação letal é parcialmente mitigado. Ao contrário, quando uma incidência criminal moderada ou alta incide sobre um **vazio institucional total**, o risco atinge níveis críticos imediatos.

---

## 3. Fontes de Dados e Ciclos de Integração

O motor analítico do BRÍGID opera através da convergência de quatro matrizes principais de informação:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MATRIZES DE DADOS BRÍGID                        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
     ┌───────────────────────────────┼───────────────────────────────┐
     │                               │                               │
┌────▼─────────────────┐   ┌─────────▼────────────┐   ┌──────────────▼────────┐
│  Segurança Pública   │   │  Bases Estruturais   │   │  Diagnóstico BRÍGID   │
│     e Judiciário     │   │      e Setoriais     │   │     (Promotorias)     │
├──────────────────────┤   ├──────────────────────┤   ├───────────────────────┤
│ • Feminicídios       │   │ • Censo IBGE         │   │ • 7 blocos técnicos   │
│   Consumados         │   │   (Pop. Feminina)    │   │ • Inspeções in loco   │
│ • Feminicídios       │   │ • SEMPI (OPM)        │   │ • Rastreabilidade por │
│   Tentados           │   │ • SASC / SUAS        │   │   grau de certeza e   │
│ • Triênio consolidado│   │   (CREAS / CRAS)     │   │   documento oficial   │
│   (2023 - 2025)      │   │ • Dados de comarca   │   │ • Validação expressa  │
│ • Ciclo em aberto    │   │   e polo regional    │   │   pelo CAOCRIM        │
│   (2026 preliminar)  │   │                      │   │                       │
└──────────────────────┘   └──────────────────────┘   └───────────────────────┘
```

1. **Dados Criminais e Judiciais Oficiais**:
   - Eventos de feminicídios consumados e tentados catalogados pela Polícia Civil, Secretaria de Segurança Pública (SSP-PI) e Poder Judiciário.
   - Período de cálculo do score oficial consolidado: **Triênio 2023–2025** (`RISK_MODEL_CONFIG.anosOficiais`).
   - Casos informados preliminarmente no ciclo aberto (2026) ou declarados pelas Promotorias no diagnóstico recebem `considera_no_score = false`, mantendo a estabilidade metodológica da série oficial.

2. **Bases Estruturais e Setoriais Governamentais**:
   - **IBGE**: População residente total e contingente populacional feminino (`populacao_feminina`), base indispensável para o denominador de exposição.
   - **SEMPI** (Secretaria de Estado das Mulheres do Piauí): Mapeamento oficial de órgãos municipais dedicados a mulheres.
   - **SASC / CadSUAS** (Secretaria da Assistência Social e Cidadania): Registro dos equipamentos da rede socioassistencial especializada.

3. **Diagnóstico BRIGID (Rede de Proteção das Promotorias de Justiça)**:
   - Formulário digital estruturado em 7 blocos temáticos: *Identificação*, *Cidadania/OPM*, *Fluxos de Atendimento*, *Socioassistencial*, *Segurança Pública*, *Violência* e *Gargalos*.
   - Preenchido pelas Promotorias de Justiça com base em procedimentos administrativos, certidões e vistorias locais.
   - **Regra de Blindagem Analítica**: O preenchimento da Promotoria só altera a base municipal pública após **aprovação e publicação formal pelo CAOCRIM** (transação atômica via `diagnostico_validar_e_publicar`).

---

## 4. Análise de OPM e CREAS no Modelo de Risco

Entre todas as variáveis institucionais, a **presença e o funcionamento de OPM e CREAS** constituem os dois pilares estruturantes da rede municipal básica de prevenção e enfrentamento ao feminicídio.

### 4.1 Organismos de Políticas para as Mulheres (OPM)

As OPMs representam o aparelho executivo do governo municipal vocacionado à articulação, planejamento e promoção dos direitos das mulheres.

* **Tipologias Mapeadas** (`opm_orgaotipo`):
  - *Secretaria Municipal da Mulher* (primeiro escalão, orçamento próprio, maior autonomia funcional);
  - *Coordenadoria da Mulher* (segundo escalão, vinculada a Gabinete ou Secretaria de Assistência/Governo);
  - *Departamento / Divisão* ou *Ausente* (`-`).

* **Critério de Validação no Diagnóstico BRIGID**:
  A regra de mapeamento é **conservadora**: o campo `opm_possui` só recebe valor `"SIM"` quando a Promotoria atesta que o órgão existe **com funcionamento regular** (`CID_OPM_STATUS = 'funcionamento_regular'`). Órgãos criados apenas no papel (decreto/lei formal) mas inativos, ou órgãos em estágio embrionário, são computados como `"NAO"` para fins de garantia da proteção real à vítima.

* **Efeito no Score de Risco**:
  A ausência de OPM ativa no município gera um **agravante estrutural multiplicador** no fator de vulnerabilidade:
  $$\text{Agravante}_{\text{OPM}} = \begin{cases} \dfrac{\text{pesoOPM}}{100}, & \text{se } \text{opm\_possui} \neq \text{"SIM"} \\ 0, & \text{se } \text{opm\_possui} = \text{"SIM"} \end{cases}$$
  No padrão oficial do sistema, `pesoOPM = 2` (ou seja, $+2\%$ de incremento sobre a ameaça criminal). Em ambiente de parametrização e simulação de pesos, esse valor pode ser ajustado para testes de sensibilidade institucional.

---

### 4.2 Centros de Referência Especializados de Assistência Social (CREAS)

O CREAS é o equipamento da Proteção Social Especial de Média Complexidade do SUAS encarregado de acompanhar indivíduos e famílias sob risco ou violação de direitos (violência doméstica, violência física, abusos sexuais e ameaças). Nele opera o **PAEFI** (Serviço de Proteção e Atendimento Especializado a Famílias e Indivíduos).

* **Status Operacionais** (`creas_status` e `creas_possui`):
  - `IMPLEMENTADO` / `"SIM"`: Unidade em funcionamento regular com capacidade técnica instalada;
  - `NAO_IMPLEMENTADO` / `"NAO"`: Município desprovido de atendimento especializado próprio de assistência social.

* **Critério de Validação no Diagnóstico BRIGID**:
  Assim como na OPM, `creas_possui = "SIM"` restringe-se aos municípios com funcionamento regular confirmado (`CID_CREAS_STATUS = 'funcionamento_regular'`). Unidades parciais ou sem equipe multiprofissional habilitada para casos de gênero geram alerta institucional.

* **Efeito no Score de Risco**:
  A ausência de CREAS atua diretamente como fator amplificador do risco:
  $$\text{Agravante}_{\text{CREAS}} = \begin{cases} \dfrac{\text{pesoCREAS}}{100}, & \text{se } \text{creas\_possui} \neq \text{"SIM"} \\ 0, & \text{se } \text{creas\_possui} = \text{"SIM"} \end{cases}$$
  No padrão do sistema, `pesoCREAS = 2` (incremento adicional de $+2\%$).

---

### 4.3 Critérios de Elegibilidade e Prioridade de Implantação

Para orientar a pactuação de termos de ajustamento e acordos interinstitucionais com o Estado e Municípios, o BRÍGID categoriza os municípios desprovidos de equipamentos em faixas de prioridade:

```
┌────────────────────────────────────────────────────────────────────────┐
│               MATRIZ DE PRIORIDADE DE FOMENTO E IMPLANTAÇÃO            │
├───────────────────────┬────────────────────────────────────────────────┤
│ Prioridade ALTA       │ • Município sem CREAS com População > 10.000   │
│                       │ • Município sem CREAS/OPM com Feminicídio > 0  │
│                       │ • Município em faixa de Risco Alto ou Crítico │
├───────────────────────┼────────────────────────────────────────────────┤
│ Prioridade MÉDIA      │ • População entre 5.000 e 10.000 sem rede      │
│                       │ • Presença de OPM, mas ausência de CREAS       │
├───────────────────────┼────────────────────────────────────────────────┤
│ MONITORAMENTO / BAIXA │ • Equipamentos implantados e em funcionamento  │
│                       │ • Pequeno porte (< 5.000 hab.) sem ocorrências │
└───────────────────────┴────────────────────────────────────────────────┘
```

A combinação **"Sem OPM + Sem CREAS + Risco Crítico"** gera acionamento de bandeira vermelha no sistema e inclusão automática na esteira de atuação prioritária do MPPI.

---

## 5. Variáveis Complementares e Diagnóstico da Rede

Além de OPM e CREAS, a mensuração da robustez territorial investiga outras 18 variáveis setoriais auditadas via Diagnóstico BRIGID e cargas técnicas:

### 5.1 Infraestrutura Material e Recursos Mínimos
- **Sala Especializada de Atendimento** (`tem_sala_especializada`): Avalia se delegacias, centros de referência ou órgãos municipais contam com espaço físico reservado, garantindo escuta protegida e acolhimento não revitimizador.
- **Recursos Mínimos Operacionais** (`tem_recursos_minimos`): Exige a presença concomitante de seis itens essenciais (`FLX_RECURSOS_ITENS`):
  1. Equipe técnica multidisciplinar;
  2. Espaço físico privativo adequado;
  3. Transporte logístico imediato para a vítima;
  4. Atendimento psicológico;
  5. Assistência jurídica;
  6. Acolhimento institucional emergencial ou casa-abrigo.  
  *Se qualquer um dos 6 recursos faltar, a variável é marcada como "NAO".*
- **Suficiência Global da Estrutura** (`grau_suficiencia_estrutura`): Classificada em `ADEQUADO`, `PARCIAL` ou `INSUFICIENTE`.

### 5.2 Fluxos e Protocolos Intersetoriais
- **Fluxo Formal de Atendimento** (`tem_fluxo_formal`): Existência de ato normativo publicado que padronize a tramitação da vítima entre delegacias, unidades de saúde, promotoria e assistência social.
- **Protocolo Local ou Regional Vigente** (`tem_protocolo_local_regional`): Aderência a manuais procedimentais padronizados que regulem prazos e medidas cautelares.
- **Atendimento Psicossocial Especializado** (`tem_atendimento_psicossocial`): Regularidade na oferta de acompanhamento psicológico e social continuado.
- **Articulação em Rede / CREAS-Rede** (`articulacao_creas_rede`): Realização de reuniões intersetoriais periódicas e comitês de gestão integrada.
- **Equipe Mínima do CREAS** (`tem_equipe_minima_creas`): Suficiência de assistentes sociais e psicólogos com dedicação exclusiva.

### 5.3 Segurança Pública, Investigação e Perícia
- **Protocolo de Investigação de Feminicídio** (`tem_protocolo_investigacao`): Aplicação das Diretrizes Nacionais para Investigar, Processar e Julgar com Perspectiva de Gênero as Mortes Violentas de Mulheres.
- **Protocolo Pericial de Preservação e Coleta** (`tem_protocolo_pericial`): Rapidez no exame de corpo de delito, perícia de local de crime e coleta de vestígios genéticos.
- **Capacitação em Perspectiva de Gênero** (`capacitado_perspectiva_genero`): Realização de cursos formativos para equipes policiais e assistenciais nos últimos 12 meses (`qtd_capacitacoes_realizadas`).
- **Treinamento Específico em Avaliação de Risco Letal** (`treinamento_especifico_feminicidio`): Domínio do formulário de avaliação de risco (Frida / CNJ).
- **Grau de Aderência Técnica aos Protocolos** (`grau_aderencia_protocolo`): Aferido como `ALTO`, `MEDIO` ou `BAIXO`.

### 5.4 Mapeamento Sistemático de Gargalos
O sistema cataloga 16 fragilidades operacionais (`GAR_LISTA`):
1. Ausência de protocolo;
2. Protocolo desatualizado;
3. Baixa capacitação;
4. Demora na investigação;
5. Demora pericial;
6. Deficiência de equipe;
7. Dificuldade de acesso à vítima;
8. Falha de comunicação entre órgãos;
9. Ausência de atendimento psicossocial;
10. Ausência de CREAS;
11. Ausência de OPM;
12. Falta de transporte;
13. Falta de abrigo;
14. Ausência de fluxo de encaminhamento;
15. Falta de estrutura física;
16. Subnotificação crônica de dados.

---

## 6. Índices Sintéticos Municipais (Escala 0 a 10)

Para possibilitar o contraste entre municípios e o monitoramento temporal de políticas públicas, o BRÍGID compõe **três índices sintéticos normalizados** de 0.0 a 10.0 pontos:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ÍNDICES SINTÉTICOS DA REDE (0 A 10)                   │
├──────────────────────────┬──────────────────────────┬──────────────────┤
│           IER            │           IMF            │       IQT        │
│   Estrutura da Rede      │   Maturidade de Fluxos   │   Qualificação   │
├──────────────────────────┼──────────────────────────┼──────────────────┤
│ • Sala Especializada     │ • Fluxo Formalizado      │ • Equipe Multi   │
│   (30% / máx. 3 pts)     │   (30% / máx. 3 pts)     │   (30% / máx. 3) │
│ • Recursos Mínimos       │ • Protocolo Vigente      │ • Capacit. Gênero│
│   (30% / máx. 3 pts)     │   (30% / máx. 3 pts)     │   (35% / máx 3.5)│
│ • Suficiência Estrutural │ • Articulação em Rede    │ • Treinamento    │
│   (40% / máx. 4 pts)     │   (40% / máx. 4 pts)     │   Feminicídio    │
│                          │                          │   (35% / máx 3.5)│
└──────────────────────────┴──────────────────────────┴──────────────────┘
```

---

### 6.1 Índice de Estrutura da Rede (IER)

O **IER** quantifica a adequação material e física instalada para o atendimento inicial e acolhimento da mulher.

#### Variáveis de Entrada e Pontuação:
1. **Sala Especializada de Atendimento**:
   - `SIM` = $+3.0\text{ pontos}$
   - `NAO` / Sem Informação = $0.0\text{ pontos}$
2. **Recursos Mínimos Operacionais** (todos os 6 itens disponíveis):
   - `SIM` = $+3.0\text{ pontos}$
   - `NAO` / Incompleto = $0.0\text{ pontos}$
3. **Grau de Suficiência da Estrutura**:
   - `ADEQUADO` = $+4.0\text{ pontos}$
   - `PARCIAL` = $+2.0\text{ pontos}$
   - `INSUFICIENTE` = $0.0\text{ pontos}$

#### Equação:
$$\mathbf{IER} = \mathbf{Pts}_{\text{Sala}} + \mathbf{Pts}_{\text{Recursos}} + \mathbf{Pts}_{\text{Sufici\hat{e}ncia}}$$

- **Teto**: $10.0\text{ pontos}$.
- **Interpretação**:
  - $0.0 \text{ a } 3.9$: *Vulnerabilidade Estrutural Crítica* (ausência quase total de meios materiais);
  - $4.0 \text{ a } 6.9$: *Estrutura Parcial / Fragilizada*;
  - $7.0 \text{ a } 10.0$: *Estrutura Adequada e Apta ao Acolhimento*.

---

### 6.2 Índice de Maturidade dos Fluxos (IMF)

O **IMF** avalia a transição da gestão pública municipal do plano do improviso e voluntarismo para o plano da governança institucionalizada e formalizada.

#### Variáveis de Entrada e Pontuação:
1. **Fluxo Formal de Atendimento**:
   - Formalizado por ato normativo (`SIM`) = $+3.0\text{ pontos}$
   - Informal / Ausente (`NAO`) = $0.0\text{ pontos}$
2. **Protocolo Local ou Regional Vigente**:
   - Vigente e homologado (`SIM`) = $+3.0\text{ pontos}$
   - Desatualizado / Inexistente (`NAO`) = $0.0\text{ pontos}$
3. **Articulação em Rede**:
   - Consolidada e regular (`SIM`) = $+4.0\text{ pontos}$
   - Incipiente / irregular = $+2.0\text{ pontos}$
   - Inexistente (`NAO`) = $0.0\text{ pontos}$

#### Equação:
$$\mathbf{IMF} = \mathbf{Pts}_{\text{Fluxo}} + \mathbf{Pts}_{\text{Protocolo}} + \mathbf{Pts}_{\text{Articula\c{c}\~ao}}$$

- **Teto**: $10.0\text{ pontos}$.
- **Interpretação**:
  - Distingue municípios onde os órgãos atuam como "ilhas isoladas"daqueles que operam sob responsabilidades compartilhadas e cronogramas integrados de resposta.

---

### 6.3 Índice de Qualificação Técnica (IQT)

O **IQT** afere o letramento técnico e o preparo do capital humano que atua no acolhimento, atendimento pericial e instrução probatória.

#### Variáveis de Entrada e Pontuação:
1. **Equipe Multiprofissional Integrada** (Serviço Social + Psicologia):
   - Concomitante e atuante (`SIM`) = $+3.0\text{ pontos}$
   - Incompleta ou inexistente (`NAO`) = $0.0\text{ pontos}$
2. **Capacitação em Perspectiva de Gênero** (últimos 12 meses):
   - Realizada com comprovação (`SIM`) = $+3.5\text{ pontos}$
   - Não realizada (`NAO`) = $0.0\text{ pontos}$
3. **Treinamento Específico em Protocolo de Feminicídio**:
   - Concluído pelas equipes (`SIM`) = $+3.5\text{ pontos}$
   - Não realizado (`NAO`) = $0.0\text{ pontos}$

#### Equação:
$$\mathbf{IQT} = \mathbf{Pts}_{\text{Equipe}} + \mathbf{Pts}_{\text{G\hat{e}nero}} + \mathbf{Pts}_{\text{Feminic\acute{i}dio}}$$

- **Teto**: $10.0\text{ pontos}$.
- **Interpretação**:
  - Revela se a estrutura física possui sustentação de recursos humanos preparados para evitar a revitimização institucional e qualificar a persecução penal.

---

### 6.4 Média Geral Institucional (MGI)

A síntese da capacidade do ecossistema municipal é expressa pela média aritmética dos três índices:

$$\mathbf{MGI} = \frac{\mathbf{IER} + \mathbf{IMF} + \mathbf{IQT}}{3}$$

A MGI oferece uma visualização imediata da maturidade global da comarca e integra as fichas executivas e análises comparativas de polo regional.

---

## 7. Algoritmo de Cálculo do Score de Risco de Feminicídio

O **Score de Risco de Feminicídio** (`risco_feminicidio_score`) constitui o indicador-síntese mais sensível da plataforma BRÍGID.

### 7.1 Janela Oficial de Eventos e Ponderação Criminal
Para conferir segurança jurídica aos alertas, o cálculo fundamenta-se na série oficial consolidada de 3 anos (**2023, 2024 e 2025**):
- $C$: Feminicídios Consumados no triênio (`feminicidios_consumados_2023_2025`);
- $T$: Feminicídios Tentados no triênio (`feminicidios_tentados_2023_2025`).

Eventos do ano em curso (ex.: 2026 preliminar) ou declarados em revisões de diagnóstico sem validação policial/judicial constam exclusivamente em painéis informativos, **não alterando o score oficial consolidado**.

### 7.2 Denominador Demográfico e Taxas Relativas
O denominador demográfico empregado é o contingente de mulheres do município ($Pop_{\text{fem}}$), extraído da base demográfica do IBGE (ou a população total do município caso $Pop_{\text{fem}}$ seja nula):

$$Denom = \begin{cases} Pop_{\text{fem}}, & \text{se } Pop_{\text{fem}} > 0 \\ Pop_{\text{total}}, & \text{caso contr\acute{a}rio} \end{cases}$$

Calculam-se as taxas de incidência criminal padronizadas por **100 mil mulheres**:

$$\text{Taxa}_{\text{Consumados}} = \left(\frac{C}{Denom}\right) \times 100.000$$

$$\text{Taxa}_{\text{Tentativas}} = \left(\frac{T}{Denom}\right) \times 100.000$$

---

### 7.3 Modelagem Híbrida: Ameaça × Vulnerabilidade

A modelagem opera em duas etapas multiplicativas:

#### Etapa 1: Ameaça (Pressão Criminal Ponderada)
A pressão criminal base é calculada pela soma ponderada das taxas relativas, partindo de um *baseline* unitário de segurança ($1.0$), o qual assegura que mesmo um município com zero ocorrências no triênio continue sendo avaliado em sua vulnerabilidade institucional:

$$\mathbf{Amea\text{ç}a} = 1.0 + (\text{Taxa}_{\text{Consumados}} \times P_{\text{Consumados}}) + (\text{Taxa}_{\text{Tentativas}} \times P_{\text{Tentativas}})$$

*Pesos Oficiais Padrão*:
- $P_{\text{Consumados}} = \mathbf{3.0}$ (Reflete a máxima gravidade da consumação letal)
- $P_{\text{Tentativas}} = \mathbf{1.0}$ (Reflete a violência extrema que não culminou em morte por fatores circunstanciais)

#### Etapa 2: Vulnerabilidade (Fator de Agravo Estrutural)
A vulnerabilidade mede o vácuo de amparo estatal decorrente da inexistência de equipamentos públicos especializados:

$$\mathbf{Vulnerabilidade} = 1.0 + \mathbf{Agravante}_{\text{OPM}} + \mathbf{Agravante}_{\text{CREAS}}$$

Onde:
$$\mathbf{Agravante}_{\text{OPM}} = \begin{cases} \dfrac{P_{\text{OPM}}}{100}, & \text{se } \text{opm\_possui} \neq \text{"SIM"} \\ 0.0, & \text{se } \text{opm\_possui} = \text{"SIM"} \end{cases}$$

$$\mathbf{Agravante}_{\text{CREAS}} = \begin{cases} \dfrac{P_{\text{CREAS}}}{100}, & \text{se } \text{creas\_possui} \neq \text{"SIM"} \\ 0.0, & \text{se } \text{creas\_possui} = \text{"SIM"} \end{cases}$$

*Pesos Oficiais Padrão*:
- $P_{\text{OPM}} = \mathbf{2.0}$
- $P_{\text{CREAS}} = \mathbf{2.0}$

*(Nota: Na simulação dinâmica do sistema, os pesos podem ser alterados pelo usuário para testar impactos no ranking estadual, sendo restaurados a qualquer momento).*

#### Etapa 3: Score Final Consolidado
O escore final consiste no produto da ameaça pela vulnerabilidade, arredondado a uma casa decimal:

$$\mathbf{Score} = \text{round}\left(\mathbf{Amea\text{ç}a} \times \mathbf{Vulnerabilidade}, \; 1\right)$$

---

### 7.4 Limiares Normativos (Thresholds) e Faixas de Risco

O escore numérico é categorizado em quatro classes normativas de gravidade territorial:

| Nível de Risco | Faixa do Score | Cor Oficial do Mapa | Caracterização Operacional |
| :--- | :---: | :---: | :--- |
| **CRÍTICO** | $\text{Score} \ge \mathbf{390.0}$ | Roxo Escuro / Vermelho Forte | Cruzamento letal: altíssima densidade de casos/tentativas associada a vácuo assistencial local. Demanda atuação imediata dos Grupos Especiais do MPPI. |
| **ALTO** | $\mathbf{270.0} \le \text{Score} < 390.0$ | Laranja Avermelhado | Pressão criminal substantiva com rede deficiente. Exige planejamento de providências comarcais em curto/médio prazo. |
| **MÉDIO / ATENÇÃO** | $\mathbf{140.0} \le \text{Score} < 270.0$ | Amarelo / Âmbar | Estabilidade relativa de ocorrências com resposta institucional intermediária; necessidade de reforço preventivo. |
| **BAIXO** | $\text{Score} < \mathbf{140.0}$ | Verde | Baixa ou nula incidência associada à capacidade institucional instalada para acompanhamento protetivo. |

---

### 7.5 Atuação Prioritária Dinâmica vs. Marcação Estratégica

O campo **Atuação Prioritária** (`necessita_atuacao_prioritaria`) assume dois modos complementares de operação:

1. **Modo Algorítmico Dinâmico**:
   Sempre que o cálculo do score categoriza o município como **ALTO** ou **CRÍTICO**, a aplicação marca dinamicamente `necessita_atuacao_prioritaria = "SIM"`.
2. **Modo Ministerial Estratégico (Sobreposição Humana)**:
   A gestão do CAOCRIM / Procuradoria-Geral possui prerrogativa de acionar a marcação de Atuação Prioritária diretamente na camada restrita de gestão municipal (`necessita_atuacao_prioritaria = "SIM"`), mesmo que o cálculo estatístico estivesse em nível moderado. Esse mecanismo atende a situações em que dados qualitativos supervenientes (ex.: chacinas, ameaças reiteradas a lideranças femininas locais, denúncias de rede corrompida) exigem tutela ministerial concentrada.

---

## 8. Sistema de Alertas da Rede de Proteção

O **Painel Alerta da Rede** (`painel_alerta_rede`) avalia de maneira autônoma a higidez dos serviços públicos locais, classificando cada território em:

- **ADEQUADO** (Verde): Municípios com OPM e CREAS regulares, existência de fluxo normatizado e sala especializada ativa.
- **ATENCAO** (Amarelo): Municípios com cobertura de rede incompleta (ex.: possui CREAS, mas não possui OPM; ou ausência de protocolo formalizado).
- **CRITICO** (Roxo/Vermelho): Vazio institucional integral — ausência concomitante de OPM e CREAS, inexistência de protocolos e carência de recursos mínimos.

```
┌────────────────────────────────────────────────────────────────────────┐
│             MATRIZ DE RISCO COMBINADO: VIOLÊNCIA vs. REDE              │
├────────────────────┬───────────────────────────────────────────────────┤
│                    │                  REDE DE PROTEÇÃO                 │
│ PRESSÃO CRIMINAL   ├──────────────────┬────────────────┬───────────────┤
│                    │ ADEQUADA         │ ATENÇÃO        │ CRÍTICA       │
├────────────────────┼──────────────────┼────────────────┼───────────────┤
│ Elevada (Casos > 0)│ Risco Monitorado │ Risco Alto     │ Risco Crítico │
├────────────────────┼──────────────────┼────────────────┼───────────────┤
│ Baixa (Casos = 0)  │ Risco Baixo      │ Risco Moderado │ Alerta Prévio │
└────────────────────┴──────────────────┴────────────────┴───────────────┘
```

---

## 9. Análises Espaciais, Comparativas e Relatórios de Intervenção

### 9.1 Camadas do Mapa Coroplético Territorial
A página de **Inteligência Territorial** (`/territorio`) permite alternar as seguintes camadas geoespaciais com recortes por Polo Regional e Comarca:
1. **Camada Consolidada**: Destaca municípios em 4 situações:
   - *Crítico — Sem OPM e Sem CREAS*;
   - *Sem OPM ou Sem CREAS*;
   - *Cobertura parcial / Atenção*;
   - *Rede consolidada completa*.
2. **Camada OPM**: Municípios com e sem organismo municipal da mulher.
3. **Camada CREAS**: Municípios cobertos e desprovidos de CREAS.
4. **Camada Risco de Feminicídio**: Classificação visual de Baixo a Crítico.
5. **Camada Alerta da Rede**: Status da infraestrutura de atendimento.
6. **Camada Prioridade**: Foco em municípios de intervenção preferencial.

---

### 9.2 Pentágono Radar Multidimensional (Ficha Técnica Municipal)

A página individual de cada município (`/municipios/$slug`) gera automaticamente um gráfico em radar com cinco eixos analíticos, comparando o município contra a média de seu **Polo Regional** e a média do **Estado do Piauí**:

```
                       [1] Cobertura OPM
                             /\
                            /  \
                           /    \
      [5] Alerta Rede     /      \    [2] Cobertura CREAS
           \             /        \            /
            \           /          \          /
             \         /     ●      \        /
              \       / (Município)  \      /
               \     /                \    /
                \   /                  \  /
                 \ /                    \/
     [4] Criticidade                      [3] Violência Letal
         (Score Risco)                    (Taxa Relativa)
```

1. **Eixo OPM**: $100\%$ se possui órgão ativo regular; $0\%$ se ausente.
2. **Eixo CREAS**: $100\%$ se possui unidade especializada regular; $0\%$ se ausente.
3. **Eixo Violência**: Taxa criminal ponderada normalizada em relação ao valor máximo estadual.
4. **Eixo Criticidade**: Posição do Score de Risco municipal relativo ao teto estadual.
5. **Eixo Alerta da Rede**: Transcrição da escala de alerta ($100\%$ Crítico, $75\%$ Alto, $40\%$ Atenção, $0\%$ Adequado).

O painel textual integrado formula diagnósticos automáticos em linguagem natural:
- Identifica se o município supera a média de violência do polo;
- Aponta se a rede é "formal completa", "parcial" ou "vazio institucional";
- Emite callouts de **Vantagem Comparativa**, **Fragilidade Estrutural** e **Recomendação Operacional**.

---

### 9.3 Relatórios Operacionais e de Cobrança Institucional

O módulo de relatórios analíticos (`/relatorios`) gera listas executivas para download imediato em **PDF**, **Excel (XLSX)** e **CSV**:

1. **Municípios Prioritários Imediatos**:
   - Critério: $\text{Risco Alto ou Crítico} + (\text{Sem OPM ou Sem CREAS}) + \text{Sem Protocolo Vigente}$.
   - Uso: Notificação formal das administrações municipais, instauração de Inquéritos Civis Públicos (ICP) e emissão de Recomendações Ministeriais pelo CAOCRIM e Promotorias locais.
2. **Rede Insuficiente com Ocorrência Letal**:
   - Critério: $\text{Feminicídios Consumados ou Tentados} > 0 + (\text{Sem OPM ou Sem CREAS})$.
   - Uso: Responsabilização institucional pela ausência de serviços de acolhimento e requerimento de medidas orçamentárias obrigatórias.
3. **Resumo Executivo Estadual**:
   - Visão panorâmica dos 224 municípios, consolidando IER, IMF, IQT, Nível de Risco e Alertas para prestação de contas, conferências e reuniões de cúpula com o Governo Estadual.

---

## 10. Governança, Rastreabilidade e Transparência Algorítmica

Em respeito aos postulados da legalidade, publicidade e dever de explicabilidade algorítmica no setor público, o BRÍGID obedece a rigorosos critérios de governança:

1. **Inalterabilidade de Séries Históricas por Simples Impressão**:
   - As séries estatísticas criminais e cadastrais são controladas por migrações auditadas. O formulário do Diagnóstico BRIGID não altera dados de forma arbitrária: sua publicação é uma operação atômica no banco de dados (`diagnostico_validar_e_publicar`) que mantém o histórico de versões anteriores e armazena o *hash SHA-256* da submissão aprovada.

2. **Ressalva de Independência Funcional (Não Substituição do Promotor)**:
   - A modelagem matemática e os scores gerados pelo BRÍGID atuam como **mecanismos de indução e triagem territorial**. Eles **não substituem** a cognição técnica dos Promotores de Justiça naturais da causa, os quais detêm a prerrogativa constitucional de valorar circunstâncias peculiares fáticas ou processuais da comarca.

3. **Tratamento da Subnotificação Crônica**:
   - Áreas desprovidas de ocorrências registradas em comarcas sem delegacia de polícia ou sem defensoria pública não são automaticamente consideradas seguras. A metodologia pondera a falta de órgãos de registro no cálculo da vulnerabilidade, advertindo o operador de que "ausência de boletim de ocorrência pode sinalizar subnotificação crônica, e não pacificação social".

4. **Auditabilidade Plena**:
   - Todas as variáveis que compõem o IER, IMF, IQT e Score de Risco estão abertas para auditoria pública e institucional através das fichas técnicas, tabelas de metadados e arquivos de carga versionados na documentação técnica do sistema.

---
*Documento homologado para fundamentação dos atos de gestão territorial, fiscalização de políticas públicas e emissão de diagnósticos estratégicos do Ministério Público do Estado do Piauí.*
