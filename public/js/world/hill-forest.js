/* =====================================================================
   world/hill-forest.js - the forest on the hills behind the garden
   ~2300 broadleaf trees and tall emergents (lauan-like) clothe the slopes, so the hills
   read as real Cebu forest instead of smooth green shapes. Cheap: 4 low-poly tree types x 2 detail levels, thin-instanced,
   split into 12 angular sectors (frustum-culled; full detail only for sectors near you); they sway gently (GPU wind).
   Never placed in the garden (r < 56), on the beach side, on steep faces, or on anything else's footprint.
   ===================================================================== */
(() => {
const { B, V3, M4, MB, rgb, mixA, shade, rng, scene, hFn } = G;
const Rr = (a, b, r) => a + (b - a) * r();

/* ---------- three low-poly tree types (built at medium detail: they are always far away) ---------- */
let LITE = false;                                                       // far detail level: fewer, coarser leaf masses
function blob(mb, cx, cy, cz, rad, sq, cols, seed) {                 // a lumpy, irregular leaf mass (no smooth spheres: those read as cartoon)
  const nz = (a, b) => G.vnoise(a * 2.1 + seed * 3.7, b * 2.1 + seed);
  mb.grid(LITE ? 6 : 9, LITE ? 4 : 6, (u, v) => { const th = u * 6.283, ph = v * Math.PI, k = 1 + .32 * (nz(Math.cos(th) * 1.4 + 2, ph * 1.3) - .5) + .12 * (nz(th * 1.7, ph * 2.3 + 5) - .5);
    return [cx + Math.cos(th) * Math.sin(ph) * rad * k, cy + Math.cos(ph) * rad * sq * k, cz + Math.sin(th) * Math.sin(ph) * rad * k]; },
    (u, v) => { const t = .5 + .5 * Math.sin(u * 23 + v * 9 + seed); return shade(mixA(cols[0], cols[1], t * (1 - v * .6)), .55 + .55 * (1 - v)); });   // dark, shaded undersides
}
function crown(mb, cx, cy, cz, rx, ry, cols, r) {                         // a crown = several leaf masses clustered round the top of the trunk
  const n = LITE ? 3 : 4 + Math.floor(r() * 2);
  for (let k = 0; k < n; k++) { const a = r() * 6.283, d = k ? Rr(.3, .7, r) * rx : 0, s = k ? Rr(.45, .7, r) : .85;
    blob(mb, cx + Math.cos(a) * d, cy + (k ? Rr(-.45, .35, r) * ry : 0), cz + Math.sin(a) * d, rx * s, ry / rx, cols, Math.floor(r() * 97)); }
}
function treeType(kind, seed, lite) {
  LITE = lite; const r = rng(seed), mb = new MB(), bark = rgb('#5a4a38');
  G.setLOD(1);
  if (kind === 'broad') {                                                // mango / molave-like broadleaf
    mb.tube([new V3(0, -.3, 0), new V3(.1, 1.6, 0), new V3(.05, 2.6, .1)], [.22, .12], 6, () => bark);
    crown(mb, 0, 3.4, 0, 1.9, 1.6, [rgb('#1d3c17'), rgb('#36622a')], r);
  } else if (kind === 'tall') {                                          // emergent dipterocarp (lauan): tall bare trunk, wide flat crown
    mb.tube([new V3(0, -.3, 0), new V3(-.08, 3.5, .05), new V3(0, 6.2, 0)], [.3, .14], 6, () => shade(bark, 1.1));
    crown(mb, 0, 6.6, 0, 2.3, 1.75, [rgb('#22441c'), rgb('#3e6c2e')], r); crown(mb, .3, 5.3, -.2, 1.6, 1.3, [rgb('#1d3c17'), rgb('#36622a')], r);
  } else if (kind === 'umbrella') {                                     // narra-like: a short forked trunk under a wide, flat, lighter crown
    mb.tube([new V3(0, -.3, 0), new V3(.12, 1.8, .05), new V3(.5, 3.1, .2)], [.24, .1], 6, () => shade(bark, .95)); mb.tube([new V3(.08, 1.6, .03), new V3(-.55, 2.9, -.25)], [.13, .07], 5, () => bark);
    crown(mb, .2, 3.6, 0, 2.6, 1.0, [rgb('#2f5a22'), rgb('#5b8a36')], r);
  } else {                                                               // a young bushy tree / thicket
    mb.tube([new V3(0, -.2, 0), new V3(0, 1.2, 0)], [.12, .08], 5, () => bark);
    crown(mb, 0, 1.6, 0, 1.35, 1.25, [rgb('#234a1d'), rgb('#41733a')], r);
  }
  G.setLOD(0);
  return mb;
}
const TYPES = [['broad', 501], ['broad', 502], ['tall', 503], ['bush', 504], ['umbrella', 505]];
const SECTORS = 12;

(function plant() {
  const r = rng(1611), bufs = TYPES.map(() => Array.from({ length: SECTORS }, () => [])), cols = TYPES.map(() => Array.from({ length: SECTORS }, () => []));
  const tmp = new M4(), q = new B.Quaternion(); let n = 0, tries = 0;
  const N = Math.round(2300 * G.Q);
  while (n < N && tries++ < N * 30) {
    const a = r() * 6.283, rad = 56 + Math.sqrt(r()) * 72, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (x < -26 || Math.abs(x) > 133 || Math.abs(z) > 133) continue;                                  // inland only, on the ground mesh
    const y = hFn(x, z); if (y < 1.2) continue;
    const e = 1.2, slope = Math.hypot(hFn(x + e, z) - hFn(x - e, z), hFn(x, z + e) - hFn(x, z - e)) / (2 * e);
    if (slope > 1.0) continue;                                                                         // bare on the steepest faces
    const dens = G.vnoise(x * .05 + 3, z * .05 - 7) * .7 + G.vnoise(x * .17, z * .17) * .3;          // clumps and clearings
    if (dens < .4 + .25 * G.smooth(.55, .9, G.vnoise(x * .045 + 9, z * .045)) || r() > .35 + dens) continue;   // grassy (cogon) tops stay open
    if (rad < 92 && !G.isFree(x, z, .6)) continue;                                                     // never on another asset
    const ti = r() < .1 ? 2 : r() < .12 ? 4 : r() < .3 ? 3 : r() < .5 ? 1 : 0, s = Rr(.75, 1.3, r);
    B.Quaternion.RotationYawPitchRollToRef(r() * 6.283, Rr(-.04, .04, r), Rr(-.04, .04, r), q);
    M4.ComposeToRef(new V3(s, s * Rr(.9, 1.15, r), s), q, new V3(x, y - .05, z), tmp);
    const sec = Math.floor(((Math.atan2(z, x) + Math.PI) / 6.2832) * SECTORS) % SECTORS;
    bufs[ti][sec].push(...tmp.toArray()); n++;
    // every tree its own shade (free: an instance colour): yellow-green, deep blue-green, or a few bronze-flushing crowns
    const tv = G.vnoise(x * .08 + 40, z * .08) - .5, pick = r(), br = Rr(.82, 1.12, r);
    cols[ti][sec].push(...(pick < .06 ? [1.18 * br, .95 * br, .72 * br] : [(1 + tv * .5) * br, (1 + tv * .2) * br, (1 - tv * .45) * br]), 1);
    if (rad < 92) G.claim(x, z, .35 * s, true, 'hill tree');                                          // you bump into the trunks you can reach
  }
  // two detail levels per sector: full leaf masses near you, a light version far away (switched by distance)
  const sectors = Array.from({ length: SECTORS }, (_, si) => ({ near: [], far: [], cx: 0, cz: 0, k: 0 }));
  TYPES.forEach(([kind, seed], ti) => bufs[ti].forEach((arr, si) => { for (let o = 0; o < arr.length; o += 16) { sectors[si].cx += arr[o + 12]; sectors[si].cz += arr[o + 14]; sectors[si].k++; } }));
  sectors.forEach(S => { S.cx /= Math.max(1, S.k); S.cz /= Math.max(1, S.k); });
  [false, true].forEach(lite => TYPES.forEach(([kind, seed], ti) => {
    const src = treeType(kind, seed, lite).build('hillTree' + ti + (lite ? 'F' : 'N'), G.mats.tree), vd = B.VertexData.ExtractFromMesh(src); src.dispose();
    bufs[ti].forEach((arr, si) => { if (!arr.length) return; const m = new B.Mesh('hillForest' + ti + '_' + si + (lite ? 'F' : 'N'), scene); vd.applyToMesh(m); m.material = G.mats.tree; m.isPickable = false;
      m.thinInstanceSetBuffer('matrix', new Float32Array(arr), 16, true); m.thinInstanceSetBuffer('color', new Float32Array(cols[ti][si]), 4, true); m.thinInstanceRefreshBoundingInfo(true); m.freezeWorldMatrix(); m.setEnabled(lite);   // frustum-culled per sector
      sectors[si][lite ? 'far' : 'near'].push(m); });
  }));
  const NEAR = 70;
  G.systems.add('hillForestLOD', () => { const c = G.camera.position; for (const S of sectors) { const near = Math.hypot(S.cx - c.x, S.cz - c.z) < NEAR; S.near.forEach(m => m.setEnabled(near)); S.far.forEach(m => m.setEnabled(!near)); } }, { order: 13, every: 15 });
  G.hillTrees = n;
})();
})();
