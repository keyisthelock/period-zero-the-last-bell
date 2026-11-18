// Queued subtitle/dialogue playback. Each line: { s: speaker, t: text, d?: seconds, voice?: 'pa'|'whisper'|'voss' }
// Lines play sequentially; a new sequence can either queue or interrupt.
export class DialogueManager {
  constructor(bus, audio) {
    this.bus = bus; this.audio = audio;
    this.queue = []; this.current = null; this.timer = 0;
    this.el = document.getElementById('subtitles');
    this.enabled = true;
  }
  play(lines, { interrupt = false } = {}) {
    if (!Array.isArray(lines)) lines = [lines];
    if (interrupt) { this.queue = []; this.current = null; this.timer = 0; this._render(); }
    this.queue.push(...lines);
    return new Promise(res => { this.queue.push({ _resolve: res }); });
  }
  clear() { this.queue = []; this.current = null; this._render(); }
  get busy() { return !!this.current || this.queue.some(l => !l._resolve); }
  update(dt) {
    if (this.current) {
      this.timer -= dt;
      if (this.timer <= 0) { this.current = null; this._render(); }
      return;
    }
    while (this.queue.length) {
      const next = this.queue.shift();
      if (next._resolve) { next._resolve(); continue; }
      this.current = next;
      this.timer = next.d ?? Math.max(2.2, next.t.length * 0.065);
      if (next.voice === 'pa') this.audio?.paStatic(Math.min(this.timer, 3));
      if (next.voice === 'whisper') this.audio?.whisper(Math.min(this.timer, 3));
      if (next.voice === 'voss') this.audio?.vossVoice(Math.min(this.timer, 3));
      this.bus.emit('dialogue:line', next);
      this._render();
      break;
    }
  }
  _render() {
    if (!this.el) return;
    if (!this.current || !this.enabled && this.current.s !== 'SYSTEM') { this.el.innerHTML = ''; return; }
    const c = this.current;
    const spk = c.s && c.s !== 'SYSTEM' ? `<span class="spk ${c.s}">${c.s}</span>` : '';
    this.el.innerHTML = `<div class="line">${spk}${escapeHtml(c.t)}</div>`;
  }
}
function escapeHtml(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
