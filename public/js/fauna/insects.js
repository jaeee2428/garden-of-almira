/* =====================================================================
   fauna/insects.js - alibangbang (butterflies) by day, gamu-gamo (moths) round the porch lamp at night
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng, scene, hFn } = G, geo = G.geo;
const Rr = (a, b, r) => a + (b - a) * r(), R = G.R, rand = G.rand, UP = V3.Up(), P = G.POND, T0 = G.L.tree;
const { hash, soft, part, avoid } = G.faunaKit;
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
      const av = G.avatar; if (av && av.active && f.state === 'visit' && Math.hypot(f.x - av.x, f.z - av.z) < 1.1 + .3 * av.speed) { const pl = G.plants[Math.floor(rand() * G.plants.length)]; if (pl) { f.px = pl.x; f.pz = pl.z; f.py = pl.y + pl.H * .75; } f.state = 'travel'; f.timer = R(2, 4); }   // you startle it
      if (f.state === 'visit') { const gy = hFn(f.px, f.pz); f.tx = f.px + Math.sin(t * .8 + f.ph) * .35; f.tz = f.pz + Math.cos(t * .7 + f.ph) * .35; f.ty = gy + f.py - hFn(f.px, f.pz) + .1 + Math.sin(t * 1.4 + f.ph) * .12; f.x += (f.tx - f.x) * Math.min(1, dt * 1.6); f.z += (f.tz - f.z) * Math.min(1, dt * 1.6); f.y += (f.ty - f.y) * Math.min(1, dt * 1.6); slow = .35; if (f.timer <= 0) { const pl = G.plants[Math.floor(rand() * G.plants.length)]; if (pl && Math.hypot(pl.x - f.x, pl.z - f.z) < 16) { f.px = pl.x; f.pz = pl.z; f.py = pl.y + pl.H * .75; } f.state = 'travel'; f.timer = R(2, 5); } }
      else { const dx = f.px - f.x, dz = f.pz - f.z, d = Math.hypot(dx, dz) + .001; f.x += (dx / d * 2.2 + wd.dx * wd.gain * .35) * dt; f.z += (dz / d * 2.2 + wd.dz * wd.gain * .35) * dt; f.y += (f.py + 1.0 + Math.sin(t * 2 + f.ph) * .6 - f.y) * Math.min(1, dt * 1.2); if (d < .7 || f.timer <= 0) { f.state = 'visit'; f.timer = R(3, 9); } flap = 1.15; }
    }
    const gy = hFn(f.x, f.z); if (f.y < gy + .25) f.y = gy + .25;
    const dx = f.x - f.root.position.x, dz = f.z - f.root.position.z; if (dx * dx + dz * dz > 1e-6) f.root.rotation.y = Math.atan2(dx, dz); f.root.position.set(f.x, f.y, f.z);
    const ang = Math.sin(t * f.flapHz * flap * (slow < 1 ? .55 : 1) + f.ph) * (slow < 1 ? .6 : 1.0) + .12; f.wL.rotation.z = -ang; f.wR.rotation.z = ang; f.hot.pos.set(f.x, f.y, f.z);
  }
}
G.systems.add('insects', (t, dt) => updateFlyers(t, G.faunaKit.dt(dt), G.camera.position, G.state, G.faunaKit.isDay()), { order: 62 });
})();
