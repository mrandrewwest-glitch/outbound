// Orchestrates the shift: input, HUD, throwing, win/lose.
import * as THREE from '../vendor/three.module.min.js';
import { G, on, emit, $, $$, rand, pick, clamp, say, toast, addSlack, resetState, SHIFT_SECONDS, SHIFT_START, SHIFT_END } from './state.js';
import { initAudio, sfx } from './audio.js';
import { createWorld } from './world.js';
import { boss, bindBoss, resetBoss, updateBoss, callBossNow, bossHit, bossRadar } from './boss.js';
import { initCalls, resetCalls, updateCalls, key as callKey, onModeChange, call } from './calls.js';
import { initApps, resetApps, updateApps, showApp, handleKey, isTyping, setMirror } from './apps.js';
import { newTasks, tasks, progress, doneCount } from './tasks.js';
import { COWORKER_HIT, GOSSIP, DRINKS } from './content.js';
import { COOLER, PLAYER } from './layout.js';

const canvas = $('#c');
const world = createWorld(canvas);
bindBoss(world);
initApps();
initCalls();

let hotbar = 'paper';
const SLOTS = [['paper', '📄', 'Paper ball'], ['band', '➰', 'Rubber band'], ['stress', '🔵', 'Stress ball'], ['stapler', '📎', 'Stapler (heavy)']];
let throwCd = 0, drinkCd = 0, gossipCd = 0, hudT = 0;
const held = new Set();
const BEST_KEY = 'dialtone-best';
const safeGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

// ---------------------------------------------------------------- title screen
const edgyBox = $('#opt-edgy'), soundBox = $('#opt-sound');
edgyBox.checked = safeGet('dialtone-edgy') === '1';
soundBox.checked = safeGet('dialtone-sound') !== '0';
$('#btn-start').onclick = () => { initAudio(); G.edgy = edgyBox.checked; G.sound = soundBox.checked; safeSet('dialtone-edgy', G.edgy ? '1' : '0'); safeSet('dialtone-sound', G.sound ? '1' : '0'); startGame(); };
$('#btn-again').onclick = () => { $('#end').classList.add('hidden'); $('#title').classList.remove('hidden'); };
$('#btn-resume').onclick = () => togglePause();
const best = safeGet(BEST_KEY); if (best) $('#best').textContent = `Your best: ${best}`;

function startGame() {
  resetState(); G.edgy = edgyBox.checked; G.sound = soundBox.checked;
  resetBoss(); resetCalls(); resetApps(); newTasks();
  world.projectiles.forEach(p => world.scene.remove(p.mesh)); world.projectiles = [];
  world.coworkers.forEach(c => { c.anger = 0; });
  $('#title').classList.add('hidden'); $('#end').classList.add('hidden'); $('#hud').classList.remove('hidden');
  document.body.classList.toggle('spicy', G.edgy);
  buildHotbar();
  G.running = true;
  world.rig.yaw = 0; world.rig.pitch = -0.08;
  setMode('screen', true);
  toast('Shift started. Look busy. 📞', 'info');
}

