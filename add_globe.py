import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Login.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace iframe with Globe component
old_iframe_block = """        {/* Vídeo de Globo Tecnológico Girando via iframe para garantir carregamento sem block */}
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
        </div>

        {/* Sobreposição de cor escura para manter o tom corporativo azul/marinho */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(4, 11, 22, 0.4)',
          pointerEvents: 'none'
        }}></div>"""

new_globe_block = """        {/* Globo 3D Gerado por Código (Sem controles, 100% nítido) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.9 }}>
           <GlobeContainer />
        </div>"""

content = content.replace(old_iframe_block, new_globe_block)

# Insert the GlobeContainer logic at the top of the file
import_globe = """import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import Globe from 'react-globe.gl';

// Componente do Globo 3D
const GlobeContainer = () => {
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth / 2, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth / 2, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    
    // Auto-rotate
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 1.5;
      globeRef.current.controls().enableZoom = false;
      // Remove atmosphere/glow if it makes it too bright
      globeRef.current.pointOfView({ altitude: 2.2 });
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dados fictícios para simular "controle de dados" (linhas conectando cidades)
  const arcsData = [
    { startLat: 40.7128, startLng: -74.0060, endLat: 51.5074, endLng: -0.1278, color: '#3b82f6' },
    { startLat: -23.5505, startLng: -46.6333, endLat: 40.7128, endLng: -74.0060, color: '#60a5fa' },
    { startLat: 35.6762, startLng: 139.6503, endLat: -23.5505, endLng: -46.6333, color: '#3b82f6' },
    { startLat: 48.8566, startLng: 2.3522, endLat: 35.6762, endLng: 139.6503, color: '#93c5fd' },
    { startLat: 51.5074, startLng: -0.1278, endLat: 1.3521, endLng: 103.8198, color: '#3b82f6' }
  ];

  return (
    <Globe
      ref={globeRef}
      width={dimensions.width}
      height={dimensions.height}
      backgroundColor="rgba(0,0,0,0)"
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
      arcsData={arcsData}
      arcColor="color"
      arcDashLength={0.4}
      arcDashGap={0.2}
      arcDashAnimateTime={1500}
      arcsTransitionDuration={1000}
      arcStroke={1.5}
    />
  );
};
"""

content = content.replace("import React, { useState } from 'react';", import_globe)
# Wait, it might be import React, { useState, useEffect } from 'react';
content = content.replace("import React, { useState, useEffect } from 'react';", import_globe.replace("import React, { useState, useEffect, useRef } from 'react';\n", ""))
# I'll just use a regex to replace the first import React...
content = re.sub(r"import React.*?;", import_globe, content, count=1)


with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added Globe code.")
