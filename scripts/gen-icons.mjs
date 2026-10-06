// Builds public/icons/icon.svg (a purple notebook page with the fluffy mascot) and renders icon-192.png / icon-512.png.
// Rendering uses macOS `sips` (SVG -> PNG), no extra dependencies. Usage: node scripts/gen-icons.mjs
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const dir = fileURLToPath(new URL('../public/icons/', import.meta.url));
mkdirSync(dir, { recursive: true });

function fluff(cx, cy, rx, ry, n) {
  const pts = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
  const r = (Math.PI * 2 * Math.max(rx, ry)) / n / 1.7;
  return pts.map((p, i) => { const q = pts[(i + 1) % n]; return `${i ? '' : `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${q[0].toFixed(1)} ${q[1].toFixed(1)}`; }).join('') + 'Z';
}
const lines = [150, 210, 270, 330, 390].map(y => `<path d="M64 ${y} H448" />`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#7a4fc7"/>
  <rect x="56" y="56" width="400" height="400" rx="34" fill="#fffdf7"/>
  <g stroke="#bcd3ea" stroke-width="5" fill="none">${lines}</g>
  <path d="M104 56 V456" stroke="#f2a6b5" stroke-width="6"/>
  <ellipse cx="270" cy="415" rx="96" ry="14" fill="#3b3548" opacity=".12"/>
  <path d="${fluff(270, 285, 118, 108, 14)}" fill="#e5d8fa" stroke="#3b3548" stroke-width="9" stroke-linejoin="round"/>
  <path d="${fluff(190, 160, 34, 38, 8)}" fill="#e5d8fa" stroke="#3b3548" stroke-width="9" stroke-linejoin="round"/>
  <path d="${fluff(350, 160, 34, 38, 8)}" fill="#e5d8fa" stroke="#3b3548" stroke-width="9" stroke-linejoin="round"/>
  <circle cx="226" cy="278" r="13" fill="#3b3548"/><circle cx="314" cy="278" r="13" fill="#3b3548"/>
  <circle cx="231" cy="273" r="4" fill="#fff"/><circle cx="319" cy="273" r="4" fill="#fff"/>
  <path d="M244 318 Q270 342 296 318" stroke="#3b3548" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="200" cy="312" rx="16" ry="10" fill="#f4a6c4" opacity=".7"/><ellipse cx="340" cy="312" rx="16" ry="10" fill="#f4a6c4" opacity=".7"/>
  <g transform="rotate(38 410 360)"><rect x="396" y="290" width="28" height="120" rx="4" fill="#129486" stroke="#3b3548" stroke-width="6"/><path d="M396 410 L410 440 L424 410Z" fill="#f6d9a8" stroke="#3b3548" stroke-width="6" stroke-linejoin="round"/></g>
</svg>`;
writeFileSync(dir + 'icon.svg', svg);
for (const size of [192, 512]) {
  const out = `${dir}icon-${size}.png`;
  if (existsSync(out)) unlinkSync(out);
  execFileSync('sips', ['-s', 'format', 'png', '-z', String(size), String(size), dir + 'icon.svg', '--out', out], { stdio: 'ignore' });
}
console.log('icons: icon.svg, icon-192.png, icon-512.png');
