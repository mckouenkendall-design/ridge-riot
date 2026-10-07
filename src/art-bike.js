/* Ridge Riot: drawing the bikes and the rider.
   Everything is drawn with canvas paths, in metres, with y pointing up
   (the caller flips the canvas). Origin is the ground under the rear axle. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var A = RR.Art = {};
var TAU = Math.PI * 2;
var OUT = '#15171d', FRAME = '#3a3f4b', ENG = '#7b828d', ENGD = '#555b66', CHROME = '#d9dfe7', RUB = '#1c1d22', STEEL = '#aab1bb';
A.OUT = OUT;

function path(ctx, p, close) {
  ctx.beginPath(); ctx.moveTo(p[0], p[1]);
  for (var i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
  if (close) ctx.closePath();
}
function shape(ctx, p, fill, lw) {
  path(ctx, p, true);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw !== 0) { ctx.lineWidth = lw || 0.028; ctx.strokeStyle = OUT; ctx.stroke(); }
}
/* closed curvy shape: points are corners that get rounded off */
function blob(ctx, p, fill, lw) {
  var n = p.length / 2, i;
  ctx.beginPath();
  ctx.moveTo((p[0] + p[2 * n - 2]) / 2, (p[1] + p[2 * n - 1]) / 2);
  for (i = 0; i < n; i++) {
    var j = (i + 1) % n;
    ctx.quadraticCurveTo(p[i * 2], p[i * 2 + 1], (p[i * 2] + p[j * 2]) / 2, (p[i * 2 + 1] + p[j * 2 + 1]) / 2);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw !== 0) { ctx.lineWidth = lw || 0.028; ctx.strokeStyle = OUT; ctx.stroke(); }
}
function line(ctx, p, w, col) { path(ctx, p, false); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); }
function tube(ctx, p, w, col, ow) { line(ctx, p, w + (ow == null ? 0.045 : ow), OUT); line(ctx, p, w, col); }
function curve(ctx, p, w, col, ow) {       // smooth open line through points
  function tr() {
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    for (var i = 2; i < p.length - 2; i += 2) ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2);
    ctx.lineTo(p[p.length - 2], p[p.length - 1]);
  }
  tr(); ctx.lineWidth = w + (ow == null ? 0.045 : ow); ctx.strokeStyle = OUT; ctx.stroke();
  tr(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
}
function circ(ctx, x, y, r, fill, lw, stroke) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw !== 0) { ctx.lineWidth = lw || 0.028; ctx.strokeStyle = stroke || OUT; ctx.stroke(); }
}
function shade(hex, f) {                   // darker (f<1) or lighter (f>1) version of a colour
  if (typeof hex !== 'string') hex = hex.flat || '#888888';   // a pattern or gradient: use its plain stand-in
  var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f <= 1) { r *= f; g *= f; b *= f; } else { var k = f - 1; r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
}
A.shade = shade; A.shape = shape; A.blob = blob; A.line = line; A.tube = tube; A.circ = circ; A.curve = curve; A.path = path;

/* two-bone joint (elbow or knee). dir picks which way it bends. */
function ik(ax, ay, bx, by, l1, l2, dir, out) {
  var dx = bx - ax, dy = by - ay, d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
  var mx = l1 + l2 - 0.002;
  if (d > mx) { bx = ax + dx / d * mx; by = ay + dy / d * mx; dx = bx - ax; dy = by - ay; d = mx; }
  var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  out[0] = ax + dx / d * a - dir * dy / d * h; out[1] = ay + dy / d * a + dir * dx / d * h;
  out[2] = bx; out[3] = by;
  return out;
}
A.ik = ik;

/* ------------------------------ wheels ------------------------------ */
A.wheel = function (ctx, x, y, r, ang, st, rate) {
  var ri = r * (1 - st.tyre), i;
  ctx.save(); ctx.translate(x, y);
  // tyre
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.moveTo(ri, 0); ctx.arc(0, 0, ri, 0, TAU, true);
  ctx.fillStyle = RUB; ctx.fill();
  ctx.save(); ctx.rotate(ang);
  if (st.knob) {
    var nk = st.knob === 2 ? 10 : Math.max(12, Math.round(r * 52)), seg = TAU * r / nk;
    ctx.setLineDash(st.knob === 2 ? [seg * 0.28, seg * 0.72] : [seg * 0.55, seg * 0.45]);
    ctx.beginPath(); ctx.arc(0, 0, r + (st.knob === 2 ? 0.03 : 0.008), 0, TAU);
    ctx.lineWidth = st.knob === 2 ? 0.09 : 0.04; ctx.strokeStyle = RUB; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r - r * st.tyre * 0.42, 0, TAU);
    ctx.lineWidth = r * st.tyre * 0.3; ctx.strokeStyle = '#30323b'; ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.lineWidth = 0.024; ctx.strokeStyle = OUT; ctx.stroke();
  // rim
  ctx.beginPath(); ctx.arc(0, 0, ri - 0.012, 0, TAU); ctx.lineWidth = 0.045; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, ri - 0.012, 0, TAU); ctx.lineWidth = 0.028; ctx.strokeStyle = st.rim; ctx.stroke();
  var fast = rate > 28 || rate < -28;
  ctx.rotate(ang);
  if (st.type === 'disc' || st.type === 'glow') {
    circ(ctx, 0, 0, ri - 0.03, st.fill || '#2b2f3a', 0.02);
    if (st.type === 'glow') { ctx.beginPath(); ctx.arc(0, 0, ri * 0.62, 0, TAU); ctx.lineWidth = 0.022; ctx.strokeStyle = st.glow; ctx.stroke(); }
    for (i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.arc(ri * 0.36, 0, ri * 0.13, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill(); }
  } else {
    var n = st.spokes || (st.type === 'alloy3' ? 3 : st.type === 'alloy5' ? 5 : (r > 0.3 ? 14 : 10));
    var sw = st.type === 'spoke' ? 0.011 : r * 0.13;
    if (fast) { ctx.beginPath(); ctx.arc(0, 0, ri - 0.03, 0, TAU); ctx.fillStyle = st.type === 'spoke' ? 'rgba(200,205,215,0.13)' : 'rgba(60,64,75,0.5)'; ctx.fill(); }
    ctx.globalAlpha = fast ? 0.4 : 1;
    ctx.lineWidth = sw; ctx.strokeStyle = st.type === 'spoke' ? '#c6ccd4' : st.rim;
    ctx.beginPath();
    for (i = 0; i < n; i++) { var a = TAU * i / n; ctx.moveTo(Math.cos(a) * 0.04, Math.sin(a) * 0.04); ctx.lineTo(Math.cos(a + (st.type === 'spoke' ? 0.25 : 0)) * (ri - 0.03), Math.sin(a + (st.type === 'spoke' ? 0.25 : 0)) * (ri - 0.03)); }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (st.brake !== 0) { ctx.beginPath(); ctx.arc(0, 0, Math.min(ri * 0.5, 0.13), 0, TAU); ctx.lineWidth = 0.02; ctx.strokeStyle = '#8d939d'; ctx.stroke(); }
  if (st.glow2) {
    // a ring of light inside the rim, and a soft halo round it
    ctx.beginPath(); ctx.arc(0, 0, ri * 0.66, 0, TAU); ctx.strokeStyle = st.glow2; ctx.globalAlpha = 0.28; ctx.lineWidth = 0.13; ctx.stroke(); ctx.globalAlpha = 1; ctx.lineWidth = 0.045; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, ri - 0.012, 0, TAU); ctx.lineWidth = 0.02; ctx.stroke();
  }
  circ(ctx, 0, 0, 0.045, st.hub || '#4a4f5a', 0.018);
  ctx.restore();
  // fixed sidewall highlight
  ctx.beginPath(); ctx.arc(x, y, (r + ri) / 2, 2.0, 2.9); ctx.lineWidth = r * st.tyre * 0.22; ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.stroke();
};

/* ------------------------------ engines ------------------------------ */
function fins(ctx, x0, y0, x1, y1, w, n) {      // cylinder with cooling fins from base to head
  var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L, px = -uy, py = ux, i;
  shape(ctx, [x0 + px * w, y0 + py * w, x1 + px * w, y1 + py * w, x1 - px * w, y1 - py * w, x0 - px * w, y0 - py * w], ENG);
  ctx.lineWidth = 0.014; ctx.strokeStyle = ENGD; ctx.beginPath();
  for (i = 1; i < n; i++) { var t = i / n; ctx.moveTo(x0 + dx * t + px * w * 1.15, y0 + dy * t + py * w * 1.15); ctx.lineTo(x0 + dx * t - px * w * 1.15, y0 + dy * t - py * w * 1.15); }
  ctx.stroke();
  shape(ctx, [x1 + px * w * 1.05 - ux * 0.01, y1 + py * w * 1.05 - uy * 0.01, x1 + px * w * 0.9 + ux * 0.05, y1 + py * w * 0.9 + uy * 0.05, x1 - px * w * 0.9 + ux * 0.05, y1 - py * w * 0.9 + uy * 0.05, x1 - px * w * 1.05 - ux * 0.01, y1 - py * w * 1.05 - uy * 0.01], ENGD);
}
function cases(ctx, x, y, r, col) {
  blob(ctx, [x - r * 1.5, y + r * 0.6, x - r * 0.4, y + r * 1.1, x + r * 1.3, y + r * 0.9, x + r * 1.5, y - r * 0.5, x + r * 0.5, y - r * 1.1, x - r * 1.2, y - r * 0.9], col || ENG);
  circ(ctx, x - r * 0.35, y, r * 0.62, ENGD, 0.02);
  circ(ctx, x - r * 0.35, y, r * 0.2, CHROME, 0.014);
  circ(ctx, x + r * 0.8, y + r * 0.1, r * 0.3, ENGD, 0.016);
}

