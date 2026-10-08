/* =====================================================================
   engine/time-of-day.js - the day cycle: Buntag, Udto, Hapon, Kilumkilom, Gabii
   Keyframes live in config/settings.js (G.CONFIG.timeKeys). G.applyTime(u) blends them.
   ===================================================================== */
(() => {
const { B, V3, C3, M4, scene, camera, sunLight, moonLight, hemi, skyMat, seaMat, pipe } = G;
/* ---------- time of day: 0 = buntag (morning), .2 = udto (noon), .45 = hapon (golden afternoon), .7 = kilumkilom (dusk), 1 = gabii (night) ---------- */
const KEYS = G.CONFIG.timeKeys;
G.TIME_NAMES = G.CONFIG.timeNames;
G.timeName = u => { let n = G.TIME_NAMES[0][1], best = 9; for (const [k, v] of G.TIME_NAMES) { const d = Math.abs(u - k); if (d < best) { best = d; n = v; } } return n; };
const NUM = ['sunEl', 'sunAz', 'sunI', 'hemiI', 'fogD', 'cloudK', 'moonI', 'exp', 'night'], COL = ['zen', 'hor', 'grd', 'sunCol', 'hemiD', 'hemiG', 'fog', 'cloud', 'deep', 'shal'];
const KC = KEYS.map(([t, s]) => { const o = { t }; NUM.forEach(k => o[k] = s[k]); COL.forEach(k => o[k] = C3.FromHexString(s[k])); return o; });
const moonDir = new V3(.55, .72, .4).normalize(); G.moonDir = moonDir;
G.state = {}; G.timeU = .45;
G.applyTime = u => {
  u = G.clamp(u, 0, 1); G.timeU = u; let a = KC[0], b = KC[KC.length - 1];
  for (let i = 0; i < KC.length - 1; i++) if (u >= KC[i].t && u <= KC[i + 1].t) { a = KC[i]; b = KC[i + 1]; break; }
  const t = b.t === a.t ? 0 : (u - a.t) / (b.t - a.t), S = G.state;
  NUM.forEach(k => S[k] = G.lerp(a[k], b[k], t)); COL.forEach(k => S[k] = C3.Lerp(a[k], b[k], t));
  const el = S.sunEl * Math.PI / 180, ce = Math.cos(el), az = S.sunAz * Math.PI / 180;
  const sunPos = new V3(ce * Math.cos(az), Math.sin(el), ce * Math.sin(az)).normalize(); G.sunDir = sunPos;                // morning sun in the east, evening sun sets over the sea in the west
  sunLight.direction = sunPos.scale(-1); sunLight.diffuse = S.sunCol; sunLight.intensity = S.sunI * G.smooth(-4, 3, S.sunEl);
  moonLight.direction = moonDir.scale(-1); moonLight.diffuse = new C3(.62, .72, 1); moonLight.intensity = S.moonI;   // lights stay ON and are only dimmed: switching a light on/off recompiles every material and stalls the frame
  hemi.diffuse = S.hemiD; hemi.groundColor = S.hemiG; hemi.intensity = S.hemiI;
  scene.fogColor = S.fog; scene.fogDensity = S.fogD; scene.clearColor = new B.Color4(S.hor.r, S.hor.g, S.hor.b, 1);
  skyMat.setColor3('zen', S.zen); skyMat.setColor3('hor', S.hor); skyMat.setColor3('grd', S.grd); skyMat.setVector3('sunDir', sunPos); skyMat.setVector3('moonDir', moonDir);
  skyMat.setColor3('sunCol', S.sunCol); skyMat.setColor3('cloudCol', S.cloud); skyMat.setFloat('nightK', S.night); skyMat.setFloat('cloudK', S.cloudK);
  seaMat.setVector3('sunDir', sunPos); seaMat.setColor3('sunCol', S.sunCol); seaMat.setColor3('deepCol', S.deep); seaMat.setColor3('shallowCol', S.shal); seaMat.setColor3('skyCol', S.hor); seaMat.setColor3('fogCol', S.fog);
  seaMat.setFloat('nightK', S.night); seaMat.setFloat('fogD', S.fogD * .55);
  pipe.imageProcessing.exposure = S.exp;
  G.nightObjs.forEach(o => { o.mat.emissiveColor = C3.Lerp(o.day, o.night, S.night); });
  G.onTime.forEach(f => f(S));
};
scene.onBeforeRenderObservable.add(() => {
  const t = G.clock || 0; skyMat.setFloat('time', t); seaMat.setFloat('time', t); seaMat.setVector3('camPos', camera.position); G.seaAmp = .6 + .5 * Math.min(1.6, Math.max(0, G.windState.gain)); seaMat.setFloat('uAmp', G.seaAmp);
});
})();
