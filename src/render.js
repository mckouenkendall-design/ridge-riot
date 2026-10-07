/* Ridge Riot: drawing the world.
   Sky and the far scenery are painted once per world onto hidden canvases and
   then slid past at different speeds (parallax). Ground, props, particles and
   the bike are drawn fresh every frame. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var A = RR.Art, TAU = Math.PI * 2, OUT = '#15171d';
var R = RR.Render = {};

function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
R.hash = hash;

/* ------------------------------------------------------------------ */
/* Themes                                                               */
/* ------------------------------------------------------------------ */
var TH = R.THEMES = [
  { id: 'dust', seed: 0,
    sky: [[0, '#4b2a7a'], [0.42, '#e0605a'], [0.78, '#ffb469'], [1, '#ffe2a6']],
    far: ['#e99273', '#c95f45', '#933828'],
    ground: ['#a2452f', '#86341f', '#6b2717'], crust: '#f3bd6c', crustHi: '#ffdf9b', strata: 'rgba(60,18,8,0.28)', speck: ['#bd5a3d', '#7a2d1b'],
    pit: ['#4a1a12', '#160606'], liquid: null, dust: '#e9b582', loop: ['#8a8f9c', '#f2c230'], ambient: 'motes', amb: '#ffe2a6',
    props: ['cactus', 'cactus', 'rock', 'bush', 'cactus2', 'rock', 'bones'], vig: 0.28 },
  { id: 'pine', seed: 1,
    sky: [[0, '#2f8fd0'], [0.55, '#8fd3e8'], [1, '#e3f7e2']],
    far: ['#93cdbf', '#55a283', '#2c7257'],
    ground: ['#6b4a35', '#55392a', '#3f2a20'], crust: '#74c24f', crustHi: '#a8e36e', strata: 'rgba(30,16,8,0.3)', speck: ['#7d5a43', '#4a3024'],
    pit: ['#2a3b33', '#0b1512'], liquid: ['#49b3e6', '#1c6fb5', 'rgba(255,255,255,0.55)'], dust: '#c8a47a', loop: ['#8a6a48', '#e8483a'], ambient: 'leaves', amb: '#f4ffd0',
    props: ['pine', 'pine', 'pine', 'stump', 'fern', 'mush', 'rock', 'fern'], vig: 0.2 },
  { id: 'race', seed: 5,
    sky: [[0, '#1a78b4'], [0.5, '#58c4d8'], [0.84, '#ffdcae'], [1, '#fff0d4']],
    far: ['#8ccdd0', '#58a2ab', '#35798a'],
    ground: ['#918c82', '#78736b', '#5f5a54'], crust: '#3a3d46', crustHi: '#f4f1e8', strata: 'rgba(0,0,0,0.16)', speck: ['#a59f94', '#5e5952'],
    pit: ['#2c2f38', '#0e0f14'], liquid: null, dust: '#d6d2c8', loop: ['#aab1bb', '#e2402f'], ambient: 'motes', amb: '#ffffff',
    props: ['tyres', 'cone', 'bale', 'flagpole', 'board', 'cone', 'palm', 'mast', 'tyres'], vig: 0.2 },
  { id: 'frost', seed: 2,
    sky: [[0, '#0d1648'], [0.45, '#2f55a8'], [0.8, '#8f9fe0'], [1, '#f1c4dc']],
    far: ['#aac5ee', '#7598d8', '#4767ad'],
    ground: ['#5a7fc4', '#4667ad', '#34508f'], crust: '#f6fbff', crustHi: '#ffffff', strata: 'rgba(16,28,70,0.3)', speck: ['#7c9bd6', '#3a5596'],
    pit: ['#1d3a78', '#070f2a'], liquid: ['#2f8fd6', '#123f8a', 'rgba(255,255,255,0.8)'], dust: '#eef6ff', loop: ['#7f8aa8', '#58c9f0'], ambient: 'snow', amb: '#ffffff',
    props: ['spine', 'spine', 'crystal', 'snowman', 'rock', 'spine', 'crystal'], vig: 0.3 },
  { id: 'cinder', seed: 3,
    sky: [[0, '#10050d'], [0.5, '#3d0f1a'], [0.85, '#99301a'], [1, '#e8662a']],
    far: ['#4f1c26', '#34131c', '#1f0b12'],
    ground: ['#3a2a33', '#2a1d25', '#1c1218'], crust: '#6a5560', crustHi: '#8d7783', strata: 'rgba(0,0,0,0.3)', speck: ['#4c3944', '#17090f'],
    pit: ['#3a0f0f', '#120304'], liquid: ['#ffd23f', '#ff5a1f', 'rgba(255,240,170,0.9)'], dust: '#8a7680', loop: ['#5a5560', '#ff7a1f'], ambient: 'embers', amb: '#ffb347',
    props: ['dead', 'basalt', 'vent', 'rock', 'basalt', 'dead', 'ember'], vig: 0.42 },
  { id: 'orbit', seed: 4,
    sky: [[0, '#03040b'], [0.6, '#0b1030'], [1, '#1c2350']],
    far: ['#8388a8', '#5d6283', '#3f435c'],
    ground: ['#787d9c', '#5f6483', '#494d69'], crust: '#d5d8ea', crustHi: '#ffffff', strata: 'rgba(20,22,44,0.3)', speck: ['#9296b3', '#474b66'],
    pit: ['#23263d', '#04050c'], liquid: null, dust: '#d5d8ea', loop: ['#aeb4c8', '#22e0c8'], ambient: 'stars', amb: '#ffffff',
    props: ['dish', 'flag', 'rock', 'gem', 'lamp', 'rock', 'lander'], vig: 0.34 }
];

/* ------------------------------------------------------------------ */
/* Background painting                                                  */
/* ------------------------------------------------------------------ */
var bg = { sky: null, layers: [], TW: 1400, world: -1, w: 0, h: 0, scale: 1 };
function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h)); return c; }

/* a ridge line that repeats exactly every TW pixels */
function ridgeFn(seed, TW, base, amp, freqs) {
  var r = rng(seed), ks = [], i;
  for (i = 0; i < freqs.length; i++) ks.push([freqs[i], r() * TAU, (0.5 + r() * 0.5) / (i + 1)]);
  var norm = 0; for (i = 0; i < ks.length; i++) norm += ks[i][2];
  return function (x) {
    var v = 0;
    for (var j = 0; j < ks.length; j++) v += Math.sin(TAU * ks[j][0] * x / TW + ks[j][1]) * ks[j][2];
    return base - amp * (v / norm);
  };
}
function fillRidge(c, TW, H, fn, col, step) {
  c.beginPath(); c.moveTo(0, H + 2);
  for (var x = 0; x <= TW; x += step || 4) c.lineTo(x, fn(x));
  c.lineTo(TW, H + 2); c.closePath(); c.fillStyle = col; c.fill();
}
function tri(c, x, y, w, h, col) { c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y - h); c.lineTo(x + w, y); c.closePath(); c.fillStyle = col; c.fill(); }
function pineSil(c, x, y, s, col, snow) {
  c.fillStyle = col; c.fillRect(x - s * 0.06, y - s * 0.2, s * 0.12, s * 0.25);
  for (var k = 0; k < 4; k++) {
    tri(c, x, y - s * (0.12 + k * 0.2), s * (0.34 - k * 0.065), s * 0.36, col);
    if (snow) tri(c, x, y - s * (0.32 + k * 0.2), s * (0.15 - k * 0.03), s * 0.16, snow);
  }
}
function wrapDraw(TW, x, w, fn) { fn(x); if (x < w) fn(x + TW); if (x > TW - w) fn(x - TW); }

function paintSky(c, w, h, wi) {
  var T = TH[wi], id = T.id, g = c.createLinearGradient(0, 0, 0, h), i, r = rng(77 + T.seed * 13);
  for (i = 0; i < T.sky.length; i++) g.addColorStop(T.sky[i][0], T.sky[i][1]);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  var u = h / 100, x, y;
  if (id === 'dust') {
    // low sun and long cloud streaks
    var sx = w * 0.7, sy = h * 0.6;
    var sg = c.createRadialGradient(sx, sy, 0, sx, sy, 60 * u);
    sg.addColorStop(0, 'rgba(255,240,200,0.9)'); sg.addColorStop(0.25, 'rgba(255,214,150,0.45)'); sg.addColorStop(1, 'rgba(255,190,120,0)');
    c.fillStyle = sg; c.fillRect(0, 0, w, h);
    c.beginPath(); c.arc(sx, sy, 15 * u, 0, TAU); c.fillStyle = '#fff3d0'; c.fill();
    for (i = 0; i < 9; i++) {
      x = r() * w; y = (18 + r() * 42) * u; var cw = (20 + r() * 40) * u;
      c.fillStyle = 'rgba(255,' + (150 + (r() * 60 | 0)) + ',150,' + (0.16 + r() * 0.2) + ')';
      c.beginPath(); c.ellipse(x, y, cw, 1.2 * u + r() * u, 0, 0, TAU); c.fill();
    }
  } else if (id === 'race') {
    // low sun over the far end of the circuit, puffy clouds and a hot-air balloon
    var rx = w * 0.8, ry = h * 0.6;
    var rg = c.createRadialGradient(rx, ry, 0, rx, ry, 55 * u);
    rg.addColorStop(0, 'rgba(255,250,220,0.95)'); rg.addColorStop(0.3, 'rgba(255,236,190,0.45)'); rg.addColorStop(1, 'rgba(255,230,180,0)');
    c.fillStyle = rg; c.fillRect(0, 0, w, h);
    c.beginPath(); c.arc(rx, ry, 8 * u, 0, TAU); c.fillStyle = '#fffbe6'; c.fill();
    for (i = 0; i < 6; i++) {
      x = r() * w; y = (10 + r() * 30) * u; var rs = (4 + r() * 5) * u;
      c.fillStyle = 'rgba(255,255,255,' + (0.6 + r() * 0.3) + ')';
      c.beginPath(); c.ellipse(x, y, rs * 2.4, rs * 0.7, 0, 0, TAU); c.ellipse(x - rs, y - rs * 0.4, rs, rs * 0.8, 0, 0, TAU); c.ellipse(x + rs * 0.7, y - rs * 0.6, rs * 1.2, rs, 0, 0, TAU); c.fill();
    }
    var bx = w * 0.26, by = h * 0.24, bs = 5.5 * u;
    c.save();
    c.beginPath(); c.moveTo(bx - bs, by); c.bezierCurveTo(bx - bs, by - bs * 1.45, bx + bs, by - bs * 1.45, bx + bs, by);
    c.bezierCurveTo(bx + bs * 0.9, by + bs * 0.9, bx + bs * 0.3, by + bs * 1.3, bx + bs * 0.22, by + bs * 1.6); c.lineTo(bx - bs * 0.22, by + bs * 1.6);
    c.bezierCurveTo(bx - bs * 0.3, by + bs * 1.3, bx - bs * 0.9, by + bs * 0.9, bx - bs, by); c.closePath();
    c.fillStyle = '#e2402f'; c.fill(); c.clip();
    c.fillStyle = '#f4f1e8'; c.fillRect(bx - bs * 0.62, by - bs * 2, bs * 0.4, bs * 4); c.fillRect(bx + bs * 0.22, by - bs * 2, bs * 0.4, bs * 4);
    c.fillStyle = '#f2c230'; c.fillRect(bx - bs * 0.2, by - bs * 2, bs * 0.4, bs * 4);
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(bx + bs * 0.4, by - bs * 2, bs, bs * 4);
    c.restore();
    c.strokeStyle = 'rgba(60,40,30,0.7)'; c.lineWidth = 0.25 * u; c.beginPath(); c.moveTo(bx - bs * 0.2, by + bs * 1.6); c.lineTo(bx - bs * 0.16, by + bs * 1.95); c.moveTo(bx + bs * 0.2, by + bs * 1.6); c.lineTo(bx + bs * 0.16, by + bs * 1.95); c.stroke();
    c.fillStyle = '#7a5236'; c.fillRect(bx - bs * 0.2, by + bs * 1.92, bs * 0.4, bs * 0.3);
  } else if (id === 'pine') {
    c.beginPath(); c.arc(w * 0.22, h * 0.2, 7 * u, 0, TAU); c.fillStyle = 'rgba(255,255,230,0.95)'; c.fill();
    var sg2 = c.createRadialGradient(w * 0.22, h * 0.2, 0, w * 0.22, h * 0.2, 40 * u);
    sg2.addColorStop(0, 'rgba(255,255,220,0.5)'); sg2.addColorStop(1, 'rgba(255,255,220,0)'); c.fillStyle = sg2; c.fillRect(0, 0, w, h);
    for (i = 0; i < 7; i++) {
      x = r() * w; y = (10 + r() * 34) * u; var s = (5 + r() * 6) * u;
      c.fillStyle = 'rgba(255,255,255,' + (0.55 + r() * 0.3) + ')';
      c.beginPath(); c.ellipse(x, y, s * 2.4, s * 0.7, 0, 0, TAU); c.ellipse(x - s, y - s * 0.4, s, s * 0.8, 0, 0, TAU); c.ellipse(x + s * 0.7, y - s * 0.6, s * 1.2, s, 0, 0, TAU); c.fill();
    }
  } else if (id === 'frost') {
    for (i = 0; i < 110; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.7) + ')'; x = r() * w; y = r() * h * 0.6; c.fillRect(x, y, u * (0.25 + r() * 0.35), u * (0.25 + r() * 0.35)); }
    // aurora ribbons
    for (i = 0; i < 3; i++) {
      var ay = (16 + i * 9) * u, ph = r() * 6;
      var ag = c.createLinearGradient(0, ay - 12 * u, 0, ay + 14 * u);
      ag.addColorStop(0, 'rgba(80,255,190,0)'); ag.addColorStop(0.45, i === 1 ? 'rgba(120,255,210,0.34)' : 'rgba(90,230,255,0.24)'); ag.addColorStop(1, 'rgba(120,120,255,0)');
      c.fillStyle = ag; c.beginPath(); c.moveTo(0, ay);
      for (x = 0; x <= w; x += 12) c.lineTo(x, ay + Math.sin(x / (26 * u) + ph) * 5 * u + Math.sin(x / (9 * u) + ph * 2) * 1.5 * u - 9 * u);
      for (x = w; x >= 0; x -= 12) c.lineTo(x, ay + Math.sin(x / (26 * u) + ph) * 5 * u + 12 * u);
      c.closePath(); c.fill();
    }
    c.beginPath(); c.arc(w * 0.8, h * 0.2, 6 * u, 0, TAU); c.fillStyle = '#f4f7ff'; c.fill();
    c.beginPath(); c.arc(w * 0.8 + 2.4 * u, h * 0.2 - 1.2 * u, 5.4 * u, 0, TAU); c.fillStyle = '#16245a'; c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1;
  } else if (id === 'cinder') {
    // glow on the horizon and rolling smoke
    var eg = c.createRadialGradient(w * 0.62, h * 0.86, 0, w * 0.62, h * 0.86, 70 * u);
    eg.addColorStop(0, 'rgba(255,150,50,0.55)'); eg.addColorStop(1, 'rgba(255,90,30,0)'); c.fillStyle = eg; c.fillRect(0, 0, w, h);
    for (i = 0; i < 16; i++) {
      x = r() * w; y = (6 + r() * 40) * u; var ss = (8 + r() * 12) * u;
      c.fillStyle = 'rgba(' + (30 + (r() * 30 | 0)) + ',12,20,' + (0.25 + r() * 0.3) + ')';
      c.beginPath(); c.ellipse(x, y, ss * 2.6, ss * 0.8, 0, 0, TAU); c.ellipse(x + ss, y - ss * 0.4, ss * 1.4, ss * 0.8, 0, 0, TAU); c.fill();
    }
  } else {
    for (i = 0; i < 260; i++) { var b = r(); c.fillStyle = 'rgba(' + (200 + (r() * 55 | 0)) + ',' + (210 + (r() * 45 | 0)) + ',255,' + (0.25 + b * 0.75) + ')'; x = r() * w; y = r() * h; var sz = u * (0.18 + b * b * 0.5); c.fillRect(x, y, sz, sz); }
    // nebula smudge
    var ng = c.createRadialGradient(w * 0.2, h * 0.3, 0, w * 0.2, h * 0.3, 55 * u);
    ng.addColorStop(0, 'rgba(120,70,200,0.22)'); ng.addColorStop(1, 'rgba(60,40,160,0)'); c.fillStyle = ng; c.fillRect(0, 0, w, h);
    // ringed planet
    var px = w * 0.7, py = h * 0.3, pr = 16 * u;
    c.save(); c.translate(px, py); c.rotate(-0.35);
    c.beginPath(); c.ellipse(0, 0, pr * 2.1, pr * 0.42, 0, Math.PI, TAU); c.lineWidth = pr * 0.2; c.strokeStyle = 'rgba(210,190,255,0.5)'; c.stroke();
    c.beginPath(); c.arc(0, 0, pr, 0, TAU); c.clip();
    var pg = c.createLinearGradient(0, -pr, 0, pr);
    pg.addColorStop(0, '#7fe3d8'); pg.addColorStop(0.3, '#3aa6c9'); pg.addColorStop(0.5, '#e9d9a8'); pg.addColorStop(0.7, '#3a7fc0'); pg.addColorStop(1, '#22306e');
    c.fillStyle = pg; c.fillRect(-pr, -pr, pr * 2, pr * 2);
    c.fillStyle = 'rgba(4,6,20,0.55)'; c.beginPath(); c.arc(pr * 0.55, pr * 0.3, pr * 1.15, 0, TAU); c.fill();
    c.restore();
    c.save(); c.translate(px, py); c.rotate(-0.35);
    c.beginPath(); c.ellipse(0, 0, pr * 2.1, pr * 0.42, 0, 0, Math.PI); c.lineWidth = pr * 0.2; c.strokeStyle = 'rgba(225,205,255,0.8)'; c.stroke();
    c.beginPath(); c.ellipse(0, 0, pr * 1.7, pr * 0.33, 0, 0, Math.PI); c.lineWidth = pr * 0.06; c.strokeStyle = 'rgba(160,230,255,0.7)'; c.stroke();
    c.restore();
    c.beginPath(); c.arc(w * 0.14, h * 0.16, 2.6 * u, 0, TAU); c.fillStyle = '#cfd4ee'; c.fill();
  }
}

