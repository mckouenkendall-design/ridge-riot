/* Works out which tracks have a different shape from the last shipped version, and writes
   src/revs.js so the game can drop best times that were set on the old shape (the stars are kept).
   tools/baseline.json is the record of what shipped: a fingerprint of each track and its star times.
   usage: node tools/rebuilt.js            compare against the baseline and write src/revs.js
          node tools/rebuilt.js --ship     after shipping: make the current tracks the new baseline */
const fs = require('fs'), path = require('path');
const RR = require('../src/physics.js');
['builder', 'bikes', 'tracks', 'startimes'].forEach(f => require('../src/' + f + '.js'));
const basePath = path.join(__dirname, 'baseline.json'), revPath = path.join(__dirname, '..', 'src', 'revs.js');
function print(tr) {
  let h = 2166136261;
  const eat = v => { const n = Math.round(v * 100); h ^= n & 0xffff; h = Math.imul(h, 16777619); h ^= (n >> 16) & 0xffff; h = Math.imul(h, 16777619); };
  // a roof's top edge is out of reach, so only its underside counts
  tr.chains.forEach(c => { for (let i = c.kind === 'roof' ? 4 : 0; i < c.pts.length; i++) eat(c.pts[i]); });
  tr.hazards.forEach(z => { eat(z.x0); eat(z.x1); eat(z.y); });
  eat(tr.finishX);
  return (h >>> 0).toString(36);
}
const now = {};
for (let i = 0; i < RR.TRACK_COUNT; i++) { const tr = RR.getTrack(i); now[tr.id] = { print: print(tr), stars: RR.STAR_TIMES[i] }; }
const base = fs.existsSync(basePath) ? JSON.parse(fs.readFileSync(basePath, 'utf8')) : null;
if (process.argv.includes('--init') || !base) {
  const out = {}; for (const id in now) out[id] = { print: now[id].print, stars: now[id].stars, rev: 0 };
  fs.writeFileSync(basePath, JSON.stringify(out, null, 1)); console.log('baseline written for', Object.keys(out).length, 'tracks'); process.exit(0);
}
if (process.argv.includes('--ship')) {
  const out = {}; for (const id in now) { const b = base[id]; out[id] = { print: now[id].print, stars: now[id].stars, rev: b ? b.rev + (b.print !== now[id].print ? 1 : 0) : 0, was: b && b.print !== now[id].print ? b.stars : (b && b.was) }; }
  fs.writeFileSync(basePath, JSON.stringify(out, null, 1)); console.log('baseline moved to the current tracks'); process.exit(0);
}
/* REBUILT[id] = [revision, old three-star time, old two-star time]. A save whose time for that track
   carries a lower revision set it on the old shape. */
const rows = [], names = [];
for (const id in now) {
  const b = base[id]; if (!b) continue;
  if (b.print !== now[id].print) { rows.push(`  '${id}': [${b.rev + 1}, ${b.stars[0]}, ${b.stars[1]}]`); names.push(id); }
  else if (b.rev > 0 && b.was) rows.push(`  '${id}': [${b.rev}, ${b.was[0]}, ${b.was[1]}]`);
}
fs.writeFileSync(revPath, `/* Tracks whose shape has changed since a player may have set a time on them.
   Written by: node tools/rebuilt.js   (do not edit by hand) */
(function (root) {
var RR = root.RR || (root.RR = {});
RR.REBUILT = {
${rows.join(',\n')}
};
if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
`);
console.log(names.length + ' tracks changed shape since the baseline: ' + names.join(', '));
