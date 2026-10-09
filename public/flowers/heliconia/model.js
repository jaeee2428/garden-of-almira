/* =====================================================================
   flowers/heliconia/model.js - the 3D model of Heliconia (Heliconia)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
/* ---------- heliconia: boat-shaped bracts ---------- */
function heliconia(seed) {                                           // a banana-like clump ~1.5 m: leaves on long stalks wrapped into pseudo-stems, 2-3 upright zigzag spikes of red boat-shaped bracts tipped yellow
  const r = rng(seed), mb = new MB(), ns = Math.max(4, Math.round(7 * K()));
  for (let s = 0; s < ns; s++) {
    const a = s / ns * 6.283 + Rr(-.3, .3, r), d0 = Rr(.03, .18, r), base = new V3(Math.sin(a) * d0, 0, Math.cos(a) * d0), h = Rr(.45, .8, r);
    const stem = [base, base.add(new V3(0, h * .5, 0)), base.add(new V3(Math.sin(a) * .03, h, Math.cos(a) * .03))]; mb.tube(stem, [.022, .015], 6, () => rgb('#5a8a2a'));
    const ang = a + Rr(-.5, .5, r), lean = Rr(.35, .75, r), pd = new V3(Math.sin(ang) * Math.sin(lean), Math.cos(lean), Math.cos(ang) * Math.sin(lean)), pl = Rr(.25, .45, r), ptop = stem[2].add(pd.scale(pl));
    mb.tube([stem[2], stem[2].add(pd.scale(pl * .5)), ptop], [.011, .008], 5, () => rgb('#6a9a3a'));                             // the leaf stalk
    leaf(mb, Rr(.75, 1.0, r), Rr(.2, .26, r), basis(pd.add(new V3(0, -.15, 0)).normalize(), UP, ptop, Rr(-.2, .2, r)), rgb('#2a6a2a'), rgb('#62aa3a'), { nu: 11, nv: 4, fold: .12, curl: -.24, base: .8, sharp: .55, rib: rgb('#b8d070'), ser: .02 });
  }
  for (let k = 0; k < (G.LODV === 2 ? 1 : 3); k++) {                                                                          // the inflorescences
    const a = k * 2.3 + r(), b0 = new V3(Math.sin(a) * .06, 0, Math.cos(a) * .06), H = Rr(1.05, 1.45, r), stalk = [];
    for (let j = 0; j <= 6; j++) { const t = j / 6; stalk.push(b0.add(new V3(Math.sin(a) * .1 * t, .1 + H * t, Math.cos(a) * .1 * t))); }
    mb.tube(stalk, [.014, .01], 5, () => rgb('#7a8a2a'));
    const nb = Math.max(4, Math.round(7 * K())), top = stalk[6], zig = [];
    for (let b = 0; b <= nb; b++) { const t = b / nb, side = b % 2 ? 1 : -1; zig.push(top.add(new V3(Math.cos(a) * .018 * side, t * .32, -Math.sin(a) * .018 * side))); }
    mb.tube(zig, [.008, .004], 4, () => rgb('#c03018'));                                                                        // the zigzag rachis
    for (let b = 0; b < nb; b++) { const p = zig[b], side = b % 2 ? 1 : -1, out = new V3(Math.cos(a) * side, 0, -Math.sin(a) * side), dir = out.scale(.75).add(new V3(0, .65, 0)).normalize();
      petal(mb, .14 - b * .01, .06, basis(dir, UP, p, 0, 1), [rgb('#8a1010'), rgb('#e0261a'), rgb('#ffcf2a')], { cup: 1.1, curl: .14, pw: .6, sh: .45, nu: 8, nv: 7, throat: .15, veins: .6 }); }
  }
  return [mb];
}

Object.assign(G.geo, { heliconia });
})();
