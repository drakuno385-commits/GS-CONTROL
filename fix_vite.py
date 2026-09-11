import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/vite.config.js'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("workbox: {", "workbox: {\n        maximumFileSizeToCacheInBytes: 5000000,")

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated vite.config.js")
