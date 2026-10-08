/* =====================================================================
   flora/garden-beds.js - planting the buwakan (flower beds, hedges, pots), ground cover, arch vines, trees + their LOD
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng, scene, hFn, geo } = G;
const Rr = (a, b, r) => a + (b - a) * r();
const rand = G.rand, R = G.R, Q = G.Q;
const T = G.L.tree;
const NO = (G.params.get('no') || '').split(',');          // debugging switches: ?no=cover,trees,plants

/* ---------- where plants may grow ---------- */
const beds = [{ x: -30, z: 8, rx: 8, rz: 6 }, { x: -3, z: 29, rx: 12, rz: 4 }, { x: -26, z: -16, rx: 9, rz: 5 }, { x: -5, z: -27, rx: 11, rz: 5 }, { x: 22, z: -20, rx: 9, rz: 5 }, { x: 31, z: 12, rx: 5, rz: 9 }, { x: -37, z: -4, rx: 4, rz: 9 }, { x: -14, z: 10, rx: 15, rz: 8 }, { x: -10, z: -12, rx: 17, rz: 8 }, { x: 4, z: 14, rx: 9, rz: 6 }, { x: 5, z: -10, rx: 10, rz: 6 }, { x: 12, z: -3, rx: 5, rz: 5 }, { x: -30, z: 8, rx: 7, rz: 6 }, { x: -29, z: -9, rx: 7, rz: 5 }, { x: 24, z: 16, rx: 6, rz: 5 }];
const inBeds = (x, z) => beds.some(b => ((x - b.x) / b.rx) ** 2 + ((z - b.z) / b.rz) ** 2 < 1);
const H = G.L.house, hc = Math.cos(H.yaw), hs = Math.sin(H.yaw);
const nearHouse = (x, z, m = 0) => { const dx = x - H.x, dz = z - H.z, lx = dx * hc - dz * hs, lz = dx * hs + dz * hc; return Math.abs(lx) < 5.9 + m && lz > -8.6 - m && lz < 5 + m; };
G.nearHouse = nearHouse;
const blocked = (x, z, pc) => nearHouse(x, z, 1) || G.path.dist(x, z) < pc || Math.hypot(x - G.L.shrine.x, z - G.L.shrine.z) < 2.2 || Math.hypot(x - G.L.ring.x, z - G.L.ring.z) < 4.4 || G.L.keepOut.some(k => Math.hypot(x - k.x, z - k.z) < k.r) || G.pergola.frames.some(f => [-1, 1].some(sd => Math.hypot(f.p.x + f.N.x * 1.9 * sd - x, f.p.z + f.N.z * 1.9 * sd - z) < 1.0)) || [-1, 1].some(sd => Math.hypot(G.arch.ax - x, G.arch.az + 1.75 * sd - z) < 1.0) || Math.hypot(x - T.x, z - T.z) < 1.4 || Math.hypot(x - (T.x + 1.6), z - (T.z + 2.4)) < 1.5 || x < G.shoreX(z) + 5;
G.blocked = blocked;

