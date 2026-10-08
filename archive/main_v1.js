/* =====================================================================
   THE GARDEN OF ALMIRA  -  a Babylon.js folk-tale garden at dusk
   Everything here is generated in code (no model/texture files).
   Sections:  1 helpers · 2 sky & light · 3 terrain · 4 flower factory
              5 planting · 6 blossom tree · 7 cottage & path & arch
              8 living things (fairies, butterflies, petals) · 9 camera
              10 wishes (talks to server.py) · 11 render loop
   ===================================================================== */
(() => {
const B = BABYLON, V3 = B.Vector3, C3 = B.Color3;
const canvas = document.getElementById('scene');
const engine = new B.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: false, antialias: true });
const scene = new B.Scene(engine);
const params = new URLSearchParams(location.search);

/* ---------- 1. helpers ---------- */
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = rng(173);                       // fixed seed: the garden always grows the same way
const R = (a, b) => a + (b - a) * rand();
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const hex = s => C3.FromHexString(s);
const mixC = (a, b, t) => new C3(lerp(a.r, b.r, t), lerp(a.g, b.g, t), lerp(a.b, b.b, t));
const pick = arr => arr[Math.floor(rand() * arr.length)];

function paint(mesh, fn) {                   // give every vertex a colour: fn(x,y,z) -> Color3
  const p = mesh.getVerticesData(B.VertexBuffer.PositionKind), n = p.length / 3, c = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const k = fn(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]); c[i * 4] = k.r; c[i * 4 + 1] = k.g; c[i * 4 + 2] = k.b; c[i * 4 + 3] = 1; }
  mesh.setVerticesData(B.VertexBuffer.ColorKind, c);
}
function mat(name, o = {}) {
  const m = new B.StandardMaterial(name, scene);
  m.diffuseColor = o.diffuse || C3.White(); m.specularColor = o.specular || new C3(.06, .06, .06);
  if (o.emissive) m.emissiveColor = o.emissive; if (o.noLight) m.disableLighting = true;
  if (o.alpha !== undefined) m.alpha = o.alpha; m.backFaceCulling = o.cull === true;
  return m;
}
const vcMat = mat('vertexColors', { emissive: new C3(.10, .08, .12) });   // used by all painted meshes

/* ---------- 2. sky, moon, light, fog ---------- */
scene.clearColor = new B.Color4(.07, .05, .18, 1);
scene.fogMode = B.Scene.FOGMODE_EXP2; scene.fogDensity = 0.009; scene.fogColor = new C3(.42, .28, .52);

(function sky() {
  const W = 1024, H = 1024, tex = new B.DynamicTexture('skyTex', { width: W, height: H }, scene, false), g = tex.getContext();
  const grd = g.createLinearGradient(0, 0, 0, H);        // top of texture = top of sky
  [[0, '#07061f'], [.28, '#150f45'], [.44, '#3a2170'], [.54, '#7c3f93'], [.60, '#d86d9c'], [.65, '#ffb28f'], [.70, '#ffd9a8'], [.71, '#6a3a7a'], [1, '#2a1a48']]
    .forEach(([s, c]) => grd.addColorStop(s, c));
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  const r = rng(9);
  for (let i = 0; i < 700; i++) {                         // faint star dust
    const y = r() * H * .55, a = .15 + r() * .6 * (1 - y / (H * .55) * .4);
    g.fillStyle = `rgba(255,248,230,${a})`; g.fillRect(r() * W, y, r() < .1 ? 2 : 1, r() < .1 ? 2 : 1);
  }
  tex.update();
  const dome = B.MeshBuilder.CreateSphere('sky', { diameter: 700, segments: 32 }, scene);
  const m = mat('skyMat', { noLight: true }); m.emissiveTexture = tex; m.diffuseColor = C3.Black(); m.fogEnabled = false; m.backFaceCulling = false;
  dome.material = m; dome.infiniteDistance = true; dome.isPickable = false; dome.applyFog = false;
})();

const moonDir = new V3(80, 92, 230).normalize();
const glowMeshes = [];                                    // things that should bloom
let glowCanopy; const lanterns = [];
(function moon() {
  const m = B.MeshBuilder.CreateSphere('moon', { diameter: 20, segments: 24 }, scene);
  const mm = mat('moonMat', { noLight: true, emissive: hex('#fff2cf') }); mm.fogEnabled = false; m.material = mm;
  m.position = moonDir.scale(300); m.infiniteDistance = true; m.applyFog = false; glowMeshes.push(m);
  const tex = new B.DynamicTexture('halo', { width: 256, height: 256 }, scene, true), g = tex.getContext();
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,240,200,.55)'); gr.addColorStop(.25, 'rgba(255,214,220,.22)'); gr.addColorStop(1, 'rgba(255,200,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256); tex.update(); tex.hasAlpha = true;
  const h = B.MeshBuilder.CreatePlane('halo', { size: 150 }, scene);
  const hm = mat('haloMat', { noLight: true }); hm.emissiveTexture = tex; hm.opacityTexture = tex; hm.alphaMode = B.Engine.ALPHA_ADD; hm.fogEnabled = false;
  h.material = hm; h.position = moonDir.scale(299); h.billboardMode = B.Mesh.BILLBOARDMODE_ALL; h.infiniteDistance = true; h.applyFog = false; h.isPickable = false;
})();

const hemi = new B.HemisphericLight('hemi', new V3(0, 1, 0), scene);
hemi.diffuse = new C3(.78, .66, .98); hemi.groundColor = new C3(.26, .32, .18); hemi.specular = C3.Black(); hemi.intensity = .95;
const moonLight = new B.DirectionalLight('moonLight', moonDir.scale(-1), scene);
moonLight.diffuse = new C3(.72, .80, 1.0); moonLight.intensity = 1.0; moonLight.specular = C3.Black();

/* ---------- 3. terrain ---------- */
function hFn(x, z) {                                      // height of the land at (x,z)
  const r = Math.hypot(x, z);
  const rolling = .55 * Math.sin(x * .09 + 1.3) * Math.cos(z * .08) + .30 * Math.sin(x * .19 + z * .13) + .15 * Math.sin(z * .31 - x * .07);
  return rolling * Math.pow(smooth(5, 26, r), 1.2) + Math.max(0, r - 44) * .22;
}
const ground = B.MeshBuilder.CreateGround('ground', { width: 150, height: 150, subdivisions: 220, updatable: true }, scene);
(function shapeGround() {
  const p = ground.getVerticesData(B.VertexBuffer.PositionKind), n = p.length / 3, col = new Float32Array(n * 4);
  const dark = hex('#2f6a34'), mid = hex('#4f9a47'), light = hex('#8fd05a'), moss = hex('#3b7d5a');
  for (let i = 0; i < n; i++) {
    const x = p[i * 3], z = p[i * 3 + 2], y = hFn(x, z); p[i * 3 + 1] = y;
    const nz = Math.sin(x * .55) * Math.cos(z * .47) * .5 + Math.sin(x * 1.7 + z * 1.3) * .25 + .5;
    let c = mixC(mixC(dark, mid, nz), light, clamp((1 - Math.hypot(x, z) / 85) * .7 * nz, 0, 1));
    c = mixC(c, moss, smooth(.5, 1, Math.sin(x * .13 + 4) * Math.cos(z * .17)) * .35);
    col.set([c.r, c.g, c.b, 1], i * 4);
  }
  ground.updateVerticesData(B.VertexBuffer.PositionKind, p);
  const nrm = []; B.VertexData.ComputeNormals(p, ground.getIndices(), nrm); ground.updateVerticesData(B.VertexBuffer.NormalKind, nrm);
  ground.setVerticesData(B.VertexBuffer.ColorKind, col);
  ground.material = mat('groundMat', { specular: C3.Black() }); ground.isPickable = false; ground.freezeWorldMatrix();
})();

