const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(400);
  // each: [track, paint job, rider]. The moving paint jobs and riders are the costliest things to draw.
  for (const [t, paint, rider] of [[0, '', ''], [0, 'whiteopal', 'prism'], [9, '', ''], [17, 'blackopal', 'nova'], [20, '', ''], [20, 'whiteopal', 'prism'], [21, 'whiteopal', 'prism'], [22, 'blackopal', 'nova'], [33, 'amethyst', 'ember'], [41, 'goldleaf', 'merl']]) {
    const r = await page.evaluate(async ([ti, paint, rider]) => {
      RR.Store.data.settings.unlockAll = true; RR.Store.data.fit[RR.Store.data.bike] = { p: paint, r: rider }; RR.UI.show('hud'); RR.Game.play(ti); RR.Game.sim.started = true; RR.Game.state = 'run';
      const G = RR.Game, P = {}, o = { lean: 0, brake: false, gas: true };
      // physics cost
      let t0 = performance.now(); for (let i = 0; i < 1200; i++) { RR.botInput(G.sim, P, o); RR.tick(G.sim, o); G.sim.events.length = 0; if (G.sim.crashed || G.sim.finished) RR.resetSim(G.sim), G.sim.started = true; } const phys = (performance.now() - t0) / 1200;
      await new Promise(r => setTimeout(r, 300));
      // frames actually delivered while the game runs itself
      let n = 0, worst = 0, last = performance.now(); const start = last;
      await new Promise(res => { function f(ts) { const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++; if (now - start < 3000) requestAnimationFrame(f); else res(); } requestAnimationFrame(f); });
      // draw cost alone
      const ts = []; for (let i = 0; i < 60; i++) { t0 = performance.now(); RR.Render.frame(G, 0.016); ts.push(performance.now() - t0); }
      ts.sort((a, b) => a - b); const draw = ts[30], drawWorst = ts[59];
      return { track: RR.getTrack(ti).name, look: (paint || 'stock') + '/' + (rider || 'stock'), physMsPerTick: +phys.toFixed(3), drawMsTypical: +draw.toFixed(2), drawMsWorst: +drawWorst.toFixed(1), fps: +(n / 3).toFixed(1), worstFrameMs: +worst.toFixed(1), parts: RR.Render.parts.length, canvas: document.getElementById('stage').width + 'x' + document.getElementById('stage').height };
    }, [t, paint, rider]);
    console.log(JSON.stringify(r));
  }
  await browser.close();
})();
