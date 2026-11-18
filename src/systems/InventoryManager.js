// Holds key items and read documents ("notes"). Items can never be dropped,
// which keeps every puzzle solvable once its clue item has been collected.
export class InventoryManager {
  constructor(bus) {
    this.bus = bus;
    this.items = [];   // { id, name, desc }
    this.notes = [];   // { id, title, body, style }
  }
  reset(items = [], notes = []) { this.items = items.map(i => ({ ...i })); this.notes = notes.map(n => ({ ...n })); this.bus.emit('inventory:changed', this); }
  has(id) { return this.items.some(i => i.id === id); }
  add(item) {
    if (this.has(item.id)) return false;
    this.items.push({ ...item });
    this.bus.emit('inventory:changed', this);
    this.bus.emit('toast', `Picked up: ${item.name}`);
    return true;
  }
  remove(id) { this.items = this.items.filter(i => i.id !== id); this.bus.emit('inventory:changed', this); }
  addNote(note) {
    if (this.notes.some(n => n.id === note.id)) return false;
    this.notes.push({ ...note });
    this.bus.emit('inventory:changed', this);
    return true;
  }
  snapshot() { return { items: this.items.map(i => ({ ...i })), notes: this.notes.map(n => ({ ...n })) }; }
}
