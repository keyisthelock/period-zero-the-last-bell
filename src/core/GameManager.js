import * as THREE from 'three';
import { bus } from './EventBus.js';
import { SceneManager } from './SceneManager.js';
import { PlayerController } from '../systems/PlayerController.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { PuzzleManager } from '../systems/PuzzleManager.js';
import { InventoryManager } from '../systems/InventoryManager.js';
import { DialogueManager } from '../systems/DialogueManager.js';
import { AudioManager } from '../systems/AudioManager.js';
import { HorrorEventManager } from '../systems/HorrorEventManager.js';
import { SaveManager } from '../systems/SaveManager.js';
import { UI } from '../ui/UI.js';
import { CHAPTERS } from '../data/chapters.js';

const $ = id => document.getElementById(id);

// Game states
export const S = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', MODAL: 'modal', CUTSCENE: 'cutscene', LOADING: 'loading', ENDING: 'ending' };

export class GameManager {
  constructor() {
    this.bus = bus;
    this.state = S.MENU;
    this.flags = {};
    this.chapterIndex = 0;
    this.chapter = null;
    this.blackout = false;
    this.time = 0;
    this.debug = import.meta.env.DEV || new URLSearchParams(location.search).has('debug');

    this.save = new SaveManager(bus);
    this.settings = this.save.loadSettings();
    this.scene3d = new SceneManager($('game-canvas'), this);
    this.camera = this.scene3d.camera;
    this.audio = new AudioManager(bus);
    this.audio.muted = this.settings.muted;
    this.player = new PlayerController(this.camera, bus);
    this.player.sensitivity = this.settings.sensitivity;
    this.interaction = new InteractionSystem(this.camera, bus);
    this.puzzles = new PuzzleManager(bus);
    this.inventory = new InventoryManager(bus);
    this.dialogue = new DialogueManager(bus, this.audio);
    this.dialogue.enabled = this.settings.subtitles;
    this.horror = new HorrorEventManager(bus, this);
    this.ui = new UI(this);

    this._bindInput();
    this._bindMenus();
    this._loop = this._loop.bind(this);
    this.clock = new THREE.Clock();
    this._menuBackdrop();
    requestAnimationFrame(this._loop);
    if (this.debug) { this._setupDebug(); import('../debug/autoplay.js').then(m => m.installAutoplay(this)); }
    window.__game = this;
  }

  // ------------------------------------------------------------ flow
  async newGame() {
    this.save.clear();
    this.flags = {}; this.inventory.reset();
    await this.loadChapter(0);
  }
  async continueGame() {
    const s = this.save.load();
    if (!s) return this.newGame();
    await this.loadChapter(s.chapter, s);
  }
  async reloadCheckpoint() { $('pause').classList.add('hidden'); await this.continueGame(); }

  // Jump to a chapter from the chapter list, granting clue items/notes from earlier chapters.
  async selectChapter(i) {
    this.flags = {}; const items = [], notes = [];
    for (let k = 0; k < i; k++) { const g = CHAPTERS[k].grants || {}; Object.assign(this.flags, g.flags || {}); items.push(...(g.items || [])); notes.push(...(g.notes || [])); }
    await this.loadChapter(i, { chapter: i, flags: this.flags, inventory: items, notes });
  }

  async loadChapter(i, snapshot = null) {
    this.audio.init();
    this.state = S.LOADING;
    this.ui.close();
    $('menu').classList.add('hidden'); $('pause').classList.add('hidden'); $('ending').classList.add('hidden');
    await this.ui.fade(true);
    this.dialogue.clear();
    this.horror.clear(); this.interaction.clear(); this.puzzles.clear();
    this._unbindChapter();
    this.scene3d.clear();
    this.blackout = false;
    this.player.lookTarget = null;

    if (snapshot) { this.flags = { ...(snapshot.flags || {}) }; this.inventory.reset(snapshot.inventory || [], snapshot.notes || []); }
    this.chapterIndex = i;
    const def = CHAPTERS[i];
    this.chapter = def;
    this.scene3d.setupAtmosphere(def.atmosphere);
    const ctx = this.scene3d.makeContext(this);
    this.chapterRuntime = def.build(ctx, this) || {};
    this.player.setColliders(ctx.colliders);
    this.interaction.blockers = ctx.blockers;
    const sp = def.spawn;
    this.player.teleport(sp.x, sp.z, sp.yaw ?? 0);
    this.scene3d.setFlashlight(!!this.flags.flashlight);
    this.audio.startDrone(def.atmosphere.drone);
    this.ui.objective(this.chapterRuntime.objective?.() ?? def.objective);
    this.ui.showHUD(true);
    this.ui.renderInvBar(this.inventory);
    // checkpoint at chapter start (only when not restoring from it already)
    this.checkpoint();
    this.state = S.PLAYING;
    this.player.enabled = true;
    await this.ui.fade(false);
    this.ui.chapterCard(def.num, def.title);
    if (!this.flags[`intro_${def.id}`]) {
      this.flags[`intro_${def.id}`] = true;
      this.chapterRuntime.intro?.();
    }
    this.requestLock();
    bus.emit('chapter:loaded', def.id);
  }