function paintLayer(c, TW, H, wi, li) {
  var T = TH[wi], id = T.id, col = T.far[li], r = rng(900 + T.seed * 31 + li * 7), u = H / 100, i, x, y, fn;
  var base = [62, 72, 84][li] * u, amp = [13, 10, 6][li] * u;
  if (id === 'race') {
    fn = ridgeFn(61 + li, TW, base, amp * (li === 0 ? 0.5 : 0.25), [1, 2, 3]);
    fillRidge(c, TW, H, fn, col, 4);
    if (li === 0) {
      // a town on the skyline
      for (i = 0; i < 30; i++) {
        x = r() * TW; var bw = (3 + r() * 5) * u, bh = (6 + r() * 20) * u;
        (function (bw2, bh2, win) { wrapDraw(TW, x, bw2 + 4, function (xx) {
          var gy = fn(xx) + 2 * u;
          c.fillStyle = col; c.fillRect(xx - bw2 / 2, gy - bh2, bw2, bh2 + 2);
          c.fillStyle = 'rgba(255,255,255,0.22)';
          for (var wy = gy - bh2 + 1.2 * u; wy < gy - 1.5 * u; wy += 2.2 * u) for (var wx = xx - bw2 / 2 + 0.7 * u; wx < xx + bw2 / 2 - 0.8 * u; wx += 1.4 * u) if (hash(wx * 3.7 + wy * 1.3 + win) > 0.45) c.fillRect(wx, wy, 0.7 * u, 1.0 * u);
        }); })(bw, bh, i);
      }
      wrapDraw(TW, TW * 0.55, 30, function (xx) { var gy = fn(xx); c.fillStyle = col; c.fillRect(xx - 0.5 * u, gy - 38 * u, 1 * u, 38 * u); c.beginPath(); c.ellipse(xx, gy - 30 * u, 3 * u, 1.3 * u, 0, 0, TAU); c.fill(); });
    } else if (li === 1) {
      // grandstands with a crowd, flags and floodlights
      var stands = [TW * 0.18, TW * 0.52, TW * 0.84];
      stands.forEach(function (sx0, si) {
        wrapDraw(TW, sx0, 80 * u, function (xx) {
          var gy = fn(xx) + 2 * u, sw = 46 * u, sh = 15 * u, k, q;
          c.fillStyle = col; c.beginPath(); c.moveTo(xx - sw / 2, gy); c.lineTo(xx - sw / 2, gy - sh * 0.45); c.lineTo(xx + sw / 2, gy - sh); c.lineTo(xx + sw / 2, gy); c.closePath(); c.fill();
          var cc = ['rgba(255,255,255,0.5)', 'rgba(255,214,90,0.6)', 'rgba(255,120,110,0.6)', 'rgba(140,230,255,0.6)'];
          for (k = 0; k < 6; k++) for (q = 0; q < 38; q++) {
            var px = xx - sw / 2 + 1.2 * u + q * 1.16 * u, top = gy - sh * (0.45 + 0.55 * (px - (xx - sw / 2)) / sw) + 1.4 * u, py = top + k * 1.5 * u;
            if (py > gy - 1.6 * u || hash(q * 7.3 + k * 3.1 + si) < 0.28) continue;
            c.fillStyle = cc[Math.floor(hash(q * 1.7 + k * 9.1 + si * 5) * 4)]; c.fillRect(px, py, 0.62 * u, 0.62 * u);
          }
          // roof on stilts
          c.fillStyle = col; c.beginPath(); c.moveTo(xx - sw / 2 - 2 * u, gy - sh * 0.45 - 7 * u); c.lineTo(xx + sw / 2 + 1 * u, gy - sh - 5.5 * u); c.lineTo(xx + sw / 2 + 1 * u, gy - sh - 4 * u); c.lineTo(xx - sw / 2 - 2 * u, gy - sh * 0.45 - 5.6 * u); c.closePath(); c.fill();
          c.fillRect(xx + sw / 2 - 0.4 * u, gy - sh - 5 * u, 0.8 * u, 6 * u); c.fillRect(xx - 0.4 * u, gy - sh * 0.72 - 5.5 * u, 0.8 * u, 6 * u);
          var fc = ['#e2402f', '#f2c230', '#f4f1e8'];
          for (k = 0; k < 4; k++) { var fx = xx - sw / 2 + (k + 0.5) * sw / 4, fy = gy - sh * (0.45 + 0.55 * (k + 0.5) / 4) - 6.6 * u; c.fillStyle = col; c.fillRect(fx, fy - 5 * u, 0.3 * u, 5 * u); c.fillStyle = fc[k % 3]; c.beginPath(); c.moveTo(fx + 0.3 * u, fy - 5 * u); c.lineTo(fx + 3.4 * u, fy - 4.2 * u); c.lineTo(fx + 0.3 * u, fy - 3.3 * u); c.fill(); }
        });
      });
      for (i = 0; i < 4; i++) { x = (i + 0.35) * TW / 4;
        wrapDraw(TW, x, 20, function (xx) { var gy = fn(xx) + 2 * u; c.fillStyle = col; c.fillRect(xx - 0.3 * u, gy - 34 * u, 0.6 * u, 34 * u); c.fillRect(xx - 3 * u, gy - 37 * u, 6 * u, 3.4 * u);
          c.fillStyle = 'rgba(255,255,255,0.75)'; for (var a = 0; a < 4; a++) for (var b = 0; b < 2; b++) c.fillRect(xx - 2.6 * u + a * 1.4 * u, gy - 36.5 * u + b * 1.5 * u, 0.9 * u, 0.9 * u); }); }
    } else {
      // catch fence, hoardings and palms along the edge of the track
      c.strokeStyle = col; c.lineWidth = 0.35 * u;
      c.beginPath(); for (x = 0; x <= TW; x += 5 * u) { c.moveTo(x, fn(x) + 1); c.lineTo(x, fn(x) - 6 * u); } c.stroke();
      c.lineWidth = 0.2 * u; c.beginPath(); for (var row = 1; row <= 3; row++) { c.moveTo(0, fn(0) - row * 1.9 * u); for (x = 0; x <= TW; x += 8) c.lineTo(x, fn(x) - row * 1.9 * u); } c.stroke();
      var hc = ['rgba(226,64,47,0.75)', 'rgba(242,194,48,0.8)', 'rgba(244,241,232,0.8)', 'rgba(47,111,214,0.75)'];
      for (i = 0; i < 9; i++) { x = (i + r() * 0.5) * TW / 9; var hw = (9 + r() * 7) * u, hcI = i % 4;
        (function (hw2, k2) { wrapDraw(TW, x, hw2 + 4, function (xx) { var gy = fn(xx); c.fillStyle = hc[k2]; c.fillRect(xx, gy - 3.6 * u, hw2, 3.2 * u); c.fillStyle = 'rgba(0,0,0,0.18)'; for (var q = 0; q < hw2 - 2 * u; q += 3.2 * u) { c.beginPath(); c.moveTo(xx + q + 0.8 * u, gy - 3 * u); c.lineTo(xx + q + 2 * u, gy - 2 * u); c.lineTo(xx + q + 0.8 * u, gy - 1 * u); c.fill(); } }); })(hw, hcI); }
      for (i = 0; i < 7; i++) { x = r() * TW; var ps = (11 + r() * 6) * u;
        (function (ps2) { wrapDraw(TW, x, 40, function (xx) {
          var gy = fn(xx) + 2;
          c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = ps2 * 0.09; c.beginPath(); c.moveTo(xx, gy); c.quadraticCurveTo(xx + ps2 * 0.12, gy - ps2 * 0.5, xx + ps2 * 0.04, gy - ps2); c.stroke();
          c.lineWidth = ps2 * 0.07;
          for (var f = 0; f < 6; f++) { var a = -2.9 + f * 0.55; c.beginPath(); c.moveTo(xx + ps2 * 0.04, gy - ps2); c.quadraticCurveTo(xx + ps2 * 0.04 + Math.cos(a) * ps2 * 0.3, gy - ps2 + Math.sin(a) * ps2 * 0.3 - ps2 * 0.1, xx + ps2 * 0.04 + Math.cos(a) * ps2 * 0.5, gy - ps2 + Math.sin(a) * ps2 * 0.2 + ps2 * 0.16); c.stroke(); }
        }); })(ps); }
    }
  } else if (id === 'dust') {
    fn = ridgeFn(11 + li, TW, base, amp, [1, 2, 3, 5]);
    if (li < 2) {
      // flat-topped mesas rising out of a low ridge
      var mesaN = li === 0 ? 4 : 5, mes = [];
      for (i = 0; i < mesaN; i++) mes.push([r() * TW, (60 + r() * 120) * (li ? 0.8 : 1.2), (12 + r() * 16) * u * (li ? 0.8 : 1)]);
      var f2 = function (xx) {
        var yy = fn(xx) + amp * 0.6;
        for (var m = 0; m < mes.length; m++) {
          var dx = Math.abs(((xx - mes[m][0] + TW * 1.5) % TW) - TW * 0.5), w2 = mes[m][1];
          var t = clamp((w2 - dx) / (w2 * 0.22), 0, 1);
          yy = Math.min(yy, base + amp * 0.6 - mes[m][2] * (t * t * (3 - 2 * t)) - Math.sin(xx * 0.05) * u * 0.4);
        }
        return yy;
      };
      fillRidge(c, TW, H, f2, col, 3);
      // rock bands
      c.save(); c.beginPath(); c.moveTo(0, H); for (x = 0; x <= TW; x += 3) c.lineTo(x, f2(x)); c.lineTo(TW, H); c.clip();
      c.fillStyle = li ? 'rgba(255,190,140,0.14)' : 'rgba(255,220,180,0.16)';
      for (i = 0; i < 5; i++) c.fillRect(0, base - (20 - i * 6.5) * u, TW, 1.6 * u);
      c.restore();
    } else {
      fillRidge(c, TW, H, fn, col, 4);
      for (i = 0; i < 9; i++) {
        x = r() * TW; var s = (7 + r() * 6) * u;
        wrapDraw(TW, x, 60, function (xx) {
          var gy = fn(xx);
          c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = s * 0.26;
          c.beginPath(); c.moveTo(xx, gy + 2); c.lineTo(xx, gy - s);
          c.moveTo(xx, gy - s * 0.45); c.lineTo(xx - s * 0.36, gy - s * 0.45); c.lineTo(xx - s * 0.36, gy - s * 0.82);
          c.moveTo(xx, gy - s * 0.3); c.lineTo(xx + s * 0.34, gy - s * 0.3); c.lineTo(xx + s * 0.34, gy - s * 0.66); c.stroke();
        });
      }
    }
  } else if (id === 'pine') {
    fn = ridgeFn(21 + li, TW, base, amp * (li === 0 ? 1.5 : 1), li === 0 ? [1, 2, 3] : [1, 2, 4, 6]);
    fillRidge(c, TW, H, fn, col, 4);
    if (li === 0) {
      // pale snow on the high ground
      c.save(); c.beginPath(); c.moveTo(0, H); for (x = 0; x <= TW; x += 4) c.lineTo(x, fn(x)); c.lineTo(TW, H); c.clip();
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.moveTo(0, 0);
      for (x = 0; x <= TW; x += 8) c.lineTo(x, base - amp * 0.75 + Math.sin(x * 0.11) * u * 1.2); c.lineTo(TW, 0); c.fill(); c.restore();
    } else {
      var n = li === 1 ? 150 : 44;
      for (i = 0; i < n; i++) {
        x = r() * TW; var ps = (li === 1 ? 4 + r() * 3 : 13 + r() * 9) * u;
        (function (ps2) { wrapDraw(TW, x, 60, function (xx) { pineSil(c, xx, fn(xx) + ps2 * 0.1, ps2, col); }); })(ps);
      }
    }
  } else if (id === 'frost') {
    if (li < 2) {
      // sharp peaks with a lit left face
      fn = ridgeFn(31 + li, TW, base, amp, [1, 2, 3]);
      var pk = [], np = li === 0 ? 7 : 9;
      for (i = 0; i < np; i++) pk.push([(i + r() * 0.7) * TW / np, (16 + r() * 16) * u * (li ? 0.72 : 1), (26 + r() * 22) * u * (li ? 0.8 : 1)]);
      fillRidge(c, TW, H, fn, col, 4);
      pk.forEach(function (p) {
        wrapDraw(TW, p[0], p[2] + 10, function (xx) {
          var by = base + amp;
          c.fillStyle = col; c.beginPath(); c.moveTo(xx - p[2], by); c.lineTo(xx, by - p[1] - amp); c.lineTo(xx + p[2] * 0.9, by); c.fill();
          c.fillStyle = li ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.34)';
          c.beginPath(); c.moveTo(xx - p[2] * 0.5, by - (p[1] + amp) * 0.5); c.lineTo(xx, by - p[1] - amp); c.lineTo(xx + p[2] * 0.1, by - (p[1] + amp) * 0.62); c.lineTo(xx - p[2] * 0.12, by - (p[1] + amp) * 0.5); c.lineTo(xx - p[2] * 0.3, by - (p[1] + amp) * 0.38); c.fill();
        });
      });
    } else {
      fn = ridgeFn(33, TW, base, amp, [1, 2, 4, 6]);
      fillRidge(c, TW, H, fn, col, 4);
      for (i = 0; i < 40; i++) { x = r() * TW; var fs = (12 + r() * 9) * u; (function (fs2) { wrapDraw(TW, x, 60, function (xx) { pineSil(c, xx, fn(xx) + fs2 * 0.1, fs2, col, 'rgba(235,244,255,0.75)'); }); })(fs); }
    }
  } else if (id === 'cinder') {
    fn = ridgeFn(41 + li, TW, base, amp * 0.8, [1, 2, 3, 5, 8]);
    if (li === 0) {
      fillRidge(c, TW, H, fn, col, 4);
      // the volcano itself
      var vx = TW * 0.62, vw = 60 * u, vh = 40 * u, by0 = base + amp;
      c.fillStyle = col; c.beginPath(); c.moveTo(vx - vw, by0);
      c.quadraticCurveTo(vx - vw * 0.3, by0 - vh * 0.5, vx - vw * 0.14, by0 - vh); c.lineTo(vx + vw * 0.14, by0 - vh);
      c.quadraticCurveTo(vx + vw * 0.3, by0 - vh * 0.5, vx + vw, by0); c.fill();
      var lg = c.createLinearGradient(0, by0 - vh, 0, by0);
      lg.addColorStop(0, '#ffd23f'); lg.addColorStop(0.5, '#ff5a1f'); lg.addColorStop(1, 'rgba(255,60,20,0)');
      c.strokeStyle = lg; c.lineWidth = 1.6 * u; c.lineCap = 'round';
      c.beginPath(); c.moveTo(vx - 2 * u, by0 - vh); c.quadraticCurveTo(vx - 8 * u, by0 - vh * 0.6, vx - 20 * u, by0 - vh * 0.2); c.stroke();
      c.lineWidth = 1.1 * u; c.beginPath(); c.moveTo(vx + 3 * u, by0 - vh); c.quadraticCurveTo(vx + 9 * u, by0 - vh * 0.5, vx + 7 * u, by0 - vh * 0.25); c.stroke();
      var cg = c.createRadialGradient(vx, by0 - vh, 0, vx, by0 - vh, 26 * u);
      cg.addColorStop(0, 'rgba(255,200,90,0.75)'); cg.addColorStop(1, 'rgba(255,90,30,0)'); c.fillStyle = cg; c.fillRect(vx - 30 * u, by0 - vh - 30 * u, 60 * u, 50 * u);
    } else {
      var f3 = function (xx) { return fn(xx) - Math.abs(Math.sin(xx * 0.035 + li)) * amp * 0.9 - Math.abs(Math.sin(xx * 0.09 + 2)) * amp * 0.35; };
      fillRidge(c, TW, H, f3, col, 3);
      c.strokeStyle = li === 1 ? 'rgba(255,110,40,0.5)' : 'rgba(255,140,50,0.75)'; c.lineWidth = 0.5 * u; c.lineCap = 'round';
      for (i = 0; i < 12; i++) { x = r() * TW; y = f3(x) + (3 + r() * 6) * u; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 6 * u, y + 3 * u); c.lineTo(x + (r() - 0.5) * 8 * u, y + 6 * u); c.stroke(); }
    }
  } else {
    fn = ridgeFn(51 + li, TW, base, amp * 0.8, li === 0 ? [1, 2, 3] : [1, 3, 4, 7]);
    fillRidge(c, TW, H, fn, col, 4);
    // craters
    c.save(); c.beginPath(); c.moveTo(0, H); for (x = 0; x <= TW; x += 4) c.lineTo(x, fn(x)); c.lineTo(TW, H); c.clip();
    for (i = 0; i < 12; i++) {
      x = r() * TW; y = fn(x) + (4 + r() * 12) * u; var cr = (2 + r() * 5) * u;
      c.fillStyle = 'rgba(0,0,10,0.18)'; c.beginPath(); c.ellipse(x, y, cr * 2, cr * 0.55, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 0.4 * u; c.beginPath(); c.ellipse(x, y, cr * 2, cr * 0.55, 0, 0.2, Math.PI - 0.2); c.stroke();
    }
    c.restore();
    if (li === 2) {
      // a small base: dome, dish, mast
      wrapDraw(TW, TW * 0.3, 120, function (xx) {
        var gy = fn(xx) + 1;
        c.fillStyle = col; c.beginPath(); c.arc(xx, gy, 7 * u, Math.PI, TAU); c.fill();
        c.fillRect(xx + 10 * u, gy - 12 * u, 0.7 * u, 12 * u);
        c.beginPath(); c.ellipse(xx + 10.3 * u, gy - 12 * u, 4 * u, 1.6 * u, -0.6, 0, TAU); c.fill();
        c.fillRect(xx - 14 * u, gy - 16 * u, 0.5 * u, 16 * u);
        c.fillStyle = '#ff5a5a'; c.fillRect(xx - 14.2 * u, gy - 16.6 * u, 0.9 * u, 0.9 * u);
        c.fillStyle = '#9fe8ff'; c.fillRect(xx - 3 * u, gy - 3.4 * u, 2 * u, 1.2 * u); c.fillRect(xx + 1 * u, gy - 3.4 * u, 2 * u, 1.2 * u);
      });
    }
  }
}

