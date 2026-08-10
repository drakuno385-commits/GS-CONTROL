import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Calendar, Search, Loader2, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const RelatorioVisitas = ({ rawEfetivos = [], rawPresencas = [] }) => {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // By default, current month
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [dataInicio, setDataInicio] = useState(startOfMonth);
  const [dataFim, setDataFim] = useState(endOfMonth);
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

  const visitasFiltradas = useMemo(() => {
    if (!buscaSupervisor) return visitas;
    return visitas.filter(v => 
      (v.nome_supervisor || '').toLowerCase().includes(buscaSupervisor.toLowerCase())
    );
  }, [visitas, buscaSupervisor]);

  // Tempo Médio por Cliente
  const dataTempoMedio = useMemo(() => {
    const mapa = {};
    visitasFiltradas.forEach(v => {
      const cli = v.nomecli || 'Sem Cliente';
      if (!v.hora_chegada || !v.hora_saida) return;

      try {
        const start = new Date(v.hora_chegada);
        const end = new Date(v.hora_saida);
        const diffMinutes = (end - start) / 60000;
        
        if (diffMinutes > 0 && diffMinutes < 1440) { // filter out absurd durations
          if (!mapa[cli]) mapa[cli] = { name: cli, totalMinutos: 0, contagem: 0 };
          mapa[cli].totalMinutos += diffMinutes;
          mapa[cli].contagem += 1;
        }
      } catch (e) {
        // ignore invalid dates
      }
    });

    return Object.values(mapa).map(c => ({
      name: c.name,
      minutosMedios: Math.round(c.totalMinutos / c.contagem),
      visitas: c.contagem
    })).sort((a, b) => b.minutosMedios - a.minutosMedios).slice(0, 15);
  }, [visitasFiltradas]);

  // Postos Não Visitados
  const postosNaoVisitados = useMemo(() => {
    // 1. Gather all unique postos from Efetivos and Presencas
    const todosPostos = new Map();
    
    const isValid = p => p && !p.toString().toUpperCase().includes('FALTA INJUSTIFICADA') && p.toString().trim() !== '';

    rawEfetivos.forEach(r => {
      if (isValid(r.posto)) {
        todosPostos.set(r.posto.trim().toUpperCase(), { posto: r.posto.trim(), cliente: (r.cliente || '').trim() });
      }
    });
    rawPresencas.forEach(r => {
      if (isValid(r.posto)) {
        todosPostos.set(r.posto.trim().toUpperCase(), { posto: r.posto.trim(), cliente: (r.cliente || '').trim() });
      }
    });

    // 2. Gather visited postos in the filtered period
    const postosVisitados = new Set();
    visitasFiltradas.forEach(v => {
      if (v.nomepos) {
        postosVisitados.add(v.nomepos.trim().toUpperCase());
      }
    });

    // 3. Filter out the ones that were visited
    const naoVisitados = [];
    todosPostos.forEach((data, postoUpper) => {
      if (!postosVisitados.has(postoUpper)) {
        naoVisitados.push(data);
      }
    });

    // Sort by client, then posto
    return naoVisitados.sort((a, b) => a.cliente.localeCompare(b.cliente) || a.posto.localeCompare(b.posto));
  }, [rawEfetivos, rawPresencas, visitasFiltradas]);

  // Visitas por Supervisor
  const dataSupervisor = useMemo(() => {
    const mapa = {};
    visitasFiltradas.forEach(v => {
      const sup = v.nome_supervisor || 'Não Identificado';
      if (!mapa[sup]) mapa[sup] = { name: sup, value: 0 };
      mapa[sup].value += 1;
    });
    return Object.values(mapa).sort((a, b) => b.value - a.value);
  }, [visitasFiltradas]);

  const CustomTooltipTempo = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const minutos = payload[0].value;
      const horas = Math.floor(minutos / 60);
      const min = minutos % 60;
      const text = horas > 0 ? `${horas}h ${min}m` : `${min} min`;
      return (
        <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
          <p style={{ margin: 0, color: '#f59e0b' }}>Tempo Médio: {text}</p>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Total de Visitas: {payload[0].payload.visitas}</p>
        </div>
      );
    }
    return null;
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
                Volume de Visitas por Supervisor
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

            {/* Gráfico Tempo Médio Cliente */}
            <div className="card glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '16px', background: '#f59e0b', borderRadius: '2px' }} />
                Tempo Médio de Visita por Cliente (Top 15)
              </h3>
              {dataTempoMedio.length === 0 ? (
                 <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Sem dados de tempo</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dataTempoMedio} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis dataKey="name" type="category" width={120} stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip content={<CustomTooltipTempo />} />
                    <Bar dataKey="minutosMedios" name="Minutos" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                      {dataTempoMedio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index+2) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Postos Não Visitados */}
          <div className="card glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '16px', background: '#ef4444', borderRadius: '2px' }} />
                Postos Não Visitados no Período
              </div>
              <span style={{ fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 10px', borderRadius: '20px' }}>
                {postosNaoVisitados.length} postos pendentes
              </span>
            </h3>
            
            {postosNaoVisitados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#10b981' }}>
                <CheckCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.8 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Excelente!</p>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>Todos os postos ativos receberam visita no período selecionado.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.05)', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600, fontSize: '13px' }}>Cliente</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600, fontSize: '13px' }}>Nome do Posto</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postosNaoVisitados.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>
                          {p.cliente || 'Sem Cliente'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#e2e8f0', fontSize: '14px' }}>
                          {p.posto}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                           <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '12px', fontWeight: 600 }}>
                              <AlertTriangle size={12} />
                              Sem Visita
                           </span>
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
