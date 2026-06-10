// ════════════════════════════════════════════
//  EDZÉSTERVEK
// ════════════════════════════════════════════
// Több edzésterv kezelése. Minden terv saját struktúrával (napok + gyakorlatok)
// és saját adatokkal rendelkezik. Az adatkulcsok terv-prefixet kapnak, KIVÉVE
// az alap-tervet (p0), amely a régi, prefix nélküli kulcsokat használja — így a
// korábban rögzített adatok érintetlenül megmaradnak.

import { DEFAULT_STRUCTURE, DEFAULT_SETS } from './data.js';
import { state } from './state.js';
import { userPrefix } from './user.js';
import { trackedSet } from './synced-store.js';

const BASE_PLAN_ID = 'p0';            // alap-terv: nincs terv-prefix
function plansKey(){ return `${userPrefix()}plans`; }
function currentPlanKey(){ return `${userPrefix()}currentPlan`; }

// ── Terv-lista ──
export function getPlans(){
  const raw = localStorage.getItem(plansKey());
  if(raw){
    try{ const arr = JSON.parse(raw); if(Array.isArray(arr) && arr.length) return arr; }catch(e){}
  }
  // alapértelmezett: egyetlen alap-terv
  const def = [{ id: BASE_PLAN_ID, name: 'Alap terv' }];
  trackedSet(plansKey(), JSON.stringify(def));
  return def;
}
function savePlans(plans){
  trackedSet(plansKey(), JSON.stringify(plans));
}

export function getCurrentPlanId(){
  return localStorage.getItem(currentPlanKey()) || BASE_PLAN_ID;
}
export function setCurrentPlanId(id){
  localStorage.setItem(currentPlanKey(), id);
}
export function getCurrentPlanName(){
  const id = getCurrentPlanId();
  const p = getPlans().find(p=>p.id===id);
  return p ? p.name : 'Terv';
}

// Adatkulcs-prefix az aktuális tervhez (alap-terv: üres → régi kulcsok)
export function planPrefix(){
  const id = getCurrentPlanId();
  const planPart = id === BASE_PLAN_ID ? '' : `${id}_`;
  return userPrefix() + planPart;
}

// ── Új terv ──
export function createPlan(name){
  const plans = getPlans();
  const id = 'p' + Date.now().toString(36);
  plans.push({ id, name: name || 'Új terv' });
  savePlans(plans);
  // üres struktúra az új tervhez
  saveStructureFor(id, []);
  return id;
}

export function renamePlan(id, name){
  const plans = getPlans();
  const p = plans.find(p=>p.id===id);
  if(p){ p.name = name || p.name; savePlans(plans); }
}

export function deletePlan(id){
  let plans = getPlans();
  if(plans.length <= 1) return false;          // az utolsó tervet nem töröljük
  plans = plans.filter(p=>p.id!==id);
  savePlans(plans);
  // a terv struktúrája és adatai
  removePlanData(id);
  if(getCurrentPlanId() === id){
    setCurrentPlanId(plans[0].id);
  }
  return true;
}

function removePlanData(id){
  if(id === BASE_PLAN_ID) return;     // az alap-terv adatait sosem töröljük tömegesen
  const prefix = `${userPrefix()}${id}_`;
  const toRemove = [];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach(k=>localStorage.removeItem(k));
}

// ── STRUKTÚRA (napok + gyakorlatok) ──
// Terv-specifikus, localStorage-ban tárolva JSON-ként.
function structKey(id){ return id === BASE_PLAN_ID ? `${userPrefix()}struct` : `${userPrefix()}${id}_struct`; }

function loadStructure(id){
  const raw = localStorage.getItem(structKey(id));
  if(raw){
    try{ const arr = JSON.parse(raw); if(Array.isArray(arr)) return arr; }catch(e){}
  }
  // ha nincs mentve: az alap-terv a DEFAULT_STRUCTURE-t kapja, új tervek üreset
  if(id === BASE_PLAN_ID){
    return DEFAULT_STRUCTURE.map(d=>({
      name:d.name, sub:d.sub,
      exercises:d.exercises.map(e=>({name:e.name, sets:e.sets}))
    }));
  }
  return [];
}
function saveStructureFor(id, struct){
  trackedSet(structKey(id), JSON.stringify(struct));
}

// Az aktuális terv struktúrája (élő olvasás)
export function getStructure(){
  return loadStructure(getCurrentPlanId());
}
// A "DAYS" megfelelője: az aktuális terv napjai/gyakorlatai (élő).
export function getDays(){
  return getStructure();
}
export function saveStructure(struct){
  saveStructureFor(getCurrentPlanId(), struct);
}

// ── Struktúra szerkesztő műveletek ──
export function addDay(name, sub){
  const s = getStructure();
  s.push({ name: name || `Nap ${s.length+1}`, sub: sub || '', exercises: [] });
  saveStructure(s);
}
export function deleteDay(di){
  const s = getStructure();
  if(di<0 || di>=s.length) return;
  s.splice(di,1);
  saveStructure(s);
}
export function addExercise(di, name){
  const s = getStructure();
  if(!s[di]) return;
  s[di].exercises.push({ name: name || 'Új gyakorlat', sets: DEFAULT_SETS });
  saveStructure(s);
}
export function deleteExercise(di, ei){
  const s = getStructure();
  if(!s[di] || !s[di].exercises[ei]) return;
  s[di].exercises.splice(ei,1);
  saveStructure(s);
}
export function moveExercise(di, ei, dir){
  const s = getStructure();
  if(!s[di]) return;
  const arr = s[di].exercises;
  const ni = ei + dir;
  if(ni<0 || ni>=arr.length) return;
  [arr[ei], arr[ni]] = [arr[ni], arr[ei]];
  saveStructure(s);
}
export function moveDay(di, dir){
  const s = getStructure();
  const ni = di + dir;
  if(ni<0 || ni>=s.length) return;
  [s[di], s[ni]] = [s[ni], s[di]];
  saveStructure(s);
}

export { BASE_PLAN_ID };
