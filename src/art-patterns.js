/* Ridge Riot: more paint finishes.
   Each painter below fills one small repeating picture (a "tile") that art-skins.js then repeats
   across the bike's main bodywork. They add themselves to the lists art-skins.js keeps:
   TILES are painted once, LIVE ones are repainted as time moves.
   A tile repeats left-right and up-down, so anything near an edge is drawn again on the far side. */
(function (root) {
'use strict';
var RR = root.RR, A = RR.Art, K = A.kit, TAU = K.TAU, TILES = A.TILES, LIVE = A.LIVE, rng = K.rng, wrap = K.wrap, blobAt = K.blobAt;

function each(n, fn) { for (var i = 0; i < n; i++) fn(i); }
function mod(a, n) { return ((a % n) + n) % n; }

/* ---------------------------- food ---------------------------- */
TILES.pizza = function (c, P, N, NH, r) {
  // browned bubbles in the cheese
  each(16, function (i) {
    var x = r() * N, y = r() * N, br = N * (0.025 + r() * 0.045), sd = Math.floor(r() * 1e6), col = i % 3 ? '#e39a2c' : '#fbd56a';
    wrap(N, x, y, br * 1.4, function (px, py) { blobAt(c, px, py, br, rng(sd), col, 0.5); });
  });
  // pepperoni, placed by hand so the tile repeats evenly
  [[0.22, 0.2], [0.72, 0.16], [0.46, 0.52], [0.12, 0.76], [0.8, 0.72]].forEach(function (s, i) {
    var x = s[0] * N, y = s[1] * N, rr = N * (0.125 + 0.015 * (i % 2));
    wrap(N, x, y, rr + 4, function (px, py) {
      c.beginPath(); c.arc(px, py + 2.5, rr, 0, TAU); c.fillStyle = 'rgba(90,40,10,0.35)'; c.fill();       // shadow on the cheese
      c.beginPath(); c.arc(px, py, rr, 0, TAU); c.fillStyle = P.b; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#7d1a10'; c.stroke();
      c.beginPath(); c.arc(px, py, rr * 0.66, 0, TAU); c.lineWidth = 2; c.strokeStyle = 'rgba(110,20,10,0.4)'; c.stroke();
      var q = rng(i * 977 + 5);
      c.fillStyle = '#8e2418'; each(5, function () { var a = q() * TAU, d = rr * (0.15 + q() * 0.6); c.beginPath(); c.arc(px + Math.cos(a) * d, py + Math.sin(a) * d, 1.8 + q() * 1.4, 0, TAU); c.fill(); });
      c.beginPath(); c.arc(px - rr * 0.3, py - rr * 0.32, rr * 0.2, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fill();      // grease shine
    });
  });
  // a few torn basil leaves
  [[0.36, 0.86, 0.5], [0.92, 0.44, 2.2], [0.6, 0.3, 4.1]].forEach(function (s) {
    wrap(N, s[0] * N, s[1] * N, 12, function (px, py) {
      c.save(); c.translate(px, py); c.rotate(s[2]);
      c.beginPath(); c.ellipse(0, 0, 9, 5, 0, 0, TAU); c.fillStyle = P.c || '#2f8f3a'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#1d5f27'; c.stroke();
      c.beginPath(); c.moveTo(-7, 0); c.lineTo(7, 0); c.lineWidth = 1.2; c.strokeStyle = '#9be08a'; c.stroke();
      c.restore();
    });
  });
};

/* ---------------------------- workshop ---------------------------- */
TILES.blueprint = function (c, P, N, NH) {
  var k, ink = 'rgba(240,248,255,0.92)';
  // fine and bold grid lines (drawn at both edges so the repeat has no seam)
  for (k = 0; k <= 16; k++) { c.fillStyle = k % 4 ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.36)'; var w = k % 4 ? 1 : 1.8; c.fillRect(k * N / 16 - w / 2, 0, w, N); c.fillRect(0, k * N / 16 - w / 2, N, w); }
  c.strokeStyle = ink; c.lineWidth = 1.8; c.lineCap = 'round'; c.lineJoin = 'round';
  // a bolt hole with its centre lines
  c.beginPath(); c.arc(36, 40, 14, 0, TAU); c.stroke(); c.beginPath(); c.arc(36, 40, 6, 0, TAU); c.setLineDash([3, 3]); c.stroke(); c.setLineDash([]);
  c.beginPath(); c.moveTo(14, 40); c.lineTo(58, 40); c.moveTo(36, 18); c.lineTo(36, 62); c.stroke();
  // a gear
  var cx = 96, cy = 36, gp = [];
  each(16, function (i) { var a = i * TAU / 16, rr = i % 2 ? 11 : 15; gp.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); gp.push([cx + Math.cos(a + TAU / 32) * rr, cy + Math.sin(a + TAU / 32) * rr]); });
  c.beginPath(); gp.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); c.closePath(); c.stroke();
  c.beginPath(); c.arc(cx, cy, 5, 0, TAU); c.stroke();
  // a measured length with arrows
  c.beginPath(); c.moveTo(62, 100); c.lineTo(120, 100); c.moveTo(62, 93); c.lineTo(62, 107); c.moveTo(120, 93); c.lineTo(120, 107); c.stroke();
  c.fillStyle = ink; [[62, 1], [120, -1]].forEach(function (a) { c.beginPath(); c.moveTo(a[0], 100); c.lineTo(a[0] + a[1] * 8, 96); c.lineTo(a[0] + a[1] * 8, 104); c.closePath(); c.fill(); });
  c.fillRect(82, 104, 18, 3); c.fillRect(86, 110, 10, 2);              // scribbled label
  // an angle
  c.beginPath(); c.moveTo(10, 118); c.lineTo(10, 84); c.moveTo(10, 118); c.lineTo(44, 106); c.stroke(); c.beginPath(); c.arc(10, 118, 18, -1.2, -0.34); c.stroke();
};

TILES.plaid = function (c, P, N) {
  var k, W = N / 2;
  // two sets of see-through bands cross each other: where they overlap the cloth goes darker, like woven wool
  for (k = 0; k < 2; k++) {
    c.fillStyle = 'rgba(14,14,20,0.62)'; c.fillRect(k * W, 0, W * 0.34, N); c.fillRect(0, k * W, N, W * 0.34);
    c.fillStyle = 'rgba(14,14,20,0.28)'; c.fillRect(k * W + W * 0.5, 0, W * 0.1, N); c.fillRect(0, k * W + W * 0.5, N, W * 0.1);
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(k * W + W * 0.8, 0, 2, N); c.fillRect(0, k * W + W * 0.8, N, 2);
  }
  c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1;                // twill
  for (k = -N; k < N; k += 4) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + N, N); c.stroke(); }
};

