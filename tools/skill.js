/* The skill gap, measured. For every track and bike this works out three things:

   FLAT OUT  a rider who never lifts: full gas from the line, leaning only to stay the right way up.
             On a track with teeth this rider must not get to the end.
   LIMITS    for each slow zone on the track, the range of speeds that survives it on this bike,
             found by riding into it at every speed. A zone with no safe range is a broken track.
   LEARNED   a rider who knows those limits and aims for them, but judges speed like a person
             (about 1 m/s out either way) and leans a little late. Should get through most of the time.

   usage: node tools/skill.js [--tracks 0-47] [--bikes scrapper,goat|all] [--runs 30] [--json file] [--quiet] */
const RR = require('../src/physics.js');
['builder', 'bikes', 'tracks', 'bot'].forEach(f => require('../src/' + f + '.js'));

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r() * 0.999999)) * Math.cos(6.283185307 * r()); }
const sims = {};
function simFor(t, id) { const k = t + ':' + id; return sims[k] || (sims[k] = RR.createSim(RR.prepBike(RR.BIKE[id]), RR.getTrack(t))); }
function zonesOf(tr) { if (tr.zones === undefined) tr.zones = tr.feats.filter(f => f.t === 'zone'); return tr.zones; }

/* a person's hands on the lean buttons: a little late, a little coarse, now and then asleep */
function Hands(seed, skill) {
  const rand = rng(seed), delay = Math.round((skill.delay || 0.15) * 120), hold = Math.round((skill.hold || 0.06) * 120), hist = [];
  let cur = 0, n = 0;
  return function (want) {
    hist.push(want);
    if (n++ % hold === 0) {
      let v = hist.length > delay ? hist[hist.length - 1 - delay] : 0; const q = rand();
      if (q < (skill.miss == null ? 0.04 : skill.miss)) v = 0; else if (q < (skill.miss == null ? 0.04 : skill.miss) + (skill.wrong == null ? 0.005 : skill.wrong)) v = rand() < 0.5 ? -1 : 1;
      cur = v;
    }
    return cur;
  };
}

/* ride from the current state until x reaches `untilX`, the finish, or a crash */
function run(s, P, untilX, hands, pin) {
  const out = {}; let lastX = s.x, lastT = s.time;
  for (let tick = 0; tick < 120 * 200; tick++) {
    RR.botInput(s, P, out);
    const lean = hands ? hands(out.lean) : out.lean;
    RR.tick(s, pin ? { lean: lean, gas: true, brake: false } : { lean: lean, gas: out.gas, brake: out.brake });
    s.events.length = 0;
    if (s.x > lastX + 2) { lastX = s.x; lastT = s.time; }
    if (s.finished) return 'finish';
    if (s.crashed) return 'crash';
    if (s.time - lastT > 5) return 'stuck';
    if (s.x >= untilX) return 'there';
  }
  return 'timeout';
}

/* FLAT OUT */
function masher(t, id, runs) {
  const s = simFor(t, id); let ok = 0; const where = {};
  for (let r = 0; r < runs; r++) {
    RR.resetSim(s); s.started = true;
    const res = run(s, {}, 1e9, Hands(4242 + r * 7919 + t * 13, {}), true);
    if (res === 'finish') ok++; else { const k = Math.round(s.x / 10) * 10; where[k] = (where[k] || 0) + 1; }
  }
  return { rate: ok / runs, where };
}

/* LIMITS: zone by zone, with the earlier ones already settled.
   Fast bikes also get a general "do not exceed" speed for the stretches between zones, because a
   track built around the starter bike has plain jumps a superbike overshoots flat out. Several are
   tried and the highest one that leaves every zone a comfortable range is kept. */
