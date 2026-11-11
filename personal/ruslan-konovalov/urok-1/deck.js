'use strict';
// Оболочка презентации NEOVIDA (стандарт 17.09.2026) + шаги по клику (.frag) + имя блока в панели.
const slides = [...document.querySelectorAll('.slide')];
const byId = id => document.getElementById(id);
let current = 0;
function scale() {
  document.documentElement.style.setProperty('--toolbar-height', `${byId('toolbar').offsetHeight}px`);
  const vp = byId('viewport');
  byId('stage').style.transform = `scale(${Math.min(vp.clientWidth / 1600, vp.clientHeight / 900)})`;
}
function frags(s) { return [...s.querySelectorAll('.frag')]; }
function showAll(s) { frags(s).forEach(f => f.classList.add('shown')); }
function resetFrags(s) { frags(s).forEach(f => f.classList.remove('shown')); }
function go(index, fresh = false) {
  current = Math.max(0, Math.min(slides.length - 1, Number.isFinite(index) ? index : 0));
  slides.forEach((s, i) => { s.classList.toggle('active', i === current); s.setAttribute('aria-hidden', String(i !== current)); });
  const s = slides[current];
  // Шаги по клику только когда пришли на слайд кнопкой «вперёд»; по ссылке, обзору и «назад» видно всё сразу.
  if (fresh && frags(s).length) { s.classList.add('stepping'); resetFrags(s); } else { s.classList.remove('stepping'); showAll(s); }
  byId('counter').value = `${current + 1} / ${slides.length}`;
  byId('progress').style.width = `${(current + 1) / slides.length * 100}%`;
  byId('notes').textContent = s.querySelector('.speaker-note')?.content.textContent.trim() || 'Заметок к этому слайду нет.';
  const bn = byId('blockname'); bn.querySelector('span').textContent = s.dataset.block || '';
  bn.style.setProperty('--bcol', getComputedStyle(s).getPropertyValue('--c').trim() || '#d88a4e');
  history.replaceState(null, '', `#${current + 1}`);
  byId('prev').disabled = current === 0; byId('next').disabled = current === slides.length - 1 && !pending();
  document.querySelectorAll('#overviewGrid button').forEach((b, i) => b.classList.toggle('cur', i === current));
  window.dispatchEvent(new CustomEvent('slidechange', { detail: current }));
}
function pending() { const s = slides[current]; return s.classList.contains('stepping') && frags(s).some(f => !f.classList.contains('shown')); }
function next() {
  const s = slides[current];
  if (pending()) { const f = frags(s).find(x => !x.classList.contains('shown')); f.classList.add('shown'); if (!pending()) byId('next').disabled = current === slides.length - 1; return; }
  if (current < slides.length - 1) go(current + 1, true);
}
function prev() { if (current > 0) go(current - 1); }
function toggleDialog(id) { const d = byId(id); if (d.open) d.close(); else d.showModal(); }
byId('prev').onclick = prev; byId('next').onclick = next;
byId('menu').onclick = () => toggleDialog('overview'); byId('noteBtn').onclick = () => toggleDialog('notesDialog');
document.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => b.closest('dialog').close(); });
slides.forEach((s, i) => {
  const b = document.createElement('button'); const n = document.createElement('b');
  n.textContent = String(i + 1).padStart(2, '0'); b.append(n, document.createTextNode(s.dataset.title || `Слайд ${i + 1}`));
  b.style.setProperty('--bc', getComputedStyle(s).getPropertyValue('--c').trim() || '#d88a4e');
  b.onclick = () => { go(i); byId('overview').close(); }; byId('overviewGrid').append(b);
});
byId('full').onclick = async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { byId('full').textContent = 'Полный экран недоступен'; }
};
document.addEventListener('fullscreenchange', () => { byId('full').textContent = document.fullscreenElement ? 'Выйти из полного экрана' : 'На весь экран'; scale(); });
document.addEventListener('keydown', ev => {
  if (document.querySelector('dialog[open]') || ev.altKey || ev.ctrlKey || ev.metaKey || ev.target.closest('input,textarea,select,[contenteditable]')) return;
  if (ev.key === ' ' && ev.target.closest('button,a')) return;
  const k = ev.key.toLowerCase();
  if (['arrowright', 'pagedown', ' '].includes(k)) { ev.preventDefault(); next(); }
  else if (['arrowleft', 'pageup'].includes(k)) { ev.preventDefault(); prev(); }
  else if (k === 'home') { ev.preventDefault(); go(0); } else if (k === 'end') { ev.preventDefault(); go(slides.length - 1); }
  else if (k === 'o') byId('menu').click(); else if (k === 'n') byId('noteBtn').click(); else if (k === 'f') byId('full').click();
});
window.addEventListener('hashchange', () => { const n = (parseInt(location.hash.slice(1), 10) || 1) - 1; if (n !== current) go(n); });
window.addEventListener('resize', scale); new ResizeObserver(scale).observe(byId('toolbar'));
let touch = null;
byId('viewport').addEventListener('touchstart', ev => { const t = ev.changedTouches[0]; touch = ev.touches.length === 1 && !ev.target.closest('a,button') ? [t.clientX, t.clientY] : null; }, { passive: true });
byId('viewport').addEventListener('touchend', ev => { if (!touch) return; const t = ev.changedTouches[0], dx = t.clientX - touch[0], dy = t.clientY - touch[1]; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) next(); else prev(); } touch = null; }, { passive: true });
byId('viewport').addEventListener('touchcancel', () => { touch = null; }, { passive: true });
scale(); go((parseInt(location.hash.slice(1), 10) || 1) - 1);
