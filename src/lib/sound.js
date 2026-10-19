/* 효과음 — 소리 파일 없이 Web Audio로 직접 만들어요 (오프라인에서도 동작)
   CLAUDE.md 기준: 효과음은 기본 꺼짐. 켜고 끈 상태는 기기마다 기억해요. */
import { useEffect, useState } from 'react';

const KEY = 'trapezoid-architect-sound';
let on = false;
try { on = localStorage.getItem(KEY) === '1'; } catch (e) {}
const subs = new Set();
let ctx = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setSound(v) {
  on = v;
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {}
  if (v) { ac(); click(); }   // 켜는 순간(사용자가 누른 순간)에 소리 장치를 깨워요
  subs.forEach(f => f(v));
}
export function useSound() {
  const [v, setV] = useState(on);
  useEffect(() => { subs.add(setV); return () => subs.delete(setV); }, []);
  return [v, () => setSound(!on)];
}

function noiseBuffer(c, sec) {
  const b = c.createBuffer(1, Math.floor(c.sampleRate * sec), c.sampleRate), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { last = (last + .04 * (Math.random() * 2 - 1)) / 1.04; d[i] = last * 3.5; } // 낮게 웅웅거리는 소음
  return b;
}
function tone(c, { f, f2, t = 0, dur = .2, type = 'sine', vol = .2 }) {
  const o = c.createOscillator(), g = c.createGain(), s = c.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, s);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, s + dur);
  g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(vol, s + .015); g.gain.exponentialRampToValueAtTime(.0001, s + dur);
  o.connect(g).connect(c.destination); o.start(s); o.stop(s + dur + .05);
}

function click() { const c = ac(); if (c) tone(c, { f: 880, dur: .08, type: 'triangle', vol: .12 }); }

/* 우르르릉 — 땅이 울리는 소리 (dur초) */
export function rumble(dur = 1.8) {
  if (!on) return; const c = ac(); if (!c) return;
  const s = c.currentTime, src = c.createBufferSource(); src.buffer = noiseBuffer(c, dur + .2);
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
  const g = c.createGain(); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(.9, s + .15);
  g.gain.setValueAtTime(.9, s + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, s + dur);
  const trem = c.createGain(); trem.gain.value = .5;                     // 덜컹덜컹 떨림
  const lfo = c.createOscillator(); lfo.frequency.value = 9; const lg = c.createGain(); lg.gain.value = .45;
  lfo.connect(lg).connect(trem.gain);
  src.connect(lp).connect(trem).connect(g).connect(c.destination);
  const boom = c.createOscillator(), bg = c.createGain(); boom.type = 'sine'; boom.frequency.value = 42;   // 바닥 울림
  bg.gain.setValueAtTime(0, s); bg.gain.linearRampToValueAtTime(.35, s + .1); bg.gain.exponentialRampToValueAtTime(.0001, s + dur);
  boom.connect(bg).connect(c.destination);
  [src, lfo, boom].forEach(n => { n.start(s); n.stop(s + dur + .1); });
}

/* 결과 소리: strong(별3) · ok(별2) · wobble(별1) · fall/float(넘어짐) */
export function resultSound(kind) {
  if (!on) return; const c = ac(); if (!c) return;
  if (kind === 'strong') [523, 659, 784, 1047].forEach((f, i) => tone(c, { f, t: i * .11, dur: .35, type: 'triangle', vol: .18 }));
  else if (kind === 'ok') [659, 880].forEach((f, i) => tone(c, { f, t: i * .12, dur: .3, type: 'triangle', vol: .16 }));
  else if (kind === 'wobble') {
    const o = c.createOscillator(), g = c.createGain(), v = c.createOscillator(), vg = c.createGain(), s = c.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(520, s); o.frequency.exponentialRampToValueAtTime(220, s + .7);
    v.frequency.value = 11; vg.gain.value = 30; v.connect(vg).connect(o.frequency);
    g.gain.setValueAtTime(.2, s); g.gain.exponentialRampToValueAtTime(.0001, s + .75);
    o.connect(g).connect(c.destination); [o, v].forEach(n => { n.start(s); n.stop(s + .8); });
  } else {
    tone(c, { f: 120, f2: 35, dur: .5, type: 'sine', vol: .6 });                   // 쿵
    const s = c.currentTime, src = c.createBufferSource(); src.buffer = noiseBuffer(c, .4);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 400; const g = c.createGain();
    g.gain.setValueAtTime(.8, s); g.gain.exponentialRampToValueAtTime(.0001, s + .35);
    src.connect(bp).connect(g).connect(c.destination); src.start(s); src.stop(s + .4);
  }
}