/* ------------------------------ shared chassis bits ------------------------------ */
function fork(ctx, g, col, guard, stanchion) {
  var hx = g.HT[0], hy = g.HT[1], fx = g.FA[0], fy = g.FA[1];
  var dx = hx - fx, dy = hy - fy, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
  // inner tube (the shiny bit that slides), then the outer leg fixed to the axle
  tube(ctx, [hx - ux * 0.02, hy - uy * 0.02, fx + ux * 0.1, fy + uy * 0.1], 0.03, stanchion || CHROME, 0.03);
  var lo = g.forkLower;
  tube(ctx, [fx - ux * 0.01, fy - uy * 0.01, fx + ux * lo, fy + uy * lo], 0.05, col || '#2b2f38', 0.034);
  if (guard) shape(ctx, [fx + ux * 0.02 + uy * 0.045, fy + uy * 0.02 - ux * 0.045, fx + ux * lo * 0.95 + uy * 0.05, fy + uy * lo * 0.95 - ux * 0.05, fx + ux * lo * 0.95 + uy * 0.015, fy + uy * lo * 0.95 - ux * 0.015, fx + ux * 0.02 + uy * 0.015, fy + uy * 0.02 - ux * 0.015], guard, 0.02);
  // triple clamps
  tube(ctx, [hx + uy * 0.03, hy - ux * 0.03, hx - ux * g.clamp + uy * 0.03, hy - uy * g.clamp - ux * 0.03], 0.055, '#2b2f38', 0.03);
}
function swingarm(ctx, g, col, w) { tube(ctx, [g.SP[0], g.SP[1], g.RA[0], g.RA[1]], w || 0.06, col || STEEL); circ(ctx, g.SP[0], g.SP[1], 0.035, ENGD, 0.016); }
function shock(ctx, x0, y0, x1, y1, col) {
  tube(ctx, [x0, y0, x1, y1], 0.02, CHROME, 0.022);
  var n = 6, dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1, px = -dy / L * 0.035, py = dx / L * 0.035, i;
  ctx.beginPath();
  for (i = 0; i <= n; i++) { var t = 0.12 + 0.76 * i / n, s = i % 2 ? 1 : -1; ctx[i ? 'lineTo' : 'moveTo'](x0 + dx * t + px * s, y0 + dy * t + py * s); }
  ctx.lineWidth = 0.02; ctx.strokeStyle = col; ctx.stroke();
}
function bars(ctx, g, col, rise) {
  var gx = g.grip[0], gy = g.grip[1];
  tube(ctx, [g.HT[0] - 0.01, g.HT[1], gx + (rise ? 0.02 : 0), gy - (rise || 0) * 0.3, gx, gy], 0.028, col || '#2b2f38', 0.03);
  tube(ctx, [gx - 0.035, gy, gx + 0.045, gy], 0.042, RUB, 0.02);
}
function chain(ctx, g) {
  ctx.lineWidth = 0.014; ctx.strokeStyle = '#30333c';
  ctx.beginPath(); ctx.moveTo(g.SP[0] + 0.04, g.SP[1] + 0.04); ctx.lineTo(g.RA[0], g.RA[1] + 0.085); ctx.moveTo(g.SP[0] + 0.04, g.SP[1] - 0.05); ctx.lineTo(g.RA[0], g.RA[1] - 0.085); ctx.stroke();
  circ(ctx, g.RA[0], g.RA[1], 0.085, null, 0.014, '#6a707b');
}
function plate(ctx, p, col, num) { shape(ctx, p, col, 0.022); }

/* ------------------------------ the bodies ------------------------------ */
/* each painter has two passes: under (frame, engine, pipes) and over (bodywork) */
var KIND = {};

function mxUnder(ctx, d, g, ox, o) {
  var sy = d.rider.seat[1] - 0.93;
  swingarm(ctx, g, STEEL, 0.055); chain(ctx, g);
  shock(ctx, ox + 0.40, 0.50 + sy * 0.4, ox + 0.50, 0.84 + sy, d.col[0]);
  tube(ctx, [g.HT[0] - 0.02, g.HT[1] - 0.14, ox + 0.94, 0.50, ox + 0.64, 0.30, g.SP[0], g.SP[1] - 0.06], 0.036, FRAME);
  tube(ctx, [g.HT[0] - 0.03, g.HT[1] - 0.06, ox + 0.70, 0.88 + sy, g.SP[0], g.SP[1] + 0.02], 0.05, FRAME);
  tube(ctx, [ox + 0.58, 0.88 + sy, ox - 0.02, 0.96 + sy], 0.03, FRAME);
  tube(ctx, [g.SP[0], g.SP[1] + 0.08, ox + 0.06, 0.92 + sy], 0.026, FRAME);
  cases(ctx, ox + 0.66, 0.44, 0.125);
  if (o.stroke2) {
    fins(ctx, ox + 0.72, 0.53, ox + 0.80, 0.74, 0.065, 5);
    // fat two-stroke pipe
    curve(ctx, [ox + 0.86, 0.66, ox + 1.0, 0.56, ox + 0.96, 0.36, ox + 0.74, 0.27, ox + 0.5, 0.33], 0.085, CHROME);
    curve(ctx, [ox + 0.5, 0.33, ox + 0.36, 0.42, ox + 0.28, 0.6], 0.04, CHROME);
    tube(ctx, [ox + 0.26, 0.64, ox + 0.04, 0.84 + sy], 0.065, '#30333c');
  } else {
    fins(ctx, ox + 0.72, 0.53, ox + 0.83, 0.80 + sy * 0.5, 0.075, 6);
    curve(ctx, [ox + 0.90, 0.72, ox + 1.02, 0.62, ox + 0.98, 0.42, ox + 0.80, 0.36, ox + 0.56, 0.52, ox + 0.40, 0.72 + sy], 0.045, '#c9a56a');
    tube(ctx, [ox + 0.38, 0.76 + sy, ox + 0.02, 0.88 + sy], 0.085, CHROME);
    tube(ctx, [ox + 0.03, 0.88 + sy, ox - 0.03, 0.9 + sy], 0.06, '#30333c', 0.03);
  }
  // radiator
  shape(ctx, [ox + 0.88, 0.90 + sy, ox + 0.97, 0.88 + sy, ox + 0.93, 0.66, ox + 0.85, 0.68], '#30333c', 0.02);
}
function mxOver(ctx, d, g, ox, o) {
  var c = d.col, sy = d.rider.seat[1] - 0.93;
  // rear fender and side panel
  blob(ctx, [ox + 0.34, 0.97 + sy, ox - 0.10, 1.02 + sy, ox - 0.36, 1.10 + sy, ox - 0.34, 1.03 + sy, ox - 0.02, 0.90 + sy, ox + 0.3, 0.86 + sy], c[0]);
  plate(ctx, [ox + 0.10, 0.92 + sy, ox + 0.52, 0.89 + sy, ox + 0.47, 0.68 + sy, ox + 0.24, 0.72 + sy], c[2]);
  // seat
  blob(ctx, [ox + 0.02, 1.01 + sy, ox + 0.40, 0.98 + sy, ox + 0.70, 0.99 + sy, ox + 0.74, 0.93 + sy, ox + 0.40, 0.91 + sy, ox + 0.06, 0.95 + sy], c[1]);
  // tank and shroud
  var th = o.bigTank ? 0.07 : 0;
  blob(ctx, [ox + 0.62, 0.95 + sy, ox + 0.84, 1.07 + sy + th, ox + 1.04, 1.06 + sy + th * 0.6, ox + 1.07, 0.92 + sy, ox + 0.98, 0.72, ox + 0.86, 0.62, ox + 0.76, 0.78 + sy], c[0]);
  shape(ctx, [ox + 0.80, 0.98 + sy, ox + 1.02, 0.96 + sy, ox + 0.96, 0.76, ox + 0.88, 0.72], c[2], 0.016);
  line(ctx, [ox + 0.84, 0.93 + sy, ox + 0.98, 0.91 + sy], 0.03, c[1]);
  // front fender
  var fy = g.HT[1] - 0.16, fx = g.HT[0] + 0.04;
  blob(ctx, [fx - 0.14, fy + 0.03, fx + 0.14, fy + 0.02, fx + 0.42, fy - 0.07, fx + 0.44, fy - 0.12, fx + 0.14, fy - 0.05, fx - 0.12, fy - 0.03], c[0]);
  // front plate or headlight
  if (o.light) {
    blob(ctx, [g.HT[0] + 0.0, g.HT[1] + 0.2, g.HT[0] + 0.12, g.HT[1] + 0.12, g.HT[0] + 0.15, g.HT[1] - 0.1, g.HT[0] + 0.04, g.HT[1] - 0.13], c[1]);
    blob(ctx, [g.HT[0] + 0.07, g.HT[1] + 0.06, g.HT[0] + 0.145, g.HT[1] + 0.03, g.HT[0] + 0.15, g.HT[1] - 0.07, g.HT[0] + 0.08, g.HT[1] - 0.06], '#fff3b8', 0.018);
    shape(ctx, [g.HT[0] + 0.01, g.HT[1] + 0.2, g.HT[0] + 0.1, g.HT[1] + 0.14, g.HT[0] + 0.04, g.HT[1] + 0.36, g.HT[0] - 0.02, g.HT[1] + 0.34], 'rgba(170,220,255,0.55)', 0.016);
  } else {
    blob(ctx, [g.HT[0] + 0.0, g.HT[1] + 0.14, g.HT[0] + 0.1, g.HT[1] + 0.1, g.HT[0] + 0.13, g.HT[1] - 0.1, g.HT[0] + 0.03, g.HT[1] - 0.12], c[2]);
  }
}
KIND.mx = { under: function (c, d, g) { mxUnder(c, d, g, 0, { stroke2: true }); }, over: function (c, d, g) { mxOver(c, d, g, 0, {}); },
  wheel: [{ tyre: 0.27, knob: 1, type: 'spoke' }, { tyre: 0.24, knob: 1, type: 'spoke' }], guard: true, forkLower: 0.36, clamp: 0.16, bars: 0.4 };
