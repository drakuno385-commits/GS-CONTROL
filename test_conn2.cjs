const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres:GsControl2026!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?options=project%3Dnrppkksgtmtfodmefgim';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected!');
  await client.end();
}
run();