/* ---------- the plants: every kind is built once, then planted hundreds of times ---------- */
const kinds = [
  { sp: 'gumamela', v: 'red', w: 14, build: s => geo.gumamela('red', s), H: 1.3, sc: [.85, 1.25] },
  { sp: 'gumamela', v: 'pink', w: 6, build: s => geo.gumamela('pink', s), H: 1.3, sc: [.85, 1.2] },
  { sp: 'gumamela', v: 'yellow', w: 5, build: s => geo.gumamela('yellow', s), H: 1.3, sc: [.85, 1.2] },
  { sp: 'gumamela', v: 'orange', w: 4, build: s => geo.gumamela('orange', s), H: 1.3, sc: [.85, 1.2] },
  { sp: 'sampaguita', v: 'w', w: 22, build: s => geo.sampaguita(s), H: .9, sc: [.85, 1.3] },
  { sp: 'kalachuchi', v: 'white', w: 7, build: s => geo.kalachuchi('white', s), H: 1.7, sc: [.9, 1.25] },
  { sp: 'kalachuchi', v: 'pink', w: 5, build: s => geo.kalachuchi('pink', s), H: 1.7, sc: [.9, 1.25] },
  { sp: 'santan', v: 'red', w: 14, build: s => geo.santan('red', s), H: .95, sc: [.85, 1.3] },
  { sp: 'santan', v: 'yellow', w: 7, build: s => geo.santan('yellow', s), H: .95, sc: [.85, 1.3] },
  { sp: 'dama', v: 'n', w: 10, build: s => geo.dama(s), H: 1.5, sc: [.85, 1.25] },
  { sp: 'bogambilya', v: 'm', w: 5, build: s => geo.bougainvillea('magenta', s), H: 1.5, sc: [.9, 1.3] },
  { sp: 'bogambilya', v: 'o', w: 3, build: s => geo.bougainvillea('orange', s), H: 1.5, sc: [.9, 1.3] },
  { sp: 'rosas', v: 'red', w: 7, build: s => geo.rosas('red', s), H: 1.0, sc: [.85, 1.25] },
  { sp: 'rosas', v: 'pink', w: 6, build: s => geo.rosas('pink', s), H: 1.0, sc: [.85, 1.25] },
  { sp: 'rosas', v: 'white', w: 4, build: s => geo.rosas('white', s), H: 1.0, sc: [.85, 1.25] },
  { sp: 'rosas', v: 'yellow', w: 4, build: s => geo.rosas('yellow', s), H: 1.0, sc: [.85, 1.25] },
  { sp: 'canna', v: 'red', w: 5, build: s => geo.canna('red', s), H: 1.3, sc: [.85, 1.2] },
  { sp: 'canna', v: 'yellow', w: 4, build: s => geo.canna('yellow', s), H: 1.3, sc: [.85, 1.2] },
  { sp: 'heliconia', v: 'h', w: 5, build: s => geo.heliconia(s), H: 1.5, sc: [.85, 1.2] },
  { sp: 'kamia', v: 'k', w: 6, build: s => geo.kamia(s), H: 1.3, sc: [.85, 1.2] },
];
G.kinds = kinds;
const bag = kinds.flatMap((k, i) => Array(k.w).fill(i));
G.plants = [];                                                     // every plant, for picking
const groups = kinds.map(() => ({ list: [] }));
const clusters = []; for (let i = 0; i < 34; i++) { const b = beds[i % beds.length]; clusters.push({ x: b.x + R(-b.rx, b.rx), z: b.z + R(-b.rz, b.rz), k: bag[Math.floor(rand() * bag.length)] }); }
function addPlant(ki, x, z, o) {
  const k = kinds[ki], p = { x, z, y: o && o.y !== undefined ? o.y : hFn(x, z) - .02, s: o && o.s ? o.s : R(k.sc[0], k.sc[1]) * 1.12, yaw: rand() * 6.28, lx: R(-.04, .04), lz: R(-.04, .04), ph: rand() * 6.28, ki, sp: k.sp, H: k.H };
  p.H *= p.s; p.r = .55 * p.s; groups[ki].list.push(p); G.plants.push(p); return p;
}
const idxOf = (sp, v) => kinds.findIndex(k => k.sp === sp && (!v || k.v === v));
(function plant(N) {
  let guard = 0;
  while (G.plants.length < N && guard++ < N * 60) {
    let x, z;
    if (rand() < .72) { const b = beds[Math.floor(rand() * beds.length)], a = rand() * 6.283, rr = Math.sqrt(rand()); x = b.x + Math.cos(a) * rr * b.rx; z = b.z + Math.sin(a) * rr * b.rz; }
    else { const a = rand() * 6.283, rr = Math.sqrt(rand()) * 40; x = Math.cos(a) * rr; z = Math.sin(a) * rr; }
    if (blocked(x, z, 1.5)) continue;
    // keep a little personal space between shrubs
    let ok = true; for (let i = Math.max(0, G.plants.length - 60); i < G.plants.length; i++) { const p = G.plants[i]; if ((p.x - x) ** 2 + (p.z - z) ** 2 < .5) { ok = false; break; } } if (!ok) continue;
    let near = clusters[0], nd = 1e9; for (const c of clusters) { const d = Math.hypot(c.x - x, c.z - z); if (d < nd) { nd = d; near = c; } }
    addPlant((nd < 7 && rand() < .78) ? near.k : bag[Math.floor(rand() * bag.length)], x, z);
  }
})(Math.round(430 * Q));
G.potSpots = [];
(function pottedPlants() {                                   // flowers in clay pots along the stairs and porch
  const r = rng(77), spots = [[-6.0, -6.4], [-6.9, -5.2], [2.2, -6.5], [3.1, -6.6], [4.1, -6.2], [5.6, -6.0], [-1.9, -7.4], [-6.6, -3.6], [6.3, -4.4], [0.6, -7.0]], opts = [['gumamela', 'red'], ['santan', 'red'], ['rosas', 'pink'], ['gumamela', 'yellow'], ['canna', 'red'], ['rosas', 'white'], ['santan', 'yellow'], ['rosas', 'red'], ['gumamela', 'orange'], ['canna', 'yellow']];
  spots.forEach(([lx, lz], i) => { const p = G.houseLocalToWorld(lx, 0, lz), gy = hFn(p.x, p.z), s = .46 + r() * .12; addPlant(idxOf(opts[i][0], opts[i][1]), p.x, p.z, { y: gy + .46 * 1.0, s }); G.potSpots.push({ x: p.x, z: p.z, y: gy, s: 1 + r() * .3 }); });
})();
(function pathHedges() {                                   // Philippine yards are lined along the path: sampaguita hedges, santan borders, gumamela
  const pts = G.path.pts, r = rng(909); let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]; acc += B.Vector3.Distance(a, b); if (acc < .95 / Math.max(.6, Q)) continue; acc = 0;
    const T = b.subtract(a).normalize(), nx = -T.z, nz = T.x;
    for (const sd of [-1, 1]) { const off = 1.75 + Rr(0, .5, r), x = b.x + nx * off * sd + Rr(-.2, .2, r), z = b.z + nz * off * sd + Rr(-.2, .2, r); if (blocked(x, z, 1.3) || false) continue;
      const q = r(); addPlant(q < .5 ? idxOf('sampaguita') : q < .78 ? idxOf('santan', r() < .7 ? 'red' : 'yellow') : q < .92 ? idxOf('gumamela', pick4(r)) : idxOf('dama'), x, z); }
  }
})();
function pick4(r) { const q = r(); return q < .5 ? 'red' : q < .7 ? 'pink' : q < .85 ? 'yellow' : 'orange'; }

