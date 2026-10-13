/* Places the hidden gears. Each track marks roughly where its gear should go (b.gearHint in tracks.js); this rides
   the track every way tools/goals.js knows and picks the spot in that range that some ways of riding pass through
   but an ordinary ride (the careful line, and flat out where that finishes) never comes near.
   usage: node tools/gearspot.js --write [--tracks 0-7]        writes src/gearspots.js
          node tools/gearspot.js <track> <x0> <x1> [--below] [--minh 1.5] [--margin 1.2]   explore one range
   A spot is only taken if at least two different ways of riding reach it and finish. */
const RR = require('../src/physics.js');
['builder', 'bikes', 'tracks', 'goals', 'startimes', 'bot'].forEach(f => require('../src/' + f + '.js'));
const S = require('./skill.js'), Gl = require('./goals.js'), fs = require('fs'), path = require('path');
const args = process.argv.slice(2), arg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const id = arg('--bike', 'scrapper');

function find(t, xa, xb, below, minh, margin) {
  const tr = RR.getTrack(t), cal = S.calibrate(t, id), STEP = 0.5;
  function trace(P) {
    const s = RR.createSim(RR.prepBike(RR.BIKE[id]), tr); s.started = true; tr.zones = undefined;
    const out = {}, pts = []; let lastX = s.x, lastT = 0;
    for (let k = 0; k < 120 * 200; k++) {
      RR.botInput(s, P, out);
      RR.tick(s, { lean: out.lean, gas: P.flat ? true : out.gas, brake: P.flat ? !!out.trick : (out.brake || !!out.trick) }); s.events.length = 0;
      if (s.x >= xa && s.x <= xb) pts.push([s.x, s.y]);
      if (s.x > lastX + 2) { lastX = s.x; lastT = s.time; }
      if (s.finished || s.crashed || s.time - lastT > 6) break;
    }
    return { ok: s.finished, pts };
  }
  const n = Math.ceil((xb - xa) / STEP), env = new Array(n + 1).fill(below ? 1e9 : -1e9);
  const flatRun = trace({ flat: true }), ordinary = [trace({ caps: cal.win.map(w => w ? w.aim : 1e9), vcap: cal.G })].concat(flatRun.ok ? [flatRun] : []);
  for (const r of ordinary) for (const [x, y] of r.pts) { const k = Math.round((x - xa) / STEP); env[k] = below ? Math.min(env[k], y) : Math.max(env[k], y); }
  const cands = [];
  for (const p of Gl.policies(cal, id, tr)) {
    const r = trace(p.P); if (!r.ok) continue;
    for (const [x, y] of r.pts) {
      const k = Math.round((x - xa) / STEP); let m = 1e9;
      for (let j = Math.max(0, k - 3); j <= Math.min(n, k + 3); j++) m = Math.min(m, below ? env[j] - y : y - env[j]);
      const g = RR.surfaceY(tr, x, y + 0.1);
      if (m > margin && y - g >= minh && y - g < 6) cands.push({ x: +x.toFixed(1), y: +y.toFixed(1), margin: +m.toFixed(2), by: p.name, gy: +(y - g).toFixed(1) });
    }
  }
  // the spot most ways reach (within a metre), breaking ties by the biggest margin
  cands.forEach(c => { c.n = new Set(cands.filter(d => Math.hypot(d.x - c.x, d.y - c.y) < 1).map(d => d.by)).size; });
  cands.sort((a, b) => (b.n >= 2) - (a.n >= 2) || b.margin - a.margin);
  return cands;
}
module.exports = { find };

if (args.includes('--write')) {
  const [t0, t1] = arg('--tracks', '0-' + (RR.TRACK_COUNT - 1)).split('-').map(Number);
  let old = {}; try { old = Object.assign({}, require('../src/gearspots.js').GEAR_AT || {}); } catch (e) {}
  for (let t = t0; t <= t1; t++) {
    const tr = RR.getTrack(t), h = tr.feats.find(f => f.t === 'gearhint');
    if (!h) { console.log(`#${t + 1} ${tr.name}: no gear hint`); continue; }
    const c = find(t, h.x0, h.x1, h.below, h.minh, 1.4)[0];
    if (!c || c.n < 2) { console.log(`#${t + 1} ${tr.name}: NO GOOD SPOT in ${h.x0.toFixed(0)}-${h.x1.toFixed(0)}`); delete old[RR.trackId(t)]; continue; }
    old[RR.trackId(t)] = [c.x, c.y];
    console.log(`#${t + 1} ${tr.name}: gear at ${c.x}, ${c.y} (${c.gy} m up, ${c.margin} m off the ordinary line, reached ${c.n} ways, e.g. ${c.by})`);
  }
  const rows = Object.keys(old).map(k => `  '${k}': [${old[k][0]}, ${old[k][1]}]`);
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'gearspots.js'), `/* Where each track's hidden gear sits. Written by: node tools/gearspot.js --write   (do not edit by hand)
   Tracks that place their gear themselves (b.gearAt in tracks.js) are not listed. */
(function (root) {
var RR = root.RR || (root.RR = {});
RR.GEAR_AT = {
${rows.join(',\n')}
};
if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
`);
  console.log('wrote src/gearspots.js');
} else if (require.main === module) {
  const t = +args[0], xa = +args[1], xb = +args[2];
  const c = find(t, xa, xb, args.includes('--below'), +arg('--minh', 0), +arg('--margin', 1.2));
  c.slice(0, 10).forEach(x => console.log(JSON.stringify(x)));
  if (!c.length) console.log('no spot in that range that only a different way of riding reaches');
}
