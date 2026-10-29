// Campos do perfil, usados no cadastro e na edição do perfil.
import { ACTIVITY, GOALS, ageFrom } from '../calc.js';
import { esc, num } from '../ui.js';

export function profileFields(p = {}) {
  const radio = (name, items, current) =>
    items.map((it) => `
      <label class="choice">
        <input type="radio" name="${name}" value="${it.id}" ${it.id === current ? 'checked' : ''} required>
        <span>${esc(it.label)}<small>${esc(it.desc)}</small></span>
      </label>`).join('');

  return `
    <div class="field">
      <label for="f-name">Como quer ser chamado?</label>
      <input id="f-name" name="name" autocomplete="given-name" value="${esc(p.name)}" required maxlength="40">
    </div>
    <div class="grid-2">
      <div class="field">
        <label for="f-sex">Sexo biológico</label>
        <select id="f-sex" name="sex" required>
          <option value="" disabled ${p.sex ? '' : 'selected'}>Escolha</option>
          <option value="f" ${p.sex === 'f' ? 'selected' : ''}>Feminino</option>
          <option value="m" ${p.sex === 'm' ? 'selected' : ''}>Masculino</option>
        </select>
      </div>
      <div class="field">
        <label for="f-birth">Data de nascimento</label>
        <input id="f-birth" name="birthDate" type="date" value="${esc(p.birthDate)}" required>
      </div>
    </div>
    <p class="hint" style="margin-top:-8px">O sexo biológico é usado só para estimar o gasto calórico.</p>
    <div class="grid-2">
      <div class="field">
        <label for="f-height">Altura (cm)</label>
        <input id="f-height" name="heightCm" inputmode="numeric" value="${esc(p.heightCm)}" required placeholder="170">
      </div>
      <div class="field">
        <label for="f-weight">Peso atual (kg)</label>
        <input id="f-weight" name="weightKg" inputmode="decimal" value="${esc(p.weightKg)}" required placeholder="70,5">
      </div>
    </div>
    <div class="grid-2">
      <div class="field">
        <label for="f-fat">% de gordura (opcional)</label>
        <input id="f-fat" name="bodyFat" inputmode="decimal" value="${esc(p.bodyFat ?? '')}" placeholder="—">
      </div>
      <div class="field">
        <label for="f-target">Peso desejado (opcional)</label>
        <input id="f-target" name="targetWeightKg" inputmode="decimal" value="${esc(p.targetWeightKg ?? '')}" placeholder="—">
      </div>
    </div>
    <div class="field">
      <label>Nível de atividade</label>
      <div class="choices">${radio('activity', ACTIVITY, p.activity)}</div>
    </div>
    <div class="field">
      <label>Objetivo</label>
      <div class="choices">${radio('goal', GOALS, p.goal)}</div>
    </div>`;
}

// Lê e valida o formulário. Retorna { profile } ou { error }.
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
  if (!profile.name) return { error: 'Informe seu nome.' };
  if (!profile.sex) return { error: 'Escolha o sexo biológico.' };
  if (!profile.birthDate) return { error: 'Informe a data de nascimento.' };
  const age = ageFrom(profile.birthDate);
  if (!(age >= 14 && age <= 100)) return { error: 'O LifeQuest é para pessoas de 14 a 100 anos.' };
  if (!(profile.heightCm >= 100 && profile.heightCm <= 250)) return { error: 'Altura deve estar entre 100 e 250 cm.' };
  if (!(profile.weightKg >= 30 && profile.weightKg <= 350)) return { error: 'Peso deve estar entre 30 e 350 kg.' };
  if (Number.isFinite(profile.bodyFat) && !(profile.bodyFat >= 3 && profile.bodyFat <= 70)) {
    return { error: 'Percentual de gordura deve estar entre 3 e 70%.' };
  }
  if (Number.isFinite(profile.targetWeightKg) && !(profile.targetWeightKg >= 30 && profile.targetWeightKg <= 350)) {
    return { error: 'Peso desejado deve estar entre 30 e 350 kg.' };
  }
  if (!profile.activity) return { error: 'Escolha o nível de atividade.' };
  if (!profile.goal) return { error: 'Escolha o objetivo.' };
  if (!Number.isFinite(profile.bodyFat)) profile.bodyFat = null;
  if (!Number.isFinite(profile.targetWeightKg)) profile.targetWeightKg = null;
  return { profile };
}
