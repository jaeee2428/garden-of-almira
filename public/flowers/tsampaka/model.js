/* =====================================================================
   flowers/tsampaka/model.js - the 3D model of Tsampaka (Magnolia champaca)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K, shrub } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
/* ---------- tsampaka ---------- */
function tsampakaFlower(mb, M, r, age) {                               // many narrow tepals, pale yellow -> orange-yellow, half open
  const cols = [rgb('#f7e7a0'), mixA(rgb('#f6d878'), rgb('#f19a2c'), age), mixA(rgb('#f9e08a'), rgb('#ee8a22'), age)], n = 12, a0 = r() * 6.28;
  for (let i = 0; i < n; i++) { const ring = i % 3, a = a0 + i / n * 6.283 + ring * .4; petal(mb, .045 - ring * .006, .012, pm(dirOn(.35 + ring * .18, a), AX, ORG, 0).multiply(M), cols, { cup: .3, curl: -.12 * ring, pw: .7, sh: .7, nu: 5, nv: 3, throat: .2 }); }
  mb.tube([new V3(0, 0, 0), new V3(0, 0, .026)], [.006, .003], 5, () => rgb('#c8a050'), M);                                                     // gynoecium
}
function tsampaka(seed) {                                            // a small tree ~3.2 m: one trunk, spreading branches, long glossy drooping leaves; single flowers and slender buds in the leaf axils
  const r = rng(seed);
  return [shrub({ stems: 1, H: 3.1, lean: .04, up: .02, wig: .1, r0: .07, base: 0, bark: ['#7a6a58', '#5e5040'], orders: 3, side: [10, 5], sub: .55, ang: .95,
    leaf: { L: .21, W: .066, c0: rgb('#24521f'), c1: rgb('#4c8a34'), o: { base: .55, sharp: .7, nu: 7, nv: 2, fold: .2, curl: -.16 }, phyllo: 'alt', nodes: 16, from: .2, pitch: .95, droop: .4, pet: .025 },
    axilP: .14, axilFrom: .35, axil: (mb, d, p, r) => { const dir = d.scale(.6).add(new V3(0, .8, 0)).normalize();
      if (r() < .3) mb.ellipsoid(p.x + dir.x * .02, p.y + dir.y * .02, p.z + dir.z * .02, .006, .02, .006, 5, 4, () => rgb('#c8c060'));       // slender bud
      else tsampakaFlower(mb, pm(dir, UP, p.add(dir.scale(.01)), r() * 6, 1.25), r, r()); } }, r)];
}

Object.assign(G.geo, { tsampaka });
})();
