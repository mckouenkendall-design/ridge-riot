/* Ridge Riot: all sound, made from scratch with the Web Audio API.
   Engines are built as a short looping waveform of firing pulses (one per
   cylinder, spaced the way that engine really fires) and played faster or
   slower as the revs change. Everything else is small synth patches. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var S = RR.Audio = {};
var ac = null, master, sfxBus, engBus, musBus, moonLP, comp;
var noiseBuf, brownBuf;
var vol = { sfx: 0.8, engine: 0.7, music: 0.5 };
var ok = false;
S.ready = function () { return ok; };
S.ctx = function () { return ac; };

function mkNoise(sec, brown) {
  var n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0), last = 0;
  for (var i = 0; i < n; i++) {
    var w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
  }
  return b;
}

S.init = function (Ctor) {
  if (ac) return true;
  var AC = Ctor || root.AudioContext || root.webkitAudioContext;
  if (!AC) return false;
  try { ac = new AC(); } catch (e) { return false; }
  S.build();
  return true;
};
/* wiring: buses -> moon filter -> compressor -> speakers */
S.build = function (ctx) {
  if (ctx) ac = ctx;
  master = ac.createGain(); master.gain.value = 0.9;
  comp = ac.createDynamicsCompressor();
  comp.threshold.value = -14; comp.knee.value = 18; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.18;
  moonLP = ac.createBiquadFilter(); moonLP.type = 'lowpass'; moonLP.frequency.value = 20000; moonLP.Q.value = 0.5;
  sfxBus = ac.createGain(); engBus = ac.createGain(); musBus = ac.createGain();
  sfxBus.connect(moonLP); engBus.connect(moonLP); moonLP.connect(comp); musBus.connect(comp); comp.connect(master); master.connect(ac.destination);
  noiseBuf = mkNoise(2, false); brownBuf = mkNoise(3, true);
  S.setVolumes(vol);
  ok = true;
};
S.unlock = function () {
  if (!S.init()) return;
  if (ac.state === 'suspended') ac.resume();
  // iPhone: ask for "playback" so the ring/silent switch does not mute the game
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
};
S.suspend = function () { if (ac && ac.state === 'running') ac.suspend(); };
S.resume = function () { if (ac && ac.state === 'suspended') ac.resume(); };
S.setVolumes = function (v) {
  vol = { sfx: v.sfx, engine: v.engine, music: v.music };
  if (!ac) return;
  var t = ac.currentTime;
  sfxBus.gain.setTargetAtTime(v.sfx, t, 0.03); engBus.gain.setTargetAtTime(v.engine * 0.85, t, 0.03); musBus.gain.setTargetAtTime(v.music * 0.5, t, 0.03);
};
/* Low Orbit has no air, so everything is heard "through the suit": muffled */
S.setWorld = function (wi) {
  if (!ac) return;
  var id = RR.WORLDS && RR.WORLDS[wi] ? RR.WORLDS[wi].id : '';
  moonLP.frequency.setTargetAtTime(id === 'orbit' ? 1500 : 20000, ac.currentTime, 0.1);
  S.ambient(wi, id);
};

