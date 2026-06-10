// ════════════════════════════════════════════
//  BELÉPÉSI PONT
// ════════════════════════════════════════════
// Eseménykezelők bekötése (az inline onclick helyett) és az app indítása.

import { loadDayIntoWorking } from './storage.js';
import { render } from './ui.js';
import './workout.js';   // renderelők regisztrálása
import './history.js';   // renderelők regisztrálása
import { goEx, saveDay } from './workout.js';
import {
  toggleEdit, togglePage, toggleDayMenu,
  openWeekModal, closeWeekModal, showPage,
  openPlanMenu, closePlanMenu,
} from './navigation.js';
import { toggleMainMenu, closeMainMenu, exportData, importData } from './backup.js';
import { openProfile } from './profile.js';
import { syncNow } from './sync.js';
import { exportDetailedCsv, exportSummaryCsv } from './csv.js';

function $(id){ return document.getElementById(id); }

// ── Fejléc ──
$('topTitle').addEventListener('click', toggleDayMenu);
$('btnEdit').addEventListener('click', toggleEdit);
$('btnHistory').addEventListener('click', togglePage);
$('btnMenu').addEventListener('click', toggleMainMenu);
$('weekPill').addEventListener('click', openWeekModal);

// ── Terv választó ──
$('planSwitch').addEventListener('click', openPlanMenu);
// kattintás máshova → terv-menü zárása
document.addEventListener('click', (e)=>{
  const sw = $('planSwitch'), menu = $('planMenu');
  if(menu && menu.classList.contains('open') && !menu.contains(e.target) && !sw.contains(e.target)){
    closePlanMenu();
  }
});

// ── Főmenü (profil + export/import) ──
document.querySelector('.mm-item[data-action="profile"]').addEventListener('click', ()=>{ closeMainMenu(); openProfile(); });
document.querySelector('.mm-item[data-action="export"]').addEventListener('click', exportData);
document.querySelector('.mm-item[data-action="import"]').addEventListener('click', ()=>$('importFile').click());
document.querySelector('.mm-item[data-action="csv-detailed"]').addEventListener('click', ()=>{ exportDetailedCsv(); closeMainMenu(); });
document.querySelector('.mm-item[data-action="csv-summary"]').addEventListener('click', ()=>{ exportSummaryCsv(); closeMainMenu(); });
$('importFile').addEventListener('change', importData);

// ── Lenti gombok ──
$('btnPrevEx').addEventListener('click', ()=>goEx(-1));
$('btnNextEx').addEventListener('click', ()=>goEx(1));
$('btnSaveDay').addEventListener('click', ()=>{
  const saved = saveDay();
  const btn = $('btnSaveDay');
  // látható visszajelzés: pipa + zöld villanás
  btn.classList.remove('saved');     // újraindításhoz
  void btn.offsetWidth;              // reflow, hogy az animáció újrainduljon
  btn.classList.add('saved');
  setTimeout(()=>btn.classList.remove('saved'), 1400);
});

// ── Hét modal háttér ──
$('weekModal').addEventListener('click', closeWeekModal);
$('weekModalClose').addEventListener('click', ()=>closeWeekModal());

// ── Indítás ──
loadDayIntoWorking();
render();
showPage('workout');

// ── Szinkronizáció ──
async function runSync(){
  const dot = document.getElementById('syncDot');
  if(dot){ dot.classList.remove('ok','err'); dot.classList.add('syncing'); }
  const res = await syncNow();
  if(res.ok && res.changed){
    loadDayIntoWorking();
    render();
  }
  updateSyncIndicator(res);
}
function updateSyncIndicator(res){
  const el = document.getElementById('syncDot');
  if(!el) return;
  el.classList.remove('syncing','ok','err');
  if(res && res.ok) el.classList.add('ok');
  else el.classList.add('err');
}

// indításkor
runSync();
// visszatéréskor / ha újra online
window.addEventListener('online', runSync);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) runSync(); });
// profilváltás / import után
window.addEventListener('profilechanged', runSync);
// kézi szinkron a pöttyre kattintva
const syncDotEl = $('syncDot');
if(syncDotEl) syncDotEl.addEventListener('click', (e)=>{ e.stopPropagation(); runSync(); });
// időzített háttér-szinkron (2 percenként, ha aktív)
setInterval(()=>{ if(!document.hidden) runSync(); }, 120000);

