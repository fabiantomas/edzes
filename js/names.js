// ════════════════════════════════════════════
//  NEVEK
// ════════════════════════════════════════════
// A nevek mostantól közvetlenül a terv struktúrájában tárolódnak
// (lásd plans.js). Ezek a függvények kényelmi olvasók/írók a struktúrához.

import { getStructure, saveStructure } from './plans.js';

export function getDayName(di){
  const s = getStructure();
  return s[di] ? s[di].name : '';
}
export function getDaySub(di){
  const s = getStructure();
  return s[di] ? (s[di].sub || '') : '';
}
export function getExName(di,ei){
  const s = getStructure();
  return (s[di] && s[di].exercises[ei]) ? s[di].exercises[ei].name : '';
}
export function setDayName(di,v){
  const s = getStructure();
  if(s[di]){ s[di].name = v.trim() || s[di].name; saveStructure(s); }
}
export function setDaySub(di,v){
  const s = getStructure();
  if(s[di]){ s[di].sub = v.trim(); saveStructure(s); }
}
export function setExName(di,ei,v){
  const s = getStructure();
  if(s[di] && s[di].exercises[ei]){ s[di].exercises[ei].name = v.trim() || s[di].exercises[ei].name; saveStructure(s); }
}
