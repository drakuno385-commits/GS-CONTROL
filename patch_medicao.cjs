
const fs = require("fs");
let content = fs.readFileSync("src/components/Medicao.jsx", "utf8");

// 1. State
content = content.replace("  const [isNovoPosto, setIsNovoPosto] = useState(false);", `  const [isNovoPosto, setIsNovoPosto] = useState(false);

  // KMs
  const [kmsData, setKmsData] = useState(() => {
    const saved = localStorage.getItem("medicao_kms_v1");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {};
  });
  const [showKmModal, setShowKmModal] = useState(false);
  const [kmForm, setKmForm] = useState({ key: "", km: "", valor_km: "" });

  useEffect(() => {
    localStorage.setItem("medicao_kms_v1", JSON.stringify(kmsData));
  }, [kmsData]);`);

// 2. Head of map
content = content.replace(`    // 3. Agrupar presenças por codcli + codpos + turno
    const mapaPresencas = new Map();
    presTrabalhadas.forEach(p => {`, `    // 3. Agrupar presenças por codcli + codpos + turno
    const mapaPresencas = new Map();
    const clientesNaFicha = new Set();
    presTrabalhadas.forEach(p => {
      clientesNaFicha.add(parseInt(p.codcli, 10) || 0);`);

// 3. Loop return map
const oldMap = `      const diferenca = valorTotalReal - valorMensal;

      return {
        ...posto,
        dias_trabalhados: diasExibicao,
        dias_trabalhados_reais: diasTrabalhados,
        total_colaboradores: presInfo.colaboradores.size,
        valor_total: valorTotal, // Valor que será exibido e totalizado
        valor_total_real: valorTotalReal, // O valor executado independentemente do tipo de cobrança
        diferenca_mensal: diferenca,
        detalhes: presInfo.detalhes
      };`;
const newMap = `      const diferenca = valorTotalReal - valorMensal;

      const kmInfo = kmsData[key] || { km: 0, valor_km: 0 };
      const totalKm = (Number(kmInfo.km) || 0) * (Number(kmInfo.valor_km) || 0);
      
      let status_divergencia = "OK";
      if (diasTrabalhados === 0 && clientesNaFicha.has(Number(posto.codcli))) {
          status_divergencia = "FALTA_NA_FICHA";
      }

      return {
        ...posto,
        dias_trabalhados: diasExibicao,
        dias_trabalhados_reais: diasTrabalhados,
        total_colaboradores: presInfo.colaboradores.size,
        valor_total: valorTotal + totalKm,
        valor_total_real: valorTotalReal + totalKm,
        diferenca_mensal: diferenca,
        detalhes: presInfo.detalhes,
        km_info: kmInfo,
        total_km: totalKm,
        status_divergencia
      };`;
content = content.replace(oldMap, newMap);

// 4. Unmapped logic
const unmapOld = `          total_colaboradores: presInfo.colaboradores.size,
          valor_total: 0,
          diferenca_mensal: 0,
          detalhes: presInfo.detalhes,
          _nao_cadastrado: true  // Flag para identificar visualmente
        });`;
const unmapNew = `          total_colaboradores: presInfo.colaboradores.size,
          valor_total: 0,
          diferenca_mensal: 0,
          detalhes: presInfo.detalhes,
          _nao_cadastrado: true,
          status_divergencia: "NAO_CADASTRADO"
        });`;
content = content.replace(unmapOld, unmapNew);

// 5. Button
const btnOld = `            <button 
              onClick={() => setShowGerenciarPostos(true)}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "500", fontSize: "14px" }}
            >
              <Settings size={18} />
              Gerenciar Postos
            </button>`;
const btnNew = `            <button 
              onClick={() => setShowKmModal(true)}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #334155", background: "#3b82f6", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "500", fontSize: "14px" }}
            >
              <Settings size={18} /> Lançar KM
            </button>
            <button 
              onClick={() => setShowGerenciarPostos(true)}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "500", fontSize: "14px" }}
            >
              <Settings size={18} />
              Gerenciar Postos
            </button>`;
content = content.replace(btnOld, btnNew);

