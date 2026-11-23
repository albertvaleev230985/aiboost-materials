'use strict';

const DRAFT_KEY = 'neovida-gpn-participant-2026-11-27-v1';
const RECEIPT_KEY = DRAFT_KEY + '-receipt';
const byId = id => document.getElementById(id);
const form = byId('questionnaire');
const field = name => form.elements.namedItem(name);
const sections = [...form.querySelectorAll('.step')];
const next = byId('next');
const back = byId('back');
const casesHost = byId('cases');
const message = byId('form-message');
const usedOptions = {...OPTIONS.services, never: 'Ни одним'};
const accessOptions = {...OPTIONS.services, none: OPTIONS.access.none, unchecked: OPTIONS.access.unchecked};
const blankCase = () => Object.fromEntries(Object.keys(CASE_FIELDS).map(key => [key, '']));

let currentStep = 0;
let pending = null;
let receipt = null;
let busy = false;
let hasStorage = true;

function selectOptions(select, options, hint = 'Выберите') {
  const previous = select.value;
  select.replaceChildren(new Option(hint, ''));
  Object.entries(options).forEach(([value, label]) => select.add(new Option(label, value)));
  if (Object.hasOwn(options, previous)) select.value = previous;
}

function checklist(host, name, options) {
  for (const [value, label] of Object.entries(options)) {
    const wrapper = document.createElement('label');
    wrapper.className = 'choice';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = name;
    checkbox.value = value;
    wrapper.append(checkbox, label);
    host.append(wrapper);
  }
}

function selected(name) {
  return [...form.querySelectorAll('input[name="' + name + '"]:checked')].map(item => item.value);
}

function enforceExclusive(input, exclusive) {
  if (!input.checked) return;
  for (const checkbox of form.querySelectorAll('input[name="' + input.name + '"]')) {
    if (checkbox !== input && (exclusive.includes(input.value) || exclusive.includes(checkbox.value))) {
      checkbox.checked = false;
    }
  }
}

function showField(id, show) {
  const label = byId(id);
  label.hidden = !show;
  const control = label.querySelector('input, select');
  control.disabled = !show;
  control.required = show;
}

function updateExperience() {
  const used = selected('used');
  const selectedAccess = selected('access');
  const laptop = field('device').value !== 'phone';
  const chooseFrequency = used.some(value => value !== 'never');
  byId('experience-options').hidden = !chooseFrequency;
  field('frequency').disabled = !chooseFrequency;
  field('frequency').required = chooseFrequency;
  showField('other-used', used.includes('other'));
  byId('model-field').hidden = !chooseFrequency;
  field('model').disabled = !chooseFrequency;
  showField('primary-service', used.length > 1);
  selectOptions(field('main_service'), Object.fromEntries(used.map(value => [value, usedOptions[value]])));

  showField('laptop-status', laptop);
  byId('access-field').hidden = !laptop;
  byId('access-field').disabled = !laptop;
  const specifyChat = laptop && selectedAccess.includes('other');
  const specifyPlan = laptop && selectedAccess.some(value => Object.hasOwn(OPTIONS.services, value));
  byId('access-options').hidden = !(specifyChat || specifyPlan);
  showField('other-access', specifyChat);
  showField('access-plan', specifyPlan);
}

function caseEditor(item, index) {
  const article = document.createElement('article');
  article.className = 'case';
  const heading = document.createElement('div');
  heading.className = 'case-title';
  const title = document.createElement('h3');
  title.textContent = index === 0 ? 'Основная задача' : 'Задача ' + (index + 1);
  heading.append(title);
  if (index > 0) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'link-button';
    remove.textContent = 'Убрать';
    remove.setAttribute('aria-label', 'Убрать задачу ' + (index + 1));
    remove.addEventListener('click', () => {
      const cases = readCases();
      cases.splice(index, 1);
      drawCases(cases);
      save();
      byId('add-case').focus();
    });
    heading.append(remove);
  }
  article.append(heading);

  for (const [key, spec] of Object.entries(CASE_FIELDS)) {
    const required = index === 0 || key === 'title' || key === 'output';
    const label = document.createElement('label');
    label.textContent = spec.label;
    if (!required) {
      const optional = document.createElement('span');
      optional.className = 'optional';
      optional.textContent = ' (по желанию)';
      label.append(optional);
    }
    const textarea = document.createElement('textarea');
    textarea.name = 'case_' + index + '_' + key;
    textarea.dataset.caseKey = key;
    textarea.rows = 2;
    textarea.maxLength = spec.limit;
    textarea.required = required;
    textarea.value = typeof item?.[key] === 'string' ? item[key] : '';
    label.append(textarea);
    if (index === 0) {
      const hint = document.createElement('span');
      hint.id = 'case-' + key + '-example';
      hint.className = 'hint';
      hint.textContent = spec.example;
      textarea.setAttribute('aria-describedby', hint.id);
      label.append(hint);
    }
    article.append(label);
  }
  return article;
}

