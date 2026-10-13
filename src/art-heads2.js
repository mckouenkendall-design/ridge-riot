/* Ridge Riot: still more riders (the third batch).
   Same rules as art-heads.js: a head is drawn in "helmet space", a circle of radius 1 with the face pointing along +x and up as +y. */
(function (root) {
'use strict';
var RR = root.RR, A = RR.Art, K = A.kit, HEAD = A.HEADS;
var ci = K.ci, po = K.po, bl = K.bl, ln = K.ln, eye = K.eye, el = K.el, star = K.star, puff = K.puff, hsl = K.hsl, SKIN = K.SKIN, LW = K.LW, OUT = K.OUT, TAU = K.TAU;

/* a lit edge or shade drawn as an arc on the head's own circle */
function arc(c, r, a0, a1, w, col) { c.beginPath(); c.arc(0, 0, r, a0, a1); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
/* clip to a filled blob shape (same corner rounding as bl) so texture stays inside it */
function blobPath(c, p) {
  var n = p.length / 2, i; c.beginPath(); c.moveTo((p[0] + p[2 * n - 2]) / 2, (p[1] + p[2 * n - 1]) / 2);
  for (i = 0; i < n; i++) { var j = (i + 1) % n; c.quadraticCurveTo(p[i * 2], p[i * 2 + 1], (p[i * 2] + p[j * 2]) / 2, (p[i * 2 + 1] + p[j * 2 + 1]) / 2); }
  c.closePath();
}
/* an eye with a lit spot */
function eyeH(c, x, y, r) { ci(c, x, y, r, OUT, 0); ci(c, x + r * 0.32, y + r * 0.36, r * 0.34, '#ffffff', 0); }
/* a dab of shading on a flat face: a soft dark crescent along the lower back of a circle */
function shadeCircle(c, x, y, r, col, a0, a1) { c.beginPath(); c.arc(x, y, r, a0, a1); c.lineWidth = r * 0.22; c.strokeStyle = col; c.lineCap = 'round'; c.stroke(); }

/* an ear: a small upright oval with a curl inside it */
function ear(c, x, y, col) { el(c, x, y, 0.15, 0.21, 0.15, col, 0.1); ln(c, [x - 0.03, y + 0.08, x + 0.05, y + 0.02, x - 0.01, y - 0.09], 0.045, 'rgba(110,55,25,0.5)'); }

/* ---------------------------- common ---------------------------- */

HEAD.lumber = function (c) {
  var k, p;
  ci(c, 0, 0, 1, SKIN);
  arc(c, 0.84, 3.3, 4.3, 0.12, 'rgba(160,90,50,0.35)');
  /* ear flap, hanging down behind the beard */
  p = [-0.9, 0.5, -0.2, 0.55, -0.12, -0.55, -0.34, -0.95, -0.82, -0.7];
  bl(c, p, '#c4392f');
  c.save(); blobPath(c, p); c.clip();
  c.strokeStyle = '#7a1f1a'; c.lineWidth = 0.09;
  for (k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-1.0 + k * 0.2, 0.7); c.lineTo(-1.0 + k * 0.2, -1.1); c.stroke(); c.beginPath(); c.moveTo(-1.0, 0.45 - k * 0.3); c.lineTo(0, 0.45 - k * 0.3); c.stroke(); }
  c.restore();
  bl(c, p, null);
  ln(c, [-0.5, -0.9, -0.52, -1.28], 0.05, '#e8d9b0'); ci(c, -0.52, -1.32, 0.07, '#e8d9b0', 0.05);               // tie string and its bobble
  /* the big ginger beard, in strands */
  bl(c, [-0.1, -0.05, 0.5, -0.12, 1.1, 0.0, 1.32, -0.5, 1.05, -1.15, 0.55, -1.68, -0.1, -1.5, -0.6, -1.0, -0.5, -0.4], '#d9741f');
  c.save(); blobPath(c, [-0.1, -0.05, 0.5, -0.12, 1.1, 0.0, 1.32, -0.5, 1.05, -1.15, 0.55, -1.68, -0.1, -1.5, -0.6, -1.0, -0.5, -0.4]); c.clip();
  el(c, -0.3, -1.4, 1.3, 0.55, 0, 'rgba(120,50,10,0.38)', 0);
  for (k = 0; k < 6; k++) ln(c, [-0.3 + k * 0.28, -0.4, -0.38 + k * 0.28, -0.9, -0.2 + k * 0.28, -1.5], 0.06, k % 2 ? '#a8501a' : '#f0a050');
  c.restore();
  bl(c, [-0.1, -0.05, 0.5, -0.12, 1.1, 0.0, 1.32, -0.5, 1.05, -1.15, 0.55, -1.68, -0.1, -1.5, -0.6, -1.0, -0.5, -0.4], null);
  bl(c, [0.45, -0.22, 0.95, -0.1, 1.32, -0.28, 1.3, -0.56, 0.9, -0.58, 0.55, -0.5], '#e8892e', 0.12);                // moustache
  ln(c, [0.7, -0.3, 1.1, -0.28], 0.05, '#f6b46a');
  ln(c, [0.78, -0.72, 0.96, -0.78, 1.08, -0.7], 0.06, '#7a2f12');                                                        // smile peeking out
  ci(c, 1.12, 0.02, 0.17, '#e49a78', 0.12); ci(c, 1.07, 0.07, 0.04, 'rgba(255,255,255,0.7)', 0);                        // round nose
  ci(c, 0.5, -0.02, 0.15, 'rgba(255,100,100,0.38)', 0);
  eyeH(c, 0.66, 0.2, 0.12);
  ln(c, [0.42, 0.46, 0.7, 0.5, 0.96, 0.4], 0.12, '#d9741f');                                                             // bushy brow, kind and raised
  /* plaid cap */
  p = [-1.12, 0.1, -1.0, 0.95, 0.0, 1.32, 0.9, 1.02, 1.0, 0.45, 0.0, 0.5];
  bl(c, p, '#c4392f');
  c.save(); blobPath(c, p); c.clip();
  c.strokeStyle = '#7a1f1a'; c.lineWidth = 0.11;
  for (k = 0; k < 9; k++) { c.beginPath(); c.moveTo(-1.2 + k * 0.28, 0); c.lineTo(-1.2 + k * 0.28, 1.5); c.stroke(); c.beginPath(); c.moveTo(-1.2, 0.35 + k * 0.17); c.lineTo(1.2, 0.35 + k * 0.17); c.stroke(); }
  c.strokeStyle = '#1c1d22'; c.lineWidth = 0.04;
  for (k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-1.06 + k * 0.56, 0); c.lineTo(-1.06 + k * 0.56, 1.5); c.stroke(); c.beginPath(); c.moveTo(-1.2, 0.5 + k * 0.34); c.lineTo(1.2, 0.5 + k * 0.34); c.stroke(); }
  c.strokeStyle = 'rgba(255,200,180,0.55)'; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, 1.0, 1.9, 2.7); c.stroke();
  c.restore();
  bl(c, p, null);
  bl(c, [0.45, 0.62, 1.2, 0.62, 1.58, 0.42, 1.4, 0.26, 0.7, 0.32], '#9a2a22', 0.16);                                       // short peak
  ln(c, [0.7, 0.5, 1.3, 0.5], 0.05, 'rgba(255,200,180,0.5)'); ln(c, [0.8, 0.36, 1.35, 0.34], 0.04, 'rgba(60,10,10,0.5)');
  ci(c, 0.0, 1.32, 0.09, '#1c1d22', 0.06);
};

HEAD.wrench = function (c) {
  var k, p;
  ci(c, 0, 0, 1, SKIN);
  arc(c, 0.84, 3.4, 4.4, 0.12, 'rgba(160,90,50,0.3)');
  /* pencil behind the ear */
  ln(c, [-0.62, 0.46, -0.04, 0.12], 0.13, OUT); ln(c, [-0.62, 0.46, -0.04, 0.12], 0.07, '#ffd93d'); ln(c, [-0.55, 0.43, -0.12, 0.17], 0.025, '#e0a010');
  ci(c, -0.68, 0.49, 0.07, '#ff8aa8', 0.05);
  ear(c, -0.2, 0.0, '#dba27c');
  /* oil smudge */
  el(c, 0.34, -0.2, 0.26, 0.1, -0.5, 'rgba(30,24,20,0.7)', 0); ci(c, 0.2, -0.3, 0.05, 'rgba(30,24,20,0.7)', 0); ci(c, 0.5, -0.12, 0.035, 'rgba(30,24,20,0.6)', 0);
  ln(c, [0.22, -0.16, 0.44, -0.24], 0.03, 'rgba(255,255,255,0.15)');
  /* thick walrus moustache */
  p = [0.5, -0.22, 1.0, -0.14, 1.4, -0.26, 1.4, -0.62, 0.98, -0.6, 0.62, -0.54];
  bl(c, p, '#3a2616', 0.14);
  for (k = 0; k < 4; k++) ln(c, [0.7 + k * 0.17, -0.26, 0.74 + k * 0.17, -0.5], 0.04, '#6b4528');
  ln(c, [0.62, -0.2, 1.1, -0.18], 0.045, '#7a5232');
  ci(c, 1.03, 0.06, 0.14, '#dba27c', 0.1);                                                                                // nose
  eyeH(c, 0.66, -0.02, 0.12);
  ln(c, [0.4, 0.18, 0.9, 0.1], 0.13, '#3a2616');                                                                          // heavy brow
  /* goggles pushed up on the forehead */
  ln(c, [-1.0, 0.35, -0.2, 0.56, 0.5, 0.58], 0.2, OUT); ln(c, [-1.0, 0.35, -0.2, 0.56, 0.5, 0.58], 0.12, '#5a3a22');
  ci(c, 0.66, 0.54, 0.31, '#b8741f', 0.12);                                                                               // brass rim
  ci(c, 0.66, 0.54, 0.2, '#79c6e6', 0.06);
  ci(c, 0.66, 0.54, 0.2, null, 0.05);
  c.save(); c.beginPath(); c.arc(0.66, 0.54, 0.2, 0, TAU); c.clip(); el(c, 0.64, 0.42, 0.3, 0.14, 0, 'rgba(30,70,110,0.3)', 0); c.restore();
  ln(c, [0.55, 0.62, 0.66, 0.68], 0.06, 'rgba(255,255,255,0.9)'); ci(c, 0.6, 0.6, 0.03, '#ffffff', 0);
  for (k = 0; k < 6; k++) { var a = k * TAU / 6 + 0.3; ci(c, 0.66 + Math.cos(a) * 0.26, 0.54 + Math.sin(a) * 0.26, 0.022, '#ffe3a1', 0); }
  /* flat cap */
  p = [-1.1, 0.5, -0.9, 1.15, 0.0, 1.38, 0.85, 1.28, 1.3, 0.86, 0.9, 0.72, 0.0, 0.76];
  bl(c, p, '#6b6f78');
  c.save(); blobPath(c, p); c.clip();
  for (k = 0; k < 24; k++) { var tx = -1.0 + (k * 0.37) % 2.3, ty = 0.8 + (k * 0.23) % 0.6; ln(c, [tx, ty, tx + 0.09, ty - 0.05], 0.035, k % 2 ? '#8a8e98' : '#4a4e58'); }
  el(c, -0.3, 1.45, 1.3, 0.35, 0, 'rgba(255,255,255,0.18)', 0);
  c.restore();
  bl(c, p, null);
  po(c, [0.8, 0.9, 1.62, 0.72, 1.5, 0.55, 0.88, 0.66], '#4a4e58');
  ln(c, [0.96, 0.78, 1.5, 0.67], 0.04, 'rgba(255,255,255,0.25)');
  ci(c, 0.05, 1.34, 0.07, '#4a4e58', 0.06);
};

