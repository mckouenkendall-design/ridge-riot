/* Ridge Riot: physics core.
   No drawing and no browser APIs in here, so the same file runs in the game
   and in the Node test tools (tools/bot.js).

   Model: three rigid bodies (chassis + rider, rear wheel, front wheel).
   Each wheel slides along a suspension axis on the chassis (spring + damper,
   bump stops at both ends) and is held on that axis by an impulse constraint.
   Tyres are soft (spring + damper against the ground) with Coulomb friction,
   so drive, braking, wheelspin, wheelies and stoppies all come out of the
   same contact forces instead of being scripted.
   Units: metres, kilograms, seconds. Y is up. Angles are counter-clockwise,
   so a backflip is positive rotation and a frontflip is negative. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var PI = Math.PI, TAU = PI * 2;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
RR.clamp = clamp;

/* Surface materials: mu = grip multiplier, roll = rolling drag, */
RR.MATS = [
  { id: 'dirt',  mu: 1.00, roll: 0.016 },
  { id: 'rock',  mu: 1.05, roll: 0.012 },
  { id: 'ice',   mu: 0.20, roll: 0.006 },
  { id: 'sand',  mu: 0.85, roll: 0.050 },
  { id: 'wood',  mu: 0.95, roll: 0.012 },
  { id: 'steel', mu: 1.15, roll: 0.010 },
  { id: 'snow',  mu: 0.62, roll: 0.030 },
  { id: 'dust',  mu: 0.92, roll: 0.020 }
];
RR.MAT = { dirt: 0, rock: 1, ice: 2, sand: 3, wood: 4, steel: 5, snow: 6, dust: 7 };

/* ------------------------------------------------------------------ */
/* Collision geometry: directed line segments, solid on the right-hand */
/* side of travel (the normal is the left-hand side).                  */
/* ------------------------------------------------------------------ */
RR.buildCollision = function (chains) {
  var n = 0, c, i;
  for (c = 0; c < chains.length; c++) {
    n += chains[c].pts.length / 2 - 1 + (chains[c].closed ? 1 : 0);
  }
  var col = {
    n: 0,
    ax: new Float64Array(n), ay: new Float64Array(n),
    bx: new Float64Array(n), by: new Float64Array(n),
    dx: new Float64Array(n), dy: new Float64Array(n),
    len: new Float64Array(n), depth: new Float64Array(n),
    mat: new Uint8Array(n), gate: new Int16Array(n), side: new Uint8Array(n),
    next: new Int32Array(n), prev: new Int32Array(n), cvx: new Uint8Array(n),
    mark: new Int32Array(n), stamp: 0
  };
  var k = 0, minX = 1e9, maxX = -1e9;
  for (c = 0; c < chains.length; c++) {
    var ch = chains[c], p = ch.pts, m = p.length / 2, first = k, cnt = ch.closed ? m : m - 1;
    for (i = 0; i < cnt; i++) {
      var j = (i + 1) % m;
      var x0 = p[i * 2], y0 = p[i * 2 + 1], x1 = p[j * 2], y1 = p[j * 2 + 1];
      var L = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
      if (L < 1e-6) continue;
      col.ax[k] = x0; col.ay[k] = y0; col.bx[k] = x1; col.by[k] = y1;
      col.dx[k] = (x1 - x0) / L; col.dy[k] = (y1 - y0) / L; col.len[k] = L;
      col.depth[k] = ch.depth || 0.4;
      col.mat[k] = ch.mats ? ch.mats[i] : (ch.mat || 0);
      col.gate[k] = ch.gate == null ? -1 : ch.gate;
      col.side[k] = ch.side == null ? 2 : ch.side;
      col.prev[k] = k > first ? k - 1 : -1;
      col.next[k] = -1;
      if (k > first) col.next[k - 1] = k;
      if (x0 < minX) minX = x0; if (x1 < minX) minX = x1;
      if (x0 > maxX) maxX = x0; if (x1 > maxX) maxX = x1;
      k++;
    }
    if (ch.closed && k > first) { col.next[k - 1] = first; col.prev[first] = k - 1; }
  }
  col.n = k;
  for (i = 0; i < k; i++) {
    var nx = col.next[i];
    if (nx < 0) col.cvx[i] = 1;
    else col.cvx[i] = (col.dx[i] * col.dy[nx] - col.dy[i] * col.dx[nx]) < -1e-9 ? 1 : 0;
  }
  // buckets along x
  col.cw = 2.5; col.x0 = minX - 1; col.nc = Math.max(1, Math.ceil((maxX - minX + 2) / col.cw));
  var cells = []; for (i = 0; i < col.nc; i++) cells.push([]);
  for (i = 0; i < k; i++) {
    var a = Math.min(col.ax[i], col.bx[i]), b = Math.max(col.ax[i], col.bx[i]);
    var c0 = Math.max(0, Math.floor((a - col.x0) / col.cw)), c1 = Math.min(col.nc - 1, Math.floor((b - col.x0) / col.cw));
    for (c = c0; c <= c1; c++) cells[c].push(i);
  }
  col.cells = cells;
  return col;
};

