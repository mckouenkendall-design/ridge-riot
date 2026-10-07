/* Ridge Riot: track builder.
   Tracks are drawn with a "pen" that moves left to right. Each piece (flat,
   hill, kicker, gap, loop...) continues from where the last one ended, and
   curves keep the slope continuous so the bike does not hit invisible kinks. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var PI = Math.PI, D2R = PI / 180;

function TB(world, seed) {
  this.world = world;
  this.mat = world.mat; this.baseMat = world.mat;
  this.pts = []; this.mats = [];
  this.x = 0; this.y = 0; this.ang = 0;
  this.chains = []; this.loops = []; this.hazards = []; this.feats = []; this.roofs = [];
  this.seed = seed || 1; this.pit = {};
  this.R = 7;
  // back wall, then the start pad
  this.pts.push(-16, 9, -16, 0); this.mats.push(this.mat);
  this.x = -16; this.y = 0;
  this.line(16 + 9);
  this.start = [1.2, 0];
}
var P = TB.prototype;
P.rnd = function () { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; };
P.push = function (x, y) { this.pts.push(x, y); this.mats.push(this.mat); this.x = x; this.y = y; };
P.line = function (len) {
  var n = Math.max(1, Math.round(len / 3)), c = Math.cos(this.ang), s = Math.sin(this.ang);
  var x0 = this.x, y0 = this.y;
  for (var i = 1; i <= n; i++) this.push(x0 + c * len * i / n, y0 + s * len * i / n);
  return this;
};
/* turn the pen by dAng radians along a circle of radius R */
P.arc = function (dAng, R) {
  if (Math.abs(dAng) < 1e-4) return this;
  R = R || this.R;
  var n = Math.max(2, Math.ceil(Math.abs(dAng) * R / 0.4), Math.ceil(Math.abs(dAng) / (5 * D2R)));
  var a0 = this.ang, sg = dAng > 0 ? 1 : -1;
  var cx = this.x - sg * R * Math.sin(a0), cy = this.y + sg * R * Math.cos(a0);
  for (var i = 1; i <= n; i++) {
    var a = a0 + dAng * i / n;
    this.push(cx + sg * R * Math.sin(a), cy - sg * R * Math.cos(a));
  }
  this.ang = a0 + dAng;
  return this;
};
P.to = function (deg, R) { return this.arc(deg * D2R - this.ang, R); };
P.flat = function (len, R) { this.to(0, R); return this.line(len); };
P.up = function (deg, len, R) { this.to(deg, R); return this.line(len); };
P.down = function (deg, len, R) { this.to(-deg, R); return this.line(len); };
/* smooth hump (h > 0) or dip (h < 0) */
P.hill = function (h, len) {
  this.to(0);
  var n = Math.max(6, Math.ceil(len / 0.4)), x0 = this.x, y0 = this.y;
  for (var i = 1; i <= n; i++) { var t = i / n; this.push(x0 + len * t, y0 + h * 0.5 * (1 - Math.cos(2 * PI * t))); }
  return this;
};
/* smooth change of height */
P.ease = function (dx, dy) {
  this.to(0);
  var n = Math.max(6, Math.ceil(dx / 0.4)), x0 = this.x, y0 = this.y;
  for (var i = 1; i <= n; i++) { var t = i / n; this.push(x0 + dx * t, y0 + dy * 0.5 * (1 - Math.cos(PI * t))); }
  return this;
};
/* washboard / whoops */
P.bumps = function (count, wl, amp) {
  this.to(0);
  var n = Math.ceil(count * wl / 0.3), x0 = this.x, y0 = this.y, len = count * wl;
  for (var i = 1; i <= n; i++) { var t = i / n; this.push(x0 + len * t, y0 + amp * 0.5 * (1 - Math.cos(2 * PI * t * count))); }
  return this;
};
/* rollers: full sine waves around the base line */
P.waves = function (count, wl, amp) {
  this.to(0);
  var n = Math.ceil(count * wl / 0.4), x0 = this.x, y0 = this.y, len = count * wl;
  for (var i = 1; i <= n; i++) {
    var t = i / n, env = Math.min(1, t * count * 2, (1 - t) * count * 2);
    this.push(x0 + len * t, y0 + amp * env * Math.sin(2 * PI * t * count));
  }
  return this;
};
/* launch ramp: curve up to an angle, then a straight lip */
P.kicker = function (deg, R, lip) { this.to(deg, R || 6); return this.line(lip == null ? 1.2 : lip); };
/* cliff: positive h drops, negative h is a wall up */
P.drop = function (h) { this.push(this.x, this.y - h); this.ang = 0; return this; };
/* a hole. o.rise = how much higher (+) or lower (-) the far side is.
   o.type: 'fall' (bottomless) or a liquid ('water', 'lava', 'ice'). */
