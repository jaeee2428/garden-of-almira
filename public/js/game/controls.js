/* =====================================================================
   game/controls.js - the player: the slow camera tour, walking / flying, zoom, keyboard & mouse
   All player state lives in G.player so picking, the HUD and the loop can read it.
   G.controls.step(dt) is run by the game loop every frame.
   ===================================================================== */
(() => {
const { B, V3, canvas, camera, hFn, clamp } = G;
const $ = id => document.getElementById(id), params = G.params;

const P = G.player = {
  mode: 'tour',                 // 'tour' | 'walk' | 'static' (fixed camera from a ?cam= / ?at= link)
  yaw: 0, pitch: 0, fly: false, locked: false, keys: {},
  tourT: parseFloat(params.get('t') || '0'), tourPaused: false,
  zoomK: 1,                     // 1 = normal view, smaller = zoomed in (mouse wheel, or hold Z)
  dragging: false,
};
const keys = P.keys;

/* ---------- the tour: a closed spline through the garden ---------- */
const tourKeys = [   // [x, z, height above ground]  ->  [target x, y, z]
  [[-41, -3.6, 2.2], [-22, 1.8, 0.5]], [[-30, .4, 1.8], [-8, 1.8, 0]], [[-21, 2.6, 1.6], [-4, 1.8, -1]], [[-13, -.2, 1.5], [0, 3.2, 7]], [[-5.5, -3, 1.6], [3, 4.2, 7.5]],
  [[-.5, -.2, 1.7], [9, 1.9, 4]], [[4.2, 3.6, 1.7], [19, 4.5, 4]], [[8.6, 5.9, 2.5], [19, 4.4, 4]], [[6, -11, 3], [-18, 1.8, 2]], [[-8, -14, 2.2], [-46, 1.2, -8]], [[-30, -12, 2.6], [-60, .6, 2]], [[-39, -6, 2.4], [-24, 1.6, 2]],
];
const posC = B.Curve3.CreateCatmullRomSpline(tourKeys.map(([p]) => new V3(p[0], p[2], p[1])), 50, true).getPoints();
const tgtC = B.Curve3.CreateCatmullRomSpline(tourKeys.map(([, t]) => new V3(t[0], t[1], t[2])), 50, true).getPoints();
const sample = (arr, u) => { const f = ((u % 1) + 1) % 1 * (arr.length - 1), i = Math.floor(f); return V3.Lerp(arr[i], arr[Math.min(i + 1, arr.length - 1)], f - i); };
const TOUR = 190;

/* ---------- modes, hints ---------- */
const modeBtn = $('mode'), hint = $('hint');
const TOUR_HINT = 'click any flower to meet it · press <b>K</b> for all keys', WALK_HINT = '<b>W A S D</b> walk · <b>Shift</b> run · <b>Space</b> jump · <b>Tab</b> your eyes ⇄ behind you · <b>F</b> fly · <b>K</b> keys';
function setMode(m) {
  if (m === P.mode) return; P.mode = m;
  if (m === 'walk') {
    const f = camera.getForwardRay().direction; P.yaw = Math.atan2(f.x, f.z); P.pitch = Math.asin(clamp(f.y, -1, 1)) * -1; camera.position.y = hFn(camera.position.x, camera.position.z) + 1.65;
    modeBtn.textContent = '🎞 Tour'; hint.innerHTML = WALK_HINT; if (G.avatar) G.avatar.enter(camera.position.x, camera.position.z, P.yaw);
  } else { if (document.pointerLockElement) document.exitPointerLock(); modeBtn.textContent = '🚶 Walk'; hint.innerHTML = TOUR_HINT; P.fly = false; if (G.avatar) G.avatar.exit(); }
}
modeBtn.onclick = () => setMode(P.mode === 'tour' ? 'walk' : 'tour');
function toggleView() {                                                  // your own eyes <-> a camera behind you
  if (!G.avatar) return; if (P.mode !== 'walk' || P.fly) { setMode('walk'); if (P.fly) { P.fly = false; G.avatar.enter(camera.position.x, camera.position.z, P.yaw); } }
  G.avatar.setView(G.avatar.view === 'first' ? 'third' : 'first'); if (G.avatar.view === 'third') P.pitch = Math.max(P.pitch, .15);
  flash(G.avatar.view === 'first' ? 'first person: through your own eyes' : 'third person: a camera behind you');
}
function flash(t) { hint.textContent = t; clearTimeout(flash.t); flash.t = setTimeout(() => { hint.innerHTML = P.mode === 'walk' ? WALK_HINT : TOUR_HINT; }, 2400); }
const FOV0 = .95;
function resetView() { setMode('tour'); P.tourT = 0; P.tourPaused = false; P.fly = false; P.zoomK = 1; camera.fov = FOV0; flash('back to the start of the tour'); }

/* ---------- keyboard ---------- */
const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ', 'KeyE']);
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return; keys[e.code] = true;
  if (MOVE_KEYS.has(e.code) && P.mode === 'tour') setMode('walk');
  const digit = /^Digit([1-5])$/.exec(e.code);
  if (digit) { G.hud.setTime([0, .2, .45, .7, 1][+digit[1] - 1]); flash(G.timeName(G.timeU)); return; }
  switch (e.code) {
    case 'KeyT': modeBtn.click(); break;
    case 'KeyF': if (P.mode !== 'walk') setMode('walk'); P.fly = !P.fly; flash(P.fly ? 'fly mode: Space up · C down' : 'walking again');
      if (G.avatar) { if (P.fly) G.avatar.exit(); else G.avatar.enter(camera.position.x, camera.position.z, P.yaw); } break;
    case 'Tab': e.preventDefault(); toggleView(); break;
    case 'KeyR': resetView(); break;
    case 'Space': e.preventDefault(); if (P.mode === 'walk' && !P.fly) P.jump = true; if (P.mode === 'tour') { P.tourPaused = !P.tourPaused; flash(P.tourPaused ? 'tour paused (Space to continue)' : 'tour playing'); } break;
    case 'KeyH': document.body.classList.toggle('noui'); break;
    case 'KeyK': case 'Slash': G.hud.toggleKeys(); break;
    case 'Escape': G.hud.hideKeys(); break;
    case 'KeyP': $('autotime').click(); flash(G.autoTime ? 'time is passing' : 'time stands still'); break;
    case 'Comma': case 'BracketLeft': G.hud.setTime(G.timeU - .05); break;
    case 'Period': case 'BracketRight': G.hud.setTime(G.timeU + .05); break;
  }
});
addEventListener('keyup', e => { keys[e.code] = false; });

