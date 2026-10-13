/* Ridge Riot: still more paint finishes (the third batch, part A: the common and uncommon ones).
   Same rules as art-patterns.js: each painter fills one small repeating picture (a "tile") that art-skins.js repeats
   across the bike's main bodywork. Add to TILES for a painted-once tile or to LIVE for one that is repainted every frame.
   Every tile is 128 by 128 and has to repeat without a seam, so anything near an edge is drawn again on the far side. */
(function (root) {
'use strict';
var RR = root.RR, A = RR.Art, K = A.kit, TAU = K.TAU, TILES = A.TILES, LIVE = A.LIVE, rng = K.rng, wrap = K.wrap, blobAt = K.blobAt;

function each(n, fn) { for (var i = 0; i < n; i++) fn(i); }
function mod(a, n) { return ((a % n) + n) % n; }
function pick(q, arr) { return arr[Math.floor(q() * arr.length) % arr.length]; }
/* a rounded rectangle path */
function rrect(c, x, y, w, h, rad) {
  c.beginPath(); c.moveTo(x + rad, y); c.lineTo(x + w - rad, y); c.quadraticCurveTo(x + w, y, x + w, y + rad); c.lineTo(x + w, y + h - rad);
  c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h); c.lineTo(x + rad, y + h + 0); c.quadraticCurveTo(x, y + h, x, y + h - rad); c.lineTo(x, y + rad); c.quadraticCurveTo(x, y, x + rad, y); c.closePath();
}
/* draw fn(dx) at the three horizontal wrap offsets */
function wrapX(N, fn) { fn(-N); fn(0); fn(N); }
function wrapY(N, fn) { fn(-N); fn(0); fn(N); }
function dot(c, x, y, rad, col) { c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fillStyle = col; c.fill(); }

/* ======================================================================= */
/* COMMON                                                                  */
/* ======================================================================= */

/* ---- Zebra: black stripes that wobble, pinch to nothing and fork, with a warm grey shadow beside each ---- */
TILES.zebra = function (c, P, N, NH, r) {
  var n = 5, per = N / n, i, y, dx, k;
  // a faint warm wash so the white is not flat
  var g = c.createLinearGradient(0, 0, N, N); g.addColorStop(0, 'rgba(255,255,255,0.0)'); g.addColorStop(0.5, 'rgba(190,165,130,0.16)'); g.addColorStop(1, 'rgba(255,255,255,0.0)');
  c.fillStyle = g; c.fillRect(0, 0, N, N);
  function shape(x0, W, a1, k1, ph1, m, ph2, floor, grow) {
    // returns the left and right edge of a stripe at each height
    var L = [], R = [];
    for (y = -6; y <= N + 6; y += 2) {
      var xc = x0 + a1 * Math.sin(TAU * k1 * y / N + ph1) + 1.4 * Math.sin(TAU * 3 * y / N + ph1 * 2);
      var s = 0.5 + 0.5 * Math.sin(TAU * m * y / N + ph2), w = W * (floor + (1 - floor) * Math.pow(s, grow));
      L.push([xc - w / 2 - 0.25 * Math.sin(y * 0.9), y]); R.push([xc + w / 2 + 0.25 * Math.cos(y * 0.7), y]);
    }
    return { L: L, R: R };
  }
  function fillShape(sh, dxx, grow, col) {
    c.beginPath(); sh.L.forEach(function (p, j) { c[j ? 'lineTo' : 'moveTo'](p[0] + dxx, p[1]); });
    for (j = sh.R.length - 1; j >= 0; j--) c.lineTo(sh.R[j][0] + dxx, sh.R[j][1]);
    c.closePath(); c.fillStyle = col; c.fill();
  }
  var j, shapes = [];
  for (i = 0; i < n; i++) {
    var q = rng(300 + i * 17);
    shapes.push(shape((i + 0.5) * per, per * 0.66, 3 + q() * 3, 1 + (i % 2), q() * TAU, 1 + (i % 2), q() * TAU, 0.1, 0.8));
  }
  // thin fork stripes between the big ones: they start from nothing, swell and fade
  var forks = [];
  for (i = 0; i < n; i++) {
    var q2 = rng(900 + i * 29);
    forks.push(shape((i + 1) * per + (q2() - 0.5) * 3, per * 0.3, 2, 1, q2() * TAU, 1, q2() * TAU, 0.0, 1.8));
  }
  [forks, shapes].forEach(function (set, pass) {
    // soft warm shadow around every stripe
    [[8, 0.09], [4, 0.14]].forEach(function (s) {
      set.forEach(function (sh) { wrapX(N, function (d) {
        c.beginPath(); sh.L.forEach(function (p, jj) { c[jj ? 'lineTo' : 'moveTo'](p[0] + d - s[0] * 0.5, p[1]); });
        for (var jj = sh.R.length - 1; jj >= 0; jj--) c.lineTo(sh.R[jj][0] + d + s[0] * 0.5, sh.R[jj][1]);
        c.closePath(); c.fillStyle = 'rgba(140,112,80,' + s[1] + ')'; c.fill();
      }); });
    });
    set.forEach(function (sh) { wrapX(N, function (d) { fillShape(sh, d, 1, '#17171b'); }); });
    // a lit edge down the left side of each stripe, like light catching short fur
    set.forEach(function (sh) { wrapX(N, function (d) {
      c.beginPath(); sh.L.forEach(function (p, jj) { c[jj ? 'lineTo' : 'moveTo'](p[0] + d + 1.6, p[1]); });
      c.lineWidth = 1.3; c.strokeStyle = 'rgba(150,150,170,0.5)'; c.stroke();
    }); });
  });
  // short fur strokes, light on the black and dark on the white
  each(150, function () { var x = r() * N, yy = r() * N, onBlack = false;
    c.strokeStyle = 'rgba(120,95,70,0.2)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + 1.2, yy + 3.2); c.stroke(); });
};

/* ---- Denim: diagonal twill, faded patches, an orange stitched seam, a stitched pocket, copper rivets ---- */
TILES.denim = function (c, P, N, NH, r) {
  var k;
  // twill weave: a light rib and a dark rib side by side, running on the diagonal
  for (k = -N; k < N; k += 4) {
    c.lineWidth = 1.7; c.strokeStyle = 'rgba(165,205,250,0.3)'; c.beginPath(); c.moveTo(k, 0); c.lineTo(k + N, N); c.stroke();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(6,18,48,0.3)'; c.beginPath(); c.moveTo(k + 2, 0); c.lineTo(k + 2 + N, N); c.stroke();
  }
  // faded, worn patches
  each(9, function (i) {
    var x = r() * N, y = r() * N, br = N * (0.07 + r() * 0.08), sd = Math.floor(r() * 1e6);
    wrap(N, x, y, br * 1.4, function (px, py) { blobAt(c, px, py, br, rng(sd), i % 3 ? 'rgba(175,208,245,0.2)' : 'rgba(8,20,52,0.2)', 0.6); });
  });
  // loose threads
  each(90, function () { var x = r() * N, y = r() * N; c.fillStyle = r() < 0.5 ? 'rgba(210,230,255,0.4)' : 'rgba(5,15,40,0.35)'; c.fillRect(x, y, 2.2, 1); });
  // the seam: a raised strip with two rows of orange stitches
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(0, 52, N, 3);
  c.fillStyle = 'rgba(20,45,100,0.45)'; c.fillRect(0, 36, N, 15);
  c.fillStyle = 'rgba(190,220,255,0.5)'; c.fillRect(0, 36, N, 1.6);
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, 50, N, 1.6);
  [41, 46].forEach(function (y) {
    for (var x = 0; x < N; x += 8) {
      c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(x + 0.5, y + 1.2, 5.4, 2.4);
      c.fillStyle = '#f08a1c'; c.fillRect(x, y, 5.4, 2.4);
      c.fillStyle = '#ffc470'; c.fillRect(x + 0.6, y + 0.2, 4.2, 0.8);
    }
  });
  // a stitched back pocket with a pointed bottom
  function pocket(sc, off) {
    var cx = 90, cy = 90, w = 25 * sc, top = -22 * sc, mid = 8 * sc, bot = 24 * sc;
    c.beginPath(); c.moveTo(cx - w + off, cy + top + off); c.lineTo(cx + w - off, cy + top + off); c.lineTo(cx + w - off, cy + mid); c.lineTo(cx, cy + bot - off * 1.5); c.lineTo(cx - w + off, cy + mid); c.closePath();
  }
  pocket(1, 0); c.save(); c.translate(1.5, 2.6); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fill(); c.restore();
  pocket(1, 0); c.fillStyle = 'rgba(70,115,180,0.38)'; c.fill();
  c.lineJoin = 'round'; c.lineWidth = 1.8; c.strokeStyle = 'rgba(8,20,52,0.7)'; c.stroke();
  c.fillStyle = 'rgba(20,45,100,0.5)'; c.fillRect(65, 68, 50, 9);                     // the folded hem
  c.fillStyle = 'rgba(190,220,255,0.45)'; c.fillRect(65, 68, 50, 1.4);
  pocket(0.84, 0); c.setLineDash([4.5, 3]); c.lineWidth = 2.3; c.strokeStyle = 'rgba(0,0,0,0.35)'; c.save(); c.translate(0, 1); c.stroke(); c.restore();
  c.strokeStyle = '#f08a1c'; c.stroke(); c.setLineDash([]);
  c.beginPath(); c.moveTo(66, 74.5); c.lineTo(114, 74.5); c.setLineDash([4.5, 3]); c.strokeStyle = '#f08a1c'; c.lineWidth = 2.2; c.stroke(); c.setLineDash([]);
  // copper rivets at the pocket corners and on the seam
  [[65, 70], [115, 70], [22, 43.5], [76, 43.5]].forEach(function (s) {
    var g = c.createRadialGradient(s[0] - 1.3, s[1] - 1.5, 0.5, s[0], s[1], 5);
    g.addColorStop(0, '#ffd2a0'); g.addColorStop(0.5, '#d98a4a'); g.addColorStop(1, '#8a4a1c');
    dot(c, s[0] + 0.8, s[1] + 1.5, 4.6, 'rgba(0,0,0,0.35)');
    c.beginPath(); c.arc(s[0], s[1], 4.4, 0, TAU); c.fillStyle = g; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#4a2208'; c.stroke();
    dot(c, s[0] - 1.3, s[1] - 1.5, 1.1, 'rgba(255,255,255,0.8)');
    c.beginPath(); c.arc(s[0], s[1], 2.4, 0.6, 3.4); c.lineWidth = 0.9; c.strokeStyle = 'rgba(70,30,6,0.5)'; c.stroke();
  });
  // whiskers: fade lines where the cloth creases near the seam
  c.lineCap = 'round'; c.lineWidth = 1.5; c.strokeStyle = 'rgba(190,220,250,0.3)';
  [[8, 62, 38], [30, 64, 30], [58, 60, 40], [100, 58, 22], [118, 62, 30]].forEach(function (s) { c.beginPath(); c.moveTo(s[0], s[1]); c.quadraticCurveTo(s[0] + s[2] * 0.4, s[1] + 3, s[0] + s[2], s[1] - 2); c.stroke(); });
};

/* ---- Brick wall: staggered bricks, mortar, chips, soot and a scrawled tag ---- */
TILES.brick = function (c, P, N, NH, r) {
  var RH = 16, BW = 32, pal = ['#a8432f', '#b34f36', '#963a28', '#bb5b3c', '#8c3524', '#a64d30', '#c4673f', '#7e3022'], row, col;
  each(260, function () { c.fillStyle = r() < 0.5 ? 'rgba(255,250,235,0.35)' : 'rgba(80,70,55,0.3)'; c.fillRect(r() * N, r() * N, 1.5, 1.5); });    // sandy mortar
  for (row = 0; row < 8; row++) for (col = -1; col <= 4; col++) {
    var x0 = col * BW + (row % 2 ? BW / 2 : 0), y0 = row * RH, q = rng(row * 13 + mod(col, 4) * 7 + 5), base = pick(q, pal);
    var bx = x0 + 1.6, by = y0 + 1.6, bw = BW - 3.2, bh = RH - 3.2;
    c.fillStyle = 'rgba(40,30,20,0.4)'; c.fillRect(bx + 0.5, by + 1.6, bw, bh);                 // shadow cast on the mortar
    c.fillStyle = base; c.fillRect(bx, by, bw, bh);
    c.fillStyle = A.shade(base, 1.25); c.fillRect(bx, by, bw, 2.4);                            // lit top
    c.fillStyle = A.shade(base, 1.12); c.fillRect(bx, by, 1.6, bh);
    c.fillStyle = A.shade(base, 0.7); c.fillRect(bx, by + bh - 2.4, bw, 2.4); c.fillRect(bx + bw - 1.6, by, 1.6, bh);   // shaded bottom and right
    if (q() < 0.4) { c.fillStyle = 'rgba(40,10,6,0.28)'; c.fillRect(bx + bw * (q() < 0.5 ? 0 : 0.6), by + 2, bw * 0.4, bh - 4); }      // a darker burnt end
    each(9, function () { c.fillStyle = q() < 0.5 ? 'rgba(255,200,160,0.4)' : 'rgba(40,10,6,0.4)'; c.fillRect(bx + 2 + q() * (bw - 5), by + 2 + q() * (bh - 5), 1.4, 1.4); });
    if (q() < 0.4) {            // a chipped corner: a bite out of the brick showing mortar and a dark rim
      var cr = q() < 0.5, cs = 4 + q() * 3, ex = cr ? bx + bw : bx, sg = cr ? -1 : 1, ey = q() < 0.5 ? by : by + bh, sy = ey === by ? 1 : -1;
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + sg * cs, ey); c.lineTo(ex, ey + sy * cs * 0.8); c.closePath(); c.fillStyle = P.a; c.fill();
      c.beginPath(); c.moveTo(ex + sg * cs, ey); c.lineTo(ex, ey + sy * cs * 0.8); c.lineWidth = 1.3; c.strokeStyle = 'rgba(30,10,5,0.7)'; c.stroke();
    }
  }
  // soot climbing the wall from one spot
  [[104, 70, 20, 30], [28, 40, 14, 22]].forEach(function (s) { wrap(N, s[0], s[1], 34, function (px, py) {
    var g = c.createRadialGradient(px, py, 1, px, py, s[3]); g.addColorStop(0, 'rgba(18,14,14,0.5)'); g.addColorStop(1, 'rgba(18,14,14,0)');
    c.save(); c.translate(px, py); c.scale(s[2] / s[3], 1); c.translate(-px, -py); c.fillStyle = g; c.fillRect(px - s[3] * 1.2, py - s[3] * 1.2, s[3] * 2.4, s[3] * 2.4); c.restore();
  }); });
  // a scrawled crown tag in yellow spray paint, with drips
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  [[3, 'rgba(0,0,0,0.25)'], [0, '#f4dc3a']].forEach(function (s) {
    c.save(); c.translate(s[0] * 0.5, s[0] * 0.6); c.lineWidth = 2.6; c.strokeStyle = s[1];
    c.beginPath(); c.moveTo(34, 112); c.lineTo(36, 98); c.lineTo(44, 106); c.lineTo(50, 94); c.lineTo(56, 106); c.lineTo(64, 98); c.lineTo(66, 112); c.quadraticCurveTo(50, 116, 34, 112); c.stroke();
    c.beginPath(); c.moveTo(30, 120); c.bezierCurveTo(44, 114, 56, 124, 72, 118); c.stroke();
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(40, 113); c.lineTo(40, 124); c.moveTo(58, 116); c.lineTo(58, 121); c.stroke();
    c.restore();
  });
  dot(c, 40, 125, 1.6, '#f4dc3a'); dot(c, 58, 122, 1.4, '#f4dc3a');
  c.restore();
};

/* ---- Wood grain: four planks, each its own colour, with grain, knots and nails ---- */
TILES.wood = function (c, P, N, NH, r) {
  var pal = ['#b27b45', '#9f6a3a', '#bf8a52', '#94613a', '#ad7440', '#a36d3c', '#b98349', '#8e5d36'], row;
  var starts = [0, 52, 96, 24], lens = [70, 80, 50, 88];
  function board(x, y, w, h, col, seed, knot) {
    var q = rng(seed), k, ph = q() * TAU;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = col; c.fillRect(x, y, w, h);
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,225,170,0.22)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,18,6,0.28)'); c.fillStyle = g; c.fillRect(x, y, w, h);
    for (k = 0; k < 11; k++) {                           // the grain
      var gy = y + 2.5 + (h - 5) * (k + q() * 0.7) / 11, amp = 0.8 + q() * 1.8, fr = 0.03 + q() * 0.04, p2 = q() * TAU;
      c.beginPath(); for (var gx = x - 2; gx <= x + w + 2; gx += 4) { var yy = gy + amp * Math.sin(gx * fr + p2) + 0.8 * Math.sin(gx * fr * 3.1 + ph); c[gx === x - 2 ? 'moveTo' : 'lineTo'](gx, yy); }
      c.lineWidth = k % 3 ? 0.9 : 1.5; c.strokeStyle = k % 4 === 0 ? 'rgba(255,225,170,0.3)' : 'rgba(70,35,12,' + (0.2 + q() * 0.2) + ')'; c.stroke();
    }
    if (knot) {
      var kx = x + w * knot, ky = y + h * 0.5 + (q() - 0.5) * 6;
      [[15, 9.5, 0.2], [11, 7, 0.28], [7.5, 4.8, 0.36]].forEach(function (s) { c.beginPath(); c.ellipse(kx, ky, s[0], s[1], 0, 0, TAU); c.lineWidth = 1.2; c.strokeStyle = 'rgba(60,28,8,' + s[2] + ')'; c.stroke(); });
      c.beginPath(); c.ellipse(kx, ky, 5, 3.4, 0, 0, TAU); c.fillStyle = '#5a2e12'; c.fill(); c.lineWidth = 1.4; c.strokeStyle = '#2e1606'; c.stroke();
      c.beginPath(); c.ellipse(kx - 1, ky - 1, 2.2, 1.2, 0, 0, TAU); c.fillStyle = 'rgba(255,210,150,0.45)'; c.fill();
    }
    c.restore();
  }
  for (row = 0; row < 4; row++) {
    var y0 = row * 32, s0 = starts[row], l1 = lens[row], q = rng(row * 51 + 9), c1 = pick(q, pal), c2 = pick(q, pal);
    wrapX(N, function (d) { board(s0 + d, y0, l1, 32, c1, row * 7 + 1, row === 1 ? 0.45 : row === 3 ? 0.72 : 0); board(s0 + l1 + d, y0, N - l1, 32, c2, row * 7 + 2, row === 0 ? 0.6 : row === 2 ? 0.3 : 0); });
    // the seams between planks and the butt joints
    c.fillStyle = '#2e1a0c'; c.fillRect(0, y0 + 29.5, N, 2.5); c.fillStyle = 'rgba(255,225,170,0.55)'; c.fillRect(0, y0, N, 1.4);
    [s0, mod(s0 + l1, N)].forEach(function (jx, ji) {
      c.fillStyle = '#2e1a0c'; c.fillRect(jx - 1, y0, 2.2, 32); c.fillStyle = 'rgba(255,225,170,0.4)'; c.fillRect(jx + 1.2, y0 + 1.4, 1, 28);
      [y0 + 8, y0 + 22].forEach(function (ny) {              // nail heads, a little crooked
        [ji ? -6 : 6].forEach(function (off) {
          var nx = mod(jx + off, N);
          wrap(N, nx, ny, 5, function (px, py) {
            dot(c, px + 0.7, py + 1.2, 2.5, 'rgba(0,0,0,0.4)'); dot(c, px, py, 2.4, '#4a3a2c'); dot(c, px - 0.7, py - 0.7, 1, '#d6c6ae');
            c.beginPath(); c.moveTo(px - 3.5, py + 0.4); c.lineTo(px - 5.5, py + 0.8); c.moveTo(px + 3.4, py - 0.2); c.lineTo(px + 5.6, py - 0.6); c.lineWidth = 0.9; c.strokeStyle = 'rgba(50,25,8,0.5)'; c.stroke();
          });
        });
      });
    });
  }
};

