const { createClient } = require('@supabase/supabase-js');
const Papa = require('papaparse');
const fs = require('fs');

const supabase = createClient('https://nrppkksgtmtfodmefgim.supabase.co', 'sb_publishable_u67N88FRnfSCoTEDaJB3tw_3bWwwzCq');

const csv = `re;nome;data;codocor;nomeocor;tipo;situacao;sithoje;codigo;area
33834;SILVIO CESAR LEITE;03/08/2026;4;FALTA;[S];FALTA;TRABALHO;1;OPERACIONAL
33834;SILVIO CESAR LEITE;30/07/2026;4;FALTA;[S];FALTA;TRABALHO;1;OPERACIONAL`;

Papa.parse(csv, {
  header: true,
  skipEmptyLines: true,
  complete: async (results) => {
    const firstRowKeys = Object.keys(results.data[0]);
    const getField = (row, keyStr) => {
      const key = firstRowKeys.find(k => k.toLowerCase().trim() === keyStr.toLowerCase());
      return key ? row[key] : '';
    };

    const batch = results.data.map(row => ({ 
      re: getField(row, 're'), nome: getField(row, 'nome'), data: getField(row, 'data'), codocor: getField(row, 'codocor'), nomeocor: getField(row, 'nomeocor'), tipo: getField(row, 'tipo'), area: getField(row, 'area') 
    }));
    
    console.log('Inserting:', batch);
    
    // We are testing with anon key!
    const { data, error } = await supabase.from('disciplina').insert(batch).select();
    console.log('Result:', data);
    console.log('Error:', error);
  }
});
