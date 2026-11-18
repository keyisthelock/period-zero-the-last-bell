import { NOTES, ITEMS } from './notes.js';
import { examine, pickup, figure, inBox } from './helpers.js';

// CHAPTER 5 — Basement Archive
// 1) Find Mira's file in drawer "G–H" (name from ch.3) -> brass key.  2) Unlock the register cage.
// 3) Reconstruct the erased line: HALE / 14 OCT 1994 (carving, register stub, report) / 15:47 (clock + report) / PRESENT (carving, report).
const FIELDS = [
  { label: 'SURNAME', options: ['PRICE', 'VOSS', 'HALE', 'OKAFOR', 'ADEBAYO'] },
  { label: 'DATE', options: ['13 OCT 1994', '14 OCT 1994', '15 OCT 1994'] },
  { label: 'LAST BELL', options: ['15:30', '15:40', '15:47', '16:00'] },
  { label: 'STATUS', options: ['ABSENT', 'DISMISSED', 'WITHDRAWN', 'PRESENT'] },
];
const ANSWER = ['HALE', '14 OCT 1994', '15:47', 'PRESENT'];

export const ENDING = [
  'The door opens onto grey morning. The air smells of rain, not smoke.',
  'Behind Arin, the last bell rings once — clean, ordinary — and then never again.',
  'Three weeks later the county reopened Inquiry 94/117. The missing register page was never found. It didn\'t need to be.',
  'In Room 104, beneath an old carving on a desk in the front row, someone has added a line in fresh ink:',
  'MIRA HALE — PRESENT.',
  'PERIOD ZERO: THE LAST BELL — THE END',
];

