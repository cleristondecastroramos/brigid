import json

def get_sql_type(val):
    if isinstance(val, int):
        return "INTEGER"
    if isinstance(val, float):
        return "NUMERIC"
    return "TEXT"

def generate_schema():
    with open('db.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    municipios = data.get('municipios', [])
    if not municipios:
        return ""
    
    # Analyze the first complete record to build schema
    sample = municipios[0]
    
    sql = ""
    sql += "-- DROP TABLES IF THEY EXIST\n"
    sql += "DROP TABLE IF EXISTS entregas_estrategicas;\n"
    sql += "DROP TABLE IF EXISTS municipios;\n\n"
    
    # 1. MUNICIPIOS
    sql += "-- CREATE TABLE municipios\n"
    sql += "CREATE TABLE municipios (\n"
    for k, v in sample.items():
        if k == "codigo_ibge" or k == "id":
            if k == "codigo_ibge":
                sql += f"    {k} TEXT PRIMARY KEY,\n"
            else:
                sql += f"    {k} TEXT,\n"
        else:
            sql_type = get_sql_type(v)
            sql += f"    {k} {sql_type},\n"
            
    # Remove last comma
    sql = sql.rstrip(',\n') + "\n);\n\n"
    
    # 2. ENTREGAS
    sql += "-- CREATE TABLE entregas_estrategicas\n"
    sql += "CREATE TABLE entregas_estrategicas (\n"
    sql += "    id SERIAL PRIMARY KEY,\n"
    sql += "    titulo TEXT NOT NULL,\n"
    sql += "    responsavel TEXT,\n"
    sql += "    prazo TEXT,\n"
    sql += "    status TEXT,\n"
    sql += "    progresso INTEGER,\n"
    sql += "    descricao TEXT\n"
    sql += ");\n\n"
    
    # INSERTS FOR MUNICIPIOS
    sql += "-- INSERT DATA FOR municipios\n"
    for m in municipios:
        columns = []
        values = []
        for k, v in m.items():
            columns.append(k)
            if v is None:
                values.append("NULL")
            elif isinstance(v, (int, float)):
                values.append(str(v))
            else:
                # escape single quotes
                safe_val = str(v).replace("'", "''")
                values.append(f"'{safe_val}'")
        
        sql += f"INSERT INTO municipios ({', '.join(columns)}) VALUES ({', '.join(values)});\n"
        
    sql += "\n"
    
    # INSERTS FOR ENTREGAS
    sql += "-- INSERT DATA FOR entregas_estrategicas\n"
    entregas = [
      { "titulo": "Painel BI de OPMs com mapa interativo", "responsavel": "CAOCRIM · NTI", "prazo": "2026-Q1", "status": "andamento", "progresso": 70, "descricao": "Visualização da cobertura de Organismos de Políticas para Mulheres por município, tipologia e território." },
      { "titulo": "Painel BI de CREAS com mapa interativo", "responsavel": "CAOCRIM · SASC", "prazo": "2026-Q1", "status": "andamento", "progresso": 65, "descricao": "Mapeamento de cobertura de CREAS e identificação de municípios prioritários para implantação." },
      { "titulo": "Painel de Indicadores de Violência e Risco de Feminicídio", "responsavel": "CAOCRIM · Inteligência", "prazo": "2026-Q2", "status": "andamento", "progresso": 55, "descricao": "Cruzamento de feminicídios consumados, tentativas e cobertura institucional para suporte à decisão." },
      { "titulo": "Diagnóstico das Secretarias e Coordenadorias da Mulher", "responsavel": "CAOCRIM · SEMPI", "prazo": "2026-Q2", "status": "andamento", "progresso": 40, "descricao": "Levantamento institucional sobre presença, estrutura e funcionamento das OPMs em todos os 224 municípios." },
      { "titulo": "Plano de fomento para implantação de CREAS em municípios descobertos", "responsavel": "SASC/SUAS · MPPI", "prazo": "2026-Q3", "status": "planejada", "progresso": 10, "descricao": "Construção de plano interinstitucional de articulação para implantação de CREAS em municípios sem cobertura." },
      { "titulo": "Padronização do fluxo de atendimento às vítimas", "responsavel": "CAOCRIM · Rede de Proteção", "prazo": "2026-Q3", "status": "planejada", "progresso": 5, "descricao": "Manual e protocolo de atendimento integrado entre Ministério Público, CREAS, OPMs e Segurança Pública." },
      { "titulo": "Programa educativo de enfrentamento à violência de gênero", "responsavel": "MPPI · Educação", "prazo": "2026-Q4", "status": "planejada", "progresso": 0, "descricao": "Ações educativas e formativas voltadas a escolas, redes municipais e comunidades." },
      { "titulo": "Carta-compromisso institucional com municípios prioritários", "responsavel": "PGJ-MPPI", "prazo": "2025-Q4", "status": "concluida", "progresso": 100, "descricao": "Pactuação formal com gestores municipais para fortalecimento da rede de enfrentamento." }
    ]
    for e in entregas:
        cols = ['titulo', 'responsavel', 'prazo', 'status', 'progresso', 'descricao']
        vals = []
        for k in cols:
            v = e.get(k)
            if isinstance(v, (int, float)):
                vals.append(str(v))
            else:
                safe_val = str(v).replace("'", "''")
                vals.append(f"'{safe_val}'")
        
        sql += f"INSERT INTO entregas_estrategicas ({', '.join(cols)}) VALUES ({', '.join(vals)});\n"
        
    with open('schema_e_seed.sql', 'w', encoding='utf-8') as out:
        out.write(sql)
        
    print("schema_e_seed.sql gerado!")

generate_schema()
