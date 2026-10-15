// Общие утилиты финала очного потока 6 «ИИ. Новая реальность» (15.10.2026)
// Используется в index.html (участник), host.html (ведущий), report.html (отчёт).
import { ROSTER } from './roster.js';

const LS_BASE = 'nv_potok6_final:';
// ?profile=2 даёт отдельное хранилище в той же браузерной сессии (для прогона двумя участниками в двух вкладках)
const PROFILE = (() => { try { return (new URLSearchParams(location.search).get('profile') || '').replace(/[^a-z0-9]/gi, '').slice(0, 12); } catch (e) { return ''; } })();
export const LS_PREFIX = LS_BASE + (PROFILE ? `p-${PROFILE}:` : '');
export const ENTRY_URL = 'https://materials.neovida.ai/potok-22-09/urok-8/test/';
export const BRAND = 'neovida · Нейропросвещение';
export const CLIENT_LINE = '«ИИ. Новая реальность» · поток 6 · финал курса';
export const MIN_CARD_FIELDS = 4;

// ===== localStorage (всё обёрнуто: в приватном режиме может падать) =====
export function lsGet(key, fallback = null) {
  try { const raw = localStorage.getItem(LS_PREFIX + key); return raw == null ? fallback : JSON.parse(raw); }
  catch (e) { return fallback; }
}
export function lsSet(key, value) {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}
export function lsRemove(key) {
  try { localStorage.removeItem(LS_PREFIX + key); } catch (e) { /* ignore */ }
}
export function lsClearAll() {
  try { Object.keys(localStorage).forEach(k => { if (k.startsWith(LS_BASE)) localStorage.removeItem(k); }); }
  catch (e) { /* ignore */ }
}

export function getMe() { return lsGet('me'); }
export function setMe(me) { lsSet('me', me); }
export function clearMe() { lsRemove('me'); }

// ===== Имя =====
const TRANSLIT = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',
  о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',
  э:'e',ю:'yu',я:'ya',
};

