// Tela principal: resumo do dia, água, refeições e dia neutro.
import {
  getState, getDay, MEALS, removeEntry, updateEntry, copyMeal, addWater, setNeutral, nutrientsFor,
} from '../store.js';
import { totals, dayStatus, dietRange, NEUTRAL_REASONS } from '../calc.js';
import { findFood } from '../foods.js';
import { esc, n0, n1, num, dateKey, addDays, formatDate, ring, progressBar, refresh, toast } from '../ui.js';

// Valores por 100 g de um item já registrado: do alimento, se ainda existir,
// senão a partir do próprio registro.
function per100Of(entry) {
  const food = findFood(entry.foodId, getState().customFoods);
  if (food) return food;
  const k = 100 / entry.grams;
  return { kcal: entry.kcal * k, protein: entry.protein * k, carbs: entry.carbs * k, fat: entry.fat * k };
}

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

  const previous = getDay(addDays(date, -1));

  const meals = MEALS.map((meal) => {
    const items = day.entries.filter((e) => e.meal === meal.id);
    const kcal = items.reduce((s, e) => s + e.kcal, 0);
    // Repetir só aparece com a refeição vazia, para não duplicar sem querer.
    const prevItems = items.length ? [] : previous.entries.filter((e) => e.meal === meal.id);
    const prevKcal = prevItems.reduce((s, e) => s + e.kcal, 0);
    return `
      <section class="card">
        <div class="meal-head">
          <h3>${meal.label}</h3>
          <span class="muted small">${items.length ? `${n0(kcal)} kcal` : ''}</span>
        </div>
        ${items.length ? `<div class="entries">${items.map((e) => `
          <div class="entry">
            <button class="name food-item" style="padding:0" data-edit="${e.id}" aria-label="Editar ${esc(e.name)}">
              <span>${esc(e.name)}<small>${n0(e.grams)} g · P ${n1(e.protein)} · C ${n1(e.carbs)} · G ${n1(e.fat)}</small></span>
            </button>
            <span class="small">${n0(e.kcal)} kcal</span>
            <button class="btn-ghost icon-btn" data-remove="${e.id}" aria-label="Remover ${esc(e.name)}">✕</button>
          </div>`).join('')}</div>` : ''}
        ${prevItems.length ? `
          <button class="btn-ghost btn-block" data-repeat="${meal.id}" style="margin-bottom:8px">
            ↻ Repetir ${date === today ? 'de ontem' : 'do dia anterior'} (${prevItems.length} ${prevItems.length === 1 ? 'item' : 'itens'}, ${n0(prevKcal)} kcal)
          </button>` : ''}
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
    </section>

    <dialog id="edit"></dialog>`;

  const editDialog = root.querySelector('#edit');

  function openEdit(entry) {
    const per100 = per100Of(entry);
    editDialog.innerHTML = `
      <form method="dialog" id="edit-form">
        <h2>${esc(entry.name)}</h2>
        <label for="edit-grams">Quantidade (g)</label>
        <input id="edit-grams" inputmode="decimal" value="${n0(entry.grams)}">
        <div class="macros-preview" id="edit-preview"></div>
        <div class="grid-2">
          <button type="button" id="edit-cancel">Cancelar</button>
          <button type="submit" class="btn-primary">Salvar</button>
        </div>
      </form>`;
    const grams = editDialog.querySelector('#edit-grams');
    const preview = editDialog.querySelector('#edit-preview');
    const update = () => {
      const g = num(grams.value);
      const n = nutrientsFor(per100, Number.isFinite(g) ? g : 0);
      preview.innerHTML = `
        <div><b>${n0(n.kcal)}</b><small>kcal</small></div>
        <div><b>${n1(n.protein)}</b><small>proteína</small></div>
        <div><b>${n1(n.carbs)}</b><small>carbo</small></div>
        <div><b>${n1(n.fat)}</b><small>gordura</small></div>`;
    };
    update();
    grams.addEventListener('input', update);
    grams.addEventListener('focus', () => setTimeout(() => grams.select(), 0));
    editDialog.querySelector('#edit-cancel').addEventListener('click', () => editDialog.close());
    editDialog.querySelector('#edit-form').addEventListener('submit', (ev) => {
      const g = num(grams.value);
      if (!(g > 0 && g <= 5000)) {
        ev.preventDefault();
        return toast('Informe uma quantidade entre 1 e 5000 g.');
      }
      updateEntry(date, entry.id, g, per100);
      toast('Quantidade atualizada');
      refresh();
    });
    editDialog.showModal();
    document.activeElement?.blur();
  }

  root.addEventListener('click', (ev) => {
    const remove = ev.target.closest('[data-remove]');
    if (remove) {
      removeEntry(date, remove.dataset.remove);
      toast('Item removido');
      refresh();
      return;
    }
    const edit = ev.target.closest('[data-edit]');
    if (edit) {
      const entry = day.entries.find((e) => e.id === edit.dataset.edit);
      if (entry) openEdit(entry);
      return;
    }
    const repeat = ev.target.closest('[data-repeat]');
    if (repeat) {
      const n = copyMeal(addDays(date, -1), date, repeat.dataset.repeat);
      toast(`${n} ${n === 1 ? 'item copiado' : 'itens copiados'}`);
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