HEAD.guard = function (c) {
  var p, k;
  var TAN = '#dca06f';
  /* whistle cord, going round the neck */
  ln(c, [-0.35, -0.8, 0.1, -1.35, 0.7, -1.38, 1.05, -1.0], 0.09, OUT); ln(c, [-0.35, -0.8, 0.1, -1.35, 0.7, -1.38, 1.05, -1.0], 0.04, '#ffd23d');
  bl(c, [0.7, -1.36, 1.02, -1.44, 1.24, -1.62, 0.96, -1.8, 0.66, -1.7], '#e2402f', 0.1);                                  // the whistle
  ci(c, 0.95, -1.6, 0.05, OUT, 0); ln(c, [0.74, -1.5, 0.98, -1.52], 0.035, 'rgba(255,255,255,0.45)');
  ci(c, 0, 0, 1, TAN);
  arc(c, 0.84, 3.4, 4.4, 0.12, 'rgba(140,70,30,0.3)');
  /* sun-bleached hair sticking up through the visor */
  puff(c, [[-0.7, 0.98, 0.3], [-0.28, 1.28, 0.34], [0.22, 1.36, 0.33], [0.66, 1.1, 0.27], [0.0, 1.0, 0.4]], '#f2d17a', 0.09);
  ln(c, [-0.84, 1.08, -0.7, 1.22], 0.05, '#fff2b8'); ln(c, [-0.42, 1.38, -0.2, 1.5], 0.05, '#fff2b8'); ln(c, [0.1, 1.5, 0.35, 1.52], 0.05, '#fff2b8');
  ln(c, [-0.3, 0.98, -0.2, 1.2], 0.04, '#c9a24a'); ln(c, [0.3, 0.98, 0.34, 1.2], 0.04, '#c9a24a');
  ear(c, -0.2, -0.05, '#cd8a5c');
  /* zinc stripes */
  ci(c, 1.06, -0.2, 0.19, '#ffffff', 0.12); ci(c, 1.0, -0.14, 0.05, '#e9eef7', 0);
  ln(c, [0.42, -0.2, 0.7, -0.3], 0.1, '#ffffff'); ln(c, [0.5, -0.04, 0.78, -0.12], 0.07, '#ffffff');
  /* mirrored shades */
  var g = c.createLinearGradient(0.3, 0.3, 1.05, -0.2); g.addColorStop(0, '#8fd8ff'); g.addColorStop(0.45, '#2f6fb0'); g.addColorStop(1, '#162a55');
  p = [0.22, 0.34, 1.0, 0.4, 1.12, 0.1, 0.96, -0.2, 0.4, -0.1];
  bl(c, p, g, 0.12);
  ln(c, [0.4, 0.28, 0.66, 0.31], 0.05, 'rgba(255,255,255,0.8)'); ln(c, [0.75, 0.3, 0.9, 0.3], 0.05, 'rgba(255,255,255,0.6)');
  star(c, 0.88, 0.22, 0.07, '#ffffff');
  ln(c, [0.3, 0.26, -0.85, 0.18], 0.1, OUT);
  ln(c, [0.5, -0.62, 0.74, -0.7, 0.98, -0.56], 0.09, OUT);                                                                 // confident smirk
  ln(c, [0.96, -0.54, 1.02, -0.5], 0.07, OUT);
  /* visor */
  bl(c, [-1.1, 0.34, -1.04, 0.84, 0.0, 0.86, 1.04, 0.82, 1.12, 0.36, 0.0, 0.3], '#ffffff');
  ln(c, [-0.9, 0.62, 0.9, 0.62], 0.1, '#e2402f');
  bl(c, [-1.1, 0.34, -1.04, 0.84, 0.0, 0.86, 1.04, 0.82, 1.12, 0.36, 0.0, 0.3], null);
  po(c, [0.62, 0.74, 1.8, 0.56, 1.7, 0.3, 0.8, 0.42], '#e2402f'); ln(c, [0.9, 0.62, 1.6, 0.5], 0.05, '#ff8a7a'); ln(c, [0.9, 0.46, 1.6, 0.36], 0.04, '#9a2020');
};

HEAD.gnome = function (c) {
  var k;
  /* tall floppy hat, tip flopped over the front */
  var hat = [1.04, 0.5, 0.66, 1.3, 0.55, 2.0, 1.0, 2.25, 1.62, 2.1, 1.35, 2.8, 0.5, 2.95, -0.5, 2.3, -1.1, 1.3, -1.1, 0.5];
  ci(c, 0, 0, 1, SKIN);
  ci(c, 0.55, -0.3, 0.2, 'rgba(255,110,110,0.45)', 0);
  /* big white beard */
  var beard = [-0.2, 0.0, 0.5, -0.05, 1.12, 0.05, 1.35, -0.6, 1.1, -1.3, 0.55, -1.9, -0.1, -1.7, -0.7, -1.1, -0.5, -0.4];
  bl(c, beard, '#f4f7fb');
  c.save(); blobPath(c, beard); c.clip();
  el(c, -0.2, -1.6, 1.4, 0.7, 0, 'rgba(120,140,185,0.4)', 0);
  for (k = 0; k < 5; k++) ln(c, [-0.3 + k * 0.32, -0.3, -0.4 + k * 0.32, -0.9, -0.2 + k * 0.32, -1.7], 0.05, k % 2 ? '#c9d3e6' : '#ffffff');
  c.restore();
  bl(c, beard, null);
  bl(c, [0.5, -0.12, 1.0, -0.05, 1.42, -0.2, 1.42, -0.5, 1.0, -0.5, 0.6, -0.4], '#ffffff', 0.12);                           // moustache
  ln(c, [0.72, -0.2, 1.2, -0.2], 0.04, '#c9d3e6');
  ci(c, 1.08, 0.08, 0.24, '#e8453a', 0.12); ci(c, 1.01, 0.15, 0.06, 'rgba(255,255,255,0.8)', 0);                          // round red nose
  ci(c, 0.68, 0.2, 0.1, OUT, 0); ci(c, 0.71, 0.24, 0.032, '#ffffff', 0);
  bl(c, [0.4, 0.42, 0.7, 0.5, 1.02, 0.36, 0.98, 0.3, 0.7, 0.34], '#ffffff', 0.1);                                           // brow tuft
  /* hat */
  bl(c, hat, '#d93a3a');
  c.save(); blobPath(c, hat); c.clip();
  el(c, 0.95, 1.4, 0.45, 1.5, 0.25, 'rgba(110,15,20,0.45)', 0);
  ln(c, [-0.88, 0.7, -0.8, 1.6, -0.3, 2.45, 0.4, 2.78], 0.12, 'rgba(255,170,150,0.6)');
  c.restore();
  bl(c, hat, null);
  ln(c, [0.5, 1.5, 0.45, 2.1, 0.9, 2.35, 1.4, 2.3], 0.05, '#a82020');
  ln(c, [1.1, 2.4, 1.3, 2.6], 0.04, '#e35a5a');
  bl(c, [-1.14, 0.38, -1.06, 0.78, 0.0, 0.86, 1.06, 0.74, 1.12, 0.36, 0.0, 0.32], '#a82020', 0.14);                          // rolled brim
  ln(c, [-0.9, 0.62, 0.9, 0.58], 0.05, '#e35a5a');
  ci(c, 1.66, 2.04, 0.2, '#ffffff', 0.12); ci(c, 1.6, 2.1, 0.05, '#dfe6f3', 0); ci(c, 1.72, 1.98, 0.06, '#c9d3e6', 0);        // little bobble on the flopped tip
};