// the night-blooming dama de noche flowers glow after dusk
G.damaMat = G.mat('damaGlow', { diffuse: new C3(1, 1, 1), emissive: new C3(.03, .04, .02) }); G.nightObjs.push({ mat: G.damaMat, day: new C3(.03, .04, .02), night: new C3(.55, .6, .32) });
// quality tiers: how far each level of detail reaches, and what gets switched off on weaker machines
G.TIERS = G.CONFIG.lodTiers;
G.QUAL = G.TIERS[2];
// every plant kind is built three times (full, medium, far) and drawn by distance
kinds.forEach((k, ki) => {
  const g = groups[ki]; if (!g.list.length) return; g.lod = [];
  for (let l = 0; l < 3; l++) {
    G.setLOD(l); const mbs = k.build(100 + ki * 7), meshes = mbs.map((mb, mi) => { const m = mb.build(k.sp + k.v + mi + 'L' + l, G.mats.shrub); m.alwaysSelectAsActiveMesh = true; if (k.sp === 'dama' && mi === 1) m.material = G.damaMat; return m; });
    const buf = new Float32Array(g.list.length * 16); meshes.forEach(m => { m.thinInstanceSetBuffer('matrix', buf, 16, false); m.isVisible = false; }); g.lod.push({ meshes, buf, n: 0 });
  }
  G.setLOD(0);
});

