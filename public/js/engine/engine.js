/* =====================================================================
   engine/engine.js - the shared namespace G, Babylon engine + scene, math helpers, base material
   Loaded first. Every other module reads what it needs from window.G.
   ===================================================================== */
(() => {
let G_SCALE = 1;
const B = BABYLON, V3 = B.Vector3, C3 = B.Color3, M4 = B.Matrix;
const G = window.G = { B, V3, C3, M4, CONFIG: window.GARDEN_CONFIG };
const canvas = document.getElementById('scene');
const engine = new B.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, antialias: false, powerPreference: 'high-performance' }, false);
engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, G.CONFIG.render.maxPixelRatio));       // cap the pixel count: crisp, but cheap
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
})();
