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

/* ------------------------------ phase 2 bikes ------------------------------ */
/* where point i of a figure is in the world */
function fw(f, i) { var p = f.pts[i], ca = Math.cos(f.a), sa = Math.sin(f.a), x = p.x * f.sx, y = p.y * f.sy; return { x: f.x + x * ca - y * sa, y: f.y + x * sa + y * ca }; }
/* a figure let go: a rag doll in the same pose, moving at vx, vy */
function ragFrom(f, vx, vy) { var pts = [], i; for (i = 0; i < f.pts.length; i++) { var q = fw(f, i); pts.push({ x: q.x, y: q.y, px: q.x - vx / 120, py: q.y - vy / 120 }); } return { pts: pts, sc: f.sc, t: 0 }; }
/* a rag doll frozen stiff: a figure measured from its hips, upright */
function figFrom(rag) { var p = rag.pts, hx = p[2].x, hy = p[2].y, loc = [], i; for (i = 0; i < p.length; i++) loc.push({ x: p[i].x - hx, y: p[i].y - hy }); return { pts: loc, sc: rag.sc, x: hx, y: hy, a: 0, vx: 0, vy: 0, w: 0, sx: 1, sy: 1 }; }
/* ease a figure's pose toward P (hip at 0,0, y up, for a rider of scale 1) */
function setPose(f, P, k) { for (var i = 0; i < P.length; i++) { f.pts[i].x += (P[i][0] * f.sc - f.pts[i].x) * k; f.pts[i].y += (P[i][1] * f.sc - f.pts[i].y) * k; } }
/* the same angle as a, but within half a turn of b, so easing from one to the other goes the short way */
function near(a, b) { while (a - b > Math.PI) a -= TAU; while (a - b < -Math.PI) a += TAU; return a; }
/* ground height, or a stand-in where there is none (over a gap) */
function floorAt(G, x, alt) { var gy = groundAt(G, x); return gy < G.track.minY - 5 ? alt : gy; }
/* clip drawing to what is above the ground, from x - span to x + span */
function aboveGround(c, tr, x, span, top) {
  c.beginPath(); c.moveTo(x - span, RR.groundY(tr, x - span) - 0.02);
  for (var i = -span + 0.2; i <= span + 0.01; i += 0.2) c.lineTo(x + i, RR.groundY(tr, x + i) - 0.02);
  c.lineTo(x + span, top); c.lineTo(x - span, top); c.closePath(); c.clip();
}
function dustCol(G) { return R.THEMES[G.track.worldIndex].dust; }
function hexMix(a, b, k) {
  if (typeof a !== 'string' || a[0] !== '#' || a.length !== 7) return k > 0.5 ? b : a;
  var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), r = ((x >> 16) * (1 - k) + (y >> 16) * k) | 0, g = (((x >> 8) & 255) * (1 - k) + ((y >> 8) & 255) * k) | 0, bl = ((x & 255) * (1 - k) + (y & 255) * k) | 0;
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}
function feather(c, p) {
  var r = p.r; c.rotate(Math.sin(p.age * 5 + p.seed) * 0.7);
  c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(r * 0.55, -r * 0.1, 0, r); c.quadraticCurveTo(-r * 0.45, 0, 0, -r); c.closePath();
  c.fillStyle = p.col; c.fill(); c.lineWidth = 0.014; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.moveTo(0, -r * 1.25); c.lineTo(0, r * 0.8); c.lineWidth = 0.012; c.stroke();
}
function feathers(x, y, n, cols, sp) { for (var i = 0; i < n; i++) R.emit(8, x + rnd(-0.2, 0.2), y + rnd(-0.1, 0.3), rnd(-sp, sp), rnd(0.5, sp * 1.3), rnd(1.6, 2.6), rnd(0.1, 0.15), cols[i % cols.length], { g: 0.18, drag: 2.4, front: 1, rot: rnd(0, 6), vr: rnd(-3, 3), seed: rnd(0, 6), fade: 0.3, draw: feather }); }
/* a little motorbike, for the dizzy rider to see going round */
function tinyBike(c, s, col) {
  c.scale(s, s);
  A.circ(c, -0.5, 0, 0.32, '#1c1d22', 0.09); A.circ(c, 0.55, 0, 0.32, '#1c1d22', 0.09);
  A.shape(c, [-0.5, 0, -0.1, 0.5, 0.45, 0.5, 0.55, 0], col, 0.09);
  A.line(c, [0.45, 0.5, 0.35, 0.82, 0.62, 0.86], 0.1, OUT);
}
/* poses for the stiff figure: hip at 0,0, y up, facing +x */
var STAND = [[0.03, 0.72], [0, 0.5], [0, 0], [0.3, 0.52], [0.59, 0.55], [0.04, -0.44], [0.02, -0.9], [-0.3, 0.52], [-0.59, 0.55], [0.27, -0.31], [0.1, -0.66]];
var SITUP = [[0.05, 0.72], [0.02, 0.5], [0, 0], [0.16, 0.76], [0.22, 1.04], [0.42, 0.02], [0.58, -0.4], [-0.12, 0.76], [-0.14, 1.04], [0.38, 0.06], [0.5, -0.38]];
var FELL = [[0.02, 0.72], [0, 0.5], [0, 0], [0.04, 0.76], [0.06, 1.02], [0.03, -0.44], [0.02, -0.9], [-0.02, 0.76], [-0.02, 1.02], [0.0, -0.44], [-0.01, -0.9]];
var FLY = [[0, 0.72], [0, 0.5], [0, 0], [0, 0.5], [0, 0.5], [0.05, -0.43], [0.02, -0.89], [0, 0.5], [0, 0.5], [-0.04, -0.43], [-0.08, -0.88]];

