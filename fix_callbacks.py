import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix setFaturas([novaFatura, ...faturas]);
content = content.replace('setFaturas([novaFatura, ...faturas]);', 'setFaturas(prev => [novaFatura, ...prev]);')

# Fix faturasAtualizadas
old_faturas_atualizadas = '''    const faturasAtualizadas = faturas.map(f => {
      if (f.id === modalRecebimentoFatura.faturaId) {
        return {
          ...f,
          status: 'Recebido',
          dataRecebimento: formRecebimento.dataPagamento,
          valorRecebido: vTotalRecebido,
          bancoRecebimentoId: modalRecebimentoFatura.bancoDestino
        };
      }
      return f;
    });
    setFaturas(faturasAtualizadas);'''
new_faturas_atualizadas = '''    setFaturas(prev => prev.map(f => {
      if (f.id === modalRecebimentoFatura.faturaId) {
        return {
          ...f,
          status: 'Recebido',
          dataRecebimento: formRecebimento.dataPagamento,
          valorRecebido: vTotalRecebido,
          bancoRecebimentoId: modalRecebimentoFatura.bancoDestino
        };
      }
      return f;
    }));'''
content = content.replace(old_faturas_atualizadas, new_faturas_atualizadas)

# Fix bancosComSaldo em recebimento de fatura
old_bancos = '''    if (bancoObj) {
      setBancosComSaldo(bancosComSaldo.map(b => 
        b.id === modalRecebimentoFatura.bancoDestino 
          ? { ...b, saldoAtual: b.saldoAtual + vTotalRecebido }
          : b
      ));
    }'''
new_bancos = '''    if (bancoObj) {
      setBancosComSaldo(prev => prev.map(b => 
        b.id === modalRecebimentoFatura.bancoDestino 
          ? { ...b, saldoAtual: b.saldoAtual + vTotalRecebido }
          : b
      ));
    }'''
content = content.replace(old_bancos, new_bancos)

# Fix entradas recursos recebimento
content = content.replace('setEntradasRecursos([novaEntrada, ...entradasRecursos]);', 'setEntradasRecursos(prev => [novaEntrada, ...prev]);')

# Fix excluir fatura
content = content.replace('setFaturas(faturas.filter(f => f.id !== id));', 'setFaturas(prev => prev.filter(f => f.id !== id));')

# Fix excluir entrada
old_excluir_entrada = '''    const bancoAtualizado = bancosComSaldo.find(b => b.id === entradaParaExcluir.bancoId);
    if (bancoAtualizado) {
      const novosBancos = bancosComSaldo.map(b => {
        if (b.id === entradaParaExcluir.bancoId) {
          return { ...b, saldoAtual: b.saldoAtual - entradaParaExcluir.valor };
        }
        return b;
      });
      setBancosComSaldo(novosBancos);
    }
    const novasEntradas = entradasRecursos.filter(e => e.id !== id);
    setEntradasRecursos(novasEntradas);'''
new_excluir_entrada = '''    setBancosComSaldo(prev => prev.map(b => {
      if (b.id === entradaParaExcluir.bancoId) {
        return { ...b, saldoAtual: b.saldoAtual - entradaParaExcluir.valor };
      }
      return b;
    }));
    setEntradasRecursos(prev => prev.filter(e => e.id !== id));'''
content = content.replace(old_excluir_entrada, new_excluir_entrada)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced with prev callbacks")
