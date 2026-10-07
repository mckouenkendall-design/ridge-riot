/* Ridge Riot: a simple robot rider.
   Used by tools/bot.js to prove every track can be finished and to set the
   star times, and by the title screen to show a bike riding in the background.
   It only has the same three controls a player has: lean back, lean forward, brake.
   It rides the way a person does: in the air it looks at where it is going to
   come down and nudges the bike until it will land flat on that slope. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var TAU = Math.PI * 2;
function wrap(a) { return a - TAU * Math.round(a / TAU); }

RR.botInput = function (s, P, out) {
  var b = s.b, tr = s.track, air = !s.gnd[0] && !s.gnd[1];
  var err, th = P.th || 0.2, lean = 0;
  if (!air) {
    var i = s.gnd[0] ? 0 : 1;
    var slope = Math.atan2(-s.nrmX[i], s.nrmY[i]);
    err = wrap(s.a - slope - (P.bias || 0)) + s.w * 0.12;
    // only fuss on the ground when the bike is properly out of shape
    if (err > (P.gth || 0.42)) lean = 1; else if (err < -(P.gth || 0.42) * 0.8) lean = -1;
  } else {
    // follow the arc of the jump to see when and on what slope we come down
    var x = s.x, y = s.y - b.com[1] * 0.9, vx = s.vx, vy = s.vy, g = s.g, t = 0, h = 0.04, target = 0, T = 3;
    for (var k = 0; k < 160; k++) {
      x += vx * h; vy -= g * h; y += vy * h; t += h;
      if (y <= RR.groundY(tr, x)) { target = (RR.groundSlope(tr, x - 0.6) + RR.groundSlope(tr, x + 0.6)) * 0.5; T = t; break; }
    }
    if (target > 1.2 || target < -1.2) target = 0;
    target += 0.08 + (P.airBias || 0);
    // where the nose will be pointing at touchdown if we do nothing more
    var d = b.airDamp, coast = d > 0.01 ? (1 - Math.exp(-d * T)) / d : T;
    err = wrap(s.a + s.w * coast - target);
    var cur = out.lean || 0;
    if (err > th || (cur > 0 && err > th * 0.3)) lean = 1;
    else if (err < -th || (cur < 0 && err < -th * 0.3)) lean = -1;
  }
  out.lean = lean;
  var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  var cap = P.vcap || 1e9;
  // under a rock roof, go slowly enough that humps do not throw the rider into it
  if (tr.roofs === undefined) tr.roofs = tr.feats.filter(function (f) { return f.t === 'roof'; });
  for (var r = 0; r < tr.roofs.length; r++) if (s.x > tr.roofs[r].x0 - 16 && s.x < tr.roofs[r].x1 - 3) cap = Math.min(cap, P.roofV || 9.5);
  out.brake = sp > cap && !air;
  out.gas = true;
  return out;
};

if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
