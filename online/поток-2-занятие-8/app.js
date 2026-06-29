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

// === Финал · салюты + звук фейерверка ===
// Идемпотентно: повторный вызов в течение 3 сек игнорируется.
let __lastFinaleAt = 0;
let __audioCtx = null;

export function triggerCelebration() {
  const now = Date.now();
  if (now - __lastFinaleAt < 3000) return;
  __lastFinaleAt = now;

  const colors = ['#A78BFA', '#E07461', '#f0c040', '#5ec47a', '#ffffff'];
  const duration = 4000;
  const animationEnd = Date.now() + duration;

  // Большой центральный залп
  if (window.confetti) {
    confetti({ particleCount: 140, spread: 110, origin: { y: 0.55 }, colors, startVelocity: 48, gravity: 0.9, ticks: 240 });
  }

  // Серия маленьких залпов с краёв 4 сек
  const iv = setInterval(() => {
    if (Date.now() > animationEnd) { clearInterval(iv); return; }
    if (!window.confetti) return;
    confetti({ particleCount: 4, angle: 60,  spread: 55, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
  }, 220);

  // Звуки фейерверка (4 ракеты, торжественный аккорд после 1-й и 4-й)
  __ensureAudio();
  __playFirework({ delayMs: 0,    pitchUp: 1800, burstFreq: 70,  withChord: true,  volume: 0.34 });
  __playFirework({ delayMs: 700,  pitchUp: 2400, burstFreq: 90,  withChord: false, volume: 0.30 });
  __playFirework({ delayMs: 1500, pitchUp: 1600, burstFreq: 60,  withChord: false, volume: 0.32 });
  __playFirework({ delayMs: 2400, pitchUp: 2800, burstFreq: 100, withChord: true,  volume: 0.38 });
}

function __ensureAudio() {
  try {
    if (!__audioCtx) __audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (__audioCtx.state === 'suspended') __audioCtx.resume();
  } catch (e) { /* ignore — пользователь не кликал, аудио заблокировано */ }
}

function __makeNoiseBuffer(ctx, durationSec) {
  const len = Math.floor(ctx.sampleRate * durationSec);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function __playFirework(opts) {
  const { delayMs = 0, pitchUp = 2000, burstFreq = 80, withChord = false, volume = 0.35 } = opts;
  setTimeout(() => {
    try {
      if (!__audioCtx) __ensureAudio();
      const ctx = __audioCtx;
      if (!ctx) return;
      const t0 = ctx.currentTime;

      // WHOOSH — свист взлёта
      const whooshOsc = ctx.createOscillator();
      const whooshFilt = ctx.createBiquadFilter();
      const whooshGain = ctx.createGain();
      whooshOsc.type = 'sine';
      whooshOsc.frequency.setValueAtTime(200, t0);
      whooshOsc.frequency.exponentialRampToValueAtTime(pitchUp, t0 + 0.45);
      whooshFilt.type = 'lowpass'; whooshFilt.frequency.value = 3000;
      const wnSrc = ctx.createBufferSource(); wnSrc.buffer = __makeNoiseBuffer(ctx, 0.45);
      const wnFilt = ctx.createBiquadFilter(); wnFilt.type = 'bandpass';
      wnFilt.frequency.setValueAtTime(800, t0);
      wnFilt.frequency.exponentialRampToValueAtTime(4000, t0 + 0.45);
      wnFilt.Q.value = 2;
      const wnGain = ctx.createGain();
      wnGain.gain.setValueAtTime(0.15 * volume, t0);
      wnGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
      whooshGain.gain.setValueAtTime(0.001, t0);
      whooshGain.gain.exponentialRampToValueAtTime(0.18 * volume, t0 + 0.05);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
      whooshOsc.connect(whooshFilt).connect(whooshGain).connect(ctx.destination);
      wnSrc.connect(wnFilt).connect(wnGain).connect(ctx.destination);
      whooshOsc.start(t0); whooshOsc.stop(t0 + 0.45);
      wnSrc.start(t0); wnSrc.stop(t0 + 0.45);

      // BANG — взрыв
      const bangAt = t0 + 0.45;
      const bass = ctx.createOscillator(); const bg = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(burstFreq, bangAt);
      bass.frequency.exponentialRampToValueAtTime(burstFreq * 0.4, bangAt + 0.18);
      bg.gain.setValueAtTime(volume * 1.2, bangAt);
      bg.gain.exponentialRampToValueAtTime(0.001, bangAt + 0.25);
      bass.connect(bg).connect(ctx.destination);
      bass.start(bangAt); bass.stop(bangAt + 0.25);

      const burstSrc = ctx.createBufferSource(); burstSrc.buffer = __makeNoiseBuffer(ctx, 0.7);
      const burstFilt = ctx.createBiquadFilter(); burstFilt.type = 'highpass'; burstFilt.frequency.value = 1500;
      const burstGain = ctx.createGain();
      burstGain.gain.setValueAtTime(volume * 0.6, bangAt);
      burstGain.gain.exponentialRampToValueAtTime(0.001, bangAt + 0.7);
      burstSrc.connect(burstFilt).connect(burstGain).connect(ctx.destination);
      burstSrc.start(bangAt); burstSrc.stop(bangAt + 0.7);

      // Потрескивание искр
      for (let i = 0; i < 8; i++) {
        const crackleAt = bangAt + 0.2 + Math.random() * 0.5;
        const crBuf = __makeNoiseBuffer(ctx, 0.04);
        const crSrc = ctx.createBufferSource(); crSrc.buffer = crBuf;
        const crGain = ctx.createGain();
        crGain.gain.setValueAtTime(volume * 0.25, crackleAt);
        crGain.gain.exponentialRampToValueAtTime(0.001, crackleAt + 0.04);
        const crFilt = ctx.createBiquadFilter(); crFilt.type = 'highpass';
        crFilt.frequency.value = 3000 + Math.random() * 4000;
        crSrc.connect(crFilt).connect(crGain).connect(ctx.destination);
        crSrc.start(crackleAt); crSrc.stop(crackleAt + 0.04);
      }

      // CHORD — мажорный аккорд (До-Ми-Соль-До)
      if (withChord) {
        const chordAt = bangAt + 0.25;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = 'triangle'; o.frequency.value = freq;
          g.gain.setValueAtTime(0.001, chordAt);
          g.gain.exponentialRampToValueAtTime(volume * 0.18, chordAt + 0.05 + idx * 0.04);
          g.gain.exponentialRampToValueAtTime(0.001, chordAt + 1.6);
          o.connect(g).connect(ctx.destination);
          o.start(chordAt); o.stop(chordAt + 1.7);
        });
      }
    } catch (e) { /* ignore */ }
  }, delayMs);
}

// HTML-блок поздравления с большой кнопкой «Скачать сертификат» — переиспользуется во всех ролях участника.
export function certificateScreenHTML(name) {
  const safeName = (name || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Локально структура: веб-апп/ <-> сертификаты/ (Cyrillic).
  // На materials.neovida.ai: lesson-8/ <-> lesson-8/certificate/ (English, flat).
  const isLocal = location.pathname.includes('веб-апп') || location.pathname.includes('%D0%B2%D0%B5%D0%B1');
  const certBase = isLocal ? '../сертификаты/live.html' : 'certificate/live.html';
  const certUrl = `${certBase}?name=${encodeURIComponent(name || '')}`;
  return `
    <div class="cert-celebrate">
      <div class="cert-celebrate-icon"><i class="ph ph-graduation-cap"></i></div>
      <div class="cert-celebrate-kicker">Поздравляем, выпускник!</div>
      <div class="cert-celebrate-name">${safeName}</div>
      <div class="cert-celebrate-body">
        Ты&nbsp;прошёл(а) восемь занятий курса <strong>«ИИ. Новая реальность»</strong> и&nbsp;получил(а) персональный сертификат.
        Скачай его&nbsp;— и&nbsp;добро пожаловать в&nbsp;новую реальность <i class="ph ph-rocket-launch icon-coral"></i>
      </div>
      <a href="${certUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-big cert-celebrate-btn">
        <i class="ph ph-graduation-cap"></i> Открыть мой сертификат
      </a>
      <div class="cert-celebrate-foot">
        Откроется в&nbsp;новой вкладке. Там кнопка <strong>«Скачать PDF»</strong>&nbsp;— один клик.
      </div>
    </div>
  `;
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