function Contacts() {
  this.nx = new Float64Array(8); this.ny = new Float64Array(8);
  this.pen = new Float64Array(8); this.mat = new Uint8Array(8); this.n = 0;
}
RR.Contacts = Contacts;

/* Find every surface a circle is pressing into.
   If the centre has ended up inside the ground, only the nearest face pushes it
   back out. Letting every face push at once is what makes things explode. */
function query(col, px, py, r, gates, C) {
  var n = 0;
  var c0 = Math.floor((px - r - col.x0) / col.cw), c1 = Math.floor((px + r - col.x0) / col.cw);
  if (c0 < 0) c0 = 0; if (c1 >= col.nc) c1 = col.nc - 1;
  var stamp = ++col.stamp;
  var inD = 1e9, inNx = 0, inNy = 0, inMat = 0;
  for (var c = c0; c <= c1; c++) {
    var cell = col.cells[c];
    for (var q = 0; q < cell.length; q++) {
      var i = cell[q];
      if (col.mark[i] === stamp) continue;
      col.mark[i] = stamp;
      var g = col.gate[i];
      if (g >= 0 && col.side[i] !== 2 && gates[g] !== col.side[i]) continue;
      var dx = col.dx[i], dy = col.dy[i];
      var rx = px - col.ax[i], ry = py - col.ay[i];
      var d = -rx * dy + ry * dx;                 // signed distance from the surface line
      if (d >= r || d <= -col.depth[i]) continue;
      var t = rx * dx + ry * dy, L = col.len[i];
      if (t < -r || t > L + r) continue;
      var onx, ony, pen;
      if (t >= 0 && t <= L) {
        if (d < 0) {
          // The centre is behind this face. That only counts if it is really inside the
          // ground, so check the face across the nearer corner when that corner sticks out.
          var nearStart = t < L * 0.5, kk = nearStart ? col.prev[i] : col.next[i];
          if (kk >= 0 && (nearStart ? col.cvx[kk] : col.cvx[i])) {
            if (-(px - col.ax[kk]) * col.dy[kk] + (py - col.ay[kk]) * col.dx[kk] > 0) continue;
          }
          if (-d < inD) { inD = -d; inNx = -dy; inNy = dx; inMat = col.mat[i]; }
          continue;
        }
        onx = -dy; ony = dx; pen = r - d;
      }
      else if (t > L) {
        var j = col.next[i];
        var vx = px - col.bx[i], vy = py - col.by[i];
        var t2 = j >= 0 ? vx * col.dx[j] + vy * col.dy[j] : -1;
        if (t2 >= 0) continue;                    // the next segment owns this point
        var dist = Math.sqrt(vx * vx + vy * vy);
        if (j < 0 || col.cvx[i]) {                // outside corner or loose end
          if (dist >= r) continue;
          if (dist > 1e-6) { onx = vx / dist; ony = vy / dist; } else { onx = -dy; ony = dx; }
          pen = r - dist;
        } else {                                  // sunk into an inside corner
          if (dist >= col.depth[i]) continue;
          onx = -dy - col.dy[j]; ony = dx + col.dx[j];
          var nl = Math.sqrt(onx * onx + ony * ony) || 1; onx /= nl; ony /= nl;
          if (dist < inD) { inD = dist; inNx = onx; inNy = ony; inMat = col.mat[i]; }
          continue;
        }
      } else {
        if (col.prev[i] >= 0) continue;           // the previous segment owns its end corner
        var wx = rx, wy = ry, dd = Math.sqrt(wx * wx + wy * wy);
        if (dd >= r) continue;
        if (dd > 1e-6) { onx = wx / dd; ony = wy / dd; } else { onx = -dy; ony = dx; }
        pen = r - dd;
      }
      if (n < 7) { C.nx[n] = onx; C.ny[n] = ony; C.pen[n] = pen; C.mat[n] = col.mat[i]; n++; }
    }
  }
  if (inD < 1e8) { n = 0; C.nx[0] = inNx; C.ny[0] = inNy; C.pen[0] = r + inD; C.mat[0] = inMat; n = 1; }
  C.n = n;
  return n;
}
RR.queryCircle = query;

