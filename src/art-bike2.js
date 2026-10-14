/* Ridge Riot: drawing the nine Phase 2 bikes.
   Same rules as art-bike.js: canvas paths in metres, y up, origin on the ground under the rear axle.
   Each painter is RR.Art.KIND[kind] = { back?, under, over, top?, fork?, rim?, wheel, forkLower, clamp, bars }.
   d.col entries can be patterns or gradients (paint jobs), so they are only ever used as fills or passed to shade().
   Live inputs read from the view object (g.v), all optional: v.puff (Puffin air blast, 1 = just fired),
   v.stick (Gecko suction left), v.lift (how hard the Albatross wings are working), v.turbo (Spool 600 boost, 0 to 1). */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var A = RR.Art, P = A.parts, KIND = A.KIND;
var shape = A.shape, blob = A.blob, line = A.line, tube = A.tube, circ = A.circ, curve = A.curve, shade = A.shade;
var OUT = P.OUT, FRAME = P.FRAME, ENG = P.ENG, ENGD = P.ENGD, CHROME = P.CHROME, RUB = P.RUB, STEEL = P.STEEL;
var TAU = Math.PI * 2, LAMP = '#fff3b8', GLASS = 'rgba(120,190,255,0.5)', SEAT = '#25272e';

/* ------------------------------ helpers ------------------------------ */
function str(x, alt) { return typeof x === 'string' ? x : alt; }
function vv(g) { return g.v || {}; }
/* a mudguard: an arc round a wheel centre, outlined */
function guard(c, x, y, r, a0, a1, w, col) {
  c.beginPath(); c.arc(x, y, r, a0, a1); c.lineWidth = w + 0.035; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.arc(x, y, r, a0 + 0.02, a1 - 0.02); c.lineWidth = w; c.strokeStyle = col; c.stroke();
}
/* smooth a list of points (x, y, x, y...) into many, through every point (Catmull-Rom) */
function smooth(p, n) {
  var o = [], m = p.length / 2, i, k;
  function pt(j) { j = Math.max(0, Math.min(m - 1, j)); return [p[j * 2], p[j * 2 + 1]]; }
  for (i = 0; i < m - 1; i++) {
    var p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
    for (k = 0; k < n; k++) {
      var t = k / n, t2 = t * t, t3 = t2 * t;
      o.push(0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3));
    }
  }
  o.push(p[p.length - 2], p[p.length - 1]);
  return o;
}
/* a tapering band along a smooth centre line: w0 wide at the start, w1 at the end */
function ribbon(c, pts, w0, w1, fill, lw) {
  var q = smooth(pts, 8), m = q.length / 2, L = [], R = [], i;
  for (i = 0; i < m; i++) {
    var a = Math.max(0, i - 1), b = Math.min(m - 1, i + 1), dx = q[b * 2] - q[a * 2], dy = q[b * 2 + 1] - q[a * 2 + 1], dl = Math.sqrt(dx * dx + dy * dy) || 1;
    var w = (w0 + (w1 - w0) * i / (m - 1)) / 2, nx = -dy / dl * w, ny = dx / dl * w;
    L.push(q[i * 2] + nx, q[i * 2 + 1] + ny); R.unshift(q[i * 2] - nx, q[i * 2 + 1] - ny);
  }
  shape(c, L.concat(R), fill, lw);
}
/* points of a closed rounded outline, without drawing (blob's path) */
function blobPath(c, p) {
  var n = p.length / 2, i;
  c.moveTo((p[0] + p[2 * n - 2]) / 2, (p[1] + p[2 * n - 1]) / 2);
  for (i = 0; i < n; i++) { var j = (i + 1) % n; c.quadraticCurveTo(p[i * 2], p[i * 2 + 1], (p[i * 2] + p[j * 2]) / 2, (p[i * 2 + 1] + p[j * 2 + 1]) / 2); }
  c.closePath();
}
function slot(c, x0, y0, x1, y1, r) {      // a rounded slot from (x0,y0) to (x1,y1), as a sub-path
  var a = Math.atan2(y1 - y0, x1 - x0);
  c.moveTo(x0 + Math.cos(a + Math.PI / 2) * r, y0 + Math.sin(a + Math.PI / 2) * r);
  c.arc(x0, y0, r, a + Math.PI / 2, a + Math.PI * 1.5);
  c.arc(x1, y1, r, a - Math.PI / 2, a + Math.PI / 2);
  c.closePath();
}
function bolt(c, x, y, r) { circ(c, x, y, r || 0.018, CHROME, 0.01); }
/* unit vector along the fork (axle towards head) and its length */
function forkDir(g) { var dx = g.HT[0] - g.FA[0], dy = g.HT[1] - g.FA[1], L = Math.sqrt(dx * dx + dy * dy) || 1; return [dx / L, dy / L, L]; }
function snowflake(c, x, y, r, col) {
  var i; c.lineWidth = r * 0.28; c.strokeStyle = col; c.beginPath();
  for (i = 0; i < 3; i++) { var a = i * Math.PI / 3 + 0.26; c.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  c.stroke();
}
function icicles(c, pts, col) {          // little hanging icicles: [x, y, length, ...]
  for (var i = 0; i < pts.length; i += 3) shape(c, [pts[i] - 0.022, pts[i + 1], pts[i] + 0.022, pts[i + 1], pts[i] + 0.004, pts[i + 1] - pts[i + 2]], col, 0.012);
}

/* ------------------------------ tyre treads (drawn turning with the wheel) ------------------------------ */
/* steel studs: two rows, and the outer row pokes out of the tyre */
function studs(c, r, ri, st, v, rate) {
  var n = Math.max(14, Math.round(r * 64)), i, a;
  if (rate > 28 || rate < -28) {
    c.beginPath(); c.arc(0, 0, r - 0.012, 0, TAU); c.lineWidth = 0.016; c.strokeStyle = 'rgba(225,235,245,0.55)'; c.stroke();
    return;
  }
  for (i = 0; i < n; i++) {
    a = TAU * i / n;
    var ca = Math.cos(a), sa = Math.sin(a);
    tube(c, [ca * (r - 0.012), sa * (r - 0.012), ca * (r + 0.018), sa * (r + 0.018)], 0.013, '#dfe6ee', 0.012);
    a += Math.PI / n; ca = Math.cos(a); sa = Math.sin(a);
    circ(c, ca * (r - (r - ri) * 0.45), sa * (r - (r - ri) * 0.45), 0.011, '#c9d2dc', 0.008);
  }
}
/* sand paddles: big scoops standing out of the tyre */
function paddles(c, r, ri, st, v, rate) {
  var n = 10, i;
  for (i = 0; i < n; i++) {
    var a = TAU * i / n;
    var p = [[a - 0.17, r - 0.035], [a - 0.15, r + 0.04], [a - 0.07, r + 0.085], [a - 0.02, r + 0.07], [a + 0.0, r + 0.02], [a + 0.08, r - 0.03]], q = [], k;
    for (k = 0; k < p.length; k++) q.push(Math.cos(p[k][0]) * p[k][1], Math.sin(p[k][0]) * p[k][1]);
    blob(c, q, '#2a2b31', 0.02);
    line(c, [Math.cos(a - 0.12) * (r + 0.03), Math.sin(a - 0.12) * (r + 0.03), Math.cos(a - 0.05) * (r + 0.065), Math.sin(a - 0.05) * (r + 0.065)], 0.014, '#4a4c55');
  }
}
/* gecko toe pads: soft oval pads with ridges, glowing faintly while they still stick */
function pads(c, r, ri, st, v, rate) {
  var n = Math.max(9, Math.round(r * 36)), i, k, s = Math.max(0, Math.min(1, v.stick || 0)), rm = r - (r - ri) * 0.3;
  for (i = 0; i < n; i++) {
    var a = TAU * i / n;
    c.save(); c.rotate(a); c.translate(rm, 0);
    c.beginPath(); c.ellipse(0, 0, (r - ri) * 0.36, TAU * rm / n * 0.4, 0, 0, TAU);
    c.fillStyle = '#4b5640'; c.fill(); c.lineWidth = 0.012; c.strokeStyle = OUT; c.stroke();
    c.lineWidth = 0.008; c.strokeStyle = '#6b7a5c'; c.beginPath();
    for (k = -1; k <= 1; k++) { c.moveTo((r - ri) * 0.25, k * 0.016); c.lineTo(-(r - ri) * 0.22, k * 0.016); }
    c.stroke();
    if (s > 0) { c.beginPath(); c.ellipse(0, 0, (r - ri) * 0.4, TAU * rm / n * 0.46, 0, 0, TAU); c.fillStyle = 'rgba(150,255,140,' + (0.55 * s).toFixed(3) + ')'; c.fill(); }
    c.restore();
  }
}

/* =============================== 1. Puffin 150 =============================== */
/* a light trail bike with a compressed-air tank under the seat and a nozzle pointing at the ground */
function airBurst(c, x, y, k) {
  if (!(k > 0)) return;
  k = Math.min(1, k);
  var s = 1 - k, i, cs = [];
  for (i = 0; i < 5; i++) cs.push([x + (i % 2 ? 1 : -1) * (0.015 + i * 0.016 + s * 0.04), y - 0.05 - s * 0.08 - i * (0.055 + s * 0.05), 0.035 + i * 0.01 + s * 0.05]);
  c.save(); c.globalAlpha = Math.min(1, k * 1.5);
  // streaks straight down out of the nozzle
  for (i = -1; i <= 1; i++) line(c, [x + i * 0.04, y - 0.02, x + i * (0.07 + s * 0.06), y - 0.22 - s * 0.2], 0.014, 'rgba(255,255,255,0.8)');
  c.lineWidth = 0.03; c.strokeStyle = '#8fa3b5';
  for (i = 0; i < cs.length; i++) { c.beginPath(); c.arc(cs[i][0], cs[i][1], cs[i][2], 0, TAU); c.stroke(); }
  c.fillStyle = '#ffffff';
  for (i = 0; i < cs.length; i++) { c.beginPath(); c.arc(cs[i][0], cs[i][1], cs[i][2], 0, TAU); c.fill(); }
  c.fillStyle = '#d8e6ef';
  for (i = 0; i < cs.length; i++) { c.beginPath(); c.arc(cs[i][0] + cs[i][2] * 0.25, cs[i][1] - cs[i][2] * 0.3, cs[i][2] * 0.55, 0, TAU); c.fill(); }
  c.restore();
}
KIND.puffer = {
  under: function (c, d, g) {
    var k = d.col;
    P.swingarm(c, g, STEEL, 0.055); P.chain(c, g);
    P.shock(c, 0.40, 0.50, 0.48, 0.83, k[2]);
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.14, 0.93, 0.48, 0.66, 0.3, g.SP[0], g.SP[1] - 0.06], 0.036, FRAME);
    tube(c, [g.HT[0] - 0.03, g.HT[1] - 0.06, 0.68, 0.86, g.SP[0], g.SP[1] + 0.02], 0.05, FRAME);
    tube(c, [0.58, 0.86, -0.04, 0.93], 0.03, FRAME);
    tube(c, [g.SP[0], g.SP[1] + 0.08, 0.06, 0.9], 0.026, FRAME);
    P.cases(c, 0.66, 0.43, 0.12);
    P.fins(c, 0.72, 0.52, 0.81, 0.76, 0.07, 6);
    // header down the front, silencer tucked under the engine
    curve(c, [0.87, 0.7, 0.99, 0.6, 0.98, 0.4, 0.9, 0.3, 0.72, 0.26], 0.042, '#c9a56a');
    blob(c, [0.76, 0.31, 0.5, 0.33, 0.38, 0.3, 0.38, 0.22, 0.5, 0.19, 0.76, 0.21], '#3a3f4b', 0.024);
    line(c, [0.52, 0.29, 0.72, 0.28], 0.016, '#5d636e');
    circ(c, 0.38, 0.26, 0.04, CHROME, 0.016); circ(c, 0.37, 0.26, 0.018, '#22252d', 0);
    // radiator
    shape(c, [0.88, 0.9, 0.97, 0.88, 0.93, 0.66, 0.85, 0.68], '#30333c', 0.02);
  },
  over: function (c, d, g) {
    var k = d.col, v = vv(g), puff = Math.max(0, Math.min(1, v.puff || 0));
    // rear fender and the white panel under the seat
    blob(c, [0.34, 0.97, -0.1, 1.02, -0.38, 1.1, -0.36, 1.03, -0.03, 0.9, 0.3, 0.86], k[0]);
    blob(c, [0.3, 0.9, 0.54, 0.89, 0.5, 0.72, 0.36, 0.74], k[1], 0.02);
    // seat: black, like a puffin's back
    blob(c, [0.02, 1.0, 0.4, 0.97, 0.7, 0.98, 0.74, 0.92, 0.4, 0.9, 0.06, 0.94], SEAT);
    // tank and shroud, white "chest" panel
    blob(c, [0.62, 0.94, 0.84, 1.06, 1.03, 1.05, 1.06, 0.91, 0.98, 0.71, 0.86, 0.62, 0.76, 0.77], k[0]);
    blob(c, [0.83, 0.93, 1.0, 0.91, 0.96, 0.75, 0.88, 0.7, 0.8, 0.8], k[1], 0.016);
    line(c, [0.66, 0.99, 0.84, 1.02], 0.026, k[2]);
    // the compressed-air tank: a fat bottle with bands, a gauge on the back and a valve and nozzle underneath
    tube(c, [0.07, 0.75, 0.36, 0.72], 0.15, '#e6ebef', 0.04);
    line(c, [0.1, 0.79, 0.33, 0.765], 0.025, 'rgba(255,255,255,0.85)');
    line(c, [0.17, 0.81, 0.165, 0.68], 0.03, k[2]); line(c, [0.29, 0.8, 0.285, 0.67], 0.03, k[2]);
    tube(c, [0.31, 0.665, 0.33, 0.58], 0.03, CHROME, 0.024);
    shape(c, [0.3, 0.62, 0.36, 0.62, 0.36, 0.58, 0.3, 0.58], k[2], 0.014);
    shape(c, [0.305, 0.565, 0.355, 0.565, 0.385, 0.49, 0.275, 0.49], '#4a4f5a', 0.018);
    line(c, [0.29, 0.5, 0.37, 0.5], 0.012, '#22252d');
    var gx = 0.03, gy = 0.755;
    circ(c, gx, gy, 0.056, '#2b2f38', 0.02); circ(c, gx, gy, 0.042, '#fbfaf3', 0);
    c.lineWidth = 0.008; c.strokeStyle = '#2b2f38'; c.beginPath();
    for (var i = 0; i < 5; i++) { var ta = 2.6 - i * 0.62; c.moveTo(gx + Math.cos(ta) * 0.03, gy + Math.sin(ta) * 0.03); c.lineTo(gx + Math.cos(ta) * 0.04, gy + Math.sin(ta) * 0.04); }
    c.stroke();
    var na = 0.4 + puff * 1.9;                          // needle drops when the air has just gone
    line(c, [gx, gy, gx + Math.cos(na) * 0.034, gy + Math.sin(na) * 0.034], 0.01, '#e8483a'); circ(c, gx, gy, 0.008, '#2b2f38', 0);
    // front fender that ends in a puffin's beak (grey base, yellow band, orange tip)
    var fy = g.HT[1] - 0.16, fx = g.HT[0] + 0.04;
    blob(c, [fx - 0.14, fy + 0.03, fx + 0.12, fy + 0.03, fx + 0.12, fy - 0.08, fx - 0.12, fy - 0.03], k[0]);
    shape(c, [fx + 0.1, fy + 0.05, fx + 0.22, fy + 0.04, fx + 0.47, fy - 0.07, fx + 0.22, fy - 0.11, fx + 0.1, fy - 0.1], k[2], 0.022);
    shape(c, [fx + 0.1, fy + 0.05, fx + 0.16, fy + 0.045, fx + 0.16, fy - 0.105, fx + 0.1, fy - 0.1], '#6d7f8f', 0.016);
    line(c, [fx + 0.21, fy + 0.035, fx + 0.21, fy - 0.1], 0.02, '#f2c230');
    line(c, [fx + 0.27, fy + 0.01, fx + 0.45, fy - 0.07], 0.01, shade(k[2], 0.6));
    // front number plate with a puffin's eye on it
    blob(c, [g.HT[0] + 0.0, g.HT[1] + 0.14, g.HT[0] + 0.11, g.HT[1] + 0.1, g.HT[0] + 0.13, g.HT[1] - 0.1, g.HT[0] + 0.03, g.HT[1] - 0.12], k[1]);
    circ(c, g.HT[0] + 0.07, g.HT[1] + 0.03, 0.03, '#e8483a', 0.012); circ(c, g.HT[0] + 0.075, g.HT[1] + 0.03, 0.016, OUT, 0);
    line(c, [g.HT[0] + 0.035, g.HT[1] - 0.01, g.HT[0] + 0.01, g.HT[1] - 0.05], 0.01, '#6d7f8f');
    airBurst(c, 0.33, 0.48, puff);
  },
  wheel: [{ tyre: 0.27, knob: 1, type: 'spoke' }, { tyre: 0.24, knob: 1, type: 'spoke' }], guard: true, forkLower: 0.36, clamp: 0.16, bars: 0.4,
  rim: function () { return '#2b2f38'; } };