/* Puffin: the air tank lets go and jets the rider about like a balloon let go of */
function tankOn(c, p0, p1, col, stripe) {
  var tx = p1.x - p0.x, ty = p1.y - p0.y, L = Math.sqrt(tx * tx + ty * ty) || 1, ux = tx / L, uy = ty / L, bx = -uy, by = ux;
  var cx = (p0.x + p1.x) / 2 + bx * 0.17, cy = (p0.y + p1.y) / 2 + by * 0.17;
  c.save(); c.translate(cx, cy); c.rotate(Math.atan2(uy, ux) - Math.PI / 2);
  c.beginPath(); if (c.roundRect) c.roundRect(-0.085, -0.22, 0.17, 0.44, 0.08); else c.rect(-0.085, -0.22, 0.17, 0.44);
  c.fillStyle = col; c.fill(); c.lineWidth = 0.03; c.strokeStyle = OUT; c.stroke();
  A.line(c, [-0.085, 0.06, 0.085, 0.06], 0.05, stripe);
  A.line(c, [-0.04, 0.1, -0.04, 0.18], 0.025, 'rgba(255,255,255,0.7)');
  A.shape(c, [-0.04, -0.22, 0.04, -0.22, 0.06, -0.3, -0.06, -0.3], '#555b66', 0.025);
  c.restore();
}
KINDS.puffball = {
  start: function (w, G) { var f = w.f = figure(G); f.vx = G.sim.vx * 0.3; f.vy = 3; w.hx = f.x + 1.2; w.hy = Math.max(f.y, floorAt(G, f.x, f.y) + 1) + 2; w.limp = false; Au().wipe('vent'); },
  step: function (w, G, dt) {
    var f = w.f, g = G.sim.g;
    if (!w.limp) {
      // spinning every which way, pushed out of the seat of the pants, with a soft pull that keeps it in shot
      f.w = 7 + 9 * Math.sin(w.t * 2.3 + 0.5) + 6 * Math.sin(w.t * 5.1);
      f.a += f.w * dt;
      var ax = -Math.sin(f.a), ay = Math.cos(f.a), th = 19 * (1 - w.t / 2.1);
      f.vx += (ax * th + (w.hx - f.x) * 2.2) * dt; f.vy += (ay * th + (w.hy - f.y) * 2.2 - g * 0.3) * dt;
      var dk = Math.exp(-2.2 * dt); f.vx *= dk; f.vy *= dk;
      f.x += f.vx * dt; f.y += f.vy * dt;
      var gy = floorAt(G, f.x, f.y - 1);
      if (f.y < gy + 0.55) { f.y = gy + 0.55; f.vy = Math.abs(f.vy) * 0.6 + 1; }
      if (Math.random() < dt * 40) R.emit(0, f.x - ax * 0.2, f.y - ay * 0.2, -ax * rnd(4, 7) + f.vx * 0.3, -ay * rnd(4, 7) + f.vy * 0.3, rnd(0.25, 0.45), rnd(0.07, 0.12), '#ffffff', { gr: 0.9, a: 0.7, drag: 3, front: 1 });
      if (w.t > 1.8) { w.limp = true; Au().wipe('pfft'); w.rag = ragFrom(f, f.vx * 0.5, f.vy * 0.5); puff(f.x, f.y, 4, '#ffffff', 1.2); }
      w.fx = f.x; w.fy = f.y;
    } else { R.stepRag(w.rag, G.track, g, dt); w.fx = w.rag.pts[2].x; w.fy = w.rag.pts[2].y; }
  },
  draw: function (w, c, dd) {
    var col = '#cfd6de', st = dd.suit[1];
    if (!w.limp) {
      var f = w.f;
      c.save(); c.translate(f.x, f.y); c.rotate(f.a); tankOn(c, f.pts[2], f.pts[1], col, st); c.restore();
      drawFigure(c, f, dd);
    } else { tankOn(c, w.rag.pts[2], w.rag.pts[1], col, st); R.drawRag(c, w.rag, dd); }
  }
};

var SPRING = 1.35;
/* Grasshopper: the suspension takes the rider with it. Off on a pogo spring, then a doorstop wobble */
KINDS.boingo = {
  start: function (w, G) {
    var f = w.f = figure(G), s = G.sim;
    f.a = near(f.a, 0);
    w.x = f.x; w.y = f.y + 0.3; w.vy = 2.5; w.dir = s.vx < -1 ? -1 : 1; w.vx = w.dir * 1.2; w.n = 0; w.on = false; w.L = SPRING; w.gy0 = floorAt(G, f.x, f.y - 1); w.done = false; w.sway = 0;
    w.hops = [1.5, 1.05, 0.65];
  },
  step: function (w, G, dt) {
    var f = w.f, g = G.sim.g, L0 = SPRING;
    setPose(f, SITUP, Math.min(1, dt * 8)); f.a += (0 - f.a) * Math.min(1, dt * 7);
    if (!w.done) {
      var gy = floorAt(G, w.x, w.gy0); w.gy0 = gy;
      w.vy -= g * dt;
      if (w.y - L0 < gy) {            // spring on the ground: squashes, then fires back up
        w.L = Math.max(0.3, w.y - gy);
        if (!w.on) { w.on = true; Au().wipe('pat'); puff(w.x, gy + 0.05, 3, dustCol(G), 0.8, 0.7); }
        w.vy += (L0 - w.L) * 90 * dt; w.vx *= 1 - Math.min(1, dt * 6);
        if (w.y < gy + 0.3) { w.y = gy + 0.3; if (w.vy < 0) w.vy = 0; }
        if (w.vy > 0 && w.L > SPRING - 0.15) {
          w.on = false;
          if (w.n >= w.hops.length) { w.done = true; w.dt0 = w.t; w.bx = w.x; w.by = gy; Au().wipe('doing'); }
          else { var h = w.hops[w.n++] * Math.sqrt(Math.min(1, g / 9.8)), v = Math.sqrt(2 * g * h); w.vy = v; w.vx = w.dir * 1.3 / (2 * v / g); w.y = gy + L0 + 0.01; w.L = L0; Au().wipe('sproing'); }
        }
      } else { w.L += (L0 - w.L) * Math.min(1, dt * 25); w.on = false; }
      if (!w.done) { w.x += w.vx * dt; w.y += w.vy * dt; }
      f.sy = 1 - Math.max(0, L0 - w.L) * 0.25;
    } else {
      var tt = w.t - w.dt0; w.sway = 0.55 * Math.exp(-tt * 1.3) * Math.sin(tt * 13); f.sy = 1;
      w.x = w.bx; w.y = w.by + L0;
    }
    w.fx = w.x; w.fy = w.y;
  },
  draw: function (w, c, dd) {
    var f = w.f, top = w.done ? { x: w.bx, y: w.by + SPRING } : { x: w.x, y: w.y }, bot = w.done ? { x: w.bx, y: w.by } : { x: w.x, y: w.y - w.L };
    c.save();
    if (w.done) { c.translate(bot.x, bot.y); c.rotate(-w.sway); c.translate(-bot.x, -bot.y); }
    var n = 9, i, dx = top.x - bot.x, dy = top.y - bot.y, pts = [bot.x, bot.y];
    for (i = 0; i <= n * 2; i++) { var k = (i + 0.5) / (n * 2 + 1); pts.push(bot.x + dx * k + (i % 2 ? 0.13 : -0.13), bot.y + dy * k); }
    pts.push(top.x, top.y - 0.02);
    A.line(c, pts, 0.08, OUT); A.line(c, pts, 0.045, '#dfe4ea');
    A.shape(c, [bot.x - 0.2, bot.y - 0.02, bot.x + 0.2, bot.y - 0.02, bot.x + 0.17, bot.y + 0.06, bot.x - 0.17, bot.y + 0.06], '#3a3f4b', 0.03);
    A.shape(c, [top.x - 0.16, top.y - 0.06, top.x + 0.16, top.y - 0.06, top.x + 0.16, top.y, top.x - 0.16, top.y], dd.suit[1], 0.03);
    f.x = top.x; f.y = top.y + 0.04;
    drawFigure(c, f, dd);
    c.restore();
  }
};

