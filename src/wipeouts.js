/* Ridge Riot: what happens to the rider when the helmet touches down.
   Every bike has its own. They are all for show: the run is already over, and
   a tap restarts as soon as the first moment has passed.
   Each one is built from the same few parts: the rag doll, a frozen "figure"
   of the rider that can be moved about as one piece, and loose bits that fall
   and bounce (the particle system does those). */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var R = RR.Render, A = RR.Art, TAU = Math.PI * 2, OUT = '#15171d';
function rnd(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function Au() { return RR.Audio; }

/* the rider as a stiff cut-out: the rag doll's starting pose, measured from the hips */
function figure(G) {
  var rag = R.makeRag(G.sim, G.bikeDef), p = rag.pts, hx = p[2].x, hy = p[2].y, a = G.sim.a, ca = Math.cos(-a), sa = Math.sin(-a), i, loc = [];
  for (i = 0; i < p.length; i++) { var dx = p[i].x - hx, dy = p[i].y - hy; loc.push({ x: dx * ca - dy * sa, y: dx * sa + dy * ca }); }
  return { pts: loc, sc: rag.sc, x: hx, y: hy, a: a, vx: G.sim.vx, vy: G.sim.vy, w: 0, sx: 1, sy: 1 };
}
function drawFigure(c, f, dd, mode) {
  c.save(); c.translate(f.x, f.y); c.rotate(f.a); c.scale(f.sx, f.sy);
  R.drawRag(c, f, dd, mode);
  c.restore();
}
function headBit(dd, sc) { return function (c) { A.helmet(c, 0, 0, 0.15 * sc, 0, dd, dd.kind); }; }
function dropHead(G, dd, x, y, vx, vy, sc) {
  return R.emit(8, x, y, vx, vy, 6, 0.15 * sc, '', { draw: headBit(dd, sc), bounce: 0.5, roll: 1, g: 1, front: 1, vr: rnd(-8, 8), fade: 0.1,
    onHit: function (p, v) { Au().knock(v); } });
}
function puff(x, y, n, col, sp, big) { for (var i = 0; i < n; i++) R.emit(0, x + rnd(-0.3, 0.3), y + rnd(-0.2, 0.4), rnd(-sp, sp), rnd(-sp * 0.3, sp), rnd(0.4, 0.9), rnd(0.16, 0.3) * (big || 1), col, { gr: rnd(0.6, 1.4), a: 0.7, drag: 2.5, front: 1 }); }
function suitCols(dd) { return [dd.suit[0], dd.suit[1], dd.suit[2], '#ffffff']; }
function groundAt(G, x) { return RR.groundY(G.track, x); }

var KINDS = {};

/* the classic: rag doll, then stars going round the helmet */
KINDS.stars = {
  start: function (w, G) { w.rag = R.makeRag(G.sim, G.bikeDef); w.said = false; },
  step: function (w, G, dt) { R.stepRag(w.rag, G.track, G.sim.g, dt); w.fx = w.rag.pts[2].x; w.fy = w.rag.pts[2].y; if (w.t > 0.55 && !w.said) { w.said = true; Au().wipe('stars'); } },
  draw: function (w, c, dd) {
    R.drawRag(c, w.rag, dd);
    if (w.t < 0.55) return;
    var h = w.rag.pts[0], k = Math.min(1, (w.t - 0.55) * 4), i;
    for (i = 0; i < 3; i++) {
      var a = w.t * 5 + i * TAU / 3, x = h.x + Math.cos(a) * 0.36, y = h.y + 0.4 + Math.sin(a) * 0.09, s = 0.1 * k * (0.75 + 0.25 * Math.sin(a));
      c.save(); c.translate(x, y); c.rotate(w.t * 3 + i); c.beginPath();
      for (var q = 0; q < 10; q++) { var sa = q * Math.PI / 5, sr = q % 2 ? s * 0.45 : s; c[q ? 'lineTo' : 'moveTo'](Math.sin(sa) * sr, Math.cos(sa) * sr); }
      c.closePath(); c.fillStyle = '#ffe23d'; c.fill(); c.lineWidth = 0.025; c.strokeStyle = OUT; c.stroke(); c.restore();
    }
  }
};

/* same again but with birds */
KINDS.birds = {
  start: function (w, G) { w.rag = R.makeRag(G.sim, G.bikeDef); w.said = false; },
  step: function (w, G, dt) { R.stepRag(w.rag, G.track, G.sim.g, dt); w.fx = w.rag.pts[2].x; w.fy = w.rag.pts[2].y; if (w.t > 0.5 && !w.said) { w.said = true; Au().wipe('birds'); } },
  draw: function (w, c, dd) {
    R.drawRag(c, w.rag, dd);
    if (w.t < 0.5) return;
    var h = w.rag.pts[0], k = Math.min(1, (w.t - 0.5) * 4), i;
    for (i = 0; i < 3; i++) {
      var a = w.t * 4.2 + i * TAU / 3, x = h.x + Math.cos(a) * 0.42, y = h.y + 0.46 + Math.sin(a) * 0.1, dir = -Math.sin(a) > 0 ? 1 : -1, fl = Math.sin(w.t * 26 + i * 2) * 0.09;
      c.save(); c.translate(x, y); c.scale(dir * k, k);
      A.circ(c, 0, 0, 0.075, i === 1 ? '#7ad3ff' : '#ffe23d', 0.022);
      A.shape(c, [0.06, 0.02, 0.15, 0, 0.06, -0.03], '#ff8a1f', 0.016);
      A.shape(c, [-0.03, 0.02, -0.12, 0.07 + fl, 0.03, 0.05], i === 1 ? '#4aa8e0' : '#f2b632', 0.018);
      A.circ(c, 0.03, 0.025, 0.014, OUT, 0);
      c.restore();
    }
  }
};

/* blows up like a balloon, and goes off like one */
KINDS.pop = {
  start: function (w, G) { w.f = figure(G); w.popped = false; Au().wipe('inflate'); },
  step: function (w, G, dt, dd) {
    var f = w.f; f.x += f.vx * 0.25 * dt; f.y += (0.6 + f.vy * 0.1) * dt; f.a += 1.4 * dt;
    w.fx = f.x; w.fy = f.y;
    if (!w.popped && w.t > 0.42) {
      w.popped = true; Au().wipe('pop'); G.cam.shake = Math.max(G.cam.shake, 0.6);
      var cols = suitCols(dd), i;
      for (i = 0; i < 46; i++) R.emit(4, f.x + rnd(-0.3, 0.3), f.y + 0.4 + rnd(-0.3, 0.3), rnd(-7, 7), rnd(-2, 8), rnd(1.0, 2.0), rnd(0.06, 0.11), cols[i % 4], { g: 0.4, drag: 1.4, vr: rnd(-9, 9), front: 1, rot: rnd(0, 6) });
      R.emit(5, f.x, f.y + 0.4, 0, 0, 0.3, 0.3, '#ffffff', { gr: 6, a: 0.9, front: 1, w: 0.08 });
      dropHead(G, dd, f.x, f.y + 0.9, rnd(-2, 2), 5, f.sc);
    }
  },
  draw: function (w, c, dd) {
    if (w.popped) return;
    var f = w.f, k = w.t / 0.42, r = 0.2 + 0.62 * k * k + Math.sin(w.t * 60) * 0.015;
    c.save(); c.translate(f.x, f.y); c.rotate(f.a);
    // little arms and legs sticking out of a swelling suit
    A.tube(c, [0, 0.3, -r * 0.9, 0.3 - r * 0.9], 0.11, dd.suit[1], 0.04); A.tube(c, [0, 0.3, r * 0.9, 0.3 - r * 0.9], 0.11, dd.suit[1], 0.04);
    A.tube(c, [0, 0.3, -r * 1.05, 0.4], 0.08, dd.suit[0], 0.04); A.tube(c, [0, 0.3, r * 1.05, 0.5], 0.08, dd.suit[0], 0.04);
    A.circ(c, 0, 0.3, r, dd.suit[0], 0.04);
    c.beginPath(); c.arc(0, 0.3, r * 0.7, 0.4, 1.3); c.lineWidth = 0.05; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.stroke();
    A.helmet(c, 0, 0.3 + r + 0.1, 0.15 * f.sc, 0, dd, dd.kind);
    c.restore();
  }
};

/* turns into a tumbleweed and rolls off into the sunset */
KINDS.tumble = {
  start: function (w, G, dd) {
    var s = G.sim; puff(s.x, s.y, 12, R.THEMES[G.track.worldIndex].dust, 3, 1.3); Au().wipe('tumble');
    w.ball = R.emit(8, s.x, s.y + 0.3, Math.max(3.5, s.vx * 0.6), 3, 7, 0.42, '', { bounce: 0.45, roll: 1, g: 1, front: 1, fade: 0.1, draw: function (c, p) {
      var i, rr = p.r;
      c.lineWidth = 0.035; c.strokeStyle = '#8a5a34';
      c.beginPath(); for (i = 0; i < 16; i++) { var a = i * 2.4, b = a + 2.2 + (i % 3) * 0.5; c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); c.quadraticCurveTo(Math.cos(a + 1) * rr * 0.2, Math.sin(a + 1) * rr * 0.2, Math.cos(b) * rr, Math.sin(b) * rr); } c.stroke();
      c.strokeStyle = '#c99a5c'; c.lineWidth = 0.025; c.beginPath(); c.arc(0, 0, rr * 0.96, 0, TAU); c.stroke();
      A.helmet(c, 0, rr * 0.2, 0.15, 0.4, dd, dd.kind);
      A.tube(c, [-rr * 0.5, -rr * 0.3, -rr * 1.15, -rr * 0.5], 0.09, dd.suit[2], 0.03);       // a boot sticking out
    }, onHit: function (p, v) { Au().knock(v * 0.6); } });
  },
  step: function (w, G) { var p = w.ball; if (p.vx < 3 && p.age < 5) p.vx += 0.03; w.fx = p.x; w.fy = p.y; },
  draw: function () {}
};