const GLOBAL = [1e9, 18, 16.5, 15, 13.5, 12];
function calibrateAt(t, id, G) {
  const tr = RR.getTrack(t), zs = zonesOf(tr), s = simFor(t, id), d = RR.BIKE[id];
  const caps = zs.map(z => z.v), win = [];
  RR.resetSim(s); s.started = true;
  let snap = RR.snapshot(s), ok = true, deadAt = null;
  for (let k = 0; k < zs.length && ok; k++) {
    const end = k + 1 < zs.length ? Math.max(zs[k].x1 + 0.5, zs[k + 1].x0 - 1) : 1e9;
    const top = Math.min(24, d.vmax + 3), row = [];
    for (let v = 3; v <= top + 1e-9; v += 0.5) {
      RR.restore(s, snap); caps[k] = v;
      const res = run(s, { caps: caps, vcap: G }, end);
      row.push(res === 'there' || res === 'finish');
    }
    RR.restore(s, snap); caps[k] = 1e9;
    const free = (r => r === 'there' || r === 'finish')(run(s, { caps: caps, vcap: G }, end));
    let best = null, cur = null;
    row.forEach((okv, i) => { const v = 3 + i * 0.5; if (okv) { if (!cur) cur = { lo: v, hi: v }; else cur.hi = v; if (!best || cur.hi - cur.lo > best.hi - best.lo) best = cur; } else cur = null; });
    if (!best) { ok = false; deadAt = k; win.push(null); break; }
    const W = best.hi - best.lo, open = free && best.hi >= top - 0.01;
    const w = { lo: best.lo, hi: best.hi, free: free, open: open, aim: open ? 1e9 : best.lo + 0.7 * W, safe: open ? 1e9 : best.lo + 0.6 * W };
    win.push(w); caps[k] = w.aim;
    // ride on to where the next zone's sweep starts
    RR.restore(s, snap);
    const res = run(s, { caps: caps, vcap: G }, k + 1 < zs.length ? zs[k].x1 : 1e9);
    if (res === 'finish') break;
    if (res !== 'there') { ok = false; deadAt = k; break; }
    snap = RR.snapshot(s);
  }
  const out = { ok: ok, G: G, win: win, deadAt: deadAt, x: s.x };
  if (ok) {
    // the clean run all the way through, for the clock
    RR.resetSim(s); s.started = true;
    const res = run(s, { caps: win.map(w => w.aim), vcap: G }, 1e9);
    out.time = res === 'finish' ? s.finishTime : null; out.ok = res === 'finish'; out.maxSpeed = s.maxSpeed; out.x = s.x;
  }
  out.narrow = 99; win.forEach(w => { if (w && !w.open && w.hi - w.lo < out.narrow) out.narrow = w.hi - w.lo; });
  if (!out.ok) out.narrow = -1;
  return out;
}
function calibrate(t, id) {
  const d = RR.BIKE[id]; let best = null;
  for (const G of GLOBAL) {
    if (G < 1e8 && G > d.vmax + 2) continue;
    const c = calibrateAt(t, id, G);
    if (!best || c.narrow > best.narrow + 0.01) best = c;
    if (c.ok && c.narrow >= 3.5) return c;
  }
  return best;
}

/* LEARNED */
function learned(t, id, cal, runs, sigma) {
  const s = simFor(t, id); let ok = 0; const where = {};
  for (let r = 0; r < runs; r++) {
    const rand = rng(777 + r * 104729 + t * 131);
    const caps = cal.win.map(w => w.open ? 1e9 : Math.max(2.5, w.safe + gauss(rand) * (sigma == null ? 1.5 : sigma)));
    RR.resetSim(s); s.started = true;
    const res = run(s, { caps: caps, vcap: cal.G, early: 2.5 + (rand() - 0.5) * 4 }, 1e9, Hands(99 + r * 7919 + t * 13, {}));
    if (res === 'finish') ok++; else { const k = Math.round(s.x / 10) * 10; where[k] = (where[k] || 0) + 1; }
  }
  return { rate: ok / runs, where };
}

/* Star times and the robot's zone speeds, from the starter bike's clean run.
   Three stars sits close to that run; in the later worlds it is quicker than the robot, so the
   last star needs the limits ridden closer or a flip or two for the boost. */
