/* Ridge Riot: the wooden parts crate you pry open (the crate screen and the little picture in the garage).
   Drawn in a box about 3 units wide with the crate centred, y up. Same look as the rest of the art: thick dark
   outline, flat wood tones with a lit edge and a shaded side, nails and brackets for the small parts.
   A.crate(c, o): o.hits (0 to 2 pries so far), o.open (0 to 1 once the lid has gone), o.t (seconds),
   o.kind ('any', 'rare' or 'epic': the better crates have coloured steel bands), o.glow (the colour of the light inside). */
(function (root) {
'use strict';
var RR = root.RR, A = RR.Art, TAU = Math.PI * 2, OUT = '#15171d';

var WOOD = ['#b98a54', '#a97a46', '#c39560', '#b08050'], WLO = '#7a5430', WHI = '#e0bb86';
var DX = 0.3, DY = 0.3;                       // how far the top and right side are pushed back (depth)

function poly(c, pts, fill, lw) {
  c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.lineWidth = lw; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke(); }
}
function nail(c, x, y, r, bent) {
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = '#6b727c'; c.fill(); c.lineWidth = 0.022; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.arc(x - r * 0.3, y + r * 0.3, r * 0.4, 0, TAU); c.fillStyle = '#c4cbd4'; c.fill();
  if (bent) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + r * 1.8, y + r * 2.6); c.lineWidth = 0.034; c.strokeStyle = '#6b727c'; c.stroke(); }
}
/* a plank of the front face: x0..x1, y0..y1, with grain and a knot or two */
function plank(c, x0, y0, x1, y1, i) {
  poly(c, [x0, y0, x1, y0, x1, y1, x0, y1], WOOD[i % WOOD.length], 0.05);
  c.fillStyle = 'rgba(255,230,180,0.22)'; c.fillRect(x0 + 0.03, y1 - 0.075, x1 - x0 - 0.06, 0.05);        // lit top edge
  c.fillStyle = 'rgba(70,40,15,0.22)'; c.fillRect(x0 + 0.03, y0 + 0.03, x1 - x0 - 0.06, 0.045);           // shaded lower edge
  c.lineWidth = 0.014; c.strokeStyle = 'rgba(90,55,22,0.55)';
  for (var k = 0; k < 4; k++) {
    var gy = y0 + (y1 - y0) * (0.2 + 0.2 * k + (i % 2) * 0.05), gx = x0 + (x1 - x0) * (0.1 + ((k * 0.31 + i * 0.17) % 0.3));
    c.beginPath(); c.moveTo(gx, gy); c.bezierCurveTo(gx + 0.3, gy + 0.03, gx + 0.5, gy - 0.03, gx + 0.8 + (k % 2) * 0.3, gy + 0.01); c.stroke();
  }
  var kx = x0 + (x1 - x0) * (0.25 + 0.5 * ((i * 0.37) % 1)), ky = (y0 + y1) / 2;
  c.beginPath(); c.ellipse(kx, ky, 0.07, 0.045, 0.3, 0, TAU); c.fillStyle = 'rgba(80,45,18,0.55)'; c.fill();
  c.beginPath(); c.ellipse(kx, ky, 0.035, 0.02, 0.3, 0, TAU); c.fillStyle = 'rgba(40,20,8,0.5)'; c.fill();
}
/* the L-shaped steel bracket on a corner. sx, sy: which corner (+1 or -1) */
function bracket(c, x, y, sx, sy, col, hi) {
  var a = 0.46, w = 0.13;
  poly(c, [x, y, x - sx * a, y, x - sx * a, y - sy * w, x - sx * w, y - sy * w, x - sx * w, y - sy * a, x, y - sy * a], col, 0.04);
  c.beginPath(); c.moveTo(x - sx * (a - 0.03), y - sy * 0.03); c.lineTo(x - sx * 0.03, y - sy * 0.03); c.lineTo(x - sx * 0.03, y - sy * (a - 0.03)); c.lineWidth = 0.025; c.strokeStyle = hi; c.stroke();
  nail(c, x - sx * 0.08, y - sy * 0.3, 0.032); nail(c, x - sx * 0.3, y - sy * 0.08, 0.032);
}
/* a gear: the stencil on the front */
function gear(c, x, y, r, col) {
  c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath();
  for (var i = 0; i < 16; i++) { var a0 = i / 16 * TAU, a1 = (i + 0.5) / 16 * TAU, rr = i % 2 ? r : r * 0.78; c.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr); c.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr); }
  c.closePath(); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, 0, r * 0.32, 0, TAU); c.fill(); c.restore();
}
function arrowUp(c, x, y, s, col) { c.beginPath(); c.moveTo(x, y + s); c.lineTo(x + s * 0.6, y + s * 0.2); c.lineTo(x + s * 0.22, y + s * 0.2); c.lineTo(x + s * 0.22, y - s); c.lineTo(x - s * 0.22, y - s); c.lineTo(x - s * 0.22, y + s * 0.2); c.lineTo(x - s * 0.6, y + s * 0.2); c.closePath(); c.fillStyle = col; c.fill(); }

