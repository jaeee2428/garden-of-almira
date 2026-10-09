/* =====================================================================
   flowers/kamia/model.js - the 3D model of Kamia (Hedychium coronarium)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
/* ---------- kamia: butterfly ginger ---------- */
function kamia(seed) {                                               // a reed-like clump ~1.4 m: many leafy stems with lance leaves in two ranks; a green cone on top opening a few white butterfly flowers
  const r = rng(seed), mb = new MB(), ns = Math.max(6, Math.round(14 * K()));
  for (let s = 0; s < ns; s++) { const a = s / ns * 6.283 + Rr(-.4, .4, r), d0 = Rr(.02, .2, r), base = new V3(Math.sin(a) * d0, 0, Math.cos(a) * d0), h = Rr(.9, 1.45, r), lean = Rr(.04, .16, r);
    const pts = [0, .5, 1].map(t => base.add(new V3(Math.sin(a) * lean * t, h * t, Math.cos(a) * lean * t)));
    mb.tube(pts, [.011, .007], 5, () => rgb('#5a8a30'));
    const plane = a + Math.PI / 2 + Rr(-.4, .4, r), nl = Math.max(5, Math.round(11 * K()));                                       // leaves alternate in ONE plane (distichous), like a fan
    for (let l = 0; l < nl; l++) { const t = .15 + .78 * l / nl, p = ptAt(pts, t), sd = l % 2 ? 1 : -1, dir = new V3(Math.sin(plane) * sd, .55 - .25 * (1 - t), Math.cos(plane) * sd).normalize();
      leaf(mb, Rr(.36, .46, r) * (1.05 - .3 * t), .07, basis(dir, UP, p, 0), rgb('#2d6a30'), rgb('#5aa83e'), { nu: 9, nv: 4, fold: .2, curl: -.14, base: .8, sharp: .5, rib: rgb('#b8d880') }); }
    if (s % 3 === 2) continue;                                                                                                  // not every stem is flowering
    const tip = pts[2], nf = 2 + Math.floor(r() * 3);
    for (let c = 0; c < 6; c++) petal(mb, .045, .028, pm(dirOn(.8, c * 1.05), AX, new V3(0, -.01, 0)).multiply(basis(UP, UP, tip)), [rgb('#5a8a30'), rgb('#7aaa40'), rgb('#9aca50')], { cup: .8, nu: 3, nv: 3, throat: .1, veins: 0 });   // the green bract cone
    for (let f = 0; f < nf; f++) { const q = f / nf * 6.283 + r(), dir = new V3(Math.sin(q) * .55, .75, Math.cos(q) * .55).normalize(), M = basis(dir, UP, tip.add(new V3(Math.sin(q) * .02, .02 + f * .006, Math.cos(q) * .02)), 0, 1.0), cols = [rgb('#e8f0c0'), rgb('#ffffff'), rgb('#f6fff0')];
      for (let p2 = 0; p2 < 3; p2++) petal(mb, .08, .011, pm(dirOn(.9, p2 * 2.094 + .5), AX, ORG).multiply(M), cols, { cup: .1, curl: .2, nu: 5, nv: 3, throat: .1, veins: 0 });   // narrow petals
      for (let p2 = 0; p2 < 2; p2++) petal(mb, .06, .048, pm(dirOn(.6, p2 * 3.14 + 1.5), AX, ORG).multiply(M), cols, { cup: .5, curl: .1, ruf: .2, pw: .6, sh: .5, nu: 6, nv: 5, throat: .1 });   // the butterfly 'wings'
      petal(mb, .07, .055, pm(dirOn(.3, 0), AX, ORG).multiply(M), [rgb('#f0d040'), rgb('#ffffff'), rgb('#ffffff')], { cup: .5, curl: -.1, ruf: .4, nu: 6, nv: 5, throat: .3 }); }   // the lip, yellow at its heart
  }
  return [mb];
}

Object.assign(G.geo, { kamia });
})();