function endGame(reason) {
  if (G.over) return;
  G.over = true; G.running = false;
  setMode('look', true); $('#pc').classList.remove('show');
  const done = doneCount(), total = tasks.length;
  const score = Math.max(0, Math.round(G.slack + G.sales * 120 + done * 150 + G.revenue / 10 - G.strikes * 80));
  let title, sub;
  if (reason === 'fired') { title = 'FIRED 🔥'; sub = G.edgy ? 'Greg bloody sacked you. Security walks you out with your plant.' : 'Greg has asked security to walk you out with your plant.'; }
  else if (done === total && G.sales >= G.quota) { title = 'Employee of the Month (Accidentally) 🏆'; sub = 'Hit quota AND slacked at an elite level. HR is suspicious.'; }
  else if (done >= Math.ceil(total / 2) && G.sales < G.quota) { title = 'Professional Slacker 😎'; sub = 'A true artist. The quota can wait.'; }
  else if (G.sales >= G.quota && done < Math.ceil(total / 2)) { title = 'Suspiciously Productive 🤨'; sub = G.edgy ? 'You actually worked? What the hell is wrong with you?' : 'You actually worked? Are you feeling alright?'; }
  else { title = 'Mediocre in Every Way 😐'; sub = 'Neither good at working nor slacking. Impressive.'; }
  $('#end-title').textContent = title; $('#end-sub').textContent = sub;
  $('#end-stats').innerHTML = `
    <li><span>Score</span><b>${score}</b></li>
    <li><span>Secret objectives</span><b>${done}/${total}</b></li>
    <li><span>Sales</span><b>${G.sales}/${G.quota} ($${G.revenue})</b></li>
    <li><span>Calls taken / missed</span><b>${G.callsTaken} / ${G.missed}</b></li>
    <li><span>Times busted</span><b>${G.stats.busted}</b></li>
    <li><span>Paper balls in the bin</span><b>${G.stats.binShots}</b></li>
    <li><span>Coworkers annoyed</span><b>${G.stats.coworkerHits}</b></li>
    <li><span>Boss hits</span><b>${G.stats.bossHits}</b></li>`;
  const prev = parseInt(safeGet(BEST_KEY) || '0', 10);
  if (score > prev) { safeSet(BEST_KEY, String(score)); $('#end-best').textContent = '🏅 New personal best!'; } else $('#end-best').textContent = `Personal best: ${prev}`;
  const text = `📞 Dial Tone — I scored ${score} as "${title.replace(/ [^\w ]+$/, '')}": ${done}/${total} secret objectives, ${G.sales}/${G.quota} sales, busted ${G.stats.busted}×${G.edgy ? ' 🌶️' : ''}. Beat that.`;
  $('#btn-copy').onclick = () => { navigator.clipboard?.writeText(text).then(() => { $('#btn-copy').textContent = 'Copied! ✅'; }, () => { $('#btn-copy').textContent = text; }); };
  $('#btn-copy').textContent = '📋 Copy score for the team chat';
  $('#end').classList.remove('hidden'); $('#hud').classList.add('hidden');
  sfx.done();
}

// ---------------------------------------------------------------- modes
let showTimer = 0;
function setMode(m, instant = false) {
  G.mode = m;
  world.rig.zoomTarget = m === 'screen' ? 1 : 0;
  if (instant) world.rig.zoom = world.rig.zoomTarget;
  document.body.classList.toggle('mode-screen', m === 'screen');
  document.body.classList.toggle('mode-look', m === 'look');
  clearTimeout(showTimer);
  if (m === 'screen') showTimer = setTimeout(() => $('#pc').classList.add('show'), instant ? 0 : 160);
  else $('#pc').classList.remove('show');
  onModeChange();
  $('#hint').textContent = m === 'screen' ? 'Q: alt-tab to CRM  •  Esc: lean back  •  1-3: reply  •  H: hold  •  Space: answer' : 'Drag to look  •  Click: throw  •  E: lean in  •  1-4: item  •  Space: answer call';
}

on('appChange', app => { world.setScreen(app); });

// ---------------------------------------------------------------- caught
on('caught', ({ line }) => {
  world.shake = 0.9;
  const f = $('#flash'); f.className = 'red'; setTimeout(() => f.className = '', 600);
  const b = $('#busted'); b.querySelector('p').textContent = `"${line}"`; b.querySelector('small').textContent = `Strike ${G.strikes} of ${G.maxStrikes}`;
  b.classList.add('show'); setTimeout(() => b.classList.remove('show'), 2800);
  showApp('crm'); setMode('screen');
  if (G.strikes >= G.maxStrikes) setTimeout(() => endGame('fired'), 1800);
});

