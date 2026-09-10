import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, PlusCircle, Clock, CheckCircle2, XCircle, FileText, 
  Building, Calendar, CreditCard, Shield, AlertTriangle, Filter, 
  Search, Download, Trash2, Eye, MessageSquare, Check, X, ArrowUpRight,
  TrendingUp, TrendingDown, Layers, Percent, Tag, RefreshCw, Plus, Sparkles,
  Archive, Landmark, CheckCheck, RotateCcw, ArrowRight, Edit2, Send, AlertOctagon,
  ListFilter, Database, BarChart2, Edit, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, ComposedChart, Line 
} from 'recharts';

const EMPRESAS_PADRAO = ['AÇOFORTE', 'LÓGICA', 'BELLS', 'REGIONAL', 'LGA', 'CORRENTE DO SOL', 'CORRENTE SERVIÇOS'];

const DEPARTAMENTOS_PADRAO = [
  'Operacional',
  'RH',
  'Frota',
  'Comercial',
  'TI',
  'Diretoria',
  'Suprimentos',
  'Financeiro',
  'Jurídico'
];

const BANCOS_PADRAO = [
  'Itaú',
  'Bradesco',
  'Banco do Brasil',
  'Santander',
  'Caixa Econômica',
  'Pix / Caixinha'
];

const FORMAS_PAGAMENTO = [
  'Boleto',
  'Pix',
  'Transferência / TED',
  'Cartão de Crédito',
  'Débito Automático',
  'Cheque',
  'Dinheiro / Caixinha'
];

const PRIORIDADES = [
  { value: 'BAIXA', label: 'Baixa', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { value: 'MÉDIA', label: 'Média', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { value: 'ALTA', label: 'Alta', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { value: 'CRÍTICA', label: 'Crítica', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
];

const CONFIG_STATUS_PAGAMENTO = {
  PENDENTE_PAGAMENTO: {
    label: 'Pendente de Pagamento',
    badge: '⏳ Pendente de Pagamento',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)'
  },
  PAGO: {
    label: 'Pago',
    badge: '✓ PAGO',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)'
  },
  PENDENTE_CONCILIACAO: {
    label: 'Pendente de Conciliação',
    badge: '🏦 Pendente de Conciliação',
    color: '#60a5fa',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.4)'
  },
  ARQUIVADO: {
    label: 'Finalizada',
    badge: '✅ Finalizada',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.4)'
  },
  FINALIZADO: {
    label: 'Finalizada',
    badge: '✅ Finalizada',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.4)'
  }
};

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const [y, m, d] = dateStr.split('-');
    if (y && m && d) return `${d}/${m}/${y}`;
  } catch(e){}
  return dateStr;
};

