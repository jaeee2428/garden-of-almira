/* =====================================================================
   core.js - engine, helpers, mesh builder, terrain, sea, sky, time of day
   Everything is attached to window.G so the other files can share it.
   ===================================================================== */
(() => {
let G_SCALE = 1;
const B = BABYLON, V3 = B.Vector3, C3 = B.Color3, M4 = B.Matrix;
const G = window.G = { B, V3, C3, M4 };
const canvas = document.getElementById('scene');
const engine = new B.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, antialias: false, powerPreference: 'high-performance' }, false);
engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));       // never render more than 1.5x pixels: crisp, but cheap
G_SCALE = engine.getHardwareScalingLevel();
const scene = new B.Scene(engine);
scene.skipPointerMovePicking = true; scene.skipPointerDownPicking = true; scene.skipPointerUpPicking = true;   // we do our own cheap picking
Object.assign(G, { canvas, engine, scene, params: new URLSearchParams(location.search), baseScale: G_SCALE });
G.Q = G.params.get('q') === 'low' ? .5 : 1;                 // density multiplier (?q=low for slower computers)
G.onTime = [];                                               // callbacks run whenever time of day changes
G.nightObjs = [];                                            // {mat, day, night} emissive things that light up at night
G.casters = [];                                              // meshes that cast sun shadows

/* ---------- small helpers ---------- */
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
G.rng = rng;
G.rand = rng(1521);                                          // 1521: the year Magellan reached Cebu. The garden always grows the same way.
G.R = (a, b, r = G.rand) => a + (b - a) * r();
G.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
G.lerp = (a, b, t) => a + (b - a) * t;
G.smooth = (a, b, x) => { const t = G.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
G.hex = s => C3.FromHexString(s);
G.rgb = s => { const c = C3.FromHexString(s); return [c.r, c.g, c.b]; };            // hex -> [r,g,b] (linear-ish, as authored)
G.mixA = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
G.shade = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
G.pick = (arr, r = G.rand) => arr[Math.floor(r() * arr.length)];
const hash2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
G.vnoise = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return G.lerp(G.lerp(hash2(ix, iy), hash2(ix + 1, iy), u), G.lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), u), v); };

G.mat = (name, o = {}) => {
  const m = new B.StandardMaterial(name, scene);
  m.diffuseColor = o.diffuse || C3.White(); m.specularColor = o.specular || new C3(.05, .05, .05); m.specularPower = o.power || 24;
  if (o.emissive) m.emissiveColor = o.emissive; if (o.noLight) m.disableLighting = true;
  if (o.alpha !== undefined) m.alpha = o.alpha; m.backFaceCulling = o.cull === true; m.maxSimultaneousLights = 5; m.twoSidedLighting = !o.cull;
  return m;
};
// the one material used by all hand-built, vertex-coloured plant meshes
G.vc = G.mat('vc', { emissive: new C3(.035, .03, .025), specular: new C3(.05, .05, .045), power: 20 });


