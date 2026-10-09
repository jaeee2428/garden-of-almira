/* =====================================================================
   flowers/santan/model.js - the 3D model of Santan (Ixora coccinea)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K, shrub } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
function santanHead(mb, M, col, r, n = 28) {                        // Ixora coccinea: a dome of tiny four-petalled stars
  n = Math.max(6, Math.round(n * K()));
  const cA = rgb(col), cB = shade(cA, .72), cT = shade(cA, 1.12);
  for (let i = 0; i < n; i++) {
    const ph = Math.acos(1 - Rr(0, .85, r)), th = i * 2.4 + Rr(-.2, .2, r), d = new V3(Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)), p = d.scale(.04);
    const F = pm(d, UP, p, i).multiply(M);
    mb.tube([new V3(0, 0, -.026), new V3(0, 0, 0)], [.0016, .0022], 4, t => mixA(cB, cA, t), F);
    for (let k = 0; k < 4; k++) petal(mb, .0105, .0105, pm(dirOn(1.25, k * 1.571 + .3), AX, ORG).multiply(F), [cA, cA, cT], { cup: .2, curl: .08, nu: 3, nv: 3, pw: .85, sh: .45, throat: .01, veins: 0 });
  }
  mb.tube([new V3(0, 0, -.03), new V3(0, 0, .02)], .004, 4, () => rgb('#4b7a2a'), M);
}
function santan(variant, seed) {                                     // a compact, dense hedge shrub ~0.85 m: stiff opposite leaves almost without stalks, a round head of flowers on most twigs
  const r = rng(seed), col = variant === 'yellow' ? '#f6c61c' : '#e5381a';
  return [shrub({ stems: 10, H: .85, lean: .55, up: .14, r0: .01, bark: ['#5a4a30', '#5a7a30'], orders: 2, side: [3], sub: .55, ang: .6,
    leaf: { L: .085, W: .032, c0: rgb('#1b4a24'), c1: rgb('#2f7a35'), o: { base: .7, sharp: .55, nu: 5, nv: 2, fold: .35, curl: .05 }, phyllo: 'opp', nodes: 12, pitch: 1.0, droop: .08, pet: .002 },
    tipP: .85, tip: (mb, p, d, r) => { const dir = d.add(new V3(0, 1.2, 0)).normalize(); santanHead(mb, pm(dir, UP, p.add(dir.scale(.012)), r() * 6, 1.25), col, r, 22); } }, r)];
}

Object.assign(G.geo, { santanHead, santan });
})();
