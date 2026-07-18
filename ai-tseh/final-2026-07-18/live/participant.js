(function () {
  'use strict';

  var IDENTITY_KEY = 'ai-tseh-final-live:participant:v1';
  var app = document.getElementById('app');
  var live = window.AITsehLive;
  var latestState = null;
  var identity = readIdentity();
  var cardTimers = {};
  var isRendering = false;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function cleanName(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 70);
  }

  function hasSurname(value) {
    return cleanName(value).split(' ').filter(Boolean).length >= 2;
  }

  function readIdentity() {
    try {
      var raw = JSON.parse(sessionStorage.getItem(IDENTITY_KEY));
      if (raw && raw.id && cleanName(raw.name) && raw.sessionCode) {
        return { id: String(raw.id), name: cleanName(raw.name), sessionCode: String(raw.sessionCode) };
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function saveIdentity(record) {
    identity = {
      id: String(record.id),
      name: cleanName(record.name),
      sessionCode: String(record.sessionCode)
    };
    sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    return identity;
  }

  function clearIdentity() {
    identity = null;
    sessionStorage.removeItem(IDENTITY_KEY);
  }

  function register(name) {
    var clean = cleanName(name);
    var state = live.read();
    var sessionCode = state && state.session && state.session.code;
    var participantId = live.registerParticipant(clean);
    return saveIdentity({ id: participantId, name: clean, sessionCode: sessionCode });
  }

  function participantFor(state) {
    if (!identity || !state || !state.participants) return null;
    var activeSessionCode = state.session && state.session.code;
    if (!activeSessionCode || identity.sessionCode !== activeSessionCode) {
      clearIdentity();
      return null;
    }
    var participant = state.participants[identity.id];
    if (!participant) {
      live.registerParticipant(identity.name, identity.id);
      state = live.read();
      participant = state.participants[identity.id];
    }
    return participant || null;
  }

  function certificateUrl(participant) {
    var serial = participant && participant.serial ? participant.serial : 'NV·AIT·2026·001';
    return '../сертификат/?name=' + encodeURIComponent(identity.name) + '&serial=' + encodeURIComponent(serial);
  }

  function getQueryName() {
    try {
      return cleanName(new URLSearchParams(window.location.search).get('name'));
    } catch (error) {
      return '';
    }
  }

  function phase(state) {
    return state && state.session && state.session.phase ? state.session.phase : 'lobby';
  }

  function renderRegistration() {
    var suggested = getQueryName();
    app.innerHTML = [
      '<section class="screen screen--center" aria-labelledby="register-title">',
      '<p class="eyebrow">вход в сессию</p>',
      '<h1 id="register-title">Твоя точка на <span class="accent">карте AI Цеха</span>.</h1>',
      '<p class="lead">Впиши имя и фамилию. Они появятся в live-панели ведущего и понадобятся для сертификата.</p>',
      '<form class="form" id="registration-form" novalidate>',
      '<label class="field-label" for="participant-name">Имя и фамилия',
      '<input class="field" id="participant-name" name="name" type="text" autocomplete="name" maxlength="70" placeholder="Например, Айгуль Хабирова" value="', escapeHtml(suggested), '">',
      '</label>',
      '<p class="error" id="registration-error" role="alert"></p>',
      '<button class="button button--primary" type="submit">Войти в live-сессию</button>',
      '</form>',
      '<p class="small">Ответы и карта синхронизируются внутри этой live-сессии. После занятия ведущий сбросит временные данные.</p>',
      '</section>'
    ].join('');

    document.getElementById('registration-form').addEventListener('submit', function (event) {
      event.preventDefault();
      var input = document.getElementById('participant-name');
      var error = document.getElementById('registration-error');
      var name = cleanName(input.value);
      if (!hasSurname(name)) {
        error.textContent = 'Нужны имя и фамилия — так сертификат попадёт к своему человеку.';
        input.focus();
        return;
      }
      register(name);
      render(live.read());
    });
  }

  function renderLobby(state, participant) {
    var session = state.session || {};
    app.innerHTML = [
      '<section class="screen screen--center" aria-labelledby="lobby-title">',
      '<p class="eyebrow">ты в сессии</p>',
      '<h1 id="lobby-title">', escapeHtml(participant.name), ', <span class="accent">на связи</span>.</h1>',
      '<p class="lead">Ведущий запустит один вопрос для всех одновременно. На ответ будет 30 секунд и одна попытка.</p>',
      '<div class="info-grid">',
      '<div class="info-card"><strong>30</strong><span>вопросов по всему пути</span></div>',
      '<div class="info-card"><strong>30 с</strong><span>на один самостоятельный ответ</span></div>',
      '<div class="info-card"><strong>3 поля</strong><span>в личной карте после разбора</span></div>',
      '</div>',
      '<span class="session-code">СЕССИЯ ' + escapeHtml(session.code || 'AIT') + '</span>',
      '<div class="waiting-line"><span class="waiting-indicator" aria-hidden="true"></span><span>Ждём, когда ведущий откроет первый вопрос.</span></div>',
      '</section>'
    ].join('');
  }

  function formatSeconds(seconds) {
    var safe = Math.max(0, Number(seconds || 0));
    return '00:' + String(safe).padStart(2, '0');
  }

  function optionClass(question, index, answer, showCorrect) {
    var classes = ['option'];
    if (answer === index) classes.push('option--selected');
    if (showCorrect && index === question.answer) classes.push('option--correct');
    if (showCorrect && answer === index && index !== question.answer) classes.push('option--wrong');
    return classes.join(' ');
  }

  function optionsMarkup(question, answer, isLocked, showCorrect) {
    return question.options.map(function (option, index) {
      var disabled = isLocked ? ' disabled' : '';
      return [
        '<button type="button" class="', optionClass(question, index, answer, showCorrect), '" data-answer="', index, '"', disabled, '>',
        '<span class="option-key" aria-hidden="true">', String.fromCharCode(65 + index), '</span>',
        '<span class="option-text">', escapeHtml(option), '</span>',
        '</button>'
      ].join('');
    }).join('');
  }

  function renderQuestion(state, participant) {
    var session = state.session || {};
    var questionIndex = Number(session.currentQuestion);
    var questions = live.questions();
    var question = questions[questionIndex];
    if (!question) {
      app.innerHTML = '<section class="screen screen--center"><p class="eyebrow">синхронизация</p><h1>Вопрос <span class="accent">готовится</span>.</h1><p class="lead">Оставайся на этой странице — экран обновится сам.</p></section>';
      return;
    }

    var answers = participant.answers || {};
    var hasAnswer = Object.prototype.hasOwnProperty.call(answers, questionIndex);
    var answer = hasAnswer ? answers[questionIndex] : null;
    var remaining = live.remainingSeconds(session);
    var expired = remaining !== null && remaining <= 0;
    var showCorrect = Boolean(session.showCorrect);
    var locked = hasAnswer || expired || showCorrect;
    var progress = Math.max(0, Math.min(100, ((remaining == null ? 30 : remaining) / 30) * 100));
    var timerClass = expired ? 'timer timer--ended' : (remaining != null && remaining <= 10 ? 'timer timer--urgent' : 'timer');
    var note = showCorrect
      ? '<div class="answer-reveal"><div class="answer-reveal__label">Смысл ответа</div><p>' + escapeHtml(question.explanation) + '</p></div>'
      : hasAnswer
      ? '<div class="response-note"><strong>Ответ принят.</strong> Его уже нельзя изменить. Дождись общего разбора.</div>'
      : (expired ? '<div class="response-note"><strong>Время вышло.</strong> Сейчас перейдём к разбору вместе с ведущим.</div>' : '<div class="response-note">Выбери один вариант. После отправки изменить ответ нельзя.</div>');

    app.innerHTML = [
      '<section class="screen" aria-labelledby="question-title">',
      '<div class="question-topline"><span class="question-count">ВОПРОС ', String(questionIndex + 1).padStart(2, '0'), ' / 30</span><span class="', timerClass, '">', formatSeconds(remaining == null ? 30 : remaining), '</span></div>',
      '<div class="progress" aria-hidden="true"><div class="progress__value" style="width:', progress, '%"></div></div>',
      '<p class="topic">', escapeHtml(question.topic), '</p>',
      '<h1 class="question" id="question-title">', escapeHtml(question.question), '</h1>',
      '<div class="options">', optionsMarkup(question, answer, locked, showCorrect), '</div>',
      note,
      '</section>'
    ].join('');

    if (!locked) {
      app.querySelectorAll('[data-answer]').forEach(function (button) {
        button.addEventListener('click', function () {
          var optionIndex = Number(button.getAttribute('data-answer'));
          var current = live.read();
          var seconds = live.remainingSeconds(current.session || {});
          if (phase(current) !== 'test' || Number(current.session.currentQuestion) !== questionIndex || seconds === 0) return;
          live.submitAnswer(identity.id, questionIndex, optionIndex);
        });
      });
    }
  }

  function renderDiscussion(state, participant) {
    var session = state.session || {};
    var questionIndex = Number(session.currentQuestion);
    var questions = live.questions();
    var question = questions[questionIndex];
    if (!question) {
      renderLobby(state, participant);
      return;
    }
    var answers = participant.answers || {};
    var hasAnswer = Object.prototype.hasOwnProperty.call(answers, questionIndex);
    var answer = hasAnswer ? answers[questionIndex] : null;
    var reveal = Boolean(session.showCorrect);
    var bottom = reveal
      ? '<div class="answer-reveal"><div class="answer-reveal__label">Смысл ответа</div><p>' + escapeHtml(question.explanation) + '</p></div>'
      : '<div class="response-note">Ведущий собирает логику группы. Правильный ход откроется на общем экране.</div>';

    app.innerHTML = [
      '<section class="screen" aria-labelledby="discussion-title">',
      '<p class="eyebrow">общий разбор</p>',
      '<p class="topic">', escapeHtml(question.topic), '</p>',
      '<h1 class="question" id="discussion-title">', escapeHtml(question.question), '</h1>',
      '<div class="options">', optionsMarkup(question, answer, true, reveal), '</div>',
      bottom,
      '</section>'
    ].join('');
  }

  function cardStep(number, title, hint, key, value, placeholder) {
    return [
      '<article class="card-step">',
      '<div class="card-step__topline"><span class="card-step__number">0', number, '</span><span class="card-step__title">', title, '</span></div>',
      '<p class="card-step__hint">', hint, '</p>',
      '<textarea class="card-field" data-card-field="', key, '" maxlength="280" placeholder="', placeholder, '">', escapeHtml(value || ''), '</textarea>',
      '</article>'
    ].join('');
  }

  function renderCard(state, participant) {
    var card = participant.card || {};
    var filled = Number(card.filledCount || 0);
    app.innerHTML = [
      '<section class="screen" aria-labelledby="card-title">',
      '<p class="eyebrow">твоя карта внедрения</p>',
      '<h1 id="card-title">Не «что узнал», а <span class="accent">что запустишь</span>.</h1>',
      '<p class="card-intro">Зафиксируй три опоры. Карта сохраняется в этой live-сессии и останется с тобой до завершения встречи.</p>',
      '<div class="card-stack">',
      cardStep(1, 'Рабочий контур', 'Набор инструментов и материалов, с которого ты начнёшь.', 'stack', card.stack, 'Например: Codex + GitHub + папка проекта'),
      cardStep(2, 'Процесс на 30 дней', 'Один повторяемый процесс, который проверишь в ближайший месяц.', 'process', card.process, 'Например: еженедельная сводка по заявкам'),
      cardStep(3, 'Манифест', 'Короткое правило, которое не даст вернуться к хаосу.', 'manifest', card.manifest, 'Например: сначала контекст и план, потом действие'),
      '</div>',
      '<div class="card-status"><span>Заполнено полей</span><strong>', filled, ' / 3</strong></div>',
      '</section>'
    ].join('');

    app.querySelectorAll('[data-card-field]').forEach(function (field) {
      field.addEventListener('input', function () {
        var key = field.getAttribute('data-card-field');
        clearTimeout(cardTimers[key]);
        cardTimers[key] = setTimeout(function () {
          if (phase(live.read()) !== 'card') return;
          var patch = {};
          patch[key] = field.value.slice(0, 280);
          live.updateCard(identity.id, patch);
        }, 350);
      });
      field.addEventListener('blur', function () {
        if (phase(live.read()) !== 'card') return;
        var key = field.getAttribute('data-card-field');
        clearTimeout(cardTimers[key]);
        var patch = {};
        patch[key] = field.value.slice(0, 280);
        live.updateCard(identity.id, patch);
      });
    });
  }

  function renderCertificate(state, participant) {
    var score = live.score(participant, live.questions());
    var url = certificateUrl(participant);
    app.innerHTML = [
      '<section class="screen screen--center" aria-labelledby="certificate-title">',
      '<p class="eyebrow">финальный артефакт</p>',
      '<h1 id="certificate-title">Сертификат <span class="accent">готов к просмотру</span>.</h1>',
      '<p class="lead">', escapeHtml(participant.name), ', твой маршрут по AI Цеху зафиксирован. При необходимости сначала проверь имя и номер на сертификате.</p>',
      '<div class="certificate-card">',
      '<span class="micro">СЕРТИФИКАТ ПРАКТИКУМА AI ЦЕХ</span>',
      '<span class="serial">', escapeHtml(participant.serial || ''), '</span>',
      '<a class="button button--primary" href="', url, '" target="_blank" rel="noopener">Открыть сертификат</a>',
      '</div>',
      '<p class="small">Результат теста: ', score, ' / 30. Сертификат подтверждает участие в практикуме; порядок выдачи определяет ведущий.</p>',
      '</section>'
    ].join('');
  }

  function renderDone(state, participant) {
    var url = certificateUrl(participant);
    app.innerHTML = [
      '<section class="screen screen--center" aria-labelledby="done-title">',
      '<div class="complete-mark" aria-hidden="true">OK</div>',
      '<p class="eyebrow">маршрут собран</p>',
      '<h1 id="done-title">Теперь <span class="accent">делай</span>.</h1>',
      '<p class="lead">Финальная встреча завершена. Самое ценное начинается в первом рабочем процессе, который ты действительно запустишь.</p>',
      '<a class="button button--secondary" href="', url, '" target="_blank" rel="noopener">Открыть свой сертификат</a>',
      '</section>'
    ].join('');
  }

  function renderFallback(state, participant) {
    app.innerHTML = [
      '<section class="screen screen--center" aria-labelledby="sync-title">',
      '<p class="eyebrow">синхронизация</p>',
      '<h1 id="sync-title">Ведущий <span class="accent">готовит следующий шаг</span>.</h1>',
      '<p class="lead">Оставайся на странице: экран обновится, когда сессия перейдёт в следующую фазу.</p>',
      '<div class="note-card">Текущая фаза: ', escapeHtml(phase(state)), '</div>',
      '</section>'
    ].join('');
  }

  function render(state) {
    latestState = state || latestState;
    if (isRendering) return;
    isRendering = true;
    try {
      if (!live) {
        app.innerHTML = '<section class="screen screen--center"><p class="eyebrow">ошибка запуска</p><h1>Live-движок <span class="accent">не найден</span>.</h1><p class="lead">Проверь, что live-core.js загружен до participant.js.</p></section>';
        return;
      }
      if (!identity) {
        renderRegistration();
        return;
      }
      var participant = participantFor(state);
      if (!participant) {
        renderRegistration();
        return;
      }
      if (phase(state) === 'lobby') renderLobby(state, participant);
      else if (phase(state) === 'test') renderQuestion(state, participant);
      else if (phase(state) === 'discussion') renderDiscussion(state, participant);
      else if (phase(state) === 'card') renderCard(state, participant);
      else if (phase(state) === 'certificate') renderCertificate(state, participant);
      else if (phase(state) === 'done') renderDone(state, participant);
      else renderFallback(state, participant);
    } finally {
      isRendering = false;
    }
  }

  if (!live || !app) return;

  if (!identity && getQueryName()) register(getQueryName());

  live.subscribe(function (state) {
    var previousPhase = phase(latestState);
    latestState = state;

    // Автосохранение карты не должно перерисовывать textarea и сбивать фокус.
    // Пока ведущая остаётся на фазе card, обновляем только счётчик заполнения.
    if (previousPhase === 'card' && phase(state) === 'card' && identity && app.querySelector('[data-card-field]')) {
      var participant = state.participants && state.participants[identity.id];
      var status = app.querySelector('.card-status strong');
      if (participant && status) status.textContent = String((participant.card && participant.card.filledCount) || 0) + ' / 3';
      return;
    }

    render(state);
  });

  window.setInterval(function () {
    if (latestState && phase(latestState) === 'test') render(live.read());
  }, 250);
}());