/* a puff of smoke, and a goat wearing your helmet trots away */
KINDS.goat = {
  start: function (w, G) { var s = G.sim; puff(s.x, s.y, 16, '#ffffff', 3.5, 1.5); w.x = s.x; w.y = groundAt(G, s.x); w.vy = 0; w.out = false; Au().wipe('poof'); },
  step: function (w, G, dt) {
    if (w.t < 0.25) return;
    if (!w.out) { w.out = true; Au().wipe('bleat'); }
    w.x += 3.2 * dt;
    var gy = groundAt(G, w.x); if (gy < G.track.minY - 5) gy = w.y;
    w.vy -= 22 * dt; w.y += w.vy * dt;
    if (w.y <= gy) { w.y = gy; w.vy = 2.6; }
    w.fx = w.x; w.fy = w.y + 0.5;
  },
  draw: function (w, c, dd) {
    if (w.t < 0.25) return;
    var k = Math.min(1, (w.t - 0.25) * 6), air = clamp((w.y - groundAt({ track: dd._track }, w.x)) * 2, 0, 1), sw = Math.sin(w.t * 16) * 0.16;
    c.save(); c.translate(w.x, w.y); c.scale(k, k);
    var col = '#f4f1e8', dk = '#cfc8b8';
    A.tube(c, [-0.28, 0.42, -0.3 - sw, 0.02], 0.07, dk, 0.03); A.tube(c, [0.2, 0.42, 0.22 + sw, 0.02], 0.07, dk, 0.03);
    A.blob(c, [-0.46, 0.38, -0.4, 0.74, 0.2, 0.78, 0.4, 0.6, 0.34, 0.36, -0.2, 0.3], col, 0.035);
    A.tube(c, [-0.34, 0.42, -0.36 + sw, 0.02], 0.07, col, 0.03); A.tube(c, [0.26, 0.42, 0.28 - sw, 0.02], 0.07, col, 0.03);
    A.shape(c, [-0.44, 0.66, -0.58, 0.82, -0.46, 0.76], col, 0.03);                             // tail
    A.blob(c, [0.26, 0.6, 0.34, 1.0, 0.56, 1.08, 0.74, 0.92, 0.72, 0.76, 0.5, 0.62], col, 0.035); // neck and head
    A.shape(c, [0.6, 0.74, 0.56, 0.52, 0.66, 0.7], col, 0.03);                                    // beard
    A.circ(c, 0.64, 0.92, 0.022, OUT, 0);
    A.curve(c, [0.4, 1.06, 0.3, 1.24, 0.14, 1.24], 0.045, '#8a6a48', 0.03);                       // horn
    A.helmet(c, 0.47, 1.08, 0.13, 0.5, dd, dd.kind);
    c.restore();
  }
};

