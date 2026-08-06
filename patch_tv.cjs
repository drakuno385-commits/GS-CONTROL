const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add tvScreens state
code = code.replace(
  /const \[tvInterval, setTvInterval\] = useState\(\(\) => \{/,
  `const [tvScreens, setTvScreens] = useState(() => {
    const saved = localStorage.getItem('acoweb_tv_screens');
    return saved ? JSON.parse(saved) : ['rh', 'frota', 'disciplina', 'atestados'];
  });
  
  useEffect(() => {
    localStorage.setItem('acoweb_tv_screens', JSON.stringify(tvScreens));
  }, [tvScreens]);

  const [tvInterval, setTvInterval] = useState(() => {`
);

// 2. Fix the interval logic
code = code.replace(
  /interval = setInterval\(\(\) => \{\s*setApresentacaoStep\(prev => \(prev \+ 1\) % 4\);\s*\}, tvInterval \* 1000\);/g,
  `interval = setInterval(() => {
          setApresentacaoStep(prev => tvScreens.length > 0 ? (prev + 1) % tvScreens.length : 0);
        }, tvInterval * 1000);`
);

code = code.replace(
  /\[activeMenu, tvInterval\]\);/,
  "[activeMenu, tvInterval, tvScreens.length]);"
);

// 3. Add the UI checkboxes in the sidebar
const sidebarTarget = `                      <option value={60}>1 minuto</option>
                    </select>
                  </div>
                )}`;

const sidebarReplacement = `                      <option value={60}>1 minuto</option>
                    </select>
                    
                    <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginTop: '12px' }}>Telas do Modo TV:</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                      {[
                        { id: 'rh', label: 'Efetivo (RH)' },
                        { id: 'frota', label: 'Frota' },
                        { id: 'disciplina', label: 'Disciplina' },
                        { id: 'atestados', label: 'Atestados' }
                      ].map(tela => (
                        <label key={tela.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '12px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={tvScreens.includes(tela.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTvScreens(prev => [...prev, tela.id]);
                              } else {
                                setTvScreens(prev => prev.length > 1 ? prev.filter(id => id !== tela.id) : prev);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          {tela.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}`;

code = code.replace(sidebarTarget, sidebarReplacement);

// 4. Update the render logic for Apresentacao
// Note: We need to handle when ApresentacaoStep is out of bounds
const renderTarget = `        {ApresentacaoStep === 0 && renderRH()}
        {ApresentacaoStep === 1 && renderFrota()}
        {ApresentacaoStep === 2 && renderDisciplina()}
        {ApresentacaoStep === 3 && renderAtestados()}`;

const renderReplacement = `        {tvScreens[ApresentacaoStep] === 'rh' && renderRH()}
        {tvScreens[ApresentacaoStep] === 'frota' && renderFrota()}
        {tvScreens[ApresentacaoStep] === 'disciplina' && renderDisciplina()}
        {tvScreens[ApresentacaoStep] === 'atestados' && renderAtestados()}`;

code = code.replace(renderTarget, renderReplacement);

fs.writeFileSync('src/App.jsx', code);
console.log('App patched.');