/* ---------- 4. flower factory ---------- */
function petal(o) {                                       // one petal = a squashed sphere pointing along (yaw, elevation a)
  const m = B.MeshBuilder.CreateSphere('p', { diameter: 1, segments: o.seg || 6 }, scene);
  m.scaling.set(o.wid, o.th, o.len);
  const ca = Math.cos(o.a), dir = new V3(Math.sin(o.yaw) * ca, Math.sin(o.a), Math.cos(o.yaw) * ca);
  const base = new V3(o.x || 0, o.y || 0, o.z || 0);
  m.position = base.add(dir.scale(o.len / 2)); m.lookAt(m.position.add(dir)); m.bakeCurrentTransformIntoVertices();
  const c0 = o.color, c1 = o.tip || o.color;
  paint(m, (x, y, z) => mixC(c0, c1, clamp(((x - base.x) * dir.x + (y - base.y) * dir.y + (z - base.z) * dir.z) / o.len, 0, 1)));
  return m;
}
function blob(x, y, z, sx, sy, sz, color, seg = 5) {
  const m = B.MeshBuilder.CreateSphere('b', { diameter: 1, segments: seg }, scene);
  m.scaling.set(sx, sy, sz); m.position.set(x, y, z); m.bakeCurrentTransformIntoVertices(); paint(m, () => color); return m;
}
const ring = (n, f) => { const out = []; for (let i = 0; i < n; i++) out.push(f(i, i / n * Math.PI * 2 + (rand() - .5) * .12)); return out; };

const SPECIES = {                                         // each builds a flower HEAD at the origin, facing up
  daisy: { H: [.55, .85], S: [.9, 1.35], pal: [{ a: '#ffffff', b: '#fff2f8', c: '#f5b800' }, { a: '#ffcfe3', b: '#ffffff', c: '#f5b800' }, { a: '#dcc8ff', b: '#ffffff', c: '#ffc400' }],
    build: p => [...ring(15, (i, y) => petal({ len: .18, wid: .05, th: .016, a: .14, yaw: y, color: hex(p.a), tip: hex(p.b) })), blob(0, .018, 0, .11, .05, .11, hex(p.c))] },
  tulip: { H: [.6, .95], S: [1, 1.5], pal: [{ a: '#e8334a', b: '#ff8fa0' }, { a: '#ffae2e', b: '#ffe39a' }, { a: '#ff68b0', b: '#ffd3ea' }, { a: '#8a58d8', b: '#d3baff' }],
    build: p => [...ring(6, (i, y) => petal({ len: .24, wid: .12, th: .035, a: 1.12, yaw: y, color: hex(p.a), tip: hex(p.b) })), ...ring(3, (i, y) => petal({ len: .18, wid: .1, th: .03, a: 1.3, yaw: y + .5, color: hex(p.a), tip: hex(p.b) }))] },
  lily: { H: [.7, 1.05], S: [1, 1.5], pal: [{ a: '#ff8a3d', b: '#ffd08a' }, { a: '#ffe0ef', b: '#ffffff' }, { a: '#ff5fa2', b: '#ffc2dc' }],
    build: p => [...ring(6, (i, y) => petal({ len: .27, wid: .09, th: .02, a: .55, yaw: y, color: hex(p.a), tip: hex(p.b) })), ...ring(6, (i, y) => blob(Math.sin(y) * .13, .13, Math.cos(y) * .13, .022, .022, .022, hex('#7a3b18')))] },
  rose: { H: [.55, .8], S: [1.1, 1.6], pal: [{ a: '#c9184a', b: '#ff758f' }, { a: '#ff9ebd', b: '#ffe0ec' }, { a: '#fff0d4', b: '#ffffff' }, { a: '#ff9a5c', b: '#ffd3a8' }],
    build: p => [...ring(8, (i, y) => petal({ len: .17, wid: .11, th: .025, a: .5, yaw: y, color: hex(p.a), tip: hex(p.b) })),
      ...ring(6, (i, y) => petal({ len: .14, wid: .1, th: .025, a: .95, y: .02, yaw: y + .3, color: hex(p.a), tip: hex(p.b) })),
      ...ring(4, (i, y) => petal({ len: .11, wid: .09, th: .025, a: 1.3, y: .04, yaw: y + .6, color: hex(p.a), tip: hex(p.b) })), blob(0, .08, 0, .08, .07, .08, mixC(hex(p.a), C3.Black(), .25))] },
  sunflower: { H: [1.1, 1.6], S: [1.3, 1.9], pal: [{ a: '#ffc20e', b: '#ffe066', c: '#4a2c12' }, { a: '#ff8f1f', b: '#ffcf6b', c: '#3a1f0e' }],
    build: p => [...ring(20, (i, y) => petal({ len: .22, wid: .06, th: .018, a: .22, yaw: y, color: hex(p.a), tip: hex(p.b) })), blob(0, .02, 0, .22, .06, .22, hex(p.c), 8), blob(0, .035, 0, .13, .05, .13, mixC(hex(p.c), hex('#a8741a'), .5), 8)] },
  cosmos: { H: [.8, 1.2], S: [1, 1.5], pal: [{ a: '#ff4fa3', b: '#ffb3d9', c: '#ffc400' }, { a: '#ffffff', b: '#ffd6ec', c: '#ffb300' }, { a: '#b05cff', b: '#e4c4ff', c: '#ffd000' }],
    build: p => [...ring(8, (i, y) => petal({ len: .2, wid: .115, th: .018, a: .2, yaw: y, color: hex(p.a), tip: hex(p.b) })), blob(0, .02, 0, .08, .05, .08, hex(p.c))] },
  lavender: { H: [.35, .6], S: [1, 1.4], pal: [{ a: '#7a4cff', b: '#c3a6ff' }, { a: '#4f7cff', b: '#a9c4ff' }],
    build: p => { const o = []; for (let i = 0; i < 13; i++) o.push(blob(Math.cos(i * 2.4) * .035, i * .04, Math.sin(i * 2.4) * .035, .055, .075, .055, mixC(hex(p.a), hex(p.b), i / 13), 4)); o.push(blob(0, .54, 0, .035, .06, .035, hex(p.b), 4)); return o; } },
};
const SPECIES_W = { daisy: 3, tulip: 3, lily: 2, rose: 3, sunflower: 1, cosmos: 3, lavender: 2 };
const SPECIES_BAG = Object.entries(SPECIES_W).flatMap(([k, n]) => Array(n).fill(k));

