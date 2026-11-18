// Scripted, staged scares. Events are data: { id, trigger: {type:'zone',x,z,w,d} | {type:'flag', flag} | {type:'timer', t}, once, run(h) }
// run() receives this manager, which exposes game-time-aware helpers (wait, flicker, blackout, shake...).
export class HorrorEventManager {
  constructor(bus, game) {
    this.bus = bus; this.game = game;
    this.events = []; this.timers = []; this.time = 0;
    this.lights = []; // flickerable fluorescent lights: { light, base, panel, flicker, broken }
    this.anim = [];   // per-frame callbacks returning false when finished
    bus.on('flag:set', f => this.events.forEach(e => {
      if (!e.fired && e.trigger.type === 'flag' && e.trigger.flag === f) this.fire(e);
    }));
  }
  clear() { this.events = []; this.timers.forEach(t => t.cancelled = true); this.timers = []; this.lights = []; this.anim = []; }

  add(ev) { this.events.push({ ...ev, fired: ev.once !== false && !!this.game.flags[`ev_${ev.id}`] }); }
  addLight(l) { this.lights.push(l); }

  fire(e) {
    if (e.fired && e.once !== false) return;
    e.fired = true;
    if (e.once !== false) this.game.setFlag(`ev_${e.id}`, true, { silent: true });
    Promise.resolve().then(() => e.run(this)).catch(err => console.error('horror event failed', e.id, err));
  }

  wait(sec) { return new Promise(res => this.timers.push({ at: this.time + sec, res })); }
  every(fn) { this.anim.push(fn); }

  update(dt, playerPos) {
    this.time += dt;
    for (const t of [...this.timers]) if (!t.cancelled && this.time >= t.at) { this.timers.splice(this.timers.indexOf(t), 1); t.res(); }
    this.anim = this.anim.filter(fn => fn(dt) !== false);
    for (const e of this.events) {
      if (e.fired) continue;
      const tr = e.trigger;
      if (tr.type === 'zone' && Math.abs(playerPos.x - tr.x) < tr.w / 2 && Math.abs(playerPos.z - tr.z) < tr.d / 2) {
        if (!tr.requires || this.game.flags[tr.requires]) this.fire(e);
      }
      if (tr.type === 'timer' && this.time >= tr.t) this.fire(e);
    }
    // ambient fluorescent flicker
    for (const l of this.lights) {
      let k = 1;
      if (l.off) k = 0;
      else if (l.flickerUntil && this.time < l.flickerUntil) k = Math.random() < 0.5 ? 0.05 : 1;
      else if (l.flicker) { const n = Math.sin(this.time * 31 + l.seed) * Math.sin(this.time * 7.3 + l.seed * 2); k = n > 0.93 ? 0.1 : (Math.random() < 0.004 ? 0.2 : 1); }
      l.light.intensity = l.base * k * (this.game.blackout ? 0 : 1);
      if (l.panel) l.panel.material.emissiveIntensity = (l.panelBase ?? 1.6) * k * (this.game.blackout ? 0 : 1);
    }
  }

  // ---------- helpers for scripts ----------
  get audio() { return this.game.audio; }
  say(lines, opts) { return this.game.dialogue.play(lines, opts); }
  flickerAll(sec = 1.5) { this.lights.forEach(l => l.flickerUntil = this.time + sec * (0.6 + Math.random() * 0.6)); this.audio.electric(0.4); }
  async blackout(sec = 2) { this.game.blackout = true; this.audio.electric(0.2); await this.wait(sec); this.game.blackout = false; }
  shake(a = 1) { this.game.player.shake = Math.max(this.game.player.shake, a); }
  redAlert(on = true) { this.game.scene3d.setEmergency(on); }
}
