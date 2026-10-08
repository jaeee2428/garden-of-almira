/* =====================================================================
   fx/particles.js - garden-wide particles: fireflies, drifting ilang-ilang petals,
   and the petal shower used when you pick a flower or fill the bayong
   ===================================================================== */
(() => {
const { B, V3, C3, scene, hFn } = G;
const T = G.L.tree;
/* ---------- alitaptap: fireflies over the whole garden (more near you: fauna/night-glow.js) ---------- */
G.butterflies = []; G.hens = [];
(function fireflies() {
  const tex = new B.DynamicTexture('flyTex', { width: 64, height: 64 }, scene, true), g = tex.getContext(), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,248,180,1)'); gr.addColorStop(.25, 'rgba(255,225,110,.55)'); gr.addColorStop(1, 'rgba(255,200,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); tex.update(); tex.hasAlpha = true;
  const ps = new B.ParticleSystem('alitaptap', 1300, scene); ps.particleTexture = tex; ps.emitter = new V3(-4, 1.6, 2); ps.minEmitBox = new V3(-46, -.6, -36); ps.maxEmitBox = new V3(46, 3.4, 36);
  ps.direction1 = new V3(-.4, -.1, -.4); ps.direction2 = new V3(.4, .35, .4); ps.minEmitPower = .1; ps.maxEmitPower = .45; ps.minLifeTime = 5; ps.maxLifeTime = 11; ps.emitRate = 0; ps.minSize = .05; ps.maxSize = .14; ps.blendMode = B.ParticleSystem.BLENDMODE_ADD;
  ps.addColorGradient(0, new B.Color4(1, .9, .4, 0)); ps.addColorGradient(.28, new B.Color4(1, .95, .5, .9)); ps.addColorGradient(.72, new B.Color4(1, .92, .45, .8)); ps.addColorGradient(1, new B.Color4(1, .85, .4, 0));
  ps.start(); G.fireflies = ps; G.onTime.push(S => { ps.emitRate = 230 * Math.pow(S.night, 1.2); });          // fireflies only after dark
})();
// drifting blossom petals from the ilang-ilang and a shower for celebrations
G.petalBurst = (pos, n = 120) => {
  const tex = G.petalTex || (G.petalTex = (() => { const t = new B.DynamicTexture('petalTex', { width: 64, height: 64 }, scene, true), g = t.getContext(); g.translate(32, 32); g.rotate(-.6); const gr = g.createRadialGradient(0, 0, 2, 0, 0, 26); gr.addColorStop(0, '#fff3ec'); gr.addColorStop(1, '#f06a9a'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 25, 13, 0, 0, 6.283); g.fill(); t.update(); t.hasAlpha = true; return t; })());
  const ps = new B.ParticleSystem('burst', n, scene); ps.particleTexture = tex; ps.emitter = pos.clone(); ps.minEmitBox = new V3(-.3, 0, -.3); ps.maxEmitBox = new V3(.3, .3, .3); ps.direction1 = new V3(-2.5, 4, -2.5); ps.direction2 = new V3(2.5, 6, 2.5); ps.minEmitPower = 1; ps.maxEmitPower = 3; ps.gravity = new V3(.4, -2.2, 0); ps.minLifeTime = 3; ps.maxLifeTime = 6; ps.manualEmitCount = n; ps.minSize = .1; ps.maxSize = .26; ps.minAngularSpeed = -4; ps.maxAngularSpeed = 4; ps.targetStopDuration = 7; ps.disposeOnStop = true; ps.color1 = new B.Color4(1, .85, .9, 1); ps.color2 = new B.Color4(1, .45, .6, 1); ps.colorDead = new B.Color4(1, .7, .8, 0); ps.start();
};
(function drift() {
  const t = G.petalBurst; G.petalTex = null; t(new V3(T.x, hFn(T.x, T.z) + 9, T.z), 1); const tex = G.petalTex;
  const ps = new B.ParticleSystem('drift', 200, scene); ps.particleTexture = tex; ps.emitter = new V3(T.x, hFn(T.x, T.z) + 7.5, T.z); ps.minEmitBox = new V3(-3.5, -1, -3.5); ps.maxEmitBox = new V3(3.5, 1, 3.5);
  ps.direction1 = new V3(-.3, -1, -.3); ps.direction2 = new V3(.5, -.6, .5); ps.minEmitPower = .2; ps.maxEmitPower = .6; ps.gravity = new V3(.3, -.28, .1); ps.minLifeTime = 10; ps.maxLifeTime = 18; ps.emitRate = 7; ps.minSize = .07; ps.maxSize = .15; ps.minAngularSpeed = -2; ps.maxAngularSpeed = 2;
  ps.color1 = new B.Color4(1, .96, .6, 1); ps.color2 = new B.Color4(.9, .9, .3, 1); ps.colorDead = new B.Color4(1, .95, .6, 0); ps.preWarmCycles = 120; ps.preWarmStepOffset = 5; ps.start(); G.driftPS = ps;
})();
})();
