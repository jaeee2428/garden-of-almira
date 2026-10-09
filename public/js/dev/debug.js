/* =====================================================================
   dev/debug.js - URL switches for screenshots and automated checks (no effect without them)
     ?cam=x,y,z,tx,ty,tz      fixed camera            ?atsp=gumamela&v=red   close-up of a species
     ?atplant=N               close-up of plant N     ?at=hen&i=0&d=1        close-up of an animal (frozen), + &pose=peck|crow
     ?walk=1&x=&z=&yaw=&view=third&hold=KeyW,ShiftLeft   walk there as the avatar (3rd person, holding keys)
        ?test=flower|candle|puso   click tests -> console
     ?specimen=gumamela&v=red[&close=1]   one plant of a hero flower alone in a studio high above the garden (archive renders)
     ?u=.45 time of day · ?hideui=1 · ?nomusic=1 · ?no=cover,trees,plants,orbs · ?q=low · ?debug=1
   ===================================================================== */
(() => {
const { B, V3, M4, scene, engine, canvas, camera } = G;
const $ = id => document.getElementById(id), params = G.params, P = G.player;

/* ---------- camera presets ---------- */
if (params.has('cam')) { const c = params.get('cam').split(',').map(Number); P.mode = 'static'; camera.position.set(c[0], c[1], c[2]); camera.setTarget(new V3(c[3], c[4], c[5])); G.camFwd.set(c[3] - c[0], 0, c[5] - c[2]); }
if (params.has('atplant')) { const p = G.plants[parseInt(params.get('atplant'))]; P.mode = 'static'; camera.position.set(p.x + .5, p.y + .65, p.z + .5); camera.setTarget(new V3(p.x, p.y + .45, p.z)); G.camFwd.set(-.5, 0, -.5); }
if (params.has('atsp')) { const sp = params.get('atsp'), v = params.get('v'); let p = null, bn = 1e9; for (const q of G.plants) { if (q.sp !== sp || (v && G.kinds[q.ki].v !== v) || Math.hypot(q.x + 5, q.z) > 45) continue; let n = 0; for (const o of G.plants) if (o !== q && Math.hypot(o.x - q.x, o.z - q.z) < 2.4) n++; if (n < bn) { bn = n; p = q; } }
  if (p) { P.mode = 'static'; const d = (p.H * 1.05 + .45) * (parseFloat(params.get('near')) || 1); camera.position.set(p.x + d * .6, p.y + p.H * .5, p.z + d * .8); camera.setTarget(new V3(p.x, p.y + p.H * .5, p.z)); G.camFwd.set(-.6, 0, -.8); } }
if (params.has('at')) { const lists = { hen: G.chicken, bird: G.birds, fly: G.flyers, egret: G.egret ? [G.egret] : [] }, E = (lists[params.get('at')] || [])[parseInt(params.get('i') || '0')]; if (E) { const p = E.root.position, d = parseFloat(params.get('d') || '1'); P.mode = 'static'; camera.position.set(p.x + d * .8, p.y + d * .35, p.z + d * .6); camera.setTarget(new V3(p.x, p.y + .12, p.z)); G.camFwd.set(-.8, 0, -.6); G.freezeFauna = params.get('at') !== 'egret'; } }
if (params.has('egret') && G.egret) G.systems.add('egretTest', () => { const e = G.egret, m = params.get('egret'); if (m === 'step') { e.state = 'step'; e.timer = 99; } else if (e.lunge <= 0) { e.state = 'stand'; e.timer = 99; e.lunge = 1.7; }
  const p = e.root.position, P = G.POND, dx = P.x - p.x, dz = P.z - p.z, l = Math.hypot(dx, dz) || 1, d = parseFloat(params.get('d') || '2'), sa = parseFloat(params.get('side') || '.9'), c = Math.cos(sa), s = Math.sin(sa);   // watch from over the water, a little to the side
  camera.position.set(p.x + (dx * c - dz * s) / l * d, p.y + .55, p.z + (dx * s + dz * c) / l * d); camera.setTarget(new V3(p.x, p.y + .45, p.z)); }, { order: 62 });   // ?at=egret&egret=step|strike
if (params.has('pose') && G.chicken) G.chicken.forEach(c => { c.state = params.get('pose'); c.timer = 1e9; });      // ?pose=peck|crow : hold the chickens in one pose
if (params.has('walk')) { G.controls.setMode('walk'); camera.position.set(parseFloat(params.get('x') || '-30'), 2, parseFloat(params.get('z') || '0')); P.yaw = parseFloat(params.get('yaw') || '1.57'); P.pitch = parseFloat(params.get('pitch') || '.05');
  if (G.avatar) { G.avatar.enter(camera.position.x, camera.position.z, P.yaw); G.avatar.setView(params.get('view') === 'third' ? 'third' : 'first'); }
  if (params.has('hold')) params.get('hold').split(',').forEach(k => { P.keys[k] = true; });          // e.g. &hold=KeyW,ShiftLeft : walk / run on the spot for screenshots
}

/* ---------- click tests: results go to the console ---------- */
const testName = params.get('test');
if (testName) setTimeout(() => {
  const clickAt = (x, y) => { canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true, pointerId: 1 })); canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, bubbles: true, pointerId: 1 })); };
  const screen = p => { const v = V3.Project(p, M4.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())); return [v.x * canvas.clientWidth / engine.getRenderWidth(), v.y * canvas.clientHeight / engine.getRenderHeight()]; };
  if (testName === 'flower') { let best = null, bd = 1e9; const f = G.camFwd, fl = Math.hypot(f.x, f.z); for (const p of G.plants) { const dx = p.x - camera.position.x, dz = p.z - camera.position.z, d = Math.hypot(dx, dz); if (d > 3 && d < 11 && (dx * f.x + dz * f.z) / d / fl > .9 && d < bd) { bd = d; best = p; } }
    if (best) { const [x, y] = screen(new V3(best.x, best.y + best.H * .6, best.z)); console.log('TEST flower ' + best.sp + ' screen ' + x.toFixed(0) + ',' + y.toFixed(0)); clickAt(x, y); console.log('TEST card ' + $('cname').textContent + ' | bayong ' + $('count').textContent); } else console.log('TEST no flower in view'); }
  if (testName === 'candle') { G.controls.setMode('walk'); camera.position.set(G.shrinePos.x, G.shrinePos.y + .6, G.shrinePos.z - 2.6); P.yaw = 0; P.pitch = .1; setTimeout(() => { const c = G.candles[2], d = c.pos.subtract(camera.position).normalize(); G.testRay = new B.Ray(camera.position.clone(), d, 60); const before = G.candles.map(q => q.lit).join(); clickAt(10, 10); const mid = G.candles.map(q => q.lit).join(); clickAt(10, 10); console.log('TEST candles before ' + before + ' after1 ' + mid + ' after2 ' + G.candles.map(q => q.lit).join() + ' card ' + $('cname').textContent); G.testRay = null; }, 600); }
  if (testName === 'puso') { const pos = G.houseLocalToWorld(0, 4.6, -5.9); camera.position.set(pos.x - 6, pos.y - 1, pos.z); P.yaw = Math.PI / 2; P.pitch = 0; camera.rotation.set(P.pitch, P.yaw, 0); setTimeout(() => { const [x, y] = screen(pos); clickAt(x, y); console.log('TEST puso card ' + $('cname').textContent); }, 400); }
}, 7000);

