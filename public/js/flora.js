/* =====================================================================
   flora.js - hand-built plants of a Cebuano garden (buwakan)
   Each plant is real geometry: curved petals with ruffles and veins,
   folded leaves with midribs, tapered woody stems, ringed palm trunks.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G;
const UP = V3.Up(), ORG = V3.Zero();
const Rr = (a, b, r) => a + (b - a) * r();
let LOD = 0; const K = () => LOD === 0 ? 1 : LOD === 1 ? .78 : .58; G.setLOD = v => { LOD = v; G.LODV = v; };

/* ---------- primitives ---------- */
// a leaf lies along +z, blade facing +y. fold = V-shaped midrib, curl = tip lift (negative = droop)
function leaf(mb, L, W, M, c0, c1, o = {}) {
  const nu = LOD ? Math.max(2, Math.round((o.nu || 6) * (LOD === 1 ? .6 : .4))) : Math.round((o.nu || 6) * 1.5), nv = LOD ? Math.min(o.nv || 4, 2) : Math.max(4, (o.nv || 4) + 2), fold = o.fold ?? .25, curl = o.curl ?? .12, base = o.base ?? .75, sharp = o.sharp ?? .8, ser = o.ser || 0, rib = o.rib || shade(c1, 1.3);
  mb.grid(nu, nv, (u, v) => {
    const s = v * 2 - 1, prof = Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, base))), sharp), wob = 1 + ser * Math.sin(u * 44);
    return [s * W * .5 * prof * wob, fold * Math.abs(s) * prof * W * .5 + curl * u * u * L, u * L];
  }, (u, v) => { const s = Math.abs(v * 2 - 1); if (s < .06 && u > .03 && u < .95) return rib; return shade(mixA(c0, c1, u), (1 - .18 * s) * (1 + .07 * Math.sin(u * 30 + s * 6))); }, M, (u, v) => .12 + .88 * u);
}
// a petal lies along +z, concave side toward +y. cols = [throat, body, edge]
function petal(mb, L, W, M, cols, o = {}) {
  if (LOD === 2) { L *= 1.25; W *= 1.3; }
  const nu = LOD ? Math.max(2, Math.round((o.nu || 7) * (LOD === 1 ? .6 : .35))) : Math.round((o.nu || 7) * 1.35), nv = LOD ? Math.max(2, Math.round((o.nv || 6) * (LOD === 1 ? .6 : .35))) : Math.round((o.nv || 6) * 1.35), cup = o.cup ?? .5, curl = o.curl ?? .2, ruf = o.ruf || 0, tw = o.tw || 0, pw = o.pw ?? .7, sh = o.sh ?? .55, th = o.throat ?? .25, tipN = o.notch || 0;
  mb.grid(nu, nv, (u, v) => {
    const s = v * 2 - 1, prof = Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, pw))), sh) * (1 - tipN * Math.exp(-s * s * 30) * u * u);
    let x = s * W * .5 * prof, y = cup * s * s * prof * W * .45 + curl * u * u * L + ruf * Math.sin(u * 15 + s * 3.2) * u * W * .14 * Math.abs(s);
    const z = u * L * (1 - .05 * s * s); if (tw) { const a = tw * u, c = Math.cos(a), sn = Math.sin(a), x2 = x * c - y * sn; y = x * sn + y * c; x = x2; }
    return [x, y, z];
  }, (u, v) => { const s = Math.abs(v * 2 - 1); let c = u < th ? mixA(cols[0], cols[1], u / th) : mixA(cols[1], cols[2], clamp((u - th) / (1 - th), 0, 1) * .85 + s * .15); return shade(c, 1 - .05 * Math.abs(Math.sin(v * 21 + u * 2)) * (o.veins ?? 1)); }, M, (u, v) => .1 + .55 * u);
}
const pm = (d, yh, o, roll, sc) => basis(d, yh, o, roll || 0, sc || 1);                    // basis shorthand
const dirOn = (spread, a) => new V3(Math.sin(spread) * Math.cos(a), Math.sin(spread) * Math.sin(a), Math.cos(spread));  // direction `spread` rad off the +z axis
const AX = new V3(0, 0, 1);
function sideDir(d, phi) { const ref = Math.abs(d.y) < .9 ? UP : V3.Right(), n = V3.Cross(ref, d).normalize(), b = V3.Cross(d, n); return n.scale(Math.cos(phi)).add(b.scale(Math.sin(phi))); }
function ptAt(pts, t) { const f = clamp(t, 0, .9999) * (pts.length - 1), i = Math.floor(f); return V3.Lerp(pts[i], pts[i + 1], f - i); }
function tanAt(pts, t) { const f = clamp(t, 0, .9999) * (pts.length - 1), i = Math.floor(f); return pts[i + 1].subtract(pts[i]).normalize(); }
function branch(o, yaw, lean, len, bend, n = 6) { const p = []; for (let k = 0; k < n; k++) { const t = k / (n - 1), out = lean * len * (t + bend * t * t); p.push(new V3(o.x + Math.sin(yaw) * out, o.y + len * t * (1 - .12 * t) * (1 - lean * .45), o.z + Math.cos(yaw) * out)); } return p; }
const wood = (a, b) => { const A = rgb(a), Bc = rgb(b); return t => mixA(A, Bc, t); };

