// Banco de alimentos: tabela TACO oficial + uma lista complementar pequena de itens
// comuns que a TACO não traz (valores médios de rótulo) + pratos prontos montados com
// esses ingredientes + os alimentos criados pelo usuário.
import { TACO, TACO_CATEGORIES } from './taco.js';
import { portionFor } from './portions.js';
import { DISHES } from './dishes.js';
import { normalize } from './ui.js';

export const SOURCE_LABEL = {
  taco: 'TACO',
  rotulo: 'Valor médio de rótulo',
  prato: 'Prato montado (soma dos ingredientes)',
  usuario: 'Meu alimento',
};

// Itens fora da TACO. Na TACO o leite fluido está sem análise ("*").
// Formato: [id, nome, categoria, kcal, proteína, carboidrato, gordura, porção, gramas] por 100 g/ml.
const COMPLEMENT = [
  ['leite-integral', 'Leite, de vaca, integral, UHT', 'Leite e derivados', 59, 3.0, 4.5, 3.0, 'copo (200 ml)', 200],
  ['leite-semi', 'Leite, de vaca, semidesnatado, UHT', 'Leite e derivados', 44, 3.0, 4.6, 1.5, 'copo (200 ml)', 200],
  ['leite-desnatado', 'Leite, de vaca, desnatado, UHT', 'Leite e derivados', 34, 3.1, 4.8, 0.2, 'copo (200 ml)', 200],
  ['macarrao-cozido', 'Macarrão, trigo, cozido', 'Cereais e derivados', 158, 5.8, 30.9, 0.9, 'prato raso', 150],
  ['pao-forma', 'Pão, trigo, forma, tradicional', 'Cereais e derivados', 260, 8.5, 48.0, 3.5, 'fatia', 25],
  ['tapioca-goma', 'Tapioca, goma hidratada', 'Cereais e derivados', 240, 0.0, 60.0, 0.0, 'tapioca média', 60],
  ['whey', 'Whey protein, pó', 'Suplementos', 400, 80.0, 8.0, 6.0, 'dose', 30],
  ['refrigerante-zero', 'Refrigerante, zero açúcar', 'Bebidas (alcoólicas e não alcoólicas)', 0, 0, 0, 0, 'lata (350 ml)', 350],
  ['pao-hamburguer', 'Pão de hambúrguer ou de cachorro-quente', 'Cereais e derivados', 280, 9.0, 50.0, 4.5, 'unidade', 50],
  ['salsicha', 'Salsicha', 'Carnes e derivados', 230, 13.0, 4.0, 18.0, 'unidade', 50],
  ['massa-pizza', 'Massa de pizza ou salgado, assada', 'Cereais e derivados', 270, 8.5, 52.0, 3.0, 'disco médio', 250],
];

// Termos extras de busca para nomes da TACO que fogem do jeito comum de falar.
const ALIASES = {
  3: 'branco', 5: 'branco', 463: 'mussarela mucarela', 326: 'moida', 327: 'moida',
  589: 'para', 471: 'coado', 551: 'goma', 410: 'file', 409: 'file', 408: 'file',
};

// Alimentos do dia a dia que sobem nos resultados da busca.
const POPULAR = new Set([
  'taco-1', 'taco-3', 'taco-561', 'taco-567', 'taco-53', 'taco-52', 'taco-140', 'taco-7', 'taco-410', 'taco-396',
  'taco-488', 'taco-490', 'taco-182', 'taco-179', 'taco-222', 'taco-214', 'taco-215', 'taco-226', 'taco-229',
  'taco-235', 'taco-164', 'taco-239', 'taco-163', 'taco-377', 'taco-370', 'taco-346', 'taco-381', 'taco-326',
  'taco-463', 'taco-461', 'taco-468', 'taco-448', 'taco-471', 'taco-91', 'taco-88', 'taco-129', 'taco-157',
  'taco-78', 'taco-110', 'taco-100', 'taco-260', 'taco-261', 'taco-494', 'taco-540', 'taco-538', 'taco-589',
  'taco-558', 'taco-474', 'taco-480', 'taco-317', 'taco-277',
  'rot-leite-integral', 'rot-leite-desnatado', 'rot-macarrao-cozido', 'rot-pao-forma', 'rot-tapioca-goma',
]);

