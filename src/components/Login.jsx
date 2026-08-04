import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, User, LogIn } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [needsNewPass, setNeedsNewPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [userDoc, setUserDoc] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = `${username}@acoweb.sistema`;
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
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
        .select('*')
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

      // Atualiza o status de primeiro_acesso na tabela
      const { data, error } = await supabase
        .from('app_usuarios')
        .update({ primeiro_acesso: false })
        .eq('id', userDoc.id)
        .select()
        .single();

      if (error) {
        setError('Erro ao atualizar status do usuário.');
        setLoading(false);
        return;
      }

      onLoginSuccess(data);
    } catch (err) {
      setError('Erro ao conectar.');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <style>
            {`
              @keyframes slowSpin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes pulseGlow {
                0% { box-shadow: 0 0 10px rgba(96, 165, 250, 0.2); }
                50% { box-shadow: 0 0 30px rgba(167, 139, 250, 0.6); }
                100% { box-shadow: 0 0 10px rgba(96, 165, 250, 0.2); }
              }
            `}
          </style>
          
          <div style={{ 
            width: '120px', 
            height: '120px', 
            margin: '0 auto 20px', 
            borderRadius: '50%',
            padding: '4px',
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            animation: 'slowSpin 20s linear infinite, pulseGlow 4s ease-in-out infinite'
          }}>
            <img 
              src="/logo.jpg" 
              alt="GSolimpio" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                borderRadius: '50%',
                border: '4px solid #0f172a',
                animation: 'slowSpin 20s linear infinite reverse' /* Keeps image upright while border spins */
              }} 
            />
          </div>

          <h1 style={{ fontSize: '28px', background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>GS-Control</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Controle Operacional - GSolimpio</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        {!needsNewPass ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>Nome de Usuário</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ background: 'var(--accent-primary)', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginTop: '8px' }}>
              <LogIn size={18} /> {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ color: '#f59e0b', fontSize: '14px', marginBottom: '10px' }}>
              Este é o seu primeiro acesso. Por segurança, você precisa definir uma nova senha definitiva.
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginTop: '8px' }}>
              <Lock size={18} /> {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
