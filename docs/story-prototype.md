# Story prototype (branch `story-prototype`)

A first playable placeholder of the game flow and story from `docs/proposal/game-flow.html`.
It is **off by default**. The garden on `main` is unchanged; this only runs with `?story=1`.

Run: `python3 server.py`, then open http://localhost:8765/?story=1&fresh=1

## What you can play
- **Pag-uli (prologue):** you arrive at the gate in third person. Walk to Lola Almira on the papag under the ilang-ilang. She greets you and gives you her journal.
- **The loop, every page:** Lola reads her note → walk around for clues (near the flower, the well, the cross, the kubo, the gate) → press **J** and fill the blanks from the word bank → find and click the flower → click Lola and tell her 3 true details → her poem page (placeholder for Ma'am Alburo's text) → next page.
- **Chapters:** one day each, with a chapter card and the right time of day. Chapter IV is a **brownout** (only candle light).
- **Side tales:** overheard, not assigned. *Ang Banog ug ang Himungaan* near the hens (I), Juan Pusong on the radio by the duyan (II), the ilang-ilang legend under the tree (III), the alitaptap in the brownout (IV). Kept under "Mga sugilanon" in the journal.
- **Mata ni Lola:** hold **O**. The view goes soft and dim, and strong scents glow.
- **Unsolved flowers** show "???" on hover until their page is done.

## Keys (story mode only)
J journal · hold O Mata ni Lola · N next line · ` (backquote) skip the current page · click a subtitle to skip it

## Written vs placeholder
- Written pages: sampaguita, gumamela, santan, dama de noche. The other 14 pages are generated from the flower cards and marked "placeholder".
- Lola Almira is a placeholder figure built from simple shapes, with spring animation (breathing, threading the garland, head turning toward your voice, nodding and a hand gesture while she talks).
- Nang Iday, Bebe and Toto Ben speak in subtitles only (no models yet).
- All Cebuano lines are placeholders for a native speaker to check. The poem verse is a placeholder for Ma'am Alburo's text.

## Dev switches
`&fresh=1` reset progress · `&chapter=1..6` start at a chapter · `&lolacam=1.6` frame Lola · `&storyshot=journal|tell|card|mata|sub` open a screen for screenshots

## Files
`public/js/story/story-data.js` (text), `public/js/story/lola.js` (Lola), `public/js/story/story.js` (director + UI), `public/css/story.css`.
Hooks: `boot.js` loads them only with `?story=1`; `game/interaction.js` asks `G.storyLabel` / `G.storyPick` when they exist.
