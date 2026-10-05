/* =====================================================================
   structures.js - the made things of a Cebuano homestead
   Visayan ancestral house (coral-stone silong, plank upper floor, capiz
   windows, clay-tile roof) · bamboo arch · kadena de amor pergola ·
   roadside shrine with candles · bangka · fiesta banderitas · puso
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng, scene, hFn } = G;
const Rr = (a, b, r) => a + (b - a) * r();
G.hot = [];            // click-able special things  {pos:V3, r, kind, name, ...}
G.obstacles = [];      // things you bump into when walking {x,z,r}  or  {box:true,x,z,hw,hd,yaw}
G.L = { house: { x: 19, z: 4, yaw: Math.PI / 2 }, tree: { x: 0, z: 7.5 }, shrine: { x: -12, z: -8.5 }, arch: { x: -33.5 }, ring: { x: 13, z: -17 }, kubo: { x: -24.5, z: -27, yaw: .7 }, well: { x: 15.5, z: 15 }, hammock: { x: -33, z1: 12, z2: 7.6 },
  mango: [[28, -18], [-38, -30], [31, 27], [-4, 37], [8, -31]], bamboo: [[38, -12], [36, 24], [-8, 34], [-40, -22]] };
G.L.keepOut = [{ x: G.POND.x, z: G.POND.z, r: G.POND.r + 3.2 }, { x: G.L.kubo.x, z: G.L.kubo.z, r: 5 }, { x: G.L.well.x, z: G.L.well.z, r: 2.6 }, { x: -33, z: 9.8, r: 5 },
  ...G.L.mango.map(([x, z]) => ({ x, z, r: 4.6 })), ...G.L.bamboo.map(([x, z]) => ({ x, z, r: 3.6 }))];

/* ---------- procedural textures with real relief (normal maps) ---------- */
function canvasTex(name, size, draw) { const t = new B.DynamicTexture(name, { width: size, height: size }, scene, true); draw(t.getContext(), size); t.update(); t.wrapU = t.wrapV = B.Texture.WRAP_ADDRESSMODE; return t; }
function normalTex(name, size, drawH, strength) {
  const c = document.createElement('canvas'); c.width = c.height = size; const cx = c.getContext('2d'); drawH(cx, size); const d = cx.getImageData(0, 0, size, size).data;
  const Hh = (x, y) => d[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255;
  return canvasTex(name, size, ctx => { const o = ctx.createImageData(size, size); for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { let dx = (Hh(x + 1, y) - Hh(x - 1, y)) * strength, dy = (Hh(x, y + 1) - Hh(x, y - 1)) * strength; const l = Math.hypot(dx, dy, 1), i = (y * size + x) * 4; o.data[i] = (-dx / l * .5 + .5) * 255; o.data[i + 1] = (dy / l * .5 + .5) * 255; o.data[i + 2] = (1 / l * .5 + .5) * 255; o.data[i + 3] = 255; } ctx.putImageData(o, 0, 0); });
}
const noiseSpeckle = (ctx, size, n, a, r) => { for (let i = 0; i < n; i++) { const g = Math.floor(r() * 255); ctx.fillStyle = `rgba(${g},${g},${g},${a * r()})`; ctx.fillRect(r() * size, r() * size, 1 + r() * 2, 1 + r() * 2); } };

// coral-stone blocks: 8 rows per tile (a row is ~30 cm), staggered, with deep mortar
const stoneBlocks = (() => { const r = rng(77), rows = []; for (let y = 0; y < 8; y++) { const row = []; let x = -r() * 120; while (x < 512) { const w = 90 + r() * 90; row.push({ x, w, tone: r() }); x += w; } rows.push(row); } return rows; })();
function drawStone(ctx, size, height) {
  const r = rng(78), rh = size / 8, pal = ['#d9cfb4', '#cfc4a6', '#e2d9bf', '#c4b898', '#d3c8a8'];
  ctx.fillStyle = height ? '#000' : '#8e8570'; ctx.fillRect(0, 0, size, size);
  stoneBlocks.forEach((row, y) => row.forEach(b => {
    const m = 4, x0 = b.x + m, w = b.w - 2 * m, y0 = y * rh + m, h = rh - 2 * m;
    if (height) { const g = ctx.createLinearGradient(0, y0, 0, y0 + h); const k = 150 + b.tone * 70; g.addColorStop(0, `rgb(${k},${k},${k})`); g.addColorStop(1, `rgb(${k - 40},${k - 40},${k - 40})`); ctx.fillStyle = g; } else { const g = ctx.createLinearGradient(0, y0, 0, y0 + h); const c = pal[Math.floor(b.tone * pal.length) % pal.length]; g.addColorStop(0, c); g.addColorStop(1, '#b3a78a'); ctx.fillStyle = g; }
    ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 7); ctx.fill();
    if (x0 + w > size) { ctx.beginPath(); ctx.roundRect(x0 - size, y0, w, h, 7); ctx.fill(); } if (x0 < 0) { ctx.beginPath(); ctx.roundRect(x0 + size, y0, w, h, 7); ctx.fill(); }
  }));
  noiseSpeckle(ctx, size, height ? 2500 : 4500, height ? .25 : .22, r);
  if (!height) { for (let i = 0; i < 26; i++) { ctx.fillStyle = `rgba(70,95,45,${.05 + r() * .12})`; ctx.beginPath(); ctx.ellipse(r() * size, r() * size, 10 + r() * 30, 6 + r() * 14, 0, 0, 6.3); ctx.fill(); } }
}
// vertical hardwood planks (tanguile-ish), 10 per tile
function drawPlanks(ctx, size, height) {
  const r = rng(91), n = 10, pw = size / n, tones = ['#a8754a', '#b88356', '#9c6a40', '#b07a4c', '#a06e46', '#be8a5c'];
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < n; i++) {
    const x0 = i * pw + 2, w = pw - 4;
    if (height) { const k = 150 + r() * 50; ctx.fillStyle = `rgb(${k},${k},${k})`; } else { const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); const c = tones[Math.floor(r() * tones.length)]; g.addColorStop(0, shade255(c, .9)); g.addColorStop(.5, c); g.addColorStop(1, shade255(c, .86)); ctx.fillStyle = g; }
    ctx.fillRect(x0, 0, w, size);
    for (let k = 0; k < 40; k++) { const gx = x0 + r() * w; ctx.strokeStyle = height ? `rgba(0,0,0,${.05 + r() * .12})` : `rgba(50,28,12,${.08 + r() * .22})`; ctx.lineWidth = .5 + r() * 1.3; ctx.beginPath(); ctx.moveTo(gx, 0); ctx.bezierCurveTo(gx + r() * 6 - 3, size * .3, gx + r() * 6 - 3, size * .7, gx + r() * 4 - 2, size); ctx.stroke(); }
    if (r() < .5) { const kx = x0 + w * (.25 + r() * .5), ky = r() * size; ctx.fillStyle = height ? 'rgba(0,0,0,.5)' : 'rgba(60,32,14,.55)'; ctx.beginPath(); ctx.ellipse(kx, ky, 5 + r() * 5, 8 + r() * 10, 0, 0, 6.3); ctx.fill(); }
    ctx.fillStyle = height ? '#000' : 'rgba(40,24,12,.7)'; for (let y = 40; y < size; y += 150) { ctx.beginPath(); ctx.arc(x0 + 6, y + (i % 3) * 20, 2, 0, 6.3); ctx.arc(x0 + w - 6, y + (i % 3) * 20, 2, 0, 6.3); ctx.fill(); }
  }
}
function shade255(hexc, k) { const c = C3.FromHexString(hexc); return `rgb(${Math.round(c.r * 255 * k)},${Math.round(c.g * 255 * k)},${Math.round(c.b * 255 * k)})`; }
// clay roof tiles: curved 'canal' tiles in columns, overlapping rows
function drawRoof(ctx, size, height) {
  const r = rng(63), cols = 16, cw = size / cols, rows = 6, rh = size / rows;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size);
  for (let c = 0; c < cols; c++) for (let y = 0; y < rows; y++) {
    const x0 = c * cw, y0 = y * rh + (c % 2 ? rh * .35 : 0), t = r(), over = c % 2;
    const g = ctx.createLinearGradient(x0, 0, x0 + cw, 0);
    if (height) { g.addColorStop(0, over ? '#202020' : '#e0e0e0'); g.addColorStop(.5, over ? '#f0f0f0' : '#303030'); g.addColorStop(1, over ? '#202020' : '#e0e0e0'); }
    else { const base = ['#b5532e', '#a84a28', '#c2603a', '#9d4224'][Math.floor(t * 4)]; g.addColorStop(0, shade255(base, over ? .72 : 1.08)); g.addColorStop(.5, shade255(base, over ? 1.1 : .78)); g.addColorStop(1, shade255(base, over ? .72 : 1.08)); }
    ctx.fillStyle = g; ctx.fillRect(x0 + 1, y0, cw - 2, rh);
    const sg = ctx.createLinearGradient(0, y0 + rh - 14, 0, y0 + rh); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, height ? 'rgba(0,0,0,.7)' : 'rgba(30,10,5,.55)'); ctx.fillStyle = sg; ctx.fillRect(x0 + 1, y0 + rh - 14, cw - 2, 14);
  }
  noiseSpeckle(ctx, size, 3000, height ? .2 : .25, r);
  if (!height) for (let i = 0; i < 34; i++) { ctx.fillStyle = `rgba(80,110,50,${.08 + r() * .2})`; ctx.beginPath(); ctx.ellipse(r() * size, r() * size, 6 + r() * 26, 4 + r() * 12, 0, 0, 6.3); ctx.fill(); }
}
function texMat(name, drawFn, strength, o = {}) {
  const m = G.mat(name, { specular: new C3(.08, .07, .06), power: 20 }); m.diffuseTexture = canvasTex(name + 'D', 512, (c, s) => drawFn(c, s, false)); m.bumpTexture = normalTex(name + 'N', 512, (c, s) => drawFn(c, s, true), strength); m.bumpTexture.level = o.level || 1.2; m.invertNormalMapY = !!o.flipY; m.diffuseTexture.anisotropicFilteringLevel = 8; m.bumpTexture.anisotropicFilteringLevel = 8; return m;
}
G.canvasTex = canvasTex; G.normalTex = normalTex;
const stoneMat = texMat('stone', drawStone, 5, { level: 1.4 }), plankMat = texMat('plank', drawPlanks, 3, { level: 1.0 }), roofMat = texMat('roofTile', drawRoof, 5, { level: 1.5 });
G.texMats = { stoneMat, plankMat, roofMat };

