import localforage from 'localforage';
import { supabase } from '../supabaseClient';

const DB_QUEUE = 'offline_visitas_queue';

localforage.config({
  name: 'GS_CONTROL',
  storeName: 'sync_store',
  description: 'Armazena visitas e fotos offline'
});

export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

export const base64ToFile = (base64String, fileName) => {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
};

export const saveVisitOffline = async (visitaData) => {
  try {
    const queue = await localforage.getItem(DB_QUEUE) || [];
    const id = Date.now().toString();
    const item = { id, ...visitaData, savedAt: new Date().toISOString() };
    queue.push(item);
    await localforage.setItem(DB_QUEUE, queue);
    return true;
  } catch (error) {
    console.error('Erro ao salvar visita offline:', error);
    return false;
  }
};

export const getPendingVisits = async () => {
  try {
    const queue = await localforage.getItem(DB_QUEUE) || [];
    return queue;
  } catch (error) {
    console.error('Erro ao ler fila offline:', error);
    return [];
  }
};

export const syncAll = async (onProgress = () => {}) => {
  if (!navigator.onLine) {
    throw new Error('Sem conexão com a internet para sincronizar.');
  }

  const queue = await getPendingVisits();
  if (queue.length === 0) return 0;

  let successCount = 0;
  const newQueue = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    onProgress(`Sincronizando ${i + 1} de ${queue.length}...`);

    try {
      let fotoUrlJoined = '';
      if (item.fotos && item.fotos.length > 0) {
        const uploadPromises = item.fotos.map(async (fotoB64) => {
          const file = base64ToFile(fotoB64.data, fotoB64.name);
          const { error: uploadError } = await supabase.storage.from('fotos_visitas').upload(fotoB64.name, file);
          if (uploadError && !uploadError.message.includes('already exists')) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('fotos_visitas').getPublicUrl(fotoB64.name);
          return publicUrlData.publicUrl;
        });
        const urls = await Promise.all(uploadPromises);
        fotoUrlJoined = urls.join(',');
      }

      let finalChecklistData = {};
      for (const [key, data] of Object.entries(item.checklist)) {
        let cFotoUrl = null;
        if (data.fotoB64) {
          const file = base64ToFile(data.fotoB64.data, data.fotoB64.name);
          const { error: uploadError } = await supabase.storage.from('fotos_visitas').upload(data.fotoB64.name, file);
          if (uploadError && !uploadError.message.includes('already exists')) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('fotos_visitas').getPublicUrl(data.fotoB64.name);
          cFotoUrl = publicUrlData.publicUrl;
        }
        finalChecklistData[key] = {
          status: data.status,
          observacao: data.observacao || '',
          foto: cFotoUrl
        };
      }

      const { data: insertedVisita, error: insertError } = await supabase
        .from('visitas')
        .insert([{
          user_id: item.currentUser.id,
          nome_supervisor: item.currentUser.username,
          codcli: item.activeVisit.codcli,
          nomecli: item.activeVisit.nomecli,
          codpos: item.activeVisit.codpos,
          nomepos: item.activeVisit.nomepos,
          hora_chegada: item.activeVisit.horaChegada,
          hora_saida: item.horaSaida,
          foto_url: fotoUrlJoined,
          checklist: finalChecklistData
        }])
        .select();

      if (insertError) throw insertError;
      const novaVisitaId = insertedVisita[0].id;

      const ocorrenciasInsertData = [];
      const labels = { cnv: 'CNV', cracha: 'Crachá', livro: 'Livro de Ocorrência', equipamentos: 'Equipamentos', apresentacao: 'Apresentação Pessoal' };
      for (const [key, data] of Object.entries(finalChecklistData)) {
        if (data.status === 'Inconforme') {
          ocorrenciasInsertData.push({
            visita_id: novaVisitaId,
            supervisor: item.currentUser.username,
            cliente: item.activeVisit.nomecli,
            posto: item.activeVisit.nomepos,
            item_checklist: labels[key],
            observacao: data.observacao,
            foto_url: data.foto,
            status: 'Aberto'
          });
        }
      }

      if (ocorrenciasInsertData.length > 0) {
        await supabase.from('ocorrencias_visitas').insert(ocorrenciasInsertData);
      }

      successCount++;
    } catch (err) {
      console.error('Erro ao sincronizar item', item.id, err);
      newQueue.push(item);
    }
  }

  await localforage.setItem(DB_QUEUE, newQueue);
  return successCount;
};
