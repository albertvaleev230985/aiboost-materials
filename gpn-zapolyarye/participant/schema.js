'use strict';

const COURSE = 'gpn-participant';
const COHORT = 'gpn-2026-11-27';

const OPTIONS = {
  services: {
    chatgpt: 'ChatGPT', qwen: 'Qwen', deepseek: 'DeepSeek', gigachat: 'ГигаЧат',
    alice: 'Алиса AI', gemini: 'Gemini', corporate: 'Корпоративный ИИ-чат', other: 'Другой чат'
  },
  frequency: {
    daily: 'Почти каждый день', several_weekly: 'Несколько раз в неделю',
    weekly: 'Примерно раз в неделю', rare: 'Один-два раза за месяц', never: 'Ни разу'
  },
  device: { work: 'Рабочий ноутбук', personal: 'Личный ноутбук', phone: 'Только телефон', unknown: 'Пока не знаю' },
  vpn: { yes: 'Есть и работает', no: 'Нет', unknown: 'Не проверял(а)', not_applicable: 'Ноутбук не беру' },
  plan: { free: 'Бесплатный', paid: 'Платный', corporate: 'Корпоративный', mixed: 'У чатов разные условия', unknown: 'Не знаю' },
  access: { none: 'Ни в каком', unchecked: 'Не проверял(а)', not_applicable: 'Ноутбук не беру' }
};

const CASE_FIELDS = {
  title: {
    label: 'Что вы делаете вручную?', limit: 450,
    example: '«Каждую пятницу сверяю план работ и отчёт подрядчика. На это уходит час.»'
  },
  input: {
    label: 'Что у вас есть на входе?', limit: 500,
    example: '«План в Excel, отчёт подрядчика в PDF. Для занятия могу описать структуру таблицы.»'
  },
  output: {
    label: 'Что хотите получить?', limit: 500,
    example: '«Таблицу с отставаниями, причинами из отчёта и ссылками на строки исходных данных.»'
  },
  check: {
    label: 'Как поймёте, что результат правильный?', limit: 500,
    example: '«Сверю даты и объёмы с исходниками. Если причины в отчёте нет, строка должна остаться пустой.»'
  }
};

function cleanText(value, field, limit, required = true) {
  if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) {
    throw new Error('invalid_' + field);
  }
  return value.trim();
}

function choose(value, allowed, field) {
  if (typeof value !== 'string' || !Object.prototype.hasOwnProperty.call(allowed, value)) {
    throw new Error('invalid_' + field);
  }
  return value;
}

function chooseMany(input, allowed, exclusive, field) {
  if (!Array.isArray(input) || !input.length || input.length > Object.keys(allowed).length) {
    throw new Error('invalid_' + field);
  }
  const values = input.map(value => choose(value, allowed, field));
  if (new Set(values).size !== values.length || (values.length > 1 && values.some(value => exclusive.includes(value)))) {
    throw new Error('invalid_' + field);
  }
  return values;
}

function normalizeParticipant(input) {
  if (!input || input.course_id !== COURSE || input.cohort_id !== COHORT ||
      typeof input.response_id !== 'string' || !/^[a-f0-9]{32}$/.test(input.response_id)) {
    throw new Error('invalid_response');
  }

  const participant = cleanText(input.participant, 'participant', 140);
  const role = cleanText(input.role, 'role', 220);
  const used = chooseMany(input.used, {...OPTIONS.services, never: 'Ни одним'}, ['never'], 'used');
  const usedOther = used.includes('other') ? cleanText(input.used_other, 'used_other', 140) : '';
  const isNew = used.includes('never');
  const frequency = isNew ? 'never' : choose(input.frequency, OPTIONS.frequency, 'frequency');
  if (!isNew && frequency === 'never') throw new Error('invalid_frequency');
  const mainService = isNew ? '' : used.length === 1 ? used[0] : choose(input.main_service, OPTIONS.services, 'main_service');
  if (!isNew && !used.includes(mainService)) throw new Error('invalid_main_service');

  const model = isNew ? '' : cleanText(input.model ?? '', 'model', 140, false);

  const device = choose(input.device, OPTIONS.device, 'device');
  const laptopVpn = device === 'phone' ? 'not_applicable' : choose(input.laptop_vpn, OPTIONS.vpn, 'laptop_vpn');
  if (device !== 'phone' && laptopVpn === 'not_applicable') throw new Error('invalid_laptop_vpn');
  const phoneVpn = choose(input.phone_vpn, OPTIONS.vpn, 'phone_vpn');
  if (phoneVpn === 'not_applicable') throw new Error('invalid_phone_vpn');

  const access = device === 'phone' ? ['not_applicable'] :
    chooseMany(input.access, {...OPTIONS.services, none: OPTIONS.access.none, unchecked: OPTIONS.access.unchecked},
      ['none', 'unchecked'], 'access');
  const accessOther = access.includes('other') ? cleanText(input.access_other, 'access_other', 140) : '';
  const hasAccess = access.some(value => Object.prototype.hasOwnProperty.call(OPTIONS.services, value));
  const plan = hasAccess ? choose(input.plan, OPTIONS.plan, 'plan') : '';

  if (!Array.isArray(input.cases) || input.cases.length < 1 || input.cases.length > 3) throw new Error('invalid_cases');
  const cases = input.cases.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error('invalid_case');
    return Object.fromEntries(Object.entries(CASE_FIELDS).map(([key, spec]) => {
      const required = index === 0 || key === 'title' || key === 'output';
      return [key, cleanText(item[key], key, spec.limit, required)];
    }));
  });

  return {
    course_id: COURSE, cohort_id: COHORT, response_id: input.response_id,
    participant, role, used, used_other: usedOther, frequency, main_service: mainService, model,
    device, laptop_vpn: laptopVpn, phone_vpn: phoneVpn, access, access_other: accessOther, plan, cases
  };
}