HEAD.scarecrow = function (c) {
  var k, p;
  /* straw sticking out of the collar */
  for (k = 0; k < 9; k++) { var sx = -0.55 + k * 0.17, sl = 0.4 + (k * 37 % 5) * 0.1; ln(c, [sx, -0.7, sx + (k % 2 ? 0.1 : -0.1), -0.7 - sl * 0.7, sx + (k % 3 - 1) * 0.2, -0.7 - sl], 0.07, OUT); }
  for (k = 0; k < 9; k++) { var sx2 = -0.55 + k * 0.17, sl2 = 0.4 + (k * 37 % 5) * 0.1; ln(c, [sx2, -0.7, sx2 + (k % 2 ? 0.1 : -0.1), -0.7 - sl2 * 0.7, sx2 + (k % 3 - 1) * 0.2, -0.7 - sl2], 0.035, k % 2 ? '#f2c94a' : '#d9a52e'); }
  /* the sack */
  p = [-1.0, 0.1, -0.8, 0.85, 0.0, 1.05, 0.85, 0.85, 1.06, 0.1, 0.9, -0.7, 0.2, -1.0, -0.7, -0.8];
  bl(c, p, '#c9a56a');
  c.save(); blobPath(c, p); c.clip();
  c.strokeStyle = 'rgba(120,80,30,0.22)'; c.lineWidth = 0.035;
  for (k = 0; k < 12; k++) { c.beginPath(); c.moveTo(-1.2 + k * 0.2, -1.2); c.lineTo(-1.2 + k * 0.2, 1.3); c.stroke(); c.beginPath(); c.moveTo(-1.2, -1.2 + k * 0.2); c.lineTo(1.3, -1.2 + k * 0.2); c.stroke(); }
  el(c, -0.4, -0.9, 1.4, 0.5, 0, 'rgba(110,70,25,0.4)', 0);
  ln(c, [-0.8, 0.6, -0.6, 0.9], 0.1, 'rgba(255,235,180,0.6)');
  c.restore();
  bl(c, p, null);
  /* a gingham patch, sewn on */
  po(c, [-0.5, 0.2, -0.1, 0.24, -0.06, -0.14, -0.46, -0.18], '#7aa8d8', 0.07);
  ln(c, [-0.3, 0.22, -0.28, -0.16], 0.05, '#ffffff'); ln(c, [-0.48, 0.02, -0.08, 0.04], 0.05, '#ffffff');
  [[-0.5, 0.2], [-0.1, 0.24], [-0.06, -0.14], [-0.46, -0.18]].forEach(function (s) { ln(c, [s[0] - 0.03, s[1] - 0.02, s[0] + 0.03, s[1] + 0.02], 0.025, OUT); });
  /* button eyes, odd pair */
  ci(c, 0.42, 0.2, 0.2, '#5a3a22', 0.1); ci(c, 0.42, 0.2, 0.12, null, 0.025); ci(c, 0.37, 0.2, 0.028, OUT, 0); ci(c, 0.47, 0.2, 0.028, OUT, 0); ci(c, 0.37, 0.25, 0.1, null, 0); ln(c, [0.35, 0.28, 0.5, 0.15], 0.035, 'rgba(255,255,255,0.4)');
  ci(c, 0.84, 0.18, 0.15, '#2f6fb0', 0.1); ln(c, [0.78, 0.12, 0.9, 0.24], 0.04, OUT); ln(c, [0.78, 0.24, 0.9, 0.12], 0.04, OUT);
  /* the stitched mouth */
  ln(c, [0.3, -0.34, 0.5, -0.46, 0.7, -0.42, 0.9, -0.3], 0.06, OUT);
  for (k = 0; k < 5; k++) { var mx = 0.34 + k * 0.14, my = -0.38 - (k === 1 || k === 2 ? 0.07 : k === 3 ? 0.03 : 0) ; ln(c, [mx, my + 0.14, mx + 0.02, my - 0.14], 0.045, OUT); }
  /* twine round the neck */
  ln(c, [-0.8, -0.78, 0.0, -0.98, 0.7, -0.76], 0.12, OUT); ln(c, [-0.8, -0.78, 0.0, -0.98, 0.7, -0.76], 0.06, '#a8793a');
  ln(c, [0.6, -0.82, 0.9, -1.1], 0.05, '#a8793a');
  /* floppy patched hat with a crow feather */
  bl(c, [-1.2, 0.66, -0.5, 0.95, 0.5, 1.0, 1.4, 0.7, 1.9, 0.5, 1.25, 0.46, 0.2, 0.5, -0.8, 0.44], '#6b4a2e');
  p = [-0.78, 0.8, -0.6, 1.4, -0.1, 1.5, 0.45, 1.5, 0.8, 0.8];
  bl(c, p, '#7a5636');
  c.save(); blobPath(c, p); c.clip(); el(c, 0.6, 0.9, 0.5, 0.8, 0, 'rgba(40,20,8,0.4)', 0); ln(c, [-0.6, 1.2, -0.3, 1.4], 0.08, 'rgba(255,220,170,0.4)'); c.restore();
  bl(c, p, null);
  po(c, [-0.35, 1.0, 0.05, 1.12, 0.1, 0.78, -0.3, 0.7], '#5aa65a', 0.08);                                                    // green patch
  ln(c, [-0.28, 0.9, 0.0, 0.98], 0.03, OUT); ln(c, [-0.24, 0.8, 0.04, 0.88], 0.03, OUT);
  ln(c, [-0.8, 0.72, 0.8, 0.68], 0.14, '#3d2a18');
  for (k = 0; k < 4; k++) ln(c, [-1.2 + k * 0.05, 0.62, -1.4 - k * 0.04, 0.4 - k * 0.1], 0.06, k % 2 ? '#f2c94a' : '#d9a52e');   // straw out of the brim
  /* crow feather */
  bl(c, [0.35, 1.2, 0.75, 1.9, 0.95, 2.55, 0.55, 2.1, 0.3, 1.5], '#1c1d22', 0.1);
  ln(c, [0.45, 1.3, 0.8, 2.3], 0.04, '#4a5a9a'); ln(c, [0.5, 1.45, 0.62, 1.75], 0.04, '#3a4a8a');
};

HEAD.quackers = function (c) {
  var k;
  /* the little tuft on top */
  bl(c, [-0.05, 0.9, -0.25, 1.4, 0.2, 1.7, 0.3, 1.3, 0.2, 0.95], '#ffdd33', 0.14);
  /* bubbles floating up */
  [[-0.9, 1.5, 0.28], [-0.35, 2.05, 0.18], [0.5, 1.95, 0.12]].forEach(function (b) {
    ci(c, b[0], b[1], b[2], 'rgba(200,236,255,0.35)', 0.07);
    c.beginPath(); c.arc(b[0], b[1], b[2] * 0.62, 3.4, 4.5); c.lineWidth = b[2] * 0.26; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineCap = 'round'; c.stroke();
  });
  ci(c, 0, 0, 1, '#ffdd33');
  c.save(); c.beginPath(); c.arc(0, 0, 0.96, 0, TAU); c.clip();
  el(c, -0.35, -0.95, 1.5, 0.75, 0.2, 'rgba(230,150,10,0.5)', 0);                                                            // shaded belly side
  c.restore();
  arc(c, 0.84, 3.55, 4.1, 0.05, 'rgba(190,100,0,0.45)');
  ln(c, [-0.98, -0.1, -0.9, 0.2], 0.01, '#ffdd33');
  /* rubber mould seam */
  c.beginPath(); c.arc(0, 0, 0.86, 2.3, 4.0); c.lineWidth = 0.035; c.strokeStyle = 'rgba(190,110,0,0.5)'; c.stroke();
  /* shine stripe */
  arc(c, 0.76, 1.55, 2.5, 0.16, 'rgba(255,255,255,0.85)'); ci(c, -0.12, 0.62, 0.07, 'rgba(255,255,255,0.9)', 0);
  /* beak */
  var beak = [0.78, 0.22, 1.35, 0.34, 1.9, 0.12, 1.92, -0.14, 1.5, -0.34, 0.85, -0.3];
  bl(c, beak, '#ff8a1f');
  c.save(); blobPath(c, beak); c.clip(); el(c, 1.3, -0.5, 1.3, 0.3, 0, 'rgba(190,60,0,0.45)', 0); c.restore();
  bl(c, beak, null);
  ln(c, [0.9, 0.02, 1.4, 0.0, 1.85, -0.02], 0.07, '#a83c00');                                                                  // the smile line
  ln(c, [1.0, 0.3, 1.5, 0.3], 0.07, 'rgba(255,230,160,0.8)');
  ci(c, 1.5, 0.15, 0.04, '#a83c00', 0);
  /* eye and cheek */
  ci(c, 0.55, 0.25, 0.18, '#15171d', 0); ci(c, 0.6, 0.31, 0.065, '#ffffff', 0); ci(c, 0.5, 0.18, 0.03, '#ffffff', 0);
  ci(c, 0.28, -0.12, 0.14, 'rgba(255,120,60,0.4)', 0);
};

HEAD.clown = function (c, t) {
  var k, cols = ['#e2402f', '#ff8a1f', '#ffd93d', '#4fc24a', '#2f8fe0', '#8a4fe0'], wig = [];
  /* rainbow curly wig, a ring of curls round the back and top */
  for (k = 0; k < 11; k++) { var a = 0.7 + k * 0.38, rr = 1.08 + (k % 2) * 0.12; wig.push([Math.cos(a) * rr, Math.sin(a) * rr, 0.36, cols[k % 6]]); }
  var o;
  c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = LW * 2;
  for (k = 0; k < wig.length; k++) { c.beginPath(); c.arc(wig[k][0], wig[k][1], wig[k][2], 0, TAU); c.stroke(); }
  ci(c, 0, 0, 1, '#ffffff');
  for (k = wig.length - 1; k >= 0; k--) { o = wig[k]; c.beginPath(); c.arc(o[0], o[1], o[2], 0, TAU); c.fillStyle = o[3]; c.fill(); c.beginPath(); c.arc(o[0] - 0.08, o[1] + 0.08, o[2] * 0.55, 3.3, 4.5); c.lineWidth = 0.06; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineCap = 'round'; c.stroke(); c.beginPath(); c.arc(o[0], o[1], o[2] * 0.55, 0.3, 1.2); c.lineWidth = 0.05; c.strokeStyle = 'rgba(0,0,0,0.22)'; c.stroke(); }
  ci(c, 0, 0, 1, '#ffffff');
  arc(c, 0.82, 3.3, 4.4, 0.1, '#d6dcea');
  /* face paint */
  po(c, [0.62, 0.52, 0.9, 0.2, 0.62, -0.1, 0.34, 0.2], '#2f8fe0', 0.1);                                                           // blue diamond round the eye
  po(c, [0.62, 0.46, 0.8, 0.2, 0.62, -0.04, 0.44, 0.2], '#6fc0ff', 0);
  ci(c, 0.62, 0.2, 0.1, OUT, 0); ci(c, 0.65, 0.24, 0.032, '#ffffff', 0);
  ln(c, [0.3, 0.66, 0.62, 0.78, 0.92, 0.6], 0.07, OUT);                                                                           // painted brow
  ci(c, 0.28, -0.12, 0.16, 'rgba(255,90,100,0.5)', 0);
  /* wide red smile */
  bl(c, [0.22, -0.28, 0.44, -0.62, 0.8, -0.8, 1.14, -0.58, 1.34, -0.2, 1.06, -0.42, 0.74, -0.5, 0.42, -0.42], '#e2402f', 0.12);
  po(c, [0.52, -0.5, 0.78, -0.6, 1.04, -0.5, 0.8, -0.52], '#ffffff', 0);
  ln(c, [0.36, -0.46, 0.5, -0.64, 0.82, -0.72], 0.045, '#ff8a7a');
  /* red ball nose */
  ci(c, 1.14, 0.04, 0.3, '#e2402f', 0.14); ci(c, 1.06, 0.14, 0.09, 'rgba(255,255,255,0.85)', 0); shadeCircle(c, 1.14, 0.04, 0.22, 'rgba(120,10,10,0.4)', 4.2, 5.4);
  /* little flower that squirts */
  var fx = 0.15, fy = 1.78;
  ln(c, [0.1, 1.2, fx, fy - 0.1], 0.08, OUT); ln(c, [0.1, 1.2, fx, fy - 0.1], 0.04, '#3f9a3a');
  for (k = 0; k < 6; k++) { var fa = k * TAU / 6; ci(c, fx + Math.cos(fa) * 0.2, fy + Math.sin(fa) * 0.2, 0.12, '#ffffff', 0.07); }
  ci(c, fx, fy, 0.1, '#ffd93d', 0.06);
  var sq = (t * 1.4) % 1;
  for (k = 0; k < 4; k++) { var f = ((sq + k * 0.25) % 1); c.globalAlpha = 1 - f * 0.8; ci(c, fx + 0.25 + f * 1.1, fy + 0.15 + f * 0.5 - f * f * 1.3, 0.06, '#7fd0ff', 0); }
  c.globalAlpha = 1;
};

