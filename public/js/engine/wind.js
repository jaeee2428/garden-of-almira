/* =====================================================================
   engine/wind.js - one shared wind field, bent into every plant vertex on the GPU
   WindPlugin (MaterialPluginBase) + the wind materials in G.mats. Tunables live in config/settings.js.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, scene } = G;
/* ---------- wind: one shared wind field, evaluated on the GPU for every plant vertex ---------- */
G.windState = { time: 0, dx: .93, dz: .37, gain: .6, px: 0, py: 0, pz: 0, playerR: 1.5, pokeX: 0, pokeT: -99, pokeZ: 0, pokeAmp: 0 };
G.poke = (x, z, amp = 1) => { const w = G.windState; w.pokeX = x; w.pokeZ = z; w.pokeT = w.time; w.pokeAmp = amp; };          // a click sends a ripple through the plants
// The bend model (per vertex, on the GPU):
//  * a plant is a cantilever: it bends from its ROOT (the instance origin), bend grows with height^2 / stiffness
//  * the whole plant uses the phase of its root, so it moves as one body (no jelly ripple across a single bush)
//  * a steady mean bend from the breeze + a gust front rolling across the garden + the plant's own natural sway
//    frequency (stiff, tall things sway slowly; grass quickly)
//  * stems keep their length: a vertex pushed sideways by s also drops by h - sqrt(h^2 - s^2)
//  * the bend is capped (maxBend = horizontal offset / height), so nothing folds flat
//  * optional distance fade (fade: [start, end] metres): tiny far plants shrink into the ground instead of
//    shimmering as sub-pixel noise, and never pop when their chunk is culled
const UNIFORMS = 'uniform vec4 uWind0; uniform vec4 uWind1; uniform vec4 uWind2; uniform vec4 uPlayer; uniform vec4 uPoke; uniform vec4 uTrail; uniform vec4 uTrail2;';
const WIND_DEFS = `
#ifdef WIND
vec2 bodyPush(vec2 q, vec2 p, vec2 c, float r) {                         // smooth (no kink) push away from a body of radius r:
  vec2 v = q - c; float d = length(p - c);                               // the DIRECTION comes from the stem's root q (the whole plant leans
  return v / max(length(v), 0.05) * (1.0 - smoothstep(r * 0.2, r, d));   // one way: no hollow scooped around her), the amount from p
}
vec3 windOffset(vec3 wp, vec3 root, float hh, float aw) {
  vec2 d = uWind0.xy; float gain = uWind0.z, t = uWind0.w;
  vec2 rp = mix(root.xz, wp.xz, 0.12);                                   // mostly the root's phase: the plant moves as one
  vec2 side = vec2(-d.y, d.x);
  float front = dot(rp, d) * 0.16 - t * 1.1;                             // gust front, ~40 m long, rolling downwind
  float g = 0.72 + 0.2 * sin(front) + 0.1 * sin(front * 2.3 + dot(rp, side) * 0.31 - t * 0.5);
  float amp = gain * g;
  float b = hh * hh * uWind1.x;                                          // cantilever: bend ~ height^2 / stiffness
  float hz = uWind2.x, ph = dot(rp, vec2(0.71, 1.37)) * 2.3;             // natural sway, phase per plant
  float sway = 0.22 * sin(t * hz + ph) + 0.08 * sin(t * hz * 1.73 + ph * 1.9);
  vec2 push = d * amp * b * (1.0 + sway) + side * amp * b * 0.12 * sin(t * hz * 0.61 + ph * 0.7);
  vec2 pd = rp - uPlayer.xz; float pl = length(pd);                      // whole plants part around the free camera - not while you walk as Ikaw
  push += normalize(pd + vec2(1e-4)) * (1.0 - smoothstep(0.0, uWind1.w, pl)) * b * 2.2 * (1.0 - step(0.001, uPlayer.w));
  float pt = t - uPoke.y;                                                // a click sends a ripple outward
  if (pt > 0.0 && pt < 4.0) { vec2 pr = wp.xz - uPoke.xz; float rr = length(pr); float fr = pt * 6.0; float w = sin((rr - fr) * 2.1) * exp(-abs(rr - fr) * 0.55) * exp(-pt * 0.8) * uPoke.w; push += normalize(pr + vec2(1e-4)) * w * b * 1.5; }
  float sl = length(push), smax = uWind2.y * hh;                         // cap the bend angle
  if (sl > smax) push *= smax / max(sl, 1e-5);
  // body contact (the avatar): a stem she brushes leans away from her as a WHOLE (direction from the stem's root, bend
  // growing with height like a real cantilever), and when she has passed it springs back, swings a little past upright
  // and settles: positions where she was 0.18 s / 0.45 s / 0.8 s ago are mixed in with the weights of a damped spring.
  if (uPlayer.w > 0.0) {
    vec2 q = root.xz, p2 = mix(root.xz, wp.xz, 0.3); float R = uTrail2.w;
    vec2 cp = bodyPush(q, p2, uPlayer.xz, R)
            + (bodyPush(q, p2, uTrail.xy, R * 0.92) * 0.55 - bodyPush(q, p2, uTrail.zw, R * 0.85) * 0.28 + bodyPush(q, p2, uTrail2.xy, R * 0.8) * 0.1) * uTrail2.z;
    float bend = min(hh * (0.35 + 2.0 * hh), 0.8 * hh);                       // most at the top, nothing at the root
    float reach = 1.0 - smoothstep(1.0, 1.45, wp.y - uPlayer.y + 0.5);       // only up to about her shoulders
    push += cp * bend * reach * uPlayer.w; sl = length(push); smax = max(smax, .85 * hh);
  }
  sl = min(sl, smax);
  float drop = hh - sqrt(max(hh * hh - sl * sl, 0.0));                   // keep the stem length
  float fl = uWind1.y * aw * (0.25 + 0.6 * amp);                         // small leaf tremble at the tips
  vec3 flut = vec3(sin(t * 6.5 + wp.x * 3.1 + wp.y * 2.0), sin(t * 7.7 + wp.z * 2.9) * 0.5, sin(t * 5.9 + wp.z * 3.3 + wp.y * 1.7)) * fl;
  return vec3(push.x, uWind1.z > 0.5 ? drop : -drop, push.y) + flut;     // hanging things swing UP as they swing out
}
#endif`;
class WindPlugin extends B.MaterialPluginBase {
  constructor(material, o) { super(material, 'Wind', 210, { WIND: false }); this.flex = o.flex ?? .05; this.flutter = o.flutter ?? 0; this.hang = !!o.hang; this.hz = o.hz ?? 2.4; this.maxBend = o.maxBend ?? .5; this.fade = o.fade || [0, 0]; this._enable(true); }
  prepareDefines(defines) { defines.WIND = true; }
  getClassName() { return 'WindPlugin'; }
  getUniforms() { return { ubo: ['uWind0', 'uWind1', 'uWind2', 'uPlayer', 'uPoke', 'uTrail', 'uTrail2'].map(name => ({ name, size: 4, type: 'vec4' })), vertex: `#ifdef WIND\n${UNIFORMS}\n#endif` }; }
  bindForSubMesh(ub) { const w = G.windState; ub.updateFloat4('uWind0', w.dx, w.dz, w.gain, w.time); ub.updateFloat4('uWind1', this.flex, this.flutter, this.hang ? 1 : 0, w.playerR); ub.updateFloat4('uWind2', this.hz, this.maxBend, this.fade[0], this.fade[1]); ub.updateFloat4('uPlayer', w.px, w.py, w.pz, (w.contact || 0) * (this.flex >= .02 && !this.hang ? 1 : 0)); const T = w.trail || [0, 0, 0, 0, 0, 0]; ub.updateFloat4('uTrail', T[0], T[1], T[2], T[3]); ub.updateFloat4('uTrail2', T[4], T[5], w.trailK || 0, w.bodyR || .45); ub.updateFloat4('uPoke', w.pokeX, w.pokeT, w.pokeZ, w.pokeAmp); }   // body contact only bends soft plants
  getCustomCode(shaderType) {
    if (shaderType !== 'vertex') return null;
    return {
      CUSTOM_VERTEX_DEFINITIONS: WIND_DEFS,
      CUSTOM_VERTEX_UPDATE_WORLDPOS: `#ifdef WIND
#ifdef VERTEXCOLOR
float aw_ = color.a;
#else
float aw_ = 1.0;
#endif
float hh_ = (uWind1.z > 0.5 ? abs(positionUpdated.y) : max(positionUpdated.y, 0.0)) * length(finalWorld[1].xyz);
vec3 root_ = finalWorld[3].xyz;
if (uWind2.w > 0.0) {                       // distance LOD fade: small plants sink into the ground before they are culled
  float fd_ = 1.0 - smoothstep(uWind2.z, uWind2.w, distance(root_.xz, uPlayer.xz));
  worldPos.xyz = root_ + (worldPos.xyz - root_) * fd_; hh_ *= fd_;
}
worldPos.xyz += windOffset(worldPos.xyz, root_, hh_, aw_);
#endif`,
    };
  }
}
G.windMat = (name, o) => { const m = G.mat(name, { emissive: new C3(.035, .03, .025), specular: new C3(.045, .045, .04), power: 20 }); m.__wind = new WindPlugin(m, o); return m; };
// one material per stiffness class; names + numbers come from G.CONFIG.wind.materials
G.mats = {}; for (const [k, o] of Object.entries(G.CONFIG.wind.materials)) G.mats[k] = G.windMat('wind' + k[0].toUpperCase() + k.slice(1), o);
})();
