// The fake desktop: CRM (work!) and six apps that are definitely not work.
import { G, $, $$, rand, randInt, pick, shuffle, clamp, pool, say, T, toast, addSlack, emit } from './state.js';
import { sfx } from './audio.js';
import { progress } from './tasks.js';
import { nextLead, dial, call } from './calls.js';

const APPS = [
  { id: 'crm',    icon: '📞', name: 'CRM' },
  { id: 'vid',    icon: '▶️', name: 'VidTube' },
  { id: 'arcade', icon: '🎮', name: 'Arcade' },
  { id: 'chat',   icon: '💬', name: 'Chatter' },
  { id: 'swipr',  icon: '🔥', name: 'Swipr' },
  { id: 'shop',   icon: '🛒', name: 'Amazoom' },
  { id: 'notes',  icon: '📝', name: 'Notepad' },
];

let leads = [];
let unread = 0;
let chatTimer = 6;
const win = {};

// ---------------------------------------------------------------- shell
export function initApps() {
  const ws = $('#workspace');
  const bar = $('#taskbar-apps');
  APPS.forEach(a => {
    const w = document.createElement('div');
    w.className = 'window'; w.id = 'win-' + a.id;
    ws.insertBefore(w, $('#phone'));
    win[a.id] = w;
    const b = document.createElement('button');
    b.className = 'tb-btn'; b.dataset.app = a.id; b.innerHTML = `${a.icon} <span>${a.name}</span><b class="badge hidden"></b>`;
    b.onclick = () => { sfx.click(); showApp(a.id); };
    bar.appendChild(b);
  });
  buildCRM(); buildVid(); buildArcade(); buildChat(); buildSwipr(); buildShop(); buildNotes();
  showApp('crm');
}

export function resetApps() {
  leads = Array.from({ length: 6 }, nextLead);
  unread = 0; chatTimer = 6;
  Object.keys(win).forEach(k => win[k].innerHTML = '');
  buildCRM(); buildVid(); buildArcade(); buildChat(); buildSwipr(); buildShop(); buildNotes();
  showApp('crm');
}

export function showApp(id) {
  G.app = id;
  APPS.forEach(a => {
    win[a.id].classList.toggle('active', a.id === id);
    $(`.tb-btn[data-app="${a.id}"]`).classList.toggle('on', a.id === id);
  });
  if (id === 'chat') { unread = 0; paintBadge(); }
  emit('appChange', id);
}

function paintBadge() {
  const b = $('.tb-btn[data-app="chat"] .badge');
  b.textContent = unread; b.classList.toggle('hidden', !unread);
}

// ---------------------------------------------------------------- CRM (safe screen)
function buildCRM() {
  if (!leads.length) leads = Array.from({ length: 6 }, nextLead);
  win.crm.innerHTML = `
    <div class="win-title">📞 CRM — Outbound Sales Dashboard</div>
    <div class="crm">
      <div class="crm-stats">
        <div><small>Sales</small><b id="c-sales">0</b></div>
        <div><small>Revenue</small><b id="c-rev">$0</b></div>
        <div><small>Calls</small><b id="c-calls">0</b></div>
        <div><small>Missed</small><b id="c-missed">0</b></div>
      </div>
      <button class="btn big good" id="c-dial">📞 Dial next lead</button>
      <table class="leads"><thead><tr><th>Lead</th><th>Pitch</th><th>Status</th></tr></thead><tbody id="c-leads"></tbody></table>
      <div class="crm-tip">💡 <b>Tip:</b> <span id="c-tip">Smile when you dial. They can hear it.</span></div>
    </div>`;
  $('#c-dial').onclick = () => { if (call) { toast('Already on a call!'); return; } sfx.click(); const l = leads.shift(); leads.push(nextLead()); dial(l); paintLeads(); };
  paintLeads();
}

