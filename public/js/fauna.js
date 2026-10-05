/* =====================================================================
   fauna.js - the living things
   native Filipino chickens (hens, rooster, chicks) · maya & other birds ·
   an egret by the pond · alibangbang (butterflies) · gamu-gamo (moths) ·
   alitaptap (fireflies) · diwata fairies · a fairy door and glowing bluebells
   All animals are instanced from a few shared meshes and skip work when far.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng, scene, hFn } = G, geo = G.geo;
const Rr = (a, b, r) => a + (b - a) * r(), R = G.R, rand = G.rand, UP = V3.Up(), P = G.POND, T0 = G.L.tree;
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

Object.assign(G.INFO_OTHER, {
  hen: { ceb: 'Manok', sci: 'native chicken (hen)', color: '#c8782a', fact: 'Free-range native chickens scratch around almost every Visayan yard. The hen leads her chicks, clucking, and teaches them where to peck.' },
  rooster: { ceb: 'Tandang', sci: 'native rooster', color: '#d06a1a', fact: 'The rooster guards the flock and crows at first light. Native roosters are lean and long-legged, with a glossy green-black tail.' },
  sisiw: { ceb: 'Sisiw', sci: 'chick', color: '#ffd65a', fact: 'Chicks stay close to the mother hen all day and hide under her wings when it rains or when a hawk passes.' },
  maya: { ceb: 'Maya', sci: 'Passer montanus', color: '#a0522d', fact: 'The Eurasian tree sparrow, locally called maya, lives around houses and rice fields all over the Philippines. It nests in roofs and tree holes.' },
  tagak: { ceb: 'Tagak', sci: 'egret', color: '#ffffff', fact: 'Egrets stand still at the edge of ponds and rice paddies and strike with a quick stab of the bill. They sleep in tall trees at dusk.' },
  alibangbang: { ceb: 'Alibangbang', sci: 'butterfly', color: '#ffd24a', fact: 'The Cebuano word for butterfly. They sip nectar from flowers and rest with their wings open when the sun is warm.' },
  gamugamo: { ceb: 'Gamu-gamo', sci: 'moth', color: '#d8cdb0', fact: 'Moths come out at night and circle any light. The porch lamp of a Visayan house is always surrounded by them.' },
});

/* ---------- shared pieces ---------- */
const soft = (n) => { const t = new B.DynamicTexture(n, { width: 64, height: 64 }, scene, true), g = t.getContext(), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); t.update(); t.hasAlpha = true; return t; };
const vc = G.vc;
const part = (mb, pivot) => { const m = mb.build('fauna', vc); m.setEnabled(false); m.isPickable = false; m.metadata = { pivot }; return m; };
const sub = (a, b) => a.subtract(b);
function avoid(a, x, z, rad) {                                                           // walk around obstacles instead of through them
  for (const o of G.obstacles) {
    if (o.box) { const c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = x - o.x, dz = z - o.z; let lx = dx * c - dz * s, lz = dx * s + dz * c; const bx = o.hw + rad, bz = o.hd + rad; if (Math.abs(lx) < bx && Math.abs(lz) < bz) { if (bx - Math.abs(lx) < bz - Math.abs(lz)) lx = Math.sign(lx || 1) * bx; else lz = Math.sign(lz || 1) * bz; x = o.x + lx * c + lz * s; z = o.z - lx * s + lz * c; } }
    else { const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), m = o.r + rad; if (d < m && d > .001) { x = o.x + dx / d * m; z = o.z + dz / d * m; } }
  }
  const sx = G.shoreX(z) + 3; if (x < sx) x = sx; const pd = Math.hypot(x - P.x, z - P.z); if (pd < P.r + .6) { x = P.x + (x - P.x) / pd * (P.r + .6); z = P.z + (z - P.z) / pd * (P.r + .6); } return [x, z];
}