/* ---------------------------- nature ---------------------------- */
TILES.hex = function (c, P, N, NH) {
  var R = N / (2 * Math.sqrt(3)), Wd = Math.sqrt(3) * R, row, col;
  var shades = [['#ffd866', '#f2a900'], ['#ffc83a', '#e08a00'], ['#ffe08a', '#f5b300'], ['#f8b81c', '#d98000']];
  c.lineJoin = 'round';
  for (row = -1; row <= 4; row++) for (col = -1; col <= 3; col++) {
    var cx = col * Wd + mod(row, 2) * Wd / 2, cy = row * 1.5 * R, sh = shades[mod(row, 2) * 2 + mod(col, 2)], hx = [], k;
    for (k = 0; k < 6; k++) { var a = k * Math.PI / 3 - Math.PI / 2; hx.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
    var g = c.createRadialGradient(cx - R * 0.25, cy - R * 0.3, 1, cx, cy, R);
    g.addColorStop(0, sh[0]); g.addColorStop(1, sh[1]);
    c.beginPath(); hx.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); c.closePath();
    c.fillStyle = g; c.fill(); c.lineWidth = 3.4; c.strokeStyle = P.b || '#6b3e00'; c.stroke();
    c.beginPath(); c.moveTo(hx[4][0] + 2, hx[4][1] + 3); c.lineTo(hx[5][0] - 2, hx[5][1] + 1); c.moveTo(hx[4][0] + 2, hx[4][1] + 3); c.lineTo(hx[3][0] + 2, hx[3][1] - 3);   // lit edges
    c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,248,200,0.8)'; c.stroke();
    c.beginPath(); c.ellipse(cx - R * 0.28, cy - R * 0.3, R * 0.2, R * 0.1, -0.6, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill();       // drop of honey shine
  }
};

