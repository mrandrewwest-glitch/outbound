// Softphone + call engine. Owns the #phone dock inside the PC overlay and the mini HUD card.
import { G, $, rand, randInt, pick, shuffle, clamp, pool, say, toast, addSlack, emit } from './state.js';
import { ARCH, PLAYER, SILENCE, PRODUCTS, FIRST, LAST, WRONG_NUMBER } from './content.js';
import { sfx } from './audio.js';

export let call = null;
let nextInbound = 8;
let ringTick = 0;
const TAGS = ['script', 'empathy', 'hard', 'joke', 'honest', 'wild'];
const TURNS = 3;

const el = {};
export function initCalls() {
  el.phone = $('#phone');
  el.phone.innerHTML = `
    <div class="ph-head"><span id="ph-status">📵 No active call</span></div>
    <div class="ph-caller"><span id="ph-emoji">☎️</span><div><b id="ph-name">—</b><small id="ph-sub">Waiting for leads...</small></div></div>
    <div class="ph-meters">
      <div><small>Interest</small><div class="bar"><i id="ph-interest"></i></div></div>
      <div><small>Patience</small><div class="bar red"><i id="ph-patience"></i></div></div>
      <div><small>Reply timer</small><div class="bar amber"><i id="ph-timer"></i></div></div>
    </div>
    <div class="ph-say" id="ph-say">Press "Dial next lead" in the CRM, or wait for an inbound call.</div>
    <div class="ph-opts" id="ph-opts"></div>
    <div class="ph-actions" id="ph-actions"></div>`;
  el.mini = $('#minicall');
  nextInbound = 8;
}

export function resetCalls() { call = null; nextInbound = 8; G.onCall = false; render(); }

function randomName() { return `${pick(FIRST)} ${pick(LAST)}`; }

function pickArch() {
  const keys = Object.keys(ARCH).filter(k => (G.edgy || !ARCH[k].edgyOnly));
  const weighted = [];
  keys.forEach(k => { const n = ARCH[k].rare ? 1 : (ARCH[k].edgyOnly ? 2 : 3); for (let i = 0; i < n; i++) weighted.push(k); });
  return pick(weighted);
}

export function nextLead() {
  return { name: randomName(), product: pick(PRODUCTS), arch: pickArch() };
}

export function dial(lead) {
  if (call) return;
  call = { ...lead, outbound: true, phase: 'dialing', t: 1.6, turn: 0, interest: 0, patience: 100, timer: 0, holdUsed: false, holdT: 0 };
  render();
  toast(`📞 Dialling ${call.name}...`);
}

function inbound() {
  if (call) return;
  const lead = nextLead();
  call = { ...lead, outbound: false, phase: 'ringing', t: 12, turn: 0, interest: 0, patience: 100, timer: 0, holdUsed: false, holdT: 0 };
  sfx.ring();
  render();
}

export function answer() {
  if (!call || call.phase !== 'ringing') return;
  sfx.answer();
  begin();
}

export function declineCall() {
  if (!call || call.phase !== 'ringing') return;
  endCall('declined');
}

function begin() {
  const a = ARCH[call.arch];
  call.phase = 'talk';
  call.interest = a.base + randInt(-4, 4);
  call.turn = 0;
  G.onCall = true;
  G.callsTaken++;
  call.line = say(a.open);
  nextOptions();
}

function nextOptions() {
  call.timer = call.turn === 0 ? 12 : 9;
  call.timerMax = call.timer;
  call.holdUsed = false;
  const tags = shuffle(TAGS).slice(0, 3);
  call.options = tags.map(t => ({ tag: t, text: pick(pool(PLAYER[t])) }));
  render();
}

export function choose(i) {
  if (!call || call.phase !== 'talk') return;
  const opt = call.options[i];
  if (!opt) return;
  sfx.click();
  apply(opt.tag);
}