/* Odd Couple: rider and passenger come off together, hand in hand, and the passenger never stops waving */
var PASS = ['#7a5a3a', '#c9b48a', '#3a2a1e'];
KINDS.tandem = {
  start: function (w, G, dd) {
    var s = G.sim, ca = Math.cos(s.a), sa = Math.sin(s.a), ox = ca * 0.34 + sa * 0.3, oy = sa * 0.34 - ca * 0.3, i;
    w.rag = R.makeRag(s, G.bikeDef); w.rag2 = R.makeRag(s, G.bikeDef);
    w.dir = s.vx < -1 ? -1 : 1; var th = Math.sqrt(Math.min(1, s.g / 9.8)), up = 0.035 * th, fw2 = 0.03 * th;
    // the outfit cannot tip, so the pair are thrown clear over the front together
    for (i = 0; i < w.rag2.pts.length; i++) { var p = w.rag2.pts[i]; p.x += ox; p.y += oy; p.px += ox + 0.012 - w.dir * fw2; p.py += oy - 0.008 - up; p = w.rag.pts[i]; p.px -= w.dir * fw2 * 0.9; p.py -= up; }
    w.landT = -1;
    w.pd = Object.create(dd); w.pd.suit = PASS; w.pd._skin = null;
    w.said = false; Au().wipe('honk');
  },
  step: function (w, G, dt) {
    var g = G.sim.g, a = w.rag.pts, b = w.rag2.pts, i;
    R.stepRag(w.rag, G.track, g, dt); R.stepRag(w.rag2, G.track, g, dt);
    // holding hands
    for (i = 0; i < 3; i++) { var h1 = a[8], h2 = b[8], dx = h2.x - h1.x, dy = h2.y - h1.y, d = Math.sqrt(dx * dx + dy * dy) || 1e-6; if (d > 0.1) { var f = (d - 0.1) / d * 0.5; h1.x += dx * f; h1.y += dy * f; h2.x -= dx * f; h2.y -= dy * f; } }
    // the wave: whatever the rest of the passenger is doing, this arm is up and waving
    if (w.landT < 0 && w.t > 0.3 && b[2].y - floorAt(G, b[2].x, b[2].y - 1) < 0.45) w.landT = w.t;
    var lt = w.landT < 0 ? -1 : w.t - w.landT;
    if (lt > 0.15) {                 // once down, sits up to make sure you saw
      var su = Math.min(1, (lt - 0.15) * 2) * Math.min(1, dt * 8), up = [[1, 0.1 * w.dir, 0.48], [0, 0.14 * w.dir, 0.71]];
      for (i = 0; i < 2; i++) { var q = b[up[i][0]], tx = b[2].x + up[i][1], ty = b[2].y + up[i][2]; q.x += (tx - q.x) * su; q.y += (ty - q.y) * su; q.px += (tx - q.px) * su; q.py += (ty - q.py) * su; }
    }
    var sh = b[1], wv = Math.sin(w.t * 13);
    b[3].x = sh.x + 0.26 * w.dir; b[3].y = sh.y + 0.16; b[4].x = b[3].x + (0.1 + 0.14 * wv) * w.dir; b[4].y = b[3].y + 0.25;
    b[3].px = b[3].x; b[3].py = b[3].y; b[4].px = b[4].x; b[4].py = b[4].y;
    w.lt = lt;
    if (!w.said && lt > 0.5) { w.said = true; Au().wipe('yoohoo'); }
    w.fx = (a[2].x + b[2].x) / 2; w.fy = (a[2].y + b[2].y) / 2;
  },
  draw: function (w, c, dd) {
    var b = w.rag2.pts, t = w.t, k;
    // a scarf streaming off the passenger's neck
    var sc = [b[1].x, b[1].y + 0.08];
    for (k = 1; k <= 4; k++) sc.push(b[1].x - 0.17 * k, b[1].y + 0.1 + Math.sin(t * 15 - k * 1.3) * 0.05 * k);
    A.curve(c, sc, 0.07, '#e2402f', 0.035);
    R.drawRag(c, w.rag2, w.pd);
    // a leather flying cap and goggles over the helmet
    var ha = Math.atan2(b[0].y - b[1].y, b[0].x - b[1].x) - Math.PI / 2;
    c.save(); c.translate(b[0].x, b[0].y); c.rotate(ha);
    A.circ(c, 0, 0, 0.165, '#6b4a2e', 0.03);
    c.beginPath(); c.ellipse(0.06, -0.06, 0.1, 0.09, 0, 0, TAU); c.fillStyle = '#e8b890'; c.fill(); c.lineWidth = 0.02; c.strokeStyle = OUT; c.stroke();
    A.shape(c, [-0.08, -0.04, -0.02, -0.04, -0.03, -0.17, -0.08, -0.15], '#5a3c24', 0.02);
    A.line(c, [-0.16, 0.04, 0.16, 0.02], 0.045, '#3a2a1e');
    A.circ(c, 0.1, 0.03, 0.05, '#9fe8ff', 0.022, '#c9a347');
    c.beginPath(); c.arc(0.08, -0.08, 0.035, 0.2, 2.6); c.lineWidth = 0.018; c.strokeStyle = OUT; c.stroke();
    c.restore();
    R.drawRag(c, w.rag, dd);
    var lt = w.lt == null ? -1 : w.lt;
    if (lt > 0.5) {
      var al = Math.min(1, (lt - 0.5) * 5) * (lt > 3 ? Math.max(0, (3.5 - lt) * 2) : 1);
      if (al > 0) {
        var x = b[0].x + 0.3, y = b[0].y + 0.5;
        c.globalAlpha = al;
        c.beginPath(); if (c.roundRect) c.roundRect(x, y, 1.3, 0.46, 0.16); else c.rect(x, y, 1.3, 0.46);
        c.moveTo(x + 0.18, y); c.lineTo(x + 0.04, y - 0.22); c.lineTo(x + 0.4, y);
        c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 0.035; c.strokeStyle = OUT; c.stroke();
        c.save(); c.translate(x + 0.65, y + 0.23); c.scale(1, -1); c.font = '800 0.28px ' + R.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = OUT; c.fillText('Cheerio!', 0, 0); c.restore();
        c.globalAlpha = 1;
      }
    }
  }
};

