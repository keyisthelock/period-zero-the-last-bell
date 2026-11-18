import { NOTES, ITEMS } from './notes.js';
import { examine, pickup, figure, inBox } from './helpers.js';

// CHAPTER 3 — Forgotten Library
// Puzzle: 4 red volumes carry bookmark letters K D O H. Mira's note: step each letter BACK by the hour of the last bell (3, from ch.1 clock).
// K-3=H, D-3=A, O-3=L, H-3=E  ->  HALE. Entered on the card-catalogue letter lock.
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default {
  id: 'c3', num: 3, title: 'The Forgotten Library',
  objective: 'Find Mira\'s things in the library.',
  spawn: { x: 0, z: 5.2, yaw: 0 },
  atmosphere: {
    fog: '#0a0f09', fogDensity: 0.07, ambient: '#3a4432', ambientIntensity: 0.9,
    moon: { color: '#6a86a0', intensity: 0.35, pos: [12, 9, -2], target: [0, 0, 0] },
    drone: { base: 41, color: 260, level: 0.11, hum: false }, dustColor: '#c8b890',
  },
  grants: { notes: [NOTES.cipher, NOTES.card, NOTES.photo], items: [ITEMS.volI, ITEMS.volII, ITEMS.volIII, ITEMS.volIV] },

  build(ctx, game) {
    const { P, M, THREE, Tex } = ctx;
    const F = game.flags;
    const wall = new THREE.MeshStandardMaterial({ map: Tex.wall('#3a3626'), roughness: 0.9 });
    const floor = new THREE.MeshStandardMaterial({ map: Tex.carpet('#2a3428'), roughness: 1 });
    ctx.room({ x: 0, z: 0, w: 14, d: 12, h: 4, wall, floor, gaps: [{ side: 'n', at: 4.5, width: 1.2, height: 2.3 }] });
    ctx.room({ x: 4.5, z: -7.2, w: 1.6, d: 2.4, h: 2.6, skip: ['s'], wall: M.std('#1b1a14') }); // hidden passage

    // Shelf rows (aisles at x = -4 and x = +4)
    const shelfCols = ['#4a2622', '#263a44', '#3a3a20', '#30241c', '#4c3c2a', '#1e2e26'];
    for (const [x, r] of [[-5.2, Math.PI / 2], [-2.8, -Math.PI / 2], [2.8, Math.PI / 2], [5.2, -Math.PI / 2]])
      for (const z of [-1.6, 0.85]) ctx.place(P.bookshelf(2.4, 2.6, shelfCols), x, z, r);
    for (const x of [-4.5, -1.8]) ctx.place(P.bookshelf(2.4, 3.2, shelfCols), x, -5.75, 0);
    for (const z of [-3.5, 3.5]) ctx.place(P.bookshelf(2.4, 3, shelfCols), -6.75, z, Math.PI / 2);
    const secretShelf = ctx.place(P.bookshelf(2.0, 2.6, shelfCols), 4.5, -5.75, 0);

    // Librarian desk + catalogue
    ctx.place(P.teacherDesk(), -0.6, -3.6, 0);
    ctx.lamp(-1.2, 1.0, -3.6, { color: '#9ad8a0', intensity: 2.5, distance: 5 });
    const note = ctx.add(P.paper(0.18, 0.24, '#e0d8c0'), -0.1, 0.81, -3.45, -0.3);
    examine(ctx, note, NOTES.cipher, 'Read the note');
    const cat = new THREE.Group();
    P.box(1.1, 1.15, 0.5, M.wood('#4a3424'), 0, 0.575, 0, cat);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { P.box(0.22, 0.2, 0.02, M.wood('#5a4230'), -0.39 + c * 0.26, 0.2 + r * 0.26, 0.26, cat); P.box(0.05, 0.02, 0.03, M.metal('#a89a70'), -0.39 + c * 0.26, 0.2 + r * 0.26, 0.28, cat); }
    cat.userData.size = [1.1, 0.5];
    ctx.place(cat, 1.6, -4.0);
    ctx.sign(['CARD CATALOGUE'], 1.6, 1.32, -3.74, 0, { w: 0.7, h: 0.12 });

    // Reading tables + chairs
    const table = (x, z) => { const t = new THREE.Group(); P.box(2.0, 0.06, 1.0, M.wood('#4a3424'), 0, 0.76, 0, t); for (const [a, b] of [[-0.9, -0.42], [0.9, -0.42], [-0.9, 0.42], [0.9, 0.42]]) P.box(0.07, 0.74, 0.07, M.wood('#3a2a1e'), a, 0.37, b, t); t.userData.size = [2.0, 1.0]; ctx.place(t, x, z); return t; };
    table(0, 0.4); table(0, 3.0);
    for (const [x, z, r] of [[-0.6, -0.3, Math.PI], [0.6, 1.1, 0], [-0.6, 3.7, 0], [0.7, 2.3, Math.PI]]) ctx.place(P.chair(), x, z, r, { collide: false });
    ctx.lamp(-0.6, 1.0, 0.4, { color: '#8ad098', intensity: 2.2 }); ctx.lamp(0.6, 1.0, 3.0, { color: '#8ad098', intensity: 2.2 });
    const sideTable = new THREE.Group(); P.box(0.6, 0.6, 0.6, M.wood('#3a2a1e'), 0, 0.3, 0, sideTable); sideTable.userData.size = [0.6, 0.6]; ctx.place(sideTable, -6.2, -1.2);
    const cart = new THREE.Group(); P.box(0.5, 0.05, 0.9, M.metal('#555'), 0, 0.5, 0, cart); P.box(0.5, 0.05, 0.9, M.metal('#555'), 0, 0.15, 0, cart); for (const [a, b] of [[-0.22, -0.42], [0.22, -0.42], [-0.22, 0.42], [0.22, 0.42]]) P.box(0.03, 0.52, 0.03, M.metal('#444'), a, 0.26, b, cart); cart.userData.size = [0.5, 0.9]; ctx.place(cart, 4.0, 2.6);

    // Class photo + windows
    const photo = ctx.sign(['YEAR 10 — 1994', '☺☺☺☺☺☺☺☺☺☺', '☺☺☺☺☺☺☺☺☺☺', '☺☺☺☺☺☺☺☺☺ ▓'], -6.88, 1.7, 0, Math.PI / 2, { w: 1.1, h: 0.75, bg: '#8a8070', fg: '#2a2620', font: '36px Arial' });
    examine(ctx, photo, NOTES.photo, 'Look at the class photo');
    for (const z of [-3, 0, 3]) ctx.add(P.window_(1.2, 2.0), 6.88, 2.2, z, -Math.PI / 2);
    ctx.sign(['SILENCE'], 0, 3.2, -5.88, 0, { w: 1.0, h: 0.3 });

    // Four red volumes
    const vols = [
      [ITEMS.volI, 0.5, 0.79, 0.3],     // reading table
      [ITEMS.volII, -4.0, 0.0, -0.4],   // floor, west aisle
      [ITEMS.volIII, 4.0, 0.53, 2.4],   // book cart, east aisle
      [ITEMS.volIV, -6.2, 0.6, -1.2],   // side table, west wall
    ];
    for (const [item, x, y, z] of vols) {
      const b = ctx.add(P.book('#7a1e18'), x, y, z, Math.random() * 3);
      pickup(ctx, b, item, { prompt: `Take the red book (${item.name.split(', ')[1]})`, after: () => { game.ui.toast(`${item.name} — ${item.desc}`, 3500); checkBooks(); } });
    }
    const checkBooks = () => {
      const n = [ITEMS.volI, ITEMS.volII, ITEMS.volIII, ITEMS.volIV].filter(i => game.inventory.has(i.id)).length;
      if (n === 4 && !F.c3_solved) { game.setObjective('Decode the bookmarks. Use the card catalogue.'); game.dialogue.play([{ s: 'ARIN', t: 'K, D, O, H. That\'s not a word. Not yet.' }]); }
      else if (!F.c3_solved) game.setObjective(`Find the red volumes (${n}/4).`);
    };

    // Lights
    ctx.light(-4, 2, { y: 4, intensity: 3, color: '#d8d0a8', flicker: true }); ctx.light(4, -2, { y: 4, intensity: 3, color: '#d8d0a8' });
    ctx.light(0, -3, { y: 4, intensity: 2.5, color: '#d8d0a8' }); ctx.light(-4, -3.5, { y: 4, intensity: 2, color: '#d8d0a8' });

    // Puzzle
    game.puzzles.register({ id: 'c3_cipher', answer: 'HALE' }, !!F.c3_solved);
    ctx.interact(cat, {
      id: 'catalogue', prompt: () => F.c3_solved ? 'Card catalogue (open)' : 'Use the catalogue letter lock',
      onUse: () => {
        if (F.c3_solved) { game.ui.document(NOTES.card); return; }
        game.ui.wheels('c3_cipher', 'CATALOGUE DRAWER — LETTER LOCK', ALPHA, 4, 'Four letters. A name, filed under H.');
      },
    });
    const ghost = figure(ctx, P.miraGhost(), 0, -1.3, 0);
    const slideShelf = (instant) => {
      secretShelf.userData.collider.disabled = true;
      if (instant) { secretShelf.position.x = 6.1; return; }
      game.audio.scrape();
      game.horror.every(dt => { secretShelf.position.x = Math.min(6.1, secretShelf.position.x + dt * 0.6); return secretShelf.position.x < 6.1; });
    };
    if (F.c3_solved) slideShelf(true);

    game.on('puzzle:solved', ({ id }) => {
      if (id !== 'c3_cipher') return;
      game.setFlag('c3_solved', true, { save: false });
      game.inventory.addNote(NOTES.card); game.checkpoint();
      game.ui.document(NOTES.card);
      game.setObjective('Follow Mira.');
      (async () => {
        const h = game.horror;
        await h.wait(0.5);
        game.audio.whisper(3); h.flickerAll(1.2);
        ghost.show(0, -1.6, game.player.pos);
        await game.dialogue.play([
          { s: 'MIRA', t: 'Hale. Mira Hale. I\'d almost forgotten how it sounded.' },
          { s: 'ARIN', t: 'You were a student here.' },
          { s: 'MIRA', t: 'I was in detention. Room 104. Same seat as you.' },
          { s: 'MIRA', t: 'He wrote that I went home early. Everyone believed the register.' },
        ]);
        game.audio.thud(); await h.wait(0.3); game.audio.thud(); await h.wait(0.2); game.audio.thud(); h.shake(0.6);
        await h.blackout(1.0);
        ghost.hide();
        slideShelf(false);
        game.setObjective('Go through the passage behind the shelf.');
        game.dialogue.play([{ s: 'MIRA', t: 'Behind the shelves. The way to the science wing. Where it started.', voice: 'whisper' }]);
      })();
    });

    // Horror: the headmaster glimpsed at the end of the west aisle.
    const voss = figure(ctx, P.headmaster(), -4, -3.6, 0);
    game.horror.add({
      id: 'c3_aisle', trigger: { type: 'zone', x: -4, z: 1.5, w: 1.8, d: 2 },
      run: async h => {
        voss.show(-4, -3.9, game.player.pos);
        game.audio.stinger(1); h.shake(0.4);
        await h.wait(1.3);
        await h.blackout(0.6);
        voss.hide();
        game.audio.thud(); await h.wait(0.25); game.audio.thud();
        game.dialogue.play([{ s: 'MIRA', t: 'Don\'t look at him for long. He likes to be looked at.', voice: 'whisper' }]);
      },
    });

    return {
      intro: () => { checkBooks(); game.dialogue.play([
        { s: 'ARIN', t: 'The library. It smells like wet paper.' },
        { s: 'MIRA', t: 'My books are still here. Red ones. Four of them. I marked them for whoever came next.', voice: 'whisper' },
      ]); },
      objective: () => F.c3_solved ? 'Go through the passage behind the shelf.' : 'Find the red volumes.',
      update: () => { if (F.c3_solved && secretShelf.position.x > 5.9 && inBox(game.player.pos, 4.5, -7.6, 1.4, 1.4)) game.nextChapter(); },
      debugSolve: () => game.puzzles.submit('c3_cipher', 'HALE'),
    };
  },
};
