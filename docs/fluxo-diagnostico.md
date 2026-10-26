# Diagnóstico BRIGID — revisão, validação e publicação

Regra central: **diagnóstico completo + aprovação expressa do CAOCRIM = autorização para integrar a base consolidada e o painel público.** Salvar, concluir, atingir 100% ou enviar não publica nada.

## Implantação

Execute no SQL Editor do Supabase, nesta ordem:

1. `database/migrations/02_promotorias.sql`
2. `database/migrations/03_diagnostico.sql`
3. `database/migrations/04_rls_admin.sql`
4. `database/migrations/05_fluxo_diagnostico.sql`
5. `database/migrations/06_contas_promotorias.sql`
6. `database/migrations/08_senha_provisoria.sql` (cadastro das contas com senha provisória)

A ordem completa, incluindo a carga inicial da base municipal, está em [`database/README.md`](../database/README.md).

Publique também a função de borda **`contas-promotorias`** (`supabase/functions/contas-promotorias/index.ts`). É ela que cria as contas e altera senhas, com a chave de serviço que existe só no servidor. No Lovable Cloud, as funções da pasta `supabase/functions` são publicadas pelo próprio Lovable; se a função não aparecer em **More → Edge Functions**, peça no chat do Lovable para publicá-la. No Supabase próprio: `supabase functions deploy contas-promotorias`.

Depois, no **Lovable Cloud** (no Supabase próprio, os mesmos itens ficam em Authentication):

- **More → Users → Settings:** ative "Disable sign-up". As contas são criadas só pelo CAOCRIM, e o sistema não envia e-mails de convite nem de recuperação de senha. Isso é obrigatório: com o cadastro aberto, um estranho poderia criar antes uma conta com o e-mail de uma Promotoria.
- **Política de senhas** (Authentication → Policies/Password): confirme que aceita a senha provisória padrão (12 caracteres, letras minúsculas e um dígito). Se a política exigir maiúsculas ou símbolos, a aprovação falha com uma mensagem que aponta para essa configuração.
- **More → Users → Add user → Create new user:** crie a conta do CAOCRIM e marque-a como administradora com o SQL `INSERT INTO public.admin_users (user_id) SELECT id FROM auth.users WHERE email = 'caocrim@mppi.mp.br';`
- Contas das Promotorias: veja a seção abaixo.

## Contas das Promotorias

- Cada Promotoria acessa com a conta do seu e-mail institucional (`promotorias_justica.email_institucional`). Os diagnósticos pertencem à Promotoria, não à pessoa.
- Quem preenche informa nome e condição (titular, substituto(a), em respondência) ao criar o diagnóstico e declara esses dados a cada envio. A declaração fica gravada na versão enviada (`enviado_por_nome`, `enviado_por_condicao`) e nunca é publicada.

### Cadastro e senha (tudo pela tela Administração)

1. **Aprovar o cadastro:** em **Diagnóstico BRIGID → Administração → Contas das Promotorias**, escolha a Promotoria, informe o e-mail institucional e clique em **"Aprovar e ativar cadastro"**. A conta é criada com a senha provisória padrão **`feminicidio0`**, a mesma para todas as Promotorias, e já fica vinculada à Promotoria. O painel confirma que o cadastro está ativo e mostra o e-mail e a senha provisória para repassar à Promotoria (a senha fica só no servidor e não está no código do navegador). Se já existir uma conta de Promotoria com esse e-mail e senha definitiva, ela é só vinculada e a senha é mantida; outra conta existente com esse e-mail é reaproveitada e volta à senha provisória.
2. **Primeiro acesso:** a Promotoria entra com o e-mail cadastrado e a senha `feminicidio0`.
3. **Troca obrigatória:** enquanto a senha provisória estiver em uso, o sistema mostra apenas a tela "Troca de senha obrigatória". A nova senha precisa ter pelo menos 10 caracteres e não pode ser `feminicidio0`. Até a troca, o banco também recusa qualquer leitura, criação ou envio de diagnóstico pela conta. A troca vale por **72 horas** a partir da aprovação ou redefinição; depois disso, o CAOCRIM precisa redefinir a senha de novo.
4. **Esquecimento de senha ou troca de titular:** o CAOCRIM clica em **"Redefinir senha"** na linha da conta. A senha volta a ser `feminicidio0` e a troca é exigida de novo no próximo acesso.

A coluna **Situação** mostra "Aguardando troca de senha" enquanto a conta usa a senha provisória e "Senha provisória expirada" após as 72 horas. **Senha definida em** mostra quando a senha atual foi criada: peça à Promotoria que confira essa data, para ter certeza de que foi ela quem a definiu. "Último acesso" ajuda a identificar contas nunca usadas. "Desativar" retira o vínculo sem apagar a conta; "Reativar" vincula de novo, mantendo a senha definitiva.

Como a senha provisória é a mesma para todas as contas e os e-mails institucionais são conhecidos, aprove ou redefina uma conta só quando a Promotoria estiver pronta para entrar.

Como funciona por dentro:

