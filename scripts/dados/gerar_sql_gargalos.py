# Caminhos relativos à raiz do projeto: o script pode ser executado de qualquer pasta.
import os as _os
_os.chdir(_os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))))

import csv
import os

csv_path = 'database/fontes/gargalos.csv'
sql_path = 'database/cargas/gargalos.sql'

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    
    with open(sql_path, 'w', encoding='utf-8') as sql_out:
        sql_out.write("-- Script para atualizar gargalos identificados nos municipios\n\n")
        sql_out.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS gargalos_identificados TEXT;\n\n")
        
        for row in reader:
            if not row or len(row) < 2: continue
            municipio = row[0].strip()
            gargalos = row[1].strip()
            
            # Se for "Nenhum gargalo crítico identificado.", vamos salvar como NULL para o frontend ignorar corretamente
            if gargalos == "Nenhum gargalo crítico identificado.":
                gargalo_val = "NULL"
            else:
                gargalo_val = f"'{gargalos.replace(chr(39), chr(39)+chr(39))}'"
                
            municipio_escaped = municipio.replace("'", "''")
            
            sql = f"UPDATE municipios SET gargalos_identificados = {gargalo_val} WHERE municipio = '{municipio_escaped}';\n"
            sql_out.write(sql)

print(f"Arquivo {sql_path} gerado com sucesso!")