function drawCases(cases) {
  casesHost.replaceChildren(...cases.map(caseEditor));
  byId('add-case').hidden = cases.length >= 3;
}

function readCases() {
  return [...casesHost.children].map(item => Object.fromEntries(
    [...item.querySelectorAll('textarea')].map(input => [input.dataset.caseKey, input.value])
  ));
}

function readAnswers() {
  const answers = Object.fromEntries([
    'participant', 'role', 'used_other', 'frequency', 'main_service', 'device',
    'laptop_vpn', 'phone_vpn', 'access_other', 'plan', 'model'
  ].map(name => [name, field(name).value]));
  return {...answers, used: selected('used'), access: selected('access'), cases: readCases()};
}

function restoreAnswers(answers) {
  for (const name of ['participant', 'role', 'used_other', 'frequency', 'device',
    'laptop_vpn', 'phone_vpn', 'access_other', 'plan', 'model']) {
    if (typeof answers[name] === 'string') field(name).value = answers[name];
  }
  for (const name of ['used', 'access']) {
    if (!Array.isArray(answers[name])) continue;
    for (const input of form.querySelectorAll('input[name="' + name + '"]')) {
      input.checked = answers[name].includes(input.value);
    }
  }
  drawCases(Array.isArray(answers.cases) && answers.cases.length ? answers.cases.slice(0, 3) : [blankCase()]);
  updateExperience();
  if (typeof answers.main_service === 'string') field('main_service').value = answers.main_service;
}

function save() {
  try {
    if (receipt) sessionStorage.removeItem(DRAFT_KEY);
    else sessionStorage.setItem(DRAFT_KEY, JSON.stringify({answers: readAnswers(), step: currentStep, pending}));
    hasStorage = true;
  } catch {
    hasStorage = false;
  }
  if (receipt) {
    try { sessionStorage.setItem(RECEIPT_KEY, receipt.response_id); } catch { /* Current tab still has the receipt. */ }
  }
  byId('draft-status').textContent = receipt ? 'Получение подтверждено' :
    hasStorage ? 'Черновик сохраняется в этой вкладке' : 'Черновик доступен до закрытия вкладки';
}

function restore() {
  try {
    const id = sessionStorage.getItem(RECEIPT_KEY);
    if (id && /^[a-f0-9]{32}$/.test(id)) {
      receipt = {response_id: id};
      return;
    }
  } catch { /* A durable draft can still be available. */ }
  let saved;
  try {
    saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
  } catch {
    return;
  }
  if (!saved?.answers || typeof saved.answers !== 'object') return;
  restoreAnswers(saved.answers);
  byId('reset-draft').hidden = false;
  if (Number.isInteger(saved.step)) currentStep = Math.min(Math.max(saved.step, 0), sections.length - 1);
  if (saved.pending) {
    try {
      pending = normalizeParticipant(saved.pending);
      restoreAnswers(pending);
      byId('reset-draft').hidden = true;
      currentStep = sections.length - 1;
    } catch {
      pending = null;
    }
  }
}

function alertMessage(text = '') {
  message.textContent = text;
  message.hidden = !text;
}

function fail(control, text) {
  control.setAttribute('aria-invalid', 'true');
  control.focus();
  alertMessage(text);
  return false;
}

