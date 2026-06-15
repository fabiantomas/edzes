// ════════════════════════════════════════════
//  EDZÉS NÉZET
// ════════════════════════════════════════════

import { state } from './state.js';
import {
  getStored, setStored, getCurrent, getPrev,
  setWorking, clearCell,
  getBodyweight, setBodyweight,
  getNote, setNote,
  getCheck, setCheck,
  getWorkoutDate, setWorkoutDate, todayISO, fmtDate,
} from './storage.js';
import { getExName, setExName } from './names.js';
import { getDays, addExercise, addStretchExercise, deleteExercise, moveExercise } from './plans.js';
import { STRETCHES, groupForExercise } from './stretch-data.js';
import {
  ICON_DUMBBELL_SM, ICON_CHEVRON_UP, ICON_CHEVRON_DOWN,
  ICON_NOTE, ICON_PLUS, ICON_TRASH, ICON_CLOSE, ICON_CHECK,
} from './icons.js';
const ICON_CHECK_SM = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
import { showToast } from './toast.js';
import { registerRenderer, renderExNav, renderSlides, updateNavBtns, updateProgress } from './ui.js';
import { exportData } from './backup.js';
import { openExercisePicker } from './exercise-picker.js';

function curDay(){ return getDays()[state.currentDay]; }

// ── Gyakorlat-sáv (pill-ek) ──
function doRenderExNav(){
  const nav = document.getElementById('exNav');
  nav.innerHTML = '';
  const day = curDay();
  if(!day) return;

  // Testsúly fül (currentEx === -1)
  const bwPill = document.createElement('div');
  bwPill.className = 'ex-pill bw-pill' + (state.currentEx === -1 ? ' active' : '');
  if(getBodyweight(state.currentWeek,state.currentDay) !== null) bwPill.classList.add('done-pill');
  bwPill.innerHTML = ICON_DUMBBELL_SM + '<span>Testsúly</span>';
  bwPill.onclick = ()=>{ state.currentEx = -1; renderSlides(); renderExNav(); updateNavBtns(); };
  nav.appendChild(bwPill);

  day.exercises.forEach((ex,i)=>{
    const pill = document.createElement('div');
    pill.className = 'ex-pill';
    if(ex.type === 'stretch') pill.classList.add('stretch-pill');
    if(i === state.currentEx) pill.classList.add('active');
    if(isExDone(i)) pill.classList.add('done-pill');

    const dot = document.createElement('span');
    dot.className = 'pill-dot';
    const lbl = document.createElement('span');
    lbl.textContent = (getExName(state.currentDay,i)||'').split(' ')[0];
    pill.appendChild(dot);
    pill.appendChild(lbl);
    pill.onclick = ()=>{ state.currentEx = i; renderSlides(); renderExNav(); updateNavBtns(); };
    nav.appendChild(pill);
  });

  setTimeout(()=>{
    const active = nav.querySelector('.ex-pill.active');
    if(active) active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  },50);
}

function isExDone(ei){
  const day = curDay();
  const ex = day && day.exercises[ei];
  if(!ex) return false;
  if(ex.type === 'stretch'){
    const tasks = ex.tasks || [];
    if(tasks.length === 0) return false;
    for(let t=0;t<tasks.length;t++){
      if(!getCheck(state.currentWeek,state.currentDay,ei,t)) return false;
    }
    return true;
  }
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

  if(state.editMode){
    slide.appendChild(buildEditList());
  } else if(state.currentEx === -1){
    slide.appendChild(buildBodyweightCard());
  } else {
    const day = curDay();
    if(day && day.exercises.length){
      // ha currentEx kívül esik, korrigáljuk
      if(state.currentEx >= day.exercises.length) state.currentEx = day.exercises.length-1;
      slide.appendChild(buildFocusCard(state.currentEx));
    } else {
      slide.appendChild(buildEmptyDay());
    }
  }
  track.appendChild(slide);
}

