// ════════════════════════════════════════════
//  STATISZTIKA NÉZET
// ════════════════════════════════════════════

import { DAYS, BASE_HISTORY, MAX_WEEKS } from './data.js';
import { state } from './state.js';
import {
  getStored, getNote,
  getWorkoutDate, setWorkoutDate, fmtDate,
  allBodyweights,
} from './storage.js';
import { getDayName, getExName } from './names.js';
import { registerRenderer } from './ui.js';

// ── Testsúly szekció (lista + vonaldiagram) ──
function buildBodyweightSection(){
  const wrap = document.createElement('div');

  const title = document.createElement('div');
  title.className = 'hist-section-title';
  title.textContent = 'Testsúly';
  wrap.appendChild(title);

  const data = allBodyweights().filter(x=>x.iso); // csak dátummal rendelkezők

  const box = document.createElement('div');
  box.className = 'bw-box';

  if(data.length === 0){
    const empty = document.createElement('div');
    empty.className = 'bw-empty';
    empty.textContent = 'Még nincs rögzített testsúly. Az edzés Testsúly fülén tudod megadni.';
    box.appendChild(empty);
    wrap.appendChild(box);
    return wrap;
  }

  if(data.length >= 2){
    box.appendChild(buildBwChart(data));
  }

  // időrendi lista, legfrissebb felül
  const list = document.createElement('div');
  list.className = 'bw-list';
  [...data].reverse().forEach((x,idx,arr)=>{
    const rowEl = document.createElement('div');
    rowEl.className = 'bw-row';
    const dEl = document.createElement('div');
    dEl.className = 'bw-row-date';
    dEl.textContent = fmtDate(x.iso);
    const wEl = document.createElement('div');
    wEl.className = 'bw-row-weight';
    const prev = arr[idx+1]; // idő szerint korábbi
    let delta = '';
    if(prev){
      const d = x.weight - prev.weight;
      if(d !== 0) delta = (d>0?'+':'') + (Math.round(d*10)/10) + ' kg';
    }
    wEl.innerHTML = `<span class="bw-w">${x.weight} kg</span>` +
      (delta ? `<span class="bw-delta ${x.weight>prev.weight?'up':'down'}">${delta}</span>` : '');
    rowEl.appendChild(dEl);
    rowEl.appendChild(wEl);
    list.appendChild(rowEl);
  });
  box.appendChild(list);

  wrap.appendChild(box);
  return wrap;
}

function buildBwChart(data){
  const W = 320, H = 130, pad = {l:34,r:12,t:14,b:22};
  const weights = data.map(d=>d.weight);
  let min = Math.min(...weights), max = Math.max(...weights);
  if(min===max){ min-=1; max+=1; }
  const range = max-min;
  min -= range*0.15; max += range*0.15;
  const plotW = W-pad.l-pad.r, plotH = H-pad.t-pad.b;
  const x = i => pad.l + (data.length===1?plotW/2:(i/(data.length-1))*plotW);
  const y = v => pad.t + plotH - ((v-min)/(max-min))*plotH;

  const svgns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgns,'svg');
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  svg.setAttribute('class','bw-chart');

  // segédvonalak + y címkék (min, közép, max)
  [min, (min+max)/2, max].forEach(v=>{
    const gy = y(v);
    const line = document.createElementNS(svgns,'line');
    line.setAttribute('x1',pad.l); line.setAttribute('x2',W-pad.r);
    line.setAttribute('y1',gy); line.setAttribute('y2',gy);
    line.setAttribute('class','bw-grid');
    svg.appendChild(line);
    const tx = document.createElementNS(svgns,'text');
    tx.setAttribute('x',pad.l-6); tx.setAttribute('y',gy+3);
    tx.setAttribute('class','bw-axis'); tx.setAttribute('text-anchor','end');
    tx.textContent = (Math.round(v*10)/10);
    svg.appendChild(tx);
  });

  // vonal
  const pts = data.map((d,i)=>`${x(i)},${y(d.weight)}`).join(' ');
  const poly = document.createElementNS(svgns,'polyline');
  poly.setAttribute('points',pts);
  poly.setAttribute('class','bw-line');
  svg.appendChild(poly);

  // pontok
  data.forEach((d,i)=>{
    const c = document.createElementNS(svgns,'circle');
    c.setAttribute('cx',x(i)); c.setAttribute('cy',y(d.weight)); c.setAttribute('r',3);
    c.setAttribute('class','bw-dot');
    svg.appendChild(c);
  });

  return svg;
}

