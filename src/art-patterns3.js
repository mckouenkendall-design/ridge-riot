/* Ridge Riot: still more paint finishes (the fourth batch).
   Same rules as art-patterns.js: each painter fills one small repeating picture (a "tile") that art-skins.js repeats
   across the bike's main bodywork. Add to TILES for a painted-once tile or to LIVE for one that is repainted every frame. */
(function (root) {
'use strict';
var RR = root.RR, A = RR.Art, K = A.kit, TAU = K.TAU, TILES = A.TILES, LIVE = A.LIVE, rng = K.rng, wrap = K.wrap, blobAt = K.blobAt;

function each(n, fn) { for (var i = 0; i < n; i++) fn(i); }
function mod(a, n) { return ((a % n) + n) % n; }
function lg(c, x0, y0, x1, y1, stops) { var g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
function rg(c, x, y, r0, r1, stops) { var g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
function mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
function smooth(a, b, x) { var k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); }
/* draw a soft glow disc */
function glow(c, x, y, rad, col, a) { c.globalAlpha = a == null ? 1 : a; c.fillStyle = rg(c, x, y, 0, rad, [[0, col], [1, 'rgba(0,0,0,0)']]); c.fillRect(x - rad, y - rad, rad * 2, rad * 2); c.globalAlpha = 1; }
/* a tilted polygon band of light that repeats across the tile: x0 and width in tile fractions */
function sheen(c, N, x0, wd, col) {
  for (var k = -1; k <= 1; k++) { c.fillStyle = col; c.beginPath(); c.moveTo(k * N + N * x0, 0); c.lineTo(k * N + N * (x0 + wd), 0); c.lineTo(k * N + N * (x0 + wd) + N, N); c.lineTo(k * N + N * x0 + N, N); c.closePath(); c.fill(); }
}
/* a line that wanders across the tile and joins up with itself: y = y0 + j*x + sine waves (j a whole number) */
function wander(N, y0, j, harm) {
  var pts = [], u, y, h;
  for (u = -12; u <= N + 12; u += 3) { y = y0 + j * u; for (h = 0; h < harm.length; h++) y += harm[h][1] * Math.sin(TAU * harm[h][0] * u / N + harm[h][2]); pts.push([u, y]); }
  return pts;
}
function strokeLine(c, N, pts, wd, col, alpha, wob) {
  var i, oy, w;
  c.strokeStyle = col; c.globalAlpha = alpha; c.lineCap = 'round';
  for (oy = -N; oy <= N; oy += N) for (i = 1; i < pts.length; i++) {
    w = wd * (wob ? wob(pts[i][0]) : 1); if (w < 0.1) continue;
    c.lineWidth = w; c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1] + oy); c.lineTo(pts[i][0], pts[i][1] + oy); c.stroke();
  }
  c.globalAlpha = 1;
}
/* a tile is shown upside down on the bike (its y axis points up there), so painters that have an up and a down call this first */
function up(c, N) { c.translate(0, N); c.scale(1, -1); }
function put(c, N, x, y, rad, fn) { wrap(N, x, y, rad, function (px, py) { c.save(); c.translate(px, py); fn(); c.restore(); }); }
/* paint a tile one pixel at a time: fn(x, y) returns [r, g, b, a] */
function perPixel(c, N, NH, fn) {
  var im = c.getImageData(0, 0, N, NH), d = im.data, x, y, o, v;
  for (y = 0; y < NH; y++) for (x = 0; x < N; x++) { v = fn(x, y); o = (y * N + x) * 4; d[o] = v[0]; d[o + 1] = v[1]; d[o + 2] = v[2]; d[o + 3] = v[3] == null ? 255 : v[3]; }
  c.putImageData(im, 0, 0);
}

/* ================================================================ RARE ================================================================ */

/* marble: polished Carrara with grey-blue veins and thin gold ones, and a gloss band that slides */
TILES.marble = function (c, P, N, NH, r) {
  var i;
  c.fillStyle = lg(c, 0, 0, N, N, [[0, '#f6f6f4'], [0.5, '#e9ebee'], [1, '#f4f4f1']]); c.fillRect(0, 0, N, N);
  each(14, function (k) {
    var rad = N * (0.12 + r() * 0.16);
    wrap(N, r() * N, r() * N, rad, function (px, py) { glow(c, px, py, rad, k % 3 ? 'rgba(165,178,205,0.09)' : 'rgba(255,255,255,0.8)'); });
  });
  var veins = [[20, 1, 0], [84, -1, 1], [118, 0, 5]], gold = [[52, 1, 3]];
  function vphase() { return [[1 + Math.floor(r() * 2), 7 + r() * 6, r() * TAU], [3 + Math.floor(r() * 2), 3 + r() * 3, r() * TAU], [7, 1.2, r() * TAU]]; }
  function twig(x, y, ang, len, w, col, a) {
    wrap(N, x, y, len + 4, function (px, py) {
      var k, xx = px, yy = py, an = ang; c.strokeStyle = col; c.lineCap = 'round';
      for (k = 0; k < 7; k++) { var nx = xx + Math.cos(an) * len / 7, ny = yy + Math.sin(an) * len / 7; c.globalAlpha = a; c.lineWidth = Math.max(0.5, w * (1 - k / 7)); c.beginPath(); c.moveTo(xx, yy); c.lineTo(nx, ny); c.stroke(); xx = nx; yy = ny; an += (r() - 0.5) * 0.9; }
      c.globalAlpha = 1;
    });
  }
  veins.forEach(function (v, vi) {
    var pts = wander(N, v[0], v[1], vphase()), ph = r() * TAU;
    var wob = function (u) { return 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(TAU * 2 * u / N + ph)); };
    strokeLine(c, N, pts, 13, '#8ea2c4', 0.16, wob); strokeLine(c, N, pts, 4.8, '#7a8fb4', 0.4, wob); strokeLine(c, N, pts, 1.8, '#46598a', 0.92, wob);
    each(4, function () { var p = pts[10 + Math.floor(r() * (pts.length - 20))]; twig(p[0], mod(p[1], N), r() * TAU, 10 + r() * 14, 1.5, '#6a7ea2', 0.7); });
  });
  gold.forEach(function (v) {
    var pts = wander(N, v[0], v[1], vphase()), ph = r() * TAU;
    var wob = function (u) { return 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(TAU * 3 * u / N + ph)); };
    strokeLine(c, N, pts, 6, '#e0b040', 0.22, wob); strokeLine(c, N, pts, 2.8, '#c8912a', 0.95, wob);
    var up = pts.map(function (p) { return [p[0], p[1] - 1.1]; }); strokeLine(c, N, up, 1.1, '#fff0a8', 0.9, wob);
    each(4, function () { var p = pts[10 + Math.floor(r() * (pts.length - 20))]; twig(p[0], mod(p[1], N), r() * TAU, 6 + r() * 9, 1.2, '#c8912a', 0.9); });
  });
  // fine crystal speckle
  each(90, function () { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.7)' : 'rgba(120,135,165,0.25)'; c.fillRect(r() * N, r() * N, 1.1, 1.1); });
  // polish: two bands of gloss, the paint job slides them along
  sheen(c, N, 0.12, 0.2, 'rgba(255,255,255,0.22)'); sheen(c, N, 0.19, 0.04, 'rgba(255,255,255,0.55)');
};

