import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Login.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

index = content.rfind("  return (")
logic_part = content[:index]

new_jsx = """  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#0b1120', overflow: 'hidden', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      
      {/* Lado Esquerdo - Cyber Radar Globe EXATO */}
      <div style={{ 
        flex: 1, 
        display: window.innerWidth > 768 ? 'block' : 'none',
        position: 'relative',
        backgroundImage: 'url("/bg-left.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRight: '1px solid rgba(59, 130, 246, 0.2)'
      }}>
      </div>

      {/* Lado Direito - Painel de Login com Fundo de Cidade EXATO */}
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

        <div style={{
          width: '85%',
          maxWidth: '460px',
          background: 'rgba(235, 235, 235, 0.95)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '48px 40px',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          zIndex: 20
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ background: '#0d6efd', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>GS</div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '0.5px', margin: 0 }}>GSOLIMPIO</h2>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
              GS-Control
            </h1>
            <p style={{ color: '#4a4a4a', fontSize: '15px', marginTop: '8px', fontWeight: 400 }}>Enterprise Control Panel</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!needsNewPass ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#1a1a1a', fontSize: '14px', fontWeight: 500 }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    placeholder="Your Email"
                    style={{ 
                      width: '100%', padding: '14px 16px', 
                      background: '#ffffff', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px', color: '#1a1a1a', 
                      outline: 'none', fontSize: '15px', textTransform: 'uppercase',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => { e.target.style.border = '1px solid #0d6efd'; e.target.style.boxShadow = '0 0 0 3px rgba(13, 110, 253, 0.15)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #d1d5db'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#1a1a1a', fontSize: '14px', fontWeight: 500 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    style={{ 
                      width: '100%', padding: '14px 16px', 
                      background: '#ffffff', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px', color: '#1a1a1a', 
                      outline: 'none', fontSize: '15px',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => { e.target.style.border = '1px solid #0d6efd'; e.target.style.boxShadow = '0 0 0 3px rgba(13, 110, 253, 0.15)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #d1d5db'; e.target.style.boxShadow = 'none'; }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', padding: '14px', marginTop: '8px',
                  background: loading ? '#0b5ed7' : '#0d6efd', 
                  color: '#ffffff', border: 'none', borderRadius: '8px', 
                  fontWeight: 500, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => !loading && (e.target.style.background = '#0b5ed7')}
                onMouseOut={(e) => !loading && (e.target.style.background = '#0d6efd')}
              >
                {loading ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center', color: '#4a4a4a', fontSize: '14px', marginBottom: '8px' }}>
                Primeiro acesso. Defina uma nova senha.
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#1a1a1a', fontSize: '14px', fontWeight: 500 }}>Nova Senha</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 6 caracteres"
                    style={{ 
                      width: '100%', padding: '14px 16px', 
                      background: '#ffffff', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px', color: '#1a1a1a', 
                      outline: 'none', fontSize: '15px'
                    }}
                    onFocus={(e) => { e.target.style.border = '1px solid #0d6efd'; e.target.style.boxShadow = '0 0 0 3px rgba(13, 110, 253, 0.15)'; }}
                    onBlur={(e) => { e.target.style.border = '1px solid #d1d5db'; e.target.style.boxShadow = 'none'; }}
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
                  background: loading ? '#157347' : '#198754', 
                  color: '#fff', border: 'none', borderRadius: '8px', 
                  fontWeight: 500, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '24px', color: '#6c757d', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
            <span style={{ cursor: 'pointer' }}>Forgot Password?</span>
            <span style={{ cursor: 'pointer' }}>Sign Up Now</span>
          </div>

        </div>
      </div>

    </div>
  );
}
"""

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(logic_part + new_jsx)

print("Login updated exactly to new layout.")
