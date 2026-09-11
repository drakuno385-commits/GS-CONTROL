import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Login.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

index = content.rfind("  return (")
logic_part = content[:index]

new_jsx = """  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#0b1120', overflow: 'hidden', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Lado Esquerdo - Cyber Radar Globe */}
      <div style={{ 
        flex: 1, 
        display: window.innerWidth > 768 ? 'block' : 'none',
        position: 'relative',
        backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'left center',
        borderRight: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
        {/* Overlay Dark Blue para dar o tom cibernetico */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(90deg, rgba(11,17,32,0.4) 0%, rgba(11,17,32,0.9) 100%)'
        }}></div>
      </div>

      {/* Lado Direito - Painel de Login com Fundo de Cidade */}
      <div style={{ 
        width: window.innerWidth > 768 ? '550px' : '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px',
        position: 'relative',
        zIndex: 10,
        backgroundImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {/* Overlay Escuro para legibilidade */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11, 17, 32, 0.85)'
        }}></div>

        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '48px 40px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 20
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', letterSpacing: '2px', marginBottom: '4px' }}>GSOLIMPIO</h2>
            <h1 style={{ fontSize: '38px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              GS-<span style={{ color: '#3b82f6' }}>Control</span>
            </h1>
            <p style={{ color: '#e2e8f0', fontSize: '15px', marginTop: '12px', fontWeight: 400 }}>Enterprise Control Panel</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!needsNewPass ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f8fafc', fontSize: '15px', fontWeight: 500 }}>Nome de Usuario</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    placeholder="Seu usuario"
                    style={{ 
                      width: '100%', padding: '14px 16px', 
                      background: 'rgba(15, 23, 42, 0.8)', 
                      border: '1px solid rgba(59, 130, 246, 0.4)', 
                      borderRadius: '8px', color: '#f8fafc', 
                      outline: 'none', fontSize: '16px', textTransform: 'uppercase',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 0 10px rgba(59,130,246,0.1)'
                    }}
                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 15px rgba(59,130,246,0.5)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(59, 130, 246, 0.4)'; e.target.style.boxShadow = '0 0 10px rgba(59,130,246,0.1)'; }}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f8fafc', fontSize: '15px', fontWeight: 500 }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ 
                      width: '100%', padding: '14px 16px', 
                      background: 'rgba(15, 23, 42, 0.8)', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: '8px', color: '#f8fafc', 
                      outline: 'none', fontSize: '16px',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 15px rgba(59,130,246,0.5)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', padding: '16px', marginTop: '16px',
                  background: loading ? '#2563eb' : '#3b82f6', 
                  color: '#ffffff', border: 'none', borderRadius: '8px', 
                  fontWeight: 700, fontSize: '18px', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)',
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
              <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>
                Este e o seu primeiro acesso. Por seguranca, defina uma nova senha.
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f8fafc', fontSize: '15px', fontWeight: 500 }}>Nova Senha</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 6 caracteres"
                    style={{ 
                      width: '100%', padding: '14px 16px', 
                      background: 'rgba(15, 23, 42, 0.8)', 
                      border: '1px solid rgba(59, 130, 246, 0.4)', 
                      borderRadius: '8px', color: '#f8fafc', 
                      outline: 'none', fontSize: '16px'
                    }}
                    onFocus={(e) => { e.target.style.border = '1px solid #3b82f6'; e.target.style.boxShadow = '0 0 15px rgba(59,130,246,0.5)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(59, 130, 246, 0.4)'; e.target.style.boxShadow = '0 0 10px rgba(59,130,246,0.1)'; }}
                    required 
                    minLength={6}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', padding: '16px', 
                  background: loading ? '#059669' : '#10b981', 
                  color: '#fff', border: 'none', borderRadius: '8px', 
                  fontWeight: 700, fontSize: '18px', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.5)'
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
                width: '100%', padding: '14px', marginTop: '24px',
                background: 'transparent', 
                color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', 
                fontSize: '15px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseOut={(e) => { e.target.style.background = 'transparent'; }}
            >
              <Download size={18} /> Instalar Aplicativo
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
"""

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(logic_part + new_jsx)

print("Login updated perfectly.")
