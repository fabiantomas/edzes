// ════════════════════════════════════════════
//  NAVIGÁCIÓ (szerkesztő mód, oldalváltás, nap/hét/terv)
// ════════════════════════════════════════════

import { MAX_WEEKS } from './data.js';
import { state } from './state.js';
import { loadDayIntoWorking } from './storage.js';
import {
  getPlans, getCurrentPlanId, setCurrentPlanId, createPlan, deletePlan,
} from './plans.js';
import { ICON_PENCIL, ICON_CHECK, ICON_CHART, ICON_DUMBBELL, ICON_PLUS, ICON_TRASH } from './icons.js';
import { showToast } from './toast.js';
import { render, renderSlides, renderHistory, registerCallback } from './ui.js';

// ── Szerkesztő mód ──
export function toggleEdit(){
  state.editMode = !state.editMode;
  const btn = document.getElementById('btnEdit');
  btn.classList.toggle('active', state.editMode);
  btn.innerHTML = state.editMode ? ICON_CHECK : ICON_PENCIL;
  if(state.editMode){
    // szerkesztéskor nyitva a napmenü (napok átnevezése/hozzáadása ott)
    document.getElementById('dayMenu').classList.add('open');
    document.getElementById('topTitle').classList.add('open');
  }
  render();
  showToast(state.editMode ? 'Szerkesztés – napok és gyakorlatok' : 'Kész');
}

// ── Oldalváltás (edzés / statisztika) ──
export function showPage(page){
  state.currentPage = page;
  document.body.classList.toggle('show-history', page==='history');
  const hb = document.getElementById('btnHistory');
  hb.classList.toggle('active', page==='history');
  hb.innerHTML = page==='history' ? ICON_DUMBBELL : ICON_CHART;
  document.getElementById('navBtns').style.display = (page==='workout' && !state.editMode) ? 'flex' : 'none';
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

// ── Terv választó/kezelő ──
export function openPlanMenu(){
  const menu = document.getElementById('planMenu');
  const open = menu.classList.toggle('open');
  document.getElementById('planSwitch').classList.toggle('open', open);
  if(open) renderPlanMenu();
}
export function closePlanMenu(){
  document.getElementById('planMenu').classList.remove('open');
  document.getElementById('planSwitch').classList.remove('open');
}
function renderPlanMenu(){
  const menu = document.getElementById('planMenu');
  menu.innerHTML = '';
  const plans = getPlans();
  const curId = getCurrentPlanId();

  plans.forEach(p=>{
    const row = document.createElement('div');
    row.className = 'plan-row' + (p.id===curId ? ' active' : '');

    const name = document.createElement('button');
    name.className = 'plan-name-btn';
    name.textContent = p.name;
    name.onclick = ()=>{ switchPlan(p.id); };
    row.appendChild(name);

    // törlés (ha több mint egy terv van)
    if(plans.length > 1){
      const del = document.createElement('button');
      del.className = 'plan-del';
      del.innerHTML = ICON_TRASH;
      del.onclick = (e)=>{
        e.stopPropagation();
        if(confirm(`Törlöd a(z) "${p.name}" tervet és minden hozzá tartozó adatot?`)){
          deletePlan(p.id);
          if(p.id===curId){
            state.currentDay = 0; state.currentEx = 0;
            loadDayIntoWorking();
          }
          renderPlanMenu();
          render();
        }
      };
      row.appendChild(del);
    }
    menu.appendChild(row);
  });

  // új terv
  const add = document.createElement('button');
  add.className = 'plan-add';
  add.innerHTML = ICON_PLUS + '<span>Új terv</span>';
  add.onclick = ()=>{
    const name = prompt('Az új edzésterv neve:');
    if(name === null) return;
    const id = createPlan(name.trim() || 'Új terv');
    switchPlan(id);
  };
  menu.appendChild(add);
}
function switchPlan(id){
  setCurrentPlanId(id);
  state.currentDay = 0;
  state.currentEx = 0;
  if(state.editMode){ state.editMode = false; document.getElementById('btnEdit').classList.remove('active'); }
  loadDayIntoWorking();
  render();
  closePlanMenu();
  showToast('Terv kiválasztva');
}

// A nap-sáv szerkesztő callback-jeit az ui.js hívja
registerCallback('selectDay', selectDay);
registerCallback('afterStructChange', ()=>{
  loadDayIntoWorking();
  render();
});
