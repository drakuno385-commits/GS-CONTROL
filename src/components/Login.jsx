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
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#0b1120', overflow: 'hidden', fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Lado Esquerdo - Cyber Radar Globe */}
      <div style={{ 
        flex: 1, 
        display: window.innerWidth > 768 ? 'block' : 'none',
        position: 'relative',
        backgroundImage: 'url("/bg-left.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRight: '1px solid rgba(255,255,255,0.05)'
      }}>
      </div>

      {/* Lado Direito - Fundo da Cidade */}
      <div style={{ 
        width: window.innerWidth > 768 ? '50%' : '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10,
        backgroundImage: 'url("/bg-right-clean.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>

        {/* Formulario Melhorado (Corporate Clean) */}
        <div style={{
          width: '85%',
          maxWidth: '420px',
          background: 'rgba(255, 255, 255, 0.98)', 
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '48px 40px',
          border: '1px solid rgba(255, 255, 255, 1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 1px 5px rgba(0,0,0,0.05)',
          position: 'relative',
          zIndex: 20
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#007BFF', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '13px', boxShadow: '0 4px 10px rgba(0,123,255,0.3)' }}>GS</div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', letterSpacing: '0.5px', margin: 0 }}>GSOLIMPIO</h2>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
              GS-Control
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '6px', fontWeight: 500 }}>Enterprise Control Panel</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', border: '1px solid #fecaca', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!needsNewPass ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: 600, letterSpacing: '0.3px' }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    placeholder="YOUR EMAIL"
                    style={{ 
                      width: '100%', padding: '14px 16px', 
                      background: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '10px', color: '#111827', 
                      outline: 'none', fontSize: '14px', textTransform: 'uppercase',
                      transition: 'all 0.2s ease',
                      fontWeight: 500
                    }}
                    onFocus={(e) => { e.target.style.background = '#ffffff'; e.target.style.border = '1px solid #007BFF'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 123, 255, 0.1)'; }}
                    onBlur={(e) => { e.target.style.background = '#f9fafb'; e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: 600, letterSpacing: '0.3px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ 
                      width: '100%', padding: '14px 16px', 
                      background: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '10px', color: '#111827', 
                      outline: 'none', fontSize: '14px',
                      transition: 'all 0.2s ease',
                      fontWeight: 500
                    }}
                    onFocus={(e) => { e.target.style.background = '#ffffff'; e.target.style.border = '1px solid #007BFF'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 123, 255, 0.1)'; }}
                    onBlur={(e) => { e.target.style.background = '#f9fafb'; e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', padding: '15px', marginTop: '6px',
                  background: loading ? '#2563eb' : '#007BFF', 
                  color: '#ffffff', border: 'none', borderRadius: '10px', 
                  fontWeight: 600, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0, 123, 255, 0.25)'
                }}
                onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-1px)', e.target.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.3)')}
                onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.25)')}
              >
                {loading ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
                Primeiro acesso. Defina uma nova senha.
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#374151', fontSize: '13px', fontWeight: 600 }}>Nova Senha</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 6 caracteres"
                    style={{ 
                      width: '100%', padding: '14px 16px', 
                      background: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '10px', color: '#111827', 
                      outline: 'none', fontSize: '14px'
                    }}
                    onFocus={(e) => { e.target.style.background = '#ffffff'; e.target.style.border = '1px solid #007BFF'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 123, 255, 0.1)'; }}
                    onBlur={(e) => { e.target.style.background = '#f9fafb'; e.target.style.border = '1px solid #e5e7eb'; e.target.style.boxShadow = 'none'; }}
                    required 
                    minLength={6}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', padding: '15px', 
                  background: loading ? '#059669' : '#10b981', 
                  color: '#fff', border: 'none', borderRadius: '10px', 
                  fontWeight: 600, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}
              >
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '28px', color: '#9ca3af', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', fontWeight: 500 }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseOver={(e) => e.target.style.color='#4b5563'} onMouseOut={(e) => e.target.style.color='#9ca3af'}>Forgot Password?</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s ease' }} onMouseOver={(e) => e.target.style.color='#4b5563'} onMouseOut={(e) => e.target.style.color='#9ca3af'}>Sign Up Now</span>
          </div>

        </div>
      </div>

    </div>
  );
}
