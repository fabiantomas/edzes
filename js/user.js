// ════════════════════════════════════════════
//  FELHASZNÁLÓI PROFIL (userID)
// ════════════════════════════════════════════
// A user-réteg a terv-réteg fölött áll. Minden adat- és terv-kulcs user-prefixet
// kap, KIVÉVE az alap-usert (u0), amely a jelenlegi (csak terv-prefixes) kulcsokat
// használja — így a korábban rögzített adatok az alap-userhez tartoznak és
// érintetlenül megmaradnak. Másik userID-re váltva teljesen külön adathalmaz él.

const USERS_KEY = 'users';            // [{id, name}]
const CURRENT_USER_KEY = 'currentUser';
const BASE_USER_ID = 'u0';            // alap-user: nincs user-prefix

// ── User-lista ──
export function getUsers(){
  const raw = localStorage.getItem(USERS_KEY);
  if(raw){
    try{ const arr = JSON.parse(raw); if(Array.isArray(arr) && arr.length) return arr; }catch(e){}
  }
  const def = [{ id: BASE_USER_ID, name: 'Alap profil' }];
  localStorage.setItem(USERS_KEY, JSON.stringify(def));
  return def;
}
function saveUsers(users){
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUserId(){
  return localStorage.getItem(CURRENT_USER_KEY) || BASE_USER_ID;
}
export function setCurrentUserId(id){
  localStorage.setItem(CURRENT_USER_KEY, id);
}
export function getCurrentUserName(){
  const id = getCurrentUserId();
  const u = getUsers().find(u=>u.id===id);
  return u ? u.name : id;
}

// A userID maga az azonosító, amit a profil fülön le lehet olvasni / be lehet írni.
export function getCurrentUserDisplayId(){
  return getCurrentUserId();
}

// User-prefix az összes kulcshoz (alap-user: üres)
export function userPrefix(){
  const id = getCurrentUserId();
  return id === BASE_USER_ID ? '' : `${id}__`;   // dupla aláhúzás elválasztó
}

// ── Profil átnevezése (megjelenített név) ──
export function renameUser(id, name){
  const users = getUsers();
  const u = users.find(u=>u.id===id);
  if(u){ u.name = name || u.name; saveUsers(users); }
}

// ── Profil kiválasztása / létrehozása userID alapján ──
// Ha a megadott id már létezik → arra váltunk. Ha nem → új profil jön létre
// ezzel az id-vel, üres adathalmazzal.
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

// userID tisztítása: a kulcsokban használjuk, ezért nincs whitespace/elválasztó
function sanitizeId(raw){
  if(!raw) return '';
  return String(raw).trim().replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 40);
}

export function deleteUser(id){
  let users = getUsers();
  if(users.length <= 1) return false;
  if(id === BASE_USER_ID) return false;          // az alap-usert nem töröljük
  users = users.filter(u=>u.id!==id);
  saveUsers(users);
  removeUserData(id);
  if(getCurrentUserId() === id) setCurrentUserId(users[0].id);
  return true;
}

function removeUserData(id){
  if(id === BASE_USER_ID) return;
  const prefix = `${id}__`;
  const toRemove = [];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach(k=>localStorage.removeItem(k));
}

export { BASE_USER_ID, sanitizeId };