/* ---------- wind: one shared wind field, evaluated on the GPU for every plant vertex ---------- */
G.windState = { time: 0, dx: .93, dz: .37, gain: .6, px: 0, py: 0, pz: 0, playerR: 1.5, pokeX: 0, pokeT: -99, pokeZ: 0, pokeAmp: 0 };
G.poke = (x, z, amp = 1) => { const w = G.windState; w.pokeX = x; w.pokeZ = z; w.pokeT = w.time; w.pokeAmp = amp; };          // a click sends a ripple through the plants
const WIND_DEFS = `
#ifdef WIND
uniform vec4 uWind0; uniform vec4 uWind1; uniform vec4 uPlayer; uniform vec4 uPoke;
vec3 windOffset(vec3 wp, float hh, float aw) {
  vec2 d = uWind0.xy; float gain = uWind0.z, t = uWind0.w;
  float ph = dot(wp.xz, d) * 0.21 - t * 1.3;
  float g = 0.55 + 0.45 * sin(ph) + 0.22 * sin(ph * 2.3 + dot(wp.xz, vec2(-d.y, d.x)) * 0.37 - t * 0.55);
  float amp = gain * max(g, 0.0);
  float b = hh * hh * uWind1.x;
  vec2 push = d * amp * b;
  vec2 pd = wp.xz - uPlayer.xz; float pl = length(pd);
  push += normalize(pd + vec2(1e-4)) * (1.0 - smoothstep(0.0, uWind1.w, pl)) * b * 2.6;
  float pt = t - uPoke.y;
  if (pt > 0.0 && pt < 4.0) { vec2 pr = wp.xz - uPoke.xz; float rr = length(pr); float fr = pt * 6.0; float w = sin((rr - fr) * 2.1) * exp(-abs(rr - fr) * 0.55) * exp(-pt * 0.8) * uPoke.w; push += normalize(pr + vec2(1e-4)) * w * b * 1.8; }
  float fl = uWind1.y * aw * (0.35 + amp);
  vec3 flut = vec3(sin(t * 8.0 + wp.x * 4.1 + wp.y * 3.0), sin(t * 9.7 + wp.z * 3.7) * 0.6, sin(t * 7.3 + wp.z * 4.3 + wp.y * 2.0)) * fl;
  return vec3(push.x, -amp * b * 0.18, push.y) + flut;
}
#endif`;
class WindPlugin extends B.MaterialPluginBase {
  constructor(material, o) { super(material, 'Wind', 210, { WIND: false }); this.flex = o.flex ?? .08; this.flutter = o.flutter ?? 0; this.hang = !!o.hang; this._enable(true); }
  prepareDefines(defines) { defines.WIND = true; }
  getClassName() { return 'WindPlugin'; }
  getUniforms() { return { ubo: [{ name: 'uWind0', size: 4, type: 'vec4' }, { name: 'uWind1', size: 4, type: 'vec4' }, { name: 'uPlayer', size: 4, type: 'vec4' }, { name: 'uPoke', size: 4, type: 'vec4' }], vertex: `#ifdef WIND\nuniform vec4 uWind0; uniform vec4 uWind1; uniform vec4 uPlayer; uniform vec4 uPoke;\n#endif` }; }
  bindForSubMesh(ub) { const w = G.windState; ub.updateFloat4('uWind0', w.dx, w.dz, w.gain, w.time); ub.updateFloat4('uWind1', this.flex, this.flutter, this.hang ? 1 : 0, w.playerR); ub.updateFloat4('uPlayer', w.px, w.py, w.pz, 0); ub.updateFloat4('uPoke', w.pokeX, w.pokeT, w.pokeZ, w.pokeAmp); }
  getCustomCode(shaderType) {
    if (shaderType !== 'vertex') return null;
    return {
      CUSTOM_VERTEX_DEFINITIONS: WIND_DEFS.replace('uniform vec4 uWind0; uniform vec4 uWind1; uniform vec4 uPlayer; uniform vec4 uPoke;', ''),
      CUSTOM_VERTEX_UPDATE_WORLDPOS: `#ifdef WIND
#ifdef VERTEXCOLOR
float aw_ = color.a;
#else
float aw_ = 1.0;
#endif
float hh_ = (uWind1.z > 0.5 ? abs(positionUpdated.y) : max(positionUpdated.y, 0.0)) * length(finalWorld[1].xyz);
worldPos.xyz += windOffset(worldPos.xyz, hh_, aw_);
#endif`,
    };
  }
}
G.windMat = (name, o) => { const m = G.mat(name, { emissive: new C3(.035, .03, .025), specular: new C3(.045, .045, .04), power: 20 }); m.__wind = new WindPlugin(m, o); return m; };
G.mats = {
  shrub: G.windMat('windShrub', { flex: .075, flutter: .016 }), grass: G.windMat('windGrass', { flex: .95, flutter: 0 }), wild: G.windMat('windWild', { flex: 2.6, flutter: .004 }),
  palm: G.windMat('windPalm', { flex: .0085, flutter: .075 }), banana: G.windMat('windBanana', { flex: .03, flutter: .06 }), tree: G.windMat('windTree', { flex: .013, flutter: .035 }),
  vine: G.windMat('windVine', { flex: .05, flutter: .03 }), hang: G.windMat('windHang', { flex: .06, flutter: .035, hang: true }),
};

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

