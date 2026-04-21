// Firebase Realtime Database — live-синхронизация между устройствами
// Проект: ai-boost-8195c (ИИ-ускорение)
// Правила: test mode (30 дней, allow read/write: true). Для разового урока достаточно.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getDatabase, ref, set, onValue, remove } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

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

// Структура БД:
//   states/
//     ayrat/
//       test/  { answers, done, score, ... }
//       roadmap/ { fields, done, manifest, ... }
//     marat/
//       ...

function userPath(user, kind) {
  return `states/${user.slug}/${kind}`;
}

export function pushState(user, state) {
  const kind = state && state.kind ? state.kind : 'state';
  return set(ref(db, userPath(user, kind)), state);
}

// Подписка на изменения всех участников. callback(allStates) вызывается при любом изменении.
export function subscribeAll(callback) {
  const statesRef = ref(db, 'states');
  return onValue(statesRef, (snapshot) => {
    callback(snapshot.val() || {});
  }, (err) => {
    console.warn('firebase subscribe error', err);
  });
}

// Одноразовое чтение всех состояний (не realtime)
export function readAllOnce() {
  return new Promise((resolve) => {
    const statesRef = ref(db, 'states');
    onValue(statesRef, (snapshot) => resolve(snapshot.val() || {}), { onlyOnce: true });
  });
}

// Полный сброс базы — используется кнопкой на host-панели перед уроком
export function resetAll() {
  return remove(ref(db, 'states'));
}