/* Gecko: flies at the camera and splats on the glass like a gecko on a window, then peels off a toe at a time */
var LIMB = { root: [[0.2, 0.3], [-0.2, 0.3], [0.12, -0.28], [-0.12, -0.28]], len: [0.62, 0.62, 0.72, 0.72], wid: [0.15, 0.15, 0.19, 0.19], spread: [0.5, Math.PI - 0.5, -0.95, -Math.PI + 0.95], bend: [0.35, -0.35, -0.3, 0.3], off: [2.15, 1.65, 1.0, 1.3] };
var SPLAT_T = 0.32;
function padAt(w, i) { var r = LIMB.root[i], L = LIMB.len[i] * w.ls[i], a = w.la[i]; return { x: r[0] + Math.cos(a) * L, y: r[1] + Math.sin(a) * L, a: a }; }
function starfish(c, dd, w) {
  var i, q, s = dd.suit;
  for (i = 3; i >= 0; i--) {
    var r = LIMB.root[i], a = w.la[i], L = LIMB.len[i] * w.ls[i], b = a + LIMB.bend[i] * (w.lstuck[i] ? 0.3 : 1);
    var e = padAt(w, i), mx = r[0] + Math.cos(b) * L * 0.5, my = r[1] + Math.sin(b) * L * 0.5;
    A.curve(c, [r[0], r[1], mx, my, e.x, e.y], LIMB.wid[i], i < 2 ? s[0] : s[1], 0.05);
    for (q = -1.5; q <= 1.5; q++) { var ta = a + q * 0.42, tl = w.lstuck[i] ? 0.15 : 0.11; A.circ(c, e.x + Math.cos(ta) * tl, e.y + Math.sin(ta) * tl, w.lstuck[i] ? 0.055 : 0.04, '#3ccf6e', 0.025); }
    A.circ(c, e.x, e.y, 0.1, s[2], 0.03);
  }
  c.beginPath(); c.ellipse(0, 0.02, 0.27, 0.4, 0, 0, TAU); c.fillStyle = s[0]; c.fill(); c.lineWidth = 0.035; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.ellipse(0, -0.02, 0.26, 0.1, 0, 0.15, Math.PI - 0.15); c.lineWidth = 0.08; c.strokeStyle = s[1]; c.stroke();
  A.helmet(c, 0, 0.62, 0.27, 0.15, dd, dd.kind);
}
KINDS.splat = {
  start: function (w, G) {
    var s = G.sim; w.x0 = s.x; w.y0 = s.y + 0.4; w.cx = G.cam.x; w.cy = G.cam.y; w.vh = G.cam.vh; w.hit = false; w.gone = false; w.slide = 0;
    w.la = LIMB.spread.slice(); w.lv = [0, 0, 0, 0]; w.ls = [1, 1, 1, 1]; w.lstuck = [0, 0, 0, 0]; w.marks = []; w.fall = 0;
    w.fx = s.x; w.fy = s.y; Au().wipe('whoosh');
  },
  step: function (w, G, dt) {
    var i, S = 0.3;
    // pinned to the screen, not the world: the camera's position is the glass
    w.cx = G.cam.x; w.cy = G.cam.y; w.vh = G.cam.vh; w.fx = G.sim.x; w.fy = G.sim.y;
    if (w.t < SPLAT_T) { for (i = 0; i < 4; i++) w.la[i] = LIMB.spread[i] + 0.7 * Math.sin(w.t * 22 + i * 1.7); return; }
    if (!w.hit) { w.hit = true; Au().wipe('splat'); G.cam.shake = Math.max(G.cam.shake, 0.35); for (i = 0; i < 4; i++) { w.la[i] = LIMB.spread[i]; w.lstuck[i] = 1; } }
    var tt = w.t - SPLAT_T;
    w.slide = 0.012 * tt + 0.02 * tt * tt;
    for (i = 0; i < 4; i++) {
      if (w.lstuck[i] && w.t > LIMB.off[i]) {
        w.lstuck[i] = 0; Au().wipe('peel');
        var p = padAt(w, i); w.marks.push({ x: 0.04 + p.x * S, y: 0.1 - w.slide + p.y * S, a: p.a, t: w.t });
      }
      if (!w.lstuck[i]) {            // a limb let go swings down and dangles
        var da = near(-Math.PI / 2 + (i % 2 ? -0.12 : 0.12), w.la[i]) - w.la[i];
        w.lv[i] += (da * 40 - w.lv[i] * 4) * dt; w.la[i] += w.lv[i] * dt; w.ls[i] += (1 - w.ls[i]) * Math.min(1, dt * 8);
      }
    }
    // the last hand to go stretches first
    if (w.lstuck[0] && w.t > LIMB.off[0] - 0.45) { if (!w.str) { w.str = true; Au().wipe('stretch'); } w.ls[0] = 1 + (w.t - (LIMB.off[0] - 0.45)) * 1.0; }
    if (w.t > LIMB.off[0]) { w.fall += dt; if (w.fall > 1.2) w.gone = true; }
  },
  draw: function (w, c, dd) {
    var vh = w.vh, S = 0.3 * vh, i, k, x, y, sc, rot = 0, sqx = 1, sqy = 1;
    // prints left on the glass
    for (i = 0; i < w.marks.length; i++) {
      var m = w.marks[i], al = 0.55 * Math.max(0, 1 - (w.t - m.t) / 2.5);
      if (al <= 0) continue;
      var mx = w.cx + m.x * vh, my = w.cy + m.y * vh;
      c.globalAlpha = al;
      A.circ(c, mx, my, 0.1 * S, '#e6fff0', 0);
      for (k = -1.5; k <= 1.5; k++) A.circ(c, mx + Math.cos(m.a + k * 0.42) * 0.15 * S, my + Math.sin(m.a + k * 0.42) * 0.15 * S, 0.05 * S, '#e6fff0', 0);
      c.globalAlpha = 1;
    }
    if (w.gone) return;
    if (w.t < SPLAT_T) {
      var q = w.t / SPLAT_T, e = q * q;
      x = w.x0 + (w.cx + 0.04 * vh - w.x0) * e; y = w.y0 + (w.cy + 0.1 * vh - w.y0) * e;
      sc = 0.5 * Math.pow(S / 0.5, e); rot = (1 - q) * 9;
    } else {
      var tt = w.t - SPLAT_T;
      x = w.cx + 0.04 * vh; y = w.cy + (0.1 - w.slide) * vh - 1.3 * w.fall * w.fall * vh;
      sc = S; rot = w.fall * 0.8;
      var sq = Math.exp(-tt * 9) * Math.cos(tt * 30) * 0.22; sqx = 1 + sq; sqy = 1 - sq;
    }
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc * sqx, sc * sqy);
    starfish(c, dd, w);
    c.restore();
    if (w.t >= SPLAT_T && w.t < SPLAT_T + 0.3) {             // the slap
      var kk = (w.t - SPLAT_T) / 0.3; c.globalAlpha = 1 - kk; c.lineWidth = 0.06; c.strokeStyle = '#ffffff';
      for (i = 0; i < 10; i++) { var a = i * TAU / 10 + 0.2, r0 = S * (1.0 + kk * 0.3), r1 = r0 + S * 0.22; c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke(); }
      c.globalAlpha = 1;
    }
  }
};

