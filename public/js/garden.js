/* =====================================================================
   garden.js - planting the buwakan, the trees, and everything alive
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng, scene, hFn, geo } = G;
const Rr = (a, b, r) => a + (b - a) * r();
const rand = G.rand, R = G.R, Q = G.Q;
const T = G.L.tree;
const NO = (G.params.get('no') || '').split(',');          // debugging switches: ?no=cover,trees,plants

/* ---------- information about each flower (for the guide card) ---------- */
G.INFO = {
  sampaguita: { ceb: 'Sampaguita', sci: 'Jasminum sambac', color: '#f5f2e6', fact: "The national flower; its name comes from sumpa kita, “I promise you”. Called manul in Bisaya. Garlands go on holy images and altars. In folk medicine a decoction of the flowers is taken for fever and cough and used as an eyewash for red, swollen eyes, and bruised leaves are laid on the breasts to dry up milk." },
  gumamela: { ceb: 'Gumamela', sci: 'Hibiscus rosa-sinensis', color: '#d3122c', fact: "Folk healers pound the flower buds and leaves into a poultice for boils, abscesses and mumps, and drink a decoction for cough. Children crush the petals to make soapy bubbles, and the flowers heated in coconut oil were used on the hair. Each bloom lasts one day." },
  kalachuchi: { ceb: 'Kalachuchi', sci: 'Plumeria rubra', color: '#fff2d8', fact: "The frangipani, often planted in churchyards and cemeteries. In folk use the bark decoction is held on the gums for toothache and the milky sap, mixed with coconut oil, is rubbed on rheumatic joints; the leaves are poulticed on bruises and scabies. The sap irritates skin and the plant is toxic if eaten." },
  santan: { ceb: 'Santan', sci: 'Ixora coccinea', color: '#e5381a', fact: "Tiny four-petalled flowers in round clusters, a classic hedge in Philippine yards. In folk medicine the root decoction is taken for nausea and hiccups and gargled for sore throat, the flower decoction for dysentery, and fresh leaves are poulticed on sprains, boils and bruises." },
  dama: { ceb: 'Dama de Noche', sci: 'Cestrum nocturnum', color: '#e4efc2', fact: "“Lady of the night”: the greenish-yellow tubes open after dusk and the scent carries far. It is grown for its fragrance; I found no Philippine medicinal use recorded for it, and all parts are toxic, so it is not a plant for teas." },
  bogambilya: { ceb: 'Bogambilya', sci: 'Bougainvillea', color: '#d1186a', fact: "The bright “petals” are bracts around three tiny cream flowers; thorny stems climb arches and walls across the Visayas. Elsewhere (Mexico) the flowers are steeped as a tea for cough, but I did not find a documented Visayan medicinal use." },
  kadena: { ceb: 'Kadena de Amor', sci: 'Antigonon leptopus', color: '#ff7fa8', fact: "The “chain of love”, a vine with heart-shaped leaves and sprays of small pink flowers. Philippine folk uses recorded for it: leaf tea for blood sugar, blossoms for high blood pressure, and leaves applied to reduce swelling and to close wounds." },
  ilangilang: { ceb: 'Ilang-ilang', sci: 'Cananga odorata', color: '#d9d24a', fact: "The perfume tree, native to the Philippines, with long drooping branches and curled yellow-green flowers. The flower oil, mixed with coconut oil, made the old hair oil called Macassar; the bark decoction is a folk remedy for rheumatism and fever, and the oil is used as a calming scent and for scalp and skin." },
};
Object.assign(G.INFO, {
  rosas: { ceb: 'Rosas', sci: 'Rosa × hybrida', color: '#c4112f', fact: "A favourite of home gardens, and the flower of the Flores de Mayo and the Santacruzan processions in May, when girls bring roses and other flowers to the Virgin Mary." },
  canna: { ceb: 'Canna', sci: 'Canna indica', color: '#d42a1a', fact: "Called balunsaying or kolintasan in Bisaya (tikas in Tagalog). In Cebu, young leaves soaked in cold water are drunk to cool the body, and pounded leaves wrapped in cloth are rubbed on the skin for pasma, a folk illness blamed on sudden cold after heat. The leaf decoction is also drunk for cough." },
  heliconia: { ceb: 'Heliconia', sci: 'Heliconia', color: '#e0261a', fact: "The red-and-yellow “claws” are boat-shaped bracts; the true flowers are small and hide inside them. A garden ornamental in the tropics, grown for its flowers and for cutting; I found no Visayan medicinal use recorded for it." },
  kamia: { ceb: 'Kamia', sci: 'Hedychium coronarium', color: '#ffffff', fact: "The white ginger lily, with butterfly-shaped white flowers that smell strongest in the evening; also called katkatan in Bisaya. Folk uses: a decoction of the stem as a gargle for tonsillitis, the rhizome for worms and fever, and the flowers for wreaths and bridal bouquets." },
  orkidyas: { ceb: 'Orkidyas', sci: 'Phalaenopsis', color: '#ee6aa8', fact: "The Philippines has many orchids that grow on trees, among them the waling-waling of Mindanao. These moth orchids cling to the trunks and need no soil, only humid air and a tree to hold on to." },
  liryo: { ceb: 'Liryo sa Tubig', sci: 'water lily & lotus', color: '#f070a8', fact: "Water lilies float round pads on still ponds and open their flowers in the morning sun. Calm water draws frogs and dragonflies." },
});
G.INFO_OTHER = {
  puso: { ceb: 'Puso', sci: 'hanging rice', color: '#8ec253', fact: 'Rice boiled inside a woven pouch of coconut leaf. A Cebuano fiesta table is unthinkable without it, and it is eaten with lechon, inasal and grilled fish.' },
  candle: { ceb: 'Kandila', sci: 'candle', color: '#ffd27a', fact: 'Lighting a candle at a roadside cross is an everyday act of devotion in Cebu. Click each one to light or snuff it.' },
  shrine: { ceb: 'Krus', sci: 'the roadside cross', color: '#caa56a', fact: 'Small crosses and shrines stand at crossroads and gates across the Visayas. This one is draped with sampaguita garlands. Cebu\'s Magellan\'s Cross dates to 1521.' },
  bangka: { ceb: 'Bangka', sci: 'outrigger boat', color: '#c0905c', fact: 'The outrigger canoe that has carried fishermen and families between the islands for centuries. The two bamboo floats keep it steady in the swell.' },
  hen: { ceb: 'Manok', sci: 'free-range chicken', color: '#d8a24a', fact: 'Free-range hens pecking around the yard are part of almost every Visayan homestead.' },
  alibangbang: { ceb: 'Alibangbang', sci: 'butterfly', color: '#ffd24a', fact: 'The Cebuano word for butterfly. Santan and kalachuchi are among their favourite stops.' },
};

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
G.TIERS = [
  { name: 'Low',    d0: 0,  d1: 15, cull: 42, grass: 34, shadow: false, bloom: false, grain: false, scale: 1.5 },
  { name: 'Medium', d0: 8,  d1: 24, cull: 62, grass: 48, shadow: true,  bloom: true,  grain: false, scale: 1.25 },
  { name: 'High',   d0: 14, d1: 38, cull: 88, grass: 72, shadow: true,  bloom: true,  grain: false, scale: 1 },
];
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
    while (n < N) { const a = r() * 6.283, rr = Math.sqrt(r()) * maxR, x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (blocked(x, z, pc) || x < G.shoreX(z) + 3) continue; const s = Rr(scMin, scMax, r);
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
  spots.forEach(([x, z], i) => { const srcs = palmSrc[i % 4], y = hFn(x, z), yaw = rand() * 6.28, sc = R(.85, 1.15), inst = srcs.map((src, l) => { const m = src.createInstance('palmI' + i + 'L' + l); m.position.set(x, y - .05, z); m.rotation.y = yaw; m.scaling.setAll(sc); m.isPickable = false; return m; }); addTree(x, z, inst.map(m => [m]), [26, 62, 170], true); Object.assign(trees[trees.length - 1], { pidx: i % 4, yaw, sc }); G.obstacles.push({ x, z, r: .5 }); });
  const banSrc = [1, 2, 3].map(s => buildLODs(() => { const m = geo.bananaPlant(s * 17).build('banana' + s, G.mats.banana); m.setEnabled(false); m.isPickable = false; return m; })); done();
  [[28, 1], [29, 6.5], [27.5, 11], [25, 16], [30, -3], [-33, 14], [-36, 18], [-34, -17], [-37, -12], [23, -12], [20, 24], [16, -2]].forEach(([x, z], i) => { const srcs = banSrc[i % 3], y = hFn(x, z), yaw = rand() * 6.28, sc = R(.85, 1.2), inst = srcs.map((src, l) => { const m = src.createInstance('banI' + i + 'L' + l); m.position.set(x, y - .05, z); m.rotation.y = yaw; m.scaling.setAll(sc); m.isPickable = false; return m; }); addTree(x, z, inst.map(m => [m]), [20, 48, 120], true); G.obstacles.push({ x, z, r: .4 }); });
  G.trees = trees;
})();
G.updateTrees = () => { const c = G.camera.position; for (const tr of G.trees) { const d = Math.hypot(tr.x - c.x, tr.z - c.z), lv = d < tr.t[0] ? 0 : d < tr.t[1] ? 1 : d < tr.t[2] ? 2 : 3; if (lv !== tr.cur) { tr.levels.forEach((ms, i) => ms.forEach(m => m.setEnabled(i === lv))); tr.cur = lv; } } };
G.swayTrees = () => { };                                  // palms, bananas and trees bend in the wind shader now