/* stained glass: jewel panes in irregular shapes, lead lines, light shining through, a tiny rose window */
TILES.stainedglass = function (c, P, N, NH, r) {
  var G = 4, sites = [], i, j, di, dj, cols = ['#d3122f', '#1f55e0', '#12a653', '#f5a613'].map(hex);
  for (j = 0; j < G; j++) for (i = 0; i < G; i++) sites.push({ x: (i + 0.5 + (r() - 0.5) * 0.7) * N / G, y: (j + 0.5 + (r() - 0.5) * 0.7) * N / G, ci: (i + 2 * j) % 4, lit: 0.8 + r() * 0.5 });
  var all = []; sites.forEach(function (s) { for (di = -1; di <= 1; di++) for (dj = -1; dj <= 1; dj++) all.push({ x: s.x + di * N, y: s.y + dj * N, s: s }); });
  perPixel(c, N, N, function (x, y) {
    var d1 = 1e9, d2 = 1e9, s1 = null, k, d, dx, dy, a;
    for (k = 0; k < all.length; k++) { dx = all[k].x - x; dy = all[k].y - y; d = Math.sqrt(dx * dx + dy * dy); if (d < d1) { d2 = d1; d1 = d; s1 = all[k]; } else if (d < d2) d2 = d; }
    var edge = d2 - d1, base = cols[s1.s.ci], n = (Math.sin(x * 1.7 + y * 0.9) + Math.sin(x * 0.6 - y * 2.1)) * 0.04;
    var lightK = Math.max(0, 1 - d1 / 24) * s1.s.lit, col = mix(mix(base, [0, 0, 0], 0.32), mix(base, [255, 255, 255], 0.55), Math.min(1, lightK * 0.95 + n));
    if (edge < 3.4) { var l = smooth(2.0, 3.4, edge); col = mix([22, 20, 30], col, l); if (edge > 3.0 || (edge > 2.4 && x + y < 0)) col = mix(col, [120, 118, 140], 0.2); }
    else if (edge < 5 && ((x * 3 + y) % 7) < 3) col = mix(col, [255, 255, 255], 0.1);
    a = 255; return [col[0], col[1], col[2], a];
  });
  // little highlight streaks like glass catching the light
  each(10, function () { var x = r() * N, y = r() * N, L = 4 + r() * 6; put(c, N, x, y, 14, function () { c.rotate(-0.6); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(0, 0, L, 1.3); c.fillRect(L + 3, 0, 2, 1.3); }); });
  // rose window in two of the panes
  [[0.5, 0.5]].forEach(function (p, pi) {
    var cx = p[0] * N, cy = p[1] * N, R = 13;
    put(c, N, cx, cy, R + 4, function () {
      var k, pc = ['#ffd24a', '#ff3d5a', '#4fa0ff', '#4fe08a'];
      c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fillStyle = '#17141f'; c.fill();
      for (k = 0; k < 8; k++) { c.save(); c.rotate(k * TAU / 8); c.beginPath(); c.ellipse(R * 0.6, 0, R * 0.34, R * 0.2, 0, 0, TAU); c.fillStyle = pc[(k + pi) % 4]; c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#17141f'; c.stroke();
        c.beginPath(); c.arc(R * 0.5, -R * 0.05, 1.3, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill(); c.restore(); }
      c.beginPath(); c.arc(0, 0, R * 0.25, 0, TAU); c.fillStyle = pi ? '#ff3d5a' : '#ffd24a'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#17141f'; c.stroke();
      c.beginPath(); c.arc(0, 0, R, 0, TAU); c.lineWidth = 2; c.strokeStyle = '#17141f'; c.stroke();
      c.beginPath(); c.arc(0, 0, R - 1.6, 3.4, 4.7); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke();
    });
  });
};

/* monarch: orange cells, black veins, a black border with white dots, fine scales and a soft shine */
TILES.monarch = function (c, P, N, NH, r) {
  var org = hex('#ff9a1a'), dark = hex('#c9480a'), lite = hex('#ffc43d'), blk = [20, 14, 14];
  perPixel(c, N, N, function (x, y) {
    var q = mod((x - y) / N + 0.012 * Math.sin(TAU * (x + y) / N), 1), p = mod((x + y) / N, 1), col, k;
    // border band q 0.66..1.0, orange wing 0..0.66 cut by veins at 0, .165, .33, .495, .66
    if (q > 0.64) {
      var inner = smooth(0.64, 0.665, q); col = mix(dark, blk, inner);
      // faint orange edge glow into the black
      if (q < 0.7) col = mix(col, [60, 26, 8], 0.5 * (1 - smooth(0.665, 0.7, q)));
      // black band edge on the far side melts back into the next wing: tile repeats, so a thin dark-to-orange gradient
      if (q > 0.93) col = mix(col, dark, smooth(0.93, 0.995, q));
    } else {
      var cell = Math.floor(q / 0.213), t = (q - cell * 0.213) / 0.213;
      col = mix(mix(dark, org, smooth(0, 0.28, t)), lite, smooth(0.35, 0.72, t) * 0.9 * (0.6 + 0.4 * Math.sin(TAU * (p * 2 + cell * 0.31))));
      col = mix(col, dark, smooth(0.72, 1, t) * 0.8);
      // veins: thin black lines along the cell edges and short cross veins
      var ve = Math.min(t, 1 - t) * 0.213 * N; if (ve < 1.9) col = mix(blk, col, smooth(1.0, 1.9, ve));
      if (t > 0.08 && t < 0.92 && Math.abs(mod(p + cell * 0.37, 0.5)) * N * 0.7 < 1.1) col = mix(blk, col, 0.3);
    }
    return col;
  });
  // white dots in the border: a big row and a small row
  var q0 = 0.82, k;
  for (k = 0; k < 7; k++) { var pp = (k + 0.5) / 7, x = (q0 + pp) * N / 2, y = (pp - q0) * N / 2, r1 = N * 0.03, r2 = N * 0.018;
    put(c, N, x, y, 8, function () { c.beginPath(); c.arc(0, 0, r1 * 1.5, 0, TAU); c.fillStyle = '#fbfaf2'; c.fill(); c.beginPath(); c.arc(-0.6, -0.6, r1 * 0.7, 0, TAU); c.fillStyle = '#ffffff'; c.fill(); });
    var pp2 = (k + 1) / 7, q2 = 0.72; put(c, N, (q2 + pp2) * N / 2, (pp2 - q2) * N / 2, 6, function () { c.beginPath(); c.arc(0, 0, r2 * 1.3, 0, TAU); c.fillStyle = '#f2f0e4'; c.fill(); });
  }
  // scales: rows of tiny overlapping arcs, a touch lighter or darker each
  var rr = rng(99), sy, sx;
  for (sy = 0; sy < N; sy += 4) for (sx = 0; sx < N; sx += 5) {
    var ox = sx + (sy / 4 % 2 ? 2.5 : 0), a = rr();
    c.beginPath(); c.arc(ox, sy, 3.2, 0.15, Math.PI - 0.15); c.lineWidth = 0.9; c.strokeStyle = a < 0.5 ? 'rgba(255,230,160,0.22)' : 'rgba(60,20,0,0.2)'; c.stroke();
  }
  // soft shine
  sheen(c, N, 0.2, 0.2, 'rgba(255,255,230,0.16)'); sheen(c, N, 0.27, 0.05, 'rgba(255,255,255,0.28)');
};

/* lacquer: red and black lamellar plates tied with silk in diamond crosses, gold trim, deep gloss */
TILES.lacquer = function (c, P, N, NH, r) {
  var S = N / 4, i, j;
  up(c, N);
  c.fillStyle = '#0d0a0b'; c.fillRect(0, 0, N, N);
  for (j = 0; j < 4; j++) for (i = 0; i < 4; i++) {
    var red = (i + j) % 2 === 0, x = i * S, y = j * S, w = S - 3, h = S - 3, base = red ? ['#e8302a', '#a8121a', '#5e060c'] : ['#3a3a44', '#17171d', '#050507'];
    put(c, N, x + S / 2, y + S / 2, S, function () {
      // plate with a thick dark outline
      c.beginPath(); c.moveTo(-w / 2 + 3, -h / 2); c.lineTo(w / 2 - 3, -h / 2); c.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 3); c.lineTo(w / 2, h / 2 - 5); c.quadraticCurveTo(w / 2, h / 2, w / 2 - 4, h / 2); c.lineTo(-w / 2 + 4, h / 2); c.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 5); c.lineTo(-w / 2, -h / 2 + 3); c.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + 3, -h / 2); c.closePath();
      c.fillStyle = lg(c, 0, -h / 2, 0, h / 2, [[0, base[0]], [0.45, base[1]], [1, base[2]]]); c.fill(); c.lineWidth = 2; c.strokeStyle = '#050304'; c.stroke();
      // gold trim along the lower edge and the sides
      c.beginPath(); c.moveTo(-w / 2 + 3, h / 2 - 3); c.lineTo(w / 2 - 3, h / 2 - 3); c.lineWidth = 1.7; c.strokeStyle = '#f2c14a'; c.stroke();
      c.beginPath(); c.moveTo(-w / 2 + 2.2, -h / 2 + 4); c.lineTo(-w / 2 + 2.2, h / 2 - 5); c.moveTo(w / 2 - 2.2, -h / 2 + 4); c.lineTo(w / 2 - 2.2, h / 2 - 5); c.lineWidth = 0.9; c.strokeStyle = 'rgba(242,193,74,0.75)'; c.stroke();
      // deep gloss: a bright curved streak and a soft reflection
      c.beginPath(); c.moveTo(-w / 2 + 5, -h / 2 + 3.5); c.lineTo(w / 2 - 8, -h / 2 + 3.5); c.lineWidth = 1.8; c.strokeStyle = red ? 'rgba(255,200,190,0.8)' : 'rgba(210,215,255,0.55)'; c.stroke();
      c.beginPath(); c.ellipse(-w * 0.15, -h * 0.05, w * 0.22, h * 0.1, -0.5, 0, TAU); c.fillStyle = red ? 'rgba(255,170,160,0.28)' : 'rgba(200,205,255,0.2)'; c.fill();
    });
  }
  // silk lacing: vertical cords between plates and a diamond cross where four plates meet
  var silk = P.c || '#f4ead0', sd = '#9b8a5e';
  for (i = 0; i < 4; i++) {
    var cx = i * S;
    for (j = 0; j < 4; j++) {
      var cy = j * S;
      put(c, N, cx, cy, 14, function () {
        c.lineCap = 'round'; c.lineJoin = 'round';
        // cord running down
        c.beginPath(); c.moveTo(0, -S / 2 + 4); c.lineTo(0, S / 2 - 4); c.lineWidth = 4; c.strokeStyle = '#1a1210'; c.stroke(); c.lineWidth = 2.6; c.strokeStyle = silk; c.stroke();
        // diamond cross
        c.beginPath(); c.moveTo(0, -7); c.lineTo(6, 0); c.lineTo(0, 7); c.lineTo(-6, 0); c.closePath(); c.lineWidth = 3.8; c.strokeStyle = '#1a1210'; c.stroke(); c.lineWidth = 2.2; c.strokeStyle = silk; c.stroke();
        c.beginPath(); c.moveTo(-4, -4); c.lineTo(4, 4); c.moveTo(4, -4); c.lineTo(-4, 4); c.lineWidth = 1.4; c.strokeStyle = sd; c.stroke();
        c.beginPath(); c.arc(0, 0, 1.5, 0, TAU); c.fillStyle = '#f2c14a'; c.fill();
      });
    }
  }
};

