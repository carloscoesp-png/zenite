// Campos do perfil, usados no cadastro e na edição do perfil.
import { ACTIVITY, GOALS, ageFrom } from '../calc.js';
import { FOCUS } from '../journey.js';
import { t } from '../i18n.js';
import { esc, num } from '../ui.js';

export function profileFields(p = {}) {
  const radio = (name, ids, current) =>
    ids.map((id) => `
      <label class="choice">
        <input type="radio" name="${name}" value="${id}" ${id === current ? 'checked' : ''} required>
        <span>${esc(t(`${name}.${id}`))}<small>${esc(t(`${name}.${id}.desc`))}</small></span>
      </label>`).join('');

  return `
    <div class="field">
      <label for="f-name">${t('pf.name')}</label>
      <input id="f-name" name="name" autocomplete="given-name" value="${esc(p.name)}" required maxlength="40">
    </div>
    <div class="grid-2">
      <div class="field">
        <label for="f-sex">${t('pf.sex')}</label>
        <select id="f-sex" name="sex" required>
          <option value="" disabled ${p.sex ? '' : 'selected'}>${t('pf.choose')}</option>
          <option value="f" ${p.sex === 'f' ? 'selected' : ''}>${t('pf.female')}</option>
          <option value="m" ${p.sex === 'm' ? 'selected' : ''}>${t('pf.male')}</option>
        </select>
      </div>
      <div class="field">
        <label for="f-birth">${t('pf.birth')}</label>
        <input id="f-birth" name="birthDate" type="date" value="${esc(p.birthDate)}" required>
      </div>
    </div>
    <p class="hint" style="margin-top:-8px">${t('pf.sexHint')}</p>
    <div class="grid-2">
      <div class="field">
        <label for="f-height">${t('pf.height')}</label>
        <input id="f-height" name="heightCm" inputmode="numeric" value="${esc(p.heightCm)}" required placeholder="170">
      </div>
      <div class="field">
        <label for="f-weight">${t('pf.weight')}</label>
        <input id="f-weight" name="weightKg" inputmode="decimal" value="${esc(p.weightKg)}" required placeholder="70,5">
      </div>
    </div>
    <div class="grid-2">
      <div class="field">
        <label for="f-fat">${t('pf.fat')}</label>
        <input id="f-fat" name="bodyFat" inputmode="decimal" value="${esc(p.bodyFat ?? '')}" placeholder="—">
      </div>
      <div class="field">
        <label for="f-target">${t('pf.targetWeight')}</label>
        <input id="f-target" name="targetWeightKg" inputmode="decimal" value="${esc(p.targetWeightKg ?? '')}" placeholder="—">
      </div>
    </div>
    <div class="field">
      <label>${t('pf.activity')}</label>
      <div class="choices">${radio('activity', ACTIVITY.map((a) => a.id), p.activity)}</div>
    </div>
    <div class="field">
      <label>${t('pf.goal')}</label>
      <div class="choices">${radio('goal', GOALS, p.goal)}</div>
    </div>`;
}

// Áreas para desenvolver (cada uma vira uma missão diária).
export function focusFields(selected = FOCUS) {
  return `
    <div class="field">
      <label>${t('focus.title')}</label>
      <p class="hint" style="margin:0 0 8px">${t('focus.help')}</p>
      <div class="choices">
        ${FOCUS.map((a) => `
          <label class="choice">
            <input type="checkbox" name="focus" value="${a}" ${selected.includes(a) ? 'checked' : ''}>
            <span>${t(`attr.${a}`)}<small>${t(`mission.${a}`)}</small></span>
          </label>`).join('')}
      </div>
    </div>`;
}

export const readFocus = (form) => new FormData(form).getAll('focus').filter((a) => FOCUS.includes(a));

// Lê e valida o formulário. Retorna { profile } ou { error } (texto já traduzido).
export function readProfile(form) {
  const fd = new FormData(form);
  const profile = {
    name: String(fd.get('name') || '').trim(),
    sex: fd.get('sex'),
    birthDate: fd.get('birthDate'),
    heightCm: num(fd.get('heightCm')),
    weightKg: num(fd.get('weightKg')),
    bodyFat: num(fd.get('bodyFat')),
    targetWeightKg: num(fd.get('targetWeightKg')),
    activity: fd.get('activity'),
    goal: fd.get('goal'),
  };
  const fail = (key) => ({ error: t(key) });
  if (!profile.name) return fail('err.name');
  if (!profile.sex) return fail('err.sex');
  if (!profile.birthDate) return fail('err.birth');
  const age = ageFrom(profile.birthDate);
  if (!(age >= 14 && age <= 100)) return fail('err.age');
  if (!(profile.heightCm >= 100 && profile.heightCm <= 250)) return fail('err.height');
  if (!(profile.weightKg >= 30 && profile.weightKg <= 350)) return fail('err.weight');
  if (Number.isFinite(profile.bodyFat) && !(profile.bodyFat >= 3 && profile.bodyFat <= 70)) return fail('err.fat');
  if (Number.isFinite(profile.targetWeightKg) && !(profile.targetWeightKg >= 30 && profile.targetWeightKg <= 350)) {
    return fail('err.targetWeight');
  }
  if (!profile.activity) return fail('err.activity');
  if (!profile.goal) return fail('err.goal');
  if (!Number.isFinite(profile.bodyFat)) profile.bodyFat = null;
  if (!Number.isFinite(profile.targetWeightKg)) profile.targetWeightKg = null;
  return { profile };
}