KIND.enduro = { under: function (c, d, g) { mxUnder(c, d, g, 0.02, {}); },
  over: function (c, d, g) {
    mxOver(c, d, g, 0.02, { bigTank: true, light: true });
    // tail bag and hand guard
    blob(c, [-0.22, 1.18, 0.06, 1.2, 0.1, 1.07, -0.24, 1.08], '#3b3f48');
    line(c, [-0.12, 1.19, -0.12, 1.09], 0.02, d.col[2]);
    blob(c, [d.rider.grip[0] + 0.03, d.rider.grip[1] + 0.07, d.rider.grip[0] + 0.14, d.rider.grip[1] + 0.02, d.rider.grip[0] + 0.12, d.rider.grip[1] - 0.07, d.rider.grip[0] + 0.03, d.rider.grip[1] - 0.05], d.col[2], 0.02);
  },
  wheel: [{ tyre: 0.27, knob: 1, type: 'spoke' }, { tyre: 0.23, knob: 1, type: 'spoke' }], guard: true, forkLower: 0.38, clamp: 0.17, bars: 0.4 };
KIND.climber = { under: function (c, d, g) {
    // the long braced swingarm is the whole point of this bike
    tube(c, [g.SP[0], g.SP[1] + 0.12, g.RA[0] + 0.3, g.RA[1] + 0.2, g.RA[0], g.RA[1]], 0.03, d.col[1]);
    tube(c, [g.SP[0] - 0.3, g.SP[1] + 0.04, g.RA[0] + 0.3, g.RA[1] + 0.2], 0.022, d.col[1]);
    tube(c, [g.SP[0] - 0.62, g.SP[1] - 0.02, g.RA[0] + 0.62, g.RA[1] + 0.14], 0.022, d.col[1]);
    mxUnder(c, d, g, 0.52, {});
  }, over: function (c, d, g) { mxOver(c, d, g, 0.52, {}); },
  wheel: [{ tyre: 0.3, knob: 2, type: 'spoke' }, { tyre: 0.22, knob: 1, type: 'spoke' }], guard: true, forkLower: 0.38, clamp: 0.17, bars: 0.4, pivot: [1.02, 0.46] };

KIND.mini = {
  under: function (c, d, g) {
    swingarm(c, g, STEEL, 0.045); chain(c, g);
    shock(c, 0.20, 0.36, 0.26, 0.60, d.col[0]);
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.04, 0.42, 0.60, g.SP[0], g.SP[1]], 0.05, FRAME);
    tube(c, [0.40, 0.62, -0.04, 0.68], 0.03, FRAME);
    cases(c, 0.46, 0.33, 0.1);
    fins(c, 0.54, 0.36, 0.70, 0.40, 0.055, 5);
    curve(c, [0.72, 0.38, 0.72, 0.24, 0.5, 0.2, 0.3, 0.3, 0.16, 0.5], 0.035, CHROME);
    tube(c, [0.16, 0.5, -0.06, 0.6], 0.06, CHROME);
  },
  over: function (c, d, g) {
    var k = d.col;
    blob(c, [0.18, 0.70, -0.12, 0.74, -0.24, 0.80, -0.22, 0.74, -0.04, 0.64, 0.16, 0.62], k[0]);
    blob(c, [-0.02, 0.76, 0.3, 0.75, 0.46, 0.76, 0.48, 0.67, 0.2, 0.66, 0.0, 0.69], k[1]);
    blob(c, [0.42, 0.72, 0.56, 0.82, 0.74, 0.80, 0.78, 0.68, 0.68, 0.56, 0.5, 0.58], k[0]);
    shape(c, [0.54, 0.74, 0.70, 0.73, 0.68, 0.63, 0.56, 0.64], k[2], 0.016);
    blob(c, [g.HT[0] - 0.08, g.HT[1] - 0.06, g.HT[0] + 0.12, g.HT[1] - 0.08, g.HT[0] + 0.3, g.HT[1] - 0.15, g.HT[0] + 0.3, g.HT[1] - 0.19, g.HT[0] + 0.1, g.HT[1] - 0.13, g.HT[0] - 0.08, g.HT[1] - 0.11], k[0]);
    blob(c, [g.HT[0] + 0.0, g.HT[1] + 0.12, g.HT[0] + 0.08, g.HT[1] + 0.09, g.HT[0] + 0.1, g.HT[1] - 0.05, g.HT[0] + 0.02, g.HT[1] - 0.07], k[2]);
  },
  wheel: [{ tyre: 0.42, knob: 1, type: 'alloy5' }, { tyre: 0.42, knob: 1, type: 'alloy5' }], forkLower: 0.24, clamp: 0.1, bars: 0.9 };

KIND.trials = {
  under: function (c, d, g) {
    swingarm(c, g, CHROME, 0.055); chain(c, g);
    shock(c, 0.36, 0.44, 0.44, 0.72, d.col[0]);
    tube(c, [g.HT[0] - 0.03, g.HT[1] - 0.05, 0.62, 0.74, g.SP[0], g.SP[1]], 0.06, d.col[0]);
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.12, 0.86, 0.44, 0.72, 0.28], 0.034, FRAME);
    cases(c, 0.60, 0.42, 0.115);
    fins(c, 0.66, 0.50, 0.74, 0.66, 0.06, 4);
    curve(c, [0.78, 0.62, 0.9, 0.5, 0.8, 0.34, 0.5, 0.56, 0.3, 0.7], 0.04, '#c9a56a');
    tube(c, [0.30, 0.71, -0.02, 0.82], 0.07, '#30333c');
    tube(c, [0.42, 0.26, 0.84, 0.29], 0.03, STEEL);     // bash plate
  },
  over: function (c, d, g) {
    var k = d.col;
    blob(c, [0.46, 0.76, 0.1, 0.84, -0.22, 0.98, -0.2, 0.92, 0.1, 0.77, 0.44, 0.70], k[0]);
    blob(c, [0.44, 0.76, 0.66, 0.86, 0.9, 0.9, 0.94, 0.8, 0.82, 0.68, 0.56, 0.68], k[1]);
    line(c, [0.6, 0.8, 0.86, 0.84], 0.03, k[0]);
    blob(c, [g.HT[0] - 0.1, g.HT[1] - 0.13, g.HT[0] + 0.14, g.HT[1] - 0.14, g.HT[0] + 0.4, g.HT[1] - 0.22, g.HT[0] + 0.4, g.HT[1] - 0.26, g.HT[0] + 0.12, g.HT[1] - 0.19, g.HT[0] - 0.1, g.HT[1] - 0.18], k[0]);
    blob(c, [g.HT[0] + 0.0, g.HT[1] + 0.1, g.HT[0] + 0.08, g.HT[1] + 0.07, g.HT[0] + 0.1, g.HT[1] - 0.08, g.HT[0] + 0.02, g.HT[1] - 0.1], k[1]);
  },
  wheel: [{ tyre: 0.3, knob: 1, type: 'spoke' }, { tyre: 0.22, knob: 1, type: 'spoke' }], forkLower: 0.34, clamp: 0.15, bars: 0.5 };