/* titanium: heat-anodised metal, the colour bands either side of a weld bead, with a brushed grain */
TILES.titanium = function (c, P, N, NH, r) {
  var stops = [[0, '#c4c9d1'], [0.05, '#e7c868'], [0.13, '#d99a2c'], [0.22, '#c8337f'], [0.31, '#7a38c4'], [0.4, '#2f58d6'], [0.5, '#22a8c0'], [0.6, '#5a8f98'], [0.72, '#80888f'], [1, '#6e7580']].map(function (s) { return [s[0], hex(s[1])]; });
  var row = [], rowB = []; each(N, function () { row.push(r()); rowB.push(r()); });
  function ramp(t) { var i = 0; while (i < stops.length - 2 && t > stops[i + 1][0]) i++; var a = stops[i], b = stops[i + 1]; return mix(a[1], b[1], (t - a[0]) / (b[0] - a[0])); }
  perPixel(c, N, N, function (x, y) {
    var v = mod(y / N + 0.016 * Math.sin(TAU * x / N) + 0.006 * Math.sin(TAU * 3 * x / N + 1), 1), t = v < 0.5 ? v * 2 : (1 - v) * 2;
    var col = ramp(t), gr = (row[y] - 0.5) * 0.16 + 0.05 * Math.sin(x * (0.06 + rowB[y] * 0.12) + rowB[y] * 20), k = 1 + gr;
    return [Math.min(255, col[0] * k), Math.min(255, col[1] * k), Math.min(255, col[2] * k)];
  });
  // a few long bright scratches along the grain
  each(14, function () { var y = r() * N, x = r() * N, L = 20 + r() * 50; wrap(N, x, y, L, function (px, py) { c.fillStyle = r() < 0.6 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.16)'; c.fillRect(px, py, L, 0.8); }); });
  // the weld bead: a row of overlapping ripples ("stack of dimes")
  var bx;
  for (bx = 0; bx < N + 8; bx += 8) {
    var by = 1.4 * Math.sin(bx * TAU / N * 2);
    [by, by + N].forEach(function (yy) {
      c.beginPath(); c.arc(bx - 3, yy, 6.5, -1.45, 1.45); c.lineWidth = 3.2; c.strokeStyle = 'rgba(30,34,46,0.7)'; c.stroke();
      c.beginPath(); c.arc(bx - 4, yy, 6.5, -1.35, 1.35); c.lineWidth = 2.3; c.strokeStyle = '#c9ced6'; c.stroke();
      c.beginPath(); c.arc(bx - 4.6, yy - 0.5, 6.2, -1.2, 0.1); c.lineWidth = 0.9; c.strokeStyle = 'rgba(255,255,255,0.95)'; c.stroke();
    });
  }
  sheen(c, N, 0.14, 0.2, 'rgba(255,255,255,0.15)'); sheen(c, N, 0.21, 0.035, 'rgba(255,255,255,0.5)');
};

/* lava lamp: wax that melts into itself, glowing in purple liquid, with a strip of glass glare */
TILES.lavalamp = function (c, P, N, NH, r) {
  var B = [[36, 34, 15, 0], [52, 52, 8, 0], [92, 92, 13, 1], [101, 76, 6, 1], [106, 22, 8, 1], [20, 100, 9, 0], [30, 112, 5, 0], [62, 112, 5, 1], [70, 66, 6, 0], [96, 50, 3.5, 1], [10, 62, 4, 0], [58, 8, 5, 1], [120, 108, 4, 0]], all = [];
  B.forEach(function (b) { for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) all.push({ x: b[0] + i * N, y: b[1] + j * N, r2: b[2] * b[2] * 1.6, pk: b[3] }); });
  var ye = hex('#fff0a0'), or = hex('#ff9a2e'), rd = hex('#e8421c'), pk0 = hex('#ffe0f0'), pk1 = hex('#ff6fa8'), pk2 = hex('#d4166e');
  perPixel(c, N, N, function (x, y) {
    y = N - 1 - y; var f = 0, pk = 0, k, dx, dy, d2, w, ws = 0, fe = 0;
    for (k = 0; k < all.length; k++) { dx = all[k].x - x; dy = all[k].y - y; d2 = dx * dx + dy * dy; if (d2 > 4000) continue; w = all[k].r2 / (d2 + 1); f += w; pk += w * all[k].pk; ws += w; }
    var liquid = mix(hex('#3b1470'), hex('#26094a'), 0.5 + 0.5 * Math.cos(TAU * y / N)), glowK = Math.min(1, f * 0.9);
    liquid = mix(liquid, hex('#9a3aa8'), glowK * 0.5);
    if (f < 1) { if (f > 0.97) return mix(liquid, [110, 20, 50], 0.8); return liquid; }
    var h = ws ? pk / ws : 0, inner = Math.min(1, (f - 1) / 2.2), edge = f < 1.18 ? 1 - (f - 1) / 0.18 : 0, col;
    col = h > 0.5 ? (inner < 0.5 ? mix(pk2, pk1, inner * 2) : mix(pk1, pk0, (inner - 0.5) * 2)) : (inner < 0.5 ? mix(rd, or, inner * 2) : mix(or, ye, (inner - 0.5) * 2));
    return mix(col, [70, 10, 30], edge * 0.55);
  });
  up(c, N);
  // wax highlights
  B.forEach(function (b) { if (b[2] < 5) return; wrap(N, b[0], b[1], b[2], function (px, py) { c.beginPath(); c.ellipse(px - b[2] * 0.4, py - b[2] * 0.45, b[2] * 0.26, b[2] * 0.13, -0.7, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.62)'; c.fill(); }); });
  // tiny bubbles and specks
  each(24, function (i) { var x = r() * N, y = r() * N, q = 0.7 + r() * 1.2; c.beginPath(); c.arc(x, y, q, 0, TAU); c.fillStyle = i % 2 ? 'rgba(255,170,220,0.6)' : 'rgba(255,220,150,0.6)'; c.fill(); });
  // glass glare: a tall bright strip and a faint one, repeating with the tile
  c.fillStyle = 'rgba(255,255,255,0.17)'; c.fillRect(8, 0, 14, N); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(11, 0, 2.4, N); c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(16, 0, 1.4, N);
  c.fillStyle = 'rgba(255,255,255,0.09)'; c.fillRect(110, 0, 5, N);
};

/* koi pond: dark teal water with rings and light caustics, koi seen from above, lily pads */
TILES.koi = function (c, P, N, NH, r) {
  perPixel(c, N, N, function (x, y) {
    var f = Math.sin(TAU * 2 * x / N + 1.3 * Math.sin(TAU * 2 * y / N + 0.5)) + Math.sin(TAU * 2 * y / N + 1.1 * Math.sin(TAU * 3 * x / N + 1.7)),
      b = Math.exp(-f * f * 14), depth = 0.5 + 0.5 * Math.sin(TAU * (x + y) / N), base = mix(hex('#0a3844'), hex('#0e5662'), depth);
    return mix(base, hex('#8ff0d8'), b * 0.32);
  });
  up(c, N);
  function ring(x, y, rr, a) { wrap(N, x, y, rr + 3, function (px, py) { c.beginPath(); c.ellipse(px, py, rr, rr * 0.92, 0, 0, TAU); c.lineWidth = 1.5; c.strokeStyle = 'rgba(190,245,235,' + a + ')'; c.stroke(); c.beginPath(); c.ellipse(px, py + 1, rr, rr * 0.92, 0, 0.3, 1.5); c.lineWidth = 1; c.strokeStyle = 'rgba(0,30,40,' + a * 0.8 + ')'; c.stroke(); }); }
  [[16, 70, 3], [30, 60, 8], [45, 78, 13], [100, 24, 6], [100, 24, 12], [70, 8, 4], [70, 8, 9]].forEach(function (q) { ring(q[0], q[1], q[2], 0.55 - q[2] * 0.02); });
  function pad(x, y, R, ang, flower) {
    put(c, N, x, y, R + 12, function () {
      c.fillStyle = 'rgba(0,15,25,0.35)'; c.beginPath(); c.arc(2, 3, R, 0, TAU); c.fill();
      c.rotate(ang); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, 0.28, TAU - 0.28); c.closePath();
      c.fillStyle = rg(c, -R * 0.3, -R * 0.3, 1, R * 1.1, [[0, '#59c46a'], [0.6, '#2b9552'], [1, '#17653a']]); c.fill(); c.lineWidth = 2; c.strokeStyle = '#0c3820'; c.lineJoin = 'round'; c.stroke();
      c.lineWidth = 0.9; c.strokeStyle = 'rgba(190,255,190,0.4)'; each(7, function (k) { var a = 0.5 + k * (TAU - 1.0) / 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92); c.stroke(); });
      c.beginPath(); c.arc(0, 0, R * 0.9, 1.0, 2.2); c.lineWidth = 1.2; c.strokeStyle = 'rgba(220,255,220,0.5)'; c.stroke();
      c.rotate(-ang);
      if (flower) {
        var k, ring2;
        for (ring2 = 0; ring2 < 2; ring2++) for (k = 0; k < 8; k++) { c.save(); c.rotate(k * TAU / 8 + ring2 * 0.4); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(R * (0.2 - ring2 * 0.05), -R * 0.22, R * (0.62 - ring2 * 0.2), 0); c.quadraticCurveTo(R * (0.2 - ring2 * 0.05), R * 0.22, 0, 0); c.fillStyle = ring2 ? '#ffd0e6' : '#ff86be'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#c02e78'; c.stroke(); c.restore(); }
        c.beginPath(); c.arc(0, 0, R * 0.17, 0, TAU); c.fillStyle = '#ffd84a'; c.fill(); c.lineWidth = 1; c.strokeStyle = '#a8620a'; c.stroke();
      }
    });
  }
  pad(100, 100, 17, 0.9, true); pad(20, 26, 11, 3.6, false); pad(64, 56, 8, 5.0, false);
  function fish(x, y, ang, L, bend, body, spots, seed) {
    put(c, N, x, y, L * 0.8, function () {
      var q = rng(seed), n = 16, k, top = [], bot = [], sp = [];
      c.rotate(ang);
      for (k = 0; k <= n; k++) {
        var s = k / n, w = L * 0.115 * Math.pow(Math.sin(Math.PI * Math.min(1, s * 0.93 + 0.05)), 0.7) * (1 - s * 0.35), xs = L * (0.5 - s), ys = bend * L * Math.sin(Math.PI * s * 1.1) * s;
        top.push([xs, ys - w]); bot.push([xs, ys + w]); sp.push([xs, ys, w]);
      }
      function bodyPath() { c.beginPath(); top.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); for (k = n; k >= 0; k--) c.lineTo(bot[k][0], bot[k][1]); c.closePath(); }
      var tailX = L * -0.5, tailY = sp[n][1];
      c.fillStyle = 'rgba(255,170,90,0.7)'; c.beginPath(); c.moveTo(tailX + 2, tailY); c.quadraticCurveTo(tailX - L * 0.12, tailY - L * 0.22, tailX - L * 0.28, tailY - L * 0.2); c.quadraticCurveTo(tailX - L * 0.14, tailY - L * 0.04, tailX - L * 0.2, tailY); c.quadraticCurveTo(tailX - L * 0.14, tailY + L * 0.04, tailX - L * 0.28, tailY + L * 0.2); c.quadraticCurveTo(tailX - L * 0.12, tailY + L * 0.22, tailX + 2, tailY); c.fill();
      c.lineWidth = 0.7; c.strokeStyle = 'rgba(255,230,200,0.6)'; each(5, function (j) { c.beginPath(); c.moveTo(tailX + 2, tailY); c.lineTo(tailX - L * 0.26, tailY + (j - 2) * L * 0.09); c.stroke(); });
      [-1, 1].forEach(function (sd) { var p = sp[4]; c.fillStyle = 'rgba(255,190,120,0.7)'; c.beginPath(); c.moveTo(p[0], p[1] + sd * p[2] * 0.7); c.quadraticCurveTo(p[0] - L * 0.08, p[1] + sd * (p[2] + L * 0.14), p[0] - L * 0.2, p[1] + sd * (p[2] + L * 0.12)); c.quadraticCurveTo(p[0] - L * 0.12, p[1] + sd * (p[2] + L * 0.02), p[0] - L * 0.1, p[1] + sd * p[2] * 0.7); c.fill(); c.lineWidth = 0.8; c.strokeStyle = 'rgba(255,240,220,0.5)'; c.stroke(); });
      c.fillStyle = 'rgba(0,20,30,0.35)'; c.save(); c.translate(1.5, 2.5); bodyPath(); c.fill(); c.restore();
      bodyPath(); c.fillStyle = body; c.fill();
      c.save(); bodyPath(); c.clip();
      spots.forEach(function (s2) { var m = sp[s2[0]], rr2 = L * s2[1]; c.beginPath(); c.ellipse(m[0], m[1] + s2[2] * L, rr2 * 1.3, rr2, q() - 0.5, 0, TAU); c.fillStyle = s2[3]; c.fill(); });
      c.beginPath(); top.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p[0], p[1] + 2.4 + (sp[i][2] * 0.2)); }); c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke();
      c.restore();
      bodyPath(); c.lineWidth = 1.5; c.strokeStyle = 'rgba(30,10,0,0.7)'; c.stroke();
      [-1, 1].forEach(function (sd) { c.beginPath(); c.arc(L * 0.4, sd * L * 0.06, 1.6, 0, TAU); c.fillStyle = '#10080a'; c.fill(); c.beginPath(); c.arc(L * 0.405, sd * L * 0.06 - 0.5, 0.6, 0, TAU); c.fillStyle = '#fff'; c.fill(); });
    });
  }
  fish(40, 42, -0.5, 78, 0.1, '#fff4e4', [[1, 0.1, -0.01, '#f2521c'], [3, 0.13, 0.01, '#f2521c'], [4, 0.08, -0.03, '#16110f'], [6, 0.1, 0.02, '#f2521c'], [8, 0.09, 0.0, '#16110f'], [10, 0.08, 0.02, '#f27a1c']], 5);
  fish(90, 88, 2.55, 62, -0.12, '#ff8a22', [[2, 0.09, 0, '#fff0d6'], [5, 0.1, 0.02, '#fff0d6'], [8, 0.08, -0.01, '#e8421c']], 11);
  sheen(c, N, 0.6, 0.12, 'rgba(210,255,245,0.07)');
};

/* damask: gold fleur-de-lis brocade on burgundy velvet with sewn pearls */
TILES.damask = function (c, P, N, NH, r) {
  perPixel(c, N, N, function (x, y) {
    var n = r(), lt = 0.5 + 0.5 * Math.sin(TAU * (x - y) / N);
    return mix(hex('#4e0a1e'), hex('#8a1a3a'), lt * 0.55 + n * 0.12);
  });
  up(c, N);
  var gold = function (x0, y0, x1, y1) { return lg(c, x0, y0, x1, y1, [[0, '#fff0a8'], [0.35, '#e9b93c'], [0.7, '#b8801c'], [1, '#e2ac34']]); };
  var OUTL = '#2e0610';
  function half(draw) { draw(); c.save(); c.scale(-1, 1); draw(); c.restore(); }
  function fleur() {
    half(function () {
      c.beginPath(); c.moveTo(3, 2); c.bezierCurveTo(8, -6, 20, -18, 28, -8); c.bezierCurveTo(32, -1, 26, 9, 15, 9); c.bezierCurveTo(19, 4, 18, -1, 14, -2); c.bezierCurveTo(10, -3, 8, 2, 3, 4); c.closePath();
      c.fillStyle = gold(0, -18, 28, 10); c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUTL; c.lineJoin = 'round'; c.stroke();
      c.beginPath(); c.moveTo(8, -3); c.bezierCurveTo(14, -12, 22, -14, 26, -9); c.lineWidth = 0.9; c.strokeStyle = '#fff4bc'; c.stroke();
      c.beginPath(); c.moveTo(5, 13); c.bezierCurveTo(14, 12, 22, 18, 19, 25); c.bezierCurveTo(17, 29, 11, 28, 12, 24); c.lineWidth = 3; c.strokeStyle = OUTL; c.lineCap = 'round'; c.stroke(); c.lineWidth = 1.7; c.strokeStyle = '#e9b93c'; c.stroke();
    });
    c.beginPath(); c.moveTo(0, -32); c.bezierCurveTo(7, -23, 10, -10, 5, 3); c.lineTo(-5, 3); c.bezierCurveTo(-10, -10, -7, -23, 0, -32); c.closePath();
    c.fillStyle = gold(-8, -30, 8, 4); c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUTL; c.stroke();
    c.beginPath(); c.moveTo(0, -27); c.lineTo(0, -2); c.lineWidth = 0.9; c.strokeStyle = 'rgba(120,70,0,0.7)'; c.stroke(); c.beginPath(); c.moveTo(-2.4, -20); c.lineTo(-3.4, -8); c.lineWidth = 0.9; c.strokeStyle = '#fff4bc'; c.stroke();
    c.beginPath(); c.moveTo(-11, 5); c.lineTo(11, 5); c.lineTo(10, 11); c.lineTo(-10, 11); c.closePath(); c.fillStyle = gold(0, 5, 0, 11); c.fill(); c.lineWidth = 1.4; c.strokeStyle = OUTL; c.stroke();
    c.beginPath(); c.moveTo(-8, 7); c.lineTo(8, 7); c.lineWidth = 0.8; c.strokeStyle = '#fff4bc'; c.stroke();
    c.beginPath(); c.moveTo(-5, 11); c.bezierCurveTo(-7, 20, -3, 26, 0, 32); c.bezierCurveTo(3, 26, 7, 20, 5, 11); c.closePath(); c.fillStyle = gold(-6, 11, 6, 32); c.fill(); c.lineWidth = 1.4; c.strokeStyle = OUTL; c.stroke();
  }
  function rosette() {
    var k;
    for (k = 0; k < 8; k++) { c.save(); c.rotate(k * TAU / 8); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(4, -4, 5, -10, 0, -15); c.bezierCurveTo(-5, -10, -4, -4, 0, 0); c.fillStyle = gold(-4, -15, 4, 0); c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUTL; c.stroke(); c.restore(); }
    c.beginPath(); c.arc(0, 0, 4.2, 0, TAU); c.fillStyle = gold(-4, -4, 4, 4); c.fill(); c.lineWidth = 1.2; c.strokeStyle = OUTL; c.stroke();
  }
  function pearl(x, y, R) { put(c, N, x, y, R + 3, function () { c.beginPath(); c.arc(0.8, 1.2, R, 0, TAU); c.fillStyle = 'rgba(20,0,6,0.5)'; c.fill(); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fillStyle = rg(c, -R * 0.35, -R * 0.4, 0.2, R * 1.1, [[0, '#ffffff'], [0.5, '#f2e8dc'], [1, '#b8a8a0']]); c.fill(); c.lineWidth = 0.7; c.strokeStyle = 'rgba(60,20,20,0.6)'; c.stroke(); c.beginPath(); c.arc(-R * 0.35, -R * 0.4, R * 0.25, 0, TAU); c.fillStyle = '#fff'; c.fill(); }); }
  c.lineCap = 'round';
  function lat(x0, y0, x1, y1, cx, cy) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.lineWidth = 3; c.strokeStyle = OUTL; c.stroke(); c.lineWidth = 1.5; c.strokeStyle = '#d9a52e'; c.stroke(); c.lineWidth = 0.6; c.strokeStyle = '#fff0a8'; c.stroke(); }
  [-N, 0, N].forEach(function (ox) { [-N, 0, N].forEach(function (oy) { c.save(); c.translate(ox, oy);
    lat(64, 0, 0, 64, 28, 28); lat(64, 0, 128, 64, 100, 28); lat(0, 64, 64, 128, 28, 100); lat(128, 64, 64, 128, 100, 100);
    c.restore(); }); });
  put(c, N, 64, 64, 40, function () { fleur(); });
  put(c, N, 0, 0, 20, function () { rosette(); });
  [[64, 0], [0, 64], [64, 128], [128, 64], [64, 38], [64, 90], [38, 64], [90, 64]].forEach(function (p, i) { pearl(p[0], p[1], i < 4 ? 3.2 : 2); });
  sheen(c, N, 0.1, 0.22, 'rgba(255,225,140,0.14)'); sheen(c, N, 0.17, 0.04, 'rgba(255,245,200,0.3)');
};

