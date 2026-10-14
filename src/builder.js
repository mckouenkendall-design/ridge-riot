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
  this.chains = []; this.loops = []; this.hazards = []; this.feats = []; this.roofs = []; this.forks = [];
  this.seed = seed || 1; this.pit = {};
  this.R = 7;
  // back wall, then the start pad
  this.pts.push(-16, 9, -16, 0); this.mats.push(this.mat);
  this.logIds = [-1]; this._log = -1; this.logN = 0;      // which log (if any) each stretch of ground belongs to
  this.x = -16; this.y = 0;
  this.line(16 + 9);
  this.start = [1.2, 0];
}
var P = TB.prototype;
P.rnd = function () { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; };
P.push = function (x, y) { this.pts.push(x, y); this.mats.push(this.mat); this.logIds.push(this._log); this.x = x; this.y = y; };
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
    var id = this.logN++; this._log = id;
    for (var i = 0; i <= n; i++) {
      var a = -half + 2 * half * i / n;
      this.push(x0 + rr * Math.sin(half) + rr * Math.sin(a), y0 - (rr - hh) + rr * Math.cos(a));
    }
    this.y = y0; this.pts[this.pts.length - 1] = y0;
    this._log = -1; this.logIds[this.logIds.length - 1] = -1;
    // the flat ground under the log, which only a bike that has smashed it ever touches
    this.chains.push({ pts: [x0 - 0.05, y0, this.x + 0.05, y0], mat: this.baseMat, under: id, depth: 0.4, kind: 'logfloor' });
    this.feats.push({ t: 'log', x: x0 + rr * Math.sin(half), y: y0 - (rr - hh), r: rr, id: id });
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
/* TWO ROUTES. At the fork sign (the pen, when this is called) the rider chooses: hold lean back as you pass it
   and a ramp carries you up onto the high road over a rock arch; ride through normally and you stay on the low road
   underneath. The ramps on and off the arch only exist for a rider who chose them, so the low road passes behind
   them. Nothing at the split can crash you. Fall off the high road (miss its slot) and you land on the low road.
   o: { H: height of the arch top, th: its thickness, rampLen, slab1, slot, slab2, kickH, stepH, exitLen,
        low: function (b) building the low road (it is continued flat to the join) } */
P.fork = function (o) {
  var D = Math.PI / 180, x0 = this.x, y0 = this.y, g = 64 + this.forks.length, i;
  var H = y0 + (o.H || 4.2), th = o.th || 0.8, rampLen = o.rampLen || 16, exitLen = o.exitLen || 16;
  var a0 = x0 + rampLen, s1 = [a0, a0 + (o.slab1 || 10)], s2 = [s1[1] + (o.slot || 5), 0];
  s2[1] = s2[0] + (o.slab2 || 10);
  if (o.one) s2 = [s1[1], s1[1]];          // a side ledge: one slab, then straight back down
  var J = s2[1] + exitLen;
  this.sign('fork');
  // the low road
  if (o.low) o.low(this);
  if (this.x < J) this.flat(J - this.x);
  // ramp up (gated), arch slabs (always solid: they are rock), ramp down (gated)
  function ramp(b, xa, ya, xb, yb) {
    var pts = [], n = 16;
    for (i = 0; i <= n; i++) { var t = i / n; pts.push(xa + (xb - xa) * t, ya + (yb - ya) * (0.5 - 0.5 * Math.cos(Math.PI * t))); }
    b.chains.push({ pts: pts, mat: RR.MAT.wood, gate: g, side: 1, depth: 0.3, kind: 'bridge' });
    return pts;
  }
  function slab(b, xa, xb, ya, yb, kick) {
    var pts = [xa, H - th], n = Math.max(2, Math.ceil((xb - xa) / 0.8));
    pts.push(xa, ya);
    for (i = 1; i <= n; i++) {
      var t = i / n, x = xa + (xb - xa) * t, y = ya + (yb - ya) * t;
      if (kick && x > xb - kick.len) y += Math.pow((x - (xb - kick.len)) / kick.len, 1.6) * kick.h;
      pts.push(x, y);
    }
    pts.push(xb, H - th);
    for (i = n; i >= 0; i--) { var xu = xa + (xb - xa) * i / n; pts.push(xu, H - th + 0.1 * Math.sin(xu * 2.3) + 0.05 * Math.sin(xu * 5.1)); }
    b.chains.push({ pts: pts, closed: true, mat: RR.MAT.rock, depth: 0.4, kind: 'shelf' });
  }
  var up = ramp(this, x0, y0, a0, H);
  slab(this, s1[0], s1[1], H, H, { len: 2.6, h: o.kickH == null ? 0.6 : o.kickH });
  if (!o.one) slab(this, s2[0], s2[1], H - (o.stepH || 0.8), H, null);
  var down = ramp(this, s2[1], H, J, y0);
  this.forks.push({ x: x0, g: g });
  this.feats.push({ t: 'fork', x0: x0, a0: a0, xe: s2[1], j: J, y0: y0, top: H, slot: [s1[1], s2[0]], gate: g, up: up, down: down });
  return this;
};
/* rock roof over the track from here on; call roofEnd() to close it */
P.roofStart = function (clear) { this._roof = { i: this.pts.length / 2 - 1, clear: clear }; return this; };
P.roofEnd = function (thick) {
  var r = this._roof, n = this.pts.length / 2, i, bottom = [], top = -1e9;
  var built = this.world.id === 'race' || this.world.id === 'orbit';      // poured or bolted, so no lumps
  thick = thick || 40;      // nobody rides over the top of one
  for (i = r.i; i < n; i++) {
    if (this.pit[i]) continue;
    var x = this.pts[i * 2], y = this.pts[i * 2 + 1] + r.clear + (built ? 0.3 : 0.25 * Math.sin(x * 1.7) + 0.15 * Math.sin(x * 4.1 + 1));
    if (bottom.length && x - bottom[bottom.length - 2] < 0.8 && i < n - 1) continue;
    bottom.push(x, y); if (y > top) top = y;
  }
  top += thick;
  var poly = [bottom[0], top, bottom[bottom.length - 2], top];
  for (i = bottom.length / 2 - 1; i >= 0; i--) poly.push(bottom[i * 2], bottom[i * 2 + 1]);
  this.chains.push({ pts: poly, closed: true, mat: RR.MAT.rock, depth: 0.4, kind: 'roof' });
  this.feats.push({ t: 'roof', x0: bottom[0], x1: bottom[bottom.length - 2], bot: bottom });
  this._roof = null;
  return this;
};
/* a block hanging over the track: dx metres ahead of the pen, its underside `clear` metres above
   the pen's height, w long and h thick. Touching it with your head ends the run. */
