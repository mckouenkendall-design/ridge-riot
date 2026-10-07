/* The rewind-and-retry robot: proves a track can be finished with only the player's controls, by
   backing up a few seconds after each crash and trying that stretch another way.
   (Star times and the speed limits for slow zones come from tools/skill.js.)
   usage: node tools/bot.js [--tracks 0-47] [--bikes all|scrapper,...] [--plot] [--human 40] */
const fs = require('fs'), path = require('path');
const RR = require('../src/physics.js');
require('../src/builder.js'); require('../src/bikes.js'); require('../src/tracks.js'); require('../src/bot.js');

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* Ride with the robot. On a crash, rewind a few seconds and try that stretch a different way. */
function solve(trackIndex, bikeId, opts) {
  opts = opts || {};
  const tr = RR.getTrack(trackIndex), bike = RR.prepBike(RR.BIKE[bikeId]);
  const s = RR.createSim(bike, tr);
  const rand = rng(12345 + trackIndex * 31 + RR.BIKE[bikeId].index * 7);
  // base: how this bike rides the track when nothing has gone wrong yet. tools/skill.js hands in the
  // speed limits it worked out for each slow zone; without them the track's own figures are used.
  const base = opts.base || { vcap: 1e9, bias: 0 };
  let P = base, pUntil = -1;
  const snaps = [];              // {t, snap, tick}
  const out = {};
  let tick = 0, attempts = 0, lastCrashT = -1, sameSpot = 0, glitches = 0;
  const pathPts = [];
  s.started = true;
  let lastProgX = s.x, lastProgT = 0;
  const maxAttempts = opts.maxAttempts || 400;
  const log = [];
  while (tick < 120 * 240) {
    if (tick % 30 === 0) snaps.push({ t: s.time, snap: RR.snapshot(s), tick, n: pathPts.length });
    if (s.time > pUntil) P = base;
    RR.botInput(s, P, out);
    if (P.force != null && s.time < P.forceUntil) out.lean = P.force;
    RR.tick(s, out);
    s.events.length = 0;
    tick++;
    if (tick % 6 === 0) pathPts.push([s.x, s.y, s.a]);
    if (s.x > lastProgX + 3) { lastProgX = s.x; lastProgT = s.time; }
    const stuck = s.time - lastProgT > 6;
    if (s.glitch) glitches += s.glitch, s.glitch = 0;
    if (s.finished) return { ok: true, time: s.finishTime, attempts, glitches, path: pathPts, log, flips: s.flips, maxSpeed: s.maxSpeed };
    if (s.crashed || stuck) {
      attempts++;
      if (attempts > maxAttempts) return { ok: false, x: s.x, cause: stuck ? 'stuck' : s.crashCause, attempts, path: pathPts, log };
      const tc = s.time;
      if (Math.abs(tc - lastCrashT) < 2.5) sameSpot++; else sameSpot = 0;
      lastCrashT = tc;
      log.push([+tc.toFixed(2), +s.x.toFixed(1), stuck ? 'stuck' : s.crashCause]);
      // when stuck, go back to before the bike stopped making progress, not just before we noticed
      const from = stuck ? lastProgT : tc;
      const back = Math.min(tc - from + 1.2 + sameSpot * 0.45 + rand() * 2.2, tc);
      let k = snaps.length - 1;
      while (k > 0 && snaps[k].t > tc - back) k--;
      const sn = snaps[k];
      RR.restore(s, sn.snap); tick = sn.tick; snaps.length = k + 1; pathPts.length = sn.n;
      lastProgX = s.x; lastProgT = s.time;
      const caps = [1e9, 1e9, 22, 18, 15, 13, 11, 9, 7.5];
      P = { vcap: caps[Math.floor(rand() * caps.length)], bias: (rand() - 0.5) * 0.5, airBias: (rand() - 0.5) * 0.6,
            th: 0.1 + rand() * 0.3, gth: 0.25 + rand() * 0.4, wth: 0.2 + rand() * 0.5 };
      if (base.vcap < P.vcap) P.vcap = base.vcap;
      // try the slow zones a bit slower or faster too
      const zs = tr.feats.filter(f => f.t === "zone"), kz = 0.55 + rand() * 0.7;
      if (zs.length && rand() < 0.7) P.caps = zs.map((z, i) => { const c = base.caps ? base.caps[i] : z.v; return c > 1e8 ? (rand() < 0.5 ? 1e9 : z.v * kz) : Math.max(3, c * kz); });
      else if (base.caps) P.caps = base.caps;
      if (rand() < 0.25) { P.force = rand() < 0.5 ? -1 : 1; P.forceUntil = s.time + 0.2 + rand() * 0.8; }
      pUntil = tc + 1.0 + rand() * 1.5;
    }
  }
  return { ok: false, x: s.x, cause: 'timeout', attempts, path: pathPts, log };
}

