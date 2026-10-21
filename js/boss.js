// The boss: patrols behind your chair, drops in to inspect, yells at coworkers,
// and busts you when you're caught slacking inside his line of sight.
import { G, rand, pick, clamp, say, toast, emit, SHIFT_START, SHIFT_END } from './state.js';
import { sfx } from './audio.js';
import { OFFICE, DOOR, AISLE_W, AISLE_Z, WATCH_SPOT, COWORKERS, PLAYER } from './layout.js';
import { BOSS_YELL, BIG_BOSS_YELL, COWORKER_NICE } from './content.js';

export const boss = {
  x: OFFICE.x, z: OFFICE.z, face: Math.PI, moving: false, state: 'office', label: 'In his office',
  path: [], wait: 0, watch: false, inArc: false, strict: 1, big: false, speaking: '', timer: 8,
  stepT: 0, coughed: false, bigDone: false, hostile: 0, justCaught: 0,
};

const SPEED = 1.55;
let world = null, allies = [];
export function bindBoss(w) { world = w; allies = w.coworkers; w.bossState = boss; }

export function resetBoss() {
  Object.assign(boss, { x: OFFICE.x, z: OFFICE.z, face: Math.PI, moving: false, state: 'office', label: 'In his office', path: [], wait: 0, watch: false, inArc: false, strict: 1, big: false, speaking: '', timer: rand(14, 20), stepT: 0, coughed: false, bigDone: false, hostile: 0, justCaught: 0 });
  G.suspicion = 0;
}

// ---- the routes ----
const to = (x, z, o = {}) => ({ x, z, ...o });
const out = (o = {}) => to(DOOR.x, DOOR.z, { watch: true, ...o });
const home = () => [to(DOOR.x, DOOR.z, { watch: false, label: 'Heading back' }), to(OFFICE.x, OFFICE.z, { watch: false, face: Math.PI, end: true })];

function progressMul() { return clamp((G.clock - SHIFT_START) / (SHIFT_END - SHIFT_START), 0, 1); }

function route(kind) {
  boss.coughed = false;
  if (kind === 'patrol') {
    boss.label = 'Patrolling'; boss.state = 'walk';
    boss.path = [out({ sfx: 'door' }), to(0, AISLE_Z, { watch: true, wait: rand(0.2, 1.4) }), to(AISLE_W.x, AISLE_W.z, { watch: true, wait: rand(0.4, 1.2) }), to(0, AISLE_Z, { watch: true, wait: rand(0.2, 1.0) }), ...home()];
  } else if (kind === 'inspect') {
    boss.label = 'Coming to look at your screen!'; boss.state = 'walk';
    boss.path = [out({ sfx: 'door' }), to(0, AISLE_Z, { watch: true }), to(WATCH_SPOT.x, WATCH_SPOT.z, { watch: true, wait: boss.big ? 6 : 3.4, state: 'inspect-wait', face: 0, strict: boss.big ? 2.0 : 1.6, label: 'Looking over your shoulder' }), to(0, AISLE_Z, { watch: true }), ...home()];
  } else if (kind === 'visit') {
    const cw = pick(COWORKERS);
    boss.label = `Chewing out ${cw.name}`; boss.state = 'walk';
    const vx = cw.via ?? cw.spot.x;
    boss.path = [out({ sfx: 'door' }), to(vx, AISLE_Z, { watch: false }), to(vx, cw.spot.z, { watch: false }), to(cw.spot.x, cw.spot.z, { watch: false, wait: 4.5, state: 'yell', lookAt: cw, say: { c: 'Why is your screen not on the CRM?!', e: 'Why the hell is your screen not on the CRM?!' } }), to(vx, cw.spot.z, { watch: false }), to(vx, AISLE_Z, { watch: false }), ...home()];
  } else if (kind === 'phone') {
    const px = rand(-4, 4);
    boss.label = 'On the phone (distracted)'; boss.state = 'walk';
    boss.path = [out({ sfx: 'door', watch: false }), to(px, AISLE_Z, { watch: false, wait: 5, state: 'phone', face: Math.PI, say: { c: '📞 Yes, Janet, synergy, absolutely...', e: '📞 Yeah mate, the team is a bloody circus...' } }), ...home()];
  }
}

function pickRoute() {
  const p = progressMul();
  const r = Math.random();
  if (r < 0.40) return 'patrol';
  if (r < 0.40 + 0.22 + p * 0.1) return 'inspect';
  if (r < 0.85) return 'visit';
  return 'phone';
}

export function callBossNow(why) {
  if (boss.state !== 'office') return false;
  boss.timer = 0.2; boss.forceInspect = true;
  if (why) toast(why, 'bad');
  return true;
}

function nodeArrive(n) {
  if (n.wait) boss.wait = n.wait;
  if (n.state) boss.state = n.state;
  if (n.label) boss.label = n.label;
  if ('watch' in n) boss.watch = n.watch;
  if (n.strict) boss.strict = n.strict;
  if (n.face !== undefined) boss.face = n.face;
  if (n.lookAt) boss.face = Math.atan2(n.lookAt.x - boss.x, n.lookAt.z - boss.z);
  if (n.say) { boss.speaking = n.say; world.say(world.boss, typeof n.say === 'string' ? n.say : (G.edgy && n.say.e ? n.say.e : n.say.c), n.wait || 3); }
  if (n.lookAt) { const cw = n.lookAt; const w = allies.find(a => a.name === cw.name); if (w) { w.anger += 10; world.say(w, G.edgy ? 'Yes boss... bloody hell.' : 'Yes boss, sorry...', 3); } }
  if (n.end) { boss.state = 'office'; boss.moving = false; boss.speaking = ''; boss.watch = false; boss.strict = 1; boss.forceInspect = false; boss.timer = nextOfficeTime(); boss.label = 'In his office'; }
}

