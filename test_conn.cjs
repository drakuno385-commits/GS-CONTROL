const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres.nrppkksgtmtfodmefgim:GsControl2026!@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const sql = `SELECT 1;`;

  try {
    const res = await client.query(sql);
    console.log('Connected!');
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}
run();