const stemMesh = (() => {                                 // unit-height stem with two leaves, painted green
  const parts = [], s = B.MeshBuilder.CreateCylinder('stem', { height: 1, diameter: .05, tessellation: 5 }, scene);
  s.position.y = .5; s.bakeCurrentTransformIntoVertices(); paint(s, (x, y) => mixC(hex('#2d6a2f'), hex('#6cc04a'), y)); parts.push(s);
  [[.28, 0, .7], [.5, 2.6, .6]].forEach(([y, yaw, sc]) => parts.push(petal({ len: .3 * sc, wid: .09 * sc, th: .012, a: .55, y, yaw, color: hex('#2d6a2f'), tip: hex('#7fd35a') })));
  const m = B.Mesh.MergeMeshes(parts, true, true); m.material = vcMat; m.alwaysSelectAsActiveMesh = true; m.isPickable = false; return m;
})();

/* ---------- 5. planting ---------- */
const COTTAGE = { x: -14, z: 12, yaw: -.5 }, TREE = { x: 0, z: 0 }, RING = { x: 10, z: -7 };
const pathCtrl = [[0, -32], [3, -24], [-2, -16], [-4, -8], [-7, -1], [-10, 5], [-11.7, 9.6]].map(([x, z]) => new V3(x, 0, z));
const pathPts = B.Curve3.CreateCatmullRomSpline(pathCtrl, 30, false).getPoints();
function distToPath(x, z) { let d = 1e9; for (let i = 0; i < pathPts.length; i += 2) d = Math.min(d, Math.hypot(x - pathPts[i].x, z - pathPts[i].z)); return d; }
const blocked = (x, z, pathClear) => Math.hypot(x - COTTAGE.x, z - COTTAGE.z) < 4.6 || distToPath(x, z) < pathClear;

const clusters = [];                                      // storybook patches of one kind of flower
for (let i = 0; i < 38; i++) { const sp = pick(SPECIES_BAG); clusters.push({ x: R(-42, 42), z: R(-42, 42), sp, pal: Math.floor(rand() * SPECIES[sp].pal.length) }); }
const buckets = {};                                       // "species:palette" -> list of flowers
const flowers = [];
(function plant(N) {
  let guard = 0;
  while (flowers.length < N && guard++ < N * 20) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 44, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (blocked(x, z, 1.15)) continue;
    let near = clusters[0], nd = 1e9; for (const c of clusters) { const d = Math.hypot(c.x - x, c.z - z); if (d < nd) { nd = d; near = c; } }
    let sp = near.sp, pal = near.pal;
    if (nd > 9 || rand() < .22) { sp = pick(SPECIES_BAG); pal = Math.floor(rand() * SPECIES[sp].pal.length); }
    const S = SPECIES[sp], key = sp + ':' + pal;
    const f = { x, z, y: hFn(x, z) - .02, H: R(S.H[0], S.H[1]), s: R(S.S[0], S.S[1]) * 1.3, yaw: rand() * 6.28, lx: R(-.1, .1), lz: R(-.1, .1), ph: rand() * 6.28, key };
    (buckets[key] = buckets[key] || []).push(f); flowers.push(f);
  }
})(2600);

const stemArr = new Float32Array(flowers.length * 16);
flowers.forEach((f, i) => { f.i = i; });
for (const [key, list] of Object.entries(buckets)) {      // one merged mesh per flower kind, drawn thousands of times
  const [sp, pal] = key.split(':'), parts = SPECIES[sp].build(SPECIES[sp].pal[+pal]);
  const m = B.Mesh.MergeMeshes(parts, true, true); m.material = vcMat; m.alwaysSelectAsActiveMesh = true; m.isPickable = false;
  list.forEach((f, j) => { f.slot = j; }); list.mesh = m;
  list.buf = new Float32Array(list.length * 16); m.thinInstanceSetBuffer('matrix', list.buf, 16, false);
}
stemMesh.thinInstanceSetBuffer('matrix', stemArr, 16, false);

const mS = new B.Matrix(), mR = new B.Matrix(), mT = new B.Matrix(), mU = new B.Matrix(), mA = new B.Matrix(), mB = new B.Matrix();
function swayFlowers(t) {
  for (let i = 0; i < flowers.length; i++) {
    const f = flowers[i];
    const wind = Math.sin(t * 1.3 + f.x * .18 + f.z * .11 + f.ph) * .07 + Math.sin(t * .45 + f.x * .05) * .05;
    const wind2 = Math.cos(t * 1.1 + f.z * .16 + f.ph) * .05;
    B.Matrix.RotationYawPitchRollToRef(f.yaw, f.lx + wind2, f.lz + wind, mR);
    B.Matrix.TranslationToRef(f.x, f.y, f.z, mT);
    B.Matrix.ScalingToRef(f.s * .9, f.H, f.s * .9, mS); mS.multiplyToRef(mR, mA); mA.multiplyToRef(mT, mB); mB.copyToArray(stemArr, i * 16);
    B.Matrix.ScalingToRef(f.s, f.s, f.s, mS); B.Matrix.TranslationToRef(0, f.H, 0, mU); mS.multiplyToRef(mU, mA); mA.multiplyToRef(mR, mB); mB.multiplyToRef(mT, mA);
    mA.copyToArray(buckets[f.key].buf, f.slot * 16);
  }
  stemMesh.thinInstanceBufferUpdated('matrix');
  for (const l of Object.values(buckets)) l.mesh.thinInstanceBufferUpdated('matrix');
}

(function grass() {                                       // lush tufts of grass between the flowers
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const b = B.MeshBuilder.CreateCylinder('g', { height: .5, diameterTop: 0, diameterBottom: .07, tessellation: 3 }, scene);
    b.position.y = .25; b.bakeCurrentTransformIntoVertices(); b.rotation.set(R(-.35, .35), i * 1.6, R(-.35, .35)); b.bakeCurrentTransformIntoVertices();
    paint(b, (x, y) => mixC(hex('#3a8a3c'), hex('#b4ee6a'), clamp(y / .5, 0, 1))); parts.push(b);
  }
  const g = B.Mesh.MergeMeshes(parts, true, true); g.material = vcMat; g.isPickable = false; g.alwaysSelectAsActiveMesh = true;
  const N = 7000, arr = new Float32Array(N * 16); let n = 0;
  while (n < N) {
    const a = rand() * 6.283, r = Math.sqrt(rand()) * 56, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (blocked(x, z, .55)) continue;
    const s = R(.55, 1.15); B.Matrix.ComposeToRef(new V3(s, s * R(.55, 1.0), s), B.Quaternion.RotationYawPitchRoll(rand() * 6.28, 0, 0), new V3(x, hFn(x, z) - .02, z), mA); mA.copyToArray(arr, n * 16); n++;
  }
  g.thinInstanceSetBuffer('matrix', arr, 16, true);
})();