HEAD.ace = function (c, t) {
  var k, w = Math.sin(t * 7) * 0.12, w2 = Math.sin(t * 7 + 1.4) * 0.14;
  /* long white scarf streaming back */
  var sc = [-0.6, -0.4, -1.4, -0.3 + w, -2.3, -0.5 + w2, -3.2, -0.2 + w, -3.15, -0.62 + w, -2.3, -0.92 + w2, -1.4, -0.84 + w * 0.6, -0.55, -0.9];
  bl(c, sc, '#f6f8fc');
  c.save(); blobPath(c, sc); c.clip();
  ln(c, [-0.5, -0.8, -1.4, -0.72 + w * 0.6, -2.3, -0.82 + w2, -3.2, -0.5 + w], 0.12, 'rgba(150,170,205,0.55)');
  ln(c, [-1.0, -0.2, -1.2, -1.0], 0.04, 'rgba(150,170,205,0.5)'); ln(c, [-1.9, -0.25, -2.0, -1.0], 0.04, 'rgba(150,170,205,0.5)');
  c.restore();
  bl(c, sc, null);
  for (k = 0; k < 3; k++) ln(c, [-3.1, -0.28 - k * 0.14 + w, -3.35, -0.2 - k * 0.15 + w], 0.05, '#dfe6f3');
  ci(c, 0, 0, 1, SKIN);
  /* windburnt cheek */
  ci(c, 0.42, -0.2, 0.26, 'rgba(255,90,90,0.5)', 0); ci(c, 0.42, -0.2, 0.14, 'rgba(255,90,90,0.4)', 0);
  ci(c, 1.02, 0.02, 0.14, '#e49a78', 0.1);
  eyeH(c, 0.66, 0.0, 0.1);
  ln(c, [0.5, -0.5, 0.78, -0.56, 0.96, -0.48], 0.07, OUT);
  /* leather cap with ear flaps */
  var cap = [-1.1, -0.35, -1.12, 0.6, -0.6, 1.2, 0.2, 1.3, 0.85, 0.95, 1.0, 0.35, 0.0, 0.35, -0.3, -0.5];
  bl(c, cap, '#8a5a34');
  c.save(); blobPath(c, cap); c.clip();
  el(c, 0.3, -0.3, 1.5, 0.8, 0, 'rgba(50,25,10,0.28)', 0);
  ln(c, [-0.9, 0.85, -0.3, 1.2, 0.5, 1.15], 0.1, 'rgba(255,210,160,0.4)');
  c.restore();
  bl(c, cap, null);
  ln(c, [-0.5, 1.2, -0.6, 0.2], 0.04, '#c99a68'); ln(c, [0.0, 1.28, -0.1, 0.4], 0.04, '#c99a68');                                   // stitched panel seams
  for (k = 0; k < 5; k++) { ln(c, [-0.55 + k * 0.02, 1.0 - k * 0.15, -0.5 + k * 0.02, 0.98 - k * 0.15], 0.03, OUT); }
  ln(c, [0.1, 0.4, 0.9, 0.38], 0.1, '#5a3a22');
  puff(c, [[0.12, 0.34, 0.13], [-0.02, 0.2, 0.13], [-0.12, 0.04, 0.14], [-0.2, -0.14, 0.14], [-0.28, -0.32, 0.13], [-0.4, -0.48, 0.12]], '#f4ead2', 0.07);     // fleece trim round the face opening
  ln(c, [0.1, 0.38, -0.02, 0.24], 0.04, '#ffffff'); ln(c, [-0.14, 0.0, -0.22, -0.16], 0.04, '#d9cdb0');
  /* chin strap and brass buckle */
  ln(c, [-0.5, -0.55, 0.1, -0.95, 0.6, -0.86], 0.09, OUT); ln(c, [-0.5, -0.55, 0.1, -0.95, 0.6, -0.86], 0.05, '#5a3a22');
  bl(c, [0.45, -0.78, 0.68, -0.76, 0.7, -0.98, 0.46, -1.0], '#e0b23a', 0.07); ln(c, [0.52, -0.86, 0.62, -0.86], 0.03, OUT);
  /* goggles up on the brow */
  ln(c, [-0.85, 0.52, 0.0, 0.62, 0.6, 0.6], 0.18, OUT); ln(c, [-0.85, 0.52, 0.0, 0.62, 0.6, 0.6], 0.1, '#3d2616');
  ci(c, 0.68, 0.6, 0.3, '#b8741f', 0.11); ci(c, 0.68, 0.6, 0.19, '#ffb54a', 0.05); ci(c, 0.68, 0.6, 0.19, null, 0.04);
  el(c, 0.66, 0.5, 0.25, 0.11, 0, 'rgba(160,70,0,0.35)', 0);
  ln(c, [0.58, 0.69, 0.7, 0.74], 0.055, 'rgba(255,255,255,0.9)');
  ln(c, [0.3, 0.2, 0.9, 0.18], 0.0, OUT);
};

HEAD.mime = function (c) {
  var k, p;
  ci(c, 0, 0, 1, '#ffffff');
  arc(c, 0.84, 3.4, 4.5, 0.14, '#d3dae8');
  ear(c, -0.2, 0.0, '#eef1f7');
  /* serious face */
  ln(c, [0.4, 0.46, 0.7, 0.54, 0.96, 0.44], 0.1, OUT);                                                                            // one raised brow
  bl(c, [0.9, 0.08, 1.12, 0.0, 1.05, -0.2, 0.88, -0.14], '#ffffff', 0.1);
  el(c, 0.66, 0.18, 0.13, 0.15, 0, OUT, 0); ci(c, 0.7, 0.23, 0.04, '#ffffff', 0);
  ln(c, [0.52, 0.34, 0.5, 0.42], 0.04, OUT); ln(c, [0.62, 0.34, 0.64, 0.44], 0.04, OUT);                                           // lashes
  /* painted tear */
  bl(c, [0.7, -0.02, 0.78, -0.2, 0.7, -0.3, 0.6, -0.2], OUT, 0);
  ci(c, 0.68, -0.06, 0.1, null, 0); po(c, [0.69, 0.0, 0.78, -0.2, 0.7, -0.3, 0.62, -0.2], OUT, 0);
  ci(c, 0.3, -0.12, 0.13, 'rgba(255,120,130,0.4)', 0);
  bl(c, [0.6, -0.54, 0.9, -0.5, 1.0, -0.6, 0.86, -0.72, 0.62, -0.68], '#e2402f', 0.09);                                           // small tight lips
  ln(c, [0.62, -0.6, 0.98, -0.6], 0.04, '#7a1f1a');
  /* black beret, pulled to one side */
  p = [-1.15, 0.5, -0.9, 1.35, -0.2, 1.7, 0.7, 1.35, 1.2, 0.85, 0.95, 0.5, 0.0, 0.62];
  bl(c, p, '#23262f');
  c.save(); blobPath(c, p); c.clip();
  ln(c, [-0.9, 1.2, -0.3, 1.55, 0.5, 1.3], 0.14, 'rgba(255,255,255,0.18)');
  for (k = 0; k < 6; k++) ln(c, [-0.7 + k * 0.28, 0.65, -0.55 + k * 0.28, 1.4], 0.03, 'rgba(255,255,255,0.1)');
  el(c, 0.5, 0.6, 1.2, 0.3, 0, 'rgba(0,0,0,0.45)', 0);
  c.restore();
  bl(c, p, null);
  ln(c, [-1.0, 0.56, 0.0, 0.7, 0.95, 0.56], 0.08, '#4a4f5c');
  ln(c, [-0.3, 1.66, -0.3, 1.9], 0.1, OUT); ln(c, [-0.3, 1.66, -0.3, 1.9], 0.05, '#23262f');
  /* little neck bow */
  bl(c, [0.1, -0.88, 0.5, -0.78, 0.6, -1.1, 0.1, -1.0, -0.2, -1.2, -0.3, -0.85], '#e2402f', 0.1);
  ci(c, 0.12, -0.95, 0.08, '#b02a20', 0.05);
};

/* ---------------------------- uncommon ---------------------------- */

