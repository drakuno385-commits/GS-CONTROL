import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Login.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the left div style
old_left_style = """      <div style={{ 
        flex: 1, 
        display: window.innerWidth > 768 ? 'block' : 'none',
        position: 'relative',
        backgroundImage: 'url("/bg-left.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRight: '1px solid rgba(59, 130, 246, 0.1)'
      }}>
      </div>"""

new_left_style = """      <div style={{ 
        flex: 1, 
        display: window.innerWidth > 768 ? 'block' : 'none',
        position: 'relative',
        backgroundImage: 'url("/bg-left.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {/* Gradiente de transição suave na borda direita do mapa */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0, bottom: 0, width: '250px',
          background: 'linear-gradient(to right, rgba(11, 17, 32, 0) 0%, rgba(11, 17, 32, 1) 100%)',
          pointerEvents: 'none'
        }}></div>
      </div>"""

content = content.replace(old_left_style, new_left_style)

# Replace the right div style opening and add the left-fade gradient
old_right_style_start = """      {/* Lado Direito - Painel de Login com Fundo de Cidade */}
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
      }}>"""

new_right_style_start = """      {/* Lado Direito - Painel de Login com Fundo de Cidade */}
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
        {/* Gradiente de transição suave na borda esquerda da cidade */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0, width: '250px',
          background: 'linear-gradient(to left, rgba(11, 17, 32, 0) 0%, rgba(11, 17, 32, 1) 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }}></div>"""

content = content.replace(old_right_style_start, new_right_style_start)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added smooth transition gradient.")
