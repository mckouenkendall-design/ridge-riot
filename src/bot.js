/* Ridge Riot: a simple robot rider.
   Used by tools/bot.js to prove every track can be finished and to set the
   star times, and by the title screen to show a bike riding in the background.
   It only has the same four controls a player has: gas, brake, lean back, lean forward.
   It rides the way a person does: in the air it looks at where it is going to
   come down and nudges the bike until it will land flat on that slope. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var TAU = Math.PI * 2;
function wrap(a) { return a - TAU * Math.round(a / TAU); }

RR.botInput = function (s, P, out) {
  var b = s.b, tr = s.track, air = !s.gnd[0] && !s.gnd[1];
  var err, th = P.th || 0.2, lean = 0, trick = false;
  P.wantV = out.cap != null && out.cap < 1e8 ? out.cap : null;
  if (!air) {
    var i = s.gnd[0] ? 0 : 1;
    var slope = Math.atan2(-s.nrmX[i], s.nrmY[i]);
    err = wrap(s.a - slope - (P.bias || 0)) + s.w * 0.12;
    // only fuss on the ground when the bike is properly out of shape
    if (err > (P.gth || 0.42)) lean = 1; else if (err < -(P.gth || 0.42) * 0.8) lean = -1;
  } else {
    // follow the arc of the jump to see when and on what slope we come down
    var x = s.x, y = s.y - b.com[1] * 0.9, vx = s.vx, vy = s.vy, g = s.g, t = 0, h = 0.04, target = 0, T = 3, y0 = y + 0.2, two = tr.forks && tr.forks.length;
    for (var k = 0; k < 160; k++) {
      x += vx * h; vy -= g * h; y += vy * h; t += h;
      if (two) { if (y <= RR.surfaceY(tr, x, y0)) { target = RR.surfaceSlope(tr, x, y0); T = t; break; } }
      else if (y <= RR.groundY(tr, x)) { target = (RR.groundSlope(tr, x - 0.6) + RR.groundSlope(tr, x + 0.6)) * 0.5; T = t; break; }
    }
    // the hop bike saves its puff for a jump that is going to come up short
    if (b.hop && s.hopReady && s.vy < 0 && P.trick !== false) {
      var hz = tr.hazards;
      for (var q = 0; q < hz.length; q++) if (x > hz[q].x0 - 0.3 && x < hz[q].x1 + 0.6) { trick = true; break; }
    }
    if (target > 1.2 || target < -1.2) target = 0;
    /* Flips, when asked for (P.flips): at take-off, work out how many whole turns fit in the air time, then hold the
       lean until nearly round and let the normal landing control square it up. P.flips: { dir: 'b'|'f'|'alt', max, at: [x0, x1], spare } */
    var F = P.flips;
    if (F && !P._fl && s.airT < 0.06 && s.airT > 0) {
      var spare = F.spare == null ? 0.1 : F.spare, k = 0, need;
      for (var kk = F.max || 2; kk >= 1; kk--) { need = (TAU * kk - 1.0) / b.spin + 0.25 + spare; if (T >= need) { k = kk; break; } }
      if (k && (!F.at || (s.x >= F.at[0] && s.x <= F.at[1]))) {
        var dd = F.dir === 'alt' ? ((P._flipN || 0) % 2 ? 'f' : 'b') : (F.dir || 'b');
        P._fl = { d: dd === 'b' ? -1 : 1, k: k, done: false };
      } else P._fl = { k: 0, done: true };
    }
    if (P._fl && !P._fl.done) {
      if (Math.abs(s.rot) >= TAU * P._fl.k - 0.9) { P._fl.done = true; P._flipN = (P._flipN || 0) + 1; }
      else { out.lean = P._fl.d; out.trick = false; P._lastAir = true; return finishGas(s, P, out, true); }
    }
    target += 0.08 + (P.airBias || 0);
    // a winged bike that is going too fast for what is coming keeps its nose down, so the wings stop lifting and it lands to brake
    if (b.glide && P.wantV != null && Math.sqrt(s.vx * s.vx + s.vy * s.vy) > P.wantV + 0.5) target = Math.atan2(s.vy, s.vx) - 0.04;
    // where the nose will be pointing at touchdown if we do nothing more
    var d = b.airDamp, coast = d > 0.01 ? (1 - Math.exp(-d * T)) / d : T;
    err = wrap(s.a + s.w * coast - target);
    var cur = out.lean || 0;
    // tiny hops are over before a correction could help, so leave them alone unless things are badly wrong
    var big = T > (P.minAir == null ? 0.3 : P.minAir) ? 1 : 2.5;
    if (err > th * big || (cur > 0 && err > th * 0.3)) lean = 1;
    else if (err < -th * big || (cur < 0 && err < -th * 0.3)) lean = -1;
    // the pivot bike stops its spin dead once the nose is where it wants it
    if (b.pivot && lean === 0 && P.trick !== false && (s.w > 1 || s.w < -1) && err < th && err > -th) trick = true;
  }
  if (!air && P._fl) P._fl = null;
  // a wheelie when asked (P.wheelie: [x0, x1]): hold the front up at about 25 degrees
  if (P.wheelie && !air && s.x > P.wheelie[0] && s.x < P.wheelie[1]) {
    var sl = Math.atan2(-s.nrmX[0], s.nrmY[0]), pa = wrap(s.a - sl) + s.w * 0.15;
    lean = pa < 0.38 ? -1 : pa > 0.5 ? 1 : 0; P._wh = true;
  }
  // two-route tracks: P.route 'high' leans back through the fork sign
  if (P.route === 'high' && tr.forks && !air) for (var fi = 0; fi < tr.forks.length; fi++) if (s.x > tr.forks[fi].x - 4 && s.x < tr.forks[fi].x + 0.5) lean = -1;
  out.lean = lean; out.trick = trick;
  return finishGas(s, P, out, air);
};
function finishGas(s, P, out, air) {
  var b = s.b, tr = s.track;
  var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  var cap = P.vcap || 1e9;
  /* Slow zones: stretches where full gas gets you hurt. The track carries a sensible
     limit for each one; the test tools can hand in limits worked out for this bike.
     The rider starts slowing early enough to be down to the limit as the zone begins. */
  if (tr.zones === undefined) tr.zones = tr.feats.filter(function (f) { return f.t === 'zone'; });
  var zs = tr.zones, dec = (P.dec || 0.42) * s.g;
  for (var r = 0; r < zs.length; r++) {
    var z = zs[r], zv = P.caps ? P.caps[r] : z.v;
    if (zv == null || s.x >= z.x1 || s.x < z.x0 - 90) continue;
    var dz = z.x0 - s.x - (P.early == null ? 2.5 : P.early);
    var allow = dz > 0 ? Math.sqrt(zv * zv + 2 * dec * dz) : zv;
    if (allow < cap) cap = allow;
  }
  out.cap = cap;
  out.brake = sp > cap + (cap < 1e8 ? 0.5 : 0) && !air;
  // throttle: held open, but eased off when the front wheel climbs too high, the way a rider would
  var gas = !out.brake && sp < cap - 0.15;
  if (gas && s.gnd[0] && !s.gnd[1] && !(P.wheelie && s.x > P.wheelie[0] && s.x < P.wheelie[1])) {
    var pr = wrap(s.a - Math.atan2(-s.nrmX[0], s.nrmY[0])) + s.w * (P.wlook == null ? 0.22 : P.wlook);
    if (pr > (P.wth || 0.4)) gas = false;
  }
  out.gas = gas;
  return out;
}

if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
