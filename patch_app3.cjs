const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');
const appTarget = `            if (table === 'visitas') {
              chunkData.forEach(v => {
                if (v.hora_chegada) {
                  let d = new Date(v.hora_chegada);
                  const now = new Date();
                  while (d > now) { d.setHours(d.getHours() - 3); }
                  v.hora_chegada = d.toISOString();
                }
                if (v.hora_saida) {
                  let d = new Date(v.hora_saida);
                  const now = new Date();
                  while (d > now) { d.setHours(d.getHours() - 3); }
                  v.hora_saida = d.toISOString();
                }
              });
            }`;

const appReplacement = `            if (table === 'visitas') {
              chunkData.forEach(v => {
                const fixTime = (ds) => {
                  if (!ds) return null;
                  let d = new Date(ds);
                  if (isNaN(d)) return ds;
                  const now = new Date();
                  now.setMinutes(now.getMinutes() + 5);
                  while (d > now) { d.setHours(d.getHours() - 3); }
                  const pad = (n) => n.toString().padStart(2, '0');
                  return \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}-\${pad(d.getDate())} \${pad(d.getHours())}:\${pad(d.getMinutes())}:\${pad(d.getSeconds())}\`;
                };
                v.hora_chegada = fixTime(v.hora_chegada);
                v.hora_saida = fixTime(v.hora_saida);
              });
            }`;

if (app.includes(appTarget)) {
  app = app.replace(appTarget, appReplacement);
  fs.writeFileSync('src/App.jsx', app, 'utf8');
  console.log('App.jsx patched');
} else {
  console.log('App.jsx target not found');
}
