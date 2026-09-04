import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Settings, Users, UserPlus, Trash2, Key, Edit, AlertTriangle, Search, X, Plus } from 'lucide-react';

const Usuarios = ({ currentUser }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'SUPERVISOR',
    allowed_screens: []
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_usuarios')
      .select('*').limit(10000)
      .order('username');
      
    if (!error && data) {
      setUsuarios(data);
    }
    setLoading(false);
  };

  const handleEdit = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        username: user.username,
        password: '', // Não exibe a senha por segurança
        role: user.role,
        allowed_screens: user.allowed_screens || []
      });
    } else {
      setEditingId(null);
      setFormData({
        username: '',
        password: '',
        role: 'SUPERVISOR',
        allowed_screens: []
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username) {
      alert("Usuário é obrigatório!");
      return;
    }

    if (editingId) {
      // Editar
      if (formData.password) {
        const { error: resetError } = await supabase.rpc('reset_password_admin', {
          p_user_id: editingId,
          p_new_password: formData.password
        });
        
        if (resetError) {
          alert("Erro ao resetar senha: " + resetError.message);
          return;
        }
      }
      
      const { error: updateError } = await supabase.rpc('update_user_admin', {
        p_user_id: editingId,
        p_username: formData.username,
        p_role: formData.role,
        p_allowed_screens: formData.allowed_screens.length > 0 ? formData.allowed_screens : null
      });
        
      if (!updateError) {
        alert("Usuário atualizado com sucesso!");
        fetchUsuarios();
        handleEdit(null); // Limpa o form
      } else {
        alert("Erro ao atualizar: " + updateError.message);
      }
    } else {
      // Criar novo usuário via RPC segura
      if (!formData.password) {
        alert("Senha inicial é obrigatória para novos usuários.");
        return;
      }
      
      const { error } = await supabase.rpc('create_user_admin', {
        p_username: formData.username,
        p_password: formData.password,
        p_role: formData.role,
        p_allowed_screens: formData.allowed_screens.length > 0 ? formData.allowed_screens : null
      });

      if (!error) {
        alert("Usuário criado com sucesso!");
        fetchUsuarios();
        handleEdit(null); // Limpa o form
      } else {
        alert("Erro ao criar usuário: " + error.message);
      }
    }
  };

  const handleDelete = async (id, username) => {
    if (id === currentUser.id) {
      alert("Você não pode excluir o próprio usuário logado!");
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) {
      const { error } = await supabase.rpc('delete_user_admin', { p_user_id: id });
      if (!error) {
        fetchUsuarios();
        if (editingId === id) handleEdit(null);
      } else {
        alert("Erro ao deletar: " + error.message);
      }
    }
  };

  const handleResetPassword = async (id, username) => {
    const newPass = prompt(`Digite a nova senha temporária para ${username}:`, '123456');
    if (newPass) {
      const { error } = await supabase.rpc('reset_password_admin', {
        p_user_id: id,
        p_new_password: newPass
      });
        
      if (!error) {
        alert(`Senha de ${username} redefinida com sucesso!`);
        fetchUsuarios();
      } else {
        alert("Erro ao resetar senha: " + error.message);
      }
    }
  };

  const filteredUsuarios = usuarios.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="usuarios-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={24} color="#8b5cf6" />
          Configurações de Usuários
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Lado Esquerdo: Busca e Lista */}
        <div style={{ flex: '1 1 350px', minWidth: '300px' }}>
          <div className="card glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '16px', color: '#fff', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} color="#a855f7" /> Buscar Usuário
            </h3>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text"
                placeholder="Digite o nome do usuário..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ 
                  width: '100%', padding: '10px 12px 10px 36px', 
                  background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: '8px', color: '#f8fafc', fontSize: '14px', outline: 'none'
                }} 
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {!searchTerm && (
              <div style={{ marginTop: '12px', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
                Total de {usuarios.length} usuários na base. Digite para pesquisar.
              </div>
            )}
          </div>

          {searchTerm && (
            <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden', maxHeight: '500px', overflowY: 'auto' }}>
              {filteredUsuarios.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Nenhum usuário encontrado.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody>
                    {filteredUsuarios.map((user, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: editingId === user.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent' }}>
                        <td style={{ padding: '12px', color: '#f8fafc', fontWeight: 500, fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                              <Users size={14} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{user.username}</span>
                              <span style={{ fontSize: '11px', color: user.role === 'MASTER' ? '#ef4444' : user.role === 'ADM' ? '#3b82f6' : '#10b981' }}>
                                {user.role} {user.primeiro_acesso && ' (Senha pendente)'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleResetPassword(user.id, user.username)} title="Redefinir Senha" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>
                              <Key size={14} />
                            </button>
                            <button onClick={() => handleEdit(user)} title="Editar" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}>
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDelete(user.id, user.username)} title="Excluir" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', opacity: user.id === currentUser.id ? 0.3 : 1 }} disabled={user.id === currentUser.id}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Lado Direito: Formulário Inline */}
        <div style={{ flex: '2 1 450px', minWidth: '350px' }}>
          <div className="card glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingId ? <Edit size={20} color="#10b981" /> : <UserPlus size={20} color="#8b5cf6" />}
                {editingId ? 'Editar Usuário' : 'Novo Cadastro de Usuário'}
              </h3>
              {editingId && (
                <button 
                  onClick={() => handleEdit(null)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px', 
                    background: 'rgba(139, 92, 246, 0.15)', color: '#a855f7', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', padding: '6px 12px', 
                    borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 
                  }}
                >
                  <Plus size={14} /> Criar Novo
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '13px' }}>Nome de Usuário</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value.toUpperCase()})}
                  required
                  style={{ width: '100%', padding: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', textTransform: 'uppercase' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '13px' }}>
                  {editingId ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha Inicial'}
                </label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required={!editingId}
                  style={{ width: '100%', padding: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '13px' }}>Perfil de Acesso</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                >
                  <option value="SUPERVISOR">SUPERVISOR (Apenas app de visita)</option>
                  <option value="ADM">ADM (Visualiza dashboards)</option>
                  <option value="MASTER">MASTER (Acesso total)</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '13px' }}>Permissões de Telas</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {['dashboard', 'rh', 'frota', 'disciplina', 'atestados', 'medicao', 'monitoramento', 'Apresentação', 'app_supervisor'].map(screen => (
                    <label key={screen} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.allowed_screens.includes(screen)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, allowed_screens: [...formData.allowed_screens, screen]});
                          } else {
                            setFormData({...formData, allowed_screens: formData.allowed_screens.filter(s => s !== screen)});
                          }
                        }}
                        style={{ accentColor: '#8b5cf6', width: '16px', height: '16px' }}
                      />
                      {screen === 'Apresentação' ? 'Modo TV' : screen === 'app_supervisor' ? 'App Supervisor' : screen === 'rh' ? 'RH' : screen === 'medicao' ? 'Medição' : screen.charAt(0).toUpperCase() + screen.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => handleEdit(null)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  Limpar
                </button>
                <button type="submit" style={{ flex: 2, padding: '12px', background: 'linear-gradient(to right, #8b5cf6, #7c3aed)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Usuarios;