/* ---------- 6. the blossom tree ---------- */
const treeY = hFn(TREE.x, TREE.z);
const barkMat = mat('bark', { diffuse: hex('#6b4631'), emissive: new C3(.05, .03, .03) });
(function tree() {
  const trunkPath = []; for (let i = 0; i <= 14; i++) { const y = i * .36; trunkPath.push(new V3(.38 * Math.sin(y * 1.25), treeY + y, .38 * Math.cos(y * 1.1))); }
  const L = 5;
  const trunk = B.MeshBuilder.CreateTube('trunk', { path: trunkPath, radiusFunction: (i, d) => .85 - .5 * (d / L) + .55 * Math.exp(-d * 1.8), tessellation: 14, cap: B.Mesh.CAP_ALL }, scene);
  trunk.material = barkMat; trunk.isPickable = false;
  for (let k = 0; k < 8; k++) {                           // curving branches into the canopy
    const a = k / 8 * 6.283 + R(-.2, .2), y0 = treeY + R(3.2, 4.6), len = R(3.6, 5.0), up = R(1.8, 3.0);
    const p0 = new V3(.3 * Math.sin(a), y0, .3 * Math.cos(a)), p2 = new V3(Math.sin(a) * len, y0 + up, Math.cos(a) * len), p1 = new V3(Math.sin(a) * len * .45, y0 + up * .15, Math.cos(a) * len * .45);
    const path = B.Curve3.CreateQuadraticBezier(p0, p1, p2, 10).getPoints();
    const br = B.MeshBuilder.CreateTube('branch', { path, radiusFunction: (i, d) => Math.max(.04, .22 - d * .045), tessellation: 7 }, scene); br.material = barkMat; br.isPickable = false;
  }
  const mk = (a, b, c) => B.Mesh.MergeMeshes([...ring(5, (i, y) => petal({ len: .2, wid: .17, th: .035, a: .35, yaw: y, color: hex(a), tip: hex(b) })), blob(0, .03, 0, .06, .05, .06, hex(c))], true, true);
  const kinds = [mk('#ffb7d5', '#fff0f6', '#ffd24a'), mk('#ffffff', '#ffe4ef', '#ffc13a'), mk('#ff8fbf', '#ffd0e4', '#fff1a0')];
  const canopy = new B.TransformNode('canopy', scene); canopy.position.set(0, treeY + 6.8, 0); glowCanopy = canopy;
  kinds.forEach((m, ki) => {
    const N = 260, arr = new Float32Array(N * 16);
    for (let i = 0; i < N; i++) {
      const u = rand() * 6.283, v = Math.acos(2 * rand() - 1), rr = Math.cbrt(R(.35, 1));
      const p = new V3(Math.sin(v) * Math.cos(u) * 5.4 * rr, Math.cos(v) * 2.8 * rr, Math.sin(v) * Math.sin(u) * 5.4 * rr);
      const s = R(1.4, 2.6); B.Matrix.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(rand() * 6.28, R(-.9, .9), R(-.9, .9)), p, mA); mA.copyToArray(arr, i * 16);
    }
    m.material = vcMat; m.parent = canopy; m.thinInstanceSetBuffer('matrix', arr, 16, true); m.alwaysSelectAsActiveMesh = true; m.isPickable = false;
  });
  const leaf = B.Mesh.MergeMeshes(ring(3, (i, y) => petal({ len: .35, wid: .16, th: .02, a: .2, yaw: y, color: hex('#2f7a3a'), tip: hex('#7ccf5a') })), true, true);
  leaf.material = vcMat; leaf.parent = canopy; leaf.isPickable = false; leaf.alwaysSelectAsActiveMesh = true;
  const la = new Float32Array(240 * 16); for (let i = 0; i < 240; i++) { const u = rand() * 6.283, v = Math.acos(2 * rand() - 1), rr = Math.cbrt(R(.5, 1)); const s = R(1.2, 2); B.Matrix.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(rand() * 6.28, R(-1, 1), R(-1, 1)), new V3(Math.sin(v) * Math.cos(u) * 5.2 * rr, Math.cos(v) * 2.7 * rr, Math.sin(v) * Math.sin(u) * 5.2 * rr), mA); mA.copyToArray(la, i * 16); }
  leaf.thinInstanceSetBuffer('matrix', la, 16, true);

  const lampMat = mat('lamp', { noLight: true, emissive: hex('#ffc46b') });   // little hanging lanterns
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * 6.283 + R(-.2, .2), rad = R(2.2, 5), y = treeY + R(4.2, 5.8);
    const l = B.MeshBuilder.CreateSphere('lantern', { diameter: R(.28, .42), segments: 8 }, scene); l.material = lampMat; l.position.set(Math.sin(a) * rad, y, Math.cos(a) * rad);
    l.metadata = { y, ph: rand() * 6.28 }; lanterns.push(l); glowMeshes.push(l);
    const cord = B.MeshBuilder.CreateLines('cord', { points: [new V3(l.position.x, y, l.position.z), new V3(l.position.x, y + 1.4, l.position.z)] }, scene); cord.color = hex('#caa66a'); cord.isPickable = false;
  }
  const tl = new B.PointLight('treeLight', new V3(0, treeY + 4.2, 0), scene); tl.diffuse = new C3(1, .72, .86); tl.intensity = .9; tl.range = 20; tl.specular = C3.Black();
})();

