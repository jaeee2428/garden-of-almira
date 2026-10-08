/* =====================================================================
   world/props.js - more of the homestead, all around the garden:
   lily pond · mango trees · bamboo clumps · bahay kubo · tubod (well) ·
   duyan (hammock) · clay pots · rocks · orchids on the trunks
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng, scene, hFn, geo } = G;
const Rr = (a, b, r) => a + (b - a) * r(), R = G.R, rand = G.rand, UP = V3.Up(), P = G.POND, L = G.L;
const tmp = new B.Matrix();

const addHot = (x, y, z, r, kind, sp) => G.hot.push({ pos: new V3(x, y, z), r, kind, sp });

/* ---------- rocks (displaced spheres, mossy on top) ---------- */
function rockMesh(seed, name) {
  const m = B.MeshBuilder.CreateIcoSphere(name, { radius: 1, subdivisions: 3, flat: false }, scene), p = m.getVerticesData('position'), n = p.length / 3, col = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2], nz = G.vnoise(x * 1.9 + seed, z * 1.9 + y * 1.4), k = .78 + .4 * nz + .08 * Math.sin(x * 6 + z * 5);
    p[i * 3] = x * k * 1.15; p[i * 3 + 1] = Math.max(y * k * .72, -.16); p[i * 3 + 2] = z * k;
    const moss = G.smooth(.05, .6, y + G.vnoise(x * 3, z * 3) * .35), c = mixA(mixA(rgb('#8d8c86'), rgb('#aaa89f'), nz), rgb('#5a7a48'), moss * .42); col.set([c[0], c[1], c[2], 1], i * 4); }
  m.updateVerticesData('position', p); const nr = []; B.VertexData.ComputeNormals(p, m.getIndices(), nr); m.updateVerticesData('normal', nr); m.setVerticesData('color', col); m.material = G.vc; m.isPickable = false; return m;
}
(function rocks() {
  const meshes = [rockMesh(1, 'rock1'), rockMesh(2, 'rock2'), rockMesh(3, 'rock3')], bufs = [[], [], []], r = rng(808);
  const put = (x, z, s, sink = .1) => { M4.ComposeToRef(new V3(s * Rr(.9, 1.3, r), s * Rr(.7, 1.1, r), s), B.Quaternion.RotationYawPitchRoll(r() * 6.28, Rr(-.15, .15, r), Rr(-.15, .15, r)), new V3(x, hFn(x, z) - sink * s, z), tmp); bufs[Math.floor(r() * 3)].push(...tmp.toArray()); };
  for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 + Rr(-.1, .1, r), rr = P.r + Rr(.1, .9, r); put(P.x + Math.cos(a) * rr, P.z + Math.sin(a) * rr, Rr(.35, .8, r)); }          // around the pond
  const onSand = (x, z) => { const d = x - G.shoreX(z); return d > .9 && d < 3.2; };
  for (let i = 0; i < 24; i++) { const z0 = Rr(-36, 36, r), s = Rr(.25, .9, r), [x, z, m] = G.findFree(G.shoreX(z0) + Rr(.3, 2.6, r), z0, .62 * s, onSand, 3);      // along the beach, on the sand
    if (m < 0) continue; put(x, z, s, .2); G.claim(x, z, .55 * s, true, 'rock'); }
  for (let i = 0; i < 12; i++) { const a = Rr(0, 6.283, r), x = L.well.x + Math.cos(a) * 2.4, z = L.well.z + Math.sin(a) * 2.4; put(x, z, Rr(.25, .45, r)); }
  for (let i = 0; i < 14; i++) { const x = Rr(-40, 40, r), z = Rr(-38, 38, r); if (!G.blocked(x, z, 1.2)) put(x, z, Rr(.3, .7, r)); }
  meshes.forEach((m, i) => { if (bufs[i].length) { m.thinInstanceSetBuffer('matrix', new Float32Array(bufs[i]), 16, true); m.thinInstanceRefreshBoundingInfo(true); G.cast(m); } else m.setEnabled(false); });
})();

