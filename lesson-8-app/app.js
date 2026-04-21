// Общие утилиты веб-приложения занятия 8

const LS_PREFIX = 'aiboost8:';

export function lsKey(user, what) {
  return `${LS_PREFIX}${user.slug}:${what}`;
}

export function saveLocal(user, what, data) {
  try {
    localStorage.setItem(lsKey(user, what), JSON.stringify({ data, ts: Date.now() }));
  } catch (e) { console.warn('localStorage save failed', e); }
}

export function loadLocal(user, what) {
  try {
    const raw = localStorage.getItem(lsKey(user, what));
    if (!raw) return null;
    return JSON.parse(raw).data;
  } catch (e) { return null; }
}

export function renderHeader(user) {
  const el = document.getElementById('app-header');
  if (!el) return;
  el.innerHTML = `
    <div class="brand"><span class="brand-dot"></span>neovida · AI Boost · занятие 8</div>
    ${user ? `<div class="user-chip"><div class="user-ava">${user.name[0]}</div>${user.name}</div>` : ''}
  `;
}

export function notFoundUser() {
  document.querySelector('.wrap').innerHTML = `
    <div class="card outline-accent">
      <div class="card-tag accent">Нет доступа</div>
      <div class="card-title">Ссылка без пользователя</div>
      <div class="card-body">
        Ты открыл страницу без своей персональной ссылки. Получи свой QR-код или ссылку у&nbsp;Альберта и&nbsp;открой ещё раз.
      </div>
    </div>
  `;
}

// Синхронизация: localStorage (офлайн-фолбэк) + Firebase Realtime (live на host)
import { pushState } from './firebase.js';

export function syncState(user, state) {
  const kind = state && state.kind ? state.kind : 'state';
  saveLocal(user, kind, state);
  // fire-and-forget: если сеть упала — данные остаются в localStorage, ничего не ломается
  pushState(user, state).catch(e => console.warn('firebase push failed', e));
}

export function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
