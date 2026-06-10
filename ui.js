// ════════════════════════════════════════════
//  UI KOORDINÁTOR
// ════════════════════════════════════════════
// A teljes újrarajzolást fogja össze. A workout és history modulok
// regisztrálják ide a saját renderelő függvényüket (late binding),
// így nincs körkörös import a render() és a rész-renderelők között.

import { state } from './state.js';
import { getDayName, getDaySub } from './names.js';

const renderers = {
  exNav: ()=>{},
  slides: ()=>{},
  navBtns: ()=>{},
  progress: ()=>{},
  history: ()=>{},
};

export function registerRenderer(name, fn){ renderers[name] = fn; }

export function renderExNav(){ renderers.exNav(); }
export function renderSlides(){ renderers.slides(); }
export function updateNavBtns(){ renderers.navBtns(); }
export function updateProgress(){ renderers.progress(); }
export function renderHistory(){ renderers.history(); }

// Teljes újrarajzolás (fejléc + nap-sáv + aktuális oldal).
export function render(){
  document.getElementById('weekPill').textContent = `${state.currentWeek}. hét`;

  // cím szövege a chevron megtartásával
  const tt = document.getElementById('topTitle');
  if(tt.firstChild){
    tt.firstChild.textContent = getDayName(state.currentDay)+' ';
  } else {
    tt.insertBefore(document.createTextNode(getDayName(state.currentDay)+' '), tt.firstChild);
  }

  // napgombok feliratai
  document.querySelectorAll('#dayBar .day-btn').forEach((b,i)=>{
    b.classList.toggle('active', i===state.currentDay);
    const dl = b.querySelector('.dl');
    const ds = b.querySelector('.ds');
    if(dl) dl.textContent = getDayName(i);
    if(ds) ds.textContent = getDaySub(i);
  });

  renderExNav();
  renderSlides();
  updateProgress();
  updateNavBtns();
}