/* ---------- 7. cottage, stone path, flower arch, fairy ring ---------- */
const cottageGroup = new B.TransformNode('cottage', scene);
(function cottage() {
  const y0 = hFn(COTTAGE.x, COTTAGE.z); cottageGroup.position.set(COTTAGE.x, y0, COTTAGE.z); cottageGroup.rotation.y = COTTAGE.yaw;
  const add = (m, mt) => { m.parent = cottageGroup; m.material = mt; m.isPickable = false; return m; };
  const plaster = mat('plaster', { diffuse: hex('#f1e2c0'), emissive: new C3(.07, .05, .04) }), stone = mat('stone', { diffuse: hex('#8d8a9c') }), thatch = mat('thatch', { diffuse: hex('#b98a3c'), emissive: new C3(.08, .05, .02) });
  const wood = mat('wood', { diffuse: hex('#6d3f2a') });
  const base = add(B.MeshBuilder.CreateBox('base', { width: 5.3, height: 1.2, depth: 4.3 }, scene), stone); base.position.y = -.1;
  add(B.MeshBuilder.CreateBox('walls', { width: 5, height: 2.7, depth: 4 }, scene), plaster).position.y = 1.55;
  const roof = add(B.MeshBuilder.CreateCylinder('roof', { diameterTop: 0, diameterBottom: 8.6, height: 2.7, tessellation: 4 }, scene), thatch); roof.rotation.y = Math.PI / 4; roof.scaling.z = .86; roof.position.y = 4.2;
  const eave = add(B.MeshBuilder.CreateTorus('eave', { diameter: 5.2, thickness: .22, tessellation: 4 }, scene), thatch); eave.visibility = 0;
  add(B.MeshBuilder.CreateBox('chimney', { width: .7, height: 1.8, depth: .7 }, scene), stone).position.set(1.5, 4.8, .5);
  const door = add(B.MeshBuilder.CreateBox('door', { width: 1, height: 1.7, depth: .14 }, scene), wood); door.position.set(0, .85 + .2, -2.03);
  const arc = add(B.MeshBuilder.CreateCylinder('doorArc', { diameter: 1, height: .14, tessellation: 18 }, scene), wood); arc.rotation.x = Math.PI / 2; arc.position.set(0, 2.05, -2.03);
  add(B.MeshBuilder.CreateSphere('knob', { diameter: .12 }, scene), mat('gold', { diffuse: hex('#ffd24a'), emissive: hex('#7a5a10') })).position.set(.3, 1.1, -2.12);
  const winMat = mat('window', { noLight: true, emissive: hex('#ffd278') });
  [-1.55, 1.55].forEach(x => {
    const w = add(B.MeshBuilder.CreatePlane('win', { width: .85, height: .8 }, scene), winMat); w.position.set(x, 1.75, -2.04); w.rotation.y = Math.PI; glowMeshes.push(w);
    const fr = add(B.MeshBuilder.CreateBox('frame', { width: 1.05, height: .08, depth: .1 }, scene), wood); fr.position.set(x, 1.33, -2.06);
    const bx = add(B.MeshBuilder.CreateBox('sill', { width: 1.1, height: .22, depth: .3 }, scene), wood); bx.position.set(x, 1.2, -2.2);
  });
  // flower boxes under the windows
  const wp = cottageGroup.getAbsolutePosition();
  const fwd = new V3(Math.sin(COTTAGE.yaw) * -1, 0, -Math.cos(COTTAGE.yaw)), pl = new B.PointLight('cottageLight', new V3(wp.x + fwd.x * 2.3, y0 + 1.8, wp.z + fwd.z * 2.3), scene);
  pl.diffuse = new C3(1, .72, .38); pl.intensity = 1.1; pl.range = 15; pl.specular = C3.Black();
  window.__chimney = new V3(wp.x + Math.cos(COTTAGE.yaw) * 1.5 + Math.sin(COTTAGE.yaw) * .5, y0 + 5.8, wp.z - Math.sin(COTTAGE.yaw) * 1.5 + Math.cos(COTTAGE.yaw) * .5);
})();

(function stonePath() {
  const s = B.MeshBuilder.CreateCylinder('stepping', { height: .08, diameter: 1, tessellation: 9 }, scene); s.material = mat('pathStone', { diffuse: hex('#9d98b3'), emissive: new C3(.05, .05, .08) }); s.isPickable = false;
  const arr = [], step = 1.05; let acc = 0;
  for (let i = 1; i < pathPts.length; i++) {
    const a = pathPts[i - 1], b = pathPts[i], d = V3.Distance(a, b); acc += d;
    if (acc >= step) { acc = 0; const x = b.x + R(-.28, .28), z = b.z + R(-.28, .28), sc = R(.55, .85); B.Matrix.ComposeToRef(new V3(sc, 1, sc * R(.75, 1)), B.Quaternion.RotationYawPitchRoll(rand() * 6.28, 0, 0), new V3(x, hFn(x, z) + .03, z), mA); arr.push(...mA.toArray()); }
  }
  s.thinInstanceSetBuffer('matrix', new Float32Array(arr), 16, true);
  // lantern posts along the path
  const post = mat('post', { diffuse: hex('#4b3526') }), glass = mat('postGlass', { noLight: true, emissive: hex('#ffb347') });
  [0.12, .3, .5, .72].forEach((u, k) => {
    const p = pathPts[Math.floor(u * (pathPts.length - 1))], side = k % 2 ? 1.5 : -1.5, x = p.x + side, z = p.z, y = hFn(x, z);
    const pole = B.MeshBuilder.CreateCylinder('pole', { height: 1.9, diameter: .09, tessellation: 6 }, scene); pole.position.set(x, y + .95, z); pole.material = post; pole.isPickable = false;
    const lamp = B.MeshBuilder.CreateSphere('postLamp', { diameter: .34, segments: 8 }, scene); lamp.position.set(x, y + 2, z); lamp.material = glass; glowMeshes.push(lamp); lanterns.push(Object.assign(lamp, { metadata: { y: y + 2, ph: k, tiny: true } }));
  });
})();

(function arch() {
  const p0 = pathPts[0], ax = p0.x, az = p0.z + 1.2, ay = hFn(ax, az), wood = mat('archWood', { diffuse: hex('#7a5638') });
  const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI; pts.push(new V3(ax + Math.cos(t) * 1.9, ay + 1.1 + Math.sin(t) * 2.2, az)); }
  const tube = B.MeshBuilder.CreateTube('arch', { path: pts, radius: .13, tessellation: 7 }, scene); tube.material = wood; tube.isPickable = false;
  [-1.9, 1.9].forEach(dx => { const c = B.MeshBuilder.CreateCylinder('post', { height: 1.2, diameter: .26, tessellation: 7 }, scene); c.position.set(ax + dx, ay + .55, az); c.material = wood; c.isPickable = false; });
  const mk = (a, b) => B.Mesh.MergeMeshes([...ring(5, (i, y) => petal({ len: .17, wid: .14, th: .03, a: .35, yaw: y, color: hex(a), tip: hex(b) })), blob(0, .03, 0, .05, .05, .05, hex('#ffd24a'))], true, true);
  [mk('#ff6fae', '#ffd2e6'), mk('#ffffff', '#ffe2ee'), mk('#c28bff', '#ecd9ff')].forEach(m => {
    const N = 42, arr = new Float32Array(N * 16);
    for (let i = 0; i < N; i++) { const t = rand() * Math.PI, s = R(1.4, 2.4); B.Matrix.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(rand() * 6.28, R(-.6, .6), R(-.6, .6)), new V3(ax + Math.cos(t) * 1.9 + R(-.15, .15), ay + 1.1 + Math.sin(t) * 2.2 + R(-.15, .15), az + R(-.2, .2)), mA); mA.copyToArray(arr, i * 16); }
    m.material = vcMat; m.thinInstanceSetBuffer('matrix', arr, 16, true); m.alwaysSelectAsActiveMesh = true; m.isPickable = false;
  });
})();

