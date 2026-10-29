// Perfil: dados pessoais, metas diárias e cópia de segurança.
import { getState, setProfile, setTargets, replaceState, resetAll } from '../store.js';
import { suggestTargets, tdee } from '../calc.js';
import { esc, n0, num, dateKey, refresh, toast } from '../ui.js';
import { profileFields, readProfile } from './profile-form.js';

export function render(root) {
  const s = getState();
  const t = s.targets;
  const suggested = suggestTargets(s.profile);

  const targetField = (name, label, value, unit) => `
    <div class="field">
      <label for="t-${name}">${label} (${unit})</label>
      <input id="t-${name}" name="${name}" inputmode="numeric" value="${esc(value)}" required>
    </div>`;

  root.innerHTML = `
    <h1>Olá, ${esc(s.profile.name)}</h1>

    <section class="card">
      <h2>Metas diárias</h2>
      <p class="muted small">Gasto estimado: ${n0(tdee(s.profile))} kcal por dia. Sugestão para o seu objetivo: ${n0(suggested.kcal)} kcal.</p>
      <form id="targets-form" novalidate>
        <div class="grid-2">
          ${targetField('kcal', 'Calorias', t.kcal, 'kcal')}
          ${targetField('waterMl', 'Água', t.waterMl, 'ml')}
          ${targetField('protein', 'Proteína', t.protein, 'g')}
          ${targetField('carbs', 'Carboidratos', t.carbs, 'g')}
          ${targetField('fat', 'Gorduras', t.fat, 'g')}
        </div>
        <div class="grid-2">
          <button type="button" id="suggest">Usar sugestão</button>
          <button type="submit" class="btn-primary">Salvar metas</button>
        </div>
      </form>
    </section>

    <details class="card">
      <summary><b>Meus dados</b></summary>
      <form id="profile-form" novalidate style="margin-top:16px">
        ${profileFields(s.profile)}
        <label class="choice" style="margin-bottom:16px">
          <input type="checkbox" name="recalc" checked>
          <span>Recalcular as metas com os novos dados</span>
        </label>
        <button type="submit" class="btn-primary btn-block">Salvar dados</button>
      </form>
    </details>

    <section class="card">
      <h2>Seus dados</h2>
      <p class="muted small">Tudo fica guardado só neste aparelho. Faça uma cópia de segurança de vez em quando, principalmente antes de trocar de celular ou limpar o navegador.</p>
      <div class="grid-2">
        <button id="export">Exportar cópia</button>
        <label class="btn" style="margin:0; color: var(--text)">Importar cópia<input id="import" type="file" accept="application/json" hidden></label>
      </div>
      <button id="reset" class="btn-ghost btn-danger btn-block" style="margin-top:12px">Apagar todos os dados</button>
    </section>

    <p class="muted small" style="text-align:center">LifeQuest · MVP nutricional · versão 0.1</p>`;

  const targetsForm = root.querySelector('#targets-form');
  root.querySelector('#suggest').addEventListener('click', () => {
    for (const [k, v] of Object.entries(suggested)) targetsForm.elements[k].value = v;
  });

  targetsForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(targetsForm);
    const next = Object.fromEntries(['kcal', 'protein', 'carbs', 'fat', 'waterMl'].map((k) => [k, Math.round(num(fd.get(k)))]));
    if (!(next.kcal >= 800 && next.kcal <= 6000)) return toast('Calorias devem estar entre 800 e 6000.');
    if (![next.protein, next.carbs, next.fat].every((v) => v >= 0 && v <= 1000)) return toast('Revise os macronutrientes.');
    if (!(next.waterMl >= 500 && next.waterMl <= 8000)) return toast('Água deve estar entre 500 e 8000 ml.');
    setTargets(next, dateKey());
    toast('Metas salvas');
    refresh();
  });

  root.querySelector('#profile-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const { profile, error } = readProfile(form);
    if (error) return toast(error);
    setProfile(profile);
    if (form.recalc.checked) setTargets(suggestTargets({ ...s.profile, ...profile }), dateKey());
    toast('Dados salvos');
    refresh();
  });

  root.querySelector('#export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lifequest-${dateKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  root.querySelector('#import').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!confirm('Substituir os dados deste aparelho pela cópia importada?')) return;
      replaceState(data);
      toast('Cópia importada');
      refresh();
    } catch {
      toast('Arquivo inválido');
    }
  });

  root.querySelector('#reset').addEventListener('click', () => {
    if (!confirm('Apagar todos os dados do LifeQuest neste aparelho? Isso não pode ser desfeito.')) return;
    resetAll();
    location.hash = '#/cadastro';
  });
}