/* ---------- lily pond: water, pads, lotus ---------- */
(function pond() {
  const bump = G.normalTex('pondN', 128, (ctx, s) => { const img = ctx.createImageData(s, s); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const v = 128 + (G.vnoise(x * .18, y * .18) - .5) * 90 + (G.vnoise(x * .5 + 9, y * .5) - .5) * 40; const o = (y * s + x) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = v; img.data[o + 3] = 255; } ctx.putImageData(img, 0, 0); }, 2.2);
  const water = B.MeshBuilder.CreateDisc('pondWater', { radius: P.r + .5, tessellation: 56 }, scene); water.rotation.x = Math.PI / 2; water.position.set(P.x, -.2, P.z); water.isPickable = false;
  const wm = G.mat('pondMat', { diffuse: new C3(.02, .1, .09), specular: new C3(.9, .9, .85), power: 140, alpha: .9 }); wm.bumpTexture = bump; bump.uScale = bump.vScale = 3; bump.level = .5; wm.emissiveColor = new C3(.03, .06, .07); water.material = wm;
  G.onTime.push(S => { wm.emissiveColor = new C3(S.hor.r * .17 + .02, S.hor.g * .2 + .03, S.hor.b * .2 + .04); wm.alpha = .86 + .08 * S.night; });
  G.updatePond = t => { bump.uOffset = t * .015; bump.vOffset = t * .01; };
  const pad = geo.lilyPad(5)[0].build('lilypad', G.vc), pad2 = geo.lilyPad(6)[0].build('lilypad2', G.vc), lot = geo.lotus(9)[0].build('lotus', G.vc), lot2 = geo.lotus(13)[0].build('lotus2', G.vc), r = rng(404);
  const pb = [[], []], lb = [[], []];
  for (let i = 0; i < 46; i++) { const a = r() * 6.283, rr = Math.sqrt(r()) * (P.r - .35), s = Rr(.22, .48, r); M4.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(r() * 6.28, 0, 0), new V3(P.x + Math.cos(a) * rr, -.17, P.z + Math.sin(a) * rr), tmp); pb[i % 2].push(...tmp.toArray()); }
  for (let i = 0; i < 14; i++) { const a = r() * 6.283, rr = Math.sqrt(r()) * (P.r - 1), s = Rr(.8, 1.35, r); M4.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(r() * 6.28, Rr(-.06, .06, r), Rr(-.06, .06, r)), new V3(P.x + Math.cos(a) * rr, -.2, P.z + Math.sin(a) * rr), tmp); lb[i % 2].push(...tmp.toArray()); }
  [[pad, pb[0]], [pad2, pb[1]], [lot, lb[0]], [lot2, lb[1]]].forEach(([m, b]) => { m.thinInstanceSetBuffer('matrix', new Float32Array(b), 16, true); m.alwaysSelectAsActiveMesh = true; });
  addHot(P.x, .4, P.z, 3.6, 'plant', 'liryo');
  // fireflies love the pond: a few drifting lights above the water
})();

