# BUILD STATUS — Period Zero: The Last Bell

## Implemented
- **Engine:** Three.js 0.170 with Vite 5. The renderer uses PCF soft shadows, a flashlight spotlight that casts shadows, and a directional "moonlight" in chapters 1 and 3. ACES tone mapping and exponential fog.
- **Post-processing** (`src/core/PostFX.js`):
  - GTAO ambient occlusion
  - Unreal bloom at half resolution
  - A lens pass with chromatic aberration, a cold grade, vignette, grain, red emergency tint, and screen distortion during scares
  - Quality setting in the pause menu: auto, high, medium, low. Auto steps down if the frame rate stays under 34 fps.
- **Systems** (event-driven through `EventBus`): GameManager (state machine: menu, playing, paused, modal, cutscene, loading, ending), SceneManager, PlayerController, InteractionSystem, PuzzleManager, InventoryManager, DialogueManager, AudioManager, HorrorEventManager, SaveManager.
  - PlayerController: circle-vs-box collision with sub-stepping, sprint stamina, head-bob, camera shake, and a forced look target for cutscenes.
  - PuzzleManager: finite-state machine (active to solved). Sequence puzzles reset on a wrong step and never lock.
- **Data-driven chapters** in `src/data/ch1..ch5`. All documents and items live in `src/data/notes.js`. Props are reusable procedural builders in `src/world/Prefabs.js`, and textures are procedural canvases.
- **Five chapters.** Each has a distinct palette and layout, a clue-based puzzle, two or more dialogue scenes, a staged scare with sound, and an exit that unlocks when solved.
  1. **Detention.** Keypad code 0347 (1547 is also accepted). Clues: the stopped clock, the after-hours notice, and the slip. Taking the flashlight triggers a blackout and the teacher's chair moves. Knocking at the window.
  2. **East Corridor.** Breakers must go LIGHTING, then DOORS, then ALARM, as the maintenance log says. A wrong order trips everything back off. The headmaster's silhouette appears at the end of the corridor; lockers slam.
  3. **Library.** The four red books carry the letters K D O H. Shift each back 3 (the hour of the last bell from chapter 1) to get HALE, entered on the letter lock. Mira's library card is revealed, she appears, and the shelf passage opens. The headmaster appears in the west aisle.
  4. **Science Wing.** Enter the sigils in the order the notebook's riddle gives, using the wall chart: △ ▽ ○ ◇. The vent drops the fire report. Handprints and a bang at the fume hood; the headmaster speaks over the PA; red emergency lights.
  5. **Archive.** Mira's file in drawer G–H holds a brass key, which opens the cage. Write the register line: HALE / 14 OCT 1994 / 15:47 / PRESENT. Each wrong attempt brings the headmaster closer and Mira gives a progressively clearer hint. Then the ending cutscene, the dissolve, daylight through the exit door, and the ending screen.
- **Audio:** fully synthesized with Web Audio, so there are no files and no broken URLs. Drones, fluorescent hum, footsteps, bell, PA static, headmaster voice texture, whispers, doors and slams, electricity, stingers, heartbeat, puzzle feedback, and reverb. The audio context starts on the first click. Mute with **M** or from the pause menu.
- **UI:** menu, chapter select (unlocked as you reach chapters), pause menu (resume, reload checkpoint, mute, subtitles, graphics, sensitivity), subtitles with speaker colours, objective line, toasts, inventory with re-readable notes, and four puzzle interfaces.
- **Checkpoints** are saved in localStorage at each chapter start, each pickup, and each solve. Reloading rebuilds the chapter from saved flags: solved doors stay open, collected items stay gone, and one-time scares don't repeat.
- **Debug mode** is on automatically in `npm run dev`, or add `?debug` to the URL. Press the backtick key to open a panel with chapter jumps, solve puzzle, noclip, flashlight, clear save, and an FPS / draw-call readout. `window.__game` exposes the game object.

## How to test
1. Run `npm install`, then `npm run dev`, and open http://localhost:5173.
2. Play through with the solutions above, or use the debug panel's chapter buttons and "Solve puzzle".
3. Automated check already done in the dev browser: every puzzle rejected a wrong answer and accepted the right one, all four chapter transitions fired, and chapter 5 reached the ending screen. There were no console errors.
4. `npm run build` passes. The output is in `dist/`: one JS file of about 836 kB (224 kB gzipped).

## Known issues and caveats
- **Toolchain workaround:** on the original machine, Windows Application Control blocks the native esbuild and Rollup binaries. `package.json` therefore overrides them with `esbuild-wasm` and `@rollup/wasm-node`. A postinstall script (`scripts/patch-esbuild-wasm.cjs`) also works around an OpenSSL entropy error in Node 26. On a normal machine you can delete the `overrides` block and the `postinstall` script to get the faster native tools.
- **Not tested by hand:** the full playthrough was checked by script only, not with real mouse and keyboard. Interaction distance, prompt targeting on small props (the floor book in chapter 3, the slip on the desk), and collision snagging around desk clusters need a manual pass.
- **Exposure** was tuned from screenshots. The corridor before power is restored is intentionally near-black, and players need to know to press F.
- The headmaster and Mira figures are stylised primitive silhouettes, not rigged models.
- The menu backdrop rebuilds chapter 1. After a chapter load the second-hand ticking is not animated.
- Chapter 3's exit opens only after Mira's roughly 15-second scene ends (blackout, then the shelf slides). This is intended but could feel slow.
- There is no gamepad or touch support.

## Priorities for Codex
1. **Manual playtest.** Tune interaction ranges and highlight targetable props (for example an outline or emissive pulse on the current interactable).
2. **Art pass:** replace the figure silhouettes with CC0 models (Mixamo-style rig or Quaternius), add decals (graffiti, water stains), and add better per-chapter set dressing. Record licences in a new `ASSETS_LICENSES.md`.
3. **Audio:** optionally add CC0 recorded foley for footsteps and the bell, and spatialise one-shots with PannerNode at their world positions.
4. **Performance:** merge static prop geometry per chapter (BufferGeometryUtils) to cut draw calls, and code-split three/examples.
5. **Accessibility:** key rebinding, an FOV slider, subtitle size, and a reduced-flashing option.
6. **Polish:** door-handle and lever animation feedback, a stamina HUD, a short "click to resume" hint after a modal closes, and an ending credits roll.
