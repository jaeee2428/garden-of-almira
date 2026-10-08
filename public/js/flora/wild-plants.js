/* =====================================================================
   flora/wild-plants.js - the wild, flower-like plants of a Visayan yard and beach.
   No cards, not in the bayong: just life all around the garden.
   lantana · touch-me-not (makahiya) · ageratum · wedelia · cosmos ·
   cogon & talahib grass · croton · ferns · beach morning glory · pandan
   Everything is instanced and split into culled chunks (cheap).
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng, scene, hFn, geo } = G;
const { leaf, petal, pm, sideDir, ptAt, tanAt, dirOn, AX } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r(), Q = G.Q;
const tmp = new B.Matrix(), vds = new Map();

/* ---------- materials: each kind of plant bends its own amount ---------- */
const M = { low: G.mats.low, cosmos: G.mats.cosmos, cogon: G.mats.cogon, tall: G.mats.tall, fern: G.mats.fern, pandan: G.mats.pandan, vine: G.mats.glory };   // stiffness per kind: config/settings.js

/* ---------- little helpers ---------- */
function arc(mb, o, yaw, len, rise, droop, W, nu, cfn, afn, prof) {                        // a curved ribbon: grass blade, fern frond, leaflet
  const sx = Math.sin(yaw), cx = Math.cos(yaw);
  mb.grid(nu, 1, (u, v) => { const s = v * 2 - 1, w = W * (prof ? prof(u) : 1 - u * .9); return [o.x + sx * len * u + cx * s * w * .5, o.y + rise * u - droop * u * u, o.z + cx * len * u - sx * s * w * .5]; }, cfn, null, afn || (u => .15 + .85 * u));
}
const teeth = (n, d) => u => (1 - Math.pow(u, 1.4)) * (1 - d + d * Math.abs(Math.sin(u * Math.PI * n)));
function puff(mb, p, r, col, n = 6) { mb.ellipsoid(p.x, p.y, p.z, r, r * .85, r, n, Math.max(3, n - 2), (u, v) => shade(col, .9 + .2 * v)); }
function flowerTiny(mb, M0, cols, n = 4, L = .012) { mb.tube([new V3(0, 0, -.02), new V3(0, 0, 0)], [.0015, .002], 3, () => cols[0], M0); for (let k = 0; k < n; k++) petal(mb, L, L * .75, pm(dirOn(1.25, k * 6.283 / n + .3), AX, ORG).multiply(M0), [cols[0], cols[1], cols[2]], { cup: .2, curl: .1, nu: 2, nv: 2, throat: .1, veins: 0 }); }