/* a headstone pops up, and a small ghost leaves */
KINDS.tomb = {
  start: function (w, G) { w.rag = R.makeRag(G.sim, G.bikeDef); w.up = false; },
  step: function (w, G, dt) {
    R.stepRag(w.rag, G.track, G.sim.g, dt); w.fx = w.rag.pts[2].x; w.fy = w.rag.pts[2].y;
    if (!w.up && w.t > 0.7) { w.up = true; w.sx = w.rag.pts[2].x - 0.5; w.sy = groundAt(G, w.sx); Au().wipe('bell'); puff(w.sx, w.sy, 6, R.THEMES[G.track.worldIndex].dust, 1.5); }
  },
  draw: function (w, c, dd) {
    R.drawRag(c, w.rag, dd);
    if (!w.up) return;
    var k = Math.min(1, (w.t - 0.7) * 5), rise = k < 0.7 ? k / 0.7 * 1.12 : 1.12 - (k - 0.7) / 0.3 * 0.12, x = w.sx, y = w.sy - 1.0 + rise;
    c.save(); c.beginPath(); c.rect(x - 1, w.sy - 0.02, 2, 3); c.clip();
    A.blob(c, [x - 0.36, y - 0.1, x - 0.36, y + 0.72, x, y + 1.02, x + 0.36, y + 0.72, x + 0.36, y - 0.1], '#aab1bb', 0.05);
    c.save(); c.translate(x, y + 0.52); c.scale(1, -1); c.font = '900 0.26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#4a4f5a'; c.fillText('RIP', 0, 0); c.restore();
    A.line(c, [x - 0.2, y + 0.2, x + 0.2, y + 0.2], 0.035, '#8d939d');
    c.restore();
    // the ghost
    var gt = w.t - 0.95;
    if (gt > 0 && gt < 2.6) {
      var gx = x + 0.2 + Math.sin(gt * 3) * 0.25, gy = w.sy + 0.9 + gt * 1.1, al = gt > 1.8 ? (2.6 - gt) / 0.8 : Math.min(1, gt * 4);
      c.globalAlpha = 0.85 * al;
      A.blob(c, [gx - 0.26, gy + 0.1, gx - 0.2, gy + 0.5, gx, gy + 0.62, gx + 0.2, gy + 0.5, gx + 0.26, gy + 0.1, gx + 0.26, gy - 0.34, gx + 0.1, gy - 0.22, gx, gy - 0.4, gx - 0.12, gy - 0.22, gx - 0.26, gy - 0.36], '#f4f8ff', 0.035);
      A.circ(c, gx - 0.08, gy + 0.3, 0.035, OUT, 0); A.circ(c, gx + 0.09, gy + 0.3, 0.035, OUT, 0); A.circ(c, gx, gy + 0.16, 0.04, OUT, 0);
      c.beginPath(); c.ellipse(gx, gy + 0.78, 0.2, 0.06, 0, 0, TAU); c.lineWidth = 0.04; c.strokeStyle = '#ffe23d'; c.stroke();
      c.globalAlpha = 1;
    }
  }
};