function validateStep() {
  const section = sections[currentStep];
  if (currentStep === 0) {
    if (!selected('used').length) return fail(byId('used-services').querySelector('input'), 'Выберите чат или «Ни одним».');
    if (field('device').value && field('device').value !== 'phone' && !selected('access').length) {
      return fail(byId('access-services').querySelector('input'), 'Отметьте чат, «Ни в каком» или «Не проверял(а)».');
    }
  }
  for (const control of section.querySelectorAll('input[required], select[required], textarea[required]')) {
    if (!control.disabled && !control.value.trim()) {
      return fail(control, 'Заполните это поле, чтобы продолжить.');
    }
  }
  return true;
}

function answerSummary(data) {
  const named = (key, other) => key === 'other' ? other : OPTIONS.services[key] || usedOptions[key] || OPTIONS.access[key];
  const experience = [
    ['Участник', data.participant + ' · ' + data.role],
    ['ИИ-чаты за последние 30 дней', data.used.map(key => named(key, data.used_other)).join(', ')],
    ['Частота', OPTIONS.frequency[data.frequency]],
    ['Чаще всего', named(data.main_service, data.used_other)],
    ['Модель', data.model],
    ['Устройство', OPTIONS.device[data.device]],
    ['VPN на ноутбуке', OPTIONS.vpn[data.laptop_vpn]],
    ['VPN на телефоне', OPTIONS.vpn[data.phone_vpn]],
    ['Могу отправить запрос без VPN', data.access.map(key => named(key, data.access_other)).join(', ')],
    ['Тип доступа', OPTIONS.plan[data.plan]]
  ];
  return [
    ['Опыт и доступ', experience],
    ...data.cases.map((item, index) => [
      index === 0 ? 'Основная задача' : 'Задача ' + (index + 1),
      Object.entries(CASE_FIELDS).map(([key, spec]) => [spec.label, item[key]])
    ])
  ];
}

function candidate() {
  return normalizeParticipant({
    ...readAnswers(), course_id: COURSE, cohort_id: COHORT, response_id: '0'.repeat(32)
  });
}

function showReview() {
  const container = byId('review');
  container.replaceChildren();
  const data = pending || candidate();
  for (const [title, answers] of answerSummary(data)) {
    const article = document.createElement('article');
    const heading = document.createElement('h3');
    heading.textContent = title;
    const list = document.createElement('dl');
    for (const [label, value] of answers) {
      if (!value) continue;
      const term = document.createElement('dt');
      const item = document.createElement('dd');
      term.textContent = label;
      item.textContent = value;
      list.append(term, item);
    }
    article.append(heading, list);
    container.append(article);
  }
}

function drawStep(focus = false) {
  if (currentStep === sections.length - 1) showReview();
  for (const [index, section] of sections.entries()) section.hidden = index !== currentStep;
  for (const [index, item] of [...byId('steps').children].entries()) {
    item.classList.toggle('completed', index < currentStep);
    if (index === currentStep) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  }
  back.hidden = currentStep === 0 || Boolean(pending);
  next.textContent = currentStep === sections.length - 1 ? 'Отправить анкету' : 'Продолжить';
  byId('download').hidden = currentStep !== sections.length - 1;
  alertMessage(pending ? 'Ответы готовы к повторной отправке. Проверьте соединение и нажмите «Отправить анкету».' : '');
  if (focus) {
    sections[currentStep].querySelector('h2').focus({preventScroll: true});
    sections[currentStep].scrollIntoView({block: 'start'});
  }
}

function showSuccess() {
  form.hidden = true;
  byId('success').hidden = false;
  byId('steps').parentElement.hidden = true;
  byId('receipt').textContent = receipt.response_id;
  byId('download').hidden = !receipt.cases;
  byId('success-heading').focus();
}

