import re

FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

mapper_functions = """
function camelToSnake(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  const snakeObj = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = camelToSnake(obj[key]);
  }
  return snakeObj;
}

function snakeToCamel(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  const camelObj = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = snakeToCamel(obj[key]);
  }
  return camelObj;
}
"""

if "function camelToSnake" not in content:
    content = content.replace("function useSupabaseSync", mapper_functions + "\nfunction useSupabaseSync")

content = content.replace("await supabase.from(tableName).insert(added);", "await supabase.from(tableName).insert(camelToSnake(added));")
content = content.replace("await supabase.from(tableName).update(m).eq('id', m.id);", "await supabase.from(tableName).update(camelToSnake(m)).eq('id', m.id);")

# Also fix the initial load and realtime payload
content = content.replace("setDespesasFromDb(dDespesas);", "setDespesasFromDb(snakeToCamel(dDespesas));")
content = content.replace("setFaturasFromDb(dFaturas);", "setFaturasFromDb(snakeToCamel(dFaturas));")
content = content.replace("setBancosComSaldoFromDb(dBancosSaldos);", "setBancosComSaldoFromDb(snakeToCamel(dBancosSaldos));")
content = content.replace("setHistoricoMovimentacoesFromDb(dHistorico);", "setHistoricoMovimentacoesFromDb(snakeToCamel(dHistorico));")
content = content.replace("setEntradasRecursosFromDb(dEntradas);", "setEntradasRecursosFromDb(snakeToCamel(dEntradas));")

# Realtime payload fixes
content = content.replace("payload.new", "snakeToCamel(payload.new)")

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Mappers injected!")
