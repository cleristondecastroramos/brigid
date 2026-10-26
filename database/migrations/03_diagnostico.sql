-- Migration script para a estrutura do Diagnóstico BRIGID

-- Tabela principal de Diagnósticos
CREATE TABLE IF NOT EXISTS public.diagnostico_brigid (
    id TEXT PRIMARY KEY,
    codigo_ibge TEXT REFERENCES public.municipios(codigo_ibge),
    promotoria_id TEXT, -- Referência para tabela de promotorias (se houver no futuro)
    usuario_id TEXT, -- Referência de autor (via auth ou controle interno)
    status TEXT NOT NULL CHECK (status IN ('rascunho', 'concluido', 'validacao', 'devolvido')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para guardar os blocos/respostas do formulário (EAV model ou JSONB)
-- Optou-se por JSONB para maior flexibilidade conforme o dicionário dinâmico.
CREATE TABLE IF NOT EXISTS public.diagnostico_respostas (
    id SERIAL PRIMARY KEY,
    diagnostico_id TEXT NOT NULL REFERENCES public.diagnostico_brigid(id) ON DELETE CASCADE,
    bloco TEXT NOT NULL,
    respostas JSONB NOT NULL,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para guardar os gargalos detalhados
CREATE TABLE IF NOT EXISTS public.diagnostico_gargalos (
    id SERIAL PRIMARY KEY,
    diagnostico_id TEXT NOT NULL REFERENCES public.diagnostico_brigid(id) ON DELETE CASCADE,
    codigo_ibge TEXT REFERENCES public.municipios(codigo_ibge),
    categoria TEXT NOT NULL,
    descricao TEXT,
    impacto TEXT CHECK (impacto IN ('baixo', 'medio', 'alto', 'critico')),
    recorrencia TEXT,
    orgao_responsavel TEXT,
    prioridade TEXT CHECK (prioridade IN ('nao_prioritaria', 'requer_acompanhamento', 'atuacao_prioritaria')),
    status_validacao TEXT
);

-- Tabela para guardar histórico de alterações de status e auditoria
CREATE TABLE IF NOT EXISTS public.diagnostico_auditoria (
    id SERIAL PRIMARY KEY,
    diagnostico_id TEXT NOT NULL REFERENCES public.diagnostico_brigid(id) ON DELETE CASCADE,
    usuario_id TEXT,
    acao TEXT NOT NULL,
    valor_anterior JSONB,
    valor_novo JSONB,
    data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices essenciais para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_diagnostico_ibge ON public.diagnostico_brigid(codigo_ibge);
CREATE INDEX IF NOT EXISTS idx_diagnostico_status ON public.diagnostico_brigid(status);
CREATE INDEX IF NOT EXISTS idx_gargalos_diagnostico ON public.diagnostico_gargalos(diagnostico_id);