TILES.scales = function (c, P, N) {
  var D = N / 4, R = D / 2, row, col, greens = P.cols;
  c.fillStyle = P.a; c.fillRect(0, 0, N, N);
  for (row = -1; row <= 9; row++) for (col = -1; col <= 4; col++) {
    var cx = col * D + R + (mod(row, 2) ? R : 0), cy = row * R + R, h = rng(mod(col, 4) * 31 + mod(row, 8) * 7 + 11)(), gold = h > 0.88;
    var base = gold ? P.edge : greens[Math.floor(h * greens.length * 1.1) % greens.length];
    var g = c.createRadialGradient(cx - R * 0.3, cy - R * 0.45, 1, cx, cy, R * 1.05);
    g.addColorStop(0, lighten(base)); g.addColorStop(1, base);
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fillStyle = g; c.fill(); c.lineWidth = 2.2; c.strokeStyle = P.a; c.stroke();
    c.beginPath(); c.arc(cx, cy, R * 0.66, 0.35, 2.8); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke();     // ridge on each scale
    c.beginPath(); c.arc(cx, cy, R * 0.34, 0.5, 2.6); c.lineWidth = 1.2; c.strokeStyle = 'rgba(0,0,0,0.28)'; c.stroke();
  }
};
function lighten(col) { return A.shade(col, 1.5); }

TILES.bolts = function (c, P, N, NH, r) {
  each(10, function (i) {
    var x = r() * N, y = r() * N, br = N * (0.07 + r() * 0.1), sd = Math.floor(r() * 1e6), col = i % 2 ? 'rgba(18,20,36,0.35)' : 'rgba(170,175,215,0.2)';
    wrap(N, x, y, br * 1.4, function (px, py) { blobAt(c, px, py, br, rng(sd), col, 0.6); });
  });
  var bolt = [10, -38, -10, 2, 2, 2, -8, 38, 12, -6, 0, -6, 14, -38];
  [[0.26, 0.28, 1], [0.76, 0.74, -1]].forEach(function (s) {
    wrap(N, s[0] * N, s[1] * N, 44, function (px, py) {
      c.save(); c.translate(px, py); c.scale(s[2], 1);
      c.beginPath(); bolt.forEach(function (v, i) { if (i % 2 === 0) c[i ? 'lineTo' : 'moveTo'](v, bolt[i + 1]); }); c.closePath();
      c.shadowColor = 'rgba(255,230,90,0.9)'; c.shadowBlur = 9; c.fillStyle = P.c; c.fill(); c.shadowBlur = 0;
      c.lineWidth = 2.6; c.lineJoin = 'round'; c.strokeStyle = '#3a2f00'; c.stroke();
      c.beginPath(); c.moveTo(7, -30); c.lineTo(-5, -2); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke();
      c.restore();
    });
  });
};

/* ---------------------------- metal that slides ---------------------------- */
TILES.patina = function (c, P, N, NH, r) {
  var k;
  // brushed copper: fine streaks along the grain
  each(70, function () { var y = r() * N, x = r() * N, len = N * (0.2 + r() * 0.5); c.fillStyle = r() < 0.5 ? 'rgba(255,225,180,0.16)' : 'rgba(70,24,6,0.16)';
    wrap(N, x, y, len, function (px, py) { c.fillRect(px - len / 2, py, len, 1.2); }); });
  // a soft band of light across it; the paint job slides this along, so it looks like a reflection moving
  for (k = -1; k <= 1; k++) { c.fillStyle = 'rgba(255,236,200,0.2)'; c.beginPath(); c.moveTo(k * N + N * 0.15, 0); c.lineTo(k * N + N * 0.4, 0); c.lineTo(k * N + N * 0.4 + N, N); c.lineTo(k * N + N * 0.15 + N, N); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,248,230,0.22)'; c.beginPath(); c.moveTo(k * N + N * 0.24, 0); c.lineTo(k * N + N * 0.3, 0); c.lineTo(k * N + N * 0.3 + N, N); c.lineTo(k * N + N * 0.24 + N, N); c.closePath(); c.fill(); }
  // verdigris creeping in from the edges
  each(9, function (i) {
    var x = r() * N, y = r() * N, br = N * (0.07 + r() * 0.09), sd = Math.floor(r() * 1e6);
    wrap(N, x, y, br * 1.4, function (px, py) {
      blobAt(c, px, py, br * 1.12, rng(sd), '#2c7c6a', 0.55); blobAt(c, px, py, br, rng(sd), P.b, 0.55);
      blobAt(c, px - br * 0.15, py - br * 0.18, br * 0.5, rng(sd + 3), P.c, 0.6);
    });
  });
  c.fillStyle = 'rgba(210,255,240,0.5)'; each(40, function () { c.fillRect(r() * N, r() * N, 1.6, 1.6); });
};