function buildEmptyDay(){
  const card = document.createElement('div');
  card.className = 'focus-card';
  const p = document.createElement('div');
  p.className = 'empty-hint';
  p.textContent = 'Ehhez a naphoz még nincs gyakorlat. Kapcsold be a szerkesztőt (ceruza) és vegyél fel egyet.';
  card.appendChild(p);
  return card;
}

function buildBodyweightCard(){
  const card = document.createElement('div');
  card.className = 'bw-card-full';

  const label = document.createElement('div');
  label.className = 'bw-full-label';
  label.textContent = 'Mai testsúly';

  const hint = document.createElement('div');
  hint.className = 'bw-hint';
  function refreshHint(){
    const dd = getWorkoutDate(state.currentWeek,state.currentDay);
    hint.textContent = dd ? `Dátum: ${fmtDate(dd)}` : 'A dátum a beíráskor rögzül.';
  }

  const inputWrap = document.createElement('div');
  inputWrap.className = 'bw-input-wrap bw-input-wrap-lg';
  const input = document.createElement('input');
  input.type = 'number';
  input.inputMode = 'decimal';
  input.className = 'bw-input bw-input-lg';
  input.placeholder = '—';
  const cur = getBodyweight(state.currentWeek,state.currentDay);
  if(cur !== null) input.value = cur;
  input.oninput = ()=>{
    setBodyweight(state.currentWeek,state.currentDay, input.value);
    // ha van érték és még nincs dátum, rögzítsük a mait, hogy a statisztikában megjelenjen
    if(input.value !== '' && !getWorkoutDate(state.currentWeek,state.currentDay)){
      setWorkoutDate(state.currentWeek,state.currentDay, todayISO());
    }
    refreshHint();
    renderExNav();
  };
  const unit = document.createElement('span');
  unit.className = 'bw-unit';
  unit.textContent = 'kg';
  inputWrap.appendChild(input);
  inputWrap.appendChild(unit);

  refreshHint();

  card.appendChild(label);
  card.appendChild(inputWrap);
  card.appendChild(hint);
  return card;
}

function buildFocusCard(ei){
  const day = curDay();
  const ex = day.exercises[ei];
  const card = document.createElement('div');
  card.className = 'focus-card is-active-ex';

  // cím sor + komment gomb
  const top = document.createElement('div');
  top.className = 'fc-top';
  const nm = document.createElement('div');
  nm.className = 'fc-name';
  nm.textContent = getExName(state.currentDay,ei);
  top.appendChild(nm);

  const noteBtn = document.createElement('button');
  noteBtn.className = 'fc-note-btn';
  if(getNote(state.currentWeek,state.currentDay,ei)) noteBtn.classList.add('has-note');
  noteBtn.innerHTML = ICON_NOTE;
  noteBtn.onclick = ()=>openNoteModal(ei);
  top.appendChild(noteBtn);
  card.appendChild(top);

  // NYÚJTÁS típus: pipálható részfeladat-lista (nincs súly/ismétlés)
  if(ex.type === 'stretch'){
    card.classList.add('stretch-card');
    const tasks = ex.tasks || [];
    const tlist = document.createElement('div');
    tlist.className = 'task-list';
    if(tasks.length === 0){
      const e = document.createElement('div');
      e.className = 'empty-hint';
      e.textContent = 'Nincs részfeladat. Szerkesztő módban adhatsz hozzá.';
      tlist.appendChild(e);
    }
    tasks.forEach((task, ti)=>{
      const row = document.createElement('button');
      row.className = 'task-row';
      const checked = getCheck(state.currentWeek, state.currentDay, ei, ti);
      if(checked) row.classList.add('done');
      row.innerHTML = `<span class="task-box">${checked ? ICON_CHECK_SM : ''}</span><span class="task-name">${task.replace(/[&<>]/g,'')}</span>`;
      row.onclick = ()=>{
        const now = !getCheck(state.currentWeek, state.currentDay, ei, ti);
        setCheck(state.currentWeek, state.currentDay, ei, ti, now);
        renderSlides(); renderExNav(); updateProgress(); updateNavBtns();
      };
      tlist.appendChild(row);
    });
    card.appendChild(tlist);
    return card;
  }

  // sorozatok
  const list = document.createElement('div');
  list.className = 'sets-list';

  for(let s=0;s<ex.sets;s++){
    const row = document.createElement('div');
    row.className = 'set-row';

    ['kg','reps'].forEach(f=>{ row.appendChild(buildDragCtrl(ei, s, f)); });
    list.appendChild(row);

    // előző sor — EGY chip: "50 kg × 5"
    const prev = document.createElement('div');
    prev.className = 'prev-row';
    const chip = document.createElement('div');
    chip.className = 'prev-chip prev-chip-single';
    const pl = document.createElement('span');
    pl.className = 'prev-label';
    pl.textContent = 'előző:';
    const pv = document.createElement('span');
    pv.className = 'prev-val';
    const pKg = getPrev(state.currentDay,ei,s,'kg');
    const pRp = getPrev(state.currentDay,ei,s,'reps');
    pv.textContent = (pKg!==null || pRp!==null) ? `${pKg??'?'} kg × ${pRp??'?'}` : '—';
    chip.appendChild(pl);
    chip.appendChild(pv);
    prev.appendChild(chip);
    list.appendChild(prev);
  }

  card.appendChild(list);
  return card;
}

