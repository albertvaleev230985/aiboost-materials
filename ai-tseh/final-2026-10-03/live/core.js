/* Финал AI Цеха, поток 2 (03.10.2026): общий движок для экрана участника и панели ведущего.
   Хранилище: Firebase Realtime Database через REST и поток событий (EventSource), без SDK
   и без внешних CDN. Если поток событий рвётся, страницы дополнительно переспрашивают базу
   короткими запросами, поэтому изменения доходят даже через капризную мобильную сеть.

   Устройство данных (корень ROOT):
     current                       { code, startedAt, autoIssue }  текущая сессия
     sessions/<code>/participants/<pid>
                                   { id, name, code, joinedAt, lastSeenAt, answers, answered,
                                     score, finishedAt, certificate }
     numbering                     { last, assigned: { "<code>_<pid>": номер } }
     registry/<NNN>                { serial, name, pid, code, score, issuedAt }

   Каждая сессия живёт в своей ветке sessions/<code>: сброс заводит новый код, и запоздавшие
   записи старых вкладок уже не попадают в новую сессию. Сертификат пишет только ведущий,
   участник его только читает и хранит копию у себя в браузере. */
(function () {
  'use strict';

  var CONFIG = {
    database: 'https://ai-boost-8195c-default-rtdb.europe-west1.firebasedatabase.app',
    root: 'ai-tseh-p2-final-2026-10-03',
    certDate: '3 октября 2026',
    serialPrefix: 'NV·AIT·2026·',
    serialStartAfter: 17,
    secondsPerQuestion: 30,
    hostKey: 'albert2026',
    storagePrefix: 'aitseh2-final:'
  };

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function segments(path) {
    return String(path || '').split('/').filter(Boolean);
  }

  function url(path) {
    var clean = segments(path).map(encodeURIComponent).join('/');
    return CONFIG.database + '/' + CONFIG.root + (clean ? '/' + clean : '') + '.json';
  }

  function request(method, path, body, options) {
    var opts = options || {};
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, opts.timeout || 12000) : null;
    var init = { method: method, cache: 'no-store', headers: opts.headers || {} };
    if (body !== undefined) init.body = JSON.stringify(body);
    if (controller) init.signal = controller.signal;
    return fetch(url(path), init).then(function (response) {
      if (timer) clearTimeout(timer);
      if (opts.raw) return response;
      if (!response.ok) throw new Error('Firebase ' + method + ' ' + path + ': ' + response.status);
      return response.json();
    }, function (error) {
      if (timer) clearTimeout(timer);
      throw error;
    });
  }

  function get(path, options) { return request('GET', path, undefined, options); }
  function put(path, value) { return request('PUT', path, value); }
  function patch(path, value) { return request('PATCH', path, value); }
  function remove(path) { return request('DELETE', path); }

  // Атомарное изменение одного узла через ETag (как в финале 18.07).
  function transaction(path, mutate, attempt) {
    var round = attempt || 0;
    return request('GET', path, undefined, { raw: true, headers: { 'X-Firebase-ETag': 'true' } }).then(function (response) {
      if (!response.ok) throw new Error('Firebase transaction GET ' + response.status);
      var etag = response.headers.get('ETag');
      return response.json().then(function (current) {
        var next = mutate(current);
        if (next === undefined) return { committed: false, value: current };
        return request('PUT', path, next, { raw: true, headers: { 'if-match': etag } }).then(function (result) {
          if (result.status === 412 && round < 14) {
            return delay(40 + round * 70 + Math.random() * 60).then(function () {
              return transaction(path, mutate, round + 1);
            });
          }
          if (!result.ok) throw new Error('Firebase transaction PUT ' + result.status);
          return result.json().then(function (value) { return { committed: true, value: value }; });
        });
      });
    });
  }

  var TIMESTAMP = { '.sv': 'timestamp' };

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function setIn(root, pathSegments, value) {
    if (!pathSegments.length) return value === undefined ? null : clone(value);
    var base = root && typeof root === 'object' ? root : {};
    var cursor = base;
    for (var i = 0; i < pathSegments.length - 1; i += 1) {
      var key = pathSegments[i];
      if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
      cursor = cursor[key];
    }
    var last = pathSegments[pathSegments.length - 1];
    if (value === null || value === undefined) delete cursor[last];
    else cursor[last] = clone(value);
    return base;
  }

  // Живой узел базы: поток событий + страховочный опрос. onChange зовётся только
  // когда значение реально поменялось (сравнение по JSON), лишних перерисовок нет.
  function LiveNode(path, onChange, options) {
    this.path = path;
    this.onChange = onChange;
    this.pollMs = (options && options.pollMs) || 5000;
    this.value = undefined;
    this.signature = null;
    this.source = null;
    this.pollTimer = null;
    this.stopped = false;
    this.connected = null;
    this.lastEventAt = 0;
    this.onStatus = (options && options.onStatus) || null;
  }

  LiveNode.prototype.emit = function () {
    var signature = JSON.stringify(this.value === undefined ? null : this.value);
    if (signature === this.signature) return;
    this.signature = signature;
    try { this.onChange(this.value === undefined ? null : clone(this.value)); }
    catch (error) { console.error(error); }
  };

  LiveNode.prototype.setStatus = function (connected) {
    if (this.connected === connected) return;
    this.connected = connected;
    if (this.onStatus) this.onStatus(connected);
  };

  LiveNode.prototype.applyEvent = function (kind, payload) {
    if (!payload) return;
    var at = segments(payload.path);
    if (kind === 'put') {
      this.value = setIn(this.value === undefined ? null : clone(this.value), at, payload.data);
    } else if (kind === 'patch') {
      var next = this.value && typeof this.value === 'object' ? clone(this.value) : {};
      Object.keys(payload.data || {}).forEach(function (key) {
        next = setIn(next, at.concat(segments(key)), payload.data[key]);
      });
      this.value = next;
    }
    this.lastEventAt = Date.now();
    this.setStatus(true);
    this.emit();
  };

  LiveNode.prototype.openStream = function () {
    var self = this;
    if (self.stopped || typeof EventSource !== 'function') return;
    try {
      var source = new EventSource(url(self.path));
      self.source = source;
      source.addEventListener('put', function (event) {
        try { self.applyEvent('put', JSON.parse(event.data)); } catch (error) { console.warn(error); }
      });
      source.addEventListener('patch', function (event) {
        try { self.applyEvent('patch', JSON.parse(event.data)); } catch (error) { console.warn(error); }
      });
      source.addEventListener('keep-alive', function () {
        self.lastEventAt = Date.now();
        self.setStatus(true);
      });
      source.addEventListener('cancel', function () {
        source.close();
        self.setStatus(false);
      });
      source.addEventListener('error', function () {
        // EventSource переподключается сам; если он закрылся насовсем, откроем заново.
        if (source.readyState === 2 && !self.stopped) {
          setTimeout(function () { if (!self.stopped && self.source === source) self.openStream(); }, 3000);
        }
      });
    } catch (error) {
      console.warn('EventSource недоступен, работаем опросом', error);
    }
  };

  LiveNode.prototype.poll = function () {
    var self = this;
    if (self.stopped) return Promise.resolve();
    return get(self.path, { timeout: 9000 }).then(function (value) {
      if (self.stopped) return;
      self.value = value;
      self.setStatus(true);
      self.emit();
    }, function () {
      if (Date.now() - self.lastEventAt > 20000) self.setStatus(false);
    });
  };

  LiveNode.prototype.start = function () {
    var self = this;
    self.stopped = false;
    self.openStream();
    self.poll();
    self.pollTimer = setInterval(function () { self.poll(); }, self.pollMs);
    self.wake = function () {
      if (document.visibilityState === 'visible') {
        self.poll();
        if (self.source && self.source.readyState === 2) self.openStream();
      }
    };
    document.addEventListener('visibilitychange', self.wake);
    window.addEventListener('online', self.wake);
    window.addEventListener('pageshow', self.wake);
    return self;
  };

  LiveNode.prototype.stop = function () {
    this.stopped = true;
    if (this.source) this.source.close();
    this.source = null;
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.wake) {
      document.removeEventListener('visibilitychange', this.wake);
      window.removeEventListener('online', this.wake);
      window.removeEventListener('pageshow', this.wake);
    }
  };

  function watch(path, onChange, options) {
    return new LiveNode(path, onChange, options).start();
  }

  // ---------- сессия ----------

  function newCode() {
    return 'P2-' + String(Math.floor(1000 + Math.random() * 9000));
  }

  function ensureCurrent() {
    return transaction('current', function (current) {
      if (current && current.code) return undefined;
      return { code: newCode(), startedAt: Date.now(), autoIssue: false };
    }).then(function (result) { return result.value; });
  }

  function participantPath(code, pid) {
    return 'sessions/' + code + '/participants/' + pid;
  }

  // ---------- имена ----------

  var TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y',
    'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };

  function cleanName(value) {
    return String(value || '')
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/[«»"“”]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 60);
  }

  // «ильдар вальшин» и «ИЛЬДАР ВАЛЬШИН» превращаются в «Ильдар Вальшин», части через дефис тоже.
  function prettyName(value) {
    return cleanName(value).split(' ').map(function (word) {
      return word.split('-').map(function (part) {
        if (!part) return part;
        return part.charAt(0).toLocaleUpperCase('ru-RU') + part.slice(1).toLocaleLowerCase('ru-RU');
      }).join('-');
    }).join(' ');
  }

  function nameProblem(value) {
    var name = cleanName(value);
    if (!name) return 'Впиши имя и фамилию.';
    if (/[0-9@#$%^&*_=+<>{}\[\]\\/|~`]/.test(name)) return 'Только буквы: имя и фамилия, без ника и цифр.';
    var words = name.split(' ').filter(function (word) { return word.replace(/[-'’.]/g, '').length >= 2; });
    if (words.length < 2) return 'Нужны имя и фамилия, например «Ильдар Вальшин». Так сертификат будет на твоё имя.';
    if (!/^[A-Za-zА-Яа-яЁё\s\-'’.]+$/.test(name)) return 'Только буквы: имя и фамилия, без эмодзи.';
    return '';
  }

  // Ключ участника не зависит от регистра и порядка слов: «Вальшин Ильдар» = «Ильдар Вальшин».
  // Повторный вход с тем же именем на другом устройстве находит ту же запись и тот же сертификат.
  function participantKey(name) {
    var words = cleanName(name).toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').split(' ').filter(Boolean);
    var latin = words.map(function (word) {
      var out = '';
      for (var i = 0; i < word.length; i += 1) {
        var ch = word.charAt(i);
        if (Object.prototype.hasOwnProperty.call(TRANSLIT, ch)) out += TRANSLIT[ch];
        else if (/[a-z0-9]/.test(ch)) out += ch;
        else if (ch === '-') out += '-';
      }
      return out.replace(/-+/g, '-').replace(/^-|-$/g, '');
    }).filter(Boolean).sort();
    var key = latin.join('-').slice(0, 60);
    return key || ('guest-' + Math.random().toString(36).slice(2, 8));
  }

  // ---------- вопросы ----------

  function shuffleQuestion(question) {
    var order = question.options.map(function (_, index) { return index; });
    var state = (Math.imul(question.id, 0x9e3779b1) ^ 0x2e8abf) >>> 0;
    function next() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return state >>> 0;
    }
    for (var position = order.length - 1; position > 0; position -= 1) {
      var swap = next() % (position + 1);
      var keep = order[position];
      order[position] = order[swap];
      order[swap] = keep;
    }
    return {
      id: question.id,
      key: questionKey(question.id),
      lesson: question.lesson,
      topic: question.topic,
      question: question.question,
      order: order,
      options: order.map(function (source) { return question.options[source]; }),
      answer: order.indexOf(question.answer),
      sourceAnswer: question.answer,
      explanation: question.explanation
    };
  }

  function questionKey(id) {
    return 'q' + String(id).padStart(2, '0');
  }

  var questionCache = null;
  function questions() {
    if (!questionCache) questionCache = (window.AI_TSEH_QUESTIONS || []).map(shuffleQuestion);
    return questionCache;
  }

  // Ответ хранится как индекс варианта в исходном файле вопросов (o), -1 = время вышло.
  function isCorrect(question, answer) {
    return Boolean(answer) && Number(answer.o) === question.sourceAnswer;
  }

  function summary(answers) {
    var list = questions();
    var answered = 0;
    var score = 0;
    list.forEach(function (question) {
      var answer = answers && answers[question.key];
      if (!answer) return;
      answered += 1;
      if (isCorrect(question, answer)) score += 1;
    });
    return { answered: answered, score: score, total: list.length, finished: list.length > 0 && answered >= list.length };
  }

  // ---------- сертификаты ----------

  function serialFor(number) {
    return CONFIG.serialPrefix + String(number).padStart(3, '0');
  }

  // Нумерация общая для всех потоков AI Цеха: поток 1 получил 001–017, поток 2 продолжает.
  // Номер выдаётся один раз и навсегда: повторное нажатие или вторая вкладка панели не создадут
  // второй номер тому же человеку (транзакция на узле numbering).
  function reserveNumbers(code, pids) {
    var assignedNow = {};
    return transaction('numbering', function (current) {
      var state = current && typeof current === 'object' ? current : {};
      var last = typeof state.last === 'number' ? state.last : CONFIG.serialStartAfter;
      var assigned = state.assigned && typeof state.assigned === 'object' ? clone(state.assigned) : {};
      assignedNow = {};
      pids.forEach(function (pid) {
        var key = code + '_' + pid;
        if (!assigned[key]) {
          last += 1;
          assigned[key] = last;
        }
        assignedNow[pid] = assigned[key];
      });
      return { last: last, assigned: assigned };
    }).then(function () { return assignedNow; });
  }

  function issueCertificates(code, people) {
    // people: [{ pid, name, score }]
    if (!people.length) return Promise.resolve([]);
    var ordered = people.slice().sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name), 'ru');
    });
    return reserveNumbers(code, ordered.map(function (person) { return person.pid; })).then(function (numbers) {
      var updates = {};
      var issued = [];
      ordered.forEach(function (person) {
        var number = numbers[person.pid];
        var serial = serialFor(number);
        var certificate = {
          serial: serial,
          number: number,
          name: person.name,
          date: CONFIG.certDate,
          issuedAt: TIMESTAMP
        };
        updates[participantPath(code, person.pid) + '/certificate'] = certificate;
        updates['registry/' + String(number).padStart(3, '0')] = {
          serial: serial,
          name: person.name,
          pid: person.pid,
          code: code,
          score: person.score == null ? null : person.score,
          issuedAt: TIMESTAMP
        };
        issued.push({ pid: person.pid, name: person.name, serial: serial });
      });
      return patch('', updates).then(function () { return issued; });
    });
  }

  function renameParticipant(code, pid, name, hasCertificate) {
    var updates = {};
    updates[participantPath(code, pid) + '/name'] = name;
    if (hasCertificate) updates[participantPath(code, pid) + '/certificate/name'] = name;
    return patch('', updates).then(function () {
      if (!hasCertificate) return null;
      return get('numbering/assigned/' + code + '_' + pid).then(function (number) {
        if (typeof number !== 'number') return null;
        return patch('registry/' + String(number).padStart(3, '0'), { name: name });
      });
    });
  }

  function resetSession(options) {
    var updates = {
      current: { code: newCode(), startedAt: TIMESTAMP, autoIssue: false },
      sessions: null
    };
    if (options && options.resetNumbering) {
      updates.numbering = { last: CONFIG.serialStartAfter };
      updates.registry = null;
    }
    return patch('', updates);
  }

  // ---------- локальное хранилище ----------

  function storeGet(key) {
    try {
      var raw = window.localStorage.getItem(CONFIG.storagePrefix + key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) { return null; }
  }

  function storeSet(key, value) {
    try { window.localStorage.setItem(CONFIG.storagePrefix + key, JSON.stringify(value)); return true; }
    catch (error) { return false; }
  }

  function storeRemove(key) {
    try { window.localStorage.removeItem(CONFIG.storagePrefix + key); } catch (error) { /* пусто */ }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }

  function plural(n, one, few, many) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
  }

  window.NVFinal = {
    config: CONFIG,
    TIMESTAMP: TIMESTAMP,
    url: url,
    get: get,
    put: put,
    patch: patch,
    remove: remove,
    transaction: transaction,
    watch: watch,
    ensureCurrent: ensureCurrent,
    participantPath: participantPath,
    cleanName: cleanName,
    prettyName: prettyName,
    nameProblem: nameProblem,
    participantKey: participantKey,
    questions: questions,
    questionKey: questionKey,
    isCorrect: isCorrect,
    summary: summary,
    serialFor: serialFor,
    issueCertificates: issueCertificates,
    renameParticipant: renameParticipant,
    resetSession: resetSession,
    storeGet: storeGet,
    storeSet: storeSet,
    storeRemove: storeRemove,
    escapeHtml: escapeHtml,
    plural: plural,
    delay: delay
  };
}());