export function normalizeName(raw) {
  const clean = (raw || '').replace(/[«»"“”]/g, '').replace(/\s+/g, ' ').trim();
  return clean.split(' ').map(word => word.split('-').map(part => {
    if (!part) return part;
    return part.charAt(0).toLocaleUpperCase('ru-RU') + part.slice(1).toLocaleLowerCase('ru-RU');
  }).join('-')).join(' ');
}

// Ошибка валидации или '' если всё хорошо
export function nameError(raw) {
  const v = (raw || '').replace(/\s+/g, ' ').trim();
  if (!v) return 'Введите имя и фамилию';
  if (/[0-9@#$%^&*_=+<>{}\[\]\\/|~`!?;:]/.test(v)) return 'Только буквы: имя и фамилия, без цифр и знаков';
  if (!/^[A-Za-zА-Яа-яЁё' -]+$/.test(v)) return 'Только буквы: имя и фамилия, без эмодзи и никнеймов';
  const parts = v.split(' ').filter(Boolean);
  if (parts.length < 2) return 'Нужны и имя, и фамилия. Например: Ирина Петрова';
  if (parts.some(p => p.replace(/[-']/g, '').length < 2)) return 'Имя и фамилия должны быть полными, без сокращений';
  if (v.length > 60) return 'Слишком длинно для сертификата, сократите до имени и фамилии';
  return '';
}

export function nameToSlug(name) {
  const lower = (name || '').trim().toLowerCase();
  let s = '';
  for (const ch of lower) {
    if (TRANSLIT[ch] !== undefined) s += TRANSLIT[ch];
    else if (/[a-z0-9]/.test(ch)) s += ch;
    else if (/\s/.test(ch) || ch === '-') s += '-';
  }
  s = s.replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!s) s = 'guest-' + Math.random().toString(36).slice(2, 8);
  return s.slice(0, 48);
}

// ===== Мелочи =====
export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
export function plural(n, one, few, many) {
  const m = n % 10, h = n % 100;
  if (m === 1 && h !== 11) return one;
  if (m >= 2 && m <= 4 && (h < 10 || h >= 20)) return few;
  return many;
}
export function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
export function letter(i) { return String.fromCharCode(65 + i); }

// Таймер от общего epoch: onTick(remainingSec, fraction), onEnd() один раз.
export function runTimer(startedAtMs, durationSec, onTick, onEnd) {
  let ended = false; let handle = null;
  const tick = () => {
    const remaining = Math.max(0, durationSec - (Date.now() - startedAtMs) / 1000);
    onTick(remaining, Math.max(0, Math.min(1, remaining / durationSec)));
    if (remaining <= 0 && !ended) { ended = true; onEnd && onEnd(); if (handle !== null) clearInterval(handle); }
  };
  tick();
  if (!ended) handle = setInterval(tick, 200);
  return () => { if (handle !== null) clearInterval(handle); };
}

// ===== Карта рефлексии (финал потока 6) =====
export const CARD_FIELDS = [
  {
    key: 'was',
    short: 'Было',
    label: 'С чем я пришёл(ла) на курс 22 сентября',
    hint: 'Одной-двумя фразами: как вы пользовались ИИ до курса и чего хотели.',
    placeholder: 'Например: открывал ChatGPT раз в неделю, спрашивал как у поисковика, ответы казались общими. Хотел понять, можно ли доверить ИИ хоть что-то в работе.',
  },
  {
    key: 'now',
    short: 'Стало',
    label: 'Что ИИ уже делает у меня каждую неделю',
    hint: 'Конкретно: задача, инструмент, результат. Gem-бот, навык, проект, задача по расписанию, Codex, исследование.',
    placeholder: 'Например: Gem-бот отвечает на типовые вопросы клиентов по моим прайсам; каждое утро в 7:30 приходит сводка по отрасли; перед закупкой делаю глубокое исследование поставщиков.',
  },
  {
    key: 'insight',
    short: 'Открытие',
    label: 'Главное открытие курса',
    hint: 'Мысль, приём или момент, после которого вы стали работать с ИИ иначе.',
    placeholder: 'Например: понял, что ИИ отвечает ровно на тот контекст, который я дал. Досье и роль решают больше, чем выбор сервиса.',
  },
  {
    key: 'hours',
    short: 'Экономия часов',
    label: 'Сколько часов в неделю ИИ уже экономит (или будет) и на чём',
    hint: 'Число часов в неделю и на каких задачах. Честно, можно примерно.',
    placeholder: 'Например: 4–5 часов: письма и КП (2 часа), отчёты и таблицы (1,5 часа), поиск поставщиков и цен (1 час).',
    withHours: true,
  },
  {
    key: 'plan30',
    short: 'План на 30 дней',
    label: 'План на 30 дней: четыре недели, по одной задаче, которую отдаю ИИ',
    hint: 'По каждой неделе: задача, инструмент, результат. Можно вставить план из финального интервью с ИИ.',
    placeholder: 'Например:\nНеделя 1: ответы на заявки, навык в ChatGPT, черновик за 2 минуты.\nНеделя 2: карусель для соцсетей по моей дизайн-системе.\nНеделя 3: Gem-бот по прайсу для менеджеров.\nНеделя 4: исследование двух поставщиков тремя врачами.',
  },
  {
    key: 'manifest',
    short: 'Манифест',
    label: 'Мой манифест ИИ-мышления одной фразой',
    hint: 'Как вы теперь думаете вместе с ИИ. Её Альберт прочитает вслух (без имени, если попросите).',
    placeholder: 'Например: я не жду от ИИ готового ответа, я думаю вместе с ним: даю контекст, задаю вопросы и проверяю.',
  },
];

export function cardFilledCount(card) {
  if (!card) return 0;
  return CARD_FIELDS.filter(f => {
    const txt = (card[f.key] || '').trim();
    if (f.withHours) return txt.length > 0 || Number(card.hoursNum) > 0;
    return txt.length > 0;
  }).length;
}

// Часы из карты: сначала числовое поле, иначе первое число из текста («5–6 часов» = 5,5)
export function cardHours(card) {
  if (!card) return 0;
  const n = Number(String(card.hoursNum || '').replace(',', '.'));
  if (n > 0) return Math.min(n, 80);
  const txt = String(card.hours || '');
  const range = txt.match(/(\d+(?:[.,]\d+)?)\s*[–-]\s*(\d+(?:[.,]\d+)?)/);
  if (range) return Math.min((parseFloat(range[1].replace(',', '.')) + parseFloat(range[2].replace(',', '.'))) / 2, 80);
  const one = txt.match(/(\d+(?:[.,]\d+)?)/);
  return one ? Math.min(parseFloat(one[1].replace(',', '.')), 80) : 0;
}

// ===== Сертификат =====
// Номера совпадают с бумажными сертификатами: roster.js (имя → номер). Нет в списке: без номера.
export function rosterNumber(name) {
  const k = (name || '').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  const rev = k.split(' ').reverse().join(' ');  // «Фамилия Имя» тоже узнаём
  for (const [n, num] of Object.entries(ROSTER)) {
    const r = n.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
    if (r === k || r === rev) return num;
  }
  return 0;
}
export function serialFor(seq, slug, name) {
  const num = rosterNumber(name);
  return num ? `NV · AIB · 2026 · OFFLINE-6 · ${String(num).padStart(3, '0')}` : 'NV · AIB · 2026 · OFFLINE-6';
}

export function certificateHTML(name, serial) {
  const n = escapeHtml(name);
  const len = (name || '').length;
  const size = len > 26 ? 50 : len > 21 ? 58 : 68;
  return `
  <div class="cert" id="cert">
    <div class="cert-frame"></div>
    <div class="cert-head">
      <div>
        <div class="cert-brand"><span class="cert-dot"></span>neovida</div>
        <div class="cert-brand-sub">Нейропросвещение</div>
      </div>
      <div class="cert-date">Выдан<b>15 октября 2026</b></div>
    </div>
    <div class="cert-mid">
      <div class="cert-title">Сертификат</div>
      <div class="cert-sub">настоящим подтверждается, что</div>
      <div class="cert-name" style="font-size:${size}px">${n}</div>
      <div class="cert-rule"></div>
      <div class="cert-text">успешно завершил(а) авторский очный курс <b>«ИИ. Новая реальность»</b><br>восемь занятий практической работы с 30+ ИИ-инструментами</div>
      <div class="cert-meta">8 занятий · 4 недели практики · Уфа</div>
    </div>
    <div class="cert-foot">
      <div class="cert-sig">
        <img class="cert-sig-img" src="signature.png" alt="">
        <div class="cert-sig-line"></div>
        <div class="cert-sig-name">Альберт Валеев</div>
        <div class="cert-sig-role">основатель NEOVIDA</div>
      </div>
      <img class="cert-stamp" src="stamp.png" alt="">
      <div class="cert-serial-block">
        <div class="cert-prog"><b>Программа</b><br>ИИ-мышление и промпт-инженерия,<br>ассистенты, платформа ChatGPT и Codex,<br>визуал, глубокое исследование</div>
        <div class="cert-serial">${escapeHtml(serial)}</div>
      </div>
    </div>
  </div>`;
}

// Вписывает сертификат (1123×794, A4 альбом) в ширину контейнера
export function fitCert(wrapEl) {
  const cert = wrapEl && wrapEl.querySelector('.cert');
  if (!cert) return;
  const avail = wrapEl.clientWidth;
  const scale = Math.min(1, avail / 1123);
  cert.style.transform = `scale(${scale})`;
  wrapEl.style.height = Math.ceil(794 * scale) + 'px';
}

// Скачивание: html2canvas + jsPDF (cdnjs). format: 'pdf' | 'png'
export async function downloadCertificate(certEl, name, format = 'pdf') {
  if (!window.html2canvas) throw new Error('html2canvas не загрузился');
  const canvas = await window.html2canvas(certEl, {
    scale: 2.5, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1400,
    onclone: (doc) => {
      const c = doc.getElementById(certEl.id);
      if (c) { c.style.transform = 'none'; c.style.boxShadow = 'none'; }
    },
  });
  const base = 'Сертификат_' + (name || 'участник').replace(/\s+/g, '_');
  if (format === 'png') {
    const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = base + '.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return;
  }
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) throw new Error('jsPDF не загрузился');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);
  pdf.save(base + '.pdf');
}

// ===== Салют =====
let lastFinaleAt = 0;
let audioCtx = null;
export function triggerCelebration() {
  const now = Date.now();
  if (now - lastFinaleAt < 3000) return;
  lastFinaleAt = now;
  const colors = ['#E07461', '#a95631', '#c6d2c4', '#e8a875', '#f5f1e8', '#416c59'];
  if (window.confetti) {
    window.confetti({ particleCount: 150, spread: 110, origin: { y: 0.55 }, colors, startVelocity: 48, gravity: 0.9, ticks: 240 });
  }
  const end = Date.now() + 4000;
  const iv = setInterval(() => {
    if (Date.now() > end) { clearInterval(iv); return; }
    if (!window.confetti) return;
    window.confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
    window.confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
  }, 220);
  playChord();
}

function playChord() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t0 = audioCtx.currentTime + 0.05;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t0 + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.07, t0 + i * 0.09 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.8);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0 + i * 0.09); o.stop(t0 + 1.9);
    });
  } catch (e) { /* звук не обязателен */ }
}
