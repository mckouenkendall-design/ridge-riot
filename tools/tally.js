/* Sums up a tools/bot.js results file. usage: node tools/tally.js results.txt */
const t = require('fs').readFileSync(process.argv[2], 'utf8');
const per = {}, bad = []; let n = 0, clean = 0, few = 0, more = 0, worst = 0, fail = 0;
for (const line of t.split('\n')) {
  const m = line.match(/^#\s*(\d+) (.{17})/); if (!m) continue;
  for (const x of line.matchAll(/ ([a-z]{4}) (?:([\d.]+)\/(\d+)|FAIL\S*)/g)) {
    n++; const b = x[1]; per[b] = per[b] || { retries: 0, tracksWithRetries: 0, fails: 0 };
    if (x[2] === undefined) { fail++; per[b].fails++; bad.push(m[2].trim() + ' ' + b + ' FAIL'); continue; }
    const r = +x[3]; if (!r) clean++; else if (r <= 5) few++; else more++;
    if (r) { per[b].retries += r; per[b].tracksWithRetries++; } if (r > worst) worst = r; if (r >= 8) bad.push(m[2].trim() + ' ' + b + ' ' + r);
  }
}
console.log({ rides: n, cleanFirstTime: clean, oneToFiveRetries: few, moreThanFive: more, worst, failed: fail });
console.log('per bike (tracks needing a retry / total retries):', Object.entries(per).map(([b, v]) => b + ' ' + v.tracksWithRetries + '/' + v.retries).join(', '));
console.log('8 or more retries:', bad.join('; ') || 'none');
