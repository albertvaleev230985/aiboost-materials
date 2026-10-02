/* Панель ведущего финала AI Цеха, поток 2.
   Видно, кто вошёл, кто проходит тест и сколько набрал. Кнопка «Выдать сертификаты» выдаёт
   их всем, кто закончил тест: номер, имя и дата пишутся в ветку каждого участника, и у всех
   сразу открываются фейерверк и сертификат. После первой выдачи включается автовыдача:
   кто закончит позже, получит сертификат сам, пока панель открыта. «Сброс сессии» заводит
   новую чистую сессию и требует слова СБРОСИТЬ. */
(function () {
  'use strict';

  var F = window.NVFinal;
  var C = F.config;
  var app = document.getElementById('app');
  var modal = document.getElementById('modal');
  var modalBody = document.getElementById('modal-body');
  var toast = document.getElementById('toast');
  var list = F.questions();
  var lessons = window.AI_TSEH_LESSONS || {};
  var esc = F.escapeHtml;

  var state = {
    current: null,
    participants: {},
    numbering: null,
    online: null,
    currentNode: null,
    participantsNode: null,
    numberingNode: null,
    watchingCode: null,
    issuing: false,
    autoTimer: null,
    openDetails: {},
    lastSignature: '',
    toastTimer: null
  };

  var params = new URLSearchParams(window.location.search);
  if (params.get('key') !== C.hostKey) {
    app.innerHTML = '<section class="surface lock"><p class="eyebrow">панель ведущего</p><h2 class="surface-title">Нужна ссылка с ключом</h2><p class="surface-copy">Эта страница открывается по ссылке ведущего вида <code>…/host/?key=…</code>. Участникам нужна другая ссылка: экран участника.</p><div class="links-grid"><a class="button primary" href="../live/">Экран участника</a></div></section>';
    return;
  }

  // ---------- данные ----------

  function people() {
    var code = state.current && state.current.code;
    return Object.keys(state.participants || {}).map(function (pid) {
      var record = state.participants[pid] || {};
      var answers = record.answers && typeof record.answers === 'object' ? record.answers : {};
      var summary = F.summary(answers);
      return {
        pid: pid,
        name: record.name || (record.certificate && record.certificate.name) || pid,
        code: record.code || code,
        joinedAt: record.joinedAt || record.lastSeenAt || 0,
        lastSeenAt: record.lastSeenAt || 0,
        answers: answers,
        answered: summary.answered,
        score: summary.score,
        total: summary.total,
        finished: summary.finished,
        certificate: record.certificate && record.certificate.serial ? record.certificate : null
      };
    }).filter(function (person) {
      return person.name;
    }).sort(function (a, b) {
      return (a.joinedAt || 0) - (b.joinedAt || 0) || String(a.name).localeCompare(String(b.name), 'ru');
    });
  }

  function eligible(group) {
    return group.filter(function (person) { return person.finished && !person.certificate; });
  }

  function nextNumber() {
    var last = state.numbering && typeof state.numbering.last === 'number' ? state.numbering.last : C.serialStartAfter;
    return last + 1;
  }

  // ---------- подписки ----------

  function setOnline(online) {
    state.online = online;
    scheduleRender();
  }

  function start() {
    state.currentNode = F.watch('current', function (current) {
      if (!current || !current.code) {
        F.ensureCurrent().catch(function () {});
        return;
      }
      state.current = current;
      if (state.watchingCode !== current.code) watchParticipants(current.code);
      scheduleRender();
      scheduleAutoIssue();
    }, { pollMs: 4000, onStatus: setOnline });
    state.numberingNode = F.watch('numbering', function (numbering) {
      state.numbering = numbering || null;
      scheduleRender();
    }, { pollMs: 8000 });
  }

  function watchParticipants(code) {
    if (state.participantsNode) state.participantsNode.stop();
    state.watchingCode = code;
    state.participants = {};
    state.participantsNode = F.watch('sessions/' + code + '/participants', function (participants) {
      state.participants = participants && typeof participants === 'object' ? participants : {};
      scheduleRender();
      scheduleAutoIssue();
    }, { pollMs: 3000 });
  }

  // ---------- выдача ----------

  function issue(group, options) {
    var opts = options || {};
    if (state.issuing || !group.length || !state.current) return Promise.resolve([]);
    state.issuing = true;
    scheduleRender();
    var code = state.current.code;
    var payload = group.map(function (person) { return { pid: person.pid, name: person.name, score: person.score }; });
    return F.issueCertificates(code, payload).then(function (issued) {
      var tasks = [];
      if (!opts.keepAuto && !(state.current && state.current.autoIssue)) tasks.push(F.patch('current', { autoIssue: true }));
      return Promise.all(tasks).then(function () { return issued; });
    }).then(function (issued) {
      state.issuing = false;
      showToast((opts.auto ? 'Автовыдача: ' : 'Выдано: ') + issued.length + ' ' + F.plural(issued.length, 'сертификат', 'сертификата', 'сертификатов') + '. У людей уже фейерверк.');
      // Обновляем данные сразу, не дожидаясь событий.
      if (state.participantsNode) state.participantsNode.poll();
      if (state.currentNode) state.currentNode.poll();
      if (state.numberingNode) state.numberingNode.poll();
      scheduleRender();
      return issued;
    }, function (error) {
      state.issuing = false;
      console.error(error);
      showToast('Не получилось выдать: ' + (error && error.message ? error.message : 'ошибка сети') + '. Нажми ещё раз.');
      scheduleRender();
      return [];
    });
  }

  function scheduleAutoIssue() {
    clearTimeout(state.autoTimer);
    if (!state.current || !state.current.autoIssue) return;
    state.autoTimer = setTimeout(function () {
      var ready = eligible(people());
      if (ready.length && !state.issuing) issue(ready, { auto: true, keepAuto: true });
    }, 1500);
  }

  // ---------- отрисовка ----------

  var renderQueued = false;
  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    window.requestAnimationFrame(function () {
      renderQueued = false;
      render();
    });
  }

  function isOnline(person) {
    return person.lastSeenAt && Date.now() - person.lastSeenAt < 75000;
  }

  function statusOf(person) {
    if (person.certificate) return '<span class="pill good">сертификат выдан</span>';
    if (person.finished) return '<span class="pill wait">прошёл тест, ждёт</span>';
    if (person.answered) return '<span class="pill">проходит тест</span>';
    return '<span class="pill">вошёл</span>';
  }

  function certificateUrl(person) {
    var cert = person.certificate;
    return '../certificate/?name=' + encodeURIComponent(cert.name || person.name) + '&serial=' + encodeURIComponent(cert.serial) + '&date=' + encodeURIComponent(cert.date || C.certDate);
  }

  function rowMarkup(person) {
    var percent = person.total ? Math.round(person.answered / person.total * 100) : 0;
    var actions = [];
    if (person.certificate) {
      actions.push('<a class="button small" href="' + esc(certificateUrl(person)) + '" target="_blank" rel="noopener">Открыть</a>');
    } else {
      actions.push('<button class="button small" type="button" data-action="issue-one" data-pid="' + esc(person.pid) + '">Выдать</button>');
    }
    actions.push('<button class="button small" type="button" data-action="rename" data-pid="' + esc(person.pid) + '">Имя</button>');
    actions.push('<button class="button small danger" type="button" data-action="remove" data-pid="' + esc(person.pid) + '">Убрать</button>');
    return '<tr>' +
      '<td><div class="name-cell"><span class="dot ' + (isOnline(person) ? 'is-on' : '') + '" title="' + (isOnline(person) ? 'на странице' : 'давно не было на странице') + '"></span>' + esc(person.name) + '</div></td>' +
      '<td><div class="progress"><i style="width:' + percent + '%"></i></div><div class="progress-label">' + person.answered + ' / ' + person.total + '</div></td>' +
      '<td><span class="score">' + (person.answered ? person.score + ' / ' + person.total : '·') + '</span></td>' +
      '<td>' + statusOf(person) + '</td>' +
      '<td>' + (person.certificate ? '<span class="serial">' + esc(person.certificate.serial) + '</span>' : '<span class="progress-label">·</span>') + '</td>' +
      '<td><div class="row-actions">' + actions.join('') + '</div></td>' +
      '</tr>';
  }

  function mistakesMarkup(group) {
    var stats = list.map(function (question, index) {
      var answered = 0;
      var wrong = 0;
      var counts = question.options.map(function () { return 0; });
      var none = 0;
      group.forEach(function (person) {
        var answer = person.answers[question.key];
        if (!answer) return;
        answered += 1;
        if (!F.isCorrect(question, answer)) wrong += 1;
        if (answer.o >= 0) counts[question.order.indexOf(answer.o)] += 1;
        else none += 1;
      });
      return { index: index, question: question, answered: answered, wrong: wrong, counts: counts, none: none };
    }).filter(function (item) { return item.wrong > 0; }).sort(function (a, b) {
      return (b.wrong / b.answered) - (a.wrong / a.answered) || b.wrong - a.wrong || a.index - b.index;
    }).slice(0, 10);
    if (!stats.length) return '<div class="empty">Ошибок пока нет. Список появится, когда люди начнут отвечать.</div>';
    return stats.map(function (item) {
      var question = item.question;
      var id = 'm-' + question.key;
      return '<details class="mistake" data-details="' + id + '"' + (state.openDetails[id] ? ' open' : '') + '>' +
        '<summary><span class="mistake-num">' + String(item.index + 1).padStart(2, '0') + '</span><span class="mistake-q"><small>' + esc(question.topic) + '</small>' + esc(question.question) + '</span><span class="mistake-count">' + item.wrong + ' из ' + item.answered + '</span></summary>' +
        '<div class="mistake-body"><p><b>Верно: ' + String.fromCharCode(65 + question.answer) + '. ' + esc(question.options[question.answer]) + '</b></p><p>' + esc(question.explanation) + '</p>' +
        '<div class="dist">' + question.options.map(function (option, optionIndex) {
          return '<div class="' + (optionIndex === question.answer ? 'ok' : '') + '"><span>' + String.fromCharCode(65 + optionIndex) + '</span><span>' + esc(option) + '</span><span>' + item.counts[optionIndex] + '</span></div>';
        }).join('') + (item.none ? '<div><span>·</span><span>не успели ответить</span><span>' + item.none + '</span></div>' : '') + '</div></div>' +
        '</details>';
    }).join('');
  }

  function render() {
    var group = people();
    var ready = eligible(group);
    var signature = JSON.stringify([state.current, group, state.numbering, state.online, state.issuing, Math.floor(Date.now() / 15000)]);
    if (signature === state.lastSignature) return;
    state.lastSignature = signature;

    // Сохраняем раскрытые разборы, чтобы перерисовка их не закрывала.
    Array.prototype.forEach.call(app.querySelectorAll('details[data-details]'), function (details) {
      state.openDetails[details.getAttribute('data-details')] = details.open;
    });
    var scrollTop = window.scrollY;

    var inProgress = group.filter(function (person) { return !person.finished && !person.certificate; }).length;
    var finished = group.filter(function (person) { return person.finished; }).length;
    var issued = group.filter(function (person) { return person.certificate; }).length;
    var auto = Boolean(state.current && state.current.autoIssue);
    var code = state.current ? state.current.code : '…';
    var onlineLabel = state.online === false ? 'нет связи с базой' : state.online ? 'база на связи' : 'подключаюсь…';

    var issueLabel = state.issuing ? 'Выдаю…' : ready.length ? 'Выдать сертификаты · ' + ready.length : issued ? 'Все, кто закончил, уже с сертификатом' : 'Выдать сертификаты';
    var issueHint = ready.length
      ? 'Закончили тест и ждут: ' + ready.length + '. Нажатие сразу откроет у них фейерверк и сертификат. Первый номер: ' + F.serialFor(nextNumber()) + '.'
      : group.length ? 'Пока никто не ждёт сертификата. Кнопка оживёт, когда люди закончат тест.' : 'Пока никто не вошёл. Отправь участникам ссылку на экран участника.';

    app.innerHTML = [
      '<section class="intro">',
      '<div><p class="eyebrow">Финал · поток 2 · 3 октября 2026</p><h1>Финальный тест<br><span>и сертификаты</span></h1>',
      '<p class="intro-copy">Участники проходят 30 вопросов в своём темпе. Когда закончат, нажми «Выдать сертификаты»: у всех сразу откроются фейерверк и сертификат с кнопкой «Скачать». Сертификат остаётся у человека на экране, пока ты не сделаешь «Сброс сессии».</p></div>',
      '<div class="plate"><p class="eyebrow">Сессия</p><span class="plate-code">', esc(code), '</span><span class="plate-copy"><span class="dot ', state.online === false ? 'is-off' : state.online ? 'is-on' : '', '"></span>', onlineLabel, '</span><span class="plate-copy">Следующий номер: ', esc(F.serialFor(nextNumber())), '</span></div>',
      '</section>',

      '<section class="metrics">',
      '<div class="metric"><strong>', group.length, '</strong><span>вошли</span></div>',
      '<div class="metric"><strong>', inProgress, '</strong><span>проходят тест</span></div>',
      '<div class="metric is-accent"><strong>', finished, '</strong><span>прошли тест</span></div>',
      '<div class="metric is-good"><strong>', issued, '</strong><span>сертификатов выдано</span></div>',
      '</section>',

      '<section class="surface issue">',
      '<div><p class="eyebrow">Выдача</p><h2 class="surface-title">Сертификаты</h2><p class="surface-copy">', esc(issueHint), '</p>',
      auto ? '<div class="auto-line"><span class="dot is-on"></span><span><strong>Автовыдача включена:</strong> кто закончит тест сейчас, получит сертификат сам, пока эта панель открыта.</span><button class="button small" type="button" data-action="auto-off">Выключить</button></div>'
        : (issued ? '<div class="auto-line"><span class="dot"></span><span>Автовыдача выключена.</span><button class="button small" type="button" data-action="auto-on">Включить</button></div>' : ''),
      '</div>',
      '<div class="issue-actions"><button class="button primary big" type="button" data-action="issue-all"', (!ready.length || state.issuing) ? ' disabled' : '', '>', esc(issueLabel), '</button></div>',
      '</section>',

      '<section class="surface">',
      '<p class="eyebrow">Участники</p><h2 class="surface-title">Кто где</h2>',
      '<p class="surface-copy">Зелёная точка: человек сейчас на странице. Баллы считаются по ответам. «Выдать» в строке выдаёт сертификат одному человеку, даже если он не закончил тест (например, сел телефон).</p>',
      group.length ? '<div class="table-wrap"><table><thead><tr><th>Участник</th><th>Прогресс</th><th>Баллы</th><th>Статус</th><th>Номер</th><th></th></tr></thead><tbody>' + group.map(rowMarkup).join('') + '</tbody></table></div>' : '<div class="empty">Пока никого. Ссылка для участников: <b>' + esc(new URL('../live/', window.location.href).href) + '</b></div>',
      '<div class="links-grid">',
      '<button class="button" type="button" data-action="copy-link">Скопировать ссылку участника</button>',
      '<a class="button" href="../live/" target="_blank" rel="noopener">Открыть экран участника</a>',
      '<button class="button" type="button" data-action="copy-list"', issued ? '' : ' disabled', '>Скопировать список выданных</button>',
      '<button class="button" type="button" data-action="export-csv"', group.length ? '' : ' disabled', '>Скачать реестр CSV</button>',
      '</div>',
      '</section>',

      '<section class="surface">',
      '<p class="eyebrow">Разбор</p><h2 class="surface-title">Где ошибались чаще всего</h2>',
      '<p class="surface-copy">Топ вопросов по доле ошибок. Нажми на вопрос: верный ответ, объяснение и как ответила группа.</p>',
      '<div class="mistakes">', mistakesMarkup(group), '</div>',
      '</section>',

      '<section class="surface danger-zone">',
      '<p class="eyebrow">Перед уроком и после</p><h2 class="surface-title">Сброс сессии</h2>',
      '<p class="surface-copy">Начинает новую чистую сессию: убирает всех участников, их ответы и сертификаты с экранов. Файлы, которые люди уже скачали, останутся у них. Нужно ввести слово СБРОСИТЬ.</p>',
      '<div class="links-grid"><button class="button danger" type="button" data-action="reset">Сброс сессии</button></div>',
      '</section>'
    ].join('');

    window.scrollTo(0, scrollTop);
  }

  // ---------- модальные окна ----------

  function openModal(html, onReady) {
    modalBody.innerHTML = html;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    if (onReady) onReady(modalBody);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modalBody.innerHTML = '';
  }

  modal.addEventListener('click', function (event) {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeModal();
  });

  function showToast(message) {
    clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    state.toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 3800);
  }

  function findPerson(pid) {
    return people().filter(function (person) { return person.pid === pid; })[0] || null;
  }

  function confirmIssueAll() {
    var ready = eligible(people());
    if (!ready.length) return;
    openModal([
      '<p class="eyebrow">Выдача</p>',
      '<h2>Выдать ', ready.length, ' ', F.plural(ready.length, 'сертификат', 'сертификата', 'сертификатов'), '?</h2>',
      '<p>У каждого, кто закончил тест, сразу откроются фейерверк и сертификат с кнопкой «Скачать». Номера с <strong>', esc(F.serialFor(nextNumber())), '</strong> по порядку фамилий.</p>',
      '<p>', ready.map(function (person) { return esc(person.name); }).join(', '), '</p>',
      '<p>После выдачи включится автовыдача: кто закончит тест позже, получит сертификат сам.</p>',
      '<div class="modal-actions"><button class="button" type="button" data-modal="cancel">Отмена</button><button class="button primary" type="button" data-modal="ok">Выдать</button></div>'
    ].join(''), function (root) {
      root.querySelector('[data-modal="cancel"]').addEventListener('click', closeModal);
      root.querySelector('[data-modal="ok"]').addEventListener('click', function () {
        closeModal();
        issue(eligible(people()));
      });
    });
  }

  function confirmIssueOne(pid) {
    var person = findPerson(pid);
    if (!person || person.certificate) return;
    openModal([
      '<p class="eyebrow">Выдача одному</p>',
      '<h2>Выдать сертификат: ', esc(person.name), '?</h2>',
      person.finished ? '<p>Тест пройден: ' + person.score + ' из ' + person.total + '.</p>' : '<p><strong>Тест не закончен: ' + person.answered + ' из ' + person.total + '.</strong> Выдаём всё равно? У человека сразу откроется сертификат вместо теста.</p>',
      '<div class="modal-actions"><button class="button" type="button" data-modal="cancel">Отмена</button><button class="button primary" type="button" data-modal="ok">Выдать</button></div>'
    ].join(''), function (root) {
      root.querySelector('[data-modal="cancel"]').addEventListener('click', closeModal);
      root.querySelector('[data-modal="ok"]').addEventListener('click', function () {
        closeModal();
        issue([person], { keepAuto: true });
      });
    });
  }

  function renameDialog(pid) {
    var person = findPerson(pid);
    if (!person) return;
    openModal([
      '<p class="eyebrow">Имя в сертификате</p>',
      '<h2>Исправить имя</h2>',
      '<p>Так имя будет стоять в сертификате.', person.certificate ? ' Сертификат уже выдан: у человека он сразу обновится, номер останется тот же.' : '', '</p>',
      '<input type="text" id="rename-input" maxlength="60" value="', esc(person.name), '">',
      '<div class="modal-error" id="rename-error"></div>',
      '<div class="modal-actions"><button class="button" type="button" data-modal="cancel">Отмена</button><button class="button primary" type="button" data-modal="ok">Сохранить</button></div>'
    ].join(''), function (root) {
      var input = root.querySelector('#rename-input');
      input.focus();
      input.select();
      root.querySelector('[data-modal="cancel"]').addEventListener('click', closeModal);
      root.querySelector('[data-modal="ok"]').addEventListener('click', function () {
        var problem = F.nameProblem(input.value);
        if (problem) {
          root.querySelector('#rename-error').textContent = problem;
          return;
        }
        var name = F.prettyName(input.value);
        closeModal();
        F.renameParticipant(state.current.code, pid, name, Boolean(person.certificate)).then(function () {
          showToast('Имя обновлено: ' + name);
          if (state.participantsNode) state.participantsNode.poll();
        }, function () { showToast('Не получилось сохранить имя, попробуй ещё раз.'); });
      });
    });
  }

  function removeDialog(pid) {
    var person = findPerson(pid);
    if (!person) return;
    openModal([
      '<p class="eyebrow">Убрать из списка</p>',
      '<h2>Убрать: ', esc(person.name), '?</h2>',
      '<p>Нужно для дублей и случайных входов. Ответы этой записи удалятся.', person.certificate ? ' <strong>Сертификат ' + esc(person.certificate.serial) + ' у человека на экране останется</strong>, номер в реестре тоже.' : '', '</p>',
      '<div class="modal-actions"><button class="button" type="button" data-modal="cancel">Отмена</button><button class="button danger" type="button" data-modal="ok">Убрать</button></div>'
    ].join(''), function (root) {
      root.querySelector('[data-modal="cancel"]').addEventListener('click', closeModal);
      root.querySelector('[data-modal="ok"]').addEventListener('click', function () {
        closeModal();
        F.remove(F.participantPath(state.current.code, pid)).then(function () {
          showToast('Убрано: ' + person.name);
          if (state.participantsNode) state.participantsNode.poll();
        }, function () { showToast('Не получилось убрать, попробуй ещё раз.'); });
      });
    });
  }

  function resetDialog() {
    openModal([
      '<p class="eyebrow">Сброс сессии</p>',
      '<h2>Начать новую чистую сессию?</h2>',
      '<p>Уйдут все участники, их ответы и сертификаты с экранов. У людей откроется вход заново. Файлы, которые они уже скачали, останутся у них.</p>',
      '<p>Чтобы подтвердить, впиши слово <strong>СБРОСИТЬ</strong>.</p>',
      '<input type="text" id="reset-word" autocomplete="off" placeholder="СБРОСИТЬ">',
      '<label class="check"><input type="checkbox" id="reset-numbering"> <span>Обнулить нумерацию: следующий сертификат снова будет <strong>', esc(F.serialFor(C.serialStartAfter + 1)), '</strong>. Только если все выданные сертификаты были тестовыми.</span></label>',
      '<div class="modal-error" id="reset-error"></div>',
      '<div class="modal-actions"><button class="button" type="button" data-modal="cancel">Отмена</button><button class="button danger" type="button" data-modal="ok">Сбросить</button></div>'
    ].join(''), function (root) {
      root.querySelector('#reset-word').focus();
      root.querySelector('[data-modal="cancel"]').addEventListener('click', closeModal);
      root.querySelector('[data-modal="ok"]').addEventListener('click', function () {
        var word = root.querySelector('#reset-word').value.trim();
        if (word !== 'СБРОСИТЬ') {
          root.querySelector('#reset-error').textContent = 'Слово не совпало, ничего не удалено.';
          return;
        }
        var resetNumbering = root.querySelector('#reset-numbering').checked;
        closeModal();
        F.resetSession({ resetNumbering: resetNumbering }).then(function () {
          showToast('Сессия сброшена. Новая сессия чистая.' + (resetNumbering ? ' Нумерация снова с ' + F.serialFor(C.serialStartAfter + 1) + '.' : ''));
          if (state.currentNode) state.currentNode.poll();
          if (state.numberingNode) state.numberingNode.poll();
        }, function () { showToast('Сброс не прошёл: нет связи с базой. Попробуй ещё раз.'); });
      });
    });
  }

  // ---------- экспорт ----------

  function copyText(text, message) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { showToast(message); }, function () { window.prompt('Скопируй вручную:', text); });
    } else {
      window.prompt('Скопируй вручную:', text);
    }
  }

  function exportCsv() {
    var rows = [['Участник', 'Баллы', 'Ответов', 'Номер сертификата', 'Дата']];
    people().forEach(function (person) {
      rows.push([person.name, person.answered ? person.score + '/' + person.total : '', person.answered + '/' + person.total, person.certificate ? person.certificate.serial : '', person.certificate ? (person.certificate.date || C.certDate) : '']);
    });
    var csv = '﻿' + rows.map(function (row) {
      return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(';');
    }).join('\r\n');
    var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = 'ai-tseh-potok-2-final-reestr-' + (state.current ? state.current.code : '') + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
    showToast('Реестр скачан.');
  }

  // ---------- кнопки ----------

  document.addEventListener('click', function (event) {
    var element = event.target.closest('[data-action]');
    if (!element || !app.contains(element)) return;
    var action = element.getAttribute('data-action');
    var pid = element.getAttribute('data-pid');
    if (action === 'issue-all') confirmIssueAll();
    else if (action === 'issue-one') confirmIssueOne(pid);
    else if (action === 'rename') renameDialog(pid);
    else if (action === 'remove') removeDialog(pid);
    else if (action === 'reset') resetDialog();
    else if (action === 'auto-off') F.patch('current', { autoIssue: false }).then(function () { if (state.currentNode) state.currentNode.poll(); showToast('Автовыдача выключена.'); });
    else if (action === 'auto-on') F.patch('current', { autoIssue: true }).then(function () { if (state.currentNode) state.currentNode.poll(); showToast('Автовыдача включена.'); });
    else if (action === 'copy-link') copyText(new URL('../live/', window.location.href).href, 'Ссылка участника скопирована.');
    else if (action === 'copy-list') copyText(people().filter(function (person) { return person.certificate; }).map(function (person) { return person.certificate.serial + '  ' + person.name; }).join('\n'), 'Список скопирован.');
    else if (action === 'export-csv') exportCsv();
  });

  app.addEventListener('toggle', function (event) {
    var details = event.target;
    if (details && details.getAttribute && details.getAttribute('data-details')) state.openDetails[details.getAttribute('data-details')] = details.open;
  }, true);

  setInterval(scheduleRender, 15000);
  app.innerHTML = '<div class="empty">Подключаюсь к базе…</div>';
  start();
}());
