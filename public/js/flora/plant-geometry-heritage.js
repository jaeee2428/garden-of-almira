/* =====================================================================
   flora/plant-geometry-heritage.js - four more flowers of the Cebuano yard, modelled from botanical descriptions
   (StuartXchange): adelfa, pukingan, tsampaka and rosal. Same toolkit and detail levels as plant-geometry.js.
     adelfa   Nerium oleander      shrub ~1.5-2 m; narrow leaves in whorls of 3; clusters of 5-petalled, pinwheel-twisted
                                   pink or white flowers at the branch tips, a fringed crown in the throat
     pukingan Clitoria ternatea    twining vine (here on a tied bamboo tripod); leaves of 5 leaflets; single flowers with
                                   one large deep-blue standard petal around a pale yellow-white centre
     tsampaka Magnolia champaca    small tree; long glossy leaves; single fragrant flowers in the leaf axils, many narrow
                                   tepals, pale yellow turning orange-yellow, slender pointed buds
     rosal    Gardenia jasminoides shrub ~1-1.5 m; glossy opposite leaves; double white flowers (spiral of waxy petals)
                                   that turn creamy yellow as they age
   ===================================================================== */
(() => {
const { V3, MB, rgb, mixA, shade, rng } = G, geo = G.geo;
const { leaf, petal, pm, branch, addLeaves, dirOn, AX, ptAt, tanAt, wood, sideDir } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
const K = () => G.LODV === 0 ? 1 : G.LODV === 1 ? .78 : .58;

/* ---------- adelfa ---------- */
const ADELFA = { pink: ['#c23a72', '#f07aa6', '#ffc2d8'], white: ['#e8d9c8', '#fbf4ee', '#ffffff'] };
function adelfaFlower(mb, M, cols, r) {                                 // 5 petals overlapping like a pinwheel, a fringed corona in the throat
  const c = cols.map(rgb), a0 = r() * 6.28;
  for (let i = 0; i < 5; i++) { const a = a0 + i / 5 * 6.283; petal(mb, .03, .026, pm(dirOn(1.25, a), AX, ORG, .5).multiply(M), c, { cup: .25, curl: -.1, tw: .55, pw: .6, sh: .5, nu: 6, nv: 5, throat: .3 }); }
  for (let i = 0; i < 5; i++) { const a = a0 + (i + .5) / 5 * 6.283, d = dirOn(.6, a); petal(mb, .011, .006, pm(d, AX, ORG, 0).multiply(M), [c[0], c[0], shade(c[1], .9)], { cup: .2, pw: .7, nu: 3, nv: 3 }); }   // fringed corona
  mb.tube([new V3(0, 0, -.022), new V3(0, 0, 0)], [.006, .008], 6, () => shade(c[1], .85), M);                                                                   // corolla tube
}
function adelfa(variant, seed) {
  const r = rng(seed), mb = new MB(), stem = wood('#5f6a3e', '#6f8a4a'), NB = Math.max(5, Math.round(8 * K())), cols = ADELFA[variant];
  for (let k = 0; k < NB; k++) {
    const yaw = k / NB * 6.283 + Rr(-.3, .3, r), pts = branch(ORG, yaw, .12 + Rr(0, .12, r), Rr(1.25, 1.7, r), .15, 6);
    mb.tube(pts, [.016, .006], 5, stem);
    const nodes = Math.max(3, Math.round(7 * K()));
    for (let n = 0; n < nodes; n++) { const t = .3 + .66 * n / nodes, p = ptAt(pts, t), d = tanAt(pts, t);                // leaves in whorls of three
      for (let w = 0; w < 3; w++) { const dir = d.scale(.75).add(sideDir(d, w / 3 * 6.283 + n * .7).scale(.65)).normalize(); leaf(mb, .15 * Rr(.85, 1.15, r), .022, pm(dir, UP, p, 0), rgb('#2c5a2c'), rgb('#4f7f3c'), { base: .6, sharp: .9, nu: 6, nv: 2, fold: .35, curl: .05 }); } }
    const tip = pts[pts.length - 1], nf = Math.max(3, Math.round(7 * K()));                                                  // a cyme of flowers and buds at the tip
    for (let f = 0; f < nf; f++) { const a = f * 2.4 + r(), off = new V3(Math.cos(a) * Rr(.02, .07, r), Rr(-.02, .04, r), Math.sin(a) * Rr(.02, .07, r)), dir = new V3(off.x * 6, 1, off.z * 6).normalize(), p = tip.add(off);
      mb.tube([tip, p], .0025, 3, () => rgb('#6f8a4a'));
      if (f < nf - 2) adelfaFlower(mb, pm(dir, UP, p, r() * 6, 1.25), cols, r); else mb.ellipsoid(p.x, p.y + .012, p.z, .006, .016, .006, 5, 4, () => rgb(cols[1])); }
  }
  return [mb];
}

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
    const nl = Math.max(4, Math.round(9 * K()));
    for (let i = 0; i < nl; i++) { const t = .12 + .85 * i / nl, p = ptAt(pts, t), d = tanAt(pts, t), dir = sideDir(d, i * 2.3 + li).scale(.9).add(d.scale(.3)).normalize();
      const stalk = p.add(dir.scale(.06)); mb.tube([p, stalk], .0018, 3, () => rgb('#5a9a3e'));
      for (let q = 0; q < 5; q++) { const qd = q === 4 ? dir : dir.add(sideDir(dir, q < 2 ? 1.57 : -1.57).scale(.9)).normalize(), base = q === 4 ? stalk : V3.Lerp(p, stalk, .45 + .3 * (q % 2)); leaf(mb, .045, .026, pm(qd, UP, base, 0), rgb('#3f7a32'), rgb('#68a848'), { base: .5, sharp: .5, nu: 4, nv: 2, fold: .15, curl: .04 }); } }   // 5 leaflets
    const nf = Math.max(2, Math.round(5 * K()));
    for (let i = 0; i < nf; i++) { const t = .3 + .62 * (i + r() * .5) / nf, p = ptAt(pts, t), d = tanAt(pts, t), out = sideDir(d, i * 2.9 + li * 1.3 + 1).normalize(); pukinganFlower(mb, pm(out, UP, p.add(out.scale(.03)), 0, 1.7), r); }
  });
  return [mb];
}

