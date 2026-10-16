// Итоги Цеха 3 для Альберта: общий для host.html (вкладка) и report.html (ссылка)
import { CARD_FIELDS, MIN_CARD_FIELDS, cardFilledCount, cardHours, escapeHtml, plural, letter } from './app.js';

export function participants(users) {
  return Object.entries(users || {})
    .filter(([, u]) => u && typeof u.name === 'string' && u.name.trim())
    .map(([slug, u]) => ({ slug, ...u, answers: u.answers || {}, card: u.card || {} }));
}

export function scoreOf(u, QUESTIONS) {
  return QUESTIONS.reduce((s, q, i) => s + (u.answers && u.answers[i] === q.correct ? 1 : 0), 0);
}
export function answeredOf(u, QUESTIONS) {
  return QUESTIONS.filter((_, i) => u.answers && u.answers[i] != null).length;
}

function fmtNum(n) { return (Math.round(n * 10) / 10).toString().replace('.', ','); }

export function reportData(users, QUESTIONS, LESSONS) {
  const list = participants(users).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const tested = list.filter(u => answeredOf(u, QUESTIONS) > 0);
  const avg = tested.length ? tested.reduce((s, u) => s + scoreOf(u, QUESTIONS), 0) / tested.length : 0;
  const cards = list.filter(u => cardFilledCount(u.card) >= MIN_CARD_FIELDS);
  const hoursTotal = list.reduce((s, u) => s + cardHours(u.card), 0);
  const qStats = QUESTIONS.map((q, i) => {
    let answered = 0, wrong = 0;
    list.forEach(u => { const a = u.answers[i]; if (a != null) { answered++; if (a !== q.correct) wrong++; } });
    return { i, q, answered, wrong, rate: answered ? wrong / answered : 0 };
  });
  const topWrong = qStats.filter(s => s.wrong > 0).sort((a, b) => b.rate - a.rate || b.wrong - a.wrong).slice(0, 5);
  const byLesson = Object.keys(LESSONS).map(l => {
    const qs = qStats.filter(s => String(s.q.lesson) === String(l));
    const ans = qs.reduce((s, x) => s + x.answered, 0);
    const ok = qs.reduce((s, x) => s + (x.answered - x.wrong), 0);
    return { l, title: LESSONS[l], pct: ans ? Math.round(ok / ans * 100) : null };
  });
  return { list, tested, avg, cards, hoursTotal, topWrong, byLesson };
}

export function reportHTML(users, QUESTIONS, LESSONS) {
  const d = reportData(users, QUESTIONS, LESSONS);
  const total = QUESTIONS.length;
  const people = d.list.map((u, idx) => {
    const sc = scoreOf(u, QUESTIONS);
    const ans = answeredOf(u, QUESTIONS);
    const h = cardHours(u.card);
    const fields = CARD_FIELDS.map(f => {
      let txt = (u.card[f.key] || '').trim();
      if (f.withHours && Number(u.card.hoursNum) > 0) txt = `${fmtNum(Number(u.card.hoursNum))} ч в неделю${txt ? '. ' + txt : ''}`;
      return `<div class="r-field"><div class="r-label">${escapeHtml(f.label)}</div>${txt ? `<div class="r-text">${escapeHtml(txt)}</div>` : '<div class="r-empty">не заполнено</div>'}</div>`;
    }).join('');
    return `<div class="r-person">
      <div class="r-person-head"><h3>${idx + 1}. ${escapeHtml(u.name)}</h3>
      <span class="r-score">${ans ? `тест ${sc}/${total}` : 'тест не проходил(а)'}${h ? ` · экономия ${fmtNum(h)} ч/нед` : ''}</span></div>
      ${fields}
    </div>`;
  }).join('');

  const needs = d.list.filter(u => (u.card.insight || '').trim());
  const helpers = d.list.filter(u => (u.card.manifest || '').trim());

  return `
  <div class="report" id="report">
    <div class="r-kicker">neovida · Нейропросвещение</div>
    <h1>Итоги AI Цеха · поток 3</h1>
    <div class="r-meta">AI Цех, поток 3, Уфа · финал 16 октября 2026<br>
      Курс: 8 занятий (23.09–16.10.2026) · ведущие Альберт Валеев и Данил Щетников, NEOVIDA</div>
    <div class="r-metrics">
      <div class="r-metric"><b>${d.list.length}</b><span>${plural(d.list.length, 'участник', 'участника', 'участников')} финала</span></div>
      <div class="r-metric"><b>${d.tested.length ? fmtNum(d.avg) : '–'}<small style="font-size:15px;color:#55615c">/${total}</small></b><span>средний балл теста${d.tested.length ? ` (${Math.round(d.avg / total * 100)}%)` : ''}</span></div>
      <div class="r-metric"><b>${d.cards.length}</b><span>карт рефлексии заполнено</span></div>
      <div class="r-metric"><b>${fmtNum(d.hoursTotal)}</b><span>часов в неделю экономии (оценка участников, сумма)</span></div>
    </div>

    <h2>Сводка</h2>
    <table>
      <tr><th style="width:42%">Результат по занятиям</th><th>Доля верных ответов</th></tr>
      ${d.byLesson.map(b => `<tr><td>${b.l}. ${escapeHtml(b.title)}</td><td>${b.pct == null ? '–' : b.pct + '%'}</td></tr>`).join('')}
    </table>
    <div class="r-field" style="margin-top:14px"><div class="r-label">Темы, где ошибались чаще всего</div>
      ${d.topWrong.length ? `<ul>${d.topWrong.map(s => `<li><b>${escapeHtml(s.q.theme)}</b> (вопрос ${s.i + 1}, занятие ${s.q.lesson}): ошиблись ${s.wrong} из ${s.answered}. Верно: ${letter(s.q.correct)}. ${escapeHtml(s.q.options[s.q.correct])}</li>`).join('')}</ul>` : '<div class="r-empty">ошибок нет или тест ещё не проходили</div>'}
    </div>
    <div class="r-field"><div class="r-label">Манифесты ИИ-мышления</div>
      ${helpers.length ? `<ul>${helpers.map(u => `<li><b>${escapeHtml(u.name)}:</b> ${escapeHtml(u.card.manifest.trim())}</li>`).join('')}</ul>` : '<div class="r-empty">пока не заполнено</div>'}
    </div>
    <div class="r-field"><div class="r-label">Главные открытия курса</div>
      ${needs.length ? `<ul>${needs.map(u => `<li><b>${escapeHtml(u.name)}:</b> ${escapeHtml(u.card.insight.trim())}</li>`).join('')}</ul>` : '<div class="r-empty">пока не заполнено</div>'}
    </div>

    <h2>Участники: результат теста и рефлексия</h2>
    ${people || '<div class="r-empty">Участников пока нет.</div>'}
  </div>`;
}

