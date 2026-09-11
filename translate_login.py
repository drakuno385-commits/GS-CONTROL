import re
FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Login.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('>Username<', '>Usuário<')
content = content.replace('placeholder="Your Email"', 'placeholder="Seu e-mail"')
content = content.replace('>Password<', '>Senha<')
content = content.replace('>Forgot Password?<', '>Esqueceu a senha?<')
content = content.replace('>Sign Up Now<', '>Cadastre-se agora<')

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("Text translated to Portuguese.")