/* ---------- tsampaka ---------- */
function tsampakaFlower(mb, M, r, age) {                               // many narrow tepals, pale yellow -> orange-yellow, half open
  const cols = [rgb('#f7e7a0'), mixA(rgb('#f6d878'), rgb('#f19a2c'), age), mixA(rgb('#f9e08a'), rgb('#ee8a22'), age)], n = 12, a0 = r() * 6.28;
  for (let i = 0; i < n; i++) { const ring = i % 3, a = a0 + i / n * 6.283 + ring * .4; petal(mb, .045 - ring * .006, .012, pm(dirOn(.35 + ring * .18, a), AX, ORG, 0).multiply(M), cols, { cup: .3, curl: -.12 * ring, pw: .7, sh: .7, nu: 5, nv: 3, throat: .2 }); }
  mb.tube([new V3(0, 0, 0), new V3(0, 0, .026)], [.006, .003], 5, () => rgb('#c8a050'), M);                                                     // gynoecium
}
function tsampaka(seed) {
  const r = rng(seed), mb = new MB(), bark = wood('#7a6a58', '#5e5040');
  const trunk = [new V3(0, -.1, 0), new V3(.05, 1.0, .02), new V3(0, 1.7, .05)]; mb.tube(trunk, [.075, .045], 7, bark);
  const NB = Math.max(5, Math.round(10 * K()));
  for (let k = 0; k < NB; k++) {
    const yaw = k / NB * 6.283 + Rr(-.3, .3, r), o = ptAt(trunk, .5 + .5 * k / NB), pts = branch(o, yaw, .45 + Rr(0, .3, r), Rr(1.0, 1.5, r), .2, 6);
    mb.tube(pts, [.035, .01], 6, bark);
    addLeaves(mb, pts, 34, .23, .075, rgb('#24521f'), rgb('#4c8a34'), { base: .55, sharp: .7, nu: 6, nv: 2, fold: .2, curl: -.18 }, r, 1.6);   // a dense crown of long glossy leaves
    const nf = Math.max(2, Math.round(5 * K()));
    for (let i = 0; i < nf; i++) { const t = .35 + .6 * (i + r() * .6) / nf, p = ptAt(pts, t), d = tanAt(pts, t), dir = d.scale(.7).add(new V3(0, .8, 0)).normalize();
      if (i % 3 === 2) mb.ellipsoid(p.x + dir.x * .02, p.y + dir.y * .02, p.z + dir.z * .02, .007, .022, .007, 5, 4, () => rgb('#c8c060'));       // slender bud
      else tsampakaFlower(mb, pm(dir, UP, p, r() * 6, 1.9), r, r()); }
  }
  return [mb];
}

