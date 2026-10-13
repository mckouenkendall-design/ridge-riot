/* Ridge Riot: the six places you can keep your bikes (the showroom screen).
   A scene is painted once into a picture when the screen is sized (A.garageScene), and the bits that move are
   painted over it every frame (A.garageLive: swinging lamps, flickering signs, drifting dust, sweeping lights).
   Everything is in screen pixels. g describes the room: { W, H, hz, rows } where hz is the y of the floor line
   and rows are the rows of display slots, back row first, each { y0, y1, n }.
   Levels: 0 shed, 1 workshop, 2 garage, 3 dealership, 4 showroom, 5 hall of fame. */
(function (root) {
'use strict';
var RR = root.RR, A = RR.Art, K = A.kit, TAU = K.TAU, rng = K.rng, OUT = K.OUT;

function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function lg(c, x0, y0, x1, y1, stops) { var g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
function rg(c, x, y, r0, r1, stops) { var g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
function line(c, x0, y0, x1, y1, w, col) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
function ell(c, x, y, rx, ry, col) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = col; c.fill(); }
function bolt(c, x, y, r) { ell(c, x, y, r, r, '#2a2d33'); ell(c, x - r * 0.25, y - r * 0.25, r * 0.45, r * 0.45, '#8a9098'); }
function vignette(c, W, H, a) { c.fillStyle = rg(c, W / 2, H * 0.55, Math.min(W, H) * 0.35, Math.max(W, H) * 0.72, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,' + a + ')']]); c.fillRect(0, 0, W, H); }
function box(c, x, y, w, h, fill, lw) { c.fillStyle = fill; c.fillRect(x, y, w, h); if (lw) { c.lineWidth = lw; c.strokeStyle = 'rgba(10,12,16,0.85)'; c.strokeRect(x, y, w, h); } }

/* ============================ 0. the shed ============================ */
function shed(c, g) {
  var W = g.W, H = g.H, hz = g.hz, r = rng(11), i, x, y;
  // corrugated tin wall: vertical ribs, each lit on the left and shaded on the right
  var rib = Math.max(11, W / 70);
  for (x = 0; x < W; x += rib) { c.fillStyle = lg(c, x, 0, x + rib, 0, [[0, '#95a2aa'], [0.45, '#7b8a92'], [1, '#56636b']]); c.fillRect(x, 0, rib + 1, hz); }
  // rust blooming from the bolts and the bottom edge
  for (i = 0; i < 26; i++) { x = r() * W; y = hz * (0.25 + r() * 0.75); var rr = 12 + r() * 34; c.fillStyle = rg(c, x, y, 0, rr, [[0, 'rgba(160,78,30,0.5)'], [1, 'rgba(160,78,30,0)']]); c.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  for (i = 0; i < 40; i++) { x = r() * W; var y0 = hz * (0.3 + r() * 0.5); c.fillStyle = 'rgba(110,52,22,0.35)'; c.fillRect(x, y0, 2 + r() * 2, 10 + r() * 40); }
  // roof underside and two wooden rails
  R(c, 0, 0, W, hz * 0.09, '#2c3136');
  for (x = 0; x < W; x += rib * 1.6) R(c, x, hz * 0.09, 2, hz * 0.04, '#1c2024');
  [0.38, 0.74].forEach(function (f) { var yy = hz * f; R(c, 0, yy, W, hz * 0.05, '#5a4129'); R(c, 0, yy, W, 2, '#8a6a46'); R(c, 0, yy + hz * 0.05 - 2, W, 2, '#33261a'); for (var bx = rib * 3; bx < W; bx += rib * 7) bolt(c, bx, yy + hz * 0.025, 2.6); });
  // a small window, bright with daylight
  var wx = W * 0.07, wy = hz * 0.16, ww = Math.min(W * 0.13, hz * 0.55), wh = ww * 0.8;
  box(c, wx - 5, wy - 5, ww + 10, wh + 10, '#4a3522', 2); c.fillStyle = lg(c, 0, wy, 0, wy + wh, [[0, '#cfeeff'], [1, '#ffffff']]); c.fillRect(wx, wy, ww, wh);
  R(c, wx + ww / 2 - 2, wy, 4, wh, '#4a3522'); R(c, wx, wy + wh / 2 - 2, ww, 4, '#4a3522');
  // tools hanging from the rail: a spade, a rake, a saw
  var hx = W * 0.8;
  line(c, hx, hz * 0.4, hx, hz * 0.7, 3, '#6b4a2a'); c.beginPath(); c.moveTo(hx - 9, hz * 0.7); c.lineTo(hx + 9, hz * 0.7); c.lineTo(hx + 6, hz * 0.86); c.lineTo(hx - 6, hz * 0.86); c.closePath(); c.fillStyle = '#9aa0a8'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#2a2d33'; c.stroke();
  hx = W * 0.86; line(c, hx, hz * 0.4, hx, hz * 0.68, 3, '#6b4a2a'); line(c, hx - 11, hz * 0.68, hx + 11, hz * 0.68, 3, '#8a9098'); for (i = -3; i <= 3; i++) line(c, hx + i * 3.6, hz * 0.68, hx + i * 3.6, hz * 0.74, 1.5, '#8a9098');
  hx = W * 0.64; c.beginPath(); c.moveTo(hx, hz * 0.45); c.lineTo(hx + 26, hz * 0.5); c.lineTo(hx + 26, hz * 0.58); c.lineTo(hx, hz * 0.52); c.closePath(); c.fillStyle = '#aab0b8'; c.fill(); c.lineWidth = 1.2; c.strokeStyle = '#2a2d33'; c.stroke(); R(c, hx - 9, hz * 0.45, 9, 10, '#7a4a22');
  // a spare tyre stack and a barrel along the foot of the wall
  [[W * 0.025, 0], [W * 0.025, 1], [W * 0.025, 2]].forEach(function (p) { var ty = hz - 12 - p[1] * 15; ell(c, p[0] + 26, ty + 5, 26, 10, '#16181c'); c.beginPath(); c.ellipse(p[0] + 26, ty, 26, 10, 0, 0, TAU); c.fillStyle = '#23262c'; c.fill(); c.beginPath(); c.ellipse(p[0] + 26, ty, 11, 4, 0, 0, TAU); c.fillStyle = '#0c0d10'; c.fill(); });
  var bx0 = W * 0.9, bh = hz * 0.34; box(c, bx0, hz - bh, 38, bh, '#a04a22', 1.5); R(c, bx0, hz - bh * 0.7, 38, 3, '#6a2e12'); R(c, bx0, hz - bh * 0.3, 38, 3, '#6a2e12'); R(c, bx0 + 5, hz - bh, 5, bh, 'rgba(255,200,150,0.25)');
  // the floor: packed dirt with oil stains, tyre ruts and pebbles
  c.fillStyle = lg(c, 0, hz, 0, H, [[0, '#4f4130'], [1, '#6e5b43']]); c.fillRect(0, hz, W, H - hz);
  for (i = 0; i < Math.min(2600, W * 3); i++) { c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(255,230,190,0.1)'; c.fillRect(r() * W, hz + r() * (H - hz), 2 + r() * 3, 1 + r() * 2); }
  for (i = 0; i < 5; i++) ell(c, W * (0.1 + r() * 0.8), hz + (H - hz) * (0.3 + r() * 0.6), 28 + r() * 40, 7 + r() * 8, 'rgba(10,8,6,0.35)');
  c.globalAlpha = 0.16; for (i = 0; i < 2; i++) { c.beginPath(); c.moveTo(W * (0.2 + i * 0.45), hz); c.quadraticCurveTo(W * (0.15 + i * 0.5), (hz + H) / 2, W * (0.26 + i * 0.4), H); c.lineWidth = 12; c.strokeStyle = '#201810'; c.stroke(); } c.globalAlpha = 1;
  for (i = 0; i < 24; i++) ell(c, r() * W, hz + (H - hz) * (0.1 + r() * 0.9), 2 + r() * 3, 1.5 + r() * 2, r() < 0.5 ? '#3a3024' : '#8b7c66');
  R(c, 0, hz - 1, W, 3, 'rgba(0,0,0,0.4)');
  vignette(c, W, H, 0.55);
}
function shedLive(c, g, t) {
  var W = g.W, H = g.H, hz = g.hz, i;
  // the bare bulb swings on its cord and lights the room
  var sw = Math.sin(t * 1.3) * 0.07, bx = W * 0.5 + Math.sin(sw) * hz * 0.25, by = hz * 0.09 + Math.cos(sw) * hz * 0.25;
  line(c, W * 0.5, hz * 0.09, bx, by, 2, '#15171d');
  c.save(); c.globalCompositeOperation = 'lighter';
  c.fillStyle = rg(c, bx, by, 0, Math.max(W, H) * 0.55, [[0, 'rgba(255,214,120,0.5)'], [0.25, 'rgba(255,190,90,0.2)'], [1, 'rgba(255,170,60,0)']]); c.fillRect(0, 0, W, H);
  // the shaft of daylight from the window, with dust drifting in it
  var wx = W * 0.07, ww = Math.min(W * 0.13, hz * 0.55), wy = hz * 0.16;
  c.fillStyle = lg(c, wx, wy, wx + ww * 1.8, hz + (H - hz) * 0.6, [[0, 'rgba(200,230,255,0.4)'], [1, 'rgba(200,230,255,0)']]);
  c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + ww, wy); c.lineTo(wx + ww * 3.1, H * 0.95); c.lineTo(wx + ww * 1.0, H * 0.95); c.closePath(); c.fill();
  for (i = 0; i < 22; i++) { var k = (t * (0.02 + (i % 5) * 0.007) + i * 0.137) % 1, px = wx + ww * (0.2 + (i * 0.37) % 1) + k * ww * 1.9 + Math.sin(t * 0.8 + i) * 6, py = wy + k * (H * 0.8 - wy); c.fillStyle = 'rgba(255,255,240,' + (0.35 * Math.sin(k * Math.PI)).toFixed(3) + ')'; c.fillRect(px, py, 2, 2); }
  c.restore();
  ell(c, bx, by + 4, 5, 5, '#fff3c0'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rg(c, bx, by + 4, 0, 26, [[0, 'rgba(255,230,150,0.9)'], [1, 'rgba(255,200,90,0)']]); c.fillRect(bx - 26, by - 22, 52, 52); c.restore();
}

/* ============================ 1. the workshop ============================ */
function workshop(c, g) {
  var W = g.W, H = g.H, hz = g.hz, r = rng(21), i, x, y;
  // brick above, painted board below
  var bw = Math.max(26, W / 34), bh = bw * 0.42, dado = hz * 0.62;
  R(c, 0, 0, W, hz, '#5b3a30');
  for (y = 0, i = 0; y < dado; y += bh, i++) for (x = -(i % 2) * bw / 2; x < W; x += bw) {
    var tone = r(); c.fillStyle = tone < 0.3 ? '#9a4f3a' : tone < 0.6 ? '#a65a42' : tone < 0.85 ? '#8c4634' : '#b5674c';
    c.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3); c.fillStyle = 'rgba(255,220,190,0.14)'; c.fillRect(x + 1.5, y + 1.5, bw - 3, 2);
    if (r() < 0.06) { c.fillStyle = 'rgba(20,10,8,0.3)'; c.fillRect(x + 1.5, y + 1.5, bw * (0.2 + r() * 0.3), bh - 3); }
  }
  c.fillStyle = lg(c, 0, 0, 0, dado, [[0, 'rgba(0,0,0,0.5)'], [0.35, 'rgba(0,0,0,0)']]); c.fillRect(0, 0, W, dado);
  R(c, 0, dado, W, hz - dado, '#2c5a56'); R(c, 0, dado, W, 4, '#d8c9a0'); for (x = 0; x < W; x += bw * 0.9) R(c, x, dado + 4, 2, hz - dado - 4, 'rgba(0,0,0,0.22)'); R(c, 0, dado + 4, W, 3, 'rgba(255,255,255,0.12)');
  // a pegboard of tools, painted outlines
  var px = W * 0.06, py = hz * 0.12, pw = Math.min(W * 0.26, hz * 1.2), ph = hz * 0.42;
  box(c, px, py, pw, ph, '#c9b38a', 2); c.fillStyle = 'rgba(60,40,20,0.5)'; for (x = px + 7; x < px + pw - 3; x += 12) for (y = py + 7; y < py + ph - 3; y += 12) c.fillRect(x, y, 2, 2);
  function spanner(sx, sy, ang, col) { c.save(); c.translate(sx, sy); c.rotate(ang); c.lineCap = 'round'; line(c, 0, 0, 0, ph * 0.5, 5, '#15171d'); line(c, 0, 0, 0, ph * 0.5, 3, col); ell(c, 0, 0, 6, 6, '#15171d'); ell(c, 0, 0, 4, 4, col); c.restore(); }
  spanner(px + pw * 0.14, py + ph * 0.12, 0.05, '#aeb6c0'); spanner(px + pw * 0.28, py + ph * 0.1, -0.04, '#aeb6c0');
  line(c, px + pw * 0.46, py + ph * 0.18, px + pw * 0.46, py + ph * 0.62, 4, '#15171d'); line(c, px + pw * 0.46, py + ph * 0.18, px + pw * 0.46, py + ph * 0.62, 2, '#8a5a2a'); box(c, px + pw * 0.46 - 9, py + ph * 0.12, 18, 9, '#9aa2ac', 1.5);
  line(c, px + pw * 0.66, py + ph * 0.2, px + pw * 0.7, py + ph * 0.7, 4, '#15171d'); line(c, px + pw * 0.66, py + ph * 0.2, px + pw * 0.7, py + ph * 0.7, 2, '#d0482a');
  c.beginPath(); c.moveTo(px + pw * 0.82, py + ph * 0.14); c.lineTo(px + pw * 0.95, py + ph * 0.22); c.lineTo(px + pw * 0.82, py + ph * 0.32); c.closePath(); c.fillStyle = '#c7ccd4'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#15171d'; c.stroke();
  // a calendar and a wall clock
  var cx = W * 0.8, cy = hz * 0.12; box(c, cx, cy, 36, 46, '#f1ecdc', 1.5); R(c, cx, cy, 36, 12, '#c4352a'); for (i = 0; i < 3; i++) for (var j = 0; j < 4; j++) R(c, cx + 5 + i * 10, cy + 17 + j * 7, 7, 4, '#a39a84');
  var ck = W * 0.9; ell(c, ck, cy + 24, 21, 21, '#15171d'); ell(c, ck, cy + 24, 18, 18, '#f1ecdc'); line(c, ck, cy + 24, ck, cy + 12, 2, '#15171d'); line(c, ck, cy + 24, ck + 9, cy + 28, 2, '#15171d');
  // shelves with paint cans and oil
  var sx = W * 0.5; R(c, sx, hz * 0.22, W * 0.16, 5, '#4a3322'); R(c, sx, hz * 0.45, W * 0.16, 5, '#4a3322');
  [0, 1, 2, 3].forEach(function (k) { var cc = ['#d0482a', '#2f6fd6', '#f2c230', '#3fbf6a'][k]; box(c, sx + 8 + k * 26, hz * 0.22 - 22, 20, 22, cc, 1.5); R(c, sx + 8 + k * 26, hz * 0.22 - 22, 20, 4, 'rgba(255,255,255,0.3)'); });
  for (i = 0; i < 4; i++) { box(c, sx + 10 + i * 24, hz * 0.45 - 26, 12, 26, i % 2 ? '#e8d6a0' : '#2a2d33', 1.5); R(c, sx + 13 + i * 24, hz * 0.45 - 32, 6, 6, '#c4352a'); }
  // the floor: boards with dark seams and oil
  var fy = hz; c.fillStyle = lg(c, 0, fy, 0, H, [[0, '#6b4e34'], [1, '#8a6842']]); c.fillRect(0, fy, W, H - fy);
  var pwid = Math.max(28, W / 22);
  for (x = 0; x < W; x += pwid) { c.fillStyle = 'rgba(' + (r() < 0.5 ? '0,0,0,0.12' : '255,220,170,0.08') + ')'; c.fillRect(x, fy, pwid, H - fy); line(c, x, fy, x - (x - W / 2) * 0.06, H, 2, 'rgba(25,14,6,0.55)'); }
  for (i = 0; i < 4; i++) ell(c, W * (0.12 + r() * 0.76), fy + (H - fy) * (0.35 + r() * 0.55), 30 + r() * 40, 6 + r() * 7, 'rgba(10,6,4,0.32)');
  R(c, 0, fy - 1, W, 3, 'rgba(0,0,0,0.35)');
  // the bench and the tool chest at the sides
  var tx = W * 0.01, tw = 54, tht = hz * 0.4; box(c, tx, hz - tht, tw, tht, '#c4352a', 2); for (i = 0; i < 4; i++) { R(c, tx + 4, hz - tht + 5 + i * (tht - 10) / 4, tw - 8, (tht - 10) / 4 - 3, '#a82a20'); R(c, tx + tw / 2 - 8, hz - tht + 11 + i * (tht - 10) / 4, 16, 3, '#e8dcc0'); } R(c, tx, hz - tht, tw, 4, 'rgba(255,255,255,0.25)');
  var bx = W * 0.9; box(c, bx - 40, hz - hz * 0.34, 90, 8, '#8a6a46', 2); R(c, bx - 36, hz - hz * 0.34 + 8, 5, hz * 0.34 - 8, '#3a2a1a'); R(c, bx + 40, hz - hz * 0.34 + 8, 5, hz * 0.34 - 8, '#3a2a1a');
  box(c, bx - 20, hz - hz * 0.34 - 14, 20, 14, '#5a6168', 1.5); box(c, bx - 6, hz - hz * 0.34 - 20, 5, 8, '#3c4249', 1);
  vignette(c, W, H, 0.38);
}
function workshopLive(c, g, t) {
  var W = g.W, H = g.H, hz = g.hz;
  // two strip lights on chains; one of them has a flicker
  [0.3, 0.7].forEach(function (f, i) {
    var x = W * f, y = hz * 0.07, fl = i ? (Math.sin(t * 31) * Math.sin(t * 7.3) > 0.82 ? 0.45 : 1) : 1;
    line(c, x - 30, 0, x - 30, y, 2, '#15171d'); line(c, x + 30, 0, x + 30, y, 2, '#15171d');
    box(c, x - 40, y, 80, 8, '#d9d9d2', 1.5);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fl;
    R(c, x - 36, y + 4, 72, 4, '#ffffff');
    c.fillStyle = lg(c, x, y + 8, x, H, [[0, 'rgba(235,250,255,0.28)'], [1, 'rgba(235,250,255,0)']]);
    c.beginPath(); c.moveTo(x - 38, y + 8); c.lineTo(x + 38, y + 8); c.lineTo(x + W * 0.17, H); c.lineTo(x - W * 0.17, H); c.closePath(); c.fill(); c.restore();
  });
}

/* ============================ 2. the garage ============================ */
function garage(c, g) {
  var W = g.W, H = g.H, hz = g.hz, r = rng(31), i, x, y;
  // painted walls: pale above, charcoal below with a red line between
  var dado = hz * 0.6;
  c.fillStyle = lg(c, 0, 0, 0, hz, [[0, '#cfd3d6'], [1, '#e8eaec']]); c.fillRect(0, 0, W, hz);
  R(c, 0, dado, W, hz - dado, '#3a3f47'); R(c, 0, dado, W, 5, '#c4352a'); R(c, 0, dado + 5, W, 2, 'rgba(255,255,255,0.18)');
  for (x = 0; x < W; x += W / 12) R(c, x, 0, 2, dado, 'rgba(0,0,0,0.05)');
  // the roller door in the middle: ribbed panels with a row of little windows
  var dw = Math.min(W * 0.34, hz * 1.6), dx = W / 2 - dw / 2, dy = hz * 0.34, dh = hz * 0.62;
  box(c, dx - 6, dy - 6, dw + 12, dh + 6, '#8a9098', 2); R(c, dx, dy, dw, dh, '#aab0b8');
  var ph = dh / 8; for (i = 0; i < 8; i++) { c.fillStyle = lg(c, 0, dy + i * ph, 0, dy + (i + 1) * ph, [[0, '#c9ced4'], [1, '#8c939b']]); c.fillRect(dx, dy + i * ph, dw, ph - 1); }
  for (i = 0; i < 5; i++) { R(c, dx + 8 + i * (dw - 16) / 5, dy + ph * 1.2, (dw - 16) / 5 - 6, ph * 0.5, '#2a3a4a'); R(c, dx + 10 + i * (dw - 16) / 5, dy + ph * 1.25, (dw - 16) / 5 - 10, ph * 0.12, 'rgba(160,210,255,0.5)'); }
  // the dark board the neon sign is mounted on
  var sh0 = Math.min(hz * 0.2, 46), bw = neonW('RIDGE RIOT', sh0) + 34;
  box(c, W / 2 - bw / 2, 0, bw, sh0 + 16, '#1a1d24', 2); R(c, W / 2 - bw / 2 + 3, 3, bw - 6, 2, 'rgba(255,255,255,0.12)'); bolt(c, W / 2 - bw / 2 + 8, 9, 2.6); bolt(c, W / 2 + bw / 2 - 8, 9, 2.6);
  // shelves with helmets, left
  var sx = W * 0.03, sw = Math.min(W * 0.2, dx - sx - 14);
  R(c, sx, hz * 0.2, sw, 5, '#4a4f58'); R(c, sx, hz * 0.45, sw, 5, '#4a4f58');
  var hc = ['#d0482a', '#f2c230', '#2f6fd6', '#ffffff', '#3fbf6a'];
  for (i = 0; i < 4; i++) { var hx2 = sx + 14 + i * (sw - 20) / 4; c.beginPath(); c.arc(hx2, hz * 0.2 - 2, 12, Math.PI, 0); c.lineTo(hx2 + 12, hz * 0.2 - 1); c.lineTo(hx2 - 12, hz * 0.2 - 1); c.fillStyle = hc[i]; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#15171d'; c.stroke(); R(c, hx2 + 1, hz * 0.2 - 12, 10, 6, '#15171d'); }
  for (i = 0; i < 3; i++) { var tx2 = sx + 16 + i * (sw - 20) / 3; R(c, tx2, hz * 0.45 - 4, 18, 4, '#8a6a2a'); c.beginPath(); c.moveTo(tx2 + 3, hz * 0.45 - 4); c.lineTo(tx2 + 15, hz * 0.45 - 4); c.lineTo(tx2 + 12, hz * 0.45 - 20); c.lineTo(tx2 + 6, hz * 0.45 - 20); c.closePath(); c.fillStyle = '#f2c230'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#15171d'; c.stroke(); }
  // tyres on a wall rack, right
  var rx = dx + dw + 24, rw = Math.min(W * 0.2, W - rx - 14);
  R(c, rx, hz * 0.3, rw, 4, '#4a4f58'); R(c, rx, hz * 0.58, rw, 4, '#4a4f58');
  for (i = 0; i < Math.floor(rw / 34); i++) { [0.3, 0.58].forEach(function (f) { var tx3 = rx + 17 + i * 34; ell(c, tx3, hz * f - 14, 14, 14, '#16181c'); ell(c, tx3, hz * f - 14, 6, 6, '#6b727c'); }); }
  // the floor: sealed concrete with a yellow safety line and a drain
  c.fillStyle = lg(c, 0, hz, 0, H, [[0, '#5d646c'], [1, '#79818a']]); c.fillRect(0, hz, W, H - hz);
  for (i = 0; i < 6; i++) { var fx = W * i / 6; line(c, fx, hz, W / 2 + (fx - W / 2) * 1.6, H, 1.5, 'rgba(20,24,30,0.3)'); }
  for (i = 1; i < 5; i++) { var fy2 = hz + (H - hz) * (i / 5) * (i / 5); line(c, 0, fy2, W, fy2, 1.5, 'rgba(20,24,30,0.22)'); }
  c.fillStyle = lg(c, 0, hz, 0, hz + (H - hz) * 0.5, [[0, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(0, hz, W, (H - hz) * 0.5);
  R(c, 0, hz + 4, W, 3, '#d9b32a'); R(c, 0, hz - 1, W, 5, 'rgba(0,0,0,0.3)');
  box(c, W * 0.5 - 22, H - (H - hz) * 0.2 - 8, 44, 12, '#2c3036', 1.5); for (i = 0; i < 5; i++) R(c, W * 0.5 - 18 + i * 8, H - (H - hz) * 0.2 - 5, 4, 6, '#101215');
  vignette(c, W, H, 0.3);
}
/* the neon sign: the title letters, drawn as glowing outlines */
function neonW(text, h) {
  var GL = RR.UI && RR.UI.GLYPH, w = 0, i; if (!GL) return h * 6;
  for (i = 0; i < text.length; i++) w += GL[text[i]] ? GL[text[i]][0] + 14 : 40;
  return (w - 14) * h / 100;
}
function neonWord(c, text, x, y, h, col, glow, a) {
  var GL = RR.UI && RR.UI.GLYPH; if (!GL) return;
  var gx = 0, i, sc = h / 100;
  c.save(); c.translate(x, y); c.scale(sc, sc); c.transform(1, 0, -0.19, 1, 0, 0);
  for (i = 0; i < text.length; i++) {
    var gl = GL[text[i]]; if (!gl) { gx += 40; continue; }
    c.save(); c.translate(gx, 0); var p = new root.Path2D(gl[1]);
    c.globalAlpha = 0.5 * a; c.lineWidth = 15; c.strokeStyle = glow; c.lineJoin = 'round'; c.stroke(p);
    c.globalAlpha = a; c.lineWidth = 6; c.strokeStyle = col; c.stroke(p); c.lineWidth = 2.2; c.strokeStyle = '#ffffff'; c.globalAlpha = a * 0.9; c.stroke(p);
    c.restore(); gx += gl[0] + 14;
  }
  c.restore(); return gx * sc;
}
function garageLive(c, g, t) {
  var W = g.W, H = g.H, hz = g.hz, i;
  // ceiling LED panels
  c.save(); c.globalCompositeOperation = 'lighter';
  for (i = 0; i < 4; i++) { var x = W * [0.1, 0.27, 0.73, 0.9][i], y = hz * 0.04; R(c, x - 36, y, 72, 8, 'rgba(230,245,255,0.95)'); c.fillStyle = lg(c, x, y + 8, x, H, [[0, 'rgba(225,240,255,0.2)'], [1, 'rgba(225,240,255,0)']]); c.beginPath(); c.moveTo(x - 36, y + 8); c.lineTo(x + 36, y + 8); c.lineTo(x + W * 0.13, H); c.lineTo(x - W * 0.13, H); c.closePath(); c.fill(); }
  c.restore();
  // the sign, with the odd flicker
  var fl = Math.sin(t * 47) * Math.sin(t * 5.1) > 0.9 ? 0.35 : 1, sh = Math.min(hz * 0.2, 46);
  var tw = (RR.UI && RR.UI.GLYPH) ? 0 : 0;
  c.save(); c.globalCompositeOperation = 'lighter';
  var wid = neonW('RIDGE RIOT', sh), sx = W * 0.5 - wid / 2; neonWord(c, 'RIDGE RIOT', sx, 6 + sh * 0.12, sh, '#ff7a6a', '#ff2a1a', fl);
  c.restore();
}

/* ============================ 3. the dealership ============================ */
function dealer(c, g) {
  var W = g.W, H = g.H, hz = g.hz, r = rng(41), i, x, y;
  R(c, 0, 0, W, hz, '#eef0f3');
  // the glass front: three big panes showing a bright street
  var gw = W / 3;
  for (i = 0; i < 3; i++) {
    var x0 = i * gw + 8, ww = gw - 16, y0 = hz * 0.08, hh = hz * 0.8;
    c.save(); c.beginPath(); c.rect(x0, y0, ww, hh); c.clip();
    c.fillStyle = lg(c, 0, y0, 0, y0 + hh, [[0, '#7fc4ff'], [0.7, '#d6efff'], [1, '#f6fbff']]); c.fillRect(x0, y0, ww, hh);
    c.fillStyle = 'rgba(255,255,255,0.6)'; for (var k = 0; k < 4; k++) ell(c, x0 + r() * ww, y0 + hh * (0.1 + r() * 0.3), 30 + r() * 40, 8 + r() * 8, 'rgba(255,255,255,0.7)');
    for (x = x0; x < x0 + ww; x += 40) { var bh = hh * (0.18 + r() * 0.3); R(c, x, y0 + hh * 0.9 - bh, 34, bh, 'rgba(112,138,168,0.55)'); for (var wy = 0; wy < bh - 8; wy += 9) R(c, x + 5, y0 + hh * 0.9 - bh + 4 + wy, 6, 4, 'rgba(235,245,255,0.6)'); }
    R(c, x0, y0 + hh * 0.9, ww, hh * 0.1, '#8a929c');
    c.fillStyle = lg(c, x0, y0, x0 + ww, y0 + hh, [[0, 'rgba(255,255,255,0.35)'], [0.4, 'rgba(255,255,255,0)'], [0.6, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(x0, y0, ww, hh);
    c.restore(); c.lineWidth = 5; c.strokeStyle = '#3a4048'; c.strokeRect(x0, y0, ww, hh);
  }
  // a blue stripe along the wall and a string of pennants above it
  R(c, 0, hz * 0.88, W, hz * 0.07, '#2f6fd6'); R(c, 0, hz * 0.88, W, 2, 'rgba(255,255,255,0.4)'); R(c, 0, hz * 0.95, W, hz * 0.05, '#c9ced6');
  c.beginPath(); c.moveTo(0, hz * 0.03); c.quadraticCurveTo(W / 2, hz * 0.12, W, hz * 0.03); c.lineWidth = 2; c.strokeStyle = '#3a4048'; c.stroke();
  var pc = ['#d0482a', '#f2c230', '#2f6fd6', '#3fbf6a', '#ffffff'];
  for (i = 0; i < 28; i++) { var f = (i + 0.5) / 28, px = W * f, py = hz * 0.03 + (hz * 0.09) * 4 * f * (1 - f) * 0.5 + 0; var yy = hz * 0.03 + 2 * hz * 0.045 * 4 * f * (1 - f) * 0.5 * 2; c.beginPath(); c.moveTo(px - 7, yy); c.lineTo(px + 7, yy); c.lineTo(px, yy + 17); c.closePath(); c.fillStyle = pc[i % 5]; c.fill(); c.lineWidth = 1; c.strokeStyle = 'rgba(10,12,16,0.7)'; c.stroke(); }
  // the floor: glossy tiles that mirror the room
  c.fillStyle = lg(c, 0, hz, 0, H, [[0, '#d7dce3'], [1, '#aeb6c0']]); c.fillRect(0, hz, W, H - hz);
  for (i = -8; i <= 18; i++) line(c, W * i / 10, hz, W / 2 + (W * i / 10 - W / 2) * 2.4, H, 1.5, 'rgba(60,70,84,0.28)');
  for (i = 1; i < 6; i++) { var fy = hz + (H - hz) * Math.pow(i / 6, 1.6); line(c, 0, fy, W, fy, 1.5, 'rgba(60,70,84,0.25)'); }
  c.fillStyle = lg(c, 0, hz, 0, hz + (H - hz) * 0.6, [[0, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(0, hz, W, (H - hz) * 0.6);
  R(c, 0, hz - 1, W, 4, 'rgba(0,0,0,0.25)');
  vignette(c, W, H, 0.18);
}
function dealerLive(c, g, t) {
  var W = g.W, H = g.H, hz = g.hz, i;
  c.save(); c.globalCompositeOperation = 'lighter';
  // spotlights on a track, each with a soft pool of light that breathes
  for (i = 0; i < 6; i++) {
    var x = W * (0.1 + i * 0.16), y = hz * 0.14; ell(c, x, y, 7, 5, '#fffbe0');
    var br = 0.85 + 0.15 * Math.sin(t * 0.9 + i * 1.7);
    c.fillStyle = lg(c, x, y, x, H, [[0, 'rgba(255,250,225,' + (0.3 * br).toFixed(3) + ')'], [1, 'rgba(255,250,225,0)']]);
    c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.lineTo(x + W * 0.1, H); c.lineTo(x - W * 0.1, H); c.closePath(); c.fill();
  }
  // a slow glint crossing the glass
  var gx = ((t * 0.07) % 1.4 - 0.2) * W; c.fillStyle = lg(c, gx, 0, gx + 80, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.2)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(gx, hz * 0.08, 80, hz * 0.8);
  c.restore();
}

/* ============================ 4. the showroom ============================ */
function showroom(c, g) {
  var W = g.W, H = g.H, hz = g.hz, r = rng(51), i, x, y;
  // black marble panels framed in gold
  c.fillStyle = lg(c, 0, 0, 0, hz, [[0, '#0c0d12'], [1, '#1b1c26']]); c.fillRect(0, 0, W, hz);
  var pw = W / 7;
  for (i = 0; i < 7; i++) {
    var x0 = i * pw + 6, ww = pw - 12; c.fillStyle = lg(c, x0, 0, x0 + ww, hz, [[0, '#1e2030'], [1, '#12131b']]); c.fillRect(x0, hz * 0.06, ww, hz * 0.9);
    c.save(); c.beginPath(); c.rect(x0, hz * 0.06, ww, hz * 0.9); c.clip();
    for (var k = 0; k < 3; k++) { c.beginPath(); var vx = x0 + r() * ww, vy = hz * 0.06; c.moveTo(vx, vy); c.bezierCurveTo(vx + 30 - r() * 60, vy + hz * 0.3, vx - 40 + r() * 80, vy + hz * 0.6, vx + 20 - r() * 40, hz * 0.96); c.lineWidth = 0.8 + r() * 1.2; c.strokeStyle = 'rgba(210,214,235,' + (0.1 + r() * 0.16).toFixed(2) + ')'; c.stroke(); }
    c.restore(); c.lineWidth = 2; c.strokeStyle = '#b8903a'; c.strokeRect(x0, hz * 0.06, ww, hz * 0.9); c.strokeStyle = 'rgba(255,225,140,0.35)'; c.strokeRect(x0 + 3, hz * 0.06 + 3, ww - 6, hz * 0.9 - 6);
  }
  R(c, 0, hz * 0.96, W, hz * 0.04, '#b8903a'); R(c, 0, hz * 0.96, W, 2, '#ffe9a8');
  // velvet curtains at both sides
  [[0, 1], [W, -1]].forEach(function (s) {
    var cw = Math.min(W * 0.1, 110);
    for (var k = 0; k < 7; k++) { var cx = s[0] + s[1] * k * cw / 7; c.fillStyle = lg(c, cx, 0, cx + s[1] * cw / 7, 0, k % 2 ? [[0, '#5a0f1c'], [1, '#8a1a2c']] : [[0, '#8a1a2c'], [1, '#3a0912']]); c.fillRect(Math.min(cx, cx + s[1] * cw / 7), 0, cw / 7 + 1, hz); }
    R(c, Math.min(s[0], s[0] + s[1] * cw), 0, cw, hz * 0.05, '#b8903a');
    c.fillStyle = rg(c, s[0] + s[1] * cw * 0.6, hz * 0.5, 0, hz * 0.6, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.45)']]); c.fillRect(Math.min(s[0], s[0] + s[1] * cw), 0, cw, hz);
  });
  // the floor: polished black marble, mirror bright near the wall
  c.fillStyle = lg(c, 0, hz, 0, H, [[0, '#14151d'], [1, '#07080c']]); c.fillRect(0, hz, W, H - hz);
  for (i = 0; i < 14; i++) { c.beginPath(); var vx2 = r() * W, vy2 = hz + r() * (H - hz) * 0.3; c.moveTo(vx2, vy2); c.bezierCurveTo(vx2 + 60, vy2 + 20, vx2 - 40, vy2 + 50, vx2 + 80 - r() * 160, H); c.lineWidth = 0.7 + r(); c.strokeStyle = 'rgba(200,205,230,' + (0.06 + r() * 0.1).toFixed(2) + ')'; c.stroke(); }
  for (i = 1; i < 6; i++) { var fy = hz + (H - hz) * Math.pow(i / 6, 1.6); line(c, 0, fy, W, fy, 1.2, 'rgba(184,144,58,0.22)'); }
  for (i = -6; i <= 16; i++) line(c, W * i / 10, hz, W / 2 + (W * i / 10 - W / 2) * 2.4, H, 1.2, 'rgba(184,144,58,0.18)');
  R(c, 0, hz - 1, W, 3, 'rgba(255,225,140,0.35)');
}
function showroomLive(c, g, t) {
  var W = g.W, H = g.H, hz = g.hz, i;
  // the gold sign on the back wall, breathing
  var sh = Math.min(hz * 0.2, 46), br = 0.85 + 0.15 * Math.sin(t * 1.4);
  c.save(); c.globalCompositeOperation = 'lighter';
  neonWord(c, 'RIDGE RIOT', W * 0.5 - neonW('RIDGE RIOT', sh) / 2, hz * 0.12, sh, '#ffe9a8', '#ffb520', br);
  // a spotlight on every display slot, from a rail overhead; the beams sway a little
  g.rows.forEach(function (row, ri) {
    var cw = (g.x1 - g.x0) / row.n;
    for (var k = 0; k < row.n; k++) {
      var cx = g.x0 + cw * (k + 0.5), sway = Math.sin(t * 0.7 + k * 0.9 + ri) * 6, top = hz * 0.05;
      ell(c, cx, top, 4, 3, '#fff6d0');
      c.fillStyle = lg(c, cx, top, cx + sway, row.y1, [[0, 'rgba(255,240,200,0.26)'], [1, 'rgba(255,240,200,0.03)']]);
      c.beginPath(); c.moveTo(cx - 3, top); c.lineTo(cx + 3, top); c.lineTo(cx + sway + cw * 0.34, row.y1); c.lineTo(cx + sway - cw * 0.34, row.y1); c.closePath(); c.fill();
    }
  });
  // glints running along the gold trim
  var gx = ((t * 0.12) % 1.3 - 0.15) * W; c.fillStyle = lg(c, gx, 0, gx + 140, 0, [[0, 'rgba(255,233,168,0)'], [0.5, 'rgba(255,233,168,0.5)'], [1, 'rgba(255,233,168,0)']]); c.fillRect(gx, hz * 0.96, 140, hz * 0.04);
  c.restore();
}


/* ============================ 5. the hall of fame ============================ */
/* A museum hall built for the whole collection: stone arches with a night sky behind them, banners
   hanging between the columns, and three stepped tiers of oak and brass for 24 bikes. */
function hall(c, g) {
  var W = g.W, H = g.H, hz = g.hz, r = rng(61), i, x, y;
  // the back wall: warm sandstone blocks
  c.fillStyle = lg(c, 0, 0, 0, hz, [[0, '#3b2f28'], [1, '#6b5644']]); c.fillRect(0, 0, W, hz);
  var bh = Math.max(10, hz / 16), bw = bh * 2.6;
  for (y = 0; y < hz; y += bh) { var off = (Math.round(y / bh) % 2) * bw / 2; for (x = -off; x < W; x += bw) { c.fillStyle = 'rgba(255,225,180,' + (0.03 + r() * 0.06).toFixed(3) + ')'; c.fillRect(x + 1, y + 1, bw - 2, bh - 2); } line(c, 0, y, W, y, 1, 'rgba(20,12,8,0.35)'); }
  // arched windows onto a night sky with stars and a moon
  var n = Math.max(3, Math.round(W / 190)), aw = W / n;
  for (i = 0; i < n; i++) {
    var cx = aw * (i + 0.5), ww = aw * 0.44, top = hz * 0.12, bot = hz * 0.8;
    c.save(); c.beginPath(); c.moveTo(cx - ww / 2, bot); c.lineTo(cx - ww / 2, top + ww / 2); c.arc(cx, top + ww / 2, ww / 2, Math.PI, 0); c.lineTo(cx + ww / 2, bot); c.closePath(); c.clip();
    c.fillStyle = lg(c, 0, top, 0, bot, [[0, '#0b1230'], [0.7, '#1f2f63'], [1, '#3d4f8a']]); c.fillRect(cx - ww, top, ww * 2, bot - top);
    for (var k = 0; k < 22; k++) ell(c, cx - ww / 2 + r() * ww, top + r() * (bot - top) * 0.8, 0.6 + r() * 1.1, 0.6 + r() * 1.1, 'rgba(255,255,255,' + (0.4 + r() * 0.6).toFixed(2) + ')');
    if (i === 1 % n) { ell(c, cx + ww * 0.15, top + ww * 0.4, ww * 0.13, ww * 0.13, '#fff6d8'); ell(c, cx + ww * 0.19, top + ww * 0.37, ww * 0.11, ww * 0.11, '#1f2f63'); }
    for (var mx = cx - ww / 2; mx < cx + ww / 2; mx += ww / 4) line(c, mx, top, mx, bot, 2, 'rgba(30,22,16,0.9)');
    line(c, cx - ww / 2, (top + bot) * 0.55, cx + ww / 2, (top + bot) * 0.55, 2, 'rgba(30,22,16,0.9)');
    c.restore();
    c.beginPath(); c.moveTo(cx - ww / 2, bot); c.lineTo(cx - ww / 2, top + ww / 2); c.arc(cx, top + ww / 2, ww / 2, Math.PI, 0); c.lineTo(cx + ww / 2, bot); c.lineWidth = 6; c.strokeStyle = '#a8865c'; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#2a1e16'; c.stroke();
    R(c, cx - ww / 2 - 6, bot, ww + 12, 6, '#a8865c');
  }
  // columns between the windows, with fluting and capitals
  for (i = 0; i <= n; i++) {
    var px = aw * i, pw = Math.min(26, aw * 0.12);
    c.fillStyle = lg(c, px - pw / 2, 0, px + pw / 2, 0, [[0, '#8a7258'], [0.4, '#d9c3a0'], [1, '#6b5644']]); c.fillRect(px - pw / 2, hz * 0.06, pw, hz * 0.94);
    for (var f = 1; f < 4; f++) line(c, px - pw / 2 + pw * f / 4, hz * 0.1, px - pw / 2 + pw * f / 4, hz * 0.96, 1, 'rgba(60,44,30,0.4)');
    R(c, px - pw * 0.8, hz * 0.04, pw * 1.6, hz * 0.04, '#c9b08a'); R(c, px - pw * 0.8, hz * 0.04, pw * 1.6, 2, '#f2e2c4');
  }
  // the frieze across the top
  R(c, 0, 0, W, hz * 0.045, '#2a1e16'); R(c, 0, hz * 0.045, W, 3, '#b8903a');
  // the floor: dark oak boards under three brass-edged tiers (the stands draw the edges)
  c.fillStyle = lg(c, 0, hz, 0, H, [[0, '#4a2f1c'], [1, '#2a190e']]); c.fillRect(0, hz, W, H - hz);
  for (i = -10; i <= 20; i++) line(c, W * i / 10, hz, W / 2 + (W * i / 10 - W / 2) * 2.2, H, 1.2, 'rgba(0,0,0,0.25)');
  g.rows.forEach(function (row, ri) { if (ri === 0) return; var ty = row.y0 - 4; c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, ty, W, 4); });
  // a red carpet runner down the middle
  c.fillStyle = lg(c, W * 0.44, 0, W * 0.56, 0, [[0, '#5a0f1c'], [0.5, '#9a2232'], [1, '#5a0f1c']]);
  c.beginPath(); c.moveTo(W * 0.46, hz); c.lineTo(W * 0.54, hz); c.lineTo(W * 0.62, H); c.lineTo(W * 0.38, H); c.closePath(); c.fill();
  line(c, W * 0.46, hz, W * 0.38, H, 2, '#d9b05a'); line(c, W * 0.54, hz, W * 0.62, H, 2, '#d9b05a');
  R(c, 0, hz - 1, W, 3, 'rgba(255,225,140,0.3)');
  vignette(c, W, H, 0.35);
}
function hallLive(c, g, t) {
  var W = g.W, H = g.H, hz = g.hz, n = Math.max(3, Math.round(W / 190)), aw = W / n, i;
  // banners in the bikes' colours hang between the columns and stir in a draught
  var cols = [['#f2c230', '#1d2233'], ['#d91e36', '#f5f1e6'], ['#2bb3c0', '#ff8a3d'], ['#3ccf6e', '#1b1d24'], ['#ff3d7f', '#1b1d24'], ['#2f6fd6', '#f5f1e6'], ['#e8b04a', '#3a2a1e']];
  for (i = 0; i <= n; i++) {
    var bx = aw * i, bw2 = Math.min(22, aw * 0.1), by = hz * 0.09, bl = hz * 0.42, sw = Math.sin(t * 1.1 + i * 1.7) * 3, cl = cols[i % cols.length];
    c.beginPath(); c.moveTo(bx - bw2, by); c.lineTo(bx + bw2, by); c.lineTo(bx + bw2 + sw, by + bl); c.lineTo(bx + sw, by + bl - bw2 * 0.8); c.lineTo(bx - bw2 + sw, by + bl); c.closePath();
    c.fillStyle = cl[0]; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#15171d'; c.stroke();
    c.beginPath(); c.moveTo(bx + sw * 0.5, by + bl * 0.2); c.lineTo(bx + sw * 0.6, by + bl * 0.75); c.lineWidth = Math.max(2, bw2 * 0.35); c.strokeStyle = cl[1]; c.stroke();
    R(c, bx - bw2 - 3, by - 3, bw2 * 2 + 6, 4, '#b8903a');
  }
  c.save(); c.globalCompositeOperation = 'lighter';
  // moonlight falling through the arches, drifting slowly
  for (i = 0; i < n; i++) {
    var cx = aw * (i + 0.5), ww = aw * 0.44, d = Math.sin(t * 0.2 + i) * 10;
    c.fillStyle = lg(c, cx, hz * 0.5, cx + 60, H, [[0, 'rgba(170,190,255,0.12)'], [1, 'rgba(170,190,255,0)']]);
    c.beginPath(); c.moveTo(cx - ww / 2, hz * 0.8); c.lineTo(cx + ww / 2, hz * 0.8); c.lineTo(cx + ww * 0.9 + d, H); c.lineTo(cx - ww * 0.1 + d, H); c.closePath(); c.fill();
  }
  // a warm lamp over every tier, breathing
  g.rows.forEach(function (row, ri) { var br = 0.8 + 0.2 * Math.sin(t * 0.8 + ri * 2); c.fillStyle = lg(c, 0, row.y0, 0, row.y1, [[0, 'rgba(255,215,140,0)'], [1, 'rgba(255,215,140,' + (0.12 * br).toFixed(3) + ')']]); c.fillRect(0, row.y0, W, row.y1 - row.y0); });
  // dust motes in the light
  for (i = 0; i < 30; i++) { var mx = (K.rng ? (i * 97.3 + t * (6 + i % 5)) % W : 0), my = hz * 0.2 + ((i * 53.1 + t * (3 + i % 3)) % (H - hz * 0.2)); ell(c, mx, my, 1, 1, 'rgba(255,240,210,0.25)'); }
  c.restore();
}

var SCENES = [shed, workshop, garage, dealer, showroom, hall], LIVES = [shedLive, workshopLive, garageLive, dealerLive, showroomLive, hallLive];
A.garageScene = function (c, g, level) { c.save(); SCENES[level](c, g); c.restore(); };
A.garageLive = function (c, g, level, t) { c.save(); LIVES[level](c, g, t); c.restore(); };

/* What a bike stands on, drawn in screen pixels: cx the middle, y the ground line, w the width the slot has. */
A.garageStand = function (c, level, cx, y, w, t) {
  var hw = w * 0.46;
  if (level === 0) {                       // a pallet of planks
    var ph = Math.max(5, w * 0.04);
    for (var i = 0; i < 4; i++) { var px = cx - hw + i * (hw * 2 / 4); box(c, px, y - ph, hw * 2 / 4 - 3, ph + 2, i % 2 ? '#a07a48' : '#8f6c3e', 1.2); }
    R(c, cx - hw, y + 2, hw * 2, 2, 'rgba(0,0,0,0.35)');
  } else if (level === 1) {                // a low wooden platform on a rubber mat
    ell(c, cx, y + 2, hw * 1.05, w * 0.045, 'rgba(0,0,0,0.35)');
    box(c, cx - hw, y - 5, hw * 2, 7, '#7a5a38', 1.2); R(c, cx - hw, y - 5, hw * 2, 2, 'rgba(255,230,170,0.3)');
  } else if (level === 2) {                // a rubber mat with a yellow edge
    ell(c, cx, y, hw * 1.05, w * 0.05, 'rgba(0,0,0,0.3)');
    c.beginPath(); c.ellipse(cx, y, hw, w * 0.04, 0, 0, TAU); c.fillStyle = '#2b2e34'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#d9b32a'; c.stroke();
  } else if (level === 3) {                // a white display plinth with a blue light strip
    box(c, cx - hw, y - 8, hw * 2, 10, '#f4f6f8', 1.2); R(c, cx - hw, y - 8, hw * 2, 3, '#ffffff'); R(c, cx - hw + 3, y - 2, hw * 2 - 6, 3, '#3a86ff');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = rg(c, cx, y, 0, hw, [[0, 'rgba(80,140,255,0.25)'], [1, 'rgba(80,140,255,0)']]); c.fillRect(cx - hw, y - 6, hw * 2, 14); c.restore();
  } else if (level === 5) {                // an oak tier step edged in brass, with a small brass plaque
    box(c, cx - hw, y - 6, hw * 2, 8, '#6b4528', 1.2); R(c, cx - hw, y - 6, hw * 2, 2, '#d9b05a'); R(c, cx - hw, y + 1, hw * 2, 1.5, '#8a6a2a');
    box(c, cx - Math.min(14, hw * 0.3), y - 4, Math.min(28, hw * 0.6), 4, '#d9b05a', 0.8);
  } else {                                 // a turntable: a round plinth with a ring of light that runs round
    var ry = Math.max(5, w * 0.06);
    c.beginPath(); c.ellipse(cx, y + 3, hw * 1.05, ry + 3, 0, 0, TAU); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fill();
    c.beginPath(); c.ellipse(cx, y + 2, hw, ry + 2, 0, 0, TAU); c.fillStyle = '#2a2c36'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#b8903a'; c.stroke();
    c.beginPath(); c.ellipse(cx, y - 2, hw, ry + 2, 0, 0, TAU); c.fillStyle = lg(c, cx - hw, 0, cx + hw, 0, [[0, '#4a4d5c'], [0.5, '#8a8ea0'], [1, '#3a3c48']]); c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#15171d'; c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter';
    for (var k = 0; k < 14; k++) { var a = k / 14 * TAU + t * 1.6, lx = cx + Math.cos(a) * hw * 0.92, ly = y - 2 + Math.sin(a) * (ry + 1) * 0.92, br = 0.35 + 0.65 * Math.max(0, Math.cos(a - t * 1.6 - t * 0)); ell(c, lx, ly, 2.2, 1.6, 'rgba(255,214,120,' + (0.35 + 0.65 * ((k + Math.floor(t * 6)) % 14 < 4 ? 1 : 0.2)).toFixed(2) + ')'); }
    c.restore();
  }
};
})(typeof window !== 'undefined' ? window : globalThis);
