/* =====================================================================
   game/avatar.js - "Ikaw": you, a young Cebuana in a coral sundress and sandals
   A properly proportioned 1.58 m human with a jointed skeleton (hips, knees, ankles,
   shoulders, elbows, neck), driven by human physics and a procedural gait:
     physics : acceleration / inertia, slower uphill, wading slows you (deep water stops you), gravity,
               jumping and landing (knees absorb the impact), you stop when you walk into something solid
     gait    : the walk/run cycle advances with the distance travelled, so feet don't skate; arms counter-swing,
               hips and shoulders twist, the torso leans with speed, the body breathes when standing still
     motion  : animation principles on springs, never linear: anticipation (a knee dip before a jump, the head
               turns before the body), follow-through (arms and hair swing on and settle after you stop), the
               body banks into turns and leans with acceleration / against braking (balance: atan(a / g)),
               landings compress the knees and rebound slightly; idle weight shifts and glances (eased)
     contact : footsteps that sound like what you step on (grass, sand, stone, water), splashes, a thud when you
               bump into things, leaves that rustle and part around you, hens and butterflies that get out of the way
   Views: first person (camera in the eyes, steps bob it naturally) or third person (a follow camera). Tab switches.
   game/controls.js calls G.avatar.step(dt, input) while walking (not while flying, not in the tour).
   ===================================================================== */
