// Firebase Realtime Database: живая синхронизация финала курса ООО «Перспектива» (команда LT)
// Проект: ai-boost-8195c, раздел /perspektiva-lt-final/

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

const app = initializeApp(firebaseConfig, 'perspektiva-lt-final');
const db = getDatabase(app);

export const ROOT = 'perspektiva-lt-final';

// ===== Структура =====
// perspektiva-lt-final/
//   session/ { phase, currentQuestion, timerStartedAt, timerDurationSec, showCorrect, epoch }
//     phase: 'lobby' | 'test' | 'test-self' | 'discussion' | 'card' | 'certificate' | 'done'
//     epoch: метка «чистой» сессии; меняется только кнопкой «Очистить всё»
//   meta/seq: счётчик регистраций (номер сертификата)
//   users/{slug}/ { name, joinedAt, seq, answers{qIdx: 0..3}, score, finished, card{...}, certIssued }

export const DEFAULT_SESSION = {
  phase: 'lobby', currentQuestion: -1, timerStartedAt: null, timerDurationSec: 30, showCorrect: false, epoch: 0,
};

export function subscribeConnected(cb) {
  return onValue(ref(db, '.info/connected'), (snap) => cb(snap.val() === true));
}

export function subscribeSession(cb) {
  return onValue(ref(db, `${ROOT}/session`), (snap) => cb({ ...DEFAULT_SESSION, ...(snap.val() || {}) }));
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
  return onValue(ref(db, `${ROOT}/users/${slug}`), (snap) => cb(snap.val()));
}

export function subscribeUsers(cb) {
  return onValue(ref(db, `${ROOT}/users`), (snap) => cb(snap.val() || {}));
}

export function pushAnswer(slug, qIdx, answer, score, finished) {
  return update(ref(db, `${ROOT}/users/${slug}`), {
    [`answers/${qIdx}`]: answer, score, finished: !!finished, lastSeen: serverTimestamp(),
  });
}

export function pushTime(slug, qIdx, sec) {
  return update(ref(db, `${ROOT}/users/${slug}/times`), { [qIdx]: sec });
}

export function pushCard(slug, card) {
  return set(ref(db, `${ROOT}/users/${slug}/card`), card);
}

export function markCertificate(slug, serial) {
  return update(ref(db, `${ROOT}/users/${slug}`), { certIssued: true, certSerial: serial });
}

// Присутствие: online=true пока вкладка открыта и есть связь, при обрыве сервер сам ставит false.
export function startPresence(slug) {
  const onlineRef = ref(db, `${ROOT}/users/${slug}/online`);
  return onValue(ref(db, '.info/connected'), (snap) => {
    if (snap.val() !== true) return;
    onDisconnect(onlineRef).set(false).then(() => set(onlineRef, true)).catch(() => {});
  });
}
