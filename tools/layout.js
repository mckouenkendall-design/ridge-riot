/* Checks every menu screen at several real phone sizes, with and without a notch:
   every button must be fully on screen, inside the notch-safe area, and not covered by anything
   (the test asks the browser what is under the middle and the four corners of each button).
   Also takes a picture of each screen at each size.
   usage: node tools/layout.js <outdir> */
const lib = require('./lib.js');
const out = process.argv[2] || '/tmp';
const SIZES = [
  { n: 'iphone14-home', w: 844, h: 390, inset: [47, 47, 21] },      // added to the home screen: full height, notch both sides counted
  { n: 'iphone14-safari', w: 750, h: 342, inset: [0, 0, 0] },       // in Safari: the browser keeps the notch strips and its own bar
  { n: 'iphoneSE', w: 667, h: 375, inset: [0, 0, 0] },
  { n: 'iphoneSE-safari', w: 667, h: 320, inset: [0, 0, 0] },
  { n: 'promax-home', w: 932, h: 430, inset: [59, 59, 21] },
  { n: 'android', w: 800, h: 360, inset: [0, 0, 0] },
  { n: 'tablet', w: 1024, h: 768, inset: [0, 0, 0] },
  { n: 'laptop', w: 1366, h: 700, inset: [0, 0, 0] }
];
const SAVE = { v: 2, nuggets: 480, geodes: { gold: 1, diamond: 0 }, paints: { hornet: 1, chrome: 1, whiteopal: 1 }, riders: { dusty: 1, clanks: 1 }, fresh: { chrome: 1 }, owned: { scrapper: 1, mosquito: 1, dune: 1 },
  times: { 'first-gear': 19.5, 'washboard': 22, 'rolling-dunes': 25, 'hop-skip': 17, 'loop-de-dust': 19, 'mesa-drop': 22, 'gulch-gap': 24, 'canyon-run': 36, 'log-jam': 22 }, settings: { music: 0, tilt: true }, paid: {}, got: {} };
