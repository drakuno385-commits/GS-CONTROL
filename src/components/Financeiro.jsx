import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, PlusCircle, Clock, CheckCircle2, XCircle, FileText, 
  Building, Calendar, CreditCard, Shield, AlertTriangle, Filter, 
  Search, Download, Trash2, Eye, MessageSquare, Check, X, ArrowUpRight,
  TrendingUp, TrendingDown, Layers, Percent, Tag, RefreshCw, Plus, Sparkles,
  Archive, Landmark, CheckCheck, RotateCcw, ArrowRight, Edit2, Send, AlertOctagon
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, ComposedChart, Line 
} from 'recharts';

const EMPRESAS = ['AÇOFORTE', 'BELLS', 'LGA', 'REGIONAL', 'LÓGICA'];

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
    border: 'rgba(245, 158, 11, 0.4)',
    proximo: 'PAGO',
    acao: 'Marcar como Paga',
    proximoBadge: '✓ Marcar Paga'
  },
  PAGO: {
    label: 'Pago',
    badge: '✓ PAGO',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.4)',
    proximo: 'PENDENTE_CONCILIACAO',
    acao: 'Enviar p/ Conciliação',
    proximoBadge: '🏦 Enviar p/ Conciliação'
  },
  PENDENTE_CONCILIACAO: {
    label: 'Pendente de Conciliação',
    badge: '🏦 Pendente de Conciliação',
    color: '#60a5fa',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.4)',
    proximo: 'ARQUIVADO',
    acao: 'Conciliar & Arquivar',
    proximoBadge: '📦 Conciliar & Arquivar'
  },
  ARQUIVADO: {
    label: 'Arquivada',
    badge: '📦 Arquivada',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.4)',
    proximo: 'PENDENTE_CONCILIACAO',
    acao: 'Desarquivar',
    proximoBadge: '🔄 Desarquivar'
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

