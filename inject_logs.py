import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'
with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const oldMap = new Map(capturedOldState.map(i => [i.id, i]));", 'console.log("SYNC START", tableName, "Old:", capturedOldState, "New:", newState);\n        const oldMap = new Map(capturedOldState.map(i => [i.id, i]));')
content = content.replace("if (added.length > 0) {", 'console.log("ADDED:", added);\n        if (added.length > 0) {')

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Logs injected")
