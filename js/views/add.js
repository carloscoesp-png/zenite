// Adicionar alimento a uma refeição: busca, favoritos, recentes, porção e alimento próprio.
import { getState, MEALS, addEntry, addCustomFood, toggleFavorite, nutrientsFor } from '../store.js';
import { findFood, searchFoods } from '../foods.js';
import { t } from '../i18n.js';
import { esc, n0, n1, num, dateKey, macrosPreview, toast } from '../ui.js';

const sourceOf = (f) => (f.custom ? 'usuario' : f.source || 'taco');
const portionText = (f) => (f.portion ? `${f.portion} (${n0(f.portionG)} g)` : t('add.per100'));

// Atalhos de quantidade: porções próprias do prato, múltiplos da porção caseira,
// ou gramas fixas quando não há porção.
const quickAmounts = (f) => {
  if (f.portions) return f.portions;
  if (f.portion) return [0.5, 1, 2].map((k) => ({ grams: Math.round(f.portionG * k), label: `${n1(k)}× ${f.portion}` }));
  return [50, 100, 200].map((g) => ({ grams: g, label: `${g} g` }));
};

export function render(root, params) {
  const today = dateKey();
  const date = params.d && params.d <= today ? params.d : today;
  const meal = MEALS.includes(params.m) ? params.m : MEALS[0];
  const back = `#/hoje${date === today ? '' : `?d=${date}`}`;

  root.innerHTML = `
    <div class="datebar">
      <a class="btn btn-ghost icon-btn" href="${back}" aria-label="${t('common.back')}">‹</a>
      <h1>${t(`meal.${meal}`)}</h1>
      <span class="icon-btn"></span>
    </div>
    <div class="search">
      <input id="q" type="search" placeholder="${t('add.search')}" autocomplete="off" aria-label="${t('add.search')}">
    </div>
    <div id="results"></div>
    <button id="new-food" class="btn-ghost btn-block" style="margin-top:12px">${t('add.newFood')}</button>
    <p class="hint">${t('add.sourceNote')}</p>

    <dialog id="portion"></dialog>
    <dialog id="custom"></dialog>`;

  const results = root.querySelector('#results');
  const input = root.querySelector('#q');
  const portion = root.querySelector('#portion');
  const custom = root.querySelector('#custom');

  const list = (title, foods) => foods.length ? `
    <section class="card">
      <h2>${title}</h2>
      <ul class="food-list">${foods.map((f) => `
        <li><button class="food-item" data-food="${esc(f.id)}">
          <span>${esc(f.name)}<small>${esc(portionText(f))}${sourceOf(f) === 'taco' ? '' : ` · ${t(`source.${sourceOf(f)}`)}`}</small></span>
          <span class="muted small">${t('add.kcalPer100', { n: n0(f.kcal) })}</span>
        </button></li>`).join('')}</ul>
    </section>` : '';

  function showResults() {
    const q = input.value.trim();
    const s = getState();
    if (!q) {
      const favs = s.favorites.map((id) => findFood(id, s.customFoods)).filter(Boolean);
      const recents = s.recents.filter((id) => !s.favorites.includes(id)).map((id) => findFood(id, s.customFoods)).filter(Boolean);
      results.innerHTML = list(t('add.favorites'), favs) + list(t('add.recents'), recents) +
        (favs.length || recents.length ? '' : `<p class="muted">${t('add.typeToSearch')}</p>`);
      return;
    }
    const found = searchFoods(q, s.customFoods);
    results.innerHTML = found.length ? list(t('add.results'), found) : `<p class="muted">${t('add.noResults')}</p>`;
  }

  function openPortion(food) {
    const isFav = () => getState().favorites.includes(food.id);
    portion.innerHTML = `
      <form method="dialog" id="portion-form">
        <div class="row between">
          <h2 style="margin:0">${esc(food.name)}</h2>
          <button type="button" class="btn-ghost icon-btn" id="fav" aria-pressed="${isFav()}" aria-label="${t('add.favorite')}">${isFav() ? '★' : '☆'}</button>
        </div>
        <p class="muted small">${t('add.kcalPer100Long', { n: n0(food.kcal) })} · ${t(`source.${sourceOf(food)}`)}${food.portion ? ` · ${esc(food.portion)} = ${n0(food.portionG)} g` : ''}</p>
        <div class="chips" style="margin-bottom:12px">
          ${quickAmounts(food).map((q) => `<button type="button" class="chip" data-grams="${q.grams}">${esc(q.label)}</button>`).join('')}
        </div>
        ${food.ingredients ? `
          <details class="small" style="margin-bottom:12px">
            <summary class="muted">${esc(t('add.ingredients', { portion: food.portion }))}</summary>
            <ul class="muted" style="margin:6px 0 0; padding-left:18px">
              ${food.ingredients.map((i) => `<li>${esc(i.name)}: ${n0(i.grams)} g</li>`).join('')}
            </ul>
          </details>` : ''}
        <label for="grams">${t('qty.label')}</label>
        <input id="grams" inputmode="decimal" value="${food.portionG}">
        <div class="macros-preview" id="preview"></div>
        <div class="grid-2">
          <button type="button" id="cancel">${t('common.cancel')}</button>
          <button type="submit" class="btn-primary">${t('common.add')}</button>
        </div>
      </form>`;

    const grams = portion.querySelector('#grams');
    const preview = portion.querySelector('#preview');
    const update = () => {
      const g = num(grams.value);
      preview.innerHTML = macrosPreview(nutrientsFor(food, Number.isFinite(g) ? g : 0));
    };
    update();
    grams.addEventListener('input', update);
    portion.querySelectorAll('[data-grams]').forEach((b) =>
      b.addEventListener('click', () => {
        grams.value = b.dataset.grams;
        update();
      }));
    portion.querySelector('#fav').addEventListener('click', (ev) => {
      const on = toggleFavorite(food.id);
      ev.currentTarget.textContent = on ? '★' : '☆';
      ev.currentTarget.setAttribute('aria-pressed', on);
      toast(t(on ? 'add.favAdded' : 'add.favRemoved'));
    });
    portion.querySelector('#cancel').addEventListener('click', () => portion.close());
    portion.querySelector('#portion-form').addEventListener('submit', (ev) => {
      const g = num(grams.value);
      if (!(g > 0 && g <= 5000)) {
        ev.preventDefault();
        return toast(t('qty.error'));
      }
      addEntry(date, meal, food, g);
      toast(t('add.added', { name: food.name }));
      location.hash = back;
    });
    // Sem foco automático no campo: no celular o teclado cobriria a porção e o resumo.
    // Ao tocar no campo, o valor vem selecionado para ser trocado de uma vez.
    grams.addEventListener('focus', () => setTimeout(() => grams.select(), 0));
    portion.showModal();
    document.activeElement?.blur();
  }

  function openCustom() {
    const field = (id, name, label, attrs = '') =>
      `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${name}" ${attrs}></div>`;
    custom.innerHTML = `
      <form id="custom-form" novalidate>
        <h2>${t('custom.title')}</h2>
        <p class="muted small">${t('custom.help')}</p>
        ${field('c-name', 'name', t('custom.name'), 'required maxlength="60"')}
        <div class="grid-2">
          ${field('c-kcal', 'kcal', t('custom.kcal'), 'inputmode="decimal" required')}
          ${field('c-p', 'protein', t('custom.protein'), 'inputmode="decimal" required')}
          ${field('c-c', 'carbs', t('custom.carbs'), 'inputmode="decimal" required')}
          ${field('c-f', 'fat', t('custom.fat'), 'inputmode="decimal" required')}
          ${field('c-portion', 'portion', t('custom.portion'), `placeholder="${t('custom.portionPh')}" maxlength="30"`)}
          ${field('c-pg', 'portionG', t('custom.portionG'), 'inputmode="decimal" placeholder="100"')}
        </div>
        <div class="grid-2">
          <button type="button" id="c-cancel">${t('common.cancel')}</button>
          <button type="submit" class="btn-primary">${t('common.save')}</button>
        </div>
      </form>`;
    custom.querySelector('#c-cancel').addEventListener('click', () => custom.close());
    custom.querySelector('#custom-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.currentTarget);
      const food = {
        name: String(fd.get('name') || '').trim(),
        category: 'Meus alimentos',
        kcal: num(fd.get('kcal')),
        protein: num(fd.get('protein')),
        carbs: num(fd.get('carbs')),
        fat: num(fd.get('fat')),
        portion: String(fd.get('portion') || '').trim() || t('custom.defaultPortion'),
        portionG: num(fd.get('portionG')) || 100,
      };
      if (!food.name) return toast(t('custom.errName'));
      if (![food.kcal, food.protein, food.carbs, food.fat].every((v) => v >= 0 && v <= 900)) {
        return toast(t('custom.errValues'));
      }
      const saved = addCustomFood(food);
      custom.close();
      toast(t('custom.saved'));
      openPortion(saved);
    });
    custom.showModal();
  }

  input.addEventListener('input', showResults);
  results.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-food]');
    if (!btn) return;
    const food = findFood(btn.dataset.food, getState().customFoods);
    if (food) openPortion(food);
  });
  root.querySelector('#new-food').addEventListener('click', openCustom);

  showResults();
  if (!getState().recents.length) input.focus();
}
