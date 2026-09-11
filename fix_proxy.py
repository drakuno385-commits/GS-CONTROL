import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const oldMap = new Map(stateRef.current.map(i => [i.id, i]));", "const capturedOldState = stateRef.current;\n        const oldMap = new Map(capturedOldState.map(i => [i.id, i]));")

# Wait, `stateRef.current` was already in the setTimeout. We need to move `capturedOldState` OUTSIDE the setTimeout!
content = content.replace("""
    // Async sync to Supabase
    setTimeout(async () => {
      try {
        const oldMap = new Map(stateRef.current.map(i => [i.id, i]));
""", """
    const capturedOldState = stateRef.current;
    // Async sync to Supabase
    setTimeout(async () => {
      try {
        const oldMap = new Map(capturedOldState.map(i => [i.id, i]));
""")

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Proxy hook fixed!")