/* ================================================================ EPIC ================================================================ */
function hsl2rgb(h, s, l) {
  h = mod(h, 360) / 360; var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  function f(t) { t = mod(t, 1); return 255 * (t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p); }
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)];
}
function star4(c, x, y, s, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x, y, x, y + s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y - s); c.quadraticCurveTo(x, y, x - s, y); c.fill(); }

/* peacock: a train of feathers, each with an eye, over colours that shift from green to blue to gold */
TILES.peacock = function (c, P, N, NH, r) {
  perPixel(c, N, N, function (x, y) {
    var h = 168 + 52 * Math.sin(TAU * (x + y * 0.5) / N) + 14 * Math.sin(TAU * 2 * (x - y) / N + 1), l = 0.27 + 0.07 * Math.sin(TAU * y / N + 2);
    return hsl2rgb(h, 0.72, l);
  });
  up(c, N);
  var eyes = [];
  [0, 1, 2, 3].forEach(function (row) { [0, 1].forEach(function (col) { eyes.push([(row % 2 ? 0 : 32) + col * 64, 16 + row * 32, (row * 2 + col) % 3]); }); });
  // barbs: fine strokes fanning out from every eye, long in the gaps between
  eyes.forEach(function (e) {
    put(c, N, e[0], e[1], 44, function () {
      var k, a, q = rng(e[0] * 31 + e[1]);
      for (k = 0; k < 46; k++) { a = (k / 46) * TAU + q() * 0.05; var r0 = 15 + q() * 4, r1 = 26 + q() * 14, dx = Math.cos(a), dy = Math.sin(a) * 1.15;
        c.beginPath(); c.moveTo(dx * r0 * 0.8, dy * r0 * 1.15); c.lineTo(dx * r1 * 0.9, dy * r1 * 1.2 + 4); c.lineWidth = 1; c.strokeStyle = k % 3 === 0 ? 'rgba(255,225,110,0.55)' : k % 3 === 1 ? 'rgba(0,25,40,0.45)' : 'rgba(150,255,210,0.3)'; c.stroke(); }
    });
  });
  eyes.forEach(function (e) {
    put(c, N, e[0], e[1], 30, function () {
      // outer gold edge with a dark outline, then green, blue and teal rings
      function eye(rx, ry, fill, lw) { c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fillStyle = fill; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = '#04182a'; c.stroke(); } }
      eye(15.5, 21, '#b8801a', 2.2);
      c.beginPath(); c.ellipse(0, 0, 14, 19.5, 0, 0, TAU); c.lineWidth = 1.4; c.strokeStyle = '#ffe27a'; c.stroke();
      eye(12, 16.5, rg(c, -3, -5, 1, 17, [[0, '#4be08a'], [1, '#0f7a3c']]), 1);
      eye(9, 12.5, rg(c, -2, -4, 1, 13, [[0, '#4a8cff'], [1, '#143f9e']]), 1);
      eye(5.8, 8, rg(c, -1.5, -2.5, 0.5, 8, [[0, '#6af4e0'], [1, '#0c8f9a']]), 0.9);
      c.beginPath(); c.ellipse(0, 1.5, 3, 4.4, 0, 0, TAU); c.fillStyle = '#0a1f55'; c.fill();
      c.beginPath(); c.ellipse(-1, -0.6, 1.2, 1.8, 0.2, 0, TAU); c.fillStyle = '#d6fff8'; c.fill();
      c.beginPath(); c.ellipse(-3.2, -9.5, 2.6, 1.1, -0.5, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill();
    });
  });
  sheen(c, N, 0.3, 0.1, 'rgba(255,255,255,0.1)');
};

/* hologram: diffraction foil. Soft rainbow bands, fine ruled lines, glitter and bright streaks */
TILES.hologram = function (c, P, N, NH, r) {
  perPixel(c, N, N, function (x, y) {
    var u = (x + y) / N, h = 360 * u * 2 + 30 * Math.sin(TAU * (x - y) / N * 2) + 40, v = mod(x - y, 3), l = 0.68 + 0.08 * Math.sin(TAU * u * 4);
    var col = hsl2rgb(h, 0.95, l);
    if (v < 1) col = mix(col, [255, 255, 255], 0.28); else if (v > 2) col = mix(col, [60, 60, 120], 0.12);
    return col;
  });
  // a faint repeating motif pressed into the foil, like the little logos on banknotes
  var mx, my;
  for (mx = 0; mx < 2; mx++) for (my = 0; my < 2; my++) put(c, N, 32 + mx * 64, 32 + my * 64, 20, function () {
    c.beginPath(); c.moveTo(0, -14); c.lineTo(14, 0); c.lineTo(0, 14); c.lineTo(-14, 0); c.closePath(); c.lineWidth = 1.4; c.strokeStyle = 'rgba(255,255,255,0.65)'; c.stroke();
    c.beginPath(); c.moveTo(0, -8); c.lineTo(8, 0); c.lineTo(0, 8); c.lineTo(-8, 0); c.closePath(); c.lineWidth = 1; c.strokeStyle = 'rgba(80,60,180,0.4)'; c.stroke();
    c.beginPath(); c.arc(0, 0, 2.4, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill();
  });
  // bright specular streaks
  sheen(c, N, 0.08, 0.16, 'rgba(255,255,255,0.28)'); sheen(c, N, 0.13, 0.03, 'rgba(255,255,255,0.8)'); sheen(c, N, 0.58, 0.05, 'rgba(255,255,255,0.35)'); sheen(c, N, 0.6, 0.012, 'rgba(255,255,255,0.9)');
  // prismatic glitter
  each(34, function (i) { var x = r() * N, y = r() * N, s = 1.2 + r() * 2.8; put(c, N, x, y, 8, function () { star4(c, 0, 0, s * 1.8, i % 3 ? 'hsla(' + Math.floor(r() * 360) + ',100%,80%,0.95)' : '#ffffff'); c.beginPath(); c.arc(0, 0, s * 0.35, 0, TAU); c.fillStyle = '#fff'; c.fill(); }); });
};

/* galaxy: a spiral of stars and gas in purple, magenta, blue and teal, with dust lanes and a bright core */
TILES.galaxy = function (c, P, N, NH, r) {
  var pal = [[0, '#06031a'], [0.3, '#1a0c4e'], [0.5, '#4a1a9a'], [0.68, '#a02ab8'], [0.82, '#2a5ad8'], [1, '#22c4d0']].map(function (s) { return [s[0], hex(s[1])]; });
  function ramp(t) { var i = 0; t = Math.max(0, Math.min(0.999, t)); while (i < pal.length - 2 && t > pal[i + 1][0]) i++; var a = pal[i], b = pal[i + 1]; return mix(a[1], b[1], (t - a[0]) / (b[0] - a[0])); }
  perPixel(c, N, N, function (x, y) {
    var u = TAU * x / N, v = TAU * y / N, w = Math.sin(u * 2 + 1.4 * Math.sin(v + 1)) + Math.sin(v * 2 + 1.3 * Math.sin(u * 2 + 0.4)) + 0.6 * Math.sin(u * 3 + v * 3 + 2) + 0.5 * Math.sin(u * 5 - v * 4 + 0.7);
    var t = 0.5 + w * 0.17, d = Math.hypot(x - 64, y - 64) / 64;
    return ramp(t * 0.75 * (1 - 0.3 * Math.max(0, 1 - d)) + 0.04);
  });
  up(c, N);
  put(c, N, 64, 64, 70, function () {
    var arm, k, q = rng(7);
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rg(c, 0, 0, 0, 40, [[0, 'rgba(255,230,200,0.9)'], [0.3, 'rgba(255,150,230,0.4)'], [1, 'rgba(120,60,255,0)']]); c.fillRect(-40, -40, 80, 80);
    for (arm = 0; arm < 2; arm++) {
      var a0 = arm * Math.PI;
      c.lineCap = 'round';
      [[11, 0.07], [5, 0.12], [2, 0.2]].forEach(function (g) { c.beginPath(); for (k = 0; k <= 50; k++) { var rr = 5 + k * 1.05, a = a0 + 2.9 * Math.log(1 + rr / 7); c[k ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr * 0.98); } c.lineWidth = g[0]; c.strokeStyle = 'rgba(190,140,255,' + g[1] + ')'; c.stroke(); });
    }
    for (k = 0; k < 1100; k++) {
      var t = Math.pow(q(), 0.8), rr = 4 + t * 54, a = (k % 2) * Math.PI + 2.9 * Math.log(1 + rr / 7) + (q() - 0.5) * (0.5 + 0.8 * t), sx = Math.cos(a) * rr, sy = Math.sin(a) * rr, s = 0.4 + q() * (1.1 - t * 0.5);
      var cl = t < 0.25 ? [255, 238, 210] : t < 0.6 ? (q() < 0.5 ? [255, 190, 240] : [180, 200, 255]) : (q() < 0.5 ? [140, 230, 255] : [200, 160, 255]);
      c.fillStyle = 'rgba(' + (cl[0] | 0) + ',' + (cl[1] | 0) + ',' + (cl[2] | 0) + ',' + (0.4 + q() * 0.6) + ')'; c.fillRect(sx - s / 2, sy - s / 2, s, s);
    }
    c.globalCompositeOperation = 'source-over';
    // dust lanes: dark arcs hugging the inside of each arm
    for (arm = 0; arm < 2; arm++) { c.beginPath(); for (k = 0; k <= 46; k++) { var rr2 = 8 + k * 1.0, a2 = arm * Math.PI + 2.9 * Math.log(1 + rr2 / 7) - 0.28; c[k ? 'lineTo' : 'moveTo'](Math.cos(a2) * rr2, Math.sin(a2) * rr2); } c.lineWidth = 3.2; c.strokeStyle = 'rgba(8,2,30,0.5)'; c.stroke(); }
    glow(c, 0, 0, 12, 'rgba(255,250,235,1)', 1);
  });
  // star clusters and the many tiny stars
  [[16, 22, 7], [108, 100, 9], [100, 12, 6], [20, 108, 6]].forEach(function (s) { put(c, N, s[0], s[1], s[2] + 3, function () { glow(c, 0, 0, s[2] * 1.5, 'rgba(160,200,255,0.5)'); each(14, function () { var a = r() * TAU, d = r() * s[2]; c.fillStyle = '#fff'; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 1.2, 1.2); }); }); });
  each(150, function (i) { var x = r() * N, y = r() * N; c.fillStyle = i % 7 === 0 ? 'rgba(255,214,150,0.95)' : 'rgba(255,255,255,' + (0.4 + r() * 0.6) + ')'; c.fillRect(x, y, i % 11 === 0 ? 1.8 : 1, i % 11 === 0 ? 1.8 : 1); });
  each(6, function () { var x = r() * N, y = r() * N; put(c, N, x, y, 8, function () { star4(c, 0, 0, 4.5, 'rgba(255,255,255,0.95)'); }); });
};

