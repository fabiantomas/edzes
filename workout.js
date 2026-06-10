// ════════════════════════════════════════════
//  EDZÉS NÉZET
// ════════════════════════════════════════════

import { DAYS } from './data.js';
import { state } from './state.js';
import {
  getStored, setStored, getCurrent, getPrev,
  getWorking, setWorking,
  getBodyweight, setBodyweight,
  getNote, setNote,
  getWorkoutDate, setWorkoutDate, todayISO, fmtDate,
} from './storage.js';
import { getExName, setExName } from './names.js';
import { ICON_DUMBBELL_SM, ICON_CHEVRON_UP, ICON_CHEVRON_DOWN } from './icons.js';
import { showToast } from './toast.js';
import { registerRenderer, renderExNav, renderSlides, updateNavBtns, updateProgress } from './ui.js';
import { exportData } from './backup.js';

// ── Gyakorlat-sáv (pill-ek) ──
function doRenderExNav(){
  const nav = document.getElementById('exNav');
  nav.innerHTML = '';

  // Testsúly fül (currentEx === -1)
  const bwPill = document.createElement('div');
  bwPill.className = 'ex-pill bw-pill' + (state.currentEx === -1 ? ' active' : '');
  if(getBodyweight(state.currentWeek,state.currentDay) !== null) bwPill.classList.add('done-pill');
  bwPill.innerHTML = ICON_DUMBBELL_SM + '<span>Testsúly</span>';
  bwPill.onclick = ()=>{ state.currentEx = -1; renderSlides(); renderExNav(); updateNavBtns(); };
  nav.appendChild(bwPill);

  DAYS[state.currentDay].exercises.forEach((ex,i)=>{
    const pill = document.createElement('div');
    pill.className = 'ex-pill';
    if(i === state.currentEx) pill.classList.add('active');
    if(isExDone(i)) pill.classList.add('done-pill');

    const dot = document.createElement('span');
    dot.className = 'pill-dot';
    const lbl = document.createElement('span');
    lbl.textContent = (i+1)+'. '+getExName(state.currentDay,i).split(' ')[0];
    pill.appendChild(dot);
    pill.appendChild(lbl);
    pill.onclick = ()=>{ state.currentEx = i; renderSlides(); renderExNav(); updateNavBtns(); };
    nav.appendChild(pill);
  });

  // aktív pill láthatóvá görgetése
  setTimeout(()=>{
    const active = nav.querySelector('.ex-pill.active');
    if(active) active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  },50);
}

function isExDone(ei){
  const ex = DAYS[state.currentDay].exercises[ei];
  for(let s=0;s<ex.sets;s++){
    for(const f of ['kg','reps']){
      if(getCurrent(state.currentDay,ei,s,f) === null) return false;
    }
  }
  return true;
}

// ── Aktuális kártya ──
function doRenderSlides(){
  const track = document.getElementById('swipeTrack');
  track.innerHTML = '';
  const slide = document.createElement('div');
  slide.className = 'ex-slide';
  if(state.currentEx === -1){
    slide.appendChild(buildBodyweightCard());
  } else {
    slide.appendChild(buildFocusCard(state.currentEx));
  }
  track.appendChild(slide);
}

function buildBodyweightCard(){
  const card = document.createElement('div');
  card.className = 'bw-card-full';

  const label = document.createElement('div');
  label.className = 'bw-full-label';
  label.textContent = 'Mai testsúly';

  const inputWrap = document.createElement('div');
  inputWrap.className = 'bw-input-wrap bw-input-wrap-lg';
  const input = document.createElement('input');
  input.type = 'number';
  input.inputMode = 'decimal';
  input.className = 'bw-input bw-input-lg';
  input.placeholder = '—';
  const cur = getBodyweight(state.currentWeek,state.currentDay);
  if(cur !== null) input.value = cur;
  input.oninput = ()=>{ setBodyweight(state.currentWeek,state.currentDay, input.value); renderExNav(); };
  const unit = document.createElement('span');
  unit.className = 'bw-unit';
  unit.textContent = 'kg';
  inputWrap.appendChild(input);
  inputWrap.appendChild(unit);

  const hint = document.createElement('div');
  hint.className = 'bw-hint';
  const dd = getWorkoutDate(state.currentWeek,state.currentDay);
  hint.textContent = dd ? `Edzés dátuma: ${fmtDate(dd)}` : 'A dátum mentéskor rögzül.';

  card.appendChild(label);
  card.appendChild(inputWrap);
  card.appendChild(hint);
  return card;
}