/* ---------- rosal ---------- */
function rosalFlower(mb, M, r, age) {                                  // a double gardenia: a spiral of waxy petals, white ageing to cream-yellow
  const body = mixA(rgb('#fffdf4'), rgb('#f2dc98'), age), cols = [shade(body, .92), body, mixA(body, rgb('#ffffff'), .3 * (1 - age))], N = Math.max(10, Math.round(18 * K())), a0 = r() * 6.28;
  for (let i = 0; i < N; i++) { const t = i / N, a = a0 + i * 2.399, spread = 1.35 - t * 1.0, L = .036 - t * .016; petal(mb, L, L * .85, pm(dirOn(spread, a), AX, new V3(0, 0, t * .012), .2).multiply(M), cols, { cup: .55 + t * .4, curl: -.18 + t * .25, pw: .5, sh: .45, nu: 5, nv: 5, throat: .15, veins: .4 }); }
  for (let i = 0; i < 5; i++) leaf(mb, .02, .006, pm(dirOn(1.7, i / 5 * 6.283), AX, ORG, 0).multiply(M), rgb('#4f8a3a'), rgb('#6aa048'), { nu: 3, nv: 2 });   // green calyx lobes
}
function rosal(seed) {
  const r = rng(seed), mb = new MB(), stem = wood('#5a5040', '#4a6a34'), NB = Math.max(5, Math.round(9 * K()));
  for (let k = 0; k < NB; k++) {
    const yaw = k / NB * 6.283 + Rr(-.3, .3, r), pts = branch(ORG, yaw, .3 + Rr(0, .2, r), Rr(.75, 1.05, r), .25, 5);
    mb.tube(pts, [.014, .005], 5, stem);
    const pairs = Math.max(3, Math.round(7 * K()));
    for (let n = 0; n < pairs; n++) { const t = .2 + .78 * n / pairs, p = ptAt(pts, t), d = tanAt(pts, t);                    // glossy leaves in opposite pairs
      for (const sd of [0, Math.PI]) { const dir = d.scale(.5).add(sideDir(d, sd + n * 1.57).scale(.85)).normalize(); leaf(mb, .1 * Rr(.85, 1.15, r), .045, pm(dir, UP, p, 0), rgb('#173f1c'), rgb('#2f6e2c'), { base: .6, sharp: .65, nu: 5, nv: 2, fold: .3, curl: .1 }); } }
    if (r() < .8) { const tip = pts[pts.length - 1], dir = tanAt(pts, .98).add(new V3(0, .6, 0)).normalize(); rosalFlower(mb, pm(dir, UP, tip, r() * 6, 1.4), r, r() < .3 ? Rr(.5, 1, r) : Rr(0, .2, r)); }
    else { const tip = pts[pts.length - 1]; mb.ellipsoid(tip.x, tip.y + .015, tip.z, .009, .02, .009, 6, 4, () => rgb('#e6edd0')); }   // a furled bud
  }
  return [mb];
}

Object.assign(G.geo, { adelfa, pukingan, tsampaka, rosal });
})();