KIND.scooter = {
  under: function (c, d, g) {
    tube(c, [0.36, 0.3, g.RA[0], g.RA[1]], 0.07, ENG);
    blob(c, [0.34, 0.42, 0.12, 0.44, 0.02, 0.28, 0.2, 0.2, 0.42, 0.26], ENG);
    tube(c, [0.2, 0.2, -0.16, 0.24], 0.06, CHROME);
    tube(c, [g.HT[0], g.HT[1], g.HT[0] - 0.04, g.HT[1] + 0.12], 0.04, FRAME);
  },
  over: function (c, d, g) {
    var k = d.col;
    // rear body, floorboard, leg shield in one sweep
    blob(c, [-0.22, 0.56, -0.2, 0.74, 0.1, 0.80, 0.56, 0.74, 0.62, 0.4, 0.92, 0.36, 1.0, 0.6, 0.98, 1.0, 1.08, 1.02, 1.12, 0.5, 1.04, 0.24, 0.5, 0.24, 0.3, 0.42, 0.0, 0.42], k[0]);
    blob(c, [-0.06, 0.52, 0.3, 0.52, 0.34, 0.66, -0.04, 0.68], shade(k[0], 0.82), 0.016);
    line(c, [0.6, 0.3, 1.0, 0.3], 0.03, shade(k[0], 0.7));
    // seat and rack
    blob(c, [-0.08, 0.86, 0.3, 0.88, 0.6, 0.82, 0.6, 0.74, 0.1, 0.76, -0.1, 0.78], k[2]);
    tube(c, [-0.3, 0.82, -0.12, 0.8, -0.1, 0.72], 0.022, CHROME);
    circ(c, -0.23, 0.62, 0.035, '#e8483a', 0.016);
    // headset
    blob(c, [0.94, 1.0, 0.98, 1.12, 1.12, 1.12, 1.16, 1.0, 1.08, 0.94], k[0]);
    circ(c, 1.13, 1.04, 0.055, '#fff3b8', 0.02);
    line(c, [1.04, 0.86, 1.07, 0.5], 0.02, k[1]);
    // front mudguard hugs the wheel
    c.beginPath(); c.arc(g.FA[0], g.FA[1], d.rf + 0.05, 0.25, 2.5); c.lineWidth = 0.1; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(g.FA[0], g.FA[1], d.rf + 0.05, 0.27, 2.48); c.lineWidth = 0.065; c.strokeStyle = k[0]; c.stroke();
  },
  wheel: [{ tyre: 0.4, knob: 0, type: 'disc', fill: '#e9e5d6' }, { tyre: 0.4, knob: 0, type: 'disc', fill: '#e9e5d6' }], forkLower: 0.2, clamp: 0.08, bars: 0.2, mirror: true };

KIND.chopper = {
  under: function (c, d, g) {
    // rigid-looking frame
    tube(c, [g.HT[0] - 0.03, g.HT[1] - 0.05, 0.62, 0.82, 0.36, 0.66, g.RA[0], g.RA[1]], 0.045, d.col[0]);
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.14, 1.0, 0.34, 0.5, 0.26, g.RA[0], g.RA[1]], 0.04, d.col[0]);
    chain(c, { SP: [0.6, 0.36], RA: g.RA });
    // V-twin
    cases(c, 0.7, 0.36, 0.14, ENG);
    fins(c, 0.66, 0.46, 0.54, 0.72, 0.075, 6);
    fins(c, 0.76, 0.46, 0.9, 0.70, 0.075, 6);
    circ(c, 0.72, 0.62, 0.075, CHROME, 0.02);
    // two straight pipes
    curve(c, [0.94, 0.62, 1.02, 0.4, 0.8, 0.24, 0.1, 0.24, -0.34, 0.26], 0.05, CHROME);
    curve(c, [0.5, 0.64, 0.4, 0.4, 0.1, 0.34, -0.3, 0.36], 0.05, CHROME);
  },
  over: function (c, d, g) {
    var k = d.col;
    // bobbed rear fender
    c.beginPath(); c.arc(g.RA[0], g.RA[1], d.rr + 0.06, 0.5, 2.6); c.lineWidth = 0.12; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(g.RA[0], g.RA[1], d.rr + 0.06, 0.52, 2.58); c.lineWidth = 0.085; c.strokeStyle = k[0]; c.stroke();
    // sissy bar and seat
    tube(c, [0.02, 0.5, -0.02, 1.16, 0.06, 1.18, 0.12, 0.6], 0.022, CHROME);
    blob(c, [0.18, 0.80, 0.4, 0.76, 0.64, 0.80, 0.62, 0.70, 0.4, 0.66, 0.18, 0.7], '#5a3a26');
    // teardrop tank with flame stripe
    blob(c, [0.6, 0.86, 0.74, 1.0, 1.02, 1.06, 1.14, 1.0, 1.06, 0.88, 0.8, 0.82], k[0]);
    blob(c, [0.72, 0.9, 0.84, 0.98, 1.04, 0.99, 0.9, 0.93, 0.98, 0.9, 0.82, 0.9], k[1], 0.014);
    circ(c, g.HT[0] + 0.12, g.HT[1] - 0.1, 0.07, CHROME, 0.022);
    circ(c, g.HT[0] + 0.15, g.HT[1] - 0.1, 0.04, '#fff3b8', 0.014);
  },
  wheel: [{ tyre: 0.36, knob: 0, type: 'spoke' }, { tyre: 0.16, knob: 0, type: 'spoke' }], forkLower: 0.3, clamp: 0.12, bars: 0, chromeFork: true };

KIND.cafe = {
  under: function (c, d, g) {
    swingarm(c, g, STEEL, 0.05); chain(c, g);
    shock(c, 0.12, 0.40, 0.26, 0.78, CHROME);
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.03, 0.62, 0.84, 0.3, 0.8, 0.02, 0.84], 0.04, FRAME);
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.12, 0.98, 0.34, 0.5, 0.3, g.SP[0], g.SP[1]], 0.036, FRAME);
    // parallel twin
    blob(c, [0.52, 0.3, 0.5, 0.52, 0.66, 0.56, 0.94, 0.5, 0.96, 0.3], ENG);
    fins(c, 0.74, 0.5, 0.80, 0.76, 0.1, 7);
    circ(c, 0.62, 0.42, 0.08, ENGD, 0.02); circ(c, 0.84, 0.4, 0.06, ENGD, 0.02);
    blob(c, [0.5, 0.66, 0.66, 0.7, 0.64, 0.58, 0.48, 0.56], '#30333c');
    // twin megaphones
    curve(c, [0.9, 0.7, 1.02, 0.5, 0.9, 0.28, 0.5, 0.25, 0.1, 0.27], 0.04, CHROME);
    shape(c, [0.12, 0.31, -0.3, 0.36, -0.3, 0.24, 0.12, 0.245], CHROME);
    shape(c, [0.1, 0.42, -0.24, 0.49, -0.24, 0.38, 0.1, 0.36], CHROME);
  },
  over: function (c, d, g) {
    var k = d.col;
    // seat and hump
    blob(c, [-0.06, 0.86, -0.04, 1.0, 0.16, 0.99, 0.26, 0.9, 0.6, 0.9, 0.6, 0.82, 0.0, 0.8], k[0]);
    blob(c, [0.24, 0.92, 0.6, 0.92, 0.6, 0.86, 0.26, 0.86], '#2a2118', 0.02);
    line(c, [-0.02, 0.9, 0.16, 0.92], 0.024, k[1]);
    // long tank with knee dent
    blob(c, [0.56, 0.88, 0.62, 1.02, 1.04, 1.02, 1.1, 0.92, 1.02, 0.80, 0.62, 0.80], k[0]);
    blob(c, [0.62, 0.86, 0.72, 0.94, 0.88, 0.9, 0.74, 0.82], shade(k[0], 0.75), 0);
    line(c, [0.64, 0.99, 1.02, 0.99], 0.024, k[1]);
    // round headlight
    circ(c, g.HT[0] + 0.1, g.HT[1] - 0.06, 0.09, '#2b2f38', 0.024);
    circ(c, g.HT[0] + 0.13, g.HT[1] - 0.06, 0.065, '#fff3b8', 0.018);
    // short mudguard
    c.beginPath(); c.arc(g.FA[0], g.FA[1], d.rf + 0.035, 0.7, 2.2); c.lineWidth = 0.055; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(g.FA[0], g.FA[1], d.rf + 0.035, 0.72, 2.18); c.lineWidth = 0.028; c.strokeStyle = CHROME; c.stroke();
  },
  wheel: [{ tyre: 0.24, knob: 0, type: 'spoke' }, { tyre: 0.22, knob: 0, type: 'spoke' }], forkLower: 0.3, clamp: 0.12, bars: 0 };

