import * as THREE from 'three';

// Procedural canvas textures -> no external image dependencies.
const cache = new Map();

function canvasTex(key, size, draw, repeat = [1, 1]) {
  const ck = key + repeat.join('x');
  if (cache.has(ck)) return cache.get(ck);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(ck, t);
  return t;
}

function grime(g, s, n = 300, alpha = 0.08, col = '0,0,0') {
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(${col},${Math.random() * alpha})`;
    const r = Math.random() * s * 0.08;
    g.beginPath(); g.arc(Math.random() * s, Math.random() * s, r, 0, Math.PI * 2); g.fill();
  }
}
function speckle(g, s, n = 4000, a = 0.06) {
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * a})`; g.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5); }
}

export const Tex = {
  tiles: (base = '#4c5a55', line = '#2a3330', rep = [6, 6]) => canvasTex('tiles' + base, 256, (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    const n = 4, w = s / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = (Math.random() - 0.5) * 18;
      g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`;
      g.fillRect(x * w, y * w, w, w);
    }
    g.strokeStyle = line; g.lineWidth = 3;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * w, 0); g.lineTo(i * w, s); g.stroke(); g.beginPath(); g.moveTo(0, i * w); g.lineTo(s, i * w); g.stroke(); }
    grime(g, s, 120, 0.1); speckle(g, s);
  }, rep),
  wall: (base = '#3d4c47', rep = [4, 1]) => canvasTex('wall' + base, 256, (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    // lower dado band
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, s * 0.62, s, s * 0.38);
    g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, s * 0.6, s, 6);
    grime(g, s, 160, 0.06);
    // drips
    for (let i = 0; i < 14; i++) { const x = Math.random() * s; const grd = g.createLinearGradient(0, 0, 0, s); grd.addColorStop(0, 'rgba(0,0,0,0.15)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = grd; g.fillRect(x, 0, 2 + Math.random() * 3, s * Math.random()); }
    speckle(g, s, 3000);
  }, rep),
  wood: (base = '#4a3526', rep = [1, 1]) => canvasTex('wood' + base, 256, (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.12})`; g.lineWidth = 1 + Math.random() * 2; const y = Math.random() * s; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(s * 0.3, y + 6, s * 0.6, y - 6, s, y + 2); g.stroke(); }
    speckle(g, s, 2000, 0.05);
  }, rep),
  metal: (base = '#56625e', rep = [1, 1]) => canvasTex('metal' + base, 128, (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(0, Math.random() * s, s, 1); }
    grime(g, s, 40, 0.12, '60,40,20'); speckle(g, s, 1000);
  }, rep),
  ceiling: (rep = [4, 4]) => canvasTex('ceil', 256, (g, s) => {
    g.fillStyle = '#5a605b'; g.fillRect(0, 0, s, s);
    speckle(g, s, 9000, 0.12);
    g.strokeStyle = '#2c302d'; g.lineWidth = 4; g.strokeRect(0, 0, s, s);
    grime(g, s, 30, 0.2, '70,55,30');
  }, rep),
  concrete: (rep = [4, 4]) => canvasTex('conc', 256, (g, s) => {
    g.fillStyle = '#3a3d3a'; g.fillRect(0, 0, s, s); speckle(g, s, 12000, 0.1); grime(g, s, 200, 0.12);
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { g.beginPath(); let x = Math.random() * s, y = Math.random() * s; g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (Math.random() - 0.5) * 40; y += (Math.random() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
  }, rep),
  carpet: (base = '#2e3a35', rep = [5, 5]) => canvasTex('carpet' + base, 128, (g, s) => { g.fillStyle = base; g.fillRect(0, 0, s, s); speckle(g, s, 8000, 0.12); grime(g, s, 50, 0.1); }, rep),
  chalkboard: () => canvasTex('chalk', 512, (g, s) => {
    g.fillStyle = '#1d2a25'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(Math.random() * s, Math.random() * s, 80 + Math.random() * 120, 20 + Math.random() * 40); }
  }),
};

export function textTexture(lines, { w = 512, h = 256, bg = '#1d2a25', fg = '#d8e0da', font = '28px "Segoe Print", "Comic Sans MS", cursive', align = 'center', lineH = 40, grimeAmt = 40, padTop } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = fg; g.font = font; g.textAlign = align; g.textBaseline = 'middle';
  const x = align === 'center' ? w / 2 : 20;
  const y0 = padTop ?? (h / 2 - (lines.length - 1) * lineH / 2);
  lines.forEach((l, i) => { g.globalAlpha = 0.85 + Math.random() * 0.15; g.fillText(l, x, y0 + i * lineH); });
  g.globalAlpha = 1;
  if (grimeAmt) grime(g, Math.max(w, h), grimeAmt, 0.1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

const matCache = new Map();
export function mat(key, make) { if (!matCache.has(key)) matCache.set(key, make()); return matCache.get(key); }

export const M = {
  std: (color, opts = {}) => mat('std' + color + JSON.stringify(opts), () => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05, ...opts })),
  wood: (base) => mat('wood' + base, () => new THREE.MeshStandardMaterial({ map: Tex.wood(base), roughness: 0.75 })),
  metal: (base) => mat('metal' + base, () => new THREE.MeshStandardMaterial({ map: Tex.metal(base), roughness: 0.5, metalness: 0.55 })),
  emissive: (color, intensity = 1.6) => new THREE.MeshStandardMaterial({ color: '#111', emissive: color, emissiveIntensity: intensity }),
};
