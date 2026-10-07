/* Ridge Riot: worlds and tracks.
   Each track is a short recipe of pieces (see builder.js). Distances are metres.
   Star times live in startimes.js and are produced by tools/bot.js. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var M = RR.MAT;

RR.WORLDS = [
  { id: 'dust',   name: 'Dustbowl',    sub: 'Red rock and warm-up hills',      gravity: 9.81, mat: M.dirt, pit: 'fall',  logMat: M.rock, need: 0 },
  { id: 'pine',   name: 'Pinewood',    sub: 'Logs, creeks and bigger air',     gravity: 9.81, mat: M.dirt, pit: 'water', logMat: M.wood, need: 9 },
  { id: 'frost',  name: 'Frostbite',   sub: 'Snow drags, ice does not grip',   gravity: 9.81, mat: M.snow, pit: 'ice',   logMat: M.ice,  need: 24 },
  { id: 'cinder', name: 'Cinder Peak', sub: 'Lava below, rock above',          gravity: 9.81, mat: M.rock, pit: 'lava',  logMat: M.rock, need: 42 },
  { id: 'orbit',  name: 'Low Orbit',   sub: 'A third of the gravity, no air',  gravity: 3.9,  mat: M.dust, pit: 'fall',  logMat: M.rock, need: 62, airless: true }
];

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

/* [name, tip shown before the start, recipe] */
var T = [
/* ----------------------------- DUSTBOWL ----------------------------- */
['First Gear', 'Right thumb: gas and brake. Left thumb: lean back and lean forward.', function (b) {
  b.flat(18).hill(1.2, 18).flat(12).hill(1.8, 22).flat(10).ease(26, -3).flat(14)
   .hill(1.5, 16).flat(8).bumps(4, 5, 0.3).flat(12).ease(20, 2.5).flat(12)
   .table(11, 1.3, 6, 9).flat(16);
}],
['Rolling Dunes', 'Front wheel coming up on a climb? Lean forward, or ease off the gas.', function (b) {
  b.flat(14).waves(3, 24, 1.15).flat(8).ease(34, -6).flat(8).surface('sand').flat(14).surface()
   .waves(2, 18, 0.95).flat(8).up(15, 12, 13).flat(8, 16).down(13, 14, 13).flat(12)
   .hill(2.0, 22).flat(14);
}],
['Hop Skip', 'In the air, lean forward drops the nose and lean back lifts it.', function (b) {
  b.flat(24).sign('jump');
  jump(b, 11, 3.5, 9, 7, { rise: -0.4, lip: 1.6 });
  b.flat(18).table(14, 1.4, 6, 9).flat(16);
  jump(b, 13, 4.5, 11, 8, { rise: -0.6, lip: 1.6 });
  b.flat(16).hill(1.6, 20).flat(12);
  jump(b, 15, 5.5, 13, 9, { rise: -0.8, lip: 1.4 });
  b.flat(14);
}],
['Washboard', 'Bumps unsettle the bike. Stay on the gas and keep your lean thumb quiet.', function (b) {
  b.flat(14).bumps(8, 3.4, 0.26).flat(8).ease(18, -2.5).flat(6).bumps(5, 5.2, 0.34).flat(8)
   .steps(4, 6, 0.7).flat(10).hill(-1.6, 14).flat(8).bumps(9, 2.8, 0.22).flat(10)
   .table(17, 1.8, 4, 8).flat(8).logs(3, 6, 0.2).flat(14);
}],
['Mesa Drop', 'The last ramp flicks the front wheel up. Lean forward as you leave it.', function (b) {
  b.flat(16).up(21, 20, 11).flat(20, 16).drop(3.4).flat(22);
  jump(b, 16, 6, 15, 8, { rise: -1 });
  b.flat(10).up(18, 12, 10).flat(10, 15).drop(1.8).flat(8).drop(1.8).flat(14)
   .hill(2.2, 18).flat(6).surface('sand').flat(12).surface().flat(12).sign('jump');
  kick(b, 17, 6.5, 14, 8, { rise: -0.8, R: 7 });
  b.flat(12);
}],
['Gulch Gap', 'Match the bike to the slope you are landing on.', function (b) {
  b.flat(22);
  jump(b, 16, 6, 14, 9, { rise: -0.8, lip: 1.5 });
  b.flat(14).hill(1.6, 16).flat(12);
  kick(b, 17, 7, 15, 10, { rise: -1.1, R: 7.5 });
  b.flat(12).ease(22, -3.5).flat(10);
  jump(b, 20, 10, 18, 11, { rise: -1.6, lip: 1.5 });
  b.flat(14).bumps(4, 4.6, 0.28).flat(12).table(17, 1.9, 5, 8).flat(14);
}],
['Loop de Dust', 'Loops need speed. Hold the gas all the way round and do not lean.', function (b) {
  b.flat(34).sign('loop').loop(3.6).flat(20).table(17, 1.9, 6, 8).flat(10).ease(24, -4).flat(14)
   .loop(3.9).flat(22);
  kick(b, 18, 7, 16, 9, { rise: -1, R: 6.5 });
  b.flat(14);
}],
['Canyon Run', 'Hold a lean through a whole jump to flip. Land it and you get a boost.', function (b) {
  b.flat(16).waves(2, 22, 1.2).flat(10);
  kick(b, 18, 7, 16, 9, { rise: -1, R: 6.5 });
  b.flat(8).up(20, 16, 10).flat(14, 14).drop(2.6).flat(16).bumps(6, 3.6, 0.28).flat(12)
   .loop(3.8).flat(18);
  jump(b, 20, 9, 18, 10, { rise: -1.4 });
  b.flat(8).ease(26, -5).flat(10).table(20, 2.4, 5, 8).flat(8).steps(3, 7, 0.9).flat(12);
  kick(b, 20, 10, 20, 11, { rise: -2, R: 6.5 });
  b.flat(16);
}],

/* ----------------------------- PINEWOOD ----------------------------- */
['Log Jam', 'Logs kick the bike up. Hit them straight and stay loose.', function (b) {
  b.flat(16).logs(3, 6, 0.22).flat(10).hill(2, 18).flat(8).logs(3, 6, 0.22).flat(10).ease(20, -3)
   .flat(8).logs(3, 6.5, 0.2).flat(12).table(17, 1.8, 5, 8).flat(8).logs(2, 6, 0.22).flat(10);
  kick(b, 17, 6, 15, 8, { rise: -0.8, R: 6.5 });
  b.flat(14);
}],
['Creek Hop', '', function (b) {
  b.flat(24);
  jump(b, 16, 6, 14, 7, { rise: -0.6 });
  b.flat(10);
  kick(b, 17, 6.5, 15, 7, { rise: -0.6, R: 6.5 });
  b.flat(12).hill(2.4, 18).flat(10);
  hop(b, 18, 6, { rise: -0.4 }).flat(9);
  hop(b, 18, 6.5, { rise: -0.4 }).land(14, 7);
  b.flat(8).logs(3, 5, 0.24).flat(12);
  kick(b, 20, 9.5, 18, 9, { rise: -1.2, R: 6 });
  b.flat(14);
}],
['Root Rage', '', function (b) {
  b.flat(12).bumps(6, 3, 0.3).logs(3, 4.5, 0.24).flat(6).ease(26, -5).bumps(7, 3.2, 0.32).flat(8)
   .waves(3, 14, 1.0).flat(6).logs(4, 4, 0.24).flat(8).up(22, 12, 9).flat(8, 10).down(20, 12, 9)
   .flat(6).bumps(8, 2.6, 0.26).flat(6).logs(2, 5, 0.25).flat(14);
}],
['Timber Table', '', function (b) {
  b.flat(22).to(20, 6.5).line(2.2).to(0, 1.6).line(7).to(-20, 1.6).line(2.2).to(0, 8).flat(14);
  b.kicker(20, 8, 1.2).gap(4.5, { rise: 1.0 }).flat(14);               // step-up over water
  b.drop(2.2).flat(16).to(22, 6.5).line(3.4).to(0, 1.6).line(6).to(-22, 1.6).line(3.4).to(0, 8).flat(12);
  b.kicker(22, 8, 1.2).gap(4.5, { rise: 1.2 }).flat(12).down(18, 12, 9).flat(16);
  kick(b, 20, 9, 18, 10, { rise: -1.4, R: 6 });
  b.flat(14);
}],
['Mossy Loop', '', function (b) {
  b.flat(34).loop(4.1).flat(14);
  kick(b, 18, 8, 16, 9, { rise: -1, R: 6 });
  b.flat(8).logs(3, 5, 0.24).flat(6).ease(24, -4.5).flat(14).loop(4.4).flat(8).logs(2, 5, 0.24).flat(6)
   .table(20, 2.4, 5, 8).flat(14);
}],
['Sawmill', '', function (b) {
  b.flat(14).steps(5, 5.5, 0.85).flat(16).up(24, 14, 10).flat(10, 12).drop(2.4).flat(18)
   .surface('wood').flat(12);
  b.kicker(19, 7, 0.6).gap(7, { rise: -0.6 }).surface().land(16, 8);
  b.flat(8).steps(3, 6, 1.1).flat(8).logs(3, 5.5, 0.22).flat(14).up(24, 12, 10).flat(10, 13)
   .drop(3).flat(18);
}],
['Beaver Dam', '', function (b) {
  b.flat(16).ease(30, -6).flat(8);
  jump(b, 21, 13, 19, 11, { rise: -1.8 });
  b.flat(10).logs(3, 5, 0.24).flat(6).up(20, 14, 10).flat(10, 12).down(22, 16, 10).flat(6);
  kick(b, 21, 13.5, 20, 12, { rise: -2.2, R: 6.5 });
  b.flat(10).bumps(4, 4.2, 0.34).flat(10);
  hop(b, 19, 6, { rise: -0.5 }).flat(8);
  hop(b, 19, 6, { rise: -0.5 }).flat(8);
  hop(b, 19, 6.5, { rise: -0.5 }).land(16, 8);
  b.flat(14);
}],
['Old Growth', '', function (b) {
  b.flat(20).logs(3, 5, 0.24).flat(8).table(20, 2.4, 6, 8).flat(8);
  kick(b, 19, 9, 17, 10, { rise: -1.2, R: 6 });
  b.flat(14).loop(4).flat(8).loop(4).flat(16).up(24, 14, 9).flat(8, 9).drop(2.6).flat(10)
   .bumps(7, 3, 0.3).flat(6).ease(28, -6).flat(6);
  jump(b, 22, 13, 20, 12, { rise: -2 });
  b.flat(8).logs(4, 4.5, 0.24).flat(10);
  b.kicker(21, 8).gap(4.5, { rise: 1.1 }).flat(10).drop(2).flat(12);
  kick(b, 19, 8, 17, 9, { rise: -1, R: 6 });
  b.flat(14);
}],

/* ----------------------------- FROSTBITE ---------------------------- */
['Black Ice', 'Blue ice has no grip. Build your speed before you reach it.', function (b) {
  b.flat(20).surface('ice').flat(18).surface().hill(1.6, 18).flat(6).surface('ice').flat(10).ease(20, -2.5)
   .flat(8).surface().flat(10).waves(2, 18, 1.0).surface('ice').flat(16).surface().table(15, 1.6, 6, 9).flat(8)
   .surface('ice').flat(10).surface();
  jump(b, 16, 6, 14, 8, { rise: -0.8 });
  b.flat(14);
}],
['Powder Keg', '', function (b) {
  b.flat(14).waves(3, 16, 1.1).flat(8);
  kick(b, 18, 6.5, 16, 8, { rise: -0.8, R: 6.5 });
  b.flat(8).bumps(5, 3.6, 0.34).flat(8).ease(24, -4).flat(8).table(20, 2.4, 6, 8).flat(8);
  jump(b, 20, 8.5, 18, 9, { rise: -1.2 });
  b.flat(6).logs(3, 5, 0.25).flat(8);
  kick(b, 19, 7.5, 17, 9, { rise: -1, R: 6 });
  b.flat(14);
}],
['Slip Road', '', function (b) {
  b.flat(18).surface('ice').down(12, 22, 16).flat(10).surface();
  jump(b, 18, 8, 16, 9, { rise: -1 });
  b.flat(10).up(16, 14, 12).flat(8, 14).surface('ice').down(15, 20, 14).flat(12, 12).surface().flat(10)
   .hill(2.2, 16).surface('ice').flat(14).surface().flat(6);
  kick(b, 19, 9, 17, 10, { rise: -1.2, R: 6.5 });
  b.surface('ice').flat(12).surface().flat(10);
}],
['Crevasse', '', function (b) {
  b.flat(22);
  jump(b, 18, 7, 16, 8, { rise: -0.8 });
  b.surface('ice').flat(12).surface().flat(10);
  kick(b, 20, 9, 18, 9, { rise: -1.2, R: 6 });
  b.flat(8).ease(24, -4.5).surface('ice').flat(10).surface();
  jump(b, 21, 12, 19, 11, { rise: -1.6 });
  b.flat(10).bumps(4, 3.8, 0.32).flat(10);
  hop(b, 18, 6, { rise: -0.4 }).flat(14);
  b.kicker(20, 8).gap(4.5, { rise: 0.9 }).flat(12).drop(1.8).flat(14);
}],
['Glacier Loop', '', function (b) {
  b.flat(36).loop(4).surface('ice').flat(16).surface().flat(10);
  kick(b, 18, 7, 16, 9, { rise: -1, R: 6 });
  b.flat(10).ease(24, -4.5).flat(10).surface('ice').flat(8).surface().loop(4.5).flat(10);
  kick(b, 19, 9, 17, 10, { rise: -1.2, R: 6 });
  b.surface('ice').flat(14).surface().flat(8);
  hop(b, 18, 6, { rise: -0.4 }).flat(9);
  hop(b, 18, 6, { rise: -0.4 }).land(15, 8);
  b.flat(12);
}],
['Whiteout', '', function (b) {
  b.flat(12).bumps(6, 3.2, 0.3).flat(6).surface('ice').flat(8).surface().steps(4, 6, 0.9).flat(6)
   .flat(6).logs(2, 6, 0.22).flat(10).up(22, 12, 10).flat(10, 13).drop(2.8).flat(10).surface('ice').flat(12).surface()
   .flat(10).bumps(7, 2.8, 0.22).flat(14);
  kick(b, 20, 9, 18, 10, { rise: -1.4, R: 6 });
  b.flat(10).surface('ice').flat(8).surface();
  kick(b, 18, 7, 16, 9, { rise: -1, R: 6 });
  b.flat(14);
}],
['Avalanche', '', function (b) {
  b.flat(12).down(16, 26, 14).flat(6, 10);
  jump(b, 14, 10, 20, 12, { rise: -2.5 });
  b.down(14, 20, 12).surface('ice').flat(10, 12).surface().flat(6);
  kick(b, 16, 12, 22, 13, { rise: -3, R: 7 });
  b.flat(8).bumps(5, 4.2, 0.34).down(18, 22, 12).flat(8, 10);
  jump(b, 15, 13, 22, 14, { rise: -3.5 });
  b.flat(10).surface('ice').flat(10).surface().flat(10);
}],
['Aurora', '', function (b) {
  b.flat(18).surface('ice').flat(10).surface().table(20, 2.4, 6, 8).flat(8);
  kick(b, 19, 9, 17, 10, { rise: -1.2, R: 6 });
  b.flat(26).loop(4.2).flat(12).surface('ice').flat(10).surface().flat(10).up(20, 14, 10).flat(10, 14).drop(2.6)
   .flat(14).logs(2, 6, 0.22).flat(8).ease(26, -5).flat(6);
  jump(b, 21, 12.5, 19, 11, { rise: -1.8 });
  b.surface('ice').flat(12).surface().flat(8).bumps(5, 3.2, 0.3).flat(10);
  hop(b, 18, 6, { rise: -0.4 }).flat(9);
  hop(b, 18, 6.5, { rise: -0.4 }).land(15, 8);
  b.flat(14);
}],

/* ---------------------------- CINDER PEAK --------------------------- */
['Hot Start', 'Lava ends the run. Jump too short and that is where you land.', function (b) {
  b.flat(22);
  kick(b, 17, 6.5, 15, 8, { rise: -0.8, R: 7 });
  b.flat(10).hill(2.0, 18).flat(10);
  jump(b, 19, 8, 17, 9, { rise: -1 });
  b.flat(8).waves(2, 16, 1.0).flat(12);
  jump(b, 20, 9.5, 18, 10, { rise: -1.4 });
  b.flat(10).table(20, 2.4, 5, 8).flat(14);
}],
['Ember Steps', '', function (b) {
  b.flat(20);
  b.kicker(20, 8).gap(4, { rise: 0.8 }).flat(12);
  b.kicker(21, 8).gap(4.5, { rise: 1.0 }).flat(12);
  b.kicker(22, 8).gap(4.5, { rise: 1.2 }).flat(14);
  b.steps(4, 6, 1.1).flat(10).bumps(5, 3.2, 0.26).flat(16).up(22, 12, 11).flat(10, 15).drop(3).flat(22);
  kick(b, 20, 9, 18, 10, { rise: -1.4, R: 6 });
  b.flat(14);
  kick(b, 20, 8, 18, 9, { rise: -1.2, R: 6 });
  b.flat(14);
}],
['Magma Hop', '', function (b) {
  b.flat(24);
  hop(b, 17, 5.5, { rise: -0.3 }).flat(8);
  hop(b, 17, 5.5, { rise: -0.3 }).flat(8);
  hop(b, 18, 6, { rise: -0.3 }).flat(8);
  hop(b, 18, 6.5, { rise: -0.4 }).land(14, 7);
  b.flat(10).hill(2, 16).flat(8);
  hop(b, 19, 7, { rise: -0.4 }).flat(9);
  hop(b, 19, 7.5, { rise: -0.5 }).land(16, 8);
  b.flat(14);
}],
['The Chimney', 'Low rock roofs. Brake before a hump or you will hit your head.', function (b) {
  b.flat(18).roofStart(3.4).flat(10).bumps(4, 4.4, 0.3).flat(10).hill(1.1, 12).flat(10).ease(18, -2).flat(8)
   .roofEnd().flat(10);
  kick(b, 18, 8, 16, 9, { rise: -1, R: 6 });
  b.flat(8).roofStart(3.3).flat(8).ease(16, 2).flat(8).hill(1.3, 12).flat(8).hill(-1.2, 12).flat(8).hill(1.0, 10).flat(10)
   .roofEnd().flat(12);
  kick(b, 20, 9, 18, 10, { rise: -1.4, R: 5.5 });
  b.flat(14);
}],
['Ash Loop', '', function (b) {
  b.flat(34).loop(4.2).flat(10);
  kick(b, 18, 8, 16, 9, { rise: -1, R: 6 });
  b.flat(18).loop(3.8).flat(6).loop(3.8).flat(14).ease(24, -4.5).flat(6);
  jump(b, 21, 12, 19, 11, { rise: -1.8 });
  b.flat(10);
  hop(b, 18, 6, { rise: -0.4 }).flat(9);
  hop(b, 18, 6.5, { rise: -0.4 }).land(15, 8);
  b.flat(14);
}],
['Fire Walk', '', function (b) {
  b.flat(14).ease(30, -6.5).flat(6);
  jump(b, 22, 15, 20, 12, { rise: -2.4 });
  b.flat(8).roofStart(3.4).flat(8).bumps(6, 3.4, 0.28).flat(8).hill(1.1, 12).flat(10).roofEnd().flat(6);
  hop(b, 19, 7, { rise: -0.4 }).flat(9);
  hop(b, 19, 7, { rise: -0.4 }).flat(9);
  b.kicker(20, 5.5, 0).gap(8, { rise: -0.6 }).land(16, 8);
  b.flat(14);
}],
['Caldera', '', function (b) {
  b.flat(16).down(24, 22, 12).flat(12, 12).up(24, 22, 12).flat(12, 14);
  b.drop(2).flat(18);
  kick(b, 21, 8.5, 18, 10, { rise: -1.2, R: 5.5 });
  b.flat(8);
  hop(b, 18, 6, { rise: -0.4 }).flat(8);
  hop(b, 18, 6, { rise: -0.4 }).land(15, 8);
  b.flat(8).down(26, 20, 12).flat(10, 10).hill(1.4, 14).flat(8).up(26, 20, 11).flat(10, 12);
  b.gap(5, { rise: -1.8 }).land(18, 9);
  b.flat(16);
}],
['Eruption', '', function (b) {
  b.flat(18);
  b.kicker(21, 8).gap(4.5, { rise: 1.0 }).flat(12).kicker(21, 8).gap(4.5, { rise: 1.1 }).flat(20);
  b.loop(4).flat(14).drop(2.6).flat(8).roofStart(3.4).flat(6).bumps(5, 3.4, 0.28).flat(8).hill(1.0, 12).flat(8).roofEnd().flat(6)
   .ease(26, -5).flat(6);
  jump(b, 22, 13.5, 20, 12, { rise: -2 });
  b.flat(6);
  hop(b, 18, 6.5, { rise: -0.4 }).flat(8);
  hop(b, 18, 6.5, { rise: -0.4 }).land(15, 8);
  b.flat(8);
  kick(b, 21, 9, 19, 10, { rise: -1.4, R: 5.5 });
  b.flat(8).loop(4.3).flat(16);
}],

/* ----------------------------- LOW ORBIT ---------------------------- */
['One Small Hop', 'A third of the gravity. Jumps go three times as far and flips come easy.', function (b) {
  b.flat(22).hill(1.4, 26).flat(14).table(14, 1.8, 9, 12).flat(20);
  jump(b, 15, 12, 12, 14, { rise: -1, lip: 2 });
  b.flat(18).hill(-1.6, 34).flat(14).table(17, 2.6, 9, 12).flat(22);
}],
['Crater Maker', '', function (b) {
  b.flat(16).hill(-2, 40).flat(12).hill(-2.8, 48).flat(14);
  jump(b, 20, 20, 16, 14, { rise: -1.5 });
  b.flat(14).hill(-2.2, 40).flat(10).up(20, 14, 14).flat(10, 16).drop(4).flat(26);
}],
['Slow Float', '', function (b) {
  b.flat(26);
  jump(b, 20, 22, 17, 16, { rise: -2 });
  b.flat(20).table(20, 3.4, 9, 12).flat(26);
  jump(b, 22, 25, 19, 18, { rise: -3 });
  b.flat(16).waves(2, 34, 1.3).flat(22);
}],
['Dark Side', '', function (b) {
  b.flat(18).bumps(5, 5.5, 0.3).flat(12).steps(3, 12, 1.1).flat(16).up(22, 16, 13).flat(8, 16).drop(5).flat(52);
  jump(b, 18, 16, 16, 14, { rise: -1.5 });
  b.flat(14).drop(3).flat(26).logs(2, 9, 0.22).flat(18);
  kick(b, 20, 20, 19, 18, { rise: -3, R: 8 });
  b.flat(20);
}],
['Double Loop', '', function (b) {
  b.flat(40).loop(6.5).flat(22).loop(7.5).flat(20);
  jump(b, 21, 22, 18, 16, { rise: -2 });
  b.flat(20).loop(5.5).flat(22);
}],
['Regolith', '', function (b) {
  b.flat(14).surface('sand').flat(16).surface().bumps(6, 4.5, 0.4).flat(10).hill(-4, 30).flat(8)
   .surface('sand').flat(12).surface().flat(6);
  jump(b, 20, 18, 17, 14, { rise: -1.5 });
  b.flat(10).logs(4, 7, 0.25).flat(10).table(22, 4, 7, 11).flat(8).surface('sand').flat(12).surface().flat(16);
}],
['Escape Velocity', '', function (b) {
  b.flat(14).down(18, 30, 16).flat(8, 12);
  jump(b, 23, 36, 21, 22, { rise: -5 });
  b.flat(14).up(20, 16, 14).flat(8, 16).down(22, 28, 13).flat(8, 12);
  jump(b, 24, 38, 23, 24, { rise: -6 });
  b.flat(24);
}],
['Riot Run', '', function (b) {
  b.flat(26).loop(6).flat(16);
  jump(b, 21, 22, 18, 16, { rise: -2 });
  b.flat(12).hill(-2.6, 44).flat(12).kicker(21, 10).gap(9, { rise: 1.7 }).flat(20).drop(3.5).flat(16)
   .bumps(5, 5.5, 0.34).flat(22).loop(7).flat(12).down(18, 24, 14).flat(8, 12);
  jump(b, 23, 36, 21, 22, { rise: -5 });
  b.flat(28);
  kick(b, 20, 18, 17, 14, { rise: -1.5, R: 8 });
  b.flat(12).table(22, 4.5, 8, 11).flat(22);
}]
];