/* =============================== 2. Spool 600 =============================== */
/* a flat-track street tracker: low and flat, number boards, a big single, and a turbocharger the size of
   a melon hung on the front of the engine. The compressor's snail faces us with its intake in the middle;
   the iron turbine housing peeks out behind it and glows as the boost builds (v.turbo, 0 to 1). */
var IRON = '#4b4643', ALU = '#c9ced5', ALUD = '#8f969f', TURBO_OR = '#ff6a00';
/* a colour between two '#rrggbb' colours */
function mix(a, b, k) {
  var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), r = ((x >> 16) * (1 - k) + (y >> 16) * k) | 0, gg = (((x >> 8) & 255) * (1 - k) + ((y >> 8) & 255) * k) | 0, bb = ((x & 255) * (1 - k) + (y & 255) * k) | 0;
  return 'rgb(' + r + ',' + gg + ',' + bb + ')';
}
function boostOf(g) { var b = vv(g).turbo; return b > 0 ? Math.min(1, b) : 0; }
/* the outline of a snail (volute) round (cx, cy) as a sub-path: one turn, counter-clockwise from angle a0,
   the radius growing from r0 to r1 */
function volute(c, cx, cy, r0, r1, a0) {
  var n = 32, i;
  for (i = 0; i <= n; i++) { var th = a0 + TAU * i / n, r = r0 + (r1 - r0) * i / n; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(th) * r, cy + Math.sin(th) * r); }
  c.closePath();
}
/* a "6" drawn with strokes, h tall, sitting on (x, y) */
function six(c, x, y, h, col) {
  c.lineWidth = h * 0.2; c.strokeStyle = col; c.beginPath();
  c.arc(x, y + h * 0.29, h * 0.26, 0, TAU);
  c.moveTo(x - h * 0.26, y + h * 0.29); c.quadraticCurveTo(x - h * 0.28, y + h * 0.95, x + h * 0.2, y + h * 0.92);
  c.stroke();
}
/* an oval number board, tilted by a, with a six on it */
function board(c, x, y, rx, ry, a, fill, num) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fillStyle = fill; c.fill(); c.lineWidth = 0.024; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.ellipse(0, 0, rx - 0.02, ry - 0.02, 0, 0, TAU); c.lineWidth = 0.01; c.strokeStyle = 'rgba(0,0,0,0.18)'; c.stroke();
  six(c, 0, -ry * 0.62, ry * 1.25, num);
  c.restore();
}
/* flat-track tyre: a fine block tread round the edge */
function trackTread(c, r, ri, st, v, rate) {
  if (rate > 28 || rate < -28) return;
  var n = Math.max(16, Math.round(r * 74)), i;
  c.lineWidth = 0.014; c.strokeStyle = '#3a3c45'; c.beginPath();
  for (i = 0; i < n; i++) { var a = TAU * i / n, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(a + 0.05), sb = Math.sin(a + 0.05); c.moveTo(ca * (r - 0.006), sa * (r - 0.006)); c.lineTo(cb * (r - 0.034), sb * (r - 0.034)); }
  c.stroke();
}
/* the compressor snail on its own (also worn by the rider in the "blowoff" crash): centre at 0,0, the outlet
   rising at the right. b = boost (spins the wheel and warms the rim), t = time, nose = the colour of the nut */
