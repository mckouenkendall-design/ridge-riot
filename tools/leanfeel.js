/* Measures how the lean control responds in mid-air, so "feel" changes can be compared as numbers.
   usage: node tools/leanfeel.js [bike ids] */
const RR = require('../src/physics.js'); require('../src/builder.js'); require('../src/bikes.js');
const world = { id: 'w', gravity: 9.81, mat: 0, pit: 'fall' };
const tb = new RR.TB(world, 1); tb.flat(900); const flat = tb.finish('f', 'f');
function drop(d) { const s = RR.createSim(RR.prepBike(d), flat); s.y += 900; s.wy[0] += 900; s.wy[1] += 900; s.started = true; for (let i = 0; i < 30; i++) RR.tick(s, { lean: 0, gas: false, brake: false }); s.a = 0; s.w = 0; return s; }
function run(d, plan, secs) {           // plan(t) -> lean
  const s = drop(d); const a0 = s.a; const out = [];
  for (let i = 0; i < secs * 120; i++) { RR.tick(s, { lean: plan(i / 120), gas: false, brake: false }); out.push([i / 120, s.a - a0, s.w]); }
  return out;
}
const deg = r => (r * 57.3).toFixed(0).padStart(4);
console.log('bike        to 1 rad/s  to 45deg  to 90deg  full flip | tap 0.08s  tap 0.15s  tap 0.3s (degrees turned in the end) | after a 0.6 s hold: spin at release, extra degrees after letting go, time to settle');
for (const id of (process.argv[2] || 'scrapper,mosquito,mule,razor').split(',')) {
  const d = RR.BIKE[id];
  const hold = run(d, () => -1, 3);
  const t = f => { const r = hold.find(f); return r ? r[0].toFixed(2) : ' -- '; };
  const tap = len => { const r = run(d, t => t < len ? -1 : 0, 3); return deg(r[r.length - 1][1]); };
  const rel = run(d, t => t < 0.6 ? -1 : 0, 3.6), i0 = Math.round(0.6 * 120), aR = rel[i0][1], wR = rel[i0][2], aEnd = rel[rel.length - 1][1];
  const settle = rel.find(r => r[0] > 0.6 && Math.abs(r[2]) < 0.35);
  console.log(id.padEnd(10), t(r => r[2] >= 1).padStart(9), t(r => r[1] >= Math.PI / 4).padStart(10), t(r => r[1] >= Math.PI / 2).padStart(9), t(r => r[1] >= 2 * Math.PI - 1.2).padStart(10),
    ' |', tap(0.08).padStart(8), tap(0.15).padStart(10), tap(0.3).padStart(9), '                             |', wR.toFixed(1).padStart(8), 'rad/s', deg(aEnd - aR).padStart(8), (settle ? (settle[0] - 0.6).toFixed(2) : '>3').padStart(10), 's');
}
