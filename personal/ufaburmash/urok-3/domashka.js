'use strict';
// Домашка: копирование промптов с fallback и раскрытие карточки по прямой ссылке.
document.querySelectorAll('.copy').forEach(button => {
  button.onclick = async () => {
    const card = button.closest('.instruction'), text = card.querySelector('pre'), status = card.querySelector('.copy-status');
    try { await navigator.clipboard.writeText(text.textContent); status.textContent = 'Промпт скопирован.'; }
    catch {
      card.querySelectorAll('details').forEach(detail => detail.open = true);
      const range = document.createRange(); range.selectNodeContents(text);
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      status.textContent = 'Текст выделен. Скопируй его вручную: Ctrl+C / ⌘C или меню выделения на телефоне.';
    }
  };
});
function openHash() {
  let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const card = document.getElementById(id);
  if (card) { card.querySelectorAll('details').forEach(detail => detail.open = true); requestAnimationFrame(() => card.scrollIntoView()); }
}
window.addEventListener('hashchange', openHash);
openHash();
// Chromium не печатает закрытые <details>, поэтому перед печатью открываем все.
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