function paintLeads() {
  const body = $('#c-leads'); if (!body) return;
  body.innerHTML = leads.map((l, i) => `<tr class="${i === 0 ? 'next' : ''}"><td>${l.name}</td><td>${l.product}</td><td>${i === 0 ? 'NEXT' : 'Queued'}</td></tr>`).join('');
}

const TIPS = ['Smile when you dial. They can hear it.', 'Every "no" is just a "yes" that hasn\'t calmed down.', 'Hydrate. Hydrate. Hydrate.', 'Never say "per my last email".', 'The customer is always right. Except Ron.', 'Hold button is for emergencies (boss).'];
const SPICY_TIPS = ['Every "no" is a yes that hasn\'t been drunk enough yet.', 'The customer is always right. Except Ron, that prick.'];
let tipT = 0;

// ---------------------------------------------------------------- VidTube
const VIDS = {
  clean: [
    { t: 'Cat vs Cucumber Compilation (10 hours)', e: '🐱', d: '10:00:01' },
    { t: 'Man Falls Off Treadmill (Slow-Mo)', e: '🏃', d: '0:42' },
    { t: 'Satisfying Pressure Wash ASMR', e: '💦', d: '25:10' },
    { t: 'Goat Screams Like A Man', e: '🐐', d: '1:03' },
    { t: 'Office Chair Racing: Grand Final', e: '🪑', d: '8:31' },
    { t: 'Top 10 Excuses For Being Late', e: '⏰', d: '6:15' },
    { t: 'Cooking Show Goes Horribly Wrong', e: '🍳', d: '4:20' },
    { t: 'Dog Wearing Tiny Hat Reviews Pizza', e: '🐶', d: '3:33' },
  ],
  edgy: [
    { t: 'Karen Meltdown At Bunnings (UNCENSORED)', e: '🤬', d: '5:09' },
    { t: 'Drunk Uncle Does The Worm At Wedding', e: '🕺', d: '2:47' },
    { t: 'Seagull Steals Chips: Pub Brawl', e: '🦅', d: '1:58' },
    { t: 'Bad Boss Karma Compilation', e: '😈', d: '12:34' },
    { t: 'Reply-All Disasters: HR Edition', e: '📧', d: '7:21' },
    { t: 'Top 10 Hangover Cures (Not Medical Advice)', e: '🥴', d: '9:19' },
  ],
};
let vid = null;

function buildVid() {
  vid = null;
  const list = pool(VIDS);
  win.vid.innerHTML = `
    <div class="win-title">▶️ VidTube — Trending</div>
    <div class="vid-grid" id="v-grid">${list.map((v, i) => `<button class="vid-card" data-i="${i}"><span>${v.e}</span><b>${v.t}</b><small>${v.d}</small></button>`).join('')}</div>
    <div class="vid-player hidden" id="v-player">
      <div class="vid-stage" id="v-stage"><div id="v-emoji">🎬</div><div class="vid-sub" id="v-sub"></div></div>
      <div class="vid-bar"><i id="v-prog"></i></div>
      <div class="vid-ctl"><button class="btn" id="v-back">◀ Back</button><button class="btn" id="v-pp">⏸ Pause</button><b id="v-title"></b></div>
    </div>`;
  $$('.vid-card', win.vid).forEach(b => b.onclick = () => {
    const v = list[+b.dataset.i]; sfx.click();
    vid = { v, t: 0, playing: true, len: randInt(50, 90) };
    $('#v-grid').classList.add('hidden'); $('#v-player').classList.remove('hidden');
    $('#v-emoji').textContent = v.e; $('#v-title').textContent = v.t;
  });
  $('#v-back').onclick = () => { vid = null; $('#v-grid').classList.remove('hidden'); $('#v-player').classList.add('hidden'); };
  $('#v-pp').onclick = () => { if (!vid) return; vid.playing = !vid.playing; $('#v-pp').textContent = vid.playing ? '⏸ Pause' : '▶ Play'; };
}

