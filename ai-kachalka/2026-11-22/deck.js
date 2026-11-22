'use strict';
const slides = [...document.querySelectorAll('.slide')];
const byId = id => document.getElementById(id);
let current = 0;
let layer = 0;
const harness = document.querySelector('.slide.harness');
const panels = [...harness.querySelectorAll('.layer-panel')];
const layerButtons = [...harness.querySelectorAll('[data-layer]')];
const rings = [...harness.querySelectorAll('[data-ring]')];
function setLayer(value) {
  layer = Math.max(0, Math.min(panels.length - 1, value));
  panels.forEach((panel, i) => { panel.hidden = i !== layer; });
  layerButtons.forEach((btn, i) => btn.setAttribute('aria-pressed', String(i === layer)));
  rings.forEach((ring, i) => {
    ring.classList.toggle('is-visible', i < layer);
    ring.classList.toggle('is-current', i + 1 === layer);
  });
  const result = layer === panels.length - 1;
  harness.querySelector('.result-photo').hidden = !result;
  harness.querySelector('.rig-art svg').style.display = result ? 'none' : '';
  byId('layer-meter').textContent = ['БАЗОВАЯ ФОРМА', 'КОЛЬЦО 1 / 5', 'КОЛЬЦО 2 / 5', 'КОЛЬЦО 3 / 5', 'КОЛЬЦО 4 / 5', 'КОЛЬЦО 5 / 5', 'ТРЕНИРОВКА В КЛУБЕ', 'РЕЗУЛЬТАТ ТРЕНИРОВОК'][layer];
}
const clubMap = document.querySelector('.clubmap');
const mapNodes = [...clubMap.querySelectorAll('[data-map-node]')];
let mapStep = 0;
function setMapStep(value) {
  mapStep = Math.max(0, Math.min(mapNodes.length, value));
  mapNodes.forEach((node, i) => node.setAttribute('aria-current', String(i + 1 === mapStep)));
}
function lastStep(slide) {
  if (slide === harness) return panels.length - 1;
  if (slide === clubMap) return mapNodes.length;
  return 0;
}
function move(delta) {
  const slide = slides[current];
  const step = slide === harness ? layer : mapStep;
  if (lastStep(slide) && step + delta >= 0 && step + delta <= lastStep(slide)) {
    go(current, step + delta);
    return;
  }
  const target = current + delta;
  go(target, delta < 0 ? lastStep(slides[target]) : 0);
}
function restore() {
  const match = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash);
  go(match ? Number(match[1]) - 1 : 0, match && match[2] ? Number(match[2]) : 0);
}
layerButtons.forEach((btn, i) => { btn.onclick = () => go(current, i); });
harness.querySelector('main').addEventListener('click', e => {
  if (!e.target.closest('button,a') && !window.getSelection()?.toString()) move(1);
});
clubMap.querySelector('main').addEventListener('click', event => {
  if (!event.target.closest('a,button') && !window.getSelection()?.toString()) move(1);
});
function scale() {
  document.documentElement.style.setProperty('--toolbar-height', `${byId('toolbar').offsetHeight}px`);
  const viewport = byId('viewport');
  byId('stage').style.transform = `scale(${Math.min(viewport.clientWidth / 1600, viewport.clientHeight / 900)})`;
}
function go(index, step = 0) {
  current = Math.max(0, Math.min(slides.length - 1, Number.isFinite(index) ? index : 0));
  slides.forEach((slide, i) => { slide.classList.toggle('active', i === current); slide.setAttribute('aria-hidden', String(i !== current)); });
  byId('counter').value = `${current + 1} / ${slides.length}`;
  byId('progress').style.width = `${(current + 1) / slides.length * 100}%`;
  byId('notes').textContent = slides[current].querySelector('.speaker-note')?.content.textContent.trim() || 'Заметок к этому слайду нет.';
  if (slides[current] === harness) setLayer(step);
  if (slides[current] === clubMap) setMapStep(step);
  const shown = slides[current] === harness ? layer : slides[current] === clubMap ? mapStep : 0;
  const suffix = shown ? '.' + shown : '';
  history.replaceState(null, '', '#' + (current + 1) + suffix);
  byId('prev').disabled = current === 0; byId('next').disabled = current === slides.length - 1;
}
function toggleDialog(id) { const dialog = byId(id); if (dialog.open) dialog.close(); else dialog.showModal(); }
byId('prev').onclick = () => move(-1); byId('next').onclick = () => move(1);
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
  if (['arrowright', 'pagedown', ' '].includes(key)) { event.preventDefault(); move(1); }
  else if (['arrowleft', 'pageup'].includes(key)) { event.preventDefault(); move(-1); }
  else if (key === 'home') { event.preventDefault(); go(0); } else if (key === 'end') { event.preventDefault(); go(slides.length - 1); }
  else if (key === 'o') byId('menu').click(); else if (key === 'n') byId('noteBtn').click(); else if (key === 'f') byId('full').click();
});
window.addEventListener('hashchange', restore);
window.addEventListener('resize', scale); new ResizeObserver(scale).observe(byId('toolbar'));
let touch = null;
byId('viewport').addEventListener('touchstart', event => { const t = event.changedTouches[0]; touch = event.touches.length === 1 && !event.target.closest('a,button') ? [t.clientX, t.clientY] : null; }, {passive:true});
byId('viewport').addEventListener('touchend', event => { if (!touch) return; const t = event.changedTouches[0], dx = t.clientX - touch[0], dy = t.clientY - touch[1]; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1); touch = null; }, {passive:true});
byId('viewport').addEventListener('touchcancel', () => { touch = null; }, {passive:true});
scale(); restore();