/* ---------- helpers ---------- */
function panel(mb, o, du, dv, w, h, nu, nv, cfn, disp) {                    // flat/relief panel from origin o, spanned by unit vectors du, dv
  const nrm = V3.Cross(du, dv).normalize();
  mb.grid(nu, nv, (u, v) => { const d = disp ? disp(u * w, v * h) : 0; return [o.x + du.x * u * w + dv.x * v * h + nrm.x * d, o.y + du.y * u * w + dv.y * v * h + nrm.y * d, o.z + du.z * u * w + dv.z * v * h + nrm.z * d]; }, cfn || (() => [1, 1, 1]));
}
function box(mb, x0, y0, z0, x1, y1, z1, c, n = 1) {                        // axis-aligned box
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, f = () => c;
  const P = (a, b, c2, du, dv, w, h) => panel(mb, new V3(a, b, c2), du, dv, w, h, n, n, f);
  const X = new V3(1, 0, 0), Y = new V3(0, 1, 0), Z = new V3(0, 0, 1);
  P(x0, y0, z0, X, Y, x1 - x0, y1 - y0); P(x0, y0, z1, X, Y, x1 - x0, y1 - y0); P(x0, y0, z0, Z, Y, z1 - z0, y1 - y0); P(x1, y0, z0, Z, Y, z1 - z0, y1 - y0); P(x0, y0, z0, X, Z, x1 - x0, z1 - z0); P(x0, y1, z0, X, Z, x1 - x0, z1 - z0);
}
const bambooCol = (t, a) => mixA(rgb('#c4b055'), rgb('#9a8a3c'), .5 + .5 * Math.sin(t * 40 + a * 3));
function bamboo(mb, a, b, r, seg = 10) {                                    // bamboo pole with swollen nodes
  const pts = [], len = V3.Distance(a, b), nodes = Math.max(2, Math.round(len / .32));
  for (let k = 0; k <= nodes * 3; k++) pts.push(V3.Lerp(a, b, k / (nodes * 3)));
  mb.tube(pts, t => { const f = (t * nodes) % 1; return r * (1 + .22 * Math.exp(-Math.pow((f < .5 ? f : 1 - f) * 14, 2) * .5)); }, 7, (t, an) => { const f = (t * nodes) % 1; const dark = (f < .04 || f > .96) ? .62 : 1; return shade(mixA(rgb('#c9b55a'), rgb('#a0903f'), .5 + .5 * Math.sin(t * 11 + an * 4)), dark); });
}
const woodC = (k = 1) => shade(rgb('#6b4a30'), k);

/* ---------- the stone path from the beach to the house ---------- */
const pathCtrl = [[-41, -1.2], [-33.5, 0], [-25, 2.2], [-17, -.6], [-9, -3.4], [-1, -.3], [6.5, 3.6], [11.3, 6.2]].map(([x, z]) => new V3(x, 0, z));
const pathPts = B.Curve3.CreateCatmullRomSpline(pathCtrl, 40, false).getPoints();
G.path = { pts: pathPts, dist(x, z) { let d = 1e9; for (let i = 0; i < pathPts.length; i += 2) d = Math.min(d, Math.hypot(x - pathPts[i].x, z - pathPts[i].z)); return d; }, at(u) { const f = clamp(u, 0, .9999) * (pathPts.length - 1), i = Math.floor(f); return V3.Lerp(pathPts[i], pathPts[i + 1], f - i); } };
(function stonePath() {
  const mb = new MB(), r = rng(12), step = 1.0; let acc = 0;
  for (let i = 1; i < pathPts.length; i++) {
    const a = pathPts[i - 1], b = pathPts[i]; acc += V3.Distance(a, b); if (acc < step) continue; acc = 0;
    const T = b.subtract(a).normalize(), cx = b.x + Rr(-.3, .3, r) - T.z * Rr(-.3, .3, r), cz = b.z + Rr(-.3, .3, r) + T.x * Rr(-.3, .3, r), n = 8, rad = Rr(.4, .62, r), rot = r() * 6.3, tone = r(), col = mixA(rgb('#d2c6a4'), rgb('#aea286'), tone), sq = Rr(.7, 1, r);
    const ring = []; for (let k = 0; k < n; k++) { const an = rot + k / n * 6.283, rr = rad * Rr(.82, 1.08, r); ring.push([cx + Math.cos(an) * rr, cz + Math.sin(an) * rr * sq]); }
    const base = mb.n; for (const [x, z] of ring) { const y = hFn(x, z); mb.p.push(x, y + .045, z); mb.c.push(...shade(col, 1.05), 1); mb.p.push(x, y - .04, z); mb.c.push(...shade(col, .6), 1); }
    mb.p.push(cx, hFn(cx, cz) + .06, cz); mb.c.push(...shade(col, 1.1), 1); const ctr = mb.n - 1;
    for (let k = 0; k < n; k++) { const a1 = base + k * 2, b1 = base + ((k + 1) % n) * 2; mb.i.push(a1, b1, ctr, a1, a1 + 1, b1, b1, a1 + 1, b1 + 1); }
  }
  const m = mb.build('stepping'); m.receiveShadows = true; G.stepping = m;
})();

