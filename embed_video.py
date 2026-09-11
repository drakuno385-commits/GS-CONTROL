import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Login.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Trocar a div estática do mapa por um iframe de vídeo de background do YouTube ou CDN público
old_div = """      <div style={{ 
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

new_div = """      <div style={{ 
        flex: 1, 
        display: window.innerWidth > 768 ? 'block' : 'none',
        position: 'relative',
        overflow: 'hidden',
        background: '#040b16'
      }}>
        {/* Vídeo de Globo Tecnológico Girando */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.85
          }}
        >
          {/* Usando um vídeo público open-source de globo tecnológico */}
          <source src="https://cdn.pixabay.com/video/2020/03/26/34215-401566378_large.mp4" type="video/mp4" />
        </video>

        {/* Sobreposição de cor escura para manter o tom corporativo azul/marinho */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(4, 11, 22, 0.4)',
          pointerEvents: 'none'
        }}></div>

        {/* Gradiente de transição suave na borda direita do vídeo */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0, bottom: 0, width: '250px',
          background: 'linear-gradient(to right, rgba(11, 17, 32, 0) 0%, rgba(11, 17, 32, 1) 100%)',
          pointerEvents: 'none'
        }}></div>
      </div>"""

content = content.replace(old_div, new_div)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Video embedded")
