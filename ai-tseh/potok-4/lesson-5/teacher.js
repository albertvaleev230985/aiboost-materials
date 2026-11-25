'use strict';
document.querySelectorAll('.teacher-prompt .cp').forEach(button => {
  button.addEventListener('click', async () => {
    const source = button.closest('.pr').querySelector('pre');
    try {
      await navigator.clipboard.writeText(source.textContent);
      button.textContent = 'Скопировано';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(source);
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = 'Текст выделен — скопируйте';
    }
  });
});
