import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('if (error) console.error("Supabase insert error", tableName, error);', 'if (error) { console.error("Supabase insert error", tableName, error); alert("Erro Insert: " + error.message + "\\nDetalhes: " + error.details); }')
content = content.replace('if (error) console.error("Supabase delete error", tableName, error);', 'if (error) { console.error("Supabase delete error", tableName, error); alert("Erro Delete: " + error.message); }')
content = content.replace('if (error) console.error("Supabase update error", tableName, error);', 'if (error) { console.error("Supabase update error", tableName, error); alert("Erro Update: " + error.message); }')

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Alerts injected!")
