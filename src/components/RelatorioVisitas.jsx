import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Calendar, Search, Loader2, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';


const EXCLUDED_CLIENTS = ["ADMINISTRATIVO","ENERGISA","BELLS ADM","INST PREV OSASCO","LOGICA ADM","REGIONAL ADM","RESERVA TECNICA"];
const isClientAllowed = (c, p = '') => {
  const str = (c || '').toString().toUpperCase() + ' ' + (p || '').toString().toUpperCase();
  return !EXCLUDED_CLIENTS.some(ex => str.includes(ex));
};

const COLORS = ['url(#metalSteel)', 'url(#metalBlue)', 'url(#metalSilver)', 'url(#metalGold)', 'url(#metalCyan)', 'url(#metalEmerald)', 'url(#metalBronze)', 'url(#metalPurple)'];

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
  const [supHistory, setSupHistory] = useState(null);
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  useEffect(() => {
    fetchVisitas();
  }, [dataInicio, dataFim]);

  
  const runFixAccents = async () => {
    alert('Iniciando correção de acentos no banco de dados...');
    const { data } = await supabase.from('postos').select('id, nomecli, nomepos');
    let count = 0;
    
    const fixStr = (str) => {
      if (!str) return str;
      let f = str;
      
      // UTF-8 decoded as ISO-8859-1
      f = f.replace(/Ã£/g, 'ã').replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ãª/g, 'ê')
           .replace(/Ã³/g, 'ó').replace(/Ã§/g, 'ç').replace(/Ãº/g, 'ú').replace(/Ã­/g, 'í')
           .replace(/Ãµ/g, 'õ').replace(/Ã¢/g, 'â').replace(/Ã´/g, 'ô');
           
      // UTF-8 decoded as ISO-8859-1 (uppercase variants)
      f = f.replace(/Ã\x83/g, 'Ã').replace(/Ã\x81/g, 'Á').replace(/Ã\x89/g, 'É')
           .replace(/Ã\x8A/g, 'Ê').replace(/Ã\x93/g, 'Ó').replace(/Ã\x87/g, 'Ç')
           .replace(/Ã\x9A/g, 'Ú').replace(/Ã\x8D/g, 'Í').replace(/Ã\x95/g, 'Õ')
           .replace(/Ã\x82/g, 'Â').replace(/Ã\x94/g, 'Ô');
           
      // If there are replacement characters, we try to guess based on common words
      f = f.replace(/USINAGEM DE PRECIS\ufffdO/gi, 'USINAGEM DE PRECISÃO');
      f = f.replace(/M\ufffdDICO/gi, 'MÉDICO');
      f = f.replace(/S\ufffdO PAULO/gi, 'SÃO PAULO');
      f = f.replace(/CONDOM\ufffdNIO/gi, 'CONDOMÍNIO');
      f = f.replace(/COM\ufffdRCIO/gi, 'COMÉRCIO');
      f = f.replace(/LOG\ufffdSTICA/gi, 'LOGÍSTICA');
      f = f.replace(/T\ufffdCNICA/gi, 'TÉCNICA');
      f = f.replace(/T\ufffdCNICO/gi, 'TÉCNICO');
      f = f.replace(/SERVI\ufffdOS/gi, 'SERVIÇOS');
      f = f.replace(/A\ufffd\ufffdO/gi, 'AÇÃO');
      f = f.replace(/A\ufffd\ufffdES/gi, 'AÇÕES');
      f = f.replace(/M\ufffdquinas/gi, 'Máquinas');
      f = f.replace(/S\ufffdo/gi, 'São');
      
      return f;
    };

    for (const row of data) {
      const fixedCli = fixStr(row.nomecli);
      const fixedPos = fixStr(row.nomepos);
      
      if (fixedCli !== row.nomecli || fixedPos !== row.nomepos) {
        await supabase.from('postos').update({ nomecli: fixedCli, nomepos: fixedPos }).eq('id', row.id);
        count++;
      }
    }
    alert('Concluído! ' + count + ' postos corrigidos. Atualize a página.');
  };

  const fetchVisitas = async () => {
    setLoading(true);
    let query = supabase.from('visitas').select('*').limit(10000);
    
    if (dataInicio) {
      const start = new Date(`${dataInicio}T00:00:00.000-03:00`);
      query = query.gte('created_at', start.toISOString());
    }
    if (dataFim) {
      const end = new Date(`${dataFim}T23:59:59.999-03:00`);
      query = query.lte('created_at', end.toISOString());
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

  // Visitas por Dia
  const visitasPorDia = useMemo(() => {
    const mapa = {};
    visitasFiltradas.forEach(v => {
      const dateObj = new Date(v.created_at);
      if (isNaN(dateObj.getTime())) return;
      const dataStr = dateObj.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      if (!mapa[dataStr]) {
        mapa[dataStr] = {
           data: dataStr,
           timestamp: dateObj.setHours(0,0,0,0),
           total: 0,
           supervisores: {}
        };
      }
      mapa[dataStr].total++;
      const sup = v.nome_supervisor || 'Não Identificado';
      if (!mapa[dataStr].supervisores[sup]) mapa[dataStr].supervisores[sup] = 0;
      mapa[dataStr].supervisores[sup]++;
    });
    return Object.values(mapa).sort((a, b) => a.timestamp - b.timestamp);
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
      <div className="card glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '32px', alignItems: 'flex-end', padding: '24px', borderTop: '4px solid #3b82f6', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Data Inicial</label>
          <div style={{ position: 'relative' }}>
            <Calendar size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="date" 
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '12px 12px 12px 42px', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', width: '160px', colorScheme: 'dark', transition: 'all 0.2s', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
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
              style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '12px 12px 12px 42px', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', width: '160px', colorScheme: 'dark', transition: 'all 0.2s', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
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
              style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '12px 12px 12px 42px', borderRadius: '10px', color: '#f8fafc', fontSize: '14px', width: '100%', transition: 'all 0.2s', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
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
          
          <div className="card glass-panel" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 8px 20px -6px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#3b82f6" /> 
              Evolução Diária de Visitas (Clique na barra para detalhes)
            </h3>
            {visitasPorDia.length === 0 ? (
               <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Sem dados no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={visitasPorDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="data" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#1e293b', strokeWidth: 2 }} activeDot={{ r: 6, onClick: (_, e) => setDiaSelecionado(e.payload), cursor: 'pointer' }} onClick={(data) => setDiaSelecionado(data?.activePayload?.[0]?.payload || data)} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            
            {/* Gráfico Supervisor */}
            <div className="card glass-panel" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 8px 20px -6px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '4px', height: '16px', background: '#3b82f6', borderRadius: '2px' }} />
                Volume de Visitas por Supervisor
              </h3>
              {dataSupervisor.length === 0 ? (
                 <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Sem dados</div>
              ) : (
                 <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie onClick={(data, index) => { if(data && data.name) setSupHistory(data.name); }} style={{ cursor: "pointer" }} data={dataSupervisor}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent, x, y, cx }) => (
                        <text x={x} y={y} fill="#e2e8f0" style={{ cursor: 'pointer' }} onClick={() => setSupHistory(name)} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={500}>
                          {`${name} (${(percent * 100).toFixed(0)}%)`}
                        </text>
                      )}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataSupervisor.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ cursor: 'pointer', outline: 'none' }} onClick={() => setSupHistory(entry.name)} />
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
            <div className="card glass-panel" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 8px 20px -6px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
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
                    <Bar dataKey="minutosMedios" name="Minutos" fill="#8b5cf6" radius={[0, 6, 6, 0]}>
                      {dataTempoMedio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index+2) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          </>
      )}
    
      
      {diaSelecionado && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDiaSelecionado(null)}>
          <div style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={20} color="#3b82f6"/> Visitas em {diaSelecionado.data}</h3>
              <button onClick={() => setDiaSelecionado(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(diaSelecionado.supervisores).sort((a, b) => b[1] - a[1]).map(([sup, count]) => (
                <div key={sup} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{sup}</div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700 }}>
                    {count} {count === 1 ? 'visita' : 'visitas'}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
              Total no dia: {diaSelecionado.total}
            </div>
          </div>
        </div>
      )}

      {supHistory && (() => {
        const supVisitas = visitasFiltradas.filter(v => (v.nome_supervisor || 'Não Identificado') === supHistory);
        const postosAgrupados = Object.values(supVisitas.reduce((acc, v) => {
          const p = v.posto || 'Posto Desconhecido';
          if (!acc[p]) acc[p] = { nome: p, cliente: v.nomecli || 'Sem Cliente', count: 0, datas: [] };
          acc[p].count++;
          acc[p].datas.push(v);
          return acc;
        }, {})).sort((a, b) => b.count - a.count);
        
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSupHistory(null)}>
            <div style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', position: 'sticky', top: '-24px', background: '#0f172a', zIndex: 10 }}>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>Histórico de Visitas - {supHistory}</h3>
                <button onClick={() => setSupHistory(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {postosAgrupados.map(p => (
                  <div key={p.nome} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{p.nome}</div>
                        <div style={{ color: '#94a3b8', fontSize: '13px' }}>Cliente: {p.cliente}</div>
                      </div>
                      <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                        {p.count} {p.count === 1 ? 'visita' : 'visitas'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {p.datas.map(v => {
                        const d = new Date(v.created_at);
                        const dataLocal = isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                        let timeStr = '';
                        if (v.hora_chegada) {
                           timeStr = typeof v.hora_chegada === 'string' && v.hora_chegada.includes(' ') ? v.hora_chegada.split(' ')[1].substring(0,5) : (typeof v.hora_chegada === 'string' && v.hora_chegada.includes('T') ? v.hora_chegada.split('T')[1].substring(0,5) : v.hora_chegada);
                        }
                        return (
                          <div key={v.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {dataLocal} {timeStr ? ` às ${timeStr}` : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {postosAgrupados.length === 0 && (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Nenhuma visita encontrada neste período.</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
</div>
  );
};

export default RelatorioVisitas;
