/* The speed lab. Puts one obstacle at the end of a long run-up and rides every bike into it at
   every speed, to find the speeds that survive. This is how the "you cannot just hold the gas"
   obstacles are sized: each one has to be deadly flat out and comfortable at the right speed,
   on all 15 bikes.
   usage: node tools/lab.js <piece> [world] [--bikes all|a,b] [--args 1,2,3] [--noise]
          node tools/lab.js --list */
const RR = require('../src/physics.js');
['builder', 'bikes', 'tracks', 'bot'].forEach(f => require('../src/' + f + '.js'));

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* a test strip: run-up, the obstacle, run-out */
function strip(worldId, fn, runup) {
  const w = RR.WORLD[worldId], b = new RR.TB(w, 99);
  b.flat(runup == null ? 190 : runup);
  const x0 = b.x;
  fn(b);
  b.go();
  const x1 = b.x;
  b.flat(34);
  const tr = b.finish('lab', 'lab');
  tr.worldIndex = w.index; tr.airless = !!w.airless; tr.labX0 = x0; tr.labX1 = x1;
  if (!tr.feats.some(f => f.t === 'zone')) tr.feats.push({ t: 'zone', x0: x0, x1: x1, v: 9, whole: true });
  return tr;
}

/* Ride one strip holding `v` through its slow zones (full gas everywhere else).
   noise: a person's late, slightly wrong lean inputs. Returns true if the bike gets to the end. */
function ride(tr, bikeId, v, seed) {
  const s = RR.createSim(RR.prepBike(RR.BIKE[bikeId]), tr);
  s.started = true; tr.zones = undefined;
  const nz = tr.feats.filter(f => f.t === 'zone').length, caps = [];
  for (let i = 0; i < nz; i++) caps.push(v);
  const out = {}, P = { caps: caps }, rand = seed ? rng(seed) : null, hist = [];
  let cur = 0, lastX = s.x, lastT = 0;
  for (let tick = 0; tick < 120 * 120; tick++) {
    RR.botInput(s, P, out);
    let lean = out.lean;
    if (rand) {
      hist.push(out.lean);
      if (tick % 7 === 0) { let h = hist.length > 18 ? hist[hist.length - 19] : 0; const q = rand(); if (q < 0.04) h = 0; else if (q < 0.045) h = rand() < 0.5 ? -1 : 1; cur = h; }
      lean = cur;
    }
    RR.tick(s, { lean: lean, gas: out.gas, brake: out.brake });
    s.events.length = 0;
    if (s.x > lastX + 2) { lastX = s.x; lastT = s.time; }
    if (s.finished) return { ok: true, t: s.finishTime };
    if (s.crashed) return { ok: false, x: s.x, cause: s.crashCause };
    if (s.time - lastT > 5) return { ok: false, x: s.x, cause: 'stuck' };
  }
  return { ok: false, x: s.x, cause: 'timeout' };
}

/* the longest unbroken run of speeds that survive */
function windowOf(tr, bikeId, opts) {
  opts = opts || {};
  const d = RR.BIKE[bikeId], step = opts.step || 0.5, top = Math.min(30, d.vmax + 3), seeds = opts.noise ? [11, 22, 33] : [0];
  const row = [];
  for (let v = 3; v <= top + 1e-9; v += step) {
    let ok = 0; for (const sd of seeds) if (ride(tr, bikeId, v, sd).ok) ok++;
    row.push({ v, ok: ok === seeds.length, part: ok });
  }
  // flat out, no limit at all
  let flat = 0; for (const sd of seeds) if (ride(tr, bikeId, 1e9, sd).ok) flat++;
  let best = null, cur = null;
  for (const r of row) { if (r.ok) { if (!cur) cur = { lo: r.v, hi: r.v }; else cur.hi = r.v; if (!best || cur.hi - cur.lo > best.hi - best.lo) best = cur; } else cur = null; }
  return { lo: best ? best.lo : null, hi: best ? best.hi : null, row, flat: flat === seeds.length, vmax: d.vmax,
    str: row.map(r => r.ok ? '#' : r.part ? '+' : '.').join('') };
}

module.exports = { strip, ride, windowOf };

if (require.main === module) {
  const args = process.argv.slice(2), arg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const PIECES = RR.PIECES || {};
  if (args.includes('--list') || !args[0]) { console.log(Object.keys(PIECES).join('\n')); process.exit(0); }
  const name = args[0], world = args[1] && !args[1].startsWith('--') ? args[1] : 'dust';
  const bikesArg = arg('--bikes', 'all'), bikes = bikesArg === 'all' ? RR.BIKES.map(b => b.id) : bikesArg.split(',');
  const pa = arg('--args', ''), params = pa ? pa.split(',').map(x => isNaN(+x) ? x : +x) : [];
  if (!PIECES[name]) { console.error('no piece called ' + name); process.exit(1); }
  const tr = strip(world, b => PIECES[name].apply(null, [b].concat(params)));
  console.log(`${name}(${params.join(', ')}) in ${world}: ${(tr.labX1 - tr.labX0).toFixed(0)} m. Speeds 3 to top in steps of 0.5 m/s; # survives, . dies`);
  for (const id of bikes) {
    const w = windowOf(tr, id, { noise: args.includes('--noise') });
    console.log(id.padEnd(9), w.lo == null ? 'NO SAFE SPEED' : `safe ${w.lo.toFixed(1)} to ${w.hi.toFixed(1)}`.padEnd(18), `top ${w.vmax}`.padEnd(9), w.flat ? 'FLAT OUT OK ' : 'flat out dies', w.str);
  }
}
