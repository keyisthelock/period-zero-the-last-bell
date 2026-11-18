# PERIOD ZERO: THE LAST BELL

A first-person school horror escape game. Three.js + Vite + vanilla JavaScript. Everything (geometry, textures, audio) is procedural, so there are no external asset files and no API keys.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # serve the production build
```

Debug mode is on automatically under `npm run dev`. In a production build, add `?debug` to the URL. Press **`** (backtick) to open the debug panel: chapter jump, solve puzzle, noclip, FPS/draw calls. `window.__game` exposes the GameManager in the console.

## Controls

| Key | Action |
|---|---|
| W A S D / arrows | Move |
| Mouse | Look (click the game to capture the mouse) |
| Shift | Sprint (stamina) |
| E | Interact / examine / close documents |
| F | Flashlight (after you find it in chapter 1) |
| Tab / I | Inventory and read notes |
| M | Mute |
| Esc | Pause: resume, reload checkpoint, subtitles, graphics quality, sensitivity |

## Structure

```
src/
  core/      GameManager (state machine, flow, input), SceneManager (renderer, level ctx), PostFX, EventBus
  systems/   PlayerController, InteractionSystem, PuzzleManager (FSM), InventoryManager,
             DialogueManager, AudioManager (Web Audio synthesis), HorrorEventManager, SaveManager
  world/     Materials (procedural canvas textures), Prefabs (desks, lockers, shelves, doors, figures...)
  data/      notes.js (all documents/items), helpers.js, ch1..ch5 chapter definitions, chapters.js registry
  ui/        UI.js (HUD, documents, keypad / letter wheels / sigil / register puzzle UIs, menus)
scripts/     patch-esbuild-wasm.cjs (environment workaround, see BUILD_STATUS.md)
```