function writeStars(table) {
  const fs = require('fs'), path = require('path');
  const bp = path.join(__dirname, 'baseline.json'), shipped = fs.existsSync(bp) ? JSON.parse(fs.readFileSync(bp, 'utf8')) : {};
  try { require('../src/revs.js'); } catch (e) {}
  const F3 = { dust: 1.07, pine: 1.03, race: 1.02, frost: 1.0, cinder: 0.97, orbit: 0.95 }, F2 = { dust: 1.35, pine: 1.3, race: 1.28, frost: 1.25, cinder: 1.22, orbit: 1.2 }, rows = [], zv = [];
  for (let t = 0; t < RR.TRACK_COUNT; t++) {
    const R = table[t]; if (!R || !R.scrapper || !R.scrapper.ok) throw new Error('no clean starter run on track ' + (t + 1));
    const base = R.scrapper.time, wid = RR.WORLDS[Math.floor(t / 8)].id, tid = RR.trackId(t);
    let s3 = Math.round(base * F3[wid] * 10) / 10, s2 = Math.round(base * F2[wid] * 10) / 10;
    // a track whose shape has not changed keeps exactly the star times it shipped with
    if (shipped[tid] && !(RR.REBUILT && RR.REBUILT[tid])) { s3 = shipped[tid].stars[0]; s2 = shipped[tid].stars[1]; }
    const ids = Object.keys(R), can = ids.filter(id => R[id].ok && R[id].time <= s3).length;
    rows.push(`  [${s3.toFixed(1)}, ${s2.toFixed(1)}]${t < RR.TRACK_COUNT - 1 ? ',' : ' '}   // ${String(t + 1).padStart(2)} ${RR.getTrack(t).name}: robot on starter ${base.toFixed(1)}s` + (ids.length > 1 ? `, ${can} of ${ids.length} bikes beat three stars riding the same careful way` : ''));
    zv.push('[' + R.scrapper.win.map(w => w.open ? 'null' : (Math.round((w.lo + 0.6 * (w.hi - w.lo)) * 2) / 2)).join(', ') + ']');
  }
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'startimes.js'),
    `/* Star times: [three-star time, two-star time] per track, in seconds, and the speed the robot rider
   holds through each slow zone. Written by: node tools/skill.js --bikes all --write   (do not edit by hand) */
(function (root) {
var RR = root.RR || (root.RR = {});
RR.STAR_TIMES = [
${rows.join('\n')}
];
RR.ZONE_V = [${zv.join(', ')}];
if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
`);
  console.log('wrote src/startimes.js');
}

module.exports = { masher, calibrate, learned, zonesOf };

