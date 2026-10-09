/* =====================================================================
   flowers/rosal/model.js - the 3D model of Rosal (Gardenia jasminoides)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K, shrub } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
/* ---------- rosal ---------- */
function rosalFlower(mb, M, r, age) {                                  // a double gardenia: a spiral of waxy petals, white ageing to cream-yellow
  const body = mixA(rgb('#fffdf4'), rgb('#f2dc98'), age), cols = [shade(body, .92), body, mixA(body, rgb('#ffffff'), .3 * (1 - age))], N = Math.max(10, Math.round(18 * K())), a0 = r() * 6.28;
  for (let i = 0; i < N; i++) { const t = i / N, a = a0 + i * 2.399, spread = 1.35 - t * 1.0, L = .036 - t * .016; petal(mb, L, L * .85, pm(dirOn(spread, a), AX, new V3(0, 0, t * .012), .2).multiply(M), cols, { cup: .55 + t * .4, curl: -.18 + t * .25, pw: .5, sh: .45, nu: 5, nv: 5, throat: .15, veins: .4 }); }
  for (let i = 0; i < 5; i++) leaf(mb, .02, .006, pm(dirOn(1.7, i / 5 * 6.283), AX, ORG, 0).multiply(M), rgb('#4f8a3a'), rgb('#6aa048'), { nu: 3, nv: 2 });   // green calyx lobes
}
function rosal(seed) {                                               // a rounded shrub ~1.1 m: glossy dark leaves in opposite pairs; single double flowers at the twig ends, some aged cream, some still furled buds
  const r = rng(seed);
  return [shrub({ stems: 8, H: 1.05, lean: .55, up: .07, r0: .012, bark: ['#5a5040', '#4a6a34'], orders: 3, side: [3, 2], sub: .5, ang: .7,
    leaf: { L: .095, W: .042, c0: rgb('#173f1c'), c1: rgb('#2f6e2c'), o: { base: .6, sharp: .65, nu: 6, nv: 2, fold: .3, curl: .08 }, phyllo: 'opp', nodes: 10, pitch: 1.0, droop: .12, pet: .006 },
    tipP: .6, tip: (mb, tip, d, r, ord) => { if (!ord) return; const dir = d.add(new V3(0, .7, 0)).normalize();
      if (r() < .7) rosalFlower(mb, pm(dir, UP, tip.add(dir.scale(.008)), r() * 6, 1.05), r, r() < .3 ? Rr(.5, 1, r) : Rr(0, .2, r));
      else { const q = tip.add(dir.scale(.018)); mb.ellipsoid(q.x, q.y, q.z, .007, .017, .007, 6, 4, () => rgb('#e6edd0')); } } }, r)];   // a furled bud
}

Object.assign(G.geo, { rosal });
})();