/* ---------- ?audit=1: footprint overlaps (solid things) and what placement nudged ---------- */
if (params.has('audit')) { const O = G.obstacles.filter(o => !o.box), bad = [];
  for (let i = 0; i < O.length; i++) for (let j = i + 1; j < O.length; j++) { const a = O[i], b = O[j]; if (a.tag && a.tag === b.tag && a.tag === 'bangka') continue; const d = Math.hypot(a.x - b.x, a.z - b.z); if (d < (a.r + b.r) * .9) bad.push(`${a.tag || 'r' + a.r}@${a.x.toFixed(1)},${a.z.toFixed(1)} x ${b.tag || 'r' + b.r}@${b.x.toFixed(1)},${b.z.toFixed(1)}`); }
  console.log('AUDIT overlaps ' + bad.length + (bad.length ? ': ' + bad.slice(0, 30).join(' | ') : '')); console.log('AUDIT nudged ' + G.moved.length + ': ' + G.moved.join(' | ')); }

/* ---------- ?specimen=id : a clean studio portrait of one hero flower (for flowers/<id>/renders) ---------- */
if (params.has('specimen') && params.get('specimen') === 'kadena' && G.pergola) {           // kadena grows ON the pergola: photograph it there
  const c = G.pergola.center, close = params.has('close'); P.mode = 'static';
  G.systems.add('specimenCam', () => { camera.position.set(c.x + (close ? 1.2 : 3.2), c.y + (close ? 2.2 : 1.6), c.z + (close ? .9 : 2.6)); camera.setTarget(new V3(c.x, c.y + (close ? 2.3 : 1.7), c.z)); }, { order: 99 });
} else if (params.has('specimen')) {
  const id = params.get('specimen'), v = params.get('v'), geo = G.geo, k = G.kinds.find(q => q.sp === id && (!v || q.v === v)), O = new V3(0, 300, 0);
  G.setLOD(0);
  const mbs = id === 'liryo' ? [...geo.lotus(9), ...geo.lilyPad(5)] : id === 'orkidyas' ? geo.orchid(1) : id === 'ilangilang' ? geo.ilangIlang(11) : k ? k.build(100 + G.kinds.indexOf(k) * 7) : [];
  const H = id === 'ilangilang' ? 6.8 : k ? k.H : id === 'liryo' ? .7 : .5, mat = id === 'orkidyas' ? G.mats.hang : id === 'ilangilang' ? G.mats.tree : G.mats.shrub;
  mbs.forEach((mb, i) => { const m = mb.build('specimen' + i, id === 'liryo' ? G.vc : mat); m.position.copyFrom(O); if (id === 'liryo' && i > 0) m.position.x += .35; m.alwaysSelectAsActiveMesh = true; G.cast && G.cast(m); });
  const ground = B.MeshBuilder.CreateDisc('studioGround', { radius: 4, tessellation: 48 }, scene); ground.rotation.x = Math.PI / 2; ground.position.copyFrom(O); ground.position.y -= .01;
  ground.material = G.mat('studioMat', { diffuse: id === 'liryo' ? new B.Color3(.05, .16, .15) : new B.Color3(.33, .3, .22) }); ground.receiveShadows = true;
  const close = params.has('close'), d = close ? Math.max(.45, H * .5) : H * 1.7 + .7, ty = close ? H * .78 : H * .5;
  P.mode = 'static'; scene.fogEnabled = false;
  G.systems.add('specimenCam', () => { camera.position.set(O.x + d * .82, O.y + ty + d * .22, O.z + d * .57); camera.setTarget(new V3(O.x, O.y + ty, O.z)); }, { order: 99 });
}

