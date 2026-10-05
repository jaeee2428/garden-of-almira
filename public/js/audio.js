/* =====================================================================
   audio.js - the sounds of the garden, generated live with WebAudio
   (no audio files, no melody): just the surroundings, tied to what is
   actually moving in the scene.
     · the sea, louder as you near the shore · wind in the leaves, following
       the real wind, louder near palms, bamboo and trees
     · birds you can HEAR where they fly or perch · the rooster crowing
       when he crows · hens clucking as they peck · chicks peeping
     · frogs by the pond and an owl at night (no bee hum or cricket drone: peaceful)
     · your footsteps: grass, stone path or sand
   Browsers only allow sound after your first click or key press.
   Press M to mute / unmute.
   ===================================================================== */
(() => {
const G = window.G; if (G.params.has('nomusic')) return;
const B = G.B, btn = document.getElementById('sound');
let ctx = null, master = null, bus = null, started = false, muted = false, vol = .9, L = {}, lastBird = 0, lastFrog = 0, lastOwl = 0, lastBee = 0, stepT = 0, tickIv = null;
try { muted = localStorage.getItem('almira.muted') === '1'; } catch (e) { }
const rnd = (a, b) => a + Math.random() * (b - a), clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const label = () => { if (btn) btn.textContent = muted ? '🔇 Sound' : '🔊 Sound'; };

function impulse(sec, decay) { const sr = ctx.sampleRate, len = Math.floor(sr * sec), buf = ctx.createBuffer(2, len, sr); for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); } return buf; }
function noiseSrc(sec = 3, pink = true) { const sr = ctx.sampleRate, buf = ctx.createBuffer(1, sr * sec, sr), d = buf.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (pink) { b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * .1848) * .2; } else d[i] = w * .5; } const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s; }
function panner(pan) { if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); return p; } return null; }
function out(node, pan, wet = .25) { const p = panner(pan); if (p) { node.connect(p); p.connect(bus); const w = ctx.createGain(); w.gain.value = wet; p.connect(w); w.connect(L.rv); } else { node.connect(bus); } }
// where a world position sits relative to you: left/right pan and loudness
function where(x, y, z, range = 40) { const c = G.camera, cp = c.position, r = c.getDirection(B.Vector3.Right()), dx = x - cp.x, dy = y - cp.y, dz = z - cp.z, d = Math.hypot(dx, dy, dz); if (d > range) return null; return { pan: (dx * r.x + dz * r.z) / (d + .01), gain: 1 / (1 + d * d * .012), d }; }

function init() {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC || ctx) return; ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const rv = ctx.createConvolver(); rv.buffer = impulse(1.7, 3); const rg = ctx.createGain(); rg.gain.value = .35; rv.connect(rg); rg.connect(master); L.rv = rv;
  bus = ctx.createGain(); bus.connect(master);
  const layer = (type, freq, q, gain, pink = true) => { const n = noiseSrc(4, pink), f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); g.gain.value = gain; n.connect(f); f.connect(g); g.connect(master); n.start(); return { g, f }; };
  L.sea = layer('lowpass', 620, .4, .05); const sw = ctx.createOscillator(), swg = ctx.createGain(); sw.frequency.value = .1; swg.gain.value = .035; sw.connect(swg); swg.connect(L.sea.g.gain); sw.start();       // slow swell
  L.wind = layer('bandpass', 480, .5, .02); L.rustle = layer('highpass', 3200, .3, .0, false); L.rustleLow = layer('bandpass', 1500, .7, .0, true);
  // no bee hum and no cricket drone: the soundscape stays soft and peaceful (silent stand-ins keep the code below simple)
  L.bee = ctx.createGain(); L.crick = ctx.createGain(); L.bee.gain.value = 0; L.crick.gain.value = 0;
  started = true; master.gain.linearRampToValueAtTime(muted ? 0 : vol, ctx.currentTime + 3);
  tickIv = setInterval(tick, 300); setInterval(stepper, 90);
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
}