/* ---------- mango trees ---------- */
(function mangoes() {
  const trunk = new MB(), r = rng(66), leafG = new MB(), leafC = new MB(), fruit = new MB();
  const cl = (mb, cA, cB) => { for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + Rr(-.2, .2, r), el = .35 + Rr(0, .5, r); geo.leaf(mb, .3, .07, basis(new V3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)), UP, ORG0, 0), cA, cB, { nu: 6, nv: 2, fold: .25, curl: -.15, base: .7, sharp: .5, rib: rgb('#b8c870') }); } };
  const ORG0 = V3.Zero(); cl(leafG, rgb('#1c4a22'), rgb('#3f8a34')); cl(leafC, rgb('#6a2a1e'), rgb('#b0602e'));
  const f = fruit; f.ellipsoid(0, -.1, 0, .055, .095, .045, 12, 8, (u, v) => mixA(mixA(rgb('#7ab030'), rgb('#ffc02a'), v), rgb('#e0602a'), Math.max(0, u - .6) * .8)); f.tube([new V3(0, -.0, 0), new V3(0, .12, 0)], .004, 3, () => rgb('#5a6a2a'));
  const gb = [], cb = [], fb = [], centers = [];
  for (const [x, z] of L.mango) {
    const y = hFn(x, z) - .05, tr = [new V3(x, y, z), new V3(x + .06, y + 1.0, z - .04), new V3(x - .05, y + 1.9, z + .05), new V3(x + .04, y + 2.5, z)];
    trunk.tube(tr, [.45, .24], 14, (t, a) => shade(mixA(rgb('#5a4a3a'), rgb('#3a2e24'), .5 + .5 * Math.sin(a * 6.283 * 6 + t * 9)), .9));
    for (let k = 0; k < 6; k++) { const yaw = k / 6 * 6.283 + Rr(-.3, .3, r), len = Rr(2.2, 3.2, r), pts = []; for (let i = 0; i < 7; i++) { const t = i / 6; pts.push(new V3(x + Math.sin(yaw) * len * t, y + 2.3 + len * (.62 * t - .2 * t * t), z + Math.cos(yaw) * len * t)); } trunk.tube(pts, [.17, .05], 8, t => mixA(rgb('#5a4a3a'), rgb('#4a3e30'), t)); }
    const cy = y + 5.2;
    for (let i = 0; i < Math.round(640 * G.Q); i++) { const u = r() * 6.283, v = Math.acos(2 * r() - 1), rr = Math.cbrt(Rr(.4, 1, r)), p = new V3(x + Math.sin(v) * Math.cos(u) * 4.6 * rr, cy + Math.cos(v) * 2.6 * rr, z + Math.sin(v) * Math.sin(u) * 4.6 * rr), s = Rr(1.25, 2.1, r);
      M4.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(r() * 6.28, Rr(-.8, .8, r), Rr(-.8, .8, r)), p, tmp); (r() < .16 ? cb : gb).push(...tmp.toArray()); if (Math.cos(v) < .35) centers.push(p); }
    for (let i = 0; i < 26 && centers.length; i++) { const c = centers.splice(Math.floor(r() * centers.length), 1)[0], s = Rr(.9, 1.3, r); M4.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(r() * 6.28, 0, Rr(-.2, .2, r)), c.add(new V3(0, -.1 * s, 0)), tmp); fb.push(...tmp.toArray()); }       // each mango hangs on its stalk from a real leaf cluster
    centers.length = 0;
    G.obstacles.push({ x, z, r: .55 }); addHot(x, y + 4.5, z, 3.2, 'mangga');
  }
  const tm = trunk.build('mangoTrunk', G.mats.tree); G.cast(tm);
  [[leafG, gb, 'mangoLeaves'], [leafC, cb, 'mangoLeavesNew'], [fruit, fb, 'mangoFruit']].forEach(([mb, buf, name], i) => { const m = mb.build(name, i === 2 ? G.mats.hang : G.mats.tree); m.thinInstanceSetBuffer('matrix', new Float32Array(buf), 16, true); m.thinInstanceRefreshBoundingInfo(true); if (i < 2) G.cast(m); });
})();

/* ---------- bamboo clumps ---------- */
(function bamboo() {
  const culms = new MB(), spray = new MB(), r = rng(515), sb = [];
  for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283; geo.leaf(spray, .3, .032, basis(new V3(Math.sin(a) * .8, -.15 + (k % 3) * .25, Math.cos(a) * .8), UP, V3.Zero(), 0), rgb('#4a7a2a'), rgb('#9ac24a'), { nu: 4, nv: 2, fold: .15, curl: -.15, base: .5, sharp: .4, rib: rgb('#9ac24a') }); }
  for (const [cx, cz] of L.bamboo) {
    const y0 = hFn(cx, cz) - .1;
    for (let k = 0; k < Math.round(15 * Math.max(.7, G.Q)); k++) {
      const a = r() * 6.283, d = Math.sqrt(r()) * 1.3, bx = cx + Math.cos(a) * d, bz = cz + Math.sin(a) * d, H = Rr(7, 11, r), out = Rr(.8, 2.0, r), ya = a + Rr(-.5, .5, r), pts = [];
      for (let i = 0; i <= 26; i++) { const t = i / 26; pts.push(new V3(bx + Math.cos(ya) * out * t * t, y0 + H * t, bz + Math.sin(ya) * out * t * t)); }
      culms.tube(pts, t => (.062 - .034 * t) * (1 + .22 * Math.exp(-Math.pow(((t * H / .38) % 1 - .5) * 2 + .0, 8) * 20)), 10, (t, an) => { const f = (t * H / .38) % 1, ring = f < .06 ? .62 : 1; return shade(mixA(rgb('#8aa238'), rgb('#c9c35a'), .45 + .45 * Math.sin(an * 6.283 + k)), ring * (.88 + .15 * t)); });
      for (let i = 0; i < 34; i++) { const t = Rr(.4, 1, r), p = pts[Math.min(26, Math.floor(t * 26))], s = Rr(1, 1.6, r); M4.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(r() * 6.28, Rr(-.5, .5, r), Rr(-.6, .6, r)), p, tmp); sb.push(...tmp.toArray()); }
    }
    G.obstacles.push({ x: cx, z: cz, r: 1.5 }); addHot(cx, y0 + 3, cz, 2.8, 'kawayan');
  }
  const cm = culms.build('bambooCulms', G.mats.palm); G.cast(cm); const sm = spray.build('bambooLeaves', G.mats.palm); sm.thinInstanceSetBuffer('matrix', new Float32Array(sb), 16, true); sm.thinInstanceRefreshBoundingInfo(true);
})();

