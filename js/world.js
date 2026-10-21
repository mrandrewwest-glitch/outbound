// The 3D-lite office: low-poly boxes, a fixed seat, and a free-look camera.
import * as THREE from '../vendor/three.module.min.js';
import { PLAYER, BIN, COOLER, DRAWER, COWORKERS, OFFICE, AISLE_Z } from './layout.js';
import { G, rand, pick, clamp, pool } from './state.js';
import { COWORKER_SAY } from './content.js';

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02, flatShading: true, ...o });
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
const lerp = (a, b, t) => a + (b - a) * t;

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb9c6d6);
  scene.fog = new THREE.Fog(0xb9c6d6, 12, 30);
  const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 60);
  camera.rotation.order = 'YXZ';

  const world = {
    renderer, scene, camera,
    rig: { yaw: 0, pitch: -0.08, zoom: 0, zoomTarget: 0 },
    coworkers: [], interactables: [], projectiles: [], boss: null,
    onHit: () => {}, time: 0,
  };

  // ---------------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0xf2f6ff, 0x8a8372, 1.35));
  const sun = new THREE.DirectionalLight(0xfff1d6, 0.7);
  sun.position.set(-10, 8, 2); scene.add(sun);
  const desk = new THREE.PointLight(0xfff0dd, 0.8, 8); desk.position.set(0, 2.6, 0); scene.add(desk);
  const lampFront = new THREE.PointLight(0xffffff, 0.6, 10); lampFront.position.set(0, 2.7, -4); scene.add(lampFront);
  const lampBack = new THREE.PointLight(0xffffff, 0.5, 10); lampBack.position.set(0, 2.7, 4); scene.add(lampBack);

  // ---------------------------------------------------------------- room shell
  const carpet = M(0x5d6b7c), wallM = M(0xe9e4da), ceilM = M(0xf6f6f6, { emissive: 0x222222 });
  const floor = box(20, 0.1, 16, carpet, 0, -0.05, -0.5); scene.add(floor);
  const ceil = box(20, 0.1, 16, ceilM, 0, 3.05, -0.5); scene.add(ceil);
  scene.add(box(20, 3.1, 0.2, wallM, 0, 1.5, -8.1));                 // front wall
  scene.add(box(20, 3.1, 0.2, wallM, 0, 1.5, 7.1));                  // back wall
  scene.add(box(0.2, 3.1, 16, wallM, 10.1, 1.5, -0.5));              // right wall
  // left wall with big window
  const winFrame = M(0x2d3138), glass = M(0xcfe8ff, { emissive: 0xaad0ff, emissiveIntensity: 0.8 });
  scene.add(box(0.2, 0.9, 16, wallM, -10.1, 0.45, -0.5));
  scene.add(box(0.2, 0.4, 16, wallM, -10.1, 2.85, -0.5));
  scene.add(box(0.05, 1.8, 15.6, glass, -10.05, 1.8, -0.5));
  for (let z = -7; z <= 6; z += 3.5) scene.add(box(0.12, 1.9, 0.1, winFrame, -10.0, 1.8, z));
  // ceiling light panels
  const lightM = M(0xffffff, { emissive: 0xfffbe6, emissiveIntensity: 1.1 });
  for (let x = -6; x <= 6; x += 3) for (let z = -6; z <= 5; z += 3) scene.add(box(1.4, 0.04, 0.5, lightM, x, 3.0, z));

  // posters + whiteboard on the front wall
  const wb = document.createElement('canvas'); wb.width = 512; wb.height = 256;
  const wx = wb.getContext('2d');
  wx.fillStyle = '#fff'; wx.fillRect(0, 0, 512, 256);
  wx.fillStyle = '#d33'; wx.font = 'bold 34px sans-serif'; wx.fillText('SALES LEADERBOARD', 70, 52);
  wx.fillStyle = '#222'; wx.font = '26px sans-serif';
  ['1. Karen ......... 14 sales', '2. Trev ........... 11 sales', '3. YOU ............ ??? (hurry)', '4. The intern .... 9 sales'].forEach((t, i) => wx.fillText(t, 60, 100 + i * 36));
  wx.fillStyle = '#2a7'; wx.font = 'bold 22px sans-serif'; wx.fillText('Remember: Be a Closer!', 120, 240);
  const wbTex = new THREE.CanvasTexture(wb);
  const wbMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: wbTex }));
  wbMesh.position.set(0, 1.7, -7.98); scene.add(wbMesh);
  const poster = (txt, sub, col, x, z, rotY) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 320; const g = c.getContext('2d');
    g.fillStyle = col; g.fillRect(0, 0, 256, 320); g.fillStyle = '#fff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center';
    g.fillText(txt, 128, 130); g.font = '24px sans-serif'; g.fillText(sub, 128, 180);
    g.font = '80px sans-serif'; g.fillText('🐱', 128, 280);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
    m.position.set(x, 1.7, z); m.rotation.y = rotY; scene.add(m);
  };
  poster('HANG IN', 'THERE', '#3b6fb6', -5.5, -7.98, 0);
  poster('TEAMWORK', 'makes the dream work', '#a8483c', 5.5, -7.98, 0);

  // ---------------------------------------------------------------- furniture helpers
  const deskM = M(0x9b7b57), metal = M(0x3b4048), darkM = M(0x1d1f24), white = M(0xf2f2f2), plasticM = M(0x303338);
  function deskUnit(x, z, rotY, w = 1.5, d = 0.9) {
    const g = new THREE.Group();
    g.add(box(w, 0.06, d, deskM, 0, 0.75, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(box(0.06, 0.72, 0.06, metal, a * (w / 2 - 0.05), 0.36, b * (d / 2 - 0.05))));
    g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g); return g;
  }
  function chair(x, z, rotY, col = 0x2c3a52) {
    const g = new THREE.Group(); const m = M(col);
    g.add(box(0.5, 0.08, 0.5, m, 0, 0.5, 0)); g.add(box(0.5, 0.6, 0.08, m, 0, 0.82, -0.25));
    g.add(box(0.06, 0.4, 0.06, metal, 0, 0.26, 0)); g.add(box(0.5, 0.04, 0.06, metal, 0, 0.04, 0)); g.add(box(0.06, 0.04, 0.5, metal, 0, 0.04, 0));
    g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g); return g;
  }
  function monitor(x, y, z, rotY, w, h, tex) {
    const g = new THREE.Group();
    g.add(box(w + 0.08, h + 0.08, 0.04, plasticM, 0, 0, 0));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
    scr.position.z = 0.025; g.add(scr);
    const neckH = Math.max(0.05, y - h / 2 - 0.78);
    g.add(box(0.06, neckH, 0.06, metal, 0, -h / 2 - neckH / 2, -0.04));
    g.add(box(0.3, 0.02, 0.2, metal, 0, -(y - 0.79), -0.04));
    g.position.set(x, y, z); g.rotation.y = rotY; scene.add(g); return { g, scr };
  }
  function plant(x, z) {
    const g = new THREE.Group(); g.add(box(0.3, 0.3, 0.3, M(0xb5651d), 0, 0.15, 0));
    for (let i = 0; i < 5; i++) { const l = box(0.1, 0.5, 0.1, M(0x2e8b3d), rand(-.1, .1), 0.55, rand(-.1, .1)); l.rotation.set(rand(-.5, .5), 0, rand(-.5, .5)); g.add(l); }
    g.position.set(x, 0, z); scene.add(g);
  }

  // ---------------------------------------------------------------- player's desk
  const mkTex = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.userData = { c, g: c.getContext('2d') }; return t; };
  const mainTex = mkTex(256, 144);
  deskUnit(0, -0.95, 0, 2.0, 0.9);
  const mon = monitor(0, 1.2, -1.15, 0, 0.9, 0.506, mainTex);
  mon.g.userData.kind = 'monitor'; mon.scr.userData.kind = 'monitor'; world.interactables.push(mon.scr, mon.g.children[0]);
  const sideTex = mkTex(128, 80);
  const mon2 = monitor(-0.95, 1.08, -1.0, 0.45, 0.46, 0.28, sideTex);
  paintSide();
  world.monitorPos = new THREE.Vector3(0, 1.2, -1.12);
  // keyboard + mouse + desk phone
  scene.add(box(0.5, 0.02, 0.17, darkM, 0, 0.79, -0.72));
  scene.add(box(0.07, 0.02, 0.1, darkM, 0.4, 0.79, -0.72));
  scene.add(box(0.2, 0.08, 0.26, M(0x222831), 0.8, 0.82, -0.75));
  // stress ball
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), M(0xe34d4d));
  ball.position.set(-0.68, 0.84, -0.7); ball.userData.kind = 'ball'; scene.add(ball); world.interactables.push(ball);
  // coffee mug
  scene.add(box(0.07, 0.09, 0.07, white, 0.55, 0.83, -0.62));
  // player chair + drawer
  chair(0, 0.35, 0, 0x3a2f2f);
  const drawer = box(0.5, 0.7, 0.5, M(0x6a7077), DRAWER.x, 0.35, DRAWER.z);
  drawer.userData.kind = 'drawer'; scene.add(drawer); world.interactables.push(drawer);
  const handle = box(0.2, 0.04, 0.04, M(0xd4af37), DRAWER.x, 0.52, DRAWER.z + 0.27); scene.add(handle); handle.userData.kind = 'drawer'; world.interactables.push(handle);
  const label = box(0.3, 0.08, 0.01, M(0xffffff), DRAWER.x, 0.62, DRAWER.z + 0.255); scene.add(label);
  // bin
  const binG = new THREE.Group();
  const binBody = new THREE.Mesh(new THREE.CylinderGeometry(BIN.r, BIN.r * 0.82, BIN.h, 14, 1, true), M(0x2c3e50, { side: THREE.DoubleSide }));
  binBody.position.y = BIN.h / 2; binG.add(binBody);
  const binBase = new THREE.Mesh(new THREE.CylinderGeometry(BIN.r * 0.82, BIN.r * 0.82, 0.02, 14), M(0x1d2733)); binBase.position.y = 0.01; binG.add(binBase);
  const binRim = new THREE.Mesh(new THREE.TorusGeometry(BIN.r, 0.015, 6, 20), M(0x91a5b8)); binRim.rotation.x = Math.PI / 2; binRim.position.y = BIN.h; binG.add(binRim);
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(BIN.r + 0.1, BIN.r + 0.1, BIN.h + 0.2, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = BIN.h / 2; hit.userData.kind = 'bin'; binG.add(hit); world.interactables.push(hit);
  binG.position.set(BIN.x, 0, BIN.z); scene.add(binG);
  world.binSpot = new THREE.Vector3(BIN.x, BIN.h + 0.05, BIN.z);
  // sign over the bin (for fun)
  const sign = (text, x, y, z, rotY = 0, w = 0.9) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = '#ffd84a'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#222'; g.font = 'bold 28px sans-serif'; g.textAlign = 'center'; g.fillText(text, 128, 42);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) }));
    m.position.set(x, y, z); m.rotation.y = rotY; scene.add(m);
  };
  sign('🗑 AIM HERE', BIN.x, 1.0, BIN.z + 0.5, 0, 0.7);

  // water cooler
  const coolerG = new THREE.Group();
  coolerG.add(box(0.4, 0.9, 0.4, M(0xdfe6ee), 0, 0.45, 0));
  coolerG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.5, 12), M(0x8ec9ff, { transparent: true, opacity: 0.75 }))); coolerG.children[1].position.y = 1.15;
  coolerG.position.set(COOLER.x, 0, COOLER.z);
  const coolerHit = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), new THREE.MeshBasicMaterial({ visible: false })); coolerHit.position.y = 0.8; coolerHit.userData.kind = 'cooler';
  coolerG.add(coolerHit); world.interactables.push(coolerHit); scene.add(coolerG);
  plant(-6.2, 1.3); plant(6.0, -1.5); plant(-8.0, -4.5); plant(8.5, -6.5);

  // ---------------------------------------------------------------- people
  function makePerson({ shirt, skin, hair, sitting = true, tie = null, scale = 1, brows = false }) {
    const g = new THREE.Group(); const u = {};
    const skinM = M(skin), shirtM = M(shirt), pants = M(0x2b2f3a);
    const hipY = sitting ? 0.5 : 0.85;
    u.torso = box(0.44, 0.56, 0.26, shirtM, 0, hipY + 0.3, 0); g.add(u.torso);
    u.head = new THREE.Group(); u.head.position.set(0, hipY + 0.72, 0); g.add(u.head);
    u.head.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), skinM));
    const hairM = M(hair);
    const hr = box(0.3, 0.1, 0.3, hairM, 0, 0.1, -0.02); u.head.add(hr);
    const eyeM = M(0x111111);
    u.eyeL = box(0.03, 0.03, 0.02, eyeM, -0.05, 0.02, 0.13); u.eyeR = box(0.03, 0.03, 0.02, eyeM, 0.05, 0.02, 0.13); u.head.add(u.eyeL, u.eyeR);
    u.mouth = box(0.07, 0.015, 0.02, M(0x7a2a2a), 0, -0.06, 0.13); u.head.add(u.mouth);
    if (brows) { u.bL = box(0.06, 0.012, 0.02, eyeM, -0.05, 0.065, 0.135); u.bR = box(0.06, 0.012, 0.02, eyeM, 0.05, 0.065, 0.135); u.bL.rotation.z = -0.4; u.bR.rotation.z = 0.4; u.head.add(u.bL, u.bR); }
    if (tie) { g.add(box(0.07, 0.34, 0.02, M(tie), 0, hipY + 0.38, 0.14)); }
    // arms pivot at shoulder
    u.armL = new THREE.Group(); u.armR = new THREE.Group();
    u.armL.position.set(-0.28, hipY + 0.52, 0); u.armR.position.set(0.28, hipY + 0.52, 0);
    u.armL.add(box(0.12, 0.5, 0.12, shirtM, 0, -0.22, 0)); u.armR.add(box(0.12, 0.5, 0.12, shirtM, 0, -0.22, 0));
    u.armL.children[0].geometry.translate(0, 0, 0); g.add(u.armL, u.armR);
    if (sitting) {
      u.armL.rotation.x = -1.1; u.armR.rotation.x = -1.1;
      g.add(box(0.16, 0.16, 0.5, pants, -0.12, 0.5, 0.25)); g.add(box(0.16, 0.16, 0.5, pants, 0.12, 0.5, 0.25));
      g.add(box(0.14, 0.5, 0.14, pants, -0.12, 0.25, 0.5)); g.add(box(0.14, 0.5, 0.14, pants, 0.12, 0.25, 0.5));
    } else {
      u.legL = new THREE.Group(); u.legR = new THREE.Group(); u.legL.position.set(-0.12, hipY, 0); u.legR.position.set(0.12, hipY, 0);
      u.legL.add(box(0.16, 0.85, 0.18, pants, 0, -0.42, 0)); u.legR.add(box(0.16, 0.85, 0.18, pants, 0, -0.42, 0)); g.add(u.legL, u.legR);
    }
    g.scale.setScalar(scale);
    g.userData.u = u; return g;
  }

  const labels = document.getElementById('labels');
  function makeLabel(name) {
    const el = document.createElement('div'); el.className = 'tag';
    el.innerHTML = `<span class="nm">${name}</span><span class="mood">😐</span><div class="say"></div>`;
    labels.appendChild(el); return el;
  }

  COWORKERS.forEach((c, i) => {
    const grp = new THREE.Group();
    const dirX = Math.sin(c.rot), dirZ = Math.cos(c.rot);
    const p = makePerson({ shirt: c.shirt, skin: c.skin, hair: c.hair, sitting: true });
    p.position.set(c.x, 0, c.z); p.rotation.y = c.rot; scene.add(p);
    chair(c.x - dirX * 0.1, c.z - dirZ * 0.1, c.rot + Math.PI, 0x3d3d46);
    // desk in front
    deskUnit(c.x + dirX * 0.95, c.z + dirZ * 0.95, c.rot, 1.5, 0.9);
    const tex = mkTex(128, 80); paintMini(tex, i);
    const mm = monitor(c.x + dirX * 1.15, 1.12, c.z + dirZ * 1.15, c.rot + Math.PI, 0.5, 0.3, tex);
    const hitM = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    hitM.position.set(c.x, 1.0, c.z); hitM.userData.kind = 'cow'; hitM.userData.index = i; scene.add(hitM); world.interactables.push(hitM);
    const cw = { ...c, index: i, mesh: p, u: p.userData.u, anger: 0, label: makeLabel(c.name), sayT: 0, anim: 0, animT: rand(1, 4), hitT: 0, nextTalk: rand(6, 14), tex };
    world.coworkers.push(cw);
  });

  // boss + his glass office
  const bossP = makePerson({ shirt: 0x2f3f66, skin: 0xe8b894, hair: 0x555555, sitting: false, tie: 0xcc2222, scale: 1.1, brows: true });
  scene.add(bossP);
  world.boss = { mesh: bossP, u: bossP.userData.u, label: makeLabel('Greg (Boss)'), sayT: 0, big: false };
  world.boss.label.classList.add('boss');
  const glassM = M(0xbfe0ee, { transparent: true, opacity: 0.25 });
  scene.add(box(0.05, 2.6, 1.2, glassM, 5.3, 1.3, 2.1));   // glass wall, door gap between z 2.7 and 3.7
  scene.add(box(0.05, 2.6, 3.3, glassM, 5.3, 1.3, 5.35));
  scene.add(box(4.7, 2.6, 0.05, glassM, 7.7, 1.3, 1.5));
  deskUnit(8.5, 5.4, Math.PI, 2.0, 1.0);
  chair(8.5, 4.6, 0, 0x111111);
  scene.add(box(0.05, 3, 5.4, wallM, 9.95, 1.5, 4.0));
  sign('GREG — REGIONAL MANAGER', 5.2, 2.5, 2.2, Math.PI / 2, 1.4);

  // ---------------------------------------------------------------- screen textures
  const SCREEN = { crm: ['#1d4f91', '📞 CRM'], vid: ['#c0152b', '▶ VidTube'], arcade: ['#1f7a3a', '🎮 Arcade'], chat: ['#5b2a86', '💬 Chatter'], swipr: ['#e0457b', '🔥 Swipr'], shop: ['#d98a00', '🛒 Amazoom'], notes: ['#f2f2f2', '📝 Notepad'] };
  world.setScreen = app => {
    const [col, txt] = SCREEN[app] || SCREEN.crm; const { c, g } = mainTex.userData;
    g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, c.width, 18); g.fillRect(16, 40, 150, 10); g.fillRect(16, 60, 200, 10); g.fillRect(16, 80, 120, 10);
    g.fillStyle = app === 'notes' ? '#222' : '#fff'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText(txt, 128, 128);
    mainTex.needsUpdate = true;
  };
  world.setScreen('crm');
  function paintSide() {
    const { c, g } = sideTex.userData; g.fillStyle = '#10151c'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#4ade80'; for (let i = 0; i < 8; i++) g.fillRect(8 + i * 14, 70 - rand(8, 50), 9, 70);
    g.fillStyle = '#fff'; g.font = '10px monospace'; g.fillText('CALL QUEUE  ▮▮▮', 8, 12);
    sideTex.needsUpdate = true;
  }
  function paintMini(tex, i) {
    const { c, g } = tex.userData; g.fillStyle = ['#223', '#322', '#232', '#332'][i]; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#9cf'; for (let k = 0; k < 6; k++) g.fillRect(8, 10 + k * 11, 30 + rand(0, 80), 5);
    tex.needsUpdate = true;
  }

  // ---------------------------------------------------------------- projectiles
  const KINDS = {
    paper:   { r: 0.055, color: 0xffffff, bounce: 0.25, anger: 16, name: 'paper ball' },
    band:    { r: 0.03,  color: 0xff9f1c, bounce: 0.2,  anger: 22, name: 'rubber band' },
    stress:  { r: 0.07,  color: 0x4d8de3, bounce: 0.8,  anger: 20, name: 'stress ball' },
    stapler: { r: 0.06,  color: 0xd9262c, bounce: 0.1,  anger: 38, name: 'stapler' },
  };
  world.KINDS = KINDS;
  const geoms = {};
  world.throwAt = (kind, target, spread = 0, from = 'player', who = null) => {
    const k = KINDS[kind]; if (!k) return;
    const origin = from === 'player' ? new THREE.Vector3(0.18, 1.0, -0.15).add(new THREE.Vector3(camera.position.x, 0, camera.position.z)) : from;
    const tgt = target.clone().add(new THREE.Vector3(rand(-spread, spread), rand(-spread, spread) * 0.6, rand(-spread, spread)));
    const dist = origin.distanceTo(tgt); const T = clamp(dist / 9, 0.3, 1.2);
    const vel = tgt.sub(origin).divideScalar(T); vel.y += 0.5 * 9.8 * T;
    const geom = kind === 'stapler' ? (geoms.s ||= new THREE.BoxGeometry(0.14, 0.05, 0.05)) : (geoms[kind] ||= new THREE.SphereGeometry(k.r, 8, 6));
    const mesh = new THREE.Mesh(geom, M(k.color)); mesh.position.copy(origin); scene.add(mesh);
    world.projectiles.push({ mesh, vel, kind, from, who, life: 6, scored: false, dead: false });
  };

  function removeProj(p) { scene.remove(p.mesh); p.dead = true; }

  function updateProjectiles(dt) {
    for (const p of world.projectiles) {
      if (p.dead) continue;
      p.life -= dt; if (p.life <= 0) { removeProj(p); continue; }
      const k = KINDS[p.kind] || KINDS.paper;
      p.vel.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 9; p.mesh.rotation.z += dt * 6;
      const pos = p.mesh.position;
      if (pos.y < k.r) { pos.y = k.r; p.vel.y *= -k.bounce; p.vel.x *= 0.7; p.vel.z *= 0.7; if (Math.abs(p.vel.y) > 1) world.onHit('floor', p); if (Math.abs(p.vel.y) < 0.4) p.vel.y = 0; }
      if (p.from !== 'player') {
        // retaliation -> check the player's head
        if (pos.distanceTo(new THREE.Vector3(camera.position.x, camera.position.y - 0.05, camera.position.z)) < 0.55) { world.onHit('player', p); removeProj(p); }
        continue;
      }
      // bin
      const dx = pos.x - BIN.x, dz = pos.z - BIN.z;
      if (!p.scored && Math.hypot(dx, dz) < BIN.r - 0.03 && pos.y < BIN.h + 0.02 && pos.y > 0.05 && p.vel.y < 0) { p.scored = true; p.vel.set(0, -1, 0); p.mesh.position.x = BIN.x + dx * 0.3; p.mesh.position.z = BIN.z + dz * 0.3; world.onHit('bin', p); p.life = 0.5; continue; }
      if (p.scored) continue;
      // keep trash from passing through the bin walls
      if (Math.hypot(dx, dz) < BIN.r + 0.05 && Math.hypot(dx, dz) > BIN.r - 0.02 && pos.y < BIN.h) { p.vel.x *= -0.4; p.vel.z *= -0.4; }
      // coworkers
      for (const cw of world.coworkers) {
        if (pos.distanceTo(new THREE.Vector3(cw.x, 1.0, cw.z)) < 0.42) { world.onHit('cow', p, cw); removeProj(p); break; }
      }
      if (p.dead) continue;
      // boss
      const b = world.bossState;
      if (b && b.x < 5.0 && pos.distanceTo(new THREE.Vector3(b.x, 1.25, b.z)) < 0.5) { world.onHit('boss', p); removeProj(p); }
    }
    world.projectiles = world.projectiles.filter(p => !p.dead);
  }

  // ---------------------------------------------------------------- picking
  const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
  world.pick = (cx, cy) => {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(world.interactables, false);
    const everything = ray.intersectObjects(scene.children, true).find(h => h.object.visible && h.object.material && h.object.material.visible !== false && !h.object.userData.ignore);
    const pt = everything ? everything.point : ray.ray.at(8, new THREE.Vector3());
    if (hits.length) { const h = hits[0]; return { kind: h.object.userData.kind, index: h.object.userData.index, point: h.point, far: pt }; }
    return { kind: 'world', point: pt };
  };

  // ---------------------------------------------------------------- speech + labels
  const tmp = new THREE.Vector3();
  function placeLabel(el, x, y, z) {
    tmp.set(x, y, z).project(camera);
    const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.15 && Math.abs(tmp.y) < 1.15;
    el.style.display = vis && !world.hideLabels ? 'block' : 'none';
    if (vis) el.style.transform = `translate(-50%,-100%) translate(${(tmp.x * 0.5 + 0.5) * innerWidth}px, ${(-tmp.y * 0.5 + 0.5) * innerHeight}px)`;
  }
  world.say = (target, text, sec = 2.6) => {
    const el = target.label.querySelector('.say'); el.textContent = text; el.classList.add('on'); target.sayT = sec;
  };
  function moodEmoji(a) { return a > 75 ? '🤬' : a > 50 ? '😠' : a > 25 ? '😒' : '😐'; }

  // ---------------------------------------------------------------- per-frame
  world.update = dt => {
    world.time += dt; const t = world.time;
    const r = world.rig;
    r.zoom += (r.zoomTarget - r.zoom) * Math.min(1, dt * 7);
    if (Math.abs(r.zoom - r.zoomTarget) < 0.002) r.zoom = r.zoomTarget;
    const z = r.zoom * r.zoom * (3 - 2 * r.zoom);
    // while zoomed in, steer the view onto the monitor
    const yaw = lerp(r.yaw, 0, z), pitch = lerp(r.pitch, -0.01, z);
    const sway = G.drunk > 0 ? Math.sin(t * 1.3) * 0.04 * Math.min(1, G.drunk / 5) : 0;
    camera.position.set(lerp(PLAYER.x, 0, z), lerp(PLAYER.eye, 1.2, z), lerp(PLAYER.z + 0.3, -0.62, z));
    camera.rotation.set(pitch + sway * 0.6, yaw + sway, sway * 0.5);
    camera.fov = 65 + (G.drunk > 0 ? Math.sin(t * 0.9) * 3 : 0); camera.updateProjectionMatrix();
    if (world.shake > 0) { world.shake -= dt; camera.position.x += rand(-1, 1) * world.shake * 0.12; camera.position.y += rand(-1, 1) * world.shake * 0.12; }

    // coworkers
    for (const cw of world.coworkers) {
      const u = cw.u;
      cw.animT -= dt; cw.hitT = Math.max(0, cw.hitT - dt);
      if (cw.animT <= 0) { cw.anim = pick([0, 0, 0, 1, 2, 3]); cw.animT = rand(2, 5); }
      const type = Math.sin(t * 14 + cw.index) * 0.04;
      u.armL.rotation.x = -1.1 + type + (cw.anim === 1 ? -0.8 : 0); u.armR.rotation.x = -1.1 - type + (cw.anim === 2 ? -0.9 : 0);
      u.head.rotation.y = cw.anim === 3 ? Math.sin(t * 2) * 0.6 : Math.sin(t * 0.6 + cw.index) * 0.12;
      u.head.rotation.x = cw.hitT > 0 ? -0.3 : 0.08 + Math.sin(t * 1.1 + cw.index) * 0.03;
      cw.mesh.position.y = cw.hitT > 0 ? Math.abs(Math.sin(t * 40)) * 0.05 : 0;
      u.mouth.scale.y = cw.sayT > 0 ? 1 + Math.abs(Math.sin(t * 14)) * 3 : 1;
      cw.anger = Math.max(0, cw.anger - dt * 1.5);
      cw.nextTalk -= dt;
      if (cw.nextTalk <= 0) { cw.nextTalk = rand(9, 20); if (cw.sayT <= 0) world.say(cw, pick(pool(COWORKER_SAY))); }
      if (cw.sayT > 0) { cw.sayT -= dt; if (cw.sayT <= 0) cw.label.querySelector('.say').classList.remove('on'); }
      cw.label.querySelector('.mood').textContent = moodEmoji(cw.anger);
      placeLabel(cw.label, cw.x, 1.65, cw.z);
    }

    // boss
    const b = world.bossState;
    if (b) {
      const bm = world.boss, u = bm.u;
      bm.mesh.position.set(b.x, 0, b.z); bm.mesh.rotation.y = b.face;
      bm.mesh.scale.setScalar(b.big ? 1.2 : 1.1);
      const walking = b.moving;
      const sw = walking ? Math.sin(t * 8) * 0.6 : 0;
      u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
      u.armL.rotation.x = -sw * 0.7; u.armR.rotation.x = sw * 0.7;
      if (b.state === 'yell' || b.state === 'inspect-wait') { u.armR.rotation.x = -1.6 + Math.sin(t * 10) * 0.3; u.armL.rotation.z = 0.3; } else u.armL.rotation.z = 0;
      u.mouth.scale.y = b.speaking ? 1 + Math.abs(Math.sin(t * 16)) * 4 : 1;
      u.head.rotation.x = b.state === 'inspect-wait' ? 0.3 : 0;
      if (b.big !== bm.lastBig) { bm.lastBig = b.big; bm.mesh.traverse(o => { if (o.material && o.material.color) { const c = o.material.color.getHex(); if (c === 0x2f3f66 || c === 0x222222) o.material.color.setHex(b.big ? 0x222222 : 0x2f3f66); } }); bm.label.querySelector('.nm').textContent = b.big ? 'THE BIG BOSS' : 'Greg (Boss)'; }
      if (bm.sayT > 0) { bm.sayT -= dt; if (bm.sayT <= 0) bm.label.querySelector('.say').classList.remove('on'); }
      placeLabel(bm.label, b.x, 2.15, b.z);
    }

    // projectiles
    updateProjectiles(dt);
    // stress ball squish
    ball.scale.y = 1 + Math.sin(t * 2) * 0.01;
  };

  world.render = () => renderer.render(scene, camera);
  world.resize = () => {
    const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  world.squeeze = () => { ball.scale.set(1.5, 0.5, 1.5); setTimeout(() => ball.scale.set(1, 1, 1), 120); };
  world.hideLabels = false;
  world.shake = 0;
  world.resize();
  return world;
}
