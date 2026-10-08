/* =====================================================================
   world/sea.js - Gerstner-wave sea with a real surf zone (GPU) + G.waveAt (same waves on the CPU, for the boats)
   ===================================================================== */
(() => {
const { B, V3, C3, M4, scene } = G;
/* ---------- sea: real waves, a real surf zone ----------
   Four layered Gerstner swells (numbers in config: G.CONFIG.sea). The SAME function runs on the GPU (water surface)
   and the CPU (G.waveAt, for the boats), generated from one table so they can never drift apart.
   Near the beach (d = metres seaward of the shoreline, negative = sea):
     refraction : swells turn to face the beach (they arrive parallel to the shore, as real waves do)
     shoaling   : waves grow and steepen as the water gets shallow, then BREAK around the bar (~9 m out)
     surf       : after breaking, a foam bore follows each crest up the beach and thins out
     swash      : the water sheet runs up the sand once per swell and drains back
   Whitecaps offshore grow with the wind. At night the breaking foam glows faintly blue (bioluminescence). */
const SC = G.CONFIG.sea;
const WAVES = SC.swells.map(([x, z, l, a]) => { const L = Math.hypot(x, z), k = 2 * Math.PI / l; return { dx: x / L, dz: z / L, k, a, w: Math.sqrt(9.81 * k) * .85 }; });
const AMP_NORM = WAVES.reduce((s, w) => s + w.a, 0);
G.seaAmp = .8;
const sm = G.smooth;
const shoreSlope = z => .198 * Math.cos(z * .09) + .184 * Math.cos(z * .23);                       // d(shoreX)/dz
const env = d => (1 + SC.shoal * Math.exp(-Math.pow((d - SC.breakAt) / 4, 2))) * (.1 + .9 * sm(-1, SC.breakAt + 1, d)) * sm(1, -1, d);
G.waveAt = (x, z, t, out) => {                                      // height + slope of the sea at (x,z): used by the boats
  const d = x - G.shoreX(z), cp = G.camera ? G.camera.position : { x: 0, z: 0 }, far = 1 - sm(90, 260, Math.hypot(cp.x - x, cp.z - z)), amp = G.seaAmp * env(d) * far;
  const nl = Math.hypot(1, shoreSlope(z)), nx = 1 / nl, nz = -shoreSlope(z) / nl, rf = sm(-34, -3, d) * .85; let h = 0, gx = 0, gz = 0;
  for (const w of WAVES) { let dx = w.dx + (nx - w.dx) * rf, dz = w.dz + (nz - w.dz) * rf; const l = Math.hypot(dx, dz); dx /= l; dz /= l;
    const ph = w.k * (dx * x + dz * z) - w.w * t, A = w.a * amp; h += A * Math.sin(ph); const cg = w.k * A * Math.cos(ph); gx += dx * cg; gz += dz * cg; }
  out = out || {}; out.h = h; out.gx = gx; out.gz = gz; return out;
};
const f5 = v => v.toFixed(5);
const WGLSL = WAVES.map((w, i) => `const vec4 W${i}=vec4(${f5(w.dx)},${f5(w.dz)},${f5(w.k)},${f5(w.a)});`).join(' ') + `
const float AMPN=${f5(AMP_NORM)}, BREAK=${f5(SC.breakAt)}, SHOAL=${f5(SC.shoal)}, SWASH=${f5(SC.swash)};
float shoreX(float z){ return -47.+sin(z*.09)*2.2+sin(z*.23)*.8; }
vec2 shoreN(float z){ return normalize(vec2(1., -(.198*cos(z*.09)+.184*cos(z*.23)))); }
float env(float d){ return (1.+SHOAL*exp(-pow((d-BREAK)/4.,2.)))*(.1+.9*smoothstep(-1.,BREAK+1.,d))*smoothstep(1.,-1.,d); }
float waveAmp(vec2 p, vec3 camPos, float uAmp){ float d=p.x-shoreX(p.y); return uAmp*env(d)*(1.-smoothstep(90.,260.,length(camPos.xz-p))); }
// one Gerstner wave, refracted toward the shore normal; q = steepness (crests sharpen in the surf zone)
void wv(vec4 w, vec2 p, float t, float amp, float rf, vec2 n, float q, inout vec3 disp, inout vec2 grad, inout float ph0){
  vec2 dir=normalize(mix(w.xy,n,rf)); float k=w.z, ph=k*dot(dir,p)-sqrt(9.81*k)*.85*t, A=w.w*amp, c=cos(ph), s=sin(ph);
  disp.xz+=dir*(q*A*c); disp.y+=A*s; grad+=dir*(k*A*c); if(w.w>.2) ph0=ph; }
float swashH(float ph0, float uAmp){ float s=.5+.5*sin(ph0-.6); return SWASH*(.6+.4*uAmp)*s*s; }      // runs up fast, drains slowly
float groundY(vec2 p, float d){                                                                         // exact ground height near the shore (= terrain.js G.hFn there)
  float rolling=.5*sin(p.x*.07+1.3)*cos(p.y*.06)+.28*sin(p.x*.17+p.y*.11)+.12*sin(p.y*.29-p.x*.07);
  return mix(rolling*pow(smoothstep(4.,26.,length(p)),1.1)+.3,-1.8,smoothstep(4.,-10.,d)); }
`;
const WAVE_CALLS = (pv) => WAVES.map((_, i) => `wv(W${i},${pv},time,amp,rf,nrm,q,disp,g,ph0);`).join(' ');
B.Effect.ShadersStore.seaVertexShader = `precision highp float; attribute vec3 position; uniform mat4 viewProjection; uniform float time,uAmp; uniform vec3 camPos; varying vec3 vW; varying float vH; varying float vPh;
${WGLSL}
void main(){ vec3 p=position; float d=p.x-shoreX(p.z), amp=waveAmp(p.xz,camPos,uAmp), rf=smoothstep(-34.,-3.,d)*.85, q=.5+.35*exp(-pow((d-BREAK)/3.,2.)); vec2 nrm=shoreN(p.z);
  vec3 disp=vec3(0.); vec2 g=vec2(0.); float ph0=0.; ${WAVE_CALLS('p.xz')}
  disp.y+=swashH(ph0,uAmp)*smoothstep(-8.,-2.,d)*smoothstep(7.,3.,d);    // the swash lifts the water sheet up the beach (only the beach)
  vec3 w=p+disp; vW=w; vH=disp.y/(AMPN*max(amp,.001)); vPh=ph0; gl_Position=viewProjection*vec4(w,1.); }`;
B.Effect.ShadersStore.seaFragmentShader = `precision highp float; varying vec3 vW; varying float vH; varying float vPh;
uniform vec3 camPos,sunDir,sunCol,deepCol,shallowCol,skyCol,fogCol; uniform float time,nightK,fogD,uAmp;
${WGLSL}
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
void main(){ vec2 p=vW.xz; vec3 V=normalize(camPos-vW); float d=p.x-shoreX(p.y), amp=waveAmp(p,camPos,uAmp), rf=smoothstep(-34.,-3.,d)*.85, q=.5; vec2 nrm=shoreN(p.y);
  vec3 disp=vec3(0.); vec2 g=vec2(0.); float ph0=0.; ${WAVE_CALLS('p')}
  float t=time; g+=(vec2(n(p*1.3+t*.35),n(p*1.5-t*.3+9.))-.5)*.10*(.5+uAmp*.5); g+=(vec2(n(p*4.2+t*.8),n(p*3.9-t*.7+3.))-.5)*.05;
  vec3 N=normalize(vec3(-g.x,1.,-g.y)); float cosv=max(dot(N,V),0.); float fr=.03+.97*pow(1.-cosv,5.);
  vec3 R=reflect(-V,N); float sd=max(dot(R,sunDir),0.); float sp=pow(sd,300.)*3.2+pow(sd,28.)*.32; sp*=.7+.45*n(p*2.2+t*.6);          // soft sun glitter
  float depth=vW.y-groundY(p,d), depthK=smoothstep(.2,6.,depth);                                              // real water depth over the sand
  vec3 base=mix(shallowCol,deepCol,depthK); float crest=clamp(vH,0.,1.); base+=shallowCol*pow(crest,2.)*.22*(1.-nightK);   // light through thin crests
  vec3 col=mix(base,skyCol,clamp(fr*1.1,0.,1.))+sunCol*sp*(1.-nightK*.8);
  float brk=n(p*vec2(1.7,.9)+t*.3);                                                                          // breaks up foam into patches
  // offshore whitecaps on the highest crests, more when it is windy
  float cap=smoothstep(.72-.12*uAmp,1.,vH)*smoothstep(.55,1.,n(p*1.9+t*.5))*smoothstep(.5,1.4,uAmp)*smoothstep(-14.,-30.,d);
  // breaking crests over the bar, then the foam bore that follows each swell crest up the beach
  float surfZone=smoothstep(BREAK-4.,BREAK,d)*smoothstep(-.5,-2.,d);
  float brkCrest=smoothstep(.35,.85,vH)*exp(-pow((d-BREAK)/3.5,2.));
  float u=fract((vPh-1.5708)/6.2832), bore=pow(u,5.)*surfZone*(.5+.5*brk);
  // the waterline: foam where the swash sheet is thin over the sand
  float edge=smoothstep(.16,.02,depth)*smoothstep(-.06,.03,depth)*(.6+.4*n(p*2.6+t*.4));
  float foam=clamp(cap*.9+brkCrest*.9*(.6+.4*brk)+bore*.85+edge,0.,1.);
  col=mix(col,vec3(.96,.98,.98)*(1.-nightK*.62),foam*.82);
  col+=vec3(.12,.55,1.)*(brkCrest+bore)*nightK*.28;                                                         // night: faint blue glow in the breaking surf
  float dist=length(camPos-vW); float f=1.-exp(-pow(dist*fogD,2.)); col=mix(col,fogCol,clamp(f,0.,1.));
  float a=mix(.35,.97,smoothstep(.0,1.6,depth)); a=max(a,foam*.85); a*=smoothstep(-.04,.05,depth); gl_FragColor=vec4(col,a); }`;
const seaMat = new B.ShaderMaterial('seaMat', scene, { vertex: 'sea', fragment: 'sea' }, { attributes: ['position'], uniforms: ['viewProjection', 'camPos', 'sunDir', 'sunCol', 'deepCol', 'shallowCol', 'skyCol', 'fogCol', 'time', 'nightK', 'fogD', 'uAmp'], needAlphaBlending: true });
seaMat.backFaceCulling = false;
(function seaMesh() {                                                  // dense across the surf zone, coarser out to the horizon
  const xs = [], zp = [0]; let x = -30, dx = .7; while (x > -1700) { xs.push(x); x -= dx; if (x < -66) dx = Math.min(dx * 1.06, 120); }   // 0.7 m cells across the surf zone
  let z = 0, dz = 1.3; while (z < 1100) { z += dz; dz = Math.min(dz * 1.05, 120); zp.push(z); }
  const zs = [...zp.slice(1).reverse().map(v => -v), ...zp], pos = [], idx = [], nx = xs.length;
  for (let i = 0; i < zs.length; i++) for (let j = 0; j < nx; j++) pos.push(xs[j], G.SEA_Y, zs[i]);
  for (let i = 0; i < zs.length - 1; i++) for (let j = 0; j < nx - 1; j++) { const a = i * nx + j, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
  const m = new B.Mesh('sea', scene), vd = new B.VertexData(); vd.positions = pos; vd.indices = idx; vd.applyToMesh(m); m.material = seaMat; m.isPickable = false; m.applyFog = false; m.alwaysSelectAsActiveMesh = true; G.sea = m;
})();
G.seaMat = seaMat;
})();
