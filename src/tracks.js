/* Ridge Riot: worlds and tracks.
   Each track is a short recipe of pieces (see builder.js). Distances are metres.
   Star times live in startimes.js and are produced by tools/bot.js. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var M = RR.MAT;
if (typeof window === 'undefined' && typeof require !== 'undefined') { try { require('./gearspots.js'); } catch (e) {} }     // the tools that run without a page

RR.WORLDS = [
  { id: 'dust',   name: 'Dustbowl',    sub: 'Red rock and warm-up hills',      gravity: 9.81, mat: M.dirt, pit: 'fall',  logMat: M.rock, need: 0 },
  { id: 'pine',   name: 'Pinewood',    sub: 'Logs, creeks and bigger air',     gravity: 9.81, mat: M.dirt, pit: 'water', logMat: M.wood, need: 9 },
  { id: 'race',   name: 'Raceway',     sub: 'Smooth tarmac, boost strips, bus jumps', gravity: 9.81, mat: M.tarmac, pit: 'bus', logMat: M.rubber, need: 16 },
  { id: 'frost',  name: 'Frostbite',   sub: 'Snow drags, ice does not grip',   gravity: 9.81, mat: M.snow, pit: 'ice',   logMat: M.ice,  need: 24 },
  { id: 'cinder', name: 'Cinder Peak', sub: 'Lava below, rock above',          gravity: 9.81, mat: M.rock, pit: 'lava',  logMat: M.rock, need: 42 },
  { id: 'orbit',  name: 'Low Orbit',   sub: 'A third of the gravity, no air',  gravity: 3.9,  mat: M.dust, pit: 'fall',  logMat: M.rock, need: 62, airless: true }
];
RR.WORLD = {};
RR.WORLDS.forEach(function (w, i) { w.index = i; RR.WORLD[w.id] = w; });

/* safe jump: curve up, a straight lip so the bike leaves level, hole, downslope */
function jump(b, deg, w, landDeg, landLen, o) {
  o = o || {};
  b.kicker(deg, o.R || 8, o.lip == null ? 1.2 : o.lip);
  b.gap(w, o);
  b.land(landDeg, landLen, o.outR);
  return b;
}
/* kicky jump: the curve runs right to the edge, so it flicks the front wheel up
   and the rider has to push the nose back down in the air */
function kick(b, deg, w, landDeg, landLen, o) {
  o = o || {}; o.R = o.R || 5.5; o.lip = o.lip == null ? 0 : o.lip;
  return jump(b, deg, w, landDeg, landLen, o);
}
/* hop onto a flat island (no downslope to save a short jump) */
function hop(b, deg, w, o) { o = o || {}; b.kicker(deg, o.R || 8, o.lip == null ? 1.0 : o.lip); b.gap(w, o); return b; }

/* steel launch ramp (raceway): same shape as a kicker, bolted on top of the tarmac */
function ramp(b, deg, R, lip) { b.surface('steel').kicker(deg, R || 8, lip == null ? 1.2 : lip).surface(); return b; }
/* a bus jump with a sign gantry over it: clear the bus, stay under the steel */
function gantry(b, v, deg, buses, at, clear, o) {
  o = o || {};
  b.slow(v).flat(6); ramp(b, deg, 8, 1.2);
  b.beam(at, clear, 1.4, 9, 'gantry');
  return b.buses(buses, { rise: o.rise == null ? -0.6 : o.rise }).land(o.land || deg - 4, o.landLen || 8).go();
}

/* ------------------------------------------------------------------ */
/* Pieces with teeth. Each one is fine at the right speed and ends the  */
/* run flat out (and some of them if you crawl, too). tools/lab.js      */
/* rides every bike into each of them at every speed to find the safe   */
/* range, which is where the numbers in the comments come from.         */
/* v is the speed (m/s) the robot riders hold; players have to find it. */
/* ------------------------------------------------------------------ */
var PC = RR.PIECES = {
  /* Low roof over one or more humps. The roof follows the ground, so a bike that leaves the
     crest of a hump meets the rock coming down the far side. humps: [[height, length], ...] */
  cave: function (b, clear, humps, gapLen) {
    humps = humps || [[1.1, 10]];
    b.roofStart(clear || 3.2).flat(5);
    for (var i = 0; i < humps.length; i++) { b.hill(humps[i][0], humps[i][1]); b.flat(gapLen == null ? 5 : gapLen); }
    return b.roofEnd();
  },
  tunnel: function (b, v, clear, humps, gapLen) { b.slow(v).flat(5); PC.cave(b, clear, humps, gapLen); return b.go().flat(3); },
  /* Letterbox: ride off a ledge and in under a rock face. Too fast and you are still up at face
     height when you get there. pit > 0 puts a hole under the ledge, so crawling off is no good either. */
  box: function (b, v, drop, pit, face, clear, len) {
    b.slow(v).flat(5);
    if (pit) b.gap(pit, { rise: -drop }); else b.drop(drop);
    return b.flat(face - (pit || 0)).roofStart(clear || 3.1).flat(len || 9).roofEnd().go().flat(3);
  },
  /* Limbo: a jump with something hanging over it. Too slow drops you in the hole, too fast puts your head in it. */
  limbo: function (b, v, deg, w, at, clear, o) {
    o = o || {};
    b.slow(v).flat(6).kicker(deg, 8, 1.2).beam(at, clear, o.bw || 1.2, o.bh || 9, o.style);
    b.gap(w, { rise: o.rise == null ? -0.6 : o.rise });
    return b.land(o.land || deg - 4, o.landLen || 8).go();
  },
  /* MOMENTUM PIECES: wrong speed costs time, never the run.
     Double: a kicker, a dip, then a second mound whose far side is the landing. The right speed puts you on that
     downslope and you keep your speed. Too slow and you land in the dip or case the face of the mound and lose it;
     too fast and you sail past the downslope and land flat. */
  double: function (b, deg, gap, H2, landDeg, landLen, o) {
    o = o || {}; var D = Math.PI / 180, y0 = b.y, px0 = b.x;
    b.kicker(deg, o.R || 7, o.lip == null ? 0.8 : o.lip);
    var xl = b.x, face = o.face || (o.deep ? 22 : 30), back = o.back || (o.deep ? 26 : 34);     // a pit has gentler walls, so a slow rider can roll in and climb out
    // o.deep: the dip between the two goes this far below the ground the piece started on: a pit with a floor,
    // too deep to see the bottom of from the bike at speed (that is where a gear can hide)
    b.to(-back, 1.2).line(Math.max(0.3, (b.y - y0 - 0.25 + (o.deep || 0)) / Math.sin(back * D))); b.to(0, 1.2);
    var upRun = (y0 + H2 - b.y) / Math.tan(face * D), trough = Math.max(1, xl + gap - b.x - upRun);
    if (o.gear === 'trough') b.gear(trough * 0.5, 0.75);
    b.line(trough);
    b.to(face, 1.4).line(Math.max(0.3, (y0 + H2 - b.y - 0.3) / Math.sin(face * D)));
    b.to(0, 1.4).line(o.crest == null ? 0.6 : o.crest);
    b.to(-landDeg, 2).line(landLen);
    b.to(0, o.outR || 9);
    // the next hill comes straight after the landing: overshoot the downslope and you hit its face
    if (o.next) { b.line(o.gapAfter == null ? 1.5 : o.gapAfter); b.hill(o.next[0], o.next[1]); }
    b.feats.push({ t: 'piece', kind: 'double', x0: px0, x1: b.x });
    return b;
  },
  /* Rollers: rounded humps. At the right speed you skim from the top of one onto the back of the next;
     slower and you roll every one, faster and you fly the lot and land flat. */
  rollers: function (b, n, len, h, gap) { var x0 = b.x; for (var i = 0; i < n; i++) { b.hill(h, len); if (gap) b.flat(gap); } b.feats.push({ t: 'piece', kind: 'rollers', x0: x0, x1: b.x }); return b; },
  /* Side ledge: a short high road with one rock slab (lean back at the sign to take it). Off the ordinary line,
     so it is a place for a gear. The ramps are gentle and the slab is flat, so either way is safe. H must leave
     head room underneath: the slab is 0.6 thick and a rider stands about 1.8 tall, so 3.7 or more. */
  ledge: function (b, H, len, o) {
    o = o || {}; var x0 = b.x;
    b.fork({ one: true, H: H, th: 0.6, slab1: len, rampLen: o.rampLen || 14, exitLen: o.exitLen || 14, kickH: 0, low: o.low });
    var f = b.feats.filter(function (q) { return q.t === 'fork'; }).pop();
    f.ledge = true;
    if (o.gear !== false) b.gearAt(f.a0 + len * (o.at == null ? 0.6 : o.at), f.top + 0.95);
    return b;
  },
  /* two routes: see TB.fork in builder.js. lowFloor builds the cave floor (default: flat) */
  fork: function (b, o) { return b.fork(o || {}); },
  /* A jump inside a tunnel: the roof is why you cannot take it flat out */
  cavejump: function (b, v, clear, deg, w, o) {
    o = o || {};
    b.slow(v).flat(4).roofStart(clear).flat(6).kicker(deg, 8, 1.0).gap(w, { rise: o.rise == null ? -0.5 : o.rise });
    return b.land(deg - 2, 6).flat(6).roofEnd().go().flat(3);
  }
};

