// Dev-only autoplay: drives the real player controller (W key + turning), real interactions and
// real puzzle UIs through a full playthrough. Usage in console: __autoplay() or __autoplay(chapterIndex)
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function installAutoplay(game) {
  const g = game;
  let running = false;
  const log = (...a) => console.info('[autoplay]', ...a);

  const until = async (fn, timeout = 60000) => { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > timeout) return false; await sleep(100); } return true; };
  const playable = () => g.state === 'playing';
  const quiet = () => until(() => !g.dialogue.busy && playable(), 60000);

  async function walk(...pts) {
    const ch = g.chapterIndex;
    for (const [x, z] of pts) {
      if (g.chapterIndex !== ch) break;
      await until(playable);
      g.player.lookTarget = { x, y: g.player.eye, z };
      await sleep(250);
      let last = g.player.pos.clone(), stuckT = 0;
      g.player.keys.add('KeyW');
      while (Math.hypot(g.player.pos.x - x, g.player.pos.z - z) > 0.2) {
        if (!running || g.chapterIndex !== ch || g.state === 'loading') break;
        if (!playable()) { g.player.keys.delete('KeyW'); await until(playable); g.player.keys.add('KeyW'); }
        g.player.lookTarget = { x, y: g.player.eye, z };
        await sleep(100);
        if (g.player.pos.distanceTo(last) < 0.02) { stuckT += 0.1; if (stuckT > 1.2) g.player.noclip = true; } else stuckT = 0;
        last.copy(g.player.pos);
      }
      g.player.keys.delete('KeyW'); g.player.noclip = false;
    }
  }
  async function look(x, y, z, ms = 900) { g.player.lookTarget = { x, y, z }; await sleep(ms); }
  async function use(id, x, y, z) {
    await until(playable);
    if (x !== undefined) await look(x, y, z);
    const d = g.interaction.list.find(d => d.id === id);
    if (!d) { log('missing interactable', id); return; }
    g.bus.emit('interact', id); d.onUse?.(d);
    await sleep(300);
  }
  async function closeModal(ms = 3500) { await sleep(ms); if (g.ui.isOpen) g.ui.close(); await sleep(300); }
  const click = async (sel, ms = 350) => { const el = document.querySelector(sel); if (el) el.click(); await sleep(ms); };
  async function nextChapter(i) { await until(() => g.chapterIndex === i && g.state === 'playing', 20000); await sleep(1500); }

  const chapters = [
    async () => { // 1 Detention
      await quiet();
      await use('pk_slip', -0.2, 0.77, 1.25); await closeModal(4000);
      await walk([1.0, 2.1], [1.0, -1.3], [0.6, -1.6]);
      await use('drawer', 0.6, 0.7, -2.6);
      await sleep(5000); await quiet();
      await use('ex_clock', 2.6, 2.55, -3.87); await closeModal(3500);
      await walk([3.3, -1.0]);
      await use('ex_caretaker', 4.38, 1.65, -0.2); await closeModal(4000);
      await use('keypad', 4.38, 1.3, -0.85);
      for (const k of ['0', '3', '4', '7', '↵']) await click(`[data-k="${k}"]`, 450);
      await sleep(2500); await quiet();
      await walk([3.8, -2], [5.2, -2], [6.3, -2]);
      await nextChapter(1);
    },
    async () => { // 2 East Corridor
      await quiet();
      await walk([0, -9.6], [-2.0, -9.8]);
      await sleep(400); await quiet();
      await use('ex_maintlog', -2.3, 0.9, -9.3); await closeModal(5000);
      await walk([0, -10], [-0.6, -18]);
      await use('breaker_LIGHTING', -1.53, 1.4, -18);
      await look(0, 1.6, -29.6, 4500);
      await quiet();
      await walk([0.6, -6]);
      await use('breaker_DOORS', 1.53, 1.4, -6);
      await walk([0.6, -24]);
      await quiet();
      await use('breaker_ALARM', 1.53, 1.4, -24);
      await sleep(1500); await quiet();
      await walk([0, -29.6]);
      await use('exit_door', 0, 1.2, -31);
      await sleep(800);
      await walk([0, -32.9]);
      await nextChapter(2);
    },
    async () => { // 3 Library
      await quiet();
      await walk([-1.6, 4.4], [-4, 3.2], [-4, 0.5]);
      await sleep(2500); await quiet();
      await use('pk_volII', -4, 0.05, -0.4); await sleep(1500);
      await walk([-4, 2.6], [-6.0, 2.0], [-6.0, -0.3]);
      await use('pk_volIV', -6.2, 0.62, -1.2); await sleep(1500);
      await walk([-6.0, 2.0], [-4, 2.6], [-2, 2.45], [-1.6, 4.4], [1.6, 4.4], [1.6, 1.0]);
      await use('pk_volI', 0.5, 0.8, 0.3); await sleep(1500);
      await walk([1.6, 2.45], [3.2, 2.5]);
      await use('pk_volIII', 4.0, 0.55, 2.4); await sleep(1500); await quiet();
      await walk([1.6, 2.45], [1.6, -2.6], [-0.1, -2.6]);
      await use('ex_cipher', -0.1, 0.81, -3.45); await closeModal(5000);
      await walk([1.6, -3.2]);
      await use('catalogue', 1.6, 0.7, -3.8);
      const target = 'HALE';
      for (let w = 0; w < 4; w++) { const n = target.charCodeAt(w) - 65; for (let k = 0; k < n; k++) await click(`[data-dn="${w}"]`, 90); await sleep(250); }
      await sleep(600); await click('#wh-try', 600);
      await closeModal(5000);
      await sleep(1000); await quiet(); await sleep(2500);
      await walk([3.9, -3.3], [4.5, -4.8], [4.5, -6.6], [4.5, -7.7]);
      await nextChapter(3);
    },
    async () => { // 4 Science Wing
      await quiet();
      await walk([-2.3, 2.7]);
      await use('ex_notebook', -2.3, 0.95, 1.5); await closeModal(5000);
      await walk([-4.2, 2.6], [-4.2, -0.3]);
      await sleep(2000); await quiet();
      await walk([-4.4, -3.6], [-2.6, -3.7]);
      await use('ex_sigils', -2.6, 1.75, -4.88); await closeModal(5000);
      await walk([1.0, -3.8]);
      await use('ventpanel', 1.0, 1.4, -4.86);
      for (const id of ['EMBER', 'TIDE', 'ASH', 'VEIL']) await click(`[data-g="${id}"]`, 600);
      await click('#sy-try', 600);
      await sleep(1800); await quiet();
      await walk([2.6, -3.7]);
      await use('pk_reportItem', 3.3, 0.02, -4.35); await closeModal(7000);
      await sleep(4500); await quiet();
      await walk([4.6, -3.6], [4.6, 3]);
      await use('exit_door', 6, 1.2, 3); await sleep(800);
      await walk([6.6, 3], [7.7, 3]);
      await nextChapter(4);
    },
    async () => { // 5 Basement Archive
      await quiet();
      await walk([0, 1.0], [-4.35, 0.15]);
      await use('cabGH', -4.35, 1.15, -0.7); await closeModal(4500);
      await look(0, 1.8, -3.5, 1500);
      await sleep(4000); await quiet();
      await walk([0, 0.4], [0, -3.6]);
      await use('gate', 0, 1.1, -4.5); await sleep(1500);
      await walk([0, -5.7]);
      await sleep(1500); await quiet();
      const fill = async vals => {
        await use('ledger', 0, 1.1, -6.8);
        const sels = document.querySelectorAll('#modal-inner select');
        for (let i = 0; i < 4; i++) { sels[i].value = vals[i]; await sleep(700); }
        await click('#rc-try', 600);
      };
      await fill(['HALE', '15 OCT 1994', '15:47', 'PRESENT']); // one honest mistake
      await sleep(1000); await quiet();
      await fill(['HALE', '14 OCT 1994', '15:47', 'PRESENT']);
      await sleep(2000);
      await until(() => g.state === 'playing' && g.flags.c5_solved, 90000);
      await sleep(1200);
      await walk([0, -3.6], [0, 1.0], [0, 5], [6.4, 5], [8.5, 5]);
    },
  ];

  window.__autoplay = async (from = 0) => {
    if (running) return 'already running';
    running = true;
    g.save.clear();
    if (from === 0) await g.newGame(); else await g.selectChapter(from);
    g.flags.flashlight = g.flags.flashlight || from > 0;
    for (let i = from; i < chapters.length && running; i++) {
      log('chapter', i + 1);
      try { await chapters[i](); } catch (e) { console.error('[autoplay] failed in chapter', i + 1, e); break; }
    }
    running = false; g.player.keys.clear(); g.player.lookTarget = null;
    log('done, state =', g.state);
    return g.state;
  };
  window.__autoplayStop = () => { running = false; g.player.keys.clear(); };
}
