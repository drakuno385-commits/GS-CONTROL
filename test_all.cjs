const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrppkksgtmtfodmefgim.supabase.co', 'sb_publishable_u67N88FRnfSCoTEDaJB3tw_3bWwwzCq');

async function testAll() {
  const t1 = await supabase.from('financeiro_despesas').select('*');
  const t2 = await supabase.from('financeiro_faturas').select('*');
  const t3 = await supabase.from('financeiro_bancos_saldos').select('*');
  console.log("Despesas:", t1.error);
  console.log("Faturas:", t2.error);
  console.log("Bancos:", t3.error);
}
testAll();
