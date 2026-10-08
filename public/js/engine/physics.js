/* =====================================================================
   engine/physics.js - tiny, cheap physics for things that hang and swing
   No rigid-body engine is needed for this garden: hanging lanterns, fiesta flags and
   such are damped pendulums driven by wind drag, integrated a few times per frame.

     st = G.physics.pendulum()                       -> { a: angle (rad), v: angular velocity }
     G.physics.stepPendulum(st, k, drive, c, dt)     k = g / L (gravity restoring), drive = wind
                                                     angular accel, c = damping (1/s)
     G.physics.gusty(t, ph)                          per-object turbulence factor (~0.6 .. 1.4)
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
  gusty: (t, ph) => 1 + .28 * Math.sin(t * 2.3 + ph) + .14 * Math.sin(t * 5.7 + ph * 1.7) + .06 * Math.sin(t * 11.3 + ph * 2.9),
};
})();
