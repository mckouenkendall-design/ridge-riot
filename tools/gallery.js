/* Draws contact sheets of the bikes, paint jobs and riders so they can be looked at in one go.
   usage: node tools/gallery.js <outdir> */
const lib = require('./lib.js');
const out = process.argv[2] || '/tmp';
(async () => {
  const t = await lib.open({ w: 1500, h: 900, dpr: 1, touch: false });
  const sheet = async (name, cells, cols, cw, ch, time) => {
    await t.ev(([cells, cols, cw, ch, time]) => {
      let cv = document.getElementById('sheet'); if (!cv) { cv = document.createElement('canvas'); cv.id = 'sheet'; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99;background:#d9d4c6'; document.body.appendChild(cv); }
      const rows = Math.ceil(cells.length / cols); cv.width = cols * cw; cv.height = rows * ch; cv.style.width = cv.width + 'px'; cv.style.height = cv.height + 'px';
      const c = cv.getContext('2d'); c.fillStyle = '#d9d4c6'; c.fillRect(0, 0, cv.width, cv.height);
      cells.forEach((cell, i) => {
        const x0 = (i % cols) * cw, y0 = Math.floor(i / cols) * ch, d = RR.BIKE[cell.bike || 'scrapper'];
        c.save(); c.beginPath(); c.rect(x0, y0, cw, ch); c.clip();
        c.fillStyle = i % 2 ? '#cfc9ba' : '#d9d4c6'; c.fillRect(x0, y0, cw, ch);
        if (cell.head) { const S = ch / 3.6; c.setTransform(S, 0, 0, -S, x0 + cw / 2, y0 + ch * 0.56); c.lineJoin = 'round'; RR.Art.head(c, 0, 0, 1, 0, RR.RIDER[cell.head], time); }
        else {
          const span = d.wb + d.rr + d.rf + 0.6, S = Math.min(cw / span, (ch - 18) / (cell.tall || 2.5));
          c.setTransform(S, 0, 0, -S, x0 + (cw - span * S) / 2 + (d.rr + 0.3) * S, y0 + ch - 20);
          RR.Art.bike(c, d, { rider: cell.rider !== false, lp: cell.lp || 0, stand: 0, look: { paint: RR.PAINT[cell.paint] || null, rider: RR.RIDER[cell.skin] || null }, t: time });
        }
        c.restore(); c.setTransform(1, 0, 0, 1, 0, 0);
        c.fillStyle = '#15171d'; c.font = 'bold 13px sans-serif'; c.fillText(cell.label || '', x0 + 6, y0 + ch - 5);
      });
      window.scrollTo(0, 0);
    }, [cells, cols, cw, ch, time || 1.3]);
    await t.wait(80);
    const cv = t.page.locator('#sheet'); await cv.screenshot({ path: out + '/' + name + '.png' });
  };
  const B = await t.ev(() => RR.BIKES.map(b => ({ bike: b.id, label: b.name + ' (' + b.wipe + ')', tall: b.kind === 'bumper' ? 2.7 : 2.5 })));
  await sheet('g-bikes', B, 5, 300, 250);
  const P = await t.ev(() => RR.PAINTS.map(p => ({ paint: p.id, label: p.name + ' [' + p.tier + ']' })));
  await sheet('g-paints', P, 6, 250, 205);
  await sheet('g-paints2', P.map((p, i) => Object.assign({}, p, { bike: ['razor', 'mule', 'biscotti', 'volt', 'hoss', 'comet'][i % 6] })), 6, 250, 205, 3.1);
  const R = await t.ev(() => RR.RIDERS.map(r => ({ skin: r.id, label: r.name + ' [' + r.tier + ']' })));
  await sheet('g-riders', R, 5, 300, 240);
  await sheet('g-heads', R.map(r => ({ head: r.skin, label: r.label })), 10, 150, 160);
  await sheet('g-riders2', R.map((r, i) => Object.assign({}, r, { bike: ['mule', 'biscotti', 'penny', 'sling', 'marsh'][i % 5], tall: 2.7 })), 5, 300, 260, 2.2);
  console.log('errors:', t.errs.length); t.errs.slice(0, 5).forEach(e => console.log(e));
  await t.close();
})();