/* ---- Swiss cheese: holes with a dark inside wall and a lit rim, and a glossy sweaty sheen ---- */
TILES.swiss = function (c, P, N, NH, r) {
  // pale and deeper patches in the cheese, and tiny pores
  each(12, function (i) { var x = r() * N, y = r() * N, br = N * (0.07 + r() * 0.08), sd = Math.floor(r() * 1e6);
    wrap(N, x, y, br * 1.4, function (px, py) { blobAt(c, px, py, br, rng(sd), i % 2 ? 'rgba(255,240,150,0.32)' : 'rgba(215,160,20,0.22)', 0.6); }); });
  each(70, function () { dot(c, r() * N, r() * N, 0.6 + r() * 0.8, 'rgba(190,130,10,0.3)'); });
  var holes = [[24, 28, 13, 11, 0.3], [92, 18, 7.5, 6.5, -0.4], [62, 70, 17, 14, 0.2], [112, 62, 9.5, 8, 0.6], [16, 100, 8, 7, 0], [84, 112, 13, 10.5, -0.2], [46, 8, 5, 4.2, 0.5], [124, 104, 4.5, 3.8, 0], [38, 54, 4.5, 4, 0], [104, 36, 4, 3.5, 0]];
  holes.forEach(function (h) {
    wrap(N, h[0], h[1], h[2] + 4, function (px, py) {
      var rx = h[2], ry = h[3], a = h[4];
      c.beginPath(); c.ellipse(px + 1.1, py + 1.5, rx + 0.4, ry + 0.4, a, 0, TAU); c.lineWidth = 2.2; c.strokeStyle = 'rgba(255,248,170,0.95)'; c.stroke();         // lit rim on the lower right
      c.save(); c.beginPath(); c.ellipse(px, py, rx, ry, a, 0, TAU); c.clip();
      c.fillStyle = '#8c5a06'; c.fillRect(px - rx - 2, py - ry - 2, rx * 2 + 4, ry * 2 + 4);                                                             // shadowed wall
      c.beginPath(); c.ellipse(px + rx * 0.3, py + ry * 0.34, rx * 0.82, ry * 0.8, a, 0, TAU); c.fillStyle = '#c8901a'; c.fill();                          // the far wall, lit
      c.beginPath(); c.ellipse(px + rx * 0.42, py + ry * 0.46, rx * 0.5, ry * 0.46, a, 0, TAU); c.fillStyle = '#e1b030'; c.fill();
      if (rx > 6) { c.beginPath(); c.ellipse(px + rx * 0.5, py + ry * 0.55, rx * 0.22, ry * 0.18, a, 0, TAU); c.fillStyle = 'rgba(255,240,150,0.6)'; c.fill(); }
      c.restore();
      c.beginPath(); c.ellipse(px, py, rx, ry, a, 0, TAU); c.lineWidth = 1.5; c.strokeStyle = '#7d4e04'; c.stroke();
    });
  });
  // sweat: glossy streaks and little beads
  c.lineCap = 'round';
  [[10, 52, 18, -0.4], [70, 40, 22, -0.3], [96, 92, 16, -0.5], [30, 82, 12, -0.4], [58, 110, 14, -0.3], [118, 20, 10, -0.4]].forEach(function (s) {
    wrap(N, s[0], s[1], 26, function (px, py) {
      c.beginPath(); c.moveTo(px, py); c.lineTo(px + s[2], py + s[2] * s[3]); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,235,0.45)'; c.stroke();
      c.beginPath(); c.moveTo(px + 1, py - 1.4); c.lineTo(px + s[2] * 0.5, py + s[2] * s[3] * 0.5 - 1.4); c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke();
    });
  });
  [[48, 38], [102, 82], [8, 14], [72, 100], [120, 48], [34, 118]].forEach(function (s) {
    wrap(N, s[0], s[1], 5, function (px, py) {
      dot(c, px + 0.6, py + 1.2, 2.4, 'rgba(150,100,0,0.35)'); dot(c, px, py, 2.2, 'rgba(255,248,190,0.8)'); dot(c, px - 0.7, py - 0.8, 0.9, '#ffffff');
    });
  });
};

/* ---- Cardboard box: flutes, a strip of packing tape with a torn end, a fragile stamp, scuffs ---- */
TILES.cardboard = function (c, P, N, NH, r) {
  var k, x;
  for (x = 0; x < N; x += 4) { c.fillStyle = 'rgba(255,235,190,0.2)'; c.fillRect(x, 0, 1.6, N); c.fillStyle = 'rgba(70,40,14,0.17)'; c.fillRect(x + 2, 0, 1.6, N); }      // the flutes show through
  each(190, function () { c.fillStyle = r() < 0.5 ? 'rgba(255,240,200,0.4)' : 'rgba(80,50,20,0.35)'; c.fillRect(r() * N, r() * N, 1.5, 1.2); });
  each(7, function (i) { var xx = r() * N, yy = r() * N, br = N * (0.05 + r() * 0.07), sd = Math.floor(r() * 1e6);
    wrap(N, xx, yy, br * 1.4, function (px, py) { blobAt(c, px, py, br, rng(sd), i % 2 ? 'rgba(230,200,150,0.3)' : 'rgba(90,55,20,0.18)', 0.6); }); });
  // packing tape: a clear tan strip with a clean cut at one end and a ragged tear at the other
  var ty = 46, th = 22, x0 = 20, x1 = 112;
  c.fillStyle = 'rgba(60,30,10,0.3)'; c.fillRect(x0 + 1, ty + 2.5, x1 - x0, th);
  c.beginPath(); c.moveTo(x0, ty); c.lineTo(x1, ty);
  var zz = [[x1 + 2, ty + 4], [x1 - 3, ty + 8], [x1 + 3, ty + 12], [x1 - 2, ty + 16], [x1 + 2, ty + 20], [x1 - 1, ty + th]]; zz.forEach(function (p) { c.lineTo(p[0], p[1]); });
  c.lineTo(x0 - 3, ty + th); c.closePath(); c.fillStyle = 'rgba(224,190,110,0.9)'; c.fill();
  c.fillStyle = 'rgba(255,248,215,0.55)'; c.fillRect(x0, ty + 1, x1 - x0 - 2, 3);                                      // shine along the top
  c.fillStyle = 'rgba(120,80,20,0.3)'; c.fillRect(x0 - 3, ty + th - 4, x1 - x0, 4);
  c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(x0 + 8, ty + 6, 30, 2); c.fillRect(x0 + 50, ty + 9, 18, 1.6);
  c.beginPath(); c.moveTo(x0, ty); c.lineTo(x0 - 3, ty + th); c.lineWidth = 1.5; c.strokeStyle = 'rgba(110,70,20,0.6)'; c.stroke();
  c.beginPath(); c.moveTo(x1 + 1, ty - 1); zz.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineWidth = 1.3; c.strokeStyle = 'rgba(110,70,20,0.65)'; c.stroke();
  c.beginPath(); c.moveTo(x1 - 4, ty + 2); c.lineTo(x1 + 8, ty + 6); c.lineTo(x1 + 2, ty + 10); c.closePath(); c.fillStyle = 'rgba(225,195,120,0.9)'; c.fill();           // the curled corner
  c.lineWidth = 1; c.strokeStyle = 'rgba(110,70,20,0.6)'; c.stroke();
  // the stamp: a wine glass and an up arrow in a box, printed in dark ink with a few dropouts
  c.save(); c.translate(0, 0);
  c.strokeStyle = 'rgba(48,26,10,0.82)'; c.fillStyle = 'rgba(48,26,10,0.82)'; c.lineWidth = 2.4; c.lineJoin = 'round'; c.lineCap = 'round';
  rrect(c, 12, 82, 104, 40, 4); c.stroke();
  // glass
  c.beginPath(); c.moveTo(24, 88); c.lineTo(46, 88); c.lineTo(41, 102); c.quadraticCurveTo(35, 108, 29, 102); c.closePath(); c.stroke();
  c.beginPath(); c.moveTo(35, 106); c.lineTo(35, 114); c.moveTo(28, 115); c.lineTo(42, 115); c.stroke();
  c.beginPath(); c.moveTo(27, 93); c.lineTo(43, 93); c.lineWidth = 1.6; c.stroke();
  c.beginPath(); c.moveTo(38, 90); c.lineTo(34, 97); c.lineTo(38, 100); c.lineWidth = 1.4; c.stroke();          // a crack
  // two up arrows
  [[64, 0], [88, 0]].forEach(function (s) {
    c.lineWidth = 2.6; c.beginPath(); c.moveTo(s[0], 117); c.lineTo(s[0], 90); c.stroke();
    c.beginPath(); c.moveTo(s[0] - 8, 99); c.lineTo(s[0], 88); c.lineTo(s[0] + 8, 99); c.closePath(); c.fill();
  });
  c.restore();
  // paper worn off the print and scuffs
  c.fillStyle = 'rgba(190,150,95,0.7)'; each(26, function () { var xx = 12 + r() * 104, yy = 82 + r() * 40; c.fillRect(xx, yy, 1.4 + r() * 2.4, 1 + r() * 1.2); });
  c.lineCap = 'round';
  [[104, 14, 18, 2], [10, 126, 22, -3], [70, 8, 12, 1], [8, 36, 9, 4]].forEach(function (s) { wrap(N, s[0], s[1], 24, function (px, py) {
    c.beginPath(); c.moveTo(px, py); c.lineTo(px + s[2], py + s[3]); c.lineWidth = 3; c.strokeStyle = 'rgba(240,215,165,0.55)'; c.stroke();
    c.beginPath(); c.moveTo(px + 2, py + 3); c.lineTo(px + s[2] - 3, py + s[3] + 3); c.lineWidth = 1.2; c.strokeStyle = 'rgba(70,40,14,0.4)'; c.stroke(); }); });
  c.fillStyle = 'rgba(60,35,12,0.3)'; blobAt(c, 100, 26, 5, rng(5), 'rgba(60,35,12,0.32)', 0.6);
};

