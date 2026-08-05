import React from 'react';
import { Users, AlertCircle, TrendingUp, Activity, Printer } from 'lucide-react';

const Dashboard = ({ rawEfetivos, rawPresencas, rawFrota, rawAtestados }) => {
  // Cálculos rápidos
  const totalEfetivos = rawEfetivos.length;
  
  // Frota
  const totalGastoFrota = rawFrota.reduce((acc, row) => {
    let valor = 0;
    if (row.valor_total) {
      if (typeof row.valor_total === 'number') valor = row.valor_total;
      else if (typeof row.valor_total === 'string') valor = parseFloat(row.valor_total.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
    }
    return acc + (isNaN(valor) ? 0 : valor);
  }, 0);

  // Disciplina (Faltas Tipo S)
  const totalFaltas = rawPresencas.filter(r => r.tipo && r.tipo.toUpperCase().includes('S')).length;

  // Atestados
  const totalAtestados = rawAtestados.length;
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ color: '#fff', margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp color="#38bdf8" size={32} />
            Visão Executiva
          </h1>
          <p style={{ color: '#94a3b8', margin: '8px 0 0 0' }}>Resumo global de indicadores estratégicos</p>
        </div>
        <button 
          onClick={handlePrint}
          className="print-hide"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: 'linear-gradient(to right, #0ea5e9, #2563eb)', 
            color: '#fff', border: 'none', padding: '12px 20px', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
          }}
        >
          <Printer size={18} /> Exportar Relatório (PDF)
        </button>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div className="card stat-card glass-panel" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#10b981" /> Total Efetivo Ativo
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>{totalEfetivos}</div>
        </div>

        <div className="card stat-card glass-panel" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#ef4444" /> Ocorrências (Faltas S)
          </div>
          <div className="stat-value" style={{ color: '#ef4444' }}>{totalFaltas}</div>
        </div>

        <div className="card stat-card glass-panel" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#f59e0b" /> Atestados Emitidos
          </div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{totalAtestados}</div>
        </div>

        <div className="card stat-card glass-panel" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#38bdf8" /> Gasto Total (Frota)
          </div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGastoFrota)}
          </div>
        </div>

      </div>

      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="card chart-card glass-panel">
          <div className="chart-header">
            <div className="chart-title">Status Global de Preenchimento</div>
          </div>
          <div className="reserva-table">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '16px 12px' }}>Módulo</th>
                  <th style={{ padding: '16px 12px' }}>Registros Atuais</th>
                  <th style={{ padding: '16px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 600, color: '#e2e8f0' }}>Gestão de Efetivos</td>
                  <td style={{ padding: '16px 12px', color: '#94a3b8' }}>{totalEfetivos} linhas</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ background: totalEfetivos > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: totalEfetivos > 0 ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      {totalEfetivos > 0 ? 'DADOS CARREGADOS' : 'PENDENTE'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 600, color: '#e2e8f0' }}>Gestão de Frota</td>
                  <td style={{ padding: '16px 12px', color: '#94a3b8' }}>{rawFrota.length} linhas</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ background: rawFrota.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: rawFrota.length > 0 ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      {rawFrota.length > 0 ? 'DADOS CARREGADOS' : 'PENDENTE'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 600, color: '#e2e8f0' }}>Disciplina</td>
                  <td style={{ padding: '16px 12px', color: '#94a3b8' }}>{rawPresencas.length} linhas</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ background: rawPresencas.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: rawPresencas.length > 0 ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      {rawPresencas.length > 0 ? 'DADOS CARREGADOS' : 'PENDENTE'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 600, color: '#e2e8f0' }}>Atestados</td>
                  <td style={{ padding: '16px 12px', color: '#94a3b8' }}>{rawAtestados.length} linhas</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ background: rawAtestados.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: rawAtestados.length > 0 ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      {rawAtestados.length > 0 ? 'DADOS CARREGADOS' : 'PENDENTE'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