/* [name, tip shown before the start, recipe] */
var T = [
/* ----------------------------- DUSTBOWL ----------------------------- */
/* Phase 2: [name, tip, recipe, challenge]. Each track has a momentum piece or two (PC.double, PC.rollers),
   a jump big enough to flip, a hidden gear (b.gear) and a challenge (see goals.js). */
['First Gear', 'Right thumb: gas and brake. Left thumb: lean back and lean forward.', function (b) {
  b.flat(18).hill(1.2, 18).flat(10);
  PC.double(b, 14, 8, 1.6, 18, 7, { next: [2.2, 14], gapAfter: 1.5, face: 26 });
  b.flat(10).ease(26, -3).flat(12).bumps(4, 5, 0.3).flat(10).ease(20, 2.5).flat(14).sign('jump');
  b.gearHint({ len: 30 });       // at the foot of the last landing: only if you come in slow enough to land short
  jump(b, 17, 6, 15, 12, { rise: -2.2, lip: 1.4 });
  b.flat(16);
}, { t: 'wheelie', sec: 2 }],
['Rolling Dunes', 'Front wheel coming up on a climb? Lean forward, or ease off the gas.', function (b) {
  b.flat(14).waves(3, 24, 1.15).flat(8).ease(34, -6).flat(8).surface('sand').flat(14).surface();
  b.gearHint({ len: 16 });        // down in the pit between the jump and the mound: come in slow and drop into it
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1, deep: 1.6 });
  b.flat(8).up(15, 12, 13).flat(12, 16);
  jump(b, 16, 5, 14, 12, { rise: -3, lip: 1.6 });
  b.flat(10).hill(2.0, 22).flat(14);
}, { t: 'flip', dir: 'b', n: 1, at: 'last', where: 'off the last jump' }],
['Hop Skip', 'In the air, lean forward drops the nose and lean back lifts it.', function (b) {
  b.flat(24).sign('jump');
  jump(b, 13, 4, 11, 8, { rise: -0.8, lip: 1.6 });
  b.flat(24);
  PC.double(b, 14, 8, 1.6, 18, 7, { next: [2.2, 14], gapAfter: 1.5, face: 26 });
  b.flat(14);
  PC.ledge(b, 3.7, 8);            // the gear sits on a side ledge: lean back at the sign to ride up onto it
  b.flat(10).hill(1.3, 24).flat(14);
  jump(b, 19, 7, 17, 14, { rise: -4, lip: 1.4 });
  b.flat(16);
}, { t: 'combo', seq: ['b', 'f'] }],
['Loop de Dust', 'Loops need speed. Hold the gas all the way round and do not lean.', function (b) {
  b.flat(34).sign('loop').loop(3.6).flat(18);
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(10).ease(24, -4).flat(14).loop(3.9).flat(22);
  b.gearHint({ len: 30 });       // at the foot of the last landing: come in slow
  kick(b, 18, 7, 16, 11, { rise: -2.4, R: 6.5 });
  b.flat(14);
}, { t: 'flip', dir: 'f', n: 1, at: 'last', where: 'off the last jump' }],
['Mesa Drop', 'Two roads. Hold lean back as you pass the fork sign to take the high one over the mesa.', function (b) {
  b.flat(16).up(21, 20, 11).flat(20, 16).drop(3.4).flat(22);
  jump(b, 16, 6, 15, 10, { rise: -1.6 });
  b.flat(14);
  b.fork({ H: 3.4, rampLen: 16, slab1: 10, slot: 6, slab2: 10, stepH: 1.6, kickH: 0.7, exitLen: 16,
    low: function (b) { b.ease(9, -1.6).flat(2); PC.rollers(b, 3, 9, 0.5); b.ease(9, 1.6); } });
  (function () { var f = b.feats.filter(function (q) { return q.t === 'fork'; }).pop(); b.gearAt((f.slot[1] + f.xe) / 2, f.top + 0.95); })();   // on top of the mesa: the high road only
  b.flat(14).hill(2.2, 18).flat(6).surface('sand').flat(12).surface().flat(12).sign('jump');
  kick(b, 17, 6.5, 14, 10, { rise: -2, R: 7 });
  b.flat(12);
}, { t: 'flip', dir: 'f', n: 1, text: 'A frontflip anywhere' }],
['Washboard', 'Rock overhead means slow down. Brake before the hump, or it throws you into the roof.', function (b) {
  b.flat(14).bumps(8, 3.4, 0.26).flat(8).ease(18, -2.5).flat(6);
  b.flat(8).steps(4, 6, 0.7).flat(14).sign('slow').flat(10);
  PC.tunnel(b, 9, 3.6, [[1.1, 10]]);
  b.flat(10);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(8).hill(-1.6, 14).flat(8).bumps(9, 2.8, 0.22).flat(10);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8).table(17, 1.8, 4, 8).flat(8).logs(3, 6, 0.2).flat(10).gearHint({ len: 30, minh: 1.3 });   // mid-air over the last landing
  jump(b, 18, 6, 16, 10, { rise: -2.4, lip: 1.4 });
  b.flat(14);
}, { t: 'nobrake' }],
['Gulch Gap', 'Not every ledge wants speed. Roll off the marked one gently and duck in under the rock.', function (b) {
  b.flat(22);
  jump(b, 16, 6, 14, 9, { rise: -1.4, lip: 1.5 });
  b.flat(14);
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(10);
  kick(b, 17, 7, 15, 10, { rise: -1.6, R: 7.5 });
  b.flat(12).ease(22, -3.5).flat(10).sign('slow').flat(10);
  PC.box(b, 9, 2.4, 3, 6.5, 3.2);
  b.flat(12).gearHint({ len: 32, minh: 1.3 });   // mid-air over the big gap's landing
  jump(b, 20, 10, 18, 11, { rise: -2.2, lip: 1.5 });
  b.flat(14).bumps(4, 4.6, 0.28).flat(12).table(17, 1.9, 5, 8).flat(14);
}, { t: 'flip', dir: 'f', n: 1, at: 'last', where: 'over the big gap' }],
['Canyon Run', 'Hold a lean through a whole jump to flip. Land it and you get a boost. Mind the rock.', function (b) {
  b.flat(18);
  kick(b, 18, 7, 16, 9, { rise: -1.2, R: 6.5 });
  b.flat(8).up(20, 16, 10).flat(14, 14).drop(2.6).flat(16).sign('slow').flat(8);
  PC.tunnel(b, 9, 3.4, [[1.1, 10], [0.9, 9]]);
  b.flat(14).loop(3.8).flat(14);
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(8);
  jump(b, 20, 9, 18, 10, { rise: -1.6 });
  b.flat(8).ease(26, -5).flat(12).sign('slow').flat(8);
  PC.limbo(b, 9, 22, 4.5, 4, 3.2);
  b.flat(10).steps(3, 7, 0.9).flat(12).gearHint({ len: 34, minh: 1.3 });   // mid-air over the last landing
  kick(b, 22, 10, 22, 15, { rise: -5.5, R: 6.5 });
  b.flat(16);
}, { t: 'combo', seq: ['f', 'f'], text: 'Two frontflips in one run' }],

