import csv

csv_path = 'public/data/rede_protecao_assistencial.csv'
sql_path = 'atualizar_assistencia.sql'

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    
    with open(sql_path, 'w', encoding='utf-8') as sql_out:
        sql_out.write("-- Script para atualizar dados de assistência social\n\n")
        
        # Criar as colunas se não existirem
        sql_out.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS tem_protocolo_assistencial VARCHAR(10);\n")
        sql_out.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS tem_fluxo_encaminhamento VARCHAR(10);\n")
        sql_out.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS articulacao_creas_rede VARCHAR(10);\n")
        sql_out.write("ALTER TABLE municipios ADD COLUMN IF NOT EXISTS tem_equipe_minima_creas VARCHAR(10);\n\n")
        
        for row in reader:
            if not row or len(row) < 5: continue
            
            municipio = row[0].strip()
            prot_assist = row[1].strip().upper()
            fluxo = row[2].strip().upper()
            creas = row[3].strip().upper()
            equipe = row[4].strip().upper()
            
            # Formatar NAO sem acento
            prot_assist = 'NAO' if prot_assist == 'NÃO' else prot_assist
            fluxo = 'NAO' if fluxo == 'NÃO' else fluxo
            creas = 'NAO' if creas == 'NÃO' else creas
            equipe = 'NAO' if equipe == 'NÃO' else equipe
            
            municipio_escaped = municipio.replace("'", "''")
            
            sql = f"UPDATE municipios SET tem_protocolo_assistencial = '{prot_assist}', tem_fluxo_encaminhamento = '{fluxo}', articulacao_creas_rede = '{creas}', tem_equipe_minima_creas = '{equipe}' WHERE municipio = '{municipio_escaped}';\n"
            sql_out.write(sql)

print(f"Arquivo {sql_path} gerado com sucesso!")
