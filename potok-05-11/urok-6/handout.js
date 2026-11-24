'use strict';
function revealTarget() {
  const target = document.getElementById(location.hash.slice(1));
  if (!target) return;
  for (let node = target; node; node = node.parentElement) {
    if (node.tagName === 'DETAILS') node.open = true;
  }
  target.scrollIntoView({block:'start'});
}
window.addEventListener('hashchange', revealTarget);
if (location.hash) requestAnimationFrame(revealTarget);
document.addEventListener('click', async event => {
  const button = event.target.closest('button.copy');
  if (!button) return;
  const prompt = button.closest('.prompt').querySelector('pre');
  try {
    await navigator.clipboard.writeText(prompt.textContent);
    button.textContent = 'Скопировано';
    setTimeout(() => { button.textContent = 'Копировать'; }, 1800);
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(prompt);
    selection.removeAllRanges();
    selection.addRange(range);
    button.textContent = 'Текст выделен — скопируйте';
  }
});
