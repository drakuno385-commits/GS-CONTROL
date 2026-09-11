import re

FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Update config modifiers
def replace_config_modifier(func_name, state_var, config_key):
    # Find setEmpresas(prev => [...prev, nome]); or similar
    pattern = rf"(set{state_var}\(prev => \[\.\.\.prev, nome\](\.sort\(\))?\);)"
    replacement = f"\\1\n    supabase.from('financeiro_config').upsert({{ chave: '{config_key}', valor: [...{state_var.lower() if state_var != 'ClientesFaturamento' else 'clientesFaturamento'}, nome]{'.sort()' if func_name == 'handleAddClienteFat' else ''} }});"
    return re.sub(pattern, replacement, content)

content = re.sub(r"(setEmpresas\(prev => \[\.\.\.prev, nome\]\);)", r"\1\n    supabase.from('financeiro_config').upsert({ chave: 'empresas', valor: [...empresas, nome] });", content)
content = re.sub(r"(setDepartamentos\(prev => \[\.\.\.prev, nome\]\);)", r"\1\n    supabase.from('financeiro_config').upsert({ chave: 'departamentos', valor: [...departamentos, nome] });", content)
content = re.sub(r"(setBancos\(prev => \[\.\.\.prev, nome\]\);)", r"\1\n    supabase.from('financeiro_config').upsert({ chave: 'bancos', valor: [...bancos, nome] });", content)
content = re.sub(r"(setClientesFaturamento\(prev => \[\.\.\.prev, nome\]\.sort\(\)\);)", r"\1\n    supabase.from('financeiro_config').upsert({ chave: 'clientes_fat', valor: [...clientesFaturamento, nome].sort() });", content)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Configs updated")
