/* =====================================================================
   main.js - cameras, picking, the guide card, the bayong, time of day
   ===================================================================== */
(() => {
const { B, V3, C3, M4, scene, engine, canvas, camera, hFn, clamp, lerp, rand, R } = G;
const $ = id => document.getElementById(id);
const params = G.params;
G.clock = parseFloat(params.get('t') || '0');
G.applyTime(params.has('u') ? parseFloat(params.get('u')) : .45);

/* ---------- camera: a slow tour, or walk it yourself ---------- */
const tourKeys = [   // [x, z, height above ground]  ->  [target x, y, z]
  [[-41, -3.6, 2.2], [-22, 1.8, 0.5]], [[-30, .4, 1.8], [-8, 1.8, 0]], [[-21, 2.6, 1.6], [-4, 1.8, -1]], [[-13, -.2, 1.5], [0, 3.2, 7]], [[-5.5, -3, 1.6], [3, 4.2, 7.5]],
  [[-.5, -.2, 1.7], [9, 1.9, 4]], [[4.2, 3.6, 1.7], [19, 4.5, 4]], [[8.6, 5.9, 2.5], [19, 4.4, 4]], [[6, -11, 3], [-18, 1.8, 2]], [[-8, -14, 2.2], [-46, 1.2, -8]], [[-30, -12, 2.6], [-60, .6, 2]], [[-39, -6, 2.4], [-24, 1.6, 2]],
];
const posC = B.Curve3.CreateCatmullRomSpline(tourKeys.map(([p]) => new V3(p[0], p[2], p[1])), 50, true).getPoints();
const tgtC = B.Curve3.CreateCatmullRomSpline(tourKeys.map(([, t]) => new V3(t[0], t[1], t[2])), 50, true).getPoints();
const sample = (arr, u) => { const f = ((u % 1) + 1) % 1 * (arr.length - 1), i = Math.floor(f); return V3.Lerp(arr[i], arr[Math.min(i + 1, arr.length - 1)], f - i); };
const TOUR = 190; let tourT = parseFloat(params.get('t') || '0') ;
let mode = 'tour', yaw = 0, pitch = 0, locked = false; const keys = {};
const modeBtn = $('mode'), hint = $('hint');
const TOUR_HINT = 'click any flower to meet it · press <b>K</b> for all keys', WALK_HINT = '<b>W A S D</b> walk · <b>←/→</b> or <b>Q/E</b> turn · <b>Shift</b> run · <b>F</b> fly · <b>click</b> to meet things · <b>K</b> keys';
function setMode(m) {
  if (m === mode) return; mode = m;
  if (m === 'walk') {
    const f = camera.getForwardRay().direction; yaw = Math.atan2(f.x, f.z); pitch = Math.asin(clamp(f.y, -1, 1)) * -1; camera.position.y = hFn(camera.position.x, camera.position.z) + 1.65;
    modeBtn.textContent = '🎞 Tour'; hint.innerHTML = WALK_HINT;
  } else { if (document.pointerLockElement) document.exitPointerLock(); modeBtn.textContent = '🚶 Walk'; hint.innerHTML = TOUR_HINT; fly = false; }
}
modeBtn.onclick = () => setMode(mode === 'tour' ? 'walk' : 'tour');
let fly = false, tourPaused = false, zoomK = 1;                 // zoomK: 1 = normal view, smaller = zoomed in (mouse wheel, or hold Z)
const FOV0 = .95;
function zoomStep(dt) { const goal = FOV0 * Math.min(zoomK, keys.KeyZ ? .42 : 1); camera.fov += (goal - camera.fov) * Math.min(1, dt * 9); }
canvas.addEventListener('wheel', e => { e.preventDefault(); zoomK = clamp(zoomK * Math.exp(e.deltaY * .0012), .2, 1); if (zoomK > .97) zoomK = 1; }, { passive: false });
const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyQ', 'KeyE']);
const keysPanel = $('keys'), toggleKeys = () => keysPanel.classList.toggle('show');
function flash(t) { hint.textContent = t; clearTimeout(flash.t); flash.t = setTimeout(() => { hint.innerHTML = mode === 'walk' ? WALK_HINT : TOUR_HINT; }, 2400); }
function setTime(u) { u = clamp(u, 0, 1); G.applyTime(u); $('time').value = Math.round(u * 100); showName(); }
function resetView() { setMode('tour'); tourT = 0; tourPaused = false; fly = false; zoomK = 1; camera.fov = .95; flash('back to the start of the tour'); }
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return; keys[e.code] = true;
  if (MOVE_KEYS.has(e.code) && mode === 'tour') setMode('walk');
  const digit = /^Digit([1-5])$/.exec(e.code);
  if (digit) { setTime([0, .2, .45, .7, 1][+digit[1] - 1]); flash(G.timeName(G.timeU)); return; }
  switch (e.code) {
    case 'KeyT': modeBtn.click(); break;
    case 'KeyF': if (mode !== 'walk') setMode('walk'); fly = !fly; flash(fly ? 'fly mode: Space up · C down' : 'walking again'); break;
    case 'KeyR': resetView(); break;
    case 'Space': e.preventDefault(); if (mode === 'tour') { tourPaused = !tourPaused; flash(tourPaused ? 'tour paused (Space to continue)' : 'tour playing'); } break;
    case 'KeyH': document.body.classList.toggle('noui'); break;
    case 'KeyK': case 'Slash': toggleKeys(); break;
    case 'Escape': keysPanel.classList.remove('show'); break;
    case 'KeyP': $('autotime').click(); flash(G.autoTime ? 'time is passing' : 'time stands still'); break;
    case 'Comma': case 'BracketLeft': setTime(G.timeU - .05); break;
    case 'Period': case 'BracketRight': setTime(G.timeU + .05); break;
  }
});
addEventListener('keyup', e => { keys[e.code] = false; });
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; $('reticle').style.display = locked ? 'block' : 'none'; if (!locked) tip.style.opacity = 0; });
addEventListener('mousemove', e => { if (mode === 'walk' && (locked || dragging)) { const k = locked ? 1 : 1; yaw += (e.movementX || 0) * .0022 * k; pitch = clamp(pitch + (e.movementY || 0) * .0022, -1.3, 1.3); } });
let dragging = false, downX = 0, downY = 0, moved = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; downX = e.clientX; downY = e.clientY; moved = 0; });
addEventListener('pointerup', e => { if (!dragging) return; dragging = false; if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) onClick(e); });
addEventListener('pointermove', e => { if (dragging) moved += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0); if (!locked) onHover(e); });
function walkStep(dt) {
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 6 : 3.2) * dt * (fly ? 1.6 : 1); let fx = 0, fz = 0;
  if (keys.KeyW || keys.ArrowUp) fz += 1; if (keys.KeyS || keys.ArrowDown) fz -= 1; if (keys.KeyD) fx += 1; if (keys.KeyA) fx -= 1;
  if (keys.ArrowLeft || keys.KeyQ) yaw -= 1.7 * dt; if (keys.ArrowRight || keys.KeyE) yaw += 1.7 * dt;
  if (keys.PageUp) pitch = clamp(pitch - 1.2 * dt, -1.3, 1.3); if (keys.PageDown) pitch = clamp(pitch + 1.2 * dt, -1.3, 1.3);
  const sx = Math.sin(yaw), cz = Math.cos(yaw), cp = fly ? Math.cos(pitch) : 1; let nx = camera.position.x + (sx * cp * fz + cz * fx) * sp, nz = camera.position.z + (cz * cp * fz - sx * fx) * sp;
  const flyDy = fly ? (-Math.sin(pitch) * fz + ((keys.Space ? 1 : 0) - (keys.KeyC || keys.ControlLeft ? 1 : 0))) * sp : 0;
  for (const o of G.obstacles) {
    if (o.box) { const c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = nx - o.x, dz = nz - o.z; let lx = dx * c - dz * s, lz = dx * s + dz * c; const bx = o.hw + .45, bz = o.hd + .45;
      if (Math.abs(lx) < bx && Math.abs(lz) < bz) { if (bx - Math.abs(lx) < bz - Math.abs(lz)) lx = Math.sign(lx || 1) * bx; else lz = Math.sign(lz || 1) * bz; nx = o.x + lx * c + lz * s; nz = o.z - lx * s + lz * c; } }
    else { const dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz), m = o.r + .45; if (d < m && d > .001) { nx = o.x + dx / d * m; nz = o.z + dz / d * m; } }
  }
  const sx0 = G.shoreX(nz) + 2.2; if (nx < sx0) nx = sx0; const rr = Math.hypot(nx, nz); if (rr > 90) { nx *= 90 / rr; nz *= 90 / rr; }
  G.walkSpeed = Math.hypot(nx - camera.position.x, nz - camera.position.z) / Math.max(dt, 1e-3); camera.position.x = nx; camera.position.z = nz; const gy = hFn(nx, nz) + 1.65; if (fly) camera.position.y = clamp(camera.position.y + flyDy, hFn(nx, nz) + .5, 60); else camera.position.y += (gy - camera.position.y) * Math.min(1, dt * 12);
  camera.rotation.set(pitch, yaw, 0);
}
if (params.has('cam')) { const c = params.get('cam').split(',').map(Number); mode = 'static'; camera.position.set(c[0], c[1], c[2]); camera.setTarget(new V3(c[3], c[4], c[5])); G.camFwd.set(c[3] - c[0], 0, c[5] - c[2]); }
if (params.has('atplant')) { const p = G.plants[parseInt(params.get('atplant'))]; mode = 'static'; camera.position.set(p.x + .5, p.y + .65, p.z + .5); camera.setTarget(new V3(p.x, p.y + .45, p.z)); G.camFwd.set(-.5, 0, -.5); }
if (params.has('atsp')) { const sp = params.get('atsp'), v = params.get('v'); let p = null, bn = 1e9; for (const q of G.plants) { if (q.sp !== sp || (v && G.kinds[q.ki].v !== v) || Math.hypot(q.x + 5, q.z) > 45) continue; let n = 0; for (const o of G.plants) if (o !== q && Math.hypot(o.x - q.x, o.z - q.z) < 2.4) n++; if (n < bn) { bn = n; p = q; } }
  if (p) { mode = 'static'; const d = p.H * 1.05 + .45; camera.position.set(p.x + d * .6, p.y + p.H * .5, p.z + d * .8); camera.setTarget(new V3(p.x, p.y + p.H * .5, p.z)); G.camFwd.set(-.6, 0, -.8); } }
