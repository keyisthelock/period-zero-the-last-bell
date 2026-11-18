import * as THREE from 'three';
import { M, textTexture } from './Materials.js';

// Reusable procedural prop builders. All return a THREE.Group whose origin is on the floor.
const box = (w, h, d, material, x = 0, y = 0, z = 0, parent) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent?.add(m); return m;
};
const cyl = (rt, rb, h, material, x = 0, y = 0, z = 0, parent, seg = 12) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent?.add(m); return m;
};
export { box, cyl };

export function desk() {
  const g = new THREE.Group();
  const top = M.wood('#5b4330'), leg = M.metal('#3b4441');
  box(1.1, 0.04, 0.6, top, 0, 0.74, 0, g);
  box(1.05, 0.25, 0.5, M.std('#2f3634'), 0, 0.58, 0.02, g); // book compartment
  for (const [x, z] of [[-0.5, -0.26], [0.5, -0.26], [-0.5, 0.26], [0.5, 0.26]]) box(0.04, 0.72, 0.04, leg, x, 0.36, z, g);
  g.userData.size = [1.1, 0.6];
  return g;
}
export function chair() {
  const g = new THREE.Group();
  const seat = M.wood('#4e3a2a'), leg = M.metal('#3b4441');
  box(0.42, 0.03, 0.42, seat, 0, 0.45, 0, g);
  box(0.42, 0.35, 0.03, seat, 0, 0.72, 0.2, g);
  for (const [x, z] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) box(0.03, 0.45, 0.03, leg, x, 0.225, z, g);
  g.userData.size = [0.45, 0.45];
  return g;
}
export function teacherDesk() {
  const g = new THREE.Group();
  const w = M.wood('#4a3424');
  box(1.8, 0.05, 0.85, w, 0, 0.78, 0, g);
  box(0.5, 0.76, 0.8, w, -0.62, 0.38, 0, g);
  box(0.5, 0.76, 0.8, w, 0.62, 0.38, 0, g);
  box(0.74, 0.5, 0.03, w, 0, 0.5, 0.38, g);
  for (let i = 0; i < 3; i++) box(0.02, 0.02, 0.1, M.metal('#8a8a7a'), -0.62, 0.65 - i * 0.24, -0.42, g);
  g.userData.size = [1.8, 0.85];
  return g;
}
export function lockerRow(n = 6, color = '#3f5550') {
  const g = new THREE.Group();
  const m = M.metal(color), dark = M.std('#141a18');
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.46;
    box(0.44, 1.9, 0.45, m, x, 0.95, 0, g);
    for (let k = 0; k < 4; k++) box(0.25, 0.015, 0.01, dark, x, 1.65 - k * 0.04, 0.228, g);
    box(0.03, 0.12, 0.02, M.metal('#999988'), x + 0.15, 1.1, 0.235, g);
  }
  g.userData.size = [n * 0.46, 0.45];
  return g;
}
export function bookshelf(w = 2, h = 2.4, colors = ['#4a2a22', '#2a3a44', '#3a3a24', '#2e2420', '#45382a']) {
  const g = new THREE.Group();
  const wm = M.wood('#3a2a1e');
  box(w, h, 0.05, wm, 0, h / 2, -0.17, g);
  box(0.05, h, 0.4, wm, -w / 2, h / 2, 0, g); box(0.05, h, 0.4, wm, w / 2, h / 2, 0, g);
  const shelves = 5;
  for (let s = 0; s <= shelves; s++) box(w, 0.04, 0.4, wm, 0, 0.05 + s * (h - 0.1) / shelves, 0, g);
  // books via instancing
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const count = shelves * Math.floor(w / 0.05);
  const inst = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), count);
  const mtx = new THREE.Matrix4(), col = new THREE.Color();
  let idx = 0;
  for (let s = 0; s < shelves; s++) {
    let x = -w / 2 + 0.05;
    const y0 = 0.07 + s * (h - 0.1) / shelves;
    while (x < w / 2 - 0.08 && idx < count) {
      const bw = 0.03 + Math.random() * 0.04, bh = 0.25 + Math.random() * 0.13;
      if (Math.random() < 0.08) { x += bw * 2; continue; }
      mtx.compose(new THREE.Vector3(x + bw / 2, y0 + bh / 2, 0.02), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.random() < 0.05 ? 0.2 : 0)), new THREE.Vector3(bw, bh, 0.26 + Math.random() * 0.06));
      inst.setMatrixAt(idx, mtx); inst.setColorAt(idx, col.set(colors[Math.floor(Math.random() * colors.length)]).multiplyScalar(0.6 + Math.random() * 0.5));
      idx++; x += bw + 0.004;
    }
  }
  inst.count = idx; inst.castShadow = true; inst.receiveShadow = true;
  g.add(inst);
  g.userData.size = [w, 0.42];
  return g;
}
export function labBench(w = 2.4) {
  const g = new THREE.Group();
  box(w, 0.06, 0.9, M.std('#1c2321', { roughness: 0.35 }), 0, 0.92, 0, g);
  box(w - 0.1, 0.86, 0.8, M.std('#384843'), 0, 0.45, 0, g);
  for (let i = 0; i < 3; i++) box(w / 3 - 0.1, 0.02, 0.01, M.metal('#888'), (i - 1) * w / 3, 0.7, 0.41, g);
  // gas taps
  for (let i = -1; i <= 1; i += 2) { cyl(0.015, 0.015, 0.25, M.metal('#999'), i * w * 0.3, 1.07, 0, g); box(0.12, 0.02, 0.02, M.metal('#999'), i * w * 0.3 + 0.05, 1.18, 0, g); }
  g.userData.size = [w, 0.9];
  return g;
}
export function flask(color = '#3c6a5a') {
  const g = new THREE.Group();
  const glass = M.std('#9fb8b0', { transparent: true, opacity: 0.35, roughness: 0.1 });
  cyl(0.02, 0.08, 0.16, glass, 0, 0.08, 0, g);
  cyl(0.02, 0.02, 0.1, glass, 0, 0.2, 0, g);
  cyl(0.015, 0.07, 0.08, M.std(color, { emissive: color, emissiveIntensity: 0.25 }), 0, 0.04, 0, g);
  return g;
}
export function fumeHood() {
  const g = new THREE.Group();
  const body = M.std('#3c4a46');
  box(1.6, 0.9, 0.8, body, 0, 0.45, 0, g);
  box(1.6, 0.05, 0.8, M.std('#151a19'), 0, 0.92, 0, g);
  box(0.05, 1.2, 0.8, body, -0.78, 1.5, 0, g); box(0.05, 1.2, 0.8, body, 0.78, 1.5, 0, g);
  box(1.6, 0.4, 0.8, body, 0, 2.3, 0, g);
  box(1.6, 1.2, 0.05, body, 0, 1.5, -0.38, g);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), M.std('#8fa8a0', { transparent: true, opacity: 0.18, roughness: 0.05, side: THREE.DoubleSide }));
  glass.position.set(0, 1.55, 0.38); g.add(glass); g.userData.glass = glass;
  g.userData.size = [1.6, 0.8];
  return g;
}
export function filingCabinet(labels = ['', '', '', '']) {
  const g = new THREE.Group();
  const m = M.metal('#4a5450');
  box(0.5, 1.35, 0.65, m, 0, 0.675, 0, g);
  labels.forEach((l, i) => {
    const y = 1.17 - i * 0.32;
    box(0.44, 0.28, 0.02, M.metal('#56605c'), 0, y, 0.33, g);
    box(0.12, 0.025, 0.03, M.metal('#999988'), 0, y - 0.06, 0.345, g);
    if (l) {
      const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.06), new THREE.MeshStandardMaterial({ map: textTexture([l], { w: 128, h: 64, bg: '#d8d0b8', fg: '#222', font: 'bold 40px Courier New', grimeAmt: 4 }) }));
      lbl.position.set(0, y + 0.06, 0.342); g.add(lbl);
    }
  });
  g.userData.size = [0.5, 0.65];
  return g;
}
export function pipe(len, r = 0.08, axis = 'x', color = '#4b4a40') {
  const m = cyl(r, r, len, M.metal(color), 0, 0, 0, null, 10);
  if (axis === 'x') m.rotation.z = Math.PI / 2; else if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.castShadow = false;
  return m;
}
export function fluorescent(len = 1.2) {
  const g = new THREE.Group();
  box(len + 0.1, 0.06, 0.3, M.metal('#6a706c'), 0, 0, 0, g).castShadow = false;
  const tube = box(len, 0.03, 0.2, M.emissive('#cfe8dc', 1.6), 0, -0.04, 0, g);
  tube.castShadow = false;
  g.userData.panel = tube;
  return g;
}
export function door({ w = 1.0, h = 2.1, color = '#3a4a45', window: win = true, label } = {}) {
  // Returns { group, pivot } - rotate pivot.rotation.y to open.
  const group = new THREE.Group();
  const frame = M.metal('#2a302e');
  box(0.08, h + 0.08, 0.2, frame, -w / 2 - 0.04, (h + 0.08) / 2, 0, group);
  box(0.08, h + 0.08, 0.2, frame, w / 2 + 0.04, (h + 0.08) / 2, 0, group);
  box(w + 0.16, 0.08, 0.2, frame, 0, h + 0.04, 0, group);
  const pivot = new THREE.Group(); pivot.position.set(-w / 2, 0, 0); group.add(pivot);
  const leaf = box(w, h, 0.05, M.std(color, { roughness: 0.6 }), w / 2, h / 2, 0, pivot);
  if (win) { const glass = box(0.3, 0.5, 0.06, M.std('#0a1412', { roughness: 0.1, metalness: 0.3 }), w / 2 + 0.15, h * 0.72, 0, pivot); glass.castShadow = false; }
  box(0.04, 0.04, 0.12, M.metal('#aaa'), w - 0.1, 1.0, 0, pivot);
  if (label) {
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.13), new THREE.MeshStandardMaterial({ map: textTexture([label], { w: 256, h: 80, bg: '#c9c2a8', fg: '#1a1a1a', font: 'bold 36px Arial', grimeAmt: 10 }) }));
    lbl.position.set(w / 2, h * 0.92, 0.035); pivot.add(lbl);
  }
  group.userData.leaf = leaf;
  return { group, pivot, leaf };
}
export function wallClock() {
  const g = new THREE.Group();
  cyl(0.22, 0.22, 0.05, M.std('#222'), 0, 0, 0, g, 24).rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshStandardMaterial({ map: clockFace(3, 47) }));
  face.position.z = 0.027; g.add(face);
  return g;
}
function clockFace(h, m) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#d6d2c2'; g.beginPath(); g.arc(128, 128, 128, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#222'; g.font = 'bold 26px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; g.fillText(String(i), 128 + Math.cos(a) * 98, 128 + Math.sin(a) * 98); }
  const hand = (a, len, wdt) => { g.lineWidth = wdt; g.lineCap = 'round'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * len, 128 + Math.sin(a) * len); g.stroke(); };
  g.strokeStyle = '#111';
  hand(((h % 12) + m / 60) / 12 * Math.PI * 2 - Math.PI / 2, 55, 8);
  hand(m / 60 * Math.PI * 2 - Math.PI / 2, 85, 5);
  g.strokeStyle = '#8a1d16'; hand(12 / 60 * Math.PI * 2 - Math.PI / 2, 92, 2);
  g.fillStyle = 'rgba(80,60,20,0.25)'; g.beginPath(); g.arc(160, 170, 60, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function keypad() {
  const g = new THREE.Group();
  box(0.16, 0.24, 0.04, M.metal('#2c3230'), 0, 0, 0, g);
  const scr = box(0.12, 0.04, 0.01, M.emissive('#3fbf7a', 0.8), 0, 0.08, 0.022, g); scr.castShadow = false;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) box(0.025, 0.025, 0.01, M.std('#8a8f8c'), (c - 1) * 0.035, 0.03 - r * 0.035, 0.022, g);
  g.userData.screen = scr;
  return g;
}
export function breakerPanel(label, color) {
  const g = new THREE.Group();
  box(0.5, 0.7, 0.12, M.metal('#3d4542'), 0, 0, 0, g);
  const lever = new THREE.Group(); lever.position.set(0, -0.05, 0.08); g.add(lever);
  box(0.06, 0.22, 0.05, M.std('#222'), 0, 0.1, 0, lever);
  box(0.12, 0.05, 0.08, M.std(color), 0, 0.22, 0, lever);
  lever.rotation.x = 0.6;
  const lamp = box(0.06, 0.06, 0.03, M.emissive(color, 0.05).clone(), 0.17, 0.25, 0.07, g); lamp.castShadow = false;
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.12), new THREE.MeshStandardMaterial({ map: textTexture([label], { w: 256, h: 72, bg: '#cbc5ad', fg: '#151515', font: 'bold 30px Arial', grimeAmt: 8 }) }));
  lbl.position.set(0, 0.29, 0.062); g.add(lbl);
  g.userData.lever = lever; g.userData.lamp = lamp;
  return g;
}
export function book(color = '#6b1f1a') {
  const g = new THREE.Group();
  box(0.22, 0.05, 0.3, M.std(color, { roughness: 0.9 }), 0, 0.025, 0, g);
  box(0.2, 0.04, 0.28, M.std('#cfc6ad'), 0.012, 0.025, 0, g);
  return g;
}
export function paper(w = 0.21, d = 0.29, color = '#d8d1bd') {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.std(color, { side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m); m.position.y = 0.002; return g;
}
export function folder(color = '#7a6a3a') {
  const g = new THREE.Group();
  box(0.24, 0.03, 0.32, M.std(color), 0, 0.015, 0, g);
  return g;
}
export function sign(lines, { w = 1.2, h = 0.35, bg = '#c8c0a6', fg = '#1a1a1a', font = 'bold 44px Arial' } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: textTexture(lines, { w: 512, h: Math.round(512 * h / w), bg, fg, font, lineH: 52, grimeAmt: 20 }), roughness: 0.9 }));
  return m;
}
export function poster(lines, opts = {}) { return sign(lines, { w: 0.6, h: 0.85, font: 'bold 30px Georgia', ...opts }); }