// ── Szerkesztő mód: gyakorlat-lista (átnevezés/mozgatás/törlés/hozzáadás) ──
function buildEditList(){
  const wrap = document.createElement('div');
  wrap.className = 'edit-list';

  const day = curDay();
  if(!day){
    const p = document.createElement('div');
    p.className = 'empty-hint';
    p.textContent = 'Nincs kiválasztott nap.';
    wrap.appendChild(p);
    return wrap;
  }

  const title = document.createElement('div');
  title.className = 'edit-list-title';
  title.textContent = `${day.name} — gyakorlatok`;
  wrap.appendChild(title);

  day.exercises.forEach((ex,ei)=>{
    const item = document.createElement('div');
    item.className = 'edit-item';

    const nameInput = document.createElement('input');
    nameInput.className = 'edit-item-name';
    nameInput.value = ex.name;
    nameInput.onchange = ()=>{ setExName(state.currentDay,ei,nameInput.value); renderExNav(); };

    const ctrls = document.createElement('div');
    ctrls.className = 'edit-item-ctrls';

    const up = document.createElement('button');
    up.className = 'ei-btn';
    up.innerHTML = ICON_CHEVRON_UP;
    up.disabled = ei===0;
    up.onclick = ()=>{ moveExercise(state.currentDay,ei,-1); renderSlides(); renderExNav(); };

    const down = document.createElement('button');
    down.className = 'ei-btn';
    down.innerHTML = ICON_CHEVRON_DOWN;
    down.disabled = ei===day.exercises.length-1;
    down.onclick = ()=>{ moveExercise(state.currentDay,ei,1); renderSlides(); renderExNav(); };

    const del = document.createElement('button');
    del.className = 'ei-btn ei-del';
    del.innerHTML = ICON_TRASH;
    del.onclick = ()=>{
      if(confirm(`Törlöd: "${ex.name}"?`)){
        deleteExercise(state.currentDay,ei);
        renderSlides(); renderExNav();
      }
    };

    ctrls.appendChild(up);
    ctrls.appendChild(down);
    ctrls.appendChild(del);

    item.appendChild(nameInput);
    item.appendChild(ctrls);
    wrap.appendChild(item);
  });

  const add = document.createElement('button');
  add.className = 'edit-add';
  add.innerHTML = ICON_PLUS + '<span>Gyakorlat hozzáadása</span>';
  add.onclick = ()=>{
    openExercisePicker((name)=>{
      addExercise(state.currentDay, name);
      renderSlides(); renderExNav();
    });
  };
  wrap.appendChild(add);

  // Nyújtás-gyakorlat hozzáadása: a nap izmaihoz illő részfeladatokkal
  const addStretch = document.createElement('button');
  addStretch.className = 'edit-add edit-add-stretch';
  addStretch.innerHTML = ICON_PLUS + '<span>Nyújtás hozzáadása</span>';
  addStretch.onclick = ()=>{
    const tasks = suggestedStretchTasks();
    addStretchExercise(state.currentDay, 'Nyújtás', tasks);
    renderSlides(); renderExNav();
  };
  wrap.appendChild(addStretch);

  return wrap;
}

