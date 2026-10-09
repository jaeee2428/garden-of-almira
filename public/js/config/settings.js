/* =====================================================================
   config/settings.js - every tunable number in one place
   Loaded before the engine; has no dependencies. engine.js exposes it as G.CONFIG.
   Change looks/feel here, not inside the modules.
   ===================================================================== */
window.GARDEN_CONFIG = {
  render: {
    maxPixelRatio: 1.75,                // never render more than 1.75x device pixels (1.5 looked soft on retina screens)
    msaa: 4,                            // multisample anti-aliasing (geometry edges)
    fxaa: false,                        // FXAA smeared the whole picture (that was the blur); MSAA x4 handles the edges
    bloom: { threshold: .92, weight: .14, kernel: 32, scale: .4 },     // gentle: only real lights glow
    contrast: 1.04, exposure: 1, vignette: 1.0,
    shadows: { size: 2048, cascades: 3, lambda: .88, blend: .14, maxZ: 100, bias: .0035, normalBias: .022, darkness: .52 },
  },

  // Each wind material is one stiffness class (see engine/wind.js for the bend model):
  //   flex    : bend per unit wind; the offset grows with height^2 (a cantilever stem). Lower = stiffer.
  //   hz      : natural sway frequency (rad/s): stiff/tall things sway slowly, grass quickly
  //   maxBend : cap on sideways offset / height (.5 = about 30 degrees)
  //   flutter : small leaf tremble at the tips (metres)        hang: hangs below its attachment point
  //   fade    : [start, end] m - LOD fade just before the chunk/plant cull distance: hides the pop, removes nothing (thin-instanced meshes only)
  // Rough targets: a 1 m shrub tip moves ~3 cm in the breeze, ~15 cm in a gust; a palm crown ~0.3 m / ~1 m.
  wind: {
    materials: {
      shrub:  { flex: .05,  hz: 2.4, maxBend: .35, flutter: .01, fade: [78, 98] },  grass: { flex: .6, hz: 5.5, maxBend: .5, flutter: 0, fade: [62, 90] },
      wild:   { flex: .7,   hz: 4.5, maxBend: .45, flutter: .003, fade: [52, 78] }, palm:  { flex: .0032, hz: 1.0, maxBend: .22, flutter: .018 },
      banana: { flex: .02,  hz: 1.6, maxBend: .3, flutter: .03 },   tree:  { flex: .004, hz: .9, maxBend: .2, flutter: .018 },
      vine:   { flex: .04,  hz: 2.2, maxBend: .35, flutter: .02 },  hang:  { flex: .05, hz: 3.0, maxBend: .45, flutter: .02, hang: true },
      // wild plants (flora/wild-plants.js)
      low:    { flex: .8,   hz: 5.0, maxBend: .45, flutter: .004, fade: [44, 66] }, cosmos: { flex: .2, hz: 3.5, maxBend: .45, flutter: .012, fade: [52, 76] },
      cogon:  { flex: .2,   hz: 3.0, maxBend: .5, flutter: .012, fade: [92, 122] },  tall:  { flex: .06, hz: 2.2, maxBend: .4, flutter: .02 },
      fern:   { flex: .3,   hz: 2.5, maxBend: .4, flutter: .025, fade: [48, 70] },  pandan: { flex: .04, hz: 2.0, maxBend: .3, flutter: .02 },
      glory:  { flex: .2,   hz: 3.0, maxBend: .4, flutter: .02, fade: [44, 66] },
    },
    breeze: { base: .5, slow: .2, fast: .12, landBreeze: true },   // onshore sea breeze by day; turns offshore (and 35% weaker) at night
    gust: { every: [14, 36], len: [6, 11], amp: [.35, .85] },   // gusts swell and fade (sin^2), never snap
  },

  // The sea (world/sea.js). swells: [dirX, dirZ, wavelength m, amplitude m] - +x is toward the land.
  //   breakAt: where waves break (m from the shoreline, negative = seaward); shoal: how much they grow before breaking;
  //   swash: how high (m) the water sheet runs up the beach per swell
  sea: { swells: [[1, .15, 26, .30], [.95, -.35, 13, .15], [.7, .7, 7.5, .075], [1, -.1, 3.8, .04]], breakAt: -9, shoal: .35, swash: .16 },

  // Sound mix (audio/soundscape.js): ambience = sea, wind, leaves; animals = birds, hens, frogs; effects = your steps, splashes, rustling
  audio: { ambience: .45, animals: .7, effects: 1.6 },

  // The avatar (game/avatar.js): a ~1.60 m young woman in a sundress. Speeds in m/s (a real walk is ~1.4, a jog ~3, a run ~5).
  avatar: {
    walk: 1.9, run: 4.6, accel: 9, decel: 12, airControl: .25, jump: 3.4, windup: .14, gravity: 9.81, radius: .3,
    eye: 1.5, third: { dist: 2.9, height: .3, lag: 10 }, wadeSlow: .6, maxWade: .8,
    skin: '#c4916c', hair: '#17100d', dress: '#ee9c8a', trim: '#fbf6ee', sandal: '#c39466', lips: '#c2676d',   // morena skin, black hair, blush-coral sundress
  },

  // Level of detail: how far each detail level reaches (metres), what is culled.
  lodTiers: [
    { name: 'Low',    d0: 0,  d1: 15, cull: 42, grass: 34, shadow: false, bloom: false, scale: 1.5 },
    { name: 'Medium', d0: 8,  d1: 24, cull: 62, grass: 48, shadow: true,  bloom: true,  scale: 1.25 },
    { name: 'High',   d0: 11, d1: 26, cull: 84, grass: 58, shadow: true,  bloom: true,  scale: 1 },
  ],

  // Time of day keyframes (fogD = exponential-squared fog density: ~7% haze at 40 m, ~38% at 100 m by day)
  //   0 = buntag, .2 = udto, .45 = hapon, .7 = kilumkilom, 1 = gabii
  timeNames: [[0, 'Buntag'], [.2, 'Udto'], [.45, 'Hapon'], [.7, 'Kilumkilom'], [1, 'Gabii']],
  timeKeys: [
    [0,   { zen: '#3a7fd0', hor: '#ffd9b0', grd: '#9bb09a', sunEl: 24, sunAz: 12, sunCol: '#ffe2b8', sunI: 1.75, hemiD: '#b8cff0', hemiG: '#6f8a52', hemiI: .92, fog: '#e9dccb', fogD: .007, cloud: '#fff2e6', cloudK: .85, moonI: 0, exp: 1.0, night: 0, deep: '#0f7aa0', shal: '#43c0b4' }],
    [.2,  { zen: '#2b78cf', hor: '#a9d3ef', grd: '#8fae96', sunEl: 64, sunAz: 100, sunCol: '#fff1d4', sunI: 1.9, hemiD: '#b4cdf0', hemiG: '#6e8450', hemiI: .88, fog: '#b9d6ea', fogD: .006, cloud: '#ffffff', cloudK: .9, moonI: 0, exp: 1.0, night: 0, deep: '#0f6f93', shal: '#2fb7b0' }],
    [.45, { zen: '#27498a', hor: '#ff9a55', grd: '#7a5b45', sunEl: 13, sunAz: 188, sunCol: '#ffb15c', sunI: 2.0, hemiD: '#98a6cc', hemiG: '#6a7a42', hemiI: .88, fog: '#e6a273', fogD: .0078, cloud: '#ff9e72', cloudK: 1.0, moonI: 0, exp: 1.0, night: 0, deep: '#124a6e', shal: '#3fa59c' }],
    [.7,  { zen: '#25306e', hor: '#e0617f', grd: '#4a3a4c', sunEl: -1, sunAz: 192, sunCol: '#ff6a4a', sunI: .5,  hemiD: '#6a6aa8', hemiG: '#3a3a48', hemiI: .58, fog: '#a8587a', fogD: .0092, cloud: '#ff7a8a', cloudK: 1.0, moonI: .25, exp: 1.1, night: .45, deep: '#14274f', shal: '#2d5a78' }],
    [1,   { zen: '#040919', hor: '#17284c', grd: '#0d131c', sunEl: -14, sunAz: 195, sunCol: '#ff7a40', sunI: 0,  hemiD: '#3b4c8a', hemiG: '#1a2438', hemiI: .5,  fog: '#0f1a30', fogD: .0102, cloud: '#27325a', cloudK: .55, moonI: .8, exp: 1.3, night: 1, deep: '#050d20', shal: '#0d2038' }],
  ],
};