/* ---------- the Visayan ancestral house ---------- */
G.houseRoot = new B.TransformNode('house', scene);
(function house() {
  const H = G.L.house, root = G.houseRoot;
  let hy = 1e9; for (const [dx, dz] of [[-5, -5], [5, -5], [-5, 5], [5, 5], [0, 0]]) { const c = Math.cos(H.yaw), s = Math.sin(H.yaw); hy = Math.min(hy, hFn(H.x + dx * c + dz * s, H.z - dx * s + dz * c)); }
  root.position.set(H.x, hy, H.z); root.rotation.y = H.yaw; G.houseY = hy;
  const X = new V3(1, 0, 0), Y = new V3(0, 1, 0), Z = new V3(0, 0, 1), nX = X.scale(-1), nZ = Z.scale(-1);
  const W = 9.4, D = 7, hw = W / 2, hd = D / 2, F1 = 2.7, F2 = 5.5;
  const add = (mb, mat, name, cast = true) => { const m = mb.build(name, mat); m.parent = root; m.receiveShadows = true; if (cast) G.cast(m); m.freezeWorldMatrix(); m.doNotSyncBoundingInfo = true; return m; };

  // ground floor: coral stone (the "silong")
  const st = new MB(); st.scaleUV(W / 2.6, (F1 + 1.2) / 2.6);
  panel(st, new V3(-hw, -1.2, -hd), X, Y, W, F1 + 1.2, 1, 1); st.scaleUV(W / 2.6, (F1 + 1.2) / 2.6); panel(st, new V3(hw, -1.2, hd), nX, Y, W, F1 + 1.2, 1, 1);
  st.scaleUV(D / 2.6, (F1 + 1.2) / 2.6); panel(st, new V3(-hw, -1.2, hd), nZ, Y, D, F1 + 1.2, 1, 1); panel(st, new V3(hw, -1.2, -hd), Z, Y, D, F1 + 1.2, 1, 1);
  add(st, stoneMat, 'stoneWalls');
  const dark = new MB();                                                       // arched openings in the stone
  [-2.9, 0, 2.9].forEach(cx => { const y0 = 0, w = 1.1, h = 1.3, zz = -hd - .012; panel(dark, new V3(cx - w / 2, y0, zz), X, Y, w, h, 1, 1, () => [.08, .06, .05]); dark.grid(10, 1, (u, v) => { const a = Math.PI * u; return [cx + Math.cos(a) * w / 2 * (1 - v * .0), h + Math.sin(a) * w / 2 * (v ? 1 : 0), zz]; }, () => [.08, .06, .05]); });
  [-2.9, 0, 2.9].forEach(cx => { const w = 1.1, h = 1.3, zz = -hd - .02, arch = []; for (let k = 0; k <= 14; k++) { const a = Math.PI * k / 14; arch.push(new V3(cx + Math.cos(a) * (w / 2 + .09), h + Math.sin(a) * (w / 2 + .09), zz)); } dark.tube(arch, .045, 5, () => rgb('#e0d6bc')); dark.tube([new V3(cx - w / 2 - .09, 0, zz), new V3(cx - w / 2 - .09, h, zz)], .045, 5, () => rgb('#e0d6bc')); dark.tube([new V3(cx + w / 2 + .09, 0, zz), new V3(cx + w / 2 + .09, h, zz)], .045, 5, () => rgb('#e0d6bc')); });
  add(dark, G.vc, 'arches', false);

  // upper floor: plank walls
  const pl = new MB();
  pl.scaleUV(W / 1.8, (F2 - F1) / 1.8); panel(pl, new V3(-hw, F1, -hd), X, Y, W, F2 - F1, 1, 1); panel(pl, new V3(hw, F1, hd), nX, Y, W, F2 - F1, 1, 1);
  pl.scaleUV(D / 1.8, (F2 - F1) / 1.8); panel(pl, new V3(-hw, F1, hd), nZ, Y, D, F2 - F1, 1, 1); panel(pl, new V3(hw, F1, -hd), Z, Y, D, F2 - F1, 1, 1);
  add(pl, plankMat, 'plankWalls');

  // timber trim, sills, posts and the double door
  const tr = new MB(), tc = woodC(1), tcd = woodC(.7);
  box(tr, -hw - .06, F1 - .12, -hd - .06, hw + .06, F1 + .1, hd + .06, tcd); box(tr, -hw - .05, F2 - .14, -hd - .05, hw + .05, F2, hd + .05, tcd);
  [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].forEach(([x, z]) => box(tr, x - .09, F1, z - .09, x + .09, F2, z + .09, tc));
  box(tr, -.78, F1 + .1, -hd - .05, .78, F1 + 2.3, -hd + .02, woodC(.55));
  box(tr, -.8, F1 + 2.3, -hd - .08, .8, F1 + 2.42, -hd + .04, tcd); box(tr, -.8, F1 + .1, -hd - .08, -.74, F1 + 2.4, -hd + .04, tcd); box(tr, .74, F1 + .1, -hd - .08, .8, F1 + 2.4, -hd + .04, tcd); box(tr, -.03, F1 + .1, -hd - .07, .03, F1 + 2.3, -hd, tcd);
  for (const sx of [-.4, .4]) for (const sy of [.6, 1.5]) box(tr, sx - .27, F1 + sy, -hd - .075, sx + .27, F1 + sy + .5, -hd - .06, woodC(.85));
  const wins = [-3.75, -1.9, 1.9, 3.75], cap = new MB(), WN = [];
  wins.forEach(cx => {
    const w = 1.45, y0 = F1 + .78, h = 1.55, zz = -hd - .06;
    box(tr, cx - w / 2 - .06, y0 - .07, zz - .03, cx + w / 2 + .06, y0 + .02, zz + .06, tcd); box(tr, cx - w / 2 - .06, y0 + h, zz - .03, cx + w / 2 + .06, y0 + h + .08, zz + .06, tcd);
    box(tr, cx - w / 2 - .06, y0, zz - .02, cx - w / 2 + .01, y0 + h, zz + .05, tc); box(tr, cx + w / 2 - .01, y0, zz - .02, cx + w / 2 + .06, y0 + h, zz + .05, tc); box(tr, cx - w / 2, y0 + h * .62, zz - .015, cx + w / 2, y0 + h * .62 + .035, zz + .04, tc);
    box(tr, cx - w / 2 - .06, y0 - .58, zz - .02, cx + w / 2 + .06, y0 - .08, zz + .05, woodC(.9));                 // the solid panel below the capiz
    const nc = 5, nr = 6; for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) { const pw = w / nc, ph = h / nr, g = .018, k = .85 + .15 * Math.sin(i * 3 + j * 5 + cx); panel(cap, new V3(cx - w / 2 + i * pw + g, y0 + j * ph + g, zz - .01), X, Y, pw - 2 * g, ph - 2 * g, 1, 1, () => shade(rgb('#f1e4c2'), k)); }
    for (let i = 0; i <= nc; i++) box(tr, cx - w / 2 + i * w / nc - .012, y0, zz - .012, cx - w / 2 + i * w / nc + .012, y0 + h, zz + .03, tcd); for (let j = 0; j <= nr; j++) box(tr, cx - w / 2, y0 + j * h / nr - .012, zz - .012, cx + w / 2, y0 + j * h / nr + .012, zz + .03, tcd);
  });
  [-3.75, -1.9, 1.9, 3.75].forEach(cx => { const w = 1.45, y0 = F1 + .78, h = 1.55, zz = -hd - .08; for (const sd of [-1, 1]) { const x0 = cx + sd * (w / 2 + .06 + .3); box(tr, x0 - .29, y0 - .5, zz - .02, x0 + .29, y0 + h + .05, zz + .03, woodC(.8)); for (let k = 0; k < 11; k++) box(tr, x0 - .27, y0 - .45 + k * .155, zz - .045, x0 + .27, y0 - .45 + k * .155 + .05, zz - .02, woodC(.62)); } });
  add(tr, G.vc, 'trim');
  const capMat = G.mat('capiz', { diffuse: rgb2c('#f4e8c8'), emissive: new C3(.04, .035, .02), specular: new C3(.3, .3, .25), power: 60 }); G.nightObjs.push({ mat: capMat, day: new C3(.05, .045, .03), night: new C3(1.05, .72, .32) });
  add(cap, capMat, 'capiz', false);

  // balcony, balusters, stairs
  const bl = new MB(), bz = hd + 1.5, wd = woodC(.95);
  for (let i = 0; i < 12; i++) box(bl, -hw - .25, F1 - .1, -bz + i * (1.5 / 12), hw + .25, F1 + .02, -bz + (i + 1) * (1.5 / 12) - .01, mixA(rgb('#8a5a38'), rgb('#a87648'), (i * 37 % 10) / 10));
  const bal = (x, z) => bl.tube([new V3(x, F1 + .02, z), new V3(x, F1 + .12, z), new V3(x, F1 + .22, z), new V3(x, F1 + .4, z), new V3(x, F1 + .62, z), new V3(x, F1 + .78, z), new V3(x, F1 + .93, z)], t => .03 + .018 * Math.sin(t * Math.PI * 2.2) * (t > .1 && t < .9 ? 1 : 0) + (t > .9 ? .006 : 0), 7, t => mixA(rgb('#d9c8a6'), rgb('#bfae8a'), t));
  const stairX0 = -2.8, stairX1 = -1.6;
  for (let x = -hw - .2; x <= hw + .2; x += .27) if (!(x > stairX0 - .06 && x < stairX1 + .06)) bal(x, -bz + .08);
  for (let z = -bz + .35; z < -hd; z += .27) { bal(-hw - .2, z); bal(hw + .2, z); }
  box(bl, -hw - .26, F1 + .93, -bz + .04, stairX0 - .02, F1 + 1.04, -bz + .14, tc); box(bl, stairX1 + .02, F1 + .93, -bz + .04, hw + .26, F1 + 1.04, -bz + .14, tc);
  box(bl, -hw - .26, F1 + .93, -bz + .04, -hw - .16, F1 + 1.04, -hd, tc); box(bl, hw + .16, F1 + .93, -bz + .04, hw + .26, F1 + 1.04, -hd, tc);
  box(bl, -hw - .26, F1 + .06, -bz + .04, hw + .26, F1 + .12, -bz + .12, tcd);
  [-hw - .2, hw + .2].forEach(x => [-bz + .1].forEach(z => box(bl, x - .06, 0, z - .06, x + .06, F1, z + .06, tc)));                  // the posts that hold the balcony up
  box(bl, -hw - .22, 0, -hd - .06, -hw - .12, F1, -hd + .04, tc);
  const ground0 = -.1, steps = 9, rise = (F1 - ground0) / steps, run = .27;
  for (let k = 0; k < steps; k++) { const z1 = -bz - k * run, y1 = F1 - (k + 1) * rise + rise; box(bl, stairX0, y1 - .05, z1 - run, stairX1, y1, z1, mixA(rgb('#8a5a38'), rgb('#a87648'), (k * 53 % 10) / 10)); box(bl, stairX0, y1 - rise, z1 - .03, stairX1, y1 - .05, z1, tcd); }
  [stairX0 - .05, stairX1 + .05].forEach(x => { bl.tube([new V3(x, F1 + .02, -bz), new V3(x, ground0, -bz - steps * run)], .03, 5, () => rgb('#5a3b28')); bl.tube([new V3(x, F1 + 1.0, -bz), new V3(x, ground0 + 1.0, -bz - steps * run)], .035, 6, () => rgb('#6b4a30')); for (let k = 1; k < steps; k += 2) bl.tube([new V3(x, F1 - k * rise, -bz - k * run), new V3(x, F1 - k * rise + 1.0, -bz - k * run)], .02, 5, () => rgb('#d9c8a6')); });
  add(bl, G.vc, 'balcony');

  // hip roof of clay tiles
  const rf = new MB(), eaveY = F2 - .05, ridgeY = 9.1, x0 = -hw - 1.3, x1 = hw + 1.3, zf = -bz - .75, zb = hd + 1.1, rx0 = -2.9, rx1 = 2.9, rz = (zf + zb) / 2 - .3;
  const face = (P00, P10, P01, P11, uvw, uvh) => {
    const w = V3.Distance(P00, P10) * .5 + V3.Distance(P01, P11) * .5, h = V3.Distance(P00, P01), nu = Math.max(4, Math.round(w / .12)), nv = Math.max(6, Math.round(h / .35));
    rf.scaleUV(w / 3.2, h / 3.2);
    rf.grid(nu, nv, (u, v) => { const a = V3.Lerp(P00, P10, u), b = V3.Lerp(P01, P11, u), p = V3.Lerp(a, b, v), nrm = V3.Cross(P10.subtract(P00), P01.subtract(P00)).normalize(); const ridge = .03 * Math.sin(u * w / .2 * Math.PI * 2) * 1; return [p.x + nrm.x * ridge * (nrm.y > 0 ? 1 : -1), p.y + nrm.y * ridge * (nrm.y > 0 ? 1 : -1), p.z + nrm.z * ridge * (nrm.y > 0 ? 1 : -1)]; }, () => [1, 1, 1]);
  };
  face(new V3(x0, eaveY, zf), new V3(x1, eaveY, zf), new V3(rx0, ridgeY, rz), new V3(rx1, ridgeY, rz));
  face(new V3(x1, eaveY, zb), new V3(x0, eaveY, zb), new V3(rx1, ridgeY, rz), new V3(rx0, ridgeY, rz));
  face(new V3(x0, eaveY, zb), new V3(x0, eaveY, zf), new V3(rx0, ridgeY, rz), new V3(rx0, ridgeY, rz));
  face(new V3(x1, eaveY, zf), new V3(x1, eaveY, zb), new V3(rx1, ridgeY, rz), new V3(rx1, ridgeY, rz));
  const roof = add(rf, roofMat, 'roof');
  const rt = new MB();                                                         // ridge caps, fascia and rafter tails
  rt.tube([new V3(rx0, ridgeY + .04, rz), new V3(rx1, ridgeY + .04, rz)], .14, 8, t => mixA(rgb('#9d4224'), rgb('#b5532e'), t));
  [[x0, eaveY, zf, rx0, ridgeY, rz], [x1, eaveY, zf, rx1, ridgeY, rz], [x0, eaveY, zb, rx0, ridgeY, rz], [x1, eaveY, zb, rx1, ridgeY, rz]].forEach(q => rt.tube([new V3(q[0], q[1] + .04, q[2]), new V3(q[3], q[4] + .04, q[5])], .1, 7, () => rgb('#a84a28')));
  box(rt, x0, eaveY - .16, zf - .02, x1, eaveY, zf + .06, tcd); box(rt, x0, eaveY - .16, zb - .06, x1, eaveY, zb + .02, tcd); box(rt, x0 - .02, eaveY - .16, zf, x0 + .06, eaveY, zb, tcd); box(rt, x1 - .06, eaveY - .16, zf, x1 + .02, eaveY, zb, tcd);
  for (let x = x0 + .3; x < x1; x += .55) box(rt, x - .035, eaveY - .13, zf, x + .035, eaveY - .03, zf + .9, tcd);
  bamboo(rt, new V3(-5.4, F2 - .2, zf + .35), new V3(5.4, F2 - .2, zf + .35), .035);                              // a bamboo batten tied under the rafter tails: the puso and the parol hang from this
  add(rt, G.vc, 'roofTrim');

  // hanging puso (woven rice pouches) under the front eave
  const pu = new MB();
  const puso = (cx, cy, cz, k) => { pu.tube([new V3(cx, cy + .22, cz), new V3(cx, cy, cz)], .004, 4, () => rgb('#d8c9a0')); for (let q = 0; q < k; q++) { const yy = cy - q * .17;
    pu.grid(12, 8, (u, v) => { const a = u * Math.PI * 2, rr = .062 * Math.pow(Math.max(0, 1 - Math.abs(v * 2 - 1)), .8), c = Math.cos(a), s = Math.sin(a), sq = 1 / Math.pow(Math.abs(c) ** 4 + Math.abs(s) ** 4, .25); return [cx + c * rr * sq, yy - v * .16 + .0, cz + s * rr * sq]; }, (u, v) => { const ch = (Math.floor(u * 12) + Math.floor(v * 8)) % 2; const bnd = Math.abs(v * 2 - 1) > .9 ? .85 : 1; return shade(ch ? rgb('#8ec253') : rgb('#6aa23a'), bnd * (.9 + .1 * ch)); }); } };
  [-4.2, -3.1, -1.6, 0, 1.6, 3.1, 4.2].forEach((x, i) => puso(x, F2 - .42, zf + .35, 3 + (i % 2)));
  add(pu, G.vc, 'puso', false);
  G.hot.push({ pos: root.getAbsolutePosition().add(new V3(0, 0, 0)), r: 0, kind: 'puso', local: new V3(0, F2 - .9, zf + .35), r2: 2.4 });

  // porch lamp + warm light for the garden at night
  const lb = new MB(); lb.tube([new V3(-1.5, 5.05, -hd - .04), new V3(-1.5, 5.05, -4.35)], .025, 6, () => woodC(.8)); lb.tube([new V3(-1.5, 4.55, -hd - .04), new V3(-1.5, 5.0, -4.2)], .02, 5, () => woodC(.7)); lb.tube([new V3(-1.5, 5.05, -4.35), new V3(-1.5, 4.9, -4.35)], .006, 4, () => rgb('#c8b480')); add(lb, G.vc, 'lampBracket', false);
  const lamp = B.MeshBuilder.CreateSphere('porchLamp', { diameter: .3, segments: 10 }, scene); lamp.parent = root; lamp.position.set(-1.5, 4.75, -4.35);
  const lm = G.mat('porchLampMat', { noLight: true, emissive: new C3(.4, .32, .2) }); G.nightObjs.push({ mat: lm, day: new C3(.35, .28, .18), night: new C3(1.3, .85, .35) }); lamp.material = lm;
  const pl2 = new B.PointLight('porchLight', V3.Zero(), scene); pl2.parent = root; pl2.position.set(0, 4.6, -bz - .8); pl2.diffuse = new C3(1, .72, .4); pl2.range = 16; pl2.specular = C3.Black(); pl2.intensity = 0; G.porchLight = pl2;
  G.onTime.push(S => { pl2.intensity = 2.2 * clamp(S.night * 1.4, 0, 1); });
  G.houseMeshes = root.getChildMeshes(); G.houseRoof = roof;
  const c = Math.cos(H.yaw), s = Math.sin(H.yaw);
  G.obstacles.push({ box: true, x: H.x, z: H.z, hw: hw + .2, hd: hd + .2, yaw: H.yaw });
  G.houseLocalToWorld = (lx, ly, lz) => new V3(H.x + lx * c + lz * s, hy + ly, H.z - lx * s + lz * c);
})();
function rgb2c(h) { return C3.FromHexString(h); }