/* ---------- bahay kubo (nipa hut) ---------- */
(function kubo() {
  const { x, z, yaw } = L.kubo, y = hFn(x, z) - .05, mb = new MB(), c = Math.cos(yaw), s = Math.sin(yaw), r = rng(31);
  const W = (lx, ly, lz) => new V3(x + lx * c + lz * s, y + ly, z - lx * s + lz * c);
  const pole = (a, b, rad) => { const pts = [], n = Math.max(3, Math.round(V3.Distance(a, b) / .3)); for (let i = 0; i <= n; i++) pts.push(V3.Lerp(a, b, i / n)); mb.tube(pts, t => rad * (1 + .18 * Math.exp(-Math.pow(((t * n) % 1 - .5) * 6, 2))), 7, (t, an) => shade(mixA(rgb('#c4b055'), rgb('#9a8a3c'), .5 + .5 * Math.sin(t * 20 + an * 4)), (t * n) % 1 < .08 ? .65 : 1)); };
  const HX = 2.1, HZ = 1.7, FY = 1.25, WY = 2.0;
  for (const [lx, lz] of [[-HX, -HZ], [HX, -HZ], [-HX, HZ], [HX, HZ], [0, -HZ], [0, HZ]]) pole(W(lx, -.25, lz), W(lx, FY + WY + .1, lz), .065);
  for (let i = 0; i < 16; i++) pole(W(-HX - .1, FY, -HZ + i * (2 * HZ / 15)), W(HX + .1, FY, -HZ + i * (2 * HZ / 15)), .026);                       // floor slats
  for (const lz of [-HZ, HZ]) pole(W(-HX - .15, FY - .08, lz), W(HX + .15, FY - .08, lz), .05);
  const X = new V3(c, 0, -s), Z = new V3(s, 0, c), Y = UP;
  const weave = (o, du, dv, w, h, nu, nv) => mb.grid(nu, nv, (u, v) => [o.x + du.x * u * w + dv.x * v * h, o.y + du.y * u * w + dv.y * v * h, o.z + du.z * u * w + dv.z * v * h], (u, v) => { const a = Math.floor(u * w / .075), b = Math.floor(v * h / .075), k = (a + b) % 2; return shade(k ? rgb('#c9a864') : rgb('#a88a4a'), .88 + .12 * ((a * 7 + b * 13) % 5) / 5 - ((u * w) % .075 < .008 ? .25 : 0)); });
  weave(W(-HX, FY, -HZ), X, Y, 1.35, WY, 18, 26); weave(W(.75, FY, -HZ), X, Y, 1.35, WY, 18, 26); weave(W(-HX, FY + 1.45, -HZ), X, Y, 2 * HX, WY - 1.45, 56, 8);       // front wall with a door opening
  weave(W(-HX, FY, HZ), X, Y, 2 * HX, WY, 56, 26); weave(W(-HX, FY, -HZ), Z, Y, 2 * HZ, WY, 46, 26); weave(W(HX, FY, -HZ), Z, Y, 2 * HZ, WY, 46, 26);
  const rf = (p00, p10, p01, p11, w, h) => mb.grid(Math.round(w / .08), Math.round(h / .16), (u, v) => { const a = V3.Lerp(p00, p10, u), b = V3.Lerp(p01, p11, u), p = V3.Lerp(a, b, v), row = Math.floor(v * h / .16); return [p.x + Math.sin(u * 140 + row) * .012, p.y + Math.sin(u * 90 + row * 3) * .014 - (v * h % .16) * .15, p.z]; }, (u, v) => { const row = Math.floor(v * h / .16), f = (v * h % .16) / .16; return shade(mixA(rgb('#a28a42'), rgb('#cdb468'), (Math.sin(u * 160 + row * 2) + 1) / 2), .72 + .3 * f + .08 * Math.sin(row)); });
  const eY = FY + WY, rY = eY + 2.5, ox = HX + .75, oz = HZ + .65, rx = .75;
  const e00 = W(-ox, eY, -oz), e10 = W(ox, eY, -oz), e01 = W(ox, eY, oz), e11 = W(-ox, eY, oz), r0 = W(-rx, rY, 0), r1 = W(rx, rY, 0);
  rf(e00, e10, r0, r1, 5, 3); rf(e01, e11, r1, r0, 5, 3); rf(e11, e00, r0, r0, 3.6, 3); rf(e10, e01, r1, r1, 3.6, 3);
  mb.tube([r0, r1], .12, 8, t => mixA(rgb('#8a7035'), rgb('#a28a42'), t));
  const A = W(-1.0, 0, -HZ - 1.5), Bp = W(-.4, FY + .05, -HZ - .1);                                                                    // ladder
  for (const dx of [-.28, .28]) pole(W(-.7 + dx, 0, -HZ - 1.5), W(-.7 + dx, FY + .05, -HZ - .1), .028);
  for (let i = 1; i < 6; i++) { const t = i / 6; pole(W(-.98, FY * t, -HZ - 1.5 + 1.4 * t), W(-.42, FY * t, -HZ - 1.5 + 1.4 * t), .016); }
  mb.grid(1, 1, (u, v) => { const p = W(HX - 1.4 + u * 1.2, FY + .55 + v * .7 + .3 * u, HZ + .02 + .0); return [p.x, p.y, p.z]; }, () => rgb('#9a7a3a'));
  const m = mb.build('bahayKubo'); G.cast(m);
  G.obstacles.push({ x, z, r: 2.7 }); addHot(x, y + 2.2, z, 3.4, 'bahaykubo');
})();