if (require.main === module) {
  const args = process.argv.slice(2), arg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const [t0, t1] = arg('--tracks', '0-' + (RR.TRACK_COUNT - 1)).split('-').map(Number);
  const bikesArg = arg('--bikes', 'scrapper'), bikes = bikesArg === 'all' ? RR.BIKES.map(b => b.id) : bikesArg.split(',');
  const runs = +arg("--runs", 30), quiet = args.includes('--quiet'), table = {};
  if (arg('--from')) {
    // join up result files from runs that were split across processes, then write the star times from them
    const all = {}; arg('--from').split(',').forEach(f => Object.assign(all, JSON.parse(require('fs').readFileSync(f, 'utf8'))));
    writeStars(all); return;
  }
  const top = w => Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0] + 'm:' + e[1]).join(' ');
  const summary = args.includes('--summary'), prove = args.includes('--prove');
  for (let t = t0; t <= (isNaN(t1) ? t0 : t1); t++) {
    const tr = RR.getTrack(t), zs = zonesOf(tr); table[t] = {};
    if (!summary) console.log(`#${String(t + 1).padStart(2)} ${tr.name}  ${tr.length.toFixed(0)} m, ${zs.length} slow zone${zs.length === 1 ? '' : 's'}`);
    for (const id of bikes) {
      const m = masher(t, id, runs), c = calibrate(t, id), l = c.ok ? learned(t, id, c, runs) : { rate: 0, where: {} };
      table[t][id] = { flat: m.rate, learned: l.rate, ok: c.ok, time: c.time, G: c.G, win: c.win, maxSpeed: c.maxSpeed, x: c.x, retries: 0 };
      if (!c.ok && prove) {
        // no clean run from the simple plan, so let the rewind-and-retry robot look for any way through
        const r = require('./bot.js').solve(t, id, { base: { vcap: c.G, bias: 0, caps: zs.map((z, i) => c.win[i] ? c.win[i].aim : z.v) } });
        table[t][id].retries = r.ok ? Math.max(1, r.attempts) : -1;
      }
      if (summary) continue;
      const wins = c.win.map(w => !w ? 'NONE' : w.open ? 'any' : `${w.lo}-${w.hi}${w.free ? '*' : ''}`).join('  ');
      console.log(`   ${id.padEnd(9)} flat out ${String(Math.round(m.rate * 100)).padStart(3)}%  learned ${String(Math.round(l.rate * 100)).padStart(3)}%  ` +
        (c.ok ? `clean ${c.time.toFixed(1)}s` : `NO CLEAN RUN (stops at ${c.x.toFixed(0)} m)`) + (c.G < 1e8 ? ` held to ${c.G}` : '') + (quiet ? '' : `   limits: ${wins}`) +
        (quiet || !Object.keys(m.where).length ? '' : `   flat out dies: ${top(m.where)}`) + (quiet || !Object.keys(l.where).length ? '' : `   learned dies: ${top(l.where)}`));
    }
    if (summary) {
      // one line a track: who survives flat out, how the learned riders do, and the tightest speed range anywhere
      const R = table[t], ids = Object.keys(R), pct = v => Math.round(v * 100);
      const flat = ids.filter(id => R[id].flat >= 0.5).map(id => id.slice(0, 4));
      const ls = ids.map(id => R[id].learned).sort((a, b) => a - b), worst = ids.reduce((a, id) => R[id].learned < R[a].learned ? id : a, ids[0]);
      let tight = null;
      ids.forEach(id => R[id].win.forEach((w, k) => { if (w && !w.open) { const W = w.hi - w.lo; if (!tight || W < tight.W) tight = { W, id, k, w }; } }));
      const bad = ids.filter(id => !R[id].ok).map(id => id.slice(0, 4) + '@' + Math.round(R[id].x) + (prove ? (R[id].retries < 0 ? ' CANNOT FINISH' : ' (retry robot: ' + R[id].retries + ')') : ''));
      const held = ids.filter(id => R[id].ok && R[id].G < 1e8).map(id => id.slice(0, 4) + ':' + R[id].G);
      console.log(`#${String(t + 1).padStart(2)} ${tr.name.padEnd(16)} ${String(tr.length.toFixed(0)).padStart(3)}m z${zs.length}  flat-out ok on ${String(flat.length).padStart(2)}  learned min ${String(pct(ls[0])).padStart(3)}% (${worst.slice(0, 4)}) median ${String(pct(ls[ls.length >> 1])).padStart(3)}% starter ${R.scrapper ? String(pct(R.scrapper.learned)).padStart(3) : '  ?'}%` +
        (tight ? `  tightest ${tight.w.lo}-${tight.w.hi} (${tight.id.slice(0, 4)} z${tight.k + 1})` : '') + (bad.length ? `  NO CLEAN RUN: ${bad.join(' ')}` : '') + (held.length ? `  held: ${held.join(' ')}` : '') + (flat.length && flat.length < 15 ? `  flat: ${flat.join(' ')}` : ''));
    }
  }
  if (arg('--json')) require('fs').writeFileSync(arg('--json'), JSON.stringify(table));
  if (args.includes('--write')) writeStars(table);
}