KIND.electric = {
  under: function (c, d, g) {
    swingarm(c, g, '#30333c', 0.07);
    line(c, [g.SP[0], g.SP[1], g.RA[0], g.RA[1]], 0.014, d.col[1]);
    shock(c, 0.42, 0.5, 0.52, 0.86, d.col[1]);
    circ(c, g.SP[0], g.SP[1], 0.11, '#30333c', 0.024); circ(c, g.SP[0], g.SP[1], 0.06, d.col[1], 0.016);
  },
  over: function (c, d, g) {
    var k = d.col;
    // battery monocoque
    shape(c, [0.44, 0.34, 0.98, 0.32, 1.06, 0.62, g.HT[0], g.HT[1] - 0.04, 0.66, 0.98, 0.42, 0.72], k[2]);
    shape(c, [0.56, 0.42, 0.92, 0.41, 0.98, 0.62, 0.94, 0.82, 0.68, 0.86, 0.54, 0.68], '#2b3040', 0.018);
    line(c, [0.62, 0.5, 0.9, 0.49], 0.022, k[1]); line(c, [0.62, 0.6, 0.92, 0.6], 0.022, k[1]); line(c, [0.64, 0.7, 0.9, 0.71], 0.022, k[1]);
    // floating tail and shell
    shape(c, [0.02, 1.04, 0.66, 0.99, 0.62, 0.9, 0.14, 0.92, -0.18, 1.0], k[0]);
    shape(c, [0.14, 1.0, 0.6, 0.98, 0.58, 0.94, 0.16, 0.95], '#2b3040', 0.016);
    line(c, [-0.14, 1.005, 0.0, 1.03], 0.02, '#ff4a5a');
    shape(c, [0.62, 0.99, g.HT[0] + 0.02, g.HT[1] + 0.02, g.HT[0] + 0.1, g.HT[1] - 0.12, 0.98, 0.66, 0.74, 0.80], k[0]);
    line(c, [0.7, 0.95, g.HT[0], g.HT[1] - 0.04], 0.02, k[1]);
    shape(c, [g.HT[0] + 0.04, g.HT[1] + 0.12, g.HT[0] + 0.14, g.HT[1] + 0.02, g.HT[0] + 0.13, g.HT[1] - 0.12, g.HT[0] + 0.05, g.HT[1] - 0.08], k[0]);
    line(c, [g.HT[0] + 0.115, g.HT[1] + 0.02, g.HT[0] + 0.11, g.HT[1] - 0.07], 0.022, k[1]);
    shape(c, [g.HT[0] - 0.02, g.HT[1] - 0.2, g.HT[0] + 0.3, g.HT[1] - 0.3, g.HT[0] + 0.3, g.HT[1] - 0.34, g.HT[0] - 0.02, g.HT[1] - 0.25], k[0], 0.02);
  },
  wheel: [{ tyre: 0.24, knob: 1, type: 'glow', glow: '#22e0c8' }, { tyre: 0.24, knob: 1, type: 'glow', glow: '#22e0c8' }], forkLower: 0.34, clamp: 0.15, bars: 0.3 };

KIND.fat = {
  under: function (c, d, g) {
    swingarm(c, g, FRAME, 0.07); chain(c, g);
    shock(c, 0.44, 0.66, 0.56, 1.04, d.col[0]);
    tube(c, [g.HT[0] - 0.03, g.HT[1] - 0.05, 0.86, 1.08, g.SP[0], g.SP[1]], 0.06, d.col[0]);
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.14, 1.06, 0.62, 0.8, 0.42, g.SP[0], g.SP[1] - 0.04], 0.05, d.col[0]);
    tube(c, [0.7, 1.06, 0.06, 1.12, g.SP[0], g.SP[1] + 0.1], 0.04, d.col[0]);
    cases(c, 0.8, 0.6, 0.15);
    fins(c, 0.86, 0.72, 0.96, 0.98, 0.085, 6);
    curve(c, [1.04, 0.9, 1.12, 0.7, 0.98, 0.46, 0.6, 0.6, 0.4, 0.86], 0.05, '#c9a56a');
    tube(c, [0.4, 0.88, 0.02, 0.98], 0.1, '#30333c');
  },
  over: function (c, d, g) {
    var k = d.col;
    tube(c, [-0.32, 1.2, 0.1, 1.17, 0.1, 1.1], 0.026, FRAME);       // rack
    tube(c, [-0.28, 1.2, -0.2, 1.1], 0.022, FRAME);
    blob(c, [0.1, 1.2, 0.5, 1.2, 0.78, 1.18, 0.8, 1.08, 0.46, 1.06, 0.12, 1.1], k[1]);
    blob(c, [0.72, 1.12, 0.84, 1.26, 1.1, 1.28, 1.2, 1.16, 1.1, 1.02, 0.84, 1.0], k[0]);
    shape(c, [0.86, 1.2, 1.08, 1.21, 1.1, 1.12, 0.88, 1.1], k[2], 0.016);
    // wide mudguards
    c.beginPath(); c.arc(g.RA[0], g.RA[1], d.rr + 0.08, 0.6, 2.2); c.lineWidth = 0.1; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(g.RA[0], g.RA[1], d.rr + 0.08, 0.62, 2.18); c.lineWidth = 0.065; c.strokeStyle = k[0]; c.stroke();
    c.beginPath(); c.arc(g.FA[0], g.FA[1], d.rf + 0.08, 0.7, 2.3); c.lineWidth = 0.1; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(g.FA[0], g.FA[1], d.rf + 0.08, 0.72, 2.28); c.lineWidth = 0.065; c.strokeStyle = k[0]; c.stroke();
    circ(c, g.HT[0] + 0.1, g.HT[1] + 0.02, 0.07, '#fff3b8', 0.022);
  },
  wheel: [{ tyre: 0.5, knob: 1, type: 'alloy5' }, { tyre: 0.5, knob: 1, type: 'alloy5' }], forkLower: 0.3, clamp: 0.2, bars: 0.5 };

KIND.sport = {
  under: function (c, d, g) {
    swingarm(c, g, STEEL, 0.07); chain(c, g);
    shape(c, [0.2, 0.3, -0.24, 0.34, -0.26, 0.24, 0.2, 0.22], '#30333c');       // stubby exhaust
    circ(c, 0.7, 0.44, 0.13, ENGD, 0.02);
  },
  over: function (c, d, g) {
    var k = d.col;
    // tail
    shape(c, [0.5, 0.92, 0.2, 0.9, -0.2, 1.1, -0.16, 0.98, 0.14, 0.78, 0.46, 0.74], k[0]);
    shape(c, [0.16, 0.92, 0.46, 0.93, 0.48, 0.87, 0.2, 0.85], '#22252d', 0.016);
    line(c, [-0.17, 1.05, -0.05, 0.99], 0.02, '#ff4a5a');
    // tank
    blob(c, [0.46, 0.9, 0.56, 1.04, 0.9, 1.06, 1.0, 0.94, 0.9, 0.80, 0.52, 0.80], k[0]);
    // fairing: nose, side, belly
    shape(c, [0.98, 1.0, 1.2, 1.02, 1.44, 0.86, 1.4, 0.72, 1.24, 0.5, 1.02, 0.28, 0.5, 0.26, 0.42, 0.4, 0.62, 0.62, 0.8, 0.82], k[0]);
    shape(c, [0.56, 0.3, 1.0, 0.31, 1.18, 0.5, 0.9, 0.58, 0.62, 0.5], k[1], 0.018);
    shape(c, [0.84, 0.82, 1.3, 0.78, 1.38, 0.86, 1.24, 0.96, 0.98, 0.96], k[2], 0.018);
    line(c, [0.7, 0.66, 1.26, 0.62], 0.03, k[1]);
    // screen and light
    shape(c, [1.0, 1.01, 1.18, 1.03, 1.1, 1.2, 0.98, 1.16], 'rgba(120,190,255,0.5)', 0.018);
    shape(c, [1.3, 0.84, 1.43, 0.85, 1.4, 0.76, 1.3, 0.78], '#fff3b8', 0.016);
    c.beginPath(); c.arc(g.FA[0], g.FA[1], d.rf + 0.035, 0.6, 2.3); c.lineWidth = 0.06; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(g.FA[0], g.FA[1], d.rf + 0.035, 0.62, 2.28); c.lineWidth = 0.034; c.strokeStyle = k[0]; c.stroke();
  },
  wheel: [{ tyre: 0.26, knob: 0, type: 'alloy3' }, { tyre: 0.24, knob: 0, type: 'alloy3' }], forkLower: 0.3, clamp: 0.1, bars: 0, goldFork: true };

KIND.rocket = {
  under: function (c, d, g) {
    swingarm(c, g, STEEL, 0.055);
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.04, 0.7, 0.72, g.SP[0], g.SP[1]], 0.05, FRAME);
    // turbine
    shape(c, [0.62, 0.74, -0.2, 0.78, -0.3, 0.72, -0.3, 0.52, -0.2, 0.46, 0.62, 0.48, 0.76, 0.61], '#8d949f');
    shape(c, [-0.2, 0.78, -0.42, 0.74, -0.42, 0.5, -0.2, 0.46], '#30333c');
    line(c, [-0.02, 0.77, -0.02, 0.47], 0.02, '#5d636e'); line(c, [0.2, 0.76, 0.2, 0.47], 0.02, '#5d636e'); line(c, [0.42, 0.75, 0.42, 0.48], 0.02, '#5d636e');
    circ(c, 0.66, 0.61, 0.07, '#22252d', 0.02);
  },
  over: function (c, d, g) {
    var k = d.col;
    // hull
    blob(c, [0.0, 0.84, 0.3, 0.9, 0.7, 0.9, 1.1, 0.98, 1.5, 0.8, 1.36, 0.62, 1.0, 0.56, 0.6, 0.7, 0.2, 0.76], k[0]);
    shape(c, [0.72, 0.86, 1.1, 0.9, 1.4, 0.78, 1.2, 0.7, 0.9, 0.7], k[2], 0.018);
    line(c, [0.1, 0.82, 0.62, 0.84], 0.03, k[1]);
    shape(c, [0.98, 0.95, 1.14, 0.97, 1.06, 1.12, 0.96, 1.08], 'rgba(120,190,255,0.5)', 0.018);
    // tail fin
    shape(c, [0.02, 0.86, -0.3, 1.14, -0.18, 1.14, 0.3, 0.9], k[1]);
    shape(c, [1.36, 0.78, 1.5, 0.8, 1.46, 0.72, 1.36, 0.72], '#fff3b8', 0.016);
  },
  wheel: [{ tyre: 0.24, knob: 0, type: 'disc', fill: '#2a3550' }, { tyre: 0.24, knob: 0, type: 'disc', fill: '#2a3550' }], forkLower: 0.3, clamp: 0.1, bars: 0 };