const _q = new B.Quaternion(), _s = new V3(), _p = new V3(), _m = new B.Matrix();
G.camFwd = new V3(1, 0, 0); G.stats = { drawn: 0 }; G.pulsing = false;
let _fr = 0, _lx = 1e9, _lz = 1e9, _lyaw = 1e9;
// Wind now bends every vertex on the GPU (see WindPlugin in core.js), so this only decides WHICH plants to draw at which detail level.
G.swayPlants = t => {
  if (NO.includes('plants')) return;
  _fr++; const cam = G.camera.position, yaw = Math.atan2(G.camFwd.x, G.camFwd.z), moved = Math.abs(cam.x - _lx) + Math.abs(cam.z - _lz) > 1.2, turned = Math.abs(Math.atan2(Math.sin(yaw - _lyaw), Math.cos(yaw - _lyaw))) > .08;
  if (!(G.pulsing || moved || turned || _fr % 6 === 0)) return;
  _lx = cam.x; _lz = cam.z; _lyaw = yaw; let pulsing = false;
  const Qd = G.QUAL, d0 = Qd.d0 * Qd.d0, d1 = Qd.d1 * Qd.d1, cull = Qd.cull * Qd.cull, fl = Math.hypot(G.camFwd.x, G.camFwd.z) || 1, fx = G.camFwd.x / fl, fz = G.camFwd.z / fl; let drawn = 0;
  for (const g of groups) { const L = g.lod; if (!L) continue; L[0].n = L[1].n = L[2].n = 0; const list = g.list;
    for (let i = 0; i < list.length; i++) {
      const p = list[i], dx = p.x - cam.x, dz = p.z - cam.z, d2 = dx * dx + dz * dz; if (d2 > cull) continue;
      if (d2 > 25 && dx * fx + dz * fz < -9) continue;                     // well behind you: not drawn at all
      const lv = d2 < d0 ? 0 : d2 < d1 ? 1 : 2, l = L[lv];
      if (p.pulse > 0) { p.pulse = Math.max(0, p.pulse - .035); pulsing = true; } const sc = p.s * (1 + (p.pulse || 0) * .16);
      B.Quaternion.RotationYawPitchRollToRef(p.yaw, p.lx, p.lz, _q); _s.set(sc, sc, sc); _p.set(p.x, p.y, p.z); M4.ComposeToRef(_s, _q, _p, _m); _m.copyToArray(l.buf, (l.n++) * 16); drawn++;
    }
    for (const l of L) for (const m of l.meshes) { if (l.n > 0) { m.isVisible = true; m.thinInstanceCount = l.n; m.thinInstanceBufferUpdated('matrix'); } else m.isVisible = false; }
  }
  G.pulsing = pulsing; G.stats.drawn = drawn;
};

/* ---------- ground cover: meadow flowers and grass tufts ---------- */
(function groundcover() {
  if (NO.includes('cover')) { G.cover = []; G.updateCover = () => { }; return; }
  const wf = [geo.wildflower(1)[0].build('wf1', G.mats.wild), geo.wildflower(3)[0].build('wf3', G.mats.wild)], gr = [geo.grassBlade(5)[0].build('g1', G.mats.grass), geo.grassBlade(6)[0].build('g2', G.mats.grass)], tmp = new B.Matrix(), r = rng(3), CELL = 20;
  [...wf, ...gr].forEach(m => m.setEnabled(false)); G.cover = []; const vds = new Map();
  const fill = (srcs, N, maxR, pc, scMin, scMax, tilt, ySq) => {
    const cells = new Map(); let n = 0;
    while (n < N) { const a = r() * 6.283, rr = Math.sqrt(r()) * maxR, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (blocked(x, z, pc) || x < G.shoreX(z) + 6.2 + G.vnoise(x * .3, z * .3) * 1.5) continue;        // grass stops where the dry sand begins (ragged edge)
      const s = Rr(scMin, scMax, r);
      M4.ComposeToRef(new V3(s, s * Rr(ySq[0], ySq[1], r), s), B.Quaternion.RotationYawPitchRoll(r() * 6.28, tilt ? Rr(-tilt, tilt, r) : 0, tilt ? Rr(-tilt, tilt, r) : 0), new V3(x, hFn(x, z) - .015, z), tmp);
      const key = Math.floor(x / CELL) + ',' + Math.floor(z / CELL) + ',' + Math.floor(r() * srcs.length), arr = cells.get(key) || []; arr.push(...tmp.toArray()); cells.set(key, arr); n++; }
    for (const [key, arr] of cells) { const [cx, cz, vi] = key.split(',').map(Number), m = new B.Mesh('cov' + key, scene); (vds.get(srcs[vi]) || (vds.set(srcs[vi], B.VertexData.ExtractFromMesh(srcs[vi])), vds.get(srcs[vi]))).applyToMesh(m); m.material = srcs[vi].material; m.isPickable = false; m.thinInstanceSetBuffer('matrix', new Float32Array(arr), 16, true); m.thinInstanceRefreshBoundingInfo(true); G.cover.push({ m, x: (cx + .5) * CELL, z: (cz + .5) * CELL }); }
  };
  if (!NO.includes('wf')) fill(wf, Math.round(8000 * Q), 46, .5, .8, 1.5, .12, [.8, 1.3]);
  if (!NO.includes('grass')) fill(gr, Math.round(24000 * Q), 62, .3, .8, 1.9, 0, [.7, 1.3]);
  let k = 0; G.updateCover = () => { const c = G.camera.position, lim = G.QUAL.grass + 14; for (const e of G.cover) e.m.setEnabled(Math.hypot(e.x - c.x, e.z - c.z) < lim); };
})();

