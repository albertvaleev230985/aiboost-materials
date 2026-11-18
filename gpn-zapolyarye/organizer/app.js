'use strict';

const ENDPOINT = 'https://script.google.com/macros/s/AKfycbyHJWaxqBYZFRrSiJNNtCooZY8jayQsT4y42SHGWcWBvqYFZyM5IJd5Xn_Nj2LAdenk/exec';
const STORAGE_KEY = 'neovida-gpn-organizer-2026-11-27-v1';
const STEPS = ['Команда', 'Цели и результат', 'Рабочие задачи', 'Опыт и формат дня', 'Условия практики'];
const TITLES = ['Кто будет в зале?', 'Что должно измениться?', 'На чём будем практиковаться?', 'Как вы видите этот день?', 'Что будет под рукой?'];
const INTROS = [
  'Разбейте участников по службам или ролям. Так мы поймём, чьи задачи должны прозвучать в программе. Предварительного состава достаточно.',
  'Ваш приоритет определит, чему уделить время и с каким результатом участники должны уйти.',
  'Добавьте от одной до пяти задач. Для каждой опишите, как работа устроена сейчас и какой результат нужен.',
  'Расскажите об опыте команды, её запросах и ваших пожеланиях к интенсиву.',
  'Это поможет заранее выбрать рабочие инструменты и подготовить участников. Если что-то пока неизвестно, так и напишите.'
];
const EMPTY_GROUP = () => ({department: '', roles: '', count: '', responsibilities: ''});
const EMPTY_CASE = () => ({title: '', owner: '', input: '', obstacle: '', output: ''});
const $ = id => document.getElementById(id);
let data = {organizer_name: 'Кирилл Колонских', company: 'Газпромнефть-Заполярье', participant_count: '',
  groups: [EMPTY_GROUP()], goal: '', success_today: '', success_later: '', cases: [EMPTY_CASE()],
  ai_experience: '', motivation_insights: '', day_vision: '', topics_required: '', topics_excluded: '',
  device_access: '', services_access: '', data_rules: '', it_contact: '', comment: ''};
let step = 0;
let furthest = 0;
let pending = null;
let receipt = null;
let busy = false;
let draftAvailable = true;
let endpointReady = ENDPOINT.startsWith('https://script.google.com/macros/s/');

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
}

function field(key, label, options = {}) {
  const value = options.value ?? data[key] ?? '';
  const id = options.path ? options.path.replaceAll('.', '-') : key;
  const binding = options.path || key;
  const required = options.optional ? '' : ' required';
  const optional = options.optional ? ' <span class="optional">по желанию</span>' : '';
  const hint = options.hint ? `<p id="${id}-hint" class="hint">${options.hint}</p>` : '';
  const described = options.hint ? ` aria-describedby="${id}-hint"` : '';
  let control;
  if (options.small || options.number) {
    control = `<input id="${id}" data-field="${binding}" value="${escapeHTML(value)}"${required}${described} ` +
      (options.number ? 'type="number" inputmode="numeric" min="1" max="500" step="1"' : 'type="text" maxlength="300"') + '>';
  } else {
    control = `<textarea id="${id}" data-field="${binding}" rows="${options.rows || 3}" maxlength="5000"${required}${described}>${escapeHTML(value)}</textarea>`;
  }
  return `<div class="field"><label for="${id}">${label}${optional}</label>${control}${hint}</div>`;
}

const plusIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const trashIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';

function groupCards() {
  return data.groups.map((group, index) => `<article class="group-card">
    <div class="card-heading"><h3>Группа ${index + 1}</h3>${data.groups.length > 1 ? `<button type="button" class="remove-button" data-remove-group="${index}" aria-label="Удалить группу ${index + 1}">${trashIcon}Удалить</button>` : ''}</div>
    ${field('department', 'Подразделение или служба', {path: `groups.${index}.department`, value: group.department, small: true})}
    <div class="two-fields">${field('roles', 'Какие должности', {path: `groups.${index}.roles`, value: group.roles, small: true})}${field('count', 'Сколько человек', {path: `groups.${index}.count`, value: group.count, number: true})}</div>
    ${field('responsibilities', 'За какие задачи отвечают', {path: `groups.${index}.responsibilities`, value: group.responsibilities, rows: 2})}
  </article>`).join('') + (data.groups.length < 20 ? `<button type="button" id="addGroup" class="add-button">${plusIcon}Добавить подразделение или роль</button>` : '') + '<div id="groupTotal" class="count-summary" aria-live="polite"></div>';
}