/* Running order inside each world, easiest first. The recipes above are grouped
   by idea; this list sorts them by how often the test riders crashed on them. */
var ORDER = [
  ['First Gear', 'Washboard', 'Rolling Dunes', 'Hop Skip', 'Loop de Dust', 'Mesa Drop', 'Gulch Gap', 'Canyon Run'],
  ['Log Jam', 'Mossy Loop', 'Timber Table', 'Sawmill', 'Root Rage', 'Creek Hop', 'Beaver Dam', 'Old Growth'],
  ['Black Ice', 'Whiteout', 'Glacier Loop', 'Slip Road', 'Powder Keg', 'Avalanche', 'Crevasse', 'Aurora'],
  ['Hot Start', 'The Chimney', 'Ash Loop', 'Caldera', 'Magma Hop', 'Fire Walk', 'Ember Steps', 'Eruption'],
  ['One Small Hop', 'Double Loop', 'Crater Maker', 'Slow Float', 'Dark Side', 'Escape Velocity', 'Regolith', 'Riot Run']
];
(function () {
  var by = {}, out = [];
  T.forEach(function (t) { by[t[0]] = t; });
  ORDER.forEach(function (w) { w.forEach(function (n) { out.push(by[n]); }); });
  T = out;
})();

RR.TRACK_COUNT = T.length;
RR.trackInfo = function (i) {
  return { index: i, world: Math.floor(i / 8), num: i % 8, name: T[i][0], tip: T[i][1], id: 't' + i };
};
var cache = {};
RR.getTrack = function (i) {
  if (cache[i]) return cache[i];
  var w = RR.WORLDS[Math.floor(i / 8)];
  var b = new RR.TB(w, 1000 + i * 77);
  T[i][2](b);
  var tr = b.finish(T[i][0], 't' + i);
  tr.index = i; tr.worldIndex = Math.floor(i / 8); tr.airless = !!w.airless;
  cache[i] = tr;
  return tr;
};

if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
