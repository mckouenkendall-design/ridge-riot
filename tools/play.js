/* Drives the built page in a headless phone-sized browser with real touch events.
   usage: node tools/play.js <scenario> [outdir] */
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const scenario = process.argv[2] || 'tour', out = process.argv[3] || '/tmp';
const W = +(process.env.W || 844), H = +(process.env.H || 390), DPR = +(process.env.DPR || 2);
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html') + (process.env.Q || ''));
  await page.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(page);
  const shot = async n => { await page.screenshot({ path: path.join(out, n + '.png') }); };
  const tap = async (x, y) => { await page.touchscreen.tap(x, y); await page.waitForTimeout(120); };
  const touches = async pts => cdp.send('Input.dispatchTouchEvent', { type: pts.length ? 'touchStart' : 'touchEnd', touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: i + 1 })) });
  const hold = async (side, ms) => { const pts = side === 'both' ? [[W * 0.15, H * 0.7], [W * 0.85, H * 0.7]] : side === 'L' ? [[W * 0.15, H * 0.7]] : [[W * 0.85, H * 0.7]]; await touches(pts); await page.waitForTimeout(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  const st = () => page.evaluate(() => { const g = RR.Game, s = g.sim; return { state: g.state, ui: RR.UI.cur, x: +s.x.toFixed(1), y: +s.y.toFixed(1), t: +s.time.toFixed(2), v: +Math.hypot(s.vx, s.vy).toFixed(1), crashed: s.crashed, fin: s.finished, parts: RR.Render.parts.length }; });
  const clickText = async t => { const b = page.locator('button:visible', { hasText: t }).first(); const bb = await b.boundingBox(); await tap(bb.x + bb.width / 2, bb.y + bb.height / 2); };
  try {
    if (scenario === 'tour') {
      await shot('01-title');
      await clickText('Ride'); await page.waitForTimeout(200); await shot('02-tracks');
      await tap(W * 0.14, H * 0.55); await page.waitForTimeout(400); await shot('03-ready'); console.log(await st());
      await hold('R', 250); await page.waitForTimeout(1500); await shot('04-run'); console.log(await st());
      await page.waitForTimeout(1500); await shot('05-run'); console.log(await st());
      await hold('L', 400); await shot('06-leanback'); console.log(await st());
      await page.waitForTimeout(2500); await shot('07-later'); console.log(await st());
      await hold('both', 700); await shot('08-brake'); console.log(await st());
      await page.waitForTimeout(6000); await shot('09-later'); console.log(await st());
    } else if (scenario === 'menus') {
      await clickText('Garage'); await page.waitForTimeout(300); await shot('10-garage');
      for (let i = 0; i < 3; i++) { await tap(W * 0.52, H * 0.9); } await page.waitForTimeout(300); await shot('11-garage2');
      await tap(40, 30); await page.waitForTimeout(200);
      await clickText('Settings'); await page.waitForTimeout(300); await shot('12-settings');
    } else if (scenario === 'worlds') {
      // play each world's first track with the robot rider and take pictures
      for (const t of (process.env.T || '0,8,16,24,32').split(',').map(Number)) {
        await page.evaluate(i => { RR.Store.data.settings.unlockAll = true; RR.UI.show('hud'); RR.Game.play(i); RR.Game.sim.started = true; RR.Game.state = 'run';
          const P = {}, o = { lean: 0, brake: false, gas: true }; RR.Game.readInput = null;
          window.__bot = setInterval(() => { RR.botInput(RR.Game.sim, P, o); const i = RR.Game.input; i.kL = o.lean < 0; i.kR = o.lean > 0; }, 8); }, t);
        for (const [k, ms] of [[1, 2500], [2, 3500], [3, 4000]]) { await page.waitForTimeout(ms); await shot(`w${t}-${k}`); }
        console.log(t, await st());
        await page.evaluate(() => clearInterval(window.__bot));
      }
    } else if (scenario === 'gallery') {
      // ride with the robot and take a picture each time the bike passes one of the listed spots
      const list = JSON.parse(process.env.G || '[[4,[38,44,50]],[25,[40,60]],[13,[30,60]],[24,[30]],[16,[40]],[33,[45,60]]]');
      for (const [t, xs] of list) {
        await page.evaluate(([i, bike]) => { RR.Store.data.settings.unlockAll = true; if (bike) RR.Store.data.bike = bike; RR.UI.show('hud'); RR.Game.play(i);
          const P = {}, o = { lean: 0, brake: false, gas: true }; clearInterval(window.__bot);
          window.__bot = setInterval(() => { RR.botInput(RR.Game.sim, P, o); const k = RR.Game.input; k.kL = o.lean < 0 && !o.brake; k.kR = o.lean > 0 && !o.brake; k.kB = o.brake; }, 8); }, [t, process.env.BIKE || '']);
        await hold('R', 80);
        for (const x of xs) {
          for (let i = 0; i < 400; i++) { const s = await page.evaluate(() => [RR.Game.sim.x, RR.Game.state]); if (s[0] >= x || s[1] === 'crash' || s[1] === 'finish') break; await page.waitForTimeout(25); }
          await shot(`g${t}-${x}`);
        }
        console.log(t, JSON.stringify(await st()));
      }
      await page.evaluate(() => clearInterval(window.__bot));
    } else if (scenario === 'finish') {
      await page.evaluate(() => { RR.UI.show('hud'); RR.Game.play(0); const P = {}, o = { lean: 0, brake: false, gas: true };
        window.__bot = setInterval(() => { RR.botInput(RR.Game.sim, P, o); const i = RR.Game.input; i.kL = o.lean < 0; i.kR = o.lean > 0; }, 8); });
      await hold('R', 100);
      for (let i = 0; i < 40; i++) { await page.waitForTimeout(1000); const s = await st(); if (s.ui === 'results') break; }
      await page.waitForTimeout(1800); await shot('20-results'); console.log(await st());
      console.log(await page.evaluate(() => JSON.stringify(RR.Store.data.best) + ' ghost ' + (RR.Store.get('ridgeRiot.v1.ghost.0') || '').length));
    } else if (scenario === 'crash') {
      await page.evaluate(() => { RR.UI.show('hud'); RR.Game.play(0); });
      await hold('L', 1600); await shot('30-crash0'); await page.waitForTimeout(500); await shot('31-crash1'); console.log(await st());
      await page.waitForTimeout(1200); await shot('32-crash2'); console.log(await st());
      await tap(W * 0.5, H * 0.6); await page.waitForTimeout(300); console.log('after tap', await st()); await shot('33-retry');
    }
  } catch (e) { errs.push('SCRIPT ' + e.message); }
  if (errs.length) console.log(errs.slice(0, 12).join('\n'));
  await browser.close();
})();
