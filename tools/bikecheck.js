const RR = require('../src/physics.js'); require('../src/builder.js'); require('../src/bikes.js');
const world = { id: 'w', gravity: 9.81, mat: 0, pit: 'fall' };
const tb = new RR.TB(world, 1); tb.flat(900); const flat = tb.finish('f', 'f');
const tb2 = new RR.TB(world, 1); tb2.flat(60).kicker(25, 8, 1.5).drop(3).flat(300); const jumpT = tb2.finish('j', 'j');
console.log('bike      sagR  sagF  t0-90%  vmax  maxPitch  brake(m)  flipT  backLean: pitch@0.3s/0.6s  jump: air  landPitch bottom');
for (const d of RR.BIKES) {
  const b = RR.prepBike(d);
  let s = RR.createSim(b, flat); s.started = true;
  const sag = s.comp.slice();
  let t90 = 0, maxP = 0;
  for (let i = 0; i < 120 * 14; i++) { RR.tick(s, { lean: 0, gas: true, brake: false }); if (!t90 && s.vx > 0.9 * d.vmax) t90 = i / 120; if (s.a > maxP) maxP = s.a; }
  const vmax = s.vx; const x0 = s.x;
  for (let i = 0; i < 120 * 8 && s.vx > 0.3; i++) RR.tick(s, { lean: 0, gas: false, brake: true });
  const bd = s.x - x0; const flippedBrake = s.crashed;
  // flip time: free fall from 40 m
  s = RR.createSim(b, flat); s.y += 60; s.wy[0] += 60; s.wy[1] += 60; let ft = 0;
  for (let i = 0; i < 400; i++) { RR.tick(s, { lean: -1, gas: false, brake: false }); if (s.a > 2 * Math.PI) { ft = i / 120; break; } }
  // lean back from standstill
  s = RR.createSim(b, flat); s.started = true; let p3 = 0, p6 = 0;
  for (let i = 0; i < 73; i++) { RR.tick(s, { lean: -1, gas: true, brake: false }); if (i === 36) p3 = s.a; if (i === 72) p6 = s.a; }
  // jump
  s = RR.createSim(b, jumpT); s.started = true; let air = 0, landP = null, bott = 0, crashed = '';
  for (let i = 0; i < 120 * 14; i++) { RR.tick(s, { lean: 0, gas: true, brake: false });
    for (const e of s.events) { if (e.t === 'land' && landP === null && e.air > 0.5) { landP = s.a; air = e.air; } if (e.t === 'bottom' && landP !== null) bott++; if (e.t === 'crash') crashed = 'CRASH'; }
    s.events.length = 0; if (s.x > 150 || s.crashed) break; }
  console.log(d.id.padEnd(9), sag[0].toFixed(3), sag[1].toFixed(3), t90.toFixed(1).padStart(6), vmax.toFixed(1).padStart(6), (maxP * 57.3).toFixed(0).padStart(7), (bd.toFixed(0) + (flippedBrake ? '!' : '')).padStart(8), ft.toFixed(2).padStart(8), (p3 * 57.3).toFixed(0).padStart(12), (p6 * 57.3).toFixed(0).padStart(4), air.toFixed(2).padStart(12), landP === null ? '   -' : (landP * 57.3).toFixed(0).padStart(6), String(bott).padStart(5), crashed);
}
