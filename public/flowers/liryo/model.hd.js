/* =====================================================================
   flowers/liryo/model.js - the 3D model of Liryo sa Tubig (water lily & lotus)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
/* ---------- liryo: lotus flower and lily pad for the pond ---------- */
function lilyPad(seed) {
  const r = rng(seed), mb = new MB(), R = 1, gap = .22, rot = r() * 6.283;
  mb.grid(22, 4, (u, v) => { const a = rot + gap / 2 + u * (6.283 - gap), rr = v * R; return [Math.cos(a) * rr, .015 * Math.pow(v, 4) + .004 * Math.sin(a * 7) * v, Math.sin(a) * rr]; }, (u, v) => shade(mixA(rgb('#2f7a34'), rgb('#6ab84a'), v * .6), .92 + .12 * Math.abs(Math.sin(u * 60))), null, () => .2);
  return [mb];
}
function lotus(seed) {
  const r = rng(seed), mb = new MB(), cols = [rgb('#c0407a'), rgb('#f070a8'), rgb('#ffd6e8')];
  mb.tube([ORG, new V3(0, .2, 0), new V3(0, .42, 0)], [.014, .01], 6, () => rgb('#5a8a3a'));
  [[8, .16, .07, 1.2, 0], [9, .2, .085, .95, .03], [10, .22, .09, .65, .06]].forEach(([n, L, W, sp, z0], ri) => { for (let i = 0; i < n; i++) petal(mb, L, W, pm(dirOn(sp, i / n * 6.283 + ri * .3), AX, new V3(0, 0, z0)).multiply(basis(UP, new V3(1, 0, 0), new V3(0, .42, 0))), cols, { cup: .6, curl: .05, pw: .6, sh: .5, nu: 8, nv: 7, throat: .1, veins: 1 }); });
  mb.ellipsoid(0, .5, 0, .045, .02, .045, 10, 5, () => rgb('#9acb4a'), null);
  for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; mb.tube([new V3(Math.cos(a) * .015, .5, Math.sin(a) * .015), new V3(Math.cos(a) * .06, .53, Math.sin(a) * .06)], [.002, .004], 3, () => rgb('#ffd23a')); }
  return [mb];
}

Object.assign(G.geo, { lilyPad, lotus });
})();
