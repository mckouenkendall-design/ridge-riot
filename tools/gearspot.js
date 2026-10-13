/* Helps place a hidden gear: rides a track every way tools/goals.js knows, and lists spots in an x range that some
   ways of riding pass through but an ordinary ride (careful line, or flat out, no flips) never comes near.
   usage: node tools/gearspot.js <track> <x0> <x1> [--bike scrapper] [--above|--below]
   --above looks for spots over the ordinary line (needs more height: speed, a flip boost), --below under it. */
const RR = require('../src/physics.js');
['builder', 'bikes', 'tracks', 'goals', 'startimes', 'bot'].forEach(f => require('../src/' + f + '.js'));
const S = require('./skill.js'), Gl = require('./goals.js');
const args = process.argv.slice(2), arg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const t = +args[0], xa = +args[1], xb = +args[2], id = arg('--bike', 'scrapper'), below = args.includes('--below');
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
// the ordinary ride: the careful line, plus flat out where that finishes (on a track with teeth flat out is not ordinary, it is a crash)
const flatRun = trace({ flat: true }), ordinary = [trace({ caps: cal.win.map(w => w ? w.aim : 1e9), vcap: cal.G })].concat(flatRun.ok ? [flatRun] : []);
for (const r of ordinary) for (const [x, y] of r.pts) { const k = Math.round((x - xa) / STEP); env[k] = below ? Math.min(env[k], y) : Math.max(env[k], y); }
const cands = [];
for (const p of Gl.policies(cal, id, tr)) {
  const r = trace(p.P); if (!r.ok) continue;
  for (const [x, y] of r.pts) {
    const k = Math.round((x - xa) / STEP); let m = 1e9;
    for (let j = Math.max(0, k - 3); j <= Math.min(n, k + 3); j++) m = Math.min(m, below ? env[j] - y : y - env[j]);
    if (m > +(arg("--margin", 0.9)) && y - RR.groundY(tr, x) >= +arg("--minh", 0)) cands.push({ x: +x.toFixed(1), y: +y.toFixed(1), margin: +m.toFixed(2), by: p.name, gy: +(y - RR.groundY(tr, x)).toFixed(1) });
  }
}
cands.sort((a, b) => b.margin - a.margin);
const seen = new Set(); let shown = 0;
for (const c of cands) { const key = Math.round(c.x / 3) + ':' + c.by.split(',')[0]; if (seen.has(key)) continue; seen.add(key); console.log(JSON.stringify(c)); if (++shown >= 12) break; }
if (!cands.length) console.log('no spot in that range that only a different way of riding reaches');
