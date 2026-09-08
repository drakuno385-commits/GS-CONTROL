import json
import pandas as pd

text = open("src/data/previaPostos.js", encoding="utf-8").read().replace("export const defaultPreviaPostos = ", "").strip().rstrip(";")
postos = json.loads(text)

postos_map = {}
for p in postos:
    key = str(p["codcli"]) + "_" + str(p["codpos"]) + "_" + str(p["turno"])
    postos_map[key] = p

def clean_str(s):
    if pd.isna(s): return ""
    s = str(s).strip()
    s = s.replace("AOFORTE", "AÇOFORTE").replace("NAZAR", "NAZARÉ").replace("SO", "SÃO").replace("JOO", "JOÃO")
    s = s.replace("INSPEO", "INSPEÇÃO").replace("ELEVATRIA", "ELEVATÓRIA").replace("GUA", "ÁGUA")
    s = s.replace("RESERVATRIO", "RESERVATÓRIO").replace("TCNICO", "TÉCNICO").replace("", "")
    return s

def get_shift(tipo):
    tipo = str(tipo).upper()
    if "NOT" in tipo or "NOITE" in tipo or "NOTURNO" in tipo: return "NOTURNO"
    return "DIURNO"

max_id = max([p["id"] for p in postos]) if postos else 0

def process_df(df, empresa):
    global max_id
    cols = df.columns
    c_codcli = next(c for c in cols if "codcli" in c.lower())
    c_nomecli = next(c for c in cols if "nomecli" in c.lower())
    c_codpos = next(c for c in cols if "codpos" in c.lower())
    c_nomepos = next(c for c in cols if "nomepos" in c.lower())
    c_escala = next(c for c in cols if "escala" in c.lower())
    c_cargo = next(c for c in cols if "cargo" in c.lower())
    c_tipo = next(c for c in cols if "tipo" in c.lower())
    
    c_mes = next((c for c in cols if ("M" in c.upper() and "S" in c.upper() and "VALOR" in c.upper()) or ("VALOT TOTAL" in c.upper())), None)
    c_unit = next((c for c in cols if "UNIT" in c.upper()), None)
    
    for idx, row in df.iterrows():
        codcli = row[c_codcli]
        codpos = row[c_codpos]
        if pd.isna(codcli) or pd.isna(codpos): continue
        
        turno = get_shift(row[c_tipo])
        key = str(int(codcli)) + "_" + str(int(codpos)) + "_" + turno
        
        if c_mes and not pd.isna(row[c_mes]):
            v_mensal = float(row[c_mes])
        elif c_unit and not pd.isna(row[c_unit]):
            v_mensal = float(row[c_unit])
        else:
            v_mensal = 0.0
            
        v_dia = v_mensal / 30.0
        
        if key in postos_map:
            p = postos_map[key]
            p["produto"] = clean_str(row[c_cargo])
            p["escala"] = clean_str(row[c_escala])
            p["valor_mensal"] = round(v_mensal, 2)
            p["valor_dia"] = round(v_dia, 3)
        else:
            max_id += 1
            postos_map[key] = {
                "id": max_id,
                "codcli": int(codcli),
                "cliente": clean_str(row[c_nomecli]),
                "codpos": int(codpos),
                "posto": clean_str(row[c_nomepos]),
                "turno": turno,
                "filial": 1,
                "empresa": empresa,
                "produto": clean_str(row[c_cargo]),
                "escala": clean_str(row[c_escala]),
                "valor_mensal": round(v_mensal, 2),
                "valor_dia": round(v_dia, 3)
            }

process_df(pd.read_excel(r"C:\Users\User\Desktop\MEDIÇÃO BRA\MEDIÇÃO AÇOFORTE 08.2026.xlsx"), "ACOFORTE")
process_df(pd.read_excel(r"C:\Users\User\Desktop\MEDIÇÃO BRA\MEDIÇÃO BELLS 08.2026.xlsx"), "BELLS")
process_df(pd.read_excel(r"C:\Users\User\Desktop\MEDIÇÃO BRA\MEDIÇÃO REGIONAL 08.2026 .xlsx"), "REGIONAL")

with open("src/data/previaPostos.js", "w", encoding="utf-8") as f:
    f.write("export const defaultPreviaPostos = ")
    json.dump(list(postos_map.values()), f, ensure_ascii=False, indent=2)
    f.write(";\n")
print("Done updated previaPostos.js")

