/* =====================================================================
   flowers/canna/model.js - the 3D model of Canna (Canna indica)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
/* ---------- canna lily ---------- */
const CANNA = { red: ['#d42a1a', '#ff7a1a'], yellow: ['#ffbf1a', '#fff08a'] };
function canna(variant, seed) {                                      // a clump of 7-9 leafy stems ~1.2 m from a rhizome: big paddle leaves wrapped round the stem in two ranks, a spike of soft flag-like flowers on top
  const r = rng(seed), mb = new MB(), col = CANNA[variant], ns = Math.max(4, Math.round(8 * K())), bronze = r() < .35;
  const lc = bronze ? [rgb('#4a2a22'), rgb('#7a4a30')] : [rgb('#2d6a2a'), rgb('#5a9a38')];
  for (let s = 0; s < ns; s++) {
    const a = s / ns * 6.283 + Rr(-.4, .4, r), d0 = Rr(.02, .16, r), base = new V3(Math.sin(a) * d0, 0, Math.cos(a) * d0), h = Rr(.75, 1.3, r), lean = Rr(.03, .14, r);
    const pts = [0, .35, .7, 1].map(t => base.add(new V3(Math.sin(a) * lean * t * h, h * t, Math.cos(a) * lean * t * h)));
    mb.tube(pts, [.017, .009], 6, t => mixA(rgb('#4a6a2a'), lc[1], t * .4));
    const nl = Math.max(3, Math.round(6 * K())); let ph = r() * 6.28;
    for (let l = 0; l < nl; l++) { const t = .12 + .78 * l / nl, p = ptAt(pts, t), tg = tanAt(pts, t); ph += Math.PI + Rr(-.3, .3, r);           // two-ranked
      const out = sideDir(tg, ph), dir = tg.scale(.75 - .35 * (1 - t)).add(out.scale(.6 + .3 * (1 - t))).normalize(), L = Rr(.38, .55, r) * (1.1 - .35 * t);
      mb.tube([p, p.add(dir.scale(.05))], [.012, .008], 4, () => lc[0]);                                                          // the leaf sheath
      leaf(mb, L, L * .42, pm(dir, UP, p.add(dir.scale(.04)), Rr(-.3, .3, r)), lc[0], lc[1], { nu: 9, nv: 4, fold: .12, curl: -.1 - .15 * (1 - t), base: .7, sharp: .45, rib: rgb(bronze ? '#a07050' : '#c8d890') }); }
    if (s % 2 === 0 || r() < .3) {                                                                                               // a flower spike from the top
      const top = pts[3], sp = [top, top.add(new V3(0, .12, 0)), top.add(new V3(Math.sin(a) * .02, .26, Math.cos(a) * .02))];
      mb.tube(sp, [.007, .004], 5, () => rgb('#5a7a2a')); const cols = [rgb(col[1]), rgb(col[0]), rgb(col[0])];
      for (let f = 0; f < Math.max(3, Math.round(6 * K())); f++) { const t = .25 + f * .13, p = ptAt(sp, Math.min(.98, t)), d = tanAt(sp, Math.min(.98, t)), dir = d.scale(.35).add(sideDir(d, f * 2.4 + s).scale(.9)).add(new V3(0, .2, 0)).normalize(), M = basis(dir, UP, p, 0, 1.0);
        for (let q = 0; q < 3; q++) petal(mb, .07, .02, pm(dirOn(.6, q * 2.094), AX, ORG).multiply(M), cols, { cup: .3, curl: .12, nu: 5, nv: 3, throat: .2 });                     // narrow petals
        for (let q = 0; q < 3; q++) petal(mb, .065, .04, pm(dirOn(.4, q * 2.094 + 1), AX, ORG).multiply(M), cols, { cup: .6, curl: .06, ruf: .35, nu: 6, nv: 5, throat: .2 }); } }   // soft, ruffled staminodes
  }
  return [mb];
}

Object.assign(G.geo, { canna });
})();
