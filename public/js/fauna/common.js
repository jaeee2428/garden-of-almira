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
G.faunaKit = { hash, soft, part, avoid, dt: dt => G.freezeFauna ? 0 : dt, isDay: () => (G.state.night || 0) < .55 };
})();
