// Perfil: idioma, metas diárias, dados pessoais e cópia de segurança.
import { getState, setProfile, setTargets, replaceState, resetAll, setLang } from '../store.js';
import { suggestTargets, tdee } from '../calc.js';
import { t, langFlags } from '../i18n.js';
import { esc, n0, num, dateKey, refresh, toast } from '../ui.js';
import { profileFields, readProfile } from './profile-form.js';

const VERSION = '0.4';

export function render(root) {
  const s = getState();
  const targets = s.targets;
  const suggested = suggestTargets(s.profile);

  const targetField = (name, label, value, unit) => `
    <div class="field">
      <label for="t-${name}">${label} (${unit})</label>
      <input id="t-${name}" name="${name}" inputmode="numeric" value="${esc(value)}" required>
    </div>`;

  root.innerHTML = `
    <div class="page-head">
      <h1>${esc(t('prof.hello', { name: s.profile.name }))}</h1>
      ${langFlags()}
    </div>

    <section class="card">
      <h2>${t('prof.targets')}</h2>
      <p class="muted small">${t('prof.tdee', { tdee: n0(tdee(s.profile)), kcal: n0(suggested.kcal) })}</p>
      <form id="targets-form" novalidate>
        <div class="grid-2">
          ${targetField('kcal', t('prof.kcal'), targets.kcal, 'kcal')}
          ${targetField('waterMl', t('prof.water'), targets.waterMl, 'ml')}
          ${targetField('protein', t('macro.protein'), targets.protein, 'g')}
          ${targetField('carbs', t('macro.carbs'), targets.carbs, 'g')}
          ${targetField('fat', t('macro.fat'), targets.fat, 'g')}
        </div>
        <div class="grid-2">
          <button type="button" id="suggest">${t('prof.useSuggestion')}</button>
          <button type="submit" class="btn-primary">${t('prof.saveTargets')}</button>
        </div>
      </form>
    </section>

    <details class="card">
      <summary><b>${t('prof.myData')}</b></summary>
      <form id="profile-form" novalidate style="margin-top:16px">
        ${profileFields(s.profile)}
        <label class="choice" style="margin-bottom:16px">
          <input type="checkbox" name="recalc" checked>
          <span>${t('prof.recalc')}</span>
        </label>
        <button type="submit" class="btn-primary btn-block">${t('prof.saveData')}</button>
      </form>
    </details>

    <section class="card">
      <h2>${t('prof.yourData')}</h2>
      <p class="muted small">${t('prof.dataHelp')}</p>
      <div class="grid-2">
        <button id="export">${t('prof.export')}</button>
        <label class="btn" style="margin:0; color: var(--text)">${t('prof.import')}<input id="import" type="file" accept="application/json" hidden></label>
      </div>
      <button id="reset" class="btn-ghost btn-danger btn-block" style="margin-top:12px">${t('prof.reset')}</button>
    </section>

    <p class="muted small" style="text-align:center">${t('prof.version', { v: VERSION })}</p>`;

  root.querySelector('.flags').addEventListener('click', (ev) => {
    const flag = ev.target.closest('[data-lang]');
    if (!flag) return;
    setLang(flag.dataset.lang);
    refresh();
  });

  const targetsForm = root.querySelector('#targets-form');
  root.querySelector('#suggest').addEventListener('click', () => {
    for (const [k, v] of Object.entries(suggested)) targetsForm.elements[k].value = v;
  });

  targetsForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(targetsForm);
    const next = Object.fromEntries(['kcal', 'protein', 'carbs', 'fat', 'waterMl'].map((k) => [k, Math.round(num(fd.get(k)))]));
    if (!(next.kcal >= 800 && next.kcal <= 6000)) return toast(t('prof.errKcal'));
    if (![next.protein, next.carbs, next.fat].every((v) => v >= 0 && v <= 1000)) return toast(t('prof.errMacros'));
    if (!(next.waterMl >= 500 && next.waterMl <= 8000)) return toast(t('prof.errWater'));
    setTargets(next, dateKey());
    toast(t('prof.targetsSaved'));
    refresh();
  });

  root.querySelector('#profile-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const { profile, error } = readProfile(form);
    if (error) return toast(error);
    setProfile(profile);
    if (form.recalc.checked) setTargets(suggestTargets({ ...s.profile, ...profile }), dateKey());
    toast(t('prof.dataSaved'));
    refresh();
  });

  root.querySelector('#export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `zenite-${dateKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  root.querySelector('#import').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!confirm(t('prof.confirmImport'))) return;
      replaceState(data);
      toast(t('prof.imported'));
      refresh();
    } catch {
      toast(t('prof.invalid'));
    }
  });

  root.querySelector('#reset').addEventListener('click', () => {
    if (!confirm(t('prof.confirmReset'))) return;
    resetAll();
    location.hash = '#/cadastro';
  });
}