HEAD.wrappy = function (c, t) {
  var k, d, n = 9, top = [], bot = [], pulse = 0.5 + 0.5 * Math.sin(t * 3.4);
  /* the loose end of a bandage, trailing and waving */
  for (k = 0; k <= n; k++) {
    var u = k / n, x = -0.8 - u * 1.9, base = 0.4 - 0.2 * u + Math.sin(t * 7 - u * 5) * 0.14 * (0.25 + u), hw = 0.2 * (1 - 0.3 * u);
    top.push(x, base + hw); bot.unshift(x, base - hw);
    if (k === n) { top.push(x - 0.16, base + hw * 0.5, x - 0.04, base + 0.0, x - 0.18, base - hw * 0.5); }
  }
  po(c, top.concat(bot), '#eadfbd', 0.14);
  ln(c, [-0.9, 0.36, -1.7, 0.3 + Math.sin(t * 7 - 2.5) * 0.04, -2.5, 0.2 + Math.sin(t * 7 - 4.2) * 0.07], 0.035, '#a8985f');
  ln(c, [-1.2, 0.58, -1.7, 0.5 + Math.sin(t * 7 - 2.5) * 0.05], 0.03, 'rgba(255,255,240,0.8)');
  /* layers of wrapping, each lapping over the one below */
  ci(c, 0, 0, 1, '#cdbf94');
  c.save(); c.beginPath(); c.arc(0, 0, 0.98, 0, TAU); c.clip();
  function layer(ang, off, w, col) {
    c.save(); c.rotate(ang);
    c.fillStyle = col; c.fillRect(-1.6, off - w / 2, 3.2, w);
    c.fillStyle = 'rgba(50,38,16,0.55)'; c.fillRect(-1.6, off - w / 2 - 0.08, 3.2, 0.08);
    c.fillStyle = 'rgba(255,252,232,0.55)'; c.fillRect(-1.6, off + w / 2 - 0.07, 3.2, 0.05);
    c.fillStyle = 'rgba(90,70,35,0.5)'; c.fillRect(-1.6, off - w / 2, 3.2, 0.035);
    c.restore();
  }
  var A1 = '#f1e7c7', A2 = '#d6c698', A3 = '#e6d9b0', A4 = '#c4b280';
  [[0.55, -1.1, 0.5, A2], [0.3, -0.7, 0.46, A1], [0.62, -0.28, 0.5, A3], [0.22, 0.14, 0.44, A4], [0.5, 0.55, 0.5, A1], [0.28, 1.0, 0.5, A3], [0.6, 1.4, 0.5, A2],
   [-0.42, 0.7, 0.36, A3], [-0.5, -0.1, 0.38, A1], [-0.34, -0.62, 0.36, A2]].forEach(function (L) { layer(L[0], L[1], L[2], L[3]); });
  el(c, -0.5, -0.95, 1.6, 0.55, 0, 'rgba(60,42,16,0.35)', 0);
  el(c, -0.2, 0.75, 0.18, 0.09, 0.5, 'rgba(110,70,30,0.3)', 0); el(c, 0.1, -0.7, 0.14, 0.07, -0.4, 'rgba(110,70,30,0.28)', 0); el(c, -0.65, -0.2, 0.1, 0.18, 0.2, 'rgba(110,70,30,0.22)', 0);       // grubby stains
  c.restore();
  ci(c, 0, 0, 1, null);
  arc(c, 0.86, 1.9, 2.8, 0.07, 'rgba(255,252,235,0.85)');
  /* the gap, with two glowing eyes in it */
  bl(c, [0.02, 0.12, 0.12, 0.5, 0.7, 0.58, 1.1, 0.4, 1.08, -0.1, 0.6, -0.2, 0.1, -0.1], '#1a1812', 0.1);
  var ga = (0.2 + 0.16 * pulse).toFixed(2);
  ci(c, 0.38, 0.18, 0.27, 'rgba(255,226,61,' + ga + ')', 0); ci(c, 0.84, 0.15, 0.23, 'rgba(255,226,61,' + ga + ')', 0);
  el(c, 0.38, 0.18, 0.16, 0.12, 0.14, '#ffe23d', 0); el(c, 0.84, 0.15, 0.14, 0.11, -0.1, '#ffe23d', 0);
  el(c, 0.4, 0.2, 0.08, 0.06, 0, '#fffbd0', 0); el(c, 0.85, 0.17, 0.07, 0.055, 0, '#fffbd0', 0);
  ln(c, [0.38, 0.1, 0.38, 0.27], 0.03, '#8a6a10'); ln(c, [0.84, 0.08, 0.84, 0.23], 0.03, '#8a6a10');
  /* frayed bits flapping over the gap, and a wrap across the jaw */
  po(c, [0.0, 0.62, 0.52, 0.56, 0.58, 0.44, 0.44, 0.36, 0.3, 0.46, 0.14, 0.38], '#eadfbd', 0.08);
  po(c, [0.62, -0.2, 1.08, -0.14, 1.18, -0.32, 0.96, -0.42, 0.78, -0.3], '#d3c394', 0.08);
  ln(c, [0.3, 0.52, 0.4, 0.42], 0.03, '#a8985f');
};

HEAD.croak = function (c, t) {
  var G = '#58b848', GD = '#3a8a3a', BELLY = '#eef59a', br = 0.5 + 0.5 * Math.sin(t * 3.2);
  var blink = (t % 3.2) < 0.13;
  /* throat pouch, swelling with each breath */
  var pr = 0.3 + 0.1 * br;
  bl(c, [0.1, -0.6, 0.95, -0.55, 1.3, -0.9 - pr * 0.4, 0.95, -1.2 - pr, 0.35, -1.25 - pr, -0.05, -0.9], BELLY);
  ln(c, [0.2, -0.85, 0.5, -1.05 - pr * 0.6, 0.95, -1.0 - pr * 0.4], 0.04, 'rgba(120,150,40,0.55)'); ln(c, [0.1, -1.0, 0.4, -1.2 - pr * 0.8], 0.03, 'rgba(120,150,40,0.45)');
  ln(c, [0.85, -0.7, 1.12, -0.85], 0.07, 'rgba(255,255,255,0.7)');
  /* head, wide and flat */
  var hd = [-1.05, 0.0, -0.9, 0.7, 0.1, 0.98, 1.05, 0.72, 1.5, 0.15, 1.4, -0.4, 0.6, -0.82, -0.5, -0.85];
  bl(c, hd, G);
  c.save(); blobPath(c, hd); c.clip();
  el(c, 0.55, -0.62, 1.5, 0.42, -0.1, BELLY, 0);                                                                       // pale jaw
  el(c, -0.7, -0.4, 1.0, 0.9, 0, 'rgba(20,80,30,0.3)', 0);
  [[-0.5, 0.35, 0.14], [-0.15, 0.6, 0.1], [0.5, 0.52, 0.09], [-0.78, -0.05, 0.1], [0.05, 0.1, 0.08]].forEach(function (s) { ci(c, s[0], s[1], s[2], GD, 0); ci(c, s[0] - s[2] * 0.3, s[1] + s[2] * 0.35, s[2] * 0.3, 'rgba(255,255,255,0.45)', 0); });
  c.restore();
  bl(c, hd, null);
  ln(c, [1.5, 0.0, 1.0, -0.3, 0.3, -0.4, -0.35, -0.28, -0.75, 0.02, -0.82, 0.16], 0.08, OUT);                          // the wide smile
  ci(c, 1.28, 0.28, 0.05, OUT, 0);                                                                                      // nostril
  ci(c, 0.2, -0.05, 0.1, 'rgba(255,140,120,0.4)', 0);
  /* bulging eyes up on top */
  function bulge(x, y, r) {
    ci(c, x, y, r, G, 0.15);
    ci(c, x + r * 0.15, y - r * 0.05, r * 0.66, '#f2c230', 0.07);
    el(c, x + r * 0.15, y - r * 0.05, r * 0.52, r * 0.14, 0, OUT, 0);                                                   // sideways pupil
    ci(c, x + r * 0.0, y + r * 0.2, r * 0.13, '#ffffff', 0);
    c.save(); c.beginPath(); c.arc(x, y, r * 0.92, 0, TAU); c.clip();
    el(c, x, y + r * 1.2, r * 1.2, r * (blink ? 1.75 : 0.58), 0, GD, 0);                                               // the lid
    c.restore();
    ln(c, [x - r * 0.9, y + r * (blink ? 0.0 : 0.5), x + r * 0.9, y + r * (blink ? 0.0 : 0.5)], 0.05, '#2a6a30');
    c.beginPath(); c.arc(x, y, r * 0.8, 3.3, 4.3); c.lineWidth = 0.05; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke();
  }
  bulge(-0.4, 0.98, 0.34); bulge(0.3, 1.02, 0.42);
  arc(c, 0.86, 2.0, 2.7, 0.06, 'rgba(255,255,255,0.65)'); ci(c, -0.62, 0.55, 0.045, '#ffffff', 0);
};

HEAD.inky = function (c, t) {
  var P = '#b04a8a', PD = '#7a2f6a', PL = '#e88ac0';
  /* tentacles hanging off the chin like a beard */
  function tent(x0, y0, len, dir, ph, w0) {
    var n = 8, L = [], R = [], u, i, px, w;
    for (i = 0; i <= n; i++) {
      u = i / n; px = x0 + dir * Math.pow(u, 2.2) * 0.8 + Math.sin(t * 2.2 + ph + u * 3) * 0.1 * u;
      w = w0 * (1 - u * 0.78); L.push(px - w, y0 - u * len + Math.pow(u, 3) * 0.3); R.unshift(px + w, y0 - u * len + Math.pow(u, 3) * 0.3);
    }
    po(c, L.concat(R), P, 0.12);
    for (i = 1; i <= 3; i++) { u = i / 4.2; px = x0 + dir * Math.pow(u, 2.2) * 0.8 + Math.sin(t * 2.2 + ph + u * 3) * 0.1 * u; ci(c, px, y0 - u * len + Math.pow(u, 3) * 0.3, 0.05 * (1 - u * 0.5), PL, 0.025); }
  }
  tent(-0.2, -0.65, 1.0, -1, 0.0, 0.3); tent(0.95, -0.7, 0.85, 1, 2.1, 0.25); tent(0.4, -0.78, 1.15, -1, 1.0, 0.28);
  /* big bulb of a mantle */
  var man = [-1.35, 0.1, -1.45, 1.0, -0.85, 1.75, 0.1, 1.72, 0.85, 1.05, 1.1, 0.3, 0.85, -0.5, -0.2, -0.95, -1.0, -0.7];
  bl(c, man, P);
  c.save(); blobPath(c, man); c.clip();
  el(c, 0.0, -0.9, 2.0, 0.8, 0, 'rgba(70,20,70,0.45)', 0);
  [[-0.85, 1.35, 0.15], [-0.3, 1.5, 0.1], [-1.05, 0.7, 0.11], [-0.55, 0.95, 0.08], [0.1, 1.15, 0.12], [-0.2, 0.55, 0.07], [0.5, 1.5, 0.07], [-0.95, 0.2, 0.07]].forEach(function (s) { ci(c, s[0], s[1], s[2], PL, 0); ci(c, s[0] - s[2] * 0.3, s[1] + s[2] * 0.3, s[2] * 0.35, 'rgba(255,255,255,0.55)', 0); });
  c.restore();
  bl(c, man, null);
  ln(c, [-1.15, 0.75, -1.1, 1.35, -0.7, 1.7], 0.1, 'rgba(255,200,235,0.7)'); ci(c, -0.45, 1.78, 0.05, 'rgba(255,255,255,0.9)', 0);
  /* two big eyes with sideways pupils */
  var blink = (t % 4) < 0.12;
  function oeye(x, y, r) {
    ci(c, x, y, r, '#f7f1de', 0.13);
    c.save(); c.beginPath(); c.arc(x, y, r * 0.92, 0, TAU); c.clip();
    ci(c, x + r * 0.2, y - r * 0.05, r * 0.62, '#e8a21f', 0);
    el(c, x + r * 0.2, y - r * 0.05, r * 0.6, r * 0.2, 0, OUT, 0);
    ci(c, x - r * 0.05, y + r * 0.25, r * 0.15, '#ffffff', 0);
    el(c, x, y + r * 1.15, r * 1.3, r * (blink ? 1.7 : 0.55), 0, PD, 0);
    c.restore();
    ln(c, [x - r * 0.9, y + r * (blink ? 0.0 : 0.6), x + r * 0.95, y + r * (blink ? 0.0 : 0.6)], 0.05, OUT);
  }
  oeye(0.36, 0.1, 0.32); oeye(0.96, 0.02, 0.24);
  ci(c, 0.3, -0.38, 0.12, 'rgba(255,150,200,0.45)', 0);
  ln(c, [0.62, -0.5, 0.82, -0.56, 1.0, -0.46], 0.07, OUT);
};