(() => {
const { B, V3, MB, rgb, mixA, shade, clamp, scene, hFn, camera } = G;
const C = G.CONFIG.avatar, NOOP = new Proxy({}, { get: () => () => { } });
const sfx = () => G.sfx || NOOP;                                         // no sound module (?nomusic) = silent
const sm = G.smooth;

/* ---------- the body: a young Filipina (~1.60 m) in a floral sundress; one mesh per bone on a skeleton of transform nodes ---------- */
const SKIN = rgb(C.skin), HAIR = rgb(C.hair), DRESS = rgb(C.dress), TRIM = rgb(C.trim), SANDAL = rgb(C.sandal), LIP = rgb(C.lips);
const node = (name, parent, x = 0, y = 0, z = 0) => { const n = new B.TransformNode('av_' + name, scene); n.parent = parent; n.position.set(x, y, z); return n; };
const meshes = [];
const part = (name, parent, draw) => { G.LODV = 0; const mb = new MB(); draw(mb); const m = mb.build('av_' + name, G.vc); m.parent = parent; m.isPickable = false; G.cast(m); meshes.push(m); return m; };
const tube = (mb, a, b, r, col, sides = 14) => mb.tube([new V3(...a), V3.Lerp(new V3(...a), new V3(...b), .5), new V3(...b)], r, sides, (t, s) => shade(col, .95 + .06 * Math.sin(s * 6.283)), null, true);
const skinC = (k = 1) => (u, v) => shade(SKIN, k * (.93 + .08 * v));
const print = (u, v) => shade(DRESS, .94 + .06 * Math.sin(u * 6.283 * 9) * (.4 + .6 * v) + .03 * (1 - v));   // plain cotton: soft vertical folds that deepen toward the hem (the dotted print blurred into random blotches)
// a limb shaped like a real one: a turned surface whose radius (rx side-to-side, rz front-to-back) and centre offset follow
// an anatomical profile along its length (deltoid, biceps, forearm taper to a slim wrist; thigh, calf bulge behind, ankle)
const limb = (mb, y0, y1, prof, cf, nu = 22, nv = 18) => mb.grid(nu, nv, (u, v) => { const a = u * 6.283, [rx, rz, zo, xo] = prof(v); return [Math.cos(a) * rx + (xo || 0), y0 + (y1 - y0) * v, Math.sin(a) * rz + (zo || 0)]; }, typeof cf === 'function' ? cf : () => cf);
const bump = (t, c, w) => Math.exp(-(((t - c) / w) ** 2));
const ell = (mb, x, y, z, rx, ry, rz, n, m, cf) => mb.ellipsoid(x, y, z, rx, ry, rz, n, m, typeof cf === 'function' ? cf : () => cf);

const root = new B.TransformNode('avatar', scene);
const SCALE = C.scale || 1; root.scaling.setAll(SCALE);                               // overall height (1.58 m x scale); everything below is in unscaled body units
const pelvis = node('pelvis', root, 0, .86, 0);
part('hips', pelvis, mb => { ell(mb, 0, 0, -.005, .158, .11, .105, 24, 14, print); ell(mb, 0, .068, 0, .166, .028, .148, 28, 6, TRIM); });   // dress over the hips + white sash
const spine = node('spine', pelvis, 0, .06, 0);
part('torso', spine, mb => {
  mb.grid(32, 18, (u, v) => {                                                               // the bodice as one smooth turned shape: waist -> fuller front -> neckline
    const a = u * 6.283, back = Math.max(0, -Math.cos(a)), y = -.01 + v * (.32 + .012 * back * back), rx = .106 + .034 * G.smooth(0, .62, v) - .01 * G.smooth(.82, 1, v), rz = .078 + .012 * G.smooth(0, .6, v) - .012 * G.smooth(.82, 1, v);
    const front = Math.max(0, Math.cos(a)), bust = .016 * Math.exp(-Math.pow((v - .62) / .16, 2)) * front * front;
    return [Math.sin(a) * rx, y, Math.cos(a) * (rz + bust) + .006]; }, print);
  ell(mb, 0, .312, -.004, .148, .075, .086, 28, 14, skinC());                              // shoulders and upper chest, sloping into the neck
  mb.tube([new V3(-.125, .3, .045), new V3(-.06, .285, .085), new V3(0, .279, .097), new V3(.06, .285, .085), new V3(.125, .3, .045)], .0055, 6, () => TRIM);   // neckline trim
});
const neck = node('neck', spine, 0, .365, .004);
part('neck', neck, mb => tube(mb, [0, -.03, 0], [0, .095, .01], [.046, .039], SKIN));
const head = node('head', neck, 0, .085, .01);
const headParts = [
  part('head', head, mb => {
    ell(mb, 0, .1, 0, .073, .097, .087, 30, 22, skinC());                                   // cranium + face
    ell(mb, 0, .048, .022, .05, .046, .06, 20, 14, skinC());                                 // soft jaw and chin
    for (const sd of [-1, 1]) {
      ell(mb, sd * .028, .111, .077, .0145, .0072, .0062, 14, 8, [.95, .93, .9]);           // eye whites (almond)
      ell(mb, sd * .028, .111, .0815, .0062, .0062, .0035, 12, 8, rgb('#3a2418'));          // iris (dark brown)
      ell(mb, sd * .028, .111, .0845, .0027, .0027, .0015, 8, 6, [.02, .015, .01]);         // pupil
      ell(mb, sd * .0255, .1135, .0855, .0011, .0011, .0008, 5, 4, [1, 1, 1]);              // catch-light
      ell(mb, sd * .029, .1172, .0805, .0165, .0026, .0045, 12, 4, HAIR);                   // upper lash line
      mb.tube([new V3(sd * .012, .128, .084), new V3(sd * .028, .1335, .083), new V3(sd * .044, .129, .074)], [.0028, .0016], 5, () => shade(HAIR, 1.2));   // arched brows
      ell(mb, sd * .07, .1, -.006, .009, .018, .012, 8, 6, skinC(.95));                    // ears
    }
    ell(mb, 0, .093, .082, .0085, .016, .012, 10, 8, skinC(1.03));                         // nose bridge
    ell(mb, 0, .083, .089, .0085, .0075, .0075, 10, 8, skinC(1.03));                        // nose tip
    ell(mb, 0, .0645, .083, .0155, .0042, .0058, 14, 6, LIP); ell(mb, 0, .0585, .0815, .0135, .0058, .0065, 14, 6, shade(LIP, 1.1));   // lips
  }),
  part('hair', head, mb => {
    mb.grid(28, 16, (u, v) => { const th = u * 6.283, ph = v * Math.PI * .62, front = Math.max(0, Math.cos(th - Math.PI / 2)), lift = front * front * .38;   // a cap that stops at the hairline
      const ph2 = Math.min(ph, Math.PI * (.62 - lift)); return [Math.cos(th) * Math.sin(ph2) * .081, .128 + Math.cos(ph2) * .088, Math.sin(th) * Math.sin(ph2) * .095 - .008]; },
      (u, v) => shade(HAIR, .85 + .3 * Math.pow(Math.max(0, Math.sin(u * 80 + v * 3)), 4)));
    // hair strands lie ON the head: each point is placed on the skin surface (cranium ellipsoid) plus the strand's own thickness
    const onHead = (x, y, lift) => { const q = 1 - (x / .073) ** 2 - ((y - .1) / .097) ** 2; return new V3(x, y, Math.sqrt(Math.max(q, 0)) * .087 + lift); };
    const hc = (t, a) => shade(HAIR, .88 + .22 * Math.pow(Math.max(0, Math.sin(a * 6.283 * 3 + t * 9)), 3));
    for (let k = 0; k < 5; k++) {                                                    // a soft side-swept fringe: 5 overlapping rounded locks from the parting
      const x0 = -.035 + k * .006, x1 = .012 + k * .013, y1 = .178 - k * .009;
      mb.tube([onHead(x0, .197, .006), onHead((x0 + x1) / 2, .19 - k * .003, .008), onHead(x1, y1, .006), onHead(x1 + .012, y1 - .02, .004)], t => (.0105 - .006 * t) * (1 - .1 * k / 4), 8, hc, null, true);
    }
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {                          // locks framing the face: rounded strands in front of the ears, down to the jaw
      const x = sd * (.071 + k * .004), z0 = .028 - k * .012;
      mb.tube([new V3(x * .97, .17, z0 + .004), new V3(x * 1.06, .12, z0), new V3(x * 1.1, .07, z0 - .006), new V3(x * 1.06, .02 - k * .012, z0 - .004)], t => .0085 - .0045 * t, 8, hc, null, true);
    }
    G.geo.sampaguitaFlower(mb, G.basis(new V3(.55, .3, .25).normalize(), V3.Up(), new V3(.068, .165, .012), 0, 1.6), G.rng(7));                                  // a sampaguita in her hair
    G.geo.sampaguitaFlower(mb, G.basis(new V3(.7, .55, -.1).normalize(), V3.Up(), new V3(.074, .155, -.012), 0, 1.3), G.rng(8));
  }),
];
// long hair: ONE closed volume that starts inside the hair cap at the crown, hugs the back of the head and the nape
// (no gap, no flat sheet) and falls down her back in soft clumps with uneven tips. Only the part below the nape moves:
// it bends progressively (more at the tips) from a two-stage pendulum, so it swings, lags and settles like real hair,
// and it is never allowed to swing into her back.
const HF = { nu: 40, nv: 22, top: .15, nape: .02, bot: -.36, pivot: new V3(0, .02, -.07) };
const hairShape = v => {                                                            // centre-z, half-width, half-depth of the hair mass at height v (0 crown .. 1 tips)
  const y = HF.top + (HF.bot - HF.top) * v, n = sm(HF.top, HF.nape, y), lo = sm(HF.nape, HF.bot, y);
  return { y, zc: -.048 - .02 * n - .055 * sm(HF.nape, -.12, y) - .012 * lo, rx: .086 - .006 * n + .018 * sm(HF.nape, -.12, y) - .03 * lo * lo, rz: .056 - .028 * n - .012 * lo };
};
const hairFall = part('hairFall', head, mb => {
  mb.grid(HF.nu, HF.nv, (u, v) => { const S = hairShape(v), a = u * 6.283, clump = 1 + .07 * Math.sin(a * 9 + 1.3) * sm(.25, 1, v), jag = v > .9 ? (v - .9) * 10 * .045 * (.5 + .5 * Math.sin(u * 61.7)) : 0;
      return [Math.sin(a) * S.rx * clump, S.y + jag, S.zc - Math.cos(a) * S.rz * clump]; },
    (u, v) => mixA(shade(HAIR, .8 + .28 * Math.pow(Math.max(0, Math.sin(u * 150 + v * 5)), 4) - .08 * v), rgb('#4a2c1c'), .25 * Math.pow(Math.max(0, Math.sin(u * 23 + v * 2.5)), 6) * (1 - v)), null, null);
  // separate strands lying on the outside of the hair mass: they catch the light and break up the outline (bent with it)
  const sr = G.rng(41);
  for (let k = 0; k < 26; k++) { const a = (sr() - .5) * 3.5, ph = sr() * 6.28, len = .75 + sr() * .25, pts = [];
    for (let j = 0; j <= 12; j++) { const v = .08 + len * .9 * j / 12, S = hairShape(Math.min(v, .995)), aa = a + .05 * Math.sin(v * 9 + ph); pts.push(new V3(Math.sin(aa) * (S.rx + .004), S.y, S.zc - Math.cos(aa) * (S.rz + .004))); }
    mb.tube(pts, t => .0075 * (1 - t * .75), 6, (t, w) => mixA(shade(HAIR, .9 + .35 * Math.pow(Math.max(0, Math.sin(w * 6.283)), 3)), rgb('#3a2418'), .2 * (1 - t)), null, true); }
});
hairFall.markVerticesDataAsUpdatable(B.VertexBuffer.PositionKind, true); hairFall.markVerticesDataAsUpdatable(B.VertexBuffer.NormalKind, true);
const hairBase = Float32Array.from(hairFall.getVerticesData(B.VertexBuffer.PositionKind)), hairPos = new Float32Array(hairBase.length), hairIdx = hairFall.getIndices(), hairNrm = [];
const hairW = new Float32Array(hairBase.length / 3).map((_, i) => Math.pow(sm(HF.nape, HF.bot, hairBase[i * 3 + 1]), 1.4));   // bend weight: 0 above the nape -> 1 at the tips
hairFall.alwaysSelectAsActiveMesh = true;                                           // vertices move every frame: keep it from being culled on a stale box
function bendHair(ax, az, tipX, tipZ) {                                             // rotate each vertex about the nape by an angle that grows down the hair (a curve, not a hinge)
  const P = HF.pivot;
  for (let i = 0, n = hairW.length; i < n; i++) { const w = hairW[i], o = i * 3; let x = hairBase[o] - P.x, y = hairBase[o + 1] - P.y, z = hairBase[o + 2] - P.z;
    if (w > 0) { const rx = ax * w + tipX * w * w, rz = az * w + tipZ * w * w, cx = Math.cos(rx), sx = Math.sin(rx), cz = Math.cos(rz), sz = Math.sin(rz);
      const y1 = y * cx - z * sx, z1 = y * sx + z * cx; y = y1; z = z1; const x2 = x * cz - y * sz, y2 = x * sz + y * cz; x = x2; y = y2; }
    hairPos[o] = x + P.x; hairPos[o + 1] = y + P.y; hairPos[o + 2] = z + P.z; }
  hairFall.updateVerticesData(B.VertexBuffer.PositionKind, hairPos); B.VertexData.ComputeNormals(hairPos, hairIdx, hairNrm); hairFall.updateVerticesData(B.VertexBuffer.NormalKind, hairNrm);
}
bendHair(0, 0, 0, 0);
headParts.push(hairFall);
const arm = sd => {
  const sh = node('shoulder' + sd, spine, sd * .162, .355, -.006);
  part('upperArm' + sd, sh, mb => {
    limb(mb, .015, -.27, t => { const r = .0295 + .011 * bump(t, .1, .16) + .0045 * bump(t, .5, .2) + .002 * (1 - t); return [r * (1 + .06 * bump(t, .1, .2)), r * .94, .002 * bump(t, .5, .25)]; }, skinC());   // shoulder cap, slim upper arm
    mb.grid(40, 5, (u, v) => { const a = u * 6.283, r = .045 + .032 * v + .006 * v * Math.sin(a * 7); return [Math.cos(a) * r, .022 - v * .09 + .008 * v * Math.cos(a * 7), Math.sin(a) * r * .95]; }, print);   // flutter sleeve with a soft ruffled hem
  });
  const el = node('elbow' + sd, sh, 0, -.265, 0);
  part('forearm' + sd, el, mb => {
    limb(mb, .005, -.24, t => { const r = .0195 + .0105 * bump(t, .18, .32) + .002 * (1 - t); return [r * (1 + .12 * t), r * (1 - .14 * t), .003 * bump(t, .2, .2)]; }, skinC()); ell(mb, 0, 0, -.002, .029, .03, .029, 14, 10, skinC());   // forearm tapering to a slim, flatter wrist; elbow
    ell(mb, 0, -.268, .006, .021, .036, .03, 12, 10, skinC());                                            // palm
    for (let f = 0; f < 4; f++) { const x = (f - 1.5) * .0115; mb.tube([new V3(x, -.296, .012), new V3(x, -.33 + Math.abs(f - 1.5) * .006, .022), new V3(x, -.353 + Math.abs(f - 1.5) * .01, .03)], [.0068, .0048], 7, () => SKIN, null, true); }   // fingers, gently curled
    mb.tube([new V3(sd * -.016, -.262, .022), new V3(sd * -.028, -.29, .036), new V3(sd * -.03, -.31, .045)], [.0078, .0055], 7, () => SKIN, null, true);   // thumb
    ell(mb, 0, -.236, 0, .025, .006, .025, 12, 4, rgb('#e6c97a'));                                        // a thin gold bangle
  });
  return { sh, el };
};
const leg = sd => {
  const hip = node('hip' + sd, pelvis, sd * .08, -.03, 0);
  part('thigh' + sd, hip, mb => limb(mb, .02, -.415, t => { const r = .045 + .022 * Math.pow(1 - t, 1.15) + .003 * bump(t, .55, .2); return [r, r * .96, .006 * Math.sin(Math.PI * t), sd * -.004 * bump(t, .2, .3)]; }, skinC()));
  const knee = node('knee' + sd, hip, 0, -.41, 0);
  part('shin' + sd, knee, mb => { limb(mb, 0, -.395, t => { const r = .0235 + .016 * bump(t, .3, .22) + .009 * bump(t, .02, .12) + .003 * (1 - t); return [r * (1 - .08 * bump(t, .3, .25)), r * (1 + .1 * bump(t, .3, .25)), -.011 * bump(t, .3, .2), sd * .003 * bump(t, .3, .2)]; }, skinC());   // knee, calf swelling behind, slim ankle
    ell(mb, 0, 0, .006, .044, .044, .044, 14, 10, skinC()); });
  const ankle = node('ankle' + sd, knee, 0, -.395, 0);
  part('foot' + sd, ankle, mb => {
    ell(mb, 0, -.008, .04, .031, .02, .086, 14, 8, skinC());                                              // foot
    ell(mb, 0, -.027, .045, .038, .007, .108, 16, 4, SANDAL);                                            // sandal sole
    for (const zz of [.07, .02]) mb.tube([new V3(-.031, -.022, zz), new V3(0, .006, zz + .01), new V3(.031, -.022, zz)], .0045, 6, () => TRIM);   // two straps
    ell(mb, 0, .004, .072, .006, .006, .006, 6, 5, rgb('#f2d0dc'));                                       // a little flower on the strap
  });
  return { hip, knee, ankle };
};
const L = { arm: arm(-1), leg: leg(-1) }, Rt = { arm: arm(1), leg: leg(1) };
G.avatarLegs = [L.leg, Rt.leg];                                                    // for ?gaittest (dev/debug.js)

/* ---------- the skirt: real cloth, simulated on the CPU (~400 vertices) ----------
   An A-line skirt from the waist to just below the knee. Each frame it is pushed out by the knees, trails behind
   when she moves (a damped spring on her acceleration), and ripples in the wind. */
const SK = { rings: 12, seg: 36, top: .07, hem: -.44, r0: .155, r1: .265 };   // ends just below the knee; a soft A-line, not a bell
const skirt = (() => {
  const mb = new MB(); mb.grid(SK.seg, SK.rings, (u, v) => { const a = u * 6.283, r = SK.r0 + (SK.r1 - SK.r0) * Math.pow(v, .9); return [Math.sin(a) * r, SK.top + (SK.hem - SK.top) * v, Math.cos(a) * r * .88]; },
    (u, v) => v > .93 ? TRIM : print(u, v));
  const m = mb.build('av_skirt', G.vc.clone('skirtMat')); m.material.backFaceCulling = false; m.material.twoSidedLighting = true;   // two-sided cloth: no see-through gap when it folds over a lap
  m.material = m.material; m.parent = pelvis; m.isPickable = false; G.cast(m); meshes.push(m);
  const pos = m.getVerticesData(B.VertexBuffer.PositionKind); m.markVerticesDataAsUpdatable(B.VertexBuffer.PositionKind, true); m.markVerticesDataAsUpdatable(B.VertexBuffer.NormalKind, true);
  return { m, pos: Float32Array.from(pos), idx: m.getIndices(), nrm: [] };
})();
const cloth = { lx: 0, lz: 0, vx: 0, vz: 0, hx: 0, hz: 0, hvx: 0, hvz: 0 };                          // the skirt's lag behind the body (pelvis-local, metres)
function stepSkirt(dt, t, ax, az, speed) {
  // spring-damper: the hem lags behind acceleration and leans back against the air at speed
  const kx = -ax * .012, kz = -az * .012 - speed * speed * .006; cloth.vx += ((kx - cloth.lx) * 60 - cloth.vx * 9) * dt; cloth.vz += ((kz - cloth.lz) * 60 - cloth.vz * 9) * dt; cloth.lx += cloth.vx * dt; cloth.lz += cloth.vz * dt;
  cloth.hvx += ((kx * 1.25 - cloth.hx) * 30 - cloth.hvx * 6.5) * dt; cloth.hvz += ((kz * 1.25 - cloth.hz) * 30 - cloth.hvz * 6.5) * dt; cloth.hx += cloth.hvx * dt; cloth.hz += cloth.hvz * dt;   // the hem is a softer, slower spring: it trails the waist and swings past
  const W = G.windState, cy = Math.cos(A.yaw), sy = Math.sin(A.yaw), wlx = (W.dx * cy - W.dz * sy) * W.gain, wlz = (W.dx * sy + W.dz * cy) * W.gain;   // wind in her frame
  const knees = [L.leg, Rt.leg].map((lg, k) => { const th = lg.hip.rotation.x, sh = lg.knee.rotation.x; return { x: (k ? 1 : -1) * .08, kz: -.41 * Math.sin(th), ky: -.03 - .41 * Math.cos(th), az: -.41 * Math.sin(th) - .395 * Math.sin(th + sh), ay: -.03 - .41 * Math.cos(th) - .395 * Math.cos(th + sh) }; });
  const p = skirt.pos, n1 = SK.seg + 1;
  for (let j = 0; j <= SK.rings; j++) { const v = j / SK.rings, y = SK.top + (SK.hem - SK.top) * v, rb = SK.r0 + (SK.r1 - SK.r0) * Math.pow(v, .9), vv = Math.pow(v, 1.6);
    // how far forward the leg reaches at this height: cloth rests on any part of the leg at or above this ring and falls straight down from it
    // (walking: follows the knee; crouching or sitting: covers the thighs like a lap and hangs from the knees - no bare knees poking through)
    // where the leg is at this ring's height (walking: the cloth follows the leg, front or back) - plus, only for a raised thigh
    // (sitting, crouching), the cloth rests on the thigh and falls from the knee, so the lap is covered
    const legAt = knees.map(k => { let at = 0; const hy = -.03;
      if (y >= Math.min(hy, k.ky)) { const q = Math.abs(k.ky - hy) > .02 ? clamp((y - hy) / (k.ky - hy), 0, 1) : 1; at = k.kz * q; }
      else { const q = Math.abs(k.ay - k.ky) > .02 ? clamp((y - k.ky) / (k.ay - k.ky), 0, 1) : 0; at = k.kz + (k.az - k.kz) * q; }
      const raised = sm(-.3, -.12, k.ky);                                            // 0 standing/walking .. 1 thigh near level
      if (raised > 0 && y <= k.ky + .085 && k.kz > at) at = at + (k.kz - at) * raised;
      return [k.x, at]; });
    // both legs forward (sitting, crouching): the ring slides forward and widens, so the cloth covers the lap and hangs from the knees
    // instead of staying centred on the hips with the thighs sticking out of it. Walking: one leg is always back, so nothing changes.
    const fr = Math.max(0, Math.min(legAt[0][1], legAt[1][1])), czo = fr * .5, rbb = rb;
    for (let i = 0; i <= SK.seg; i++) { const a = i / SK.seg * 6.283, dx = Math.sin(a), dz = Math.cos(a) * .88; let r = rbb;
      for (const [lx, lz0] of legAt) { const lz = lz0 - czo, along = lx * dx + lz * Math.cos(a), dl = Math.hypot(lx, lz) || 1, cosA = along / dl; if (cosA > .5) r = Math.max(r, (along + .09) * ((cosA - .5) / .5) + rbb * (1 - (cosA - .5) / .5)); }   // knees push the cloth out
      const pleat = Math.sin(a * 11 + v * 1.5) * .006 * vv * (1 + .35 * speed) + Math.sin(a * 4 - A.phase * 2) * .007 * vv * vv * Math.min(1, speed), flut = Math.sin(t * 5.3 + a * 3 + v * 2) * .008 * W.gain * vv + Math.sin(t * 3.1 - a * 5) * .004 * speed * vv + pleat;
      const o = (j * n1 + i) * 3; const lx = cloth.lx + (cloth.hx - cloth.lx) * v, lz = cloth.lz + (cloth.hz - cloth.lz) * v; p[o] = dx * (r + flut) + (lx + wlx * .025) * vv; p[o + 1] = y + (Math.abs(lz) + Math.abs(lx)) * .25 * vv + fr * .7 * v + fr * .12 * (1 - v); p[o + 2] = dz * (r + flut) + czo * (1 + Math.cos(a)) + (lz + wlz * .025) * vv; } }   // lap: the front reaches the knees, the back stays at the hips; the hem rises by what the thighs take up
  skirt.m.updateVerticesData(B.VertexBuffer.PositionKind, p); B.VertexData.ComputeNormals(p, skirt.idx, skirt.nrm); skirt.m.updateVerticesData(B.VertexBuffer.NormalKind, skirt.nrm);
}
root.setEnabled(false);

/* ---------- state ---------- */
const A = G.avatar = {
  active: false, view: G.params.get('view') === 'third' ? 'third' : 'first',
  x: 0, y: 0, z: 0, vx: 0, vz: 0, vy: 0, yaw: 0, grounded: true, phase: 0, land: 0, bump: 0, wade: 0, surface: 'grass', speed: 0,
  root, head,
};
const hot = { pos: new V3(), r: 0, kind: 'ikaw' }; G.hot.push(hot);

/* ---------- splashes: one reusable burst of droplets ---------- */
const dropTex = (() => { const t = new B.DynamicTexture('dropTex', { width: 32, height: 32 }, scene, true), g = t.getContext(), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.5, 'rgba(225,240,255,.45)'); gr.addColorStop(1, 'rgba(225,240,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); t.update(); t.hasAlpha = true; return t; })();
const drops = new B.ParticleSystem('splash', 260, scene); drops.particleTexture = dropTex; drops.emitter = new V3(); drops.minEmitBox = new V3(-.08, 0, -.08); drops.maxEmitBox = new V3(.08, .02, .08);
drops.direction1 = new V3(-.9, 1.6, -.9); drops.direction2 = new V3(.9, 2.6, .9); drops.minEmitPower = .5; drops.maxEmitPower = 1.3; drops.gravity = new V3(0, -9.81, 0);
drops.minLifeTime = .3; drops.maxLifeTime = .6; drops.minSize = .02; drops.maxSize = .05; drops.emitRate = 0; drops.color1 = new B.Color4(.92, .96, 1, .85); drops.color2 = new B.Color4(.8, .9, 1, .7); drops.colorDead = new B.Color4(.8, .9, 1, 0); drops.start();
const splashAt = (x, y, z, n) => { drops.emitter.set(x, y, z); drops.manualEmitCount = n; };

/* ---------- the world under your feet ---------- */
const P = G.POND, _w = {};
function waterAt(x, z, t) {                                            // water surface height here, or -Infinity
  if (Math.hypot(x - P.x, z - P.z) < P.r + .3) return -.2;                                       // the lily pond
  if (x < G.shoreX(z) + 2) return G.SEA_Y + G.waveAt(x, z, t, _w).h + .05;                       // the sea and its swash
  return -Infinity;
}
const surfaceAt = (x, z, depth) => depth > .03 ? 'water' : G.path.dist(x, z) < 1.05 ? 'stone' : x < G.shoreX(z) + 6.5 ? 'sand' : 'grass';
function collide(x, z, r) {                                            // slide around solid things; returns the push-out normal (or null)
  let nx = 0, nz = 0, hit = false;
  for (const o of G.obstacles) {
    if (o.box) { const c = Math.cos(o.yaw), s = Math.sin(o.yaw), dx = x - o.x, dz = z - o.z; let lx = dx * c - dz * s, lz = dx * s + dz * c; const bx = o.hw + r, bz = o.hd + r;
      if (Math.abs(lx) < bx && Math.abs(lz) < bz) { const px = x, pz = z; if (bx - Math.abs(lx) < bz - Math.abs(lz)) lx = Math.sign(lx || 1) * bx; else lz = Math.sign(lz || 1) * bz; x = o.x + lx * c + lz * s; z = o.z - lx * s + lz * c; nx += x - px; nz += z - pz; hit = true; } }
    else { const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), m = o.r + r; if (d < m && d > .001) { const px = x, pz = z; x = o.x + dx / d * m; z = o.z + dz / d * m; nx += x - px; nz += z - pz; hit = true; } }
  }
  const rr = Math.hypot(x, z); if (rr > 90) { nx -= x * (1 - 90 / rr); nz -= z * (1 - 90 / rr); x *= 90 / rr; z *= 90 / rr; hit = true; }
  return { x, z, n: hit ? (() => { const l = Math.hypot(nx, nz) || 1; return [nx / l, nz / l]; })() : null };
}

/* ---------- enter / leave ---------- */
A.enter = (x, z, yaw) => { A.x = x; A.z = z; A.y = hFn(x, z); A.vx = A.vz = A.vy = 0; A.yaw = yaw; A.grounded = true; A.active = true; root.setEnabled(true); A.setView(A.view); };
A.exit = () => { A.active = false; root.setEnabled(false); hot.r = 0; G.windState.contact = 0; };
A.procMeshes = meshes;                                                              // the hand-built body; hidden once the glTF body (game/avatar-glb.js) is ready
A.setView = v => { A.view = v; headParts.forEach(m => m.setEnabled(v === 'third' && !A.glb)); if (A.onView) A.onView(v); hot.r = v === 'third' ? .5 : 0; G.windState.playerR = 1.3; };

/* ---------- physics + gait, once per frame while walking ---------- */
let lastStepSin = [0, 0], rustleT = 0, frame = 0; const hairSw = G.physics.pendulum(), hairSwZ = G.physics.pendulum(), trail = [];
const PH = G.physics, EZ = G.ease, sp = PH.spring;
const hairTip = sp(), hairTipZ = sp(), knee = sp(), leanF = sp(), leanS = sp(), lookY = sp(), armS = [sp(), sp()], elbS = [sp(), sp()];   // follow-through springs
const idle = { t: 0, side: 1, shift: 0, from: 0, to: 0, k: 1, glance: 0, gFrom: 0, gTo: 0, gk: 1 };          // eased idle weight shift and glances
let windup = 0, wave = 0, prevYaw = null; const yawS = sp();                                                                  // wave: seconds left of a greeting wave (G)                                                                                            // jump anticipation timer
A.step = (dt, inp, t) => {
  frame++;
  // ---- sitting (L near a seat): walk keys or L again stand you up; while seated you don't move, you sit
  const standUp = st => { st.leaving = true; const out = st.kind === 'hammock' ? .9 : 1.25; A.sitFrom = { x: st.x + Math.sin(st.yaw) * out, z: st.z + Math.cos(st.yaw) * out }; };   // step off clear of the seat
  if (inp.sit) { if (A.seat) { if (!A.seat.leaving) standUp(A.seat); } else { let best = null, bd = 1e9; for (const st of G.seats || []) { const d = Math.hypot(st.x - A.x, st.z - A.z); if (d < st.r && d < bd) { bd = d; best = st; } }
      if (best) { A.seat = best; A.sitFrom = { x: A.x, z: A.z }; best.leaving = false; } } }
  if (A.seat && !A.seat.leaving && (inp.fwd || inp.strafe || inp.jump) && A.sitK > .95) standUp(A.seat);
  if (A.seat) { inp = Object.assign({}, inp, { fwd: 0, strafe: 0, run: false, jump: false, crouch: false }); A.vx = A.vz = 0; }
  const yawC = inp.yaw, pvx = A.vx, pvz = A.vz;
  // ---- where you want to go (relative to the camera), how fast the ground lets you
  let fx = Math.sin(yawC) * inp.fwd + Math.cos(yawC) * inp.strafe, fz = Math.cos(yawC) * inp.fwd - Math.sin(yawC) * inp.strafe; const il = Math.hypot(fx, fz); if (il > 1) { fx /= il; fz /= il; }
  const gy0 = hFn(A.x, A.z), e = .5, gx = (hFn(A.x + e, A.z) - hFn(A.x - e, A.z)) / (2 * e), gz = (hFn(A.x, A.z + e) - hFn(A.x, A.z - e)) / (2 * e);
  const uphill = il > .01 ? (gx * fx + gz * fz) / Math.max(il, 1) : 0, slopeK = uphill > 0 ? 1 / (1 + 1.6 * uphill) : 1 + .15 * Math.min(-uphill, 1);
  const water = waterAt(A.x, A.z, t), depth = Math.max(0, water - gy0); A.wade = clamp(depth / C.maxWade, 0, 1);
  A.crouch = PH.damp(A.crouch || 0, inp.crouch && A.grounded ? 1 : 0, 7, dt); A.slope = PH.damp(A.slope || 0, clamp(uphill, -.6, .6), 5, dt);
  const top = (inp.run && A.crouch < .3 ? C.run : C.walk) * slopeK * (1 - C.wadeSlow * A.wade) * (1 - .55 * A.crouch) * (1 - .22 * Math.min(1, A.brush || 0));   // foliage drags at your legs: you slow as you push through a bed
  const tx = fx * top, tz = fz * top, ctrl = A.grounded ? 1 : C.airControl;
  let dvx = tx - A.vx, dvz = tz - A.vz; const dl = Math.hypot(dvx, dvz), lim = (Math.hypot(tx, tz) > Math.hypot(A.vx, A.vz) ? C.accel : C.decel) * (1 - .5 * A.wade) * ctrl * dt;
  if (dl > lim) { dvx *= lim / dl; dvz *= lim / dl; } A.vx += dvx; A.vz += dvz;
  // ---- move, then resolve contacts: solid things stop you (inelastic), deep water turns you back
  let nx = A.x + A.vx * dt, nz = A.z + A.vz * dt;
  const wNext = waterAt(nx, nz, t); if (wNext - hFn(nx, nz) > C.maxWade * 1.25) { nx = A.x; nz = A.z; A.vx *= .3; A.vz *= .3; }      // too deep to wade
  const c = A.seat ? { x: nx, z: nz, n: null } : collide(nx, nz, C.radius);          // seated: you are on the seat, not pushed off it
  if (c.n) { const vn = A.vx * c.n[0] + A.vz * c.n[1]; if (vn < 0) { A.vx -= vn * c.n[0]; A.vz -= vn * c.n[1]; if (-vn > 1.1 && A.bump <= 0) { sfx().thud(clamp(-vn / 4, .3, 1)); A.bump = .45; } } }
  A.x = c.x; A.z = c.z; A.bump = Math.max(0, A.bump - dt);
  // ---- gravity, jumping, landing
  const gy = hFn(A.x, A.z);
  if (A.grounded && inp.jump && windup <= 0) windup = (C.windup || .14) * (1 - .4 * sm(C.walk, C.run, Math.hypot(A.vx, A.vz)));   // anticipation: dip the knees first
  if (windup > 0 && A.grounded) { windup -= dt; if (windup <= 0) { windup = 0; A.vy = C.jump; A.grounded = false; knee.v -= 9; sfx().jump(); G.poke(A.x, A.z, .3); } }
  if (!A.grounded) { A.vy -= C.gravity * dt; A.y += A.vy * dt; if (A.y <= gy) { const hit = -A.vy; A.y = gy; A.vy = 0; A.grounded = true; A.land = clamp(hit / 4.5, .25, 1); knee.v += 3 + hit * 1.6;
      const w = waterAt(A.x, A.z, t), kind = surfaceAt(A.x, A.z, w - gy); sfx().land(kind); G.poke(A.x, A.z, .45); if (kind === 'water') splashAt(A.x, w, A.z, 70); } }
  else { if (gy < A.y - .35) { A.grounded = false; A.vy = 0; } else A.y = Math.max(gy - .02, PH.damp(A.y, gy, 22, dt)); }               // walk off an edge -> fall
  // the legs are a spring: landing compresses them, they rebound a little past straight and settle (no linear fade)
  const dip = windup > 0 ? EZ.outCubic(1 - windup / ((C.windup || .14))) * .55 : 0;
  PH.stepSpring(knee, dip, 15, .55, dt); A.land = clamp(knee.x, -.12, 1.1);
  // ---- facing: in first person the body turns with your eyes; in third person it turns toward where you walk
  const hv = Math.hypot(A.vx, A.vz); A.speed = hv;
  const want = A.view === 'first' || hv < .25 ? (A.view === 'first' ? yawC : A.yaw) : Math.atan2(A.vx, A.vz);
  let dy = want - A.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); if (A.view === 'first') A.yaw += dy * (1 - Math.exp(-dt * 30)); else { yawS.x = A.yaw; PH.stepSpring(yawS, A.yaw + dy, 7.5, 1, dt); A.yaw = yawS.x; }   // 3rd person: the turn speeds up and slows down (critically damped), never snaps
  // ---- the gait: phase advances with distance travelled (cycle = two steps)
  // feet must not skate: cadence rises with speed (~2.3 steps/s at a walk), the step length is speed / cadence, and the
  // thigh swing is solved from the leg length so the planted foot covers exactly that ground (heel-to-toe roll and the
  // pelvis turn add ~10 cm; when running, part of each step is in the air)
  const LEG = .83 * SCALE, cadence = 1.7 + .32 * hv, stepLen = hv / cadence, runA = sm(C.walk + .3, C.run, hv);
  const amp = Math.asin(clamp((stepLen * (1 - .4 * runA) - .1 * clamp(hv, 0, 1)) / (2 * LEG), 0, .6));
  A.amp = PH.damp(A.amp || 0, amp, 12, dt);
  const yawRate = prevYaw === null ? 0 : Math.abs(Math.atan2(Math.sin(A.yaw - prevYaw), Math.cos(A.yaw - prevYaw))) / Math.max(dt, 1e-3); prevYaw = A.yaw;
  A.turnK = PH.damp(A.turnK || 0, clamp((yawRate - .6) / 2, 0, 1) * (1 - clamp(hv / .6, 0, 1)), 8, dt);     // turning on the spot: shuffle the feet round
  A.amp = Math.max(A.amp, .1 * A.turnK);
  if (A.grounded) A.phase += Math.PI * Math.max(cadence * clamp(hv / .15, 0, 1), 2.4 * A.turnK) * dt;
  A.gm = PH.damp(A.gm || 0, clamp(hv / C.walk, 0, 1), 9, dt); const m = A.gm, runK = sm(C.walk + .3, C.run, hv), wadeLift = A.wade * .5;
  const pose = (lg, am, ph, sd) => {
    const s = Math.sin(ph), cph = Math.cos(ph), air = A.grounded ? 0 : 1;
    const tri = Math.asin(clamp(s, -1, 1)) * .6366, sw = s * .4 + tri * .6;   // mostly a straight sweep: the planted foot moves back at ground speed, it doesn't speed up and slow down mid-step
    const mT = Math.max(m, .5 * A.turnK), thigh = (-A.amp * sw - .06 * runK * m) * (1 - air) - .55 * air - .5 * Math.max(0, A.land), shin = ((.5 + .75 * runK + wadeLift) * Math.pow(Math.max(0, cph), 1.4) * mT + .05) * (1 - air) + .85 * air + 1.0 * Math.max(0, A.land);
    lg.hip.rotation.x = thigh; lg.knee.rotation.x = shin; lg.ankle.rotation.x = -(thigh + shin) * .85 + .25 * Math.max(0, -cph) * Math.max(0, -s) * m;   // sole level, heel lifts at push-off
    lg.hip.rotation.z = sd * .03;
    const ai = sd < 0 ? 0 : 1;                                                         // arms follow the gait through springs: they swing on and settle when you stop
    am.sh.rotation.x = PH.stepSpring(armS[ai], (.75 * A.amp + .25 * runK) * sw * m * (1 - air) - .35 * air + .015 * Math.sin(t * 1.6) * (1 - m) - .3 * Math.max(0, A.land) * (1 - air), 11, .75, dt);   // in step with the legs; damped so it never wobbles
    am.sh.rotation.z = sd * (.16 + .35 * air + .05 * runK + .08 * Math.max(0, A.land) + .06 * A.crouch);   // + = away from the body (clears the hips and skirt)
    am.el.rotation.x = Math.min(0, PH.stepSpring(elbS[ai], -(.28 + .9 * runK) * (.6 + .4 * m) - .25 * air, 10, .8, dt) + .006 * armS[ai].v);   // forearm lags the upper arm
  };
  pose(L.leg, Rt.arm, A.phase, -1); pose(Rt.leg, L.arm, A.phase + Math.PI, 1);          // left leg swings with the right arm
  const s1 = Math.sin(A.phase), breathe = Math.sin(t * 1.7) * (1 - m);
  pelvis.position.y = .86 - .83 * .7 * (1 - Math.cos(A.amp * s1)) * (1 - runK) + .035 * runK * Math.cos(2 * A.phase) * m - .17 * Math.max(0, A.land) - .03 * runK + (A.grounded ? 0 : .05);
  pelvis.position.x = .02 * s1 * m * (1 - runK); pelvis.rotation.y = .09 * s1 * m; pelvis.rotation.z = .055 * s1 * m * (1 - runK); spine.rotation.z = -.045 * s1 * m * (1 - runK); spine.rotation.y = -.14 * s1 * m;
  spine.rotation.x = .03 + .15 * runK * m + .25 * A.land + .012 * breathe + (A.bump > 0 ? -.12 * A.bump : 0);
  // idle: every few seconds she shifts her weight to the other hip and now and then glances around (eased, not linear)
  if (m < .05 && A.grounded) { idle.t += dt; if (idle.k >= 1 && idle.t > 3.5 + 2.5 * Math.abs(Math.sin(t * 7.1))) { idle.t = 0; idle.from = idle.shift; idle.side = -idle.side; idle.to = idle.side; idle.k = 0; }
    if (idle.gk >= 1 && Math.sin(t * .37) > .985) { idle.gFrom = idle.glance; idle.gTo = Math.abs(idle.glance) > .05 ? 0 : (Math.sin(t * 3.3) > 0 ? .45 : -.45); idle.gk = 0; } }
  else { idle.t = 0; if (Math.abs(idle.to) > 0) { idle.from = idle.shift; idle.to = 0; idle.k = 0; } if (Math.abs(idle.gTo) > 0) { idle.gFrom = idle.glance; idle.gTo = 0; idle.gk = 0; } }
  idle.k = Math.min(1, idle.k + dt / 1.2); idle.shift = idle.from + (idle.to - idle.from) * EZ.inOutSine(idle.k);
  idle.gk = Math.min(1, idle.gk + dt / .9); idle.glance = idle.gFrom + (idle.gTo - idle.gFrom) * EZ.inOutQuad(idle.gk);
  const ws = idle.shift * (1 - m);                                                   // contrapposto: one hip drops, that knee softens
  pelvis.rotation.z += .045 * ws; spine.rotation.z -= .05 * ws;
  [L.leg, Rt.leg].forEach((lg, k) => { const soft = Math.max(0, (k ? -1 : 1) * ws); lg.hip.rotation.x -= .07 * soft; lg.knee.rotation.x += .15 * soft; lg.ankle.rotation.x -= .08 * soft; });
  // ---- crouch (hold C): hips sink ~25 cm, thighs fold forward, knees bend, ankles keep the soles flat, the back leans in
  // ---- sit pose: glide to the seat, turn to face out, lower the hips onto it; thighs level, shins hanging, hands in the lap
  { const st = A.seat; A.sitK = st ? Math.min(1, (A.sitK || 0) + dt / (st.leaving ? -.6 : .7)) : 0;
    if (st && st.leaving && A.sitK <= 0) { A.seat = null; A.sitK = 0; if (st.mesh) st.mesh.rotation.z = 0; }
    else if (st) { const k = EZ.inOutSine(clamp(A.sitK, 0, 1)), kp = EZ.inOutSine(clamp(A.sitK * 1.6, 0, 1));
      const fx = st.x - Math.sin(st.yaw) * .02, fz = st.z - Math.cos(st.yaw) * .02;
      A.x = A.sitFrom.x + (fx - A.sitFrom.x) * kp; A.z = A.sitFrom.z + (fz - A.sitFrom.z) * kp;
      let dyw = Math.atan2(Math.sin(st.yaw - A.yaw), Math.cos(st.yaw - A.yaw)); A.yaw += dyw * (1 - Math.exp(-dt * 8));
      let sway = 0; if (st.kind === 'hammock') { st.ph = (st.ph || 0) + dt * 1.9; st.amp = PH.damp(st.amp ?? .14, .07, .25, dt); sway = Math.sin(st.ph) * st.amp * k; if (st.mesh) st.mesh.rotation.z = sway; }
      const gy = hFn(A.x, A.z), seatLocal = (st.y - gy) / SCALE + .09;                            // hips rest on the seat (pelvis local units)
      pelvis.position.y = pelvis.position.y * (1 - k) + seatLocal * k; pelvis.position.x = pelvis.position.x * (1 - k) + sway * (st.y - (st.axisY || st.y)) / SCALE * k; pelvis.rotation.y *= 1 - k; pelvis.rotation.z = pelvis.rotation.z * (1 - k) + sway * .6 * k;
      const lift = st.kind === 'hammock' ? .25 : 0;                                              // in a hammock the knees ride a little higher
      [L.leg, Rt.leg].forEach((lg, i) => { lg.hip.rotation.x = lg.hip.rotation.x * (1 - k) + (-1.5 - lift) * k; lg.knee.rotation.x = lg.knee.rotation.x * (1 - k) + (1.45 + lift * .6) * k; lg.ankle.rotation.x = lg.ankle.rotation.x * (1 - k) + (.05 - lift * .3) * k; lg.hip.rotation.z = (i ? 1 : -1) * .05 * k; });
      [L.arm, Rt.arm].forEach((am, i) => { am.sh.rotation.x = am.sh.rotation.x * (1 - k) - .45 * k; am.sh.rotation.z = am.sh.rotation.z * (1 - k) + (i ? 1 : -1) * .1 * k; am.el.rotation.x = am.el.rotation.x * (1 - k) - .95 * k; });
      spine.rotation.x = spine.rotation.x * (1 - k) + (-.06 + .02 * Math.sin(t * 1.7)) * k; spine.rotation.y *= 1 - k; spine.rotation.z *= 1 - k; } }
  const ck = EZ.inOutSine(A.crouch);
  if (ck > .001) { pelvis.position.y -= .25 * ck; spine.rotation.x += .32 * ck; [L.leg, Rt.leg].forEach(lg => { lg.hip.rotation.x -= .9 * ck; lg.knee.rotation.x += 1.6 * ck; lg.ankle.rotation.x -= .6 * ck; });
    [L.arm, Rt.arm].forEach(am => { am.sh.rotation.x -= .35 * ck; am.el.rotation.x -= .45 * ck; }); }
  spine.rotation.x += .3 * A.slope * m;                                              // lean into a hill, sit back going down
  // ---- wave (G): the right arm rises out to the side, the hand waves three times, then the arm settles (eased in and out)
  if (inp.wave && wave <= 0) wave = 2.2; A.waveT = wave;
  if (wave > 0) { wave = Math.max(0, wave - dt); const k = 2.2 - wave, env = EZ.inOutSine(clamp(k / .35, 0, 1)) * EZ.inOutSine(clamp(wave / .45, 0, 1)), am = Rt.arm;
    const wv = Math.sin(k * 9) * EZ.inOutSine(clamp((k - .3) / .3, 0, 1));              // three side-to-side waves once the arm is up
    am.sh.rotation.z = am.sh.rotation.z * (1 - env) + (2.45 + .2 * wv) * env; am.sh.rotation.x = am.sh.rotation.x * (1 - env) - .25 * env; am.el.rotation.x = am.el.rotation.x * (1 - env) - (.35 + .12 * wv) * env;
    head.rotation.z = .06 * env; }
  head.rotation.x = -spine.rotation.x * .7 + (A.view === 'third' ? inp.pitch * .35 : 0);
  // anticipation: in third person the head turns toward where you are about to go before the body follows
  const lookT = A.view === 'third' ? clamp(dy * .8, -.6, .6) + idle.glance : 0;
  head.rotation.y = -spine.rotation.y * .8 + PH.stepSpring(lookY, lookT, 10, .9, dt);
  // ---- cloth and hair follow the body: skirt (spring + knees + wind), long hair (a pendulum on her head)
  const idt = 1 / Math.max(dt, 1e-3), awx = (A.vx - pvx) * idt, awz = (A.vz - pvz) * idt, cyw = Math.cos(A.yaw), syw = Math.sin(A.yaw);
  const alx = awx * cyw - awz * syw, alz = awx * syw + awz * cyw; if (!A.glb) stepSkirt(dt, t, clamp(alx, -12, 12), clamp(alz, -12, 12), hv);   // the glTF body has its own dress
  const Wd = G.windState, wBack = -(Wd.dx * syw + Wd.dz * cyw) * Wd.gain;
  const tilt = spine.rotation.x + head.rotation.x + leanF.x;                        // how far her head is pitched: the hair keeps hanging down
  const hx = G.physics.stepPendulum(hairSw, 30, clamp(alz, -12, 12) * 1.1 + hv * hv * .8 + wBack * 2 + Math.sin(2 * A.phase) * m * 2.4 - (A.grounded ? 0 : A.vy * 1.6), 4.2, dt);
  const hz = G.physics.stepPendulum(hairSwZ, 30, -clamp(alx, -12, 12) * .9 + Math.sin(A.phase) * m * 1.2, 4.2, dt);
  const htx = PH.stepSpring(hairTip, hx, 14, .45, dt) - hx, htz = PH.stepSpring(hairTipZ, hz, 14, .45, dt) - hz;   // the tips lag the upper hair (follow-through)
  if (!A.glb) bendHair(clamp(hx + tilt * .8, 0, 1.0), clamp(hz, -.35, .35), clamp(htx, -.25, .25), clamp(htz, -.2, .2));
  // ---- footfalls: when each foot strikes the ground, it sounds like what it lands on
  if (A.grounded && hv > .3) for (let k = 0; k < 2; k++) { const sv = Math.sin(A.phase + k * Math.PI); if (lastStepSin[k] < .97 && sv >= .97) {
      const fxp = A.x + Math.sin(A.yaw) * .25 + Math.cos(A.yaw) * (k ? .09 : -.09), fzp = A.z + Math.cos(A.yaw) * .25 - Math.sin(A.yaw) * (k ? .09 : -.09), w = waterAt(fxp, fzp, t), g = hFn(fxp, fzp), kind = surfaceAt(fxp, fzp, w - g);
      A.surface = kind; sfx().step(kind, .7 + .5 * runK); if (kind === 'water') splashAt(fxp, w, fzp, Math.round(14 + 30 * runK)); }
    lastStepSin[k] = sv; }
  // ---- brushing through the garden: plants part (wind shader follows you) and their leaves rustle
  if (frame % 6 === 3) { let kb = 0; for (const p of G.plants) { const dx = p.x - A.x, dz = p.z - A.z, rr = p.r * .7 + .3; if (dx * dx + dz * dz < rr * rr) kb += 1 - Math.hypot(dx, dz) / rr; } A.brushT = clamp(kb, 0, 1.5); }
  A.brush = PH.damp(A.brush || 0, A.brushT || 0, 6, dt);
  rustleT -= dt; if (frame % 6 === 0 && hv > .45 && rustleT <= 0) { let k = 0; for (const p of G.plants) { const d = Math.hypot(p.x - A.x, p.z - A.z); if (d < p.r * .7 + .3) k += 1 - d / (p.r * .7 + .3); }
    if (k > .05) { sfx().rustle(clamp(k, .45, 1.2) * (.7 + .5 * runK)); rustleT = .2 + Math.random() * .15;
      if (hv > 2.2 && Math.random() < .35) { const near = G.plants.find(p => Math.hypot(p.x - A.x, p.z - A.z) < p.r * .7 + .3); if (near) G.petalBurst(new V3(near.x, near.y + near.H * .7, near.z), 5); } } }   // running through flowers knocks a few petals loose
  // ---- place the body
  // balance: the whole body leans into its acceleration (forward when starting, back when braking, into turns); springs give follow-through
  const g = C.gravity, bankT = A.grounded ? clamp(-.55 * Math.atan(clamp(alx, -12, 12) / g), -.16, .16) : 0, pitchT = A.grounded ? clamp(.35 * Math.atan(clamp(alz, -12, 12) / g), -.1, .12) : 0;
  root.position.set(A.x, A.y, A.z); root.rotation.set(PH.stepSpring(leanF, pitchT, 9, .75, dt), A.yaw, PH.stepSpring(leanS, bankT, 9, .75, dt));
  hot.pos.set(A.x, A.y + 1.1, A.z);
  const W = G.windState; W.px = A.x; W.py = A.y + .5; W.pz = A.z; W.playerR = .9 + .5 * m;              // plants bend away from your body, not the camera
  trail.push([t, A.x, A.z]); while (trail.length > 2 && t - trail[1][0] > .85) trail.shift();                   // where you were: plants spring back behind you
  const past = (ago, o) => { const tt = t - ago; let k = trail.length - 1; while (k > 0 && trail[k - 1][0] > tt) k--; const a0 = trail[Math.max(0, k - 1)], a1 = trail[k], f = a1[0] > a0[0] ? clamp((tt - a0[0]) / (a1[0] - a0[0]), 0, 1) : 1;
    W.trail[o] = a0[1] + (a1[1] - a0[1]) * f; W.trail[o + 1] = a0[2] + (a1[2] - a0[2]) * f; };
  W.trail = W.trail || [0, 0, 0, 0, 0, 0]; past(.18, 0); past(.45, 2); past(.8, 4);
  W.contact = 1; W.tx = W.trail[0]; W.tz = W.trail[1]; W.trailK = clamp(Math.hypot(W.trail[4] - A.x, W.trail[5] - A.z) * 1.5, 0, 1); W.bodyR = .58 * SCALE;
};

/* ---------- the camera ---------- */
const _eye = new V3(), _tgt = new V3(), _cam = new V3();
A.placeCamera = (dt, yaw, pitch) => {
  if (A.view === 'first') {
    head.computeWorldMatrix(true); V3.TransformCoordinatesFromFloatsToRef(0, .115, .07, head.getWorldMatrix(), _eye);     // between the eyes
    camera.position.copyFrom(_eye); camera.rotation.set(pitch, yaw, 0);
  } else {
    const T = C.third, p = clamp(pitch, -.55, 1.0); _tgt.set(A.x, A.y + 1.45, A.z);
    if (G.params.has('face')) { const d = parseFloat(G.params.get('face')) || 1.1, a = A.yaw + (G.params.has('facea') ? parseFloat(G.params.get('facea')) : .35); camera.position.set(A.x + Math.sin(a) * d, A.y + 1.5, A.z + Math.cos(a) * d); camera.setTarget(new V3(A.x, A.y + 1.38 - d * .12, A.z)); return; }   // dev: look at her from the front
    _cam.set(_tgt.x - Math.sin(yaw) * Math.cos(p) * T.dist, _tgt.y + Math.sin(p) * T.dist + T.height, _tgt.z - Math.cos(yaw) * Math.cos(p) * T.dist);
    _cam.y = Math.max(_cam.y, hFn(_cam.x, _cam.z) + .35);                                              // never under the ground
    const k = 1 - Math.exp(-dt * T.lag); camera.position.x += (_cam.x - camera.position.x) * k; camera.position.y += (_cam.y - camera.position.y) * k; camera.position.z += (_cam.z - camera.position.z) * k;
    camera.setTarget(_tgt);
  }
};
})();
