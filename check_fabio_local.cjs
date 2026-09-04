const { Client } = require('pg');

async function run() {
  // Try direct connection
  const client = new Client({
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.nrppkksgtmtfodmefgim',
    password: 'GsControl2026!',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    // Check all supervisor names
    const res = await client.query(`
      SELECT DISTINCT nome_supervisor, COUNT(*) as total 
      FROM public.visitas 
      GROUP BY nome_supervisor 
      ORDER BY nome_supervisor
    `);
    console.log('\n== SUPERVISORES COM VISITAS ==');
    res.rows.forEach(r => console.log(`  "${r.nome_supervisor}" -> ${r.total} visita(s)`));

    // Check occurrences by supervisor  
    const res2 = await client.query(`
      SELECT DISTINCT supervisor, COUNT(*) as total 
      FROM public.ocorrencias_visitas 
      GROUP BY supervisor 
      ORDER BY supervisor
    `);
    console.log('\n== SUPERVISORES COM OCORRÊNCIAS ==');
    res2.rows.forEach(r => console.log(`  "${r.supervisor}" -> ${r.total} ocorrência(s)`));

    // Check if Fabio exists in app_usuarios
    const res3 = await client.query(`
      SELECT id, username, role FROM public.app_usuarios WHERE username ILIKE '%fabio%' OR username ILIKE '%almeida%'
    `);
    console.log('\n== FABIO NO APP_USUARIOS ==');
    res3.rows.forEach(r => console.log(`  id=${r.id} username="${r.username}" role=${r.role}`));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
run();
