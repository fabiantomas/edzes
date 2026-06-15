// ════════════════════════════════════════════
//  NYÚJTÁS-OLDAL (edzés után)
// ════════════════════════════════════════════
// A "Kész" után megnyílik: összegyűjti, mely gyakorlatokhoz lett aznap bejegyzés,
// kikövetkezteti az érintett izomcsoportokat, és kilistázza a nyújtásokat.

import { state } from './state.js';
import { getStored } from './storage.js';
import { getDays } from './plans.js';
import { getExName } from './names.js';
import { STRETCHES, groupForExercise } from './stretch-data.js';
import { ICON_CLOSE } from './icons.js';

// Az aktuális nap mely gyakorlataihoz van mentett érték az aktuális héten?
function trainedGroups(){
  const day = getDays()[state.currentDay];
  if(!day) return [];
  const groups = new Set();
  day.exercises.forEach((ex, ei)=>{
    let has = false;
    for(let s=0;s<ex.sets;s++){
      if(getStored(state.currentWeek, state.currentDay, ei, s, 'kg') !== null ||
         getStored(state.currentWeek, state.currentDay, ei, s, 'reps') !== null){
        has = true; break;
      }
    }
    if(has){
      const g = groupForExercise(getExName(state.currentDay, ei));
      if(g) groups.add(g);
    }
  });
  // a STRETCHES kulcs-sorrendjében
  return Object.keys(STRETCHES).filter(g=>groups.has(g));
}

export function openStretchScreen(){
  const groups = trainedGroups();

  let modal = document.getElementById('stretchModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'stretchModal';
    modal.className = 'stretch-ov';
    document.body.appendChild(modal);
  }

  modal.innerHTML = '';

  const sheet = document.createElement('div');
  sheet.className = 'stretch-sheet';

  // fejléc
  const head = document.createElement('div');
  head.className = 'stretch-head';
  const title = document.createElement('div');
  title.className = 'stretch-title';
  title.textContent = 'Nyújtás';
  const close = document.createElement('button');
  close.className = 'stretch-close';
  close.innerHTML = ICON_CLOSE;
  close.onclick = closeStretchScreen;
  head.appendChild(title);
  head.appendChild(close);
  sheet.appendChild(head);

  const sub = document.createElement('div');
  sub.className = 'stretch-sub';
  sub.textContent = groups.length
    ? 'A ma terhelt izomcsoportokhoz ajánlott nyújtások:'
    : 'Ehhez az edzéshez nem találtunk hozzárendelhető izomcsoportot.';
  sheet.appendChild(sub);

  // izmonkénti nyújtás-listák
  const body = document.createElement('div');
  body.className = 'stretch-body';
  groups.forEach(g=>{
    const sec = document.createElement('div');
    sec.className = 'stretch-group';
    const gt = document.createElement('div');
    gt.className = 'stretch-group-title';
    gt.textContent = g;
    sec.appendChild(gt);
    (STRETCHES[g] || []).forEach(name=>{
      const item = document.createElement('div');
      item.className = 'stretch-item';
      item.textContent = name;
      sec.appendChild(item);
    });
    body.appendChild(sec);
  });
  sheet.appendChild(body);

  // záró gomb
  const done = document.createElement('button');
  done.className = 'stretch-done';
  done.textContent = 'Kész';
  done.onclick = closeStretchScreen;
  sheet.appendChild(done);

  modal.appendChild(sheet);
  // megjelenítés a következő frame-ben az animációhoz
  requestAnimationFrame(()=> modal.classList.add('open'));
}

export function closeStretchScreen(){
  const modal = document.getElementById('stretchModal');
  if(modal) modal.classList.remove('open');
}