/* ----------------------------- PINEWOOD ----------------------------- */
['Log Jam', 'Logs kick the bike up. Hit them straight and stay loose.', function (b) {
  b.flat(16).logs(3, 6, 0.22).flat(10).hill(2, 18).flat(8).logs(3, 6, 0.22).flat(10).ease(20, -3).flat(10);
  b.gearHint({ len: 16 });        // down in the pit between the jump and the mound: come in slow and drop in
  PC.double(b, 20, 6.5, 1.3, 20, 6, { next: [2, 12], gapAfter: 1, deep: 1.5 });
  b.flat(8).logs(3, 6.5, 0.2).flat(12).table(17, 1.8, 5, 8).flat(8).logs(2, 6, 0.22).flat(10).sign('jump');
  kick(b, 18, 7, 16, 10, { rise: -1.6, R: 6.5 });
  b.flat(14);
}, { t: 'wheelie', sec: 3 }],
['Creek Hop', 'Too slow into a double and you case the second hump. Too fast and you land flat past it.', function (b) {
  b.flat(24);
  jump(b, 16, 6, 14, 7, { rise: -0.6 });
  b.flat(10);
  PC.limbo(b, 9, 22, 4.5, 4, 3.0);
  b.flat(10).hill(2.4, 18).flat(10);
  hop(b, 18, 6, { rise: -0.4 }).flat(9);
  hop(b, 18, 6.5, { rise: -0.4 }).land(14, 7);
  b.flat(8);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8).logs(3, 5, 0.24).flat(10);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(12).gearHint({ len: 34, minh: 1.3 });   // mid-air over the last creek's landing
  kick(b, 20, 9.5, 18, 11, { rise: -2.2, R: 6 });
  b.flat(14);
}, { t: 'flip', dir: 'f', n: 1, at: 'last', where: 'over the last creek' }],
['Root Rage', 'Rollers: skim from the top of one onto the back of the next. Too fast and you fly the lot.', function (b) {
  b.flat(12).bumps(6, 3, 0.3).logs(3, 4.5, 0.24).flat(6).ease(26, -5).flat(10);
  PC.tunnel(b, 9, 3.3, [[1.1, 10], [1.0, 9]]);
  b.flat(8);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(8).logs(4, 4, 0.24).flat(8).up(22, 12, 9).flat(8, 10).down(20, 12, 9).flat(8);
  PC.cavejump(b, 9, 3.4, 16, 4.5);
  b.flat(10).gearHint({ len: 16 });   // in the dip between the jump and the mound
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1, deep: 1.2 });
  b.flat(8).bumps(8, 2.6, 0.26).flat(8).logs(2, 5, 0.25).flat(12).sign('jump');
  jump(b, 19, 8, 17, 11, { rise: -2.2, lip: 1.4 });
  b.flat(14);
}, { t: 'combo', seq: ['b', 'b'], text: 'Two backflips in one run' }],
['Timber Table', 'A dead tree hangs over the last jump. Go under it, not through it.', function (b) {
  b.flat(22).to(20, 6.5).line(2.2).to(0, 1.6).line(7).to(-20, 1.6).line(2.2).to(0, 8).flat(14);
  b.kicker(20, 8, 1.2).gap(4.5, { rise: 1.0 }).flat(14);               // step-up over water
  b.drop(2.2).flat(12);
  PC.ledge(b, 3.8, 8);            // the gear sits on a side ledge: lean back at the sign to ride up onto it
  b.flat(10);
  PC.rollers(b, 3, 6.5, 1.1, 2);
  b.flat(10).to(22, 6.5).line(3.4).to(0, 1.6).line(6).to(-22, 1.6).line(3.4).to(0, 8).flat(12);
  b.kicker(22, 8, 1.2).gap(4.5, { rise: 1.2 }).flat(12).down(18, 12, 9).flat(12);
  jump(b, 18, 7, 16, 10, { rise: -1.8, lip: 1.4 });
  b.flat(10).sign('slow').flat(10);
  PC.limbo(b, 9, 22, 4.5, 4, 3.2);
  b.flat(14);
}, { t: 'nobrake' }],
['Mossy Loop', 'Loops need speed. Hold the gas all the way round and do not lean.', function (b) {
  b.flat(34).loop(4.1).flat(14);
  kick(b, 18, 8, 16, 9, { rise: -1, R: 6 });
  b.flat(10);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8).logs(3, 5, 0.24).flat(6).ease(24, -4.5).flat(14).loop(4.4).flat(8).logs(2, 5, 0.24).flat(6)
   .table(20, 2.4, 5, 8).flat(12).gearHint({ len: 32, minh: 1.3 });   // mid-air over the last landing: come in slow
  jump(b, 20, 9, 18, 11, { rise: -2.4, lip: 1.4 });
  b.flat(14);
}, { t: 'flip', dir: 'b', n: 1, at: 'last', where: 'off the last jump' }],
['Sawmill', 'Two roads. Hold lean back as you pass the fork sign to ride the high road over the mill.', function (b) {
  b.flat(14).steps(5, 5.5, 0.85).flat(18).sign('slow').flat(10);
  PC.tunnel(b, 9, 3.4, [[1.1, 10]]);
  b.flat(14);
  b.fork({ H: 3.4, rampLen: 16, slab1: 10, slot: 6, slab2: 10, stepH: 1.6, kickH: 0.7, exitLen: 16,
    low: function (b) { b.ease(9, -1.6).flat(2); PC.rollers(b, 3, 9, 0.5); b.ease(9, 1.6); } });
  (function () { var f = b.feats.filter(function (q) { return q.t === 'fork'; }).pop(); b.gearAt((f.slot[1] + f.xe) / 2, f.top + 0.95); })();   // on top of the mill: the high road only
  b.flat(14).surface('wood').flat(12);
  b.kicker(19, 7, 0.6).gap(7, { rise: -1.2 }).surface().land(16, 9);
  b.flat(8);
  PC.rollers(b, 3, 6, 1.0, 2);
  b.flat(8).logs(3, 5.5, 0.22).flat(10).sign('slow').flat(8);
  PC.limbo(b, 9, 22, 4.5, 4, 3.0);
  b.flat(10).up(24, 12, 10).flat(10, 13).drop(3).flat(18);
}, { t: 'flip', dir: 'b', n: 1, text: 'A backflip anywhere' }],
['Beaver Dam', 'A big gap over the dam. Plenty of air for a double flip, if you dare.', function (b) {
  b.flat(16).ease(30, -6).flat(8);
  jump(b, 21, 13, 19, 12, { rise: -1.8 });
  b.flat(10).logs(3, 5, 0.24).flat(6).up(20, 14, 10).flat(10, 12).down(22, 16, 10).flat(8);
  PC.tunnel(b, 9, 3.2, [[1.1, 10], [-0.9, 9], [1.1, 10]]);
  b.flat(10).gearHint({ len: 22, minh: 1.3 });   // high over the double: only a slow rider's arc goes up there
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(10).ease(20, -2.5).flat(10);
  kick(b, 21, 11, 20, 12, { rise: -2.0, R: 6.5 });
  b.flat(12);
  PC.limbo(b, 9, 22, 4.5, 4, 3.0);
  b.flat(8);
  PC.rollers(b, 3, 6, 1.0, 2);
  b.flat(6);
  hop(b, 19, 6, { rise: -0.5 }).flat(8);
  hop(b, 19, 6.5, { rise: -0.5 }).land(16, 8);
  b.flat(14);
}, { t: 'flip', dir: 'b', n: 1, at: 'biggest', where: 'over the dam' }],
['Old Growth', 'Everything Pinewood has, in one run. Pick your speed for each piece.', function (b) {
  b.flat(20).logs(3, 5, 0.24).flat(8).table(20, 2.4, 6, 8).flat(10);
  PC.limbo(b, 9, 25, 4.5, 4, 3.1);
  b.flat(14);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(10).loop(4).flat(12).up(24, 14, 9).flat(8, 9).drop(2.6).flat(12);
  PC.tunnel(b, 9, 3.2, [[1.1, 10], [1.1, 9]]);
  b.flat(4).ease(28, -6).flat(6).gearHint({ len: 36, minh: 1.3 });   // mid-air over the big gap's landing
  jump(b, 22, 13, 20, 12, { rise: -2 });
  b.flat(12);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(6);
  b.kicker(21, 8).gap(4.5, { rise: 1.1 }).flat(10).drop(2).flat(10);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(8);
  PC.cavejump(b, 9, 3.2, 14, 4);
  b.flat(14);
}, { t: 'combo', seq: ['f', 'b', 'f'], text: 'Frontflip, backflip, frontflip, in one run' }],

