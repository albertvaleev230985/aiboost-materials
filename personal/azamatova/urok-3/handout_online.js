'use strict';
// Браузер не восстанавливает прокрутку сам: место на странице держим мы (17.10: «назад» на телефоне уводил к старому якорю).
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
// ---------- копирование: одна функция на все кнопки
function copyText(t, btn, okText) {
  const done = () => { const o = btn.innerHTML; btn.classList.add('ok'); if (okText) btn.textContent = okText; setTimeout(() => { btn.classList.remove('ok'); if (okText) btn.innerHTML = o; }, 1600); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, () => fallback(t, done)); else fallback(t, done);
}
function fallback(t, done) {
  const a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select();
  try { document.execCommand('copy'); done(); } catch (e) { alert('Выделите текст и скопируйте вручную'); } a.remove();
}
document.querySelectorAll('.pr .cp').forEach(b => b.onclick = () => copyText(b.closest('.pr').querySelector('pre').textContent, b, 'Скопировано'));
document.querySelectorAll('.bot button.cp.big').forEach(b => b.onclick = () => {
  const card = b.closest('.bot'); copyText(card.querySelector('pre.hid').textContent, b, 'Скопировано');
  const d = card.querySelector('details.peekd'); if (d) d.open = true;
});
document.querySelectorAll('.ask').forEach(b => b.onclick = () => copyText(b.textContent, b));

// ---------- где мы сейчас: панель-маршрут
const bar = document.getElementById('bar'), now = document.getElementById('now');
const word = bar.dataset.word || 'Блок';
const secs = [...document.querySelectorAll('main section.st[data-n]')];
const chips = [...document.querySelectorAll('.rt')];
const names = {}; chips.forEach(c => names[c.dataset.n] = c.title);
let cur = null;
const route = document.querySelector('.route');
// Только горизонтальная прокрутка своей ленты. scrollIntoView здесь нельзя: он обрывает плавную прокрутку страницы
// (17.10: номера блоков 3, 4, 5 «не давали прокрутиться»).
function centerIn(box, el) { box.scrollLeft = el.offsetLeft - box.offsetLeft - (box.clientWidth - el.offsetWidth) / 2; }
function setBarH() { document.documentElement.style.setProperty('--barh', bar.offsetHeight + 'px'); }
function spy() {
  const line = bar.offsetHeight + 60; let s = null;
  for (const x of secs) { if (x.getBoundingClientRect().top <= line) s = x; }
  const n = s ? s.dataset.n : null;
  if (n === cur) return; cur = n;
  chips.forEach(c => { c.classList.toggle('on', c.dataset.n === n); c.classList.toggle('done', n !== null && +c.dataset.n < +n); });
  if (n) {
    const col = getComputedStyle(s).getPropertyValue('--c').trim();
    bar.style.setProperty('--c', col); document.querySelector('.bar-now').style.setProperty('--c', col);
    now.textContent = `${word} ${n} из ${secs.length} · ${names[n]}`;
    const on = chips.find(c => c.dataset.n === n); if (on) centerIn(route, on);
  } else { bar.style.removeProperty('--c'); document.querySelector('.bar-now').style.removeProperty('--c'); now.textContent = bar.dataset.start || 'Начало урока · маршрут ниже'; }
}
window.addEventListener('scroll', () => requestAnimationFrame(spy), { passive: true });
window.addEventListener('resize', () => { setBarH(); spy(); });
setBarH(); spy();

// ---------- вернуться: после любого перехода по ссылке внутри страницы
const pill = document.getElementById('backpill'), backto = document.getElementById('backto');
let backY = null, pillTimer = null;
function hereLabel() { return cur ? `${word.toLowerCase()} ${cur} · ${names[cur].split(':')[0]}` : 'к началу'; }
function rememberHere() {
  backY = window.scrollY; backto.textContent = hereLabel(); pill.hidden = false;
  clearTimeout(pillTimer); pillTimer = setTimeout(() => { pill.hidden = true; }, 15000);
}
document.addEventListener('click', ev => {
  const a = ev.target.closest('a[href^="#"]'); if (!a || a.closest('#lib')) return;
  const id = decodeURIComponent(a.getAttribute('href').slice(1)); const el = id && document.getElementById(id); if (!el) return;
  ev.preventDefault(); rememberHere();
  goTo(el);
});
// Переход мгновенный: длинная плавная прокрутка на телефоне не доезжала до места. Куда приехали, показывает вспышка.
function jump(y) { window.scrollTo(0, Math.max(0, Math.round(y))); }
function goTo(el) {
  const target = () => el.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 8;
  jump(target()); requestAnimationFrame(() => { if (Math.abs(el.getBoundingClientRect().top - bar.offsetHeight - 8) > 4) jump(target()); });
  const band = el.querySelector('.st-band') || el; band.classList.remove('flash'); void band.offsetWidth; band.classList.add('flash');
}
pill.onclick = () => { const yb = backY; if (yb !== null) { jump(yb); requestAnimationFrame(() => jump(yb)); } pill.hidden = true; backY = null; };