// ---------------------------------------------------------------- world hit events
const kindThrown = { paper: 'paper', band: 'band', stress: 'stress', stapler: 'stapler' };
world.onHit = (type, p, cw) => {
  if (!G.running) return;
  if (type === 'bin') {
    G.stats.binShots++; sfx.plink(); progress('bin', 1); addSlack(12, 'Swish! 🗑️');
  } else if (type === 'cow') {
    const k = world.KINDS[p.kind]; cw.anger += k.anger; cw.hitT = 0.45; sfx.thud();
    G.stats.coworkerHits++; progress('hit', 1); addSlack(8);
    world.say(cw, say(COWORKER_HIT), 2.2);
    if (cw.anger > 85) { G.stats.snitched++; cw.anger = 35; if (!callBossNow(`😬 ${cw.name} snitched on you!`)) { boss.hostile = Math.max(boss.hostile, 0.6); toast(`${cw.name} points at you...`, 'bad'); } }
    else if (cw.anger > 45 && Math.random() < 0.55) setTimeout(() => retaliate(cw), rand(900, 1800));
  } else if (type === 'boss') {
    sfx.thud(); bossHit(); progress('hitboss', 1); addSlack(150, 'You hit the BOSS. Legend. 💀');
    toast('😱 RUN. BACK TO THE CRM. NOW.', 'bad'); world.say(world.boss, G.edgy ? 'WHO THE HELL DID THAT?!' : 'WHO THREW THAT?!', 3);
  } else if (type === 'player') {
    sfx.thud(); world.shake = 0.5; G.slack = Math.max(0, G.slack - 10);
    const f = $('#flash'); f.className = 'white'; setTimeout(() => f.className = '', 250);
    toast(`💥 ${p.who || 'Someone'} got you back! (−10)`, 'bad');
  } else if (type === 'floor') { if (Math.random() < 0.5) sfx.thud(); }
};

function retaliate(cw) {
  if (!G.running) return;
  const k = pick(['paper', 'band', 'stress']);
  world.say(cw, G.edgy ? 'Eat this, prick!' : 'Take that!', 1.6);
  world.throwAt(k, world.camera.position.clone(), 0.0, new THREE.Vector3(cw.x, 1.35, cw.z), cw.name);
}

// ---------------------------------------------------------------- interactions
function interact(hit) {
  if (hit.kind === 'monitor') return enterScreen();
  if (hit.kind === 'ball') { sfx.squeak(); world.squeeze(); progress('squeeze', 1); G.slack += 1; return; }
  if (hit.kind === 'drawer') return drink();
  if (hit.kind === 'cooler') return gossip();
  if (throwCd > 0) return;
  throwCd = 0.35;
  let target, spread = 0;
  if (hit.kind === 'bin') { target = world.binSpot.clone(); spread = 0.2; }
  else if (hit.kind === 'cow') { const cw = world.coworkers[hit.index]; target = new THREE.Vector3(cw.x, 1.05, cw.z); spread = 0.06; }
  else target = hit.point.clone();
  sfx.whoosh();
  world.throwAt(hotbar, target, spread);
}

function enterScreen() { if (G.mode === 'screen') return; sfx.click(); setMode('screen'); }
function leaveScreen() { if (G.mode === 'look') return; setMode('look'); }

function drink() {
  if (drinkCd > 0) { toast('Slow down, champ.'); return; }
  drinkCd = 2.5; sfx.gulp();
  progress('drink', 1); addSlack(15);
  toast(say(DRINKS));
  if (G.edgy) G.drunk = Math.min(20, G.drunk + 7);
}

function gossip() {
  if (gossipCd > 0) { toast('Nothing new at the cooler yet.'); return; }
  gossipCd = 12; sfx.click(); progress('gossip', 1); addSlack(10); toast(say(GOSSIP), 'info');
}

// ---------------------------------------------------------------- input
let drag = null;
canvas.addEventListener('pointerdown', e => {
  if (!G.running || G.paused || G.mode !== 'look') return;
  canvas.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, moved: 0 };
});
canvas.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
  world.rig.yaw = world.rig.yaw - dx * 0.0045;
  world.rig.pitch = clamp(world.rig.pitch - dy * 0.0045, -1.1, 0.75);
});
canvas.addEventListener('pointerup', e => {
  if (!drag) return;
  const wasClick = drag.moved < 6; drag = null;
  if (wasClick && G.running && !G.paused && G.mode === 'look') interact(world.pick(e.clientX, e.clientY));
});