/* ---- Tire tread: chunky V knobs with sipes, a sidewall strip with wear ticks ---- */
TILES.treads = function (c, P, N, NH, r) {
  var row, side;
  // a little rubber texture
  each(260, function () { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.35)'; c.fillRect(r() * N, r() * N, 1.5, 1.5); });
  function knob(cx, cy, w, h, ang, id) {
    wrap(N, cx, cy, w, function (px, py) {
      c.save(); c.translate(px, py); c.rotate(ang);
      var hw = w / 2, hh = h / 2;
      c.fillStyle = '#000'; rrect(c, -hw + 1.4, -hh + 2.6, w, h, 4); c.fill();                                // groove shadow
      rrect(c, -hw, -hh, w, h, 4); var g = c.createLinearGradient(0, -hh, 0, hh); g.addColorStop(0, '#4a4c56'); g.addColorStop(0.55, '#33343c'); g.addColorStop(1, '#23242a'); c.fillStyle = g; c.fill();
      c.lineWidth = 1.6; c.strokeStyle = '#0a0a0c'; c.stroke();
      c.beginPath(); c.moveTo(-hw + 4, -hh + 1.6); c.lineTo(hw - 4, -hh + 1.6); c.lineWidth = 1.9; c.strokeStyle = 'rgba(215,220,240,0.7)'; c.stroke();         // lit top edge
      c.beginPath(); c.moveTo(-hw + 1.6, -hh + 4); c.lineTo(-hw + 1.6, hh - 4); c.lineWidth = 1.2; c.strokeStyle = 'rgba(160,165,190,0.3)'; c.stroke();
      [-0.25, 0.25].forEach(function (f) { c.beginPath(); c.moveTo(w * f - 2.5, -hh + 2); c.lineTo(w * f + 2.5, hh - 2); c.lineWidth = 1.5; c.strokeStyle = '#050506'; c.stroke(); });    // sipes
      if (id % 3 === 0) { c.fillStyle = 'rgba(190,195,210,0.17)'; c.fillRect(-hw + 3, -hh + 2.4, w * 0.45, h * 0.5); }                   // worn shiny spot
      if (id % 5 === 1) { c.fillStyle = 'rgba(190,195,210,0.13)'; c.fillRect(hw * 0.1, hh * 0.1, w * 0.4, h * 0.35); }
      c.restore();
    });
  }
  for (row = 0; row < 3; row++) for (side = 0; side < 2; side++) {
    var cy = 14 + row * 28 + (side ? 0 : 0), cx = 32 + side * 64 + (row % 2 ? 0 : 0);
    knob(cx - 2, cy, 48, 21, side ? 0.22 : -0.22, row * 2 + side);
  }
  // the sidewall: a lighter rubber strip with moulded ticks and a little arrow
  c.fillStyle = '#26272d'; c.fillRect(0, 96, N, 32);
  c.fillStyle = '#000'; c.fillRect(0, 94, N, 3); c.fillRect(0, 125, N, 3);
  c.fillStyle = 'rgba(170,175,200,0.4)'; c.fillRect(0, 97, N, 1.4);
  for (var x = 0; x < N; x += 8) {
    var tall = (x % 32 === 0);
    c.fillStyle = '#0b0b0d'; c.fillRect(x + 0.8, 101 + (tall ? 0 : 3), 2.4, tall ? 14 : 8);
    c.fillStyle = 'rgba(190,195,215,0.5)'; c.fillRect(x, 101 + (tall ? 0 : 3), 1, tall ? 14 : 8);
  }
  c.beginPath(); c.moveTo(60, 120); c.lineTo(70, 120); c.lineTo(65, 113.5); c.closePath(); c.fillStyle = '#0b0b0d'; c.fill();
  c.fillStyle = 'rgba(190,195,215,0.4)'; c.fillRect(0, 121, N, 1.2);
  // scuffs and a stuck pebble
  c.lineCap = 'round'; c.strokeStyle = 'rgba(200,205,220,0.28)'; c.lineWidth = 2;
  [[10, 108, 14], [92, 112, 18]].forEach(function (s) { c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(s[0] + s[2], s[1] - 3); c.stroke(); });
  dot(c, 112, 34, 3, '#8a7a66'); dot(c, 111, 33, 1.1, '#cbbba5');
};

/* ---- Seventies: nested rings in brown, orange, mustard and cream, a bold kitchen-wall swirl ---- */
TILES.seventies = function (c, P, N, NH, r) {
  var cols = ['#5a2e12', '#e0701c', '#e8b030', '#f6ebd0'];
  function rings(cx, cy, R0, step, order) {
    wrap(N, cx, cy, R0 + 3, function (px, py) {
      var k = 0;
      for (var rad = R0; rad > step * 0.8; rad -= step, k++) {
        c.beginPath(); c.arc(px, py, rad, 0, TAU); c.fillStyle = cols[(k + order) % 4]; c.fill();
        c.lineWidth = 1.2; c.strokeStyle = 'rgba(60,24,6,0.5)'; c.stroke();
        c.beginPath(); c.arc(px, py, rad - 1.8, Math.PI * 1.05, Math.PI * 1.55); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,245,215,0.55)'; c.stroke();        // soft inner highlight line
      }
    });
  }
  rings(0, 0, 48, 9, 0); rings(64, 64, 48, 9, 2);
  rings(64, 0, 20, 5, 1); rings(0, 64, 20, 5, 3);
  // a few tiny dots in the cream gaps
  [[32, 32], [96, 96], [96, 32], [32, 96]].forEach(function (s) { dot(c, s[0], s[1], 3, '#e0701c'); dot(c, s[0] - 0.8, s[1] - 0.8, 1.1, '#ffd9a0'); });
};

/* ---- Great wave: seigaiha scallops with ink lines, curls and foam ---- */
TILES.waves = function (c, P, N, NH, r) {
  var D = 32, R = 17, rows = 9, row, col, shades = ['#16427f', '#2a68b0', '#5a9ad4', '#f2f6fa'], ink = '#0a1f45';
  for (row = -1; row < rows + 8; row++) for (col = -1; col <= 4; col++) {
    var cx = col * D + (mod(row, 2) ? D / 2 : 0), cy = row * (D / 2) + 4;
    var tint = mod(row + mod(col, 4), 3) === 0 ? 1.12 : 1;
    [R, R * 0.78, R * 0.56, R * 0.34].forEach(function (rad, i) {
      c.beginPath(); c.arc(cx, cy, rad, 0, TAU); c.fillStyle = i === 3 ? '#e4eef8' : A.shade(shades[i === 0 ? 0 : i], tint); c.fill();
      c.lineWidth = 1.7; c.strokeStyle = ink; c.stroke();
    });
    // a lit crest on the upper left of each ring and a curl at the top
    c.beginPath(); c.arc(cx, cy, R * 0.67, Math.PI * 1.1, Math.PI * 1.55); c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    c.beginPath(); c.arc(cx, cy, R * 0.9, Math.PI * 1.2, Math.PI * 1.45); c.lineWidth = 1.2; c.strokeStyle = 'rgba(190,220,250,0.6)'; c.stroke();
    c.beginPath(); c.arc(cx + 1, cy - R * 0.9, 2.2, 3, 0.6 + TAU); c.lineWidth = 1.3; c.strokeStyle = ink; c.stroke();
  }
  // foam: white drops flicked off the crests
  var q = rng(2468);
  each(26, function () { var x = q() * N, y = q() * N, rr = 0.9 + q() * 1.5; dot(c, x, y, rr + 0.8, 'rgba(10,31,69,0.6)'); dot(c, x, y, rr, '#ffffff'); });
};