TILES.mirror = function (c, P, N) {
  var n = 8, s = N / n, i, j, q = rng(4242);
  c.fillStyle = '#262b38'; c.fillRect(0, 0, N, N);
  for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
    var col = P.cols[Math.floor(q() * P.cols.length)], x = i * s + 1.1, y = j * s + 1.1, w = s - 2.2;
    var g = c.createLinearGradient(x, y, x + w, y + w); g.addColorStop(0, A.shade(col, 1.55)); g.addColorStop(0.5, col); g.addColorStop(1, A.shade(col, 0.62));
    c.fillStyle = g; c.fillRect(x, y, w, w);
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(x, y, w, 1.4); c.fillRect(x, y, 1.4, w);           // lit edges
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x, y + w - 1.4, w, 1.4); c.fillRect(x + w - 1.4, y, 1.4, w);
    if (q() < 0.34) { c.fillStyle = 'rgba(255,255,255,0.65)'; c.beginPath(); c.moveTo(x + 1.4, y + 1.4); c.lineTo(x + w * 0.55, y + 1.4); c.lineTo(x + 1.4, y + w * 0.55); c.closePath(); c.fill(); }
  }
};

/* ---------------------------- moving light ---------------------------- */
/* aurora: curtains of light swaying over a dark night sky */
LIVE.aurora = function (c, N, P, t) {
  var i, k, pass;
  c.fillStyle = P.base; c.fillRect(0, 0, N, N);
  c.fillStyle = '#ffffff';
  for (k = 0; k < 8; k++) { c.globalAlpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 3 + k * 2.3)); c.fillRect((k * 29 + 7) % N, (k * 47 + 11) % N, 1.5, 1.5); }
  c.globalCompositeOperation = 'lighter';
  for (pass = 0; pass < 2; pass++) for (i = 0; i < P.cols.length; i++) {
    // pass 0: wide soft curtains. pass 1: a thin bright core down the middle of each
    var cx = N * (0.5 + 0.5 * Math.sin(t * (0.32 + i * 0.07) + i * 2.4)), hw = N * (0.2 + 0.05 * Math.sin(t * 0.8 + i)) * (pass ? 0.35 : 1), amp = N * 0.12, ph = t * 1.6 + i * 1.7;
    var g = c.createLinearGradient(0, 0, 0, N); g.addColorStop(0, pass ? '#ffffff' : P.cols[i]); g.addColorStop(0.6, pass ? P.cols[i] : P.cols[i]); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalAlpha = pass ? 0.55 : 0.9; c.fillStyle = g;
    for (k = -1; k <= 1; k++) {
      var y, ox = k * N;
      c.beginPath(); c.moveTo(ox + cx - hw + amp * Math.sin(ph), 0);
      for (y = 8; y <= N; y += 8) c.lineTo(ox + cx - hw + amp * Math.sin(y * 0.11 + ph), y);
      for (y = N; y >= 0; y -= 8) c.lineTo(ox + cx + hw + amp * Math.sin(y * 0.11 + ph + 0.6), y);
      c.closePath(); c.fill();
    }
  }
};

})(typeof window !== 'undefined' ? window : globalThis);
