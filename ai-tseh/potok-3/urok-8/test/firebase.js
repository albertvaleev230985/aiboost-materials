// Firebase Realtime Database: живая синхронизация финала AI Цеха, поток 3 (16.10.2026)
// Проект: ai-boost-8195c, раздел /tseh-3-l8/

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getDatabase, ref, set, update, get, onValue, remove, runTransaction, serverTimestamp, onDisconnect,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyC7XyCFvIlwAWs-GMih04ok1uavVARP-Ck',
  authDomain: 'ai-boost-8195c.firebaseapp.com',
  databaseURL: 'https://ai-boost-8195c-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'ai-boost-8195c',
  storageBucket: 'ai-boost-8195c.firebasestorage.app',
  messagingSenderId: '595383408579',
  appId: '1:595383408579:web:9652d42b1094d5ff9d4f76',
};

const app = initializeApp(firebaseConfig, 'tseh-3-l8');
const db = getDatabase(app);

export const ROOT = 'tseh-3-l8';

// ===== Структура =====
// tseh-3-l8/
//   session/ { phase, currentQuestion, timerStartedAt, timerDurationSec, showCorrect, epoch }
//     phase: 'lobby' | 'test' | 'test-self' | 'discussion' | 'card' | 'certificate' | 'done'
//     epoch: метка «чистой» сессии; меняется только кнопкой «Очистить всё»
//   meta/seq: счётчик регистраций (номер сертификата)
//   users/{slug}/ { name, joinedAt, seq, answers{qIdx: 0..3}, score, finished, card{...}, certIssued }

