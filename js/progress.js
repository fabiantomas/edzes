// ════════════════════════════════════════════
//  FEJLŐDÉS NÉZET (grafikonok)
// ════════════════════════════════════════════
// Három nézet:
//   1) Napi össztérfogat (kg·ism) időben — az összes gyakorlat összegezve naponta
//   2) Kiválasztott gyakorlat max súlya hetente
//   3) Kiválasztott gyakorlat becsült 1RM-je hetente (Epley-képlet)

import { MAX_WEEKS } from './data.js';
import { state } from './state.js';
import { getStored, getWorkoutDate, fmtDate } from './storage.js';
import { getDays } from './plans.js';
import { getDayName, getExName } from './names.js';

const SVGNS = 'http://www.w3.org/2000/svg';

// Epley becsült 1RM
function epley1RM(kg, reps){
  if(kg === null || reps === null) return null;
  return kg * (1 + reps/30);
}

// ── Általános vonaldiagram ──
// points: [{label, value}] — legalább 1 elem. yUnit: a tengely felirata.
function lineChart(points, opts={}){
  const W = 320, H = 150, pad = {l:40, r:14, t:16, b:34};
  const wrap = document.createElement('div');
  wrap.className = 'pg-chart-wrap';

  if(points.length === 0){
    const empty = document.createElement('div');
    empty.className = 'pg-empty';
    empty.textContent = 'Nincs elég adat a grafikonhoz.';
    wrap.appendChild(empty);
    return wrap;
  }

  const vals = points.map(p=>p.value);
  let min = Math.min(...vals), max = Math.max(...vals);
  if(min === max){ min -= 1; max += 1; }
  const range = max - min;
  min -= range*0.12; max += range*0.12;
  if(min < 0 && Math.min(...vals) >= 0) min = 0;

  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  const x = i => pad.l + (points.length===1 ? plotW/2 : (i/(points.length-1))*plotW);
  const y = v => pad.t + plotH - ((v-min)/(max-min))*plotH;

  const svg = document.createElementNS(SVGNS,'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class','pg-chart');

  // rácsvonalak + y címkék
  [min, (min+max)/2, max].forEach(v=>{
    const gy = y(v);
    const line = document.createElementNS(SVGNS,'line');
    line.setAttribute('x1',pad.l); line.setAttribute('x2',W-pad.r);
    line.setAttribute('y1',gy); line.setAttribute('y2',gy);
    line.setAttribute('class','pg-grid');
    svg.appendChild(line);
    const tx = document.createElementNS(SVGNS,'text');
    tx.setAttribute('x',pad.l-6); tx.setAttribute('y',gy+3);
    tx.setAttribute('class','pg-axis'); tx.setAttribute('text-anchor','end');
    tx.textContent = Math.round(v);
    svg.appendChild(tx);
  });

  // terület a vonal alatt
  const areaPts = points.map((p,i)=>`${x(i)},${y(p.value)}`).join(' ');
  const area = document.createElementNS(SVGNS,'polygon');
  area.setAttribute('points', `${pad.l},${pad.t+plotH} ${areaPts} ${pad.l+plotW},${pad.t+plotH}`);
  area.setAttribute('class','pg-area');
  svg.appendChild(area);

  // vonal
  const poly = document.createElementNS(SVGNS,'polyline');
  poly.setAttribute('points', areaPts);
  poly.setAttribute('class','pg-line');
  svg.appendChild(poly);

  // pontok + x címkék
  points.forEach((p,i)=>{
    const c = document.createElementNS(SVGNS,'circle');
    c.setAttribute('cx',x(i)); c.setAttribute('cy',y(p.value)); c.setAttribute('r',3);
    c.setAttribute('class','pg-dot');
    svg.appendChild(c);
    // x felirat csak néhány ponthoz, hogy ne legyen zsúfolt
    const step = Math.ceil(points.length / 6);
    if(i % step === 0 || i === points.length-1){
      const tx = document.createElementNS(SVGNS,'text');
      tx.setAttribute('x',x(i)); tx.setAttribute('y',H-12);
      tx.setAttribute('class','pg-axis'); tx.setAttribute('text-anchor','middle');
      tx.textContent = p.label;
      svg.appendChild(tx);
    }
  });

  wrap.appendChild(svg);

  // utolsó érték + változás kiemelése
  if(points.length >= 2){
    const last = points[points.length-1].value;
    const prev = points[points.length-2].value;
    const delta = last - prev;
    const info = document.createElement('div');
    info.className = 'pg-delta';
    const sign = delta>0?'+':'';
    info.innerHTML = `Legutóbbi: <b>${Math.round(last*10)/10}${opts.unit||''}</b>` +
      (delta!==0 ? ` <span class="${delta>0?'up':'down'}">${sign}${Math.round(delta*10)/10}</span>` : '');
    wrap.appendChild(info);
  }

  return wrap;
}