const COMMENTS = {
  clean: ['LOL I can\'t breathe', 'who is here in 2026?', 'my boss would NOT approve of this', 'first!', 'sending this to the group chat', 'this is why I love the internet'],
  edgy: ['bloody hell 😂😂', 'I\'m crying at my desk rn', 'my boss would sack me for watching this', 'this is the sort of thing you watch drunk', 'what a legend lmao'],
};

// ---------------------------------------------------------------- Arcade
let snake = null, clickerBank = 0, interns = 0;
function buildArcade() {
  snake = null; clickerBank = 0; interns = 0;
  win.arcade.innerHTML = `
    <div class="win-title">🎮 Arcade</div>
    <div class="tabs"><button class="tab on" data-t="snake">🐍 Snake</button><button class="tab" data-t="click">💰 Commission Clicker</button></div>
    <div id="a-snake" class="arc">
      <canvas id="sn" width="360" height="240"></canvas>
      <div class="arc-hud"><b>Score: <span id="sn-score">0</span></b> <button class="btn" id="sn-play">Play (Arrow keys / WASD)</button></div>
    </div>
    <div id="a-click" class="arc hidden">
      <button id="cl-btn" class="clicker">💰</button>
      <div class="arc-hud"><b>Commission: $<span id="cl-bank">0</span></b> <button class="btn" id="cl-buy">Hire an intern ($25) — +1/s</button></div>
      <small>Interns owned: <span id="cl-int">0</span></small>
    </div>`;
  $$('.tab', win.arcade).forEach(t => t.onclick = () => {
    $$('.tab', win.arcade).forEach(x => x.classList.toggle('on', x === t));
    $('#a-snake').classList.toggle('hidden', t.dataset.t !== 'snake');
    $('#a-click').classList.toggle('hidden', t.dataset.t !== 'click');
  });
  $('#sn-play').onclick = startSnake;
  $('#cl-btn').onclick = () => { clickerBank += 1; progress('click', 1); G.slack += 0.15; sfx.click(); paintClicker(); };
  $('#cl-buy').onclick = () => { if (clickerBank >= 25) { clickerBank -= 25; interns++; sfx.good(); paintClicker(); } };
  drawSnake();
}
function paintClicker() { $('#cl-bank').textContent = Math.floor(clickerBank); $('#cl-int').textContent = interns; }

const COLS = 24, ROWS = 16, CELL = 15;
function startSnake() {
  snake = { body: [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }], dir: { x: 1, y: 0 }, next: { x: 1, y: 0 }, food: null, score: 0, t: 0, dead: false };
  placeFood(); $('#sn-score').textContent = 0; drawSnake();
}
function placeFood() {
  let p; do { p = { x: randInt(0, COLS - 1), y: randInt(0, ROWS - 1) }; } while (snake.body.some(b => b.x === p.x && b.y === p.y));
  snake.food = p;
}
function stepSnake() {
  const s = snake; s.dir = s.next;
  const h = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y };
  if (h.x < 0 || h.y < 0 || h.x >= COLS || h.y >= ROWS || s.body.some(b => b.x === h.x && b.y === h.y)) { s.dead = true; sfx.bad(); drawSnake(); return; }
  s.body.unshift(h);
  if (h.x === s.food.x && h.y === s.food.y) { s.score++; $('#sn-score').textContent = s.score; sfx.good(); progress('snake', s.score); G.slack += 1.5; placeFood(); }
  else s.body.pop();
  drawSnake();
}
function drawSnake() {
  const c = $('#sn'); if (!c) return; const x = c.getContext('2d');
  x.fillStyle = '#10201a'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#15302a';
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) if ((i + j) % 2) x.fillRect(i * CELL, j * CELL, CELL, CELL);
  if (!snake) { x.fillStyle = '#9fe'; x.font = '16px monospace'; x.fillText('Press Play', 140, 125); return; }
  x.fillStyle = '#ff5470'; x.fillRect(snake.food.x * CELL + 2, snake.food.y * CELL + 2, CELL - 4, CELL - 4);
  snake.body.forEach((b, i) => { x.fillStyle = i ? '#4ade80' : '#bbf7d0'; x.fillRect(b.x * CELL + 1, b.y * CELL + 1, CELL - 2, CELL - 2); });
  if (snake.dead) { x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#fff'; x.font = '20px monospace'; x.fillText('GAME OVER', 130, 125); }
}