R.buildBackground = function (wi, w, h, scale) {
  if (bg.world === wi && bg.w === w && bg.h === h && bg.scale === scale) return;
  bg.world = wi; bg.w = w; bg.h = h; bg.scale = scale;
  bg.sky = mk(w * scale, h * scale);
  var c = bg.sky.getContext('2d'); c.scale(scale, scale); paintSky(c, w, h, wi);
  bg.TW = Math.max(900, Math.ceil(h * 3.4));
  bg.layers = [];
  for (var i = 0; i < 3; i++) {
    var cv = mk(bg.TW * scale, h * scale), cc = cv.getContext('2d');
    cc.scale(scale, scale); paintLayer(cc, bg.TW, h, wi, i);
    bg.layers.push(cv);
  }
  // soft dark corners
  bg.vig = mk(w * 0.25, h * 0.25);
  var vc = bg.vig.getContext('2d'), vg = vc.createRadialGradient(w * 0.125, h * 0.11, h * 0.09, w * 0.125, h * 0.125, w * 0.16);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,' + TH[wi].vig + ')');
  vc.fillStyle = vg; vc.fillRect(0, 0, w, h);
};

/* ------------------------------------------------------------------ */
/* Props (scenery standing on the track)                                */
/* ------------------------------------------------------------------ */
R.makeProps = function (tr) {
  var T = TH[tr.worldIndex], r = rng(4242 + (tr.seed || tr.index) * 17), out = [], x = 7, i;
  function blocked(px) {
    if (px < 8 || px > tr.finishX - 6 && px < tr.finishX + 6) return true;
    for (i = 0; i < tr.hazards.length; i++) if (px > tr.hazards[i].x0 - 1.2 && px < tr.hazards[i].x1 + 1.2) return true;
    for (i = 0; i < tr.loops.length; i++) if (Math.abs(px - tr.loops[i].cx) < tr.loops[i].R + 1.5) return true;
    for (i = 0; i < tr.feats.length; i++) { var f = tr.feats[i]; if ((f.t === 'roof' || f.t === 'beam') && px > f.x0 - 1 && px < f.x1 + 1) return true; if (f.t === 'log' && Math.abs(px - f.x) < 1.2) return true; }
    if (Math.abs(RR.groundSlope(tr, px)) > 0.42) return true;
    if (Math.abs(RR.groundY(tr, px - 0.7) - RR.groundY(tr, px + 0.7)) > 0.9) return true;
    return false;
  }
  while (x < tr.xs[tr.xs.length - 1] - 3) {
    x += 3.5 + r() * 9;
    var type = T.props[Math.floor(r() * T.props.length)];
    if (blocked(x)) continue;
    out.push({ x: x, y: RR.groundY(tr, x), type: type, s: 0.8 + r() * 0.5, f: r() < 0.5 && type !== 'board' && type !== 'flagpole' ? -1 : 1, seed: r() });
  }
  return out;
};