// ── Fő render ──
function doRenderHistory(){
  const page = document.getElementById('historyPage');
  page.innerHTML = '';

  // testsúly legfelül
  page.appendChild(buildBodyweightSection());

  DAYS.forEach((dayDef, di)=>{
    const section = document.createElement('div');

    const title = document.createElement('div');
    title.className = 'hist-section-title';
    title.textContent = getDayName(di);
    section.appendChild(title);

    // mely hetekben van adat ehhez a naphoz
    let weeksWithData = [];
    for(let w=1;w<=MAX_WEEKS;w++){
      let hasAny = false;
      dayDef.exercises.forEach((ex,ei)=>{
        for(let s=0;s<ex.sets;s++){
          if(getStored(w,di,ei,s,'kg') !== null){ hasAny=true; }
        }
      });
      if(hasAny) weeksWithData.push(w);
    }
    if(weeksWithData.length===0) weeksWithData = [state.currentWeek];

    // utolsó 4 hét + aktuális
    const showWeeks = [...new Set([...weeksWithData.slice(-4), state.currentWeek])].sort((a,b)=>a-b);

    const tbl = document.createElement('div');
    tbl.className = 'hist-table';
    tbl.style.setProperty('--wk', showWeeks.length);

    // fejléc sor
    const headRow = document.createElement('div');
    headRow.className = 'hist-row hist-head';

    const hEx = document.createElement('div');
    hEx.className = 'hist-cell';
    hEx.textContent = 'Gyakorlat';
    headRow.appendChild(hEx);
    showWeeks.forEach(w=>{
      const hw = document.createElement('div');
      hw.className = 'hist-cell hist-week-head';
      const wlbl = document.createElement('div');
      wlbl.className = 'hist-week-lbl';
      wlbl.textContent = `${w}. hét`;
      hw.appendChild(wlbl);
      const dInput = document.createElement('input');
      dInput.type = 'date';
      dInput.className = 'hist-date-input';
      const cur = getWorkoutDate(w,di);
      if(cur) dInput.value = cur;
      dInput.onchange = ()=>{ setWorkoutDate(w,di,dInput.value); };
      hw.appendChild(dInput);
      headRow.appendChild(hw);
    });
    tbl.appendChild(headRow);

    // gyakorlat sorok
    dayDef.exercises.forEach((ex,ei)=>{
      const row = document.createElement('div');
      row.className = 'hist-row';

      const nameCell = document.createElement('div');
      nameCell.className = 'hist-cell hist-ex-name';
      nameCell.textContent = getExName(di,ei);
      row.appendChild(nameCell);

      showWeeks.forEach(w=>{
        const cell = document.createElement('div');
        cell.className = 'hist-cell hist-val';
        let lines = [];
        for(let s=0;s<ex.sets;s++){
          const kg = w===1 && getStored(w,di,ei,s,'kg')===null
            ? (BASE_HISTORY[ex.name]?.[s]?.[0] ?? null)
            : getStored(w,di,ei,s,'kg');
          const rp = w===1 && getStored(w,di,ei,s,'reps')===null
            ? (BASE_HISTORY[ex.name]?.[s]?.[1] ?? null)
            : getStored(w,di,ei,s,'reps');
          if(kg !== null || rp !== null){
            lines.push(`${kg??'?'} kg × ${rp??'?'}`);
          }
        }
        if(lines.length){
          cell.innerHTML = lines.map(l=>`<div>${l}</div>`).join('');
          cell.classList.add('has-data');
          if(w===state.currentWeek) cell.style.color='var(--accent)';
        } else {
          cell.textContent = '—';
        }
        // komment jelölés + tap-and-hold
        const note = getNote(w,di,ei);
        if(note){
          cell.classList.add('has-note');
          const marker = document.createElement('span');
          marker.className = 'note-marker';
          cell.appendChild(marker);
          attachNotePress(cell, note);
        }
        row.appendChild(cell);
      });

      tbl.appendChild(row);
    });

    section.appendChild(tbl);
    page.appendChild(section);
  });
}

// ── Komment tap-and-hold tooltip ──
function ensureNoteTip(){
  let tip = document.getElementById('noteTip');
  if(!tip){
    tip = document.createElement('div');
    tip.id = 'noteTip';
    tip.className = 'note-tip';
    document.body.appendChild(tip);
  }
  return tip;
}
function showNoteTip(text, x, y){
  const tip = ensureNoteTip();
  tip.textContent = text;
  tip.classList.add('show');
  const tw = Math.min(260, window.innerWidth-24);
  tip.style.maxWidth = tw+'px';
  let left = x - tw/2;
  left = Math.max(12, Math.min(left, window.innerWidth - tw - 12));
  tip.style.left = left+'px';
  tip.style.top = (y - 12)+'px';
  tip.style.transform = 'translateY(-100%)';
}
function hideNoteTip(){
  const tip = document.getElementById('noteTip');
  if(tip) tip.classList.remove('show');
}
function attachNotePress(el, note){
  let timer = null;
  const start = (cx,cy)=>{ timer = setTimeout(()=>{ showNoteTip(note, cx, cy); }, 280); };
  const cancel = ()=>{ if(timer){ clearTimeout(timer); timer=null; } hideNoteTip(); };

  el.addEventListener('touchstart', e=>{
    const t = e.touches[0];
    start(t.clientX, t.clientY);
  }, {passive:true});
  el.addEventListener('touchend', cancel);
  el.addEventListener('touchcancel', cancel);
  el.addEventListener('touchmove', cancel, {passive:true});
  el.addEventListener('mousedown', e=> start(e.clientX, e.clientY));
  el.addEventListener('mouseup', cancel);
  el.addEventListener('mouseleave', cancel);
}

registerRenderer('history', doRenderHistory);
