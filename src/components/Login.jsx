import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, User, LogIn, Download } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [needsNewPass, setNeedsNewPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [userDoc, setUserDoc] = useState(null);
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  React.useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const identifier = `${username.replace(/\s+/g, '')}@acoweb.sistema`;
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password
      });

      if (authError || !authData.user) {
        setError('Usuário ou senha incorretos.');
        setLoading(false);
        return;
      }

      // Buscar os dados do usuário (role, primeiro_acesso) na tabela
      const { data, error } = await supabase
        .from('app_usuarios')
        .select('*').limit(10000)
        .eq('id', authData.user.id)
        .single();

      if (error || !data) {
        setError('Erro ao recuperar perfil do usuário.');
        setLoading(false);
        return;
      }

      if (data.primeiro_acesso) {
        setUserDoc(data);
        setNeedsNewPass(true);
        setLoading(false);
        return;
      }

      onLoginSuccess(data);
    } catch (err) {
      setError('Erro ao conectar com servidor.');
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    
    setLoading(true);
    try {
      // Atualiza a senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) {
        setError('Erro ao atualizar a senha de autenticação.');
        setLoading(false);
        return;
      }

      // Atualiza o status de primeiro_acesso na tabela através de RPC para contornar RLS
      const { data, error } = await supabase.rpc('confirm_first_access');

      if (error) {
        setError('Erro ao atualizar status do usuário.');
        setLoading(false);
        return;
      }

      onLoginSuccess({...userDoc, primeiro_acesso: false});
    } catch (err) {
      setError('Erro ao conectar.');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#0b1120', overflow: 'hidden' }}>
      
      {/* Lado Esquerdo - Background Tecnologico */}
      <div style={{ 
        flex: 1, 
        display: window.innerWidth > 768 ? 'block' : 'none',
        position: 'relative',
        background: 'linear-gradient(135deg, #0b1120 0%, #1e3a8a 100%)',
        overflow: 'hidden'
      }}>
        {/* Efeito de Grid Cibernetico */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: 'center center'
        }}></div>
        {/* Glow Central */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>
        
        <div style={{ position: 'absolute', bottom: '40px', left: '40px', color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '2px' }}>
          GS-CONTROL SYSTEM V.2.0.4<br/>
          SECURE CONNECTION ESTABLISHED
        </div>
      </div>

      {/* Lado Direito - Painel de Login */}
      <div style={{ 
        width: window.innerWidth > 768 ? '500px' : '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '24px',
          padding: '48px 40px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.1)'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#94a3b8', letterSpacing: '3px', marginBottom: '8px' }}>GSOLIMPIO</h2>
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              GS-<span style={{ color: '#3b82f6' }}>Control</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '12px' }}>Enterprise Control Panel</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '13px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!needsNewPass ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Nome de Usuario</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    placeholder="Seu usuario"
                    style={{ 
                      width: '100%', padding: '14px 16px 14px 46px', 
                      background: 'rgba(11, 17, 32, 0.5)', 
                      border: '1px solid rgba(59, 130, 246, 0.2)', 
                      borderRadius: '12px', color: '#f8fafc', 
                      outline: 'none', fontSize: '15px', textTransform: 'uppercase',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 15px rgba(59,130,246,0.3)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(59, 130, 246, 0.2)'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ 
                      width: '100%', padding: '14px 16px 14px 46px', 
                      background: 'rgba(11, 17, 32, 0.5)', 
                      border: '1px solid rgba(59, 130, 246, 0.2)', 
                      borderRadius: '12px', color: '#f8fafc', 
                      outline: 'none', fontSize: '15px',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 15px rgba(59,130,246,0.3)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(59, 130, 246, 0.2)'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', padding: '14px', marginTop: '8px',
                  background: loading ? '#1e3a8a' : '#3b82f6', 
                  color: '#fff', border: 'none', borderRadius: '12px', 
                  fontWeight: 600, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => !loading && (e.target.style.background = '#2563eb')}
                onMouseOut={(e) => !loading && (e.target.style.background = '#3b82f6')}
              >
                {loading ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
                Este e o seu primeiro acesso. Por seguranca, voce precisa definir uma nova senha.
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Nova Senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 6 caracteres"
                    style={{ 
                      width: '100%', padding: '14px 16px 14px 46px', 
                      background: 'rgba(11, 17, 32, 0.5)', 
                      border: '1px solid rgba(59, 130, 246, 0.2)', 
                      borderRadius: '12px', color: '#f8fafc', 
                      outline: 'none', fontSize: '15px'
                    }}
                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 15px rgba(59,130,246,0.3)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(59, 130, 246, 0.2)'; e.target.style.boxShadow = 'none'; }}
                    required 
                    minLength={6}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', padding: '14px', 
                  background: loading ? '#1e3a8a' : '#10b981', 
                  color: '#fff', border: 'none', borderRadius: '12px', 
                  fontWeight: 600, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </form>
          )}

          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              style={{ 
                width: '100%', padding: '12px', marginTop: '24px',
                background: 'rgba(30, 41, 59, 0.5)', 
                color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', 
                fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <Download size={16} /> Instalar Aplicativo
            </button>
          )}

          <div style={{ textAlign: 'center', marginTop: '40px', color: '#475569', fontSize: '12px' }}>
            © 2026 GSOLIMPIO. Todos os direitos reservados.
          </div>
        </div>
      </div>

    </div>
  );
}
