/* Checks the crate rules by opening a great many of them:
   the stated odds are what you get, nothing ever repeats, rare and epic crates start at their tier,
   a run of bad luck is cut short, trophies never come out, and the whole collection fills in exactly.
   usage: node tools/crates.js */
const RR = require('../src/physics.js'); require('../src/bikes.js'); require('../src/collect.js');
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
let fails = 0; const ok = (c, what, extra) => { console.log((c ? 'PASS ' : 'FAIL ') + what + (extra ? '   ' + extra : '')); if (!c) fails++; };
const count = {}; RR.TIERS.forEach(t => count[t.id] = RR.ITEMS.filter(i => i.tier === t.id).length);
console.log('things to collect:', RR.ITEMS.length, JSON.stringify(count), '(' + RR.PAINTS.filter(p => p.tier !== 'trophy').length + ' crate paint jobs, ' + RR.RIDERS.filter(p => p.tier !== 'trophy').length + ' crate riders, ' + RR.TROPHIES.length + ' trophies kept out of crates)');
// 0. the shape of the collection
ok(RR.PAINTS.filter(p => p.tier !== 'trophy').length === 72 && RR.RIDERS.filter(p => p.tier !== 'trophy').length === 60 && RR.PAINTS.length === 72 + 5 && RR.RIDERS.length === 60 + 3, '72 paint jobs and 60 riders, plus the trophies (5 paint, 3 rider)', RR.PAINTS.length + ' paints, ' + RR.RIDERS.length + ' riders including trophies');
ok(RR.ITEMS.every(i => i.tier !== 'trophy') && RR.TROPHIES.every(i => i.tier === 'trophy') && RR.TROPHIES.length === 8, 'trophies are kept out of the crate pool, and there are 8 of them', RR.TROPHIES.length);
ok(RR.TIERS.map(t => t.id).join() === 'common,uncommon,rare,epic,legendary', 'the five crate tiers are common, uncommon, rare, epic, legendary');
// 1. first crate on an empty collection, many times over
const N = 200000, got = {}; for (let i = 0; i < N; i++) { const it = RR.rollCrate('any', () => false, rnd, false); got[it.tier] = (got[it.tier] || 0) + 1; }
const line = RR.TIERS.map(t => t.name + ' ' + (got[t.id] / N * 100).toFixed(1) + '% (says ' + t.odds + '%)').join(', ');
ok(RR.TIERS.every(t => Math.abs(got[t.id] / N * 100 - t.odds) < 0.4), 'the odds shown in the game are the odds you get', line);
ok(RR.TIERS.reduce((a, t) => a + t.odds, 0) === 100, 'the odds add up to 100');
// 2. whole collections
let worstRun = 0, dup = 0, short = 0, pityHits = 0, legAt = [], trophyLeak = 0;
for (let run = 0; run < 3000; run++) {
  const own = {}; let pity = 0, n = 0, dry = 0;
  for (;;) {
    const forced = pity >= RR.ECON.pity; const it = RR.rollCrate('any', x => own[x.id], rnd, forced);
    if (!it) break; n++;
    if (it.tier === 'trophy') trophyLeak++;
    if (own[it.id]) dup++; own[it.id] = 1;
    const rank = RR.TIER[it.tier].rank;
    if (forced) { pityHits++; if (rank < 2 && RR.ITEMS.some(x => !own[x.id] && RR.TIER[x.tier].rank >= 2)) short++; }
    if (rank >= 2 || !RR.ITEMS.some(x => !own[x.id] && RR.TIER[x.tier].rank >= 2)) { pity = 0; dry = 0; } else { pity++; dry++; if (dry > worstRun) worstRun = dry; }
    if (it.tier === 'legendary' && !legAt[run]) legAt[run] = n;
  }
  if (n !== RR.ITEMS.length) short++;
}
legAt.sort((a, b) => a - b);
ok(dup === 0, 'no crate ever gives something already owned');
ok(trophyLeak === 0, 'no crate ever gives a trophy');
ok(short === 0, 'every collection is completed in exactly ' + RR.ITEMS.length + ' crates');
ok(worstRun <= RR.ECON.pity, 'never more than ' + RR.ECON.pity + ' crates in a row below rare while rare things remain', 'worst dry run ' + worstRun);
console.log('     first legendary arrives, on average, at crate ' + (legAt.reduce((a, b) => a + b, 0) / legAt.length).toFixed(1) + ' (half of players by crate ' + legAt[legAt.length >> 1] + ', nine in ten by ' + legAt[Math.floor(legAt.length * 0.9)] + ')');
// 3. prize crates
let low = 0, trophyPrize = 0; for (let i = 0; i < 20000; i++) { const a = RR.rollCrate('rare', () => false, rnd), b = RR.rollCrate('epic', () => false, rnd); if (RR.TIER[a.tier].rank < 2) low++; if (RR.TIER[b.tier].rank < 3) low++; if (a.tier === 'trophy' || b.tier === 'trophy') trophyPrize++; }
ok(low === 0, 'a rare crate is always rare or better, an epic crate epic or better');
ok(trophyPrize === 0, 'prize crates never give trophies');
ok(RR.rollCrate('any', () => true, rnd) === null, 'with everything owned there is nothing to give');
// when every item of the promised tier is owned the crate gives the next tier up, then falls back down
const ownTop = x => RR.TIER[x.tier].rank >= 3; const fb = RR.rollCrate('epic', ownTop, rnd);
ok(fb && RR.TIER[fb.tier].rank < 3, 'an epic crate with every epic and legendary owned still gives something else, not nothing', fb && fb.tier);
// 4. the money: finishing the whole collection takes about twice as long as before
const before = (44 - 12) * 150, after = (RR.ITEMS.length - 12) * RR.ECON.crate;
ok(after / before > 1.8 && after / before < 2.2, 'the full collection costs about twice what it used to (' + before + ' nuggets then, ' + after + ' now, ' + (after / before).toFixed(2) + 'x)');
console.log(fails ? fails + ' FAILED' : 'all crate checks passed'); process.exit(fails ? 1 : 0);