/* ---------- tubod (the well) ---------- */
(function well() {
  const { x, z } = L.well, y = hFn(x, z) - .05, mb = new MB(), r = rng(12), R0 = .95, H = .9;
  mb.grid(56, 10, (u, v) => { const a = u * 6.283, row = Math.floor(v * 10), rr = R0 + .04 * Math.sin(u * 56 + row * 2.3) + .03 * G.vnoise(u * 20, row); return [x + Math.cos(a) * rr, y + v * H, z + Math.sin(a) * rr]; }, (u, v) => { const cell = G.vnoise(Math.floor(u * 28) + 3, Math.floor(v * 10) * 1.7); return shade(mixA(rgb('#8d8b84'), rgb('#bdb9ae'), cell), (Math.floor(u * 28 + (Math.floor(v * 10) % 2) * .5) !== u * 28 ? 1 : 1) * (.85 + .2 * cell) * ((v * 10) % 1 < .08 ? .62 : 1)); });
  mb.grid(56, 3, (u, v) => { const a = u * 6.283, rr = R0 + .12 - v * .38; return [x + Math.cos(a) * rr, y + H + .02, z + Math.sin(a) * rr]; }, () => rgb('#a8a49a'));
  mb.grid(32, 1, (u, v) => { const a = u * 6.283; return [x + Math.cos(a) * (R0 - .25) * (1 - v), y + H - .55, z + Math.sin(a) * (R0 - .25) * (1 - v)]; }, () => rgb('#08151a'));
  const wood = rgb('#6b4a30');
  for (const sx of [-1.1, 1.1]) mb.tube([new V3(x + sx, y, z), new V3(x + sx, y + 2.5, z)], .07, 7, () => wood);
  mb.tube([new V3(x - 1.2, y + 2.4, z), new V3(x + 1.2, y + 2.4, z)], .06, 7, () => wood);
  for (const sgn of [-1, 1]) mb.grid(8, 4, (u, v) => [x - 1.45 + u * 2.9, y + 2.4 + (1 - Math.abs(u * 2 - 1)) * .62 * 1 + 0, z + sgn * (.05 + v * .75) * (1 - 0)], (u, v) => shade(mixA(rgb('#5a3b28'), rgb('#7a5236'), (Math.floor(u * 14) % 2) * .6), 1 - v * .12));
  mb.tube([new V3(x, y + 2.3, z), new V3(x + .03, y + 1.5, z), new V3(x, y + H + .45, z)], .01, 4, () => rgb('#d8c9a0'));
  mb.grid(14, 5, (u, v) => { const a = u * 6.283; return [x + Math.cos(a) * (.17 - v * .02), y + H + .12 + v * .24, z + Math.sin(a) * (.17 - v * .02)]; }, (u, v) => shade(rgb('#7a5236'), .85 + .2 * Math.sin(u * 40)));
  const m = mb.build('tubod'); G.cast(m); G.obstacles.push({ x, z, r: 1.35 }); addHot(x, y + 1.2, z, 1.9, 'tubod');
})();

