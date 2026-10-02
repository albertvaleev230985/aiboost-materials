/* Экран участника: вход по имени и фамилии, тест в своём темпе, ожидание выдачи, сертификат.

   Почему сертификат здесь не пропадает (корень бага прошлых финалов):
   раньше экран сертификата был функцией общей фазы сессии (phase === 'certificate') и
   перерисовывался целиком при каждом обновлении состояния. Любой следующий шаг ведущего
   («Завершить встречу», «Вернуться к картам»), перерисовка по таймеру или новая вкладка без
   sessionStorage снимали его с экрана. Теперь сертификат принадлежит самому участнику:
   ведущий записывает его в ветку участника, страница сразу сохраняет копию в localStorage,
   и экран сертификата снимается только одним событием: ведущий сбросил сессию (сменился код).
   Пустые ответы сети, удаление записи, переключатели панели и перезагрузка его не трогают. */
(function () {
  'use strict';

  var F = window.NVFinal;
  var C = F.config;
  var app = document.getElementById('app');
  var net = document.getElementById('net');
  var overlay = document.getElementById('overlay');
  var overlayImage = document.getElementById('overlay-image');
  var list = F.questions();
  var lessons = window.AI_TSEH_LESSONS || {};

  var state = {
    me: null,
    code: null,
    autoIssue: false,
    answers: {},
    qstart: {},
    cert: null,
    view: 'boot',
    feedback: null,
    resetNotice: false,
    welcomeBack: false,
    currentNode: null,
    meNode: null,
    ensuring: false,
    codeWaiters: [],
    syncTimer: null,
    dirty: false,
    syncing: false,
    files: null,
    filesPromise: null,
    filesFor: '',
    imageUrl: null,
    questionTimer: null,
    resizeBound: false,
    certElement: null
  };

  // ---------- локальные данные ----------

  function key(kind) {
    return kind + ':' + state.me.code + ':' + state.me.pid;
  }

  function loadLocal() {
    state.answers = F.storeGet(key('answers')) || {};
    state.qstart = F.storeGet(key('qstart')) || {};
    state.cert = F.storeGet(key('cert')) || null;
  }

  function saveAnswers() { F.storeSet(key('answers'), state.answers); }
  function saveQstart() { F.storeSet(key('qstart'), state.qstart); }

  function clearLocal() {
    if (!state.me) return;
    ['answers', 'qstart', 'cert'].forEach(function (kind) { F.storeRemove(key(kind)); });
    F.storeRemove('me');
  }

  // Фейерверк один раз на сертификат и устройство: ключ включает код сессии и номер.
  function fireworksKey(serial) { return 'fw:' + (state.me ? state.me.code : '') + ':' + serial; }
  function fireworksPlayed(serial) { return Boolean(F.storeGet(fireworksKey(serial))); }
  function markFireworks(serial) { F.storeSet(fireworksKey(serial), Date.now()); }

  function firstName(name) {
    return String(name || '').split(' ')[0] || name;
  }

  function esc(value) { return F.escapeHtml(value); }

  // ---------- выбор экрана ----------

  function setView(view) {
    // Экран сертификата снимает только сброс сессии ведущим (sessionWasReset).
    if (state.view === 'certificate' && view !== 'certificate' && !state.allowLeaveCertificate) return false;
    state.view = view;
    return true;
  }

  function decideView() {
    if (!state.me) return setView('register');
    if (state.cert && state.cert.serial) return setView('certificate');
    var s = F.summary(state.answers);
    if (s.finished) return setView('results');
    if (s.answered > 0) return setView('question');
    return setView('intro');
  }

  function render() {
    stopQuestionTimer();
    if (state.view === 'register') return renderRegister();
    if (state.view === 'intro') return renderIntro();
    if (state.view === 'question') return renderQuestion();
    if (state.view === 'results') return renderResults();
    if (state.view === 'certificate') return renderCertificate();
    return null;
  }

  // ---------- сеть ----------

  function setNet(online) {
    net.classList.toggle('is-online', Boolean(online));
    net.classList.toggle('is-offline', !online);
    net.textContent = online ? 'онлайн' : 'нет связи';
  }

  function connect() {
    state.currentNode = F.watch('current', onCurrent, { pollMs: 6000, onStatus: setNet });
  }

  function onCurrent(current) {
    if (!current || !current.code) {
      if (!state.ensuring) {
        state.ensuring = true;
        F.ensureCurrent().catch(function () { return null; }).then(function () { state.ensuring = false; });
      }
      return;
    }
    state.code = current.code;
    state.autoIssue = Boolean(current.autoIssue);
    flushCodeWaiters();
    if (state.me && state.me.code !== current.code) {
      sessionWasReset();
      return;
    }
    if (state.me && !state.meNode) startMeNode();
    updateWaitingCard();
  }

  function waitForCode(timeout) {
    if (state.code) return Promise.resolve(state.code);
    return new Promise(function (resolve) {
      var done = false;
      state.codeWaiters.push(function (code) { if (!done) { done = true; resolve(code); } });
      setTimeout(function () { if (!done) { done = true; resolve(state.code || null); } }, timeout || 10000);
      if (state.currentNode) state.currentNode.poll();
    });
  }

  function flushCodeWaiters() {
    var waiters = state.codeWaiters.splice(0);
    waiters.forEach(function (resolve) { resolve(state.code); });
  }

  function startMeNode() {
    if (!state.me || state.meNode) return;
    state.meNode = F.watch(F.participantPath(state.me.code, state.me.pid), onMyRecord, { pollMs: 5000 });
    markDirty();
    syncSoon(50);
  }

  function stopMeNode() {
    if (state.meNode) state.meNode.stop();
    state.meNode = null;
  }

  function onMyRecord(record) {
    if (!state.me || !record || typeof record !== 'object') return;
    if (record.certificate && record.certificate.serial) acceptCertificate(record.certificate);
    if (record.answers && typeof record.answers === 'object') mergeRemoteAnswers(record.answers);
    if (record.name && record.name !== state.me.name) {
      state.me.name = record.name;
      F.storeSet('me', state.me);
      updateNameBits();
    }
  }

  function mergeRemoteAnswers(remote) {
    var added = false;
    Object.keys(remote).forEach(function (questionKey) {
      var answer = remote[questionKey];
      if (!state.answers[questionKey] && answer && typeof answer.o === 'number') {
        state.answers[questionKey] = { o: answer.o, ok: Boolean(answer.ok), at: answer.at || Date.now() };
        added = true;
      }
    });
    if (!added) return;
    saveAnswers();
    // Ответы с другого устройства: двигаем экран, только если человек не читает разбор.
    if ((state.view === 'intro' || (state.view === 'question' && !state.feedback))) {
      decideView();
      render();
    }
  }

  function markDirty() { state.dirty = true; }

  function syncSoon(ms) {
    clearTimeout(state.syncTimer);
    state.syncTimer = setTimeout(syncNow, ms == null ? 250 : ms);
  }

  // Участник пишет только свою ветку и никогда не трогает поле certificate.
  function syncNow() {
    if (!state.me || !state.dirty || state.syncing) return;
    if (!state.code || state.code !== state.me.code) return;
    var s = F.summary(state.answers);
    if (s.finished && !state.me.finishedAt) {
      state.me.finishedAt = Date.now();
      F.storeSet('me', state.me);
    }
    var body = {
      id: state.me.pid,
      name: state.me.name,
      code: state.me.code,
      joinedAt: state.me.joinedAt || Date.now(),
      lastSeenAt: F.TIMESTAMP,
      answers: state.answers,
      answered: s.answered,
      score: s.score,
      total: s.total,
      finishedAt: s.finished ? state.me.finishedAt : null
    };
    state.syncing = true;
    state.dirty = false;
    F.patch(F.participantPath(state.me.code, state.me.pid), body).then(function () {
      state.syncing = false;
      if (state.dirty) syncSoon(200);
    }, function () {
      state.syncing = false;
      state.dirty = true;
      syncSoon(3000);
    });
  }

  function heartbeat() {
    if (!state.me || document.visibilityState !== 'visible') return;
    if (state.dirty) { syncSoon(0); return; }
    if (!state.code || state.code !== state.me.code) return;
    F.patch(F.participantPath(state.me.code, state.me.pid), { lastSeenAt: F.TIMESTAMP, name: state.me.name, code: state.me.code }).catch(function () {});
  }

  window.addEventListener('online', function () { if (state.dirty) syncSoon(0); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      if (state.dirty) syncSoon(0);
      if (state.view === 'question') tickQuestion();
    }
  });
  setInterval(heartbeat, 30000);

  // ---------- сброс сессии ведущим ----------

  function sessionWasReset() {
    stopMeNode();
    stopQuestionTimer();
    overlay.classList.remove('is-open');
    clearLocal();
    state.me = null;
    state.answers = {};
    state.qstart = {};
    state.cert = null;
    state.feedback = null;
    state.files = null;
    state.filesPromise = null;
    state.filesFor = '';
    state.resetNotice = true;
    state.allowLeaveCertificate = true;
    setView('register');
    state.allowLeaveCertificate = false;
    render();
  }

  // ---------- регистрация ----------

  function renderRegister() {
    app.innerHTML = [
      '<section class="screen screen--center" aria-labelledby="register-title">',
      state.resetNotice ? '<div class="notice">Ведущий начал новую сессию. Впиши имя и фамилию ещё раз.</div>' : '',
      '<p class="eyebrow">финал · поток 2</p>',
      '<h1 id="register-title">Финальный тест <span class="accent">AI Цеха</span>.</h1>',
      '<p class="lead">Впиши имя и фамилию так, как они должны стоять в сертификате. После теста сертификат откроется прямо здесь.</p>',
      '<form class="form" id="register-form" novalidate>',
      '<label class="field-label" for="participant-name">Имя и фамилия',
      '<input class="field" id="participant-name" name="name" type="text" autocomplete="name" autocapitalize="words" maxlength="60" placeholder="Например, Ильдар Вальшин">',
      '</label>',
      '<p class="hint-line" id="name-preview"></p>',
      '<p class="error" id="register-error" role="alert"></p>',
      '<button class="button button--primary" type="submit" id="register-button">Войти и начать</button>',
      '</form>',
      '<p class="small" style="margin-top:18px">Если уже проходил тест на другом устройстве, впиши то же имя: ответы и сертификат подтянутся.</p>',
      '</section>'
    ].join('');

    var form = document.getElementById('register-form');
    var input = document.getElementById('participant-name');
    var preview = document.getElementById('name-preview');
    var error = document.getElementById('register-error');
    var button = document.getElementById('register-button');

    input.addEventListener('input', function () {
      error.textContent = '';
      var value = input.value;
      if (!F.cleanName(value)) { preview.textContent = ''; return; }
      var problem = F.nameProblem(value);
      preview.innerHTML = problem ? '' : 'В сертификате будет: <strong>' + esc(F.prettyName(value)) + '</strong>';
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var problem = F.nameProblem(input.value);
      if (problem) {
        error.textContent = problem;
        input.focus();
        return;
      }
      button.disabled = true;
      button.textContent = 'Подключаюсь…';
      register(F.prettyName(input.value)).catch(function (failure) {
        console.error(failure);
        button.disabled = false;
        button.textContent = 'Войти и начать';
        error.textContent = failure && failure.userMessage ? failure.userMessage : 'Не получилось подключиться. Проверь интернет и нажми ещё раз.';
      });
    });
  }

  function register(name) {
    return waitForCode(12000).then(function (code) {
      if (!code) {
        var offline = new Error('нет кода сессии');
        offline.userMessage = 'Нет связи с сервером. Проверь интернет (или выключи VPN) и нажми ещё раз.';
        throw offline;
      }
      var pid = F.participantKey(name);
      return F.get(F.participantPath(code, pid), { timeout: 8000 }).catch(function () { return null; }).then(function (existing) {
        var record = existing && typeof existing === 'object' ? existing : null;
        state.me = {
          pid: pid,
          name: record && record.name ? record.name : name,
          code: code,
          joinedAt: record && record.joinedAt ? record.joinedAt : Date.now(),
          finishedAt: record && record.finishedAt ? record.finishedAt : null
        };
        F.storeSet('me', state.me);
        loadLocal();
        if (record && record.answers) {
          Object.keys(record.answers).forEach(function (questionKey) {
            var answer = record.answers[questionKey];
            if (!state.answers[questionKey] && answer && typeof answer.o === 'number') state.answers[questionKey] = answer;
          });
          saveAnswers();
        }
        state.welcomeBack = Boolean(record);
        state.resetNotice = false;
        decideView();
        render();
        if (record && record.certificate && record.certificate.serial) acceptCertificate(record.certificate);
        startMeNode();
      });
    });
  }

  // ---------- вступление ----------

  function nameLine() {
    return '<p class="small" style="margin-top:16px">В сертификате будет: <strong id="cert-name">' + esc(state.me.name) + '</strong>. <button class="text-button" type="button" data-action="edit-name">Исправить</button></p>';
  }

  function renderIntro() {
    app.innerHTML = [
      '<section class="screen screen--center" aria-labelledby="intro-title">',
      '<p class="eyebrow">ты в сессии</p>',
      '<h1 id="intro-title">', esc(firstName(state.me.name)), ', <span class="accent">поехали</span>.</h1>',
      '<p class="lead">30 рабочих ситуаций по всем восьми урокам потока: Codex, публикация, скиллы, команда помощников, Open Design, Гермес, память и Обсидиан. После каждого ответа короткий разбор. Не экзамен на термины: проверяем, выберешь ли ты верный следующий шаг.</p>',
      '<div class="info-grid">',
      '<div class="info-card"><strong>30</strong><span>вопросов по урокам 1–8</span></div>',
      '<div class="info-card"><strong>', C.secondsPerQuestion, ' с</strong><span>на один ответ, одна попытка</span></div>',
      '<div class="info-card"><strong>PDF</strong><span>сертификат откроется здесь, когда Альберт его выдаст</span></div>',
      '</div>',
      '<button class="button button--primary" type="button" data-action="start">Начать тест</button>',
      nameLine(),
      '</section>'
    ].join('');
  }

  // ---------- вопрос ----------

  function nextQuestionIndex() {
    for (var i = 0; i < list.length; i += 1) if (!state.answers[list[i].key]) return i;
    return -1;
  }

  function stopQuestionTimer() {
    if (state.questionTimer) clearInterval(state.questionTimer);
    state.questionTimer = null;
  }

  function remainingFor(question) {
    var started = state.qstart[question.key];
    if (!started) return C.secondsPerQuestion;
    return Math.max(0, C.secondsPerQuestion - Math.floor((Date.now() - started) / 1000));
  }

  function renderQuestion() {
    var index = state.feedback ? state.feedback.index : nextQuestionIndex();
    if (index < 0) {
      setView('results');
      return renderResults();
    }
    var question = list[index];
    state.currentIndex = index;
    if (!state.feedback && !state.qstart[question.key]) {
      state.qstart[question.key] = Date.now();
      saveQstart();
    }
    var remaining = remainingFor(question);
    app.innerHTML = [
      '<section class="screen" aria-labelledby="question-title">',
      '<div class="question-topline"><span class="question-count">ВОПРОС ', String(index + 1).padStart(2, '0'), ' / ', list.length, '</span><span class="timer" id="timer">00:', String(remaining).padStart(2, '0'), '</span></div>',
      '<div class="progress" aria-hidden="true"><div class="progress__value" id="progress" style="width:', (index / list.length * 100).toFixed(1), '%"></div></div>',
      '<p class="topic">', esc(question.topic), '</p>',
      '<h1 class="question" id="question-title">', esc(question.question), '</h1>',
      '<div class="options" id="options">',
      question.options.map(function (option, optionIndex) {
        return '<button type="button" class="option" data-option="' + optionIndex + '"><span class="option-key" aria-hidden="true">' + String.fromCharCode(65 + optionIndex) + '</span><span class="option-text">' + esc(option) + '</span></button>';
      }).join(''),
      '</div>',
      '<div id="feedback-slot"></div>',
      '</section>'
    ].join('');
    if (state.feedback) {
      showFeedback(question, state.feedback);
      return;
    }
    if (remaining <= 0) {
      answer(index, -1);
      return;
    }
    tickQuestion();
    state.questionTimer = setInterval(tickQuestion, 250);
  }

  function tickQuestion() {
    if (state.view !== 'question' || state.feedback) return;
    var index = state.currentIndex;
    var question = list[index];
    if (!question || state.answers[question.key]) return;
    var remaining = remainingFor(question);
    var timer = document.getElementById('timer');
    if (timer) {
      timer.textContent = '00:' + String(remaining).padStart(2, '0');
      timer.className = remaining <= 0 ? 'timer timer--ended' : remaining <= 10 ? 'timer timer--urgent' : 'timer';
    }
    if (remaining <= 0) answer(index, -1);
  }

  function answer(index, displayIndex) {
    if (state.feedback) return;
    var question = list[index];
    if (!question || state.answers[question.key]) return;
    stopQuestionTimer();
    var original = displayIndex >= 0 ? question.order[displayIndex] : -1;
    var correct = original === question.sourceAnswer;
    state.answers[question.key] = { o: original, ok: correct, at: Date.now() };
    saveAnswers();
    markDirty();
    syncSoon(0);
    state.feedback = { index: index, selected: displayIndex, correct: correct, timedOut: displayIndex < 0 };
    showFeedback(question, state.feedback);
  }

  function showFeedback(question, feedback) {
    var buttons = app.querySelectorAll('[data-option]');
    Array.prototype.forEach.call(buttons, function (button) {
      var optionIndex = Number(button.getAttribute('data-option'));
      button.disabled = true;
      if (optionIndex === question.answer) button.classList.add('option--correct');
      if (optionIndex === feedback.selected && !feedback.correct) button.classList.add('option--wrong');
    });
    var timer = document.getElementById('timer');
    if (timer) timer.className = 'timer timer--ended';
    var progress = document.getElementById('progress');
    if (progress) progress.style.width = ((feedback.index + 1) / list.length * 100).toFixed(1) + '%';
    var last = feedback.index >= list.length - 1 || nextQuestionIndex() < 0;
    var slot = document.getElementById('feedback-slot');
    if (!slot) return;
    slot.innerHTML = [
      '<div class="feedback ', feedback.correct ? 'is-correct' : 'is-wrong', '" role="status">',
      '<p class="feedback-title">', feedback.correct ? 'Верно' : feedback.timedOut ? 'Время вышло' : 'Не совсем', '</p>',
      '<p class="feedback-copy">', esc(question.explanation), '</p>',
      '<button class="button button--primary" type="button" data-action="next">', last ? 'Показать результат' : 'Следующий вопрос', '</button>',
      '</div>'
    ].join('');
  }

  // ---------- результат и ожидание ----------

  function level(score) {
    if (score >= 27) return { title: 'Цеховой мастер', copy: 'Ты уверенно ведёшь задачу от идеи до работающего агента. Дальше только практика на своих процессах.' };
    if (score >= 22) return { title: 'Уверенная практика', copy: 'Основа собрана. Ниже несколько мест, которые стоит освежить в шпаргалках уроков.' };
    if (score >= 15) return { title: 'База уже есть', copy: 'Ключевые части маршрута у тебя в руках. Посмотри разбор ниже и вернись к шпаргалкам слабых уроков.' };
    return { title: 'Нужен один рабочий повтор', copy: 'Это не провал, а карта следующего шага: разбор ниже покажет, к каким урокам вернуться.' };
  }

  function waitingCardMarkup() {
    if (state.autoIssue) {
      return '<strong>Выдача уже идёт</strong><p>Сертификат появится на этой странице сам, обычно за несколько секунд. Страницу не закрывай.</p><div class="waiting-line"><span class="waiting-indicator" aria-hidden="true"></span><span>Жду сертификат…</span></div>';
    }
    return '<strong>Сертификат появится здесь</strong><p>Как только Альберт нажмёт «Выдать сертификаты», у всех сразу откроется фейерверк и сертификат с кнопкой «Скачать». Страницу не закрывай. Если закроешь, просто открой ссылку снова.</p><div class="waiting-line"><span class="waiting-indicator" aria-hidden="true"></span><span>Ждём ведущего…</span></div>';
  }

  function updateWaitingCard() {
    var card = document.getElementById('waiting-card');
    if (card) card.innerHTML = waitingCardMarkup();
  }

  function breakdownMarkup() {
    var groups = {};
    list.forEach(function (question) {
      var lesson = question.lesson || 0;
      if (!groups[lesson]) groups[lesson] = { total: 0, ok: 0 };
      groups[lesson].total += 1;
      if (F.isCorrect(question, state.answers[question.key])) groups[lesson].ok += 1;
    });
    return Object.keys(groups).sort(function (a, b) { return a - b; }).map(function (lesson) {
      return '<div class="breakdown-row"><strong>' + esc(lessons[lesson] || ('Урок ' + lesson)) + '</strong><span>' + groups[lesson].ok + ' / ' + groups[lesson].total + '</span></div>';
    }).join('');
  }

  function reviewMarkup() {
    var wrong = list.filter(function (question) { return !F.isCorrect(question, state.answers[question.key]); });
    if (!wrong.length) return '<p class="small">Ни одной ошибки. Красиво.</p>';
    return wrong.map(function (question) {
      var answerRecord = state.answers[question.key];
      var picked = answerRecord && answerRecord.o >= 0 ? window.AI_TSEH_QUESTIONS.filter(function (q) { return q.id === question.id; })[0].options[answerRecord.o] : null;
      return '<article class="review-item"><p>' + esc(question.question) + '</p><small>' +
        (picked ? 'Твой ответ: «' + esc(picked) + '». ' : 'Ответ не выбран. ') +
        '<b>Верно: «' + esc(question.options[question.answer]) + '».</b> ' + esc(question.explanation) + '</small></article>';
    }).join('');
  }

  function renderResults() {
    var s = F.summary(state.answers);
    var lvl = level(s.score);
    app.innerHTML = [
      '<section class="screen" aria-labelledby="results-title">',
      '<p class="eyebrow">тест пройден</p>',
      '<div class="score-line"><span class="score-number">', s.score, '<span>/', s.total, '</span></span></div>',
      '<h2 id="results-title">', esc(lvl.title), '</h2>',
      '<p class="lead" style="margin-bottom:0">', esc(lvl.copy), '</p>',
      '<div class="waiting-card" id="waiting-card">', waitingCardMarkup(), '</div>',
      '<h3 class="section-title">По урокам</h3>',
      '<div class="breakdown">', breakdownMarkup(), '</div>',
      '<h3 class="section-title">Разобрать ещё раз</h3>',
      '<div class="review">', reviewMarkup(), '</div>',
      nameLine(),
      '</section>'
    ].join('');
  }

  // ---------- сертификат ----------

  function acceptCertificate(certificate) {
    var incoming = {
      serial: String(certificate.serial),
      number: certificate.number || null,
      name: certificate.name || (state.me && state.me.name) || '',
      date: certificate.date || C.certDate,
      issuedAt: typeof certificate.issuedAt === 'number' ? certificate.issuedAt : Date.now()
    };
    var previous = state.cert;
    var same = previous && previous.serial === incoming.serial && previous.name === incoming.name && previous.date === incoming.date;
    if (same && state.view === 'certificate') return;
    state.cert = incoming;
    if (state.me) F.storeSet(key('cert'), incoming);
    stopQuestionTimer();
    if (state.view !== 'certificate') {
      setView('certificate');
      renderCertificate();
    } else if (!same) {
      drawCertificate();
    }
  }

  function certificatePageUrl() {
    var cert = state.cert;
    return '../certificate/?name=' + encodeURIComponent(cert.name) + '&serial=' + encodeURIComponent(cert.serial) + '&date=' + encodeURIComponent(cert.date);
  }

  function renderCertificate() {
    var cert = state.cert;
    var s = F.summary(state.answers);
    app.innerHTML = [
      '<section class="screen screen--cert" aria-labelledby="cert-title">',
      '<p class="eyebrow">финал · поток 2 · ', esc(cert.date), '</p>',
      '<h1 id="cert-title">Поздравляем, <span class="accent" id="cert-first-name">', esc(firstName(cert.name)), '</span>!</h1>',
      '<p class="lead" style="margin-bottom:0">Восемь занятий AI Цеха позади. Сертификат твой и уже сохранён на этой странице: можно закрыть её и открыть ссылку снова, он останется. Скачай себе файл.</p>',
      '<div class="cert-stage" id="cert-stage"></div>',
      '<div class="cert-actions">',
      '<button class="button button--primary" type="button" data-action="download-pdf" id="download-pdf">Скачать PDF</button>',
      '<button class="button button--secondary" type="button" data-action="download-png" id="download-png">Скачать картинку PNG</button>',
      '</div>',
      '<p class="cert-status" id="cert-status" role="status"></p>',
      '<p class="small">На iPhone кнопка откроет меню «Поделиться»: выбери «Сохранить изображение» или «Сохранить в Файлы». Если ничего не открылось, нажми на сертификат и подержи палец.</p>',
      '<div class="cert-links"><a href="', certificatePageUrl(), '" target="_blank" rel="noopener" id="cert-page-link">Открыть сертификат отдельной страницей</a><button class="text-button" type="button" data-action="open-image">Показать картинку для сохранения</button></div>',
      s.answered ? '<details class="result-details"><summary>Мой результат теста: ' + s.score + ' из ' + s.total + '</summary><div class="breakdown">' + breakdownMarkup() + '</div><h3 class="section-title">Разобрать ещё раз</h3><div class="review">' + reviewMarkup() + '</div></details>' : '',
      '</section>'
    ].join('');
    drawCertificate();
    if (!fireworksPlayed(cert.serial)) {
      markFireworks(cert.serial);
      var duration = window.NVFireworks ? window.NVFireworks.play() : 0;
      prepareFiles(duration ? duration + 300 : 600);
    } else {
      prepareFiles(300);
    }
  }

  function drawCertificate() {
    var stage = document.getElementById('cert-stage');
    if (!stage || !state.cert) return;
    stage.classList.remove('has-image');
    stage.innerHTML = '';
    var element = window.NVCert.create(state.cert);
    state.certElement = element;
    stage.appendChild(element);
    window.NVCert.fit(stage, element);
    window.NVCert.whenReady(element).then(function () {
      if (state.certElement === element) window.NVCert.fit(stage, element);
    });
    var firstNameSlot = document.getElementById('cert-first-name');
    if (firstNameSlot) firstNameSlot.textContent = firstName(state.cert.name);
    var link = document.getElementById('cert-page-link');
    if (link) link.setAttribute('href', certificatePageUrl());
    if (!state.resizeBound) {
      state.resizeBound = true;
      window.addEventListener('resize', function () {
        var currentStage = document.getElementById('cert-stage');
        if (currentStage && state.certElement && !currentStage.classList.contains('has-image')) window.NVCert.fit(currentStage, state.certElement);
      });
    }
    var signature = certSignature();
    if ((state.filesFor && state.filesFor !== signature) || (state.filesPromise && state.filesPending && state.filesPending !== signature)) {
      state.files = null;
      state.filesPromise = null;
      state.filesFor = '';
      state.filesPending = '';
      prepareFiles(200);
    } else if (state.files) {
      showImage();
    }
    setButtons();
  }

  function certSignature() {
    return state.cert ? state.cert.serial + '|' + state.cert.name + '|' + state.cert.date : '';
  }

  function setStatus(text, isError) {
    var status = document.getElementById('cert-status');
    if (!status) return;
    status.textContent = text || '';
    status.classList.toggle('is-error', Boolean(isError));
  }

  function setButtons() {
    var ready = Boolean(state.files);
    ['download-pdf', 'download-png'].forEach(function (id) {
      var button = document.getElementById(id);
      if (button) button.disabled = !ready;
    });
    if (!ready && !state.filesError) setStatus('Готовлю файлы для скачивания…');
  }

  function prepareFiles(delayMs) {
    if (state.filesPromise || !state.cert) return state.filesPromise;
    var signature = certSignature();
    var data = { name: state.cert.name, serial: state.cert.serial, date: state.cert.date };
    state.filesError = false;
    state.filesPending = signature;
    var promise = F.delay(delayMs || 0).then(function () {
      return window.NVCert.makeFiles(data);
    }).then(function (files) {
      if (signature !== certSignature()) return null;
      state.files = files;
      state.filesFor = signature;
      if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
      state.imageUrl = URL.createObjectURL(files.png);
      showImage();
      setButtons();
      setStatus('Файлы готовы: PDF для печати и картинка для телефона.');
      return files;
    }).catch(function (error) {
      console.error(error);
      if (state.filesPromise === promise) state.filesPromise = null;
      if (signature !== certSignature()) return null;
      state.filesError = true;
      setStatus('Файл не собрался в этом браузере. Нажми «Открыть сертификат отдельной страницей» или открой ссылку в Safari или Chrome.', true);
      return null;
    });
    state.filesPromise = promise;
    return promise;
  }

  function showImage() {
    var stage = document.getElementById('cert-stage');
    if (!stage || !state.imageUrl) return;
    var image = stage.querySelector('img.cert-image');
    if (!image) {
      image = new Image();
      image.className = 'cert-image';
      image.alt = 'Сертификат Практикума AI Цех: ' + state.cert.name + ', ' + state.cert.serial;
      image.onload = function () {
        stage.classList.add('has-image');
        stage.style.height = 'auto';
      };
      stage.appendChild(image);
    }
    image.src = state.imageUrl;
  }

  function deliver(kind) {
    if (!state.files) {
      setStatus('Ещё секунду, файл собирается…');
      prepareFiles(0);
      return;
    }
    var blob = kind === 'pdf' ? state.files.pdf : state.files.png;
    var name = window.NVCert.filename(state.cert, kind);
    window.NVCert.deliver(blob, name).then(function (result) {
      if (result === 'shared') setStatus('Готово.');
      else if (result === 'downloaded') setStatus(kind === 'pdf' ? 'PDF скачан, ищи его в «Загрузках». Если загрузка не началась, нажми «Показать картинку для сохранения».' : 'Картинка скачана, ищи её в «Загрузках». Если загрузка не началась, нажми «Показать картинку для сохранения».');
    });
  }

  function openOverlay() {
    if (!state.imageUrl) {
      setStatus('Картинка ещё собирается, нажми через пару секунд.');
      prepareFiles(0);
      return;
    }
    overlayImage.src = state.imageUrl;
    overlay.classList.add('is-open');
  }

  document.getElementById('overlay-close').addEventListener('click', function () { overlay.classList.remove('is-open'); });
  overlay.addEventListener('click', function (event) { if (event.target === overlay) overlay.classList.remove('is-open'); });

  // ---------- имя ----------

  function updateNameBits() {
    var slot = document.getElementById('cert-name');
    if (slot) slot.textContent = state.me.name;
  }

  function editName() {
    if (!state.me || state.view === 'certificate') return;
    var value = window.prompt('Как написать имя и фамилию в сертификате?', state.me.name);
    if (value == null) return;
    var problem = F.nameProblem(value);
    if (problem) {
      window.alert(problem);
      return;
    }
    state.me.name = F.prettyName(value);
    F.storeSet('me', state.me);
    updateNameBits();
    markDirty();
    syncSoon(0);
  }

  // ---------- действия ----------

  app.addEventListener('click', function (event) {
    var option = event.target.closest('[data-option]');
    if (option && state.view === 'question' && !option.disabled) {
      if (state.currentIndex != null && state.currentIndex >= 0) answer(state.currentIndex, Number(option.getAttribute('data-option')));
      return;
    }
    var actionElement = event.target.closest('[data-action]');
    if (!actionElement) return;
    var action = actionElement.getAttribute('data-action');
    if (action === 'start') {
      setView('question');
      render();
    } else if (action === 'next') {
      state.feedback = null;
      decideView();
      render();
      window.scrollTo(0, 0);
    } else if (action === 'edit-name') {
      editName();
    } else if (action === 'download-pdf') {
      deliver('pdf');
    } else if (action === 'download-png') {
      deliver('png');
    } else if (action === 'open-image') {
      openOverlay();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (state.view !== 'question' || state.feedback) return;
    if (event.key >= '1' && event.key <= '3') {
      var button = app.querySelector('[data-option="' + (Number(event.key) - 1) + '"]');
      if (button && !button.disabled) button.click();
    }
  });

  // ---------- старт ----------

  function boot() {
    setNet(navigator.onLine !== false);
    var me = F.storeGet('me');
    if (me && me.pid && me.code && me.name) {
      state.me = me;
      loadLocal();
    }
    decideView();
    render();
    connect();
  }

  boot();
}());