/* ---- Serape: woven blanket bands in red, yellow, teal, black and white with stepped diamonds and fringe ticks ---- */
TILES.serape = function (c, P, N, NH, r) {
  var bands = [['#c8281e', 8], ['#16181e', 3], ['#f6f1e4', 3], ['#16181e', 3], ['#f2c230', 11],    // 0..28
    ['#1fa39a', 36],                                                                                // the diamond band 28..64
    ['#f2c230', 11], ['#16181e', 3], ['#f6f1e4', 3], ['#16181e', 3], ['#c8281e', 8],                // 64..100
    ['#1fa39a', 5], ['#f6f1e4', 4], ['#16181e', 4], ['#c8281e', 15]], y = 0, i, x;                  // 100..128
  bands.forEach(function (b) { c.fillStyle = b[0]; c.fillRect(0, y, N, b[1] + 0.5); y += b[1]; });
  // the diamonds: stepped, like they are woven on a grid
  function diamond(cx, cy, R, col, out) {
    c.fillStyle = col;
    for (var dy = -R; dy <= R; dy += 3) { var hw = (R - Math.abs(dy)) ; c.fillRect(cx - hw, cy + dy - 1.5, hw * 2, 3); }
  }
  for (i = 0; i < 4; i++) {
    var cx = 16 + i * 32, cy = 46;
    diamond(cx, cy, 17, '#16181e'); diamond(cx, cy, 14, '#f2c230'); diamond(cx, cy, 9, '#c8281e'); diamond(cx, cy, 4, '#f6f1e4');
    wrapX(N, function () {});
  }
  // small teal triangles pointing in between the diamonds
  // zigzag lines through the two plain red bands
  [14, 85].forEach(function (zy) {
    c.beginPath(); for (x = -4; x <= N + 4; x += 8) c[x < 0 ? 'moveTo' : 'lineTo'](x, zy + ((x / 8) % 2 ? 2.4 : -2.4));
    c.lineWidth = 2.2; c.lineJoin = 'miter'; c.strokeStyle = '#f6f1e4'; c.stroke();
  });
  // fringe ticks: short tassel marks along two of the thin bands
  [[119, '#16181e'], [29.5, '#f6f1e4']].forEach(function (s) { for (x = 1; x < N; x += 4) { c.fillStyle = s[1]; c.fillRect(x, s[0], 1.7, 4); } });
  // woven texture: weft lines across, warp ticks down, and a soft dark edge on every band
  for (y = 0; y < N; y += 2) { c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(0, y + 1, N, 1); c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(0, y, N, 1); }
  for (x = 0; x < N; x += 3) { c.fillStyle = 'rgba(0,0,0,0.07)'; c.fillRect(x, 0, 1, N); }
  each(110, function () { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.25)'; c.fillRect(r() * N, r() * N, 2.5, 1.2); });
};

/* ---- Notebook doodle: ruled paper, red margin, punch holes, pen doodles and a coffee ring ---- */
TILES.notebook = function (c, P, N, NH, r) {
  var y, k;
  each(180, function () { c.fillStyle = 'rgba(120,110,80,0.14)'; c.fillRect(r() * N, r() * N, 1.5, 1.2); });
  for (y = 16; y < N + 1; y += 16) { c.fillStyle = 'rgba(70,120,200,0.8)'; c.fillRect(0, y - 0.8, N, 1.6); }                         // blue rules
  c.fillStyle = 'rgba(224,70,70,0.85)'; c.fillRect(24, 0, 1.8, N); c.fillRect(27, 0, 1, N);                                         // the red margin
  // punch holes with a shaded inside
  [8, 56, 104].forEach(function (hy) {
    dot(c, 10.8, hy + 1.6, 6.4, 'rgba(255,255,255,0.8)');
    dot(c, 10, hy, 6, '#8a8a92'); dot(c, 10.8, hy + 1, 5, '#4a4a54'); dot(c, 11.5, hy + 2, 3.6, 'rgba(200,190,160,0.5)');
    c.beginPath(); c.arc(10, hy, 6, 0, TAU); c.lineWidth = 1.2; c.strokeStyle = 'rgba(70,70,80,0.8)'; c.stroke();
  });
  // pen doodles
  c.lineCap = 'round'; c.lineJoin = 'round';
  function pen(col, fn) { c.save(); c.strokeStyle = col; c.lineWidth = 2; fn(); c.restore(); }
  // star
  pen('#1c2a6a', function () { var sx = 46, sy = 26; c.beginPath(); for (k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 4.4 : 11; c[k ? 'lineTo' : 'moveTo'](sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } c.closePath(); c.stroke(); c.fillStyle = 'rgba(255,214,60,0.75)'; c.fill(); });
  // rocket
  pen('#1c2a6a', function () {
    c.save(); c.translate(98, 28); c.rotate(0.6);
    c.beginPath(); c.moveTo(0, -17); c.quadraticCurveTo(8, -6, 6, 8); c.lineTo(-6, 8); c.quadraticCurveTo(-8, -6, 0, -17); c.closePath(); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-6, 4); c.lineTo(-12, 12); c.lineTo(-6, 9); c.moveTo(6, 4); c.lineTo(12, 12); c.lineTo(6, 9); c.stroke();
    c.beginPath(); c.arc(0, -4, 3, 0, TAU); c.fillStyle = '#7ab8f0'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-3, 9); c.quadraticCurveTo(0, 20, 3, 9); c.fillStyle = '#ff7a2a'; c.fill(); c.stroke();
    c.restore();
  });
  // smiley
  pen('#1c2a6a', function () { c.beginPath(); c.arc(50, 74, 11, 0, TAU); c.fillStyle = 'rgba(255,224,90,0.55)'; c.fill(); c.stroke(); dot(c, 46, 71, 1.5, '#1c2a6a'); dot(c, 55, 71, 1.5, '#1c2a6a'); c.beginPath(); c.arc(50.5, 75, 6, 0.3, Math.PI - 0.3); c.stroke(); });
  // spiral
  pen('#b02a50', function () { c.beginPath(); for (k = 0; k < 60; k++) { var a = k * 0.34, rr = 1 + k * 0.17; c[k ? 'lineTo' : 'moveTo'](100 + Math.cos(a) * rr, 80 + Math.sin(a) * rr); } c.stroke(); });
  // flame
  pen('#c0391b', function () { c.save(); c.translate(52, 112); c.beginPath(); c.moveTo(0, -12); c.bezierCurveTo(8, -6, 9, 4, 0, 8); c.bezierCurveTo(-9, 4, -7, -4, -2, -6); c.bezierCurveTo(-3, -2, 0, -2, 0, -12); c.fillStyle = 'rgba(255,150,40,0.8)'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(0, 7); c.bezierCurveTo(-4, 4, -3, 0, 0, -1); c.bezierCurveTo(3, 0, 4, 4, 0, 7); c.fillStyle = 'rgba(255,230,90,0.9)'; c.fill(); c.restore(); });
  // little scribbles: a heart and an underline wiggle
  pen('#1c2a6a', function () { c.beginPath(); c.moveTo(100, 116); c.bezierCurveTo(90, 106, 98, 100, 102, 108); c.bezierCurveTo(106, 100, 114, 106, 104, 116); c.lineTo(100, 120); c.closePath(); c.fillStyle = 'rgba(255,120,150,0.6)'; c.fill(); c.stroke();
    c.lineWidth = 1.5; c.beginPath(); c.moveTo(34, 98); c.bezierCurveTo(40, 94, 44, 102, 50, 98); c.bezierCurveTo(56, 94, 60, 102, 66, 98); c.stroke(); });
  // the coffee ring: a thicker rim on one side, with a few splashes
  c.save(); c.translate(80, 50);
  c.beginPath(); c.arc(0, 0, 19, 0, TAU); c.lineWidth = 3; c.strokeStyle = 'rgba(130,80,40,0.28)'; c.stroke();
  c.beginPath(); c.arc(0, 0, 19, 2.2, 5.2); c.lineWidth = 2.2; c.strokeStyle = 'rgba(110,60,25,0.45)'; c.stroke();
  c.beginPath(); c.arc(0, 0, 16.5, 3.4, 5.6); c.lineWidth = 1; c.strokeStyle = 'rgba(110,60,25,0.3)'; c.stroke();
  dot(c, 24, 6, 2, 'rgba(110,60,25,0.4)'); dot(c, -22, -9, 1.4, 'rgba(110,60,25,0.4)'); dot(c, 8, 24, 1.8, 'rgba(110,60,25,0.35)');
  c.restore();
};

/* ======================================================================= */
/* UNCOMMON                                                                */
/* ======================================================================= */

/* ---- Leopard: golden fur with broken rosettes round a darker tan centre ---- */
TILES.leopard = function (c, P, N, NH, r) {
  each(16, function (k) { var x = r() * N, y = r() * N, br = N * (0.08 + r() * 0.09), sd = Math.floor(r() * 1e6);
    wrap(N, x, y, br * 1.4, function (px, py) { blobAt(c, px, py, br, rng(sd), k % 2 ? 'rgba(150,92,22,0.2)' : 'rgba(255,226,150,0.26)', 0.6); }); });
  // fur: short strokes that mostly lean one way
  c.lineCap = 'round';
  each(520, function () { var x = r() * N, y = r() * N, a = 1.1 + (r() - 0.5) * 0.9, l = 2.5 + r() * 2.6;
    c.strokeStyle = r() < 0.5 ? 'rgba(255,232,165,0.4)' : 'rgba(110,64,12,0.3)'; c.lineWidth = 0.9;
    wrap(N, x, y, 6, function (px, py) { c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); c.stroke(); }); });
  // little solid spots between the rosettes
  each(16, function () { var x = r() * N, y = r() * N, br = 1.8 + r() * 2.6, sd = Math.floor(r() * 1e6);
    wrap(N, x, y, br * 2, function (px, py) { blobAt(c, px, py, br, rng(sd), '#2a1a0c', 0.5); blobAt(c, px - br * 0.2, py - br * 0.25, br * 0.4, rng(sd + 1), 'rgba(140,90,40,0.7)', 0.3); }); });
  var ros = [[20, 20, 15], [84, 12, 13], [52, 56, 16], [116, 48, 14], [20, 92, 15], [84, 98, 15], [52, 128, 14], [116, 124, 14]];
  ros.forEach(function (s, id) {
    wrap(N, s[0], s[1], s[2] + 8, function (px, py) {
      var R = s[2] * 0.72, n = 7, k, qq = rng(id * 71 + 3), a0 = qq() * TAU;          // same shape at every wrap copy
      c.beginPath(); c.ellipse(px, py, R * 0.95, R * 0.9, 0.3, 0, TAU); c.fillStyle = '#c98f36'; c.fill();                      // darker tan centre
      c.beginPath(); c.ellipse(px - R * 0.15, py - R * 0.2, R * 0.55, R * 0.45, 0.3, 0, TAU); c.fillStyle = 'rgba(240,190,100,0.55)'; c.fill();
      for (k = 0; k < n; k++) {
        var a = a0 + k * TAU / n + (qq() - 0.5) * 0.2, span = TAU / n * (0.5 + qq() * 0.32), rr = R * (0.95 + (qq() - 0.5) * 0.2), lw = 3.4 + qq() * 2.2;
        c.beginPath(); c.arc(px, py, rr + 1.6, a, a + span); c.lineWidth = lw + 2.2; c.strokeStyle = 'rgba(240,200,110,0.6)'; c.stroke();        // light halo of fur
        c.beginPath(); c.arc(px, py, rr, a, a + span); c.lineWidth = lw; c.strokeStyle = '#2a1a0c'; c.stroke();
        c.beginPath(); c.arc(px, py, rr - lw * 0.28, a + 0.08, a + span - 0.08); c.lineWidth = 1; c.strokeStyle = 'rgba(150,100,45,0.8)'; c.stroke();     // lit inner edge
      }
    });
  });
};

/* ---- Cherry blossom: pink five-petal flowers on a dark branch, indigo night, drifting petals ---- */
TILES.blossom = function (c, P, N, NH, r) {
  var k, x;
  each(6, function (j) { var bx = r() * N, by0 = r() * N, br = N * (0.14 + r() * 0.1), sd = Math.floor(r() * 1e6);
    wrap(N, bx, by0, br * 1.4, function (px, py) { blobAt(c, px, py, br, rng(sd), j % 2 ? 'rgba(80,90,190,0.2)' : 'rgba(110,60,150,0.16)', 0.5); }); });
  each(46, function () { dot(c, r() * N, r() * N, 0.5 + r() * 0.7, 'rgba(255,255,255,' + (0.3 + r() * 0.5) + ')'); });
  [[12, 14], [70, 30], [104, 118], [34, 122]].forEach(function (s) { wrap(N, s[0], s[1], 5, function (px, py) {
    c.fillStyle = 'rgba(255,250,220,0.85)'; c.fillRect(px - 0.7, py - 3, 1.4, 6); c.fillRect(px - 3, py - 0.7, 6, 1.4); }); });
  // the branch runs straight through the tile and joins up with the next one
  function by(xx) { return 82 + 11 * Math.sin(TAU * xx / N + 0.8) + 4 * Math.sin(TAU * 2 * xx / N); }
  function line(w, col, off) { c.beginPath(); for (var xx = -6; xx <= N + 6; xx += 3) c[xx < 0 ? 'moveTo' : 'lineTo'](xx, by(xx) + off); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  c.lineCap = 'round'; c.lineJoin = 'round';
  line(11.5, '#0d0709', 0); line(8.2, '#3a2318', 0); line(3.2, '#6b4a3a', -2.2); line(1.8, '#1c0f0a', 2.6);
  for (x = 0; x < N; x += 6) { c.beginPath(); c.moveTo(x, by(x) - 2 + (x % 12) * 0.3); c.lineTo(x + 2, by(x) + 1.5 + (x % 9) * 0.3); c.lineWidth = 0.9; c.strokeStyle = 'rgba(15,8,6,0.6)'; c.stroke(); }
  // twigs: [x on branch, control point, tip, width]
  var twigs = [[22, 36, 52, 38, 28, 6], [60, 52, 62, 70, 36, 5], [100, 100, 68, 112, 50, 5.5], [120, 120, 80, 126, 96, 4], [8, 8, 70, 10, 54, 4]];
  twigs.forEach(function (t) {
    var x0 = t[0], y0 = by(x0);
    [[t[5] + 3.4, '#0d0709'], [t[5], '#3a2318'], [t[5] * 0.35, '#6b4a3a']].forEach(function (s) {
      wrap(N, x0, y0, 70, function (px, py) { var dx = px - x0, dy = py - y0;
        c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(t[1] + dx, t[2] + dy, t[3] + dx, t[4] + dy); c.lineWidth = s[0] * 0.62; c.strokeStyle = s[1]; c.stroke(); });
    });
  });
  function petal(L, W) {
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-W * 0.9, -L * 0.25, -W * 1.05, -L * 0.85, -W * 0.2, -L); c.lineTo(0, -L * 0.88); c.lineTo(W * 0.2, -L);
    c.bezierCurveTo(W * 1.05, -L * 0.85, W * 0.9, -L * 0.25, 0, 0); c.closePath();
  }
  function flower(fx, fy, L, rot) {
    wrap(N, fx, fy, L * 2.2, function (px, py) {
      var gl = c.createRadialGradient(px, py, 1, px, py, L * 2.1); gl.addColorStop(0, 'rgba(255,170,210,0.45)'); gl.addColorStop(1, 'rgba(255,170,210,0)');
      c.fillStyle = gl; c.fillRect(px - L * 2.2, py - L * 2.2, L * 4.4, L * 4.4);
      c.save(); c.translate(px, py); c.rotate(rot);
      for (var j = 0; j < 5; j++) {
        c.save(); c.rotate(j * TAU / 5); petal(L, L * 0.62);
        var g = c.createRadialGradient(0, -L * 0.1, 1, 0, -L * 0.6, L); g.addColorStop(0, '#f2699c'); g.addColorStop(0.45, '#ff9ec2'); g.addColorStop(1, '#ffe6f0');
        c.fillStyle = g; c.fill(); c.lineWidth = 1.1; c.strokeStyle = '#b8466f'; c.stroke();
        c.beginPath(); c.moveTo(0, -L * 0.15); c.lineTo(0, -L * 0.6); c.lineWidth = 0.7; c.strokeStyle = 'rgba(190,60,110,0.55)'; c.stroke();
        c.beginPath(); c.moveTo(-L * 0.4, -L * 0.62); c.quadraticCurveTo(-L * 0.35, -L * 0.85, -L * 0.15, -L * 0.93); c.lineWidth = 1.1; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke();
        c.restore();
      }
      dot(c, 0, 0, L * 0.2, '#b0285a');
      for (var m = 0; m < 7; m++) { var a = m * TAU / 7 + 0.3, sx = Math.cos(a) * L * 0.42, sy = Math.sin(a) * L * 0.42; c.beginPath(); c.moveTo(0, 0); c.lineTo(sx, sy); c.lineWidth = 0.7; c.strokeStyle = '#ffd7e6'; c.stroke(); dot(c, sx, sy, 0.9, '#ffe27a'); }
      c.restore();
    });
  }
  flower(28, 36, 11, 0.2); flower(40, 54, 7.5, 1.0); flower(62, 70, 11, 0.5); flower(36, 76, 7, 2.2); flower(112, 50, 11, 1.2);
  flower(96, 96, 9, 0.9); flower(124, 96, 7.5, 0.1); flower(8, 54, 9.5, 0.6); flower(78, 98, 6.5, 0.4);
  // buds
  [[52, 40], [102, 62], [20, 62], [118, 108]].forEach(function (s) { wrap(N, s[0], s[1], 5, function (px, py) { dot(c, px, py, 3.2, '#b8466f'); dot(c, px - 0.3, py - 0.4, 2.4, '#ff8fb8'); dot(c, px - 0.9, py - 1, 0.9, '#ffe6f0'); }); });
  // petals drifting down
  [[14, 100, 0.5], [74, 122, 2.3], [92, 20, 4.1], [50, 8, 1.2], [120, 74, 3.2], [26, 66, 5.2], [100, 78, 0.1]].forEach(function (s) {
    wrap(N, s[0], s[1], 8, function (px, py) { c.save(); c.translate(px, py); c.rotate(s[2]); petal(5.2, 3.2); c.fillStyle = 'rgba(255,196,220,0.95)'; c.fill(); c.lineWidth = 0.8; c.strokeStyle = '#d6618c'; c.stroke(); c.restore(); });
  });
};

