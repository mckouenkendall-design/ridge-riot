/* Ridge Riot: still more riders (the fourth batch).
   Same rules as art-heads.js: a head is drawn in "helmet space", a circle of radius 1 with the face pointing along +x and up as +y. */
(function (root) {
'use strict';
var RR = root.RR, A = RR.Art, K = A.kit, HEAD = A.HEADS;
var ci = K.ci, po = K.po, bl = K.bl, ln = K.ln, eye = K.eye, el = K.el, star = K.star, puff = K.puff, hsl = K.hsl, SKIN = K.SKIN, LW = K.LW, OUT = K.OUT, TAU = K.TAU;

/* a lit edge or shade drawn as an arc on the head's own circle */
function arc(c, r, a0, a1, w, col) { c.beginPath(); c.arc(0, 0, r, a0, a1); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
/* a smooth open line through points with a dark outline (tentacles, snakes, whiskers) */
function cv(c, p, w, col, ow) { A.curve(c, p, w, col, ow == null ? 0.1 : ow); }
/* one smooth bend from (x0, y0) through the pull of (cx, cy) to (x1, y1) */
function qline(c, x0, y0, cx, cy, x1, y1, w, col) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
/* a soft glow: one radial gradient. rgb is any 'rgb(r,g,b)' or 'r,g,b' string, a is the strength 0 to 1 */
function glow(c, x, y, r, rgb, a) {
  var g = c.createRadialGradient(x, y, 0, x, y, r), q = rgb.replace(/[^0-9,]/g, '');
  g.addColorStop(0, 'rgba(' + q + ',' + Math.min(1, a).toFixed(2) + ')'); g.addColorStop(0.45, 'rgba(' + q + ',' + (a * 0.4).toFixed(2) + ')'); g.addColorStop(1, 'rgba(' + q + ',0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}

/* ---------------------------- rare ---------------------------- */
HEAD.genie = function (c, t) {
  var k, cs = [];
  for (k = 0; k < 8; k++) { var s = k / 7; cs.push([-0.62 - s * 2.1, -0.8 - s * 0.3 + Math.sin(t * 3.2 - s * 6) * (0.1 + 0.3 * s), 0.46 * (1 - s * 0.78)]); }
  puff(c, cs, '#3d8cf0');                                                                                         // the smoke tail
  cs.forEach(function (q) { ci(c, q[0] + q[2] * 0.12, q[1] - q[2] * 0.2, q[2] * 0.68, '#2f6fd0', 0); });
  cs.forEach(function (q) { ci(c, q[0] - q[2] * 0.3, q[1] + q[2] * 0.34, q[2] * 0.26, '#a6dcff', 0); });
  cv(c, [cs[7][0], cs[7][1], cs[7][0] - 0.35, cs[7][1] + 0.22 + Math.sin(t * 4) * 0.08, cs[7][0] - 0.5, cs[7][1] - 0.1], 0.1, '#3d8cf0', 0.07);
  for (k = 0; k < 3; k++) { var f = (t * 0.6 + k * 0.34) % 1; c.globalAlpha = Math.sin(f * Math.PI); star(c, -1.2 - k * 0.7 + Math.sin(f * 5) * 0.1, -0.35 - f * 0.9 + k * 0.1, 0.1 + 0.05 * k, '#ffe97a'); } c.globalAlpha = 1;
  ci(c, 0, 0, 1, '#d79a62');                                                                                      // face
  arc(c, 0.86, 3.6, 5.4, 0.16, 'rgba(120,60,20,0.25)');
  po(c, [-0.1, 0.3, -0.95, 0.68, -0.52, -0.1], '#d79a62', 0.12);                                                  // pointed ear
  po(c, [-0.2, 0.22, -0.66, 0.5, -0.46, 0.0], '#b97a46', 0);
  ci(c, -0.42, -0.26, 0.11, null, 0); c.beginPath(); c.arc(-0.42, -0.28, 0.12, 0, TAU); c.lineWidth = 0.07; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 0.045; c.strokeStyle = '#ffd23f'; c.stroke();   // earring
  ci(c, 1.0, -0.02, 0.15, '#c98a54', 0.1);                                                                        // nose
  ci(c, 0.35, -0.3, 0.16, 'rgba(255,110,90,0.35)', 0);
  bl(c, [0.52, -0.5, 1.06, -0.44, 1.0, -0.98, 0.78, -1.62, 0.52, -1.0], '#241a2c', 0.12);                          // goatee
  ln(c, [0.66, -0.64, 0.76, -1.3], 0.04, '#4a3a58');
  bl(c, [0.5, -0.3, 0.92, -0.22, 1.24, -0.12, 1.42, 0.06, 1.3, -0.3, 0.96, -0.46, 0.56, -0.4], '#241a2c', 0.1);       // moustache
  ln(c, [0.64, -0.26, 1.0, -0.24], 0.035, '#4a3a58');
  ln(c, [0.62, -0.58, 0.82, -0.6, 0.96, -0.52], 0.05, '#fff6e6');                                                   // grin
  el(c, 0.62, 0.1, 0.19, 0.12, -0.08, '#ffffff', 0.07); ci(c, 0.68, 0.1, 0.07, OUT, 0); ci(c, 0.7, 0.13, 0.025, '#ffffff', 0);
  ln(c, [0.36, 0.34, 0.66, 0.32, 0.92, 0.2], 0.1, '#241a2c');                                                       // brow
  // turban
  bl(c, [-1.14, 0.0, -1.14, 0.9, -0.6, 1.6, 0.3, 1.76, 1.0, 1.3, 1.1, 0.7, 1.02, 0.44, 0.4, 0.6, -0.4, 0.4], '#6a35c8');
  c.save(); c.beginPath(); c.moveTo(-1.14, 0); c.quadraticCurveTo(-1.2, 1.2, 0.3, 1.8); c.quadraticCurveTo(1.2, 1.5, 1.1, 0.5); c.lineTo(0.4, 0.62); c.lineTo(-0.4, 0.4); c.closePath(); c.clip();
  ln(c, [-1.3, 0.3, -0.2, 1.0, 0.6, 1.9], 0.15, '#8a55e8'); ln(c, [-1.3, 0.62, 0.0, 1.2, 0.9, 1.9], 0.13, '#4a22a0');
  ln(c, [-1.0, 0.1, 0.0, 0.62, 1.2, 0.74], 0.16, '#e8b12e'); ln(c, [-1.0, 0.1, 0.0, 0.62, 1.2, 0.74], 0.05, '#fff3b0');
  ln(c, [-0.9, 1.5, 0.1, 1.28, 1.2, 1.0], 0.07, '#e8b12e');
  c.restore();
  bl(c, [-1.14, 0.0, -1.14, 0.9, -0.6, 1.6, 0.3, 1.76, 1.0, 1.3, 1.1, 0.7, 1.02, 0.44, 0.4, 0.6, -0.4, 0.4], null, LW);
  ln(c, [-0.9, 1.1, -0.5, 1.55], 0.08, 'rgba(255,255,255,0.35)');
  var fw = Math.sin(t * 2.4) * 0.12;                                                                               // the feather
  bl(c, [0.5, 1.1, 0.42, 1.8, 0.4 + fw, 2.5, 0.66 + fw, 2.95, 0.9 + fw, 2.45, 0.92, 1.75, 0.84, 1.1], '#2fd0b0');
  ln(c, [0.66, 1.1, 0.64 + fw * 0.6, 1.9, 0.68 + fw, 2.7], 0.05, '#0f8a74'); el(c, 0.66 + fw * 0.9, 2.3, 0.1, 0.17, 0, '#ffd23f', 0.05); ci(c, 0.66 + fw * 0.9, 2.3, 0.045, '#3a2a9a', 0);
  ln(c, [0.52, 1.3, 0.46, 1.9], 0.04, '#9af0dc');
  bl(c, [0.42, 0.9, 0.54, 1.14, 0.84, 1.18, 0.98, 0.9, 0.78, 0.66, 0.5, 0.68], '#e8b12e', 0.1);                      // gold brooch
  po(c, [0.7, 0.68, 0.9, 0.9, 0.7, 1.12, 0.5, 0.9], '#ff3a6a', 0.08);                                             // big gem
  po(c, [0.7, 0.68, 0.5, 0.9, 0.7, 0.9], '#b81e4a', 0); ln(c, [0.58, 0.96, 0.66, 1.06], 0.045, '#ffd0dc');
  var tw = 0.5 + 0.5 * Math.sin(t * 5); c.globalAlpha = 0.3 + 0.7 * tw; star(c, 0.78, 1.0, 0.1 + 0.06 * tw, '#ffffff'); c.globalAlpha = 1;
};

HEAD.annie = function (c, t) {
  var k, sw = Math.sin(t * 2.2), pu = 0.5 + 0.5 * Math.sin(t * 4.4);
  var ex = 1.95 + sw * 0.25, ey = 1.62 + Math.sin(t * 2.2 + 1.2) * 0.12;
  cv(c, [0.1, 0.8, 0.3, 1.7, 1.0 + sw * 0.1, 2.35, ex, ey + 0.28], 0.07, '#27415d', 0.07);                           // the fishing rod
  bl(c, [-0.9, 0.2, -1.5, 0.9, -1.25, 1.1, -0.7, 0.9, -0.9, 1.5, -0.4, 1.1, -0.2, 0.9], '#27415d', 0.12);              // back fin
  ci(c, 0, 0, 1, '#35597a');
  c.save(); c.beginPath(); c.arc(0, 0, 0.94, 0, TAU); c.clip();
  el(c, 0.0, -0.95, 1.5, 0.75, 0, '#27415d', 0);
  el(c, 0.2, 1.0, 1.0, 0.45, 0.2, '#4a7499', 0);
  c.globalAlpha = 0.5 + pu * 0.3; ci(c, 0.9, 0.5, 0.7 + 0.2 * pu, 'rgba(255,230,110,0.28)', 0); c.globalAlpha = 1;
  [[-0.5, 0.4], [-0.2, 0.7], [-0.7, -0.1], [0.0, 0.3], [-0.35, -0.4], [-0.1, -0.1]].forEach(function (p) { ci(c, p[0], p[1], 0.05, '#27415d', 0); ci(c, p[0] - 0.01, p[1] + 0.015, 0.02, '#6f9bc0', 0); });
  c.restore();
  arc(c, 0.86, 1.6, 2.7, 0.1, '#6f9bc0');
  ln(c, [-0.6, 0.6, -0.8, 0.1], 0.06, '#27415d'); ln(c, [-0.4, 0.7, -0.62, 0.0], 0.06, '#27415d');                      // gills
  // the big jaw
  bl(c, [0.2, -0.3, 1.0, -0.2, 1.8, -0.3, 2.0, -0.7, 1.5, -1.2, 0.7, -1.2, 0.1, -0.9], '#2a0f1e');
  bl(c, [0.1, -0.7, 1.2, -0.62, 2.0, -0.62, 2.05, -0.1, 1.9, -0.9, 1.2, -1.3, 0.3, -1.25], '#35597a', 0.14);          // lower jaw sticks out
  ln(c, [0.5, -1.1, 1.3, -1.12, 1.9, -0.72], 0.06, '#27415d');
  var tl = [[0.3, 0.2], [0.5, 0.3], [0.7, 0.24], [0.92, 0.34], [1.12, 0.26], [1.34, 0.34], [1.56, 0.24], [1.78, 0.28]];
  for (k = 0; k < tl.length; k++) { var x = 0.35 + k * 0.2, h = 0.3 + (k % 3) * 0.1; po(c, [x - 0.07, -0.64 + (k > 5 ? 0.02 : 0), x + 0.03, -0.64 - h * 0.1 + h, x + 0.09, -0.64], '#f6f1de', 0.045); }       // lower fangs, up
  for (k = 0; k < 5; k++) { var x2 = 0.3 + k * 0.28, h2 = 0.26 + (k % 2) * 0.12; po(c, [x2 - 0.07, -0.28, x2 + 0.01, -0.28 - h2, x2 + 0.1, -0.3], '#f6f1de', 0.045); }
  ln(c, [0.2, -0.26, 1.0, -0.2, 1.8, -0.3], 0.1, OUT);
  // the eye
  ci(c, 0.6, 0.3, 0.22, '#f4ffa0', 0.1); el(c, 0.66, 0.3, 0.06, 0.16, 0, OUT, 0); ci(c, 0.62, 0.38, 0.035, '#ffffff', 0);
  ln(c, [0.3, 0.62, 0.62, 0.52, 0.88, 0.3], 0.12, '#27415d'); ln(c, [0.34, 0.6, 0.62, 0.5, 0.86, 0.3], 0.04, '#6f9bc0');   // angry brow
  // the lure
  glow(c, ex, ey, 0.5 + 0.2 * pu, 'rgb(255,226,110)', 0.4 + 0.5 * pu);
  bl(c, [ex - 0.18, ey + 0.35, ex + 0.1, ey + 0.42, ex + 0.25, ey + 0.22, ex, ey + 0.26], '#27415d', 0.07);
  ci(c, ex, ey, 0.2, '#fff6a8', 0.1); ci(c, ex - 0.04, ey + 0.04, 0.12, '#ffffff', 0); ci(c, ex - 0.07, ey + 0.07, 0.04, '#ffffff', 0);
};

HEAD.rex = function (c, t) {
  bl(c, [-1.0, 0.3, -1.05, -0.4, -0.7, -0.8, -0.3, -0.3], '#241a2c', 0.14);                                        // black hair at the back
  ci(c, 0, 0, 1, SKIN);
  ci(c, 0.34, -0.26, 0.2, 'rgba(255,110,110,0.4)', 0);
  bl(c, [-0.9, -0.6, 0.0, -0.78, 0.8, -0.72, 0.9, -1.35, 0.0, -1.5, -0.9, -1.3], '#c4281f');                      // tailcoat collar
  ln(c, [-0.76, -0.9, 0.0, -1.0, 0.76, -0.94], 0.08, '#e8b12e'); ln(c, [-0.7, -1.18, 0.0, -1.28, 0.7, -1.2], 0.05, '#e8b12e');
  ci(c, -0.3, -1.1, 0.06, '#ffe97a', 0.04); ci(c, 0.2, -1.12, 0.06, '#ffe97a', 0.04);
  ln(c, [-0.8, -0.66, -0.4, -0.7], 0.07, '#ff7a6a');
  ci(c, 1.0, 0.0, 0.14, '#dba27c', 0.1);                                                                          // nose
  eye(c, 0.62, 0.1, 0.12); ci(c, 0.65, 0.14, 0.035, '#ffffff', 0);
  ln(c, [0.4, 0.4, 0.66, 0.46, 0.9, 0.34], 0.1, '#241a2c');                                                         // raised brow
  c.beginPath(); c.moveTo(0.44, -0.5); c.quadraticCurveTo(0.8, -0.56, 1.04, -0.46); c.quadraticCurveTo(0.98, -1.0, 0.72, -1.0); c.quadraticCurveTo(0.46, -0.9, 0.44, -0.5); c.closePath(); c.fillStyle = '#6a1218'; c.fill();     // open grin
  c.save(); c.clip(); po(c, [0.4, -0.5, 1.1, -0.5, 1.1, -0.68, 0.4, -0.68], '#ffffff', 0); ln(c, [0.58, -0.5, 0.6, -0.68], 0.025, '#d6dbe6'); ln(c, [0.76, -0.5, 0.78, -0.68], 0.025, '#d6dbe6'); ln(c, [0.92, -0.5, 0.92, -0.66], 0.025, '#d6dbe6'); el(c, 0.74, -0.98, 0.2, 0.12, 0, '#ff7a8a', 0); c.restore();
  c.beginPath(); c.moveTo(0.44, -0.5); c.quadraticCurveTo(0.8, -0.56, 1.04, -0.46); c.quadraticCurveTo(0.98, -1.0, 0.72, -1.0); c.quadraticCurveTo(0.46, -0.9, 0.44, -0.5); c.closePath(); c.lineWidth = 0.08; c.strokeStyle = OUT; c.stroke();
  bl(c, [0.5, -0.2, 0.94, -0.14, 1.2, -0.24, 1.42, -0.04, 1.34, -0.36, 0.98, -0.42, 0.56, -0.38], '#241a2c', 0.1);     // waxed moustache, tips curled up
  ln(c, [0.66, -0.3, 1.0, -0.28], 0.04, '#7a6a88'); ln(c, [1.2, -0.12, 1.34, -0.2], 0.04, '#7a6a88');
  ci(c, 1.38, -0.04, 0.05, '#241a2c', 0.04);
  // the top hat
  el(c, 0.1, 0.78, 1.36, 0.26, -0.1, '#8f1a14');
  bl(c, [-0.66, 0.78, -0.58, 2.3, -0.5, 2.78, 0.5, 2.8, 0.62, 2.28, 0.66, 0.7], '#c4281f');
  el(c, 0.04, 2.8, 0.55, 0.14, 0, '#e24a3a', 0.1);
  ln(c, [-0.4, 0.98, -0.34, 2.6], 0.1, 'rgba(255,170,150,0.55)'); ln(c, [0.5, 1.0, 0.5, 2.5], 0.09, 'rgba(100,10,10,0.4)');
  bl(c, [-0.68, 0.84, 0.68, 0.78, 0.65, 1.22, -0.67, 1.28], '#e8b12e', 0.12);
  ln(c, [-0.55, 1.08, 0.55, 1.04], 0.04, '#fff3b0');
  po(c, [0.0, 0.92, 0.2, 1.04, 0.0, 1.16, -0.2, 1.04], '#fff3b0', 0.06); ci(c, 0.0, 1.04, 0.04, '#c4281f', 0);
  el(c, 0.1, 0.72, 1.36, 0.1, -0.1, '#8f1a14', 0);
  star(c, 0.0, 2.0, 0.12, '#ffe97a');
};

/* a gear: teeth round a body, drawn at (x, y) */
function gear(c, x, y, r, n, rot, fill, lw) {
  var k, p = [];
  for (k = 0; k < n * 2; k++) { var a = rot + k * Math.PI / n, rr = (k % 2 ? r * 0.76 : r); p.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  po(c, p, fill, lw == null ? 0.07 : lw);
  ci(c, x, y, r * 0.3, '#3a2a1c', 0.05);
}

HEAD.dancer = function (c, t) {
  var k, sw = Math.sin(t * 3.0), sw2 = Math.sin(t * 3.0 + 1.5), sw3 = Math.sin(t * 2.4 + 0.5);
  puff(c, [[-0.95, 0.5, 0.42], [-1.15, -0.05, 0.4], [-0.95, -0.6, 0.38], [-0.4, 1.0, 0.38], [-0.7, 0.9, 0.36]], '#f6f0dc');            // white mane
  [[-1.2, 0.5], [-1.4, -0.1], [-1.2, -0.7], [-0.45, 1.22], [-0.8, 1.15]].forEach(function (p, i) { po(c, [p[0] - 0.12, p[1] - 0.12, p[0] - 0.1, p[1] + 0.2, p[0] + 0.1, p[1] - 0.1], '#2fb89a', 0.06); });
  cv(c, [-0.1, 0.8, -0.3, 1.5, -0.8, 1.85], 0.22, '#e8b12e', 0.1);                                                                    // horns
  cv(c, [0.3, 0.86, 0.35, 1.6, 0.1, 2.15], 0.22, '#e8b12e', 0.1);
  ln(c, [-0.14, 0.9, -0.3, 1.5, -0.74, 1.8], 0.05, '#fff3b0'); ln(c, [0.27, 0.95, 0.32, 1.6, 0.1, 2.08], 0.05, '#fff3b0');
  ci(c, -0.82, 1.9, 0.14, '#ffffff', 0.08); ci(c, -0.86, 1.95, 0.05, '#dfe8ff', 0); ci(c, 0.08, 2.2, 0.15, '#ffffff', 0.08); ci(c, 0.04, 2.25, 0.05, '#dfe8ff', 0);   // pearls
  cv(c, [1.5, -0.12, 1.2 + sw * 0.1, -0.75, 0.55 + sw2 * 0.15, -1.2, -0.2 + sw * 0.15, -1.15 + sw2 * 0.1], 0.11, '#fff3b0', 0.09);       // whiskers sway
  cv(c, [1.6, 0.08, 1.7 + sw2 * 0.1, -0.7, 1.15 + sw * 0.18, -1.35 + sw3 * 0.1, 0.5 + sw3 * 0.2, -1.55], 0.1, '#fff3b0', 0.09);
  ci(c, 0, 0, 1, '#d6282a');
  c.save(); c.beginPath(); c.arc(0, 0, 0.94, 0, TAU); c.clip();
  el(c, 0.0, -1.0, 1.6, 0.8, 0, '#a81a1f', 0); el(c, -0.3, 0.9, 1.0, 0.4, 0.3, '#ee5040', 0);
  c.restore();
  arc(c, 0.86, 1.9, 2.8, 0.1, '#ff8a70');
  bl(c, [0.3, 0.5, 1.1, 0.6, 1.9, 0.5, 2.1, 0.15, 1.9, -0.18, 1.1, -0.15, 0.3, -0.3], '#d6282a');                                       // snout
  bl(c, [0.4, -0.2, 1.3, -0.18, 1.85, -0.2, 1.8, -0.7, 1.0, -0.95, 0.3, -0.8], '#b81e22');                                              // jaw
  [[0.8, -0.2], [1.1, -0.2], [1.4, -0.18]].forEach(function (p) { po(c, [p[0] - 0.08, p[1], p[0], p[1] - 0.2, p[0] + 0.08, p[1]], '#ffffff', 0.05); });
  ln(c, [0.6, -0.18, 1.3, -0.14, 1.9, -0.1], 0.08, OUT);
  ci(c, 1.72, 0.38, 0.19, '#a81a1f', 0.1); ci(c, 1.72, 0.36, 0.1, OUT, 0); ci(c, 1.5, 0.42, 0.08, '#a81a1f', 0.07);                           // flared nostrils
  ln(c, [1.15, 0.58, 1.6, 0.62], 0.06, '#e8b12e');
  bl(c, [1.0, -0.62, 1.6, -0.6, 1.5, -0.95, 0.9, -1.1], '#e8b12e', 0.08); ln(c, [1.05, -0.8, 1.45, -0.78], 0.04, '#fff3b0');
  cv(c, [-0.05, -0.1, 0.2, -0.45, 0.45, -0.1, 0.25, 0.05, 0.1, -0.15], 0.07, '#e8b12e', 0.05);                                       // cheek swirl
  ci(c, 0.6, 0.56, 0.34, '#fffbe6', 0.12); ci(c, 0.6, 0.56, 0.26, '#e8b12e', 0.05); ci(c, 0.66, 0.56, 0.17, OUT, 0); ci(c, 0.7, 0.62, 0.06, '#ffffff', 0);   // big round eye
  po(c, [0.2, 0.9, 0.4, 1.08, 0.5, 0.94, 0.7, 1.16, 0.82, 0.96, 1.04, 1.04, 0.98, 0.86, 0.9, 0.9], '#e8b12e', 0.07);                       // brow tuft
  ln(c, [0.3, 0.9, 0.9, 0.88], 0.14, '#e8b12e');
  ci(c, 0.8, 0.86, 0.1, '#ffffff', 0.07); ci(c, 0.78, 0.9, 0.035, '#dfe8ff', 0);                                                            // forehead pearl
};

HEAD.voltage = function (c, t) {
  var k, sd = Math.floor(t * 14), rr = function (i) { return RR.Render.hash(sd * 7.13 + i * 3.7); };
  ci(c, 0, 0, 1, SKIN);
  bl(c, [-0.05, 0.4, -0.5, 0.55, -0.9, 0.2, -0.95, -0.4, -0.4, -0.5], '#fff6e0', 0.12);
  po(c, [-0.9, 0.5, -1.3, 0.2, -1.2, -0.2, -0.9, -0.2], '#dfe4ee', 0);
  // wild hair
  var hp = [], a, n = 15;
  for (k = 0; k <= n; k++) { a = 0.6 + k * (3.3 - 0.6) / n; var tipp = k % 2; var R = tipp ? 1.6 + 0.5 * RR.Render.hash(k * 3.3) : 1.02; hp.push(Math.cos(a) * R, Math.sin(a) * R); }
  var hl = [[-0.95, -0.35], [-0.7, 0.2], [-0.25, 0.46], [0.2, 0.55], [0.6, 0.5]];
  hl.forEach(function (p) { hp.push(p[0], p[1]); });
  po(c, hp, '#f4f6fa');
  for (k = 1; k < n; k += 2) { a = 0.6 + k * (3.3 - 0.6) / n; ln(c, [Math.cos(a) * 1.0, Math.sin(a) * 1.0, Math.cos(a) * 1.5, Math.sin(a) * 1.5], 0.05, '#b8c4d8'); }
  ln(c, [0.5, 0.95, 0.2, 1.3], 0.06, '#ffffff');
  var tp = []; for (k = 1; k < n; k += 2) { a = 0.6 + k * (3.3 - 0.6) / n; var R2 = 1.6 + 0.5 * RR.Render.hash(k * 3.3); tp.push([Math.cos(a) * R2, Math.sin(a) * R2]); }
  // crackling arcs between spike tips
  var pairs = [[(sd) % 7, (sd + 2) % 7], [(sd * 3 + 1) % 7, (sd * 3 + 3) % 7]];
  pairs.forEach(function (pr, qi) {
    var A0 = tp[pr[0] % tp.length], B0 = tp[pr[1] % tp.length], pts = [A0[0], A0[1]], s;
    for (s = 1; s < 5; s++) { var f = s / 5; pts.push(A0[0] + (B0[0] - A0[0]) * f + (rr(s + qi * 9) - 0.5) * 0.4, A0[1] + (B0[1] - A0[1]) * f + (rr(s + 4 + qi * 9) - 0.5) * 0.4); }
    pts.push(B0[0], B0[1]);
    c.globalAlpha = 0.5 + 0.5 * rr(20 + qi); ln(c, pts, 0.24, "rgba(110,200,255,0.5)"); ln(c, pts, 0.11, "#bff0ff"); ln(c, pts, 0.05, "#ffffff"); c.globalAlpha = 1;
  });
  ln(c, [-0.6, 0.0, 0.5, 0.0], 0.1, '#3a3f4b');                                                                                           // goggle strap
  ln(c, [-1.0, 0.1, -0.8, 0.05], 0.12, '#3a3f4b');
  ci(c, 0.62, 0.06, 0.46, '#7a8494', 0.12); ci(c, 0.62, 0.06, 0.36, '#14213a', 0.06);                                                      // thick round goggles
  var fl = 0.7 + 0.3 * Math.sin(t * 17) * Math.sin(t * 7);
  c.save(); c.beginPath(); c.arc(0.62, 0.06, 0.34, 0, TAU); c.clip();
  c.fillStyle = 'rgba(110,200,255,' + (0.35 + 0.35 * fl).toFixed(2) + ')'; c.fillRect(0.2, -0.4, 0.9, 0.9);
  ln(c, [0.78, 0.34, 0.58, 0.1, 0.72, 0.1, 0.5, -0.26], 0.09, '#ffffff'); ln(c, [0.78, 0.34, 0.58, 0.1, 0.72, 0.1, 0.5, -0.26], 0.04, '#ffe97a');
  c.restore();
  ci(c, 0.66, 0.1, 0.12, OUT, 0); ci(c, 0.7, 0.14, 0.035, '#ffffff', 0);
  c.beginPath(); c.arc(0.62, 0.06, 0.36, 2.0, 2.8); c.lineWidth = 0.06; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
  ci(c, 0.4, 0.38, 0.05, '#c9d0dc', 0.03); ci(c, 0.92, 0.3, 0.05, '#c9d0dc', 0.03); ci(c, 0.4, -0.26, 0.05, '#c9d0dc', 0.03); ci(c, 0.92, -0.18, 0.05, '#c9d0dc', 0.03);
  ci(c, 1.04, -0.28, 0.12, '#dba27c', 0.1);                                                                                               // nose
  bl(c, [0.38, -0.6, 0.72, -0.62, 1.0, -0.5, 1.02, -0.78, 0.7, -0.84, 0.44, -0.8], '#ffffff', 0.09);                                       // crooked grin
  ln(c, [0.38, -0.62, 1.04, -0.44], 0.07, OUT);
  ln(c, [0.52, -0.64, 0.54, -0.8], 0.03, '#c0c6d2'); ln(c, [0.7, -0.62, 0.72, -0.82], 0.03, '#c0c6d2'); ln(c, [0.88, -0.58, 0.9, -0.76], 0.03, '#c0c6d2');
  ln(c, [0.4, 0.54, 0.7, 0.62, 1.0, 0.5], 0.13, '#f4f6fa'); ln(c, [0.4, 0.54, 0.7, 0.62, 1.0, 0.5], 0.04, '#b8c4d8');                         // bushy brow
};

HEAD.baron = function (c, t) {
  var k;
  ci(c, 0, 0, 1, SKIN);
  ci(c, 0.3, -0.2, 0.2, 'rgba(255,110,110,0.3)', 0);
  // magnificent side whiskers and moustache
  bl(c, [-0.35, 0.3, 0.12, 0.05, 0.18, -0.5, 0.3, -1.0, -0.2, -1.32, -0.75, -1.1, -0.9, -0.3], '#8a4a1c', 0.14);
  for (k = 0; k < 5; k++) ln(c, [-0.5 + k * 0.14, 0.0 - k * 0.04, -0.46 + k * 0.17, -0.9 - k * 0.07], 0.05, '#c8742a');
  ln(c, [-0.2, 0.1, 0.04, -0.2], 0.05, '#d98a3a');
  bl(c, [0.55, -0.3, 0.95, -0.26, 1.3, -0.34, 1.52, -0.2, 1.62, 0.05, 1.5, 0.14, 1.42, 0.0, 1.36, -0.5, 0.95, -0.54, 0.55, -0.52], '#8a4a1c', 0.11);
  ln(c, [0.66, -0.36, 1.0, -0.36, 1.3, -0.42], 0.04, '#d98a3a'); ci(c, 1.52, 0.04, 0.06, '#8a4a1c', 0.05);
  ln(c, [0.7, -0.72, 0.9, -0.76, 1.04, -0.68], 0.06, OUT);
  ci(c, 1.0, 0.0, 0.14, '#dba27c', 0.1);
  // brass goggles
  ln(c, [-0.9, 0.5, -0.4, 0.45, 0.2, 0.3], 0.12, '#3a2a1c');
  ci(c, 0.58, 0.22, 0.42, '#c88a2a', 0.11); ci(c, 0.58, 0.22, 0.31, '#27384f', 0.06);
  ci(c, 0.6, 0.18, 0.19, '#ffffff', 0); ci(c, 0.64, 0.18, 0.09, OUT, 0); ci(c, 0.67, 0.21, 0.03, '#ffffff', 0);
  c.beginPath(); c.arc(0.58, 0.22, 0.26, 2.0, 2.9); c.lineWidth = 0.06; c.strokeStyle = 'rgba(160,230,255,0.9)'; c.stroke();
  for (k = 0; k < 6; k++) { var q = k * TAU / 6 + 0.3; ci(c, 0.58 + Math.cos(q) * 0.37, 0.22 + Math.sin(q) * 0.37, 0.03, '#ffe3a1', 0.02); }
  ln(c, [0.3, 0.4, 0.58, 0.56], 0.04, '#ffe3a1');
  ln(c, [0.38, 0.72, 0.7, 0.8, 1.0, 0.64], 0.11, '#9a4a10');                                                                              // brow
  // the brass top hat
  el(c, 0.0, 0.74, 1.35, 0.24, -0.08, '#8d5a15');
  bl(c, [-0.62, 0.72, -0.56, 2.0, -0.46, 2.2, 0.46, 2.26, 0.56, 2.0, 0.64, 0.66], '#c88a2a');
  ln(c, [-0.42, 0.9, -0.36, 2.1], 0.1, '#ffe3a1'); ln(c, [0.5, 0.9, 0.48, 2.0], 0.08, '#8d5a15');
  el(c, 0.0, 2.24, 0.5, 0.13, 0, '#e0a640', 0.09);
  bl(c, [-0.64, 0.8, 0.66, 0.74, 0.64, 1.14, -0.62, 1.2], '#4a3022', 0.1); ln(c, [-0.5, 1.0, 0.5, 0.96], 0.03, '#7a5238');
  gear(c, -0.28, 1.62, 0.26, 8, t * 0.6, '#e0a640', 0.07);
  gear(c, 0.12, 1.84, 0.17, 6, -t * 0.9 + 0.3, '#ffe3a1', 0.06);
  ci(c, 0.28, 1.4, 0.22, '#f1ecdc', 0.08); ci(c, 0.28, 1.4, 0.15, '#fff', 0); ln(c, [0.28, 1.4, 0.28 + Math.cos(1.0 + Math.sin(t * 3) * 0.5) * 0.12, 1.4 + Math.sin(1.0 + Math.sin(t * 3) * 0.5) * 0.12], 0.04, '#c4281f');
  ci(c, 0.28, 1.4, 0.03, OUT, 0); c.beginPath(); c.arc(0.28, 1.4, 0.22, 0, TAU); c.lineWidth = 0.05; c.strokeStyle = '#8d5a15'; c.stroke();
  bl(c, [0.38, 2.2, 0.42, 2.55, 0.54, 2.55, 0.58, 2.2], '#8d5a15', 0.09);                                                                // steam pipe
  for (k = 0; k < 4; k++) { var f = (t * 0.7 + k * 0.25) % 1; c.globalAlpha = 0.9 * (1 - f); ci(c, 0.5 + f * 0.9 + Math.sin(f * 6 + k) * 0.08, 2.65 + f * 1.1, 0.13 + 0.3 * f, '#f6f8fc', 0.09); } c.globalAlpha = 1;
};

/* ---------------------------- epic ---------------------------- */
/* a flame plume rooted at (x, y), pointing along ang, with a wobbling tip. Three layers: red, orange, yellow. */
function plume(c, x, y, ang, len, wid, t, ph, cols, outline) {
  var i;
  c.save(); c.translate(x, y); c.rotate(ang);
  for (i = 0; i < cols.length; i++) {
    var s = 1 - i * 0.24, L = len * s, W = wid * s, wob = Math.sin(t * (9 + i * 2) + ph + i) * 0.24 * L, wob2 = Math.sin(t * (6 + i) + ph * 2) * 0.14 * L;
    c.beginPath(); c.moveTo(0, -W);
    c.bezierCurveTo(L * 0.3, -W * 1.2 + wob2, L * 0.62, -W * 0.6 + wob, L + wob2 * 0.5, wob * 0.8);
    c.bezierCurveTo(L * 0.66, W * 0.5 + wob, L * 0.3, W * 1.2 - wob2, 0, W);
    c.closePath(); c.fillStyle = cols[i]; c.fill();
    if (!i && outline !== 0) { c.lineWidth = outline || 0.12; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke(); }
  }
  c.restore();
}

HEAD.phoenix = function (c, t) {
  var k, F = ['#e8321a', '#ff8a1f', '#ffe45a'];
  glow(c, 0, 0.3, 1.9, 'rgb(255,140,40)', 0.5 + 0.1 * Math.sin(t * 9));
  plume(c, -0.3, 0.85, 2.2 + Math.sin(t * 5) * 0.08, 2.0, 0.3, t, 0.0, F);                                                                // crest of flame
  plume(c, 0.1, 0.9, 1.9 + Math.sin(t * 4 + 1) * 0.08, 1.6, 0.26, t, 1.5, F);
  plume(c, -0.7, 0.62, 2.7 + Math.sin(t * 5 + 2) * 0.08, 1.8, 0.26, t, 3.0, F);
  plume(c, -0.8, -0.1, 3.1 + Math.sin(t * 5 + 3) * 0.1, 1.7, 0.28, t, 4.5, F);                                                           // cheek plumes streaming back
  plume(c, -0.65, -0.5, 3.6 + Math.sin(t * 4 + 4) * 0.1, 1.4, 0.24, t, 6.0, F);
  ci(c, 0, 0, 1, '#e8421a');
  c.save(); c.beginPath(); c.arc(0, 0, 0.94, 0, TAU); c.clip();
  el(c, 0.1, -0.95, 1.6, 0.75, 0, '#b82212', 0); el(c, -0.4, 0.8, 1.0, 0.5, 0.3, '#ff7a3a', 0);
  for (k = 0; k < 7; k++) { var fx = -0.7 + (k % 4) * 0.42, fy = -0.45 + Math.floor(k / 4) * 0.5 + (k % 2) * 0.12; c.beginPath(); c.arc(fx, fy, 0.2, 0.2, Math.PI - 0.2); c.lineWidth = 0.05; c.strokeStyle = '#ff9a4a'; c.stroke(); }
  c.restore();
  arc(c, 0.86, 1.5, 2.6, 0.1, '#ffb066');
  po(c, [0.78, -0.06, 1.7, -0.36, 1.1, -0.64], '#e0961a');                                                                                // lower beak
  po(c, [0.76, 0.42, 1.55, 0.2, 2.1, -0.2, 1.7, 0.0, 0.8, -0.08], '#ffd23f');                                                             // hooked upper beak
  ln(c, [1.0, 0.3, 1.7, 0.1], 0.06, '#fff3b0'); ci(c, 1.28, 0.1, 0.045, '#b87a10', 0);
  ln(c, [0.8, -0.04, 1.8, -0.16], 0.07, OUT);
  ci(c, 0.56, 0.38, 0.26, '#ffe45a', 0.1); ci(c, 0.62, 0.38, 0.14, OUT, 0); ci(c, 0.66, 0.43, 0.05, '#ffffff', 0);
  po(c, [0.22, 0.72, 0.6, 0.58, 1.0, 0.36, 0.86, 0.66, 0.5, 0.9], '#b82212', 0.1);                                                           // fierce brow
  for (k = 0; k < 6; k++) { var f = (t * 0.8 + k * 0.17) % 1, sx = -0.8 + k * 0.45 + Math.sin(f * 7 + k * 2) * 0.2; c.globalAlpha = 1 - f; ci(c, sx, 1.0 + f * 2.6, 0.05 + 0.03 * ((k * 5) % 3), k % 2 ? '#ffe45a' : '#ff8a1f', 0); } c.globalAlpha = 1;
};
function tentacle(c, x, y, ang, len, curl, w0, t, ph, col, sk) {
  var N = 10, k, L = [], R = [], px = x, py = y, ds = len / N, S = [], a;
  for (k = 0; k <= N; k++) {
    var s = k / N, w = w0 * (1 - s * 0.9) + 0.02;
    a = ang + curl * Math.pow(s, 1.7) + Math.sin(t * 1.4 + ph + s * 3) * 0.45 * s;
    var nx = -Math.sin(a), ny = Math.cos(a);
    L.push(px + nx * w, py + ny * w); R.unshift(px - nx * w, py - ny * w);
    if (k % 2 && k < N) { var sg = curl > 0 ? 1 : -1; S.push([px + sg * nx * w * 0.3, py + sg * ny * w * 0.3, w * 0.34]); }
    px += Math.cos(a) * ds; py += Math.sin(a) * ds;
  }
  po(c, L.concat(R), col, 0.14);
  ln(c, L.slice(0, 8), 0.05, 'rgba(255,255,255,0.28)');
  for (k = 0; k < S.length; k++) ci(c, S[k][0], S[k][1], Math.max(0.035, S[k][2]), sk, 0.04);
}

HEAD.kraken = function (c, t) {
  var k, P = '#7a4fb0', T = '#aef0de';
  glow(c, 0.5, 0.3, 1.5, 'rgb(190,255,70)', 0.3 + 0.08 * Math.sin(t * 3));
  tentacle(c, -0.45, 0.8, 2.0, 1.7, 3.2, 0.26, t, 0.0, P, T);                                                                          // writhing crest, streaming back
  tentacle(c, -0.8, 0.4, 2.8, 1.8, -3.0, 0.28, t, 1.7, P, T);
  tentacle(c, -0.95, -0.15, 3.5, 1.8, 3.4, 0.28, t, 3.1, P, T);
  tentacle(c, -0.05, 0.95, 1.5, 1.4, -3.2, 0.22, t, 4.4, P, T);
  tentacle(c, -0.7, -0.65, 4.0, 1.7, -3.0, 0.26, t, 5.6, P, T);
  ci(c, 0, 0, 1, '#6a3fa0');
  c.save(); c.beginPath(); c.arc(0, 0, 0.94, 0, TAU); c.clip();
  el(c, 0.2, -1.0, 1.7, 0.8, 0, '#4a2a7a', 0); el(c, -0.3, 0.85, 1.0, 0.45, 0.3, '#8a5fc8', 0);
  [[-0.2, 0.62], [-0.55, 0.3], [0.1, 0.1], [-0.35, -0.2], [0.35, -0.4], [-0.1, -0.55]].forEach(function (p) { ci(c, p[0], p[1], 0.075, '#2fd0b0', 0); ci(c, p[0] - 0.015, p[1] + 0.02, 0.028, '#c9fff0', 0); });
  c.restore();
  arc(c, 0.86, 1.6, 2.7, 0.1, '#b394e8');
  tentacle(c, 0.3, -0.85, -1.9, 1.7, 3.0, 0.26, t, 7.0, P, T);                                                                         // beard of tentacles
  tentacle(c, 0.7, -0.7, -1.2, 1.5, -2.8, 0.24, t, 8.4, P, T);
  tentacle(c, -0.1, -0.92, -2.5, 1.6, -3.2, 0.24, t, 9.6, P, T);
  [[-0.75, 0.5, 0.14], [-0.5, 0.82, 0.1], [0.1, 0.99, 0.12], [-0.95, 0.15, 0.09]].forEach(function (b) {                                  // barnacles
    po(c, [b[0] - b[2], b[1] - b[2], b[0] - b[2] * 0.4, b[1] + b[2] * 1.3, b[0] + b[2] * 0.4, b[1] + b[2] * 1.3, b[0] + b[2], b[1] - b[2]], '#dcd8c8', 0.05); ln(c, [b[0], b[1] - b[2] * 0.6, b[0], b[1] + b[2]], 0.025, '#9a9684');
  });
  var pu = 0.75 + 0.25 * Math.sin(t * 2.6);
  glow(c, 0.38, 0.36, 0.7, 'rgb(220,255,60)', 0.6 * pu); glow(c, 0.88, 0.26, 0.5, 'rgb(220,255,60)', 0.5 * pu);
  ci(c, 0.86, 0.26, 0.2, '#e8ff5a', 0.09); el(c, 0.9, 0.26, 0.05, 0.14, 0, OUT, 0);
  ci(c, 0.36, 0.36, 0.28, '#e8ff5a', 0.1); el(c, 0.42, 0.36, 0.07, 0.2, 0, OUT, 0); ci(c, 0.3, 0.46, 0.06, '#ffffff', 0);
  ln(c, [0.04, 0.7, 0.36, 0.7, 0.66, 0.5], 0.1, '#4a2a7a');
  ln(c, [0.5, -0.38, 0.8, -0.42, 1.0, -0.3], 0.07, OUT);
};

HEAD.medusa = function (c, t) {
  var k, SN = [['#3f8a4a', '#8fd08a'], ['#5aa85a', '#b8e8a0'], ['#2f6a3a', '#7ab870']];
  var sn = [[-0.3, 0.9, 1.7, 1.35], [-0.6, 0.65, 2.1, 1.7], [-0.8, 0.3, 2.6, 1.6], [-0.9, -0.1, 3.1, 1.5], [-0.75, -0.5, 3.6, 1.4], [0.0, 0.98, 1.4, 1.2], [0.3, 0.9, 1.0, 1.0]];
  sn.forEach(function (s, i) {
    var pts = [], N = 6, j, a = s[2], x = s[0], y = s[1], ds = s[3] / N, ph = i * 1.9;
    for (j = 0; j <= N; j++) { pts.push(x, y); a += Math.sin(t * 2.2 + ph + j * 1.1) * 0.55 + (i < 5 ? 0.14 : -0.12); x += Math.cos(a) * ds; y += Math.sin(a) * ds; }
    cv(c, pts, 0.24, SN[i % 3][0], 0.1);
    var hx = pts[pts.length - 2], hy = pts[pts.length - 1], ca = Math.cos(a), sa = Math.sin(a);
    for (j = 1; j < N; j++) ci(c, pts[j * 2], pts[j * 2 + 1], 0.05, SN[i % 3][1], 0);
    var tg = Math.max(0, Math.sin(t * 5 + ph));
    if (tg > 0.15) { var tx = hx + ca * (0.2 + 0.32 * tg), ty = hy + sa * (0.2 + 0.32 * tg); ln(c, [hx + ca * 0.12, hy + sa * 0.12, tx, ty], 0.045, '#e8322a'); ln(c, [tx, ty, tx + Math.cos(a + 0.7) * 0.12, ty + Math.sin(a + 0.7) * 0.12], 0.04, '#e8322a'); ln(c, [tx, ty, tx + Math.cos(a - 0.7) * 0.12, ty + Math.sin(a - 0.7) * 0.12], 0.04, '#e8322a'); }
    el(c, hx + ca * 0.05, hy + sa * 0.05, 0.24, 0.17, a, SN[i % 3][0], 0.09);
    ci(c, hx + ca * 0.06 - sa * 0.07, hy + sa * 0.06 + ca * 0.07, 0.06, '#ffd23f', 0); ci(c, hx + ca * 0.08 - sa * 0.07, hy + sa * 0.08 + ca * 0.07, 0.025, OUT, 0);
  });
  ci(c, 0, 0, 1, '#86a88a');
  c.save(); c.beginPath(); c.arc(0, 0, 0.94, 0, TAU); c.clip();
  el(c, 0.2, -1.0, 1.7, 0.8, 0, '#587a62', 0); el(c, -0.4, 0.8, 1.0, 0.45, 0.3, '#a8c8a4', 0);
  ln(c, [-0.5, 0.5, -0.3, 0.2, -0.45, -0.1], 0.045, '#4a6a52'); ln(c, [-0.2, -0.4, 0.0, -0.7], 0.045, '#4a6a52'); ln(c, [-0.7, -0.3, -0.5, -0.6], 0.045, '#4a6a52'); ln(c, [0.0, 0.5, 0.2, 0.3], 0.04, '#4a6a52');
  [[-0.1, 0.0], [-0.6, 0.1], [0.1, -0.6], [-0.3, 0.55]].forEach(function (p) { ci(c, p[0], p[1], 0.05, '#7a9a80', 0); });
  c.restore();
  arc(c, 0.86, 1.6, 2.7, 0.09, '#d4f0d0');
  ci(c, 0.98, -0.05, 0.13, '#76a07c', 0.1);
  ci(c, 0.38, -0.18, 0.16, 'rgba(255,120,110,0.16)', 0);
  var gl = 0.7 + 0.3 * Math.sin(t * 3);
  glow(c, 0.64, 0.12, 0.7, 'rgb(255,214,70)', 0.75 * gl);
  el(c, 0.62, 0.12, 0.2, 0.13, -0.08, '#ffe45a', 0.08); el(c, 0.66, 0.12, 0.04, 0.12, 0, OUT, 0); ci(c, 0.58, 0.17, 0.03, '#ffffff', 0);
  ln(c, [0.3, 0.38, 0.62, 0.36, 0.92, 0.2], 0.1, '#2f5a3a');
  ln(c, [0.52, -0.48, 0.82, -0.52, 0.96, -0.44], 0.08, OUT);
  po(c, [0.62, -0.5, 0.67, -0.68, 0.72, -0.5], '#ffffff', 0.03); po(c, [0.82, -0.52, 0.86, -0.68, 0.9, -0.5], '#ffffff', 0.03);
  bl(c, [-0.5, 0.74, 0.0, 0.8, 0.6, 0.66, 1.0, 0.44, 0.9, 0.68, 0.5, 0.92, 0.0, 1.0, -0.5, 0.94], '#e8b12e', 0.1);                           // gold circlet
  ln(c, [-0.4, 0.9, 0.2, 0.9, 0.7, 0.72], 0.04, '#fff3b0');
  po(c, [0.34, 0.8, 0.46, 0.96, 0.34, 1.12, 0.22, 0.96], '#2fd07a', 0.07); ln(c, [0.3, 0.9, 0.34, 1.02], 0.03, '#c9ffe0');
};

HEAD.snowqueen = function (c, t) {
  var k, vw = Math.sin(t * 2.4) * 0.12, vw2 = Math.sin(t * 2.4 + 1.2) * 0.16, pu = 0.5 + 0.5 * Math.sin(t * 2.2);
  glow(c, -0.1, 1.3, 1.8, 'rgb(150,225,255)', 0.32 + 0.14 * pu);
  bl(c, [-0.4, 0.9, -0.9, 0.9, -1.15, 0.5, -0.9, 0.0, -0.5, 0.0], '#eef6ff', 0.14);                                                          // silver hair at the back
  ln(c, [-0.8, 0.8, -0.9, 0.3], 0.04, '#b8dcf5'); ln(c, [-0.6, 0.7, -0.65, 0.2], 0.04, '#b8dcf5');
  bl(c, [-0.55, 1.0, -1.05, 0.7, -1.2 + vw * 0.5, -0.2, -1.45 + vw, -1.1, -1.0 + vw2 * 0.6, -1.5, -0.6, -1.2 + vw * 0.5, -0.3, -0.5, -0.3, 0.3], 'rgba(205,240,255,0.72)', 0.09);   // frost veil hanging behind
  ln(c, [-0.8, 0.8, -0.95, -0.2, -1.1 + vw, -1.15], 0.03, 'rgba(255,255,255,0.95)'); ln(c, [-0.6, 0.5, -0.65, -0.3, -0.75 + vw * 0.6, -1.15], 0.03, 'rgba(255,255,255,0.8)');
  for (k = 0; k < 4; k++) ci(c, -1.38 + k * 0.28 + vw * (0.9 - k * 0.2), -1.3 - (k % 2) * 0.1 + vw2 * 0.1, 0.06, '#ffffff', 0.03);
  star(c, -0.9 + vw * 0.4, -0.4, 0.1 + 0.05 * pu, '#ffffff');
  ci(c, 0, 0, 1, '#bfe0f4');
  c.save(); c.beginPath(); c.arc(0, 0, 0.94, 0, TAU); c.clip(); el(c, 0.2, -1.0, 1.7, 0.8, 0, '#8fc0e0', 0); el(c, -0.4, 0.8, 1.0, 0.4, 0.3, '#e4f6ff', 0); c.restore();
  arc(c, 0.86, 1.6, 2.7, 0.09, '#ffffff');
  bl(c, [-0.2, 0.7, 0.4, 0.78, 1.0, 0.5, 0.96, 0.3, 0.4, 0.5, -0.1, 0.3], '#f4faff', 0.1);                                                      // white fringe
  ci(c, 1.0, -0.06, 0.12, '#a8d0ea', 0.1);
  ci(c, 0.36, -0.22, 0.17, 'rgba(255,140,170,0.32)', 0);
  el(c, 0.6, 0.08, 0.22, 0.17, -0.1, '#ffffff', 0.07); ci(c, 0.65, 0.08, 0.12, '#2f8ad8', 0); ci(c, 0.65, 0.08, 0.06, OUT, 0); ci(c, 0.69, 0.13, 0.035, '#ffffff', 0);
  ln(c, [0.36, 0.24, 0.62, 0.3, 0.86, 0.2], 0.08, '#3a6a8a'); ln(c, [0.82, 0.22, 0.94, 0.14], 0.045, OUT);                                     // lashes
  ln(c, [0.58, -0.5, 0.8, -0.52, 0.94, -0.46], 0.07, 'rgba(90,152,216,0.8)');
  // ice crown
  bl(c, [-0.6, 0.66, 0.1, 0.78, 0.76, 0.6, 0.96, 0.72, 0.76, 0.94, 0.1, 1.06, -0.6, 0.94], '#e8f6ff', 0.11);
  ln(c, [-0.5, 0.74, 0.1, 0.84, 0.7, 0.7], 0.04, '#ffffff');
  var sp = [[-0.55, 0.92, -0.7, 2.0, 0.2], [-0.25, 0.98, -0.28, 2.7, 0.23], [0.12, 1.02, 0.2, 2.35, 0.21], [0.45, 0.96, 0.7, 1.85, 0.19], [-0.85, 0.82, -1.2, 1.5, 0.14]];
  sp.forEach(function (s) {
    var w = s[4];
    po(c, [s[0] - w, s[1], s[2], s[3], s[0] + w, s[1]], '#a8dcff', 0);
    po(c, [s[0] + w * 0.1, s[1], s[2], s[3], s[0] + w, s[1]], '#5ab0e8', 0);
    po(c, [s[0] - w, s[1], s[2], s[3], s[0] - w * 0.25, s[1]], '#f4fcff', 0);
    po(c, [s[0] - w, s[1], s[2], s[3], s[0] + w, s[1]], null, 0.1);
    ln(c, [s[0] - w * 0.2, s[1] + 0.15, s[2] - 0.01, s[3] - 0.35], 0.03, '#ffffff');
  });
  po(c, [0.0, 0.76, 0.12, 0.9, 0.0, 1.04, -0.12, 0.9], '#2f8ad8', 0.06); ln(c, [-0.04, 0.88, 0.0, 0.98], 0.03, '#c0e8ff');
  var sh = 0.5 + 0.5 * Math.sin(t * 3); c.globalAlpha = 0.4 + 0.6 * sh; star(c, -0.28, 2.75, 0.2, '#ffffff'); c.globalAlpha = 1;
  c.globalAlpha = 0.4 + 0.6 * (1 - sh); star(c, 0.7, 1.95, 0.13, '#ffffff'); c.globalAlpha = 1;
  for (k = 0; k < 7; k++) {                                                                                                                    // drifting snow and glitter
    var f = (t * 0.35 + k * 0.15) % 1, px = 1.0 - f * 3.4 + Math.sin(f * 6 + k) * 0.2, py = 1.9 - f * 2.8 + (k % 3) * 0.3;
    c.globalAlpha = Math.sin(f * Math.PI) * (0.55 + 0.45 * Math.sin(t * 6 + k * 2));
    if (k % 2) star(c, px, py, 0.13, '#ffffff'); else { var a2; for (a2 = 0; a2 < 3; a2++) { var q = a2 * Math.PI / 3 + t; ln(c, [px - Math.cos(q) * 0.12, py - Math.sin(q) * 0.12, px + Math.cos(q) * 0.12, py + Math.sin(q) * 0.12], 0.04, '#ffffff'); } }
  } c.globalAlpha = 1;
};

/* ---------------------------- legendary ---------------------------- */
HEAD.void = function (c, t) {
  var k, tilt = -0.32, rx = 2.15, ry = 0.62, ph = t * 1.1;
  function ring(a0, a1, w, col) { c.save(); c.rotate(tilt); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, a0, a1); c.restore(); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
  function onRing(a) { var x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [x * Math.cos(tilt) - y * Math.sin(tilt), x * Math.sin(tilt) + y * Math.cos(tilt)]; }
  var gr = c.createLinearGradient(-2.3, 0, 2.3, 0);
  gr.addColorStop(0, '#5ab0ff'); gr.addColorStop(0.3, '#ffffff'); gr.addColorStop(0.55, '#ffd27a'); gr.addColorStop(0.85, '#ff7a1f'); gr.addColorStop(1, '#c4281f');
  glow(c, 0, 0, 3.0, 'rgb(255,140,50)', 0.28 + 0.06 * Math.sin(t * 2));
  for (k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, 1.55 + k * 0.4, ph * 0.5 + k * 2.1, ph * 0.5 + k * 2.1 + 1.0); c.lineWidth = 0.035; c.strokeStyle = 'rgba(190,225,255,' + (0.7 - k * 0.18).toFixed(2) + ')'; c.stroke(); }     // bent starlight
  ring(Math.PI, TAU, 0.5, 'rgba(255,170,70,0.35)'); ring(Math.PI, TAU, 0.3, gr); ring(Math.PI, TAU, 0.1, 'rgba(255,255,255,0.8)');     // back of the ring, seen over the top
  c.beginPath(); c.arc(0, 0, 1.0, 0, TAU); c.fillStyle = '#020204'; c.fill();                                                          // the dark
  c.beginPath(); c.arc(0, 0, 1.17, 0.35, 2.8); c.lineWidth = 0.3; c.strokeStyle = 'rgba(255,170,70,0.4)'; c.stroke();                // light bent over the top
  c.beginPath(); c.arc(0, 0, 1.17, 0.35, 2.8); c.lineWidth = 0.09; c.strokeStyle = '#ffe2a8'; c.stroke();
  c.beginPath(); c.arc(0, 0, 1.15, 3.6, 5.8); c.lineWidth = 0.1; c.strokeStyle = 'rgba(255,170,70,0.55)'; c.stroke();
  c.beginPath(); c.arc(0, 0, 1.0, 0, TAU); c.lineWidth = 0.07; c.strokeStyle = '#fff1d0'; c.stroke();                                // event horizon rim
  ring(0, Math.PI, 0.5, 'rgba(255,170,70,0.35)'); ring(0, Math.PI, 0.3, gr); ring(0, Math.PI, 0.1, 'rgba(255,255,255,0.85)');       // front of the ring, across the dark
  for (k = 0; k < 5; k++) {                                                                                                            // hot spots going round
    var a = ph + k * TAU / 5, p = onRing(a), front = Math.sin(a) > 0, bright = 0.5 + 0.5 * Math.cos(a - 0.5);
    c.globalAlpha = 0.35 + 0.65 * bright; ci(c, p[0], p[1], front ? 0.11 : 0.08, '#ffffff', 0);
    var p2 = onRing(a - 0.28); ln(c, [p2[0], p2[1], p[0], p[1]], front ? 0.09 : 0.06, 'rgba(255,230,180,0.8)');
  } c.globalAlpha = 1;
  for (k = 0; k < 8; k++) {                                                                                                            // stars falling in
    var f = (t * 0.28 + k * 0.125) % 1, sa = k * 2.3 + f * 2.6, sr = 2.7 - f * 1.75, sx = Math.cos(sa) * sr, sy = Math.sin(sa) * sr * 0.8;
    c.globalAlpha = Math.min(1, f * 4) * (1 - f * 0.4); var ex = Math.cos(sa - 0.25) * (sr + 0.2), ey = Math.sin(sa - 0.25) * (sr + 0.2) * 0.8;
    ln(c, [ex, ey, sx, sy], 0.03, 'rgba(180,215,255,0.7)'); ci(c, sx, sy, 0.055 * (1.2 - f * 0.7), k % 3 ? '#ffffff' : '#9fe8ff', 0);
  } c.globalAlpha = 1;
};

/* ---------------------------- trophy ---------------------------- */
HEAD.helios = function (c, t) {
  var k, n = 12, rot = t * 0.35, pu = 0.5 + 0.5 * Math.sin(t * 2.4);
  glow(c, 0, 0, 3.8, 'rgb(255,150,30)', 0.55 + 0.15 * pu);
  glow(c, 0, 0, 2.1, 'rgb(255,235,130)', 0.6);
  for (k = 0; k < n; k++) {                                                                                       // long flaring rays, turning slowly
    var a = rot + k * TAU / n, long = k % 2 === 0, L = (long ? 2.9 : 2.0) * (1 + 0.07 * Math.sin(t * 3 + k * 1.7)), hw = long ? 0.3 : 0.26, sw = 0.2;
    var cs = Math.cos, sn = Math.sin;
    var b1x = cs(a - hw) * 0.85, b1y = sn(a - hw) * 0.85, b2x = cs(a + hw) * 0.85, b2y = sn(a + hw) * 0.85, tx = cs(a + sw) * L, ty = sn(a + sw) * L;
    var m1x = cs(a - hw * 0.9 + sw * 0.4) * L * 0.5, m1y = sn(a - hw * 0.9 + sw * 0.4) * L * 0.5, m2x = cs(a + hw * 0.9 + sw * 0.1) * L * 0.5, m2y = sn(a + hw * 0.9 + sw * 0.1) * L * 0.5;
    c.beginPath(); c.moveTo(b1x, b1y); c.quadraticCurveTo(m1x, m1y, tx, ty); c.quadraticCurveTo(m2x, m2y, b2x, b2y); c.closePath();
    c.fillStyle = long ? '#ff8a1f' : '#ffb02a'; c.fill(); c.lineWidth = 0.09; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke();
    c.beginPath(); c.moveTo(cs(a - hw * 0.5) * 0.9, sn(a - hw * 0.5) * 0.9); c.quadraticCurveTo(cs(a - hw * 0.4 + sw * 0.3) * L * 0.42, sn(a - hw * 0.4 + sw * 0.3) * L * 0.42, cs(a + sw * 0.8) * L * 0.72, sn(a + sw * 0.8) * L * 0.72); c.quadraticCurveTo(cs(a + hw * 0.4 + sw * 0.1) * L * 0.42, sn(a + hw * 0.4 + sw * 0.1) * L * 0.42, cs(a + hw * 0.5) * 0.9, sn(a + hw * 0.5) * 0.9); c.closePath(); c.fillStyle = '#ffe45a'; c.fill();
  }
  for (k = 0; k < 10; k++) {                                                                                       // the ring of flame, turning the other way
    var a2 = -t * 0.7 + k * TAU / 10 + 0.3;
    plume(c, Math.cos(a2) * 1.15, Math.sin(a2) * 1.15, a2 + 1.0, 0.95, 0.18, t, k * 1.3, ['#e8321a', '#ff8a1f', '#fff08a'], 0.08);
  }
  c.beginPath(); c.arc(0, 0, 1.17, 0, TAU); c.lineWidth = 0.2; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.arc(0, 0, 1.17, 0, TAU); c.lineWidth = 0.09; c.strokeStyle = '#ffd23f'; c.stroke();
  var g = c.createRadialGradient(0.35, 0.35, 0.05, 0, 0, 1.05); g.addColorStop(0, '#fff2a8'); g.addColorStop(0.55, '#ffd23f'); g.addColorStop(1, '#d9961a');
  ci(c, 0, 0, 1, g);                                                                                              // the golden mask
  arc(c, 0.84, 1.5, 2.8, 0.1, 'rgba(255,255,230,0.85)'); arc(c, 0.86, 4.2, 5.4, 0.1, 'rgba(160,90,10,0.35)');
  ci(c, 0.12, 0.7, 0.17, '#ffe45a', 0.07); for (k = 0; k < 8; k++) { var q = k * TAU / 8; ln(c, [0.12 + Math.cos(q) * 0.22, 0.7 + Math.sin(q) * 0.22, 0.12 + Math.cos(q) * 0.31, 0.7 + Math.sin(q) * 0.31], 0.045, '#b87a10'); }   // sun mark
  ci(c, 0.12, 0.7, 0.07, '#e8651a', 0);
  ln(c, [0.22, 0.4, 0.62, 0.48, 1.0, 0.32], 0.13, '#a86a0c');                                                      // heavy brow
  po(c, [0.2, 0.14, 0.58, 0.3, 0.98, 0.22, 1.1, 0.12, 0.6, -0.02], '#1a1410', 0.08);                              // eye with kohl tail
  el(c, 0.62, 0.13, 0.2, 0.08, 0.12, '#fffbe0', 0); ci(c, 0.68, 0.13, 0.045, '#ff8a1f', 0);
  glow(c, 0.62, 0.13, 0.5, 'rgb(255,252,210)', 0.6 + 0.3 * pu);
  ln(c, [0.78, 0.0, 0.9, -0.3], 0.07, '#b87a10'); ci(c, 1.02, -0.3, 0.1, '#ffd23f', 0.09);                         // nose
  bl(c, [0.52, -0.52, 0.8, -0.5, 0.98, -0.56, 0.8, -0.7, 0.54, -0.68], '#e8a010', 0.09); ln(c, [0.54, -0.6, 0.96, -0.58], 0.04, '#8a5a0c');   // lips
  ln(c, [0.4, -0.95, 0.7, -0.92], 0.04, '#b87a10');
  ci(c, -0.4, -0.05, 0.1, '#e8a010', 0.05);                                                                        // ear
  for (k = 0; k < 4; k++) {                                                                                        // heat shimmer rising
    var pts = [], yy, bx = -0.9 + k * 0.7;
    for (yy = 0; yy < 5; yy++) pts.push(bx + Math.sin(yy * 1.4 + t * 4 + k * 2) * 0.12, 2.3 + yy * 0.3);
    c.globalAlpha = 0.5; ln(c, pts, 0.05, '#fff6cc'); c.globalAlpha = 1;
  }
  for (k = 0; k < 9; k++) {                                                                                        // sparks flying out
    var f = (t * 0.7 + k * 0.113) % 1, sa = k * 2.4 + 0.5, r2 = 1.4 + f * 2.3;
    c.globalAlpha = 1 - f; ci(c, Math.cos(sa + f * 0.5) * r2, Math.sin(sa + f * 0.5) * r2, 0.07 * (1 - f * 0.5), k % 2 ? '#fff6aa' : '#ffb02a', 0);
  } c.globalAlpha = 1;
};

HEAD.champ = function (c, t) {
  var k, sh = (t * 0.55) % 2.8 - 1.2, fl = Math.sin(t * 6) * 0.08;
  glow(c, 0, 0.2, 3.0, 'rgb(255,215,90)', 0.6 + 0.12 * Math.sin(t * 3));
  for (k = 0; k < 10; k++) {                                                                                          // slow golden rays behind the head
    var ra = t * 0.3 + k * TAU / 10, rl = (k % 2 ? 1.75 : 2.2) * (1 + 0.06 * Math.sin(t * 2 + k));
    po(c, [Math.cos(ra - 0.2) * 1.0, Math.sin(ra - 0.2) * 1.0, Math.cos(ra) * rl, Math.sin(ra) * rl, Math.cos(ra + 0.2) * 1.0, Math.sin(ra + 0.2) * 1.0], k % 2 ? '#fff0a0' : '#ffd23f', 0.045);
  }
  bl(c, [-0.9, 0.4, -1.5, 0.25 + fl, -1.7, -0.15 + fl, -1.1, -0.1], '#c4281f', 0.1);                                    // wreath ribbon tails
  bl(c, [-0.9, 0.1, -1.4, -0.3 - fl, -1.55, -0.7 - fl, -1.0, -0.4], '#d6382a', 0.1);
  ln(c, [-1.1, 0.4, -1.7, 0.2 + fl], 0.04, '#ffd23f'); ln(c, [-1.1, 0.0, -1.6, -0.5 - fl], 0.04, '#ffd23f');
  var g = c.createLinearGradient(-1, 1, 1, -1); g.addColorStop(0, '#ffe27a'); g.addColorStop(0.4, '#ffc82a'); g.addColorStop(0.75, '#e8a010'); g.addColorStop(1, '#a8680a');
  ci(c, 0, 0, 1, g);                                                                                                  // gold helmet
  c.save(); c.beginPath(); c.arc(0, 0, 0.95, 0, TAU); c.clip();
  c.beginPath(); c.arc(-0.2, 0.15, 0.55, 0.2, 3.1); c.lineWidth = 0.17; c.strokeStyle = '#ffffff'; c.stroke();         // white racing stripe
  c.beginPath(); c.arc(-0.2, 0.15, 0.55, 0.2, 3.1); c.lineWidth = 0.05; c.strokeStyle = '#d0d6e0'; c.stroke();
  c.save(); c.translate(sh, 0); c.rotate(0.5); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(-0.12, -2, 0.26, 4); c.fillRect(0.22, -2, 0.07, 4); c.restore();     // travelling shine
  c.restore();
  arc(c, 0.9, 1.5, 2.5, 0.08, 'rgba(255,255,255,0.9)'); arc(c, 0.9, 4.0, 5.2, 0.1, 'rgba(120,70,0,0.35)');
  bl(c, [0.22, 0.4, 0.9, 0.46, 1.1, -0.06, 0.96, -0.78, 0.5, -0.9, 0.2, -0.4], SKIN, 0.12);                          // the face opening
  ci(c, 0.36, -0.3, 0.17, 'rgba(255,110,110,0.35)', 0);
  ci(c, 1.04, -0.04, 0.13, '#dba27c', 0.1);                                                                           // nose
  ln(c, [0.34, 0.26, 0.62, 0.36, 0.88, 0.22], 0.1, '#5a3a22');
  eye(c, 0.62, 0.08, 0.1); ci(c, 0.65, 0.12, 0.03, '#ffffff', 0);
  c.beginPath(); c.moveTo(0.4, -0.4); c.quadraticCurveTo(0.76, -0.5, 1.0, -0.32); c.quadraticCurveTo(0.94, -0.8, 0.68, -0.8); c.quadraticCurveTo(0.44, -0.74, 0.4, -0.4); c.closePath(); c.fillStyle = '#7a1a20'; c.fill();
  c.save(); c.clip(); po(c, [0.3, -0.4, 1.1, -0.4, 1.1, -0.54, 0.3, -0.54], '#ffffff', 0); el(c, 0.7, -0.84, 0.18, 0.1, 0, '#ff7a8a', 0); c.restore();
  c.beginPath(); c.moveTo(0.4, -0.4); c.quadraticCurveTo(0.76, -0.5, 1.0, -0.32); c.quadraticCurveTo(0.94, -0.8, 0.68, -0.8); c.quadraticCurveTo(0.44, -0.74, 0.4, -0.4); c.closePath(); c.lineWidth = 0.07; c.strokeStyle = OUT; c.stroke();
  ln(c, [1.0, -0.32, 1.06, -0.26], 0.05, OUT);
  po(c, [0.4, 0.5, 1.5, 0.4, 1.46, 0.2, 0.7, 0.3], '#e8a010', 0.12); ln(c, [0.6, 0.4, 1.4, 0.32], 0.04, '#fff3b0');       // peak
  for (k = 0; k < 7; k++) {                                                                                           // laurel wreath over the dome
    var a = 0.9 + k * 0.42, lx = Math.cos(a) * 1.02, ly = Math.sin(a) * 1.02;
    c.save(); c.translate(lx, ly); c.rotate(a + 0.5); el(c, 0, 0, 0.28, 0.12, 0, k % 2 ? '#3f9a46' : '#5ab84a', 0.07); ln(c, [-0.2, 0, 0.2, 0], 0.025, '#d8f0a0'); c.restore();
    c.save(); c.translate(Math.cos(a + 0.2) * 0.9, Math.sin(a + 0.2) * 0.9); c.rotate(a + 0.2 - 0.5 + Math.PI); el(c, 0, 0, 0.2, 0.09, 0, k % 2 ? '#5ab84a' : '#3f9a46', 0.05); c.restore();
  }
  ci(c, -0.95, 0.45, 0.1, '#ffd23f', 0.06);
  for (k = 0; k < 3; k++) { var s2 = Math.sin(t * 3 + k * 2.1); c.globalAlpha = Math.max(0, s2); star(c, [-0.5, 0.6, 1.0][k] + Math.sin(t + k) * 0.1, [1.2, 1.5, 0.9][k], 0.15 + 0.1 * s2, '#ffffff'); } c.globalAlpha = 1;
  bl(c, [-0.5, -1.0, 0.0, -1.2, 0.5, -1.0, 0.3, -1.3, -0.2, -1.3], '#c4281f', 0.1); ln(c, [-0.3, -1.05, 0.0, -1.2], 0.04, '#ffffff'); ln(c, [0.3, -1.05, 0.0, -1.2], 0.04, '#1f4fa8');   // the medal
  ci(c, 0.0, -1.55, 0.3, '#ffd23f', 0.1); ci(c, 0.0, -1.55, 0.2, '#e8a010', 0.04); star(c, 0.0, -1.55, 0.13, '#fff7cf');
  ln(c, [-0.18, -1.4, -0.08, -1.3], 0.04, 'rgba(255,255,255,0.8)');
};

HEAD.goldie = function (c, t) {
  var k, pu = 0.5 + 0.5 * Math.sin(t * 1.8), ga = 0.55 + 0.45 * pu;
  glow(c, 0, 0, 2.8, 'rgb(255,200,70)', 0.4 + 0.2 * pu);
  c.save(); c.rotate(-0.4); c.beginPath(); c.ellipse(0, 0.05, 1.7, 0.5, 0, 0, TAU); c.restore();                           // a thin gold halo ring going round
  c.lineWidth = 0.1; c.strokeStyle = OUT; c.stroke(); c.lineWidth = 0.055; c.strokeStyle = '#ffd23f'; c.stroke();
  var ha = t * 1.4, hx = Math.cos(ha) * 1.7, hy = Math.sin(ha) * 0.5, cs4 = Math.cos(-0.4), sn4 = Math.sin(-0.4);
  star(c, hx * cs4 - hy * sn4, 0.05 + hx * sn4 + hy * cs4, 0.2, '#fffbe0');
  ci(c, 0, 0, 1, '#f3e6c4');
  c.save(); c.beginPath(); c.arc(0, 0, 0.94, 0, TAU); c.clip();
  el(c, 0.2, -1.0, 1.7, 0.8, 0, '#d8c68e', 0); el(c, -0.4, 0.8, 1.0, 0.4, 0.3, '#fffaea', 0);
  po(c, [-0.7, 0.9, -0.3, 0.55, -0.45, 0.2, -1.0, 0.4], '#ead9ac', 0);                                              // shards sitting a little off true
  c.restore();
  arc(c, 0.86, 1.6, 2.7, 0.09, '#ffffff');
  var seams = [[[-0.2, 0.98], [-0.05, 0.55], [-0.35, 0.2], [-0.12, -0.15], [-0.42, -0.5], [-0.3, -0.95]], [[-0.05, 0.55], [0.3, 0.7], [0.6, 0.62], [0.92, 0.55]], [[-0.12, -0.15], [-0.5, -0.1], [-0.8, -0.3], [-0.98, -0.1]], [[-0.35, 0.2], [-0.7, 0.4], [-0.95, 0.2]]];
  po(c, [-0.2, 0.98, -0.05, 0.55, 0.3, 0.7, 0.55, 0.95], '#ffd23f', 0.04); ln(c, [-0.1, 0.9, 0.2, 0.8], 0.04, '#fff3b0');       // a chip filled in solid gold
  c.globalAlpha = ga * 0.6; seams.forEach(function (s) { var p = []; s.forEach(function (q) { p.push(q[0], q[1]); }); ln(c, p, 0.26, 'rgba(255,200,70,0.8)'); }); c.globalAlpha = 1;
  seams.forEach(function (s, i) { var p = []; s.forEach(function (q) { p.push(q[0], q[1]); }); ln(c, p, i < 2 ? 0.13 : 0.09, '#b8780a'); ln(c, p, i < 2 ? 0.09 : 0.06, '#ffd23f'); });
  c.globalAlpha = 0.45 + 0.55 * pu; seams.slice(0, 2).forEach(function (s) { var p = []; s.forEach(function (q) { p.push(q[0], q[1]); }); ln(c, p, 0.03, '#fffbe0'); }); c.globalAlpha = 1;
  for (k = 1; k < 5; k++) { var s0 = seams[0][k]; ci(c, s0[0], s0[1], 0.055, '#fff3b0', 0.03); }
  [[-0.02, -0.3, 0.23], [-0.62, 0.5, 0.13]].forEach(function (m) {                                                    // crash test marks, painted in gold
    ci(c, m[0], m[1], m[2], '#fff6dc', 0.08);
    c.fillStyle = '#e8a010'; c.beginPath(); c.moveTo(m[0], m[1]); c.arc(m[0], m[1], m[2], 0, Math.PI / 2); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(m[0], m[1]); c.arc(m[0], m[1], m[2], Math.PI, Math.PI * 1.5); c.closePath(); c.fill();
    ci(c, m[0], m[1], m[2], null, 0.07);
  });
  ci(c, 0.92, -0.1, 0.05, '#c8b078', 0);
  qline(c, 0.42, 0.06, 0.6, 0.36, 0.8, 0.06, 0.1, OUT);                                                               // calm closed eye
  qline(c, 0.42, 0.4, 0.62, 0.48, 0.84, 0.38, 0.05, '#b8a068');
  qline(c, 0.34, -0.5, 0.6, -0.9, 0.86, -0.5, 0.09, OUT);                                                              // gentle smile
  ci(c, -0.1, -0.7, 0.1, '#d8c68e', 0.06); ci(c, -0.1, -0.7, 0.045, '#b8780a', 0);
  for (k = 0; k < 5; k++) { var f = (t * 0.4 + k * 0.2) % 1; c.globalAlpha = Math.sin(f * Math.PI); star(c, -0.9 + k * 0.5 + Math.sin(f * 5 + k) * 0.15, 0.9 + f * 1.5, 0.1 + 0.05 * (k % 2), '#ffe27a'); } c.globalAlpha = 1;
};

/* a five-point star at (x, y), r to the tips, turned by ang. lw 0 = no outline */
function star5(c, x, y, r, ang, fill, lw) {
  var k, p = [];
  for (k = 0; k < 10; k++) { var a = ang + Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.42 : r; p.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  po(c, p, fill, lw == null ? 0.06 : lw);
}
/* the flaming hoop the daredevil has just come through: an iron ring seen side on, centre (cx, 0.1), half of it at a time */
function hoop(c, t, cx, front) {
  var k, rx = 0.32, ry = 1.5, a0 = front ? -Math.PI / 2 : Math.PI / 2, a1 = front ? Math.PI / 2 : Math.PI * 1.5;
  for (k = 0; k < 9; k++) {                                                                                         // flames licking off the ring, blown back
    var a = a0 + (k + 0.5) * Math.PI / 9, x = cx + Math.cos(a) * rx, y = 0.1 + Math.sin(a) * ry, out = Math.atan2(Math.sin(a) / ry, Math.cos(a) / rx);
    var dir = Math.atan2(Math.sin(out) * 0.8 + 0.25, Math.cos(out) * 0.6 - 0.8);
    plume(c, x, y, dir, 0.42 + 0.14 * Math.sin(t * 5 + k * 1.9), 0.11, t, k * 1.7 + (front ? 0 : 3), ['#e8321a', '#ff8a1f', '#fff08a'], 0.06);
  }
  c.beginPath(); c.ellipse(cx, 0.1, rx, ry, 0, a0, a1); c.lineWidth = 0.2; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 0.11; c.strokeStyle = '#ff9a2a'; c.stroke();
  c.lineWidth = 0.04; c.strokeStyle = '#fff2a8'; c.stroke();
}
HEAD.daredevil = function (c, t) {
  var k, pu = 0.5 + 0.5 * Math.sin(t * 2.2), sh = (t * 0.5) % 2.6 - 1.1;
  glow(c, 0.1, 0.1, 3.0, 'rgb(255,205,110)', 0.5 + 0.12 * pu);
  for (k = 0; k < 2; k++) {                                                                                        // two searchlights sweeping the night
    var bx = k ? 1.5 : -1.3, ba = Math.PI / 2 + (k ? 0.35 : -0.3) + 0.35 * Math.sin(t * 0.8 + k * 2.4), bl2 = 4.2, bw = 0.28;
    c.beginPath(); c.moveTo(bx, -2.2); c.lineTo(bx + Math.cos(ba - bw) * bl2, -2.2 + Math.sin(ba - bw) * bl2); c.lineTo(bx + Math.cos(ba + bw) * bl2, -2.2 + Math.sin(ba + bw) * bl2); c.closePath();
    var bg = c.createLinearGradient(bx, -2.2, bx + Math.cos(ba) * bl2, -2.2 + Math.sin(ba) * bl2); bg.addColorStop(0, 'rgba(255,250,225,0.5)'); bg.addColorStop(1, 'rgba(255,250,225,0)');
    c.fillStyle = bg; c.fill();
  }
  hoop(c, t, -1.5, false);
  // the helmet: glossy white, a blue racing band full of stars over the crown edged in red, and a big star on the side
  var g = c.createRadialGradient(0.25, 0.45, 0.08, 0, 0, 1.05); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#f3f1ec'); g.addColorStop(1, '#c9ccd4');
  ci(c, 0, 0, 1, g);
  c.save(); c.beginPath(); c.arc(0, 0, 0.95, 0, TAU); c.clip();
  c.beginPath(); c.arc(-0.12, -0.12, 0.74, 0.5, 3.15); c.lineWidth = 0.46; c.strokeStyle = '#d3232e'; c.stroke();
  c.lineWidth = 0.32; c.strokeStyle = '#1f4aa8'; c.stroke();
  c.beginPath(); c.arc(-0.12, -0.12, 0.74, 0.5, 3.15); c.lineWidth = 0.03; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
  for (k = 0; k < 5; k++) { var sa = 0.75 + k * 0.5; star5(c, -0.12 + Math.cos(sa) * 0.74, -0.12 + Math.sin(sa) * 0.74, 0.1, sa - Math.PI / 2, '#ffffff', 0); }
  c.save(); c.translate(sh, 0); c.rotate(0.5); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(-0.1, -2, 0.22, 4); c.fillRect(0.2, -2, 0.06, 4); c.restore();     // travelling shine
  c.restore();
  arc(c, 0.9, 1.55, 2.5, 0.08, 'rgba(255,255,255,0.95)'); arc(c, 0.9, 3.9, 5.1, 0.1, 'rgba(60,70,100,0.3)');
  star5(c, -0.32, -0.36, 0.36, -0.1, '#e8b030', 0.08); star5(c, -0.32, -0.36, 0.25, -0.1, '#d3232e', 0);                // the big star
  ln(c, [-0.36, -0.2, -0.3, -0.12], 0.04, 'rgba(255,255,255,0.8)');
  // face under the visor: sideburns, a big grin, the chin strap
  bl(c, [0.2, 0.25, 0.95, 0.3, 1.12, -0.12, 1.02, -0.78, 0.56, -0.96, 0.18, -0.55], SKIN, 0.12);
  bl(c, [0.2, 0.0, 0.42, 0.0, 0.46, -0.5, 0.3, -0.62, 0.2, -0.4], '#6a4228', 0.06);
  ci(c, 1.08, -0.3, 0.12, '#dba27c', 0.09);
  c.beginPath(); c.moveTo(0.5, -0.5); c.quadraticCurveTo(0.8, -0.56, 1.02, -0.44); c.quadraticCurveTo(0.96, -0.82, 0.72, -0.82); c.quadraticCurveTo(0.52, -0.76, 0.5, -0.5); c.closePath(); c.fillStyle = '#7a1a20'; c.fill();
  c.save(); c.clip(); po(c, [0.4, -0.5, 1.1, -0.5, 1.1, -0.62, 0.4, -0.62], '#ffffff', 0); c.restore();
  c.beginPath(); c.moveTo(0.5, -0.5); c.quadraticCurveTo(0.8, -0.56, 1.02, -0.44); c.quadraticCurveTo(0.96, -0.82, 0.72, -0.82); c.quadraticCurveTo(0.52, -0.76, 0.5, -0.5); c.closePath(); c.lineWidth = 0.07; c.strokeStyle = OUT; c.stroke();
  ln(c, [0.22, -0.48, 0.58, -0.95], 0.08, '#2b2f38');
  // the gold mirror visor: sky above the horizon, ground below, a shine sliding over it
  var vp = [0.1, 0.56, 0.86, 0.6, 1.22, 0.32, 1.24, -0.1, 0.9, -0.2, 0.16, -0.06];
  c.save(); c.beginPath(); c.moveTo(vp[0], vp[1]); for (k = 2; k < vp.length; k += 2) c.lineTo(vp[k], vp[k + 1]); c.closePath(); c.clip();
  var vg = c.createLinearGradient(0, 0.6, 0, -0.2); vg.addColorStop(0, '#fff3b0'); vg.addColorStop(0.45, '#f4c43c'); vg.addColorStop(0.5, '#9a6408'); vg.addColorStop(1, '#d99a1e');
  c.fillStyle = vg; c.fillRect(0, -0.3, 1.4, 1);
  c.beginPath(); c.moveTo(0.1, 0.17); c.quadraticCurveTo(0.7, 0.26, 1.3, 0.12); c.lineWidth = 0.035; c.strokeStyle = 'rgba(255,250,220,0.9)'; c.stroke();
  var vs = ((t * 0.45) % 1.8) - 0.4; c.save(); c.translate(vs, 0.2); c.rotate(-0.6); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(-0.06, -1, 0.14, 2); c.fillRect(0.14, -1, 0.04, 2); c.restore();
  c.restore();
  po(c, vp, null, 0.1);
  ln(c, [0.3, 0.46, 0.8, 0.5], 0.05, 'rgba(255,255,255,0.85)');
  ci(c, 0.14, 0.24, 0.1, '#d3232e', 0.06); ci(c, 0.14, 0.24, 0.04, '#ffffff', 0);                                 // visor snap
  var tw = Math.max(0, Math.sin(t * 3.3)); if (tw > 0.05) star(c, 0.95, 0.36, 0.06 + 0.14 * tw, '#ffffff');           // a reflected flashbulb
  hoop(c, t, -1.5, true);
  // the jumpsuit's big seventies collar, a blue yoke with white stars, and a gold star buckle
  po(c, [-0.35, -1.0, 0.45, -1.0, 0.35, -1.5, 0.05, -1.75, -0.25, -1.5], '#1f4aa8', 0.08);
  star5(c, -0.12, -1.3, 0.09, 0.2, '#ffffff', 0); star5(c, 0.22, -1.25, 0.08, -0.3, '#ffffff', 0); star5(c, 0.06, -1.55, 0.07, 0, '#ffffff', 0);
  po(c, [-0.3, -0.92, -0.85, -1.05, -0.62, -1.48, -0.25, -1.22], '#f8f6ef', 0.08); ln(c, [-0.8, -1.08, -0.62, -1.4], 0.06, '#d3232e');
  po(c, [0.38, -0.92, 0.98, -1.0, 0.8, -1.46, 0.36, -1.22], '#f8f6ef', 0.08); ln(c, [0.92, -1.04, 0.79, -1.38], 0.06, '#d3232e');
  star5(c, 0.06, -1.03, 0.16, 0, '#ffd23f', 0.06); ci(c, 0.06, -1.03, 0.04, '#fff7cf', 0);
  for (k = 0; k < 4; k++) {                                                                                       // camera flashes going off in the crowd
    var f = (t * 0.55 + k * 0.27) % 1, fx = [1.55, -0.7, 1.3, 0.4][k], fy = [1.25, 1.65, -0.8, 1.9][k], fk = Math.max(0, 1 - f * 3.2);
    if (fk > 0) { c.globalAlpha = fk; star(c, fx, fy, 0.08 + 0.22 * fk, k % 2 ? '#fff7cf' : '#ffffff'); }
  } c.globalAlpha = 1;
};

})(typeof window !== 'undefined' ? window : globalThis);
