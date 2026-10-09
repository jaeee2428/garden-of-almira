/* =====================================================================
   flowers/adelfa/model.js - the 3D model of Adelfa (Nerium oleander)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K, shrub } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
/* ---------- adelfa ---------- */
const ADELFA = { pink: ['#c23a72', '#f07aa6', '#ffc2d8'], white: ['#e8d9c8', '#fbf4ee', '#ffffff'] };
function adelfaFlower(mb, M, cols, r) {                                 // 5 petals overlapping like a pinwheel, a fringed corona in the throat
  const c = cols.map(rgb), a0 = r() * 6.28;
  for (let i = 0; i < 5; i++) { const a = a0 + i / 5 * 6.283; petal(mb, .03, .026, pm(dirOn(1.25, a), AX, ORG, .5).multiply(M), c, { cup: .25, curl: -.1, tw: .55, pw: .6, sh: .5, nu: 6, nv: 5, throat: .3 }); }
  for (let i = 0; i < 5; i++) { const a = a0 + (i + .5) / 5 * 6.283, d = dirOn(.6, a); petal(mb, .011, .006, pm(d, AX, ORG, 0).multiply(M), [c[0], c[0], shade(c[1], .9)], { cup: .2, pw: .7, nu: 3, nv: 3 }); }   // fringed corona
  mb.tube([new V3(0, 0, -.022), new V3(0, 0, 0)], [.006, .008], 6, () => shade(c[1], .85), M);                                                                   // corolla tube
}
function adelfa(variant, seed) {                                     // a many-stemmed upright shrub ~1.8 m: narrow leathery leaves in whorls of three; cymes of flowers and buds at the branch tips
  const r = rng(seed), cols = ADELFA[variant];
  return [shrub({ stems: 10, H: 1.75, lean: .38, up: .1, r0: .013, base: .14, bark: ['#5f6a3e', '#6f8a4a'], orders: 2, side: [3], sub: .45, ang: .5,
    leaf: { L: .14, W: .022, c0: rgb('#2c5a2c'), c1: rgb('#4f7f3c'), o: { base: .6, sharp: .9, nu: 6, nv: 2, fold: .35, curl: .04 }, phyllo: 'whorl3', nodes: 9, from: .3, pitch: .62, droop: .05, pet: .004 },
    tipP: .85, tip: (mb, tip, d, r) => { const nf = Math.max(4, Math.round(9 * K()));
      for (let f = 0; f < nf; f++) { const a = f * 2.4 + r(), off = new V3(Math.cos(a) * Rr(.015, .065, r), Rr(-.01, .04, r), Math.sin(a) * Rr(.015, .065, r)), dir = new V3(off.x * 6, 1, off.z * 6).normalize(), p = tip.add(off);
        mb.tube([tip, p], .0022, 3, () => rgb('#6f8a4a'));
        if (f < nf - 3) adelfaFlower(mb, pm(dir, UP, p, r() * 6, 1.05), cols, r); else mb.ellipsoid(p.x, p.y + .01, p.z, .005, .014, .005, 5, 4, () => rgb(cols[1])); } } }, r)];
}

Object.assign(G.geo, { adelfa });
})();