HEAD.mo = function (c) {
  var SK = '#e3ad84', face = [-1.0, 0.1, -0.88, 0.85, 0.1, 1.02, 0.95, 0.78, 1.22, 0.1, 1.2, -0.5, 0.65, -1.05, -0.4, -1.08, -1.0, -0.6];
  /* topknot, folded over like a little leaf */
  bl(c, [-0.1, 0.95, -0.15, 1.35, 0.35, 1.58, 0.98, 1.5, 1.12, 1.2, 0.7, 1.0], '#23262f');
  ln(c, [0.05, 1.28, 0.45, 1.5, 0.9, 1.42], 0.055, '#6a7080'); ln(c, [0.1, 1.08, 0.65, 1.15, 1.0, 1.2], 0.04, '#0c0e14');
  /* a big round face with jowls */
  bl(c, face, SK);
  c.save(); blobPath(c, face); c.clip();
  el(c, -0.1, -1.0, 1.8, 0.6, 0, 'rgba(150,80,40,0.32)', 0);
  ci(c, 0.55, -0.35, 0.42, 'rgba(255,205,170,0.35)', 0);
  c.restore();
  bl(c, face, null);
  ear(c, -0.5, 0.0, '#d49a70');
  /* slicked hair, pulled back */
  var hair = [-1.08, 0.1, -1.0, 0.85, 0.05, 1.12, 0.95, 0.82, 1.02, 0.6, 0.35, 0.68, -0.35, 0.38];
  bl(c, hair, '#23262f');
  ln(c, [-0.85, 0.75, -0.3, 1.0, 0.45, 0.98], 0.07, '#6a7080');
  /* paper tie round the knot, and its tassel */
  ln(c, [-0.02, 0.96, 0.5, 1.06, 1.0, 1.0], 0.22, OUT); ln(c, [-0.02, 0.96, 0.5, 1.06, 1.0, 1.0], 0.12, '#ffffff'); ln(c, [0.3, 0.98, 0.34, 1.1], 0.04, '#d93a3a'); ln(c, [0.7, 1.02, 0.74, 1.0], 0.04, '#d93a3a');
  ln(c, [1.0, 0.94, 1.18, 0.62], 0.07, '#c4392f'); ci(c, 1.2, 0.54, 0.09, '#e2402f', 0.06); ln(c, [1.12, 0.48, 1.1, 0.3], 0.04, '#e2402f'); ln(c, [1.2, 0.46, 1.22, 0.26], 0.04, '#e2402f'); ln(c, [1.28, 0.48, 1.32, 0.3], 0.04, '#e2402f');
  /* fierce little face */
  ci(c, 0.4, -0.12, 0.3, 'rgba(240,120,110,0.55)', 0);
  ln(c, [0.3, 0.6, 0.72, 0.44, 1.1, 0.2], 0.2, OUT);                                                                      // heavy angry brow
  ln(c, [0.4, 0.6, 0.8, 0.44], 0.05, '#5a6070');
  el(c, 0.74, 0.16, 0.13, 0.07, 0.15, '#ffffff', 0.05); ci(c, 0.77, 0.16, 0.05, OUT, 0);
  ln(c, [0.5, 0.0, 0.7, 0.0], 0.05, 'rgba(120,60,30,0.6)');
  bl(c, [0.98, -0.02, 1.26, -0.08, 1.24, -0.34, 0.96, -0.3], '#d99a70', 0.1);                                             // wide flat nose
  ci(c, 1.14, -0.2, 0.025, OUT, 0);
  ln(c, [0.5, -0.62, 0.8, -0.72, 1.06, -0.6], 0.09, OUT);                                                                 // grumpy mouth
  ln(c, [-0.55, -1.0, 0.2, -1.12, 0.95, -0.85], 0.045, 'rgba(120,60,30,0.55)');                                           // second chin
  arc(c, 0.9, 3.5, 4.3, 0.06, 'rgba(255,225,190,0.6)');
};

HEAD.slice = function (c, t) {
  var k, p;
  /* steam, wisping off the slice */
  for (k = 0; k < 3; k++) {
    var f = (t * 0.5 + k * 0.33) % 1, x0 = -0.6 + k * 0.6, sw = Math.sin(t * 2 + k * 2) * 0.14;
    c.globalAlpha = Math.sin(f * Math.PI) * 0.8;
    c.beginPath(); c.moveTo(x0, 1.9 + f * 0.2); c.bezierCurveTo(x0 + 0.2 + sw, 2.2 + f * 0.4, x0 - 0.2 + sw, 2.5 + f * 0.4, x0 + sw, 2.9 + f * 0.5); c.lineWidth = 0.1; c.strokeStyle = '#ffffff'; c.lineCap = 'round'; c.stroke();
  }
  c.globalAlpha = 1;
  /* the slice: sauce edge, then cheese, tip pointing down */
  po(c, [-1.3, 0.9, 1.3, 0.9, 0.12, -1.86], '#e8402f');
  p = [-1.1, 0.85, 1.1, 0.85, 0.66, -0.2, 0.3, -1.0, 0.12, -1.5, -0.1, -1.0, -0.5, -0.1];
  po(c, p, '#ffc83a', 0.1);
  c.save(); c.beginPath(); c.moveTo(p[0], p[1]); for (k = 2; k < p.length; k += 2) c.lineTo(p[k], p[k + 1]); c.closePath(); c.clip();
  el(c, 0.9, -0.7, 0.7, 1.4, 0.3, 'rgba(210,120,20,0.4)', 0);
  [[-0.6, -0.05, 0.14], [0.25, -0.5, 0.1], [0.78, 0.5, 0.12], [-0.25, 0.6, 0.09]].forEach(function (s) { ci(c, s[0], s[1], s[2], '#e49a2a', 0); ci(c, s[0] - 0.03, s[1] + 0.03, s[2] * 0.4, 'rgba(255,230,140,0.7)', 0); });
  ln(c, [-0.95, 0.7, -0.7, 0.3], 0.07, 'rgba(255,245,180,0.75)');
  c.restore();
  po(c, p, null, 0.1);
  /* melted cheese dripping over the edges */
  bl(c, [0.58, -0.32, 0.86, -0.3, 0.84, -0.7, 0.74, -0.86, 0.62, -0.7], '#ffc83a', 0.12);
  bl(c, [-0.36, -0.42, -0.62, -0.4, -0.66, -0.78, -0.52, -0.98, -0.4, -0.76], '#ffc83a', 0.12);
  bl(c, [0.05, -1.3, 0.22, -1.3, 0.24, -1.74, 0.14, -1.84, 0.02, -1.66], '#ffc83a', 0.12);
  ln(c, [0.76, -0.4, 0.77, -0.6], 0.04, 'rgba(255,245,180,0.85)'); ln(c, [-0.56, -0.55, -0.57, -0.72], 0.04, 'rgba(255,245,180,0.85)');
  /* toppings */
  ci(c, -0.55, 0.34, 0.27, '#c4302b', 0.1); ci(c, -0.61, 0.4, 0.04, '#7a1a18', 0); ci(c, -0.47, 0.26, 0.035, '#7a1a18', 0); ci(c, -0.65, 0.24, 0.03, '#7a1a18', 0); ln(c, [-0.71, 0.46, -0.61, 0.52], 0.04, 'rgba(255,170,150,0.7)');
  ci(c, 0.66, -0.3, 0.23, '#c4302b', 0.1); ci(c, 0.6, -0.25, 0.04, '#7a1a18', 0); ci(c, 0.74, -0.35, 0.035, '#7a1a18', 0); ln(c, [0.54, -0.15, 0.62, -0.09], 0.04, 'rgba(255,170,150,0.7)');
  ci(c, -0.15, -0.55, 0.14, '#2a2d35', 0.08); ci(c, -0.15, -0.55, 0.05, '#ffc83a', 0);
  bl(c, [0.85, 0.55, 1.05, 0.7, 1.07, 0.55, 0.93, 0.42], '#4aa650', 0.07); ln(c, [0.87, 0.55, 1.01, 0.58], 0.025, '#2a7a30');
  /* a cheerful face in the cheese */
  ci(c, 0.2, 0.4, 0.1, OUT, 0); ci(c, 0.23, 0.44, 0.032, '#ffffff', 0); ci(c, 0.62, 0.42, 0.1, OUT, 0); ci(c, 0.65, 0.46, 0.032, '#ffffff', 0);
  ln(c, [0.18, 0.12, 0.34, -0.02, 0.5, 0.02, 0.66, 0.16], 0.085, OUT);
  ci(c, 0.04, 0.2, 0.1, 'rgba(255,100,80,0.5)', 0); ci(c, 0.8, 0.22, 0.08, 'rgba(255,100,80,0.5)', 0);
  /* crust: a thick curved roll along the top */
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(-1.2, 0.78); c.quadraticCurveTo(0.05, 1.95, 1.3, 0.78); c.lineWidth = 0.68; c.strokeStyle = OUT; c.stroke();
  c.lineWidth = 0.46; c.strokeStyle = '#e0a458'; c.stroke();
  c.beginPath(); c.moveTo(-1.2, 0.68); c.quadraticCurveTo(0.05, 1.82, 1.3, 0.68); c.lineWidth = 0.14; c.strokeStyle = 'rgba(130,70,20,0.5)'; c.stroke();
  c.beginPath(); c.moveTo(-1.1, 0.92); c.quadraticCurveTo(0.05, 2.1, 1.2, 0.92); c.lineWidth = 0.1; c.strokeStyle = 'rgba(255,232,180,0.75)'; c.stroke();
  [[-0.7, 1.06, 0.07], [0.05, 1.3, 0.06], [0.8, 1.04, 0.07], [0.4, 1.2, 0.045]].forEach(function (s) { ci(c, s[0], s[1], s[2], '#b87028', 0); });
};

