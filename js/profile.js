// ════════════════════════════════════════════
//  PROFIL (userID kezelés UI)
// ════════════════════════════════════════════

import { state } from './state.js';
import {
  getUsers, getCurrentUserId, getCurrentUserName,
  renameUser, selectOrCreateUser, deleteUser, BASE_USER_ID,
} from './user.js';
import { loadDayIntoWorking } from './storage.js';
import { ICON_CLOSE, ICON_TRASH } from './icons.js';
import { showToast } from './toast.js';
import { render, showPageWorkout } from './ui.js';

// A profil modal felépítése (egyszer), majd megnyitása.
export function openProfile(){
  let modal = document.getElementById('profileModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'profileModal';
    modal.className = 'modal-ov';
    modal.innerHTML = `
      <div class="modal-box profile-box">
        <div class="profile-head">
          <span class="profile-title">Profil</span>
          <button class="profile-close" aria-label="Bezárás">${ICON_CLOSE}</button>
        </div>

        <div class="profile-section">
          <div class="profile-label">Jelenlegi profil azonosító (userID)</div>
          <div class="profile-id" id="profileCurrentId"></div>
        </div>

        <div class="profile-section">
          <div class="profile-label">Profil neve</div>
          <input class="profile-input" id="profileNameInput" placeholder="Profil neve">
        </div>

        <div class="profile-section">
          <div class="profile-label">Profil váltása / létrehozása</div>
          <div class="profile-switch-row">
            <input class="profile-input" id="profileSwitchInput" placeholder="userID beírása…" autocapitalize="off" autocomplete="off">
            <button class="profile-go" id="profileGoBtn">Váltás</button>
          </div>
          <div class="profile-hint">Ha létező azonosítót írsz be, arra váltasz. Ha újat, új profil jön létre üres adatokkal.</div>
        </div>

        <div class="profile-section">
          <div class="profile-label">Elérhető profilok</div>
          <div class="profile-list" id="profileList"></div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', e=>{ if(e.target===modal) closeProfile(); });
    modal.querySelector('.profile-close').addEventListener('click', closeProfile);

    modal.querySelector('#profileNameInput').addEventListener('change', (e)=>{
      renameUser(getCurrentUserId(), e.target.value);
      refreshProfile();
    });
    modal.querySelector('#profileGoBtn').addEventListener('click', ()=>{
      const val = modal.querySelector('#profileSwitchInput').value;
      doSwitch(val);
    });
    modal.querySelector('#profileSwitchInput').addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){ doSwitch(e.target.value); }
    });
  }
  refreshProfile();
  modal.classList.add('open');
}

export function closeProfile(){
  const modal = document.getElementById('profileModal');
  if(modal) modal.classList.remove('open');
}

function refreshProfile(){
  const modal = document.getElementById('profileModal');
  if(!modal) return;
  modal.querySelector('#profileCurrentId').textContent = getCurrentUserId();
  modal.querySelector('#profileNameInput').value = getCurrentUserName();
  modal.querySelector('#profileSwitchInput').value = '';

  const list = modal.querySelector('#profileList');
  list.innerHTML = '';
  const users = getUsers();
  const curId = getCurrentUserId();
  users.forEach(u=>{
    const row = document.createElement('div');
    row.className = 'profile-row' + (u.id===curId ? ' active' : '');

    const info = document.createElement('button');
    info.className = 'profile-row-btn';
    info.innerHTML = `<span class="pr-name">${escapeHtml(u.name)}</span><span class="pr-id">${escapeHtml(u.id)}</span>`;
    info.onclick = ()=>doSwitch(u.id);
    row.appendChild(info);

    if(users.length > 1 && u.id !== BASE_USER_ID){
      const del = document.createElement('button');
      del.className = 'profile-del';
      del.innerHTML = ICON_TRASH;
      del.onclick = (e)=>{
        e.stopPropagation();
        if(confirm(`Törlöd a(z) "${u.name}" profilt és MINDEN hozzá tartozó adatot?`)){
          deleteUser(u.id);
          if(u.id===curId){ resetStateForNewUser(); }
          refreshProfile();
          render();
        }
      };
      row.appendChild(del);
    }
    list.appendChild(row);
  });
}

function doSwitch(rawId){
  const id = selectOrCreateUser(rawId);
  if(!id){ showToast('Érvénytelen azonosító'); return; }
  resetStateForNewUser();
  render();
  closeProfile();
  showToast('Profil: ' + getCurrentUserName());
}

function resetStateForNewUser(){
  state.currentDay = 0;
  state.currentEx = 0;
  state.editMode = false;
  const be = document.getElementById('btnEdit');
  if(be) be.classList.remove('active');
  loadDayIntoWorking();
  showPageWorkout();
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
