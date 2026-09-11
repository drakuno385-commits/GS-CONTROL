import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Login.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

index = content.rfind("  return (")
logic_part = content[:index]

new_jsx = """  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#0b1120', overflow: 'hidden', fontFamily: "'Outfit', 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Lado Esquerdo - Cyber Radar Globe EXATO */}
      <div style={{ 
        flex: 1, 
        display: window.innerWidth > 768 ? 'block' : 'none',
        position: 'relative',
        backgroundImage: 'url("/bg-left.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRight: '1px solid rgba(59, 130, 246, 0.1)'
      }}>
      </div>

      {/* Lado Direito - Painel de Login com Fundo de Cidade */}
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

        {/* Fundo Translúcido Glassmorphism Escuro */}
        <div style={{
          width: '80%',
          maxWidth: '440px',
          background: 'rgba(20, 27, 45, 0.45)', 
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          padding: '48px 40px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(255,255,255,0.02)',
          position: 'relative',
          zIndex: 20
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px', margin: '0 0 4px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>GSOLIMPIO</h2>
            <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#4ba0fa', margin: 0, textShadow: '0 2px 10px rgba(75, 160, 250, 0.3)' }}>
              GS-Control
            </h1>
            <p style={{ color: '#e2e8f0', fontSize: '15px', marginTop: '12px', fontWeight: 400, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Enterprise Control Panel</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!needsNewPass ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '10px', color: '#ffffff', fontSize: '15px', fontWeight: 500, letterSpacing: '0.3px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    placeholder="Your Email"
                    style={{ 
                      width: '100%', padding: '15px 18px', 
                      background: 'rgba(15, 23, 38, 0.7)', 
                      border: '1px solid #4ba0fa', 
                      borderRadius: '12px', color: '#ffffff', 
                      outline: 'none', fontSize: '15px', textTransform: 'uppercase',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 0 12px rgba(75, 160, 250, 0.25)',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => { e.target.style.boxShadow = '0 0 16px rgba(75, 160, 250, 0.5)'; }}
                    onBlur={(e) => { e.target.style.boxShadow = '0 0 12px rgba(75, 160, 250, 0.25)'; }}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '10px', color: '#ffffff', fontSize: '15px', fontWeight: 500, letterSpacing: '0.3px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ 
                      width: '100%', padding: '15px 18px', 
                      background: 'rgba(15, 23, 38, 0.7)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: '12px', color: '#ffffff', 
                      outline: 'none', fontSize: '15px',
                      transition: 'all 0.3s ease',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => { e.target.style.border = '1px solid #4ba0fa'; e.target.style.boxShadow = '0 0 16px rgba(75, 160, 250, 0.5)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                  {/* Eye icon fake */}
                  <div style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', color: '#4ba0fa', pointerEvents: 'none' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', padding: '16px', marginTop: '12px',
                  background: loading ? '#2563eb' : '#4ba0fa', 
                  color: '#ffffff', border: 'none', borderRadius: '12px', 
                  fontWeight: 700, fontSize: '18px', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(75, 160, 250, 0.3)',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
                onMouseOver={(e) => !loading && (e.target.style.background = '#3b82f6')}
                onMouseOut={(e) => !loading && (e.target.style.background = '#4ba0fa')}
              >
                {loading ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ textAlign: 'center', color: '#e2e8f0', fontSize: '15px', marginBottom: '8px' }}>
                Primeiro acesso. Defina uma nova senha.
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '10px', color: '#ffffff', fontSize: '15px', fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Nova Senha</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 6 caracteres"
                    style={{ 
                      width: '100%', padding: '15px 18px', 
                      background: 'rgba(15, 23, 38, 0.7)', 
                      border: '1px solid #4ba0fa', 
                      borderRadius: '12px', color: '#ffffff', 
                      outline: 'none', fontSize: '15px',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => { e.target.style.boxShadow = '0 0 16px rgba(75, 160, 250, 0.5)'; }}
                    onBlur={(e) => { e.target.style.boxShadow = '0 0 12px rgba(75, 160, 250, 0.25)'; }}
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
                  color: '#fff', border: 'none', borderRadius: '12px', 
                  fontWeight: 700, fontSize: '18px', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  fontFamily: 'inherit'
                }}
              >
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '36px', color: '#e2e8f0', fontSize: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', fontWeight: 400 }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }} onMouseOver={(e) => e.target.style.color='#ffffff'} onMouseOut={(e) => e.target.style.color='#e2e8f0'}>Forgot Password?</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }} onMouseOver={(e) => e.target.style.color='#ffffff'} onMouseOut={(e) => e.target.style.color='#e2e8f0'}>Sign Up Now</span>
          </div>

        </div>
      </div>

    </div>
  );
}
"""

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(logic_part + new_jsx)

print("Login updated to perfectly match dark glassmorphism.")
