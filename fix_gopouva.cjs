const fs = require('fs');
let code = fs.readFileSync('src/data/previaPostos.js', 'utf8');

// 1. ORTOGRAFIA - Corrigir nomes errados
const fixes = [
  ['JAÁGUARI', 'JAGUARI'],
  ['ÁGUARULHOS', 'GUARULHOS'],
  ['ÁGUARAU', 'GUARAÚ'],
  ['AÁGUAS', 'ÁGUAS'],
  ['NICA PRETA', 'ÁGUA PRETA'],
  ['CAPTACÃO', 'CAPTAÇÃO'],
  ['CAPTACAO', 'CAPTAÇÃO'],
  ['BONSUCESSÃO', 'BOM SUCESSO'],
  ['SÃOCORRO', 'SOCORRO'],
  ['PARAÁGUACU', 'PARAGUAÇU'],
  ['OPER EEA', 'OPER. EEA'],
  ['IBIÚNA PARURU', 'IBIÚNA / PARURU'],
];

fixes.forEach(([from, to]) => {
  const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const count = (code.match(regex) || []).length;
  if (count > 0) {
    code = code.replace(regex, to);
    console.log(`Corrigido: "${from}" → "${to}" (${count} ocorrências)`);
  }
});

// 2. SEPARAR GOPOUVA BELLS - Encontrar e dividir o registro
// O registro atual: codcli=221, codpos=51, DIURNO, valor_mensal=14825.03
// Precisa virar:
//   - codcli=221, codpos=51, DIURNO, 12x36, valor_mensal=9328.29 (Porteiro Diurno)
//   - codcli=221, codpos=51, DIURNO, 5x2, valor_mensal=5496.74, escala_fixa=true (Porteiro 5x2)

// Parse o JSON
const match = code.match(/export const defaultPreviaPostos = (\[[\s\S]*\]);?\s*$/);
if (!match) { console.error('Não encontrei o array!'); process.exit(1); }

let postos = JSON.parse(match[1]);
console.log(`\nTotal postos antes: ${postos.length}`);

// Encontrar o Gopouva BELLS
const gopIdx = postos.findIndex(p => p.codcli === 221 && p.codpos === 51 && p.turno === 'DIURNO');
if (gopIdx >= 0) {
  const gop = postos[gopIdx];
  console.log(`Encontrado Gopouva BELLS: id=${gop.id}, valor_mensal=${gop.valor_mensal}`);
  
  // Corrigir o existente para 12x36
  postos[gopIdx] = {
    ...gop,
    escala: '12x36',
    valor_mensal: 9328.29,
    valor_dia: 9328.29 / 30,
    escala_fixa: false
  };
  
  // Adicionar novo registro 5x2
  const novoId = Math.max(...postos.map(p => p.id)) + 1;
  postos.splice(gopIdx + 1, 0, {
    ...gop,
    id: novoId,
    escala: '5x2',
    produto: 'PORTEIRO',
    valor_mensal: 5496.74,
    valor_dia: 5496.74 / 30,
    escala_fixa: true
  });
  
  console.log(`Gopouva 12x36: R$ 9.328,29`);
  console.log(`Gopouva 5x2:   R$ 5.496,74 (NOVO, id=${novoId})`);
} else {
  console.log('Gopouva BELLS não encontrado!');
}

// Checar outros postos que podem ter o mesmo problema (valor = soma de 2 rates)
const combos5x2 = [
  { d12: 9328.29, d5x2: 5496.74, label: 'BELLS DI 12x36+5x2' },
  { d12: 10711.26, d5x2: 5496.74, label: 'BELLS NOT 12x36+5x2' },
];

postos.forEach(p => {
  combos5x2.forEach(c => {
    const soma = +(c.d12 + c.d5x2).toFixed(2);
    if (Math.abs(p.valor_mensal - soma) < 0.05 && p.codcli !== 221 && p.codpos !== 51) {
      console.log(`\n⚠️ Possível duplicidade: ${p.posto} (${p.empresa} ${p.turno}) = R$ ${p.valor_mensal} = ${c.label}`);
    }
  });
});

console.log(`\nTotal postos depois: ${postos.length}`);

// Regravar
const output = 'export const defaultPreviaPostos = ' + JSON.stringify(postos, null, 2) + ';\n';
fs.writeFileSync('src/data/previaPostos.js', output);
console.log('\nArquivo salvo!');
