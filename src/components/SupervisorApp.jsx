import React, { useState, useEffect } from 'react';
import { Camera, UploadCloud, MapPin, Building, CheckCircle, Loader2, Info, X, Plus } from 'lucide-react';
import { supabase } from '../supabaseClient';

const SupervisorApp = ({ currentUser }) => {
  const [clientes, setClientes] = useState([]);
  const [postos, setPostos] = useState([]);
  
  const [selectedCliente, setSelectedCliente] = useState(''); // nomecli
  const [selectedPostoId, setSelectedPostoId] = useState(''); // id
  const [tipoVisita, setTipoVisita] = useState('Visita Normal');
  
  const [fotos, setFotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setFetchingData(true);
    const { data, error } = await supabase.from('postos').select('*');
    if (error) {
      console.error(error);
    } else {
      const clientesMap = new Map();
      data.forEach(item => {
        if (!clientesMap.has(item.nomecli)) {
           clientesMap.set(item.nomecli, item);
        }
      });
      const uniqueClientes = Array.from(clientesMap.values()).sort((a, b) => a.nomecli.localeCompare(b.nomecli));
      setClientes(uniqueClientes);
      setPostos(data);
    }
    setFetchingData(false);
  };

  const handleClienteChange = (e) => {
    setSelectedCliente(e.target.value);
    setSelectedPostoId(''); 
  };

  const postosFiltrados = postos.filter(p => p.nomecli === selectedCliente).sort((a, b) => a.nomepos.localeCompare(b.nomepos));

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPostoId || fotos.length === 0) {
      alert("Por favor, selecione um posto e adicione pelo menos uma foto.");
      return;
    }

    setLoading(true);

    try {
      const posto = postos.find(p => p.id === selectedPostoId);
      
      const uploadPromises = fotos.map(async (foto) => {
        const fileExt = foto.name.split('.').pop();
        const fileName = `visita_${currentUser.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('fotos_visitas').upload(fileName, foto);
        
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('fotos_visitas').getPublicUrl(fileName);
        return publicUrlData.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      const fotoUrlJoined = urls.join(',');

      const { error: insertError } = await supabase
        .from('visitas')
        .insert([
          { 
            user_id: currentUser.id,
            nome_supervisor: currentUser.username, 
            codcli: posto.codcli,
            nomecli: posto.nomecli,
            codpos: posto.codpos,
            nomepos: posto.nomepos,
            tipo_visita: tipoVisita,
            foto_url: fotoUrlJoined 
          }
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        setSelectedCliente('');
        setSelectedPostoId('');
        setTipoVisita('Visita Normal');
        setFotos([]);
        setPreviews([]);
      }, 3000);

    } catch (error) {
      console.error("Erro ao registrar visita:", error);
      alert("Erro ao registrar visita. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
          <h2 style={{ color: '#10b981', marginBottom: '8px' }}>Visita Registrada!</h2>
          <p style={{ color: '#94a3b8' }}>O registro foi enviado para a central de monitoramento com sucesso.</p>
        </div>
      ) : (
        <div className="card glass-panel">
          <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={24} color="#3b82f6" />
            Registrar Nova Visita
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
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

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                <MapPin size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
                Posto de Serviço
              </label>
              <select 
                className="custom-input" 
                value={selectedPostoId} 
                onChange={(e) => setSelectedPostoId(e.target.value)}
                required
                disabled={!selectedCliente}
                style={{ width: '100%', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', opacity: !selectedCliente ? 0.5 : 1 }}
              >
                <option value="" disabled>Selecione o Posto</option>
                {postosFiltrados.map(p => (
                  <option key={p.id} value={p.id}>{p.codpos} - {p.nomepos}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                <Info size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
                Tipo de Registro
              </label>
              <select 
                className="custom-input" 
                value={tipoVisita} 
                onChange={(e) => setTipoVisita(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
              >
                <option value="Chegada">Chegada no Posto</option>
                <option value="Saída">Saída do Posto</option>
                <option value="Visita Normal">Visita de Rotina (Normal)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                <Camera size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
                Fotos do Livro de Ocorrências ({fotos.length})
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

            <button 
              type="submit" 
              disabled={loading || fotos.length === 0 || !selectedPostoId}
              style={{ 
                marginTop: '10px',
                padding: '16px', 
                background: loading || fotos.length === 0 || !selectedPostoId ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(to right, #3b82f6, #2563eb)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading || fotos.length === 0 || !selectedPostoId ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
              {loading ? 'Enviando...' : 'Registrar Visita'}
            </button>
            
          </form>
        </div>
      )}
    </div>
  );
};

export default SupervisorApp;