/* Sandpiper: a sand devil swallows the rider and leaves a sandcastle wearing the helmet */
var SAND = ['#e8c77a', '#d4ac5a', '#f4dfa4'];
KINDS.sandstorm = {
  start: function (w, G) { w.rag = R.makeRag(G.sim, G.bikeDef); w.dx = G.sim.x; w.dir = G.sim.vx < -1 ? -1 : 1; w.gy0 = floorAt(G, G.sim.x, G.sim.y - 1); w.gy = w.gy0; w.castle = false; w.k = 0; Au().wipe('swirl'); },
  step: function (w, G, dt) {
    var p = w.rag.pts, i, t = w.t;
    w.k = t < 0.2 ? 0 : t < 0.55 ? (t - 0.2) / 0.35 : t < 1.5 ? 1 : Math.max(0, 1 - (t - 1.5) / 0.4);
    if (t < 1.45) w.dx += w.dir * 1.4 * dt;
    w.gy = floorAt(G, w.dx, w.gy0); w.gy0 = w.gy;
    if (!w.castle) {
      R.stepRag(w.rag, G.track, G.sim.g, dt);
      if (t > 0.25) for (i = 0; i < p.length; i++) {            // sucked up into the swirl
        var ax = w.dx + Math.sin(t * 9 + i) * 0.25, ay = w.gy + 0.9 + i * 0.07;
        p[i].x += (ax - p[i].x) * Math.min(1, dt * 5); p[i].y += (ay - p[i].y) * Math.min(1, dt * 5);
      }
    }
    if (w.k > 0.3 && Math.random() < dt * 60 * w.k) { var h = rnd(0, 2.4), a = rnd(0, TAU); R.emit(1, w.dx + Math.cos(a) * (0.4 + h * 0.3), w.gy + h, -Math.sin(a) * 4 + w.dir, rnd(0.5, 2), rnd(0.3, 0.6), rnd(0.025, 0.05), SAND[(Math.random() * 3) | 0], { g: 0.3, front: 1, vr: rnd(-8, 8) }); }
    if (!w.castle && t > 1.45) { w.castle = true; w.cx = w.dx; w.cy = w.gy; puff(w.cx, w.cy + 0.3, 10, SAND[2], 2, 1.3); Au().wipe('tada'); }
    if (w.castle && Math.random() < dt * 3) R.emit(1, w.cx + rnd(-0.4, 0.4), w.cy + 0.8, rnd(-0.2, 0.2), 0, rnd(0.4, 0.8), 0.025, SAND[0], { g: 1, front: 1 });
    w.fx = w.dx; w.fy = w.gy + 1;
  },
  draw: function (w, c, dd) {
    var t = w.t, i, k = w.k;
    if (!w.castle && t < 0.75) R.drawRag(c, w.rag, dd);
    if (w.castle) this.castle(w, c, dd);
    if (k <= 0.01) return;
    // the devil: rings that widen going up, each one spinning
    var x = w.dx, y = w.gy, n = 9;
    for (i = 0; i < n; i++) {
      var h = (i + 0.5) / n * 2.6 * k, r = (0.25 + h * 0.32) * k, wob = Math.sin(t * 6 + i * 0.9) * 0.12 * h, ph = t * 11 + i * 1.3, ry = 0.12 + r * 0.18;
      c.globalAlpha = Math.min(1, k * 1.2) * 0.85;
      c.beginPath(); c.ellipse(x + wob, y + h, r, ry, 0, 0, TAU); c.fillStyle = SAND[i % 3]; c.fill();
      c.lineWidth = 0.035; c.strokeStyle = 'rgba(120,80,30,0.6)'; c.beginPath(); c.ellipse(x + wob, y + h, r, ry, 0, ph % TAU, ph % TAU + 2.2); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(x + wob, y + h, r * 0.8, ry * 0.8, 0, (ph + 3) % TAU, (ph + 3) % TAU + 1.4); c.stroke();
    }
    c.globalAlpha = 1;
  },
  castle: function (w, c, dd) {
    var x = w.cx, y = w.cy, rise = Math.min(1, (w.t - 1.45) * 3), tr = dd._track, i;
    var b = y - 1.2 + rise * 1.2;           // rises up out of the ground
    c.save(); aboveGround(c, tr, x, 1.6, y + 5);
    c.translate(x, y); c.scale(1.4, 1.4); c.translate(-x, -y);
    var S1 = SAND[0], S2 = SAND[1];
    // two side towers, a wall and a middle keep, all with battlements
    function tower(cx, w2, h) { A.shape(c, [cx - w2, b - 0.4, cx - w2, b + h, cx - w2 * 0.5, b + h, cx - w2 * 0.5, b + h + 0.1, cx, b + h + 0.1, cx, b + h, cx + w2 * 0.5, b + h, cx + w2 * 0.5, b + h + 0.1, cx + w2, b + h + 0.1, cx + w2, b - 0.4], S1, 0.035); }
    A.shape(c, [x - 0.7, b - 0.4, x - 0.7, b + 0.42, x + 0.7, b + 0.42, x + 0.7, b - 0.4], S2, 0.035);
    tower(x - 0.62, 0.17, 0.62); tower(x + 0.62, 0.17, 0.62); tower(x, 0.24, 0.85);
    A.blob(c, [x - 0.1, b - 0.02, x - 0.1, b + 0.22, x, b + 0.3, x + 0.1, b + 0.22, x + 0.1, b - 0.02], '#5a4128', 0.03);
    A.line(c, [x - 0.15, b + 0.55, x - 0.05, b + 0.52, x + 0.08, b + 0.58], 0.02, 'rgba(120,80,30,0.6)');
    A.line(c, [x - 0.62, b + 0.72, x - 0.62, b + 1.02], 0.025, '#5a4128');
    A.shape(c, [x - 0.62, b + 1.02, x - 0.42, b + 0.95, x - 0.62, b + 0.88], dd.suit[1], 0.02);
    c.restore();
    // the helmet sat on top of the keep, a little crooked
    if (rise > 0.6) { c.save(); c.translate(x, y); c.scale(1.4, 1.4); c.translate(-x, -y); A.helmet(c, x + 0.02, b + 0.95 + 0.14, 0.17, 0.25 + Math.sin(w.t * 1.7) * 0.03, dd, dd.kind); c.restore(); }
  }
};

/* Whiplash: spins like a top on the spot, topples over, and sees little motorbikes going round */
KINDS.spinout = {
  start: function (w, G) {
    var f = w.f = figure(G);
    w.ph = 0; w.fell = false; w.gy0 = floorAt(G, f.x, f.y - 1); w.dir = G.sim.vx < -1 ? -1 : 1; w.fa = 0; w.fv = 0; w.side = 1; w.dz = false;
    w.px = f.x; w.a0 = near(f.a, 0); w.x0 = f.x; w.y0 = f.y; Au().wipe('whirr');
  },
  step: function (w, G, dt) {
    var f = w.f, t = w.t, gy, fl = 0.9 * f.sc;
    setPose(f, w.fell ? FELL : STAND, Math.min(1, dt * 10));
    // flung clear of the bike first, landing on one foot a couple of metres on
    w.px = w.x0 + w.dir * 2.2 * Math.min(1, t / 0.35) * (2 - Math.min(1, t / 0.35));
    gy = floorAt(G, w.px, w.gy0); w.gy0 = gy;
    if (t < 1.65) {
      var om = t < 1.0 ? 24 : 24 * Math.max(0.15, 1 - (t - 1.0) / 0.8);
      w.ph += om * dt;
      f.sx = Math.cos(w.ph); if (Math.abs(f.sx) < 0.1) f.sx = f.sx < 0 ? -0.1 : 0.1;
      w.fa = Math.sin(t * 8) * (t < 0.9 ? 0.04 : 0.04 + (t - 0.9) * 0.45);
      if (Math.random() < dt * 12) R.emit(0, w.px + rnd(-0.2, 0.2), gy + 0.05, rnd(-1.5, 1.5), rnd(0.2, 0.8), rnd(0.3, 0.6), rnd(0.08, 0.14), dustCol(G), { gr: 0.6, a: 0.5, drag: 2, front: 1 });
    } else {
      if (!w.fell) { w.fell = true; w.side = -w.dir; }
      f.sx += (1 - f.sx) * Math.min(1, dt * 10);
      if (Math.abs(w.fa) < 1.45) { w.fv += 9 * dt; w.fa += w.side * w.fv * dt; if (Math.abs(w.fa) >= 1.45) { w.fa = 1.45 * w.side; Au().wipe('pat'); puff(w.px - w.side * 0.8, gy + 0.1, 6, dustCol(G), 1.4); } }
      if (!w.dz && t > 2.0) { w.dz = true; Au().wipe('cuckoo'); }
    }
    // standing on one foot, tipping about that foot; the first moment eases in from the crash pose
    var tx = w.px - Math.sin(w.fa) * fl, ty = gy + 0.06 + Math.cos(w.fa) * fl + Math.sin(Math.PI * Math.min(1, t / 0.35)) * 0.8, e = Math.min(1, t / 0.25);
    f.x = w.x0 + (tx - w.x0) * e; f.y = w.y0 + (ty - w.y0) * e; f.a = w.fa + w.a0 * (1 - e);
    w.fx = f.x; w.fy = f.y;
  },
  draw: function (w, c, dd) {
    var f = w.f, t = w.t, i;
    drawFigure(c, f, dd);
    if (t < 1.65) {                 // whoosh lines going round
      c.lineWidth = 0.03; c.strokeStyle = 'rgba(255,255,255,0.75)';
      for (i = 0; i < 3; i++) { var a0 = w.ph + i * 2.1, yy = f.y - 0.3 + i * 0.4; c.beginPath(); c.ellipse(f.x, yy, 0.62, 0.12, 0, a0 % TAU, a0 % TAU + 1.6); c.stroke(); }
    }
    if (w.fell && t > 2.0) {
      var k = Math.min(1, (t - 2.0) * 4), hp = fw(f, 0), hx = hp.x, hy = hp.y;
      // a spiral where the eyes would be
      c.save(); c.translate(hx + 0.05, hy + 0.02); c.rotate(-t * 7); c.beginPath();
      for (i = 0; i < 40; i++) { var ra = i * 0.35, rr = 0.004 * i * k; c[i ? 'lineTo' : 'moveTo'](Math.cos(ra) * rr, Math.sin(ra) * rr); }
      c.lineWidth = 0.028; c.strokeStyle = '#ffe23d'; c.stroke(); c.restore();
      var col = typeof dd.col[0] === 'string' ? dd.col[0] : '#ff3d7f';
      for (i = 0; i < 3; i++) {
        var a = t * 3.6 + i * TAU / 3, x = hx + Math.cos(a) * 0.55, y = hy + 0.45 + Math.sin(a) * 0.12, s = 0.19 * k * (0.8 + 0.2 * Math.sin(a));
        c.save(); c.translate(x, y); c.scale(-Math.sin(a) > 0 ? 1 : -1, 1); c.rotate(Math.sin(t * 9 + i) * 0.25); tinyBike(c, s, i === 1 ? '#ffe23d' : col); c.restore();
      }
    }
  }
};

