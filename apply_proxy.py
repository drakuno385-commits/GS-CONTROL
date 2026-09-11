import re

FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject useSupabaseSync hook at the top, outside the component
hook_code = """
import { supabase } from '../supabaseClient';

function useSupabaseSync(tableName, initialData = []) {
  const [state, setState] = React.useState(initialData);
  const stateRef = React.useRef(state);
  
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const customSetState = (updater) => {
    let newState = typeof updater === 'function' ? updater(stateRef.current) : updater;
    setState(newState);
    
    // Async sync to Supabase
    setTimeout(async () => {
      try {
        const oldMap = new Map(stateRef.current.map(i => [i.id, i]));
        const newMap = new Map(newState.map(i => [i.id, i]));
        
        const added = newState.filter(i => !oldMap.has(i.id));
        const removed = stateRef.current.filter(i => !newMap.has(i.id));
        const modified = newState.filter(i => {
           const old = oldMap.get(i.id);
           return old && JSON.stringify(old) !== JSON.stringify(i);
        });
        
        if (added.length > 0) {
          const { error } = await supabase.from(tableName).insert(added);
          if (error) console.error("Supabase insert error", tableName, error);
        }
        for (let r of removed) {
          const { error } = await supabase.from(tableName).delete().eq('id', r.id);
          if (error) console.error("Supabase delete error", tableName, error);
        }
        for (let m of modified) {
          // Remove potential frontend-only keys if needed, but here we assume identical
          const { error } = await supabase.from(tableName).update(m).eq('id', m.id);
          if (error) console.error("Supabase update error", tableName, error);
        }
      } catch (e) {
        console.error("Sync error", e);
      }
    }, 0);
  };

  const setFromSupabase = (updater) => {
    let newState = typeof updater === 'function' ? updater(stateRef.current) : updater;
    setState(newState);
  };

  return [state, customSetState, setFromSupabase];
}

"""

# Replace the existing supabase import with the hook
content = re.sub(r"import \{ supabase \} from '\.\./supabaseClient';", hook_code, content)

# 2. Replace useState declarations with useSupabaseSync
replacements = [
    (r"const \[despesas, setDespesas\] = useState\(\[\]\);", r"const [despesas, setDespesas, setDespesasFromDb] = useSupabaseSync('financeiro_despesas', []);"),
    (r"const \[faturas, setFaturas\] = useState\(\[\]\);", r"const [faturas, setFaturas, setFaturasFromDb] = useSupabaseSync('financeiro_faturas', []);"),
    (r"const \[bancosComSaldo, setBancosComSaldo\] = useState\(\[\]\);", r"const [bancosComSaldo, setBancosComSaldo, setBancosComSaldoFromDb] = useSupabaseSync('financeiro_bancos_saldos', []);"),
    (r"const \[entradasRecursos, setEntradasRecursos\] = useState\(\[\]\);", r"const [entradasRecursos, setEntradasRecursos, setEntradasRecursosFromDb] = useSupabaseSync('financeiro_entradas', []);"),
    (r"const \[historicoMovimentacoes, setHistoricoMovimentacoes\] = useState\(\[\]\);", r"const [historicoMovimentacoes, setHistoricoMovimentacoes, setHistoricoMovimentacoesFromDb] = useSupabaseSync('financeiro_historico_bancario', []);")
]

for pat, repl in replacements:
    content = re.sub(pat, repl, content)

# 3. Fix the subagent's useEffect block to use setXXXFromDb
content = content.replace("if (dDespesas) setDespesas(dDespesas);", "if (dDespesas) setDespesasFromDb(dDespesas);")
content = content.replace("if (dFaturas) setFaturas(dFaturas);", "if (dFaturas) setFaturasFromDb(dFaturas);")
content = content.replace("if (dBancosSaldos) setBancosComSaldo(dBancosSaldos);", "if (dBancosSaldos) setBancosComSaldoFromDb(dBancosSaldos);")
content = content.replace("if (dHistorico) setHistoricoMovimentacoes(dHistorico);", "if (dHistorico) setHistoricoMovimentacoesFromDb(dHistorico);")
content = content.replace("if (dEntradas) setEntradasRecursos(dEntradas);", "if (dEntradas) setEntradasRecursosFromDb(dEntradas);")

# Also for realtime subscriptions
content = re.sub(r"(setDespesas)\(prev", r"setDespesasFromDb(prev", content)
content = re.sub(r"(setFaturas)\(prev", r"setFaturasFromDb(prev", content)
content = re.sub(r"(setBancosComSaldo)\(prev", r"setBancosComSaldoFromDb(prev", content)
content = re.sub(r"(setEntradasRecursos)\(prev", r"setEntradasRecursosFromDb(prev", content)
content = re.sub(r"(setHistoricoMovimentacoes)\(prev", r"setHistoricoMovimentacoesFromDb(prev", content)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Proxy hook injected!")
