import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('console.error("Sync error", e);', 'console.error("Sync error", e); alert("Erro critico no Sync: " + e.message);')

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Alerts injected")
