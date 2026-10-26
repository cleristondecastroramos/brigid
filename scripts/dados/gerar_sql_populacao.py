# Caminhos relativos à raiz do projeto: o script pode ser executado de qualquer pasta.
import os as _os
_os.chdir(_os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))))

import csv
import os

csv_path = 'database/fontes/populacao_pi.csv'
sql_path = 'database/cargas/populacao.sql'

with open(csv_path, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    
    with open(sql_path, 'w', encoding='utf-8') as sql_out:
        sql_out.write("-- Script para atualizar a população total e feminina dos municípios\n")
        sql_out.write("-- Gerado automaticamente a partir de database/fontes/populacao_pi.csv\n\n")
        sql_out.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS populacao_feminina INTEGER;\n\n")
        
        for row in reader:
            municipio = row.get('Municipio', '').strip()
            total = row.get('Total', '').strip()
            mulheres = row.get('Mulheres', '').strip()
            
            if not municipio or not total or not mulheres:
                continue
            
            # Escapar aspas simples no nome do município (ex: Barra D'Alcântara)
            municipio_escaped = municipio.replace("'", "''")
            
            sql = f"UPDATE municipios SET populacao = {total}, populacao_feminina = {mulheres} WHERE municipio = '{municipio_escaped}';\n"
            sql_out.write(sql)

print(f"Arquivo {sql_path} gerado com sucesso!")