/* synthwave: a striped sunset over a neon grid, with palm trees on the horizon */
TILES.synthwave = function (c, P, N, NH, r) {
  var H = 82;
  up(c, N);
  // sky (the bottom of the tile is the same deep purple as the top, so the tiles join up)
  c.fillStyle = lg(c, 0, 0, 0, H, [[0, '#1a0840'], [0.55, '#4c1580'], [0.85, '#c8247e'], [1, '#ff6a6a']]); c.fillRect(0, 0, N, H);
  c.fillStyle = lg(c, 0, H, 0, N, [[0, '#2a0a4a'], [0.6, '#1c0838'], [1, '#1a0840']]); c.fillRect(0, H, N, N - H);
  each(14, function () { var x = r() * N, y = r() * 44; c.fillStyle = 'rgba(255,255,255,' + (0.4 + r() * 0.5) + ')'; c.fillRect(x, y, 1.2, 1.2); });
  // sun: yellow at the top to hot pink, with slits cut across its lower half
  var cx = 64, cy = 54, R = 36;
  glow(c, cx, cy, R * 1.9, 'rgba(255,60,160,0.5)');
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip(); c.beginPath(); c.rect(0, 0, N, H); c.clip();
  c.fillStyle = lg(c, 0, cy - R, 0, cy + R, [[0, '#fff25a'], [0.4, '#ffb53a'], [0.7, '#ff4f8a'], [1, '#ff2fb0']]);
  var y = cy - R, sl = [[0.54, 1.2], [0.62, 2], [0.7, 3], [0.78, 4.2], [0.86, 5.4], [0.94, 6.8]], prev = cy - R;
  c.fillRect(0, cy - R, N, R * 2 * 0.54);
  var yy = cy - R + R * 2 * 0.54, k;
  for (k = 0; k < sl.length; k++) { var top = cy - R + R * 2 * sl[k][0]; var gap = sl[k][1]; if (k) { c.fillRect(0, prev, N, top - prev); } prev = top + gap; }
  c.fillRect(0, prev, N, H - prev);
  c.restore();
  c.beginPath(); c.arc(cx, cy, R, Math.PI * 1.02, Math.PI * 1.98); c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,230,0.6)'; c.stroke();
  // neon horizon line
  c.fillStyle = '#ff3fd0'; c.fillRect(0, H - 1, N, 2.4); c.fillStyle = 'rgba(255,63,208,0.35)'; c.fillRect(0, H - 4, N, 8);
  // grid: lines run to a point on the horizon. Painted three times side by side so the repeat joins up.
  [-N, 0, N].forEach(function (ox) {
    var i, g;
    for (i = -10; i <= 10; i++) { var xb = 64 + i * 26; c.beginPath(); c.moveTo(ox + 64 + (xb - 64) * 0.03, H); c.lineTo(ox + xb, N); c.lineWidth = 4; c.strokeStyle = 'rgba(40,220,255,0.18)'; c.stroke(); c.lineWidth = 1.3; c.strokeStyle = '#37e8ff'; c.stroke(); }
  });
  var hy = [0, 0.1, 0.22, 0.38, 0.58, 0.82];
  hy.forEach(function (f) { var yy2 = H + 2 + f * (N - H - 2); c.fillStyle = 'rgba(255,63,208,0.2)'; c.fillRect(0, yy2 - 2, N, 5); c.fillStyle = '#ff5ae0'; c.fillRect(0, yy2 - 0.6, N, 1.4); });
  // palms
  function palm(x, h, s) {
    c.save(); c.translate(x, H); c.scale(s, s); c.fillStyle = '#0c031c'; c.strokeStyle = '#0c031c'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-1.6, 0); c.quadraticCurveTo(-1.5, -h * 0.55, 2.2, -h); c.lineTo(3.8, -h + 0.4); c.quadraticCurveTo(1.2, -h * 0.5, 1.8, 0); c.closePath(); c.fill();
    var tx = 3, ty = -h;
    [[-9, -9, -17, 4], [-6, -13, -11, -6], [0, -14, 0, -9], [6, -13, 12, -5], [9, -9, 18, 5], [-11, -3, -14, 9], [11, -3, 15, 9]].forEach(function (f) {
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + f[0], ty + f[1], tx + f[2], ty + f[3]); c.quadraticCurveTo(tx + f[0] * 0.8, ty + f[1] + 3.5, tx, ty + 1); c.fill();
    });
    c.beginPath(); c.arc(tx, ty + 1.5, 2, 0, TAU); c.fill();
    c.restore();
  }
  palm(14, 24, 1); palm(112, 18, 0.8); palm(100, 12, 0.6);
  // a dark rim light along the tops of the palms, like neon catching them
  sheen(c, N, 0.5, 0.04, 'rgba(255,255,255,0.08)');
};

/* fireworks: bursts in the night sky: a peony, a drooping willow, a ring and some small ones, in drifting smoke */
TILES.fireworks = function (c, P, N, NH, r) {
  up(c, N);
  c.fillStyle = lg(c, 0, 0, 0, N, [[0, '#0a0f30'], [0.5, '#1a1450'], [1, '#0a0f30']]); c.fillRect(0, 0, N, N);
  each(8, function (i) { var rad = N * (0.14 + r() * 0.14); wrap(N, r() * N, r() * N, rad, function (px, py) { glow(c, px, py, rad, i % 2 ? 'rgba(120,100,170,0.2)' : 'rgba(70,70,130,0.28)'); }); });
  each(50, function () { c.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.6) + ')'; c.fillRect(r() * N, r() * N, 1, 1); });
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  function trail(x0, y0, x1, y1, bx, by, col, w, tip) {
    var k, n = 7;
    for (k = 0; k < n; k++) { var t0 = k / n, t1 = (k + 1) / n; c.beginPath();
      c.moveTo((1 - t0) * (1 - t0) * x0 + 2 * (1 - t0) * t0 * bx + t0 * t0 * x1, (1 - t0) * (1 - t0) * y0 + 2 * (1 - t0) * t0 * by + t0 * t0 * y1);
      c.lineTo((1 - t1) * (1 - t1) * x0 + 2 * (1 - t1) * t1 * bx + t1 * t1 * x1, (1 - t1) * (1 - t1) * y0 + 2 * (1 - t1) * t1 * by + t1 * t1 * y1);
      c.lineWidth = w * (0.4 + 0.6 * t1); c.strokeStyle = col; c.globalAlpha = 0.12 + 0.88 * t1 * t1; c.stroke(); }
    c.globalAlpha = 1; c.beginPath(); c.arc(x1, y1, w * 0.95, 0, TAU); c.fillStyle = tip || '#fff'; c.fill();
  }
  function burst(x, y, n, r0, r1, cols, kind, droop, w) {
    put(c, N, x, y, r1 + 8, function () {
      glow(c, 0, 0, r1 * 0.9, 'rgba(255,220,180,0.28)'); var k;
      for (k = 0; k < n; k++) {
        if (kind === 'willow' && Math.sin(k * TAU / n) > 0.8) continue;
        var a = k * TAU / n + (kind === 'ring' ? 0 : (k % 2) * 0.05), rr = r1 * (kind === 'peony' && k % 2 ? 0.82 : 1), col = cols[k % cols.length], dx = Math.cos(a), dy = Math.sin(a);
        if (kind === 'ring') { var px = dx * r1, py = dy * r1 * 0.9; trail(dx * (r1 - 7), dy * (r1 - 7) * 0.9, px, py, dx * (r1 - 3.5), dy * (r1 - 3.5) * 0.9, col, w, '#fff'); }
        else if (kind === 'willow') trail(dx * r0, dy * r0, dx * rr * 0.92, dy * rr * 0.92 + droop * (0.8 + ((k * 5) % 7) / 7), dx * rr * 1.12, dy * rr * 1.12 - 3, col, w, col);
        else trail(dx * r0, dy * r0, dx * rr, dy * rr, dx * rr * 0.62, dy * rr * 0.62, col, w, '#fff');
        
      }
      glow(c, 0, 0, 7, 'rgba(255,255,255,1)'); glow(c, 0, 0, 3.5, 'rgba(255,255,255,1)');
    });
  }
  burst(38, 46, 24, 6, 32, ['#ff4a9a', '#ffb0d8', '#ff7ab8'], 'peony', 0, 1.6);
  burst(100, 30, 24, 4, 34, ['#ffd24a', '#ffb02a', '#fff0a0'], 'willow', 20, 1.4);
  burst(70, 104, 22, 0, 22, ['#35f0c8', '#7affea', '#ff4a6a'], 'ring', 0, 1.8);
  burst(8, 110, 14, 3, 15, ['#7aa8ff', '#c8d8ff'], 'peony', 0, 1.2);
  burst(120, 92, 14, 3, 12, ['#b06aff', '#e0b0ff'], 'peony', 0, 1.2);
  c.globalCompositeOperation = 'source-over';
  // a pair of late sparks falling through the smoke
  each(16, function () { var x = r() * N, y = r() * N; c.fillStyle = 'rgba(255,230,160,' + (0.5 + r() * 0.5) + ')'; c.fillRect(x, y, 1.4, 2.4); });
};

/* ================================================================ LIVE ================================================================
   These are repainted every frame onto a 64 x 64 tile, so they keep the work small: anything that does not move is painted
   once into a cached picture (layer) and copied in with one drawImage, and only the moving parts are drawn each frame. */
var CACHE = {};
function layer(key, N, fn) { var o = CACHE[key]; if (!o) { o = CACHE[key] = K.mk(N, N); fn(o.getContext('2d'), N); } return o; }
/* a soft round glow of one colour, painted once and reused */
function glowSprite(col, R) { return layer('glow' + col + R, R * 2, function (g, S) { g.fillStyle = rg(g, R, R, 0, R, [[0, col], [1, 'rgba(0,0,0,0)']]); g.fillRect(0, 0, S, S); }); }
/* draw a picture that repeats every N so that it slides along x and/or y without a seam */
function slide(c, img, N, ox, oy) {
  var xs = ox === 0 ? [0] : [mod(ox, N) - N, mod(ox, N)], ys = oy === 0 ? [0] : [mod(oy, N) - N, mod(oy, N)], a, b;
  for (a = 0; a < xs.length; a++) for (b = 0; b < ys.length; b++) c.drawImage(img, xs[a], ys[b]);
}

