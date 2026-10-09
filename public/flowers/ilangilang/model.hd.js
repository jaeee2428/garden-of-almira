/* =====================================================================
   flowers/ilangilang/model.js - the 3D model of Ilang-ilang (Cananga odorata)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
function ilangIlang(seed) {                                         // Cananga odorata, the perfume tree
  const r = rng(seed), mb = new MB(), H = Rr(6.2, 7.2, r), trunk = [];
  for (let k = 0; k <= 14; k++) { const t = k / 14; trunk.push(new V3(Math.sin(t * 3 + seed) * .22 * t, H * t, Math.cos(t * 2.4 + seed) * .22 * t)); }
  (G.geo.ilangTrunk = G.geo.ilangTrunk || {})[seed] = trunk;
  mb.tube(trunk, t => .22 * (1 - t) + .07 * t + .12 * Math.exp(-t * 12), 11, (t, a) => shade(mixA(rgb('#8c8c7a'), rgb('#6d6a58'), .5 + .5 * Math.sin(t * 40 + a * 6)), 1));
  const fl = new MB(), flowerCols = [rgb('#d9d24a'), rgb('#bdc43a')];
  const rs = rng(seed * 13 + 5), branchData = (G.geo.ilangBranches = G.geo.ilangBranches || {});      // the branch skeleton has its own random stream so every level of detail keeps the SAME branches
  if (!G.LODV) branchData[seed] = [];
  for (let lv = 0; lv < 6; lv++) for (let k = 0; k < 4; k++) {
    const t = .3 + lv * .11, o = ptAt(trunk, t), yaw = k * (6.283 / 4) + lv * .9 + Rr(-.3, .3, rs), L = Rr(2.4, 3.4, rs) * (1.1 - t * .5), pts = [];
    for (let i = 0; i < 8; i++) { const u = i / 7; pts.push(new V3(o.x + Math.sin(yaw) * L * u, o.y + L * (.38 * u - .95 * u * u) + .1, o.z + Math.cos(yaw) * L * u)); }
    if (!G.LODV) branchData[seed].push({ lv, k, pts, t });
    if ((G.LODV === 2 && k % 2) || (G.LODV === 1 && k === 3)) continue;                  // fewer branches far away, but never different ones
    mb.tube(pts, [.06, .014], 6, t2 => mixA(rgb('#7a7a68'), rgb('#6a8a4a'), t2));
    for (let i = 0, NLf = Math.max(8, Math.round(26 * K())); i < NLf; i++) { const u = .1 + .9 * (i + .5) / NLf, p = ptAt(pts, u), d = tanAt(pts, u), s = i % 2 ? 1 : -1, dir = d.scale(.35).add(new V3(Math.cos(yaw) * s, 0, -Math.sin(yaw) * s).scale(.85)).add(new V3(0, -.25, 0)).normalize(); leaf(mb, .3, .105, pm(dir, UP, p, 0), rgb('#2a6a30'), rgb('#5a9a3d'), { nu: 5, nv: 2, fold: .2, curl: -.3, base: .7, sharp: .6 }); }
    for (let c = 0; c < Math.max(2, Math.round(4 * K())); c++) { const u = .4 + c * .14 + Rr(0, .05, r), p = ptAt(pts, u); for (let q = 0; q < Math.max(2, Math.round(4 * K())); q++) { const a = q * 1.57 + c; for (let i = 0; i < 6; i++) { const aa = i / 6 * 6.283 + a, d = new V3(Math.sin(.9) * Math.cos(aa), -.8 + Math.sin(.4) * Math.sin(aa) * .3, Math.sin(.9) * Math.sin(aa)).normalize(); petal(fl, .11, .014, pm(d, UP, p.add(new V3(Math.cos(a) * .02, -.05, Math.sin(a) * .02)), 0), [flowerCols[0], flowerCols[0], flowerCols[1]], { nu: 6, nv: 1, cup: 0, curl: -.15, tw: 1.2, pw: .5, sh: .5, throat: .1, veins: 0 }); } } }
  }
  return [mb, fl];
}

Object.assign(G.geo, { ilangIlang });
})();
