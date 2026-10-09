/* =====================================================================
   game/interaction.js - what is under the cursor, the guide card, and your bayong (basket)
   Picking is done on the CPU (cheap): plants are scored by distance from the ray to their
   own stem line, G.hot things by distance to their centre; anything behind a solid is skipped.
   ===================================================================== */
(() => {
const { B, V3, M4, scene, canvas, camera } = G;
const $ = id => document.getElementById(id), params = G.params, P = G.player;

/* ---------- picking ---------- */
function rayFrom(e) { if (G.testRay) return G.testRay; return P.locked ? scene.createPickingRay(canvas.clientWidth / 2, canvas.clientHeight / 2, M4.Identity(), camera) : scene.createPickingRay(e.clientX, e.clientY - canvas.getBoundingClientRect().top, M4.Identity(), camera); }
const occ = []; let occReady = false;
function occluders() { if (!occReady) { occReady = true; ['ground', 'stoneWalls', 'plankWalls', 'roof', 'balcony', 'bahayKubo', 'tubod', 'tapayan', 'clayPots'].forEach(n => { const mm = scene.getMeshByName(n); if (mm) occ.push(mm); }); } return occ; }
function occlusion(r) { let d = 1e9; for (const mm of occluders()) { const pi = r.intersectsMesh(mm, false); if (pi && pi.hit && pi.distance < d) d = pi.distance; } return d; }
const PEN = { candle: .5, diwata: .5, hen: .55, alibangbang: .55, parol: .6, puso: .6, bangka: 1.2, fairyring: 1.4, shrine: 1.2 };      // lower = easier to pick
function pickThing(r) {
  // the label must name what you actually see: every candidate is a rough solid (a plant's stem-to-crown capsule, a sphere for other things);
  // the one whose surface the ray reaches FIRST wins - a plant behind another can no longer steal the label, and the big
  // invisible hot zones (a whole pond, a tree) count only as deep as the thing really is
  const tOcc = occlusion(r) - .1, o = r.origin, d = r.direction, cull = G.QUAL.cull * G.QUAL.cull; let best = null, bs = 1e9;
  const enter = (t, dist, rad, body) => t - body * Math.sqrt(Math.max(0, 1 - (dist / rad) * (dist / rad)));     // depth where the ray meets the surface
  const score = (cx, cy, cz, rad, pen, body) => { const vx = cx - o.x, vy = cy - o.y, vz = cz - o.z, t = vx * d.x + vy * d.y + vz * d.z; if (t < .3 || t > 45 || t > tOcc) return -1; const ex = vx - d.x * t, ey = vy - d.y * t, ez = vz - d.z * t, dist = Math.sqrt(ex * ex + ey * ey + ez * ez); if (dist > rad) return -1; return enter(t, dist, rad, body) + dist / rad * .3 * pen; };
  function scorePlant(p, rad) {           // closest point between the ray and the plant's stem-to-crown line
    const uy = p.H, wx = p.x - o.x, wy = p.y - o.y, wz = p.z - o.z, a = uy * uy, b = uy * d.y, d1 = uy * wy, e1 = d.x * wx + d.y * wy + d.z * wz; let s = a - b * b > 1e-6 ? (b * e1 - d1) / (a - b * b) : 0; s = s < 0 ? 0 : s > 1 ? 1 : s;
    const t = e1 + s * b; if (t < .3 || t > 45 || t > tOcc) return -1; const ex = wx - d.x * t, ey = wy + s * uy - d.y * t, ez = wz - d.z * t, dist = Math.sqrt(ex * ex + ey * ey + ez * ez); return dist > rad ? -1 : enter(t, dist, rad, rad * .9) + dist / rad * .3;
  }
  for (const p of G.plants) { const dx = p.x - o.x, dz = p.z - o.z; if (dx * dx + dz * dz > cull) continue; const rad = (p.pr || p.r * .85) + .08, s = scorePlant(p, rad); if (s >= 0 && s < bs) { bs = s; best = { kind: 'plant', sp: p.sp, p, pos: new V3(p.x, p.y + p.H * .6, p.z) }; } }
  for (const h of G.hot) { const pos = h.local ? G.houseLocalToWorld(h.local.x, h.local.y, h.local.z) : h.pos, rad = h.r2 || h.r; if (!rad) continue; const s = score(pos.x, pos.y, pos.z, rad, h.kind === 'plant' ? 1.7 : (PEN[h.kind] ?? 1.3), Math.min(rad * .5, .7)); if (s >= 0 && s < bs) { bs = s; best = { ...h, pos }; } }
  for (const b of G.butterflies) { const q = b.root.position, s = score(q.x, q.y, q.z, .45, PEN.alibangbang, .15); if (s >= 0 && s < bs) { bs = s; best = { kind: 'alibangbang', pos: q.clone() }; } }
  return best;
}
const infoFor = hit => hit.kind === 'plant' ? G.INFO[hit.sp] : G.INFO_OTHER[hit.kind];

/* ---------- hover label: the Cebuano name of exactly what you point at ---------- */
const tip = $('tip');
function onHover(e) {
  if (e.target !== canvas) { tip.style.opacity = 0; return; } const now = performance.now(); if (now - onHover.t < 70) return; onHover.t = now;
  const hit = pickThing(rayFrom(e));
  if (hit) { const info = infoFor(hit); canvas.style.cursor = 'pointer'; tip.textContent = info ? info.ceb : ''; tip.style.left = e.clientX + 14 + 'px'; tip.style.top = e.clientY + 8 + 'px'; tip.style.opacity = info ? 1 : 0; }
  else { canvas.style.cursor = P.mode === 'walk' ? 'crosshair' : 'default'; tip.style.opacity = 0; }
}
onHover.t = 0;
function reticleStep() {                                   // walking with a locked mouse: label what is under the reticle
  if (!P.locked) return; const hit = pickThing(rayFrom()), info = hit && infoFor(hit);
  tip.textContent = info ? info.ceb : ''; tip.style.left = '54%'; tip.style.top = '51%'; tip.style.opacity = info ? 1 : 0; $('reticle').classList.toggle('on', !!info);
}

/* ---------- the guide card, and your bayong of flowers ---------- */
const card = $('card'), chips = $('chips'), collected = new Set(), ORDER = G.FLOWER_ORDER;
ORDER.forEach(k => { const c = document.createElement('div'); c.className = 'chip'; c.dataset.k = k; c.innerHTML = `<i style="background:${G.INFO[k].color}"></i><span>${G.INFO[k].ceb}</span>`; chips.appendChild(c); });
const cnt = $('count'); const saved = (() => { try { return JSON.parse(localStorage.getItem('almira.bayong') || '[]'); } catch (e) { return []; } })(); saved.forEach(k => collected.add(k));
function refreshChips() { chips.querySelectorAll('.chip').forEach(c => c.classList.toggle('got', collected.has(c.dataset.k))); cnt.textContent = collected.size + ' / ' + ORDER.length; try { localStorage.setItem('almira.bayong', JSON.stringify([...collected])); } catch (e) { } }
refreshChips();
if (collected.size === ORDER.length) G.awaken();
let cardTimer;
function showCard(info, extra) { $('cname').textContent = info.ceb;
  $('cnames').textContent = [info.english, ...(info.names || []).filter(n => n.toLowerCase() !== info.ceb.toLowerCase())].filter(Boolean).join(' · ');   // English + other local names (flower cards)
  $('cmeta').textContent = info.family ? info.family + (info.scent ? ' · scent: ' + info.scent : '') : '';
  $('csci').textContent = info.sci; $('cfact').textContent = info.fact; $('cextra').textContent = extra || ''; $('cdot').style.background = info.color; card.classList.add('show'); clearTimeout(cardTimer); cardTimer = setTimeout(() => card.classList.remove('show'), 14000); }
$('cclose').onclick = () => card.classList.remove('show');
function onClick(e) {
  if (e.target !== canvas && !P.locked) return;
  if (P.mode === 'walk' && !P.locked && canvas.requestPointerLock && !params.has('nolock')) { try { canvas.requestPointerLock(); } catch (er) { } }
  const ray = rayFrom(e), hit = pickThing(ray);
  if (!hit) { if (ray.direction.y < -.01) { const tt = (ray.origin.y - .35) / -ray.direction.y; if (tt > 0 && tt < 60) G.poke(ray.origin.x + ray.direction.x * tt, ray.origin.z + ray.direction.z * tt, .8); } return; }
  G.poke(hit.pos.x, hit.pos.z, 1);
  if (hit.kind === 'candle') { const c = G.candles[hit.idx]; c.lit = !c.lit; c.flame.setEnabled(c.lit); showCard(G.INFO_OTHER.candle, c.lit ? 'You lit a candle.' : 'You snuffed it out.'); return; }
  const info = infoFor(hit); if (!info) return;
  if (hit.kind === 'hen' && hit.ref) { hit.ref.state = 'peck'; hit.ref.timer = 2.5; }      // a touched hen stops to peck
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

G.interact = { pickThing, infoFor, rayFrom, onHover, onClick, showCard };
G.systems.add('reticle', reticleStep, { order: 90, every: 5 });
})();
