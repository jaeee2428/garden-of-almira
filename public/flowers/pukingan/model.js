/* =====================================================================
   flowers/pukingan/model.js - the 3D model of Pukingan (Clitoria ternatea)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
/* ---------- pukingan ---------- */
function pukinganFlower(mb, M, r) {                                     // one big rounded standard petal: deep blue, pale yellow-white centre
  petal(mb, .036, .042, pm(new V3(0, .25, 1).normalize(), UP, ORG, 0).multiply(M), [rgb('#f4e49a'), rgb('#3b4fd0'), rgb('#1a2590')], { cup: .45, curl: -.15, pw: .45, sh: .4, nu: 7, nv: 7, throat: .2, notch: .12 });   // mostly deep blue, a small pale-yellow centre
  for (const sd of [-1, 1]) petal(mb, .018, .01, pm(new V3(sd * .3, -.2, 1).normalize(), UP, new V3(0, -.004, .004), 0).multiply(M), [rgb('#e8ecff'), rgb('#b8c4ff'), rgb('#3a4ac0')], { cup: .5, nu: 3, nv: 3 });   // wings
  mb.ellipsoid(0, -.006, .012, .005, .004, .012, 5, 4, () => rgb('#f4f0e0'), M);                                                                                 // keel
  mb.tube([new V3(0, 0, -.016), new V3(0, 0, 0)], [.004, .005], 4, () => rgb('#5a8a3a'), M);                                                                    // green calyx
}
function pukingan(seed) {
  const r = rng(seed), mb = new MB(), H = 1.55, top = new V3(0, H, 0), legs = [0, 2.09, 4.19].map(a => new V3(Math.cos(a) * .32, -.05, Math.sin(a) * .32));
  legs.forEach(b => mb.tube([b, V3.Lerp(b, top, .5), top.add(new V3(0, .08, 0))], [.017, .012], 6, (t, a) => shade(mixA(rgb('#c4b055'), rgb('#9a8a3c'), t), (t * 9 % 1) < .06 ? .7 : 1)));   // the bamboo tripod
  mb.tube([top.add(new V3(-.03, -.02, 0)), top.add(new V3(.03, .01, .02))], .012, 5, () => rgb('#b89a60'));                                                     // the lashing
  legs.forEach((b, li) => {                                                                                                         // a vine twines up each pole (anti-clockwise, as Clitoria does)
    const pts = [], turns = 3.2 + r(), ph = r() * 6.28;
    for (let k = 0; k <= 28; k++) { const t = k / 28, p = V3.Lerp(b, top, t * .96), side = new V3(-(top.z - b.z), 0, top.x - b.x).normalize(), up = top.subtract(b).normalize(), out = V3.Cross(up, side).normalize(), a = ph + t * turns * 6.283, rr = .024;
      pts.push(p.add(side.scale(Math.cos(a) * rr)).add(out.scale(Math.sin(a) * rr))); }
    mb.tube(pts, [.004, .002], 4, () => rgb('#4f8a36'));
    const nl = Math.max(5, Math.round(15 * K()));
    for (let i = 0; i < nl; i++) { const t = .12 + .85 * i / nl, p = ptAt(pts, t), d = tanAt(pts, t), dir = sideDir(d, i * 2.3 + li).scale(.9).add(d.scale(.3)).normalize();
      const stalk = p.add(dir.scale(.06)); mb.tube([p, stalk], .0018, 3, () => rgb('#5a9a3e'));
      for (let q = 0; q < 5; q++) { const qd = q === 4 ? dir : dir.add(sideDir(dir, q < 2 ? 1.57 : -1.57).scale(.9)).normalize(), base = q === 4 ? stalk : V3.Lerp(p, stalk, .45 + .3 * (q % 2)); leaf(mb, .045, .026, pm(qd, UP, base, 0), rgb('#3f7a32'), rgb('#68a848'), { base: .5, sharp: .5, nu: 4, nv: 2, fold: .15, curl: .04 }); } }   // 5 leaflets
    const nf = Math.max(3, Math.round(9 * K()));
    for (let i = 0; i < nf; i++) { const t = .3 + .62 * (i + r() * .5) / nf, p = ptAt(pts, t), d = tanAt(pts, t), out = sideDir(d, i * 2.9 + li * 1.3 + 1).normalize(); pukinganFlower(mb, pm(out, UP, p.add(out.scale(.025)), 0, 1.2), r); }
    for (let i = 0; i < Math.max(1, Math.round(3 * K())); i++) { const t = .2 + .6 * r(), p = ptAt(pts, t), out = sideDir(tanAt(pts, t), i * 2.2 + li).normalize(), q = p.add(out.scale(.02)), e = q.add(new V3(out.x * .02, -.09, out.z * .02));   // flat hanging seed pods
      mb.tube([q, V3.Lerp(q, e, .5).add(out.scale(.008)), e], t => .0045 * (1 - .5 * t * t), 4, () => rgb('#6f9a42')); }
  });
  return [mb];
}

Object.assign(G.geo, { pukingan });
})();
