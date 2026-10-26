-- Atualiza os municípios que POSSUEM OPM, definindo a efetividade das políticas públicas como 'NAO'
UPDATE municipios
SET opm_status_politicas_publicas = 'NAO'
WHERE opm_possui = 'SIM';

-- Garante que os municípios que NÃO POSSUEM OPM tenham o campo deixado em branco
UPDATE municipios
SET opm_status_politicas_publicas = ''
WHERE opm_possui = 'NAO' OR opm_possui IS NULL;
