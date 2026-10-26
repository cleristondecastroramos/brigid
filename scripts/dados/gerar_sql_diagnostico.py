# Caminhos relativos à raiz do projeto: o script pode ser executado de qualquer pasta.
import os as _os
_os.chdir(_os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))))

import csv
import os

csv_path = "database/fontes/diagnostico_rede_protecao_piaui.csv"
sql_path = "database/cargas/diagnostico.sql"

def sanitize(val):
    if not val:
        return "NULL"
    val = val.strip().upper()
    if val == "SIM":
        return "'SIM'"
    if val == "NÃO" or val == "NAO":
        return "'NAO'"
    return f"'{val}'"

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

with open(sql_path, 'w', encoding='utf-8') as f:
    f.write("-- Adicionando colunas na tabela se não existirem\n")
    f.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS tem_fluxo_formal TEXT;\n")
    f.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS tem_protocolo_local_regional TEXT;\n")
    f.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS tem_sala_especializada TEXT;\n")
    f.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS tem_recursos_minimos TEXT;\n")
    f.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS grau_suficiencia_estrutura TEXT;\n")
    f.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS tem_atendimento_psicossocial TEXT;\n\n")
    f.write("-- Populando dados do diagnóstico\n")
    
    for row in rows:
        mun = row['Município'].strip()
        fluxo = sanitize(row['Possui Fluxo Formal de Atendimento'])
        proto = sanitize(row['Possui Protocolo Local/Regional'])
        sala = sanitize(row['Possui Sala Especializada'])
        rec = sanitize(row['Possui Recursos Mínimos'])
        suf = sanitize(row['Possui Suficiência da Estrutura'])
        psico = sanitize(row['Possui Atendimento Psicossocial'])
        
        mun_escaped = mun.replace("'", "''")
        
        sql = (f"UPDATE municipios SET "
               f"tem_fluxo_formal = {fluxo}, "
               f"tem_protocolo_local_regional = {proto}, "
               f"tem_sala_especializada = {sala}, "
               f"tem_recursos_minimos = {rec}, "
               f"grau_suficiencia_estrutura = {suf}, "
               f"tem_atendimento_psicossocial = {psico} "
               f"WHERE municipio = '{mun_escaped}';\n")
        f.write(sql)

print(f"Sucesso! {len(rows)} comandos gerados em {sql_path}")
