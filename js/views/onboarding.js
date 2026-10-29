// Cadastro inicial: coleta o perfil, calcula as metas e registra o primeiro peso.
import { getState, setProfile, setTargets, addWeight } from '../store.js';
import { suggestTargets } from '../calc.js';
import { dateKey, toast } from '../ui.js';
import { profileFields, readProfile } from './profile-form.js';

export function render(root) {
  if (getState().profile) {
    location.replace('#/hoje');
    return;
  }

  root.innerHTML = `
    <div class="brand"><img src="icons/icon-192.png" alt=""><b>LifeQuest</b></div>
    <p class="muted">Conte um pouco sobre você. Com isso o app calcula suas metas diárias de calorias, macronutrientes e água.</p>
    <form id="onboarding" class="card" novalidate>
      ${profileFields()}
      <label class="choice" style="margin-bottom:16px">
        <input type="checkbox" name="consent" required>
        <span>Concordo em registrar meus dados de saúde no LifeQuest.
          <small>Nesta versão tudo fica guardado só neste aparelho. Nada é enviado para servidores.</small></span>
      </label>
      <button class="btn-primary btn-block" type="submit">Calcular minhas metas</button>
    </form>`;

  root.querySelector('#onboarding').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const form = ev.currentTarget;
    const { profile, error } = readProfile(form);
    if (error) return toast(error);
    if (!form.consent.checked) return toast('É preciso concordar para continuar.');

    const today = dateKey();
    setProfile({ ...profile, createdAt: today });
    setTargets(suggestTargets(profile), today);
    addWeight(today, profile.weightKg, profile.bodyFat);
    toast('Metas calculadas. Bem-vindo!');
    location.hash = '#/hoje';
  });
}
