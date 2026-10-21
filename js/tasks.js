// The "Secret To-Do" list: things that definitely aren't work.
import { G, $, shuffle, toast, addSlack, emit } from './state.js';
import { sfx } from './audio.js';

// key = progress channel; mode: 'sum' adds up, 'max' keeps the highest value
const POOL = [
  { id: 'watch',  label: 'Watch 45s of videos on VidTube',      key: 'watch',   goal: 45,  mode: 'sum' },
  { id: 'snake',  label: 'Score 8 in Snake',                     key: 'snake',   goal: 8,   mode: 'max' },
  { id: 'click',  label: 'Click Commission Clicker 60 times',    key: 'click',   goal: 60,  mode: 'sum' },
  { id: 'chat',   label: 'Reply to 3 messages in Chatter',       key: 'chat',    goal: 3,   mode: 'sum' },
  { id: 'match',  label: 'Get 2 matches on Swipr',               key: 'match',   goal: 2,   mode: 'sum' },
  { id: 'cart',   label: 'Check out a $300+ cart on Amazoom',    key: 'cart',    goal: 300, mode: 'max' },
  { id: 'type',   label: 'Write 120 characters of your resignation letter', key: 'type', goal: 120, mode: 'sum' },
  { id: 'bin',    label: 'Sink 3 paper balls in the bin',        key: 'bin',     goal: 3,   mode: 'sum' },
  { id: 'hit',    label: 'Annoy coworkers 4 times',              key: 'hit',     goal: 4,   mode: 'sum' },
  { id: 'squeeze',label: 'Squeeze your stress ball 6 times',     key: 'squeeze', goal: 6,   mode: 'sum' },
  { id: 'snack',  label: 'Raid the snack drawer',                key: 'drink',   goal: 1,   mode: 'sum' },
  { id: 'gossip', label: 'Get the gossip at the water cooler',   key: 'gossip',  goal: 1,   mode: 'sum' },
  // spicy-only
  { id: 'drink2', label: '🌶️ Take 2 "medicinal" sips from the drawer', key: 'drink', goal: 2, mode: 'sum', edgy: true },
  { id: 'spicy',  label: '🌶️ Send 2 spicy replies in Chatter',  key: 'spicy',   goal: 2,   mode: 'sum', edgy: true },
  { id: 'hitboss',label: '🌶️ Tag the boss with a paper ball and live',  key: 'hitboss', goal: 1, mode: 'sum', edgy: true },
  { id: 'thirst', label: '🌶️ Swipe right 6 times on Swipr',     key: 'right',   goal: 6,   mode: 'sum', edgy: true },
  { id: 'shop',   label: '🌶️ Check out something "disgraceful" on Amazoom', key: 'spicyCart', goal: 1, mode: 'sum', edgy: true },
];

export let tasks = [];
const COUNT = 7;

export function newTasks() {
  const pool = POOL.filter(t => G.edgy || !t.edgy);
  // make sure spicy tasks appear when spicy mode is on
  const spicy = shuffle(pool.filter(t => t.edgy)).slice(0, G.edgy ? 3 : 0);
  const rest = shuffle(pool.filter(t => !t.edgy)).slice(0, COUNT - spicy.length);
  tasks = shuffle([...spicy, ...rest]).map(t => ({ ...t, progress: 0, done: false }));
  // two tasks sharing a progress channel would double-count; keep the first
  const seen = new Set();
  tasks = tasks.filter(t => !seen.has(t.key) && seen.add(t.key));
  render();
}

export function progress(key, n = 1) {
  let changed = false;
  tasks.forEach(t => {
    if (t.done || t.key !== key) return;
    const before = t.progress;
    t.progress = t.mode === 'max' ? Math.max(t.progress, n) : t.progress + n;
    if (t.progress !== before) changed = true;
    if (t.progress >= t.goal) {
      t.progress = t.goal; t.done = true;
      sfx.done();
      addSlack(100, `Objective complete: ${t.label.replace('🌶️ ', '')}`);
      emit('taskDone', t);
    }
  });
  if (changed) render();
}

export function doneCount() { return tasks.filter(t => t.done).length; }

export function render() {
  const box = $('#todo-list');
  if (!box) return;
  box.innerHTML = tasks.map(t => {
    const pct = Math.round((t.progress / t.goal) * 100);
    const prog = t.goal > 1 ? ` <em>${Math.min(Math.floor(t.progress), t.goal)}/${t.goal}</em>` : '';
    return `<li class="${t.done ? 'done' : ''}"><span>${t.done ? '✅' : '⬜'} ${t.label}${prog}</span><i style="width:${pct}%"></i></li>`;
  }).join('');
}
