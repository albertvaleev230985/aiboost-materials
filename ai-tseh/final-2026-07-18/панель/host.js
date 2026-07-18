(function () {
  'use strict';

  var app = document.getElementById('app');
  var tabs = document.getElementById('tabs');
  var sessionPlate = document.getElementById('session-plate');
  var modal = document.getElementById('modal');
  var modalBody = document.getElementById('modal-body');
  var toast = document.getElementById('toast');
  var live = window.AITsehLive;
  var hostData = window.AI_TSEH_HOST_NOTES || {};
  var activeTab = 'scenario';
  var currentState = null;
  var activeModalIndex = null;
  var toastTimer = null;
  var resetArmedUntil = 0;

  if (!live) {
    app.innerHTML = '<div class="empty">Не загрузился <code>../live/live-core.js</code>. Обнови страницу и проверь подключение к интернету.</div>';
    return;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character];
    });
  }

  function plural(value, one, many) {
    return value === 1 ? one : many;
  }

  function letter(index) {
    return String.fromCharCode(65 + index);
  }

  function questions() {
    return live.questions();
  }

  function participants(state) {
    return Object.keys(state.participants || {}).map(function (id) {
      return state.participants[id];
    }).sort(function (left, right) {
      return (left.joinedAt || 0) - (right.joinedAt || 0);
    });
  }

  function noteFor(question) {
    var allNotes = hostData.hostNotes || [];
    var note = allNotes.find(function (item) { return item.id === question.id; }) || {};
    return {
      cue: question.hostNote || note.cue || 'Тезис ведущему',
      debrief: note.debrief || []
    };
  }

  function phaseLabel(phase) {
    var labels = {
      lobby: 'Лобби',
      test: 'Тест',
      discussion: 'Разбор',
      card: 'Карты',
      certificate: 'Сертификаты',
      done: 'Финал'
    };
    return labels[phase] || phase;
  }

  function sessionPlateMarkup(state) {
    var participantCount = participants(state).length;
    return '<p class="eyebrow">Облачная live-сессия</p>' +
      '<strong class="plate-code">' + escapeHtml(state.session.code) + '</strong>' +
      '<span class="plate-copy">' + escapeHtml(phaseLabel(state.session.phase)) + ' · ' + participantCount + ' ' + plural(participantCount, 'участник', 'участников') + '</span>';
  }

  function renderTabs() {
    tabs.querySelectorAll('[data-tab]').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.tab === activeTab);
      button.setAttribute('aria-current', button.dataset.tab === activeTab ? 'page' : 'false');
    });
  }

  function viewHead(title, subtitle) {
    return '<div class="view-head"><div><p class="eyebrow">Панель ведущего</p><h2>' + escapeHtml(title) + '</h2></div><p class="view-subtitle">' + escapeHtml(subtitle) + '</p></div>';
  }

  function renderScenario() {
    var panel = hostData.panel || {};
    var scenario = panel.scenario || {};
    var catalog = panel.catalog || {};
    var controls = (panel.liveControl && panel.liveControl.controls) || [];
    var guardrails = (panel.liveControl && panel.liveControl.guardrails) || [];
    var blocks = scenario.blocks || [];
    return viewHead(scenario.title || 'Сценарий занятия', (scenario.duration || '120 минут') + ' · смысловой маршрут без экзамена по сухим терминам') +
      '<section class="surface surface-pad"><div class="scenario-grid">' + blocks.map(function (block) {
        return '<article class="scenario-block"><span class="scenario-time">' + escapeHtml(block.time) + '</span><h3>' + escapeHtml(block.title) + '</h3><p>' + escapeHtml(block.hostAction) + '</p><span class="scenario-outcome">' + escapeHtml(block.outcome) + '</span></article>';
      }).join('') + '</div></section>' +
      '<div class="two-col"><section class="surface surface-pad"><p class="eyebrow">Тематические блоки</p><h3 class="surface-title">' + escapeHtml(catalog.title || 'Каталог вопросов') + '</h3><p class="surface-copy">' + escapeHtml(catalog.usage || '') + '</p><div class="catalog-grid">' + (catalog.groups || []).map(function (group) {
        return '<article class="catalog-item"><span class="catalog-range">' + escapeHtml(group.range) + '</span><h3>' + escapeHtml(group.title) + '</h3><p>' + escapeHtml(group.focus) + '</p></article>';
      }).join('') + '</div></section>' +
      '<section class="surface surface-pad"><p class="eyebrow">Рамки ведущего</p><h3 class="surface-title">Контроль без публичного сравнения</h3><ul class="list-clean">' + guardrails.map(function (item) {
        return '<li>' + escapeHtml(item) + '</li>';
      }).join('') + '</ul><div class="notice" style="margin-top:18px"><strong>Контроль ведущего:</strong> данные live-сессии помогают провести занятие, но сертификаты всё равно проверяются по утверждённому реестру.</div></section></div>' +
      '<section class="surface surface-pad" style="margin-top:16px"><p class="eyebrow">Что умеет пульт</p><h3 class="surface-title">Live control</h3><div class="catalog-grid">' + controls.map(function (control) {
        return '<article class="catalog-item"><span class="catalog-range">' + escapeHtml(control.label) + '</span><p style="margin-top:8px">' + escapeHtml(control.action) + '</p></article>';
      }).join('') + '</div></section>';
  }

  function questionMarkup(question, index) {
    var note = noteFor(question);
    var debrief = note.debrief.length ? note.debrief.map(function (item) { return '<p>' + escapeHtml(item) + '</p>'; }).join('') : '<p>Подсказка пока не добавлена.</p>';
    return '<article class="question-card" id="question-' + question.id + '">' +
      '<div class="question-number">' + String(index + 1).padStart(2, '0') + '</div>' +
      '<div><p class="question-topic">' + escapeHtml(question.topic) + '</p><h3 class="question-text">' + escapeHtml(question.question) + '</h3>' +
      '<div class="question-options">' + question.options.map(function (option, optionIndex) {
        return '<div class="option-line' + (optionIndex === question.answer ? ' is-correct' : '') + '"><span class="option-letter">' + letter(optionIndex) + '</span><span>' + escapeHtml(option) + '</span></div>';
      }).join('') + '</div>' +
      '<div class="question-detail"><p><strong>Explanation.</strong> ' + escapeHtml(question.explanation) + '</p><div class="host-note"><p><strong>Host note · ' + escapeHtml(note.cue) + '.</strong></p>' + debrief + '</div></div></div>' +
      '<div class="compact-meta"><span class="correct-label">Верный ответ</span><strong>' + letter(question.answer) + '</strong><button class="button" type="button" data-action="open-question" data-question-index="' + index + '">Разбор</button></div>' +
      '</article>';
  }

  function renderQuestions() {
    var list = questions();
    if (!list.length) return viewHead('Вопросы', 'Источник теста не загрузился') + '<div class="empty">Проверь <code>../тест/questions.js</code>.</div>';
    return viewHead('Вопросы', list.length + ' вопросов · правильный вариант, explanation и hostNote уже разложены по карточкам') +
      '<div class="notice"><strong>Порядок вариантов тот же, что увидят участники.</strong> Он детерминированно перемешан в <code>live-core.js</code>, поэтому буква верного ответа в панели и тесте совпадает.</div>' +
      '<section class="question-list" style="margin-top:16px">' + list.map(questionMarkup).join('') + '</section>';
  }

  function statusForParticipant(participant, state, list) {
    var session = state.session;
    var current = list[session.currentQuestion];
    if (session.phase === 'test' && current) {
      var answer = participant.answers && participant.answers[session.currentQuestion];
      if (answer == null) return { label: 'ждёт ответа', className: '' };
      if (answer === current.answer) return { label: 'верно · ' + letter(answer), className: 'good' };
      return { label: 'другой вариант · ' + letter(answer), className: 'bad' };
    }
    if (session.phase === 'discussion' || session.phase === 'done') return { label: live.score(participant, list) + '/' + list.length + ' в тесте', className: '' };
    if (session.phase === 'card') return { label: ((participant.card && participant.card.filledCount) || 0) + '/3 полей карты', className: '' };
    if (session.phase === 'certificate') return { label: 'список к проверке', className: 'good' };
    return { label: 'в лобби', className: '' };
  }

  function currentStageMarkup(state, list) {
    var session = state.session;
    var question = list[session.currentQuestion];
    var remaining = live.remainingSeconds(session);
    var timerClass = remaining == null ? 'is-idle' : remaining <= 0 ? 'is-expired' : '';
    var timerText = remaining == null ? '—' : String(remaining).padStart(2, '0');
    var stage = '<div class="phase-line"><span class="phase-label">' + escapeHtml(phaseLabel(session.phase)) + '</span><span class="timer ' + timerClass + '">' + timerText + '</span></div>';
    if (session.phase === 'test' && question) {
      stage += '<div class="live-question"><p class="live-counter">ВОПРОС ' + String(session.currentQuestion + 1).padStart(2, '0') + ' ИЗ ' + list.length + ' · ' + escapeHtml(question.topic) + '</p><h3>' + escapeHtml(question.question) + '</h3>';
      if (session.showCorrect) {
        stage += '<div class="reveal-panel"><p class="eyebrow">Верный ответ · ' + letter(question.answer) + '</p><strong>' + escapeHtml(question.options[question.answer]) + '</strong><p>' + escapeHtml(question.explanation) + '</p></div>';
      }
      stage += '</div>';
    } else if (session.phase === 'test') {
      stage += '<p class="stage-waiting">Тест запущен. Ведущая ещё не вывела первый вопрос.</p>';
    } else if (session.phase === 'discussion') {
      stage += '<p class="stage-waiting">Разбор результатов. Открой Heatmap и выбери вопросы с максимальным числом ошибок.</p>';
    } else if (session.phase === 'card') {
      stage += '<p class="stage-waiting">Тихая работа над картой следующего шага. Таймер рассчитан на пять минут.</p>';
    } else if (session.phase === 'certificate') {
      stage += '<p class="stage-waiting">Список сертификатов готов к ручной проверке. Панель не выдаёт и не отправляет их автоматически.</p>';
    } else if (session.phase === 'done') {
      stage += '<p class="stage-waiting">Финальная встреча завершена. Данные live-сессии сохраняются до явного сброса ведущим.</p>';
    } else {
      stage += '<p class="stage-waiting">Лобби. Участники могут подключиться, ведущая запускает тест только после общего старта.</p>';
    }
    return stage;
  }

  function liveControlsMarkup(state, list) {
    var session = state.session;
    var controls = '';
    if (session.phase === 'lobby') {
      controls = '<button class="button primary" type="button" data-action="start-test">Запустить тест</button>';
    } else if (session.phase === 'test' && session.currentQuestion < 0) {
      controls = '<button class="button primary" type="button" data-action="first-question">Первый вопрос</button><button class="button" type="button" data-action="discussion">К разбору</button>';
    } else if (session.phase === 'test') {
      if (!session.showCorrect) controls += '<button class="button" type="button" data-action="reveal">Показать правильный</button>';
      controls += session.currentQuestion < list.length - 1 ? '<button class="button primary" type="button" data-action="next-question">Следующий вопрос</button>' : '<button class="button primary" type="button" data-action="discussion">К разбору heatmap</button>';
      controls += '<button class="button" type="button" data-action="discussion">Пауза → разбор</button>';
    } else if (session.phase === 'discussion') {
      controls = '<button class="button primary" type="button" data-action="start-card">Запустить карты · 5 минут</button><button class="button" type="button" data-action="certificates">К сертификатам</button>';
    } else if (session.phase === 'card') {
      controls = '<button class="button primary" type="button" data-action="certificates">Открыть сертификаты</button><button class="button" type="button" data-action="done">Завершить встречу</button>';
    } else if (session.phase === 'certificate') {
      controls = '<button class="button primary" type="button" data-action="done">Завершить встречу</button><button class="button" type="button" data-action="start-card">Вернуться к картам</button>';
    } else {
      controls = '<button class="button" type="button" data-action="back-lobby">Вернуть в лобби</button>';
    }
    return '<aside class="surface control-deck"><p class="eyebrow">Управление фазами</p><h3>' + escapeHtml(phaseLabel(session.phase)) + '</h3>' + controls + '<p class="stage-note">Изменения уходят в облачную live-сессию и появляются на устройствах участников автоматически.</p></aside>';
  }

  function renderLive(state) {
    var list = questions();
    var group = participants(state);
    var currentQuestion = list[state.session.currentQuestion];
    var answered = currentQuestion ? group.filter(function (participant) { return participant.answers && participant.answers[state.session.currentQuestion] != null; }).length : 0;
    return viewHead('Live', 'Пульт ведущей: фаза, общий таймер, текущий вопрос и состояние группы') +
      '<div class="notice"><strong>LIVE-СИНХРОНИЗАЦИЯ ВКЛЮЧЕНА.</strong> Панель управляет общей фазой, участники отвечают со своих устройств. Сертификаты не отправляются автоматически.</div>' +
      '<div class="action-row"><a class="button" href="../live/" target="_blank" rel="noopener">Открыть экран участника</a><button class="button" type="button" data-action="copy-participant-link">Скопировать ссылку участника</button><button class="button" type="button" data-action="seed-demo">Заполнить демо-данными</button><button class="button danger" type="button" data-action="reset">' + (Date.now() < resetArmedUntil ? 'Подтвердить сброс' : 'Сбросить live-сессию') + '</button></div>' +
      '<div class="live-layout" style="margin-top:16px"><section class="live-stage">' + currentStageMarkup(state, list) + '</section>' + liveControlsMarkup(state, list) + '</div>' +
      '<section class="metrics"><div class="metric"><strong class="metric-value">' + group.length + '</strong><span class="metric-label">в сессии</span></div><div class="metric"><strong class="metric-value">' + answered + '</strong><span class="metric-label">ответили сейчас</span></div><div class="metric"><strong class="metric-value">' + (currentQuestion ? String(state.session.currentQuestion + 1).padStart(2, '0') : '—') + '</strong><span class="metric-label">текущий вопрос</span></div></section>' +
      '<section class="surface surface-pad" style="margin-top:16px"><p class="eyebrow">Пульс группы</p><h3 class="surface-title">Участники</h3>' +
      (group.length ? '<div class="participant-grid">' + group.map(function (participant) { var participantStatus = statusForParticipant(participant, state, list); return '<div class="participant-cell"><span class="participant-name">' + escapeHtml(participant.name) + '</span><span class="participant-state ' + participantStatus.className + '">' + escapeHtml(participantStatus.label) + '</span></div>'; }).join('') + '</div>' : '<div class="empty" style="margin-top:16px">Пока никого нет. Нажми «Заполнить демо-данными», чтобы отрепетировать карту и сертификаты.</div>') + '</section>';
  }

  function questionStats(list, group) {
    return list.map(function (question, index) {
      var answered = 0;
      var wrong = 0;
      group.forEach(function (participant) {
        var answer = participant.answers && participant.answers[index];
        if (answer != null) {
          answered += 1;
          if (answer !== question.answer) wrong += 1;
        }
      });
      return { index: index, question: question, answered: answered, wrong: wrong };
    });
  }

  function renderHeatmap(state) {
    var list = questions();
    var group = participants(state);
    var stats = questionStats(list, group);
    var mistakes = stats.filter(function (item) { return item.wrong > 0; }).sort(function (left, right) { return right.wrong - left.wrong || left.index - right.index; }).slice(0, 5);
    var topErrors = mistakes.length ? '<div class="errors-grid">' + mistakes.map(function (item) {
      return '<button class="error-card" type="button" data-action="open-question" data-question-index="' + item.index + '"><strong>' + String(item.index + 1).padStart(2, '0') + ' · ' + escapeHtml(item.question.topic) + '</strong><span>' + item.wrong + ' ' + plural(item.wrong, 'ошибка', 'ошибок') + ' из ' + item.answered + '</span></button>';
    }).join('') + '</div>' : '<div class="empty" style="margin-top:16px">Ошибок пока нет: дождись ответов или добавь демо-данные.</div>';
    if (!group.length) {
      return viewHead('Heatmap', 'Карта ответов и темы, к которым стоит вернуться') + '<div class="empty">Нет участников. Демо-данные создаются во вкладке Live.</div>';
    }
    return viewHead('Heatmap', 'Зелёное — верно, медно-красное — другой вариант, серое — нет ответа') +
      '<section class="surface surface-pad"><p class="eyebrow">Топ ошибок</p><h3 class="surface-title">Сначала разбирать не всё подряд, а самые трудные места</h3>' + topErrors + '</section>' +
      '<section class="surface surface-pad" style="margin-top:16px"><p class="eyebrow">Карта ответов</p><h3 class="surface-title">' + list.length + ' вопросов × ' + group.length + ' ' + plural(group.length, 'участник', 'участников') + '</h3><p class="surface-copy">Клик на номер вопроса или ячейку открывает агрегированный разбор без списка персональных ответов.</p><div class="heatmap-wrap" style="margin-top:16px"><table class="heatmap"><thead><tr><th class="name-cell">Участник</th>' + stats.map(function (item) {
        return '<th data-action="open-question" data-question-index="' + item.index + '"><span class="error-count' + (item.wrong ? '' : ' is-zero') + '">' + item.wrong + '</span>' + String(item.index + 1).padStart(2, '0') + '</th>';
      }).join('') + '<th>Σ</th></tr></thead><tbody>' + group.map(function (participant) {
        return '<tr><td class="name-cell">' + escapeHtml(participant.name) + '</td>' + list.map(function (question, index) {
          var answer = participant.answers && participant.answers[index];
          var className = answer == null ? 'pending' : answer === question.answer ? 'ok' : 'bad';
          var label = answer == null ? '—' : letter(answer);
          return '<td class="heatmap-cell ' + className + '" data-action="open-question" data-question-index="' + index + '">' + label + '</td>';
        }).join('') + '<td class="heatmap-total">' + live.score(participant, list) + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }

  function renderCards(state) {
    var group = participants(state);
    if (!group.length) return viewHead('Карты', 'Три поля следующего шага от каждого участника') + '<div class="empty">Карты появятся после подключения участников или демо-заполнения во вкладке Live.</div>';
    return viewHead('Карты', 'Рабочий стек, первый процесс и короткий манифест следующего действия') +
      '<div class="notice"><strong>Нужна ведущей, не проектору.</strong> Карта помогает выбрать пару манифестов для добровольного разбора, а не ранжировать людей.</div>' +
      '<section class="cards-list" style="margin-top:16px">' + group.map(function (participant) {
        var card = participant.card || {};
        var filled = card.filledCount || 0;
        return '<article class="personal-card"><div><h3>' + escapeHtml(participant.name) + '</h3><span class="card-status">' + filled + '/3 полей</span></div><div><span class="field-label">Рабочий стек</span><span class="field-value">' + escapeHtml(card.stack || '—') + '</span></div><div><span class="field-label">Процесс</span><span class="field-value">' + escapeHtml(card.process || '—') + '</span></div><div><span class="field-label">Манифест</span><span class="field-value">' + escapeHtml(card.manifest || '—') + '</span></div></article>';
      }).join('') + '</section>';
  }

  function certificateUrl(participant) {
    return '../сертификат/?name=' + encodeURIComponent(participant.name || '') + '&serial=' + encodeURIComponent(participant.serial || '');
  }

  function renderCertificates(state) {
    var group = participants(state);
    var phaseHint = state.session.phase === 'certificate' ? 'Фаза сертификатов открыта, но выдача остаётся ручным действием ведущей.' : 'До фазы сертификатов можно проверить имена и серийные номера.';
    if (!group.length) return viewHead('Сертификаты', 'Проверочный список для ручной выдачи') + '<div class="empty">Список пуст. Добавь демо-данные или дождись участников.</div>';
    return viewHead('Сертификаты', phaseHint) +
      '<div class="notice"><strong>Не автоматическая выдача.</strong> Сначала сверить имя, правило прохождения и серийный номер; только затем открыть утверждённый сертификат и передать его человеку.</div>' +
      '<div class="action-row"><button class="button" type="button" data-action="copy-names">Скопировать имена</button><button class="button" type="button" data-action="export-json">Скачать JSON</button></div>' +
      '<section class="certificate-table-wrap" style="margin-top:16px"><table class="certificate-table"><thead><tr><th>Участник</th><th>Серия</th><th>Результат live-сессии</th><th>Ссылка на макет</th></tr></thead><tbody>' + group.map(function (participant) {
        return '<tr><td>' + escapeHtml(participant.name) + '</td><td><span class="serial">' + escapeHtml(participant.serial || '—') + '</span></td><td>' + live.score(participant, questions()) + '/' + questions().length + '</td><td><a class="certificate-link" href="' + escapeHtml(certificateUrl(participant)) + '" target="_blank" rel="noopener">Открыть макет</a></td></tr>';
      }).join('') + '</tbody></table></section>';
  }

  function render() {
    if (!currentState) return;
    sessionPlate.innerHTML = sessionPlateMarkup(currentState);
    renderTabs();
    if (activeTab === 'scenario') app.innerHTML = renderScenario();
    else if (activeTab === 'questions') app.innerHTML = renderQuestions();
    else if (activeTab === 'live') app.innerHTML = renderLive(currentState);
    else if (activeTab === 'heatmap') app.innerHTML = renderHeatmap(currentState);
    else if (activeTab === 'cards') app.innerHTML = renderCards(currentState);
    else if (activeTab === 'certificates') app.innerHTML = renderCertificates(currentState);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2800);
  }

  function copyText(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { showToast(successMessage); }).catch(function () { window.prompt('Скопируй текст вручную:', text); });
    } else {
      window.prompt('Скопируй текст вручную:', text);
    }
  }

  function exportJson() {
    var payload = {
      exportedAt: new Date().toISOString(),
      mode: 'cloud-live',
      session: currentState.session,
      participants: participants(currentState).map(function (participant) {
        return {
          id: participant.id,
          name: participant.name,
          serial: participant.serial,
          score: live.score(participant, questions()),
          answers: participant.answers || {},
          card: participant.card || {}
        };
      })
    };
    var url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ai-tseh-final-live-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast('JSON live-сессии скачан.');
  }

  function openQuestion(index) {
    var list = questions();
    var question = list[index];
    if (!question) return;
    var group = participants(currentState);
    var note = noteFor(question);
    var counts = question.options.map(function () { return 0; });
    group.forEach(function (participant) {
      var answer = participant.answers && participant.answers[index];
      if (answer != null && counts[answer] != null) counts[answer] += 1;
    });
    activeModalIndex = index;
    modalBody.innerHTML = '<p class="question-topic">Вопрос ' + String(index + 1).padStart(2, '0') + ' · ' + escapeHtml(question.topic) + '</p><h2 id="modal-title" style="margin:0;font-size:28px;line-height:1.15;letter-spacing:-.035em">' + escapeHtml(question.question) + '</h2><div class="distribution">' + question.options.map(function (option, optionIndex) {
      return '<div class="distribution-row' + (optionIndex === question.answer ? ' is-correct' : '') + '"><span class="option-letter">' + letter(optionIndex) + '</span><span>' + escapeHtml(option) + '</span><strong class="distribution-count">' + counts[optionIndex] + '</strong></div>';
    }).join('') + '</div><div class="question-detail"><p><strong>Explanation.</strong> ' + escapeHtml(question.explanation) + '</p><div class="host-note"><p><strong>Host note · ' + escapeHtml(note.cue) + '.</strong></p>' + (note.debrief || []).map(function (item) { return '<p>' + escapeHtml(item) + '</p>'; }).join('') + '</div></div>';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    activeModalIndex = null;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function seedAllDemo() {
    live.seedDemo();
    var seeded = live.read();
    var list = questions();
    Object.keys(seeded.participants || {}).forEach(function (id, participantIndex) {
      var participant = seeded.participants[id];
      participant.answers = {};
      list.forEach(function (question, index) {
        participant.answers[index] = (index + participantIndex) % 5 === 0 ? (question.answer + 1) % question.options.length : question.answer;
      });
    });
    live.write(seeded);
    showToast('Демо-группа добавлена в общую live-сессию.');
  }

  function handleAction(action, element) {
    var session = currentState.session;
    var list = questions();
    if (action === 'tab') {
      activeTab = element.dataset.tab;
      render();
      return;
    }
    if (action === 'seed-demo') return seedAllDemo();
    if (action === 'reset') {
      if (Date.now() < resetArmedUntil) {
        resetArmedUntil = 0;
        live.reset();
        showToast('Live-сессия сброшена.');
      } else {
        resetArmedUntil = Date.now() + 8000;
        render();
        showToast('Нажми «Подтвердить сброс» в течение восьми секунд.');
        window.setTimeout(function () {
          if (Date.now() >= resetArmedUntil) {
            resetArmedUntil = 0;
            render();
          }
        }, 8100);
      }
      return;
    }
    if (action === 'start-test') {
      live.setSession({ phase: 'test', currentQuestion: -1, showCorrect: false, timerStartedAt: null, timerDurationSec: 30 });
      return;
    }
    if (action === 'first-question') return live.startQuestion(0);
    if (action === 'next-question') {
      if (session.currentQuestion >= list.length - 1) return live.setSession({ phase: 'discussion', showCorrect: false, timerStartedAt: null });
      return live.startQuestion(session.currentQuestion + 1);
    }
    if (action === 'reveal') return live.setSession({ showCorrect: true, timerStartedAt: null });
    if (action === 'discussion') return live.setSession({ phase: 'discussion', showCorrect: false, timerStartedAt: null });
    if (action === 'start-card') return live.setSession({ phase: 'card', currentQuestion: -1, showCorrect: false, timerStartedAt: Date.now(), timerDurationSec: 300 });
    if (action === 'certificates') return live.setSession({ phase: 'certificate', timerStartedAt: null });
    if (action === 'done') return live.setSession({ phase: 'done', timerStartedAt: null });
    if (action === 'back-lobby') return live.setSession({ phase: 'lobby', currentQuestion: -1, showCorrect: false, timerStartedAt: null, timerDurationSec: 30 });
    if (action === 'open-question') return openQuestion(Number(element.dataset.questionIndex));
    if (action === 'close-modal') return closeModal();
    if (action === 'copy-names') return copyText(participants(currentState).map(function (participant) { return participant.name; }).join('\n'), 'Имена скопированы в буфер.');
    if (action === 'copy-participant-link') return copyText(new URL('../live/', window.location.href).href, 'Ссылка участника скопирована.');
    if (action === 'export-json') return exportJson();
  }

  document.addEventListener('click', function (event) {
    var actionElement = event.target.closest('[data-action]');
    if (actionElement) {
      event.preventDefault();
      handleAction(actionElement.dataset.action, actionElement);
      return;
    }
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && activeModalIndex != null) closeModal();
  });

  live.subscribe(function (state) {
    currentState = state;
    render();
  });

  window.setInterval(function () {
    if (currentState && currentState.session && currentState.session.timerStartedAt) render();
  }, 1000);
}());
