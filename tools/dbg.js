const RR = require('../src/physics.js'); require('../src/builder.js');
const starter = { id:'scrapper', mass:172, kgyr:0.46, wb:1.44, rr:0.33, rf:0.345, com:[0.63,0.80], wheelMass:[11,9], rake:27, swing:10,
  sus:[{travel:0.27,freq:2.0,sag:0.3,zc:0.42,zr:0.95},{travel:0.28,freq:1.95,sag:0.28,zc:0.4,zr:0.9}],
  accel:0.62, vp:9, vmax:15.5, grip:1.0, brake:0.85, leanAcc:15, spin:6.4, cda:0.5,
  body:[[0.62,0.36,0.13],[-0.28,0.92,0.09],[1.22,1.02,0.09],[0.98,1.16,0.07],[0.25,0.93,0.1]],
  rider:{seat:[0.42,0.93],peg:[0.52,0.42],grip:[0.98,1.17],scale:1,torso:0.38} };
const world = { id:'w', gravity:9.81, mat:0, pit:'fall' };
const b = RR.prepBike(starter);
const tb = new RR.TB(world, 5); tb.flat(40).kicker(30,7,1.5).drop(2.5).flat(100); const tr = tb.finish('t','t');
const s = RR.createSim(b, tr); s.started = true;
for (let i = 0; i < 6*120; i++) { const t=i/120;
  RR.tick(s, {lean:0,gas:true,brake:false});
  if (t > 4.55 && t < 4.85) {
    const KE = 0.5*b.M*(s.vx**2+s.vy**2)+0.5*b.I*s.w**2 + [0,1].reduce((a,j)=>a+0.5*b.wh[j].m*(s.wvx[j]**2+s.wvy[j]**2)+0.5*b.wh[j].I*s.ww[j]**2,0);
    console.log(t.toFixed(3),'x',s.x.toFixed(2),'y',s.y.toFixed(2),'a',(s.a*57.3).toFixed(1),'w',s.w.toFixed(2),'KE',Math.round(KE),'comp',s.comp.map(v=>v.toFixed(3)).join(','),'ld',s.load.map(Math.round).join(','),'ww',s.ww.map(v=>v.toFixed(1)).join(','),'body',s.body, 'scr', Math.round(s.scrape), 'wheel y-ground', [0,1].map(j=>(s.wy[j]-RR.groundY(tr,s.wx[j])).toFixed(3)).join(','));
  }
}
// substep trace
{
const s = RR.createSim(b, tr); s.started = true;
const C = new RR.Contacts();
for (let i = 0; i < 6*120; i++) { const t=i/120;
  RR.tick(s, {lean:0,gas:true,brake:false});
  if (t > 4.76 && t < 4.79) {
    const n = RR.queryCircle(s.col, s.wx[1], s.wy[1], b.wh[1].r, s.gates, C);
    console.log('T',t.toFixed(4),'front wheel', s.wx[1].toFixed(3), s.wy[1].toFixed(3), 'v', s.wvx[1].toFixed(2), s.wvy[1].toFixed(2), 'contacts', n, Array.from({length:n},(_,k)=>`n(${C.nx[k].toFixed(2)},${C.ny[k].toFixed(2)}) pen ${C.pen[k].toFixed(3)}`).join(' | '), 'chassis', s.x.toFixed(3), s.y.toFixed(3), s.vx.toFixed(2), s.vy.toFixed(2));
  }
}
// print ground points near lip
for (let i=0;i<tr.xs.length;i++) if (tr.xs[i]>51 && tr.xs[i]<55) console.log(i, tr.xs[i].toFixed(3), tr.ys[i].toFixed(3));
}