function apply(tag, silent = false) {
  const a = ARCH[call.arch];
  let d;
  if (tag === 'silence') d = -14;
  else if (tag === 'wild') d = a.w.wild * 11 + rand(-20, 20);
  else d = a.w[tag] * 12 + rand(-5, 5);
  d = Math.round(d);
  call.interest = clamp(call.interest + d, 0, 100);
  if (d < -6) call.patience = clamp(call.patience - 22, 0, 100);
  if (silent) call.patience = clamp(call.patience - 12, 0, 100);
  if (d > 6) { sfx.good(); } else if (d < -6) { sfx.bad(); }
  call.react = d > 5 ? 'good' : d < -5 ? 'bad' : null;
  call.turn++;
  if (call.patience <= 0) return finish('hung');
  if (call.turn >= TURNS) return finish();
  const reaction = tag === 'silence' ? say(SILENCE) : (call.react ? say(a[call.react]) : '');
  call.line = (reaction ? reaction + ' ' : '') + say(a.follow);
  nextOptions();
}

export function hold() {
  if (!call || call.phase !== 'talk' || call.holdUsed) return;
  call.holdUsed = true;
  call.holdT = 6;
  call.patience = clamp(call.patience - 12, 0, 100);
  toast('⏸ Customer on hold (patience −12)');
  sfx.click();
  render();
}

export function hangUp() {
  if (!call) return;
  if (call.phase === 'talk') { sfx.hangup(); finish('hangup'); }
  else if (call.phase === 'ringing' || call.phase === 'dialing') endCall('declined');
}

function finish(why) {
  const a = ARCH[call.arch];
  let result;
  if (why === 'hung') result = 'hung';
  else if (why === 'hangup') result = 'hangup';
  else if (call.interest >= 72) result = 'sale';
  else if (call.interest >= 56) result = 'callback';
  else result = 'no';
  call.phase = 'done';
  call.result = result;
  call.timer = 0;
  if (result === 'sale') {
    const amt = randInt(90, 480) * (call.arch === 'dream' ? 3 : 1);
    G.sales++; G.revenue += amt;
    call.line = say(a.yes);
    sfx.sale();
    toast(`💰 SALE! +$${amt}`, 'good');
    G.slack += 15;
  } else if (result === 'callback') {
    call.line = say(a.no) + ' (Callback booked.)';
    addSlack(5);
    toast('📅 Callback booked', 'info');
  } else if (result === 'hung') {
    call.line = '*click* — they hung up on you.';
    sfx.bad();
  } else if (result === 'hangup') {
    call.line = '*you hang up. Bold.*';
  } else {
    call.line = say(a.no);
    sfx.bad();
  }
  call.doneT = 2.6;
  G.onCall = false;
  render();
}

function endCall(why) {
  if (call && call.phase === 'ringing' && why === 'missed') { G.missed++; toast('📵 Missed call!', 'bad'); sfx.bad(); }
  call = null;
  G.onCall = false;
  render();
  emit('callEnd', why);
}

export function updateCalls(dt) {
  if (!G.running) return;
  if (!call) {
    nextInbound -= dt;
    if (nextInbound <= 0) { inbound(); nextInbound = rand(24, 42); }
    return;
  }
  if (call.phase === 'ringing') {
    call.t -= dt; ringTick -= dt;
    if (ringTick <= 0) { sfx.ring(); ringTick = 1.8; }
    if (call.t <= 0) endCall('missed');
  } else if (call.phase === 'dialing') {
    call.t -= dt;
    if (call.t <= 0) {
      if (Math.random() < 0.18) {
        toast(say(WRONG_NUMBER), 'info');
        endCall('noanswer');
      } else { sfx.answer(); begin(); }
    }
  } else if (call.phase === 'talk') {
    if (call.holdT > 0) { call.holdT -= dt; if (call.holdT <= 0) render(); }
    else {
      call.timer -= dt;
      if (call.timer <= 0) apply('silence', true);
    }
  } else if (call.phase === 'done') {
    call.doneT -= dt;
    if (call.doneT <= 0) endCall('done');
  }
  paint();
}