/* Icepick: freezes into a block of ice and slides away like a curling stone, then shivers */
var FROST = '#cfefff';
function frosted(dd, fd, k) { fd.suit = [hexMix(dd.suit[0], FROST, k), hexMix(dd.suit[1], FROST, k), hexMix(dd.suit[2], FROST, k)]; return fd; }
KINDS.shiver = {
  start: function (w, G, dd) { w.rag = R.makeRag(G.sim, G.bikeDef); w.frozen = false; w.v = clamp(Math.abs(G.sim.vx) * 0.6, 2.4, 4.5) * (G.sim.vx < -1 ? -1 : 1); w.stop = false; w.brrT = 0.6; w.jit = 0; w.fd = Object.create(dd); w.gy0 = floorAt(G, G.sim.x, G.sim.y - 1); Au().wipe('freeze'); },
  step: function (w, G, dt) {
    var g = G.sim.g, i;
    if (!w.frozen) {
      R.stepRag(w.rag, G.track, g, dt);
      var hp = w.rag.pts[2];
      w.fx = hp.x; w.fy = hp.y;
      if (w.t < 0.45 || (hp.y - floorAt(G, hp.x, hp.y - 1) > 0.7 && w.t < 0.9)) return;
      // frozen stiff: measure the pose square to the ground, and build the block round it
      w.frozen = true; var f = figFrom(w.rag), sl = RR.groundSlope(G.track, f.x), ca = Math.cos(-sl), sa = Math.sin(-sl), x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (i = 0; i < f.pts.length; i++) { var p = f.pts[i], rx = p.x * ca - p.y * sa, ry = p.x * sa + p.y * ca, r = i === 0 ? 0.24 : 0.12; p.x = rx; p.y = ry; x0 = Math.min(x0, rx - r); x1 = Math.max(x1, rx + r); y0 = Math.min(y0, ry - r); y1 = Math.max(y1, ry + r); }
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      for (i = 0; i < f.pts.length; i++) { f.pts[i].x -= cx; f.pts[i].y -= cy; }
      w.f = f; w.bw = (x1 - x0) / 2 + 0.06; w.bh = (y1 - y0) / 2 + 0.06; w.x = f.x + cx * Math.cos(sl); w.dist = 0; w.sl = sl;
      for (i = 0; i < 8; i++) R.emit(2, w.x + rnd(-w.bw, w.bw), f.y + rnd(0, w.bh), rnd(-3, 3), rnd(1, 4), rnd(0.2, 0.4), 0.04, '#ffffff', { g: 1, front: 1 });
      Au().wipe('slide'); G.cam.shake = Math.max(G.cam.shake, 0.3);
    }
    var gy = groundAt(G, w.x), ok = gy > G.track.minY - 5;
    if (ok) { w.sl = RR.groundSlope(G.track, w.x); w.gy0 = gy; } else gy = w.gy0;
    if (!w.stop) {
      w.v += (-g * Math.sin(w.sl) - 0.07 * g * (w.v > 0 ? 1 : -1) - (w.dist > 4.5 ? w.v * 2 : 0)) * dt;
      if (!ok) w.v *= 0.9;
      w.x += w.v * Math.cos(w.sl) * dt; w.dist += Math.abs(w.v) * dt;
      if (Math.abs(w.v) < 0.08 && w.t > 0.9) { w.stop = true; w.v = 0; }
      if (Math.random() < dt * 30 * Math.min(1, Math.abs(w.v))) R.emit(2, w.x - w.bw * (w.v > 0 ? 1 : -1), gy + 0.02, -w.v * rnd(0.2, 0.6), rnd(0.5, 2), rnd(0.15, 0.3), 0.035, '#e9f8ff', { g: 1, front: 1 });
    } else {
      w.brrT -= dt;
      if (w.brrT <= 0) { w.brrT = 1.5; w.jit = 0.45; Au().wipe('brr'); }
    }
    w.jit = Math.max(0, w.jit - dt);
    // the block's middle sits half its height off the ground, square to the slope
    w.bx = w.x - Math.sin(w.sl) * w.bh; w.by = gy + Math.cos(w.sl) * w.bh;
    w.fx = w.bx; w.fy = w.by;
  },
  draw: function (w, c, dd) {
    var i;
    if (!w.frozen) { R.drawRag(c, w.rag, frosted(dd, w.fd, Math.min(1, w.t / 0.45) * 0.6)); return; }
    var j = w.jit > 0 ? Math.sin(w.t * 90) * 0.03 : 0, bw = w.bw, bh = w.bh;
    c.save(); c.translate(w.bx + j, w.by); c.rotate(w.sl);
    R.drawRag(c, w.f, frosted(dd, w.fd, 0.6));
    c.beginPath(); if (c.roundRect) c.roundRect(-bw, -bh, bw * 2, bh * 2, 0.1); else c.rect(-bw, -bh, bw * 2, bh * 2);
    c.fillStyle = 'rgba(175,228,255,0.5)'; c.fill(); c.lineWidth = 0.08; c.strokeStyle = 'rgba(233,248,255,0.9)'; c.stroke(); c.lineWidth = 0.03; c.strokeStyle = '#2c5ea8'; c.stroke();
    c.lineWidth = 0.04; c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.beginPath(); c.moveTo(-bw + 0.12, bh - 0.12); c.lineTo(-bw + 0.12 + bh * 0.6, bh - 0.12 - bh * 0.6); c.moveTo(-bw + 0.26, bh - 0.1); c.lineTo(-bw + 0.36, bh - 0.2); c.stroke();
    c.lineWidth = 0.02; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(bw - 0.3, -bh + 0.1); c.lineTo(bw - 0.45, -bh + 0.3); c.lineTo(bw - 0.38, -bh + 0.42); c.stroke();
    // icicles hanging off the top edge
    for (i = 0; i < 3; i++) { var ix = bw - 0.15 - i * 0.18; A.shape(c, [ix - 0.05, bh, ix + 0.05, bh, ix, bh + 0.1 + (i % 2) * 0.06], '#e9f8ff', 0.015); }
    c.restore();
    if (w.stop && w.jit > 0) {
      c.save(); c.translate(w.bx + w.bw * 0.2, w.by + w.bh + 0.35); c.scale(1, -1); c.font = '900 italic 0.26px ' + R.FONT; c.textAlign = 'center'; c.lineWidth = 0.06; c.strokeStyle = OUT; c.strokeText('brrr', 0, 0); c.fillStyle = '#9fe8ff'; c.fillText('brrr', 0, 0); c.restore();
    }
  }
};

