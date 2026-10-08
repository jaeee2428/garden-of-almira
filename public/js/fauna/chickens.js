/* =====================================================================
   fauna/chickens.js - native Filipino chickens: a rooster, three hens and their chicks
   Built once from procedural parts, then instanced. A small state machine per bird: idle / walk / peck / crow.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng, scene, hFn } = G, geo = G.geo;
const Rr = (a, b, r) => a + (b - a) * r(), R = G.R, rand = G.rand, UP = V3.Up(), P = G.POND, T0 = G.L.tree;
const { hash, soft, part, avoid } = G.faunaKit;
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
    // Everything above the legs hangs off a torso pivot at hip height, so pecking / crowing tilts the
    // body, head, tail and wings TOGETHER over the planted legs (the head used to stay put and float off the neck).
    const torso = a.torso = new B.TransformNode('torso', scene); torso.parent = root;
    if (kind === 'chick') { const hipC = new V3(0, .056, 0); a.hipY = hipC.y; torso.position.copyFrom(hipC); a.body = inst(set.body, torso, hipC.scale(-1)); a.legL = inst(set.leg, root, new V3(-.017, .056, 0)); a.legR = inst(set.leg, root, new V3(.017, .056, 0)); a.S = R(.9, 1.1); root.scaling.setAll(a.S); }
    else { const s = set.m, S = set.S, hip = new V3(0, .19, -.01), rel = (x, y, z) => new V3(x - hip.x, y - hip.y, z - hip.z); a.hipY = hip.y; a.neckTop = rel(0, .45, .2);
      root.scaling.setAll(S); torso.position.copyFrom(hip);
      a.body = inst(s.body, torso, rel(0, 0, 0)); a.head = inst(s.head, torso, a.neckTop.clone()); a.tail = inst(s.tail, torso, rel(0, .31, -.17)); a.wingR = inst(s.wing, torso, rel(.108, .31, .03)); a.wingL = inst(s.wing, torso, rel(-.108, .31, .03)); a.wingL.scaling.x = -1;
      a.legL = inst(s.leg, root, new V3(-.052, .19, -.01)); a.legR = inst(s.leg, root, new V3(.052, .19, -.01)); a.legL.scaling.x = -1; G.cast(a.body); }
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
    const av = G.avatar; if (av && av.active && a.state !== 'flee') {                       // you come too close (closer still if you walk slowly): they scatter
      const dx = a.x - av.x, dz = a.z - av.z, d = Math.hypot(dx, dz), reach = .9 + .45 * av.speed;
      if (d < reach && av.speed > .35) { a.state = 'flee'; a.timer = R(.9, 1.6); a.fleeYaw = Math.atan2(dx, dz) + R(-.5, .5); if (!chick) a.flap = .7; }
    }
    if (a.state === 'idle') { a.spd += (0 - a.spd) * Math.min(1, dt * 6); if (a.timer <= 0) { const q = rand(); if (chick && a.leader) { a.state = 'walk'; a.tx = a.leader.x + Rr(-1, 1, rand); a.tz = a.leader.z + Rr(-1, 1, rand); a.timer = R(1, 2.5); } else if (q < .45) { a.state = 'peck'; a.timer = R(1.4, 3.2); } else { for (let k = 0; k < 10; k++) { const ang = rand() * 6.283, d = R(2, 6), x = (a.leader ? a.leader.x : a.x) + Math.cos(ang) * d, z = (a.leader ? a.leader.z : a.z) + Math.sin(ang) * d; if (Math.hypot(x - G.chickenHome.x, z - G.chickenHome.z) < 18 && !G.blocked(x, z, 0)) { a.tx = x; a.tz = z; a.state = 'walk'; a.timer = R(3, 7); break; } } if (a.state !== 'walk') a.timer = 1; } if (a.kind === 'rooster' && rand() < .22) { a.state = 'crow'; a.timer = 1.6; } if (a.kind === 'hen' && rand() < .06) { a.flap = 1.2; } } }
    else if (a.state === 'peck') { a.spd += (0 - a.spd) * Math.min(1, dt * 6); if (a.timer <= 0) { a.state = 'idle'; a.timer = R(.5, 2); } }
    else if (a.state === 'flee') { let dy = a.fleeYaw - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * Math.min(1, dt * 10); a.spd += ((chick ? 1.5 : 2.1) - a.spd) * Math.min(1, dt * 6); if (a.timer <= 0) { a.state = 'idle'; a.timer = R(.8, 2); } }
    else if (a.state === 'crow') { a.spd = 0; if (a.timer <= 0) { a.state = 'idle'; a.timer = R(3, 8); } }
    else if (a.state === 'walk') { const dx = a.tx - a.x, dz = a.tz - a.z, d = Math.hypot(dx, dz); if (d < .25 || a.timer <= 0) { a.state = 'idle'; a.timer = R(.6, 2.5); } else { const want = Math.atan2(dx, dz); let dy = want - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * Math.min(1, dt * 5); a.spd += ((chick ? .85 : .55) - a.spd) * Math.min(1, dt * 4); } }
    if (a.spd > .01) { const nx = a.x + Math.sin(a.yaw) * a.spd * dt, nz = a.z + Math.cos(a.yaw) * a.spd * dt, p = avoid(a, nx, nz, chick ? .15 : .25); a.x = p[0]; a.z = p[1]; }
    const gy = hFn(a.x, a.z), w = a.spd > .05 ? 1 : 0, sw = Math.sin(t * (chick ? 16 : 9) + a.ph) * w; a.root.position.set(a.x, gy, a.z); a.root.rotation.y = a.yaw;
    if (chick) { a.legL.rotation.x = sw * .9; a.legR.rotation.x = -sw * .9; a.torso.position.y = a.hipY + Math.abs(sw) * .006; a.torso.rotation.x = a.state === 'peck' ? .5 + Math.sin(t * 12 + a.ph) * .3 : 0; }
    else { a.legL.rotation.x = sw * .75; a.legR.rotation.x = -sw * .75; a.torso.position.y = a.hipY + Math.abs(Math.sin(t * 9 + a.ph)) * w * .008;
      const peck = a.state === 'peck' ? 1 : 0, crow = a.state === 'crow' ? Math.sin(Math.min(1, (1.6 - a.timer) / 1.6) * Math.PI) : 0;
      a.head.rotation.x = peck * (.95 + Math.sin(t * 11 + a.ph) * .3) - crow * .6 + w * Math.sin(t * 9 + a.ph) * .12; a.head.position.z = a.neckTop.z + w * Math.sin(t * 9 + a.ph + 1.2) * .012; a.head.position.y = a.neckTop.y + crow * .02; a.torso.rotation.x = peck * .32 - crow * .22;
      a.tail.rotation.x = -.15 + Math.sin(t * 1.3 + a.ph) * .05 + crow * .2 + w * Math.sin(t * 9) * .05; a.flap = Math.max(0, a.flap - dt); const fl = a.flap > 0 ? Math.sin(t * 34) * .9 : 0; a.wingR.rotation.z = -fl - crow * .6; a.wingL.rotation.z = fl + crow * .6; a.wingR.rotation.y = a.wingL.rotation.y = 0; }
    a.hot.pos.set(a.x, gy + (chick ? .08 : .3), a.z);
  }
}
G.systems.add('chickens', (t, dt) => updateChicken(t, G.faunaKit.dt(dt), G.camera.position), { order: 60 });
})();
