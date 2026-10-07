/* Crashes every bike on purpose and photographs its crash animation at three moments.
   usage: node tools/wipes.js <outdir> [bike ids] */
const lib = require('./lib.js');
const out = process.argv[2] || '/tmp';
(async () => {
  const t = await lib.open({ save: { v: 2, settings: { unlockAll: true, music: 0, hints: false }, times: {} } });
  const ids = process.argv[3] ? process.argv[3].split(',') : await t.ev(() => RR.BIKES.map(b => b.id));
  for (const id of ids) {
    await t.ev(id => { RR.Store.data.bike = id; RR.UI.show('hud'); RR.Game.play(id === 'sling' || id === 'longlegs' ? 3 : 0); const k = RR.Game.input; k.kG = true; k.kL = true; }, id);
    // most bikes loop out on the spot; the ones that will not are ridden into a jump with the lean held
    const ok = await t.page.waitForFunction(() => RR.Game.state === 'crash', null, { timeout: 25000 }).then(() => true, () => false);
    await t.ev(() => { const k = RR.Game.input; k.kG = false; k.kL = false; });
    if (!ok) { console.log(id, 'did not crash'); continue; }
    const cause = await t.ev(() => RR.Game.sim.crashCause + ' wipe=' + (RR.Game.wipe ? RR.Game.wipe.kind : 'none'));
    let i = 0;
    for (const ms of [330, 450, 700, 1100]) { await t.wait(ms); await t.page.screenshot({ path: `${out}/w-${id}-${i++}.png`, clip: { x: 60, y: 30, width: 560, height: 270 } }); }
    console.log(id, cause);
  }
  console.log('errors:', t.errs.length); t.errs.slice(0, 6).forEach(e => console.log(e));
  await t.close();
})();