// ---------------------------------------------------------------- Chatter
const CHAT = [
  { from: 'Dave', text: { c: 'Anyone up for Friday drinks later?', e: 'Pub after work? I need to forget this place.' },
    r: [{ c: 'Yes!! 🍻' }, { c: 'Only if Greg isn\'t coming' }, { c: 'Sorry, got to hit quota', },
        { c: '', e: 'Depends if Brenda\'s shouting the first round', spicy: true }] },
  { from: 'Brenda', text: { c: 'Did anyone else see Greg\'s new boat photo?', e: 'Did you see Greg\'s boat? Where does a middle manager get that kind of money?!' },
    r: [{ c: 'It\'s a dinghy, Brenda.' }, { c: 'Wow, he must be doing well!' }, { c: 'Back to work, Brenda 😅' },
        { c: '', e: 'Probably skimming the Christmas fund', spicy: true }] },
  { from: 'Kev', text: { c: 'Quick poll: Is a hot dog a sandwich?', e: 'Poll: would you rather fight 100 customers or 1 boss?' },
    r: [{ c: 'Yes. Fight me.' }, { c: 'No. Obviously.' }, { c: 'Taco.' },
        { c: '', e: 'The boss. I\'d enjoy it.', spicy: true }] },
  { from: 'Priya', text: { c: 'Anyone got a charger? Mine died.', e: 'Anyone got a spare charger? Phone\'s dead and so am I.' },
    r: [{ c: 'Left drawer!' }, { c: 'Try IT, they\'ve got a box of misery.' }, { c: 'Sorry, mine\'s dead too 🔋' },
        { c: '', e: 'Mine\'s dead. Just like my will to live.', spicy: true }] },
  { from: 'HR_Bot', text: { c: '📣 Reminder: Fun is mandatory at 3pm in the break room.', e: '📣 Reminder: Inappropriate use of company time is being monitored.' },
    r: [{ c: '👍' }, { c: 'Can I pass on fun?' }, { c: 'lol ok' },
        { c: '', e: 'Go monitor yourself, HR_Bot.', spicy: true }] },
  { from: 'Dave', text: { c: 'Who left fish in the microwave??', e: 'WHO MICROWAVED FISH AGAIN. I\'m gagging.' },
    r: [{ c: 'Not me 🐟' }, { c: 'Smells like Kev.' }, { c: 'It\'s a sign. Go home.' },
        { c: '', e: 'It was Greg. He eats like a seagull.', spicy: true }] },
  { from: 'Brenda', text: { c: 'Karen from HR is looking SPICY today lol', e: 'Karen from HR looks rough. Rumour is she was out all night with Greg.' },
    r: [{ c: 'Hush! She\'ll hear you!' }, { c: 'Brenda!!' }, { c: '😂' },
        { c: '', e: 'Hope Greg bought dinner first', spicy: true }] },
];
let chatSeq = 0, chatPending = null;

