// ════════════════════════════════════════════
//  BELÉPÉSI PONT
// ════════════════════════════════════════════
// Itt kötjük be az eseménykezelőket (az inline onclick helyett, mert
// ES modulok hatóköre nem globális), és indítjuk az appot.

import { loadDayIntoWorking } from './storage.js';
import { render } from './ui.js';
import './workout.js';   // renderelők regisztrálása
import './history.js';   // renderelők regisztrálása
import { goEx, saveDay } from './workout.js';
import {
  toggleEdit, togglePage, toggleDayMenu, selectDay,
  openWeekModal, closeWeekModal, showPage,
} from './navigation.js';
import { toggleMainMenu, exportData, importData } from './backup.js';

function $(id){ return document.getElementById(id); }

// ── Fejléc ──
$('topTitle').addEventListener('click', toggleDayMenu);
$('btnEdit').addEventListener('click', toggleEdit);
$('btnHistory').addEventListener('click', togglePage);
$('btnMenu').addEventListener('click', toggleMainMenu);
$('weekPill').addEventListener('click', openWeekModal);

// ── Napválasztó gombok ──
document.querySelectorAll('#dayBar .day-btn').forEach((b,i)=>{
  b.addEventListener('click', ()=>selectDay(i));
});

// ── Főmenü (export/import) ──
document.querySelector('.mm-item[data-action="export"]').addEventListener('click', exportData);
document.querySelector('.mm-item[data-action="import"]').addEventListener('click', ()=>$('importFile').click());
$('importFile').addEventListener('change', importData);

// ── Lenti gombok ──
$('btnPrevEx').addEventListener('click', ()=>goEx(-1));
$('btnNextEx').addEventListener('click', ()=>goEx(1));
$('btnSaveDay').addEventListener('click', saveDay);

// ── Hét modal háttér ──
$('weekModal').addEventListener('click', closeWeekModal);
$('weekModalClose').addEventListener('click', ()=>closeWeekModal());

// ── Indítás ──
loadDayIntoWorking();
render();
showPage('workout');
