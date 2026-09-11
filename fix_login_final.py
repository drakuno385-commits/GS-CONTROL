import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Login.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract just the default export
m = re.search(r'(export default function Login.*?)$', content, flags=re.DOTALL)
if m:
    login_part = m.group(1)
    
    header = """import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import Globe from 'react-globe.gl';

// Componente do Globo 3D
const GlobeContainer = () => {
  const globeRef = useRef();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth / 2, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth / 2, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 1.0;
      globeRef.current.controls().enableZoom = false;
      globeRef.current.pointOfView({ altitude: 2.2 });
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    with open(FILE_PATH, 'w', encoding='utf-8') as f:
        f.write(header + login_part)
    print("Fixed!")
else:
    print("Export not found")