/* ---------- world shape: land, beach, sea, and the hills of the Cebu interior ---------- */
G.shoreX = z => -47 + Math.sin(z * .09) * 2.2 + Math.sin(z * .23) * .8;
G.POND = { x: -22, z: 21, r: 4.8 };                          // the lily pond
G.SEA_Y = -.45;
G.hFn = (x, z) => {
  const r = Math.hypot(x, z), sm = G.smooth;
  const rolling = .5 * Math.sin(x * .07 + 1.3) * Math.cos(z * .06) + .28 * Math.sin(x * .17 + z * .11) + .12 * Math.sin(z * .29 - x * .07);
  const inland = sm(-34, 6, x);
  const hills = Math.pow(sm(46, 125, r), 1.5) * (24 + 9 * Math.sin(x * .045 + z * .03) + 5 * Math.sin(x * .1 - z * .07) + 3.5 * Math.sin(x * .21 + z * .19) + .8 * Math.sin(x * .33 - z * .27)) * inland;
  let h = rolling * Math.pow(sm(4, 26, r), 1.1) + hills + .3;
  const P = G.POND, pd = Math.hypot(x - P.x, z - P.z); if (pd < P.r + 3) h = G.lerp(h, -.62, sm(P.r + .5, P.r - 1.6, pd));
  return G.lerp(h, -1.8, sm(4, -10, x - G.shoreX(z)));
};

/* ---------- sky (procedural: gradient, sun, moon, stars, drifting clouds) ---------- */
B.Effect.ShadersStore.skyVertexShader = `precision highp float; attribute vec3 position; uniform mat4 worldViewProjection; varying vec3 vP;
void main(){ vP=position; gl_Position=worldViewProjection*vec4(position,1.); }`;
B.Effect.ShadersStore.skyFragmentShader = `precision highp float; varying vec3 vP;
uniform vec3 zen,hor,grd,sunDir,moonDir,sunCol,cloudCol; uniform float time,nightK,cloudK;
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*n(p); p=p*2.03+vec2(7.1,3.7); a*=.5; } return s; }
void main(){ vec3 d=normalize(vP); float y=d.y;
  vec3 col=mix(hor,zen,pow(clamp(y,0.,1.),.5)); col=mix(col,grd,smoothstep(0.,-.1,y));
  float sd=max(dot(d,sunDir),0.); col+=sunCol*(pow(sd,6.)*.22+pow(sd,48.)*.5+smoothstep(.99965,.99985,sd)*7.);
  float md=max(dot(d,moonDir),0.); col+=vec3(.95,.97,1.)*smoothstep(.99935,.9996,md)*nightK*2.2+vec3(.45,.55,.85)*pow(md,60.)*.25*nightK;
  if(y>0.){ vec2 sp=d.xz/(y+.25)*55.; vec2 fc=fract(sp)-.5; float s=h(floor(sp)); float tw=.82+.18*sin(time*.8+s*60.); float st=smoothstep(.16+s*.08,0.,length(fc+ (vec2(h(floor(sp)+3.),h(floor(sp)+7.))-.5)*.5)); col+=vec3(1.,.97,.9)*step(.9965,s)*st*nightK*nightK*tw*1.6*smoothstep(0.,.25,y); }
  if(y>0.015){ vec2 cp=d.xz/(y+.1)*1.15+vec2(time*.006,time*.002); float c=fbm(cp*1.7); float c2=fbm(cp*3.1+4.);
    float cov=smoothstep(.5,.8,c*.75+c2*.35)*cloudK*smoothstep(.015,.22,y);
    vec3 cc=cloudCol*(.65+.55*pow(sd,2.)+.2*c2); col=mix(col,cc,cov*.9); }
  gl_FragColor=vec4(col,1.); }`;