P.beam = function (dx, clear, w, h, style) {
  var x0 = this.x + dx, y0 = this.y + clear, x1 = x0 + w, y1 = y0 + (h || 0.7);
  this.chains.push({ pts: [x0, y1, x1, y1, x1, y0, x0, y0], closed: true, mat: RR.MAT.wood, depth: 0.3, kind: 'beam' });
  this.feats.push({ t: 'beam', x0: x0, x1: x1, y0: y0, y1: y1, style: style || '' });
  return this;
};
/* A slow zone: from here until go(), full gas is the wrong answer. v is the speed (m/s) the
   starter bike should hold. The robot riders use it; the player just has to find out. */
P.slow = function (v) { this._zone = { t: 'zone', x0: this.x, v: v }; return this; };
P.go = function () { var z = this._zone; if (z) { z.x1 = this.x; this.feats.push(z); this._zone = null; } return this; };
/* the track's hidden gear, dx ahead of the pen and dy above it */
/* where the gear should go, roughly: tools/gearspot.js --write rides the track and picks the exact spot in
   [here + dx, here + dx + len] (below: under the ordinary line; minh: at least this high above the ground) */
P.gearHint = function (o) { o = o || {}; var x0 = this.x + (o.dx || 0); this.feats.push({ t: 'gearhint', x0: x0, x1: x0 + (o.len || 40), below: o.below !== false, minh: o.minh || 0 }); return this; };
P.gearAt = function (x, y) { this.feats.push({ t: 'gear', x: x, y: y }); return this; };
P.gear = function (dx, dy) { this.feats.push({ t: 'gear', x: this.x + dx, y: this.y + dy }); return this; };
P.sign = function (kind) { this.feats.push({ t: 'sign', x: this.x, y: this.y, kind: kind }); return this; };

P.finish = function (name, id) {
  this.go();
  this.to(0); this.line(5);
  var fx = this.x;
  this.feats.push({ t: 'finish', x: fx, y: this.y });
  this.line(55);
  this.push(this.x, this.y + 9);
  var main = { pts: this.pts, mats: this.mats, logs: this.logIds, depth: 0.4, kind: 'ground' };
  var chains = [main].concat(this.chains);
  var n = this.pts.length / 2, xs = new Float64Array(n), ys = new Float64Array(n), minY = 1e9, maxY = -1e9;
  for (var i = 0; i < n; i++) {
    xs[i] = this.pts[i * 2]; ys[i] = this.pts[i * 2 + 1];
    if (!this.pit[i] && ys[i] < minY) minY = ys[i];
    if (ys[i] > maxY && xs[i] > -15 && i < n - 1) maxY = ys[i];
  }
  var tr = {
    id: id, name: name, world: this.world.id, gravity: this.world.gravity,
    chains: chains, col: RR.buildCollision(chains), loops: this.loops, hazards: this.hazards, feats: this.feats, forks: this.forks,
    gateN: Math.max(1, this.loops.length, this.forks.length ? 64 + this.forks.length : 0),
    start: this.start, finishX: fx, killY: minY - 14, minY: minY, maxY: maxY, xs: xs, ys: ys, mats: this.mats, logCount: this.logN,
    length: fx - this.start[0]
  };
  return tr;
};
RR.TB = TB;

/* The top surfaces of shelves and bridges (two-route tracks), for the robot's landing guesses. */
function tops(tr) {
  if (tr.tops) return tr.tops;
  tr.tops = [];
  tr.chains.forEach(function (c) {
    if (c.kind === 'bridge') tr.tops.push(c.pts);
    else if (c.kind === 'shelf') { var p = c.pts, t = [], n = p.length / 2, i; for (i = 1; i < n && (i === 1 || p[i * 2] > p[i * 2 - 2]); i++) t.push(p[i * 2], p[i * 2 + 1]); tr.tops.push(t); }
  });
  return tr.tops;
}
function polyY(p, x) { for (var i = 0; i + 3 < p.length; i += 2) if (x >= p[i] && x <= p[i + 2]) { var d = p[i + 2] - p[i]; return d < 1e-9 ? Math.max(p[i + 1], p[i + 3]) : p[i + 1] + (p[i + 3] - p[i + 1]) * (x - p[i]) / d; } return null; }
/* the highest surface at x that is still below y (the main ground, a shelf or a bridge) */
RR.surfaceY = function (tr, x, y) {
  var g = RR.groundY(tr, x), T = tops(tr), i;
  for (i = 0; i < T.length; i++) { var h = polyY(T[i], x); if (h != null && h < y && h > g) g = h; }
  return g;
};
RR.surfaceSlope = function (tr, x, y) { var a = RR.surfaceY(tr, x - 0.3, y), b = RR.surfaceY(tr, x + 0.3, y); return Math.atan2(b - a, 0.6); };
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
