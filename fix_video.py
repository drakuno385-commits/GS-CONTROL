import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Login.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

old_video = """        {/* Vídeo de Globo Tecnológico Girando */}
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
        </video>"""

new_iframe = """        {/* Vídeo de Globo Tecnológico Girando via iframe para garantir carregamento sem block */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '150vw',
          height: '150vh',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          opacity: 0.85
        }}>
          <iframe
            src="https://www.youtube.com/embed/ZLs8eL3qjwo?autoplay=1&mute=1&loop=1&playlist=ZLs8eL3qjwo&controls=0&showinfo=0&rel=0&iv_load_policy=3&disablekb=1"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            style={{ width: '100%', height: '100%' }}
          ></iframe>
        </div>"""

content = content.replace(old_video, new_iframe)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced video with iframe.")
