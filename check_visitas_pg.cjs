const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres.nrppkksgtmtfodmefgim:GsControl2026!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';
  
  const client = new Client({
    connectionString,
  });

  await client.connect();

  try {
    const res = await client.query("SELECT created_at, nome_supervisor, nomepos FROM public.visitas WHERE created_at >= '2026-08-17T03:00:00Z'");
    
    console.log('Visitas hoje:', res.rowCount);
    res.rows.forEach(r => console.log(r.created_at, r.nome_supervisor, r.nomepos));
    
    if (res.rowCount === 0) {
      const resOntem = await client.query("SELECT created_at, nome_supervisor, nomepos FROM public.visitas WHERE created_at >= '2026-08-16T03:00:00Z' AND created_at < '2026-08-17T03:00:00Z'");
      console.log('Visitas ontem:', resOntem.rowCount);
      resOntem.rows.forEach(r => console.log(r.created_at, r.nome_supervisor, r.nomepos));
    }
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}
run();
