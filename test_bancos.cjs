const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrppkksgtmtfodmefgim.supabase.co', 'sb_publishable_u67N88FRnfSCoTEDaJB3tw_3bWwwzCq');

async function check() {
  const { data, error } = await supabase.from('financeiro_bancos_saldos').select('*');
  console.log("Bancos no Supabase:", data);
  if (error) console.log("Erro:", error);
}
check();
