/* =====================================================================
   flowers/kalachuchi/model.js - the 3D model of Kalachuchi (Plumeria rubra)
   Built from the shared toolkit in js/flora/plant-geometry.js; registers its builders on G.geo.
   Botanical description it follows: see "look" in card.js. Screenshots: renders/.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, MB, basis, rgb, mixA, shade, clamp, lerp, rng } = G, geo = G.geo;
const { leaf, petal, pm, sideDir, ptAt, tanAt, wood, branch, addLeaves, dirOn, AX, K } = geo;
const UP = V3.Up(), ORG = V3.Zero(), Rr = (a, b, r) => a + (b - a) * r();
function kalachuchiFlower(mb, M, col, r) {                         // Plumeria rubra, the frangipani
  const cols = [rgb(col.throat), rgb(col.body), rgb(col.edge)], a0 = r() * 6.28;
  for (let i = 0; i < 5; i++) { const a = a0 + i / 5 * 6.283; petal(mb, .068, .04, pm(dirOn(1.32, a), AX, ORG, .38).multiply(M), cols, { cup: .35, curl: .15, tw: .55, pw: .5, sh: .5, nu: 8, nv: 6, throat: .32, veins: .6 }); }
  mb.tube([new V3(0, 0, -.02), new V3(0, 0, .004)], [.004, .003], 6, () => rgb(col.throat), M);
}
function kalachuchi(variant, seed) {                               // a small tree ~2.2 m: a short thick trunk forking again and again into blunt grey branches; rosettes of long
  const r = rng(seed), mb = new MB(), col = variant === 'pink' ? { throat: '#ffd23c', body: '#fff0f0', edge: '#ff7f9f' } : { throat: '#ffcc2a', body: '#fffaf0', edge: '#ffffff' };   // leaves at the tips, flower clusters held up above them
  const bark = (t, a) => shade(mixA(rgb('#8f8f80'), rgb('#7a8068'), t), (t * 23 % 1) < .08 ? .82 : 1);                            // grey bark with leaf-scar rings
  const fork = (p0, dir, len, rad, depth) => {
    const pts = []; let d = dir.clone(), p = p0.clone();
    for (let i = 0; i < 5; i++) { pts.push(p.clone()); d = d.add(new V3((r() - .5) * .15, .12, (r() - .5) * .15)).normalize(); p = p.add(d.scale(len / 4)); }
    mb.tube(pts, t => rad * (1 - .3 * t), G.LODV ? 5 : 9, bark); const tip = pts[4], td = tanAt(pts, .99);
    if (depth > 0) { const n = depth === 2 ? 3 : 2 + (r() < .4 ? 1 : 0), a0 = r() * 6.28;                                       // forks in twos and threes
      for (let k = 0; k < n; k++) { const sd = sideDir(td, a0 + k / n * 6.283), nd = td.scale(.6).add(sd.scale(.8)).normalize(); fork(tip, nd, len * Rr(.7, .9, r), rad * .72, depth - 1); } return; }
    mb.ellipsoid(tip.x, tip.y, tip.z, rad * 1.05, rad * .8, rad * 1.05, 8, 5, () => rgb('#7a8068'));                            // the blunt branch end
    const nl = Math.max(7, Math.round(15 * K()));
    for (let i = 0; i < nl; i++) { const a = i * 2.4 + r(), up = .25 + .5 * (i / nl), ld = new V3(Math.sin(a) * Math.cos(up), Math.sin(up) + .15, Math.cos(a) * Math.cos(up)).normalize(), base = tip.add(ld.scale(.03));
      mb.tube([tip, base], [.007, .005], 3, () => rgb('#6f8a4a'));                                                             // leaf stalk
      leaf(mb, Rr(.26, .36, r), Rr(.075, .095, r), pm(ld, UP, base, Rr(-.2, .2, r)), rgb('#2a6a30'), rgb('#5da042'), { nu: 9, nv: 2, fold: .3, curl: -.2, base: .7, sharp: .55, rib: rgb('#b6d27c') }); }
    if (r() < .85) { const ped = [tip, tip.add(td.scale(.08)).add(new V3(0, .1, 0)), tip.add(td.scale(.1)).add(new V3(0, .2, 0))]; mb.tube(ped, [.008, .005], 5, () => rgb('#6f8a4a'));   // the flower stalk rises above the leaves
      const c = ped[2], nf = Math.max(4, Math.round(11 * K()));
      for (let f = 0; f < nf; f++) { const a = f * 2.4 + r(), rr = Rr(.02, .08, r), p = c.add(new V3(Math.cos(a) * rr, Rr(-.01, .05, r), Math.sin(a) * rr)), dir = new V3(Math.cos(a) * rr * 7, 1, Math.sin(a) * rr * 7).normalize();
        mb.tube([c, p], .0025, 3, () => rgb('#6f8a4a'));
        if (f < nf - 3) kalachuchiFlower(mb, pm(dir, UP, p, Rr(0, 6, r), .85), col, r); else mb.ellipsoid(p.x, p.y + .015, p.z, .007, .02, .007, 5, 4, () => rgb(col.body)); } }   // buds
  };
  fork(new V3(0, -.05, 0), new V3(Rr(-.05, .05, r), 1, Rr(-.05, .05, r)).normalize(), .75, .1, 2);
  return [mb];
}

Object.assign(G.geo, { kalachuchiFlower, kalachuchi });
})();
