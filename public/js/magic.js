/* =====================================================================
   magic.js - the folk-tale layer
   diwata (nature-spirit lights) · parol star lanterns · a glowing fairy
   ring · floating orbs · drifting gold dust · shooting stars
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, rgb, mixA, shade, clamp, lerp, rng, scene, hFn } = G;
const Rr = (a, b, r) => a + (b - a) * r();
const R = G.R, rand = G.rand, T = G.L.tree, RING = G.L.ring, hexC = h => C3.FromHexString(h);
G.magicK = 0; G.magicTarget = 0;
const NOM = (G.params.get('no') || '').split(',');

Object.assign(G.INFO_OTHER, {
  parol: { ceb: 'Parol', sci: 'star lantern', color: '#ffc24a', fact: 'The star lantern of the Philippines, made of bamboo and capiz shell or paper, hung at Christmas (its name comes from the Spanish “farol”, lantern). San Fernando, Pampanga is famous for giant ones.' },
  fairyring: { ceb: 'Uhong', sci: 'a ring of mushrooms', color: '#9fe8ff', fact: 'Mushrooms (uhong) often spring up in a neat ring on damp ground after the rain. In the garden a few of them glow softly in the dark.' },
});

/* ---------- soft glow sprites (orbs of light) ---------- */
const glowURL = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(.2, 'rgba(255,255,255,.4)'); gr.addColorStop(.5, 'rgba(255,255,255,.1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c.toDataURL(); })();
const orbMgr = new B.SpriteManager('orbs', glowURL, 90, { width: 64, height: 64 }, scene); orbMgr.blendMode = B.Engine.ALPHA_ADD; orbMgr.fogEnabled = false; orbMgr.isPickable = false;
const orbCols = [[1, .86, .5], [1, .72, .86], [.72, .9, 1], [.85, .78, 1], [.78, 1, .85]];
G.orbs = [];
const addOrb = (p, size, ci, ph, nightOnly) => { const s = new B.Sprite('orb', orbMgr); s.isVisible = !NOM.includes('orbs'); const _unused = 0; const s2 = s, c = orbCols[ci ?? Math.floor(rand() * orbCols.length)]; s.position.copyFrom(p); s.size = size; s.color = new B.Color4(c[0], c[1], c[2], .7); s.isPickable = false; G.orbs.push({ s, base: p.clone(), size, c, ph: ph ?? rand() * 6.28, nightOnly: !!nightOnly }); return s; };
G.addOrb = addOrb;
(function orbsInPlaces() {
  const ty = hFn(T.x, T.z);
  for (let i = 0; i < 18; i++) { const a = rand() * 6.283, r = Rr(1.2, 4.2, rand); addOrb(new V3(T.x + Math.cos(a) * r, ty + Rr(2.4, 6.4, rand), T.z + Math.sin(a) * r), Rr(.35, .8, rand)); }
  G.pergola.frames.forEach(f => { for (let k = 0; k < 2; k++) addOrb(f.p.add(f.N.scale(Rr(-1.7, 1.7, rand))).add(new V3(0, f.y + Rr(2.0, 2.4, rand) - f.p.y, 0)), Rr(.3, .55, rand), 1); });
  for (let i = 3; i < G.arch.curve.length - 3; i += 4) addOrb(G.arch.curve[i].add(new V3(Rr(-.1, .1, rand), -.15, Rr(-.1, .1, rand))), Rr(.3, .5, rand), 0);
})();

/* ---------- parol: star lanterns of capiz ---------- */
const parolMat = G.mat('parol', { noLight: true, emissive: new C3(.5, .5, .5) }); parolMat.backFaceCulling = false; G.nightObjs.push({ mat: parolMat, day: new C3(.55, .52, .48), night: new C3(1.7, 1.55, 1.3) });
function parolMesh(colA, colB) {
  const mb = new MB(), R0 = .36, r0 = .16, d = .13, ring = [];
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r0 : R0; ring.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  const tri = (p, q, r_, c1, c2, c3) => { const b = mb.n; mb.p.push(...p, ...q, ...r_); mb.c.push(...c1, 1, ...c2, 1, ...c3, 1); mb.i.push(b, b + 1, b + 2); };
  for (let i = 0; i < 10; i++) { const [x0, y0] = ring[i], [x1, y1] = ring[(i + 1) % 10], tone = i % 2 ? 1 : .8, cc = shade(colA, tone), ce = shade(colB, tone * .95); tri([0, 0, -d], [x0, y0, 0], [x1, y1, 0], cc, ce, ce); tri([0, 0, d], [x1, y1, 0], [x0, y0, 0], cc, ce, ce); }
  for (const sx of [-.09, .09]) mb.grid(1, 8, (u, v) => [sx + (u - .5) * .07 * (1 - v * .5) + Math.sin(v * 3) * .02, -.24 - v * .62, 0], (u, v) => shade(Math.floor(v * 8) % 2 ? colA : colB, 1 - v * .25));
  const m = mb.build('parol', parolMat); m.alwaysSelectAsActiveMesh = true; return m;
}
G.parols = [];
(function parols() {
  const variants = [[rgb('#ffc13a'), rgb('#ff6a2a')], [rgb('#ff4a4a'), rgb('#ffcf5a')], [rgb('#4aa0ff'), rgb('#e8f4ff')], [rgb('#5ad07a'), rgb('#fff1a0')], [rgb('#ff7ac8'), rgb('#ffe0f0')]].map(([a, b]) => parolMesh(a, b));
  const items = [], ty = hFn(T.x, T.z);
  // every parol hangs from a pivot that sits on something real: a branch, a pergola beam or the bamboo batten under the eave
  const put = (pivot, s, ci) => { const L = .45 + .36 * s, pos = pivot.add(new V3(0, -L, 0)); items.push({ pivot: pivot.clone(), L, s, ci, yaw: rand() * 6.28, ph: rand() * 6.28 }); G.parols.push(pos.clone()); G.hot.push({ pos: pos.clone(), r: .5 * s, kind: 'parol', parolIdx: items.length - 1 }); addOrb(pos, 1.5 * s, 0, rand() * 6); items[items.length - 1].orb = G.orbs[G.orbs.length - 1]; };
  const bd = (G.geo.ilangBranches && G.geo.ilangBranches[11]) || [], cand = bd.filter(b => b.lv >= 2 && b.k % 2 === 0), pickB = [];
  while (pickB.length < 7 && cand.length) pickB.push(cand.splice(Math.floor(rand() * cand.length), 1)[0]);
  pickB.forEach((br, i) => { const u = Rr(.5, .82, rand), p = G.geo.ptAt(br.pts, u), rad = lerp(.06, .014, u); put(new V3(T.x + p.x, ty + p.y - rad - .01, T.z + p.z), Rr(1.2, 1.7, rand), i % 5); });
  G.pergola.frames.slice(0, 4).forEach((f, i) => { const off = i % 2 ? .8 : -.8; put(new V3(f.p.x + f.N.x * off, f.y + 2.47, f.p.z + f.N.z * off), 1.0, (i + 2) % 5); });
  const H = G.houseLocalToWorld; [-3.3, 0, 3.3].forEach((lx, i) => put(H(lx, 5.265, -5.4), 1.0, (i + 1) % 5));
  const bufs = variants.map(() => new Float32Array(items.length * 16)), counts = variants.map(() => 0);
  const cord = B.MeshBuilder.CreateCylinder('parolCord', { height: 1, diameter: .012, tessellation: 4 }, scene); cord.material = G.mat('cordM', { diffuse: new C3(.8, .74, .55), specular: C3.Black() }); cord.isPickable = false; cord.alwaysSelectAsActiveMesh = true;
  const cbuf = new Float32Array(items.length * 16); cord.thinInstanceSetBuffer('matrix', cbuf, 16, false);
  variants.forEach((v, i) => { v.thinInstanceSetBuffer('matrix', bufs[i], 16, false); v.alwaysSelectAsActiveMesh = true; });
  const q = new B.Quaternion(), tmp = new B.Matrix(), off = new V3(), c = new V3(), sc = new V3(), cs = new V3();
  G.updateParols = t => {
    const w = G.windState; counts.fill(0);
    items.forEach(it => { const amp = (.05 + .1 * w.gain * (.55 + .45 * Math.sin(t * 1.3 + it.ph))) / Math.max(.7, it.L), sw = Math.sin(t * .9 + it.ph) * .035, roll = -w.dx * amp + sw, pitch = w.dz * amp + Math.cos(t * .8 + it.ph) * .03;
      B.Quaternion.RotationYawPitchRollToRef(it.yaw, pitch, roll, q); off.set(0, -it.L, 0).rotateByQuaternionToRef(q, off); c.copyFromFloats(it.pivot.x + off.x, it.pivot.y + off.y, it.pivot.z + off.z);
      sc.set(it.s, it.s, it.s); M4.ComposeToRef(sc, q, c, tmp); tmp.copyToArray(bufs[it.ci], counts[it.ci]++ * 16);
      if (it.orb) it.orb.base.copyFrom(c);
    });
    variants.forEach((v, i) => { v.isVisible = counts[i] > 0; if (counts[i] > 0) { v.thinInstanceCount = counts[i]; v.thinInstanceBufferUpdated('matrix'); } });
    let n = 0; items.forEach(it => { const star = it.orb ? it.orb.base : it.pivot, d = it.pivot.subtract(star), len = d.length(); if (len < .01) return; const mid = it.pivot.add(star).scale(.5); const axis = d.normalizeToNew(); const qq = B.Quaternion.FromUnitVectorsToRef ? B.Quaternion.FromUnitVectorsToRef(V3.Up(), axis, new B.Quaternion()) : q; cs.set(1, len, 1); M4.ComposeToRef(cs, qq, mid, tmp); tmp.copyToArray(cbuf, n++ * 16); });
    cord.isVisible = n > 0; if (n > 0) { cord.thinInstanceCount = n; cord.thinInstanceBufferUpdated('matrix'); }
  };
  G.updateParols(0);
})();

/* ---------- the fairy ring ---------- */
(function fairyRing() {
  const cx = RING.x, cz = RING.z, vcm = G.vc, glowM = G.mat('shroomGlow', { noLight: true, emissive: new C3(.5, .5, .5) }); glowM.backFaceCulling = false; G.nightObjs.push({ mat: glowM, day: new C3(.5, .5, .55), night: new C3(1.7, 1.7, 1.9) });
  const mush = (cap, spots) => { const mb = new MB(); mb.tube([new V3(0, 0, 0), new V3(.01, .16, 0), new V3(0, .3, 0)], [.07, .04], 8, () => rgb('#f1e7d0'));
    mb.grid(12, 6, (u, v) => { const a = u * 6.283, ph = v * Math.PI / 2; return [Math.cos(a) * Math.sin(ph) * .22, .27 + Math.cos(ph) * .13, Math.sin(a) * Math.sin(ph) * .22]; }, (u, v) => { const cell = Math.floor(u * 9) * 7 + Math.floor(v * 5) * 13; const spot = spots && v > .15 && ((cell * 2654435761 >>> 0) % 5 === 0); return spot ? rgb('#fffaf0') : shade(rgb(cap), .85 + .3 * (1 - v)); });
    mb.grid(12, 1, (u, v) => { const a = u * 6.283, r = .22 * (1 - v * .85); return [Math.cos(a) * r, .27 - v * .02, Math.sin(a) * r]; }, () => rgb('#e8dcc0'));
    return mb; };
  const red = mush('#d6342f', true).build('shroomRed'), blue = mush('#3fd6e8', false).build('shroomGlow'), violet = mush('#b07aff', false).build('shroomGlow2'); blue.material = glowM; violet.material = glowM;
  const bufs = [[], [], []], tmp = new B.Matrix(), r = rng(31);
  for (let i = 0; i < 20; i++) { const a = i / 20 * 6.283 + Rr(-.1, .1, r), rad = 2.6 + Rr(-.3, .3, r), x = cx + Math.cos(a) * rad, z = cz + Math.sin(a) * rad, s = Rr(.8, 1.9, r); M4.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(r() * 6.28, Rr(-.15, .15, r), Rr(-.15, .15, r)), new V3(x, hFn(x, z) - .02, z), tmp); bufs[i % 3 === 0 ? 1 : i % 5 === 0 ? 2 : 0].push(...tmp.toArray()); }
  [red, blue, violet].forEach((m, i) => { if (bufs[i].length) { m.thinInstanceSetBuffer('matrix', new Float32Array(bufs[i]), 16, true); m.alwaysSelectAsActiveMesh = true; } else m.setEnabled(false); });
  // the glowing ring on the grass
  const rg = new MB(); rg.grid(72, 2, (u, v) => { const a = u * 6.283, rr = 2.35 + v * .75, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr; return [x, hFn(x, z) + .06, z]; }, (u, v) => v === .5 ? [.6, .9, 1] : [.4, .7, 1]);
  const rm = G.mat('ringGlow', { noLight: true, emissive: new C3(.5, .85, 1), alpha: .12 }); rm.alphaMode = B.Engine.ALPHA_ADD; const rmesh = rg.build('ringGlow', rm); rmesh.isPickable = false;
  G.onTime.push(S => { rm.alpha = .1 + .5 * S.night + .25 * G.magicK; });
  const tex = new B.DynamicTexture('spk2', { width: 64, height: 64 }, scene, true), g = tex.getContext(), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(160,230,255,.7)'); gr.addColorStop(1, 'rgba(160,200,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); tex.update(); tex.hasAlpha = true;
  const ps = new B.ParticleSystem('ringSparkle', 120, scene); ps.particleTexture = tex; ps.emitter = new V3(cx, hFn(cx, cz) + .2, cz); ps.minEmitBox = new V3(-2.6, 0, -2.6); ps.maxEmitBox = new V3(2.6, .3, 2.6); ps.direction1 = new V3(-.1, 1, -.1); ps.direction2 = new V3(.1, 1.8, .1); ps.gravity = new V3(0, .1, 0);
  ps.minLifeTime = 2.5; ps.maxLifeTime = 5; ps.emitRate = 16; ps.minSize = .06; ps.maxSize = .2; ps.color1 = new B.Color4(.7, .95, 1, 1); ps.color2 = new B.Color4(1, .8, 1, 1); ps.colorDead = new B.Color4(.6, .7, 1, 0); ps.blendMode = B.ParticleSystem.BLENDMODE_ADD; ps.preWarmCycles = 60; ps.preWarmStepOffset = 4; ps.start(); G.ringPS = ps;
  addOrb(new V3(cx, hFn(cx, cz) + 1.2, cz), 1.4, 2); G.hot.push({ pos: new V3(cx, hFn(cx, cz) + .3, cz), r: 3.0, kind: 'fairyring' }); G.obstacles.push();
})();

