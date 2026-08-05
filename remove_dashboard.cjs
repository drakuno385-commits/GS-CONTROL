const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Remove import
app = app.replace("import Dashboard from './components/Dashboard';\n", "");

// 2. Remove nav link
const navTarget = `              {hasAccess(currentUser, 'dashboard') && (
                <a className={\`nav-item \${activeMenu === 'dashboard' ? 'active' : ''}\`} onClick={() => setActiveMenu('dashboard')}>
                  <Activity size={20} />
                  <span>Visão Executiva</span>
                </a>
              )}`;

// Wait, since encoding might be different (e.g. Visǜo or Visão), let's use a regex
app = app.replace(/\{\s*hasAccess\(currentUser,\s*'dashboard'\)[\s\S]*?<\/a>\s*\}/, "");

// 3. Remove component rendering
app = app.replace(/\{\s*activeMenu === 'dashboard' && <Dashboard[^>]*\/>\s*\}/, "");

fs.writeFileSync('src/App.jsx', app, 'utf8');
console.log('App.jsx dashboard removed');
