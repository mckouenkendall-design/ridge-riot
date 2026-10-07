// node tools/trace.js <track> <bike> <mode: none|bot> <t0> <t1>
const RR = require('../src/physics.js'); require('../src/builder.js'); require('../src/bikes.js'); require('../src/tracks.js'); require('../src/bot.js');
const [ti, bid, mode, t0, t1] = [+process.argv[2], process.argv[3] || 'scrapper', process.argv[4] || 'none', +(process.argv[5] || 0), +(process.argv[6] || 99)];
const tr = RR.getTrack(ti), b = RR.prepBike(RR.BIKE[bid]), s = RR.createSim(b, tr); s.started = true;
const out = { lean: 0, brake: false, gas: true };
for (let i = 0; i < 120 * 100; i++) {
  if (mode === 'bot') RR.botInput(s, {}, out); else if (mode === 'back') out.lean = -1; else if (mode === 'fwd') out.lean = 1;
  RR.tick(s, out);
  const t = i / 120;
  for (const e of s.events) if (t >= t0 && t <= t1) console.log('   ev', t.toFixed(2), JSON.stringify(e, (k, v) => typeof v === 'number' ? +v.toFixed(2) : v));
  s.events.length = 0;
  if (t >= t0 && t <= t1 && i % 12 === 0) console.log(t.toFixed(2), 'x', s.x.toFixed(1), 'y', s.y.toFixed(2), 'gy', RR.groundY(tr, s.x).toFixed(2), 'slope', (RR.groundSlope(tr, s.x) * 57.3).toFixed(0), 'v', Math.hypot(s.vx, s.vy).toFixed(1), 'a', (s.a * 57.3).toFixed(0), 'w', s.w.toFixed(2), 'comp', s.comp.map(v => v.toFixed(2)).join(','), 'gnd', s.gnd.map(v => v ? 1 : 0).join(''), 'ld', s.load.map(v => Math.round(v)).join(','), 'lean', out.lean, 'F', Math.round(s.driveF));
  if (s.crashed || s.finished) { console.log('END', t.toFixed(2), s.crashed ? 'crash ' + s.crashCause + ' x=' + s.x.toFixed(1) : 'finish ' + s.time.toFixed(2)); break; }
}
