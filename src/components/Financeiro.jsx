import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, PieChart as PieIcon, 
  BarChart3, Shield, ArrowUpRight, ArrowDownRight, Layers, FileText, 
  Download, Filter, Search, Calculator, Percent, Sparkles, Building, Briefcase, RefreshCw, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { defaultPreviaPostos } from '../data/previaPostos';

const formatMoney = (val) => {
  return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatPercent = (val) => {
  return `${Number(val || 0).toFixed(1)}%`;
};

export default function Financeiro({ currentUser }) {
  // Carregar a base de postos cadastrados (ou do localStorage se houver)
  const postosBase = useMemo(() => {
    const cacheKeys = ['medicao_postos_db_v5', 'medicao_postos_db_v4', 'medicao_postos_db_v3'];
    for (const key of cacheKeys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return defaultPreviaPostos;
  }, []);

  // Carregar KMs se houver
  const kmsData = useMemo(() => {
    try {
      const saved = localStorage.getItem("medicao_kms_v2") || localStorage.getItem("medicao_kms_v1");
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return {};
  }, []);

  // Filtros
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroStatusMargem, setFiltroStatusMargem] = useState('TODOS'); // 'TODOS', 'ALTA', 'MEDIA', 'ALERTA'

  // Simulador de Reajuste / Dissídio
  const [simuladorPercent, setSimuladorPercent] = useState(0); // Ex: 5% de reajuste
  const [simuladorCustoAdicional, setSimuladorCustoAdicional] = useState(0);

  // Mapeamento Financeiro Processado
  const dadosFinanceiros = useMemo(() => {
    const percReajuste = 1 + (Number(simuladorPercent) || 0) / 100;
    const custoExtraGlb = Number(simuladorCustoAdicional) || 0;

    let totFaturamento = 0;
    let totCustosOperacionais = 0;
    let totKm = 0;

    const listaProcessada = postosBase.map(p => {
      const valorBase = Number(p.valor_mensal || 0);
      const faturamentoOrig = valorBase;
      const faturamentoSimulado = faturamentoOrig * percReajuste;

      // Estimativa de custo operacional por posto (salário + encargos ~66% do valor mensal)
      let percCustoBase = 0.66;
      if (p.empresa === 'REGIONAL') percCustoBase = 0.65;
      if (p.empresa === 'ACOFORTE') percCustoBase = 0.67;
      if (p.empresa === 'BELLS') percCustoBase = 0.62;

      const itemKey = p.id ? `id_${p.id}` : `${p.codcli}_${p.codpos}_${p.turno}_${p.escala || '12x36'}`;
      const kmInfo = kmsData[itemKey] || kmsData[`${p.codcli}_${p.codpos}_${p.turno}`];
      const valKm = kmInfo ? Number(kmInfo.km || 0) * Number(kmInfo.valor_km || 0) : 0;

      const custoOperacional = (faturamentoOrig * percCustoBase) + valKm;
      const margemLucroBruto = faturamentoSimulado - custoOperacional;
      const percMargem = faturamentoSimulado > 0 ? (margemLucroBruto / faturamentoSimulado) * 100 : 0;

      totFaturamento += faturamentoSimulado;
      totCustosOperacionais += custoOperacional;
      totKm += valKm;

      let statusMargem = 'ALTA'; // > 30%
      if (percMargem < 25) statusMargem = 'MEDIA';
      if (percMargem < 18) statusMargem = 'ALERTA';

      return {
        ...p,
        itemKey,
        faturamentoOrig,
        faturamento: faturamentoSimulado,
        custoOperacional,
        valKm,
        margemLucroBruto,
        percMargem,
        statusMargem
      };
    });

    // Impostos estimados (PIS/COFINS/ISS ~ 14.25%)
    const impostosTotais = totFaturamento * 0.1425;
    const faturamentoLiquido = totFaturamento - impostosTotais;
    const margemLiquidaTotal = faturamentoLiquido - totCustosOperacionais - custoExtraGlb;
    const percMargemLiquidaGeral = totFaturamento > 0 ? (margemLiquidaTotal / totFaturamento) * 100 : 0;

    return {
      lista: listaProcessada,
      totFaturamento,
      totCustosOperacionais: totCustosOperacionais + custoExtraGlb,
      totKm,
      impostosTotais,
      faturamentoLiquido,
      margemLiquidaTotal,
      percMargemLiquidaGeral,
      ticketMedio: listaProcessada.length > 0 ? totFaturamento / listaProcessada.length : 0
    };
  }, [postosBase, kmsData, simuladorPercent, simuladorCustoAdicional]);

  // Agrupamentos por Empresa para Gráficos
  const dadosPorEmpresa = useMemo(() => {
    const map = {};
    dadosFinanceiros.lista.forEach(p => {
      const emp = p.empresa || 'OUTROS';
      if (!map[emp]) {
        map[emp] = { empresa: emp, faturamento: 0, custo: 0, margem: 0, postos: 0 };
      }
      map[emp].faturamento += p.faturamento;
      map[emp].custo += p.custoOperacional;
      map[emp].margem += p.margemLucroBruto;
      map[emp].postos += 1;
    });

    return Object.values(map).map(e => ({
      ...e,
      percMargem: e.faturamento > 0 ? ((e.faturamento - e.custo) / e.faturamento) * 100 : 0
    }));
  }, [dadosFinanceiros]);

  // Agrupamento por Cliente (Top 10 Faturamento)
  const dadosPorCliente = useMemo(() => {
    const map = {};
    dadosFinanceiros.lista.forEach(p => {
      const cli = p.cliente || 'Outros';
      if (!map[cli]) {
        map[cli] = { cliente: cli, faturamento: 0, custo: 0, margem: 0 };
      }
      map[cli].faturamento += p.faturamento;
      map[cli].custo += p.custoOperacional;
      map[cli].margem += p.margemLucroBruto;
    });

    return Object.values(map)
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 8);
  }, [dadosFinanceiros]);

  // Composição de Custos (Pie Chart)
  const composicaoCustos = useMemo(() => {
    const MaoDeObra = dadosFinanceiros.totCustosOperacionais * 0.78;
    const EncargosSociais = dadosFinanceiros.totCustosOperacionais * 0.12;
    const InsumosEquipamentos = dadosFinanceiros.totCustosOperacionais * 0.06;
    const QuilometragemFleet = dadosFinanceiros.totKm;

    return [
      { name: 'Mão de Obra (Salários)', value: MaoDeObra, color: '#3b82f6' },
      { name: 'Encargos & Benefícios', value: EncargosSociais, color: '#8b5cf6' },
      { name: 'Frota & Quilometragem', value: QuilometragemFleet, color: '#f59e0b' },
      { name: 'Uniformes & Insumos', value: InsumosEquipamentos, color: '#10b981' }
    ];
  }, [dadosFinanceiros]);

  // Aplicar Filtros da Tabela
  const listaFiltrada = useMemo(() => {
    return dadosFinanceiros.lista.filter(p => {
      if (filtroEmpresa && p.empresa !== filtroEmpresa) return false;
      if (filtroCliente && p.cliente !== filtroCliente) return false;
      if (filtroStatusMargem !== 'TODOS' && p.statusMargem !== filtroStatusMargem) return false;
      if (filtroBusca) {
        const term = filtroBusca.toLowerCase();
        const matchPosto = (p.posto || '').toLowerCase().includes(term);
        const matchCliente = (p.cliente || '').toLowerCase().includes(term);
        const matchEmpresa = (p.empresa || '').toLowerCase().includes(term);
        if (!matchPosto && !matchCliente && !matchEmpresa) return false;
      }
      return true;
    });
  }, [dadosFinanceiros, filtroEmpresa, filtroCliente, filtroStatusMargem, filtroBusca]);

  // Listas para seletores de filtro
  const empresasList = useMemo(() => [...new Set(postosBase.map(p => p.empresa))].filter(Boolean).sort(), [postosBase]);
  const clientesList = useMemo(() => [...new Set(postosBase.map(p => p.cliente))].filter(Boolean).sort(), [postosBase]);

  // Exportar CSV Financeiro
  const exportarCSVFinanceiro = () => {
    const headers = ['ID', 'Empresa', 'Cliente', 'Posto', 'Turno', 'Escala', 'Faturamento Mensal (R$)', 'Custo Operacional Est. (R$)', 'Margem Bruta (R$)', 'Margem (%)', 'Status Margem'];
    const rows = listaFiltrada.map(item => [
      item.id,
      `"${item.empresa || ''}"`,
      `"${item.cliente || ''}"`,
      `"${item.posto || ''}"`,
      item.turno || '',
      item.escala || '',
      item.faturamento.toFixed(2),
      item.custoOperacional.toFixed(2),
      item.margemLucroBruto.toFixed(2),
      item.percMargem.toFixed(2),
      item.statusMargem
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medicao_financeiro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ color: '#f8fafc', padding: '24px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Cabeçalho Principal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <DollarSign size={28} color="#60a5fa" />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                Painel Financeiro & DRE Operacional
              </h1>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Análise de faturamento, margens de rentabilidade e projeção de receita dos contratos
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={exportarCSVFinanceiro}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(51, 65, 85, 0.6)',
              color: '#e2e8f0',
              padding: '10px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Download size={16} color="#38bdf8" />
            <span>Exportar Relatório CSV</span>
          </button>
        </div>
      </div>

      {/* Simulador de Reajuste / Dissídio (Card Destacado) */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '28px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={20} color="#60a5fa" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Simulador de Reajuste Contratual & Dissídio
            </h3>
            <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
              Simulação em Tempo Real
            </span>
          </div>

          {(simuladorPercent > 0 || simuladorCustoAdicional > 0) && (
            <button
              onClick={() => { setSimuladorPercent(0); setSimuladorCustoAdicional(0); }}
              style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} /> Resetar Simulação
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
              Reajuste Contratual Proposto (%)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={simuladorPercent}
                onChange={(e) => setSimuladorPercent(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              />
              <span style={{ fontSize: '16px', color: '#60a5fa', fontWeight: 700 }}>%</span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
              Custo Adicional Global Est. (R$/mês)
            </label>
            <input 
              type="number"
              step="1000"
              min="0"
              value={simuladorCustoAdicional}
              onChange={(e) => setSimuladorCustoAdicional(Number(e.target.value))}
              placeholder="Ex: 15000"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600
              }}
            />
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Impacto no Faturamento Bruto:</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: simuladorPercent > 0 ? '#10b981' : '#f8fafc' }}>
              +{formatMoney(dadosFinanceiros.totFaturamento - (dadosFinanceiros.totFaturamento / (1 + Number(simuladorPercent || 0)/100)))}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de KPIs Financeiros Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        
        {/* KPI 1: Faturamento Bruto */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Faturamento Bruto Medido</span>
            <div style={{ padding: '6px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '8px' }}>
              <DollarSign size={18} color="#60a5fa" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            {formatMoney(dadosFinanceiros.totFaturamento)}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={14} />
            <span>{dadosFinanceiros.lista.length} Postos Faturados</span>
          </div>
        </div>

        {/* KPI 2: Custos Operacionais */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Custos Operacionais Est.</span>
            <div style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '8px' }}>
              <CreditCard size={18} color="#f87171" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            {formatMoney(dadosFinanceiros.totCustosOperacionais)}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
            Inclui Salários, Encargos & KM
          </div>
        </div>

        {/* KPI 3: Margem Líquida */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Resultado Líquido Est.</span>
            <div style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px' }}>
              <TrendingUp size={18} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: dadosFinanceiros.margemLiquidaTotal >= 0 ? '#34d399' : '#f87171', letterSpacing: '-0.02em' }}>
            {formatMoney(dadosFinanceiros.margemLiquidaTotal)}
          </div>
          <div style={{ fontSize: '12px', color: '#34d399', marginTop: '8px', fontWeight: 600 }}>
            Margem Líquida: {formatPercent(dadosFinanceiros.percMargemLiquidaGeral)}
          </div>
        </div>

        {/* KPI 4: Ticket Médio por Posto */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Ticket Médio / Posto</span>
            <div style={{ padding: '6px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '8px' }}>
              <Briefcase size={18} color="#a78bfa" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            {formatMoney(dadosFinanceiros.ticketMedio)}
          </div>
          <div style={{ fontSize: '12px', color: '#a78bfa', marginTop: '8px' }}>
            Média de Receita por Contrato
          </div>
        </div>

      </div>

      {/* DRE Resumido (Demonstrativo Financeiro) */}
      <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#38bdf8" />
          Demonstrativo de Resultado do Exercício (DRE Operacional Estimado)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Receita Bruta Total</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>{formatMoney(dadosFinanceiros.totFaturamento)}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>100% da Operação</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Deduções & Impostos Est. (14.25%)</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f87171', marginTop: '4px' }}>-{formatMoney(dadosFinanceiros.impostosTotais)}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>PIS, COFINS, ISS</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Custos Diretos & KM Rodados</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>-{formatMoney(dadosFinanceiros.totCustosOperacionais)}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>KM: {formatMoney(dadosFinanceiros.totKm)}</div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Resultado Operacional Líquido</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>{formatMoney(dadosFinanceiros.margemLiquidaTotal)}</div>
            <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>Margem Líquida: {formatPercent(dadosFinanceiros.percMargemLiquidaGeral)}</div>
          </div>
        </div>
      </div>

      {/* Gráficos Financeiros (Grid 2 Colunas) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        {/* Gráfico 1: Faturamento vs Custo por Empresa */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#60a5fa" />
            Faturamento vs Custo Operacional por Empresa
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={dadosPorEmpresa} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="empresa" stroke="#94a3b8" />
                <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} stroke="#94a3b8" />
                <Tooltip formatter={(val) => [formatMoney(val)]} contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="faturamento" name="Faturamento Bruto" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="custo" name="Custo Operacional Est." fill="#f87171" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Composição de Custos */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={18} color="#a78bfa" />
            Composição Estimada dos Custos Operacionais
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={composicaoCustos}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {composicaoCustos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [formatMoney(val)]} contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Tabela Analítica de Postos & Margens */}
      <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        
        {/* Barra de Filtros da Tabela */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Detalhamento Financeiro por Posto ({listaFiltrada.length})
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Valores calculados com base no contrato vigente
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* Filtro Busca */}
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                placeholder="Buscar posto..."
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
              />
            </div>

            {/* Filtro Empresa */}
            <select
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px'
              }}
            >
              <option value="">Todas as Empresas</option>
              {empresasList.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            {/* Filtro Cliente */}
            <select
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                maxWidth: '200px'
              }}
            >
              <option value="">Todos os Clientes</option>
              {clientesList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

          </div>
        </div>

        {/* Tabela de Dados */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 14px' }}>Cód / ID</th>
                <th style={{ padding: '12px 14px' }}>Empresa</th>
                <th style={{ padding: '12px 14px' }}>Cliente</th>
                <th style={{ padding: '12px 14px' }}>Posto</th>
                <th style={{ padding: '12px 14px' }}>Turno</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Faturamento (R$)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Custo Est. (R$)</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Margem (R$)</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Margem (%)</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((item, idx) => (
                <tr 
                  key={item.itemKey}
                  style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                  }}
                >
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>
                    {item.codcli}-{item.codpos}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      fontSize: '11px', 
                      fontWeight: 600,
                      background: item.empresa === 'ACOFORTE' ? 'rgba(59, 130, 246, 0.15)' : (item.empresa === 'REGIONAL' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                      color: item.empresa === 'ACOFORTE' ? '#60a5fa' : (item.empresa === 'REGIONAL' ? '#a78bfa' : '#34d399')
                    }}>
                      {item.empresa || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#e2e8f0' }}>
                    {item.cliente}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#f8fafc', fontWeight: 500 }}>
                    {item.posto}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontSize: '10px', 
                      fontWeight: 600,
                      background: item.turno === 'NOTURNO' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: item.turno === 'NOTURNO' ? '#a78bfa' : '#60a5fa'
                    }}>
                      {item.turno}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#60a5fa', fontFamily: 'monospace' }}>
                    {formatMoney(item.faturamento)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', color: '#f87171', fontFamily: 'monospace' }}>
                    {formatMoney(item.custoOperacional)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: item.margemLucroBruto >= 0 ? '#34d399' : '#f87171', fontFamily: 'monospace' }}>
                    {formatMoney(item.margemLucroBruto)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: item.statusMargem === 'ALTA' ? 'rgba(16, 185, 129, 0.15)' : (item.statusMargem === 'MEDIA' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                      color: item.statusMargem === 'ALTA' ? '#34d399' : (item.statusMargem === 'MEDIA' ? '#fbbf24' : '#f87171')
                    }}>
                      {formatPercent(item.percMargem)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
