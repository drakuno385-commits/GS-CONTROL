import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Calendar, Search, Loader2, FileText, CheckCircle, Clock } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const RelatorioVisitas = () => {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [buscaSupervisor, setBuscaSupervisor] = useState('');

  useEffect(() => {
    fetchVisitas();
  }, [dataInicio, dataFim]);

  const fetchVisitas = async () => {
    setLoading(true);
    let query = supabase.from('visitas').select('*');
    
    if (dataInicio) {
      query = query.gte('created_at', `${dataInicio}T00:00:00.000Z`);
    }
    if (dataFim) {
      query = query.lte('created_at', `${dataFim}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar visitas:', error);
      alert('Falha ao carregar visitas.');
    } else {
      setVisitas(data || []);
    }
    setLoading(false);
  };

  // Filtragem local extra (Supervisor)
  const visitasFiltradas = useMemo(() => {
    if (!buscaSupervisor) return visitas;
    return visitas.filter(v => 
      (v.nome_supervisor || '').toLowerCase().includes(buscaSupervisor.toLowerCase())
    );
  }, [visitas, buscaSupervisor]);

  // Agrupamentos
  const dataSupervisor = useMemo(() => {
    const mapa = {};
    visitasFiltradas.forEach(v => {
      const sup = v.nome_supervisor || 'Não Identificado';
      if (!mapa[sup]) mapa[sup] = { name: sup, value: 0 };
      mapa[sup].value += 1;
    });
    return Object.values(mapa).sort((a, b) => b.value - a.value);
  }, [visitasFiltradas]);

  const dataCliente = useMemo(() => {
    const mapa = {};
    visitasFiltradas.forEach(v => {
      const cli = v.nomecli || 'Sem Cliente';
      if (!mapa[cli]) mapa[cli] = { name: cli, value: 0 };
      mapa[cli].value += 1;
    });
    // Pega os top 10 para não poluir o gráfico
    return Object.values(mapa).sort((a, b) => b.value - a.value).slice(0, 15);
  }, [visitasFiltradas]);

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch {
      return '';
    }
  };

  const calcularDuracao = (chegada, saida) => {
    if (!chegada || !saida) return '-';
    try {
      const start = new Date(chegada);
      const end = new Date(saida);
      const diff = Math.floor((end - start) / 60000); 
      if (diff < 60) return `${diff} min`;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return `${h}h ${m}m`;
    } catch {
      return '-';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', fontWeight: 700, margin: 0 }}>
          <FileText size={28} color="#3b82f6" />
          Relatório de Visitas
        </h2>
      </div>

      {/* Filtros */}
      <div className="card glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', alignItems: 'flex-end', padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Data Inicial</label>
          <div style={{ position: 'relative' }}>
            <Calendar size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="date" 
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px 10px 40px', borderRadius: '8px', color: '#fff', fontSize: '14px', width: '160px', colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Data Final</label>
          <div style={{ position: 'relative' }}>
            <Calendar size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="date" 
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px 10px 40px', borderRadius: '8px', color: '#fff', fontSize: '14px', width: '160px', colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '200px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Buscar Supervisor</label>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Digite o nome..."
              value={buscaSupervisor}
              onChange={(e) => setBuscaSupervisor(e.target.value)}
              style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px 10px 40px', borderRadius: '8px', color: '#fff', fontSize: '14px', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <Loader2 size={40} className="spin-animation" style={{ margin: '0 auto 16px', color: '#3b82f6' }} />
          <p>Processando relatórios...</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            
            {/* Gráfico Supervisor */}
            <div className="card glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '16px', background: '#3b82f6', borderRadius: '2px' }} />
                Visitas por Supervisor
              </h3>
              {dataSupervisor.length === 0 ? (
                 <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Sem dados</div>
              ) : (
                 <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dataSupervisor}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataSupervisor.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Gráfico Cliente */}
            <div className="card glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '16px', background: '#10b981', borderRadius: '2px' }} />
                Visitas por Cliente (Top 15)
              </h3>
              {dataCliente.length === 0 ? (
                 <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dataCliente} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis dataKey="name" type="category" width={120} stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    />
                    <Bar dataKey="value" name="Total de Visitas" fill="#10b981" radius={[0, 4, 4, 0]}>
                      {dataCliente.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tabela Analítica */}
          <div className="card glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '16px', background: '#8b5cf6', borderRadius: '2px' }} />
              Detalhes das Visitas ({visitasFiltradas.length} encontradas)
            </h3>
            
            {visitasFiltradas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <CheckCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                Nenhum registro para exibir
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600, fontSize: '13px' }}>Data</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600, fontSize: '13px' }}>Supervisor</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600, fontSize: '13px' }}>Cliente / Posto</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600, fontSize: '13px' }}>Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitasFiltradas.map((v) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>
                          {formatDate(v.created_at)}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: '14px', fontWeight: 500 }}>
                          {v.nome_supervisor || '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 500 }}>{v.nomecli || '-'}</div>
                          <div style={{ color: '#64748b', fontSize: '12px' }}>{v.nomepos || '-'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#3b82f6', fontSize: '13px', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} />
                            {calcularDuracao(v.hora_chegada, v.hora_saida)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RelatorioVisitas;
