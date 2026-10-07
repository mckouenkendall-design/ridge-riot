/* Renders the game's sounds offline (no speakers) and measures them: loudness, clipping,
   pitch at idle and flat out, brightness. Also draws spectrograms so the shapes can be eyeballed.
   This proves the sounds exist, are different from each other and do not clip. It cannot say whether they sound good. */
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const out = process.argv[2] || '/tmp';
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(300);
  const res = await page.evaluate(async () => {
    const SR = 44100, Au = RR.Audio;
    function fft(re, im) { const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
      for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } }
    function spectrum(d, at, N) { const re = new Float32Array(N), im = new Float32Array(N); const o = Math.max(0, Math.min(d.length - N, Math.floor(at * SR))); for (let i = 0; i < N; i++) re[i] = d[o + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / N)); fft(re, im); const m = new Float32Array(N / 2); for (let i = 0; i < N / 2; i++) m[i] = Math.hypot(re[i], im[i]); return m; }
    function stats(d, at) { const N = 8192, m = spectrum(d, at, N); let sum = 0, cen = 0, pk = 0, pi = 0; for (let i = 2; i < N / 2; i++) { const f = i * SR / N; sum += m[i]; cen += m[i] * f; if (m[i] > pk && f > 15) { pk = m[i]; pi = i; } }
      // lowest strong partial = the firing rate
      let low = 0; for (let i = 2; i < N / 2; i++) if (m[i] > pk * 0.35) { low = i * SR / N; break; }
      return { centroid: Math.round(cen / sum), peakHz: Math.round(pi * SR / N), lowHz: Math.round(low) }; }
    function level(d, a, b) { let s = 0, pk = 0, clip = 0; const i0 = Math.floor(a * SR), i1 = Math.min(d.length, Math.floor(b * SR)); for (let i = i0; i < i1; i++) { const v = Math.abs(d[i]); s += v * v; if (v > pk) pk = v; if (v >= 0.999) clip++; } return { rms: +Math.sqrt(s / (i1 - i0)).toFixed(3), peak: +pk.toFixed(3), clip }; }
    function specImage(d, dur) { const N = 2048, hop = 512, cols = Math.floor((d.length - N) / hop), rows = 256, img = []; for (let c = 0; c < cols; c += Math.max(1, Math.floor(cols / 700))) { const m = spectrum(d, c * hop / SR, N), col = []; for (let r = 0; r < rows; r++) { const f = 30 * Math.pow(8000 / 30, r / rows), i = Math.min(N / 2 - 1, Math.round(f * N / SR)); col.push(Math.min(255, Math.round(48 * Math.log10(1 + m[i] * 60)))); } img.push(col); } return img; }
    async function render(dur, setup, steps) {
      const ctx = new OfflineAudioContext(1, Math.floor(SR * dur), SR);
      Au.build(ctx); Au.setVolumes({ sfx: 0.8, engine: 0.7, music: 0.5 });
      setup(ctx);
      for (let t = 0.02; t < dur - 0.02; t += 0.02) { const tt = t; ctx.suspend(tt).then(() => { steps(tt); ctx.resume(); }); }
      const buf = await ctx.startRendering(); Au.engineStop && 0;
      return buf.getChannelData(0);
    }
    const result = { engines: {}, sfx: {}, images: {} };
    // each engine: 0.6 s idle, then a pull through the gears to flat out, then throttle shut
    for (const d of RR.BIKES) {
      const dur = 6.5; let v = 0;
      const data = await render(dur, () => { Au.engineStart(d); }, t => {
        const gas = t > 0.6 && t < 5.2 ? 1 : 0; if (gas) v = Math.min(d.vmax, v + d.vmax / 4.2 * 0.02); else if (t >= 5.2) v = Math.max(0, v - d.vmax * 0.02 * 0.4);
        Au.engineUpdate({ v, vmax: d.vmax, gas, air: false, boost: false, dt: 0.02 });
      });
      result.engines[d.id] = { type: d.snd.type, idle: Object.assign(level(data, 0.25, 0.6), stats(data, 0.3)), mid: Object.assign(level(data, 2.2, 2.8), stats(data, 2.4)), top: Object.assign(level(data, 4.6, 5.2), stats(data, 4.8)), off: level(data, 5.6, 6.3) };
      if (['scrapper', 'mule', 'razor', 'volt', 'comet', 'dune'].includes(d.id)) result.images[d.id] = specImage(data, dur);
      Au.engineStop();
    }
    const shots = { land_soft: () => Au.land(2.5, 0), land_hard: () => Au.land(9, 0), bottom: () => Au.bottom(4), crash: () => Au.crash(15), splash: () => Au.splash('water'), lava: () => Au.splash('lava'), fall: () => Au.fall(),
      flip1: () => Au.flip(1), flip3: () => Au.flip(3), boost: () => Au.boost(), go: () => Au.go(), finish: () => Au.finish(), star: () => { Au.star(0); }, newBest: () => Au.newBest(), unlocked: () => Au.unlocked(),
      ui_tap: () => Au.ui('tap'), ui_go: () => Au.ui('go'), ui_back: () => Au.ui('back'), ui_no: () => Au.ui('no'), ui_swipe: () => Au.ui('swipe') };
    for (const k in shots) { let done = false; const data = await render(1.6, () => {}, t => { if (!done && t >= 0.1) { done = true; shots[k](); } });
      let end = 0; for (let i = data.length - 1; i > 0; i--) if (Math.abs(data[i]) > 0.004) { end = i / SR; break; }
      result.sfx[k] = Object.assign(level(data, 0.1, 1.5), stats(data, 0.12), { lastsS: +(end - 0.1).toFixed(2) }); }
    // layers + music
    { let on = false; const data = await render(3, () => { }, t => { if (!on) { on = true; Au.layersStart(); } Au.layersUpdate({ skid: t < 1 ? 1 : 0, dirt: t >= 1 && t < 2 ? 1 : 0, wind: t >= 2 ? 1 : 0, scrape: 0, boost: 0 }); });
      result.sfx.layer_skid = Object.assign(level(data, 0.4, 0.9), stats(data, 0.5)); result.sfx.layer_dirt = Object.assign(level(data, 1.4, 1.9), stats(data, 1.5)); result.sfx.layer_wind = Object.assign(level(data, 2.4, 2.9), stats(data, 2.5)); }
    return result;
  });
  // spectrogram pictures
  const sharp = require('/opt/npm-tools/node_modules/sharp');
  for (const id in res.images) {
    const img = res.images[id], w = img.length, h = img[0].length, raw = Buffer.alloc(w * h * 3);
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { const v = img[x][h - 1 - y], o = (y * w + x) * 3; raw[o] = v; raw[o + 1] = Math.min(255, v * 0.8 + (v > 128 ? (v - 128) : 0)); raw[o + 2] = 255 - v > 200 ? 40 : Math.max(0, 120 - v); }
    await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).resize(900, 300, { fit: 'fill' }).png().toFile(path.join(out, 'spec_' + id + '.png'));
  }
  delete res.images;
  console.log('ENGINES (idle / mid revs / flat out):  rms, peak, clipped samples, lowest strong pitch Hz, loudest pitch Hz, brightness (centroid Hz)');
  for (const id in res.engines) { const e = res.engines[id]; const f = s => `rms ${s.rms} pk ${s.peak} clip ${s.clip} low ${String(s.lowHz).padStart(4)} loud ${String(s.peakHz).padStart(4)} bright ${String(s.centroid).padStart(4)}`; console.log(id.padEnd(9), e.type.padEnd(8), '|', f(e.idle), '|', f(e.mid), '|', f(e.top), '| off-throttle rms', e.off.rms); }
  console.log('\nEFFECTS: rms, peak, clipped, loudest pitch, brightness, how long it lasts');
  for (const k in res.sfx) { const s = res.sfx[k]; console.log(k.padEnd(11), `rms ${s.rms} pk ${s.peak} clip ${s.clip} loud ${String(s.peakHz).padStart(5)}Hz bright ${String(s.centroid).padStart(5)}Hz` + (s.lastsS != null ? ` lasts ${s.lastsS}s` : '')); }
  if (errs.length) console.log('ERRORS', errs.slice(0, 5));
  await browser.close();
})();