/* ====================== chickens ====================== */
const CH = {
  hen1: { body: '#9a5a2a', belly: '#c89050', hackle: '#d8a040', wing: '#7a3e1a', tail: ['#1a1410', '#3a2a1a'], comb: '#d02a2a', rooster: false },
  hen2: { body: '#1c1c22', belly: '#2a2c34', hackle: '#2a3a34', wing: '#16161c', tail: ['#0e1a16', '#2c5a44'], comb: '#c02222', rooster: false },
  hen3: { body: '#8a7860', belly: '#b8a888', hackle: '#a89070', wing: '#6a5a46', tail: ['#2a2218', '#5a4a34'], comb: '#cc2a2a', rooster: false, speckle: true },
  roo: { body: '#a8421c', belly: '#8a3a1a', hackle: '#e8a830', wing: '#8a2c10', tail: ['#0e3a28', '#5a3a8a'], comb: '#e02a22', rooster: true },
};
function chickenParts(v) {
  const c = CH[v], roo = c.rooster, S = roo ? 1.25 : 1, r = rng(v.length * 91 + 3), P0 = new V3(0, 0, 0);
  const body = new MB(), head = new MB(), legL = new MB(), tail = new MB(), wing = new MB();
  const feather = (base, belly, speck) => (u, vv) => { const k = .86 + .14 * Math.sin(u * 46 + vv * 28) * Math.sin(vv * 14), sp = speck ? (hash(Math.floor(u * 38), Math.floor(vv * 22)) > .78 ? 1.45 : 1) : 1; return shade(mixA(rgb(base), rgb(belly), clamp((vv - .5) * 2.2, 0, 1)), k * sp); };
  body.ellipsoid(0, .27, -.01, .118, .12, .195, 22, 14, feather(c.body, c.belly, c.speckle));
  body.ellipsoid(0, .245, .125, .098, .105, .1, 16, 10, feather(c.body, c.belly, c.speckle));
  body.ellipsoid(0, .3, -.15, .075, .08, .09, 14, 9, feather(c.body, c.body, c.speckle));
  body.tube([new V3(0, .33, .12), new V3(0, .39, .17), new V3(0, .45, .2)], [.062, .035], 12, (t, a) => shade(mixA(rgb(c.body), rgb(c.hackle), .35 + .65 * t), .9 + .12 * Math.sin(a * 30 + t * 20)));
  for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283, y0 = .34 + (i % 3) * .035, dir = new V3(Math.sin(a) * .5, -.55, Math.cos(a) * .5 - .45).normalize(); geo.leaf(body, .1, .034, basis(dir, UP, new V3(Math.sin(a) * .05, y0, .15 + Math.cos(a) * .035), 0), rgb(c.hackle), shade(rgb(c.hackle), .72), { nu: 4, nv: 2, fold: .2, curl: -.1, base: .55, sharp: .5 }); }       // hackle feathers
  if (roo) for (let i = 0; i < 14; i++) { const a = Rr(-1.1, 1.1, r), dir = new V3(Math.sin(a) * .75, -.4, -.9).normalize(); geo.leaf(body, .17, .035, basis(dir, UP, new V3(Math.sin(a) * .1, .35, -.1 - r() * .06), 0), rgb('#d08a22'), rgb('#8a3a10'), { nu: 5, nv: 2, fold: .15, curl: -.2, base: .5, sharp: .5 }); }   // saddle feathers
  // head (pivots at the top of the neck)
  const hy = .45, hz = .2;
  head.ellipsoid(0, .015, .02, .031, .035, .046, 14, 10, (u, vv) => shade(mixA(rgb(c.body), rgb(c.hackle), .5), .95));
  head.tube([new V3(0, .008, .058), new V3(0, .002, .1)], [.016, .0025], 8, () => rgb('#e8b04a')); head.tube([new V3(0, -.004, .056), new V3(0, -.008, .09)], [.011, .002], 6, () => rgb('#d8a03a'));
  const cb = roo ? 7 : 4; for (let i = 0; i < cb; i++) { const t = i / (cb - 1), h0 = (roo ? .03 : .014) * Math.sin(Math.PI * (.12 + t * .8)) + .004; head.ellipsoid(0, .042 + h0 * .5, -.012 + t * .06, .005, h0, .008, 6, 5, () => rgb(c.comb)); }
  for (const sd of [-1, 1]) { head.ellipsoid(sd * .007, -.028, .048, .006, roo ? .026 : .014, .007, 6, 5, () => rgb(c.comb)); head.ellipsoid(sd * .029, -.002, .012, .008, .011, .004, 6, 5, () => rgb(roo ? '#f0e8e0' : '#d84030')); head.ellipsoid(sd * .026, .018, .034, .0075, .0075, .0075, 7, 5, () => [.03, .02, .02]); head.ellipsoid(sd * .029, .02, .037, .0025, .0025, .0025, 4, 3, () => [1, 1, 1]); }
  // one leg (mirrored for the other) - pivots at the hip
  legL.ellipsoid(0, -.015, 0, .034, .055, .048, 12, 8, feather(c.body, c.body, c.speckle));
  legL.tube([new V3(0, -.05, .004), new V3(0, -.11, .006), new V3(0, -.19, 0)], [.0135, .009], 7, (t, a) => shade(rgb('#dcb450'), .85 + .2 * Math.sin(t * 60)));
  for (const [ang, L] of [[-.4, .055], [0, .062], [.4, .055], [Math.PI, .03]]) legL.tube([new V3(0, -.19, 0), new V3(Math.sin(ang) * L * .6, -.192, Math.cos(ang) * L * .6 * (ang === Math.PI ? 1 : 1)), new V3(Math.sin(ang) * L, -.19, Math.cos(ang) * L)], [.0065, .003], 5, () => rgb('#d0a844'));
  if (roo) legL.tube([new V3(0, -.12, -.01), new V3(0, -.115, -.036)], [.008, .0015], 5, () => rgb('#c8b890'));
  // tail (pivots at the base of the tail)
  const nt = roo ? 9 : 6;
  for (let i = 0; i < nt; i++) { const a = (i - (nt - 1) / 2) * (roo ? .2 : .26), L = roo ? Rr(.3, .44, r) - Math.abs(i - 4) * .018 : Rr(.14, .19, r), dir = new V3(Math.sin(a) * .6, roo ? .5 : .75, -.8).normalize(); geo.leaf(tail, L, roo ? .06 : .05, basis(dir, new V3(Math.sin(a), .4, 0), P0, 0), rgb(c.tail[0]), rgb(c.tail[1]), { nu: roo ? 10 : 6, nv: 3, fold: .1, curl: roo ? -.9 : -.25, base: .8, sharp: .5, rib: rgb(c.tail[1]) }); }
  if (roo) for (let i = 0; i < 4; i++) { const a = (i - 1.5) * .28; geo.leaf(tail, .2, .05, basis(new V3(Math.sin(a) * .6, .85, -.55).normalize(), UP, P0, 0), rgb('#2a1a0c'), rgb('#8a4a1a'), { nu: 5, nv: 2, fold: .1, curl: -.4, base: .7, sharp: .5 }); }
  // one wing (mirrored): three rows of feathers folded along the side
  for (let row = 0; row < 3; row++) { const n = [8, 8, 7][row], L = [.075, .12, .17][row], y = .02 - row * .006; for (let i = 0; i < n; i++) { const t = i / (n - 1), dir = new V3(.12 + row * .06, -.12 - .08 * t, -1).normalize(), pos = new V3(0, y - t * .02, .03 - t * .04 - row * .015); geo.leaf(wing, L * (.85 + .25 * (1 - t)), .042, basis(dir, new V3(1, .15, 0), pos, 0), shade(rgb(c.wing), 1.15 - row * .12), shade(rgb(c.wing), .72 - row * .06), { nu: 5, nv: 2, fold: .1, curl: -.05, base: .5, sharp: .45, rib: shade(rgb(c.wing), .6) }); } }
  const m = { body: part(body), head: part(head), leg: part(legL), tail: part(tail), wing: part(wing) };
  return { m, S, roo, hip: new V3(.052, .19, -.01) };
}
function chickParts(brown) {
  const body = new MB(), leg = new MB(), col = brown ? ['#8a6a3a', '#e0c488'] : ['#ffd65a', '#fff0a0'];
  body.ellipsoid(0, .05, 0, .044, .043, .052, 14, 10, (u, v) => shade(mixA(rgb(col[0]), rgb(col[1]), clamp((v - .5) * 2, 0, 1)), brown && Math.sin(u * 40) > .5 ? .6 : 1));
  body.ellipsoid(0, .095, .04, .03, .031, .031, 12, 8, () => rgb(col[0]));
  body.tube([new V3(0, .092, .066), new V3(0, .09, .082)], [.007, .0015], 5, () => rgb('#e89a3a'));
  for (const sd of [-1, 1]) { body.ellipsoid(sd * .02, .099, .058, .004, .004, .004, 5, 4, () => [.02, .02, .02]); body.ellipsoid(sd * .04, .06, -.005, .011, .022, .028, 8, 6, () => shade(rgb(col[0]), .88)); }
  body.ellipsoid(0, .058, -.055, .016, .018, .018, 8, 6, () => shade(rgb(col[0]), .9));
  leg.tube([new V3(0, 0, 0), new V3(0, -.03, .002), new V3(0, -.055, 0)], [.004, .0028], 4, () => rgb('#e89a3a'));
  for (const ang of [-.4, 0, .4]) leg.tube([new V3(0, -.055, 0), new V3(Math.sin(ang) * .02, -.056, Math.cos(ang) * .02)], [.0022, .0012], 3, () => rgb('#e89a3a'));
  return { body: part(body), leg: part(leg) };
}
const chicken = [];
(function chickens() {
  const sets = { hen1: chickenParts('hen1'), hen2: chickenParts('hen2'), hen3: chickenParts('hen3'), roo: chickenParts('roo') }, chicks = [chickParts(false), chickParts(true)];
  const HOME = new V3(8, 0, 10.5);
  const mk = (kind, set, x, z, leader) => {
    const root = new B.TransformNode('chk', scene), a = { kind, root, x, z, yaw: rand() * 6.28, tx: x, tz: z, state: 'idle', timer: R(.5, 3), ph: rand() * 6.28, spd: 0, leader, hip: set.hip, S: set.S || 1, crow: 0, flap: 0 };
    const inst = (src, par, pos) => { const m = src.createInstance('i'); m.parent = par; if (pos) m.position.copyFrom(pos); m.isPickable = false; return m; };
    if (kind === 'chick') { a.body = inst(set.body, root); a.legL = inst(set.leg, root, new V3(-.017, .056, 0)); a.legR = inst(set.leg, root, new V3(.017, .056, 0)); a.S = R(.9, 1.1); root.scaling.setAll(a.S); }
    else { const s = set.m, S = set.S; root.scaling.setAll(S); a.body = inst(s.body, root); a.head = inst(s.head, root, new V3(0, .45, .2)); a.legL = inst(s.leg, root, new V3(-.052, .19, -.01)); a.legR = inst(s.leg, root, new V3(.052, .19, -.01)); a.legL.scaling.x = -1; a.tail = inst(s.tail, root, new V3(0, .31, -.17)); a.wingR = inst(s.wing, root, new V3(.108, .31, .03)); a.wingL = inst(s.wing, root, new V3(-.108, .31, .03)); a.wingL.scaling.x = -1; G.cast(a.body); }
    a.hot = { pos: new V3(x, .3, z), r: kind === 'chick' ? .2 : .46, kind: kind === 'chick' ? 'sisiw' : kind === 'rooster' ? 'rooster' : 'hen', ref: a }; G.hot.push(a.hot); chicken.push(a); return a;
  };
  const roo = mk('rooster', sets.roo, HOME.x, HOME.z), hens = [mk('hen', sets.hen1, HOME.x + 2, HOME.z + 1), mk('hen', sets.hen2, HOME.x - 2, HOME.z + 2.4), mk('hen', sets.hen3, HOME.x + .5, HOME.z - 2.4)];
  [[0, 0], [0, 1], [0, 0], [1, 1], [1, 0], [2, 0], [2, 1]].forEach(([h, v], i) => mk('chick', chicks[v], hens[h].x + Rr(-.6, .6, rand), hens[h].z + Rr(-.6, .6, rand), hens[h]));
  G.chicken = chicken; G.chickenHome = HOME;
})();
function updateChicken(t, dt, cam) {
  for (const a of chicken) {
    const dxc = a.x - cam.x, dzc = a.z - cam.z, far = dxc * dxc + dzc * dzc > 55 * 55; a.root.setEnabled(!far); if (far) continue;
    a.timer -= dt; const chick = a.kind === 'chick';
    if (a.state === 'idle') { a.spd += (0 - a.spd) * Math.min(1, dt * 6); if (a.timer <= 0) { const q = rand(); if (chick && a.leader) { a.state = 'walk'; a.tx = a.leader.x + Rr(-1, 1, rand); a.tz = a.leader.z + Rr(-1, 1, rand); a.timer = R(1, 2.5); } else if (q < .45) { a.state = 'peck'; a.timer = R(1.4, 3.2); } else { for (let k = 0; k < 10; k++) { const ang = rand() * 6.283, d = R(2, 6), x = (a.leader ? a.leader.x : a.x) + Math.cos(ang) * d, z = (a.leader ? a.leader.z : a.z) + Math.sin(ang) * d; if (Math.hypot(x - G.chickenHome.x, z - G.chickenHome.z) < 18 && !G.blocked(x, z, 0)) { a.tx = x; a.tz = z; a.state = 'walk'; a.timer = R(3, 7); break; } } if (a.state !== 'walk') a.timer = 1; } if (a.kind === 'rooster' && rand() < .22) { a.state = 'crow'; a.timer = 1.6; } if (a.kind === 'hen' && rand() < .06) { a.flap = 1.2; } } }
    else if (a.state === 'peck') { a.spd += (0 - a.spd) * Math.min(1, dt * 6); if (a.timer <= 0) { a.state = 'idle'; a.timer = R(.5, 2); } }
    else if (a.state === 'crow') { a.spd = 0; if (a.timer <= 0) { a.state = 'idle'; a.timer = R(3, 8); } }
    else if (a.state === 'walk') { const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz); if (d < .25 || a.timer <= 0) { a.state = 'idle'; a.timer = R(.6, 2.5); } else { const want = Math.atan2(dx, dz); let dy = want - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * Math.min(1, dt * 5); a.spd += ((chick ? .85 : .55) - a.spd) * Math.min(1, dt * 4); } }
    if (a.spd > .01) { const nx = a.x + Math.sin(a.yaw) * a.spd * dt, nz = a.z + Math.cos(a.yaw) * a.spd * dt, p = avoid(a, nx, nz, chick ? .15 : .25); a.x = p[0]; a.z = p[1]; }
    const gy = hFn(a.x, a.z), w = a.spd > .05 ? 1 : 0, sw = Math.sin(t * (chick ? 16 : 9) + a.ph) * w; a.root.position.set(a.x, gy, a.z); a.root.rotation.y = a.yaw;
    if (chick) { a.legL.rotation.x = sw * .9; a.legR.rotation.x = -sw * .9; a.body.position.y = Math.abs(sw) * .006; a.body.rotation.x = a.state === 'peck' ? .5 + Math.sin(t * 12 + a.ph) * .3 : 0; }
    else { a.legL.rotation.x = sw * .75; a.legR.rotation.x = -sw * .75; a.body.position.y = Math.abs(Math.sin(t * 9 + a.ph)) * w * .008;
      const peck = a.state === 'peck' ? 1 : 0, crow = a.state === 'crow' ? Math.sin(Math.min(1, (1.6 - a.timer) / 1.6) * Math.PI) : 0;
      a.head.rotation.x = peck * (.95 + Math.sin(t * 11 + a.ph) * .3) - crow * .6 + w * Math.sin(t * 9 + a.ph) * .12; a.head.position.z = .2 + w * Math.sin(t * 9 + a.ph + 1.2) * .018; a.head.position.y = .45 + crow * .03; a.body.rotation.x = peck * .32 - crow * .22;
      a.tail.rotation.x = -.15 + Math.sin(t * 1.3 + a.ph) * .05 + crow * .2 + w * Math.sin(t * 9) * .05; a.flap = Math.max(0, a.flap - dt); const fl = a.flap > 0 ? Math.sin(t * 34) * .9 : 0; a.wingR.rotation.z = -fl - crow * .6; a.wingL.rotation.z = fl + crow * .6; a.wingR.rotation.y = a.wingL.rotation.y = 0; }
    a.hot.pos.set(a.x, gy + (chick ? .08 : .3), a.z);
  }
}