/* ---------- mouse: look, click, hover, wheel zoom ---------- */
canvas.addEventListener('wheel', e => { e.preventDefault(); P.zoomK = clamp(P.zoomK * Math.exp(e.deltaY * .0012), .2, 1); if (P.zoomK > .97) P.zoomK = 1; }, { passive: false });
document.addEventListener('pointerlockchange', () => { P.locked = document.pointerLockElement === canvas; $('reticle').style.display = P.locked ? 'block' : 'none'; if (!P.locked) $('tip').style.opacity = 0; });
addEventListener('mousemove', e => { if (P.mode === 'walk' && (P.locked || P.dragging)) { P.yaw += (e.movementX || 0) * .0022; P.pitch = clamp(P.pitch + (e.movementY || 0) * .0022, -1.3, 1.3); } });
let downX = 0, downY = 0;
canvas.addEventListener('pointerdown', e => { P.dragging = true; downX = e.clientX; downY = e.clientY; });
addEventListener('pointerup', e => { if (!P.dragging) return; P.dragging = false; if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) G.interact.onClick(e); });
addEventListener('pointermove', e => { if (!P.locked) G.interact.onHover(e); });

/* ---------- per-frame movement ---------- */
function zoomStep(dt) { const goal = FOV0 * Math.min(P.zoomK, keys.KeyZ ? .42 : 1); camera.fov += (goal - camera.fov) * Math.min(1, dt * 9); }
function collide(nx, nz) {                                                       // slide around houses, trunks, jars...
  for (const o of G.obstacles) {
    if (o.box) { const c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = nx - o.x, dz = nz - o.z; let lx = dx * c - dz * s, lz = dx * s + dz * c; const bx = o.hw + .45, bz = o.hd + .45;
      if (Math.abs(lx) < bx && Math.abs(lz) < bz) { if (bx - Math.abs(lx) < bz - Math.abs(lz)) lx = Math.sign(lx || 1) * bx; else lz = Math.sign(lz || 1) * bz; nx = o.x + lx * c + lz * s; nz = o.z - lx * s + lz * c; } }
    else { const dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz), m = o.r + .45; if (d < m && d > .001) { nx = o.x + dx / d * m; nz = o.z + dz / d * m; } }
  }
  const sx0 = G.shoreX(nz) + 2.2; if (nx < sx0) nx = sx0; const rr = Math.hypot(nx, nz); if (rr > 90) { nx *= 90 / rr; nz *= 90 / rr; }
  return [nx, nz];
}
function walkStep(dt) {
  if (G.avatar && !P.fly) {                                               // you walk: human physics in game/avatar.js
    if (keys.ArrowLeft || keys.KeyQ) P.yaw -= 1.7 * dt; if (keys.ArrowRight || keys.KeyE) P.yaw += 1.7 * dt;
    if (keys.PageUp) P.pitch = clamp(P.pitch - 1.2 * dt, -1.3, 1.3); if (keys.PageDown) P.pitch = clamp(P.pitch + 1.2 * dt, -1.3, 1.3);
    const fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), strafe = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    G.avatar.step(dt, { fwd, strafe, run: !!(keys.ShiftLeft || keys.ShiftRight), jump: !!P.jump, crouch: !!keys.KeyC, wave: !!keys.KeyG, yaw: P.yaw, pitch: P.pitch }, G.clock); P.jump = false;
    G.walkSpeed = G.avatar.speed; G.avatar.placeCamera(dt, P.yaw, P.pitch); return;
  }
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 6 : 3.2) * dt * (P.fly ? 1.6 : 1); let fx = 0, fz = 0;
  if (keys.KeyW || keys.ArrowUp) fz += 1; if (keys.KeyS || keys.ArrowDown) fz -= 1; if (keys.KeyD) fx += 1; if (keys.KeyA) fx -= 1;
  if (keys.ArrowLeft || keys.KeyQ) P.yaw -= 1.7 * dt; if (keys.ArrowRight || keys.KeyE) P.yaw += 1.7 * dt;
  if (keys.PageUp) P.pitch = clamp(P.pitch - 1.2 * dt, -1.3, 1.3); if (keys.PageDown) P.pitch = clamp(P.pitch + 1.2 * dt, -1.3, 1.3);
  const sx = Math.sin(P.yaw), cz = Math.cos(P.yaw), cp = P.fly ? Math.cos(P.pitch) : 1;
  const [nx, nz] = collide(camera.position.x + (sx * cp * fz + cz * fx) * sp, camera.position.z + (cz * cp * fz - sx * fx) * sp);
  const flyDy = P.fly ? (-Math.sin(P.pitch) * fz + ((keys.Space ? 1 : 0) - (keys.KeyC || keys.ControlLeft ? 1 : 0))) * sp : 0;
  G.walkSpeed = Math.hypot(nx - camera.position.x, nz - camera.position.z) / Math.max(dt, 1e-3); camera.position.x = nx; camera.position.z = nz;
  const gy = hFn(nx, nz) + 1.65; if (P.fly) camera.position.y = clamp(camera.position.y + flyDy, hFn(nx, nz) + .5, 60); else camera.position.y += (gy - camera.position.y) * Math.min(1, dt * 12);
  camera.rotation.set(P.pitch, P.yaw, 0);
}
function tourStep(dt) {
  if (!P.tourPaused) P.tourT += dt; const u = P.tourT / TOUR, p = sample(posC, u), tg = sample(tgtC, u + .003), gh = hFn(p.x, p.z) + 1.2;
  camera.position.set(p.x, Math.max(p.y + hFn(p.x, p.z), gh), p.z); camera.setTarget(tg); G.camFwd.set(tg.x - p.x, 0, tg.z - p.z);
}
function step(dt) {
  if (P.mode !== 'walk') G.walkSpeed = 0;
  zoomStep(dt);
  if (P.mode === 'tour') tourStep(dt);
  else if (P.mode === 'walk') { walkStep(dt); G.camFwd.set(Math.sin(P.yaw), 0, Math.cos(P.yaw)); }
}

G.controls = { setMode, flash, resetView, step };
})();