function buildFocusCard(ei){
  const ex = DAYS[state.currentDay].exercises[ei];
  const card = document.createElement('div');
  card.className = 'focus-card' + (ei===state.currentEx ? ' is-active-ex' : '');
  card.id = `fcard_${ei}`;

  // cím sor
  const top = document.createElement('div');
  top.className = 'fc-top';
  if(state.editMode){
    const nmInput = document.createElement('input');
    nmInput.className = 'fc-name-input';
    nmInput.value = getExName(state.currentDay,ei);
    nmInput.placeholder = 'Gyakorlat neve';
    nmInput.onchange = ()=>{ setExName(state.currentDay,ei,nmInput.value); renderExNav(); };
    top.appendChild(nmInput);
  } else {
    const nm = document.createElement('div');
    nm.className = 'fc-name';
    nm.textContent = getExName(state.currentDay,ei);
    top.appendChild(nm);
  }
  card.appendChild(top);

  // sorozatok
  const list = document.createElement('div');
  list.className = 'sets-list';

  for(let s=0;s<ex.sets;s++){
    const row = document.createElement('div');
    row.className = 'set-row';

    const num = document.createElement('div');
    num.className = 'set-num';
    num.textContent = s+1;
    row.appendChild(num);

    ['kg','reps'].forEach(f=>{ row.appendChild(buildDragCtrl(ei, s, f)); });
    list.appendChild(row);

    // előző sor
    const prev = document.createElement('div');
    prev.className = 'prev-row';
    ['kg','reps'].forEach(f=>{
      const chip = document.createElement('div');
      chip.className = 'prev-chip';
      const pl = document.createElement('div');
      pl.className = 'prev-label';
      pl.textContent = 'előző';
      const pv = document.createElement('div');
      pv.className = 'prev-val';
      const pVal = getPrev(state.currentDay,ei,s,f);
      pv.textContent = pVal !== null ? pVal + (f==='kg'?' kg':' ism') : '—';
      chip.appendChild(pl);
      chip.appendChild(pv);
      prev.appendChild(chip);
    });
    list.appendChild(prev);
  }

  card.appendChild(list);

  // komment mező (nem szerkesztő módban)
  if(!state.editMode){
    const noteWrap = document.createElement('div');
    noteWrap.className = 'note-wrap';
    const noteTa = document.createElement('textarea');
    noteTa.className = 'note-input';
    noteTa.placeholder = 'Megjegyzés ehhez a gyakorlathoz…';
    noteTa.rows = 2;
    noteTa.value = getNote(state.currentWeek,state.currentDay,ei);
    noteTa.oninput = ()=>{ setNote(state.currentWeek,state.currentDay,ei, noteTa.value); };
    noteWrap.appendChild(noteTa);
    card.appendChild(noteWrap);
  }

  return card;
}