/* ---- Aloha: hibiscus and palm fronds on teal, like a shirt ---- */
TILES.aloha = function (c, P, N, NH, r) {
  each(8, function (j) { var x = r() * N, y = r() * N, br = N * (0.1 + r() * 0.1), sd = Math.floor(r() * 1e6);
    wrap(N, x, y, br * 1.4, function (px, py) { blobAt(c, px, py, br, rng(sd), j % 2 ? 'rgba(10,90,100,0.2)' : 'rgba(120,230,220,0.14)', 0.5); }); });
  c.lineCap = 'round'; c.lineJoin = 'round';
  function frond(x, y, a, b, len) {
    wrap(N, x, y, len * 1.1, function (px, py) {
      var steps = 12, st = len / steps, pts = [], ang, X = px, Y = py, i;
      for (i = 0; i <= steps; i++) { ang = a + b * i / steps; pts.push([X, Y, ang]); X += Math.cos(ang) * st; Y += Math.sin(ang) * st; }
      for (i = 1; i < steps; i++) {
        var p = pts[i], t = i / steps, L = (5 + 15 * Math.sin(Math.PI * Math.pow(t, 0.75))) * (len / 56);
        [-1, 1].forEach(function (sd) {
          var la = p[2] + sd * (1.05 - 0.25 * t), ex = p[0] + Math.cos(la) * L, ey = p[1] + Math.sin(la) * L + L * 0.25;
          c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo((p[0] + ex) / 2, (p[1] + ey) / 2, ex, ey);
          c.lineWidth = 5.4; c.strokeStyle = '#06402c'; c.stroke();
          c.lineWidth = 3.4; c.strokeStyle = (i + (sd > 0 ? 1 : 0)) % 2 ? '#15936a' : '#0e7a54'; c.stroke();
          c.lineWidth = 1; c.strokeStyle = 'rgba(160,255,200,0.6)'; c.beginPath(); c.moveTo(p[0], p[1] - 0.6); c.quadraticCurveTo((p[0] + ex) / 2, (p[1] + ey) / 2 - 0.6, ex, ey); c.stroke();
        });
      }
      c.beginPath(); pts.forEach(function (p, j) { c[j ? 'lineTo' : 'moveTo'](p[0], p[1]); }); c.lineWidth = 4.2; c.strokeStyle = '#06402c'; c.stroke(); c.lineWidth = 2.4; c.strokeStyle = '#3aa874'; c.stroke();
      c.lineWidth = 0.9; c.strokeStyle = '#b0f0c8'; c.beginPath(); pts.forEach(function (p, j) { c[j ? 'lineTo' : 'moveTo'](p[0], p[1] - 0.8); }); c.stroke();
    });
  }
  function leaf(x, y, a, L) {
    wrap(N, x, y, L + 4, function (px, py) {
      c.save(); c.translate(px, py); c.rotate(a);
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(L * 0.2, -L * 0.42, L * 0.8, -L * 0.36, L, 0); c.bezierCurveTo(L * 0.8, L * 0.36, L * 0.2, L * 0.42, 0, 0); c.closePath();
      c.fillStyle = '#12a06e'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#06402c'; c.stroke();
      c.beginPath(); c.moveTo(1, 0); c.lineTo(L * 0.95, 0); c.lineWidth = 1.2; c.strokeStyle = '#a8f0c8'; c.stroke();
      for (var j = 1; j < 5; j++) { var vx = L * j / 5.2; c.beginPath(); c.moveTo(vx, 0); c.lineTo(vx + L * 0.12, -L * 0.2 * (1 - j / 6)); c.moveTo(vx, 0); c.lineTo(vx + L * 0.12, L * 0.2 * (1 - j / 6)); c.lineWidth = 0.8; c.strokeStyle = 'rgba(190,255,215,0.65)'; c.stroke(); }
      c.restore();
    });
  }
  function hibiscus(x, y, R, rot) {
    wrap(N, x, y, R * 1.6, function (px, py) {
      c.save(); c.translate(px, py); c.rotate(rot);
      for (var j = 0; j < 5; j++) {
        c.save(); c.rotate(j * TAU / 5); c.scale(0.84, 1);
        c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-R * 0.85, -R * 0.15, -R * 1.15, -R * 0.95, -R * 0.2, -R * 1.08); c.bezierCurveTo(R * 0.1, -R * 1.2, R * 0.5, -R * 1.05, R * 0.8, -R * 0.7); c.bezierCurveTo(R * 1.0, -R * 0.35, R * 0.55, -R * 0.1, 0, 0); c.closePath();
        var g = c.createRadialGradient(0, -R * 0.1, 1, 0, -R * 0.55, R * 1.1); g.addColorStop(0, '#9c1060'); g.addColorStop(0.35, '#f0405e'); g.addColorStop(1, '#ff8a86');
        c.fillStyle = g; c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#6e0e2e'; c.stroke();
        c.beginPath(); c.moveTo(0, -R * 0.12); c.lineTo(-R * 0.1, -R * 0.62); c.moveTo(0, -R * 0.12); c.lineTo(R * 0.25, -R * 0.55); c.lineWidth = 0.9; c.strokeStyle = 'rgba(110,14,46,0.6)'; c.stroke();
        c.beginPath(); c.moveTo(-R * 0.62, -R * 0.82); c.quadraticCurveTo(-R * 0.45, -R * 1.0, -R * 0.2, -R * 1.0); c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,230,225,0.75)'; c.stroke();
        c.restore();
      }
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(R * 0.5, -R * 0.4, R * 1.05, -R * 0.95); c.lineWidth = 3.4; c.strokeStyle = '#6e0e2e'; c.stroke(); c.lineWidth = 1.6; c.strokeStyle = '#ffd23a'; c.stroke();
      [[0.78, -0.58], [0.95, -0.7], [1.05, -0.95], [0.9, -0.9], [1.0, -0.82]].forEach(function (s) { dot(c, R * s[0], R * s[1], 1.6, '#6e0e2e'); dot(c, R * s[0], R * s[1], 1.1, '#ffdf50'); });
      dot(c, 0, 0, R * 0.14, '#4a0a28');
      c.restore();
    });
  }
  leaf(22, 56, -0.9, 20); leaf(104, 120, 2.7, 18);
  frond(2, 118, -0.95, 1.1, 60); frond(74, 78, 2.45, -0.9, 56); frond(84, 30, -0.3, 1.0, 48);
  hibiscus(36, 40, 17, 0.3); hibiscus(104, 100, 15, 2.2); hibiscus(76, 16, 9, 1.1);
  // little white plumeria dots like the print on a shirt
  [[10, 12], [58, 64], [120, 44], [16, 84], [60, 118], [96, 60]].forEach(function (s) { wrap(N, s[0], s[1], 5, function (px, py) { for (var j = 0; j < 5; j++) dot(c, px + Math.cos(j * 1.256) * 2.2, py + Math.sin(j * 1.256) * 2.2, 1.7, 'rgba(255,255,240,0.9)'); dot(c, px, py, 1.1, '#ffd23a'); }); });
};

/* ---- Circuit board: green PCB, copper traces with 45 degree bends, pads, vias, chips, resistors and silkscreen ---- */
TILES.circuit = function (c, P, N, NH, r) {
  var i;
  each(16, function (j) { var x = r() * N, y = r() * N, br = N * (0.1 + r() * 0.1), sd = Math.floor(r() * 1e6);
    wrap(N, x, y, br * 1.4, function (px, py) { blobAt(c, px, py, br, rng(sd), j % 2 ? 'rgba(10,70,30,0.22)' : 'rgba(120,220,140,0.1)', 0.5); }); });
  each(240, function () { c.fillStyle = r() < 0.5 ? 'rgba(180,255,190,0.12)' : 'rgba(0,40,10,0.2)'; c.fillRect(r() * N, r() * N, 1.3, 1.3); });
  c.lineCap = 'round'; c.lineJoin = 'round';
  var segs = [], pads = [];
  function route(x, y, dir, turns, noPad) {       // dir 0..7 in 45 degree steps; turns is a list of [length, turn]
    var D = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]], pts = [[x, y]];
    turns.forEach(function (t) { var d = D[mod(dir, 8)], L = t[0]; x += d[0] * L; y += d[1] * L; pts.push([x, y]); dir += t[1]; });
    segs.push(pts); if (!noPad) pads.push([x, y, 3.4]); return pts;
  }
  // traces leaving the chips
  route(44, 18, 0, [[30, -1], [8, 1], [30, 1], [6, 0]]);
  route(44, 24, 0, [[10, 1], [8, -1], [20, -1], [8, 1], [20, 0]]);
  route(44, 30, 0, [[14, -1], [12, 1], [10, 1], [12, -1], [14, 0]]);
  route(44, 36, 0, [[8, 1], [14, 0], [8, 0], [6, 0]]);
  route(16, 18, 4, [[8, 1], [6, 0]]); route(16, 24, 4, [[6, -1], [8, 1], [8, 0]]); route(16, 30, 4, [[10, 1], [12, -1], [8, 0]]); route(16, 36, 4, [[8, -1], [10, 1], [8, 0]]);
  // the square chip at lower right has pins on every side
  for (i = 0; i < 4; i++) {
    var o = 86 + i * 6;
    route(o, 82, 6, [[8, i % 2 ? -1 : 1], [10, 0]]); route(o, 112, 2, [[8, i % 2 ? 1 : -1], [10, 0]]);
    route(82, o, 4, [[8, i % 2 ? 1 : -1], [12, 0]]); route(112, o, 0, [[8, i % 2 ? -1 : 1], [12, 0]]);
  }
  // a few free-running buses that wrap round the tile
  [62, 67, 72].forEach(function (y) { route(0, y, 0, [[30, 1], [10, -1], [40, -1], [10, 1], [38, 0]], true); });
  route(62, 0, 2, [[20, 1], [10, -1], [26, 0], [20, 0], [32, 0]], true);
  function drawTraces(w, col, ox, oy) {
    var dx, dy;
    for (dx = -1; dx <= 1; dx++) for (dy = -1; dy <= 1; dy++) segs.forEach(function (s) {
      c.beginPath(); s.forEach(function (p, j) { c[j ? 'lineTo' : 'moveTo'](p[0] + dx * N + ox, p[1] + dy * N + oy); }); c.lineWidth = w; c.strokeStyle = col; c.stroke(); });
  }
  drawTraces(4.6, 'rgba(0,40,10,0.55)', 0.8, 1.4);          // shadow under the copper
  drawTraces(3.4, '#c88a2c', 0, 0); drawTraces(2.4, '#f0b24a', 0, 0); drawTraces(0.9, '#ffe9a8', -0.3, -0.5);
  // pads and vias at the ends
  pads.forEach(function (p) { wrap(N, p[0], p[1], 6, function (px, py) {
    dot(c, px + 0.6, py + 1.2, 4.2, 'rgba(0,40,10,0.5)'); dot(c, px, py, 3.9, '#c88a2c'); dot(c, px - 0.3, py - 0.4, 3.1, '#f0b24a');
    dot(c, px, py, 1.5, '#0b2a14'); dot(c, px + 0.3, py + 0.4, 0.7, '#6aa070'); }); });
  // two mounting holes
  [[110, 22], [24, 106]].forEach(function (s) { wrap(N, s[0], s[1], 10, function (px, py) {
    dot(c, px + 0.8, py + 1.4, 7.2, 'rgba(0,40,10,0.5)'); dot(c, px, py, 7, '#c88a2c'); dot(c, px - 0.4, py - 0.5, 6.2, '#f0b24a'); dot(c, px, py, 3.6, '#0b2a14'); dot(c, px + 0.8, py + 1, 2.6, '#5a8a60');
    c.beginPath(); c.arc(px, py, 9.2, 0, TAU); c.lineWidth = 1; c.strokeStyle = 'rgba(245,245,235,0.85)'; c.stroke(); }); });
  // resistors with colour bands
  [[66, 52, 0], [106, 8, 1.5708], [10, 124, 0]].forEach(function (s) { wrap(N, s[0], s[1], 12, function (px, py) {
    c.save(); c.translate(px, py); c.rotate(s[2]);
    c.fillStyle = 'rgba(0,40,10,0.45)'; c.fillRect(-7, -2.4, 15, 6);
    dot(c, -8, 0, 2.4, '#d8d8d8'); dot(c, 8, 0, 2.4, '#d8d8d8');
    rrect(c, -7, -3, 14, 6, 2.5); c.fillStyle = '#d9c19a'; c.fill(); c.lineWidth = 0.9; c.strokeStyle = '#6a5a3a'; c.stroke();
    c.fillStyle = '#b3261e'; c.fillRect(-4, -3, 1.8, 6); c.fillStyle = '#7a2a8c'; c.fillRect(-1, -3, 1.8, 6); c.fillStyle = '#e0a020'; c.fillRect(3, -3, 1.8, 6);
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(-6, -2.4, 12, 1);
    c.restore(); }); });
  // a round capacitor
  wrap(N, 104, 64, 9, function (px, py) { dot(c, px + 0.8, py + 1.4, 6.6, 'rgba(0,40,10,0.5)'); dot(c, px, py, 6.3, '#262a30'); dot(c, px, py, 5.2, '#3a4048'); c.beginPath(); c.arc(px, py, 5.2, -0.7, 2.4); c.lineWidth = 3; c.strokeStyle = '#d8d8d8'; c.stroke(); dot(c, px - 1.6, py - 1.8, 1.2, 'rgba(255,255,255,0.45)'); });
  // chips: black body, grey pins, a notch and a few silkscreen marks
  function chipPins(x, y, w, h, nx, ny) {
    var j;
    for (j = 0; j < ny; j++) { var yy = y + (h / ny) * (j + 0.5); c.fillStyle = '#c5c9d0'; c.fillRect(x - 3.4, yy - 1.2, 3.6, 2.4); c.fillRect(x + w - 0.2, yy - 1.2, 3.6, 2.4); }
    for (j = 0; j < nx; j++) { var xx = x + (w / nx) * (j + 0.5); c.fillStyle = '#c5c9d0'; c.fillRect(xx - 1.2, y - 3.4, 2.4, 3.6); c.fillRect(xx - 1.2, y + h - 0.2, 2.4, 3.6); }
  }
  function chipBody(x, y, w, h) {
    c.fillStyle = 'rgba(0,30,8,0.5)'; c.fillRect(x + 1.2, y + 2, w, h);
    rrect(c, x, y, w, h, 2); var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#3a3e48'); g.addColorStop(1, '#14161c'); c.fillStyle = g; c.fill(); c.lineWidth = 1.4; c.strokeStyle = '#08090c'; c.stroke();
    c.fillStyle = 'rgba(200,210,235,0.5)'; c.fillRect(x + 3, y + 1, w - 6, 1.1);
  }
  wrap(N, 30, 27, 26, function (px, py) {
    c.strokeStyle = 'rgba(245,245,235,0.8)'; c.lineWidth = 1; c.strokeRect(px - 18, py - 15, 36, 30);
    chipPins(px - 14, py - 11, 28, 22, 0, 4); chipBody(px - 14, py - 11, 28, 22);
    dot(c, px - 10, py - 7, 1.6, '#0a0b0e'); dot(c, px - 10.4, py - 7.4, 0.8, 'rgba(255,255,255,0.4)');
    c.fillStyle = 'rgba(220,225,240,0.55)'; c.fillRect(px - 5, py - 2, 14, 1.3); c.fillRect(px - 5, py + 2, 9, 1.3); c.fillRect(px - 5, py + 6, 11, 1.3);
  });
  wrap(N, 97, 97, 24, function (px, py) {
    c.strokeStyle = 'rgba(245,245,235,0.8)'; c.lineWidth = 1; c.strokeRect(px - 16, py - 16, 32, 32);
    chipPins(px - 12, py - 12, 24, 24, 4, 4); chipBody(px - 12, py - 12, 24, 24);
    dot(c, px - 8, py - 8, 1.7, '#0a0b0e'); c.fillStyle = 'rgba(220,225,240,0.55)'; c.fillRect(px - 5, py - 3, 12, 1.3); c.fillRect(px - 5, py + 2, 8, 1.3);
  });
  // silkscreen: little plus signs, an arrow and a circle outline
  c.strokeStyle = 'rgba(245,245,235,0.85)'; c.lineWidth = 1;
  [[66, 40], [64, 90], [6, 76], [120, 118]].forEach(function (s) { wrap(N, s[0], s[1], 5, function (px, py) { c.beginPath(); c.moveTo(px - 3, py); c.lineTo(px + 3, py); c.moveTo(px, py - 3); c.lineTo(px, py + 3); c.stroke(); }); });
  wrap(N, 66, 108, 8, function (px, py) { c.beginPath(); c.arc(px, py, 5, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(px - 5, py); c.lineTo(px + 5, py); c.stroke(); });
  wrap(N, 120, 36, 9, function (px, py) { c.beginPath(); c.moveTo(px - 5, py); c.lineTo(px + 5, py); c.lineTo(px + 1, py - 4); c.moveTo(px + 5, py); c.lineTo(px + 1, py + 4); c.stroke(); });
};

