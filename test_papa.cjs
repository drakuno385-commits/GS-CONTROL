const Papa = require('papaparse');
const csv = `re;nome;data;codocor;nomeocor;tipo;situacao;sithoje;codigo;area
33834;SILVIO CESAR LEITE;03/08/2026;4;FALTA;[S];FALTA;TRABALHO;1;OPERACIONAL
33834;SILVIO CESAR LEITE;30/07/2026;4;FALTA;[S];FALTA;TRABALHO;1;OPERACIONAL`;

Papa.parse(csv, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    const firstRowKeys = Object.keys(results.data[0]);
    const hasField = (keyStr) => firstRowKeys.some(k => k.toLowerCase().trim() === keyStr.toLowerCase());
    
    let sheetType = 'unknown';
    if (hasField('tot_dias') || hasField('nomehosp')) sheetType = 'atestados';
    else if (hasField('nomevigil')) sheetType = 'efetivos';
    else if (hasField('nomeocor') || hasField('codocor')) sheetType = 'disciplina';
    else if (hasField('sithoje')) sheetType = 'presencas';
    
    console.log('sheetType detected:', sheetType);
    
    const getField = (row, keyStr) => {
      const key = firstRowKeys.find(k => k.toLowerCase().trim() === keyStr.toLowerCase());
      return key ? row[key] : '';
    };

    const mapped = results.data.map(row => ({ 
      re: getField(row, 're'), nome: getField(row, 'nome'), data: getField(row, 'data'), codocor: getField(row, 'codocor'), nomeocor: getField(row, 'nomeocor'), tipo: getField(row, 'tipo'), area: getField(row, 'area') 
    }));
    
    console.log('mapped data:', mapped);
  }
});