/* ---------- tapayan: the big clay water/storage jars of a Visayan yard ---------- */
(function jars() {
  const mb = new MB(), prof = [[0, 0], [.13, 0], [.22, .07], [.29, .22], [.31, .36], [.26, .52], [.17, .62], [.14, .68], [.18, .74], [.19, .76]];
  const jar = (x, z, s, tone) => { const y = hFn(x, z) - .02, n = prof.length - 1; mb.grid(22, n * 3, (u, v) => { const f = v * n, i = Math.min(n - 1, Math.floor(f)), t = f - i, r = lerp(prof[i][0], prof[i + 1][0], t) * s, yy = lerp(prof[i][1], prof[i + 1][1], t) * s; return [x + Math.cos(u * 6.283) * r, y + yy, z + Math.sin(u * 6.283) * r]; },
    (u, v) => shade(mixA(rgb('#9a5430'), rgb('#c07a46'), .5 + .5 * Math.sin(u * 40 + v * 9)), v > .55 && v < .62 ? .65 : .9 + .15 * v)); G.obstacles.push({ x, z, r: .35 * s }); };
  for (const [lx, lz, s] of [[-.4, -6.4, 1.5], [-4, -6.2, 1.2], [.9, -6.3, .9], [-4.9, -5.9, 1.0]]) { const p = G.houseLocalToWorld(lx, 0, lz); jar(p.x, p.z, s); }
  G.cast(mb.build('tapayan'));
})();