/* the body: front face, right side, interior (seen when the lid is up) */
var X0 = -1.0, X1 = 1.0, Y0 = -0.82, Y1 = 0.46;
function body(c, o, steel, steelHi) {
  // right side, pushed back
  poly(c, [X1, Y0, X1 + DX, Y0 + DY, X1 + DX, Y1 + DY, X1, Y1], '#8a6236', 0.05);
  c.fillStyle = 'rgba(40,20,5,0.25)'; c.fillRect(X1 + 0.02, Y0 + 0.02, DX - 0.02, (Y1 - Y0) - 0.02);
  c.lineWidth = 0.014; c.strokeStyle = 'rgba(60,35,12,0.6)'; c.beginPath(); c.moveTo(X1 + DX * 0.5, Y0 + DY * 0.5); c.lineTo(X1 + DX * 0.5, Y1 + DY * 0.5); c.stroke();
  // front: three planks, vertical battens, a diagonal brace
  var ph = (Y1 - Y0) / 3;
  for (var i = 0; i < 3; i++) plank(c, X0, Y0 + ph * i, X1, Y0 + ph * (i + 1), i + 1);
  poly(c, [X0 + 0.06, Y0 + 0.06, X0 + 0.34, Y0 + 0.06, X0 + 0.34, Y1 - 0.04, X0 + 0.06, Y1 - 0.04], WOOD[2], 0.045);
  poly(c, [X1 - 0.34, Y0 + 0.06, X1 - 0.06, Y0 + 0.06, X1 - 0.06, Y1 - 0.04, X1 - 0.34, Y1 - 0.04], WOOD[2], 0.045);
  c.fillStyle = 'rgba(255,230,180,0.2)'; c.fillRect(X0 + 0.09, Y0 + 0.1, 0.05, Y1 - Y0 - 0.2); c.fillRect(X1 - 0.31, Y0 + 0.1, 0.05, Y1 - Y0 - 0.2);
  poly(c, [X0 + 0.34, Y0 + 0.08, X0 + 0.58, Y0 + 0.08, X1 - 0.34, Y1 - 0.08, X1 - 0.58, Y1 - 0.08], WOOD[0], 0.045);
  c.fillStyle = 'rgba(255,230,180,0.2)'; c.beginPath(); c.moveTo(X0 + 0.4, Y0 + 0.12); c.lineTo(X0 + 0.46, Y0 + 0.12); c.lineTo(X1 - 0.42, Y1 - 0.12); c.lineTo(X1 - 0.5, Y1 - 0.12); c.fill();
  // nails along the battens
  [[X0 + 0.2, Y0 + 0.2], [X0 + 0.2, Y1 - 0.2], [X0 + 0.2, (Y0 + Y1) / 2], [X1 - 0.2, Y0 + 0.2], [X1 - 0.2, Y1 - 0.2], [X1 - 0.2, (Y0 + Y1) / 2]].forEach(function (p) { nail(c, p[0], p[1], 0.04); });
  // stencil: a gear and two arrows, spray paint style
  gear(c, 0.02, -0.18, 0.2, 'rgba(30,24,18,0.75)');
  c.save(); c.globalAlpha = 0.75; arrowUp(c, -0.5, -0.4, 0.14, '#1e1812'); arrowUp(c, 0.52, -0.4, 0.14, '#1e1812'); c.restore();
  // the rope handle slot on the right batten side
  poly(c, [X0 + 0.05, -0.3, X0 + 0.3, -0.3, X0 + 0.3, -0.14, X0 + 0.05, -0.14], null, 0);
  // steel brackets on the four front corners, and a band across for the better crates
  bracket(c, X0, Y0, -1, -1, steel, steelHi); bracket(c, X1, Y0, 1, -1, steel, steelHi);
  bracket(c, X0, Y1, -1, 1, steel, steelHi); bracket(c, X1, Y1, 1, 1, steel, steelHi);
  if (o.kind !== 'any') {
    poly(c, [X0 + 0.02, -0.55, X1 - 0.02, -0.55, X1 - 0.02, -0.43, X0 + 0.02, -0.43], steel, 0.03);
    c.fillStyle = steelHi; c.fillRect(X0 + 0.06, -0.47, X1 - X0 - 0.12, 0.025);
    for (var k = 0; k < 7; k++) nail(c, X0 + 0.3 + k * 0.23, -0.49, 0.028);
    if (o.kind === 'epic') { poly(c, [X0 + 0.02, 0.16, X1 - 0.02, 0.16, X1 - 0.02, 0.28, X0 + 0.02, 0.28], steel, 0.03); c.fillStyle = steelHi; c.fillRect(X0 + 0.06, 0.24, X1 - X0 - 0.12, 0.025); for (k = 0; k < 7; k++) nail(c, X0 + 0.3 + k * 0.23, 0.2, 0.028); }
  }
}
/* the lid: a top face (pushed back) and the front edge, nailed down */
function lid(c, o) {
  var T = 0.15;
  poly(c, [X0 - 0.04, Y1, X1 + 0.04, Y1, X1 + 0.04 + DX, Y1 + DY, X0 - 0.04 + DX, Y1 + DY], '#c99c66', 0.05);
  c.lineWidth = 0.014; c.strokeStyle = 'rgba(90,55,22,0.6)';
  for (var k = 1; k < 4; k++) { var f = k / 4; c.beginPath(); c.moveTo(X0 - 0.04 + DX * f, Y1 + DY * f); c.lineTo(X1 + 0.04 + DX * f, Y1 + DY * f); c.stroke(); }
  c.fillStyle = 'rgba(255,235,190,0.25)'; c.beginPath(); c.moveTo(X0 + 0.1 + DX * 0.1, Y1 + DY * 0.1); c.lineTo(X1 - 0.5, Y1 + DY * 0.1); c.lineTo(X1 - 0.5 + DX * 0.5, Y1 + DY * 0.5); c.lineTo(X0 + 0.1 + DX * 0.5, Y1 + DY * 0.5); c.fill();
  poly(c, [X0 - 0.04, Y1 - 0.02, X1 + 0.04, Y1 - 0.02, X1 + 0.04, Y1 + T - 0.1, X0 - 0.04, Y1 + T - 0.1], WOOD[3], 0.05);
  c.fillStyle = 'rgba(255,230,180,0.22)'; c.fillRect(X0, Y1 + T - 0.17, X1 - X0, 0.04);
  [[X0 + 0.12, Y1 + 0.18], [X1 - 0.12, Y1 + 0.18]].forEach(function (p) { nail(c, p[0], p[1], 0.032, o.hits >= 2); });
  [[X0 + 0.55, Y1 + 0.5], [X1 - 0.3, Y1 + 0.5]].forEach(function (p) { nail(c, p[0], p[1], 0.03, o.hits >= 1); });
}
function crowbar(c, wob) {
  c.save(); c.translate(1.12, 0.52); c.rotate(0.6 + wob);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.lineTo(1.5, 0); c.lineWidth = 0.17; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(0.02, 0); c.lineTo(1.48, 0); c.lineWidth = 0.1; c.strokeStyle = '#c63a2e'; c.stroke();
  c.beginPath(); c.moveTo(0.1, -0.025); c.lineTo(1.3, -0.025); c.lineWidth = 0.025; c.strokeStyle = '#ff9a8a'; c.stroke();
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-0.26, -0.01, -0.34, -0.24); c.lineWidth = 0.17; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-0.25, -0.01, -0.33, -0.23); c.lineWidth = 0.1; c.strokeStyle = '#8d949e'; c.stroke();
  c.restore();
}
/* light leaking out through the gap: a bright strip and a few rays */
function leak(c, glow, gap, t) {
  c.save(); c.globalCompositeOperation = 'lighter';
  var g = c.createLinearGradient(0, Y1, 0, Y1 + 1.3 + gap * 3); g.addColorStop(0, glow); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = 0.55 * Math.min(1, gap * 6 + 0.25); c.fillStyle = g;
  c.beginPath(); c.moveTo(X0 + 0.1, Y1 + 0.02); c.lineTo(X1, Y1 + 0.02); c.lineTo(X1 + 0.3 + gap * 2, Y1 + 1.2 + gap * 3); c.lineTo(X0 - 0.2, Y1 + 1.2 + gap * 3); c.closePath(); c.fill();
  c.restore();
}

