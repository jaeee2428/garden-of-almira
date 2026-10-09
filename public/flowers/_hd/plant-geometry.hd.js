/* =====================================================================
   flora/plant-geometry.js - the plant-building toolkit (leaf, petal, branch, tube helpers) + the plain
   plants (meadow flowers, grass, coconut palm, banana). Each HERO flower's model lives in its own folder:
   public/flowers/<id>/model.js (loaded right after this file by boot.js)
   Each plant is real geometry: curved petals with ruffles and veins,
   folded leaves with midribs, tapered woody stems, ringed palm trunks.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G;
const UP = V3.Up(), ORG = V3.Zero();
const Rr = (a, b, r) => a + (b - a) * r();
let LOD = 0; const K = () => LOD === 0 ? 1 : LOD === 1 ? .78 : .58; G.setLOD = v => { LOD = v; G.LODV = v; };

/* ---------- primitives ---------- */
// leaves and petals mark their UVs (x + 2, rows of the detail texture) so the shared vein texture applies only to them
function tagUV(mb, from, row) { const uv = mb.uv; for (let i = from; i < uv.length; i += 2) { uv[i] = 2 + uv[i] / (mb.su || 1); uv[i + 1] = row + .46 * (uv[i + 1] / (mb.sv || 1)); } }
// a leaf lies along +z, blade facing +y. fold = V-shaped midrib, curl = tip lift (negative = droop)
function leaf(mb, L, W, M, c0, c1, o = {}) {
  const uv0 = mb.uv.length;
  const nu0 = LOD ? Math.max(2, Math.round((o.nu || 6) * (LOD === 1 ? .6 : .4))) : Math.round((o.nu || 6) * 1.5), nv0 = LOD ? Math.min(o.nv || 4, 2) : Math.max(4, (o.nv || 4) + 2), nu = Math.max(2, Math.min(nu0, Math.round(L * 80) + 1)), nv = Math.max(1, Math.min(nv0, Math.round(W * 140) + 1)), fold = o.fold ?? .25, curl = o.curl ?? .12, base = o.base ?? .75, sharp = o.sharp ?? .8, ser = o.ser || 0, rib = o.rib || shade(c1, 1.3);
  mb.grid(nu, nv, (u, v) => {
    const s = v * 2 - 1, prof = Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, base))), sharp), wob = 1 + ser * Math.sin(u * 44);
    return [s * W * .5 * prof * wob, fold * Math.abs(s) * prof * W * .5 + curl * u * u * L, u * L];
  }, (u, v) => { const s = Math.abs(v * 2 - 1); if (s < .06 && u > .03 && u < .95) return rib; return shade(mixA(c0, c1, u), (1 - .18 * s) * (1 + .07 * Math.sin(u * 30 + s * 6))); }, M, (u, v) => .12 + .88 * u);
  tagUV(mb, uv0, .02);                                                     // leaf surface detail (veins) - see engine/wind.js
}
// a petal lies along +z, concave side toward +y. cols = [throat, body, edge]
function petal(mb, L, W, M, cols, o = {}) {
  const uv0 = mb.uv.length;
  if (LOD === 2) { L *= 1.25; W *= 1.3; }
  const nu0 = LOD ? Math.max(2, Math.round((o.nu || 7) * (LOD === 1 ? .6 : .35))) : Math.round((o.nu || 7) * 1.35), nv0 = LOD ? Math.max(2, Math.round((o.nv || 6) * (LOD === 1 ? .6 : .35))) : Math.round((o.nv || 6) * 1.35), nu = Math.max(2, Math.min(nu0, Math.round(L * 170) + 1)), nv = Math.max(2, Math.min(nv0, Math.round(W * 210) + 1)), cup = o.cup ?? .5, curl = o.curl ?? .2, ruf = o.ruf || 0, tw = o.tw || 0, pw = o.pw ?? .7, sh = o.sh ?? .55, th = o.throat ?? .25, tipN = o.notch || 0;
  mb.grid(nu, nv, (u, v) => {
    const s = v * 2 - 1, prof = Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, pw))), sh) * (1 - tipN * Math.exp(-s * s * 30) * u * u);
    let x = s * W * .5 * prof, y = cup * s * s * prof * W * .45 + curl * u * u * L + ruf * Math.sin(u * 15 + s * 3.2) * u * W * .14 * Math.abs(s);
    const z = u * L * (1 - .05 * s * s); if (tw) { const a = tw * u, c = Math.cos(a), sn = Math.sin(a), x2 = x * c - y * sn; y = x * sn + y * c; x = x2; }
    return [x, y, z];
  }, (u, v) => { const s = Math.abs(v * 2 - 1); let c = u < th ? mixA(cols[0], cols[1], u / th) : mixA(cols[1], cols[2], clamp((u - th) / (1 - th), 0, 1) * .85 + s * .15); return shade(c, 1 - .05 * Math.abs(Math.sin(v * 21 + u * 2)) * (o.veins ?? 1)); }, M, (u, v) => .1 + .55 * u);
  tagUV(mb, uv0, .52);                                                     // petal veins
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
function addLeaves(mb, pts, count, L, W, c0, c1, o, r, pitchK = .9) {
  count = Math.max(3, Math.round(count * K())); if (LOD === 2) { L *= 1.4; W *= 1.7; } else if (LOD === 1) { L *= 1.08; W *= 1.18; }
  for (let i = 0; i < count; i++) {
    const t = .18 + .82 * (i + .5) / count, p = ptAt(pts, t), d = tanAt(pts, t), dir = d.scale(.45).add(sideDir(d, i * 2.4 + Rr(-.4, .4, r)).scale(pitchK)).normalize();
    const s = Rr(.8, 1.2, r); leaf(mb, L * s, W * s, pm(dir, UP, p, Rr(-.3, .3, r)), c0, c1, o);
  }
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
  // the coconut bunch: nuts hang on short stalks just below the frond bases, spaced so they never cut into the trunk
  // or into each other; vertex alpha 0 = no leaf flutter (a heavy nut only moves with the crown)
  const TR = .2, CR = .13, nuts = [];                                    // trunk radius at the crown, coconut radius
  for (let i = 0; nuts.length < 7 && i < 60; i++) {
    const a = i * 2.39996 + r() * .3, ring = TR + CR + .015 + (i % 3 === 2 ? .06 : 0), y = top.y - .3 - (i % 2) * .2 - r() * .06;
    const c = new V3(top.x + Math.cos(a) * ring, y, top.z + Math.sin(a) * ring);
    if (nuts.every(q => V3.Distance(q, c) > CR * 2.05)) nuts.push(c);
  }
  nuts.forEach(c => { const g = r() < .5 ? '#6f8a2c' : '#a8782c', still = (u, v) => { const k = shade(rgb(g), .8 + .3 * v); return [k[0], k[1], k[2], 0]; };
    const out = new V3(c.x - top.x, 0, c.z - top.z).normalize();
    mb.tube([new V3(top.x + out.x * (TR - .02), top.y - .12, top.z + out.z * (TR - .02)), new V3(c.x - out.x * .04, c.y + CR * .9, c.z - out.z * .04)], [.02, .014], 4, () => [...rgb('#7a6a3a'), 0]);   // stalk
    mb.ellipsoid(c.x, c.y, c.z, CR, CR * 1.25, CR, 8, 6, still); });
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

/* ---------- a natural shrub (used by the hero flowers) ----------
   Main stems rise from one crown and curve (they lean out, then turn up toward the light or arch over with weight);
   each carries side branches, which carry twigs (branch orders). Leaves sit at nodes in the plant's real arrangement
   (opp = opposite pairs turning 90 deg per node, alt = alternate spiral, whorl3 = threes) on short leaf stalks, smaller
   toward the growing tips. Flowers come from callbacks: tip(mb, p, dir, r, ord) at branch ends, axil(mb, dir, p, r, ord, t) in leaf axils.
   o = { stems, H, lean, up, droop, wig, r0, bark:[c0,c1], orders, side:[per order], sub, ang,
         leaf:{ L, W, c0, c1, o, phyllo, nodes (per metre), from, pitch, droop, pet }, tip, tipP, axil, axilP, axilFrom } */
function shrub(o, r, mb = new MB()) {
  const LV = G.LODV, k = LV === 2 ? .22 : LV === 1 ? .5 : 1, lm = LV === 2 ? 1.9 : LV === 1 ? 1.35 : 1, fk = LV === 2 ? .4 : LV === 1 ? .7 : 1, bark = wood(o.bark[0], o.bark[1]), Lf = o.leaf, orders = Math.max(1, (o.orders || 2) - (LV === 2 ? 1 : 0));
  const grow = (p0, dir, len, rad, ord) => {
    const n = ord ? 6 : 8, pts = []; let d = dir.clone(), p = p0.clone();
    for (let i = 0; i < n; i++) { pts.push(p.clone()); const t = i / (n - 1);
      d = d.add(new V3((r() - .5) * (o.wig ?? .18), (o.up ?? .1) - (o.droop || 0) * t * (1 + ord * .5), (r() - .5) * (o.wig ?? .18))).normalize(); p = p.add(d.scale(len / (n - 1))); }
    mb.tube(pts, t => Math.max(rad * (1 - .72 * t), .0018), LV ? 4 : ord ? 5 : 7, bark);
    // leaves at the nodes
    const nodes = Math.max(2, Math.round(len * Lf.nodes * k)), from = Lf.from ?? .25; let phi = r() * 6.283;
    for (let j = 0; j < nodes; j++) { const t = from + (1 - from) * (j + .5) / nodes, pt = ptAt(pts, t), tg = tanAt(pts, t);
      const angs = Lf.phyllo === 'opp' ? [phi, phi + Math.PI] : Lf.phyllo === 'whorl3' ? [phi, phi + 2.094, phi + 4.189] : [phi];
      phi += Lf.phyllo === 'opp' ? Math.PI / 2 : Lf.phyllo === 'whorl3' ? 1.047 : 2.4;
      for (const a of angs) { const sd = sideDir(tg, a), pitch = (Lf.pitch ?? 1.0) + Rr(-.15, .15, r);
        const ld = tg.scale(Math.cos(pitch)).add(sd.scale(Math.sin(pitch))); ld.y -= (Lf.droop ?? .2) * (.6 + .4 * t); ld.normalize();
        const s = (.62 + .45 * Math.min(1, (1 - t) * 1.6 + .25)) * Rr(.85, 1.12, r) * lm, pet = (Lf.pet ?? .015) * s;
        let base = pt; if (pet > .003 && !LV) { base = pt.add(ld.scale(pet)); mb.tube([pt, base], [.0022, .0016], 3, () => Lf.c0); }
        if (Lf.fn) Lf.fn(mb, pm(ld, UP, base, Rr(-.25, .25, r), s), r, t); else leaf(mb, Lf.L * s, Lf.W * s, pm(ld, UP, base, Rr(-.25, .25, r)), Lf.c0, Lf.c1, Lf.o || {});   // fn: compound leaves etc.
        if (o.axil && t > (o.axilFrom ?? .5) && r() < (o.axilP ?? 0) * fk) { const ad = tg.scale(.5).add(sd.scale(.85)).normalize(); o.axil(mb, ad, pt, r, ord, t); } } }
    // side branches, then the tip
    if (ord < orders - 0) { const ns = Math.max(0, Math.round(((o.side || [])[ord] || 0) * (LV === 2 ? .6 : LV === 1 ? .85 : 1))); for (let b = 0; b < ns; b++) { const t = .3 + .55 * (b + .5) / ns + Rr(-.04, .04, r), pt = ptAt(pts, t), tg = tanAt(pts, t);
        const sd = sideDir(tg, phi + b * 2.4 + Rr(-.4, .4, r)), bd = tg.scale(Math.cos(o.ang ?? .7)).add(sd.scale(Math.sin(o.ang ?? .7))).normalize();
        grow(pt, bd, len * (o.sub ?? .55) * (1 - .45 * t) * Rr(.8, 1.15, r), rad * (1 - .72 * t) * .75, ord + 1); } }
    if (o.tip && r() < (o.tipP ?? 1)) o.tip(mb, pts[n - 1], tanAt(pts, .999), r, ord);
  };
  for (let s = 0; s < o.stems; s++) { const yaw = s / o.stems * 6.283 + Rr(-.35, .35, r), lean = (o.lean ?? .4) * Rr(.45, 1.15, r);
    const br_ = Rr(.2, 1, r) * (o.base ?? o.H * .07); grow(new V3(Math.sin(yaw) * br_, 0, Math.cos(yaw) * br_),   // stems rise from a crown, not one point
     new V3(Math.sin(yaw) * Math.sin(lean), Math.cos(lean), Math.cos(yaw) * Math.sin(lean)), o.H * Rr(.72, 1.05, r), o.r0 ?? .012, 0); }
  return mb;
}

G.geo = { shrub, branch, addLeaves, dirOn, AX, wildflower, grassBlade, coconutPalm, bananaPlant, leaf, petal, pm, sideDir, ptAt, tanAt, wood, K };   // the hero flowers add themselves from public/flowers/<id>/model.js
})();
