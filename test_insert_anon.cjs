const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrppkksgtmtfodmefgim.supabase.co', 'sb_publishable_u67N88FRnfSCoTEDaJB3tw_3bWwwzCq');

async function doInsert() {
  const payload = {
    id: `b_${Date.now()}`,
    nome: "BANCO DO BRASIL (TESTE)",
    empresa: "AÇOFORTE",
    agencia: "1234",
    conta: "5678-9",
    saldo_inicial: 500,
    saldo_atual: 500,
    cor: "#000000"
  };
  const { data, error } = await supabase.from('financeiro_bancos_saldos').insert([payload]);
  console.log("Insert API result:", data, "Error:", error);
}
doInsert();