(function fairyRing() {                                   // toadstools in a circle, as folk tales demand
  const parts = [], stem = B.MeshBuilder.CreateCylinder('ms', { height: .32, diameterTop: .12, diameterBottom: .16, tessellation: 8 }, scene); stem.position.y = .16; stem.bakeCurrentTransformIntoVertices(); paint(stem, () => hex('#f6ead2')); parts.push(stem);
  const cap = B.MeshBuilder.CreateSphere('cap', { diameter: .5, segments: 10, slice: .5 }, scene); cap.position.y = .3; cap.bakeCurrentTransformIntoVertices(); paint(cap, () => hex('#d6342f')); parts.push(cap);
  for (let i = 0; i < 7; i++) { const a = rand() * 6.28, e = R(.35, 1.2), sx = Math.cos(a) * Math.cos(e) * .245, sy = Math.sin(e) * .245, sz = Math.sin(a) * Math.cos(e) * .245; parts.push(blob(sx, .3 + sy, sz, R(.05, .09), .02, R(.05, .09), hex('#fffaf0'), 4)); }
  const m = B.Mesh.MergeMeshes(parts, true, true); m.material = vcMat; m.isPickable = false;
  const arr = []; for (let i = 0; i < 17; i++) { const a = i / 14 * 6.283, rad = 2.8 + R(-.25, .25), x = RING.x + Math.cos(a) * rad, z = RING.z + Math.sin(a) * rad, s = R(.8, 1.9); if (i < 14 || rand() < .6) { B.Matrix.ComposeToRef(new V3(s, s, s), B.Quaternion.RotationYawPitchRoll(rand() * 6.28, R(-.1, .1), R(-.1, .1)), new V3(x, hFn(x, z) - .02, z), mA); arr.push(...mA.toArray()); } }
  m.thinInstanceSetBuffer('matrix', new Float32Array(arr), 16, true);
})();

/* ---------- 8. living things ---------- */
const soft = (name, stops, size = 128) => {              // a soft round sprite
  const t = new B.DynamicTexture(name, { width: size, height: size }, scene, true), g = t.getContext(), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([s, c]) => gr.addColorStop(s, c)); g.fillStyle = gr; g.fillRect(0, 0, size, size); t.update(); t.hasAlpha = true; return t;
};
// floating blossom petals from the tree
(function petals() {
  const tex = new B.DynamicTexture('petalTex', { width: 64, height: 64 }, scene, true), g = tex.getContext();
  g.translate(32, 32); g.rotate(-.6); const gr = g.createRadialGradient(0, 0, 2, 0, 0, 26); gr.addColorStop(0, '#fff0f6'); gr.addColorStop(1, '#ff9ec4');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 25, 13, 0, 0, 6.283); g.fill(); tex.update(); tex.hasAlpha = true;
  const ps = new B.ParticleSystem('petals', 500, scene); ps.particleTexture = tex;
  ps.emitter = new V3(0, treeY + 7, 0); ps.minEmitBox = new V3(-5.5, -2, -5.5); ps.maxEmitBox = new V3(5.5, 2, 5.5);
  ps.direction1 = new V3(-.3, -1, -.3); ps.direction2 = new V3(.5, -.6, .5); ps.minEmitPower = .3; ps.maxEmitPower = .8;
  ps.gravity = new V3(.35, -.35, .12); ps.minLifeTime = 9; ps.maxLifeTime = 16; ps.emitRate = 32; ps.minSize = .1; ps.maxSize = .24;
  ps.minAngularSpeed = -2; ps.maxAngularSpeed = 2; ps.color1 = new B.Color4(1, .9, .95, 1); ps.color2 = new B.Color4(1, .65, .8, 1); ps.colorDead = new B.Color4(1, .8, .9, 0);
  ps.blendMode = B.ParticleSystem.BLENDMODE_STANDARD; ps.preWarmCycles = 160; ps.preWarmStepOffset = 4; ps.start();
})();
// fireflies and pollen
(function fireflies() {
  const ps = new B.ParticleSystem('fireflies', 700, scene);
  ps.particleTexture = soft('fly', [[0, 'rgba(255,245,170,1)'], [.3, 'rgba(255,214,90,.6)'], [1, 'rgba(255,190,60,0)']]);
  ps.emitter = new V3(0, 1.8, 0); ps.minEmitBox = new V3(-42, -1, -42); ps.maxEmitBox = new V3(42, 3.2, 42);
  ps.direction1 = new V3(-.5, -.15, -.5); ps.direction2 = new V3(.5, .5, .5); ps.minEmitPower = .15; ps.maxEmitPower = .5; ps.gravity = new V3(0, .02, 0);
  ps.minLifeTime = 5; ps.maxLifeTime = 11; ps.emitRate = 110; ps.minSize = .1; ps.maxSize = .3; ps.blendMode = B.ParticleSystem.BLENDMODE_ADD;
  ps.addColorGradient(0, new B.Color4(1, .9, .4, 0)); ps.addColorGradient(.2, new B.Color4(1, .9, .45, .95)); ps.addColorGradient(.5, new B.Color4(1, .8, .35, .35)); ps.addColorGradient(.75, new B.Color4(1, .9, .45, .9)); ps.addColorGradient(1, new B.Color4(1, .8, .3, 0));
  ps.preWarmCycles = 120; ps.preWarmStepOffset = 4; ps.start();
})();
// chimney smoke
(function smoke() {
  const ps = new B.ParticleSystem('smoke', 80, scene); ps.particleTexture = soft('puff', [[0, 'rgba(235,225,240,.5)'], [1, 'rgba(235,225,240,0)']]);
  ps.emitter = window.__chimney; ps.minEmitBox = new V3(-.15, 0, -.15); ps.maxEmitBox = new V3(.15, 0, .15);
  ps.direction1 = new V3(.1, 1, 0); ps.direction2 = new V3(.4, 1.2, .1); ps.minEmitPower = .3; ps.maxEmitPower = .7; ps.gravity = new V3(.4, .15, .1);
  ps.minLifeTime = 5; ps.maxLifeTime = 9; ps.emitRate = 7; ps.minSize = .5; ps.maxSize = 1.1; ps.addSizeGradient(0, .4); ps.addSizeGradient(1, 2.4);
  ps.addColorGradient(0, new B.Color4(.9, .85, .95, 0)); ps.addColorGradient(.2, new B.Color4(.9, .85, .95, .32)); ps.addColorGradient(1, new B.Color4(.8, .75, .9, 0));
  ps.preWarmCycles = 80; ps.preWarmStepOffset = 5; ps.start();
})();
// sparkles inside the fairy ring
(function sparkle() {
  const ps = new B.ParticleSystem('sparkle', 160, scene); ps.particleTexture = soft('spk', [[0, 'rgba(255,255,255,1)'], [.4, 'rgba(255,170,255,.6)'], [1, 'rgba(180,120,255,0)']]);
  ps.emitter = new V3(RING.x, hFn(RING.x, RING.z) + .3, RING.z); ps.minEmitBox = new V3(-2.4, 0, -2.4); ps.maxEmitBox = new V3(2.4, .3, 2.4);
  ps.direction1 = new V3(-.1, 1, -.1); ps.direction2 = new V3(.1, 1.6, .1); ps.gravity = new V3(0, .1, 0); ps.minLifeTime = 2.5; ps.maxLifeTime = 5; ps.emitRate = 26; ps.minSize = .06; ps.maxSize = .2;
  ps.color1 = new B.Color4(1, 1, 1, 1); ps.color2 = new B.Color4(1, .7, 1, 1); ps.colorDead = new B.Color4(.7, .5, 1, 0); ps.blendMode = B.ParticleSystem.BLENDMODE_ADD; ps.preWarmCycles = 80; ps.preWarmStepOffset = 4; ps.start();
})();
// stars that twinkle
const stars = (() => {
  const m = B.MeshBuilder.CreateSphere('star', { diameter: 1, segments: 3 }, scene); m.material = mat('starMat', { noLight: true, emissive: hex('#fff7e0') }); m.material.fogEnabled = false; m.infiniteDistance = true; m.applyFog = false; m.isPickable = false; m.alwaysSelectAsActiveMesh = true;
  const N = 90, base = [], arr = new Float32Array(N * 16);
  for (let i = 0; i < N; i++) { const a = rand() * 6.283, e = R(.12, 1.25), d = V3.FromArray([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)]).scale(320); base.push({ d, s: R(.7, 1.9), ph: rand() * 6.28, sp: R(.8, 2.6) }); }
  m.thinInstanceSetBuffer('matrix', arr, 16, false);
  return { m, base, arr, update(t) { base.forEach((b, i) => { const s = b.s * (.55 + .45 * Math.sin(t * b.sp + b.ph)); B.Matrix.ComposeToRef(new V3(s, s, s), B.Quaternion.Identity(), b.d, mA); mA.copyToArray(arr, i * 16); }); m.thinInstanceBufferUpdated('matrix'); } };
})();