function plot(trackIndex, res, file) {
  const tr = RR.getTrack(trackIndex), sharp = require('/opt/npm-tools/node_modules/sharp');
  const x0 = -18, x1 = tr.xs[tr.xs.length - 1] + 2;
  const rows = Math.ceil((x1 - x0) / 220), rowW = (x1 - x0) / rows;
  const sc = 7, pad = 10, yMin = tr.minY - 6, yMax = tr.maxY + 12, rowH = (yMax - yMin) * sc + pad;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rowW * sc + 20}" height="${rows * rowH + 30}"><rect width="100%" height="100%" fill="#101418"/>`;
  svg += `<text x="8" y="16" fill="#fff" font-size="13" font-family="monospace">#${trackIndex} ${tr.name}  len ${tr.length.toFixed(0)}m  ${res ? (res.ok ? 'bot ' + res.time.toFixed(2) + 's, retries ' + res.attempts : 'FAILED at x=' + res.x.toFixed(0) + ' ' + res.cause) : ''}</text>`;
  for (let r = 0; r < rows; r++) {
    const ox = x0 + r * rowW, oy = 24 + r * rowH;
    const X = x => (x - ox) * sc + 10, Y = y => oy + (yMax - y) * sc;
    svg += `<clipPath id="c${r}"><rect x="0" y="${oy}" width="${rowW * sc + 20}" height="${rowH - 2}"/></clipPath><g clip-path="url(#c${r})">`;
    for (const ch of tr.chains) {
      let d = '';
      for (let i = 0; i < ch.pts.length; i += 2) d += (i ? 'L' : 'M') + X(ch.pts[i]).toFixed(1) + ' ' + Y(Math.max(ch.pts[i + 1], yMin - 5)).toFixed(1);
      if (ch.closed) d += 'Z';
      svg += `<path d="${d}" fill="${ch.closed ? '#5a4030' : 'none'}" stroke="${ch.kind === 'loop' ? '#6cf' : '#e8b060'}" stroke-width="1.5"/>`;
    }
    for (const h of tr.hazards) svg += `<rect x="${X(h.x0)}" y="${Y(h.y)}" width="${(h.x1 - h.x0) * sc}" height="${3 * sc}" fill="#f33" opacity="0.5"/>`;
    svg += `<line x1="${X(tr.finishX)}" x2="${X(tr.finishX)}" y1="${oy}" y2="${oy + rowH}" stroke="#4f4" />`;
    for (let x = Math.ceil(ox / 20) * 20; x < ox + rowW; x += 20) svg += `<text x="${X(x)}" y="${oy + rowH - 4}" fill="#789" font-size="9" font-family="monospace">${x}</text>`;
    if (res && res.path) {
      let d = '';
      res.path.forEach((p, i) => { d += (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); });
      svg += `<path d="${d}" fill="none" stroke="#fff" stroke-width="1" opacity="0.8"/>`;
      res.path.forEach((p, i) => { if (i % 4 === 0) svg += `<line x1="${X(p[0] - 0.7 * Math.cos(p[2]))}" y1="${Y(p[1] - 0.7 * Math.sin(p[2]))}" x2="${X(p[0] + 0.7 * Math.cos(p[2]))}" y2="${Y(p[1] + 0.7 * Math.sin(p[2]))}" stroke="#f6f" stroke-width="1.5"/>`; });
    }
    svg += '</g>';
  }
  svg += '</svg>';
  return sharp(Buffer.from(svg)).png().toFile(file);
}

/* A deliberately clumsy rider: reacts late, decides only a few times a second and wobbles.
   The share of runs it survives is a rough difficulty score for a track. */
