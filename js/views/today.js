// Tela principal: resumo do dia, água, refeições e dia neutro.
import {
  getState, getDay, MEALS, removeEntry, updateEntry, copyMeal, addWater, setNeutral, nutrientsFor, toggleMission,
} from '../store.js';
import { totals, dayStatus, dietRange, NEUTRAL_REASONS } from '../calc.js';
import { findFood } from '../foods.js';
import { evaluateDay, FOCUS, RULES } from '../journey.js';
import { t } from '../i18n.js';
import {
  esc, n0, n1, num, dateKey, addDays, formatDate, ring, progressBar, macrosPreview, refresh, toast,
} from '../ui.js';

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

  const title = date === today
    ? t('today.today')
    : date === addDays(today, -1) ? t('today.yesterday') : formatDate(date, { weekday: 'long' });
  const remaining = diff >= 0 ? t('today.remaining', { n: n0(diff) }) : t('today.over', { n: n0(-diff) });

  const macro = (label, value, target, color) => `
    <div class="macro">
      <div class="row between"><span>${label}</span><span class="muted">${n0(value)} / ${n0(target)} g</span></div>
      ${progressBar(value, target, color)}
    </div>`;

  const previous = getDay(addDays(date, -1));

  const meals = MEALS.map((meal) => {
    const items = day.entries.filter((e) => e.meal === meal);
    const kcal = items.reduce((s, e) => s + e.kcal, 0);
    // Repetir só aparece com a refeição vazia, para não duplicar sem querer.
    const prevItems = items.length ? [] : previous.entries.filter((e) => e.meal === meal);
    const prevKcal = prevItems.reduce((s, e) => s + e.kcal, 0);
    const repeatVars = {
      n: prevItems.length,
      items: t(prevItems.length === 1 ? 'common.item' : 'common.items'),
      kcal: n0(prevKcal),
    };
    return `
      <section class="card">
        <div class="meal-head">
          <h3>${t(`meal.${meal}`)}</h3>
          <span class="muted small">${items.length ? `${n0(kcal)} kcal` : ''}</span>
        </div>
        ${items.length ? `<div class="entries">${items.map((e) => `
          <div class="entry">
            <button class="name food-item" style="padding:0" data-edit="${e.id}" aria-label="${esc(t('today.editAria', { name: e.name }))}">
              <span>${esc(e.name)}<small>${n0(e.grams)} g · ${t('today.macroLine', { p: n1(e.protein), c: n1(e.carbs), f: n1(e.fat) })}</small></span>
            </button>
            <span class="small">${n0(e.kcal)} kcal</span>
            <button class="btn-ghost icon-btn" data-remove="${e.id}" aria-label="${esc(t('today.removeAria', { name: e.name }))}">✕</button>
          </div>`).join('')}</div>` : ''}
        ${prevItems.length ? `
          <button class="btn-ghost btn-block" data-repeat="${meal}" style="margin-bottom:8px">
            ${t(date === today ? 'today.repeatYesterday' : 'today.repeatPrevious', repeatVars)}
          </button>` : ''}
        <a class="btn btn-ghost btn-block" href="#/adicionar?d=${date}&m=${meal}">${t('today.add')}</a>
      </section>`;
  }).join('');

  const water = day.waterMl || 0;

  // Missões do dia (Fase 2)
  const quest = evaluateDay(day, getState().profile.focus || FOCUS, date, today);
  const editable = date >= addDays(today, -RULES.editableDays);
  const missionRow = (m) => {
    const inner = `
      <span class="check">${m.done ? '✓' : ''}</span>
      <span class="text">${t(`mission.${m.id}`)}<small>${t(`attr.${m.attr}`)}${m.auto ? ` · ${t('missions.auto')}` : ''}</small></span>
      <span class="xp">+${m.xp} XP</span>`;
    return m.auto || !editable
      ? `<li><div class="mission ${m.done ? 'done' : ''}">${inner}</div></li>`
      : `<li><button type="button" class="mission ${m.done ? 'done' : ''}" data-mission="${m.id}" aria-pressed="${m.done}">${inner}</button></li>`;
  };
  const missing = Math.max(0, quest.need - quest.done);
  const missionsCard = quest.neutral
    ? `<section class="card"><h2>${t('missions.title')}</h2><p class="muted small" style="margin:0">${t('missions.neutral')}</p></section>`
    : `
    <section class="card">
      <div class="row between">
        <h2 style="margin:0">${t('missions.title')}</h2>
        <span class="muted small">${t('missions.progress', { done: quest.done, total: quest.missions.length })}</span>
      </div>
      <ul class="missions">
        ${quest.missions.map(missionRow).join('')}
        <li><div class="mission ${quest.diet ? 'done' : ''}">
          <span class="check">${quest.diet ? '✓' : ''}</span>
          <span class="text">${t('status.cumprida')}<small>${t('missions.auto')}</small></span>
          <span class="xp">+${RULES.xp.diet} XP</span>
        </div></li>
      </ul>
      ${quest.validated
        ? `<div class="validated">★ ${t('missions.validated')}</div>`
        : `<p class="muted small" style="margin:12px 0 0">${[
          missing ? t(missing === 1 ? 'missions.needOne' : 'missions.need', { n: missing }) : '',
          quest.diet ? '' : t('missions.needDiet'),
        ].filter(Boolean).join(' · ')}</p>`}
      ${editable ? '' : `<p class="hint">${t('missions.locked')}</p>`}
    </section>`;

  root.innerHTML = `
    <div class="datebar">
      <a class="btn btn-ghost icon-btn" href="#/hoje?d=${addDays(date, -1)}" aria-label="${t('today.prevDay')}">‹</a>
      <h1>${esc(title)}<span class="sub">${formatDate(date, { day: 'numeric', month: 'long' })}</span></h1>
      ${date < today
        ? `<a class="btn btn-ghost icon-btn" href="#/hoje?d=${addDays(date, 1)}" aria-label="${t('today.nextDay')}">›</a>`
        : '<span class="icon-btn"></span>'}
    </div>

    <section class="card">
      <div class="row between" style="margin-bottom:12px">
        <h2 style="margin:0">${t('today.calories')}</h2>
        <span class="badge ${status.cls}">${t(status.key)}</span>
      </div>
      <div class="summary">
        ${ring(sum.kcal, targets.kcal, status.cls)}
        <div class="summary-lines">
          <p style="margin-bottom:4px">${remaining}</p>
          <p class="muted small" style="margin:0">${t('today.target', { n: n0(targets.kcal) })}<br>${t('today.range', { min: n0(range.min), max: n0(range.max) })}</p>
        </div>
      </div>
      ${macro(t('macro.protein'), sum.protein, targets.protein, 'var(--protein)')}
      ${macro(t('macro.carbs'), sum.carbs, targets.carbs, 'var(--carbs)')}
      ${macro(t('macro.fat'), sum.fat, targets.fat, 'var(--fat)')}
    </section>

    ${missionsCard}

    <section class="card">
      <div class="row between">
        <h2 style="margin:0">${t('today.water')}</h2>
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
      <h2>${t('today.neutral')}</h2>
      <p class="muted small">${t('today.neutralHelp')}</p>
      <select id="neutral" aria-label="${t('today.neutral')}">
        <option value="">${t('today.normalDay')}</option>
        ${NEUTRAL_REASONS.map((r) => `<option value="${r}" ${day.neutral === r ? 'selected' : ''}>${t(`neutral.${r}`)}</option>`).join('')}
      </select>
    </section>

    <dialog id="edit"></dialog>`;

  const editDialog = root.querySelector('#edit');

  function openEdit(entry) {
    const per100 = per100Of(entry);
    editDialog.innerHTML = `
      <form method="dialog" id="edit-form">
        <h2>${esc(entry.name)}</h2>
        <label for="edit-grams">${t('qty.label')}</label>
        <input id="edit-grams" inputmode="decimal" value="${n0(entry.grams)}">
        <div class="macros-preview" id="edit-preview"></div>
        <div class="grid-2">
          <button type="button" id="edit-cancel">${t('common.cancel')}</button>
          <button type="submit" class="btn-primary">${t('common.save')}</button>
        </div>
      </form>`;
    const grams = editDialog.querySelector('#edit-grams');
    const preview = editDialog.querySelector('#edit-preview');
    const update = () => {
      const g = num(grams.value);
      preview.innerHTML = macrosPreview(nutrientsFor(per100, Number.isFinite(g) ? g : 0));
    };
    update();
    grams.addEventListener('input', update);
    grams.addEventListener('focus', () => setTimeout(() => grams.select(), 0));
    editDialog.querySelector('#edit-cancel').addEventListener('click', () => editDialog.close());
    editDialog.querySelector('#edit-form').addEventListener('submit', (ev) => {
      const g = num(grams.value);
      if (!(g > 0 && g <= 5000)) {
        ev.preventDefault();
        return toast(t('qty.error'));
      }
      updateEntry(date, entry.id, g, per100);
      toast(t('qty.updated'));
      refresh();
    });
    editDialog.showModal();
    document.activeElement?.blur();
  }

  root.addEventListener('click', (ev) => {
    const remove = ev.target.closest('[data-remove]');
    if (remove) {
      removeEntry(date, remove.dataset.remove);
      toast(t('today.removed'));
      refresh();
      return;
    }
    const edit = ev.target.closest('[data-edit]');
    if (edit) {
      const entry = day.entries.find((e) => e.id === edit.dataset.edit);
      if (entry) openEdit(entry);
      return;
    }
    const mission = ev.target.closest('[data-mission]');
    if (mission) {
      toggleMission(date, mission.dataset.mission);
      refresh();
      return;
    }
    const repeat = ev.target.closest('[data-repeat]');
    if (repeat) {
      copyMeal(addDays(date, -1), date, repeat.dataset.repeat);
      toast(t('today.copied'));
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
    toast(t(ev.target.value ? 'today.neutralMarked' : 'today.normalDay'));
    refresh();
  });
}
