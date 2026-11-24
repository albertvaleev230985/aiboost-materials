'use strict';
const query = document.getElementById('search');
const groupSelect = document.getElementById('group');
const goal = document.getElementById('goal');
const count = document.getElementById('count');
const sections = Array.from(document.querySelectorAll('.group'));
const cards = Array.from(document.querySelectorAll('.card'));
const normalize = value => value.toLocaleLowerCase('ru').replaceAll('ё', 'е');
// Match common Russian case endings, e.g. «поилка» and «поилки».
function searchForm(word) {
  return word.length >= 5 ? word.replace(/(?:ами|ями|ого|ему|ому|ых|их|ой|ою|ей|ам|ям|ах|ях|ов|ев|ом|ем|а|я|ы|и|у|ю|е|о)$/u, '') : word;
}
const index = new Map(cards.map(card => [card, normalize(card.textContent + ' ' + card.parentElement.querySelector('h2').textContent)]));
for (const name of Array.from(new Set(cards.map(card => card.dataset.purpose))).sort((a,b) => a.localeCompare(b,'ru'))) {
  goal.add(new Option(name, name));
}
function filter() {
  const words = normalize(query.value.trim()).split(/\s+/).filter(Boolean).map(searchForm);
  let visible = 0;
  for (const section of sections) {
    let inSection = 0;
    for (const card of section.querySelectorAll('.card')) {
      const matches = (!groupSelect.value || section.dataset.group === groupSelect.value) &&
        (!goal.value || goal.value === card.dataset.purpose) &&
        words.every(word => index.get(card).includes(word));
      card.hidden = !matches;
      if (matches) inSection++;
    }
    visible += inSection;
    section.hidden = inSection === 0;
  }
  count.textContent = 'Показано ' + visible + ' из ' + cards.length;
  document.getElementById('noresults').hidden = visible !== 0;
}
query.addEventListener('input', filter);
groupSelect.addEventListener('change', filter);
goal.addEventListener('change', filter);
document.getElementById('reset').addEventListener('click', () => {
  query.value = groupSelect.value = goal.value = ''; filter(); query.focus();
});
document.addEventListener('click', async event => {
  const button = event.target.closest('button.copy');
  if (!button) return;
  const card = button.closest('.card');
  const q = card.querySelector('.ask').textContent;
  const value = button.dataset.kind === 'demo' ? card.querySelector('.sample').textContent + '\n\n' + q : q;
  const old = button.dataset.label || button.textContent;
  button.dataset.label = old;
  try {
    if (window.isSecureContext && navigator.clipboard) await navigator.clipboard.writeText(value);
    else {
      const field = card.querySelector('textarea.copy-field') || document.createElement('textarea');
      field.value = value; field.className = 'copy-field'; field.setAttribute('aria-label','Текст для копирования');
      button.parentElement.append(field); field.select();
      if (!document.execCommand('copy')) { button.textContent = 'Выделите и скопируйте ниже'; return; }
      field.remove();
    }
    button.textContent = 'Скопировано';
  } catch {
    let field=card.querySelector('textarea.copy-field');
    if(!field){field=document.createElement('textarea');field.className='copy-field';field.setAttribute('aria-label','Текст для копирования');button.parentElement.append(field);}
    field.value=value;field.focus();field.select();button.textContent='Текст выделен';
  }
  window.setTimeout(() => {button.textContent=old;},1600);
});
if (/^#s\d+$/.test(location.hash)) {
  const card=document.getElementById(location.hash.slice(1));
  if(card){card.open=true;requestAnimationFrame(()=>card.scrollIntoView());}
}
filter();