/* ---------- duyan: a hammock between two coconut palms ---------- */
(function hammock() {
  const hm = L.hammock, y = hFn(hm.x, hm.z1), srcs = G.palmSrc[1], pts = geo.palmTrunk[62]; if (!srcs || !pts) return;
  const at = (z) => { const gy = hFn(hm.x, z) - .05; srcs.forEach((src, l) => { const m = src.createInstance('hamPalm' + z + l); m.position.set(hm.x, gy, z); m.isPickable = false; m.setEnabled(false); (G.hamInst = G.hamInst || {})[z + ':' + l] = m; });
    G.trees.push({ x: hm.x, z, levels: [0, 1, 2].map(l => [G.hamInst[z + ':' + l]]), t: [26, 62, 170], cur: -1, sway: false, ph: 0 }); G.claim(hm.x, z, .5, true, 'hammock palm'); let bi = 0; pts.forEach((q, i) => { if (Math.abs(q.y - 1.75) < Math.abs(pts[bi].y - 1.75)) bi = i; }); return { c: new V3(hm.x + pts[bi].x, gy + pts[bi].y, z + pts[bi].z), t: bi / 24, gy }; };
  const pa = at(hm.z1), pb = at(hm.z2), rad = t => .33 * (1 - t) + .18 * t + .17 * Math.exp(-t * 15), dz = Math.sign(pb.c.z - pa.c.z);
  const A = new V3(pa.c.x, pa.c.y, pa.c.z + dz * (rad(pa.t) + .03)), Bp = new V3(pb.c.x, pb.c.y, pb.c.z - dz * (rad(pb.t) + .03)); const mb = new MB(), dir = Bp.subtract(A), len = dir.length(), side = new V3(-dir.z, 0, dir.x).normalize(), sag = .75;
  const pos = (t, v) => { const w = .12 + (.85 - .12) * Math.pow(Math.sin(Math.PI * t), .55), lat = (v - .5) * w, p = V3.Lerp(A, Bp, t); return [p.x - A.x + side.x * lat, p.y - A.y - sag * 4 * t * (1 - t) - .12 * (1 - 4 * (v - .5) ** 2) * Math.sin(Math.PI * t), p.z - A.z + side.z * lat]; };
  mb.grid(36, 10, (u, v) => pos(u, v), (u, v) => { const k = Math.floor(v * 9) % 3, c = [rgb('#e0522a'), rgb('#f4e6c0'), rgb('#2a7a8a')][k]; return shade(c, .88 + .12 * Math.sin(u * 160)); });
  for (const e of [0, 1]) for (let i = 0; i < 7; i++) { const t = e ? .97 : .03, p0 = pos(t, i / 6), end = e ? Bp.subtract(A) : V3.Zero(); mb.tube([new V3(p0[0], p0[1], p0[2]), end.add(new V3(0, .1, 0))], .006, 3, () => rgb('#d8c9a0')); }
  const m = mb.build('duyan', G.mats.hang); m.position.copyFrom(A); G.cast(m);
  addHot((A.x + Bp.x) / 2, A.y - .5, (A.z + Bp.z) / 2, 1.5, 'duyan');
})();