if (params.has('shaderdefs')) setTimeout(() => { const m = G.mats[params.get('shaderdefs')] || G.mats.shrub, sm = scene.meshes.find(q => q.material === m && q.subMeshes && q.subMeshes[0] && q.subMeshes[0].effect); const d = sm && sm.subMeshes[0].effect.defines || ''; console.log('DEFS ' + (sm ? sm.name : 'none') + ' UV1=' + /#define UV1/.test(d) + ' LEAF=' + /#define LEAFDETAIL/.test(d) + ' uvs=' + (sm && sm.isVerticesDataPresent('uv'))); }, 4000);   // ?shaderdefs=shrub
/* ---------- ?debug=1: frame stats every 3 s ---------- */
if (params.has('debug')) setInterval(() => console.log('DEBUG fps=' + engine.getFps().toFixed(1) + ' meshes=' + scene.getActiveMeshes().length + ' plantsDrawn=' + (G.stats && G.stats.drawn) + ' systems=' + G.systems.list().filter(s => s.enabled).map(s => s.name).join(',')), 3000);
// ?perf=1 : every 5 s log the frame budget: triangles drawn (thin instances counted), active meshes, and the slowest systems (ms, smoothed)
if (params.has('perf')) { G.perfOn = true; setInterval(() => {
  let tri = 0; for (const m of scene.getActiveMeshes().data.slice(0, scene.getActiveMeshes().length)) { if (!m.isVisible || !m.getTotalIndices) continue; const n = m.hasThinInstances ? m.thinInstanceCount : 1; tri += m.getTotalIndices() / 3 * n; }
  const by = {}; for (const m of scene.getActiveMeshes().data.slice(0, scene.getActiveMeshes().length)) { if (!m.isVisible || !m.getTotalIndices) continue; const n = m.hasThinInstances ? m.thinInstanceCount : 1, k = m.name.replace(/\d+/g, '#'); by[k] = (by[k] || 0) + m.getTotalIndices() / 3 * n; }
  console.log('TOPTRI ' + Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => k + ':' + Math.round(v / 1000) + 'k').join(' '));
  const sys = G.systems.list().filter(s => s.ms > .05).sort((a, b) => b.ms - a.ms).slice(0, 8).map(s => s.name + ':' + s.ms.toFixed(2)).join(' ');
  console.log('PERF fps=' + engine.getFps().toFixed(1) + ' scale=' + engine.getHardwareScalingLevel().toFixed(2) + ' tris=' + Math.round(tri / 1000) + 'k active=' + scene.getActiveMeshes().length + ' draw=' + (engine._drawCalls ? engine._drawCalls.current : '?') + ' plants=' + (G.stats && G.stats.drawn) + ' | ' + sys);
}, 5000); }
// ?gaittest=1 (with walk=1&hold=KeyW): how far the planted (lowest) foot slides per second while walking - should be ~0
if (params.has('gaittest')) { let last = null, slide = 0, n = 0, tAcc = 0; G.systems.add('gaitTest', (t, dt) => { if (!G.avatarLegs || !G.avatar) return;
  const f = G.avatarLegs.map(l => l.ankle.getAbsolutePosition().clone()), lo = f[0].y < f[1].y ? 0 : 1;
  if (last && last.i === lo && G.avatar.speed > .3) { slide += Math.hypot(f[lo].x - last.p.x, f[lo].z - last.p.z); tAcc += dt; }
  last = { i: lo, p: f[lo] }; if (tAcc > 1) { console.log('GAIT speed=' + G.avatar.speed.toFixed(2) + ' footSlide m/s=' + (slide / tAcc).toFixed(3) + ' amp=' + (G.avatar.amp || 0).toFixed(3)); slide = 0; tAcc = 0; } }, { order: 99 }); }
// ?sit=hammock|bench (with walk=1): start seated, for screenshots
if (params.has('sit') && G.avatar) setTimeout(() => { const st = (G.seats || []).find(q => q.kind === params.get('sit')); if (!st) return; const A = G.avatar; A.x = st.x + Math.sin(st.yaw) * .8; A.z = st.z + Math.cos(st.yaw) * .8; A.yaw = st.yaw; A.seat = st; A.x = st.x; A.z = st.z; A.sitFrom = { x: st.x, z: st.z }; A.sitK = 1; st.leaving = false; }, 500);
})();