/* ---------- bamboo entrance arch with the sign ---------- */
G.arch = {};
(function arch() {
  const ax = G.L.arch.x, az = G.path.at(.1).z, ay = hFn(ax, az) - .05, mb = new MB(), R_ = 1.75, top = 2.35;
  const curve = []; for (let k = 0; k <= 24; k++) { const a = Math.PI * k / 24; curve.push(new V3(ax, ay + top + Math.sin(a) * R_ * 1.05, az + Math.cos(a) * R_)); }
  for (const dx of [-.11, .11]) { bamboo(mb, new V3(ax + dx, ay - .15, az + R_), new V3(ax + dx, ay + top, az + R_), .06); bamboo(mb, new V3(ax + dx, ay - .15, az - R_), new V3(ax + dx, ay + top, az - R_), .06); mb.tube(curve.map(p => new V3(p.x + dx, p.y, p.z)), .055, 7, t => bambooCol(t * 3, 0)); }
  for (let k = 2; k < 23; k += 3) mb.tube([new V3(ax - .13, curve[k].y, curve[k].z), new V3(ax + .13, curve[k].y, curve[k].z)], .018, 5, () => rgb('#6a5a3a'));
  const m = mb.build('arch'); G.cast(m);
  // sign:  Hardin ni Almira
  const tex = canvasTex('signTex', 512, (ctx, s) => { ctx.fillStyle = '#6f4a2c'; ctx.fillRect(0, 0, s, s); for (let i = 0; i < 90; i++) { ctx.strokeStyle = `rgba(30,15,5,${.05 + Math.random() * .15})`; ctx.lineWidth = .6 + Math.random() * 1.4; const y = Math.random() * s; ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(s * .3, y + Math.random() * 6 - 3, s * .7, y + Math.random() * 6 - 3, s, y + Math.random() * 4 - 2); ctx.stroke(); } ctx.fillStyle = '#f2e3c0'; ctx.font = 'italic 600 74px "Cormorant Garamond", Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('Hardin ni', s / 2, 205); ctx.fillText('Almira', s / 2, 300); ctx.font = '500 30px Georgia, serif'; ctx.fillStyle = '#e8c27a'; ctx.fillText('✿  Sugbo  ✿', s / 2, 380); ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 14; ctx.strokeRect(7, 7, s - 14, s - 14); });
  const sm = G.mat('signMat', { specular: C3.Black() }); sm.diffuseTexture = tex; sm.emissiveColor = new C3(.05, .04, .03);
  const sign = B.MeshBuilder.CreateBox('sign', { width: .08, height: .62, depth: 1.05 }, scene);
  const faces = [new B.Vector4(0, 0, 1, 1), new B.Vector4(0, 0, 1, 1), new B.Vector4(0, 0, 1, 1), new B.Vector4(0, 0, 1, 1), new B.Vector4(0, 0, 1, 1), new B.Vector4(0, 0, 1, 1)];
  const sg = B.MeshBuilder.CreatePlane('signFace', { width: 1.05, height: .62 }, scene); sg.material = sm; sg.position.set(ax - .045, ay + top + R_ * 1.05 - .8, az); sg.rotation.y = Math.PI / 2; const sg2 = sg.clone('signFace2'); sg2.position.x = ax + .045; sg2.rotation.y = -Math.PI / 2;
  sign.dispose();
  const ropes = new MB(); for (const dz of [-.42, .42]) ropes.tube([new V3(ax, ay + top + R_ * 1.05 - .45, az + dz), new V3(ax, curve[Math.round(12 + dz * 6)].y, az + dz)], .008, 4, () => rgb('#c8b480')); ropes.build('signRope');
  // bark-and-wood sign backing frame
  G.arch.curve = curve; G.arch.ax = ax; G.arch.az = az; G.arch.ay = ay; G.arch.R = R_;
  G.obstacles.push({ x: ax, z: az + R_, r: .3 }, { x: ax, z: az - R_, r: .3 });
})();

/* ---------- pergola of kadena de amor (chain of love) over the path ---------- */
G.pergola = {};
(function pergola() {
  const mb = new MB(), s0 = .74, s1 = .9, n = 5, frames = [];
  for (let k = 0; k < n; k++) { const u = lerp(s0, s1, k / (n - 1)), p = G.path.at(u), q = G.path.at(u + .004), T = q.subtract(p).normalize(), Nn = new V3(-T.z, 0, T.x), y = hFn(p.x, p.z); frames.push({ p, T, N: Nn, y }); }
  frames.forEach(f => { const W = 1.9, H = 2.5; for (const sd of [-1, 1]) { const base = f.p.add(f.N.scale(W * sd)), bt = new V3(base.x, hFn(base.x, base.z) - .1, base.z); bamboo(mb, bt, new V3(bt.x, f.y + H, bt.z), .055); } const a = f.p.add(f.N.scale(-W - .2)), b = f.p.add(f.N.scale(W + .2)); bamboo(mb, new V3(a.x, f.y + H + .02, a.z), new V3(b.x, f.y + H + .02, b.z), .05); });
  for (let k = 0; k < n - 1; k++) { const f0 = frames[k], f1 = frames[k + 1]; for (const off of [-1.8, -.9, 0, .9, 1.8]) { const a = f0.p.add(f0.N.scale(off)), b = f1.p.add(f1.N.scale(off)); bamboo(mb, new V3(a.x, f0.y + 2.58, a.z), new V3(b.x, f1.y + 2.58, b.z), .03); } }
  G.cast(mb.build('pergola'));
  // racemes of tiny pink hearts, hanging
  const rr = rng(444), variants = [];
  for (let v = 0; v < 3; v++) {
    const m = new MB(), len = Rr(.55, 1.15, rr), pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(new V3(Math.sin(t * 3 + v) * .05 * t, -len * t, Math.cos(t * 2 + v) * .03 * t)); }
    m.tube(pts, [.004, .0025], 4, () => rgb('#7a8a3a'));
    for (let k = 1; k <= 9; k++) { const t = k / 9.5, p = G.geo.ptAt(pts, t), sz = lerp(1.2, .55, t), a = k * 2.4; for (let q = 0; q < 2; q++) { const d = new V3(Math.cos(a + q * 3.14), -.35, Math.sin(a + q * 3.14)).normalize(); G.geo.petal(m, .03 * sz, .028 * sz, basis(d, V3.Up(), p.add(d.scale(.006)), 0), [rgb('#ff9fbd'), rgb('#ff6f9c'), rgb('#ee4a82')], { nu: 4, nv: 4, cup: .5, curl: .1, pw: .45, sh: .5, throat: .2, veins: 0 }); } }
    variants.push(m.build('raceme' + v, G.mats.hang));
  }
  const heart = new MB(); G.geo.leaf(heart, .11, .095, basis(new V3(0, 0, 1), V3.Up(), V3.Zero()), rgb('#3a8a34'), rgb('#6ab04a'), { nu: 4, nv: 4, base: .45, sharp: .55, fold: .2, curl: .1 }); const heartM = heart.build('heartLeaf', G.mats.vine);
  const mats = variants.map(() => []), lm = [], tmp = new B.Matrix();
  frames.slice(0, n - 1).forEach((f0, k) => { const f1 = frames[k + 1]; for (let i = 0; i < 70; i++) { const t = rr(), off = Rr(-2, 2, rr), p = V3.Lerp(f0.p.add(f0.N.scale(off)), f1.p.add(f1.N.scale(off)), t), y = lerp(f0.y, f1.y, t) + 2.5;
    const s = Rr(1.1, 1.9, rr); M4.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(rr() * 6.28, Rr(-.12, .12, rr), 0), new V3(p.x, y, p.z), tmp); mats[Math.floor(rr() * 3)].push(...tmp.toArray());
    for (let l = 0; l < 3; l++) { const s2 = Rr(1, 1.8, rr), lp = new V3(p.x + Rr(-.3, .3, rr), y + Rr(0, .18, rr), p.z + Rr(-.3, .3, rr)); M4.ComposeToRef(new V3(s2, s2, s2), B.Quaternion.RotationYawPitchRoll(rr() * 6.28, Rr(-.5, .1, rr), rr() * 6.28), lp, tmp); lm.push(...tmp.toArray()); } } });
  variants.forEach((m, i) => { m.thinInstanceSetBuffer('matrix', new Float32Array(mats[i]), 16, true); m.alwaysSelectAsActiveMesh = true; });
  heartM.thinInstanceSetBuffer('matrix', new Float32Array(lm), 16, true); heartM.alwaysSelectAsActiveMesh = true;
  G.pergola.frames = frames; G.pergola.center = frames[2].p.clone(); G.pergola.centerY = frames[2].y + 1.9;
})();