// ---- rendering ----
function render() {
  if (!el.phone) return;
  const st = $('#ph-status'), emoji = $('#ph-emoji'), nm = $('#ph-name'), sub = $('#ph-sub'), sayEl = $('#ph-say');
  const opts = $('#ph-opts'), acts = $('#ph-actions');
  opts.innerHTML = ''; acts.innerHTML = '';
  if (!call) {
    st.textContent = '📵 No active call'; st.className = '';
    emoji.textContent = '☎️'; nm.textContent = '—'; sub.textContent = 'Waiting for leads...';
    sayEl.textContent = 'Press "Dial next lead" in the CRM, or wait for an inbound call.';
    el.mini.classList.add('hidden');
    paint();
    return;
  }
  const a = ARCH[call.arch];
  emoji.textContent = a.emoji; nm.textContent = call.name;
  sub.textContent = (call.outbound ? 'Outbound' : 'Inbound') + ' • ' + call.product;
  if (call.phase === 'ringing') {
    st.textContent = '🔔 INCOMING CALL'; st.className = 'ring';
    sayEl.textContent = `${call.name} is calling... answer before they hang up!`;
    acts.innerHTML = `<button class="btn good" id="b-ans">Answer (Space)</button><button class="btn" id="b-dec">Decline</button>`;
    $('#b-ans').onclick = answer; $('#b-dec').onclick = declineCall;
  } else if (call.phase === 'dialing') {
    st.textContent = '📞 Dialling...'; st.className = '';
    sayEl.textContent = 'Ringing...';
  } else if (call.phase === 'talk') {
    st.textContent = '🟢 ON CALL'; st.className = 'live';
    sayEl.textContent = '“' + call.line + '”';
    call.options.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'opt'; b.textContent = `${i + 1}. ${o.text}`;
      b.onclick = () => choose(i);
      opts.appendChild(b);
    });
    const hb = document.createElement('button'); hb.className = 'btn'; hb.textContent = call.holdT > 0 ? '⏸ On hold...' : '⏸ Hold (H)'; hb.disabled = call.holdUsed;
    hb.onclick = hold; acts.appendChild(hb);
    const hu = document.createElement('button'); hu.className = 'btn bad'; hu.textContent = '📵 Hang up (X)'; hu.onclick = hangUp; acts.appendChild(hu);
  } else if (call.phase === 'done') {
    const label = { sale: '💰 SALE!', callback: '📅 Callback', no: '❌ No sale', hung: '💥 They hung up', hangup: '📵 You hung up' }[call.result];
    st.textContent = label; st.className = call.result === 'sale' ? 'live' : '';
    sayEl.textContent = '“' + call.line + '”';
  }
  el.mini.classList.toggle('hidden', G.mode === 'screen');
  paint();
}

function paint() {
  const set = (id, pct) => { const e = $(id); if (e) e.style.width = clamp(pct, 0, 100) + '%'; };
  if (!call) { set('#ph-interest', 0); set('#ph-patience', 0); set('#ph-timer', 0); return; }
  set('#ph-interest', call.interest); set('#ph-patience', call.patience);
  const holding = call.holdT > 0;
  set('#ph-timer', call.phase === 'talk' ? (holding ? 100 : (call.timer / (call.timerMax || 9)) * 100) : (call.phase === 'ringing' ? (call.t / 12) * 100 : 0));
  // mini HUD (look mode)
  const mini = el.mini;
  if (G.mode === 'screen') { mini.classList.add('hidden'); return; }
  mini.classList.remove('hidden');
  const a = ARCH[call.arch];
  let txt;
  if (call.phase === 'ringing') txt = `🔔 ${call.name} is calling! Press SPACE to answer`;
  else if (call.phase === 'dialing') txt = `📞 Dialling ${call.name}...`;
  else if (call.phase === 'talk') txt = `${a.emoji} ${call.name}: reply in ${Math.max(0, Math.ceil(call.timer))}s (lean in with E)`;
  else txt = `${a.emoji} ${call.line}`;
  mini.textContent = txt;
}

export function onModeChange() { render(); }

// keyboard helpers
export function key(k) {
  if (!call) return false;
  if (k === 'a') { answer(); return true; }
  if (call.phase === 'talk') {
    if (['1', '2', '3'].includes(k)) { choose(+k - 1); return true; }
    if (k === 'h') { hold(); return true; }
    if (k === 'x') { hangUp(); return true; }
  }
  return false;
}
