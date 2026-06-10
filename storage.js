// ════════════════════════════════════════════
//  TÁROLÁS (localStorage) ÉS SZÁRMAZTATOTT ÉRTÉKEK
// ════════════════════════════════════════════

import { DAYS, BASE_HISTORY, MAX_WEEKS } from './data.js';
import { state } from './state.js';

// ── Kulcsképzés ──
function wKey(d,e,s,f){ return `${d}_${e}_${s}_${f}`; }
function lsKey(w,d,e,s,f){ return `w${w}_d${d}_e${e}_s${s}_${f}`; }

// ── Munkaértékek (mentés előtti, memóriában) ──
export function getWorking(d,e,s,f){
  const k = wKey(d,e,s,f);
  return (k in state.workingVals) ? state.workingVals[k] : null;
}
export function setWorking(d,e,s,f,val){
  state.workingVals[wKey(d,e,s,f)] = val;
}

// ── Mentett sorozat-értékek ──
export function getStored(w,d,e,s,f){
  const v = localStorage.getItem(lsKey(w,d,e,s,f));
  return v !== null ? parseFloat(v) : null;
}
export function setStored(w,d,e,s,f,val){
  localStorage.setItem(lsKey(w,d,e,s,f), val);
}

// ── Komment hét+nap+gyakorlathoz ──
function noteKey(w,d,e){ return `note_w${w}_d${d}_e${e}`; }
export function getNote(w,d,e){ return localStorage.getItem(noteKey(w,d,e)) || ''; }
export function setNote(w,d,e,txt){
  txt && txt.trim() ? localStorage.setItem(noteKey(w,d,e), txt) : localStorage.removeItem(noteKey(w,d,e));
}

// ── Dátum hét+naphoz ──
function dateKey(w,d){ return `date_w${w}_d${d}`; }
export function getWorkoutDate(w,d){ return localStorage.getItem(dateKey(w,d)); } // YYYY-MM-DD vagy null
export function setWorkoutDate(w,d,iso){
  iso ? localStorage.setItem(dateKey(w,d),iso) : localStorage.removeItem(dateKey(w,d));
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
function bwKey(w,d){ return `bw_w${w}_d${d}`; }
export function getBodyweight(w,d){
  const v = localStorage.getItem(bwKey(w,d));
  return v !== null ? parseFloat(v) : null;
}
export function setBodyweight(w,d,val){
  (val !== null && val !== '' && !isNaN(val))
    ? localStorage.setItem(bwKey(w,d),val)
    : localStorage.removeItem(bwKey(w,d));
}
// Minden rögzített testsúly időrendben: [{iso, weight, w, d}]
export function allBodyweights(){
  const out = [];
  for(let w=1;w<=MAX_WEEKS;w++){
    for(let d=0;d<DAYS.length;d++){
      const bw = getBodyweight(w,d);
      if(bw !== null){
        const iso = getWorkoutDate(w,d) || '';
        out.push({iso, weight:bw, w, d});
      }
    }
  }
  // dátum szerint növekvő; dátum nélküliek a végére
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
// A súly és ismétlés ugyanabból az edzésből származik. Ha nincs korábbi adat,
// a kiindulási előzményre (BASE_HISTORY) esik vissza, sorozatonként.
export function getPrev(d,e,s,f){
  for(let w=state.currentWeek-1; w>=1; w--){
    if(getStored(w,d,e,s,'kg') !== null || getStored(w,d,e,s,'reps') !== null){
      return getStored(w,d,e,s,f);
    }
  }
  const ex = DAYS[d].exercises[e];
  const base = BASE_HISTORY[ex.name];
  if(!base || !base[s]) return null;
  return f==='kg' ? base[s][0] : base[s][1];
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
  const day = DAYS[state.currentDay];
  day.exercises.forEach((ex,ei)=>{
    for(let s=0;s<ex.sets;s++){
      ['kg','reps'].forEach(f=>{
        const stored = getStored(state.currentWeek,state.currentDay,ei,s,f);
        if(stored !== null) state.workingVals[wKey(state.currentDay,ei,s,f)] = stored;
      });
    }
  });
}