/* ---------- the plants ---------- */
const LANT = [[rgb('#ffd23a'), rgb('#ff8a2a'), rgb('#ff5a3a')], [rgb('#ff8fb8'), rgb('#ffd23a'), rgb('#ff6aa0')], [rgb('#ffb02a'), rgb('#ff5a2a'), rgb('#e02a2a')]];
function lantana(seed, pal) {
  const r = rng(seed), mb = new MB(), c = LANT[pal % 3], NS = 9;
  for (let k = 0; k < NS; k++) {
    const yaw = k / NS * 6.283 + Rr(-.3, .3, r), pts = geo.branch(ORG, yaw, .45 + Rr(0, .25, r), Rr(.55, .95, r), .5, 5);
    mb.tube(pts, [.009, .004], 4, () => rgb('#5a6a3a'));
    for (let l = 0; l < 13; l++) { const t = .15 + l / 13 * .85, p = ptAt(pts, t), d = tanAt(pts, t), dir = d.scale(.35).add(sideDir(d, l * 2.5 + k).scale(.95)).normalize(); leaf(mb, .075, .05, basis(dir, UP, p, Rr(-.3, .3, r)), rgb('#2a5a22'), rgb('#4a8a34'), { ser: .12, base: .6, sharp: .55, fold: .35, curl: .1 }); }
    if (k < NS - 1 || r() < .5) { const tip = pts[pts.length - 1], dir = new V3(Math.sin(yaw) * .25, 1, Math.cos(yaw) * .25).normalize(), Mh = basis(dir, UP, tip.add(new V3(0, .02, 0)), Rr(0, 6, r), 1.5);
      for (let f = 0; f < 13; f++) { const ph = Math.acos(1 - Rr(0, .9, r)), th = f * 2.4, d = new V3(Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)), t2 = ph / 1.2, col = mixA(mixA(c[0], c[1], clamp(t2 * 2, 0, 1)), c[2], clamp(t2 * 2 - 1, 0, 1)); flowerTiny(mb, basis(d, UP, d.scale(.03), f).multiply(Mh), [col, col, shade(col, 1.08)]); } }
  }
  return [mb];
}
function makahiya(seed) {                                                                    // touch-me-not: fern-like leaves and pink pom-poms
  const r = rng(seed), mb = new MB();
  for (let k = 0; k < 9; k++) {
    const yaw = k / 9 * 6.283 + Rr(-.3, .3, r), len = Rr(.2, .4, r), pts = [ORG, new V3(Math.sin(yaw) * len * .5, .05 + Rr(0, .05, r), Math.cos(yaw) * len * .5), new V3(Math.sin(yaw) * len, .08 + Rr(0, .1, r), Math.cos(yaw) * len)];
    mb.tube(pts, [.004, .002], 3, () => rgb('#7a6a3a'));
    for (let l = 0; l < 3; l++) { const p = ptAt(pts, .4 + l * .25); for (let q = 0; q < 4; q++) arc(mb, p, yaw + (q - 1.5) * .55, .085, .04, .035, .03, 7, u => mixA(rgb('#2a7a34'), rgb('#6ab04a'), u), null, teeth(8, .55)); }
    if (k % 3 === 0) { const e = pts[2], p = e.add(new V3(0, .05, 0)); mb.tube([e, p], .0015, 3, () => rgb('#7a8a3a')); puff(mb, p.add(new V3(0, .015, 0)), .02, rgb('#ff7ab8'), 7); for (let f = 0; f < 10; f++) { const a = f * .63, b = Math.sin(f * 1.7) * .6; mb.tube([p.add(new V3(0, .015, 0)), p.add(new V3(Math.cos(a) * .028, .015 + b * .02, Math.sin(a) * .028))], [.0012, .0003], 3, () => rgb('#ffb0dc')); } }
  }
  return [mb];
}
function ageratum(seed) {
  const r = rng(seed), mb = new MB();
  for (let k = 0; k < 8; k++) { const yaw = k / 8 * 6.283 + Rr(-.3, .3, r), h = Rr(.28, .5, r), pts = [ORG, new V3(Math.sin(yaw) * .04, h * .55, Math.cos(yaw) * .04), new V3(Math.sin(yaw) * .08, h, Math.cos(yaw) * .08)];
    mb.tube(pts, [.004, .002], 3, () => rgb('#5a7a3a'));
    for (let l = 0; l < 5; l++) { const t = .15 + l * .16, p = ptAt(pts, t), d = tanAt(pts, t), dir = d.scale(.3).add(sideDir(d, l * 2.4 + k).scale(1)).normalize(); leaf(mb, .045, .03, basis(dir, UP, p, 0), rgb('#2a6a2a'), rgb('#4a9a3a'), { ser: .15, base: .5, sharp: .5, fold: .3, curl: .05 }); }
    const tip = pts[2]; for (let f = 0; f < 5; f++) puff(mb, tip.add(new V3(Math.cos(f * 1.3) * .018, .012 + (f % 2) * .01, Math.sin(f * 1.3) * .018)), .015, rgb(f % 2 ? '#b6a8f0' : '#9ab0f4'), 6); }
  return [mb];
}
function wedelia(seed) {
  const r = rng(seed), mb = new MB();
  for (let k = 0; k < 7; k++) { const yaw = k / 7 * 6.283 + Rr(-.3, .3, r), len = Rr(.3, .5, r), pts = [ORG, new V3(Math.sin(yaw) * len * .5, .04, Math.cos(yaw) * len * .5), new V3(Math.sin(yaw) * len, .06, Math.cos(yaw) * len)];
    mb.tube(pts, [.004, .002], 3, () => rgb('#5a7a34'));
    for (let l = 0; l < 6; l++) { const t = .15 + l * .14, p = ptAt(pts, t), d = tanAt(pts, t), s = sideDir(d, 1.57 + (l % 2) * 3.14); leaf(mb, .05, .028, basis(s.add(new V3(0, .25, 0)), UP, p, 0), rgb('#2a6a2a'), rgb('#5a9a3a'), { ser: .15, base: .5, sharp: .55, fold: .2, curl: .05 }); }
    if (k % 2 === 0) { const p = pts[2].add(new V3(0, .035, 0)); for (let q = 0; q < 8; q++) petal(mb, .02, .008, pm(dirOn(1.38, q * .785), AX, p).multiply(basis(UP, new V3(1, 0, 0), ORG)), [rgb('#ffcc22'), rgb('#ffd83a'), rgb('#ffe05a')], { cup: .1, nu: 2, nv: 2, throat: .1, veins: 0 }); puff(mb, p.add(new V3(0, .004, 0)), .008, rgb('#e8a010'), 5); } }
  return [mb];
}
const COS = [['#ff4f9c', '#ffa0cc'], ['#ff8a1f', '#ffc060'], ['#ffffff', '#ffd6ec']];
function cosmos(seed, pal) {
  const r = rng(seed), mb = new MB(), c = COS[pal % 3];
  for (let k = 0; k < 4; k++) { const yaw = k / 4 * 6.283 + Rr(-.5, .5, r), h = Rr(.75, 1.15, r), pts = [ORG, new V3(Math.sin(yaw) * .05, h * .5, Math.cos(yaw) * .05), new V3(Math.sin(yaw) * .12, h, Math.cos(yaw) * .12)];
    mb.tube(pts, [.005, .0025], 4, () => rgb('#5a8a3a'));
    for (let l = 0; l < 6; l++) { const t = .12 + l * .12, p = ptAt(pts, t); for (let q = 0; q < 3; q++) arc(mb, p, yaw + q * 2.09 + l, .1, .02, .05, .006, 4, () => rgb('#4a9a3a'), () => .3 + .7 * 0); }
    const tip = pts[2], dir = new V3(Math.sin(yaw) * .3, 1, Math.cos(yaw) * .3).normalize(), Mh = basis(dir, UP, tip, Rr(0, 6, r), 1.1);
    for (let q = 0; q < 8; q++) petal(mb, .05, .028, pm(dirOn(1.35, q * .785), AX, ORG).multiply(Mh), [rgb(c[0]), rgb(c[0]), rgb(c[1])], { cup: .2, curl: .05, notch: .3, nu: 4, nv: 3, throat: .1, veins: .5 });
    puff(mb, tip.add(new V3(0, .006, 0)), .011, rgb('#f0b010'), 6); }
  return [mb];
}
function cogon(seed, tall) {                                                                 // cogon / talahib: the silvery grass of Philippine hillsides
  const r = rng(seed), mb = new MB(), S = tall ? 2.1 : 1, NB = tall ? 24 : 26;
  for (let b = 0; b < NB; b++) arc(mb, new V3(Rr(-.06, .06, r), 0, Rr(-.06, .06, r)), r() * 6.283, Rr(.6, 1.1, r) * S, Rr(.45, .85, r) * S, Rr(.2, .55, r) * S, tall ? .035 : .018, 6, u => mixA(rgb('#3a6a2a'), rgb('#9ac24a'), u), u => 0);
  for (let p = 0; p < (tall ? 4 : 5); p++) { const yaw = r() * 6.283, h = Rr(1.15, 1.55, r) * S, sw = Rr(.05, .14, r) * S, pts = [ORG, new V3(Math.sin(yaw) * sw * .4, h * .55, Math.cos(yaw) * sw * .4), new V3(Math.sin(yaw) * sw, h, Math.cos(yaw) * sw)];
    mb.tube(pts, [.005 * S, .003 * S], 3, () => rgb('#b0a070'), null, false); const top = pts[2];
    mb.ellipsoid(top.x, top.y + .09 * S, top.z, .028 * S, .13 * S, .028 * S, 7, 6, (u, v) => mixA(rgb('#f4eee0'), rgb(tall ? '#e8c8c8' : '#ffffff'), v), null);
    for (let f = 0; f < 9; f++) { const a = f * .7; mb.tube([top.add(new V3(0, .03 * S + f * .012 * S, 0)), top.add(new V3(Math.cos(a) * .045 * S, .06 * S + f * .014 * S, Math.sin(a) * .045 * S))], [.002 * S, .0004], 3, () => rgb('#fffaf0')); } }
  return [mb];
}
const CRO = [['#e8c030', '#c0301a'], ['#e07a1a', '#a02a1a'], ['#f0e060', '#3a8a2a']];
function croton(seed, pal) {
  const r = rng(seed), mb = new MB(), c = CRO[pal % 3];
  for (let k = 0; k < 7; k++) { const yaw = k / 7 * 6.283 + Rr(-.3, .3, r), pts = geo.branch(ORG, yaw, .22, Rr(.7, 1.05, r), .3, 5); mb.tube(pts, [.012, .005], 4, () => rgb('#6a5a3a'));
    for (let l = 0; l < 11; l++) { const t = .15 + l / 11 * .85, p = ptAt(pts, t), d = tanAt(pts, t), dir = d.scale(.3).add(sideDir(d, l * 2.4 + k).scale(.95)).normalize(), M0 = basis(dir, UP, p, Rr(-.3, .3, r)), L0 = .17 * Rr(.8, 1.2, r);
      mb.grid(6, 4, (u, v) => { const s = v * 2 - 1, pr = Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, .7))), .7); return [s * .045 * pr, .3 * Math.abs(s) * pr * .06 + .1 * u * u * L0, u * L0]; }, (u, v) => { const s = Math.abs(v * 2 - 1), n = G.vnoise(u * 5 + k + l, s * 4 + seed), mid = s < .1 ? rgb(c[1]) : mixA(mixA(rgb('#2a7a2a'), rgb(c[0]), clamp(n * 1.5 - .2, 0, 1)), rgb(c[1]), clamp((s - .4) * 1.2 * n, 0, .8)); return shade(mid, .9 + .15 * u); }, M0, (u) => .15 + .85 * u); } }
  return [mb];
}
function fern(seed) {
  const r = rng(seed), mb = new MB(), NF = 15;
  for (let f = 0; f < NF; f++) { const yaw = f / NF * 6.283 + Rr(-.2, .2, r), len = Rr(.5, .85, r), rise = Rr(.18, .5, r), drop = Rr(.35, .6, r);
    const pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push(new V3(Math.sin(yaw) * len * u, rise * u - drop * u * u, Math.cos(yaw) * len * u)); }
    mb.tube(pts, [.006, .0015], 3, () => rgb('#5a7a2a'));
    mb.grid(30, 2, (u, v) => { const s = v * 2 - 1, p = ptAt(pts, u), d = tanAt(pts, u), w = .075 * Math.pow(Math.sin(Math.PI * Math.pow(u, .6)), .7) * (.5 + .5 * Math.abs(Math.sin(u * 3.14159 * 16))); return [p.x + Math.cos(yaw) * s * w, p.y + Math.abs(s) * w * .22, p.z - Math.sin(yaw) * s * w]; }, (u, v) => shade(mixA(rgb('#2d7a2f'), rgb('#7cc255'), u * .8), .85 + .2 * Math.abs(v - .5)), null, u => .1 + .9 * u); }
  return [mb];
}
function glory(seed) {                                                                       // beach morning glory
  const r = rng(seed), mb = new MB(), pts = [ORG]; let yaw = r() * 6.283, p = ORG.clone();
  for (let i = 1; i <= 14; i++) { yaw += Rr(-.4, .4, r); p = p.add(new V3(Math.sin(yaw) * .11, .004 * i % .02, Math.cos(yaw) * .11)); pts.push(p.clone()); }
  mb.tube(pts, [.004, .003], 3, () => rgb('#6a7a3a'));
  pts.forEach((q, i) => { if (i % 1 === 0 && i) leaf(mb, .06, .06, basis(new V3(Math.sin(i * 2.1), .25, Math.cos(i * 2.1)), UP, q, 0), rgb('#2f7a34'), rgb('#6ab84a'), { base: .55, sharp: .45, fold: .1, curl: .05, nu: 4, nv: 2 }); });
  [3, 8, 12].forEach((i, n) => { const q = pts[i], a = i * 1.3; mb.grid(10, 3, (u, v) => { const an = u * 6.283, rr = .004 + .028 * Math.pow(v, 1.5); return [q.x + .02 * Math.cos(a) + Math.cos(an) * rr, q.y + .03 + v * .045, q.z + .02 * Math.sin(a) + Math.sin(an) * rr]; }, (u, v) => mixA(rgb('#fff0f6'), rgb(n % 2 ? '#c06ad8' : '#ee5aa8'), v)); });
  return [mb];
}
function pandan(seed) {
  const r = rng(seed), mb = new MB(), NL = 15;
  mb.tube([ORG, new V3(.02, .25, 0), new V3(0, .5, .02)], [.07, .045], 8, () => rgb('#8a7a5a'));
  for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; mb.tube([new V3(Math.cos(a) * .03, .45, Math.sin(a) * .03), new V3(Math.cos(a) * .13, .2, Math.sin(a) * .13), new V3(Math.cos(a) * .2, -.02, Math.sin(a) * .2)], [.016, .008], 5, () => rgb('#8a7050')); }
  for (let k = 0; k < NL; k++) { const yaw = k * 2.4 + Rr(-.2, .2, r), L = Rr(1.0, 1.5, r), el = Rr(.5, 1.2, r), dir = new V3(Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el)); leaf(mb, L, .1, basis(dir, UP, new V3(0, .5, 0), 0), rgb('#3a7a2a'), rgb('#8ac04a'), { nu: 10, nv: 4, fold: .55, curl: -.45, ser: .05, base: .9, sharp: .4, rib: rgb('#b8d070') }); }
  return [mb];
}


