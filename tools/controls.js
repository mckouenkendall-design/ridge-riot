/* Checks the controls in a headless phone-sized browser using real multi-touch and key events.
   usage: node tools/controls.js [screenshot-folder] */
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'); const out = process.argv[2];
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const size of [[844, 390], [667, 375], [932, 430]]) {
    const [W, H] = size;
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, '..', 'index.html')); await page.waitForTimeout(400);
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(p => ({ x: p[0], y: p[1], id: p[2] })) });
    const st = () => page.evaluate(() => { const g = RR.Game, s = g.sim, i = g.input; return { state: g.state, v: Math.hypot(s.vx, s.vy), a: s.a, t: s.time, L: i.L, R: i.R, G: i.G, B: i.B, touches: Object.keys(i.touch).length }; });
    console.log(`--- screen ${W}x${H}`);
    await page.evaluate(() => { RR.UI.show('hud'); RR.Game.play(0); }); await page.waitForTimeout(300);
    const c = await page.evaluate(() => { const o = {}; ['padB', 'padF', 'padK', 'padG'].forEach(id => { const r = document.getElementById(id).getBoundingClientRect(); o[id] = [r.left + r.width / 2, r.top + r.height / 2, r.width, r.height, r.left, r.right, r.top]; }); o.split = RR.Game.split; return o; });
    const size_ok = c.padG[2] >= 78 && c.padG[3] >= 78;
    ok('buttons are big', size_ok, `each is ${Math.round(c.padG[2])}x${Math.round(c.padG[3])} px on this screen`);
    ok('buttons sit in the bottom corners, middle of the screen is free', c.padF[5] < W * 0.33 && c.padK[4] > W * 0.67 && c.padB[6] > H * 0.6, `left pair ends at ${Math.round(c.padF[5] / W * 100)}% of the width, right pair starts at ${Math.round(c.padK[4] / W * 100)}%, tops at ${Math.round(c.padB[6] / H * 100)}% of the height`);
    if (out && W === 844) await page.screenshot({ path: path.join(out, '60-controls-ready.png') });
    // 1. lean alone must not start the clock
    await touch('touchStart', [[c.padF[0], c.padF[1], 1]]); await page.waitForTimeout(250); let s = await st();
    ok('lean forward button registers on its own', s.R && !s.L && !s.G && !s.B);
    ok('leaning alone does not start the run', s.state === 'ready');
    await touch('touchEnd', []); await page.waitForTimeout(80);
    await touch('touchStart', [[c.padB[0], c.padB[1], 1]]); await page.waitForTimeout(120); s = await st();
    ok('lean back button registers', s.L && !s.R);
    await touch('touchEnd', []); await page.waitForTimeout(80);
    // 2. gas starts the run and accelerates
    await touch('touchStart', [[c.padG[0], c.padG[1], 1]]); await page.waitForTimeout(900); s = await st();
    ok('gas starts the run', s.state === 'run' && s.G);
    ok('gas accelerates the bike', s.v > 3, `speed ${s.v.toFixed(1)} m/s after 0.9 s`);
    // 3. second finger: lean back while gas stays held
    await touch('touchStart', [[c.padG[0], c.padG[1], 1], [c.padB[0], c.padB[1], 2]]); await page.waitForTimeout(350); s = await st();
    ok('gas and lean back held together both register', s.G && s.L && s.touches === 2);
    ok('the bike is still accelerating and the front is coming up', s.v > 5 && s.a > 0.08, `speed ${s.v.toFixed(1)}, pitch ${(s.a * 57.3).toFixed(0)} deg`);
    if (out && W === 844) await page.screenshot({ path: path.join(out, '61-controls-gas-lean.png') });
    // 4. left thumb slides from lean back to lean forward without lifting, gas still down
    await touch('touchMove', [[c.padG[0], c.padG[1], 1], [c.padF[0], c.padF[1], 2]]); await page.waitForTimeout(200); s = await st();
    ok('left thumb slid to lean forward without lifting, gas still held', s.G && s.R && !s.L);
    // 5. lift the left thumb only: gas must stay
    await touch('touchEnd', []); await page.waitForTimeout(80);
    // one finger lifting while the other stays: browsers report each finger as its own pointer, so send exactly that
    const pe = (type, id, x, y) => page.evaluate(([type, id, x, y]) => document.getElementById('touch').dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: id === 11 })), [type, id, x, y]);
    await pe('pointerdown', 11, c.padG[0], c.padG[1]); await pe('pointerdown', 12, c.padB[0], c.padB[1]); await page.waitForTimeout(120); s = await st();
    ok('two separate fingers: gas and lean back', s.G && s.L && s.touches === 2);
    await pe('pointerup', 12, c.padB[0], c.padB[1]); await page.waitForTimeout(120); s = await st();
    ok('lifting only the lean thumb leaves gas held', s.G && !s.L && !s.R && s.touches === 1);
    await pe('pointerdown', 13, c.padF[0], c.padF[1]); await page.waitForTimeout(100); await pe('pointerup', 11, c.padG[0], c.padG[1]); await page.waitForTimeout(120); s = await st();
    ok('lifting only the gas thumb leaves the lean held', !s.G && s.R && s.touches === 1);
    await pe('pointercancel', 13, c.padF[0], c.padF[1]); await page.waitForTimeout(80); s = await st();
    ok('a cancelled touch (phone call, notification) is released', s.touches === 0 && !s.R);
    await page.evaluate(() => RR.Game.retry()); await page.waitForTimeout(200);
    await touch('touchStart', [[c.padG[0], c.padG[1], 1]]); await page.waitForTimeout(1500); const vFast = (await st()).v;
    // 6. right thumb slides from gas to brake
    await touch('touchMove', [[c.padK[0], c.padK[1], 1]]); await page.waitForTimeout(700); s = await st();
    ok('right thumb slid from gas to brake', s.B && !s.G);
    ok('brake slows the bike', s.v < vFast - 2, `${vFast.toFixed(1)} -> ${s.v.toFixed(1)} m/s`);
    // 7. brake + lean forward together
    await touch('touchStart', [[c.padK[0], c.padK[1], 1], [c.padF[0], c.padF[1], 2]]); await page.waitForTimeout(150); s = await st();
    ok('brake and lean forward held together both register', s.B && s.R);
    await touch('touchEnd', []); await page.waitForTimeout(150); s = await st();
    ok('all fingers off clears everything', !s.G && !s.B && !s.L && !s.R && s.touches === 0);
    ok('braking with a forward lean on the flat does not throw the rider off', s.state === 'run', 'state ' + s.state);
    await page.evaluate(() => RR.Game.retry()); await page.waitForTimeout(200);
    // 8. no gas: the bike coasts and loses speed, it does not drive itself
    await touch('touchStart', [[c.padG[0], c.padG[1], 1]]); await page.waitForTimeout(1300); await touch('touchEnd', []); await page.waitForTimeout(60); const v1 = (await st()).v; await page.waitForTimeout(1500); const v2 = (await st()).v;
    ok('with no fingers down the bike coasts and slows (no auto-throttle)', v2 < v1 - 0.3, `${v1.toFixed(1)} -> ${v2.toFixed(1)} m/s in 1.5 s`);
    // 9. touches well outside the drawn buttons still land in the right zone (forgiving targets)
    await page.evaluate(() => RR.Game.retry()); await page.waitForTimeout(200);
    await touch('touchStart', [[W * 0.97, H * 0.45, 1], [W * 0.03, H * 0.5, 2]]); await page.waitForTimeout(120); s = await st();
    ok('far right edge above the button still counts as gas, far left as lean back', s.G && s.L);
    await touch('touchEnd', []); await page.waitForTimeout(100);
    await touch('touchStart', [[c.split.r - 20, H * 0.8, 1], [c.split.l + 20, H * 0.8, 2]]); await page.waitForTimeout(120); s = await st();
    ok('just inside the inner buttons counts as brake and lean forward', s.B && s.R);
    await touch('touchEnd', []); await page.waitForTimeout(100);
    // 10. pause button is not swallowed by the touch layer
    await page.touchscreen.tap(40, 34); await page.waitForTimeout(200);
    ok('pause button still works', (await page.evaluate(() => RR.UI.cur)) === 'pause');
    await page.evaluate(() => RR.Game.pause(false));
    if (W === 844) {
      // keyboard
      await page.keyboard.press('KeyR'); await page.waitForTimeout(200);
      await page.keyboard.down('KeyA'); await page.waitForTimeout(150); ok('A alone does not start', (await st()).state === 'ready'); await page.keyboard.up('KeyA');
      await page.keyboard.down('KeyW'); await page.waitForTimeout(800); s = await st(); ok('W is gas', s.state === 'run' && s.G && s.v > 2.5);
      await page.keyboard.down('KeyD'); await page.waitForTimeout(120); s = await st(); ok('W + D: gas and lean forward together', s.G && s.R); await page.keyboard.up('KeyD');
      await page.keyboard.down('KeyA'); await page.waitForTimeout(120); s = await st(); ok('W + A: gas and lean back together', s.G && s.L); await page.keyboard.up('KeyA'); await page.keyboard.up('KeyW');
      await page.keyboard.down('KeyS'); await page.waitForTimeout(500); s = await st(); ok('S is brake', s.B && !s.G); await page.keyboard.up('KeyS');
      await page.keyboard.press('KeyR'); await page.waitForTimeout(200);
      await page.keyboard.down('ArrowUp'); await page.waitForTimeout(600); s = await st(); ok('Up arrow is gas', s.state === 'run' && s.G);
      await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(100); s = await st(); ok('Left arrow leans back', s.L); await page.keyboard.up('ArrowLeft');
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(100); s = await st(); ok('Right arrow leans forward', s.R); await page.keyboard.up('ArrowRight'); await page.keyboard.up('ArrowUp');
      await page.keyboard.down('ArrowDown'); await page.waitForTimeout(200); s = await st(); ok('Down arrow is brake', s.B); await page.keyboard.up('ArrowDown');
    }
    ok('no page errors', errs.length === 0, errs.join('; '));
    await ctx.close();
  }
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nall control checks passed');
  await browser.close();
})();