A.crate = function (c, o) {
  var t = o.t || 0, hits = o.hits || 0, open = o.open || 0, kind = o.kind || 'any', glow = o.glow || '#f2c230', i;
  var tier = kind === 'any' ? null : RR.TIER[kind];
  var steel = tier ? tier.col : '#8d949e', steelHi = tier ? tier.hi : '#d4dae2';
  c.lineJoin = 'round'; c.lineCap = 'round';
  // shadow on the ground
  c.fillStyle = 'rgba(0,0,0,0.38)'; c.beginPath(); c.ellipse(0.12, Y0 - 0.02, 1.35 + open * 0.3, 0.17, 0, 0, TAU); c.fill();
  // light pouring out from the opening
  if (open > 0) {
    c.save(); c.translate(0.15, Y1 + 0.15); c.globalCompositeOperation = 'lighter';
    c.rotate(t * 0.5);
    for (i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.globalAlpha = 0.17 * Math.min(1, open * 2) * (i % 2 ? 1 : 0.6); c.fillStyle = glow; c.beginPath(); c.moveTo(0, 0); c.lineTo(-0.3, 4.2); c.lineTo(0.3, 4.2); c.closePath(); c.fill(); }
    c.restore(); c.globalAlpha = 1;
  }
  body(c, o, steel, steelHi);
  // the open top of the crate: dark inside with the light coming up out of it
  var lift = open > 0 ? 0.5 : hits === 0 ? 0 : hits === 1 ? 0.09 : 0.24;
  if (lift > 0) {
    poly(c, [X0 + 0.04, Y1, X1 - 0.04, Y1, X1 - 0.04 + DX, Y1 + DY, X0 + 0.04 + DX, Y1 + DY], '#241608', 0);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(0.9, 0.35 + hits * 0.2 + open * 0.8); c.fillStyle = glow;
    c.beginPath(); c.moveTo(X0 + 0.1, Y1 + 0.02); c.lineTo(X1 - 0.1, Y1 + 0.02); c.lineTo(X1 - 0.1 + DX, Y1 + DY); c.lineTo(X0 + 0.1 + DX, Y1 + DY); c.closePath(); c.fill(); c.restore();
    if (open > 0) { c.save(); c.globalCompositeOperation = 'lighter'; var gl = c.createRadialGradient(0.15, Y1 + 0.15, 0, 0.15, Y1 + 0.15, 1.6); gl.addColorStop(0, glow); gl.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 0.55 * Math.min(1, open * 2); c.fillStyle = gl; c.fillRect(-2, -1.5, 4.5, 4.5); c.restore(); }
  }
  if (hits > 0 && open === 0) leak(c, glow, lift, t);
  // the lid: lifts at the right end as it is pried (it hinges on the left), and flies off on the third go
  c.save();
  if (open > 0) { c.translate(0.2 + open * 1.4, open * 3.2 - open * open * 0.8); c.rotate(open * 1.5); c.globalAlpha = Math.max(0, 1 - Math.max(0, open - 0.55) * 2.2); }
  else if (lift > 0) { c.translate(X0, Y1); c.rotate(Math.atan2(lift, 2)); c.translate(-X0, -Y1); }
  lid(c, o);
  c.restore(); c.globalAlpha = 1;
  if (hits > 0 && open === 0) crowbar(c, Math.sin(t * 40) * (o.shake || 0) * 0.04);
  // splinters hanging from the pried edge
  if (hits >= 2 && open === 0) { c.fillStyle = WHI; poly(c, [X1 - 0.05, Y1 + 0.02, X1 - 0.2, Y1 + 0.2, X1 - 0.12, Y1 + 0.02], WHI, 0.02); poly(c, [X1 - 0.3, Y1 + 0.02, X1 - 0.4, Y1 + 0.16, X1 - 0.36, Y1 + 0.02], WHI, 0.02); }
};
})(typeof window !== 'undefined' ? window : globalThis);
