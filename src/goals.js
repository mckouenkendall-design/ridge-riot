/* Ridge Riot: what there is to do on a track besides finishing it.
   Three stars, each its own goal: finish, beat the time, land the flip target in one run.
   One challenge per track: a particular trick, checked here from what the physics reports.
   One hidden gear per track: touch it with any part of the bike or rider and it is yours.
   No drawing and no browser APIs here, so the test robots can use exactly the same rules. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var TAU = Math.PI * 2;

RR.STAR = { finish: 1, time: 2, flips: 4 };
RR.starCount = function (bits) { return (bits & 1) + (bits >> 1 & 1) + (bits >> 2 & 1); };

/* ---- challenges ----
   A challenge is { t: type, ... }. Types:
   combo   seq: ['b','f',...]   flips in that order in one run (others may come between)
   flip    dir: 'b'|'f', n, at: [x0, x1]   one landing of at least n flips that way, taking off between x0 and x1
   multi   n, at?               one landing of at least n flips, either way
   air     sec                  one jump at least this long
   long    m                    one jump at least this far
   wheelie sec                  front wheel up, back wheel down, without a break
   nobrake                      finish without touching the brake
   clean                        finish without anything but the tyres touching the ground
   speed   kmh                  reach this speed */
RR.chalText = function (c) {
  if (c.text) return c.text;
  var nm = function (n) { return n === 1 ? '' : n === 2 ? 'double ' : n === 3 ? 'triple ' : n + 'x '; };
  switch (c.t) {
    case 'combo': return c.seq.map(function (d) { return d === 'b' ? 'backflip' : 'frontflip'; }).join(', then ') + ', in one run';
    case 'flip': return 'A ' + nm(c.n || 1) + (c.dir === 'b' ? 'backflip' : 'frontflip') + (c.where ? ' ' + c.where : '');
    case 'multi': return 'A ' + nm(c.n) + 'flip in one jump' + (c.where ? ' ' + c.where : '');
    case 'air': return 'Stay in the air ' + c.sec + ' seconds in one jump';
    case 'long': return 'Jump ' + c.m + ' metres in one go';
    case 'wheelie': return 'Wheelie for ' + c.sec + ' seconds';
    case 'nobrake': return 'Finish without touching the brake';
    case 'clean': return 'Finish with only your tyres touching the ground';
    case 'speed': return 'Hit ' + c.kmh + ' km/h';
  }
  return '';
};
/* a fresh tracker for one run */
RR.chalStart = function (c) { return { c: c, done: false, k: 0, wT: 0, brake: false, body: false }; };
/* call once per physics tick, after RR.tick and before the events are cleared */
RR.chalTick = function (st, s, inp) {
  var c = st.c, i, e;
  if (!c || st.done) return st.done;
  if (s.started && inp && inp.brake && !s.finished && !s.crashed) st.brake = true;
  if (s.body && s.started) st.body = true;
  for (i = 0; i < s.events.length; i++) {
    e = s.events[i];
    if (e.t === 'flip') {
      var d = e.dir > 0 ? 'b' : 'f', x0 = e.jumpX;
      if (c.t === 'combo' && st.k < c.seq.length && c.seq[st.k] === d) st.k++;
      if (c.t === 'flip' && d === c.dir && e.n >= (c.n || 1) && (!c.at || (x0 >= c.at[0] && x0 <= c.at[1]))) st.done = true;
      if (c.t === 'multi' && e.n >= c.n && (!c.at || (x0 >= c.at[0] && x0 <= c.at[1]))) st.done = true;
    }
    if ((e.t === 'flip' || e.t === 'air' || e.t === 'landed') && c.t === 'air' && e.air >= c.sec) st.done = true;
    if (e.t === 'finish') {
      if (c.t === 'nobrake' && !st.brake) st.done = true;
      if (c.t === 'clean' && !st.body) st.done = true;
    }
  }
  if (c.t === 'combo' && st.k >= c.seq.length) st.done = true;
  if (c.t === 'long' && s.bestJump >= c.m && !s.crashed) st.done = true;
  if (c.t === 'air' && s.bestAir >= c.sec && !s.crashed && !s.air) st.done = true;
  if (c.t === 'speed' && s.maxSpeed * 3.6 >= c.kmh && !s.crashed) st.done = true;
  if (c.t === 'wheelie') {
    if (!s.crashed && s.gnd[0] && !s.gnd[1] && s.airW[1] > 0.1) st.wT += RR.DT; else st.wT = 0;
    if (st.wT >= c.sec) st.done = true;
  }
  // a crash takes back anything that only counts once you land it
  if (s.crashed && (c.t === 'nobrake' || c.t === 'clean')) st.done = false;
  return st.done;
};
/* how far along a challenge is, for the HUD: a short string or '' */
RR.chalProgress = function (st) {
  var c = st && st.c; if (!c || st.done) return '';
  if (c.t === 'combo') return st.k + ' of ' + c.seq.length;
  if (c.t === 'wheelie' && st.wT > 0.3) return st.wT.toFixed(1) + ' s';
  if (c.t === 'nobrake' && st.brake) return 'braked';
  if (c.t === 'clean' && st.body) return 'touched';
  return '';
};

/* ---- the hidden gear ---- */
var pose = {};
RR.GEAR_R = 0.55;
/* is any part of the bike or rider touching the gear at (gx, gy)? */
RR.gearTouch = function (s, gx, gy) {
  var R = RR.GEAR_R, b = s.b, i;
  function near(x, y, r) { var dx = x - gx, dy = y - gy; return dx * dx + dy * dy < (R + r) * (R + r); }
  for (i = 0; i < 2; i++) if (near(s.wx[i], s.wy[i], b.wh[i].r)) return true;
  if (near(s.x, s.y, 0.3)) return true;
  RR.riderPose(b.def, s.lp, 0, pose);
  var ca = Math.cos(s.a), sa = Math.sin(s.a), hx = pose.headX - b.com[0], hy = pose.headY - b.com[1];
  if (near(s.x + ca * hx - sa * hy, s.y + sa * hx + ca * hy, b.headR)) return true;
  for (i = 0; i < b.pts.length; i++) { var p = b.pts[i]; if (near(s.x + ca * p[0] - sa * p[1], s.y + sa * p[0] + ca * p[1], p[2])) return true; }
  return false;
};
RR.gearOf = function (tr) { for (var i = 0; i < tr.feats.length; i++) if (tr.feats[i].t === 'gear') return tr.feats[i]; return null; };

if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
