/* =====================================================================
   flora/plant-geometry-extra.js - more flowers for the buwakan:
   rosas (roses), canna lily, heliconia, kamia (white ginger lily),
   orkidyas (moth orchid), liryo (lotus & lily pads)
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
const K = () => G.LODV === 0 ? 1 : G.LODV === 1 ? .78 : .58;

/* ---------- rosas ---------- */
const ROSE = { red: { base: '#5a0614', body: '#c4112f', edge: '#f04a63' }, pink: { base: '#b53a64', body: '#ff8fb3', edge: '#ffd3e2' }, white: { base: '#e6dcb4', body: '#fff7e6', edge: '#ffffff' }, yellow: { base: '#d98a10', body: '#ffd23a', edge: '#fff0a0' } };
function roseFlower(mb, M, col, r) {
  const c = [rgb(col.base), rgb(col.body), rgb(col.edge)];
  [[5, .03, .026, 1.5, 0], [5, .045, .036, 1.25, .01], [6, .06, .046, 1.0, .018], [7, .075, .056, .78, .026], [8, .09, .066, .58, .032]].forEach(([n, L, W, sp, z0], ri) => {
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + ri * .55 + Rr(-.12, .12, r); petal(mb, L, W, pm(dirOn(sp, a), AX, new V3(0, 0, z0)).multiply(M), c, { cup: .75, curl: -.1 + ri * .03, ruf: .1 + ri * .04, pw: .55, sh: .5, nu: 6, nv: 7, throat: .12 }); }
  });
  for (let i = 0; i < 5; i++) leaf(mb, .05, .016, pm(dirOn(.5, i / 5 * 6.283 + .3), AX, new V3(0, 0, -.01)).multiply(M), rgb('#2d6a2f'), rgb('#4e8d38'), { nu: 3, nv: 2, fold: .25, curl: .12 });
}
function compoundLeaf(mb, M, r) {                        // rose leaves are made of 5 serrated leaflets on one stalk
  mb.tube([new V3(0, 0, 0), new V3(0, .01, .06), new V3(0, 0, .12)], [.0025, .0015], 4, () => rgb('#3f7a35'), M);
  for (let i = 0; i < 5; i++) { const z = i === 4 ? .12 : .025 + Math.floor(i / 2) * .045 + .02, sd = i === 4 ? 0 : (i % 2 ? 1 : -1); leaf(mb, .055, .034, basis(new V3(sd * .75, .15, i === 4 ? 1 : .55), UP, new V3(0, 0, z), 0).multiply(M), rgb('#22561f'), rgb('#4b8c3a'), { nu: 5, nv: 2, fold: .3, curl: .1, base: .6, sharp: .65, ser: .09 }); }
}
function rosas(variant, seed) {
  const r = rng(seed), mb = new MB(), NB = Math.max(4, Math.round(8 * K())), br = wood('#4a5a2a', '#3f6a2a');
  for (let k = 0; k < NB; k++) {
    const yaw = k / NB * 6.283 + Rr(-.3, .3, r), pts = branch(ORG, yaw, .25 + Rr(0, .15, r), Rr(.65, 1.0, r), .3, 6);
    mb.tube(pts, [.012, .005], 5, br);
    for (let t = .2; t < .98; t += .09 / K()) { const p = ptAt(pts, t), d = tanAt(pts, t), dir = d.scale(.4).add(sideDir(d, t * 17 + k).scale(.9)).normalize(); compoundLeaf(mb, basis(dir, UP, p, Rr(-.3, .3, r)), r); }
    for (let t = .15; t < .9; t += .13) { const p = ptAt(pts, t), d = tanAt(pts, t), s = sideDir(d, t * 31 + k); mb.tube([p, p.add(s.scale(.012)).add(new V3(0, -.008, 0))], [.003, .0006], 3, () => rgb('#6a2a1a')); }          // thorns
    if (k < NB - 1 || r() < .5) roseFlower(mb, basis(new V3(Math.sin(yaw) * .3, 1, Math.cos(yaw) * .3), UP, pts[pts.length - 1].add(new V3(0, .02, 0)), Rr(0, 6, r), 1.5), ROSE[variant], r);
  }
  return [mb];
}

