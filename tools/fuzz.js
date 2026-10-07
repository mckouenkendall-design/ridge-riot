/* Throws random and robot inputs at every bike on every track looking for physics blow-ups. */
const RR = require('../src/physics.js'); require('../src/builder.js'); require('../src/bikes.js'); require('../src/tracks.js'); require('../src/bot.js');
const N = +(process.argv[2] || 6);
let runs = 0, glitches = 0, maxV = 0, maxW = 0, where = [];
for (let ti = 0; ti < RR.TRACK_COUNT; ti++) for (const d of RR.BIKES) {
  const tr = RR.getTrack(ti), b = RR.prepBike(d), s = RR.createSim(b, tr);
  for (let r = 0; r < N; r++) {
    RR.resetSim(s); s.started = true; s.glitch = 0; runs++;
    let seed = (ti * 131 + d.index * 17 + r * 7919) >>> 0; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const out = { lean: 0, brake: false, gas: true }; let cur = 0, brk = false; const mode = r % 3;
    for (let i = 0; i < 120 * 90; i++) {
      if (i % 10 === 0) { RR.botInput(s, {}, out); const q = rnd(); cur = mode === 0 ? out.lean : q < 0.5 ? out.lean : q < 0.75 ? -1 : 1; if (mode === 2 && q < 0.3) cur = q < 0.15 ? -1 : 1; brk = rnd() < 0.05; }
      RR.tick(s, { lean: cur, brake: brk, gas: mode === 0 ? out.gas : rnd() < 0.9 }); s.events.length = 0;
      const v = Math.hypot(s.vx, s.vy); if (v > maxV) maxV = v; if (Math.abs(s.w) > maxW) maxW = Math.abs(s.w);
      if (s.glitch) { glitches++; where.push([ti, d.id, Math.round(s.x)]); break; }
      if (s.finished || s.sinceCrash > 2.5) break;
    }
  }
}
console.log('runs', runs, 'glitches', glitches, 'max speed seen', maxV.toFixed(1), 'm/s, max spin', maxW.toFixed(1), 'rad/s', where.slice(0, 10));
