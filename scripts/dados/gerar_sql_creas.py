# Caminhos relativos à raiz do projeto: o script pode ser executado de qualquer pasta.
import os as _os
_os.chdir(_os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))))

import json
import re
import unicodedata

raw_data = """
Acauã	Não
Agricolândia	Não
Água Branca	Sim
Alagoinha	Não
Alegrete	Não
Alto Longa	Não
Altos	Sim
Alvorada do Gurgueia	Sim
Amarante	Sim
Angical	Sim
Anísio de Abreu	Sim
Antônio Almeida	Não
Aroazes	Não
Aroeira do Itaim	Não
Arraial	Não
Assunção	Não
Avelino Lopes	Sim
Baixa Grande do Ribeiro	Sim
Barra D’Alcantara	Não
Barras	Sim
Barreiras	Não
Barro Duro	Não
Batalha	Sim
Bela Vista	Não
Belém	Não
Beneditinos	Não
Bertolínia	Não
Betânia	Não
Boa Hora	Não
Bocaina	Não
Bom Jesus	Sim
Bom Princípio	Não
Bonfim	Não
Boqueirão	Não
Brasileira	Não
Brejo	Não
Buriti dos Lopes	Sim
Buriti dos Montes	Não
Cabeceiras	Não
Cajazeiras	Não
Cajueiro da Praia	Não
Caldeirão Grande	Não
Campinas	Não
Campo Alegre Fidalgo	Não
Campo Grande	Não
Campo Largo	Não
Campo Maior	Sim
Canavieira	Não
Canto do Buriti	Sim
Capitão Campos	Sim
Cap. Gervásio Oliveira	Não
Caracol	Não
Caraúbas	Não
Caridade	Não
Castelo do Piauí	Sim
Caxingó	Não
Cocal	Sim
Cocal de Telha	Sim
Cocal dos Alves	Sim
Coivaras	Não
Colônia do Gurguéia	Não
Colônia do Piauí	Não
Conceição do Canindé	Não
Coronel José Dias	Não
Corrente	Sim
Cristalândia	Não
Cristino Castro	Não
Curimatá	Não
Currais	Não
Curral Novo	Não
Curralinhos	Não
Demerval Lobão	Não
Dirceu Arcoverde	Não
Dom Expedito Lopes	Sim
Dom Inocêncio	Sim
Domingos Mourão	Não
Elesbão Veloso	Sim
Eliseu Martins	Não
Esperantina	Sim
Fartura	Não
Flores	Não
Floresta	Não
Floriano	Sim
Francinópolis	Não
Francisco Aires	Não
Francisco Macedo	Não
Francisco Santos	Sim
Fronteiras	Não
Geminiano	Não
Gilbués	Sim
Guadalupe	Sim
Guaribas	Não
Hugo Napoleão	Não
Ilha Grande	Não
Inhuma	Sim
Ipiranga	Sim
Isaias Coelho	Sim
Itainópolis	Não
Itaueira	Sim
Jacobina	Não
Jaicós	Sim
Jardim do Mulato	Não
Jatobá	Não
Jerumenha	Não
João Costa	Não
Joaquim Pires	Sim
Joca Marques	Não
José de Freitas	Sim
Juazeiro	Não
Júlio Borges	Não
Jurema	Não
Lagoa Alegre	Não
Lagoa São Francisco	Não
Lagoa do Barro	Sim
Lagoa do Piauí	Não
Lagoa do Sítio	Sim
Lagoinha	Não
Landri Sales	Sim
Luís Correia	Sim
Luzilândia	Sim
Madeiro	Não
Manoel Emídio	Não
Marcolândia	Sim
Marcos Parente	Sim
Massapé	Não
Matias Olímpio	Não
Miguel Alves	Sim
Miguel Leão	Não
Milton Brandão	Não
Monsenhor Gil	Sim
Monsenhor Hipólito	Sim
Monte Alegre	Não
Morro Cabeça no Tempo	Não
Morro do Chapéu	Não
Murici Portelas	Não
Nazaré do Piauí	Sim
Nazária	Não
Nossa Sra Nazaré	Não
Nossa Sra dos Remédios	Não
Nova Santa Rita	Não
Novo Oriente	Não
Novo Sto Antônio	Não
Oeiras	Sim
Olho D’agua	Não
Padre Marcos	Não
Paes Landim	Não
Pajeú	Não
Palmeira	Não
Palmeirais	Sim
Paquetá	Não
Parnaguá	Não
Parnaíba	Sim
Passagem Franca	Sim
Patos	Não
Pau D’Arco	Não
Paulistana	Sim
Pavussu	Não
Pedro II	Sim
Pedro Laurentino	Não
Picos	Sim
Pimenteiras	Sim
Pio IX	Sim
Piracuruca	Sim
Piripiri	Sim
Porto	Sim
Porto Alegre	Não
Prata	Não
Queimada Nova	Não
Redenção Gurgueia	Não
Regeneração	Sim
Riacho Frio	Não
Ribeira	Não
Ribeiro Gonçalves	Não
Rio Grande	Não
Santa Cruz PI	Não
Sta Cruz Milagres	Não
Santa Filomena	Não
Santa Luz	Não
Santa Rosa	Não
Santana	Não
Santo Antônio Lisboa	Sim
Santo Antônio dos Milagres	Não
Santo Inácio	Não
São Braz	Não
São Felix	Não
São Francisco de Assis	Sim
São Francisco do PI	Não
São Gonçalo Gurgueia	Não
São Gonçalo do PI	Não
São João Canabrava	Não
São João Fronteira	Sim
São João da Serra	Não
São João da Varjota	Não
São João Arraial	Não
São João do Piauí	Sim
São José Divino	Não
São José do Peixe	Não
São José do Piauí	Não
São Julião	Não
São Lourenço	Não
São Luís	Não
São Miguel Baixa Grande	Não
São Miguel Fidalgo	Não
São Miguel do Tapuio	Sim
São Pedro	Sim
São Raimundo Nonato	Sim
Sebastião Barros	Não
Sebastião Leal	Não
Sigefredo Pacheco	Não
Simões	Sim
Simplício Mendes	Sim
Socorro	Não
Sussuapara	Não
Tamboril	Não
Tanque	Não
Teresina	Sim
União	Sim
Uruçuí	Sim
Valença	Sim
Várzea Branca	Não
Várzea Grande	Não
Vera Mendes	Não
Vila Nova	Não
Wall Ferraz	Não
"""

