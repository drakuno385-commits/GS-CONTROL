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
        backgroundImage: 'url("/bg-right.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>

        {/* Form HTML overlay that covers the baked-in form */}
        <div style={{
          width: '80%',
          maxWidth: '450px',
          background: 'rgba(25, 33, 48, 0.95)', // Forte o suficiente para tapar o fake form
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '48px 40px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          zIndex: 20
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '1px', marginBottom: '4px' }}>GSOLIMPIO</h2>
            <h1 style={{ fontSize: '42px', fontWeight: 800, color: '#4ba0fa', margin: 0 }}>
              GS-<span style={{ color: '#4ba0fa' }}>Control</span>
            </h1>
            <p style={{ color: '#e2e8f0', fontSize: '15px', marginTop: '8px', fontWeight: 400 }}>Enterprise Control Panel</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!needsNewPass ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f8fafc', fontSize: '16px', fontWeight: 500 }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value.toUpperCase())}
                    placeholder="Your Email"
                    style={{ 
                      width: '100%', padding: '16px 20px', 
                      background: '#111827', 
                      border: '1px solid #3b82f6', 
                      borderRadius: '12px', color: '#f8fafc', 
                      outline: 'none', fontSize: '16px', textTransform: 'uppercase',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 0 15px rgba(59,130,246,0.3)'
                    }}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f8fafc', fontSize: '16px', fontWeight: 500 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ 
                      width: '100%', padding: '16px 20px', 
                      background: '#111827', 
                      border: '1px solid #1e293b', 
                      borderRadius: '12px', color: '#f8fafc', 
                      outline: 'none', fontSize: '16px',
                      transition: 'all 0.3s ease'
                    }}
                    required
                  />
                  {/* Eye icon fake */}
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#3b82f6' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', padding: '16px', marginTop: '8px',
                  background: loading ? '#2563eb' : '#3b82f6', 
                  color: '#ffffff', border: 'none', borderRadius: '12px', 
                  fontWeight: 700, fontSize: '18px', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '15px', marginBottom: '8px' }}>
                Primeiro acesso. Defina uma nova senha.
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#f8fafc', fontSize: '16px', fontWeight: 500 }}>Nova Senha</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 6 caracteres"
                    style={{ 
                      width: '100%', padding: '16px 20px', 
                      background: '#111827', 
                      border: '1px solid #3b82f6', 
                      borderRadius: '12px', color: '#f8fafc', 
                      outline: 'none', fontSize: '16px'
                    }}
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
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.5)'
                }}
              >
                {loading ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: '32px', color: '#e2e8f0', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

print("Login updated exactly to the pixel.")
