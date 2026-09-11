import re
import os

FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace useState with localStorage by simple initializations
# We will target each specific state individually to be safe
replacements = [
    (r"const \[faturas, setFaturas\] = useState\(\(\) => \{[\s\S]*?return \[\];\n  \}\);", r"const [faturas, setFaturas] = useState([]);"),
    (r"const \[clientesFaturamento, setClientesFaturamento\] = useState\(\(\) => \{[\s\S]*?return \[\];\n  \}\);", r"const [clientesFaturamento, setClientesFaturamento] = useState([]);"),
    (r"const \[departamentos, setDepartamentos\] = useState\(\(\) => \{[\s\S]*?return DEPARTAMENTOS_PADRAO;\n  \}\);", r"const [departamentos, setDepartamentos] = useState(DEPARTAMENTOS_PADRAO);"),
    (r"const \[bancos, setBancos\] = useState\(\(\) => \{[\s\S]*?return BANCOS_PADRAO;\n  \}\);", r"const [bancos, setBancos] = useState(BANCOS_PADRAO);"),
    (r"const \[empresas, setEmpresas\] = useState\(\(\) => \{[\s\S]*?return EMPRESAS_PADRAO;\n  \}\);", r"const [empresas, setEmpresas] = useState(EMPRESAS_PADRAO);"),
    (r"const \[despesas, setDespesas\] = useState\(\(\) => \{[\s\S]*?return DESPESAS_INICIAIS;\n  \}\);", r"const [despesas, setDespesas] = useState([]);"),
    (r"const \[bancosComSaldo, setBancosComSaldo\] = useState\(\(\) => \{[\s\S]*?return BANCOS_SALDO_PADRAO;\n  \}\);", r"const [bancosComSaldo, setBancosComSaldo] = useState([]);"),
    (r"const \[entradasRecursos, setEntradasRecursos\] = useState\(\(\) => \{[\s\S]*?return \[\];\n  \}\);", r"const [entradasRecursos, setEntradasRecursos] = useState([]);"),
    (r"const \[historicoMovimentacoes, setHistoricoMovimentacoes\] = useState\(\(\) => \{[\s\S]*?return \[\];\n  \}\);", r"const [historicoMovimentacoes, setHistoricoMovimentacoes] = useState([]);"),
    (r"const \[logsAuditoria, setLogsAuditoria\] = useState\(\(\) => \{[\s\S]*?return \[\];\s*\}\s*catch\(e\) \{ return \[\]; \}\n  \}\);", r"const [logsAuditoria, setLogsAuditoria] = useState([]);")
]

for pat, repl in replacements:
    content = re.sub(pat, repl, content)

# 2. Remove useEffects that setItem to localStorage (except activeTab and filtrosPorAba)
use_effect_patterns = [
    r"useEffect\(\(\) => \{\s*try \{\s*localStorage\.setItem\('acoweb_financeiro_faturas_v1'[\s\S]*?\}, \[faturas\]\);\s*",
    r"useEffect\(\(\) => \{\s*try \{\s*localStorage\.setItem\('acoweb_financeiro_clientes_fat_v1'[\s\S]*?\}, \[clientesFaturamento\]\);\s*",
    r"useEffect\(\(\) => \{\s*localStorage\.setItem\('acoweb_financeiro_empresas'[\s\S]*?\}, \[empresas\]\);\s*",
    r"useEffect\(\(\) => \{\s*localStorage\.setItem\('acoweb_financeiro_deptos'[\s\S]*?\}, \[departamentos\]\);\s*",
    r"useEffect\(\(\) => \{\s*localStorage\.setItem\('acoweb_financeiro_bancos'[\s\S]*?\}, \[bancos\]\);\s*",
    r"useEffect\(\(\) => \{\s*try \{\s*localStorage\.setItem\('acoweb_financeiro_despesas_v5'[\s\S]*?\}, \[despesas\]\);\s*",
    r"useEffect\(\(\) => \{\s*try \{\s*localStorage\.setItem\('acoweb_bancos_saldo_v2'[\s\S]*?\}, \[bancosComSaldo\]\);\s*",
    r"useEffect\(\(\) => \{\s*try \{\s*localStorage\.setItem\('acoweb_entradas_recursos_v2'[\s\S]*?\}, \[entradasRecursos\]\);\s*",
    r"useEffect\(\(\) => \{\s*try \{\s*localStorage\.setItem\('acoweb_historico_bancario_v2'[\s\S]*?\}, \[historicoMovimentacoes\]\);\s*",
    r"useEffect\(\(\) => \{\s*try \{\s*localStorage\.setItem\('acoweb_financeiro_auditoria_v1'[\s\S]*?\}, \[logsAuditoria\]\);\s*"
]

for pat in use_effect_patterns:
    content = re.sub(pat, "", content)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("State initialization and useEffects replaced.")