  async nextChapter() {
    if (this.state === S.LOADING) return;
    if (this.chapterIndex + 1 >= CHAPTERS.length) return this.finish();
    this.flags[`done_${this.chapter.id}`] = true;
    await this.loadChapter(this.chapterIndex + 1, { chapter: this.chapterIndex + 1, flags: this.flags, inventory: this.inventory.items, notes: this.inventory.notes });
  }

  async finish() {
    this.state = S.ENDING; this.player.enabled = false;
    document.exitPointerLock?.();
    await this.ui.fade(true);
    this.audio.stopDrone();
    this.audio.bell(false);
    this.ui.showHUD(false);
    this.flags.completed = true; this.checkpoint();
    this.ui.ending(this.chapter.ending || ['The end.']);
    this.ui.fade(false);
  }

  checkpoint() {
    const inv = this.inventory.snapshot();
    this.save.save({ chapter: this.chapterIndex, flags: { ...this.flags }, inventory: inv.items, notes: inv.notes });
  }

  setFlag(f, v = true, { silent = false, save = false } = {}) {
    if (this.flags[f] === v) return;
    this.flags[f] = v;
    if (!silent) bus.emit('flag:set', f);
    if (save) this.checkpoint();
  }
  setObjective(t) { this.ui.objective(t); }
  // Chapter-scoped event subscription: removed automatically when the chapter unloads.
  on(evt, fn) { (this._chapterOffs ||= []).push(this.bus.on(evt, fn)); }
  _unbindChapter() { (this._chapterOffs || []).forEach(off => off()); this._chapterOffs = []; }

  // ------------------------------------------------------------ helpers used by chapter data
  readNote(note) {
    this.inventory.addNote(note);
    this.setFlag(`read_${note.id}`);
    this.ui.document(note);
  }
  pickup(item, def, obj) {
    this.audio.pickup();
    this.inventory.add(item);
    if (obj) obj.visible = false;
    if (def) this.interaction.unregister(def);
    this.setFlag(`got_${item.id}`, true, { save: true });
  }
  cutscene(on) {
    if (on) { this.state = S.CUTSCENE; this.player.enabled = false; }
    else { this.state = S.PLAYING; this.player.enabled = true; this.player.lookTarget = null; }
  }

  // ------------------------------------------------------------ input / pointer lock
  requestLock() {
    const c = $('game-canvas');
    try { const p = c.requestPointerLock?.(); if (p && p.catch) p.catch(() => {}); } catch {}
  }
  onModalOpen() { if (this.state === S.PLAYING || this.state === S.CUTSCENE) { this._preModal = this.state; this.state = S.MODAL; } document.exitPointerLock?.(); }
  onModalClose() {
    if (this.state === S.MODAL) this.state = this._preModal || S.PLAYING;
    if (this.state === S.PLAYING || this.state === S.CUTSCENE) this.requestLock();
  }

  pause() { if (this.state !== S.PLAYING && this.state !== S.CUTSCENE) return; this._prePause = this.state; this.state = S.PAUSED; $('pause').classList.remove('hidden'); document.exitPointerLock?.(); }
  resume() { if (this.state !== S.PAUSED) return; $('pause').classList.add('hidden'); this.state = this._prePause || S.PLAYING; this.requestLock(); }

