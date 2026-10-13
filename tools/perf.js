/* How long a frame takes to draw, with and without the fanciest paint jobs and riders on.
   usage: node tools/perf.js [--page=path/to/index.html] [--old]
   --old runs the same checks on a build from before the rarity overhaul (old item names) so numbers can be compared.
   Every timing forces the picture to be finished (reads one pixel back), because drawing commands alone are
   queued and look free. The test browser has no graphics card, so the "frames per second" figures mean little
   here; the milliseconds per frame are what to compare. A 60 Hz screen allows 16.7 ms per frame, 120 Hz allows 8.3. */
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const OLD = process.argv.includes('--old');
const PAGE = arg('page') ? path.resolve(arg('page')) : path.resolve(__dirname, '..', 'index.html');
(async () => {
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + PAGE); await page.waitForTimeout(500);
  const stat = a => { a = a.slice().sort((x, y) => x - y); const m = a.reduce((s, x) => s + x, 0) / a.length; return { mean: +m.toFixed(2), p95: +a[Math.floor(a.length * 0.95)].toFixed(2), max: +a[a.length - 1].toFixed(2) }; };

  // ---- 1. riding: the real game loop with a look on ----
  const cases = OLD
    ? [[0, '', ''], [0, 'whiteopal', 'prism'], [9, '', ''], [17, 'blackopal', 'nova'], [20, '', ''], [20, 'whiteopal', 'prism'], [21, 'whiteopal', 'prism'], [22, 'blackopal', 'nova'], [33, 'amethyst', 'ember'], [41, 'goldleaf', 'merl']]
    : [[0, '', ''], [0, 'whiteopal', 'prism'], [9, '', ''], [17, 'blackopal', 'nova'], [20, '', ''], [20, 'whiteopal', 'prism'], [21, 'whiteopal', 'prism'], [22, 'blackopal', 'nova'], [33, 'magma', 'phoenix'], [41, 'abyss', 'kraken'], [21, 'lavalamp', 'helios'], [22, 'galaxy', 'void']];
  console.log('--- riding: milliseconds to draw one frame (finished), then what the browser actually delivered ---');
  for (const [t, paint, rider] of cases) {
    const r = await page.evaluate(async ([ti, paint, rider]) => {
      const D = RR.Store.data; D.settings.unlockAll = true; D.fit[D.bike] = { p: paint, r: rider };
      if (paint && RR.PAINT[paint]) D.paints[paint] = 1; if (rider && RR.RIDER[rider]) D.riders[rider] = 1;
      RR.UI.show('hud'); RR.Game.play(ti); RR.Game.sim.started = true; RR.Game.state = 'run';
      const G = RR.Game, P = {}, o = { lean: 0, brake: false, gas: true }, st = document.getElementById('stage'), c2 = st.getContext('2d');
      const flush = () => { try { c2.getImageData(0, 0, 1, 1); } catch (e) {} };
      let t0 = performance.now(); for (let i = 0; i < 1200; i++) { RR.botInput(G.sim, P, o); RR.tick(G.sim, o); G.sim.events.length = 0; if (G.sim.crashed || G.sim.finished) RR.resetSim(G.sim), G.sim.started = true; } const phys = (performance.now() - t0) / 1200;
      await new Promise(r => setTimeout(r, 300));
      let n = 0, worst = 0, last = performance.now(); const start = last;
      await new Promise(res => { function f() { const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++; if (now - start < 3000) requestAnimationFrame(f); else res(); } requestAnimationFrame(f); });
      const ts = []; for (let i = 0; i < 120; i++) { t0 = performance.now(); RR.Render.frame(G, 0.016); flush(); ts.push(performance.now() - t0); }
      return { track: RR.getTrack(ti).name, ts, phys, fps: n / 3, worst, parts: RR.Render.parts.length };
    }, [t, paint, rider]);
    const s = stat(r.ts);
    console.log(JSON.stringify({ track: r.track, look: (paint || 'stock') + '/' + (rider || 'stock'), drawMs: s, physMsPerTick: +r.phys.toFixed(3), fps: +r.fps.toFixed(1), worstFrameMs: +r.worst.toFixed(1) }));
  }
  if (OLD) { await browser.close(); return; }

  // ---- 2. which paint jobs and riders cost the most to draw (one bike, 120 frames each) ----
  const cost = await page.evaluate(() => {
    const A = RR.Art, out = [], cv = document.createElement('canvas'); cv.width = 900; cv.height = 500; const c = cv.getContext('2d'), d = RR.BIKES[0], S = 180;
    const flush = () => { try { c.getImageData(0, 0, 1, 1); } catch (e) {} };
    const time = (look) => { const ts = []; for (let i = 0; i < 60; i++) { const t0 = performance.now(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 900, 500); c.setTransform(S, 0, 0, -S, 200, 400); A.bike(c, d, { rider: true, lp: 0, stand: 0, look, t: i / 60 * 3 }); flush(); ts.push(performance.now() - t0); } ts.sort((a, b) => a - b); return ts[30]; };
    const base = time(null);
    RR.ALL.forEach(it => { if (!A.moves(it)) return; out.push({ id: it.id, kind: it.kind, tier: it.tier, ms: time(it.kind === 'paint' ? { paint: it, rider: null } : { paint: null, rider: it }) }); });
    return { base, out };
  });
  const top = k => cost.out.filter(x => x.kind === k).sort((a, b) => b.ms - a.ms);
  console.log('\n--- cost of one bike: plain ' + cost.base.toFixed(2) + ' ms. Animated items: ' + cost.out.filter(x => x.kind === 'paint').length + ' paints, ' + cost.out.filter(x => x.kind === 'rider').length + ' riders. Costliest: ---');
  console.log('paints  ' + top('paint').slice(0, 6).map(x => x.id + ' ' + x.ms.toFixed(2)).join(', '));
  console.log('riders  ' + top('rider').slice(0, 6).map(x => x.id + ' ' + x.ms.toFixed(2)).join(', '));

  // ---- 3. the menus: a full showroom, the garage lists, the crate ----
  const menus = await page.evaluate(async (fancy) => {
    const D = RR.Store.data, A = RR.Art; D.settings.unlockAll = false;
    RR.BIKES.forEach(b => D.owned[b.id] = 1); D.nuggets = 99999;
    const pt = fancy.paints, rd = fancy.riders;
    RR.BIKES.forEach((b, i) => { D.fit[b.id] = { p: pt[i % pt.length], r: rd[i % rd.length] }; D.paints[D.fit[b.id].p] = 1; D.riders[D.fit[b.id].r] = 1; });
    D.garage.level = 4; D.garage.slots = [];
    const res = {};
    RR.UI.show('garage'); RR.UI.garage(); RR.Showroom.open(); await new Promise(r => setTimeout(r, 400));
    const sc = document.getElementById('showcv').getContext('2d'), flush = () => { try { sc.getImageData(0, 0, 1, 1); } catch (e) {} };
    const ts = []; for (let i = 0; i < 120; i++) { const t0 = performance.now(); RR.Showroom.draw(); flush(); ts.push(performance.now() - t0); }
    res.showroom = ts;
    // the real loop: how many frames the browser got through in 3 s
    let n = 0, worst = 0, last = performance.now(); const start = last;
    await new Promise(r => { function f() { const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++; if (now - start < 3000) requestAnimationFrame(f); else r(); } requestAnimationFrame(f); });
    res.showFps = n / 3; res.showWorst = worst; res.stats = RR.Showroom.stats();
    // a more ordinary full showroom: 5 animated looks among 10 plain ones
    RR.BIKES.forEach((b, i) => { if (i >= 5) D.fit[b.id] = { p: 'wood', r: 'gnome' }; D.paints.wood = 1; D.riders.gnome = 1; });
    RR.Showroom.shown(false); RR.UI.show('garage'); RR.Showroom.open(); await new Promise(r => setTimeout(r, 400));
    const t2 = []; for (let i = 0; i < 120; i++) { const t0 = performance.now(); RR.Showroom.draw(); flush(); t2.push(performance.now() - t0); }
    res.mixed = t2;
    n = 0; worst = 0; last = performance.now(); const s3 = last;
    await new Promise(r => { function f() { const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++; if (now - s3 < 3000) requestAnimationFrame(f); else r(); } requestAnimationFrame(f); });
    // and one with nothing animated at all: the room's own lights are the only cost
    RR.BIKES.forEach(b => { D.fit[b.id] = { p: 'wood', r: 'gnome' }; });
    RR.Showroom.shown(false); RR.UI.show('garage'); RR.Showroom.open(); await new Promise(r => setTimeout(r, 400));
    const t3 = []; for (let i = 0; i < 120; i++) { const t0 = performance.now(); RR.Showroom.draw(); flush(); t3.push(performance.now() - t0); }
    res.plain = t3;
    res.mixedFps = n / 3; res.mixedWorst = worst; res.mixedStats = RR.Showroom.stats();
    // the garage paint tab with every animated tile moving
    RR.UI.gtab = 'paint'; RR.UI.pick = null; RR.UI.show('garage'); RR.UI.garage(); await new Promise(r => setTimeout(r, 300));
    n = 0; worst = 0; last = performance.now(); const s2 = last;
    await new Promise(r => { function f() { const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++; if (now - s2 < 3000) requestAnimationFrame(f); else r(); } requestAnimationFrame(f); });
    res.garageFps = n / 3; res.garageWorst = worst; res.animatedTiles = [...document.querySelectorAll('#tiles canvas[data-item]')].filter(cv => { const it = RR.ALL.find(x => x.id === cv.getAttribute('data-item')); return it && A.moves(it); }).length;
    return res;
  }, { paints: top('paint').slice(0, 15).map(x => x.id), riders: top('rider').slice(0, 15).map(x => x.id) });
  console.log('\n--- menus, in the test browser (no graphics card) ---');
  console.log('full showroom, 15 bikes in the 15 costliest animated paints/riders: draw ' + JSON.stringify(stat(menus.showroom)) + ' ms, browser delivered ' + menus.showFps.toFixed(1) + ' fps, worst frame ' + menus.showWorst.toFixed(1) + ' ms');
  console.log('   showroom load sharing: ' + JSON.stringify(menus.stats) + '   (shared:false means every animated bike was redrawn every frame)');
  console.log('ordinary full showroom, 5 animated bikes and 10 plain: draw ' + JSON.stringify(stat(menus.mixed)) + ' ms, browser delivered ' + menus.mixedFps.toFixed(1) + ' fps, worst frame ' + menus.mixedWorst.toFixed(1) + ' ms');
  console.log('   ' + JSON.stringify(menus.mixedStats));
  console.log('full showroom with nothing animated: draw ' + JSON.stringify(stat(menus.plain)) + ' ms (the room lights only)');
  console.log('garage paint list with ' + menus.animatedTiles + ' animated tiles: ' + menus.garageFps.toFixed(1) + ' fps, worst frame ' + menus.garageWorst.toFixed(1) + ' ms');
  if (errs.length) console.log('PAGE ERRORS', errs);
  await browser.close();
})();