/* ====================== birds ====================== */
function birdParts(k) {
  const body = new MB(), wing = new MB(), col = k === 'maya' ? { top: '#9a5a2a', belly: '#d8cdb4', crown: '#8a3a1a', cheek: '#f4f0e8' } : { top: '#3a3a44', belly: '#8a8a94', crown: '#2a2a32', cheek: '#9a9aa4' };
  body.ellipsoid(0, 0, 0, .03, .032, .056, 14, 10, (u, v) => mixA(rgb(col.top), rgb(col.belly), clamp((v - .45) * 2.4, 0, 1)));
  body.ellipsoid(0, .024, .05, .024, .024, .026, 12, 8, (u, v) => v < .35 ? rgb(col.crown) : (Math.cos(u * 6.283) > .1 && v > .45 && v < .8 ? rgb(col.cheek) : rgb(col.belly)));
  body.ellipsoid(0, .005, .068, .016, .012, .008, 6, 5, () => [.05, .04, .04]); body.tube([new V3(0, .022, .07), new V3(0, .02, .088)], [.007, .0015], 5, () => rgb('#3a3028'));
  for (const sd of [-1, 1]) body.ellipsoid(sd * .017, .03, .062, .0035, .0035, .0035, 4, 3, () => [.02, .02, .02]);
  geo.leaf(body, .07, .032, basis(new V3(0, -.12, -1).normalize(), UP, new V3(0, 0, -.045), 0), rgb(col.top), shade(rgb(col.top), .6), { nu: 4, nv: 2, fold: .05, curl: -.05, base: .5, sharp: .5 });
  for (const sd of [-1, 1]) body.tube([new V3(sd * .012, -.025, .004), new V3(sd * .012, -.058, .006)], [.0028, .0018], 4, () => rgb('#b08a6a'));
  for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) { const t = i / 5, dir = new V3(1, -.05 - row * .03, -.25 - t * .35).normalize(); geo.leaf(wing, [.04, .062, .082][row] * (1 - t * .25), .02, basis(dir, UP, new V3(.005, .006 - row * .003, .02 - t * .03), 0), shade(rgb(col.top), 1.1 - row * .12), shade(rgb(col.top), .65), { nu: 3, nv: 2, fold: .05, curl: -.05, base: .5, sharp: .45 }); }
  return { body: part(body), wing: part(wing) };
}
const birds = []; G.birds = birds;
(function makeBirds() {
  const set = birdParts('maya'), set2 = birdParts('dark');
  const mk = (src, o) => { const root = new B.TransformNode('bird', scene), b = { root, body: src.body.createInstance('b'), wingR: src.wing.createInstance('w'), wingL: src.wing.createInstance('w2'), ...o, state: o.perch ? 'perch' : 'fly', timer: R(4, 20), ph: rand() * 6.28 }; b.body.parent = root; b.wingR.parent = root; b.wingL.parent = root; b.wingR.position.set(.026, .008, .012); b.wingL.position.set(-.026, .008, .012); b.wingL.scaling.x = -1; [b.body, b.wingR, b.wingL].forEach(m => m.isPickable = false); b.hot = { pos: new V3(), r: o.perch ? .22 : .5, kind: 'maya', ref: b }; G.hot.push(b.hot); birds.push(b); return b; };
  const H = G.houseLocalToWorld, rz = -.875;
  const perches = [[H(-2, 9.38, rz), 0], [H(.4, 9.38, rz), 1.2], [H(2.3, 9.38, rz), 2.4], [G.arch.curve[12].add(new V3(0, .15, 0)), 0], [G.arch.curve[10].add(new V3(0, .15, 0)), 1.6], [new V3(G.L.kubo.x, hFn(G.L.kubo.x, G.L.kubo.z) + 5.91, G.L.kubo.z), .8]];
  perches.forEach(([p, yaw], i) => { const b = mk(i % 2 ? set : set, { perch: p.clone(), yaw, scale: 1.6 }); b.root.position.copyFrom(p); b.root.rotation.y = yaw; b.root.scaling.setAll(1.6); });
  for (let i = 0; i < 10; i++) { const b = mk(i % 3 ? set : set2, { cx: R(-22, 20), cz: R(-18, 24), rad: R(14, 34), alt: R(11, 26), sp: R(.18, .34) * (i % 2 ? 1 : -1), scale: 2.4 }); b.root.scaling.setAll(2.4); b.flapT = R(0, 3); }
  // the egret
  const eg = new MB(), egn = new MB(), ca = '#fbfbf8';
  eg.ellipsoid(0, .52, 0, .095, .115, .24, 16, 10, (u, v) => shade(rgb(ca), .92 + .1 * v)); eg.ellipsoid(0, .5, -.22, .05, .06, .12, 10, 7, () => rgb(ca));
  for (let i = 0; i < 9; i++) geo.leaf(eg, .2, .03, basis(new V3(Rr(-.25, .25, rand), -.35, -1).normalize(), UP, new V3(Rr(-.04, .04, rand), .6, -.1), 0), rgb(ca), shade(rgb(ca), .85), { nu: 4, nv: 2, fold: .1, curl: -.2, base: .5, sharp: .5 });
  for (const sd of [-1, 1]) { eg.tube([new V3(sd * .04, .42, .01), new V3(sd * .04, .24, .015), new V3(sd * .04, .012, .02)], [.012, .008], 6, () => rgb('#2a2622')); for (const ang of [-.35, 0, .35]) eg.tube([new V3(sd * .04, .012, .02), new V3(sd * .04 + Math.sin(ang) * .05, .01, .02 + Math.cos(ang) * .08)], [.006, .003], 4, () => rgb('#2a2622')); }
  const neck = []; for (let i = 0; i <= 9; i++) { const t = i / 9; neck.push(new V3(0, .06 + t * .34 + Math.sin(t * 5) * .02, Math.sin(t * 3.4) * .1 - .02)); }
  egn.tube(neck, [.034, .016], 8, () => rgb(ca)); const hd = neck[9]; egn.ellipsoid(hd.x, hd.y + .01, hd.z + .02, .026, .024, .04, 10, 7, () => rgb(ca)); egn.tube([new V3(0, hd.y + .004, hd.z + .055), new V3(0, hd.y - .012, hd.z + .21)], [.013, .0025], 6, () => rgb('#e8c23a'));
  for (const sd of [-1, 1]) egn.ellipsoid(sd * .02, hd.y + .02, hd.z + .035, .004, .004, .004, 4, 3, () => [.02, .02, .02]);
  const egBody = part(eg), egNeck = part(egn); const root = new B.TransformNode('egret', scene), a = { root, body: egBody.createInstance('e1'), neck: egNeck.createInstance('e2'), ph: rand() * 6.28, timer: 5, state: 'stand', ang: .35, lunge: 0 };
  a.body.parent = root; a.neck.parent = root; a.neck.position.set(0, .54, .18); a.neck.position.y = .54 - .06; a.neck.position.z = .18; [a.body, a.neck].forEach(m => m.isPickable = false); root.scaling.setAll(1.15); a.hot = { pos: new V3(), r: .6, kind: 'tagak' }; G.hot.push(a.hot); G.egret = a; G.cast(a.body);
})();
function updateBirds(t, dt, cam, day) {
  for (const b of birds) {
    b.root.setEnabled(day); if (!day) continue;
    if (b.perch) {
      b.timer -= dt;
      if (b.state === 'perch') { b.root.position.copyFrom(b.perch); b.wingR.rotation.z = -1.3; b.wingL.rotation.z = 1.3; b.wingR.scaling.x = .5; b.wingL.scaling.x = -.5; b.root.rotation.z = 0; b.root.rotation.y = b.yaw + Math.sin(t * .7 + b.ph) * .55 * (Math.sin(t * .23 + b.ph) > .3 ? 1 : 0); b.root.rotation.x = Math.sin(t * 3 + b.ph) > .985 ? .25 : 0; if (b.timer <= 0) { b.state = 'fly'; b.fly = 0; b.dur = R(7, 13); b.dx = R(-22, 22); b.dz = R(-22, 22); b.up = R(5, 11); b.timer = R(18, 45); } }
      else { b.fly += dt; const u = b.fly / b.dur, s = Math.sin(Math.PI * u), x = b.perch.x + b.dx * s + Math.sin(u * 12.5) * 2.2 * s, y = b.perch.y + b.up * s * (1 + .2 * Math.sin(u * 9)), z = b.perch.z + b.dz * s, dx = x - b.root.position.x, dz = z - b.root.position.z; if (dx * dx + dz * dz > 1e-5) b.root.rotation.y = Math.atan2(dx, dz); b.root.position.set(x, y, z); flapBird(b, t, dt, u < .12 || u > .88 ? 1 : .6); b.root.rotation.z = Math.sin(u * 12.5) * .5 * s; b.root.rotation.x = u > .85 ? -.5 : 0; if (u >= 1) { b.state = 'perch'; b.timer = R(15, 40); b.root.rotation.z = 0; b.root.rotation.x = 0; } }
    } else {
      const a = t * b.sp + b.ph, x = b.cx + Math.cos(a) * b.rad, z = b.cz + Math.sin(a) * b.rad * .8, y = hFn(x, z) + b.alt + Math.sin(t * .4 + b.ph) * 2.2, dx = x - b.root.position.x, dz = z - b.root.position.z;
      if (dx * dx + dz * dz > 1e-5) b.root.rotation.y = Math.atan2(dx, dz); b.root.position.set(x, y, z); b.root.rotation.z = -Math.sign(b.sp) * .35; flapBird(b, t, dt, 0); b.root.rotation.x = Math.sin(t * 1.6 + b.ph) * .08;
    }
    b.hot.pos.copyFrom(b.root.position);
  }
  const e = G.egret; if (e) { e.root.setEnabled(true); const px = P.x + Math.cos(e.ang) * (P.r + .15), pz = P.z + Math.sin(e.ang) * (P.r + .15); e.timer -= dt; if (e.timer <= 0) { e.state = e.state === 'stand' ? 'step' : 'stand'; e.timer = e.state === 'step' ? R(2, 4) : R(5, 11); if (e.state === 'stand' && rand() < .6) e.lunge = 1; } if (e.state === 'step') e.ang += dt * .05;
    const gy = hFn(px, pz); e.root.position.set(px, Math.max(gy, -.4), pz); e.root.rotation.y = e.ang + Math.PI / 2 + .6; e.lunge = Math.max(0, e.lunge - dt * .8); const lg = Math.sin(clamp(1 - e.lunge, 0, 1) * Math.PI) * (e.lunge > 0 ? 1 : 0);
    e.neck.rotation.x = Math.sin(t * .8 + e.ph) * .06 + lg * 1.15; e.neck.position.z = .18 + lg * .06; e.hot.pos.set(px, gy + .6, pz); }
}
function flapBird(b, t, dt, glide) { b.flapT += dt; const cyc = b.flapT % 2.4, flap = cyc < 1.4 || glide ? 1 : .08; const ang = Math.sin(t * 22 + b.ph) * .85 * flap + .05; b.wingR.rotation.z = -ang; b.wingL.rotation.z = ang; b.wingR.scaling.x = 1; b.wingL.scaling.x = -1; }

