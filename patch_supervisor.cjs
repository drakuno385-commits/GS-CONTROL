const fs = require('fs');
let code = fs.readFileSync('src/components/SupervisorApp.jsx', 'utf8');

// 1. Add state variable
code = code.replace(
  /const \[selectedPostoId, setSelectedPostoId\] = useState\(''\);/,
  "const [selectedPostoId, setSelectedPostoId] = useState('');\n  const [searchPosto, setSearchPosto] = useState('');"
);

// 2. Filter postosFiltrados by searchPosto
code = code.replace(
  /const postosFiltrados = postos\.filter\(p => p\.nomecli === selectedCliente\)\.sort\(\(a, b\) => \(a\.nomepos \|\| ''\)\.localeCompare\(b\.nomepos \|\| ''\)\);/,
  `const postosFiltrados = postos.filter(p => {
    if (p.nomecli !== selectedCliente) return false;
    if (searchPosto) {
      const termo = searchPosto.toLowerCase();
      const nome = (p.nomepos || '').toLowerCase();
      const cod = (p.codpos || '').toString().toLowerCase();
      return nome.includes(termo) || cod.includes(termo);
    }
    return true;
  }).sort((a, b) => (a.nomepos || '').localeCompare(b.nomepos || ''));`
);

// 3. Reset search on cliente change
code = code.replace(
  /setSelectedPostoId\(''\);\s*};/,
  "setSelectedPostoId('');\n    setSearchPosto('');\n  };"
);

// 4. Add search input field in JSX
const jsxReplacement = `              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>
                  <MapPin size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
                  Posto de Serviço
                </label>
                {selectedCliente && (
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text"
                      placeholder="Pesquisar posto por nome ou código..."
                      value={searchPosto}
                      onChange={(e) => setSearchPosto(e.target.value)}
                      style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}
                    />
                  </div>
                )}
                <select `;

code = code.replace(
  /              <div className="form-group">\s*<label style=\{\{ display: 'block', marginBottom: '8px', color: '#cbd5e1' \}\}>\s*<MapPin size=\{16\} style=\{\{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' \}\}\/>\s*Posto de Servi[çc]o\s*<\/label>\s*<select /,
  jsxReplacement
);

fs.writeFileSync('src/components/SupervisorApp.jsx', code);
console.log('App patched.');
