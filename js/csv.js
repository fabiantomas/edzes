// ════════════════════════════════════════════
//  CSV EXPORT
// ════════════════════════════════════════════
// Az aktuális terv + aktuális profil adatait exportálja CSV-be.
// Kétféle: részletes (sorozatonként) és gyakorlatonként összesített.

import { MAX_WEEKS } from './data.js';
import { getStored, getWorkoutDate, getBodyweight, fmtDate, todayISO } from './storage.js';
import { getDays, getCurrentPlanName } from './plans.js';
import { getDayName, getExName } from './names.js';
import { showToast } from './toast.js';

// CSV-mező escapelése (vessző, idézőjel, sortörés esetén idézőjelbe)
function esc(v){
  const s = (v===null || v===undefined) ? '' : String(v);
  if(/[",\n;]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
  return s;
}
function rowsToCsv(rows){
  // pontosvessző elválasztó: az Excel magyar locale-ban így nyitja jól
  return rows.map(r=> r.map(esc).join(';')).join('\r\n');
}

function download(filename, text){
  // BOM, hogy az Excel UTF-8-ként ismerje fel az ékezeteket
  const blob = new Blob(['\ufeff' + text], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

function planSlug(){
  return (getCurrentPlanName() || 'terv').replace(/[^A-Za-z0-9_-]+/g,'_').slice(0,30);
}

// ── Részletes CSV: minden rögzített sorozat egy sor ──
export function exportDetailedCsv(){
  const days = getDays();
  const rows = [['Hét','Dátum','Nap','Gyakorlat','Sorozat','Súly (kg)','Ismétlés']];

  for(let w=1; w<=MAX_WEEKS; w++){
    days.forEach((day, di)=>{
      const date = getWorkoutDate(w, di) || '';
      day.exercises.forEach((ex, ei)=>{
        for(let s=0; s<ex.sets; s++){
          const kg = getStored(w,di,ei,s,'kg');
          const rp = getStored(w,di,ei,s,'reps');
          if(kg !== null || rp !== null){
            rows.push([
              w, fmtDate(date), getDayName(di), getExName(di,ei),
              s+1, kg ?? '', rp ?? '',
            ]);
          }
        }
      });
    });
  }

  if(rows.length === 1){ showToast('Nincs exportálható adat'); return; }
  download(`edzes_${planSlug()}_reszletes_${todayISO()}.csv`, rowsToCsv(rows));
  showToast('Részletes CSV letöltve');
}

// ── Összesített CSV: gyakorlatonként/hetente egy sor (max súly, össztérfogat) ──
export function exportSummaryCsv(){
  const days = getDays();
  const rows = [['Hét','Dátum','Nap','Gyakorlat','Max súly (kg)','Sorozatok','Össz ismétlés','Térfogat (kg·ism)']];

  for(let w=1; w<=MAX_WEEKS; w++){
    days.forEach((day, di)=>{
      const date = getWorkoutDate(w, di) || '';
      day.exercises.forEach((ex, ei)=>{
        let maxKg = null, setCount = 0, totalReps = 0, volume = 0, any = false;
        for(let s=0; s<ex.sets; s++){
          const kg = getStored(w,di,ei,s,'kg');
          const rp = getStored(w,di,ei,s,'reps');
          if(kg !== null || rp !== null){
            any = true;
            setCount++;
            if(kg !== null && (maxKg === null || kg > maxKg)) maxKg = kg;
            if(rp !== null) totalReps += rp;
            if(kg !== null && rp !== null) volume += kg * rp;
          }
        }
        if(any){
          rows.push([
            w, fmtDate(date), getDayName(di), getExName(di,ei),
            maxKg ?? '', setCount, totalReps, Math.round(volume*10)/10,
          ]);
        }
      });
    });
  }

  if(rows.length === 1){ showToast('Nincs exportálható adat'); return; }
  download(`edzes_${planSlug()}_osszesitett_${todayISO()}.csv`, rowsToCsv(rows));
  showToast('Összesített CSV letöltve');
}