/* ------------------------------------------------------------------ */
/* Bike set-up: turns a readable bike description into physics numbers */
/* ------------------------------------------------------------------ */
var G0 = 9.81;
RR.prepBike = function (def) {
  var b = { def: def, id: def.id };
  var mw = [def.wheelMass[0], def.wheelMass[1]];
  b.M = def.mass;                                   // chassis + rider
  b.Mtot = def.mass + mw[0] + mw[1];
  b.I = b.M * def.kgyr * def.kgyr;
  b.com = [def.com[0], def.com[1]];
  b.wb = def.wb;
  var rr = def.rr, rf = def.rf;
  var loadF = b.M * G0 * def.com[0] / def.wb, loadR = b.M * G0 - loadF;
  var rake = (def.rake || 27) * PI / 180, sw = (def.swing || 9) * PI / 180;
  var axes = [[Math.sin(sw), Math.cos(sw)], [-Math.sin(rake), Math.cos(rake)]];
  var axle = [[0, rr], [def.wb, rf]], loads = [loadR, loadF], rad = [rr, rf];
  var sus = [def.sus[0], def.sus[1]];
  b.wh = [];
  for (var i = 0; i < 2; i++) {
    var s = sus[i], u = axes[i];
    var mEff = loads[i] / G0;
    var k = mEff * Math.pow(TAU * s.freq, 2);
    var F = loads[i] / u[1];
    var sag = s.sag * s.travel, pre = F / k - sag;
    if (pre < 0) { pre = 0; sag = F / k; }
    var cc = 2 * Math.sqrt(k * mEff);
    var Iw = 0.8 * mw[i] * rad[i] * rad[i];
    b.wh.push({
      r: rad[i], m: mw[i], I: Iw, meff: 1 / (1 / mw[i] + rad[i] * rad[i] / Iw),
      ux: u[0], uy: u[1],
      ax: axle[i][0] - u[0] * sag - def.com[0], ay: axle[i][1] - u[1] * sag - def.com[1],
      travel: s.travel, sag: sag, k: k, pre: pre, cc: cc * s.zc, cr: cc * s.zr,
      kp: 1.6 * k / (0.3 * s.travel * 0.3)          // rising rate over the last 30% of travel
    });
  }
  b.thrust = def.accel * b.Mtot * G0;               // peak push at the rear tyre, newtons
  b.vp = def.vp; b.vmax = def.vmax;
  b.mu = def.grip;
  b.brake = [def.brake * 0.42 * b.Mtot * G0 * rr, def.brake * 0.58 * b.Mtot * G0 * rf];
  var Isys = b.I + mw[0] * (def.com[0] * def.com[0] + 0.2) + mw[1] * (Math.pow(def.wb - def.com[0], 2) + 0.2);
  b.Isys = Isys;
  b.leanTq = def.leanAcc * Isys;
  b.spin = def.spin; b.groundSpin = def.groundSpin || 2.3;
  b.airDamp = def.airDamp == null ? 1.1 : def.airDamp;
  b.leanGround = def.leanGround == null ? 0.75 : def.leanGround;
  b.reaction = def.reaction == null ? 1 : def.reaction;
  b.kd = 0.5 * 1.2 * (def.cda || 0.55);
  b.rocket = (def.rocket || 0) * b.Mtot * G0; b.rocketV = def.rocketV || 24;
  b.tip = Math.atan2(def.com[0], def.com[1] - rr) + 0.08;   // pitch where the bike balances on the rear wheel
  b.ebrake = def.ebrake == null ? 0.05 : def.ebrake;
  b.pts = [];
  for (i = 0; i < def.body.length; i++) b.pts.push([def.body[i][0] - def.com[0], def.body[i][1] - def.com[1], def.body[i][2]]);
  b.headR = 0.15 * (def.rider.scale || 1);
  return b;
};

/* Where the rider's hips, shoulders and head are, in bike design coordinates
   (origin on the ground under the rear axle). lp: -1 leaning back .. +1 forward.
   The torso angle is limited so the hands can always reach the bars, which is why
   leaning back mostly slides the hips rearward with straight arms. */
