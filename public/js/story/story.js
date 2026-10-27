/* =====================================================================
   story/story.js - the story prototype director (loaded only with ?story=1)
   Chapters (one day each) > pages (one flower each) > the loop:
     read the page -> collect clues (walk near the plant / landmarks) -> fill the blanks (J) ->
     find + pick the flower -> tell Lola (3 true details) -> her poem + the card -> next page
   Plus: subtitles, chapter cards, side tales (overheard), brownout night, Mata ni Lola (hold O).
   Prototype keys: J journal · O (hold) Mata ni Lola · N next line · ` skip this page
   Dev: &chapter=1..5 start chapter · &fresh=1 reset progress · &storyshot=journal|tell|card|mata|sub
   ===================================================================== */
(() => {
const { V3, scene, canvas } = G, S = G.STORY, params = G.params, P = G.player;
const $ = id => document.getElementById(id), el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
document.body.classList.add('story');

/* ---------- progress ---------- */
const KEY = 'almira.story';
let st = (() => { if (params.has('fresh')) return null; try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } })();
if (!st || params.has('chapter')) st = { ch: Math.max(0, Math.min(S.chapters.length - 1, (parseInt(params.get('chapter') || '1') - 1))), pg: 0, solved: [], words: {}, found: {}, tales: [], met: false, fill: {}, picked: {} };
if (params.has('chapter') && st.ch > 0) { st.met = true; for (let i = 0; i < st.ch; i++) st.solved.push(...S.chapters[i].pages); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
const chapter = () => S.chapters[st.ch], pageId = () => chapter().pages[st.pg];
const info = id => G.INFO[id];

// pages without written content get a placeholder built from the flower card
function page(id) {
  if (S.pages[id]) return S.pages[id];
  const I = info(id); return S.pages[id] = { placeholder: true, note: ['(placeholder) ' + I.look, ''], tigmo: null, blanks: [['Ngalan', I.ceb]],
    clues: [{ kind: 'sense', ceb: 'Mao kaha ni?', en: I.look.split(';')[0] + '.' }], traits: null };
}
const words = id => (st.words[id] = st.words[id] || []);
function seedWords(id) {                                      // chapter flower names are known; the rest must be found
  const w = words(id); if (w.length) return; const ch = S.chapters.find(c => c.pages.includes(id)) || chapter();
  ch.pages.forEach(p => w.push(info(p).ceb)); if (ch.pages.length < 3) ['Gumamela', 'Santan'].forEach(n => w.includes(n) || w.push(n));
  const pg = page(id); pg.blanks.slice(1).forEach(([k]) => (k === 'Gamit' ? S.decoys.Gamit : S.decoys.Kanus).forEach(d => w.includes(d) || w.push(d)));
}
const addWord = (id, w) => { const a = words(id); if (w && !a.includes(w)) { a.push(w); toast('Bag-ong pulong · <b>' + esc(w) + '</b>'); save(); } };
const filled = id => page(id).blanks.every(([k, a]) => (st.fill[id] || {})[k] === a);

/* ---------- UI ---------- */
const ui = el('div', null); ui.id = 'story'; document.body.appendChild(ui);
ui.innerHTML = `
<div id="st-goal"></div>
<div id="st-toast"></div>
<div id="st-sub"><div class="who"></div><div class="ceb"></div><div class="en"></div><div class="opts"></div></div>
<div id="st-card"><div class="n"></div><div class="t"></div><div class="l"></div><div class="e"></div><div class="f"></div></div>
<div id="st-brown"></div><div id="st-scent"></div>
<div id="st-journal"><div class="book"><div class="pg left"></div><div class="pg right"></div></div><div class="tabs"></div><button class="x">✕ (J)</button></div>
<div id="st-tell"><div class="box"><div class="who">Lola Almira</div><div class="ceb"></div><div class="en"></div><div class="chips"></div><div class="bar"><span class="cnt"></span><button class="go">Isulti</button></div></div></div>
<div id="st-poem"><div class="sheet"><span class="stamp">NAHUMAN ✓</span><h3></h3><div class="sci"></div><div class="verse"></div><div class="two"><div><b>Sa naandan</b><span class="tr"></span></div><div><b>Nakat-unan</b><span class="kp"></span></div></div><button class="ok">Sunod · next</button></div></div>
<div id="st-keys">story prototype · <b>J</b> journal · hold <b>O</b> Mata ni Lola · <b>N</b> next line · <b>\`</b> skip page</div>`;
const sub = $('st-sub'), goal = $('st-goal'), card = $('st-card'), jr = $('st-journal'), tell = $('st-tell'), poem = $('st-poem');

let tt = 0; function toast(h) { const t = $('st-toast'); t.innerHTML = h; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 3200); }

/* subtitles: a queue of [who, ceb, en]; auto-advance, N or click to skip */
const q = []; let cur = null, subT = 0, subCb = null;
function say(lines, cb) { lines.forEach(l => q.push(l)); if (cb) q.push(cb); if (!cur) next(); }
function next() {
  while (q.length && typeof q[0] === 'function') q.shift()();
  cur = q.shift() || null; G.lolaTalk = false;
  if (!cur) { sub.classList.remove('on'); return; }
  const [who, ceb, en, opts] = cur; G.lolaTalk = who === 'Lola Almira';
  sub.querySelector('.who').textContent = who; sub.querySelector('.ceb').textContent = ceb; sub.querySelector('.en').textContent = en || '';
  const o = sub.querySelector('.opts'); o.innerHTML = ''; if (opts) opts.forEach(([label, fn]) => { const b = el('button', null, esc(label)); b.onclick = e => { e.stopPropagation(); fn(); next(); }; o.appendChild(b); });
  sub.classList.add('on'); subT = opts ? 1e9 : 2.2 + (ceb.length + (en || '').length * .4) * .045;
}
sub.onclick = () => next();
G.systems.add('storySub', (t, dt) => { if (cur && (subT -= dt) <= 0) next(); }, { order: 92 });

function chapterCard(ch, cb) {
  card.querySelector('.n').textContent = ch.n; card.querySelector('.t').textContent = ch.title; card.querySelector('.l').textContent = '“' + ch.line[0] + '”'; card.querySelector('.e').textContent = ch.line[1];
  card.querySelector('.f').textContent = ch.fresh || ''; card.classList.add('on');
  G.hud.setTime(ch.u); G.autoTime = false; document.body.classList.toggle('brownout', !!ch.brownout);
  if (params.get('storyshot') === 'card') return; setTimeout(() => { card.classList.remove('on'); cb && cb(); }, 5200);
}

/* ---------- the goal line (top left) ---------- */
function refreshGoal() {
  const id = pageId(), n = st.solved.length + 1;
  if (!st.met) { goal.innerHTML = '<b>Pag-uli</b> · adto kang Lola sa papag ilawom sa ilang-ilang · <i>go to Lola on the bamboo bench</i>'; return; }
  if (!id) { goal.innerHTML = '<b>' + esc(chapter().title) + '</b>'; return; }
  const pg = page(id), pk = st.picked[id];
  const step = pk ? 'ihatod kang Lola · <i>bring it to Lola</i>' : filled(id) ? 'pangitaa ug pupha ang bulak · <i>find and pick the flower</i>' : 'pangitaa ang mga timailhan, ablihi ang journal (J) · <i>find clues, fill the page</i>';
  goal.innerHTML = '<b>Pahina ' + n + ' / 18</b>' + (pg.placeholder ? ' <span class="ph">placeholder</span>' : '') + ' · ' + step;
}

/* ---------- journal (J) ---------- */
let jTab = 'page', pick = null;
function openJournal(on = !jr.classList.contains('on')) { jr.classList.toggle('on', on); document.body.classList.toggle('st-jopen', on); if (on) { if (document.pointerLockElement) document.exitPointerLock(); renderJournal(); } }
jr.querySelector('.x').onclick = () => openJournal(false);
function renderJournal() {
  const L = jr.querySelector('.left'), R = jr.querySelector('.right'), tabs = jr.querySelector('.tabs'), id = pageId();
  tabs.innerHTML = ''; [['page', 'Pahina'], ['all', 'Tanang pahina'], ['tales', 'Mga sugilanon']].forEach(([k, n]) => { const b = el('button', jTab === k ? 'on' : '', n); b.onclick = () => { jTab = k; renderJournal(); }; tabs.appendChild(b); });
  if (jTab === 'tales') {
    L.innerHTML = '<h4>Mga sugilanon nga akong nadungog</h4><p class="dim">Stories I heard</p>' + Object.entries(S.tales).map(([k, t]) => st.tales.includes(k) ? `<p class="tale"><b>${esc(t.title)}</b> <span class="dim">· ${t.type} · ${esc(t.src)}</span></p>` : '<p class="dim">· · · (wala pa madungog · not yet heard)</p>').join('');
    R.innerHTML = st.tales.length ? st.tales.map(k => `<p class="lolahand">${S.tales[k].lines.map(l => esc(l[1])).join(' ')}</p>`).join('') : '<p class="dim">Walk past people in the garden at the right hour, or sit with them (L).</p>'; return;
  }
  if (jTab === 'all') {
    L.innerHTML = '<h4>Ang libro ni Lola</h4><p class="dim">18 pages · one per flower</p><div class="dots">' + G.FLOWER_ORDER.map(f => `<span class="${st.solved.includes(f) ? 'ok' : f === id ? 'now' : ''}" title="${st.solved.includes(f) ? esc(info(f).ceb) : '???'}">${st.solved.includes(f) ? '✿' : '·'}</span>`).join('') + '</div>';
    R.innerHTML = S.chapters.map((c, i) => `<p class="${i === st.ch ? 'now' : ''}"><b>${esc(c.n)}</b> · ${esc(c.title)}<br><span class="dim">${c.pages.map(p => st.solved.includes(p) ? esc(info(p).ceb) : '???').join(' · ') || '·'}</span></p>`).join(''); return;
  }
  if (!st.met || !id) { L.innerHTML = '<h4>Ang libro ni Lola</h4><p class="dim">Lola has not given you her journal yet.</p>'; R.innerHTML = ''; return; }
  const pg = page(id), F = st.fill[id] = st.fill[id] || {}, found = st.found[id] || [];
  L.innerHTML = `<h4>Pahina ${st.solved.length + 1}${pg.placeholder ? ' <span class="ph">placeholder</span>' : ''}</h4>
    <div class="press"></div><p class="lolahand">“${esc(pg.note[0])}”</p><p class="lolahand en">${esc(pg.note[1])}</p>
    ${pg.tigmo ? `<p class="clue">❓ <i>${esc(pg.tigmo[0])}</i><br><span class="dim">${esc(pg.tigmo[1])}</span></p>` : ''}
    <p class="hd">Mga timailhan · clues</p>${found.length ? found.map(i => { const c = pg.clues[i]; return c.kind === 'lola' ? `<p class="clue">📖 Gikan sa pahina ni Lola · <i>from Lola's page</i>: <b>${esc(c.word)}</b></p>` : `<p class="clue">${c.kind === 'sense' ? '👃' : '🗣️'} ${c.who ? esc(c.who) + ': ' : ''}<i>${esc(c.ceb || '')}</i><br><span class="dim">${esc(c.en || '')}</span></p>`; }).join('') : '<p class="dim">Wala pa. Walk around: near the flower, by the well, the cross, the kubo, the gate.</p>'}`;
  const solvedNow = filled(id);
  R.innerHTML = `<span class="stamp ${solvedNow ? 'ok' : ''}">${st.picked[id] ? 'IHATOD KANG LOLA' : solvedNow ? 'PANGITAA' : 'KULANG PA'}</span><h4>&nbsp;</h4>` +
    pg.blanks.map(([k, a]) => `<p class="ln">${esc(k)}: <span class="slot ${F[k] === a ? 'ok' : ''}" data-k="${esc(k)}">${F[k] === a ? esc(a) : '?'}</span></p>`).join('') +
    '<p class="dim" style="margin-top:1em">Word bank · pick a word, then a blank</p><div class="bank">' + words(id).map(w => `<button class="${Object.values(F).includes(w) ? 'used' : ''}">${esc(w)}</button>`).join('') + '</div>' +
    (solvedNow ? '<p class="ikawhand">Pangitaa siya sa hardin, ug ihatod kang Lola.<br>Find it in the garden, then bring it to Lola.</p>' : '');
  R.querySelectorAll('.bank button').forEach(b => b.onclick = () => { R.querySelectorAll('.bank button').forEach(x => x.classList.remove('sel')); pick = b.textContent; b.classList.add('sel'); });
  R.querySelectorAll('.slot').forEach(sl => sl.onclick = () => {
    if (!pick) return; const k = sl.dataset.k, a = pg.blanks.find(b => b[0] === k)[1];
    if (pick === a) { F[k] = a; pick = null; save(); renderJournal(); refreshGoal(); if (filled(id)) toast('Kompleto ang pahina · <b>find the flower</b>'); }
    else { sl.classList.remove('bad'); void sl.offsetWidth; sl.classList.add('bad'); }
  });
}

/* ---------- tell Lola ---------- */
let chosen = new Set();
function openTell() {
  const id = pageId(), pg = page(id); if (!pg.traits) { solvePage(); return; }
  if (document.pointerLockElement) document.exitPointerLock();
  chosen = new Set(); const all = [...pg.traits.yes, ...pg.traits.no].sort((a, b) => (a.length * 7 + a.charCodeAt(0)) % 5 - (b.length * 7 + b.charCodeAt(0)) % 5);
  tell.querySelector('.ceb').textContent = '“Unsa man ang imong nakita, day? Isulti kanako.”'; tell.querySelector('.en').textContent = 'What did you see, dear? Tell me. (pick 3)';
  const box = tell.querySelector('.chips'); box.innerHTML = ''; all.forEach(w => { const b = el('button', null, esc(w)); b.onclick = () => { if (chosen.has(w)) chosen.delete(w); else if (chosen.size < 3) chosen.add(w); b.classList.toggle('on', chosen.has(w)); tell.querySelector('.cnt').textContent = chosen.size < 3 ? 'pick ' + (3 - chosen.size) + ' more' : 'ready'; }; box.appendChild(b); });
  tell.querySelector('.cnt').textContent = 'pick 3'; tell.classList.add('on'); G.lolaTalk = true; setTimeout(() => { G.lolaTalk = false; }, 1600);
}
tell.querySelector('.go').onclick = () => {
  const id = pageId(), pg = page(id); if (chosen.size < 3) return;
  const good = [...chosen].filter(w => pg.traits.yes.includes(w)).length;
  if (good >= 3) { tell.classList.remove('on'); say([['Lola Almira', 'Mao na! Ang ' + info(id).ceb + '.', "That's it! The " + info(id).ceb + '.']], solvePage); return; }
  const miss = pg.traits.yes.find(w => !chosen.has(w)), a = (pg.ask && pg.ask[miss]) || ['Hmm. Sulti pa, day. Unsa pa?', 'Hmm. Tell me more, dear. What else?'];
  tell.querySelector('.ceb').textContent = '“' + a[0] + '”'; tell.querySelector('.en').textContent = a[1] + '  (a hint, not a loss)';
  chosen.clear(); tell.querySelectorAll('.chips button').forEach(b => b.classList.remove('on')); tell.querySelector('.cnt').textContent = 'pick 3'; G.lolaTalk = true; setTimeout(() => { G.lolaTalk = false; }, 1800);
};

/* ---------- solving a page: poem + card, then the next page or chapter ---------- */
function solvePage() {
  const id = pageId(), I = info(id), pg = page(id);
  poem.querySelector('h3').textContent = I.ceb; poem.querySelector('.sci').textContent = I.sci + ' · Pahina ' + (st.solved.length + 1);
  poem.querySelector('.verse').textContent = S.POEM; poem.querySelector('.tr').textContent = I.tradition || I.fact; poem.querySelector('.kp').textContent = I.keep || '';
  poem.classList.add('on'); G.lolaTalk = true; G.petalBurst && G.petalBurst(G.lola.pos().add(new V3(0, 1, 0)), 60);
  poem.querySelector('.ok').onclick = () => {
    poem.classList.remove('on'); G.lolaTalk = false; st.solved.push(id); st.pg++; save();
    const after = pg.after || [];
    say(after, () => advance());
  };
}
function advance() {
  if (pageId()) { openPage(); return; }
  st.ch++; st.pg = 0; save();
  const ch = chapter(); if (!ch) return;
  chapterCard(ch, () => { if (ch.id === 'fiesta') return ending(); if (st.ch === 3) setTimeout(() => tale('ilang'), 8000); if (ch.brownout) setTimeout(() => tale('alitaptap'), 14000); openPage(); });
}
function openPage() {
  const id = pageId(); if (!id) return advance(); seedWords(id); const pg = page(id);
  (pg.clues.map((c, i) => c.kind === 'lola' ? i : -1).filter(i => i >= 0)).forEach(i => { foundClue(id, i, true); });
  refreshGoal(); toast('Bag-ong pahina · <b>Pahina ' + (st.solved.length + 1) + '</b> · press J');
  say([['Lola Almira', pg.note[0], pg.note[1]]]);
}
function foundClue(id, i, quiet) {
  const f = st.found[id] = st.found[id] || []; if (f.includes(i)) return; f.push(i); const c = page(id).clues[i];
  if (c.word) addWord(id, c.word); if (!quiet && c.kind !== 'lola') say([[c.who || 'Ikaw', c.ceb, c.en]]); save(); if (jr.classList.contains('on')) renderJournal();
}
function ending() {
  refreshGoal(); say(S.ending, () => { G.awaken && G.awaken(); const o = $('pit'); if (o) { o.classList.add('show'); setTimeout(() => o.classList.remove('show'), 6500); } goal.innerHTML = '<b>Pagmata</b> · the journal is complete. Imo na ning hardin.'; });
}

/* ---------- hooks into interaction.js: "???" for unsolved flowers, story clicks ---------- */
const HERO = new Set(G.FLOWER_ORDER);
G.storyLabel = (hit, inf) => { if (!inf) return ''; if (hit.kind === 'plant' && HERO.has(hit.sp) && !st.solved.includes(hit.sp)) return '???'; return inf.ceb; };
G.storyPick = hit => {
  if (hit.kind === 'lola') { talkToLola(); return true; }
  if (hit.kind !== 'plant' || !HERO.has(hit.sp) || st.solved.includes(hit.sp)) return false;
  const id = pageId();
  if (!st.met || hit.sp !== id) { say([['Ikaw', 'Unsa kaha ni nga bulak? Wala pa ni sa journal.', "I wonder what this flower is. It's not in the journal yet."]]); return true; }
  if (!filled(id)) { const si = page(id).clues.findIndex(c => c.kind === 'sense'); if (si >= 0) foundClue(id, si); else say([['Ikaw', 'Mao kaha ni?', 'Could this be it?']]); return true; }
  if (!st.picked[id]) { st.picked[id] = true; save(); if (hit.p) hit.p.pulse = 1; G.petalBurst && G.petalBurst(hit.pos, 30); say([['Ikaw', 'Ihatod ni nako kang Lola.', "I'll bring this to Lola."]]); refreshGoal(); }
  return true;
};
function talkToLola() {
  if (!st.met) return meet();
  const id = pageId(); if (!id) return;
  if (st.picked[id]) return openTell();
  const pg = page(id); say([['Lola Almira', filled(id) ? 'Nakit-an na nimo? Dad-a diri, day.' : pg.note[0], filled(id) ? 'Did you find it? Bring it here, dear.' : pg.note[1]]]);
}
function meet() {
  if (st.met || meeting) return; meeting = true;
  say(S.prologue, () => { st.met = true; save(); toast('Imo na ang journal · <b>press J</b>'); openPage(); });
}
let meeting = false;

/* ---------- triggers: clues near plants and landmarks, overheard tales ---------- */
const where = { well: G.L.well, kubo: G.L.kubo, shrine: G.L.shrine, arch: { x: G.L.arch.x, z: 0 }, house: G.L.house };
const near = (x, z, r) => { const A = G.avatar, cam = scene.activeCamera, px = A && A.active ? A.x : cam.position.x, pz = A && A.active ? A.z : cam.position.z; return Math.hypot(px - x, pz - z) < r; };
function tale(k) { if (st.tales.includes(k) || cur) return false; st.tales.push(k); save(); const t = S.tales[k]; say([...t.lines, ['', '', '(' + t.type + ' · ' + t.title + ' · written at the back of the journal)']]); return true; }
G.systems.add('storyTriggers', () => {
  if (P.mode !== 'walk') return; const lp = G.lola.pos();
  if (!st.met) { if (near(lp.x, lp.z, 3.6)) meet(); return; }
  const id = pageId(); if (id && !cur) {
    const pg = page(id);
    pg.clues.forEach((c, i) => {
      if ((st.found[id] || []).includes(i)) return;
      if (c.kind === 'place' && where[c.at] && near(where[c.at].x, where[c.at].z, 4)) foundClue(id, i);
      else if (c.kind === 'sense' && G.plants.some(p => p.sp === id && near(p.x, p.z, 2.4))) foundClue(id, i);
    });
  }
  const chId = chapter() && chapter().id;
  if (!cur && chId === 'I' && G.chicken && G.chicken.some(h => near(h.root.position.x, h.root.position.z, 4.5))) tale('hens');
  if (!cur && chId === 'II' && near(G.L.hammock.x, (G.L.hammock.z1 + G.L.hammock.z2) / 2, 3)) tale('pusong');
  if (!cur && chId === 'III' && near(lp.x, lp.z, 2.5)) tale('ilang');
  if (!cur && chId === 'IV' && !talesTabi && G.L.mango.some(([x, z]) => near(x, z, 4))) { talesTabi = true; say([['Ikaw', 'Tabi, tabi…', '(Ikaw whispers it without thinking, the way Lola does)']]); }
}, { order: 93, every: 10 });
let talesTabi = false;

/* ---------- Mata ni Lola (hold O): the view goes soft and dim, scents glow ---------- */
const scentLayer = $('st-scent'), dots = []; for (let i = 0; i < 14; i++) { const d = el('div', 'sc'); scentLayer.appendChild(d); dots.push(d); }
const STRONG = /strong|sweet|very/i; let mata = false;
const setMata = on => { if (mata === on) return; mata = on; document.body.classList.toggle('mata', on); };
G.systems.add('storyMata', () => {
  if (!mata) return; const cam = scene.activeCamera, w = canvas.clientWidth, h = canvas.clientHeight, vp = cam.viewport.toGlobal(w, h), M = scene.getTransformMatrix();
  const list = G.plants.filter(p => HERO.has(p.sp) && STRONG.test(info(p.sp).scent || '') && Math.hypot(p.x - cam.position.x, p.z - cam.position.z) < 16).slice(0, dots.length);
  dots.forEach((d, i) => { const p = list[i]; if (!p) { d.style.opacity = 0; return; } const s = V3.Project(new V3(p.x, p.y + p.H * .7, p.z), G.M4.Identity(), M, vp);
    if (s.z < 0 || s.z > 1) { d.style.opacity = 0; return; } const dd = Math.hypot(p.x - cam.position.x, p.z - cam.position.z); d.style.opacity = G.smooth(16, 3, dd); d.style.transform = `translate(${s.x}px,${s.y}px) scale(${1.6 - dd / 14})`; });
}, { order: 94, every: 2 });

/* ---------- keys (J, O, N, `) ---------- */
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'KeyJ') openJournal();
  else if (e.code === 'KeyO') setMata(true);
  else if (e.code === 'KeyN') next();
  else if (e.code === 'Backquote') { const id = pageId(); if (!st.met) { st.met = true; save(); openPage(); return; } if (id) { page(id).blanks.forEach(([k, a]) => { (st.fill[id] = st.fill[id] || {})[k] = a; }); solvePage(); } }
  else if (e.code === 'Escape') { openJournal(false); tell.classList.remove('on'); }
});
addEventListener('keyup', e => { if (e.code === 'KeyO') setMata(false); });