addEventListener('keydown', e => {
  if (!G.running || G.paused) { if (e.key.toLowerCase() === 'p' && G.running) togglePause(); return; }
  const k = e.key.toLowerCase();
  if (isTyping(e.target)) { if (k === 'escape') { e.target.blur(); leaveScreen(); } return; }
  if (k === 'p') return togglePause();
  if (G.mode === 'screen') {
    if (handleKey(e)) return;
    if (k === 'escape' || k === 'backspace') { e.preventDefault(); return leaveScreen(); }
    if (k === 'q' || k === 'tab') { e.preventDefault(); sfx.click(); return showApp('crm'); }
    if (k === ' ') { e.preventDefault(); return callKey('a'); }
    callKey(k);
  } else {
    if (k === 'e' || k === 'enter') return enterScreen();
    if (k === ' ') { e.preventDefault(); return callKey('a'); }
    if (['1', '2', '3', '4'].includes(k)) { hotbar = SLOTS[+k - 1][0]; buildHotbar(); return; }
    if (k === 'q') { sfx.click(); showApp('crm'); return enterScreen(); }
    if (k.startsWith('arrow')) { e.preventDefault(); held.add(k); }
  }
});
addEventListener('keyup', e => held.delete(e.key.toLowerCase()));
addEventListener('blur', () => { held.clear(); if (G.running && !G.paused) togglePause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.running && !G.paused) togglePause(); });
addEventListener('resize', () => world.resize());
$('#btn-lean-back').onclick = () => leaveScreen();

function togglePause() {
  G.paused = !G.paused;
  $('#pause').classList.toggle('hidden', !G.paused);
}

function buildHotbar() {
  $('#hotbar').innerHTML = SLOTS.map(([k, ic, nm], i) => `<button class="slot ${k === hotbar ? 'on' : ''}" data-k="${k}"><kbd>${i + 1}</kbd><span>${ic}</span><small>${nm}</small></button>`).join('');
  $$('#hotbar .slot').forEach(b => b.onclick = ev => { ev.stopPropagation(); hotbar = b.dataset.k; buildHotbar(); });
}

// ---------------------------------------------------------------- HUD
function fmtClock(m) {
  const h = Math.floor(m / 60), mm = Math.floor(m % 60), ap = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${ap}`;
}

function updateHud() {
  $('#h-clock').textContent = fmtClock(G.clock); $('#tclock').textContent = fmtClock(G.clock);
  $('#h-strikes').textContent = '💢'.repeat(G.strikes) + '▫️'.repeat(Math.max(0, G.maxStrikes - G.strikes));
  $('#h-sales').textContent = `${G.sales}/${G.quota}`;
  $('#h-slack').textContent = Math.round(G.slack);
  const done = doneCount(); $('#h-tasks').textContent = `${done}/${tasks.length}`;
  const r = bossRadar();
  const bs = $('#h-boss');
  bs.textContent = `👔 ${boss.label}`;
  bs.className = r.state;
  $('#susp').style.width = (G.suspicion * 100) + '%';
  $('#susp-wrap').classList.toggle('on', G.suspicion > 0.02);
  const alert = $('#alert');
  const unsafe = boss.inArc && !(G.mode === 'screen' && G.app === 'crm');
  alert.classList.toggle('show', unsafe);
  setMirror(boss.x - PLAYER.x, r.state);
  $('#h-day').style.width = ((G.clock - SHIFT_START) / (SHIFT_END - SHIFT_START) * 100) + '%';
  document.body.classList.toggle('drunk', G.drunk > 4);
}

// ---------------------------------------------------------------- loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (G.running && !G.paused) {
    G.clock += dt * ((SHIFT_END - SHIFT_START) / SHIFT_SECONDS);
    throwCd -= dt; drinkCd -= dt; gossipCd -= dt; G.drunk = Math.max(0, G.drunk - dt);
    if (G.mode === 'look') {
      if (held.has('arrowleft')) world.rig.yaw += dt * 1.8;
      if (held.has('arrowright')) world.rig.yaw -= dt * 1.8;
      if (held.has('arrowup')) world.rig.pitch = clamp(world.rig.pitch + dt * 1.2, -1.1, 0.75);
      if (held.has('arrowdown')) world.rig.pitch = clamp(world.rig.pitch - dt * 1.2, -1.1, 0.75);
    }
    updateBoss(dt);
    updateCalls(dt);
    updateApps(dt);
    hudT -= dt; if (hudT <= 0) { hudT = 0.1; updateHud(); }
    if (G.clock >= SHIFT_END) endGame('shift');
  }
  world.hideLabels = !G.running;
  if (!G.paused) world.update(dt);
  world.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// handy for the idle title-screen backdrop and debugging
window.__game = { G, world, boss, get tasks() { return tasks; }, endGame };