RR.riderPose = function (def, lp, stand, out) {
  var R = def.rider, sc = R.scale || 1, T = 0.50 * sc, reach = 0.575 * sc;
  var st = Math.max(stand, R.stand || 0);
  var th = (R.torso == null ? 0.38 : R.torso) + lp * (lp > 0 ? 0.40 : 0.45) - st * 0.06;
  var hx = R.seat[0] + (lp > 0 ? 0.10 : 0.17) * lp * sc + st * 0.05, hy = R.seat[1] + (0.13 + st * 0.15 + (lp < 0 ? -lp * 0.03 : 0)) * sc;
  var gx = R.grip[0] - hx, gy = R.grip[1] - hy, D = Math.sqrt(gx * gx + gy * gy);
  var phi = Math.atan2(gx, gy);
  if (D >= T + reach) th = phi;
  else {
    var cs = (T * T + D * D - reach * reach) / (2 * T * D);
    if (cs < 1) { var dl = Math.acos(cs < -1 ? -1 : cs); if (th < phi - dl) th = phi - dl; else if (th > phi + dl) th = phi + dl; }
  }
  var sx = hx + Math.sin(th) * T, sy = hy + Math.cos(th) * T;
  var ha = th * 0.55 + 0.12;
  out.hipX = hx; out.hipY = hy; out.shX = sx; out.shY = sy;
  out.headX = sx + Math.sin(ha) * 0.23 * sc; out.headY = sy + Math.cos(ha) * 0.23 * sc;
  out.torso = th; out.headA = ha;
  return out;
};

/* ------------------------------------------------------------------ */
/* Simulation                                                          */
/* ------------------------------------------------------------------ */
var DT = 1 / 120, NSUB = 8, H = DT / NSUB;
RR.DT = DT;
var KT = 230e3, CT = 2600, CT2 = 170e3, RIM = 0.07, KRIM = 900e3;     // tyre
var KSTOP = 420e3, CSTOP = 9000;                         // suspension bump stops
var KB = 160e3, CB = 4200, MUB = 0.55;                   // frame scraping the ground
var NMAX = 70e3;                                         // safety cap on any one tyre contact
var FB = 0.5;                                            // friction solver gain

var C = new Contacts();
var pose = {};

RR.createSim = function (bike, track) {
  var s = {
    b: bike, track: track, col: track.col, g: track.gravity || G0, air0: track.airless ? 0 : 1, rocketF: 0,
    wx: [0, 0], wy: [0, 0], wvx: [0, 0], wvy: [0, 0], wa: [0, 0], ww: [0, 0],
    comp: [0, 0], compV: [0, 0], gnd: [false, false], load: [0, 0], slip: [0, 0], mat: [0, 0],
    nrmX: [0, 1], nrmY: [1, 1], bot: [0, 0], airW: [0, 0],
    gates: new Uint8Array(Math.max(1, track.loops.length)),
    events: []
  };
  // In low gravity full power would just flip the bike on the spot, so the push is
  // capped a little above what lifts the front wheel on flat ground.
  s.thrust = Math.min(bike.thrust, 1.15 * s.g * bike.com[0] / bike.com[1] * bike.Mtot);
  s.pred = 0.25 * Math.sqrt(G0 / s.g);
  RR.resetSim(s);
  return s;
};

RR.resetSim = function (s) {
  var b = s.b, tr = s.track;
  s.x = tr.start[0] + b.com[0]; s.y = tr.start[1] + b.com[1]; s.a = 0;
  s.vx = 0; s.vy = 0; s.w = 0;
  for (var i = 0; i < 2; i++) {
    var W = b.wh[i];
    s.wx[i] = s.x + W.ax + W.ux * W.sag; s.wy[i] = s.y + W.ay + W.uy * W.sag;
    s.wvx[i] = 0; s.wvy[i] = 0; s.wa[i] = 0; s.ww[i] = 0;
    s.comp[i] = W.sag; s.compV[i] = 0; s.gnd[i] = true; s.load[i] = 0; s.slip[i] = 0; s.bot[i] = 0; s.airW[i] = 0;
  }
  for (i = 0; i < s.gates.length; i++) s.gates[i] = 0;
  s.time = 0; s.started = false; s.crashed = false; s.finished = false; s.crashCause = '';
  s.lp = 0; s.air = false; s.airT = 0; s.rot = 0; s.boost = 0; s.scrape = 0; s.thr = 0;
  s.flips = 0; s.bestAir = 0; s.jumpX = 0; s.bestJump = 0; s.maxSpeed = 0; s.wheelieT = 0;
  s.finishTime = 0; s.sinceCrash = 0; s.driveF = 0; s.body = false;
  s._pvx = [0, 0]; s._pvy = [0, 0]; s.pendFlip = null;
  s.events.length = 0;
  // let the suspension settle before the clock starts
  var idle = { lean: 0, brake: true, gas: false };
  for (i = 0; i < 90; i++) tick(s, idle, true);
  s.events.length = 0; s.time = 0; s.vx = 0;
};