function snail(c, b, t, nose, hot) {
  var i, n = 30, u, th;
  function ro(u) { return 0.1 + 0.115 * u; }            // the outside of the scroll
  function ri(u) { return 0.094 + 0.03 * u; }           // its inner wall, where the flat face starts
  c.beginPath(); volute(c, 0, 0, ro(0), ro(1), 0);
  c.fillStyle = ALU; c.fill();
  // the scroll: a band that widens as it goes round, shaded like a tube, with a polished streak along it
  c.beginPath();
  for (i = 0; i <= n; i++) { u = i / n; th = TAU * u; c[i ? 'lineTo' : 'moveTo'](Math.cos(th) * ro(u), Math.sin(th) * ro(u)); }
  for (i = n; i >= 0; i--) { u = i / n; th = TAU * u; c.lineTo(Math.cos(th) * ri(u), Math.sin(th) * ri(u)); }
  c.closePath(); c.fillStyle = '#a7aeb7'; c.fill();
  c.beginPath();
  for (i = 0; i <= n; i++) { u = i / n; th = TAU * u; c[i ? 'lineTo' : 'moveTo'](Math.cos(th) * ri(u), Math.sin(th) * ri(u)); }
  c.lineWidth = 0.012; c.strokeStyle = '#6f7680'; c.stroke();
  c.beginPath();
  for (i = 6; i <= 17; i++) { u = i / n; th = TAU * u; var rm = ro(u) * 0.6 + ri(u) * 0.4; c[i > 6 ? 'lineTo' : 'moveTo'](Math.cos(th) * rm, Math.sin(th) * rm); }
  c.lineWidth = 0.016; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
  c.beginPath(); volute(c, 0, 0, ro(0), ro(1), 0); c.lineWidth = 0.028; c.strokeStyle = OUT; c.stroke();
  // the outlet: the end of the scroll turning up into a neck with a flange
  shape(c, [ri(1) + 0.005, -0.012, ro(1), -0.012, 0.195, 0.12, 0.14, 0.12], '#a7aeb7', 0.024);
  line(c, [0.165, -0.0, 0.17, 0.105], 0.012, 'rgba(255,255,255,0.8)');
  shape(c, [0.125, 0.11, 0.21, 0.11, 0.21, 0.14, 0.125, 0.14], '#2b2f38', 0.016);
  if (hot > 0.02) { c.beginPath(); c.arc(0, 0, 0.19, 3.3, 4.9); c.lineWidth = 0.022; c.strokeStyle = 'rgba(255,120,40,' + (0.8 * hot).toFixed(3) + ')'; c.stroke(); }
  // the intake: a bellmouth with the compressor wheel turning inside, faster with boost, behind a mesh guard
  circ(c, 0, 0, 0.08, CHROME, 0.024);
  c.beginPath(); c.arc(0, 0, 0.071, 2.0, 3.4); c.lineWidth = 0.01; c.strokeStyle = '#ffffff'; c.stroke();
  circ(c, 0, 0, 0.06, '#1e2027', 0.016);
  c.save(); c.rotate(-t * (3 + 16 * b));
  c.lineWidth = 0.014; c.strokeStyle = '#b9c0c8'; c.beginPath();
  for (i = 0; i < 7; i++) { var ba = TAU * i / 7; c.moveTo(Math.cos(ba) * 0.014, Math.sin(ba) * 0.014); c.quadraticCurveTo(Math.cos(ba + 0.5) * 0.04, Math.sin(ba + 0.5) * 0.04, Math.cos(ba + 0.95) * 0.054, Math.sin(ba + 0.95) * 0.054); }
  c.stroke();
  c.restore();
  if (b > 0.5) { c.beginPath(); c.arc(0, 0, 0.04, 0, TAU); c.lineWidth = 0.034; c.strokeStyle = 'rgba(185,192,200,' + ((b - 0.5) * 0.7).toFixed(3) + ')'; c.stroke(); }
  circ(c, 0, 0, 0.017, nose, 0.01);
  c.lineWidth = 0.006; c.strokeStyle = 'rgba(210,215,222,0.5)'; c.beginPath();
  for (i = -2; i <= 2; i++) { c.moveTo(i * 0.02, -0.054); c.lineTo(i * 0.02, 0.054); c.moveTo(-0.054, i * 0.02); c.lineTo(0.054, i * 0.02); }
  c.stroke();
  for (i = 0; i < 3; i++) { var ca = 1.9 + i * 1.5; bolt(c, Math.cos(ca) * 0.104, Math.sin(ca) * 0.104, 0.012); }
}
A.turboSnail = snail;
var TC = [0.99, 0.5], TT = [0.9, 0.41];          // compressor and turbine centres
KIND.turbo = {
  under: function (c, d, g) {
    var k = d.col, sx = g.SP[0], sy = g.SP[1], b = boostOf(g), hot = Math.pow(b, 1.4), i;
    P.swingarm(c, g, '#2b2f38', 0.06); P.chain(c, g);
    P.shock(c, 0.36, 0.5, 0.45, 0.83, k[0]);
    // frame: a low, flat backbone
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.13, 1.03, 0.52, 0.82, 0.3, sx, sy - 0.06], 0.036, FRAME);
    tube(c, [g.HT[0] - 0.03, g.HT[1] - 0.05, 0.66, 0.84, sx, sy + 0.02], 0.048, FRAME);
    tube(c, [0.58, 0.84, -0.06, 0.88], 0.03, FRAME);
    tube(c, [sx, sy + 0.08, 0.08, 0.86], 0.026, FRAME);
    // the big single, its cylinder leaning forward, and the plenum the boost is fed into behind it
    P.cases(c, 0.64, 0.42, 0.13);
    P.fins(c, 0.7, 0.53, 0.8, 0.77, 0.08, 7);
    blob(c, [0.5, 0.66, 0.5, 0.78, 0.64, 0.8, 0.68, 0.7, 0.6, 0.62], '#30333c', 0.02);
    line(c, [0.53, 0.72, 0.63, 0.73], 0.012, ALUD);
    // downpipe out of the bottom of the turbine, straight back under the engine into a short black silencer under the tail
    var pipe = mix('#4d4844', '#e8501c', hot * 0.7);
    curve(c, [0.86, 0.3, 0.8, 0.2, 0.6, 0.2, 0.42, 0.35], 0.05, pipe);
    tube(c, [0.42, 0.37, 0.02, 0.56], 0.085, '#2b2f38');
    line(c, [0.36, 0.415, 0.06, 0.555], 0.014, '#5d636e');
    shape(c, [0.27, 0.495, 0.33, 0.47, 0.31, 0.43, 0.25, 0.455], '#5d636e', 0.012);         // heat shield strap
    tube(c, [0.04, 0.55, -0.03, 0.585], 0.07, k[0], 0.03);
    circ(c, -0.035, 0.585, 0.022, '#15171d', 0);
    // header from the head down into the top of the turbine
    curve(c, [0.83, 0.76, 0.9, 0.72, 0.92, 0.62], 0.045, mix('#4d4844', '#ff7a2a', hot * 0.8));
    // the turbine housing: cast iron, red hot under boost, the inlet at the top where the header comes in
    c.beginPath(); volute(c, TT[0], TT[1], 0.13, 0.2, Math.PI * 0.6);
    c.fillStyle = mix(IRON, '#e8501c', hot * 0.85); c.fill(); c.lineWidth = 0.026; c.strokeStyle = OUT; c.stroke();
    if (hot > 0.02) { c.beginPath(); c.arc(TT[0], TT[1], 0.165, 2.6, 4.1); c.lineWidth = 0.016; c.strokeStyle = 'rgba(255,220,130,' + (0.9 * hot).toFixed(3) + ')'; c.stroke(); }
    if (hot > 0.02) {
      var hg = c.createRadialGradient(TT[0], TT[1], 0.05, TT[0], TT[1], 0.36);
      hg.addColorStop(0, 'rgba(255,150,60,' + (0.6 * hot).toFixed(3) + ')'); hg.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = hg; c.beginPath(); c.arc(TT[0], TT[1], 0.36, 0, TAU); c.fill();
    }
    if (g.wrecked) {
      // the compressor half has gone (it went with the rider): a bare flange and three studs
      circ(c, TC[0], TC[1], 0.1, '#5d636e', 0.024); circ(c, TC[0], TC[1], 0.05, '#22252d', 0.016);
      for (i = 0; i < 3; i++) { var sa = 0.6 + i * 2.1; line(c, [TC[0] + Math.cos(sa) * 0.075, TC[1] + Math.sin(sa) * 0.075, TC[0] + Math.cos(sa) * 0.075 + 0.012, TC[1] + Math.sin(sa) * 0.075 + 0.012], 0.016, CHROME); }
    }
  },
  over: function (c, d, g) {
    var k = d.col, b = boostOf(g), hot = Math.pow(b, 1.4), t = vv(g).t || 0, i;
    // tail: a little hump in the body colour, the long flat seat, the side number board under it
    blob(c, [0.12, 0.96, -0.12, 1.02, -0.34, 1.06, -0.36, 0.98, -0.16, 0.88, 0.1, 0.86], k[0]);
    line(c, [-0.33, 1.02, -0.12, 0.98], 0.022, k[2]);
    circ(c, -0.355, 0.99, 0.022, '#e8483a', 0.012);
    shape(c, [-0.02, 0.88, 0.48, 0.86, 0.46, 0.64, 0.06, 0.66], k[1], 0.022);
    board(c, 0.24, 0.765, 0.19, 0.1, -0.05, k[2], k[1]);
    blob(c, [0.0, 0.95, 0.36, 0.93, 0.68, 0.94, 0.72, 0.88, 0.36, 0.86, 0.04, 0.89], SEAT);
    line(c, [0.06, 0.93, 0.6, 0.915], 0.01, '#3a3d46');
    // the small tank, white stripe and a black knee panel
    blob(c, [0.62, 0.88, 0.72, 1.02, 0.98, 1.05, 1.08, 0.97, 1.04, 0.85, 0.8, 0.82], k[0]);
    line(c, [0.7, 0.975, 1.02, 0.995], 0.034, k[2]);
    line(c, [0.71, 0.94, 1.03, 0.955], 0.012, k[1]);
    blob(c, [0.68, 0.86, 0.72, 0.93, 0.84, 0.92, 0.86, 0.85, 0.76, 0.83], k[1], 0.014);
    circ(c, 0.86, 1.04, 0.022, CHROME, 0.01);
    // the intercooler pipe: up out of the compressor, round the blow-off valve, through the intercooler core
    // under the tank, and back to the plenum behind the cylinder
    var px = TC[0] + 0.163, py = TC[1] + 0.14;
    curve(c, [px, py - 0.01, px + 0.01, py + 0.12, 1.1, 0.83, 0.96, 0.81, 0.8, 0.8, 0.66, 0.76], 0.05, ALU, 0.03);
    line(c, [px - 0.012, py + 0.02, px - 0.006, py + 0.11, 1.09, 0.815], 0.012, '#ffffff');
    tube(c, [px, py + 0.005, px + 0.003, py + 0.06], 0.058, k[1], 0.026);                       // silicone joiner
    line(c, [px - 0.032, py + 0.015, px + 0.033, py + 0.015], 0.012, CHROME); line(c, [px - 0.031, py + 0.05, px + 0.034, py + 0.05], 0.012, CHROME);
    shape(c, [0.86, 0.835, 1.0, 0.835, 1.0, 0.765, 0.86, 0.765], '#22252d', 0.02);           // intercooler core
    c.lineWidth = 0.008; c.strokeStyle = '#6a707b'; c.beginPath();
    for (i = 1; i < 9; i++) { c.moveTo(0.86 + i * 0.0155, 0.772); c.lineTo(0.86 + i * 0.0155, 0.828); }
    c.stroke();
    shape(c, [0.84, 0.845, 0.865, 0.845, 0.865, 0.755, 0.84, 0.755], k[2], 0.016); shape(c, [0.995, 0.845, 1.02, 0.845, 1.02, 0.755, 0.995, 0.755], k[2], 0.016);
    // the blow-off valve on the front of the bend: a black body, an orange cap, a vent underneath
    var bx = px + 0.03, by = py + 0.1;
    tube(c, [bx, by, bx + 0.07, by + 0.035], 0.062, '#2b2f38', 0.026);
    shape(c, [bx + 0.06, by + 0.085, bx + 0.11, by - 0.015, bx + 0.135, by - 0.002, bx + 0.085, by + 0.098], k[0], 0.018);
    line(c, [bx + 0.03, by - 0.025, bx + 0.045, by - 0.05], 0.022, '#2b2f38');
    line(c, [bx + 0.015, by + 0.02, bx + 0.06, by + 0.042], 0.01, '#5d636e');
    if (!g.wrecked) {
      c.save(); c.translate(TC[0], TC[1]); snail(c, b, t, str(k[0], TURBO_OR), hot); c.restore();
    } else curve(c, [px, py - 0.01, px - 0.02, py - 0.1, px + 0.02, py - 0.16], 0.05, '#2b2f38', 0.03);     // the hose, hanging loose
    // a stub of front mudguard, and the front number board on the fork
    var u = forkDir(g);
    guard(c, g.FA[0], g.FA[1], d.rf + 0.035, 0.75 + Math.atan2(u[1], u[0]) - 1.1, 2.25, 0.045, k[1]);
    board(c, g.HT[0] + 0.11, g.HT[1] - 0.02, 0.11, 0.155, Math.atan2(u[1], u[0]) - Math.PI / 2, k[2], k[1]);
  },
  top: function (c, d, g) {
    // the boost gauge on the bar clamp: white face, orange top of the scale, needle swings with the boost
    var k = d.col, b = boostOf(g), gx = g.HT[0] + 0.03, gy = g.HT[1] + 0.13, i, a;
    tube(c, [g.HT[0] - 0.01, g.HT[1] + 0.02, gx - 0.01, gy - 0.05], 0.022, '#2b2f38', 0.02);
    circ(c, gx, gy, 0.072, '#1e2027', 0.022);
    circ(c, gx, gy, 0.056, '#f6f4ec', 0);
    c.beginPath(); c.arc(gx, gy, 0.045, Math.PI * 1.25 - Math.PI * 1.5, Math.PI * 1.25 - Math.PI * 1.5 * 0.65, true);
    c.lineWidth = 0.014; c.strokeStyle = k[0]; c.stroke();
    c.lineWidth = 0.007; c.strokeStyle = '#1e2027'; c.beginPath();
    for (i = 0; i <= 4; i++) { a = Math.PI * 1.25 - Math.PI * 1.5 * i / 4; c.moveTo(gx + Math.cos(a) * 0.036, gy + Math.sin(a) * 0.036); c.lineTo(gx + Math.cos(a) * 0.05, gy + Math.sin(a) * 0.05); }
    c.stroke();
    a = Math.PI * 1.25 - Math.PI * 1.5 * b;
    line(c, [gx - Math.cos(a) * 0.01, gy - Math.sin(a) * 0.01, gx + Math.cos(a) * 0.046, gy + Math.sin(a) * 0.046], 0.011, '#e8341c');
    circ(c, gx, gy, 0.011, '#1e2027', 0);
    if (b > 0.97) circ(c, gx + 0.05, gy + 0.05, 0.016, '#ffb02a', 0.008);        // full-boost lamp
  },
  wheel: [{ tyre: 0.24, knob: 0, type: 'spoke', tread: trackTread }, { tyre: 0.24, knob: 0, type: 'spoke', tread: trackTread }], forkLower: 0.3, clamp: 0.14, bars: 0.35,
  rim: function (d) { return str(d.col[1], '#2b2f38'); } };