// ---------- библиотека поверх страницы: открыли, закрыли, вы на том же месте
const lib = document.getElementById('lib'), body = document.getElementById('libbody'), q = document.getElementById('q');
const tabs = [...document.querySelectorAll('.ltab')], lsecs = [...document.querySelectorAll('.lsec')];
const cards = [...lib.querySelectorAll('.bot')];
let savedY = 0;
const ltabs = document.querySelector('.ltabs');
function markTab(id) { tabs.forEach(t => t.classList.toggle('on', t.dataset.tab === id)); const on = tabs.find(t => t.dataset.tab === id); if (on) centerIn(ltabs, on); }
function goInside(id) {
  const el = document.getElementById(id); if (!el || !lib.contains(el)) return;
  if (q.value) { q.value = ''; filter(); }
  const sec = el.closest('.lsec'); if (sec) markTab(sec.id);
  body.scrollTop += el.getBoundingClientRect().top - body.getBoundingClientRect().top - (el === sec ? 4 : 10);
  if (el.classList.contains('bot')) { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 2200); }
}
function openLib(id, push = true) {
  if (lib.hidden) { savedY = window.scrollY; lib.hidden = false; document.documentElement.classList.add('lib-open'); if (push) history.pushState({ lib: 1 }, '', '#' + id); }
  requestAnimationFrame(() => goInside(id));
}
function hideLib() { lib.hidden = true; document.documentElement.classList.remove('lib-open'); jump(savedY); requestAnimationFrame(() => jump(savedY)); setTimeout(() => jump(savedY), 60); }
function closeLib() {
  if (history.state && history.state.lib) { history.back(); return; }
  hideLib(); history.replaceState(null, '', location.pathname + location.search);
}
document.querySelectorAll('[data-lib]').forEach(b => b.onclick = () => openLib(b.dataset.lib));
lib.querySelector('.lib-close').onclick = closeLib;
lib.addEventListener('click', ev => { if (ev.target === lib) closeLib(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !lib.hidden) closeLib(); });
let skipHash = false;
window.addEventListener('popstate', () => { if (!lib.hidden) { skipHash = true; hideLib(); } });
tabs.forEach(t => t.onclick = () => goInside(t.dataset.tab));
body.addEventListener('scroll', () => { let s = lsecs[0]; for (const x of lsecs) { if (x.offsetTop - 40 <= body.scrollTop) s = x; } if (s && !q.value) markTab(s.id); }, { passive: true });
function filter() {
  const v = q.value.trim().toLowerCase(); let shown = 0;
  cards.forEach(c => { const hit = !v || c.textContent.toLowerCase().includes(v); c.hidden = !hit; if (hit) shown++; });
  lib.querySelectorAll('.grp').forEach(g => { let n = g.nextElementSibling, vis = false; while (n && !n.classList.contains('grp')) { if (n.classList.contains('bot') && !n.hidden) vis = true; n = n.nextElementSibling; } g.hidden = !!v && !vis; const s = g.nextElementSibling; if (s && s.classList.contains('grp-sub')) s.hidden = g.hidden; });
  lsecs.forEach(s => { s.hidden = !!v && !s.querySelector('.bot:not([hidden])'); });
  lib.querySelector('.nores').hidden = shown > 0;
}
q.addEventListener('input', filter);

// ---------- ссылки со слайдов: #id промпта на странице или карточки в библиотеке
function openHash() {
  let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
  if (!id) { if (!lib.hidden) hideLib(); return; }
  const el = document.getElementById(id); if (!el) return;
  if (lib.contains(el)) { openLib(id, false); history.replaceState({ lib: 0 }, '', location.pathname + location.search); return; }
  if (!lib.hidden) hideLib();
  el.querySelectorAll('details').forEach(d => d.open = true);
  setTimeout(() => goTo(el), 40);
}
// ссылка с #якорем в уже открытой шпаргалке; после закрытия библиотеки «назад» место не трогаем
window.addEventListener('hashchange', () => { if (skipHash) { skipHash = false; return; } openHash(); });
openHash();
