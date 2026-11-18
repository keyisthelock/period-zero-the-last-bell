import * as THREE from 'three';

// Center-screen raycast against registered interactables.
// Interactable: { id, object, prompt: string|fn, range?, isEnabled?: fn, onUse: fn }
export class InteractionSystem {
  constructor(camera, bus) {
    this.camera = camera; this.bus = bus;
    this.ray = new THREE.Raycaster();
    this.list = [];
    this.blockers = []; // meshes that occlude interaction (walls)
    this.current = null;
    this.center = new THREE.Vector2(0, 0);
    this.promptEl = document.getElementById('prompt');
    this.crossEl = document.getElementById('crosshair');
  }
  clear() { this.list = []; this.blockers = []; this.current = null; this._show(null); }
  register(def) {
    def.object.traverse(o => { o.userData.interactable = def; });
    this.list.push(def);
    return def;
  }
  unregister(def) { this.list = this.list.filter(d => d !== def); if (this.current === def) { this.current = null; this._show(null); } }

  update(active) {
    if (!active) { if (this.current) { this.current = null; this._show(null); } return; }
    this.ray.setFromCamera(this.center, this.camera);
    this.ray.far = 3.0;
    const targets = [];
    for (const d of this.list) if (!d.hidden && (!d.isEnabled || d.isEnabled())) targets.push(d.object);
    const hits = this.ray.intersectObjects([...targets, ...this.blockers], true);
    let found = null;
    for (const h of hits) {
      const def = h.object.userData.interactable;
      if (!def) break; // blocked by wall
      if (h.distance <= (def.range ?? 2.6)) found = def;
      break;
    }
    if (found !== this.current) { this.current = found; this._show(found); }
    else if (found && typeof found.prompt === 'function') this._show(found);
  }

  use() {
    if (!this.current) return false;
    const d = this.current;
    this.bus.emit('interact', d.id);
    d.onUse?.(d);
    // prompt may have changed
    this._show(this.current);
    return true;
  }

  _show(def) {
    if (!this.promptEl) return;
    if (!def) { this.promptEl.classList.add('hidden'); this.crossEl.classList.remove('active'); return; }
    const p = typeof def.prompt === 'function' ? def.prompt() : def.prompt;
    this.promptEl.innerHTML = `<b>[E]</b> ${p}`;
    this.promptEl.classList.remove('hidden');
    this.crossEl.classList.add('active');
  }
}