/* =============================== 3. Odd Couple =============================== */
/* a 1950s outfit: boxer twin, shaft drive, deep mudguards, big headlamp. The sidecar and its
   passenger are on the far side of the bike, so they are drawn first, behind everything. */
KIND.sidecar = {
  openFace: true,
  back: function (c, d, g) {
    var k = d.col, s = d.suit, v = vv(g), t = v.t || 0, i;
    // third wheel, a little higher than the bike's (it is further away), in shadow
    var wr = 0.25, wx = 0.98, wy = 0.32;
    tube(c, [wx, wy, 0.86, 0.5], 0.04, FRAME, 0.03); tube(c, [wx, wy, 1.12, 0.5], 0.04, FRAME, 0.03);
    A.wheel(c, wx, wy, wr, (v.spinR || 0) * d.rr / wr, { tyre: 0.26, knob: 0, type: 'spoke', rim: CHROME, brake: 0 }, v.rateR || 0, v);
    circ(c, wx, wy, wr + 0.005, 'rgba(20,24,34,0.32)', 0);
    // the boat: a long cream torpedo with a red flash, sticking out past both of the bike's wheels
    var body = [-0.34, 0.68, -0.26, 0.88, 0.4, 1.0, 1.4, 1.0, 1.92, 0.88, 2.06, 0.72, 1.82, 0.56, 1.0, 0.5, 0.0, 0.54];
    blob(c, body, k[1]);
    blob(c, [-0.2, 0.6, 0.9, 0.53, 1.7, 0.58, 1.94, 0.68, 1.3, 0.62, 0.3, 0.64], 'rgba(0,0,0,0.2)', 0);
    blob(c, [-0.28, 0.8, 0.5, 0.84, 1.5, 0.84, 2.0, 0.76, 1.5, 0.76, 0.5, 0.74, -0.3, 0.72], k[0], 0.014);
    curve(c, [-0.3, 0.71, 0.6, 0.7, 1.5, 0.71, 2.02, 0.68], 0.018, CHROME, 0.014);
    circ(c, 1.96, 0.79, 0.035, LAMP, 0.014);
    // cockpit opening
    c.beginPath(); c.ellipse(1.12, 0.98, 0.26, 0.05, 0, 0, TAU); c.fillStyle = '#2a2118'; c.fill(); c.lineWidth = 0.02; c.strokeStyle = OUT; c.stroke();
    if (v.rider !== false) {
      // the passenger: jacket, arm on the grab rail, scarf flying back, open helmet and goggles
      var hx = 1.2, hy = 1.42, sx = 1.15, sy = 1.24, w = Math.sin(t * 8) * 0.03;
      blob(c, [sx - 0.02, sy - 0.02, sx - 0.2, sy - 0.03 + w, sx - 0.36, sy - 0.06 - w, sx - 0.22, sy - 0.1 + w, sx - 0.04, sy - 0.1], k[0], 0.018);
      blob(c, [1.04, 0.96, 1.05, sy + 0.04, 1.18, sy + 0.08, 1.28, sy, 1.26, 0.96], s[1]);
      line(c, [1.07, 1.12, 1.27, 1.1], 0.02, shade(s[1], 0.75));
      tube(c, [sx + 0.03, sy - 0.03, 1.3, 1.12, 1.4, 1.05], 0.07, shade(s[1], 0.85), 0.03);
      circ(c, 1.41, 1.05, 0.035, s[2], 0.014);
      tube(c, [sx, sy, hx - 0.01, hy - 0.08], 0.06, '#2b2f38', 0.03);
      circ(c, hx, hy, 0.13, s[0]);
      blob(c, [hx + 0.02, hy + 0.03, hx + 0.13, hy + 0.02, hx + 0.13, hy - 0.08, hx + 0.08, hy - 0.13, hx + 0.0, hy - 0.11], '#e8b890', 0.016);
      line(c, [hx - 0.12, hy + 0.0, hx + 0.06, hy + 0.01], 0.02, '#2b2f38');
      circ(c, hx + 0.085, hy + 0.0, 0.042, '#2b2f38', 0.014); circ(c, hx + 0.09, hy + 0.003, 0.026, '#ffd24a', 0);
      c.beginPath(); c.arc(hx, hy, 0.1, 0.9, 2.6); c.lineWidth = 0.022; c.strokeStyle = s[1]; c.stroke();
      line(c, [hx + 0.03, hy - 0.08, hx + 0.08, hy - 0.08], 0.01, '#8a4a3a');
    }
    // the deck in front of the passenger, a little screen, the grab rail
    blob(c, [0.98, 1.02, 1.36, 1.03, 1.86, 0.9, 1.9, 0.78, 1.36, 0.8, 0.98, 0.86], k[1]);
    line(c, [1.46, 0.99, 1.84, 0.87], 0.02, k[0]);
    shape(c, [1.34, 1.02, 1.44, 1.0, 1.39, 1.17, 1.3, 1.17], GLASS, 0.016);
    tube(c, [1.34, 1.06, 1.45, 1.05], 0.016, CHROME, 0.014);
    // the bars that tie it to the bike, peeking out underneath
    tube(c, [0.4, 0.52, 0.52, 0.34], 0.03, CHROME, 0.022); tube(c, [1.36, 0.52, 1.2, 0.36], 0.03, CHROME, 0.022);
    for (i = 0; i < 2; i++) bolt(c, i ? 1.2 : 0.52, i ? 0.36 : 0.34, 0.016);
  },
  under: function (c, d, g) {
    var k = d.col, sx = g.SP[0], sy = g.SP[1], rx = g.RA[0], ry = g.RA[1];
    // shaft drive: a fat tube to a bevel box on the axle
    tube(c, [sx, sy, rx, ry], 0.075, '#2b2f38');
    line(c, [sx - 0.02, sy + 0.015, rx + 0.12, ry + 0.02], 0.012, '#5d636e');
    circ(c, rx, ry, 0.09, '#3a3f4b', 0.022); circ(c, rx, ry, 0.05, ENGD, 0.016);
    circ(c, sx, sy, 0.04, ENGD, 0.016);
    P.shock(c, rx + (sx - rx) * 0.2, ry + (sy - ry) * 0.2 + 0.02, 0.18, 0.8, CHROME);
    tube(c, [rx + (sx - rx) * 0.2 - 0.005, ry + (sy - ry) * 0.2 + 0.1, 0.165, 0.72], 0.05, k[0], 0.03);     // shock shroud
    // frame
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.12, 1.06, 0.5, 0.92, 0.28, 0.52, 0.28, sx, sy - 0.04], 0.038, FRAME);
    tube(c, [g.HT[0] - 0.03, g.HT[1] - 0.04, 0.64, 0.8, 0.12, 0.82], 0.042, FRAME);
    tube(c, [sx, sy + 0.02, 0.2, 0.82], 0.034, FRAME);
    // flat twin: the crankcase and gearbox, and a cylinder head seen end on
    blob(c, [0.5, 0.3, 0.48, 0.6, 0.76, 0.64, 1.0, 0.58, 1.02, 0.32, 0.78, 0.26], ENG);
    line(c, [0.62, 0.34, 0.62, 0.58], 0.014, ENGD);
    circ(c, 0.56, 0.45, 0.06, ENGD, 0.018);
    circ(c, 0.86, 0.47, 0.155, ENG, 0.026);
    for (var i = 0; i < 3; i++) circ(c, 0.86, 0.47, 0.14 - i * 0.035, null, 0.012, ENGD);
    blob(c, [0.78, 0.6, 0.96, 0.6, 0.98, 0.5, 0.76, 0.5], CHROME, 0.018);
    line(c, [0.8, 0.555, 0.94, 0.555], 0.01, '#8d939d');
    circ(c, 0.86, 0.43, 0.03, ENGD, 0.012);
    curve(c, [0.86, 0.38, 0.82, 0.62, 0.66, 0.68], 0.012, '#2b2f38', 0.012);       // plug lead
    blob(c, [0.64, 0.62, 0.74, 0.68, 0.78, 0.6, 0.68, 0.58], ENGD, 0.016);            // carb
    // pipe down to a long fishtail silencer
    curve(c, [0.86, 0.36, 0.84, 0.24, 0.7, 0.2, 0.3, 0.2], 0.045, CHROME);
    shape(c, [0.36, 0.25, -0.18, 0.28, -0.36, 0.33, -0.34, 0.2, -0.18, 0.22, 0.36, 0.165], CHROME);
    line(c, [0.3, 0.215, -0.14, 0.24], 0.012, '#ffffff');
  },
  fork: function (c, d, g) {
    var u = forkDir(g), hx = g.HT[0], hy = g.HT[1];
    P.fork(c, g, '#2b2f38', null, CHROME);
    // fork shrouds in the body colour
    tube(c, [hx - u[0] * 0.04, hy - u[1] * 0.04, hx - u[0] * 0.36, hy - u[1] * 0.36], 0.07, d.col[0], 0.03);
    line(c, [hx - u[0] * 0.06 - u[1] * 0.018, hy - u[1] * 0.06 + u[0] * 0.018, hx - u[0] * 0.34 - u[1] * 0.018, hy - u[1] * 0.34 + u[0] * 0.018], 0.012, 'rgba(255,255,255,0.45)');
  },
  over: function (c, d, g) {
    var k = d.col, sx = d.rider.seat[0], sy = d.rider.seat[1];
    // deep, valanced mudguards with a pinstripe
    guard(c, g.RA[0], g.RA[1], d.rr + 0.05, 0.3, 2.75, 0.09, k[0]);
    c.beginPath(); c.arc(g.RA[0], g.RA[1], d.rr + 0.05, 0.4, 2.65); c.lineWidth = 0.012; c.strokeStyle = k[1]; c.stroke();
    tube(c, [-0.32, 0.5, -0.24, 0.66, 0.1, 0.78], 0.02, CHROME, 0.016);                  // stay and rack
    circ(c, -0.36, 0.48, 0.03, '#e8483a', 0.014);
    guard(c, g.FA[0], g.FA[1], d.rf + 0.045, 0.3, 2.65, 0.085, k[0]);
    c.beginPath(); c.arc(g.FA[0], g.FA[1], d.rf + 0.045, 0.4, 2.55); c.lineWidth = 0.012; c.strokeStyle = k[1]; c.stroke();
    // sprung solo saddle
    P.shock(c, sx - 0.16, sy - 0.18, sx - 0.18, sy - 0.02, CHROME);
    blob(c, [sx - 0.3, sy + 0.04, sx - 0.02, sy + 0.08, sx + 0.24, sy + 0.04, sx + 0.24, sy - 0.03, sx - 0.04, sy - 0.04, sx - 0.3, sy - 0.02], '#5a3a26');
    line(c, [sx - 0.24, sy + 0.035, sx + 0.16, sy + 0.04], 0.012, '#7a5236');
    // toolbox
    shape(c, [0.24, 0.62, 0.44, 0.62, 0.44, 0.74, 0.24, 0.74], k[2], 0.02);
    // teardrop tank with a cream knee panel and a chrome strip
    blob(c, [0.6, 0.86, 0.72, 1.02, 1.04, 1.07, 1.16, 1.0, 1.08, 0.86, 0.78, 0.8], k[0]);
    blob(c, [0.74, 0.88, 0.8, 0.98, 0.98, 0.98, 1.02, 0.9, 0.88, 0.86], k[1], 0.016);
    line(c, [0.8, 1.02, 1.08, 1.03], 0.02, CHROME);
    circ(c, 0.9, 0.93, 0.03, CHROME, 0.012);
    // big headlamp
    var lx = g.HT[0] + 0.13, ly = g.HT[1] - 0.06;
    blob(c, [lx - 0.14, ly + 0.08, lx + 0.02, ly + 0.15, lx + 0.15, ly + 0.08, lx + 0.15, ly - 0.1, lx + 0.02, ly - 0.15, lx - 0.14, ly - 0.08], k[0]);
    circ(c, lx + 0.08, ly, 0.12, CHROME, 0.024);
    circ(c, lx + 0.1, ly, 0.088, LAMP, 0.016);
    c.beginPath(); c.arc(lx + 0.1, ly, 0.06, 1.6, 2.8); c.lineWidth = 0.016; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
    circ(c, lx - 0.06, ly - 0.1, 0.03, CHROME, 0.012);                                     // horn
  },
  wheel: [{ tyre: 0.26, knob: 0, type: 'spoke' }, { tyre: 0.24, knob: 0, type: 'spoke' }], forkLower: 0.28, clamp: 0.12, bars: 0.3, chromeFork: true };