/* ------------------------------ building blocks ------------------------------ */
function env(g, t, a, peak, d) {
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function tone(type, f0, f1, dur, gain, when, dest, attack) {
  if (!ok) return;
  var t = ac.currentTime + (when || 0), o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  env(g, t, attack || 0.004, gain, dur);
  o.connect(g); g.connect(dest || sfxBus); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, type, f0, f1, q, gain, when, dest, brown, attack) {
  if (!ok) return;
  var t = ac.currentTime + (when || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = brown ? brownBuf : noiseBuf; s.loop = true;
  f.type = type; f.Q.value = q || 0.7; f.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(10, f1), t + dur);
  env(g, t, attack || 0.003, gain, dur);
  s.connect(f); f.connect(g); g.connect(dest || sfxBus);
  s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
}
function bell(f, dur, gain, when) {
  tone('sine', f, f, dur, gain, when); tone('sine', f * 2.76, f * 2.76, dur * 0.5, gain * 0.35, when); tone('sine', f * 5.4, f * 5.4, dur * 0.25, gain * 0.18, when);
}
function loopNoise(type, freq, q, brown) {
  var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = brown ? brownBuf : noiseBuf; s.loop = true; f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = 0;
  s.connect(f); f.connect(g); g.connect(sfxBus); s.start();
  return { src: s, f: f, g: g };
}

/* ------------------------------ engines ------------------------------ */
/* pattern: when each cylinder fires within one loop of the waveform, and how loud.
   lo / hi: loops per second at idle and at the rev limit. ring: pitch of the exhaust
   "ring" as a multiple of the loop rate. decay: how quickly each bang dies away. */
var ENG = {
  two:   { pattern: [[0, 1]], lo: 40, hi: 172, ring: 3.0, decay: 0.2, grit: 0.55, bright: 1.25, noise: 0.5, drive: 2.6 },
  mini:  { pattern: [[0, 1]], lo: 20, hi: 98, ring: 5.0, decay: 0.13, grit: 0.3, bright: 1.1, noise: 0.3, drive: 2.0 },
  thump: { pattern: [[0, 1]], lo: 11, hi: 70, ring: 5.0, decay: 0.1, grit: 0.25, bright: 0.8, noise: 0.35, drive: 2.4 },
  trial: { pattern: [[0, 1]], lo: 9, hi: 56, ring: 4.0, decay: 0.16, grit: 0.15, bright: 0.6, noise: 0.25, drive: 1.6 },
  scoot: { pattern: [[0, 1]], lo: 24, hi: 88, ring: 4.0, decay: 0.22, grit: 0.5, bright: 0.9, noise: 0.3, drive: 2.2 },
  vtwin: { pattern: [[0, 1], [0.4375, 0.8]], lo: 7, hi: 44, ring: 8.0, decay: 0.07, grit: 0.3, bright: 0.7, noise: 0.4, drive: 2.8 },
  twin:  { pattern: [[0, 1], [0.375, 0.95]], lo: 9, hi: 62, ring: 7.0, decay: 0.08, grit: 0.25, bright: 0.95, noise: 0.35, drive: 2.4 },
  four:  { pattern: [[0, 1], [0.25, 0.9], [0.5, 1], [0.75, 0.93]], lo: 10, hi: 104, ring: 9.0, decay: 0.045, grit: 0.2, bright: 1.4, noise: 0.3, drive: 2.2 },
  drag:  { pattern: [[0, 1], [0.5, 0.9]], lo: 13, hi: 86, ring: 5.0, decay: 0.11, grit: 0.7, bright: 1.3, noise: 0.6, drive: 3.6 }
};
var F0 = 30;
function engineBuffer(E, pitch) {
  var sr = ac.sampleRate, K = 8, cyc = Math.round(sr / F0), n = cyc * K, b = ac.createBuffer(1, n, sr), d = b.getChannelData(0), i, k, c;
  var seed = 1234567;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  for (k = 0; k < K; k++) {
    for (c = 0; c < E.pattern.length; c++) {
      var start = Math.round((k + E.pattern[c][0] + (rnd() - 0.5) * 0.012) * cyc);
      var amp = E.pattern[c][1] * (0.9 + rnd() * 0.2);
      var len = Math.round(cyc * Math.min(0.98, E.decay * 5));
      var ph = rnd() * 0.3;
      for (i = 0; i < len; i++) {
        var t = i / cyc, e = Math.exp(-t / E.decay);
        // the bang: a sharp push, a ringing pipe, and a rasp of noise
        var v = e * Math.sin(2 * Math.PI * E.ring * t + ph) + 0.6 * Math.exp(-t / (E.decay * 0.35)) * (1 - 2 * t / (E.decay * 0.7 + 0.001) < -1 ? -1 : 1 - 2 * t / (E.decay * 0.7 + 0.001))
              + E.grit * e * (rnd() * 2 - 1);
        d[(start + i + n) % n] += v * amp;
      }
    }
  }
  // gentle tidy-up: remove offset, normalise
  var mean = 0, peak = 0; for (i = 0; i < n; i++) mean += d[i]; mean /= n;
  for (i = 0; i < n; i++) { d[i] -= mean; if (Math.abs(d[i]) > peak) peak = Math.abs(d[i]); }
  for (i = 0; i < n; i++) d[i] *= 0.9 / peak;
  return b;
}
function shaper(amount) {
  var n = 1024, c = new Float32Array(n);
  for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * amount) / Math.tanh(amount); }
  var w = ac.createWaveShaper(); w.curve = c; w.oversample = '2x';
  return w;
}