/* ---------- bougainvillea & kadena de amor on the entrance arch ---------- */
(function archVines() {
  const a = G.arch, r = rng(21), cols = [G.geo.BOUGAIN.magenta, G.geo.BOUGAIN.magenta, G.geo.BOUGAIN.orange, G.geo.BOUGAIN.white];
  const clusters = cols.map((c, i) => { const m = new MB(); geo.bougainBract(m, basis(new V3(0, 0, 1), V3.Up(), V3.Zero(), 0, 1.6), c, rng(i + 30)); return m.build('cl' + i, G.mats.vine); });
  const leafM = (() => { const m = new MB(); geo.leaf(m, .09, .06, basis(new V3(0, 0, 1), V3.Up(), V3.Zero()), rgb('#2b6a30'), rgb('#59a042'), { nu: 4, nv: 2, base: .6, sharp: .6, fold: .3 }); return m.build('bl', G.mats.vine); })();
  const buf = clusters.map(() => []), lb = [], tmp = new B.Matrix(), vines = new MB();
  for (let k = 0; k < 4; k++) { const off = (k % 2 ? 1 : -1) * .06, pts = a.curve.map((p, i) => new V3(p.x + off + Math.sin(i * 1.3 + k) * .08, p.y + Math.sin(i * .9 + k * 2) * .1, p.z + Math.cos(i * 1.1 + k) * .08)); vines.tube(pts, [.018, .012], 5, () => rgb('#5a4a30')); }
  const down = [[-1.75, 0], [1.75, 0]]; for (const [dz] of down) { const pts = []; for (let i = 0; i <= 10; i++) pts.push(new V3(a.ax + Math.sin(i + dz) * .1, a.ay + 2.3 * (1 - i / 10), a.az + dz + Math.cos(i) * .1)); vines.tube(pts, .02, 5, () => rgb('#5a4a30')); }
  vines.build('archVines');
  const place = (n, spread) => { for (let i = 0; i < n; i++) { const t = r(), idx = t * (a.curve.length - 1), j = Math.floor(idx), p = V3.Lerp(a.curve[j], a.curve[Math.min(j + 1, a.curve.length - 1)], idx - j), under = r() < .35;
    const out = new V3(Rr(-.6, .6, r), under ? Rr(-.2, .8, r) : Rr(.2, 1, r), Rr(-.6, .6, r)).normalize(); const s = Rr(.9, 1.6, r), pos = p.add(new V3(Rr(-.18, .18, r), Rr(-.1, .22, r) * spread, Rr(-.18, .18, r)));
    M4.ComposeToRef(new V3(s, s, s), B.Quaternion.FromRotationMatrix(basis(out, V3.Up(), V3.Zero(), r() * 6.28)), pos, tmp); buf[Math.floor(r() * 4)].push(...tmp.toArray()); } };
  place(Math.round(260 * Q + 40), 1);
  for (let i = 0; i < 380 * Q + 60; i++) { const t = r(), idx = t * (a.curve.length - 1), j = Math.floor(idx), p = V3.Lerp(a.curve[j], a.curve[Math.min(j + 1, a.curve.length - 1)], idx - j), s = Rr(.9, 1.7, r); M4.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(r() * 6.28, Rr(-.8, .8, r), r() * 6.28), p.add(new V3(Rr(-.2, .2, r), Rr(-.12, .2, r), Rr(-.2, .2, r))), tmp); lb.push(...tmp.toArray()); }
  clusters.forEach((m, i) => { m.thinInstanceSetBuffer('matrix', new Float32Array(buf[i]), 16, true); m.alwaysSelectAsActiveMesh = true; }); leafM.thinInstanceSetBuffer('matrix', new Float32Array(lb), 16, true); leafM.alwaysSelectAsActiveMesh = true;
  G.hot.push({ pos: new V3(a.ax, a.ay + 3.4, a.az), r: 1.7, kind: 'plant', sp: 'bogambilya' }, { pos: G.pergola.center.add(new V3(0, 1.9, 0)), r: 2.4, kind: 'plant', sp: 'kadena' });
})();