def normalize(text):
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode("utf-8")
    return text.lower().replace("'", "").replace("’", "").strip()

# Read actual cities from database/carga-inicial/base_municipios.sql
cities = []
with open('database/carga-inicial/base_municipios.sql', 'r', encoding='utf-8') as f:
    for line in f:
        m = re.search(r"VALUES \('\d+', '([^']+)'", line)
        if m:
            cities.append(m.group(1))

# Custom mapping for some hard ones
custom_map = {
    "Alagoinha": "Alagoinha do Piauí",
    "Alegrete": "Alegrete do Piauí",
    "Alto Longa": "Alto Longá",
    "Angical": "Angical do Piauí",
    "Aroeira do Itaim": "Aroeiras do Itaim",
    "Assunção": "Assunção do Piauí",
    "Barra D’Alcantara": "Barra D'Alcântara",
    "Barreiras": "Barreiras do Piauí",
    "Bela Vista": "Bela Vista do Piauí",
    "Belém": "Belém do Piauí",
    "Betânia": "Betânia do Piauí",
    "Boa Hora": "Boa Hora",
    "Bom Princípio": "Bom Princípio do Piauí",
    "Bonfim": "Bonfim do Piauí",
    "Boqueirão": "Boqueirão do Piauí",
    "Brasileira": "Brasileira",
    "Brejo": "Brejo do Piauí",
    "Cabeceiras": "Cabeceiras do Piauí",
    "Cajazeiras": "Cajazeiras do Piauí",
    "Campinas": "Campinas do Piauí",
    "Campo Alegre Fidalgo": "Campo Alegre do Fidalgo",
    "Campo Grande": "Campo Grande do Piauí",
    "Campo Largo": "Campo Largo do Piauí",
    "Canavieira": "Canavieira",
    "Capitão Campos": "Capitão De Campos",
    "Cap. Gervásio Oliveira": "Capitão Gervásio Oliveira",
    "Caraúbas": "Caraúbas do Piauí",
    "Caridade": "Caridade do Piauí",
    "Conceição do Canindé": "Conceição do Canindé",
    "Coronel José Dias": "Coronel José Dias",
    "Cristalândia": "Cristalândia do Piauí",
    "Domingos Mourão": "Domingos Mourão",
    "Fartura": "Fartura do Piauí",
    "Flores": "Flores do Piauí",
    "Floresta": "Floresta do Piauí",
    "Francinópolis": "Francinópolis",
    "Francisco Aires": "Francisco Ayres",
    "Geminiano": "Geminiano",
    "Guaribas": "Guaribas",
    "Hugo Napoleão": "Hugo Napoleão",
    "Ilha Grande": "Ilha Grande",
    "Ipiranga": "Ipiranga do Piauí",
    "Itainópolis": "Itainópolis",
    "Jacobina": "Jacobina do Piauí",
    "Jardim do Mulato": "Jardim do Mulato",
    "Jatobá": "Jatobá do Piauí",
    "João Costa": "João Costa",
    "Juazeiro": "Juazeiro do Piauí",
    "Lagoa Alegre": "Lagoa Alegre",
    "Lagoa São Francisco": "Lagoa de São Francisco",
    "Lagoinha": "Lagoinha do Piauí",
    "Madeiro": "Madeiro",
    "Massapé": "Massapé do Piauí",
    "Miguel Leão": "Miguel Leão",
    "Milton Brandão": "Milton Brandão",
    "Monte Alegre": "Monte Alegre do Piauí",
    "Morro do Chapéu": "Morro do Chapéu do Piauí",
    "Murici Portelas": "Murici dos Portelas",
    "Nossa Sra Nazaré": "Nossa Senhora de Nazaré",
    "Nossa Sra dos Remédios": "Nossa Senhora dos Remédios",
    "Novo Sto Antônio": "Novo Santo Antônio",
    "Olho D’agua": "Olho D'Água do Piauí",
    "Pajeú": "Pajeú do Piauí",
    "Palmeira": "Palmeira do Piauí",
    "Passagem Franca": "Passagem Franca do Piauí",
    "Patos": "Patos do Piauí",
    "Pau D’Arco": "Pau D'Arco do Piauí",
    "Pavussu": "Pavussu",
    "Pedro Laurentino": "Pedro Laurentino",
    "Porto Alegre": "Porto Alegre do Piauí",
    "Prata": "Prata do Piauí",
    "Redenção Gurgueia": "Redenção do Gurguéia",
    "Riacho Frio": "Riacho Frio",
    "Ribeira": "Ribeira do Piauí",
    "Rio Grande": "Rio Grande do Piauí",
    "Santa Cruz PI": "Santa Cruz do Piauí",
    "Sta Cruz Milagres": "Santa Cruz dos Milagres",
    "Santa Luz": "Santa Luz",
    "Santa Rosa": "Santa Rosa do Piauí",
    "Santana": "Santana do Piauí",
    "Santo Antônio Lisboa": "Santo Antônio de Lisboa",
    "Santo Antônio dos Milagres": "Santo Antônio dos Milagres",
    "Santo Inácio": "Santo Inácio do Piauí",
    "São Braz": "São Braz do Piauí",
    "São Felix": "São Félix do Piauí",
    "São Francisco do PI": "São Francisco do Piauí",
    "São Gonçalo Gurgueia": "São Gonçalo do Gurguéia",
    "São Gonçalo do PI": "São Gonçalo do Piauí",
    "São João Canabrava": "São João da Canabrava",
    "São João Fronteira": "São João da Fronteira",
    "São João Arraial": "São João do Arraial",
    "São José Divino": "São José do Divino",
    "São Lourenço": "São Lourenço do Piauí",
    "São Luís": "São Luis do Piauí",
    "São Miguel Baixa Grande": "São Miguel da Baixa Grande",
    "São Miguel Fidalgo": "São Miguel do Fidalgo",
    "São Pedro": "São Pedro do Piauí",
    "Sebastião Barros": "Sebastião Barros",
    "Sebastião Leal": "Sebastião Leal",
    "Socorro": "Socorro do Piauí",
    "Sussuapara": "Sussuapara",
    "Tamboril": "Tamboril do Piauí",
    "Tanque": "Tanque do Piauí",
    "Valença": "Valença do Piauí",
    "Várzea Branca": "Várzea Branca",
    "Várzea Grande": "Várzea Grande",
    "Vera Mendes": "Vera Mendes",
    "Vila Nova": "Vila Nova do Piauí",
    "Wall Ferraz": "Wall Ferraz"
}

sql_lines = []

for line in raw_data.strip().split('\n'):
    if not line.strip(): continue
    parts = line.split('\t')
    if len(parts) < 2: continue
    
    city_name_raw = parts[0].strip()
    status_raw = parts[1].strip()
    
    status = "SIM" if status_raw.upper() == "SIM" else "NAO"
    
    city_matched = None
    if city_name_raw in custom_map:
        city_matched = custom_map[city_name_raw]
    else:
        for c in cities:
            if normalize(c) == normalize(city_name_raw):
                city_matched = c
                break
        if not city_matched:
            # try fuzzy / startswith
            for c in cities:
                if normalize(c).startswith(normalize(city_name_raw)):
                    city_matched = c
                    break
    
    if city_matched:
        # Avoid escaping single quotes in city names directly unless needed. 
        # PostgreSQL uses '' for escaped quotes.
        safe_city = city_matched.replace("'", "''")
        sql_lines.append(f"UPDATE municipios SET creas_possui = '{status}' WHERE municipio = '{safe_city}';")
    else:
        print("NOT FOUND:", city_name_raw)

with open('database/cargas/creas.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))
    f.write('\n')

print("Gerado database/cargas/creas.sql com sucesso!")
