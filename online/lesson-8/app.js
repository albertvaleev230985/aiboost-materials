// Утилиты web-аппа занятия 8 онлайн

const LS_PREFIX = 'aiboost_l8_online:';

export function lsKey(slug, what) { return `${LS_PREFIX}${slug}:${what}`; }
export function saveLocal(slug, what, data) {
  try { localStorage.setItem(lsKey(slug, what), JSON.stringify({ data, ts: Date.now() })); }
  catch (e) { console.warn('localStorage save failed', e); }
}
export function loadLocal(slug, what) {
  try { const raw = localStorage.getItem(lsKey(slug, what)); if (!raw) return null; return JSON.parse(raw).data; }
  catch (e) { return null; }
}

// «Текущий пользователь» хранится в localStorage этого браузера, чтобы не вводить имя при каждом переходе
const ME_KEY = LS_PREFIX + '__me';
export function getMe() {
  try { const raw = localStorage.getItem(ME_KEY); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
export function setMe(me) {
  localStorage.setItem(ME_KEY, JSON.stringify(me));
}
export function clearMe() {
  localStorage.removeItem(ME_KEY);
}

// Транслит «Иван Иванов» → 'ivan-ivanov'
const TRANSLIT = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',
  о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',
  э:'e',ю:'yu',я:'ya',
};
export function nameToSlug(name) {
  const lower = (name || '').trim().toLowerCase();
  if (!lower) return '';
  let s = '';
  for (const ch of lower) {
    if (TRANSLIT[ch] !== undefined) s += TRANSLIT[ch];
    else if (/[a-z0-9]/.test(ch)) s += ch;
    else if (/\s/.test(ch) || ch === '-') s += '-';
    // другие символы пропускаем
  }
  s = s.replace(/-+/g, '-').replace(/^-|-$/g, '');
  // если пусто (например, имя только из спецсимволов) — генерим случайный
  if (!s) s = 'guest-' + Math.random().toString(36).slice(2, 8);
  return s.slice(0, 40);
}

// Имя «Иван Иванов» → проверка валидности (≥2 части, длина ≥4)
export function isValidFullName(name) {
  const trimmed = (name || '').trim();
  if (trimmed.length < 4) return false;
  const parts = trimmed.split(/\s+/).filter(p => p.length >= 2);
  return parts.length >= 2;
}

export function renderHeader(me, opts = {}) {
  const el = document.getElementById('app-header');
  if (!el) return;
  const showLogout = opts.showLogout && me;
  el.innerHTML = `
    <div class="brand"><span class="brand-dot"></span>neovida · AI Boost · занятие 8 · финал</div>
    ${me ? `
      <div class="user-chip">
        <div class="user-ava">${(me.name[0] || '?').toUpperCase()}</div>
        ${me.name}
        ${showLogout ? `<button id="hdr-edit" style="margin-left:10px; background:none; border:none; color:var(--white-40); cursor:pointer; font-size:12px; text-decoration:underline;">изменить</button>` : ''}
      </div>
    ` : ''}
  `;
  if (showLogout) {
    const btn = document.getElementById('hdr-edit');
    if (btn) btn.addEventListener('click', () => { clearMe(); location.href = 'index.html'; });
  }
}

export function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Локальный таймер: запускается при заданном epoch и длительности (в сек).
// onTick(remainingSec, fraction) — каждые 100мс. onEnd() — один раз при достижении 0.
export function runTimer(startedAtMs, durationSec, onTick, onEnd) {
  let endedFired = false;
  let handle = null; // объявляем ДО tick() чтобы избежать TDZ если remaining=0 сразу
  const tick = () => {
    const elapsed = (Date.now() - startedAtMs) / 1000;
    const remaining = Math.max(0, durationSec - elapsed);
    const fraction = Math.max(0, Math.min(1, remaining / durationSec));
    onTick(remaining, fraction);
    if (remaining <= 0 && !endedFired) {
      endedFired = true;
      onEnd && onEnd();
      if (handle !== null) clearInterval(handle);
    }
  };
  tick();
  // Если таймер уже истёк при первом tick() — не запускаем интервал вовсе
  if (!endedFired) handle = setInterval(tick, 100);
  return () => { if (handle !== null) clearInterval(handle); };
}
