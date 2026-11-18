import { NOTES } from './notes.js';
import { examine, exitDoor, figure } from './helpers.js';

// CHAPTER 2 — East Corridor
// Puzzle: three breakers restored in order LIGHTING -> DOORS -> ALARM (maintenance log). Wrong order trips all back (no softlock).
const ORDER = ['LIGHTING', 'DOORS', 'ALARM'];

export default {
  id: 'c2', num: 2, title: 'East Corridor',
  objective: 'Restore power to the east corridor.',
  spawn: { x: 0, z: -0.3, yaw: 0 },
  atmosphere: {
    fog: '#050a0a', fogDensity: 0.085, ambient: '#22302d', ambientIntensity: 0.5,
    drone: { base: 49, color: 300, level: 0.12, hum: false }, flashIntensity: 30, dustColor: '#7f9690',
  },
  grants: { notes: [NOTES.maintlog, NOTES.trophy] },

  build(ctx, game) {
    const { P, M, THREE } = ctx;
    const F = game.flags;
    const floor = new THREE.MeshStandardMaterial({ map: ctx.Tex.tiles('#3d4a46', '#1f2826'), roughness: 0.35, metalness: 0.1 });
    ctx.room({ x: 0, z: -15, w: 3.2, d: 32, h: 3, floor, gaps: [{ side: 'w', at: 5, width: 1.0 }, { side: 'n', at: 0, width: 1.8 }] });
    ctx.room({ x: -2.8, z: -10, w: 2.2, d: 2.4, h: 3, skip: ['e'] });            // maintenance closet
    ctx.room({ x: 0, z: -32.5, w: 3, d: 3, h: 3, skip: ['s'] });                   // fire-door vestibule
    ctx.add(P.door({ label: 'ROOM 104' }).group, 0, 0, 0.88, Math.PI);           // the door you came through

    // Lockers
    for (const z of [-2.5, -13, -28]) ctx.place(P.lockerRow(6, '#3a4d48'), 1.275, z, -Math.PI / 2);
    for (const z of [-4, -14, -22, -27.6]) ctx.place(P.lockerRow(6, '#40504a'), -1.275, z, Math.PI / 2);
    // Decorative classroom doors
    for (const [x, z, r, l] of [[1.52, -8.5, -Math.PI / 2, '105'], [-1.52, -25, Math.PI / 2, '108'], [1.52, -21, -Math.PI / 2, '107'], [-1.52, -7, Math.PI / 2, '106']]) {
      const d = P.door({ label: l }); ctx.add(d.group, x, 0, z, r);
      ctx.interact(d.leaf, { id: 'locked' + l, prompt: `Room ${l}`, onUse: () => { game.audio.thud(); game.ui.toast('Locked. Something on the other side shifts its weight.'); } });
    }
    // Trophy case
    const tc = new THREE.Group();
    P.box(0.45, 1.0, 1.8, M.wood('#3a2a1e'), 0, 0.5, 0, tc);
    P.box(0.42, 1.0, 1.75, M.std('#a8c0b8', { transparent: true, opacity: 0.15, roughness: 0.05 }), 0, 1.5, 0, tc).castShadow = false;
    for (let i = 0; i < 4; i++) { P.cyl(0.05, 0.03, 0.22, M.std('#8a7440', { metalness: 0.8, roughness: 0.35 }), 0, 1.12, -0.6 + i * 0.4, tc); }
    tc.userData.size = [0.45, 1.8];
    ctx.place(tc, 1.35, -18.5);
    examine(ctx, tc, NOTES.trophy, 'Look in the trophy case');
    // Notice boards / signs
    ctx.sign(['NO RUNNING IN', 'THE CORRIDORS'], -1.48, 1.9, -11.5, Math.PI / 2, { w: 0.9, h: 0.4 });
    ctx.sign(['LIBRARY ↑'], 0, 2.45, -30.85, 0, { w: 0.8, h: 0.22 });
    ctx.sign(['FIRE ASSEMBLY', 'POINT: FIELD'], 1.48, 1.7, -16, -Math.PI / 2, { w: 0.6, h: 0.35, bg: '#2f6a4a', fg: '#e8f0e8' });
    ctx.add(P.poster(['MISSING?', '', 'Report all', 'absences to', 'the Headmaster', '', 'Absent is', 'unacceptable.']), -1.48, 1.6, -30, Math.PI / 2);
    // Pipes along ceiling
    const pp = P.pipe(32, 0.06, 'z'); pp.position.set(1.2, 2.8, -15); ctx.scene.add(pp);

    // Maintenance closet contents
    ctx.place(P.bookshelf(1.2, 1.8, ['#556', '#655', '#565', '#444']), -3.6, -10, Math.PI / 2);
    const bucket = P.cyl(0.18, 0.15, 0.35, M.metal('#5a6a60'), -2.4, 0.175, -10.9, ctx.scene);
    const log = ctx.add(P.paper(0.21, 0.29), -2.3, 0.0, -9.3, 0.4);
    const logStand = new THREE.Group(); P.box(0.5, 0.9, 0.4, M.wood('#4a3a2a'), 0, 0.45, 0, logStand); logStand.userData.size = [0.5, 0.4];
    ctx.place(logStand, -2.3, -9.3); log.position.y = 0.905;
    examine(ctx, log, NOTES.maintlog, 'Read the maintenance log');
    ctx.light(-2.8, -10, { intensity: 2.5, distance: 4, flicker: true, color: '#d8e8c0' });

    // Lights (all off until LIGHTING restored)
    const lights = [-2, -7, -12, -17, -22, -27].map((z, i) => ctx.light(0, z, { intensity: 5, distance: 8, flicker: i === 3, off: true }));
    ctx.emergency(0, 2.85, -0.8, Math.PI, { always: true, intensity: 2.2, distance: 6 });
    ctx.emergency(0, 2.85, -15, 0, { always: true, intensity: 2.2, distance: 7 });
    ctx.emergency(0, 2.85, -30.7, 0, { always: true, intensity: 3, distance: 7 });

    // Breakers
    const breakers = {
      DOORS: ctx.add(P.breakerPanel('B-03  DOORS', '#3a7ab0'), 1.53, 1.4, -6, -Math.PI / 2),
      LIGHTING: ctx.add(P.breakerPanel('B-12  LIGHTING', '#c8c070'), -1.53, 1.4, -18, Math.PI / 2),
      ALARM: ctx.add(P.breakerPanel('B-07  ALARM', '#b03a2a'), 1.53, 1.4, -24, -Math.PI / 2),
    };
    const setLever = (k, on) => { const b = breakers[k]; b.userData.lever.rotation.x = on ? -0.6 : 0.6; b.userData.lamp.material.emissiveIntensity = on ? 2.5 : 0.05; };
    const setLights = on => lights.forEach(l => l.off = !on);

    const puzzle = game.puzzles.register({ id: 'c2_breakers', answer: ORDER }, !!F.c2_solved);
    if (F.c2_solved) { ORDER.forEach(k => setLever(k, true)); setLights(true); }

    for (const k of ORDER) {
      ctx.interact(breakers[k], {
        id: 'breaker_' + k,
        prompt: () => (F.c2_solved || puzzle.progress.includes(k)) ? `Breaker ${k} (on)` : `Throw breaker: ${k}`,
        onUse: () => {
          if (F.c2_solved || puzzle.progress.includes(k)) return;
          const r = game.puzzles.step('c2_breakers', k);
          game.audio.click();
          if (r.ok) {
            setLever(k, true); game.audio.powerOn();
            if (k === 'LIGHTING') { setLights(true); game.setFlag('c2_light'); }
            if (k === 'DOORS') game.ui.toast('Somewhere ahead, a mag-lock clunks.');
          } else {
            setLever(k, true);
            game.audio.electric(1.0); game.horror.shake(0.5);
            setTimeout(() => { ORDER.forEach(o => setLever(o, false)); setLights(false); game.audio.thud(); }, 350);
            game.ui.toast('The breakers trip. Everything drops back to zero.');
            if (r.lost.length === 0 && k !== 'LIGHTING') game.dialogue.play([{ s: 'ARIN', t: 'Nothing. There must be an order to this.' }]);
          }
        },
      });
    }

    // Exit fire door
    const door = ctx.door(0, -31, 0, { w: 1.6, color: '#5a2420', label: 'FIRE EXIT' });
    if (F.c2_solved) door.open(false);
    game.on('puzzle:solved', ({ id }) => {
      if (id !== 'c2_breakers') return;
      game.setFlag('c2_solved', true, { save: true });
      game.setObjective('Go to the library.');
      game.audio.bell(true);
      game.dialogue.play([
        { s: 'PA', t: 'Running in the corridors is not permitted, Mr. Price.', voice: 'voss' },
        { s: 'ARIN', t: 'How does he know my name?' },
        { s: 'MIRA', t: 'The library. My things are still there. He never liked books he couldn\'t edit.', voice: 'whisper' },
      ]);
    });
    const exit = exitDoor(ctx, door, { canOpen: () => F.c2_solved, lockedText: 'The fire door is mag-locked. No power.', zone: [0, -32.8, 2.2, 1.6] });

    // Horror: the headmaster at the end of the corridor once the lights come on.
    const voss = figure(ctx, P.headmaster(), 0, -29.5, 0);
    game.horror.add({
      id: 'c2_shadow', trigger: { type: 'flag', flag: 'c2_light' },
      run: async h => {
        await h.wait(1.2);
        voss.show(0, -29.6, game.player.pos);
        lights[5].flickerUntil = h.time + 4;
        game.audio.stinger(0.9); game.audio.heartbeat();
        for (let t = 0; t < 50 && voss.obj.visible; t++) { await h.wait(0.1); if (game.player.pos.z < -19) break; }
        await h.blackout(0.5); voss.hide();
        game.dialogue.play([{ s: 'ARIN', t: 'Someone was standing there. Tall. A hat like— like a graduation cap.' }]);
      },
    });
    game.horror.add({
      id: 'c2_lockers', trigger: { type: 'zone', x: 0, z: -21, w: 3, d: 2 },
      run: async h => {
        game.audio.slam(); h.shake(0.8); await h.wait(0.35); game.audio.slam(); await h.wait(0.25); game.audio.slam();
        game.audio.whisper(2.5);
        await h.wait(0.8);
        await game.dialogue.play([{ s: 'MIRA', t: 'They used to hide in the lockers when he did the count. It never helped.', voice: 'whisper' }]);
      },
    });
    game.horror.add({
      id: 'c2_closet', trigger: { type: 'zone', x: -2.8, z: -10, w: 2, d: 2.2 },
      run: async () => game.dialogue.play([
        { s: 'MIRA', t: 'The lights went out like this before. On the last day.', voice: 'whisper' },
        { s: 'ARIN', t: 'What happened on the last day?' },
        { s: 'MIRA', t: 'He kept the doors shut so the count would be right.', voice: 'whisper' },
      ]),
    });

    return {
      intro: () => game.dialogue.play([
        { s: 'ARIN', t: 'Every light in the corridor is dead.' },
        ...(F.flashlight ? [] : []),
        { s: 'MIRA', t: 'Breakers. Somewhere on this floor. Be careful what you wake first.', voice: 'whisper' },
        { s: 'ARIN', t: 'Who are you?' },
        { s: 'MIRA', t: 'Someone who stayed after the bell.', voice: 'whisper' },
      ]),
      update: () => exit.update(),
      debugSolve: () => { ORDER.forEach(k => { if (!puzzle.progress.includes(k)) { game.puzzles.step('c2_breakers', k); setLever(k, true); } }); setLights(true); },
    };
  },
};