const PORT = [['#ff2a8a', '#ff7ab8'], ['#ffd22a', '#fff07a'], ['#ff7a1a', '#ffb870'], ['#ffffff', '#ffe0f0']];
function portulaca(seed, pal) {                                                        // moss rose: fleshy leaves, jewel-bright flowers
  const r = rng(seed), mb = new MB(), c = PORT[pal % 4];
  for (let k = 0; k < 9; k++) { const yaw = k / 9 * 6.283 + Rr(-.3, .3, r), len = Rr(.1, .22, r), pts = [ORG, new V3(Math.sin(yaw) * len * .5, .02, Math.cos(yaw) * len * .5), new V3(Math.sin(yaw) * len, .035, Math.cos(yaw) * len)]; mb.tube(pts, [.0035, .0025], 3, () => rgb('#b0506a'));
    for (let l = 0; l < 5; l++) { const p = ptAt(pts, .2 + l * .17), d = tanAt(pts, .2 + l * .17); leaf(mb, .03, .011, basis(sideDir(d, l * 2.2 + k).add(new V3(0, .5, 0)), UP, p, 0), rgb('#3a8a3a'), rgb('#7acb5a'), { nu: 3, nv: 2, fold: 0, curl: .05, base: .6, sharp: .5 }); }
    if (k % 2 === 0) { const e = pts[2].add(new V3(0, .02, 0)); for (let q = 0; q < 5; q++) petal(mb, .022, .02, pm(dirOn(1.2, q * 1.257), AX, ORG).multiply(basis(UP, new V3(1, 0, 0), e)), [rgb(c[1]), rgb(c[0]), rgb(c[0])], { cup: .3, curl: .1, notch: .25, nu: 3, nv: 3, throat: .2, veins: .3 }); puff(mb, e.add(new V3(0, .004, 0)), .005, rgb('#f6c020'), 4); } }
  return [mb];
}
function dayflower(seed) {
  const r = rng(seed), mb = new MB();
  for (let k = 0; k < 6; k++) { const yaw = k / 6 * 6.283 + Rr(-.3, .3, r), pts = [ORG, new V3(Math.sin(yaw) * .08, .12, Math.cos(yaw) * .08), new V3(Math.sin(yaw) * .17, .1 + Rr(0, .06, r), Math.cos(yaw) * .17)]; mb.tube(pts, [.0035, .0025], 3, () => rgb('#6aa04a'));
    for (let l = 0; l < 4; l++) { const t = .2 + l * .2, p = ptAt(pts, t), d = tanAt(pts, t); leaf(mb, .07, .02, basis(d.scale(.5).add(sideDir(d, l * 2 + k)).normalize(), UP, p, 0), rgb('#2f7a34'), rgb('#68b048'), { nu: 5, nv: 2, fold: .25, curl: -.1, base: .7, sharp: .5 }); }
    if (k % 2 === 0) { const e = pts[2], M0 = basis(new V3(Math.sin(yaw) * .3, 1, Math.cos(yaw) * .3), UP, e, Rr(0, 6, r), 1); for (let q = 0; q < 2; q++) petal(mb, .022, .024, pm(dirOn(.9, q * 3.14 + 1.57), AX, ORG).multiply(M0), [rgb('#3a5ae0'), rgb('#4a78ff'), rgb('#8ab0ff')], { cup: .3, nu: 4, nv: 4, throat: .1, veins: 0 }); petal(mb, .012, .01, pm(dirOn(.7, 4.7), AX, ORG).multiply(M0), [rgb('#ffffff'), rgb('#ffffff'), rgb('#ffffff')], { nu: 2, nv: 2 }); for (let q = 0; q < 3; q++) puff(mb, e.add(new V3(Math.cos(q * 2.1) * .006, .008, Math.sin(q * 2.1) * .006)), .0035, rgb('#f6c020'), 4); } }
  return [mb];
}
function oxalis(seed) {
  const r = rng(seed), mb = new MB();
  for (let k = 0; k < 11; k++) { const yaw = k / 11 * 6.283 + Rr(-.3, .3, r), h = Rr(.05, .1, r), top = new V3(Math.sin(yaw) * .03, h, Math.cos(yaw) * .03); mb.tube([ORG, top], [.0018, .0012], 3, () => rgb('#7a9a4a'));
    for (let q = 0; q < 3; q++) leaf(mb, .03, .036, basis(new V3(Math.sin(yaw + q * 2.094) * .9, .35, Math.cos(yaw + q * 2.094) * .9), UP, top, 0), rgb('#7a2a6a'), rgb('#4aa05a'), { nu: 4, nv: 2, fold: .45, curl: .05, base: .4, sharp: .45, rib: rgb('#9a4a8a') }); }
  for (let s = 0; s < 4; s++) { const yaw = Rr(0, 6.283, r), h = Rr(.12, .17, r), e = new V3(Math.sin(yaw) * .04, h, Math.cos(yaw) * .04); mb.tube([ORG, e], [.0015, .001], 3, () => rgb('#8aa04a')); for (let q = 0; q < 5; q++) petal(mb, .02, .013, pm(dirOn(1.15, q * 1.257), AX, ORG).multiply(basis(UP, new V3(1, 0, 0), e)), [rgb('#a0306a'), rgb('#ee70b0'), rgb('#ffc0e0')], { cup: .3, curl: .05, nu: 3, nv: 3, throat: .3, veins: 1 }); }
  return [mb];
}
function bidens(seed) {
  const r = rng(seed), mb = new MB();
  for (let k = 0; k < 5; k++) { const yaw = k / 5 * 6.283 + Rr(-.4, .4, r), h = Rr(.28, .5, r), pts = [ORG, new V3(Math.sin(yaw) * .04, h * .55, Math.cos(yaw) * .04), new V3(Math.sin(yaw) * .09, h, Math.cos(yaw) * .09)]; mb.tube(pts, [.0035, .002], 3, () => rgb('#6a8a4a'));
    for (let l = 0; l < 4; l++) { const p = ptAt(pts, .15 + l * .2), d = tanAt(pts, .15 + l * .2); for (let q = 0; q < 3; q++) leaf(mb, .035, .012, basis(d.scale(.3).add(sideDir(d, l * 2 + q * 1.1 + k)).normalize(), UP, p, 0), rgb('#2a6a2a'), rgb('#5aa04a'), { ser: .2, nu: 3, nv: 2, fold: .2, curl: .05, base: .6, sharp: .5 }); }
    const e = pts[2], M0 = basis(new V3(Math.sin(yaw) * .3, 1, Math.cos(yaw) * .3), UP, e, Rr(0, 6, r), 1); for (let q = 0; q < 5; q++) petal(mb, .015, .008, pm(dirOn(1.4, q * 1.257), AX, ORG).multiply(M0), [rgb('#ffffff'), rgb('#ffffff'), rgb('#f4f0e8')], { cup: .1, nu: 2, nv: 2, throat: .1, veins: 0 }); puff(mb, e.add(new V3(0, .004, 0)), .006, rgb('#f0c020'), 5); }
  return [mb];
}
function clover(seed) {
  const r = rng(seed), mb = new MB();
  for (let k = 0; k < 14; k++) { const yaw = k / 14 * 6.283 + Rr(-.3, .3, r), h = Rr(.05, .1, r), top = new V3(Math.sin(yaw) * .06, h, Math.cos(yaw) * .06); mb.tube([ORG, top], [.0015, .001], 3, () => rgb('#6a9a4a'));
    for (let q = 0; q < 3; q++) leaf(mb, .028, .03, basis(new V3(Math.sin(yaw + q * 2.094) * .9, .3, Math.cos(yaw + q * 2.094) * .9), UP, top, 0), rgb('#3a8a3a'), rgb('#78c058'), { nu: 3, nv: 2, fold: .1, curl: .02, base: .4, sharp: .4, rib: rgb('#c8e0b0') }); }
  for (let s = 0; s < 5; s++) { const a = Rr(0, 6.283, r), e = new V3(Math.sin(a) * .05, Rr(.1, .14, r), Math.cos(a) * .05); mb.tube([ORG, e], [.0015, .001], 3, () => rgb('#8aa060')); puff(mb, e.add(new V3(0, .008, 0)), .012, rgb(s % 3 ? '#ffffff' : '#ffd0e4'), 7); }
  return [mb];
}
const VIN = [['#ff6aa8', '#c0206a'], ['#ffffff', '#d03070']];
function vinca(seed, pal) {                                                              // Madagascar periwinkle, a cheerful garden weed
  const r = rng(seed), mb = new MB(), c = VIN[pal % 2];
  for (let k = 0; k < 6; k++) { const yaw = k / 6 * 6.283 + Rr(-.3, .3, r), pts = geo.branch(ORG, yaw, .25, Rr(.35, .6, r), .3, 5); mb.tube(pts, [.006, .003], 4, () => rgb('#6a8a4a'));
    for (let l = 0; l < 9; l++) { const t = .15 + l / 9 * .85, p = ptAt(pts, t), d = tanAt(pts, t); leaf(mb, .065, .032, basis(d.scale(.3).add(sideDir(d, l * 2.2 + k)).normalize(), UP, p, 0), rgb('#1c5a24'), rgb('#3f9a3c'), { nu: 4, nv: 2, fold: .25, curl: .08, base: .6, sharp: .55 }); }
    for (let f = 0; f < 2; f++) { const e = ptAt(pts, .8 + f * .18), M0 = basis(new V3(Math.sin(yaw) * .5 + Rr(-.3, .3, r), 1, Math.cos(yaw) * .5), UP, e, Rr(0, 6, r), 1); for (let q = 0; q < 5; q++) petal(mb, .02, .019, pm(dirOn(1.45, q * 1.257), AX, ORG).multiply(M0), [rgb(c[1]), rgb(c[0]), rgb(c[0])], { cup: .1, tw: .3, nu: 3, nv: 3, throat: .18, veins: 0 }); } }
  return [mb];
}

