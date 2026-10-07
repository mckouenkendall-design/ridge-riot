// node tools/try.js "<builder code using b>" [worldIndex] : quick check of one obstacle idea
const RR = require('../src/physics.js'); require('../src/builder.js'); require('../src/bikes.js'); require('../src/tracks.js'); require('../src/bot.js');
const { solve, human } = require('./bot.js');
const code = process.argv[2], wi = +(process.argv[3] || 0);
const orig = RR.getTrack;
const w = RR.WORLDS[wi], b = new RR.TB(w, 99);
function jump(b, deg, wd, landDeg, landLen, o) { o = o || {}; b.kicker(deg, o.R || 8, o.lip == null ? 1.2 : o.lip); b.gap(wd, o); b.land(landDeg, landLen, o.outR); return b; }
eval(code);
const tr = b.finish('try', 'try'); tr.index = 999; tr.worldIndex = wi; tr.airless = !!w.airless;
RR.getTrack = i => i === 999 ? tr : orig(i);
let line = '';
for (const id of (process.argv[4] || 'scrapper,mosquito,goat,biscotti,mule,razor,longlegs,comet').split(',')) {
  const none = human(999, id, 1, { none: true }), dec = human(999, id, 20, { delay: 0.15, hold: 0.06, miss: 0.04, wrong: 0.005, th: 0.25 }), sv = solve(999, id, { maxAttempts: 120 });
  line += `${id.slice(0, 5)}: hands-off ${none.rate ? 'ok' : 'x@' + none.where[0]}, decent ${(dec.rate * 100).toFixed(0)}%, search ${sv.ok ? sv.time.toFixed(1) + 's/' + sv.attempts : 'FAIL@' + (sv.x || 0).toFixed(0)}\n`;
}
console.log(line);