/* magma: black basalt plates split by glowing cracks. The lava pulses and flows, embers rise. */
function clipHalf(poly, a, b, c0) {   // keep the part of poly where a*x + b*y <= c0
  var out = [], i, p, q, dp, dq;
  for (i = 0; i < poly.length; i++) {
    p = poly[i]; q = poly[(i + 1) % poly.length]; dp = a * p[0] + b * p[1] - c0; dq = a * q[0] + b * q[1] - c0;
    if (dp <= 0) out.push(p);
    if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) { var f = dp / (dp - dq); out.push([p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f]); }
  }
  return out;
}
function plates(N, G, seed, jit) {
  var q = rng(seed), sites = [], i, j, k, cells = [];
  for (j = 0; j < G; j++) for (i = 0; i < G; i++) sites.push([(i + 0.5 + (q() - 0.5) * jit) * N / G, (j + 0.5 + (q() - 0.5) * jit) * N / G]);
  var all = []; sites.forEach(function (s) { for (i = -1; i <= 1; i++) for (j = -1; j <= 1; j++) all.push([s[0] + i * N, s[1] + j * N, s]); });
  sites.forEach(function (s) {
    var poly = [[s[0] - N, s[1] - N], [s[0] + N, s[1] - N], [s[0] + N, s[1] + N], [s[0] - N, s[1] + N]];
    all.forEach(function (o) { if (o[2] === s && o[0] === s[0] && o[1] === s[1]) return; var dx = o[0] - s[0], dy = o[1] - s[1]; if (dx * dx + dy * dy > N * N * 0.5) return; poly = clipHalf(poly, dx, dy, (o[0] * o[0] - s[0] * s[0] + o[1] * o[1] - s[1] * s[1]) / 2); });
    cells.push({ s: s, poly: poly });
  });
  return cells;
}
function magmaStatic(N) {
  return CACHE.magma || (CACHE.magma = (function () {
    var cells = plates(N, 3, 11, 0.9), path = new Path2D(), q = rng(9), pools = [], i, j;
    cells.forEach(function (cell) {
      cell.poly.forEach(function (p, n) {
        var p2 = cell.poly[(n + 1) % cell.poly.length], lit = q() < 0.82;
        if (!lit) return;
        for (i = -1; i <= 1; i++) for (j = -1; j <= 1; j++) {
          var ax = p[0] + i * N, ay = p[1] + j * N, bx = p2[0] + i * N, by = p2[1] + j * N;
          if (Math.max(ax, bx) < -6 || Math.min(ax, bx) > N + 6 || Math.max(ay, by) < -6 || Math.min(ay, by) > N + 6) continue;
          path.moveTo(ax, ay); path.lineTo(bx, by);
        }
        if (q() < 0.2 && p[0] > 0 && p[0] < N && p[1] > 0 && p[1] < N) pools.push([p[0], p[1]]);
      });
    });
    var crust = layer('magmacrust', N, function (g) {
      var s = rng(5), n, shade = ['#1d1514', '#241a19', '#171010', '#2a1e1c'];
      g.fillStyle = '#0f0909'; g.fillRect(0, 0, N, N);
      cells.forEach(function (cell, ci) { for (i = -1; i <= 1; i++) for (j = -1; j <= 1; j++) {
        g.save(); g.translate(i * N, j * N); g.beginPath(); cell.poly.forEach(function (p, m) { g[m ? 'lineTo' : 'moveTo'](p[0], p[1]); }); g.closePath();
        g.fillStyle = lg(g, cell.s[0] - 10, cell.s[1] - 10, cell.s[0] + 10, cell.s[1] + 10, [[0, '#3a2b2b'], [0.5, shade[ci % 4]], [1, '#120c0c']]); g.fill();
        g.lineWidth = 1.2; g.strokeStyle = 'rgba(120,115,140,0.35)'; g.clip(); g.translate(1.2, 1.2); g.stroke(); g.restore(); } });
      g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,60,0,0.26)'; g.lineWidth = 9; g.stroke(path);
      g.fillStyle = 'rgba(150,150,180,0.2)'; for (n = 0; n < 50; n++) g.fillRect(s() * N, s() * N, 1, 1);
      g.fillStyle = 'rgba(0,0,0,0.35)'; for (n = 0; n < 30; n++) g.fillRect(s() * N, s() * N, 2, 1);
    });
    return { path: path, pools: pools.slice(0, 5), crust: crust };
  })());
}
var EMBERS = (function () { var q = rng(77), a = []; for (var i = 0; i < 9; i++) a.push([q() * 64, q() * 64, 4 + q() * 7, q() * TAU, 0.8 + q() * 1.2]); return a; })();
LIVE.magma = function (c, N, P, t) {
  var S = magmaStatic(N), pulse = 0.5 + 0.5 * Math.sin(t * 1.9), slow = 0.5 + 0.5 * Math.sin(t * 0.8 + 1.3), i;
  c.save(); up(c, N);
  c.drawImage(S.crust, 0, 0);
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = 'rgba(255,96,10,' + (0.65 + 0.3 * slow) + ')'; c.lineWidth = 3.8 + 1.2 * pulse; c.stroke(S.path);
  c.strokeStyle = 'rgba(255,190,60,' + (0.8 + 0.2 * pulse) + ')'; c.lineWidth = 1.8; c.stroke(S.path);
  c.setLineDash([3, 11]); c.lineDashOffset = -t * 16; c.strokeStyle = 'rgba(255,252,210,0.95)'; c.lineWidth = 0.9; c.stroke(S.path); c.setLineDash([]);
  var g = glowSprite('rgba(255,150,30,0.9)', 12);
  S.pools.forEach(function (p, n) { c.globalAlpha = 0.45 + 0.4 * Math.sin(t * 1.4 + n * 1.7); c.drawImage(g, p[0] - 12, p[1] - 12); c.globalAlpha = 1; });
  c.globalCompositeOperation = 'lighter';
  for (i = 0; i < EMBERS.length; i++) { var e = EMBERS[i], y = mod(e[1] - t * e[2], N), x = e[0] + 2 * Math.sin(t * e[4] + e[3]); c.fillStyle = 'rgba(255,' + (150 + 80 * (i % 3)) + ',60,' + (0.4 + 0.5 * Math.sin(t * 3 + e[3]) * Math.sin(t * 3 + e[3])) + ')'; c.fillRect(x, y, 1.6, 1.6); }
  c.restore();
};

/* digital rain: columns of falling glyph-like marks with white heads and fading green tails, in three depths */
function glyphs(g, x, y, w, h, q, col) {
  var seg = [[0, 0, w, 0], [0, h / 2, w, h / 2], [0, h, w, h], [0, 0, 0, h / 2], [w, 0, w, h / 2], [0, h / 2, 0, h], [w, h / 2, w, h], [0, 0, w, h], [w, 0, 0, h], [w / 2, 0, w / 2, h]], n = 2 + Math.floor(q() * 3), k;
  g.strokeStyle = col; g.beginPath();
  for (k = 0; k < n; k++) { var s = seg[Math.floor(q() * seg.length)]; g.moveTo(x + s[0], y + s[1]); g.lineTo(x + s[2], y + s[3]); }
  g.stroke();
}
function rainLayer(key, N, seed, cols, cell, gw, lenMin, lenMax, bright) {
  return layer(key, N, function (g) {
    var q = rng(seed), ci, k;
    g.lineCap = 'butt'; g.lineWidth = bright > 0.7 ? 1.5 : 1;
    for (ci = 0; ci < cols.length; ci++) {
      var len = lenMin + Math.floor(q() * (lenMax - lenMin + 1)), head = Math.floor(q() * (N / cell));
      for (k = 0; k < len; k++) {
        var cy = mod(head - k, N / cell) * cell, a = k === 0 ? 1 : Math.max(0.08, 1 - k / len), col = k === 0 ? 'rgba(235,255,240,1)' : k === 1 ? 'rgba(160,255,180,' + a + ')' : 'rgba(40,220,90,' + a * bright + ')';
        if (q() < 0.12 && k > 1) continue;
        glyphs(g, cols[ci], cy + (cell - cell * 0.78) / 2, gw, cell * 0.78, q, col);
        if (k === 0) { g.fillStyle = 'rgba(180,255,200,0.22)'; g.fillRect(cols[ci] - 1, cy, gw + 2, cell); }
      }
    }
  });
}
LIVE.matrix = function (c, N, P, t) {
  var far = [rainLayer('rfA', N, 3, [2, 14, 26, 38, 50], 4, 3, 6, 12, 0.55), rainLayer('rfB', N, 4, [2, 14, 26, 38, 50], 4, 3, 6, 12, 0.55)],
    mid = [rainLayer('rmA', N, 5, [8, 28, 48], 8, 5, 4, 7, 0.8), rainLayer('rmB', N, 6, [8, 28, 48], 8, 5, 4, 7, 0.8)],
    near = [rainLayer('rnA', N, 7, [18, 38, 56], 8, 5, 5, 7, 1), rainLayer('rnB', N, 8, [18, 38, 56], 8, 5, 5, 7, 1)];
  c.save(); up(c, N);
  c.fillStyle = '#01100a'; c.fillRect(0, 0, N, N);
  [[far, 13, 0.6], [mid, 27, 0.85], [near, 47, 1]].forEach(function (L, i) {
    var f = 0.5 + 0.5 * Math.sin(t * (1.1 + i * 0.4) + i * 2), off = t * L[1];
    c.globalAlpha = L[2] * (0.5 + 0.5 * f); slide(c, L[0][0], N, 0, off);
    c.globalAlpha = L[2] * (0.5 + 0.5 * (1 - f)); slide(c, L[0][1], N, 0, off);
  });
  c.globalAlpha = 1; c.restore();
};

/* abyss: dark water, drifting glowing jellyfish, plankton and bubbles */
function jelly(c, x, y, s, col, rim, ph, t) {
  var pu = Math.sin(t * 2.1 + ph), sy = 1 + 0.15 * pu, sx = 1 - 0.09 * pu, i, w;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.globalAlpha = 0.45 + 0.2 * pu; c.drawImage(glowSprite(col, 22), -22, -22); c.globalAlpha = 1;
  c.lineCap = 'round'; c.beginPath();
  for (i = 0; i < 5; i++) { w = Math.sin(t * 2 + ph + i * 1.3); c.moveTo((-6 + 3 * i) * sx, 3); c.bezierCurveTo(-6 + 3 * i + 4 * w, 11, -6 + 3 * i - 4 * w, 17, -6 + 3 * i + 3 * Math.sin(t * 1.6 + ph + i * 2), 25 + (i % 2) * 5); }
  c.lineWidth = 1; c.strokeStyle = rim; c.globalAlpha = 0.75; c.stroke(); c.globalAlpha = 1;
  c.beginPath(); c.moveTo(-3, 3); c.bezierCurveTo(-4 + 3 * Math.sin(t * 1.4 + ph), 10, 4 - 3 * Math.sin(t * 1.4 + ph), 13, 1 + 3 * Math.sin(t * 1.2 + ph), 20); c.moveTo(3, 3); c.bezierCurveTo(5, 8, -2 + 2 * Math.sin(t + ph), 12, -2 * Math.sin(t * 1.3 + ph), 17); c.lineWidth = 2.6; c.strokeStyle = col; c.stroke();
  c.beginPath(); c.moveTo(-10 * sx, 3); c.bezierCurveTo(-11 * sx, -13 * sy, 11 * sx, -13 * sy, 10 * sx, 3); c.quadraticCurveTo(5 * sx, 5, 0, 3); c.quadraticCurveTo(-5 * sx, 5, -10 * sx, 3); c.closePath();
  c.fillStyle = col; c.globalAlpha = 0.5; c.fill(); c.globalAlpha = 1; c.lineWidth = 1.1; c.strokeStyle = rim; c.stroke();
  c.beginPath(); c.moveTo(-6 * sx, 1); c.bezierCurveTo(-6 * sx, -8 * sy, 6 * sx, -8 * sy, 6 * sx, 1); c.closePath(); c.fillStyle = rim; c.globalAlpha = 0.22 + 0.15 * pu; c.fill(); c.globalAlpha = 1;
  c.beginPath(); c.arc(-3 * sx, -6 * sy, 4, 3.6, 4.5); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke();
  c.beginPath(); c.arc(-4, -2, 0.9, 0, TAU); c.moveTo(1, -4); c.arc(0, -4, 0.9, 0, TAU); c.moveTo(5, -1); c.arc(4, -1, 0.9, 0, TAU); c.fillStyle = '#fff'; c.fill();
  c.restore();
}
var JELLIES = [[18, 20, 0.95, 'rgba(0,225,255,0.9)', '#9ff6ff', 0, 3.2], [44, 40, 0.75, 'rgba(255,60,200,0.9)', '#ffb0f0', 2, 2.4], [30, 58, 1.1, 'rgba(60,255,200,0.9)', '#baffe8', 4, 2.9]];
var PLANK = (function () { var q = rng(21), a = []; for (var i = 0; i < 16; i++) a.push([q() * 64, q() * 64, q() * TAU, 0.8 + q() * 1.4]); return a; })();
LIVE.abyss = function (c, N, P, t) {
  var i, g = c.createLinearGradient(0, 0, 0, N);
  c.save(); up(c, N);
  g.addColorStop(0, '#04122a'); g.addColorStop(0.5, '#020a1c'); g.addColorStop(1, '#04122a'); c.fillStyle = g; c.fillRect(0, 0, N, N);
  JELLIES.forEach(function (j) {
    var x = j[0] + 5 * Math.sin(t * 0.5 + j[5]), y = mod(j[1] - t * j[6], N), o;
    for (o = -1; o <= 1; o++) { var yy = y + o * N; if (yy < -16 * j[2] - 4 || yy > N + 32 * j[2]) continue; jelly(c, x, yy, j[2], j[3], j[4], j[5], t); }
  });
  c.fillStyle = 'rgba(160,240,255,0.9)'; c.beginPath();
  for (i = 0; i < 8; i++) { var p = PLANK[i]; c.globalAlpha = 1; c.rect(mod(p[0] + 3 * Math.sin(t * 0.6 + p[2]), N), mod(p[1] - t * 1.5, N), p[3], p[3]); }
  c.globalAlpha = 0.45 + 0.4 * Math.sin(t * 2.5); c.fill();
  c.fillStyle = 'rgba(255,170,240,0.9)'; c.beginPath();
  for (i = 8; i < 16; i++) { var p2 = PLANK[i]; c.rect(mod(p2[0] + 3 * Math.sin(t * 0.7 + p2[2]), N), mod(p2[1] - t * 1.2, N), p2[3], p2[3]); }
  c.globalAlpha = 0.45 + 0.4 * Math.cos(t * 2.1); c.fill(); c.globalAlpha = 1;
  c.beginPath(); [[8, 0, 2.2], [56, 20, 1.6], [26, 40, 1.2], [48, 55, 2]].forEach(function (b) { var by = mod(b[0] * 7 + 50 - t * (6 + b[2] * 2), N), bx = b[1] + 1.5 * Math.sin(t * 1.3 + b[0]); c.moveTo(bx + b[2], by); c.arc(bx, by, b[2], 0, TAU); });
  c.lineWidth = 0.9; c.strokeStyle = 'rgba(180,235,255,0.7)'; c.stroke();
  c.restore();
};