export function headmaster() {
  const g = new THREE.Group();
  const coat = new THREE.MeshStandardMaterial({ color: '#050606', roughness: 1 });
  cyl(0.18, 0.36, 1.5, coat, 0, 0.75, 0, g);
  cyl(0.2, 0.18, 0.4, coat, 0, 1.65, 0, g);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshStandardMaterial({ color: '#0a0b0b', roughness: 1 }));
  head.position.y = 2.0; head.scale.set(0.9, 1.15, 0.95); g.add(head);
  box(0.36, 0.03, 0.36, coat, 0, 2.14, 0, g); // mortarboard
  cyl(0.12, 0.13, 0.08, coat, 0, 2.1, 0, g);
  const eyeM = new THREE.MeshBasicMaterial({ color: '#ff3a2a' });
  for (const x of [-0.05, 0.05]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), eyeM); e.position.set(x, 2.02, 0.125); g.add(e); }
  for (const x of [-0.27, 0.27]) { const a = cyl(0.045, 0.035, 1.0, coat, x, 1.25, 0.02, g); a.rotation.z = x > 0 ? 0.08 : -0.08; }
  g.traverse(o => { o.castShadow = true; });
  return g;
}
export function miraGhost() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#b9c9c6', emissive: '#6f8a86', emissiveIntensity: 0.6, transparent: true, opacity: 0.45, roughness: 1, depthWrite: false });
  cyl(0.12, 0.3, 0.9, m, 0, 0.45, 0, g);  // skirt
  cyl(0.13, 0.14, 0.5, m, 0, 1.13, 0, g); // torso
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), m); head.position.y = 1.5; g.add(head);
  const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.45, 12, 1, true), m); hair.position.y = 1.38; g.add(hair);
  g.userData.mat = m;
  return g;
}
export function ventGrate() {
  const g = new THREE.Group();
  box(0.9, 0.6, 0.05, M.metal('#5a625e'), 0, 0, 0, g);
  for (let i = 0; i < 7; i++) box(0.8, 0.025, 0.06, M.std('#151a18'), 0, -0.24 + i * 0.08, 0.01, g);
  return g;
}
export function emergencyLight() {
  const g = new THREE.Group();
  box(0.25, 0.12, 0.1, M.std('#2a2a2a'), 0, 0, 0, g);
  const lamp = box(0.18, 0.08, 0.04, M.emissive('#ff2a1a', 2), 0, 0, 0.06, g); lamp.castShadow = false;
  g.userData.panel = lamp;
  return g;
}
export function podium() {
  const g = new THREE.Group();
  const w = M.wood('#3b2a1c');
  box(0.6, 1.0, 0.5, w, 0, 0.5, 0, g);
  const top = box(0.7, 0.04, 0.55, w, 0, 1.05, 0, g); top.rotation.x = -0.25;
  const ledger = box(0.5, 0.05, 0.36, M.std('#4a1d18'), 0, 1.1, 0.02, g); ledger.rotation.x = -0.25;
  g.userData.size = [0.7, 0.55];
  return g;
}
export function cage(w = 1.6, h = 2.2, d = 1.4) {
  const g = new THREE.Group();
  const m = M.metal('#3a3e3b');
  for (let x = -w / 2; x <= w / 2 + 0.01; x += 0.15) box(0.02, h, 0.02, m, x, h / 2, d / 2, g);
  box(w, 0.04, 0.04, m, 0, h, d / 2, g); box(w, 0.04, 0.04, m, 0, 0.05, d / 2, g);
  return g;
}
export function scorch(r = 0.8) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64); grd.addColorStop(0, 'rgba(5,3,2,0.95)'); grd.addColorStop(0.6, 'rgba(20,12,6,0.6)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 1 }));
  return m;
}
export function window_(w = 1.4, h = 1.2) {
  const g = new THREE.Group();
  const frame = M.std('#2b3230');
  box(w, 0.06, 0.12, frame, 0, h / 2, 0, g); box(w, 0.06, 0.12, frame, 0, -h / 2, 0, g);
  box(0.06, h, 0.12, frame, -w / 2, 0, 0, g); box(0.06, h, 0.12, frame, w / 2, 0, 0, g); box(0.04, h, 0.1, frame, 0, 0, 0, g);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: '#05100e', emissive: '#0a1a22', emissiveIntensity: 0.4, roughness: 0.05, metalness: 0.6 }));
  glass.position.z = -0.02; g.add(glass);
  return g;
}
