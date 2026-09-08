
import re

with open("src/components/Medicao.jsx", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace(
    "const [showPendentes, setShowPendentes] = useState(false);",
    "const [showPendentes, setShowPendentes] = useState(false);\n  const [editandoPosto, setEditandoPosto] = useState(null);"
)

idx = code.find("<Eye size={16} color=\"#3b82f6\" />")
if idx != -1:
    end_idx = code.find("</button>", idx) + 9
    btn = """
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditandoPosto(item); }}
                        style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", marginLeft: "8px" }}
                        title="Editar Posto"
                      >
                        <Edit2 size={16} color="#10b981" />
                      </button>"""
    code = code[:end_idx] + btn + code[end_idx:]

code = code.replace("Eye, AlertCircle", "Eye, AlertCircle, Edit2")

modal = """
      {/* MODAL EDITAR POSTO */}
      {editandoPosto && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{
            background: "#1e293b", width: "500px", borderRadius: "16px",
            border: "1px solid #334155", display: "flex", flexDirection: "column",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}>
            <div style={{ padding: "20px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "18px" }}>Editar Cadastro do Posto</h3>
              <button onClick={() => setEditandoPosto(null)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>NOME DO POSTO</label>
                <input 
                  type="text" 
                  value={editandoPosto.posto} 
                  onChange={e => setEditandoPosto({...editandoPosto, posto: e.target.value})}
                  style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#f8fafc" }}
                />
              </div>
              
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>PRODUTO/FUNÇÃO</label>
                  <input 
                    type="text" 
                    value={editandoPosto.produto} 
                    onChange={e => setEditandoPosto({...editandoPosto, produto: e.target.value})}
                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#f8fafc" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>ESCALA</label>
                  <input 
                    type="text" 
                    value={editandoPosto.escala} 
                    onChange={e => setEditandoPosto({...editandoPosto, escala: e.target.value})}
                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#f8fafc" }}
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <label style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>VALOR CONTRATUAL BASE (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editandoPosto.valor_mensal} 
                    onChange={e => setEditandoPosto({...editandoPosto, valor_mensal: float(e.target.value) if e.target.value else 0})}
                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", padding: "10px", color: "#f8fafc" }}
                  />
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <input 
                  type="checkbox" 
                  checked={editandoPosto.escala_fixa or False}
                  onChange={e => setEditandoPosto({...editandoPosto, escala_fixa: e.target.checked})}
                  style={{ width: "16px", height: "16px", accentColor: "#3b82f6" }}
                />
                <label style={{ color: "#e2e8f0", fontSize: "14px" }}>Escala Fixa (Não multiplicar pelos Dias do Mês)</label>
              </div>
            </div>
            
            <div style={{ padding: "20px", borderTop: "1px solid #334155", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button 
                onClick={() => setEditandoPosto(null)}
                style={{ background: "transparent", border: "1px solid #334155", color: "#f8fafc", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  const novosPostos = postosBase.map(p => {
                    if (p.id === editandoPosto.id || (p.codcli === editandoPosto.codcli && p.codpos === editandoPosto.codpos && p.turno === editandoPosto.turno)) {
                      return { ...p, ...editandoPosto, valor_dia: editandoPosto.valor_mensal / 30 };
                    }
                    return p;
                  });
                  if (editandoPosto._nao_cadastrado) {
                    novosPostos.push({
                      ...editandoPosto,
                      id: Date.now(),
                      _nao_cadastrado: false,
                      valor_dia: editandoPosto.valor_mensal / 30
                    });
                  }
                  setPostosBase(novosPostos);
                  setEditandoPosto(null);
                }}
                style={{ background: "#3b82f6", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
"""

# Replace `float(...) if ...` which is Python with standard JS parseFloat in the modal template
modal = modal.replace("float(e.target.value) if e.target.value else 0", "parseFloat(e.target.value) || 0")
modal = modal.replace("or False", "|| false")

code = code.replace("{/* MODAL LANÇAR KM */}", modal + "\n      {/* MODAL LANÇAR KM */}")

# Fix "Cenario Real" math
code = code.replace(
    "const valorTotalReal = diasTrabalhados * valorDia;\n      \n      // O contrato cheio sempre considera o posto inteiro pelo cadastro, independente da ficha\n      const isPresente = diasTrabalhados > 0;",
    """// Cenário Real: O valor é o contrato proporcional à ficha, porém se a ficha apontou presenças (isPresente), assumimos o contrato integral para não quebrar a matemática da escala 12x36 (onde 15 dias trabalhados = mês cheio).
      const isPresente = diasTrabalhados > 0;
      const valorTotalReal = isPresente ? (posto.escala_fixa ? valorMensal : (valorMensal / 30) * diasDoMes) : 0;"""
)

with open("src/components/Medicao.jsx", "w", encoding="utf-8") as f:
    f.write(code)

print("patched")

