import * as THREE from 'three';
import { Tex, M } from '../world/Materials.js';
import * as P from '../world/Prefabs.js';
import { PostFX } from './PostFX.js';

// Owns renderer/scene/camera and provides the level-building context (ctx) used by chapter data.
export class SceneManager {
  constructor(canvas, game) {
    this.game = game;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.6;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 80);
    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    // Flashlight attached to camera
    this.flashlight = new THREE.SpotLight('#f4ecd8', 0, 18, 0.48, 0.55, 1.6);
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.set(512, 512);
    this.flashlight.shadow.camera.near = 0.2; this.flashlight.shadow.camera.far = 18;
    this.flashlight.shadow.bias = -0.0005;
    this.flashlight.position.set(0.15, -0.15, 0.1);
    this.flashlight.target.position.set(0.05, -0.1, -3);
    this.camera.add(this.flashlight, this.flashlight.target);
    this.flashOn = false; this.flashBase = 26;

    this.emergencyLights = [];
    this.emergency = false;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight; this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setFlashlight(on) { this.flashOn = on; }
  setEmergency(on) {
    this.emergency = on;
    this.emergencyLights.forEach(l => { l.light.intensity = on || l.always ? l.base : 0; if (l.panel) l.panel.material.emissiveIntensity = on || l.always ? 2 : 0.15; });
    if (this.ambient) this.ambient.color.set(on ? '#3a1210' : this.ambientColor);
  }

  // Clears the current level geometry (keeps camera + flashlight)
  clear() {
    for (const o of [...this.scene.children]) {
      if (o === this.camera) continue;
      this.scene.remove(o);
      o.traverse?.(n => { n.geometry?.dispose?.(); });
    }
    this.emergencyLights = []; this.emergency = false;
  }