if (params.has('at')) { const lists = { hen: G.chicken, fairy: G.fairies, bird: G.birds, fly: G.flyers }, E = (lists[params.get('at')] || [])[parseInt(params.get('i') || '0')]; if (E) { const p = E.root.position, d = parseFloat(params.get('d') || '1'); mode = 'static'; camera.position.set(p.x + d * .8, p.y + d * .35, p.z + d * .6); camera.setTarget(new V3(p.x, p.y + .12, p.z)); G.camFwd.set(-.8, 0, -.6); G.freezeFauna = true; } }
if (params.has('walk')) { setMode('walk'); camera.position.set(parseFloat(params.get('x') || '-30'), 2, parseFloat(params.get('z') || '0')); yaw = parseFloat(params.get('yaw') || '1.57'); pitch = parseFloat(params.get('pitch') || '.05'); }

/* ---------- picking: find the flower (or thing) under the cursor ---------- */
const ray = new B.Ray(V3.Zero(), V3.Forward(), 60), _v = new V3();
function rayFrom(e) { if (G.testRay) return G.testRay; return locked ? scene.createPickingRay(canvas.clientWidth / 2, canvas.clientHeight / 2, M4.Identity(), camera) : scene.createPickingRay(e.clientX, e.clientY - canvas.getBoundingClientRect().top, M4.Identity(), camera); }
// ---- picking: the thing nearest to the ray's centre, and never something hidden behind a solid
const occ = []; let occReady = false;
function occluders() { if (!occReady) { occReady = true; ['ground', 'stoneWalls', 'plankWalls', 'roof', 'balcony', 'bahayKubo', 'tubod', 'tapayan', 'clayPots'].forEach(n => { const mm = scene.getMeshByName(n); if (mm) occ.push(mm); }); } return occ; }
function occlusion(r) { let d = 1e9; for (const mm of occluders()) { const pi = r.intersectsMesh(mm, false); if (pi && pi.hit && pi.distance < d) d = pi.distance; } return d; }
const PEN = { candle: .5, diwata: .5, hen: .55, alibangbang: .55, parol: .6, puso: .6, bangka: 1.2, fairyring: 1.4, shrine: 1.2 };
function pickThing(r) {
  const tOcc = occlusion(r) - .1, o = r.origin, d = r.direction, cull = G.QUAL.cull * G.QUAL.cull; let best = null, bs = 1e9;
  const score = (cx, cy, cz, rad, pen) => { const vx = cx - o.x, vy = cy - o.y, vz = cz - o.z, t = vx * d.x + vy * d.y + vz * d.z; if (t < .3 || t > 45 || t > tOcc) return -1; const ex = vx - d.x * t, ey = vy - d.y * t, ez = vz - d.z * t, dist = Math.sqrt(ex * ex + ey * ey + ez * ez); if (dist > rad) return -1; return dist / rad * pen + t * .004; };
  for (const p of G.plants) { const dx = p.x - o.x, dz = p.z - o.z; if (dx * dx + dz * dz > cull) continue; const rad = p.r * .85 + .08, s = scorePlant(p, rad); if (s >= 0 && s < bs) { bs = s; best = { kind: 'plant', sp: p.sp, p, pos: new V3(p.x, p.y + p.H * .6, p.z) }; } }
  function scorePlant(p, rad) {           // distance from the ray to the plant's own stem-to-crown line, so you pick what you are really pointing at
    const ux = 0, uy = p.H, uz = 0, wx = p.x - o.x, wy = p.y - o.y, wz = p.z - o.z, a = uy * uy, b = uy * d.y, d1 = uy * wy, e1 = d.x * wx + d.y * wy + d.z * wz; let s = a - b * b > 1e-6 ? (b * e1 - d1) / (a - b * b) : 0; s = s < 0 ? 0 : s > 1 ? 1 : s;
    const t = e1 + s * b; if (t < .3 || t > 45 || t > tOcc) return -1; const ex = wx - d.x * t, ey = wy + s * uy - d.y * t, ez = wz - d.z * t, dist = Math.sqrt(ex * ex + ey * ey + ez * ez); return dist > rad ? -1 : dist / rad + t * .01;
  }
  for (const h of G.hot) { const pos = h.local ? G.houseLocalToWorld(h.local.x, h.local.y, h.local.z) : h.pos, rad = h.r2 || h.r; if (!rad) continue; const s = score(pos.x, pos.y, pos.z, rad, h.kind === 'plant' ? 1.7 : (PEN[h.kind] ?? 1.3)); if (s >= 0 && s < bs) { bs = s; best = { ...h, pos }; } }
  for (const b of G.butterflies) { const q = b.root.position, s = score(q.x, q.y, q.z, .45, PEN.alibangbang); if (s >= 0 && s < bs) { bs = s; best = { kind: 'alibangbang', pos: q.clone() }; } }
  return best;
}
const tip = $('tip');
function onHover(e) { if (e.target !== canvas) { tip.style.opacity = 0; return; } const now = performance.now(); if (now - onHover.t < 70) return; onHover.t = now; const hit = pickThing(rayFrom(e)); if (hit) { const info = infoFor(hit); canvas.style.cursor = 'pointer'; tip.textContent = info ? info.ceb : ''; tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY + 8 + 'px'; tip.style.opacity = info ? 1 : 0; } else { canvas.style.cursor = mode === 'walk' ? 'crosshair' : 'default'; tip.style.opacity = 0; } }
onHover.t = 0;
const infoFor = hit => hit.kind === 'plant' ? G.INFO[hit.sp] : G.INFO_OTHER[hit.kind];

