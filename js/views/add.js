// Adicionar alimento a uma refeição: busca, favoritos, recentes, porção e alimento próprio.
import { getState, MEALS, addEntry, addCustomFood, toggleFavorite, nutrientsFor } from '../store.js';
import { findFood, searchFoods, SOURCE_LABEL } from '../foods.js';
import { esc, n0, n1, num, dateKey, toast } from '../ui.js';

const sourceOf = (f) => (f.custom ? 'usuario' : f.source || 'taco');
const portionText = (f) => (f.portion ? `${f.portion} (${n0(f.portionG)} g)` : 'por 100 g');

// Atalhos de quantidade: múltiplos da porção caseira, ou gramas fixas quando não há porção.
const quickAmounts = (f) => f.portion
  ? [0.5, 1, 2].map((k) => ({ grams: Math.round(f.portionG * k), label: `${n1(k)}× ${f.portion}` }))
  : [50, 100, 200].map((g) => ({ grams: g, label: `${g} g` }));

export function render(root, params) {
  const today = dateKey();
  const date = params.d && params.d <= today ? params.d : today;
  const meal = MEALS.find((m) => m.id === params.m) || MEALS[0];
  const back = `#/hoje${date === today ? '' : `?d=${date}`}`;

  root.innerHTML = `
    <div class="datebar">
      <a class="btn btn-ghost icon-btn" href="${back}" aria-label="Voltar">‹</a>
      <h1>${meal.label}</h1>
      <span class="icon-btn"></span>
    </div>
    <div class="search">
      <input id="q" type="search" placeholder="Buscar alimento" autocomplete="off" aria-label="Buscar alimento">
    </div>
    <div id="results"></div>
    <button id="new-food" class="btn-ghost btn-block" style="margin-top:12px">+ Criar alimento</button>
    <p class="hint">Valores por 100 g da Tabela Brasileira de Composição de Alimentos (TACO, 4ª edição, NEPA/Unicamp).
      Itens que a TACO não traz aparecem como "valor médio de rótulo".</p>

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
          <span>${esc(f.name)}<small>${esc(portionText(f))}${sourceOf(f) === 'taco' ? '' : ` · ${SOURCE_LABEL[sourceOf(f)]}`}</small></span>
          <span class="muted small">${n0(f.kcal)} kcal/100 g</span>
        </button></li>`).join('')}</ul>
    </section>` : '';

  function showResults() {
    const q = input.value.trim();
    const s = getState();
    if (!q) {
      const favs = s.favorites.map((id) => findFood(id, s.customFoods)).filter(Boolean);
      const recents = s.recents.filter((id) => !s.favorites.includes(id)).map((id) => findFood(id, s.customFoods)).filter(Boolean);
      results.innerHTML = list('Favoritos', favs) + list('Recentes', recents) +
        (favs.length || recents.length ? '' : '<p class="muted">Digite o nome de um alimento para buscar.</p>');
      return;
    }
    const found = searchFoods(q, s.customFoods);
    results.innerHTML = found.length
      ? list('Resultados', found)
      : '<p class="muted">Nenhum alimento encontrado. Você pode criar um com os dados do rótulo.</p>';
  }

  function openPortion(food) {
    const isFav = () => getState().favorites.includes(food.id);
    portion.innerHTML = `
      <form method="dialog" id="portion-form">
        <div class="row between">
          <h2 style="margin:0">${esc(food.name)}</h2>
          <button type="button" class="btn-ghost icon-btn" id="fav" aria-pressed="${isFav()}" aria-label="Favorito">${isFav() ? '★' : '☆'}</button>
        </div>
        <p class="muted small">${n0(food.kcal)} kcal por 100 g · ${SOURCE_LABEL[sourceOf(food)]}${food.portion ? ` · ${esc(food.portion)} = ${n0(food.portionG)} g` : ''}</p>
        <div class="chips" style="margin-bottom:12px">
          ${quickAmounts(food).map((q) => `<button type="button" class="chip" data-grams="${q.grams}">${esc(q.label)}</button>`).join('')}
        </div>
        <label for="grams">Quantidade (g)</label>
        <input id="grams" inputmode="decimal" value="${food.portionG}">
        <div class="macros-preview" id="preview"></div>
        <div class="grid-2">
          <button type="button" id="cancel">Cancelar</button>
          <button type="submit" class="btn-primary">Adicionar</button>
        </div>
      </form>`;

    const grams = portion.querySelector('#grams');
    const preview = portion.querySelector('#preview');
    const update = () => {
      const g = num(grams.value);
      const n = nutrientsFor(food, Number.isFinite(g) ? g : 0);
      preview.innerHTML = `
        <div><b>${n0(n.kcal)}</b><small>kcal</small></div>
        <div><b>${n1(n.protein)}</b><small>proteína</small></div>
        <div><b>${n1(n.carbs)}</b><small>carbo</small></div>
        <div><b>${n1(n.fat)}</b><small>gordura</small></div>`;
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
      toast(on ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
    });
    portion.querySelector('#cancel').addEventListener('click', () => portion.close());
    portion.querySelector('#portion-form').addEventListener('submit', (ev) => {
      const g = num(grams.value);
      if (!(g > 0 && g <= 5000)) {
        ev.preventDefault();
        return toast('Informe uma quantidade entre 1 e 5000 g.');
      }
      addEntry(date, meal.id, food, g);
      toast(`${food.name} adicionado`);
      location.hash = back;
    });
    // Sem foco automático no campo: no celular o teclado cobriria a porção e o resumo.
    // Ao tocar no campo, o valor vem selecionado para ser trocado de uma vez.
    grams.addEventListener('focus', () => setTimeout(() => grams.select(), 0));
    portion.showModal();
    document.activeElement?.blur();
  }

  function openCustom() {
    custom.innerHTML = `
      <form id="custom-form" novalidate>
        <h2>Criar alimento</h2>
        <p class="muted small">Use os dados do rótulo, sempre por 100 g ou 100 ml.</p>
        <div class="field"><label for="c-name">Nome</label><input id="c-name" name="name" required maxlength="60"></div>
        <div class="grid-2">
          <div class="field"><label for="c-kcal">Calorias (kcal)</label><input id="c-kcal" name="kcal" inputmode="decimal" required></div>
          <div class="field"><label for="c-p">Proteína (g)</label><input id="c-p" name="protein" inputmode="decimal" required></div>
          <div class="field"><label for="c-c">Carboidrato (g)</label><input id="c-c" name="carbs" inputmode="decimal" required></div>
          <div class="field"><label for="c-f">Gordura (g)</label><input id="c-f" name="fat" inputmode="decimal" required></div>
          <div class="field"><label for="c-portion">Porção</label><input id="c-portion" name="portion" placeholder="unidade" maxlength="30"></div>
          <div class="field"><label for="c-pg">Gramas da porção</label><input id="c-pg" name="portionG" inputmode="decimal" placeholder="100"></div>
        </div>
        <div class="grid-2">
          <button type="button" id="c-cancel">Cancelar</button>
          <button type="submit" class="btn-primary">Salvar</button>
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
        portion: String(fd.get('portion') || '').trim() || 'porção',
        portionG: num(fd.get('portionG')) || 100,
      };
      if (!food.name) return toast('Informe o nome.');
      if (![food.kcal, food.protein, food.carbs, food.fat].every((v) => v >= 0 && v <= 900)) {
        return toast('Preencha calorias e macronutrientes com números válidos.');
      }
      const saved = addCustomFood(food);
      custom.close();
      toast('Alimento criado');
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