// ── 1) Napi össztérfogat időben ──
function buildVolumeChart(){
  const days = getDays();
  const series = [];
  for(let w=1; w<=MAX_WEEKS; w++){
    days.forEach((day, di)=>{
      let vol = 0, any = false;
      day.exercises.forEach((ex, ei)=>{
        for(let s=0; s<ex.sets; s++){
          const kg = getStored(w,di,ei,s,'kg');
          const rp = getStored(w,di,ei,s,'reps');
          if(kg !== null && rp !== null){ vol += kg*rp; any = true; }
        }
      });
      if(any){
        const date = getWorkoutDate(w, di);
        series.push({ iso: date||'', w, label: date ? fmtDate(date).slice(5) : `${w}.h`, value: Math.round(vol) });
      }
    });
  }
  // időrend (dátum szerint, ha van)
  series.sort((a,b)=> (a.iso&&b.iso) ? (a.iso<b.iso?-1:1) : (a.w-b.w));
  return lineChart(series, { unit:' kg' });
}

// ── 2) és 3) Kiválasztott gyakorlat heti max súly / 1RM ──
function weeklyExerciseSeries(di, ei, mode){
  const series = [];
  for(let w=1; w<=MAX_WEEKS; w++){
    const day = getDays()[di];
    if(!day || !day.exercises[ei]) break;
    const sets = day.exercises[ei].sets;
    let best = null;
    for(let s=0; s<sets; s++){
      const kg = getStored(w,di,ei,s,'kg');
      const rp = getStored(w,di,ei,s,'reps');
      if(kg === null) continue;
      const val = mode==='1rm' ? epley1RM(kg, rp ?? 1) : kg;
      if(val !== null && (best === null || val > best)) best = val;
    }
    if(best !== null){
      series.push({ w, label:`${w}.`, value: Math.round(best*10)/10 });
    }
  }
  return series;
}

// ── Fő render ──
export function renderProgress(container){
  container.innerHTML = '';

  // 1) Össztérfogat
  const volSection = document.createElement('div');
  volSection.className = 'pg-section';
  const volTitle = document.createElement('div');
  volTitle.className = 'pg-title';
  volTitle.textContent = 'Napi össztérfogat (kg × ism)';
  volSection.appendChild(volTitle);
  const volHint = document.createElement('div');
  volHint.className = 'pg-hint';
  volHint.textContent = 'Minden gyakorlat súly×ismétlés összege edzésenként. A teljes terhelés trendje.';
  volSection.appendChild(volHint);
  volSection.appendChild(buildVolumeChart());
  container.appendChild(volSection);

  // gyakorlat-választó a 2) és 3) grafikonhoz
  const days = getDays();
  if(days.length === 0) return;
  if(state.progressDay >= days.length) state.progressDay = 0;
  const day = days[state.progressDay];
  if(state.progressEx >= day.exercises.length) state.progressEx = 0;

  const pickerSection = document.createElement('div');
  pickerSection.className = 'pg-section';
  const pickTitle = document.createElement('div');
  pickTitle.className = 'pg-title';
  pickTitle.textContent = 'Gyakorlat fejlődése';
  pickerSection.appendChild(pickTitle);

  // nap + gyakorlat legördülő
  const picker = document.createElement('div');
  picker.className = 'pg-picker';

  const daySel = document.createElement('select');
  daySel.className = 'pg-select';
  days.forEach((d, i)=>{
    const o = document.createElement('option');
    o.value = i; o.textContent = getDayName(i);
    if(i===state.progressDay) o.selected = true;
    daySel.appendChild(o);
  });
  daySel.onchange = ()=>{ state.progressDay = parseInt(daySel.value); state.progressEx = 0; renderProgress(container); };

  const exSel = document.createElement('select');
  exSel.className = 'pg-select';
  day.exercises.forEach((ex, i)=>{
    const o = document.createElement('option');
    o.value = i; o.textContent = getExName(state.progressDay, i);
    if(i===state.progressEx) o.selected = true;
    exSel.appendChild(o);
  });
  exSel.onchange = ()=>{ state.progressEx = parseInt(exSel.value); renderProgress(container); };

  picker.appendChild(daySel);
  picker.appendChild(exSel);
  pickerSection.appendChild(picker);
  container.appendChild(pickerSection);

  // 2) Max súly
  const maxSeries = weeklyExerciseSeries(state.progressDay, state.progressEx, 'max');
  const maxSection = document.createElement('div');
  maxSection.className = 'pg-section';
  const maxTitle = document.createElement('div');
  maxTitle.className = 'pg-subtitle';
  maxTitle.textContent = 'Max súly hetente (kg)';
  maxSection.appendChild(maxTitle);
  maxSection.appendChild(lineChart(maxSeries, { unit:' kg' }));
  container.appendChild(maxSection);

  // 3) Becsült 1RM
  const rmSeries = weeklyExerciseSeries(state.progressDay, state.progressEx, '1rm');
  const rmSection = document.createElement('div');
  rmSection.className = 'pg-section';
  const rmTitle = document.createElement('div');
  rmTitle.className = 'pg-subtitle';
  rmTitle.textContent = 'Becsült 1RM hetente (kg)';
  rmSection.appendChild(rmTitle);
  const rmHint = document.createElement('div');
  rmHint.className = 'pg-hint';
  rmHint.textContent = 'Becsült maximális erő (Epley): súly × (1 + ismétlés/30). A nyers erő trendjét mutatja.';
  rmSection.appendChild(rmHint);
  rmSection.appendChild(lineChart(rmSeries, { unit:' kg' }));
  container.appendChild(rmSection);
}