/* ----------------------------- RACEWAY ------------------------------ */
['Green Flag', 'Yellow arrows on the road are boost strips. Ride over them with the gas open. There is a bus to clear at the end.', function (b) {
  b.flat(18).kerb(6).flat(8).boost(6).flat(22).table(12, 1.4, 7, 10).flat(14);
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(12);
  PC.rollers(b, 3, 6, 1.0, 2);
  b.flat(10).ease(24, -3).flat(8).kerb(5).flat(6).boost(6).flat(16).hill(1.6, 20).flat(10);
  b.flat(10).gearHint({ len: 30, minh: 1.3 });   // mid-air over the bus landing: only a slow arc goes there
  ramp(b, 16, 9, 1.4); b.buses(2, { rise: -1.4 }).land(14, 10).flat(18);
}, { t: 'wheelie', sec: 2.5 }],
['Rumble Strip', 'Kerbs shake the bike. Stay loose and keep the gas on.', function (b) {
  b.flat(14).kerb(10).flat(6).bumps(4, 4.4, 0.26).flat(8).kerb(8).flat(6);
  ramp(b, 14, 8, 1.2); b.land(12, 4.3).flat(12);
  ramp(b, 14, 8, 1.2); b.land(12, 4.3).flat(22);
  b.gearHint({ len: 16 });        // down in the pit between the jump and the mound
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1, deep: 1.6 });
  b.flat(8);
  ramp(b, 16, 8, 1.2); b.land(14, 5).flat(10).logs(3, 6, 0.2).flat(8).ease(22, -3.5).flat(6).kerb(8).flat(6).boost(6).flat(10)
   .table(18, 2.0, 5, 8).flat(8).logs(2, 6, 0.2).flat(12);
  ramp(b, 18, 8, 1.4); b.buses(2, { rise: -2.2 }).land(16, 10).flat(14);
}, { t: 'flip', dir: 'f', n: 1, at: 'last', where: 'over the buses' }],
['Oil Slick', 'Oil is as slippery as ice. Get your speed first, then coast across it. And a boost strip is not always your friend.', function (b) {
  b.flat(20).oil(8).flat(10).hill(1.6, 18).flat(6).oil(8).flat(4).ease(20, -2.5).flat(10).boost(6).flat(10).sign('slow').flat(10);
  PC.tunnel(b, 9, 3.4, [[1.1, 10]]);
  b.flat(4).oil(10).flat(10);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(10);
  ramp(b, 16, 9, 1.4); b.buses(2, { rise: -0.9 }).land(14, 9).flat(8).oil(8).flat(10).waves(2, 18, 1.0).flat(6).oil(6).flat(10);
  PC.ledge(b, 3.8, 8);            // the gear sits on a side ledge: lean back at the sign to ride up onto it
  b.flat(8).table(16, 1.7, 6, 9).flat(14);
}, { t: 'combo', seq: ['b', 'f'] }],
['Bus Stop', 'Clear the buses, but not by too much. The gantries are lower than they look.', function (b) {
  b.flat(22);
  ramp(b, 15, 9, 1.5); b.buses(1, { rise: -0.6 }).land(13, 8).flat(14).boost(6).flat(10).sign('slow').flat(10);
  gantry(b, 9, 22, 1, 4, 3.0);
  b.flat(14);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(10).kerb(6).flat(8).hill(1.8, 18).flat(10);
  gantry(b, 9, 22, 1, 4, 3.0);
  b.flat(10);
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(8).boost(7).flat(10).gearHint({ len: 34, minh: 1.3 });   // mid-air over the last landing
  ramp(b, 18, 9, 1.4); b.buses(3, { rise: -1.4 }).land(17, 11).flat(18);
}, { t: 'combo', seq: ['f', 'f'], text: 'Two frontflips in one run' }],
['Pit Lane', 'Two roads. Hold lean back at the fork sign to take the flyover; ride on for the pit lane underneath.', function (b) {
  b.flat(14).steps(3, 7, 0.8).flat(8).logs(3, 5.5, 0.22).flat(8).oil(7).flat(8);
  PC.tunnel(b, 9, 3.2, [[1.1, 10], [1.0, 9]]);
  b.flat(14);
  b.fork({ H: 3.4, rampLen: 16, slab1: 10, slot: 6, slab2: 10, stepH: 1.6, kickH: 0.7, exitLen: 16,
    low: function (b) { b.ease(9, -1.6).kerb(2); PC.rollers(b, 3, 9, 0.5); b.ease(9, 1.6); } });   // stays low until past the second slab
  (function () { var f = b.feats.filter(function (q) { return q.t === 'fork'; }).pop(); b.gearAt((f.slot[1] + f.xe) / 2, f.top + 0.95); })();   // on the flyover: the high road only
  b.flat(12);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8).kerb(8).flat(4).boost(6).flat(8);
  b.surface('steel').kicker(18, 6.5, 0).surface(); b.buses(2, { rise: -1 }).land(16, 9);
  b.flat(6).boost(6).flat(12);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(8).oil(6).flat(8);
  ramp(b, 19, 8, 1.2); b.buses(2, { rise: -1.1 }).land(17, 9).flat(14);
}, { t: 'flip', dir: 'f', n: 1, text: 'A frontflip anywhere' }],
['Seven Buses', 'Slow for the gantry and the underpass, then everything you have got for the big one.', function (b) {
  b.flat(16).kerb(6).flat(8).table(16, 1.8, 6, 9).flat(14);
  gantry(b, 9, 25, 1, 4, 3.1);
  b.flat(10).oil(6).flat(8).hill(2, 18).flat(8);
  PC.tunnel(b, 9, 3.2, [[1.1, 10], [1.1, 10]]);
  b.flat(10);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(8).gearHint({ len: 16 });   // down in the pit between the jump and the mound
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1, deep: 1.4 });
  b.flat(6).boost(8).flat(14).down(14, 30, 16).flat(6, 14).boost(9).flat(8);
  ramp(b, 21, 10, 1.6); b.buses(7, { rise: -4.6 }).land(22, 15, 10).flat(24);
}, { t: 'flip', dir: 'b', n: 1, at: 'biggest', where: 'over the seven buses' }],
['Stunt Show', 'A boost strip straight into a loop. Hold the gas all the way round. Then stop holding it.', function (b) {
  b.flat(20).boost(7).flat(14).loop(4.6).flat(20);
  gantry(b, 9, 22, 1, 4, 3.0);
  b.flat(10).gearHint({ len: 16 });   // down in the pit between the jump and the mound
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1, deep: 1.6 });
  b.flat(4).kerb(6).flat(4).boost(6).flat(8).loop(4.0).flat(6).loop(4.0).flat(12);
  PC.tunnel(b, 9, 3.2, [[1.1, 10], [-1.0, 10], [1.1, 10]]);
  b.flat(10);
  PC.rollers(b, 3, 6, 1.0, 2);
  b.flat(8);
  ramp(b, 19, 8, 1.2); b.buses(3, { rise: -2.8 }).land(18, 12).flat(10);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(16);
}, { t: 'flip', dir: 'b', n: 1, at: 'biggest', where: 'over the buses' }],
['Chequered Flag', 'Every trick Raceway knows, one after another. Last bus jump wins it.', function (b) {
  b.flat(18).boost(7).flat(12).loop(4.4).flat(18);
  gantry(b, 9, 25, 1, 4, 3.1);
  b.flat(8).oil(8).flat(10);
  PC.tunnel(b, 9, 3.2, [[1.1, 10], [-1.0, 10], [1.1, 10]]);
  b.flat(10);
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(6).boost(7).flat(10);
  gantry(b, 10, 28, 2, 6, 3.8, { rise: -0.9, landLen: 9 });
  b.flat(4).kerb(6).flat(14);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(10);
  PC.cavejump(b, 9, 3.2, 14, 4);
  b.flat(8);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(4).boost(7).flat(8).gearHint({ len: 34, minh: 1.3 });   // mid-air over the last bus landing
  ramp(b, 20, 9, 1.3); b.buses(4, { rise: -2 }).land(18, 11).flat(16);
}, { t: 'combo', seq: ['b', 'b', 'b'], text: 'Three backflips in one run' }],

