// How long can you hold a lean on flat ground / in the air before it is unrecoverable with no further input?
const RR = require('../src/physics.js'); require('../src/builder.js'); require('../src/bikes.js');
const world = { id: 'w', gravity: 9.81, mat: 0, pit: 'fall' };
const tb = new RR.TB(world, 1); tb.flat(900); const flat = tb.finish('f', 'f');
const tb2 = new RR.TB(world, 1); tb2.flat(50).kicker(22, 8, 1.2).drop(1.5).flat(300); const jt = tb2.finish('j', 'j');
function run(tr, d, t0, dur, dir, after) {
  const s = RR.createSim(RR.prepBike(d), tr); s.started = true; let maxA = 0;
  for (let i = 0; i < 120 * 14; i++) {
    const t = i / 120; let lean = 0;
    if (t0 === 'air') { if (s.air && s.airT < dur) lean = dir; } else if (t >= t0 && t < t0 + dur) lean = dir;
    RR.tick(s, { lean, gas: true, brake: false }); s.events.length = 0;
    if (Math.abs(s.a) > maxA) maxA = Math.abs(s.a);
    if (s.crashed) return 'X';
  }
  return (maxA * 57.3).toFixed(0);
}
for (const id of (process.argv[2] || 'scrapper,mosquito,goat,volt,razor').split(',')) {
  const d = RR.BIKE[id];
  console.log(id);
  for (const [name, tr, t0] of [['standstill', flat, 0], ['at speed', flat, 5], ['in air', jt, 'air']]) {
    let line = '  ' + name.padEnd(11);
    for (const dir of [-1, 1]) { line += dir < 0 ? ' back:' : '  fwd:'; for (const dur of [0.15, 0.3, 0.5, 0.75, 1.0, 1.5]) line += ' ' + dur + 's=' + run(tr, d, t0, dur, dir); }
    console.log(line);
  }
}
