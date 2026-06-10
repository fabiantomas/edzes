// ════════════════════════════════════════════
//  UI KOORDINÁTOR
// ════════════════════════════════════════════
// A teljes újrarajzolást fogja össze. A nézet-modulok regisztrálják ide a saját
// renderelőjüket (late binding), így nincs körkörös import a render() és a
// rész-renderelők között. A nap-sávot és a terv-címet is innen építjük.

import { state } from './state.js';
import { getDayName, getDaySub, setDayName, setDaySub } from './names.js';
import { getDays, addDay, deleteDay, getCurrentPlanName } from './plans.js';
import { ICON_PLUS, ICON_TRASH } from './icons.js';

const renderers = {
  exNav: ()=>{},
  slides: ()=>{},
  navBtns: ()=>{},
  progress: ()=>{},
  history: ()=>{},
};
// Késő kötésű callback-ek (a navigation.js tölti fel)
const callbacks = {
  selectDay: (i)=>{ state.currentDay = i; },
  afterStructChange: ()=>{},
};

export function registerRenderer(name, fn){ renderers[name] = fn; }
export function registerCallback(name, fn){ callbacks[name] = fn; }

export function renderExNav(){ renderers.exNav(); }
export function renderSlides(){ renderers.slides(); }
export function updateNavBtns(){ renderers.navBtns(); }
export function updateProgress(){ renderers.progress(); }
export function renderHistory(){ renderers.history(); }

// A currentDay az érvényes tartományba szorítása
function clampDay(){
  const n = getDays().length;
  if(n === 0){ state.currentDay = 0; return; }
  if(state.currentDay >= n) state.currentDay = n-1;
  if(state.currentDay < 0) state.currentDay = 0;
}

// ── Nap-sáv felépítése (a struktúrából) ──
function renderDayBar(){
  const bar = document.getElementById('dayBar');
  bar.innerHTML = '';
  const days = getDays();

  days.forEach((day,i)=>{
    const btn = document.createElement('div');
    btn.className = 'day-btn' + (i===state.currentDay ? ' active' : '');

    if(state.editMode){
      // szerkesztő mód: név + alcím inputok + törlés
      const dl = document.createElement('input');
      dl.className = 'dl dl-input';
      dl.value = day.name;
      dl.onchange = ()=>{ setDayName(i, dl.value); };
      const ds = document.createElement('input');
      ds.className = 'ds ds-input';
      ds.value = day.sub || '';
      ds.placeholder = 'alcím';
      ds.onchange = ()=>{ setDaySub(i, ds.value); };
      const del = document.createElement('button');
      del.className = 'day-del';
      del.innerHTML = ICON_TRASH;
      del.onclick = (e)=>{
        e.stopPropagation();
        if(confirm(`Törlöd ezt a napot: "${day.name}"? A hozzá tartozó adatok is elvesznek.`)){
          deleteDay(i);
          clampDay();
          callbacks.afterStructChange();
        }
      };
      btn.appendChild(dl);
      btn.appendChild(ds);
      btn.appendChild(del);
    } else {
      const dl = document.createElement('span');
      dl.className = 'dl';
      dl.textContent = day.name;
      const ds = document.createElement('span');
      ds.className = 'ds';
      ds.textContent = day.sub || '';
      btn.appendChild(dl);
      btn.appendChild(ds);
      btn.onclick = ()=>callbacks.selectDay(i);
    }
    bar.appendChild(btn);
  });

  // szerkesztő módban: új nap hozzáadása gomb
  if(state.editMode){
    const add = document.createElement('button');
    add.className = 'day-add';
    add.innerHTML = ICON_PLUS + '<span>Új nap</span>';
    add.onclick = ()=>{
      addDay('Új nap', '');
      callbacks.afterStructChange();
    };
    bar.appendChild(add);
  }
}

// Teljes újrarajzolás (fejléc + nap-sáv + aktuális oldal).
export function render(){
  clampDay();
  document.getElementById('weekPill').textContent = `${state.currentWeek}. hét`;

  // cím: nap neve (a chevron megtartásával)
  const tt = document.getElementById('topTitle');
  const dayName = getDayName(state.currentDay) || '—';
  if(tt.firstChild && tt.firstChild.nodeType === 3){
    tt.firstChild.textContent = dayName + ' ';
  } else {
    tt.insertBefore(document.createTextNode(dayName + ' '), tt.firstChild);
  }

  // terv neve a cím fölött
  const pn = document.getElementById('planName');
  if(pn) pn.textContent = getCurrentPlanName();

  renderDayBar();
  renderExNav();
  renderSlides();
  updateProgress();
  updateNavBtns();
}
