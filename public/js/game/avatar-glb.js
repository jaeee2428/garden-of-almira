/* =====================================================================
   game/avatar-glb.js - Ikaw's body from a ready-made model, driven by our own movement code
   Model: "Formal" (a girl in a sundress) from Quaternius' Ultimate Modular Women pack, CC0
   (public/assets/avatar/ikaw.gltf + LICENSE.txt). It is rigged and comes with Idle / Walk / Run / Wave clips.
   game/avatar.js still does everything that moves her (physics, facing, lean, sitting, the duyan); this file
     - puts the model on her root node at her height (1.58 m x CONFIG.avatar.scale), recoloured to her config colours
     - blends Idle / Walk / Run by speed, and plays each clip at the speed that keeps the planted foot still
       (the clip's own ground speed is measured once from its foot bones)
     - plays Wave on G; crouching and sitting bend the model's own leg bones after the clips are applied
   The hand-built body in avatar.js is hidden (and its CPU cloth/hair work skipped) once this is ready. ?procavatar=1 keeps it.
   ===================================================================== */
(() => {
const { B, V3, scene, clamp } = G; const A = G.avatar;
if (!A || G.params.has('procavatar') || !B.SceneLoader) return;
const C = G.CONFIG.avatar, HEIGHT = 1.58 * (C.scale || 1), sm = G.smooth, PH = G.physics;
const holder = new B.TransformNode('ikawBody', scene); holder.parent = A.root;
const lin = hex => B.Color3.FromHexString(hex);
const COLOURS = { Skin: lin(C.skin), Red: lin(C.hair), LimeGreen: lin(C.dress), Gold: lin(C.trim), Brown: lin('#2a1c14') };   // Red = her hair and shoes in this model

B.SceneLoader.ImportMeshAsync(null, '/assets/avatar/', 'ikaw.gltf', scene).then(res => {
  const top = res.meshes[0]; top.parent = holder;
  res.animationGroups.forEach(g => g.stop());
  // one flat standard material per colour (matches the rest of the garden's lighting), shadows on
  const mats = {};
  res.meshes.forEach(m => { if (!m.material) return; const n = m.material.name, mt = mats[n] || (mats[n] = G.mat('ikaw_' + n, { diffuse: COLOURS[n] || (m.material.albedoColor ? m.material.albedoColor.toGammaSpace() : lin('#888888')), specular: new B.Color3(.06, .05, .05), power: 18, emissive: new B.Color3(.07, .055, .05) }));
    if (m.material.sideOrientation !== undefined && m.material.sideOrientation !== null) mt.sideOrientation = m.material.sideOrientation;   // glTF faces wind the other way: keep the loader's setting or she renders inside-out (lit from behind)
    m.material = mt; m.isPickable = false; m.receiveShadows = true; G.cast(m); m.alwaysSelectAsActiveMesh = true; });
  // size: bind-pose height -> her height, feet on the ground
  const nodesOf = n => res.transformNodes.find(q => q.name === n);
  const updateAll = () => { top.computeWorldMatrix(true); res.transformNodes.forEach(q => q.computeWorldMatrix(true)); res.meshes.forEach(q => q.computeWorldMatrix(true)); };
  updateAll(); let lo = 1e9, hi = -1e9; res.meshes.forEach(m => { if (!m.getTotalVertices || !m.getTotalVertices()) return; m.refreshBoundingInfo(); const bb = m.getBoundingInfo().boundingBox; lo = Math.min(lo, bb.minimumWorld.y); hi = Math.max(hi, bb.maximumWorld.y); });
  const headMeshes = res.meshes.filter(m => m.getTotalVertices && m.getTotalVertices() && m.getBoundingInfo().boundingBox.minimumWorld.y > lo + .78 * (hi - lo));   // head + hair: hidden in first person
  const rs = A.root.scaling.y || 1, base = holder.getAbsolutePosition().y, s = HEIGHT / Math.max(.1, hi - lo); holder.scaling.setAll(s); holder.position.y = -(lo - base) / rs * s;
  const bone = {}; ['Hips', 'UpperLeg.L', 'UpperLeg.R', 'LowerLeg.L', 'LowerLeg.R', 'Foot.L', 'Foot.R', 'Torso', 'Head'].forEach(n => bone[n] = nodesOf(n));
  // clips
  const clip = n => res.animationGroups.find(g => g.name === n);
  const G_ = { idle: clip('Idle_Neutral') || clip('Idle'), walk: clip('Walk'), run: clip('Run'), wave: clip('Wave') };
  // measure how fast each locomotion clip moves the ground under the planted foot (m/s at her size), so playback can match her real speed
  const measure = g => { if (!g || !bone['Foot.L']) return 0; g.start(true, 1); g.pause(); const f0 = g.from, f1 = g.to, fps = g.targetedAnimations[0].animation.framePerSecond, N = 48; let dist = 0, time = 0, last = null;
    for (let i = 0; i <= N; i++) { g.goToFrame(f0 + (f1 - f0) * i / N); updateAll(); const inv = B.Matrix.Invert(holder.getWorldMatrix()), pl = B.Vector3.TransformCoordinates(bone['Foot.L'].getAbsolutePosition(), inv), pr = B.Vector3.TransformCoordinates(bone['Foot.R'].getAbsolutePosition(), inv), low = pl.y < pr.y ? 0 : 1, p = low ? pr : pl;
      if (last && last.low === low) { dist += Math.abs(p.z - last.p.z) * s; time += (f1 - f0) / N / fps; } last = { low, p }; }
    g.stop(); return time > 0 ? dist / time : 0; };
  const vWalk = measure(G_.walk) || 1.3, vRun = measure(G_.run) || 3.6;
  if (G.params.has('perf')) console.log('IKAW clip speeds walk=' + vWalk.toFixed(2) + ' run=' + vRun.toFixed(2) + ' scale=' + s.toFixed(3));
  Object.values(G_).forEach(g => { if (g) { g.start(true, 1); g.weight = 0; } }); if (G_.idle) G_.idle.weight = 1;
  // hide the hand-built body and switch
  A.glb = true; (A.procMeshes || []).forEach(m => m.setEnabled(false));
  A.onView = v => headMeshes.forEach(m => m.setEnabled(v === 'third')); A.onView(A.view);

  const W = { idle: 1, walk: 0, run: 0, wave: 0 }; let lastWave = 0;
  G.systems.add('ikawBody', (t, dt) => {
    if (!A.active) return;
    const hv = A.speed || 0, m = clamp(Math.max(A.gm || 0, .45 * (A.turnK || 0)), 0, 1), runK = sm(C.walk + .3, C.run, hv), air = A.grounded ? 0 : 1, sit = A.seat ? clamp(A.sitK || 0, 0, 1) : 0;
    if ((A.waveT || 0) > lastWave + .5 && G_.wave) G_.wave.goToFrame(G_.wave.from);              // a new wave starts at the beginning
    lastWave = A.waveT || 0; const waving = lastWave > 0 ? 1 : 0;
    const tgt = { walk: (1 - runK) * m * (1 - sit), run: runK * m * (1 - sit), wave: waving * (1 - m * .6) * (1 - sit), idle: 0 }; tgt.idle = Math.max(0, 1 - tgt.walk - tgt.run - tgt.wave);
    for (const k in W) { W[k] = PH.damp(W[k], tgt[k], 10, dt); if (G_[k]) G_[k].weight = W[k]; }
    if (G_.walk) G_.walk.speedRatio = clamp(hv > .2 ? hv / vWalk : (A.turnK > .05 ? .7 : 1), .45, 2.7) * (air ? .3 : 1);
    if (G_.run) G_.run.speedRatio = clamp(hv > .2 ? hv / vRun : 1, .5, 2.4) * (air ? .3 : 1);
    // keep walk and run in step so the blend between them never scissors the legs
    if (G_.walk && G_.run && W.walk > .02 && W.run > .02) { const wa = G_.walk.animatables[0], ra = G_.run.animatables[0]; if (wa && ra) { const fw = (wa.masterFrame - G_.walk.from) / (G_.walk.to - G_.walk.from); ra.goToFrame(G_.run.from + fw * (G_.run.to - G_.run.from)); } }
  }, { order: 7 });

  // crouch and sit: bend the model's own leg bones after the clips have posed it (eased by avatar.js: A.crouch, A.sitK)
  const qx = new B.Quaternion(), X = new V3(1, 0, 0);
  const bend = (n, ang) => { const b = bone[n]; if (!b || !b.rotationQuaternion || Math.abs(ang) < 1e-4) return; B.Quaternion.RotationAxisToRef(X, ang, qx); b.rotationQuaternion.multiplyInPlace(qx); };
  const K = { thigh: G.params.has('ikawflip') ? 1 : -1 };                                     // bend direction of the leg bones (dev switch to flip)
  scene.onAfterAnimationsObservable.add(() => {
    if (!A.glb || !A.active) return;
    const ck = G.ease.inOutSine(clamp(A.crouch || 0, 0, 1)), sk = A.seat ? G.ease.inOutSine(clamp(A.sitK || 0, 0, 1)) : 0;
    const th = (.95 * ck) * (1 - sk) + 1.5 * sk, kn = (1.7 * ck) * (1 - sk) + 1.5 * sk, ft = (.75 * ck) * (1 - sk);
    for (const sd of ['L', 'R']) { bend('UpperLeg.' + sd, K.thigh * th); bend('LowerLeg.' + sd, -K.thigh * kn); bend('Foot.' + sd, K.thigh * ft); }
    // lower the body: crouch ~26 cm; seated, the hips come down onto the seat
    let drop = .26 * ck * (1 - sk);
    if (sk > 0) { const st = A.seat, gy = G.hFn(A.x, A.z), hipH = .93 * (C.scale || 1); drop = Math.max(0, hipH - (st.y - gy) - .02) * sk; }
    holder.position.y = holder.position.y * 0 + (holder._baseY ?? (holder._baseY = holder.position.y)) - drop / (A.root.scaling.y || 1);
  });
}).catch(e => console.warn('[ikaw] glTF body not loaded, keeping the hand-built one:', e && e.message));
})();