/* =============================== 4. Gecko =============================== */
/* low and long, soft tacky tyres with toe pads, a belt-drive swingarm and a tail that curls round the back */
KIND.gecko = {
  under: function (c, d, g) {
    var k = d.col, sx = g.SP[0], sy = g.SP[1], rx = g.RA[0], ry = g.RA[1];
    // the belt case is the swingarm
    tube(c, [sx, sy, rx, ry], 0.15, ENG);
    tube(c, [sx - (sx - rx) * 0.1, sy - (sy - ry) * 0.1 + 0.035, rx + (sx - rx) * 0.15, ry + (sy - ry) * 0.15 + 0.035], 0.012, '#9aa1ab', 0);
    circ(c, sx, sy, 0.05, ENGD, 0.016); circ(c, rx, ry, 0.075, ENGD, 0.018); circ(c, rx, ry, 0.03, CHROME, 0.012);
    P.shock(c, rx + (sx - rx) * 0.28, ry + (sy - ry) * 0.28 + 0.05, 0.14, 0.74, k[1]);
    // low, long frame
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.12, 0.88, 0.42, 0.62, 0.28, sx, sy - 0.04], 0.04, FRAME);
    tube(c, [g.HT[0] - 0.03, g.HT[1] - 0.04, 0.62, 0.74, 0.1, 0.8], 0.045, FRAME);
    tube(c, [sx, sy + 0.03, 0.16, 0.78], 0.03, FRAME);
    // a single leaning far forward, nearly flat
    P.cases(c, 0.64, 0.4, 0.12);
    P.fins(c, 0.7, 0.46, 0.92, 0.58, 0.07, 6);
    curve(c, [0.98, 0.56, 1.02, 0.42, 0.92, 0.28, 0.66, 0.22, 0.42, 0.22], 0.04, CHROME);
    blob(c, [0.48, 0.26, 0.24, 0.27, 0.16, 0.22, 0.24, 0.16, 0.48, 0.17], '#3a3f4b', 0.022);
    circ(c, 0.17, 0.22, 0.03, CHROME, 0.014);
  },
  over: function (c, d, g) {
    var k = d.col, i;
    // the tail: one long curl round the back of the rear wheel, with spots
    ribbon(c, [0.3, 0.86, -0.02, 0.88, -0.3, 0.82, -0.44, 0.66, -0.42, 0.5, -0.32, 0.46, -0.27, 0.53, -0.31, 0.58], 0.13, 0.03, k[0]);
    var spots = [0.06, 0.89, -0.2, 0.86, -0.37, 0.73, -0.41, 0.57];
    for (i = 0; i < spots.length; i += 2) circ(c, spots[i], spots[i + 1], 0.022 - i * 0.001, k[1], 0.01);
    // seat
    blob(c, [0.08, 0.9, 0.38, 0.88, 0.62, 0.9, 0.64, 0.83, 0.36, 0.81, 0.1, 0.84], SEAT);
    // body: a long low back running into the head
    blob(c, [0.52, 0.86, 0.64, 0.97, 0.96, 1.0, 1.12, 0.9, 1.08, 0.72, 0.84, 0.6, 0.62, 0.7], k[0]);
    blob(c, [0.66, 0.74, 0.86, 0.66, 1.04, 0.74, 0.96, 0.8, 0.74, 0.8], shade(k[0], 1.35), 0.014);
    var sp2 = [0.7, 0.92, 0.82, 0.95, 0.94, 0.94, 0.76, 0.86, 0.9, 0.87, 1.02, 0.86];
    for (i = 0; i < sp2.length; i += 2) circ(c, sp2[i], sp2[i + 1], 0.02, k[1], 0.01);
    // a low mudguard hugging the fat front tyre
    guard(c, g.FA[0], g.FA[1], d.rf + 0.03, 0.55, 2.35, 0.055, k[0]);
    // the nose, with a headlamp that is a gecko's eye
    var hx = g.HT[0], hy = g.HT[1];
    blob(c, [hx - 0.06, hy + 0.08, hx + 0.12, hy + 0.08, hx + 0.22, hy - 0.04, hx + 0.14, hy - 0.16, hx - 0.04, hy - 0.16], k[0]);
    circ(c, hx + 0.1, hy - 0.03, 0.06, k[1], 0.02);
    c.beginPath(); c.ellipse(hx + 0.105, hy - 0.03, 0.012, 0.045, 0, 0, TAU); c.fillStyle = OUT; c.fill();
    circ(c, hx + 0.085, hy - 0.005, 0.01, '#ffffff', 0);
    line(c, [hx - 0.02, hy - 0.11, hx + 0.12, hy - 0.12], 0.014, shade(k[0], 0.7));
  },
  wheel: [{ tyre: 0.44, knob: 0, type: 'alloy5', rub: '#282c25', tread: pads }, { tyre: 0.44, knob: 0, type: 'alloy5', rub: '#282c25', tread: pads }],
  forkLower: 0.3, clamp: 0.12, bars: 0.3,
  rim: function (d) { return str(d.col[1], CHROME); } };