/* ---------- clay pots (the plants in them are placed in garden.js) ---------- */
(function pots() {
  const mb = new MB(), prof = [[0, 0], [.1, 0], [.16, .02], [.2, .22], [.215, .3], [.2, .36], [.215, .4], [.22, .44]];
  for (const s of G.potSpots) { const sc = s.s; mb.grid(18, 14, (u, v) => { const f = v * (prof.length - 1), i = Math.min(prof.length - 2, Math.floor(f)), t = f - i, rr = lerp(prof[i][0], prof[i + 1][0], t) * sc * 1.15, yy = lerp(prof[i][1], prof[i + 1][1], t) * sc * 1.15; return [s.x + Math.cos(u * 6.283) * rr, s.y + yy, s.z + Math.sin(u * 6.283) * rr]; }, (u, v) => shade(rgb('#b0643a'), (v > .78 ? .8 : .95) + .1 * Math.sin(u * 30))); G.obstacles.push({ x: s.x, z: s.z, r: .28 }); }
  if (mb.n) G.cast(mb.build('clayPots'));
})();

/* ---------- orchids on the trunks ---------- */
(function orchids() {
  const vars = [geo.orchid(1)[0].build('orch1', G.mats.hang), geo.orchid(2)[0].build('orch2', G.mats.hang), geo.orchid(3)[0].build('orch3', G.mats.hang)], bufs = [[], [], []], r = rng(90), n = new V3();
  const place = (base, out, s) => { const q = B.Quaternion.FromRotationMatrix(basis(out, UP, V3.Zero(), 0)); M4.ComposeToRef(new V3(s, s, s), q, base, tmp); bufs[Math.floor(r() * 3)].push(...tmp.toArray()); };
  const T0 = L.tree, ty = hFn(T0.x, T0.z), trunk = geo.ilangTrunk && geo.ilangTrunk[11];
  if (trunk) { for (let i = 0; i < 12; i++) { const t = Rr(.1, .42, r), p = geo.ptAt(trunk, t), a = r() * 6.283, out = new V3(Math.cos(a), .05, Math.sin(a)), rad = .2 * (1 - t) + .07 * t + .12 * Math.exp(-t * 12) + .03; place(new V3(T0.x + p.x + out.x * rad, ty + p.y, T0.z + p.z + out.z * rad), out, Rr(1.5, 2.1, r)); } addHot(T0.x, ty + 1.8, T0.z, 1.4, 'plant', 'orkidyas'); }
  let used = 0; for (const tr of G.trees || []) { if (tr.pidx === undefined || used >= 7) continue; used++; const pts = geo.palmTrunk[[31, 62, 93, 124][tr.pidx]], ys = tr.yaw, cy = Math.cos(ys), sy = Math.sin(ys), gy = hFn(tr.x, tr.z) - .05;
    for (let i = 0; i < 3; i++) { const t = Rr(.08, .3, r), p = geo.ptAt(pts, t), a = r() * 6.283, ox = Math.cos(a), oz = Math.sin(a), lx = p.x * tr.sc, lz = p.z * tr.sc, wx = tr.x + lx * cy + lz * sy, wz = tr.z - lx * sy + lz * cy, rad = (.33 * (1 - t) + .18 * t) * tr.sc;
      place(new V3(wx + ox * rad, gy + p.y * tr.sc, wz + oz * rad), new V3(ox, .05, oz), Rr(1.5, 2.1, r)); } addHot(tr.x, gy + 2.2, tr.z, 1.2, 'plant', 'orkidyas'); }
  vars.forEach((m, i) => { if (bufs[i].length) { m.thinInstanceSetBuffer('matrix', new Float32Array(bufs[i]), 16, true); m.thinInstanceRefreshBoundingInfo(true); } else m.setEnabled(false); });
})();

/* ---------- tapayan info on the clay jars by the stairs ---------- */
for (const [lx, lz] of [[-.4, -6.4], [-4, -6.2], [.9, -6.3]]) { const p = G.houseLocalToWorld(lx, .5, lz); G.hot.push({ pos: p, r: .6, kind: 'tapayan' }); }

G.systems.add('pond', t => G.updatePond(t), { order: 33 });
})();
