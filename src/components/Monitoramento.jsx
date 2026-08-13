import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { Camera, MapPin, Building, Clock, Activity, Search, Calendar, User, ExternalLink, Image as ImageIcon, Trash2, AlertCircle, CheckCircle, X } from 'lucide-react';

const Monitoramento = ({ currentUser }) => {
  const [visitas, setVisitas] = useState([]);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('visitas');

  const [filterData, setFilterData] = useState(() => localStorage.getItem('mon_filter_data') || '');
  const [filterSupervisor, setFilterSupervisor] = useState(() => localStorage.getItem('mon_filter_sup') || '');
  const [filterCliente, setFilterCliente] = useState(() => localStorage.getItem('mon_filter_cli') || '');
  const [filterStatusOcorrencia, setFilterStatusOcorrencia] = useState('Aberto');

  const [resolvendoOcorrencia, setResolvendoOcorrencia] = useState(null);
  const [tratativaTexto, setTratativaTexto] = useState('');

  useEffect(() => {
    localStorage.setItem('mon_filter_data', filterData);
    localStorage.setItem('mon_filter_sup', filterSupervisor);
    localStorage.setItem('mon_filter_cli', filterCliente);
  }, [filterData, filterSupervisor, filterCliente]);

  useEffect(() => {
    fetchData();

    const subscription = supabase
      .channel('public:visitas')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visitas' }, payload => {
        setVisitas(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'visitas' }, payload => {
        setVisitas(prev => prev.filter(v => v.id !== payload.old.id));
      })
      .subscribe();

    const subOcorrencias = supabase
      .channel('public:ocorrencias')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencias_visitas' }, payload => {
         fetchData(); // refresh to keep it simple
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(subOcorrencias);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: vData, error: vError } = await supabase
      .from('visitas')
      .select('*').limit(10000)
      .order('created_at', { ascending: false });

    if (!vError && vData) {
      setVisitas(vData);
    }

    const { data: oData, error: oError } = await supabase
      .from('ocorrencias_visitas')
      .select('*').limit(10000)
      .order('created_at', { ascending: false });

    if (!oError && oData) {
      setOcorrencias(oData);
    }
    
    setLoading(false);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    if (isoString.includes(' ')) {
      const parts = isoString.split(' ')[1].split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    const timePart = isoString.includes('T') ? isoString.split('T')[1] : '';
    if (isoString.endsWith('Z') || timePart.includes('+') || (timePart.includes('-') && timePart.split('-').length > 1)) {
      try {
        const d = new Date(isoString);
        let h = d.getUTCHours() - 3;
        if (h < 0) h += 24;
        let m = d.getUTCMinutes();
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(h)}:${pad(m)}`;
      } catch (e) {
        return isoString;
      }
    } else {
      if (timePart) {
        const parts = timePart.split(':');
        return `${parts[0]}:${parts[1]}`;
      }
    }
    return isoString;
  };

  const formatDate = (isoString) => {
    if (!isoString || typeof isoString !== 'string' || isoString.trim() === '') return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch (e) {
      return '';
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este registro de visita? Isso também excluirá as ocorrências ligadas a ela.")) {
      const { error } = await supabase.from('visitas').delete().eq('id', id);
      if (error) {
        alert("Erro ao excluir: " + error.message);
      }
    }
  };

  const handleDeleteOcorrencia = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta ocorrência?")) {
      const { error } = await supabase.from('ocorrencias_visitas').delete().eq('id', id);
      if (error) {
        alert("Erro ao excluir: " + error.message);
      } else {
        fetchData();
      }
    }
  };

  const handleResolver = async (e) => {
      e.preventDefault();
      if (!tratativaTexto.trim()) return alert("Descreva a tratativa.");
      
      const finalTratativa = `Resolvido por ${currentUser.username}:\n${tratativaTexto}`;

      const { error } = await supabase
        .from('ocorrencias_visitas')
        .update({
            status: 'Fechado',
            tratativa: finalTratativa,
            closed_at: new Date().toISOString()
        })
        .eq('id', resolvendoOcorrencia.id);
        
      if (error) {
          alert("Erro ao resolver: " + error.message);
      } else {
          setResolvendoOcorrencia(null);
          setTratativaTexto('');
          fetchData();
      }
  };

  const visitasFiltradas = useMemo(() => {
    return visitas.filter(v => {
            const matchData = filterData ? (() => {
        const targetDate = v.hora_chegada || v.created_at;
        if (!targetDate) return false;
        try {
          const d = new Date(targetDate);
          if (isNaN(d.getTime())) return targetDate.startsWith(filterData);
          
const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
          const localDateStr = formatter.format(d);
          return localDateStr === filterData;
        } catch(e) {
          return (v.hora_chegada || v.created_at || '').startsWith(filterData);
        }
      })() : true;
      const matchSup = filterSupervisor ? (v.nome_supervisor || '').toLowerCase().includes(filterSupervisor.toLowerCase()) : true;
      const matchCli = filterCliente ? (v.nomecli || '').toLowerCase().includes(filterCliente.toLowerCase()) : true;
      return matchData && matchSup && matchCli;
    });
  }, [visitas, filterData, filterSupervisor, filterCliente]);

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter(o => {
      const matchStatus = filterStatusOcorrencia ? o.status === filterStatusOcorrencia : true;
      const matchSup = filterSupervisor ? (o.supervisor || '').toLowerCase().includes(filterSupervisor.toLowerCase()) : true;
      const matchCli = filterCliente ? (o.cliente || '').toLowerCase().includes(filterCliente.toLowerCase()) : true;
      return matchStatus && matchSup && matchCli;
    });
  }, [ocorrencias, filterStatusOcorrencia, filterSupervisor, filterCliente]);

  const calcularDuracao = (chegada, saida) => {
    if (!chegada || !saida) return null;
    const start = new Date(chegada);
    const end = new Date(saida);
    const diff = Math.floor((end - start) / 60000); 
    if (diff < 60) return `${diff} min`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  const calcularSLA = (created_at, closed_at) => {
      if (!created_at) return { texto: 'N/A', cor: '#94a3b8', hrs: 0 };
      const start = new Date(created_at);
      if (isNaN(start.getTime())) return { texto: 'N/A', cor: '#94a3b8', hrs: 0 };
      const end = closed_at ? new Date(closed_at) : new Date();
      const diffHrs = (end - start) / (1000 * 60 * 60);
      
      let cor = '#10b981'; // Verde (< 12h)
      if (diffHrs >= 24) cor = '#ef4444'; // Vermelho
      else if (diffHrs >= 12) cor = '#f59e0b'; // Amarelo
      
      const format = diffHrs < 24 ? `${Math.floor(diffHrs)}h ${Math.floor((diffHrs % 1) * 60)}m` : `${Math.floor(diffHrs / 24)}d ${Math.floor(diffHrs % 24)}h`;
      
      return { texto: format, cor, hrs: diffHrs };
  };

  return (
    <div className="monitoramento-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={24} color="#10b981" />
          Central de Monitoramento
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          Online
        </div>
      </div>
      
      {/* Abas */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
          <button
              onClick={() => setActiveTab('visitas')}
              style={{
                  background: activeTab === 'visitas' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: activeTab === 'visitas' ? '#3b82f6' : '#cbd5e1',
                  border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                  borderBottom: activeTab === 'visitas' ? '2px solid #3b82f6' : '2px solid transparent'
              }}
          >
              <Building size={18} /> Histórico de Visitas
          </button>
          
          <button
              onClick={() => setActiveTab('ocorrencias')}
              style={{
                  background: activeTab === 'ocorrencias' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  color: activeTab === 'ocorrencias' ? '#ef4444' : '#cbd5e1',
                  border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                  borderBottom: activeTab === 'ocorrencias' ? '2px solid #ef4444' : '2px solid transparent'
              }}
          >
              <AlertCircle size={18} /> Ocorrências (SLA)
              {ocorrencias.filter(o => o.status === 'Aberto').length > 0 && (
                  <span style={{ background: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                      {ocorrencias.filter(o => o.status === 'Aberto').length}
                  </span>
              )}
          </button>
      </div>

      {/* Filtros */}
      <div className="card glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        
        {activeTab === 'visitas' ? (
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14}/> Data
            </label>
            <input 
              type="date" 
              value={filterData}
              onChange={(e) => setFilterData(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
            />
          </div>
        ) : (
           <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14}/> Status
            </label>
            <select 
              value={filterStatusOcorrencia}
              onChange={(e) => setFilterStatusOcorrencia(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
            >
                <option value="">Todos</option>
                <option value="Aberto">Em Aberto</option>
                <option value="Fechado">Resolvidos</option>
            </select>
          </div> 
        )}

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14}/> Supervisor
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Buscar supervisor..."
              value={filterSupervisor}
              onChange={(e) => setFilterSupervisor(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div style={{ flex: '1 1 250px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={14}/> Cliente / Posto
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Buscar cliente..."
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => { setFilterData(''); setFilterSupervisor(''); setFilterCliente(''); setFilterStatusOcorrencia('Aberto'); }}
            style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer', height: '40px' }}
          >
            Limpar Filtros
          </button>
        </div>
      </div>
      
      {/* Modal Fechamento */}
      {resolvendoOcorrencia && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="card glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative' }}>
                 <button onClick={() => setResolvendoOcorrencia(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X /></button>
                 <h2 style={{ color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle color="#10b981" /> Resolver Ocorrência</h2>
                 <div style={{ marginBottom: '16px', color: '#cbd5e1', fontSize: '14px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                     <strong>Inconformidade:</strong> {resolvendoOcorrencia.item_checklist}<br/>
                     <strong>Obs:</strong> {resolvendoOcorrencia.observacao}
                 </div>
                 <form onSubmit={handleResolver}>
                    <label style={{ color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>Descreva a tratativa / resolução:</label>
                    <textarea 
                       value={tratativaTexto}
                       onChange={e => setTratativaTexto(e.target.value)}
                       required
                       style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', minHeight: '100px', marginBottom: '20px' }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button type="button" onClick={() => setResolvendoOcorrencia(null)} style={{ flex: 1, padding: '12px', background: 'transparent', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                        <button type="submit" style={{ flex: 2, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Salvar e Fechar</button>
                    </div>
                 </form>
             </motion.div>
          </div>
      )}

      {loading ? (
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="skeleton-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="card glass-panel" style={{ height: '80px', borderRadius: '12px', animation: 'pulse 1.5s infinite', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}></div>
          ))}
        </motion.div>

      ) : activeTab === 'ocorrencias' ? (
         // TELA DE OCORRENCIAS
         ocorrenciasFiltradas.length === 0 ? (
            <div className="card glass-panel" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
              <p>Nenhuma ocorrência encontrada com os filtros atuais.</p>
            </div>
         ) : (
            <div className="card glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="table-row-hover" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <tr>
                        <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600 }}>SLA / Data</th>
                        <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600 }}>Supervisor</th>
                        <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600 }}>Cliente / Posto</th>
                        <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600 }}>Inconformidade</th>
                        <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600, textAlign: 'center' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                {ocorrenciasFiltradas.map(oc => {
                    const sla = calcularSLA(oc.created_at, oc.closed_at);
                    const isFechado = oc.status === 'Fechado';
                    
                    return (
                        <tr key={oc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', borderLeft: `4px solid ${isFechado ? '#10b981' : '#ef4444'}` }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isFechado ? '#64748b' : sla.cor, fontWeight: isFechado ? 400 : 600, fontSize: '14px', marginBottom: '4px' }}>
                                    <Clock size={14}/> SLA: {sla.texto}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{formatDate(oc.created_at)} {formatTime(oc.created_at)}</div>
                                <div style={{ display: 'inline-block', marginTop: '6px', background: isFechado ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isFechado ? '#10b981' : '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                                    {oc.status}
                                </div>
                            </td>
                            <td style={{ padding: '16px', color: '#e2e8f0', fontWeight: 500, fontSize: '14px' }}>
                                {oc.supervisor}
                            </td>
                            <td style={{ padding: '16px', color: '#cbd5e1', fontSize: '14px' }}>
                                <div style={{ color: '#e2e8f0', fontWeight: 500, marginBottom: '4px' }}>{oc.cliente}</div>
                                <div style={{ color: '#94a3b8', fontSize: '12px' }}>{oc.posto}</div>
                            </td>
                            <td style={{ padding: '16px', fontSize: '13px' }}>
                                <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: '4px' }}>{oc.item_checklist}</div>
                                <div style={{ color: '#cbd5e1', fontStyle: 'italic', marginBottom: '8px' }}>"{oc.observacao}"</div>
                                {isFechado && oc.tratativa && (
                                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '8px', borderRadius: '6px', borderLeft: '2px solid #10b981' }}>
                                        <div style={{ color: '#10b981', fontWeight: 600, fontSize: '11px', marginBottom: '2px' }}>Tratativa:</div>
                                        <div style={{ color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>{oc.tratativa}</div>
                                        <div style={{ color: '#64748b', fontSize: '10px', marginTop: '4px' }}>Fechado em: {formatDate(oc.closed_at)} {formatTime(oc.closed_at)}</div>
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    {oc.foto_url && (
                                        <a href={oc.foto_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '20px', textDecoration: 'none', fontSize: '12px', fontWeight: 600, transition: 'all 0.2s' }}>
                                            <ImageIcon size={14} /> Foto
                                        </a>
                                    )}
                                    {!isFechado && (
                                        <button 
                                            onClick={() => setResolvendoOcorrencia(oc)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Resolver
                                        </button>
                                    )}
                                    {currentUser?.role === 'MASTER' && (
                                        <button 
                                            onClick={() => handleDeleteOcorrencia(oc.id)}
                                            title="Excluir Ocorrência"
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', marginLeft: '4px' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
         </div>
         )
      ) : visitasFiltradas.length === 0 ? (
        <div className="card glass-panel" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>Nenhuma visita encontrada com os filtros atuais.</p>
        </div>
      ) : (
        <div className="card glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table-row-hover" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
              <tr>
                <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600, width: '180px' }}>Data/Hora</th>
                <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600 }}>Supervisor</th>
                <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600 }}>Cliente</th>
                <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600 }}>Posto / Duração</th>
                <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600, textAlign: 'center' }}>Fotos / Ações</th>
              </tr>
            </thead>
            <tbody>
              {visitasFiltradas.map((visita) => {
                const duracao = calcularDuracao(visita.hora_chegada, visita.hora_saida);
                
                // Extração combinada de fotos (Extras e do Checklist)
                const fotosExtras = visita.foto_url && visita.foto_url.trim().length > 0 ? visita.foto_url.split(',').filter(u => u.trim()) : [];
                const fotosChecklist = [];
                if (visita.checklist && typeof visita.checklist === 'object') {
                    Object.values(visita.checklist).forEach(item => {
                        if (item.foto) fotosChecklist.push(item.foto);
                    });
                }
                const fotosList = [...fotosExtras, ...fotosChecklist];
                
                return (
                  <tr key={visita.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{formatDate(visita.hora_chegada || visita.created_at)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} color="#10b981" /> Chegada: {formatTime(visita.hora_chegada || visita.created_at)}
                          </div>
                        </div>
                        {visita.hora_saida && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} color="#ef4444" /> Saída: {formatTime(visita.hora_saida)}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#e2e8f0', fontWeight: 500 }}>
                      {visita.nome_supervisor || 'Anônimo'}
                    </td>
                    <td style={{ padding: '16px', color: '#cbd5e1', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={14} color="#94a3b8" /> {visita.nomecli}
                      </div>
                      {visita.codcli && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', marginLeft: '20px' }}>Cód: {visita.codcli}</div>}
                    </td>
                    <td style={{ padding: '16px', color: '#cbd5e1', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <MapPin size={14} color="#94a3b8" /> {visita.nomepos}
                      </div>
                      {visita.codpos && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', marginLeft: '20px' }}>Cód: {visita.codpos}</div>}
                      
                      {duracao && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ 
                            padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                            background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'
                          }}>
                            Duração: {duracao}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        
                        {fotosList.length === 0 ? (
                           <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Sem foto</span>
                        ) : (
                          fotosList.map((url, index, arr) => (
                            <a 
                              key={index}
                              href={url.trim()} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '4px', 
                                padding: '6px 10px', background: 'rgba(59, 130, 246, 0.1)', 
                                color: '#3b82f6', borderRadius: '20px', textDecoration: 'none',
                                fontSize: '12px', fontWeight: 600, transition: 'all 0.2s'
                              }}
                            >
                              <ImageIcon size={14} /> {arr.length > 1 ? `Foto ${index + 1}` : 'Ver Foto'}
                            </a>
                          ))
                        )}
                        
                        {currentUser?.role === 'MASTER' && (
                          <button 
                            onClick={() => handleDelete(visita.id)}
                            title="Excluir Visita Completa"
                            style={{ 
                              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
                              border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                              marginLeft: '8px'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Monitoramento;