function substep(s, inp, dt) {
  var b = s.b, col = s.col, g = s.g, i, k, n;
  var ca = Math.cos(s.a), sa = Math.sin(s.a);
  var fx = 0, fy = -b.M * g, tq = 0;
  var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  var kd = b.kd * s.air0;
  fx -= kd * sp * s.vx; fy -= kd * sp * s.vy;
  var gas = inp.gas && !inp.brake && !s.crashed && !s.finished;
  var braking = inp.brake || s.finished;
  var boost = s.boost > 0 ? 1 : 0;

  for (i = 0; i < 2; i++) {
    var W = b.wh[i];
    var Ax = s.x + ca * W.ax - sa * W.ay, Ay = s.y + sa * W.ax + ca * W.ay;
    var ux = ca * W.ux - sa * W.uy, uy = sa * W.ux + ca * W.uy;
    var qx = s.wx[i] - Ax, qy = s.wy[i] - Ay;
    var comp = qx * ux + qy * uy;
    var rx = s.wx[i] - s.x, ry = s.wy[i] - s.y;
    var rvx = s.wvx[i] - (s.vx - s.w * ry), rvy = s.wvy[i] - (s.vy + s.w * rx);
    var cv = rvx * ux + rvy * uy;
    var F = -W.k * (comp + W.pre) - (cv > 0 ? W.cc : W.cr) * cv;
    var e = comp - W.travel * 0.7;
    if (e > 0) { F -= W.kp * e * e; if (cv > 0) F -= W.cc * 6 * (e / (W.travel * 0.3)) * cv; }
    if (comp > W.travel) {
      F -= KSTOP * (comp - W.travel) + CSTOP * cv;
      if (!s.bot[i]) { s.bot[i] = 1; if (cv > 0.6) s.events.push({ t: 'bottom', w: i, v: cv }); }
    } else if (comp < W.travel * 0.9) s.bot[i] = 0;
    if (comp < 0) { F -= KSTOP * comp; if (cv < 0) F -= CSTOP * cv; }
    s.comp[i] = comp; s.compV[i] = cv;
    var wfx = F * ux, wfy = F * uy - W.m * g, wt = 0;
    fx -= F * ux; fy -= F * uy; tq -= rx * (F * uy) - ry * (F * ux);

    n = query(col, s.wx[i], s.wy[i], W.r, s.gates, C);
    var Nsum = 0, slipSum = 0;
    for (k = 0; k < n; k++) {
      var nx = C.nx[k], ny = C.ny[k], pen = C.pen[k];
      var vn = s.wvx[i] * nx + s.wvy[i] * ny;
      var N = KT * pen - (CT + CT2 * pen) * vn;
      if (pen > RIM) N += KRIM * (pen - RIM);
      if (N <= 0) continue;
      if (N > NMAX) N = NMAX;
      var tx = ny, ty = -nx;
      var slip = s.wvx[i] * tx + s.wvy[i] * ty + s.ww[i] * W.r;
      var mat = RR.MATS[C.mat[k]];
      var lim = b.mu * mat.mu * N;
      if (slip > 1.5 || slip < -1.5) lim *= 0.88;
      var Ft = -slip * W.meff * FB / dt;
      if (Ft > lim) Ft = lim; else if (Ft < -lim) Ft = -lim;
      wfx += N * nx + Ft * tx; wfy += N * ny + Ft * ty;
      wt += Ft * W.r;
      // rolling drag
      var rollT = mat.roll * N * W.r, wAbs = s.ww[i] < 0 ? -s.ww[i] : s.ww[i];
      if (wAbs > 0.5) wt += s.ww[i] > 0 ? -rollT : rollT;
      Nsum += N; slipSum += slip * N;
      s.nrmX[i] = nx; s.nrmY[i] = ny; s.mat[i] = C.mat[k];
    }
    if (Nsum > 0) { s._gnd[i] = 1; s._load[i] += Nsum; s._slip[i] += slipSum / Nsum; s._cn[i]++; }

    var wv = -s.ww[i] * W.r;                       // forward speed of the tyre surface
    if (i === 0) {
      var Fd = 0;
      if (gas && s.airW[0] < 0.12) {
        var vmax = b.vmax * (boost ? 1.22 : 1);
        Fd = s.thrust * (boost ? 1.45 : 1);
        var vv = wv > 1 ? wv : 1;
        if (vv > b.vp) Fd *= b.vp / vv;
        if (boost) Fd = Math.max(Fd, s.thrust * 0.7);
        var lm = (vmax - wv) / (0.07 * vmax);
        Fd *= lm < 0 ? 0 : lm > 1 ? 1 : lm;
        if (Nsum > 0 && s.airW[1] > 0.05) {
          // front wheel is up: the rider rolls off the gas as the bike nears the tip-over point
          var pr = s.a - Math.atan2(-s.nrmX[0], s.nrmY[0]);
          pr -= TAU * Math.round(pr / TAU);
          var cut = (b.tip - (inp.lean < -0.3 ? 0.2 : 0.38) - (pr + s.pred * s.w)) / 0.4;
          Fd *= cut < 0 ? 0 : cut > 1 ? 1 : cut;
        }
        wt -= Fd * W.r;
        tq += Fd * W.r * b.reaction;
      } else if (!braking && Nsum > 0 && wv > 0.5) {
        var eb = b.ebrake * b.Mtot * g * W.r;       // engine braking, throttle closed
        wt += eb; tq -= eb;
      }
      s.driveF = Fd;
    }
    if (braking) {
      var tb = -s.ww[i] * W.I / dt * 0.5, tbm = b.brake[i];
      if (tb > tbm) tb = tbm; else if (tb < -tbm) tb = -tbm;
      wt += tb; tq -= tb * (Nsum > 0 ? 1 : 0.35);
    }
    s.wvx[i] += wfx / W.m * dt; s.wvy[i] += wfy / W.m * dt; s.ww[i] += wt / W.I * dt;
  }

  // frame and rider touching the ground
  var pts = b.pts;
  for (i = 0; i < pts.length; i++) {
    var lx = pts[i][0], ly = pts[i][1], pr = pts[i][2];
    var prx = ca * lx - sa * ly, pry = sa * lx + ca * ly;
    n = query(col, s.x + prx, s.y + pry, pr, s.gates, C);
    for (k = 0; k < n; k++) {
      var bnx = C.nx[k], bny = C.ny[k];
      var pvx = s.vx - s.w * pry, pvy = s.vy + s.w * prx;
      var bvn = pvx * bnx + pvy * bny;
      var BN = KB * C.pen[k] - CB * bvn;
      if (BN <= 0) continue;
      if (BN > 60000) BN = 60000;
      var btx = bny, bty = -bnx, bvt = pvx * btx + pvy * bty;
      var rxt = prx * bty - pry * btx;
      var bm = 1 / (1 / b.M + rxt * rxt / b.I);
      var BF = -bvt * bm * FB / dt, bl = MUB * BN;
      if (BF > bl) BF = bl; else if (BF < -bl) BF = -bl;
      var ffx = BN * bnx + BF * btx, ffy = BN * bny + BF * bty;
      fx += ffx; fy += ffy; tq += prx * ffy - pry * ffx;
      s._scrape += BN * (bvt < 0 ? -bvt : bvt);
      s._body = 1;
    }
  }
  // helmet: touching anything ends the run
  if (!s.crashed && !s.finished) {
    RR.riderPose(b.def, s.lp, 0, pose);
    var hx = pose.headX - b.com[0], hy = pose.headY - b.com[1];
    var hwx = s.x + ca * hx - sa * hy, hwy = s.y + sa * hx + ca * hy;
    if (query(col, hwx, hwy, b.headR, s.gates, C) > 0) {
      for (k = 0; k < C.n; k++) if (C.pen[k] > 0.015) { s._crash = 'head'; break; }
    }
    // shoulders and back count too: landing on your back is not a save
    if (!s._crash) {
      var bx2 = pose.shX - b.com[0] - 0.04, by2 = pose.shY - b.com[1] - 0.05;
      if (query(col, s.x + ca * bx2 - sa * by2, s.y + sa * bx2 + ca * by2, b.headR * 1.05, s.gates, C) > 0) {
        for (k = 0; k < C.n; k++) if (C.pen[k] > 0.03) { s._crash = 'head'; break; }
      }
    }
  }

  // rider leaning: a torque that chases a spin rate, capped by how strong the rider is
  if (!s.crashed && !s.finished) {
    var L = inp.lean;
    var grounded = s.airW[0] < 0.03 || s.airW[1] < 0.03;
    if (L !== 0) {
      var wtgt = -L * (grounded ? Math.min(b.spin, b.groundSpin) : b.spin), dw = wtgt - s.w, tl = 0;
      if (dw * wtgt > 0) {
        tl = dw * b.Isys * 14;
        // the rider has to shift their weight first, so a quick tap is a nudge and a hold is a full heave
        var ramp = L < 0 ? -s.lp : s.lp; ramp = ramp < 0 ? 0 : ramp > 1 ? 1 : ramp;
        var tm = b.leanTq * (L < 0 ? -L : L) * (0.3 + 0.7 * ramp);
        if (tl > tm) tl = tm; else if (tl < -tm) tl = -tm;
      }
      if (grounded) tl *= b.leanGround;
      tq += tl;
    } else if (!grounded) tq -= s.w * b.airDamp * b.Isys;
    if (b.rocket && gas) {
      var rk = b.rocket * (boost ? 1.3 : 1), fwd = s.vx * ca + s.vy * sa;
      var rl = (b.rocketV * (boost ? 1.15 : 1) - fwd) / 4;
      rk *= rl < 0 ? 0 : rl > 1 ? 1 : rl;
      fx += rk * ca; fy += rk * sa;
      s.rocketF = rk;
    }
  }

  s.vx += fx / b.M * dt; s.vy += fy / b.M * dt; s.w += tq / b.I * dt;

  // keep each wheel on its suspension axis
  for (i = 0; i < 2; i++) {
    W = b.wh[i];
    ux = ca * W.ux - sa * W.uy; uy = sa * W.ux + ca * W.uy;
    var px = -uy, py = ux;
    Ax = s.x + ca * W.ax - sa * W.ay; Ay = s.y + sa * W.ax + ca * W.ay;
    rx = s.wx[i] - s.x; ry = s.wy[i] - s.y;
    var l = (s.wx[i] - Ax) * px + (s.wy[i] - Ay) * py;
    var lv = (s.wvx[i] - (s.vx - s.w * ry)) * px + (s.wvy[i] - (s.vy + s.w * rx)) * py;
    var cr = rx * py - ry * px;
    var jj = -(lv + 0.2 * l / dt) / (1 / W.m + 1 / b.M + cr * cr / b.I);
    s.wvx[i] += jj * px / W.m; s.wvy[i] += jj * py / W.m;
    s.vx -= jj * px / b.M; s.vy -= jj * py / b.M; s.w -= jj * cr / b.I;
  }

  s.x += s.vx * dt; s.y += s.vy * dt; s.a += s.w * dt;
  for (i = 0; i < 2; i++) {
    s.wx[i] += s.wvx[i] * dt; s.wy[i] += s.wvy[i] * dt; s.wa[i] += s.ww[i] * dt;
  }
}