var PROP = {
  cactus: function (c, p) {
    var s = p.s * 2.4;
    A.tube(c, [0, -0.1, 0, s], 0.3 * p.s, '#3f9a5c', 0.06);
    A.tube(c, [0, s * 0.42, -0.38 * p.s, s * 0.42, -0.38 * p.s, s * 0.74], 0.2 * p.s, '#3f9a5c', 0.06);
    if (p.seed > 0.3) A.tube(c, [0, s * 0.28, 0.36 * p.s, s * 0.28, 0.36 * p.s, s * 0.6], 0.2 * p.s, '#3f9a5c', 0.06);
    A.line(c, [-0.05 * p.s, 0.1, -0.05 * p.s, s * 0.95], 0.03, '#62bd78');
    if (p.seed > 0.6) A.circ(c, 0.02, s + 0.06, 0.09, '#ff7aa8', 0.03);
  },
  cactus2: function (c, p) {
    var s = p.s;
    A.blob(c, [-0.3 * s, 0, -0.34 * s, 0.5 * s, 0, 0.72 * s, 0.34 * s, 0.5 * s, 0.3 * s, 0], '#4aa866', 0.05);
    A.blob(c, [0.14 * s, 0.5 * s, 0.1 * s, 0.9 * s, 0.38 * s, 1.08 * s, 0.56 * s, 0.84 * s, 0.4 * s, 0.56 * s], '#3f9a5c', 0.05);
    A.circ(c, 0.36 * s, 1.08 * s, 0.07, '#ffd24a', 0.03);
  },
  rock: function (c, p, T) {
    var s = p.s;
    A.shape(c, [-0.7 * s, -0.05, -0.55 * s, 0.42 * s, -0.1 * s, 0.7 * s, 0.45 * s, 0.5 * s, 0.75 * s, -0.05], T.speck[0], 0.05);
    A.shape(c, [-0.5 * s, 0.4 * s, -0.1 * s, 0.66 * s, 0.1 * s, 0.4 * s, -0.25 * s, 0.26 * s], T.crust === '#f6fbff' ? '#f6fbff' : A.shade(T.ground[0], 1.25), 0);
  },
  bush: function (c, p) {
    var s = p.s * 0.6, i;
    c.lineWidth = 0.045; c.strokeStyle = '#8a5a34';
    c.beginPath(); for (i = 0; i < 9; i++) { var a = 0.3 + i * 0.3; c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a) * s * 0.6, Math.sin(a) * s * 1.2, Math.cos(a + 0.3) * s * 1.3, Math.sin(a + 0.2) * s * 1.1); } c.stroke();
  },
  bones: function (c, p) {
    var s = p.s * 0.5;
    A.blob(c, [-0.5 * s, 0, -0.56 * s, 0.5 * s, 0, 0.74 * s, 0.56 * s, 0.5 * s, 0.4 * s, 0, 0.2 * s, -0.04, 0, 0.12 * s, -0.2 * s, -0.04], '#efe6d2', 0.045);
    A.circ(c, -0.22 * s, 0.4 * s, 0.11 * s, OUT, 0); A.circ(c, 0.22 * s, 0.4 * s, 0.11 * s, OUT, 0);
    A.curve(c, [-0.5 * s, 0.56 * s, -1.0 * s, 0.7 * s, -1.05 * s, 1.1 * s], 0.07, '#efe6d2', 0.05);
    A.curve(c, [0.5 * s, 0.56 * s, 1.0 * s, 0.7 * s, 1.05 * s, 1.1 * s], 0.07, '#efe6d2', 0.05);
  },
  pine: function (c, p, T, t, snow) {
    var s = p.s * 4.4, g1 = snow ? '#3a6aa0' : '#2f8a5c', g2 = snow ? '#4a80b8' : '#3fa66c', k;
    A.shape(c, [-0.14 * p.s, -0.1, 0.14 * p.s, -0.1, 0.1 * p.s, s * 0.3, -0.1 * p.s, s * 0.3], '#6b4630', 0.05);
    for (k = 0; k < 4; k++) {
      var y0 = s * (0.16 + k * 0.2), w = s * (0.3 - k * 0.055), h = s * 0.34;
      A.shape(c, [-w, y0, -w * 0.4, y0 + h * 0.34, -w * 0.52, y0 + h * 0.34, 0, y0 + h, w * 0.52, y0 + h * 0.34, w * 0.4, y0 + h * 0.34, w, y0], k % 2 ? g2 : g1, 0.05);
      if (snow) A.shape(c, [-w * 0.42, y0 + h * 0.42, 0, y0 + h, w * 0.42, y0 + h * 0.42, w * 0.16, y0 + h * 0.52, 0, y0 + h * 0.4, -w * 0.2, y0 + h * 0.54], '#f6fbff', 0);
    }
  },
  spine: function (c, p, T, t) { PROP.pine(c, p, T, t, true); },
  stump: function (c, p) {
    var s = p.s * 0.7;
    A.shape(c, [-0.42 * s, -0.05, -0.34 * s, 0.6 * s, 0.34 * s, 0.6 * s, 0.42 * s, -0.05], '#7a5236', 0.05);
    c.beginPath(); c.ellipse(0, 0.6 * s, 0.34 * s, 0.1 * s, 0, 0, TAU); c.fillStyle = '#d9b382'; c.fill(); c.lineWidth = 0.04; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.ellipse(0, 0.6 * s, 0.17 * s, 0.05 * s, 0, 0, TAU); c.lineWidth = 0.025; c.strokeStyle = '#a57a4c'; c.stroke();
  },
  fern: function (c, p) {
    var s = p.s * 0.7, i;
    for (i = 0; i < 5; i++) { var a = 0.5 + i * 0.52; A.curve(c, [0, 0, Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.9, Math.cos(a) * s * 1.1, Math.sin(a) * s * 0.7], 0.09, i % 2 ? '#4fb35a' : '#3c9a4c', 0.04); }
  },
  mush: function (c, p) {
    var s = p.s * 0.5;
    A.shape(c, [-0.1 * s, -0.04, -0.08 * s, 0.5 * s, 0.08 * s, 0.5 * s, 0.1 * s, -0.04], '#f1e6d0', 0.04);
    A.blob(c, [-0.5 * s, 0.46 * s, -0.4 * s, 0.9 * s, 0.4 * s, 0.9 * s, 0.5 * s, 0.46 * s], '#e8483a', 0.045);
    A.circ(c, -0.16 * s, 0.7 * s, 0.07 * s, '#fff', 0); A.circ(c, 0.14 * s, 0.76 * s, 0.05 * s, '#fff', 0);
  },
  crystal: function (c, p) {
    var s = p.s;
    A.shape(c, [-0.3 * s, -0.05, -0.42 * s, 0.7 * s, -0.2 * s, 1.0 * s, 0.0, 0.5 * s, 0.05 * s, -0.05], '#9fe8ff', 0.05);
    A.shape(c, [-0.02 * s, -0.05, 0.1 * s, 1.3 * s, 0.34 * s, 1.5 * s, 0.5 * s, 1.1 * s, 0.4 * s, -0.05], '#c9f4ff', 0.05);
    A.line(c, [0.2 * s, 0.2 * s, 0.3 * s, 1.2 * s], 0.04, 'rgba(255,255,255,0.8)');
  },
  gem: function (c, p) {
    var s = p.s * 0.8;
    A.shape(c, [-0.3 * s, -0.05, -0.42 * s, 0.7 * s, -0.2 * s, 1.0 * s, 0.0, 0.5 * s, 0.05 * s, -0.05], '#a06cff', 0.05);
    A.shape(c, [-0.02 * s, -0.05, 0.1 * s, 1.3 * s, 0.34 * s, 1.5 * s, 0.5 * s, 1.1 * s, 0.4 * s, -0.05], '#c9a3ff', 0.05);
    A.line(c, [0.2 * s, 0.2 * s, 0.3 * s, 1.2 * s], 0.04, 'rgba(255,255,255,0.7)');
  },
  snowman: function (c, p) {
    var s = p.s * 0.75;
    A.circ(c, 0, 0.42 * s, 0.46 * s, '#f6fbff', 0.05); A.circ(c, 0, 1.08 * s, 0.34 * s, '#f6fbff', 0.05); A.circ(c, 0, 1.58 * s, 0.25 * s, '#f6fbff', 0.05);
    A.shape(c, [0.02 * s, 1.58 * s, 0.4 * s, 1.52 * s, 0.02 * s, 1.5 * s], '#ff8a2a', 0.03);
    A.circ(c, -0.08 * s, 1.66 * s, 0.035 * s, OUT, 0); A.circ(c, 0.1 * s, 1.67 * s, 0.035 * s, OUT, 0);
    A.line(c, [-0.24 * s, 1.36 * s, 0.26 * s, 1.36 * s], 0.09 * s, '#e8483a');
    A.line(c, [-0.3 * s, 1.1 * s, -0.8 * s, 1.4 * s], 0.04, '#6b4630'); A.line(c, [0.3 * s, 1.1 * s, 0.8 * s, 1.3 * s], 0.04, '#6b4630');
  },
  dead: function (c, p) {
    var s = p.s * 2.6;
    A.curve(c, [0, -0.1, 0.06, s * 0.5, -0.04, s], 0.16 * p.s, '#2a1a20', 0.05);
    A.curve(c, [0.03, s * 0.45, 0.4 * p.s, s * 0.6, 0.6 * p.s, s * 0.9], 0.08 * p.s, '#2a1a20', 0.04);
    A.curve(c, [0, s * 0.62, -0.36 * p.s, s * 0.74, -0.5 * p.s, s * 1.02], 0.07 * p.s, '#2a1a20', 0.04);
    A.curve(c, [-0.03, s * 0.9, 0.2 * p.s, s * 1.05, 0.22 * p.s, s * 1.2], 0.05 * p.s, '#2a1a20', 0.04);
  },
  basalt: function (c, p) {
    var s = p.s, hs = [1.0, 1.6, 2.1, 1.3, 0.7], i;
    for (i = 0; i < 5; i++) { var x0 = (-0.75 + i * 0.3) * s, h = hs[(i + Math.floor(p.seed * 5)) % 5] * s;
      A.shape(c, [x0, -0.1, x0, h, x0 + 0.15 * s, h + 0.1 * s, x0 + 0.3 * s, h, x0 + 0.3 * s, -0.1], i % 2 ? '#43323b' : '#55424c', 0.045); }
  },
  vent: function (c, p, T, t) {
    var s = p.s;
    A.shape(c, [-0.8 * s, -0.05, -0.36 * s, 0.6 * s, 0.36 * s, 0.6 * s, 0.8 * s, -0.05], '#43323b', 0.05);
    c.beginPath(); c.ellipse(0, 0.6 * s, 0.36 * s, 0.1 * s, 0, 0, TAU); c.fillStyle = '#ff7a1f'; c.fill(); c.lineWidth = 0.04; c.strokeStyle = OUT; c.stroke();
    c.beginPath(); c.ellipse(0, 0.6 * s, 0.2 * s, 0.05 * s, 0, 0, TAU); c.fillStyle = '#ffe07a'; c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5 + p.seed * 9); c.fill(); c.globalAlpha = 1;
  },
  ember: function (c, p, T, t) {
    var s = p.s * 0.55;
    A.shape(c, [-0.5 * s, -0.05, -0.4 * s, 0.5 * s, 0.1 * s, 0.7 * s, 0.5 * s, 0.4 * s, 0.55 * s, -0.05], '#2b1d24', 0.05);
    c.globalAlpha = 0.65 + 0.35 * Math.sin(t * 3 + p.seed * 7);
    A.line(c, [-0.3 * s, 0.1 * s, -0.1 * s, 0.4 * s, 0.1 * s, 0.3 * s, 0.3 * s, 0.5 * s], 0.05, '#ff7a1f'); c.globalAlpha = 1;
  },
  dish: function (c, p) {
    var s = p.s;
    A.tube(c, [0, -0.05, 0, 1.5 * s], 0.08, '#aeb4c8', 0.05);
    A.shape(c, [-0.4 * s, -0.05, -0.2 * s, 0.25 * s, 0.2 * s, 0.25 * s, 0.4 * s, -0.05], '#8a8fa6', 0.045);
    c.save(); c.translate(0, 1.6 * s); c.rotate(0.6 * p.f);
    c.beginPath(); c.ellipse(0, 0, 0.9 * s, 0.34 * s, 0, 0, Math.PI); c.closePath(); c.fillStyle = '#e3e6f2'; c.fill(); c.lineWidth = 0.05; c.strokeStyle = OUT; c.stroke();
    A.line(c, [0, 0.02, 0, 0.6 * s], 0.035, '#aeb4c8'); A.circ(c, 0, 0.62 * s, 0.07, '#ff5a5a', 0.03);
    c.restore();
  },
  flag: function (c, p, T, t) {
    var s = p.s;
    A.tube(c, [0, -0.05, 0, 2.2 * s], 0.05, '#d5d8ea', 0.045);
    var w = Math.sin(t * 2 + p.seed * 6) * 0.04;
    A.shape(c, [0.02, 2.2 * s, 0.9 * s, 2.14 * s + w, 0.9 * s, 1.66 * s + w, 0.02, 1.7 * s], '#22e0c8', 0.045);
    A.circ(c, 0.42 * s, 1.92 * s + w * 0.5, 0.13 * s, '#fff', 0);
  },
  lamp: function (c, p, T, t) {
    var s = p.s;
    A.tube(c, [0, -0.05, 0, 1.3 * s], 0.07, '#8a8fa6', 0.045);
    var on = Math.sin(t * 4 + p.seed * 20) > 0.2;
    A.circ(c, 0, 1.38 * s, 0.12 * s, on ? '#ff5a5a' : '#6a2030', 0.04);
    if (on) { c.globalAlpha = 0.25; A.circ(c, 0, 1.38 * s, 0.34 * s, '#ff5a5a', 0); c.globalAlpha = 1; }
  },
  tyres: function (c, p) {
    var s = p.s * 0.9, k, n = p.seed > 0.5 ? 3 : 2;
    for (k = 0; k < n; k++) {
      A.shape(c, [-0.44 * s, k * 0.26 * s - 0.03, 0.44 * s, k * 0.26 * s - 0.03, 0.44 * s, k * 0.26 * s + 0.22 * s, -0.44 * s, k * 0.26 * s + 0.22 * s], k === 1 && p.seed > 0.3 ? '#e2402f' : '#22242b', 0.045);
      A.line(c, [-0.3 * s, k * 0.26 * s + 0.16 * s, 0.2 * s, k * 0.26 * s + 0.16 * s], 0.03, 'rgba(255,255,255,0.22)');
    }
  },
  cone: function (c, p) {
    var s = p.s * 0.5;
    A.shape(c, [-0.34 * s, -0.04, 0.34 * s, -0.04, 0.34 * s, 0.06 * s, -0.34 * s, 0.06 * s], '#ff7a1f', 0.04);
    A.shape(c, [-0.24 * s, 0.05 * s, 0.24 * s, 0.05 * s, 0.06 * s, 0.9 * s, -0.06 * s, 0.9 * s], '#ff7a1f', 0.04);
    A.shape(c, [-0.17 * s, 0.34 * s, 0.17 * s, 0.34 * s, 0.12 * s, 0.56 * s, -0.12 * s, 0.56 * s], '#ffffff', 0);
  },
  bale: function (c, p) {
    var s = p.s * 0.75;
    A.shape(c, [-0.6 * s, -0.05, 0.6 * s, -0.05, 0.6 * s, 0.6 * s, -0.6 * s, 0.6 * s], '#e2bb4e', 0.05);
    A.line(c, [-0.24 * s, -0.02, -0.24 * s, 0.58 * s], 0.035, '#a8842a'); A.line(c, [0.24 * s, -0.02, 0.24 * s, 0.58 * s], 0.035, '#a8842a');
    A.line(c, [-0.5 * s, 0.4 * s, -0.3 * s, 0.44 * s], 0.025, '#f6dc86'); A.line(c, [0.0, 0.2 * s, 0.16 * s, 0.16 * s], 0.025, '#f6dc86');
  },
  flagpole: function (c, p, T, t) {
    var s = p.s, w = Math.sin(t * 3 + p.seed * 6) * 0.05, yel = p.seed > 0.55, a, b;
    A.tube(c, [0, -0.05, 0, 2.4 * s], 0.05, '#e9edf2', 0.045);
    A.shape(c, [0.03, 2.4 * s, 0.86 * s, 2.3 * s + w, 0.86 * s, 1.78 * s + w, 0.03, 1.84 * s], yel ? '#f2c230' : '#ffffff', 0.045);
    if (!yel) { c.fillStyle = OUT; for (a = 0; a < 4; a++) for (b = 0; b < 3; b++) if ((a + b) % 2) c.fillRect(0.05 + a * 0.2 * s, 1.86 * s + b * 0.165 * s + w * a / 4, 0.2 * s, 0.165 * s); }
  },
  board: function (c, p) {
    var s = p.s * 0.8, k;
    A.tube(c, [-0.5 * s, -0.05, -0.5 * s, 1.5 * s], 0.06, '#8d939d', 0.045); A.tube(c, [0.5 * s, -0.05, 0.5 * s, 1.5 * s], 0.06, '#8d939d', 0.045);
    A.shape(c, [-0.8 * s, 0.9 * s, 0.8 * s, 0.9 * s, 0.8 * s, 1.7 * s, -0.8 * s, 1.7 * s], '#22252d', 0.05);
    for (k = 0; k < 3; k++) A.line(c, [(-0.56 + k * 0.42) * s, 1.06 * s, (-0.3 + k * 0.42) * s, 1.3 * s, (-0.56 + k * 0.42) * s, 1.54 * s], 0.09 * s, '#f2c230');
  },
  palm: function (c, p, T, t) {
    var s = p.s * 3.4, k, sw = Math.sin(t * 1.3 + p.seed * 5) * 0.05;
    A.curve(c, [0, -0.1, 0.16 * s, 0.5 * s, 0.06 * s + sw, s], 0.2 * p.s, '#8a6a48', 0.05);
    for (k = 0; k < 6; k++) { var a = 0.25 + k * 0.52;
      A.curve(c, [0.06 * s + sw, s, 0.06 * s + Math.cos(a) * s * 0.3, s + Math.sin(a) * s * 0.3 + s * 0.06, 0.06 * s + Math.cos(a) * s * 0.52 + sw, s + Math.sin(a) * s * 0.2 - s * 0.14], 0.14 * p.s, k % 2 ? '#3fa66c' : '#2f8a5c', 0.045); }
    A.circ(c, 0.03 * s + sw, s - 0.08, 0.1 * p.s, '#6b4630', 0.03);
  },
  mast: function (c, p, T, t) {
    var s = p.s, a;
    A.tube(c, [0, -0.05, 0, 4.2 * s], 0.09, '#8d939d', 0.05);
    A.shape(c, [-0.6 * s, 4.1 * s, 0.6 * s, 4.1 * s, 0.6 * s, 4.7 * s, -0.6 * s, 4.7 * s], '#22252d', 0.05);
    for (a = 0; a < 3; a++) A.circ(c, (-0.36 + a * 0.36) * s, 4.4 * s, 0.13 * s, '#fff8d8', 0.03);
  },
  lander: function (c, p) {
    var s = p.s * 0.9;
    A.line(c, [-0.5 * s, 0.6 * s, -0.9 * s, 0], 0.06, '#aeb4c8'); A.line(c, [0.5 * s, 0.6 * s, 0.9 * s, 0], 0.06, '#aeb4c8');
    A.shape(c, [-0.6 * s, 0.5 * s, -0.7 * s, 1.1 * s, -0.3 * s, 1.5 * s, 0.3 * s, 1.5 * s, 0.7 * s, 1.1 * s, 0.6 * s, 0.5 * s], '#e0b23a', 0.05);
    A.shape(c, [-0.3 * s, 1.5 * s, -0.2 * s, 1.9 * s, 0.2 * s, 1.9 * s, 0.3 * s, 1.5 * s], '#d5d8ea', 0.05);
    A.circ(c, 0, 1.0 * s, 0.2 * s, '#3aa6c9', 0.045);
  }
};

/* ------------------------------------------------------------------ */
/* Particles                                                            */
/* ------------------------------------------------------------------ */
var parts = [], MAXP = 420;
R.parts = parts;
R.quality = 1;
function emit(t, x, y, vx, vy, life, r, col, o) {
  if (parts.length >= MAXP * R.quality) { parts.shift(); }
  var p = { t: t, x: x, y: y, vx: vx, vy: vy, life: life, age: 0, r: r, col: col, g: 0, gr: 0, a: 1, rot: 0, vr: 0, drag: 0 };
  if (o) for (var k in o) p[k] = o[k];
  parts.push(p);
  return p;
}
R.emit = emit;
R.clearParts = function () { parts.length = 0; };
R.stepParts = function (dt, g, tr) {
  for (var i = parts.length - 1; i >= 0; i--) {
    var p = parts[i];
    p.age += dt;
    if (p.age >= p.life) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
    p.vy -= g * p.g * dt;
    if (p.drag) { var k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.gr * dt; p.rot += p.vr * dt;
    if (p.bounce && tr) {            // things that land and bounce: wheels, helmets, marshmallows
      var gy = RR.groundY(tr, p.x), rr = p.br == null ? p.r : p.br;
      if (gy > tr.minY - 5 && p.y < gy + rr) {
        var sl = RR.groundSlope(tr, p.x), nx = -Math.sin(sl), ny = Math.cos(sl), vn = p.vx * nx + p.vy * ny;
        p.y = gy + rr;
        if (vn < 0) { p.vx -= (1 + p.bounce) * vn * nx; p.vy -= (1 + p.bounce) * vn * ny; p.vx *= 0.86; if (p.roll) p.vr = -p.vx / Math.max(0.05, rr); else p.vr *= 0.7; if (p.onHit && vn < -1.2) p.onHit(p, -vn); }
      }
    }
  }
};
function drawParts(c, front) {
  var i, p, k;
  for (i = 0; i < parts.length; i++) {
    p = parts[i];
    if ((p.front ? 1 : 0) !== front) continue;
    k = p.age / p.life;
    if (p.t === 0) {            // soft puff
      c.globalAlpha = p.a * (1 - k) * (k < 0.1 ? k * 10 : 1);
      c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
    } else if (p.t === 1) {     // clod
      c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      c.fillStyle = p.col; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); c.restore();
    } else if (p.t === 2) {     // spark
      c.globalAlpha = 1 - k; c.strokeStyle = p.col; c.lineWidth = p.r; c.lineCap = 'round';
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); c.stroke();
    } else if (p.t === 4) {     // confetti
      c.globalAlpha = k > 0.8 ? (1 - k) / 0.2 : 1;
      c.fillStyle = p.col; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-p.r, -p.r * 0.45 * Math.cos(p.rot * 2.3), p.r * 2, p.r * 0.9 * Math.cos(p.rot * 2.3)); c.restore();
    } else if (p.t === 5) {     // ring
      c.globalAlpha = (1 - k) * p.a; c.strokeStyle = p.col; c.lineWidth = p.w || 0.06; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.stroke();
    } else if (p.t === 6) {     // five-point star
      c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.beginPath();
      for (var q = 0; q < 10; q++) { var sa = q * Math.PI / 5, sr = q % 2 ? p.r * 0.45 : p.r; c[q ? 'lineTo' : 'moveTo'](Math.sin(sa) * sr, Math.cos(sa) * sr); }
      c.closePath(); c.fillStyle = p.col; c.fill(); c.lineWidth = 0.03; c.strokeStyle = OUT; c.stroke(); c.restore();
    } else if (p.t === 7) {     // a loose wheel
      c.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 1;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      A.circ(c, 0, 0, p.r, '#1c1d22', 0.03); A.circ(c, 0, 0, p.r * 0.62, null, 0.035, '#aab1bb'); A.line(c, [-p.r * 0.6, 0, p.r * 0.6, 0], 0.02, '#aab1bb'); A.line(c, [0, -p.r * 0.6, 0, p.r * 0.6], 0.02, '#aab1bb');
      c.restore();
    } else if (p.t === 8) {     // anything else: the particle brings its own picture
      c.globalAlpha = (p.fade == null ? 0.2 : p.fade) > 0 && k > 1 - (p.fade == null ? 0.2 : p.fade) ? (1 - k) / (p.fade == null ? 0.2 : p.fade) : 1;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); p.draw(c, p, k); c.restore();
    }
  }
  c.globalAlpha = 1;
  // glowing things in a second pass so the blend mode only switches once
  var any = false;
  for (i = 0; i < parts.length; i++) {
    p = parts[i];
    if (p.t !== 3 || (p.front ? 1 : 0) !== front) continue;
    if (!any) { c.globalCompositeOperation = 'lighter'; any = true; }
    k = p.age / p.life;
    c.globalAlpha = p.a * (1 - k);
    c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.r * (1 - k * 0.5), 0, TAU); c.fill();
  }
  if (any) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
}