async function check(t, name, size) {
  const bad = await t.ev(([inset]) => {
    const W = innerWidth, H = innerHeight, out = [];
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    document.querySelectorAll('#ui [data-act], #ui input').forEach(e => {
      if (!vis(e) || !e.closest('.screen.on')) return;
      const r = e.getBoundingClientRect(), label = (e.getAttribute('aria-label') || e.textContent || e.getAttribute('data-act') || e.id || '').trim().slice(0, 28) + ' [' + (e.getAttribute('data-act') || e.tagName) + ']';
      const scroller = e.closest('.cols, .scroll');
      if (scroller) { const s = scroller.getBoundingClientRect(); if (r.bottom > s.bottom + 1 || r.top < s.top - 1) return; }      // scrolled out of view is fine
      if (r.left < inset[0] - 0.5 || r.right > W - inset[1] + 0.5 || r.top < -0.5 || r.bottom > H - inset[2] + 0.5) out.push(label + ' sticks out: ' + [r.left, r.top, r.right, r.bottom].map(v => v.toFixed(0)).join(','));
      if (e.id === 'geocv') return;
      const pts = [[0.5, 0.5], [0.2, 0.25], [0.8, 0.25], [0.2, 0.75], [0.8, 0.75]];
      for (const p of pts) {
        const x = r.left + r.width * p[0], y = r.top + r.height * p[1];
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const top = document.elementFromPoint(x, y);
        if (top !== e && !e.contains(top)) { out.push(label + ' is covered at ' + p.join('/') + ' by ' + (top ? (top.id || top.className || top.tagName) : 'nothing')); break; }
      }
      if (r.width < 32 || r.height < 32) if (!e.matches('input')) out.push(label + ' is small: ' + r.width.toFixed(0) + 'x' + r.height.toFixed(0));
    });
    // text that does not fit its box
    document.querySelectorAll('.screen.on .btn, .screen.on .tab b, .screen.on .gtab, .screen.on h2, .screen.on h3, .screen.on .card .nm').forEach(e => { if (vis(e) && e.scrollWidth > e.clientWidth + 2) out.push('text cut off: "' + e.textContent.trim().slice(0, 30) + '" needs ' + e.scrollWidth + ' has ' + e.clientWidth); });
    document.querySelectorAll('.screen.on .plate, .screen.on .gright, .screen.on .info, .screen.on .gr, .screen.on .row, .screen.on .gcap, .screen.on .info p, .screen.on .need').forEach(e => { if (vis(e) && e.scrollHeight > e.clientHeight + 3 && getComputedStyle(e).overflowY !== 'auto') out.push('content too tall in .' + e.className.split(' ').join('.') + ': needs ' + e.scrollHeight + ' has ' + e.clientHeight); });
    return out;
  }, [size.inset]);
  await t.shot(`${out}/L-${size.n}-${name}.png`);
  return bad.map(b => `${size.n} / ${name}: ${b}`);
}
(async () => {
  let all = [], shots = 0;
  for (const size of SIZES) {
    const t = await lib.open({ w: size.w, h: size.h, inset: size.inset, save: SAVE });
    const run = async name => { all = all.concat(await check(t, name, size)); shots++; };
    await run('title');
    await t.tapText('Ride'); await t.wait(200); await run('tracks');
    for (const i of [2, 5]) { await t.tapSel(`.tab[data-i="${i}"]`); await t.wait(150); await run('tracks-w' + i); }
    await t.tapSel('.screen.on .back'); await t.wait(200);
    await t.tapText('Garage'); await t.wait(300); await run('garage-bikes');
    await t.tapSel('.tile[data-i="5"]'); await t.wait(200); await run('garage-bike-locked');
    // every bike, paint job and rider in turn: does its name and description fit?
    const fits = await t.ev(() => {
      const out = [], q = sel => document.querySelector(sel);
      const over = (sel, what) => { const e = q(sel); if (e && (e.scrollHeight > e.clientHeight + 3 || e.scrollWidth > e.clientWidth + 3)) out.push(what + ' does not fit in ' + sel + ' (' + e.scrollWidth + 'x' + e.scrollHeight + ' in ' + e.clientWidth + 'x' + e.clientHeight + ')'); };
      RR.UI.gtab = 'bikes'; RR.BIKES.forEach((b, i) => { RR.UI.gi = i; RR.UI.garage(); over('.gcap', b.name); over('#gpanel', b.name); over('#gpanel h3', b.name); over('.need', b.name); });
      RR.UI.gi = 0;
      RR.UI.gtab = 'paint'; RR.PAINTS.forEach(p => { RR.UI.pick = p.id; RR.UI.garage(); over('#gpanel', p.name); over('#gpanel .info p', p.name); over('#gpanel .nm', p.name); });
      RR.UI.gtab = 'riders'; RR.RIDERS.forEach(p => { RR.UI.pick = p.id; RR.UI.garage(); over('#gpanel', p.name); over('#gpanel .info p', p.name); over('#gpanel .nm', p.name); });
      RR.UI.gtab = 'bikes'; RR.UI.pick = null; RR.UI.garage();
      return out;
    });
    all = all.concat(fits.map(f => size.n + ' / garage: ' + f));
    await t.tapSel('.tile[data-i="0"]'); await t.wait(150);
    await t.tapSel('.gtab[data-t=paint]'); await t.wait(250); await run('garage-paint');
    await t.tapSel('.tile[data-id=whiteopal]'); await t.wait(250); await run('garage-paint-pick');
    await t.tapSel('.tile[data-id=tiger]'); await t.wait(200); await run('garage-paint-locked');
    await t.tapSel('.gtab[data-t=riders]'); await t.wait(250); await run('garage-riders');
    await t.tapSel('.tile[data-id=clanks]'); await t.wait(200); await run('garage-rider-pick');
    await t.tapSel('.gtab[data-t=geodes]'); await t.wait(250); await run('garage-geodes');
    await t.tapText('Crack'); await t.wait(400); await run('geode-rock');
    for (let i = 0; i < 3; i++) { await t.tap(size.w / 2, size.h * 0.45); await t.wait(120); }
    await t.wait(1100); await run('geode-card');
    await t.tapText('Done'); await t.wait(250);
    await t.tapSel('.screen.on .back'); await t.wait(200);
    await t.tapText('Settings'); await t.wait(250); await run('settings');
    await t.tapSel('.screen.on .back'); await t.wait(200);
    // a run: the ready screen, pause, then a finish for the results screen
    await t.ev(() => { RR.UI.show('hud'); RR.Game.play(0); }); await t.wait(300); await run('hud-ready');
    await t.tapSel('#s-hud .round[data-act=pause]'); await t.wait(200); await run('pause');
    await t.tapText('Keep riding'); await t.wait(150);
    await t.bot();
    await t.page.waitForFunction(() => RR.UI.cur === 'results', null, { timeout: 60000 });
    await t.botOff(); await t.wait(1600); await run('results');
    if (t.errs.length) all.push(size.n + ': page errors: ' + t.errs.slice(0, 3).join(' | '));
    await t.close();
  }
  console.log(shots + ' screens checked at ' + SIZES.length + ' sizes');
  console.log(all.length ? all.join('\n') : 'no layout problems found');
  process.exit(all.length ? 1 : 0);
})();
