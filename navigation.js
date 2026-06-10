// ════════════════════════════════════════════
//  NAVIGÁCIÓ (szerkesztő mód, oldalváltás, nap/hét)
// ════════════════════════════════════════════

import { MAX_WEEKS } from './data.js';
import { state } from './state.js';
import { loadDayIntoWorking } from './storage.js';
import { getDayName, getDaySub, setDayName, setDaySub } from './names.js';
import { ICON_PENCIL, ICON_CHECK, ICON_CHART, ICON_DUMBBELL } from './icons.js';
import { showToast } from './toast.js';
import { render, renderSlides, renderHistory } from './ui.js';

// ── Szerkesztő mód ──
export function toggleEdit(){
  state.editMode = !state.editMode;
  const btn = document.getElementById('btnEdit');
  btn.classList.toggle('active', state.editMode);
  btn.innerHTML = state.editMode ? ICON_CHECK : ICON_PENCIL;
  if(state.editMode){
    document.getElementById('dayMenu').classList.add('open');
    document.getElementById('topTitle').classList.add('open');
  } else {
    render();
  }
  renderDayBarEdit();
  renderSlides();
  showToast(state.editMode ? 'Szerkesztés – írd át a neveket' : 'Mentve');
}

export function renderDayBarEdit(){
  document.querySelectorAll('#dayBar .day-btn').forEach((b,i)=>{
    b.onclick = state.editMode ? null : (()=>selectDay(i));
    const dl = b.querySelector('.dl');
    const ds = b.querySelector('.ds');
    if(state.editMode){
      if(dl.tagName !== 'INPUT'){
        const inDl = document.createElement('input');
        inDl.className='dl dl-input'; inDl.value=getDayName(i);
        inDl.onchange=()=>{ setDayName(i,inDl.value); render(); };
        dl.replaceWith(inDl);
      }
      if(ds.tagName !== 'INPUT'){
        const inDs = document.createElement('input');
        inDs.className='ds ds-input'; inDs.value=getDaySub(i);
        inDs.onchange=()=>{ setDaySub(i,inDs.value); };
        ds.replaceWith(inDs);
      }
    } else {
      if(dl.tagName === 'INPUT'){
        const sp=document.createElement('span'); sp.className='dl'; sp.textContent=getDayName(i); dl.replaceWith(sp);
      }
      if(ds.tagName === 'INPUT'){
        const sp=document.createElement('span'); sp.className='ds'; sp.textContent=getDaySub(i); ds.replaceWith(sp);
      }
    }
  });
}

// ── Oldalváltás (edzés / statisztika) ──
export function showPage(page){
  state.currentPage = page;
  document.body.classList.toggle('show-history', page==='history');
  const hb = document.getElementById('btnHistory');
  hb.classList.toggle('active', page==='history');
  hb.innerHTML = page==='history' ? ICON_DUMBBELL : ICON_CHART;
  document.getElementById('navBtns').style.display = page==='workout' ? 'flex' : 'none';
  if(page==='history'){ closeDayMenu(); renderHistory(); }
}
export function togglePage(){
  showPage(state.currentPage==='history' ? 'workout' : 'history');
}

// ── Napmenü lenyíló ──
export function toggleDayMenu(){
  const menu = document.getElementById('dayMenu');
  const tt = document.getElementById('topTitle');
  const open = menu.classList.toggle('open');
  tt.classList.toggle('open', open);
}
export function closeDayMenu(){
  document.getElementById('dayMenu').classList.remove('open');
  document.getElementById('topTitle').classList.remove('open');
}

// ── Nap kiválasztása ──
export function selectDay(idx){
  if(state.editMode) return;
  state.currentDay = idx;
  state.currentEx = 0;
  loadDayIntoWorking();
  render();
  closeDayMenu();
}

// ── Hét modal ──
export function openWeekModal(){
  const grid = document.getElementById('weekGrid');
  grid.innerHTML = '';
  for(let w=1;w<=MAX_WEEKS;w++){
    const btn = document.createElement('button');
    btn.className = 'wk-btn' + (w===state.currentWeek?' active':'');
    btn.textContent = `${w}.`;
    btn.onclick = ()=>{
      state.currentWeek = w;
      localStorage.setItem('currentWeek',w);
      loadDayIntoWorking();
      render();
      closeWeekModal();
    };
    grid.appendChild(btn);
  }
  document.getElementById('weekModal').classList.add('open');
}
export function closeWeekModal(e){
  if(e && e.target!==document.getElementById('weekModal')) return;
  document.getElementById('weekModal').classList.remove('open');
}
