import csv

csv_path = 'public/data/capacitacoes.csv'
sql_path = 'atualizar_capacitacoes.sql'

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    
    with open(sql_path, 'w', encoding='utf-8') as sql_out:
        sql_out.write("-- Script para atualizar dados de capacitações\n\n")
        
        # Criar as colunas se não existirem
        sql_out.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS qtd_capacitacoes_realizadas INT;\n")
        sql_out.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS profissionais_capacitados INT;\n")
        sql_out.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS data_ultima_capacitacao VARCHAR(10);\n\n")
        
        for row in reader:
            if not row or len(row) < 4: continue
            
            municipio = row[0].strip()
            qtd = row[1].strip()
            profissionais = row[2].strip()
            data = row[3].strip()
            
            # Se a string estiver vazia, define como NULL
            qtd_val = qtd if qtd else 'NULL'
            profissionais_val = profissionais if profissionais else 'NULL'
            data_val = f"'{data}'" if data else 'NULL'
            
            municipio_escaped = municipio.replace("'", "''")
            
            sql = f"UPDATE municipios SET qtd_capacitacoes_realizadas = {qtd_val}, profissionais_capacitados = {profissionais_val}, data_ultima_capacitacao = {data_val} WHERE municipio = '{municipio_escaped}';\n"
            sql_out.write(sql)

print(f"Arquivo {sql_path} gerado com sucesso!")
