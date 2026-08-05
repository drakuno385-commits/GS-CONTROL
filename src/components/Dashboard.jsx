import React, { useMemo } from 'react';
import { Users, AlertCircle, TrendingUp, Activity, Printer, DollarSign, Stethoscope, Briefcase } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';

const Dashboard = ({ rawEfetivos, rawPresencas, rawFrota, rawAtestados }) => {

  // Error Boundary HOC style inside component
  try {
    // Processamento Otimizado
    const { 
      totalEfetivos, 
      totalFaltas, 
      totalAtestados, 
      totalGastoFrota,
      topFaltosos,
      topFrota,
      custoPorPosto,
      ocorrenciasPorPosto
    } = useMemo(() => {
      
      const parseMoney = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        let parsed = parseFloat(String(val).replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
        return isNaN(parsed) ? 0 : parsed;
      };

      const efetivos = (rawEfetivos || []).length;
      const faltasS = (rawPresencas || []).filter(r => r && r.tipo && String(r.tipo).toUpperCase().includes('S'));
      const atestados = (rawAtestados || []);
      const frota = (rawFrota || []);
      
      let gastoFrota = 0;
      const veiculos = {};
      const postosCusto = {};

      frota.forEach(r => {
        if (!r) return;
        const valor = parseMoney(r.valor_total);
        gastoFrota += valor;
        
        const placa = r.placa || 'N/A';
        veiculos[placa] = (veiculos[placa] || 0) + valor;

        const posto = r.posto || 'Sede';
        postosCusto[posto] = (postosCusto[posto] || 0) + valor;
      });

      const faltososDict = {};
      faltasS.forEach(r => {
        if (!r) return;
        const nome = r.nome || 'Desconhecido';
        faltososDict[nome] = (faltososDict[nome] || 0) + 1;
      });

      const occPorPosto = {};
      faltasS.forEach(r => {
        if (!r) return;
        const posto = r.posto || 'Sede';
        if (!occPorPosto[posto]) occPorPosto[posto] = { name: posto, faltas: 0, atestados: 0 };
        occPorPosto[posto].faltas += 1;
      });
      
      atestados.forEach(r => {
        if (!r) return;
        const posto = r.posto || 'Sede';
        if (!occPorPosto[posto]) occPorPosto[posto] = { name: posto, faltas: 0, atestados: 0 };
        occPorPosto[posto].atestados += 1;
      });

      const topFalt = Object.entries(faltososDict).sort((a,b) => b[1] - a[1]).slice(0, 5);
      const topVeic = Object.entries(veiculos).sort((a,b) => b[1] - a[1]).slice(0, 5);
      const topCustosPosto = Object.entries(postosCusto).sort((a,b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({name, value}));
      const occData = Object.values(occPorPosto).sort((a,b) => (b.faltas + b.atestados) - (a.faltas + a.atestados)).slice(0, 6);

      return {
        totalEfetivos: efetivos,
        totalFaltas: faltasS.length,
        totalAtestados: atestados.length,
        totalGastoFrota: gastoFrota,
        topFaltosos: topFalt || [],
        topFrota: topVeic || [],
        custoPorPosto: topCustosPosto || [],
        ocorrenciasPorPosto: occData || []
      };
    }, [rawEfetivos, rawPresencas, rawFrota, rawAtestados]);

    const handlePrint = () => {
      window.print();
    };

    const fmtBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
      <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
        
        {/* HEADER EXCLUSIVO IMPRESSÃO (Oculto na tela, Visível no PDF) */}
        <div className="print-only-header" style={{ display: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '2px solid #2563eb', paddingBottom: '20px', marginBottom: '20px' }}>
            <img src="/logo.jpg" alt="GSolimpio Logo" style={{ height: '60px', borderRadius: '8px' }} />
            <div>
              <h1 style={{ margin: 0, color: '#1e293b', fontSize: '24px' }}>Relatório Executivo Mensal de Operações</h1>
              <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>
                Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3b82f6', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '16px' }}>Resumo Executivo Integrado</h3>
            <p style={{ margin: 0, color: '#334155', lineHeight: '1.6', fontSize: '14px' }}>
              Durante o período analisado, o quadro de <strong>{totalEfetivos} colaboradores</strong> registrou <strong>{totalFaltas} faltas</strong> não justificadas e <strong>{totalAtestados} atestados médicos</strong>. O setor logístico (Frota) teve um consumo global contabilizado de <strong>{fmtBRL(totalGastoFrota)}</strong>. 
              {topFrota.length > 0 && ` O veículo de maior despesa foi o ${topFrota[0][0]} com ${fmtBRL(topFrota[0][1])}. `}
              {topFaltosos.length > 0 && ` No aspecto disciplinar, a maior incidência de faltas partiu de ${topFaltosos[0][0]} (${topFaltosos[0][1]} faltas). `}
              Os indicadores abaixo detalham a distribuição destas métricas por centro de custo/posto para auxiliar na tomada de decisão estratégica.
            </p>
          </div>
        </div>


        {/* HEADER DA TELA (Oculto na Impressão) */}
        <div className="print-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ color: '#fff', margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Activity color="#38bdf8" size={32} />
              Visão Executiva (Dashboard)
            </h1>
            <p style={{ color: '#94a3b8', margin: '8px 0 0 0' }}>Análise cruzada de Frota, RH e Disciplina</p>
          </div>
          <button 
            onClick={handlePrint}
            className="print-hide glass-button"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'linear-gradient(to right, #0ea5e9, #2563eb)', 
              color: '#fff', border: 'none', padding: '12px 20px', 
              borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Printer size={18} /> Gerar Relatório Executivo (PDF)
          </button>
        </div>

        {/* PAINEL DE KPIs PRINCIPAIS */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          
          <div className="card glass-panel print-card" style={{ borderBottom: '4px solid #38bdf8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px', borderRadius: '12px' }}><DollarSign size={24} color="#38bdf8" /></div>
              <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>CUSTO GLOBAL FROTA</div>
            </div>
            <div style={{ color: '#fff', fontSize: '32px', fontWeight: 700, letterSpacing: '-1px' }} className="print-text-dark">
              {fmtBRL(totalGastoFrota)}
            </div>
          </div>

          <div className="card glass-panel print-card" style={{ borderBottom: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '12px' }}><AlertCircle size={24} color="#ef4444" /></div>
              <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>OCORRÊNCIAS TIPO S</div>
            </div>
            <div style={{ color: '#fff', fontSize: '32px', fontWeight: 700 }} className="print-text-dark">{totalFaltas}</div>
          </div>

          <div className="card glass-panel print-card" style={{ borderBottom: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '12px' }}><Stethoscope size={24} color="#f59e0b" /></div>
              <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>ATESTADOS MÉDICOS</div>
            </div>
            <div style={{ color: '#fff', fontSize: '32px', fontWeight: 700 }} className="print-text-dark">{totalAtestados}</div>
          </div>

          <div className="card glass-panel print-card" style={{ borderBottom: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}><Users size={24} color="#10b981" /></div>
              <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>EFETIVO TOTAL</div>
            </div>
            <div style={{ color: '#fff', fontSize: '32px', fontWeight: 700 }} className="print-text-dark">{totalEfetivos}</div>
          </div>
        </div>

      {/* GRÁFICOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '30px' }}>
        
        {/* Gráfico Ocorrências (Barras Duplas) */}
        <div className="card glass-panel print-card" style={{ padding: '24px' }}>
          <h3 style={{ color: '#f8fafc', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="print-text-dark">
            <Briefcase size={18} color="#8b5cf6" /> Absenteísmo por Posto (Top 6)
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ocorrenciasPorPosto} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => val.substring(0,10)+'...'} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="faltas" name="Faltas (S)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atestados" name="Atestados" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Custos Frota */}
        <div className="card glass-panel print-card" style={{ padding: '24px' }}>
          <h3 style={{ color: '#f8fafc', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }} className="print-text-dark">
            <TrendingUp size={18} color="#38bdf8" /> Custos de Frota por Centro de Custo
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={custoPorPosto} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => val.substring(0,12)+'...'} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `R$ ${val/1000}k`} />
                <Tooltip 
                  formatter={(val) => fmtBRL(val)}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="value" name="Gasto Frota" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* TOP OFENSORES E STATUS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Top 5 Faltosos */}
        <div className="card glass-panel print-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '15px' }} className="print-text-dark">Top 5 Maiores Faltosos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topFaltosos.length === 0 ? <p style={{color:'#94a3b8', fontSize: '13px'}}>Sem registros de faltas.</p> : 
              topFaltosos.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }} className="print-list-item">
                  <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 500 }} className="print-text-dark">{i+1}. {f[0]}</span>
                  <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>{f[1]} faltas</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Top 5 Frota */}
        <div className="card glass-panel print-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '15px' }} className="print-text-dark">Top 5 Veículos (Despesas)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topFrota.length === 0 ? <p style={{color:'#94a3b8', fontSize: '13px'}}>Sem registros de despesas.</p> : 
              topFrota.map((v, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }} className="print-list-item">
                  <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 500 }} className="print-text-dark">{i+1}. {v[0]}</span>
                  <span style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>{fmtBRL(v[1])}</span>
                </div>
              ))
            }
          </div>
        </div>

      </div>

    </div>
  );
};

  } catch (err) {
    console.error('Dashboard error', err);
    return <div style={{padding: '20px', color: 'white'}}>Falha ao carregar o Dashboard: {String(err.message)}</div>;
  }
}

export default Dashboard;
