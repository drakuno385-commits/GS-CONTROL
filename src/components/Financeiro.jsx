import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, PlusCircle, Clock, CheckCircle2, XCircle, FileText, 
  Building, Calendar, CreditCard, Shield, AlertTriangle, Filter, 
  Search, Download, Trash2, Eye, MessageSquare, Check, X, ArrowUpRight,
  TrendingUp, TrendingDown, Layers, Percent, Tag, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

const EMPRESAS = ['AÇOFORTE', 'BELLS', 'LGA', 'REGIONAL', 'LÓGICA'];
const DEPARTAMENTOS = [
  'Operacional',
  'RH / Pessoal',
  'Frota & Logística',
  'Comercial & Vendas',
  'TI & Sistemas',
  'Diretoria & Adm',
  'Suprimentos & Compras',
  'Jurídico & Financeiro'
];
const BANCOS = ['Itaú', 'Bradesco', 'Banco do Brasil', 'Santander', 'Caixa Econômica', 'Pix / Caixinha'];
const PRIORIDADES = [
  { value: 'BAIXA', label: 'Baixa', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  { value: 'MÉDIA', label: 'Média', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { value: 'ALTA', label: 'Alta', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { value: 'CRÍTICA', label: 'Crítica', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
];

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

// Dados Iniciais Exemplo para popular se o localStorage estiver vazio
const DESPESAS_INICIAIS = [
  {
    id: 'fin_1001',
    empresa: 'AÇOFORTE',
    departamento: 'Frota & Logística',
    nome: 'Combustível da Frota de Viaturas - Quinzena',
    valor: 28450.00,
    parcelas: 1,
    vencimento: '2026-09-15',
    temOP: true,
    numeroOP: 'OP-2026-8841',
    banco: 'Itaú',
    prioridade: 'ALTA',
    observacao: 'Fatura de abastecimento dos veículos da regional RMSP.',
    status: 'AGUARDANDO_APROVACAO',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
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
    prioridade: 'CRÍTICA',
    observacao: 'Conserto de nobreaks e câmeras do posto Centro Operacional Gopouva.',
    status: 'AGUARDANDO_APROVACAO',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    obsAprovacao: '',
    dataCriacao: '2026-09-02'
  },
  {
    id: 'fin_1003',
    empresa: 'REGIONAL',
    departamento: 'RH / Pessoal',
    nome: 'Compra de Uniformes e EPIs para Vigilantes',
    valor: 45800.00,
    parcelas: 3,
    vencimento: '2026-09-10',
    temOP: false,
    numeroOP: '',
    banco: 'Banco do Brasil',
    prioridade: 'MÉDIA',
    observacao: 'Lote de coturnos, coletes e jaquetas para os novos postos.',
    status: 'APROVADA',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    obsAprovacao: 'Aprovado conforme orçamento validado pela diretoria.',
    dataCriacao: '2026-08-28'
  },
  {
    id: 'fin_1004',
    empresa: 'LGA',
    departamento: 'TI & Sistemas',
    nome: 'Licenciamento de Software de Monitoramento e Nuvem',
    valor: 8900.00,
    parcelas: 1,
    vencimento: '2026-09-05',
    temOP: true,
    numeroOP: 'OP-2026-7734',
    banco: 'Santander',
    prioridade: 'BAIXA',
    observacao: 'Renovação anual de servidores de banco de dados.',
    status: 'APROVADA',
    statusPagamento: 'PAGO',
    dataPagamento: '2026-09-05',
    obsAprovacao: 'Pagamento autorizado antecipadamente com desconto.',
    dataCriacao: '2026-08-25'
  },
  {
    id: 'fin_1005',
    empresa: 'LÓGICA',
    departamento: 'Suprimentos & Compras',
    nome: 'Material de Escritório e Limpeza Geral',
    valor: 3450.00,
    parcelas: 1,
    vencimento: '2026-09-12',
    temOP: false,
    numeroOP: '',
    banco: 'Pix / Caixinha',
    prioridade: 'BAIXA',
    observacao: 'Abastecimento dos insumos do departamento administrativo.',
    status: 'RECUSADA',
    statusPagamento: 'PENDENTE_PAGAMENTO',
    dataPagamento: null,
    obsAprovacao: 'Reprovado por ultrapassar a cota mensal autorizada de suprimentos.',
    dataCriacao: '2026-09-03'
  }
];

export default function Financeiro({ currentUser }) {
  // Estado Principal de Despesas (persistido no localStorage)
  const [despesas, setDespesas] = useState(() => {
    const saved = localStorage.getItem('acoweb_financeiro_despesas_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch(e){}
    }
    return DESPESAS_INICIAIS;
  });

  // Salvar alterações no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('acoweb_financeiro_despesas_v1', JSON.stringify(despesas));
    } catch(e) {
      console.error('Erro ao salvar despesas no localStorage:', e);
    }
  }, [despesas]);

  // Aba Ativa ('nova', 'pendentes', 'aprovadas', 'recusadas', 'relatorio')
  const [activeTab, setActiveTab] = useState('pendentes');

  // Filtros Globais da Tela
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroDepartamento, setFiltroDepartamento] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroStatusPagamento, setFiltroStatusPagamento] = useState('TODOS'); // 'TODOS', 'PENDENTE_PAGAMENTO', 'PAGO'

  // Modal de Aprovação / Reprovação
  const [modalAprovacao, setModalAprovacao] = useState(null); // { despesa, acao: 'APROVAR' | 'REPROVAR' }
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
    prioridade: 'MÉDIA',
    observacao: ''
  });

  // Handler de envio do formulário de nova despesa
  const handleCadastrarDespesa = (e) => {
    e.preventDefault();
    if (!formNovaDespesa.nome.trim()) return alert('Por favor, informe a descrição/nome da despesa.');
    if (!formNovaDespesa.valor || Number(formNovaDespesa.valor) <= 0) return alert('Por favor, informe um valor válido para a despesa.');
    if (formNovaDespesa.temOP && !formNovaDespesa.numeroOP.trim()) return alert('Por favor, informe o Número da OP.');

    const nova = {
      id: `fin_${Date.now()}_${Math.floor(Math.random()*1000)}`,
      empresa: formNovaDespesa.empresa,
      departamento: formNovaDespesa.departamento,
      nome: formNovaDespesa.nome.trim(),
      valor: parseFloat(formNovaDespesa.valor) || 0,
      parcelas: parseInt(formNovaDespesa.parcelas, 10) || 1,
      vencimento: formNovaDespesa.vencimento,
      temOP: formNovaDespesa.temOP,
      numeroOP: formNovaDespesa.temOP ? formNovaDespesa.numeroOP.trim() : '',
      banco: formNovaDespesa.banco,
      prioridade: formNovaDespesa.prioridade,
      observacao: formNovaDespesa.observacao.trim(),
      status: 'AGUARDANDO_APROVACAO',
      statusPagamento: 'PENDENTE_PAGAMENTO',
      dataPagamento: null,
      obsAprovacao: '',
      dataCriacao: new Date().toISOString().slice(0, 10)
    };

    setDespesas(prev => [nova, ...prev]);
    alert('✅ Despesa cadastrada com sucesso e enviada para Aprovação!');

    // Resetar formulário
    setFormNovaDespesa({
      empresa: 'AÇOFORTE',
      departamento: 'Operacional',
      nome: '',
      valor: '',
      parcelas: '1',
      vencimento: new Date().toISOString().slice(0, 10),
      temOP: false,
      numeroOP: '',
      banco: 'Itaú',
      prioridade: 'MÉDIA',
      observacao: ''
    });

    // Mudar para a aba de pendentes
    setActiveTab('pendentes');
  };

  // Confirmar Aprovação ou Reprovação
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

    alert(`Despesa ${acao === 'APROVAR' ? 'APROVADA' : 'RECUSADA'} com sucesso!`);
    setModalAprovacao(null);
    setObsAprovacaoInput('');
  };

  // Alternar status de pagamento (Pendente de Pagamento ↔ PAGA)
  const handleTogglePagamento = (id) => {
    setDespesas(prev => prev.map(d => {
      if (d.id === id) {
        const isPago = d.statusPagamento === 'PAGO';
        return {
          ...d,
          statusPagamento: isPago ? 'PENDENTE_PAGAMENTO' : 'PAGO',
          dataPagamento: isPago ? null : new Date().toISOString().slice(0, 10)
        };
      }
      return d;
    }));
  };

  // Excluir Lançamento
  const handleExcluirDespesa = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa permanentemente?')) {
      setDespesas(prev => prev.filter(d => d.id !== id));
    }
  };

  // Contadores e Totais das Abas
  const estatisticas = useMemo(() => {
    const pendentes = despesas.filter(d => d.status === 'AGUARDANDO_APROVACAO');
    const aprovadas = despesas.filter(d => d.status === 'APROVADA');
    const recusadas = despesas.filter(d => d.status === 'RECUSADA');

    const valorPendentes = pendentes.reduce((a, b) => a + b.valor, 0);
    const valorAprovadas = aprovadas.reduce((a, b) => a + b.valor, 0);
    const valorRecusadas = recusadas.reduce((a, b) => a + b.valor, 0);

    const pagas = aprovadas.filter(d => d.statusPagamento === 'PAGO');
    const pendentesPagamento = aprovadas.filter(d => d.statusPagamento === 'PENDENTE_PAGAMENTO');

    const valorPagas = pagas.reduce((a, b) => a + b.valor, 0);
    const valorPendentesPagamento = pendentesPagamento.reduce((a, b) => a + b.valor, 0);

    return {
      totalGeral: despesas.length,
      countPendentes: pendentes.length,
      valorPendentes,
      countAprovadas: aprovadas.length,
      valorAprovadas,
      countRecusadas: recusadas.length,
      valorRecusadas,
      countPagas: pagas.length,
      valorPagas,
      countPendentesPagamento: pendentesPagamento.length,
      valorPendentesPagamento
    };
  }, [despesas]);

  // Lista Filtrada para a Aba Ativa
  const listaExibicao = useMemo(() => {
    return despesas.filter(d => {
      // Filtro de Aba
      if (activeTab === 'pendentes' && d.status !== 'AGUARDANDO_APROVACAO') return false;
      if (activeTab === 'aprovadas' && d.status !== 'APROVADA') return false;
      if (activeTab === 'recusadas' && d.status !== 'RECUSADA') return false;

      // Filtro de Status de Pagamento (na aba aprovadas)
      if (activeTab === 'aprovadas' && filtroStatusPagamento !== 'TODOS') {
        if (d.statusPagamento !== filtroStatusPagamento) return false;
      }

      // Filtro Empresa
      if (filtroEmpresa && d.empresa !== filtroEmpresa) return false;
      // Filtro Departamento
      if (filtroDepartamento && d.departamento !== filtroDepartamento) return false;
      // Filtro Busca Textual
      if (filtroBusca) {
        const term = filtroBusca.toLowerCase();
        const matchNome = (d.nome || '').toLowerCase().includes(term);
        const matchOP = (d.numeroOP || '').toLowerCase().includes(term);
        const matchObs = (d.observacao || '').toLowerCase().includes(term);
        const matchEmpresa = (d.empresa || '').toLowerCase().includes(term);
        if (!matchNome && !matchOP && !matchObs && !matchEmpresa) return false;
      }

      return true;
    });
  }, [despesas, activeTab, filtroEmpresa, filtroDepartamento, filtroBusca, filtroStatusPagamento]);

  // Dados para o Relatório Mensal Comparativo
  const dadosRelatorioMensal = useMemo(() => {
    const mapMeses = {};

    despesas.forEach(d => {
      if (d.status !== 'APROVADA') return; // Considera aprovadas
      const mesChave = (d.vencimento || d.dataCriacao || '').substring(0, 7); // YYYY-MM
      if (!mesChave) return;

      if (!mapMeses[mesChave]) {
        mapMeses[mesChave] = { mes: mesChave, pago: 0, pendente: 0, total: 0 };
      }

      if (d.statusPagamento === 'PAGO') {
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

      if (d.statusPagamento === 'PAGO') mapEmpresa[emp].pago += d.valor;
      else mapEmpresa[emp].pendente += d.valor;
      mapEmpresa[emp].total += d.valor;
    });

    return {
      meses: listaMeses,
      empresas: Object.values(mapEmpresa)
    };
  }, [despesas]);

  // Exportar CSV da aba ativa
  const exportarCSV = () => {
    const headers = ['ID', 'Empresa', 'Departamento', 'Nome Despesa', 'Valor (R$)', 'Parcelas', 'Vencimento', 'Tem OP', 'Num OP', 'Banco', 'Prioridade', 'Status Aprovação', 'Status Pagamento', 'Data Pagamento', 'Obs Cadastro', 'Obs Análise'];
    const rows = listaExibicao.map(item => [
      item.id,
      `"${item.empresa}"`,
      `"${item.departamento}"`,
      `"${item.nome}"`,
      item.valor.toFixed(2),
      item.parcelas,
      item.vencimento,
      item.temOP ? 'SIM' : 'NÃO',
      `"${item.numeroOP || ''}"`,
      `"${item.banco}"`,
      item.prioridade,
      item.status,
      item.statusPagamento,
      item.dataPagamento || '-',
      `"${item.observacao || ''}"`,
      `"${item.obsAprovacao || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financeiro_despesas_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ color: '#f8fafc', padding: '24px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* CABEÇALHO DA TELA FINANCEIRO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <DollarSign size={28} color="#60a5fa" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                Módulo Financeiro & Contas a Pagar
              </h1>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Gestão de despesas, fluxo de aprovação e relatório de quitação das empresas do grupo
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

      {/* CARDS RESUMO / KPIS FINANCEIROS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Total Pendente Aprovação */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Aguardando Aprovação</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fbbf24' }}>
            {formatMoney(estatisticas.valorPendentes)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {estatisticas.countPendentes} lançamentos em análise
          </div>
        </div>

        {/* Total Aprovadas Pendentes de Pagamento */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Aprovadas (Pendente Pagamento)</span>
            <CreditCard size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#60a5fa' }}>
            {formatMoney(estatisticas.valorPendentesPagamento)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {estatisticas.countPendentesPagamento} contas a pagar
          </div>
        </div>

        {/* Total Pago */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Total Pago (Quitadas)</span>
            <CheckCircle2 size={18} color="#34d399" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#34d399' }}>
            {formatMoney(estatisticas.valorPagas)}
          </div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
            {estatisticas.countPagas} despesas liquidadas
          </div>
        </div>

        {/* Total Recusadas */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Recusadas / Reprovadas</span>
            <XCircle size={18} color="#f87171" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#f87171' }}>
            {formatMoney(estatisticas.valorRecusadas)}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            {estatisticas.countRecusadas} lançamentos recados
          </div>
        </div>

      </div>

      {/* BARRA DE NAVEGAÇÃO ENTRE ABAS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        
        <button
          onClick={() => setActiveTab('pendentes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'pendentes' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: activeTab === 'pendentes' ? '#fbbf24' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            borderBottom: activeTab === 'pendentes' ? '2px solid #fbbf24' : 'none'
          }}
        >
          <Clock size={16} />
          <span>Aguardando Aprovação ({estatisticas.countPendentes})</span>
        </button>

        <button
          onClick={() => setActiveTab('aprovadas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'aprovadas' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeTab === 'aprovadas' ? '#34d399' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            borderBottom: activeTab === 'aprovadas' ? '2px solid #34d399' : 'none'
          }}
        >
          <CheckCircle2 size={16} />
          <span>Aprovadas ({estatisticas.countAprovadas})</span>
        </button>

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

        <button
          onClick={() => setActiveTab('relatorio')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'relatorio' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activeTab === 'relatorio' ? '#60a5fa' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            borderBottom: activeTab === 'relatorio' ? '2px solid #60a5fa' : 'none'
          }}
        >
          <FileText size={16} />
          <span>Relatório Mensal (Pago vs Pendente)</span>
        </button>

        <button
          onClick={() => setActiveTab('nova')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            background: activeTab === 'nova' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            color: activeTab === 'nova' ? '#a78bfa' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            borderBottom: activeTab === 'nova' ? '2px solid #a78bfa' : 'none',
            marginLeft: 'auto'
          }}
        >
          <PlusCircle size={16} />
          <span>Nova Despesa</span>
        </button>

      </div>

      {/* ABA 1: FORMULÁRIO DE NOVO LANÇAMENTO */}
      {activeTab === 'nova' && (
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '28px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={20} color="#a78bfa" />
            Cadastrar Nova Despesa
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
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600 }}
              >
                {EMPRESAS.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>

            {/* Departamento */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Departamento *
              </label>
              <select
                value={formNovaDespesa.departamento}
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, departamento: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              >
                {DEPARTAMENTOS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>

            {/* Nome / Descrição da Despesa */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Nome / Descrição da Despesa *
              </label>
              <input
                type="text"
                placeholder="Ex: Aquisição de Combustível da Frota - Quinzena Setembro"
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

            {/* Parcelas */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Número de Parcelas *
              </label>
              <select
                value={formNovaDespesa.parcelas}
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, parcelas: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              >
                {[1,2,3,4,5,6,10,12,24,36].map(n => <option key={n} value={n}>{n}x</option>)}
              </select>
            </div>

            {/* Data de Vencimento */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={formNovaDespesa.vencimento}
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, vencimento: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px', colorScheme: 'dark' }}
              />
            </div>

            {/* Banco Pagador */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Banco Pagador *
              </label>
              <select
                value={formNovaDespesa.banco}
                onChange={(e) => setFormNovaDespesa({ ...formNovaDespesa, banco: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              >
                {BANCOS.map(b => <option key={b} value={b}>{b}</option>)}
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
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
                }}
              >
                Enviar Despesa para Aprovação ➔
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ABAS 2, 3 E 4: TABELA DE DESPESAS (PENDENTES / APROVADAS / RECUSADAS) */}
      {(activeTab === 'pendentes' || activeTab === 'aprovadas' || activeTab === 'recusadas') && (
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          
          {/* BARRA DE FILTROS E EXPORTAÇÃO */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {activeTab === 'pendentes' && 'Despesas Aguardando Aprovação'}
                {activeTab === 'aprovadas' && 'Despesas Aprovadas & Contas a Pagar'}
                {activeTab === 'recusadas' && 'Despesas Recusadas / Reprovadas'}
                {` (${listaExibicao.length})`}
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Total listado: {formatMoney(listaExibicao.reduce((a,b) => a + b.valor, 0))}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Campo Busca */}
              <div style={{ position: 'relative', minWidth: '200px' }}>
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
                {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Filtro Status Pagamento (Apenas na aba Aprovadas) */}
              {activeTab === 'aprovadas' && (
                <select
                  value={filtroStatusPagamento}
                  onChange={(e) => setFiltroStatusPagamento(e.target.value)}
                  style={{ padding: '8px 12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', color: '#60a5fa', fontSize: '12px', fontWeight: 600 }}
                >
                  <option value="TODOS">Todos os Pagamentos</option>
                  <option value="PENDENTE_PAGAMENTO">Pendente de Pagamento</option>
                  <option value="PAGO">Pago / Quitado</option>
                </select>
              )}

              {/* Exportar CSV */}
              <button
                onClick={exportarCSV}
                style={{ padding: '8px 12px', background: 'rgba(51, 65, 85, 0.6)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> CSV
              </button>

            </div>
          </div>

          {/* TABELA DE DESPESAS */}
          {listaExibicao.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
              <Clock size={36} style={{ opacity: 0.5, marginBottom: '12px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Nenhuma despesa encontrada nesta categoria ou filtro.</p>
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
                    <th style={{ padding: '12px 14px' }}>OP / Banco</th>
                    <th style={{ padding: '12px 14px' }}>Vencimento</th>
                    
                    {activeTab === 'aprovadas' && (
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status Pagamento</th>
                    )}

                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Ações / Análise</th>
                  </tr>
                </thead>
                <tbody>
                  {listaExibicao.map((item, idx) => {
                    const prioObj = PRIORIDADES.find(p => p.value === item.prioridade) || PRIORIDADES[1];

                    return (
                      <tr 
                        key={item.id}
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
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
                        <td style={{ padding: '12px 14px', maxWidth: '320px' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.nome}</div>
                          {item.observacao && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MessageSquare size={10} /> {item.observacao}
                            </div>
                          )}
                          {item.obsAprovacao && (
                            <div style={{ fontSize: '11px', color: item.status === 'APROVADA' ? '#34d399' : '#f87171', marginTop: '2px', fontStyle: 'italic' }}>
                              Obs Análise: "{item.obsAprovacao}"
                            </div>
                          )}
                        </td>

                        {/* Valor & Parcelas */}
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace' }}>
                          <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: '14px' }}>
                            {formatMoney(item.valor)}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            {item.parcelas > 1 ? `${item.parcelas}x parcelas` : 'À vista (1x)'}
                          </div>
                        </td>

                        {/* OP / Banco */}
                        <td style={{ padding: '12px 14px', fontSize: '11px' }}>
                          {item.temOP ? (
                            <span style={{ color: '#38bdf8', fontWeight: 600, display: 'block' }}>OP: {item.numeroOP}</span>
                          ) : (
                            <span style={{ color: '#64748b', display: 'block' }}>Sem OP</span>
                          )}
                          <span style={{ color: '#cbd5e1' }}>{item.banco}</span>
                        </td>

                        {/* Vencimento */}
                        <td style={{ padding: '12px 14px', color: '#cbd5e1', fontSize: '12px' }}>
                          {formatDate(item.vencimento)}
                        </td>

                        {/* Status Pagamento (Só na aba Aprovadas) */}
                        {activeTab === 'aprovadas' && (
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleTogglePagamento(item.id)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                border: 'none',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: item.statusPagamento === 'PAGO' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: item.statusPagamento === 'PAGO' ? '#34d399' : '#fbbf24',
                                border: item.statusPagamento === 'PAGO' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                              }}
                              title="Clique para alterar status de pagamento"
                            >
                              {item.statusPagamento === 'PAGO' ? '✓ PAGO' : '⏳ Pendente de Pagamento'}
                            </button>
                            {item.dataPagamento && (
                              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                Pago em: {formatDate(item.dataPagamento)}
                              </div>
                            )}
                          </td>
                        )}

                        {/* Botões de Ação */}
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {activeTab === 'pendentes' && (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                onClick={() => setModalAprovacao({ despesa: item, acao: 'APROVAR' })}
                                style={{ padding: '6px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Check size={12} /> Aprovar
                              </button>
                              <button
                                onClick={() => setModalAprovacao({ despesa: item, acao: 'REPROVAR' })}
                                style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <X size={12} /> Reprovar
                              </button>
                            </div>
                          )}

                          {activeTab !== 'pendentes' && (
                            <button
                              onClick={() => handleExcluirDespesa(item.id)}
                              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                              title="Excluir despesa"
                            >
                              <Trash2 size={14} color="#f87171" />
                            </button>
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

      {/* ABA 5: RELATÓRIO MENSAL (PAGO VS PENDENTE) */}
      {activeTab === 'relatorio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Gráfico Comparativo Mês a Mês */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart size={18} color="#60a5fa" opacity={1} />
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

          {/* Resumo Consolidado por Empresa */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px' }}>
              Consolidado por Empresa do Grupo
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Empresa</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Pago (R$)</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Pendente Pagamento (R$)</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Aprovado (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosRelatorioMensal.empresas.map((emp, idx) => (
                    <tr key={emp.empresa} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#f8fafc' }}>
                        {emp.empresa}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
                        {formatMoney(emp.pago)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#fbbf24', fontFamily: 'monospace' }}>
                        {formatMoney(emp.pendente)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#60a5fa', fontFamily: 'monospace' }}>
                        {formatMoney(emp.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

    </div>
  );
}