/* ---------- roadside shrine with candles and a sampaguita garland ---------- */
G.candles = [];
(function shrine() {
  const { x, z } = G.L.shrine, y = hFn(x, z) - .05, mb = new MB(), c = woodC(1), cd = woodC(.7);
  box(mb, x - .85, y, z - .85, x + .85, y + .14, z + .85, rgb('#b9ae92'), 1);
  for (const [dx, dz] of [[-.72, -.72], [.72, -.72], [-.72, .72], [.72, .72]]) box(mb, x + dx - .06, y + .14, z + dz - .06, x + dx + .06, y + 2.1, z + dz + .06, c);
  const ry = y + 2.1; mb.grid(8, 4, (u, v) => { const t = u * 2 - 1; return [x - 1.15 + u * 2.3, ry + (1 - Math.abs(t)) * .0 + .0, z - .95 + v * 1.9]; }, () => rgb('#5a3a28'));
  const gab = new MB(); const roofL = (side) => gab.grid(10, 6, (u, v) => [x - 1.15 + u * 2.3, ry + (1 - v) * 0 + v * .6 - .0 + 0.0, z + side * (.98 - v * .98)], (u, v) => shade(mixA(rgb('#6a4a30'), rgb('#4a3020'), (Math.floor(u * 14) % 2) * .5), 1 - v * .1)); roofL(1); roofL(-1); G.cast(gab.build('shrineRoof'));
  box(mb, x - 1.1, ry - .08, z - .9, x + 1.1, ry, z + .9, cd);
  box(mb, x - .06, y + .14, z + .3, x + .06, y + 1.75, z + .42, rgb('#7a5233')); box(mb, x - .34, y + 1.3, z + .3, x + .34, y + 1.42, z + .42, rgb('#7a5233'));      // the cross
  box(mb, x - .62, y + .14, z - .55, x + .62, y + .52, z - .1, cd); box(mb, x - .66, y + .52, z - .6, x + .66, y + .58, z - .05, c);
  mb.build('shrineBase').receiveShadows = true; G.cast(G.scene.meshes[G.scene.meshes.length - 1]);
  G.obstacles.push({ x, z, r: 1.15 });
  const cand = new MB(), flameMats = [];
  for (let i = 0; i < 6; i++) { const cx = x - .5 + i * .2, cz = z - .32; cand.tube([new V3(cx, y + .58, cz), new V3(cx, y + .58 + .15 + (i % 3) * .03, cz)], .018, 8, t => mixA(rgb('#f4ead0'), rgb('#e8dcc0'), t), null, true); G.candles.push({ pos: new V3(cx, y + .58 + .2 + (i % 3) * .03, cz), lit: i === 1 || i === 4, flame: null }); }
  cand.build('candles');
  const fm = G.mat('flame', { noLight: true, emissive: new C3(1.6, .9, .25) });
  G.candles.forEach((cd2, i) => { const f = B.MeshBuilder.CreateSphere('flame', { diameter: 1, segments: 6 }, scene); f.scaling.set(.016, .034, .016); f.position.copyFrom(cd2.pos); f.material = fm; f.isPickable = false; f.setEnabled(cd2.lit); cd2.flame = f; G.hot.push({ pos: cd2.pos.clone().add(new V3(0, -.1, 0)), r: .22, kind: 'candle', idx: i }); });
  const sl = new B.PointLight('shrineLight', new V3(x, y + 1.0, z - .1), scene); sl.diffuse = new C3(1, .62, .28); sl.range = 9; sl.specular = C3.Black(); sl.intensity = 0; G.shrineLight = sl; G.shrinePos = new V3(x, y + 1, z);
  G.flickerCandles = t => { const n = G.candles.filter(c => c.lit).length; const nk = G.state.night || 0; sl.intensity = n * .22 * (1 + nk * .07 * Math.sin(t * 5.3) * Math.sin(t * 2.2)); G.candles.forEach((c, i) => { if (c.lit) { c.flame.scaling.set(.016 + nk * Math.sin(t * 6.1 + i) * .0009, .034 + nk * Math.sin(t * 8.3 + i * 2) * .0032, .016); } }); };
  // sampaguita garland on the cross
  const flo = new MB(); G.geo.sampaguitaFlower(flo, basis(new V3(0, 0, 1), V3.Up(), V3.Zero(), 0, 2.2), rng(5)); const fm2 = flo.build('garlandFlower'), arr = [], r = rng(8), tmp = new B.Matrix();
  const loop = (cx, cy, cz, w, sag, n) => { for (let i = 0; i <= n; i++) { const t = i / n, px = cx - w / 2 + w * t, py = cy - sag * Math.sin(Math.PI * t); M4.ComposeToRef(new V3(1, 1, 1), B.Quaternion.RotationYawPitchRoll(r() * 6.28, Rr(-.8, .8, r), r() * 6.28), new V3(px, py, cz), tmp); arr.push(...tmp.toArray()); } };
  loop(x, y + 1.42, z + .48, .7, .22, 22); loop(x, y + 1.72, z + .48, .4, .1, 12); for (let i = 0; i < 14; i++) { M4.ComposeToRef(new V3(1, 1, 1), B.Quaternion.RotationYawPitchRoll(r() * 6.28, Rr(-.8, .8, r), 0), new V3(x + Rr(-.05, .05, r), y + 1.3 - i * .035, z + .48), tmp); arr.push(...tmp.toArray()); }
  fm2.thinInstanceSetBuffer('matrix', new Float32Array(arr), 16, true); fm2.alwaysSelectAsActiveMesh = true;
  G.hot.push({ pos: new V3(x, y + 1.3, z + .4), r: .55, kind: 'shrine' });
})();

