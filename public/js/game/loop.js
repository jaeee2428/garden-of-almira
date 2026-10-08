/* =====================================================================
   game/loop.js - the frame loop: player, wind, then every registered system (engine/systems.js)
   Also the silent safety net: if the machine struggles, render fewer pixels (nothing else changes).
   Loaded last among the game modules: it starts the render loop.
   ===================================================================== */
(() => {
const { scene, engine, camera, clamp } = G;
const $ = id => document.getElementById(id), params = G.params, P = G.player, CW = G.CONFIG.wind;

G.clock = parseFloat(params.get('t') || '0');
G.applyTime(params.has('u') ? parseFloat(params.get('u')) : .45);

/* ---------- quality: always High (?q=low only for testing) ---------- */
G.qLevel = 2;
G.setQuality = l => { l = clamp(l, 0, 2); G.qLevel = l; const T = G.TIERS[l]; G.QUAL = T; engine.setHardwareScalingLevel(G.baseScale * T.scale); G.sunLight.shadowEnabled = T.shadow; G.pipe.bloomEnabled = T.bloom; G.bloomBase = G.CONFIG.render.bloom.weight * (l ? 1 : 0); G.pipe.grainEnabled = false; G.updateCover(); G.updateTrees(); };
G.setQuality(params.get('q') === 'low' ? 0 : 2);

/* ---------- the wind: a steady sea breeze, a slowly turning direction, and gusts that roll through now and then ---------- */
let nextGust = 9, gustStart = -99, gustLen = 6, gustAmp = 1;
const Rr = ([a, b]) => a + Math.random() * (b - a);
function windStep(t) {
  const W = G.windState, gc = CW.gust, br = CW.breeze; W.time = t;
  if (t > nextGust) { gustStart = t; gustLen = Rr(gc.len); gustAmp = Rr(gc.amp); nextGust = t + Rr(gc.every); }
  // sea breeze by day (onshore, from the sea in the west -> +x), land breeze at night (offshore and weaker):
  // the land heats faster than the sea by day and cools faster at night, so the wind turns around at dusk
  const night = (G.state && G.state.night) || 0, turn = Math.PI * G.smooth(.5, .95, night) * (br.landBreeze ? 1 : 0);
  const gp = (t - gustStart) / gustLen, gust = gp >= 0 && gp <= 1 ? Math.pow(Math.sin(Math.PI * gp), 2) * gustAmp : 0, ang = .38 + turn + .3 * Math.sin(t * .045) + .12 * Math.sin(t * .13 + 1) + gust * .12;
  W.gain = (br.base + br.slow * Math.sin(t * .12) + br.fast * Math.sin(t * .29 + 2) + gust) * (1 - .35 * G.smooth(.5, .95, night)); W.dx = Math.cos(ang); W.dz = Math.sin(ang); G.wind = W.gain;
  W.px = camera.position.x; W.py = camera.position.y; W.pz = camera.position.z; W.playerR = params.has('playerr') ? parseFloat(params.get('playerr')) : (P.mode === 'walk' ? 1.7 : 1.3);
}

/* ---------- adaptive resolution ---------- */
let fpsT = 0, lowCount = 0, resScale = 1;
function perfStep(dt, frame) {
  fpsT += dt; if (fpsT <= 3 || frame <= 120) return; fpsT = 0; const f = engine.getFps(), base = G.baseScale * G.QUAL.scale;
  if (f < 20) { if (++lowCount >= 2 && resScale < 1.6) { lowCount = 0; resScale += .2; engine.setHardwareScalingLevel(base * resScale); } }
  else { lowCount = 0; if (f > 58 && resScale > 1) { resScale = Math.max(1, resScale - .1); engine.setHardwareScalingLevel(base * resScale); } }
}

let frame = 0;
scene.onBeforeRenderObservable.add(() => {
  const dt = Math.min(engine.getDeltaTime() / 1000, .1); G.clock += dt; const t = G.clock; frame++;
  G.controls.step(dt);
  windStep(t);
  G.systems.run(t, dt, frame);
  perfStep(dt, frame);
});
engine.runRenderLoop(() => scene.render());
addEventListener('resize', () => engine.resize());
scene.executeWhenReady(() => {
  console.log('READY_MS ' + Math.round(performance.now()) + ' ' + JSON.stringify(window.__t));
  $('loading').classList.add('hide');
  if (params.has('t') || params.has('walk')) $('title').style.display = 'none'; else setTimeout(() => $('title').classList.add('hide'), 9500);
});
G.applyTime(G.timeU); G.hud.showName();
if (params.has('hideui')) document.body.classList.add('noui');
if (params.has('showkeys')) G.hud.toggleKeys();
window.__garden = G;
})();
