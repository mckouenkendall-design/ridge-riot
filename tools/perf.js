const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(400);
  for (const t of [0, 9, 17, 25, 33]) {
    const r = await page.evaluate(async (ti) => {
      RR.Store.data.settings.unlockAll = true; RR.UI.show('hud'); RR.Game.play(ti); RR.Game.sim.started = true; RR.Game.state = 'run';
      const G = RR.Game, P = {}, o = { lean: 0, brake: false, gas: true };
      // physics cost
      let t0 = performance.now(); for (let i = 0; i < 1200; i++) { RR.botInput(G.sim, P, o); RR.tick(G.sim, o); G.sim.events.length = 0; if (G.sim.crashed || G.sim.finished) RR.resetSim(G.sim), G.sim.started = true; } const phys = (performance.now() - t0) / 1200;
      await new Promise(r => setTimeout(r, 300));
      // frames actually delivered while the game runs itself
      let n = 0, worst = 0, last = performance.now(); const start = last;
      await new Promise(res => { function f(ts) { const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++; if (now - start < 3000) requestAnimationFrame(f); else res(); } requestAnimationFrame(f); });
      // draw cost alone
      t0 = performance.now(); for (let i = 0; i < 60; i++) RR.Render.frame(G, 0.016); const draw = (performance.now() - t0) / 60;
      return { track: RR.getTrack(ti).name, physMsPerTick: +phys.toFixed(3), drawCallMs: +draw.toFixed(2), fps: +(n / 3).toFixed(1), worstFrameMs: +worst.toFixed(1), parts: RR.Render.parts.length, canvas: document.getElementById('stage').width + 'x' + document.getElementById('stage').height };
    }, t);
    console.log(JSON.stringify(r));
  }
  await browser.close();
})();