// fairies with glowing ribbons
const fairies = [];
['#ff9ad0', '#9fe8ff', '#ffe08a', '#c9a7ff', '#a6ffd0', '#ffb08a'].forEach((c, i) => {
  const core = B.MeshBuilder.CreateSphere('fairy', { diameter: .22, segments: 8 }, scene); const m = mat('fairyMat' + i, { noLight: true, emissive: hex(c) }); core.material = m; glowMeshes.push(core); core.isPickable = false;
  const wm = mat('wing' + i, { noLight: true, emissive: mixC(hex(c), C3.White(), .5), alpha: .55 }), wings = [];
  [-1, 1].forEach(sd => { const w = B.MeshBuilder.CreateDisc('wing', { radius: .2, tessellation: 12 }, scene); w.material = wm; w.parent = core; w.position.x = sd * .13; w.rotation.x = Math.PI / 2; w.scaling.set(.8, 1.4, 1); w.isPickable = false; wings.push({ w, sd }); });
  const trail = new B.TrailMesh('trail', core, scene, .08, 30, true); const tm = mat('trailMat' + i, { noLight: true, emissive: hex(c), alpha: .5 }); tm.alphaMode = B.Engine.ALPHA_ADD; trail.material = tm; trail.isPickable = false;
  fairies.push({ core, wings, cx: R(-9, 9), cz: R(-12, 8), A: R(5, 12), B: R(1.2, 2.2), a: R(.12, .22), b: R(.2, .4), c: R(.1, .2), ph: rand() * 6.28 });
});
// butterflies
const butterflies = [];
(function makeButterflies() {
  const proto = B.MeshBuilder.CreateDisc('wingProto', { radius: .17, tessellation: 12 }, scene); proto.rotation.x = Math.PI / 2; proto.scaling.set(1, 1, 1.15); proto.position.x = .17; proto.bakeCurrentTransformIntoVertices(); proto.setEnabled(false);
  ['#ffd24a', '#ff8fb8', '#8fd3ff', '#ffffff', '#c59bff', '#ff9a4d'].forEach((c, k) => {
    const wm = mat('bf' + k, { diffuse: hex(c), emissive: mixC(hex(c), C3.Black(), .55) });
    for (let n = 0; n < 3; n++) {
      const root = new B.TransformNode('bf', scene), wl = proto.clone('wl'), wr = proto.clone('wr'); wl.setEnabled(true); wr.setEnabled(true); wr.scaling.x = -1; wl.material = wr.material = wm; wl.parent = wr.parent = root; wl.isPickable = wr.isPickable = false;
      butterflies.push({ root, wl, wr, cx: R(-30, 30), cz: R(-30, 30), R: R(2, 6), w: R(.12, .3), w2: R(.1, .25), ph: rand() * 6.28, fl: R(10, 16) });
    }
  });
})();

/* ---------- glow & post effects ---------- */
const glow = new B.GlowLayer('glow', scene, { mainTextureFixedSize: 512, blurKernelSize: 48 }); glow.intensity = .85;
glowMeshes.forEach(m => glow.addIncludedOnlyMesh(m)); fairies.forEach(f => glow.addIncludedOnlyMesh(f.core));

/* ---------- 9. camera: a slow storybook tour, or wander freely ---------- */
const camPos = [[1, 2.6, -37], [3.5, 1.9, -28], [-1.5, 1.7, -19], [-6, 2.2, -12], [-12, 3.4, -3], [-11, 4.4, 6], [-4, 5.2, 12], [5, 5.4, 12], [12, 4.6, 4], [11, 3.8, -6], [4, 2.8, -14], [-1, 9, -22]].map(p => new V3(...p));
const camTgt = [[0, 3.2, 0], [0, 3.5, 0], [-2, 3, -3], [-3, 4, -1], [-1, 5, 0], [0, 5.4, 0], [0, 5.6, 0], [0, 5.6, 0], [0, 5.4, 0], [-1, 5, 2], [-6, 3.5, 6], [-4, 3, 4]].map(p => new V3(...p));
const posCurve = B.Curve3.CreateCatmullRomSpline(camPos, 40, true).getPoints(), tgtCurve = B.Curve3.CreateCatmullRomSpline(camTgt, 40, true).getPoints();
const sample = (arr, u) => { const f = ((u % 1) + 1) % 1 * (arr.length - 1), i = Math.floor(f); return V3.Lerp(arr[i], arr[Math.min(i + 1, arr.length - 1)], f - i); };
const TOUR_SECONDS = 140;
const camera = new B.FreeCamera('cam', camPos[0].clone(), scene); camera.fov = .95; camera.minZ = .1; camera.maxZ = 900; camera.speed = .35; camera.angularSensibility = 2200; camera.inertia = .8;
camera.keysUp = [87, 38]; camera.keysDown = [83, 40]; camera.keysLeft = [65, 37]; camera.keysRight = [68, 39]; camera.keysUpward = [69]; camera.keysDownward = [81];
let tour = true, tourT = parseFloat(params.get('t') || '0');
const modeBtn = document.getElementById('mode'), hint = document.getElementById('hint');
function setTour(on) {
  tour = on;
  if (on) { camera.detachControl(); modeBtn.textContent = '✋ Wander freely'; hint.textContent = ''; }
  else { camera.attachControl(canvas, true); modeBtn.textContent = '🎞 Back to the tour'; hint.innerHTML = 'drag to look · W A S D to walk · Q / E down / up'; }
}
modeBtn.onclick = () => setTour(!tour);

