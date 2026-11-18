// DOM-based UI: HUD, modal documents, puzzle interfaces, inventory, menus.
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class UI {
  constructor(game) {
    this.game = game;
    this.modal = $('modal'); this.inner = $('modal-inner');
    this.onClose = null;
    this._toastT = null;
    game.bus.on('toast', t => this.toast(t));
    game.bus.on('inventory:changed', inv => this.renderInvBar(inv));
    this._grain();
  }

  // ---------- HUD ----------
  showHUD(on) { $('hud').classList.toggle('hidden', !on); }
  objective(t) { $('objective').textContent = t || ''; }
  toast(t, ms = 2600) {
    const el = $('toast'); el.textContent = t; el.classList.remove('hidden');
    clearTimeout(this._toastT); this._toastT = setTimeout(() => el.classList.add('hidden'), ms);
  }
  chapterCard(num, name) {
    const el = $('chapter-card'); el.classList.remove('hidden');
    el.querySelector('.num').textContent = `CHAPTER ${num}`; el.querySelector('.name').textContent = name.toUpperCase();
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    clearTimeout(this._cardT); this._cardT = setTimeout(() => el.classList.add('hidden'), 5000);
  }
  renderInvBar(inv) {
    $('inv-bar').innerHTML = inv.items.map(i => `<div class="slot">${esc(i.name)}</div>`).join('');
  }
  fade(on, red = false) { const f = $('fade'); f.classList.toggle('red', red); f.style.opacity = on ? '1' : '0'; return new Promise(r => setTimeout(r, 850)); }

  // ---------- modal plumbing ----------
  get isOpen() { return !this.modal.classList.contains('hidden'); }
  open(html, onClose) {
    this._modalKeys = null;
    this.inner.innerHTML = html;
    this.modal.classList.remove('hidden');
    this.onClose = onClose || null;
    this.game.onModalOpen();
    const closeBtn = this.inner.querySelector('[data-close]');
    closeBtn?.addEventListener('click', () => this.close());
  }
  close() {
    if (!this.isOpen) return;
    this.modal.classList.add('hidden'); this.inner.innerHTML = '';
    const cb = this.onClose; this.onClose = null;
    this.game.onModalClose();
    cb?.();
  }

  document(note) {
    this.game.audio.paper();
    this.open(`<h3>${esc(note.title)}</h3><div class="doc ${note.style || ''}">${esc(note.body)}</div>
      <div class="modal-actions"><button data-close>Close</button></div><div class="close-hint">E / Esc to close · Notes are kept in your inventory (Tab)</div>`);
  }

  inventory() {
    const inv = this.game.inventory;
    let tab = 'items';
    const render = () => {
      const list = tab === 'items'
        ? (inv.items.length ? inv.items.map(i => `<div class="inv-item"><div class="t">${esc(i.name)}</div><div class="d">${esc(i.desc || '')}</div></div>`).join('') : '<div class="d">Nothing yet.</div>')
        : (inv.notes.length ? inv.notes.map((n, k) => `<div class="inv-item" data-note="${k}"><div class="t">${esc(n.title)}</div><div class="d">${esc(n.body.slice(0, 90))}${n.body.length > 90 ? '…' : ''}</div></div>`).join('') : '<div class="d">No notes read yet.</div>');
      this.inner.innerHTML = `<h3>INVENTORY</h3><div class="tabs"><button data-tab="items" class="${tab === 'items' ? 'on' : ''}">Items</button><button data-tab="notes" class="${tab === 'notes' ? 'on' : ''}">Notes (${inv.notes.length})</button></div>
        <div class="inv-list">${list}</div><div class="modal-actions"><button data-close>Close</button></div><div class="close-hint">Tab / Esc to close</div>`;
      this.inner.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
      this.inner.querySelectorAll('[data-note]').forEach(b => b.onclick = () => { const n = inv.notes[+b.dataset.note]; this.inner.innerHTML = `<h3>${esc(n.title)}</h3><div class="doc ${n.style || ''}">${esc(n.body)}</div><div class="modal-actions"><button id="inv-back">Back</button><button data-close>Close</button></div>`; $('inv-back').onclick = render; this.inner.querySelector('[data-close]').onclick = () => this.close(); });
      this.inner.querySelector('[data-close]').onclick = () => this.close();
    };
    this.open('');
    render();
  }

  // ---------- puzzles ----------
  keypad(puzzleId, title = 'DOOR KEYPAD', len = 4) {
    const g = this.game; let code = '';
    this.open(`<h3>${esc(title)}</h3><div class="keypad-display" id="kp-disp">----</div>
      <div class="keypad-grid">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '↵'].map(k => `<button data-k="${k}">${k}</button>`).join('')}</div>
      <div class="modal-actions"><button data-close>Step back</button></div><div class="close-hint">Type digits on your keyboard · Enter to submit</div>`);
    const disp = $('kp-disp');
    const show = () => { disp.classList.remove('err'); disp.textContent = (code + '----').slice(0, len); };
    const press = k => {
      g.audio.beep();
      if (k === 'C') { code = ''; show(); return; }
      if (k === '↵') {
        if (code.length < len) return;
        const r = g.puzzles.submit(puzzleId, code);
        if (r.ok) { disp.textContent = 'OPEN'; g.audio.success(); setTimeout(() => this.close(), 700); }
        else { disp.textContent = 'DENIED'; disp.classList.add('err'); g.audio.fail(); code = ''; setTimeout(show, 900); }
        return;
      }
      if (code.length < len) { code += k; show(); }
    };
    this.inner.querySelectorAll('[data-k]').forEach(b => b.onclick = () => press(b.dataset.k === '0' ? '0' : isNaN(+b.dataset.k) ? b.dataset.k : b.dataset.k));
    this._modalKeys = e => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Enter') press('↵'); else if (e.key === 'Backspace') { code = code.slice(0, -1); show(); } };
  }

  wheels(puzzleId, title, alphabet, count, hint = '') {
    const g = this.game; const idx = new Array(count).fill(0);
    const render = () => {
      this.inner.querySelector('.wheels').innerHTML = idx.map((v, i) => `<div class="wheel"><button data-up="${i}">▲</button><div class="val">${esc(alphabet[v])}</div><button data-dn="${i}">▼</button></div>`).join('');
      this.inner.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { idx[+b.dataset.up] = (idx[+b.dataset.up] + alphabet.length - 1) % alphabet.length; g.audio.click(); render(); });
      this.inner.querySelectorAll('[data-dn]').forEach(b => b.onclick = () => { idx[+b.dataset.dn] = (idx[+b.dataset.dn] + 1) % alphabet.length; g.audio.click(); render(); });
    };
    this.open(`<h3>${esc(title)}</h3><div class="wheels"></div><div class="close-hint">${esc(hint)}</div>
      <div class="modal-actions"><button id="wh-try">Try</button><button data-close>Step back</button></div><div id="wh-msg" class="close-hint"></div>`);
    render();
    $('wh-try').onclick = () => {
      const ans = idx.map(i => alphabet[i]).join('');
      const r = g.puzzles.submit(puzzleId, ans);
      if (r.ok) { g.audio.success(); this.close(); }
      else { g.audio.fail(); $('wh-msg').textContent = 'Nothing happens. The letters slide back a little.'; }
    };
  }

  symbols(puzzleId, title, glyphs, slots, hint = '') {
    const g = this.game; const chosen = [];
    const render = () => {
      this.inner.querySelector('.slots').innerHTML = new Array(slots).fill(0).map((_, i) => `<div class="slot-box" data-s="${i}">${chosen[i] ? esc(glyphs.find(x => x.id === chosen[i]).g) : ''}</div>`).join('');
      this.inner.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { chosen.splice(+b.dataset.s); g.audio.click(); render(); });
    };
    this.open(`<h3>${esc(title)}</h3><div class="slots"></div>
      <div class="palette">${glyphs.map(x => `<button data-g="${x.id}" title="">${esc(x.g)}</button>`).join('')}</div>
      <div class="close-hint">${esc(hint)}</div>
      <div class="modal-actions"><button id="sy-try">Engage</button><button id="sy-clr">Clear</button><button data-close>Step back</button></div><div id="sy-msg" class="close-hint"></div>`);
    render();
    this.inner.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { if (chosen.length < slots) { chosen.push(b.dataset.g); g.audio.click(); render(); } });
    $('sy-clr').onclick = () => { chosen.length = 0; render(); };
    $('sy-try').onclick = () => {
      if (chosen.length < slots) { $('sy-msg').textContent = `The panel needs ${slots} symbols.`; return; }
      const r = g.puzzles.submit(puzzleId, chosen);
      if (r.ok) { g.audio.success(); this.close(); }
      else { g.audio.fail(); g.audio.hiss(1); $('sy-msg').textContent = 'The fans cough and die. Wrong order.'; chosen.length = 0; render(); }
    };
  }

  record(puzzleId, title, fields, onFail) {
    const g = this.game;
    this.open(`<h3>${esc(title)}</h3><div class="doc" style="white-space:normal">
      <div style="text-align:center;margin-bottom:10px">ATTENDANCE REGISTER — ROOM 104 — FINAL PERIOD</div>
      ${fields.map((f, i) => `<div class="record-row"><label style="color:#4a4030">${esc(f.label)}</label><select data-f="${i}"><option value="">— blank —</option>${f.options.map(o => `<option>${esc(o)}</option>`).join('')}</select></div>`).join('')}
      </div><div class="modal-actions"><button id="rc-try">Write it in ink</button><button data-close>Step back</button></div><div id="rc-msg" class="close-hint">Every line must be filled. He is watching.</div>`);
    $('rc-try').onclick = () => {
      const vals = [...this.inner.querySelectorAll('select')].map(s => s.value);
      if (vals.some(v => !v)) { $('rc-msg').textContent = 'The ink will not take on an incomplete line.'; return; }
      const r = g.puzzles.submit(puzzleId, vals);
      if (r.ok) { g.audio.success(); this.close(); }
      else { g.audio.fail(); this.close(); onFail?.(r.attempts); }
    };
  }

  handleKey(e) {
    if (!this.isOpen) return false;
    if (e.code === 'Escape' || e.code === 'KeyE' || (e.code === 'Tab' && this.inner.querySelector('.inv-list'))) { e.preventDefault(); this.close(); return true; }
    this._modalKeys?.(e);
    return true;
  }

  // ---------- film grain ----------
  _grain() {
    const c = $('grain'), g = c.getContext('2d');
    c.width = 256; c.height = 256;
    const img = g.createImageData(256, 256);
    const tick = () => {
      for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
      setTimeout(() => requestAnimationFrame(tick), 70);
    };
    tick();
  }

  ending(paragraphs) {
    $('ending-text').innerHTML = paragraphs.map((p, i) => `<p style="animation-delay:${i * 2.4}s">${esc(p)}</p>`).join('');
    $('ending').classList.remove('hidden');
  }
}
