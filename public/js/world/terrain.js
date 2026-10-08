/* =====================================================================
   world/terrain.js - the shape of the land: hills, beach, pond basin, and the ground mesh
   G.hFn(x,z) is the single source of truth for ground height.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, scene } = G;
/* ---------- world shape: land, beach, sea, and the hills of the Cebu interior ---------- */
G.shoreX = z => -47 + Math.sin(z * .09) * 2.2 + Math.sin(z * .23) * .8;
G.POND = { x: -22, z: 21, r: 4.8 };                          // the lily pond
G.SEA_Y = -.45;
// The hills of the Cebu interior: a broad massif, then RIDGED noise (sharp ridgelines, soft gullies like real eroded
// hills), then small lumps. Replaces the old pure-sine hills that looked smooth and cartoony.
const ridge = (x, z, f, ox = 0, oz = 0) => { const n = 1 - Math.abs(2 * G.vnoise(x * f + ox, z * f + oz) - 1); return n * n; };
G.hillShape = (x, z) => 13 + 5 * Math.sin(x * .045 + z * .03) + 3 * Math.sin(x * .1 - z * .07)
  + 14 * ridge(x, z, .017, 3.1, 7.7) + 6.5 * ridge(x, z, .042, 11, 2) * (.4 + .6 * G.vnoise(x * .01, z * .01)) + 2.6 * ridge(x, z, .1, 5, 9)
  + 1.1 * G.vnoise(x * .23 + 40, z * .23) + .45 * G.vnoise(x * .55, z * .55);
G.hFn = (x, z) => {
  const r = Math.hypot(x, z), sm = G.smooth;
  const rolling = .5 * Math.sin(x * .07 + 1.3) * Math.cos(z * .06) + .28 * Math.sin(x * .17 + z * .11) + .12 * Math.sin(z * .29 - x * .07);
  const inland = sm(-34, 6, x);
  const hm = Math.pow(sm(46, 125, r), 1.5) * inland, hills = hm > 0 ? hm * G.hillShape(x, z) : 0;            // the garden (r < 46) is untouched
  let h = rolling * Math.pow(sm(4, 26, r), 1.1) + hills + .3;
  const P = G.POND, pd = Math.hypot(x - P.x, z - P.z); if (pd < P.r + 3) h = G.lerp(h, -.62, sm(P.r + .5, P.r - 1.6, pd));
  return G.lerp(h, -1.8, sm(4, -10, x - G.shoreX(z)));
};

/* ---------- ground ---------- */
(function ground() {
  const g = B.MeshBuilder.CreateGround('ground', { width: 270, height: 270, subdivisions: 200, updatable: true }, scene);
  const p = g.getVerticesData(B.VertexBuffer.PositionKind), n = p.length / 3, col = new Float32Array(n * 4), sm = G.smooth;
  const grass = [G.rgb('#4a7a2a'), G.rgb('#5f8f33'), G.rgb('#3f6b27'), G.rgb('#7aa23c')], dry = G.rgb('#a2944a'), sand = G.rgb('#e6d3a3'), wet = G.rgb('#b9a77e'), soil = G.rgb('#7a5a3a'), forestDark = G.rgb('#21401b'), forestLight = G.rgb('#3c6a2b'), cogon = G.rgb('#8e9552'), earth = G.rgb('#6f6450');
  for (let i = 0; i < n; i++) {
    const x = p[i * 3], z = p[i * 3 + 2], y = G.hFn(x, z); p[i * 3 + 1] = y;
    const nz = G.vnoise(x * .2, z * .2), nz2 = G.vnoise(x * .9 + 5, z * .9 + 2), r = Math.hypot(x, z), d = x - G.shoreX(z);
    let c = G.mixA(G.mixA(grass[0], grass[1], nz), G.mixA(grass[2], grass[3], nz2), .4);
    c = G.mixA(c, dry, sm(.55, .95, G.vnoise(x * .06 + 20, z * .06)) * .6);
    const hk = sm(40, 70, r) * sm(-34, -24, x);
    if (hk > 0) {                                                       // the hills: forest canopy, cogon grass on gentle tops, bare earth on steep faces
      const e = .9, sx = (G.hFn(x + e, z) - G.hFn(x - e, z)) / (2 * e), sz = (G.hFn(x, z + e) - G.hFn(x, z - e)) / (2 * e), slope = Math.hypot(sx, sz);
      const can = G.vnoise(x * .21 + 7, z * .21) * .65 + G.vnoise(x * .7, z * .7 + 3) * .35;                      // tree-crown mottling
      let hc = G.mixA(forestDark, forestLight, can);
      hc = G.mixA(hc, cogon, sm(.55, .8, G.vnoise(x * .045 + 9, z * .045)) * sm(.5, .2, slope) * sm(8, 16, y) * .8);
      hc = G.mixA(hc, earth, sm(.75, 1.25, slope) * (.55 + .45 * G.vnoise(x * .3, z * .3)));
      c = G.mixA(c, G.shade(hc, .92 + .1 * sm(4, 30, y)), hk);
    }
    c = G.mixA(c, soil, sm(.7, .95, G.vnoise(x * .35 + 40, z * .35)) * .25 * (1 - sm(30, 50, r)));
    c = G.mixA(c, sand, sm(6.5, 3.5, d) * (.85 + .15 * nz2)); c = G.mixA(c, wet, sm(.2, -2.6, d));        // a real beach: ~6 m of dry sand, wet sand where the swash reaches
    col.set([c[0], c[1], c[2], 1], i * 4);
  }
  g.updateVerticesData(B.VertexBuffer.PositionKind, p);
  const nr = []; B.VertexData.ComputeNormals(p, g.getIndices(), nr); g.updateVerticesData(B.VertexBuffer.NormalKind, nr);
  g.setVerticesData(B.VertexBuffer.ColorKind, col);
  const tex = new B.DynamicTexture('groundDetail', { width: 256, height: 256 }, scene, true), ctx = tex.getContext(), img = ctx.createImageData(256, 256), rr = G.rng(5);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const v = 205 + (G.vnoise(x * .09, y * .09) * 40) + (rr() * 22) - 10 + G.vnoise(x * .4, y * .4) * 14; const o = (y * 256 + x) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = G.clamp(v, 0, 255); img.data[o + 3] = 255; }
  ctx.putImageData(img, 0, 0); tex.update(); tex.uScale = tex.vScale = 70; tex.anisotropicFilteringLevel = 8;
  const m = G.mat('groundMat', { specular: C3.Black() }); m.diffuseTexture = tex; g.material = m; g.receiveShadows = true; g.isPickable = false; g.freezeWorldMatrix();
  G.ground = g;
})();
})();