/* ================================================================ TROPHY ================================================================ */
/* a band of light that sweeps along the tile (repeats, so it is drawn at two places) */
function sweep(c, N, x0, lean, w, col) {
  var x = mod(x0, N), k;
  c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); for (k = 0; k < 2; k++) { c.moveTo(x - k * N, 0); c.lineTo(x - k * N - lean, N); } c.stroke();
}
function goldFoil(g, N, light) {
  g.fillStyle = lg(g, 0, 0, N, N, [[0, '#ffe58a'], [0.28, '#e9b53a'], [0.55, '#b9851c'], [0.8, '#f2cb5a'], [1, '#ffe58a']]); g.fillRect(0, 0, N, N);
  var i;
  g.lineWidth = 0.6;
  for (i = -N; i < N; i += 3) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + N, N); g.strokeStyle = 'rgba(90,56,4,0.14)'; g.stroke(); }
  for (i = -N; i < N; i += 3) { g.beginPath(); g.moveTo(i + 1.4, 0); g.lineTo(i + 1.4 + N, N); g.strokeStyle = 'rgba(255,248,200,' + (light || 0.22) + ')'; g.stroke(); }
}

/* grand tour: engraved gold foil showing a map of winding roads, a dotted route, flag pins, laurels and a checkered border */
function tourStatic(N) {
  return CACHE.tour || (CACHE.tour = (function () {
    var route = new Path2D(), pins = [[15, 20], [42, 14], [50, 41], [20, 46]];
    var base = layer('tourbase', N, function (g) {
      var u, y, x;
      goldFoil(g, N, 0.2);
      function road(fx, w, col, dash) {
        g.beginPath(); for (u = -4; u <= N + 4; u += 2) { var p = fx(u); g[u === -4 ? 'moveTo' : 'lineTo'](p[0], p[1]); }
        g.lineWidth = w; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; if (dash) g.setLineDash(dash); g.stroke(); g.setLineDash([]);
      }
      var r1 = function (u) { return [u, 24 + 8 * Math.sin(TAU * u / N + 0.5) + 3 * Math.sin(TAU * 2 * u / N + 1)]; };
      var r2 = function (v) { return [38 + 9 * Math.sin(TAU * v / N + 2.2) + 2.5 * Math.sin(TAU * 3 * v / N), v]; };
      [[r1, 0], [r2, 1]].forEach(function (r) {
        var f = r[0], swap = r[1];
        function pt(u) { return f(u); }
        road(pt, 6.2, '#5a3a06'); road(pt, 4.2, '#fff0a0'); road(pt, 0.9, '#8a5c0c', [3, 3]);
        g.beginPath(); for (u = -4; u <= N + 4; u += 2) { var p = f(u); g[u === -4 ? 'moveTo' : 'lineTo'](p[0] - (swap ? 0 : 0), p[1] - (swap ? 0 : 1.9)); } g.lineWidth = 0.7; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.stroke();
      });
      // dotted route: a long loop that visits the pins
      var rp = [[15, 20], [28, 8], [42, 14], [56, 28], [50, 41], [36, 56], [20, 46], [6, 34], [15, 20]];
      route.moveTo(rp[0][0], rp[0][1]); for (u = 1; u < rp.length; u++) route.quadraticCurveTo((rp[u - 1][0] + rp[u][0]) / 2 + (u % 2 ? 4 : -4), (rp[u - 1][1] + rp[u][1]) / 2 + (u % 2 ? -4 : 4), rp[u][0], rp[u][1]);
      g.setLineDash([1.2, 3.6]); g.lineCap = 'round'; g.lineWidth = 2; g.strokeStyle = '#4a2e04'; g.stroke(route); g.setLineDash([]);
      // laurel wreath around the starting city
      var wx = 15, wy = 20;
      [-1, 1].forEach(function (sd) { for (u = 0; u < 6; u++) { var ph = 0.35 + u * 0.46, lx = wx + sd * Math.sin(ph) * 9.5, ly = wy + Math.cos(ph) * 9.5;
        g.save(); g.translate(lx, ly); g.rotate(Math.atan2(-Math.sin(ph), sd * Math.cos(ph)) + sd * 0.35); g.beginPath(); g.ellipse(2, 0, 3.8, 1.7, 0, 0, TAU); g.fillStyle = '#fff4b0'; g.fill(); g.lineWidth = 0.8; g.strokeStyle = '#4a2e04'; g.stroke();
        g.beginPath(); g.moveTo(-1, 0); g.lineTo(5, 0); g.lineWidth = 0.5; g.stroke(); g.restore(); } });
      // cities
      pins.forEach(function (p, i) { g.beginPath(); g.arc(p[0], p[1], i ? 2.6 : 3.6, 0, TAU); g.fillStyle = '#fff6c0'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#4a2e04'; g.stroke(); g.beginPath(); g.arc(p[0], p[1], 1, 0, TAU); g.fillStyle = '#7a1c14'; g.fill(); });
      // flag pins
      [[42, 14], [50, 41], [20, 46]].forEach(function (p) {
        g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0], p[1] - 11); g.lineWidth = 1.3; g.strokeStyle = '#3a2404'; g.stroke();
        g.beginPath(); g.moveTo(p[0], p[1] - 11); g.lineTo(p[0] + 7, p[1] - 8.5); g.lineTo(p[0], p[1] - 6); g.closePath(); g.fillStyle = '#c0281c'; g.fill(); g.lineWidth = 1; g.strokeStyle = '#3a0c08'; g.stroke();
        g.beginPath(); g.moveTo(p[0] + 0.6, p[1] - 10); g.lineTo(p[0] + 5, p[1] - 8.6); g.lineWidth = 0.7; g.strokeStyle = 'rgba(255,200,180,0.8)'; g.stroke();
      });
      // checkered border along the bottom edge
      for (x = 0; x < 16; x++) for (y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#2a1a02' : '#fff3b8'; g.fillRect(x * 4, N - 8 + y * 4, 4, 4); }
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, N - 8.6, N, 0.8); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(0, N - 9.4, N, 0.8);
    });
    return { base: base, route: route, pins: pins };
  })());
}
LIVE.grandtour = function (c, N, P, t) {
  var S = tourStatic(N), i;
  c.save(); up(c, N);
  c.drawImage(S.base, 0, 0);
  c.lineCap = 'round'; c.setLineDash([1.2, 8.4]); c.lineDashOffset = -t * 9; c.lineWidth = 2.2; c.strokeStyle = '#fff8d0'; c.stroke(S.route); c.setLineDash([]);
  c.globalCompositeOperation = 'lighter';
  sweep(c, N, t * 26 - 10, 22, 12, 'rgba(255,240,170,0.2)'); sweep(c, N, t * 26 - 10, 22, 3, 'rgba(255,255,255,0.55)');
  S.pins.forEach(function (p, n) { var k = Math.max(0, Math.sin(t * 2.2 + n * 1.9)); if (k > 0.05) star4(c, p[0], p[1], 2 + 6 * k, 'rgba(255,255,240,' + (0.4 + 0.6 * k) + ')'); });
  c.restore();
};

