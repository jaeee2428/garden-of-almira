# The Garden of Almira — current state of the app

Babylon.js 9.29 (local vendor copy) + a static Python server. Run: `run.command` or `python3 server.py` → http://localhost:8765
Inspired by the *title* of Erlinda K. Alburo's "Garden of Almira". **The text of that work could not be found online** (searched repeatedly; only her anthologies / bio turn up), so the flowers are typical Cebuano garden plants, NOT confirmed from the work. Never claim otherwise. Info cards come from public Philippine ethnobotany sources (StuartXchange, Philippine Traditional Knowledge Digital Library); not independently verified by a Cebuano herbalist.

## Files (public/)
- `index.html` UI: title (Kaniadto sa Sugbo… / The Garden of Almira / Ang Hardin ni Almira / "inspired by the title by Erlinda Alburo"), bayong chips, bar (Walk/Tour, time slider Buntag…Gabii with name, ⏳, 🔊 Sound, ⌨ Keys), click-info card, key legend.
- `js/core.js` engine, WindPlugin (GPU wind), terrain, procedural sky, Gerstner sea (`G.waveAt`), lights, CSM shadows, pipeline, time-of-day.
- `js/flora.js`, `flora2.js` hand-modelled plants (3 LODs). `flora3.js` unlabeled flowering weeds + grass (chunked, culled).
- `js/structures.js` stone path, Visayan house, arch, pergola, shrine, banderitas, bangka boats (`G.updateBoats`), layout `G.L`.
- `js/garden.js` flower INFO cards, beds, plants (thin instances), hedges, trees, fireflies, quality tiers. `props.js` rocks, pond, mango, bamboo, bahay kubo, tubod, duyan, pots, orchids. `magic.js` orbs, parols, mushroom ring, shooting stars. `fauna.js` chickens/chicks/rooster, birds, egret, 30 butterflies + moths, fairy lights, near fireflies. `audio.js` procedural environmental soundscape. `main.js` tour, walk, picking, bayong, zoom, time slider, wind model.
- `renders/` stills.

## Behaviour
- Tour (190 s camera path) is the original flow. Walk mode: WASD/arrows, Shift run, Q/E turn, F fly, mouse look (click to lock).
- Zoom: hold **Z** or use the **mouse wheel**, in every mode (tour, walk, static). R resets.
- Hover label = Cebuano name of exactly what the ray hits. Plants are picked by distance to their own stem line (tight radius), occluded things are skipped.
- Click a flower: card with name, scientific name and folk/herbal facts; adds it to the bayong (14 flowers; collecting all triggers the "awaken" magic).
- Time: keys 1–5 / slider; fireflies and candle/lantern flicker only at night; no grain; no fairies.
- Sound: environment tied to animated things (wind in leaves, sea, birds, chickens, frogs/owl at night; no buzzing hum — user wants peace), toggle M.

## Removed on purpose — do NOT re-add
Wish/lantern release, "Kuwento" panel, "Hangin" button, Detail quality button, grain, fairies, flower guide pop-up / 🌸 Flowers button / V-B-X flower keys / hero captions (user asked to revert them).

## Dev / testing
Headless Chrome (swiftshader) screenshots: `?hideui=1&nomusic=1&u=.45&cam=x,y,z,tx,ty,tz`, `?atsp=gumamela&v=red` (closeup of a species), `?at=hen&i=0&d=1`, `?walk=1&x=&z=&yaw=`. `u` = time of day 0..1. Not tested on a real GPU.

## Known caveats
- Load ≈ 9 s in headless software GL (instrumentation `__t`, `READY_MS`); real GPU should be faster.
- Facts on cards are from secondary online sources; no medical advice — folk uses only.
