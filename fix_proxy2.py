import re

FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Revert all
content = content.replace("setDespesasFromDb(prev =>", "setDespesas(prev =>")
content = content.replace("setFaturasFromDb(prev =>", "setFaturas(prev =>")
content = content.replace("setBancosComSaldoFromDb(prev =>", "setBancosComSaldo(prev =>")
content = content.replace("setEntradasRecursosFromDb(prev =>", "setEntradasRecursos(prev =>")
content = content.replace("setHistoricoMovimentacoesFromDb(prev =>", "setHistoricoMovimentacoes(prev =>")

# Apply ONLY inside the realtime block
# The realtime block is basically where supabase.channel is.
realtime_block_start = content.find("const channel = supabase.channel('financeiro_changes')")
realtime_block_end = content.find(".subscribe();", realtime_block_start) + len(".subscribe();")

if realtime_block_start != -1 and realtime_block_end != -1:
    realtime_content = content[realtime_block_start:realtime_block_end]
    
    realtime_content = realtime_content.replace("setDespesas(prev =>", "setDespesasFromDb(prev =>")
    realtime_content = realtime_content.replace("setFaturas(prev =>", "setFaturasFromDb(prev =>")
    realtime_content = realtime_content.replace("setBancosComSaldo(prev =>", "setBancosComSaldoFromDb(prev =>")
    realtime_content = realtime_content.replace("setEntradasRecursos(prev =>", "setEntradasRecursosFromDb(prev =>")
    realtime_content = realtime_content.replace("setHistoricoMovimentacoes(prev =>", "setHistoricoMovimentacoesFromDb(prev =>")
    
    content = content[:realtime_block_start] + realtime_content + content[realtime_block_end:]

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted FromDb where needed.")
