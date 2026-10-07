// quick physics telemetry
const RR = require('../src/physics.js'); require('../src/builder.js');
const starter = { id:'scrapper', mass:172, kgyr:0.46, wb:1.44, rr:0.33, rf:0.345, com:[0.63,0.80], wheelMass:[11,9], rake:27, swing:10,
  sus:[{travel:0.27,freq:2.0,sag:0.3,zc:0.42,zr:0.95},{travel:0.28,freq:1.95,sag:0.28,zc:0.4,zr:0.9}],
  accel:0.62, vp:9, vmax:15.5, grip:1.0, brake:0.85, leanAcc:15, spin:6.4, cda:0.5,
  body:[[0.62,0.36,0.13],[-0.28,0.92,0.09],[1.22,1.02,0.09],[0.98,1.16,0.07],[0.25,0.93,0.1]],
  rider:{seat:[0.42,0.93],peg:[0.52,0.42],grip:[0.98,1.17],scale:1,torso:0.38} };
const world = { id:'w', gravity:9.81, mat:0, pit:'fall' };
const b = RR.prepBike(starter);
console.log('wheels', b.wh.map(w=>({k:Math.round(w.k),sag:+w.sag.toFixed(3),pre:+w.pre.toFixed(3),cc:Math.round(w.cc),cr:Math.round(w.cr)})), 'I', b.I.toFixed(1), 'Isys', b.Isys.toFixed(1), 'thrust', Math.round(b.thrust));
function run(name, build, input, T, every) {
  const tb = new RR.TB(world, 5); build(tb); const tr = tb.finish('t','t');
  const s = RR.createSim(b, tr); s.started = true;
  console.log('---', name, 'rest: y', (s.y-b.com[1]).toFixed(3), 'a', s.a.toFixed(3), 'comp', s.comp.map(v=>v.toFixed(3)));
  for (let i = 0; i < T*120; i++) {
    const t = i/120; const inp = input(t, s);
    RR.tick(s, inp);
    for (const e of s.events) console.log('   ev', t.toFixed(2), JSON.stringify(e)); s.events.length = 0;
    if (i % Math.round(every*120) === 0) console.log(t.toFixed(2), 'x', s.x.toFixed(1), 'y', s.y.toFixed(2), 'v', Math.hypot(s.vx,s.vy).toFixed(1), 'a', (s.a*57.3).toFixed(0), 'w', s.w.toFixed(2), 'comp', s.comp.map(v=>v.toFixed(2)).join(','), 'gnd', s.gnd.map(v=>v?1:0).join(''), 'slip', s.slip.map(v=>v.toFixed(1)).join(','), 'ld', s.load.map(v=>Math.round(v)).join(','));
    if (s.crashed || s.finished) { console.log('END', s.crashed?'crash '+s.crashCause:'finish '+s.time.toFixed(2)); break; }
  }
}
const mode = process.argv[2] || 'flat';
if (mode === 'flat') run('flat accel', tb => tb.flat(300), t => ({lean:0, gas:true, brake:false}), 9, 0.5);
if (mode === 'wheelie') run('lean back accel', tb => tb.flat(300), t => ({lean:-1, gas:true, brake:false}), 4, 0.1);
if (mode === 'brake') run('brake', tb => tb.flat(300), t => ({lean:0, gas:t<5, brake:t>=5}), 9, 0.25);
if (mode === 'jump') run('kicker', tb => tb.flat(40).kicker(28,7,1.5).drop(2.2).flat(100), t => ({lean:0, gas:true, brake:false}), 9, 0.1);
if (mode === 'flip') run('backflip', tb => tb.flat(40).kicker(30,7,1.5).drop(2.5).flat(100), (t,s) => ({lean: s.air && Math.abs(s.rot) < 5.0 ? -1 : 0, gas:true, brake:false}), 9, 0.1);
if (mode === 'loop') run('loop', tb => tb.flat(45).loop(4).flat(60), t => ({lean:0, gas:true, brake:false}), 12, 0.1);
if (mode === 'drop') run('drop 3m', tb => tb.flat(30).drop(3).flat(100), t => ({lean:0, gas:true, brake:false}), 6, 0.1);
if (mode === 'climb') run('climb 30deg', tb => tb.flat(25).up(30,20,8).flat(60), t => ({lean:+(process.argv[3]||0), gas:true, brake:false}), 9, 0.2);