const skyMat = new B.ShaderMaterial('skyMat', scene, { vertex: 'sky', fragment: 'sky' }, { attributes: ['position'], uniforms: ['worldViewProjection', 'zen', 'hor', 'grd', 'sunDir', 'moonDir', 'sunCol', 'cloudCol', 'time', 'nightK', 'cloudK'] });
skyMat.backFaceCulling = false; skyMat.disableDepthWrite = true;
const skyDome = B.MeshBuilder.CreateSphere('sky', { diameter: 1800, segments: 28 }, scene);
skyDome.material = skyMat; skyDome.infiniteDistance = true; skyDome.isPickable = false; skyDome.applyFog = false; skyDome.renderingGroupId = 0;
G.skyMat = skyMat;

/* ---------- sea: real waves ----------
   Four layered Gerstner waves move the water surface itself (and the boats ride the very same function).
   Swell grows with the wind; crests break into whitecaps; foam bands roll up the beach and the swash line breathes. */
const WAVES = [[1, .15, 26, .30], [.95, -.35, 13, .15], [.7, .7, 7.5, .075], [1, -.1, 3.8, .04]].map(([x, z, l, a]) => { const L = Math.hypot(x, z), k = 2 * Math.PI / l; return { dx: x / L, dz: z / L, k, a, w: Math.sqrt(9.81 * k) * .85 }; });
G.seaAmp = .8;
G.waveAt = (x, z, t, out) => {                                      // height + slope of the sea at (x,z): used by the boats
  const d = x - G.shoreX(z), shoal = G.smooth(0, -16, d), cp = G.camera ? G.camera.position : { x: 0, z: 0 }, far = 1 - G.smooth(90, 260, Math.hypot(cp.x - x, cp.z - z)), amp = G.seaAmp * shoal * far; let h = 0, gx = 0, gz = 0;
  for (const w of WAVES) { const ph = w.k * (w.dx * x + w.dz * z) - w.w * t, A = w.a * amp; h += A * Math.sin(ph); const cg = w.k * A * Math.cos(ph); gx += w.dx * cg; gz += w.dz * cg; }
  out = out || {}; out.h = h; out.gx = gx; out.gz = gz; return out;
};
const WGLSL = `const vec4 W0=vec4(.98893,.14834,.24166,.30); const vec4 W1=vec4(.93626,-.34493,.48332,.15); const vec4 W2=vec4(.70711,.70711,.83776,.075); const vec4 W3=vec4(.99504,-.09950,1.65347,.04);
float shoreX(float z){ return -47.+sin(z*.09)*2.2+sin(z*.23)*.8; }
void wv(vec4 w, vec2 p, float t, float amp, inout vec3 disp, inout vec2 grad){ float k=w.z, ph=k*dot(w.xy,p)-sqrt(9.81*k)*.85*t, A=w.w*amp, c=cos(ph), s=sin(ph); disp.xz+=w.xy*(.5*A*c); disp.y+=A*s; grad+=w.xy*(k*A*c); }
float waveAmp(vec2 p, vec3 camPos, float uAmp){ float d=p.x-shoreX(p.y); return uAmp*smoothstep(0.,-16.,d)*(1.-smoothstep(90.,260.,length(camPos.xz-p))); }`;
B.Effect.ShadersStore.seaVertexShader = `precision highp float; attribute vec3 position; uniform mat4 viewProjection; uniform float time,uAmp; uniform vec3 camPos; varying vec3 vW; varying float vH;
${WGLSL}
void main(){ vec3 p=position; float amp=waveAmp(p.xz,camPos,uAmp); vec3 disp=vec3(0.); vec2 g=vec2(0.); wv(W0,p.xz,time,amp,disp,g); wv(W1,p.xz,time,amp,disp,g); wv(W2,p.xz,time,amp,disp,g); wv(W3,p.xz,time,amp,disp,g);
  vec3 w=p+disp; vW=w; vH=disp.y/(.565*max(amp,.001)); gl_Position=viewProjection*vec4(w,1.); }`;
