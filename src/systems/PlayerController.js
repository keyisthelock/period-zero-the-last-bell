import * as THREE from 'three';

// First-person controller: yaw/pitch mouse look, WASD + sprint, circle-vs-AABB collision on XZ.
export class PlayerController {
  constructor(camera, bus) {
    this.camera = camera; this.bus = bus;
    this.pos = new THREE.Vector3(0, 0, 0);
    this.yaw = 0; this.pitch = 0;
    this.radius = 0.3; this.eye = 1.62;
    this.walk = 2.6; this.sprintSpeed = 4.4;
    this.keys = new Set();
    this.enabled = false;
    this.colliders = [];
    this.sensitivity = 1;
    this.bob = 0; this.moving = false; this.sprinting = false;
    this.noclip = false;
    this.shake = 0;
    this.stamina = 1;
    this.lookTarget = null; // forced look (cutscene)

    window.addEventListener('keydown', e => { this.keys.add(e.code); });
    window.addEventListener('keyup', e => { this.keys.delete(e.code); });
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('mousemove', e => {
      if (!this.enabled || document.pointerLockElement == null) return;
      const s = 0.0022 * this.sensitivity;
      this.yaw -= e.movementX * s;
      this.pitch -= e.movementY * s;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    });
  }

  setColliders(list) { this.colliders = list; }
  teleport(x, z, yaw = 0) { this.pos.set(x, 0, z); this.yaw = yaw; this.pitch = 0; this._apply(0); }

  update(dt) {
    let mx = 0, mz = 0;
    if (this.enabled) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) mz -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) mz += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    }
    const len = Math.hypot(mx, mz);
    this.moving = len > 0;
    const wantSprint = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && this.moving;
    this.sprinting = wantSprint && this.stamina > 0.05;
    this.stamina = Math.max(0, Math.min(1, this.stamina + (this.sprinting ? -dt * 0.22 : dt * 0.15)));
    if (this.moving) {
      mx /= len; mz /= len;
      const sp = (this.sprinting ? this.sprintSpeed : this.walk) * (this.noclip ? 2.5 : 1);
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      const dx = (mx * cos + mz * sin) * sp * dt;
      const dz = (-mx * sin + mz * cos) * sp * dt;
      this._move(dx, dz);
      this.bob += dt * (this.sprinting ? 13 : 8.5);
    }
    this._apply(dt);
  }

  _move(dx, dz) {
    if (this.noclip) { this.pos.x += dx; this.pos.z += dz; return; }
    // sub-step to avoid tunnelling through thin walls
    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.1) || 1;
    for (let i = 0; i < steps; i++) {
      this.pos.x += dx / steps; this._resolve('x');
      this.pos.z += dz / steps; this._resolve('z');
    }
  }

  _resolve(axis) {
    const r = this.radius, p = this.pos;
    for (const c of this.colliders) {
      if (c.disabled) continue;
      if (p.x + r <= c.minX || p.x - r >= c.maxX || p.z + r <= c.minZ || p.z - r >= c.maxZ) continue;
      // closest point test for proper circle behaviour
      const cx = Math.max(c.minX, Math.min(p.x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(p.z, c.maxZ));
      const ddx = p.x - cx, ddz = p.z - cz;
      const d2 = ddx * ddx + ddz * ddz;
      if (d2 >= r * r && !(p.x > c.minX && p.x < c.maxX && p.z > c.minZ && p.z < c.maxZ)) continue;
      // push out along the axis of least penetration (robust for thin walls and corners)
      const pl = p.x + r - c.minX, pr = c.maxX - (p.x - r);
      const pn = p.z + r - c.minZ, ps = c.maxZ - (p.z - r);
      const m = Math.min(pl, pr, pn, ps);
      if (m === pl) p.x -= pl; else if (m === pr) p.x += pr; else if (m === pn) p.z -= pn; else p.z += ps;
    }
  }

  _apply(dt) {
    const bobY = this.moving ? Math.sin(this.bob) * 0.035 : 0;
    const bobX = this.moving ? Math.cos(this.bob * 0.5) * 0.02 : 0;
    this.shake = Math.max(0, this.shake - dt * 1.5);
    const sh = this.shake * 0.04;
    this.camera.position.set(this.pos.x + (Math.random() - 0.5) * sh, this.eye + bobY + (Math.random() - 0.5) * sh, this.pos.z);
    if (this.lookTarget) {
      const t = this.lookTarget;
      const dx = t.x - this.pos.x, dz = t.z - this.pos.z, dy = t.y - this.eye;
      const ty = Math.atan2(-dx, -dz), tp = Math.atan2(dy, Math.hypot(dx, dz));
      let d = ty - this.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
      this.yaw += d * Math.min(1, dt * 4); this.pitch += (tp - this.pitch) * Math.min(1, dt * 4);
    }
    this.camera.rotation.set(this.pitch, this.yaw, bobX * 0.3, 'YXZ');
  }
}