- A marca `senha_provisoria` fica em `app_metadata` da conta, que só a chave de serviço altera: a Promotoria não consegue retirá-la sem trocar a senha pela função de borda.
- `senha_provisoria_ativa()`, `usuario_vinculado()` e `meus_vinculos()` (migration 08) leem a marca direto de `auth.users`, então o bloqueio vale logo após uma redefinição, mesmo para uma sessão já aberta.
- A função de borda confere o CAOCRIM e os dados com `admin_preparar_conta_promotoria`, `admin_vincular_conta_promotoria` e `admin_conferir_conta_promotoria`. Contas do CAOCRIM nunca são criadas nem redefinidas por essa tela.
- A troca de senha pela função de borda só é aceita para a conta que está com a marca provisória e dentro das 72 horas (`senha_provisoria_em`); qualquer outra conta recebe recusa. Ao trocar, a função grava `senha_definida_em`.
- As regras das ações ficam em `supabase/functions/contas-promotorias/acoes.ts`, testadas por `scripts/testes/contas-promotorias.test.mjs`.

Se o dicionário (`src/lib/dicionario-diagnostico.ts`) mudar, rode `npm run gerar:regras` e reaplique a migration. Os testes conferem que a completude calculada no navegador e no banco é a mesma: `npm run test:diagnostico`.

## Separação entre coleta e base publicada

| Coleta (sem leitura pública) | Base publicada (leitura pública) |
| --- | --- |
| `diagnostico_brigid` — Promotoria, município, período, atribuição, responsável, situação | `municipios` — colunas consumidas pelo painel |
| `diagnostico_versoes` — respostas de cada versão + hash do conteúdo | `municipio_dados_publicados` — valor aprovado por município, campo e período, com origem, confiabilidade e caráter |
| `diagnostico_observacoes` — notas internas e devoluções | `eventos_feminicidio` — contagens com `origem_dado = 'DIAGNOSTICO_MP'` e `considera_no_score = false` |
| `diagnostico_anexos` + bucket privado `diagnostico-anexos` | |
| `diagnostico_auditoria`, `diagnostico_publicacoes` (somente CAOCRIM) | |

Nenhuma tabela de coleta aceita escrita direta pela API, nem do CAOCRIM. Toda escrita passa por funções `SECURITY DEFINER`, que conferem o perfil (`is_admin()`), o vínculo (`usuario_vinculado()`) e a transição de estado.

## Estados

`em_preenchimento → enviado → em_analise → (devolvido → em_preenchimento… → enviado) → validado → publicado → substituido`

| Ação | Quem | Função |
| --- | --- | --- |
| Criar / salvar rascunho (com nome e condição do responsável) | Conta da Promotoria | `diagnostico_criar`, `diagnostico_salvar_rascunho` |
| Enviar (exige 100% e declaração de quem assina) | Conta da Promotoria | `diagnostico_enviar` |
| Iniciar análise | CAOCRIM | `diagnostico_iniciar_analise` |
| Devolver com motivo e comentários por bloco/campo | CAOCRIM | `diagnostico_devolver` |
| Validar e publicar (versão + hash revisados, 100%, conflitos confirmados) | CAOCRIM | `diagnostico_validar_e_publicar` |
| Nova tentativa de publicação após falha | CAOCRIM | `diagnostico_publicar` |
| Nova versão após publicação | Promotor vinculado | `diagnostico_nova_versao` |

Completude, situação da análise e publicação são informações independentes. Exemplo: 100% · Em análise pelo CAOCRIM · Não publicado.

## Completude

- Blocos aplicáveis por atribuição: cível → Cidadania, Fluxos, Socioassistencial; criminal → Segurança, Violência, Gargalos; cumulativa ou única → todos. Identificação vale sempre.
- Contam os campos obrigatórios visíveis pelas regras condicionais, mais Promotoria, município, atribuição e período. Respostas ocultas ou de blocos não aplicáveis são descartadas ao salvar.
- Ausência de resposta é pendência. "Não" e "Não se aplica" são respostas válidas, e zero é quantidade válida.
- "Não soube informar" (também disponível nos campos numéricos) exige justificativa e nunca vira "Não" ou zero.
- Município: a tela de Acompanhamento só mostra o município como totalmente diagnosticado quando os blocos cíveis **e** criminais têm versão publicada.

## Publicação

Executa em uma única transação. Se falhar, nada da base pública muda (savepoint), a falha fica na auditoria e a versão permanece validada para nova tentativa.

- **Idempotente:** publicar de novo a mesma versão não grava nada.
- **Versão exata:** recusa publicar um conteúdo cujo hash difere do revisado.
- **Preserva outros blocos:** grava somente os campos aplicáveis da versão.
- **Conflitos:** quando outra Promotoria já tem valor aprovado para o mesmo município, campo e período, a substituição exige confirmação expressa, campo a campo.
- **Período:** um período anterior ao vigente é registrado em `municipio_dados_publicados`, mas não sobrescreve o retrato atual em `municipios`.
- **Caráter:** períodos a partir de 2026 ficam como `preliminar`, mesmo depois de aprovados.

