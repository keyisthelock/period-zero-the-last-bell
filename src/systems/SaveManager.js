// Persists checkpoints in localStorage. A checkpoint is a plain JSON snapshot:
// { chapter, flags: {}, inventory: [], notes: [], reachedChapter, ts }
const KEY = 'periodzero.save.v1';
const SETTINGS_KEY = 'periodzero.settings.v1';

export class SaveManager {
  constructor(bus) { this.bus = bus; }

  hasSave() { return !!this.load(); }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (typeof data.chapter !== 'number') return null;
      return data;
    } catch { return null; }
  }

  save(snapshot) {
    const data = { ...snapshot, ts: Date.now() };
    const prev = this.load();
    data.reachedChapter = Math.max(prev?.reachedChapter ?? 0, snapshot.chapter);
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.warn('save failed', e); }
    this.bus.emit('save:written', data);
    return data;
  }

  clear() { try { localStorage.removeItem(KEY); } catch {} }

  loadSettings() {
    try { return { muted: false, subtitles: true, sensitivity: 1, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
    catch { return { muted: false, subtitles: true, sensitivity: 1 }; }
  }
  saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {} }
}
