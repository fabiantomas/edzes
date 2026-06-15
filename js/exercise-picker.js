// ════════════════════════════════════════════
//  GYAKORLAT-VÁLASZTÓ (modal)
// ════════════════════════════════════════════
// Izomcsoportokra bontott könyvtárból lehet választani, keresni, vagy saját
// gyakorlatot beírni. A kiválasztott nevet az onPick callback kapja meg.

import { EXERCISE_LIBRARY } from './exercise-library.js';
import { ICON_CLOSE, ICON_PLUS } from './icons.js';

let onPickCb = null;

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function openExercisePicker(onPick){
  onPickCb = onPick;
  let modal = document.getElementById('exPickerModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'exPickerModal';
    modal.className = 'modal-ov';
    modal.innerHTML = `
      <div class="modal-box exp-box">
        <div class="exp-head">
          <span class="exp-title">Gyakorlat hozzáadása</span>
          <button class="exp-close" aria-label="Bezárás">${ICON_CLOSE}</button>
        </div>
        <input class="exp-search" id="expSearch" placeholder="Keresés…" autocapitalize="off" autocomplete="off">
        <div class="exp-manual">
          <input class="exp-manual-input" id="expManualInput" placeholder="Saját gyakorlat neve…" autocapitalize="sentences" autocomplete="off">
          <button class="exp-manual-add" id="expManualAdd">${ICON_PLUS}<span>Hozzáad</span></button>
        </div>
        <div class="exp-list" id="expList"></div>
      </div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', e=>{ if(e.target===modal) closeExercisePicker(); });
    modal.querySelector('.exp-close').addEventListener('click', closeExercisePicker);

    modal.querySelector('#expSearch').addEventListener('input', (e)=>{
      renderList(e.target.value);
    });
    modal.querySelector('#expManualAdd').addEventListener('click', ()=>{
      const v = modal.querySelector('#expManualInput').value.trim();
      if(v) pick(v);
    });
    modal.querySelector('#expManualInput').addEventListener('keydown', (e)=>{
      if(e.key==='Enter'){ const v=e.target.value.trim(); if(v) pick(v); }
    });
  }
  modal.querySelector('#expSearch').value = '';
  modal.querySelector('#expManualInput').value = '';
  renderList('');
  modal.classList.add('open');
}

export function closeExercisePicker(){
  const modal = document.getElementById('exPickerModal');
  if(modal) modal.classList.remove('open');
}

function pick(name){
  closeExercisePicker();
  if(onPickCb) onPickCb(name);
}

function renderList(filter){
  const list = document.getElementById('expList');
  if(!list) return;
  list.innerHTML = '';
  const f = (filter||'').trim().toLowerCase();

  EXERCISE_LIBRARY.forEach(group=>{
    const matches = group.items.filter(it => !f || it.toLowerCase().includes(f));
    if(matches.length === 0) return;

    const gEl = document.createElement('div');
    gEl.className = 'exp-group';

    // csoport fejléc (összecsukható). Keresés közben nyitva, egyébként csukva.
    const open = !!f;
    const header = document.createElement('button');
    header.className = 'exp-group-header' + (open ? ' open' : '');
    header.innerHTML = `<span>${group.group}</span><span class="exp-count">${matches.length}</span><svg class="exp-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    gEl.appendChild(header);

    const items = document.createElement('div');
    items.className = 'exp-items' + (open ? ' open' : '');
    matches.forEach(name=>{
      const btn = document.createElement('button');
      btn.className = 'exp-item';
      btn.textContent = name;
      btn.onclick = ()=>pick(name);
      items.appendChild(btn);
    });
    gEl.appendChild(items);

    header.onclick = ()=>{
      const isOpen = items.classList.toggle('open');
      header.classList.toggle('open', isOpen);
    };

    list.appendChild(gEl);
  });

  if(list.children.length === 0){
    const empty = document.createElement('div');
    empty.className = 'exp-empty';
    empty.textContent = 'Nincs találat. Add hozzá saját gyakorlatként a felső mezőben.';
    list.appendChild(empty);
  }
}
