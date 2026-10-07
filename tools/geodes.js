/* Checks the geode rules by opening a great many of them:
   the stated odds are what you get, nothing ever repeats, prize geodes start at their tier,
   and a run of bad luck is cut short. usage: node tools/geodes.js */
const RR = require('../src/physics.js'); require('../src/bikes.js'); require('../src/collect.js');
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
let fails = 0; const ok = (c, what, extra) => { console.log((c ? 'PASS ' : 'FAIL ') + what + (extra ? '   ' + extra : '')); if (!c) fails++; };
const count = {}; RR.TIERS.forEach(t => count[t.id] = RR.ITEMS.filter(i => i.tier === t.id).length);
console.log('things to collect:', RR.ITEMS.length, JSON.stringify(count), '(' + RR.PAINTS.length + ' paint jobs, ' + RR.RIDERS.length + ' riders)');
// 1. first geode on an empty collection, many times over
const N = 200000, got = {}; for (let i = 0; i < N; i++) { const it = RR.rollGeode('any', () => false, rnd, false); got[it.tier] = (got[it.tier] || 0) + 1; }
const line = RR.TIERS.map(t => t.name + ' ' + (got[t.id] / N * 100).toFixed(1) + '% (says ' + t.odds + '%)').join(', ');
ok(RR.TIERS.every(t => Math.abs(got[t.id] / N * 100 - t.odds) < 0.4), 'the odds shown in the game are the odds you get', line);
ok(RR.TIERS.reduce((a, t) => a + t.odds, 0) === 100, 'the odds add up to 100');
// 2. whole collections
let worstRun = 0, dup = 0, short = 0, pityHits = 0, opalAt = [];
for (let run = 0; run < 3000; run++) {
  const own = {}; let pity = 0, n = 0, dry = 0;
  for (;;) {
    const forced = pity >= RR.ECON.pity; const it = RR.rollGeode('any', x => own[x.id], rnd, forced);
    if (!it) break; n++;
    if (own[it.id]) dup++; own[it.id] = 1;
    const rank = RR.TIER[it.tier].rank;
    if (forced) { pityHits++; if (rank < 2 && RR.ITEMS.some(x => !own[x.id] && RR.TIER[x.tier].rank >= 2)) short++; }
    if (rank >= 2) { pity = 0; dry = 0; } else { pity++; dry++; if (dry > worstRun) worstRun = dry; }
    if (it.tier === 'opal' && !opalAt[run]) opalAt[run] = n;
  }
  if (n !== RR.ITEMS.length) short++;
}
opalAt.sort((a, b) => a - b);
ok(dup === 0, 'no geode ever gives something already owned');
ok(short === 0, 'every collection is completed in exactly ' + RR.ITEMS.length + ' geodes');
console.log('     first opal arrives, on average, at geode ' + (opalAt.reduce((a, b) => a + b, 0) / opalAt.length).toFixed(1) + ' (half of players by geode ' + opalAt[opalAt.length >> 1] + ', nine in ten by ' + opalAt[Math.floor(opalAt.length * 0.9)] + ')');
// 3. prize geodes
let low = 0; for (let i = 0; i < 20000; i++) { if (RR.TIER[RR.rollGeode('gold', () => false, rnd).tier].rank < 2) low++; if (RR.TIER[RR.rollGeode('diamond', () => false, rnd).tier].rank < 3) low++; }
ok(low === 0, 'a gold geode is always gold or better, a diamond geode diamond or better');
ok(RR.rollGeode('any', () => true, rnd) === null, 'with everything owned there is nothing to give');
console.log(fails ? fails + ' FAILED' : 'all geode checks passed'); process.exit(fails ? 1 : 0);
