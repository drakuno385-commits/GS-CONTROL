import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Settings, Users, UserPlus, Trash2, Key, Edit, AlertTriangle } from 'lucide-react';

const Usuarios = ({ currentUser }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'SUPERVISOR'
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_usuarios')
      .select('*')
      .order('username');
      
    if (!error && data) {
      setUsuarios(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        username: user.username,
        password: '', // Não exibe a senha por segurança
        role: user.role
      });
    } else {
      setEditingId(null);
      setFormData({
        username: '',
        password: '',
        role: 'SUPERVISOR'
      });
    }
    setIsModalOpen(true);
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
        // Usa a RPC segura para resetar a senha (Master action)
        const { error: resetError } = await supabase.rpc('reset_password_admin', {
          p_user_id: editingId,
          p_new_password: formData.password
        });
        
        if (resetError) {
          alert("Erro ao resetar senha: " + resetError.message);
          return;
        }
      }
      
      const { error: updateError } = await supabase
        .from('app_usuarios')
        .update({ role: formData.role, username: formData.username })
        .eq('id', editingId);
        
      if (!updateError) {
        fetchUsuarios();
        setIsModalOpen(false);
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
        p_role: formData.role
      });

      if (!error) {
        fetchUsuarios();
        setIsModalOpen(false);
      } else {
        alert("Erro ao criar usuário: " + error.message);
      }
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (id === currentUser.id) {
      alert("Você não pode excluir o próprio usuário logado!");
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) {
      const { error } = await supabase.rpc('delete_user_admin', { p_user_id: id });
      if (!error) {
        fetchUsuarios();
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

  return (
    <div className="usuarios-container" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={24} color="#8b5cf6" />
          Configurações de Usuários
        </h2>
        
        <button 
          onClick={() => handleOpenModal()}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: 'linear-gradient(to right, #8b5cf6, #7c3aed)', 
            color: '#fff', border: 'none', padding: '10px 16px', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600 
          }}
        >
          <UserPlus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
            <tr>
              <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600 }}>Usuário</th>
              <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600 }}>Perfil</th>
              <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '16px', color: '#cbd5e1', fontWeight: 600, textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Carregando...</td></tr>
            ) : usuarios.map((user, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px', color: '#f8fafc', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
                      <Users size={18} />
                    </div>
                    {user.username}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                    background: user.role === 'MASTER' ? 'rgba(239, 68, 68, 0.2)' : user.role === 'ADM' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: user.role === 'MASTER' ? '#ef4444' : user.role === 'ADM' ? '#3b82f6' : '#10b981'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  {user.primeiro_acesso ? (
                    <span style={{ color: '#f59e0b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={14} /> Troca de senha pendente
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Ativo</span>
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleResetPassword(user.id, user.username)} title="Redefinir Senha" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                      <Key size={16} />
                    </button>
                    <button onClick={() => handleOpenModal(user)} title="Editar" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(user.id, user.username)} title="Excluir" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', opacity: user.id === currentUser.id ? 0.3 : 1 }} disabled={user.id === currentUser.id}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card glass-panel" style={{ width: '400px', padding: '24px' }}>
            <h3 style={{ marginBottom: '20px', color: '#fff' }}>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '13px' }}>Usuário</label>
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
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#8b5cf6', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