/* penny-farthing with a little engine hung under the saddle */
KIND.penny = {
  under: function (c, d, g) {
    var k = d.col;
    // belt down to the back wheel, then the backbone sweeping from the head down to the rear axle
    line(c, [0.4, 0.9, g.RA[0] + 0.02, g.RA[1] + 0.09], 0.02, '#30333c'); line(c, [0.36, 0.78, g.RA[0] - 0.02, g.RA[1] - 0.08], 0.02, '#30333c');
    curve(c, [g.HT[0] - 0.02, g.HT[1] - 0.04, 0.72, 1.44, 0.36, 1.12, 0.12, 0.6, g.RA[0], g.RA[1]], 0.06, k[0]);
    tube(c, [g.RA[0], g.RA[1], g.RA[0] + 0.02, g.RA[1] + 0.34, 0.16, 0.72], 0.03, k[0]);
    cases(c, 0.42, 0.86, 0.085, k[1]);
    fins(c, 0.47, 0.93, 0.56, 1.08, 0.05, 4);
    curve(c, [0.38, 0.8, 0.2, 0.74, 0.02, 0.84, -0.14, 0.98], 0.035, k[1]);
    circ(c, g.RA[0], g.RA[1], 0.08, null, 0.014, '#6a707b');
    circ(c, 0.14, 0.5, 0.03, CHROME, 0.014); line(c, [0.14, 0.5, 0.24, 0.5], 0.03, RUB);   // mounting step
  },
  over: function (c, d, g) {
    var k = d.col, sx = d.rider.seat[0], sy = d.rider.seat[1];
    // sprung leather saddle
    shock(c, sx - 0.1, sy - 0.16, sx - 0.14, sy + 0.02, CHROME);
    blob(c, [sx - 0.24, sy + 0.1, sx + 0.04, sy + 0.12, sx + 0.3, sy + 0.06, sx + 0.3, sy - 0.02, sx - 0.02, sy - 0.02, sx - 0.24, sy + 0.02], '#6b3f22');
    // brass lamp
    tube(c, [g.HT[0] + 0.02, g.HT[1] - 0.08, g.HT[0] + 0.12, g.HT[1] - 0.12], 0.02, k[1]);
    blob(c, [g.HT[0] + 0.1, g.HT[1] - 0.02, g.HT[0] + 0.24, g.HT[1] - 0.03, g.HT[0] + 0.25, g.HT[1] - 0.22, g.HT[0] + 0.1, g.HT[1] - 0.22], k[1], 0.022);
    circ(c, g.HT[0] + 0.22, g.HT[1] - 0.12, 0.05, '#fff3b8', 0.016);
    // pedal crank on the hub
    circ(c, g.FA[0], g.FA[1], 0.07, k[1], 0.02);
    tube(c, [g.FA[0], g.FA[1], d.rider.peg[0], d.rider.peg[1] + 0.02], 0.026, CHROME, 0.02);
  },
  wheel: [{ tyre: 0.3, knob: 0, type: 'spoke', spokes: 8 }, { tyre: 0.085, knob: 0, type: 'spoke', spokes: 22 }], forkLower: 0.5, clamp: 0.08, bars: 0.2, chromeFork: true };

/* soft, padded and wearing a roll hoop */
KIND.bumper = {
  under: function (c, d, g) {
    var k = d.col;
    mxUnder(c, d, g, 0.02, {});
    // the roll hoop goes up behind the seat, over the rider and down to the bars (it comes off in a crash)
    if (g.wrecked) return;
    curve(c, [-0.16, 0.9, -0.34, 1.6, -0.1, 2.24, 0.62, 2.42, 1.2, 2.16, 1.36, 1.6, g.HT[0] + 0.02, g.HT[1] + 0.06], 0.07, k[2]);
    var pads = [[-0.3, 1.4, -0.3, 1.74], [0.16, 2.36, 0.56, 2.42], [1.04, 2.26, 1.26, 2.02]], i;
    for (i = 0; i < pads.length; i++) tube(c, pads[i], 0.14, k[1], 0.04);
  },
  over: function (c, d, g) {
    var k = d.col, sy = d.rider.seat[1] - 0.93;
    // everything is a cushion
    blob(c, [0.3, 0.98 + sy, -0.16, 1.06 + sy, -0.44, 1.02 + sy, -0.4, 0.86 + sy, 0.0, 0.84 + sy, 0.3, 0.84 + sy], k[0]);
    blob(c, [-0.5, 1.06 + sy, -0.36, 1.12 + sy, -0.3, 0.9 + sy, -0.46, 0.84 + sy], k[1], 0.022);
    blob(c, [0.04, 1.03 + sy, 0.42, 1.0 + sy, 0.74, 1.0 + sy, 0.76, 0.92 + sy, 0.42, 0.9 + sy, 0.06, 0.94 + sy], k[1]);
    blob(c, [0.62, 0.96 + sy, 0.82, 1.14 + sy, 1.1, 1.12 + sy, 1.14, 0.9 + sy, 1.0, 0.66, 0.84, 0.6, 0.72, 0.78 + sy], k[0]);
    blob(c, [0.8, 1.0 + sy, 1.04, 0.98 + sy, 0.98, 0.76, 0.86, 0.74], k[1], 0.018);
    circ(c, 0.92, 0.9 + sy, 0.05, k[2], 0.016);
    // fat mudguards and a bumper on the nose
    c.beginPath(); c.arc(g.RA[0], g.RA[1], d.rr + 0.08, 0.7, 2.3); c.lineWidth = 0.12; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(g.RA[0], g.RA[1], d.rr + 0.08, 0.72, 2.28); c.lineWidth = 0.085; c.strokeStyle = k[0]; c.stroke();
    c.beginPath(); c.arc(g.FA[0], g.FA[1], d.rf + 0.08, 0.6, 2.2); c.lineWidth = 0.12; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(g.FA[0], g.FA[1], d.rf + 0.08, 0.62, 2.18); c.lineWidth = 0.085; c.strokeStyle = k[0]; c.stroke();
    blob(c, [g.HT[0] + 0.0, g.HT[1] + 0.16, g.HT[0] + 0.16, g.HT[1] + 0.12, g.HT[0] + 0.2, g.HT[1] - 0.12, g.HT[0] + 0.04, g.HT[1] - 0.16], k[1]);
  },
  wheel: [{ tyre: 0.4, knob: 1, type: 'disc', fill: '#fff8ee' }, { tyre: 0.4, knob: 1, type: 'disc', fill: '#fff8ee' }], forkLower: 0.36, clamp: 0.17, bars: 0.4 };

