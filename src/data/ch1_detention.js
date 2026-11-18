import { NOTES, ITEMS } from './notes.js';
import { examine, pickup, exitDoor } from './helpers.js';

// CHAPTER 1 — Detention Classroom (Room 104)
// Puzzle: keypad. Clues: stopped clock (3:47) + caretaker notice ("time the last bell rang, HHMM") + slip/chalkboard ("dismissed at the last bell").
export default {
  id: 'c1', num: 1, title: 'Detention',
  objective: 'Find a way out of Room 104.',
  spawn: { x: -0.2, z: 2.1, yaw: 0 },
  atmosphere: {
    fog: '#081110', fogDensity: 0.06, ambient: '#2b403c', ambientIntensity: 0.75,
    moon: { color: '#5d7f99', intensity: 0.55, pos: [-10, 8, 3], target: [0, 0, 0] },
    drone: { base: 55, color: 380, level: 0.1 },
  },
  grants: { flags: { flashlight: true }, items: [ITEMS.slip, ITEMS.flashlight], notes: [NOTES.clock, NOTES.caretaker, NOTES.carving, NOTES.register] },

  build(ctx, game) {
    const { P, M, THREE } = ctx;
    const F = game.flags;
    ctx.room({ x: 0, z: 0, w: 9, d: 8, h: 3.2, gaps: [{ side: 'e', at: -2, width: 1.1 }] });
    ctx.room({ x: 5.7, z: -2, w: 2.2, d: 2.4, h: 3.2, skip: ['w'] }); // dark corridor stub
    ctx.sign(['EAST CORRIDOR →'], 6.79, 2.2, -2, -Math.PI / 2, { w: 0.9, h: 0.25 });

    // Chalkboard
    const chalk = P.sign(['DETENTION — ROOM 104', 'LATE IS ABSENT.', 'ABSENT IS GONE.', 'dismissed at the last bell'], { w: 4, h: 1.3, bg: '#1b2823', fg: '#d6ddd6', font: '40px "Segoe Print", "Comic Sans MS", cursive' });
    ctx.add(chalk, -0.6, 1.75, -3.88);
    P.box(4.2, 0.06, 0.12, M.wood('#3b2a1c'), -0.6, 1.07, -3.84, ctx.scene);
    examine(ctx, chalk, NOTES.chalkboard, 'Read the chalkboard');

    // Clock (3:47)
    const clock = ctx.add(P.wallClock(), 2.6, 2.55, -3.87);
    examine(ctx, clock, NOTES.clock, 'Look at the clock', () => game.setFlag('saw_clock'));

    // Teacher desk + chair + register + flashlight drawer
    const tdesk = ctx.place(P.teacherDesk(), 0.6, -2.6);
    const tchair = ctx.place(P.chair(), 0.6, -3.35, Math.PI, { collide: false });
    const reg = ctx.add(P.folder('#2f3d2a'), 0.15, 0.81, -2.6, 0.2);
    examine(ctx, reg, NOTES.register, 'Open the old register');
    const drawerDef = ctx.interact(tdesk, {
      id: 'drawer', prompt: () => F.got_flashlight ? 'Empty drawers' : 'Search the drawers',
      onUse: () => {
        if (F.got_flashlight) { game.ui.toast('Chewing gum. A broken ruler. Nothing else.'); return; }
        game.flags.flashlight = true;
        game.pickup(ITEMS.flashlight, null, null);
        game.scene3d.setFlashlight(true);
        game.ui.toast('Flashlight — press F to toggle');
      },
    });

    // Student desks (3x3)
    const cols = [-2.6, -0.2, 2.2], rows = [-0.5, 1.3, 3.1];
    let carved = null;
    for (const z of rows) for (const x of cols) {
      const d = ctx.place(P.desk(), x, z);
      ctx.place(P.chair(), x, z + 0.55, 0, { collide: false });
      if (x === -2.6 && z === -0.5) carved = d;
    }
    examine(ctx, carved, NOTES.carving, 'Look at the carved desk', () => game.setFlag('saw_carving'));
    const slip = ctx.add(P.paper(0.15, 0.2, '#d9cfa8'), -0.2, 0.765, 1.25, 0.3);
    pickup(ctx, slip, ITEMS.slip, { prompt: 'Take your detention slip', note: NOTES.slip, after: () => game.ui.document(NOTES.slip) });

    // Back shelf, poster, windows
    ctx.place(P.bookshelf(2, 1.8), 3.0, 3.75, Math.PI);
    ctx.add(P.poster(['ATTENDANCE', 'IS', 'EXCELLENCE', '', '— E. Voss', 'Headmaster']), -2.6, 1.7, 3.89, Math.PI);
    for (const z of [-2, 0.6, 3]) ctx.add(P.window_(1.4, 1.3), -4.38, 1.75, z, Math.PI / 2);
    ctx.sign(['ROOM 104'], 6.79, 2.6, -2, -Math.PI / 2, { w: 0.5, h: 0.16 });

    // Lights
    ctx.light(-2, -1.5, { y: 3.2 }); ctx.light(2, -1.5, { y: 3.2, flicker: true }); ctx.light(-2, 2.2, { y: 3.2, intensity: 4 }); ctx.light(2, 2.2, { y: 3.2, off: false, intensity: 3, flicker: true });

    // Exit door + keypad
    const door = ctx.door(4.5, -2, Math.PI / 2, { label: '' });
    const kp = ctx.add(P.keypad(), 4.38, 1.3, -0.85, -Math.PI / 2);
    const notice = ctx.sign(['AFTER HOURS', 'code = time of', 'the last bell'], 4.38, 1.65, -0.2, -Math.PI / 2, { w: 0.32, h: 0.36, font: 'bold 34px Arial' });
    examine(ctx, notice, NOTES.caretaker, 'Read the notice');

    game.puzzles.register({ id: 'c1_keypad', answers: ['0347', '1547'] }, !!F.c1_solved);
    if (F.c1_solved) { door.open(false); kp.userData.screen.material.emissive.set('#3fbf7a'); }
    else kp.userData.screen.material.emissive.set('#bf3f3f');

    ctx.interact(kp, {
      id: 'keypad', prompt: () => F.c1_solved ? 'Keypad (unlocked)' : 'Use keypad',
      onUse: () => { if (!F.c1_solved) game.ui.keypad('c1_keypad', 'ROOM 104 — DOOR LOCK'); },
    });

    game.on('puzzle:solved', ({ id }) => {
      if (id !== 'c1_keypad') return;
      game.setFlag('c1_solved', true, { save: true });
      kp.userData.screen.material.emissive.set('#3fbf7a');
      game.setObjective('Leave Room 104.');
      (async () => {
        const h = game.horror;
        await h.wait(0.6);
        game.audio.bell(true); h.flickerAll(2.5); h.shake(0.6);
        door.open();
        await game.dialogue.play([
          { s: 'MIRA', t: 'Go. He has started the count.', voice: 'whisper' },
          { s: 'ARIN', t: 'Who is "he"?' },
        ]);
      })();
    });

    const exit = exitDoor(ctx, door, { canOpen: () => F.c1_solved, lockedText: 'Locked. The keypad by the door glows red.', zone: [6.2, -2, 1.4, 2.2] });

    // Horror: taking the flashlight -> blackout, the teacher's chair turns to face you.
    game.horror.add({
      id: 'c1_chair', trigger: { type: 'flag', flag: 'got_flashlight' },
      run: async h => {
        await h.wait(1.2);
        game.audio.electric(0.5);
        await h.blackout(2.2);
        tchair.position.set(-1.4, 0, 0.4); tchair.rotation.y = 0.6;
        game.audio.scrape(); game.audio.stinger(0.8); h.shake(0.5);
        await h.wait(1);
        await game.dialogue.play([
          { s: 'PA', t: '—ttendance, Room one-oh-four. One student remaining.', voice: 'pa' },
          { s: 'MIRA', t: 'Don\'t answer him. Don\'t sit back down.', voice: 'whisper' },
          { s: 'ARIN', t: 'That chair was behind the desk.' },
        ]);
      },
    });
    // Horror: walking near the windows -> a knock from outside, three floors up.
    game.horror.add({
      id: 'c1_knock', trigger: { type: 'zone', x: -3.6, z: 0.6, w: 1.6, d: 6 },
      run: async h => {
        game.audio.thud(); await h.wait(0.5); game.audio.thud(); await h.wait(0.4); game.audio.thud();
        await game.dialogue.play([{ s: 'ARIN', t: 'We\'re on the first floor... right?' }]);
      },
    });

    if (F.menu) return {};
    return {
      intro: () => game.dialogue.play([
        { s: 'ARIN', t: '...I fell asleep.', d: 2.2 },
        { s: 'ARIN', t: 'Sir? Hello? Mum is going to kill me.' },
        { s: 'PA', t: '—tendance. Final period. All students remain seated until the last bell.', voice: 'pa' },
        { s: 'MIRA', t: 'Don\'t stay in your seat. He counts the ones who stay.', voice: 'whisper' },
        { s: 'ARIN', t: 'Who said that?' },
      ]),
      update: () => exit.update(),
      debugSolve: () => game.puzzles.forceSolve('c1_keypad'),
    };
  },
};
