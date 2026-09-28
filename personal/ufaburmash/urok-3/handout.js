'use strict';
const cards = [...document.querySelectorAll('.instruction')];
const search = document.getElementById('search'), category = document.getElementById('category');
function filter() {
  let count = 0;
  const query = search.value.trim().toLocaleLowerCase('ru');
  cards.forEach(card => { card.hidden = !(card.textContent.toLocaleLowerCase('ru').includes(query) && (category.value === 'all' || card.dataset.category === category.value)); if (!card.hidden) count++; });
  document.getElementById('results').textContent = `Найдено: ${count}`;
}
search.addEventListener('input', filter); category.addEventListener('change', filter);
function openHash() {
  let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const card = document.getElementById(id);
  if (card?.classList.contains('instruction')) { search.value = ''; category.value = 'all'; filter(); card.querySelectorAll('details').forEach(detail => detail.open = true); requestAnimationFrame(() => card.scrollIntoView()); }
}
window.addEventListener('hashchange', openHash);
document.querySelectorAll('.copy').forEach(button => {
  button.onclick = async () => {
    const card = button.closest('.instruction'), text = card.querySelector('pre'), status = card.querySelector('.copy-status');
    try { await navigator.clipboard.writeText(text.textContent); status.textContent = 'Инструкция скопирована.'; }
    catch { card.querySelectorAll('details').forEach(detail => detail.open = true); const range = document.createRange(); range.selectNodeContents(text); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); status.textContent = 'Текст выделен. Скопируй его вручную: Ctrl+C / ⌘C или меню выделения на телефоне.'; }
  };
});
filter(); openHash();
// Chromium omits closed <details> bodies from print even with display overrides.
let printDetailsState = null;
window.addEventListener('beforeprint', () => {
  if (printDetailsState !== null) return;
  printDetailsState = [...document.querySelectorAll('details')].map(detail => [detail, detail.open]);
  printDetailsState.forEach(([detail]) => { detail.open = true; });
});
window.addEventListener('afterprint', () => {
  if (printDetailsState === null) return;
  printDetailsState.forEach(([detail, wasOpen]) => { detail.open = wasOpen; });
  printDetailsState = null;
});