  _bindInput() {
    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === $('game-canvas');
      if (!locked && (this.state === S.PLAYING || this.state === S.CUTSCENE) && !this.ui.isOpen) this.pause();
    });
    $('game-canvas').addEventListener('click', () => { this.audio.init(); if (this.state === S.PLAYING || this.state === S.CUTSCENE) this.requestLock(); });
    window.addEventListener('keydown', e => {
      if (e.code === 'Tab') e.preventDefault();
      if (this.ui.handleKey(e)) return;
      if (e.code === 'Backquote' && this.debug) { $('debug').classList.toggle('hidden'); return; }
      if (e.code === 'KeyM') this.toggleMute();
      if (this.state === S.PAUSED && e.code === 'Escape') { this.resume(); return; }
      if (this.state !== S.PLAYING && this.state !== S.CUTSCENE) return;
      if (e.code === 'Escape') this.pause();
      if (this.state !== S.PLAYING) return;
      if (e.code === 'KeyE') this.interaction.use();
      if (e.code === 'KeyF') {
        if (!this.flags.flashlight) { this.ui.toast('You don\'t have a flashlight yet.'); return; }
        this.scene3d.setFlashlight(!this.scene3d.flashOn); this.audio.flashlight();
      }
      if (e.code === 'Tab' || e.code === 'KeyI') this.ui.inventory();
    });
  }

  toggleMute() {
    this.settings.muted = !this.settings.muted; this.audio.setMuted(this.settings.muted); this.save.saveSettings(this.settings);
    $('btn-mute').textContent = `Mute: ${this.settings.muted ? 'On' : 'Off'}`;
    this.ui.toast(this.settings.muted ? 'Audio muted' : 'Audio on', 1200);
  }

  _bindMenus() {
    const refresh = () => {
      const s = this.save.load();
      $('btn-continue').disabled = !s;
      const reached = s?.reachedChapter ?? 0;
      $('chapter-list').innerHTML = CHAPTERS.map((c, i) => `<button data-ch="${i}" ${i > reached && !this.debug ? 'disabled' : ''}>${c.num}. ${c.title}</button>`).join('');
      $('chapter-list').querySelectorAll('[data-ch]').forEach(b => b.onclick = () => this.selectChapter(+b.dataset.ch));
    };
    refresh();
    this.bus.on('save:written', refresh);
    $('btn-new').onclick = () => { this.audio.init(); this.newGame(); };
    $('btn-continue').onclick = () => { this.audio.init(); this.continueGame(); };
    $('btn-chapters').onclick = () => { $('chapter-list').classList.toggle('hidden'); $('controls-panel').classList.add('hidden'); };
    $('btn-controls').onclick = () => { $('controls-panel').classList.toggle('hidden'); $('chapter-list').classList.add('hidden'); };
    $('btn-resume').onclick = () => this.resume();
    $('btn-reload').onclick = () => this.reloadCheckpoint();
    $('btn-mute').textContent = `Mute: ${this.settings.muted ? 'On' : 'Off'}`;
    $('btn-mute').onclick = () => this.toggleMute();
    $('btn-subs').textContent = `Subtitles: ${this.settings.subtitles ? 'On' : 'Off'}`;
    $('btn-subs').onclick = () => { this.settings.subtitles = !this.settings.subtitles; this.dialogue.enabled = this.settings.subtitles; this.save.saveSettings(this.settings); $('btn-subs').textContent = `Subtitles: ${this.settings.subtitles ? 'On' : 'Off'}`; };
    $('sens').value = this.settings.sensitivity;
    $('sens').oninput = e => { this.settings.sensitivity = +e.target.value; this.player.sensitivity = this.settings.sensitivity; this.save.saveSettings(this.settings); };
    $('btn-quit').onclick = () => this.toMenu();
    const QL = ['auto', 'high', 'medium', 'low'];
    $('btn-quality').onclick = () => this.setQuality(QL[(QL.indexOf(this.settings.quality || 'auto') + 1) % QL.length]);
    this.setQuality(this.settings.quality || 'auto');
    $('btn-end-menu').onclick = () => this.toMenu();
  }

  toMenu() {
    this.state = S.MENU; this.player.enabled = false;
    $('pause').classList.add('hidden'); $('ending').classList.add('hidden');
    this.ui.close(); this.ui.showHUD(false); this.dialogue.clear();
    this.audio.stopDrone();
    document.exitPointerLock?.();
    $('menu').classList.remove('hidden');
    this._menuBackdrop();
  }

  _menuBackdrop() {
    // simple rotating view of chapter 1 behind the menu
    this.horror.clear(); this.interaction.clear(); this._unbindChapter(); this.scene3d.clear();
    this.chapterRuntime = null;
    const def = CHAPTERS[0];
    this.scene3d.setupAtmosphere(def.atmosphere);
    const ctx = this.scene3d.makeContext(this);
    const saved = this.flags; this.flags = { menu: true };
    def.build(ctx, this);
    this.flags = saved;
    this.interaction.clear();
    this.horror.events = []; // no scripted scares behind the menu
    this.player.teleport(0, 2.5, 0);
    this._menuSpin = true;
  }

  // ------------------------------------------------------------ main loop
  _loop() {
    requestAnimationFrame(this._loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.time += dt;
    const st = this.state;
    if (st === S.MENU) {
      this.player.yaw += dt * 0.05; this.player.update(0);
      this.horror.update(dt, this.player.pos);
    }
    if (st === S.PLAYING || st === S.CUTSCENE) {
      this.player.update(dt);
      this.audio.update(dt, this.player.moving && this.player.enabled, this.player.sprinting);
      this.horror.update(dt, this.player.pos);
      this.chapterRuntime?.update?.(dt);
    }
    if (st === S.PLAYING || st === S.CUTSCENE || st === S.MODAL) this.dialogue.update(dt);
    this.interaction.update(st === S.PLAYING);
    this.scene3d.update(dt, this.player.pos, this.time);
    this.scene3d.render(this.time, Math.min(1, this.player.shake * 0.8));
    this._autoQuality(dt);
    if (this.debug && !$('debug').classList.contains('hidden')) this._debugTick(dt);
  }

  // Graphics quality: user choice, or 'auto' which steps down only if the frame rate stays low.
  setQuality(q) {
    this.settings.quality = q; this.save.saveSettings(this.settings);
    this.scene3d.setQuality(q === 'auto' ? (this._autoLevel || 'high') : q);
    $('btn-quality').textContent = `Graphics: ${q}${q === 'auto' ? ` (${this._autoLevel || 'high'})` : ''}`;
  }
  _autoQuality(dt) {
    if (this.settings.quality !== 'auto' || (this.state !== S.PLAYING && this.state !== S.CUTSCENE)) { this._qT = 0; this._qN = 0; return; }
    this._qT = (this._qT || 0) + dt; this._qN = (this._qN || 0) + 1;
    if (this._qT < 4) return;
    const fps = this._qN / this._qT; this._qT = 0; this._qN = 0;
    const lvl = this._autoLevel || 'high';
    const next = fps < 34 ? (lvl === 'high' ? 'medium' : lvl === 'medium' ? 'low' : 'low') : lvl;
    if (next !== lvl) { this._autoLevel = next; this.setQuality('auto'); console.info(`[quality] auto -> ${next} (${fps.toFixed(0)} fps)`); }
  }

  // ------------------------------------------------------------ debug
  _setupDebug() {
    const el = $('debug');
    el.innerHTML = `<div id="dbg-info"></div>
      ${CHAPTERS.map((c, i) => `<button data-dch="${i}">Ch${c.num}</button>`).join('')}
      <button id="dbg-solve">Solve puzzle</button><button id="dbg-noclip">Noclip</button><button id="dbg-next">Next chapter</button><button id="dbg-flash">Flashlight</button><button id="dbg-clear">Clear save</button>`;
    el.querySelectorAll('[data-dch]').forEach(b => b.onclick = () => this.selectChapter(+b.dataset.dch));
    $('dbg-solve').onclick = () => this.chapterRuntime?.debugSolve?.();
    $('dbg-noclip').onclick = () => { this.player.noclip = !this.player.noclip; };
    $('dbg-next').onclick = () => this.nextChapter();
    $('dbg-flash').onclick = () => { this.flags.flashlight = true; this.scene3d.setFlashlight(true); };
    $('dbg-clear').onclick = () => { this.save.clear(); this.ui.toast('Save cleared'); };
    this._fps = 0; this._fpsT = 0; this._fpsN = 0;
  }
  _debugTick(dt) {
    this._fpsT += dt; this._fpsN++;
    if (this._fpsT > 0.5) { this._fps = Math.round(this._fpsN / this._fpsT); this._fpsT = 0; this._fpsN = 0; }
    const p = this.player.pos, r = this.scene3d.renderer.info.render;
    $('dbg-info').textContent = `FPS ${this._fps} | ${this.state} | ch ${this.chapterIndex + 1}\npos ${p.x.toFixed(1)}, ${p.z.toFixed(1)} yaw ${this.player.yaw.toFixed(2)}\ncalls ${r.calls} tris ${r.triangles}`;
  }
}
