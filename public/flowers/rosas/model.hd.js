/* =====================================================================
   flowers/rosas/model.js - the 3D model of Rosas (Rosa × hybrida)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K, shrub } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
/* ---------- rosas ---------- */
const ROSE = { red: { base: '#5a0614', body: '#c4112f', edge: '#f04a63' }, pink: { base: '#b53a64', body: '#ff8fb3', edge: '#ffd3e2' }, white: { base: '#e6dcb4', body: '#fff7e6', edge: '#ffffff' }, yellow: { base: '#d98a10', body: '#ffd23a', edge: '#fff0a0' } };
function roseFlower(mb, M, col, r) {
  const c = [rgb(col.base), rgb(col.body), rgb(col.edge)];
  [[5, .03, .026, 1.5, 0], [5, .045, .036, 1.25, .01], [6, .06, .046, 1.0, .018], [7, .075, .056, .78, .026], [8, .09, .066, .58, .032]].forEach(([n, L, W, sp, z0], ri) => {
    for (let i = 0; i < n; i++) { const a = i / n * 6.283 + ri * .55 + Rr(-.12, .12, r); petal(mb, L, W, pm(dirOn(sp, a), AX, new V3(0, 0, z0)).multiply(M), c, { cup: .75, curl: -.1 + ri * .03, ruf: .1 + ri * .04, pw: .55, sh: .5, nu: 6, nv: 7, throat: .12 }); }
  });
  for (let i = 0; i < 5; i++) leaf(mb, .05, .016, pm(dirOn(.5, i / 5 * 6.283 + .3), AX, new V3(0, 0, -.01)).multiply(M), rgb('#2d6a2f'), rgb('#4e8d38'), { nu: 3, nv: 2, fold: .25, curl: .12 });
}
function compoundLeaf(mb, M, r) {                        // rose leaves are made of 5 serrated leaflets on one stalk
  mb.tube([new V3(0, 0, 0), new V3(0, .01, .06), new V3(0, 0, .12)], [.0025, .0015], 4, () => rgb('#3f7a35'), M);
  for (let i = 0; i < 5; i++) { const z = i === 4 ? .12 : .025 + Math.floor(i / 2) * .045 + .02, sd = i === 4 ? 0 : (i % 2 ? 1 : -1); leaf(mb, .055, .034, basis(new V3(sd * .75, .15, i === 4 ? 1 : .55), UP, new V3(0, 0, z), 0).multiply(M), rgb('#22561f'), rgb('#4b8c3a'), { nu: 5, nv: 2, fold: .3, curl: .1, base: .6, sharp: .65, ser: .09 }); }
}
function rosas(variant, seed) {                                      // a rose bush ~0.95 m: thorny canes, leaves of 5 toothed leaflets, a rose or a bud at most cane ends
  const r = rng(seed), col = ROSE[variant];
  return [shrub({ stems: 6, H: .95, lean: .42, up: .1, r0: .011, bark: ['#4a5a2a', '#3f6a2a'], orders: 2, side: [3], sub: .55, ang: .6,
    leaf: { fn: (mb, M, r) => compoundLeaf(mb, M, r), phyllo: 'alt', nodes: 8, from: .2, pitch: 1.0, droop: .1, pet: 0 },
    axilP: .5, axilFrom: 0, axil: (mb, d, p) => mb.tube([p, p.add(d.scale(.011)).add(new V3(0, -.006, 0))], [.0028, .0005], 3, () => rgb('#6a2a1a')),   // thorns
    tipP: .85, tip: (mb, tip, d, r) => { const dir = d.add(new V3(0, 1.4, 0)).normalize();
      if (r() < .75) roseFlower(mb, pm(dir, UP, tip.add(dir.scale(.01)), r() * 6, .62), col, r);
      else { const q = tip.add(dir.scale(.02)); mb.ellipsoid(q.x, q.y, q.z, .011, .022, .011, 7, 5, (u, v) => mixA(rgb('#3f7a35'), rgb(col.body), v)); } } }, r)];
}

Object.assign(G.geo, { rosas, roseFlower, ROSE });
})();