/* ---- Memphis: 80s squiggles, triangles, dots and zigzags with fat black lines and confetti ---- */
TILES.memphis = function (c, P, N, NH, r) {
  var PINK = '#ff9fc4', MINT = '#8fe6c8', YEL = '#ffe27a', LIL = '#c8b4f0', INK = '#16181e', k;
  each(80, function () { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.6)'; c.fillRect(r() * N, r() * N, 1.8, 1.8); });
  c.lineCap = 'round'; c.lineJoin = 'round';
  function squig(x, y, len, amp, per, col, ang) {
    wrap(N, x, y, len + 10, function (px, py) {
      c.save(); c.translate(px, py); c.rotate(ang || 0);
      function path() { c.beginPath(); for (var t = 0; t <= len; t += 2) c[t ? 'lineTo' : 'moveTo'](t, Math.sin(t / per * TAU) * amp); }
      path(); c.lineWidth = 7.2; c.strokeStyle = INK; c.stroke(); path(); c.lineWidth = 3.4; c.strokeStyle = col; c.stroke();
      path(); c.lineWidth = 1; c.strokeStyle = 'rgba(255,255,255,0.65)'; c.save(); c.translate(0, -0.8); c.stroke(); c.restore();
      c.restore();
    });
  }
  function zig(x, y, teeth, w, amp, col, ang) {
    wrap(N, x, y, w + 10, function (px, py) {
      c.save(); c.translate(px, py); c.rotate(ang || 0);
      function path() { c.beginPath(); for (var t = 0; t <= teeth * 2; t++) c[t ? 'lineTo' : 'moveTo'](t * w / (teeth * 2), t % 2 ? amp : -amp); }
      c.lineJoin = 'miter'; path(); c.lineWidth = 7.2; c.strokeStyle = INK; c.stroke(); path(); c.lineWidth = 3.4; c.strokeStyle = col; c.stroke(); c.lineJoin = 'round';
      c.restore();
    });
  }
  function tri(x, y, s, rot, fill, shadow, dots) {
    wrap(N, x, y, s + 6, function (px, py) {
      c.save(); c.translate(px, py); c.rotate(rot);
      function path(o) { c.beginPath(); c.moveTo(o, -s * 0.9 + o); c.lineTo(s + o, s * 0.7 + o); c.lineTo(-s + o, s * 0.7 + o); c.closePath(); }
      if (shadow) { path(3.4); c.fillStyle = shadow; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); }
      path(0); c.fillStyle = fill; c.fill(); c.lineWidth = 3.4; c.strokeStyle = INK; c.stroke();
      if (dots) { for (var i = 0; i < 3; i++) for (var j = 0; j <= i; j++) dot(c, (j - i / 2) * 6.4, -s * 0.15 + i * 6, 1.5, INK); }
      c.beginPath(); c.moveTo(-s * 0.6, s * 0.45); c.lineTo(-s * 0.1, -s * 0.5); c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke();
      c.restore();
    });
  }
  squig(6, 18, 46, 5.5, 15, PINK, 0.12); squig(10, 114, 50, 5, 14, MINT, -0.1); squig(96, 6, 36, 4.5, 12, LIL, 0.6);
  zig(64, 66, 5, 44, 7.5, YEL, -0.08); zig(86, 118, 4, 36, 6.5, PINK, 0.35);
  tri(88, 30, 17, 0.3, MINT, PINK, false); tri(60, 98, 14, -0.5, YEL, null, true); tri(20, 46, 10, 2.6, LIL, null, false);
  // a dot grid
  wrap(N, 46, 44, 18, function (px, py) { for (var i = 0; i < 4; i++) for (var j = 0; j < 3; j++) dot(c, px - 9 + i * 6, py - 6 + j * 6, 2.1, INK); });
  // a lilac disc with a ring and a pink half disc with stripes
  wrap(N, 106, 74, 18, function (px, py) { dot(c, px + 3.4, py + 3.4, 12, YEL); c.beginPath(); c.arc(px + 3.4, py + 3.4, 12, 0, TAU); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    dot(c, px, py, 12, LIL); c.beginPath(); c.arc(px, py, 12, 0, TAU); c.lineWidth = 3.4; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(px, py, 6, 0, TAU); c.lineWidth = 2.6; c.stroke(); dot(c, px - 7, py - 7, 1.6, 'rgba(255,255,255,0.8)'); });
  wrap(N, 22, 82, 18, function (px, py) { c.beginPath(); c.arc(px, py, 14, Math.PI, TAU); c.closePath(); c.fillStyle = PINK; c.fill(); c.lineWidth = 3.4; c.strokeStyle = INK; c.stroke();
    c.lineWidth = 2; for (var i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(px + i * 5 - 3, py - 1); c.lineTo(px + i * 5 + 1, py - 11); c.stroke(); } });
  // plus signs and small rings
  [[32, 10], [120, 40], [100, 100], [70, 40], [10, 66]].forEach(function (s, i) { wrap(N, s[0], s[1], 8, function (px, py) { c.beginPath(); c.moveTo(px - 4.5, py); c.lineTo(px + 4.5, py); c.moveTo(px, py - 4.5); c.lineTo(px, py + 4.5); c.lineWidth = 3; c.strokeStyle = i % 2 ? INK : '#ff5a96'; c.stroke(); }); });
  [[118, 8], [44, 126], [76, 82]].forEach(function (s) { wrap(N, s[0], s[1], 8, function (px, py) { c.beginPath(); c.arc(px, py, 4.2, 0, TAU); c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke(); }); });
  // confetti
  var cols = [PINK, MINT, YEL, LIL, INK, '#ff5a96'], q = rng(8080);
  each(26, function (i) { var x = q() * N, y = q() * N, a = q() * TAU, col = cols[i % cols.length];
    wrap(N, x, y, 6, function (px, py) { c.save(); c.translate(px, py); c.rotate(a);
      if (i % 3 === 0) { c.fillStyle = col; c.fillRect(-3.4, -1.1, 6.8, 2.2); c.lineWidth = 1; c.strokeStyle = INK; c.strokeRect(-3.4, -1.1, 6.8, 2.2); }
      else { dot(c, 0, 0, 1.9, col); c.beginPath(); c.arc(0, 0, 1.9, 0, TAU); c.lineWidth = 1.1; c.strokeStyle = INK; c.stroke(); }
      c.restore(); }); });
};

/* ---- Sprinkles: glossy pink icing with drips, rainbow sprinkle capsules and sugar sparkle ---- */
TILES.sprinkles = function (c, P, N, NH, r) {
  each(14, function (j) { var x = r() * N, y = r() * N, br = N * (0.08 + r() * 0.1), sd = Math.floor(r() * 1e6);
    wrap(N, x, y, br * 1.4, function (px, py) { blobAt(c, px, py, br, rng(sd), j % 2 ? 'rgba(255,205,225,0.3)' : 'rgba(205,70,125,0.16)', 0.6); }); });
  // drips of thicker icing running down: wide where they leave the sheet, a neck, then a round drop
  [[16, -2, 46, 6], [50, 40, 58, 7], [90, 74, 34, 6], [114, 8, 52, 6.5]].forEach(function (d) {
    wrap(N, d[0], d[1], d[2] + 14, function (px, py) {
      var w = d[3], y0 = py, y1 = py + d[2];
      function body(ox, oy) { c.beginPath(); c.moveTo(px - w * 1.7 + ox, y0 + oy); c.bezierCurveTo(px - w * 0.5 + ox, y0 + d[2] * 0.15 + oy, px - w * 0.55 + ox, y1 - w * 1.4 + oy, px - w * 0.7 + ox, y1 - w * 0.5 + oy);
        c.arc(px + ox, y1 + oy, w * 0.82, Math.PI * 1.1, Math.PI * -0.1, true);
        c.bezierCurveTo(px + w * 0.55 + ox, y1 - w * 1.4 + oy, px + w * 0.5 + ox, y0 + d[2] * 0.15 + oy, px + w * 1.7 + ox, y0 + oy); }
      body(2.4, 2.6); c.lineTo(px + w * 1.7 + 2.4, y0 + 2.6); c.closePath(); c.fillStyle = 'rgba(160,30,90,0.32)'; c.fill();
      body(0, 0); c.lineTo(px + w * 1.7, y0 - 6); c.lineTo(px - w * 1.7, y0 - 6); c.closePath();
      var g = c.createLinearGradient(px - w, 0, px + w, 0); g.addColorStop(0, '#ffc4dc'); g.addColorStop(0.5, '#ff9cc4'); g.addColorStop(1, '#f272a4'); c.fillStyle = g; c.fill();
      body(0, 0); c.lineWidth = 1.3; c.strokeStyle = 'rgba(205,55,115,0.75)'; c.stroke();
      c.beginPath(); c.moveTo(px - w * 0.3, y0 + d[2] * 0.3); c.quadraticCurveTo(px - w * 0.4, y1 - w * 2, px - w * 0.5, y1 - w * 0.4); c.lineWidth = 1.8; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke();
      dot(c, px - w * 0.35, y1 + w * 0.1, 1.5, 'rgba(255,255,255,0.9)');
    });
  });
  // sugar capsules at all angles, none piled on another
  var cols = ['#ffffff', '#ffe14a', '#3ec9a7', '#4aa8ff', '#ff8a2a', '#9a5cf0', '#ff3f5a'], q = rng(5150), placed = [], tries = 0;
  while (placed.length < 44 && tries++ < 900) {
    var x = q() * N, y = q() * N, a = q() * Math.PI, ok = true;
    placed.forEach(function (p) { var dx = Math.abs(p[0] - x), dy = Math.abs(p[1] - y); dx = Math.min(dx, N - dx); dy = Math.min(dy, N - dy); if (dx * dx + dy * dy < 100) ok = false; });
    if (ok) placed.push([x, y, a]);
  }
  c.lineCap = 'round';
  placed.forEach(function (s, i) {
    var col = cols[i % cols.length], ca = Math.cos(s[2]) * 3.2, sa = Math.sin(s[2]) * 3.2;
    wrap(N, s[0], s[1], 8, function (px, py) {
      c.beginPath(); c.moveTo(px - ca + 1.1, py - sa + 1.7); c.lineTo(px + ca + 1.1, py + sa + 1.7); c.lineWidth = 3.8; c.strokeStyle = 'rgba(150,25,85,0.45)'; c.stroke();      // shadow on the icing
      c.beginPath(); c.moveTo(px - ca, py - sa); c.lineTo(px + ca, py + sa); c.lineWidth = 4.2; c.strokeStyle = A.shade(col, 0.62); c.stroke();                              // darker edge
      c.beginPath(); c.moveTo(px - ca, py - sa - 0.3); c.lineTo(px + ca, py + sa - 0.3); c.lineWidth = 3.1; c.strokeStyle = col; c.stroke();
      c.beginPath(); c.moveTo(px - ca * 0.6, py - sa * 0.6 - 1); c.lineTo(px + ca * 0.5, py + sa * 0.5 - 1); c.lineWidth = 0.9; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke();         // glint
    });
  });
  // tiny sugar crystals
  each(60, function () { var x = r() * N, y = r() * N; c.fillStyle = 'rgba(255,255,255,' + (0.5 + r() * 0.4) + ')'; c.fillRect(x, y, 1.3, 1.3); });
  // four-point sparkles
  [[30, 104], [74, 30], [112, 58], [6, 56]].forEach(function (s, id) {
    wrap(N, s[0], s[1], 8, function (px, py) { var L = 5.5 - id * 0.4;
      c.beginPath(); c.moveTo(px, py - L); c.quadraticCurveTo(px + 0.9, py - 0.9, px + L, py); c.quadraticCurveTo(px + 0.9, py + 0.9, px, py + L); c.quadraticCurveTo(px - 0.9, py + 0.9, px - L, py); c.quadraticCurveTo(px - 0.9, py - 0.9, px, py - L);
      c.fillStyle = '#ffffff'; c.fill(); dot(c, px, py, 1.2, 'rgba(255,255,255,0.8)'); });
  });
};