/* screen-space weather: snow, embers, dust motes, leaves */
var amb = [];
function stepAmbient(c, T, w, h, dt, camDx, camDy, t) {
  var n = Math.round((T.ambient === 'snow' ? 70 : T.ambient === 'embers' ? 38 : T.ambient === 'stars' ? 0 : 26) * R.quality), i, p;
  while (amb.length < n) amb.push({ x: Math.random() * w, y: Math.random() * h, z: 0.4 + Math.random() * 0.9, s: Math.random() * 6.28 });
  if (amb.length > n) amb.length = n;
  for (i = 0; i < amb.length; i++) {
    p = amb[i];
    var vx = 0, vy = 0;
    if (T.ambient === 'snow') { vx = -24 + Math.sin(t * 0.9 + p.s) * 14; vy = 46 * p.z; }
    else if (T.ambient === 'embers') { vx = 10 + Math.sin(t * 1.3 + p.s) * 16; vy = -34 * p.z; }
    else if (T.ambient === 'leaves') { vx = -18 + Math.sin(t * 0.7 + p.s) * 20; vy = 12 * p.z + Math.cos(t * 1.1 + p.s) * 10; }
    else { vx = 8 + Math.sin(t * 0.5 + p.s) * 6; vy = Math.cos(t * 0.6 + p.s) * 5; }
    p.x += (vx - camDx * p.z * 0.9) * dt * (h / 400); p.y += (vy + camDy * p.z * 0.9) * dt * (h / 400);
    if (p.x < -10) p.x += w + 20; else if (p.x > w + 10) p.x -= w + 20;
    if (p.y < -10) p.y += h + 20; else if (p.y > h + 10) p.y -= h + 20;
    var sz = h / 400 * p.z;
    if (T.ambient === 'snow') { c.globalAlpha = 0.5 + 0.4 * p.z * 0.6; c.fillStyle = '#fff'; c.beginPath(); c.arc(p.x, p.y, 1.6 * sz, 0, TAU); c.fill(); }
    else if (T.ambient === 'embers') { c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + p.s); c.fillStyle = i % 3 ? '#ff8a2a' : '#ffd24a'; c.fillRect(p.x, p.y, 2.2 * sz, 2.2 * sz); }
    else if (T.ambient === 'leaves') { c.globalAlpha = 0.6; c.fillStyle = i % 2 ? '#c8e86a' : '#f2c230'; c.save(); c.translate(p.x, p.y); c.rotate(t * 2 + p.s); c.fillRect(-2.4 * sz, -1 * sz, 4.8 * sz, 2 * sz); c.restore(); }
    else { c.globalAlpha = 0.28 * p.z; c.fillStyle = T.amb; c.beginPath(); c.arc(p.x, p.y, 1.4 * sz, 0, TAU); c.fill(); }
  }
  c.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* Ground                                                               */
/* ------------------------------------------------------------------ */
var MATCOL = { 2: ['#aee6fb', '#ffffff'], 3: ['#f2d58c', '#fff0bf'], 4: ['#b47c48', '#d9a56a'], 6: ['#f6fbff', '#ffffff'],
  5: ['#f2c230', '#fff3b0'], 8: ['#3a3d46', '#f4f1e8'], 9: ['#e2402f', '#ffffff'], 10: ['#0d0e13', '#6a70a8'], 11: ['#1b1d24', '#ffe23d'], 12: ['#1c1d22', '#4a4e58'] };
function drawGround(c, G, T, xl, xr, yb) {
  var tr = G.track, xs = tr.xs, ys = tr.ys, n = xs.length;
  var i0 = Math.max(0, RR.groundIndex(tr, xl) - 1), i1 = Math.min(n - 1, RR.groundIndex(tr, xr) + 2), i;
  var path = new Path2D();
  path.moveTo(xs[i0], yb - 40);
  for (i = i0; i <= i1; i++) path.lineTo(xs[i], Math.max(ys[i], yb - 40));
  path.lineTo(xs[i1], yb - 40); path.closePath();
  c.fillStyle = T.ground[0]; c.fill(path);
  c.save(); c.translate(0, -2.6); c.fillStyle = T.ground[1]; c.fill(path); c.translate(0, -3.4); c.fillStyle = T.ground[2]; c.fill(path); c.restore();
  // specks and strata, kept inside the ground shape
  c.save(); c.clip(path);
  c.lineWidth = 0.06; c.strokeStyle = T.strata;
  for (var k = 0; k < 2; k++) {
    var off = k ? 1.5 : 0.85;
    c.beginPath();
    for (i = i0; i <= i1; i++) { var yy = ys[i] - off - 0.1 * Math.sin(xs[i] * 0.7 + k); if (i === i0) c.moveTo(xs[i], yy); else c.lineTo(xs[i], yy); }
    c.stroke();
  }
  var cx0 = Math.floor(xl / 2.2), cx1 = Math.ceil(xr / 2.2);
  for (var cx = cx0; cx <= cx1; cx++) {
    for (var row = 0; row < 3; row++) {
      var h = hash(cx * 3.1 + row * 17.7 + tr.index);
      if (h < 0.35) continue;
      var px = cx * 2.2 + hash(cx + row * 5.5) * 1.8, gy = RR.groundY(tr, px);
      var py = gy - 1.1 - row * 1.9 - hash(cx * 1.7 + row) * 1.2, s = 0.05 + h * 0.08;
      c.fillStyle = T.speck[h > 0.7 ? 1 : 0];
      c.beginPath(); c.ellipse(px, py, s * 1.5, s, hash(cx + row) * 3, 0, TAU); c.fill();
    }
  }
  if (T.id === 'cinder') {
    c.strokeStyle = 'rgba(255,120,40,0.55)'; c.lineWidth = 0.05; c.lineCap = 'round';
    for (cx = cx0; cx <= cx1; cx++) {
      var hh = hash(cx * 9.3 + 3);
      if (hh < 0.6) continue;
      var qx = cx * 2.2 + hh, qy = RR.groundY(tr, qx) - 0.55;
      c.globalAlpha = 0.5 + 0.5 * Math.sin(G.t * 2 + cx);
      c.beginPath(); c.moveTo(qx, qy); c.lineTo(qx + 0.25, qy - 0.4); c.lineTo(qx + 0.1, qy - 0.8); c.lineTo(qx + 0.4, qy - 1.2); c.stroke();
    }
    c.globalAlpha = 1;
  }
  c.restore();
  // top crust, drawn per surface type
  var mats = tr.mats, base = RR.WORLDS[tr.worldIndex].mat;
  i = i0;
  while (i < i1) {
    var m = mats[i];
    var j = i;
    while (j < i1 && mats[j] === m && xs[j + 1] - xs[j] > 1e-6) j++;
    if (j === i) { i++; continue; }
    var th = m === 6 ? 0.36 : 0.3, col = MATCOL[m] && m !== base ? MATCOL[m] : (m === 1 && base !== 1 ? [T.speck[0], T.crustHi] : [T.crust, T.crustHi]);
    c.beginPath(); c.moveTo(xs[i], ys[i]);
    for (k = i + 1; k <= j; k++) c.lineTo(xs[k], ys[k]);
    for (k = j; k >= i; k--) c.lineTo(xs[k], ys[k] - th);
    c.closePath(); c.fillStyle = col[0]; c.fill();
    c.beginPath(); c.moveTo(xs[i], ys[i] - th); for (k = i + 1; k <= j; k++) c.lineTo(xs[k], ys[k] - th);
    c.lineWidth = 0.05; c.strokeStyle = 'rgba(0,0,0,0.28)'; c.stroke();
    c.beginPath(); c.moveTo(xs[i], ys[i] - 0.07); for (k = i + 1; k <= j; k++) c.lineTo(xs[k], ys[k] - 0.07);
    c.lineWidth = 0.05; c.strokeStyle = col[1]; c.stroke();
    if (m === 2) {          // ice: glassy streaks
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.035; c.beginPath();
      for (k = i; k < j; k++) { if (hash(k * 3.3) > 0.5) { c.moveTo(xs[k] + 0.1, ys[k] - 0.16); c.lineTo(Math.min(xs[k + 1], xs[k] + 0.9), lerp(ys[k], ys[k + 1], 0.4) - 0.2); } }
      c.stroke();
    } else if (m === 4) {   // planks
      c.strokeStyle = 'rgba(60,30,10,0.5)'; c.lineWidth = 0.04; c.beginPath();
      for (var bx = Math.ceil(xs[i] / 0.5) * 0.5; bx < xs[j]; bx += 0.5) { var by = RR.groundY(tr, bx); c.moveTo(bx, by); c.lineTo(bx, by - th); }
      c.stroke();
    } else if (m === 3) {   // sand: dots
      c.fillStyle = 'rgba(150,100,40,0.5)';
      for (bx = Math.ceil(xs[i] / 0.4) * 0.4; bx < xs[j]; bx += 0.4) { c.fillRect(bx, RR.groundY(tr, bx) - 0.12 - hash(bx) * 0.12, 0.05, 0.05); }
    } else if (m === 5) {   // steel ramp: black warning stripes
      c.strokeStyle = OUT; c.lineWidth = 0.11; c.lineCap = 'butt'; c.beginPath();
      for (bx = Math.ceil(xs[i] / 0.5) * 0.5; bx < xs[j] - 0.2; bx += 0.5) { by = RR.groundY(tr, bx); var by2 = RR.groundY(tr, bx + 0.18); c.moveTo(bx, by - 0.27); c.lineTo(bx + 0.18, by2 - 0.03); }
      c.stroke(); c.lineCap = 'round';
    } else if (m === 9) {   // kerb: every other block is white
      c.fillStyle = '#ffffff';
      for (bx = Math.ceil(xs[i]) ; bx < xs[j] - 0.1; bx += 1) { var e2 = Math.min(bx + 0.5, xs[j]); c.beginPath(); c.moveTo(bx, RR.groundY(tr, bx) - 0.02); c.lineTo(e2, RR.groundY(tr, e2) - 0.02); c.lineTo(e2, RR.groundY(tr, e2) - th + 0.02); c.lineTo(bx, RR.groundY(tr, bx) - th + 0.02); c.closePath(); c.fill(); }
    } else if (m === 10) {  // oil: a rainbow sheen on something very black
      var og = c.createLinearGradient(xs[i], 0, xs[j], 0);
      og.addColorStop(0, 'rgba(255,90,200,0)'); og.addColorStop(0.2, 'rgba(255,90,200,0.75)'); og.addColorStop(0.45, 'rgba(90,220,255,0.8)'); og.addColorStop(0.7, 'rgba(255,230,90,0.75)'); og.addColorStop(1, 'rgba(120,255,160,0)');
      c.beginPath(); c.moveTo(xs[i] + 0.2, ys[i] - 0.05); for (k = i + 1; k <= j; k++) c.lineTo(xs[k] - (k === j ? 0.2 : 0), ys[k] - 0.05);
      c.lineWidth = 0.07; c.strokeStyle = og; c.stroke();
      c.fillStyle = '#0d0e13';
      for (bx = xs[i] + 0.5; bx < xs[j] - 0.4; bx += 1.3) { c.beginPath(); c.ellipse(bx + hash(bx) * 0.5, RR.groundY(tr, bx) - th - 0.02, 0.2 + hash(bx + 2) * 0.16, 0.07, 0, 0, TAU); c.fill(); }
    } else if (m === 11) {  // boost strip: arrows running forward
      var ph = (G.t * 2.4) % 0.7, pulse = 0.65 + 0.35 * Math.sin(G.t * 9);
      c.strokeStyle = '#ffe23d'; c.lineWidth = 0.075; c.lineJoin = 'miter'; c.beginPath();
      for (bx = xs[i] + 0.1 + ph; bx < xs[j] - 0.25; bx += 0.7) { by = RR.groundY(tr, bx); c.moveTo(bx, by - 0.05); c.lineTo(bx + 0.15, by - th * 0.5); c.lineTo(bx, by - th + 0.05); }
      c.stroke(); c.lineJoin = 'round';
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * pulse;
      c.beginPath(); c.moveTo(xs[i], ys[i] + 0.02); for (k = i + 1; k <= j; k++) c.lineTo(xs[k], ys[k] + 0.02); c.lineWidth = 0.16; c.strokeStyle = '#ffb81f'; c.stroke();
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    i = j;
  }
  // outline of the whole surface
  c.beginPath(); c.moveTo(xs[i0], Math.max(ys[i0], yb - 40));
  for (i = i0 + 1; i <= i1; i++) c.lineTo(xs[i], Math.max(ys[i], yb - 40));
  c.lineWidth = 0.055; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke();
  // little tufts / stones on top
  if (T.id === 'pine' || T.id === 'dust' || T.id === 'orbit') {
    var tx0 = Math.floor(xl / 0.8), tx1 = Math.ceil(xr / 0.8);
    c.lineWidth = 0.045; c.lineCap = 'round';
    for (var tx = tx0; tx <= tx1; tx++) {
      var th2 = hash(tx * 5.7 + tr.index * 3);
      if (th2 < (T.id === 'pine' ? 0.35 : 0.75)) continue;
      var wx = tx * 0.8 + th2 * 0.6, gi = RR.groundIndex(tr, wx);
      if (xs[gi + 1] - xs[gi] < 0.05 || mats[gi] !== base) continue;
      var wy = RR.groundY(tr, wx);
      if (T.id === 'pine') {
        c.strokeStyle = th2 > 0.8 ? '#a8e36e' : '#58a83c';
        c.beginPath(); c.moveTo(wx, wy - 0.02); c.lineTo(wx - 0.08, wy + 0.14 + th2 * 0.08); c.moveTo(wx, wy - 0.02); c.lineTo(wx + 0.02, wy + 0.2 + th2 * 0.06); c.moveTo(wx, wy - 0.02); c.lineTo(wx + 0.1, wy + 0.13); c.stroke();
      } else {
        c.fillStyle = T.id === 'dust' ? '#c77a4a' : '#a9adc6';
        c.beginPath(); c.ellipse(wx, wy + 0.03, 0.09 + th2 * 0.06, 0.06, 0, 0, TAU); c.fill();
      }
    }
  }
}

/* a row of parked buses filling a jump gap, seen from the side */
var BUSCOL = ['#f2c230', '#e2402f', '#2f8fd6', '#19b56b', '#f4f1e8', '#ff8a24'];
function drawBuses(c, h) {
  var n = h.count || Math.max(1, Math.floor((h.x1 - h.x0 - 0.5) / 3.5)), i, k, top = h.rim - 0.3, bot = h.rim - 3.1, bw = 3.3;
  var x0 = h.x0 + ((h.x1 - h.x0) - n * 3.5) / 2 + 0.1;
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(h.x0, bot, h.x1 - h.x0, 0.16);
  for (i = 0; i < n; i++) {
    var x = x0 + i * 3.5, col = BUSCOL[(i * 2 + Math.floor(h.x0)) % BUSCOL.length];
    A.circ(c, x + 0.7, bot + 0.36, 0.36, '#1c1d22', 0.05); A.circ(c, x + 0.7, bot + 0.36, 0.15, '#8d939d', 0);
    A.circ(c, x + bw - 0.7, bot + 0.36, 0.36, '#1c1d22', 0.05); A.circ(c, x + bw - 0.7, bot + 0.36, 0.15, '#8d939d', 0);
    A.blob(c, [x, bot + 0.4, x, top - 0.1, x + 0.12, top, x + bw - 0.5, top, x + bw - 0.06, top - 0.5, x + bw, bot + 1.1, x + bw, bot + 0.4], col, 0.055);
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x + 0.2, top - 0.14, bw - 0.9, 0.07);
    for (k = 0; k < 4; k++) A.shape(c, [x + 0.22 + k * 0.62, top - 1.0, x + 0.72 + k * 0.62, top - 1.0, x + 0.72 + k * 0.62, top - 0.36, x + 0.22 + k * 0.62, top - 0.36], '#2b3550', 0.035);
    A.shape(c, [x + 2.74, top - 1.1, x + bw - 0.2, top - 1.1, x + bw - 0.34, top - 0.36, x + 2.74, top - 0.36], '#9fdcff', 0.035);
    c.fillStyle = 'rgba(255,255,255,0.4)'; for (k = 0; k < 4; k++) c.fillRect(x + 0.3 + k * 0.62, top - 0.56, 0.3, 0.12);
    A.line(c, [x + 0.04, bot + 1.2, x + bw - 0.04, bot + 1.2], 0.1, 'rgba(0,0,0,0.25)');
    A.circ(c, x + bw - 0.08, bot + 0.8, 0.09, '#fff3b8', 0.03); A.circ(c, x + 0.07, bot + 0.8, 0.07, '#e2402f', 0.03);
  }
}

