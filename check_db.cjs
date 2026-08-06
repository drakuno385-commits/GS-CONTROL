const { Client } = require('pg');
async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.nrppkksgtmtfodmefgim:GsControl2026!@aws-0-sa-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const res = await client.query(`SELECT count(*) FROM disciplina;`);
  console.log('Count of disciplina:', res.rows[0].count);
  
  const res2 = await client.query(`SELECT * FROM disciplina LIMIT 1;`);
  console.log('Sample row:', res2.rows[0]);
  
  await client.end();
}
run();
