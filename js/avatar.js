// Foto de perfil redonda com anel na cor da Divisão; o arco claro enche a cada nível do ciclo.
// A foto fica só no aparelho, reduzida para 256 × 256 px (JPEG), dentro do perfil.
import { DIVISION_COLORS, RULES } from './journey.js';
import { esc } from './ui.js';

const SIZE = 256;

export function avatar({ photo, name, division, level, size = 72 }) {
  const [light, dark] = DIVISION_COLORS[division];
  const r = 46;
  const c = 2 * Math.PI * r;
  const pct = Math.min(level / RULES.maxLevel, 1);
  const initial = esc((name || '?').trim().charAt(0).toUpperCase());
  return `
    <span class="avatar" style="width:${size}px; height:${size}px">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="${dark}" stroke-width="6"/>
        ${pct > 0 ? `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${light}" stroke-width="6" stroke-linecap="round"
          stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)"/>` : ''}
      </svg>
      ${photo
        ? `<img src="${photo}" alt="">`
        : `<span class="avatar-initial" style="color:${light}">${initial}</span>`}
    </span>`;
}

// Lê a imagem escolhida, recorta o centro em quadrado e reduz para 256 px.
export async function photoFromFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    canvas.getContext('2d').drawImage(
      img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE,
    );
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
