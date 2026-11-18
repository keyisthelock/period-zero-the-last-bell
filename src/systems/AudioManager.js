// Fully synthesized audio (Web Audio API). No external files -> no broken URLs.
// The AudioContext is created lazily on the first user gesture (init()).
export class AudioManager {
  constructor(bus) {
    this.bus = bus;
    this.ctx = null; this.master = null; this.muted = false;
    this.drone = null; this.noiseBuf = null; this.stepT = 0;
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    // gentle global reverb-ish delay for space
    this.comp = this.ctx.createDynamicsCompressor();
    this.master.connect(this.comp).connect(this.ctx.destination);
    this.verb = this._makeReverb();
    this.verb.connect(this.master);
    // white noise buffer reused by many sounds
    const len = this.ctx.sampleRate * 2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  _makeReverb() {
    const c = this.ctx, conv = c.createConvolver();
    const len = c.sampleRate * 2.4, buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    conv.buffer = buf;
    const g = c.createGain(); g.gain.value = 0.35;
    conv.connect(g);
    this.verbIn = conv;
    return g;
  }

  get ok() { return !!this.ctx; }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
    this.bus.emit('audio:muted', m);
  }

  // ---------- helpers ----------
  _out(wet = 0.3) {
    const g = this.ctx.createGain();
    g.connect(this.master);
    if (wet > 0) { const w = this.ctx.createGain(); w.gain.value = wet; g.connect(w).connect(this.verbIn); }
    return g;
  }
  _noise(dur, { type = 'bandpass', freq = 1000, q = 1, gain = 0.3, attack = 0.005, wet = 0.3, freqEnd } = {}) {
    if (!this.ok) return;
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = this._out(wet);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g);
    src.start(t, Math.random()); src.stop(t + dur + 0.05);
    return { src, f, g };
  }
  _tone(freq, dur, { type = 'sine', gain = 0.2, attack = 0.01, wet = 0.4, freqEnd, delay = 0 } = {}) {
    if (!this.ok) return;
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = this._out(wet);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  // ---------- ambience ----------
  startDrone(profile = {}) {
    if (!this.ok) return;
    this.stopDrone();
    const c = this.ctx, t = c.currentTime;
    const { base = 55, color = 400, level = 0.12, hum = true } = profile;
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + 3);
    g.connect(this.master);
    const nodes = [];
    [base, base * 1.498, base * 2.01].forEach((f, i) => {
      const o = c.createOscillator(); o.type = i === 0 ? 'sawtooth' : 'sine'; o.frequency.value = f;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
      const lg = c.createGain(); lg.gain.value = f * 0.004; lfo.connect(lg).connect(o.frequency); lfo.start();
      const og = c.createGain(); og.gain.value = i === 0 ? 0.25 : 0.18;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = color;
      o.connect(lp).connect(og).connect(g); o.start(); nodes.push(o, lfo);
    });
    // air noise
    const n = c.createBufferSource(); n.buffer = this.noiseBuf; n.loop = true;
    const nf = c.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 300;
    const ng = c.createGain(); ng.gain.value = 0.25;
    n.connect(nf).connect(ng).connect(g); n.start(); nodes.push(n);
    // fluorescent hum 120Hz
    if (hum) {
      const h = c.createOscillator(); h.type = 'square'; h.frequency.value = 120;
      const hf = c.createBiquadFilter(); hf.type = 'bandpass'; hf.frequency.value = 240; hf.Q.value = 8;
      const hg = c.createGain(); hg.gain.value = 0.035;
      h.connect(hf).connect(hg).connect(g); h.start(); nodes.push(h);
    }
    this.drone = { g, nodes };
  }
  stopDrone() {
    if (!this.drone || !this.ok) return;
    const { g, nodes } = this.drone, t = this.ctx.currentTime;
    g.gain.setTargetAtTime(0, t, 0.6);
    nodes.forEach(n => { try { n.stop(t + 3); } catch {} });
    this.drone = null;
  }

  // ---------- one-shots ----------
  footstep(sprint = false) {
    this._noise(0.12, { type: 'lowpass', freq: sprint ? 900 : 600, gain: sprint ? 0.16 : 0.1, wet: 0.15 });
    this._tone(70 + Math.random() * 20, 0.08, { gain: 0.08, wet: 0 });
  }
  bell(distort = false) {
    // inharmonic school bell partials
    const base = distort ? 610 : 660;
    [1, 2.76, 5.4, 8.93].forEach((m, i) => this._tone(base * m, 3.5 - i * 0.6, { gain: 0.12 / (i + 1), wet: 0.7, attack: 0.002 }));
    // electric clapper rattle
    for (let i = 0; i < 24; i++) this._tone(base * (distort ? 0.97 : 1), 0.06, { type: 'square', gain: 0.03, delay: i * 0.07, wet: 0.5 });
  }
  paStatic(dur = 2) {
    this._noise(dur, { type: 'bandpass', freq: 2200, q: 0.7, gain: 0.08, wet: 0.2, attack: 0.05 });
    this._tone(1000, 0.15, { type: 'square', gain: 0.02, wet: 0.2 });
    this._tone(50, dur, { type: 'sawtooth', gain: 0.03, wet: 0 });
  }
  whisper(dur = 2) {
    if (!this.ok) return;
    for (let i = 0; i < 3; i++) {
      const s = this._noise(dur, { type: 'bandpass', freq: 1500 + i * 900, q: 6, gain: 0.05, attack: 0.4, wet: 0.8 });
      if (s) { const t = this.ctx.currentTime; for (let k = 0; k < dur * 4; k++) s.f.frequency.setValueAtTime(900 + Math.random() * 2600, t + k * 0.25); }
    }
  }
  vossVoice(dur = 2) {
    this._tone(46, dur, { type: 'sawtooth', gain: 0.12, attack: 0.2, wet: 0.6 });
    this._tone(69, dur, { type: 'sawtooth', gain: 0.06, attack: 0.3, wet: 0.6 });
    this._noise(dur, { type: 'lowpass', freq: 300, gain: 0.12, attack: 0.3, wet: 0.5 });
  }
  door(open = true) {
    this._tone(open ? 180 : 140, 0.9, { type: 'sawtooth', gain: 0.04, freqEnd: open ? 320 : 90, wet: 0.3 });
    this._noise(0.25, { type: 'lowpass', freq: 400, gain: 0.25, wet: 0.4 });
    this._tone(55, 0.4, { gain: 0.25, wet: 0.3 });
  }
  slam() {
    this._noise(0.5, { type: 'lowpass', freq: 600, gain: 0.6, wet: 0.7, attack: 0.001 });
    this._tone(40, 0.6, { gain: 0.5, wet: 0.5, attack: 0.001 });
  }
  electric(dur = 0.6) {
    this._noise(dur, { type: 'highpass', freq: 3000, gain: 0.12, wet: 0.2, attack: 0.001 });
    this._tone(120, dur, { type: 'square', gain: 0.05, wet: 0.1 });
    for (let i = 0; i < 6; i++) this._noise(0.04, { type: 'highpass', freq: 5000, gain: 0.2, wet: 0.1 });
  }
  powerOn() { this._tone(60, 1.6, { type: 'sawtooth', gain: 0.08, freqEnd: 120, wet: 0.2 }); this.electric(0.3); }
  stinger(intensity = 1) {
    [233, 247, 311, 466].forEach((f, i) => this._tone(f, 2.8, { type: i % 2 ? 'sawtooth' : 'triangle', gain: 0.06 * intensity, attack: 0.05, wet: 0.8 }));
    this._noise(1.6, { type: 'bandpass', freq: 800, freqEnd: 3200, q: 2, gain: 0.12 * intensity, attack: 0.02, wet: 0.6 });
    this._tone(36, 2, { gain: 0.3 * intensity, wet: 0.4, attack: 0.01 });
  }
  heartbeat() { this._tone(55, 0.18, { gain: 0.35, wet: 0 }); this._tone(50, 0.2, { gain: 0.3, wet: 0, delay: 0.25 }); }
  success() { [523, 659, 784].forEach((f, i) => this._tone(f, 1.4, { gain: 0.07, delay: i * 0.12, wet: 0.6 })); }
  fail() { this._tone(110, 0.5, { type: 'square', gain: 0.07, wet: 0.2 }); this._tone(104, 0.5, { type: 'square', gain: 0.07, wet: 0.2 }); }
  beep() { this._tone(880, 0.08, { type: 'square', gain: 0.04, wet: 0.05 }); }
  click() { this._noise(0.04, { type: 'highpass', freq: 2000, gain: 0.15, wet: 0.1 }); }
  pickup() { this._tone(400, 0.2, { gain: 0.06, freqEnd: 700, wet: 0.3 }); this.click(); }
  paper() { this._noise(0.35, { type: 'highpass', freq: 2500, gain: 0.08, wet: 0.1, attack: 0.05 }); }
  thud() { this._tone(60, 0.35, { gain: 0.4, wet: 0.5, attack: 0.001 }); this._noise(0.2, { type: 'lowpass', freq: 500, gain: 0.3, wet: 0.5 }); }
  scrape() { this._noise(0.9, { type: 'bandpass', freq: 500, q: 3, freqEnd: 300, gain: 0.25, wet: 0.5, attack: 0.05 }); }
  hiss(dur = 2) { this._noise(dur, { type: 'highpass', freq: 4000, gain: 0.1, attack: 0.3, wet: 0.3 }); }
  flashlight() { this.click(); }

  update(dt, moving, sprint) {
    if (!moving) { this.stepT = 0.15; return; }
    this.stepT -= dt;
    if (this.stepT <= 0) { this.footstep(sprint); this.stepT = sprint ? 0.32 : 0.5; }
  }
}
