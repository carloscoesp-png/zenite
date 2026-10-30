// Cálculos de metas e do status "dieta cumprida" do dia.
// Os textos (nomes, descrições, status) ficam em i18n.js.

export const ACTIVITY = [
  { id: 'sedentario', factor: 1.2 },
  { id: 'leve', factor: 1.375 },
  { id: 'moderado', factor: 1.55 },
  { id: 'intenso', factor: 1.725 },
  { id: 'atleta', factor: 1.9 },
];

export const GOALS = ['perder', 'manter', 'ganhar'];

export const NEUTRAL_REASONS = ['descanso', 'doenca', 'lesao'];

// Margem para considerar a dieta cumprida: calorias dentro de ±10% da meta.
export const DIET_TOLERANCE = 0.1;

export function ageFrom(birthDate, today = new Date()) {
  const [y, m, d] = birthDate.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}

// Taxa metabólica basal (Mifflin-St Jeor).
export function bmr({ sex, weightKg, heightCm, birthDate }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageFrom(birthDate);
  return sex === 'm' ? base + 5 : base - 161;
}

export function tdee(profile) {
  const activity = ACTIVITY.find((a) => a.id === profile.activity) || ACTIVITY[0];
  return bmr(profile) * activity.factor;
}

const PROTEIN_PER_KG = { perder: 2.0, manter: 1.6, ganhar: 1.8 };

export function suggestTargets(profile) {
  const gasto = tdee(profile);
  let kcal = gasto;
  if (profile.goal === 'perder') kcal = Math.max(gasto - 500, profile.sex === 'm' ? 1500 : 1200);
  if (profile.goal === 'ganhar') kcal = gasto + 300;
  kcal = Math.round(kcal / 10) * 10;

  const protein = Math.round(PROTEIN_PER_KG[profile.goal] * profile.weightKg);
  const fat = Math.round((kcal * 0.25) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const waterMl = Math.round((35 * profile.weightKg) / 50) * 50;

  return { kcal, protein, carbs, fat, waterMl };
}

export function bmi(weightKg, heightCm) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

// Chave de tradução da faixa de IMC.
export function bmiCategory(value) {
  if (value < 18.5) return 'bmi.under';
  if (value < 25) return 'bmi.normal';
  if (value < 30) return 'bmi.over';
  return 'bmi.obese';
}

export function totals(day) {
  return day.entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function dietRange(targetKcal) {
  return {
    min: Math.round(targetKcal * (1 - DIET_TOLERANCE)),
    max: Math.round(targetKcal * (1 + DIET_TOLERANCE)),
  };
}

// Status da dieta no dia. Ausência de registro nunca é tratada como falha.
// code: cumprida | andamento | acima | fora | sem-registro | neutro
// key:  chave de tradução do texto ("status.<...>")
export function dayStatus(day, date, today) {
  const st = (code, key, cls) => ({ code, key: `status.${key}`, cls });
  if (day.neutral) return st('neutro', 'neutro', 'neutral');
  if (!day.entries.length || !day.targets) {
    return date === today ? st('andamento', 'vazio', 'info') : st('sem-registro', 'sem-registro', 'neutral');
  }
  const { kcal } = totals(day);
  const { min, max } = dietRange(day.targets.kcal);
  if (kcal >= min && kcal <= max) return st('cumprida', 'cumprida', 'ok');
  if (date === today) return kcal > max ? st('acima', 'acima', 'bad') : st('andamento', 'andamento', 'info');
  return st('fora', kcal > max ? 'acima' : 'abaixo', 'bad');
}