/* ====================== butterflies & moths ====================== */
const SPEC = [
  { base: '#f6c42a', edge: '#1a1410', spot: '#fff4c0', eye: null, size: 1.1 }, { base: '#2f6fe0', edge: '#0e1a40', spot: '#bfe0ff', eye: '#ff8a2a', size: 1.0 }, { base: '#ff8a3a', edge: '#2a1608', spot: '#ffffff', eye: null, size: .95 },
  { base: '#f4f0e4', edge: '#3a3a3a', spot: '#ffffff', eye: null, size: .85 }, { base: '#8a5ad0', edge: '#1a1030', spot: '#e0c8ff', eye: '#ffd24a', size: 1.0 }, { base: '#e2405a', edge: '#200a10', spot: '#ffe0e8', eye: null, size: .95 },
  { base: '#46b86a', edge: '#0e2a18', spot: '#d8ffd8', eye: null, size: 1.05 }, { base: '#e8d6a0', edge: '#3a2a18', spot: '#ffffff', eye: '#6a4a2a', size: .9 },
];
const MOTH = { base: '#b8a888', edge: '#3a3024', spot: '#f0e8d8', eye: '#5a4a34', size: .8 };
function wingMesh(sp) {
  const mb = new MB(), base = rgb(sp.base), edge = rgb(sp.edge), spot = rgb(sp.spot);
  const wing = (a0, a1, rad, scallop, hind) => mb.grid(14, 12, (u, v) => { const th = lerp(a0, a1, v), rr = rad * (1 + .22 * Math.cos((th - (hind ? -.4 : .55)) * 2.4)) * (1 - scallop * (.5 + .5 * Math.sin(v * 25))), cup = .004 * Math.sin(u * 3.14); return [.004 + Math.cos(th) * rr * u, cup, Math.sin(th) * rr * u]; },
    (u, v) => { const radial = Math.abs(Math.sin(v * 38)) < .1 && u > .15 ? .72 : 1, border = u > .86 ? 1 : 0, dots = u > .89 && (v * 9 % 1) < .3 ? 1 : 0, eye = sp.eye && hind && Math.hypot(u - .62, v - .5) < .12 ? 1 : 0; if (eye) return rgb(sp.eye); if (dots) return spot; if (border) return edge; return shade(mixA(base, shade(base, .78), u * .7), radial * (.95 + .08 * Math.sin(u * 30))); }, null, u => .2 + .8 * u);
  wing(.1, 1.25, .078, 0, false); wing(-1.05, .12, .06, .12, true);
  return mb;
}
function bodyMesh(c) { const mb = new MB(); mb.tube([new V3(0, 0, .022), new V3(0, 0, -.02), new V3(0, -.003, -.062)], [.0055, .0042, .0015], 6, () => rgb(c)); mb.ellipsoid(0, .002, .03, .0065, .0065, .007, 7, 5, () => rgb(c)); for (const sd of [-1, 1]) { mb.tube([new V3(sd * .003, .005, .034), new V3(sd * .012, .016, .06), new V3(sd * .018, .018, .07)], [.0007, .0005], 3, () => rgb(c)); mb.ellipsoid(sd * .018, .018, .071, .0018, .0018, .0018, 4, 3, () => rgb(c)); } return mb; }
const flyers = [];
(function makeFlyers() {
  const wingsSrc = SPEC.map((s, i) => part(wingMesh(s))), body = part(bodyMesh('#2a2018')), mWing = part(wingMesh(MOTH)), mBody = part(bodyMesh('#6a5a44'));
  const mk = (wsrc, bsrc, size, o) => { const root = new B.TransformNode('fly', scene), f = { root, wL: wsrc.createInstance('wl'), wR: wsrc.createInstance('wr'), body: bsrc.createInstance('bd'), size, ...o, ph: rand() * 6.28, flapHz: R(9, 14), timer: R(1, 4), state: 'visit' }; f.wL.parent = f.wR.parent = f.body.parent = root; f.wR.scaling.x = -1; [f.wL, f.wR, f.body].forEach(m => m.isPickable = false); root.scaling.setAll(size * 1.9); f.hot = { pos: new V3(), r: .45, kind: o.moth ? 'gamugamo' : 'alibangbang', ref: f }; G.hot.push(f.hot); flyers.push(f); return f; };
  for (let i = 0; i < 30; i++) { const sp = i % SPEC.length, f = mk(wingsSrc[sp], body, SPEC[sp].size, {}); const pl = G.plants[Math.floor(rand() * G.plants.length)] || { x: 0, z: 0, y: 0, H: 1 }; f.px = pl.x; f.pz = pl.z; f.py = pl.y + pl.H * .75; f.x = pl.x + Rr(-2, 2, rand); f.z = pl.z + Rr(-2, 2, rand); f.y = f.py + 1; f.tx = f.px; f.ty = f.py; f.tz = f.pz; }
  const lamp = G.houseLocalToWorld(-1.5, 4.72, -4.35); for (let i = 0; i < 9; i++) { const f = mk(mWing, mBody, MOTH.size, { moth: true }); f.cx = lamp.x; f.cy = lamp.y; f.cz = lamp.z; f.rad = R(.4, 1.2); f.sp = R(1.2, 2.6) * (i % 2 ? 1 : -1); f.flapHz = R(18, 26); f.x = f.cx; f.y = f.cy; f.z = f.cz; }
  G.flyers = flyers;
})();
function updateFlyers(t, dt, cam, S, day) {
  const wd = G.windState;
  for (const f of flyers) {
    const show = f.moth ? S.night > .35 : day; f.root.setEnabled(show); if (!show) continue;
    const dxc = f.x - cam.x, dzc = f.z - cam.z; if (dxc * dxc + dzc * dzc > 70 * 70) { f.root.setEnabled(false); continue; }
    let flap = 1, slow = 1;
    if (f.moth) { const a = t * f.sp + f.ph, jit = Math.sin(t * 3.3 + f.ph) * .25; f.x = f.cx + Math.cos(a) * (f.rad + jit); f.z = f.cz + Math.sin(a) * (f.rad + jit); f.y = f.cy + Math.sin(t * 1.9 + f.ph) * .4 + Math.sin(a * 2) * .15; }
    else {
      f.timer -= dt;
      if (f.state === 'visit') { const gy = hFn(f.px, f.pz); f.tx = f.px + Math.sin(t * .8 + f.ph) * .35; f.tz = f.pz + Math.cos(t * .7 + f.ph) * .35; f.ty = gy + f.py - hFn(f.px, f.pz) + .1 + Math.sin(t * 1.4 + f.ph) * .12; f.x += (f.tx - f.x) * Math.min(1, dt * 1.6); f.z += (f.tz - f.z) * Math.min(1, dt * 1.6); f.y += (f.ty - f.y) * Math.min(1, dt * 1.6); slow = .35; if (f.timer <= 0) { const pl = G.plants[Math.floor(rand() * G.plants.length)]; if (pl && Math.hypot(pl.x - f.x, pl.z - f.z) < 16) { f.px = pl.x; f.pz = pl.z; f.py = pl.y + pl.H * .75; } f.state = 'travel'; f.timer = R(2, 5); } }
      else { const dx = f.px - f.x, dz = f.pz - f.z, d = Math.hypot(dx, dz) + .001; f.x += (dx / d * 2.2 + wd.dx * wd.gain * .35) * dt; f.z += (dz / d * 2.2 + wd.dz * wd.gain * .35) * dt; f.y += (f.py + 1.0 + Math.sin(t * 2 + f.ph) * .6 - f.y) * Math.min(1, dt * 1.2); if (d < .7 || f.timer <= 0) { f.state = 'visit'; f.timer = R(3, 9); } flap = 1.15; }
    }
    const gy = hFn(f.x, f.z); if (f.y < gy + .25) f.y = gy + .25;
    const dx = f.x - f.root.position.x, dz = f.z - f.root.position.z; if (dx * dx + dz * dz > 1e-6) f.root.rotation.y = Math.atan2(dx, dz); f.root.position.set(f.x, f.y, f.z);
    const ang = Math.sin(t * f.flapHz * flap * (slow < 1 ? .55 : 1) + f.ph) * (slow < 1 ? .6 : 1.0) + .12; f.wL.rotation.z = -ang; f.wR.rotation.z = ang; f.hot.pos.set(f.x, f.y, f.z);
  }
}

