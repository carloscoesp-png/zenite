// Tela principal: resumo do dia, água, refeições e dia neutro.
import { getState, getDay, MEALS, removeEntry, addWater, setNeutral } from '../store.js';
import { totals, dayStatus, dietRange, NEUTRAL_REASONS } from '../calc.js';
import { esc, n0, n1, dateKey, addDays, formatDate, ring, progressBar, refresh, toast } from '../ui.js';

export function render(root, params) {
  const today = dateKey();
  const date = params.d && params.d <= today ? params.d : today;
  const day = getDay(date);
  const targets = day.targets || getState().targets;
  const sum = totals(day);
  const status = dayStatus(day, date, today);
  const range = dietRange(targets.kcal);
  const diff = targets.kcal - sum.kcal;

  const title = date === today ? 'Hoje' : date === addDays(today, -1) ? 'Ontem' : formatDate(date, { weekday: 'long' });
  const remaining = diff >= 0
    ? `Faltam <b>${n0(diff)}</b> kcal`
    : `Passou <b>${n0(-diff)}</b> kcal da meta`;

  const macro = (label, value, target, color) => `
    <div class="macro">
      <div class="row between"><span>${label}</span><span class="muted">${n0(value)} / ${n0(target)} g</span></div>
      ${progressBar(value, target, color)}
    </div>`;

  const meals = MEALS.map((meal) => {
    const items = day.entries.filter((e) => e.meal === meal.id);
    const kcal = items.reduce((s, e) => s + e.kcal, 0);
    return `
      <section class="card">
        <div class="meal-head">
          <h3>${meal.label}</h3>
          <span class="muted small">${items.length ? `${n0(kcal)} kcal` : ''}</span>
        </div>
        ${items.length ? `<div class="entries">${items.map((e) => `
          <div class="entry">
            <div class="name">${esc(e.name)}<small>${n0(e.grams)} g · P ${n1(e.protein)} · C ${n1(e.carbs)} · G ${n1(e.fat)}</small></div>
            <span class="small">${n0(e.kcal)} kcal</span>
            <button class="btn-ghost icon-btn" data-remove="${e.id}" aria-label="Remover ${esc(e.name)}">✕</button>
          </div>`).join('')}</div>` : ''}
        <a class="btn btn-ghost btn-block" href="#/adicionar?d=${date}&m=${meal.id}">+ Adicionar</a>
      </section>`;
  }).join('');

  const water = day.waterMl || 0;

  root.innerHTML = `
    <div class="datebar">
      <a class="btn btn-ghost icon-btn" href="#/hoje?d=${addDays(date, -1)}" aria-label="Dia anterior">‹</a>
      <h1>${esc(title)}<span class="sub">${formatDate(date, { day: 'numeric', month: 'long' })}</span></h1>
      ${date < today
        ? `<a class="btn btn-ghost icon-btn" href="#/hoje?d=${addDays(date, 1)}" aria-label="Próximo dia">›</a>`
        : '<span class="icon-btn"></span>'}
    </div>

    <section class="card">
      <div class="row between" style="margin-bottom:12px">
        <h2 style="margin:0">Calorias</h2>
        <span class="badge ${status.cls}">${status.label}</span>
      </div>
      <div class="summary">
        ${ring(sum.kcal, targets.kcal, status.cls)}
        <div class="summary-lines">
          <p style="margin-bottom:4px">${remaining}</p>
          <p class="muted small" style="margin:0">Meta ${n0(targets.kcal)} kcal<br>Dieta cumprida entre ${n0(range.min)} e ${n0(range.max)} kcal</p>
        </div>
      </div>
      ${macro('Proteína', sum.protein, targets.protein, 'var(--protein)')}
      ${macro('Carboidratos', sum.carbs, targets.carbs, 'var(--carbs)')}
      ${macro('Gorduras', sum.fat, targets.fat, 'var(--fat)')}
    </section>

    <section class="card">
      <div class="row between">
        <h2 style="margin:0">Água</h2>
        <span class="muted small">${n1(water / 1000)} / ${n1(targets.waterMl / 1000)} L</span>
      </div>
      ${progressBar(water, targets.waterMl, 'var(--water)')}
      <div class="water-actions">
        <button data-water="-250" ${water <= 0 ? 'disabled' : ''}>− 250 ml</button>
        <button data-water="250">+ 250 ml</button>
        <button data-water="500">+ 500 ml</button>
      </div>
    </section>

    ${meals}

    <section class="card">
      <h2>Dia neutro</h2>
      <p class="muted small">Use em dias de descanso planejado, doença ou lesão. O dia não conta como cumprido nem como falha.</p>
      <select id="neutral" aria-label="Motivo do dia neutro">
        <option value="">Dia normal</option>
        ${NEUTRAL_REASONS.map((r) => `<option value="${r.id}" ${day.neutral === r.id ? 'selected' : ''}>${r.label}</option>`).join('')}
      </select>
    </section>`;

  root.addEventListener('click', (ev) => {
    const remove = ev.target.closest('[data-remove]');
    if (remove) {
      removeEntry(date, remove.dataset.remove);
      toast('Item removido');
      refresh();
      return;
    }
    const waterBtn = ev.target.closest('[data-water]');
    if (waterBtn) {
      addWater(date, Number(waterBtn.dataset.water));
      refresh();
    }
  });

  root.querySelector('#neutral').addEventListener('change', (ev) => {
    setNeutral(date, ev.target.value);
    toast(ev.target.value ? 'Dia marcado como neutro' : 'Dia normal');
    refresh();
  });
}
