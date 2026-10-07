/* Ridge Riot: paint jobs and riders.
   A paint job swaps a bike's three colours and can fill the main bodywork with a
   pattern, a sliding metal highlight, cut-gem facets or moving opal fire.
   A rider swaps the suit colours and the head. All drawn in code. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var A = RR.Art, TAU = Math.PI * 2, OUT = '#15171d';
var doc = root.document;

function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function hsl(h, s, l) { return 'hsl(' + ((h % 360 + 360) % 360).toFixed(0) + ',' + s + '%,' + l + '%)'; }
function mk(w, h) { var c = doc.createElement('canvas'); c.width = w; c.height = h; return c; }

/* ------------------------------------------------------------------ */
/* Pattern tiles (painted once, then repeated across the bodywork)      */
/* ------------------------------------------------------------------ */
var tiles = {};
/* draw fn(x, y) at every wrap-around position so the tile repeats without a seam */
function wrap(N, x, y, r, fn) { for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { var px = x + i * N, py = y + j * N; if (px > -r && px < N + r && py > -r && py < N + r) fn(px, py); } }
function blobAt(c, x, y, r, rnd, col, lump) {
  c.fillStyle = col; c.beginPath();
  var n = 9, k;
  for (k = 0; k <= n; k++) { var a = TAU * k / n, rr = r * (1 - lump * 0.5 + lump * rnd()); c[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); }
  c.closePath(); c.fill();
}
function tile(p) {
  if (tiles[p.id]) return tiles[p.id];
  var P = p.pat, N = 128, cv = mk(N, N), c = cv.getContext('2d', { willReadFrequently: true }), r = rng(77 + p.index * 131), i, x, y;
  c.fillStyle = P.a || '#888'; c.fillRect(0, 0, N, N);
  if (P.t === 'stripes') { c.fillStyle = P.b; c.fillRect(N / 2, 0, N / 2, N); }
  else if (P.t === 'checker') { c.fillStyle = P.b; c.fillRect(0, 0, N / 2, N / 2); c.fillRect(N / 2, N / 2, N / 2, N / 2); }
  else if (P.t === 'dots') { c.fillStyle = P.b; c.beginPath(); c.arc(N * 0.25, N * 0.25, N * 0.15, 0, TAU); c.arc(N * 0.75, N * 0.75, N * 0.15, 0, TAU); c.fill(); }
  else if (P.t === 'camo' || P.t === 'rust' || P.t === 'cow') {
    var n1 = P.t === 'cow' ? 7 : 12;
    for (i = 0; i < n1; i++) { x = r() * N; y = r() * N; var rad = N * (P.t === 'cow' ? 0.1 + r() * 0.12 : 0.08 + r() * 0.1); var seed = Math.floor(r() * 1e6);
      (function (s2, rad2) { wrap(N, x, y, rad2 * 1.3, function (px, py) { blobAt(c, px, py, rad2, rng(s2), P.b, 0.6); }); })(seed, rad); }
    if (P.c) for (i = 0; i < 9; i++) { x = r() * N; y = r() * N; var rd = N * (0.04 + r() * 0.07), sd = Math.floor(r() * 1e6);
      (function (s2, rad2) { wrap(N, x, y, rad2 * 1.3, function (px, py) { blobAt(c, px, py, rad2, rng(s2), P.c, 0.6); }); })(sd, rd); }
    if (P.t === 'rust') { c.fillStyle = 'rgba(40,16,6,0.35)'; for (i = 0; i < 70; i++) c.fillRect(r() * N, r() * N, 2, 2); }
  } else if (P.t === 'flames') {
    // tongues of fire running back along the bike, two rows
    for (var row = 0; row < 2; row++) for (var pass = 0; pass < 2; pass++) {
      c.fillStyle = pass ? P.c : P.b;
      for (i = 0; i < 3; i++) {
        var fx = (i + (row ? 0.5 : 0)) * N / 3, fy = N * (row ? 0.75 : 0.25), L = N * (pass ? 0.34 : 0.5), h = N * (pass ? 0.07 : 0.12);
        (function (fx2, fy2, L2, h2) { wrap(N, fx2, fy2, L2, function (px, py) {
          c.beginPath(); c.moveTo(px + L2 * 0.5, py - h2); c.bezierCurveTo(px + L2 * 0.1, py - h2 * 1.4, px - L2 * 0.2, py + h2 * 0.2, px - L2 * 0.5, py - h2 * 0.5);
          c.bezierCurveTo(px - L2 * 0.25, py + h2 * 0.6, px - L2 * 0.1, py + h2 * 0.2, px - L2 * 0.36, py + h2 * 1.1);
          c.bezierCurveTo(px, py + h2 * 1.5, px + L2 * 0.3, py + h2 * 0.8, px + L2 * 0.5, py + h2); c.closePath(); c.fill(); }); })(fx, fy, L, h);
      }
    }
  } else if (P.t === 'tiger') {
    c.strokeStyle = P.b; c.lineCap = 'round';
    for (i = 0; i < 6; i++) {
      x = (i + 0.5) * N / 6; c.lineWidth = N * (0.035 + r() * 0.03);
      var y0 = r() * N, len = N * (0.3 + r() * 0.25), bend = (r() - 0.5) * N * 0.14;
      (function (x2, y2, len2, bend2) { wrap(N, x2, y2, len2, function (px, py) { c.beginPath(); c.moveTo(px - bend2, py - len2 * 0.5); c.quadraticCurveTo(px + bend2 * 2, py, px - bend2, py + len2 * 0.5); c.stroke(); }); })(x, y0, len, bend);
    }
  } else if (P.t === 'carbon') {
    var q = N / 8; c.fillStyle = P.b;
    for (x = 0; x < 8; x++) for (y = 0; y < 8; y++) if ((x + y) % 2) c.fillRect(x * q, y * q, q, q);
    c.fillStyle = 'rgba(255,255,255,0.07)'; for (x = 0; x < 8; x++) for (y = 0; y < 8; y++) c.fillRect(x * q, y * q + ((x + y) % 2 ? 0 : q * 0.5), q, q * 0.5);
  } else if (P.t === 'splat') {
    for (i = 0; i < 10; i++) {
      x = r() * N; y = r() * N; var sr = N * (0.05 + r() * 0.09), col = P.cols[i % P.cols.length], sd2 = Math.floor(r() * 1e6);
      (function (s2, rad2, col2) { wrap(N, x, y, rad2 * 2.2, function (px, py) {
        var q2 = rng(s2); blobAt(c, px, py, rad2, q2, col2, 0.5);
        for (var k = 0; k < 6; k++) { var a = q2() * TAU, d = rad2 * (1.2 + q2() * 0.9); c.beginPath(); c.arc(px + Math.cos(a) * d, py + Math.sin(a) * d, rad2 * (0.1 + q2() * 0.16), 0, TAU); c.fill(); }
      }); })(sd2, sr, col);
    }
  } else if (P.t === 'gem') {
    // cut facets: a field of triangles in a handful of shades
    var g = 4, cs = N / g, pts = [], gx, gy;
    for (gy = 0; gy <= g; gy++) { pts.push([]); for (gx = 0; gx <= g; gx++) pts[gy].push([gx * cs + (gx % g ? (r() - 0.5) * cs * 0.6 : 0), gy * cs + (gy % g ? (r() - 0.5) * cs * 0.6 : 0)]); }
    for (gy = 0; gy < g; gy++) for (gx = 0; gx < g; gx++) {
      var a0 = pts[gy][gx], b0 = pts[gy][gx + 1], c0 = pts[gy + 1][gx + 1], d0 = pts[gy + 1][gx], flip = r() < 0.5;
      var tris = flip ? [[a0, b0, c0], [a0, c0, d0]] : [[a0, b0, d0], [b0, c0, d0]];
      tris.forEach(function (t) { c.fillStyle = P.cols[Math.floor(r() * P.cols.length)]; c.beginPath(); c.moveTo(t[0][0], t[0][1]); c.lineTo(t[1][0], t[1][1]); c.lineTo(t[2][0], t[2][1]); c.closePath(); c.fill();
        c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.28)'; c.stroke(); });
    }
  }
  return (tiles[p.id] = { cv: cv, pat: null, ctx: null });
}

/* opal: soft patches of colour drifting over a pale (or dark) base, repainted as time moves */
var opalCv = {};
function opalTile(p, t) {
  var N = 64, o = opalCv[p.id] || (opalCv[p.id] = { cv: mk(N, N), t: -9 });
  if (Math.abs(t - o.t) < 0.09) return o;       // repainted about ten times a second; the drift in between is done by sliding it
  o.t = t; o.pat = null;
  // kept as a plain in-memory picture: it is small, repainted often and copied into a pattern each time
  var c = o.cv.getContext('2d', { willReadFrequently: true }), P = p.pat, i;
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = P.base; c.fillRect(0, 0, N, N);
  c.globalCompositeOperation = P.dark ? 'lighter' : 'source-over';
  for (i = 0; i < P.fire.length; i++) {
    var x = N * (0.5 + 0.5 * Math.sin(t * (0.5 + i * 0.13) + i * 2.1)), y = N * (0.5 + 0.5 * Math.cos(t * (0.4 + i * 0.09) + i * 1.3)), rad = N * (0.34 + 0.12 * Math.sin(t * 1.1 + i));
    (function (x2, y2, rad2, col) { wrap(N, x2, y2, rad2, function (px, py) {
      var g = c.createRadialGradient(px, py, 0, px, py, rad2);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = P.dark ? 1 : 0.95; c.fillStyle = g; c.fillRect(px - rad2, py - rad2, rad2 * 2, rad2 * 2); }); })(x, y, rad, P.fire[i]);
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  return o;
}

/* o: { cv, pat, ctx }. The pattern is only rebuilt when its picture changes or a different canvas asks for it. */
function patternFill(ctx, o, size, ang, dx, dy) {
  if (!o.pat || o.ctx !== ctx) { o.pat = ctx.createPattern(o.cv, 'repeat'); o.ctx = ctx; }
  var s = size / o.cv.width, ca = Math.cos(ang || 0) * s, sa = Math.sin(ang || 0) * s;
  o.pat.setTransform(new root.DOMMatrix([ca, sa, -sa, ca, dx || 0, dy || 0]));
  return o.pat;
}

/* the fill for a paint job's main colour, in bike coordinates (metres, y up) */
A.paintFill = function (ctx, p, t, span) {
  var P = p.pat, g, i, f;
  if (!P) return p.c[0];
  try {
    if (P.t === 'split') { g = ctx.createLinearGradient(0, P.y - 0.001, 0, P.y + 0.001); g.addColorStop(0, P.b); g.addColorStop(1, P.a); f = g; }
    else if (P.t === 'fade') {
      g = P.dir === 'h' ? ctx.createLinearGradient(-0.3, 0, span, 0) : ctx.createLinearGradient(0, 0.3, 0, 1.25);
      for (i = 0; i < P.stops.length; i++) g.addColorStop(i / (P.stops.length - 1), P.stops[i]); f = g;
    } else if (P.t === 'metal') {
      // bands of light and dark that slide slowly along the bike, like a reflection moving
      var L = 1.5, ph = (t * 0.22) % 1, x0 = -ph * L - L;
      g = ctx.createLinearGradient(x0, 0.2, x0 + L * 4, 0.2 + L * 1.6);
      var n = P.stops.length;
      for (var rep = 0; rep < 4; rep++) for (i = 0; i < n; i++) g.addColorStop((rep + i / n) / 4, P.stops[i]);
      g.addColorStop(1, P.stops[0]); f = g;
    } else if (P.t === 'opal') f = patternFill(ctx, opalTile(p, t), 0.85, 0.5, t * 0.11, t * 0.07);
    else f = patternFill(ctx, tile(p), (P.t === 'stripes' ? P.w * 2 : P.t === 'checker' || P.t === 'dots' ? P.w * 2 : P.t === 'carbon' ? P.w * 8 : P.w), P.ang || 0);
  } catch (e) { return p.c[0]; }
  try { f.flat = p.c[0]; } catch (e2) {}
  return f;
};

/* A bike wearing a paint job and a rider: a stand-in for the bike's description with
   the colours swapped. Made fresh each frame for looks that move. */
A.dress = function (ctx, d, look, t) {
  var p = look && look.paint, r = look && look.rider, o;
  if (!p && !r) return d;
  o = Object.create(d);
  o._t = t || 0;
  if (p) {
    o._paint = p;
    if (ctx) { var fill = A.paintFill(ctx, p, o._t, d.wb + 0.5); o.col = [fill, p.c[1], p.wide ? fill : p.c[2]]; }
    o.suit = [p.c[0], p.c[1], p.c[2] === p.c[0] ? p.c[1] : p.c[2]];
    if (p.c[0] === '#16181e' || p.c[0] === '#12141d' || p.c[0] === '#23262f') o.suit = [p.c[0], p.c[1], p.c[2]];
    if (p.suit === 'prism') o.suit = p.pat.dark ? ['#12141d', hsl(o._t * 120, 100, 62), hsl(o._t * 120 + 150, 100, 62)] : ['#fbfaff', hsl(o._t * 120, 95, 78), hsl(o._t * 120 + 150, 95, 78)];
  }
  if (r) {
    o._skin = r;
    o.suit = r.shift ? [hsl(o._t * 60, 90, 78), hsl(o._t * 60 + 120, 90, 80), '#ffffff'] : r.suit;
  }
  return o;
};

/* wheel rim colour, the glow ring and the glints that a paint job adds */
A.paintGlow = function (p, t) { return !p || !p.glow ? null : p.glow === 'prism' ? hsl(t * 90, 100, 70) : p.glow; };
A.glints = function (ctx, d, p, t) {
  if (!p || !p.glint) return;
  var top = d.rider.seat[1], i;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = p.glint;
  for (i = 0; i < 3; i++) {
    var f = t * 0.9 + i * 0.37, k = f - Math.floor(f), n = Math.floor(f) * 7 + i * 13;
    var x = 0.1 + RR.Render.hash(n) * (d.wb - 0.1), y = top - 0.28 + RR.Render.hash(n + 5) * 0.4, s = Math.sin(Math.PI * k); s = s * s * 0.11;
    if (s < 0.01) continue;
    ctx.beginPath(); ctx.moveTo(x - s, y); ctx.quadraticCurveTo(x, y, x, y + s * 1.5); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y - s * 1.5); ctx.quadraticCurveTo(x, y, x - s, y); ctx.fill();
  }
  ctx.restore();
};

/* ------------------------------------------------------------------ */
/* Heads. Drawn in "helmet space": the head is a circle of radius 1,    */
/* the face points along +x and up is +y.                               */
/* ------------------------------------------------------------------ */
var SKIN = '#e8b890', LW = 0.19;
function ci(c, x, y, r, fill, lw) { c.beginPath(); c.arc(x, y, r, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (lw !== 0) { c.lineWidth = lw || LW; c.strokeStyle = OUT; c.stroke(); } }
function po(c, p, fill, lw, open) { c.beginPath(); c.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); if (!open) c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (lw !== 0) { c.lineWidth = lw || LW; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke(); } }
function bl(c, p, fill, lw) { A.blob(c, p, fill, lw == null ? LW : lw); }
function ln(c, p, w, col) { c.beginPath(); c.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.stroke(); }
function eye(c, x, y, r) { ci(c, x, y, r || 0.13, OUT, 0); }
function el(c, x, y, rx, ry, rot, fill, lw) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (lw !== 0) { c.lineWidth = lw || LW; c.strokeStyle = OUT; c.stroke(); } }