/* drag bike: long, low, a slick the size of a barrel and a wheelie bar out the back */
KIND.drag = {
  under: function (c, d, g) {
    var k = d.col;
    // wheelie bar
    tube(c, [g.RA[0], g.RA[1], -0.46, 0.14], 0.026, CHROME, 0.022); tube(c, [0.1, g.RA[1] + 0.2, -0.46, 0.14], 0.02, CHROME, 0.02);
    circ(c, -0.46, 0.13, 0.07, RUB, 0.02); circ(c, -0.46, 0.13, 0.025, CHROME, 0);
    // frame rails
    tube(c, [g.HT[0] - 0.02, g.HT[1] - 0.1, 1.4, 0.36, 0.5, 0.34, g.RA[0], g.RA[1]], 0.045, FRAME);
    tube(c, [g.HT[0] - 0.03, g.HT[1] - 0.02, 1.2, 0.74, 0.44, 0.68, g.RA[0], g.RA[1] + 0.04], 0.04, FRAME);
    chain(c, { SP: [0.86, 0.44], RA: g.RA });
    // big twin with a blower sitting on top
    cases(c, 1.0, 0.44, 0.15);
    fins(c, 0.96, 0.54, 0.88, 0.72, 0.07, 5); fins(c, 1.12, 0.54, 1.24, 0.7, 0.07, 5);
    shape(c, [0.94, 0.74, 1.26, 0.74, 1.3, 0.86, 0.9, 0.86], '#30333c');
    shape(c, [0.98, 0.86, 1.2, 0.86, 1.3, 0.98, 1.14, 0.98], CHROME, 0.02);
    // four short pipes
    var i; for (i = 0; i < 4; i++) tube(c, [0.82 + i * 0.1, 0.4, 0.6 + i * 0.1, 0.24, 0.46 + i * 0.1, 0.2], 0.035, i % 2 ? CHROME : '#c9a56a', 0.022);
  },
  over: function (c, d, g) {
    var k = d.col;
    // tail hump with the parachute pack on the back
    blob(c, [0.16, 0.74, 0.14, 0.98, 0.34, 1.0, 0.52, 0.86, 0.66, 0.84, 0.66, 0.74], k[0]);
    shape(c, [0.06, 0.78, 0.18, 0.78, 0.18, 0.94, 0.06, 0.92], k[2], 0.02);
    line(c, [0.2, 0.86, 0.5, 0.8], 0.03, k[1]);
    // long seat and tank
    blob(c, [0.6, 0.78, 0.9, 0.86, 1.3, 0.88, 1.66, 0.84, 1.72, 0.74, 1.3, 0.72, 0.62, 0.72], k[0]);
    blob(c, [0.62, 0.8, 0.92, 0.84, 0.94, 0.78, 0.64, 0.75], '#2a2118', 0.018);
    line(c, [1.0, 0.8, 1.64, 0.79], 0.028, k[1]);
    // bullet nose
    blob(c, [g.HT[0] - 0.18, g.HT[1] + 0.02, g.HT[0] - 0.06, g.HT[1] + 0.22, g.HT[0] + 0.18, g.HT[1] + 0.12, g.HT[0] + 0.2, g.HT[1] - 0.1, g.HT[0] - 0.04, g.HT[1] - 0.16], k[0]);
    shape(c, [g.HT[0] - 0.04, g.HT[1] + 0.2, g.HT[0] + 0.08, g.HT[1] + 0.16, g.HT[0] - 0.02, g.HT[1] + 0.36, g.HT[0] - 0.1, g.HT[1] + 0.34], 'rgba(120,190,255,0.5)', 0.016);
    circ(c, g.HT[0] + 0.14, g.HT[1], 0.045, '#fff3b8', 0.014);
    // the slick wears a hugging mudguard
    c.beginPath(); c.arc(g.RA[0], g.RA[1], d.rr + 0.05, 1.0, 2.5); c.lineWidth = 0.08; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(g.RA[0], g.RA[1], d.rr + 0.05, 1.02, 2.48); c.lineWidth = 0.05; c.strokeStyle = k[0]; c.stroke();
  },
  wheel: [{ tyre: 0.46, knob: 0, type: 'disc', fill: '#2b2f3a' }, { tyre: 0.2, knob: 0, type: 'spoke', spokes: 12 }], forkLower: 0.24, clamp: 0.08, bars: 0, chromeFork: true };

/* ------------------------------ geometry ------------------------------ */
var pose = {}, J = [0, 0, 0, 0];
A.geom = function (d, RA, FA) {
  var K = KIND[d.kind], rake = (d.rake || 27) * Math.PI / 180;
  var forkLen = Math.min(0.95, (d.rider.grip[1] - d.rf) / Math.cos(rake) - (K.bars || 0) * 0.12 - 0.06);
  if (d.kind === 'chopper') forkLen = 1.05;
  var HT = [d.wb - Math.sin(rake) * forkLen, d.rf + Math.cos(rake) * forkLen];
  return { RA: RA || [0, d.rr], FA: FA || [d.wb, d.rf], HT: HT, SP: K.pivot || [0.5 * d.wb / 1.44, d.rr + 0.11],
    grip: d.rider.grip, forkLower: K.forkLower, clamp: K.clamp };
};

/* ------------------------------ rider ------------------------------ */
function limb(ctx, x0, y0, x1, y1, x2, y2, w1, w2, col) {
  ctx.lineWidth = w1 + 0.04; ctx.strokeStyle = OUT; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.lineWidth = w2 + 0.04; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = w1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.lineWidth = w2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
A.helmet = function (ctx, x, y, r, ang, d, kind) {
  if (d._skin) { A.head(ctx, x, y, r, ang, d._skin, d._t); return; }
  var s = d.suit, c = d.col;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(r, r);
  var lw = 0.028 / r;
  var open = kind === 'scooter' || kind === 'chopper';
  if (!open) {
    // chin bar
    ctx.beginPath(); ctx.moveTo(-0.3, -0.5); ctx.quadraticCurveTo(0.5, -0.2, 1.12, -0.38); ctx.quadraticCurveTo(1.2, -0.95, 0.5, -1.08); ctx.quadraticCurveTo(-0.2, -1.1, -0.6, -0.7); ctx.closePath();
    ctx.fillStyle = s[0]; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fillStyle = s[0]; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
  // stripe over the top
  ctx.beginPath(); ctx.arc(0, 0, 0.72, 0.5, 2.9); ctx.lineWidth = 0.24; ctx.strokeStyle = s[1]; ctx.stroke();
  if (open) {
    // face and goggles
    ctx.beginPath(); ctx.moveTo(0.2, 0.2); ctx.quadraticCurveTo(1.0, 0.1, 0.96, -0.5); ctx.quadraticCurveTo(0.6, -1.0, 0.1, -0.86); ctx.closePath();
    ctx.fillStyle = '#e8b890'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.66, -0.1, 0.34, 0.24, 0, 0, TAU); ctx.fillStyle = '#2b2f38'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0.7, -0.08, 0.22, 0.14, 0, 0, TAU); ctx.fillStyle = '#ffd24a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-0.9, -0.1); ctx.lineTo(0.4, -0.05); ctx.lineWidth = 0.14; ctx.strokeStyle = '#2b2f38'; ctx.stroke();
  } else {
    // eye port with goggle lens or visor
    ctx.beginPath(); ctx.moveTo(0.28, 0.3); ctx.quadraticCurveTo(0.9, 0.34, 1.02, 0.0); ctx.quadraticCurveTo(1.06, -0.3, 0.9, -0.34); ctx.lineTo(0.3, -0.26); ctx.closePath();
    ctx.fillStyle = '#20232b'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.44, 0.2); ctx.quadraticCurveTo(0.86, 0.24, 0.94, 0.0); ctx.quadraticCurveTo(0.96, -0.2, 0.86, -0.24); ctx.lineTo(0.46, -0.18); ctx.closePath();
    ctx.fillStyle = kind === 'sport' || kind === 'rocket' || kind === 'electric' ? '#3a2a55' : '#58c9f0'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0.56, 0.12); ctx.lineTo(0.8, 0.13); ctx.lineWidth = 0.07; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
    if (kind !== 'sport' && kind !== 'rocket' && kind !== 'cafe' && kind !== 'electric') {
      // peak
      ctx.beginPath(); ctx.moveTo(0.1, 0.84); ctx.lineTo(1.5, 0.52); ctx.lineTo(1.46, 0.36); ctx.lineTo(0.4, 0.5); ctx.closePath();
      ctx.fillStyle = s[1]; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = OUT; ctx.stroke();
    }
  }
  ctx.restore();
};

