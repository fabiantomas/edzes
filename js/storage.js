// ════════════════════════════════════════════
//  TÁROLÁS (localStorage) ÉS SZÁRMAZTATOTT ÉRTÉKEK
// ════════════════════════════════════════════
// Minden adatkulcs az aktuális terv prefixét kapja (planPrefix). Az alap-terv
// prefixe üres, így a korábban rögzített adatok változatlan kulcson maradnak.

import { BASE_HISTORY, MAX_WEEKS } from './data.js';
import { state } from './state.js';
import { getDays, planPrefix, getCurrentPlanId, BASE_PLAN_ID } from './plans.js';
import { trackedSet, trackedRemove } from './synced-store.js';

// ── Kulcsképzés (terv-prefixszel) ──
function wKey(d,e,s,f){ return `${d}_${e}_${s}_${f}`; }
function lsKey(w,d,e,s,f){ return `${planPrefix()}w${w}_d${d}_e${e}_s${s}_${f}`; }

// ── Munkaértékek (mentés előtti, memóriában) ──
export function getWorking(d,e,s,f){
  const k = wKey(d,e,s,f);
  return (k in state.workingVals) ? state.workingVals[k] : null;
}
export function setWorking(d,e,s,f,val){
  state.workingVals[wKey(d,e,s,f)] = val;
}
export function clearWorking(d,e,s,f){
  delete state.workingVals[wKey(d,e,s,f)];
}

// ── Mentett sorozat-értékek ──
export function getStored(w,d,e,s,f){
  const v = localStorage.getItem(lsKey(w,d,e,s,f));
  return v !== null ? parseFloat(v) : null;
}
export function setStored(w,d,e,s,f,val){
  trackedSet(lsKey(w,d,e,s,f), String(val));
}
export function clearStored(w,d,e,s,f){
  // tombstone-os törlés, hogy a szinkron is törölje
  trackedRemove(lsKey(w,d,e,s,f));
}
// Egy cella teljes ürítése (munka- és mentett érték is)
export function clearCell(d,e,s,f){
  clearWorking(d,e,s,f);
  clearStored(state.currentWeek,d,e,s,f);
}

// ── Komment hét+nap+gyakorlathoz ──
function noteKey(w,d,e){ return `${planPrefix()}note_w${w}_d${d}_e${e}`; }
export function getNote(w,d,e){ return localStorage.getItem(noteKey(w,d,e)) || ''; }
export function setNote(w,d,e,txt){
  const k = noteKey(w,d,e);
  txt && txt.trim() ? trackedSet(k, txt) : trackedRemove(k);
}

// ── Nyújtás részfeladat pipa (hét+nap+gyakorlat+feladat-index) ──
function checkKey(w,d,e,t){ return `${planPrefix()}chk_w${w}_d${d}_e${e}_t${t}`; }
export function getCheck(w,d,e,t){ return localStorage.getItem(checkKey(w,d,e,t)) === '1'; }
export function setCheck(w,d,e,t,val){
  const k = checkKey(w,d,e,t);
  val ? trackedSet(k, '1') : trackedRemove(k);
}

// ── Dátum hét+naphoz ──
function dateKey(w,d){ return `${planPrefix()}date_w${w}_d${d}`; }
export function getWorkoutDate(w,d){ return localStorage.getItem(dateKey(w,d)); } // YYYY-MM-DD vagy null
export function setWorkoutDate(w,d,iso){
  const k = dateKey(w,d);
  iso ? trackedSet(k, iso) : trackedRemove(k);
}
export function todayISO(){
  const t = new Date();
  const off = t.getTimezoneOffset();
  return new Date(t.getTime() - off*60000).toISOString().slice(0,10);
}
export function fmtDate(iso){
  if(!iso) return '';
  const [y,m,d] = iso.split('-');
  return `${y}.${m}.${d}.`;
}

// ── Testsúly hét+naphoz ──
function bwKey(w,d){ return `${planPrefix()}bw_w${w}_d${d}`; }
export function getBodyweight(w,d){
  const v = localStorage.getItem(bwKey(w,d));
  return v !== null ? parseFloat(v) : null;
}
export function setBodyweight(w,d,val){
  const k = bwKey(w,d);
  (val !== null && val !== '' && !isNaN(val))
    ? trackedSet(k, String(val))
    : trackedRemove(k);
}
// Minden rögzített testsúly időrendben (aktuális terv): [{iso, weight, w, d}]
export function allBodyweights(){
  const out = [];
  const days = getDays();
  for(let w=1;w<=MAX_WEEKS;w++){
    for(let d=0;d<days.length;d++){
      const bw = getBodyweight(w,d);
      if(bw !== null){
        const iso = getWorkoutDate(w,d) || '';
        out.push({iso, weight:bw, w, d});
      }
    }
  }
  out.sort((a,b)=>{
    if(!a.iso && !b.iso) return 0;
    if(!a.iso) return 1;
    if(!b.iso) return -1;
    return a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0;
  });
  return out;
}

// ── Származtatott értékek ──

// Az "előző" érték: a legutóbbi hét, ahol ehhez a sorozathoz volt bejegyzés.
// Súly és ismétlés ugyanabból az edzésből. Ha nincs korábbi adat, az alap-tervnél
// a BASE_HISTORY-ra esik vissza (más terveknél nincs ilyen → null).
export function getPrev(d,e,s,f){
  for(let w=state.currentWeek-1; w>=1; w--){
    if(getStored(w,d,e,s,'kg') !== null || getStored(w,d,e,s,'reps') !== null){
      return getStored(w,d,e,s,f);
    }
  }
  if(getCurrentPlanId() === BASE_PLAN_ID){
    const days = getDays();
    const ex = days[d] && days[d].exercises[e];
    if(ex){
      const base = BASE_HISTORY[ex.name];
      if(base && base[s]) return f==='kg' ? base[s][0] : base[s][1];
    }
  }
  return null;
}

// Aktuális érték: munkaérték > mentett (aktuális hét) > null
export function getCurrent(d,e,s,f){
  const w = getWorking(d,e,s,f);
  if(w !== null) return w;
  return getStored(state.currentWeek,d,e,s,f);
}

// Az aktuális nap mentett értékeit betölti a munkaértékek közé
export function loadDayIntoWorking(){
  state.workingVals = {};
  const days = getDays();
  const day = days[state.currentDay];
  if(!day) return;
  day.exercises.forEach((ex,ei)=>{
    for(let s=0;s<ex.sets;s++){
      ['kg','reps'].forEach(f=>{
        const stored = getStored(state.currentWeek,state.currentDay,ei,s,f);
        if(stored !== null) state.workingVals[wKey(state.currentDay,ei,s,f)] = stored;
      });
    }
  });
}