export function reportText(users, QUESTIONS, LESSONS) {
  const d = reportData(users, QUESTIONS, LESSONS);
  const total = QUESTIONS.length;
  const L = [];
  L.push('ИТОГИ AI ЦЕХА · ПОТОК 3');
  L.push('Уфа · финал 16 октября 2026');
  L.push('Курс: 8 занятий (23.09–16.10.2026) · ведущие Альберт Валеев и Данил Щетников, NEOVIDA');
  L.push('');
  L.push(`Участников финала: ${d.list.length}`);
  L.push(`Средний балл теста: ${d.tested.length ? fmtNum(d.avg) + ' из ' + total : 'тест не проходили'}`);
  L.push(`Карт рефлексии заполнено: ${d.cards.length}`);
  L.push(`Экономия по оценке участников: ${fmtNum(d.hoursTotal)} ч в неделю (сумма)`);
  L.push('');
  L.push('РЕЗУЛЬТАТ ПО ЗАНЯТИЯМ');
  d.byLesson.forEach(b => L.push(`${b.l}. ${b.title}: ${b.pct == null ? 'нет данных' : b.pct + '% верных'}`));
  L.push('');
  L.push('ГДЕ ОШИБАЛИСЬ ЧАЩЕ ВСЕГО');
  if (d.topWrong.length) d.topWrong.forEach(s => L.push(`• ${s.q.theme} (вопрос ${s.i + 1}): ошиблись ${s.wrong} из ${s.answered}`));
  else L.push('• ошибок нет');
  L.push('');
  L.push('УЧАСТНИКИ');
  d.list.forEach((u, idx) => {
    const ans = answeredOf(u, QUESTIONS);
    const h = cardHours(u.card);
    L.push('');
    L.push(`${idx + 1}. ${u.name} · ${ans ? `тест ${scoreOf(u, QUESTIONS)}/${total}` : 'тест не проходил(а)'}${h ? ` · экономия ${fmtNum(h)} ч/нед` : ''}`);
    CARD_FIELDS.forEach(f => {
      let txt = (u.card[f.key] || '').trim();
      if (f.withHours && Number(u.card.hoursNum) > 0) txt = `${fmtNum(Number(u.card.hoursNum))} ч в неделю${txt ? '. ' + txt : ''}`;
      L.push(`   ${f.short}: ${txt || 'не заполнено'}`);
    });
  });
  return L.join('\n');
}

// Копирование: сначала execCommand (надёжно внутри клика), потом Clipboard API с таймаутом, иначе окно для ручного копирования
export async function copyText(text) {
  const viaExec = () => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
    document.body.appendChild(ta); ta.focus(); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  };
  if (viaExec()) return true;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await Promise.race([navigator.clipboard.writeText(text), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))]);
      return true;
    }
  } catch (e) { /* ниже ручной путь */ }
  showManualCopy(text);
  return false;
}

export function showManualCopy(text) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop open';
  wrap.innerHTML = `<div class="modal"><div class="card-title">Скопируйте текст отчёта</div>
    <div class="muted small" style="margin-bottom:8px">Текст уже выделен: нажмите Ctrl+C (на Mac Cmd+C).</div>
    <textarea style="min-height:50vh;font-size:13px" readonly></textarea>
    <div class="row mt-2"><button class="btn btn-ghost">Закрыть</button></div></div>`;
  document.body.appendChild(wrap);
  const ta = wrap.querySelector('textarea');
  ta.value = text; ta.focus(); ta.select();
  wrap.querySelector('button').addEventListener('click', () => wrap.remove());
  wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
}
