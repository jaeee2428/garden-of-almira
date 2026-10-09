/* =====================================================================
   flowers/orkidyas/model.js - the 3D model of Orkidyas (Phalaenopsis)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
/* ---------- orkidyas: moth orchid, grown on trunks ---------- */
function orchid(seed) {
  const r = rng(seed), mb = new MB();
  for (let i = 0; i < 3; i++) leaf(mb, .22, .08, basis(new V3(Math.sin(i * 2.1) * .8, .35, Math.cos(i * 2.1) * .8), UP, new V3(0, 0, 0), 0), rgb('#2d6a30'), rgb('#4a9040'), { nu: 6, nv: 4, fold: .35, curl: -.15, base: .7, sharp: .5 });
  const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(new V3(t * .05, .08 + t * .38 - t * t * .06, t * t * .3)); } mb.tube(pts, [.004, .002], 4, () => rgb('#7a8a50'));
  const cols = r() < .5 ? [rgb('#d8a0c8'), rgb('#ffffff'), rgb('#fff0f8')] : [rgb('#c0207a'), rgb('#ee6aa8'), rgb('#ffb0d0')];
  for (let f = 0; f < 7; f++) { const t = .3 + f * .1, p = ptAt(pts, t), d = tanAt(pts, t), dir = d.scale(.25).add(new V3(f % 2 ? .8 : -.8, .2, 0)).normalize(), M = basis(dir, UP, p, 0, 1.1);
    for (let q = 0; q < 2; q++) petal(mb, .042, .05, pm(dirOn(1.1, q * 3.14 + 1.57), AX, ORG).multiply(M), cols, { cup: .15, curl: .05, pw: .5, sh: .4, nu: 6, nv: 6, throat: .2, veins: .6 });
    petal(mb, .042, .028, pm(dirOn(.8, 1.57), AX, ORG).multiply(M), cols, { cup: .15, nu: 5, nv: 4, throat: .2 }); for (let q = 0; q < 2; q++) petal(mb, .04, .02, pm(dirOn(.9, q * 3.14 + 3.7), AX, ORG).multiply(M), cols, { cup: .1, nu: 4, nv: 3, throat: .2 });
    petal(mb, .022, .018, pm(dirOn(.35, 4.7), AX, ORG).multiply(M), [rgb('#f0c030'), rgb('#c0207a'), rgb('#c0207a')], { cup: .5, nu: 4, nv: 3, throat: .3 }); }
  return [mb];
}

Object.assign(G.geo, { orchid });
})();
