/* Tiles several screenshots into one picture. usage: node tools/montage.js out.png cols scale img1 img2 ... */
const sharp = require('/opt/npm-tools/node_modules/sharp');
(async () => {
  const [out, cols, scale, ...imgs] = process.argv.slice(2);
  const metas = await Promise.all(imgs.map(f => sharp(f).metadata()));
  const w = Math.round(metas[0].width * scale), h = Math.round(metas[0].height * scale), n = +cols, rows = Math.ceil(imgs.length / n);
  const bufs = await Promise.all(imgs.map(f => sharp(f).resize(w, h, { fit: 'fill' }).toBuffer()));
  await sharp({ create: { width: w * n + (n - 1) * 4, height: h * rows + (rows - 1) * 4, channels: 3, background: '#000' } })
    .composite(bufs.map((b, i) => ({ input: b, left: (i % n) * (w + 4), top: Math.floor(i / n) * (h + 4) }))).png().toFile(out);
})();
