import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, MapPin, Building, Clock, Activity, Search, Calendar, User, ExternalLink, Image as ImageIcon, Trash2 } from 'lucide-react';

const Monitoramento = ({ currentUser }) => {
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterData, setFilterData] = useState('');
  const [filterSupervisor, setFilterSupervisor] = useState('');
  const [filterCliente, setFilterCliente] = useState('');

  useEffect(() => {
    fetchVisitas();

    const subscription = supabase
      .channel('public:visitas')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visitas' }, payload => {
        setVisitas(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'visitas' }, payload => {
        setVisitas(prev => prev.filter(v => v.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchVisitas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('visitas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVisitas(data);
    }
    setLoading(false);
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este registro de visita?")) {
      const { error } = await supabase.from('visitas').delete().eq('id', id);
      if (error) {
        alert("Erro ao excluir: " + error.message);
      }
    }
  };

  const visitasFiltradas = useMemo(() => {
    return visitas.filter(v => {
      const matchData = filterData ? (v.created_at || '').startsWith(filterData) : true;
      const matchSup = filterSupervisor ? (v.nome_supervisor || '').toLowerCase().includes(filterSupervisor.toLowerCase()) : true;
      const matchCli = filterCliente ? (v.nomecli || '').toLowerCase().includes(filterCliente.toLowerCase()) : true;
      return matchData && matchSup && matchCli;
    });
  }, [visitas, filterData, filterSupervisor, filterCliente]);

  const calcularDuracao = (chegada, saida) => {
    if (!chegada || !saida) return null;
    const start = new Date(chegada);
    const end = new Date(saida);
    const diff = Math.floor((end - start) / 60000); // minutes
    if (diff < 60) return `${diff} min`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="monitoramento-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={24} color="#10b981" />
          Monitoramento de Visitas
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
          Online
        </div>
      </div>

      {/* Filtros */}
      <div className="card glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        
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
            onClick={() => { setFilterData(''); setFilterSupervisor(''); setFilterCliente(''); }}
            style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer', height: '40px' }}
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Carregando visitas...</div>
      ) : visitasFiltradas.length === 0 ? (
        <div className="card glass-panel" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>Nenhuma visita encontrada com os filtros atuais.</p>
        </div>
      ) : (
        <div className="card glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
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
                const hasFotos = visita.foto_url && visita.foto_url.trim().length > 0;
                const fotosList = hasFotos ? visita.foto_url.split(',').filter(u => u.trim()) : [];
                
                return (
                  <tr key={visita.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px', color: '#94a3b8', fontSize: '14px' }}>
                      <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{formatDate(visita.hora_chegada || visita.created_at)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} color="#10b981" /> Chegada: {formatTime(visita.hora_chegada || visita.created_at)}
                        </div>
                        {visita.hora_saida && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} color="#ef4444" /> Saída: {formatTime(visita.hora_saida)}
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