/* ---- Snakeskin: diamondback diamonds built out of rows of small keeled scales, each lit on its upper edge ---- */
TILES.snakeskin = function (c, P, N, NH, r) {
  var DW = 64, DH = N / 6, S = N / 24, row, col, i, j;
  // the diamond lattice: a scale belongs to the nearest diamond centre, and its rings decide the colour
  function ring(x, y) {
    var best = 9, rr = Math.round(y / DH), k, m;
    for (k = rr - 1; k <= rr + 1; k++) for (m = -1; m <= 3; m++) {
      var cx = m * DW + (mod(k, 2) ? DW / 2 : 0), cy = k * DH, d = Math.abs(x - cx) / (DW / 2) + Math.abs(y - cy) / DH;
      if (d < best) best = d;
    }
    return best;
  }
  var cols = [[0.3, '#d9b874'], [0.54, '#2e1c0c'], [0.7, '#e6d09a'], [9, '#8c6c3c']];
  c.fillStyle = '#7a5a30'; c.fillRect(0, 0, N, N);
  for (j = -1; j < 30; j++) for (i = -1; i < 25; i++) {
    var sx = (i + (mod(j, 2) ? 0.5 : 0)) * S + S / 2, sy = j * N / 28 + S / 2, d = ring(sx, sy), q = rng(mod(j, 28) * 29 + mod(i, 24) * 3 + 7), base, k;
    // rows are 0.82 S apart so the scales overlap like roof tiles
    for (k = 0; k < cols.length; k++) if (d < cols[k][0]) { base = cols[k][1]; break; }
    base = A.shade(base, 0.86 + q() * 0.3);
    c.beginPath(); c.moveTo(sx, sy - S * 0.62); c.quadraticCurveTo(sx + S * 0.62, sy - S * 0.2, sx + S * 0.5, sy + S * 0.4); c.quadraticCurveTo(sx, sy + S * 0.78, sx - S * 0.5, sy + S * 0.4); c.quadraticCurveTo(sx - S * 0.62, sy - S * 0.2, sx, sy - S * 0.62);
    c.fillStyle = base; c.fill(); c.lineWidth = 1.1; c.strokeStyle = 'rgba(20,10,0,0.7)'; c.stroke();
    c.beginPath(); c.moveTo(sx - S * 0.42, sy - S * 0.1); c.quadraticCurveTo(sx - S * 0.3, sy - S * 0.45, sx, sy - S * 0.52); c.lineWidth = 0.9; c.strokeStyle = 'rgba(255,240,200,0.5)'; c.stroke();     // lit upper edge
    c.beginPath(); c.moveTo(sx, sy - S * 0.2); c.lineTo(sx, sy + S * 0.45); c.lineWidth = 0.6; c.strokeStyle = 'rgba(20,10,0,0.3)'; c.stroke();                                              // the keel
  }
  // a few darker flecks along the diamond outlines
  each(70, function () { c.fillStyle = r() < 0.5 ? 'rgba(255,240,200,0.25)' : 'rgba(30,16,4,0.3)'; c.fillRect(r() * N, r() * N, 1.3, 1.3); });
};

/* ---- Sticker bomb: overlapping die-cut stickers, white borders, curling corners and shine ---- */
TILES.stickers = function (c, P, N, NH, r) {
  var INK = '#16181e';
  c.fillStyle = '#c9c7c0'; each(60, function () { c.fillRect(r() * N, r() * N, 1.5, 1.5); });
  c.lineJoin = 'round'; c.lineCap = 'round';
  // every sticker is designed in a box about 30 wide and scaled; path fns draw the die cut shape
  var shapes = {
    star: function () { c.beginPath(); for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 7 : 16; c[k ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr + 1); } c.closePath(); },
    smiley: function () { c.beginPath(); c.arc(0, 0, 15, 0, TAU); },
    bolt: function () { c.beginPath(); c.moveTo(4, -17); c.lineTo(-9, 3); c.lineTo(-1, 3); c.lineTo(-5, 17); c.lineTo(10, -4); c.lineTo(2, -4); c.lineTo(9, -17); c.closePath(); },
    heart: function () { c.beginPath(); c.moveTo(0, 15); c.bezierCurveTo(-20, 1, -14, -15, 0, -6); c.bezierCurveTo(14, -15, 20, 1, 0, 15); c.closePath(); },
    skull: function () { c.beginPath(); c.moveTo(-12, 0); c.bezierCurveTo(-14, -18, 14, -18, 12, 0); c.bezierCurveTo(12, 5, 9, 7, 7, 8); c.lineTo(7, 14); c.lineTo(-7, 14); c.lineTo(-7, 8); c.bezierCurveTo(-9, 7, -12, 5, -12, 0); c.closePath(); },
    flame: function () { c.beginPath(); c.moveTo(1, -17); c.bezierCurveTo(12, -8, 15, 4, 8, 12); c.bezierCurveTo(4, 17, -8, 16, -11, 8); c.bezierCurveTo(-14, 0, -8, -6, -5, -8); c.bezierCurveTo(-4, -3, -1, -3, 1, -17); c.closePath(); },
    cherries: function () { c.beginPath(); c.arc(-7, 8, 7.4, 0, TAU); c.moveTo(14.4, 10); c.arc(7, 10, 7.4, 0, TAU); c.moveTo(-6, 2); c.quadraticCurveTo(-4, -12, 2, -16); c.lineTo(10, -13); c.quadraticCurveTo(8, -8, 7, 3); c.closePath(); }
  };
  var details = {
    star: function () { c.fillStyle = '#ffd23a'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(-6, -2); c.lineTo(-2, -9); c.lineWidth = 1.8; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke(); dot(c, 0, 3, 1.2, '#e8a010'); },
    smiley: function () { c.fillStyle = '#ffe14a'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke(); dot(c, -5, -3, 2.1, INK); dot(c, 5, -3, 2.1, INK); c.beginPath(); c.arc(0, 1, 8, 0.3, Math.PI - 0.3); c.lineWidth = 2; c.stroke(); c.beginPath(); c.arc(-3, -6, 8, 3.6, 4.3); c.lineWidth = 1.8; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke(); },
    bolt: function () { c.fillStyle = '#ffd23a'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(3, -13); c.lineTo(-5, 0); c.lineWidth = 1.8; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke(); },
    heart: function () { c.fillStyle = '#ff3d6a'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(-9, -4); c.quadraticCurveTo(-8, -9, -3, -9); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke(); },
    skull: function () { c.fillStyle = '#f4f2ea'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke();
      c.beginPath(); c.ellipse(-5, -1, 3.4, 4, 0, 0, TAU); c.ellipse(5, -1, 3.4, 4, 0, 0, TAU); c.fillStyle = INK; c.fill();
      c.beginPath(); c.moveTo(0, 4); c.lineTo(-1.8, 7); c.lineTo(1.8, 7); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-3.5, 9); c.lineTo(-3.5, 14); c.moveTo(0, 9); c.lineTo(0, 14); c.moveTo(3.5, 9); c.lineTo(3.5, 14); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke(); },
    flame: function () { c.fillStyle = '#ff7a1a'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke();
      c.beginPath(); c.moveTo(0, 14); c.bezierCurveTo(-7, 12, -7, 3, -2, 0); c.bezierCurveTo(0, 4, 2, 4, 2, 0); c.bezierCurveTo(8, 4, 7, 12, 0, 14); c.fillStyle = '#ffd23a'; c.fill(); },
    cherries: function () { c.fillStyle = '#e0243a'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke();
      c.beginPath(); c.moveTo(-6, 2); c.quadraticCurveTo(-4, -12, 2, -16); c.moveTo(7, 3); c.quadraticCurveTo(8, -8, 10, -13); c.lineWidth = 1.8; c.strokeStyle = '#2a7a2a'; c.stroke();
      c.beginPath(); c.moveTo(2, -16); c.bezierCurveTo(8, -20, 14, -16, 15, -12); c.bezierCurveTo(10, -10, 5, -12, 2, -16); c.fillStyle = '#3aa83a'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
      dot(c, -9, 5, 1.6, 'rgba(255,255,255,0.8)'); dot(c, 5, 7, 1.6, 'rgba(255,255,255,0.8)'); }
  };
  var items = [['star', 22, 24, 0.3, 1.05, 0], ['smiley', 64, 16, -0.2, 0.95, 1], ['bolt', 106, 28, 0.25, 1.05, 0], ['heart', 26, 70, -0.3, 1.0, 1], ['skull', 72, 62, 0.1, 1.1, 0], ['flame', 112, 80, 0.1, 1.1, 1], ['cherries', 48, 108, 0.1, 1.05, 0], ['star', 98, 120, 0.5, 0.75, 1], ['smiley', 10, 110, 0.2, 0.7, 0]];
  items.forEach(function (it) {
    var sc = it[4] * 1.15;
    wrap(N, it[1], it[2], 28, function (px, py) {
      c.save(); c.translate(px, py); c.rotate(it[3]); c.scale(sc, sc);
      shapes[it[0]](); c.save(); c.translate(1.2, 1.8); c.lineWidth = 9; c.strokeStyle = 'rgba(0,0,0,0.3)'; c.stroke(); c.restore();      // sticker shadow on the one below
      shapes[it[0]](); c.lineWidth = 8; c.strokeStyle = '#ffffff'; c.stroke(); c.fillStyle = '#ffffff'; c.fill();                         // the white die-cut border
      details[it[0]]();
      // shine across one corner, and a peeling corner on some
      c.save(); shapes[it[0]](); c.clip(); c.beginPath(); c.moveTo(-18, -4); c.lineTo(-4, -18); c.lineTo(-1, -15); c.lineTo(-15, -1); c.closePath(); c.fillStyle = 'rgba(255,255,255,0.34)'; c.fill(); c.restore();
      if (it[5]) {
        c.beginPath(); c.moveTo(18, 4); c.lineTo(4, 18); c.lineTo(18, 18); c.closePath();
        var g = c.createLinearGradient(18, 4, 4, 18); g.addColorStop(0, '#d8d6cf'); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.fill(); c.lineWidth = 0.9; c.strokeStyle = 'rgba(0,0,0,0.35)'; c.stroke();
        c.beginPath(); c.moveTo(18, 4); c.lineTo(4, 18); c.lineWidth = 1.2; c.strokeStyle = 'rgba(0,0,0,0.25)'; c.stroke();
      }
      c.restore();
    });
  });
};

