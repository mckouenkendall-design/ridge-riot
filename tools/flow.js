/* End-to-end checks in the real page: an old save carries over, progress survives a reload,
   nuggets are paid correctly, crates never repeat, trophies and the showroom work, buttons answer to clumsy thumbs, the keyboard works.
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
  ok(d.best['First Gear'] === 19.5 && d.best['Log Jam'] === 21 && d.best['Black Ice'] === 20.4, 'old best times land on the same tracks by name', d.best);
  // Washboard and Riot Run have been rebuilt since: the old times go, the stars they earned stay
  const kept = await t.ev(() => ({ wash: RR.Progress.starsFor(RR.trackIndex('washboard')), riot: RR.Progress.starsFor(RR.trackIndex('riot-run')), kept: RR.Store.data.kept, rebuilt: RR.Store.rebuilt, ghost: localStorage.getItem('ridgeRiot.v1.ghost.riot-run') }));
  ok(!('Washboard' in d.best) && !('Riot Run' in d.best), 'best times set on a rebuilt track are dropped', Object.keys(d.best));
  ok(kept.wash === 3 && kept.riot === 1 && kept.ghost === null, 'the stars earned on the old layout are kept', kept);
  ok(d.last === 'Black Ice', 'the last track played carries over', d.last);
  ok(d.bike === 'mosquito' && d.owned.includes('mosquito'), 'chosen bike and owned bikes carry over');
  ok(d.nug === d.stars * 30 && d.stars > 0, 'old stars are paid in nuggets (30 each)', { stars: d.stars, nuggets: d.nug });
  ok(d.sens === 0.8 && d.flip === true && d.sfx === 0.5, 'settings carry over, tilt gets the calmer default');
  ok(d.ghostNew && !d.ghostOld, 'ghost recording moved to its new name');
  ok(d.raw.times && d.raw.times['black-ice'] === 20.4 && !d.raw.best && !d.raw.times['riot-run'], 'save is rewritten in the new form');
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
  // a new time on a rebuilt track is kept across reloads and is not thrown away as an old one
  await t.ev(() => { const i = RR.trackIndex('washboard'); RR.Store.data.best[i] = 99; RR.Store.save(); });
  await t.page.reload(); await t.wait(500);
  d = await t.ev(() => { const i = RR.trackIndex('washboard'); return { t: RR.Store.data.best[i], stars: RR.Progress.starsFor(i), rebuilt: RR.Store.rebuilt, nug: RR.Store.data.nuggets, tot: RR.Progress.total() }; });
  ok(d.t === 99 && d.stars === 3 && d.rebuilt === 0 && d.nug === d.tot * 30, 'a new time on a rebuilt track stays, and the kept stars still count', d);
  await t.close();

  // ---- 1b. a save from the geode version: geodes become crates, everything owned keeps its place ----
  const OLD_TIER = { hornet: 'ruby', hotrod: 'emerald', chrome: 'gold', ice: 'diamond', whiteopal: 'opal', dummy: 'ruby', skully: 'emerald', clanks: 'gold', sheets: 'diamond', prism: 'opal', nova: 'opal', blackopal: 'opal' };
  const NEW_TIER = { ruby: 'common', emerald: 'uncommon', gold: 'rare', diamond: 'epic', opal: 'legendary' };
  const V2 = { v: 2, times: { 'first-gear': 19.4, 'log-jam': 21 }, lastId: 'log-jam', bike: 'mosquito', owned: { scrapper: 1, mosquito: 1, dune: 1 }, nuggets: 777, seenHow: true,
    paints: { hornet: 1, hotrod: 1, chrome: 1, ice: 1, whiteopal: 1, blackopal: 1 }, riders: { dummy: 1, skully: 1, clanks: 1, sheets: 1, prism: 1, nova: 1 },
    fit: { scrapper: { p: 'whiteopal', r: 'prism' }, mosquito: { p: 'ice', r: 'sheets' } }, geodes: { gold: 2, diamond: 1 }, opened: 9, pity: 3, paid: { 'first-gear': 3, 'log-jam': 3 }, got: {}, fresh: {},
    settings: { sfx: 0.5, engine: 0.6, music: 0, tilt: false, tiltSens: 0.8, tiltFlip: false, hints: true, ghost: true, unlockAll: false, quality: 'auto', buzz: true },
    stats: { flips: 31, bestAir: 2.2, crashes: 12, runs: 40, finishes: 9, bestJump: 15, bestFlips: 2, dist: 4000, topSpeed: 30 } };
  t = await lib.open({});
  await t.ev(v => { localStorage.clear(); localStorage.setItem('ridgeRiot.v1', JSON.stringify(v)); }, V2);
  await t.page.reload(); await t.wait(2500);
  d = await t.ev(() => { const D = RR.Store.data, P = RR.Progress; return { crates: D.crates, nug: D.nuggets, bike: D.bike, owned: Object.keys(D.owned), paints: Object.keys(D.paints), riders: Object.keys(D.riders), opened: D.opened, pity: D.pity, fit: D.fit, tiers: ['hornet', 'hotrod', 'chrome', 'ice', 'whiteopal', 'dummy', 'skully', 'clanks', 'sheets', 'prism', 'nova', 'blackopal'].map(id => [id, RR.ALL.find(x => x.id === id).tier]), look: P.look('scrapper'), toast: document.getElementById('toast').textContent, news: D.news, count: P.ownedCount(), garage: D.garage };
  });
  ok(d.crates.rare === 2 && d.crates.epic === 1, 'unopened gold and diamond geodes become rare and epic crates', d.crates);
  ok(d.nug === 777 && d.bike === 'mosquito' && d.opened === 9 && d.pity === 3, 'nuggets, chosen bike, crate count and bad-luck counter stay', { nug: d.nug, bike: d.bike, opened: d.opened, pity: d.pity });
  ok(['scrapper', 'mosquito', 'dune'].every(b => d.owned.includes(b)) && d.paints.length === 6 && d.riders.length === 6 && d.count === 12, 'every owned bike, paint job and rider is still owned', { owned: d.owned.length, paints: d.paints.length, riders: d.riders.length });
  ok(d.tiers.every(([id, tier]) => tier === NEW_TIER[OLD_TIER[id]]), 'owned items keep their place on the new tiers (ruby to common, emerald to uncommon, gold to rare, diamond to epic, opal to legendary)', d.tiers.map(x => x.join(':')).join(' '));
  ok(d.look.paint && d.look.paint.id === 'whiteopal' && d.look.rider.id === 'prism' && d.fit.mosquito.p === 'ice', 'paint and rider worn on each bike carry over');
  ok(/crates/.test(d.toast) && d.news === 3, 'a one-time note tells the player what is new', d.toast);
  ok(d.garage.level === 0, 'the garage starts as a shed', d.garage);
  await t.tapText('Garage'); await t.wait(250); await t.tapSel('.gtab[data-t=crates]'); await t.wait(200);
  const btn = await t.ev(() => document.querySelector('#gpanel > .btn').textContent);
  ok(/epic crate \(1 waiting\)/.test(btn), 'the epic crate is offered first', btn);
  await t.tapSel('#gpanel .btn.go'); await t.wait(250); for (let k = 0; k < 3; k++) await t.tap(t.W / 2, t.H * 0.45);
  await t.page.waitForFunction(() => document.getElementById('cratecard').classList.contains('on'), null, { timeout: 5000 });
  d = await t.ev(() => ({ k: document.querySelector('#cratecard .k').textContent, crates: RR.Store.data.crates, nug: RR.Store.data.nuggets }));
  ok(/Epic|Legendary/.test(d.k) && d.crates.epic === 0 && d.crates.rare === 2 && d.nug === 777, 'the epic crate gives epic or better and costs no nuggets', d.k);
  await t.page.reload(); await t.wait(600);
  d = await t.ev(() => ({ crates: RR.Store.data.crates, nug: RR.Store.data.nuggets }));
  ok(d.crates.rare === 2 && d.crates.epic === 0 && d.nug === 777, 'migrating twice does not hand out the crates again', d.crates);
  ok(t.errs.length === 0, 'no page errors with a migrated save', t.errs.slice(0, 2));
  await t.close();

  // ---- 2. a fresh player: finish, get paid, open crates ----
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
  const TOTAL = await t.ev(() => RR.ITEMS.length), PRICE = await t.ev(() => RR.ECON.crate);
  ok(TOTAL === 132, 'the crates hold 132 things (60 riders and 72 paint jobs, trophies kept out)', TOTAL);
  await t.ev(([n, pr]) => { RR.Store.data.nuggets = pr * n; RR.Store.save(); }, [TOTAL, PRICE]);
  await t.tapText('Garage'); await t.wait(300); await t.tapSel('.gtab[data-t=crates]'); await t.wait(200);
  const got = [];
  for (let i = 0; i < TOTAL; i++) {
    if (i === 0) await t.tapSel('#gpanel .btn.go'); else await t.tapText('Open another');
    await t.wait(250);
    for (let k = 0; k < 3; k++) { await t.tap(t.W / 2, t.H * 0.45); }
    await t.page.waitForFunction(() => document.getElementById('cratecard').classList.contains('on'), null, { timeout: 5000 });
    got.push(await t.ev(() => document.querySelector('#cratecard .k').textContent + '|' + document.querySelector('#cratecard h3').textContent));
    if (i === 0) await t.shot((process.argv[2] || '/tmp') + '/flow-crate-card.png');
  }
  const lastCard = await t.ev(() => document.getElementById('cratecard').textContent);
  ok(/Trophy earned: Curator/.test(lastCard), 'the last item of the collection earns the Curator trophy on the spot', lastCard.slice(-60));
  await t.tapText('Done'); await t.wait(300);
  d = await t.ev(() => ({ nug: RR.Store.data.nuggets, left: RR.Progress.itemsLeft(), opened: RR.Store.data.opened, btn: document.querySelector('#gpanel > .btn').textContent, dis: document.querySelector('#gpanel > .btn').disabled, tro: RR.Progress.trophyCount(), cur: RR.Progress.reallyOwns(RR.PAINT.curator) }));
  ok(new Set(got).size === TOTAL && d.left === 0, TOTAL + ' crates give all ' + TOTAL + ' things with no repeats', new Set(got).size);
  ok(d.nug === 0 && d.dis, 'nuggets are spent and the button stops when the collection is complete', d.btn);
  ok(d.tro === 1 && d.cur, 'only the Curator trophy is earned so far, the rest stay locked', d.tro);
  // wear something, per bike, and it sticks
  const pick = async (tab, id) => { await t.tapSel('.gtab[data-t=' + tab + ']'); await t.wait(200); await t.ev(i => { const e = document.querySelector('.tile[data-id=' + i + ']'); e.scrollIntoView({ block: 'center' }); }, id); await t.wait(120); await t.tapSel('.tile[data-id=' + id + ']'); await t.wait(150); await t.tapText('Put it on'); await t.wait(150); };
  await pick('paint', 'blackopal'); await pick('riders', 'nova');
  await t.shot((process.argv[2] || '/tmp') + '/flow-garage-dressed.png');
  await t.page.reload(); await t.wait(500);
  d = await t.ev(() => ({ fit: RR.Store.data.fit, look: RR.Progress.look('scrapper'), other: RR.Progress.look('mosquito'), own: RR.Progress.ownedCount() }));
  ok(d.look.paint && d.look.paint.id === 'blackopal' && d.look.rider.id === 'nova' && !d.other.paint && d.own === TOTAL, 'paint and rider are remembered for that bike only', d.fit);
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

  // ---- 5. trophies: shown with progress, earned by what the game already counts, never from a crate ----
  t = await lib.open({});
  await t.ev(() => { localStorage.clear(); }); await t.page.reload(); await t.wait(500);
  await t.tapText('Garage'); await t.wait(250); await t.tapSel('.gtab[data-t=trophies]'); await t.wait(250);
  const ids = await t.ev(() => RR.TROPHIES.map(x => x.id));
  ok(ids.length === 6 && (await t.ev(() => document.querySelectorAll('#tiles .tile.item').length)) === 6, 'the Trophies tab lists all six', ids.join(', '));
  const shownNeeds = [];
  for (const id of ids) { await t.ev(i => document.querySelector('.tile[data-id=' + i + ']').scrollIntoView({ block: 'center' }), id); await t.tapSel('.tile[data-id=' + id + ']'); await t.wait(120); shownNeeds.push(await t.ev(() => ({ name: document.querySelector('#gpanel h3').textContent, need: (document.querySelector('#gpanel .need') || {}).textContent || '', bar: !!document.querySelector('#gpanel .need .bar i'), btn: document.querySelector('#gpanel > .info .btn, #gpanel .btn').textContent }))); }
  ok(shownNeeds.every(x => x.need.length > 10 && x.bar), 'each trophy shows its condition and a progress bar', shownNeeds.map(x => x.name + ': ' + x.need).join(' | '));
  ok(shownNeeds.every(x => /earn it/.test(x.btn)), 'a trophy you have not earned cannot be put on', shownNeeds[0].btn);
  await t.shot((process.argv[2] || '/tmp') + '/flow-trophies.png');
  // never from a crate, and the unlock-everything switch does not hand them out either
  d = await t.ev(() => { RR.Store.data.settings.unlockAll = true; const P = RR.Progress; const r = { owns: RR.TROPHIES.some(x => P.owns(x)), cnt: P.trophyCount() }; RR.Store.data.settings.unlockAll = false; return r; });
  ok(!d.owns && d.cnt === 0, '"Unlock everything" does not unlock trophies');
  // earning: 500 flips, 100 km, 500 crashes
  d = await t.ev(() => { const D = RR.Store.data, P = RR.Progress, out = {}; D.stats.flips = 499; out.a = P.claim().filter(x => x.tier === 'trophy').map(x => x.id); D.stats.flips = 500; out.b = P.claim().filter(x => x.tier === 'trophy').map(x => x.id); out.c = P.claim().filter(x => x.tier === 'trophy').map(x => x.id);
    D.stats.dist = 99999; out.d = P.claim().filter(x => x.tier === 'trophy').map(x => x.id); D.stats.dist = 100000; out.e = P.claim().filter(x => x.tier === 'trophy').map(x => x.id); D.stats.crashes = 500; out.f = P.claim().filter(x => x.tier === 'trophy').map(x => x.id); out.fresh = !!D.fresh.pinwheel; return out; });
  ok(d.a.length === 0 && d.b.join() === 'pinwheel' && d.c.length === 0, '500 flips earns the Pinwheel, one short does not, and it is not given twice', JSON.stringify(d));
  ok(d.d.length === 0 && d.e.join() === 'longhaul', '100 km earns the Long Haul', JSON.stringify(d.e));
  ok(d.f.join() === 'goldie', '500 crashes earns the Goldie', JSON.stringify(d.f));
  // finishing every track, then three-starring every track (this also pays the world prizes, once)
  d = await t.ev(() => { const D = RR.Store.data, P = RR.Progress, out = {}; for (let i = 0; i < RR.TRACK_COUNT; i++) D.best[i] = 9999; out.a = P.claim().filter(x => x.tier === 'trophy').map(x => x.id); const s1 = P.settle(); out.rare1 = D.crates.rare; out.epic1 = D.crates.epic; out.nug1 = s1.nuggets;
    for (let i = 0; i < RR.TRACK_COUNT; i++) D.best[i] = 1; out.b = P.claim().filter(x => x.tier === 'trophy').map(x => x.id); const s2 = P.settle(); out.rare2 = D.crates.rare; out.epic2 = D.crates.epic; const s3 = P.settle(); out.again = s3.crates.length + s3.nuggets; out.worlds = RR.WORLDS.length; return out; });
  ok(d.a.join() === 'grandtour', 'finishing every track earns the Grand Tour', JSON.stringify(d.a));
  ok(d.rare1 === d.worlds && d.epic1 === 0, 'finishing a world gives one rare crate each', JSON.stringify({ rare: d.rare1, worlds: d.worlds }));
  ok(d.b.join() === 'champ' && d.epic2 === d.worlds && d.rare2 === d.worlds, 'three stars on every track earns the Champ, and an epic crate per world', JSON.stringify({ b: d.b, epic: d.epic2 }));
  ok(d.again === 0, 'prizes are only paid once');
  // a results screen announces the trophy in its own line, and the garage dot shows until it is looked at
  await t.ev(() => { const D = RR.Store.data; D.stats.crashes = 499; delete D.paints.goldie; delete D.riders.goldie; RR.Store.save(); });
  await t.page.reload(); await t.wait(500);
  await t.ev(() => { RR.UI.show('hud'); RR.Game.play(0); const k = RR.Game.input; k.kG = true; k.kL = true; });
  await t.page.waitForFunction(() => RR.Game.state === 'crash', null, { timeout: 20000 });
  await t.ev(() => { const k = RR.Game.input; k.kG = false; k.kL = false; });
  d = await t.ev(() => ({ toast: document.getElementById('toast').textContent, own: RR.Progress.trophyCount() }));
  ok(/Trophy earned/.test(d.toast), 'a trophy earned in a run is announced', d.toast);
  await t.ev(() => RR.UI.title()); await t.tapText('Garage'); await t.wait(250);
  ok(await t.ev(() => !!document.querySelector('.gtab[data-t=trophies] .dotb')), 'the Trophies tab shows a dot for a new trophy');
  await t.tapSel('.gtab[data-t=trophies]'); await t.wait(200);
  for (const id of ['grandtour', 'pinwheel', 'longhaul', 'champ', 'goldie']) { await t.ev(i => document.querySelector('.tile[data-id=' + i + ']').scrollIntoView({ block: 'center' }), id); await t.tapSel('.tile[data-id=' + id + ']'); await t.wait(120); }
  ok(await t.ev(() => !document.querySelector('.gtab[data-t=trophies] .dotb')), 'looking at every new trophy clears the dot');
  await t.tapText('Put it on'); await t.wait(150);
  ok(await t.ev(() => { const l = RR.Progress.look(RR.Store.data.bike); return !!(l.rider && l.rider.id === 'goldie'); }), 'an earned trophy can be put on a bike');
  ok(t.errs.length === 0, 'no page errors with trophies', t.errs.slice(0, 2));
  await t.close();

  // ---- 6. the showroom ----
  t = await lib.open({});
  await t.ev(() => { localStorage.clear(); }); await t.page.reload(); await t.wait(500);
  await t.tapText('Garage'); await t.wait(250); await t.tapSel('.gtab[data-t=show]'); await t.wait(500);
  d = await t.ev(() => ({ cur: RR.UI.cur, cells: document.querySelectorAll('.slotb').length, lvl: RR.Store.data.garage.level, name: document.getElementById('showname').textContent, slots: RR.Store.data.garage.slots.slice(0, 3), up: document.getElementById('showup').textContent }));
  ok(d.cur === 'show' && d.cells === 3 && d.lvl === 0 && d.name === 'The Shed', 'the showroom opens as a shed with 3 spots', JSON.stringify(d));
  ok(d.slots[0] === 'scrapper' && !d.slots[1] && !d.slots[2], 'with one bike owned, one bike stands on show and two spots are empty', JSON.stringify(d.slots));
  const f0 = await t.ev(() => RR.Showroom.stats().frames); await t.wait(500); const f1 = await t.ev(() => RR.Showroom.stats().frames);
  ok(f1 - f0 >= 5, 'the room is being redrawn every frame while you look at it', f1 - f0);
  // money: the upgrade costs nuggets, and refuses politely without them
  await t.tapText('Upgrade'); await t.wait(250);
  d = await t.ev(() => ({ lvl: RR.Store.data.garage.level, toast: document.getElementById('toast').textContent }));
  ok(d.lvl === 0 && /300/.test(d.toast), 'the upgrade says what it costs and does nothing without the nuggets', d.toast);
  // own everything, wear different looks, buy all four upgrades
  await t.ev(() => { const D = RR.Store.data, P = RR.PAINTS, R = RR.RIDERS; RR.BIKES.forEach((b, i) => { D.owned[b.id] = 1; D.fit[b.id] = { p: P[(i * 5 + 7) % P.length].id, r: R[(i * 4 + 3) % R.length].id }; D.paints[D.fit[b.id].p] = 1; D.riders[D.fit[b.id].r] = 1; }); D.nuggets = 4500 + 123; RR.Store.save(); });
  const dir = process.argv[2] || '/tmp';
  const names = ['The Shed', 'Workshop', 'Garage', 'Dealership', 'Showroom'], want = [3, 6, 9, 12, 15];
  for (let lv = 0; lv < 5; lv++) {
    if (lv > 0) { await t.tapText('Upgrade'); await t.wait(500); }
    d = await t.ev(() => {
      const D = RR.Store.data, cells = [...document.querySelectorAll('.slotb')].map(b => b.getBoundingClientRect()), slots = RR.Progress.garageFill();
      let overlap = 0; for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) { const a = cells[i], b = cells[j]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) overlap++; }
      const inside = cells.every(r => r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight);
      // each spot answers to a tap at its middle
      let hit = 0; cells.forEach((r, i) => { const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (e && e.getAttribute('data-i') === String(i)) hit++; });
      // the picture really has things drawn in it
      const cv = document.getElementById('showcv'), c = cv.getContext('2d'), im = c.getImageData(0, 0, cv.width, cv.height).data; let sum = 0, sq = 0, n = 0; for (let i = 0; i < im.length; i += 4 * 97) { const v = im[i] + im[i + 1] + im[i + 2]; sum += v; sq += v * v; n++; }
      const sd = Math.sqrt(sq / n - (sum / n) * (sum / n));
      const looks = slots.filter(Boolean).map(id => { const l = RR.Progress.look(id); return !!(l.paint && l.rider); });
      return { lvl: D.garage.level, name: document.getElementById('showname').textContent, cells: cells.length, slots: slots.filter(Boolean).length, uniq: new Set(slots.filter(Boolean)).size, overlap, inside, hit, sd: Math.round(sd), looks: looks.every(Boolean), nug: D.nuggets };
    });
    ok(d.lvl === lv && d.name === names[lv] && d.cells === want[lv], names[lv] + ': ' + want[lv] + ' spots', JSON.stringify(d));
    ok(d.overlap === 0 && d.inside && d.hit === d.cells, names[lv] + ': spots do not overlap, sit on the screen, and each answers to a tap in its middle');
    ok(d.sd > 25, names[lv] + ': the room is drawn', d.sd);
    ok(d.slots === Math.min(want[lv], 15) && d.uniq === d.slots, names[lv] + ': every spot has a different bike, each in its own paint and rider', d.slots);
    await t.shot(dir + '/flow-showroom-L' + lv + '.png');
  }
  d = await t.ev(() => ({ lvl: RR.Store.data.garage.level, nug: RR.Store.data.nuggets, up: getComputedStyle(document.getElementById('showup')).display }));
  ok(d.lvl === 4 && d.nug === 123 && d.up === 'none', 'the four upgrades cost 300 + 700 + 1300 + 2200 and the button goes away at the top', JSON.stringify(d));
  // tapping a bike on show makes it your ride
  const slot3 = await t.ev(() => RR.Store.data.garage.slots[3]);
  await t.tapSel('.slotb[data-i="3"]'); await t.wait(200);
  ok(await t.ev(() => RR.Store.data.bike) === slot3, 'tapping a bike on show makes it your ride', slot3);
  // arrange: choose who stands where; a bike already on show swaps places
  const arr0 = await t.ev(() => RR.Store.data.garage.slots.slice(0, 15));
  await t.tapText('Arrange'); await t.tapSel('.slotb[data-i="0"]'); await t.wait(300);
  ok(await t.ev(() => document.getElementById('showpick').classList.contains('on')), 'in Arrange mode a tap opens the list of your bikes');
  await t.tapSel('.pk[data-id="' + arr0[5] + '"]'); await t.wait(200);
  let after = await t.ev(() => RR.Store.data.garage.slots.slice(0, 15));
  ok(after[0] === arr0[5] && after[5] === arr0[0] && after.filter(Boolean).length === 15, 'choosing a bike that is already on show swaps the two', after.slice(0, 6).join());
  ok(await t.ev(() => RR.Store.data.bike) === slot3, 'arranging does not change which bike you ride');
  await t.tapSel('.slotb[data-i="2"]'); await t.wait(300); await t.tapText('Leave it empty'); await t.wait(200);
  after = await t.ev(() => RR.Progress.garageFill());
  ok(after[2] === '', 'a spot can be left empty on purpose', after.slice(0, 4).join());
  await t.tapText('Done'); await t.wait(200);
  // empty spot: tapping it (not in Arrange mode) offers the list too
  await t.tapSel('.slotb[data-i="2"]'); await t.wait(300);
  ok(await t.ev(() => document.getElementById('showpick').classList.contains('on')), 'tapping an empty spot offers the list of bikes');
  await t.tapText('Cancel'); await t.wait(150);
  await t.page.reload(); await t.wait(600);
  after = await t.ev(() => ({ s: RR.Store.data.garage.slots.slice(0, 15), lvl: RR.Store.data.garage.level }));
  ok(after.lvl === 4 && after.s[2] === '' && after.s[0] === arr0[5], 'the arrangement and the garage level survive a reload', after.s.slice(0, 4).join());
  // every bike you own is still rideable from the normal list, shown or not
  await t.tapText('Garage'); await t.wait(250);
  await t.ev(() => { RR.UI.gi = RR.BIKES.findIndex(b => b.id === RR.Store.data.garage.slots[0]); RR.UI.garage(); });
  const hid = await t.ev(() => { const on = new Set(RR.Store.data.garage.slots.slice(0, 15)); return RR.BIKES.map(b => b.id).filter(id => !on.has(id)); });
  ok(hid.length >= 1, 'one bike is not on show (the empty spot left one out)', hid.join());
  await t.ev(id => { RR.UI.gi = RR.BIKES.findIndex(b => b.id === id); RR.UI.garage(); }, hid[0]);
  await t.tapText('Ride this one'); await t.wait(200);
  ok(await t.ev(() => RR.Store.data.bike) === hid[0], 'a bike that is not on show can still be chosen to ride', hid[0]);
  // the frame loop stops when you leave
  await t.tapSel('.gtab[data-t=show]'); await t.wait(300); await t.tapSel('.screen.on .back'); await t.wait(300);
  const g0 = await t.ev(() => RR.Showroom.stats().frames); await t.wait(400); const g1 = await t.ev(() => RR.Showroom.stats().frames);
  ok(g1 === g0 && await t.ev(() => RR.UI.cur) === 'garage', 'leaving the showroom stops its drawing and returns to the garage', g1 - g0);
  ok(t.errs.length === 0, 'no page errors in the showroom', t.errs.slice(0, 2));
  await t.close();
  console.log(fails ? fails + ' CHECKS FAILED' : 'all flow checks passed');
  process.exit(fails ? 1 : 0);
})();