// ── Húzható érték-vezérlő (kg / ismétlés) ──
function buildDragCtrl(ei, s, f){
  const wrap = document.createElement('div');
  wrap.className = 'drag-ctrl';
  wrap.id = `dc_${ei}_${s}_${f}`;

  const curVal = getCurrent(state.currentDay,ei,s,f);
  const prevVal = getPrev(state.currentDay,ei,s,f);

  const valEl = document.createElement('div');
  valEl.className = 'dc-val' + (curVal === null ? ' is-prev' : '');
  valEl.id = `dcv_${ei}_${s}_${f}`;
  valEl.textContent = curVal !== null ? curVal : (prevVal !== null ? prevVal : '—');

  const unitEl = document.createElement('div');
  unitEl.className = 'dc-unit';
  unitEl.textContent = f==='kg' ? 'kg' : 'ism';

  const arrows = document.createElement('div');
  arrows.className = 'dc-arrows';
  arrows.innerHTML = ICON_CHEVRON_UP + ICON_CHEVRON_DOWN;

  // Rejtett input a billentyűzetes bevitelhez
  const inpWrap = document.createElement('div');
  inpWrap.className = 'dc-input-wrap';
  const inp = document.createElement('input');
  inp.type = 'number';
  inp.inputMode = f==='kg' ? 'decimal' : 'numeric';
  inp.autocomplete = 'off';
  inpWrap.appendChild(inp);

  inp.addEventListener('input', ()=>{
    const v = parseFloat(inp.value);
    if(!isNaN(v)) applyVal(ei,s,f,v,true);
  });
  inp.addEventListener('blur', ()=>{
    inp.value='';
    inpWrap.classList.remove('editing');
    updateProgress(); renderExNav(); updateNavBtns();
  });

  wrap.appendChild(valEl);
  wrap.appendChild(unitEl);
  wrap.appendChild(arrows);
  wrap.appendChild(inpWrap);

  if(curVal !== null) wrap.classList.add('filled');

  // ── Húzás logika ──
  const step = f==='kg' ? 0.5 : 1;
  const DRAG_PX = 10;
  let dragActive = false;
  let dragStart = null;
  let dragBaseVal = null;

  function startDrag(clientY){
    const cv = getCurrent(state.currentDay,ei,s,f);
    const pv = getPrev(state.currentDay,ei,s,f);
    dragBaseVal = cv !== null ? cv : (pv !== null ? pv : 0);
    dragStart = clientY;
    dragActive = true;
    wrap.classList.add('dragging');
  }

  function moveDrag(clientY){
    if(!dragActive) return;
    const delta = dragStart - clientY;
    const steps = Math.round(delta / DRAG_PX);
    let newVal = dragBaseVal + steps * step;
    newVal = f==='kg' ? Math.round(newVal*2)/2 : Math.max(0,Math.round(newVal));
    if(newVal < 0) newVal = 0;
    applyVal(ei,s,f,newVal,true); // némán húzás közben
  }

  function endDrag(){
    dragActive = false;
    dragStart = null;
    dragBaseVal = null;
    wrap.classList.remove('dragging');
    updateProgress();
    renderExNav();
    updateNavBtns();
  }

  function openKeyboard(){
    inpWrap.classList.add('editing');
    const cur = getCurrent(state.currentDay,ei,s,f);
    inp.value = cur !== null ? cur : '';
    inp.focus();
    inp.select && inp.select();
  }

  // Húzás = érték; koppintás (alig mozdul) = billentyűzet
  let tStartY = 0, tStartX = 0, totalMove = 0;

  wrap.addEventListener('touchstart', e=>{
    if(inpWrap.classList.contains('editing')) return;
    e.preventDefault();
    tStartY = e.touches[0].clientY;
    tStartX = e.touches[0].clientX;
    totalMove = 0;
    startDrag(tStartY);
  }, {passive:false});

  wrap.addEventListener('touchmove', e=>{
    if(!dragActive) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const x = e.touches[0].clientX;
    totalMove += Math.abs(y - tStartY) + Math.abs(x - tStartX);
    moveDrag(y);
  }, {passive:false});

  wrap.addEventListener('touchend', ()=>{
    const wasDragging = dragActive;
    endDrag();
    if(wasDragging && totalMove < 8){ openKeyboard(); }
  });
  wrap.addEventListener('touchcancel', ()=>endDrag());

  // Egér (asztali teszt)
  let mouseMoved = 0;
  wrap.addEventListener('mousedown', e=>{
    if(inpWrap.classList.contains('editing')) return;
    e.preventDefault();
    mouseMoved = 0;
    startDrag(e.clientY);
    const mm = ev=>{ ev.preventDefault(); mouseMoved += Math.abs(ev.movementY); moveDrag(ev.clientY); };
    const mu = ()=>{
      const wasDragging = dragActive;
      endDrag();
      if(wasDragging && mouseMoved < 4) openKeyboard();
      window.removeEventListener('mousemove',mm);
      window.removeEventListener('mouseup',mu);
    };
    window.addEventListener('mousemove',mm);
    window.addEventListener('mouseup',mu);
  });

  return wrap;
}

