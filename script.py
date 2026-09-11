import re

with open('src/components/Financeiro.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Supabase import
if 'import { supabase }' not in content:
    content = content.replace("import React, { useState, useEffect, useMemo, useRef } from 'react';", "import React, { useState, useEffect, useMemo, useRef } from 'react';\nimport { supabase } from '../supabaseClient';")

# We will write the new file back
with open('src/components/Financeiro.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Supabase imported.')