function buildChat() {
  chatSeq = 0; chatPending = null;
  win.chat.innerHTML = `
    <div class="win-title">💬 Chatter — #sales-floor</div>
    <div class="chat-log" id="ch-log"><div class="msg sys">Welcome to #sales-floor. Nobody is working.</div></div>
    <div class="chat-reply" id="ch-reply"></div>`;
}
function pushChat(from, text, me) {
  const log = $('#ch-log'); if (!log) return;
  const d = document.createElement('div');
  d.className = 'msg ' + (me ? 'me' : '');
  d.innerHTML = `<b>${from}</b> ${text}`;
  log.appendChild(d); log.scrollTop = log.scrollHeight;
}
function incomingChat() {
  const m = CHAT[chatSeq++ % CHAT.length];
  chatPending = m;
  pushChat(m.from, T(m.text), false);
  if (G.app !== 'chat' || G.mode !== 'screen') { unread++; paintBadge(); sfx.click(); }
  const box = $('#ch-reply'); box.innerHTML = '';
  const replies = m.r.filter(r => !r.spicy || G.edgy);
  replies.forEach(r => {
    const b = document.createElement('button'); b.className = 'btn' + (r.spicy ? ' spicy' : '');
    b.textContent = (r.spicy ? '🌶️ ' : '') + (r.e && G.edgy ? r.e : r.c); b.onclick = () => {
      sfx.click(); pushChat('You', b.textContent.replace('🌶️ ', ''), true); box.innerHTML = '';
      progress('chat', 1); if (r.spicy) progress('spicy', 1);
      addSlack(r.spicy ? 14 : 8); chatPending = null;
    };
    box.appendChild(b);
  });
}

// ---------------------------------------------------------------- Swipr
const PROFILES = {
  clean: [
    { n: 'Bridget', a: 29, e: '🧗', b: 'Likes hiking, hates Mondays. Will steal your fries.' },
    { n: 'Marcus', a: 34, e: '🎸', b: 'In a band you haven\'t heard of. Sells insurance by day.' },
    { n: 'Priyanka', a: 31, e: '📚', b: 'Reads three books a week and judges your bookshelf.' },
    { n: 'Doug', a: 41, e: '🐟', b: 'Fisherman. There is a fish in every photo. Even the wedding ones.' },
    { n: 'Chloe', a: 27, e: '🐕', b: 'My dog swipes right, I just hold the phone.' },
    { n: 'Tony', a: 38, e: '🍕', b: 'Pizza is my love language. And pasta. And more pizza.' },
    { n: 'Sasha', a: 30, e: '🎮', b: 'Will beat you at Mario Kart. Will not apologise.' },
    { n: 'Wendy', a: 52, e: '🧶', b: 'Knits. Judges. Bakes cookies. Mostly judges.' },
  ],
  edgy: [
    { n: 'Candice', a: 33, e: '🍷', b: 'Wine o\'clock is any time that has a "clock" in it. Looking for a bad decision.' },
    { n: 'Brock', a: 36, e: '💪', b: '6\'4", own a ute, own a shirt (sometimes). Looking for someone to split a kebab with.' },
    { n: 'Trixie', a: 32, e: '😈', b: 'Might be trouble. Definitely have trouble. Swipe right if you can handle it.' },
    { n: 'Gaz', a: 45, e: '🍺', b: 'Divorced twice, still optimistic. Chuck a tinnie in the esky and let\'s go.' },
    { n: 'Naomi', a: 28, e: '🔥', b: 'My ex says I\'m "too much". Swipe right if that\'s a challenge.' },
  ],
};
const BOSS_PROFILE = { n: 'Greg (your boss)', a: 52, e: '👔', b: 'Regional Manager. Loves KPIs, synergy and his boat. DON\'T SWIPE RIGHT.', boss: true };
let deck = [], swipedBoss = false;