/* ---------- canna lily ---------- */
const CANNA = { red: ['#d42a1a', '#ff7a1a'], yellow: ['#ffbf1a', '#fff08a'] };
function canna(variant, seed) {
  const r = rng(seed), mb = new MB(), nl = Math.max(5, Math.round(9 * K())), col = CANNA[variant];
  for (let i = 0; i < nl; i++) { const a = i / nl * 6.283 + Rr(-.3, .3, r), lean = Rr(.15, .5, r), h = Rr(.35, .75, r), pts = [ORG, new V3(Math.sin(a) * lean * .15, h * .5, Math.cos(a) * lean * .15), new V3(Math.sin(a) * lean * .35, h, Math.cos(a) * lean * .35)];
    mb.tube(pts, [.016, .01], 5, () => rgb('#5a7a2a')); const top = pts[2], dir = new V3(Math.sin(a) * (.5 + lean), .8 - lean * .5, Math.cos(a) * (.5 + lean)).normalize();
    leaf(mb, Rr(.45, .62, r), .2, basis(dir, UP, top, Rr(-.2, .2, r)), rgb(i % 3 === 0 ? '#5a3a2a' : '#2d6a2a'), rgb(i % 3 === 0 ? '#8a4a30' : '#5a9a38'), { nu: 8, nv: 4, fold: .1, curl: -.14, base: .75, sharp: .5, rib: rgb('#c8d890') }); }
  for (let s = 0; s < 3; s++) { const a = Rr(0, 6.283, r), pts = [new V3(0, .2, 0), new V3(Math.sin(a) * .05, .7, Math.cos(a) * .05), new V3(Math.sin(a) * .1, Rr(1.05, 1.35, r), Math.cos(a) * .1)];
    mb.tube(pts, [.012, .006], 5, () => rgb('#5a7a2a'));
    for (let f = 0; f < 6; f++) { const t = .55 + f * .09, p = ptAt(pts, Math.min(.98, t)), d = tanAt(pts, Math.min(.98, t)), dir = d.scale(.35).add(sideDir(d, f * 2.4 + s).scale(.9)).add(new V3(0, .25, 0)).normalize(), M = basis(dir, UP, p, 0, 1.3), cols = [rgb(col[1]), rgb(col[0]), rgb(col[0])];
      for (let q = 0; q < 3; q++) petal(mb, .07, .018, pm(dirOn(.7, q * 2.094), AX, ORG).multiply(M), cols, { cup: .3, curl: .1, nu: 4, nv: 3, throat: .2 });
      for (let q = 0; q < 3; q++) petal(mb, .06, .036, pm(dirOn(.45, q * 2.094 + 1), AX, ORG).multiply(M), cols, { cup: .6, curl: .05, ruf: .3, nu: 5, nv: 4, throat: .2 }); } }
  return [mb];
}

/* ---------- heliconia: boat-shaped bracts ---------- */
function heliconia(seed) {
  const r = rng(seed), mb = new MB(), nl = Math.max(3, Math.round(5 * K()));
  for (let i = 0; i < nl; i++) { const a = i / nl * 6.283 + Rr(-.2, .2, r), pts = [ORG, new V3(Math.sin(a) * .04, .5, Math.cos(a) * .04), new V3(Math.sin(a) * .09, Rr(.85, 1.2, r), Math.cos(a) * .09)]; mb.tube(pts, [.02, .012], 6, () => rgb('#5a8a2a'));
    leaf(mb, Rr(.75, 1.05, r), .24, basis(new V3(Math.sin(a) * .8, .8, Math.cos(a) * .8), UP, pts[2], 0), rgb('#2a6a2a'), rgb('#62aa3a'), { nu: 10, nv: 4, fold: .15, curl: -.2, base: .8, sharp: .55, rib: rgb('#b8d070') }); }
  const stalk = []; for (let k = 0; k <= 9; k++) { const t = k / 9; stalk.push(new V3(Math.sin(t * 1.8) * .12, .3 + 1.35 * Math.sin(t * 1.2) , t * t * .3)); }
  mb.tube(stalk, [.012, .01], 5, () => rgb('#7a8a2a'));
  const nb = Math.max(5, Math.round(9 * K()));
  for (let b = 0; b < nb; b++) { const t = .12 + b / nb * .85, p = ptAt(stalk, t), d = tanAt(stalk, t), side = b % 2 ? 1 : -1, dir = d.scale(.55).add(sideDir(d, side * 1.5 + 1).scale(.8)).add(new V3(0, .15, 0)).normalize();
    petal(mb, .2 - b * .008, .075, basis(dir, d, p, 0, 1), [rgb('#8a1010'), rgb('#e0261a'), rgb('#ffcf2a')], { cup: 1.1, curl: .12, pw: .6, sh: .45, nu: 8, nv: 7, throat: .15, veins: .6 }); }
  return [mb];
}

