/* =====================================================================
   fauna/birds.js - maya sparrows on the roof ridge and in the sky, and the egret by the pond
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng, scene, hFn } = G, geo = G.geo;
const Rr = (a, b, r) => a + (b - a) * r(), R = G.R, rand = G.rand, UP = V3.Up(), P = G.POND, T0 = G.L.tree;
const { hash, soft, part, avoid } = G.faunaKit;
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
G.systems.add('birds', (t, dt) => updateBirds(t, G.faunaKit.dt(dt), G.camera.position, G.faunaKit.isDay()), { order: 61 });
})();