P.gap = function (w, o) {
  o = o || {};
  var type = o.type || this.world.pit, rise = o.rise || 0;
  var y0 = this.y, low = Math.min(y0, y0 + rise);
  var depth = type === 'fall' ? 60 : (o.depth || 5);
  var x0 = this.x;
  var m = this.mat; this.mat = RR.MAT.rock;
  this.push(x0, low - depth); this.pit[this.pts.length / 2 - 1] = 1;
  this.push(x0 + w, low - depth); this.pit[this.pts.length / 2 - 1] = 1;
  this.push(x0 + w, y0 + rise);
  this.mat = m;
  var lvl = type === 'fall' ? low - 9 : low - (o.level || 1.5);
  this.hazards.push({ x0: x0, x1: x0 + w, y: lvl, type: type, rim: low });
  this.feats.push({ t: 'gap', x0: x0, x1: x0 + w, y: lvl, type: type });
  this.ang = 0;
  return this;
};
/* downslope to land on: starts at an angle straight away, then curves out to flat */
P.land = function (deg, len, R) { this.ang = -deg * D2R; this.line(len); return this.to(0, R || 8); };
/* tabletop jump */
P.table = function (deg, h, top, R) {
  R = R || 6;
  var a = deg * D2R;
  var rise = R * (1 - Math.cos(a)) + 1.5 * (1 - Math.cos(a));
  this.to(deg, R); this.line(Math.max(0.3, (h - rise) / Math.sin(a))); this.to(0, 1.5);
  this.line(top);
  this.to(-deg, 1.5); this.line(Math.max(0.3, (h - rise) / Math.sin(a))); this.to(0, R + 2);
  return this;
};
/* logs or rocks lying on the track */
P.logs = function (count, spacing, r) {
  this.to(0);
  var m = this.mat;
  for (var c = 0; c < count; c++) {
    this.line(spacing * (0.8 + 0.4 * this.rnd()));
    var rr = r * (0.85 + 0.3 * this.rnd()), x0 = this.x, y0 = this.y, hh = rr * 0.72;
    var half = Math.acos(1 - hh / rr), n = 7;
    this.mat = this.world.logMat == null ? RR.MAT.wood : this.world.logMat;
    for (var i = 0; i <= n; i++) {
      var a = -half + 2 * half * i / n;
      this.push(x0 + rr * Math.sin(half) + rr * Math.sin(a), y0 - (rr - hh) + rr * Math.cos(a));
    }
    this.y = y0; this.pts[this.pts.length - 1] = y0;
    this.feats.push({ t: 'log', x: x0 + rr * Math.sin(half), y: y0 - (rr - hh), r: rr });
    this.mat = m;
  }
  return this;
};
P.steps = function (count, run, h) {
  for (var i = 0; i < count; i++) { this.flat(run); this.drop(h); }
  return this;
};
/* stretch of a different surface */
P.surface = function (mat) { this.mat = mat == null ? this.baseMat : RR.MAT[mat]; return this; };
/* raceway pieces */
P.boost = function (len) { var m = this.mat; this.to(0); this.mat = RR.MAT.boost; this.line(len); this.mat = m; this.feats.push({ t: 'boost', x0: this.x - len, x1: this.x, y: this.y }); return this; };
P.oil = function (len) { var m = this.mat; this.mat = RR.MAT.oil; this.line(len); this.mat = m; return this; };
/* rumble strip: red and white kerbing with small teeth you can feel through the bars */
P.kerb = function (len, amp) {
  this.to(0);
  var m = this.mat, n = Math.max(2, Math.round(len / 0.25)), x0 = this.x, y0 = this.y; amp = amp == null ? 0.045 : amp;
  this.mat = RR.MAT.kerb;
  for (var i = 1; i <= n; i++) this.push(x0 + len * i / n, y0 + (i < n && i % 2 ? amp : 0));
  this.mat = m;
  return this;
};
/* a row of parked buses to clear */
P.buses = function (count, o) {
  o = o || {};
  var w = count * 3.5 + 0.5;
  this.gap(w, { type: 'bus', rise: o.rise || 0, depth: 3.1, level: 0.25 });
  this.hazards[this.hazards.length - 1].count = count;
  return this;
};
/* full loop standing on flat ground */
P.loop = function (R) {
  this.to(0); this.line(1);
  var cx = this.x, cy = this.y + R, id = this.loops.length, i, a;
  var e = [], x = [], n = Math.ceil(2 * PI * R / 0.35);
  for (i = 0; i <= n; i++) {
    a = 2 * PI * i / n;
    var px = cx + R * Math.sin(a), py = cy - R * Math.cos(a);
    if (a <= 200 * D2R + 1e-6) e.push(px, py);
    if (a >= 160 * D2R - 1e-6) x.push(px, py);
  }
  this.chains.push({ pts: e, mat: RR.MAT.steel, gate: id, side: 0, depth: 0.3, kind: 'loop' });
  this.chains.push({ pts: x, mat: RR.MAT.steel, gate: id, side: 1, depth: 0.3, kind: 'loop' });
  // the shared top is in both halves, so mark it "always on" by duplicating as side 2
  this.loops.push({ cx: cx, cy: cy, R: R });
  this.feats.push({ t: 'loop', x: cx, y: cy, R: R });
  this.line(1);
  return this;
};
/* rock roof over the track from here on; call roofEnd() to close it */
P.roofStart = function (clear) { this._roof = { i: this.pts.length / 2 - 1, clear: clear }; return this; };
P.roofEnd = function (thick) {
  var r = this._roof, n = this.pts.length / 2, i, bottom = [], top = -1e9;
  thick = thick || 2.2;
  for (i = r.i; i < n; i++) {
    if (this.pit[i]) continue;
    var x = this.pts[i * 2], y = this.pts[i * 2 + 1] + r.clear + 0.25 * Math.sin(x * 1.7) + 0.15 * Math.sin(x * 4.1 + 1);
    if (bottom.length && x - bottom[bottom.length - 2] < 0.8 && i < n - 1) continue;
    bottom.push(x, y); if (y > top) top = y;
  }
  top += thick;
  var poly = [bottom[0], top, bottom[bottom.length - 2], top];
  for (i = bottom.length / 2 - 1; i >= 0; i--) poly.push(bottom[i * 2], bottom[i * 2 + 1]);
  this.chains.push({ pts: poly, closed: true, mat: RR.MAT.rock, depth: 0.4, kind: 'roof' });
  this.feats.push({ t: 'roof', x0: bottom[0], x1: bottom[bottom.length - 2] });
  this._roof = null;
  return this;
};
P.sign = function (kind) { this.feats.push({ t: 'sign', x: this.x, y: this.y, kind: kind }); return this; };

