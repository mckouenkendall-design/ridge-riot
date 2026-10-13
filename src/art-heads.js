/* Ridge Riot: more riders.
   A head is drawn in "helmet space": a circle of radius 1, the face pointing along +x, up is +y.
   Same rules as the first riders in art-skins.js: thick dark outline, flat colour with a lit edge or
   shade, and small parts (a plume, an antenna, a hose) so each one has some character.
   Heads that move use t (seconds). */
(function (root) {
'use strict';
var RR = root.RR, A = RR.Art, K = A.kit, HEAD = A.HEADS;
var ci = K.ci, po = K.po, bl = K.bl, ln = K.ln, eye = K.eye, el = K.el, star = K.star, puff = K.puff, hsl = K.hsl, SKIN = K.SKIN, LW = K.LW, OUT = K.OUT, TAU = K.TAU;

/* a lit edge or shade drawn as an arc on the head's own circle */
function arc(c, r, a0, a1, w, col) { c.beginPath(); c.arc(0, 0, r, a0, a1); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
/* clip to the union of some circles, so shading stays inside a lumpy shape */
function clipCircles(c, cs) { c.beginPath(); cs.forEach(function (k) { c.moveTo(k[0] + k[2], k[1]); c.arc(k[0], k[1], k[2], 0, TAU); }); c.clip(); }

/* ---------------------------- common ---------------------------- */
HEAD.chef = function (c) {
  ci(c, 0, 0, 1, SKIN);
  puff(c, [[-0.58, 1.34, 0.5], [0.0, 1.78, 0.6], [0.62, 1.34, 0.5], [0.02, 1.2, 0.62]], '#ffffff');
  ln(c, [-0.5, 1.0, -0.6, 1.7], 0.06, '#dde3ee'); ln(c, [0.1, 1.15, 0.0, 2.25], 0.06, '#dde3ee'); ln(c, [0.62, 1.0, 0.72, 1.6], 0.06, '#dde3ee');
  bl(c, [-0.84, 0.5, 0.88, 0.58, 0.84, 1.02, -0.82, 0.96], '#ffffff');                                          // hat band
  ln(c, [-0.4, 0.58, -0.4, 0.94], 0.05, '#dde3ee'); ln(c, [0.0, 0.6, 0.0, 0.96], 0.05, '#dde3ee'); ln(c, [0.42, 0.62, 0.4, 0.98], 0.05, '#dde3ee');
  ln(c, [0.4, 0.34, 0.86, 0.26], 0.1, '#4a2e1a');
  eye(c, 0.62, 0.1, 0.12);
  ci(c, 0.3, -0.22, 0.2, 'rgba(255,110,110,0.4)', 0);
  ci(c, 1.0, 0.0, 0.14, '#dba27c', 0.1);                                                                          // nose
  bl(c, [0.58, -0.2, 0.92, -0.1, 1.24, -0.14, 1.46, 0.1, 1.34, -0.3, 0.98, -0.46, 0.62, -0.42], '#6b4528', 0.12);       // handlebar moustache, tips curled up
  ln(c, [0.78, -0.22, 1.1, -0.18], 0.04, '#a98258'); ci(c, 1.4, 0.07, 0.05, '#6b4528', 0.04);
};

HEAD.cone = function (c) {
  ci(c, 0, 0, 1, SKIN);
  var bx0 = -0.9, by0 = 1.04, bx1 = 0.98, by1 = 0.88, tx = -0.15, ty = 2.9;
  function at(t, s) { return s ? [bx1 + (tx - bx1) * t, by1 + (ty - by1) * t] : [bx0 + (tx - bx0) * t, by0 + (ty - by0) * t]; }
  po(c, [-1.2, 0.76, 1.26, 0.56, 1.28, 0.88, -1.18, 1.08], '#d9560a');                                          // square base
  po(c, [bx0, by0, bx1, by1, tx, ty], '#ff7a1f');
  [[0.28, 0.46], [0.6, 0.72]].forEach(function (b) {
    var p = [at(b[0], 0), at(b[0], 1), at(b[1], 1), at(b[1], 0)];
    po(c, [p[0][0], p[0][1], p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]], '#ffffff', 0);                // reflective bands
    ln(c, [p[0][0] + 0.02, p[0][1], p[1][0] - 0.02, p[1][1]], 0.035, '#cfd6e2');
  });
  po(c, [bx0, by0, bx1, by1, tx, ty], null);
  ln(c, [-0.66, 1.2, -0.22, 2.5], 0.07, 'rgba(255,255,255,0.4)');
  eye(c, 0.62, 0.0, 0.12); ln(c, [0.36, 0.3, 0.88, 0.1], 0.12, OUT);                                             // glaring from under the cone
  ln(c, [0.5, -0.5, 0.96, -0.42], 0.1, OUT);
};

HEAD.flurry = function (c, t) {
  var w = Math.sin(t * 8) * 0.1;
  bl(c, [-0.8, -0.55, -1.5, -0.45 + w, -1.8, -0.8 + w, -0.9, -1.0], '#d93a3a');                                  // scarf ends
  ln(c, [-1.05, -0.58, -1.1, -0.94], 0.07, '#ffffff'); ln(c, [-1.35, -0.52, -1.4, -0.88], 0.07, '#ffffff');
  ci(c, 0, 0, 1, '#f7fbff');
  arc(c, 0.82, 2.3, 4.0, 0.2, '#cfe0f2');
  arc(c, 0.9, 3.7, 5.7, 0.4, OUT); arc(c, 0.9, 3.7, 5.7, 0.25, '#d93a3a'); arc(c, 0.9, 4.0, 4.1, 0.25, '#ffffff'); arc(c, 0.9, 4.6, 4.7, 0.25, '#ffffff'); arc(c, 0.9, 5.2, 5.3, 0.25, '#ffffff');
  ci(c, 0.5, 0.26, 0.12, OUT, 0);
  [[0.28, -0.28], [0.5, -0.4], [0.74, -0.38], [0.92, -0.24]].forEach(function (s) { ci(c, s[0], s[1], 0.06, OUT, 0); });         // coal smile
  ci(c, 0.28, -0.04, 0.17, 'rgba(255,150,170,0.5)', 0);
  po(c, [0.88, 0.12, 2.2, -0.08, 0.9, -0.24], '#ff8a1f'); ln(c, [1.15, 0.06, 1.08, -0.1], 0.04, '#c95f10'); ln(c, [1.55, 0.0, 1.5, -0.14], 0.04, '#c95f10');
  el(c, 0.0, 0.92, 1.05, 0.2, -0.12, '#2a2d35');                                                                // top hat
  bl(c, [-0.58, 0.98, -0.52, 2.0, 0.52, 2.0, 0.6, 0.88], '#2a2d35');
  bl(c, [-0.58, 1.0, 0.6, 0.9, 0.58, 1.2, -0.57, 1.3], '#d93a3a', 0.1);
  ln(c, [-0.34, 1.5, -0.3, 1.88], 0.06, 'rgba(255,255,255,0.28)');
};

/* ---------------------------- uncommon ---------------------------- */
HEAD.ronin = function (c) {
  bl(c, [-0.7, -0.08, -1.45, -0.32, -1.52, -0.86, -0.66, -0.74], '#b02a3c');                                     // neck guard: two flared plates
  bl(c, [-0.6, -0.56, -1.34, -0.8, -1.4, -1.3, -0.52, -1.16], '#8a1f2a');
  ln(c, [-1.5, -0.84, -0.68, -0.72], 0.05, '#e8b12e'); ln(c, [-1.38, -1.28, -0.54, -1.14], 0.05, '#e8b12e');
  ci(c, 0, 0, 1, SKIN);
  bl(c, [0.2, -0.2, 1.08, -0.18, 1.12, -0.8, 0.56, -1.12, 0.06, -0.9], '#2a2d35');                              // iron face mask
  ln(c, [0.4, -0.42, 0.98, -0.4], 0.09, '#b02a3c'); ln(c, [0.26, -0.7, 0.56, -1.0], 0.09, '#b02a3c');
  po(c, [0.5, -0.56, 0.6, -0.66, 0.7, -0.56, 0.8, -0.66, 0.9, -0.56], '#f1ecdc', 0.05, true);                    // bared teeth
  ln(c, [0.76, -0.28, 1.04, -0.36], 0.05, '#cfd6e2'); ln(c, [0.72, -0.36, 1.0, -0.48], 0.05, '#cfd6e2');          // whiskers
  el(c, 0.64, -0.02, 0.17, 0.07, -0.25, '#ffffff', 0.05); ci(c, 0.69, -0.02, 0.045, OUT, 0);                        // glaring eye
  c.beginPath(); c.arc(0, 0, 1.04, 0.1, 3.05); c.closePath(); c.fillStyle = '#8a1f2a'; c.fill(); c.lineWidth = LW; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke();   // helmet bowl
  arc(c, 0.84, 0.6, 2.5, 0.07, '#e8b12e');
  arc(c, 0.8, 2.6, 2.9, 0.1, 'rgba(255,170,170,0.5)');
  [0.5, 1.1, 1.7].forEach(function (a) { ci(c, Math.cos(a) * 0.93, Math.sin(a) * 0.93, 0.055, '#e8b12e', 0.04); });
  po(c, [0.6, 0.3, 1.72, 0.42, 1.64, 0.12, 0.8, 0.08], '#5d6672'); ln(c, [0.8, 0.1, 1.62, 0.15], 0.05, '#e8b12e');    // peak
  bl(c, [0.3, 0.98, 0.1, 1.7, 0.6, 2.4, 1.5, 2.7, 0.94, 2.1, 0.78, 1.5, 0.8, 0.95], '#e8b12e');                   // crescent crest
  ln(c, [0.36, 1.5, 0.7, 2.1, 1.1, 2.4], 0.05, '#fff3b0');
};

HEAD.chomp = function (c) {
  ci(c, 0, 0, 1, '#6f8fa8');
  po(c, [-0.3, 0.9, -1.05, 2.15, 0.55, 1.0], '#557894');                                                        // fin
  bl(c, [0.3, 0.3, 1.0, 0.5, 1.8, 0.1, 1.7, -0.5, 0.95, -0.92, 0.2, -0.8], '#6f8fa8');                           // snout
  bl(c, [0.1, -0.35, 1.7, -0.4, 1.55, -0.7, 0.9, -0.95, 0.2, -0.8], '#e6eef5', 0.12);                           // pale belly and jaw
  ln(c, [0.55, -0.3, 1.1, -0.32, 1.75, -0.28], 0.1, OUT);                                                       // mouth
  var k; for (k = 0; k < 5; k++) { var x = 0.75 + k * 0.2; po(c, [x, -0.31, x + 0.1, -0.5, x + 0.2, -0.3], '#ffffff', 0.05); }      // lower teeth
  for (k = 0; k < 4; k++) { var x2 = 0.85 + k * 0.2; po(c, [x2, -0.28, x2 + 0.1, -0.08, x2 + 0.2, -0.28], '#ffffff', 0.05); }       // upper teeth
  ln(c, [-0.5, 0.34, -0.6, -0.2], 0.07, '#456a88'); ln(c, [-0.3, 0.4, -0.4, -0.18], 0.07, '#456a88'); ln(c, [-0.7, 0.2, -0.8, -0.3], 0.07, '#456a88');    // gills
  ci(c, 0.6, 0.34, 0.15, OUT, 0); ci(c, 0.64, 0.4, 0.045, '#ffffff', 0);
  ln(c, [0.3, 0.62, 0.9, 0.58], 0.09, '#456a88');
};

HEAD.prickles = function (c, t) {
  bl(c, [-0.8, 0.0, -1.5, 0.05, -1.65, 0.95, -1.4, 1.4, -1.15, 0.95, -1.1, 0.5, -0.8, 0.45], '#4aa456');           // little arm
  el(c, 0.0, 0.12, 0.95, 1.2, 0, '#58b45e');
  ln(c, [-0.5, -0.7, -0.58, 0.12, -0.5, 0.95], 0.06, '#3a8a45'); ln(c, [0.0, -0.95, 0.0, 1.2], 0.06, '#3a8a45'); ln(c, [0.52, -0.7, 0.56, 0.1, 0.5, 0.95], 0.06, '#3a8a45');
  ln(c, [-0.7, -0.4, -0.72, 0.55], 0.09, 'rgba(190,255,190,0.55)');
  [[-0.3, 0.8], [-0.62, 0.3], [-0.25, -0.4], [0.28, 0.82], [0.2, -0.7], [-0.05, 0.3], [-0.7, -0.2], [-1.42, 0.6], [-1.5, 1.1]].forEach(function (s) {
    ln(c, [s[0] - 0.07, s[1] - 0.05, s[0] + 0.07, s[1] + 0.05], 0.035, '#fff6d0'); ln(c, [s[0] - 0.06, s[1] + 0.06, s[0] + 0.06, s[1] - 0.05], 0.035, '#fff6d0');
  });
  var k; for (k = 0; k < 5; k++) { var a = k * TAU / 5 + 0.3; ci(c, 0.05 + Math.cos(a) * 0.2, 1.42 + Math.sin(a) * 0.19, 0.14, '#ff7aa8', 0.07); }    // flower
  ci(c, 0.05, 1.42, 0.1, '#ffd93d', 0.05);
  ci(c, 0.3, -0.12, 0.17, 'rgba(255,110,150,0.5)', 0);
  eye(c, 0.5, 0.26, 0.12); ci(c, 0.53, 0.3, 0.035, '#ffffff', 0);
  ln(c, [0.28, -0.32, 0.56, -0.46, 0.86, -0.32], 0.08, OUT);
};

/* ---------------------------- rare ---------------------------- */
HEAD.pharaoh = function (c) {
  bl(c, [0.5, -0.78, 0.94, -0.74, 0.9, -2.05, 0.56, -2.05], '#e8b12e', 0.12);                                   // false beard
  ln(c, [0.52, -1.1, 0.92, -1.1], 0.07, '#1f4fa8'); ln(c, [0.54, -1.4, 0.9, -1.4], 0.07, '#1f4fa8'); ln(c, [0.55, -1.7, 0.9, -1.7], 0.07, '#1f4fa8');
  ci(c, 0, 0, 1, SKIN);
  bl(c, [-1.2, 0.3, -0.95, 1.3, 0.0, 1.45, 0.9, 0.98, 1.03, 0.5, 0.42, 0.62, 0.22, 0.1, 0.36, -0.9, -0.1, -1.6, -1.36, -1.5], '#2250b0');   // striped headcloth
  [0.75, 0.3, -0.12, -0.55, -0.98].forEach(function (y) { ln(c, [-1.2, y - 0.12, 0.25, y], 0.085, '#e8b12e'); });
  ln(c, [-0.95, 1.12, -0.1, 1.34, 0.55, 1.14, 0.98, 0.78], 0.26, OUT); ln(c, [-0.95, 1.12, -0.1, 1.34, 0.55, 1.14, 0.98, 0.78], 0.15, '#e8b12e');   // gold band
  ln(c, [-0.8, 1.22, -0.3, 1.34], 0.05, '#fff3b0');
  bl(c, [0.9, 0.7, 1.22, 1.0, 1.18, 1.42, 1.0, 1.22, 0.98, 0.92], '#2f9e57', 0.1); ci(c, 1.2, 1.52, 0.13, '#e8b12e', 0.07);   // cobra on the brow
  ln(c, [0.42, 0.1, 0.96, 0.2, 1.24, 0.36], 0.11, OUT); el(c, 0.64, 0.08, 0.2, 0.11, 0.1, '#ffffff', 0.05); ci(c, 0.68, 0.08, 0.06, OUT, 0);
  ln(c, [0.6, -0.46, 0.92, -0.4], 0.08, OUT);
};

HEAD.diver = function (c, t) {
  var k;
  ln(c, [-0.95, -0.1, -1.6, -0.25, -2.1, -0.75, -2.7, -0.65], 0.38, OUT); ln(c, [-0.95, -0.1, -1.6, -0.25, -2.1, -0.75, -2.7, -0.65], 0.26, '#3a3f4b');   // air hose
  for (k = 0; k < 4; k++) { var hx = -1.3 - k * 0.32; ln(c, [hx, -0.2 - k * 0.1, hx - 0.03, -0.42 - k * 0.1], 0.05, '#5a606c'); }
  var g = c.createRadialGradient(-0.35, 0.45, 0.1, 0, 0, 1.2); g.addColorStop(0, '#ffe3a1'); g.addColorStop(0.5, '#d99a35'); g.addColorStop(1, '#8d5a15');
  ci(c, 0, 0, 1, g);
  arc(c, 0.86, 1.7, 2.45, 0.12, 'rgba(255,255,255,0.55)');
  bl(c, [-0.98, -0.5, 0.98, -0.58, 1.04, -0.98, -0.98, -0.98], '#b8741f', 0.12); ln(c, [-0.9, -0.6, 0.9, -0.66], 0.05, '#ffe3a1');                     // collar
  for (k = 0; k < 6; k++) ci(c, -0.7 + k * 0.28, -0.8, 0.04, '#ffe3a1', 0.03);
  ci(c, 0.52, 0.08, 0.46, '#b87a22', 0.11);                                                                       // front porthole
  ci(c, 0.52, 0.08, 0.34, '#27384f', 0.06); ci(c, 0.56, 0.05, 0.21, SKIN, 0); eye(c, 0.62, 0.1, 0.045);
  c.beginPath(); c.arc(0.52, 0.08, 0.27, 1.9, 2.6); c.lineWidth = 0.06; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.stroke();
  for (k = 0; k < 8; k++) { var a = k * TAU / 8; ci(c, 0.52 + Math.cos(a) * 0.4, 0.08 + Math.sin(a) * 0.4, 0.035, '#ffe3a1', 0.02); }
  ci(c, -0.2, 0.66, 0.17, '#b87a22', 0.08); ci(c, -0.2, 0.66, 0.1, '#27384f', 0); ci(c, -0.62, 0.1, 0.17, '#b87a22', 0.08); ci(c, -0.62, 0.1, 0.1, '#27384f', 0);
  bl(c, [-0.1, 0.98, 0.0, 1.2, 0.24, 1.2, 0.3, 0.96], '#b8741f', 0.1);                                           // valve
  for (k = 0; k < 3; k++) { var f = (t * 0.8 + k * 0.34) % 1; c.globalAlpha = 1 - f; ci(c, 0.1 + Math.sin(f * 7 + k) * 0.14, 1.35 + f * 1.3, 0.06 + 0.05 * f, 'rgba(210,240,255,0.5)', 0.04); }
  c.globalAlpha = 1;
};

/* ---------------------------- epic ---------------------------- */
HEAD.storm = function (c, t) {
  var cs = [[-0.2, -0.1, 0.95], [-0.85, 0.12, 0.55], [0.55, 0.36, 0.66], [0.0, 0.78, 0.62], [-0.6, 0.62, 0.5], [0.92, -0.1, 0.45]], k;
  var f = (t * 0.7) % 1, fl = f < 0.1 ? Math.sin(f / 0.1 * Math.PI) : f > 0.16 && f < 0.24 ? 0.6 * Math.sin((f - 0.16) / 0.08 * Math.PI) : 0;
  for (k = 0; k < 6; k++) { var q = (t * 1.5 + k * 0.17) % 1, rx = -0.5 + k * 0.32; c.globalAlpha = 0.9 * (1 - q); ln(c, [rx, -1.0 - q * 1.3, rx - 0.07, -1.18 - q * 1.3], 0.055, '#9fd0ff'); }
  c.globalAlpha = 1;
  puff(c, cs, '#5d6a85');
  c.save(); clipCircles(c, cs);
  el(c, -0.1, -0.85, 1.8, 0.8, 0, 'rgba(26,32,58,0.5)', 0);
  el(c, -0.5, 0.9, 1.0, 0.45, 0.3, 'rgba(190,205,235,0.45)', 0);
  if (fl > 0) { c.fillStyle = 'rgba(255,250,200,' + (fl * 0.75).toFixed(2) + ')'; c.fillRect(-2, -2, 4, 4); }
  c.restore();
  if (fl > 0) {
    c.globalAlpha = Math.min(1, fl * 1.4);
    po(c, [0.2, -0.82, -0.12, -1.4, 0.14, -1.4, -0.32, -2.35, 0.5, -1.2, 0.18, -1.2, 0.52, -0.82], '#ffe97a', 0.08);
    ln(c, [0.14, -1.0, -0.04, -1.3], 0.04, '#ffffff');
    c.globalAlpha = 1;
  }
  el(c, 0.55, 0.12, 0.27, 0.21, -0.2, '#ffe97a', 0.08); ci(c, 0.6, 0.12, 0.08, OUT, 0);
  ln(c, [0.26, 0.44, 0.88, 0.3], 0.13, OUT);
  ln(c, [0.3, -0.4, 0.5, -0.3, 0.7, -0.46, 0.9, -0.3], 0.07, OUT);
};

/* ---------------------------- legendary ---------------------------- */
HEAD.mirage = function (c, t) {
  var hue = 170 + 90 * (0.5 + 0.5 * Math.sin(t * 0.8)), k;
  var glitch = Math.sin(t * 17) > 0.62, j = glitch ? 0.16 : 0.06 + 0.025 * Math.sin(t * 5);
  function hsla(h, s, l, a) { return 'hsla(' + ((h % 360 + 360) % 360).toFixed(0) + ',' + s + '%,' + l + '%,' + a + ')'; }
  var halo = c.createRadialGradient(0, 0, 0.7, 0, 0, 2.2); halo.addColorStop(0, hsla(hue, 100, 60, 0.5)); halo.addColorStop(1, hsla(hue, 100, 60, 0));
  c.fillStyle = halo; c.beginPath(); c.arc(0, 0, 2.2, 0, TAU); c.fill();
  for (k = 0; k < 8; k++) {            // squares of the picture breaking off behind it
    var f = (t * 0.9 + k * 0.37) % 1, s = 0.12 + 0.08 * ((k * 5) % 3);
    c.globalAlpha = (1 - f) * 0.95; c.fillStyle = hsl(hue + k * 14, 100, 68); c.fillRect(-0.9 - f * 1.3 - k * 0.07, -0.8 + ((k * 0.43) % 1.6) + Math.sin(f * 5 + k) * 0.12, s, s);
  }
  c.globalAlpha = 1; c.lineWidth = 0.1;                                                                           // the colour split
  c.strokeStyle = 'rgba(255,47,168,0.9)'; c.beginPath(); c.arc(-j, 0, 1.0, 0, TAU); c.stroke();
  c.strokeStyle = 'rgba(24,232,255,0.9)'; c.beginPath(); c.arc(j, 0, 1.0, 0, TAU); c.stroke();
  var body = c.createRadialGradient(-0.3, 0.35, 0.1, 0, 0, 1.05); body.addColorStop(0, hsl(hue + 30, 100, 64)); body.addColorStop(1, hsl(hue, 100, 26));
  ci(c, 0, 0, 1, body);
  c.save(); c.beginPath(); c.arc(0, 0, 0.96, 0, TAU); c.clip();
  c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 0.04;                                                      // wireframe globe
  for (k = 1; k <= 3; k++) { c.beginPath(); c.ellipse(0, 0, k * 0.26, 0.98, 0, 0, TAU); c.stroke(); }
  for (k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(-1, k * 0.27); c.lineTo(1, k * 0.27); c.stroke(); }
  c.fillStyle = '#ffffff'; c.globalAlpha = 0.5; var sy = ((t * 0.55) % 2.4) - 1.2; c.fillRect(-1, sy, 2, 0.08);          // scan line sweeping down
  if (glitch) { c.globalAlpha = 0.8; c.fillStyle = hsl(hue + 60, 100, 74); c.fillRect(-1, -0.28, 2, 0.13); c.fillRect(-1, 0.5, 2, 0.06); }
  c.restore(); c.globalAlpha = 1;
  arc(c, 0.9, 0.5, 2.7, 0.08, 'rgba(255,255,255,0.85)');
  po(c, [0.26, 0.22, 1.04, 0.32, 1.08, -0.08, 0.3, -0.16], '#10151f', 0.1);                                        // visor
  po(c, [0.36, 0.14, 0.98, 0.22, 1.0, -0.02, 0.38, -0.08], hsl(hue + 20, 100, 78), 0);
  ln(c, [0.46, 0.12, 0.9, 0.16], 0.06, '#ffffff');
  ln(c, [0.4, -0.5, 0.92, -0.48], 0.06, hsl(hue, 100, 82)); ln(c, [0.5, -0.7, 0.8, -0.68], 0.05, hsl(hue, 100, 82));
};

})(typeof window !== 'undefined' ? window : globalThis);
