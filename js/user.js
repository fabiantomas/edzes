// ════════════════════════════════════════════
//  FELHASZNÁLÓI PROFIL (userID)
// ════════════════════════════════════════════
// Minden eszköz az első indításkor egy generált, gyakorlatilag egyedi azonosítót
// kap (nem közös "u0"). Minden adat- és terv-kulcs user-prefixet visel
// (`{userID}__`), így több profil és később több felhasználó adatai is jól
// elkülöníthetők. Megjegyzés: az ID a böngésző localStorage-ához kötődik; ha azt
// törlik vagy más böngészőt használnak, új ID generálódik. Valódi, eszközök közti
// egyediséghez később felhős megoldás kell.

const USERS_KEY = 'users';            // [{id, name}]
const CURRENT_USER_KEY = 'currentUser';

// ── Egyedi ID generálása ──
function generateUserId(){
  // időbélyeg + véletlen, base36 — rövid, olvasható, ütközésmentes a gyakorlatban
  const rnd = (typeof crypto !== 'undefined' && crypto.getRandomValues)
    ? Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b=>b.toString(36)).join('')
    : Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36).slice(-4);
  return ('u_' + ts + rnd).replace(/[^a-z0-9_]/gi,'').slice(0, 16);
}

// ── User-lista ──
// Első hozzáférésnél létrehozza az eszköz egyedi profilját.
export function getUsers(){
  const raw = localStorage.getItem(USERS_KEY);
  if(raw){
    try{ const arr = JSON.parse(raw); if(Array.isArray(arr) && arr.length) return arr; }catch(e){}
  }
  const id = generateUserId();
  const def = [{ id, name: 'Profil' }];
  localStorage.setItem(USERS_KEY, JSON.stringify(def));
  localStorage.setItem(CURRENT_USER_KEY, id);
  return def;
}
function saveUsers(users){
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUserId(){
  let id = localStorage.getItem(CURRENT_USER_KEY);
  if(!id){
    // biztosítjuk, hogy létezzen profil (getUsers generál egyet, ha kell)
    const users = getUsers();
    id = localStorage.getItem(CURRENT_USER_KEY) || users[0].id;
    localStorage.setItem(CURRENT_USER_KEY, id);
  }
  return id;
}
export function setCurrentUserId(id){
  localStorage.setItem(CURRENT_USER_KEY, id);
}
export function getCurrentUserName(){
  const id = getCurrentUserId();
  const u = getUsers().find(u=>u.id===id);
  return u ? u.name : id;
}
export function getCurrentUserDisplayId(){
  return getCurrentUserId();
}

// Minden adatkulcs user-prefixe (mindig van prefix; nincs kivételezett user)
export function userPrefix(){
  return `${getCurrentUserId()}__`;
}

// ── Profil átnevezése (megjelenített név) ──
export function renameUser(id, name){
  const users = getUsers();
  const u = users.find(u=>u.id===id);
  if(u){ u.name = name || u.name; saveUsers(users); }
}

// ── Profil kiválasztása / létrehozása userID alapján ──
// Létező id → arra váltunk. Új id → új profil üres adatokkal.
export function selectOrCreateUser(rawId, name){
  const id = sanitizeId(rawId);
  if(!id) return null;
  const users = getUsers();
  let u = users.find(u=>u.id===id);
  if(!u){
    u = { id, name: name || id };
    users.push(u);
    saveUsers(users);
  } else if(name){
    u.name = name; saveUsers(users);
  }
  setCurrentUserId(id);
  return id;
}

// ── Új profil generált ID-vel ──
export function createUserWithGeneratedId(name){
  const id = generateUserId();
  const users = getUsers();
  users.push({ id, name: name || 'Új profil' });
  saveUsers(users);
  setCurrentUserId(id);
  return id;
}

function sanitizeId(raw){
  if(!raw) return '';
  return String(raw).trim().replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 40);
}

export function deleteUser(id){
  let users = getUsers();
  if(users.length <= 1) return false;          // az utolsó profilt nem töröljük
  users = users.filter(u=>u.id!==id);
  saveUsers(users);
  removeUserData(id);
  if(getCurrentUserId() === id) setCurrentUserId(users[0].id);
  return true;
}

function removeUserData(id){
  const prefix = `${id}__`;
  const toRemove = [];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach(k=>localStorage.removeItem(k));
}

export { sanitizeId };