/* ----------------------------- FROSTBITE ---------------------------- */
['Black Ice', 'Blue ice has no grip. Build your speed before you reach it.', function (b) {
  b.flat(20).surface('ice').flat(18).surface().hill(1.6, 18).flat(10);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(6).surface('ice').flat(10).ease(20, -2.5).flat(8).surface().flat(10);
  b.gearHint({ len: 16 });        // down in the pit between the jump and the mound
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1, deep: 1.4 });
  b.flat(8).surface('ice').flat(16).surface().table(15, 1.6, 6, 9).flat(8)
   .surface('ice').flat(10).surface().flat(6).sign('jump');
  jump(b, 17, 6, 15, 11, { rise: -2.2, lip: 1.4 });
  b.flat(14);
}, { t: 'flip', dir: 'b', n: 1, at: 'last', where: 'off the last jump' }],
['Glacier Loop', 'Ice before a loop: carry your speed in, you cannot build it on the ice.', function (b) {
  b.flat(36).loop(4).surface('ice').flat(16).surface().flat(10);
  kick(b, 18, 7, 16, 9, { rise: -1, R: 6 });
  b.flat(10);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(10).ease(24, -4.5).flat(10).surface('ice').flat(8).surface().loop(4.5).flat(10).gearHint({ len: 42, minh: 2, below: false });   // high over the double: a slower rider's arc goes up there
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8);
  kick(b, 19, 9, 17, 12, { rise: -2.2, R: 6 });
  b.surface('ice').flat(14).surface().flat(8);
  hop(b, 18, 6, { rise: -0.4 }).flat(9);
  hop(b, 18, 6, { rise: -0.4 }).land(15, 8);
  b.flat(12);
}, { t: 'wheelie', sec: 2 }],
['Slip Road', 'You cannot brake on ice. Lose the speed before you reach it.', function (b) {
  b.flat(18).surface('ice').down(12, 22, 16).flat(10).surface();
  jump(b, 18, 8, 16, 11, { rise: -2 });
  b.flat(10).up(16, 14, 12).flat(8, 14).sign('slow').flat(8);
  b.slow(6).flat(4).surface('ice').down(10, 14, 14).flat(4, 12); PC.cave(b, 3.4, [[1.1, 10]]); b.surface().go();
  b.flat(12);
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(8).hill(2.2, 16).surface('ice').flat(14).surface().flat(10);
  PC.ledge(b, 3.8, 8);            // the gear sits on a side ledge: lean back at the sign to ride up onto it
  b.flat(8);
  kick(b, 19, 9, 17, 10, { rise: -1.2, R: 6.5 });
  b.surface('ice').flat(12).surface().flat(10);
}, { t: 'combo', seq: ['f', 'f'], text: 'Two frontflips in one run' }],
['Whiteout', 'Rollers on snow. Find the speed that skims them; too fast and you fly the lot.', function (b) {
  b.flat(12).bumps(6, 3.2, 0.3).flat(6).surface('ice').flat(8).surface().steps(4, 6, 0.9).flat(10).sign('slow').flat(8);
  PC.limbo(b, 9, 22, 4.5, 4, 3.0);
  b.flat(10);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(8).logs(2, 6, 0.22).flat(10).up(22, 12, 10).flat(10, 13).drop(2.8).flat(10).surface('ice').flat(12).surface().flat(8);
  PC.tunnel(b, 9, 3.2, [[1.1, 10], [1.0, 9]]);
  b.flat(8).gearHint({ len: 16 });   // down in the pit between the jump and the mound
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1, deep: 1.6 });
  b.flat(6).bumps(7, 2.8, 0.22).flat(12);
  kick(b, 20, 9, 18, 10, { rise: -1.4, R: 6 });
  b.flat(10).surface('ice').flat(8).surface().flat(4);
  kick(b, 20, 9, 18, 12, { rise: -2.6, R: 6 });
  b.flat(14);
}, { t: 'flip', dir: 'f', n: 1, at: 'last', where: 'off the last jump' }],
['Aurora', 'Low ice caves: slow right down before you go in, because you will not stop on the ice inside.', function (b) {
  b.flat(18).surface('ice').flat(10).surface().table(20, 2.4, 6, 8).flat(8);
  kick(b, 19, 9, 17, 10, { rise: -1.2, R: 6 });
  b.flat(12);
  PC.tunnel(b, 9, 3.2, [[1.1, 10]]);
  b.flat(12);
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(10).loop(4.2).flat(12).surface('ice').flat(10).surface().flat(10);
  PC.limbo(b, 9, 22, 4.5, 4, 3.0);
  b.flat(8).ease(26, -5).flat(6).gearHint({ len: 36, minh: 1.3 });   // mid-air over the big gap's landing
  jump(b, 21, 12.5, 19, 11, { rise: -1.8 });
  b.flat(8);
  b.slow(6).flat(4).surface('ice').flat(12); PC.cave(b, 3.2, [[1.1, 10]]); b.surface().go();
  b.flat(10);
  PC.rollers(b, 3, 6, 1.0, 2);
  b.flat(8);
  hop(b, 18, 6, { rise: -0.4 }).flat(9);
  hop(b, 18, 6.5, { rise: -0.4 }).land(15, 8);
  b.flat(14);
}, { t: 'flip', dir: 'b', n: 1, at: 'biggest', where: 'over the big gap' }],
['Powder Keg', 'Short, steep and lumpy. Pick a speed for each piece, not one for the whole track.', function (b) {
  b.flat(14).waves(3, 16, 1.1).flat(8);
  kick(b, 18, 6.5, 16, 8, { rise: -0.8, R: 6.5 });
  b.flat(10);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8).bumps(5, 3.6, 0.34).flat(8).ease(24, -4).flat(10);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(8).table(20, 2.4, 6, 8).flat(8).gearHint({ len: 34, minh: 1.3 });   // mid-air over the landing
  jump(b, 20, 8.5, 18, 11, { rise: -2.2 });
  b.flat(6).logs(3, 5, 0.25).flat(8);
  PC.cavejump(b, 9, 3.4, 16, 4.5);
  b.flat(10);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(8);
  kick(b, 19, 7.5, 17, 9, { rise: -1, R: 6 });
  b.flat(14);
}, { t: 'flip', dir: 'f', n: 1, at: 'biggest', where: 'over the big gap' }],
['Crevasse', 'Two roads. Hold lean back at the fork sign for the ice bridge; ride on for the floor of the crevasse.', function (b) {
  b.flat(22);
  jump(b, 18, 7, 16, 8, { rise: -0.8 });
  b.surface('ice').flat(12).surface().flat(10);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(14);
  b.fork({ H: 3.4, rampLen: 16, slab1: 10, slot: 6, slab2: 10, stepH: 1.6, kickH: 0.7, exitLen: 16,
    low: function (b) { b.ease(9, -1.6).flat(2); PC.rollers(b, 3, 9, 0.5); b.ease(9, 1.6); } });
  (function () { var f = b.feats.filter(function (q) { return q.t === 'fork'; }).pop(); b.gearAt((f.slot[1] + f.xe) / 2, f.top + 0.95); })();   // on the ice bridge: the high road only
  b.flat(12);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8).ease(24, -4.5).surface('ice').flat(10).surface();
  jump(b, 21, 12, 19, 11, { rise: -1.6 });
  b.flat(12);
  PC.limbo(b, 9, 25, 4.5, 4, 3.1);
  b.flat(10);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(8);
  b.kicker(20, 8).gap(4.5, { rise: 0.9 }).flat(12).drop(1.8).flat(14);
}, { t: 'flip', dir: 'f', n: 1, text: 'A frontflip anywhere' }],
['Avalanche', 'It is all downhill, so lifting is not enough. Use the brake.', function (b) {
  b.flat(12).down(16, 26, 14).flat(6, 10);
  jump(b, 14, 10, 20, 12, { rise: -2.5 });
  b.down(14, 20, 12).flat(8, 12);
  PC.tunnel(b, 9, 3.2, [[1.1, 10], [1.0, 9]]);
  b.flat(8);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(6).surface('ice').flat(8).surface().flat(6);
  kick(b, 16, 12, 22, 13, { rise: -3, R: 7 });
  b.flat(8).down(18, 22, 12).flat(8, 10);
  PC.limbo(b, 9, 25, 4.5, 4, 3.1);
  b.flat(10).gearHint({ len: 16 });   // down in the pit between the jump and the mound
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1, deep: 1.4 });
  b.flat(6).down(14, 16, 12).flat(6, 10);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(8);
  jump(b, 15, 13, 22, 14, { rise: -3.5 });
  b.flat(8);
  b.slow(6).flat(4).surface('ice').flat(10); PC.cave(b, 3.2, [[1.1, 10]]); b.surface().go();
  b.flat(14);
}, { t: 'combo', seq: ['b', 'b', 'b'], text: 'Three backflips on the way down' }],