/* ---------- kamia: butterfly ginger ---------- */
function kamia(seed) {
  const r = rng(seed), mb = new MB(), ns = Math.max(3, Math.round(5 * K()));
  for (let s = 0; s < ns; s++) { const a = s / ns * 6.283 + Rr(-.3, .3, r), h = Rr(.95, 1.35, r), pts = [ORG, new V3(Math.sin(a) * .06, h * .5, Math.cos(a) * .06), new V3(Math.sin(a) * .12, h, Math.cos(a) * .12)];
    mb.tube(pts, [.012, .007], 5, () => rgb('#5a8a30'));
    for (let l = 0; l < 7; l++) { const t = .15 + l * .11, p = ptAt(pts, t), d = tanAt(pts, t), dir = d.scale(.25).add(sideDir(d, l * 2.1 + s).scale(1)).normalize(); leaf(mb, .3, .075, basis(dir, UP, p, 0), rgb('#2d6a30'), rgb('#5aa83e'), { nu: 8, nv: 4, fold: .2, curl: -.12, base: .8, sharp: .5, rib: rgb('#b8d880') }); }
    const tip = pts[2];
    for (let f = 0; f < 7; f++) { const q = f / 7 * 6.283, dir = new V3(Math.sin(q) * .55, .75, Math.cos(q) * .55).normalize(), M = basis(dir, UP, tip.add(new V3(Math.sin(q) * .02, f * .006, Math.cos(q) * .02)), 0, 1.15), cols = [rgb('#e8f0c0'), rgb('#ffffff'), rgb('#f6fff0')];
      for (let p2 = 0; p2 < 3; p2++) petal(mb, .09, .012, pm(dirOn(.9, p2 * 2.094 + .5), AX, ORG).multiply(M), cols, { cup: .1, curl: .2, nu: 5, nv: 3, throat: .1, veins: 0 });
      for (let p2 = 0; p2 < 2; p2++) petal(mb, .065, .05, pm(dirOn(.6, p2 * 3.14 + 1.5), AX, ORG).multiply(M), cols, { cup: .5, curl: .1, ruf: .2, pw: .6, sh: .5, nu: 6, nv: 5, throat: .1 });
      petal(mb, .075, .055, pm(dirOn(.3, 0), AX, ORG).multiply(M), [rgb('#f0d040'), rgb('#ffffff'), rgb('#ffffff')], { cup: .5, curl: -.1, ruf: .4, nu: 6, nv: 5, throat: .3 }); }
    for (let c = 0; c < 6; c++) petal(mb, .045, .028, pm(dirOn(.8, c * 1.05), AX, new V3(0, -.01, 0)).multiply(basis(UP, UP, tip)), [rgb('#5a8a30'), rgb('#7aaa40'), rgb('#9aca50')], { cup: .8, nu: 3, nv: 3, throat: .1, veins: 0 }); }
  return [mb];
}

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

Object.assign(G.geo, { rosas, canna, heliconia, kamia, orchid, lilyPad, lotus });
})();