/* One 120th of a second of game time. */
function tick(s, inp, settling) {
  var b = s.b, i, tr = s.track;
  s._gnd = [0, 0]; s._load = [0, 0]; s._slip = [0, 0]; s._cn = [0, 0]; s._scrape = 0; s._body = 0; s._crash = '';
  // loop gates: the half of a loop you are not on is switched off so you can ride through it
  for (i = 0; i < tr.loops.length; i++) {
    var lp = tr.loops[i];
    if (s.gates[i] === 0) { if (s.x < lp.cx && s.y > lp.cy && s.x > lp.cx - lp.R) s.gates[i] = 1; }
    else if (s.x < lp.cx - lp.R - 1.5) s.gates[i] = 0;
  }
  var tgt = (s.crashed || s.finished) ? 0 : inp.lean;
  s.lp += clamp(tgt - s.lp, -DT * 5.5, DT * 5.5);
  for (i = 0; i < NSUB; i++) substep(s, inp, H);

  var wasAir = s.air;
  for (i = 0; i < 2; i++) {
    var g = s._gnd[i] === 1;
    if (g && !s.gnd[i] && s.airW[i] > 0.1) {
      var lv = -(s._pvx[i] * s.nrmX[i] + s._pvy[i] * s.nrmY[i]);
      s.events.push({ t: 'land', w: i, v: lv, air: s.airW[i], x: s.wx[i], y: s.wy[i], mat: s.mat[i] });
    }
    if (!g) { s.airW[i] += DT; s._pvx[i] = s.wvx[i]; s._pvy[i] = s.wvy[i]; }
    else s.airW[i] = 0;
    s.gnd[i] = g;
    s.load[i] = s._cn[i] ? s._load[i] / NSUB : 0;
    s.slip[i] = s._cn[i] ? s._slip[i] / s._cn[i] : 0;
  }
  s.scrape = s._scrape / NSUB;
  s.body = s._body === 1;
  if (settling) return;
  var air = !s.gnd[0] && !s.gnd[1] && !s.body;
  if (air) {
    if (!wasAir) { s.airT = 0; s.rot = 0; s.jumpX = s.x; }
    s.airT += DT; s.rot += s.w * DT;
  } else if (wasAir) {
    // touched down: count the flips
    var ar = s.rot < 0 ? -s.rot : s.rot;
    var nf = Math.floor((ar + 1.2) / TAU);
    if (s.airT > s.bestAir) s.bestAir = s.airT;
    var jd = s.x - s.jumpX; if (jd > s.bestJump) s.bestJump = jd;
    if (nf > 0 && !s.crashed && s.airT > 0.35) {
      s.pendFlip = { n: nf, dir: s.rot > 0 ? 1 : -1, t: 0.25, air: s.airT };
    } else if (s.airT > 0.9 && !s.crashed) s.events.push({ t: 'air', air: s.airT, dist: jd });
  }
  s.air = air;
  if (s.pendFlip) {
    s.pendFlip.t -= DT;
    if (s.crashed) s.pendFlip = null;
    else if (s.pendFlip.t <= 0) {
      s.flips += s.pendFlip.n;
      s.boost = Math.min(3.2, s.boost + 0.9 + 0.55 * s.pendFlip.n);
      s.events.push({ t: 'flip', n: s.pendFlip.n, dir: s.pendFlip.dir, air: s.pendFlip.air });
      s.pendFlip = null;
    }
  }
  if (s.boost > 0) s.boost -= DT;
  if (!s.crashed && s.gnd[0] && !s.gnd[1] && s.airW[1] > 0.25) s.wheelieT += DT;

  if (s.started && !s.finished && !s.crashed) s.time += DT;
  var spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  if (spd > s.maxSpeed && !s.crashed) s.maxSpeed = spd;

  if (!(spd < 150) || !(s.w > -80 && s.w < 80) || s.y !== s.y) {
    // should never happen, but a broken state must not leak into the game
    var sx = s.x === s.x ? s.x : tr.start[0], sy = s.y === s.y ? s.y : tr.start[1] + 3;
    s.vx = 0; s.vy = 0; s.w = 0; s.x = sx; s.y = sy; if (s.a !== s.a) s.a = 0;
    for (i = 0; i < 2; i++) { s.wvx[i] = 0; s.wvy[i] = 0; s.ww[i] = 0; s.wx[i] = sx + (i ? 0.7 : -0.7) * Math.cos(s.a); s.wy[i] = sy + (i ? 0.7 : -0.7) * Math.sin(s.a) - 0.3; }
    if (!s.crashed && !s.finished) s._crash = 'head';
    s.glitch = (s.glitch || 0) + 1;
  }
  if (!s.crashed && !s.finished) {
    var cause = s._crash;
    if (!cause) {
      var hz = tr.hazards;
      for (i = 0; i < hz.length; i++) {
        if (s.x > hz[i].x0 && s.x < hz[i].x1 && s.y < hz[i].y + 0.35) { cause = hz[i].type; break; }
      }
      if (!cause && s.y < tr.killY) cause = 'fall';
    }
    if (cause) {
      s.crashed = true; s.crashCause = cause; s.sinceCrash = 0;
      s.events.push({ t: 'crash', cause: cause, x: s.x, y: s.y, v: spd });
    } else if (s.x >= tr.finishX) {
      s.finished = true; s.finishTime = s.time;
      s.events.push({ t: 'finish', time: s.time });
    }
  }
  if (s.crashed) s.sinceCrash += DT;
}
RR.tick = function (s, inp) { tick(s, inp, false); };

