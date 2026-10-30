// Jornada: Divisão, nível do ciclo, XP, atributos, últimos 30 dias e renascimento.
import { getState, getDay, rebirth } from '../store.js';
import { computeJourney, ATTRS, RULES, DIVISION_COLORS } from '../journey.js';
import { t } from '../i18n.js';
import { esc, n0, dateKey, addDays, parseKey, formatDate, progressBar, animateIn, refresh, toast } from '../ui.js';

// Emblema da Divisão: escudo com degradê na cor da Divisão e estrela no centro.
// Na Lenda, cada renascimento extra vira uma estrela embaixo do escudo.
function emblem(division, stars) {
  const [light, dark] = DIVISION_COLORS[division];
  const id = `em-${division}`;
  const extra = Math.min(stars, 5);
  const starPath = (cx, cy, r) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
    });
    return `<polygon points="${pts.join(' ')}"/>`;
  };
  return `
    <svg class="emblem" style="--emblem-glow:${light}99" viewBox="0 0 96 108" role="img" aria-label="${esc(t('journey.division', { name: t(`division.${division}`) }))}">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/>
        </linearGradient>
      </defs>
      <path d="M48 4 L86 16 V48 C86 72 70 88 48 98 C26 88 10 72 10 48 V16 Z" fill="url(#${id})" stroke="#0a0a0b" stroke-width="2"/>
      <path d="M48 12 L78 21.5 V48 C78 67 66 80 48 89 C30 80 18 67 18 48 V21.5 Z" fill="none" stroke="#0a0a0b" stroke-opacity=".35" stroke-width="2"/>
      <g fill="#0a0a0b" fill-opacity=".75">${starPath(48, 50, 17)}</g>
      ${extra ? `<g fill="${light}">${Array.from({ length: extra }, (_, i) => starPath(48 + (i - (extra - 1) / 2) * 13, 103, 5)).join('')}</g>` : ''}
    </svg>`;
}

// Barra de atributo de -8 a 20 com marca no zero.
function attrBar(value) {
  const span = RULES.attrMax - RULES.attrMin;
  const zero = (-RULES.attrMin / span) * 100;
  const pos = ((value - RULES.attrMin) / span) * 100;
  const left = Math.min(zero, pos);
  const width = Math.abs(pos - zero);
  const color = value < 0 ? 'var(--bad)' : 'var(--gold-gradient)';
  return `<div class="attr-bar"><span style="left:${left}%; width:${width}%; background:${color}"></span><i class="zero" style="left:${zero}%"></i></div>`;
}

export function render(root) {
  const today = dateKey();
  const s = getState();
  const j = computeJourney(s, getDay, today);
  const divisionName = t(`division.${j.division}`);
  const nextLabel = j.next.stars > j.stars && j.division === 'lenda'
    ? t('journey.nextStar')
    : t('journey.next', { name: t(`division.${j.next.division}`) });

  const days30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const firstWeekday = (parseKey(days30[0]).getDay() + 6) % 7;

  root.innerHTML = `
    <h1>${t('journey.title')}</h1>

    <section class="card">
      <div class="hero">
        ${emblem(j.division, j.stars)}
        <div class="grow">
          <p class="division" style="color:${DIVISION_COLORS[j.division][0]}">${t('journey.division', { name: divisionName })}${j.stars ? ` ${'★'.repeat(Math.min(j.stars, 5))}` : ''}</p>
          <p class="level">${t('journey.level', { n: j.level })}</p>
          <p class="muted small" style="margin:0">${t('journey.levelOf', { n: j.level, max: RULES.maxLevel })} · ${t('journey.xp', { n: n0(j.xp) })}</p>
        </div>
      </div>
      <div style="margin-top:12px">${progressBar(j.level, RULES.maxLevel, 'var(--gold-gradient)', 0)}</div>
      <p class="muted small" style="margin:8px 0 0">${t('journey.levelHint')} ${esc(nextLabel)}.</p>
      <p class="hint">${t('journey.cycleStart', { date: formatDate(j.start, { day: 'numeric', month: 'long', year: 'numeric' }) })}${j.rebirths ? ` · ${t('journey.rebirths', { n: j.rebirths })}` : ''}</p>
    </section>

    ${j.canRebirth ? `
      <section class="card" style="border-color:var(--accent)">
        <h2>${t('journey.rebirthTitle')}</h2>
        <p class="muted small">${t('journey.rebirthHelp')}</p>
        <button id="rebirth" class="btn-primary btn-block">${t('journey.rebirth')} → ${esc(nextLabel.replace(/^[^:]*:\s*/, ''))}</button>
      </section>` : ''}

    <section class="card">
      <h2>${t('journey.attributes')}</h2>
      <p class="muted small" style="margin:0">${t('journey.attrHint')}</p>
      ${ATTRS.map((a) => {
        const at = j.attributes[a];
        return `
          <div class="attr ${at.focused ? '' : 'off'}">
            <div class="row between">
              <span><b>${t(`attr.${a}`)}</b> <span class="muted small">· ${at.focused ? t(`attr.${a}.desc`) : t('journey.offFocus')}</span></span>
              <b style="color:var(--accent-2)">${at.value}</b>
            </div>
            ${attrBar(at.value + at.toNext / RULES.pointsPerAttr)}
            ${at.focused && at.value >= 0 && at.value < RULES.attrMax ? `<div class="hint" style="margin-top:4px">${t('journey.toNext', { n: at.toNext })}</div>` : ''}
          </div>`;
      }).join('')}
    </section>

    <section class="card">
      <h2>${t('journey.days30')}</h2>
      <div class="calendar">
        ${t('prog.weekdays').split(',').map((d) => `<div class="muted small" style="text-align:center">${d}</div>`).join('')}
        ${'<div></div>'.repeat(firstWeekday)}
        ${days30.map((d) => {
          const r = j.history[d];
          const cls = r?.validated ? 'gold' : r?.neutral ? 'neutral' : '';
          return `<a class="day ${cls} ${d === today ? 'today' : ''}" href="#/hoje?d=${d}" style="text-decoration:none">${parseKey(d).getDate()}</a>`;
        }).join('')}
      </div>
      <div class="legend"><span class="gold">${t('journey.legendValidated')}</span><span>${t('journey.legendOther')}</span></div>
    </section>

    <p class="muted small" style="text-align:center">${t('journey.ranking')}</p>`;

  animateIn(root);

  root.querySelector('#rebirth')?.addEventListener('click', () => {
    if (!confirm(t('journey.confirmRebirth'))) return;
    rebirth({ start: j.start, end: today, level: j.level, xp: j.xp, division: j.division }, addDays(today, 1));
    toast(t('journey.reborn', { name: t(`division.${computeJourney(getState(), getDay, today).division}`) }));
    refresh();
  });
}