/* pinwheel: gold and white blades that really spin, with blur arcs and bright hubs */
function pinCache(N) {
  return layer('pinbase', N, function (g) {
    g.fillStyle = rg(g, N / 2, N / 2, 2, N * 0.75, [[0, '#fff2b0'], [0.5, '#e9b53a'], [1, '#a8741a']]); g.fillRect(0, 0, N, N);
    var o; [[32, 32, 6], [32, 0, 3.4], [0, 32, 3.4], [64, 32, 3.4], [32, 64, 3.4]].forEach(function (st) { g.beginPath(); for (o = 0; o < 8; o++) { var ra = o % 2 ? st[2] * 0.38 : st[2], an = o * Math.PI / 4 - Math.PI / 2; g[o ? 'lineTo' : 'moveTo'](st[0] + Math.cos(an) * ra, st[1] + Math.sin(an) * ra); } g.closePath(); g.fillStyle = '#fff6c8'; g.fill(); g.lineWidth = 0.9; g.strokeStyle = '#5a3a06'; g.stroke(); });
    g.lineWidth = 0.7; var i; for (i = 0; i < 24; i++) { var a = i * TAU / 24; g.beginPath(); g.moveTo(N / 2, N / 2); g.lineTo(N / 2 + Math.cos(a) * N, N / 2 + Math.sin(a) * N); g.strokeStyle = i % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(90,56,4,0.14)'; g.stroke(); }
  });
}
function pinwheel(c, x, y, R, ang, n, wide) {
  var k, W = TAU / n * 0.94;
  c.save(); c.translate(x, y); c.rotate(ang);
  [0, 1].forEach(function (col) {
    c.beginPath();
    for (k = col; k < n; k += 2) { var a = k * TAU / n; c.moveTo(0, 0); c.bezierCurveTo(R * 0.4 * Math.cos(a - 0.7), R * 0.4 * Math.sin(a - 0.7), R * 0.9 * Math.cos(a - 0.3), R * 0.9 * Math.sin(a - 0.3), R * Math.cos(a), R * Math.sin(a)); c.arc(0, 0, R, a, a + W); c.quadraticCurveTo(R * 0.45 * Math.cos(a + W - 0.15), R * 0.45 * Math.sin(a + W - 0.15), 0, 0); }
    c.fillStyle = col ? '#fffaf0' : '#e8b030'; c.fill(); c.lineWidth = 1.1; c.strokeStyle = '#5a3a06'; c.lineJoin = 'round'; c.stroke();
  });
  // a lit edge on each gold blade
  c.beginPath(); for (k = 0; k < n; k += 2) { var a2 = k * TAU / n; c.moveTo(R * 0.25 * Math.cos(a2 - 0.5), R * 0.25 * Math.sin(a2 - 0.5)); c.bezierCurveTo(R * 0.4 * Math.cos(a2 - 0.6), R * 0.4 * Math.sin(a2 - 0.6), R * 0.8 * Math.cos(a2 - 0.3), R * 0.8 * Math.sin(a2 - 0.3), R * 0.95 * Math.cos(a2 - 0.02), R * 0.95 * Math.sin(a2 - 0.02)); }
  c.lineWidth = 0.8; c.strokeStyle = 'rgba(255,255,220,0.9)'; c.stroke();
  c.restore();
  c.beginPath(); c.arc(x, y, R * 0.2, 0, TAU); c.fillStyle = '#ffd84a'; c.fill(); c.lineWidth = 0.9; c.strokeStyle = '#4a2e04'; c.stroke(); c.beginPath(); c.arc(x - R * 0.05, y - R * 0.06, R * 0.07, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
}
LIVE.pinwheel = function (c, N, P, t) {
  var S = pinCache(N);
  c.save(); up(c, N);
  c.drawImage(S, 0, 0);
  [[16, 16, 1], [48, 16, -1.35], [16, 48, -1.35], [48, 48, 1]].forEach(function (w, i) {
    var sp = t * 3.2 * w[2];
    pinwheel(c, w[0], w[1], 15.5, sp + i, 6);
    // motion blur: pale arcs trailing behind the blades
    c.globalCompositeOperation = 'lighter'; c.beginPath(); c.arc(w[0], w[1], 11.5, sp * 1.0 - 1.2 * w[2] + i, sp + i - 0.2 * w[2], w[2] < 0); c.arc(w[0], w[1], 7.5, sp + 1.6 + i, sp + 2.4 + i); c.lineWidth = 2.2; c.strokeStyle = 'rgba(255,248,210,0.35)'; c.stroke(); c.globalCompositeOperation = 'source-over';
  });
  c.globalCompositeOperation = 'lighter'; sweep(c, N, t * 24, 18, 3, 'rgba(255,255,255,0.4)'); c.globalCompositeOperation = 'source-over';
  [[16, 16], [48, 48], [48, 16], [16, 48]].forEach(function (w, i) { var k = Math.max(0, Math.sin(t * 3 + i * 1.6)); if (k > 0.05) star4(c, w[0], w[1], 1.5 + 5 * k, 'rgba(255,255,255,' + (0.5 + 0.5 * k) + ')'); });
  c.restore();
};

/* long haul: night highway. Gold lane paint and reflective studs slide past, with mile posts and headlight shine */
function haulStatic(N) {
  return CACHE.haul || (CACHE.haul = (function () {
    var s = rng(13), i, base = layer('haulbase', N, function (g) {
      g.fillStyle = '#14161e'; g.fillRect(0, 0, N, N);
      g.fillStyle = rg(g, N * 0.25, N / 2, 2, N * 0.8, [[0, 'rgba(255,220,140,0.2)'], [1, 'rgba(255,220,140,0)']]); g.fillRect(0, 0, N, N);
      for (i = 0; i < 160; i++) { g.fillStyle = i % 3 ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.35)'; g.fillRect(s() * N, s() * N, 1, 1); }
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, 21, N, 1.2); g.fillRect(0, 43, N, 1.2);                 // tar seams
      g.fillStyle = '#ffe9a0'; g.fillRect(0, 6, N, 2.4); g.fillStyle = 'rgba(255,233,160,0.25)'; g.fillRect(0, 4, N, 6);          // gold edge line
      g.fillStyle = '#e8e2cc'; g.fillRect(0, 57, N, 2.4); g.fillStyle = 'rgba(232,226,204,0.2)'; g.fillRect(0, 55, N, 6);
    });
    var post = layer('haulpost', 12, function (g) {
      g.fillStyle = '#0a0b10'; g.fillRect(3.5, 5, 5, 13); g.fillStyle = '#f4f0e0'; g.fillRect(4, 4, 4, 14); g.fillStyle = '#ffc83a'; g.fillRect(4, 7, 4, 2); g.fillStyle = '#15171f'; g.fillRect(5, 11, 2, 5); g.fillRect(4, 12, 1, 1);
      g.fillStyle = '#fff'; g.fillRect(4, 4, 1, 14); g.strokeStyle = '#0a0b10'; g.lineWidth = 0.8; g.strokeRect(3.6, 4, 4.8, 14);
    });
    return { base: base, post: post };
  })());
}
var FLECK = (function () { var q = rng(61), a = [], i, y; for (i = 0; i < 16; i++) { y = q() * 64; if (y > 4 && y < 12 || y > 28 && y < 37 || y > 54 && y < 61) y += 10; a.push([q() * 64, y]); } return a; })();
LIVE.longhaul = function (c, N, P, t) {
  var S = haulStatic(N), v = t * 42, i, x;
  c.save(); up(c, N);
  c.drawImage(S.base, 0, 0);
  // lane dashes in gold, sliding left
  c.lineCap = 'butt'; c.setLineDash([18, 14]); c.lineDashOffset = v;
  c.beginPath(); c.moveTo(0, 33.2); c.lineTo(N, 33.2); c.lineWidth = 4; c.strokeStyle = 'rgba(60,36,0,0.7)'; c.stroke();
  c.beginPath(); c.moveTo(0, 32); c.lineTo(N, 32); c.lineWidth = 3.4; c.strokeStyle = '#ffc83a'; c.stroke();
  c.beginPath(); c.moveTo(0, 31); c.lineTo(N, 31); c.lineWidth = 1.2; c.strokeStyle = '#fff3b0'; c.stroke(); c.setLineDash([]);
  // mile post
  var px = mod(26 - v, N); c.drawImage(S.post, px - 6, 0); c.drawImage(S.post, px - 6 - N, 0);
  // reflective studs between the dashes, flashing as the lights catch them
  c.globalCompositeOperation = 'lighter';
  c.beginPath(); for (i = 0; i < 4; i += 2) { x = mod(i * 16 + 9 - v, N); c.rect(x - 1.4, 49.4, 2.8, 2.8); } c.fillStyle = 'rgba(255,190,40,' + (0.6 + 0.4 * Math.sin(t * 6)) + ')'; c.fill();
  c.beginPath(); for (i = 1; i < 4; i += 2) { x = mod(i * 16 + 9 - v, N); c.rect(x - 1.4, 49.4, 2.8, 2.8); } c.fillStyle = 'rgba(255,120,60,' + (0.6 + 0.4 * Math.cos(t * 6)) + ')'; c.fill();
  c.beginPath(); for (i = 0; i < 4; i++) { x = mod(i * 16 + 1 - v, N); c.rect(x - 1, 14.5, 2, 2); } c.fillStyle = 'rgba(255,240,170,0.75)'; c.fill();
  x = mod(9 - v, N); star4(c, x, 50.8, 3 + 3 * Math.max(0, Math.sin(t * 6)), 'rgba(255,230,150,0.9)');
  // gold flecks in the tar, winking
  c.beginPath(); FLECK.forEach(function (f, n) { if (n % 2 === 0) c.rect(mod(f[0] - v * 0.9, N), f[1], 1.3, 1.3); }); c.fillStyle = 'rgba(255,215,100,' + (0.35 + 0.5 * Math.sin(t * 3.1) * Math.sin(t * 3.1)) + ')'; c.fill();
  c.beginPath(); FLECK.forEach(function (f, n) { if (n % 2) c.rect(mod(f[0] - v * 0.9, N), f[1], 1.3, 1.3); }); c.fillStyle = 'rgba(255,215,100,' + (0.35 + 0.5 * Math.cos(t * 3.1) * Math.cos(t * 3.1)) + ')'; c.fill();
  // headlight shine sweeping across
  sweep(c, N, t * 18, 26, 14, 'rgba(255,225,150,0.1)'); sweep(c, N, t * 18, 26, 4, 'rgba(255,245,200,0.22)');
  c.restore();
};

/* curator: gold frames on white marble, each holding a gem or a tiny painting, with warm spotlights sweeping over them */
function curatorStatic(N) {
  return CACHE.curator || (CACHE.curator = layer('curbase', N, function (g) {
    g.fillStyle = lg(g, 0, 0, N, N, [[0, '#fbfaf6'], [0.5, '#ecebe8'], [1, '#f8f6f0']]); g.fillRect(0, 0, N, N);
    var i;
    for (i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-4, 14 + i * 22); for (var u = 0; u <= N + 4; u += 4) g.lineTo(u, 14 + i * 22 + 5 * Math.sin(u * 0.2 + i * 2) + (u * 0.15)); g.lineWidth = 0.9; g.strokeStyle = 'rgba(120,135,165,0.35)'; g.stroke(); }
    var cells = [[16, 16, 0], [48, 16, 1], [16, 48, 2], [48, 48, 3]];
    cells.forEach(function (cl) {
      var x = cl[0], y = cl[1], w = 24, h = 27, X = x - w / 2, Y = y - h / 2;
      g.fillStyle = 'rgba(80,60,40,0.3)'; g.fillRect(X + 1.5, Y + 2, w, h);
      // ornate gold frame: outer bar, inner bevel, corner bosses
      g.fillStyle = lg(g, X, Y, X + w, Y + h, [[0, '#fff0a0'], [0.4, '#e2ae34'], [0.7, '#a8741a'], [1, '#e8bb44']]); g.fillRect(X, Y, w, h);
      g.lineWidth = 1.2; g.strokeStyle = '#4a2e04'; g.strokeRect(X, Y, w, h);
      g.fillStyle = '#7a5010'; g.fillRect(X + 3, Y + 3, w - 6, h - 6); g.fillStyle = '#fff0a8'; g.fillRect(X + 3.6, Y + 3.6, w - 7.2, 0.8); g.fillRect(X + 3.6, Y + 3.6, 0.8, h - 7.2);
      g.fillStyle = '#ffe58a'; [[X + 1.8, Y + 1.8], [X + w - 1.8, Y + 1.8], [X + 1.8, Y + h - 1.8], [X + w - 1.8, Y + h - 1.8]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 1.5, 0, TAU); g.fill(); g.lineWidth = 0.6; g.strokeStyle = '#4a2e04'; g.stroke(); });
      g.beginPath(); g.arc(x, Y + 1.6, 1.8, 0, TAU); g.arc(x, Y + h - 1.6, 1.8, 0, TAU); g.fill();
      // the picture inside
      var ix = X + 5, iy = Y + 5, iw = w - 10, ih = h - 10;
      g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
      if (cl[2] === 1) { g.fillStyle = lg(g, 0, iy, 0, iy + ih, [[0, '#2a1a5a'], [0.5, '#e8508a'], [1, '#ffb040']]); g.fillRect(ix, iy, iw, ih); g.beginPath(); g.arc(x, iy + ih * 0.62, 4, 0, TAU); g.fillStyle = '#fff0a0'; g.fill(); g.fillStyle = '#1a1030'; g.beginPath(); g.moveTo(ix, iy + ih); g.lineTo(ix, iy + ih * 0.75); g.quadraticCurveTo(x - 2, iy + ih * 0.6, x + 2, iy + ih * 0.82); g.quadraticCurveTo(x + 6, iy + ih * 0.7, ix + iw, iy + ih * 0.8); g.lineTo(ix + iw, iy + ih); g.fill(); }
      else if (cl[2] === 3) { g.fillStyle = '#10204a'; g.fillRect(ix, iy, iw, ih); g.lineWidth = 1.2; [['#4fa8ff', 4], ['#ffd84a', 6.5], ['#7a5cff', 9]].forEach(function (a, k) { g.beginPath(); g.arc(x - 1, y, a[1], k * 0.8, k * 0.8 + 4.2); g.strokeStyle = a[0]; g.stroke(); }); g.fillStyle = '#fff'; g.fillRect(x + 3, y - 6, 1, 1); g.fillRect(x - 5, y + 5, 1, 1); }
      else { var gc = cl[2] === 0 ? ['#d8fbff', '#46d4f0', '#1c7fb8'] : ['#ffd0d8', '#f0345a', '#8a0f2a']; g.fillStyle = '#1a0c20'; g.fillRect(ix, iy, iw, ih);
        g.beginPath(); g.moveTo(x - 6, y - 2); g.lineTo(x - 3, y - 6); g.lineTo(x + 3, y - 6); g.lineTo(x + 6, y - 2); g.lineTo(x, y + 7); g.closePath(); g.fillStyle = gc[1]; g.fill(); g.lineWidth = 0.8; g.strokeStyle = gc[0]; g.stroke();
        g.beginPath(); g.moveTo(x - 6, y - 2); g.lineTo(x + 6, y - 2); g.moveTo(x - 3, y - 6); g.lineTo(x - 1.5, y - 2); g.lineTo(x, y + 7); g.moveTo(x + 3, y - 6); g.lineTo(x + 1.5, y - 2); g.lineTo(x, y + 7); g.stroke();
        g.beginPath(); g.moveTo(x - 3, y - 6); g.lineTo(x - 1.5, y - 2); g.lineTo(x - 6, y - 2); g.closePath(); g.fillStyle = gc[0]; g.fill(); g.beginPath(); g.moveTo(x, y + 7); g.lineTo(x + 6, y - 2); g.lineTo(x + 1.5, y - 2); g.closePath(); g.fillStyle = gc[2]; g.fill(); }
      g.restore(); g.lineWidth = 0.9; g.strokeStyle = '#2a1802'; g.strokeRect(ix, iy, iw, ih);
    });
  }));
}
LIVE.curator = function (c, N, P, t) {
  var S = curatorStatic(N), i, cx = 32 + 30 * Math.sin(t * 0.7);
  c.save(); up(c, N);
  c.drawImage(S, 0, 0);
  c.globalCompositeOperation = 'lighter';
  // two warm spotlight cones swinging over the wall
  [[0, 1, 1], [1, -1.2, 0.7]].forEach(function (L) {
    var tx = 32 + 30 * Math.sin(t * 0.7 * L[1] + L[0] * 2.1), a;
    for (a = -1; a <= 1; a++) { c.beginPath(); c.moveTo(tx * 0.35 + 22 + a * N, -2); c.lineTo(tx - 15 + a * N, N); c.lineTo(tx + 15 + a * N, N); c.lineTo(tx * 0.35 + 30 + a * N, -2); c.closePath(); c.fillStyle = 'rgba(255,225,150,' + 0.1 * L[2] + ')'; c.fill(); }
  });
  c.globalAlpha = 0.55; c.drawImage(glowSprite('rgba(255,236,170,0.8)', 22), cx - 22, 10); c.drawImage(glowSprite('rgba(255,236,170,0.8)', 22), cx - 22 - N, 10); c.drawImage(glowSprite('rgba(255,236,170,0.8)', 22), cx - 22, 42); c.drawImage(glowSprite('rgba(255,236,170,0.8)', 22), cx - 22 - N, 42); c.globalAlpha = 1;
  // gems and gold catching the light
  [[16, 16], [16, 48], [48, 48], [48, 16]].forEach(function (g, n) { var k = Math.max(0, Math.sin(t * 2.6 + n * 1.7)); if (k > 0.04) star4(c, g[0] + (n % 2 ? 0 : 1), g[1] - 1, 2 + 8 * k, 'rgba(255,255,255,' + (0.5 + 0.5 * k) + ')'); });
  sweep(c, N, t * 22 + 8, 20, 3, 'rgba(255,248,210,0.5)');
  c.restore();
};

})(typeof window !== 'undefined' ? window : globalThis);
