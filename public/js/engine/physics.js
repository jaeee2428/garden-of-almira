/* =====================================================================
   engine/physics.js - tiny, cheap physics for things that hang and swing
   No rigid-body engine is needed for this garden: hanging lanterns, fiesta flags and
   such are damped pendulums driven by wind drag, integrated a few times per frame.

     st = G.physics.pendulum()                       -> { a: angle (rad), v: angular velocity }
     G.physics.stepPendulum(st, k, drive, c, dt)     k = g / L (gravity restoring), drive = wind
                                                     angular accel, c = damping (1/s)
     G.physics.gusty(t, ph)                          per-object turbulence factor (~0.6 .. 1.4)
     st = G.physics.spring(x0)                       -> { x, v } a damped spring (animation follow-through)
     G.physics.stepSpring(st, target, w, z, dt)      w = natural frequency (rad/s), z = damping ratio
                                                     (z < 1 overshoots then settles, z = 1 critical: no overshoot)
     G.physics.damp(cur, target, rate, dt)           frame-rate independent exponential smoothing
     G.ease.outCubic / inOutQuad / inOutSine / outBack   easing curves for 0..1 (never linear for organic motion)
   ===================================================================== */
(() => {
const H = 1 / 90;                                                     // max sub-step: stable for k up to ~400
G.physics = {
  GRAVITY: 9.81,
  pendulum: (a = 0) => ({ a, v: 0 }),
  stepPendulum(st, k, drive, c, dt) {
    const n = Math.max(1, Math.ceil(dt / H)), h = dt / n;
    for (let i = 0; i < n; i++) { st.v += (drive * Math.cos(st.a) - k * Math.sin(st.a) - c * st.v) * h; st.a += st.v * h; }   // semi-implicit Euler
    return st.a;
  },
  spring: (x = 0) => ({ x, v: 0 }),
  stepSpring(st, target, w, z, dt) {
    const n = Math.max(1, Math.ceil(dt / H)), h = dt / n;
    for (let i = 0; i < n; i++) { st.v += (w * w * (target - st.x) - 2 * z * w * st.v) * h; st.x += st.v * h; }
    return st.x;
  },
  damp: (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt)),
  gusty: (t, ph) => 1 + .28 * Math.sin(t * 2.3 + ph) + .14 * Math.sin(t * 5.7 + ph * 1.7) + .06 * Math.sin(t * 11.3 + ph * 2.9),
};
G.ease = {
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutQuad: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t, k = 1.4) => 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2),
};
})();
