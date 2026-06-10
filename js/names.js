// ════════════════════════════════════════════
//  NEVEK (szerkeszthető nap- és gyakorlatnevek)
// ════════════════════════════════════════════
// Az eredeti neveket (data.js) használjuk kulcsként a BASE_HISTORY-hoz,
// a megjelenített nevek itt felülírhatók és localStorage-ban tárolódnak.

import { DAYS, DAY_SUBS } from './data.js';

function dayNameKey(di){ return `dayname_${di}`; }
function exNameKey(di,ei){ return `exname_${di}_${ei}`; }

export function getDayName(di){
  return localStorage.getItem(dayNameKey(di)) || DAYS[di].name;
}
export function getDaySub(di){
  return localStorage.getItem(`daysub_${di}`) || DAY_SUBS[di] || '';
}
export function getExName(di,ei){
  return localStorage.getItem(exNameKey(di,ei)) || DAYS[di].exercises[ei].name;
}
export function setDayName(di,v){
  v.trim() ? localStorage.setItem(dayNameKey(di),v.trim()) : localStorage.removeItem(dayNameKey(di));
}
export function setDaySub(di,v){
  v.trim() ? localStorage.setItem(`daysub_${di}`,v.trim()) : localStorage.removeItem(`daysub_${di}`);
}
export function setExName(di,ei,v){
  v.trim() ? localStorage.setItem(exNameKey(di,ei),v.trim()) : localStorage.removeItem(exNameKey(di,ei));
}
