// Progresso: peso, IMC, consistência da dieta e calorias recentes.
import { getState, getDay, addWeight, removeWeight } from '../store.js';
import { bmi, bmiCategory, totals, dayStatus, dietRange } from '../calc.js';
import { t } from '../i18n.js';
import { esc, n0, n1, num, dateKey, addDays, parseKey, formatDate, lineChart, caloriesChart, refresh, toast } from '../ui.js';

const RANGES = [
  { id: '7', key: 'range.week', days: 7 },
  { id: '30', key: 'range.month', days: 30 },
  { id: '365', key: 'range.year', days: 365 },
  { id: 'all', key: 'range.all', days: Infinity },
];

export function render(root, params) {
  const s = getState();
  const today = dateKey();
  const range = RANGES.find((r) => r.id === params.p) || RANGES[1];
  const weights = s.weights;
  const last = weights.at(-1);
  const first = weights[0];
  const since = range.days === Infinity ? '' : addDays(today, -(range.days - 1));
  const shown = weights.filter((w) => w.date >= since);
  const imc = last ? bmi(last.kg, s.profile.heightCm) : null;
  const change = last && first ? last.kg - first.kg : 0;

  // Consistência da dieta nos últimos 28 dias (4 semanas, começando na segunda-feira).
  const start = (() => {
    const d = parseKey(addDays(today, -27));
    const shift = (d.getDay() + 6) % 7;
    return addDays(dateKey(d), -shift);
  })();
  const calendarDays = [];
  for (let k = start; k <= today; k = addDays(k, 1)) calendarDays.push(k);
  const statuses = calendarDays.map((k) => ({ date: k, status: dayStatus(getDay(k), k, today) }));
  const evaluated = statuses.filter((x) => x.date < today && ['cumprida', 'fora'].includes(x.status.code));
  const done = evaluated.filter((x) => x.status.code === 'cumprida').length;

  const last14 = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13)).map((k) => {
    const day = getDay(k);
    const r = day.targets ? dietRange(day.targets.kcal) : {};
    return { date: k, kcal: totals(day).kcal, ...r, cls: dayStatus(day, k, today).cls };
  });

  const cellCls = (code) => ({ cumprida: 'ok', fora: 'bad', neutro: 'neutral' })[code] || '';

  root.innerHTML = `
    <h1>${t('prog.title')}</h1>

    <section class="card">
      <h2>${t('prog.weight')}</h2>
      <div class="stat-row">
        <div class="stat"><b>${last ? n1(last.kg) : '—'} kg</b><small>${t('prog.current')}</small></div>
        <div class="stat"><b>${change > 0 ? '+' : ''}${n1(change)} kg</b><small>${t('prog.sinceStart')}</small></div>
        <div class="stat"><b>${imc ? n1(imc) : '—'}</b><small>${t('prog.bmi')} · ${imc ? t(bmiCategory(imc)) : ''}</small></div>
      </div>
      <div class="chips" style="margin-top:12px" role="group" aria-label="${t('range.aria')}">
        ${RANGES.map((r) => `<a class="chip" href="#/progresso?p=${r.id}" aria-pressed="${r.id === range.id}" style="text-decoration:none">${t(r.key)}</a>`).join('')}
      </div>
      ${shown.length
        ? lineChart(shown.map((w) => ({ date: w.date, value: w.kg })), { target: s.profile.targetWeightKg ?? undefined })
        : `<p class="muted small" style="margin-top:12px">${t('prog.noWeights')}</p>`}
      <p class="hint">${t('prog.bmiHint')}</p>
    </section>

    <section class="card">
      <h2>${t('prog.log')}</h2>
      <form id="weight-form" novalidate>
        <div class="grid-2">
          <div class="field"><label for="w-kg">${t('prog.kg')}</label><input id="w-kg" name="kg" inputmode="decimal" required placeholder="${last ? n1(last.kg) : ''}"></div>
          <div class="field"><label for="w-fat">${t('prog.fatOpt')}</label><input id="w-fat" name="fat" inputmode="decimal"></div>
        </div>
        <div class="field"><label for="w-date">${t('prog.date')}</label><input id="w-date" name="date" type="date" value="${today}" max="${today}"></div>
        <button class="btn-primary btn-block" type="submit">${t('prog.save')}</button>
      </form>
      ${weights.length ? `
        <h3 style="margin-top:16px">${t('prog.recent')}</h3>
        <ul class="list-plain">${weights.slice(-5).reverse().map((w) => `
          <li><span class="grow">${formatDate(w.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>${n1(w.kg)} kg${w.bodyFat ? ` · ${n1(w.bodyFat)}%` : ''}</span>
            <button class="btn-ghost icon-btn" data-del-weight="${w.date}" aria-label="${t('prog.deleteAria')}">✕</button></li>`).join('')}
        </ul>` : ''}
    </section>

    <section class="card">
      <h2>${t('prog.diet4w')}</h2>
      <p class="muted small" style="margin:0">${evaluated.length
        ? t('prog.dietCount', { done, total: evaluated.length })
        : t('prog.dietEmpty')}</p>
      <div class="calendar">
        ${t('prog.weekdays').split(',').map((d) => `<div class="muted small" style="text-align:center">${d}</div>`).join('')}
        ${statuses.map(({ date, status }) => `
          <a class="day ${cellCls(status.code)} ${date === today ? 'today' : ''}" href="#/hoje?d=${date}"
            title="${formatDate(date)}: ${esc(t(status.key))}" style="text-decoration:none">${parseKey(date).getDate()}</a>`).join('')}
      </div>
      <div class="legend"><span class="ok">${t('legend.ok')}</span><span class="bad">${t('legend.bad')}</span><span>${t('legend.none')}</span></div>
    </section>

    <section class="card">
      <h2>${t('prog.cal14')}</h2>
      <p class="muted small" style="margin:0">${t('prog.bandHint')}</p>
      ${caloriesChart(last14)}
    </section>`;

  root.querySelector('#weight-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const kg = num(fd.get('kg'));
    const fat = num(fd.get('fat'));
    const date = fd.get('date') || today;
    if (!(kg >= 30 && kg <= 350)) return toast(t('prog.errWeight'));
    if (Number.isFinite(fat) && !(fat >= 3 && fat <= 70)) return toast(t('prog.errFat'));
    if (date > today) return toast(t('prog.errDate'));
    addWeight(date, kg, fat);
    toast(t('prog.saved'));
    refresh();
  });

  root.addEventListener('click', (ev) => {
    const del = ev.target.closest('[data-del-weight]');
    if (!del) return;
    if (!confirm(t('prog.confirmDelete'))) return;
    removeWeight(del.dataset.delWeight);
    refresh();
  });
}
