# Architecture — The Garden of Almira

Babylon.js 9.29 (local copy in `public/vendor/`), plain browser JavaScript, no build step.
`python3 server.py` serves `public/` at http://localhost:8765.

## Folder layout

```
public/
  index.html              markup only (HUD panels, card, bayong, bar)
  css/garden.css          all page/HUD styles
  vendor/babylon.js       the engine (never edit)
  js/
    boot.js               THE load order: one manifest, modules execute in sequence
    config/settings.js    every tunable number: render, wind stiffness, LOD tiers, time-of-day keys
    engine/               no garden content: core services every module uses
      engine.js           namespace G, Babylon engine + scene, math/colour helpers, base material
      systems.js          per-frame system registry (create / read / update / delete)
      wind.js             GPU wind (MaterialPluginBase) + one wind material per stiffness class
      physics.js          damped pendulums for hanging / swinging things
      mesh-builder.js     MB: procedural tubes, grids, ellipsoids; placement matrices
      render.js           lights, camera, cascaded shadows, post-processing (MSAA + FXAA, bloom, ACES)
      time-of-day.js      G.applyTime(u): blends the keyframes from config
    data/                 content only (no Babylon code)
      flowers.js          the 14 hero flowers (cards) + bayong order
      lore.js             cards for every other clickable thing
    world/                the land and the made things
      terrain.js sky.js sea.js layout.js structures.js props.js
    flora/                plants
      plant-geometry.js plant-geometry-extra.js   (geometry library: G.geo)
      garden-beds.js      hero flowers, hedges, pots, ground cover, trees + LOD
      wild-plants.js      unlabeled flower-like weeds, chunked + culled
    fauna/                animals: common.js chickens.js birds.js insects.js night-glow.js
    fx/                   particles.js (fireflies, petals), magic.js (parols, orbs, fairy ring, shooting stars)
    game/                 controls.js (tour/walk/zoom/input), interaction.js (picking, card, bayong), loop.js
    ui/hud.js             time slider, keys panel
    audio/soundscape.js   procedural environmental sound
    dev/debug.js          URL switches for screenshots and tests (inert without them)
tools/                    check.sh (syntax, via macOS jsc), shot.sh + console.sh (headless Chrome)
docs/                     this file
archive/                  the first stylised prototype, for reference only (not loaded)
```

## Rules of the road

1. **One namespace.** Every module is an IIFE that reads what it needs from `window.G` and publishes
   only what others need. No ES-module bundler yet; `boot.js` is the dependency order.
2. **Adding a module:** create the file in the right folder, add its path to `MODULES` in `boot.js`
   after everything it reads.
3. **Per-frame work goes through the registry**, never a hard-coded call in the loop:
   ```js
   G.systems.add('boats', (t, dt, frame) => G.updateBoats(t), { order: 31, every: 2 });
   G.systems.get('boats'); G.systems.set('boats', { enabled: false }); G.systems.remove('boats');
   ```
   A system that throws is disabled and logged instead of freezing the scene.
4. **Numbers live in `config/settings.js`**, text lives in `data/`. Modules hold logic + geometry.
5. **No overlaps:** anything solid on the ground claims its footprint (`G.claim(x, z, r, solid)`); placements ask
   `G.isFree` / `G.findFree` and are NUDGED to the nearest free spot, never dropped. `?audit=1` prints any overlaps.
6. **Clickables:** push `{ pos, r, kind }` to `G.hot`; add a card for `kind` in `data/lore.js`.
   Walk-blockers go in `G.obstacles`. Landmark positions live in `world/layout.js` (`G.L`).
7. **Performance:** thin instances for anything repeated, three geometry LODs for plants/trees,
   chunked + distance-culled ground cover, wind and LOD fade in the vertex shader (no CPU per vertex).
8. **Anchoring:** anything hanging must hang from a real support (branch, beam, eave).

## Physics model (no rigid-body engine needed)

- **Plants (GPU, engine/wind.js):** each plant is a cantilever bending from its root (instance origin).
  Offset ∝ height² × flex × wind, whole plant shares its root's phase (moves as one body), natural sway
  frequency `hz` per stiffness class, bend capped at `maxBend`, and stems keep their length
  (the tip drops by h − √(h² − s²)). Mean bend from the breeze + gusts that swell and fade.
- **Hanging things (CPU, engine/physics.js):** parol lanterns (2-axis) and fiesta flags (1-axis) are damped
  pendulums: wind drag drives them, gravity (g/L) restores, turbulence makes them flutter.
- **Air:** an onshore sea breeze by day turns into a weaker offshore land breeze at night (`breeze.landBreeze`),
  with gusts that swell and fade. Everything that reads `G.windState` (plants, flags, parols, petals, fireflies) follows it.
- **Sea and shore (world/sea.js, numbers in `config.sea`):** Gerstner swells generated from one table for GPU and CPU.
  Near the beach they refract to face the shore, grow (shoaling) and break around `breakAt`; a foam bore follows each
  crest up the beach; the swash sheet runs up the sand and drains once per swell; the waterline foam sits where the water
  is thin over the real sand height. Night surf glows faintly (bioluminescence).
- **Boats:** ride the same wave function the sea shader uses (`G.waveAt`). The beached bangka rests on its keel along
  the real slope of the sand, bow to the sea.
- **Animals:** the chicken's body, head, tail and wings hang off a torso pivot at hip height,
  so pecking and crowing tilt them together over planted legs.

## Level of detail / anti-aliasing

- Geometry LOD: plants 3 levels (`lodTiers` d0/d1/cull), trees and palms 3 levels + culled.
- LOD fade: small plants sink into the ground over `fade: [start, end]` metres before their chunk is
  culled: no popping, and no sub-pixel shimmer far away.
- MSAA ×4 + FXAA, ACES tone mapping, gentle bloom (threshold .92), EXP2 fog for aerial perspective.

## Testing (no GPU needed)

```
tools/check.sh                                              # syntax of every module (seconds)
python3 server.py &
tools/shot.sh out.png "hideui=1&nomusic=1&u=.45"           # screenshot
# console on screen: add &log=1&showlog=1 to any shot (&audit=1 lists overlapping footprints)
```
See the header of `js/dev/debug.js` for camera presets (`?cam=`, `?atsp=`, `?at=hen`, `?walk=1`).