B.Effect.ShadersStore.seaFragmentShader = `precision highp float; varying vec3 vW; varying float vH;
uniform vec3 camPos,sunDir,sunCol,deepCol,shallowCol,skyCol,fogCol; uniform float time,nightK,fogD,uAmp;
${WGLSL}
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
void main(){ vec2 p=vW.xz; vec3 V=normalize(camPos-vW); float amp=waveAmp(p,camPos,uAmp); vec3 dd=vec3(0.); vec2 g=vec2(0.); wv(W0,p,time,amp,dd,g); wv(W1,p,time,amp,dd,g); wv(W2,p,time,amp,dd,g); wv(W3,p,time,amp,dd,g);
  float t=time; g+=(vec2(n(p*1.3+t*.35),n(p*1.5-t*.3+9.))-.5)*.10*(.5+uAmp*.5); g+=(vec2(n(p*4.2+t*.8),n(p*3.9-t*.7+3.))-.5)*.05;
  vec3 N=normalize(vec3(-g.x,1.,-g.y)); float cosv=max(dot(N,V),0.); float fr=.03+.97*pow(1.-cosv,5.);
  vec3 R=reflect(-V,N); float sd=max(dot(R,sunDir),0.); float sp=pow(sd,300.)*10.+pow(sd,28.)*.5; sp*=.55+.9*n(p*2.2+t*.6);
  float d=p.x-shoreX(p.y); float depthK=smoothstep(-1.,-24.,d);
  vec3 base=mix(shallowCol,deepCol,depthK); float crest=clamp(vH,0.,1.); base+=shallowCol*pow(crest,2.)*.22*(1.-nightK);       // light shining through the thin crests
  vec3 col=mix(base,skyCol,clamp(fr*1.1,0.,1.))+sunCol*sp*(1.-nightK*.8);
  // whitecaps on the highest crests, more when it is windy
  float cap=smoothstep(.72-.12*uAmp,1.,vH)*smoothstep(.55,1.,n(p*1.9+t*.5))*smoothstep(.5,1.4,uAmp)*smoothstep(-6.,-30.,d);
  // foam bands that roll toward the shore and thin out as they arrive
  float off=-d, band=0.; for(int i=0;i<3;i++){ float ph=fract(off*.075-t*.075+float(i)/3.); float w=smoothstep(0.,.1,ph)*smoothstep(.34,.1,ph); band+=w*smoothstep(1.,6.,off)*smoothstep(46.,10.,off); }
  band*=(.55+.45*n(p*vec2(.9,.5)+t*.2))*(.45+.5*uAmp);
  float swash=abs(d+2.7+sin(t*.55+p.y*.4)*.9+sin(t*.23)*.6); float shore=smoothstep(1.2,0.,swash)*(.55+.45*n(p*2.4+t*.35));
  float foam=clamp(cap*.9+band*.55+shore,0.,1.);
  col=mix(col,vec3(.96,.98,.98)*(1.-nightK*.62),foam*.8);
  float dist=length(camPos-vW); float f=1.-exp(-pow(dist*fogD,2.)); col=mix(col,fogCol,clamp(f,0.,1.));
  float a=mix(.5,.97,smoothstep(-.5,-9.,d)); a=max(a,foam*.85); gl_FragColor=vec4(col,a); }`;
