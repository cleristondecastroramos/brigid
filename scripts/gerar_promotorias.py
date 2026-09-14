import csv
import json
import os
import unicodedata
import re

def normalize_text(text):
    if not text: return ""
    text = text.strip()
    text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]', '', text)
    return text

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_dir, 'src', 'data', 'promotorias.csv')
    db_json_path = os.path.join(base_dir, 'db.json')
    ts_out_path = os.path.join(base_dir, 'src', 'data', 'promotorias-seed.ts')
    sql_out_path = os.path.join(base_dir, 'migrations', 'migration_promotorias.sql')

    with open(db_json_path, 'r', encoding='utf-8') as f:
        db_data = json.load(f)
    
    municipios_base = db_data.get('municipios', [])
    municipio_map = {}
    for m in municipios_base:
        norm_name = normalize_text(m['municipio'])
        municipio_map[norm_name] = m

    linhas_lidas = 0
    promotorias_dict = {}
    vinculos = []
    
    sem_correspondencia = []
    divergencias_comarca = []

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            linhas_lidas += 1
            promotoria_nome = row['PROMOTORIA DE JUSTIÇA'].strip()
            municipio_csv = row['MUNICÍPIO'].strip()
            comarca_csv = row['COMARCA'].strip()

            prom_norm = normalize_text(promotoria_nome)
            mun_norm = normalize_text(municipio_csv)

            if prom_norm not in promotorias_dict:
                promotorias_dict[prom_norm] = {
                    'id': f"PRM-{len(promotorias_dict)+1:03d}",
                    'nome': promotoria_nome,
                    'nome_normalizado': prom_norm,
                    'comarca_sede': comarca_csv,
                    'tipo_atribuicao': 'pendente_configuracao',
                }
            
            promotoria_id = promotorias_dict[prom_norm]['id']

            if mun_norm in municipio_map:
                mun_base = municipio_map[mun_norm]
                codigo_ibge = mun_base['codigo_ibge']
                comarca_base = mun_base['comarca']

                if normalize_text(comarca_csv) != normalize_text(comarca_base):
                    divergencias_comarca.append({
                        'municipio': municipio_csv,
                        'comarca_csv': comarca_csv,
                        'comarca_base': comarca_base
                    })
                
                # Check for duplicates
                is_dup = False
                for v in vinculos:
                    if v['promotoria_id'] == promotoria_id and v['codigo_ibge'] == codigo_ibge:
                        is_dup = True
                        break
                
                if not is_dup:
                    vinculos.append({
                        'promotoria_id': promotoria_id,
                        'codigo_ibge': codigo_ibge,
                        'municipio': mun_base['municipio'],
                        'comarca': comarca_base,
                        'polo_regional': mun_base['polo_regional']
                    })
            else:
                sem_correspondencia.append(municipio_csv)

    # Log report
    print("="*50)
    print("RELATÓRIO DE IMPORTAÇÃO DE PROMOTORIAS")
    print("="*50)
    print(f"Linhas lidas no CSV: {linhas_lidas}")
    print(f"Promotorias distintas identificadas: {len(promotorias_dict)}")
    print(f"Vínculos Promotoria-Município gerados: {len(vinculos)}")
    
    municipios_resolvidos = len(set([v['codigo_ibge'] for v in vinculos]))
    print(f"Municípios com código IBGE resolvido: {municipios_resolvidos}")
    
    print(f"\nRegistros sem correspondência de município na base ({len(sem_correspondencia)}):")
    for s in sem_correspondencia: print(f" - {s}")

    print(f"\nDivergências entre comarca do CSV e comarca da base territorial ({len(divergencias_comarca)}):")
    for d in divergencias_comarca:
        print(f" - Mun: {d['municipio']} | CSV: {d['comarca_csv']} | Base: {d['comarca_base']}")
    
    # Export TypeScript
    ts_content = f"""// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
export interface Promotoria {{
  id: string;
  nome: string;
  nome_normalizado: string;
  comarca_sede: string;
  tipo_atribuicao: string;
}}

export interface PromotoriaMunicipio {{
  promotoria_id: string;
  codigo_ibge: string;
  municipio: string;
  comarca: string;
  polo_regional: string;
}}

export const promotorias: Promotoria[] = {json.dumps(list(promotorias_dict.values()), ensure_ascii=False, indent=2)};

export const promotoriaMunicipios: PromotoriaMunicipio[] = {json.dumps(vinculos, ensure_ascii=False, indent=2)};
"""
    with open(ts_out_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    # Export SQL
    sql_content = """-- Migration script gerado automaticamente
-- Tabela de Promotorias
CREATE TABLE IF NOT EXISTS public.promotorias_justica (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    nome_normalizado TEXT,
    comarca_sede TEXT,
    tipo_atribuicao TEXT DEFAULT 'pendente_configuracao',
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Abrangência Territorial
CREATE TABLE IF NOT EXISTS public.promotoria_municipios (
    id SERIAL PRIMARY KEY,
    promotoria_id TEXT REFERENCES public.promotorias_justica(id) ON DELETE CASCADE,
    codigo_ibge TEXT REFERENCES public.municipios(codigo_ibge),
    municipio TEXT,
    comarca TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (promotoria_id, codigo_ibge)
);

-- INSERTS (Idempotentes)
"""
    for p in promotorias_dict.values():
        sql_content += f"INSERT INTO public.promotorias_justica (id, nome, nome_normalizado, comarca_sede, tipo_atribuicao) VALUES ('{p['id']}', '{p['nome'].replace('\'', '\'\'')}', '{p['nome_normalizado']}', '{p['comarca_sede'].replace('\'', '\'\'')}', '{p['tipo_atribuicao']}') ON CONFLICT (id) DO NOTHING;\n"
    
    sql_content += "\n"

    for v in vinculos:
        sql_content += f"INSERT INTO public.promotoria_municipios (promotoria_id, codigo_ibge, municipio, comarca) VALUES ('{v['promotoria_id']}', '{v['codigo_ibge']}', '{v['municipio'].replace('\'', '\'\'')}', '{v['comarca'].replace('\'', '\'\'')}') ON CONFLICT (promotoria_id, codigo_ibge) DO NOTHING;\n"

    with open(sql_out_path, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    
    print("\nArquivos gerados com sucesso:")
    print(f"- {ts_out_path}")
    print(f"- {sql_out_path}")

if __name__ == "__main__":
    main()
