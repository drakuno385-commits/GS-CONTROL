import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Login.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

old_bg = "background: 'linear-gradient(135deg, #0b1120 0%, #1e3a8a 100%)',"
new_bg = "backgroundImage: 'url(\"https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop\")', backgroundSize: 'cover', backgroundPosition: 'center',"

content = content.replace(old_bg, new_bg)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated background image.")
