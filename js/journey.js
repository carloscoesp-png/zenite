// Jornada (Fase 2): missões, nível por dia validado, atributos, XP e Divisões.
// Tudo é recalculado a partir do histórico de dias, então mudar uma regra aqui
// vale também para os dias passados do ciclo atual.
import { totals, dayStatus } from './calc.js';
import { addDays } from './ui.js';

export const ATTRS = ['forca', 'agilidade', 'constituicao', 'sabedoria', 'carisma'];
// Áreas que o usuário escolhe desenvolver; Constituição está sempre ativa.
export const FOCUS = ['forca', 'agilidade', 'sabedoria', 'carisma'];
export const DIVISIONS = ['bronze', 'prata', 'ouro', 'platina', 'diamante', 'mestre', 'lenda'];
export const DIVISION_COLORS = {
  bronze: ['#e3a46b', '#8c5a2b'],
  prata: ['#eef1f4', '#8e98a3'],
  ouro: ['#f0d77a', '#a8841f'],
  platina: ['#e6f4f1', '#7fa8a3'],
  diamante: ['#bfeaff', '#3a9fd6'],
  mestre: ['#d9b8ff', '#7b3fc4'],
  lenda: ['#ffd38a', '#c2410c'],
};

// Regras de balanceamento (valores iniciais, fáceis de ajustar).
export const RULES = {
  maxLevel: 365, // 1 dia validado = 1 nível; um ciclo ≈ 1 ano
  missionShare: 0.5, // fração mínima de missões cumpridas para validar o dia
  attrMin: -8,
  attrMax: 20,
  pointsPerAttr: 13, // dias ativos para subir 1 ponto de atributo (~260 dias até 20)
  decayDays: 14, // dias usando o app sem atividade na área até perder 1 ponto
  xp: { auto: 10, manual: 20, diet: 30 },
  editableDays: 1, // dá para marcar missões de hoje e de ontem
};

// Missões automáticas: conferidas a partir do que foi registrado no dia.
const AUTO = [
  { id: 'c-meals', check: (day) => ['cafe', 'almoco', 'jantar'].every((m) => day.entries.some((e) => e.meal === m)) },
  { id: 'c-water', check: (day) => !!day.targets && (day.waterMl || 0) >= day.targets.waterMl },
  { id: 'c-protein', check: (day) => !!day.targets && totals(day).protein >= day.targets.protein * 0.9 },
];

export function missionsFor(day, focus) {
  return [
    ...AUTO.map((m) => ({ id: m.id, attr: 'constituicao', auto: true, xp: RULES.xp.auto, done: m.check(day) })),
    ...focus.map((a) => ({ id: a, attr: a, auto: false, xp: RULES.xp.manual, done: !!day.missions?.[a] })),
  ];
}

export function evaluateDay(day, focus, date, today) {
  if (day.neutral) return { neutral: true, missions: [], done: 0, need: 0, diet: false, validated: false, xp: 0, active: {}, logged: false };
  const missions = missionsFor(day, focus);
  const done = missions.filter((m) => m.done).length;
  const need = Math.ceil(missions.length * RULES.missionShare);
  const diet = dayStatus(day, date, today).code === 'cumprida';
  const xp = missions.filter((m) => m.done).reduce((s, m) => s + m.xp, 0) + (diet ? RULES.xp.diet : 0);
  const active = { constituicao: missions.filter((m) => m.auto && m.done).length >= 2 };
  for (const a of focus) active[a] = !!day.missions?.[a];
  const logged = day.entries.length > 0 || done > 0 || (day.waterMl || 0) > 0;
  return { neutral: false, missions, done, need, diet, validated: done >= need && diet, xp, active, logged };
}

export function divisionOf(rebirths) {
  return { division: DIVISIONS[Math.min(rebirths, DIVISIONS.length - 1)], stars: Math.max(0, rebirths - (DIVISIONS.length - 1)) };
}

export function computeJourney(state, getDay, today) {
  const j = state.journey || {};
  const focus = state.profile.focus || FOCUS;
  const start = j.cycleStart || state.profile.createdAt || today;
  const P = RULES.pointsPerAttr;
  const tracked = ['constituicao', ...focus];
  const points = Object.fromEntries(ATTRS.map((a) => [a, 0]));
  const idle = Object.fromEntries(ATTRS.map((a) => [a, 0]));
  const history = {};
  let level = 0;
  let xp = 0;

  for (let d = start; d <= today; d = addDays(d, 1)) {
    const r = evaluateDay(getDay(d), focus, d, today);
    history[d] = r;
    if (r.neutral) continue;
    if (r.validated && level < RULES.maxLevel) level++;
    xp += r.xp;
    if (!r.logged) continue; // sem registro não é falha
    for (const a of tracked) {
      if (r.active[a]) {
        points[a] += 1;
        idle[a] = 0;
      } else if (d < today && ++idle[a] >= RULES.decayDays) {
        points[a] -= P;
        idle[a] = 0;
      }
      points[a] = Math.max(RULES.attrMin * P, Math.min(RULES.attrMax * P, points[a]));
    }
  }

  const attributes = Object.fromEntries(ATTRS.map((a) => {
    const value = Math.max(RULES.attrMin, Math.min(RULES.attrMax, Math.trunc(points[a] / P)));
    const toNext = value >= RULES.attrMax || points[a] < 0 ? 0 : points[a] % P;
    return [a, { value, toNext, focused: tracked.includes(a) }];
  }));

  const rebirths = j.rebirths || 0;
  return {
    start, focus, level, xp, attributes, history,
    today: history[today],
    rebirths,
    ...divisionOf(rebirths),
    next: divisionOf(rebirths + 1),
    canRebirth: level >= RULES.maxLevel,
  };
}