/* ---------- fireflies (the animals live in fauna.js) ---------- */
G.butterflies = []; G.hens = [];
(function fireflies() {
  const tex = new B.DynamicTexture('flyTex', { width: 64, height: 64 }, scene, true), g = tex.getContext(), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,248,180,1)'); gr.addColorStop(.25, 'rgba(255,225,110,.55)'); gr.addColorStop(1, 'rgba(255,200,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); tex.update(); tex.hasAlpha = true;
  const ps = new B.ParticleSystem('alitaptap', 1300, scene); ps.particleTexture = tex; ps.emitter = new V3(-4, 1.6, 2); ps.minEmitBox = new V3(-46, -.6, -36); ps.maxEmitBox = new V3(46, 3.4, 36);
  ps.direction1 = new V3(-.4, -.1, -.4); ps.direction2 = new V3(.4, .35, .4); ps.minEmitPower = .1; ps.maxEmitPower = .45; ps.minLifeTime = 5; ps.maxLifeTime = 11; ps.emitRate = 0; ps.minSize = .05; ps.maxSize = .14; ps.blendMode = B.ParticleSystem.BLENDMODE_ADD;
  ps.addColorGradient(0, new B.Color4(1, .9, .4, 0)); ps.addColorGradient(.28, new B.Color4(1, .95, .5, .9)); ps.addColorGradient(.72, new B.Color4(1, .92, .45, .8)); ps.addColorGradient(1, new B.Color4(1, .85, .4, 0));
  ps.start(); G.fireflies = ps; G.onTime.push(S => { ps.emitRate = 6 + 230 * Math.pow(S.night, 1.2); });
})();
// drifting blossom petals from the ilang-ilang and a shower for celebrations
G.petalBurst = (pos, n = 120) => {
  const tex = G.petalTex || (G.petalTex = (() => { const t = new B.DynamicTexture('petalTex', { width: 64, height: 64 }, scene, true), g = t.getContext(); g.translate(32, 32); g.rotate(-.6); const gr = g.createRadialGradient(0, 0, 2, 0, 0, 26); gr.addColorStop(0, '#fff3ec'); gr.addColorStop(1, '#f06a9a'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 25, 13, 0, 0, 6.283); g.fill(); t.update(); t.hasAlpha = true; return t; })());
  const ps = new B.ParticleSystem('burst', n, scene); ps.particleTexture = tex; ps.emitter = pos.clone(); ps.minEmitBox = new V3(-.3, 0, -.3); ps.maxEmitBox = new V3(.3, .3, .3); ps.direction1 = new V3(-2.5, 4, -2.5); ps.direction2 = new V3(2.5, 6, 2.5); ps.minEmitPower = 1; ps.maxEmitPower = 3; ps.gravity = new V3(.4, -2.2, 0); ps.minLifeTime = 3; ps.maxLifeTime = 6; ps.manualEmitCount = n; ps.minSize = .1; ps.maxSize = .26; ps.minAngularSpeed = -4; ps.maxAngularSpeed = 4; ps.targetStopDuration = 7; ps.disposeOnStop = true; ps.color1 = new B.Color4(1, .85, .9, 1); ps.color2 = new B.Color4(1, .45, .6, 1); ps.colorDead = new B.Color4(1, .7, .8, 0); ps.start();
};
(function drift() {
  const t = G.petalBurst; G.petalTex = null; t(new V3(T.x, hFn(T.x, T.z) + 9, T.z), 1); const tex = G.petalTex;
  const ps = new B.ParticleSystem('drift', 200, scene); ps.particleTexture = tex; ps.emitter = new V3(T.x, hFn(T.x, T.z) + 7.5, T.z); ps.minEmitBox = new V3(-3.5, -1, -3.5); ps.maxEmitBox = new V3(3.5, 1, 3.5);
  ps.direction1 = new V3(-.3, -1, -.3); ps.direction2 = new V3(.5, -.6, .5); ps.minEmitPower = .2; ps.maxEmitPower = .6; ps.gravity = new V3(.3, -.28, .1); ps.minLifeTime = 10; ps.maxLifeTime = 18; ps.emitRate = 7; ps.minSize = .07; ps.maxSize = .15; ps.minAngularSpeed = -2; ps.maxAngularSpeed = 2;
  ps.color1 = new B.Color4(1, .96, .6, 1); ps.color2 = new B.Color4(.9, .9, .3, 1); ps.colorDead = new B.Color4(1, .95, .6, 0); ps.preWarmCycles = 120; ps.preWarmStepOffset = 5; ps.start(); G.driftPS = ps;
})();
})();
