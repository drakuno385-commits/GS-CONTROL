const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://postgres.nrppkksgtmtfodmefgim:GsControl2026!@aws-0-sa-east-1.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to DB!");
    
    // Check if there are future visits
    let res = await client.query("SELECT id, hora_chegada FROM public.visitas WHERE hora_chegada > now();");
    console.log(`Found ${res.rowCount} future visitas.`);

    if (res.rowCount > 0) {
      // Loop to fix all of them (subtract 3 hours until they are no longer in the future)
      let fixed = 0;
      for (let i = 0; i < 5; i++) {
        let updateRes = await client.query("UPDATE public.visitas SET hora_chegada = hora_chegada - interval '3 hours', hora_saida = hora_saida - interval '3 hours' WHERE hora_chegada > now();");
        fixed += updateRes.rowCount;
        if (updateRes.rowCount === 0) break;
      }
      console.log(`Updated a total of ${fixed} future visits iteratively.`);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
run();