/* ====================== fairy door, bluebells, fairy lights, more fireflies ====================== */
(function bluebells() {                                                                  // bluebells that glow softly at night (no door, no fairies)
  const bm = G.mat('bellGlow', { emissive: new C3(.04, .05, .14), specular: C3.Black() }); bm.backFaceCulling = false; G.nightObjs.push({ mat: bm, day: new C3(.05, .06, .16), night: new C3(.25, .38, 1.0) });
  const bell = new MB(), r = rng(808);
  const clump = (bx, bz, n) => { for (let k = 0; k < n; k++) { const yaw = r() * 6.283, h = Rr(.14, .28, r), x0 = bx + Rr(-.08, .08, r), z0 = bz + Rr(-.08, .08, r), pts = [new V3(x0, hFn(x0, z0), z0), new V3(x0 + Math.sin(yaw) * .03, hFn(x0, z0) + h * .6, z0 + Math.cos(yaw) * .03), new V3(x0 + Math.sin(yaw) * .08, hFn(x0, z0) + h, z0 + Math.cos(yaw) * .08)]; bell.tube(pts, [.0018, .001], 3, () => rgb('#4a8a3a'));
    for (let b = 0; b < 5; b++) { const t = .5 + b * .12, p = geo.ptAt(pts, Math.min(.98, t)), a2 = b * 2.2, q = new V3(p.x + Math.cos(a2) * .012, p.y - .012, p.z + Math.sin(a2) * .012); bell.grid(10, 5, (u, v) => { const an = u * 6.283, rr = (.006 + .014 * Math.pow(v, .8)) * (1 + .15 * Math.sin(an * 5) * v); return [q.x + Math.cos(an) * rr, q.y - v * .026, q.z + Math.sin(an) * rr]; }, (u, v) => mixA(rgb('#7a8cff'), rgb('#d8e0ff'), v)); }
    for (let l = 0; l < 3; l++) geo.leaf(bell, .09, .012, basis(new V3(Math.sin(yaw + l * 2), .3, Math.cos(yaw + l * 2)), UP, new V3(x0, hFn(x0, z0), z0), 0), rgb('#2a7a34'), rgb('#6ab04a'), { nu: 4, nv: 2, fold: .2, curl: -.15, base: .7, sharp: .5 }); } };
  [[T0.x - 1.0, T0.z - 1.3, 9], [T0.x - 1.6, T0.z + .3, 8], [T0.x - .1, T0.z - 1.8, 9], [G.L.ring.x + 1.2, G.L.ring.z + 3.3, 8], [G.L.ring.x - 2.9, G.L.ring.z - 1.2, 8], [-20, 18, 8], [-4, 14, 7], [10, -3, 7]].forEach(([x, z, n]) => { if (!G.blocked(x, z, 0) || true) clump(x, z, n); });
  bell.build('bluebells', bm).isPickable = false;
})();
(function nearFireflies() {
  const ps = new B.ParticleSystem('alitaptapNear', 700, scene); ps.particleTexture = soft('flyN'); ps.emitter = G.camera.position; ps.minEmitBox = new V3(-17, -1.6, -17); ps.maxEmitBox = new V3(17, 2.8, 17);
  ps.direction1 = new V3(-.3, -.05, -.3); ps.direction2 = new V3(.3, .25, .3); ps.minEmitPower = .05; ps.maxEmitPower = .3; ps.gravity = new V3(0, .02, 0); ps.minLifeTime = 4; ps.maxLifeTime = 9; ps.emitRate = 0; ps.minSize = .04; ps.maxSize = .1; ps.blendMode = B.ParticleSystem.BLENDMODE_ADD;
  [[0, 0], [.14, .95], [.3, .4], [.5, .95], [.68, .35], [.86, .9], [1, 0]].forEach(([g, a]) => ps.addColorGradient(g, new B.Color4(.9, 1, .45, a)));
  ps.start(); G.firefliesNear = ps; G.onTime.push(S => { ps.emitRate = 150 * Math.pow(S.night, 1.2); });
})();
(function fairyLights() {                                                                      // strings of tiny warm lights on the pergola, the arch and the eave
  if (!G.addOrb) return; const add = (p, s) => G.addOrb(p, s, 0, rand() * 6.28, true);
  G.pergola.frames.forEach(f => { for (let i = -4; i <= 4; i++) add(new V3(f.p.x + f.N.x * i * .42, f.y + 2.44, f.p.z + f.N.z * i * .42), .2); });
  for (let i = 1; i < G.arch.curve.length - 1; i += 1) add(G.arch.curve[i].add(new V3(0, -.06, 0)), .17);
  for (let x = -5.2; x <= 5.2; x += .45) add(G.houseLocalToWorld(x, 5.22, -5.4), .17);
})();

/* ====================== the loop ====================== */
let dayShown = true;
G.updateFauna = (t, dt, frame) => {
  if (G.freezeFauna) dt = 0;
  const cam = G.camera.position, S = G.state, day = (S.night || 0) < .55;
  updateChicken(t, dt, cam); updateBirds(t, dt, cam, day); updateFlyers(t, dt, cam, S, day);
};
})();
