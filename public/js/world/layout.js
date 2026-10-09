/* =====================================================================
   world/layout.js - where everything stands, and the two shared world registries
   G.L        : positions of the landmarks (house, tree, shrine, arch, ...). Move things HERE.
   G.hot      : clickable things  {pos:V3, r, kind, ...}  (kind -> card in data/lore.js)
   G.obstacles: things you bump into  {x,z,r}  or  {box:true,x,z,hw,hd,yaw}
   G.softSpots: ground space taken by things you can walk through (creepers) or that are planned but not built yet
   G.isFree / G.findFree / G.claim: one footprint check so assets never overlap (placements are NUDGED, never dropped)
   ===================================================================== */
(() => {
G.hot = [];            // click-able special things  {pos:V3, r, kind, name, ...}
G.obstacles = [];      // things you bump into when walking {x,z,r}  or  {box:true,x,z,hw,hd,yaw}
G.seats = G.seats || [];   // places you can sit (press L): { x, z, y seat height, yaw facing, r reach, kind, swing? }
G.L = { house: { x: 19, z: 4, yaw: Math.PI / 2 }, tree: { x: 0, z: 7.5 }, shrine: { x: -12, z: -8.5 }, arch: { x: -33.5 }, ring: { x: 13, z: -17 }, kubo: { x: -24.5, z: -27, yaw: .7 }, well: { x: 15.5, z: 15 }, hammock: { x: -33, z1: 12, z2: 7.6 },
  mango: [[28, -18], [-38, -30], [31, 27], [-4, 37], [8, -31]], bamboo: [[38, -12], [36, 24], [-8, 34], [-40, -22]] };
G.L.keepOut = [{ x: G.POND.x, z: G.POND.z, r: G.POND.r + 3.2 }, { x: G.L.kubo.x, z: G.L.kubo.z, r: 5 }, { x: G.L.well.x, z: G.L.well.z, r: 2.6 }, { x: -33, z: 9.8, r: 5 },
  ...G.L.mango.map(([x, z]) => ({ x, z, r: 4.6 })), ...G.L.bamboo.map(([x, z]) => ({ x, z, r: 3.6 }))];

/* ---------- footprints: nothing may overlap ---------- */
G.softSpots = [];
// planned footprints of things built later (props.js), so earlier placements already keep clear of them
G.L.mango.forEach(([x, z]) => G.softSpots.push({ x, z, r: 1.3, tag: 'mango' }));
G.L.bamboo.forEach(([x, z]) => G.softSpots.push({ x, z, r: 2.0, tag: 'bamboo' }));
G.softSpots.push({ x: G.L.kubo.x, z: G.L.kubo.z, r: 3.0, tag: 'kubo' }, { x: G.L.well.x, z: G.L.well.z, r: 1.5, tag: 'well' },
  { x: G.L.hammock.x, z: G.L.hammock.z1, r: .6, tag: 'hammock palm' }, { x: G.L.hammock.x, z: G.L.hammock.z2, r: .6, tag: 'hammock palm' },
  { x: G.L.hammock.x, z: (G.L.hammock.z1 + G.L.hammock.z2) / 2, r: 1.6, tag: 'hammock' });
const hitBox = (o, x, z, r) => { const c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = x - o.x, dz = z - o.z, lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) < o.hw + r && Math.abs(lz) < o.hd + r; };
G.isFree = (x, z, r) => {
  for (const o of G.obstacles) if (o.box ? hitBox(o, x, z, r) : Math.hypot(x - o.x, z - o.z) < o.r + r) return false;
  for (const o of G.softSpots) if (Math.hypot(x - o.x, z - o.z) < o.r + r) return false;
  return true;
};
// nearest free spot within maxShift metres (spiral search); ok(x,z) adds extra rules (e.g. stay on the sand)
G.findFree = (x, z, r, ok = () => true, maxShift = 4) => {
  if (G.isFree(x, z, r) && ok(x, z)) return [x, z, 0];
  for (let s = .25; s <= maxShift; s += .25) for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283 + s * 1.7, nx = x + Math.cos(a) * s, nz = z + Math.sin(a) * s; if (G.isFree(nx, nz, r) && ok(nx, nz)) return [nx, nz, s]; }
  return [x, z, -1];                                                      // nowhere free: keep it where it was (never drop an asset)
};
G.claim = (x, z, r, solid = true, tag = '') => (solid ? G.obstacles : G.softSpots).push({ x, z, r, tag });
G.moved = [];                                                             // what got nudged (printed with ?audit=1)
})();
