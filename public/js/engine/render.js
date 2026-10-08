/* =====================================================================
   engine/render.js - lights, camera, cascaded shadows, post-processing, fog mode
   
   ===================================================================== */
(() => {
const { B, V3, C3, M4, scene, canvas } = G;
/* ---------- lights, shadows, camera, post-processing ---------- */
const hemi = new B.HemisphericLight('hemi', V3.Up(), scene); hemi.specular = C3.Black();
const sunLight = new B.DirectionalLight('sun', new V3(1, -.3, .2), scene); sunLight.specular = new C3(.4, .35, .3);
const moonLight = new B.DirectionalLight('moon', new V3(-.6, -.7, -.4), scene); moonLight.specular = C3.Black();
Object.assign(G, { hemi, sunLight, moonLight });
let sg = null; G.casters = G.casters || [];
G.cast = m => { if (!m) return; G.casters.push(m); if (sg) sg.addShadowCaster(m, true); };
const camera = new B.FreeCamera('cam', new V3(-36, 3, 0), scene); camera.fov = .95; camera.minZ = .12; camera.maxZ = 1500; camera.inertia = 0; G.camera = camera;
// Sun shadows: cascaded (sharp near you, softer far away) and STABILIZED so they never swim or flicker as you move.
const RC = G.CONFIG.render, SC = RC.shadows;
(function makeShadows() {
  try {
    if (G.params.has('nocsm')) throw new Error('classic');
    sg = new B.CascadedShadowGenerator(SC.size, sunLight); sg.numCascades = SC.cascades; sg.lambda = SC.lambda; sg.cascadeBlendPercentage = SC.blend; sg.stabilizeCascades = true; sg.shadowMaxZ = SC.maxZ; sg.depthClamp = true; sg.autoCalcDepthBounds = false;
    sg.usePercentageCloserFiltering = true; sg.filteringQuality = B.ShadowGenerator.QUALITY_MEDIUM; sg.bias = SC.bias; sg.normalBias = SC.normalBias; sg.setDarkness(SC.darkness);
  } catch (err) {
    sg = new B.ShadowGenerator(2048, sunLight); sg.usePercentageCloserFiltering = true; sg.filteringQuality = B.ShadowGenerator.QUALITY_MEDIUM; sg.bias = .0006; sg.normalBias = .03; sg.setDarkness(.42); sunLight.autoUpdateExtends = true; sunLight.autoCalcShadowZBounds = true;
  }
  G.sg = sg; G.casters.forEach(m => sg.addShadowCaster(m, true));
})();
const pipe = new B.DefaultRenderingPipeline('pipe', true, scene, [camera]);
pipe.samples = G.params.has('nomsaa') ? 1 : RC.msaa; pipe.fxaaEnabled = RC.fxaa || G.params.has('nomsaa'); pipe.bloomEnabled = true; pipe.bloomThreshold = RC.bloom.threshold; pipe.bloomWeight = RC.bloom.weight; pipe.bloomKernel = RC.bloom.kernel; pipe.bloomScale = RC.bloom.scale;
pipe.imageProcessingEnabled = true; const ip = pipe.imageProcessing; ip.toneMappingEnabled = true; ip.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES; ip.contrast = RC.contrast; ip.exposure = RC.exposure;
ip.vignetteEnabled = true; ip.vignetteWeight = RC.vignette; ip.vignetteColor = new B.Color4(.04, .03, .02, 0);
pipe.grainEnabled = false;                                    // animated film grain made everything look like it was flickering
G.pipe = pipe;
scene.fogMode = B.Scene.FOGMODE_EXP2;
})();