var eng = null;
S.engineStop = function () {
  if (!eng) return;
  var e = eng; eng = null;
  try {
    e.out.gain.setTargetAtTime(0, ac.currentTime, 0.04);
    setTimeout(function () { e.nodes.forEach(function (n) { try { n.stop && n.stop(); n.disconnect(); } catch (x) {} }); }, 300);
  } catch (x) {}
};
S.engineStart = function (def) {
  if (!ok) return;
  S.engineStop();
  var sd = def.snd, t = ac.currentTime;
  var e = { def: def, type: sd.type, pitch: sd.pitch, gears: sd.gears, gear: 0, rpm: 0.15, shiftT: 0, nodes: [], thr: 0 };
  e.out = ac.createGain(); e.out.gain.value = 0; e.out.connect(engBus);
  e.out.gain.setTargetAtTime(1, t, 0.08);
  e.nodes.push(e.out);
  if (sd.type === 'electric') {
    e.o1 = ac.createOscillator(); e.o1.type = 'sine'; e.o2 = ac.createOscillator(); e.o2.type = 'triangle'; e.o3 = ac.createOscillator(); e.o3.type = 'sawtooth';
    e.g1 = ac.createGain(); e.g2 = ac.createGain(); e.g3 = ac.createGain(); e.f3 = ac.createBiquadFilter(); e.f3.type = 'bandpass'; e.f3.Q.value = 6;
    e.o1.connect(e.g1); e.o2.connect(e.g2); e.o3.connect(e.f3); e.f3.connect(e.g3); e.g1.connect(e.out); e.g2.connect(e.out); e.g3.connect(e.out);
    e.g1.gain.value = 0; e.g2.gain.value = 0; e.g3.gain.value = 0;
    e.o1.start(); e.o2.start(); e.o3.start();
    e.nodes.push(e.o1, e.o2, e.o3, e.g1, e.g2, e.g3, e.f3);
  } else if (sd.type === 'jet') {
    e.o1 = ac.createOscillator(); e.o1.type = 'sawtooth'; e.g1 = ac.createGain(); e.g1.gain.value = 0; e.f1 = ac.createBiquadFilter(); e.f1.type = 'bandpass'; e.f1.Q.value = 9;
    e.o1.connect(e.f1); e.f1.connect(e.g1); e.g1.connect(e.out); e.o1.start();
    e.n1 = ac.createBufferSource(); e.n1.buffer = noiseBuf; e.n1.loop = true; e.nf = ac.createBiquadFilter(); e.nf.type = 'bandpass'; e.nf.Q.value = 0.8; e.ng = ac.createGain(); e.ng.gain.value = 0;
    e.n1.connect(e.nf); e.nf.connect(e.ng); e.ng.connect(e.out); e.n1.start();
    e.n2 = ac.createBufferSource(); e.n2.buffer = brownBuf; e.n2.loop = true; e.ng2 = ac.createGain(); e.ng2.gain.value = 0; e.n2.connect(e.ng2); e.ng2.connect(e.out); e.n2.start();
    e.nodes.push(e.o1, e.g1, e.f1, e.n1, e.nf, e.ng, e.n2, e.ng2);
  } else {
    var E = ENG[sd.type] || ENG.thump;
    e.E = E;
    e.src = ac.createBufferSource(); e.src.buffer = engineBuffer(E, sd.pitch); e.src.loop = true;
    e.pre = ac.createGain(); e.pre.gain.value = 0.3;
    e.lp = ac.createBiquadFilter(); e.lp.type = 'lowpass'; e.lp.frequency.value = 900; e.lp.Q.value = 0.9;
    e.ws = shaper(E.drive);
    e.post = ac.createGain(); e.post.gain.value = 0.5;
    e.hp = ac.createBiquadFilter(); e.hp.type = 'highpass'; e.hp.frequency.value = sd.type === 'mini' || sd.type === 'two' || sd.type === 'scoot' ? 140 : 45;
    e.src.connect(e.pre); e.pre.connect(e.ws); e.ws.connect(e.lp); e.lp.connect(e.hp); e.hp.connect(e.post); e.post.connect(e.out);
    // intake / exhaust hiss that opens up with the throttle
    e.n1 = ac.createBufferSource(); e.n1.buffer = noiseBuf; e.n1.loop = true; e.nf = ac.createBiquadFilter(); e.nf.type = 'bandpass'; e.nf.Q.value = 1.2; e.ng = ac.createGain(); e.ng.gain.value = 0;
    e.n1.connect(e.nf); e.nf.connect(e.ng); e.ng.connect(e.out);
    e.src.playbackRate.value = E.lo * sd.pitch / F0;
    e.src.start(); e.n1.start();
    e.nodes.push(e.src, e.pre, e.lp, e.ws, e.post, e.hp, e.n1, e.nf, e.ng);
  }
  eng = e;
};
/* st: { v: wheel speed m/s, vmax, gas: 0..1, air: bool, boost: bool, dt } */
S.engineUpdate = function (st) {
  if (!eng || !ok) return;
  var e = eng, t = ac.currentTime, dt = st.dt || 0.016, x = Math.max(0, st.v) / st.vmax;
  var thr = st.gas;
  e.thr += (thr - e.thr) * Math.min(1, dt * (thr > e.thr ? 14 : 7));
  var target;
  if (e.type === 'electric') {
    target = Math.min(1.25, x);
    e.rpm += (target - e.rpm) * Math.min(1, dt * 12);
    var f = 90 + 1250 * e.rpm;
    e.o1.frequency.setTargetAtTime(f, t, 0.02); e.o2.frequency.setTargetAtTime(f * 1.503, t, 0.02); e.o3.frequency.setTargetAtTime(f * 4.02, t, 0.02);
    e.f3.frequency.setTargetAtTime(f * 4.02, t, 0.02);
    e.g1.gain.setTargetAtTime(0.05 + 0.16 * e.thr, t, 0.03); e.g2.gain.setTargetAtTime(0.02 + 0.09 * e.thr * (0.4 + e.rpm), t, 0.03);
    e.g3.gain.setTargetAtTime((0.02 + 0.1 * e.thr) * Math.min(1, e.rpm * 3), t, 0.03);
    return e.rpm;
  }
  if (e.type === 'jet') {
    target = 0.3 + 0.5 * thr + 0.25 * Math.min(1, x) + (st.boost ? 0.15 : 0);
    e.rpm += (target - e.rpm) * Math.min(1, dt * (target > e.rpm ? 2.2 : 1.4));
    var jf = 500 + 2600 * e.rpm;
    e.o1.frequency.setTargetAtTime(jf, t, 0.03); e.f1.frequency.setTargetAtTime(jf, t, 0.03);
    e.g1.gain.setTargetAtTime(0.05 + 0.1 * e.rpm, t, 0.05);
    e.nf.frequency.setTargetAtTime(700 + 2600 * e.rpm, t, 0.05); e.ng.gain.setTargetAtTime(0.06 + 0.42 * e.thr * e.rpm, t, 0.05);
    e.ng2.gain.setTargetAtTime(0.1 + 0.5 * e.thr, t, 0.05);
    return e.rpm;
  }
  var E = e.E, r;
  if (e.gears > 0) {
    // pretend gearbox: each gear tops out at 70% of the next one's speed, so the revs
    // climb, then drop by about a third on every shift
    var top = function (g) { return 1.04 * Math.pow(0.7, e.gears - 1 - g); };
    r = x / top(e.gear);
    if (r > 0.97 && e.gear < e.gears - 1 && thr > 0.5 && !st.air) { e.gear++; e.shiftT = 0.09; r = x / top(e.gear); }
    else if (r < 0.56 && e.gear > 0) { e.gear--; r = x / top(e.gear); }
    target = Math.min(1.1, r);
    if (st.air && thr > 0.5) target = Math.min(1.12, target * 1.16);       // wheel off the ground with the gas open: the revs flare
  } else {
    target = 0.22 + 0.42 * thr + 0.36 * Math.min(1.1, x);     // twist-and-go: revs follow the throttle
  }
  if (st.boost) target = Math.min(1.2, target * 1.08);
  e.rpm += (target - e.rpm) * Math.min(1, dt * (target > e.rpm ? 9 : 6));
  if (e.shiftT > 0) e.shiftT -= dt;
  // firing rate is proportional to revs, but never below tick-over
  var hz = Math.max(E.lo, E.hi * e.rpm) * e.pitch, k = (hz / e.pitch - E.lo) / (E.hi - E.lo);
  e.src.playbackRate.setTargetAtTime(hz / F0, t, 0.012);
  var load = e.shiftT > 0 ? 0.15 : e.thr;
  // the filter follows the exhaust note, so every engine opens up the same way whatever its pitch
  var ringHz = hz * E.ring;
  e.lp.frequency.setTargetAtTime(Math.min(16000, (ringHz * (2.4 + 4.4 * load) + 450 + 2600 * load * (0.3 + k)) * E.bright), t, 0.03);
  e.pre.gain.setTargetAtTime(0.34 + 0.34 * load + 0.1 * k, t, 0.02);
  e.post.gain.setTargetAtTime((0.4 + 0.22 * load + 0.1 * k) * (E.level || 1), t, 0.03);
  e.nf.frequency.setTargetAtTime(600 + 3200 * k, t, 0.03);
  e.ng.gain.setTargetAtTime(E.noise * load * (0.03 + 0.1 * k), t, 0.03);
  return e.rpm;
};
S.engineInfo = function () { return eng ? { rpm: eng.rpm, gear: eng.gear } : null; };

