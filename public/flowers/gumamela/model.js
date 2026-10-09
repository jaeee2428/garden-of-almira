/* =====================================================================
   flowers/gumamela/model.js - the 3D model of Gumamela (Hibiscus rosa-sinensis)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K, shrub } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
function gumamelaFlower(mb, M, col, r) {                         // Hibiscus rosa-sinensis
  const cols = [rgb(col.eye), rgb(col.body), rgb(col.edge)], n = 5, a0 = r() * 6.28;
  for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.283 + Rr(-.05, .05, r), d = dirOn(.95 + Rr(-.08, .08, r), a); petal(mb, .115, .112, pm(d, AX, ORG, Rr(-.08, .08, r)).multiply(M), cols, { cup: .6, curl: -.22, ruf: .22, pw: .55, sh: .45, nu: 8, nv: 8, throat: .3, notch: .15 }); }
  const col2 = rgb('#f4cfc8'), pts = [new V3(0, 0, 0), new V3(0, .006, .06), new V3(0, .022, .125), new V3(0, .04, .17)];
  mb.tube(pts, [.0045, .0032], 6, t => mixA(col2, rgb('#d9808a'), t), M);
  for (let i = 0; i < 9; i++) { const t = .55 + .4 * i / 9, p = ptAt(pts, t), a = i * 2.4; mb.ellipsoid(p.x + Math.cos(a) * .008, p.y + Math.sin(a) * .008, p.z, .0065, .0065, .009, 5, 4, () => rgb('#e8a21a'), M); }
  for (let i = 0; i < 5; i++) { const p = pts[3], a = i / 5 * 6.28; mb.ellipsoid(p.x + Math.cos(a) * .006, p.y + Math.sin(a) * .006, p.z + .004, .0055, .0055, .0055, 5, 4, () => rgb('#8d0c20'), M); }
  for (let i = 0; i < 5; i++) leaf(mb, .045, .02, pm(dirOn(.55, i / 5 * 6.28 + .3), AX, ORG, 0).multiply(M), rgb('#2d6a2f'), rgb('#4e8d38'), { nu: 3, nv: 2, fold: .3, curl: .08 });
}
const GUM = {
  red: { eye: '#6c0015', body: '#d3122c', edge: '#ee3a4a' }, pink: { eye: '#8b1a46', body: '#f06fa0', edge: '#ffb3cf' },
  yellow: { eye: '#b3221c', body: '#ffc61c', edge: '#ffe36a' }, orange: { eye: '#8a1a10', body: '#f26a1b', edge: '#ffa24a' }
};
const leafGlossy = [rgb('#1e5622'), rgb('#3f8a33')];
function gumamela(variant, seed) {                                   // an upright shrub ~1.6 m: alternate toothed glossy leaves on stalks, big single flowers on long stalks from the upper leaf axils
  const r = rng(seed), col = GUM[variant];
  return [shrub({ stems: 7, H: 1.55, lean: .42, up: .12, r0: .016, bark: ['#6a5b3c', '#4a7a2a'], orders: 3, side: [4, 2], sub: .5, ang: .65,
    leaf: { L: .1, W: .07, c0: leafGlossy[0], c1: leafGlossy[1], o: { ser: .05, base: .55, sharp: .7, nu: 6, nv: 2, fold: .25, curl: .1 }, phyllo: 'alt', nodes: 13, pitch: .95, droop: .2, pet: .03 },
    axilP: .16, axilFrom: .45, axil: (mb, d, p, r) => { const q = p.add(d.scale(.05)).add(new V3(0, .025, 0)), fd = d.add(new V3(0, .45, 0)).normalize();
      mb.tube([p, p.add(d.scale(.03)).add(new V3(0, .016, 0)), q], [.0028, .002], 4, () => rgb('#4f7a2e')); gumamelaFlower(mb, pm(fd, UP, q, r() * 6, .62), col, r); },
    tipP: .5, tip: (mb, p, d) => { mb.ellipsoid(p.x, p.y + .018, p.z, .009, .024, .009, 6, 5, (u, v) => mixA(rgb('#5a8a3a'), rgb(col.body), v * .55)); } }, r)];   // a furled bud
}

Object.assign(G.geo, { gumamelaFlower, gumamela, GUM });
})();