/* ---------- flowers (built around local +z, the way the flower faces) ---------- */
function gumamelaFlower(mb, M, col, r) {                         // Hibiscus rosa-sinensis
  const cols = [rgb(col.eye), rgb(col.body), rgb(col.edge)], n = 5, a0 = r() * 6.28;
  for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.283 + Rr(-.05, .05, r), d = dirOn(.95 + Rr(-.08, .08, r), a); petal(mb, .115, .112, pm(d, AX, ORG, Rr(-.08, .08, r)).multiply(M), cols, { cup: .6, curl: -.22, ruf: .22, pw: .55, sh: .45, nu: 8, nv: 8, throat: .3, notch: .15 }); }
  const col2 = rgb('#f4cfc8'), pts = [new V3(0, 0, 0), new V3(0, .006, .06), new V3(0, .022, .125), new V3(0, .04, .17)];
  mb.tube(pts, [.0045, .0032], 6, t => mixA(col2, rgb('#d9808a'), t), M);
  for (let i = 0; i < 9; i++) { const t = .55 + .4 * i / 9, p = ptAt(pts, t), a = i * 2.4; mb.ellipsoid(p.x + Math.cos(a) * .008, p.y + Math.sin(a) * .008, p.z, .0065, .0065, .009, 5, 4, () => rgb('#e8a21a'), M); }
  for (let i = 0; i < 5; i++) { const p = pts[3], a = i / 5 * 6.28; mb.ellipsoid(p.x + Math.cos(a) * .006, p.y + Math.sin(a) * .006, p.z + .004, .0055, .0055, .0055, 5, 4, () => rgb('#8d0c20'), M); }
  for (let i = 0; i < 5; i++) leaf(mb, .045, .02, pm(dirOn(.55, i / 5 * 6.28 + .3), AX, ORG, 0).multiply(M), rgb('#2d6a2f'), rgb('#4e8d38'), { nu: 3, nv: 2, fold: .3, curl: .08 });
}
function sampaguitaFlower(mb, M, r) {                              // Jasminum sambac - a little double white flower
  const cols = [rgb('#e3efc4'), rgb('#fffdf2'), rgb('#ffffff')];
  for (let ring = 0; ring < 2; ring++) { const n = ring ? 6 : 5, sp = ring ? 1.25 : 1.0, L = ring ? .016 : .014, a0 = ring ? .5 : 0; for (let i = 0; i < n; i++) petal(mb, L, .0125, pm(dirOn(sp, a0 + i / n * 6.283), AX, ORG).multiply(M), cols, { cup: .35, curl: .1, nu: 4, nv: 4, pw: .5, sh: .5, throat: .2, veins: .3 }); }
  mb.tube([new V3(0, 0, -.012), new V3(0, 0, 0)], [.0022, .0028], 5, () => rgb('#eaf2cf'), M);
  for (let i = 0; i < 7; i++) leaf(mb, .014, .0018, pm(dirOn(.7 + (i % 2) * .3, i / 7 * 6.28), AX, new V3(0, 0, -.012)).multiply(M), rgb('#4b7a3a'), rgb('#4b7a3a'), { nu: 2, nv: 1, fold: 0, curl: 0, rib: rgb('#4b7a3a') });
}
function sampaguitaBud(mb, M) { mb.ellipsoid(0, 0, .014, .0042, .0042, .0145, 6, 5, (u, v) => mixA(rgb('#f6f4dd'), rgb('#ffffff'), v), M); mb.tube([new V3(0, 0, -.005), new V3(0, 0, .004)], .0028, 5, () => rgb('#5b8a43'), M); }
function kalachuchiFlower(mb, M, col, r) {                         // Plumeria rubra, the frangipani
  const cols = [rgb(col.throat), rgb(col.body), rgb(col.edge)], a0 = r() * 6.28;
  for (let i = 0; i < 5; i++) { const a = a0 + i / 5 * 6.283; petal(mb, .068, .04, pm(dirOn(1.32, a), AX, ORG, .38).multiply(M), cols, { cup: .35, curl: .15, tw: .55, pw: .5, sh: .5, nu: 8, nv: 6, throat: .32, veins: .6 }); }
  mb.tube([new V3(0, 0, -.02), new V3(0, 0, .004)], [.004, .003], 6, () => rgb(col.throat), M);
}
function santanHead(mb, M, col, r, n = 28) {                        // Ixora coccinea: a dome of tiny four-petalled stars
  n = Math.max(6, Math.round(n * K()));
  const cA = rgb(col), cB = shade(cA, .72), cT = shade(cA, 1.12);
  for (let i = 0; i < n; i++) {
    const ph = Math.acos(1 - Rr(0, .85, r)), th = i * 2.4 + Rr(-.2, .2, r), d = new V3(Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)), p = d.scale(.04);
    const F = pm(d, UP, p, i).multiply(M);
    mb.tube([new V3(0, 0, -.026), new V3(0, 0, 0)], [.0016, .0022], 4, t => mixA(cB, cA, t), F);
    for (let k = 0; k < 4; k++) petal(mb, .0105, .0105, pm(dirOn(1.25, k * 1.571 + .3), AX, ORG).multiply(F), [cA, cA, cT], { cup: .2, curl: .08, nu: 3, nv: 3, pw: .85, sh: .45, throat: .01, veins: 0 });
  }
  mb.tube([new V3(0, 0, -.03), new V3(0, 0, .02)], .004, 4, () => rgb('#4b7a2a'), M);
}
function damaFlower(mb, M, r) {                                    // Cestrum nocturnum - the night-blooming "lady of the night"
  const c = rgb('#eef5cf'), c2 = rgb('#d8e8a0');
  mb.tube([new V3(0, 0, 0), new V3(0, .001, .018), new V3(0, .003, .036)], [.0013, .0021], 5, t => mixA(c2, c, t), M);
  for (let i = 0; i < 5; i++) leaf(mb, .008, .0045, pm(dirOn(.9, i / 5 * 6.28), AX, new V3(0, .003, .036)).multiply(M), c, c, { nu: 1, nv: 1, fold: 0, curl: 0, rib: c });
}
function bougainBract(mb, M, col, r) {                             // a bogambilya "flower" is 3 papery bracts around 3 tiny true flowers
  const cols = [rgb(col.base), rgb(col.body), rgb(col.edge)], a0 = r() * 6.28;
  for (let i = 0; i < 3; i++) petal(mb, .042, .036, pm(dirOn(.7, a0 + i * 2.094 + Rr(-.2, .2, r)), AX, ORG, Rr(-.2, .2, r)).multiply(M), cols, { cup: .4, curl: .08, ruf: .35, pw: .6, sh: .5, nu: 5, nv: 5, throat: .15, veins: 1.6 });
  for (let i = 0; i < 3; i++) mb.tube([new V3(Math.cos(i * 2.1) * .003, Math.sin(i * 2.1) * .003, 0), new V3(Math.cos(i * 2.1) * .005, Math.sin(i * 2.1) * .005, .03)], [.0022, .0034], 5, t => mixA(rgb('#f4ecd2'), rgb('#fffbea'), t), M);
}