// 6. TH headers
const thOld = `                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#94a3b8", borderBottom: "1px solid #334155" }}>DIAS</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#94a3b8", borderBottom: "1px solid #334155" }}>VALOR MENSAL BASE</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#94a3b8", borderBottom: "1px solid #334155" }}>TOTAL MEDIÇÃO</th>`;
const thNew = `                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#94a3b8", borderBottom: "1px solid #334155" }}>DIAS</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#94a3b8", borderBottom: "1px solid #334155" }}>STATUS DA FICHA</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#94a3b8", borderBottom: "1px solid #334155" }}>VALOR BASE</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#94a3b8", borderBottom: "1px solid #334155" }}>KM EXTRA</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#94a3b8", borderBottom: "1px solid #334155" }}>TOTAL MEDIÇÃO</th>`;
content = content.replace(thOld, thNew);

// 7. TD Body
const tdOld = `                    <td style={{ padding: "12px 16px", fontSize: "14px", color: "#f8fafc" }}>
                      {item.dias_trabalhados}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", color: "#f8fafc", fontWeight: "500" }}>
                      {formatCurrency(item.valor_mensal)}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", color: "#10b981", fontWeight: "700" }}>
                      {formatCurrency(item.valor_total)}
                    </td>`;
const tdNew = `                    <td style={{ padding: "12px 16px", fontSize: "14px", color: "#f8fafc" }}>
                      {item.dias_trabalhados}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px" }}>
                      {item.status_divergencia === "FALTA_NA_FICHA" && (
                        <span style={{ background: "#ef444420", color: "#ef4444", padding: "4px 8px", borderRadius: "4px", fontWeight: 600 }}>FALTA NA FICHA</span>
                      )}
                      {item.status_divergencia === "NAO_CADASTRADO" && (
                        <span style={{ background: "#eab30820", color: "#eab308", padding: "4px 8px", borderRadius: "4px", fontWeight: 600 }}>NÃO CADASTRADO</span>
                      )}
                      {item.status_divergencia === "OK" && (
                        <span style={{ background: "#10b98120", color: "#10b981", padding: "4px 8px", borderRadius: "4px", fontWeight: 600 }}>OK</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", color: "#f8fafc", fontWeight: "500" }}>
                      {formatCurrency(item.valor_mensal)}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", color: "#f8fafc", fontWeight: "500" }}>
                      {item.total_km > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ color: "#60a5fa" }}>{formatCurrency(item.total_km)}</span>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{item.km_info?.km}km x {formatCurrency(item.km_info?.valor_km)}</span>
                        </div>
                      ) : "-"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", color: "#10b981", fontWeight: "700" }}>
                      {formatCurrency(item.valor_total)}
                    </td>`;
content = content.replace(tdOld, tdNew);

// 8. Modal UI
const modalOld = `      {showGerenciarPostos && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>`;
const modalNew = `      {showKmModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "450px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", color: "#f8fafc", margin: 0 }}>Lançar KM Rodado</h2>
              <button onClick={() => setShowKmModal(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={20} /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>Selecionar Posto (Base)</label>
                <select
                  value={kmForm.key}
                  onChange={(e) => setKmForm({ ...kmForm, key: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f8fafc" }}
                >
                  <option value="">-- Selecione um posto --</option>
                  {postosBase.map(p => (
                    <option key={\`\${p.codcli}_\${p.codpos}_\${p.turno}\`} value={\`\${p.codcli}_\${p.codpos}_\${p.turno}\`}>
                      [{p.codcli}] {p.posto} - {p.turno}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>KM Rodado (Quantidade)</label>
                <input
                  type="number" step="0.01"
                  value={kmForm.km}
                  onChange={(e) => setKmForm({ ...kmForm, km: e.target.value })}
                  placeholder="Ex: 2311.5"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f8fafc" }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", marginBottom: "4px" }}>Valor por KM (R$)</label>
                <input
                  type="number" step="0.001"
                  value={kmForm.valor_km}
                  onChange={(e) => setKmForm({ ...kmForm, valor_km: e.target.value })}
                  placeholder="Ex: 0.81"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f8fafc" }}
                />
              </div>

              <button
                onClick={() => {
                  if (!kmForm.key) return alert("Selecione um posto");
                  setKmsData({
                    ...kmsData,
                    [kmForm.key]: {
                      km: Number(kmForm.km) || 0,
                      valor_km: Number(kmForm.valor_km) || 0
                    }
                  });
                  setShowKmModal(false);
                  setKmForm({ key: "", km: "", valor_km: "" });
                }}
                style={{ width: "100%", padding: "12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "8px" }}
              >
                Adicionar KM
              </button>
            </div>
          </div>
        </div>
      )}

      {showGerenciarPostos && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>`;
content = content.replace(modalOld, modalNew);

fs.writeFileSync("src/components/Medicao.jsx", content);
console.log("Patched correctly.");

