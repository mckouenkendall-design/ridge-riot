/* Lets the robot ride a track in the real page and saves a picture each time the bike passes a listed spot.
   usage: node tools/ride.js <outdir> '<json list of [trackIndex, [x positions], bikeId?, paintId?, riderId?]>' */
const lib = require('./lib.js');
const out = process.argv[2] || '/tmp', list = JSON.parse(process.argv[3] || '[[16,[30,60,90]]]');
(async () => {
  const t = await lib.open({ save: { v: 2, settings: { unlockAll: true, music: 0 }, times: {} }, inset: process.env.INSET ? JSON.parse(process.env.INSET) : null, w: +(process.env.W || 844), h: +(process.env.H || 390) });
  for (const [ti, xs, bike, paint, rider] of list) {
    await t.ev(([ti, bike, paint, rider]) => {
      if (bike) RR.Store.data.bike = bike;
      RR.Store.data.fit[RR.Store.data.bike] = { p: paint || '', r: rider || '' };
      RR.UI.show('hud'); RR.Game.play(ti);
    }, [ti, bike, paint, rider]);
    await t.bot();
    for (const x of xs) {
      const ok = await t.page.waitForFunction(x => RR.Game.sim.x >= x || RR.Game.sim.crashed || RR.Game.sim.finished, x, { timeout: 60000 }).then(() => true, () => false);
      await t.shot(`${out}/r${ti}-${x}.png`);
      const st = await t.ev(() => { const s = RR.Game.sim; return { x: +s.x.toFixed(0), t: +s.time.toFixed(1), crashed: s.crashed, cause: s.crashCause, fin: s.finished, state: RR.Game.state }; });
      console.log(ti, x, JSON.stringify(st), ok ? '' : 'TIMEOUT');
      if (st.crashed || st.fin) break;
    }
    await t.botOff();
  }
  console.log('errors:', t.errs.length); t.errs.slice(0, 5).forEach(e => console.log(e));
  await t.close();
})();
