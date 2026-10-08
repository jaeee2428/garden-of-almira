# The Garden of Almira  ·  Ang Hardin ni Almira
A folk-tale garden in Sugbo (Cebu), built in Babylon.js. Inspired by the title *Garden of Almira* by Erlinda Alburo.

## Run
Double-click `run.command`, or:  `python3 server.py`  then open http://localhost:8765  (Python 3 only, nothing to install)

## What to do
- **Click any flower** → its Cebuano name, scientific name and a fact. Each new flower fills your *bayong*.
  Collect all 18 and the garden awakens ("Pit Señor!").
- **Look for the lights**: parol star lanterns glow in the trees,
  a ring of mushrooms (some glow at night) is hidden at the edge of the garden. Click them.
- **Animals**: native Filipino chickens (a rooster, three hens and chicks that follow them), maya sparrows on the roof ridge and flying overhead, an egret at the pond, thirty alibangbang (butterflies) by day, moths around the porch lamp and a great many alitaptap (fireflies) at night. Click them to meet them.
- **All around the garden**: roses, canna, heliconia and kamia join the sampaguita, gumamela, kalachuchi, santan, dama de noche, bogambilya, kadena de amor and ilang-ilang; orchids grow on the trunks; a lily pond with lotus; mango trees; bamboo clumps; a bahay kubo; a tubod (well); a duyan (hammock) between two palms; clay tapayan jars and flower pots; mossy rocks.
- Click the puso, the candles at the roadside cross (light / snuff them), the bangka, the hens, the butterflies (alibangbang)
- **You**: walking puts you in the garden as a visitor in tsinelas, through your own eyes or (Tab / 👤) from behind. Run with Shift, jump with Space. Plants part and rustle as you pass, your feet sound like grass, sand, stone or water, the surf and pond splash, hens scatter and butterflies take off.
- **🚶 Walk** (or press T): W A S D, Shift to run, click to look, Esc to free the mouse
- **Buntag ↔ Gabii** slider: morning → udto (noon) → hapon (golden afternoon) → kilumkilom (dusk) → gabii (night); windows and lanterns glow, fireflies and shooting stars appear. The name of the hour shows beside the slider.
- **Living wind**: a sea breeze blows all the time, turns slowly and sends gusts rolling through. Every plant bends from its root like a real stem (stiff trees barely move, grass sways quickly, nothing stretches), on the GPU. The star lanterns and fiesta flags are little pendulums that lean downwind and settle; the wind also carries petals and fireflies. Plants part around you as you walk, and a click sends a ripple through the garden.
- **Keys**: press **K** for the full list: W A S D / arrows walk and turn, Shift run, F fly (Space up, C down), Z (hold) or mouse wheel to zoom, T tour/walk, Space pause the tour, R restart, 1-5 pick the hour (Buntag, Udto, Hapon, Kilumkilom, Gabii), , . or [ ] step through the day, P let time pass, H hide panels, M music.
- **Sound**: the garden's own sounds are generated live, with no melody and no audio files: the sea (louder near the shore), wind in the leaves (louder near palms and bamboo), birds you hear where they actually fly or perch, the rooster crowing when he crows, hens clucking, chicks peeping, frogs and an owl at night (no bee hum or cricket drone, on purpose: it stays peaceful), and your footsteps on grass, stone or sand. Browsers only allow sound after your first click or key press. Press **M** or the Sound button to mute.
- Always runs at full detail. If a computer struggles it quietly renders fewer pixels, nothing else changes.

## Made for speed
Wind bends every plant on the GPU. Every plant is built in 3 levels of detail and drawn by distance; plants behind you or far away are skipped; grass is
split into chunks that are culled; shadows are redrawn every few frames; lights that are off cost nothing; the pixel
ratio is capped at 1.5.

## Files
The code is split by responsibility; see **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the full map and the rules for adding to it.
- `server.py` tiny local web server · `run.command` double-click launcher
- `public/js/boot.js` the load order (one manifest) · `public/js/config/settings.js` every tunable number
- `public/js/engine/` engine core: namespace, system registry, GPU wind, pendulum physics, mesh builder, rendering, time of day
- `public/js/data/` the flower and lore cards (content only)
- `public/js/world/` terrain, sky, sea, layout, house/arch/pergola/shrine/boats, props
- `public/js/flora/` plant geometry library, garden beds + trees, wild plants
- `public/js/fauna/` chickens, birds, butterflies & moths, night glow
- `public/js/fx/` fireflies & petals, parols, orbs, fairy ring, shooting stars
- `public/js/game/` controls (tour/walk/zoom), interaction (picking, card, bayong), the frame loop
- `public/js/ui/hud.js`, `public/js/audio/soundscape.js`, `public/js/dev/debug.js`
- `tools/` headless Chrome screenshot + console helpers · `archive/` the first prototype (not loaded)

## Sea, boats and flowers (latest)
- The sea uses Gerstner waves on the GPU; the sailing bangka rides the same wave function on the CPU, and the beached bangka sits clear of the rocks.
- Weeds are flower-like and unlabeled; the 14 named flowers are the ones you can click (card + bayong).
- Cards describe Visayan folk and herbal practice (mostly medicinal, some cultural) from public Philippine ethnobotany sources (StuartXchange, Philippine Traditional Knowledge Digital Library). They are folk uses, not medical advice, and were not checked by a Cebuano healer.
- The text of Erlinda Alburo's "Garden of Almira" could not be found online, so the plant list is typical of Cebuano gardens, not taken from the work.
- `STATE.md` records the full current state of the app.
