# The Garden of Almira — current state of the app

Babylon.js 9.29 (local vendor copy) + a static Python server. Run: `run.command` or `python3 server.py` → http://localhost:8765
Inspired by the *title* of Erlinda K. Alburo's "Garden of Almira". **The text of that work could not be found online** (searched repeatedly; only her anthologies / bio turn up), so the flowers are typical Cebuano garden plants, NOT confirmed from the work. Never claim otherwise. Info cards come from public Philippine ethnobotany sources (StuartXchange, Philippine Traditional Knowledge Digital Library); not independently verified by a Cebuano herbalist.

## Files (public/) — see docs/ARCHITECTURE.md
- `index.html` markup only (title, bayong chips, bar: Walk/Tour, time slider Buntag…Gabii, ⏳, 🔊 Sound, ⌨ Keys, card, keys legend); `css/garden.css` styles.
- `js/boot.js` the module manifest / load order. `js/config/settings.js` all tunables (render, wind stiffness per class, LOD tiers, time-of-day keys incl. fog).
- `js/engine/` engine.js (G, helpers), systems.js (per-frame registry: add/get/set/remove), wind.js (GPU wind + LOD fade), physics.js (damped pendulums), mesh-builder.js (MB), render.js (lights, CSM, MSAA+FXAA, bloom), time-of-day.js.
- `js/data/` flowers.js (14 hero flowers + G.FLOWER_ORDER), lore.js (all other cards).
- `js/world/` terrain, sky, sea (Gerstner, `G.waveAt`), layout (`G.L`, `G.hot`, `G.obstacles`), structures (path, house, arch, pergola, shrine, flags, boats), props (rocks, pond, mango, bamboo, kubo, well, hammock, pots, orchids).
- `js/flora/` plant-geometry = the toolkit `G.geo` (leaf, petal, branch, **shrub** generator); hero flower models live in `public/flowers/<id>/model.js`; garden-beds (beds, hedges, pots, cover, arch vines, trees, LOD); wild-plants (unlabeled weeds).
- `js/fauna/` common (kit), chickens, birds (+egret), insects (butterflies, moths), night-glow (bluebells, near fireflies, fairy lights).
- `js/fx/` particles (fireflies, petals), magic (parols, orbs, fairy ring, motes, shooting stars).
- `js/game/` controls (tour, walk, zoom, input; `G.player`), interaction (picking, card, bayong), loop. `js/ui/hud.js`. `js/audio/soundscape.js`. `js/dev/debug.js` (URL switches).
- `tools/shot.sh`, `tools/console.sh` headless checks. `renders/` stills. `archive/` first prototype.

## Behaviour
- Tour (190 s camera path) is the original flow. Walk mode: WASD/arrows, Shift run, Q/E turn, F fly, mouse look (click to lock).
- Zoom: hold **Z** or use the **mouse wheel**, in every mode (tour, walk, static). R resets.
- Hover label = Cebuano name of exactly what the ray hits. Plants are picked by distance to their own stem line (tight radius), occluded things are skipped.
- Click a flower: card with name, scientific name and folk/herbal facts; adds it to the bayong (18 flowers; collecting all triggers the "awaken" magic).
- Time: keys 1–5 / slider; fireflies and candle/lantern flicker only at night; no grain; no fairies.
- Sound: environment tied to animated things (wind in leaves, sea, birds, chickens, frogs/owl at night; no buzzing hum — user wants peace), toggle M.

## Removed on purpose — do NOT re-add
Wish/lantern release, "Kuwento" panel, "Hangin" button, Detail quality button, grain, fairies, flower guide pop-up / 🌸 Flowers button / V-B-X flower keys / hero captions (user asked to revert them).

## Dev / testing
`tools/shot.sh out.png "<query>"` and `tools/console.sh "<query>"` (console via ?log=1). Headless Chrome (swiftshader) screenshots: `?hideui=1&nomusic=1&u=.45&cam=x,y,z,tx,ty,tz`, `?atsp=gumamela&v=red` (closeup of a species), `?at=hen&i=0&d=1`, `?walk=1&x=&z=&yaw=`. `u` = time of day 0..1. Not tested on a real GPU.

## Physics / look (Oct 2026)
- Wind: plants bend from the root as one body (cantilever, length-preserving, capped angle, natural sway per stiffness class); tuned in config. Parols + flags are damped pendulums. Chicken body/head/tail/wings hang off a torso pivot (head no longer detaches).
- LOD fade: small plants sink into the ground before culling (`fade` in config). MSAA ×4 + FXAA. Bloom softer (thr .92, w .14). Orbs/motes/ring sparkles mostly at night; no daytime fireflies; softer sea glitter. Softer sun, more sky fill, lighter shadows, gentle fog (EXP2 .0072–.012).

