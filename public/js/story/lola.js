/* =====================================================================
   story/lola.js - Lola Almira, a PLACEHOLDER figure for the story prototype (?story=1)
   Seated on the papag under the ilang-ilang, threading sampaguita in her lap.
   Jointed with TransformNodes (hips > torso > head, shoulders > forearms) and animated with
   springs / easing from engine/physics.js: breathing, threading hands, a head that turns toward
   Ikaw's voice (a little off, as she can't see), nods and a hand gesture while she talks.
   ===================================================================== */
(() => {
const { B, V3, MB, scene, hFn } = G, PH = G.physics, E = G.ease;
const seat = (G.seats || []).find(s => s.kind === 'bench'); if (!seat) { console.warn('[lola] no papag seat'); return; }

const SKIN = [.74, .55, .42], HAIR = [.9, .89, .86], BLOUSE = [.93, .9, .82], SHAWL = [.42, .5, .4], SKIRT = [.46, .16, .2], SOLE = [.3, .2, .14], DARK = [.14, .11, .09];
const plaid = (u, v) => { const k = (Math.floor(u * 18) + Math.floor(v * 8)) % 2 ? 1 : .82; return [SKIRT[0] * k, SKIRT[1] * k, SKIRT[2] * k]; };
const col = c => () => c;

// root on the left half of the papag, facing the same way as the bench
const yaw = seat.yaw, c = Math.cos(yaw), s = Math.sin(yaw), lx = -.62;
const root = new B.TransformNode('lola', scene);
root.position.set(seat.x + lx * c - .06 * s, seat.y - .02, seat.z - lx * s - .06 * c); root.rotation.y = yaw;
const node = (name, parent, x, y, z) => { const n = new B.TransformNode(name, scene); n.parent = parent; n.position.set(x, y, z); return n; };
const part = (name, parent, fill) => { const mb = new MB(); fill(mb); const m = mb.build(name); m.parent = parent; G.cast && G.cast(m); return m; };
const tube = (mb, a, b, r, cf, sides = 9) => mb.tube([new V3(...a), new V3(...b)], Array.isArray(r) ? r : [r, r], sides, cf);

// lap, legs, skirt (static, on the root)
part('lolaLegs', root, mb => {
  mb.ellipsoid(0, .09, -.02, .19, .12, .16, 14, 10, plaid);                              // hips
  mb.ellipsoid(0, .09, .19, .19, .085, .25, 14, 8, plaid);                               // lap (skirt over the thighs)
  mb.grid(14, 8, (u, v) => { const a = (u - .5) * 2.4, r = .2 + v * .035; return [Math.sin(a) * r, .06 - v * .4, .4 + Math.cos(a) * r * .32 - .03 + Math.sin(u * 18) * .006 * v]; }, (u, v) => plaid(u, v * .5));   // skirt draping over the knees, folds toward the hem
  for (const sx of [-1, 1]) {
    tube(mb, [sx * .1, -.33, .45], [sx * .1, -.5, .47], [.042, .036], col(SKIN));     // shins below the hem
    mb.ellipsoid(sx * .1, -.515, .52, .045, .022, .085, 10, 6, col(SOLE));              // tsinelas
    mb.ellipsoid(sx * .1, -.5, .52, .038, .02, .07, 10, 6, col(SKIN));
  }
});
// torso (breathes, leans when she talks)
const torso = node('lolaTorso', root, 0, .15, -.03); torso.rotation.x = .14;
part('lolaChest', torso, mb => {
  mb.ellipsoid(0, .19, 0, .165, .22, .12, 16, 12, col(BLOUSE));                         // kimona blouse
  mb.ellipsoid(0, .36, -.005, .205, .075, .135, 16, 8, col(SHAWL));                     // panyo over the shoulders
  mb.grid(8, 4, (u, v) => [(-.12 + u * .24) * (1 - v * .5), .34 - v * .16, .105 + Math.sin(u * 3.14) * .02], col(SHAWL));   // its knot falling on the chest
  tube(mb, [0, .4, .0], [0, .5, .015], [.047, .042], col(SKIN));                          // neck
});
// head (turns toward Ikaw's voice, nods while talking)
const neck = node('lolaNeck', torso, 0, .49, .015);
const head = node('lolaHead', neck, 0, 0, 0);
part('lolaFace', head, mb => {
  mb.ellipsoid(0, .1, .005, .084, .104, .094, 16, 12, col(SKIN));
  mb.ellipsoid(0, .135, -.026, .091, .094, .094, 16, 10, col(HAIR));                    // white hair, pulled back
  mb.ellipsoid(0, .165, -.105, .046, .042, .042, 10, 8, col(HAIR));                     // bun
  mb.ellipsoid(0, .087, .094, .014, .02, .016, 8, 6, col([SKIN[0] * .94, SKIN[1] * .9, SKIN[2] * .88]));   // nose
  for (const sx of [-1, 1]) {
    mb.ellipsoid(sx * .033, .108, .082, .011, .008, .006, 8, 6, col([.74, .74, .77]));  // clouded eyes
    const ring = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * 6.283; ring.push(new V3(sx * .034 + Math.cos(a) * .022, .108 + Math.sin(a) * .019, .092)); }
    mb.tube(ring, [.0028, .0028], 5, col(DARK));                                        // glasses
    tube(mb, [sx * .056, .108, .09], [sx * .085, .11, .02], .0025, col(DARK), 5);       // temples
  }
  tube(mb, [-.012, .108, .093], [.012, .108, .093], .0025, col(DARK), 5);
  mb.tube([new V3(-.02, .055, .088), new V3(0, .052, .092), new V3(.02, .055, .088)], [.0035, .0035], 5, col([.45, .22, .2]));   // mouth
});
// arms: shoulder -> forearm -> hand, holding a garland in the lap
const arms = [-1, 1].map(sx => {
  const sh = node('lolaSh' + sx, torso, sx * .175, .35, 0);
  part('lolaUA' + sx, sh, mb => tube(mb, [0, 0, 0], [sx * .03, -.23, .08], [.048, .04], col(BLOUSE)));
  const el = node('lolaEl' + sx, sh, sx * .03, -.23, .08);
  part('lolaFA' + sx, el, mb => { tube(mb, [0, 0, 0], [-sx * .07, -.05, .2], [.036, .03], col(SKIN)); mb.ellipsoid(-sx * .075, -.055, .225, .035, .022, .045, 10, 6, col(SKIN)); });
  return { sx, sh, el, lift: PH.spring(0) };
});
part('lolaGarland', root, mb => {                                                         // sampaguita on a thread in her lap
  for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283; mb.ellipsoid(Math.cos(a) * .085, .16 + Math.sin(a * 2) * .006, .27 + Math.sin(a) * .05, .014, .012, .014, 6, 5, col([.97, .96, .9])); }
});

