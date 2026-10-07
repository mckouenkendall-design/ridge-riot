// node tools/shot.js <file-or-url> <out.png> [width] [height] [query]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const [src, out, w, h, q] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: +(w || 1800), height: +(h || 1500) } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  const url = src.startsWith('http') ? src : 'file://' + path.resolve(src) + (q ? '?' + q : '');
  await page.goto(url);
  await page.waitForTimeout(600);
  await page.screenshot({ path: out });
  if (errs.length) console.log(errs.join('\n'));
  await browser.close();
})();
