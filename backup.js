// ════════════════════════════════════════════
//  BIZTONSÁGI MENTÉS (export / import)
// ════════════════════════════════════════════

import { state } from './state.js';
import { loadDayIntoWorking, todayISO } from './storage.js';
import { ICON_PENCIL } from './icons.js';
import { showToast } from './toast.js';
import { render } from './ui.js';
import { showPage } from './navigation.js';

// ── Főmenü (három pont) ──
export function toggleMainMenu(e){
  if(e) e.stopPropagation();
  document.getElementById('mainMenu').classList.toggle('open');
}
export function closeMainMenu(){
  document.getElementById('mainMenu').classList.remove('open');
}

// kattintás máshova → zárás
document.addEventListener('click', e=>{
  const menu = document.getElementById('mainMenu');
  const btn = document.getElementById('btnMenu');
  if(menu && menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)){
    closeMainMenu();
  }
});

// ── Export: az összes localStorage tartalom egy JSON fájlba ──
export function exportData(){
  const data = {};
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    data[k] = localStorage.getItem(k);
  }
  const payload = {
    app: 'edzesnaplo',
    version: 1,
    exportedAt: new Date().toISOString(),
    data
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `edzesnaplo_${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
  closeMainMenu();
  showToast('Adatok exportálva');
}

// ── Import: fájlból visszatöltés (teljes csere) ──
export function importData(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result);
      const data = parsed && parsed.data ? parsed.data : parsed;
      if(typeof data !== 'object' || data === null) throw new Error('hibás formátum');
      if(!confirm('Visszatöltés: a jelenlegi adatok felülíródnak a fájlból. Folytatod?')){
        e.target.value = '';
        return;
      }
      localStorage.clear();
      Object.keys(data).forEach(k=>{ localStorage.setItem(k, data[k]); });
      // állapot frissítése
      state.currentWeek = parseInt(localStorage.getItem('currentWeek') || '1');
      state.currentDay = 0;
      state.currentEx = 0;
      state.editMode = false;
      document.getElementById('btnEdit').classList.remove('active');
      document.getElementById('btnEdit').innerHTML = ICON_PENCIL;
      loadDayIntoWorking();
      render();
      showPage('workout');
      closeMainMenu();
      showToast('Adatok visszatöltve');
    }catch(err){
      alert('Nem sikerült beolvasni a fájlt. Biztosan a megfelelő mentést választottad?');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}