// clickable: hover says "Lola Almira", clicking talks to her (handled by story.js)
const hot = { pos: new V3(), r: .7, kind: 'lola' }; G.hot.push(hot);

/* ---------- animation ---------- */
const look = PH.spring(0), tilt = PH.spring(0), nod = PH.spring(0), lean = PH.spring(.14);
const L = G.lola = { root, head, talking: 0, hot, pos: () => root.position, gesture: 0 };
const _hp = new V3();
let thread = 0, pause = 0, glance = 0, glanceT = 3;
G.systems.add('lola', (t, dt) => {
  const A = G.avatar, cam = scene.activeCamera, px = A && A.active ? A.x : cam.position.x, pz = A && A.active ? A.z : cam.position.z;
  const dx = px - root.position.x, dz = pz - root.position.z, dist = Math.hypot(dx, dz);
  // where her voice-sense says Ikaw is (local yaw), a little off because she can't see
  let want = 0;
  if (dist < 8) { want = Math.atan2(dx, dz) - yaw; want = Math.atan2(Math.sin(want), Math.cos(want)); want = G.clamp(want + .14, -1.0, 1.0) * G.smooth(8, 3, dist); }
  else { glanceT -= dt; if (glanceT < 0) { glance = G.R(-.5, .5); glanceT = G.R(3, 7); } want = glance * .6; }      // listening around the garden
  PH.stepSpring(look, want, 5.5, .78, dt);                                                // head leads, slight overshoot
  PH.stepSpring(tilt, dist < 8 ? .12 : 0, 3, 1, dt);                                       // tilts her ear toward you
  const talk = L.talking = PH.damp(L.talking, G.lolaTalk ? 1 : 0, 6, dt);
  PH.stepSpring(nod, talk * Math.sin(t * 3.1) * .05 + talk * .03, 14, .55, dt);
  PH.stepSpring(lean, .14 - talk * .06 + (dist < 3 ? -.03 : 0), 4, .9, dt);               // sits up a little when she talks to you
  const br = E.inOutSine((Math.sin(t * 1.6) + 1) / 2);                                     // ~4 s breath
  torso.rotation.x = lean.x + br * .018; neck.rotation.x = -lean.x * .55 - br * .01 + nod.x;
  neck.rotation.y = look.x * .35; head.rotation.y = look.x * .65; head.rotation.z = tilt.x * Math.sign(look.x || 1);
  // threading by touch: hands work in turns, with small rests
  pause -= dt; if (pause < 0 && Math.random() < dt * .25) pause = G.R(1.2, 2.6);
  const work = pause > 0 ? 0 : 1; thread += dt * 2.3 * work;
  for (const a of arms) {
    const ph = thread + (a.sx > 0 ? Math.PI : 0), pull = E.inOutQuad((Math.sin(ph) + 1) / 2) * work;
    const gest = a.sx > 0 ? talk * (.5 + .5 * Math.sin(t * 1.3)) : 0;                       // her right hand lifts a little as she speaks
    PH.stepSpring(a.lift, gest, 7, .7, dt);
    a.sh.rotation.x = -.05 - pull * .08 - a.lift.x * .35; a.el.rotation.x = -pull * .12 - a.lift.x * .5; a.el.rotation.y = a.sx * pull * .06;
  }
  head.computeWorldMatrix(true); _hp.copyFrom(head.getAbsolutePosition()); hot.pos.set(_hp.x, _hp.y - .25, _hp.z);
}, { order: 61 });
})();