const seaMat = new B.ShaderMaterial('seaMat', scene, { vertex: 'sea', fragment: 'sea' }, { attributes: ['position'], uniforms: ['viewProjection', 'camPos', 'sunDir', 'sunCol', 'deepCol', 'shallowCol', 'skyCol', 'fogCol', 'time', 'nightK', 'fogD', 'uAmp'], needAlphaBlending: true });
seaMat.backFaceCulling = false;
(function seaMesh() {                                                  // dense near the shore (1.3 m cells), getting coarser out to the horizon
  const xs = [], zp = [0]; let x = -30, dx = 1.3; while (x > -1700) { xs.push(x); x -= dx; dx = Math.min(dx * 1.05, 120); } let z = 0, dz = 1.3; while (z < 1100) { z += dz; dz = Math.min(dz * 1.05, 120); zp.push(z); }
  const zs = [...zp.slice(1).reverse().map(v => -v), ...zp], pos = [], idx = [], nx = xs.length;
  for (let i = 0; i < zs.length; i++) for (let j = 0; j < nx; j++) pos.push(xs[j], G.SEA_Y, zs[i]);
  for (let i = 0; i < zs.length - 1; i++) for (let j = 0; j < nx - 1; j++) { const a = i * nx + j, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
  const m = new B.Mesh('sea', scene), vd = new B.VertexData(); vd.positions = pos; vd.indices = idx; vd.applyToMesh(m); m.material = seaMat; m.isPickable = false; m.applyFog = false; m.alwaysSelectAsActiveMesh = true; G.sea = m;
})();
G.seaMat = seaMat;

/* ---------- ground ---------- */
(function ground() {
  const g = B.MeshBuilder.CreateGround('ground', { width: 270, height: 270, subdivisions: 200, updatable: true }, scene);
  const p = g.getVerticesData(B.VertexBuffer.PositionKind), n = p.length / 3, col = new Float32Array(n * 4), sm = G.smooth;
  const grass = [G.rgb('#4a7a2a'), G.rgb('#5f8f33'), G.rgb('#3f6b27'), G.rgb('#7aa23c')], dry = G.rgb('#a2944a'), sand = G.rgb('#e6d3a3'), wet = G.rgb('#b9a77e'), soil = G.rgb('#7a5a3a'), forest = G.rgb('#2f5a26');
  for (let i = 0; i < n; i++) {
    const x = p[i * 3], z = p[i * 3 + 2], y = G.hFn(x, z); p[i * 3 + 1] = y;
    const nz = G.vnoise(x * .2, z * .2), nz2 = G.vnoise(x * .9 + 5, z * .9 + 2), r = Math.hypot(x, z), d = x - G.shoreX(z);
    let c = G.mixA(G.mixA(grass[0], grass[1], nz), G.mixA(grass[2], grass[3], nz2), .4);
    c = G.mixA(c, dry, sm(.55, .95, G.vnoise(x * .06 + 20, z * .06)) * .6);
    c = G.mixA(c, forest, sm(40, 90, r) * .8 * (x > -30 ? 1 : 0));
    c = G.mixA(c, soil, sm(.7, .95, G.vnoise(x * .35 + 40, z * .35)) * .25 * (1 - sm(30, 50, r)));
    c = G.mixA(c, sand, sm(3, -1, d)); c = G.mixA(c, wet, sm(-1.5, -4, d));
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

/* ---------- lights, shadows, camera, post-processing ---------- */
const hemi = new B.HemisphericLight('hemi', V3.Up(), scene); hemi.specular = C3.Black();
const sunLight = new B.DirectionalLight('sun', new V3(1, -.3, .2), scene); sunLight.specular = new C3(.4, .35, .3);
const moonLight = new B.DirectionalLight('moon', new V3(-.6, -.7, -.4), scene); moonLight.specular = C3.Black();
Object.assign(G, { hemi, sunLight, moonLight });
let sg = null; G.casters = G.casters || [];
G.cast = m => { if (!m) return; G.casters.push(m); if (sg) sg.addShadowCaster(m, true); };
const camera = new B.FreeCamera('cam', new V3(-36, 3, 0), scene); camera.fov = .95; camera.minZ = .12; camera.maxZ = 1500; camera.inertia = 0; G.camera = camera;
// Sun shadows: cascaded (sharp near you, softer far away) and STABILIZED so they never swim or flicker as you move.
(function makeShadows() {
  try {
    if (G.params.has('nocsm')) throw new Error('classic');
    sg = new B.CascadedShadowGenerator(2048, sunLight); sg.numCascades = 3; sg.lambda = .88; sg.cascadeBlendPercentage = .14; sg.stabilizeCascades = true; sg.shadowMaxZ = 100; sg.depthClamp = true; sg.autoCalcDepthBounds = false;
    sg.usePercentageCloserFiltering = true; sg.filteringQuality = B.ShadowGenerator.QUALITY_MEDIUM; sg.bias = .0035; sg.normalBias = .022; sg.setDarkness(.42);
  } catch (err) {
    sg = new B.ShadowGenerator(2048, sunLight); sg.usePercentageCloserFiltering = true; sg.filteringQuality = B.ShadowGenerator.QUALITY_MEDIUM; sg.bias = .0006; sg.normalBias = .03; sg.setDarkness(.42); sunLight.autoUpdateExtends = true; sunLight.autoCalcShadowZBounds = true;
  }
  G.sg = sg; G.casters.forEach(m => sg.addShadowCaster(m, true));
})();
const pipe = new B.DefaultRenderingPipeline('pipe', true, scene, [camera]);
pipe.samples = G.params.has('nomsaa') ? 1 : 4; pipe.fxaaEnabled = G.params.has('nomsaa'); pipe.bloomEnabled = true; pipe.bloomThreshold = .88; pipe.bloomWeight = .22; pipe.bloomKernel = 32; pipe.bloomScale = .4;
pipe.imageProcessingEnabled = true; const ip = pipe.imageProcessing; ip.toneMappingEnabled = true; ip.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES; ip.contrast = 1.1; ip.exposure = 1;
ip.vignetteEnabled = true; ip.vignetteWeight = 1.4; ip.vignetteColor = new B.Color4(.04, .03, .02, 0);
pipe.grainEnabled = false;                                    // animated film grain made everything look like it was flickering
G.pipe = pipe;
scene.fogMode = B.Scene.FOGMODE_EXP2;

/* ---------- time of day: 0 = buntag (morning), .2 = udto (noon), .45 = hapon (golden afternoon), .7 = kilumkilom (dusk), 1 = gabii (night) ---------- */
const KEYS = [
  [0,   { zen: '#3a7fd0', hor: '#ffd9b0', grd: '#9bb09a', sunEl: 24, sunAz: 12, sunCol: '#ffe2b8', sunI: 1.9, hemiD: '#b8cff0', hemiG: '#6f8a52', hemiI: .85, fog: '#e9dccb', fogD: .0042, cloud: '#fff2e6', cloudK: .85, moonI: 0, exp: 1.0, night: 0, deep: '#0f7aa0', shal: '#43c0b4' }],
  [.2,  { zen: '#2b78cf', hor: '#a9d3ef', grd: '#8fae96', sunEl: 64, sunAz: 100, sunCol: '#fff1d4', sunI: 2.1, hemiD: '#b4cdf0', hemiG: '#6e8450', hemiI: .8, fog: '#b9d6ea', fogD: .0034, cloud: '#ffffff', cloudK: .9, moonI: 0, exp: 1.0, night: 0, deep: '#0f6f93', shal: '#2fb7b0' }],
  [.45, { zen: '#27498a', hor: '#ff9a55', grd: '#7a5b45', sunEl: 13, sunAz: 188, sunCol: '#ffb15c', sunI: 2.3, hemiD: '#98a6cc', hemiG: '#6a7a42', hemiI: .8, fog: '#e6a273', fogD: .0052, cloud: '#ff9e72', cloudK: 1.0, moonI: 0, exp: 1.0, night: 0, deep: '#124a6e', shal: '#3fa59c' }],
  [.7,  { zen: '#25306e', hor: '#e0617f', grd: '#4a3a4c', sunEl: -1, sunAz: 192, sunCol: '#ff6a4a', sunI: .5,  hemiD: '#6a6aa8', hemiG: '#3a3a48', hemiI: .55, fog: '#a8587a', fogD: .0062, cloud: '#ff7a8a', cloudK: 1.0, moonI: .25, exp: 1.1, night: .45, deep: '#14274f', shal: '#2d5a78' }],
  [1,   { zen: '#040919', hor: '#17284c', grd: '#0d131c', sunEl: -14, sunAz: 195, sunCol: '#ff7a40', sunI: 0,  hemiD: '#3b4c8a', hemiG: '#1a2438', hemiI: .5,  fog: '#0f1a30', fogD: .0072, cloud: '#27325a', cloudK: .55, moonI: .8, exp: 1.3, night: 1, deep: '#050d20', shal: '#0d2038' }],
];
G.TIME_NAMES = [[0, 'Buntag'], [.2, 'Udto'], [.45, 'Hapon'], [.7, 'Kilumkilom'], [1, 'Gabii']];
G.timeName = u => { let n = G.TIME_NAMES[0][1], best = 9; for (const [k, v] of G.TIME_NAMES) { const d = Math.abs(u - k); if (d < best) { best = d; n = v; } } return n; };
const NUM = ['sunEl', 'sunAz', 'sunI', 'hemiI', 'fogD', 'cloudK', 'moonI', 'exp', 'night'], COL = ['zen', 'hor', 'grd', 'sunCol', 'hemiD', 'hemiG', 'fog', 'cloud', 'deep', 'shal'];
const KC = KEYS.map(([t, s]) => { const o = { t }; NUM.forEach(k => o[k] = s[k]); COL.forEach(k => o[k] = C3.FromHexString(s[k])); return o; });
const moonDir = new V3(.55, .72, .4).normalize(); G.moonDir = moonDir;
G.state = {}; G.timeU = .45;
G.applyTime = u => {
  u = G.clamp(u, 0, 1); G.timeU = u; let a = KC[0], b = KC[KC.length - 1];
  for (let i = 0; i < KC.length - 1; i++) if (u >= KC[i].t && u <= KC[i + 1].t) { a = KC[i]; b = KC[i + 1]; break; }
  const t = b.t === a.t ? 0 : (u - a.t) / (b.t - a.t), S = G.state;
  NUM.forEach(k => S[k] = G.lerp(a[k], b[k], t)); COL.forEach(k => S[k] = C3.Lerp(a[k], b[k], t));
  const el = S.sunEl * Math.PI / 180, ce = Math.cos(el), az = S.sunAz * Math.PI / 180;
  const sunPos = new V3(ce * Math.cos(az), Math.sin(el), ce * Math.sin(az)).normalize(); G.sunDir = sunPos;                // morning sun in the east, evening sun sets over the sea in the west
  sunLight.direction = sunPos.scale(-1); sunLight.diffuse = S.sunCol; sunLight.intensity = S.sunI * G.smooth(-4, 3, S.sunEl);
  moonLight.direction = moonDir.scale(-1); moonLight.diffuse = new C3(.62, .72, 1); moonLight.intensity = S.moonI;   // lights stay ON and are only dimmed: switching a light on/off recompiles every material and stalls the frame
  hemi.diffuse = S.hemiD; hemi.groundColor = S.hemiG; hemi.intensity = S.hemiI;
  scene.fogColor = S.fog; scene.fogDensity = S.fogD; scene.clearColor = new B.Color4(S.hor.r, S.hor.g, S.hor.b, 1);
  skyMat.setColor3('zen', S.zen); skyMat.setColor3('hor', S.hor); skyMat.setColor3('grd', S.grd); skyMat.setVector3('sunDir', sunPos); skyMat.setVector3('moonDir', moonDir);
  skyMat.setColor3('sunCol', S.sunCol); skyMat.setColor3('cloudCol', S.cloud); skyMat.setFloat('nightK', S.night); skyMat.setFloat('cloudK', S.cloudK);
  seaMat.setVector3('sunDir', sunPos); seaMat.setColor3('sunCol', S.sunCol); seaMat.setColor3('deepCol', S.deep); seaMat.setColor3('shallowCol', S.shal); seaMat.setColor3('skyCol', S.hor); seaMat.setColor3('fogCol', S.fog);
  seaMat.setFloat('nightK', S.night); seaMat.setFloat('fogD', S.fogD * .55);
  pipe.imageProcessing.exposure = S.exp;
  G.nightObjs.forEach(o => { o.mat.emissiveColor = C3.Lerp(o.day, o.night, S.night); });
  G.onTime.forEach(f => f(S));
};
scene.onBeforeRenderObservable.add(() => {
  const t = G.clock || 0; skyMat.setFloat('time', t); seaMat.setFloat('time', t); seaMat.setVector3('camPos', camera.position); G.seaAmp = .6 + .5 * Math.min(1.6, Math.max(0, G.windState.gain)); seaMat.setFloat('uAmp', G.seaAmp);
});
})();