/* ---------- plants (base at origin, up = +y) ---------- */
const GUM = {
  red: { eye: '#6c0015', body: '#d3122c', edge: '#ee3a4a' }, pink: { eye: '#8b1a46', body: '#f06fa0', edge: '#ffb3cf' },
  yellow: { eye: '#b3221c', body: '#ffc61c', edge: '#ffe36a' }, orange: { eye: '#8a1a10', body: '#f26a1b', edge: '#ffa24a' }
};
const leafGlossy = [rgb('#1e5622'), rgb('#3f8a33')];
function addLeaves(mb, pts, count, L, W, c0, c1, o, r, pitchK = .9) {
  count = Math.max(3, Math.round(count * K())); if (LOD === 2) { L *= 1.4; W *= 1.7; } else if (LOD === 1) { L *= 1.08; W *= 1.18; }
  for (let i = 0; i < count; i++) {
    const t = .18 + .82 * (i + .5) / count, p = ptAt(pts, t), d = tanAt(pts, t), dir = d.scale(.45).add(sideDir(d, i * 2.4 + Rr(-.4, .4, r)).scale(pitchK)).normalize();
    const s = Rr(.8, 1.2, r); leaf(mb, L * s, W * s, pm(dir, UP, p, Rr(-.3, .3, r)), c0, c1, o);
  }
}
function gumamela(variant, seed) {
  const r = rng(seed), mb = new MB(), nb = Math.max(4, Math.round(8 * K())), br = wood('#6a5b3c', '#4a7a2a');
  for (let k = 0; k < nb; k++) {
    const yaw = k / nb * 6.283 + Rr(-.3, .3, r), len = Rr(.95, 1.4, r), pts = branch(ORG, yaw, .2 + Rr(0, .12, r), len, .3, 6);
    mb.tube(pts, [.02, .006], 6, br);
    addLeaves(mb, pts, 20, .19, .115, leafGlossy[0], leafGlossy[1], { ser: .04, base: .65, sharp: .7, nu: 5, nv: 2, fold: .3, curl: .15 }, r);
    if (k % 2 === 0 || r() < .45) { const tip = pts[pts.length - 1], dir = new V3(Math.sin(yaw) * .75, Rr(.1, .45, r), Math.cos(yaw) * .75).normalize(); gumamelaFlower(mb, pm(dir, UP, tip, Rr(0, 6, r), 1.4), GUM[variant], r); }
    if (r() < .5) { const tip = pts[pts.length - 2]; mb.ellipsoid(tip.x, tip.y - .03, tip.z, .014, .035, .014, 6, 5, (u, v) => mixA(rgb('#5a8a3a'), rgb(GUM[variant].body), v * .6)); }
  }
  return [mb];
}
function sampaguita(seed) {
  const r = rng(seed), mb = new MB(), br = wood('#6a5a3a', '#6f8a3a'), NB = Math.max(4, Math.round(9 * K()));
  for (let k = 0; k < NB; k++) {
    const yaw = k / NB * 6.283 + Rr(-.3, .3, r), pts = branch(ORG, yaw, .5 + Rr(0, .3, r), Rr(.6, .95, r), .5, 5);
    mb.tube(pts, [.011, .004], 5, br);
    addLeaves(mb, pts, 15, .08, .052, rgb('#285f2a'), rgb('#4d8e3c'), { base: .7, sharp: .7, nu: 4, nv: 2, fold: .35, curl: .1 }, r, 1.1);
    for (let f = 0; f < 4; f++) { const t = .5 + f * .12 + Rr(0, .08, r), p = ptAt(pts, t), d = tanAt(pts, t), dir = d.scale(.4).add(sideDir(d, f * 2.2 + k).scale(.9)).add(new V3(0, .3, 0)).normalize(); if (r() < .75) sampaguitaFlower(mb, pm(dir, UP, p, Rr(0, 6, r), 1.7), r); else sampaguitaBud(mb, pm(dir, UP, p, 0, 1.7)); }
  }
  return [mb];
}
function kalachuchi(variant, seed) {
  const r = rng(seed), mb = new MB(), col = variant === 'pink' ? { throat: '#ffd23c', body: '#fff0f0', edge: '#ff7f9f' } : { throat: '#ffcc2a', body: '#fffaf0', edge: '#ffffff' };
  const trunk = [new V3(0, 0, 0), new V3(.03, .25, .02), new V3(.02, .5, -.02), new V3(.05, .75, .02)];
  mb.tube(trunk, [.14, .095], 9, t => mixA(rgb('#8f8f80'), rgb('#7a8068'), t));
  for (let k = 0; k < 5; k++) {
    const yaw = k / 5 * 6.283 + Rr(-.3, .3, r), o = new V3(.05, .7 + Rr(0, .06, r), .02), pts = branch(o, yaw, .6, Rr(.8, 1.2, r), .3, 5);
    mb.tube(pts, [.055, .03], 8, t => mixA(rgb('#8a8a76'), rgb('#6f8a4a'), t * .7)); const tip = pts[pts.length - 1];
    for (let i = 0; i < 15; i++) { const a = i / 15 * 6.28 + Rr(-.2, .2, r), dir = new V3(Math.sin(a) * Math.cos(.95), Math.sin(.95 + Rr(0, .25, r)), Math.cos(a) * Math.cos(.95)); leaf(mb, .5 * Rr(.85, 1.15, r), .16, pm(dir, UP, tip.add(new V3(0, -.04, 0)), 0), rgb('#2a6a30'), rgb('#5da042'), { nu: 7, nv: 2, fold: .35, curl: -.18, base: .8, sharp: .55, rib: rgb('#b6d27c') }); }
    for (let f = 0; f < 8; f++) { const a = f / 8 * 6.28 + Rr(-.3, .3, r), dir = new V3(Math.sin(a) * .45, .85, Math.cos(a) * .45).normalize(); kalachuchiFlower(mb, pm(dir, UP, tip.add(new V3(Math.sin(a) * .05, .05 + Rr(0, .06, r), Math.cos(a) * .05)), Rr(0, 6, r), 1.7), col, r); }
  }
  return [mb];
}
function santan(variant, seed) {
  const r = rng(seed), mb = new MB(), br = wood('#5a4a30', '#5a7a30'), col = variant === 'yellow' ? '#f6c61c' : '#e5381a', NB = Math.max(4, Math.round(7 * K()));
  for (let k = 0; k < NB; k++) {
    const yaw = k / NB * 6.283 + Rr(-.3, .3, r), pts = branch(ORG, yaw, .3 + Rr(0, .15, r), Rr(.65, .95, r), .3, 5);
    mb.tube(pts, [.013, .005], 5, br);
    addLeaves(mb, pts, 17, .115, .055, rgb('#1b4a24'), rgb('#2f7a35'), { base: .7, sharp: .6, nu: 4, nv: 2, fold: .35, curl: .08 }, r, 1.0);
    if (k < NB - 1 && r() < .9) { const tip = pts[pts.length - 1], dir = new V3(Math.sin(yaw) * .3, 1, Math.cos(yaw) * .3).normalize(); santanHead(mb, pm(dir, UP, tip.add(new V3(0, .02, 0)), Rr(0, 6, r), 1.5), col, r, 18); }
  }
  return [mb];
}
function dama(seed) {
  const r = rng(seed), stems = new MB(), flow = new MB(), br = wood('#6a6a3a', '#7aa04a'), NB = Math.max(5, Math.round(11 * K()));
  for (let k = 0; k < NB; k++) {
    const yaw = k / NB * 6.283 + Rr(-.3, .3, r), len = Rr(1.2, 1.7, r), pts = branch(ORG, yaw, .55 + Rr(0, .25, r), len, .8, 8);
    stems.tube(pts, [.012, .003], 5, br);
    addLeaves(stems, pts, 17, .12, .04, rgb('#4a7a30'), rgb('#7aa845'), { base: .8, sharp: .65, nu: 4, nv: 2, fold: .25, curl: -.12 }, r, 1.15);
    for (let f = 0; f < 4; f++) { const t = .45 + f * .14 + Rr(0, .06, r), p = ptAt(pts, t), d = tanAt(pts, t); for (let q = 0; q < 5; q++) { const dir = d.scale(.2).add(sideDir(d, q * 1.3 + f).scale(.8)).add(new V3(0, .3, 0)).normalize(); damaFlower(flow, pm(dir, UP, p.add(sideDir(d, q * 1.3).scale(.012)), 0, 1.6), r); } }
  }
  return [stems, flow];
}
const BOUGAIN = { magenta: { base: '#f08ab8', body: '#cf1569', edge: '#e24a8c' }, orange: { base: '#ffc07a', body: '#f08a24', edge: '#ffb24d' }, white: { base: '#fff3f6', body: '#fdf0f3', edge: '#ffd6e4' } };
function bougainvillea(variant, seed) {
  const r = rng(seed), mb = new MB(), br = wood('#6a5a40', '#5a7a3a'), NB = Math.max(4, Math.round(9 * K()));
  for (let k = 0; k < NB; k++) {
    const yaw = k / NB * 6.283 + Rr(-.3, .3, r), pts = branch(ORG, yaw, .75 + Rr(0, .3, r), Rr(1.1, 1.6, r), .9, 7);
    mb.tube(pts, [.016, .005], 5, br);
    addLeaves(mb, pts, 18, .08, .058, rgb('#2b6a30'), rgb('#59a042'), { base: .6, sharp: .6, nu: 4, nv: 2, fold: .3, curl: .05 }, r, 1.1);
    for (let c = 0; c < 11; c++) { const t = .3 + c * .062 + Rr(0, .04, r), p = ptAt(pts, t), d = tanAt(pts, t), dir = d.scale(.3).add(sideDir(d, c * 2 + k).scale(.8)).normalize(); bougainBract(mb, pm(dir, UP, p, 0, 1.4), BOUGAIN[variant], r); }
  }
  return [mb];
}
function wildflower(seed) {                                         // tiny meadow daisies, the 'unnamed' flowers of every Visayan lawn
  const r = rng(seed), mb = new MB();
  mb.tube([new V3(0, 0, 0), new V3(.01, .08, 0), new V3(.015, .15, 0)], [.0035, .0022], 4, () => rgb('#4a7a2a'));
  const top = new V3(.015, .15, 0), col = r() < .6 ? [rgb('#ffffff'), rgb('#fff6f0'), rgb('#ffffff')] : [rgb('#ffe27a'), rgb('#ffd23a'), rgb('#fff0a0')];
  for (let i = 0; i < 7; i++) petal(mb, .028, .012, pm(dirOn(1.35, i / 7 * 6.283), AX, ORG).multiply(basis(UP, new V3(1, 0, 0), top)), col, { nu: 2, nv: 2, cup: .1, curl: .05, throat: .1, veins: 0 });
  mb.ellipsoid(0, .152, 0, .009, .006, .009, 5, 3, () => rgb('#e9a20c'), M4.Translation(.015, 0, 0));
  leaf(mb, .05, .02, pm(new V3(.7, .4, 0), UP, new V3(.004, .02, 0)), rgb('#3a6a26'), rgb('#5a9a38'), { nu: 3, nv: 2, fold: .2, curl: .1 });
  return [mb];
}
function grassBlade(seed) {                                         // a tuft of three curved blades
  const r = rng(seed), mb = new MB();
  for (let b = 0; b < 7; b++) {
    const yaw = b * .9 + Rr(-.3, .3, r), lean = Rr(.12, .4, r), h = Rr(.14, .34, r), W = .012;
    mb.grid(5, 1, (u, v) => { const s = v * 2 - 1, bend = lean * u * u * h; return [Math.sin(yaw) * bend + Math.cos(yaw) * s * W * (1 - u * .85), h * u * (1 - .08 * u), Math.cos(yaw) * bend - Math.sin(yaw) * s * W * (1 - u * .85)]; },
      u => mixA(rgb('#2c5a1e'), rgb('#9ac85a'), u), null, () => 0);
  }
  return [mb];
}