function drawPits(c, G, T, xl, xr, yb) {
  var hz = G.track.hazards, i, x;
  for (i = 0; i < hz.length; i++) {
    var h = hz[i];
    if (h.x1 < xl || h.x0 > xr) continue;
    var g = c.createLinearGradient(0, h.rim, 0, h.rim - 9);
    g.addColorStop(0, T.pit[0]); g.addColorStop(1, T.pit[1]);
    c.fillStyle = g; c.fillRect(h.x0 - 0.3, yb - 2, h.x1 - h.x0 + 0.6, h.rim - yb + 2);
    if (h.type === 'bus') { drawBuses(c, h); continue; }
    if (h.type !== 'fall' && T.liquid) {
      var lg = c.createLinearGradient(0, h.y, 0, h.y - 3.5);
      lg.addColorStop(0, T.liquid[0]); lg.addColorStop(1, T.liquid[1]);
      c.fillStyle = lg; c.beginPath(); c.moveTo(h.x0 - 0.2, yb - 2);
      for (x = h.x0 - 0.2; x <= h.x1 + 0.25; x += 0.35) c.lineTo(x, h.y + Math.sin(x * 2.1 + G.t * 2.2) * 0.07 + Math.sin(x * 0.9 - G.t * 1.4) * 0.05);
      c.lineTo(h.x1 + 0.2, yb - 2); c.closePath(); c.fill();
      c.beginPath();
      for (x = h.x0 - 0.2; x <= h.x1 + 0.25; x += 0.35) { var yy = h.y + Math.sin(x * 2.1 + G.t * 2.2) * 0.07 + Math.sin(x * 0.9 - G.t * 1.4) * 0.05; if (x < h.x0) c.moveTo(x, yy); else c.lineTo(x, yy); }
      c.lineWidth = 0.07; c.strokeStyle = T.liquid[2]; c.stroke();
      if (h.type === 'lava') {
        c.globalCompositeOperation = 'lighter';
        var gg = c.createLinearGradient(0, h.y, 0, h.y + 3.2);
        gg.addColorStop(0, 'rgba(255,120,30,0.5)'); gg.addColorStop(1, 'rgba(255,90,20,0)');
        c.fillStyle = gg; c.fillRect(h.x0 - 0.3, h.y, h.x1 - h.x0 + 0.6, 3.2);
        c.globalCompositeOperation = 'source-over';
        // crust plates drifting on the lava
        c.fillStyle = 'rgba(70,20,10,0.55)';
        for (x = Math.ceil(h.x0); x < h.x1 - 0.6; x += 1.7) { var ox = Math.sin(G.t * 0.5 + x) * 0.2; c.beginPath(); c.ellipse(x + 0.4 + ox, h.y - 0.3 - hash(x) * 0.5, 0.42, 0.09, 0, 0, TAU); c.fill(); }
      } else if (h.type === 'ice') {
        c.fillStyle = '#eaf6ff'; c.strokeStyle = OUT; c.lineWidth = 0.04;
        for (x = h.x0 + 0.5; x < h.x1 - 1; x += 2.3) { var bob = Math.sin(G.t * 1.5 + x) * 0.05; c.beginPath(); c.rect(x + hash(x) * 0.5, h.y - 0.1 + bob, 0.9 + hash(x + 1) * 0.6, 0.2); c.fill(); c.stroke(); }
      } else {
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.04; c.beginPath();
        for (x = h.x0 + 0.4; x < h.x1 - 0.6; x += 1.3) { var sx = x + Math.sin(G.t + x) * 0.2; c.moveTo(sx, h.y - 0.3 - hash(x) * 0.7); c.lineTo(sx + 0.5, h.y - 0.3 - hash(x) * 0.7); }
        c.stroke();
      }
    }
  }
}

function drawLoop(c, lp, T) {
  var R0 = lp.R, i;
  // supports
  var legs = [-0.82, 0.82];
  for (i = 0; i < 2; i++) {
    var ax = lp.cx + Math.sin(legs[i]) * (R0 + 0.3) * 1.02, ay = lp.cy + Math.cos(legs[i] * 0.2) * R0 * 0.15;
    A.tube(c, [lp.cx + legs[i] * (R0 + 0.9), lp.cy - R0 - 0.1, ax + legs[i] * 0.5, ay], 0.14, T.loop[0], 0.07);
    A.tube(c, [lp.cx + legs[i] * (R0 + 0.9), lp.cy - R0 - 0.1, lp.cx + legs[i] * (R0 * 0.9), lp.cy - R0 * 0.55], 0.1, T.loop[0], 0.06);
  }
  // ring
  c.beginPath(); c.arc(lp.cx, lp.cy, R0 + 0.2, 0, TAU); c.lineWidth = 0.5; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.arc(lp.cx, lp.cy, R0 + 0.2, 0, TAU); c.lineWidth = 0.4; c.strokeStyle = T.loop[0]; c.stroke();
  c.beginPath(); c.arc(lp.cx, lp.cy, R0 + 0.06, 0, TAU); c.lineWidth = 0.1; c.strokeStyle = T.loop[1]; c.stroke();
  // ties
  c.lineWidth = 0.05; c.strokeStyle = 'rgba(0,0,0,0.3)'; c.beginPath();
  var n = Math.round(R0 * 7);
  for (i = 0; i < n; i++) { var a = TAU * i / n; c.moveTo(lp.cx + Math.cos(a) * (R0 + 0.12), lp.cy + Math.sin(a) * (R0 + 0.12)); c.lineTo(lp.cx + Math.cos(a) * (R0 + 0.38), lp.cy + Math.sin(a) * (R0 + 0.38)); }
  c.stroke();
}

/* What the rock overhead is made of in each world: [fill, inner shade, edge, kind] */
var ROOF = {
  dust:   { kind: 'rock' },
  pine:   { kind: 'roots', fill: '#4d3526', in2: '#38261b', edge: '#5fae3f' },
  race:   { kind: 'concrete', fill: '#8a8f99', in2: '#70757f', edge: '#f2c230' },
  frost:  { kind: 'ice', fill: '#8fb6ee', in2: '#6f97dc', edge: '#f6fbff' },
  cinder: { kind: 'rock' },
  orbit:  { kind: 'hull', fill: '#565b78', in2: '#43475f', edge: '#22e0c8' }
};
function drawRoofs(c, G, T, xl, xr, yt) {
  var ch = G.track.chains, i, k, st = ROOF[T.id] || ROOF.dust, kind = st.kind;
  var fill = st.fill || T.ground[1], in2 = st.in2 || T.ground[2], edge = st.edge || T.crust;
  for (i = 1; i < ch.length; i++) {
    if (ch[i].kind !== 'roof') continue;
    var p = ch[i].pts, top = yt + 30;
    if (p[2] < xl || p[0] > xr) continue;
    c.beginPath(); c.moveTo(p[0], top); c.lineTo(p[2], top);
    for (k = 4; k < p.length; k += 2) c.lineTo(p[k], p[k + 1]);
    c.closePath(); c.fillStyle = fill; c.fill();
    c.save(); c.clip();
    c.fillStyle = in2;
    c.beginPath(); for (k = 4; k < p.length; k += 2) c[k === 4 ? 'moveTo' : 'lineTo'](p[k], p[k + 1] + 1.4);
    c.lineTo(p[0], top + 30); c.lineTo(p[2], top + 30); c.closePath(); c.fill();
    if (kind === 'concrete' || kind === 'hull') {
      // slab joints
      c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 0.05; c.beginPath();
      for (var jx = Math.ceil(Math.max(p[0], xl) / 3) * 3; jx < Math.min(p[2], xr); jx += 3) { c.moveTo(jx, top); c.lineTo(jx, p[5] - 2); }
      c.stroke();
    }
    c.restore();
    // the underside
    c.beginPath(); c.moveTo(p[4], p[5]); for (k = 6; k < p.length; k += 2) c.lineTo(p[k], p[k + 1]);
    c.lineWidth = kind === 'concrete' || kind === 'hull' ? 0.26 : 0.32; c.strokeStyle = edge; c.stroke();
    if (kind === 'concrete') {
      // hazard stripes along the edge you can hit
      c.save(); c.setLineDash([0.5, 0.5]); c.lineCap = 'butt'; c.lineWidth = 0.26; c.strokeStyle = '#1c1d22';
      c.beginPath(); c.moveTo(p[4], p[5]); for (k = 6; k < p.length; k += 2) c.lineTo(p[k], p[k + 1]); c.stroke(); c.restore();
    }
    c.beginPath(); c.moveTo(p[2], top); c.lineTo(p[2], p[3]); for (k = 4; k < p.length; k += 2) c.lineTo(p[k], p[k + 1]); c.lineTo(p[0], top);
    c.lineWidth = 0.055; c.strokeStyle = OUT; c.stroke();
    // what hangs off it
    for (k = 6; k < p.length - 2; k += 6) {
      var hx = p[k], hy = p[k + 1], hh = hash(hx);
      if (hx < xl - 1 || hx > xr + 1) continue;
      if (kind === 'rock') {
        var hl = 0.3 + hh * 0.5; c.fillStyle = fill;
        c.beginPath(); c.moveTo(hx - 0.16, hy + 0.05); c.lineTo(hx, hy - hl); c.lineTo(hx + 0.16, hy + 0.05); c.closePath(); c.fill(); c.lineWidth = 0.045; c.strokeStyle = OUT; c.stroke();
      } else if (kind === 'ice') {
        var il = 0.25 + hh * 0.45; c.fillStyle = '#dff1ff';
        c.beginPath(); c.moveTo(hx - 0.11, hy + 0.05); c.lineTo(hx + 0.02, hy - il); c.lineTo(hx + 0.12, hy + 0.05); c.closePath(); c.fill(); c.lineWidth = 0.04; c.strokeStyle = OUT; c.stroke();
      } else if (kind === 'roots') {
        var rl = 0.25 + hh * 0.4; c.lineWidth = 0.06; c.strokeStyle = '#6d4a33';
        c.beginPath(); c.moveTo(hx, hy + 0.05); c.quadraticCurveTo(hx + 0.18 * (hh - 0.5), hy - rl * 0.5, hx + 0.1 * (hh - 0.5), hy - rl); c.stroke();
        if (hh > 0.55) A.circ(c, hx + 0.1 * (hh - 0.5), hy - rl, 0.07, '#74c24f', 0.025);
      } else if (kind === 'concrete' && (k % 18) === 6) {
        A.shape(c, [hx - 0.28, hy - 0.02, hx + 0.28, hy - 0.02, hx + 0.2, hy - 0.2, hx - 0.2, hy - 0.2], '#3a3d46', 0.04);
        A.circ(c, hx, hy - 0.2, 0.09, '#fff3b8', 0.02);
      } else if (kind === 'hull' && (k % 12) === 6) {
        A.circ(c, hx, hy - 0.02, 0.08, (Math.floor(G.t * 2 + hx) % 2) ? '#22e0c8' : '#0f6a60', 0.02);
      }
    }
  }
}

/* Something hanging over a jump. The solid part is the plain column from y0 upward; the drawing
   stays inside it at the bottom so what you see is what you hit. */
function drawBeams(c, G, T, xl, xr, yt) {
  var f = G.track.feats, i, k;
  for (i = 0; i < f.length; i++) {
    var b = f[i];
    if (b.t !== 'beam' || b.x1 < xl - 2 || b.x0 > xr + 2) continue;
    var x0 = b.x0, x1 = b.x1, y0 = b.y0, top = yt + 30, w = x1 - x0, mx = (x0 + x1) * 0.5, id = T.id;
    if (id === 'race') {
      // lighting rig: a steel lattice coming down from above, with a striped bumper
      c.fillStyle = 'rgba(40,44,54,0.55)'; c.fillRect(x0 + 0.1, y0 + 0.5, w - 0.2, top - y0);
      c.lineWidth = 0.09; c.strokeStyle = '#aab1bb'; c.beginPath();
      c.moveTo(x0 + 0.1, y0 + 0.5); c.lineTo(x0 + 0.1, top); c.moveTo(x1 - 0.1, y0 + 0.5); c.lineTo(x1 - 0.1, top);
      for (k = 0; y0 + 0.5 + k * w < top; k++) { var ya = y0 + 0.5 + k * w; c.moveTo(k % 2 ? x1 - 0.1 : x0 + 0.1, ya); c.lineTo(k % 2 ? x0 + 0.1 : x1 - 0.1, ya + w); }
      c.stroke();
      A.shape(c, [x0, y0, x1, y0, x1, y0 + 0.5, x0, y0 + 0.5], '#f2c230', 0.06);
      c.fillStyle = '#1c1d22'; for (k = 0; k < 3; k++) { var sx = x0 + 0.12 + k * (w - 0.24) / 3; c.beginPath(); c.moveTo(sx, y0 + 0.03); c.lineTo(sx + (w - 0.24) / 6, y0 + 0.03); c.lineTo(sx + (w - 0.24) / 3, y0 + 0.47); c.lineTo(sx + (w - 0.24) / 6, y0 + 0.47); c.closePath(); c.fill(); }
      A.circ(c, mx, y0 + 0.82, 0.13, (Math.floor(G.t * 3) % 2) ? '#ff4a4a' : '#6a1f1f', 0.03);
    } else if (id === 'orbit') {
      // docking pylon
      A.shape(c, [x0, y0, x1, y0, x1, top, x0, top], '#5f6483', 0.06);
      c.fillStyle = '#494d69'; c.fillRect(x0 + w * 0.6, y0, w * 0.4 - 0.03, top - y0);
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.05; c.beginPath(); for (k = 1; y0 + k * 1.6 < top; k++) { c.moveTo(x0, y0 + k * 1.6); c.lineTo(x1, y0 + k * 1.6); } c.stroke();
      A.shape(c, [x0 - 0.12, y0, x1 + 0.12, y0, x1 + 0.12, y0 + 0.3, x0 - 0.12, y0 + 0.3], '#d5d8ea', 0.05);
      A.circ(c, mx, y0 + 0.62, 0.12, (Math.floor(G.t * 2) % 2) ? '#22e0c8' : '#0f6a60', 0.03);
    } else if (id === 'pine') {
      // a dead trunk hung up in the canopy, broken end down
      A.shape(c, [x0, y0 + 0.25, x0 + w * 0.2, y0, x0 + w * 0.45, y0 + 0.18, x0 + w * 0.7, y0 + 0.02, x1, y0 + 0.3, x1 + 0.08, top, x0 - 0.08, top], '#7a5236', 0.06);
      c.fillStyle = '#5c3c27'; c.fillRect(x0 + w * 0.62, y0 + 0.3, w * 0.38, top - y0);
      c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 0.05; c.beginPath();
      for (k = 0; k < 3; k++) { var bx = x0 + w * (0.22 + k * 0.24); c.moveTo(bx, y0 + 0.5 + hash(bx) * 0.6); c.lineTo(bx + 0.04, top); }
      c.stroke();
      A.circ(c, x0 + 0.02, y0 + 1.5, 0.3, '#5fae3f', 0.045); A.circ(c, x1 - 0.02, y0 + 2.4, 0.26, '#74c24f', 0.045); A.circ(c, x0 + 0.2, y0 + 3.3, 0.22, '#5fae3f', 0.04);
    } else {
      // rock fang or giant icicle: thick above, blunt end down
      var ice = id === 'frost', col = ice ? '#bfe0ff' : T.ground[1], sh = ice ? '#8fb6ee' : T.ground[2], hot = id === 'cinder';
      A.shape(c, [x0 + w * 0.1, y0 + 0.12, x0 + w * 0.5, y0, x1 - w * 0.1, y0 + 0.12, x1, y0 + 1.2, x1 + 0.5, y0 + 5, x1 + 0.9, top, x0 - 0.9, top, x0 - 0.5, y0 + 5, x0, y0 + 1.2], col, 0.06);
      A.shape(c, [x0 + w * 0.62, y0 + 0.14, x1 - w * 0.1, y0 + 0.12, x1, y0 + 1.2, x1 + 0.5, y0 + 5, x1 + 0.9, top, x0 + w * 0.7, top], sh, 0);
      A.line(c, [x0 + w * 0.28, y0 + 0.5, x0 + w * 0.2, y0 + 2.4], 0.07, ice ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.14)');
      A.line(c, [x0 + w * 0.1, y0 + 0.12, x0 + w * 0.5, y0, x1 - w * 0.1, y0 + 0.12], 0.14, hot ? '#ff7a1f' : ice ? '#ffffff' : T.crust);
    }
  }
}