var HEAD = {
  dummy: function (c) {
    ci(c, 0, 0, 1, '#f2c230');
    // the black and yellow quartered disc every test dummy has on its temple
    ci(c, -0.05, 0.08, 0.5, '#f2c230', 0.12);
    c.fillStyle = OUT; c.beginPath(); c.moveTo(-0.05, 0.08); c.arc(-0.05, 0.08, 0.5, 0, Math.PI / 2); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-0.05, 0.08); c.arc(-0.05, 0.08, 0.5, Math.PI, Math.PI * 1.5); c.closePath(); c.fill();
    ln(c, [0.5, -0.78, 0.86, -0.5], 0.1, OUT); ci(c, 0.72, 0.2, 0.09, OUT, 0);
  },
  cowboy: function (c) {
    ci(c, 0, 0, 1, SKIN);
    eye(c, 0.62, 0.12);
    bl(c, [0.1, -0.2, 1.05, -0.12, 0.98, -0.6, 0.5, -1.05, -0.1, -0.9], '#c4392f');            // bandana over the nose
    el(c, 0.1, 0.52, 1.75, 0.3, -0.12, '#8a5a34');                                               // brim
    bl(c, [-0.75, 0.55, -0.62, 1.5, -0.1, 1.28, 0.42, 1.55, 0.8, 0.5], '#8a5a34');               // crown
    ln(c, [-0.72, 0.68, 0.8, 0.6], 0.14, '#3d2616');
  },
  banana: function (c) {
    bl(c, [-0.75, -1.0, -1.15, 0.1, -0.7, 1.35, 0.0, 1.95, 0.42, 1.8, 0.3, 1.25, 0.95, 0.35, 0.85, -0.85], '#ffd93d');
    po(c, [0.0, 1.9, 0.34, 2.2, 0.5, 2.08, 0.4, 1.8], '#6b4a1e');
    ln(c, [-0.6, -0.6, -0.86, 0.2, -0.5, 1.2], 0.08, '#e0b020');
    el(c, 0.42, -0.08, 0.5, 0.56, 0, SKIN);
    eye(c, 0.6, 0.06, 0.11); ln(c, [0.4, -0.36, 0.72, -0.3], 0.08, OUT);
  },
  chicken: function (c) {
    bl(c, [-0.5, 0.8, -0.4, 1.5, -0.05, 1.05, 0.2, 1.62, 0.5, 1.1, 0.8, 1.35, 0.7, 0.7], '#e2402f');   // comb
    ci(c, 0, 0, 1, '#fffaf0');
    po(c, [0.9, 0.22, 1.72, -0.06, 0.92, -0.34], '#ff9a1f');                                       // beak
    bl(c, [0.6, -0.42, 0.98, -0.5, 0.95, -1.1, 0.6, -1.05], '#e2402f');                            // wattle
    ci(c, 0.5, 0.24, 0.2, '#ffffff', 0.1); eye(c, 0.56, 0.24, 0.1);
  },
  zombie: function (c) {
    ci(c, 0, 0, 1, '#8fbf6a');
    bl(c, [-0.9, 0.5, -0.55, 1.12, 0.1, 1.05, -0.1, 0.62], '#ff9ab0', 0.12);                       // a bit of brain showing
    ln(c, [-0.2, 0.98, 0.1, 1.3], 0.16, '#3a3340'); ln(c, [0.3, 0.95, 0.42, 1.24], 0.14, '#3a3340'); ln(c, [-0.6, 0.82, -0.8, 1.12], 0.14, '#3a3340');
    ci(c, 0.5, 0.2, 0.3, '#fffbe0', 0.12); eye(c, 0.6, 0.18, 0.08);
    ln(c, [0.3, -0.5, 0.92, -0.42], 0.09, OUT); ln(c, [0.45, -0.38, 0.47, -0.6], 0.07, OUT); ln(c, [0.66, -0.34, 0.68, -0.58], 0.07, OUT);
    ln(c, [-0.5, -0.3, -0.2, -0.6], 0.07, '#5a8a40'); ln(c, [-0.42, -0.52, -0.3, -0.34], 0.07, '#5a8a40');
  },
  pirate: function (c, t) {
    ci(c, 0, 0, 1, SKIN);
    ln(c, [0.2, -0.75, 0.75, -0.7], 0.1, '#7a5a40');
    ci(c, -0.62, -0.62, 0.17, null, 0.1); c.strokeStyle = '#e0b23a'; c.lineWidth = 0.1; c.beginPath(); c.arc(-0.62, -0.62, 0.17, 0, TAU); c.stroke();
    bl(c, [-1.02, 0.1, -0.7, 0.95, 0.2, 1.12, 0.92, 0.6, 1.0, 0.28, 0.2, 0.42], '#c4392f');          // bandana
    var w = Math.sin(t * 9) * 0.1;
    bl(c, [-0.92, 0.3, -1.6, 0.5 + w, -1.75, 0.2 + w, -1.0, 0.06], '#c4392f'); bl(c, [-0.95, 0.2, -1.5, -0.1 - w, -1.6, -0.36 - w, -0.92, -0.04], '#c4392f');
    ci(c, 0.16, 0.62, 0.06, '#fff', 0); ci(c, 0.5, 0.74, 0.06, '#fff', 0); ci(c, -0.3, 0.7, 0.06, '#fff', 0);
    ln(c, [-0.6, 0.5, 0.95, 0.02], 0.09, OUT); el(c, 0.6, 0.08, 0.26, 0.22, 0, OUT, 0);            // eye patch
  },
  skull: function (c) {
    bl(c, [0.0, -0.4, 1.02, -0.36, 1.06, -1.1, 0.8, -1.5, 0.22, -1.46, -0.1, -0.9], '#f1ecdc');    // jaw
    ci(c, 0, 0, 1, '#f1ecdc');
    c.fillStyle = '#f1ecdc'; c.beginPath(); c.rect(0.05, -1.0, 0.9, 0.5); c.fill();               // join the two
    el(c, 0.48, 0.12, 0.32, 0.38, 0.2, OUT, 0);
    po(c, [0.95, -0.14, 0.78, -0.46, 1.02, -0.44], OUT, 0);
    ln(c, [0.3, -0.92, 1.0, -0.86], 0.08, OUT); ln(c, [0.46, -0.72, 0.46, -1.12], 0.06, OUT); ln(c, [0.64, -0.7, 0.64, -1.12], 0.06, OUT); ln(c, [0.82, -0.7, 0.82, -1.1], 0.06, OUT);
    ln(c, [-0.5, 0.7, -0.24, 0.34, -0.5, 0.12], 0.06, '#b8b09a');
  },
  ninja: function (c, t) {
    var w = Math.sin(t * 10) * 0.12;
    bl(c, [-0.9, 0.35, -1.8, 0.62 + w, -1.95, 0.36 + w, -0.98, 0.12], '#c4392f'); bl(c, [-0.92, 0.25, -1.6, -0.02 - w, -1.72, -0.3 - w, -0.94, 0.0], '#c4392f');
    ci(c, 0, 0, 1, '#1d2030');
    bl(c, [0.2, 0.34, 1.0, 0.3, 1.02, -0.12, 0.22, -0.1], SKIN, 0.12);
    eye(c, 0.66, 0.1, 0.1); ln(c, [0.42, 0.3, 0.86, 0.22], 0.08, OUT);
    c.beginPath(); c.arc(0, 0, 1, 0.36, 2.9); c.lineWidth = 0.2; c.strokeStyle = '#c4392f'; c.stroke();
  },
  robot: function (c, t) {
    ln(c, [-0.1, 0.9, -0.2, 1.55], 0.1, '#6c7886'); ci(c, -0.2, 1.62, 0.16, Math.sin(t * 6) > 0 ? '#ff5a3d' : '#7a2a20', 0.1);
    c.beginPath(); if (c.roundRect) c.roundRect(-0.98, -0.95, 1.96, 1.9, 0.3); else c.rect(-0.98, -0.95, 1.96, 1.9); c.fillStyle = '#9aa6b4'; c.fill(); c.lineWidth = LW; c.strokeStyle = OUT; c.stroke();
    po(c, [0.0, 0.42, 0.98, 0.42, 0.98, -0.08, 0.0, -0.08], '#22252d', 0.12);
    ci(c, 0.62, 0.17, 0.15, '#ff5a3d', 0); c.globalAlpha = 0.35; ci(c, 0.62, 0.17, 0.28, '#ff5a3d', 0); c.globalAlpha = 1;
    ln(c, [0.4, -0.5, 0.94, -0.5], 0.07, OUT); ln(c, [0.4, -0.68, 0.94, -0.68], 0.07, OUT);
    ci(c, -0.7, 0.68, 0.08, '#6c7886', 0); ci(c, -0.7, -0.68, 0.08, '#6c7886', 0); ci(c, -0.48, 0, 0.26, '#6c7886', 0.1);
  },
  lucha: function (c) {
    ci(c, 0, 0, 1, '#1f9e8a');
    bl(c, [-0.5, 0.86, 0.0, 1.25, 0.3, 0.9, 0.62, 1.12, 0.84, 0.54, 0.3, 0.58, 0.0, 0.42], '#f2c230', 0.12);      // gold flame over the top
    bl(c, [0.3, 0.42, 0.98, 0.3, 0.86, -0.1, 0.36, -0.02], '#ffffff', 0.1); el(c, 0.64, 0.14, 0.17, 0.11, 0.2, OUT, 0);
    bl(c, [0.5, -0.44, 0.98, -0.4, 0.9, -0.82, 0.52, -0.78], '#ffffff', 0.1); ln(c, [0.6, -0.6, 0.9, -0.6], 0.09, '#c4392f');
    ln(c, [-0.96, 0.3, -0.7, 0.2], 0.08, '#fff'); ln(c, [-0.98, 0, -0.72, 0], 0.08, '#fff'); ln(c, [-0.94, -0.3, -0.7, -0.2], 0.08, '#fff');
  },
  pumpkin: function (c, t) {
    po(c, [-0.14, 0.88, -0.24, 1.42, 0.14, 1.36, 0.14, 0.9], '#3f8a3a');
    el(c, 0, 0, 1.08, 0.98, 0, '#ff8a1f');
    c.lineWidth = 0.07; c.strokeStyle = '#c95f10'; c.beginPath(); c.ellipse(0, 0, 0.55, 0.96, 0, 0, TAU); c.moveTo(0, 0.96); c.lineTo(0, -0.96); c.stroke();
    var gl = 0.75 + 0.25 * Math.sin(t * 7), y = 'rgba(255,' + Math.round(210 + 30 * gl) + ',70,1)';
    po(c, [0.34, 0.42, 0.78, 0.1, 0.28, 0.02], y, 0.1);
    po(c, [0.16, -0.3, 0.42, -0.42, 0.56, -0.24, 0.72, -0.44, 0.98, -0.2, 0.86, -0.7, 0.66, -0.56, 0.5, -0.78, 0.3, -0.6], y, 0.1);
  },
  knight: function (c, t) {
    var w = Math.sin(t * 8) * 0.1;
    bl(c, [-0.1, 0.9, -0.5, 1.7, -1.3, 1.5 + w, -1.9, 0.86 + w, -1.2, 1.0, -0.7, 0.72], '#c4392f');         // plume
    ci(c, 0, 0, 1, '#b9c2cc');
    po(c, [0.0, 0.5, 0.9, 0.44, 1.55, -0.06, 0.9, -0.74, 0.0, -0.78], '#9aa5b2');                         // pointed visor
    ln(c, [0.5, 0.2, 1.2, 0.02], 0.09, OUT); ln(c, [0.5, -0.02, 1.26, -0.14], 0.07, OUT);
    ci(c, 0.72, -0.44, 0.045, OUT, 0); ci(c, 0.92, -0.42, 0.045, OUT, 0); ci(c, 0.82, -0.58, 0.045, OUT, 0);
    c.beginPath(); c.arc(0, 0, 1, 1.0, 2.5); c.lineWidth = 0.16; c.strokeStyle = '#e0b23a'; c.stroke();
    ci(c, -0.02, 0.5, 0.11, '#e0b23a', 0.08);
  },
  astro: function (c) {
    ci(c, 0.1, -0.02, 0.7, SKIN, 0.12); eye(c, 0.5, 0.1, 0.1); ln(c, [0.3, -0.3, 0.62, -0.26], 0.08, OUT);
    bl(c, [-0.5, 0.2, -0.2, 0.75, 0.5, 0.6, 0.2, 0.42], '#5a3a22', 0.1);
    c.beginPath(); c.arc(0, 0, 1.18, 0, TAU); c.fillStyle = 'rgba(160,220,255,0.3)'; c.fill(); c.lineWidth = LW; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(0, 0, 0.96, 0.5, 1.5); c.lineWidth = 0.13; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke();
    c.beginPath(); c.arc(0, 0, 1.18, -2.3, -0.84); c.lineWidth = 0.3; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.arc(0, 0, 1.18, -2.26, -0.88); c.lineWidth = 0.19; c.strokeStyle = '#ff6a1f'; c.stroke();
  },
  alien: function (c, t) {
    ln(c, [-0.3, 1.1, -0.6, 1.75], 0.09, '#5fbf5a'); ci(c, -0.62, 1.8, 0.14, '#3dffd2', 0.08);
    ln(c, [0.2, 1.1, 0.4, 1.7], 0.09, '#5fbf5a'); ci(c, 0.42, 1.76, 0.14, '#3dffd2', 0.08);
    bl(c, [-1.2, 0.3, -0.9, 1.25, 0.3, 1.36, 1.1, 0.6, 0.92, -0.5, 0.3, -1.05, -0.5, -0.8], '#7fd46a');
    c.save(); c.translate(0.46, 0.14); c.rotate(-0.5); el(c, 0, 0, 0.5, 0.3, 0, '#12141d', 0.1); c.restore();
    c.save(); c.translate(0.5, 0.2); c.rotate(-0.5); el(c, 0.12, 0.08, 0.14, 0.07, 0, 'rgba(255,255,255,0.7)', 0); c.restore();
    ln(c, [0.46, -0.62, 0.68, -0.58], 0.07, OUT);
  },
  viking: function (c) {
    ci(c, 0, 0, 1, SKIN);
    eye(c, 0.62, 0.02, 0.1);
    bl(c, [-0.2, -0.2, 0.5, -0.3, 1.06, -0.2, 1.1, -0.9, 0.6, -1.7, 0.1, -1.3, -0.5, -0.9], '#e07a2a');   // beard
    ln(c, [0.5, -0.5, 0.4, -1.2], 0.06, '#a8551a'); ln(c, [0.75, -0.5, 0.72, -1.1], 0.06, '#a8551a');
    bl(c, [-0.5, 0.86, -1.0, 1.5, -0.86, 2.1, -0.6, 1.5, -0.14, 0.98], '#f1e6cc');                        // far horn
    bl(c, [-1.04, 0.24, -0.7, 0.98, 0.2, 1.12, 0.94, 0.62, 1.0, 0.26], '#8792a0');                        // iron cap
    po(c, [0.8, 0.4, 1.02, 0.36, 0.98, -0.3, 0.84, -0.26], '#8792a0', 0.12);                             // nose guard
    ln(c, [-1.0, 0.3, 0.98, 0.3], 0.12, '#5d6672');
    bl(c, [0.1, 0.9, 0.2, 1.6, 0.74, 2.14, 0.6, 1.5, 0.52, 0.86], '#f1e6cc');                             // near horn
  },
  ghost: function (c, t) {
    var w = Math.sin(t * 5) * 0.08;
    bl(c, [-1.0, 0.2, -0.7, 0.98, 0.2, 1.1, 0.96, 0.6, 1.05, -0.5, 0.8, -1.3 + w, 0.45, -1.0, 0.1, -1.4 - w, -0.3, -1.0, -0.7, -1.36 + w, -1.06, -0.6], '#f4f8ff');
    el(c, 0.34, 0.2, 0.17, 0.25, 0, OUT, 0); el(c, 0.78, 0.18, 0.13, 0.22, 0, OUT, 0); el(c, 0.6, -0.36, 0.13, 0.17, 0, OUT, 0);
  },
  flame: function (c, t) {
    var i, cols = ['#ff5a1f', '#ff9a1f', '#ffe23d'];
    for (i = 0; i < 3; i++) {
      var s = 1 - i * 0.26, a = Math.sin(t * (11 + i * 3) + i) * 0.22, b = Math.sin(t * (7 + i * 2) + i * 2) * 0.2;
      c.fillStyle = cols[i]; c.beginPath();
      c.moveTo(-0.95 * s, 0.1);
      c.bezierCurveTo(-1.5 * s, 1.0 * s, (-0.9 + a) * s, 1.3 * s, (-1.05 + b) * s, 2.2 * s);
      c.bezierCurveTo((-0.4 + a) * s, 1.7 * s, (-0.3 + b) * s, 1.5 * s, (-0.2 - a) * s, 2.6 * s);
      c.bezierCurveTo((0.3 + b) * s, 1.9 * s, (0.5 - a) * s, 1.6 * s, (0.7 + b) * s, 2.1 * s);
      c.bezierCurveTo((0.9 - a) * s, 1.3 * s, 1.3 * s, 0.9 * s, 0.9 * s, 0.1);
      c.closePath(); c.fill();
      if (!i) { c.lineWidth = LW * 0.8; c.strokeStyle = OUT; c.stroke(); }
    }
    ci(c, 0, 0, 1, '#2a1a1a');
    el(c, 0.52, 0.12, 0.26, 0.2, -0.3, '#ffe23d', 0.08); ci(c, 0.56, 0.12, 0.08, '#ff5a1f', 0);
    ln(c, [0.36, -0.46, 0.5, -0.56, 0.64, -0.44, 0.78, -0.56, 0.92, -0.42], 0.08, '#ff9a1f');
  },
  wizard: function (c, t) {
    ci(c, 0, 0, 1, SKIN);
    eye(c, 0.62, 0.1, 0.1); ln(c, [0.4, 0.34, 0.86, 0.26], 0.1, '#eef0f4');
    bl(c, [-0.1, -0.2, 0.6, -0.3, 1.06, -0.24, 1.2, -1.2, 0.86, -2.3, 0.4, -1.5, -0.3, -1.0], '#eef0f4');   // beard
    el(c, 0.0, 0.58, 1.7, 0.3, -0.1, '#3d2a9a');                                                         // brim
    bl(c, [-0.8, 0.66, -0.7, 1.8, -1.3, 2.9, -0.3, 2.3, 0.72, 0.6], '#3d2a9a');                           // hat with a bent tip
    ln(c, [-0.76, 0.76, 0.7, 0.68], 0.16, '#e0b23a');
    var k, sp = [[-0.3, 1.3], [-0.62, 1.95], [0.14, 1.04], [-0.9, 2.5]];
    for (k = 0; k < sp.length; k++) { var tw = 0.5 + 0.5 * Math.sin(t * 5 + k * 1.9); c.globalAlpha = 0.4 + 0.6 * tw; ci(c, sp[k][0], sp[k][1], 0.07 + 0.05 * tw, '#ffe23d', 0); }
    c.globalAlpha = 1;
  },
  prism: function (c, t) {
    var g = c.createLinearGradient(-1, -1, 1, 1), i;
    for (i = 0; i <= 6; i++) g.addColorStop(i / 6, hsl(t * 80 + i * 60, 95, 76));
    ci(c, 0, 0, 1, g);
    c.beginPath(); c.arc(0, 0, 0.74, 0.5, 2.9); c.lineWidth = 0.2; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke();
    var v = c.createLinearGradient(0.3, 0.3, 1.0, -0.3);
    for (i = 0; i <= 4; i++) v.addColorStop(i / 4, hsl(-t * 140 + i * 80, 100, 62));
    bl(c, [0.28, 0.32, 0.95, 0.34, 1.05, -0.1, 0.9, -0.36, 0.3, -0.26], v, 0.12);
    ln(c, [0.5, 0.16, 0.8, 0.18], 0.08, 'rgba(255,255,255,0.9)');
    star(c, -0.4 + Math.sin(t * 2) * 0.2, 0.5, 0.2 * (0.6 + 0.4 * Math.sin(t * 6)), '#ffffff');
  },
  nova: function (c, t) {
    ci(c, 0, 0, 1, '#0c0e1c');
    var i;
    c.save(); c.beginPath(); c.arc(0, 0, 0.94, 0, TAU); c.clip();
    for (i = 0; i < 14; i++) { var x = RR.Render.hash(i * 3.1) * 2 - 1, y = RR.Render.hash(i * 5.7 + 1) * 2 - 1, tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 2.3); c.globalAlpha = 0.3 + 0.7 * tw; ci(c, x, y, 0.035 + 0.035 * tw, i % 4 ? '#ffffff' : '#9fe8ff', 0); }
    c.globalAlpha = 0.35; ci(c, -0.3, 0.3, 0.5, '#7a4fe0', 0); c.globalAlpha = 1;
    c.restore();
    bl(c, [0.3, 0.22, 0.98, 0.24, 1.02, -0.04, 0.34, -0.08], '#9fe8ff', 0.1);
    c.globalAlpha = 0.4; el(c, 0.66, 0.08, 0.5, 0.26, 0, '#9fe8ff', 0); c.globalAlpha = 1;
    // a little moon going round
    var a = t * 2.4, mx = Math.cos(a) * 1.45, my = Math.sin(a) * 0.4 + 0.2;
    c.beginPath(); c.ellipse(0, 0.2, 1.45, 0.4, 0, 0, TAU); c.lineWidth = 0.05; c.strokeStyle = 'rgba(159,232,255,0.45)'; c.stroke();
    ci(c, mx, my, 0.13, '#ffffff', 0.07);
  }
};
function star(c, x, y, s, col) {
  c.fillStyle = col; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x, y, x, y + s * 1.5); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y - s * 1.5); c.quadraticCurveTo(x, y, x - s, y); c.fill();
}
A.star4 = star;

