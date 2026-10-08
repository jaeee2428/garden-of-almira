/* =====================================================================
   engine/systems.js - the per-frame system registry (create / read / update / delete)
   Every module that animates something registers ONE system here instead of
   being called by name from the game loop. The loop (game/loop.js) just runs
   G.systems.run(t, dt, frame) once per frame, in `order`.

     G.systems.add('boats', (t, dt, frame) => ..., { order: 40, every: 2 })   create
     G.systems.get('boats')                                                   read
     G.systems.set('boats', { enabled: false, every: 3 })                     update
     G.systems.remove('boats')                                                delete
     G.systems.list()                                                         all, in run order
   ===================================================================== */
(() => {
const items = new Map(); let sorted = [];
const resort = () => { sorted = [...items.values()].sort((a, b) => a.order - b.order); };
G.systems = {
  add(name, fn, o = {}) {
    if (items.has(name)) console.warn('[systems] replacing', name);
    items.set(name, { name, fn, order: o.order ?? 50, every: o.every ?? 1, enabled: o.enabled ?? true, ms: 0 });
    resort(); return items.get(name);
  },
  get: name => items.get(name),
  set(name, patch) { const s = items.get(name); if (!s) return null; Object.assign(s, patch); resort(); return s; },
  remove(name) { const ok = items.delete(name); resort(); return ok; },
  list: () => sorted.slice(),
  run(t, dt, frame) {
    for (const s of sorted) {
      if (!s.enabled || frame % s.every) continue;
      try { s.fn(t, dt, frame); } catch (e) { s.enabled = false; console.error('[systems] ' + s.name + ' disabled after error:', e); }
    }
  },
};
})();
