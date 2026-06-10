// ════════════════════════════════════════════
//  SZINKRONIZÁCIÓ (Supabase, last-write-wins mezőnként)
// ════════════════════════════════════════════
// Stratégia:
//   - PULL: lehúzzuk az aktuális userID összes sorát a szerverről.
//   - MERGE: kulcsonként a frissebb időbélyeg nyer (helyi vs. távoli).
//       * ha a távoli frissebb → alkalmazzuk helyben (applyRemote)
//       * ha a helyi frissebb vagy piszkos → feltöltjük (push)
//   - PUSH: a helyben frissebb / piszkos kulcsokat felküldjük (upsert).
// Offline: ha nincs net, csendben kihagyjuk; a piszkos kulcsok megmaradnak a
// következő sikeres szinkronig.

import { SUPABASE_URL, SUPABASE_ANON_KEY, SYNC_TABLE, NO_SYNC_KEYS } from './sync-config.js';
import { getCurrentUserId } from './user.js';
import {
  getDirtyKeys, clearDirty, getTs, applyRemote, tsKey,
} from './synced-store.js';

const REST = `${SUPABASE_URL}/rest/v1/${SYNC_TABLE}`;
const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

let syncing = false;

// A szinkronizálandó kulcs-e? (kihagyjuk a belső/UI kulcsokat és a meta-kulcsokat)
function isSyncableKey(key){
  if(!key) return false;
  if(key.startsWith('__')) return false;          // __dirty
  if(key.endsWith('__ts')) return false;          // időbélyegek
  if(NO_SYNC_KEYS.includes(key)) return false;
  return true;
}

// A jelenlegi userhez tartozó kulcs-e? (a kulcs prefixe a userID)
function belongsToUser(key, uid){
  // user-prefix formátum: `${uid}__...`  (lásd user.js userPrefix)
  return key.startsWith(uid + '__');
}

// Az összes helyi, szinkronizálható kulcs az aktuális userhez
function localSyncableKeys(uid){
  const out = [];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(isSyncableKey(k) && belongsToUser(k, uid)) out.push(k);
  }
  return out;
}

async function pull(uid){
  const url = `${REST}?user_id=eq.${encodeURIComponent(uid)}&select=key,value,updated_at,deleted`;
  const res = await fetch(url, { headers: HEADERS });
  if(!res.ok) throw new Error('pull hiba: ' + res.status);
  return await res.json(); // [{key, value, updated_at, deleted}]
}

async function push(rows){
  if(rows.length === 0) return;
  // upsert: a (user_id,key) primary key-re ütközéskor frissít
  const url = `${REST}?on_conflict=user_id,key`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if(!res.ok){
    const t = await res.text();
    throw new Error('push hiba: ' + res.status + ' ' + t);
  }
}

// Egy teljes szinkron-kör. Visszatér: {ok, changed} — changed=true ha helyi
// adat módosult (ekkor a hívó újrarajzol).
export async function syncNow(){
  if(syncing) return { ok:false, changed:false, reason:'folyamatban' };
  syncing = true;
  let changed = false;
  try{
    const uid = getCurrentUserId();

    // 1) PULL
    const remoteRows = await pull(uid);
    const remoteMap = new Map();
    remoteRows.forEach(r=> remoteMap.set(r.key, r));

    // 2) MERGE — távoli → helyi, ahol a távoli frissebb
    remoteMap.forEach((r, key)=>{
      if(!isSyncableKey(key)) return;
      const localTs = getTs(key);
      const remoteTs = Number(r.updated_at) || 0;
      if(remoteTs > localTs){
        // a távoli frissebb: alkalmazzuk (törlés vagy érték)
        applyRemote(key, r.deleted ? null : r.value, remoteTs);
        changed = true;
      }
    });

    // 3) PUSH — a helyben frissebb / piszkos / szerveren nem létező kulcsok
    const uploads = [];
    const pushedKeys = [];
    const localKeys = new Set(localSyncableKeys(uid));
    // a dirty kulcsok közül a userhez tartozók
    const dirty = getDirtyKeys().filter(k=> isSyncableKey(k) && belongsToUser(k, uid));

    // jelöltek: minden helyi kulcs + minden dirty (a dirty tartalmazhat törölt kulcsot is)
    const candidates = new Set([...localKeys, ...dirty]);

    candidates.forEach(key=>{
      const localTs = getTs(key);
      const remote = remoteMap.get(key);
      const remoteTs = remote ? (Number(remote.updated_at)||0) : -1;
      const localVal = localStorage.getItem(key); // null ha törölt
      const isDeleted = localVal === null;

      // feltöltjük, ha a helyi frissebb, vagy szerveren még nincs
      if(localTs > remoteTs || !remote){
        // ha nincs helyi érték ÉS nincs időbélyeg, nincs mit feltölteni
        if(localTs === 0 && isDeleted) return;
        uploads.push({
          user_id: uid,
          key,
          value: isDeleted ? null : localVal,
          updated_at: localTs || Date.now(),
          deleted: isDeleted,
        });
        pushedKeys.push(key);
      }
    });

    await push(uploads);
    clearDirty(pushedKeys);

    localStorage.setItem('lastSyncAt', String(Date.now()));
    return { ok:true, changed };
  }catch(e){
    // offline vagy hiba: csendben kihagyjuk
    return { ok:false, changed:false, reason: e.message };
  }finally{
    syncing = false;
  }
}

// Van-e elérhető hálózat (gyors heurisztika)
export function isOnline(){
  return (typeof navigator === 'undefined') ? true : navigator.onLine !== false;
}