export default {
  id: 'c5', num: 5, title: 'Basement Archive',
  objective: 'Find Mira\'s file.',
  spawn: { x: 0, z: 7, yaw: 0 },
  ending: ENDING,
  atmosphere: {
    fog: '#0b0605', fogDensity: 0.08, ambient: '#3a2a24', ambientIntensity: 0.75,
    drone: { base: 36.7, color: 220, level: 0.14, hum: false }, dustColor: '#b09080', flashIntensity: 30,
  },
  grants: {},

  build(ctx, game) {
    const { P, M, THREE, Tex } = ctx;
    const F = game.flags;
    const conc = new THREE.MeshStandardMaterial({ map: Tex.concrete([5, 1]), roughness: 0.95 });
    const cfloor = new THREE.MeshStandardMaterial({ map: Tex.concrete([6, 6]), roughness: 0.7, metalness: 0.05 });
    ctx.room({ x: 0, z: 0, w: 14, d: 16, h: 2.8, wall: conc, floor: cfloor, ceil: conc, gaps: [{ side: 'e', at: 5, width: 1.1 }] });
    ctx.room({ x: 8.2, z: 5, w: 2.2, d: 2.4, h: 2.8, skip: ['w'], wall: M.std('#d8dccf'), floor: M.std('#8a8a80') });
    const daylight = new THREE.PointLight('#e8eef0', 0, 6, 1.5); daylight.position.set(8.6, 1.8, 5); ctx.scene.add(daylight);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.4), M.emissive('#dfe8ec', 0.0)); sky.position.set(9.28, 1.2, 5); sky.rotation.y = -Math.PI / 2; ctx.scene.add(sky);

    // Cabinet rows
    const labelsL = ['A–B', 'C–D', 'E–F', 'G–H', 'I–J', 'K–L', 'M–N', 'O–P', 'Q–R', 'S–Z'];
    const labelsR = ['STAFF', 'STAFF', '1991', '1992', '1993', '1994', '1994', '1995', 'MISC', 'MISC'];
    let hCab = null;
    labelsL.forEach((l, i) => {
      const c = ctx.place(P.filingCabinet([l, '', '', '']), -6.0 + i * 0.55, -1, 0);
      if (l === 'G–H') hCab = c;
      else ctx.interact(c, { id: 'cab' + l, prompt: `Files ${l}`, onUse: () => { game.audio.click(); game.ui.toast(`Student files ${l}. Hundreds of names. Not the one you need.`); } });
    });
    labelsR.forEach((l, i) => {
      const c = ctx.place(P.filingCabinet([l, '', '', '']), 1.05 + i * 0.55, -1, 0);
      if (l === '1994') ctx.interact(c, { id: 'cab94' + i, prompt: 'Files 1994', onUse: () => { game.audio.click(); game.ui.toast('Every 1994 folder is here, in order. Except one gap in the H\'s, where something was pulled out.'); } });
    });
    for (let i = 0; i < 10; i++) { ctx.place(P.filingCabinet(), -6.0 + i * 0.55, 3, 0); ctx.place(P.filingCabinet(), 1.05 + i * 0.55, 3, 0); }
    ctx.sign(['STUDENT RECORDS'], -3.5, 2.2, -1.34, 0, { w: 1.2, h: 0.2 });
    // Boxes & pipes
    for (const [x, z] of [[-6.3, 6.5], [-5.6, 6.8], [6.2, -6.5], [-6.4, -6]]) { const b = new THREE.Group(); P.box(0.6, 0.45, 0.45, M.std('#5a4a34'), 0, 0.225, 0, b); P.box(0.55, 0.4, 0.4, M.std('#4a3c2a'), 0.05, 0.65, 0, b); b.userData.size = [0.6, 0.45]; ctx.place(b, x, z, Math.random()); }
    for (const z of [-3, 5.5]) { const p = P.pipe(14, 0.09, 'x', '#5a4a38'); p.position.set(0, 2.55, z); ctx.scene.add(p); }
    for (const x of [-6.6, 6.6]) { const p = P.pipe(16, 0.07, 'z', '#4a4a40'); p.position.set(x, 2.4, 0); ctx.scene.add(p); }
    const boiler = new THREE.Group(); P.cyl(0.6, 0.6, 2.2, M.metal('#4a3a2a'), 0, 1.1, 0, boiler); boiler.userData.size = [1.2, 1.2]; ctx.place(boiler, 5.8, 7.0);

    // Register cage
    const bars = M.metal('#3a3e3b');
    const barRow = (x1, z1, x2, z2) => { const n = Math.ceil(Math.hypot(x2 - x1, z2 - z1) / 0.14); for (let i = 0; i <= n; i++) P.box(0.025, 2.5, 0.025, bars, x1 + (x2 - x1) * i / n, 1.25, z1 + (z2 - z1) * i / n, ctx.scene); };
    barRow(-1.8, -4.5, -0.55, -4.5); barRow(0.55, -4.5, 1.8, -4.5); barRow(-1.8, -4.5, -1.8, -7.9); barRow(1.8, -4.5, 1.8, -7.9);
    P.box(3.6, 0.05, 0.05, bars, 0, 2.5, -4.5, ctx.scene);
    ctx.collider(-1.175, -4.5, 1.25, 0.2); ctx.collider(1.175, -4.5, 1.25, 0.2); ctx.collider(-1.8, -6.2, 0.2, 3.4); ctx.collider(1.8, -6.2, 0.2, 3.4);
    const gate = new THREE.Group(); for (let i = 0; i <= 7; i++) P.box(0.025, 2.3, 0.025, bars, -0.5 + i * 0.143, 1.15, 0, gate); P.box(1.05, 0.05, 0.04, bars, 0, 1.1, 0, gate); P.box(0.1, 0.14, 0.06, M.metal('#8a7a50'), 0.4, 1.1, 0.03, gate);
    const gatePivot = new THREE.Group(); gatePivot.position.set(-0.55, 0, -4.5); gatePivot.add(gate); gate.position.x = 0.55; ctx.scene.add(gatePivot);
    const gateCol = ctx.collider(0, -4.5, 1.1, 0.2);
    const podium = ctx.place(P.podium(), 0, -6.8);
    ctx.sign(['REGISTER — DO NOT AMEND'], 0, 2.2, -7.88, 0, { w: 1.4, h: 0.22, bg: '#4a1a14', fg: '#e0d0c0' });

    // Lights: hanging bulbs + red emergency
    const bulbs = [[-3.5, 5], [3.5, 5], [-3.5, 1], [3.5, 1], [0, -2.6]].map(([x, z], i) => ctx.lamp(x, 2.3, z, { color: '#d89a58', intensity: 2.2, distance: 6 }));
    bulbs[1].flicker = true; bulbs[3].flicker = true;
    ctx.emergency(0, 2.6, -7.85, 0, { always: true, intensity: 2.5 });
    ctx.emergency(-6.85, 2.5, 0, Math.PI / 2, { always: true, intensity: 2 });
    ctx.emergency(6.85, 2.5, -3, -Math.PI / 2);

    // Mira's file -> key
    const openGate = (instant) => {
      gateCol.disabled = true;
      if (instant) { gatePivot.rotation.y = 1.8; return; }
      game.audio.door(true);
      game.horror.every(dt => { gatePivot.rotation.y = Math.min(1.8, gatePivot.rotation.y + dt * 1.2); return gatePivot.rotation.y < 1.8; });
    };
    if (F.c5_gate) openGate(true);
    ctx.interact(hCab, {
      id: 'cabGH', prompt: () => F.got_cageKey ? 'Files G–H (empty folder)' : 'Search files G–H',
      onUse: () => {
        if (F.got_cageKey) { game.ui.document(NOTES.halefile); return; }
        game.inventory.addNote(NOTES.halefile);
        game.pickup(ITEMS.key, null, null);
        game.ui.document(NOTES.halefile);
        game.setObjective('Open the register cage.');
      },
    });
    ctx.interact(gate, {
      id: 'gate', prompt: () => F.c5_gate ? 'Cage gate (open)' : 'Cage gate',
      onUse: () => {
        if (F.c5_gate) return;
        if (!game.inventory.has('cageKey')) { game.audio.thud(); game.ui.toast('Padlocked. The tag reads: REGISTER CAGE.'); return; }
        game.setFlag('c5_gate', true, { save: true }); openGate(false);
        game.setObjective('Restore the erased line in the register.');
      },
    });

    // The headmaster
    const voss = figure(ctx, P.headmaster(), 0, -3, Math.PI);
    const mira = figure(ctx, P.miraGhost(), 0.8, -3.2, Math.PI);
    if (F.c5_gate && !F.c5_solved) voss.show(0, -2.6, { x: 0, z: -6 });

    game.puzzles.register({ id: 'c5_register', answer: ANSWER }, !!F.c5_solved);
    ctx.interact(podium, {
      id: 'ledger', prompt: () => F.c5_solved ? 'The register (complete)' : 'Write in the register',
      onUse: () => {
        if (F.c5_solved) return;
        game.ui.record('c5_register', 'THE ERASED LINE', FIELDS, attempts => {
          const h = game.horror;
          game.audio.stinger(1.1); h.shake(1); h.flickerAll(1);
          const z = Math.max(-3.9, voss.obj.position.z - 0.5);
          voss.show(0, z, game.player.pos);
          const hints = [
            [{ s: 'VOSS', t: 'Incorrect. Absent is absent.', voice: 'voss' }],
            [{ s: 'VOSS', t: 'You are wasting the bell, Mr. Price.', voice: 'voss' }, { s: 'MIRA', t: 'Everything he wrote was a lie. Write what really happened.', voice: 'whisper' }],
            [{ s: 'MIRA', t: 'My name. The day it happened. When the bell rang. And that I was here.', voice: 'whisper' }],
          ];
          game.dialogue.play(hints[Math.min(attempts - 1, 2)], { interrupt: true });
        });
      },
    });

    // Exit door
    const door = ctx.door(7, 5, Math.PI / 2, { color: '#2a2a26', label: 'EXIT' });
    const setDay = () => { daylight.intensity = 8; sky.material.emissiveIntensity = 2.2; };
    if (F.c5_solved) { door.open(false); setDay(); voss.hide(); }
    ctx.interact(door.leaf, { id: 'exitdoor', prompt: () => door.isOpen ? 'Daylight' : 'Exit door', onUse: () => { if (!door.isOpen) { game.audio.thud(); game.ui.toast('Chained shut. From the inside.'); } } });

    // Ending sequence
    game.on('puzzle:solved', async ({ id }) => {
      if (id !== 'c5_register') return;
      game.setFlag('c5_solved', true, { save: true });
      const h = game.horror;
      game.cutscene(true);
      voss.show(0, Math.min(voss.obj.position.z, -3.0), game.player.pos);
      game.player.lookTarget = { x: 0, y: 1.8, z: voss.obj.position.z };
      await h.wait(0.8);
      game.audio.bell(false);
      mira.show(0.9, voss.obj.position.z - 0.2, game.player.pos);
      await game.dialogue.play([
        { s: 'VOSS', t: 'Attendance is final.', voice: 'voss' },
        { s: 'ARIN', t: 'Then it\'s finally right. She was here. You chained the doors and wrote her out.' },
        { s: 'MIRA', t: 'Hale. Present.' },
        { s: 'VOSS', t: '...Present.', voice: 'voss', d: 2.6 },
      ]);
      // Voss dissolves
      game.audio.hiss(2.5); game.audio.whisper(2);
      voss.obj.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; } });
      h.every(dt => { let alive = false; voss.obj.traverse(o => { if (o.material) { o.material.opacity = Math.max(0, o.material.opacity - dt * 0.5); alive ||= o.material.opacity > 0; } }); voss.obj.scale.y = Math.max(0.01, voss.obj.scale.y - dt * 0.15); if (!alive) voss.hide(); return alive; });
      await h.wait(2.2);
      h.redAlert(false);
      await game.dialogue.play([
        { s: 'MIRA', t: 'Thank you for staying after the bell, Arin.' },
        { s: 'ARIN', t: 'Will you be—' },
        { s: 'MIRA', t: 'Counted. That\'s all I wanted. Go home. You\'re late.' },
      ]);
      mira.hide();
      await h.wait(0.5);
      door.open(); setDay(); game.audio.door(true);
      game.cutscene(false);
      game.setObjective('Leave.');
    });

    // Horror 1: taking the key brings him out of the dark, walking toward you.
    game.horror.add({
      id: 'c5_approach', trigger: { type: 'flag', flag: 'got_cageKey' },
      run: async h => {
        await h.wait(1.0);
        voss.show(0, -3.5, game.player.pos); voss.walkTo(game.player.pos.x, game.player.pos.z, 0.7);
        h.redAlert(true); game.audio.stinger(1.2); game.audio.heartbeat();
        game.dialogue.play([{ s: 'VOSS', t: 'Those files are confidential, Mr. Price.', voice: 'voss' }]);
        for (let i = 0; i < 8; i++) { await h.wait(0.5); game.audio.heartbeat(); }
        await h.blackout(1.0); voss.hide(); h.redAlert(false);
        game.dialogue.play([{ s: 'ARIN', t: 'I\'m not leaving her name blank.' }]);
      },
    });
    // Horror 2: entering the cage — he is waiting outside it.
    game.horror.add({
      id: 'c5_cage', trigger: { type: 'zone', x: 0, z: -5.8, w: 3.2, d: 2.4, requires: 'c5_gate' },
      run: async h => {
        if (F.c5_solved) return;
        game.audio.slam(); h.shake(0.8); h.redAlert(true);
        voss.show(0, -2.6, game.player.pos);
        await game.dialogue.play([
          { s: 'VOSS', t: 'Attendance is final, Mr. Price. Sit down.', voice: 'voss' },
          { s: 'MIRA', t: 'He can\'t touch the register. Only the ink can. Fill in my line.', voice: 'whisper' },
        ]);
      },
    });
    // Ambient steam
    let steamT = 6;

    return {
      intro: () => game.dialogue.play([
        { s: 'ARIN', t: 'The archive. Every name this school ever had.' },
        { s: 'MIRA', t: 'Mine is down here somewhere. What\'s left of it.', voice: 'whisper' },
      ]),
      objective: () => F.c5_solved ? 'Leave.' : F.c5_gate ? 'Restore the erased line in the register.' : F.got_cageKey ? 'Open the register cage.' : 'Find Mira\'s file.',
      update: dt => {
        if (voss.obj.visible && !voss.walking && game.state === 'playing') voss.face(game.player.pos);
        steamT -= dt; if (steamT < 0) { steamT = 7 + Math.random() * 8; game.audio.hiss(1.5); }
        if (F.c5_solved && door.isOpen && inBox(game.player.pos, 8.4, 5, 1.4, 2)) game.finish();
      },
      debugSolve: () => { if (!F.c5_gate) { game.inventory.add(ITEMS.key); game.setFlag('got_cageKey'); game.setFlag('c5_gate'); openGate(true); } game.puzzles.submit('c5_register', ANSWER); },
    };
  },
};