/* freezes solid and breaks like a plate */
KINDS.shatter = {
  start: function (w, G, dd) {
    var f = figure(G), cols = suitCols(dd), i;
    Au().wipe('smash'); G.cam.shake = 1;
    for (i = 0; i < 26; i++) {
      var src = f.pts[i % f.pts.length], ca = Math.cos(f.a), sa = Math.sin(f.a), x = f.x + src.x * ca - src.y * sa + rnd(-0.1, 0.1), y = f.y + src.x * sa + src.y * ca + rnd(-0.1, 0.1);
      R.emit(8, x, y, f.vx * 0.5 + rnd(-4, 4), f.vy * 0.3 + rnd(1, 7), rnd(2.5, 4), rnd(0.06, 0.14), cols[i % 3], { bounce: 0.35, g: 1, front: 1, vr: rnd(-14, 14), rot: rnd(0, 6), fade: 0.25,
        tri: [rnd(-1, -0.3), rnd(-1, 0), rnd(0.3, 1), rnd(-0.8, 0.2), rnd(-0.4, 0.4), rnd(0.5, 1.1)],
        draw: function (c, p) { var t = p.tri, r = p.r; c.beginPath(); c.moveTo(t[0] * r, t[1] * r); c.lineTo(t[2] * r, t[3] * r); c.lineTo(t[4] * r, t[5] * r); c.closePath(); c.fillStyle = p.col; c.fill(); c.lineWidth = 0.022; c.strokeStyle = OUT; c.stroke();
          c.beginPath(); c.moveTo(t[0] * r * 0.6, t[1] * r * 0.6); c.lineTo(t[2] * r * 0.6, t[3] * r * 0.6); c.lineWidth = 0.014; c.strokeStyle = 'rgba(255,255,255,0.6)'; c.stroke(); } });
    }
    var hp = f.pts[0], ca2 = Math.cos(f.a), sa2 = Math.sin(f.a);
    w.head = dropHead(G, dd, f.x + hp.x * ca2 - hp.y * sa2, f.y + hp.x * sa2 + hp.y * ca2, f.vx * 0.4 + rnd(-1, 2), 5, f.sc);
    for (i = 0; i < 3; i++) R.emit(5, f.x, f.y + 0.3, 0, 0, 0.3 + i * 0.08, 0.3, '#ffffff', { gr: 5 + i * 2, a: 0.8, front: 1, w: 0.05 });
  },
  step: function (w) { w.fx = w.head.x; w.fy = w.head.y; },
  draw: function () {}
};