async function submit() {
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(PARTICIPANT_ENDPOINT)) {
    alertMessage('Подключение к таблице ещё не настроено. Ответы остались в черновике.');
    return;
  }
  if (!pending) {
    const id = [...crypto.getRandomValues(new Uint8Array(16))]
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
    pending = {...candidate(), response_id: id};
  }
  save();
  byId('reset-draft').hidden = true;
  form.inert = true;
  busy = true;
  next.disabled = true;
  next.textContent = 'Отправляем…';
  alertMessage();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(PARTICIPANT_ENDPOINT, {
      method: 'POST', headers: {'Content-Type': 'text/plain;charset=UTF-8'},
      body: JSON.stringify(pending), signal: controller.signal, credentials: 'omit'
    });
    if (!response.ok) throw new Error('network_error');
    const result = await response.json();
    if (result.status !== 'ok' || result.service !== COURSE || result.response_id !== pending.response_id) {
      if (result.status === 'error' && /^invalid_/.test(result.error || '')) {
        pending = null;
        throw new Error('invalid_answers');
      }
      throw new Error('not_confirmed');
    }
    receipt = pending;
    pending = null;
  } catch (error) {
    drawStep();
    alertMessage(error.message === 'invalid_answers'
      ? 'Проверьте заполнение полей и отправьте анкету ещё раз.'
      : 'Получение пока не подтверждено. Проверьте интернет и повторите отправку. Номер анкеты сохранится.');
  } finally {
    clearTimeout(timeout);
    busy = false;
    form.inert = false;
    next.disabled = false;
    next.textContent = 'Отправить анкету';
    save();
    if (receipt) showSuccess();
    else if (!pending) byId('reset-draft').hidden = false;
  }
}

checklist(byId('used-services'), 'used', usedOptions);
checklist(byId('access-services'), 'access', accessOptions);
const vpnOptions = Object.fromEntries(Object.entries(OPTIONS.vpn).filter(([value]) => value !== 'not_applicable'));
selectOptions(field('frequency'), Object.fromEntries(Object.entries(OPTIONS.frequency).filter(([value]) => value !== 'never')));
selectOptions(field('device'), OPTIONS.device);
selectOptions(field('laptop_vpn'), vpnOptions);
selectOptions(field('phone_vpn'), vpnOptions);
selectOptions(field('plan'), OPTIONS.plan);
drawCases([blankCase()]);
restore();
updateExperience();
try {
  drawStep();
} catch {
  currentStep = 0;
  drawStep();
}
save();

form.hidden = false;
if (receipt) showSuccess();

form.addEventListener('input', event => {
  const input = event.target;
  if (input.name === 'used') enforceExclusive(input, ['never']);
  if (input.name === 'access') enforceExclusive(input, ['none', 'unchecked']);
  if (input.name === 'device') {
    for (const checkbox of form.querySelectorAll('input[name="access"]')) checkbox.checked = false;
    for (const name of ['laptop_vpn', 'access_other', 'plan']) field(name).value = '';
  }
  if (['used', 'access', 'device'].includes(input.name)) updateExperience();
  input.removeAttribute('aria-invalid');
  alertMessage();
  byId('reset-draft').hidden = Boolean(pending);
  save();
});

byId('add-case').addEventListener('click', () => {
  const cases = readCases();
  if (cases.length >= 3) return;
  drawCases([...cases, blankCase()]);
  save();
  casesHost.lastElementChild.querySelector('textarea').focus();
});

back.addEventListener('click', () => {
  if (!busy && !pending && currentStep > 0) {
    currentStep--;
    drawStep(true);
    save();
  }
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (busy || !validateStep()) return;
  if (currentStep === sections.length - 1) {
    submit();
    return;
  }
  if (currentStep === sections.length - 2) {
    try {
      candidate();
    } catch {
      currentStep = 0;
      drawStep(true);
      validateStep();
      save();
      return;
    }
  }
  currentStep++;
  drawStep(true);
  save();
});

function resetForm() {
  try { sessionStorage.removeItem(RECEIPT_KEY); } catch { /* Reset in memory below. */ }
  receipt = null;
  pending = null;
  currentStep = 0;
  form.reset();
  drawCases([blankCase()]);
  updateExperience();
  byId('success').hidden = true;
  byId('steps').parentElement.hidden = false;
  byId('reset-draft').hidden = true;
  form.hidden = false;
  drawStep(true);
  save();
}

byId('new-form').addEventListener('click', resetForm);
byId('reset-draft').addEventListener('click', () => {
  if (!busy && !pending && confirm('Удалить черновик в этой вкладке?')) resetForm();
});

byId('download').addEventListener('click', () => {
  const text = answerSummary(receipt || pending || candidate()).map(([title, items]) =>
    [title, ...items.filter(([, value]) => value).map(([label, value]) => label + '\n' + value)].join('\n')
  ).join('\n\n');
  const url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Анкета участника — Тюмень, 27 ноября.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

window.addEventListener('beforeunload', event => {
  if (busy || (!hasStorage && !receipt)) event.preventDefault();
});