A.head = function (ctx, x, y, r, ang, skin, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(r, r);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  (HEAD[skin.head] || HEAD.dummy)(ctx, t || 0, skin);
  ctx.restore();
};

/* ------------------------------------------------------------------ */
/* Small pictures for the garage                                        */
/* ------------------------------------------------------------------ */
function prep(cv) {
  var dpr = Math.min(2, root.devicePixelRatio || 1), w = cv.clientWidth || cv.width, h = cv.clientHeight || cv.height;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  return { c: c, w: w, h: h, dpr: dpr };
}
/* a rider's head and shoulders. skin = null draws the bike's own stock rider */
A.portrait = function (cv, skin, bikeDef, t) {
  var o = prep(cv), c = o.c, S = Math.min(o.w, o.h) / 3.3;
  c.setTransform(o.dpr * S, 0, 0, -o.dpr * S, o.dpr * o.w * 0.44, o.dpr * o.h * 0.56);
  c.lineJoin = 'round'; c.lineCap = 'round';
  var suit = skin ? (skin.shift ? [hsl((t || 0) * 60, 90, 78), '#fff', '#fff'] : skin.suit) : bikeDef.suit;
  if (skin && skin.ghost) c.globalAlpha = 0.72;
  A.blob(c, [-1.25, -2.2, -1.1, -1.0, -0.2, -0.86, 0.9, -1.05, 1.2, -2.2], suit[0], 0.12);
  A.line(c, [-0.9, -1.5, 0.9, -1.6], 0.16, suit[1]);
  A.tube(c, [-0.05, -1.0, 0, -0.7], 0.36, '#2b2f38', 0.1);
  if (skin) A.head(c, 0, 0, 1, 0, skin, t || 0);
  else A.helmet(c, 0, 0, 1, 0, bikeDef, bikeDef.kind);
  c.globalAlpha = 1;
};
/* a paint job shown on a tank and a slice of wheel. p = null draws the bike's stock colours */
A.swatch = function (cv, p, bikeDef, t) {
  var o = prep(cv), c = o.c, S = Math.min(o.w / 1.5, o.h / 1.12);
  c.setTransform(o.dpr * S, 0, 0, -o.dpr * S, o.dpr * (o.w * 0.5 - 0.62 * S), o.dpr * (o.h * 0.5 + 0.86 * S));
  c.lineJoin = 'round'; c.lineCap = 'round';
  var col = p ? [A.paintFill(c, p, t || 0, 1.5), p.c[1], p.c[2]] : bikeDef.col, rim = p ? p.rim : '#8d939d', glow = A.paintGlow(p, t || 0);
  // wheel peeking in at the bottom
  c.beginPath(); c.arc(0.2, 0.36, 0.3, 0, TAU); c.fillStyle = '#1c1d22'; c.fill(); c.lineWidth = 0.03; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.arc(0.2, 0.36, 0.2, 0, TAU); c.lineWidth = 0.04; c.strokeStyle = rim; c.stroke();
  if (glow) { c.beginPath(); c.arc(0.2, 0.36, 0.12, 0, TAU); c.lineWidth = 0.035; c.strokeStyle = glow; c.stroke(); }
  // tank, panel, stripe: the same three colour roles the bikes use
  A.blob(c, [0.02, 0.74, 0.3, 1.2, 0.86, 1.3, 1.22, 1.08, 1.14, 0.66, 0.6, 0.5], col[0], 0.04);
  A.shape(c, [0.5, 1.06, 0.98, 1.1, 1.04, 0.84, 0.6, 0.78], col[2], 0.028);
  A.line(c, [0.2, 0.84, 0.48, 0.74], 0.06, col[1]);
  if (p && p.glint) { c.globalCompositeOperation = 'lighter'; star(c, 0.38, 1.02, 0.1 * (0.6 + 0.4 * Math.sin((t || 0) * 5)), p.glint); star(c, 0.98, 0.72, 0.07 * (0.6 + 0.4 * Math.cos((t || 0) * 4)), p.glint); c.globalCompositeOperation = 'source-over'; }
};
})(typeof window !== 'undefined' ? window : globalThis);
