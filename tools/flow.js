/* End-to-end checks in the real page: an old save carries over, progress survives a reload,
   nuggets are paid correctly, geodes never repeat, buttons answer to clumsy thumbs, the keyboard works.
   usage: node tools/flow.js */
const lib = require('./lib.js');
let fails = 0;
const ok = (cond, what, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + what + (extra !== undefined ? '   ' + JSON.stringify(extra) : '')); if (!cond) fails++; };
const V1 = { best: { 0: 19.5, 1: 22.0, 2: 23.0, 8: 21, 16: 20.4, 39: 60 }, bike: 'mosquito', owned: { scrapper: 1, mosquito: 1 }, last: 16, seenHow: true,
  settings: { sfx: 0.5, engine: 0.6, music: 0, tilt: false, tiltSens: 1, tiltFlip: true, hints: true, ghost: true, unlockAll: false, quality: 'auto', buzz: true },
  stats: { flips: 7, bestAir: 1.4, crashes: 99, runs: 80, finishes: 12, bestJump: 15, bestFlips: 1, time: 0 } };
(async () => {
  // ---- 1. a save from the first version (best times filed by position) ----
  let t = await lib.open({});
  await t.ev(v1 => { localStorage.clear(); localStorage.setItem('ridgeRiot.v1', JSON.stringify(v1)); localStorage.setItem('ridgeRiot.v1.ghost.16', 'scrapper|AAAA'); }, V1);
  await t.page.reload(); await t.wait(500);
  let d = await t.ev(() => { const D = RR.Store.data, o = {}; for (const k in D.best) o[RR.trackInfo(+k).name] = D.best[k]; return { best: o, last: RR.trackInfo(D.last).name, bike: D.bike, owned: Object.keys(D.owned), nug: D.nuggets, stars: RR.Progress.total(), sens: D.settings.tiltSens, flip: D.settings.tiltFlip, sfx: D.settings.sfx, crashes: D.stats.crashes, ghostNew: !!localStorage.getItem('ridgeRiot.v1.ghost.black-ice'), ghostOld: !!localStorage.getItem('ridgeRiot.v1.ghost.16'), raw: JSON.parse(localStorage.getItem('ridgeRiot.v1')) }; });
  ok(d.best['First Gear'] === 19.5 && d.best['Log Jam'] === 21 && d.best['Black Ice'] === 20.4 && d.best['Riot Run'] === 60, 'old best times land on the same tracks by name', d.best);
  ok(d.last === 'Black Ice', 'the last track played carries over', d.last);
  ok(d.bike === 'mosquito' && d.owned.includes('mosquito'), 'chosen bike and owned bikes carry over');
  ok(d.nug === d.stars * 30 && d.stars > 0, 'old stars are paid in nuggets (30 each)', { stars: d.stars, nuggets: d.nug });
  ok(d.sens === 0.8 && d.flip === true && d.sfx === 0.5, 'settings carry over, tilt gets the calmer default');
  ok(d.ghostNew && !d.ghostOld, 'ghost recording moved to its new name');
  ok(d.raw.times && d.raw.times['black-ice'] === 20.4 && !d.raw.best, 'save is rewritten in the new form');
  ok(d.owned.includes('marsh') === false && d.crashes === 99, 'not yet 100 crashes: no Marshmallow');
  // crash once more: that makes 100
  await t.ev(() => { RR.UI.show('hud'); RR.Game.play(0); const k = RR.Game.input; k.kG = true; k.kL = true; });
  await t.page.waitForFunction(() => RR.Game.state === 'crash', null, { timeout: 20000 });
  await t.ev(() => { const k = RR.Game.input; k.kG = false; k.kL = false; });
  d = await t.ev(() => ({ owned: Object.keys(RR.Store.data.owned), crashes: RR.Store.data.stats.crashes, toast: document.getElementById('toast').textContent }));
  ok(d.owned.includes('marsh') && d.crashes === 100, 'the 100th crash unlocks the Marshmallow', d.toast);
  await t.page.reload(); await t.wait(500);
  d = await t.ev(() => ({ owned: Object.keys(RR.Store.data.owned), nug: RR.Store.data.nuggets, stars: RR.Progress.total(), dist: RR.Store.data.stats.dist }));
  ok(d.owned.includes('marsh') && d.nug === d.stars * 30, 'survives a reload, and stars are not paid twice', d);
  await t.close();

  // ---- 2. a fresh player: finish, get paid, crack geodes ----
  t = await lib.open({});
  await t.ev(() => { localStorage.clear(); }); await t.page.reload(); await t.wait(500);
  await t.tapText('Ride'); await t.wait(200);
  await t.tapSel('.card[data-i="0"]'); await t.wait(300);
  await t.bot();
  await t.page.waitForFunction(() => RR.UI.cur === 'results', null, { timeout: 60000 });
  await t.botOff(); await t.wait(1500);
  d = await t.ev(() => ({ r: RR.Game.result, nug: RR.Store.data.nuggets, text: document.querySelector('#res .pay').textContent, dist: RR.Store.data.stats.dist, top: RR.Store.data.stats.topSpeed }));
  ok(d.r.stars === 3 && d.r.pay.total === 8 + 90 + d.r.pay.flips && d.nug === d.r.pay.total, 'first finish pays 8 plus 30 a star', d.text);
  ok(d.dist > 200 && d.top > 10, 'distance and top speed are being counted', { dist: d.dist, top: d.top });
  // again: no new stars, so only the finish money (and maybe a best-time bonus)
  await t.tapText('Ride it again'); await t.wait(300); await t.bot();
  await t.page.waitForFunction(() => RR.UI.cur === 'results', null, { timeout: 60000 });
  await t.botOff(); await t.wait(600);
  let d2 = await t.ev(() => ({ r: RR.Game.result, nug: RR.Store.data.nuggets }));
  ok(d2.r.pay.stars === 0 && d2.nug === d.nug + d2.r.pay.total && d2.r.pay.total <= 18 + d2.r.pay.flips, 'a repeat run does not pay for the same stars again', d2.r.pay);
  // give ourselves enough to empty the whole collection, through the real buttons
  await t.ev(() => { RR.Store.data.nuggets = 150 * 44; RR.Store.save(); });
  await t.tapText('Garage'); await t.wait(300); await t.tapSel('.gtab[data-t=geodes]'); await t.wait(200);
  const got = [];
  for (let i = 0; i < 44; i++) {
    await t.tapText('Crack'); await t.wait(250);
    for (let k = 0; k < 3; k++) { await t.tap(t.W / 2, t.H * 0.45); }
    await t.page.waitForFunction(() => document.getElementById('gecard').classList.contains('on'), null, { timeout: 5000 });
    got.push(await t.ev(() => document.querySelector('#gecard h3').textContent));
    if (i === 0) await t.shot((process.argv[2] || '/tmp') + '/flow-geode-card.png');
    await t.tapText('Done'); await t.wait(200);
  }
  d = await t.ev(() => ({ nug: RR.Store.data.nuggets, left: RR.Progress.itemsLeft(), opened: RR.Store.data.opened, btn: document.querySelector('#gpanel > .btn').textContent, dis: document.querySelector('#gpanel > .btn').disabled }));
  ok(new Set(got).size === 44 && d.left === 0, '44 geodes give all 44 things with no repeats');
  ok(d.nug === 0 && d.dis, 'nuggets are spent and the button stops when the collection is complete', d.btn);
  // wear something, per bike, and it sticks
  await t.tapSel('.gtab[data-t=paint]'); await t.wait(200); await t.tapSel('.tile[data-id=blackopal]'); await t.wait(150); await t.tapText('Put it on'); await t.wait(150);
  await t.tapSel('.gtab[data-t=riders]'); await t.wait(200); await t.tapSel('.tile[data-id=nova]'); await t.wait(150); await t.tapText('Put it on'); await t.wait(150);
  await t.shot((process.argv[2] || '/tmp') + '/flow-garage-dressed.png');
  await t.page.reload(); await t.wait(500);
  d = await t.ev(() => ({ fit: RR.Store.data.fit, look: RR.Progress.look('scrapper'), other: RR.Progress.look('mosquito'), own: RR.Progress.ownedCount() }));
  ok(d.look.paint && d.look.paint.id === 'blackopal' && d.look.rider.id === 'nova' && !d.other.paint && d.own === 44, 'paint and rider are remembered for that bike only', d.fit);
  ok(t.errs.length === 0, 'no page errors so far', t.errs.slice(0, 2));
  await t.close();

  // ---- 3. buttons and clumsy thumbs ----
  t = await lib.open({});
  await t.ev(() => { localStorage.clear(); }); await t.page.reload(); await t.wait(400);
  const touch = (type, pts) => t.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(p => ({ x: p[0], y: p[1], id: 1 })) });
  const box = async sel => t.page.locator(sel).first().boundingBox();
  const cur = () => t.ev(() => RR.UI.cur);
  // a thumb that lands on the button and rolls 22 pixels before lifting (a browser does not call that a click)
  const sloppy = async (sel, dx, dy) => { const b = await box(sel); const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await touch('touchStart', [[x, y]]); await t.wait(40); await touch('touchMove', [[x + dx * 0.5, y + dy * 0.5]]); await t.wait(30); await touch('touchMove', [[x + dx, y + dy]]); await t.wait(30); await touch('touchEnd', []); await t.wait(200); };
  await sloppy('#s-title .btn.go', 20, 9); ok(await cur() === 'tracks', 'Ride answers to a rolling thumb');
  await sloppy('.screen.on .back', -9, 20); ok(await cur() === 'title', 'Back answers to a rolling thumb on the first try');
  await t.tapText('Garage'); await t.wait(200);
  // just outside the visible Back button still counts
  let b = await box('.screen.on .back'); await t.tap(b.x + b.width + 8, b.y + b.height + 8); ok(await cur() === 'title', 'a tap just beside Back still counts');
  await t.tapText('Settings'); await t.wait(200);
  b = await box('.screen.on .back'); await t.tap(Math.max(2, b.x - 9), Math.max(2, b.y - 9)); ok(await cur() === 'title', 'a tap just above and left of Back still counts');
  // dragging right off a button cancels it
  await sloppy('#s-title .btn.go', -160, -90); ok(await cur() === 'title', 'sliding well off a button cancels the press');
  // back from every screen, ten times in a row, always on the first tap
  let firstTry = 0;
  for (let i = 0; i < 10; i++) { await t.tapText(['Ride', 'Garage', 'Settings'][i % 3]); await t.wait(120); await t.tapSel('.screen.on .back'); if (await cur() === 'title') firstTry++; else await t.ev(() => RR.UI.title()); }
  ok(firstTry === 10, 'Back works first time, ten out of ten', firstTry);
  // one tap must not fall through to whatever appears underneath on the next screen
  await t.tapText('Ride'); await t.wait(400); ok(await cur() === 'tracks', 'a tap does not leak through to the next screen');
  // scrolling the settings list by dragging on a switch does not flip the switch
  await t.tapSel('.screen.on .back'); await t.tapText('Settings'); await t.wait(200);
  const before = await t.ev(() => RR.Store.data.settings.ghost);
  b = await box('.sw[data-k=ghost]');
  await touch('touchStart', [[b.x + 10, b.y + 10]]); await t.wait(30); for (let k = 1; k <= 6; k++) { await touch('touchMove', [[b.x + 10, b.y + 10 - k * 12]]); await t.wait(16); } await touch('touchEnd', []); await t.wait(200);
  ok(await t.ev(() => RR.Store.data.settings.ghost) === before, 'dragging the settings list does not flip a switch');
  ok(await t.ev(() => document.getElementById('setcols').scrollTop) > 20, 'and the list does scroll under the finger');
  await t.ev(() => { document.getElementById('setcols').scrollTop = 0; }); await t.wait(100);
  await t.tapSel('.sw[data-k=ghost]'); ok(await t.ev(() => RR.Store.data.settings.ghost) !== before, 'tapping the switch does flip it');
  // the tilt switch has to ask the phone for permission from inside a real click, once
  await t.ev(() => { window.__asked = 0; const o = RR.Game.enableTilt; RR.Game.enableTilt = function (cb) { window.__asked++; window.__how = window.event ? window.event.type : ''; return o.call(this, cb); }; });
  await t.ev(() => { document.getElementById('setcols').scrollTop = 0; }); await t.wait(100); await t.tapSel('.sw[data-k=tilt]'); await t.wait(700);
  const tilt = await t.ev(() => ({ n: window.__asked, how: window.__how }));
  ok(tilt.n === 1 && tilt.how === 'click', 'the tilt switch asks for permission once, from a real click', tilt);
  await t.tapSel('.screen.on .back');
  // keyboard
  await t.page.keyboard.press('Enter'); await t.wait(150); ok(await cur() === 'tracks', 'Enter on the title starts');
  await t.page.keyboard.press('ArrowRight'); await t.wait(100); ok(await t.ev(() => RR.UI.world) === 1, 'arrow keys change world');
  await t.page.keyboard.press('Escape'); await t.wait(100); ok(await cur() === 'title', 'Escape goes back');
  await t.page.focus('#s-title .btn.go'); await t.page.keyboard.press('Space'); await t.wait(150); ok(await cur() === 'tracks', 'a focused button works from the keyboard');
  await t.tapSel('.card[data-i="0"]'); await t.wait(300);
  await t.page.keyboard.down('KeyW'); await t.wait(700); const s1 = await t.ev(() => ({ st: RR.Game.state, v: RR.Game.sim.vx })); await t.page.keyboard.up('KeyW');
  ok(s1.st === 'run' && s1.v > 1, 'W is gas', s1);
  await t.page.keyboard.press('KeyP'); await t.wait(100); ok(await cur() === 'pause', 'P pauses');
  await t.page.keyboard.press('KeyR'); await t.wait(150); ok(await t.ev(() => RR.Game.state) === 'ready', 'R restarts');
  ok(t.errs.length === 0, 'no page errors', t.errs.slice(0, 2));
  await t.close();

  // ---- 4. a computer with a mouse ----
  t = await lib.open({ w: 1280, h: 720, dpr: 1, touch: false });
  const click = async sel => { const q = await t.page.locator(sel).first().boundingBox(); await t.page.mouse.click(q.x + q.width / 2, q.y + q.height / 2); await t.wait(150); };
  await click('#s-title .btn.go'); ok(await t.ev(() => RR.UI.cur) === 'tracks', 'mouse: Ride');
  await click('.screen.on .back'); ok(await t.ev(() => RR.UI.cur) === 'title', 'mouse: Back');
  await click('#mgar'); await click('.gtab[data-t=riders]'); ok(await t.ev(() => RR.UI.gtab) === 'riders', 'mouse: garage tabs');
  ok(t.errs.length === 0, 'no page errors with a mouse', t.errs.slice(0, 2));
  await t.close();
  console.log(fails ? fails + ' CHECKS FAILED' : 'all flow checks passed');
  process.exit(fails ? 1 : 0);
})();
