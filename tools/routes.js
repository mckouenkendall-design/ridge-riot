/* Two-route tracks: rides each road with the robot, ridden well (the careful line through any slow zones, full
   gas otherwise, with and without flips), and compares the best times. Both whole-track times and the time from
   the fork sign to where the roads meet again are given. Ridden well, the two roads should be within half a
   second of each other on the starter bike.
   usage: node tools/routes.js [--tracks 0-47] [--bikes scrapper,puffin,...] */
const RR = require('../src/physics.js');
['builder', 'bikes', 'tracks', 'goals', 'startimes', 'bot'].forEach(f => require('../src/' + f + '.js'));
const S = require('./skill.js');
const args = process.argv.slice(2), arg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const [t0, t1] = arg('--tracks', '0-' + (RR.TRACK_COUNT - 1)).split('-').map(Number);
const bikes = arg('--bikes', 'scrapper,puffin,mosquito,mule,razor,couple').split(',');
function ride(t, id, P, fk) {
  const tr = RR.getTrack(t), s = RR.createSim(RR.prepBike(RR.BIKE[id]), tr); s.started = true; tr.zones = undefined;
  const out = {}; let tin = null, tout = null, route = null, lastX = s.x, lastT = 0;
  for (let k = 0; k < 120 * 200; k++) {
    RR.botInput(s, P, out); RR.tick(s, { lean: out.lean, gas: out.gas, brake: out.brake || !!out.trick }); s.events.length = 0;
    if (tin === null && s.x >= fk.x0) tin = s.time;
    if (route === null && s.x >= fk.xe - 0.5) route = s.gates[fk.gate] ? 'high' : 'low';
    if (tout === null && s.x >= fk.j) tout = s.time;
    if (s.x > lastX + 2) { lastX = s.x; lastT = s.time; }
    if (s.finished || s.crashed || s.time - lastT > 6) break;
  }
  return { ok: s.finished, t: s.finishTime, seg: tout - tin, route };
}
for (let t = t0; t <= (isNaN(t1) ? t0 : t1); t++) {
  const tr = RR.getTrack(t), fk = tr.feats.find(f => f.t === 'fork'); if (!fk) continue;
  console.log(`#${t + 1} ${tr.name}`);
  for (const id of bikes) {
    const cal = S.calibrate(t, id), best = { high: null, low: null };
    for (const route of ['high', 'low']) for (const fl of [null, { dir: 'b', max: 1 }, { dir: 'f', max: 1 }, { dir: 'b', max: 2 }]) for (const vc of [1e9, 13, 11]) {
      const r = ride(t, id, { caps: cal.win.map(w => w ? w.aim : 1e9), vcap: Math.min(vc, cal.G), route, flips: fl }, fk);
      if (!r.ok || r.route !== route) continue;
      if (!best[route] || r.t < best[route].t) best[route] = r;
    }
    const h = best.high, l = best.low;
    console.log(`   ${id.padEnd(9)} high road ${h ? h.t.toFixed(2) + 's (split ' + h.seg.toFixed(2) + ')' : 'NOT RIDDEN'}   low road ${l ? l.t.toFixed(2) + 's (split ' + l.seg.toFixed(2) + ')' : 'NOT RIDDEN'}   difference ${h && l ? (h.t - l.t).toFixed(2) + 's' : '?'}`);
  }
}