/* ---------- one-shot sounds ---------- */
function chirp(x, y, z, kind = 'maya') {
  const w = where(x, y, z, 70); if (!w) return; const now = ctx.currentTime, n = 2 + Math.floor(Math.random() * 3), f0 = kind === 'dove' ? rnd(380, 520) : rnd(2300, 3700); const g0 = ctx.createGain(); g0.gain.value = (kind === 'dove' ? .05 : .045) * w.gain; out(g0, w.pan, .3);
  for (let i = 0; i < n; i++) { const t = now + i * (kind === 'dove' ? .32 : rnd(.085, .13)), o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0 * rnd(.95, 1.1), t); o.frequency.exponentialRampToValueAtTime(f0 * (kind === 'dove' ? .85 : rnd(1.15, 1.45)), t + (kind === 'dove' ? .26 : .07)); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + .012); g.gain.exponentialRampToValueAtTime(.001, t + (kind === 'dove' ? .3 : .09)); o.connect(g); g.connect(g0); o.start(t); o.stop(t + .35); }
}
function cluck(x, y, z) {
  const w = where(x, y, z, 30); if (!w) return; const now = ctx.currentTime, g0 = ctx.createGain(); g0.gain.value = .11 * w.gain; out(g0, w.pan, .2);
  const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) { const t = now + i * .11, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(rnd(380, 520), t); o.frequency.exponentialRampToValueAtTime(rnd(240, 320), t + .07); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + .09); o.connect(f); f.connect(g); g.connect(g0); o.start(t); o.stop(t + .12); }
}
function peep(x, y, z) { const w = where(x, y, z, 22); if (!w) return; const now = ctx.currentTime, g0 = ctx.createGain(); g0.gain.value = .06 * w.gain; out(g0, w.pan, .2); for (let i = 0; i < 2; i++) { const t = now + i * .12, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(rnd(3300, 4200), t); o.frequency.exponentialRampToValueAtTime(rnd(4300, 5200), t + .05); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + .008); g.gain.exponentialRampToValueAtTime(.001, t + .08); o.connect(g); g.connect(g0); o.start(t); o.stop(t + .1); } }
function crow(x, y, z) {
  const w = where(x, y, z, 90); if (!w) return; const now = ctx.currentTime, g0 = ctx.createGain(); g0.gain.value = .16 * w.gain; out(g0, w.pan, .45);
  [[0, .22, 380, 560], [.26, .2, 520, 700], [.5, .16, 560, 640], [.7, .9, 640, 420]].forEach(([dt, len, f1, f2], i) => { const t = now + dt, o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o2.type = 'square'; o.frequency.setValueAtTime(f1, t); o.frequency.linearRampToValueAtTime(f2, t + len); o2.frequency.setValueAtTime(f1 * 1.5, t); o2.frequency.linearRampToValueAtTime(f2 * 1.5, t + len); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 1.4; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + .03); g.gain.setValueAtTime(1, t + len * .75); g.gain.exponentialRampToValueAtTime(.001, t + len); o.connect(f); o2.connect(f); f.connect(g); g.connect(g0); o.start(t); o2.start(t); o.stop(t + len + .05); o2.stop(t + len + .05); });
}
function frog(x, y, z) { const w = where(x, y, z, 60); if (!w) return; const now = ctx.currentTime, g0 = ctx.createGain(); g0.gain.value = .07 * w.gain; out(g0, w.pan, .3); const n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) { const t = now + i * .24, o = ctx.createOscillator(), a = ctx.createOscillator(), ag = ctx.createGain(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(rnd(120, 160), t); o.frequency.exponentialRampToValueAtTime(rnd(190, 240), t + .16); a.frequency.value = 38; ag.gain.value = .5; f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 2.5; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + .2); a.connect(ag); ag.connect(g.gain); o.connect(f); f.connect(g); g.connect(g0); o.start(t); a.start(t); o.stop(t + .25); a.stop(t + .25); } }
function owl(x, y, z) { const w = where(x, y, z, 90); if (!w) return; const now = ctx.currentTime, g0 = ctx.createGain(); g0.gain.value = .09 * w.gain; out(g0, w.pan, .6); [0, .75].forEach((dt, i) => { const t = now + dt, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(i ? 300 : 340, t); o.frequency.linearRampToValueAtTime(i ? 270 : 330, t + .5); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + .12); g.gain.exponentialRampToValueAtTime(.001, t + .55); o.connect(g); g.connect(g0); o.start(t); o.stop(t + .6); }); }
function footstep(kind) {
  const now = ctx.currentTime, n = noiseSrc(.3, true); n.loop = false; const f = ctx.createBiquadFilter(), g = ctx.createGain(); let len = .12, gain = .1;
  if (kind === 'stone') { f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 1.6; len = .06; gain = .14; const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.value = 170; og.gain.setValueAtTime(.12, now); og.gain.exponentialRampToValueAtTime(.001, now + .08); o.connect(og); og.connect(master); o.start(now); o.stop(now + .1); }
  else if (kind === 'sand') { f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = .6; len = .16; gain = .09; } else { f.type = 'lowpass'; f.frequency.value = 1300; len = .13; gain = .075; }
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(gain, now + .012); g.gain.exponentialRampToValueAtTime(.001, now + len); n.connect(f); f.connect(g); g.connect(master); n.start(now); n.stop(now + len + .05);
}
function stepper() {
  if (!ctx || ctx.state === 'suspended' || muted) return; const sp = G.walkSpeed || 0; if (sp < .6) { stepT = 0; return; }
  stepT -= .09; if (stepT > 0) return; stepT = .62 * 3.2 / clamp(sp, 1.6, 7); const c = G.camera.position;
  footstep(G.path.dist(c.x, c.z) < 1.05 ? 'stone' : c.x < G.shoreX(c.z) + 6 ? 'sand' : 'grass');
}