/* ---------- fiesta banderitas ---------- */
G.flags = [];
(function banderitas() {
  const strings = new MB(), polesMB = new MB(), cols = ['#d62c2c', '#f6c522', '#1f5fb8', '#f4efe2', '#2f9a4a'], tri = cols.map((c, i) => { const m = new MB(); m.grid(1, 1, (u, v) => [(u - .5) * (1 - v) * .2, -v * .29, 0], (u, v) => shade(rgb(c), 1 - v * .12)); return m.build('flag' + i); });
  const lines = [], H = G.L.house;
  const poleAt = (x, z, h) => { const y = hFn(x, z); bamboo(polesMB, new V3(x, y - .1, z), new V3(x + .15, y + h, z), .05); return new V3(x + .15, y + h, z); };
  const pA = poleAt(-22, -5, 5.2), pB = poleAt(-22, 6.5, 5.0), pC = poleAt(-6, 7.5, 5.4), pD = poleAt(-6, -7, 5.2), pE = poleAt(5, -6, 5.6);
  const eave = G.houseLocalToWorld(-5.98, 5.4, -5.76), eave2 = G.houseLocalToWorld(5.98, 5.4, -5.76);                // tied to the front corners of the roof edge
  lines.push([pB, pC, .9], [pD, pE, .9], [pE, eave, 1.0], [pC, eave2, 1.1]);
  const mats = tri.map(() => []), tmp = new B.Matrix();
  lines.forEach(([a, b, sag], li) => {
    const L = V3.Distance(a, b), pts = []; for (let k = 0; k <= 24; k++) { const t = k / 24; const p = V3.Lerp(a, b, t); p.y -= sag * 4 * t * (1 - t); pts.push(p); }
    strings.tube(pts, .006, 4, () => rgb('#d8c9a0'));
    const nF = Math.floor(L / .6); for (let k = 1; k < nF; k++) { const t = k / nF, p = V3.Lerp(a, b, t); p.y -= sag * 4 * t * (1 - t); const yaw = Math.atan2(b.x - a.x, b.z - a.z); G.flags.push({ ci: (k + li) % 5, p, yaw, ph: Math.random() * 6.28 }); }
  });
  G.cast(polesMB.build('flagPoles')); strings.build('strings');
  G.flagMeshes = tri; G.flagBuf = tri.map(() => new Float32Array(G.flags.length * 16));
  tri.forEach(m => { m.alwaysSelectAsActiveMesh = true; });
  const idx = tri.map(() => []); G.flags.forEach((f, i) => idx[f.ci].push(i));
  const bufs = tri.map((m, c) => new Float32Array(idx[c].length * 16)); tri.forEach((m, c) => m.thinInstanceSetBuffer('matrix', bufs[c], 16, false));
  G.flagIdx = idx; G.flagBufs = bufs;
  G.updateFlags = (t, wind) => { const q = new B.Quaternion(), s = new V3(1, 1, 1);
    idx.forEach((list, c) => { list.forEach((fi, j) => { const f = G.flags[fi], sw = Math.sin(t * 3.2 + f.ph) * .22 * wind + Math.sin(t * 5.1 + f.ph * 2) * .08 * wind; B.Quaternion.RotationYawPitchRollToRef(f.yaw + Math.PI / 2, sw, Math.sin(t * 2.1 + f.ph) * .15 * wind, q); M4.ComposeToRef(s, q, f.p, tmp); tmp.copyToArray(bufs[c], j * 16); }); tri[c].thinInstanceBufferUpdated('matrix'); }); };
})();

