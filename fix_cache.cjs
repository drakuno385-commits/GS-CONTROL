
const fs = require("fs");
let content = fs.readFileSync("src/components/Medicao.jsx", "utf8");

content = content.replace(/medicao_postos_db_v1/g, "medicao_postos_db_v2");
fs.writeFileSync("src/components/Medicao.jsx", content);
console.log("Bumped cache version to v2");