G.wisps = [];
var _tt; function trailTex() { return _tt || (_tt = (() => { const t = new B.DynamicTexture('trailTex', { width: 32, height: 32 }, scene, true), g = t.getContext(), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); t.update(); t.hasAlpha = true; return t; })()); }
function mixCol(a, b, t) { return new C3(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t)); }

/* ---------- drifting gold dust around you, and shooting stars at night ---------- */
(function motes() {
  const tex = new B.DynamicTexture('moteTex', { width: 32, height: 32 }, scene, true), g = tex.getContext(), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(.4, 'rgba(255,215,130,.5)'); gr.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); tex.update(); tex.hasAlpha = true;
  const ps = new B.ParticleSystem('motes', 200, scene); ps.particleTexture = tex; ps.emitter = G.camera.position; ps.minEmitBox = new V3(-14, -1.5, -14); ps.maxEmitBox = new V3(14, 5, 14);
  ps.direction1 = new V3(-.15, .02, -.15); ps.direction2 = new V3(.15, .2, .15); ps.minEmitPower = .05; ps.maxEmitPower = .25; ps.gravity = new V3(.04, .01, 0); ps.minLifeTime = 6; ps.maxLifeTime = 12; ps.emitRate = 16; ps.minSize = .04; ps.maxSize = .12; ps.blendMode = B.ParticleSystem.BLENDMODE_ADD;
  ps.addColorGradient(0, new B.Color4(1, .9, .6, 0)); ps.addColorGradient(.25, new B.Color4(1, .9, .6, .8)); ps.addColorGradient(.75, new B.Color4(1, .85, .5, .6)); ps.addColorGradient(1, new B.Color4(1, .8, .5, 0)); ps.preWarmCycles = 80; ps.preWarmStepOffset = 4; ps.start(); G.motes = ps;
  const star = B.MeshBuilder.CreateSphere('shoot', { diameter: 2.2, segments: 4 }, scene); star.material = G.mat('shootM', { noLight: true, emissive: new C3(2, 2, 1.8) }); star.material.fogEnabled = false; star.applyFog = false; star.isPickable = false; star.setEnabled(false);
  const tr = new B.ParticleSystem('shootTail', 160, scene); tr.particleTexture = trailTex(); tr.emitter = star; tr.minEmitBox = tr.maxEmitBox = V3.Zero(); tr.direction1 = tr.direction2 = V3.Zero(); tr.minEmitPower = tr.maxEmitPower = 0; tr.emitRate = 0; tr.minLifeTime = .35; tr.maxLifeTime = .6; tr.minSize = 1.6; tr.maxSize = 2.2; tr.addSizeGradient(0, 7); tr.addSizeGradient(1, .6);
  tr.addColorGradient(0, new B.Color4(1, 1, .95, .9)); tr.addColorGradient(1, new B.Color4(.7, .8, 1, 0)); tr.blendMode = B.ParticleSystem.BLENDMODE_ADD; tr.start();
  G.shoot = { star, tr, t: -1, next: 6, from: V3.Zero(), v: V3.Zero() };
})();

