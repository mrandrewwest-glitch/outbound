// Tiny WebAudio synth - no audio files needed.
import { G } from './state.js';

let ctx = null, master = null;
export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
}

function ok() { return ctx && G.sound; }

function tone(freq, dur = 0.12, type = 'sine', vol = 0.2, when = 0, slideTo = null) {
  if (!ok()) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur = 0.1, vol = 0.2, hp = 0, lp = 8000, when = 0) {
  if (!ok()) return;
  const t = ctx.currentTime + when;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource(); s.buffer = buf;
  const g = ctx.createGain(); g.gain.value = vol;
  const f1 = ctx.createBiquadFilter(); f1.type = 'highpass'; f1.frequency.value = hp;
  const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lp;
  s.connect(f1); f1.connect(f2); f2.connect(g); g.connect(master);
  s.start(t);
}

export const sfx = {
  click() { tone(900, 0.04, 'square', 0.05); },
  key() { noise(0.03, 0.05, 1500, 6000); },
  ring() { tone(880, 0.12, 'square', 0.12); tone(880, 0.12, 'square', 0.12, 0.18); tone(1100, 0.12, 'square', 0.1, 0.4); },
  answer() { tone(600, 0.08, 'triangle', 0.15); tone(900, 0.1, 'triangle', 0.15, 0.08); },
  hangup() { tone(500, 0.2, 'triangle', 0.15, 0, 200); },
  good() { tone(660, 0.08, 'triangle', 0.15); tone(880, 0.12, 'triangle', 0.15, 0.08); },
  bad() { tone(220, 0.25, 'sawtooth', 0.12, 0, 120); },
  sale() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.18, i * 0.09)); },
  buzz() { tone(110, 0.4, 'sawtooth', 0.25); tone(95, 0.4, 'square', 0.15); },
  whoosh() { noise(0.18, 0.12, 400, 3000); },
  thud() { tone(120, 0.12, 'sine', 0.25, 0, 50); noise(0.06, 0.1, 100, 1200); },
  plink() { tone(1400, 0.15, 'triangle', 0.18); tone(1900, 0.2, 'triangle', 0.12, 0.05); },
  squeak() { tone(700, 0.15, 'sine', 0.1, 0, 1100); },
  cough() { noise(0.12, 0.2, 300, 1800); noise(0.1, 0.2, 300, 1800, 0.16); },
  door() { noise(0.25, 0.18, 80, 700); tone(90, 0.2, 'sine', 0.2); },
  alarm() { tone(1000, 0.1, 'square', 0.12); tone(1000, 0.1, 'square', 0.12, 0.16); },
  gulp() { tone(300, 0.1, 'sine', 0.15, 0, 180); tone(280, 0.1, 'sine', 0.15, 0.14, 160); },
  match() { [784, 988, 1175].forEach((f, i) => tone(f, 0.12, 'sine', 0.15, i * 0.07)); },
  yell() { tone(180, 0.6, 'sawtooth', 0.22, 0, 120); tone(260, 0.5, 'square', 0.1, 0.05, 150); noise(0.4, 0.12, 200, 2500); },
  step(vol = 0.2) { tone(70 + Math.random() * 15, 0.09, 'sine', vol, 0, 45); noise(0.04, vol * 0.5, 150, 900); },
  done() { [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', 0.18, i * 0.1)); },
};