P.finish = function (name, id) {
  this.to(0); this.line(5);
  var fx = this.x;
  this.feats.push({ t: 'finish', x: fx, y: this.y });
  this.line(55);
  this.push(this.x, this.y + 9);
  var main = { pts: this.pts, mats: this.mats, depth: 0.4, kind: 'ground' };
  var chains = [main].concat(this.chains);
  var n = this.pts.length / 2, xs = new Float64Array(n), ys = new Float64Array(n), minY = 1e9, maxY = -1e9;
  for (var i = 0; i < n; i++) {
    xs[i] = this.pts[i * 2]; ys[i] = this.pts[i * 2 + 1];
    if (!this.pit[i] && ys[i] < minY) minY = ys[i];
    if (ys[i] > maxY && xs[i] > -15 && i < n - 1) maxY = ys[i];
  }
  var tr = {
    id: id, name: name, world: this.world.id, gravity: this.world.gravity,
    chains: chains, col: RR.buildCollision(chains), loops: this.loops, hazards: this.hazards, feats: this.feats,
    start: this.start, finishX: fx, killY: minY - 14, minY: minY, maxY: maxY, xs: xs, ys: ys, mats: this.mats,
    length: fx - this.start[0]
  };
  return tr;
};
RR.TB = TB;

/* height of the main ground at x (the top surface, ignoring loops and roofs) */
RR.groundIndex = function (tr, x) {
  var xs = tr.xs, lo = 0, hi = xs.length - 1;
  if (x <= xs[0]) return 0;
  if (x >= xs[hi]) return hi - 1;
  while (hi - lo > 1) { var m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
  return lo;
};
RR.groundY = function (tr, x) {
  var i = RR.groundIndex(tr, x), xs = tr.xs, ys = tr.ys;
  var dx = xs[i + 1] - xs[i];
  if (dx < 1e-9) return Math.max(ys[i], ys[i + 1]);
  return ys[i] + (ys[i + 1] - ys[i]) * (x - xs[i]) / dx;
};
RR.groundSlope = function (tr, x) {
  var i = RR.groundIndex(tr, x), xs = tr.xs, ys = tr.ys;
  var dx = xs[i + 1] - xs[i];
  if (dx < 1e-9) return 0;
  return Math.atan2(ys[i + 1] - ys[i], dx);
};

if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
