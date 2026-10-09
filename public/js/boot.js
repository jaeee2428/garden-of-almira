/* =====================================================================
   boot.js - loads every module in dependency order (the ONE place that lists them)
   Scripts download in parallel but execute in this order (async = false).
   Add a new module by adding its path here, after everything it reads from G.
   window.__t records when each layer finished (printed with READY_MS).
   ===================================================================== */
(() => {
// ?log=1 : mirror console output (?showlog=1 also draws it on screen, for headless screenshots) + uncaught errors into <pre id="__log"> (headless checks read it with --dump-dom)
if (/[?&]log=1/.test(location.search)) {
  const out = []; const pre = document.createElement('pre'); pre.id = '__log'; pre.style.cssText = /showlog=1/.test(location.search) ? 'position:fixed;left:0;top:0;z-index:99;max-width:60vw;margin:0;padding:6px;font:11px/1.25 monospace;color:#fff;background:rgba(0,0,0,.65);white-space:pre-wrap;pointer-events:none' : 'display:none'; document.body.appendChild(pre);
  const put = (k, a) => { out.push(k + ' ' + [...a].map(x => x && x.stack ? x.stack : String(x)).join(' ')); pre.textContent = out.join('\n'); };
  for (const k of ['log', 'warn', 'error']) { const f = console[k].bind(console); console[k] = (...a) => { put(k.toUpperCase(), a); f(...a); }; }
  addEventListener('error', e => put('UNCAUGHT', [e.message + ' @ ' + (e.filename || '').split('/js/')[1] + ':' + e.lineno]));
}
// the hero flowers: one folder each in public/flowers/<id>/ (card + model + renders)
const FLOWERS = ['sampaguita', 'gumamela', 'kalachuchi', 'santan', 'dama', 'bogambilya', 'kadena', 'ilangilang', 'rosas', 'canna', 'heliconia', 'kamia', 'orkidyas', 'liryo', 'adelfa', 'pukingan', 'tsampaka', 'rosal'];
const MODULES = [
  // 1 · config + engine core
  'config/settings', 'engine/engine', 'engine/systems', 'engine/wind', 'engine/physics', 'engine/mesh-builder',
  // 2 · the world's base: land, sky, sea, then lights/camera/post and the day cycle (needs sky + sea)
  'world/terrain', 'world/sky', 'world/sea', 'engine/render', 'engine/time-of-day',
  // 3 · content data (cards)
  'data/flowers', ...FLOWERS.map(f => `flowers/${f}/card`), 'data/lore',
  // 4 · plant geometry library, then the built world
  'flora/plant-geometry', 'flora/plant-geometry-extra', 'flora/plant-geometry-heritage',
  'world/layout', 'world/structures', 'flora/garden-beds', 'fx/particles', 'world/props', 'world/hill-forest', 'flora/wild-plants',
  // 5 · folk-tale lights, then the animals
  'fx/magic', 'fauna/common', 'fauna/chickens', 'fauna/birds', 'fauna/insects', 'fauna/night-glow',
  // 6 · player, interaction, HUD, loop (starts rendering), sound, dev switches
  'game/controls', 'game/avatar', 'game/interaction', 'ui/hud', 'game/loop', 'audio/soundscape', 'dev/debug',
];
const t = window.__t = window.__t || [];
for (const m of MODULES) {
  const s = document.createElement('script'); s.src = m.startsWith('flowers/') ? `/${m}.js` : `/js/${m}.js`; s.async = false;
  s.onload = () => t.push([m, Math.round(performance.now())]);
  s.onerror = () => { console.error('[boot] failed to load ' + m); document.getElementById('loading').textContent = 'could not load ' + m; };
  document.body.appendChild(s);
}
})();
