/* =====================================================================
   engine/mesh-builder.js - MB, a tiny procedural mesh builder, and placement matrices
   Every petal, leaf, trunk and feather in the garden is built with this.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, scene } = G;
/* ---------- MB: a tiny mesh builder so every petal/leaf/trunk is real geometry ---------- */
const _t = new V3();
class MB {
  constructor() { this.p = []; this.i = []; this.c = []; this.uv = []; this.su = 1; this.sv = 1; }
  scaleUV(su, sv) { this.su = su; this.sv = sv; return this; }
  get n() { return this.p.length / 3; }
  // parametric surface: fn(u,v)->[x,y,z], cfn(u,v)->[r,g,b], M = placement matrix
  grid(nu, nv, fn, cfn, M, afn) {                      // afn(u,v) -> 0..1 : how much the wind can flutter this vertex (stored in vertex alpha)
    const base = this.n;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv, q = fn(u, v);
      if (M) { V3.TransformCoordinatesFromFloatsToRef(q[0], q[1], q[2], M, _t); this.p.push(_t.x, _t.y, _t.z); } else this.p.push(q[0], q[1], q[2]);
      const c = cfn(u, v); this.c.push(c[0], c[1], c[2], afn ? afn(u, v) : (c[3] ?? 1)); this.uv.push(u * this.su, v * this.sv);
    }
    const w = nu + 1;
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * w + i, b = a + 1, c = a + w, d = c + 1; this.i.push(a, b, c, b, d, c); }
    return this;
  }
  // tube along a polyline: pts [V3], rad(t)->radius, cfn(t,a)->[r,g,b]
  tube(pts, rad, sides, cfn, M, capEnd) {
    sides = G.LODV ? Math.max(3, Math.round(sides * (G.LODV === 1 ? .7 : .5))) : Math.round(sides * 1.25);
    const rk = G.LODV === 2 ? 1.5 : G.LODV === 1 ? 1.12 : 1, rad0 = rad; rad = typeof rad0 === 'function' ? t => rad0(t) * rk : [rad0[0] * rk, rad0[1] * rk];
    const base = this.n, N = pts.length, T = new V3(), Nn = new V3(), Bn = new V3();
    for (let k = 0; k < N; k++) {
      const a = pts[Math.max(0, k - 1)], b = pts[Math.min(N - 1, k + 1)]; T.copyFrom(b).subtractInPlace(a).normalize();
      const ref = Math.abs(T.y) < .92 ? V3.Up() : V3.Right(); V3.CrossToRef(ref, T, Nn); Nn.normalize(); V3.CrossToRef(T, Nn, Bn);
      const t = k / (N - 1), r = typeof rad === 'function' ? rad(t) : G.lerp(rad[0], rad[1], t);
      for (let s = 0; s <= sides; s++) {
        const an = s / sides * Math.PI * 2, cx = Math.cos(an) * r, cy = Math.sin(an) * r;
        const x = pts[k].x + Nn.x * cx + Bn.x * cy, y = pts[k].y + Nn.y * cx + Bn.y * cy, z = pts[k].z + Nn.z * cx + Bn.z * cy;
        if (M) { V3.TransformCoordinatesFromFloatsToRef(x, y, z, M, _t); this.p.push(_t.x, _t.y, _t.z); } else this.p.push(x, y, z);
        const c = cfn(t, s / sides); this.c.push(c[0], c[1], c[2], c[3] ?? .08); this.uv.push(s / sides * this.su, t * this.sv);
      }
    }
    const w = sides + 1;
    for (let k = 0; k < N - 1; k++) for (let s = 0; s < sides; s++) { const a = base + k * w + s, b = a + 1, c = a + w, d = c + 1; this.i.push(a, c, b, b, c, d); }
    if (capEnd) { const e = pts[N - 1]; if (M) { V3.TransformCoordinatesFromFloatsToRef(e.x, e.y, e.z, M, _t); this.p.push(_t.x, _t.y, _t.z); } else this.p.push(e.x, e.y, e.z); const cc = cfn(1, 0); this.c.push(cc[0], cc[1], cc[2], 1); this.uv.push(0, 1); const tip = this.n - 1, r0 = base + (N - 1) * w; for (let s = 0; s < sides; s++) this.i.push(r0 + s, r0 + s + 1, tip); }
    return this;
  }
  ellipsoid(cx, cy, cz, rx, ry, rz, nu, nv, cfn, M) {
    if (G.LODV) { nu = Math.max(4, Math.round(nu * (G.LODV === 1 ? .7 : .5))); nv = Math.max(3, Math.round(nv * (G.LODV === 1 ? .7 : .5))); }
    return this.grid(nu, nv, (u, v) => { const th = u * Math.PI * 2, ph = v * Math.PI; return [cx + Math.cos(th) * Math.sin(ph) * rx, cy + Math.cos(ph) * ry, cz + Math.sin(th) * Math.sin(ph) * rz]; }, cfn, M);
  }
  build(name, material) {
    const m = new B.Mesh(name, scene), vd = new B.VertexData(), n = [];
    vd.positions = this.p; vd.indices = this.i; vd.colors = this.c; B.VertexData.ComputeNormals(this.p, this.i, n); vd.normals = n; if (this.uv.length / 2 === this.n) vd.uvs = this.uv; vd.applyToMesh(m);
    m.material = material || G.vc; m.isPickable = false; return m;
  }
}
G.MB = MB; G.LODV = 0;

// placement matrix: local +z -> zdir, local +y as close to yhint as possible, then rolled, then moved to pos
G.basis = (zdir, yhint, pos, roll = 0, scale = 1) => {
  const z = zdir.normalizeToNew(); let y = yhint.clone(); y.subtractInPlace(z.scale(V3.Dot(y, z)));
  if (y.lengthSquared() < 1e-6) { y = Math.abs(z.y) < .9 ? V3.Up() : V3.Right(); y.subtractInPlace(z.scale(V3.Dot(y, z))); }
  y.normalize(); let x = V3.Cross(y, z).normalize();
  if (roll) { const c = Math.cos(roll), s = Math.sin(roll), x2 = x.scale(c).subtract(y.scale(s)), y2 = y.scale(c).add(x.scale(s)); x = x2; y = y2; }
  return M4.FromValues(x.x * scale, x.y * scale, x.z * scale, 0, y.x * scale, y.y * scale, y.z * scale, 0, z.x * scale, z.y * scale, z.z * scale, 0, pos.x, pos.y, pos.z, 1);
};
const _rot = new M4();
G.yawM = (yaw, pos, s = 1) => { M4.RotationYToRef(yaw, _rot); const m = M4.Scaling(s, s, s).multiply(_rot.clone()); return m.multiply(M4.Translation(pos.x, pos.y, pos.z)); };
})();
