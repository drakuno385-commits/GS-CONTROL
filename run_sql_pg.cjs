const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres.nrppkksgtmtfodmefgim:GsControl2026!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';
  
  const client = new Client({
    connectionString,
  });

  await client.connect();

  try {
    const res1 = await client.query("UPDATE public.visitas SET hora_chegada = hora_chegada + interval '3 hours' WHERE hora_chegada IS NOT NULL;");
    const res2 = await client.query("UPDATE public.visitas SET hora_saida = hora_saida + interval '3 hours' WHERE hora_saida IS NOT NULL;");
    
    console.log('Update result chegada:', res1.rowCount);
    console.log('Update result saida:', res2.rowCount);
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}
run();