/* ---------------------------- CINDER PEAK --------------------------- */
['Hot Start', 'Lava ends the run. Jump too short and that is where you land.', function (b) {
  b.flat(22);
  kick(b, 17, 6.5, 15, 8, { rise: -0.8, R: 7 });
  b.flat(10);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8).hill(2.0, 18).flat(12);
  jump(b, 18, 7, 16, 10, { rise: -1, lip: 1.5 });
  b.flat(8);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(10).gearHint({ len: 16 });   // down in the pit between the jump and the mound
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1, deep: 1.4 });
  b.flat(10);
  jump(b, 19, 8.5, 17, 12, { rise: -2.2, lip: 1.4 });
  b.flat(10).table(20, 2.4, 5, 8).flat(14);
}, { t: 'wheelie', sec: 3 }],
['Caldera', 'Two roads. Hold lean back at the fork sign to ride the crater rim; ride on to cross the crater floor.', function (b) {
  b.flat(16).down(24, 22, 12).flat(12, 12).up(24, 22, 12).flat(12, 14);
  b.drop(2).flat(18);
  kick(b, 21, 8.5, 18, 10, { rise: -1.2, R: 5.5 });
  b.flat(14);
  b.fork({ H: 3.4, rampLen: 16, slab1: 10, slot: 6, slab2: 10, stepH: 1.6, kickH: 0.7, exitLen: 16,
    low: function (b) { b.ease(9, -1.6).flat(2); PC.rollers(b, 3, 9, 0.7); b.ease(9, 1.6); } });
  (function () { var f = b.feats.filter(function (q) { return q.t === 'fork'; }).pop(); b.gearAt((f.slot[1] + f.xe) / 2, f.top + 0.95); })();   // on the rim: the high road only
  b.flat(24);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8);
  hop(b, 18, 6, { rise: -0.4 }).flat(8);
  hop(b, 18, 6, { rise: -0.4 }).land(15, 8);
  b.flat(8).down(26, 20, 12).flat(10, 10).hill(1.4, 14).flat(8);
  PC.rollers(b, 3, 6, 1.0, 2);
  b.flat(6).up(26, 20, 11).flat(10, 12);
  b.gap(5, { rise: -2.4 }).land(18, 11);
  b.flat(16);
}, { t: 'flip', dir: 'b', n: 1, text: 'A backflip anywhere' }],
['Magma Hop', 'Stalactites hang over some jumps. Clear the lava, not the ceiling.', function (b) {
  b.flat(24);
  hop(b, 17, 5.5, { rise: -0.3 }).flat(8);
  hop(b, 17, 5.5, { rise: -0.3 }).flat(8);
  hop(b, 18, 6, { rise: -0.3 }).flat(8);
  hop(b, 18, 6.5, { rise: -0.4 }).land(14, 7);
  b.flat(10).hill(2, 16).flat(8).sign('slow').flat(8);
  PC.limbo(b, 9, 22, 4.5, 4, 3.2);
  b.flat(10);
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(10);
  PC.ledge(b, 3.8, 8);            // the gear sits on a side ledge: lean back at the sign to ride up onto it
  b.flat(10);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(10);
  hop(b, 19, 7, { rise: -0.4 }).flat(9);
  hop(b, 19, 7.5, { rise: -0.5 }).land(16, 8);
  b.flat(8);
  jump(b, 19, 8, 17, 12, { rise: -2.4, lip: 1.4 });
  b.flat(14);
}, { t: 'combo', seq: ['b', 'f'] }],
['The Chimney', 'Low rock roofs. Brake before a hump or you will hit your head.', function (b) {
  b.flat(18).slow(9).roofStart(3.4).flat(10).bumps(4, 4.4, 0.3).flat(10).hill(1.1, 12).flat(10).ease(18, -2).flat(8)
   .roofEnd().go().flat(10);
  kick(b, 18, 8, 16, 9, { rise: -1, R: 6 });
  b.flat(10).gearHint({ len: 40, minh: 2, below: false });   // high over the double: a slower rider's arc goes up there
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8).slow(9).roofStart(3.3).flat(8).ease(16, 2).flat(8).hill(1.3, 12).flat(8).hill(-1.2, 12).flat(8).hill(1.0, 10).flat(10)
   .roofEnd().go().flat(12);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(10);
  kick(b, 20, 9, 18, 12, { rise: -2.4, R: 5.5 });
  b.flat(14);
}, { t: 'flip', dir: 'f', n: 1, at: 'last', where: 'out of the chimney' }],
['Fire Walk', 'Doubles over lava country. Too slow cases the second hump; too fast lands you flat.', function (b) {
  b.flat(14).ease(30, -6.5).flat(6);
  jump(b, 22, 15, 20, 12, { rise: -2.4 });
  b.flat(10);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8).slow(9).roofStart(3.4).flat(8).bumps(6, 3.4, 0.28).flat(8).hill(1.1, 12).flat(10).roofEnd().go().flat(6);
  hop(b, 19, 7, { rise: -0.4 }).flat(10.5);
  hop(b, 19, 7, { rise: -0.4 }).flat(10.5);
  b.kicker(20, 5.5, 0).gap(8, { rise: -0.6 }).land(16, 9);
  b.flat(10).gearHint({ len: 16 });   // down in the pit between the jump and the mound
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1, deep: 1.4 });
  b.flat(8);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(7);
  PC.limbo(b, 9, 25, 4.5, 4, 3.1);
  b.flat(8);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(8);
  PC.tunnel(b, 9, 3.2, [[1.1, 10], [-1.0, 10], [1.1, 10]]);
  b.flat(14);
}, { t: 'flip', dir: 'b', n: 1, at: 'biggest', where: 'over the big lava gap' }],
['Ash Loop', 'Loops, doubles and a roof. Full gas only where it pays.', function (b) {
  b.flat(34).loop(4.2).flat(10);
  kick(b, 18, 8, 16, 9, { rise: -1, R: 6 });
  b.flat(14);
  PC.rollers(b, 3, 6.5, 1.1, 2);
  b.flat(10);
  PC.tunnel(b, 9, 3.2, [[1.1, 10]]);
  b.flat(9).loop(3.8).flat(6).loop(3.8).flat(14);
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(8).ease(24, -4.5).flat(6).gearHint({ len: 36, minh: 1.3 });   // mid-air over the big gap's landing
  jump(b, 21, 12, 19, 11, { rise: -1.8 });
  b.flat(14);
  PC.cavejump(b, 9, 3.4, 16, 4.5);
  b.flat(10);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(8);
  hop(b, 18, 6, { rise: -0.4 }).flat(9);
  hop(b, 18, 6.5, { rise: -0.4 }).land(15, 8);
  b.flat(14);
}, { t: 'combo', seq: ['f', 'f'], text: 'Two frontflips in one run' }],
['Ember Steps', 'Step-ups over lava: they want speed. The roofs after them do not.', function (b) {
  b.flat(20);
  b.kicker(20, 8).gap(4, { rise: 0.8 }).flat(12);
  b.kicker(21, 8).gap(4.5, { rise: 1.0 }).flat(12);
  b.kicker(22, 8).gap(4.5, { rise: 1.2 }).flat(12);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(10);
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1 });
  b.flat(6).steps(3, 6, 1.1).flat(14);
  PC.tunnel(b, 9, 3.2, [[1.1, 10], [1.1, 10]]);
  b.flat(16).gearHint({ len: 16 });   // down in the pit between the jump and the mound
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1, deep: 1.4 });
  b.flat(8);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(8);
  kick(b, 20, 9, 18, 12, { rise: -2.4, R: 6 });
  b.flat(10);
  PC.limbo(b, 9, 25, 4.5, 4, 3.1);
  b.flat(8);
  PC.cavejump(b, 9, 3.2, 14, 4);
  b.flat(14);
}, { t: 'flip', dir: 'f', n: 1, at: 'biggest', where: 'over the big gap' }],
['Eruption', 'The whole mountain at once. Every piece wants its own speed.', function (b) {
  b.flat(18);
  b.kicker(21, 8).gap(4.5, { rise: 1.0 }).flat(12).kicker(21, 8).gap(4.5, { rise: 1.1 }).flat(12);
  PC.tunnel(b, 9, 3.2, [[1.1, 10], [-1.0, 10], [1.1, 10]]);
  b.flat(10);
  PC.double(b, 14, 8, 1.8, 20, 6, { next: [2.6, 14], gapAfter: 1 });
  b.flat(9).loop(4).flat(12).drop(2.6).flat(8).ease(26, -5).flat(6);
  jump(b, 22, 13.5, 20, 12, { rise: -2 });
  b.flat(8);
  PC.box(b, 8, 3, 3, 7, 3.2);
  b.flat(10);
  PC.rollers(b, 4, 6, 1.0, 2);
  b.flat(8).gearHint({ len: 16 });   // down in the pit between the jump and the mound
  PC.double(b, 22, 6.5, 1.2, 20, 6, { next: [2, 12], gapAfter: 1, deep: 1.6 });
  b.flat(8);
  hop(b, 18, 6.5, { rise: -0.4 }).flat(8);
  hop(b, 18, 6.5, { rise: -0.4 }).land(15, 8);
  b.flat(8);
  PC.limbo(b, 9, 25, 4.5, 4, 3.1);
  b.flat(7);
  PC.cavejump(b, 9, 3.2, 14, 4);
  b.flat(7);
  kick(b, 21, 9, 19, 12, { rise: -2.2, R: 5.5 });
  b.flat(14);
}, { t: 'combo', seq: ['b', 'f', 'b'], text: 'Backflip, frontflip, backflip, in one run' }],

