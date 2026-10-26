export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credenciais_provisorias: {
        Row: {
          emitida_em: string
          emitida_por: string | null
          expira_em: string
          hash_credencial: string
          user_id: string
        }
        Insert: {
          emitida_em?: string
          emitida_por?: string | null
          expira_em: string
          hash_credencial: string
          user_id: string
        }
        Update: {
          emitida_em?: string
          emitida_por?: string | null
          expira_em?: string
          hash_credencial?: string
          user_id?: string
        }
        Relationships: []
      }
      diagnostico_anexos: {
        Row: {
          classificacao: string
          diagnostico_id: string
          enviado_em: string
          enviado_por: string | null
          id: number
          nome_arquivo: string
          secao: string
          storage_path: string
          tamanho_bytes: number | null
          tipo_mime: string | null
          versao: number
        }
        Insert: {
          classificacao?: string
          diagnostico_id: string
          enviado_em?: string
          enviado_por?: string | null
          id?: number
          nome_arquivo: string
          secao: string
          storage_path: string
          tamanho_bytes?: number | null
          tipo_mime?: string | null
          versao: number
        }
        Update: {
          classificacao?: string
          diagnostico_id?: string
          enviado_em?: string
          enviado_por?: string | null
          id?: number
          nome_arquivo?: string
          secao?: string
          storage_path?: string
          tamanho_bytes?: number | null
          tipo_mime?: string | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_anexos_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnostico_brigid"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico_auditoria: {
        Row: {
          acao: string
          data_registro: string | null
          diagnostico_id: string
          id: number
          usuario_id: string | null
          valor_anterior: Json | null
          valor_novo: Json | null
          versao: number | null
        }
        Insert: {
          acao: string
          data_registro?: string | null
          diagnostico_id: string
          id?: number
          usuario_id?: string | null
          valor_anterior?: Json | null
          valor_novo?: Json | null
          versao?: number | null
        }
        Update: {
          acao?: string
          data_registro?: string | null
          diagnostico_id?: string
          id?: number
          usuario_id?: string | null
          valor_anterior?: Json | null
          valor_novo?: Json | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_auditoria_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnostico_brigid"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico_brigid: {
        Row: {
          atribuicao: string[]
          codigo_ibge: string | null
          data_atualizacao: string | null
          data_criacao: string | null
          data_envio: string | null
          id: string
          percentual_preenchimento: number
          periodo_referencia: string | null
          promotoria_id: string | null
          responsavel_condicao: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          status: string
          usuario_id: string | null
          versao_atual: number
          versao_publicada: number | null
        }
        Insert: {
          atribuicao?: string[]
          codigo_ibge?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_envio?: string | null
          id?: string
          percentual_preenchimento?: number
          periodo_referencia?: string | null
          promotoria_id?: string | null
          responsavel_condicao?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          usuario_id?: string | null
          versao_atual?: number
          versao_publicada?: number | null
        }
        Update: {
          atribuicao?: string[]
          codigo_ibge?: string | null
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_envio?: string | null
          id?: string
          percentual_preenchimento?: number
          periodo_referencia?: string | null
          promotoria_id?: string | null
          responsavel_condicao?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          usuario_id?: string | null
          versao_atual?: number
          versao_publicada?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_brigid_codigo_ibge_fkey"
            columns: ["codigo_ibge"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["codigo_ibge"]
          },
          {
            foreignKeyName: "diagnostico_brigid_promotoria_fk"
            columns: ["promotoria_id"]
            isOneToOne: false
            referencedRelation: "promotorias_justica"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico_campos_regras: {
        Row: {
          codigo: string
          cond_campo: string | null
          cond_maior_que: number | null
          cond_valores: string[] | null
          obrigatorio: boolean
          ordem: number
          rotulo: string
          secao: string
          tipo_controle: string
        }
        Insert: {
          codigo: string
          cond_campo?: string | null
          cond_maior_que?: number | null
          cond_valores?: string[] | null
          obrigatorio: boolean
          ordem: number
          rotulo: string
          secao: string
          tipo_controle: string
        }
        Update: {
          codigo?: string
          cond_campo?: string | null
          cond_maior_que?: number | null
          cond_valores?: string[] | null
          obrigatorio?: boolean
          ordem?: number
          rotulo?: string
          secao?: string
          tipo_controle?: string
        }
        Relationships: []
      }
      diagnostico_gargalos: {
        Row: {
          categoria: string
          codigo_ibge: string | null
          descricao: string | null
          diagnostico_id: string
          id: number
          impacto: string | null
          orgao_responsavel: string | null
          prioridade: string | null
          recorrencia: string | null
          status_validacao: string | null
        }
        Insert: {
          categoria: string
          codigo_ibge?: string | null
          descricao?: string | null
          diagnostico_id: string
          id?: number
          impacto?: string | null
          orgao_responsavel?: string | null
          prioridade?: string | null
          recorrencia?: string | null
          status_validacao?: string | null
        }
        Update: {
          categoria?: string
          codigo_ibge?: string | null
          descricao?: string | null
          diagnostico_id?: string
          id?: number
          impacto?: string | null
          orgao_responsavel?: string | null
          prioridade?: string | null
          recorrencia?: string | null
          status_validacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_gargalos_codigo_ibge_fkey"
            columns: ["codigo_ibge"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["codigo_ibge"]
          },
          {
            foreignKeyName: "diagnostico_gargalos_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnostico_brigid"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico_mapeamento_publicacao: {
        Row: {
          afeta_score: boolean
          campo_destino: string
          codigo: string
          descricao_regra: string
          ordem: number
          painel: string
          regra: Json | null
          tipo_destino: string
        }
        Insert: {
          afeta_score?: boolean
          campo_destino: string
          codigo: string
          descricao_regra: string
          ordem: number
          painel: string
          regra?: Json | null
          tipo_destino: string
        }
        Update: {
          afeta_score?: boolean
          campo_destino?: string
          codigo?: string
          descricao_regra?: string
          ordem?: number
          painel?: string
          regra?: Json | null
          tipo_destino?: string
        }
        Relationships: []
      }
      diagnostico_observacoes: {
        Row: {
          autor_id: string | null
          campo_codigo: string | null
          criado_em: string
          diagnostico_id: string
          id: number
          secao: string | null
          texto: string
          tipo: string
          versao: number
          visivel_respondente: boolean
        }
        Insert: {
          autor_id?: string | null
          campo_codigo?: string | null
          criado_em?: string
          diagnostico_id: string
          id?: number
          secao?: string | null
          texto: string
          tipo: string
          versao: number
          visivel_respondente?: boolean
        }
        Update: {
          autor_id?: string | null
          campo_codigo?: string | null
          criado_em?: string
          diagnostico_id?: string
          id?: number
          secao?: string | null
          texto?: string
          tipo?: string
          versao?: number
          visivel_respondente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_observacoes_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnostico_brigid"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico_publicacoes: {
        Row: {
          codigo_ibge: string
          diagnostico_id: string
          hash_conteudo: string
          id: number
          observacoes: string | null
          periodo_referencia: string
          promotoria_id: string
          publicado_em: string
          publicado_por: string
          resultado: Json
          status: string
          validado_em: string
          validado_por: string
          versao: number
        }
        Insert: {
          codigo_ibge: string
          diagnostico_id: string
          hash_conteudo: string
          id?: number
          observacoes?: string | null
          periodo_referencia: string
          promotoria_id: string
          publicado_em?: string
          publicado_por: string
          resultado?: Json
          status?: string
          validado_em: string
          validado_por: string
          versao: number
        }
        Update: {
          codigo_ibge?: string
          diagnostico_id?: string
          hash_conteudo?: string
          id?: number
          observacoes?: string | null
          periodo_referencia?: string
          promotoria_id?: string
          publicado_em?: string
          publicado_por?: string
          resultado?: Json
          status?: string
          validado_em?: string
          validado_por?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_publicacoes_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnostico_brigid"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico_versoes: {
        Row: {
          analise_iniciada_em: string | null
          analise_por: string | null
          atualizado_em: string
          atualizado_por: string | null
          criado_em: string
          criado_por: string | null
          devolvido_em: string | null
          devolvido_por: string | null
          diagnostico_id: string
          enviado_em: string | null
          enviado_por: string | null
          hash_conteudo: string
          id: number
          motivo_devolucao: string | null
          numero: number
          observacoes_validacao: string | null
          percentual_preenchimento: number
          publicado_em: string | null
          publicado_por: string | null
          respostas: Json
          status: string
          substituido_em: string | null
          validado_em: string | null
          validado_por: string | null
        }
        Insert: {
          analise_iniciada_em?: string | null
          analise_por?: string | null
          atualizado_em?: string
          atualizado_por?: string | null
          criado_em?: string
          criado_por?: string | null
          devolvido_em?: string | null
          devolvido_por?: string | null
          diagnostico_id: string
          enviado_em?: string | null
          enviado_por?: string | null
          hash_conteudo?: string
          id?: number
          motivo_devolucao?: string | null
          numero: number
          observacoes_validacao?: string | null
          percentual_preenchimento?: number
          publicado_em?: string | null
          publicado_por?: string | null
          respostas?: Json
          status?: string
          substituido_em?: string | null
          validado_em?: string | null
          validado_por?: string | null
        }
        Update: {
          analise_iniciada_em?: string | null
          analise_por?: string | null
          atualizado_em?: string
          atualizado_por?: string | null
          criado_em?: string
          criado_por?: string | null
          devolvido_em?: string | null
          devolvido_por?: string | null
          diagnostico_id?: string
          enviado_em?: string | null
          enviado_por?: string | null
          hash_conteudo?: string
          id?: number
          motivo_devolucao?: string | null
          numero?: number
          observacoes_validacao?: string | null
          percentual_preenchimento?: number
          publicado_em?: string | null
          publicado_por?: string | null
          respostas?: Json
          status?: string
          substituido_em?: string | null
          validado_em?: string | null
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnostico_versoes_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnostico_brigid"
            referencedColumns: ["id"]
          },
        ]
      }
      entregas_estrategicas: {
        Row: {
          descricao: string | null
          id: number
          prazo: string | null
          progresso: number | null
          responsavel: string | null
          status: string | null
          titulo: string
        }
        Insert: {
          descricao?: string | null
          id?: number
          prazo?: string | null
          progresso?: number | null
          responsavel?: string | null
          status?: string | null
          titulo: string
        }
        Update: {
          descricao?: string | null
          id?: number
          prazo?: string | null
          progresso?: number | null
          responsavel?: string | null
          status?: string | null
          titulo?: string
        }
        Relationships: []
      }
      eventos_feminicidio: {
        Row: {
          ano_fato: number
          considera_no_score: boolean
          id: string
          municipio_id: string | null
          origem_dado: string | null
          publicacao_id: number | null
          quantidade: number
          status_periodo: string
          tipo_evento: string
          updated_at: string | null
          versao_metodologia: string
        }
        Insert: {
          ano_fato: number
          considera_no_score?: boolean
          id?: string
          municipio_id?: string | null
          origem_dado?: string | null
          publicacao_id?: number | null
          quantidade?: number
          status_periodo: string
          tipo_evento: string
          updated_at?: string | null
          versao_metodologia: string
        }
        Update: {
          ano_fato?: number
          considera_no_score?: boolean
          id?: string
          municipio_id?: string | null
          origem_dado?: string | null
          publicacao_id?: number | null
          quantidade?: number
          status_periodo?: string
          tipo_evento?: string
          updated_at?: string | null
          versao_metodologia?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_feminicidio_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["codigo_ibge"]
          },
        ]
      }
      municipio_dados_publicados: {
        Row: {
          campo_destino: string
          carater: string
          codigo_dicionario: string
          codigo_ibge: string
          confiabilidade: string | null
          data_referencia: string | null
          diagnostico_id: string
          fonte_informacao: string | null
          id: number
          periodo_referencia: string
          promotoria_id: string
          publicacao_id: number
          publicado_em: string
          valor: string | null
          valor_original: string | null
          versao: number
        }
        Insert: {
          campo_destino: string
          carater: string
          codigo_dicionario: string
          codigo_ibge: string
          confiabilidade?: string | null
          data_referencia?: string | null
          diagnostico_id: string
          fonte_informacao?: string | null
          id?: number
          periodo_referencia: string
          promotoria_id: string
          publicacao_id: number
          publicado_em?: string
          valor?: string | null
          valor_original?: string | null
          versao: number
        }
        Update: {
          campo_destino?: string
          carater?: string
          codigo_dicionario?: string
          codigo_ibge?: string
          confiabilidade?: string | null
          data_referencia?: string | null
          diagnostico_id?: string
          fonte_informacao?: string | null
          id?: number
          periodo_referencia?: string
          promotoria_id?: string
          publicacao_id?: number
          publicado_em?: string
          valor?: string | null
          valor_original?: string | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "municipio_dados_publicados_codigo_ibge_fkey"
            columns: ["codigo_ibge"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["codigo_ibge"]
          },
          {
            foreignKeyName: "municipio_dados_publicados_publicacao_id_fkey"
            columns: ["publicacao_id"]
            isOneToOne: false
            referencedRelation: "diagnostico_publicacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      municipios: {
        Row: {
          articulacao_creas_rede: string | null
          capacitado_perspectiva_genero: string | null
          codigo_ibge: string
          comarca: string | null
          comarca_slug: string | null
          consumado: number | null
          consumado_2023: number | null
          consumado_2024: number | null
          consumado_2025: number | null
          consumado_2026: number | null
          creas_ausente: string | null
          creas_possui: string | null
          creas_status: string | null
          data_ultima_capacitacao: string | null
          feminicidios_total_2023_2026: number | null
          fonte_base_creas: string | null
          fonte_base_opm: string | null
          fonte_base_risco: string | null
          gargalos_identificados: string | null
          grau_aderencia_protocolo: string | null
          grau_suficiencia_estrutura: string | null
          id: string | null
          indicador_tem_feminicidio_consumado: string | null
          indicador_tem_tentativa_feminicidio: string | null
          municipio: string | null
          municipio_slug: string | null
          necessita_atuacao_prioritaria: string | null
          observacoes_sistema: string | null
          ocorrencias_total_violencia_genero_monitoradas: number | null
          opm_orgaotipo: string | null
          opm_possui: string | null
          opm_possui_estrutura_ativa: string | null
          opm_status_politicas_publicas: string | null
          painel_alerta_rede: string | null
          polo_regional: string | null
          polo_regional_slug: string | null
          populacao: number | null
          populacao_feminina: number | null
          prioridade_fomento_opm: string | null
          prioridade_implantacao_creas: string | null
          profissionais_capacitados: number | null
          qtd_capacitacoes_realizadas: number | null
          risco_feminicidio_nivel: string | null
          risco_feminicidio_score: number | null
          status_monitoramento: string | null
          tem_atendimento_psicossocial: string | null
          tem_equipe_minima_creas: string | null
          tem_fluxo_encaminhamento: string | null
          tem_fluxo_formal: string | null
          tem_protocolo_assistencial: string | null
          tem_protocolo_investigacao: string | null
          tem_protocolo_local_regional: string | null
          tem_protocolo_pericial: string | null
          tem_recursos_minimos: string | null
          tem_sala_especializada: string | null
          tentado: number | null
          tentado_2023: number | null
          tentado_2024: number | null
          tentado_2025: number | null
          tentado_2026: number | null
          tentativas_total_2023_2026: number | null
          ultima_atualizacao_referencia: string | null
        }
        Insert: {
          articulacao_creas_rede?: string | null
          capacitado_perspectiva_genero?: string | null
          codigo_ibge: string
          comarca?: string | null
          comarca_slug?: string | null
          consumado?: number | null
          consumado_2023?: number | null
          consumado_2024?: number | null
          consumado_2025?: number | null
          consumado_2026?: number | null
          creas_ausente?: string | null
          creas_possui?: string | null
          creas_status?: string | null
          data_ultima_capacitacao?: string | null
          feminicidios_total_2023_2026?: number | null
          fonte_base_creas?: string | null
          fonte_base_opm?: string | null
          fonte_base_risco?: string | null
          gargalos_identificados?: string | null
          grau_aderencia_protocolo?: string | null
          grau_suficiencia_estrutura?: string | null
          id?: string | null
          indicador_tem_feminicidio_consumado?: string | null
          indicador_tem_tentativa_feminicidio?: string | null
          municipio?: string | null
          municipio_slug?: string | null
          necessita_atuacao_prioritaria?: string | null
          observacoes_sistema?: string | null
          ocorrencias_total_violencia_genero_monitoradas?: number | null
          opm_orgaotipo?: string | null
          opm_possui?: string | null
          opm_possui_estrutura_ativa?: string | null
          opm_status_politicas_publicas?: string | null
          painel_alerta_rede?: string | null
          polo_regional?: string | null
          polo_regional_slug?: string | null
          populacao?: number | null
          populacao_feminina?: number | null
          prioridade_fomento_opm?: string | null
          prioridade_implantacao_creas?: string | null
          profissionais_capacitados?: number | null
          qtd_capacitacoes_realizadas?: number | null
          risco_feminicidio_nivel?: string | null
          risco_feminicidio_score?: number | null
          status_monitoramento?: string | null
          tem_atendimento_psicossocial?: string | null
          tem_equipe_minima_creas?: string | null
          tem_fluxo_encaminhamento?: string | null
          tem_fluxo_formal?: string | null
          tem_protocolo_assistencial?: string | null
          tem_protocolo_investigacao?: string | null
          tem_protocolo_local_regional?: string | null
          tem_protocolo_pericial?: string | null
          tem_recursos_minimos?: string | null
          tem_sala_especializada?: string | null
          tentado?: number | null
          tentado_2023?: number | null
          tentado_2024?: number | null
          tentado_2025?: number | null
          tentado_2026?: number | null
          tentativas_total_2023_2026?: number | null
          ultima_atualizacao_referencia?: string | null
        }
        Update: {
          articulacao_creas_rede?: string | null
          capacitado_perspectiva_genero?: string | null
          codigo_ibge?: string
          comarca?: string | null
          comarca_slug?: string | null
          consumado?: number | null
          consumado_2023?: number | null
          consumado_2024?: number | null
          consumado_2025?: number | null
          consumado_2026?: number | null
          creas_ausente?: string | null
          creas_possui?: string | null
          creas_status?: string | null
          data_ultima_capacitacao?: string | null
          feminicidios_total_2023_2026?: number | null
          fonte_base_creas?: string | null
          fonte_base_opm?: string | null
          fonte_base_risco?: string | null
          gargalos_identificados?: string | null
          grau_aderencia_protocolo?: string | null
          grau_suficiencia_estrutura?: string | null
          id?: string | null
          indicador_tem_feminicidio_consumado?: string | null
          indicador_tem_tentativa_feminicidio?: string | null
          municipio?: string | null
          municipio_slug?: string | null
          necessita_atuacao_prioritaria?: string | null
          observacoes_sistema?: string | null
          ocorrencias_total_violencia_genero_monitoradas?: number | null
          opm_orgaotipo?: string | null
          opm_possui?: string | null
          opm_possui_estrutura_ativa?: string | null
          opm_status_politicas_publicas?: string | null
          painel_alerta_rede?: string | null
          polo_regional?: string | null
          polo_regional_slug?: string | null
          populacao?: number | null
          populacao_feminina?: number | null
          prioridade_fomento_opm?: string | null
          prioridade_implantacao_creas?: string | null
          profissionais_capacitados?: number | null
          qtd_capacitacoes_realizadas?: number | null
          risco_feminicidio_nivel?: string | null
          risco_feminicidio_score?: number | null
          status_monitoramento?: string | null
          tem_atendimento_psicossocial?: string | null
          tem_equipe_minima_creas?: string | null
          tem_fluxo_encaminhamento?: string | null
          tem_fluxo_formal?: string | null
          tem_protocolo_assistencial?: string | null
          tem_protocolo_investigacao?: string | null
          tem_protocolo_local_regional?: string | null
          tem_protocolo_pericial?: string | null
          tem_recursos_minimos?: string | null
          tem_sala_especializada?: string | null
          tentado?: number | null
          tentado_2023?: number | null
          tentado_2024?: number | null
          tentado_2025?: number | null
          tentado_2026?: number | null
          tentativas_total_2023_2026?: number | null
          ultima_atualizacao_referencia?: string | null
        }
        Relationships: []
      }
      promotoria_municipios: {
        Row: {
          ativo: boolean | null
          codigo_ibge: string | null
          comarca: string | null
          created_at: string | null
          id: number
          municipio: string | null
          promotoria_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo_ibge?: string | null
          comarca?: string | null
          created_at?: string | null
          id?: number
          municipio?: string | null
          promotoria_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo_ibge?: string | null
          comarca?: string | null
          created_at?: string | null
          id?: number
          municipio?: string | null
          promotoria_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotoria_municipios_codigo_ibge_fkey"
            columns: ["codigo_ibge"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["codigo_ibge"]
          },
          {
            foreignKeyName: "promotoria_municipios_promotoria_id_fkey"
            columns: ["promotoria_id"]
            isOneToOne: false
            referencedRelation: "promotorias_justica"
            referencedColumns: ["id"]
          },
        ]
      }
      promotorias_justica: {
        Row: {
          ativa: boolean | null
          comarca_sede: string | null
          created_at: string | null
          email_institucional: string | null
          id: string
          nome: string
          nome_normalizado: string | null
          tipo_atribuicao: string | null
          updated_at: string | null
        }
        Insert: {
          ativa?: boolean | null
          comarca_sede?: string | null
          created_at?: string | null
          email_institucional?: string | null
          id: string
          nome: string
          nome_normalizado?: string | null
          tipo_atribuicao?: string | null
          updated_at?: string | null
        }
        Update: {
          ativa?: boolean | null
          comarca_sede?: string | null
          created_at?: string | null
          email_institucional?: string | null
          id?: string
          nome?: string
          nome_normalizado?: string | null
          tipo_atribuicao?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          id: string
          session_id: string
          visited_at: string
        }
        Insert: {
          id?: string
          session_id: string
          visited_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      usuarios_promotoria: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          id: number
          nome_responsavel: string | null
          promotoria_id: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: number
          nome_responsavel?: string | null
          promotoria_id: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: number
          nome_responsavel?: string | null
          promotoria_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_promotoria_promotoria_id_fkey"
            columns: ["promotoria_id"]
            isOneToOne: false
            referencedRelation: "promotorias_justica"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _data_metadado: { Args: { p_valor: string }; Returns: string }
      _diagnostico_aplicar_publicacao: {
        Args: {
          p_confirmar_conflitos: string[]
          p_id: string
          p_versao: number
        }
        Returns: number
      }
      _diagnostico_auditar: {
        Args: {
          p_acao: string
          p_anterior: Json
          p_diagnostico_id: string
          p_novo: Json
          p_versao: number
        }
        Returns: undefined
      }
      _diagnostico_campo_visivel: {
        Args: {
          p_cond_campo: string
          p_cond_maior_que: number
          p_cond_valores: string[]
          p_respostas: Json
        }
        Returns: boolean
      }
      _diagnostico_carater: { Args: { p_periodo: string }; Returns: string }
      _diagnostico_hash: {
        Args: { p_atribuicao: string[]; p_respostas: Json }
        Returns: string
      }
      _diagnostico_itens_publicaveis: {
        Args: { p_diagnostico_id: string; p_versao: number }
        Returns: {
          afeta_score: boolean
          campo_destino: string
          codigo: string
          confiabilidade: string
          data_referencia: string
          fonte_informacao: string
          ignorado: string
          painel: string
          periodo: string
          secao: string
          tipo_destino: string
          valor: string
          valor_original: string
        }[]
      }
      _diagnostico_publicar_seguro: {
        Args: { p_confirmar: string[]; p_id: string; p_versao: number }
        Returns: Json
      }
      _diagnostico_sanitizar: {
        Args: { p_atribuicao: string[]; p_respostas: Json }
        Returns: Json
      }
      _diagnostico_secoes_aplicaveis: {
        Args: { p_atribuicao: string[] }
        Returns: string[]
      }
      _diagnostico_situacao_campo: {
        Args: { p_codigo: string; p_respostas: Json; p_tipo: string }
        Returns: string
      }
      _diagnostico_validar_responsavel: {
        Args: { p_condicao: string; p_nome: string }
        Returns: undefined
      }
      _exigir_admin: { Args: never; Returns: undefined }
      admin_conferir_conta_promotoria: {
        Args: { p_user_id: string }
        Returns: string
      }
      admin_desativar_vinculo: {
        Args: { p_vinculo_id: number }
        Returns: undefined
      }
      admin_listar_vinculos: {
        Args: never
        Returns: {
          ativo: boolean
          comarca_sede: string
          created_at: string
          credencial_individual: boolean
          email: string
          id: number
          nome_responsavel: string
          promotoria_id: string
          promotoria_nome: string
          senha_definida_em: string
          senha_provisoria: boolean
          senha_provisoria_em: string
          senha_provisoria_expira_em: string
          senha_provisoria_expirada: boolean
          ultimo_acesso: string
          user_id: string
        }[]
      }
      admin_preparar_conta_promotoria: {
        Args: { p_email: string; p_promotoria_id: string }
        Returns: {
          manter_senha: boolean
          user_id: string
        }[]
      }
      admin_situacao_conta_promotoria: {
        Args: { p_email: string; p_promotoria_id: string }
        Returns: {
          credencial_expirada: boolean
          credencial_individual: boolean
          expira_em: string
          provisoria: boolean
          tem_senha: boolean
          user_id: string
          vinculada_promotoria: boolean
        }[]
      }
      admin_vincular_conta_promotoria: {
        Args: { p_promotoria_id: string; p_user_id: string }
        Returns: number
      }
      admin_vincular_usuario: {
        Args: { p_descricao?: string; p_email: string; p_promotoria_id: string }
        Returns: number
      }
      diagnostico_completude: {
        Args: {
          p_atribuicao: string[]
          p_codigo_ibge: string
          p_periodo: string
          p_promotoria_id: string
          p_respostas: Json
        }
        Returns: Json
      }
      diagnostico_criar: {
        Args: {
          p_atribuicao: string[]
          p_codigo_ibge: string
          p_periodo: string
          p_promotoria_id: string
          p_responsavel_condicao: string
          p_responsavel_nome: string
        }
        Returns: string
      }
      diagnostico_devolver: {
        Args: {
          p_id: string
          p_motivo: string
          p_observacoes?: Json
          p_versao: number
        }
        Returns: undefined
      }
      diagnostico_enviar: {
        Args: {
          p_id: string
          p_responsavel_condicao: string
          p_responsavel_nome: string
        }
        Returns: undefined
      }
      diagnostico_iniciar_analise: {
        Args: { p_id: string }
        Returns: undefined
      }
      diagnostico_nova_versao: { Args: { p_id: string }; Returns: number }
      diagnostico_previa_publicacao: {
        Args: { p_id: string; p_versao: number }
        Returns: Json
      }
      diagnostico_publicar: {
        Args: {
          p_confirmar_conflitos?: string[]
          p_hash: string
          p_id: string
          p_versao: number
        }
        Returns: Json
      }
      diagnostico_registrar_anexo: {
        Args: {
          p_id: string
          p_mime: string
          p_nome: string
          p_secao: string
          p_storage_path: string
          p_tamanho: number
        }
        Returns: number
      }
      diagnostico_registrar_observacao: {
        Args: {
          p_campo: string
          p_id: string
          p_secao: string
          p_texto: string
          p_versao: number
        }
        Returns: number
      }
      diagnostico_remover_anexo: {
        Args: { p_anexo_id: number }
        Returns: string
      }
      diagnostico_salvar_rascunho: {
        Args: {
          p_atribuicao?: string[]
          p_id: string
          p_responsavel_condicao?: string
          p_responsavel_nome?: string
          p_respostas: Json
        }
        Returns: Json
      }
      diagnostico_validar_e_publicar: {
        Args: {
          p_confirmar_conflitos?: string[]
          p_hash: string
          p_id: string
          p_observacoes?: string
          p_versao: number
        }
        Returns: Json
      }
      encerrar_sessoes_conta: { Args: { p_user_id: string }; Returns: number }
      get_visitor_stats: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      meus_vinculos: {
        Args: never
        Returns: {
          comarca_sede: string
          nome: string
          nome_responsavel: string
          promotoria_id: string
          tipo_atribuicao: string
        }[]
      }
      senha_provisoria_ativa: { Args: never; Returns: boolean }
      usuario_vinculado: { Args: { p_promotoria_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
