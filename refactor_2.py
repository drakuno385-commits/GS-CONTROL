import re

FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Insert the big useEffect for fetching data
use_effect_code = """
  // SUPABASE INITIAL FETCH AND REALTIME
  useEffect(() => {
    const loadData = async () => {
      const { data: dDespesas } = await supabase.from('financeiro_despesas').select('*');
      if (dDespesas) setDespesas(dDespesas);

      const { data: dFaturas } = await supabase.from('financeiro_faturas').select('*');
      if (dFaturas) setFaturas(dFaturas);

      const { data: dBancosSaldos } = await supabase.from('financeiro_bancos_saldos').select('*');
      if (dBancosSaldos) setBancosComSaldo(dBancosSaldos);

      const { data: dHistorico } = await supabase.from('financeiro_historico_bancario').select('*');
      if (dHistorico) setHistoricoMovimentacoes(dHistorico);

      const { data: dEntradas } = await supabase.from('financeiro_entradas').select('*');
      if (dEntradas) setEntradasRecursos(dEntradas);

      const { data: dConfig } = await supabase.from('financeiro_config').select('*');
      if (dConfig) {
        const emp = dConfig.find(c => c.chave === 'empresas');
        if (emp && emp.valor) setEmpresas(emp.valor);
        const dep = dConfig.find(c => c.chave === 'departamentos');
        if (dep && dep.valor) setDepartamentos(dep.valor);
        const bnc = dConfig.find(c => c.chave === 'bancos');
        if (bnc && bnc.valor) setBancos(bnc.valor);
        const cli = dConfig.find(c => c.chave === 'clientes_fat');
        if (cli && cli.valor) setClientesFaturamento(cli.valor);
      }

      const { data: dAuditoria } = await supabase.from('financeiro_auditoria').select('*').order('data', { ascending: false }).limit(1000);
      if (dAuditoria) setLogsAuditoria(dAuditoria);
    };

    loadData();

    const channel = supabase.channel('financeiro_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financeiro_despesas' }, payload => {
        if (payload.eventType === 'INSERT') setDespesas(prev => prev.find(p => p.id === payload.new.id) ? prev : [...prev, payload.new]);
        else if (payload.eventType === 'UPDATE') setDespesas(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        else if (payload.eventType === 'DELETE') setDespesas(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financeiro_faturas' }, payload => {
        if (payload.eventType === 'INSERT') setFaturas(prev => prev.find(p => p.id === payload.new.id) ? prev : [...prev, payload.new]);
        else if (payload.eventType === 'UPDATE') setFaturas(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        else if (payload.eventType === 'DELETE') setFaturas(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financeiro_bancos_saldos' }, payload => {
        if (payload.eventType === 'INSERT') setBancosComSaldo(prev => prev.find(p => p.id === payload.new.id) ? prev : [...prev, payload.new]);
        else if (payload.eventType === 'UPDATE') setBancosComSaldo(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        else if (payload.eventType === 'DELETE') setBancosComSaldo(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financeiro_entradas' }, payload => {
        if (payload.eventType === 'INSERT') setEntradasRecursos(prev => prev.find(p => p.id === payload.new.id) ? prev : [...prev, payload.new]);
        else if (payload.eventType === 'UPDATE') setEntradasRecursos(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        else if (payload.eventType === 'DELETE') setEntradasRecursos(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financeiro_historico_bancario' }, payload => {
        if (payload.eventType === 'INSERT') setHistoricoMovimentacoes(prev => prev.find(p => p.id === payload.new.id) ? prev : [...prev, payload.new]);
        else if (payload.eventType === 'UPDATE') setHistoricoMovimentacoes(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        else if (payload.eventType === 'DELETE') setHistoricoMovimentacoes(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
"""

# Insert after "const userId ="
content = content.replace("const userId = currentUser?.id || currentUser?.username || currentUser?.email || 'usuario_padrao';", use_effect_code + "\n  const userId = currentUser?.id || currentUser?.username || currentUser?.email || 'usuario_padrao';")

# Refactor registrarAuditoria to use supabase
new_auditoria = """  const registrarAuditoria = async (acao, detalhes) => {
    const novoLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      data: new Date().toISOString(),
      usuario: currentUser?.username || currentUser?.email || 'Desconhecido',
      acao,
      detalhes
    };
    setLogsAuditoria(prev => [novoLog, ...prev].slice(0, 1000));
    try {
      await supabase.from('financeiro_auditoria').insert(novoLog);
    } catch(e) { console.error(e); }
  };"""

content = re.sub(r"const registrarAuditoria = \(acao, detalhes\) => \{[\s\S]*?\}\s*\]\.slice\(0, 1000\)\);\s*\};", new_auditoria, content)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Data fetching and Realtime inserted.")
