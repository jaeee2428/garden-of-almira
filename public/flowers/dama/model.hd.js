/* =====================================================================
   flowers/dama/model.js - the 3D model of Dama de Noche (Cestrum nocturnum)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K, shrub } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
function damaFlower(mb, M, r) {                                    // Cestrum nocturnum - the night-blooming "lady of the night"
  const c = rgb('#eef5cf'), c2 = rgb('#d8e8a0');
  mb.tube([new V3(0, 0, 0), new V3(0, .001, .018), new V3(0, .003, .036)], [.0013, .0021], 5, t => mixA(c2, c, t), M);
  for (let i = 0; i < 5; i++) leaf(mb, .008, .0045, pm(dirOn(.9, i / 5 * 6.28), AX, new V3(0, .003, .036)).multiply(M), c, c, { nu: 1, nv: 1, fold: 0, curl: 0, rib: c });
}
function dama(seed) {                                                // a loose shrub ~1.7 m with long arching stems; narrow alternate leaves; clusters of slender flower tubes in the leaf axils and at the ends
  const r = rng(seed), flow = new MB();
  const cluster = (p, d, r, n) => { for (let q = 0; q < n; q++) { const dir = d.scale(.35).add(sideDir(d, q * 2.4).scale(.75)).add(new V3(0, .2, 0)).normalize(); damaFlower(flow, pm(dir, UP, p.add(dir.scale(.006)), 0, 1.15), r); } };
  const stems = shrub({ stems: 6, H: 1.7, lean: .55, up: .05, droop: .16, r0: .012, bark: ['#6a6a3a', '#7aa04a'], orders: 2, side: [5], sub: .45, ang: .7,
    leaf: { L: .12, W: .034, c0: rgb('#4a7a30'), c1: rgb('#7aa845'), o: { base: .8, sharp: .65, nu: 5, nv: 2, fold: .25, curl: -.08 }, phyllo: 'alt', nodes: 9, pitch: .9, droop: .3, pet: .01 },
    axilP: .3, axilFrom: .4, axil: (mb, d, p, r) => cluster(p, d, r, Math.max(4, Math.round(10 * K()))),
    tipP: .9, tip: (mb, p, d, r) => cluster(p, d, r, Math.max(5, Math.round(14 * K()))) }, r);
  return [stems, flow];
}

Object.assign(G.geo, { damaFlower, dama });
})();
