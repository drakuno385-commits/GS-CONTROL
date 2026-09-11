import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("dadosRelatorioMensal.[...departamentos].sort().map", "dadosRelatorioMensal.departamentos.map")

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Syntax fixed")
