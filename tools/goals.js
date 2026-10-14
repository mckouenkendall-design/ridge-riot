/* Checks the goals on a track with robot riders.
   GEAR       which ways of riding pick up the hidden gear and still finish, and whether an ordinary careful ride
              (the learned rider's line, no flips) or a flat-out ride picks it up by accident (it should not).
   CHALLENGE  whether a robot can pull off the track's challenge on the bike and still finish, and how.
   usage: node tools/goals.js [--tracks 0-47] [--bike scrapper]
   Ways of riding tried: the careful line (zone speeds from skill.js), held to an overall speed limit from 6 m/s
   up, with flips (backward, forward, alternating, up to double) or none, and on two-route tracks each road. */
const RR = require('../src/physics.js');
['builder', 'bikes', 'tracks', 'goals', 'startimes', 'bot'].forEach(f => require('../src/' + f + '.js'));
const S = require('./skill.js');

function ride(t, id, P, until) {
  const tr = RR.getTrack(t), s = RR.createSim(RR.prepBike(RR.BIKE[id]), tr); s.started = true; tr.zones = undefined;
  const g = RR.gearOf(tr), cs = RR.chalStart(tr.chal), out = {};
  let gear = false, lastX = s.x, lastT = 0;
  for (let k = 0; k < 120 * 200; k++) {
    RR.botInput(s, P, out);
    const inp = { lean: out.lean, gas: P.flat ? true : out.gas, brake: P.flat ? !!out.trick : (out.brake || !!out.trick) };
    if (P.nobrake) inp.brake = false;
    RR.tick(s, inp);
    if (g && !gear && RR.gearTouch(s, g.x, g.y)) gear = true;
    RR.chalTick(cs, s, inp);
    s.events.length = 0;
    if (s.x > lastX + 2) { lastX = s.x; lastT = s.time; }
    if (s.finished || s.crashed || s.time - lastT > 6) break;
  }
  return { ok: s.finished, t: s.finishTime, gear, chal: cs.done, flips: s.flips, x: s.x, cause: s.crashCause };
}
function policies(cal, id, tr) {
  const out = [], caps = cal.win.map(w => w ? w.aim : 1e9), vmax = RR.BIKE[id].vmax;
  const routes = tr.forks && tr.forks.length ? ['low', 'high'] : [undefined];
  const flipSets = [null, { dir: 'b', max: 1 }, { dir: 'f', max: 1 }, { dir: 'alt', max: 1 }, { dir: 'b', max: 2 }, { dir: 'f', max: 2 }];
  if (tr.chal && tr.chal.t === 'wheelie') for (const vc of [1e9, 6, 8, 10]) out.push({ name: 'wheelies' + (vc < 1e8 ? ', held to ' + vc : ''), P: { caps: caps.slice(), vcap: vc < 1e8 ? vc : cal.G, wheelie: [0, 1e9] } });
  // braver and more timid speeds through the slow zones (staying inside each zone's safe range)
  for (const dz of [-2, -1, 1, 2, 3]) {
    const c2 = cal.win.map(w => !w ? 1e9 : w.open ? 1e9 : Math.max(w.lo, Math.min(w.hi, w.aim + dz)));
    for (const fl of [null, { dir: 'b', max: 1 }]) out.push({ name: 'zones ' + (dz > 0 ? '+' : '') + dz + ' m/s' + (fl ? ', flips b' : ''), P: { caps: c2, vcap: cal.G, flips: fl } });
  }
  for (const route of routes) for (const fl of flipSets) for (const vc of [1e9, 6, 7, 8, 9, 10, 11, 12, 13, 14]) {
    if (vc < 1e8 && vc > vmax) continue;
    out.push({ name: (route ? route + ' road, ' : '') + (fl ? 'flips ' + fl.dir + (fl.max > 1 ? ' up to ' + fl.max : '') : 'no flips') + (vc < 1e8 ? ', held to ' + vc + ' m/s' : ''),
      P: { caps: caps.slice(), vcap: vc < 1e8 ? Math.min(vc, cal.G) : cal.G, flips: fl, route } });
  }
  // slowing down for just the stretch where the gear is (a rider who has spotted it), then riding on as normal
  const h = tr.feats.find(f => f.t === 'gearhint') || (RR.gearOf(tr) && { x0: RR.gearOf(tr).x - 20, x1: RR.gearOf(tr).x + 4 });
  if (h) for (const v of [5, 6, 7, 8, 9, 10, 11, 12]) for (const fl of [null, { dir: 'b', max: 1 }])
    out.push({ name: 'slow to ' + v + ' m/s just for the gear' + (fl ? ', flips b' : ''), P: { caps: caps.slice(), vcap: cal.G, flips: fl, hold: [h.x0 - 6, h.x1, v] } });
  return out;
}
module.exports = { ride, policies };

if (require.main === module) {
  const args = process.argv.slice(2), arg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const [t0, t1] = arg('--tracks', '0-47').split('-').map(Number), id = arg('--bike', 'scrapper');
  for (let t = t0; t <= (isNaN(t1) ? t0 : t1); t++) {
    const tr = RR.getTrack(t), cal = S.calibrate(t, id), g = RR.gearOf(tr);
    const base = ride(t, id, { caps: cal.win.map(w => w ? w.aim : 1e9), vcap: cal.G }), flat = ride(t, id, { flat: true });
    const pol = policies(cal, id, tr), gearBy = [], chalBy = [];
    for (const p of pol) { const r = ride(t, id, p.P); if (r.ok && r.gear) gearBy.push(p.name); if (r.ok && r.chal) chalBy.push(p.name); }
    if (tr.chal && tr.chal.t === 'nobrake') { const r = ride(t, id, { caps: cal.win.map(w => w ? w.aim : 1e9), vcap: cal.G, nobrake: true }); if (r.ok && r.chal) chalBy.push('careful line, lifting instead of braking'); }
    console.log(`#${t + 1} ${tr.name}`);
    console.log(`   gear at ${g ? g.x.toFixed(1) + ', ' + g.y.toFixed(1) : 'NONE'}: careful ride ${base.gear ? 'TAKES IT BY ACCIDENT' : 'misses it'}, flat out ${flat.gear ? 'takes it' + (flat.ok ? ' and finishes' : ' then crashes') : 'misses it'}; found by ${gearBy.length} of ${pol.length} ways: ${gearBy.slice(0, 4).join(' | ') || 'NONE'}`);
    console.log(`   challenge "${RR.chalText(tr.chal || {})}": careful ride ${base.chal ? 'DOES IT BY ACCIDENT' : 'does not do it'}, flat out ${flat.chal ? 'does it' : 'does not'}; done by ${chalBy.length} ways: ${chalBy.slice(0, 4).join(' | ') || 'NONE'}`);
  }
}
