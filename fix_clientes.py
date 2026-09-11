import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the useEffect that auto-syncs clientesCadastrados
# It looks like:
#  // Sincroniza clientes da planilha (App.jsx) com os clientes do faturamento sem duplicar
#  useEffect(() => {
#    if (clientesCadastrados && clientesCadastrados.length > 0) { ... }
#  }, [clientesCadastrados]);

content = re.sub(r'// Sincroniza clientes da planilha.*?\[clientesCadastrados\]\);', '', content, flags=re.DOTALL)

# Fix handleRemoveClienteFat to sync to Supabase
old_remove = '''  const handleRemoveClienteFat = (cliente) => {
    if (!window.confirm(`Tem certeza que deseja remover "${cliente}" da lista de faturamento?`)) return;
    setClientesFaturamento(prev => prev.filter(c => c !== cliente));
  };'''

new_remove = '''  const handleRemoveClienteFat = (cliente) => {
    if (!window.confirm(`Tem certeza que deseja remover "${cliente}" da lista de faturamento?`)) return;
    const novaLista = clientesFaturamento.filter(c => c !== cliente);
    setClientesFaturamento(novaLista);
    supabase.from('financeiro_config').upsert({ chave: 'clientes_fat', valor: novaLista });
  };'''

content = content.replace(old_remove, new_remove)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Clientes sync fixed.")