/* ------------------------------ continuous layers ------------------------------ */
var layers = null, ambNodes = null, ambTimer = null, ambWorld = -1;
S.layersStart = function () {
  if (!ok || layers) return;
  layers = {
    skid: loopNoise('bandpass', 1100, 2.2), dirt: loopNoise('lowpass', 520, 0.6), wind: loopNoise('bandpass', 500, 0.6, true), kerb: loopNoise('lowpass', 210, 2.5, true),
    scrape: loopNoise('highpass', 2600, 0.8), boost: loopNoise('bandpass', 900, 0.9)
  };
};
/* st: { skid, dirt, wind, scrape, boost } each 0..1 */
S.layersUpdate = function (st) {
  if (!layers) return;
  var t = ac.currentTime;
  layers.skid.g.gain.setTargetAtTime(Math.min(0.2, st.skid * 0.2), t, 0.04);
  layers.dirt.g.gain.setTargetAtTime(Math.min(0.3, st.dirt * 0.3), t, 0.05);
  layers.wind.g.gain.setTargetAtTime(Math.min(0.5, st.wind * 0.5), t, 0.12);
  layers.wind.f.frequency.setTargetAtTime(300 + 900 * st.wind, t, 0.12);
  layers.scrape.g.gain.setTargetAtTime(Math.min(0.2, st.scrape * 0.2), t, 0.03);
  layers.boost.g.gain.setTargetAtTime(st.boost * 0.22, t, 0.06);
  layers.kerb.g.gain.setTargetAtTime((st.kerb || 0) * 0.55, t, 0.03);
  layers.boost.f.frequency.setTargetAtTime(700 + 1400 * st.boost, t, 0.1);
};
S.layersQuiet = function () { if (layers) S.layersUpdate({ skid: 0, dirt: 0, wind: 0, scrape: 0, boost: 0, kerb: 0 }); };

