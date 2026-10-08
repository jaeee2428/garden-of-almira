/* =====================================================================
   fauna/night-glow.js - glowing bluebells, fireflies close to you, strings of fairy lights
   Needs fx/magic.js (G.addOrb) for the fairy lights.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng, scene, hFn } = G, geo = G.geo;
const Rr = (a, b, r) => a + (b - a) * r(), R = G.R, rand = G.rand, UP = V3.Up(), P = G.POND, T0 = G.L.tree;
const { hash, soft, part, avoid } = G.faunaKit;
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
})();