/* ---- Starfield: a deep navy sky with a milky way haze, stars of all sizes, twinkles and a few constellation lines ---- */
TILES.starfield = function (c, P, N, NH, r) {
  var i;
  // the milky way: a soft band across the tile from lower left to upper right (it wraps, so it carries on over the edge)
  for (i = 0; i <= 8; i++) {
    var t = i * N / 8;
    wrap(N, t, N - t, 44, function (px, py) {
      var g = c.createRadialGradient(px, py, 1, px, py, 38); g.addColorStop(0, 'rgba(120,130,230,0.32)'); g.addColorStop(0.6, 'rgba(90,80,190,0.14)'); g.addColorStop(1, 'rgba(60,50,150,0)');
      c.fillStyle = g; c.fillRect(px - 40, py - 40, 80, 80);
    });
  }
  [[24, 100, 'rgba(190,110,230,0.2)'], [100, 28, 'rgba(90,170,240,0.18)'], [64, 64, 'rgba(240,170,200,0.12)']].forEach(function (s) {
    wrap(N, s[0], s[1], 34, function (px, py) { var g = c.createRadialGradient(px, py, 1, px, py, 30); g.addColorStop(0, s[2]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(px - 32, py - 32, 64, 64); });
  });
  // dust: lots of tiny specks, more of them along the band
  each(200, function () { var t = r() * N, off = (r() + r() + r() - 1.5) * 22, x = mod(t + off * 0.7, N), y = mod(N - t + off * 0.7, N); c.fillStyle = 'rgba(210,220,255,' + (0.25 + r() * 0.4) + ')'; c.fillRect(x, y, 1, 1); });
  var tints = ['#ffffff', '#cfe0ff', '#fff2c0', '#ffd8c8'];
  each(70, function () { var x = r() * N, y = r() * N, rr = 0.5 + r() * 0.75; c.fillStyle = tints[Math.floor(r() * 4)]; c.globalAlpha = 0.55 + r() * 0.45; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); c.globalAlpha = 1; });
  function glow(x, y, rad, col) { var g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  // medium stars with a halo
  [[10, 70], [44, 100], [74, 10], [120, 20], [118, 66], [30, 8], [96, 74], [58, 126]].forEach(function (s, id) {
    wrap(N, s[0], s[1], 7, function (px, py) { glow(px, py, 6, 'rgba(200,220,255,0.55)'); dot(c, px, py, 1.5 + (id % 2) * 0.4, '#ffffff'); });
  });
  // four-point twinkles
  function twinkle(x, y, L, col) {
    wrap(N, x, y, L * 2, function (px, py) {
      glow(px, py, L * 1.7, 'rgba(190,210,255,0.55)');
      c.beginPath(); c.moveTo(px, py - L); c.quadraticCurveTo(px + L * 0.12, py - L * 0.12, px + L, py); c.quadraticCurveTo(px + L * 0.12, py + L * 0.12, px, py + L); c.quadraticCurveTo(px - L * 0.12, py + L * 0.12, px - L, py); c.quadraticCurveTo(px - L * 0.12, py - L * 0.12, px, py - L);
      c.fillStyle = col || '#ffffff'; c.fill();
      c.beginPath(); c.moveTo(px - L * 0.42, py - L * 0.42); c.lineTo(px + L * 0.42, py + L * 0.42); c.moveTo(px + L * 0.42, py - L * 0.42); c.lineTo(px - L * 0.42, py + L * 0.42); c.lineWidth = 0.8; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
      dot(c, px, py, L * 0.18, '#ffffff');
    });
  }
  twinkle(86, 44, 10); twinkle(22, 34, 8.5, '#fff6c8'); twinkle(104, 108, 9); twinkle(48, 70, 6.5); twinkle(8, 118, 7, '#d8e8ff');
  // two constellations: dots joined by faint lines
  c.lineCap = 'round'; c.lineJoin = 'round';
  function constel(pts, links) {
    c.beginPath(); links.forEach(function (l) { c.moveTo(pts[l[0]][0], pts[l[0]][1]); c.lineTo(pts[l[1]][0], pts[l[1]][1]); }); c.lineWidth = 0.9; c.strokeStyle = 'rgba(170,195,255,0.55)'; c.stroke();
    pts.forEach(function (p, j) { glow(p[0], p[1], 5, 'rgba(210,225,255,0.6)'); dot(c, p[0], p[1], 1.2 + (j % 3) * 0.35, '#ffffff'); });
  }
  constel([[58, 24], [70, 32], [64, 46], [78, 52], [92, 62]], [[0, 1], [1, 2], [2, 3], [3, 4], [1, 3]]);
  constel([[12, 90], [24, 84], [32, 98], [20, 108], [8, 104]], [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]);
  // a shooting star
  var g2 = c.createLinearGradient(122, 46, 94, 56); g2.addColorStop(0, 'rgba(255,255,255,0.95)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
  c.beginPath(); c.moveTo(122, 46); c.lineTo(94, 56); c.lineWidth = 1.6; c.strokeStyle = g2; c.stroke(); dot(c, 122, 46, 1.4, '#ffffff');
};

/* ---- Bubble wrap: a pale blue sheet with a grid of shiny bubbles, a few popped and wrinkled ---- */
TILES.bubblewrap = function (c, P, N, NH, r) {
  var row, col, R = 8.6, i;
  each(160, function () { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.28)' : 'rgba(70,120,170,0.12)'; c.fillRect(r() * N, r() * N, 1.5, 1.5); });
  // creases in the flat plastic between the bubbles
  c.lineCap = 'round'; c.lineJoin = 'round';
  [[4, 12, 30, 6], [70, 52, 34, -8], [20, 110, 28, 5], [96, 100, 26, -6], [60, 4, 22, 8]].forEach(function (s) { wrap(N, s[0], s[1], 36, function (px, py) {
    c.beginPath(); c.moveTo(px, py); c.lineTo(px + s[2] * 0.5, py + s[3]); c.lineTo(px + s[2], py + s[3] * 0.3); c.lineWidth = 1.3; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke();
    c.beginPath(); c.moveTo(px, py + 1.4); c.lineTo(px + s[2] * 0.5, py + s[3] + 1.4); c.lineTo(px + s[2], py + s[3] * 0.3 + 1.4); c.lineWidth = 1; c.strokeStyle = 'rgba(70,120,170,0.3)'; c.stroke(); }); });
  var popped = { '2,3': 1, '5,0': 1, '1,6': 1, '4,4': 1, '0,2': 1 };
  for (row = -1; row <= 8; row++) for (col = -1; col <= 6; col++) {
    var cx = col * N / 6 + (mod(row, 2) ? N / 12 : 0) + N / 12, cy = row * 16 + 8, key = mod(col, 6) + ',' + mod(row, 8);
    if (popped[key]) {
      // a popped bubble: flat, creased, with a torn rim
      c.beginPath(); for (i = 0; i < 12; i++) { var a = i * TAU / 12, rr = R * (0.92 + 0.12 * Math.sin(i * 5.1 + cx)); c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath();
      c.fillStyle = 'rgba(226,240,250,0.9)'; c.fill(); c.lineWidth = 1.3; c.strokeStyle = 'rgba(80,130,180,0.55)'; c.stroke();
      c.lineWidth = 1.1; c.lineCap = 'round';
      for (i = 0; i < 7; i++) { var wa = i * TAU / 7 + cx * 0.7, w1 = 2.2 + (i % 3), w2 = 5.2 + (i % 2) * 1.4;      // creases running out from the middle
        c.beginPath(); c.moveTo(cx + Math.cos(wa) * w1, cy + Math.sin(wa) * w1); c.lineTo(cx + Math.cos(wa + 0.3) * (w1 + w2 * 0.5), cy + Math.sin(wa + 0.3) * (w1 + w2 * 0.5)); c.lineTo(cx + Math.cos(wa - 0.1) * (w1 + w2), cy + Math.sin(wa - 0.1) * (w1 + w2));
        c.strokeStyle = i % 2 ? 'rgba(255,255,255,0.95)' : 'rgba(70,120,170,0.55)'; c.stroke(); }
      continue;
    }
    c.beginPath(); c.ellipse(cx + 1.4, cy + 2.2, R + 0.6, R, 0, 0, TAU); c.fillStyle = 'rgba(40,90,140,0.3)'; c.fill();                              // shadow on the sheet
    c.beginPath(); c.arc(cx, cy, R + 0.9, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill();                                                     // where the bubble meets the sheet
    var g = c.createRadialGradient(cx - 2.8, cy - 3.4, 0.5, cx, cy, R); g.addColorStop(0, 'rgba(255,255,255,0.72)'); g.addColorStop(0.5, 'rgba(210,235,250,0.55)'); g.addColorStop(1, 'rgba(90,150,200,0.55)');
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fillStyle = g; c.fill(); c.lineWidth = 1.5; c.strokeStyle = 'rgba(60,115,170,0.75)'; c.stroke();
    c.beginPath(); c.arc(cx, cy, R * 0.68, Math.PI * 1.05, Math.PI * 1.62); c.lineWidth = 1.9; c.strokeStyle = 'rgba(255,255,255,0.95)'; c.stroke();                // bright curved highlight
    dot(c, cx - R * 0.52, cy - R * 0.56, 1.2, '#ffffff');
    c.beginPath(); c.arc(cx, cy, R * 0.78, 0.2, 1.0); c.lineWidth = 1.1; c.strokeStyle = 'rgba(255,255,255,0.45)'; c.stroke();                           // a softer reflection low on the right
  }
};

/* ---- Roman mosaic: small square tesserae in terracotta, ochre, black and cream: a Greek key border and a rosette ---- */
TILES.mosaic = function (c, P, N, NH, r) {
  var G = 32, cell = N / G, mc = K.mk(G, G), m = mc.getContext('2d', { willReadFrequently: true }), x, y, k;
  var CR = '#efe2bf', BK = '#26201c', TC = '#b5502e', OC = '#e0a63e';
  // the design, one pixel per tessera
  m.fillStyle = CR; m.fillRect(0, 0, G, G);
  function band(y0, h, col) { m.fillStyle = col; m.fillRect(0, y0, G, h); }
  band(0, 2, TC); band(2, 1, BK); band(16, 1, BK); band(17, 2, TC); band(19, 1, BK); band(15, 1, CR);
  // the Greek key, two units across
  function hl(x0, x1, yy) { m.fillRect(x0 - 1, 4 + yy - 1, x1 - x0 + 2, 2); }
  function vl(xx, y0, y1) { m.fillRect(xx - 1, 4 + y0 - 1, 2, y1 - y0 + 2); }
  m.fillStyle = BK;
  [0, 16].forEach(function (ox) { vl(ox + 1, 1, 10); hl(ox + 1, ox + 13, 1); vl(ox + 13, 1, 7); hl(ox + 5, ox + 13, 7); vl(ox + 5, 4, 7); hl(ox + 5, ox + 9, 4); hl(ox + 1, ox + 17, 10); });
  // the rosette: worked out cell by cell so every tessera is a clean colour
  function cellFill(x0, y0, x1, y1, fn) { for (var yy = y0; yy <= y1; yy++) for (var xx = x0; xx <= x1; xx++) { var col = fn(xx + 0.5, yy + 0.5); if (col) { m.fillStyle = col; m.fillRect(mod(xx, G), yy, 1, 1); } } }
  cellFill(9, 20, 22, 31, function (x, y) {
    var dx = x - 16, dy = y - 26, dd = Math.sqrt(dx * dx + dy * dy), ang = Math.atan2(dy, dx), sec = Math.floor((ang + Math.PI) / (TAU / 8)) % 8;
    if (dd < 1.3) return BK; if (dd < 2.6) return OC; if (dd < 4.3) return sec % 2 ? TC : CR; if (dd < 5.5) return BK; return null; });
  [-1, 31].forEach(function (cx0) { cellFill(cx0 - 6, 20, cx0 + 6, 31, function (x, y) {
    var dd = Math.abs(x - (cx0 + 1)) + Math.abs(y - 26); if (dd <= 1.5) return OC; if (dd <= 3.5) return TC; if (dd <= 5.6) return BK; return null; }); });
  [[8, 22], [24, 22], [8, 30], [24, 30]].forEach(function (s, i) { m.fillStyle = i % 2 ? TC : OC; m.fillRect(s[0], s[1], 1, 1); });
  var d = m.getImageData(0, 0, G, G).data, pal = [[0xef, 0xe2, 0xbf, CR], [0x26, 0x20, 0x1c, BK], [0xb5, 0x50, 0x2e, TC], [0xe0, 0xa6, 0x3e, OC]];
  // grout, then the tesserae
  c.fillStyle = '#7c6c58'; c.fillRect(0, 0, N, N);
  var q = rng(6006);
  for (y = 0; y < G; y++) for (x = 0; x < G; x++) {
    var o = (y * G + x) * 4, best = 0, bd = 1e9;
    pal.forEach(function (p, pi) { var dd = Math.pow(p[0] - d[o], 2) + Math.pow(p[1] - d[o + 1], 2) + Math.pow(p[2] - d[o + 2], 2); if (dd < bd) { bd = dd; best = pi; } });
    var col = A.shade(pal[best][3], 0.88 + q() * 0.24), px = x * cell + 0.55, py = y * cell + 0.55, s = cell - 1.1, wob = q();
    c.fillStyle = col; c.fillRect(px, py, s, s);
    c.fillStyle = 'rgba(255,250,230,0.28)'; c.fillRect(px, py, s, 0.9); c.fillRect(px, py, 0.9, s);
    c.fillStyle = 'rgba(30,18,8,0.28)'; c.fillRect(px, py + s - 0.9, s, 0.9); c.fillRect(px + s - 0.9, py, 0.9, s);
    if (wob < 0.09) { var ex = wob < 0.045 ? px : px + s, ey = q() < 0.5 ? py : py + s; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + (ex === px ? 1.6 : -1.6), ey); c.lineTo(ex, ey + (ey === py ? 1.6 : -1.6)); c.closePath(); c.fillStyle = '#7c6c58'; c.fill(); }      // a chipped corner
  }
  // lost tesserae, showing the dark bedding, and a hairline crack
  [[9, 11], [10, 11], [24, 24], [3, 28], [26, 5]].forEach(function (s) { c.fillStyle = '#5a4a3c'; c.fillRect(s[0] * cell + 0.8, s[1] * cell + 0.8, cell - 1.6, cell - 1.6); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(s[0] * cell + 0.8, s[1] * cell + 0.8, cell - 1.6, 1.2); });
  c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 1; c.strokeStyle = 'rgba(40,28,20,0.75)';
  c.beginPath(); c.moveTo(70, 8); c.lineTo(74, 20); c.lineTo(69, 30); c.lineTo(75, 44); c.lineTo(72, 56); c.stroke();
  c.beginPath(); c.moveTo(20, 104); c.lineTo(30, 100); c.lineTo(36, 110); c.lineTo(46, 108); c.stroke();
};

})(typeof window !== 'undefined' ? window : globalThis);