/* a quiet bed of world sound: wind, birds, rumble, radio blips */
var AMB = { dust: ['bandpass', 380, 0.5, 0.11], pine: ['bandpass', 900, 0.4, 0.05], race: ['bandpass', 760, 0.7, 0.1], frost: ['bandpass', 620, 2.5, 0.13], cinder: ['lowpass', 130, 0.7, 0.3], orbit: ['lowpass', 90, 0.7, 0.16] };
S.ambient = function (wi, id) {
  if (!ok || wi === ambWorld) return;
  ambWorld = wi;
  if (ambNodes) { var o = ambNodes; o.g.gain.setTargetAtTime(0, ac.currentTime, 0.2); setTimeout(function () { try { o.src.stop(); } catch (e) {} }, 900); ambNodes = null; }
  if (ambTimer) { clearInterval(ambTimer); ambTimer = null; }
  if (wi < 0) return;
  var cfg = AMB[id] || AMB.dust;
  ambNodes = loopNoise(cfg[0], cfg[1], cfg[2], true);
  ambNodes.g.gain.setTargetAtTime(cfg[3], ac.currentTime, 0.6);
  ambTimer = setInterval(function () {
    if (!ok || ac.state !== 'running') return;
    var r = Math.random();
    if (id === 'pine' && r < 0.5) { var f = 2400 + Math.random() * 1400, n = 2 + (Math.random() * 3 | 0); for (var i = 0; i < n; i++) tone('sine', f, f * (1.1 + Math.random() * 0.25), 0.07, 0.035, i * 0.11); }       // birds
    else if (id === 'frost' && r < 0.6) { ambNodes && ambNodes.f.frequency.setTargetAtTime(420 + Math.random() * 520, ac.currentTime, 0.9); }                                                                       // gusts
    else if (id === 'cinder' && r < 0.6) { noise(0.05, 'highpass', 3000, 0, 0.7, 0.05, Math.random() * 0.4); if (r < 0.2) tone('sine', 55, 32, 0.9, 0.12); }                                                         // crackle, rumble
    else if (id === 'orbit' && r < 0.3) { tone('square', 1180, 1180, 0.06, 0.02); tone('square', 880, 880, 0.06, 0.02, 0.12); }                                                                                    // radio
    else if (id === 'dust' && r < 0.3) { ambNodes && ambNodes.f.frequency.setTargetAtTime(280 + Math.random() * 300, ac.currentTime, 1.2); }
    else if (id === 'race') {                                                                                                                                                                                     // the crowd
      if (r < 0.45 && ambNodes) { ambNodes.f.frequency.setTargetAtTime(620 + Math.random() * 500, ac.currentTime, 0.5); ambNodes.g.gain.setTargetAtTime(0.08 + Math.random() * 0.1, ac.currentTime, 0.4); }
      else if (r > 0.9) { tone('square', 233, 233, 0.5, 0.012, 0, null, 0.03); tone('square', 311, 311, 0.5, 0.012, 0, null, 0.03); }
    }
  }, 1700);
};