// ===== Запасной канал REST (14.10.2026) =====
// У части ноутбуков провайдер режет живое соединение Firebase (websocket). Тогда страница
// опрашивает базу обычными веб-запросами раз в 2 секунды и пишет через них же.
const DBURL = firebaseConfig.databaseURL + '/' + 'tseh-3-l8';
let wsUp = false;
let restUp = false;
onValue(ref(db, '.info/connected'), (snap) => { wsUp = snap.val() === true; });
async function restGet(path) {
  const r = await fetch(`${DBURL}/${path}.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  restUp = true; return r.json();
}
async function restPatch(path, obj) {
  const r = await fetch(`${DBURL}/${path}.json`, { method: 'PATCH', body: JSON.stringify(obj) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  restUp = true; return true;
}
async function restPut(path, val) {
  const r = await fetch(`${DBURL}/${path}.json`, { method: 'PUT', body: JSON.stringify(val) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  restUp = true; return true;
}
const TS = { '.sv': 'timestamp' };
function poll(fn) { fn(); return setInterval(() => { if (!wsUp) fn(); }, 2000); }

export const DEFAULT_SESSION = {
  phase: 'lobby', currentQuestion: -1, timerStartedAt: null, timerDurationSec: 30, showCorrect: false, epoch: 0,
};

export function subscribeConnected(cb) {
  let last = null;
  const emit = () => { const v = wsUp || restUp; if (v !== last) { last = v; cb(v); } };
  onValue(ref(db, '.info/connected'), () => emit());
  setInterval(async () => { if (!wsUp) { try { await restGet('session'); } catch (e) { restUp = false; } } emit(); }, 2000);
}

export function subscribeSession(cb) {
  let lastJson = '';
  const send = (v) => { const s = { ...DEFAULT_SESSION, ...(v || {}) }; const j = JSON.stringify(s); if (j !== lastJson) { lastJson = j; cb(s); } };
  onValue(ref(db, `${ROOT}/session`), (snap) => send(snap.val()));
  poll(async () => { try { send(await restGet('session')); } catch (e) {} });
}

export function setSession(patch) {
  return update(ref(db, `${ROOT}/session`), patch);
}

export async function resetAll() {
  await remove(ref(db, ROOT));
  await set(ref(db, `${ROOT}/session`), { ...DEFAULT_SESSION, epoch: Date.now() });
}

// Регистрация: если человек с таким slug уже есть (перезашёл с другого устройства), данные сохраняются.
export async function registerUser(slug, name) {
  if (!wsUp) {
    const ex = (await restGet(`users/${slug}`)) || {};
    if (ex.name && ex.seq) { await restPatch(`users/${slug}`, { name, lastSeen: TS }); return { ...ex, name }; }
    const data = { name, joinedAt: ex.joinedAt || TS, seq: ex.seq || null, score: ex.score || 0 };
    await restPatch(`users/${slug}`, data);
    return { ...ex, ...data };
  }
  const userRef = ref(db, `${ROOT}/users/${slug}`);
  const snap = await get(userRef);
  const existing = snap.val() || {};
  // Настоящая запись есть только если у неё есть имя и номер (остальное может быть «осколком» присутствия после очистки)
  if (existing.name && existing.seq) {
    await update(userRef, { name, lastSeen: serverTimestamp() });
    return { ...existing, name };
  }
  let seq = existing.seq || null;
  if (!seq) {
    try {
      const res = await runTransaction(ref(db, `${ROOT}/meta/seq`), (cur) => (cur || 0) + 1);
      seq = res.snapshot.val();
    } catch (e) { /* без номера: сертификат возьмёт номер от slug */ }
  }
  const data = { name, joinedAt: existing.joinedAt || serverTimestamp(), seq, score: existing.score || 0 };
  await update(userRef, data);
  return { ...existing, ...data };
}

export function subscribeUser(slug, cb) {
  let lastJson = '';
  const send = (v) => { const j = JSON.stringify(v); if (j !== lastJson) { lastJson = j; cb(v); } };
  const off = onValue(ref(db, `${ROOT}/users/${slug}`), (snap) => send(snap.val()));
  const h = poll(async () => { try { send(await restGet(`users/${slug}`)); } catch (e) {} });
  return () => { off(); clearInterval(h); };
}

export function subscribeUsers(cb) {
  return onValue(ref(db, `${ROOT}/users`), (snap) => cb(snap.val() || {}));
}

export function pushAnswer(slug, qIdx, answer, score, finished) {
  if (!wsUp) return restPatch(`users/${slug}`, { [`answers/${qIdx}`]: answer, score, finished: !!finished, lastSeen: TS });
  return update(ref(db, `${ROOT}/users/${slug}`), {
    [`answers/${qIdx}`]: answer, score, finished: !!finished, lastSeen: serverTimestamp(),
  });
}

export function pushTime(slug, qIdx, sec) {
  if (!wsUp) return restPatch(`users/${slug}/times`, { [qIdx]: sec });
  return update(ref(db, `${ROOT}/users/${slug}/times`), { [qIdx]: sec });
}

export function pushCard(slug, card) {
  if (!wsUp) return restPut(`users/${slug}/card`, card);
  return set(ref(db, `${ROOT}/users/${slug}/card`), card);
}

export function markCertificate(slug, serial) {
  if (!wsUp) return restPatch(`users/${slug}`, { certIssued: true, certSerial: serial });
  return update(ref(db, `${ROOT}/users/${slug}`), { certIssued: true, certSerial: serial });
}

// Присутствие: online=true пока вкладка открыта и есть связь, при обрыве сервер сам ставит false.
export function startPresence(slug) {
  setInterval(() => { if (!wsUp) restPatch(`users/${slug}`, { online: true, lastSeen: TS }).catch(() => {}); }, 15000);
  if (!wsUp) restPatch(`users/${slug}`, { online: true, lastSeen: TS }).catch(() => {});
  const onlineRef = ref(db, `${ROOT}/users/${slug}/online`);
  return onValue(ref(db, '.info/connected'), (snap) => {
    if (snap.val() !== true) return;
    onDisconnect(onlineRef).set(false).then(() => set(onlineRef, true)).catch(() => {});
  });
}