function buildSwipr() {
  deck = shuffle([...pool(PROFILES), BOSS_PROFILE]); swipedBoss = false;
  win.swipr.innerHTML = `
    <div class="win-title">🔥 Swipr</div>
    <div class="swipr"><div class="card" id="sw-card"></div>
      <div class="sw-btns"><button class="btn bad round" id="sw-no">✖</button><button class="btn good round" id="sw-yes">💚</button></div>
      <small id="sw-msg">Swipe responsibly.</small></div>`;
  $('#sw-no').onclick = () => swipe(false); $('#sw-yes').onclick = () => swipe(true);
  showProfile();
}
function showProfile() {
  if (!deck.length) deck = shuffle([...pool(PROFILES)]);
  const p = deck[0];
  $('#sw-card').innerHTML = `<div class="av">${p.e}</div><h3>${p.n}, ${p.a}</h3><p>${p.b}</p>`;
}
function swipe(yes) {
  sfx.click();
  const p = deck.shift();
  if (yes) {
    progress('right', 1); G.slack += 1;
    if (p.boss && !swipedBoss) { swipedBoss = true; addSlack(50, 'Swiped right on the boss 💀'); }
    if (Math.random() < 0.55 || p.boss) {
      sfx.match(); toast(`💘 It's a match with ${p.n}!`, 'good'); progress('match', 1); addSlack(10);
      $('#sw-msg').textContent = `Matched with ${p.n}!`;
    } else $('#sw-msg').textContent = 'No match. Their loss.';
  } else $('#sw-msg').textContent = 'Nope.';
  showProfile();
}

// ---------------------------------------------------------------- Amazoom
const ITEMS = {
  clean: [
    { n: 'Ergonomic Chair', e: '🪑', p: 289 }, { n: 'Mechanical Keyboard', e: '⌨️', p: 149 }, { n: 'Giant Plush Capybara', e: '🦫', p: 65 },
    { n: 'Noise-Cancelling Headphones', e: '🎧', p: 329 }, { n: 'Desk Treadmill', e: '🏃', p: 499 }, { n: 'Mini Fridge', e: '🧊', p: 210 },
    { n: 'Lava Lamp', e: '🌋', p: 35 }, { n: 'Cactus 6-Pack', e: '🌵', p: 22 },
  ],
  edgy: [
    { n: 'Inflatable Sheep (Party Size)', e: '🐑', p: 49, spicy: true }, { n: 'Industrial Whiskey 6-Pack', e: '🥃', p: 180, spicy: true },
    { n: 'Fake Sick Note Generator Pro', e: '🤒', p: 29, spicy: true }, { n: 'Boss-Shaped Punching Bag', e: '🥊', p: 89, spicy: true },
    { n: 'Hot Sauce "Regret" Pack', e: '🌶️', p: 24, spicy: true },
  ],
};
let cart = [];
function buildShop() {
  cart = [];
  const items = pool(ITEMS);
  win.shop.innerHTML = `
    <div class="win-title">🛒 Amazoom — Prime Day, every day</div>
    <div class="shop"><div class="shop-grid">${items.map((it, i) => `<button class="item" data-i="${i}"><span>${it.e}</span><b>${it.n}</b><small>$${it.p}</small></button>`).join('')}</div>
    <div class="cart"><b>Cart</b><ul id="sh-cart"></ul><div>Total: <b id="sh-total">$0</b></div><button class="btn good" id="sh-co">Checkout</button></div></div>`;
  $$('.item', win.shop).forEach(b => b.onclick = () => { cart.push(items[+b.dataset.i]); sfx.click(); paintCart(); G.slack += 1; });
  $('#sh-co').onclick = () => {
    if (!cart.length) return;
    const total = cart.reduce((s, c) => s + c.p, 0);
    sfx.good(); progress('cart', total);
    if (cart.some(c => c.spicy)) progress('spicyCart', 1);
    toast(G.edgy ? `🛒 Order placed: $${total}. Brenda\'s corporate card, enjoy.` : `🛒 Order placed: $${total}. (It never arrives.)`, 'good');
    addSlack(Math.min(60, Math.round(total / 10)));
    cart = []; paintCart();
  };
}
function paintCart() {
  $('#sh-cart').innerHTML = cart.map(c => `<li>${c.e} ${c.n} — $${c.p}</li>`).join('') || '<li>Empty. Like your soul.</li>';
  $('#sh-total').textContent = '$' + cart.reduce((s, c) => s + c.p, 0);
}

