import React, { useState, useEffect } from 'react';
import { Camera, UploadCloud, MapPin, Building, CheckCircle, Loader2, X, Plus, Clock, Play, Activity, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { saveVisitOffline, getPendingVisits, syncAll, fileToBase64 } from '../utils/syncManager';
import { CloudOff, RefreshCw } from 'lucide-react';

const getBRTString = () => {
  const d = new Date();
  const brt = new Date(d.getTime() - 3 * 3600 * 1000);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${brt.getUTCFullYear()}-${pad(brt.getUTCMonth()+1)}-${pad(brt.getUTCDate())}T${pad(brt.getUTCHours())}:${pad(brt.getUTCMinutes())}:${pad(brt.getUTCSeconds())}-03:00`;
};

const SupervisorApp = ({ currentUser }) => {
  const [clientes, setClientes] = useState([]);
  const [postos, setPostos] = useState([]);
  
  // States for creating a new visit
  const [selectedCliente, setSelectedCliente] = useState(''); 
  const [selectedPostoId, setSelectedPostoId] = useState('');
  const [searchPosto, setSearchPosto] = useState(''); 

  // Active Visit State (loaded from localStorage)
  const [activeVisit, setActiveVisit] = useState(null);
  
  // Checklist States
  const defaultChecklist = {
    cnv: { status: '', observacao: '' },
    cracha: { status: '', observacao: '' },
    livro: { status: '', observacao: '' },
    equipamentos: { status: '', observacao: '' },
    apresentacao: { status: '', observacao: '' }
  };
  const [checklist, setChecklist] = useState(defaultChecklist);
  const [checklistFotos, setChecklistFotos] = useState({});
  const [checklistPreviews, setChecklistPreviews] = useState({});

  // Photos for the active visit (Extra)
  const [fotos, setFotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [success, setSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verifica fila inicial
    getPendingVisits().then(queue => setPendingSync(queue.length));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (isOffline) {
      alert('Você está offline. Aguarde ter internet.');
      return;
    }
    setIsSyncing(true);
    try {
      const count = await syncAll((msg) => setSyncMessage(msg));
      alert(`Sincronização concluída! ${count} visitas enviadas com sucesso.`);
    } catch (e) {
      alert('Falha na sincronização: ' + e.message);
    } finally {
      setIsSyncing(false);
      setSyncMessage('');
      const q = await getPendingVisits();
      setPendingSync(q.length);
    }
  };

  useEffect(() => {
    fetchClientes();
    
    // Load active visit from local storage if exists
    const savedVisit = localStorage.getItem('activeVisit_' + currentUser.id);
    if (savedVisit) {
      setActiveVisit(JSON.parse(savedVisit));
      const savedChecklist = localStorage.getItem('activeChecklist_' + currentUser.id);
      if (savedChecklist) {
        setChecklist(JSON.parse(savedChecklist));
      }
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // update clock every minute
    return () => clearInterval(timer);
  }, [currentUser.id]);

  const fetchClientes = async () => {
    setFetchingData(true);
    try {
      const { data, error } = await supabase.from('postos').select('*');
      if (error) throw error;
      
      const clientesMap = new Map();
      data.forEach(item => {
        if (!clientesMap.has(item.nomecli)) clientesMap.set(item.nomecli, item);
      });
      const uniqueClientes = Array.from(clientesMap.values()).sort((a, b) => a.nomecli.localeCompare(b.nomecli));
      
      setClientes(uniqueClientes);
      setPostos(data);
      
      // Save offline cache
      localStorage.setItem('offline_postos', JSON.stringify(data));
    } catch (e) {
      console.warn("Falha ao buscar postos da nuvem, tentando offline:", e);
      const cached = localStorage.getItem('offline_postos');
      if (cached) {
        const data = JSON.parse(cached);
        const clientesMap = new Map();
        data.forEach(item => {
          if (!clientesMap.has(item.nomecli)) clientesMap.set(item.nomecli, item);
        });
        const uniqueClientes = Array.from(clientesMap.values()).sort((a, b) => a.nomecli.localeCompare(b.nomecli));
        setClientes(uniqueClientes);
        setPostos(data);
      }
    }
    setFetchingData(false);
  };

  const handleClienteChange = (e) => {
    setSelectedCliente(e.target.value);
    setSelectedPostoId('');
    setSearchPosto('');
  };

  const postosFiltrados = postos.filter(p => {
    if (p.nomecli !== selectedCliente) return false;
    if (searchPosto) {
      const termo = searchPosto.toLowerCase();
      const nome = (p.nomepos || '').toLowerCase();
      const cod = (p.codpos || '').toString().toLowerCase();
      return nome.includes(termo) || cod.includes(termo);
    }
    return true;
  }).sort((a, b) => (a.nomepos || '').localeCompare(b.nomepos || ''));

  const handleIniciarVisita = () => {
    if (!selectedPostoId) {
      alert("Selecione um posto antes de registrar a chegada.");
      return;
    }
    
    const posto = postos.find(p => p.id.toString() === selectedPostoId.toString());
    if (!posto) {
      alert("Erro ao localizar as informações do posto selecionado. Atualize a página e tente novamente.");
      return;
    }
    
    const novaVisita = {
      postoId: posto.id,
      codcli: posto.codcli,
      nomecli: posto.nomecli,
      codpos: posto.codpos,
      nomepos: posto.nomepos,
      horaChegada: getBRTString()
    };

    setActiveVisit(novaVisita);
    localStorage.setItem('activeVisit_' + currentUser.id, JSON.stringify(novaVisita));
  };

  const handleFotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFotos(prev => [...prev, ...files]);
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFoto = (index) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancelarVisita = () => {
    if (window.confirm("Deseja realmente cancelar esta visita? Todo o progresso não enviado será perdido.")) {
      setActiveVisit(null);
      setFotos([]);
      setPreviews([]);
      setChecklist(defaultChecklist);
      setChecklistFotos({});
      setChecklistPreviews({});
      localStorage.removeItem('activeVisit_' + currentUser.id);
      localStorage.removeItem('activeChecklist_' + currentUser.id);
    }
  };

  const handleChecklistChange = (key, field, value) => {
    const updated = { ...checklist, [key]: { ...checklist[key], [field]: value } };
    setChecklist(updated);
    localStorage.setItem('activeChecklist_' + currentUser.id, JSON.stringify(updated));
  };

  const handleChecklistFotoChange = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      setChecklistFotos(prev => ({ ...prev, [key]: file }));
      setChecklistPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
    }
  };

  const removeChecklistFoto = (key) => {
    setChecklistFotos(prev => { const n = {...prev}; delete n[key]; return n; });
    setChecklistPreviews(prev => { const n = {...prev}; delete n[key]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeVisit) return;
    
    // Validate checklist
    const labels = {
      cnv: "CNV",
      cracha: "Crachá",
      livro: "Livro de Ocorrência",
      equipamentos: "Equipamentos",
      apresentacao: "Apresentação Pessoal"
    };

    for (const [key, item] of Object.entries(checklist)) {
      if (!item.status) {
        alert(`Você precisa avaliar o item: ${labels[key]}`);
        return;
      }
      if (key === 'livro' && !checklistFotos[key]) {
        alert("A foto do Livro de Ocorrência é obrigatória.");
        return;
      }
      if (item.status === 'Inconforme' && !checklistFotos[key]) {
        alert(`A foto é obrigatória para o item inconforme: ${labels[key]}`);
        return;
      }
      if (item.status === 'Inconforme' && (!item.observacao || item.observacao.trim() === '')) {
        alert(`A observação é obrigatória para o item inconforme: ${labels[key]}`);
        return;
      }
    }

    // Opt-in check for photos (extra)
    if (fotos.length === 0 && Object.keys(checklistFotos).length === 0) {
      if (!window.confirm("Você não anexou nenhuma foto nesta visita. Deseja finalizar mesmo assim?")) {
        return;
      }
    }

    setLoading(true);

    try {
      let fotoUrlJoined = '';

      if (fotos.length > 0) {
        const uploadPromises = fotos.map(async (foto) => {
          const fileExt = foto.name.split('.').pop();
          const fileName = `visita_${currentUser.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('fotos_visitas').upload(fileName, foto);
          
          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage.from('fotos_visitas').getPublicUrl(fileName);
          return publicUrlData.publicUrl;
        });

        const urls = await Promise.all(uploadPromises);
        fotoUrlJoined = urls.join(',');
      }

      const horaSaida = getBRTString();

      // Upload checklist photos
      let finalChecklistData = {};
      const uploadChecklistPhoto = async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `chk_${currentUser.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('fotos_visitas').upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('fotos_visitas').getPublicUrl(fileName);
          return publicUrlData.publicUrl;
      };

      for (const [key, item] of Object.entries(checklist)) {
          let cFotoUrl = null;
          if (checklistFotos[key]) {
              cFotoUrl = await uploadChecklistPhoto(checklistFotos[key]);
          }
          finalChecklistData[key] = {
              status: item.status,
              observacao: item.observacao || '',
              foto: cFotoUrl
          };
      }

      const { data: insertedVisita, error: insertError } = await supabase
        .from('visitas')
        .insert([
          { 
            user_id: currentUser.id,
            nome_supervisor: currentUser.username, 
            codcli: activeVisit.codcli,
            nomecli: activeVisit.nomecli,
            codpos: activeVisit.codpos,
            nomepos: activeVisit.nomepos,
            hora_chegada: activeVisit.horaChegada,
            hora_saida: horaSaida,
            foto_url: fotoUrlJoined,
            checklist: finalChecklistData
          }
        ])
        .select();

      if (insertError) throw insertError;
      
      const novaVisitaId = insertedVisita[0].id;

      // Inserir ocorrencias na nova tabela se houver inconformidades
      const ocorrenciasInsertData = [];
      for (const [key, data] of Object.entries(finalChecklistData)) {
          if (data.status === 'Inconforme') {
              ocorrenciasInsertData.push({
                  visita_id: novaVisitaId,
                  supervisor: currentUser.username,
                  cliente: activeVisit.nomecli,
                  posto: activeVisit.nomepos,
                  item_checklist: labels[key],
                  observacao: data.observacao,
                  foto_url: data.foto,
                  status: 'Aberto'
              });
          }
      }
      
      if (ocorrenciasInsertData.length > 0) {
          const { error: errorOcorrencias } = await supabase.from('ocorrencias_visitas').insert(ocorrenciasInsertData);
          if (errorOcorrencias) console.error("Erro ao registrar ocorrências:", errorOcorrencias);
      }

      setSuccess(true);
      
      // Cleanup
      setActiveVisit(null);
      setFotos([]);
      setPreviews([]);
      setChecklist(defaultChecklist);
      setChecklistFotos({});
      setChecklistPreviews({});
      localStorage.removeItem('activeVisit_' + currentUser.id);
      localStorage.removeItem('activeChecklist_' + currentUser.id);
      setSelectedCliente('');
      setSelectedPostoId('');

      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error("Erro ao registrar visita:", error);
      alert("Erro ao registrar visita. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const formatHora = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  };

  const calcularDuracao = (chegada) => {
    const start = new Date(chegada);
    const diff = Math.floor((currentTime - start) / 60000); // minutes
    if (diff < 60) return `${diff} min`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h}h ${m}m`;
  };

  if (fetchingData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
        <Loader2 className="animate-spin" size={32} style={{ marginRight: '12px' }} />
        Carregando postos...
      </div>
    );
  }

  return (
    <div className="supervisor-container" style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      
      {success ? (
        <div className="card glass-panel" style={{ textAlign: 'center', padding: '40px 20px', borderColor: '#10b981' }}>
          <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ color: '#10b981', marginBottom: '8px' }}>Visita Finalizada!</h2>
          <p style={{ color: '#94a3b8' }}>O registro completo foi enviado para a central com sucesso.</p>
        </div>
      ) : activeVisit ? (
        <div className="card glass-panel" style={{ borderTop: '4px solid #3b82f6' }}>
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={24} color="#3b82f6" />
            Visita em Andamento
          </h2>
          
          <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '18px', marginBottom: '4px' }}>{activeVisit.nomepos}</div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>{activeVisit.nomecli}</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Hora de Chegada</div>
                <div style={{ fontSize: '16px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14}/> {formatHora(activeVisit.horaChegada)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Duração</div>
                <div style={{ fontSize: '16px', color: '#e2e8f0', fontWeight: 600 }}>
                  {calcularDuracao(activeVisit.horaChegada)}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group" style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ display: 'block', marginBottom: '16px', color: '#e2e8f0', fontWeight: 600, fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                <Activity size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
                Checklist Obrigatório
              </label>

              {[
                { key: 'cnv', label: 'CNV' },
                { key: 'cracha', label: 'Crachá' },
                { key: 'livro', label: 'Livro de Ocorrência' },
                { key: 'equipamentos', label: 'Equipamentos' },
                { key: 'apresentacao', label: 'Apresentação Pessoal' }
              ].map(item => {
                const isLivro = item.key === 'livro';
                const isInconforme = checklist[item.key].status === 'Inconforme';
                const needsPhoto = isLivro || isInconforme;

                return (
                  <div key={item.key} style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ color: '#cbd5e1', fontSize: '15px' }}>{item.label} {isLivro && <span style={{color: '#ef4444', fontSize: '12px'}}>* Foto Obr.</span>}</span>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: checklist[item.key].status === 'Conforme' ? '#10b981' : '#94a3b8' }}>
                          <input type="radio" name={item.key} value="Conforme" checked={checklist[item.key].status === 'Conforme'} onChange={() => handleChecklistChange(item.key, 'status', 'Conforme')} style={{ accentColor: '#10b981' }} />
                          Conforme
                        </label>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: checklist[item.key].status === 'Inconforme' ? '#ef4444' : '#94a3b8' }}>
                          <input type="radio" name={item.key} value="Inconforme" checked={checklist[item.key].status === 'Inconforme'} onChange={() => handleChecklistChange(item.key, 'status', 'Inconforme')} style={{ accentColor: '#ef4444' }} />
                          Inconforme
                        </label>
                      </div>
                    </div>
                    
                    {isInconforme && (
                       <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                           <textarea
                               value={checklist[item.key].observacao || ''}
                               onChange={(e) => handleChecklistChange(item.key, 'observacao', e.target.value)}
                               placeholder="Descreva a inconformidade observada..."
                               style={{ width: '100%', padding: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fff', borderRadius: '6px', fontSize: '13px', resize: 'vertical', minHeight: '60px' }}
                               required
                           />
                       </div>
                    )}
                    
                    {needsPhoto && (
                      <div style={{ marginTop: '8px' }}>
                        {!checklistPreviews[item.key] ? (
                          <label style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed #3b82f6', borderRadius: '6px',
                            padding: '12px', cursor: 'pointer', color: '#3b82f6', fontSize: '14px'
                          }}>
                            <Camera size={16} /> Tirar Foto {isLivro ? 'do Livro' : 'da Inconformidade'}
                            <input type="file" accept="image/*" capture="environment" onChange={(e) => handleChecklistFotoChange(item.key, e)} style={{ display: 'none' }} />
                          </label>
                        ) : (
                          <div style={{ position: 'relative', width: '120px', aspectRatio: '1', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <img src={checklistPreviews[item.key]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => removeChecklistFoto(item.key)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                <Camera size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
                Capturar Fotos Extras ({fotos.length})
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                {previews.map((prev, index) => (
                  <div key={index} style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={prev} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      type="button"
                      onClick={() => removeFoto(index)}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <label 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    border: '2px dashed rgba(255,255,255,0.2)', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    background: 'rgba(15, 23, 42, 0.4)',
                    aspectRatio: '1',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    capture="environment"
                    onChange={handleFotoChange} 
                    style={{ display: 'none' }} 
                  />
                  <Plus size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                  <span style={{ color: '#cbd5e1', fontSize: '12px', textAlign: 'center', padding: '0 4px' }}>Adicionar Foto</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={handleCancelarVisita}
                disabled={loading}
                style={{ 
                  flex: 1,
                  padding: '16px', 
                  background: 'transparent',
                  color: '#ef4444', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  borderRadius: '8px', 
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar Visita
              </button>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  flex: 2,
                  padding: '16px', 
                  background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(to right, #3b82f6, #2563eb)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                {loading ? 'Enviando...' : 'Finalizar e Enviar'}
              </button>
            </div>
            
          </form>
        </div>
      ) : (
        <div className="card glass-panel">
          <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={24} color="#3b82f6" />
            Nova Visita
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                <Building size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
                Cliente
              </label>
              <select 
                className="custom-input" 
                value={selectedCliente} 
                onChange={handleClienteChange}
                required
                style={{ width: '100%', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
              >
                <option value="" disabled>Selecione o Cliente</option>
                {clientes.map(c => (
                  <option key={c.nomecli} value={c.nomecli}>{c.codcli} - {c.nomecli}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                <MapPin size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
                Posto de Serviço
              </label>
              
              <div 
                style={{ 
                  position: 'relative', 
                  width: '100%', 
                  background: 'rgba(15, 23, 42, 0.6)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px',
                  opacity: !selectedCliente ? 0.5 : 1,
                  pointerEvents: !selectedCliente ? 'none' : 'auto'
                }}
              >
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} color="#94a3b8" />
                </div>
                <input 
                  type="text"
                  placeholder={!selectedCliente ? "Selecione o Cliente primeiro..." : "Digite para pesquisar o posto..."}
                  value={searchPosto}
                  onChange={(e) => {
                    setSearchPosto(e.target.value);
                    if (selectedPostoId) setSelectedPostoId(''); // clear selection if they type something new
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '12px 12px 12px 36px', 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              {selectedCliente && searchPosto && !selectedPostoId && postosFiltrados.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10
                }}>
                  {postosFiltrados.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedPostoId(p.id);
                        setSearchPosto(`${p.nomepos} - Cód: ${p.codpos}`);
                      }}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        color: '#f1f5f9',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {p.nomepos} - Cód: {p.codpos}
                    </div>
                  ))}
                </div>
              )}
              
              {selectedCliente && searchPosto && !selectedPostoId && postosFiltrados.length === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  padding: '12px',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '14px',
                  zIndex: 10
                }}>
                  Nenhum posto encontrado.
                </div>
              )}
            </div>

            <button 
              type="button" 
              onClick={handleIniciarVisita}
              disabled={!selectedPostoId}
              style={{ 
                marginTop: '10px',
                padding: '16px', 
                background: !selectedPostoId ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(to right, #10b981, #059669)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px',
                fontWeight: 600,
                cursor: !selectedPostoId ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: !selectedPostoId ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Play size={20} />
              Registrar Chegada
            </button>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorApp;