## Mapeamento formulário → base consolidada (regra conservadora)

A lista é fechada: só estes campos podem chegar ao painel. "Não soube informar" mantém o valor publicado. Observações, contatos, endereços, descrições livres, justificativas e anexos nunca são publicados. A tabela `diagnostico_mapeamento_publicacao` é a fonte da regra.

| Código | Destino | Tipo | Regra | Painéis | Afeta score? |
| --- | --- | --- | --- | --- | --- |
| CID_OPM_STATUS | opm_possui | SIM/NAO | SIM só p/ "funcionamento regular" | OPM, Risco, Mapa, Território, Ficha | **Sim** (variável estrutural) |
| CID_OPM_STATUS | fonte_base_opm | texto | procedência gerada | Ficha | Não |
| CID_OPM_CAPACIDADE | opm_status_politicas_publicas | SIM/NAO | SIM só p/ capacidade integral | OPM, Território, Ficha | Não |
| CID_CREAS_STATUS | creas_possui | SIM/NAO | SIM só p/ "funcionamento regular" | CREAS, Risco, Mapa, Território, Ficha | **Sim** (variável estrutural) |
| CID_CREAS_STATUS | creas_status | IMPLEMENTADO/NAO_IMPLEMENTADO | idem | Ficha | Não |
| CID_CREAS_STATUS | fonte_base_creas | texto | procedência gerada | Ficha | Não |
| FLX_FORMAL | tem_fluxo_formal | SIM/NAO | SIM só p/ formalizado por ato | Diagnóstico da Rede (IMF), Relatórios | Não |
| FLX_PROTOCOLO | tem_protocolo_local_regional | SIM/NAO | SIM só p/ vigente | Diagnóstico da Rede (IMF), Relatórios | Não |
| FLX_SALA | tem_sala_especializada | SIM/NAO | SIM só p/ adequado | Diagnóstico da Rede (IER), Relatórios | Não |
| FLX_PSICO | tem_atendimento_psicossocial | SIM/NAO | SIM só p/ regular | Diagnóstico da Rede | Não |
| SOC_PROTOCOLO | tem_protocolo_assistencial | SIM/NAO | SIM só p/ vigente | Assistência | Não |
| SOC_FLUXO | tem_fluxo_encaminhamento | SIM/NAO | SIM só p/ integrado | Assistência | Não |
| SOC_ARTIC_CREAS | articulacao_creas_rede | SIM/NAO | SIM só p/ formal e regular | Assistência | Não |
| SOC_EQUIPE | tem_equipe_minima_creas | SIM/NAO | SIM só p/ suficiente; "Não se aplica" não altera | Assistência | Não |
| SOC_CAPACITA_QTD | profissionais_capacitados | inteiro | cópia | Assistência | Não |
| SEG_PROTO_INV | tem_protocolo_investigacao | SIM/NAO | SIM só p/ vigente e aplicado | Investigação | Não |
| SEG_PROTO_PER | tem_protocolo_pericial | SIM/NAO | SIM só p/ aplicado regularmente | Investigação | Não |
| SEG_CAPACITA | capacitado_perspectiva_genero | SIM/NAO | SIM só p/ últimos 12 meses | Diagnóstico da Rede (IQT), Relatórios | Não |
| SEG_ADERENCIA | grau_aderencia_protocolo | ALTO/MEDIO/BAIXO | adequada/parcial/inadequada; "não avaliável" não altera | Investigação | Não |
| GAR_LISTA | gargalos_identificados | texto | rótulos das opções, separados por "; " | Gargalos | Não |
| VIO_CONSUMADOS / VIO_TENTADOS | eventos_feminicidio | inteiro | ano = VIO_ANO; `considera_no_score = false` | Ficha (informado pela Promotoria) | Não |
| FLX_RECURSOS_ITENS | tem_recursos_minimos | SIM/NAO | SIM só quando os 6 recursos foram marcados (equipe, espaço, transporte, psicólogo, assistência jurídica, acolhimento) | Diagnóstico da Rede (IER), Relatórios | Não |
| FLX_SUFICIENCIA | grau_suficiencia_estrutura | ADEQUADO/PARCIAL/INSUFICIENTE | adequada/parcial/insuficiente | Diagnóstico da Rede (IER), Relatórios | Não |
| SEG_CAPACITA_QTD | qtd_capacitacoes_realizadas | inteiro | ações nos últimos 12 meses; 0 quando SEG_CAPACITA = "Não" ou "há mais de 12 meses" | Investigação (Total de Capacitações) | Não |
| SOC_CAPACITA_DATA | data_ultima_capacitacao | data | cópia (AAAA-MM-DD) | Assistência | Não |

Os campos `tem_atendimento_juridico`, `tem_equipe_multiprofissional`, `tem_articulacao_rede` e `treinamento_especifico_feminicidio` não têm pergunta equivalente no formulário. Eles continuam vindo da carga existente e, quando vazios, aparecem como "Sem informação".