/* ----------------------------- LOW ORBIT ---------------------------- */
/* Low gravity: landing flat costs almost nothing, so the doubles and rollers that teach speed elsewhere do not bite
   here (tools/momentum.js: flat out is quickest on every shape tried). Low Orbit is about air instead. */
['One Small Hop', 'A third of the gravity. Jumps go three times as far and flips come easy.', function (b) {
  b.flat(22).hill(1.4, 26).flat(14).table(14, 1.8, 9, 12).flat(20).gearHint({ len: 40, minh: 1.3 });   // mid-air over the landing: come in slow
  jump(b, 15, 12, 12, 14, { rise: -1, lip: 2 });
  b.flat(18).hill(-1.6, 34).flat(14).table(17, 2.6, 9, 12).flat(22);
}, { t: 'multi', n: 2, text: 'A double flip in one jump' }],
['Crater Maker', 'Low gravity means a small hump throws you a long way up. Go gently under anything.', function (b) {
  b.flat(16).hill(-2, 40).flat(12).hill(-2.8, 48).flat(14);
  jump(b, 20, 20, 16, 14, { rise: -1.5 });
  b.flat(20).sign('slow').flat(12);
  PC.tunnel(b, 8, 3.6, [[1.0, 12]]);
  b.flat(14).gearHint({ len: 22 });   // down in the crater between the jump and the mound
  PC.double(b, 14, 10, 1.8, 20, 10, { next: [2.6, 20], gapAfter: 1, deep: 2.2 });
  b.flat(10).hill(-2.2, 40).flat(10).up(20, 14, 14).flat(10, 16).drop(4).flat(26);
}, { t: 'combo', seq: ['b', 'f'] }],
['Slow Float', 'Things float up here, and so do you. Small jumps under the pylons.', function (b) {
  b.flat(34).sign('slow').flat(10);
  PC.cavejump(b, 8, 4.0, 12, 8);
  b.flat(16);
  jump(b, 20, 22, 17, 16, { rise: -2 });
  b.flat(14).table(20, 3.4, 9, 12).flat(18);
  PC.ledge(b, 4.0, 10, { at: 0.1 });   // the gear sits at the top of a side ledge's ramp: lean back at the sign to ride up there
  b.flat(12).sign('slow').flat(10);
  PC.limbo(b, 8, 14, 7, 8, 3.3, { land: 10, landLen: 10 });
  b.flat(16);
  jump(b, 22, 25, 19, 18, { rise: -3 });
  b.flat(22);
}, { t: 'combo', seq: ['f', 'f', 'f'], text: 'Three frontflips in one run' }],
['Dark Side', 'No light, no air, no grip to spare. Lean through the big jumps for the flips.', function (b) {
  b.flat(18).bumps(5, 5.5, 0.3).flat(22);
  PC.box(b, 7, 2.6, 0, 9, 3.1);
  b.flat(8).up(22, 16, 13).flat(8, 16).drop(5).flat(30).gearHint({ len: 44, minh: 1.5 });   // mid-air over the landing: come in slow
  jump(b, 18, 16, 16, 14, { rise: -1.5 });
  b.flat(18);
  PC.tunnel(b, 8, 3.6, [[1.0, 12], [0.8, 12]]);
  b.flat(6).drop(3).flat(26);
  PC.cavejump(b, 8, 4.2, 14, 8);
  b.flat(12);
  kick(b, 20, 20, 19, 18, { rise: -3, R: 8 });
  b.flat(20);
}, { t: 'combo', seq: ['f', 'b', 'f', 'b'], text: 'Frontflip, backflip, frontflip, backflip' }],
['Double Loop', 'Two giant loops, then the longest jump yet. Lean the whole way across.', function (b) {
  b.flat(40).loop(6.5).flat(22).loop(7.5).flat(20).gearHint({ len: 50 });   // at the near end of the landing: only a short jump comes down there
  jump(b, 21, 22, 18, 16, { rise: -2 });
  b.flat(20).loop(5.5).flat(22);
}, { t: 'multi', n: 3, text: 'A triple flip in one jump' }],
['Regolith', 'Two roads. Hold lean back at the fork sign for the high road; ride on for the dust below.', function (b) {
  b.flat(14).surface('sand').flat(16).surface().bumps(6, 4.5, 0.4).flat(10).hill(-4, 30).flat(10);
  PC.tunnel(b, 8, 3.6, [[1.0, 12], [0.8, 12]]);
  b.flat(4).surface('sand').flat(12).surface().flat(6);
  jump(b, 20, 18, 17, 14, { rise: -1.5 });
  b.flat(20);
  b.fork({ one: true, H: 3.6, rampLen: 18, slab1: 28, kickH: 0, exitLen: 20,
    low: function (b) { b.ease(10, -1.8).flat(2); PC.rollers(b, 3, 11, 0.45); b.ease(10, 1.8); } });
  (function () { var f = b.feats.filter(function (q) { return q.t === 'fork'; }).pop(); b.gearAt(f.a0 + 1, f.top + 1.0); })();   // at the top of the ramp: the high road only (in this gravity the ramp throws you clean over the slab)
  b.flat(20);
  PC.box(b, 7, 2.6, 0, 9, 3.1);
  b.flat(4).surface('sand').flat(12).surface().flat(10);
  PC.cavejump(b, 8, 4.0, 12, 8);
  b.flat(14);
  jump(b, 20, 18, 17, 14, { rise: -2 });
  b.flat(16);
}, { t: 'multi', n: 2, at: 'biggest', text: 'A double flip over the big gap' }],
['Escape Velocity', 'Downhill into the biggest gaps in the game. Hold your nerve, and your lean.', function (b) {
  b.flat(14).down(18, 30, 16).flat(8, 12).gearHint({ dx: 10, len: 50 });   // at the near end of the first landing: only a short jump comes down there
  jump(b, 23, 33, 21, 24, { rise: -5 });
  b.flat(16);
  PC.tunnel(b, 8, 3.4, [[1.0, 14], [0.8, 12]]);
  b.flat(6).up(20, 16, 14).flat(8, 16).down(22, 30, 13).flat(20, 12);
  jump(b, 24, 27, 23, 30, { rise: -6 });
  b.flat(30);
  PC.tunnel(b, 8, 3.6, [[1.0, 12]]);
  b.flat(18);
}, { t: 'multi', n: 3, at: 'biggest', text: 'A triple flip over the biggest gap' }],
['Riot Run', 'The last track. Everything you have learned, at a third of the gravity.', function (b) {
  b.flat(26).loop(6).flat(16);
  jump(b, 21, 22, 18, 16, { rise: -2 });
  b.flat(18);
  PC.tunnel(b, 8, 3.4, [[1.0, 14], [0.8, 12]]);
  b.flat(26);
  PC.box(b, 7, 3, 0, 9, 3.3);
  b.flat(14).loop(7).flat(12).down(18, 28, 14).flat(12, 12);
  jump(b, 23, 33, 21, 24, { rise: -5 });
  b.flat(26);
  PC.cavejump(b, 8, 4.2, 14, 8);
  b.flat(14).gearHint({ len: 22 });   // down in the crater between the jump and the mound
  PC.double(b, 14, 10, 1.8, 20, 10, { next: [2.6, 20], gapAfter: 1, deep: 2.2 });
  b.flat(12);
  PC.limbo(b, 8, 14, 7, 8, 3.3, { land: 10, landLen: 10 });
  b.flat(22);
}, { t: 'combo', seq: ['b', 'f', 'b', 'f', 'b'], text: 'Five flips in one run, switching way each time' }]
];

