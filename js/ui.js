// Utilitários de interface: formatação, datas, avisos e gráficos em SVG.

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
export const n0 = (v) => nf0.format(Math.round(v || 0));
export const n1 = (v) => nf1.format(v || 0);

// Aceita "72,5" e "72.5".
export function num(v) {
  const x = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(x) ? x : NaN;
}

export function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// ---------- Datas (sempre no fuso local) ----------

export function dateKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function formatDate(key, opts = { day: 'numeric', month: 'short' }) {
  return parseKey(key).toLocaleDateString('pt-BR', opts).replace('.', '');
}

// ---------- Eventos ----------

export function refresh() {
  window.dispatchEvent(new Event('lq:refresh'));
}

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2400);
}

// ---------- Gráficos ----------

const STATUS_COLOR = { ok: 'var(--accent)', info: 'var(--info)', bad: 'var(--bad)', neutral: 'var(--text-2)' };

export function ring(consumed, target, cls) {
  const r = 50;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  return `
    <svg class="ring" viewBox="0 0 120 120" role="img" aria-label="${n0(consumed)} de ${n0(target)} kcal">
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="10"/>
      ${pct > 0 ? `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${STATUS_COLOR[cls] || STATUS_COLOR.info}" stroke-width="10"
        stroke-linecap="round" stroke-dasharray="${c * pct} ${c}" transform="rotate(-90 60 60)"/>` : ''}
      <text x="60" y="58" text-anchor="middle" font-size="22" font-weight="700">${n0(consumed)}</text>
      <text x="60" y="78" text-anchor="middle" font-size="11" style="fill: var(--text-2)">kcal</text>
    </svg>`;
}

export function progressBar(value, target, color) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return `<div class="bar"><span style="width:${pct}%; background:${color}"></span></div>`;
}

// Linha do peso ao longo do tempo. points: [{date, value}], ordenados por data.
export function lineChart(points, { target, unit = 'kg' } = {}) {
  const W = 340, H = 170, L = 36, R = 12, T = 12, B = 24;
  if (points.length === 0) return '';
  const xs = points.map((p) => parseKey(p.date).getTime());
  const values = points.map((p) => p.value).concat(Number.isFinite(target) ? [target] : []);
  let lo = Math.min(...values), hi = Math.max(...values);
  const pad = Math.max((hi - lo) * 0.15, 0.5);
  lo = Math.floor(lo - pad);
  hi = Math.ceil(hi + pad);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const X = (t) => (x1 === x0 ? L + (W - L - R) / 2 : L + ((t - x0) / (x1 - x0)) * (W - L - R));
  const Y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = [lo, (lo + hi) / 2, hi];
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)} ${Y(p.value).toFixed(1)}`).join(' ');
  return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do peso">
      ${ticks.map((t) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}"/>
        <text class="axis-label" x="${L - 6}" y="${Y(t) + 3}" text-anchor="end">${n1(t)}</text>`).join('')}
      ${Number.isFinite(target) ? `<line class="target" x1="${L}" x2="${W - R}" y1="${Y(target)}" y2="${Y(target)}"/>
        <text class="axis-label" x="${W - R}" y="${Y(target) - 4}" text-anchor="end">meta ${n1(target)} ${unit}</text>` : ''}
      <path class="line" d="${path}"/>
      ${points.map((p, i) => `<circle class="dot" cx="${X(xs[i])}" cy="${Y(p.value)}" r="3"><title>${formatDate(p.date)}: ${n1(p.value)} ${unit}</title></circle>`).join('')}
      <text class="axis-label" x="${L}" y="${H - 6}">${formatDate(points[0].date)}</text>
      ${points.length > 1 ? `<text class="axis-label" x="${W - R}" y="${H - 6}" text-anchor="end">${formatDate(points.at(-1).date)}</text>` : ''}
    </svg>`;
}

// Calorias por dia com a faixa da meta. days: [{date, kcal, min, max, cls}]
export function caloriesChart(days) {
  const W = 340, H = 170, L = 36, R = 8, T = 12, B = 24;
  const hi = Math.max(...days.map((d) => Math.max(d.kcal, d.max || 0)), 500) * 1.1;
  const slot = (W - L - R) / days.length;
  const Y = (v) => T + (1 - v / hi) * (H - T - B);
  const ticks = [0, hi / 2, hi].map((t) => Math.round(t / 100) * 100);
  return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Calorias por dia">
      ${ticks.map((t) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(t)}" y2="${Y(t)}"/>
        <text class="axis-label" x="${L - 6}" y="${Y(t) + 3}" text-anchor="end">${n0(t)}</text>`).join('')}
      ${days.map((d, i) => {
        const x = L + i * slot;
        const band = d.max ? `<rect class="band" x="${x}" width="${slot}" y="${Y(d.max)}" height="${Y(d.min) - Y(d.max)}"/>` : '';
        const bar = d.kcal > 0
          ? `<rect x="${x + slot * 0.2}" width="${slot * 0.6}" y="${Y(d.kcal)}" height="${Y(0) - Y(d.kcal)}" rx="2" fill="${STATUS_COLOR[d.cls] || STATUS_COLOR.neutral}"><title>${formatDate(d.date)}: ${n0(d.kcal)} kcal</title></rect>`
          : '';
        return band + bar;
      }).join('')}
      <text class="axis-label" x="${L}" y="${H - 6}">${formatDate(days[0].date)}</text>
      <text class="axis-label" x="${W - R}" y="${H - 6}" text-anchor="end">${formatDate(days.at(-1).date)}</text>
    </svg>`;
}
