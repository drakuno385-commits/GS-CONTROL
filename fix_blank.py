import re

FILE_PATH = 'C:/Users/User/.gemini/antigravity/scratch/acoweb/src/components/Financeiro.jsx'

with open(FILE_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

hook_code = """
import { supabase } from '../supabaseClient';

function camelToSnake(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  const snakeObj = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = camelToSnake(obj[key]);
  }
  return snakeObj;
}

function snakeToCamel(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  const camelObj = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = snakeToCamel(obj[key]);
  }
  return camelObj;
}

function useSupabaseSync(tableName, initialData = []) {
  const [state, setState] = React.useState(initialData);
  const stateRef = React.useRef(state);
  
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const customSetState = (updater) => {
    let newState = typeof updater === 'function' ? updater(stateRef.current) : updater;
    setState(newState);
    
    const capturedOldState = stateRef.current;
    
    setTimeout(async () => {
      try {
        const oldMap = new Map(capturedOldState.map(i => [i.id, i]));
        const newMap = new Map(newState.map(i => [i.id, i]));
        
        const added = newState.filter(i => !oldMap.has(i.id));
        const removed = capturedOldState.filter(i => !newMap.has(i.id));
        const modified = newState.filter(i => {
           const old = oldMap.get(i.id);
           return old && JSON.stringify(old) !== JSON.stringify(i);
        });
        
        if (added.length > 0) {
          const { error } = await supabase.from(tableName).insert(camelToSnake(added));
          if (error) { console.error("Supabase insert error", tableName, error); alert("Erro Insert: " + error.message); }
        }
        for (let r of removed) {
          const { error } = await supabase.from(tableName).delete().eq('id', r.id);
          if (error) { console.error("Supabase delete error", tableName, error); alert("Erro Delete: " + error.message); }
        }
        for (let m of modified) {
          const { error } = await supabase.from(tableName).update(camelToSnake(m)).eq('id', m.id);
          if (error) { console.error("Supabase update error", tableName, error); alert("Erro Update: " + error.message); }
        }
      } catch (e) {
        console.error("Sync error", e);
      }
    }, 0);
  };

  const setFromSupabase = (updater) => {
    let newState = typeof updater === 'function' ? updater(stateRef.current) : updater;
    setState(newState);
  };

  return [state, customSetState, setFromSupabase];
}
"""

if "function useSupabaseSync" not in content:
    content = content.replace("import React, { useState, useMemo, useEffect } from 'react';", "import React, { useState, useMemo, useEffect, useRef } from 'react';\n" + hook_code)

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)
print("Proxy hook injected successfully!")
