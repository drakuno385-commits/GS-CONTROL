const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres:GsControl2026!@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?options=project%3Dnrppkksgtmtfodmefgim';
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const sql = `
    ALTER TABLE public.financeiro_bancos_saldos ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE TEXT USING id::TEXT;
    ALTER TABLE public.financeiro_despesas ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE TEXT USING id::TEXT;
    ALTER TABLE public.financeiro_entradas ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE TEXT USING id::TEXT;
    ALTER TABLE public.financeiro_historico_bancario ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE TEXT USING id::TEXT;
    ALTER TABLE public.financeiro_faturas ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE TEXT USING id::TEXT;
    ALTER TABLE public.financeiro_auditoria ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE TEXT USING id::TEXT;

    ALTER TABLE public.financeiro_entradas ALTER COLUMN banco_id TYPE TEXT USING banco_id::TEXT;
    ALTER TABLE public.financeiro_historico_bancario ALTER COLUMN banco_id TYPE TEXT USING banco_id::TEXT;
    ALTER TABLE public.financeiro_faturas ALTER COLUMN banco_previsto_id TYPE TEXT USING banco_previsto_id::TEXT;
    ALTER TABLE public.financeiro_faturas ALTER COLUMN banco_recebimento_id TYPE TEXT USING banco_recebimento_id::TEXT;
  `;

  try {
    const res = await client.query(sql);
    console.log('Altered columns to TEXT successfully.');
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}
run();
