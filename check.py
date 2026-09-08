
import pandas as pd
pd.set_option("display.max_columns", None)
pd.set_option("display.width", 1000)
df = pd.read_excel(r"C:\Users\User\Desktop\MEDIÇÃO BRA\MEDIÇÃO REGIONAL 08.2026 .xlsx")
c_unit = next(c for c in df.columns if "UNIT" in c.upper())
c_mes = next(c for c in df.columns if "M" in c.upper() and "S" in c.upper() and "VALOR" in c.upper())

for idx, row in df.iterrows():
    v_u = row[c_unit]
    v_m = row[c_mes]
    if pd.isna(v_u) or pd.isna(v_m): continue
    
    ui_val = (v_u / 30.0) * 31.0
    
    if abs(ui_val - v_m) > 1.0:
        print(f"{row[\"nomepos\"]} | DIAS={row[\"DIAS\"]} | ESCALA={row[\"escala\"]} | UNIT={v_u:.2f} | MES={v_m:.2f} | UI={ui_val:.2f} | DIFF={v_m - ui_val:.2f}")