HEAD.yeti = function (c, t) {
  var k, R = Math.PI / 180;
  /* shaggy locks of fur hanging off the head and down the back */
  function lock(x, y, deg, len, w, col) {
    var ang = deg * R, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, tx = x + dx * len, ty = y + dy * len;
    c.beginPath(); c.moveTo(x - nx * w, y - ny * w);
    c.quadraticCurveTo(x + dx * len * 0.6 - nx * w * 1.25, y + dy * len * 0.6 - ny * w * 1.25, tx + dx * 0.04, ty + dy * 0.04);
    c.quadraticCurveTo(x + dx * len * 0.4 + nx * w * 1.0, y + dy * len * 0.4 + ny * w * 1.0, x + nx * w, y + ny * w);
    c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 0.15; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke();
    ln(c, [x, y, x + dx * len * 0.5, y + dy * len * 0.5, tx - dx * 0.15, ty - dy * 0.15], 0.035, 'rgba(120,150,200,0.7)');
  }
  var L = '#e8f1fb', D = '#d3e2f4', ring = [], i, a;
  lock(-1.0, 0.0, 205, 1.3, 0.3, D); lock(-0.85, -0.45, 228, 1.3, 0.3, L); lock(-0.5, -0.8, 250, 1.25, 0.3, D); lock(-0.05, -0.98, 268, 1.15, 0.28, L);
  /* a lumpy mane of fluff round the head, fuller round the back and top */
  for (i = 0; i < 12; i++) { a = 0.35 + i * TAU / 12; var back = 0.5 - 0.5 * Math.cos(a - 0.2); ring.push([Math.cos(a) * (0.84 + 0.12 * back), Math.sin(a) * (0.84 + 0.12 * back), 0.38 + 0.1 * back + 0.03 * Math.sin(i * 2.3)]); }
  ring.push([0, 0, 0.95]);
  puff(c, ring, L);
  c.save(); c.beginPath(); ring.forEach(function (q) { c.moveTo(q[0] + q[2], q[1]); c.arc(q[0], q[1], q[2], 0, TAU); }); c.clip();
  el(c, -0.3, -1.15, 2.4, 0.8, 0, 'rgba(120,150,200,0.5)', 0);
  c.restore();
  for (k = 0; k < ring.length - 1; k++) { var q = ring[k], an = Math.atan2(q[1], q[0]); ln(c, [Math.cos(an) * 0.62, Math.sin(an) * 0.62, Math.cos(an + 0.2) * 0.98, Math.sin(an + 0.2) * 0.98, Math.cos(an + 0.14) * (q[2] + 0.86), Math.sin(an + 0.14) * (q[2] + 0.86)], 0.045, k % 2 ? '#a8c0e0' : '#ffffff'); }
  /* fringe flopping over the brow */
  po(c, [0.08, 0.66, 0.38, 0.72, 0.26, 0.28], L, 0.1); po(c, [0.44, 0.76, 0.76, 0.76, 0.6, 0.34], L, 0.1); po(c, [0.82, 0.66, 1.1, 0.58, 0.96, 0.3], L, 0.1);
  /* dark face patch */
  bl(c, [0.0, 0.36, 0.5, 0.72, 1.0, 0.5, 1.3, 0.0, 1.14, -0.72, 0.6, -1.0, 0.1, -0.72, -0.05, -0.1], '#46567a', 0.14);
  el(c, 0.62, 0.34, 0.55, 0.12, 0, 'rgba(255,255,255,0.14)', 0);
  /* goofy eyes */
  ci(c, 0.46, 0.2, 0.22, '#ffffff', 0.09); ci(c, 0.52, 0.28, 0.085, OUT, 0); ci(c, 0.55, 0.32, 0.028, '#ffffff', 0);
  ci(c, 0.95, 0.18, 0.18, '#ffffff', 0.09); ci(c, 0.9, 0.12, 0.07, OUT, 0); ci(c, 0.92, 0.16, 0.024, '#ffffff', 0);
  /* wide goofy mouth and fangs */
  bl(c, [0.26, -0.2, 0.74, -0.3, 1.18, -0.2, 1.1, -0.8, 0.7, -0.98, 0.34, -0.72], '#2a1620', 0.1);
  el(c, 0.7, -0.78, 0.25, 0.1, 0, '#ff7a98', 0);
  po(c, [0.34, -0.24, 0.44, -0.64, 0.6, -0.27], '#ffffff', 0.08); po(c, [0.84, -0.28, 0.94, -0.56, 1.06, -0.24], '#ffffff', 0.08);
  ln(c, [0.4, -0.3, 0.44, -0.5], 0.03, '#cfd8e8');
  /* icicles hanging from the chin fur */
  [[0.0, -1.0, 0.34], [0.32, -1.06, 0.52], [0.66, -1.04, 0.4], [-0.28, -0.98, 0.28]].forEach(function (s) {
    po(c, [s[0] - 0.1, s[1], s[0] + 0.1, s[1], s[0] + 0.01, s[1] - s[2] - 0.12], '#9fd8ff', 0.07);
    ln(c, [s[0] - 0.03, s[1] - 0.05, s[0] - 0.01, s[1] - s[2] * 0.55], 0.035, '#ffffff');
  });
};

HEAD.spore = function (c, t) {
  var k;
  /* stalk face */
  ci(c, 0, 0, 1, '#f1e6cc');
  c.save(); c.beginPath(); c.arc(0, 0, 0.98, 0, TAU); c.clip(); el(c, -0.3, -0.7, 1.4, 0.7, 0, 'rgba(160,120,70,0.32)', 0); c.restore();
  arc(c, 0.84, 3.5, 4.3, 0.1, 'rgba(255,255,255,0.7)');
  ln(c, [-0.5, -0.3, -0.52, -0.7], 0.05, 'rgba(160,120,70,0.5)'); ln(c, [0.2, -0.5, 0.2, -0.9], 0.05, 'rgba(160,120,70,0.4)');
  bl(c, [-0.9, -0.62, 0.0, -0.8, 0.9, -0.62, 0.6, -0.95, -0.5, -0.98], '#e0cfae', 0.12);                                 // the ring on the stalk
  ci(c, 0.62, 0.0, 0.1, OUT, 0); ci(c, 0.65, 0.04, 0.03, '#ffffff', 0); ci(c, 0.98, -0.04, 0.085, OUT, 0); ci(c, 1.0, 0.0, 0.028, '#ffffff', 0);
  ln(c, [0.66, -0.34, 0.8, -0.4, 0.94, -0.34], 0.07, OUT);
  ci(c, 0.42, -0.2, 0.15, 'rgba(255,120,120,0.45)', 0);
  /* the cap: gills underneath, then the dome */
  el(c, 0.05, 0.62, 1.6, 0.26, -0.06, '#ecd3ad', 0.15);
  c.save(); c.beginPath(); c.ellipse(0.05, 0.62, 1.55, 0.22, -0.06, 0, TAU); c.clip();
  for (k = -7; k <= 7; k++) ln(c, [0.05 + k * 0.2, 0.62, 0.05 + k * 0.24, 0.3], 0.035, '#b8906a');
  el(c, 0.05, 0.4, 1.6, 0.14, 0, 'rgba(90,50,20,0.28)', 0);
  c.restore();
  var cap = [-1.65, 0.62, -1.5, 1.4, -0.5, 2.15, 0.7, 2.1, 1.55, 1.35, 1.7, 0.66, 0.0, 0.8];
  bl(c, cap, '#d93a3a');
  c.save(); blobPath(c, cap); c.clip();
  el(c, 0.9, 1.1, 1.2, 0.9, 0.2, 'rgba(110,10,25,0.45)', 0);
  ln(c, [-1.4, 1.1, -1.0, 1.75, -0.2, 2.0], 0.14, 'rgba(255,170,160,0.65)');
  [[-0.95, 1.4, 0.22], [0.1, 1.72, 0.26], [0.95, 1.38, 0.2], [-0.2, 1.1, 0.13], [0.55, 1.0, 0.1], [1.35, 1.0, 0.1], [-1.4, 0.95, 0.09]].forEach(function (s) {
    ci(c, s[0], s[1], s[2], '#ffffff', 0.07); ci(c, s[0] + s[2] * 0.25, s[1] - s[2] * 0.3, s[2] * 0.5, 'rgba(180,170,200,0.4)', 0);
  });
  c.restore();
  bl(c, cap, null);
  /* spores drifting off the cap */
  for (k = 0; k < 7; k++) {
    var f = (t * 0.3 + k * 0.143) % 1, sx = -1.0 + k * 0.38 + Math.sin(t * 1.8 + k * 1.7) * 0.2, sy = 2.1 + f * 1.5;
    c.globalAlpha = Math.sin(f * Math.PI) * 0.95;
    ci(c, sx, sy, 0.05 + 0.04 * ((k * 5) % 3) / 2, k % 2 ? '#d8f27a' : '#f4f9c8', 0.03);
  }
  c.globalAlpha = 1;
};

