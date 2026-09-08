
const fs = require("fs");
let content = fs.readFileSync("src/components/Medicao.jsx", "utf8");

const modal = `{showKmModal && (
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

      `;
content = content.replace("{showGerenciarPostos && (", modal + "{showGerenciarPostos && (");
fs.writeFileSync("src/components/Medicao.jsx", content);