// ---------------------------------------------------------------- Notepad
let lastLen = 0;
function buildNotes() {
  lastLen = 0;
  const ph = G.edgy ? 'Dear Greg,\n\nI quit. Effective immediately. Your coffee machine is a war crime and your KPIs are made up...' : 'Dear Greg,\n\nPlease accept this letter as my resignation. Effective never. Just practising...';
  win.notes.innerHTML = `
    <div class="win-title">📝 Notepad — Resignation_FINAL_v47.docx</div>
    <textarea id="nt" placeholder="${ph}"></textarea>
    <div class="nt-foot"><span id="nt-count">0 characters</span> <button class="btn" id="nt-clear">Delete everything (coward)</button></div>`;
  $('#nt').addEventListener('input', e => {
    const len = e.target.value.length, d = len - lastLen; lastLen = len;
    if (d > 0 && d < 5) progress('type', d);
    G.slack += d > 0 ? 0.05 : 0;
    $('#nt-count').textContent = len + ' characters'; sfx.key();
  });
  $('#nt-clear').onclick = () => { $('#nt').value = ''; lastLen = 0; $('#nt-count').textContent = '0 characters'; toast('Deleted. You\'ll be back tomorrow.'); };
}

// ---------------------------------------------------------------- per-frame
export function updateApps(dt) {
  if (!G.running) return;
  const screen = G.mode === 'screen';
  // CRM stats + tips
  if (G.app === 'crm') {
    const set = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
    set('#c-sales', `${G.sales}/${G.quota}`); set('#c-rev', '$' + G.revenue); set('#c-calls', G.callsTaken); set('#c-missed', G.missed);
    tipT -= dt; if (tipT <= 0) { tipT = 7; const e = $('#c-tip'); if (e) e.textContent = pick(G.edgy ? [...TIPS, ...SPICY_TIPS] : TIPS); }
  }
  // video
  if (vid && vid.playing && G.app === 'vid' && screen) {
    vid.t += dt; progress('watch', dt); G.slack += dt * 0.35;
    $('#v-prog').style.width = ((vid.t % vid.len) / vid.len * 100) + '%';
    const em = $('#v-emoji'); em.style.transform = `translate(${Math.sin(vid.t * 2) * 40}px, ${Math.abs(Math.sin(vid.t * 3)) * -30}px) rotate(${Math.sin(vid.t * 1.4) * 14}deg) scale(${1 + Math.sin(vid.t * 5) * 0.08})`;
    if (Math.floor(vid.t) % 5 === 0 && Math.floor(vid.t) !== vid.lastC) { vid.lastC = Math.floor(vid.t); $('#v-sub').textContent = '💬 ' + say(COMMENTS); }
  }
  // snake
  if (snake && !snake.dead && G.app === 'arcade' && screen) {
    snake.t += dt; if (snake.t >= 0.11) { snake.t = 0; stepSnake(); }
  }
  // interns
  if (interns) { clickerBank += interns * dt; if (G.app === 'arcade') paintClicker(); }
  // chat incoming
  chatTimer -= dt;
  if (chatTimer <= 0) { chatTimer = rand(10, 18); if (!chatPending) incomingChat(); }
}

// returns true if the key was consumed by an app
export function handleKey(e) {
  if (G.app === 'arcade' && snake && !snake.dead) {
    const k = e.key.toLowerCase();
    const map = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
    const m = map[k];
    if (m) {
      if (m[0] !== -snake.dir.x || m[1] !== -snake.dir.y) snake.next = { x: m[0], y: m[1] };
      e.preventDefault(); return true;
    }
  }
  return false;
}

export function isTyping(el) { return el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT'); }
export function setMirror(x, state) {
  const dot = $('#mirror-dot'); if (!dot) return;
  dot.style.left = clamp(50 + x * 5, 2, 98) + '%';
  dot.className = state;
}
