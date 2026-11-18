// Shared helpers for chapter scripts.
export const inBox = (p, x, z, w, d) => Math.abs(p.x - x) < w / 2 && Math.abs(p.z - z) < d / 2;

// Examinable object -> opens a document and stores it in notes.
export function examine(ctx, obj, note, prompt = 'Examine', extra) {
  return ctx.interact(obj, { id: `ex_${note.id}`, prompt, onUse: () => { ctx.game.readNote(note); extra?.(); } });
}

// Pickup -> adds item (and optional note) to inventory, hides object, checkpoints.
export function pickup(ctx, obj, item, { prompt, note, after } = {}) {
  const g = ctx.game;
  if (g.flags[`got_${item.id}`]) { obj.visible = false; return null; }
  const def = ctx.interact(obj, {
    id: `pk_${item.id}`, prompt: prompt || `Take ${item.name}`,
    onUse: () => { if (note) g.inventory.addNote(note); g.pickup(item, def, obj); after?.(); },
  });
  return def;
}

// Exit door that only opens when `canOpen()`; walking through the doorway zone advances the chapter.
export function exitDoor(ctx, door, { canOpen, lockedText, zone, openPrompt = 'Open door', onOpen }) {
  const g = ctx.game;
  ctx.interact(door.leaf, {
    id: 'exit_door',
    prompt: () => door.isOpen ? 'Doorway' : (canOpen() ? openPrompt : 'Try the door'),
    onUse: () => {
      if (door.isOpen) return;
      if (!canOpen()) { g.audio.thud(); g.ui.toast(typeof lockedText === 'function' ? lockedText() : lockedText); return; }
      door.open(); onOpen?.();
    },
  });
  return {
    update() { if (door.isOpen && inBox(g.player.pos, ...zone)) g.nextChapter(); },
  };
}

// Figure helper: visibility + optional walking toward a point.
export function figure(ctx, obj, x, z, rotY = 0) {
  ctx.add(obj, x, 0, z, rotY);
  obj.visible = false;
  const f = {
    obj, walking: null,
    show(x2 = x, z2 = z, face) { obj.position.set(x2, 0, z2); obj.visible = true; if (face) f.face(face); },
    hide() { obj.visible = false; f.walking = null; },
    face(p) { obj.rotation.y = Math.atan2(p.x - obj.position.x, p.z - obj.position.z); },
    walkTo(tx, tz, speed = 0.8) { f.walking = { tx, tz, speed }; },
  };
  ctx.game.horror.every(dt => {
    if (f.walking && obj.visible) {
      const dx = f.walking.tx - obj.position.x, dz = f.walking.tz - obj.position.z, d = Math.hypot(dx, dz);
      if (d < 0.05) f.walking = null;
      else { obj.position.x += dx / d * Math.min(d, f.walking.speed * dt); obj.position.z += dz / d * Math.min(d, f.walking.speed * dt); obj.rotation.y = Math.atan2(dx, dz); }
    }
    if (obj.visible) obj.position.y = Math.sin(ctx.game.time * 1.3) * 0.015;
  });
  return f;
}
