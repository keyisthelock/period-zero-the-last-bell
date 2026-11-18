import { NOTES, ITEMS } from './notes.js';
import { examine, pickup, exitDoor } from './helpers.js';

// CHAPTER 4 — Science Wing (Lab 3)
// Puzzle: vent purge panel takes 4 fictional sigils. Notebook: "starts it, fights it, leaves behind, rises".
// Wall chart maps glyphs -> names. Answer: EMBER(△) TIDE(▽) ASH(○) VEIL(◇). ROOT/VESSEL are decoys.
const GLYPHS = [
  { id: 'VESSEL', g: '⊕' }, { id: 'ASH', g: '○' }, { id: 'EMBER', g: '△' },
  { id: 'ROOT', g: '□' }, { id: 'VEIL', g: '◇' }, { id: 'TIDE', g: '▽' },
];

export default {
  id: 'c4', num: 4, title: 'Science Wing',
  objective: 'Find out what happened in Lab 3.',
  spawn: { x: -3.5, z: 4.0, yaw: 0 },
  atmosphere: {
    fog: '#061210', fogDensity: 0.075, ambient: '#1d3a33', ambientIntensity: 0.5,
    drone: { base: 61, color: 520, level: 0.1 }, dustColor: '#a0c8b8',
  },
  grants: { notes: [NOTES.notebook, NOTES.sigils, NOTES.report], items: [ITEMS.report] },

  build(ctx, game) {
    const { P, M, THREE, Tex } = ctx;
    const F = game.flags;
    const wall = new THREE.MeshStandardMaterial({ map: Tex.tiles('#7c8c84', '#4a5450', [8, 3]), roughness: 0.4 });
    const floor = new THREE.MeshStandardMaterial({ map: Tex.tiles('#2c3634', '#151b1a', [8, 8]), roughness: 0.3, metalness: 0.15 });
    ctx.room({ x: 0, z: 0, w: 12, d: 10, h: 3.2, wall, floor, gaps: [{ side: 'e', at: 3, width: 1.1 }] });
    ctx.room({ x: 7.2, z: 3, w: 2.2, d: 2.4, h: 3.2, skip: ['w'], wall: M.std('#20201c') });
    ctx.sign(['STAIRS — BASEMENT ↓', 'STAFF ONLY'], 8.29, 2.2, 3, -Math.PI / 2, { w: 0.8, h: 0.35, bg: '#5a2a24', fg: '#eee' });

    // Benches with glassware
    for (const [x, z] of [[-2.5, -1.2], [2.5, -1.2], [-2.5, 1.6], [2.5, 1.6]]) {
      ctx.place(P.labBench(2.4), x, z);
      for (let i = 0; i < 3; i++) ctx.add(P.flask(['#3c6a5a', '#6a5a2a', '#4a3a6a'][i]), x - 0.8 + i * 0.6 + Math.random() * 0.2, 0.95, z + (Math.random() - 0.5) * 0.4);
      for (const s of [-1, 1]) ctx.place(P.chair(), x + s * 0.6, z + 0.75, 0, { collide: false });
    }
    // Fume hoods
    const hoods = [-2.5, 0.6].map(z => ctx.place(P.fumeHood(), -5.5, z, Math.PI / 2));
    // Chemical shelf + sink cabinets
    ctx.place(P.bookshelf(2.4, 2.2, ['#2e4a3a', '#5a5a2a', '#3a2a4a', '#5a3a2a', '#20302a']), 5.75, -2.2, -Math.PI / 2);
    ctx.place(P.lockerRow(4, '#4a5a54'), 5.75, 0.6, -Math.PI / 2);
    // Scorch marks around the vent/north-east
    const sc1 = P.scorch(1.4); sc1.position.set(3.4, 2.1, -4.88); ctx.scene.add(sc1);
    const sc2 = P.scorch(1.6); sc2.rotation.x = -Math.PI / 2; sc2.position.set(2.8, 0.01, -3.6); ctx.scene.add(sc2);
    const sc3 = P.scorch(1.0); sc3.rotation.x = Math.PI / 2; sc3.position.set(3.2, 3.18, -3.8); ctx.scene.add(sc3);
    // Periodic-style poster (decor) and sigil chart (clue)
    ctx.add(P.poster(['SAFETY FIRST', '', 'Goggles ON', 'Gas taps OFF', 'Exits CLEAR', '', '(by order of', 'the Headmaster)']), -5.88, 1.7, 3, Math.PI / 2);
    const chart = ctx.sign(['COMPOUND SIGILS — LAB STD 7', '△ EMBER — the spark', '▽ TIDE — the quench', '○ ASH — what remains', '◇ VEIL — smoke, vapour', '□ ROOT — earth, base', '⊕ VESSEL — container'], -2.6, 1.75, -4.88, 0, { w: 1.6, h: 1.25, bg: '#d0c8b0', fg: '#1d1d1d', font: 'bold 38px Arial' });
    examine(ctx, chart, NOTES.sigils, 'Study the sigil chart');
    const nb = ctx.add(P.book('#2a2018'), -2.3, 0.95, 1.5, 0.4);
    examine(ctx, nb, NOTES.notebook, 'Read the burnt notebook');

    // Vent panel + grate
    const panel = new THREE.Group();
    P.box(0.7, 0.5, 0.08, M.metal('#3a4440'), 0, 0, 0, panel);
    const scr = P.box(0.5, 0.12, 0.02, M.emissive('#b03a2a', 0.9), 0, 0.12, 0.045, panel); scr.castShadow = false;
    for (let i = 0; i < 4; i++) P.box(0.09, 0.09, 0.02, M.std('#151a18'), -0.2 + i * 0.135, -0.08, 0.045, panel);
    ctx.add(panel, 1.0, 1.4, -4.86);
    ctx.sign(['VENT PURGE CONTROL'], 1.0, 1.75, -4.88, 0, { w: 0.6, h: 0.12 });
    const grate = ctx.add(P.ventGrate(), 3.4, 2.35, -4.86);
    const fanBlades = new THREE.Group(); for (let i = 0; i < 4; i++) { const b = P.box(0.32, 0.06, 0.01, M.metal('#333'), 0, 0, 0, fanBlades); b.rotation.z = i * Math.PI / 2; b.position.set(Math.cos(i * Math.PI / 2) * 0.14, Math.sin(i * Math.PI / 2) * 0.14, 0); }
    ctx.add(fanBlades, 3.4, 2.35, -4.95);
    const folder = ctx.add(P.folder('#8a7a4a'), 3.3, 0.0, -4.35, 0.5);
    folder.visible = false;

    // Lights
    ctx.light(-2.5, -1, { color: '#a8e0c8', intensity: 4.5 }); ctx.light(2.5, -1, { color: '#a8e0c8', intensity: 4.5, flicker: true });
    ctx.light(-2.5, 2.5, { color: '#a8e0c8', intensity: 3.5 }); ctx.light(2.5, 2.5, { color: '#a8e0c8', intensity: 3, flicker: true });
    ctx.emergency(0, 3.05, -4.85, 0); ctx.emergency(-5.85, 2.9, 3, Math.PI / 2); ctx.emergency(5.85, 2.9, 3, -Math.PI / 2);

    // Puzzle
    game.puzzles.register({ id: 'c4_vent', answer: ['EMBER', 'TIDE', 'ASH', 'VEIL'] }, !!F.c4_solved);
    let fanOn = false;
    const openVent = (instant) => {
      scr.material.emissive.set('#3fbf7a'); fanOn = true;
      if (instant) { grate.position.y = 0.05; grate.rotation.x = -1.4; grate.position.z = -4.5; }
      else game.horror.every(dt => { grate.position.y = Math.max(0.05, grate.position.y - dt * 4); grate.rotation.x = Math.max(-1.4, grate.rotation.x - dt * 3); grate.position.z = Math.min(-4.5, grate.position.z + dt); return grate.position.y > 0.05; });
      if (!F.got_reportItem) folder.visible = true;
    };
    if (F.c4_solved) openVent(true);
    ctx.interact(panel, {
      id: 'ventpanel', prompt: () => F.c4_solved ? 'Vent purge (running)' : 'Use the vent purge control',
      onUse: () => { if (!F.c4_solved) game.ui.symbols('c4_vent', 'VENT PURGE — ENTER SEQUENCE', GLYPHS, 4, 'Four sigils. The panel shows no names.'); },
    });
    pickup(ctx, folder, ITEMS.report, {
      prompt: 'Take the folder from the vent',
      note: NOTES.report,
      after: () => {
        game.ui.document(NOTES.report);
        game.setObjective('Take the stairs down to the basement.');
        game.setFlag('c4_report');
      },
    });

    game.on('puzzle:solved', ({ id }) => {
      if (id !== 'c4_vent') return;
      game.setFlag('c4_solved', true, { save: true });
      game.audio.powerOn(); game.audio.hiss(3);
      openVent(false);
      game.audio.thud();
      game.setObjective('Something fell out of the vent.');
      game.dialogue.play([{ s: 'ARIN', t: 'Something was wedged in the duct. Someone hid it.' }]);
    });

    // Exit: requires the report (narrative weight) – always obtainable after solve, so no softlock.
    const door = ctx.door(6, 3, Math.PI / 2, { color: '#3a3a34', label: 'STAIRS' });
    if (F.got_reportItem) door.open(false);
    const exit = exitDoor(ctx, door, {
      canOpen: () => !!F.got_reportItem,
      lockedText: () => F.c4_solved ?'Not yet. Whatever the vent was hiding matters.' : 'Smoke-lock engaged. The vent system controls it.',
      zone: [7.6, 3, 1.2, 1.8],
    });

    // Horror: fume hood glass — handprints and a bang.
    const handTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = 'rgba(30,20,15,0.85)'; for (const [x, y, r] of [[80, 120, 0.2], [170, 100, -0.2]]) { g.save(); g.translate(x, y); g.rotate(r); g.beginPath(); g.ellipse(0, 20, 26, 32, 0, 0, Math.PI * 2); g.fill(); for (let f = 0; f < 5; f++) { g.beginPath(); g.ellipse(-22 + f * 11, -22 - (f === 0 ? -10 : Math.abs(2 - f) * -4), 5, 18, 0, 0, Math.PI * 2); g.fill(); } g.restore(); } return new THREE.CanvasTexture(c); })();
    const prints = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshBasicMaterial({ map: handTex, transparent: true, depthWrite: false }));
    prints.position.set(-5.11, 1.55, 0.6); prints.rotation.y = Math.PI / 2; prints.visible = !!F['ev_c4_hood']; ctx.scene.add(prints);
    game.horror.add({
      id: 'c4_hood', trigger: { type: 'zone', x: -4.2, z: -0.5, w: 1.6, d: 4 },
      run: async h => {
        game.audio.slam(); h.shake(1); prints.visible = true;
        h.redAlert(true); game.audio.stinger(1);
        await h.wait(0.6); game.audio.slam();
        await h.wait(2.5); h.redAlert(false);
        await game.dialogue.play([
          { s: 'ARIN', t: 'Those are hands. Small hands. From the inside.' },
          { s: 'MIRA', t: 'It started in here. I could smell it from Room 104. I banged on the door until the bell.', voice: 'whisper' },
        ]);
      },
    });
    game.horror.add({
      id: 'c4_voss', trigger: { type: 'flag', flag: 'c4_report' },
      run: async h => {
        await h.wait(4);
        h.redAlert(true); game.audio.heartbeat(); h.flickerAll(2);
        await game.dialogue.play([
          { s: 'PA', t: 'That file was closed, Mr. Price. Closed files stay closed.', voice: 'voss' },
          { s: 'MIRA', t: 'The doors were chained. So nobody could skip the last bell.', voice: 'whisper' },
          { s: 'ARIN', t: 'And he told them the building was empty.' },
          { s: 'MIRA', t: 'He told them I went home. He needed the count to be perfect.', voice: 'whisper' },
        ]);
      },
    });

    return {
      intro: () => game.dialogue.play([
        { s: 'ARIN', t: 'Lab 3. The walls are black up by the vents.' },
        { s: 'MIRA', t: 'Don\'t touch the hoods.', voice: 'whisper' },
      ]),
      objective: () => F.got_reportItem ? 'Take the stairs down to the basement.' : F.c4_solved ? 'Something fell out of the vent.' : 'Find out what happened in Lab 3.',
      update: dt => { if (fanOn) fanBlades.rotation.z += dt * 12; exit.update(); },
      debugSolve: () => game.puzzles.submit('c4_vent', ['EMBER', 'TIDE', 'ASH', 'VEIL']),
    };
  },
};