  setupAtmosphere(cfg) {
    const s = this.scene;
    s.background = new THREE.Color(cfg.fog ?? '#050908');
    s.fog = new THREE.FogExp2(cfg.fog ?? '#050908', cfg.fogDensity ?? 0.07);
    this.ambientColor = cfg.ambient ?? '#1c2a28';
    this.ambient = new THREE.HemisphereLight(this.ambientColor, '#050505', cfg.ambientIntensity ?? 0.9);
    s.add(this.ambient);
    if (cfg.moon) {
      const d = new THREE.DirectionalLight(cfg.moon.color ?? '#6f8fa8', cfg.moon.intensity ?? 0.5);
      d.position.set(...(cfg.moon.pos ?? [8, 10, 4]));
      d.target.position.set(...(cfg.moon.target ?? [0, 0, 0]));
      d.castShadow = true; d.shadow.mapSize.set(1024, 1024);
      const sc = d.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.far = 40;
      d.shadow.bias = -0.0008;
      s.add(d, d.target);
    }
    this.flashBase = (cfg.flashIntensity ?? 26) * 1.6;
    // floating dust
    const n = 700, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 16; pos[i * 3 + 1] = Math.random() * 3; pos[i * 3 + 2] = (Math.random() - 0.5) * 16; }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: cfg.dustColor ?? '#9fb5ac', size: 0.018, transparent: true, opacity: 0.55, depthWrite: false }));
    this.dust.frustumCulled = false;
    s.add(this.dust);
  }

  update(dt, playerPos, time) {
    // flashlight subtle flicker
    const target = this.flashOn ? this.flashBase * (Math.random() < 0.01 ? 0.4 : 1) : 0;
    this.flashlight.intensity += (target - this.flashlight.intensity) * Math.min(1, dt * 20);
    if (this.dust) {
      this.dust.position.set(playerPos.x, 0, playerPos.z);
      const a = this.dust.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i) + dt * 0.03 * Math.sin(i + time * 0.3);
        if (y > 3) y = 0; if (y < 0) y = 3;
        a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(time * 0.2 + i) * dt * 0.02);
      }
      a.needsUpdate = true;
    }
    if (this.emergency) {
      const k = 0.65 + Math.sin(time * 3) * 0.35;
      this.emergencyLights.forEach(l => { l.light.intensity = l.base * k; });
    }
  }

  render(time = 0, damage = 0) {
    if (!this.post) {
      try { this.post = new PostFX(this.renderer, this.scene, this.camera); this.post.setQuality(this.quality || 'high'); }
      catch (e) { console.warn('PostFX unavailable, falling back to direct render', e); this.post = false; }
    }
    if (this.post && this.quality !== 'off') this.post.render(time, { red: this.emergency ? 0.22 : 0, damage });
    else this.renderer.render(this.scene, this.camera);
  }
  setQuality(q) { this.quality = q; if (this.post) this.post.setQuality(q); this.renderer.shadowMap.type = q === 'low' ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap; }

  // ------------------------------------------------------------------
  // Level-building context handed to chapter build() functions.
  makeContext(game) {
    const sm = this, scene = this.scene;
    const colliders = [], blockers = [];
    const scaleUV = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
    const addCollider = (minX, maxX, minZ, maxZ) => { const c = { minX, maxX, minZ, maxZ }; colliders.push(c); return c; };

    const ctx = {
      THREE, P, M, Tex, scene, game, colliders, blockers,
      addCollider,
      collider(x, z, w, d) { return addCollider(x - w / 2, x + w / 2, z - d / 2, z + d / 2); },

      // A straight wall along X or Z (axis-aligned). Thickness 0.2.
      wall(x1, z1, x2, z2, h, material, y0 = 0) {
        const alongX = Math.abs(z2 - z1) < 1e-6;
        const len = alongX ? Math.abs(x2 - x1) : Math.abs(z2 - z1);
        if (len < 0.01) return;
        const geo = scaleUV(new THREE.BoxGeometry(alongX ? len : 0.2, h, alongX ? 0.2 : len), len / 3, h / 3);
        const m = new THREE.Mesh(geo, material);
        m.position.set((x1 + x2) / 2, y0 + h / 2, (z1 + z2) / 2);
        // walls don't cast shadows so the low "moonlight" reads as light through windows
        m.receiveShadow = true; m.castShadow = false;
        scene.add(m); blockers.push(m);
        if (y0 < 1.8) {
          if (alongX) addCollider(Math.min(x1, x2), Math.max(x1, x2), z1 - 0.1, z1 + 0.1);
          else addCollider(x1 - 0.1, x1 + 0.1, Math.min(z1, z2), Math.max(z1, z2));
        }
        return m;
      },

      // Rectangular room with floor/ceiling and walls; gaps: [{side:'n'|'s'|'e'|'w', at, width, height}]
      room({ x = 0, z = 0, w, d, h = 3, floor, wall, ceil, gaps = [], noCeil = false, skip = [] }) {
        const floorM = floor ?? new THREE.MeshStandardMaterial({ map: Tex.tiles(), roughness: 0.6 });
        const wallM = wall ?? new THREE.MeshStandardMaterial({ map: Tex.wall(), roughness: 0.9 });
        const ceilM = ceil ?? new THREE.MeshStandardMaterial({ map: Tex.ceiling(), roughness: 1 });
        const fg = scaleUV(new THREE.PlaneGeometry(w, d), w / 2, d / 2);
        const f = new THREE.Mesh(fg, floorM); f.rotation.x = -Math.PI / 2; f.position.set(x, 0, z); f.receiveShadow = true; scene.add(f);
        if (!noCeil) { const cg = scaleUV(new THREE.PlaneGeometry(w, d), w / 3, d / 3); const c = new THREE.Mesh(cg, ceilM); c.rotation.x = Math.PI / 2; c.position.set(x, h, z); scene.add(c); }
        const sides = {
          n: { a: [x - w / 2, z - d / 2], b: [x + w / 2, z - d / 2], len: w, alongX: true },
          s: { a: [x - w / 2, z + d / 2], b: [x + w / 2, z + d / 2], len: w, alongX: true },
          w: { a: [x - w / 2, z - d / 2], b: [x - w / 2, z + d / 2], len: d, alongX: false },
          e: { a: [x + w / 2, z - d / 2], b: [x + w / 2, z + d / 2], len: d, alongX: false },
        };
        for (const [k, s] of Object.entries(sides)) {
          if (skip.includes(k)) continue;
          const gs = gaps.filter(g => g.side === k).map(g => ({ from: s.len / 2 + (g.at ?? 0) - g.width / 2, to: s.len / 2 + (g.at ?? 0) + g.width / 2, h: g.height ?? 2.2 })).sort((p, q) => p.from - q.from);
          let cur = 0;
          const seg = (t0, t1, hh = h, y0 = 0) => {
            if (s.alongX) ctx.wall(s.a[0] + t0, s.a[1], s.a[0] + t1, s.a[1], hh, wallM, y0);
            else ctx.wall(s.a[0], s.a[1] + t0, s.a[0], s.a[1] + t1, hh, wallM, y0);
          };
          for (const g of gs) { seg(cur, g.from); seg(g.from, g.to, h - g.h, g.h); cur = g.to; }
          seg(cur, s.len);
        }
      },

      place(obj, x, z, rotY = 0, { y = 0, collide = true, pad = 0 } = {}) {
        obj.position.set(x, y, z); obj.rotation.y = rotY; scene.add(obj);
        if (collide && obj.userData.size) {
          let [w, d] = obj.userData.size;
          const q = Math.round(rotY / (Math.PI / 2));
          if (Math.abs(q) % 2 === 1) [w, d] = [d, w];
          obj.userData.collider = ctx.collider(x, z, w + pad, d + pad);
        }
        return obj;
      },

      // Ceiling fluorescent fixture + point light, registered for flicker
      light(x, z, { y = 2.95, color = '#bfe0d2', intensity = 6, distance = 9, flicker = false, fixture = true, off = false } = {}) {
        const light = new THREE.PointLight(color, intensity, distance, 1.8);
        light.position.set(x, y - 0.25, z);
        scene.add(light);
        let panel = null;
        if (fixture) { const f = P.fluorescent(); f.position.set(x, y - 0.03, z); scene.add(f); panel = f.userData.panel; }
        const l = { light, base: intensity, panel, flicker, seed: Math.random() * 100, off };
        game.horror.addLight(l);
        return l;
      },
      lamp(x, y, z, { color = '#e0b070', intensity = 3, distance = 6 } = {}) {
        const light = new THREE.PointLight(color, intensity, distance, 1.8); light.position.set(x, y, z); scene.add(light);
        const shade = P.cyl(0.08, 0.18, 0.18, M.std('#2c3a2a', { side: THREE.DoubleSide }), x, y + 0.08, z, scene);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), M.emissive(color, 2)); bulb.position.set(x, y, z); scene.add(bulb);
        const l = { light, base: intensity, panel: bulb, panelBase: 2, flicker: false, seed: Math.random() * 100 };
        game.horror.addLight(l);
        return l;
      },
      emergency(x, y, z, rotY = 0, { always = false, intensity = 4, distance = 8 } = {}) {
        const g = P.emergencyLight(); g.position.set(x, y, z); g.rotation.y = rotY; scene.add(g);
        const light = new THREE.PointLight('#ff2a14', always ? intensity : 0, distance, 1.6);
        light.position.set(x + Math.sin(rotY) * 0.3, y - 0.1, z + Math.cos(rotY) * 0.3); scene.add(light);
        const e = { light, base: intensity, panel: g.userData.panel, always };
        if (!always) g.userData.panel.material.emissiveIntensity = 0.15;
        sm.emergencyLights.push(e);
        return e;
      },

      interact(obj, def) { return game.interaction.register({ object: obj, ...def }); },

      // Door with pivot; returns controller { open(), close(), isOpen, collider }
      door(x, z, rotY = 0, opts = {}) {
        const d = P.door(opts);
        d.group.position.set(x, 0, z); d.group.rotation.y = rotY; scene.add(d.group);
        const w = opts.w ?? 1.0;
        const alongX = Math.abs(Math.round(rotY / (Math.PI / 2))) % 2 === 0;
        const col = alongX ? ctx.collider(x, z, w, 0.2) : ctx.collider(x, z, 0.2, w);
        blockers.push(d.leaf);
        const ctrl = {
          ...d, isOpen: false, target: 0, collider: col,
          open(sound = true) { if (ctrl.isOpen) return; ctrl.isOpen = true; ctrl.target = opts.openAngle ?? -Math.PI * 0.55; col.disabled = true; if (sound) game.audio.door(true); },
          close(sound = true) { if (!ctrl.isOpen) return; ctrl.isOpen = false; ctrl.target = 0; col.disabled = false; if (sound) game.audio.slam(); },
        };
        game.horror.every(dt => { d.pivot.rotation.y += (ctrl.target - d.pivot.rotation.y) * Math.min(1, dt * 3); });
        return ctrl;
      },

      sign(lines, x, y, z, rotY = 0, opts) { const s = P.sign(lines, opts); s.position.set(x, y, z); s.rotation.y = rotY; scene.add(s); return s; },
      add(obj, x = 0, y = 0, z = 0, rotY = 0) { obj.position.set(x, y, z); obj.rotation.y = rotY; scene.add(obj); return obj; },
    };
    return ctx;
  }
}
