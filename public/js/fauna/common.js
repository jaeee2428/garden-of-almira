/* =====================================================================
   fauna/common.js - shared kit for every animal module
   part(): build a hidden source mesh to instance from · avoid(): walk around obstacles, the shore and the pond
   G.faunaKit.dt(): frame time (0 while ?at= freezes the animals for screenshots) · isDay(): birds & butterflies are out
   ===================================================================== */
(() => {
const { B, V3, scene } = G, P = G.POND;
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const soft = (n) => { const t = new B.DynamicTexture(n, { width: 64, height: 64 }, scene, true), g = t.getContext(), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); t.update(); t.hasAlpha = true; return t; };
const part = (mb, pivot) => { const m = mb.build('fauna', G.vc); m.setEnabled(false); m.isPickable = false; m.metadata = { pivot }; return m; };
function avoid(a, x, z, rad) {                                                           // walk around obstacles instead of through them
  for (const o of G.obstacles) {
    if (o.box) { const c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = x - o.x, dz = z - o.z; let lx = dx * c - dz * s, lz = dx * s + dz * c; const bx = o.hw + rad, bz = o.hd + rad; if (Math.abs(lx) < bx && Math.abs(lz) < bz) { if (bx - Math.abs(lx) < bz - Math.abs(lz)) lx = Math.sign(lx || 1) * bx; else lz = Math.sign(lz || 1) * bz; x = o.x + lx * c + lz * s; z = o.z - lx * s + lz * c; } }
    else { const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), m = o.r + rad; if (d < m && d > .001) { x = o.x + dx / d * m; z = o.z + dz / d * m; } }
  }
  const sx = G.shoreX(z) + 3; if (x < sx) x = sx; const pd = Math.hypot(x - P.x, z - P.z); if (pd < P.r + .6) { x = P.x + (x - P.x) / pd * (P.r + .6); z = P.z + (z - P.z) / pd * (P.r + .6); } return [x, z];
}
// steering for walking animals: look a little ahead; if a wall, trunk, bush, the pond or the shore is in the way, pick the
// nearest free heading (keeping to one side for a while so they don't dither) - they walk AROUND things instead of into them
const PG = new Map(), PC = 2;                                                           // plants in a 2 m grid, for cheap "is a bush here?" checks
const pkey = (x, z) => Math.floor(x / PC) * 4096 + Math.floor(z / PC);
const plantGrid = () => { if (PG.size || !G.plants) return; for (const p of G.plants) { const k = pkey(p.x, p.z); if (!PG.has(k)) PG.set(k, []); PG.get(k).push(p); } };
function bushAt(x, z, rad) {
  plantGrid(); const cx = Math.floor(x / PC), cz = Math.floor(z / PC);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = PG.get((cx + i) * 4096 + cz + j); if (L) for (const p of L) if (p.r > .3 && Math.hypot(p.x - x, p.z - z) < p.r * .55 + rad) return true; }
  return false;
}
const freeFor = (x, z, rad) => G.isFree(x, z, rad) && !bushAt(x, z, rad) && x > G.shoreX(z) + 3 && Math.hypot(x - P.x, z - P.z) > P.r + .6 + rad;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
function steer(a, dt, rad, others) {
  const look = rad + .3 + a.spd * .5, OFF = [0, .4, .8, 1.2, 1.7, 2.3, 3.0];
  if ((a.sideT = (a.sideT || 0) - dt) <= 0) a.side = 0;
  let best = null;
  for (const o of OFF) { for (const sd of o ? (a.side ? [a.side, -a.side] : [1, -1]) : [1]) { const h = a.yaw + o * sd; if (freeFor(a.x + Math.sin(h) * look, a.z + Math.cos(h) * look, rad)) { best = h; if (o) { a.side = sd; a.sideT = .8; } break; } } if (best !== null) break; }
  if (best === null) best = a.yaw + Math.PI;                                            // boxed in: turn round
  const dy = wrap(best - a.yaw); a.yaw += dy * (1 - Math.exp(-dt * 7));                   // turn smoothly onto the free heading
  let sx = 0, sz = 0; if (others) for (const b of others) if (b !== a) { const dx = a.x - b.x, dz = a.z - b.z, d = Math.hypot(dx, dz), m = rad + (b.rad || rad); if (d < m && d > 1e-3) { sx += dx / d * (m - d); sz += dz / d * (m - d); } }   // personal space
  const v = a.spd * (.45 + .55 * Math.max(0, Math.cos(dy)));                              // slow down while turning hard
  const nx = a.x + Math.sin(a.yaw) * v * dt + sx * Math.min(1, dt * 6), nz = a.z + Math.cos(a.yaw) * v * dt + sz * Math.min(1, dt * 6), p = avoid(a, nx, nz, rad);
  a.moved = (a.moved || 0) * Math.exp(-dt) + Math.hypot(p[0] - a.x, p[1] - a.z); a.x = p[0]; a.z = p[1];
}
G.faunaKit = { hash, soft, part, avoid, steer, freeFor, dt: dt => G.freezeFauna ? 0 : dt, isDay: () => (G.state.night || 0) < .55 };
})();
