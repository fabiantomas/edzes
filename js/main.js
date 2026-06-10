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
$('importFile').addEventListener('change', importData);

// ── Lenti gombok ──
$('btnPrevEx').addEventListener('click', ()=>goEx(-1));
$('btnNextEx').addEventListener('click', ()=>goEx(1));
$('btnSaveDay').addEventListener('click', ()=>saveDay());

// ── Hét modal háttér ──
$('weekModal').addEventListener('click', closeWeekModal);
$('weekModalClose').addEventListener('click', ()=>closeWeekModal());

// ── Indítás ──
loadDayIntoWorking();
render();
showPage('workout');
