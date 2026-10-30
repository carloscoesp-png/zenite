// Cadastro inicial: idioma, perfil, cálculo das metas e primeiro peso.
import { getState, setProfile, setTargets, addWeight, setLang } from '../store.js';
import { suggestTargets } from '../calc.js';
import { t, langSelect } from '../i18n.js';
import { dateKey, refresh, toast } from '../ui.js';
import { profileFields, readProfile } from './profile-form.js';

export function render(root) {
  if (getState().profile) {
    location.replace('#/hoje');
    return;
  }

  root.innerHTML = `
    <div class="row between" style="align-items:flex-start">
      <div class="brand"><img src="icons/icon-192.png" alt=""><b>Zênite</b></div>
      <div style="width:140px">${langSelect('onb-lang')}</div>
    </div>
    <p class="muted">${t('onb.intro')}</p>
    <form id="onboarding" class="card" novalidate>
      ${profileFields()}
      <label class="choice" style="margin-bottom:16px">
        <input type="checkbox" name="consent" required>
        <span>${t('onb.consent')}<small>${t('onb.consentHint')}</small></span>
      </label>
      <button class="btn-primary btn-block" type="submit">${t('onb.submit')}</button>
    </form>`;

  root.querySelector('[data-lang-select]').addEventListener('change', (ev) => {
    setLang(ev.target.value);
    refresh();
  });

  root.querySelector('#onboarding').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const { profile, error } = readProfile(form);
    if (error) return toast(error);
    if (!form.consent.checked) return toast(t('onb.consentRequired'));

    const today = dateKey();
    setProfile({ ...profile, createdAt: today });
    setTargets(suggestTargets(profile), today);
    addWeight(today, profile.weightKg, profile.bodyFat);
    toast(t('onb.done'));
    location.hash = '#/hoje';
  });
}
