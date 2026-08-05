const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const target = `      const results = [];
      // Process in batches of 5 concurrent requests to avoid network stall
      for (let i = 0; i < chunks.length; i += 5) {
        const batch = chunks.slice(i, i + 5).map(chunk => 
          supabase.from(table).select('*').range(chunk.from, chunk.to)
        );
        const batchResults = await Promise.all(batch);
        batchResults.forEach(({ data: chunkData }) => {
          if (chunkData) results.push(...chunkData);
        });
      }
      return results;
    };`;

const replacement = `      const results = [];
      // Process in batches of 5 concurrent requests to avoid network stall
      for (let i = 0; i < chunks.length; i += 5) {
        const batch = chunks.slice(i, i + 5).map(chunk => 
          supabase.from(table).select('*').range(chunk.from, chunk.to)
        );
        const batchResults = await Promise.all(batch);
        batchResults.forEach(({ data: chunkData }) => {
          if (chunkData) {
            // Auto fix future visitas
            if (table === 'visitas') {
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
            }
            results.push(...chunkData);
          }
        });
      }
      return results;
    };`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.jsx', code, 'utf8');
  console.log('App.jsx patched successfully');
} else {
  console.log('Target not found in App.jsx');
}