// A nap meglévő gyakorlatainak izmai alapján javasolt nyújtás-részfeladatok
function suggestedStretchTasks(){
  const day = curDay();
  if(!day) return [];
  const groups = new Set();
  day.exercises.forEach((ex,ei)=>{
    if(ex.type === 'stretch') return;
    const g = groupForExercise(getExName(state.currentDay, ei));
    if(g) groups.add(g);
  });
  const tasks = [];
  Object.keys(STRETCHES).forEach(g=>{
    if(groups.has(g)) (STRETCHES[g]||[]).forEach(t=> tasks.push(t));
  });
  return tasks;
}

// ── Komment modal ──
function openNoteModal(ei){
  let modal = document.getElementById('noteModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'noteModal';
    modal.className = 'modal-ov';
    modal.innerHTML = `
      <div class="modal-box note-modal-box">
        <div class="note-modal-head">
          <span class="note-modal-title"></span>
          <button class="note-modal-close" aria-label="Bezárás">${ICON_CLOSE}</button>
        </div>
        <textarea class="note-modal-input" rows="5" placeholder="Megjegyzés ehhez a gyakorlathoz…"></textarea>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e=>{ if(e.target===modal) closeNoteModal(); });
    modal.querySelector('.note-modal-close').addEventListener('click', closeNoteModal);
  }
  const ta = modal.querySelector('.note-modal-input');
  modal.querySelector('.note-modal-title').textContent = getExName(state.currentDay,ei);
  ta.value = getNote(state.currentWeek,state.currentDay,ei);
  ta.oninput = ()=>{
    setNote(state.currentWeek,state.currentDay,ei, ta.value);
  };
  modal.classList.add('open');
}
function closeNoteModal(){
  const modal = document.getElementById('noteModal');
  if(modal) modal.classList.remove('open');
  renderSlides(); // a komment-gomb jelölésének frissítése
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
    applyVal(ei,s,f,newVal,true);
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

  // ── Hosszú nyomás → cella értékének törlése (megerősítéssel) ──
  let longPressTimer = null;
  let longPressFired = false;
  function startLongPress(){
    longPressFired = false;
    // csak ha van mit törölni
    if(getCurrent(state.currentDay,ei,s,f) === null) return;
    longPressTimer = setTimeout(()=>{
      longPressFired = true;
      endDrag();                       // a közben indult húzást lezárjuk
      wrap.classList.add('confirm-del');
      const ok = confirm('Törlöd ennek a cellának az értékét?');
      wrap.classList.remove('confirm-del');
      if(ok){
        clearCell(state.currentDay,ei,s,f);
        renderSlides();                // teljes újrarajzolás, hogy az "előző" visszajöjjön
        renderExNav(); updateNavBtns(); updateProgress();
      }
    }, 600);
  }
  function cancelLongPress(){
    if(longPressTimer){ clearTimeout(longPressTimer); longPressTimer = null; }
  }

  let tStartY = 0, tStartX = 0, totalMove = 0;
  wrap.addEventListener('touchstart', e=>{
    if(inpWrap.classList.contains('editing')) return;
    e.preventDefault();
    tStartY = e.touches[0].clientY;
    tStartX = e.touches[0].clientX;
    totalMove = 0;
    startDrag(tStartY);
    startLongPress();
  }, {passive:false});
  wrap.addEventListener('touchmove', e=>{
    if(!dragActive) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const x = e.touches[0].clientX;
    const moved = Math.abs(y - tStartY) + Math.abs(x - tStartX);
    totalMove += moved;
    if(moved > 6) cancelLongPress();   // mozgásnál nem hosszú nyomás
    moveDrag(y);
  }, {passive:false});
  wrap.addEventListener('touchend', ()=>{
    cancelLongPress();
    const wasDragging = dragActive;
    endDrag();
    if(longPressFired) return;          // a törlés már lefutott
    if(wasDragging && totalMove < 8){ openKeyboard(); }
  });
  wrap.addEventListener('touchcancel', ()=>{ cancelLongPress(); endDrag(); });

  let mouseMoved = 0;
  wrap.addEventListener('mousedown', e=>{
    if(inpWrap.classList.contains('editing')) return;
    e.preventDefault();
    mouseMoved = 0;
    startDrag(e.clientY);
    startLongPress();
    const mm = ev=>{ ev.preventDefault(); mouseMoved += Math.abs(ev.movementY); if(mouseMoved>4) cancelLongPress(); moveDrag(ev.clientY); };
    const mu = ()=>{
      cancelLongPress();
      const wasDragging = dragActive;
      endDrag();
      if(!longPressFired && wasDragging && mouseMoved < 4) openKeyboard();
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
  const day = curDay();
  const exes = day ? day.exercises.length : 0;
  const prev = state.currentEx;
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
  const day = curDay();
  const exes = day ? day.exercises.length : 0;
  const navBtns = document.getElementById('navBtns');
  // szerkesztő módban nincs léptetés
  navBtns.style.display = (state.editMode || state.currentPage!=='workout') ? 'none' : 'flex';

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
  const day = curDay();
  if(!day){ document.getElementById('progFill').style.width = '0%'; return; }
  let filled=0,total=0;
  day.exercises.forEach((ex,ei)=>{
    if(ex.type === 'stretch'){
      (ex.tasks||[]).forEach((task,ti)=>{
        total++;
        if(getCheck(state.currentWeek,state.currentDay,ei,ti)) filled++;
      });
      return;
    }
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
  const day = curDay();
  if(!day) return false;
  let savedAny = false;
  day.exercises.forEach((ex,ei)=>{
    if(ex.type === 'stretch'){
      // a pipák már mentődnek a setCheck-kel; csak a dátum-rögzítéshez jelezzük
      (ex.tasks||[]).forEach((t,ti)=>{
        if(getCheck(state.currentWeek,state.currentDay,ei,ti)) savedAny = true;
      });
      return;
    }
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

export function finishDay(){
  saveDay(true);

  const day = curDay();
  // van-e már nyújtás-gyakorlat a napban?
  const hasStretch = day && day.exercises.some(ex=>ex.type==='stretch');

  if(day && !hasStretch){
    // automatikusan hozzáadunk egy nyújtást a terhelt izmokhoz, és odaugrunk
    const tasks = suggestedStretchTasks();
    if(tasks.length > 0){
      addStretchExercise(state.currentDay, 'Nyújtás', tasks);
      state.currentEx = curDay().exercises.length - 1;  // az új nyújtásra ugrunk
      renderSlides(); renderExNav(); updateNavBtns(); updateProgress();
      const wp = document.getElementById('workoutPage');
      if(wp) wp.scrollTo({top:0, behavior:'smooth'});
      showToast('Nyújtás hozzáadva – pipáld ki, amit elvégeztél');
      return;
    }
  }

  // van már nyújtás (vagy nincs mit hozzáadni): lezárás + export
  exportData();
  const d = getWorkoutDate(state.currentWeek,state.currentDay);
  showToast(d ? `Kész – mentve és exportálva (${fmtDate(d)})` : 'Kész – mentve és exportálva');
}

registerRenderer('exNav', doRenderExNav);
registerRenderer('slides', doRenderSlides);
registerRenderer('navBtns', doUpdateNavBtns);
registerRenderer('progress', doUpdateProgress);