- Shore (Oct 2026): surf zone with refraction, shoaling, breaking at ~9 m, foam bores, swash run-up, waterline foam on the real sand height, faint blue night surf. Wider dry-sand beach. Beached bangka on its keel along the slope, bow to sea. Footprint registry (`G.isFree/findFree/claim`, `?audit=1`): beach rocks, pandan, morning glory, palms, bananas, boat never overlap (nudged, never dropped). Sea breeze by day, land breeze at night.

- Avatar (Oct 2026): `game/avatar.js` "Ikaw" - a young Cebuana (~1.58 m) in a coral floral sundress with flutter sleeves, white sash, sandals, long black hair with a sampaguita; high-poly face (almond eyes, lashes, brows, lips). Jointed skeleton, procedural walk/run with hip sway, human physics (accel, slope, wading, gravity, jump/land, bump), CLOTH skirt (CPU: knees push it, lags with acceleration, wind ripples), hair pendulum. Tab = first/third person (no button). Body contact bends soft plants (shader uPlayer.w/uTrail, wake behind her), rustle + petals when running through flowers, contact sounds via `G.sfx` on an effects bus (ambience bus quieter: config.audio). Hens flee, butterflies startle; card `ikaw`. F fly and the tour unchanged. Dev: `&face=1.1` portrait camera, `&hold=KeyW`.
- Animation pass (Oct 2026, skill `3d-animation-specialist`): springs/easing instead of linear (`G.physics.spring/stepSpring/damp`, `G.ease`). Avatar: jump anticipation (knee dip, config `avatar.windup`), springy landing with rebound, arm + forearm follow-through, body banks into turns / leans with acceleration (atan(a/g), clamped), head leads turns in 3rd person, eased idle weight shift + glances; 3rd-person camera smoothing is frame-independent. Hens: eased peck/walk blends, hold-and-thrust head bob.
- Coconuts: bunch on stalks below the fronds, no overlap with trunk/each other, no flutter; palms stiffer (config).
- Heritage flowers (Oct 2026): adelfa (pink/white), pukingan (vine on a bamboo tripod), tsampaka (small tree), rosal (gardenia) (now in `public/flowers/<id>/`), planted by their own pass (w: 0 keeps the original layout), cards in `public/flowers/<id>/card.js`; bayong is 18.

## Known caveats
- Load ≈ 9 s in headless software GL (instrumentation `__t`, `READY_MS`); real GPU should be faster.
- Facts on cards are from secondary online sources; no medical advice — folk uses only.

## Oct 2026 pass 2 (local only, not pushed)
- **Flower folders**: `public/flowers/<id>/` = card.js (richer card: English + local names, family, scent, look, fact, sources) + model.js + README.md + renders/ (before/after studio shots). Gallery: http://localhost:8765/flowers/. Card UI shows names line + family/scent line.
- **Realism pass on flowers**: new `geo.shrub` generator (stems -> branches -> twigs, real phyllotaxy, leaf stalks, flowers via tip/axil callbacks, true-to-life flower sizes). Rebuilt: sampaguita, gumamela, santan, dama, bogambilya, adelfa, rosal, tsampaka, rosas; clumps for canna, heliconia, kamia; kalachuchi as a forking tree; pukingan denser + pods. Leaf/petal vein texture (LeafDetailPlugin, `?noleaftex` to disable, `?leafdebug` shows tagged surfaces).
- **Ikaw**: hair = one closed volume bent on the CPU (no gap, no sheet) + strands; anatomical limbs (lathe profiles), ruffled sleeves, dress back covers the shoulders. Plants bend as whole stems from her body (root direction) with spring-back from her trail (uTrail/uTrail2); the free-camera parting is off while she walks (no hollow around her).
- **Animals**: hens steer around obstacles/bushes/each other (faunaKit.steer, stuck -> new target); egret re-rigged (neck joint at its base, two-joint stepping legs, anticipation strike) and wades inside the pond rim.
- Dev: `?specimen=id[&close=1]` studio, `?notitle=1`, `?at=egret&egret=step|strike`, `?shaderdefs=shrub`, `&face=1&facea=angle` avatar portrait.
- **Git**: commit locally; push ONLY when the user says.