// Helper para calcular a data da última parcela
const calcularUltimoVencimento = (vencimentoInicialStr, numParcelas) => {
  if (!vencimentoInicialStr) return '-';
  try {
    const [y, m, d] = vencimentoInicialStr.split('-').map(Number);
    const n = Math.max(1, parseInt(numParcelas, 10) || 1);
    if (!y || !m || !d) return vencimentoInicialStr;

    const data = new Date(y, m - 1 + (n - 1), d);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch (e) {
    return vencimentoInicialStr;
  }
};

const DESPESAS_INICIAIS = [
  {
    id: 'fin_1001',
    empresa: 'AÇOFORTE',
    departamento: 'Frota',
    nome: 'Combustível da Frota de Viaturas - Quinzena',
    valor: 28450.00,
    parcelas: 1,
    vencimento: '2026-09-25',
    temOP: true,
    numeroOP: 'OP-2026-8841',
    banco: 'Itaú',
    formaPagamento: 'Boleto',
    prioridade: 'ALTA',
    observacao: 'Fatura de abastecimento dos veículos da regional RMSP.',
    status: 'CADASTRADA',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    dataConciliacao: null,
    dataArquivamento: null,
    obsAprovacao: '',
    dataCriacao: '2026-09-01'
  },
  {
    id: 'fin_1002',
    empresa: 'BELLS',
    departamento: 'Operacional',
    nome: 'Manutenção de Equipamentos de CFTV e Portaria',
    valor: 14200.00,
    parcelas: 2,
    vencimento: '2026-09-20',
    temOP: true,
    numeroOP: 'OP-2026-9012',
    banco: 'Bradesco',
    formaPagamento: 'Transferência / TED',
    prioridade: 'CRÍTICA',
    observacao: 'Conserto de nobreaks e câmeras do posto Centro Operacional Gopouva.',
    status: 'CADASTRADA',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    dataConciliacao: null,
    dataArquivamento: null,
    obsAprovacao: '',
    dataCriacao: '2026-09-02'
  },
  {
    id: 'fin_1008',
    empresa: 'REGIONAL',
    departamento: 'Suprimentos',
    nome: 'Compra Urgente de EPIs e Equipamentos de Segurança',
    valor: 19800.00,
    parcelas: 1,
    vencimento: '2026-09-01',
    temOP: true,
    numeroOP: 'OP-2026-5510',
    banco: 'Banco do Brasil',
    formaPagamento: 'Boleto',
    prioridade: 'CRÍTICA',
    observacao: 'Lote emergencial de equipamentos para novos vigilantes.',
    status: 'LANCADA',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    dataConciliacao: null,
    dataArquivamento: null,
    obsAprovacao: 'Lançado para pagamento urgente.',
    dataCriacao: '2026-08-20'
  },
  {
    id: 'fin_1003',
    empresa: 'REGIONAL',
    departamento: 'RH',
    nome: 'Compra de Uniformes e Coturnos para Vigilantes',
    valor: 45800.00,
    parcelas: 3,
    vencimento: '2026-09-18',
    temOP: false,
    numeroOP: '',
    banco: 'Banco do Brasil',
    formaPagamento: 'Boleto',
    prioridade: 'MÉDIA',
    observacao: 'Lote de coturnos, coletes e jaquetas para os novos postos.',
    status: 'LANCADA',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    dataConciliacao: null,
    dataArquivamento: null,
    obsAprovacao: 'Aprovado e lançado para pagamento.',
    dataCriacao: '2026-08-28'
  },
  {
    id: 'fin_1004',
    empresa: 'LGA',
    departamento: 'TI',
    nome: 'Licenciamento de Software de Monitoramento e Nuvem',
    valor: 8900.00,
    parcelas: 1,
    vencimento: '2026-09-05',
    temOP: true,
    numeroOP: 'OP-2026-7734',
    banco: 'Santander',
    formaPagamento: 'Pix',
    prioridade: 'BAIXA',
    observacao: 'Renovação anual de servidores de banco de dados.',
    status: 'LANCADA',
    statusPagamento: 'PAGO',
    dataPagamento: '2026-09-05',
    dataConciliacao: null,
    dataArquivamento: null,
    obsAprovacao: 'Pagamento autorizado antecipadamente com desconto.',
    dataCriacao: '2026-08-25'
  },
  {
    id: 'fin_1005',
    empresa: 'LÓGICA',
    departamento: 'Suprimentos',
    nome: 'Material de Escritório e Limpeza Geral',
    valor: 3450.00,
    parcelas: 1,
    vencimento: '2026-09-12',
    temOP: false,
    numeroOP: '',
    banco: 'Pix / Caixinha',
    formaPagamento: 'Pix',
    prioridade: 'BAIXA',
    observacao: 'Abastecimento dos insumos do departamento administrativo.',
    status: 'RECUSADA',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    dataConciliacao: null,
    dataArquivamento: null,
    obsAprovacao: 'Reprovado por ultrapassar a cota mensal autorizada de suprimentos.',
    dataCriacao: '2026-09-03'
  },
  {
    id: 'fin_1006',
    empresa: 'AÇOFORTE',
    departamento: 'Comercial',
    nome: 'Serviço de Consultoria de Segurança Operacional',
    valor: 12500.00,
    parcelas: 1,
    vencimento: '2026-08-30',
    temOP: true,
    numeroOP: 'OP-2026-6621',
    banco: 'Itaú',
    formaPagamento: 'Transferência / TED',
    prioridade: 'MÉDIA',
    observacao: 'Auditoria técnica e revisão de procedimentos operacionais dos postos.',
    status: 'LANCADA',
    statusPagamento: 'PENDENTE_CONCILIACAO',
    dataPagamento: '2026-08-30',
    dataConciliacao: '2026-09-01',
    dataArquivamento: null,
    obsAprovacao: 'Aprovado.',
    dataCriacao: '2026-08-20'
  },
  {
    id: 'fin_1007',
    empresa: 'BELLS',
    departamento: 'Jurídico',
    nome: 'Taxas de Cartório e Selos Digitais - Registro de Contratos',
    valor: 1850.00,
    parcelas: 1,
    vencimento: '2026-08-15',
    temOP: false,
    numeroOP: '',
    banco: 'Bradesco',
    formaPagamento: 'Pix',
    prioridade: 'BAIXA',
    observacao: 'Emolumentos de registro em cartório de notas.',
    status: 'LANCADA',
    statusPagamento: 'ARQUIVADO',
    dataPagamento: '2026-08-15',
    dataConciliacao: '2026-08-17',
    dataArquivamento: '2026-08-18',
    obsAprovacao: 'Aprovado.',
    dataCriacao: '2026-08-10'
  }
];

export default function Financeiro({ currentUser }) {
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

  // Salvar customizações de Departamentos e Bancos no localStorage
  useEffect(() => {
    localStorage.setItem('acoweb_financeiro_deptos', JSON.stringify(departamentos));
  }, [departamentos]);

  useEffect(() => {
    localStorage.setItem('acoweb_financeiro_bancos', JSON.stringify(bancos));
  }, [bancos]);

  // Estado Principal de Despesas (versão 3 para cadastradas, lançadas e situações de vencimento)
  const [despesas, setDespesas] = useState(() => {
    const saved = localStorage.getItem('acoweb_financeiro_despesas_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch(e){}
    }
    return DESPESAS_INICIAIS;
  });

  // Salvar despesas no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('acoweb_financeiro_despesas_v3', JSON.stringify(despesas));
    } catch(e) {
      console.error('Erro ao salvar despesas no localStorage:', e);
    }
  }, [despesas]);

  // Aba Ativa (Primeira aba padrão: 'cadastradas')
  const [activeTab, setActiveTab] = useState('cadastradas');

  // Filtros Globais da Tabela
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroStatusPagamento, setFiltroStatusPagamento] = useState('TODOS');
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState('');

  // Modal de Edição de Valor da Despesa
  const [modalEditarValor, setModalEditarValor] = useState(null);
  const [novoValorInput, setNovoValorInput] = useState('');

  // Modais de Cadastro Rápido de Novo Departamento e Novo Banco
  const [showNovoDeptoModal, setShowNovoDeptoModal] = useState(false);
  const [novoDeptoInput, setNovoDeptoInput] = useState('');

  const [showNovoBancoModal, setShowNovoBancoModal] = useState(false);
  const [novoBancoInput, setNovoBancoInput] = useState('');

  // Modal de Aprovação / Reprovação
  const [modalAprovacao, setModalAprovacao] = useState(null);
  const [obsAprovacaoInput, setObsAprovacaoInput] = useState('');

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
    banco: 'Itaú',
    formaPagamento: 'Boleto',
    prioridade: 'MÉDIA',
    observacao: ''
  });

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
    setNovoBancoInput('');
    setShowNovoBancoModal(false);
  };

  // Salvar Novo Valor Editado
  const handleSalvarNovoValor = (e) => {
    e.preventDefault();
    if (!modalEditarValor) return;
    const num = parseFloat(novoValorInput);
    if (isNaN(num) || num <= 0) {
      alert('Por favor, digite um valor numérico válido.');
      return;
    }
    setDespesas(prev => prev.map(d => {
      if (d.id === modalEditarValor.id) {
        return { ...d, valor: num };
      }
      return d;
    }));
    alert('✅ Valor da despesa atualizado com sucesso!');
    setModalEditarValor(null);
    setNovoValorInput('');
  };

  // Enviar Despesa da 1ª Aba (Cadastradas) para a 2ª Aba (Lançadas p/ Pagamento)
  const handleEnviarParaPagamento = (id) => {
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
    alert('🚀 Despesa enviada para a aba "Lançadas" para pagamento e liquidação!');
  };

  // Handler de envio do formulário de nova despesa (Cria na 1ª Aba - Cadastradas)
  const handleCadastrarDespesa = (e) => {
    e.preventDefault();
    if (!formNovaDespesa.nome.trim()) return alert('Por favor, informe a descrição/nome da despesa.');
    if (!formNovaDespesa.valor || Number(formNovaDespesa.valor) <= 0) return alert('Por favor, informe um valor válido para a despesa.');
    if (formNovaDespesa.temOP && !formNovaDespesa.numeroOP.trim()) return alert('Por favor, informe o Número da OP.');

    const numParc = Math.max(1, parseInt(formNovaDespesa.parcelas, 10) || 1);

    const nova = {
      id: `fin_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      empresa: formNovaDespesa.empresa,
      departamento: formNovaDespesa.departamento,
      nome: formNovaDespesa.nome.trim(),
      valor: parseFloat(formNovaDespesa.valor) || 0,
      parcelas: numParc,
      vencimento: formNovaDespesa.vencimento,
      temOP: formNovaDespesa.temOP,
      numeroOP: formNovaDespesa.temOP ? formNovaDespesa.numeroOP.trim() : '',
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
    };

    setDespesas(prev => [nova, ...prev]);
    alert('✅ Despesa cadastrada com sucesso na aba "Despesas Cadastradas"! Você pode ajustar o valor e enviar para pagamento.');

    // Resetar formulário
    setFormNovaDespesa({
      empresa: 'AÇOFORTE',
      departamento: departamentos[0] || 'Operacional',
      nome: '',
      valor: '',
      parcelas: '1',
      vencimento: new Date().toISOString().slice(0, 10),
      temOP: false,
      numeroOP: '',
      banco: bancos[0] || 'Itaú',
      formaPagamento: 'Boleto',
      prioridade: 'MÉDIA',
      observacao: ''
    });

    // Mudar para a 1ª aba (Despesas Cadastradas)
    setActiveTab('cadastradas');
  };

  // Confirmar Aprovação ou Reprovação
  const handleConfirmarAnalise = () => {
    if (!modalAprovacao) return;
    const { despesa, acao } = modalAprovacao;

    setDespesas(prev => prev.map(d => {
      if (d.id === despesa.id) {
        return {
          ...d,
          status: acao === 'APROVAR' ? 'LANCADA' : 'RECUSADA',
          obsAprovacao: obsAprovacaoInput.trim()
        };
      }
      return d;
    }));

    alert(`Despesa ${acao === 'APROVAR' ? 'Aprovada e Lançada' : 'Reprovada'} com sucesso!`);
    setModalAprovacao(null);
    setObsAprovacaoInput('');
  };

  // Alterar status de pagamento/conciliação/arquivamento
  const handleMudarStatusPagamento = (id, novoStatus) => {
    setDespesas(prev => prev.map(d => {
      if (d.id === id) {
        const hoje = new Date().toISOString().slice(0, 10);
        return {
          ...d,
          statusPagamento: novoStatus,
          dataPagamento: novoStatus === 'PAGO' ? (d.dataPagamento || hoje) : d.dataPagamento,
          dataConciliacao: novoStatus === 'PENDENTE_CONCILIACAO' ? (d.dataConciliacao || hoje) : d.dataConciliacao,
          dataArquivamento: novoStatus === 'ARQUIVADO' ? (d.dataArquivamento || hoje) : d.dataArquivamento
        };
      }
      return d;
    }));
  };

  // Avançar status para a próxima fase do fluxo
  const handleAvancarStatusPagamento = (id) => {
    const item = despesas.find(d => d.id === id);
    if (!item) return;
    const stAtual = item.statusPagamento || 'PENDENTE_PAGAMENTO';
    const configAtual = CONFIG_STATUS_PAGAMENTO[stAtual] || CONFIG_STATUS_PAGAMENTO.PENDENTE_PAGAMENTO;
    handleMudarStatusPagamento(id, configAtual.proximo);
  };

  // Excluir Lançamento
  const handleExcluirDespesa = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa permanentemente?')) {
      setDespesas(prev => prev.filter(d => d.id !== id));
    }
  };

  // Helper para identificar a Situação Financeira do Item (Vencida, A Vencer, Pago, etc.)
  const getSituacaoItem = (item) => {
    const hoje = new Date().toISOString().slice(0, 10);
    if (item.status === 'RECUSADA') {
      return { code: 'RECUSADA', label: 'Reprovada / Não Paga', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' };
    }
    if (item.statusPagamento === 'PAGO') {
      return { code: 'PAGO', label: '✓ Pago', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' };
    }
    if (item.statusPagamento === 'PENDENTE_CONCILIACAO') {
      return { code: 'PENDENTE_CONCILIACAO', label: '🏦 Pendente Conciliação', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)' };
    }
    if (item.statusPagamento === 'ARQUIVADO') {
      return { code: 'ARQUIVADO', label: '📦 Arquivada', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' };
    }

    // Para contas em aberto:
    if (item.vencimento && item.vencimento < hoje) {
      return { code: 'VENCIDA', label: '🚨 VENCIDA', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.25)', border: '#f87171' };
    }
    return { code: 'A_VENCER', label: '⏳ A Vencer', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' };
  };

  // Estatísticas Globais das Abas e Situações Financeiras
  const estatisticas = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);

    const cadastradas = despesas.filter(d => (d.status === 'CADASTRADA' || d.status === 'AGUARDANDO_APROVACAO') && d.status !== 'RECUSADA');
    const lancadas = despesas.filter(d => (d.status === 'LANCADA' || d.status === 'APROVADA') && d.status !== 'RECUSADA');
    const recusadas = despesas.filter(d => d.status === 'RECUSADA');

    // Situações de Pagamento Globais
    const pagas = despesas.filter(d => d.statusPagamento === 'PAGO');
    const emAberto = despesas.filter(d => d.status !== 'RECUSADA' && (!d.statusPagamento || d.statusPagamento === 'PENDENTE_PAGAMENTO'));

    // Vencidas vs A Vencer
    const vencidas = emAberto.filter(d => d.vencimento && d.vencimento < hoje);
    const aVencer = emAberto.filter(d => !d.vencimento || d.vencimento >= hoje);

    const conciliacao = despesas.filter(d => d.statusPagamento === 'PENDENTE_CONCILIACAO');
    const arquivadas = despesas.filter(d => d.statusPagamento === 'ARQUIVADO');

    return {
      totalGeral: despesas.length,
      countCadastradas: cadastradas.length,
      valorCadastradas: cadastradas.reduce((a, b) => a + b.valor, 0),
      countLancadas: lancadas.length,
      valorLancadas: lancadas.reduce((a, b) => a + b.valor, 0),
      countRecusadas: recusadas.length,
      valorRecusadas: recusadas.reduce((a, b) => a + b.valor, 0),

      // 4 Situações Requisitadas:
      countPagas: pagas.length,
      valorPagas: pagas.reduce((a, b) => a + b.valor, 0),
      countEmAberto: emAberto.length,
      valorEmAberto: emAberto.reduce((a, b) => a + b.valor, 0),
      countVencidas: vencidas.length,
      valorVencidas: vencidas.reduce((a, b) => a + b.valor, 0),
      countAVencer: aVencer.length,
      valorAVencer: aVencer.reduce((a, b) => a + b.valor, 0),

      countConciliacao: conciliacao.length,
      valorConciliacao: conciliacao.reduce((a, b) => a + b.valor, 0),
      countArquivadas: arquivadas.length,
      valorArquivadas: arquivadas.reduce((a, b) => a + b.valor, 0)
    };
  }, [despesas]);

  // Lista Filtrada para a Aba Ativa
  const listaExibicao = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);

    return despesas.filter(d => {
      // 1ª Aba: Despesas Cadastradas
      if (activeTab === 'cadastradas') {
        if (d.status !== 'CADASTRADA' && d.status !== 'AGUARDANDO_APROVACAO') return false;
      }
      
      // 2ª Aba: Despesas Lançadas (confirmação de pagamento)
      if (activeTab === 'lancadas') {
        if (d.status !== 'LANCADA' && d.status !== 'APROVADA') return false;
      }
      
      if (activeTab === 'conciliacao') {
        if (d.statusPagamento !== 'PENDENTE_CONCILIACAO') return false;
      }

      if (activeTab === 'arquivadas') {
        if (d.statusPagamento !== 'ARQUIVADO') return false;
      }

      if (activeTab === 'recusadas') {
        if (d.status !== 'RECUSADA') return false;
      }

      // Filtro de Situação/Status de Pagamento (Selecione VENCIDA, A_VENCER, PAGO, etc.)
      if (filtroStatusPagamento !== 'TODOS') {
        if (filtroStatusPagamento === 'VENCIDA') {
          if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO' || !d.vencimento || d.vencimento >= hoje) return false;
        } else if (filtroStatusPagamento === 'A_VENCER') {
          if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO' || (d.vencimento && d.vencimento < hoje)) return false;
        } else if (d.statusPagamento !== filtroStatusPagamento) {
          return false;
        }
      }

      if (filtroEmpresa && d.empresa !== filtroEmpresa) return false;
      if (filtroDepartamento && d.departamento !== filtroDepartamento) return false;
      if (filtroFormaPagamento && d.formaPagamento !== filtroFormaPagamento) return false;
      
      if (filtroBusca) {
        const term = filtroBusca.toLowerCase();
        const matchNome = (d.nome || '').toLowerCase().includes(term);
        const matchOP = (d.numeroOP || '').toLowerCase().includes(term);
        const matchObs = (d.observacao || '').toLowerCase().includes(term);
        const matchEmpresa = (d.empresa || '').toLowerCase().includes(term);
        const matchDepto = (d.departamento || '').toLowerCase().includes(term);
        if (!matchNome && !matchOP && !matchObs && !matchEmpresa && !matchDepto) return false;
      }

      return true;
    });
  }, [despesas, activeTab, filtroEmpresa, filtroDepartamento, filtroFormaPagamento, filtroBusca, filtroStatusPagamento]);

  // Relatório Mensal Comparativo
  const dadosRelatorioMensal = useMemo(() => {
    const mapMeses = {};

    despesas.forEach(d => {
      if (d.status !== 'APROVADA') return;
      const mesChave = (d.vencimento || d.dataCriacao || '').substring(0, 7);
      if (!mesChave) return;

      if (!mapMeses[mesChave]) {
        mapMeses[mesChave] = { mes: mesChave, pago: 0, pendente: 0, total: 0 };
      }

      if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO') {
        mapMeses[mesChave].pago += d.valor;
      } else {
        mapMeses[mesChave].pendente += d.valor;
      }
      mapMeses[mesChave].total += d.valor;
    });

    const listaMeses = Object.values(mapMeses).sort((a, b) => a.mes.localeCompare(b.mes));

    // Totais por Empresa
    const mapEmpresa = {};
    EMPRESAS.forEach(emp => { mapEmpresa[emp] = { empresa: emp, pago: 0, pendente: 0, total: 0 }; });

    despesas.forEach(d => {
      if (d.status !== 'APROVADA') return;
      const emp = d.empresa || 'OUTROS';
      if (!mapEmpresa[emp]) mapEmpresa[emp] = { empresa: emp, pago: 0, pendente: 0, total: 0 };

      if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO') mapEmpresa[emp].pago += d.valor;
      else mapEmpresa[emp].pendente += d.valor;
      mapEmpresa[emp].total += d.valor;
    });

    // Totais por Departamento
    const mapDepto = {};
    departamentos.forEach(dep => { mapDepto[dep] = { departamento: dep, pago: 0, pendente: 0, total: 0 }; });

    despesas.forEach(d => {
      if (d.status !== 'APROVADA') return;
      const dep = d.departamento || 'OUTROS';
      if (!mapDepto[dep]) mapDepto[dep] = { departamento: dep, pago: 0, pendente: 0, total: 0 };

      if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO') mapDepto[dep].pago += d.valor;
      else mapDepto[dep].pendente += d.valor;
      mapDepto[dep].total += d.valor;
    });

    return {
      meses: listaMeses,
      empresas: Object.values(mapEmpresa),
      departamentos: Object.values(mapDepto).filter(d => d.total > 0)
    };
  }, [despesas, departamentos]);

  // Função Geradora de CSV por Filtro Específico
  const exportarCSVGenerico = (filtroTipo) => {
    let dadosFiltrados = despesas;
    let nomeArquivo = 'relatorio_financeiro';

    if (filtroTipo === 'PAGAS') {
      dadosFiltrados = despesas.filter(d => d.status === 'APROVADA' && d.statusPagamento === 'PAGO');
      nomeArquivo = 'despesas_pagas';
    } else if (filtroTipo === 'PENDENTES_PAGAMENTO') {
      dadosFiltrados = despesas.filter(d => d.status === 'APROVADA' && (d.statusPagamento || 'PENDENTE_PAGAMENTO') === 'PENDENTE_PAGAMENTO');
      nomeArquivo = 'despesas_pendentes_pagamento';
    } else if (filtroTipo === 'PENDENTES_CONCILIACAO') {
      dadosFiltrados = despesas.filter(d => d.status === 'APROVADA' && d.statusPagamento === 'PENDENTE_CONCILIACAO');
      nomeArquivo = 'despesas_pendentes_conciliacao';
    } else if (filtroTipo === 'ARQUIVADAS') {
      dadosFiltrados = despesas.filter(d => d.status === 'APROVADA' && d.statusPagamento === 'ARQUIVADO');
      nomeArquivo = 'despesas_arquivadas';
    } else if (filtroTipo === 'AGUARDANDO_APROVACAO') {
      dadosFiltrados = despesas.filter(d => d.status === 'AGUARDANDO_APROVACAO');
      nomeArquivo = 'despesas_aguardando_aprovacao';
    } else if (filtroTipo === 'RECUSADAS') {
      dadosFiltrados = despesas.filter(d => d.status === 'RECUSADA');
      nomeArquivo = 'despesas_recusadas';
    }

    const headers = ['ID', 'Empresa', 'Departamento', 'Descrição Despesa', 'Valor (R$)', 'Parcelas', 'Vencimento', 'Último Vencimento Est.', 'Tem OP', 'Num OP', 'Banco', 'Forma Pagamento', 'Prioridade', 'Status Aprovação', 'Status Fluxo Pagamento', 'Data Pagamento', 'Data Conciliação', 'Data Arquivamento', 'Obs Cadastro', 'Obs Análise'];
    
    const rows = dadosFiltrados.map(item => [
      item.id,
      `"${item.empresa || ''}"`,
      `"${item.departamento || ''}"`,
      `"${item.nome || ''}"`,
      item.valor.toFixed(2),
      item.parcelas,
      item.vencimento,
      calcularUltimoVencimento(item.vencimento, item.parcelas),
      item.temOP ? 'SIM' : 'NÃO',
      `"${item.numeroOP || ''}"`,
      `"${item.banco || ''}"`,
      `"${item.formaPagamento || ''}"`,
      item.prioridade,
      item.status,
      CONFIG_STATUS_PAGAMENTO[item.statusPagamento || 'PENDENTE_PAGAMENTO']?.label || item.statusPagamento,
      item.dataPagamento || '-',
      item.dataConciliacao || '-',
      item.dataArquivamento || '-',
      `"${item.observacao || ''}"`,
      `"${item.obsAprovacao || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ color: '#f8fafc', padding: '24px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* CABEÇALHO PRINCIPAL DA TELA FINANCEIRO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <DollarSign size={28} color="#60a5fa" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                Módulo Financeiro & Fluxo de Caixa
              </h1>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Acompanhamento de despesas das empresas: <strong>AÇOFORTE, BELLS, LGA, REGIONAL e LÓGICA</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Botão Novo Lançamento Rápido */}
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
      </div>

      {/* CARDS RESUMO / KPIS DAS 4 SITUAÇÕES FINANCEIRAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Situação 1: CONTAS VENCIDAS (ALERTA EM VERMELHO) */}
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.35)', boxShadow: estatisticas.countVencidas > 0 ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#f87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🚨 Vencidas (Atraso)</span>
            <AlertOctagon size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#f87171' }}>
            {formatMoney(estatisticas.valorVencidas)}
          </div>
          <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '4px', fontWeight: 600 }}>
            {estatisticas.countVencidas} contas em atraso
          </div>
        </div>

        {/* Situação 2: CONTAS A VENCER */}
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 700 }}>⏳ A Vencer (No Prazo)</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>
            {formatMoney(estatisticas.valorAVencer)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {estatisticas.countAVencer} contas a vencer
          </div>
        </div>

        {/* Situação 3: TOTAL EM ABERTO */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>💳 Total em Aberto</span>
            <CreditCard size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#60a5fa' }}>
            {formatMoney(estatisticas.valorEmAberto)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {estatisticas.countEmAberto} contas a pagar
          </div>
        </div>

        {/* Situação 4: TOTAL PAGO (QUITADO) */}
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 700 }}>✓ Pagos (Quitadas)</span>
            <CheckCircle2 size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>
            {formatMoney(estatisticas.valorPagas)}
          </div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
            {estatisticas.countPagas} despesas liquidadas
          </div>
        </div>

        {/* DESPESAS CADASTRADAS (RASCUNHOS DA 1ª ABA) */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Despesas Cadastradas</span>
            <FileText size={18} color="#a78bfa" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#c084fc' }}>
            {formatMoney(estatisticas.valorCadastradas)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {estatisticas.countCadastradas} para enviar a pagamento
          </div>
        </div>

        {/* CONCILIAÇÃO & ARQUIVADAS */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Conciliação / Arquivo</span>
            <Landmark size={18} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#cbd5e1' }}>
            {formatMoney(estatisticas.valorConciliacao + estatisticas.valorArquivadas)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {estatisticas.countConciliacao} em conciliação / {estatisticas.countArquivadas} arquivadas
          </div>
        </div>

      </div>

      {/* BARRA DE NAVEGAÇÃO ENTRE ABAS - 1ª ABA: CADASTRADAS, 2ª ABA: LANÇADAS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        
        {/* 1ª ABA: DESPESAS CADASTRADAS */}
        <button
          onClick={() => setActiveTab('cadastradas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
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
          <FileText size={16} />
          <span>1. Despesas Cadastradas ({estatisticas.countCadastradas})</span>
        </button>

        {/* 2ª ABA: DESPESAS LANÇADAS */}
        <button
          onClick={() => setActiveTab('lancadas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
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
          <Send size={16} />
          <span>2. Lançadas p/ Pagamento ({estatisticas.countLancadas})</span>
        </button>

        {/* ABA: CONCILIAÇÃO */}
        <button
          onClick={() => setActiveTab('conciliacao')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'conciliacao' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'conciliacao' ? '#34d399' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            borderBottom: activeTab === 'conciliacao' ? '2px solid #34d399' : 'none'
          }}
        >
          <Landmark size={16} />
          <span>Pendente de Conciliação ({estatisticas.countConciliacao})</span>
        </button>

        {/* ABA: ARQUIVADAS */}
        <button
          onClick={() => setActiveTab('arquivadas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'arquivadas' ? 'rgba(148, 163, 184, 0.15)' : 'transparent',
            color: activeTab === 'arquivadas' ? '#94a3b8' : '#64748b',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            borderBottom: activeTab === 'arquivadas' ? '2px solid #94a3b8' : 'none'
          }}
        >
          <Archive size={16} />
          <span>Arquivadas ({estatisticas.countArquivadas})</span>
        </button>

        {/* ABA: RECUSADAS */}
        <button
          onClick={() => setActiveTab('recusadas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
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
          <XCircle size={16} />
          <span>Recusadas ({estatisticas.countRecusadas})</span>
        </button>

        {/* ABA: RELATÓRIO MENSAL */}
        <button
          onClick={() => setActiveTab('relatorio')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'relatorio' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            color: activeTab === 'relatorio' ? '#c084fc' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            borderBottom: activeTab === 'relatorio' ? '2px solid #c084fc' : 'none'
          }}
        >
          <FileText size={16} />
          <span>Relatório Mensal</span>
        </button>

        {/* ABA: CADASTRAR NOVA DESPESA */}
        <button
          onClick={() => setActiveTab('nova')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
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
          <PlusCircle size={16} />
          <span>+ Cadastrar Despesa</span>
        </button>

      </div>

      {/* CADASTRO DE NOVAR DESPESAS (ABA FORMULÁRIO) */}
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
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, empresa: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700 }}
              >
                {EMPRESAS.map(emp => <option key={emp} value={emp}>{emp}</option>)}
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
                Quantidade de Parcelas (Manual) *
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
                  {bancos.map(b => <option key={b} value={b}>{b}</option>)}
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

            {/* Número da OP (Condicional) */}
            {formNovaDespesa.temOP && (
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
                Salvar em Despesas Cadastradas ➔
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ABAS: TABELA DE DESPESAS (CADASTRADAS / LANÇADAS / CONCILIAÇÃO / ARQUIVADAS / RECUSADAS) */}
      {(activeTab === 'cadastradas' || activeTab === 'lancadas' || activeTab === 'conciliacao' || activeTab === 'arquivadas' || activeTab === 'recusadas') && (
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          
          {/* BARRA DE FILTROS E EXPORTAÇÃO */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {activeTab === 'cadastradas' && '1. Despesas Cadastradas (Aguardando Envio p/ Pagamento)'}
                {activeTab === 'lancadas' && '2. Despesas Lançadas (Confirmação de Pagamento)'}
                {activeTab === 'conciliacao' && 'Despesas Pendentes de Conciliação Bancária'}
                {activeTab === 'arquivadas' && 'Histórico de Despesas Arquivadas & Conciliadas'}
                {activeTab === 'recusadas' && 'Despesas Recusadas / Reprovadas'}
                {` (${listaExibicao.length})`}
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Total na visualização: {formatMoney(listaExibicao.reduce((a,b) => a + b.valor, 0))}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Campo Busca */}
              <div style={{ position: 'relative', minWidth: '180px' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Buscar despesa ou OP..."
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
              </div>

              {/* Filtro Empresa */}
              <select
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              >
                <option value="">Todas as Empresas</option>
                {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>

              {/* Filtro Departamento */}
              <select
                value={filtroDepartamento}
                onChange={(e) => setFiltroDepartamento(e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              >
                <option value="">Todos os Departamentos</option>
                {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Filtro Forma de Pagamento */}
              <select
                value={filtroFormaPagamento}
                onChange={(e) => setFiltroFormaPagamento(e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              >
                <option value="">Todas as Formas Pagto</option>
                {FORMAS_PAGAMENTO.map(fp => <option key={fp} value={fp}>{fp}</option>)}
              </select>

              {/* Filtro Situações Financeiras */}
              <select
                value={filtroStatusPagamento}
                onChange={(e) => setFiltroStatusPagamento(e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', color: '#60a5fa', fontSize: '12px', fontWeight: 600 }}
              >
                <option value="TODOS">Todas as Situações</option>
                <option value="VENCIDA">🚨 Vencidas (Atrasadas)</option>
                <option value="A_VENCER">⏳ A Vencer (No Prazo)</option>
                <option value="PAGO">✓ Pagas (Quitadas)</option>
                <option value="PENDENTE_PAGAMENTO">💳 Em Aberto</option>
                <option value="PENDENTE_CONCILIACAO">🏦 Pendente Conciliação</option>
                <option value="ARQUIVADO">📦 Arquivadas</option>
              </select>

              {/* Exportar CSV */}
              <button
                onClick={() => exportarCSVGenerico(
                  activeTab === 'cadastradas' ? 'AGUARDANDO_APROVACAO' : 
                  (activeTab === 'lancadas' ? 'PAGAS' : 
                  (activeTab === 'conciliacao' ? 'PENDENTES_CONCILIACAO' : 
                  (activeTab === 'arquivadas' ? 'ARQUIVADAS' : 'RECUSADAS')))
                )}
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

                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Ações & Confirmação</th>
                  </tr>
                </thead>
                <tbody>
                  {listaExibicao.map((item, idx) => {
                    const prioObj = PRIORIDADES.find(p => p.value === item.prioridade) || PRIORIDADES[1];
                    const sit = getSituacaoItem(item);
                    const stPag = item.statusPagamento || 'PENDENTE_PAGAMENTO';
                    const configSt = CONFIG_STATUS_PAGAMENTO[stPag] || CONFIG_STATUS_PAGAMENTO.PENDENTE_PAGAMENTO;

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
                              Obs: "{item.obsAprovacao}"
                            </div>
                          )}
                        </td>

                        {/* Valor (Com opção de Editar na 1ª Aba Cadastradas) */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <div style={{ fontWeight: 800, color: '#60a5fa', fontSize: '14px' }}>
                              {formatMoney(item.valor)}
                            </div>
                            {/* Botão de Editar Valor (Principalmente na 1ª Aba) */}
                            <button
                              onClick={() => {
                                setModalEditarValor(item);
                                setNovoValorInput(String(item.valor));
                              }}
                              style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                              title="Editar o valor desta despesa"
                            >
                              <Edit2 size={10} />
                              <span>Editar</span>
                            </button>
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                            {item.parcelas > 1 ? `${item.parcelas}x parcelas` : '1x (À vista)'}
                          </div>
                        </td>

                        {/* OP / Banco / Forma Pagamento */}
                        <td style={{ padding: '12px 14px', fontSize: '11px' }}>
                          {item.temOP ? (
                            <span style={{ color: '#38bdf8', fontWeight: 600, display: 'block' }}>OP: {item.numeroOP}</span>
                          ) : (
                            <span style={{ color: '#64748b', display: 'block' }}>Sem OP</span>
                          )}
                          <span style={{ color: '#cbd5e1' }}>{item.banco}</span>
                          {item.formaPagamento && (
                            <span style={{ color: '#a78bfa', display: 'block', fontSize: '10px' }}>• {item.formaPagamento}</span>
                          )}
                        </td>

                        {/* Vencimento */}
                        <td style={{ padding: '12px 14px', color: '#cbd5e1', fontSize: '12px' }}>
                          <div>{formatDate(item.vencimento)}</div>
                          {item.parcelas > 1 && (
                            <div style={{ fontSize: '10px', color: '#a78bfa' }}>Fim: {calcularUltimoVencimento(item.vencimento, item.parcelas)}</div>
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

                        {/* Coluna Ações Específicas por Aba */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          
                          {/* AÇÕES NA 1ª ABA: DESPESAS CADASTRADAS */}
                          {activeTab === 'cadastradas' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                onClick={() => handleEnviarParaPagamento(item.id)}
                                style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)' }}
                                title="Enviar para a aba Lançadas para autorização e liquidação de pagamento"
                              >
                                <Send size={12} /> Enviar p/ Pagamentos
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

                          {/* AÇÕES NA 2ª ABA: DESPESAS LANÇADAS (CONFIRMAÇÃO DE PAGAMENTO) */}
                          {activeTab === 'lancadas' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                              {item.statusPagamento !== 'PAGO' ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => handleMudarStatusPagamento(item.id, 'PAGO')}
                                    style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    title="Confirmar pagamento da despesa"
                                  >
                                    <Check size={12} /> Confirmar PAGO
                                  </button>
                                  <button
                                    onClick={() => setModalAprovacao({ despesa: item, acao: 'REPROVAR' })}
                                    style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    title="Reprovar ou marcar como Não Pago"
                                  >
                                    <X size={12} /> Reprovar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAvancarStatusPagamento(item.id)}
                                  style={{ padding: '5px 10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <span>🏦 Enviar p/ Conciliação</span>
                                  <ArrowRight size={10} />
                                </button>
                              )}
                            </div>
                          )}

                          {/* AÇÕES NAS OUTRAS ABAS (CONCILIAÇÃO / ARQUIVADAS / RECUSADAS) */}
                          {activeTab !== 'cadastradas' && activeTab !== 'lancadas' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <select
                                value={stPag}
                                onChange={(e) => handleMudarStatusPagamento(item.id, e.target.value)}
                                style={{ padding: '3px 6px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', fontSize: '10px' }}
                                title="Alterar status manualmente"
                              >
                                <option value="PENDENTE_PAGAMENTO">Pendente Pagamento</option>
                                <option value="PAGO">Pago</option>
                                <option value="PENDENTE_CONCILIACAO">Pendente Conciliação</option>
                                <option value="ARQUIVADO">Arquivado</option>
                              </select>

                              <button
                                onClick={() => handleExcluirDespesa(item.id)}
                                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                                title="Excluir despesa"
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

      {/* ABA: RELATÓRIO MENSAL E OPÇÕES DE EXPORTAÇÃO CSV DEDICADAS */}
      {activeTab === 'relatorio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* BARRA DE EXPORTAÇÃO CSV ESPECIAL */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={20} color="#38bdf8" />
                Exportação de Relatórios de Pagamentos em CSV
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Baixe planilhas segmentadas por status de pagamento, conciliação e arquivo
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
                onClick={() => exportarCSVGenerico('ARQUIVADAS')}
                style={{ padding: '8px 14px', background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.4)', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Archive size={14} /> Exportar ARQUIVADAS
              </button>
            </div>
          </div>

          {/* Gráfico Comparativo Mês a Mês */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart size={18} color="#60a5fa" />
              Relatório Comparativo Mensal — Valor Pago vs Pendente
            </h3>

            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={dadosRelatorioMensal.meses} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="mes" stroke="#94a3b8" />
                  <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} stroke="#94a3b8" />
                  <Tooltip formatter={(val) => [formatMoney(val)]} contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Legend />
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
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#34d399', fontWeight: 700 }}>{formatMoney(emp.pago)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 700 }}>{formatMoney(emp.pendente)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#60a5fa', fontWeight: 800 }}>{formatMoney(emp.total)}</td>
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
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#34d399', fontWeight: 700 }}>{formatMoney(dep.pago)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#fbbf24', fontWeight: 700 }}>{formatMoney(dep.pendente)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#60a5fa', fontWeight: 800 }}>{formatMoney(dep.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                placeholder={modalAprovacao.acao === 'APROVAR' ? 'Ex: Aprovado conforme orçamento validado.' : 'Ex: Reprovado devido à falta de cota orçamentária.'}
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

      {/* MODAL DE EDIÇÃO DE VALOR DA DESPESA */}
      {modalEditarValor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#60a5fa', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} />
                Editar Valor da Despesa
              </h3>
              <button onClick={() => setModalEditarValor(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '12px' }}>
              <div style={{ fontWeight: 700, color: '#f8fafc' }}>{modalEditarValor.nome}</div>
              <div style={{ color: '#94a3b8', marginTop: '2px' }}>Empresa: <strong>{modalEditarValor.empresa}</strong> ({modalEditarValor.departamento})</div>
              <div style={{ color: '#a78bfa', fontWeight: 600, marginTop: '2px' }}>Valor Atual: {formatMoney(modalEditarValor.valor)}</div>
            </div>

            <form onSubmit={handleSalvarNovoValor}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                  Novo Valor Total (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={novoValorInput}
                  onChange={(e) => setNovoValorInput(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #3b82f6', borderRadius: '8px', color: '#fff', fontSize: '16px', fontWeight: 800 }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalEditarValor(null)}
                  style={{ padding: '10px 16px', background: 'rgba(51, 65, 85, 0.6)', color: '#cbd5e1', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Salvar Novo Valor
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