/* ---------- ilang-ilang trees, coconut palms, bananas (each has 3 levels of detail) ---------- */
const trees = [];
(function bigTrees() {
  if (NO.includes('trees')) { G.trees = []; return; }
  const buildLODs = (fn) => [0, 1, 2].map(l => { G.setLOD(l); const r = fn(); return r; }), done = () => G.setLOD(0);
  const addTree = (x, z, levels, th, sway) => { levels.forEach((ms, i) => ms.forEach(m => { m.setEnabled(false); if (m.isInstance === undefined) { } G.cast(m.sourceMesh || m); })); trees.push({ x, z, levels, t: th, cur: -1, sway, ph: rand() * 6.28 }); };
  const place = (x, z, seed) => { const y = hFn(x, z); const lv = buildLODs(() => geo.ilangIlang(seed).map((mb, i) => { const m = mb.build('ilang' + seed + i, G.mats.tree); m.position.set(x, y, z); m.receiveShadows = false; return m; })); done(); addTree(x, z, lv, [24, 60, 150], false); G.obstacles.push({ x, z, r: .55 }); G.hot.push({ pos: new V3(x, y + 4.4, z), r: 2.6, kind: 'plant', sp: 'ilangilang' }); };
  place(T.x, T.z, 11); place(T.x - 15, T.z + 12, 12); place(18, -8, 13);
  const palmSrc = [1, 2, 3, 4].map(s => buildLODs(() => { const p = geo.coconutPalm(s * 31), m = p.mb.build('palm' + s, G.mats.palm); m.setEnabled(false); m.isPickable = false; return m; })); done();
  G.palmSrc = palmSrc;
  const spots = [[-38, 12], [-40, -10], [-36, 26], [-42, 0], [-30, -22], [-20, 22], [-26, 20], [-2, -22], [10, 20], [14, -14], [26, 12], [27, -4], [22, 22], [8, 28], [-8, 24], [32, -12], [-18, -26], [36, 6]];
  const onLand = (x, z) => x > G.shoreX(z) + 4.5;                       // palms lean over the sand but stand on firm ground
  const nudge = (x, z, r, tag) => { const [nx, nz, m] = G.findFree(x, z, r, onLand); if (m) G.moved.push(tag + ' ' + x + ',' + z + ' -> ' + nx.toFixed(1) + ',' + nz.toFixed(1)); G.claim(nx, nz, r, false, tag); return [nx, nz]; };   // claimed one by one, so they also keep clear of each other
  spots.map(([x, z]) => nudge(x, z, .8, 'palm')).forEach(([x, z], i) => { const srcs = palmSrc[i % 4], y = hFn(x, z), yaw = rand() * 6.28, sc = R(.85, 1.15), inst = srcs.map((src, l) => { const m = src.createInstance('palmI' + i + 'L' + l); m.position.set(x, y - .05, z); m.rotation.y = yaw; m.scaling.setAll(sc); m.isPickable = false; return m; }); addTree(x, z, inst.map(m => [m]), [26, 62, 170], true); Object.assign(trees[trees.length - 1], { pidx: i % 4, yaw, sc }); G.obstacles.push({ x, z, r: .5 }); });
  const banSrc = [1, 2, 3].map(s => buildLODs(() => { const m = geo.bananaPlant(s * 17).build('banana' + s, G.mats.banana); m.setEnabled(false); m.isPickable = false; return m; })); done();
  [[28, 1], [29, 6.5], [27.5, 11], [25, 16], [30, -3], [-33, 14], [-36, 18], [-34, -17], [-37, -12], [23, -12], [20, 24], [16, -2]].map(([x, z]) => nudge(x, z, 1.0, 'banana')).forEach(([x, z], i) => { const srcs = banSrc[i % 3], y = hFn(x, z), yaw = rand() * 6.28, sc = R(.85, 1.2), inst = srcs.map((src, l) => { const m = src.createInstance('banI' + i + 'L' + l); m.position.set(x, y - .05, z); m.rotation.y = yaw; m.scaling.setAll(sc); m.isPickable = false; return m; }); addTree(x, z, inst.map(m => [m]), [20, 48, 120], true); G.obstacles.push({ x, z, r: .4 }); });
  G.trees = trees;
})();
G.updateTrees = () => { const c = G.camera.position; for (const tr of G.trees) { const d = Math.hypot(tr.x - c.x, tr.z - c.z), lv = d < tr.t[0] ? 0 : d < tr.t[1] ? 1 : d < tr.t[2] ? 2 : 3; if (lv !== tr.cur) { tr.levels.forEach((ms, i) => ms.forEach(m => m.setEnabled(i === lv))); tr.cur = lv; } } };
G.systems.add('plantLOD', t => G.swayPlants(t), { order: 10 });           // wind is on the GPU; this only picks detail levels
G.systems.add('treeLOD', () => G.updateTrees(), { order: 12, every: 10 });

})();
