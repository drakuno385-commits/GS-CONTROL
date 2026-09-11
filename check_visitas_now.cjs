const { Client } = require('pg');

const connectionString = 'postgresql://postgres.nrppkksgtmtfodmefgim:GsControl2026!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('=== DIAGNÓSTICO VIA POSTGRES DIRETO ===\n');

    // Contar visitas
    const countRes = await client.query('SELECT COUNT(*) FROM public.visitas');
    console.log('Total visitas:', countRes.rows[0].count);

    // Ver últimas 5
    const lastRes = await client.query(`
      SELECT id, created_at, nome_supervisor, nomecli, nomepos
      FROM public.visitas
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log('Últimas visitas:', lastRes.rowCount);
    lastRes.rows.forEach(r => console.log(' -', r.created_at, r.nome_supervisor, r.nomecli));

    // Verificar pg_stat_user_tables para ver quando foi a última modificação
    const statsRes = await client.query(`
      SELECT relname, n_live_tup, n_dead_tup, last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
      FROM pg_stat_user_tables
      WHERE relname IN ('visitas', 'ocorrencias_visitas')
    `);
    console.log('\nEstatísticas das tabelas:');
    statsRes.rows.forEach(r => console.log(JSON.stringify(r)));

    // Verificar se há logs de auditoria
    const auditRes = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    console.log('\nTabelas disponíveis no schema public:');
    auditRes.rows.forEach(r => console.log(' -', r.tablename));

  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