/* ------------------------------ one-shot effects ------------------------------ */
S.land = function (v, mat) {
  if (!ok) return;
  var k = Math.min(1, v / 9);
  if (k < 0.08) return;
  tone('sine', 120 - 30 * k, 42, 0.14 + 0.14 * k, 0.5 * k + 0.08);
  noise(0.09 + 0.1 * k, 'lowpass', 1200, 240, 0.7, 0.3 * k + 0.05);
  if (mat === 6) noise(0.2, 'highpass', 1800, 900, 0.5, 0.12 * k);           // snow crunch
  else if (mat === 4) tone('triangle', 240, 180, 0.07, 0.2 * k);               // wood knock
  else if (mat === 5) bell(310, 0.25, 0.07 * k);                               // steel ring
  if (k > 0.55) { tone('triangle', 410, 380, 0.05, 0.12 * k, 0.012); tone('triangle', 610, 590, 0.04, 0.08 * k, 0.02); }
};
S.bottom = function (v) {
  if (!ok) return;
  var k = Math.min(1, v / 5);
  tone('square', 170, 120, 0.06, 0.16 * k + 0.05); noise(0.07, 'bandpass', 2400, 1600, 2, 0.2 * k + 0.05); tone('sine', 70, 40, 0.16, 0.3 * k);
};
S.crash = function (v) {
  if (!ok) return;
  var k = Math.min(1, 0.5 + v / 24);
  noise(0.4, 'bandpass', 1500, 500, 0.6, 0.6 * k); tone('sine', 95, 28, 0.45, 0.65 * k); noise(0.12, 'highpass', 4000, 3000, 0.5, 0.25 * k);
  var fs = [523, 811, 1307, 1663, 2210];
  for (var i = 0; i < 5; i++) tone('triangle', fs[i] * (0.94 + Math.random() * 0.12), fs[i] * 0.9, 0.12 + Math.random() * 0.1, 0.1 * k, 0.03 + i * 0.07 + Math.random() * 0.05);
  for (i = 0; i < 6; i++) noise(0.03, 'bandpass', 900 + Math.random() * 2500, 0, 3, 0.12 * k, 0.15 + i * 0.09 + Math.random() * 0.06);
  // the rider's opinion of it
  tone('sawtooth', 300, 150, 0.2, 0.07, 0.03);
};
S.splash = function (type) {
  if (!ok) return;
  if (type === 'lava') { noise(1.0, 'highpass', 2600, 5200, 0.6, 0.4, 0, null, false, 0.02); tone('sine', 80, 34, 0.5, 0.5); noise(0.5, 'lowpass', 500, 160, 0.8, 0.5); }
  else { noise(0.55, 'bandpass', 2000, 420, 0.7, 0.55); noise(0.25, 'highpass', 5200, 3800, 0.6, 0.2, 0.04); tone('sine', 150, 60, 0.3, 0.3);
    for (var i = 0; i < 5; i++) tone('sine', 300 + Math.random() * 500, 900 + Math.random() * 700, 0.06, 0.06, 0.25 + i * 0.09); }
};
S.fall = function () { if (!ok) return; tone('sine', 620, 110, 0.9, 0.14); tone('triangle', 930, 160, 0.9, 0.05); };
S.flip = function (n) {
  if (!ok) return;
  var base = [659.3, 830.6, 987.8, 1318.5, 1661.2, 1975.5], cnt = Math.min(6, 2 + n);
  for (var i = 0; i < cnt; i++) { tone('triangle', base[i], base[i], 0.2, 0.14, i * 0.055); tone('sine', base[i] * 2, base[i] * 2, 0.14, 0.05, i * 0.055); }
  noise(0.35, 'highpass', 6000, 9000, 0.5, 0.05, 0.05);
};
S.boost = function () { if (!ok) return; noise(0.5, 'bandpass', 320, 2600, 1.2, 0.35, 0, null, false, 0.05); tone('sawtooth', 110, 360, 0.4, 0.07, 0, null, 0.05); };
S.air = function () { if (!ok) return; tone('sine', 880, 1320, 0.12, 0.07); };
S.go = function () { if (!ok) return; tone('square', 1320, 1320, 0.14, 0.07); tone('sine', 1320, 1320, 0.2, 0.1); };
S.finish = function () {
  if (!ok) return;
  var seq = [[523.3, 0], [659.3, 0.11], [784, 0.22], [1046.5, 0.36]];
  seq.forEach(function (s, i) { var d = i === 3 ? 0.7 : 0.16; tone('square', s[0], s[0], d, 0.08, s[1]); tone('triangle', s[0] * 0.5, s[0] * 0.5, d, 0.14, s[1]); if (i === 3) { tone('square', 1318.5, 1318.5, 0.7, 0.05, s[1]); tone('square', 1568, 1568, 0.7, 0.04, s[1]); } });
  noise(0.9, 'highpass', 5000, 8000, 0.5, 0.06, 0.36, null, false, 0.05);
};
/* raceway */
S.pad = function () { if (!ok) return; noise(0.35, 'bandpass', 500, 3200, 1.4, 0.28, 0, null, false, 0.03); tone('sawtooth', 180, 520, 0.3, 0.07, 0, null, 0.03); tone('sine', 660, 1320, 0.18, 0.08, 0.02); };
S.crunch = function () {
  if (!ok) return;
  noise(0.5, 'lowpass', 1800, 300, 0.7, 0.7); tone('sine', 90, 30, 0.4, 0.6);
  for (var i = 0; i < 6; i++) noise(0.04, 'bandpass', 1500 + Math.random() * 3000, 0, 4, 0.18, 0.05 + i * 0.06);
  for (i = 0; i < 6; i++) { var f = 1800 + Math.random() * 2600; tone('triangle', f, f * 0.96, 0.12, 0.06, 0.08 + i * 0.05); }
  tone('square', 392, 392, 0.55, 0.035, 0.3, null, 0.02); tone('square', 494, 494, 0.55, 0.035, 0.3, null, 0.02);     // a horn that got leant on
};
/* the roll hoop doing its job */
S.bonk = function () { if (!ok) return; tone('sine', 170, 520, 0.09, 0.4); tone('sine', 520, 150, 0.3, 0.3, 0.07); tone('triangle', 780, 760, 0.12, 0.1, 0.01); };
S.knock = function (v) { if (!ok) return; var k = Math.min(1, v / 8); if (k < 0.12) return; tone('triangle', 260, 180, 0.06, 0.22 * k); noise(0.04, 'bandpass', 1400, 0, 2, 0.1 * k); };
/* the crash animations: one small sound each */
S.wipe = function (kind, v) {
  if (!ok) return;
  var i, f, k;
  switch (kind) {
    case 'stars': [1318.5, 1568, 1975.5, 1568, 1318.5, 1568].forEach(function (n, j) { tone('sine', n, n, 0.12, 0.07, j * 0.08); }); break;
    case 'birds': for (i = 0; i < 7; i++) { f = 2500 + Math.random() * 900; tone('sine', f, f * 1.22, 0.06, 0.05, i * 0.12 + Math.random() * 0.03); } break;
    case 'inflate': tone('sine', 300, 950, 0.42, 0.12, 0, null, 0.02); tone('triangle', 600, 1900, 0.42, 0.04, 0, null, 0.02); break;
    case 'pop': noise(0.08, 'highpass', 1200, 0, 0.7, 0.7); tone('sine', 420, 80, 0.12, 0.5); break;
    case 'tumble': tone('sine', 880, 868, 0.22, 0.1, 0.1, null, 0.03); tone('sine', 660, 640, 0.42, 0.1, 0.36, null, 0.03); for (i = 0; i < 4; i++) noise(0.07, 'bandpass', 2600, 1800, 1.2, 0.06, i * 0.16, null, false, 0.02); break;
    case 'poof': noise(0.3, 'lowpass', 900, 200, 0.7, 0.4, 0, null, false, 0.02); break;
    case 'bleat': for (i = 0; i < 8; i++) tone('sawtooth', 440 - i * 5, 410 - i * 5, 0.05, 0.08, i * 0.065); break;
    case 'bell': bell(196, 1.6, 0.24); bell(98, 1.8, 0.18); tone('sine', 520, 330, 1.1, 0.03, 0.4, null, 0.3); break;
    case 'smash': noise(0.3, 'highpass', 3000, 6000, 0.6, 0.5); for (i = 0; i < 10; i++) { f = 1500 + Math.random() * 3500; tone('triangle', f, f * 0.97, 0.1 + Math.random() * 0.15, 0.07, Math.random() * 0.28); } break;
    case 'zap': for (i = 0; i < 12; i++) { tone('sawtooth', 112, 108, 0.04, 0.15, i * 0.055); noise(0.03, 'highpass', 5000, 0, 0.7, 0.1, i * 0.055 + 0.02); } break;
    case 'boing': k = Math.max(0.2, Math.min(1, (v || 5) / 9)); tone('sine', 160 + 140 * k, 420 + 200 * k, 0.08, 0.3 * k); tone('sine', 420 + 200 * k, 200, 0.22, 0.22 * k, 0.07); break;
    case 'whistleUp': tone('sine', 500, 2600, 0.8, 0.09, 0, null, 0.05); break;
    case 'ting': bell(2637, 0.8, 0.13); tone('sine', 5274, 5274, 0.3, 0.035); break;
    case 'spring': for (i = 0; i < 6; i++) tone('sine', 300 + (i % 2 ? 120 : 0) + i * 20, 220 + (i % 2 ? 160 : 0), 0.09, 0.16 * (1 - i / 7), i * 0.085); break;
    case 'boom': noise(0.7, 'lowpass', 900, 120, 0.7, 0.8); tone('sine', 70, 28, 0.6, 0.7); for (i = 0; i < 14; i++) noise(0.03, 'highpass', 4000, 0, 0.7, 0.09, 0.25 + Math.random() * 0.9); break;
    case 'flutter': for (i = 0; i < 5; i++) noise(0.1, 'bandpass', 900, 600, 1.5, 0.07, i * 0.28, null, false, 0.04); tone('sine', 900, 300, 1.2, 0.045, 0, null, 0.1); break;
    case 'pat': noise(0.06, 'lowpass', 700, 300, 0.7, 0.2); tone('sine', 140, 90, 0.08, 0.15); break;
    case 'pomf': noise(0.25, 'lowpass', 600, 200, 0.7, 0.5, 0, null, true); tone('sine', 220, 110, 0.2, 0.3); break;
    case 'squeak': f = 900 + Math.random() * 500; tone('sine', f, f * 1.6, 0.05, 0.045); break;
    case 'whoosh': noise(0.4, 'bandpass', 400, 1800, 1, 0.3, 0, null, false, 0.08); break;
    case 'fwump': noise(0.3, 'lowpass', 500, 150, 0.7, 0.6, 0, null, true, 0.01); tone('sine', 110, 60, 0.25, 0.4); break;
  }
};
/* nuggets and geodes */
S.coin = function (n) { if (!ok) return; var c = Math.min(5, n || 1); for (var i = 0; i < c; i++) { tone('square', 1568, 1568, 0.05, 0.045, i * 0.07); tone('square', 2093, 2093, 0.1, 0.045, i * 0.07 + 0.045); } };
S.geode = function (stage, rank) {
  if (!ok) return;
  var i, f;
  if (stage === 'tap') { noise(0.05, 'bandpass', 900, 0, 3, 0.35); tone('triangle', 180 + (rank || 0) * 30, 140, 0.07, 0.3); }
  else if (stage === 'crack') { noise(0.18, 'highpass', 2000, 5000, 0.7, 0.35); tone('triangle', 700, 300, 0.1, 0.2); for (i = 0; i < 4; i++) noise(0.03, 'bandpass', 2400 + Math.random() * 2000, 0, 3, 0.12, 0.04 + i * 0.04); }
  else if (stage === 'open') {
    // the better the find, the longer and brighter the fanfare
    var scale = [523.3, 659.3, 784, 1046.5, 1318.5, 1568, 2093, 2637], n = 3 + (rank || 0);
    noise(0.25, 'lowpass', 1400, 300, 0.7, 0.5); tone('sine', 110, 40, 0.3, 0.5);
    for (i = 0; i < n; i++) { f = scale[Math.min(scale.length - 1, i + (rank > 2 ? 1 : 0))]; tone('triangle', f, f, 0.24, 0.1, 0.1 + i * 0.07); tone('sine', f * 2, f * 2, 0.3, 0.04, 0.1 + i * 0.07); }
    if (rank >= 2) noise(0.6 + rank * 0.25, 'highpass', 6000, 10000, 0.5, 0.05 + rank * 0.012, 0.15, null, false, 0.1);
    if (rank >= 3) for (i = 0; i < 6 + rank * 3; i++) { f = 2093 * Math.pow(2, Math.floor(Math.random() * 12) / 12); tone('sine', f, f, 0.18, 0.035, 0.5 + i * 0.08 + Math.random() * 0.04); }
    if (rank >= 4) { bell(1046.5, 1.8, 0.12, 0.2); bell(1568, 1.8, 0.1, 0.3); bell(2093, 2.0, 0.09, 0.42); }
  }
};
S.star = function (i) { bell([880, 1108.7, 1318.5][i] || 880, 0.7, 0.2); if (ok) noise(0.12, 'highpass', 7000, 9000, 0.5, 0.05); };
S.newBest = function () { if (!ok) return; [1046.5, 1318.5, 1568, 2093, 2637].forEach(function (f, i) { tone('sine', f, f, 0.22, 0.09, i * 0.06); tone('triangle', f * 1.5, f * 1.5, 0.12, 0.03, i * 0.06); }); };
S.unlocked = function () { if (!ok) return; [392, 523.3, 659.3, 784, 1046.5].forEach(function (f, i) { tone('square', f, f, 0.18, 0.07, i * 0.08); tone('triangle', f * 2, f * 2, 0.3, 0.07, i * 0.08); }); noise(0.8, 'highpass', 6000, 10000, 0.5, 0.06, 0.3, null, false, 0.1); };
S.ui = function (kind) {
  if (!ok) return;
  if (kind === 'tap') { tone('sine', 880, 620, 0.05, 0.12); noise(0.015, 'highpass', 5000, 0, 0.7, 0.05); }
  else if (kind === 'go') { tone('triangle', 523.3, 523.3, 0.07, 0.14); tone('triangle', 784, 784, 0.12, 0.14, 0.06); tone('sine', 1568, 1568, 0.12, 0.05, 0.06); }
  else if (kind === 'back') { tone('triangle', 660, 440, 0.09, 0.12); }
  else if (kind === 'no') { tone('square', 140, 110, 0.13, 0.1); tone('square', 147, 116, 0.13, 0.08); }
  else if (kind === 'swipe') { noise(0.12, 'bandpass', 900, 2600, 1.4, 0.1); tone('sine', 440, 660, 0.07, 0.06); }
  else if (kind === 'toggle') { tone('sine', 700, 1050, 0.05, 0.11); }
};

