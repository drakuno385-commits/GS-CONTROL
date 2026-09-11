function camelToSnake(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  const snakeObj = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = camelToSnake(obj[key]);
  }
  return snakeObj;
}

const newState = [{ id: 'b_1', nome: 'Itau', saldoInicial: 100 }];
const capturedOldState = [];
const oldMap = new Map(capturedOldState.map(i => [i.id, i]));
const added = newState.filter(i => !oldMap.has(i.id));

console.log("added:", added);
console.log("camelToSnake:", camelToSnake(added));