/* ---------- scattering: instanced, chunked, distance-culled ---------- */
G.cover = G.cover || [];
function chunks(srcMesh, mats, lim, cell = 24) {
  const cells = new Map(); for (const [x, z, m] of mats) { const key = Math.floor(x / cell) + ',' + Math.floor(z / cell), arr = cells.get(key) || []; arr.push(...m); cells.set(key, arr); }
  let vd = vds.get(srcMesh); if (!vd) { vd = B.VertexData.ExtractFromMesh(srcMesh); vds.set(srcMesh, vd); }
  for (const [key, arr] of cells) { const [cx, cz] = key.split(',').map(Number), m = new B.Mesh('decor' + key, scene); vd.applyToMesh(m); m.material = srcMesh.material; m.isPickable = false; m.thinInstanceSetBuffer('matrix', new Float32Array(arr), 16, true); m.thinInstanceRefreshBoundingInfo(true); m.doNotSyncBoundingInfo = true; G.cover.push({ m, x: (cx + .5) * cell, z: (cz + .5) * cell, lim }); }
}
function scatter(variants, o) {                                                              // variants: [meshes]; o: { n, ok(x,z), scale:[a,b], lim, maxR }
  const r = rng(o.seed || 7), out = [], n = Math.round(o.n * Q); let tries = 0;
  while (out.length < n && tries++ < n * 40) { const a = r() * 6.283, rr = Math.sqrt(r()) * (o.maxR || 60), x = (o.cx || 0) + Math.cos(a) * rr, z = (o.cz || 0) + Math.sin(a) * rr; if (!o.ok(x, z, r)) continue;
    if (o.space && !G.isFree(x, z, o.space)) continue;                                        // no overlapping (only beach plants use this)
    const s = Rr(o.scale[0], o.scale[1], r); if (o.space) G.claim(x, z, o.space * s, !!o.solid, o.tag || ''); M4.ComposeToRef(new V3(s, s * Rr(.85, 1.2, r), s), B.Quaternion.RotationYawPitchRoll(r() * 6.28, o.tilt ? Rr(-o.tilt, o.tilt, r) : 0, o.tilt ? Rr(-o.tilt, o.tilt, r) : 0), new V3(x, hFn(x, z) - .015, z), tmp); out.push([x, z, tmp.toArray().slice(), Math.floor(r() * variants.length)]); }
  variants.forEach((src, vi) => chunks(src, out.filter(q => q[3] === vi).map(q => [q[0], q[1], q[2]]), o.lim));
}
const build = (fn, mat, name, ...args) => { G.setLOD(1); const mbs = fn(...args), m = mbs[0].build(name, mat); G.setLOD(0); m.setEnabled(false); return m; };
const patch = (x, z, f, th) => G.vnoise(x * f + 11, z * f + 3) > th;
const free = (x, z, pc = .5) => !G.blocked(x, z, pc);

