const RR = require('../src/physics.js'); require('../src/builder.js'); require('../src/bikes.js'); require('../src/tracks.js'); require('../src/bot.js');
// brute force: many noisy runs per bike on a track, report any glitch with the state just before it
const ti = +process.argv[2], ids = (process.argv[3] || 'biscotti').split(','), N = +(process.argv[4] || 200);
let found = 0;
for (const id of ids) {
  const tr = RR.getTrack(ti), b = RR.prepBike(RR.BIKE[id]), s = RR.createSim(b, tr);
  for (let r = 0; r < N; r++) {
    RR.resetSim(s); s.started = true; s.glitch = 0;
    let seed = r * 7919 + 13; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const out = { lean: 0, brake: false, gas: true }; let cur = 0, hist = [];
    for (let i = 0; i < 120 * 80; i++) {
      if (i % 12 === 0) { const q = rnd(); cur = q < 0.5 ? 0 : q < 0.75 ? -1 : 1; if (rnd() < 0.3) { RR.botInput(s, {}, out); cur = out.lean; } }
      const snap = [s.x, s.y, s.a, s.vx, s.vy, s.w, s.wx[0] - s.x, s.wy[0] - s.y, s.wx[1] - s.x, s.wy[1] - s.y, s.ww[0], s.ww[1], s.comp[0], s.comp[1]].map(v => +v.toFixed(2));
      hist.push(snap); if (hist.length > 4) hist.shift();
      RR.tick(s, { lean: cur, brake: rnd() < 0.02, gas: true }); s.events.length = 0;
      if (s.glitch) { found++; if (found <= 3) { console.log(id, 'run', r, 'tick', i, 'glitch; last states [x,y,a,vx,vy,w, rw dx,dy, fw dx,dy, wwR, wwF, compR, compF]:'); hist.forEach(h => console.log('   ', JSON.stringify(h))); console.log('   ground y at x:', RR.groundY(tr, hist[3][0]).toFixed(2), 'slope', RR.groundSlope(tr, hist[3][0]).toFixed(2)); } break; }
      if (s.finished || s.sinceCrash > 3) break;
    }
  }
}
console.log('glitches found:', found);