function caseCards() {
  return data.cases.map((item, index) => `<article class="case-card">
    <div class="card-heading"><h3>Рабочая задача ${index + 1}</h3>${data.cases.length > 1 ? `<button type="button" class="remove-button" data-remove-case="${index}" aria-label="Удалить задачу ${index + 1}">${trashIcon}Удалить</button>` : ''}</div>
    ${field('title', 'Какую задачу разбираем', {path: `cases.${index}.title`, value: item.title, small: true})}
    ${field('owner', 'Кто её решает', {path: `cases.${index}.owner`, value: item.owner, small: true})}
    ${field('input', 'Что есть на входе', {path: `cases.${index}.input`, value: item.input, rows: 2})}
    ${field('obstacle', 'Где теряется время или возникают переделки', {path: `cases.${index}.obstacle`, value: item.obstacle, rows: 2})}
    ${field('output', 'Что должно получиться на выходе', {path: `cases.${index}.output`, value: item.output, rows: 2})}
  </article>`).join('') + (data.cases.length < 5 ? `<button type="button" id="addCase" class="add-button">${plusIcon}Добавить рабочую задачу</button>` : '');
}

function content() {
  if (step === 0) return `<div class="two-fields">${field('organizer_name', 'Ваше имя и фамилия', {small: true})}${field('company', 'Компания', {small: true})}</div>` +
    field('participant_count', 'Сколько участников планируется всего', {number: true}) + groupCards();
  if (step === 1) return field('goal', 'Главная задача этого дня', {hint: 'Если выбрать один существенный результат, какой он? Почему это актуально сейчас?'}) +
    field('success_today', 'Что участники должны суметь сделать к вечеру') + field('success_later', 'Что вы хотите увидеть в их работе через две недели');
  if (step === 2) return caseCards();
  if (step === 3) return field('ai_experience', 'Какой опыт работы с ИИ уже есть у команды', {hint: 'Кто начинает с нуля, кто уже применяет ИИ и для каких задач?'}) +
    field('motivation_insights', 'Какие запросы повторяются в мотивационных эссе', {optional: true, hint: 'Достаточно ваших наблюдений по тем эссе, которые вы уже получили.'}) +
    field('day_vision', 'Как вы представляете интенсив', {hint: 'На чём сделать акцент? Какую часть дня отдать практике? Что разбирать вместе, а что по службам?'}) +
    field('topics_required', 'Что обязательно включить', {optional: true, rows: 2}) + field('topics_excluded', 'На что не тратить время', {optional: true, rows: 2});
  return field('device_access', 'С каких устройств будут работать и какой будет интернет') +
    field('services_access', 'Какие ИИ-сервисы будут доступны участникам', {hint: 'Что уже согласовано? Есть ли ограничения сети, возможность регистрации и подключения подписок?'}) +
    field('data_rules', 'Какие правила работы с данными нужно учесть') +
    field('it_contact', 'С кем свериться по технике и доступам', {optional: true, rows: 2}) + field('comment', 'Что ещё нам нужно знать', {optional: true, rows: 2}) +
    '<details class="review" id="review"><summary>Проверить все ответы перед отправкой</summary><div class="review-content" id="reviewContent"></div></details>';
}

