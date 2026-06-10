// ════════════════════════════════════════════
//  KÖVETETT TÁROLÁS (szinkronhoz)
// ════════════════════════════════════════════
// A szinkronizálandó kulcsok írását ezen keresztül végezzük. Minden írás:
//   - elmenti az értéket localStorage-ba,
//   - rögzít egy időbélyeget ({key}__ts) a last-write-wins döntéshez,
//   - "piszkosnak" jelöli a kulcsot (még nem szinkronizált változás).
// A törlés tombstone-ként működik (deleted flag), hogy szinkronban is törlődjön.

const TS_SUFFIX = '__ts';
const DIRTY_KEY = '__dirty';   // a piszkos kulcsok halmaza (JSON tömb)

function now(){ return Date.now(); }

function loadDirty(){
  try{ const a = JSON.parse(localStorage.getItem(DIRTY_KEY) || '[]'); return new Set(Array.isArray(a)?a:[]); }
  catch(e){ return new Set(); }
}
function saveDirty(set){
  localStorage.setItem(DIRTY_KEY, JSON.stringify([...set]));
}
export function markDirty(key){
  const d = loadDirty(); d.add(key); saveDirty(d);
}
export function clearDirty(keys){
  const d = loadDirty();
  keys.forEach(k=>d.delete(k));
  saveDirty(d);
}
export function getDirtyKeys(){ return [...loadDirty()]; }

export function tsKey(key){ return key + TS_SUFFIX; }
export function getTs(key){
  const v = localStorage.getItem(tsKey(key));
  return v !== null ? parseInt(v) : 0;
}
function setTs(key, ts){ localStorage.setItem(tsKey(key), String(ts)); }

// Követett írás (érték + időbélyeg + dirty)
export function trackedSet(key, value, ts){
  const t = ts || now();
  localStorage.setItem(key, value);
  setTs(key, t);
  markDirty(key);
}

// Követett törlés: az értéket eltávolítjuk, de tombstone-t hagyunk (ts + dirty),
// hogy a szerverre is felmenjen a törlés. A "deleted" állapotot az jelzi, hogy
// az érték nincs, de van időbélyeg.
export function trackedRemove(key, ts){
  const t = ts || now();
  localStorage.removeItem(key);
  setTs(key, t);
  markDirty(key);
}

// Szinkronból érkező érték alkalmazása (NEM jelöli piszkosnak)
export function applyRemote(key, value, ts){
  if(value === null || value === undefined){
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value);
  }
  setTs(key, ts);
}