const tacoFoods = TACO.map(([n, name, cat, kcal, protein, carbs, fat]) => ({
  id: `taco-${n}`,
  name,
  category: TACO_CATEGORIES[cat],
  kcal, protein, carbs, fat,
  source: 'taco',
  ...portionFor(normalize(name)),
  search: normalize(`${name} ${ALIASES[n] || ''}`),
}));

const complementFoods = COMPLEMENT.map(([id, name, category, kcal, protein, carbs, fat, portion, portionG]) => ({
  id: `rot-${id}`, name, category, kcal, protein, carbs, fat, portion, portionG,
  source: 'rotulo',
  search: normalize(name),
}));

const baseById = new Map([...tacoFoods, ...complementFoods].map((f) => [f.id, f]));

// Prato pronto: valores por 100 g calculados pela soma dos ingredientes.
function buildDish(d) {
  const items = d.items.map(([id, grams]) => ({ food: baseById.get(id), grams }));
  const missing = items.filter((i) => !i.food);
  if (missing.length) {
    console.warn(`Prato ${d.id}: ingrediente não encontrado`, d.items);
    return null;
  }
  const total = items.reduce((s, i) => s + i.grams, 0);
  const per100 = (key) => Math.round((items.reduce((s, i) => s + i.food[key] * i.grams, 0) / total) * 10) / 10;
  return {
    id: `prato-${d.id}`,
    name: d.name,
    category: 'Pratos e lanches',
    kcal: Math.round(per100('kcal')),
    protein: per100('protein'),
    carbs: per100('carbs'),
    fat: per100('fat'),
    portion: d.portion,
    portionG: total,
    portions: d.extra && [
      { label: `1 ${d.portion}`, grams: total },
      ...d.extra.map(([label, k]) => ({ label, grams: total * k })),
    ],
    ingredients: items.map((i) => ({ name: i.food.name, grams: i.grams })),
    source: 'prato',
    search: normalize(`${d.name} ${d.keywords || ''}`),
  };
}

const dishFoods = DISHES.map(buildDish).filter(Boolean);

export const FOODS = [...tacoFoods, ...complementFoods, ...dishFoods];

const byId = new Map(FOODS.map((f) => [f.id, f]));

export function findFood(id, customFoods = []) {
  return byId.get(id) || customFoods.find((f) => f.id === id) || null;
}

const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o']);
const RAW_STATE = /, crua?s?\b|, cru\b/;
// Categorias que quase sempre se comem preparadas: nelas o item cru desce na lista.
const COOKED_CATEGORIES = new Set([
  'Cereais e derivados', 'Pescados e frutos do mar', 'Carnes e derivados', 'Ovos e derivados', 'Leguminosas e derivados',
]);

// Busca por palavras (todas precisam aparecer), ignorando acentos e preposições.
// Ordena: meus alimentos > do dia a dia > começa com a primeira palavra > preparado antes de cru > nome mais curto.
export function searchFoods(query, customFoods = [], limit = 40) {
  const words = normalize(query).split(/[\s,]+/).filter((w) => w && !STOPWORDS.has(w));
  if (!words.length) return [];
  const wantsRaw = words.some((w) => w.startsWith('cru'));
  const pool = [
    ...customFoods.map((f) => ({ ...f, source: 'usuario', search: normalize(f.name) })),
    ...FOODS,
  ];
  return pool
    .filter((f) => words.every((w) => f.search.includes(w)))
    .map((f) => {
      let score = 0;
      if (f.source === 'usuario') score -= 5;
      if (POPULAR.has(f.id) || f.source === 'prato') score -= 3;
      if (f.search.startsWith(words[0])) score -= 2;
      if (!wantsRaw && COOKED_CATEGORIES.has(f.category) && RAW_STATE.test(f.search)) score += 2;
      const tokens = f.search.split(/[^a-z0-9]+/);
      score -= 2 * words.filter((w) => tokens.includes(w)).length; // palavra inteira vale mais que pedaço
      return { f, score: score + f.name.length / 100 };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((x) => x.f);
}