/* Rhino: carried off in a stampede, a brawl cloud full of hooves and horns, leaving hoofprints (some of them on you) */
function hoofprint(c, x, y, a, s) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s); c.fillStyle = 'rgba(40,28,18,0.55)';
  c.beginPath(); c.ellipse(0, 0, 0.11, 0.035, 0, 0, TAU); c.fill();
  for (var i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(i * 0.1, 0.05 - Math.abs(i) * 0.015, 0.04, 0.025, 0, 0, TAU); c.fill(); }
  c.restore();
}
KINDS.stampede = {
  start: function (w, G) { w.rag = R.makeRag(G.sim, G.bikeDef); w.cx = G.sim.x; w.dir = G.sim.vx < -1 ? -1 : 1; w.prints = []; w.lastP = w.cx; w.pokes = []; w.out = false; w.k = 0; w.gy0 = floorAt(G, w.cx, G.sim.y - 1); w.cy = w.gy0; Au().wipe('gallop'); },
  step: function (w, G, dt) {
    var t = w.t, p = w.rag.pts, i, gy;
    w.k = t < 0.12 ? 0 : t < 0.3 ? (t - 0.12) / 0.18 : t < 1.9 ? 1 : Math.max(0, 1 - (t - 1.9) / 0.3);
    var mv = t > 0.2 && t < 1.95 ? w.dir * 2.3 * dt : 0;
    w.cx += mv; gy = floorAt(G, w.cx, w.gy0); w.gy0 = gy; w.cy = gy;
    R.stepRag(w.rag, G.track, G.sim.g, dt);
    if (t > 0.2 && t < 1.95) {            // carried along, and well trodden on
      for (i = 0; i < p.length; i++) { p[i].x += mv + (w.cx - p[2].x) * dt * 2; p[i].px += mv; }
      if (Math.random() < dt * 8) { var j = (Math.random() * p.length) | 0; p[j].py -= rnd(0.01, 0.03); }
      if (Math.abs(w.cx - w.lastP) > 0.3) { w.lastP = w.cx; var px = w.cx + rnd(-0.8, 0.4) * w.dir; w.prints.push({ x: px, y: floorAt(G, px, gy) + 0.02, a: RR.groundSlope(G.track, px), t: t }); }
      if (Math.random() < dt * 14) R.emit(0, w.cx + rnd(-0.9, 0.9), gy + rnd(0, 0.4), -w.dir * rnd(0.5, 2), rnd(0.3, 1.2), rnd(0.4, 0.8), rnd(0.15, 0.3), dustCol(G), { gr: 0.8, a: 0.5, drag: 2, front: 1 });
      if (Math.random() < dt * 14) w.pokes.push({ k: ['hoof', 'hoof', 'horn', 'boot', 'helmet', 'bang'][(Math.random() * 6) | 0], a: rnd(-0.5, Math.PI + 0.5), t: t, life: rnd(0.25, 0.4) });
    }
    if (!w.out && t > 1.95) { w.out = true; puff(w.cx, gy + 0.6, 16, '#e8dcc4', 3, 1.6); Au().wipe('poof'); }
    for (i = w.pokes.length - 1; i >= 0; i--) if (t - w.pokes[i].t > w.pokes[i].life) w.pokes.splice(i, 1);
    w.fx = w.k > 0.2 ? w.cx : p[2].x; w.fy = gy + 1;
  },
  draw: function (w, c, dd) {
    var t = w.t, i, k = w.k, p = w.rag.pts;
    for (i = 0; i < w.prints.length; i++) { var q = w.prints[i], al = Math.max(0, 1 - (t - q.t) / 5); if (al <= 0) continue; c.globalAlpha = al; hoofprint(c, q.x, q.y, q.a, 1); c.globalAlpha = 1; }
    if (k < 0.95) {
      R.drawRag(c, w.rag, dd);
      if (w.out) {            // trodden on: two prints across the back of the suit
        var hx = p[2].x, hy = p[2].y, sx = p[1].x, sy = p[1].y, a = Math.atan2(sy - hy, sx - hx);
        hoofprint(c, hx + (sx - hx) * 0.35, hy + (sy - hy) * 0.35, a, 0.9); hoofprint(c, hx + (sx - hx) * 0.72, hy + (sy - hy) * 0.72, a + 0.4, 0.9);
      }
    }
    if (k <= 0.01) return;
    var x = w.cx, y = w.cy + 0.95 * k, R0 = 1.3 * k;
    // things sticking out of the cloud, drawn first so the cloud covers where they join
    for (i = 0; i < w.pokes.length; i++) {
      var pk = w.pokes[i], e = Math.sin(Math.PI * Math.min(1, (t - pk.t) / pk.life)), ex = x + Math.cos(pk.a) * (R0 * 0.8 + 0.3 * e), ey = y + Math.sin(pk.a) * (R0 * 0.6 + 0.3 * e);
      c.save(); c.translate(ex, ey); c.rotate(pk.a - Math.PI / 2);
      if (pk.k === 'hoof') { A.tube(c, [0, -0.3, 0, 0.12], 0.12, '#8d939d', 0.035); A.shape(c, [-0.09, 0.1, 0.09, 0.1, 0.08, 0.2, -0.08, 0.2], '#3a3f4b', 0.03); }
      else if (pk.k === 'horn') { A.blob(c, [-0.18, -0.3, -0.2, 0.1, 0.0, 0.22, 0.2, 0.1, 0.18, -0.3], '#8d939d', 0.035); A.shape(c, [-0.06, 0.16, 0.06, 0.16, 0.0, 0.44], '#f1ecdc', 0.03); A.circ(c, -0.08, 0.02, 0.025, OUT, 0); }
      else if (pk.k === 'boot') { A.tube(c, [0, -0.3, 0, 0.1], 0.11, dd.suit[1], 0.035); A.circ(c, 0, 0.13, 0.08, dd.suit[2], 0.03); }
      else if (pk.k === 'helmet') A.helmet(c, 0, 0.05, 0.15, 0, dd, dd.kind);
      else { c.beginPath(); for (var q2 = 0; q2 < 14; q2++) { var sa = q2 * Math.PI / 7, sr = q2 % 2 ? 0.08 : 0.2; c[q2 ? 'lineTo' : 'moveTo'](Math.sin(sa) * sr, Math.cos(sa) * sr); } c.closePath(); c.fillStyle = '#ffe23d'; c.fill(); c.lineWidth = 0.025; c.strokeStyle = OUT; c.stroke(); }
      c.restore();
    }
    // the cloud: a ring of boiling puffs, outlined as one shape
    var n = 10, cs = [];
    for (i = 0; i < n; i++) { var ang = i * TAU / n + t * 1.5, r = (0.45 + 0.12 * Math.sin(t * 13 + i * 2.1)) * k; cs.push(x + Math.cos(ang) * R0 * 0.75, y + Math.sin(ang) * R0 * 0.5, r); }
    cs.push(x, y, 0.85 * k);
    c.fillStyle = OUT; for (i = 0; i < cs.length; i += 3) { c.beginPath(); c.arc(cs[i], cs[i + 1], cs[i + 2] + 0.035, 0, TAU); c.fill(); }
    c.fillStyle = '#e8dcc4'; for (i = 0; i < cs.length; i += 3) { c.beginPath(); c.arc(cs[i], cs[i + 1], cs[i + 2], 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.45)'; for (i = 0; i < cs.length - 3; i += 6) { c.beginPath(); c.arc(cs[i] - 0.08, cs[i + 1] + 0.1, cs[i + 2] * 0.4, 0, TAU); c.fill(); }
    c.lineWidth = 0.03; c.strokeStyle = 'rgba(140,110,70,0.8)';
    for (i = 0; i < 3; i++) { var sa2 = t * 9 + i * 2.1; c.beginPath(); c.arc(x + Math.cos(sa2) * 0.2, y + Math.sin(sa2 * 1.3) * 0.15, 0.14, sa2, sa2 + 3.5); c.stroke(); }
  }
};

/* Albatross: flaps like a bird, glides a little, then plants face first in a puff of feathers */
function wings(w, f, th, sw) {
  // th: how far up the arms are (radians), sw: how far they are swept back
  var sh = f.pts[1], sc = f.sc, i;
  for (i = 0; i < 2; i++) {
    var a = th + (i ? 0.15 : 0), b = a - 0.5 * Math.cos(w.t * 14) * (w.mode === 0 ? 1 : 0.2);
    var ux = -Math.sin(a), uy = -sw, L = Math.sqrt(ux * ux + uy * uy), vx = -Math.sin(b), vy = -sw * 1.3, L2 = Math.sqrt(vx * vx + vy * vy);
    var e = f.pts[i ? 7 : 3], h = f.pts[i ? 8 : 4];
    e.x = sh.x + ux / L * 0.3 * sc; e.y = sh.y + uy / L * 0.3 * sc; h.x = e.x + vx / L2 * 0.29 * sc; h.y = e.y + vy / L2 * 0.29 * sc;
  }
}
KINDS.nosedive = {
  start: function (w, G, dd) {
    var f = w.f = figure(G), s = G.sim;
    w.dir = s.vx < -0.5 ? -1 : 1; w.vx = w.dir * clamp(Math.abs(s.vx) * 0.4, 1.8, 3.5); w.vy = 2.5; w.mode = 0; w.gy0 = floorAt(G, f.x, f.y - 1);
    w.fcol = ['#ffffff', '#f5f1e6', dd.suit[1], '#ffffff']; w.dust = dustCol(G);
    Au().wipe('flap');
  },
  step: function (w, G, dt) {
    var f = w.f, t = w.t, gy = floorAt(G, f.x, w.gy0), aim = 0;
    w.gy0 = gy;
    setPose(f, FLY, Math.min(1, dt * 9));
    if (w.mode === 0) {            // flapping
      wings(w, f, 1.1 * Math.sin(t * 14), 0.25);
      w.vy += (0.6 + 0.9 * Math.sin(t * 14) - w.vy) * Math.min(1, dt * 4);
      aim = -w.dir * Math.PI / 2 + w.dir * 0.15;
      if (Math.random() < dt * 4) feathers(f.x, f.y + 0.4, 1, w.fcol, 0.6);
      if (t > 1.0) w.mode = 1;
    } else if (w.mode === 1) {     // gliding
      wings(w, f, 0.05 + Math.sin(t * 3) * 0.08, 0.3);
      w.vy += (-0.6 - w.vy) * Math.min(1, dt * 3);
      aim = -w.dir * Math.PI / 2 - w.dir * Math.sin(t * 4) * 0.08;
      if (t > 1.55) { w.mode = 2; Au().wipe('dive'); }
    } else if (w.mode === 2) {     // nose down
      wings(w, f, -0.9, 1.2);
      w.vy -= 10 * dt; w.vx *= 1 - Math.min(1, dt * 1.5);
      aim = -w.dir * Math.PI * 0.85;
    }
    if (w.mode < 3) {
      f.a = near(f.a, aim); f.a += (aim - f.a) * Math.min(1, dt * (w.mode === 2 ? 6 : 5));
      f.x += w.vx * dt; f.y += w.vy * dt;
      if (w.mode < 2 && f.y < gy + 1.1) { f.y = gy + 1.1; if (w.vy < 0) w.vy = 0; }
      var hd = fw(f, 0), hg = floorAt(G, hd.x, gy);
      if (w.mode === 2 && hd.y < hg + 0.02) {
        w.mode = 3; w.pt = t; f.y += hg - 0.12 - hd.y; w.hx = hd.x; w.hy = hg; Au().wipe('plant'); G.cam.shake = Math.max(G.cam.shake, 0.4);
        feathers(hd.x, hg + 0.2, 22, w.fcol, 2.4); puff(hd.x, hg + 0.1, 6, w.dust, 1.6);
      }
    } else {                        // legs kicking in the air, slower and slower
      var kk = Math.max(0, 1 - (t - w.pt) / 1.6), s = Math.sin((t - w.pt) * 16) * 0.22 * kk;
      f.pts[5].x = (0.05 + s) * f.sc; f.pts[6].x = (0.02 + s * 1.8) * f.sc; f.pts[9].x = (-0.04 - s) * f.sc; f.pts[10].x = (-0.08 - s * 1.8) * f.sc;
      wings(w, f, 0.4 + 0.9 * Math.sin((t - w.pt) * 11) * kk, -0.2);
    }
    w.fx = f.x; w.fy = f.y;
  },
  draw: function (w, c, dd) {
    if (w.mode === 3) { c.save(); aboveGround(c, dd._track, w.hx, 2, w.hy + 6); drawFigure(c, w.f, dd); c.restore(); } else drawFigure(c, w.f, dd);
    if (w.mode === 3) { c.beginPath(); c.ellipse(w.hx, w.hy, 0.32, 0.12, 0, 0, Math.PI); c.fillStyle = w.dust; c.fill(); c.lineWidth = 0.03; c.strokeStyle = OUT; c.stroke(); }
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