/* ---------- the living mix, updated a few times a second ---------- */
function tick() {
  if (!ctx || ctx.state === 'suspended') return; const now = ctx.currentTime, S = G.state || {}, night = S.night || 0, day = 1 - clamp(night * 1.6, 0, 1), W = G.windState || { gain: .5 }, w = Math.min(1.8, W.gain), cam = G.camera.position;
  L.wind.g.gain.setTargetAtTime(.01 + .045 * w, now, .8); L.wind.f.frequency.setTargetAtTime(360 + 320 * w, now, 1);
  const dist = cam.x - G.shoreX(cam.z); L.sea.g.gain.setTargetAtTime(.02 + .12 * Math.max(0, 1 - dist / 75), now, 1.2);
  // leaves: louder the closer you are to palms, bamboo and big trees, and with the wind
  let tn = 1e9; for (const t of G.trees || []) { const d = Math.hypot(t.x - cam.x, t.z - cam.z); if (d < tn) tn = d; } const foliage = clamp(1 - tn / 26, 0, 1);
  L.rustle.g.gain.setTargetAtTime(.004 * w * (.4 + foliage * 1.4), now, .6); L.rustleLow.g.gain.setTargetAtTime(.012 * w * (.3 + foliage), now, .6);
  // bees: more of them the more flowers around you, by day
  let near = 0; for (const p of G.plants || []) { const dx = p.x - cam.x, dz = p.z - cam.z; if (dx * dx + dz * dz < 36) near++; } L.bee.gain.setTargetAtTime(.0016 * Math.min(near, 30) / 30 * day * (1 + .3 * Math.sin(now * .5)), now, .8);
  L.crick.gain.setTargetAtTime(.012 * Math.pow(night, 1.4), now, 1.5);
  // birds sing from where the birds actually are
  if (day > .4 && now - lastBird > 1.6 && Math.random() < .45 * day) { const bs = (G.birds || []).filter(b => b.root.isEnabled()); if (bs.length) { const b = bs[Math.floor(Math.random() * bs.length)], p = b.root.position; lastBird = now; chirp(p.x, p.y, p.z); } else lastBird = now; }
  if (day > .5 && Math.random() < .02) { const tr = (G.trees || [])[Math.floor(Math.random() * (G.trees || []).length)]; if (tr) chirp(tr.x, 8, tr.z, 'dove'); }
  // the chickens
  for (const a of G.chicken || []) { const p = a.root.position;
    if (a.state === 'crow') { if (!a._crowed) { a._crowed = true; crow(p.x, p.y + .5, p.z); } } else a._crowed = false;
    if (a.kind === 'chick') { if (a.state === 'walk' && Math.random() < .09) peep(p.x, p.y, p.z); }
    else if (a.state === 'peck' && Math.random() < .2) cluck(p.x, p.y + .3, p.z); else if (a.state === 'walk' && Math.random() < .03) cluck(p.x, p.y + .3, p.z); }
  // night: frogs at the pond, an owl far away
  if (night > .45) { const P = G.POND; if (now - lastFrog > 1.4 && Math.random() < .5 * night) { lastFrog = now; const a = Math.random() * 6.283; frog(P.x + Math.cos(a) * P.r, 0, P.z + Math.sin(a) * P.r); } if (now - lastOwl > 18 && Math.random() < .03) { lastOwl = now; const a = Math.random() * 6.283; owl(cam.x + Math.cos(a) * 55, 9, cam.z + Math.sin(a) * 55); } }
}
function setMuted(m) { muted = m; try { localStorage.setItem('almira.muted', m ? '1' : '0'); } catch (e) { } label(); if (ctx) { ctx.resume(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(m ? 0 : vol, ctx.currentTime, .4); } }
function start() { if (started) { if (ctx.state === 'suspended') ctx.resume(); return; } try { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); } catch (e) { console.warn('audio unavailable', e); } }
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, function once() { start(); if (started) removeEventListener(ev, once); }, { passive: true }));
if (btn) btn.onclick = () => { start(); setMuted(!muted); };
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.code === 'KeyM') { start(); setMuted(!muted); } });
label(); G.audio = { start, setMuted, get running() { return started; } };
if (G.params.has('musictest')) start();
})();
