/* The momentum lab. Rides every bike into one piece of track at every speed and times it: from where the
   piece starts until a little after it ends, with full gas from the moment the piece starts. A momentum piece
   should never end the run, and the right speed should be clearly quicker than too fast or too slow.
   usage: node tools/momentum.js <piece> [world] [--bikes all|a,b] [--args 1,2,3] [--from 4] [--to 20]
   Prints, per bike: the time at each entry speed (- for a crash), the best speed and how much each wrong speed
   costs. Pieces come from RR.PIECES (src/tracks.js). */
const RR = require('../src/physics.js');
['builder', 'bikes', 'tracks', 'goals', 'bot'].forEach(f => require('../src/' + f + '.js'));

function strip(worldId, fn) {
  const w = RR.WORLD[worldId], b = new RR.TB(w, 99);
  b.flat(150);
  b.slow(0); b.flat(14); b.go();                 // the approach: speed held here, then gas from the piece on
  const x0 = b.x;
  fn(b);
  const x1 = b.x;
  b.flat(40);
  const tr = b.finish('mlab', 'mlab');
  tr.worldIndex = w.index; tr.airless = !!w.airless; tr.mx0 = x0; tr.mx1 = x1;
  return tr;
}
/* returns { ok, t: seconds from x0 to x1 + 12, v: speed there } */
function ride(tr, bikeId, v, opts) {
  opts = opts || {};
  const s = RR.createSim(RR.prepBike(RR.BIKE[bikeId]), tr);
  s.started = true; tr.zones = undefined;
  const nz = tr.feats.filter(f => f.t === 'zone').length, caps = [];
  for (let i = 0; i < nz; i++) caps.push(i === 0 ? v : 1e9);
  const out = {}, P = { caps: caps, early: 0 }, end = tr.mx1 + 12;
  let t0 = null, lastX = s.x, lastT = 0;
  for (let k = 0; k < 120 * 120; k++) {
    RR.botInput(s, P, out);
    // inside the piece: gas all the way, except that the robot lifts off when the front wheel is coming up too far
    // (a person would too: holding the gas into a wheelie until you flip over is not a speed choice)
    const inPiece = s.x >= tr.mx0;
    RR.tick(s, { lean: out.lean, gas: inPiece ? !(s.gnd[0] && !s.gnd[1] && s.a > 0.75) : out.gas, brake: inPiece ? !!out.trick : (out.brake || !!out.trick) });
    s.events.length = 0;
    if (t0 === null && s.x >= tr.mx0) t0 = s.time;
    if (s.x > lastX + 2) { lastX = s.x; lastT = s.time; }
    if (s.crashed) return { ok: false, cause: s.crashCause, x: s.x - tr.mx0 };
    if (s.x >= end) return { ok: true, t: s.time - t0, out: Math.sqrt(s.vx * s.vx + s.vy * s.vy) };
    if (s.time - lastT > 5) return { ok: false, cause: 'stuck', x: s.x - tr.mx0 };
  }
  return { ok: false, cause: 'timeout' };
}
function sweep(tr, bikeId, from, to, step) {
  const rows = [];
  for (let v = from; v <= to + 1e-9; v += step) rows.push(Object.assign({ v }, ride(tr, bikeId, v)));
  const good = rows.filter(r => r.ok);
  const best = good.length ? good.reduce((a, r) => r.t < a.t ? r : a) : null;
  return { rows, best, crashes: rows.filter(r => !r.ok).length };
}
module.exports = { strip, ride, sweep };

if (require.main === module) {
  const args = process.argv.slice(2), arg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const name = args[0], world = args[1] && !args[1].startsWith('--') ? args[1] : 'dust';
  const bikesArg = arg('--bikes', 'scrapper'), bikes = bikesArg === 'all' ? RR.BIKES.map(b => b.id) : bikesArg.split(',');
  const pa = arg('--args', ''), params = pa ? pa.split(',').map(x => isNaN(+x) ? x : +x) : [];
  const from = +arg('--from', 4), to = +arg('--to', 20), step = +arg('--step', 1);
  if (!RR.PIECES[name]) { console.error('no piece called ' + name + '. Pieces: ' + Object.keys(RR.PIECES).join(', ')); process.exit(1); }
  const tr = strip(world, b => RR.PIECES[name].apply(null, [b].concat(params)));
  console.log(`${name}(${params.join(', ')}) in ${world}: ${(tr.mx1 - tr.mx0).toFixed(0)} m. Seconds from the start of the piece to 12 m past its end, by entry speed (m/s); - is a crash`);
  for (const id of bikes) {
    const S = sweep(tr, id, from, to, step);
    const cells = S.rows.map(r => r.ok ? r.t.toFixed(2) : '  -  ').join(' ');
    const b = S.best;
    const slowCost = b ? (S.rows[0].ok ? (S.rows[0].t - b.t).toFixed(2) : 'crash') : '?', fastCost = b ? (S.rows[S.rows.length - 1].ok ? (S.rows[S.rows.length - 1].t - b.t).toFixed(2) : 'crash') : '?';
    console.log(id.padEnd(9), b ? `best ${b.t.toFixed(2)}s entering at ${b.v}` : 'NO CLEAN RIDE', ` too slow (${from}) +${slowCost}s, too fast (${to}) +${fastCost}s, crashes ${S.crashes}`);
    if (!args.includes('--quiet')) console.log('   v:', S.rows.map(r => String(r.v).padStart(5)).join(' '));
    if (!args.includes('--quiet')) console.log('   t:', cells);
  }
}