/* =============================== 5. Sandpiper =============================== */
/* a desert rally racer: paddle tyre, tall fairing and screen, nav tower, big tanks, a jerrycan */
KIND.paddle = {
  under: function (c, d, g) { P.mxUnder(c, d, g, 0.02, {}); },
  over: function (c, d, g) {
    var k = d.col, i;
    // long tail with a rack, brown side panel with a race number disc
    blob(c, [0.38, 1.0, -0.12, 1.07, -0.46, 1.14, -0.44, 1.05, -0.02, 0.93, 0.34, 0.89], k[0]);
    blob(c, [0.08, 0.96, 0.5, 0.93, 0.46, 0.71, 0.2, 0.75], k[1]);
    circ(c, 0.31, 0.84, 0.075, '#f5f1e6', 0.018);
    c.beginPath(); c.arc(0.31, 0.84, 0.06, 0, TAU); c.lineWidth = 0.016; c.strokeStyle = k[2]; c.stroke();
    tube(c, [-0.5, 1.15, -0.06, 1.1], 0.022, FRAME, 0.022);
    // the jerrycan lying on the rack
    var jx = -0.44, jy = 1.15;
    shape(c, [jx, jy, jx + 0.3, jy, jx + 0.3, jy + 0.17, jx + 0.06, jy + 0.17, jx, jy + 0.12], k[2], 0.022);
    line(c, [jx + 0.05, jy + 0.03, jx + 0.25, jy + 0.14], 0.012, shade(k[2], 0.7)); line(c, [jx + 0.05, jy + 0.14, jx + 0.25, jy + 0.03], 0.012, shade(k[2], 0.7));
    shape(c, [jx + 0.0, jy + 0.12, jx + 0.06, jy + 0.17, jx + 0.02, jy + 0.21, jx - 0.04, jy + 0.16], '#c9a56a', 0.016);
    tube(c, [jx + 0.12, jy + 0.17, jx + 0.14, jy + 0.21, jx + 0.24, jy + 0.21, jx + 0.26, jy + 0.17], 0.014, shade(k[2], 0.75), 0.02);
    for (i = 0; i < 2; i++) line(c, [jx + 0.08 + i * 0.14, jy - 0.005, jx + 0.08 + i * 0.14, jy + 0.03], 0.016, '#3a2a1e');
    // long rally seat
    blob(c, [-0.06, 1.05, 0.36, 1.02, 0.74, 1.03, 0.78, 0.96, 0.4, 0.94, -0.02, 0.98], '#2a211a');
    // tall front tank, wrapping low round the engine, with a blue stripe
    blob(c, [0.74, 0.84, 1.06, 0.8, 1.04, 0.58, 0.88, 0.52, 0.76, 0.62], shade(k[0], 0.85));
    blob(c, [0.62, 0.98, 0.8, 1.16, 1.06, 1.18, 1.14, 1.0, 1.04, 0.78, 0.86, 0.68, 0.72, 0.84], k[0]);
    line(c, [0.72, 1.06, 1.08, 1.1], 0.032, k[2]);
    line(c, [0.8, 0.98, 1.08, 0.96], 0.02, k[1]);
    circ(c, 0.9, 1.15, 0.026, CHROME, 0.012);
    // high front mudguard
    var fy = g.HT[1] - 0.18, fx = g.HT[0] + 0.04;
    blob(c, [fx - 0.14, fy + 0.03, fx + 0.14, fy + 0.02, fx + 0.42, fy - 0.07, fx + 0.44, fy - 0.12, fx + 0.14, fy - 0.05, fx - 0.12, fy - 0.03], k[0]);
    // nav tower behind the screen, then the tall fairing with stacked lights
    var hx = g.HT[0], hy = g.HT[1];
    tube(c, [hx - 0.02, hy + 0.06, hx - 0.06, hy + 0.2], 0.02, FRAME, 0.02);
    shape(c, [hx - 0.16, hy + 0.17, hx + 0.0, hy + 0.17, hx + 0.02, hy + 0.3, hx - 0.14, hy + 0.3], '#22252d', 0.02);
    shape(c, [hx - 0.12, hy + 0.2, hx - 0.02, hy + 0.2, hx - 0.01, hy + 0.27, hx - 0.11, hy + 0.27], '#9fd3ff', 0.012);
    shape(c, [hx - 0.04, hy - 0.12, hx + 0.14, hy - 0.2, hx + 0.26, hy - 0.02, hx + 0.24, hy + 0.14, hx + 0.08, hy + 0.24, hx - 0.06, hy + 0.2], k[0]);
    shape(c, [hx + 0.0, hy + 0.2, hx + 0.08, hy + 0.24, hx + 0.24, hy + 0.14, hx + 0.25, hy + 0.08], k[2], 0.016);
    shape(c, [hx + 0.0, hy + 0.21, hx + 0.1, hy + 0.25, hx + 0.03, hy + 0.38, hx - 0.07, hy + 0.35], GLASS, 0.018);
    line(c, [hx + 0.02, hy + 0.27, hx - 0.02, hy + 0.33], 0.01, 'rgba(255,255,255,0.7)');
    circ(c, hx + 0.19, hy + 0.06, 0.045, LAMP, 0.016); circ(c, hx + 0.19, hy - 0.05, 0.04, LAMP, 0.016);
    line(c, [hx - 0.02, hy - 0.08, hx + 0.12, hy - 0.14], 0.018, k[1]);
  },
  wheel: [{ tyre: 0.3, knob: 0, type: 'spoke', tread: paddles }, { tyre: 0.24, knob: 1, type: 'spoke' }], guard: true, forkLower: 0.4, clamp: 0.17, bars: 0.35,
  rim: function () { return '#2b2f38'; } };

/* =============================== 6. Whiplash =============================== */
/* freestyle MX: a big rear disc with a hand brake, grab handles cut in the rear mudguard, tall padded bars */
KIND.freestyle = {
  under: function (c, d, g) {
    var k = d.col, v = vv(g), rx = g.RA[0], ry = g.RA[1], a0 = v.spinR || 0, i, n = 60;
    // the big wavy rear disc, turning with the wheel
    c.save(); c.translate(rx, ry); c.rotate(a0);
    c.beginPath();
    for (i = 0; i <= n; i++) { var a = TAU * i / n, rr = 0.2 + 0.01 * Math.cos(a * 12); c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = '#c9d0d8'; c.fill(); c.lineWidth = 0.02; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(0, 0, 0.165, 0, TAU); c.lineWidth = 0.008; c.strokeStyle = '#9aa2ac'; c.stroke();
    for (i = 0; i < 12; i++) { var b = TAU * i / 12; circ(c, Math.cos(b) * 0.15, Math.sin(b) * 0.15, 0.014, '#5d636e', 0); circ(c, Math.cos(b + 0.26) * 0.18, Math.sin(b + 0.26) * 0.18, 0.009, '#5d636e', 0); }
    circ(c, 0, 0, 0.11, k[0], 0.018);
    for (i = 0; i < 5; i++) { var e = TAU * i / 5; circ(c, Math.cos(e) * 0.07, Math.sin(e) * 0.07, 0.02, shade(k[0], 0.6), 0); }
    c.restore();
    P.mxUnder(c, d, g, 0, {});
    // caliper on top of the disc, and the cable up to the bars
    var sx = g.SP[0], sy = g.SP[1], dx = sx - rx, dy = sy - ry, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
    var cx = rx + ux * 0.1 - uy * 0.16, cy = ry + uy * 0.1 + ux * 0.16;
    curve(c, [cx, cy + 0.02, cx + 0.12, cy + 0.12, 0.46, 0.8, 0.8, 0.98, g.grip[0] - 0.06, g.grip[1] - 0.02], 0.012, '#1b1d24', 0.012);
    blob(c, [cx - 0.07, cy + 0.03, cx + 0.07, cy + 0.04, cx + 0.06, cy - 0.04, cx - 0.06, cy - 0.035], '#2b2f38', 0.02);
    line(c, [cx - 0.045, cy + 0.0, cx + 0.045, cy + 0.005], 0.024, k[0]);
  },
  over: function (c, d, g) {
    var k = d.col, sy = d.rider.seat[1] - 0.93;
    // rear mudguard with two grab handles cut right through it (you see the wheel through the holes)
    c.beginPath();
    blobPath(c, [0.34, 1.0 + sy, -0.06, 1.06 + sy, -0.42, 1.15 + sy, -0.44, 1.0 + sy, -0.12, 0.88 + sy, 0.3, 0.86 + sy]);
    slot(c, -0.33, 1.035 + sy, -0.22, 1.01 + sy, 0.022);
    slot(c, -0.14, 0.995 + sy, -0.03, 0.975 + sy, 0.022);
    c.fillStyle = k[0]; c.fill('evenodd'); c.lineWidth = 0.028; c.strokeStyle = OUT; c.stroke();
    shape(c, [0.1, 0.92 + sy, 0.52, 0.89 + sy, 0.47, 0.68 + sy, 0.24, 0.72 + sy], k[2]);
    line(c, [0.2, 0.84 + sy, 0.44, 0.82 + sy], 0.03, k[0]);
    // flat seat, slim tank and shrouds
    blob(c, [0.0, 1.01 + sy, 0.4, 0.98 + sy, 0.7, 0.99 + sy, 0.74, 0.93 + sy, 0.4, 0.91 + sy, 0.04, 0.95 + sy], k[1]);
    blob(c, [0.62, 0.95 + sy, 0.84, 1.06 + sy, 1.04, 1.05 + sy, 1.07, 0.92 + sy, 0.98, 0.72, 0.86, 0.62, 0.76, 0.78 + sy], k[0]);
    shape(c, [0.8, 0.98 + sy, 1.02, 0.96 + sy, 0.96, 0.76, 0.88, 0.72], k[1], 0.016);
    line(c, [0.84, 0.92 + sy, 0.98, 0.9 + sy], 0.03, k[2]);
    var fy = g.HT[1] - 0.16, fx = g.HT[0] + 0.04;
    blob(c, [fx - 0.14, fy + 0.03, fx + 0.14, fy + 0.02, fx + 0.42, fy - 0.07, fx + 0.44, fy - 0.12, fx + 0.14, fy - 0.05, fx - 0.12, fy - 0.03], k[0]);
    line(c, [fx + 0.12, fy - 0.02, fx + 0.38, fy - 0.08], 0.02, k[2]);
    blob(c, [g.HT[0] + 0.0, g.HT[1] + 0.14, g.HT[0] + 0.1, g.HT[1] + 0.1, g.HT[0] + 0.13, g.HT[1] - 0.1, g.HT[0] + 0.03, g.HT[1] - 0.12], k[2]);
  },
  top: function (c, d, g) {
    var k = d.col, gx = g.grip[0], gy = g.grip[1], hx = g.HT[0], hy = g.HT[1];
    // bar pad on the crossbar, and the hand brake lever reaching forward off the bars
    tube(c, [hx + 0.01, hy + 0.07, gx + 0.02, gy - 0.07], 0.06, k[0], 0.03);
    line(c, [hx + 0.02, hy + 0.09, gx + 0.02, gy - 0.045], 0.012, k[2]);
    circ(c, gx + 0.03, gy + 0.03, 0.025, '#2b2f38', 0.014);
    tube(c, [gx + 0.03, gy + 0.03, gx + 0.1, gy + 0.02, gx + 0.17, gy - 0.03], 0.016, CHROME, 0.02);
    circ(c, gx + 0.17, gy - 0.03, 0.016, k[0], 0.012);
  },
  wheel: [{ tyre: 0.27, knob: 1, type: 'spoke', brake: 0 }, { tyre: 0.24, knob: 1, type: 'spoke' }], guard: true, forkLower: 0.36, clamp: 0.16, bars: 0.55,
  rim: function () { return '#2b2f38'; } };

/* =============================== 7. Icepick =============================== */
/* snow racer: steel-studded tyres, tall air-cooled single, megaphone, snow flap, hand guards, icicles */
KIND.ice = {
  under: function (c, d, g) {
    var k = d.col, sx = g.SP[0], sy = g.SP[1], rx = g.RA[0], ry = g.RA[1];
    P.swingarm(c, g, STEEL, 0.055); P.chain(c, g);
    P.shock(c, rx + (sx - rx) * 0.22, ry + (sy - ry) * 0.22 + 0.04, 0.12, 0.86, k[2]);
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.14, 0.97, 0.5, 0.7, 0.28, sx, sy - 0.06], 0.036, FRAME);
    tube(c, [g.HT[0] - 0.03, g.HT[1] - 0.05, 0.66, 0.88, sx, sy + 0.02], 0.048, FRAME);
    tube(c, [0.58, 0.88, -0.04, 0.92], 0.03, FRAME);
    tube(c, [sx, sy + 0.08, 0.14, 0.88], 0.026, FRAME);
    P.cases(c, 0.68, 0.43, 0.13);
    P.fins(c, 0.74, 0.53, 0.85, 0.84, 0.085, 8);
    // pipe round the front and a megaphone over the back
    curve(c, [0.92, 0.76, 1.03, 0.66, 1.0, 0.5, 0.86, 0.44, 0.62, 0.54, 0.46, 0.7], 0.042, CHROME);
    shape(c, [0.47, 0.73, 0.02, 0.9, -0.03, 0.78, 0.46, 0.67], CHROME);
    line(c, [0.4, 0.725, 0.05, 0.85], 0.012, '#ffffff');
    shape(c, [0.02, 0.9, -0.04, 0.92, -0.08, 0.76, -0.03, 0.78], '#30333c', 0.02);
  },
  over: function (c, d, g) {
    var k = d.col;
    // rear mudguard and the rubber snow flap hanging off it
    blob(c, [0.34, 0.97, -0.1, 1.02, -0.38, 1.08, -0.37, 1.01, -0.03, 0.9, 0.3, 0.86], k[0]);
    shape(c, [-0.37, 1.04, -0.29, 1.0, -0.33, 0.6, -0.44, 0.61], '#2b2f38', 0.022);
    snowflake(c, -0.36, 0.8, 0.04, k[2]);
    line(c, [-0.33, 0.66, -0.42, 0.665], 0.014, k[1]);
    // side panel with a snowflake, seat, tank
    shape(c, [0.1, 0.92, 0.52, 0.89, 0.47, 0.69, 0.24, 0.72], k[1]);
    snowflake(c, 0.34, 0.81, 0.055, k[0]);
    blob(c, [0.02, 1.0, 0.4, 0.97, 0.7, 0.98, 0.74, 0.92, 0.4, 0.9, 0.06, 0.94], k[1]);
    blob(c, [0.62, 0.94, 0.84, 1.07, 1.03, 1.06, 1.07, 0.92, 0.99, 0.74, 0.88, 0.66, 0.76, 0.78], k[0]);
    shape(c, [0.8, 0.98, 1.02, 0.96, 0.97, 0.8, 0.88, 0.76], k[2], 0.016);
    line(c, [0.66, 1.0, 0.86, 1.04], 0.026, k[1]);
    icicles(c, [0.82, 0.71, 0.05, 0.9, 0.69, 0.08, 0.98, 0.72, 0.04], k[2]);
    icicles(c, [-0.18, 0.95, 0.05, -0.08, 0.93, 0.07, 0.04, 0.9, 0.04], k[2]);
    // front mudguard with icicles, headlamp and number plate
    var fy = g.HT[1] - 0.16, fx = g.HT[0] + 0.04;
    blob(c, [fx - 0.14, fy + 0.03, fx + 0.14, fy + 0.02, fx + 0.42, fy - 0.07, fx + 0.44, fy - 0.12, fx + 0.14, fy - 0.05, fx - 0.12, fy - 0.03], k[0]);
    icicles(c, [fx + 0.06, fy - 0.045, 0.06, fx + 0.18, fy - 0.07, 0.05, fx + 0.3, fy - 0.09, 0.07], k[2]);
    blob(c, [g.HT[0] + 0.0, g.HT[1] + 0.2, g.HT[0] + 0.12, g.HT[1] + 0.12, g.HT[0] + 0.15, g.HT[1] - 0.1, g.HT[0] + 0.04, g.HT[1] - 0.13], k[1]);
    blob(c, [g.HT[0] + 0.07, g.HT[1] + 0.06, g.HT[0] + 0.145, g.HT[1] + 0.03, g.HT[0] + 0.15, g.HT[1] - 0.07, g.HT[0] + 0.08, g.HT[1] - 0.06], LAMP, 0.018);
  },
  top: function (c, d, g) {
    var k = d.col, gx = g.grip[0], gy = g.grip[1];
    // wrap-around hand guard
    blob(c, [gx - 0.02, gy + 0.08, gx + 0.1, gy + 0.08, gx + 0.17, gy + 0.0, gx + 0.13, gy - 0.08, gx + 0.04, gy - 0.07, gx + 0.09, gy - 0.0], k[0], 0.02);
    line(c, [gx + 0.04, gy + 0.065, gx + 0.13, gy + 0.03], 0.016, k[1]);
  },
  wheel: [{ tyre: 0.27, knob: 0, type: 'spoke', tread: studs }, { tyre: 0.24, knob: 0, type: 'spoke', tread: studs }], guard: true, forkLower: 0.36, clamp: 0.16, bars: 0.45,
  rim: function (d) { return str(d.col[1], CHROME); } };