// Helper para calcular a data de vencimento incremental por mês (reparcelamento)
const calcularDataParcela = (vencimentoInicialStr, offsetMeses) => {
  if (!vencimentoInicialStr) return vencimentoInicialStr;
  try {
    const [y, m, d] = vencimentoInicialStr.split('-').map(Number);
    if (!y || !m || !d) return vencimentoInicialStr;

    const targetDate = new Date(y, m - 1 + offsetMeses, 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth(); // 0-indexed
    
    // Trata overflow de dias no mês (ex: 31 de janeiro -> 28 de fevereiro)
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const actualDay = Math.min(d, lastDayOfTargetMonth);

    const mmStr = String(targetMonth + 1).padStart(2, '0');
    const ddStr = String(actualDay).padStart(2, '0');
    return `${targetYear}-${mmStr}-${ddStr}`;
  } catch (e) {
    return vencimentoInicialStr;
  }
};

// Helper para calcular a data da última parcela
const calcularUltimoVencimento = (vencimentoInicialStr, numParcelas) => {
  if (!vencimentoInicialStr) return '-';
  const n = Math.max(1, parseInt(numParcelas, 10) || 1);
  const dataFimStr = calcularDataParcela(vencimentoInicialStr, n - 1);
  return formatDate(dataFimStr);
};

// Formatador de 'YYYY-MM' para extenso (ex: '2026-09' -> 'Setembro / 2026')
const formatarMesExtenso = (anoMes) => {
  if (!anoMes || anoMes.length < 7) return anoMes;
  const [ano, mes] = anoMes.split('-');
  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const idx = parseInt(mes, 10) - 1;
  if (idx >= 0 && idx < 12) {
    return `${nomesMeses[idx]} / ${ano}`;
  }
  return anoMes;
};

// Dados Iniciais cobrindo todas as etapas da esteira financeira (ZERADOS PARA PRODUÇÃO)
const DESPESAS_INICIAIS = [];

export default function Financeiro({ currentUser, subSecaoProp, onSelectSubSecao, clientesCadastrados = [] }) {
  // Estado de Faturas (Módulo Faturamento)
  const [faturas, setFaturas] = useState(() => {
    try {
      const saved = localStorage.getItem('acoweb_financeiro_faturas_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e){}
    return [];
  });

  const [clientesFaturamento, setClientesFaturamento] = useState(() => {
    try {
      const saved = localStorage.getItem('acoweb_financeiro_clientes_fat_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e){}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('acoweb_financeiro_faturas_v1', JSON.stringify(faturas));
    } catch(e){}
  }, [faturas]);

  useEffect(() => {
    try {
      localStorage.setItem('acoweb_financeiro_clientes_fat_v1', JSON.stringify(clientesFaturamento));
    } catch(e){}
  }, [clientesFaturamento]);

  // Sincroniza clientes da planilha (App.jsx) com os clientes do faturamento sem duplicar
  useEffect(() => {
    if (clientesCadastrados && clientesCadastrados.length > 0) {
      setClientesFaturamento(prev => {
        const novos = [...prev];
        let mudou = false;
        clientesCadastrados.forEach(c => {
          if (!novos.includes(c)) {
            novos.push(c);
            mudou = true;
          }
        });
        if (mudou) return novos.sort();
        return prev;
      });
    }
  }, [clientesCadastrados]);

  const [showModalClientesFat, setShowModalClientesFat] = useState(false);
  const [novoClienteFat, setNovoClienteFat] = useState('');

  const handleAddClienteFat = (e) => {
    e.preventDefault();
    if (!novoClienteFat.trim()) return;
    const nome = novoClienteFat.trim().toUpperCase();
    if (clientesFaturamento.includes(nome)) {
      alert("Este cliente já está cadastrado.");
      return;
    }
    setClientesFaturamento(prev => [...prev, nome].sort());
    setNovoClienteFat('');
  };

  const handleRemoveClienteFat = (cliente) => {
    if (!window.confirm(`Tem certeza que deseja remover "${cliente}" da lista de faturamento?`)) return;
    setClientesFaturamento(prev => prev.filter(c => c !== cliente));
  };

  // Estado de Departamentos Customizados
  const [departamentos, setDepartamentos] = useState(() => {
    const saved = localStorage.getItem('acoweb_financeiro_deptos');
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    return DEPARTAMENTOS_PADRAO;
  });

  // Estado de Bancos Customizados
  const [bancos, setBancos] = useState(() => {
    const saved = localStorage.getItem('acoweb_financeiro_bancos');
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    return BANCOS_PADRAO;
  });

  // Estado de Empresas Customizadas
  const [empresas, setEmpresas] = useState(() => {
    const saved = localStorage.getItem('acoweb_financeiro_empresas');
    if (saved) {
      try { return JSON.parse(saved); } catch(e){}
    }
    return EMPRESAS_PADRAO;
  });

  useEffect(() => {
    localStorage.setItem('acoweb_financeiro_empresas', JSON.stringify(empresas));
  }, [empresas]);

  // Garante que as novas empresas padrão entrem na lista de quem já tinha cache antigo
  useEffect(() => {
    setEmpresas(prev => {
      const arrayEmpresas = prev ? [...prev] : [];
      let mudou = false;
      EMPRESAS_PADRAO.forEach(ep => {
        if (!arrayEmpresas.includes(ep)) {
          arrayEmpresas.push(ep);
          mudou = true;
        }
      });
      return mudou ? arrayEmpresas : prev;
    });
  }, []);

  // Salvar customizações no localStorage
  useEffect(() => {
    localStorage.setItem('acoweb_financeiro_deptos', JSON.stringify(departamentos));
  }, [departamentos]);

  useEffect(() => {
    localStorage.setItem('acoweb_financeiro_bancos', JSON.stringify(bancos));
  }, [bancos]);

  // Estado Principal de Despesas
  const [despesas, setDespesas] = useState(() => {
    const saved = localStorage.getItem('acoweb_financeiro_despesas_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch(e){}
    }
    return DESPESAS_INICIAIS;
  });

  // Salvar despesas v5 no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('acoweb_financeiro_despesas_v5', JSON.stringify(despesas));
    } catch(e) {
      console.error('Erro ao salvar despesas no localStorage:', e);
    }
  }, [despesas]);

  // Identificação do Usuário para Isolamento de Filtros e Visualização por Perfil
  const userId = currentUser?.id || currentUser?.username || currentUser?.email || 'usuario_padrao';
  const filterStorageKey = `acoweb_financeiro_filtros_${userId}`;
  const tabStorageKey = `acoweb_financeiro_tab_${userId}`;

  // Helper para verificar permissão individual por sub-aba
  const checkTabAccess = (tabKey) => {
    if (!currentUser) return true;
    if (currentUser.role === 'MASTER') return true;
    if (!currentUser.allowed_screens || currentUser.allowed_screens.length === 0) return true;
    return currentUser.allowed_screens.includes(tabKey);
  };

  // Aba Ativa (Salva por Usuário)
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem(tabStorageKey);
      if (saved) return saved;
    } catch(e){}
    return 'cadastradas';
  });

  useEffect(() => {
    try {
      localStorage.setItem(tabStorageKey, activeTab);
    } catch(e){}
  }, [activeTab, tabStorageKey]);

  // Sub-aba na tela de Relatório Mensal ('fluxo' ou 'consulta')
  const [subTabRelatorio, setSubTabRelatorio] = useState('fluxo');

  // Filtros Independentes por Aba e por Usuário (Nenhum usuário afeta a tela do outro)
  const FILTROS_ESTRUTURA_PADRAO = {
    cadastradas: { empresa: '', departamento: '', busca: '', formaPagamento: '', banco: '', statusPagamento: 'TODOS', mes: '' },
    aguardando: { empresa: '', departamento: '', busca: '', formaPagamento: '', banco: '', statusPagamento: 'TODOS', mes: '' },
    aprovadas: { empresa: '', departamento: '', busca: '', formaPagamento: '', banco: '', statusPagamento: 'TODOS', mes: '' },
    lancadas: { empresa: '', departamento: '', busca: '', formaPagamento: '', banco: '', statusPagamento: 'TODOS', mes: '' },
    pagas: { empresa: '', departamento: '', busca: '', formaPagamento: '', banco: '', statusPagamento: 'TODOS', mes: '' },
    conciliacao: { empresa: '', departamento: '', busca: '', formaPagamento: '', banco: '', statusPagamento: 'TODOS', mes: '' },
    recusadas: { empresa: '', departamento: '', busca: '', formaPagamento: '', banco: '', statusPagamento: 'TODOS', mes: '' },
    relatorio: { empresa: '', departamento: '', busca: '', formaPagamento: '', banco: '', statusPagamento: 'TODOS', mes: '' },
    consulta: { empresa: '', departamento: '', busca: '', formaPagamento: '', banco: '', statusPagamento: 'TODOS', mes: '' }
  };

  const [filtrosPorAba, setFiltrosPorAba] = useState(() => {
    try {
      const saved = localStorage.getItem(filterStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...FILTROS_ESTRUTURA_PADRAO, ...parsed };
        }
      }
    } catch(e){}
    return FILTROS_ESTRUTURA_PADRAO;
  });

  // Salvar alterações de filtro no escopo isolado do Usuário Logado
  useEffect(() => {
    try {
      localStorage.setItem(filterStorageKey, JSON.stringify(filtrosPorAba));
    } catch(e){}
  }, [filtrosPorAba, filterStorageKey]);

  // Obter estado de filtro da aba ativa atual
  const tabChaveAtual = activeTab === 'relatorio' ? (subTabRelatorio === 'consulta' ? 'consulta' : 'relatorio') : activeTab;
  
  const filtroAtual = useMemo(() => {
    return filtrosPorAba[tabChaveAtual] || {
      empresa: '',
      departamento: '',
      busca: '',
      formaPagamento: '',
      banco: '',
      statusPagamento: 'TODOS',
      mes: ''
    };
  }, [filtrosPorAba, tabChaveAtual]);

  const setFiltroAtual = (field, value) => {
    setFiltrosPorAba(prev => ({
      ...prev,
      [tabChaveAtual]: {
        ...(prev[tabChaveAtual] || { empresa: '', departamento: '', busca: '', formaPagamento: '', banco: '', statusPagamento: 'TODOS', mes: '' }),
        [field]: value
      }
    }));
  };

  // Modal de Detalhes ao Clicar nos Cards de KPI de Resumo
  const [modalDetalhesCard, setModalDetalhesCard] = useState(null);

  // Modal de Edição Completa da Despesa Cadastrada (Na Aba 1)
  const [modalEditarDespesa, setModalEditarDespesa] = useState(null);

  // Modais de Cadastro Rápido de Novo Departamento e Novo Banco
  const [showNovoEmpresaModal, setShowNovoEmpresaModal] = useState(false);
  const [novoEmpresaInput, setNovoEmpresaInput] = useState('');

  const [showNovoDeptoModal, setShowNovoDeptoModal] = useState(false);
  const [novoDeptoInput, setNovoDeptoInput] = useState('');

  const [showNovoBancoModal, setShowNovoBancoModal] = useState(false);
  const [novoBancoInput, setNovoBancoInput] = useState('');

  // Modal de Aprovação / Reprovação
  const [modalAprovacao, setModalAprovacao] = useState(null);
  const [obsAprovacaoInput, setObsAprovacaoInput] = useState('');

  // Helper para Visualização / Download de Anexos em PDF
  const abrirPDF = (pdfObj) => {
    if (!pdfObj || !pdfObj.dataUrl) return alert('Nenhum PDF disponível.');
    try {
      const win = window.open('');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${pdfObj.name || 'Visualizador PDF'}</title>
              <meta charset="utf-8" />
            </head>
            <body style="margin:0; background:#0f172a; display:flex; flex-direction:column; height:100vh; color:#fff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <div style="padding:12px 20px; background:#1e293b; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; box-shadow:0 2px 8px rgba(0,0,0,0.3);">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:18px;">📄</span>
                  <div>
                    <div style="font-weight:bold; font-size:14px; color:#f8fafc;">${pdfObj.name || 'Documento Anexo PDF'}</div>
                    <div style="font-size:11px; color:#94a3b8;">Módulo Financeiro — ACOWEB</div>
                  </div>
                </div>
                <a href="${pdfObj.dataUrl}" download="${pdfObj.name || 'documento.pdf'}" style="background:#3b82f6; color:#fff; padding:8px 16px; text-decoration:none; border-radius:8px; font-size:13px; font-weight:bold; display:inline-flex; align-items:center; gap:6px;">
                  ⬇️ Baixar PDF
                </a>
              </div>
              <iframe src="${pdfObj.dataUrl}" style="flex:1; width:100%; border:none;"></iframe>
            </body>
          </html>
        `);
      } else {
        const a = document.createElement('a');
        a.href = pdfObj.dataUrl;
        a.download = pdfObj.name || 'documento.pdf';
        a.click();
      }
    } catch (e) {
      console.error(e);
      window.open(pdfObj.dataUrl, '_blank');
    }
  };

  // Modal de Confirmação de Pagamento com Digitação de Valor Executado e Anexo PDF
  const [modalConfirmarPagamento, setModalConfirmarPagamento] = useState(null);
  const [valorExecutadoInput, setValorExecutadoInput] = useState('');
  const [dataPagamentoInput, setDataPagamentoInput] = useState('');
  const [obsPagamentoInput, setObsPagamentoInput] = useState('');
  const [pdfComprovanteInput, setPdfComprovanteInput] = useState(null);

  // Menu de Árvore Principal do Módulo Financeiro ('fluxo' | 'conciliacao_bancaria')
  const [moduloSubSecao, setModuloSubSecao] = useState(subSecaoProp || 'fluxo');

  useEffect(() => {
    if (subSecaoProp && subSecaoProp !== moduloSubSecao) {
      setModuloSubSecao(subSecaoProp);
    }
  }, [subSecaoProp]);

  const handleMudarSubSecao = (novaSecao) => {
    setModuloSubSecao(novaSecao);
    if (onSelectSubSecao) {
      onSelectSubSecao(novaSecao);
    }
  };

  // Sub-abas da Tela Nova de Conciliação Bancária ('entradas' | 'bancos' | 'extrato')
  const [subTabConciliacao, setSubTabConciliacao] = useState('entradas');

  const [filtrosBancosSaldos, setFiltrosBancosSaldos] = useState({
    empresa: '',
    banco: ''
  });

  // Sub-abas da Tela de Faturamento ('nova' | 'fila' | 'recebidas')
  const [subTabFaturamento, setSubTabFaturamento] = useState('fila');

  // Formulário de Nova Fatura
  const [formNovaFatura, setFormNovaFatura] = useState({
    empresa: '',
    cliente: '',
    numeroNota: '',
    valorBruto: '',
    valorGlosa: '',
    valorImpostos: '',
    valorRetencao: '',
    dataPrevista: new Date().toISOString().slice(0, 10),
    bancoPrevisto: '',
    observacao: ''
  });

  // Filtros do Histórico de Faturamento
  const [filtrosHistoricoFaturas, setFiltrosHistoricoFaturas] = useState({
    empresa: '',
    cliente: '',
    mes: '',
    banco: ''
  });

  // Modal de Recebimento de Fatura
  const [modalRecebimentoFatura, setModalRecebimentoFatura] = useState(null);

  // Modais de Cadastro de Bancos com Saldo e Entradas de Recursos
  const [showModalBancoSaldo, setShowModalBancoSaldo] = useState(false);
  const [formBancoSaldo, setFormBancoSaldo] = useState({
    id: null,
    nome: '',
    empresa: 'AÇOFORTE',
    agencia: '',
    conta: '',
    saldoInicial: '',
    saldoAtual: '',
    cor: '#38bdf8'
  });

  const [showModalEntradaRecursos, setShowModalEntradaRecursos] = useState(false);
  const [formEntradaRecursos, setFormEntradaRecursos] = useState({
    descricao: '',
    valor: '',
    bancoId: '',
    dataEntrada: new Date().toISOString().slice(0, 10),
    categoria: 'Faturamento / Vendas',
    observacao: ''
  });

  // Lista de Bancos com Saldos Reais Cadastrados
  const BANCOS_SALDO_PADRAO = [];

  const [bancosComSaldo, setBancosComSaldo] = useState(() => {
    try {
      const saved = localStorage.getItem('acoweb_bancos_saldo_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e){}
    return BANCOS_SALDO_PADRAO;
  });

  useEffect(() => {
    try {
      localStorage.setItem('acoweb_bancos_saldo_v2', JSON.stringify(bancosComSaldo));
    } catch(e){}
  }, [bancosComSaldo]);

  // Lista de Entradas de Recursos (Receitas / Aportes)
  const [entradasRecursos, setEntradasRecursos] = useState(() => {
    try {
      const saved = localStorage.getItem('acoweb_entradas_recursos_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e){}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('acoweb_entradas_recursos_v2', JSON.stringify(entradasRecursos));
    } catch(e){}
  }, [entradasRecursos]);

  // Histórico de Movimentações Bancárias (Entradas & Abates de Conciliação)
  const [historicoMovimentacoes, setHistoricoMovimentacoes] = useState(() => {
    try {
      const saved = localStorage.getItem('acoweb_historico_bancario_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e){}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('acoweb_historico_bancario_v2', JSON.stringify(historicoMovimentacoes));
    } catch(e){}
  }, [historicoMovimentacoes]);

  // Auditoria do Financeiro
  const [logsAuditoria, setLogsAuditoria] = useState(() => {
    try {
      const saved = localStorage.getItem('acoweb_financeiro_auditoria_v1');
      return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('acoweb_financeiro_auditoria_v1', JSON.stringify(logsAuditoria));
    } catch(e){}
  }, [logsAuditoria]);

  const registrarAuditoria = (acao, detalhes) => {
    const novoLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      data: new Date().toISOString(),
      usuario: currentUser?.username || currentUser?.email || 'Desconhecido',
      acao,
      detalhes
    };
    // Mantém os últimos 1000 registros para não estourar o localStorage
    setLogsAuditoria(prev => [novoLog, ...prev].slice(0, 1000));
  };

  const [showModalAuditoria, setShowModalAuditoria] = useState(false);
  // Formulário de Nova Despesa
  const [formNovaDespesa, setFormNovaDespesa] = useState({
    empresa: 'AÇOFORTE',
    departamento: 'Operacional',
    nome: '',
    valor: '',
    parcelas: '1',
    vencimento: new Date().toISOString().slice(0, 10),
    temOP: false,
    numeroOP: '',
    pdfOP: null,
    banco: 'Itaú Unibanco',
    formaPagamento: 'Boleto',
    prioridade: 'MÉDIA',
    observacao: ''
  });

  // Obter Lista Dinâmica de Meses Disponíveis para o Filtro
  const mesesDisponiveis = useMemo(() => {
    const setMeses = new Set();
    despesas.forEach(d => {
      if (d.vencimento && d.vencimento.length >= 7) {
        setMeses.add(d.vencimento.substring(0, 7));
      }
    });
    const hojeMes = new Date().toISOString().slice(0, 7);
    setMeses.add(hojeMes);
    return Array.from(setMeses).sort();
  }, [despesas]);

  // Adicionar Nova Empresa Rápida
  const handleAdicionarEmpresa = (e) => {
    e.preventDefault();
    const nome = novoEmpresaInput.trim().toUpperCase();
    if (!nome) return;
    if (empresas.some(emp => emp === nome)) {
      alert('Esta empresa já existe na lista.');
      return;
    }
    setEmpresas(prev => [...prev, nome]);
    setFormNovaDespesa(prev => ({ ...prev, empresa: nome }));
    if (modalEditarDespesa) {
      setModalEditarDespesa(prev => ({ ...prev, empresa: nome }));
    }
    if (showModalBancoSaldo) {
      setFormBancoSaldo(prev => ({ ...prev, empresa: nome }));
    }
    setNovoEmpresaInput('');
    // Não fecha o modal para a pessoa poder gerenciar mais se quiser
  };

  const handleExcluirEmpresa = (nome) => {
    if (!window.confirm(`Tem certeza que deseja remover a empresa "${nome}" da lista?`)) return;
    setEmpresas(prev => prev.filter(emp => emp !== nome));
  };

  // Adicionar Novo Departamento Rápido
  const handleAdicionarDepto = (e) => {
    e.preventDefault();
    const nome = novoDeptoInput.trim();
    if (!nome) return;
    if (departamentos.some(d => d.toLowerCase() === nome.toLowerCase())) {
      alert('Este departamento já existe na lista.');
      return;
    }
    setDepartamentos(prev => [...prev, nome]);
    setFormNovaDespesa(prev => ({ ...prev, departamento: nome }));
    if (modalEditarDespesa) {
      setModalEditarDespesa(prev => ({ ...prev, departamento: nome }));
    }
    setNovoDeptoInput('');
    setShowNovoDeptoModal(false);
  };

  // Adicionar Novo Banco Rápido
  const handleAdicionarBanco = (e) => {
    e.preventDefault();
    const nome = novoBancoInput.trim();
    if (!nome) return;
    if (bancos.some(b => b.toLowerCase() === nome.toLowerCase())) {
      alert('Este banco já existe na lista.');
      return;
    }
    setBancos(prev => [...prev, nome]);
    setFormNovaDespesa(prev => ({ ...prev, banco: nome }));
    if (modalEditarDespesa) {
      setModalEditarDespesa(prev => ({ ...prev, banco: nome }));
    }
    setNovoBancoInput('');
    setShowNovoBancoModal(false);
  };

  // Abrir Modal de Edição Completa da Despesa
  const handleAbrirEdicaoCompleta = (item) => {
    setModalEditarDespesa({
      id: item.id,
      empresa: item.empresa || 'AÇOFORTE',
      departamento: item.departamento || 'Operacional',
      nome: item.nome || '',
      valor: item.valor || '',
      parcelas: item.parcelas || 1,
      vencimento: item.vencimento || new Date().toISOString().slice(0, 10),
      temOP: !!item.temOP,
      numeroOP: item.numeroOP || '',
      pdfOP: item.pdfOP || null,
      pdfComprovante: item.pdfComprovante || null,
      banco: item.banco || 'Itaú',
      formaPagamento: item.formaPagamento || 'Boleto',
      prioridade: item.prioridade || 'MÉDIA',
      observacao: item.observacao || ''
    });
  };

  // Salvar Edição Completa da Despesa (Na 1ª Aba)
  const handleSalvarEdicaoCompleta = (e) => {
    e.preventDefault();
    if (!modalEditarDespesa) return;
    if (!modalEditarDespesa.nome.trim()) return alert('Por favor, informe a descrição/nome da despesa.');
    if (!modalEditarDespesa.valor || Number(modalEditarDespesa.valor) <= 0) return alert('Por favor, informe um valor válido para a despesa.');
    if (modalEditarDespesa.temOP && !modalEditarDespesa.numeroOP.trim()) return alert('Por favor, informe o Número da OP.');

    setDespesas(prev => prev.map(d => {
      if (d.id === modalEditarDespesa.id) {
        return {
          ...d,
          empresa: modalEditarDespesa.empresa,
          departamento: modalEditarDespesa.departamento,
          nome: modalEditarDespesa.nome.trim(),
          valor: parseFloat(modalEditarDespesa.valor) || 0,
          parcelas: Math.max(1, parseInt(modalEditarDespesa.parcelas, 10) || 1),
          vencimento: modalEditarDespesa.vencimento,
          temOP: modalEditarDespesa.temOP,
          numeroOP: modalEditarDespesa.temOP ? modalEditarDespesa.numeroOP.trim() : '',
          pdfOP: modalEditarDespesa.temOP ? modalEditarDespesa.pdfOP : null,
          pdfComprovante: modalEditarDespesa.pdfComprovante || null,
          banco: modalEditarDespesa.banco,
          formaPagamento: modalEditarDespesa.formaPagamento,
          prioridade: modalEditarDespesa.prioridade,
          observacao: modalEditarDespesa.observacao.trim()
        };
      }
      return d;
    }));

    registrarAuditoria('EDITAR_DESPESA', `Despesa editada (Geral): ${modalEditarDespesa.nome} | R$ ${modalEditarDespesa.valor}`);
    alert('✅ Despesa cadastrada alterada por completo com sucesso!');
    setModalEditarDespesa(null);
  };

  // Transições da Esteira Financeira
  const handleEnviarParaAprovacao = (id) => {
    setDespesas(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: 'AGUARDANDO_APROVACAO',
          statusPagamento: 'PENDENTE_PAGAMENTO'
        };
      }
      return d;
    }));
    const dFound = despesas.find(x => x.id === id);
    if (dFound) registrarAuditoria('SOLICITAR_APROVACAO', `Solicitada aprovação para: ${dFound.nome}`);
    registrarAuditoria('CADASTRAR_DESPESA', `Nova despesa lançada: ${dFound.nome} | R$ ${dFound.valor} | Empresa: ${dFound.empresa}`);
    alert('🚀 Despesa enviada para a aba "Aguardando Aprovação"! A diretoria/gestor poderá avaliar e aprovar.');
  };

  const handleConfirmarLancamentoBanco = (id) => {
    setDespesas(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: 'LANCADA',
          statusPagamento: 'PENDENTE_PAGAMENTO'
        };
      }
      return d;
    }));
    alert('🏦 Despesa confirmada como Lançada no Banco! Agora está disponível na aba "Lançadas".');
  };

  const handleAbrirConfirmarPagamento = (despesa) => {
    const hoje = new Date().toISOString().slice(0, 10);
    setModalConfirmarPagamento(despesa);
    setValorExecutadoInput(despesa.valorExecutado !== undefined ? String(despesa.valorExecutado) : String(despesa.valor));
    setDataPagamentoInput(despesa.dataPagamento || hoje);
    setObsPagamentoInput(despesa.obsPagamento || '');
    setPdfComprovanteInput(despesa.pdfComprovante || null);
  };

  const handleSalvarConfirmarPagamento = (e) => {
    e.preventDefault();
    if (!modalConfirmarPagamento) return;
    const valExec = parseFloat(valorExecutadoInput);
    if (isNaN(valExec) || valExec < 0) {
      alert('Por favor, digite um valor executado válido.');
      return;
    }

    const hoje = new Date().toISOString().slice(0, 10);
    setDespesas(prev => prev.map(d => {
      if (d.id === modalConfirmarPagamento.id) {
        return {
          ...d,
          statusPagamento: 'PAGO',
          valorExecutado: valExec,
          dataPagamento: dataPagamentoInput || hoje,
          obsPagamento: obsPagamentoInput.trim(),
          pdfComprovante: pdfComprovanteInput || d.pdfComprovante || null
        };
      }
      return d;
    }));

    registrarAuditoria('CONFIRMAR_PAGAMENTO', `Pagamento informado para: ${modalConfirmarPagamento.nome} | Valor Executado: R$ ${valExec}`);

    alert(`✓ Pagamento confirmado com sucesso!\nValor Previsto Original: ${formatMoney(modalConfirmarPagamento.valor)}\nValor Executado Pago: ${formatMoney(valExec)}`);
    setModalConfirmarPagamento(null);
  };

  const handleMarcarComoPaga = (despesaOuId) => {
    if (typeof despesaOuId === 'object' && despesaOuId !== null) {
      handleAbrirConfirmarPagamento(despesaOuId);
    } else {
      const item = despesas.find(d => d.id === despesaOuId);
      if (item) handleAbrirConfirmarPagamento(item);
    }
  };

  const handleEnviarParaConciliacao = (id) => {
    const hoje = new Date().toISOString().slice(0, 10);
    setDespesas(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          statusPagamento: 'PENDENTE_CONCILIACAO',
          dataConciliacao: d.dataConciliacao || hoje
        };
      }
      return d;
    }));
    alert('🏦 Despesa enviada para a aba "Pendente de Conciliação"!');
  };

  const handleConciliarEArquivar = (id) => {
    const hoje = new Date().toISOString().slice(0, 10);
    setDespesas(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          statusPagamento: 'FINALIZADO',
          dataArquivamento: d.dataArquivamento || d.dataFinalizacao || hoje,
          dataFinalizacao: d.dataFinalizacao || d.dataArquivamento || hoje
        };
      }
      return d;
    }));
    alert('✅ Despesa conciliada e finalizada com sucesso!');
  };

  // Handler para Estorno de Despesa de Pagas de volta para Lançadas
  const handleEstornarParaLancadas = (id) => {
    if (!window.confirm('Tem certeza que deseja estornar este pagamento e retornar a despesa para a aba "Lançadas"?')) return;
    setDespesas(prev => prev.map(d => {
      if (d.id === id) {
        const copy = { ...d };
        delete copy.valorExecutado;
        return {
          ...copy,
          status: 'LANCADA',
          statusPagamento: 'PENDENTE_PAGAMENTO',
          dataPagamento: null,
          obsPagamento: ''
        };
      }
      return d;
    }));
    alert('🔄 Despesa estornada com sucesso! Retornou para a aba "Lançadas".');
  };

  // Handler para Reenviar Despesa Recusada/Reprovada para a Tela 1 (Cadastro)
  const handleReenviarParaCadastro = (id) => {
    setDespesas(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: 'CADASTRADA',
          statusPagamento: 'PENDENTE_PAGAMENTO',
          obsAprovacao: ''
        };
      }
      return d;
    }));
    alert('↩️ Despesa reenviada para a aba "Cadastro de Despesas"!');
  };

  // HANDLERS DO MÓDULO DE CONCILIAÇÃO BANCÁRIA & SALDOS

  // 1. Cadastrar / Editar Banco e Saldo
  const handleSalvarBancoSaldo = (e) => {
    e.preventDefault();
    if (!formBancoSaldo.nome.trim()) return alert('Por favor, informe o nome do banco.');
    const sInicial = parseFloat(formBancoSaldo.saldoInicial) || 0;

    if (formBancoSaldo.id) {
      setBancosComSaldo(prev => prev.map(b => {
        if (b.id === formBancoSaldo.id) {
          const difInicial = sInicial - b.saldoInicial;
          return {
            ...b,
            nome: formBancoSaldo.nome.trim(),
            empresa: formBancoSaldo.empresa,
            agencia: formBancoSaldo.agencia.trim(),
            conta: formBancoSaldo.conta.trim(),
            saldoInicial: sInicial,
            saldoAtual: b.saldoAtual + difInicial,
            cor: formBancoSaldo.cor
          };
        }
        return b;
      }));
      alert('✅ Banco e saldo atualizados com sucesso!');
    } else {
      const novo = {
        id: `b_${Date.now()}`,
        nome: formBancoSaldo.nome.trim(),
        empresa: formBancoSaldo.empresa,
        agencia: formBancoSaldo.agencia.trim() || '0001',
        conta: formBancoSaldo.conta.trim() || '00000-0',
        saldoInicial: sInicial,
        saldoAtual: sInicial,
        cor: formBancoSaldo.cor || '#38bdf8'
      };
      setBancosComSaldo(prev => [...prev, novo]);
      alert(`✅ Banco ${novo.nome} cadastrado com saldo inicial de ${formatMoney(sInicial)}!`);
    }

    setShowModalBancoSaldo(false);
    setFormBancoSaldo({ id: null, nome: '', empresa: 'AÇOFORTE', agencia: '', conta: '', saldoInicial: '', saldoAtual: '', cor: '#38bdf8' });
  };

  // Excluir Banco Cadastrado (APENAS USUÁRIO MASTER)
  const handleExcluirBanco = (bancoId, bancoNome) => {
    if (!currentUser || currentUser.role !== 'MASTER') {
      alert('🔒 Apenas usuários com perfil MASTER têm permissão para excluir contas bancárias.');
      return;
    }

    if (window.confirm(`⚠️ AVISO MASTER: Deseja realmente EXCLUIR o banco "${bancoNome}"?\n\nEsta ação removerá o banco e seu saldo da gestão bancária.`)) {
      setBancosComSaldo(prev => prev.filter(b => b.id !== bancoId));
      alert(`✅ Banco "${bancoNome}" excluído com sucesso!`);
    }
  };

  // 2. Cadastrar Entrada de Recursos (Aportes / Receitas)
  const handleCadastrarEntradaRecursos = (e) => {
    e.preventDefault();
    if (!formEntradaRecursos.descricao.trim()) return alert('Informe a descrição da entrada de recursos.');
    const val = parseFloat(formEntradaRecursos.valor);
    if (isNaN(val) || val <= 0) return alert('Informe um valor válido.');
    if (!formEntradaRecursos.bancoId) return alert('Selecione o banco de destino para o crédito.');

    const bancoDestino = bancosComSaldo.find(b => b.id === formEntradaRecursos.bancoId);
    if (!bancoDestino) return alert('Banco de destino não encontrado.');

    const novaEntrada = {
      id: `ent_${Date.now()}`,
      descricao: formEntradaRecursos.descricao.trim(),
      valor: val,
      bancoId: bancoDestino.id,
      bancoNome: bancoDestino.nome,
      dataEntrada: formEntradaRecursos.dataEntrada,
      categoria: formEntradaRecursos.categoria,
      observacao: formEntradaRecursos.observacao.trim()
    };

    setBancosComSaldo(prev => prev.map(b => b.id === bancoDestino.id ? { ...b, saldoAtual: b.saldoAtual + val } : b));
    setEntradasRecursos(prev => [novaEntrada, ...prev]);

    setHistoricoMovimentacoes(prev => [
      {
        id: `mov_${Date.now()}`,
        data: formEntradaRecursos.dataEntrada,
        tipo: 'ENTRADA',
        bancoId: bancoDestino.id,
        bancoNome: bancoDestino.nome,
        descricao: `📥 ${novaEntrada.descricao} (${novaEntrada.categoria})`,
        valor: val,
        saldoResultante: bancoDestino.saldoAtual + val
      },
      ...prev
    ]);

    alert(`🎉 Entrada de ${formatMoney(val)} creditada com sucesso no banco ${bancoDestino.nome}!\nNovo Saldo: ${formatMoney(bancoDestino.saldoAtual + val)}`);
    setShowModalEntradaRecursos(false);
    setFormEntradaRecursos({ descricao: '', valor: '', bancoId: '', dataEntrada: new Date().toISOString().slice(0, 10), categoria: 'Faturamento / Vendas', observacao: '' });
  };

  // 3. Conciliação com Abate Real do Saldo Bancário
  const handleConciliarComAbateSaldo = (despesaId, bancoIdSelecionado) => {
    if (!bancoIdSelecionado) return alert('Por favor, selecione o banco com saldo de onde o valor será descontado.');
    
    const itemDespesa = despesas.find(d => d.id === despesaId);
    if (!itemDespesa) return alert('Despesa não encontrada.');

    const bancoPagador = bancosComSaldo.find(b => b.id === bancoIdSelecionado);
    if (!bancoPagador) return alert('Banco selecionado não encontrado.');

    const valorAbater = itemDespesa.valorExecutado !== undefined ? itemDespesa.valorExecutado : itemDespesa.valor;
    const novoSaldo = bancoPagador.saldoAtual - valorAbater;

    if (novoSaldo < 0) {
      if (!window.confirm(`⚠️ O saldo do banco "${bancoPagador.nome}" ficará NEGATIVO em ${formatMoney(Math.abs(novoSaldo))}.\n\nDeseja confirmar a conciliação e abater mesmo assim?`)) {
        return;
      }
    }

    const hoje = new Date().toISOString().slice(0, 10);

    // Atualizar saldo do banco
    setBancosComSaldo(prev => prev.map(b => b.id === bancoPagador.id ? { ...b, saldoAtual: novoSaldo } : b));

    // Atualizar despesa
    setDespesas(prev => prev.map(d => {
      if (d.id === despesaId) {
        return {
          ...d,
          status: 'FINALIZADO',
          statusPagamento: 'FINALIZADO',
          banco: bancoPagador.nome,
          bancoIdConciliado: bancoPagador.id,
          dataConciliacao: d.dataConciliacao || hoje,
          dataFinalizacao: hoje
        };
      }
      return d;
    }));

    // Registrar histórico
    setHistoricoMovimentacoes(prev => [
      {
        id: `mov_${Date.now()}`,
        data: hoje,
        tipo: 'SAIDA_CONCILIACAO',
        bancoId: bancoPagador.id,
        bancoNome: bancoPagador.nome,
        descricao: `⚖️ Conciliação & Abate Despesa: ${itemDespesa.nome} (${itemDespesa.empresa})`,
        valor: -valorAbater,
        saldoResultante: novoSaldo
      },
      ...prev
    ]);

    alert(`✅ Despesa "${itemDespesa.nome}" conciliar e finalizada com sucesso!\n\n💸 Valor de ${formatMoney(valorAbater)} descontado do banco ${bancoPagador.nome}.\n🏦 NOVO SALDO EM CONTA: ${formatMoney(novoSaldo)}`);
  };

  // Handler de envio do formulário de nova despesa
  const handleCadastrarDespesa = (e) => {
    e.preventDefault();
    if (!formNovaDespesa.nome.trim()) return alert('Por favor, informe a descrição/nome da despesa.');
    if (!formNovaDespesa.valor || Number(formNovaDespesa.valor) <= 0) return alert('Por favor, informe um valor válido para a despesa.');
    if (formNovaDespesa.temOP && !formNovaDespesa.numeroOP.trim()) return alert('Por favor, informe o Número da OP.');

    const numParc = Math.max(1, parseInt(formNovaDespesa.parcelas, 10) || 1);
    const valTotal = parseFloat(formNovaDespesa.valor) || 0;
    
    const valParcelaBase = Math.floor((valTotal / numParc) * 100) / 100;
    const resto = Math.round((valTotal - (valParcelaBase * numParc)) * 100) / 100;

    const grupoId = `grp_${Date.now()}`;
    const novasDespesas = [];

    for (let i = 0; i < numParc; i++) {
      const valorItem = (i === numParc - 1) ? Number((valParcelaBase + resto).toFixed(2)) : valParcelaBase;
      const dataVenc = calcularDataParcela(formNovaDespesa.vencimento, i);
      const nomeItem = numParc > 1 ? `${formNovaDespesa.nome.trim()} (${i + 1}/${numParc})` : formNovaDespesa.nome.trim();

      novasDespesas.push({
        id: `fin_${Date.now()}_${i}_${Math.floor(Math.random()*1000)}`,
        grupoId: grupoId,
        empresa: formNovaDespesa.empresa,
        departamento: formNovaDespesa.departamento,
        nome: nomeItem,
        valorTotalOriginal: valTotal,
        valor: valorItem,
        parcelaNumero: i + 1,
        parcelas: numParc,
        vencimento: dataVenc,
        temOP: formNovaDespesa.temOP,
        numeroOP: formNovaDespesa.temOP ? formNovaDespesa.numeroOP.trim() : '',
        pdfOP: formNovaDespesa.temOP ? formNovaDespesa.pdfOP : null,
        pdfComprovante: null,
        banco: formNovaDespesa.banco,
        formaPagamento: formNovaDespesa.formaPagamento,
        prioridade: formNovaDespesa.prioridade,
        observacao: formNovaDespesa.observacao.trim(),
        status: 'CADASTRADA',
        statusPagamento: 'PENDENTE_PAGAMENTO',
        dataPagamento: null,
        dataConciliacao: null,
        dataArquivamento: null,
        obsAprovacao: '',
        dataCriacao: new Date().toISOString().slice(0, 10)
      });
    }

    setDespesas(prev => [...novasDespesas, ...prev]);
    alert(`✅ Despesa cadastrada com sucesso! ${numParc > 1 ? `Criadas ${numParc} parcelas mensais replicadas automaticamente.` : ''}`);

    setFormNovaDespesa({
      empresa: 'AÇOFORTE',
      departamento: departamentos[0] || 'Operacional',
      nome: '',
      valor: '',
      parcelas: '1',
      vencimento: new Date().toISOString().slice(0, 10),
      temOP: false,
      numeroOP: '',
      pdfOP: null,
      banco: bancos[0] || 'Itaú',
      formaPagamento: 'Boleto',
      prioridade: 'MÉDIA',
      observacao: ''
    });

    setActiveTab('cadastradas');
  };

  const handleConfirmarAnalise = () => {
    if (!modalAprovacao) return;
    const { despesa, acao } = modalAprovacao;

    setDespesas(prev => prev.map(d => {
      if (d.id === despesa.id) {
        return {
          ...d,
          status: acao === 'APROVAR' ? 'APROVADA' : 'RECUSADA',
          obsAprovacao: obsAprovacaoInput.trim()
        };
      }
      return d;
    }));

    const msgAcao = acao === 'APROVAR' ? 'Aprovação' : 'Recusa';
    registrarAuditoria(`AVALIAR_DESPESA`, `${msgAcao} da despesa: ${modalAprovacao.nome} | Motivo: ${obsAprovacaoInput || 'Sem motivo'}`);

    alert(`Despesa ${acao === 'APROVAR' ? 'Aprovada com sucesso e movida para a aba "3. Aprovadas"' : 'Reprovada/Recusada e movida para a aba "7. Recusadas"'}!`);
    setModalAprovacao(null);
    setObsAprovacaoInput('');
  };

  const handleExcluirDespesa = (id) => {
    if (currentUser?.role !== 'MASTER') {
      alert("Acesso Negado: Apenas MASTER pode excluir despesas.");
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir esta despesa permanentemente?')) {
      const d = despesas.find(x => x.id === id);
      setDespesas(prev => prev.filter(x => x.id !== id));
      if (d) registrarAuditoria('EXCLUIR_DESPESA', `Despesa excluída: ${d.nome} | R$ ${d.valor}`);
    }
  };

  const getSituacaoItem = (item) => {
    const hoje = new Date().toISOString().slice(0, 10);
    if (item.status === 'RECUSADA') {
      return { code: 'RECUSADA', label: 'Reprovada / Recusada', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' };
    }
    if (item.statusPagamento === 'PAGO') {
      return { code: 'PAGO', label: '✓ Pago', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' };
    }
    if (item.statusPagamento === 'PENDENTE_CONCILIACAO') {
      return { code: 'PENDENTE_CONCILIACAO', label: '🏦 Pendente Conciliação', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)' };
    }
    if (item.statusPagamento === 'ARQUIVADO' || item.statusPagamento === 'FINALIZADO') {
      return { code: 'FINALIZADO', label: '✅ Finalizada', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' };
    }

    if (item.vencimento && item.vencimento < hoje) {
      return { code: 'VENCIDA', label: '🚨 VENCIDA', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.25)', border: '#f87171' };
    }
    return { code: 'A_VENCER', label: '⏳ A Vencer', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' };
  };

  // Estatísticas Globais & Resumo por Mês (Balanço Mensal - Sempre Globais e Não Contaminadas por Filtros de Abas)
  const estatisticas = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    const despesasEscopo = despesas;

    const cadastradas = despesasEscopo.filter(d => d.status === 'CADASTRADA');
    const aguardando = despesasEscopo.filter(d => d.status === 'AGUARDANDO_APROVACAO');
    const aprovadas = despesasEscopo.filter(d => d.status === 'APROVADA');
    const lancadas = despesasEscopo.filter(d => d.status === 'LANCADA' && d.statusPagamento !== 'PAGO' && d.statusPagamento !== 'PENDENTE_CONCILIACAO' && d.statusPagamento !== 'ARQUIVADO' && d.statusPagamento !== 'FINALIZADO');
    const pagas = despesasEscopo.filter(d => d.statusPagamento === 'PAGO');
    const conciliacao = despesasEscopo.filter(d => d.statusPagamento === 'PENDENTE_CONCILIACAO');
    const recusadas = despesasEscopo.filter(d => d.status === 'RECUSADA');
    const arquivadas = despesasEscopo.filter(d => d.statusPagamento === 'ARQUIVADO' || d.statusPagamento === 'FINALIZADO');

    const emAberto = despesasEscopo.filter(d => d.status !== 'RECUSADA' && (!d.statusPagamento || d.statusPagamento === 'PENDENTE_PAGAMENTO'));
    const vencidas = emAberto.filter(d => d.vencimento && d.vencimento < hoje);
    const aVencer = emAberto.filter(d => !d.vencimento || d.vencimento >= hoje);

    return {
      totalGeral: despesasEscopo.length,
      countCadastradas: cadastradas.length,
      valorCadastradas: cadastradas.reduce((a, b) => a + b.valor, 0),
      countAguardando: aguardando.length,
      valorAguardando: aguardando.reduce((a, b) => a + b.valor, 0),
      countAprovadas: aprovadas.length,
      valorAprovadas: aprovadas.reduce((a, b) => a + b.valor, 0),
      countLancadas: lancadas.length,
      valorLancadas: lancadas.reduce((a, b) => a + b.valor, 0),
      countPagas: pagas.length,
      valorPagas: pagas.reduce((a, b) => a + (b.valorExecutado !== undefined ? b.valorExecutado : b.valor), 0),
      countConciliacao: conciliacao.length,
      valorConciliacao: conciliacao.reduce((a, b) => a + (b.valorExecutado !== undefined ? b.valorExecutado : b.valor), 0),
      countRecusadas: recusadas.length,
      valorRecusadas: recusadas.reduce((a, b) => a + b.valor, 0),
      countArquivadas: arquivadas.length,
      valorArquivadas: arquivadas.reduce((a, b) => a + (b.valorExecutado !== undefined ? b.valorExecutado : b.valor), 0),

      countEmAberto: emAberto.length,
      valorEmAberto: emAberto.reduce((a, b) => a + b.valor, 0),
      countVencidas: vencidas.length,
      valorVencidas: vencidas.reduce((a, b) => a + b.valor, 0),
      countAVencer: aVencer.length,
      valorAVencer: aVencer.reduce((a, b) => a + b.valor, 0),

      // Listas de itens para abertura no modal ao clicar nos KPI Cards
      listaVencidas: vencidas,
      listaAVencer: aVencer,
      listaEmAberto: emAberto,
      listaPagas: pagas,
      listaAguardando: aguardando,
      listaConciliacaoEArquivo: [...conciliacao, ...arquivadas]
    };
  }, [despesas]);

  // Lista Filtrada para a Aba Ativa da Tabela Principal
  const listaExibicao = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    const { mes, statusPagamento, empresa, departamento, formaPagamento, banco, busca } = filtroAtual;

    return despesas.filter(d => {
      if (activeTab === 'cadastradas') {
        if (d.status !== 'CADASTRADA') return false;
      }
      
      if (activeTab === 'aguardando') {
        if (d.status !== 'AGUARDANDO_APROVACAO') return false;
      }

      if (activeTab === 'aprovadas') {
        if (d.status !== 'APROVADA') return false;
      }

      if (activeTab === 'lancadas') {
        if (d.status !== 'LANCADA' || d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO' || d.statusPagamento === 'FINALIZADO') return false;
      }
      
      if (activeTab === 'pagas') {
        if (d.statusPagamento !== 'PAGO') return false;
      }

      if (activeTab === 'conciliacao') {
        if (d.statusPagamento !== 'PENDENTE_CONCILIACAO') return false;
      }

      if (activeTab === 'recusadas') {
        if (d.status !== 'RECUSADA') return false;
      }

      if (mes) {
        if (!d.vencimento || !d.vencimento.startsWith(mes)) return false;
      }

      if (statusPagamento && statusPagamento !== 'TODOS') {
        if (statusPagamento === 'VENCIDA') {
          if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO' || d.statusPagamento === 'FINALIZADO' || !d.vencimento || d.vencimento >= hoje) return false;
        } else if (statusPagamento === 'A_VENCER') {
          if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO' || d.statusPagamento === 'FINALIZADO' || (d.vencimento && d.vencimento < hoje)) return false;
        } else if (d.statusPagamento !== statusPagamento) {
          return false;
        }
      }

      if (empresa && d.empresa !== empresa) return false;
      if (departamento && d.departamento !== departamento) return false;
      if (formaPagamento && d.formaPagamento !== formaPagamento) return false;
      if (banco && d.banco !== banco) return false;
      
      if (busca) {
        const term = busca.toLowerCase();
        const matchNome = (d.nome || '').toLowerCase().includes(term);
        const matchOP = (d.numeroOP || '').toLowerCase().includes(term);
        const matchObs = (d.observacao || '').toLowerCase().includes(term);
        const matchEmpresa = (d.empresa || '').toLowerCase().includes(term);
        const matchDepto = (d.departamento || '').toLowerCase().includes(term);
        if (!matchNome && !matchOP && !matchObs && !matchEmpresa && !matchDepto) return false;
      }

      return true;
    });
  }, [despesas, activeTab, filtroAtual]);

  // Lista para a Consulta Geral de TODAS as Despesas (Na Aba de Relatório)
  const listaConsultaGeral = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    const { mes, statusPagamento, empresa, departamento, formaPagamento, banco, busca } = filtroAtual;

    return despesas.filter(d => {
      if (mes) {
        if (!d.vencimento || !d.vencimento.startsWith(mes)) return false;
      }

      if (statusPagamento && statusPagamento !== 'TODOS') {
        if (statusPagamento === 'VENCIDA') {
          if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO' || d.statusPagamento === 'FINALIZADO' || !d.vencimento || d.vencimento >= hoje) return false;
        } else if (statusPagamento === 'A_VENCER') {
          if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO' || d.statusPagamento === 'FINALIZADO' || (d.vencimento && d.vencimento < hoje)) return false;
        } else if (d.statusPagamento !== statusPagamento) {
          return false;
        }
      }

      if (empresa && d.empresa !== empresa) return false;
      if (departamento && d.departamento !== departamento) return false;
      if (formaPagamento && d.formaPagamento !== formaPagamento) return false;
      if (banco && d.banco !== banco) return false;

      if (busca) {
        const term = busca.toLowerCase();
        const matchNome = (d.nome || '').toLowerCase().includes(term);
        const matchOP = (d.numeroOP || '').toLowerCase().includes(term);
        const matchObs = (d.observacao || '').toLowerCase().includes(term);
        const matchEmpresa = (d.empresa || '').toLowerCase().includes(term);
        const matchDepto = (d.departamento || '').toLowerCase().includes(term);
        if (!matchNome && !matchOP && !matchObs && !matchEmpresa && !matchDepto) return false;
      }

      return true;
    });
  }, [despesas, filtroAtual]);

  // Relatório Mensal Comparativo (Com mesFormatado "NomeMês / Ano" para o Gráfico de Colunas)
  const dadosRelatorioMensal = useMemo(() => {
    const mapMeses = {};

    despesas.forEach(d => {
      if (d.status === 'RECUSADA') return;
      const mesChave = (d.vencimento || d.dataCriacao || '').substring(0, 7);
      if (!mesChave) return;

      if (!mapMeses[mesChave]) {
        const mesFormatado = formatarMesExtenso(mesChave); // Ex: "Setembro / 2026"
        mapMeses[mesChave] = { mes: mesChave, mesFormatado, pago: 0, pendente: 0, total: 0 };
      }

      if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO' || d.statusPagamento === 'FINALIZADO') {
        const valExec = d.valorExecutado !== undefined ? d.valorExecutado : d.valor;
        mapMeses[mesChave].pago += valExec;
      } else {
        mapMeses[mesChave].pendente += d.valor;
      }
      mapMeses[mesChave].total += (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO' || d.statusPagamento === 'FINALIZADO') ? (d.valorExecutado !== undefined ? d.valorExecutado : d.valor) : d.valor;
    });

    const listaMeses = Object.values(mapMeses).sort((a, b) => a.mes.localeCompare(b.mes));

    // Totais por Empresa
    const mapEmpresa = {};
    empresas.forEach(emp => { mapEmpresa[emp] = { empresa: emp, pago: 0, pendente: 0, total: 0, listaPago: [], listaPendente: [], listaTotal: [] }; });

    despesas.forEach(d => {
      if (d.status === 'RECUSADA') return;
      const emp = d.empresa || 'OUTROS';
      if (!mapEmpresa[emp]) mapEmpresa[emp] = { empresa: emp, pago: 0, pendente: 0, total: 0, listaPago: [], listaPendente: [], listaTotal: [] };

      if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO' || d.statusPagamento === 'FINALIZADO') {
        const valExec = d.valorExecutado !== undefined ? d.valorExecutado : d.valor;
        mapEmpresa[emp].pago += valExec;
        mapEmpresa[emp].listaPago.push(d);
        mapEmpresa[emp].total += valExec;
      } else {
        mapEmpresa[emp].pendente += d.valor;
        mapEmpresa[emp].listaPendente.push(d);
        mapEmpresa[emp].total += d.valor;
      }
      mapEmpresa[emp].listaTotal.push(d);
    });

    // Totais por Departamento
    const mapDepto = {};
    departamentos.forEach(dep => { mapDepto[dep] = { departamento: dep, pago: 0, pendente: 0, total: 0, listaPago: [], listaPendente: [], listaTotal: [] }; });

    despesas.forEach(d => {
      if (d.status === 'RECUSADA') return;
      const dep = d.departamento || 'OUTROS';
      if (!mapDepto[dep]) mapDepto[dep] = { departamento: dep, pago: 0, pendente: 0, total: 0, listaPago: [], listaPendente: [], listaTotal: [] };

      if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO' || d.statusPagamento === 'FINALIZADO') {
        const valExec = d.valorExecutado !== undefined ? d.valorExecutado : d.valor;
        mapDepto[dep].pago += valExec;
        mapDepto[dep].listaPago.push(d);
        mapDepto[dep].total += valExec;
      } else {
        mapDepto[dep].pendente += d.valor;
        mapDepto[dep].listaPendente.push(d);
        mapDepto[dep].total += d.valor;
      }
      mapDepto[dep].listaTotal.push(d);
    });

    return {
      meses: listaMeses,
      empresas: Object.values(mapEmpresa),
      departamentos: Object.values(mapDepto).filter(d => d.total > 0)
    };
  }, [despesas, departamentos]);

  const exportarExtratoCSV = () => {
    const headers = ['Data', 'Tipo', 'Banco', 'Descrição da Movimentação', 'Valor (R$)', 'Saldo Resultante (R$)'];
    const rows = historicoMovimentacoes.map(mov => [
      formatDate(mov.data),
      mov.tipo === 'ENTRADA' ? 'ENTRADA' : 'ABATE CONCILIACAO',
      `"${mov.bancoNome || ''}"`,
      `"${(mov.descricao || '').replace(/"/g, '""')}"`,
      mov.valor.toFixed(2),
      mov.saldoResultante.toFixed(2)
    ]);
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `extrato_movimentacoes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função Geradora de CSV por Filtro Específico (Exporta todas as despesas por padrão, respeitando filtros ativos)
  const exportarCSVGenerico = (filtroTipo) => {
    let dadosFiltrados = despesas;
    let nomeArquivo = 'relatorio_financeiro_despesas';

    if (filtroTipo === 'PAGAS') {
      dadosFiltrados = despesas.filter(d => d.statusPagamento === 'PAGO');
      nomeArquivo = 'despesas_pagas';
    } else if (filtroTipo === 'PENDENTES_PAGAMENTO') {
      dadosFiltrados = despesas.filter(d => (d.statusPagamento || 'PENDENTE_PAGAMENTO') === 'PENDENTE_PAGAMENTO' && d.status !== 'RECUSADA');
      nomeArquivo = 'despesas_pendentes_pagamento';
    } else if (filtroTipo === 'PENDENTES_CONCILIACAO') {
      dadosFiltrados = despesas.filter(d => d.statusPagamento === 'PENDENTE_CONCILIACAO');
      nomeArquivo = 'despesas_pendentes_conciliacao';
    } else if (filtroTipo === 'ARQUIVADAS' || filtroTipo === 'FINALIZADAS') {
      dadosFiltrados = despesas.filter(d => d.statusPagamento === 'ARQUIVADO' || d.statusPagamento === 'FINALIZADO');
      nomeArquivo = 'despesas_finalizadas';
    } else if (filtroTipo === 'AGUARDANDO_APROVACAO') {
      dadosFiltrados = despesas.filter(d => d.status === 'AGUARDANDO_APROVACAO');
      nomeArquivo = 'despesas_aguardando_aprovacao';
    } else if (filtroTipo === 'APROVADAS') {
      dadosFiltrados = despesas.filter(d => d.status === 'APROVADA');
      nomeArquivo = 'despesas_aprovadas';
    } else if (filtroTipo === 'RECUSADAS') {
      dadosFiltrados = despesas.filter(d => d.status === 'RECUSADA');
      nomeArquivo = 'despesas_recusadas';
    } else if (filtroTipo === 'CADASTRADA') {
      dadosFiltrados = despesas.filter(d => d.status === 'CADASTRADA');
      nomeArquivo = 'despesas_cadastradas';
    }

    // Aplicar filtros ativos da aba/usuário se houver
    const { mes, statusPagamento, empresa, departamento, formaPagamento, banco, busca } = filtroAtual || {};
    const hoje = new Date().toISOString().slice(0, 10);

    if (mes) {
      dadosFiltrados = dadosFiltrados.filter(d => d.vencimento && d.vencimento.startsWith(mes));
      nomeArquivo += `_${mes}`;
    }
    if (empresa) {
      dadosFiltrados = dadosFiltrados.filter(d => d.empresa === empresa);
    }
    if (departamento) {
      dadosFiltrados = dadosFiltrados.filter(d => d.departamento === departamento);
    }
    if (formaPagamento) {
      dadosFiltrados = dadosFiltrados.filter(d => d.formaPagamento === formaPagamento);
    }
    if (banco) {
      dadosFiltrados = dadosFiltrados.filter(d => d.banco === banco);
    }
    if (statusPagamento && statusPagamento !== 'TODOS') {
      if (statusPagamento === 'VENCIDA') {
        dadosFiltrados = dadosFiltrados.filter(d => d.statusPagamento !== 'PAGO' && d.statusPagamento !== 'PENDENTE_CONCILIACAO' && d.statusPagamento !== 'ARQUIVADO' && d.statusPagamento !== 'FINALIZADO' && d.vencimento && d.vencimento < hoje);
      } else if (statusPagamento === 'A_VENCER') {
        dadosFiltrados = dadosFiltrados.filter(d => d.statusPagamento !== 'PAGO' && d.statusPagamento !== 'PENDENTE_CONCILIACAO' && d.statusPagamento !== 'ARQUIVADO' && d.statusPagamento !== 'FINALIZADO' && (!d.vencimento || d.vencimento >= hoje));
      } else {
        dadosFiltrados = dadosFiltrados.filter(d => d.statusPagamento === statusPagamento);
      }
    }
    if (busca) {
      const term = busca.toLowerCase();
      dadosFiltrados = dadosFiltrados.filter(d => {
        const matchNome = (d.nome || '').toLowerCase().includes(term);
        const matchOP = (d.numeroOP || '').toLowerCase().includes(term);
        const matchObs = (d.observacao || '').toLowerCase().includes(term);
        const matchEmpresa = (d.empresa || '').toLowerCase().includes(term);
        const matchDepto = (d.departamento || '').toLowerCase().includes(term);
        return matchNome || matchOP || matchObs || matchEmpresa || matchDepto;
      });
    }

    const headers = ['ID', 'Empresa', 'Departamento', 'Descrição Despesa', 'Valor Previsto (R$)', 'Valor Executado (R$)', 'Diferença (R$)', 'Parcela', 'Total Parcelas', 'Vencimento', 'Último Vencimento Est.', 'Tem OP', 'Num OP', 'Banco', 'Forma Pagamento', 'Prioridade', 'Status Etapa', 'Status Pagamento', 'Data Pagamento', 'Data Conciliação', 'Data Finalização', 'Obs Cadastro', 'Obs Análise', 'Obs Pagamento'];
    
    const rows = dadosFiltrados.map(item => {
      const valExec = item.valorExecutado !== undefined ? item.valorExecutado : item.valor;
      const dif = item.valorExecutado !== undefined ? (item.valorExecutado - item.valor) : 0;
      return [
        item.id,
        `"${item.empresa || ''}"`,
        `"${item.departamento || ''}"`,
        `"${item.nome || ''}"`,
        item.valor.toFixed(2),
        valExec.toFixed(2),
        dif.toFixed(2),
        item.parcelaNumero || 1,
        item.parcelas || 1,
        item.vencimento,
        calcularUltimoVencimento(item.vencimento, item.parcelas || 1),
        item.temOP ? 'SIM' : 'NÃO',
        `"${item.numeroOP || ''}"`,
        `"${item.banco || ''}"`,
        `"${item.formaPagamento || ''}"`,
        item.prioridade,
        item.status,
        CONFIG_STATUS_PAGAMENTO[item.statusPagamento || 'PENDENTE_PAGAMENTO']?.label || item.statusPagamento,
        item.dataPagamento || '-',
        item.dataConciliacao || '-',
        item.dataFinalizacao || item.dataArquivamento || '-',
        `"${item.observacao || ''}"`,
        `"${item.obsAprovacao || ''}"`,
        `"${item.obsPagamento || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCadastrarFatura = (e) => {
    e.preventDefault();
    if (!formNovaFatura.cliente || !formNovaFatura.numeroNota || !formNovaFatura.valorBruto) return;
    
    const vBruto = parseFloat(formNovaFatura.valorBruto.replace(',', '.'));
    const vGlosa = formNovaFatura.valorGlosa ? parseFloat(formNovaFatura.valorGlosa.replace(',', '.')) : 0;
    const vImp = formNovaFatura.valorImpostos ? parseFloat(formNovaFatura.valorImpostos.replace(',', '.')) : 0;
    const vRet = formNovaFatura.valorRetencao ? parseFloat(formNovaFatura.valorRetencao.replace(',', '.')) : 0;
    const vReceber = vBruto - vGlosa - vImp - vRet;

    const novaFatura = {
      id: `fat_${Date.now()}`,
      empresa: formNovaFatura.empresa,
      cliente: formNovaFatura.cliente,
      numeroNota: formNovaFatura.numeroNota,
      valorBruto: vBruto,
      valorGlosa: vGlosa,
      valorImpostos: vImp,
      valorRetencao: vRet,
      valorReceber: vReceber,
      dataPrevista: formNovaFatura.dataPrevista,
      bancoPrevistoId: formNovaFatura.bancoPrevisto,
      observacao: formNovaFatura.observacao,
      status: 'pendente', // pendente | recebida
      criadaEm: new Date().toISOString()
    };

    setFaturas([novaFatura, ...faturas]);
    registrarAuditoria('CADASTRAR_FATURA', `Fatura gerada: NFe ${novaFatura.numeroNota} | Cliente: ${novaFatura.cliente} | R$ ${vReceber}`);
    setSubTabFaturamento('fila');
    setFormNovaFatura({
      empresa: '',
      cliente: '',
      numeroNota: '',
      valorBruto: '',
      valorGlosa: '',
      valorImpostos: '',
      valorRetencao: '',
      dataPrevista: new Date().toISOString().slice(0, 10),
      bancoPrevisto: '',
      observacao: ''
    });
    alert('Fatura cadastrada com sucesso!');
  };

  const handleReceberFatura = (e) => {
    e.preventDefault();
    if (!modalRecebimentoFatura || !modalRecebimentoFatura.bancoDestino || !modalRecebimentoFatura.valorRecebido) return;
    
    const vRecebido = parseFloat(modalRecebimentoFatura.valorRecebido.replace(',', '.'));
    const faturaId = modalRecebimentoFatura.id;
    const faturaInfo = faturas.find(f => f.id === faturaId);
    
    if (!faturaInfo) return;

    if (vRecebido < faturaInfo.valorReceber) {
      if (!window.confirm(`Atenção: O valor recebido (R$ ${vRecebido.toLocaleString('pt-BR', {minimumFractionDigits:2})}) é MENOR que o valor líquido esperado (R$ ${faturaInfo.valorReceber.toLocaleString('pt-BR', {minimumFractionDigits:2})}). Deseja prosseguir com o recebimento parcial/com desconto?`)) {
        return;
      }
    }

    // Atualiza status da fatura
    const faturasAtualizadas = faturas.map(f => {
      if (f.id === faturaId) {
        return {
          ...f,
          status: 'recebida',
          valorRecebido: vRecebido,
          bancoRecebimentoId: modalRecebimentoFatura.bancoDestino,
          dataRecebimento: modalRecebimentoFatura.dataRecebimento
        };
      }
      return f;
    });
    setFaturas(faturasAtualizadas);

    // Atualiza saldo do banco
    const bancoObj = bancosComSaldo.find(b => b.id === modalRecebimentoFatura.bancoDestino);
    if (bancoObj) {
      setBancosComSaldo(bancosComSaldo.map(b => 
        b.id === modalRecebimentoFatura.bancoDestino 
        ? { ...b, saldoAtual: b.saldoAtual + vRecebido }
        : b
      ));
    }

    // Registra entrada de recursos na conciliação para rastreabilidade e histórico
    const novaEntrada = {
      id: `ent_fat_${Date.now()}`,
      descricao: `Recebimento NFe ${faturaInfo.numeroNota} - ${faturaInfo.cliente}`,
      valor: vRecebido,
      bancoId: modalRecebimentoFatura.bancoDestino,
      bancoNome: bancoObj ? bancoObj.nome : 'Banco Desconhecido',
      dataEntrada: modalRecebimentoFatura.dataRecebimento,
      categoria: 'Faturamento / Vendas',
      observacao: `Automático via Faturamento NFe ${faturaInfo.numeroNota}`
    };
    setEntradasRecursos([novaEntrada, ...entradasRecursos]);

    setHistoricoMovimentacoes([
      {
        id: `hist_${Date.now()}_fat`,
        dataStr: new Date(modalRecebimentoFatura.dataRecebimento).toISOString(),
        tipo: 'ENTRADA',
        descricao: `Recebimento Fatura NFe ${faturaInfo.numeroNota}`,
        valor: vRecebido,
        banco: bancoObj ? bancoObj.nome : 'Banco Desconhecido'
      },
      ...historicoMovimentacoes
    ]);

    registrarAuditoria('RECEBER_FATURA', `Recebimento NFe ${faturaInfo.numeroNota} | Valor: R$ ${vRecebido} | Banco: ${bancoObj?.nome || 'Desc'}`);

    setModalRecebimentoFatura(null);
    alert('Fatura recebida e saldo atualizado com sucesso!');
  };

  const handleDeleteFatura = (id) => {
    if (currentUser?.role !== 'MASTER') {
      alert("Acesso Negado: Apenas MASTER pode excluir faturas.");
      return;
    }
    if (!window.confirm("Deseja realmente excluir esta fatura? Se ela já foi recebida, o saldo NÃO será estornado automaticamente do banco.")) return;
    const fatParaExcluir = faturas.find(f => f.id === id);
    setFaturas(faturas.filter(f => f.id !== id));
    if (fatParaExcluir) registrarAuditoria('EXCLUIR_FATURA', `Fatura NFe ${fatParaExcluir.numeroNota} do cliente ${fatParaExcluir.cliente} excluída.`);
  };

  const handleDeleteEntrada = (id) => {
    if (currentUser?.role !== 'MASTER') {
      alert("Acesso Negado: Apenas MASTER pode excluir entradas de recursos.");
      return;
    }
    if (!window.confirm("Deseja realmente excluir esta entrada de recursos? O saldo do banco será recalculado subtraindo este valor.")) return;
    
    const entradaParaExcluir = entradasRecursos.find(e => e.id === id);
    if (!entradaParaExcluir) return;

    // Atualiza o saldo do banco (subtrai o valor que havia sido adicionado)
    const bancoAtualizado = bancosComSaldo.find(b => b.id === entradaParaExcluir.bancoId);
    if (bancoAtualizado) {
      const novosBancos = bancosComSaldo.map(b => {
        if (b.id === entradaParaExcluir.bancoId) {
          return { ...b, saldoAtual: b.saldoAtual - entradaParaExcluir.valor };
        }
        return b;
      });
      setBancosComSaldo(novosBancos);
    }

    // Exclui a entrada
    const novasEntradas = entradasRecursos.filter(e => e.id !== id);
    setEntradasRecursos(novasEntradas);

    // Registra no histórico (opcional, mas bom manter a rastreabilidade)
    setHistoricoMovimentacoes([
      {
        id: `hist_${Date.now()}_excl`,
        dataStr: new Date().toISOString(),
        tipo: 'ESTORNO_ENTRADA',
        descricao: `Exclusão de Entrada: ${entradaParaExcluir.descricao}`,
        valor: entradaParaExcluir.valor,
        banco: entradaParaExcluir.bancoNome
      },
      ...historicoMovimentacoes
    ]);

    registrarAuditoria('EXCLUIR_ENTRADA', `Entrada excluída: ${entradaParaExcluir.descricao} | Valor: R$ ${entradaParaExcluir.valor} | Banco: ${entradaParaExcluir.bancoNome}`);
  };

  const handleZerarBase = () => {
    if (!window.confirm("🔴 ATENÇÃO: Tem certeza que deseja excluir TODOS os dados de movimentação do financeiro (Despesas, Bancos, Entradas, Extrato)? Isso zerará o sistema para a produção.")) return;
    // Limpa o state para evitar que o useEffect re-salve dados antes do reload
    setDespesas([]);
    setBancosComSaldo([]);
    setEntradasRecursos([]);
    setHistoricoMovimentacoes([]);

    registrarAuditoria('ZERAR_BASE', 'O usuário limpou toda a base de dados do Financeiro.');

    // Força a substituição no localStorage
    localStorage.setItem('acoweb_financeiro_despesas_v5', '[]');
    localStorage.setItem('acoweb_bancos_saldo_v2', '[]');
    localStorage.setItem('acoweb_entradas_recursos_v2', '[]');
    localStorage.setItem('acoweb_historico_bancario_v2', '[]');
    localStorage.removeItem('acoweb_financeiro_deptos');
    localStorage.removeItem('acoweb_financeiro_bancos');
    
    alert("Base do Financeiro limpa com sucesso! O sistema será recarregado.");
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <div style={{ color: '#f8fafc', padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* CABEÇALHO PRINCIPAL DA TELA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: moduloSubSecao === 'fluxo' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2))' : moduloSubSecao === 'faturamento' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2))' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))', borderRadius: '12px', border: moduloSubSecao === 'fluxo' ? '1px solid rgba(59, 130, 246, 0.3)' : moduloSubSecao === 'faturamento' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)' }}>
              {moduloSubSecao === 'fluxo' ? <BarChart2 size={28} color="#60a5fa" /> : moduloSubSecao === 'faturamento' ? <DollarSign size={28} color="#fbbf24" /> : <Landmark size={28} color="#34d399" />}
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                {moduloSubSecao === 'fluxo' ? 'Fluxo de Despesas' : moduloSubSecao === 'faturamento' ? 'Faturamento & Contas a Receber' : 'Conciliação Bancária'}
              </h1>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                {moduloSubSecao === 'fluxo' ? 'Esteira Operacional & Relatórios' : moduloSubSecao === 'faturamento' ? 'Gestão de Lançamentos, Faturas e Receitas' : 'Gestão de Bancos, Saldos & Entradas de Recursos'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {currentUser?.role === 'MASTER' && (
            <button
              onClick={() => setShowModalAuditoria(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                padding: '8px 14px', borderRadius: '10px', fontWeight: 600, fontSize: '12px',
                border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer'
              }}
              title="Apenas MASTER: Ver log de ações de todos os usuários neste dispositivo"
            >
              <FileText size={16} />
              Logs de Auditoria
            </button>
          )}

          {moduloSubSecao === 'fluxo' ? (
            <button
              onClick={() => setActiveTab('nova')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              <PlusCircle size={18} />
              <span>Cadastrar Nova Despesa</span>
            </button>
          ) : (
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, background: 'rgba(30, 41, 59, 0.6)', padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {bancosComSaldo.length} bancos cadastrados | Saldo Líquido: <strong style={{ color: '#34d399' }}>{formatMoney(bancosComSaldo.reduce((acc, b) => acc + b.saldoAtual, 0))}</strong>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 1: FLUXO DE DESPESAS (TELA ATUAL DA ESTEIRA) */}
      {moduloSubSecao === 'fluxo' && (
        <>

      {/* CARDS RESUMO / KPIS DAS SITUAÇÕES FINANCEIRAS — CLICÁVEIS PARA ABRIR DETALHES DE CADA VALOR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        
        {/* Card 1: TOTAL EM ABERTO */}
        <div 
          onClick={() => setModalDetalhesCard({
            titulo: '💳 Total de Despesas em Aberto (A Pagar)',
            cor: '#60a5fa',
            icone: <CreditCard size={20} color="#60a5fa" />,
            listaDespesas: estatisticas.listaEmAberto,
            valorTotal: estatisticas.valorEmAberto,
            targetTab: 'lancadas'
          })}
          style={{ 
            background: 'rgba(30, 41, 59, 0.5)', 
            padding: '14px', 
            borderRadius: '14px', 
            border: '1px solid rgba(59, 130, 246, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
          title="Clique para ver todas as despesas em aberto que compõem este valor"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>💳 Total em Aberto</span>
            <CreditCard size={16} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#60a5fa' }}>
            {formatMoney(estatisticas.valorEmAberto)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{estatisticas.countEmAberto} contas a pagar</span>
            <ChevronRight size={14} color="#60a5fa" />
          </div>
        </div>

        {/* Card 2: CONTAS A VENCER */}
        <div 
          onClick={() => setModalDetalhesCard({
            titulo: '⏳ Despesas A Vencer (No Prazo)',
            cor: '#fbbf24',
            icone: <Clock size={20} color="#f59e0b" />,
            listaDespesas: estatisticas.listaAVencer,
            valorTotal: estatisticas.valorAVencer,
            targetTab: 'lancadas'
          })}
          style={{ 
            background: 'rgba(245, 158, 11, 0.1)', 
            padding: '14px', 
            borderRadius: '14px', 
            border: '1px solid rgba(245, 158, 11, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
          title="Clique para ver todas as despesas a vencer que compõem este valor"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>⏳ A Vencer (No Prazo)</span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>
            {formatMoney(estatisticas.valorAVencer)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{estatisticas.countAVencer} contas a vencer</span>
            <ChevronRight size={14} color="#fbbf24" />
          </div>
        </div>

        {/* Card 3: CONTAS VENCIDAS */}
        <div 
          onClick={() => setModalDetalhesCard({
            titulo: '🚨 Despesas Vencidas (Em Atraso)',
            cor: '#f87171',
            icone: <AlertOctagon size={20} color="#ef4444" />,
            listaDespesas: estatisticas.listaVencidas,
            valorTotal: estatisticas.valorVencidas,
            targetTab: 'lancadas'
          })}
          style={{ 
            background: 'rgba(239, 68, 68, 0.12)', 
            padding: '14px', 
            borderRadius: '14px', 
            border: '1px solid rgba(239, 68, 68, 0.35)', 
            boxShadow: estatisticas.countVencidas > 0 ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
          title="Clique para ver todas as despesas vencidas que compõem este valor"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🚨 Vencidas (Atraso)</span>
            <AlertOctagon size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#f87171' }}>
            {formatMoney(estatisticas.valorVencidas)}
          </div>
          <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{estatisticas.countVencidas} contas em atraso</span>
            <ChevronRight size={14} color="#f87171" />
          </div>
        </div>

        {/* Card 4: AGUARDANDO APROVAÇÃO */}
        <div 
          onClick={() => setModalDetalhesCard({
            titulo: '⏱️ Despesas Aguardando Aprovação',
            cor: '#fbbf24',
            icone: <Clock size={20} color="#fbbf24" />,
            listaDespesas: estatisticas.listaAguardando,
            valorTotal: estatisticas.valorAguardando,
            targetTab: 'aguardando'
          })}
          style={{ 
            background: 'rgba(30, 41, 59, 0.5)', 
            padding: '14px', 
            borderRadius: '14px', 
            border: '1px solid rgba(245, 158, 11, 0.2)',
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
          title="Clique para ver todas as despesas aguardando aprovação"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>⏱️ Aguardando Aprovação</span>
            <Clock size={16} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fde047' }}>
            {formatMoney(estatisticas.valorAguardando)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{estatisticas.countAguardando} em análise</span>
            <ChevronRight size={14} color="#fbbf24" />
          </div>
        </div>

        {/* Card 5: TOTAL PAGO (DESPESAS PAGAS) POR ÚLTIMO */}
        <div 
          onClick={() => setModalDetalhesCard({
            titulo: '✓ Despesas Pagas (Quitadas & Liquidadas)',
            cor: '#34d399',
            icone: <CheckCircle2 size={20} color="#34d399" />,
            listaDespesas: estatisticas.listaPagas,
            valorTotal: estatisticas.valorPagas,
            targetTab: 'pagas'
          })}
          style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            padding: '14px', 
            borderRadius: '14px', 
            border: '1px solid rgba(16, 185, 129, 0.3)',
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
          title="Clique para ver todas as despesas pagas que compõem este valor"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>✓ Pagas (Quitadas)</span>
            <CheckCircle2 size={16} color="#34d399" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>
            {formatMoney(estatisticas.valorPagas)}
          </div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{estatisticas.countPagas} despesas liquidadas</span>
            <ChevronRight size={14} color="#34d399" />
          </div>
        </div>

      </div>

      {/* BARRA DE NAVEGAÇÃO DE ABAS — ORDEM EXATA REQUISITADA */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        
        {/* 1. CADASTRO DE DESPESAS */}
        {checkTabAccess('fin_cadastradas') && (
          <button
            onClick={() => setActiveTab('cadastradas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'cadastradas' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              color: activeTab === 'cadastradas' ? '#c084fc' : '#94a3b8',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: activeTab === 'cadastradas' ? '3px solid #a78bfa' : 'none'
            }}
          >
            <FileText size={15} />
            <span>1. Cadastro de Despesas ({estatisticas.countCadastradas})</span>
          </button>
        )}

        {/* 2. AGUARDANDO APROVAÇÃO */}
        {checkTabAccess('fin_aguardando') && (
          <button
            onClick={() => setActiveTab('aguardando')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'aguardando' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              color: activeTab === 'aguardando' ? '#fbbf24' : '#94a3b8',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: activeTab === 'aguardando' ? '3px solid #fbbf24' : 'none'
            }}
          >
            <Clock size={15} />
            <span>2. Aguardando Aprovação ({estatisticas.countAguardando})</span>
          </button>
        )}

        {/* 3. APROVADAS */}
        {checkTabAccess('fin_aprovadas') && (
          <button
            onClick={() => setActiveTab('aprovadas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'aprovadas' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'aprovadas' ? '#34d399' : '#94a3b8',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: activeTab === 'aprovadas' ? '3px solid #34d399' : 'none'
            }}
          >
            <CheckCircle2 size={15} />
            <span>3. Aprovadas ({estatisticas.countAprovadas})</span>
          </button>
        )}

        {/* 4. LANÇADAS */}
        {checkTabAccess('fin_lancadas') && (
          <button
            onClick={() => setActiveTab('lancadas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'lancadas' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: activeTab === 'lancadas' ? '#60a5fa' : '#94a3b8',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: activeTab === 'lancadas' ? '3px solid #60a5fa' : 'none'
            }}
          >
            <Send size={15} />
            <span>5. Lançadas ({estatisticas.countLancadas})</span>
          </button>
        )}

        {/* 5. PAGAS */}
        {checkTabAccess('fin_pagas') && (
          <button
            onClick={() => setActiveTab('pagas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'pagas' ? 'rgba(52, 211, 153, 0.2)' : 'transparent',
              color: activeTab === 'pagas' ? '#34d399' : '#94a3b8',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: activeTab === 'pagas' ? '3px solid #34d399' : 'none'
            }}
          >
            <CheckCheck size={15} />
            <span>6. Pagas ({estatisticas.countPagas})</span>
          </button>
        )}

        {/* 6. CONCILIAÇÃO */}
        {checkTabAccess('fin_conciliacao') && (
          <button
            onClick={() => setActiveTab('conciliacao')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'conciliacao' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'conciliacao' ? '#60a5fa' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: activeTab === 'conciliacao' ? '2px solid #60a5fa' : 'none'
            }}
          >
            <Landmark size={15} />
            <span>7. Conciliação & Abate de Saldo ({estatisticas.countConciliacao})</span>
          </button>
        )}

        {/* 7. RECUSADAS */}
        {checkTabAccess('fin_recusadas') && (
          <button
            onClick={() => setActiveTab('recusadas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'recusadas' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: activeTab === 'recusadas' ? '#f87171' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: activeTab === 'recusadas' ? '2px solid #f87171' : 'none'
            }}
          >
            <XCircle size={15} />
            <span>8. Recusadas ({estatisticas.countRecusadas})</span>
          </button>
        )}

        {/* 8. RELATÓRIO MENSAL & CONSULTA GERAL */}
        {checkTabAccess('fin_relatorio') && (
          <button
            onClick={() => setActiveTab('relatorio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'relatorio' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: activeTab === 'relatorio' ? '#c084fc' : '#94a3b8',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: activeTab === 'relatorio' ? '2px solid #c084fc' : 'none'
            }}
          >
            <BarChart2 size={15} />
            <span>Relatório Mensal & Consulta</span>
          </button>
        )}

        {/* ABA FORMULÁRIO: CADASTRAR NOVA DESPESA */}
        {checkTabAccess('fin_nova') && (
          <button
            onClick={() => setActiveTab('nova')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'nova' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === 'nova' ? '#60a5fa' : '#94a3b8',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: activeTab === 'nova' ? '2px solid #60a5fa' : 'none',
              marginLeft: 'auto'
            }}
          >
            <PlusCircle size={15} />
            <span>+ Nova Despesa</span>
          </button>
        )}

      </div>

      {/* CADASTRO DE NOVAS DESPESAS (ABA FORMULÁRIO) */}
      {activeTab === 'nova' && (
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '28px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', maxWidth: '950px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={20} color="#a78bfa" />
            Cadastrar Nova Despesa no Sistema
          </h2>

          <form onSubmit={handleCadastrarDespesa} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* Empresa */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Empresa do Grupo *
              </label>
              <select
                value={formNovaDespesa.empresa}
                onChange={(e) => {
                  if (e.target.value === 'NOVA_EMPRESA') {
                    setShowNovoEmpresaModal(true);
                  } else {
                    setFormNovaDespesa({ ...formNovaDespesa, empresa: e.target.value });
                  }
                }}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700 }}
              >
                {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                <option value="NOVA_EMPRESA">+ Gerenciar Empresas</option>
              </select>
            </div>

            {/* Departamento com Botão + */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Departamento (Único por Seleção) *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={formNovaDespesa.departamento}
                  onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, departamento: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNovoDeptoModal(true)}
                  style={{ padding: '10px 12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Cadastrar Novo Departamento"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Nome / Descrição da Despesa */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Nome / Descrição da Despesa *
              </label>
              <input
                type="text"
                placeholder="Ex: Abastecimento de Frota de Viaturas - Quinzena Setembro"
                value={formNovaDespesa.nome}
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, nome: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            {/* Valor */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formNovaDespesa.valor}
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, valor: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 700 }}
              />
            </div>

            {/* Parcelas Manuais */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Quantidade de Parcelas (Inserida Manualmente) *
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={formNovaDespesa.parcelas}
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, parcelas: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 700 }}
              />
            </div>

            {/* Vencimento Inicial + Cálculo do Último Mês */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Data de Vencimento da 1ª Parcela *
              </label>
              <input
                type="date"
                value={formNovaDespesa.vencimento}
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, vencimento: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', colorScheme: 'dark' }}
              />
              
              {/* Badge Dinâmica da Última Parcela */}
              {Number(formNovaDespesa.parcelas) > 1 && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#a78bfa', background: 'rgba(139, 92, 246, 0.15)', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} />
                  <span>Última Parcela em: <strong>{calcularUltimoVencimento(formNovaDespesa.vencimento, formNovaDespesa.parcelas)}</strong></span>
                </div>
              )}
            </div>

            {/* Banco Pagador com Botão + */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Banco Pagador *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={formNovaDespesa.banco}
                  onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, banco: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="">Selecione o Banco...</option>
                  {bancosComSaldo.length > 0
                    ? bancosComSaldo.map(b => <option key={b.id} value={b.nome}>{b.nome} ({b.empresa || 'AÇOFORTE'})</option>)
                    : bancos.map(b => <option key={b} value={b}>{b}</option>)
                  }
                </select>
                <button
                  type="button"
                  onClick={() => setShowNovoBancoModal(true)}
                  style={{ padding: '10px 12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Cadastrar Novo Banco"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Forma de Pagamento *
              </label>
              <select
                value={formNovaDespesa.formaPagamento}
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, formaPagamento: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600 }}
              >
                {FORMAS_PAGAMENTO.map(fp => <option key={fp} value={fp}>{fp}</option>)}
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Prioridade da Despesa *
              </label>
              <select
                value={formNovaDespesa.prioridade}
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, prioridade: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700 }}
              >
                {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {/* Possui OP (Ordem de Pagamento)? */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '14px' }}>
                <input
                  type="checkbox"
                  checked={formNovaDespesa.temOP}
                  onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, temOP: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                />
                <span>Possui OP (Ordem de Pagamento)?</span>
              </label>
            </div>

            {/* Número da OP e Anexo PDF (Condicional) */}
            {formNovaDespesa.temOP && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#60a5fa', marginBottom: '6px' }}>
                    Número da OP *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: OP-2026-9901"
                    value={formNovaDespesa.numeroOP}
                    onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, numeroOP: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #3b82f6', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#60a5fa', marginBottom: '6px' }}>
                    Anexo Documento da OP (PDF)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          alert('Por favor, selecione apenas arquivos PDF.');
                          e.target.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setFormNovaDespesa(prev => ({
                            ...prev,
                            pdfOP: { name: file.name, dataUrl: ev.target.result }
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  {formNovaDespesa.pdfOP && (
                    <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      📄 Anexo OP: {formNovaDespesa.pdfOP.name}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Observações */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Observações do Lançamento
              </label>
              <textarea
                rows={3}
                placeholder="Detalhes adicionais sobre a justificativa da despesa..."
                value={formNovaDespesa.observacao}
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, observacao: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
              />
            </div>

            {/* Botão Submeter */}
            <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
                }}
              >
                Salvar em Cadastro de Despesas ➔
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ABAS DA TABELA DE DESPESAS (1. CADASTRO | 2. AGUARDANDO | 3. APROVADAS | 5. LANÇADAS | 6. PAGAS | 7. CONCILIAÇÃO | 8. RECUSADAS) */}
      {(activeTab === 'cadastradas' || activeTab === 'aguardando' || activeTab === 'aprovadas' || activeTab === 'lancadas' || activeTab === 'pagas' || activeTab === 'conciliacao' || activeTab === 'recusadas') && (
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          
          {/* BARRA DE FILTROS E EXPORTAÇÃO */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {activeTab === 'cadastradas' && '1. Cadastro de Despesas (Edição Completa & Envio p/ Aprovação)'}
                {activeTab === 'aguardando' && '2. Aguardando Aprovação (Gestão / Diretoria)'}
                {activeTab === 'aprovadas' && '3. Despesas Aprovadas (Prontas p/ Lançamento Bancário)'}
                {activeTab === 'lancadas' && '5. Lançadas no Banco (Confirmação de Pagamento)'}
                {activeTab === 'pagas' && '6. Despesas Pagas (Quitadas & Liquidadas)'}
                {activeTab === 'conciliacao' && '7. Despesas Pendentes de Conciliação Bancária'}
                {activeTab === 'recusadas' && '8. Despesas Recusadas / Reprovadas'}
                {` (${listaExibicao.length})`}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Total na visualização: <strong>{formatMoney(listaExibicao.reduce((a,b) => a + (b.valorExecutado !== undefined ? b.valorExecutado : b.valor), 0))}</strong>
                </span>
                {filtroAtual.mes && (
                  <span style={{ fontSize: '11px', color: '#a78bfa', background: 'rgba(139, 92, 246, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> Mês: {formatarMesExtenso(filtroAtual.mes)}
                    <button onClick={() => setFiltroAtual('mes', '')} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 0, marginLeft: '4px' }}>✕</button>
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Filtro por Mês (Vencimento) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="#a78bfa" />
                <select
                  value={filtroAtual.mes}
                  onChange={(e) => setFiltroAtual('mes', e.target.value)}
                  style={{ padding: '8px 12px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '8px', color: '#c084fc', fontSize: '12px', fontWeight: 700 }}
                >
                  <option value="">Todos os Meses</option>
                  {mesesDisponiveis.map(m => (
                    <option key={m} value={m}>{formatarMesExtenso(m)}</option>
                  ))}
                </select>
              </div>

              {/* Campo Busca */}
              <div style={{ position: 'relative', minWidth: '160px' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Buscar despesa ou OP..."
                  value={filtroAtual.busca}
                  onChange={(e) => setFiltroAtual('busca', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
              </div>

              {/* Filtro Empresa */}
              <select
                value={filtroAtual.empresa}
                onChange={(e) => setFiltroAtual('empresa', e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              >
                <option value="">Todas as Empresas</option>
                {empresas.map(e => <option key={e} value={e}>{e}</option>)}
              </select>

              {/* Filtro Departamento */}
              <select
                value={filtroAtual.departamento}
                onChange={(e) => setFiltroAtual('departamento', e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              >
                <option value="">Todos os Deptos</option>
                {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Filtro Forma de Pagamento */}
              <select
                value={filtroAtual.formaPagamento}
                onChange={(e) => setFiltroAtual('formaPagamento', e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              >
                <option value="">Forma Pagto</option>
                {FORMAS_PAGAMENTO.map(fp => <option key={fp} value={fp}>{fp}</option>)}
              </select>

              {/* Filtro Banco Pagador */}
              <select
                value={filtroAtual.banco || ''}
                onChange={(e) => setFiltroAtual('banco', e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              >
                <option value="">Todos os Bancos</option>
                {bancosComSaldo.length > 0
                  ? bancosComSaldo.map(b => <option key={b.id} value={b.nome}>{b.nome}</option>)
                  : bancos.map(b => <option key={b} value={b}>{b}</option>)
                }
              </select>

              {/* Exportar CSV */}
              <button
                onClick={() => exportarCSVGenerico()}
                style={{ padding: '8px 12px', background: 'rgba(51, 65, 85, 0.6)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> Exportar CSV
              </button>

            </div>
          </div>

          {/* TABELA DE DESPESAS */}
          {listaExibicao.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
              <Clock size={36} style={{ opacity: 0.5, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Nenhuma despesa encontrada nesta aba ou filtro.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 14px' }}>Prioridade</th>
                    <th style={{ padding: '12px 14px' }}>Empresa</th>
                    <th style={{ padding: '12px 14px' }}>Departamento</th>
                    <th style={{ padding: '12px 14px' }}>Descrição da Despesa</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Valor (R$)</th>
                    <th style={{ padding: '12px 14px' }}>OP / Banco / Forma</th>
                    <th style={{ padding: '12px 14px' }}>Vencimento</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Situação</th>

                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Ações & Esteira</th>
                  </tr>
                </thead>
                <tbody>
                  {listaExibicao.map((item, idx) => {
                    const prioObj = PRIORIDADES.find(p => p.value === item.prioridade) || PRIORIDADES[1];
                    const sit = getSituacaoItem(item);

                    return (
                      <tr 
                        key={item.id}
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: sit.code === 'VENCIDA' ? 'rgba(239, 68, 68, 0.04)' : (idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)')
                        }}
                      >
                        {/* Prioridade Badge */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ 
                            padding: '3px 8px', 
                            borderRadius: '12px', 
                            fontSize: '10px', 
                            fontWeight: 700,
                            background: prioObj.bg,
                            color: prioObj.color
                          }}>
                            {prioObj.label}
                          </span>
                        </td>

                        {/* Empresa */}
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#f8fafc' }}>
                          {item.empresa}
                        </td>

                        {/* Departamento */}
                        <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                          {item.departamento}
                        </td>

                        {/* Descrição + Observação */}
                        <td style={{ padding: '12px 14px', maxWidth: '300px' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.nome}</div>
                          {item.observacao && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MessageSquare size={10} /> {item.observacao}
                            </div>
                          )}
                          {item.obsAprovacao && (
                            <div style={{ fontSize: '11px', color: item.status === 'RECUSADA' ? '#f87171' : '#34d399', marginTop: '2px', fontStyle: 'italic' }}>
                              Obs Análise: "{item.obsAprovacao}"
                            </div>
                          )}
                        </td>

                        {/* Valor */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                          <div style={{ fontWeight: 800, color: item.valorExecutado !== undefined ? '#34d399' : '#60a5fa', fontSize: '14px' }}>
                            {formatMoney(item.valorExecutado !== undefined ? item.valorExecutado : item.valor)}
                          </div>
                          {item.valorExecutado !== undefined && item.valorExecutado !== item.valor && (
                            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '2px', color: item.valorExecutado > item.valor ? '#f87171' : '#34d399' }}>
                              {item.valorExecutado > item.valor 
                                ? `+${formatMoney(item.valorExecutado - item.valor)} (Juros)` 
                                : `-${formatMoney(item.valor - item.valorExecutado)} (Desconto)`}
                            </div>
                          )}
                          {item.valorExecutado !== undefined && (
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                              Previsto: {formatMoney(item.valor)}
                            </div>
                          )}
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                            {item.parcelas > 1 ? `Parc. ${item.parcelaNumero || 1}/${item.parcelas}` : '1x (À vista)'}
                          </div>
                        </td>

                        {/* OP / Banco / Forma Pagamento / Anexos PDF */}
                        <td style={{ padding: '12px 14px', fontSize: '11px' }}>
                          {item.temOP ? (
                            <div>
                              <span style={{ color: '#38bdf8', fontWeight: 600, display: 'block' }}>OP: {item.numeroOP}</span>
                              {item.pdfOP && (
                                <button
                                  type="button"
                                  onClick={() => abrirPDF(item.pdfOP)}
                                  style={{ marginTop: '3px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                  title={item.pdfOP.name || 'Ver PDF OP'}
                                >
                                  <FileText size={10} /> PDF OP
                                </button>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', display: 'block' }}>Sem OP</span>
                          )}
                          {activeTab === 'aprovadas' ? (
                            <div style={{ marginTop: '4px' }}>
                              <label style={{ display: 'block', fontSize: '10px', color: '#38bdf8', fontWeight: 700, marginBottom: '2px' }}>
                                ✏️ Banco Pagador:
                              </label>
                              <select
                                value={item.banco || bancos[0] || 'Itaú'}
                                onChange={(e) => {
                                  const novoBanco = e.target.value;
                                  setDespesas(prev => prev.map(d => d.id === item.id ? { ...d, banco: novoBanco } : d));
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: '#0f172a',
                                  border: '1px solid #38bdf8',
                                  borderRadius: '6px',
                                  color: '#38bdf8',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {bancosComSaldo.length > 0
                                  ? bancosComSaldo.map(b => (
                                    <option key={b.id} value={b.nome}>{b.nome} ({b.empresa || 'AÇOFORTE'})</option>
                                  ))
                                  : bancos.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                  ))
                                }
                              </select>
                            </div>
                          ) : (
                            <span style={{ color: '#cbd5e1', display: 'block', marginTop: '2px' }}>{item.banco}</span>
                          )}
                          {item.formaPagamento && (
                            <span style={{ color: '#a78bfa', display: 'block', fontSize: '10px' }}>• {item.formaPagamento}</span>
                          )}
                          {item.pdfComprovante && (
                            <button
                              type="button"
                              onClick={() => abrirPDF(item.pdfComprovante)}
                              style={{ marginTop: '4px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.35)', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              title={item.pdfComprovante.name || 'Ver Comprovante PDF'}
                            >
                              <FileText size={10} /> Comprovante PDF
                            </button>
                          )}
                        </td>

                        {/* Vencimento */}
                        <td style={{ padding: '12px 14px', color: '#cbd5e1', fontSize: '12px' }}>
                          <div>{formatDate(item.vencimento)}</div>
                          {item.parcelas > 1 && (
                            <div style={{ fontSize: '10px', color: '#a78bfa' }}>Fim: {calcularUltimoVencimento(item.vencimento, item.parcelas - (item.parcelaNumero - 1))}</div>
                          )}
                        </td>

                        {/* Badge de Situação Financeira (VENCIDA, A VENCER, PAGO) */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: sit.bg,
                            color: sit.color,
                            border: `1px solid ${sit.border || 'transparent'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {sit.label}
                          </span>
                        </td>

                        {/* Coluna Ações Específicas por Aba da Esteira */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          
                          {/* 1. CADASTRO DE DESPESAS — PERMITE EDIÇÃO COMPLETA */}
                          {activeTab === 'cadastradas' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                onClick={() => handleAbrirEdicaoCompleta(item)}
                                style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Editar esta despesa cadastrada por completo (Empresa, Depto, Nome, Valor, Vencimento, Banco, OP, etc.)"
                              >
                                <Edit2 size={12} /> Editar Despesa
                              </button>

                              <button
                                onClick={() => handleEnviarParaAprovacao(item.id)}
                                style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' }}
                                title="Enviar para a aba Aguardando Aprovação"
                              >
                                <Send size={12} /> Enviar p/ Aprovação
                              </button>

                              <button
                                onClick={() => handleExcluirDespesa(item.id)}
                                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                                title="Excluir despesa"
                              >
                                <Trash2 size={14} color="#f87171" />
                              </button>
                            </div>
                          )}

                          {/* 2. AGUARDANDO APROVAÇÃO */}
                          {activeTab === 'aguardando' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                onClick={() => setModalAprovacao({ despesa: item, acao: 'APROVAR' })}
                                style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Aprovar despesa e mover para Aprovadas"
                              >
                                <Check size={12} /> Aprovar
                              </button>
                              <button
                                onClick={() => setModalAprovacao({ despesa: item, acao: 'REPROVAR' })}
                                style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Reprovar / Recusar despesa"
                              >
                                <X size={12} /> Reprovar
                              </button>
                            </div>
                          )}

                          {/* 3. APROVADAS */}
                          {activeTab === 'aprovadas' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                onClick={() => handleConfirmarLancamentoBanco(item.id)}
                                style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Confirmar lançamento no banco e mover para Lançadas"
                              >
                                <Send size={12} /> Confirmar Lançamento no Banco
                              </button>
                            </div>
                          )}

                          {/* 4. LANÇADAS */}
                          {activeTab === 'lancadas' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                onClick={() => handleMarcarComoPaga(item.id)}
                                style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Confirmar pagamento e mover para Pagas"
                              >
                                <Check size={12} /> ✓ Marcar como PAGA
                              </button>
                            </div>
                          )}

                          {/* 5. PAGAS */}
                          {activeTab === 'pagas' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                              <button
                                onClick={() => handleEnviarParaConciliacao(item.id)}
                                style={{ width: '100%', padding: '6px 12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                title="Enviar para a aba Pendente de Conciliação"
                              >
                                <Landmark size={12} /> 🏦 Enviar p/ Conciliação
                              </button>
                              <button
                                onClick={() => handleEstornarParaLancadas(item.id)}
                                style={{ width: '100%', padding: '6px 12px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                title="Estornar pagamento e retornar a despesa para a aba 5 (Lançadas)"
                              >
                                <RotateCcw size={12} /> 🔄 ESTORNO DE DESPESA
                              </button>
                            </div>
                          )}

                          {/* 6. CONCILIAÇÃO BANCÁRIA — SELEÇÃO DE BANCO E ABATE REAL DE SALDO */}
                          {activeTab === 'conciliacao' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', minWidth: '220px' }}>
                              <select
                                id={`select_banco_fluxo_${item.id}`}
                                defaultValue={bancosComSaldo.find(b => b.nome.toLowerCase().includes((item.banco || '').toLowerCase()))?.id || bancosComSaldo[0]?.id || ''}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px',
                                  background: '#0f172a',
                                  border: '1px solid #10b981',
                                  borderRadius: '6px',
                                  color: '#34d399',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Selecione de qual banco o saldo será abatido"
                              >
                                {bancosComSaldo.map(b => (
                                  <option key={b.id} value={b.id}>
                                    🏦 {b.nome} (Saldo: {formatMoney(b.saldoAtual)})
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() => {
                                  const sel = document.getElementById(`select_banco_fluxo_${item.id}`);
                                  const bId = sel ? sel.value : (bancosComSaldo[0]?.id || '');
                                  handleConciliarComAbateSaldo(item.id, bId);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '6px 12px',
                                  background: 'linear-gradient(135deg, #10b981, #047857)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                }}
                                title="Conciliar esta despesa e abater o valor do saldo do banco selecionado"
                              >
                                <CheckCircle2 size={13} /> ⚖️ Conciliar & Abater Saldo
                              </button>
                            </div>
                          )}

                          {/* 7. RECUSADAS */}
                          {activeTab === 'recusadas' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                onClick={() => handleReenviarParaCadastro(item.id)}
                                style={{ padding: '6px 12px', background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.4)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Reenviar despesa reprovada de volta para a aba Cadastro de Despesas"
                              >
                                <RotateCcw size={12} /> ↩️ Reenviar p/ Cadastro
                              </button>
                              <button
                                onClick={() => handleExcluirDespesa(item.id)}
                                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                                title="Excluir despesa reprovada"
                              >
                                <Trash2 size={14} color="#f87171" />
                              </button>
                            </div>
                          )}

                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ABA: RELATÓRIO MENSAL & CONSULTA GERAL DE TODAS AS DESPESAS */}
      {activeTab === 'relatorio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* NAVEGAÇÃO DE SUB-ABAS DENTRO DO RELATÓRIO */}
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
            <button
              onClick={() => setSubTabRelatorio('fluxo')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: subTabRelatorio === 'fluxo' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                color: subTabRelatorio === 'fluxo' ? '#60a5fa' : '#94a3b8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <BarChart2 size={16} />
              <span>📊 Fluxo de Pagamentos Mensal & Indicadores</span>
            </button>

            <button
              onClick={() => setSubTabRelatorio('consulta')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: subTabRelatorio === 'consulta' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                color: subTabRelatorio === 'consulta' ? '#c084fc' : '#94a3b8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Database size={16} />
              <span>🔍 Consulta Geral de TODAS as Despesas ({listaConsultaGeral.length})</span>
            </button>
          </div>

          {/* SUB-ABA 1: FLUXO DE PAGAMENTOS MENSAL & GRÁFICOS */}
          {subTabRelatorio === 'fluxo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* BARRA DE EXPORTAÇÃO CSV ESPECIAL */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download size={20} color="#38bdf8" />
                    Exportação de Relatórios de Pagamentos em CSV
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Baixe planilhas segmentadas por status de pagamento, conciliação e arquivo {filtroAtual?.mes ? `(Filtrado por ${formatarMesExtenso(filtroAtual.mes)})` : ''}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => exportarCSVGenerico('PAGAS')}
                    style={{ padding: '8px 14px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={14} /> Exportar PAGAS
                  </button>

                  <button
                    onClick={() => exportarCSVGenerico('PENDENTES_PAGAMENTO')}
                    style={{ padding: '8px 14px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Clock size={14} /> Exportar A PAGAR
                  </button>

                  <button
                    onClick={() => exportarCSVGenerico('PENDENTES_CONCILIACAO')}
                    style={{ padding: '8px 14px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Landmark size={14} /> Exportar P/ CONCILIAR
                  </button>

                  <button
                    onClick={() => exportarCSVGenerico('FINALIZADAS')}
                    style={{ padding: '8px 14px', background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.4)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={14} /> Exportar FINALIZADAS
                  </button>
                </div>
              </div>

              {/* Gráfico Comparativo Mês a Mês — COM NOME DO MÊS E ANO NO EIXO X */}
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart size={18} color="#60a5fa" />
                  Relatório Comparativo Mensal — Valor Pago vs Pendente (Nome do Mês & Ano)
                </h3>

                <div style={{ width: '100%', height: 340 }}>
                  <ResponsiveContainer>
                    <BarChart data={dadosRelatorioMensal.meses} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="mesFormatado" stroke="#cbd5e1" tick={{ fontSize: 12, fontWeight: 700 }} />
                      <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} stroke="#94a3b8" />
                      <Tooltip formatter={(val) => [formatMoney(val)]} contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar dataKey="pago" name="Valor Pago (R$)" fill="#34d399" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="pendente" name="Pendente de Pagamento (R$)" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Resumos Consolidados (Empresas & Departamentos) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
                
                {/* Consolidado por Empresa */}
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
                    Resumo por Empresa do Grupo
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '8px 10px' }}>Empresa</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Pago (R$)</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Pendente (R$)</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dadosRelatorioMensal.empresas.map(emp => (
                          <tr key={emp.empresa} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f8fafc' }}>{emp.empresa}</td>
                            <td 
                              onClick={() => setModalDetalhesCard({
                                titulo: `✓ Despesas Pagas — Empresa: ${emp.empresa}`,
                                cor: '#34d399',
                                icone: <CheckCircle2 size={20} color="#34d399" />,
                                listaDespesas: emp.listaPago,
                                valorTotal: emp.pago,
                                targetTab: 'pagas'
                              })}
                              style={{ padding: '8px 10px', textAlign: 'right', color: '#34d399', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                              title="Clique para ver a relação detalhada das despesas pagas desta empresa"
                            >
                              {formatMoney(emp.pago)}
                            </td>
                            <td 
                              onClick={() => setModalDetalhesCard({
                                titulo: `⏳ Despesas Pendentes — Empresa: ${emp.empresa}`,
                                cor: '#fbbf24',
                                icone: <Clock size={20} color="#fbbf24" />,
                                listaDespesas: emp.listaPendente,
                                valorTotal: emp.pendente,
                                targetTab: 'lancadas'
                              })}
                              style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                              title="Clique para ver a relação detalhada das despesas pendentes desta empresa"
                            >
                              {formatMoney(emp.pendente)}
                            </td>
                            <td 
                              onClick={() => setModalDetalhesCard({
                                titulo: `💳 Total Geral de Despesas — Empresa: ${emp.empresa}`,
                                cor: '#60a5fa',
                                icone: <CreditCard size={20} color="#60a5fa" />,
                                listaDespesas: emp.listaTotal,
                                valorTotal: emp.total,
                                targetTab: 'relatorio'
                              })}
                              style={{ padding: '8px 10px', textAlign: 'right', color: '#60a5fa', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                              title="Clique para ver a relação total de despesas desta empresa"
                            >
                              {formatMoney(emp.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Consolidado por Departamento */}
                <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
                    Resumo por Departamento
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '8px 10px' }}>Departamento</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Pago (R$)</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Pendente (R$)</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dadosRelatorioMensal.departamentos.map(dep => (
                          <tr key={dep.departamento} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f8fafc' }}>{dep.departamento}</td>
                            <td 
                              onClick={() => setModalDetalhesCard({
                                titulo: `✓ Despesas Pagas — Departamento: ${dep.departamento}`,
                                cor: '#34d399',
                                icone: <CheckCircle2 size={20} color="#34d399" />,
                                listaDespesas: dep.listaPago,
                                valorTotal: dep.pago,
                                targetTab: 'pagas'
                              })}
                              style={{ padding: '8px 10px', textAlign: 'right', color: '#34d399', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                              title="Clique para ver a relação detalhada das despesas pagas deste departamento"
                            >
                              {formatMoney(dep.pago)}
                            </td>
                            <td 
                              onClick={() => setModalDetalhesCard({
                                titulo: `⏳ Despesas Pendentes — Departamento: ${dep.departamento}`,
                                cor: '#fbbf24',
                                icone: <Clock size={20} color="#fbbf24" />,
                                listaDespesas: dep.listaPendente,
                                valorTotal: dep.pendente,
                                targetTab: 'lancadas'
                              })}
                              style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                              title="Clique para ver a relação detalhada das despesas pendentes deste departamento"
                            >
                              {formatMoney(dep.pendente)}
                            </td>
                            <td 
                              onClick={() => setModalDetalhesCard({
                                titulo: `💳 Total Geral de Despesas — Departamento: ${dep.departamento}`,
                                cor: '#60a5fa',
                                icone: <CreditCard size={20} color="#60a5fa" />,
                                listaDespesas: dep.listaTotal,
                                valorTotal: dep.total,
                                targetTab: 'relatorio'
                              })}
                              style={{ padding: '8px 10px', textAlign: 'right', color: '#60a5fa', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                              title="Clique para ver a relação total de despesas deste departamento"
                            >
                              {formatMoney(dep.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SUB-ABA 2: CONSULTA GERAL DE TODAS AS DESPESAS CADASTRAIS */}
          {subTabRelatorio === 'consulta' && (
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={18} color="#c084fc" />
                    Consulta Geral & Histórico Unificado de Despesas ({listaConsultaGeral.length})
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Consulte e pesquise qualquer despesa cadastrada no sistema independente da etapa da esteira
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Busca */}
                  <div style={{ position: 'relative', minWidth: '180px' }}>
                    <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text"
                      placeholder="Pesquisar por nome, OP ou obs..."
                      value={filtroAtual.busca}
                      onChange={(e) => setFiltroAtual('busca', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px 8px 32px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </div>

                  {/* Filtro Empresa */}
                  <select
                    value={filtroAtual.empresa}
                    onChange={(e) => setFiltroAtual('empresa', e.target.value)}
                    style={{ padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value="">Todas as Empresas</option>
                    {empresas.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>

                  {/* Filtro Departamento */}
                  <select
                    value={filtroAtual.departamento}
                    onChange={(e) => setFiltroAtual('departamento', e.target.value)}
                    style={{ padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value="">Todos os Deptos</option>
                    {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  {/* Filtro Banco */}
                  <select
                    value={filtroAtual.banco || ''}
                    onChange={(e) => setFiltroAtual('banco', e.target.value)}
                    style={{ padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value="">Todos os Bancos</option>
                    {bancosComSaldo.length > 0
                      ? bancosComSaldo.map(b => <option key={b.id} value={b.nome}>{b.nome}</option>)
                      : bancos.map(b => <option key={b} value={b}>{b}</option>)
                    }
                  </select>

                  {/* Exportar CSV Geral */}
                  <button
                    onClick={() => exportarCSVGenerico('TODAS')}
                    style={{ padding: '8px 14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> Exportar Planilha Completa
                  </button>
                </div>
              </div>

              {/* TABELA DE CONSULTA GERAL DE TODAS AS DESPESAS */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px' }}>ID / OP</th>
                      <th style={{ padding: '10px' }}>Empresa</th>
                      <th style={{ padding: '10px' }}>Departamento</th>
                      <th style={{ padding: '10px' }}>Descrição Despesa</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Valor (R$)</th>
                      <th style={{ padding: '10px' }}>Banco / Forma</th>
                      <th style={{ padding: '10px' }}>Vencimento</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Documentos / Anexos (PDF)</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Status na Esteira</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Situação Pagto</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaConsultaGeral.map((item, idx) => {
                      const sit = getSituacaoItem(item);
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                            <div>{item.id}</div>
                            {item.temOP && <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '10px', display: 'block' }}>{item.numeroOP}</span>}
                          </td>
                          <td style={{ padding: '10px', fontWeight: 700, color: '#f8fafc' }}>{item.empresa}</td>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>{item.departamento}</td>
                          <td style={{ padding: '10px', fontWeight: 600, color: '#f8fafc', maxWidth: '280px' }}>
                            {item.nome}
                            {item.parcelas > 1 && <span style={{ color: '#a78bfa', fontSize: '10px', display: 'block' }}>Parc. {item.parcelaNumero}/{item.parcelas}</span>}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}>{formatMoney(item.valor)}</td>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>
                            <div>{item.banco}</div>
                            <span style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>{item.formaPagamento}</span>
                          </td>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>{formatDate(item.vencimento)}</td>
                          
                          {/* Coluna dedicada para Anexos PDF no Relatório Mensal */}
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              {item.pdfOP ? (
                                <button
                                  type="button"
                                  onClick={() => abrirPDF(item.pdfOP)}
                                  style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title={item.pdfOP.name || 'Ver Documento OP'}
                                >
                                  <FileText size={11} /> 📄 PDF OP
                                </button>
                              ) : null}

                              {item.pdfComprovante ? (
                                <button
                                  type="button"
                                  onClick={() => abrirPDF(item.pdfComprovante)}
                                  style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title={item.pdfComprovante.name || 'Ver Comprovante de Pagamento'}
                                >
                                  <FileText size={11} /> 📑 Comprovante PDF
                                </button>
                              ) : null}

                              {!item.pdfOP && !item.pdfComprovante && (
                                <span style={{ color: '#64748b', fontSize: '11px' }}>Sem anexos</span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: 'rgba(51, 65, 85, 0.6)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)' }}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, background: sit.bg, color: sit.color }}>
                              {sit.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {currentUser?.role === 'MASTER' && (
                              <button
                                type="button"
                                onClick={() => handleExcluirDespesa(item.id)}
                                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                title="Excluir despesa definitivamente"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

        </div>
      )}
        </div>
      )}
      </>
      )}

      {/* SEÇÃO 2: CONCILIAÇÃO BANCÁRIA & GESTÃO DE SALDOS */}
      {moduloSubSecao === 'conciliacao_bancaria' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CARDS RESUMO DE CONCILIAÇÃO & SALDOS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            
            {/* Card 1: Saldo Total em Caixa */}
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🏦 Saldo Total Líquido em Caixa
                </span>
                <Landmark size={20} color="#34d399" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', fontFamily: 'monospace' }}>
                {formatMoney(bancosComSaldo.reduce((acc, b) => acc + b.saldoAtual, 0))}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                Soma dos saldos disponíveis em {bancosComSaldo.length} contas bancárias
              </div>
            </div>

            {/* Card 2: Entradas de Recursos */}
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📥 Entradas de Recursos (Receitas)
                </span>
                <ArrowUpRight size={20} color="#60a5fa" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}>
                {formatMoney(entradasRecursos.reduce((acc, e) => acc + e.valor, 0))}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                {entradasRecursos.length} entradas de recursos cadastradas
              </div>
            </div>

            {/* Card 3: Despesas Conciliadas */}
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚖️ Despesas Conciliadas / Liquidadas
                </span>
                <CheckCircle2 size={20} color="#c084fc" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#c084fc', fontFamily: 'monospace' }}>
                {formatMoney(despesas.filter(d => d.status === 'FINALIZADO' || d.statusPagamento === 'FINALIZADO').reduce((acc, d) => acc + (d.valorExecutado !== undefined ? d.valorExecutado : d.valor), 0))}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                {despesas.filter(d => d.status === 'FINALIZADO' || d.statusPagamento === 'FINALIZADO').length} despesas conciliadas com abate em conta
              </div>
            </div>

            {/* Card 4: A Conciliar */}
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⏳ Despesas Pendentes de Conciliação
                </span>
                <Clock size={20} color="#fbbf24" />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24', fontFamily: 'monospace' }}>
                {formatMoney(despesas.filter(d => d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'PAGO' || d.status === 'LANCADA').reduce((acc, d) => acc + (d.valorExecutado !== undefined ? d.valorExecutado : d.valor), 0))}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                {despesas.filter(d => d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'PAGO' || d.status === 'LANCADA').length} aguardando apontamento de banco para abate
              </div>
            </div>

          </div>

          {/* BARRA DE SUB-ABAS DA CONCILIAÇÃO BANCÁRIA */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px', overflowX: 'auto' }}>
            
            <button
              onClick={() => setSubTabConciliacao('entradas')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: subTabConciliacao === 'entradas' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                color: subTabConciliacao === 'entradas' ? '#60a5fa' : '#94a3b8',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: subTabConciliacao === 'entradas' ? '3px solid #60a5fa' : 'none'
              }}
            >
              <ArrowUpRight size={16} />
              <span>1. Entrada de Recursos (Receitas & Aportes)</span>
            </button>

            <button
              onClick={() => setSubTabConciliacao('bancos')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: subTabConciliacao === 'bancos' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                color: subTabConciliacao === 'bancos' ? '#c084fc' : '#94a3b8',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: subTabConciliacao === 'bancos' ? '3px solid #c084fc' : 'none'
              }}
            >
              <Landmark size={16} />
              <span>2. Cadastro & Gestão de Bancos e Saldos</span>
            </button>

            <button
              onClick={() => setSubTabConciliacao('extrato')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: subTabConciliacao === 'extrato' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.5)',
                color: subTabConciliacao === 'extrato' ? '#fbbf24' : '#94a3b8',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: subTabConciliacao === 'extrato' ? '3px solid #fbbf24' : 'none'
              }}
            >
              <Database size={16} />
              <span>3. Extrato & Histórico de Movimentações</span>
            </button>

          </div>

          {/* CONTEÚDO DAS SUB-ABAS DA CONCILIAÇÃO BANCÁRIA */}

          {/* SUB-ABA 2: ENTRADA DE RECURSOS (RECEITAS / APORTES) */}
          {subTabConciliacao === 'entradas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#60a5fa', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ArrowUpRight size={20} color="#60a5fa" />
                    Gestão de Entrada de Recursos (Receitas & Aportes)
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Cadastre novos créditos para alimentar os saldos das contas bancárias da empresa.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setFormEntradaRecursos({
                      descricao: '',
                      valor: '',
                      bancoId: bancosComSaldo[0]?.id || '',
                      dataEntrada: new Date().toISOString().slice(0, 10),
                      categoria: 'Faturamento / Vendas',
                      observacao: ''
                    });
                    setShowModalEntradaRecursos(true);
                  }}
                  style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}
                >
                  <PlusCircle size={16} /> + Lançar Entrada de Recursos
                </button>
              </div>

              {/* Tabela de Entradas Cadastradas */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>Data</th>
                      <th style={{ padding: '12px' }}>Descrição da Entrada</th>
                      <th style={{ padding: '12px' }}>Categoria</th>
                      <th style={{ padding: '12px' }}>Banco de Destino (Creditado)</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Valor Creditado (R$)</th>
                      <th style={{ padding: '12px' }}>Observações</th>
                      {currentUser?.role === 'MASTER' && (
                        <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {entradasRecursos.length === 0 ? (
                      <tr><td colSpan={currentUser?.role === 'MASTER' ? 7 : 6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Nenhuma entrada de recursos cadastrada.</td></tr>
                    ) : (
                      entradasRecursos.map((ent, idx) => (
                        <tr key={ent.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '12px', color: '#cbd5e1', fontWeight: 600 }}>{formatDate(ent.dataEntrada)}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#f8fafc' }}>{ent.descricao}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                              {ent.categoria}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#34d399', fontWeight: 700 }}>{ent.bancoNome}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#34d399', fontFamily: 'monospace', fontSize: '14px' }}>
                            +{formatMoney(ent.valor)}
                          </td>
                          <td style={{ padding: '12px', color: '#94a3b8', fontSize: '11px' }}>{ent.observacao || '—'}</td>
                          {currentUser?.role === 'MASTER' && (
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteEntrada(ent.id)}
                                title="Excluir Entrada"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={16} color="#ef4444" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-ABA 3: BANCOS & SALDOS */}
          {subTabConciliacao === 'bancos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#c084fc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Landmark size={20} color="#c084fc" />
                    Cadastro & Gestão de Bancos e Saldos em Conta
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Cadastre e atualize as contas bancárias com seus respectivos saldos reais.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setFormBancoSaldo({ id: null, nome: '', empresa: 'AÇOFORTE', agencia: '', conta: '', saldoInicial: '', saldoAtual: '', cor: '#38bdf8' });
                    setShowModalBancoSaldo(true);
                  }}
                  style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)' }}
                >
                  <PlusCircle size={16} /> + Cadastrar Novo Banco com Saldo
                </button>
              </div>

              {/* Filtros da Lista de Bancos */}
              <div style={{ display: 'flex', gap: '16px', background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Filtrar por Empresa</label>
                  <select
                    value={filtrosBancosSaldos.empresa}
                    onChange={e => setFiltrosBancosSaldos({ ...filtrosBancosSaldos, empresa: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  >
                    <option value="">Todas as Empresas</option>
                    {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Filtrar por Banco</label>
                  <select
                    value={filtrosBancosSaldos.banco}
                    onChange={e => setFiltrosBancosSaldos({ ...filtrosBancosSaldos, banco: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                  >
                    <option value="">Todos os Bancos</option>
                    {Array.from(new Set(bancosComSaldo.map(b => b.nome))).sort().map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              {/* Lista de Bancos com Saldo Live */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bancosComSaldo.filter(b => {
                  const fEmp = filtrosBancosSaldos.empresa;
                  const fBanco = filtrosBancosSaldos.banco;
                  if (fEmp && (b.empresa || 'AÇOFORTE') !== fEmp) return false;
                  if (fBanco && b.nome !== fBanco) return false;
                  return true;
                }).map(banco => (
                  <div key={banco.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.8)', padding: '16px 20px', borderRadius: '12px', borderLeft: `4px solid ${banco.cor || '#334155'}`, borderTop: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
                    
                    {/* Informações Principais */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {banco.nome} 
                        <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#cbd5e1' }}>
                          {banco.empresa || 'AÇOFORTE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Ag: <strong style={{ color: '#cbd5e1' }}>{banco.agencia}</strong> | Conta: <strong style={{ color: '#cbd5e1' }}>{banco.conta}</strong>
                      </div>
                    </div>

                    {/* Saldo Atual e Inicial */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: '20px' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Saldo Disponível</div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: banco.saldoAtual >= 0 ? '#34d399' : '#f87171', fontFamily: 'monospace' }}>
                        {formatMoney(banco.saldoAtual)}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                        Inicial: <strong style={{ color: '#94a3b8' }}>{formatMoney(banco.saldoInicial)}</strong>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => {
                          setFormBancoSaldo({
                            id: banco.id,
                            nome: banco.nome,
                            empresa: banco.empresa || 'AÇOFORTE',
                            agencia: banco.agencia || '',
                            conta: banco.conta || '',
                            saldoInicial: banco.saldoInicial,
                            saldoAtual: banco.saldoAtual,
                            cor: banco.cor || '#38bdf8'
                          });
                          setShowModalBancoSaldo(true);
                        }}
                        style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Edit2 size={14} /> Editar
                      </button>
                      {currentUser?.role === 'MASTER' && (
                        <button
                          onClick={() => handleExcluirBanco(banco.id, banco.nome)}
                          style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                          title="Apenas usuários com perfil MASTER podem excluir contas bancárias"
                        >
                          <Trash2 size={14} color="#f87171" />
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-ABA 4: EXTRATO & HISTÓRICO BANCÁRIO */}
          {subTabConciliacao === 'extrato' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={20} color="#fbbf24" />
                    Extrato e Histórico das Movimentações Bancárias
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Registro cronológico de todas as entradas de recursos e abates por conciliação efetuados no sistema.
                  </span>
                </div>
                <button 
                  onClick={exportarExtratoCSV}
                  style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                >
                  <Download size={14} /> Exportar CSV
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>Data</th>
                      <th style={{ padding: '12px' }}>Tipo</th>
                      <th style={{ padding: '12px' }}>Banco</th>
                      <th style={{ padding: '12px' }}>Descrição da Movimentação</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Valor (R$)</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Saldo Resultante (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicoMovimentacoes.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Nenhuma movimentação registrada no extrato até o momento.</td></tr>
                    ) : (
                      historicoMovimentacoes.map((mov, idx) => (
                        <tr key={mov.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '12px', color: '#cbd5e1' }}>{formatDate(mov.data)}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, background: mov.tipo === 'ENTRADA' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: mov.tipo === 'ENTRADA' ? '#34d399' : '#f87171' }}>
                              {mov.tipo === 'ENTRADA' ? '📥 ENTRADA' : '⚖️ ABATE CONCILIAÇÃO'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#f8fafc' }}>{mov.bancoNome}</td>
                          <td style={{ padding: '12px', color: '#cbd5e1' }}>{mov.descricao}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: mov.valor >= 0 ? '#34d399' : '#f87171', fontFamily: 'monospace', fontSize: '13px' }}>
                            {mov.valor >= 0 ? `+${formatMoney(mov.valor)}` : formatMoney(mov.valor)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}>
                            {formatMoney(mov.saldoResultante)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL DETALHES DE DESPESAS DO CARD DE KPI SELECIONADO */}
      {modalDetalhesCard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '24px', maxWidth: '1000px', width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: modalDetalhesCard.cor || '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {modalDetalhesCard.icone}
                  {modalDetalhesCard.titulo}
                </h3>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', display: 'block' }}>
                  Total acumulado: <strong style={{ color: '#fff' }}>{formatMoney(modalDetalhesCard.valorTotal)}</strong> ({modalDetalhesCard.listaDespesas.length} despesas encontradas)
                </span>
              </div>
              <button onClick={() => setModalDetalhesCard(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={22} /></button>
            </div>

            {modalDetalhesCard.listaDespesas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '13px' }}>Nenhuma despesa associada a este indicador no momento.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px' }}>Empresa</th>
                      <th style={{ padding: '10px' }}>Departamento</th>
                      <th style={{ padding: '10px' }}>Descrição Despesa</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Valor (R$)</th>
                      <th style={{ padding: '10px' }}>Banco / OP</th>
                      <th style={{ padding: '10px' }}>Vencimento</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Anexos PDF</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalDetalhesCard.listaDespesas.map((item, idx) => {
                      const sit = getSituacaoItem(item);
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                          <td style={{ padding: '10px', fontWeight: 700, color: '#f8fafc' }}>{item.empresa}</td>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>{item.departamento}</td>
                          <td style={{ padding: '10px', fontWeight: 600, color: '#f8fafc', maxWidth: '280px' }}>
                            {item.nome}
                            {item.parcelas > 1 && <span style={{ color: '#a78bfa', fontSize: '10px', display: 'block' }}>Parc. {item.parcelaNumero}/{item.parcelas}</span>}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: item.valorExecutado !== undefined ? '#34d399' : '#60a5fa', fontFamily: 'monospace' }}>
                            <div>{formatMoney(item.valorExecutado !== undefined ? item.valorExecutado : item.valor)}</div>
                            {item.valorExecutado !== undefined && item.valorExecutado !== item.valor && (
                              <div style={{ fontSize: '10px', color: item.valorExecutado > item.valor ? '#f87171' : '#34d399', fontWeight: 700 }}>
                                {item.valorExecutado > item.valor ? `+${formatMoney(item.valorExecutado - item.valor)} (Juros)` : `-${formatMoney(item.valor - item.valorExecutado)} (Desconto)`}
                              </div>
                            )}
                            {item.valorExecutado !== undefined && (
                              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>Previsto: {formatMoney(item.valor)}</div>
                            )}
                          </td>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>
                            <div>{item.banco}</div>
                            {item.temOP && <span style={{ color: '#38bdf8', fontSize: '10px', display: 'block' }}>OP: {item.numeroOP}</span>}
                          </td>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>{formatDate(item.vencimento)}</td>

                          {/* Anexos PDF */}
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              {item.pdfOP ? (
                                <button
                                  type="button"
                                  onClick={() => abrirPDF(item.pdfOP)}
                                  style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title={item.pdfOP.name || 'Ver Documento OP'}
                                >
                                  <FileText size={11} /> 📄 PDF OP
                                </button>
                              ) : null}

                              {item.pdfComprovante ? (
                                <button
                                  type="button"
                                  onClick={() => abrirPDF(item.pdfComprovante)}
                                  style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title={item.pdfComprovante.name || 'Ver Comprovante de Pagamento'}
                                >
                                  <FileText size={11} /> 📑 Comprovante PDF
                                </button>
                              ) : null}

                              {!item.pdfOP && !item.pdfComprovante && (
                                <span style={{ color: '#64748b', fontSize: '11px' }}>Sem anexos</span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, background: sit.bg, color: sit.color }}>
                              {sit.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {modalDetalhesCard.targetTab && (
                <button
                  onClick={() => {
                    setActiveTab(modalDetalhesCard.targetTab);
                    setModalDetalhesCard(null);
                  }}
                  style={{ padding: '8px 14px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowRight size={14} /> Ir para a aba correspondente na esteira
                </button>
              )}
              <button
                onClick={() => setModalDetalhesCard(null)}
                style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}
              >
                Fechar Detalhes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL GERENCIAR EMPRESAS (+) */}
      {showNovoEmpresaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={18} color="#60a5fa" />
                Gerenciar Empresas
              </h3>
              <button onClick={() => setShowNovoEmpresaModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdicionarEmpresa} style={{ marginBottom: '20px' }}>
              <input
                type="text"
                autoFocus
                placeholder="Nome da Nova Empresa..."
                value={novoEmpresaInput}
                onChange={(e) => setNovoEmpresaInput(e.target.value.toUpperCase())}
                style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', marginBottom: '8px' }}
              />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                + Adicionar Empresa
              </button>
            </form>
            
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <h4 style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Empresas Cadastradas</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {empresas.map(emp => (
                  <div key={emp} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <span style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 600 }}>{emp}</span>
                    <button 
                      onClick={() => handleExcluirEmpresa(emp)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Excluir Empresa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR NOVO DEPARTAMENTO (+) */}
      {showNovoDeptoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#60a5fa" />
                Cadastrar Novo Departamento
              </h3>
              <button onClick={() => setShowNovoDeptoModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdicionarDepto}>
              <input
                type="text"
                placeholder="Ex: Auditoria, Marketing, Engenharia..."
                value={novoDeptoInput}
                onChange={(e) => setNovoDeptoInput(e.target.value)}
                style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', marginBottom: '16px' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowNovoDeptoModal(false)} style={{ padding: '8px 14px', background: 'rgba(51, 65, 85, 0.6)', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '12px' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR NOVO BANCO (+) */}
      {showNovoBancoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#60a5fa" />
                Cadastrar Novo Banco
              </h3>
              <button onClick={() => setShowNovoBancoModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdicionarBanco}>
              <input
                type="text"
                placeholder="Ex: BTG Pactual, SBD, Safra, Sicoob..."
                value={novoBancoInput}
                onChange={(e) => setNovoBancoInput(e.target.value)}
                style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', marginBottom: '16px' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowNovoBancoModal(false)} style={{ padding: '8px 14px', background: 'rgba(51, 65, 85, 0.6)', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '12px' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE APROVAÇÃO / REPROVAÇÃO COM CAMPO DE OBSERVAÇÃO */}
      {modalAprovacao && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: modalAprovacao.acao === 'APROVAR' ? '#34d399' : '#f87171', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {modalAprovacao.acao === 'APROVAR' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                {modalAprovacao.acao === 'APROVAR' ? 'Aprovar Despesa' : 'Reprovar Despesa'}
              </h3>
              <button onClick={() => setModalAprovacao(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>{modalAprovacao.despesa.nome}</div>
              <div style={{ color: '#60a5fa', fontWeight: 800, marginTop: '4px', fontSize: '15px' }}>{formatMoney(modalAprovacao.despesa.valor)}</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                Empresa: <strong>{modalAprovacao.despesa.empresa}</strong> | Dep: {modalAprovacao.despesa.departamento}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Observação da {modalAprovacao.acao === 'APROVAR' ? 'Aprovação' : 'Recusa'} (Obrigatório/Justificativa):
              </label>
              <textarea
                rows={3}
                placeholder={modalAprovacao.acao === 'APROVAR' ? 'Ex: Aprovado conforme orçamento validado pela diretoria.' : 'Ex: Reprovado devido à falta de cota orçamentária.'}
                value={obsAprovacaoInput}
                onChange={(e) => setObsAprovacaoInput(e.target.value)}
                style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalAprovacao(null)}
                style={{ padding: '10px 16px', background: 'rgba(51, 65, 85, 0.6)', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarAnalise}
                style={{
                  padding: '10px 20px',
                  background: modalAprovacao.acao === 'APROVAR' ? '#10b981' : '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirmar {modalAprovacao.acao === 'APROVAR' ? 'Aprovação' : 'Reprovação'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR PAGAMENTO COM DIGITAÇÃO DE VALOR EXECUTADO */}
      {modalConfirmarPagamento && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '16px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={22} color="#34d399" />
                Confirmar Pagamento da Despesa
              </h3>
              <button onClick={() => setModalConfirmarPagamento(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Resumo da despesa */}
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
              <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>{modalConfirmarPagamento.nome}</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                Empresa: <strong style={{ color: '#e2e8f0' }}>{modalConfirmarPagamento.empresa}</strong> | Depto: <strong style={{ color: '#e2e8f0' }}>{modalConfirmarPagamento.departamento}</strong>
              </div>
              <div style={{ color: '#60a5fa', fontWeight: 700, marginTop: '6px', fontSize: '13px' }}>
                Valor Previsto Original: {formatMoney(modalConfirmarPagamento.valor)}
              </div>
            </div>

            <form onSubmit={handleSalvarConfirmarPagamento} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Campo Valor Executado */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                  Valor Executado (Pago Efetivo em R$) *
                </label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={valorExecutadoInput}
                  onChange={(e) => setValorExecutadoInput(e.target.value)}
                  placeholder="Digite o valor efetivamente pago..."
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.8)', border: '2px solid rgba(52, 211, 153, 0.5)', borderRadius: '8px', color: '#f8fafc', fontSize: '16px', fontWeight: 800, fontFamily: 'monospace' }}
                  autoFocus
                />
                {/* Cálculo de Diferença em Tempo Real */}
                {(() => {
                  const valExec = parseFloat(valorExecutadoInput) || 0;
                  const dif = valExec - modalConfirmarPagamento.valor;
                  if (Math.abs(dif) < 0.01) {
                    return <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>✓ Valor executado igual ao previsto original (100%).</div>;
                  }
                  if (dif > 0) {
                    return <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, marginTop: '4px' }}>⚠️ Acréscimo / Juros: +{formatMoney(dif)} em relação ao previsto.</div>;
                  }
                  return <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, marginTop: '4px' }}>🎉 Desconto / Economia: -{formatMoney(Math.abs(dif))} em relação ao previsto.</div>;
                })()}
              </div>

              {/* Data do Pagamento */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  Data do Pagamento *
                </label>
                <input 
                  type="date"
                  required
                  value={dataPagamentoInput}
                  onChange={(e) => setDataPagamentoInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              {/* Observação */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Observação / N. Autenticação Comprovante (opcional)
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Comprovante Pix #984102 / Pago com desconto negociado..."
                  value={obsPagamentoInput}
                  onChange={(e) => setObsPagamentoInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              {/* Anexo Comprovante PDF */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                  Anexo Comprovante de Pagamento (PDF)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.type !== 'application/pdf') {
                        alert('Por favor, selecione apenas arquivos PDF.');
                        e.target.value = '';
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setPdfComprovanteInput({ name: file.name, dataUrl: ev.target.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(52, 211, 153, 0.4)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                {pdfComprovanteInput && (
                  <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    📑 Comprovante: {pdfComprovanteInput.name}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalConfirmarPagamento(null)}
                  style={{ padding: '10px 16px', background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)' }}
                >
                  <CheckCircle2 size={16} /> Confirmar & Baixar Pagamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO COMPLETA DA DESPESA (DISPONÍVEL NA ABA 1) */}
      {modalEditarDespesa && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '24px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#60a5fa', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} />
                Editar Despesa Cadastrada por Completo
              </h3>
              <button onClick={() => setModalEditarDespesa(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSalvarEdicaoCompleta} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              
              {/* Empresa */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Empresa do Grupo *
                </label>
                <select
                  value={modalEditarDespesa.empresa}
                  onChange={(e) => {
                    if (e.target.value === 'NOVA_EMPRESA') {
                      setShowNovoEmpresaModal(true);
                    } else {
                      setModalEditarDespesa({ ...modalEditarDespesa, empresa: e.target.value });
                    }
                  }}
                  style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700 }}
                >
                  {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                  <option value="NOVA_EMPRESA">+ Gerenciar Empresas</option>
                </select>
              </div>

              {/* Departamento */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Departamento *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={modalEditarDespesa.departamento}
                    onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, departamento: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  >
                    {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNovoDeptoModal(true)}
                    style={{ padding: '8px 10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '8px', cursor: 'pointer' }}
                    title="Cadastrar Novo Departamento"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Nome / Descrição */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Nome / Descrição da Despesa *
                </label>
                <input
                  type="text"
                  value={modalEditarDespesa.nome}
                  onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, nome: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600 }}
                />
              </div>

              {/* Valor */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={modalEditarDespesa.valor}
                  onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, valor: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #3b82f6', borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 800 }}
                />
              </div>

              {/* Parcelas */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Quantidade de Parcelas *
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={modalEditarDespesa.parcelas}
                  onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, parcelas: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              {/* Data de Vencimento */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  value={modalEditarDespesa.vencimento}
                  onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, vencimento: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', colorScheme: 'dark' }}
                />
              </div>

              {/* Banco Pagador */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Banco Pagador *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={modalEditarDespesa.banco}
                    onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, banco: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="">Selecione o Banco...</option>
                    {bancosComSaldo.length > 0
                      ? bancosComSaldo.map(b => <option key={b.id} value={b.nome}>{b.nome} ({b.empresa || 'AÇOFORTE'})</option>)
                      : bancos.map(b => <option key={b} value={b}>{b}</option>)
                    }
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNovoBancoModal(true)}
                    style={{ padding: '8px 10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '8px', cursor: 'pointer' }}
                    title="Cadastrar Novo Banco"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Forma de Pagamento *
                </label>
                <select
                  value={modalEditarDespesa.formaPagamento}
                  onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, formaPagamento: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  {FORMAS_PAGAMENTO.map(fp => <option key={fp} value={fp}>{fp}</option>)}
                </select>
              </div>

              {/* Prioridade */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Prioridade *
                </label>
                <select
                  value={modalEditarDespesa.prioridade}
                  onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, prioridade: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700 }}
                >
                  {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              {/* Possui OP? */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginTop: '14px' }}>
                  <input
                    type="checkbox"
                    checked={modalEditarDespesa.temOP}
                    onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, temOP: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                  />
                  <span>Possui OP (Ordem de Pagamento)?</span>
                </label>
              </div>

              {/* Número da OP e Anexo PDF (Condicional) */}
              {modalEditarDespesa.temOP && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#60a5fa', marginBottom: '6px' }}>
                      Número da OP *
                    </label>
                    <input
                      type="text"
                      value={modalEditarDespesa.numeroOP}
                      onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, numeroOP: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #3b82f6', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#60a5fa', marginBottom: '6px' }}>
                      Anexo Documento da OP (PDF)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.type !== 'application/pdf') {
                            alert('Por favor, selecione apenas arquivos PDF.');
                            e.target.value = '';
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setModalEditarDespesa(prev => ({
                              ...prev,
                              pdfOP: { name: file.name, dataUrl: ev.target.result }
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ width: '100%', padding: '8px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    {modalEditarDespesa.pdfOP && (
                      <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        📄 {modalEditarDespesa.pdfOP.name}
                        <button
                          type="button"
                          onClick={() => abrirPDF(modalEditarDespesa.pdfOP)}
                          style={{ marginLeft: '6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          Ver
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Observações */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Observações do Lançamento
                </label>
                <textarea
                  rows={3}
                  value={modalEditarDespesa.observacao}
                  onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, observacao: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              {/* Botões do Modal */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModalEditarDespesa(null)}
                  style={{ padding: '10px 18px', background: 'rgba(51, 65, 85, 0.6)', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Salvar Alterações da Despesa
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL CADASTRAR / EDITAR BANCO COM SALDO */}
      {showModalBancoSaldo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '16px', padding: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#c084fc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={20} color="#c084fc" />
                {formBancoSaldo.id ? 'Editar Banco & Saldo' : 'Cadastrar Novo Banco com Saldo'}
              </h3>
              <button onClick={() => setShowModalBancoSaldo(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSalvarBancoSaldo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                  Empresa Vinculada *
                </label>
                <select
                  value={formBancoSaldo.empresa}
                  onChange={(e) => {
                    if (e.target.value === 'NOVA_EMPRESA') {
                      setShowNovoEmpresaModal(true);
                    } else {
                      setFormBancoSaldo({ ...formBancoSaldo, empresa: e.target.value });
                    }
                  }}
                  style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  {empresas.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                  <option value="NOVA_EMPRESA">+ Gerenciar Empresas</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                  Nome da Instituição Bancária *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Itaú Unibanco, Bradesco, Santander..."
                  value={formBancoSaldo.nome}
                  onChange={(e) => setFormBancoSaldo({ ...formBancoSaldo, nome: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    Agência
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 0412"
                    value={formBancoSaldo.agencia}
                    onChange={(e) => setFormBancoSaldo({ ...formBancoSaldo, agencia: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    Número da Conta
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 48201-9"
                    value={formBancoSaldo.conta}
                    onChange={(e) => setFormBancoSaldo({ ...formBancoSaldo, conta: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                  Saldo Inicial da Conta (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 150000.00"
                  value={formBancoSaldo.saldoInicial}
                  onChange={(e) => setFormBancoSaldo({ ...formBancoSaldo, saldoInicial: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '2px solid #34d399', borderRadius: '8px', color: '#34d399', fontSize: '16px', fontWeight: 800, fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModalBancoSaldo(false)}
                  style={{ padding: '10px 16px', background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Salvar Banco & Saldo
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL LANÇAR ENTRADA DE RECURSOS */}
      {showModalEntradaRecursos && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#60a5fa', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowUpRight size={20} color="#60a5fa" />
                Lançar Entrada de Recursos (Aporte / Receita)
              </h3>
              <button onClick={() => setShowModalEntradaRecursos(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCadastrarEntradaRecursos} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                  Descrição da Entrada *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Faturamento Cliente Obra X / Aporte dos Sócios..."
                  value={formEntradaRecursos.descricao}
                  onChange={(e) => setFormEntradaRecursos({ ...formEntradaRecursos, descricao: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>
                    Valor Creditado (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 50000.00"
                    value={formEntradaRecursos.valor}
                    onChange={(e) => setFormEntradaRecursos({ ...formEntradaRecursos, valor: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '2px solid #34d399', borderRadius: '8px', color: '#34d399', fontSize: '15px', fontWeight: 800, fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Data da Entrada *
                  </label>
                  <input
                    type="date"
                    required
                    value={formEntradaRecursos.dataEntrada}
                    onChange={(e) => setFormEntradaRecursos({ ...formEntradaRecursos, dataEntrada: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#60a5fa', marginBottom: '6px' }}>
                  Banco de Destino (Creditado) *
                </label>
                <select
                  required
                  value={formEntradaRecursos.bancoId}
                  onChange={(e) => setFormEntradaRecursos({ ...formEntradaRecursos, bancoId: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #60a5fa', borderRadius: '8px', color: '#60a5fa', fontSize: '13px', fontWeight: 700 }}
                >
                  <option value="">Selecione a Conta Bancária...</option>
                  {bancosComSaldo.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nome} (Saldo Atual: {formatMoney(b.saldoAtual)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Categoria de Origem
                </label>
                <select
                  value={formEntradaRecursos.categoria}
                  onChange={(e) => setFormEntradaRecursos({ ...formEntradaRecursos, categoria: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="Faturamento / Vendas">Faturamento / Vendas</option>
                  <option value="Aporte / Capital">Aporte / Capital de Sócios</option>
                  <option value="Rendimento Aplicação">Rendimento de Aplicação</option>
                  <option value="Reembolso / Estorno">Reembolso / Estorno</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Observações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ref NFe #8841..."
                  value={formEntradaRecursos.observacao}
                  onChange={(e) => setFormEntradaRecursos({ ...formEntradaRecursos, observacao: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModalEntradaRecursos(false)}
                  style={{ padding: '10px 16px', background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}
                >
                  Confirmar Crédito na Conta
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: RECEBIMENTO DE FATURA */}
      {modalRecebimentoFatura && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0f172a', padding: '32px', borderRadius: '20px', width: '90%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={22} color="#10b981" />
              Registrar Recebimento
            </h2>

            <form onSubmit={handleReceberFatura} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Data do Recebimento
                </label>
                <input
                  required
                  type="date"
                  value={modalRecebimentoFatura.dataRecebimento}
                  onChange={(e) => setModalRecebimentoFatura({ ...modalRecebimentoFatura, dataRecebimento: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Valor Real Recebido (R$)
                </label>
                <input
                  required
                  type="text"
                  value={modalRecebimentoFatura.valorRecebido}
                  onChange={(e) => setModalRecebimentoFatura({ ...modalRecebimentoFatura, valorRecebido: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#10b981', fontSize: '18px', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Banco de Destino (Conta que recebeu o dinheiro)
                </label>
                <select
                  required
                  value={modalRecebimentoFatura.bancoDestino}
                  onChange={(e) => setModalRecebimentoFatura({ ...modalRecebimentoFatura, bancoDestino: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="">Selecione o Banco...</option>
                  {bancosComSaldo.map(b => (
                    <option key={b.id} value={b.id}>{b.nome} (Ag: {b.agencia} / Cc: {b.conta})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalRecebimentoFatura(null)}
                  style={{ padding: '10px 16px', background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GERENCIAR CLIENTES (FATURAMENTO) */}
      {showModalClientesFat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0f172a', padding: '32px', borderRadius: '20px', width: '90%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={20} color="#fbbf24" />
                Gerenciar Clientes (Faturamento)
              </h2>
              <button onClick={() => setShowModalClientesFat(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddClienteFat} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                required
                type="text"
                placeholder="Nome do Novo Cliente"
                value={novoClienteFat}
                onChange={(e) => setNovoClienteFat(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              />
              <button type="submit" style={{ padding: '0 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={18} />
              </button>
            </form>

            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #334155', borderRadius: '8px', background: 'rgba(30,41,59,0.3)' }}>
              {clientesFaturamento.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Nenhum cliente cadastrado.</div>
              ) : (
                clientesFaturamento.map((cli, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #334155' }}>
                    <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600 }}>{cli}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveClienteFat(cli)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      title="Remover Cliente"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 3: FATURAMENTO */}
      {/* SEÇÃO 3: FATURAMENTO */}
      {moduloSubSecao === 'faturamento' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Menu de Sub-abas (Faturamento) */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', overflowX: 'auto' }}>
            <button
              onClick={() => setSubTabFaturamento('fila')}
              style={{
                background: subTabFaturamento === 'fila' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: subTabFaturamento === 'fila' ? '#fbbf24' : '#94a3b8',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <Layers size={16} />
              Fila de Recebimento ({faturas.filter(f => f.status === 'pendente').length})
            </button>
            <button
              onClick={() => setSubTabFaturamento('nova')}
              style={{
                background: subTabFaturamento === 'nova' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: subTabFaturamento === 'nova' ? '#fbbf24' : '#94a3b8',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <PlusCircle size={16} />
              Nova Fatura (NFe)
            </button>
            <button
              onClick={() => setSubTabFaturamento('recebidas')}
              style={{
                background: subTabFaturamento === 'recebidas' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: subTabFaturamento === 'recebidas' ? '#fbbf24' : '#94a3b8',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <CheckCircle2 size={16} />
              Histórico Recebidas
            </button>
          </div>

          {/* CONTEÚDO: NOVA FATURA */}
          {subTabFaturamento === 'nova' && (
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#f8fafc', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#fbbf24" /> Lançar Nova Fatura no Sistema
              </h3>
              
              <form onSubmit={handleCadastrarFatura} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Empresa Emissora</label>
                  <select
                    required
                    value={formNovaFatura.empresa}
                    onChange={(e) => setFormNovaFatura({ ...formNovaFatura, empresa: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="">Selecione a Empresa...</option>
                    {empresas.map((emp, idx) => (
                      <option key={idx} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    <span>Cliente (Base Efetivo + Manuais)</span>
                    <button
                      type="button"
                      onClick={() => setShowModalClientesFat(true)}
                      style={{ background: 'transparent', border: 'none', color: '#fbbf24', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit size={12} /> Gerenciar Clientes
                    </button>
                  </label>
                  <select
                    required
                    value={formNovaFatura.cliente}
                    onChange={(e) => setFormNovaFatura({ ...formNovaFatura, cliente: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="">Selecione o Cliente...</option>
                    {clientesFaturamento.map((cli, idx) => (
                      <option key={idx} value={cli}>{cli}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Número da NFe</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: 8852"
                    value={formNovaFatura.numeroNota}
                    onChange={(e) => setFormNovaFatura({ ...formNovaFatura, numeroNota: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Valor Bruto da Nota (R$)</label>
                  <input
                    required
                    type="text"
                    placeholder="0,00"
                    value={formNovaFatura.valorBruto}
                    onChange={(e) => setFormNovaFatura({ ...formNovaFatura, valorBruto: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Valor Glosa (Opcional)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={formNovaFatura.valorGlosa}
                    onChange={(e) => setFormNovaFatura({ ...formNovaFatura, valorGlosa: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Impostos Retidos (Opcional)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={formNovaFatura.valorImpostos}
                    onChange={(e) => setFormNovaFatura({ ...formNovaFatura, valorImpostos: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Retenção/Penhora (Opcional)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={formNovaFatura.valorRetencao}
                    onChange={(e) => setFormNovaFatura({ ...formNovaFatura, valorRetencao: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Data Prevista para Pagamento</label>
                  <input
                    required
                    type="date"
                    value={formNovaFatura.dataPrevista}
                    onChange={(e) => setFormNovaFatura({ ...formNovaFatura, dataPrevista: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', colorScheme: 'dark' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Banco Previsto p/ Recebimento</label>
                  <select
                    value={formNovaFatura.bancoPrevisto}
                    onChange={(e) => setFormNovaFatura({ ...formNovaFatura, bancoPrevisto: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="">Selecione...</option>
                    {bancosComSaldo.map(b => (
                      <option key={b.id} value={b.id}>{b.nome} (Ag: {b.agencia} / Cc: {b.conta})</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Observações</label>
                  <input
                    type="text"
                    placeholder="Ex: Fatura referente ao posto A, contrato B..."
                    value={formNovaFatura.observacao}
                    onChange={(e) => setFormNovaFatura({ ...formNovaFatura, observacao: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Valor Líquido a Receber</span>
                    <strong style={{ fontSize: '20px', color: '#fbbf24' }}>
                      {formatMoney(
                        (parseFloat(formNovaFatura.valorBruto.replace(',','.') || 0)) -
                        (parseFloat(formNovaFatura.valorGlosa.replace(',','.') || 0)) -
                        (parseFloat(formNovaFatura.valorImpostos.replace(',','.') || 0)) -
                        (parseFloat(formNovaFatura.valorRetencao.replace(',','.') || 0))
                      )}
                    </strong>
                  </div>
                  <button type="submit" style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)' }}>
                    Cadastrar Fatura e Enviar p/ Fila
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CONTEÚDO: FILA DE RECEBIMENTO */}
          {subTabFaturamento === 'fila' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px' }}>NFe / Empresa</th>
                    <th style={{ padding: '12px' }}>Cliente</th>
                    <th style={{ padding: '12px' }}>Previsão</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Valor NFe</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Descontos</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#fbbf24' }}>A Receber</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.filter(f => f.status === 'pendente').length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Nenhuma fatura nesta lista.</td></tr>
                  ) : (
                    faturas.filter(f => f.status === 'pendente').map((fat, idx) => (
                      <tr key={fat.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '12px', color: '#cbd5e1', fontWeight: 700 }}>
                          #{fat.numeroNota}
                          {fat.empresa && <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>{fat.empresa}</span>}
                        </td>
                        <td style={{ padding: '12px', color: '#f8fafc', fontWeight: 600 }}>{fat.cliente}</td>
                        <td style={{ padding: '12px', color: new Date(fat.dataPrevista) < new Date() ? '#ef4444' : '#94a3b8' }}>
                          {formatDate(fat.dataPrevista)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{formatMoney(fat.valorBruto)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444' }}>
                          {(fat.valorGlosa || 0) + (fat.valorImpostos || 0) + (fat.valorRetencao || 0) > 0 ? `-${formatMoney((fat.valorGlosa || 0) + (fat.valorImpostos || 0) + (fat.valorRetencao || 0))}` : '-'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#fbbf24', fontSize: '14px' }}>
                          {formatMoney(fat.valorReceber)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => setModalRecebimentoFatura({ id: fat.id, valorRecebido: fat.valorReceber.toFixed(2).replace('.', ','), bancoDestino: fat.bancoPrevistoId || bancosComSaldo[0]?.id || '', dataRecebimento: new Date().toISOString().slice(0, 10) })}
                              title="Registrar Recebimento"
                              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <CheckCircle2 size={14} /> Receber
                            </button>
                            {currentUser?.role === 'MASTER' && (
                              <button
                                onClick={() => handleDeleteFatura(fat.id)}
                                title="Excluir Fatura"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={16} color="#ef4444" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CONTEÚDO: HISTÓRICO RECEBIDAS */}
          {subTabFaturamento === 'recebidas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Filtros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', background: 'rgba(30,41,59,0.5)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Empresa</label>
                  <select
                    value={filtrosHistoricoFaturas.empresa}
                    onChange={(e) => setFiltrosHistoricoFaturas({...filtrosHistoricoFaturas, empresa: e.target.value})}
                    style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value="">Todas</option>
                    {empresas.map((emp, i) => <option key={i} value={emp}>{emp}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Cliente</label>
                  <select
                    value={filtrosHistoricoFaturas.cliente}
                    onChange={(e) => setFiltrosHistoricoFaturas({...filtrosHistoricoFaturas, cliente: e.target.value})}
                    style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value="">Todos</option>
                    {clientesFaturamento.map((cli, i) => <option key={i} value={cli}>{cli}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Mês</label>
                  <input
                    type="month"
                    value={filtrosHistoricoFaturas.mes}
                    onChange={(e) => setFiltrosHistoricoFaturas({...filtrosHistoricoFaturas, mes: e.target.value})}
                    style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '12px', colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Banco</label>
                  <select
                    value={filtrosHistoricoFaturas.banco}
                    onChange={(e) => setFiltrosHistoricoFaturas({...filtrosHistoricoFaturas, banco: e.target.value})}
                    style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value="">Todos</option>
                    {bancosComSaldo.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => setFiltrosHistoricoFaturas({empresa: '', cliente: '', mes: '', banco: ''})}
                    style={{ width: '100%', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>

              {/* Tabela */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>Data Receb. / NFe</th>
                      <th style={{ padding: '12px' }}>Cliente / Empresa</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Valor NFe</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Descontos</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>Recebido</th>
                      <th style={{ padding: '12px' }}>Banco Destino</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let fFiltradas = faturas.filter(f => f.status === 'recebida');
                      if (filtrosHistoricoFaturas.empresa) fFiltradas = fFiltradas.filter(f => f.empresa === filtrosHistoricoFaturas.empresa);
                      if (filtrosHistoricoFaturas.cliente) fFiltradas = fFiltradas.filter(f => f.cliente === filtrosHistoricoFaturas.cliente);
                      if (filtrosHistoricoFaturas.banco) fFiltradas = fFiltradas.filter(f => f.bancoRecebimentoId === filtrosHistoricoFaturas.banco);
                      if (filtrosHistoricoFaturas.mes) fFiltradas = fFiltradas.filter(f => f.dataRecebimento && f.dataRecebimento.startsWith(filtrosHistoricoFaturas.mes));

                      if (fFiltradas.length === 0) {
                        return <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Nenhuma fatura encontrada.</td></tr>;
                      }

                      return fFiltradas.map((fat, idx) => (
                        <tr key={fat.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '12px', color: '#f8fafc', fontWeight: 700 }}>
                            {formatDate(fat.dataRecebimento)}
                            <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>NFe #{fat.numeroNota}</span>
                          </td>
                          <td style={{ padding: '12px', color: '#f8fafc', fontWeight: 600 }}>
                            {fat.cliente}
                            <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>{fat.empresa || 'Sem Empresa'}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{formatMoney(fat.valorBruto)}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444' }}>
                            {(fat.valorGlosa || 0) + (fat.valorImpostos || 0) + (fat.valorRetencao || 0) > 0 ? `-${formatMoney((fat.valorGlosa || 0) + (fat.valorImpostos || 0) + (fat.valorRetencao || 0))}` : '-'}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span>{formatMoney(fat.valorRecebido)}</span>
                              {Math.abs(fat.valorRecebido - fat.valorReceber) < 0.01 ? (
                                <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>OK</span>
                              ) : fat.valorRecebido < fat.valorReceber ? (
                                <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>A MENOR</span>
                              ) : (
                                <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700 }}>A MAIOR</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                              {bancosComSaldo.find(b => b.id === fat.bancoRecebimentoId)?.nome || 'Banco Excluído'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {currentUser?.role === 'MASTER' && (
                              <button
                                onClick={() => handleDeleteFatura(fat.id)}
                                title="Excluir Fatura"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={16} color="#ef4444" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
      {/* MODAL DE AUDITORIA */}
      {showModalAuditoria && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e293b', width: '900px', maxWidth: '95vw', height: '80vh', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#ef4444" /> Logs de Auditoria do Financeiro (Local)
              </h3>
              <button onClick={() => setShowModalAuditoria(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
              {logsAuditoria.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Nenhum log registrado ainda.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Data/Hora</th>
                      <th style={{ padding: '12px' }}>Usuário</th>
                      <th style={{ padding: '12px' }}>Ação</th>
                      <th style={{ padding: '12px' }}>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsAuditoria.map((log, idx) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '10px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{new Date(log.data).toLocaleString()}</td>
                        <td style={{ padding: '10px', color: '#f8fafc', fontWeight: 'bold' }}>{log.usuario}</td>
                        <td style={{ padding: '10px' }}><span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>{log.acao}</span></td>
                        <td style={{ padding: '10px', color: '#94a3b8' }}>{log.detalhes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