const pipe = new B.DefaultRenderingPipeline('pipe', true, scene, [camera]);
pipe.fxaaEnabled = true; pipe.bloomEnabled = true; pipe.bloomThreshold = .62; pipe.bloomWeight = .45; pipe.bloomKernel = 56; pipe.bloomScale = .6;
pipe.imageProcessingEnabled = true; pipe.imageProcessing.toneMappingEnabled = true; pipe.imageProcessing.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES;
pipe.imageProcessing.exposure = 1.15; pipe.imageProcessing.contrast = 1.18; pipe.imageProcessing.vignetteEnabled = true; pipe.imageProcessing.vignetteWeight = 2.2; pipe.imageProcessing.vignetteColor = new B.Color4(.08, .02, .18, 0);
pipe.sharpenEnabled = true; pipe.sharpen.edgeAmount = .25;

/* ---------- 10. wishes: sky lanterns that talk to the Python backend ---------- */
const whisper = document.getElementById('whisper'), skyMat = mat('skyLantern', { noLight: true, emissive: hex('#ffb347'), alpha: .95 });
const sky = []; let wishTexts = [];
function spawnSky(text, special) {
  const m = B.MeshBuilder.CreateCylinder('sky', { height: .9, diameterTop: .62, diameterBottom: .4, tessellation: 10 }, scene); m.material = skyMat; m.isPickable = false; glow.addIncludedOnlyMesh(m);
  const l = { m, text, x: R(-12, 12), z: R(-12, 12), y: 0, v: special ? 1.1 : R(.45, .85), ph: rand() * 6.28, s: special ? 1.5 : R(.8, 1.2) };
  l.y = special ? hFn(l.x, l.z) + 1 : R(0, 50); sky.push(l); return l;
}
function showWhisper(text) { whisper.textContent = '✦ ' + text + ' ✦'; whisper.classList.add('show'); clearTimeout(showWhisper.t); showWhisper.t = setTimeout(() => whisper.classList.remove('show'), 6500); }
fetch('/api/wishes').then(r => r.json()).then(d => { wishTexts = d.wishes.map(w => w.text); wishTexts.forEach(t => spawnSky(t, false)); for (let i = sky.length; i < 12; i++) spawnSky('', false); }).catch(() => { for (let i = 0; i < 12; i++) spawnSky('', false); });
setInterval(() => { if (wishTexts.length && !document.hidden) showWhisper('a wish drifts by: “' + pick(wishTexts) + '”'); }, 26000);
const wishInput = document.getElementById('wish');
function sendWish() {
  const text = wishInput.value.trim(); if (!text) return; wishInput.value = '';
  fetch('/api/wishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }).catch(() => { });
  wishTexts.push(text.slice(0, 80)); spawnSky(text, true); showWhisper(text);
}
document.getElementById('send').onclick = sendWish; wishInput.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') sendWish(); });

/* ---------- 11. the render loop ---------- */
const tmp = new V3(); let clock = parseFloat(params.get('t') || '0');
scene.onBeforeRenderObservable.add(() => {
  const dt = Math.min(engine.getDeltaTime() / 1000, .1); clock += dt; const t = clock;
  if (tour) { tourT += dt; const u = tourT / TOUR_SECONDS; camera.position.copyFrom(sample(posCurve, u)); camera.setTarget(sample(tgtCurve, u + .002)); }
  swayFlowers(t); stars.update(t);
  glowCanopy.rotation.y = Math.sin(t * .12) * .05; glowCanopy.position.y = treeY + 6.8 + Math.sin(t * .5) * .06;
  lanterns.forEach(l => { l.position.y = l.metadata.y + Math.sin(t * .9 + l.metadata.ph) * (l.metadata.tiny ? .02 : .12); });
  fairies.forEach((f, i) => {
    const x = f.cx + Math.sin(t * f.a + f.ph) * f.A, z = f.cz + Math.cos(t * f.c + f.ph) * f.A, y = hFn(x, z) + 1.4 + (Math.sin(t * f.b + f.ph) + 1) * f.B;
    f.core.position.set(x, y, z); f.wings.forEach(w => { w.w.rotation.z = w.sd * (.5 + Math.sin(t * 28 + i) * .55); });
  });
  butterflies.forEach(b => {
    const p = (tt, o) => o.set(b.cx + Math.sin(tt * b.w + b.ph) * b.R, 0, b.cz + Math.cos(tt * b.w2 + b.ph * 1.3) * b.R), a = p(t, tmp); a.y = hFn(a.x, a.z) + .9 + Math.sin(t * 1.7 + b.ph) * .35 + Math.sin(t * .6 + b.ph) * .2;
    b.root.position.copyFrom(a); const n = p(t + .25, new V3()); n.y = a.y; b.root.lookAt(n);
    const fl = Math.sin(t * b.fl + b.ph) * .95; b.wl.rotation.z = fl; b.wr.rotation.z = -fl;
  });
  for (let i = 0; i < sky.length; i++) {
    const l = sky[i]; l.y += l.v * dt; const h = hFn(l.x, l.z);
    l.m.position.set(l.x + Math.sin(t * .2 + l.ph) * 2.5 + l.y * .12, h + l.y, l.z + Math.cos(t * .17 + l.ph) * 2.5); l.m.scaling.setAll(l.s * (1 + Math.sin(t * 2 + l.ph) * .03));
    if (l.y > 60) { l.y = 0; l.s = R(.8, 1.2); l.v = R(.45, .85); l.x = R(-14, 14); l.z = R(-14, 14); }
  }
});

scene.executeWhenReady(() => {
  document.getElementById('loading').classList.add('hide');
  setTimeout(() => document.getElementById('title').classList.add('hide'), params.has('t') ? 100 : 8500);
});
engine.runRenderLoop(() => scene.render());
addEventListener('resize', () => engine.resize());
window.__garden = { scene, engine, camera };
})();