/* layer 0 = the far arm and leg (behind the bike), 1 = body, 2 = near leg and arm */
function bone(ctx, J, w) { line(ctx, [J[0] * 0.15 + J[2] * 0.85, J[1] * 0.15 + J[3] * 0.85, J[0], J[1]], w, '#f1ecdc'); }
A.rider = function (ctx, d, v, layer) {
  var R = d.rider, sc = R.scale || 1, s = d.suit, sk = d._skin || null, t = d._t || 0;
  RR.riderPose(d, v.lp || 0, v.stand || 0, pose);
  var hx = pose.hipX, hy = pose.hipY - (v.crouch || 0) * 0.06, sx = pose.shX, sy = pose.shY - (v.crouch || 0) * 0.07;
  var gx = R.grip[0], gy = R.grip[1] + 0.02, px = R.peg[0], py = R.peg[1] + 0.07;
  if (sk && sk.ghost) ctx.globalAlpha = 0.7;
  if (layer === 0) {
    var dk = shade(s[1], 0.62), dj = shade(s[0], 0.62);
    ik(hx + 0.03, hy, px + 0.05, py + 0.03, 0.44 * sc, 0.46 * sc, 1, J);
    limb(ctx, hx + 0.03, hy, J[0], J[1], J[2], J[3], 0.13 * sc, 0.105 * sc, dk);
    ik(sx + 0.03, sy - 0.02, gx + 0.03, gy, 0.30 * sc, 0.29 * sc, -1, J);
    limb(ctx, sx + 0.03, sy - 0.02, J[0], J[1], J[2], J[3], 0.085 * sc, 0.075 * sc, dj);
    ctx.globalAlpha = 1;
    return;
  }
  var tx = sx - hx, ty = sy - hy, tl = Math.sqrt(tx * tx + ty * ty) || 1, nx = -ty / tl, ny = tx / tl;
  if (layer === 1) {
    var w0 = 0.11 * sc, w1 = 0.125 * sc;
    if (sk && sk.cape) {
      // a cape off the shoulders, flapping behind
      var wv = Math.sin(t * 9) * 0.06, wv2 = Math.sin(t * 9 + 1.3) * 0.08;
      blob(ctx, [sx + nx * w1, sy + ny * w1, sx - 0.02, sy + 0.04, hx - 0.5 * sc, hy + 0.34 * sc + wv, hx - 0.86 * sc, hy + 0.1 * sc + wv2, hx - 0.6 * sc, hy - 0.16 * sc - wv, hx + nx * w0, hy + ny * w0], sk.cape);
    }
    if (sk && sk.pack) blob(ctx, [hx + nx * 0.1 + tx * 0.25, hy + ny * 0.1 + ty * 0.25, hx + nx * 0.3 + tx * 0.3, hy + ny * 0.3 + ty * 0.3, hx + nx * 0.3 + tx * 0.95, hy + ny * 0.3 + ty * 0.95, hx + nx * 0.1 + tx * 0.98, hy + ny * 0.1 + ty * 0.98], sk.pack);
    // torso
    blob(ctx, [hx + nx * w0 - tx / tl * 0.06, hy + ny * w0 - ty / tl * 0.06, sx + nx * w1 + tx / tl * 0.05, sy + ny * w1 + ty / tl * 0.05,
      sx - nx * w1 + tx / tl * 0.07, sy - ny * w1 + ty / tl * 0.07, hx - nx * w0 - tx / tl * 0.07, hy - ny * w0 - ty / tl * 0.07], s[0]);
    if (sk && sk.bones) {
      for (var rb = 0; rb < 3; rb++) { var f = 0.42 + rb * 0.2; line(ctx, [hx + tx * f + nx * w0 * 0.7, hy + ty * f + ny * w0 * 0.7, hx + tx * (f + 0.06) - nx * w0 * 0.75, hy + ty * (f + 0.06) - ny * w0 * 0.75], 0.03 * sc, '#f1ecdc'); }
      line(ctx, [hx + tx * 0.2, hy + ty * 0.2, hx + tx * 0.95, hy + ty * 0.95], 0.03 * sc, '#f1ecdc');
    } else if (sk && sk.stars) {
      for (var st = 0; st < 5; st++) { var fs = 0.15 + st * 0.18, tw = 0.5 + 0.5 * Math.sin(t * 5 + st * 2.1), o2 = (RR.Render.hash(st * 7.7) - 0.5) * 1.4;
        ctx.globalAlpha = 0.35 + 0.65 * tw; circ(ctx, hx + tx * fs + nx * w0 * o2, hy + ty * fs + ny * w0 * o2, 0.014 + 0.012 * tw, st % 2 ? '#ffffff' : '#9fe8ff', 0); }
      ctx.globalAlpha = 1;
    } else {
      // chest stripe
      ctx.lineWidth = 0.035 * sc; ctx.strokeStyle = s[1];
      ctx.beginPath(); ctx.moveTo(hx + tx * 0.5 + nx * w0 * 0.85, hy + ty * 0.5 + ny * w0 * 0.85); ctx.lineTo(hx + tx * 0.62 - nx * w0 * 0.85, hy + ty * 0.62 - ny * w0 * 0.85); ctx.stroke();
    }
    // neck and helmet
    tube(ctx, [sx, sy, pose.headX, pose.headY], 0.07 * sc, '#2b2f38', 0.03);
    A.helmet(ctx, pose.headX, pose.headY, 0.15 * sc, -(pose.headA - 0.22) * 0.6 + (v.headTilt || 0), d, d.kind);
    ctx.globalAlpha = 1;
    return;
  }
  // near leg, boot, near arm, glove
  ik(hx, hy, px, py, 0.44 * sc, 0.46 * sc, 1, J);
  limb(ctx, hx, hy, J[0], J[1], J[2], J[3], 0.14 * sc, 0.115 * sc, s[1]);
  if (sk && sk.bones) { line(ctx, [hx, hy, J[0], J[1]], 0.035 * sc, '#f1ecdc'); bone(ctx, J, 0.03 * sc); }
  circ(ctx, J[0], J[1], 0.06 * sc, s[2], 0.02);                                   // knee guard
  blob(ctx, [px - 0.1 * sc, py + 0.1 * sc, px + 0.02 * sc, py + 0.12 * sc, px + 0.2 * sc, py - 0.02 * sc, px + 0.21 * sc, py - 0.09 * sc, px - 0.1 * sc, py - 0.1 * sc], s[2]);
  ik(sx, sy - 0.03, gx, gy, 0.30 * sc, 0.29 * sc, -1, J);
  limb(ctx, sx, sy - 0.03, J[0], J[1], J[2], J[3], 0.095 * sc, 0.08 * sc, s[0]);
  if (sk && sk.bones) { line(ctx, [sx, sy - 0.03, J[0], J[1]], 0.03 * sc, '#f1ecdc'); bone(ctx, J, 0.026 * sc); }
  circ(ctx, sx, sy - 0.02, 0.07 * sc, s[1], 0.022);                                // shoulder pad
  circ(ctx, gx, gy, 0.05 * sc, s[2], 0.02);                                        // glove
  ctx.globalAlpha = 1;
};

/* ------------------------------ whole bike ------------------------------ */
/* v: { RA, FA, spinR, spinF, rateR, rateF, lp, stand, crouch, rider (bool), look: { paint, rider }, t } */
A.bike = function (ctx, d0, v) {
  var d = v.look && A.dress ? A.dress(ctx, d0, v.look, v.t || 0) : d0, p = d._paint || null;
  var K = KIND[d.kind], g = A.geom(d, v.RA, v.FA), c = d.col;
  g.wrecked = v.rider === false && v.wrecked;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (v.rider !== false) A.rider(ctx, d, v, 0);
  var w0 = K.wheel[0], w1 = K.wheel[1];
  var rim = d.kind === 'electric' ? '#3a4050' : CHROME;
  if (d.kind === 'mx' || d.kind === 'trials' || d.kind === 'enduro' || d.kind === 'climber') rim = '#2b2f38';
  if (d.kind === 'sport') rim = '#e0b23a';
  if (d.kind === 'fat' || d.kind === 'mini') rim = typeof c[2] === 'string' ? c[2] : CHROME;
  if (d.kind === 'penny') rim = typeof c[1] === 'string' ? c[1] : CHROME;
  if (d.kind === 'drag') rim = typeof c[1] === 'string' ? c[1] : CHROME;
  if (p && p.rim) rim = p.rim;
  w0.rim = w1.rim = rim;
  w0.glow2 = w1.glow2 = p ? A.paintGlow(p, v.t || 0) : null;
  A.wheel(ctx, g.RA[0], g.RA[1], d.rr, v.spinR || 0, w0, v.rateR || 0);
  A.wheel(ctx, g.FA[0], g.FA[1], d.rf, v.spinF || 0, w1, v.rateF || 0);
  K.under(ctx, d, g);
  fork(ctx, g, K.chromeFork ? CHROME : '#2b2f38', K.guard ? c[0] : null, K.goldFork ? '#e0b23a' : CHROME);
  K.over(ctx, d, g);
  if (p && p.glint && A.glints) A.glints(ctx, d, p, v.t || 0);
  bars(ctx, g, K.chromeFork ? CHROME : '#2b2f38', K.bars);
  if (v.rider !== false) { A.rider(ctx, d, v, 1); A.rider(ctx, d, v, 2); }
};
A.KIND = KIND;

/* where the exhaust (or jet nozzle) ends, for smoke and flames */
A.exhaust = function (d) {
  switch (d.kind) {
    case 'rocket': return [-0.44, 0.62];
    case 'chopper': return [-0.36, 0.3];
    case 'cafe': return [-0.3, 0.3];
    case 'sport': return [-0.27, 0.29];
    case 'scooter': return [-0.18, 0.24];
    case 'mini': return [-0.08, 0.6];
    case 'electric': return null;
    case 'climber': return [0.5, 0.9];
    case 'fat': return [0.0, 0.98];
    case 'penny': return [-0.16, 1.0];
    case 'drag': return [0.44, 0.2];
    case 'bumper': return [0.0, 0.95];
    default: return [0.0, 0.88];
  }
};

/* a still picture of a bike on a transparent canvas (garage cards, ghost) */
var sprites = {};
A.sprite = function (d, px, withRider) {
  var key = d.id + '|' + px + '|' + (withRider ? 1 : 0);
  if (sprites[key]) return sprites[key];
  var cv = document.createElement('canvas');
  var wM = d.wb + d.rr + d.rf + 0.9, hM = 2.25;
  cv.width = Math.ceil(wM * px); cv.height = Math.ceil(hM * px);
  var ctx = cv.getContext('2d');
  ctx.setTransform(px, 0, 0, -px, (d.rr + 0.5) * px, (hM - 0.06) * px);
  A.bike(ctx, d, { rider: !!withRider, lp: 0, stand: 0 });
  var o = { canvas: cv, ox: (d.rr + 0.5), oy: 0.06, wM: wM, hM: hM, px: px };
  sprites[key] = o;
  return o;
};
})(typeof window !== 'undefined' ? window : globalThis);
