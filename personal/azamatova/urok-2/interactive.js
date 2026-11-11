
'use strict';
(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const cur = () => slides.find(s => s.classList.contains('active'));
  const ixOf = s => s && s.querySelector('.ix');
  const phone = () => false;   // мобильной ленты у учебной деки нет: на любом экране это слайды 16:9
  const DATA = {"next": {"plain": {"lead": "Клиент спросил цену и пропал. Отвечаю:", "context": "", "steps": [["Здравствуйте,", [["Здравствуйте,", 62], ["Добрый день,", 31], ["Привет,", 6], ["Эй,", 0.1]]], ["вы", [["вы", 48], ["мы", 22], ["хотел", 19], ["почему", 3]]], ["интересовались", [["интересовались", 55], ["спрашивали", 33], ["пропали", 4], ["молчите", 1]]], ["стоимостью", [["стоимостью", 51], ["ценой", 40], ["скидкой", 5], ["погодой", 0.01]]], ["наших услуг.", [["наших услуг.", 46], ["работ.", 31], ["заказа.", 18], ["бетона.", 2]]], ["Актуально?", [["Актуально?", 44], ["Подскажите,", 30], ["Остались вопросы?", 21], ["Купите!", 1]]]]}, "ctx": {"lead": "Клиент спросил цену и пропал. Отвечаю:", "context": "Подсказка: клиент Марат, два кондиционера в офис, смета 84 000 ₽ действует до пятницы, монтаж свободен в субботу.", "steps": [["Марат,", [["Марат,", 71], ["Здравствуйте,", 19], ["Добрый день,", 8], ["Привет,", 1]]], ["добрый день!", [["добрый день!", 66], ["это", 17], ["по смете", 12], ["вы где?", 0.5]]], ["Смета на два кондиционера", [["Смета на два кондиционера", 58], ["Ваш заказ", 24], ["Цена", 15], ["Скидка", 2]]], ["84 000 ₽ в силе до пятницы.", [["84 000 ₽ в силе до пятницы.", 63], ["готова.", 22], ["ждёт вас.", 12], ["уже сгорела.", 1]]], ["Монтаж могу поставить", [["Монтаж могу поставить", 52], ["Бригада свободна", 33], ["Приедем", 12], ["Когда-нибудь", 0.2]]], ["на субботу. Бронирую?", [["на субботу. Бронирую?", 57], ["в субботу, удобно?", 35], ["на выходные.", 7], ["через месяц.", 0.4]]]]}}, "formula": {"Продажи": ["Ты финансовый аналитик сети кофеен.", "Три кофейни Surf Coffee, прикрепляю выгрузку iiko за две недели. Разбор пойдёт на планёрку в понедельник.", "Найди, где и почему просела выручка.", "Таблица по кофейням и три вывода по одной строке.", "Только цифры из файла, у каждой цифры столбец. Причины не придумывай."], "Отзывы": ["Ты управляющая кофейней, которая отвечает на отзывы сама.", "В Яндекс Картах отзыв на одну звезду: гость ждал раф 15 минут, на смене был один бариста вместо двух.", "Напиши публичный ответ, после которого хочется прийти ещё раз.", "До 70 слов: признать, что поменяли, приглашение.", "Без шаблонных извинений, без скидок и подарков: ответ читают все гости."], "Команда": ["Ты методист, который пишет стандарты для кофеен.", "Новые бариста путаются в открытии смены, утром витрина готова к 8:15 вместо 7:45.", "Собери стандарт открытия смены по моему рассказу.", "Шаги по порядку и чек-лист из 10 пунктов для распечатки.", "Ничего не добавляй от себя: где дыра, задай вопрос."], "Меню": ["Ты бренд-шеф сети кофеен.", "С 1 декабря зимнее меню в трёх кофейнях, у бара обычное оборудование, бариста двое на смене.", "Предложи 8 сезонных напитков и 5 десертов к ним.", "Таблица: название, из чего, почему зайдёт, сложность от 1 до 5.", "Только то, что делается на нашем баре за две минуты."], "Соцсети": ["Ты SMM-специалист кофейни.", "Telegram-канал и ВКонтакте Surf Coffee Уфа, читают постоянные гости и студенты.", "Напиши пост про раф «Медовик» из зимнего меню.", "Три варианта до 600 знаков, в конце призыв зайти.", "Без канцелярита и рядов восклицательных знаков, цену не выдумывай."], "Собственник": ["Ты помощник генерального директора сети кофеен.", "Прикрепляю цифры за октябрь по трём кофейням. Собственник читает отчёт с телефона.", "Собери отчёт на одну страницу.", "Три главные цифры, что получилось, что нет, план, где нужна помощь.", "Цифры только из файла, где нет цифры, пиши «нет данных»."]}, "meter": [8, 30, 52, 70, 85, 96], "meterText": ["Одна строка: ответ для кого угодно", "Есть роль: угол зрения и словарь", "Есть контекст: ответ про вашу ситуацию", "Есть задача: один результат на выходе", "Есть формат: не нужно переделывать", "Есть ограничения: можно отправлять"]};
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function setStep(ix, n) { ix.dataset.step = n; ix.dispatchEvent(new CustomEvent('ixstep', {detail: n})); }
  function advance(ix) { const n = +ix.dataset.steps, c = +ix.dataset.step || 0; if (c >= n) return false; setStep(ix, c + 1); return true; }
  window.__ixAdvance = () => { const ix = ixOf(cur()); return !!ix && advance(ix); };

  // «вперёд» сначала раскрывает шаги интерактива, потом листает слайд
  document.addEventListener('keydown', ev => {
    if (phone() || document.querySelector('dialog[open]') || ev.altKey || ev.ctrlKey || ev.metaKey || ev.target.closest('input,textarea,select,[contenteditable]')) return;
    if (ev.key === ' ' && ev.target.closest('button,a')) return;
    if (['arrowright', 'pagedown', ' ', 'enter'].includes(ev.key.toLowerCase()) && window.__ixAdvance()) { ev.preventDefault(); ev.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('click', ev => {
    if (phone()) return;
    if (ev.target.closest('#next') && window.__ixAdvance()) { ev.preventDefault(); ev.stopImmediatePropagation(); }
  }, true);

  // ---------- 1 · карта
  document.querySelectorAll('.ix-map').forEach(ix => {
    const chips = [...ix.querySelectorAll('.mp-chip')], heads = [...ix.querySelectorAll('.mp-head')];
    const W = 1472, colW = W / heads.length, rowH = 45, top0 = 64;
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const chaos = chips.map(() => [rnd() * (W - 190), rnd() * 480 + 4, rnd() * 16 - 8]);
    heads.forEach((h, i) => { h.style.transform = `translate(${i * colW}px,0)`; });
    function lay() {
      const st = +ix.dataset.step || 0;
      chips.forEach((c, i) => {
        if (st === 0) { c.style.transform = `translate(${chaos[i][0]}px,${chaos[i][1]}px) rotate(${chaos[i][2]}deg)`; c.style.setProperty('--fd', `${-(i % 9) * .6}s`); }
        else c.style.transform = `translate(${+c.dataset.c * colW}px,${top0 + +c.dataset.r * rowH}px)`;
      });
    }
    ix.addEventListener('ixstep', lay); ix.__lay = lay; lay();
  });

  // ---------- 2 · слово за словом
  document.querySelectorAll('.ix-next').forEach(ix => {
    const text = ix.querySelector('.nx-text'), rows = [...ix.querySelectorAll('.nx-row')], lead = ix.querySelector('.nx-lead'), ctx = ix.querySelector('.nx-ctx');
    let run = 0;
    function clear() { text.textContent = ''; rows.forEach(r => { r.classList.remove('best'); r.querySelector('.nx-w').textContent = ''; r.querySelector('.nx-p').textContent = ''; r.querySelector('i').style.width = '0'; }); }
    async function play(kind, fast) {
      const my = ++run, d = DATA.next[kind]; ix.classList.remove('done'); clear(); lead.textContent = d.lead; ctx.textContent = d.context || '';
      for (const [word, cands] of d.steps) {
        if (!fast) await sleep(350); if (my !== run) return;
        rows.forEach((r, i) => { const [w, p] = cands[i]; r.classList.toggle('best', i === 0); r.querySelector('.nx-w').textContent = w; r.querySelector('.nx-p').textContent = String(p).replace('.', ',') + '%'; r.querySelector('i').style.width = Math.max(p, 1) + '%'; });
        if (!fast) await sleep(1050); if (my !== run) return;
        text.querySelectorAll('.last').forEach(s => s.classList.remove('last'));
        const sp = document.createElement('span'); sp.className = 'last'; sp.textContent = word + ' '; text.append(sp);
      }
      text.querySelectorAll('.last').forEach(s => s.classList.remove('last')); ix.classList.add('done');
    }
    ix.addEventListener('ixstep', ev => { const st = +ev.detail; if (st === 0) { run++; ix.classList.remove('done'); clear(); lead.textContent = DATA.next.plain.lead; } else play(st === 1 ? 'plain' : 'ctx', ix.dataset.fast === '1'); });
    lead.textContent = DATA.next.plain.lead;
  });

  // ---------- 5 · конструктор формулы
  document.querySelectorAll('.ix-formula').forEach(ix => {
    const rows = [...ix.querySelectorAll('.fm-row')], tabs = [...ix.querySelectorAll('.fm-tab')];
    let sphere = tabs[0].dataset.s, typing = 0;
    async function type(p, s, instant) { const my = ++typing; if (instant) { p.textContent = s; return; } p.textContent = ''; for (let i = 1; i <= s.length; i++) { if (my !== typing) { p.textContent = s; return; } p.textContent = s.slice(0, i); await sleep(11); } }
    function draw(typeRow) {
      const st = +ix.dataset.step || 0, lines = DATA.formula[sphere];
      rows.forEach((r, i) => { const on = i < st; r.classList.toggle('on', on); const p = r.querySelector('p'); if (on && i === typeRow) type(p, lines[i]); else p.textContent = on ? lines[i] : ''; });
      ix.querySelector('.fm-track i').style.width = DATA.meter[st] + '%'; ix.querySelector('.fm-pct').textContent = DATA.meter[st] + '%'; ix.querySelector('.fm-mt').textContent = DATA.meterText[st];
    }
    ix.addEventListener('ixstep', ev => draw(ix.dataset.fast === '1' ? -1 : +ev.detail - 1));
    tabs.forEach(t => t.onclick = () => { sphere = t.dataset.s; tabs.forEach(x => x.classList.toggle('on', x === t)); typing++; draw(-1); });
    draw(-1);
  });

  // ---------- кнопка шага на самом слайде (мышью) и сброс при входе на слайд
  slides.forEach(sl => {
    const ix = ixOf(sl); if (!ix) return;
    ix.dataset.step = ix.dataset.step || 0;
    const go = document.createElement('button'); go.type = 'button'; go.className = 'ix-go'; go.textContent = 'Дальше по шагам →';
    go.onclick = () => { advance(ix); }; ix.prepend(go);
    ix.addEventListener('ixstep', () => { go.hidden = +ix.dataset.step >= +ix.dataset.steps; });
    new MutationObserver(() => { if (sl.classList.contains('active') && !sl.__was) { if (!phone()) setStep(ix, 0); } sl.__was = sl.classList.contains('active'); }).observe(sl, {attributes: true, attributeFilter: ['class']});
    sl.__was = sl.classList.contains('active');
  });
  // телефон: лента без шагов, каждый интерактив сразу в финальном виде
  function phoneMode() { if (!phone()) return; slides.forEach(sl => { const ix = ixOf(sl); if (ix && +ix.dataset.step !== +ix.dataset.steps) { ix.dataset.fast = '1'; setStep(ix, +ix.dataset.steps); } }); }
  phoneMode(); window.addEventListener('resize', phoneMode);

  // ---------- таймер практики: клик по кольцу запускает отсчёт, второй клик ставит на паузу
  document.querySelectorAll('.timer-ring').forEach(ring => {
    const b = ring.querySelector('b'), label = ring.querySelector('span'), total = parseInt(b.textContent, 10) * 60, base = b.textContent, baseLabel = label.textContent;
    let left = total, id = null; ring.title = 'Нажмите, чтобы запустить таймер';
    const show = () => { b.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; };
    function stop(reset) { clearInterval(id); id = null; ring.classList.remove('run'); if (reset) { left = total; b.textContent = base; b.classList.remove('clock'); label.textContent = baseLabel; ring.classList.remove('over'); } }
    ring.onclick = () => {
      if (ring.classList.contains('over')) { stop(true); return; }
      if (id) { stop(false); label.textContent = 'пауза'; return; }
      b.classList.add('clock'); label.textContent = 'осталось'; ring.classList.add('run'); show();
      id = setInterval(() => { left--; show(); if (left <= 0) { stop(false); ring.classList.add('over'); label.textContent = 'время вышло'; } }, 1000);
    };
    const sl = ring.closest('.slide'); new MutationObserver(() => { if (!sl.classList.contains('active')) stop(true); }).observe(sl, {attributes: true, attributeFilter: ['class']});
  });
})();