/* Copy of everything that changes, so the test bot can rewind. */
var NUMS = ['x', 'y', 'a', 'vx', 'vy', 'w', 'time', 'lp', 'airT', 'rot', 'boost', 'flips', 'bestAir', 'jumpX', 'bestJump', 'maxSpeed', 'wheelieT', 'finishTime', 'sinceCrash', 'driveF'];
var ARRS = ['wx', 'wy', 'wvx', 'wvy', 'wa', 'ww', 'comp', 'compV', 'gnd', 'load', 'slip', 'mat', 'nrmX', 'nrmY', 'bot', 'airW', '_pvx', '_pvy'];
RR.snapshot = function (s) {
  var o = {}, i;
  for (i = 0; i < NUMS.length; i++) o[NUMS[i]] = s[NUMS[i]];
  for (i = 0; i < ARRS.length; i++) o[ARRS[i]] = s[ARRS[i]].slice();
  o.started = s.started; o.crashed = s.crashed; o.finished = s.finished; o.air = s.air; o.crashCause = s.crashCause;
  o.gates = Array.prototype.slice.call(s.gates);
  o.pendFlip = s.pendFlip ? { n: s.pendFlip.n, dir: s.pendFlip.dir, t: s.pendFlip.t, air: s.pendFlip.air } : null;
  return o;
};
RR.restore = function (s, o) {
  var i;
  for (i = 0; i < NUMS.length; i++) s[NUMS[i]] = o[NUMS[i]];
  for (i = 0; i < ARRS.length; i++) s[ARRS[i]] = o[ARRS[i]].slice();
  s.started = o.started; s.crashed = o.crashed; s.finished = o.finished; s.air = o.air; s.crashCause = o.crashCause;
  for (i = 0; i < o.gates.length; i++) s.gates[i] = o.gates[i];
  s.pendFlip = o.pendFlip ? { n: o.pendFlip.n, dir: o.pendFlip.dir, t: o.pendFlip.t, air: o.pendFlip.air } : null;
  s.events.length = 0;
};

if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