/* ---------- the guide card, and your bayong (basket) of flowers ---------- */
const card = $('card'), chips = $('chips'), collected = new Set(), ORDER = ['sampaguita', 'gumamela', 'kalachuchi', 'santan', 'dama', 'bogambilya', 'kadena', 'ilangilang', 'rosas', 'canna', 'heliconia', 'kamia', 'orkidyas', 'liryo'];
ORDER.forEach(k => { const c = document.createElement('div'); c.className = 'chip'; c.dataset.k = k; c.innerHTML = `<i style="background:${G.INFO[k].color}"></i><span>${G.INFO[k].ceb}</span>`; chips.appendChild(c); });
const cnt = $('count'); const saved = (() => { try { return JSON.parse(localStorage.getItem('almira.bayong') || '[]'); } catch (e) { return []; } })(); saved.forEach(k => collected.add(k));
function refreshChips() { chips.querySelectorAll('.chip').forEach(c => c.classList.toggle('got', collected.has(c.dataset.k))); cnt.textContent = collected.size + ' / ' + ORDER.length; try { localStorage.setItem('almira.bayong', JSON.stringify([...collected])); } catch (e) { } }
refreshChips();
if (collected.size === ORDER.length) G.awaken();
let cardTimer;
function showCard(info, extra) { $('cname').textContent = info.ceb; $('csci').textContent = info.sci; $('cfact').textContent = info.fact; $('cextra').textContent = extra || ''; $('cdot').style.background = info.color; card.classList.add('show'); clearTimeout(cardTimer); cardTimer = setTimeout(() => card.classList.remove('show'), 14000); }
$('cclose').onclick = () => card.classList.remove('show');
function onClick(e) {
  if (e.target !== canvas && !locked) return;
  if (mode === 'walk' && !locked && canvas.requestPointerLock && !params.has('nolock')) { try { canvas.requestPointerLock(); } catch (er) { } }
  const ray = rayFrom(e), hit = pickThing(ray); if (!hit) { if (ray.direction.y < -.01) { const tt = (ray.origin.y - .35) / -ray.direction.y; if (tt > 0 && tt < 60) G.poke(ray.origin.x + ray.direction.x * tt, ray.origin.z + ray.direction.z * tt, .8); } return; }
  G.poke(hit.pos.x, hit.pos.z, 1);
  if (hit.kind === 'candle') { const c = G.candles[hit.idx]; c.lit = !c.lit; c.flame.setEnabled(c.lit); showCard(G.INFO_OTHER.candle, c.lit ? 'You lit a candle.' : 'You snuffed it out.'); return; }
  const info = infoFor(hit); if (!info) return;
  if (hit.kind === 'hen') { const h = hit.ref; h.peck = 2.5; }
  if (hit.kind === 'plant') {
    const first = !collected.has(hit.sp); if (hit.p) hit.p.pulse = 1; collected.add(hit.sp); G.petalBurst(hit.pos, first ? 50 : 18); G.sparkBurst(hit.pos);
    showCard(info, first ? '✓ added to your bayong (' + collected.size + '/' + ORDER.length + ')' : 'already in your bayong'); refreshChips();
    if (first && collected.size === ORDER.length) celebrate();
  } else showCard(info);
}
function celebrate() {
  const f = camera.getForwardRay().direction; G.petalBurst(camera.position.add(f.scale(3.5)).add(new V3(0, 1.4, 0)), 220);
  const o = $('pit'); o.classList.add('show'); setTimeout(() => o.classList.remove('show'), 6500); G.awaken();
}
$('resetbag').onclick = () => { collected.clear(); refreshChips(); G.magicTarget = 0; };


