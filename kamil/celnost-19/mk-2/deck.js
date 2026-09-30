'use strict';
const slides = [...document.querySelectorAll('.slide')];
const byId = id => document.getElementById(id);
let current = 0;
function scale() {
  document.documentElement.style.setProperty('--toolbar-height', `${byId('toolbar').offsetHeight}px`);
  const viewport = byId('viewport');
  byId('stage').style.transform = `scale(${Math.min(viewport.clientWidth / 1600, viewport.clientHeight / 900)})`;
}
function go(index) {
  current = Math.max(0, Math.min(slides.length - 1, Number.isFinite(index) ? index : 0));
  slides.forEach((slide, i) => { slide.classList.toggle('active', i === current); slide.setAttribute('aria-hidden', String(i !== current)); });
  byId('counter').value = `${current + 1} / ${slides.length}`;
  byId('progress').style.width = `${(current + 1) / slides.length * 100}%`;
  byId('notes').textContent = slides[current].querySelector('.speaker-note')?.content.textContent.trim() || 'Заметок к этому слайду нет.';
  history.replaceState(null, '', `#${current + 1}`);
  byId('prev').disabled = current === 0; byId('next').disabled = current === slides.length - 1;
}
function toggleDialog(id) { const dialog = byId(id); if (dialog.open) dialog.close(); else dialog.showModal(); }
byId('prev').onclick = () => go(current - 1); byId('next').onclick = () => go(current + 1);
byId('menu').onclick = () => toggleDialog('overview'); byId('noteBtn').onclick = () => toggleDialog('notesDialog');
document.querySelectorAll('[data-close]').forEach(button => { button.onclick = () => button.closest('dialog').close(); });
slides.forEach((slide, i) => {
  const button = document.createElement('button'); const number = document.createElement('b');
  number.textContent = String(i + 1).padStart(2, '0'); button.append(number, document.createTextNode(slide.dataset.title || `Слайд ${i + 1}`));
  button.onclick = () => { go(i); byId('overview').close(); }; byId('overviewGrid').append(button);
});
byId('full').onclick = async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { byId('full').textContent = 'Полный экран недоступен'; }
};
document.addEventListener('fullscreenchange', () => { byId('full').textContent = document.fullscreenElement ? 'Выйти из полного экрана' : 'На весь экран'; scale(); });
document.addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select,[contenteditable]')) return;
  if (event.key === ' ' && event.target.closest('button,a')) return;
  const key = event.key.toLowerCase();
  if (['arrowright', 'pagedown', ' '].includes(key)) { event.preventDefault(); go(current + 1); }
  else if (['arrowleft', 'pageup'].includes(key)) { event.preventDefault(); go(current - 1); }
  else if (key === 'home') { event.preventDefault(); go(0); } else if (key === 'end') { event.preventDefault(); go(slides.length - 1); }
  else if (key === 'o') byId('menu').click(); else if (key === 'n') byId('noteBtn').click(); else if (key === 'f') byId('full').click();
});
window.addEventListener('hashchange', () => go((parseInt(location.hash.slice(1), 10) || 1) - 1));
window.addEventListener('resize', scale); new ResizeObserver(scale).observe(byId('toolbar'));
let touch = null;
byId('viewport').addEventListener('touchstart', event => { const t = event.changedTouches[0]; touch = event.touches.length === 1 && !event.target.closest('a,button') ? [t.clientX, t.clientY] : null; }, {passive:true});
byId('viewport').addEventListener('touchend', event => { if (!touch) return; const t = event.changedTouches[0], dx = t.clientX - touch[0], dy = t.clientY - touch[1]; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1)); touch = null; }, {passive:true});
byId('viewport').addEventListener('touchcancel', () => { touch = null; }, {passive:true});
scale(); go((parseInt(location.hash.slice(1), 10) || 1) - 1);