setTimeout(() => {}, 0);
(function placeAll() {
  const R_ = (x, z) => Math.hypot(x, z);
  scatter([build(lantana, G.mats.shrub, 'lantanaA', 21, 0), build(lantana, G.mats.shrub, 'lantanaB', 22, 1), build(lantana, G.mats.shrub, 'lantanaC', 23, 2)], { seed: 31, n: 190, maxR: 52, scale: [.8, 1.3], lim: 62, ok: (x, z, r) => free(x, z, .8) && R_(x, z) > 14 && patch(x, z, .06, .46) });
  scatter([build(makahiya, M.low, 'makahiyaA', 5), build(makahiya, M.low, 'makahiyaB', 6)], { seed: 32, n: 900, maxR: 50, scale: [.8, 1.4], lim: 36, ok: (x, z) => free(x, z, .35) && patch(x, z, .1, .5) });
  scatter([build(ageratum, M.low, 'ageA', 9), build(ageratum, M.low, 'ageB', 10)], { seed: 33, n: 560, maxR: 48, scale: [.8, 1.3], lim: 38, ok: (x, z) => free(x, z, .35) && patch(x, z, .09, .6) });
  scatter([build(wedelia, M.low, 'wedA', 12), build(wedelia, M.low, 'wedB', 13)], { seed: 34, n: 760, maxR: 48, scale: [.8, 1.4], lim: 36, ok: (x, z) => free(x, z, .3) && patch(x, z, .08, .52) });
  scatter([build(cosmos, M.cosmos, 'cosA', 15, 0), build(cosmos, M.cosmos, 'cosB', 16, 1), build(cosmos, M.cosmos, 'cosC', 17, 2)], { seed: 35, n: 400, maxR: 46, scale: [.8, 1.25], lim: 52, ok: (x, z) => free(x, z, .6) && R_(x, z) > 6 && patch(x, z, .07, .56) });
  scatter([build(cogon, M.cogon, 'cogonA', 41, false), build(cogon, M.cogon, 'cogonB', 42, false)], { seed: 36, n: 440, maxR: 80, scale: [.8, 1.4], lim: 74, ok: (x, z) => x > G.shoreX(z) + 8 && free(x, z, .6) && (R_(x, z) > 32 || patch(x, z, .12, .66)) });
  scatter([build(cogon, M.tall, 'talahibA', 43, true), build(cogon, M.tall, 'talahibB', 44, true)], { seed: 37, n: 80, maxR: 90, scale: [.85, 1.3], lim: 96, ok: (x, z) => R_(x, z) > 38 && x > -10 && free(x, z, 1) });
  scatter([build(croton, G.mats.shrub, 'crotonA', 51, 0), build(croton, G.mats.shrub, 'crotonB', 52, 1), build(croton, G.mats.shrub, 'crotonC', 53, 2)], { seed: 38, n: 56, maxR: 44, scale: [.8, 1.25], lim: 62, ok: (x, z) => free(x, z, .9) && (Math.hypot(x - G.L.house.x, z - G.L.house.z) < 20 || G.path.dist(x, z) < 6) });

  const meadow = (k, f, th) => (x, z) => free(x, z, .3) && patch(x, z, f, th);
  scatter([build(portulaca, M.low, 'portA', 91, 0), build(portulaca, M.low, 'portB', 92, 1), build(portulaca, M.low, 'portC', 93, 2), build(portulaca, M.low, 'portD', 94, 3)], { seed: 41, n: 560, maxR: 46, scale: [.8, 1.4], lim: 32, ok: meadow(0, .11, .5) });
  scatter([build(dayflower, M.low, 'dayA', 95), build(dayflower, M.low, 'dayB', 96)], { seed: 42, n: 560, maxR: 46, scale: [.8, 1.4], lim: 34, ok: meadow(0, .1, .52) });
  scatter([build(oxalis, M.low, 'oxA', 97), build(oxalis, M.low, 'oxB', 98)], { seed: 43, n: 520, maxR: 46, scale: [.8, 1.5], lim: 30, ok: meadow(0, .12, .5) });
  scatter([build(bidens, M.low, 'bidA', 99), build(bidens, M.low, 'bidB', 100)], { seed: 44, n: 560, maxR: 48, scale: [.8, 1.4], lim: 36, ok: meadow(0, .08, .54) });
  scatter([build(clover, M.low, 'cloA', 101), build(clover, M.low, 'cloB', 102)], { seed: 45, n: 760, maxR: 48, scale: [.8, 1.5], lim: 30, ok: (x, z) => free(x, z, .25) });
  scatter([build(vinca, G.mats.shrub, 'vinA', 103, 0), build(vinca, G.mats.shrub, 'vinB', 104, 1)], { seed: 46, n: 140, maxR: 46, scale: [.8, 1.3], lim: 46, ok: (x, z) => free(x, z, .7) && patch(x, z, .07, .5) });
  // ferns grow in the shade at the foot of the big trees
  const fm = [build(fern, M.fern, 'fernA', 61), build(fern, M.fern, 'fernB', 62)], fer = [], rf = rng(66);
  for (const t of G.trees || []) for (let i = 0; i < 3; i++) { const a = rf() * 6.283, d = Rr(1.0, 2.8, rf), x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d; if (!free(x, z, .2)) continue; const s = Rr(.8, 1.4, rf); M4.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(rf() * 6.28, 0, 0), new V3(x, hFn(x, z) - .02, z), tmp); fer.push([x, z, tmp.toArray().slice(), Math.floor(rf() * 2)]); }
  fm.forEach((src, vi) => chunks(src, fer.filter(q => q[3] === vi).map(q => [q[0], q[1], q[2]]), 54));
  // the beach: morning glory creeping over the sand, pandan standing behind it
  const keep = (x, z) => !G.L.keepOut.some(k => Math.hypot(x - k.x, z - k.z) < k.r);
  scatter([build(glory, M.vine, 'gloryA', 71), build(glory, M.vine, 'gloryB', 72)], { seed: 39, n: 46, maxR: 52, scale: [.9, 1.5], lim: 80, space: .45, tag: 'glory', ok: (x, z) => { const s = G.shoreX(z); return x > s + 1.9 && x < s + 6 && keep(x, z); } });   // morning glory stays above the swash run-up
  scatter([build(pandan, M.pandan, 'pandanA', 81), build(pandan, M.pandan, 'pandanB', 82)], { seed: 40, n: 24, maxR: 56, scale: [.8, 1.3], lim: 90, space: .85, solid: true, tag: 'pandan', ok: (x, z) => { const s = G.shoreX(z); return x > s + 3.5 && x < s + 9 && keep(x, z) && patch(x, z, .05, .4); } });
})();
G.updateCover = () => { const c = G.camera.position; for (const e of G.cover) e.m.setEnabled(Math.hypot(e.x - c.x, e.z - c.z) < (e.lim !== undefined ? e.lim : G.QUAL.grass + 14) + 12); };

G.systems.add('coverLOD', () => G.updateCover(), { order: 11, every: 10 });
})();