/* Running order inside each world, easiest first. The recipes above are grouped
   by idea; this list sorts them by how often the test riders crashed on them. */
var ORDER = [
  ['First Gear', 'Rolling Dunes', 'Hop Skip', 'Loop de Dust', 'Mesa Drop', 'Washboard', 'Gulch Gap', 'Canyon Run'],
  ['Log Jam', 'Mossy Loop', 'Timber Table', 'Sawmill', 'Root Rage', 'Creek Hop', 'Beaver Dam', 'Old Growth'],
  ['Green Flag', 'Rumble Strip', 'Oil Slick', 'Bus Stop', 'Pit Lane', 'Seven Buses', 'Stunt Show', 'Chequered Flag'],
  ['Black Ice', 'Glacier Loop', 'Slip Road', 'Whiteout', 'Aurora', 'Powder Keg', 'Crevasse', 'Avalanche'],
  ['Hot Start', 'Caldera', 'Magma Hop', 'The Chimney', 'Fire Walk', 'Ash Loop', 'Ember Steps', 'Eruption'],
  ['One Small Hop', 'Double Loop', 'Crater Maker', 'Slow Float', 'Regolith', 'Dark Side', 'Escape Velocity', 'Riot Run']
];
function slug(n) { return n.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
function hashStr(n) { var h = 2166136261; for (var i = 0; i < n.length; i++) { h ^= n.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
var IDX = {};
(function () {
  var by = {}, out = [];
  T.forEach(function (t) { by[t[0]] = t; });
  ORDER.forEach(function (w) { w.forEach(function (n) { if (!by[n]) throw new Error('no such track: ' + n); out.push(by[n]); }); });
  T = out;
  T.forEach(function (t, i) { IDX[slug(t[0])] = i; });
})();

/* Saved progress is filed under the track's name, not its position, so the running
   order can change without anybody's best times moving to a different track. */
RR.trackId = function (i) { return slug(T[i][0]); };
RR.trackIndex = function (id) { return id in IDX ? IDX[id] : -1; };
RR.TRACK_COUNT = T.length;
RR.trackInfo = function (i) {
  return { index: i, world: Math.floor(i / 8), num: i % 8, name: T[i][0], tip: T[i][1], id: slug(T[i][0]), chal: T[i][3] || null };
};
var cache = {};
RR.getTrack = function (i) {
  if (cache[i]) return cache[i];
  var w = RR.WORLDS[Math.floor(i / 8)], id = slug(T[i][0]);
  var b = new RR.TB(w, hashStr(id) % 100000 + 7);
  T[i][2](b);
  var tr = b.finish(T[i][0], id);
  tr.index = i; tr.worldIndex = Math.floor(i / 8); tr.airless = !!w.airless; tr.seed = hashStr(id) % 9973;
  // the measured speed for each slow zone replaces the rough figure in the recipe (see startimes.js)
  // a challenge that says "at: 'last'" means taking off from the last jump on the track
  var ch = T[i][3] ? JSON.parse(JSON.stringify(T[i][3])) : null;
  // "at: 'biggest'" means the widest gap on the track
  if (ch && (ch.at === 'last' || ch.at === 'biggest')) {
    var gaps = tr.feats.filter(function (f) { return f.t === 'gap'; }), lg = gaps[gaps.length - 1];
    if (ch.at === 'biggest') gaps.forEach(function (g) { if (g.x1 - g.x0 > lg.x1 - lg.x0) lg = g; });
    ch.at = lg ? [lg.x0 - 14, lg.x0 + 3] : null;
  }
  tr.chal = ch;
  var gp = RR.GEAR_AT && RR.GEAR_AT[id];
  if (gp && !tr.feats.some(function (f) { return f.t === 'gear'; })) tr.feats.push({ t: 'gear', x: gp[0], y: gp[1] });
  var zv = RR.ZONE_V && RR.ZONE_V[i], zk = 0;
  if (zv) tr.feats.forEach(function (f) { if (f.t === 'zone') { if (zk < zv.length) f.v = zv[zk]; zk++; } });
  cache[i] = tr;
  return tr;
};

if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