/* ---------- sparkles when you touch a flower; the garden awakening ---------- */
G.sparkBurst = pos => {
  const tex = G.sparkTex || (G.sparkTex = (() => { const t = new B.DynamicTexture('sparkTex', { width: 32, height: 32 }, scene, true), g = t.getContext(), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,225,140,.8)'); gr.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); t.update(); t.hasAlpha = true; return t; })());
  const ps = new B.ParticleSystem('spark', 60, scene); ps.particleTexture = tex; ps.emitter = pos.clone(); ps.minEmitBox = new V3(-.15, -.1, -.15); ps.maxEmitBox = new V3(.15, .2, .15); ps.direction1 = new V3(-1.2, 1.5, -1.2); ps.direction2 = new V3(1.2, 3, 1.2); ps.minEmitPower = .6; ps.maxEmitPower = 1.6; ps.gravity = new V3(0, -1.2, 0);
  ps.minLifeTime = 1; ps.maxLifeTime = 2.2; ps.manualEmitCount = 50; ps.minSize = .05; ps.maxSize = .16; ps.color1 = new B.Color4(1, .95, .7, 1); ps.color2 = new B.Color4(1, .8, .4, 1); ps.colorDead = new B.Color4(1, .7, .3, 0); ps.blendMode = B.ParticleSystem.BLENDMODE_ADD; ps.targetStopDuration = 2.5; ps.disposeOnStop = true; ps.start();
};
G.awaken = () => { G.magicTarget = 1; };

/* ---------- per-frame ---------- */
const _v = new V3();
G.updateMagic = (t, dt) => {
  const cam = G.camera.position;
  G.magicK += (G.magicTarget - G.magicK) * Math.min(1, dt * .8); const K = G.magicK, night = G.state.night || 0;
  G.pipe.bloomWeight = (G.bloomBase || .3) + .3 * K; G.updateParols(t);
  const wd = G.windState; if (G.driftPS) G.driftPS.gravity.set(wd.dx * wd.gain * 1.2, -.28, wd.dz * wd.gain * 1.2); if (G.fireflies) G.fireflies.gravity.set(wd.dx * wd.gain * .18, .02, wd.dz * wd.gain * .18); G.motes.gravity.set(wd.dx * wd.gain * .5, .01, wd.dz * wd.gain * .5);
  for (const w of G.wisps) {
    const x = w.cx + Math.sin(t * w.a + w.ph) * w.A, z = w.cz + Math.cos(t * w.c + w.ph) * w.Bz, y = hFn(x, z) + 1.3 + (Math.sin(t * w.b + w.ph) + 1) * 1.1;
    w.core.position.set(x, y, z); w.wings.forEach(q => { q.w.rotation.z = q.sd * (.5 + Math.sin(t * 26 + w.ph) * .55); });
    const dc = Math.hypot(x - cam.x, y - cam.y, z - cam.z), near = clamp((dc - 1.5) / 5, 0, 1);       // fade out as it nears the camera: no blown-out white discs
    w.halo.position.set(x, y, z); w.halo.size = (.42 + .03 * Math.sin(t * 1.1 + w.ph) + .25 * K + .3 * night) * (.35 + .65 * near); w.halo.color.a = (.1 + .22 * night + .12 * K) * near; w.hot.pos.set(x, y, z);
  }
  for (const o of G.orbs) { const dd = Math.hypot(o.base.x - cam.x, o.base.y - cam.y, o.base.z - cam.z), nr = clamp((dd - 1.2) / 4, 0, 1), f = (.9 + .1 * night * Math.sin(t * .9 + o.ph)) * nr; o.s.position.set(o.base.x + Math.sin(t * .3 + o.ph) * .15, o.base.y + Math.sin(t * .5 + o.ph * 2) * .12, o.base.z); o.s.size = o.size * (.92 + .1 * f) * (1 + .4 * K); o.s.color.a = (.34 + .3 * f) * (o.nightOnly ? clamp(night * 1.5, 0, 1) : (.55 + .6 * night + .5 * K)); }
  G.motes.emitRate = 14 + 30 * night + 50 * K; G.ringPS.emitRate = 12 + 30 * night + 40 * K;
  const s = G.shoot;
  if (night > .55) { s.next -= dt; if (s.t < 0 && s.next <= 0) { const az = rand() * 6.283, el = R(.45, .9); s.from = new V3(Math.cos(az) * 300, 150 + Math.sin(el) * 150, Math.sin(az) * 300).add(G.camera.position); s.v = new V3(R(-1, 1), R(-.5, -.25), R(-1, 1)).normalize().scale(260); s.t = 0; s.star.setEnabled(true); s.tr.emitRate = 140; s.star.position.copyFrom(s.from); s.next = R(7, 14); } }
  if (s.t >= 0) { s.t += dt; s.star.position.addInPlace(s.v.scale(dt)); if (s.t > 1.1) { s.t = -1; s.star.setEnabled(false); s.tr.emitRate = 0; } }
};
})();
