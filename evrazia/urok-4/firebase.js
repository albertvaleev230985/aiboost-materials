// Firebase Realtime Database — live-синхронизация финального урока ГК Евразия
// Проект: ai-boost-8195c, раздел /evrazia-urok-4/
// Правила: test mode (продлены до ~10.06.2026)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getDatabase, ref, set, update, push, onValue, remove, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyC7XyCFvIlwAWs-GMih04ok1uavVARP-Ck',
  authDomain: 'ai-boost-8195c.firebaseapp.com',
  databaseURL: 'https://ai-boost-8195c-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'ai-boost-8195c',
  storageBucket: 'ai-boost-8195c.firebasestorage.app',
  messagingSenderId: '595383408579',
  appId: '1:595383408579:web:9652d42b1094d5ff9d4f76',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ROOT = 'evrazia-urok-4';

// ===== Структура БД =====
// evrazia-urok-4/
//   session/
//     phase: 'lobby' | 'test' | 'discussion' | 'card' | 'certificate' | 'done'
//     currentQuestion: -1 | 0..19   (-1 = нет активного вопроса, ждём кнопку «начать»)
//     timerStartedAt: epoch ms       (когда хост запустил таймер; null = таймер не идёт)
//     timerDurationSec: 30
//     showCorrect: false             (хост может включить «показать правильный»)
//   users/
//     {slug}/
//       name: 'Иван Иванов'
//       joinedAt: epoch
//       answers/        (test answers, индекс = номер вопроса, значение = 0..3)
//       score: number
//       card/
//         feedbackUseful: '...'
//         feedbackImprove: '...'
//         triedAutomations: '...'
//         testedImplementation: '...'
//         juneTasks: '...'
//         teamScenario: '...'
//         filledCount: 0..6

// ===== Сессия =====
export function subscribeSession(callback) {
  return onValue(ref(db, `${ROOT}/session`), (snap) => {
    callback(snap.val() || { phase: 'lobby', currentQuestion: -1, timerStartedAt: null, timerDurationSec: 30, showCorrect: false });
  });
}

export function setSession(patch) {
  return update(ref(db, `${ROOT}/session`), patch);
}

export function resetAll() {
  return remove(ref(db, ROOT));
}

// ===== Пользователи =====
export function registerUser(slug, name) {
  return set(ref(db, `${ROOT}/users/${slug}`), {
    name,
    joinedAt: serverTimestamp(),
    answers: {},
    score: 0,
  });
}

export function subscribeUsers(callback) {
  return onValue(ref(db, `${ROOT}/users`), (snap) => callback(snap.val() || {}));
}

export function pushAnswer(slug, qIdx, answer) {
  return update(ref(db, `${ROOT}/users/${slug}/answers`), { [qIdx]: answer });
}

export function setUserScore(slug, score) {
  return update(ref(db, `${ROOT}/users/${slug}`), { score });
}

export function pushCard(slug, card) {
  return set(ref(db, `${ROOT}/users/${slug}/card`), card);
}