function human(trackIndex, bikeId, runs, skill) {
  const tr = RR.getTrack(trackIndex), bike = RR.prepBike(RR.BIKE[bikeId]);
  const s = RR.createSim(bike, tr);
  let ok = 0, times = [], where = [], failPath = null;
  for (let r = 0; r < runs; r++) {
    RR.resetSim(s); s.started = true;
    const rand = rng(999 + r * 7919 + trackIndex * 13);
    const delay = Math.round((skill.delay || 0.2) * 120), hold = Math.round((skill.hold || 0.12) * 120);
    const hist = [], bh = [], gh = [], path = []; const out = { lean: 0, brake: false, gas: true }; let cur = 0, lastX = s.x, lastT = 0;
    for (let tick = 0; tick < 120 * 150; tick++) {
      RR.botInput(s, { th: skill.th || 0.25 }, out);
      hist.push(out.lean); bh.push(out.brake); gh.push(out.gas);
      const brk = bh.length > delay ? bh[bh.length - 1 - delay] : false, gas = gh.length > delay ? gh[gh.length - 1 - delay] : true;
      if (tick % 6 === 0) path.push([s.x, s.y, s.a]);
      if (tick % hold === 0) {
        let v = hist.length > delay ? hist[hist.length - 1 - delay] : 0;
        const q = rand();
        if (q < (skill.miss || 0.12)) v = 0; else if (q < (skill.miss || 0.12) + (skill.wrong || 0.04)) v = rand() < 0.5 ? -1 : 1;
        cur = v;
      }
      RR.tick(s, skill.none ? { lean: 0, brake: false, gas: true } : { lean: brk ? 0 : cur, brake: brk, gas: gas && !brk });
      s.events.length = 0;
      if (s.x > lastX + 3) { lastX = s.x; lastT = s.time; }
      if (s.finished) { ok++; times.push(s.finishTime); break; }
      if (s.crashed || s.time - lastT > 6) { where.push(Math.round(s.x)); if (!failPath) failPath = path; break; }
    }
  }
  return { rate: ok / runs, times, where, path: failPath, ok: false, x: where[0] || 0, cause: 'typical failed run of the careful robot', attempts: 0 };
}

module.exports = { solve, plot, human };

if (require.main === module) (async () => {
  const args = process.argv.slice(2);
  const arg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
  const [t0, t1] = arg('--tracks', '0-' + (RR.TRACK_COUNT - 1)).split('-').map(Number);
  const bikesArg = arg('--bikes', 'scrapper');
  const bikes = bikesArg === 'all' ? RR.BIKES.map(b => b.id) : bikesArg.split(',');
  if (args.includes('--human')) {
    const runs = +arg('--human', 30);
    for (let t = t0; t <= (t1 == null || isNaN(t1) ? t0 : t1); t++) {
      const tr = RR.getTrack(t);
      let line = `#${String(t).padStart(2)} ${tr.name.padEnd(16)}`;
      for (const id of bikes) {
        const none = human(t, id, 1, { none: true });
        const sloppy = human(t, id, runs, { delay: 0.25, hold: 0.12, miss: 0.12, wrong: 0.03, th: 0.35 });
        const ok = human(t, id, runs, { delay: 0.15, hold: 0.06, miss: 0.04, wrong: 0.005, th: 0.25 });
        const hist = {}; sloppy.where.forEach(x => { const k = Math.round(x / 10) * 10; hist[k] = (hist[k] || 0) + 1; });
        const top = Object.entries(hist).sort((a, b) => b[1] - a[1]).slice(0, 4).map(e => e[0] + 'm:' + e[1]).join(' ');
        if (args.includes('--plot') && ok.path) await plot(t, ok, path.join(arg('--out', '/tmp'), `fail${t}.png`));
        line += ` ${id.slice(0, 4)} D=${String(Math.round(100 - (sloppy.rate + ok.rate) * 50)).padStart(2)} gas-only:${(none.rate ? 'FINISH' : 'x@' + none.where[0]).padEnd(6)} clumsy ${(sloppy.rate * 100).toFixed(0).padStart(3)}% careful ${(ok.rate * 100).toFixed(0).padStart(3)}%  [${top}]`;
      }
      console.log(line);
    }
    return;
  }
  const table = {};
  for (let t = t0; t <= (t1 == null || isNaN(t1) ? t0 : t1); t++) {
    const tr = RR.getTrack(t);
    let line = `#${String(t).padStart(2)} ${tr.name.padEnd(16)} ${tr.length.toFixed(0).padStart(4)}m `;
    table[t] = {};
    for (const id of bikes) {
      const r = solve(t, id);
      table[t][id] = r.ok ? +r.time.toFixed(2) : null;
      line += r.ok ? ` ${id.slice(0, 4)} ${r.time.toFixed(1)}/${r.attempts}${r.glitches ? '!G' + r.glitches : ''}` : ` ${id.slice(0, 4)} FAIL@${r.x.toFixed(0)}(${r.cause})`;
      if (args.includes('--plot')) await plot(t, r, path.join(arg('--out', '/tmp'), `track${t}_${id}.png`));
      if (args.includes('--log') && r.log.length) console.log('   retries:', JSON.stringify(r.log.slice(0, 30)));
    }
    console.log(line);
  }
  if (args.includes('--json')) fs.writeFileSync(arg('--json'), JSON.stringify(table));
  if (args.includes('--write')) console.log('star times are written by tools/skill.js now: node tools/skill.js --bikes all --write');
})();
