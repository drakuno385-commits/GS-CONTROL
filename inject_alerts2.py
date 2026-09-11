import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'if\s*\(\s*error\s*\)\s*console\.error\(\s*"Supabase insert error".*?\);', 'if (error) { console.error("Supabase insert error", tableName, error); alert("Erro Insert: " + error.message + " - " + error.details); }', content)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Alerts injected strictly!")
