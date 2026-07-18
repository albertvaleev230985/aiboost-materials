(function () {
  'use strict';

  var STORAGE_KEY = 'ai-tseh-final-live:v1';
  var LEGACY_OUTBOX_KEY = 'ai-tseh-final-live:outbox:v1';
  var OUTBOX_PREFIX = 'ai-tseh-final-live:outbox:v2:';
  var OUTBOX_LOCK_NAME = 'ai-tseh-final-live:outbox-lock:v2';
  var FALLBACK_MUTEX_PREFIX = 'ai-tseh-final-live:outbox-mutex:v2:';
  var FALLBACK_MUTEX_TTL_MS = 120000;
  var FALLBACK_MUTEX_HEARTBEAT_MS = 2000;
  var CHANNEL_NAME = 'ai-tseh-final-live:v1';
  var FIREBASE_ROOT_URL = 'https://ai-boost-8195c-default-rtdb.europe-west1.firebasedatabase.app/ai-tseh-final-2026-07-18';
  var POLL_INTERVAL_MS = 700;
  var subscribers = [];
  var channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(CHANNEL_NAME) : null;
  var pollTimer = null;
  var syncInFlight = null;
  var flushPromise = null;
  var nextOutboxRetryAt = 0;
  var pausePullUntil = 0;
  var lastAppliedSignature = '';
  var localMutationGeneration = 0;
  var tabId = readTabId();
  var ownOutboxKey = OUTBOX_PREFIX + tabId;

  function sessionCode() {
    return 'AIT-' + String(Math.floor(1000 + Math.random() * 9000));
  }

  function readTabId() {
    // Идентификатор принадлежит конкретному document, а не sessionStorage:
    // дублированная вкладка не должна писать в очередь исходной вкладки.
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function defaultState() {
    return {
      version: 1,
      mode: 'cloud-live',
      session: {
        code: sessionCode(),
        phase: 'lobby',
        currentQuestion: -1,
        showCorrect: false,
        timerStartedAt: null,
        timerDurationSec: 30,
        updatedAt: Date.now()
      },
      participants: {}
    };
  }

  function normalise(raw) {
    var base = defaultState();
    if (!raw || typeof raw !== 'object') return base;
    return {
      version: 1,
      mode: 'cloud-live',
      session: Object.assign(base.session, raw.session || {}),
      participants: raw.participants && typeof raw.participants === 'object' ? raw.participants : {}
    };
  }

  function read() {
    try {
      return normalise(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch (error) {
      return defaultState();
    }
  }

  function sharedCacheSignature() {
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  function emit(state) {
    subscribers.forEach(function (subscriber) { subscriber(state); });
  }

  function remoteUrl(path) {
    var suffix = String(path || '').split('/').filter(Boolean).map(encodeURIComponent).join('/');
    return FIREBASE_ROOT_URL + (suffix ? '/' + suffix : '') + '.json';
  }

  function remoteFetch(method, path, value, headers) {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timeout = controller ? window.setTimeout(function () { controller.abort(); }, 8000) : null;
    var options = {
      method: method,
      cache: 'no-store',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {})
    };
    if (controller) options.signal = controller.signal;
    if (value !== undefined) options.body = JSON.stringify(value);
    return fetch(remoteUrl(path), options).finally(function () {
      if (timeout) window.clearTimeout(timeout);
    });
  }

  function remoteRequest(method, path, value) {
    return remoteFetch(method, path, value).then(function (response) {
      if (!response.ok) throw new Error('Firebase ' + method + ' ' + response.status);
      return response.json();
    });
  }

  function participantTransaction(entry, attempt) {
    var retry = Number(attempt || 0);
    return remoteFetch('GET', '', undefined, { 'X-Firebase-ETag': 'true' }).then(function (response) {
      if (!response.ok) throw new Error('Firebase transaction GET ' + response.status);
      var etag = response.headers.get('ETag');
      return response.json().then(function (remoteState) {
        var remoteCode = remoteState && remoteState.session && remoteState.session.code;
        if (!remoteCode || remoteCode !== entry.sessionCode) return { discarded: true };
        remoteState.participants = remoteState.participants && typeof remoteState.participants === 'object'
          ? remoteState.participants
          : {};
        var participantId = String(entry.path || '').split('/').filter(Boolean).slice(1).join('/');
        remoteState.participants[participantId] = entry.value;
        return remoteFetch('PUT', '', remoteState, { 'If-Match': etag }).then(function (putResponse) {
          if (putResponse.status === 412 && retry < 7) {
            return new Promise(function (resolve) {
              window.setTimeout(resolve, 25 + retry * 25);
            }).then(function () { return participantTransaction(entry, retry + 1); });
          }
          if (!putResponse.ok) throw new Error('Firebase transaction PUT ' + putResponse.status);
          return { sent: true };
        });
      });
    });
  }

  function readOutboxQueue(key) {
    try {
      var entries = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(entries) ? entries : [];
    } catch (error) {
      return [];
    }
  }

  function writeOutboxQueue(key, entries) {
    if (entries.length) localStorage.setItem(key, JSON.stringify(entries));
    else localStorage.removeItem(key);
  }

  function outboxKeys() {
    var keys = [];
    for (var index = 0; index < localStorage.length; index += 1) {
      var key = localStorage.key(index);
      if (key === LEGACY_OUTBOX_KEY || (key && key.indexOf(OUTBOX_PREFIX) === 0)) keys.push(key);
    }
    return keys;
  }

  function readOutbox() {
    var entries = [];
    outboxKeys().forEach(function (key) {
      readOutboxQueue(key).forEach(function (entry, queueIndex) {
        entries.push(Object.assign({}, entry, {
          queueKey: key,
          sequence: Number(entry.sequence || queueIndex + 1)
        }));
      });
    });
    return entries.sort(function (left, right) {
      if (left.queueKey === right.queueKey) {
        return Number(left.sequence || 0) - Number(right.sequence || 0) || String(left.id).localeCompare(String(right.id));
      }
      return Number(left.createdAt || 0) - Number(right.createdAt || 0) ||
        String(left.queueKey).localeCompare(String(right.queueKey)) ||
        Number(left.sequence || 0) - Number(right.sequence || 0) ||
        String(left.id).localeCompare(String(right.id));
    });
  }

  function addOutboxEntry(method, path, value, sessionCode) {
    var entries = readOutboxQueue(ownOutboxKey);
    var sequence = entries.reduce(function (highest, entry, queueIndex) {
      return Math.max(highest, Number(entry.sequence || queueIndex + 1));
    }, 0) + 1;
    var createdAt = Date.now();
    entries.push({
      id: tabId + '-' + String(sequence),
      method: method,
      path: path,
      value: value,
      createdAt: createdAt,
      sequence: sequence,
      sessionCode: sessionCode || null
    });
    writeOutboxQueue(ownOutboxKey, entries);
  }

  function removeOutboxEntry(entry) {
    writeOutboxQueue(entry.queueKey, readOutboxQueue(entry.queueKey).filter(function (candidate) {
      return candidate.id !== entry.id;
    }));
  }

  function fallbackMutexKey() {
    return FALLBACK_MUTEX_PREFIX + tabId;
  }

  function readFallbackMutex(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (error) { return null; }
  }

  function writeFallbackMutex(record) {
    localStorage.setItem(fallbackMutexKey(), JSON.stringify(record));
  }

  function activeFallbackMutexes() {
    var records = [];
    var now = Date.now();
    for (var index = 0; index < localStorage.length; index += 1) {
      var key = localStorage.key(index);
      if (!key || key.indexOf(FALLBACK_MUTEX_PREFIX) !== 0) continue;
      var record = readFallbackMutex(key);
      if (!record || Number(record.expiresAt || 0) <= now) {
        localStorage.removeItem(key);
        index -= 1;
        continue;
      }
      records.push(record);
    }
    return records;
  }

  function ownsFallbackMutex(number) {
    var record = readFallbackMutex(fallbackMutexKey());
    return Boolean(record && record.owner === tabId && Number(record.number) === number && Number(record.expiresAt || 0) > Date.now());
  }

  function renewFallbackMutex(number) {
    if (!ownsFallbackMutex(number)) return false;
    writeFallbackMutex({
      owner: tabId,
      choosing: false,
      number: number,
      expiresAt: Date.now() + FALLBACK_MUTEX_TTL_MS
    });
    return true;
  }

  function releaseFallbackMutex(number) {
    if (ownsFallbackMutex(number)) localStorage.removeItem(fallbackMutexKey());
  }

  function contenderPrecedes(record, ownNumber) {
    var otherNumber = Number(record.number || 0);
    if (!otherNumber) return false;
    return otherNumber < ownNumber || (otherNumber === ownNumber && String(record.owner) < String(tabId));
  }

  // Lamport bakery mutex: каждая вкладка публикует собственный ticket.
  // В отличие от read/set lease, две вкладки не могут одновременно объявить
  // себя победителями. TTL очищает вкладки, закрытые во время ожидания, а
  // heartbeat и проверка ownership защищают длинный drain.
  function withFallbackMutex(task) {
    return new Promise(function (resolve, reject) {
      var deadline = Date.now() + 10000;
      var number = 0;

      function waitForTurn() {
        if (Date.now() >= deadline) {
          releaseFallbackMutex(number);
          resolve(false);
          return;
        }

        var records = activeFallbackMutexes();
        var blocked = records.some(function (record) {
          if (record.owner === tabId) return false;
          return record.choosing || contenderPrecedes(record, number);
        });
        if (blocked) {
          renewFallbackMutex(number);
          window.setTimeout(waitForTurn, 35);
          return;
        }

        if (!ownsFallbackMutex(number)) {
          resolve(false);
          return;
        }

        var heartbeat = window.setInterval(function () {
          renewFallbackMutex(number);
        }, FALLBACK_MUTEX_HEARTBEAT_MS);
        Promise.resolve().then(function () {
          return task(function () { return ownsFallbackMutex(number); });
        }).then(function (value) {
          window.clearInterval(heartbeat);
          releaseFallbackMutex(number);
          resolve(value);
        }, function (error) {
          window.clearInterval(heartbeat);
          releaseFallbackMutex(number);
          reject(error);
        });
      }

      writeFallbackMutex({
        owner: tabId,
        choosing: true,
        number: 0,
        expiresAt: Date.now() + FALLBACK_MUTEX_TTL_MS
      });
      number = activeFallbackMutexes().reduce(function (highest, record) {
        return Math.max(highest, record.owner === tabId ? 0 : Number(record.number || 0));
      }, 0) + 1;
      writeFallbackMutex({
        owner: tabId,
        choosing: false,
        number: number,
        expiresAt: Date.now() + FALLBACK_MUTEX_TTL_MS
      });
      waitForTurn();
    });
  }

  function withOutboxLock(task) {
    if (navigator.locks && typeof navigator.locks.request === 'function') {
      try {
        return navigator.locks.request(OUTBOX_LOCK_NAME, { mode: 'exclusive' }, function () {
          return task(function () { return true; });
        });
      } catch (error) {
        // Некоторые embedded-браузеры объявляют API, но запрещают request.
      }
    }
    return withFallbackMutex(task);
  }

  function flushOutbox(force) {
    if (flushPromise) return flushPromise;
    if (!readOutbox().length) return Promise.resolve(true);
    if (!force && Date.now() < nextOutboxRetryAt) return Promise.resolve(false);

    function sendNext(ownsLock) {
      if (ownsLock && !ownsLock()) return Promise.resolve(false);
      var entries = readOutbox();
      if (!entries.length) return Promise.resolve(true);
      var entry = entries[0];
      var request = entry.sessionCode && String(entry.path || '').indexOf('participants/') === 0
        ? participantTransaction(entry)
        : remoteRequest(entry.method, entry.path, entry.value).then(function () { return { sent: true }; });
      return request.then(function () {
        if (ownsLock && !ownsLock()) return false;
        removeOutboxEntry(entry);
        return sendNext(ownsLock);
      });
    }

    var waitForPull = syncInFlight || Promise.resolve();
    flushPromise = waitForPull.catch(function () {}).then(function () {
      return withOutboxLock(sendNext);
    }).then(function (drained) {
      if (drained === false) {
        flushPromise = null;
        return false;
      }
      nextOutboxRetryAt = 0;
      pausePullUntil = 0;
      flushPromise = null;
      return true;
    }).catch(function (error) {
      nextOutboxRetryAt = Date.now() + 1500;
      pausePullUntil = nextOutboxRetryAt;
      flushPromise = null;
      console.warn('AI Цех live: изменение сохранено в локальной очереди и будет отправлено после восстановления сети.', error);
      return false;
    });

    return flushPromise;
  }

  function writeCache(state, options) {
    var settings = options || {};
    var snapshot = normalise(state);
    var signature = JSON.stringify(snapshot);
    if (signature === lastAppliedSignature && !settings.force) return snapshot;
    lastAppliedSignature = signature;
    localStorage.setItem(STORAGE_KEY, signature);
    if (channel && settings.broadcast !== false) channel.postMessage({ type: 'state', state: snapshot });
    if (settings.notify !== false) emit(snapshot);
    return snapshot;
  }

  function pullRemote(force) {
    if (readOutbox().length) {
      return flushOutbox(force).then(function (flushed) {
        return flushed ? pullRemote(force) : read();
      });
    }
    if (syncInFlight) return syncInFlight;
    if (!force && Date.now() < pausePullUntil) return Promise.resolve(read());

    var pullGeneration = localMutationGeneration;
    var cacheSignatureAtPullStart = sharedCacheSignature();
    function pullBecameStale() {
      return localMutationGeneration !== pullGeneration ||
        readOutbox().length > 0 ||
        sharedCacheSignature() !== cacheSignatureAtPullStart;
    }
    syncInFlight = remoteRequest('GET', '').then(function (remoteState) {
      // GET мог начаться до локального действия. Такой snapshot уже устарел:
      // не применяем его к оптимистичному кэшу, очередь сначала дойдёт до
      // сервера, после чего flush запросит новое состояние.
      if (pullBecameStale()) return read();
      if (!remoteState || !remoteState.session) {
        var initial = read();
        initial.mode = 'cloud-live';
        initial.session.updatedAt = Date.now();
        return remoteRequest('PATCH', '', {
          version: 1,
          mode: 'cloud-live',
          session: initial.session
        }).then(function () {
          return pullBecameStale() ? read() : writeCache(initial);
        });
      }
      return writeCache(remoteState);
    }).catch(function (error) {
      console.warn('AI Цех live: облачная синхронизация временно недоступна, работаем из локального кэша.', error);
      return read();
    }).then(function (state) {
      syncInFlight = null;
      return state;
    }, function (error) {
      syncInFlight = null;
      throw error;
    });

    return syncInFlight;
  }

  function enqueueRemote(method, path, value, sessionCode) {
    pausePullUntil = Date.now() + 1800;
    localMutationGeneration += 1;
    addOutboxEntry(method, path, value, sessionCode);
    return flushOutbox(true).then(function (flushed) {
      return flushed ? pullRemote(true) : read();
    });
  }

  function startRemoteSync() {
    if (pollTimer) return;
    pullRemote(true);
    pollTimer = window.setInterval(function () { pullRemote(false); }, POLL_INTERVAL_MS);
  }

  function write(state) {
    var snapshot = normalise(state);
    snapshot.mode = 'cloud-live';
    snapshot.session.updatedAt = Date.now();
    writeCache(snapshot);
    enqueueRemote('PUT', '', snapshot);
    return snapshot;
  }

  function mutate(mutator) {
    var state = read();
    mutator(state);
    return write(state);
  }

  function mutateParticipant(participantId, mutator) {
    var snapshot = read();
    var updatedParticipant = mutator(snapshot.participants[participantId] || null, snapshot);
    if (!updatedParticipant) return snapshot;

    // Перед записью повторно читаем состояние: фаза ведущего могла измениться,
    // пока участник отвечал или заполнял карту. Обновляем только его запись.
    var latest = read();
    var participantSessionCode = latest.session && latest.session.code;
    updatedParticipant.sessionCode = participantSessionCode;
    latest.participants[participantId] = updatedParticipant;
    writeCache(latest);
    enqueueRemote('PUT', 'participants/' + participantId, updatedParticipant, participantSessionCode);
    return latest;
  }

  function subscribe(callback) {
    subscribers.push(callback);
    callback(read());
    startRemoteSync();
    return function () {
      subscribers = subscribers.filter(function (item) { return item !== callback; });
    };
  }

  function acceptExternalState(state) {
    var snapshot = normalise(state);
    var signature = JSON.stringify(snapshot);
    if (signature === lastAppliedSignature) return;
    lastAppliedSignature = signature;
    emit(snapshot);
  }

  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY) acceptExternalState(read());
  });

  if (channel) {
    channel.addEventListener('message', function (event) {
      if (event.data && event.data.type === 'state') acceptExternalState(event.data.state);
    });
  }

  window.addEventListener('online', function () {
    nextOutboxRetryAt = 0;
    pullRemote(true);
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') pullRemote(true);
  });

  function shuffleQuestion(question) {
    var sourceIndexes = [0, 1, 2];
    var state = (Math.imul(question.id, 0x9e3779b1) ^ 0x148ab7) >>> 0;
    function nextRandom() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return state >>> 0;
    }
    for (var position = sourceIndexes.length - 1; position > 0; position -= 1) {
      var swapWith = nextRandom() % (position + 1);
      var current = sourceIndexes[position];
      sourceIndexes[position] = sourceIndexes[swapWith];
      sourceIndexes[swapWith] = current;
    }
    return {
      id: question.id,
      topic: question.topic,
      question: question.question,
      options: sourceIndexes.map(function (sourceIndex) { return question.options[sourceIndex]; }),
      answer: sourceIndexes.indexOf(question.answer),
      explanation: question.explanation,
      hostNote: question.hostNote || ''
    };
  }

  function questions() {
    return (window.AI_TSEH_QUESTIONS || []).map(shuffleQuestion);
  }

  function setSession(patch) {
    var state = read();
    var updatedAt = Date.now();
    state.session = Object.assign({}, state.session, patch, { updatedAt: updatedAt });
    writeCache(state);
    enqueueRemote('PATCH', 'session', Object.assign({}, patch, { updatedAt: updatedAt }));
    return state;
  }

  function startQuestion(index) {
    return setSession({
      phase: 'test',
      currentQuestion: index,
      showCorrect: false,
      timerStartedAt: Date.now(),
      timerDurationSec: 30
    });
  }

  function makeParticipantId(name) {
    var base = String(name || 'participant')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 34) || 'participant';
    return base + '-' + Math.random().toString(36).slice(2, 7);
  }

  function serialFor(participantId) {
    var hash = 0;
    String(participantId).split('').forEach(function (character) {
      hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
    });
    return 'NV·AIT·2026·' + String(Math.abs(hash) % 900 + 100);
  }

  function registerParticipant(name, preferredId) {
    var cleanName = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 70);
    var id = preferredId || makeParticipantId(cleanName);
    mutateParticipant(id, function (current) {
      return Object.assign({
        id: id,
        name: cleanName,
        joinedAt: Date.now(),
        answers: {},
        card: { stack: '', process: '', manifest: '', filledCount: 0 },
        serial: serialFor(id)
      }, current || {}, { name: cleanName, lastSeenAt: Date.now() });
    });
    return id;
  }

  function submitAnswer(participantId, questionIndex, optionIndex) {
    return mutateParticipant(participantId, function (participant) {
      if (!participant) return null;
      participant.answers = participant.answers || {};
      if (participant.answers[questionIndex] == null) participant.answers[questionIndex] = optionIndex;
      participant.lastSeenAt = Date.now();
      return participant;
    });
  }

  function updateCard(participantId, patch) {
    return mutateParticipant(participantId, function (participant) {
      if (!participant) return null;
      participant.card = Object.assign({ stack: '', process: '', manifest: '' }, participant.card || {}, patch);
      participant.card.filledCount = ['stack', 'process', 'manifest'].filter(function (key) {
        return String(participant.card[key] || '').trim();
      }).length;
      participant.lastSeenAt = Date.now();
      return participant;
    });
  }

  function score(participant, list) {
    var qs = list || questions();
    return qs.reduce(function (sum, question, index) {
      return sum + (participant.answers && participant.answers[index] === question.answer ? 1 : 0);
    }, 0);
  }

  function reset() {
    return write(defaultState());
  }

  function seedDemo() {
    var names = ['Айгуль Хабирова', 'Ринат Сафин', 'Лилия Юсупова', 'Марат Ишмухаметов', 'Эльвира Нуриева', 'Артур Кадыров'];
    var qs = questions();
    var state = read();
    names.forEach(function (name, participantIndex) {
      var id = 'demo-' + String(participantIndex + 1);
      var answers = {};
      for (var index = 0; index < Math.max(0, state.session.currentQuestion + 1); index += 1) {
        var correct = qs[index].answer;
        answers[index] = (index + participantIndex) % 5 === 0 ? (correct + 1) % 3 : correct;
      }
      state.participants[id] = {
        id: id,
        name: name,
        joinedAt: Date.now() + participantIndex,
        lastSeenAt: Date.now(),
        answers: answers,
        card: {
          stack: participantIndex < 4 ? 'Codex + GitHub + Obsidian' : '',
          process: participantIndex < 3 ? 'Еженедельная сводка по клиентским задачам' : '',
          manifest: participantIndex < 2 ? 'Не начинаю с инструмента. Начинаю с ясной задачи.' : '',
          filledCount: participantIndex < 2 ? 3 : participantIndex < 3 ? 2 : participantIndex < 4 ? 1 : 0
        },
        serial: 'NV·AIT·2026·' + String(101 + participantIndex)
      };
    });
    return write(state);
  }

  function remainingSeconds(session) {
    if (!session.timerStartedAt) return null;
    var elapsed = (Date.now() - session.timerStartedAt) / 1000;
    return Math.max(0, Math.ceil((session.timerDurationSec || 30) - elapsed));
  }

  window.AITsehLive = {
    mode: 'cloud-live',
    read: read,
    write: write,
    subscribe: subscribe,
    questions: questions,
    setSession: setSession,
    startQuestion: startQuestion,
    registerParticipant: registerParticipant,
    submitAnswer: submitAnswer,
    updateCard: updateCard,
    score: score,
    reset: reset,
    seedDemo: seedDemo,
    remainingSeconds: remainingSeconds
  };
}());
