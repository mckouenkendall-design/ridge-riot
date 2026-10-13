/* Draws every paint job as the garage tile shows it, big, plus the same paint on a bike zoomed in, so the pattern detail can be judged.
   usage: node tools/swatches.js <outdir> [first-index] [last-index]   (indexes into RR.PAINTS, default the whole list) */
const lib = require('./lib.js');
const out = process.argv[2] || '/tmp', a = +(process.argv[3] || 0), b = +(process.argv[4] || 9999);
(async () => {
  const t = await lib.open({ w: 2400, h: 1400, dpr: 1, touch: false });
  await t.ev(([a, b]) => {
    const ids = RR.PAINTS.slice(a, b + 1), cols = 4, cw = 560, ch = 300;
    const cv = document.createElement('canvas'); cv.id = 'sheet'; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99';
    cv.width = cols * cw; cv.height = Math.ceil(ids.length / cols) * ch; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.fillStyle = '#d9d4c6'; c.fillRect(0, 0, cv.width, cv.height);
    const bike = RR.BIKE.hoss;
    ids.forEach((p, i) => {
      const x0 = (i % cols) * cw, y0 = Math.floor(i / cols) * ch;
      const sw = document.createElement('canvas'); sw.style.cssText = 'width:280px;height:280px;position:fixed;left:0;top:0;opacity:0'; document.body.appendChild(sw);
      RR.Art.swatch(sw, p, bike, 1.4); c.drawImage(sw, x0 + 4, y0 + 4, 280, 280); sw.remove();
      const S = 120; c.save(); c.beginPath(); c.rect(x0 + 290, y0, 270, 280); c.clip();
      c.setTransform(S, 0, 0, -S, x0 + 290 + 135 - (bike.wb / 2) * S, y0 + 250);
      RR.Art.bike(c, bike, { rider: false, lp: 0, stand: 0, look: { paint: p, rider: null }, t: 1.4 }); c.restore();
      c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#15171d'; c.font = 'bold 14px sans-serif'; c.fillText(p.index + ' ' + p.name + ' [' + p.tier + ']', x0 + 6, y0 + ch - 8);
    });
  }, [a, b]);
  await t.wait(100); await t.page.locator('#sheet').screenshot({ path: out + '/swatches-' + a + '-' + Math.min(b, 999) + '.png' });
  console.log('errors:', t.errs.length); t.errs.slice(0, 5).forEach(e => console.log(e)); await t.close();
})();