function render(moveFocus = false) {
  $('fields').innerHTML = `<p class="eyebrow">${escapeHTML(STEPS[step])}</p><h2 id="stepTitle" tabindex="-1">${TITLES[step]}</h2><p class="section-intro">${INTROS[step]}</p>` + content();
  $('stepCount').textContent = `Шаг ${step + 1} из ${STEPS.length}`;
  $('progress').style.width = `${(step + 1) / STEPS.length * 100}%`;
  $('backBtn').hidden = step === 0;
  $('nextBtn').innerHTML = step === STEPS.length - 1 ? 'Отправить анкету <span aria-hidden="true">↗</span>' : 'Продолжить <span aria-hidden="true">→</span>';
  $('stepNav').innerHTML = STEPS.map((name, index) => `<button type="button" class="step-link${index < step ? ' passed' : ''}" data-step="${index}"${index > furthest ? ' disabled' : ''}${index === step ? ' aria-current="step"' : ''}><span class="step-number">${index + 1}</span>${name}</button>`).join('');
  $('formError').hidden = true;
  if (step === 0) updateTotal();
  if (step === 4) renderReview();
  if (moveFocus) {
    $('stepTitle').focus({preventScroll: true});
    $('questionnaire').scrollIntoView({behavior: 'auto', block: 'start'});
  }
}

function updateTotal() {
  const total = data.groups.reduce((sum, group) => sum + (Number(group.count) || 0), 0);
  $('groupTotal').innerHTML = `<span>В подразделениях указано</span><strong>${total} чел.</strong>`;
  $('groupTotal').classList.toggle('mismatch', Boolean(data.participant_count) && total !== Number(data.participant_count));
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({data, step, furthest, pending, receipt}));
    draftAvailable = true;
    $('draftStatus').textContent = receipt ? 'Получение подтверждено' : 'Черновик сохранён на устройстве';
    $('draftStatus').dataset.saved = 'true';
    $('storageWarning').hidden = true;
  } catch (error) {
    draftAvailable = false;
    $('draftStatus').textContent = 'Черновик в этой вкладке';
    $('storageWarning').textContent = 'Браузер не разрешает сохранять черновик. Держите вкладку открытой или скачайте ответы перед закрытием.';
    $('storageWarning').hidden = false;
  }
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object' || !saved.data) return;
    for (const key of Object.keys(data)) {
      if (key === 'groups' || key === 'cases') continue;
      if (typeof saved.data[key] === 'string' || (key === 'participant_count' && typeof saved.data[key] === 'number')) data[key] = saved.data[key];
    }
    for (const [key, template, maximum] of [['groups', EMPTY_GROUP, 20], ['cases', EMPTY_CASE, 5]]) {
      if (Array.isArray(saved.data[key]) && saved.data[key].length) {
        data[key] = saved.data[key].slice(0, maximum).map(item => {
          const result = template();
          for (const field of Object.keys(result)) if (item && ['string', 'number'].includes(typeof item[field])) result[field] = item[field];
          return result;
        });
      }
    }
    step = Number.isInteger(saved.step) ? Math.min(4, Math.max(0, saved.step)) : 0;
    furthest = Number.isInteger(saved.furthest) ? Math.min(4, Math.max(step, saved.furthest)) : step;
    if (saved.pending && /^[a-f0-9]{32}$/.test(saved.pending.response_id || '')) pending = saved.pending;
    if (saved.receipt && /^[a-f0-9]{32}$/.test(saved.receipt.response_id || '')) receipt = saved.receipt;
  } catch (error) { /* An unreadable draft must not prevent filling a fresh form. */ }
}

function validateCurrent() {
  const fields = [...$('fields').querySelectorAll('input,textarea')];
  for (const element of fields) element.removeAttribute('aria-invalid');
  const invalid = fields.find(element => !element.checkValidity() || (element.required && !element.value.trim()));
  if (invalid) {
    invalid.setAttribute('aria-invalid', 'true');
    invalid.focus();
    showError(invalid.type === 'number' ? 'Укажите целое число от 1 до 500.' : 'Заполните отмеченное поле, чтобы продолжить.');
    return false;
  }
  if (step === 0 && Number(data.participant_count) !== data.groups.reduce((sum, group) => sum + Number(group.count), 0)) {
    $('participant_count').setAttribute('aria-invalid', 'true');
    $('participant_count').focus();
    showError('Общее число участников и сумма по подразделениям должны совпадать.');
    return false;
  }
  return true;
}

