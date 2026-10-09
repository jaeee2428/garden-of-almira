/* =====================================================================
   flowers/bogambilya/model.js - the 3D model of Bogambilya (Bougainvillea)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K, shrub } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
function bougainBract(mb, M, col, r) {                             // a bogambilya "flower" is 3 papery bracts around 3 tiny true flowers
  const cols = [rgb(col.base), rgb(col.body), rgb(col.edge)], a0 = r() * 6.28;
  for (let i = 0; i < 3; i++) petal(mb, .042, .036, pm(dirOn(.7, a0 + i * 2.094 + Rr(-.2, .2, r)), AX, ORG, Rr(-.2, .2, r)).multiply(M), cols, { cup: .4, curl: .08, ruf: .35, pw: .6, sh: .5, nu: 5, nv: 5, throat: .15, veins: 1.6 });
  for (let i = 0; i < 3; i++) mb.tube([new V3(Math.cos(i * 2.1) * .003, Math.sin(i * 2.1) * .003, 0), new V3(Math.cos(i * 2.1) * .005, Math.sin(i * 2.1) * .005, .03)], [.0022, .0034], 5, t => mixA(rgb('#f4ecd2'), rgb('#fffbea'), t), M);
}
const BOUGAIN = { magenta: { base: '#f08ab8', body: '#cf1569', edge: '#e24a8c' }, orange: { base: '#ffc07a', body: '#f08a24', edge: '#ffb24d' }, white: { base: '#fff3f6', body: '#fdf0f3', edge: '#ffd6e4' } };
function bougainvillea(variant, seed) {                             // a sprawling, arching thorny shrub ~1.5 m: alternate heart-shaped leaves; masses of papery bracts in threes at the ends of the twigs
  const r = rng(seed), col = BOUGAIN[variant];
  const bracts = (mb, p, d, r, n) => { for (let c = 0; c < n; c++) { const dir = d.scale(.45).add(sideDir(d, c * 2.4 + r()).scale(.8)).add(new V3(0, .15, 0)).normalize(); bougainBract(mb, pm(dir, UP, p.add(dir.scale(.02 + .015 * c)), 0, 1.1), col, r); } };
  return [shrub({ stems: 6, H: 1.45, lean: .85, up: .02, droop: .2, wig: .25, r0: .014, bark: ['#6a5a40', '#5a7a3a'], orders: 3, side: [5, 3], sub: .5, ang: .8,
    leaf: { L: .065, W: .05, c0: rgb('#2b6a30'), c1: rgb('#59a042'), o: { base: .42, sharp: .75, nu: 5, nv: 2, fold: .2, curl: -.05 }, phyllo: 'alt', nodes: 12, pitch: 1.0, droop: .25, pet: .012 },
    axilP: .35, axilFrom: .55, axil: (mb, d, p, r) => bracts(mb, p, d, r, 1 + Math.floor(r() * 2)),
    tipP: .9, tip: (mb, p, d, r, ord) => { if (ord) bracts(mb, p, d, r, Math.max(2, Math.round(5 * K()))); } }, r)];
}

Object.assign(G.geo, { bougainBract, BOUGAIN, bougainvillea });
})();
