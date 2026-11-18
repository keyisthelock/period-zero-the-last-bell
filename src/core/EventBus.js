// Tiny synchronous pub/sub used by every system for decoupled communication.
export class EventBus {
  constructor() { this.map = new Map(); }
  on(evt, fn) {
    if (!this.map.has(evt)) this.map.set(evt, new Set());
    this.map.get(evt).add(fn);
    return () => this.off(evt, fn);
  }
  once(evt, fn) {
    const off = this.on(evt, (...a) => { off(); fn(...a); });
    return off;
  }
  off(evt, fn) { this.map.get(evt)?.delete(fn); }
  emit(evt, payload) {
    const set = this.map.get(evt);
    if (set) for (const fn of [...set]) {
      try { fn(payload); } catch (e) { console.error(`[EventBus] handler for "${evt}" failed`, e); }
    }
    if (EventBus.debug) console.debug('[evt]', evt, payload ?? '');
  }
}
EventBus.debug = false;
export const bus = new EventBus();
