// Общие утилиты финала курса ООО «Перспектива» · команда LT
// Используется в index.html (участник), host.html (ведущий), report.html (отчёт).

const LS_BASE = 'nv_perspektiva_final:';
// ?profile=2 даёт отдельное хранилище в той же браузерной сессии (для прогона двумя участниками в двух вкладках)
const PROFILE = (() => { try { return (new URLSearchParams(location.search).get('profile') || '').replace(/[^a-z0-9]/gi, '').slice(0, 12); } catch (e) { return ''; } })();
export const LS_PREFIX = LS_BASE + (PROFILE ? `p-${PROFILE}:` : '');
export const ENTRY_URL = 'https://materials.neovida.ai/perspektiva/urok-5/test/';
export const BRAND = 'neovida · Нейропросвещение';
export const CLIENT_LINE = 'ООО «Перспектива» · команда LT · финал курса';
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

// ===== Карта внедрения =====
export const CARD_FIELDS = [
  {
    key: 'using',
    short: 'Уже использую',
    label: 'Что из курса уже использую в работе',
    hint: 'Боты (Gem), блокноты, приложения в Canvas, промпты. Назовите конкретно: что за инструмент и на какой задаче.',
    placeholder: 'Например: Gem «Сметчик» проверяет сметы подрядчиков на ремонт ресторанов и находит позиции дороже рынка; блокнот с регламентами открытия ресторана отвечает на вопросы новых управляющих; промпт по формуле для писем арендодателям.',
  },
  {
    key: 'tasks30',
    short: 'Три задачи на 30 дней',
    label: 'Три задачи моего направления, которые отдаю ИИ в ближайшие 30 дней',
    hint: 'По каждой: что за задача, каким инструментом, какой результат хотите получить.',
    placeholder: 'Например:\n1. Сверка смет подрядчиков: Gem со справочником цен, результат: список завышенных позиций за 10 минут вместо часа.\n2. Протоколы планёрок: аудио в блокнот, Студия делает выжимку и задачи по людям.\n3. Ответы на претензии арендодателей: бот-юрист по нашим договорам аренды, черновик ответа за 15 минут.',
  },
  {
    key: 'helper',
    short: 'Помощник для отдела',
    label: 'Какого помощника, блокнот или приложение сделаю для своего отдела',
    hint: 'Один инструмент, который останется отделу: кто им пользуется и что он делает.',
    placeholder: 'Например: блокнот «Онбординг управляющего» со всеми регламентами Rostic\'s и наставником в роли опытного операционного директора: новичок задаёт вопросы, блокнот отвечает со ссылками на документ и проверяет знания тестом.',
  },
  {
    key: 'hours',
    short: 'Экономия часов',
    label: 'Сколько часов в неделю рассчитываю сэкономить и на чём',
    hint: 'Число часов в неделю для вас (или для отдела, если так считаете) и на каких задачах.',
    placeholder: 'Например: 5–6 часов в неделю: сметы и акты (2 часа), отчёты собственнику (2 часа), письма и ответы подрядчикам (1–2 часа).',
    withHours: true,
  },
  {
    key: 'needs',
    short: 'Что нужно от компании',
    label: 'Что нужно от компании, чтобы это заработало',
    hint: 'Доступы, VPN, подписки, регламент работы с ИИ (что можно загружать, что нельзя), обучение сотрудников, время на настройку.',
    placeholder: 'Например: корпоративные подписки Gemini для трёх специалистов отдела, стабильный VPN, регламент: какие договоры и персональные данные можно загружать в ИИ, час в неделю на настройку ботов, обучение для управляющих ресторанами.',
  },
  {
    key: 'feedback',
    short: 'Обратная связь',
    label: 'Обратная связь по курсу: что было самым полезным, что улучшить',
    hint: 'Пара честных фраз. Это читает Альберт, чтобы следующие группы учились ещё лучше.',
    placeholder: 'Например: самое полезное: Gem-боты на своих документах и блокнот как база знаний. Улучшить: больше времени на практику прямо на занятии и разбор примеров по стройке и эксплуатации.',
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
export function serialFor(seq, slug) {
  let num;
  if (Number(seq) > 0) num = String(seq).padStart(3, '0');
  else {
    let h = 0; const s = slug || 'x';
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    num = Math.abs(h).toString(36).slice(0, 4).toUpperCase().padStart(4, '0');
  }
  return `NV · AIB · 2026 · PRS-LT · ${num}`;
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
      <div class="cert-date">Выдан<b>14 октября 2026</b></div>
    </div>
    <div class="cert-mid">
      <div class="cert-title">Сертификат</div>
      <div class="cert-sub">настоящим подтверждается, что</div>
      <div class="cert-name" style="font-size:${size}px">${n}</div>
      <div class="cert-rule"></div>
      <div class="cert-text">прошёл(ла) корпоративный курс <b>«ИИ. Новая реальность»</b><br>для команды LT ООО «Перспектива»</div>
      <div class="cert-meta">5 занятий · сентябрь–октябрь 2026</div>
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
        <div class="cert-prog"><b>Программа</b><br>ИИ-грамотность, промпты, Gem-боты,<br>блокноты, Canvas, ChatGPT</div>
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
