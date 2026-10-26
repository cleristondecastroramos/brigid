-- 0. Garantir que a tabela esteja pronta
-- (municipios já possui 'id' como Primary Key, então usaremos ele)

-- 1. Criar a Tabela Normalizada de Eventos
CREATE TABLE IF NOT EXISTS public.eventos_feminicidio (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    municipio_id VARCHAR REFERENCES public.municipios(id) ON DELETE CASCADE,
    ano_fato INT NOT NULL,
    tipo_evento VARCHAR NOT NULL CHECK (tipo_evento IN ('CONSUMADO', 'TENTADO')),
    quantidade INT NOT NULL DEFAULT 0,
    origem_dado VARCHAR DEFAULT 'SISTEMA_LEGADO',
    status_periodo VARCHAR NOT NULL CHECK (status_periodo IN ('historico_fechado', 'janela_oficial', 'parcial_corrente')),
    considera_no_score BOOLEAN NOT NULL DEFAULT false,
    versao_metodologia VARCHAR NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Migrar os dados históricos de 2023 (CONSUMADO e TENTADO)
INSERT INTO public.eventos_feminicidio (municipio_id, ano_fato, tipo_evento, quantidade, status_periodo, considera_no_score, versao_metodologia)
SELECT 
    id, 
    2023, 
    'CONSUMADO', 
    COALESCE(consumado_2023, 0), 
    'janela_oficial', 
    true, 
    'risco_v3_2023_2025'
FROM public.municipios
WHERE consumado_2023 > 0;

INSERT INTO public.eventos_feminicidio (municipio_id, ano_fato, tipo_evento, quantidade, status_periodo, considera_no_score, versao_metodologia)
SELECT 
    id, 
    2023, 
    'TENTADO', 
    COALESCE(tentado_2023, 0), 
    'janela_oficial', 
    true, 
    'risco_v3_2023_2025'
FROM public.municipios
WHERE tentado_2023 > 0;

-- 3. Migrar os dados oficiais de 2024 (CONSUMADO e TENTADO)
INSERT INTO public.eventos_feminicidio (municipio_id, ano_fato, tipo_evento, quantidade, status_periodo, considera_no_score, versao_metodologia)
SELECT 
    id, 
    2024, 
    'CONSUMADO', 
    COALESCE(consumado_2024, 0), 
    'janela_oficial', 
    true, 
    'risco_v3_2023_2025'
FROM public.municipios
WHERE consumado_2024 > 0;

INSERT INTO public.eventos_feminicidio (municipio_id, ano_fato, tipo_evento, quantidade, status_periodo, considera_no_score, versao_metodologia)
SELECT 
    id, 
    2024, 
    'TENTADO', 
    COALESCE(tentado_2024, 0), 
    'janela_oficial', 
    true, 
    'risco_v3_2023_2025'
FROM public.municipios
WHERE tentado_2024 > 0;

-- 4. Migrar os dados oficiais de 2025 (CONSUMADO e TENTADO)
INSERT INTO public.eventos_feminicidio (municipio_id, ano_fato, tipo_evento, quantidade, status_periodo, considera_no_score, versao_metodologia)
SELECT 
    id, 
    2025, 
    'CONSUMADO', 
    COALESCE(consumado_2025, 0), 
    'janela_oficial', 
    true, 
    'risco_v3_2023_2025'
FROM public.municipios
WHERE consumado_2025 > 0;

INSERT INTO public.eventos_feminicidio (municipio_id, ano_fato, tipo_evento, quantidade, status_periodo, considera_no_score, versao_metodologia)
SELECT 
    id, 
    2025, 
    'TENTADO', 
    COALESCE(tentado_2025, 0), 
    'janela_oficial', 
    true, 
    'risco_v3_2023_2025'
FROM public.municipios
WHERE tentado_2025 > 0;

-- 5. Migrar os dados parciais de 2026 (CONSUMADO e TENTADO)
INSERT INTO public.eventos_feminicidio (municipio_id, ano_fato, tipo_evento, quantidade, status_periodo, considera_no_score, versao_metodologia)
SELECT 
    id, 
    2026, 
    'CONSUMADO', 
    COALESCE(consumado_2026, 0), 
    'parcial_corrente', 
    false, 
    'risco_v3_2023_2025'
FROM public.municipios
WHERE consumado_2026 > 0;

INSERT INTO public.eventos_feminicidio (municipio_id, ano_fato, tipo_evento, quantidade, status_periodo, considera_no_score, versao_metodologia)
SELECT 
    id, 
    2026, 
    'TENTADO', 
    COALESCE(tentado_2026, 0), 
    'parcial_corrente', 
    false, 
    'risco_v3_2023_2025'
FROM public.municipios
WHERE tentado_2026 > 0;

-- Observação: as colunas originais (consumado_2023, tentado_2023, etc) 
-- ficam preservadas em public.municipios para garantia histórica e auditoria.