function validateAll() {
  const finalStep = step;
  for (let index = 0; index < STEPS.length; index++) {
    step = index;
    render();
    if (!validateCurrent()) { persist(); $('stepTitle').scrollIntoView({block: 'start'}); return false; }
  }
  step = finalStep;
  render();
  return true;
}

function showError(message) {
  $('formError').textContent = message;
  $('formError').hidden = false;
}

function reviewRows() {
  return [
    ['Команда', [['Организатор', data.organizer_name], ['Компания', data.company], ['Всего участников', data.participant_count],
      ...data.groups.map((g, i) => [`Группа ${i + 1}`, `${g.department} · ${g.count} чел.\nДолжности: ${g.roles}\nЗадачи: ${g.responsibilities}`])]],
    ['Цели и результат', [['Главная задача', data.goal], ['К вечеру', data.success_today], ['Через две недели', data.success_later]]],
    ['Рабочие задачи', data.cases.map((c, i) => [`Задача ${i + 1}`, `${c.title}\nКто решает: ${c.owner}\nНа входе: ${c.input}\nТрудность: ${c.obstacle}\nРезультат: ${c.output}`])],
    ['Опыт и формат дня', [['Опыт команды', data.ai_experience], ['Запросы из эссе', data.motivation_insights], ['Видение дня', data.day_vision], ['Включить', data.topics_required], ['Исключить', data.topics_excluded]]],
    ['Условия практики', [['Устройства и интернет', data.device_access], ['Сервисы', data.services_access], ['Правила работы с данными', data.data_rules], ['Контакт по технике', data.it_contact], ['Дополнительно', data.comment]]]
  ];
}

function renderReview() {
  $('reviewContent').innerHTML = reviewRows().map(([title, rows]) => `<h3>${title}</h3><dl>${rows.filter(([, value]) => String(value).trim()).map(([label, value]) => `<dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd>`).join('')}</dl>`).join('');
}

