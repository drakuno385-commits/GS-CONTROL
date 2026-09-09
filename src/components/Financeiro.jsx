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
    label: 'Arquivada',
    badge: '📦 Arquivada',
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

// Dados Iniciais cobrindo todas as etapas da esteira financeira
const DESPESAS_INICIAIS = [
  {
    id: 'fin_1001',
    grupoId: 'grp_1001',
    empresa: 'AÇOFORTE',
    departamento: 'Frota',
    nome: 'Combustível da Frota de Viaturas - Quinzena',
    valor: 28450.00,
    parcelaNumero: 1,
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
    id: 'fin_1002_1',
    grupoId: 'grp_1002',
    empresa: 'BELLS',
    departamento: 'Operacional',
    nome: 'Manutenção de Equipamentos CFTV (1/2)',
    valor: 7100.00,
    parcelaNumero: 1,
    parcelas: 2,
    vencimento: '2026-09-20',
    temOP: true,
    numeroOP: 'OP-2026-9012',
    banco: 'Bradesco',
    formaPagamento: 'Transferência / TED',
    prioridade: 'CRÍTICA',
    observacao: 'Conserto de nobreaks e câmeras - Parcela 1/2.',
    status: 'AGUARDANDO_APROVACAO',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    dataConciliacao: null,
    dataArquivamento: null,
    obsAprovacao: '',
    dataCriacao: '2026-09-02'
  },
  {
    id: 'fin_1002_2',
    grupoId: 'grp_1002',
    empresa: 'BELLS',
    departamento: 'Operacional',
    nome: 'Manutenção de Equipamentos CFTV (2/2)',
    valor: 7100.00,
    parcelaNumero: 2,
    parcelas: 2,
    vencimento: '2026-10-20',
    temOP: true,
    numeroOP: 'OP-2026-9012',
    banco: 'Bradesco',
    formaPagamento: 'Transferência / TED',
    prioridade: 'CRÍTICA',
    observacao: 'Conserto de nobreaks e câmeras - Parcela 2/2.',
    status: 'AGUARDANDO_APROVACAO',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    dataConciliacao: null,
    dataArquivamento: null,
    obsAprovacao: '',
    dataCriacao: '2026-09-02'
  },
  {
    id: 'fin_1009',
    grupoId: 'grp_1009',
    empresa: 'AÇOFORTE',
    departamento: 'TI',
    nome: 'Servidores de Infraestrutura e Licenças de Firewall',
    valor: 16500.00,
    parcelaNumero: 1,
    parcelas: 1,
    vencimento: '2026-09-28',
    temOP: true,
    numeroOP: 'OP-2026-4411',
    banco: 'Itaú',
    formaPagamento: 'Pix',
    prioridade: 'ALTA',
    observacao: 'Renovação semestral do sistema de proteção de dados.',
    status: 'APROVADA',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    dataConciliacao: null,
    dataArquivamento: null,
    obsAprovacao: 'Aprovado em reunião de diretoria.',
    dataCriacao: '2026-09-04'
  },
  {
    id: 'fin_1008',
    grupoId: 'grp_1008',
    empresa: 'REGIONAL',
    departamento: 'Suprimentos',
    nome: 'Compra Urgente de EPIs e Equipamentos de Segurança',
    valor: 19800.00,
    parcelaNumero: 1,
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
    id: 'fin_1003_1',
    grupoId: 'grp_1003',
    empresa: 'REGIONAL',
    departamento: 'RH',
    nome: 'Compra de Uniformes e Coturnos (1/3)',
    valor: 15266.66,
    parcelaNumero: 1,
    parcelas: 3,
    vencimento: '2026-09-18',
    temOP: false,
    numeroOP: '',
    banco: 'Banco do Brasil',
    formaPagamento: 'Boleto',
    prioridade: 'MÉDIA',
    observacao: 'Lote de coturnos e coletes - Parcela 1/3.',
    status: 'LANCADA',
    statusPagamento: 'PAGO',
    dataPagamento: '2026-09-05',
    dataConciliacao: null,
    dataArquivamento: null,
    obsAprovacao: 'Aprovado e lançado para pagamento.',
    dataCriacao: '2026-08-28'
  },
  {
    id: 'fin_1003_2',
    grupoId: 'grp_1003',
    empresa: 'REGIONAL',
    departamento: 'RH',
    nome: 'Compra de Uniformes e Coturnos (2/3)',
    valor: 15266.67,
    parcelaNumero: 2,
    parcelas: 3,
    vencimento: '2026-10-18',
    temOP: false,
    numeroOP: '',
    banco: 'Banco do Brasil',
    formaPagamento: 'Boleto',
    prioridade: 'MÉDIA',
    observacao: 'Lote de coturnos e coletes - Parcela 2/3.',
    status: 'LANCADA',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    dataConciliacao: null,
    dataArquivamento: null,
    obsAprovacao: 'Aprovado e lançado para pagamento.',
    dataCriacao: '2026-08-28'
  },
  {
    id: 'fin_1003_3',
    grupoId: 'grp_1003',
    empresa: 'REGIONAL',
    departamento: 'RH',
    nome: 'Compra de Uniformes e Coturnos (3/3)',
    valor: 15266.67,
    parcelaNumero: 3,
    parcelas: 3,
    vencimento: '2026-11-18',
    temOP: false,
    numeroOP: '',
    banco: 'Banco do Brasil',
    formaPagamento: 'Boleto',
    prioridade: 'MÉDIA',
    observacao: 'Lote de coturnos e coletes - Parcela 3/3.',
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
    grupoId: 'grp_1004',
    empresa: 'LGA',
    departamento: 'TI',
    nome: 'Licenciamento de Software de Monitoramento e Nuvem',
    valor: 8900.00,
    parcelaNumero: 1,
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
    grupoId: 'grp_1005',
    empresa: 'LÓGICA',
    departamento: 'Suprimentos',
    nome: 'Material de Escritório e Limpeza Geral',
    valor: 3450.00,
    parcelaNumero: 1,
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
    grupoId: 'grp_1006',
    empresa: 'AÇOFORTE',
    departamento: 'Comercial',
    nome: 'Serviço de Consultoria de Segurança Operacional',
    valor: 12500.00,
    parcelaNumero: 1,
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
    grupoId: 'grp_1007',
    empresa: 'BELLS',
    departamento: 'Jurídico',
    nome: 'Taxas de Cartório e Selos Digitais - Registro de Contratos',
    valor: 1850.00,
    parcelaNumero: 1,
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

  // Aba Ativa
  const [activeTab, setActiveTab] = useState('cadastradas');

  // Sub-aba na tela de Relatório Mensal ('fluxo' ou 'consulta')
  const [subTabRelatorio, setSubTabRelatorio] = useState('fluxo');

  // Filtros Globais da Tabela
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroStatusPagamento, setFiltroStatusPagamento] = useState('TODOS');
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState('');
  const [filtroMes, setFiltroMes] = useState(''); // Filtro por Mês 'YYYY-MM'

  // Modal de Detalhes ao Clicar nos Cards de KPI de Resumo
  const [modalDetalhesCard, setModalDetalhesCard] = useState(null);

  // Modal de Edição Completa da Despesa Cadastrada (Na Aba 1)
  const [modalEditarDespesa, setModalEditarDespesa] = useState(null);

  // Modais de Cadastro Rápido de Novo Departamento e Novo Banco
  const [showNovoDeptoModal, setShowNovoDeptoModal] = useState(false);
  const [novoDeptoInput, setNovoDeptoInput] = useState('');

  const [showNovoBancoModal, setShowNovoBancoModal] = useState(false);
  const [novoBancoInput, setNovoBancoInput] = useState('');

  // Modal de Aprovação / Reprovação
  const [modalAprovacao, setModalAprovacao] = useState(null);
  const [obsAprovacaoInput, setObsAprovacaoInput] = useState('');

  // Modal de Confirmação de Pagamento com Digitação de Valor Executado
  const [modalConfirmarPagamento, setModalConfirmarPagamento] = useState(null);
  const [valorExecutadoInput, setValorExecutadoInput] = useState('');
  const [dataPagamentoInput, setDataPagamentoInput] = useState('');
  const [obsPagamentoInput, setObsPagamentoInput] = useState('');

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
          banco: modalEditarDespesa.banco,
          formaPagamento: modalEditarDespesa.formaPagamento,
          prioridade: modalEditarDespesa.prioridade,
          observacao: modalEditarDespesa.observacao.trim()
        };
      }
      return d;
    }));

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
          obsPagamento: obsPagamentoInput.trim()
        };
      }
      return d;
    }));

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
          statusPagamento: 'ARQUIVADO',
          dataArquivamento: d.dataArquivamento || hoje
        };
      }
      return d;
    }));
    alert('📦 Despesa conciliada e arquivada com sucesso!');
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

    alert(`Despesa ${acao === 'APROVAR' ? 'Aprovada com sucesso e movida para a aba "3. Aprovadas"' : 'Reprovada/Recusada e movida para a aba "7. Recusadas"'}!`);
    setModalAprovacao(null);
    setObsAprovacaoInput('');
  };

  const handleExcluirDespesa = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa permanentemente?')) {
      setDespesas(prev => prev.filter(d => d.id !== id));
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
    if (item.statusPagamento === 'ARQUIVADO') {
      return { code: 'ARQUIVADO', label: '📦 Arquivada', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.4)' };
    }

    if (item.vencimento && item.vencimento < hoje) {
      return { code: 'VENCIDA', label: '🚨 VENCIDA', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.25)', border: '#f87171' };
    }
    return { code: 'A_VENCER', label: '⏳ A Vencer', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' };
  };

  // Estatísticas Globais & Resumo por Mês (Balanço Mensal)
  const estatisticas = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);

    const despesasEscopo = filtroMes 
      ? despesas.filter(d => d.vencimento && d.vencimento.startsWith(filtroMes))
      : despesas;

    const cadastradas = despesasEscopo.filter(d => d.status === 'CADASTRADA');
    const aguardando = despesasEscopo.filter(d => d.status === 'AGUARDANDO_APROVACAO');
    const aprovadas = despesasEscopo.filter(d => d.status === 'APROVADA');
    const lancadas = despesasEscopo.filter(d => d.status === 'LANCADA' && d.statusPagamento !== 'PAGO' && d.statusPagamento !== 'PENDENTE_CONCILIACAO' && d.statusPagamento !== 'ARQUIVADO');
    const pagas = despesasEscopo.filter(d => d.statusPagamento === 'PAGO');
    const conciliacao = despesasEscopo.filter(d => d.statusPagamento === 'PENDENTE_CONCILIACAO');
    const recusadas = despesasEscopo.filter(d => d.status === 'RECUSADA');
    const arquivadas = despesasEscopo.filter(d => d.statusPagamento === 'ARQUIVADO');

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
  }, [despesas, filtroMes]);

  // Lista Filtrada para a Aba Ativa da Tabela Principal
  const listaExibicao = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);

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
        if (d.status !== 'LANCADA' || d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO') return false;
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

      if (filtroMes) {
        if (!d.vencimento || !d.vencimento.startsWith(filtroMes)) return false;
      }

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
  }, [despesas, activeTab, filtroEmpresa, filtroDepartamento, filtroFormaPagamento, filtroBusca, filtroStatusPagamento, filtroMes]);

  // Lista para a Consulta Geral de TODAS as Despesas (Na Aba de Relatório)
  const listaConsultaGeral = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);

    return despesas.filter(d => {
      if (filtroMes) {
        if (!d.vencimento || !d.vencimento.startsWith(filtroMes)) return false;
      }

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
  }, [despesas, filtroEmpresa, filtroDepartamento, filtroFormaPagamento, filtroBusca, filtroStatusPagamento, filtroMes]);

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

      if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO') {
        const valExec = d.valorExecutado !== undefined ? d.valorExecutado : d.valor;
        mapMeses[mesChave].pago += valExec;
      } else {
        mapMeses[mesChave].pendente += d.valor;
      }
      mapMeses[mesChave].total += (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO') ? (d.valorExecutado !== undefined ? d.valorExecutado : d.valor) : d.valor;
    });

    const listaMeses = Object.values(mapMeses).sort((a, b) => a.mes.localeCompare(b.mes));

    // Totais por Empresa
    const mapEmpresa = {};
    EMPRESAS.forEach(emp => { mapEmpresa[emp] = { empresa: emp, pago: 0, pendente: 0, total: 0, listaPago: [], listaPendente: [], listaTotal: [] }; });

    despesas.forEach(d => {
      if (d.status === 'RECUSADA') return;
      const emp = d.empresa || 'OUTROS';
      if (!mapEmpresa[emp]) mapEmpresa[emp] = { empresa: emp, pago: 0, pendente: 0, total: 0, listaPago: [], listaPendente: [], listaTotal: [] };

      if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO') {
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

      if (d.statusPagamento === 'PAGO' || d.statusPagamento === 'PENDENTE_CONCILIACAO' || d.statusPagamento === 'ARQUIVADO') {
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

  // Função Geradora de CSV por Filtro Específico
  const exportarCSVGenerico = (filtroTipo) => {
    let dadosFiltrados = despesas;
    let nomeArquivo = 'relatorio_financeiro';

    if (filtroTipo === 'PAGAS') {
      dadosFiltrados = despesas.filter(d => d.statusPagamento === 'PAGO');
      nomeArquivo = 'despesas_pagas';
    } else if (filtroTipo === 'PENDENTES_PAGAMENTO') {
      dadosFiltrados = despesas.filter(d => (d.statusPagamento || 'PENDENTE_PAGAMENTO') === 'PENDENTE_PAGAMENTO' && d.status !== 'RECUSADA');
      nomeArquivo = 'despesas_pendentes_pagamento';
    } else if (filtroTipo === 'PENDENTES_CONCILIACAO') {
      dadosFiltrados = despesas.filter(d => d.statusPagamento === 'PENDENTE_CONCILIACAO');
      nomeArquivo = 'despesas_pendentes_conciliacao';
    } else if (filtroTipo === 'ARQUIVADAS') {
      dadosFiltrados = despesas.filter(d => d.statusPagamento === 'ARQUIVADO');
      nomeArquivo = 'despesas_arquivadas';
    } else if (filtroTipo === 'AGUARDANDO_APROVACAO') {
      dadosFiltrados = despesas.filter(d => d.status === 'AGUARDANDO_APROVACAO');
      nomeArquivo = 'despesas_aguardando_aprovacao';
    } else if (filtroTipo === 'APROVADAS') {
      dadosFiltrados = despesas.filter(d => d.status === 'APROVADA');
      nomeArquivo = 'despesas_aprovadas';
    } else if (filtroTipo === 'RECUSADAS') {
      dadosFiltrados = despesas.filter(d => d.status === 'RECUSADA');
      nomeArquivo = 'despesas_recusadas';
    } else if (filtroTipo === 'TODAS') {
      dadosFiltrados = listaConsultaGeral;
      nomeArquivo = 'consulta_geral_despesas';
    }

    if (filtroMes) {
      dadosFiltrados = dadosFiltrados.filter(d => d.vencimento && d.vencimento.startsWith(filtroMes));
      nomeArquivo += `_${filtroMes}`;
    }

    const headers = ['ID', 'Empresa', 'Departamento', 'Descrição Despesa', 'Valor Previsto (R$)', 'Valor Executado (R$)', 'Diferença (R$)', 'Parcela', 'Total Parcelas', 'Vencimento', 'Último Vencimento Est.', 'Tem OP', 'Num OP', 'Banco', 'Forma Pagamento', 'Prioridade', 'Status Etapa', 'Status Pagamento', 'Data Pagamento', 'Data Conciliação', 'Data Arquivamento', 'Obs Cadastro', 'Obs Análise', 'Obs Pagamento'];
    
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
        item.dataArquivamento || '-',
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
                Controle de despesas
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

      {/* CARDS RESUMO / KPIS DAS SITUAÇÕES FINANCEIRAS — CLICÁVEIS PARA ABRIR DETALHES DE CADA VALOR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        
        {/* Card 1: CONTAS VENCIDAS */}
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
            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>⏳ A Vencer (No Prazo)</span>
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

        {/* Card 3: TOTAL EM ABERTO */}
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
            border: '1px solid rgba(59, 130, 246, 0.2)',
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
          title="Clique para ver todas as despesas em aberto que compõem este valor"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>💳 Total em Aberto</span>
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

        {/* Card 4: TOTAL PAGO (DESPESAS PAGAS) */}
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
            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>✓ Pagas (Quitadas)</span>
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

        {/* Card 5: AGUARDANDO APROVAÇÃO */}
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
            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600 }}>Aguardando Aprovação</span>
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

        {/* Card 6: CONCILIAÇÃO & ARQUIVADAS */}
        <div 
          onClick={() => setModalDetalhesCard({
            titulo: '🏦 Despesas em Conciliação & Arquivadas',
            cor: '#cbd5e1',
            icone: <Landmark size={20} color="#cbd5e1" />,
            listaDespesas: estatisticas.listaConciliacaoEArquivo,
            valorTotal: estatisticas.valorConciliacao + estatisticas.valorArquivadas,
            targetTab: 'conciliacao'
          })}
          style={{ 
            background: 'rgba(30, 41, 59, 0.5)', 
            padding: '14px', 
            borderRadius: '14px', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            transition: 'transform 0.2s, border-color 0.2s'
          }}
          title="Clique para ver todas as despesas em conciliação ou arquivadas"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Conciliação / Arquivo</span>
            <Landmark size={16} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#cbd5e1' }}>
            {formatMoney(estatisticas.valorConciliacao + estatisticas.valorArquivadas)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{estatisticas.countConciliacao} conciliação / {estatisticas.countArquivadas} arquivadas</span>
            <ChevronRight size={14} color="#cbd5e1" />
          </div>
        </div>

      </div>

      {/* BARRA DE NAVEGAÇÃO DE ABAS — ORDEM EXATA REQUISITADA */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        
        {/* 1. CADASTRO DE DESPESAS */}
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

        {/* 2. AGUARDANDO APROVAÇÃO */}
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

        {/* 3. APROVADAS */}
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

        {/* 4. LANÇADAS */}
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

        {/* 5. PAGAS */}
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

        {/* 6. CONCILIAÇÃO */}
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
          <span>7. Conciliação ({estatisticas.countConciliacao})</span>
        </button>

        {/* 7. RECUSADAS */}
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

        {/* 8. RELATÓRIO MENSAL & CONSULTA GERAL */}
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

        {/* ABA FORMULÁRIO: CADASTRAR NOVA DESPESA */}
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
                  Total na visualização: <strong>{formatMoney(listaExibicao.reduce((a,b) => a + b.valor, 0))}</strong>
                </span>
                {filtroMes && (
                  <span style={{ fontSize: '11px', color: '#a78bfa', background: 'rgba(139, 92, 246, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> Mês: {formatarMesExtenso(filtroMes)}
                    <button onClick={() => setFiltroMes('')} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 0, marginLeft: '4px' }}>✕</button>
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Filtro por Mês (Vencimento) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} color="#a78bfa" />
                <select
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
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
                <option value="">Todos os Deptos</option>
                {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Filtro Forma de Pagamento */}
              <select
                value={filtroFormaPagamento}
                onChange={(e) => setFiltroFormaPagamento(e.target.value)}
                style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              >
                <option value="">Forma Pagto</option>
                {FORMAS_PAGAMENTO.map(fp => <option key={fp} value={fp}>{fp}</option>)}
              </select>

              {/* Exportar CSV */}
              <button
                onClick={() => exportarCSVGenerico(
                  activeTab === 'cadastradas' ? 'CADASTRADA' : 
                  (activeTab === 'aguardando' ? 'AGUARDANDO_APROVACAO' : 
                  (activeTab === 'aprovadas' ? 'APROVADAS' :
                  (activeTab === 'lancadas' ? 'LANCADA' :
                  (activeTab === 'pagas' ? 'PAGAS' : 
                  (activeTab === 'conciliacao' ? 'PENDENTES_CONCILIACAO' : 'RECUSADAS')))))
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
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                onClick={() => handleEnviarParaConciliacao(item.id)}
                                style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Enviar para a aba Pendente de Conciliação"
                              >
                                <Landmark size={12} /> 🏦 Enviar p/ Conciliação
                              </button>
                            </div>
                          )}

                          {/* 6. CONCILIAÇÃO */}
                          {activeTab === 'conciliacao' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                onClick={() => handleConciliarEArquivar(item.id)}
                                style={{ padding: '6px 12px', background: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.4)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Conciliar e arquivar no histórico"
                              >
                                <Archive size={12} /> 📦 Conciliar & Arquivar
                              </button>
                            </div>
                          )}

                          {/* 7. RECUSADAS */}
                          {activeTab === 'recusadas' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
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
                    Baixe planilhas segmentadas por status de pagamento, conciliação e arquivo {filtroMes ? `(Filtrado por ${formatarMesExtenso(filtroMes)})` : ''}
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
                      value={filtroBusca}
                      onChange={(e) => setFiltroBusca(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px 8px 32px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </div>

                  {/* Filtro Empresa */}
                  <select
                    value={filtroEmpresa}
                    onChange={(e) => setFiltroEmpresa(e.target.value)}
                    style={{ padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value="">Todas as Empresas</option>
                    {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>

                  {/* Filtro Departamento */}
                  <select
                    value={filtroDepartamento}
                    onChange={(e) => setFiltroDepartamento(e.target.value)}
                    style={{ padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value="">Todos os Deptos</option>
                    {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
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
                      <th style={{ padding: '10px', textAlign: 'center' }}>Status na Esteira</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Situação Pagto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaConsultaGeral.map((item, idx) => {
                      const sit = getSituacaoItem(item);
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                            <div>{item.id}</div>
                            {item.temOP && <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '10px' }}>{item.numeroOP}</span>}
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
                            <span style={{ color: '#94a3b8', fontSize: '10px' }}>{item.formaPagamento}</span>
                          </td>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>{formatDate(item.vencimento)}</td>
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
                            {item.temOP && <span style={{ color: '#38bdf8', fontSize: '10px' }}>OP: {item.numeroOP}</span>}
                          </td>
                          <td style={{ padding: '10px', color: '#cbd5e1' }}>{formatDate(item.vencimento)}</td>
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

              {/* Observação / Comprovante */}
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
                  onChange={(e) => setModalEditarDespesa({ ...modalEditarDespesa, empresa: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700 }}
                >
                  {EMPRESAS.map(emp => <option key={emp} value={emp}>{emp}</option>)}
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
                    {bancos.map(b => <option key={b} value={b}>{b}</option>)}
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

              {/* Número da OP (Condicional) */}
              {modalEditarDespesa.temOP && (
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

    </div>
  );
}
