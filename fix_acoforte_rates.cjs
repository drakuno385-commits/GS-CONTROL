const fs = require('fs');

let code = fs.readFileSync('src/data/previaPostos.js', 'utf8');
const match = code.match(/export const defaultPreviaPostos = (\[[\s\S]*\]);?\s*$/);
let postos = JSON.parse(match[1]);

// Corrigir taxas da ACOFORTE para valores padronizados de contrato
// Diurno: R$ 15.446,61 | Noturno: R$ 17.576,27
// Alça Casa Verde Extra Diurno: R$ 11.551,68 (28 dias)

postos.forEach(p => {
  if (p.empresa === 'ACOFORTE') {
    if (p.posto.includes('ALÇA CASA VERDE')) {
      if (p.turno === 'DIURNO') {
        p.valor_mensal = 11551.68;
        p.valor_dia = 11551.68 / 28;
      } else {
        p.valor_mensal = 13029.75;
        p.valor_dia = 13029.75 / 30;
      }
    } else {
      if (p.turno === 'DIURNO') {
        p.valor_mensal = 15446.61;
        p.valor_dia = 15446.61 / 30;
      } else {
        p.valor_mensal = 17576.27;
        p.valor_dia = 17576.27 / 30;
      }
    }
  }
});

// Re-salvar previaPostos.js
const output = 'export const defaultPreviaPostos = ' + JSON.stringify(postos, null, 2) + ';\n';
fs.writeFileSync('src/data/previaPostos.js', output);
console.log('previaPostos.js atualizado com sucesso!');