/* ---------- papag (bamboo bench) under the ilang-ilang ---------- */
(function papag() {
  const mb = new MB(), x = G.L.tree.x + 1.6, z = G.L.tree.z + 2.4, y = hFn(x, z), yaw = .4, c = Math.cos(yaw), s = Math.sin(yaw);
  const P = (lx, ly, lz) => new V3(x + lx * c + lz * s, y + ly, z - lx * s + lz * c);
  for (const [lx, lz] of [[-.95, -.42], [.95, -.42], [-.95, .42], [.95, .42]]) bamboo(mb, P(lx, -.02, lz), P(lx, .48, lz), .04);
  for (const lz of [-.42, .42]) bamboo(mb, P(-1.0, .48, lz), P(1.0, .48, lz), .04);
  for (let i = 0; i < 13; i++) bamboo(mb, P(-.9 + i * .15, .53, -.46), P(-.9 + i * .15, .53, .46), .026);
  for (const lx of [-.95, .95]) bamboo(mb, P(lx, .48, -.42), P(lx, .48, .42), .035);
  G.cast(mb.build('papag')); G.obstacles.push({ x, z, r: 1.0 });
})();

/* ---------- bangka (outrigger boats), a sail, a beached one ---------- */
G.boats = [];
function makeBangka(seed, sailCol, o = {}) {
  const r = rng(seed), mb = new MB(), L = 6.4, Bm = .78, D = .5, pal = [['#b98a56', '#e8e0cc'], ['#a87a4a', '#2f7bb8'], ['#c0905c', '#c43a2e'], ['#b08a5a', '#2a9a6a']][seed % 4], wood = rgb('#6b4a30');
  const w = u => Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, .82))), .5) * .5 * Bm, dd = u => D * (1 - .3 * Math.pow(2 * u - 1, 2)), sheer = u => .34 * Math.pow(Math.abs(2 * u - 1), 3) * (u > .5 ? 1.2 : .85);
  // the planked hull, with a painted stripe under the gunwale
  mb.grid(34, 18, (u, v) => { const a = v * Math.PI, ww = w(u); return [-Math.cos(a) * ww, -dd(u) * Math.sin(a) + sheer(u), (u - .5) * L]; },
    (u, v) => { const plank = Math.floor(v * 9), seam = (v * 9) % 1 < .07 ? .7 : 1, stripe = (v > .1 && v < .19) || (v > .81 && v < .9), base = stripe ? rgb(pal[1]) : mixA(rgb(pal[0]), shade(rgb(pal[0]), .84), plank % 2); return shade(base, seam * (.92 + .1 * Math.sin(u * 40 + plank))); });
  // floor boards inside, the gunwale rim, seats (thwarts)
  mb.grid(20, 6, (u, v) => [(v - .5) * 2 * w(.05 + u * .9) * .7, -dd(.05 + u * .9) * .55, (.05 + u * .9 - .5) * L], (u, v) => shade(rgb('#c8a878'), (Math.floor(u * 22) % 2 ? .9 : 1) * (.94 + .08 * v)));
  for (const a of [0, Math.PI]) { const pts = []; for (let i = 0; i <= 32; i++) { const u = i / 32; pts.push(new V3(-Math.cos(a) * w(u), sheer(u) + .012, (u - .5) * L)); } mb.tube(pts, .03, 6, () => wood); }
  for (const z of [-1.5, -.1, 1.3]) { const u = z / L + .5, ww = w(u) * .96; box(mb, -ww, -.1, z - .13, ww, -.06, z + .13, rgb('#8a5a38')); }
  // outriggers: bamboo arms lashed to the hull and a long float on each side
  for (let k = 0; k < 4; k++) { const zz = -1.8 + k * 1.2, u = zz / L + .5, ww = w(u); for (const sd of [-1, 1]) { bamboo(mb, new V3(sd * ww * .9, sheer(u) - .03, zz), new V3(sd * 1.9, .1, zz + (k % 2 ? .1 : -.1)), .028); mb.tube([new V3(sd * (ww * .9 - .07), sheer(u) - .03, zz), new V3(sd * (ww * .9 + .06), sheer(u) - .03, zz)], .036, 5, () => rgb('#3a2a1c')); } }
  for (const sx of [-1.9, 1.9]) { const f = []; for (let k = 0; k <= 14; k++) { const t = k / 14; f.push(new V3(sx, .08 - .1 * Math.pow(Math.abs(2 * t - 1), 3), (t - .5) * 4.4)); } mb.tube(f, t => .075 * Math.pow(Math.max(.05, Math.sin(Math.PI * t)), .4), 10, t => mixA(rgb('#c4b055'), rgb('#a0903f'), t)); }
  // a paddle resting across the seats
  mb.tube([new V3(-.3, -.03, 1.4), new V3(.45, .02, .7)], .014, 5, () => wood); mb.grid(1, 3, (u, v) => [.45 + (u - .5) * .1 + v * .12, .02 + v * .02, .7 - v * .26], () => rgb('#a07a50'));
  const mast = !o.beached;
  if (mast) { bamboo(mb, new V3(0, -.1, .4), new V3(0, 3.7, .4), .045); bamboo(mb, new V3(0, .64, .38), new V3(0, .64, -2.1), .03);                       // mast and boom
    for (const [ex, ey, ez] of [[0, sheer(1) + .02, L / 2 - .1], [0, sheer(0) + .02, -L / 2 + .15]]) mb.tube([new V3(0, 3.65, .4), new V3(0, ey, ez)], .008, 4, () => rgb('#d8c9a0')); }                      // stays to bow and stern
  const hull = mb.build('bangka'); hull.material = G.vc;
  if (mast && !o.noSail) { const sail = new MB(); sail.grid(14, 14, (u, v) => { const bill = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * .26; return [bill, .66 + v * 2.95, .4 - u * 2.4 * (1 - v * .62)]; }, (u, v) => shade(rgb(sailCol), (.92 + .1 * Math.sin(v * 25) + (Math.floor(v * 7) % 2 ? .03 : -.02)) * (u < .025 ? .75 : 1)));
    const sm = sail.build('sail'); sm.material = G.mat('sailMat' + seed, { diffuse: rgb2c(sailCol), emissive: new C3(.12, .1, .07), specular: C3.Black() }); sm.parent = hull; }
  hull.getChildMeshes().forEach(m => G.cast(m)); G.cast(hull); return hull;
}
(function boats() {
  const b1 = makeBangka(1, '#efe3c0'), b2 = makeBangka(2, '#e8c26a'), b3 = makeBangka(3, '#f4efe2');
  [[b1, -88, 24, 1.9, .5], [b2, -125, -34, 1.1, -.3], [b3, -64, -52, 1.6, .8]].forEach(([b, x, z, yaw, sp]) => { b.position.set(x, G.SEA_Y + .3, z); b.rotation.y = yaw; G.boats.push({ m: b, x, z, yaw, sp, ph: Math.random() * 6 }); });
  // the beached bangka: hauled up the sand, hull sunk a little, no sail
  const bb = makeBangka(4, '#d8cfae', { beached: true }), sx = G.shoreX(-15) + 3.5; bb.position.set(sx, hFn(sx, -15) + .22, -15); bb.rotation.set(.05, .5, -.1); G.beachedBoat = { x: sx, z: -15 };
  G.hot.push({ pos: new V3(sx, hFn(sx, -15) + .5, -15), r: 1.6, kind: 'bangka' }); G.obstacles.push({ x: sx, z: -15, r: 2.2 });
})();
const _wv = {}, _wv2 = {};
G.updateBoats = t => G.boats.forEach(b => {
  const px = b.x + Math.sin(t * .05 * b.sp + b.ph) * 6, pz = b.z + Math.cos(t * .04 * b.sp + b.ph) * 3, w = G.waveAt(px, pz, t, _wv), fx = Math.sin(b.m.rotation.y), fz = Math.cos(b.m.rotation.y), rx = Math.cos(b.m.rotation.y), rz = -Math.sin(b.m.rotation.y);
  b.m.position.set(px, G.SEA_Y + .28 + w.h, pz); b.m.rotation.x = -(w.gx * fx + w.gz * fz) * .9; b.m.rotation.z = (w.gx * rx + w.gz * rz) * .9 + Math.sin(t * .6 + b.ph) * .01;
});})();
