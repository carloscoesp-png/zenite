// Roteador simples por hash: #/hoje, #/adicionar?d=...&m=..., #/jornada, #/progresso, #/perfil, #/cadastro
import { getState } from './store.js';
import { t, lang } from './i18n.js';
import * as onboarding from './views/onboarding.js';
import * as today from './views/today.js';
import * as add from './views/add.js';
import * as progress from './views/progress.js';
import * as profile from './views/profile.js';
import * as journey from './views/journey.js';

const routes = { cadastro: onboarding, hoje: today, adicionar: add, jornada: journey, progresso: progress, perfil: profile };
const FULLSCREEN = new Set(['cadastro', 'adicionar']);

function parseHash() {
  const [path, query] = location.hash.replace(/^#\/?/, '').split('?');
  return { name: path || 'hoje', params: Object.fromEntries(new URLSearchParams(query || '')) };
}

function render({ resetScroll }) {
  let { name, params } = parseHash();
  if (!getState().profile && name !== 'cadastro') {
    location.replace('#/cadastro');
    return;
  }
  if (!routes[name]) name = 'hoje';

  // Um contêiner novo a cada renderização, para não acumular listeners.
  const root = document.createElement('div');
  document.getElementById('app').replaceChildren(root);
  routes[name].render(root, params);

  document.documentElement.lang = lang();
  const tabbar = document.getElementById('tabbar');
  tabbar.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  tabbar.hidden = FULLSCREEN.has(name);
  tabbar.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
  if (resetScroll) window.scrollTo(0, 0);
}

window.addEventListener('hashchange', () => render({ resetScroll: true }));
window.addEventListener('lq:refresh', () => render({ resetScroll: false }));
render({ resetScroll: true });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker não registrado', e));
}
