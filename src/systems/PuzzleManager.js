// Finite-state puzzle logic. Each puzzle: LOCKED -> ACTIVE -> SOLVED (terminal).
// Puzzles are defined in chapter data; this manager only validates and tracks state.
export const PuzzleState = Object.freeze({ LOCKED: 'locked', ACTIVE: 'active', SOLVED: 'solved' });

export class PuzzleManager {
  constructor(bus) {
    this.bus = bus;
    this.puzzles = new Map();
  }
  clear() { this.puzzles.clear(); }

  register(def, solved = false) {
    const p = { ...def, state: solved ? PuzzleState.SOLVED : PuzzleState.ACTIVE, attempts: 0, progress: [] };
    this.puzzles.set(def.id, p);
    return p;
  }
  get(id) { return this.puzzles.get(id); }
  isSolved(id) { return this.puzzles.get(id)?.state === PuzzleState.SOLVED; }

  // Submit a full answer (keypad / wheels / symbols / record).
  submit(id, answer) {
    const p = this.puzzles.get(id);
    if (!p || p.state === PuzzleState.SOLVED) return { ok: true, already: true };
    p.attempts++;
    const ok = (p.answers || [p.answer]).some(a => normalize(answer) === normalize(a));
    if (ok) this._solve(p);
    else this.bus.emit('puzzle:failed', { id, attempts: p.attempts });
    return { ok, attempts: p.attempts };
  }

  // Incremental sequence puzzles (e.g. circuits). Wrong step resets progress, never locks.
  step(id, value) {
    const p = this.puzzles.get(id);
    if (!p || p.state === PuzzleState.SOLVED) return { ok: true, already: true };
    const expected = p.answer[p.progress.length];
    if (value === expected) {
      p.progress.push(value);
      this.bus.emit('puzzle:progress', { id, progress: [...p.progress] });
      if (p.progress.length === p.answer.length) this._solve(p);
      return { ok: true, progress: [...p.progress] };
    }
    p.attempts++;
    const lost = [...p.progress];
    p.progress = [];
    this.bus.emit('puzzle:reset', { id, lost, attempts: p.attempts });
    return { ok: false, lost };
  }

  _solve(p) {
    p.state = PuzzleState.SOLVED;
    this.bus.emit('puzzle:solved', { id: p.id });
  }

  // Debug helper
  forceSolve(id) { const p = this.puzzles.get(id); if (p && p.state !== PuzzleState.SOLVED) { p.progress = Array.isArray(p.answer) ? [...p.answer] : []; this._solve(p); } }
}

function normalize(a) {
  if (Array.isArray(a)) return a.map(x => String(x).trim().toUpperCase()).join('|');
  return String(a).trim().toUpperCase();
}
