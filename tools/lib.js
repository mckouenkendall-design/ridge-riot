/* Shared helpers for the browser test tools: opens the built page in a phone-sized headless browser. */
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
exports.open = async function (opt) {
  opt = opt || {};
  const W = opt.w || 844, H = opt.h || 390;
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: opt.dpr || 2, hasTouch: opt.touch !== false, isMobile: opt.touch !== false });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  if (opt.save) await page.addInitScript(s => { try { if (!localStorage.getItem('ridgeRiot.v1')) localStorage.setItem('ridgeRiot.v1', s); } catch (e) {} }, JSON.stringify(opt.save));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(400);
  // pretend to be a phone with a notch: the page reads these the same way it reads the real ones
  if (opt.inset) await page.evaluate(i => { const s = document.documentElement.style; s.setProperty('--safe-l', i[0] + 'px'); s.setProperty('--safe-r', i[1] + 'px'); s.setProperty('--safe-b', i[2] + 'px'); s.setProperty('--safe-t', (i[3] || 0) + 'px'); RR.UI.resize(); }, opt.inset);
  const cdp = await ctx.newCDPSession(page);
  const api = {
    browser, page, errs, cdp, W, H,
    shot: (file) => page.screenshot({ path: file }),
    tap: async (x, y) => { await page.touchscreen.tap(x, y); await page.waitForTimeout(140); },
    tapSel: async (sel) => { const b = await page.locator(sel).first().boundingBox(); if (!b) throw new Error('not on screen: ' + sel); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(160); },
    tapText: async (t) => { const b = await page.locator('button:visible', { hasText: t }).first().boundingBox(); if (!b) throw new Error('no button: ' + t); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(160); },
    wait: ms => page.waitForTimeout(ms),
    ev: (fn, arg) => page.evaluate(fn, arg),
    /* let the robot ride the current run */
    bot: () => page.evaluate(() => { const P = {}, o = { lean: 0, brake: false, gas: true }; clearInterval(window.__bot);
      window.__bot = setInterval(() => { if (!RR.Game.sim) return; RR.botInput(RR.Game.sim, P, o); const k = RR.Game.input; k.kL = o.lean < 0; k.kR = o.lean > 0; k.kB = o.brake; k.kG = o.gas; }, 8); }),
    botOff: () => page.evaluate(() => { clearInterval(window.__bot); const k = RR.Game.input; k.kL = k.kR = k.kB = k.kG = false; }),
    close: () => browser.close()
  };
  return api;
};
