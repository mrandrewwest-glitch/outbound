// Shared game state + tiny event bus + helpers.
const listeners = {};
export const on = (evt, fn) => { (listeners[evt] ||= []).push(fn); };
export const emit = (evt, data) => { (listeners[evt] || []).forEach(fn => fn(data)); };

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Shift: 9:00 -> 17:00 (480 game minutes) over SHIFT_SECONDS real seconds.
export const SHIFT_START = 9 * 60;
export const SHIFT_END = 17 * 60;
export const SHIFT_SECONDS = 360;

export const G = {
  edgy: false,
  sound: true,
  running: false,
  paused: false,
  over: false,
  clock: SHIFT_START,
  strikes: 0,
  maxStrikes: 3,
  sales: 0,
  quota: 4,
  revenue: 0,
  callsTaken: 0,
  missed: 0,
  slack: 0,
  mode: 'look',        // 'look' | 'screen'
  app: 'crm',
  suspicion: 0,
  onCall: false,
  drunk: 0,
  stats: { busted: 0, bossHits: 0, binShots: 0, coworkerHits: 0, snitched: 0 },
};

export function resetState() {
  Object.assign(G, {
    running: false, paused: false, over: false, clock: SHIFT_START, strikes: 0, sales: 0, revenue: 0,
    callsTaken: 0, missed: 0, slack: 0, mode: 'look', app: 'crm', suspicion: 0, onCall: false, drunk: 0,
    stats: { busted: 0, bossHits: 0, binShots: 0, coworkerHits: 0, snitched: 0 },
  });
}

// text helpers: {c:'clean', e:'edgy'} objects or {clean:[], edgy:[]} pools
export const T = x => (typeof x === 'string' ? x : (G.edgy && x.e ? x.e : x.c));
export const pool = p => (Array.isArray(p) ? p : (G.edgy && p.edgy ? [...p.clean, ...p.edgy] : p.clean));
export const say = p => pick(pool(p));

export function toast(msg, kind = '') {
  const box = document.getElementById('toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 5) box.firstChild.remove();
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 3700);
}

export function addSlack(n, why) {
  G.slack += n;
  if (why) toast(`+${n} ${why}`, 'slack');
}