function applyVal(ei,s,f,val,silent=false){
  setWorking(state.currentDay,ei,s,f,val);
  const valEl = document.getElementById(`dcv_${ei}_${s}_${f}`);
  const ctrl = document.getElementById(`dc_${ei}_${s}_${f}`);
  if(valEl){
    valEl.textContent = val;
    valEl.classList.remove('is-prev');
  }
  if(ctrl) ctrl.classList.add('filled');
  if(!silent){
    updateProgress();
    renderExNav();
    updateNavBtns();
  }
}

// ── Léptetés / gombok ──
export function goEx(dir){
  const exes = DAYS[state.currentDay].exercises.length;
  const prev = state.currentEx;
  // Az utolsó gyakorlatnál a "Kész" (előre lépés) befejezi a napot
  if(dir > 0 && state.currentEx === exes-1){
    finishDay();
    return;
  }
  state.currentEx = Math.max(-1, Math.min(exes-1, state.currentEx+dir));
  if(state.currentEx !== prev){
    renderSlides();
    renderExNav();
    updateNavBtns();
    const wp = document.getElementById('workoutPage');
    if(wp) wp.scrollTo({top:0, behavior:'smooth'});
  }
}

function doUpdateNavBtns(){
  const exes = DAYS[state.currentDay].exercises.length;
  document.getElementById('btnPrevEx').style.opacity = state.currentEx===-1 ? '.3' : '1';
  const nextBtn = document.getElementById('btnNextEx');
  const lbl = document.getElementById('nextLabel');
  if(state.currentEx === exes-1){
    lbl.textContent = 'Kész';
    nextBtn.style.background = 'var(--blue)';
  } else {
    lbl.textContent = 'Következő';
    nextBtn.style.background = 'var(--accent)';
  }
}

function doUpdateProgress(){
  const day = DAYS[state.currentDay];
  let filled=0,total=0;
  day.exercises.forEach((ex,ei)=>{
    for(let s=0;s<ex.sets;s++){
      ['kg','reps'].forEach(f=>{
        total++;
        if(getCurrent(state.currentDay,ei,s,f) !== null) filled++;
      });
    }
  });
  const pct = total>0 ? (filled/total)*100 : 0;
  document.getElementById('progFill').style.width = pct+'%';
}

// ── Mentés ──
export function saveDay(silent=false){
  const day = DAYS[state.currentDay];
  let savedAny = false;
  day.exercises.forEach((ex,ei)=>{
    for(let s=0;s<ex.sets;s++){
      ['kg','reps'].forEach(f=>{
        const v = getCurrent(state.currentDay,ei,s,f);
        if(v !== null){ setStored(state.currentWeek,state.currentDay,ei,s,f,v); savedAny = true; }
      });
    }
  });
  if(savedAny && !getWorkoutDate(state.currentWeek,state.currentDay)){
    setWorkoutDate(state.currentWeek,state.currentDay,todayISO());
  }
  if(!silent){
    const d = getWorkoutDate(state.currentWeek,state.currentDay);
    showToast(d ? `Mentve – ${fmtDate(d)}` : 'Mentve');
  }
  return savedAny;
}

// ── Nap befejezése: mentés + biztonsági export fájlba ──
export function finishDay(){
  saveDay(true);                 // némán ment
  exportData();                  // letölti a teljes biztonsági mentést
  const d = getWorkoutDate(state.currentWeek,state.currentDay);
  showToast(d ? `Kész – mentve és exportálva (${fmtDate(d)})` : 'Kész – mentve és exportálva');
}

// Renderelők regisztrálása az UI koordinátorba
registerRenderer('exNav', doRenderExNav);
registerRenderer('slides', doRenderSlides);
registerRenderer('navBtns', doUpdateNavBtns);
registerRenderer('progress', doUpdateProgress);