function downloadAnswers() {
  const text = ['neovida · Нейропросвещение', 'Анкета организатора · Тюмень, 27 ноября 2026',
    receipt ? `Получение подтверждено. Номер анкеты ${receipt.response_id}` : 'Черновик анкеты', '',
    ...reviewRows().flatMap(([title, rows]) => [title.toUpperCase(), ...rows.map(([label, value]) => `${label}\n${value || 'Не заполнено'}\n`), ''])].join('\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + text], {type: 'text/plain;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Анкета организатора — Тюмень, 27 ноября.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function makeId() {
  return [...crypto.getRandomValues(new Uint8Array(16))].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  try {
    const response = await fetch(url, {...options, signal: controller.signal, redirect: 'follow'});
    if (!response.ok) throw new Error('network_error');
    return await response.json();
  } finally { clearTimeout(timeout); }
}

function showSuccess() {
  $('questionnaire').hidden = true;
  $('success').hidden = false;
  $('receiptId').textContent = receipt.response_id;
  $('progress').style.width = '100%';
  $('stepCount').textContent = 'Анкета получена';
  $('draftStatus').textContent = 'Получение подтверждено';
  $('stepNav').hidden = true;
  $('successTitle').focus({preventScroll: true});
  $('success').scrollIntoView({block: 'start', behavior: 'auto'});
}

async function submit() {
  if (busy || !validateAll()) return;
  if (!endpointReady) { showError('Подключение к таблице ещё проверяется. Ответы сохранены в черновике.'); return; }
  busy = true;
  const payload = {...data, participant_count: Number(data.participant_count),
    groups: data.groups.map(group => ({...group, count: Number(group.count)})),
    cases: data.cases.map(item => ({...item})),
    course_id: 'gpn-organizer', cohort_id: 'gpn-2026-11-27'};
  const previous = pending ? {...pending} : null;
  if (previous) delete previous.response_id;
  pending = {...payload, response_id: previous && JSON.stringify(previous) === JSON.stringify(payload) ? pending.response_id : makeId()};
  persist();
  const body = JSON.stringify(pending);
  $('questionnaire').classList.add('sending');
  $('questionnaire').inert = true;
  $('nextBtn').disabled = true;
  $('nextBtn').textContent = 'Сохраняем ответы…';
  $('formError').hidden = true;
  let result;
  try {
    result = await request(ENDPOINT, {method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body});
    if (result.status !== 'ok' || result.service !== 'gpn-organizer' || result.response_id !== pending.response_id) throw new Error(result.error || 'not_confirmed');
    receipt = {response_id: pending.response_id};
  } catch (error) {
    // The write may have succeeded even when the POST response was lost.
    if (!result || result.status !== 'error') {
      try {
        const status = await request(`${ENDPOINT}?course_id=gpn-organizer&action=status&response_id=${pending.response_id}`);
        if (status.status === 'ok' && status.saved === true && status.response_id === pending.response_id) receipt = {response_id: pending.response_id};
      } catch (statusError) { /* Keep the same payload and ID for a safe retry. */ }
    }
    if (!receipt) {
      const message = result?.error === 'response_conflict' ? 'Номер анкеты уже связан с другой версией ответов. Скачайте ответы и свяжитесь с Альбертом.' :
        result?.error === 'answer_too_long' ? 'Анкета получилась слишком объёмной. Сократите длинные ответы и отправьте снова.' :
        'Получение пока не подтверждено. Ответы остались в черновике. Проверьте интернет и нажмите «Отправить анкету» ещё раз.';
      showError(message);
    }
  } finally {
    busy = false;
    $('questionnaire').classList.remove('sending');
    $('questionnaire').inert = false;
    $('nextBtn').disabled = false;
    $('nextBtn').innerHTML = 'Отправить анкету <span aria-hidden="true">↗</span>';
    if (receipt) { pending = null; persist(); showSuccess(); }
  }
}

$('fields').addEventListener('input', event => {
  const key = event.target.dataset.field;
  if (!key || busy) return;
  const path = key.split('.');
  if (path.length === 3) data[path[0]][Number(path[1])][path[2]] = event.target.value;
  else data[key] = event.target.value;
  event.target.removeAttribute('aria-invalid');
  $('formError').hidden = true;
  persist();
  if (step === 0) updateTotal();
  if (step === 4) renderReview();
});

$('fields').addEventListener('click', event => {
  if (busy) return;
  const button = event.target.closest('button');
  if (!button) return;
  if (button.id === 'addGroup' && data.groups.length < 20) {
    data.groups.push(EMPTY_GROUP()); render(); persist(); $(`groups-${data.groups.length - 1}-department`).focus();
  } else if (button.id === 'addCase' && data.cases.length < 5) {
    data.cases.push(EMPTY_CASE()); render(); persist(); $(`cases-${data.cases.length - 1}-title`).focus();
  } else if (button.dataset.removeGroup !== undefined && data.groups.length > 1) {
    data.groups.splice(Number(button.dataset.removeGroup), 1); render(); persist(); $('addGroup')?.focus();
  } else if (button.dataset.removeCase !== undefined && data.cases.length > 1) {
    data.cases.splice(Number(button.dataset.removeCase), 1); render(); persist(); $('addCase')?.focus();
  }
});

$('stepNav').addEventListener('click', event => {
  const target = event.target.closest('[data-step]');
  if (!target || target.disabled || busy) return;
  const destination = Number(target.dataset.step);
  if (destination > step && !validateCurrent()) return;
  step = destination; render(true); persist();
});
$('backBtn').addEventListener('click', () => { if (!busy && step > 0) { step--; render(true); persist(); } });
$('questionnaire').addEventListener('submit', event => {
  event.preventDefault();
  if (busy || !validateCurrent()) return;
  if (step === STEPS.length - 1) { submit(); return; }
  step++; furthest = Math.max(furthest, step); render(true); persist();
});
$('downloadSide').addEventListener('click', downloadAnswers);
$('downloadSuccess').addEventListener('click', downloadAnswers);
window.addEventListener('beforeunload', event => {
  if (busy || (!draftAvailable && !receipt)) { event.preventDefault(); event.returnValue = ''; }
});
restore();
render();
persist();
if (receipt) showSuccess();
if (['localhost', '127.0.0.1'].includes(location.hostname)) $('previewNotice').hidden = false;