/* ------------------------------ menu music ------------------------------ */
/* A short four-bar groove: kick, clap, hats, a bass line and a plucked arpeggio. */
var mus = { on: false, timer: null, next: 0, step: 0, gain: null };
var NOTE = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };
var CHORDS = [[40, 52, 55, 59, 64], [36, 48, 52, 55, 60], [43, 55, 59, 62, 67], [38, 50, 54, 57, 62]];   // Em, C, G, D
var ARP = [1, 3, 2, 4, 3, 2, 1, 3, 2, 4, 3, 2, 4, 3, 2, 1];
var BASS = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
function musStep(t, step) {
  var bar = Math.floor(step / 16) % 4, s = step % 16, ch = CHORDS[bar], g = mus.gain;
  var w = t - ac.currentTime;
  if (s % 4 === 0) { tone('sine', 150, 44, 0.16, 0.5, w, g); noise(0.02, 'highpass', 3000, 0, 0.7, 0.08, w, g); }
  if (s === 4 || s === 12) { noise(0.12, 'bandpass', 1700, 1300, 0.9, 0.28, w, g); tone('triangle', 190, 150, 0.08, 0.12, w, g); }
  if (s % 2 === 1 || s === 14) noise(0.03, 'highpass', 8000, 0, 0.7, s % 4 === 3 ? 0.07 : 0.04, w, g);
  if (BASS[s]) {
    var bf = NOTE(ch[0] - (s === 11 ? 0 : 12) + (s === 13 ? 7 : 0));
    var o = ac.createOscillator(), f = ac.createBiquadFilter(), bg = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = bf; f.type = 'lowpass'; f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(180, t + 0.18); f.Q.value = 3;
    env(bg, t, 0.005, 0.26, 0.2); o.connect(f); f.connect(bg); bg.connect(g); o.start(t); o.stop(t + 0.3);
  }
  var an = ch[ARP[s]] + 12, af = NOTE(an), acc = s % 4 === 0 ? 1.3 : 1;
  tone('triangle', af, af, 0.16, 0.075 * acc, w, g); tone('square', af, af, 0.07, 0.022 * acc, w, g);
  if (bar === 3 && s >= 12) tone('triangle', NOTE(ch[4] + 12 + (s - 12) * 2), 0, 0.12, 0.05, w, g);
}
S.music = function (on) {
  if (!ok) { mus.want = on; return; }
  if (on === mus.on) return;
  mus.on = on;
  if (on) {
    if (!mus.gain) { mus.gain = ac.createGain(); mus.gain.connect(musBus); }
    mus.gain.gain.cancelScheduledValues(ac.currentTime); mus.gain.gain.setTargetAtTime(1, ac.currentTime, 0.3);
    mus.next = ac.currentTime + 0.08; mus.step = 0;
    var spb = 60 / 112 / 4;
    mus.timer = setInterval(function () {
      if (ac.state !== 'running') { mus.next = ac.currentTime + 0.1; return; }
      if (mus.next < ac.currentTime) mus.next = ac.currentTime + 0.05;
      while (mus.next < ac.currentTime + 0.22) { musStep(mus.next, mus.step); mus.step++; mus.next += spb * (mus.step % 2 ? 1.12 : 0.88); }
    }, 60);
  } else {
    if (mus.timer) clearInterval(mus.timer); mus.timer = null;
    if (mus.gain) mus.gain.gain.setTargetAtTime(0, ac.currentTime, 0.12);
  }
};
S.musicWanted = function () { return mus.want; };
S._eng = ENG; S._engineBuffer = engineBuffer;
})(typeof window !== 'undefined' ? window : globalThis);
