/* Draws contact sheets of the bikes, paint jobs and riders so they can be looked at in one go.
   usage: node tools/gallery.js <outdir>               every bike, paint job and rider
          node tools/gallery.js <outdir> --compare     new items next to existing ones, one row per tier
          node tools/gallery.js <outdir> --new         only the items added since the first collection, in tier order, big
          add --only=id,id to show only those ids as the new ones, and --zoom=2 to draw everything twice as big
   Paint jobs and riders are also shown on other bikes, so a look that only works on one bike shows up. */
const lib = require('./lib.js');
const args = process.argv.slice(2), out = args.find(a => !a.startsWith('--')) || '/tmp';
const compare = args.includes('--compare'), onlyNew = args.includes('--new');
const ZOOM = +((args.find(a => a.startsWith('--zoom=')) || '--zoom=1').split('=')[1]);     // --zoom=2 draws every cell twice as big
const ORIG = { paint: 24, rider: 20 };
const ONLY = ((args.find(a => a.startsWith('--only=')) || '').slice(7) || '').split(',').filter(Boolean);      // --only=id,id shows just those as the new ones      // how many of each there were in the first collection
(async () => {
  const t = await lib.open({ w: 2400, h: 2200, dpr: 1, touch: false });
  const sheet = async (name, cells, cols, cw, ch, time) => {
    await t.ev(([cells, cols, cw, ch, time]) => {
      let cv = document.getElementById('sheet'); if (!cv) { cv = document.createElement('canvas'); cv.id = 'sheet'; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99;background:#d9d4c6'; document.body.appendChild(cv); }
      const rows = Math.ceil(cells.length / cols); cv.width = cols * cw; cv.height = rows * ch; cv.style.width = cv.width + 'px'; cv.style.height = cv.height + 'px';
      const c = cv.getContext('2d'); c.fillStyle = '#d9d4c6'; c.fillRect(0, 0, cv.width, cv.height);
      cells.forEach((cell, i) => {
        const x0 = (i % cols) * cw, y0 = Math.floor(i / cols) * ch, d = RR.BIKE[cell.bike || 'scrapper'];
        c.save(); c.beginPath(); c.rect(x0, y0, cw, ch); c.clip();
        c.fillStyle = cell.hl ? '#e9e2c0' : i % 2 ? '#cfc9ba' : '#d9d4c6'; c.fillRect(x0, y0, cw, ch);
        if (cell.blank) { c.restore(); return; }
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
  const list = (kind) => t.ev(([kind, orig]) => (kind === 'paint' ? RR.PAINTS : RR.RIDERS).map(x => ({ id: x.id, name: x.name, tier: x.tier, fresh: x.index >= orig && (!ONLY.length || ONLY.includes(x.id)) })), [kind, ORIG[kind]]);

  if (compare || onlyNew) {
    for (const kind of ['paint', 'rider']) {
      const all = await list(kind), key = kind === 'paint' ? 'paint' : 'skin';
      const tiers = (await t.ev(() => RR.TIERS.map(x => x.id))).concat('trophy');
      const rows = tiers.map(id => ({ old: all.filter(x => !x.fresh && x.tier === id).slice(0, 3), nw: all.filter(x => x.fresh && x.tier === id) }));
      const maxNew = Math.max(...rows.map(r => r.nw.length)), cols = onlyNew ? Math.min(maxNew, ZOOM > 1 ? 3 : 8) : 3 + maxNew;
      const cells = [];
      rows.forEach(r => {
        const mine = onlyNew ? [] : r.old.map(x => ({ [key]: x.id, label: x.name + ' [' + x.tier + ']' })).concat(Array(3 - r.old.length).fill({ blank: true }));
        const fresh = r.nw.map(x => ({ [key]: x.id, hl: true, label: 'NEW  ' + x.name + ' [' + x.tier + ']', tall: kind === 'rider' ? 2.7 : 2.5 }));
        if (onlyNew) { for (let i = 0; i < fresh.length; i += cols) { const chunk = fresh.slice(i, i + cols); cells.push(...chunk, ...Array(cols - chunk.length).fill({ blank: true })); } }
        else cells.push(...mine, ...fresh, ...Array(maxNew - fresh.length).fill({ blank: true }));
      });
      const cw = (kind === 'paint' ? 330 : 360) * ZOOM, ch = (kind === 'paint' ? 270 : 300) * ZOOM;
      await sheet((onlyNew ? 'n-' : 'c-') + kind + 's', cells, cols, cw, ch, 1.3);
      if (kind === 'paint') {   // the same paint jobs on other bikes, a little later in time so the moving ones have moved
        const bikes = ['razor', 'mule', 'biscotti', 'volt', 'hoss', 'comet', 'penny', 'sling'];
        const fr = all.filter(x => x.fresh);
        await sheet((onlyNew ? 'n-' : 'c-') + 'paints-bikes', fr.map((x, i) => ({ paint: x.id, bike: bikes[i % bikes.length], label: x.name + ' [' + x.tier + ']' })), 5, 300, 250, 3.1);
      } else {
        const fr = all.filter(x => x.fresh);
        await sheet((onlyNew ? 'n-' : 'c-') + 'heads', fr.map(x => ({ head: x.id, label: x.name + ' [' + x.tier + ']' })), 5, 240, 250, 1.7);
        const bikes = ['mule', 'biscotti', 'penny', 'sling', 'marsh'];
        await sheet((onlyNew ? 'n-' : 'c-') + 'riders-bikes', fr.map((x, i) => ({ skin: x.id, bike: bikes[i % bikes.length], tall: 2.7, label: x.name + ' [' + x.tier + ']' })), 5, 300, 260, 2.2);
      }
    }
  } else {
    const B = await t.ev(() => RR.BIKES.map(b => ({ bike: b.id, label: b.name + ' (' + b.wipe + ')', tall: b.kind === 'bumper' ? 2.7 : 2.5 })));
    await sheet('g-bikes', B, 5, 300, 250);
    const P = await t.ev(() => RR.PAINTS.map(p => ({ paint: p.id, label: p.name + ' [' + p.tier + ']' })));
    await sheet('g-paints', P, 6, 250, 205);
    await sheet('g-paints2', P.map((p, i) => Object.assign({}, p, { bike: ['razor', 'mule', 'biscotti', 'volt', 'hoss', 'comet'][i % 6] })), 6, 250, 205, 3.1);
    const R = await t.ev(() => RR.RIDERS.map(r => ({ skin: r.id, label: r.name + ' [' + r.tier + ']' })));
    await sheet('g-riders', R, 5, 300, 240);
    await sheet('g-heads', R.map(r => ({ head: r.skin, label: r.label })), 10, 150, 160);
    await sheet('g-riders2', R.map((r, i) => Object.assign({}, r, { bike: ['mule', 'biscotti', 'penny', 'sling', 'marsh'][i % 5], tall: 2.7 })), 5, 300, 260, 2.2);
  }
  console.log('errors:', t.errs.length); t.errs.slice(0, 5).forEach(e => console.log(e));
  await t.close();
})();