function nextOfficeTime() {
  const p = progressMul();
  return lerp(rand(11, 17), rand(5, 9), p);
}
const lerp = (a, b, t) => a + (b - a) * t;

export function updateBoss(dt) {
  if (!G.running) return;
  // Big boss pops by at 2pm
  if (!boss.bigDone && G.clock >= 14 * 60 && boss.state === 'office') {
    boss.bigDone = true; boss.big = true; boss.timer = 0.1; boss.forceInspect = true;
    toast('🚨 The BIG BOSS is on the floor!', 'bad'); sfx.alarm();
  }
  boss.speaking = (boss.state === 'yell' || boss.state === 'inspect-wait' || boss.state === 'phone') ? 'talk' : '';
  boss.moving = false;

  if (boss.state === 'office') {
    boss.timer -= dt; boss.face = Math.PI + Math.sin(performance.now() / 2500) * 0.6;
    if (boss.timer <= 0) {
      const kind = boss.forceInspect ? 'inspect' : pickRoute();
      boss.forceInspect = false;
      route(kind); boss.state = 'walk';
      sfx.door();
      if (kind === 'inspect') toast('👀 The boss is heading your way!', 'bad');
      else if (kind === 'patrol') toast('👀 The boss is on patrol.', 'info');
    }
  } else if (boss.path.length || boss.wait > 0) {
    if (boss.wait > 0) { boss.wait -= dt; if (boss.wait <= 0 && boss.state !== 'walk' && boss.state !== 'office') { boss.state = 'walk'; boss.strict = 1; } }
    else {
      const n = boss.path[0];
      const dx = n.x - boss.x, dz = n.z - boss.z, d = Math.hypot(dx, dz);
      if (d < 0.08) { boss.path.shift(); nodeArrive(n); }
      else {
        const sp = SPEED * (boss.big ? 0.75 : 1) * (1 + progressMul() * 0.25);
        const step = Math.min(d, sp * dt);
        boss.x += (dx / d) * step; boss.z += (dz / d) * step; boss.moving = true;
        const want = Math.atan2(dx, dz); let diff = want - boss.face; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        boss.face += diff * Math.min(1, dt * 8);
        if (n.sfx === 'door' && !n.played) { n.played = true; }
      }
    }
  }

  // footsteps (volume by distance)
  if (boss.moving) {
    boss.stepT -= dt;
    if (boss.stepT <= 0) { boss.stepT = 0.5; const d = Math.hypot(boss.x - PLAYER.x, boss.z - PLAYER.z); sfx.step(clamp(0.5 - d * 0.045, 0.03, 0.45)); }
  }

  // arc: where he can see your screen from
  const dxp = boss.x - PLAYER.x;
  boss.inArc = boss.watch && Math.abs(dxp) < 3.6 && boss.z > 0.8 && boss.z < 5 && boss.state !== 'office';
  // friendly coworker cough
  if (!boss.coughed && boss.watch && Math.abs(dxp) < 6.2 && boss.state !== 'office' && boss.state !== 'yell') {
    boss.coughed = true;
    const friends = allies.filter(a => a.anger < 35);
    if (friends.length) { const f = pick(friends); sfx.cough(); world.say(f, pick(G.edgy ? COWORKER_NICE.edgy : COWORKER_NICE.clean), 2.2); toast(`${f.name} coughs loudly... 👀`, 'info'); }
  }

  // suspicion
  const safe = G.mode === 'screen' && G.app === 'crm';
  if (boss.inArc && !safe && boss.state !== 'caught') {
    const rate = 1.05 * boss.strict * (1 + boss.hostile) * (G.mode === 'look' ? 1.2 : 1);
    G.suspicion = Math.min(1, G.suspicion + dt * rate);
    if (G.suspicion >= 1) caught();
  } else G.suspicion = Math.max(0, G.suspicion - dt * 0.9);
  boss.hostile = Math.max(0, boss.hostile - dt * 0.05);
  boss.justCaught = Math.max(0, boss.justCaught - dt);
}

function caught() {
  G.suspicion = 0;
  boss.hostile = 0;
  boss.justCaught = 3;
  G.strikes++;
  G.stats.busted++;
  const pool = boss.big ? BIG_BOSS_YELL : BOSS_YELL;
  const line = say(pool);
  sfx.yell();
  world.say(world.boss, line, 3.2);
  emit('caught', { line, big: boss.big });
  // he stays and rants, then goes home
  boss.watch = false; boss.state = 'yell';
  boss.path = [to(WATCH_SPOT.x, WATCH_SPOT.z, { watch: false, wait: 3.2, state: 'yell', face: 0, label: 'Yelling at you' }), to(0, AISLE_Z, { watch: false }), ...home()];
  boss.wait = 0;
}

export function bossHit() {
  boss.hostile = 1.2;
  G.stats.bossHits++;
  if (boss.state === 'office') callBossNow();
  else if (boss.state === 'walk' || boss.state === 'phone') { /* he's mad: keep watching */ boss.watch = true; boss.strict = 1.8; boss.label = 'FURIOUS'; }
}

export function bossRadar() {
  return { x: boss.x - PLAYER.x, state: boss.inArc ? 'danger' : (boss.state === 'office' ? 'office' : 'near') };
}