/* =============================== 8. Rhino =============================== */
/* huge adventure bike: V-twin, big tank, crash bars, aluminium panniers and a steel bull bar on the fork */
KIND.ram = {
  under: function (c, d, g) {
    var k = d.col, sx = g.SP[0], sy = g.SP[1];
    P.swingarm(c, g, STEEL, 0.08); P.chain(c, g);
    P.shock(c, 0.42, 0.58, 0.52, 0.94, k[2]);
    // trellis frame
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.14, 1.08, 0.58, 0.96, 0.4], 0.04, FRAME);
    tube(c, [g.HT[0] - 0.03, g.HT[1] - 0.05, 0.7, 0.92, sx, sy + 0.04], 0.05, FRAME);
    tube(c, [0.94, 1.0, 0.86, 0.72, 0.7, 0.92, 0.64, 0.66], 0.022, FRAME, 0.026);
    tube(c, [0.62, 0.92, 0.02, 1.0], 0.034, FRAME);
    tube(c, [sx, sy + 0.1, 0.12, 0.98], 0.03, FRAME);
    // V-twin
    P.cases(c, 0.78, 0.48, 0.16);
    P.fins(c, 0.86, 0.6, 1.02, 0.84, 0.075, 6);
    P.fins(c, 0.7, 0.6, 0.58, 0.84, 0.075, 6);
    circ(c, 0.79, 0.74, 0.06, ENGD, 0.018);
    // twin headers, a fat silencer low down
    curve(c, [1.06, 0.82, 1.14, 0.64, 1.06, 0.4, 0.8, 0.3, 0.6, 0.38], 0.045, '#c9a56a');
    curve(c, [0.56, 0.78, 0.5, 0.6, 0.52, 0.48], 0.04, '#c9a56a');
    tube(c, [0.5, 0.48, 0.1, 0.56], 0.11, '#3a3f4b');
    line(c, [0.44, 0.515, 0.16, 0.57], 0.014, '#6a707b');
    tube(c, [0.1, 0.56, 0.06, 0.57], 0.07, CHROME, 0.02);
    // aluminium bash plate
    shape(c, [0.58, 0.34, 1.0, 0.33, 1.13, 0.46, 1.1, 0.3, 0.98, 0.24, 0.62, 0.26], '#c3c8cf', 0.022);
    line(c, [0.66, 0.29, 1.0, 0.285], 0.012, '#8d949f');
  },
  fork: function (c, d, g) {
    var k = d.col, u = forkDir(g), ux = u[0], uy = u[1], hx = g.HT[0], hy = g.HT[1], fx = g.FA[0], fy = g.FA[1], up = 0.5;
    // upside-down fork: fat outer tubes fixed in the clamps, gold inner tubes sliding down to the axle
    tube(c, [fx, fy, hx - ux * up, hy - uy * up], 0.05, '#d9b45a', 0.03);
    tube(c, [hx + ux * 0.02, hy + uy * 0.02, hx - ux * up, hy - uy * up], 0.085, k[1], 0.034);
    line(c, [hx - ux * up + uy * 0.05, hy - uy * up - ux * 0.05, hx - ux * up - uy * 0.05, hy - uy * up + ux * 0.05], 0.016, '#6a707b');
    blob(c, [fx - uy * 0.05 + ux * 0.1, fy + ux * 0.05 + uy * 0.1, fx + uy * 0.06, fy - ux * 0.06, fx - uy * 0.0 - ux * 0.05, fy - uy * 0.05, fx - uy * 0.06, fy + ux * 0.06], k[1], 0.02);
    circ(c, fx, fy, 0.03, CHROME, 0.014);
    tube(c, [hx + uy * 0.03, hy - ux * 0.03, hx - ux * g.clamp + uy * 0.03, hy - uy * g.clamp - ux * 0.03], 0.065, '#2b2f38', 0.03);
  },
  over: function (c, d, g) {
    var k = d.col, i;
    // tail, rack and seat
    blob(c, [0.38, 1.05, -0.08, 1.13, -0.4, 1.16, -0.38, 1.08, 0.0, 1.0, 0.32, 0.96], k[0]);
    shape(c, [-0.42, 1.17, -0.06, 1.15, -0.06, 1.12, -0.42, 1.13], k[1], 0.018);
    // aluminium pannier
    tube(c, [0.22, 0.98, 0.26, 0.7, 0.06, 0.66], 0.022, k[1], 0.022);
    shape(c, [-0.44, 0.68, 0.2, 0.68, 0.2, 1.1, -0.44, 1.1], '#c6ccd3');
    shape(c, [-0.44, 1.01, 0.2, 1.01, 0.2, 1.1, -0.44, 1.1], '#a3abb5', 0.02);
    for (i = 0; i < 4; i++) line(c, [-0.34 + i * 0.14, 0.72, -0.34 + i * 0.14, 0.97], 0.012, '#aeb5be');
    var cr = [[-0.44, 0.68], [0.2, 0.68], [0.2, 1.1], [-0.44, 1.1]];
    for (i = 0; i < 4; i++) { var cx = cr[i][0], cy = cr[i][1], sx = i === 0 || i === 3 ? 1 : -1, sy = i < 2 ? 1 : -1; shape(c, [cx, cy, cx + sx * 0.08, cy, cx + sx * 0.08, cy + sy * 0.03, cx + sx * 0.03, cy + sy * 0.03, cx + sx * 0.03, cy + sy * 0.08, cx, cy + sy * 0.08], k[1], 0.016); }
    shape(c, [-0.16, 0.98, -0.08, 0.98, -0.08, 1.04, -0.16, 1.04], k[1], 0.014);
    circ(c, 0.12, 0.76, 0.028, k[2], 0.012);
    blob(c, [-0.06, 1.1, 0.4, 1.06, 0.72, 1.08, 0.76, 1.0, 0.4, 0.98, -0.02, 1.02], k[1]);
    line(c, [0.0, 1.08, 0.3, 1.055], 0.014, shade(k[1], 1.5));
    // the big tank with a black panel and an amber stripe
    blob(c, [0.62, 1.03, 0.8, 1.24, 1.1, 1.27, 1.22, 1.08, 1.1, 0.8, 0.88, 0.68, 0.72, 0.84], k[0]);
    blob(c, [0.74, 0.86, 0.9, 0.98, 1.1, 0.96, 1.08, 0.8, 0.9, 0.72], k[1], 0.018);
    line(c, [0.74, 1.13, 1.14, 1.15], 0.03, k[2]);
    // crash bars round the tank and the engine
    tube(c, [0.74, 0.95, 0.96, 0.9, 1.1, 0.96], 0.03, k[1], 0.028);
    curve(c, [1.0, 0.96, 1.16, 0.86, 1.2, 0.62, 1.1, 0.42, 0.92, 0.38], 0.032, k[1], 0.028);
    for (i = 0; i < 2; i++) bolt(c, i ? 0.92 : 1.0, i ? 0.38 : 0.95);
    // beak mudguard, screen, twin lights
    var hx = g.HT[0], hy = g.HT[1], fy = hy - 0.2, fx = hx + 0.04;
    blob(c, [fx - 0.14, fy + 0.03, fx + 0.14, fy + 0.03, fx + 0.42, fy - 0.08, fx + 0.42, fy - 0.13, fx + 0.14, fy - 0.06, fx - 0.12, fy - 0.03], k[0]);
    shape(c, [hx - 0.02, hy + 0.18, hx + 0.08, hy + 0.22, hx + 0.02, hy + 0.34, hx - 0.08, hy + 0.3], GLASS, 0.018);
    blob(c, [hx - 0.04, hy + 0.2, hx + 0.12, hy + 0.2, hx + 0.24, hy + 0.0, hx + 0.2, hy - 0.14, hx + 0.02, hy - 0.12], k[0]);
    shape(c, [hx + 0.1, hy + 0.12, hx + 0.2, hy + 0.06, hx + 0.21, hy - 0.02, hx + 0.12, hy + 0.0], LAMP, 0.016);
    shape(c, [hx + 0.12, hy - 0.04, hx + 0.21, hy - 0.06, hx + 0.19, hy - 0.12, hx + 0.12, hy - 0.1], k[2], 0.016);
    // the bull bar: bolted to the fork legs, in front of the front wheel (it moves with the wheel)
    var x = g.FA[0], y = g.FA[1], u = forkDir(g), bx = x - u[0] * 0.46, by = y + u[1] * 0.46, BAR = '#4a4f58';
    tube(c, [x, y + 0.02, x + 0.4, y + 0.02], 0.045, BAR, 0.03);
    tube(c, [bx, by, x + 0.28, y + 0.42, x + 0.48, y + 0.18, x + 0.5, y - 0.1, x + 0.36, y - 0.27], 0.06, BAR, 0.035);
    tube(c, [x + 0.3, y + 0.4, x + 0.36, y - 0.26], 0.045, BAR, 0.03);
    tube(c, [x + 0.33, y + 0.12, x + 0.49, y + 0.12], 0.04, BAR, 0.03);
    line(c, [bx + 0.04, by + 0.012, x + 0.27, y + 0.43, x + 0.46, y + 0.2], 0.012, '#8d949f');
    shape(c, [x + 0.47, y + 0.08, x + 0.57, y + 0.08, x + 0.57, y - 0.14, x + 0.47, y - 0.14], k[2], 0.022);
    for (i = 0; i < 3; i++) line(c, [x + 0.48, y + 0.0 - i * 0.07 + 0.06, x + 0.56, y - 0.04 - i * 0.07 + 0.06], 0.016, k[1]);
    for (i = 0; i < 3; i++) bolt(c, [x + 0.3, x + 0.36, bx][i], [y + 0.4, y - 0.26, by][i], 0.018);
  },
  wheel: [{ tyre: 0.3, knob: 2, type: 'spoke' }, { tyre: 0.28, knob: 2, type: 'spoke' }], forkLower: 0.36, clamp: 0.18, bars: 0.4,
  rim: function () { return '#2b2f38'; } };

