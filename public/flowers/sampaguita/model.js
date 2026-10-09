/* =====================================================================
   flowers/sampaguita/model.js - the 3D model of Sampaguita (Jasminum sambac)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K, shrub } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
function sampaguitaFlower(mb, M, r) {                              // Jasminum sambac - a little double white flower
  const cols = [rgb('#e3efc4'), rgb('#fffdf2'), rgb('#ffffff')];
  for (let ring = 0; ring < 2; ring++) { const n = ring ? 6 : 5, sp = ring ? 1.25 : 1.0, L = ring ? .016 : .014, a0 = ring ? .5 : 0; for (let i = 0; i < n; i++) petal(mb, L, .0125, pm(dirOn(sp, a0 + i / n * 6.283), AX, ORG).multiply(M), cols, { cup: .35, curl: .1, nu: 4, nv: 4, pw: .5, sh: .5, throat: .2, veins: .3 }); }
  mb.tube([new V3(0, 0, -.012), new V3(0, 0, 0)], [.0022, .0028], 5, () => rgb('#eaf2cf'), M);
  for (let i = 0; i < 7; i++) leaf(mb, .014, .0018, pm(dirOn(.7 + (i % 2) * .3, i / 7 * 6.28), AX, new V3(0, 0, -.012)).multiply(M), rgb('#4b7a3a'), rgb('#4b7a3a'), { nu: 2, nv: 1, fold: 0, curl: 0, rib: rgb('#4b7a3a') });
}
function sampaguitaBud(mb, M) { mb.ellipsoid(0, 0, .014, .0042, .0042, .0145, 6, 5, (u, v) => mixA(rgb('#f6f4dd'), rgb('#ffffff'), v), M); mb.tube([new V3(0, 0, -.005), new V3(0, 0, .004)], .0028, 5, () => rgb('#5b8a43'), M); }
function sampaguita(seed) {                                          // a dense, rounded bush ~0.8 m: opposite glossy oval leaves, flowers in little cymes of 1-3 at the twig ends
  const r = rng(seed);
  return [shrub({ stems: 8, H: .78, lean: .8, up: .045, droop: .04, r0: .009, bark: ['#6a5a3a', '#6f8a3a'], orders: 3, side: [4, 3], sub: .5, ang: .75,
    leaf: { L: .062, W: .04, c0: rgb('#22562a'), c1: rgb('#4d8e3c'), o: { base: .62, sharp: .62, nu: 5, nv: 2, fold: .3, curl: .05 }, phyllo: 'opp', nodes: 12, pitch: 1.1, droop: .12, pet: .006 },
    tipP: .8, tip: (mb, p, d, r, ord) => { if (ord < 1) return; const n = 1 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) { const dir = d.scale(.55).add(sideDir(d, i * 2.1 + r()).scale(i ? .7 : .2)).add(new V3(0, .35, 0)).normalize(), q = p.add(dir.scale(.014));
        mb.tube([p, q], [.0018, .0014], 3, () => rgb('#5b8a43'));
        if (i === 0 || r() < .55) sampaguitaFlower(mb, pm(dir, UP, q, r() * 6, 1.05), r); else sampaguitaBud(mb, pm(dir, UP, q, 0, 1.05)); } } }, r)];
}

Object.assign(G.geo, { sampaguitaFlower, sampaguitaBud, sampaguita });
})();
