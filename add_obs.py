import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/SupervisorApp.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# Add state
old_state = "  const [previews, setPreviews] = useState([]);"
new_state = "  const [previews, setPreviews] = useState([]);\n  const [observacaoVisita, setObservacaoVisita] = useState('');"
content = content.replace(old_state, new_state)

# Add to insert
old_insert = """            hora_chegada: activeVisit.horaChegada,
            hora_saida: horaSaida,
            foto_url: fotoUrlJoined
          }
        ])"""
new_insert = """            hora_chegada: activeVisit.horaChegada,
            hora_saida: horaSaida,
            foto_url: fotoUrlJoined,
            observacao: observacaoVisita
          }
        ])"""
content = content.replace(old_insert, new_insert)

# Add clear state in cleanup
old_cleanup = """      setFotos([]);
      setPreviews([]);
      setChecklist(defaultChecklist);"""
new_cleanup = """      setFotos([]);
      setPreviews([]);
      setObservacaoVisita('');
      setChecklist(defaultChecklist);"""
content = content.replace(old_cleanup, new_cleanup)

# Add UI field
old_ui = """            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" """
new_ui = """            </div>
            
            {/* Observação Geral */}
            <div className="form-group" style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ display: 'block', marginBottom: '12px', color: '#e2e8f0', fontWeight: 600, fontSize: '15px' }}>
                Observação Geral da Visita (Opcional)
              </label>
              <textarea 
                rows="3"
                value={observacaoVisita}
                onChange={(e) => setObservacaoVisita(e.target.value)}
                placeholder="Digite alguma observação extra sobre a visita ao posto..."
                style={{ 
                  width: '100%', padding: '12px', borderRadius: '6px', 
                  background: 'rgba(15, 23, 42, 0.6)', color: '#fff', 
                  border: '1px solid rgba(255,255,255,0.1)', outline: 'none', 
                  fontSize: '14px', resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" """
content = content.replace(old_ui, new_ui)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added observacaoVisita field")