/* ---------- time of day, breeze ---------- */
const slider = $('time'); slider.value = Math.round(G.timeU * 100); slider.oninput = () => { G.applyTime(slider.value / 100); showName(); };
const tname = $('tname'); let lastName = ''; const showName = () => { const n = G.timeName(G.timeU); if (n !== lastName) { lastName = n; tname.textContent = n; } };

$('keybtn').onclick = () => $('keys').classList.toggle('show');
$('autotime').onclick = function () { G.autoTime = !G.autoTime; this.classList.toggle('on', G.autoTime); };

/* ---------- the loop ---------- */
let fpsT = 0, frame = 0, lowCount = 0, nextGust = 9, gustStart = -99, gustLen = 6, gustAmp = 1;
G.qLevel = 2;
G.setQuality = l => { l = clamp(l, 0, 2); G.qLevel = l; const T = G.TIERS[l]; G.QUAL = T; engine.setHardwareScalingLevel(G.baseScale * T.scale); G.sunLight.shadowEnabled = T.shadow; G.pipe.bloomEnabled = T.bloom; G.bloomBase = [0, .22, .3][l]; G.pipe.grainEnabled = false; G.updateCover(); G.updateTrees(); };
G.setQuality(2);                                   // always High. (?q=low is only for testing)
if (params.get('q') === 'low') G.setQuality(0);
let resScale = 1;                                  // silent safety net: if the machine struggles, render fewer pixels - everything else stays High
scene.onBeforeRenderObservable.add(() => {
  const dt = Math.min(engine.getDeltaTime() / 1000, .1); G.clock += dt; const t = G.clock; frame++;
  if (mode !== 'walk') G.walkSpeed = 0;
  zoomStep(dt);
  if (mode === 'tour') { if (!tourPaused) tourT += dt; const u = tourT / TOUR, p = sample(posC, u), tg = sample(tgtC, u + .003); const gh = hFn(p.x, p.z) + 1.2; camera.position.set(p.x, Math.max(p.y + hFn(p.x, p.z), gh), p.z); camera.setTarget(tg); G.camFwd.set(tg.x - p.x, 0, tg.z - p.z); }
  else if (mode === 'static') { }
  else { walkStep(dt); G.camFwd.set(Math.sin(yaw), 0, Math.cos(yaw)); }
  // ---- the wind: a steady sea breeze, a slowly turning direction, and gusts that roll through now and then
  const W = G.windState; W.time = t;
  if (t > nextGust) { gustStart = t; gustLen = 5 + Math.random() * 5; gustAmp = .9 + Math.random() * 1.1; nextGust = t + 14 + Math.random() * 22; }
  const gp = (t - gustStart) / gustLen, gust = gp >= 0 && gp <= 1 ? Math.pow(Math.sin(Math.PI * gp), 2) * gustAmp : 0, ang = .38 + .3 * Math.sin(t * .045) + .12 * Math.sin(t * .13 + 1) + gust * .12;
  W.gain = .5 + .2 * Math.sin(t * .12) + .12 * Math.sin(t * .29 + 2) + gust; W.dx = Math.cos(ang); W.dz = Math.sin(ang); G.wind = W.gain;
  W.px = camera.position.x; W.py = camera.position.y; W.pz = camera.position.z; W.playerR = params.has('playerr') ? parseFloat(params.get('playerr')) : (mode === 'walk' ? 1.7 : 1.3);
  if (G.autoTime) { const u = (G.timeU + dt * .004) % 1.0; G.applyTime(u > .999 ? 0 : u); slider.value = Math.round(G.timeU * 100); showName(); }
  if (frame % 10 === 1) { G.updateCover(); G.updateTrees(); }
  if (locked && frame % 5 === 0) { const hit = pickThing(rayFrom()), info = hit && infoFor(hit); tip.textContent = info ? info.ceb : ''; tip.style.left = '54%'; tip.style.top = '51%'; tip.style.opacity = info ? 1 : 0; $('reticle').classList.toggle('on', !!info); }
  G.swayPlants(t); G.swayTrees(t); if (G.updatePond) G.updatePond(t); G.updateFlags(t, G.wind); G.updateMagic(t, dt); if (frame % 2 === 0) G.updateBoats(t); if (G.updateFauna) G.updateFauna(t, dt, frame); G.flickerCandles(t);
  fpsT += dt; if (fpsT > 3 && frame > 120) { fpsT = 0; const f = engine.getFps(); if (f < 20) { if (++lowCount >= 2 && resScale < 1.6) { lowCount = 0; resScale += .2; engine.setHardwareScalingLevel(G.baseScale * G.QUAL.scale * resScale); } } else { lowCount = 0; if (f > 58 && resScale > 1) { resScale = Math.max(1, resScale - .1); engine.setHardwareScalingLevel(G.baseScale * G.QUAL.scale * resScale); } } }
});
engine.runRenderLoop(() => scene.render());
addEventListener('resize', () => engine.resize());
let ready = false; scene.executeWhenReady(() => { ready = true; console.log('READY_MS ' + Math.round(performance.now()) + ' ' + JSON.stringify(window.__t)); $('loading').classList.add('hide'); if (params.has('t') || params.has('walk')) $('title').style.display = 'none'; else setTimeout(() => $('title').classList.add('hide'), 9500); });
G.applyTime(G.timeU); showName();
if (params.has('hideui')) document.body.classList.add('noui');
if (params.has('showkeys')) toggleKeys();
window.__garden = G;
const testName = params.get('test');
if (testName) setTimeout(() => {
  const clickAt = (x, y) => { canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true, pointerId: 1 })); canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, bubbles: true, pointerId: 1 })); };
  const screen = p => { const v = V3.Project(p, M4.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())); return [v.x * canvas.clientWidth / engine.getRenderWidth(), v.y * canvas.clientHeight / engine.getRenderHeight()]; };
  if (testName === 'flower') { let best = null, bd = 1e9; const f = G.camFwd, fl = Math.hypot(f.x, f.z); for (const p of G.plants) { const dx = p.x - camera.position.x, dz = p.z - camera.position.z, d = Math.hypot(dx, dz); if (d > 3 && d < 11 && (dx * f.x + dz * f.z) / d / fl > .9 && d < bd) { bd = d; best = p; } }
    if (best) { const [x, y] = screen(new V3(best.x, best.y + best.H * .6, best.z)); console.log('TEST flower ' + best.sp + ' screen ' + x.toFixed(0) + ',' + y.toFixed(0)); clickAt(x, y); console.log('TEST card ' + $('cname').textContent + ' | bayong ' + $('count').textContent); } else console.log('TEST no flower in view'); }
  if (testName === 'candle') { setMode('walk'); camera.position.set(G.shrinePos.x, G.shrinePos.y + .6, G.shrinePos.z - 2.6); yaw = 0; pitch = .1; setTimeout(() => { const c = G.candles[2], d = c.pos.subtract(camera.position).normalize(); G.testRay = new B.Ray(camera.position.clone(), d, 60); const before = G.candles.map(q => q.lit).join(); clickAt(10, 10); const mid = G.candles.map(q => q.lit).join(); clickAt(10, 10); console.log('TEST candles before ' + before + ' after1 ' + mid + ' after2 ' + G.candles.map(q => q.lit).join() + ' card ' + $('cname').textContent); G.testRay = null; }, 600); }
  if (testName === 'puso') { const pos = G.houseLocalToWorld(0, 4.6, -5.9); camera.position.set(pos.x - 6, pos.y - 1, pos.z); yaw = Math.PI / 2; pitch = -Math.atan2(1, 6) * -1 * 0; camera.rotation.set(pitch, yaw, 0); setTimeout(() => { const [x, y] = screen(pos); clickAt(x, y); console.log('TEST puso card ' + $('cname').textContent); }, 400); }
}, 7000);
})();
if (G.params.has('debug')) setTimeout(() => { const c = G.cover[0], m = c.m, d = m.thinInstanceGetWorldMatrices ? m.thinInstanceGetWorldMatrices() : null; console.log('COV n=' + G.cover.length + ' name=' + m.name + ' count=' + m.thinInstanceCount + ' scaling=' + m.scaling.toString() + ' pos=' + m.position.toString() + ' enabled=' + m.isEnabled() + ' verts=' + m.getTotalVertices() + ' bb=' + m.getBoundingInfo().boundingBox.extendSizeWorld.toString() + ' m0=' + (d && d[0] ? Array.from(d[0].m).map(x => x.toFixed(2)).join(',') : 'na')); const src = m.sourceMesh; console.log('SRC ' + (src ? src.name : 'none')); }, 6000);