function drawFeats(c, G, T, xl, xr, behind) {
  var f = G.track.feats, i, tr = G.track;
  for (i = 0; i < f.length; i++) {
    var ft = f[i];
    if (ft.t === 'log' && !behind) {
      if (ft.x < xl - 1 || ft.x > xr + 1) continue;
      var m = RR.WORLDS[tr.worldIndex].logMat;
      if (m === 12) {      // a tyre lying in the road
        A.circ(c, ft.x, ft.y, ft.r, '#1c1d22', 0.05);
        A.circ(c, ft.x, ft.y, ft.r * 0.56, '#6a6f7a', 0.03); A.circ(c, ft.x, ft.y, ft.r * 0.3, T.ground[1], 0.03);
        c.lineWidth = 0.03; c.strokeStyle = '#3a3d46'; c.beginPath(); for (var tk = 0; tk < 8; tk++) { var ta = tk * Math.PI / 4 + ft.x; c.moveTo(ft.x + Math.cos(ta) * ft.r * 0.74, ft.y + Math.sin(ta) * ft.r * 0.74); c.lineTo(ft.x + Math.cos(ta) * ft.r * 0.96, ft.y + Math.sin(ta) * ft.r * 0.96); } c.stroke();
      } else if (m === 4) {
        A.circ(c, ft.x, ft.y, ft.r, '#9b6a3e', 0.05);
        A.circ(c, ft.x, ft.y, ft.r * 0.78, '#e0bb86', 0.03, '#7a5030');
        c.lineWidth = 0.025; c.strokeStyle = '#a57a4c'; c.beginPath(); c.arc(ft.x, ft.y, ft.r * 0.5, 0, TAU); c.moveTo(ft.x + ft.r * 0.25, ft.y); c.arc(ft.x, ft.y, ft.r * 0.25, 0, TAU); c.stroke();
      } else {
        var col = m === 2 ? '#bfeeff' : T.speck[0];
        c.save(); c.translate(ft.x, ft.y); c.rotate(hash(ft.x) * 3);
        A.shape(c, [-ft.r, -ft.r * 0.2, -ft.r * 0.6, ft.r * 0.8, ft.r * 0.2, ft.r, ft.r * 0.95, ft.r * 0.35, ft.r * 0.8, -ft.r * 0.6, 0, -ft.r], col, 0.05);
        A.line(c, [-ft.r * 0.4, ft.r * 0.5, ft.r * 0.15, ft.r * 0.7], 0.04, 'rgba(255,255,255,0.5)');
        c.restore();
      }
    } else if (ft.t === 'finish') {
      if (ft.x < xl - 4 || ft.x > xr + 4) continue;
      if (behind) {
        A.tube(c, [ft.x - 0.5, ft.y - 0.1, ft.x - 0.5, ft.y + 4.6], 0.16, '#e9edf2', 0.07);
      } else {
        A.tube(c, [ft.x + 0.5, ft.y - 0.1, ft.x + 0.5, ft.y + 4.6], 0.16, '#e9edf2', 0.07);
        // chequered banner
        var bw = 1.6, bh = 0.9, nx = 8, ny = 4, a, b;
        var wave = Math.sin(G.t * 3) * 0.04;
        c.fillStyle = '#fff'; c.fillRect(ft.x - bw * 0.5 - 0.3, ft.y + 3.6, bw + 0.6, bh);
        c.fillStyle = OUT;
        for (a = 0; a < nx; a++) for (b = 0; b < ny; b++) if ((a + b) % 2) c.fillRect(ft.x - bw * 0.5 - 0.3 + a * (bw + 0.6) / nx, ft.y + 3.6 + b * bh / ny + wave * (a % 2 ? 1 : -1) * 0, (bw + 0.6) / nx, bh / ny);
        c.lineWidth = 0.06; c.strokeStyle = OUT; c.strokeRect(ft.x - bw * 0.5 - 0.3, ft.y + 3.6, bw + 0.6, bh);
        A.circ(c, ft.x + 0.5, ft.y + 4.7, 0.16, '#f2c230', 0.05);
      }
    } else if (ft.t === 'sign' && behind) {
      if (ft.x < xl - 2 || ft.x > xr + 2) continue;
      A.tube(c, [ft.x, ft.y - 0.1, ft.x, ft.y + 1.7], 0.1, '#7a5236', 0.05);
      if (ft.kind === 'slow') {
        // warning triangle: something ahead does not want full gas
        A.shape(c, [ft.x - 0.66, ft.y + 1.22, ft.x + 0.66, ft.y + 1.22, ft.x, ft.y + 2.44], '#fff6e0', 0.06);
        c.beginPath(); c.moveTo(ft.x - 0.5, ft.y + 1.31); c.lineTo(ft.x + 0.5, ft.y + 1.31); c.lineTo(ft.x, ft.y + 2.25); c.closePath(); c.lineWidth = 0.1; c.strokeStyle = '#e2402f'; c.stroke();
        A.line(c, [ft.x, ft.y + 1.96, ft.x, ft.y + 1.68], 0.11, OUT); A.circ(c, ft.x, ft.y + 1.5, 0.055, OUT, 0);
        continue;
      }
      A.shape(c, [ft.x - 0.6, ft.y + 1.3, ft.x + 0.6, ft.y + 1.3, ft.x + 0.6, ft.y + 2.2, ft.x - 0.6, ft.y + 2.2], '#f2c230', 0.06);
      if (ft.kind === 'loop') { c.beginPath(); c.arc(ft.x, ft.y + 1.75, 0.25, 0, TAU); c.lineWidth = 0.09; c.strokeStyle = OUT; c.stroke(); }
      else A.shape(c, [ft.x - 0.35, ft.y + 1.5, ft.x + 0.1, ft.y + 1.5, ft.x + 0.1, ft.y + 1.42, ft.x + 0.4, ft.y + 1.75, ft.x + 0.1, ft.y + 2.08, ft.x + 0.1, ft.y + 2.0, ft.x - 0.35, ft.y + 1.9], OUT, 0);
    }
  }
  // start gate
  if (xl < 12) {
    var sx = 4.6, sy = 0;
    if (behind) {
      A.tube(c, [sx, sy - 0.1, sx, sy + 3.4], 0.14, '#e9edf2', 0.07);
      A.shape(c, [sx - 0.5, sy + 2.6, sx + 0.5, sy + 2.6, sx + 0.5, sy + 3.5, sx - 0.5, sy + 3.5], '#22252d', 0.06);
      var on = G.sim && G.sim.started;
      A.circ(c, sx, sy + 3.25, 0.14, on ? '#3a1a1a' : '#ff4a4a', 0.03); A.circ(c, sx, sy + 2.86, 0.14, on ? '#5dff7a' : '#173a20', 0.03);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Camera                                                               */
/* ------------------------------------------------------------------ */
R.newCamera = function () { return { x: 0, y: 0, vh: 9, tx: 0, ty: 0, shake: 0, px: 0, py: 0 }; };
R.camFollow = function (cam, s, tr, dt, aspect, snap, lead) {
  var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  var gy = RR.groundY(tr, s.x), hgt = Math.max(0, s.y - gy - 1);
  if (gy < tr.minY - 5) hgt = Math.min(hgt, 3);
  var vh = clamp(8.2 + sp * 0.2 + hgt * 0.5, 8.2, 19);
  if (aspect < 1.5) vh *= 1.15;
  var vw = vh * aspect;
  var tx = s.x + vw * (lead == null ? 0.16 : lead) + clamp(s.vx * 0.16, -2, 4);
  // keep both the bike and the ground under it on screen
  var ty = s.y - vh * 0.035 + clamp(s.vy * 0.1, -1.6, 1.6);
  var gAhead = RR.groundY(tr, s.x + vw * 0.3);
  if (gAhead > tr.minY - 5) ty = lerp(ty, (ty + gAhead + vh * 0.16) * 0.5, 0.35);
  // Anything you can hit your head on has to be on screen, clear of the timer, before you get to it:
  // pull back and tilt up when there is a roof or something hanging in the stretch ahead.
  if (tr.over === undefined) tr.over = tr.feats.filter(function (f) { return f.t === 'roof' || f.t === 'beam'; });
  var need = -1e9, x0v = s.x - 3, x1v = s.x + vw * 0.95, oi, ok2;
  for (oi = 0; oi < tr.over.length; oi++) {
    var of = tr.over[oi];
    if (of.x1 < x0v || of.x0 > x1v) continue;
    if (of.t === 'beam') { if (of.y0 > need) need = of.y0; continue; }
    for (ok2 = 0; ok2 < of.bot.length; ok2 += 2) if (of.bot[ok2] >= x0v && of.bot[ok2] <= x1v && of.bot[ok2 + 1] > need) need = of.bot[ok2 + 1];
  }
  if (need > -1e8) {
    var ex = need + 0.7 + vh * 0.27 - (ty + vh * 0.5);
    if (ex > 0) { if (ex > 7) ex = 7; vh += ex * 0.8; ty += ex * 0.5; cam.over = 1; } else cam.over = 0;
  } else cam.over = 0;
  {
  }
  if (snap) { cam.x = tx; cam.y = ty; cam.vh = vh; cam.px = cam.x; cam.py = cam.y; return; }
  var k = 1 - Math.exp(-dt * 6), kz = 1 - Math.exp(-dt * (cam.over && vh > cam.vh ? 4 : 1.7)), ky = 1 - Math.exp(-dt * 4.5);
  cam.px = cam.x; cam.py = cam.y;
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * ky; cam.vh += (vh - cam.vh) * kz;
  // never let the bike slide off the top or bottom edge
  var lim = cam.vh * 0.36;
  if (s.y - cam.y > lim) cam.y = s.y - lim; else if (cam.y - s.y > lim) cam.y = s.y + lim;
  if (cam.shake > 0) cam.shake = Math.max(0, cam.shake - dt * 2.4);
};

/* ------------------------------------------------------------------ */
/* Frame                                                                */
/* ------------------------------------------------------------------ */
var canvas, ctx, W = 0, H = 0, SC = 1;
R.init = function (cv) { canvas = cv; ctx = cv.getContext('2d', { alpha: false }); };
R.resize = function (w, h, scale) {
  W = w; H = h; SC = scale;
  canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
  bg.w = 0;
};
R.size = function () { return { w: W, h: H, scale: SC }; };

var popups = [];
R.popup = function (text, sub, col) { popups.push({ text: text, sub: sub || '', col: col || '#fff', age: 0, life: 1.5 }); if (popups.length > 2) popups.shift(); };
R.clearPopups = function () { popups.length = 0; };

function bikeView(G, v, def) {
  var b = G.bike, W0 = b.wh[0], W1 = b.wh[1], cm = b.com;
  return {
    RA: [W0.ax + cm[0] + W0.ux * v.comp[0], W0.ay + cm[1] + W0.uy * v.comp[0]],
    FA: [W1.ax + cm[0] + W1.ux * v.comp[1], W1.ay + cm[1] + W1.uy * v.comp[1]],
    spinR: v.wa[0], spinF: v.wa[1], rateR: v.ww[0], rateF: v.ww[1],
    lp: v.lp, stand: v.stand, crouch: v.crouch, rider: !v.noRider, headTilt: v.headTilt, look: G.look, t: G.t, wrecked: !!G.wipe
  };
}

/* the trail is a list of where the back wheel has been, newest last */
function drawTrail(c, G) {
  var tr = G.trail, p = G.look && G.look.paint, n = tr ? tr.length : 0, i;
  if (!p || !p.trail || n < 3) return;
  var prism = p.trail.cols === 'prism', w = p.trail.w;
  c.lineCap = 'round';
  for (i = 1; i < n; i++) {
    var k = i / (n - 1), a = tr[i - 1], b = tr[i];
    if (Math.abs(b.x - a.x) + Math.abs(b.y - a.y) > 3) continue;       // a jump in position (restart): leave a gap
    c.globalAlpha = k * k * 0.8 * (G.trailAmt || 0);
    c.strokeStyle = prism ? 'hsl(' + ((G.t * 220 + i * 16) % 360).toFixed(0) + ',100%,68%)' : (k > 0.6 ? p.trail.cols[0] : p.trail.cols[1]);
    c.lineWidth = w * (0.25 + k);
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  }
  c.globalAlpha = 1;
}

R.frame = function (G, dt) {
  var c = ctx, wi = G.track.worldIndex, T = TH[wi], cam = G.cam, tr = G.track, i;
  R.buildBackground(wi, W, H, Math.min(SC, 1.5));
  c.setTransform(SC, 0, 0, SC, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.drawImage(bg.sky, 0, 0, W, H);
  var S = H / cam.vh, vw = W / S;
  var shx = 0, shy = 0;
  if (cam.shake > 0) { shx = (Math.random() - 0.5) * cam.shake * 0.5; shy = (Math.random() - 0.5) * cam.shake * 0.5; }
  var cx = cam.x + shx, cy = cam.y + shy;
  // far scenery
  var par = [0.035, 0.09, 0.2], ref = H / 9;
  for (i = 0; i < 3; i++) {
    var ox = -((cx * par[i] * ref) % bg.TW); if (ox > 0) ox -= bg.TW;
    var oy = clamp((cy - (tr.minY + tr.maxY) * 0.5) * par[i] * ref * 0.55, -H * 0.1, H * 0.3) + H * [0.02, 0.05, 0.1][i];
    for (var x = ox; x < W; x += bg.TW) c.drawImage(bg.layers[i], x, oy, bg.TW, H);
    if (oy < 0) { c.fillStyle = T.far[i]; c.fillRect(0, H + oy - 1, W, -oy + 2); }
  }
  if (T.ambient !== 'stars') stepAmbient(c, T, W, H, dt, (cam.x - cam.px) * S / Math.max(dt, 1e-3), (cam.y - cam.py) * S / Math.max(dt, 1e-3), G.t);
  // world space from here (metres, y up)
  c.setTransform(SC * S, 0, 0, -SC * S, SC * (W * 0.5 - cx * S), SC * (H * 0.5 + cy * S));
  c.lineJoin = 'round'; c.lineCap = 'round';
  var xl = cx - vw * 0.5 - 1, xr = cx + vw * 0.5 + 1, yb = cy - cam.vh * 0.5 - 1, yt = cy + cam.vh * 0.5 + 1;
  drawPits(c, G, T, xl, xr, yb);
  // scenery behind the track
  var props = G.props;
  for (i = 0; i < props.length; i++) {
    var p = props[i];
    if (p.x < xl - 3 || p.x > xr + 3) continue;
    c.save(); c.translate(p.x, p.y); c.scale(p.f, 1);
    PROP[p.type](c, p, T, G.t);
    c.restore();
  }
  drawFeats(c, G, T, xl, xr, true);
  for (i = 0; i < tr.loops.length; i++) if (tr.loops[i].cx + tr.loops[i].R + 2 > xl && tr.loops[i].cx - tr.loops[i].R - 2 < xr) drawLoop(c, tr.loops[i], T);
  drawGround(c, G, T, xl, xr, yb);
  drawRoofs(c, G, T, xl, xr, yt);
  drawBeams(c, G, T, xl, xr, yt);
  drawFeats(c, G, T, xl, xr, false);

  // ghost of the best run
  if (G.ghostPose) {
    var gp = G.ghostPose, gs = A.sprite(RR.BIKE[gp.bike] || G.bikeDef, 48, true), gd = RR.BIKE[gp.bike] || G.bikeDef;
    c.save(); c.translate(gp.x, gp.y); c.rotate(gp.a); c.translate(-gd.com[0], -gd.com[1]);
    c.globalAlpha = 0.34; c.scale(1, -1);
    c.drawImage(gs.canvas, -gs.ox, -(gs.hM - gs.oy), gs.wM, gs.hM);
    c.restore(); c.globalAlpha = 1;
  }
  drawParts(c, 0);
  // shadow
  var v = G.vis, s = G.sim;
  var gy = RR.groundY(tr, v.x);
  if (gy > tr.minY - 5 && v.y - gy < 9 && v.y > gy) {
    var k = clamp(1 - (v.y - gy - 0.6) / 8, 0.15, 1);
    c.fillStyle = 'rgba(0,0,0,' + (0.24 * k) + ')';
    c.beginPath(); c.ellipse(v.x, gy + 0.03, 1.0 * k + 0.2, 0.13 * k + 0.02, RR.groundSlope(tr, v.x), 0, TAU); c.fill();
  }
  // ribbon of light behind the fancier paint jobs
  drawTrail(c, G);
  // bike
  if (!(G.wipe && G.wipe.hideBike)) {
    c.save(); c.translate(v.x, v.y); c.rotate(v.a); c.translate(-G.bike.com[0], -G.bike.com[1]);
    A.bike(c, G.bikeDef, bikeView(G, v, G.bikeDef));
    c.restore();
  }
  if (G.wipe) G.wipe.draw(c);
  drawParts(c, 1);

  // screen space again
  c.setTransform(SC, 0, 0, SC, 0, 0);
  var sp = s ? Math.sqrt(s.vx * s.vx + s.vy * s.vy) : 0;
  if (sp > 15 && R.quality > 0.5) {
    c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, H / 300);
    c.globalAlpha = clamp((sp - 15) / 24, 0, 0.3);
    c.beginPath();
    for (i = 0; i < 7; i++) { var ly = hash(i * 3.3 + Math.floor(G.t * 14)) * H, lx = hash(i * 7.1 + Math.floor(G.t * 14) * 1.3) * W; c.moveTo(lx, ly); c.lineTo(lx - H * 0.25, ly); }
    c.stroke(); c.globalAlpha = 1;
  }
  if (G.boostGlow > 0.01) {
    var bgd = c.createLinearGradient(0, 0, W * 0.25, 0);
    bgd.addColorStop(0, 'rgba(255,170,60,' + (0.28 * G.boostGlow) + ')'); bgd.addColorStop(1, 'rgba(255,170,60,0)');
    c.fillStyle = bgd; c.fillRect(0, 0, W * 0.25, H);
  }
  c.drawImage(bg.vig, 0, 0, W, H);
  if (G.flash > 0.01) { c.fillStyle = 'rgba(255,255,255,' + clamp(G.flash, 0, 0.6) + ')'; c.fillRect(0, 0, W, H); }
  // big words (flips, air time)
  for (i = popups.length - 1; i >= 0; i--) {
    var pp = popups[i]; pp.age += dt;
    if (pp.age > pp.life) { popups.splice(i, 1); continue; }
    var kk = pp.age / pp.life, scl = kk < 0.12 ? 0.5 + kk / 0.12 * 0.65 : kk < 0.2 ? 1.15 - (kk - 0.12) / 0.08 * 0.15 : 1;
    var fs = H * 0.115 * scl;
    c.save(); c.translate(W * 0.5, H * 0.3 - kk * H * 0.04 + (popups.length - 1 - i) * H * 0.02); c.transform(1, 0, -0.18, 1, 0, 0);
    c.globalAlpha = kk > 0.75 ? (1 - kk) / 0.25 : 1;
    c.font = '900 italic ' + fs + 'px ' + R.FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineJoin = 'round'; c.lineWidth = fs * 0.2; c.strokeStyle = OUT; c.strokeText(pp.text, 0, 0);
    c.fillStyle = pp.col; c.fillText(pp.text, 0, 0);
    if (pp.sub) { c.font = '800 italic ' + (fs * 0.4) + 'px ' + R.FONT; c.lineWidth = fs * 0.1; c.strokeText(pp.sub, 0, fs * 0.74); c.fillStyle = '#fff'; c.fillText(pp.sub, 0, fs * 0.74); }
    c.restore();
  }
  c.globalAlpha = 1;
};
R.FONT = '"Avenir Next Condensed","Arial Narrow","Roboto Condensed","HelveticaNeue-CondensedBold","Segoe UI",system-ui,sans-serif';

/* ------------------------------------------------------------------ */
/* Rag doll (the rider after a crash)                                   */
/* ------------------------------------------------------------------ */
/* points: 0 head, 1 shoulder, 2 hip, 3 elbow, 4 hand, 5 knee, 6 foot, 7 elbow2, 8 hand2, 9 knee2, 10 foot2 */
var STICKS = [[0, 1, 0.23], [1, 2, 0.5], [1, 3, 0.3], [3, 4, 0.29], [2, 5, 0.44], [5, 6, 0.46], [1, 7, 0.3], [7, 8, 0.29], [2, 9, 0.44], [9, 10, 0.46], [0, 2, 0.7]];
var J = [0, 0, 0, 0], poseTmp = {};
R.makeRag = function (s, def) {
  var b = s.b, ca = Math.cos(s.a), sa = Math.sin(s.a), pts = [], i;
  RR.riderPose(def, s.lp, 0, poseTmp);
  function W(lx, ly) { lx -= b.com[0]; ly -= b.com[1]; var wx = s.x + ca * lx - sa * ly, wy = s.y + sa * lx + ca * ly; var vx = s.vx - s.w * (wy - s.y), vy = s.vy + s.w * (wx - s.x); return { x: wx, y: wy, px: wx - vx / 120, py: wy - vy / 120 }; }
  var R0 = def.rider, sc = R0.scale || 1;
  pts.push(W(poseTmp.headX, poseTmp.headY), W(poseTmp.shX, poseTmp.shY), W(poseTmp.hipX, poseTmp.hipY));
  A.ik(poseTmp.shX, poseTmp.shY, R0.grip[0], R0.grip[1], 0.3 * sc, 0.29 * sc, -1, J); pts.push(W(J[0], J[1]), W(J[2], J[3]));
  A.ik(poseTmp.hipX, poseTmp.hipY, R0.peg[0], R0.peg[1] + 0.07, 0.44 * sc, 0.46 * sc, 1, J); pts.push(W(J[0], J[1]), W(J[2], J[3]));
  pts.push(W(pts.length ? poseTmp.shX + 0.2 : 0, poseTmp.shY - 0.2), W(poseTmp.shX + 0.45, poseTmp.shY - 0.3), W(poseTmp.hipX + 0.3, poseTmp.hipY - 0.2), W(poseTmp.hipX + 0.2, poseTmp.hipY - 0.6));
  // a shove away from the bike so the rider visibly comes off
  for (i = 0; i < pts.length; i++) { pts[i].px -= (-sa * 2.2 + (Math.random() - 0.5) * 1.5) / 120; pts[i].py -= (ca * 2.2 + Math.random() * 1.5) / 120; }
  return { pts: pts, sc: sc, t: 0 };
};
R.stepRag = function (rag, tr, g, dt, noGround) {
  var pts = rag.pts, i, k, p;
  rag.t += dt;
  for (i = 0; i < pts.length; i++) {
    p = pts[i];
    var vx = (p.x - p.px) * 0.995, vy = (p.y - p.py) * 0.995;
    p.px = p.x; p.py = p.y;
    p.x += vx; p.y += vy - g * dt * dt;
  }
  for (k = 0; k < 5; k++) {
    for (i = 0; i < STICKS.length; i++) {
      var a = pts[STICKS[i][0]], b = pts[STICKS[i][1]], L = STICKS[i][2] * rag.sc * (i >= 2 && i <= 9 ? (rag.limb || 1) : 1);
      var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      if (i === 10 && d > L * 0.75) continue;       // neck brace: only stops the head folding into the hips
      var f = (d - L) / d * 0.5;
      a.x += dx * f; a.y += dy * f; b.x -= dx * f; b.y -= dy * f;
    }
    for (i = 0; i < pts.length && !noGround; i++) {
      p = pts[i];
      var r = i === 0 ? 0.15 : 0.07, gy = RR.groundY(tr, p.x);
      if (gy < tr.minY - 5) continue;
      if (p.y < gy + r) {
        var sl = RR.groundSlope(tr, p.x), nx = -Math.sin(sl), ny = Math.cos(sl), pen = (gy + r - p.y) * ny;
        p.x += nx * pen; p.y += ny * pen;
        // scrub off sliding speed
        var tvx = p.x - p.px, tvy = p.y - p.py, tt = tvx * ny - tvy * nx;
        p.px += ny * tt * 0.12; p.py -= nx * tt * 0.12;
      }
    }
  }
};
var XRAY = { head: 'skull' };
/* mode: 'xray' = black with the bones showing, 'paper' = with a white paper edge round it */
R.drawRag = function (c, rag, def, mode) {
  var p = rag.pts, s = def.suit, sc = rag.sc, x = mode === 'xray', pass, ghost = def._skin && def._skin.ghost && !x;
  if (x) s = ['#0a0b10', '#0a0b10', '#0a0b10'];
  function lm(a, b, d, w1, w2, col) {
    if (pass) { c.lineWidth = w1 + 0.14; c.strokeStyle = '#ffffff'; c.beginPath(); c.moveTo(p[a].x, p[a].y); c.lineTo(p[b].x, p[b].y); c.lineTo(p[d].x, p[d].y); c.stroke(); return; }
    c.lineWidth = w1 + 0.04; c.strokeStyle = OUT; c.beginPath(); c.moveTo(p[a].x, p[a].y); c.lineTo(p[b].x, p[b].y); c.lineTo(p[d].x, p[d].y); c.stroke();
    c.lineWidth = w1; c.strokeStyle = col; c.beginPath(); c.moveTo(p[a].x, p[a].y); c.lineTo(p[b].x, p[b].y); c.stroke();
    c.lineWidth = w2; c.beginPath(); c.moveTo(p[b].x, p[b].y); c.lineTo(p[d].x, p[d].y); c.stroke();
    if (x || (def._skin && def._skin.bones)) { c.lineWidth = 0.03 * sc; c.strokeStyle = '#f1ecdc'; c.beginPath(); c.moveTo(p[a].x, p[a].y); c.lineTo(p[b].x, p[b].y); c.lineTo(p[d].x, p[d].y); c.stroke(); }
  }
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (ghost) c.globalAlpha = 0.7;
  for (pass = mode === 'paper' ? 1 : 0; pass >= 0; pass--) {
    lm(2, 9, 10, 0.13 * sc, 0.105 * sc, A.shade(s[1], 0.62)); lm(1, 7, 8, 0.085 * sc, 0.075 * sc, A.shade(s[0], 0.62));
    if (pass) { c.lineWidth = 0.36 * sc; c.strokeStyle = '#ffffff'; c.beginPath(); c.moveTo(p[2].x, p[2].y); c.lineTo(p[1].x, p[1].y); c.stroke(); A.circ(c, p[0].x, p[0].y, 0.21 * sc, '#ffffff', 0); }
    else {
      c.lineWidth = 0.27 * sc; c.strokeStyle = OUT; c.beginPath(); c.moveTo(p[2].x, p[2].y); c.lineTo(p[1].x, p[1].y); c.stroke();
      c.lineWidth = 0.22 * sc; c.strokeStyle = s[0]; c.beginPath(); c.moveTo(p[2].x, p[2].y); c.lineTo(p[1].x, p[1].y); c.stroke();
      if (x || (def._skin && def._skin.bones)) {
        var tx = p[1].x - p[2].x, ty = p[1].y - p[2].y, tl = Math.sqrt(tx * tx + ty * ty) || 1, nx = -ty / tl * 0.08 * sc, ny = tx / tl * 0.08 * sc, k;
        c.lineWidth = 0.03 * sc; c.strokeStyle = '#f1ecdc'; c.beginPath(); c.moveTo(p[2].x, p[2].y); c.lineTo(p[1].x, p[1].y);
        for (k = 0; k < 3; k++) { var f = 0.45 + k * 0.2; c.moveTo(p[2].x + tx * f + nx, p[2].y + ty * f + ny); c.lineTo(p[2].x + tx * f - nx, p[2].y + ty * f - ny); }
        c.stroke();
      }
      var ha = Math.atan2(p[0].y - p[1].y, p[0].x - p[1].x) - Math.PI / 2;
      if (x) A.head(c, p[0].x, p[0].y, 0.15 * sc, ha, XRAY, 0); else A.helmet(c, p[0].x, p[0].y, 0.15 * sc, ha, def, def.kind);
    }
    lm(2, 5, 6, 0.14 * sc, 0.115 * sc, s[1]); if (!pass) A.circ(c, p[6].x, p[6].y, 0.08 * sc, s[2], 0.02);
    lm(1, 3, 4, 0.095 * sc, 0.08 * sc, s[0]); if (!pass) A.circ(c, p[4].x, p[4].y, 0.05 * sc, s[2], 0.02);
  }
  c.globalAlpha = 1;
};

/* small picture of a track's shape for the menu */
R.trackThumb = function (cv, tr, col, col2) {
  var c = cv.getContext('2d'), w = cv.width, h = cv.height, i;
  c.clearRect(0, 0, w, h);
  var x0 = 0, x1 = tr.finishX + 4, lo = tr.minY - 1, hi = tr.maxY + 3;
  for (i = 0; i < tr.loops.length; i++) hi = Math.max(hi, tr.loops[i].cy + tr.loops[i].R + 1);
  var sx = w / (x1 - x0), sy = Math.min(sx * 5, h * 0.84 / (hi - lo)), oy = h * 0.9;
  function X(x) { return (x - x0) * sx; } function Y(y) { return oy - (y - lo) * sy; }
  c.beginPath(); c.moveTo(0, h);
  for (i = 0; i < tr.xs.length; i++) { if (tr.xs[i] < x0 - 5 || tr.xs[i] > x1 + 5) continue; c.lineTo(X(tr.xs[i]), Math.min(h, Y(tr.ys[i]))); }
  c.lineTo(w, h); c.closePath(); c.fillStyle = col; c.fill();
  c.lineWidth = Math.max(1.5, h * 0.035); c.strokeStyle = col2; c.lineJoin = 'round'; c.stroke();
  for (i = 0; i < tr.loops.length; i++) { c.beginPath(); c.ellipse(X(tr.loops[i].cx), Y(tr.loops[i].cy), Math.max(4, tr.loops[i].R * sx * 2.4), tr.loops[i].R * sy, 0, 0, TAU); c.stroke(); }
};
})(typeof window !== 'undefined' ? window : globalThis);