/* ---------- start ---------- */
function start() {
  const ch = chapter();
  if (params.has('lolacam')) {                                                              // dev: frame Lola from the front
    const lp = G.lola.pos(), f = new V3(Math.sin(G.lola.root.rotation.y), 0, Math.cos(G.lola.root.rotation.y)), d = parseFloat(params.get('lolacam')) || 1.6;
    P.mode = 'static'; scene.activeCamera.position.set(lp.x + f.x * d + .35, lp.y + .75, lp.z + f.z * d); scene.activeCamera.setTarget(new V3(lp.x, lp.y + .45, lp.z));
  } else if (!params.has('walk') && !params.has('cam') && !params.has('at')) {                      // begin at the gate, walking in
    const gx = G.L.arch.x + 3, gz = 0, lp = G.lola.pos(), yaw = Math.atan2(lp.x - gx, lp.z - gz);
    G.controls.setMode('walk'); P.yaw = yaw; P.pitch = .08; G.avatar.enter(gx, gz, yaw); G.avatar.setView('third');
    if (st.met) { const sx = lp.x - Math.sin(yaw) * 3, sz = lp.z - Math.cos(yaw) * 3; G.avatar.enter(sx, sz, yaw); }
  }
  const shot = params.get('storyshot');
  if (shot && shot !== 'card') { G.hud.setTime(ch.u); document.body.classList.toggle('brownout', !!ch.brownout); } else chapterCard(ch, () => { if (st.met) openPage(); refreshGoal(); });
  refreshGoal();
  if (shot === 'journal') { st.met = true; openPage(); const id = pageId(); page(id).clues.forEach((c, i) => foundClue(id, i, true)); cur = null; q.length = 0; sub.classList.remove('on'); openJournal(true); refreshGoal(); }
  if (shot === 'tell') { st.met = true; openPage(); st.picked[pageId()] = true; cur = null; q.length = 0; sub.classList.remove('on'); openTell(); refreshGoal(); }
  if (shot === 'mata') setMata(true);
  if (shot === 'sub') { cur = null; q.length = 0; say([S.prologue[3]]); subT = 1e9; }
}
scene.executeWhenReady(() => { const go = () => { const t = $('title'); if (t) t.classList.add('hide'); start(); }; if (params.has('storyshot')) { const t = $('title'); if (t) t.style.display = 'none'; go(); } else setTimeout(go, 6500); });
G.story = { st, say, openJournal, openTell, tale, next };
})();
