// Estado do app, guardado no próprio aparelho (localStorage).
// Cada dia guarda uma cópia das metas vigentes e dos nutrientes de cada item,
// para que o histórico não mude quando metas ou alimentos forem editados depois.

const KEY = 'lifequest:v1';
const SCHEMA_VERSION = 1;

export const MEALS = [
  { id: 'cafe', label: 'Café da manhã' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'lanche', label: 'Lanche' },
  { id: 'jantar', label: 'Jantar' },
  { id: 'ceia', label: 'Ceia' },
];

function emptyState() {
  return {
    version: SCHEMA_VERSION,
    profile: null,
    targets: null,
    days: {},
    weights: [],
    customFoods: [],
    favorites: [],
    recents: [],
  };
}

function emptyDay() {
  return { entries: [], waterMl: 0, neutral: null, targets: null };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Não foi possível ler os dados salvos', e);
  }
  return emptyState();
}

let state = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn('Não foi possível salvar', e);
    return false;
  }
}

export function getState() {
  return state;
}

export function replaceState(next) {
  if (!next || typeof next !== 'object' || !('days' in next)) throw new Error('Arquivo inválido');
  state = { ...emptyState(), ...next };
  save();
}

export function resetAll() {
  state = emptyState();
  save();
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- Perfil e metas ----------

export function setProfile(profile) {
  state.profile = { ...state.profile, ...profile };
  save();
}

export function setTargets(targets, todayKey) {
  state.targets = { ...targets };
  // O dia atual passa a usar as metas novas; dias anteriores mantêm as suas.
  if (todayKey && state.days[todayKey]) state.days[todayKey].targets = { ...targets };
  save();
}

// ---------- Dias ----------

export function getDay(date) {
  const day = state.days[date] || emptyDay();
  return { ...day, targets: day.targets || state.targets };
}

function touchDay(date) {
  if (!state.days[date]) state.days[date] = emptyDay();
  const day = state.days[date];
  if (!day.targets && state.targets) day.targets = { ...state.targets };
  return day;
}

const round1 = (v) => Math.round(v * 10) / 10;

export function nutrientsFor(food, grams) {
  const k = grams / 100;
  return {
    kcal: Math.round(food.kcal * k),
    protein: round1(food.protein * k),
    carbs: round1(food.carbs * k),
    fat: round1(food.fat * k),
  };
}

export function addEntry(date, meal, food, grams) {
  const day = touchDay(date);
  day.entries.push({
    id: uid(),
    meal,
    foodId: food.id,
    name: food.name,
    grams,
    ...nutrientsFor(food, grams),
  });
  state.recents = [food.id, ...state.recents.filter((id) => id !== food.id)].slice(0, 15);
  save();
}

// Troca a quantidade de um item. per100 = valores por 100 g do alimento.
export function updateEntry(date, entryId, grams, per100) {
  const entry = state.days[date]?.entries.find((e) => e.id === entryId);
  if (!entry) return;
  Object.assign(entry, { grams }, nutrientsFor(per100, grams));
  save();
}

// Copia os itens de uma refeição de outro dia (ex.: repetir o café de ontem).
export function copyMeal(fromDate, toDate, meal) {
  const source = state.days[fromDate]?.entries.filter((e) => e.meal === meal) || [];
  if (!source.length) return 0;
  const day = touchDay(toDate);
  day.entries.push(...source.map((e) => ({ ...e, id: uid() })));
  save();
  return source.length;
}

export function removeEntry(date, entryId) {
  const day = state.days[date];
  if (!day) return;
  day.entries = day.entries.filter((e) => e.id !== entryId);
  save();
}

export function addWater(date, ml) {
  const day = touchDay(date);
  day.waterMl = Math.max(0, (day.waterMl || 0) + ml);
  save();
}

export function setNeutral(date, reason) {
  const day = touchDay(date);
  day.neutral = reason || null;
  save();
}

// ---------- Peso ----------

export function addWeight(date, kg, bodyFat) {
  state.weights = state.weights.filter((w) => w.date !== date);
  state.weights.push({ date, kg, bodyFat: Number.isFinite(bodyFat) ? bodyFat : null });
  state.weights.sort((a, b) => a.date.localeCompare(b.date));
  if (state.profile) state.profile.weightKg = state.weights.at(-1).kg;
  save();
}

export function removeWeight(date) {
  state.weights = state.weights.filter((w) => w.date !== date);
  save();
}

// ---------- Alimentos do usuário ----------

export function addCustomFood(food) {
  const item = { ...food, id: 'u-' + uid(), custom: true };
  state.customFoods.push(item);
  save();
  return item;
}

export function toggleFavorite(foodId) {
  const favs = state.favorites;
  state.favorites = favs.includes(foodId) ? favs.filter((id) => id !== foodId) : [foodId, ...favs];
  save();
  return state.favorites.includes(foodId);
}