/* =============================== 9. Albatross =============================== */
/* a road-trail bike with a pair of wings bolted to the frame, swept back over the rear wheel, and a tail fin */
function wing(c, k, ox, oy, lift, far) {
  /* Seen from a little above and to the side, the two wings make a V: the far one rises up and back
     behind the rider, the near one sweeps down and back past the rear wheel. f lifts both tips. */
  var f = lift * 0.08, i;
  if (far) {
    var P = [0.62, 0.86, 0.2, 0.98, -0.24, 1.14 + f * 0.5, -0.56, 1.28 + f, -0.66, 1.25 + f, -0.48, 1.12 + f, -0.08, 0.96, 0.3, 0.86];
    shape(c, smooth(P, 3), shade(k[0], 0.66), 0.026);
    line(c, [0.5, 0.88, 0.1, 1.0, -0.3, 1.16 + f * 0.5, -0.55, 1.26 + f], 0.03, shade(k[1], 0.75));
    shape(c, [-0.56, 1.28 + f, -0.66, 1.25 + f, -0.6, 1.2 + f, -0.5, 1.23 + f], k[2], 0.016);
    return;
  }
  // near wing: fabric over ribs, a navy leading edge, a flap, and a yellow tip with a winglet.
  // Drawn a little smaller about its root so the rear wheel still shows through the gap.
  c.save(); c.translate(0.6, 0.78); c.scale(0.8, 0.8); c.translate(-0.6, -0.78);
  var tip = [-0.28 + ox, 0.2 + oy + f], tipR = [-0.6 + ox, 0.3 + oy + f];
  var Q = [0.7 + ox, 0.72 + oy, 0.36 + ox, 0.55 + oy, 0.04 + ox, 0.36 + oy + f * 0.6, tip[0], tip[1], tipR[0], tipR[1], -0.36 + ox, 0.48 + oy + f * 0.5, -0.04 + ox, 0.7 + oy, 0.24 + ox, 0.84 + oy];
  shape(c, smooth(Q, 3), k[0], 0.028);
  // shading toward the trailing edge, so it reads as a curved surface
  shape(c, smooth([-0.04 + ox, 0.7 + oy, -0.36 + ox, 0.48 + oy + f * 0.5, tipR[0], tipR[1], -0.46 + ox, 0.34 + oy + f, -0.1 + ox, 0.6 + oy, 0.2 + ox, 0.78 + oy], 2), shade(k[0], 0.82), 0);
  line(c, [0.7 + ox, 0.72 + oy, 0.36 + ox, 0.55 + oy, 0.04 + ox, 0.36 + oy + f * 0.6, tip[0], tip[1]], 0.045, k[1]);
  var rb = [[0.5, 0.64, 0.16, 0.8], [0.26, 0.5, -0.06, 0.72], [0.02, 0.36, -0.26, 0.6], [-0.18, 0.25, -0.44, 0.46]];
  for (i = 0; i < rb.length; i++) line(c, [rb[i][0] + ox, rb[i][1] + oy + (i > 1 ? f * 0.6 : 0), rb[i][2] + ox, rb[i][3] + oy + (i > 1 ? f * 0.5 : 0)], 0.012, shade(k[0], 0.62));
  curve(c, [0.16 + ox, 0.8 + oy, -0.14 + ox, 0.64 + oy, -0.42 + ox, 0.42 + oy + f * 0.6], 0.01, shade(k[0], 0.5), 0);
  shape(c, [tip[0], tip[1], tipR[0], tipR[1], -0.55 + ox, 0.35 + oy + f, -0.3 + ox, 0.27 + oy + f], k[2], 0.018);
  shape(c, [tipR[0], tipR[1], -0.7 + ox, 0.42 + oy + f, -0.66 + ox, 0.45 + oy + f, -0.55 + ox, 0.35 + oy + f], k[2], 0.016);
  c.restore();
}
KIND.glider = {
  back: function (c, d, g) {
    // the far wing peeks out above the near one
    if (g.wrecked) return;
    wing(c, d.col, 0, 0, Math.max(0, Math.min(1, vv(g).lift || 0)), true);
  },
  under: function (c, d, g) {
    var k = d.col;
    P.swingarm(c, g, STEEL, 0.055); P.chain(c, g);
    P.shock(c, 0.4, 0.5, 0.48, 0.8, k[2]);
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.13, 0.96, 0.46, 0.66, 0.28, g.SP[0], g.SP[1] - 0.06], 0.036, FRAME);
    tube(c, [g.HT[0] - 0.03, g.HT[1] - 0.05, 0.66, 0.82, g.SP[0], g.SP[1] + 0.02], 0.048, FRAME);
    tube(c, [0.56, 0.82, -0.02, 0.86], 0.03, FRAME);
    P.cases(c, 0.66, 0.42, 0.12);
    P.fins(c, 0.73, 0.51, 0.84, 0.72, 0.07, 6);
    curve(c, [0.88, 0.67, 0.99, 0.56, 0.96, 0.38, 0.8, 0.32, 0.56, 0.46, 0.42, 0.62], 0.04, CHROME);
    tube(c, [0.42, 0.64, 0.02, 0.76], 0.075, CHROME);
    tube(c, [0.03, 0.76, -0.03, 0.78], 0.05, '#30333c', 0.03);
  },
  over: function (c, d, g) {
    var k = d.col, lift = Math.max(0, Math.min(1, vv(g).lift || 0));
    // tail with the fin on top
    shape(c, [-0.02, 0.92, -0.26, 0.97, -0.42, 1.27, -0.29, 1.28, -0.1, 1.0, 0.06, 0.9], k[1]);
    shape(c, [-0.3, 1.2, -0.4, 1.22, -0.42, 1.27, -0.29, 1.28], k[2], 0.016);
    blob(c, [0.32, 0.92, -0.1, 0.96, -0.36, 1.01, -0.34, 0.94, -0.02, 0.84, 0.3, 0.82], k[0]);
    line(c, [-0.3, 0.97, -0.02, 0.91], 0.022, k[1]);
    circ(c, -0.34, 0.97, 0.022, '#e8483a', 0.012);
    // the near wing, its two struts and the root fairing
    if (!g.wrecked) {
      wing(c, k, 0, 0, lift, false);
      tube(c, [0.5, 0.64, 0.42, 0.82], 0.02, STEEL, 0.02);
      blob(c, [0.6, 0.6, 0.98, 0.66, 1.04, 0.58, 0.72, 0.52], k[1], 0.02);
      bolt(c, 0.84, 0.6); bolt(c, 0.7, 0.57);
    }
    blob(c, [0.0, 0.94, 0.4, 0.91, 0.7, 0.92, 0.74, 0.86, 0.4, 0.84, 0.04, 0.88], k[1]);
    // tank with a navy stripe and a yellow pinstripe, front mudguard, round lamp in a little nose
    blob(c, [0.6, 0.88, 0.72, 1.02, 1.02, 1.04, 1.12, 0.94, 1.04, 0.8, 0.7, 0.78], k[0]);
    line(c, [0.68, 0.95, 1.08, 0.97], 0.04, k[1]);
    line(c, [0.7, 0.915, 1.06, 0.925], 0.012, k[2]);
    guard(c, g.FA[0], g.FA[1], d.rf + 0.04, 0.55, 2.3, 0.05, k[0]);
    var hx = g.HT[0], hy = g.HT[1];
    blob(c, [hx - 0.04, hy + 0.12, hx + 0.14, hy + 0.08, hx + 0.22, hy - 0.04, hx + 0.12, hy - 0.16, hx - 0.04, hy - 0.12], k[0]);
    circ(c, hx + 0.12, hy - 0.03, 0.06, k[1], 0.02); circ(c, hx + 0.135, hy - 0.03, 0.042, LAMP, 0.014);
    shape(c, [hx - 0.02, hy + 0.1, hx + 0.1, hy + 0.08, hx + 0.04, hy + 0.22, hx - 0.06, hy + 0.2], GLASS, 0.016);
  },
  wheel: [{ tyre: 0.26, knob: 1, type: 'spoke' }, { tyre: 0.24, knob: 1, type: 'spoke' }], forkLower: 0.32, clamp: 0.14, bars: 0.3,
  rim: function (d) { return str(d.col[1], CHROME); } };

/* ------------------------------ exhaust tips for the new kinds ------------------------------ */
var EXH = { puffer: [0.36, 0.26], turbo: [-0.035, 0.585], sidecar: [-0.35, 0.27], gecko: [0.15, 0.22], paddle: [-0.02, 0.94],
  freestyle: [-0.04, 0.92], ice: [-0.06, 0.84], ram: [0.04, 0.57], glider: [-0.04, 0.78] };
var oldExhaust = A.exhaust;
A.exhaust = function (d) { return EXH[d.kind] ? EXH[d.kind].slice() : oldExhaust(d); };
})(typeof window !== 'undefined' ? window : globalThis);