/* a good hard electric shock, then a small pile of ash with eyes */
KINDS.zap = {
  start: function (w, G) { w.f = figure(G); w.done = false; Au().wipe('zap'); },
  step: function (w, G, dt) {
    var f = w.f, gy = groundAt(G, f.x);
    if (w.t < 0.7) { f.x += f.vx * 0.2 * dt; f.y += (gy + 0.7 - f.y) * Math.min(1, dt * 6); f.a *= 1 - Math.min(1, dt * 8); }
    else if (!w.done) { w.done = true; Au().wipe('poof'); puff(f.x, gy + 0.3, 14, '#3a3a40', 2.5, 1.4); w.ax = f.x; w.ay = gy; }
    if (w.done && Math.random() < dt * 5) R.emit(0, w.ax + rnd(-0.2, 0.2), w.ay + 0.3, rnd(-0.2, 0.2), rnd(0.6, 1.4), rnd(0.8, 1.5), 0.08, '#55555c', { gr: 0.25, a: 0.4, front: 1 });
    w.fx = f.x; w.fy = gy + 0.6;
  },
  draw: function (w, c, dd) {
    var f = w.f, i, k;
    if (!w.done) {
      var on = Math.floor(w.t * 16) % 2 === 0;
      c.save(); c.translate(rnd(-0.03, 0.03), rnd(-0.03, 0.03));
      drawFigure(c, f, dd, on ? 'xray' : null);
      c.restore();
      c.lineWidth = 0.035; c.lineJoin = 'miter';
      for (i = 0; i < 4; i++) {
        var a = rnd(0, TAU), x = f.x + Math.cos(a) * 0.3, y = f.y + 0.4 + Math.sin(a) * 0.4;
        c.strokeStyle = i % 2 ? '#ffffff' : '#3dffd2'; c.beginPath(); c.moveTo(x, y);
        for (k = 0; k < 4; k++) { x += Math.cos(a) * 0.18 + rnd(-0.12, 0.12); y += Math.sin(a) * 0.18 + rnd(-0.12, 0.12); c.lineTo(x, y); }
        c.stroke();
      }
      c.lineJoin = 'round';
    } else {
      var kk = Math.min(1, (w.t - 0.7) * 6), blink = Math.sin(w.t * 2.2) > 0.93 ? 0.1 : 1;
      A.blob(c, [w.ax - 0.42 * kk, w.ay - 0.02, w.ax - 0.24, w.ay + 0.26 * kk, w.ax, w.ay + 0.4 * kk, w.ax + 0.28, w.ay + 0.22 * kk, w.ax + 0.46 * kk, w.ay - 0.02], '#2b2b30', 0.04);
      c.beginPath(); c.ellipse(w.ax - 0.07, w.ay + 0.2 * kk, 0.05, 0.065 * blink, 0, 0, TAU); c.ellipse(w.ax + 0.09, w.ay + 0.2 * kk, 0.05, 0.065 * blink, 0, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
      A.circ(c, w.ax - 0.06, w.ay + 0.2 * kk, 0.02 * blink, OUT, 0); A.circ(c, w.ax + 0.1, w.ay + 0.2 * kk, 0.02 * blink, OUT, 0);
    }
  }
};

/* curls up and bounces away like a rubber ball */
KINDS.ball = {
  start: function (w, G, dd) {
    var s = G.sim;
    w.ball = R.emit(8, s.x, s.y + 0.4, s.vx * 0.5 + 2.5, Math.max(6, Math.abs(s.vy) * 0.6 + 5), 8, 0.36, '', { bounce: 0.78, g: 1, front: 1, vr: -7, fade: 0.08,
      draw: function (c, p) {
        A.circ(c, 0, 0, p.r, dd.suit[0], 0.04);
        c.beginPath(); c.arc(0, 0, p.r * 0.72, -0.3, 1.2); c.lineWidth = 0.08; c.strokeStyle = dd.suit[1]; c.stroke();
        A.circ(c, -p.r * 0.5, -p.r * 0.36, 0.1, dd.suit[2], 0.03);
        A.helmet(c, p.r * 0.28, p.r * 0.34, 0.15, -0.2, dd, dd.kind);
      }, onHit: function (p, v) { Au().wipe('boing', v); p.sq = 1; } });
    Au().wipe('boing', 6);
  },
  step: function (w) { w.fx = w.ball.x; w.fy = w.ball.y; },
  draw: function () {}
};

/* fired off into the sky until there is only a twinkle */
KINDS.twinkle = {
  start: function (w, G) { w.rag = R.makeRag(G.sim, G.bikeDef); var p = w.rag.pts, i; for (i = 0; i < p.length; i++) { p[i].px = p[i].x - (5 + rnd(-0.6, 0.6)) / 120 - G.sim.vx * 0.3 / 120; p[i].py = p[i].y - (34 + rnd(-2, 2)) / 120; } w.ting = false; w.fx = G.sim.x; w.fy = G.sim.y; Au().wipe('whistleUp'); },
  step: function (w, G, dt) {
    if (w.t < 1.4) R.stepRag(w.rag, G.track, w.t < 0.9 ? 0 : G.sim.g, dt, true);
    if (!w.ting && w.t > 1.0) { w.ting = true; w.tx = G.cam.x + G.cam.vh * 0.5; w.ty = G.cam.y + G.cam.vh * 0.36; Au().wipe('ting'); }
  },
  draw: function (w, c, dd) {
    if (w.t < 1.0) { R.drawRag(c, w.rag, dd); return; }
    var k = (w.t - 1.0) / 0.7; if (k > 1) return;
    var s = Math.sin(Math.PI * k) * 0.55;
    c.globalCompositeOperation = 'lighter'; A.star4(c, w.tx, w.ty, s, '#ffffff'); c.save(); c.translate(w.tx, w.ty); c.rotate(0.785); A.star4(c, 0, 0, s * 0.5, '#fff3b0'); c.restore(); c.globalCompositeOperation = 'source-over';
  }
};

/* arms and legs go long and wobbly */
KINDS.noodle = {
  start: function (w, G) { w.rag = R.makeRag(G.sim, G.bikeDef); w.rag.limb = 1; Au().wipe('spring'); },
  step: function (w, G, dt) { w.rag.limb = 1 + Math.min(1, w.t * 4) * 1.5 + Math.sin(w.t * 22) * 0.18 * Math.exp(-w.t * 1.6); R.stepRag(w.rag, G.track, G.sim.g, dt); w.fx = w.rag.pts[2].x; w.fy = w.rag.pts[2].y; },
  draw: function (w, c, dd) { R.drawRag(c, w.rag, dd); }
};

/* goes up like a firework and off like one */
KINDS.firework = {
  start: function (w, G) { w.f = figure(G); w.f.vx = G.sim.vx * 0.2; w.f.vy = 16; w.bang = false; Au().wipe('whistleUp'); },
  step: function (w, G, dt, dd) {
    var f = w.f, i;
    if (!w.bang) {
      f.x += f.vx * dt; f.y += f.vy * dt; f.vy -= 6 * dt; f.a += (0 - f.a) * Math.min(1, dt * 6);
      for (i = 0; i < 2; i++) R.emit(3, f.x + rnd(-0.1, 0.1), f.y - 0.3, rnd(-1, 1), rnd(-6, -2), rnd(0.2, 0.4), rnd(0.1, 0.18), i ? '#ff7a1f' : '#ffe07a', { a: 0.9, front: 1 });
      if (w.t > 0.75) {
        w.bang = true; Au().wipe('boom'); G.flash = 0.4; G.cam.shake = 0.8;
        var cols = ['#ff4a5a', '#ffd24a', '#5dff7a', '#58c9f0', '#ffffff', '#c9a3ff'], n = 90;
        for (i = 0; i < n; i++) { var a = TAU * i / n + rnd(-0.05, 0.05), sp = (i % 3 === 0 ? 4 : i % 3 === 1 ? 7 : 10) + rnd(-0.6, 0.6); R.emit(2, f.x, f.y + 0.4, Math.cos(a) * sp, Math.sin(a) * sp, rnd(0.8, 1.4), 0.07, cols[i % 6], { g: 0.25, drag: 1.6, front: 1 }); }
        for (i = 0; i < 20; i++) R.emit(3, f.x + rnd(-0.4, 0.4), f.y + 0.4 + rnd(-0.4, 0.4), rnd(-3, 3), rnd(-3, 3), rnd(0.3, 0.6), rnd(0.2, 0.4), cols[i % 6], { a: 0.8, front: 1 });
        w.head = dropHead(G, dd, f.x, f.y + 0.8, rnd(-2, 2), 2, f.sc);
      }
      w.fx = f.x; w.fy = Math.min(f.y, G.sim.y + 4);
    } else { w.fx = w.head.x; w.fy = Math.min(w.head.y, G.sim.y + 4); }
  },
  draw: function (w, c, dd) { if (!w.bang) drawFigure(c, w.f, dd); }
};

/* goes flat as a paper cut-out and flutters down like a leaf */
KINDS.paper = {
  start: function (w, G) { w.f = figure(G); w.f.y += 0.3; w.x0 = w.f.x + G.sim.vx * 0.2; w.landed = false; Au().wipe('flutter'); },
  step: function (w, G, dt) {
    var f = w.f, gy = groundAt(G, f.x);
    if (gy < G.track.minY - 5) gy = f.y - 1;
    if (!w.landed) {
      if (w.t < 0.3) f.y += 3 * (0.3 - w.t) * dt * 6;
      else f.y -= 1.5 * dt;
      f.x = w.x0 + Math.sin(w.t * 3.4) * 0.8; f.a = Math.cos(w.t * 3.4) * 0.6; f.sx = Math.cos(w.t * 2.3 + 0.5);
      if (Math.abs(f.sx) < 0.14) f.sx = f.sx < 0 ? -0.14 : 0.14;
      if (f.y <= gy + 0.12 && w.t > 0.4) { w.landed = true; f.y = gy + 0.08; Au().wipe('pat'); }
    } else { f.a += (RR.groundSlope(G.track, f.x) + Math.PI / 2 - f.a) * Math.min(1, dt * 10); f.sx += (0.12 - f.sx) * Math.min(1, dt * 10); }
    w.fx = f.x; w.fy = f.y;
  },
  draw: function (w, c, dd) { drawFigure(c, w.f, dd, 'paper'); }
};

/* bursts into a dozen marshmallows */
KINDS.mallows = {
  start: function (w, G, dd) {
    var s = G.sim, i; Au().wipe('pomf');
    puff(s.x, s.y + 0.3, 10, '#ffffff', 3, 1.4);
    for (i = 0; i < 14; i++) R.emit(8, s.x + rnd(-0.4, 0.4), s.y + rnd(0, 0.8), s.vx * 0.4 + rnd(-5, 5), rnd(3, 9), rnd(3.5, 5.5), rnd(0.11, 0.17), i % 4 === 0 ? '#ffd0e4' : '#fffaf0', { bounce: 0.6, g: 1, front: 1, vr: rnd(-9, 9), rot: rnd(0, 6), fade: 0.2,
      draw: function (c, p) { var r = p.r; c.beginPath(); if (c.roundRect) c.roundRect(-r, -r * 0.8, r * 2, r * 1.6, r * 0.4); else c.rect(-r, -r * 0.8, r * 2, r * 1.6); c.fillStyle = p.col; c.fill(); c.lineWidth = 0.025; c.strokeStyle = OUT; c.stroke();
        c.beginPath(); c.ellipse(0, r * 0.8, r * 0.82, r * 0.2, 0, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill(); },
      onHit: function (p, v) { if (v > 3) Au().wipe('squeak', v); } });
    w.head = dropHead(G, dd, s.x, s.y + 1, s.vx * 0.3 + rnd(-1, 1), 6, 1);
  },
  step: function (w) { w.fx = w.head.x; w.fy = w.head.y; },
  draw: function () {}
};

/* thrown clear, and the braking parachute opens */
KINDS.chute = {
  start: function (w, G) { w.f = figure(G); w.f.vx = G.sim.vx * 0.35; w.f.vy = 9; w.open = 0; w.said = false; w.landed = false; Au().wipe('whoosh'); },
  step: function (w, G, dt) {
    var f = w.f, gy = groundAt(G, f.x);
    if (gy < G.track.minY - 5) gy = f.y - 2;
    if (w.landed) { w.open = Math.max(0, w.open - dt * 2.5); w.fx = f.x; w.fy = f.y; return; }
    if (w.t > 0.35) { w.open = Math.min(1, w.open + dt * 5); if (!w.said) { w.said = true; Au().wipe('fwump'); } }
    f.vy -= 9.8 * dt;
    if (w.open > 0) { var term = -1.7; f.vy += (term - f.vy) * Math.min(1, dt * 5 * w.open); f.vx *= 1 - Math.min(1, dt * 1.5); f.a += (Math.sin(w.t * 2.6) * 0.2 - f.a) * Math.min(1, dt * 5); }
    else f.a += 3 * dt;
    f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.y <= gy + 0.2 && f.vy < 0) { f.y = gy + 0.2; w.landed = true; Au().wipe('pat'); puff(f.x, gy + 0.1, 5, R.THEMES[G.track.worldIndex].dust, 1.2); }
    w.fx = f.x; w.fy = f.y;
  },
  draw: function (w, c, dd) {
    var f = w.f, k = w.open;
    if (k > 0.02) {
      var sh = f.pts[1], ca = Math.cos(f.a), sa = Math.sin(f.a), ax = f.x + sh.x * ca - sh.y * sa, ay = f.y + sh.x * sa + sh.y * ca;
      var cx = ax - f.vx * 0.05, cy = ay + 1.9 * k, rw = 1.15 * k, i;
      c.lineWidth = 0.018; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.beginPath();
      for (i = 0; i <= 4; i++) { c.moveTo(ax, ay); c.lineTo(cx - rw + i * rw / 2, cy); }
      c.stroke();
      var cols = [dd.suit[1] === dd.suit[0] ? '#ffffff' : dd.suit[1], '#ffffff', dd.suit[2]];
      for (i = 0; i < 4; i++) {
        c.beginPath(); c.moveTo(cx - rw + i * rw / 2, cy); c.quadraticCurveTo(cx - rw + (i + 0.5) * rw / 2 + (i - 1.5) * 0.14 * k, cy + 1.0 * k, cx - rw + (i + 1) * rw / 2, cy);
        c.quadraticCurveTo(cx - rw + (i + 0.5) * rw / 2, cy + 0.16 * k, cx - rw + i * rw / 2, cy); c.closePath();
        c.fillStyle = cols[i % 3]; c.fill(); c.lineWidth = 0.035; c.strokeStyle = OUT; c.stroke();
      }
    }
    drawFigure(c, f, dd);
  }
};

RR.Wipe = {
  KINDS: KINDS,
  start: function (kind, G, e) {
    var K = KINDS[kind] || KINDS.stars;
    var dd = A.dress(null, G.bikeDef, G.look, G.t);
    if (dd === G.bikeDef) dd = Object.create(G.bikeDef);
    dd._track = G.track;
    var w = { kind: kind, t: 0, fx: G.sim.x, fy: G.sim.y, hideBike: false };
    K.start(w, G, dd);
    w.step = function (dt) { w.t += dt; dd._t = G.t; K.step(w, G, dt, dd); };
    w.draw = function (c) { dd._t = G.t; K.draw(w, c, dd); };
    return w;
  }
};
})(typeof window !== 'undefined' ? window : globalThis);
