/* =====================================================================
   ui/hud.js - the bottom bar: time-of-day slider (Buntag … Gabii), let-time-pass, keys panel
   ===================================================================== */
(() => {
const $ = id => document.getElementById(id), clamp = G.clamp;
const slider = $('time'), tname = $('tname'), keysPanel = $('keys');
let lastName = '';
const showName = () => { const n = G.timeName(G.timeU); if (n !== lastName) { lastName = n; tname.textContent = n; } };
function setTime(u) { u = clamp(u, 0, 1); G.applyTime(u); slider.value = Math.round(u * 100); showName(); }
slider.value = Math.round(G.timeU * 100);
slider.oninput = () => { G.applyTime(slider.value / 100); showName(); };
$('autotime').onclick = function () { G.autoTime = !G.autoTime; this.classList.toggle('on', G.autoTime); };
$('keybtn').onclick = () => keysPanel.classList.toggle('show');

G.hud = {
  setTime, showName,
  toggleKeys: () => keysPanel.classList.toggle('show'),
  hideKeys: () => keysPanel.classList.remove('show'),
};
// P: let time pass slowly (a full day in ~4 minutes)
G.systems.add('autoTime', (t, dt) => { if (!G.autoTime) return; const u = (G.timeU + dt * .004) % 1.0; G.applyTime(u > .999 ? 0 : u); slider.value = Math.round(G.timeU * 100); showName(); }, { order: 5 });
})();