HEAD.buzz = function (c, t) {
  var k, p, hat = [-0.8, 0.7, -0.78, 1.42, 0.0, 1.62, 0.8, 1.42, 0.82, 0.7];
  ci(c, 0, 0, 1, SKIN);
  arc(c, 0.84, 3.4, 4.4, 0.1, 'rgba(160,90,50,0.3)');
  ear(c, -0.2, 0.0, '#dba27c');
  ci(c, 1.04, -0.02, 0.13, '#e49a78', 0.1);
  eyeH(c, 0.64, 0.1, 0.11);
  ln(c, [0.42, 0.32, 0.9, 0.28], 0.09, '#6b4528');
  ln(c, [0.56, -0.44, 0.78, -0.5, 0.96, -0.4], 0.08, OUT);
  ci(c, 0.38, -0.2, 0.15, 'rgba(255,110,110,0.4)', 0);
  /* the veil: a mesh hanging off the brim */
  p = [-1.35, 0.7, 1.45, 0.7, 1.3, -1.0, 0.4, -1.35, -0.7, -1.3, -1.2, -1.0];
  bl(c, p, 'rgba(250,250,240,0.14)', 0.12);
  c.save(); blobPath(c, p); c.clip();
  c.beginPath();
  for (k = -7; k <= 7; k++) { c.moveTo(k * 0.2 + 0.05, 0.8); c.lineTo(k * 0.2 + 0.05, -1.5); }
  for (k = 0; k < 13; k++) { c.moveTo(-1.5, 0.7 - k * 0.17); c.lineTo(1.6, 0.7 - k * 0.17); }
  c.lineWidth = 0.024; c.strokeStyle = 'rgba(30,32,38,0.34)'; c.stroke();
  ln(c, [-1.1, 0.55, -1.0, -0.7], 0.05, 'rgba(255,255,255,0.35)');
  c.restore();
  bl(c, p, null);
  ln(c, [-0.95, -1.12, 0.0, -1.3, 1.1, -1.02], 0.1, OUT); ln(c, [-0.95, -1.12, 0.0, -1.3, 1.1, -1.02], 0.05, '#d9a32a');         // cord gathering it in
  /* wide straw hat */
  el(c, 0.05, 0.66, 1.95, 0.34, -0.04, '#e8c46a');
  c.save(); c.beginPath(); c.ellipse(0.05, 0.66, 1.9, 0.3, -0.04, 0, TAU); c.clip();
  for (k = -6; k <= 6; k++) ln(c, [k * 0.3, 0.9, k * 0.3 + 0.1, 0.4], 0.03, 'rgba(150,100,30,0.45)');
  el(c, 0.2, 0.46, 2.0, 0.12, 0, 'rgba(120,70,10,0.3)', 0);
  c.restore();
  bl(c, hat, '#f0d27c');
  c.save(); blobPath(c, hat); c.clip();
  for (k = 0; k < 5; k++) ln(c, [-0.9, 0.9 + k * 0.18, 0.9, 0.9 + k * 0.18], 0.03, 'rgba(150,100,30,0.4)');
  ln(c, [-0.6, 1.3, -0.3, 1.52], 0.1, 'rgba(255,250,200,0.6)');
  el(c, 0.5, 0.9, 0.6, 0.8, 0, 'rgba(150,100,30,0.25)', 0);
  c.restore();
  bl(c, hat, null);
  ln(c, [-0.82, 0.86, 0.84, 0.86], 0.14, OUT); ln(c, [-0.82, 0.86, 0.84, 0.86], 0.08, '#2a2d35');
  for (k = 0; k < 4; k++) ln(c, [-0.6 + k * 0.4, 0.86, -0.5 + k * 0.4, 0.86], 0.05, '#ffd23d');
  /* bees on a lazy loop round the head */
  function bee(x, y, ph) {
    var fl = Math.sin(t * 30 + ph) * 0.5 + 0.5;
    c.save(); c.translate(x, y); c.scale(0.9, 0.9);
    el(c, -0.06, 0.12, 0.09, 0.05 + 0.07 * fl, 0.5, 'rgba(235,245,255,0.85)', 0.03); el(c, 0.05, 0.12, 0.09, 0.05 + 0.07 * fl, -0.5, 'rgba(235,245,255,0.85)', 0.03);
    el(c, 0, 0, 0.17, 0.11, 0, '#ffd23d', 0.07);
    ln(c, [-0.03, 0.07, -0.03, -0.07], 0.045, OUT); ln(c, [0.06, 0.07, 0.06, -0.07], 0.045, OUT);
    ci(c, 0.17, 0.0, 0.065, OUT, 0); po(c, [-0.17, 0.0, -0.26, -0.02, -0.17, -0.04], OUT, 0);
    c.restore();
  }
  bee(0.1 + 1.8 * Math.cos(t * 1.3), 0.5 + 0.8 * Math.sin(t * 2.1 + 1), 0);
  bee(-0.2 + 1.7 * Math.cos(t * 1.1 + 2.3), -0.1 + 0.9 * Math.sin(t * 1.7 + 3), 1.7);
  bee(0.6 + 1.5 * Math.cos(t * 1.7 + 4.2), 1.1 + 0.5 * Math.sin(t * 2.4 + 5), 3.1);
};

HEAD.bandit = function (c, t) {
  var k, p, w = Math.sin(t * 8) * 0.12, w2 = Math.sin(t * 8 + 1.5) * 0.14;
  /* bandana tails flapping behind */
  bl(c, [-0.8, -0.2, -1.5, -0.1 + w, -2.1, -0.32 + w2, -1.95, -0.5 + w2, -1.4, -0.42 + w, -0.78, -0.4], '#d93a3a');
  bl(c, [-0.8, -0.4, -1.4, -0.62 - w, -1.95, -0.95 - w2, -1.78, -1.15 - w2, -1.3, -0.9 - w, -0.74, -0.58], '#b02a2a');
  ci(c, -1.5, -0.12 + w * 0.8, 0.03, '#ffffff', 0); ci(c, -1.7, -0.3 + w2, 0.03, '#ffffff', 0); ci(c, -1.3, -0.78 - w, 0.03, '#ffffff', 0);
  ci(c, 0, 0, 1, '#d99a6c');
  arc(c, 0.84, 3.4, 4.4, 0.12, 'rgba(120,60,20,0.35)');
  ear(c, -0.3, -0.05, '#c4885a');
  /* stubble along the cheek */
  for (k = 0; k < 9; k++) ci(c, 0.2 + (k % 5) * 0.15, -0.12 - Math.floor(k / 5) * 0.12 + (k % 2) * 0.03, 0.02, 'rgba(60,40,25,0.7)', 0);
  /* squinting eyes */
  ln(c, [0.5, 0.06, 0.68, 0.0, 0.88, 0.04], 0.09, OUT); ci(c, 0.72, 0.04, 0.035, '#ffffff', 0);
  ln(c, [0.3, 0.2, 0.46, 0.14], 0.035, 'rgba(100,50,20,0.6)'); ln(c, [0.3, 0.1, 0.46, 0.08], 0.035, 'rgba(100,50,20,0.6)');
  ln(c, [0.4, 0.28, 0.72, 0.16, 0.98, 0.18], 0.1, '#3a2616');
  /* red bandana over nose and mouth */
  p = [0.05, -0.12, 0.7, -0.02, 1.2, -0.04, 1.2, -0.7, 0.8, -1.12, 0.1, -1.0, -0.4, -0.7];
  bl(c, p, '#d93a3a');
  c.save(); blobPath(c, p); c.clip();
  el(c, -0.1, -1.0, 1.6, 0.5, 0.2, 'rgba(90,10,20,0.4)', 0);
  for (k = 0; k < 7; k++) ci(c, 0.15 + (k % 4) * 0.28, -0.3 - Math.floor(k / 4) * 0.35 - (k % 2) * 0.1, 0.045, 'rgba(255,255,255,0.85)', 0);
  ln(c, [0.1, -0.2, 0.7, -0.14, 1.1, -0.16], 0.06, 'rgba(255,170,160,0.6)');
  c.restore();
  bl(c, p, null);
  ln(c, [0.5, -0.5, 0.6, -0.34], 0.04, '#8a1f2a'); ln(c, [0.9, -0.62, 0.96, -0.4], 0.04, '#8a1f2a');
  ci(c, -0.76, -0.3, 0.14, '#b02a2a', 0.1);                                                                              // the knot
  /* dusty wide hat */
  bl(c, [-1.4, 0.62, -0.5, 0.92, 0.5, 0.95, 1.6, 0.68, 2.0, 0.42, 1.4, 0.46, 0.3, 0.5, -0.9, 0.42], '#b8955c');
  el(c, 0.4, 0.5, 1.5, 0.1, 0, 'rgba(70,40,10,0.35)', 0);
  p = [-0.85, 0.7, -0.7, 1.3, -0.2, 1.38, 0.05, 1.22, 0.3, 1.4, 0.82, 1.3, 0.92, 0.66];
  bl(c, p, '#c9a56a');
  c.save(); blobPath(c, p); c.clip();
  el(c, 0.6, 0.85, 0.6, 0.9, 0, 'rgba(90,60,25,0.3)', 0);
  ln(c, [-0.7, 1.1, -0.4, 1.28], 0.1, 'rgba(255,235,185,0.5)');
  for (k = 0; k < 14; k++) ci(c, -0.8 + (k * 0.37) % 1.7, 0.72 + (k * 0.23) % 0.5, 0.025, 'rgba(235,215,170,0.8)', 0);   // dust
  c.restore();
  bl(c, p, null);
  ln(c, [-0.86, 0.8, 0.94, 0.78], 0.12, OUT); ln(c, [-0.86, 0.8, 0.94, 0.78], 0.06, '#6b4a2e');
  /* aviator goggles strapped round the crown */
  ci(c, 0.55, 0.98, 0.26, '#5a6070', 0.11); ci(c, 0.55, 0.98, 0.16, '#ffb54a', 0.05);
  ln(c, [0.45, 1.06, 0.58, 1.1], 0.05, 'rgba(255,255,255,0.9)');
  ln(c, [0.3, 0.98, -0.4, 1.02], 0.1, OUT); ln(c, [0.3, 0.98, -0.4, 1.02], 0.05, '#3d2616');
};

})(typeof window !== 'undefined' ? window : globalThis);