/* ---------- trees ---------- */
function ilangIlang(seed) {                                         // Cananga odorata, the perfume tree
  const r = rng(seed), mb = new MB(), H = Rr(6.2, 7.2, r), trunk = [];
  for (let k = 0; k <= 14; k++) { const t = k / 14; trunk.push(new V3(Math.sin(t * 3 + seed) * .22 * t, H * t, Math.cos(t * 2.4 + seed) * .22 * t)); }
  (G.geo.ilangTrunk = G.geo.ilangTrunk || {})[seed] = trunk;
  mb.tube(trunk, t => .22 * (1 - t) + .07 * t + .12 * Math.exp(-t * 12), 11, (t, a) => shade(mixA(rgb('#8c8c7a'), rgb('#6d6a58'), .5 + .5 * Math.sin(t * 40 + a * 6)), 1));
  const fl = new MB(), flowerCols = [rgb('#d9d24a'), rgb('#bdc43a')];
  const rs = rng(seed * 13 + 5), branchData = (G.geo.ilangBranches = G.geo.ilangBranches || {});      // the branch skeleton has its own random stream so every level of detail keeps the SAME branches
  if (!G.LODV) branchData[seed] = [];
  for (let lv = 0; lv < 6; lv++) for (let k = 0; k < 4; k++) {
    const t = .3 + lv * .11, o = ptAt(trunk, t), yaw = k * (6.283 / 4) + lv * .9 + Rr(-.3, .3, rs), L = Rr(2.4, 3.4, rs) * (1.1 - t * .5), pts = [];
    for (let i = 0; i < 8; i++) { const u = i / 7; pts.push(new V3(o.x + Math.sin(yaw) * L * u, o.y + L * (.38 * u - .95 * u * u) + .1, o.z + Math.cos(yaw) * L * u)); }
    if (!G.LODV) branchData[seed].push({ lv, k, pts, t });
    if ((G.LODV === 2 && k % 2) || (G.LODV === 1 && k === 3)) continue;                  // fewer branches far away, but never different ones
    mb.tube(pts, [.06, .014], 6, t2 => mixA(rgb('#7a7a68'), rgb('#6a8a4a'), t2));
    for (let i = 0, NLf = Math.max(8, Math.round(26 * K())); i < NLf; i++) { const u = .1 + .9 * (i + .5) / NLf, p = ptAt(pts, u), d = tanAt(pts, u), s = i % 2 ? 1 : -1, dir = d.scale(.35).add(new V3(Math.cos(yaw) * s, 0, -Math.sin(yaw) * s).scale(.85)).add(new V3(0, -.25, 0)).normalize(); leaf(mb, .3, .105, pm(dir, UP, p, 0), rgb('#2a6a30'), rgb('#5a9a3d'), { nu: 5, nv: 2, fold: .2, curl: -.3, base: .7, sharp: .6 }); }
    for (let c = 0; c < Math.max(2, Math.round(4 * K())); c++) { const u = .4 + c * .14 + Rr(0, .05, r), p = ptAt(pts, u); for (let q = 0; q < Math.max(2, Math.round(4 * K())); q++) { const a = q * 1.57 + c; for (let i = 0; i < 6; i++) { const aa = i / 6 * 6.283 + a, d = new V3(Math.sin(.9) * Math.cos(aa), -.8 + Math.sin(.4) * Math.sin(aa) * .3, Math.sin(.9) * Math.sin(aa)).normalize(); petal(fl, .11, .014, pm(d, UP, p.add(new V3(Math.cos(a) * .02, -.05, Math.sin(a) * .02)), 0), [flowerCols[0], flowerCols[0], flowerCols[1]], { nu: 6, nv: 1, cup: 0, curl: -.15, tw: 1.2, pw: .5, sh: .5, throat: .1, veins: 0 }); } } }
  }
  return [mb, fl];
}
function coconutPalm(seed) {
  const r = rng(seed), mb = new MB(), H = Rr(8.5, 11.5, r), lean = Rr(.6, 1.6, r), ly = Rr(0, 6.28, r), pts = [];
  for (let k = 0; k <= 24; k++) { const t = k / 24, off = lean * t * t * H * .13; pts.push(new V3(Math.sin(ly) * off, H * t, Math.cos(ly) * off)); }
  (G.geo.palmTrunk = G.geo.palmTrunk || {})[seed] = pts;
  mb.tube(pts, t => .33 * (1 - t) + .18 * t + .17 * Math.exp(-t * 15), 16, (t, a) => { const band = Math.sin(t * H * 6.5), streak = Math.sin(a * 6.283 * 5); return shade(mixA(rgb('#9a8870'), rgb('#6d5e49'), .5 + .5 * band * .7), .93 + .07 * streak); });
  const top = pts[pts.length - 1].clone(), nf = Math.max(9, Math.round(21 * K())), NL = Math.max(12, Math.round(44 * K()));
  for (let i = 0; i < nf; i++) {
    const yaw = i / nf * 6.283 + Rr(-.15, .15, r), el0 = Rr(.35, 1.15, r), Lf = Rr(4.4, 5.6, r), rp = [];
    for (let k = 0; k <= 10; k++) { const t = k / 10, hor = Lf * Math.cos(el0) * t * (1 + .15 * t), y = Lf * (Math.sin(el0) * t - .78 * t * t); rp.push(new V3(top.x + Math.sin(yaw) * hor, top.y + y + .2, top.z + Math.cos(yaw) * hor)); }
    mb.tube(rp, [.035, .006], 5, t => mixA(rgb('#8a9a42'), rgb('#6a8a34'), t));
    for (let k = 1; k <= NL; k++) {
      const t = .08 + .92 * k / NL, p = ptAt(rp, t), d = tanAt(rp, t), hs = new V3(d.z, 0, -d.x).normalize(), ll = 1.15 * Math.pow(Math.sin(Math.PI * Math.pow(t, .55)), .8) + .15;
      for (const sd of [-1, 1]) { const dir = hs.scale(sd * .95).add(d.scale(.38)).add(new V3(0, -.5, 0)).normalize(), wd = V3.Cross(dir, d).normalize().scale(.034 / Math.sqrt(K())); const end = p.add(dir.scale(ll)); end.y -= ll * ll * .12;
        mb.grid(LOD ? 3 : 5, 1, (u, v) => { const q = u * u * .12 * ll; return [p.x + dir.x * ll * u + wd.x * (v * 2 - 1) * (1 - .55 * u), p.y + dir.y * ll * u - q + wd.y * (v * 2 - 1), p.z + dir.z * ll * u + wd.z * (v * 2 - 1) * (1 - .55 * u)]; }, u => shade(mixA(rgb('#2b6528'), rgb('#7cae48'), u * .8 + .1), .9 + .2 * (k % 3) / 3), null, u => .1 + .9 * u); }
    }
  }
  for (let i = 0; i < 7; i++) { const a = i * 2.4, g = r() < .5 ? '#6f8a2c' : '#a8782c'; mb.ellipsoid(top.x + Math.cos(a) * .22, top.y - .35 - (i % 2) * .15, top.z + Math.sin(a) * .22, .13, .17, .13, 8, 6, (u, v) => shade(rgb(g), .8 + .3 * v)); }
  return { mb, top: top.y, lean };
}
function bananaPlant(seed) {
  const r = rng(seed), mb = new MB(), H = Rr(2.2, 3.2, r), st = [];
  for (let k = 0; k <= 8; k++) { const t = k / 8; st.push(new V3(.12 * Math.sin(t * 2 + seed) * t, H * t, .1 * Math.cos(t * 2) * t)); }
  mb.tube(st, t => .14 * (1 - t * .45), 10, (t, a) => mixA(rgb('#a9bd62'), rgb('#7d9a3f'), .5 + .5 * Math.sin(a * 6.283 * 3 + t * 4)));
  const top = st[st.length - 1];
  for (let i = 0, NLb = Math.max(6, Math.round(11 * K())); i < NLb; i++) {
    const yaw = i * 2.4 + Rr(-.2, .2, r), el = Rr(.25, 1.2, r), Lb = Rr(2.3, 3.1, r), W = Rr(.75, .95, r), base = top.add(new V3(0, -Rr(0, .45, r), 0));
    const dirH = new V3(Math.sin(yaw), 0, Math.cos(yaw)), side = new V3(Math.cos(yaw), 0, -Math.sin(yaw));
    const ax = (u) => base.add(dirH.scale(u * Lb * Math.cos(el) * (1 + .1 * u))).add(new V3(0, Lb * (Math.sin(el) * u - .55 * u * u * (1 + el * .4)) + .15, 0));
    mb.grid(LOD ? 8 : 20, LOD ? 4 : 12, (u, v) => { const s = v * 2 - 1, prof = Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, .75))), .55) * (u < .06 ? .15 : 1), p = ax(u); const tear = 1 + .05 * Math.sin(u * 70 + s * 5) * Math.abs(s);
      return [p.x + side.x * s * W * .5 * prof * tear, p.y - .25 * s * s * prof * W * .5 - Math.abs(s) * .02, p.z + side.z * s * W * .5 * prof * tear]; },
      (u, v) => { const s = Math.abs(v * 2 - 1); if (s < .05) return rgb('#b7d46c'); return shade(mixA(rgb('#2f7a2c'), rgb('#6cb43e'), u * .6 + s * .35), 1 - .08 * Math.abs(Math.sin(v * 40))); }, null, (u, v) => .08 + .92 * u);
  }
  const sp = [top.add(new V3(0, 0, 0)), top.add(new V3(.05, -.25, .05)), top.add(new V3(.1, -.7, .12)), top.add(new V3(.16, -1.0, .15))];
  mb.tube(sp, [.02, .03], 6, () => rgb('#6a5a30'));
  for (let row = 0; row < 5; row++) for (let f = 0; f < 6; f++) { const a = f / 6 * 6.28 + row, p = sp[1].add(new V3(0, -row * .1, 0)).add(new V3(Math.cos(a) * .06, 0, Math.sin(a) * .06)).add(new V3(.05, 0, .06)); const fpts = [p, p.add(new V3(Math.cos(a) * .04, -.07, Math.sin(a) * .04)), p.add(new V3(Math.cos(a) * .06, -.15, Math.sin(a) * .06)), p.add(new V3(Math.cos(a) * .045, -.22, Math.sin(a) * .045))]; mb.tube(fpts, [.017, .009], 5, t => mixA(rgb('#a8c640'), rgb('#6a7a2a'), t)); }
  return mb;
}

G.geo = { branch, addLeaves, dirOn, AX, sampaguitaFlower, gumamelaFlower, santanHead, damaFlower, gumamela, sampaguita, kalachuchi, santan, dama, bougainvillea, wildflower, grassBlade, ilangIlang, coconutPalm, bananaPlant, bougainBract, kalachuchiFlower, BOUGAIN, leaf, petal, pm, sideDir, ptAt, tanAt, wood };
})();
