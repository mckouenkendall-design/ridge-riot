/* Ridge Riot: the showroom. Your bikes standing in a garage, each wearing its own paint and rider.
   The garage you own decides how many bikes can stand on show (3 in the shed, up to 15 in the showroom) and
   how the place looks. It is only for looking at: every bike you own can be ridden from the normal bike list.
   Tapping a bike on show makes it your ride. "Arrange" lets you choose who stands where.

   How it is drawn: the room is painted once into a picture (A.garageScene) and reused. Each frame the picture is
   copied over, then the bikes (still pictures for plain looks, redrawn every frame for animated paints and riders),
   then the moving lights on top (A.garageLive). Every frame runs at the screen's own refresh rate. */
(function (root) {
'use strict';
var RR = root.RR, A = RR.Art, UI = RR.UI, Au = RR.Audio, Store = RR.Store, P = RR.Progress, doc = root.document;
function $(id) { return doc.getElementById(id); }
function esc(s) { return UI.esc(s); }

/* rows of display slots at each garage level, back row first */
var ROWS = [[3], [3, 3], [5, 4], [6, 6], [5, 5, 5]];
var PERSP = { 1: [1], 2: [0.86, 1], 3: [0.76, 0.88, 1] };      // bikes at the back are drawn a little smaller
var STAND = [4, 7, 5, 10, 12];                                  // how far the stand sticks out below the ground line, in pixels at 1x
var REFLECT = [false, false, false, true, true];

var S = { cost: 0, vs: 16.7, ring: [], rk: 0, shed: false, shedFrames: 0, frames: 0, on: false, raf: 0, last: 0, t: 0, arrange: false, picking: -1, level: -1, W: 0, H: 0, dpr: 1, g: null, scene: null, cells: [], sprites: {}, flash: 0, pop: -1, popT: 0, ctx: null };

RR.Showroom = {
  html: function () {
    var back = '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
    return '<section id="s-show" class="screen full">' +
      '<canvas id="showcv"></canvas>' +
      '<div id="showslots"></div>' +
      '<div class="head showhead" id="showhead"><button class="back" data-act="showBack">' + back + '<span>Back</span></button><span class="count" id="showname"></span><span class="fill"></span><span class="count" id="shownug"></span></div>' +
      '<div class="showfoot" id="showfoot"><div class="showcap plate" id="showcap"></div><div class="showbtns"><button class="btn small" data-act="showArrange" id="showarr">Arrange</button><button class="btn small gem" data-act="showUp" id="showup"></button></div></div>' +
      '<div class="showpick" id="showpick"><div class="pickbox plate" id="pickbox"></div></div>' +
      '</section>';
  },
  /* called by the menu when the screen is shown or hidden */
  shown: function (on) {
    if (on === S.on) { if (on) RR.Showroom.layout(); return; }
    S.on = on;
    if (on) { S.cost = 0; S.ring = []; S.rk = 0; S.shed = false; S.frames = 0; S.skipped = 0; S.last = 0; S.arrange = false; S.picking = -1; S.pop = -1; RR.Showroom.layout(); S.raf = root.requestAnimationFrame(frame); }
    else { root.cancelAnimationFrame(S.raf); S.raf = 0; S.sprites = {}; S.scene = null; S.level = -1; }
  },
  open: function () {
    P.garageFill(); Au.ui('go');
    UI.show('show');
  },
  /* the menu hands every button press here first; true means it was ours */
  act: function (a, el) {
    var g = Store.data.garage, i, id, d, n;
    switch (a) {
      case 'showBack':
        if (S.picking >= 0) { closePick(); Au.ui('back'); return true; }
        Au.ui('back'); Store.save(); UI.gtab = 'bikes'; UI.show('garage'); UI.garage(); return true;
      case 'showArrange':
        S.arrange = !S.arrange; Au.ui('toggle'); refresh(); return true;
      case 'showUp':
        n = P.nextGarage(); if (!n) return true;
        if (Store.data.nuggets < n.price) { Au.ui('no'); UI.toast('The ' + n.name + ' costs ' + n.price + ' nuggets. You need ' + (n.price - Store.data.nuggets) + ' more.'); return true; }
        P.buyGarage(); P.garageFill(); Au.unlocked(); S.flash = 1; S.sprites = {};
        UI.toast('You have a ' + P.garage().name + ' now. Room for ' + P.garage().slots + ' bikes.');
        RR.Showroom.layout(); return true;
      case 'slot':
        i = +el.getAttribute('data-i'); id = P.garageFill()[i];
        if (id && !S.arrange) {
          d = RR.BIKE[id]; S.pop = i; S.popT = 0;
          if (Store.data.bike === id) Au.ui('tap');
          else { Store.data.bike = id; Store.save(); Au.ui('go'); }
          refresh();
        } else openPick(i);
        return true;
      case 'slotPut':
        if (S.picking < 0) return true;
        id = el.getAttribute('data-id') || '';
        P.garagePlace(S.picking, id); Store.save(); Au.ui('go'); closePick(); refresh(); return true;
      case 'slotCancel': Au.ui('back'); closePick(); return true;
    }
    return false;
  },
  layout: layout
};

/* ---------------- what is shown ---------------- */
function look(b) { return P.bikeOpen(b) ? P.look(b.id) : null; }
function moving(lk) { return !!(lk && ((lk.paint && A.moves(lk.paint)) || (lk.rider && A.moves(lk.rider)))); }
function refresh() {
  var gar = P.garage(), slots = P.garageFill(), nx = P.nextGarage(), i, shown = 0;
  for (i = 0; i < slots.length; i++) if (slots[i]) shown++;
  $('showname').textContent = gar.name;
  $('shownug').innerHTML = UI.NUG + Store.data.nuggets;
  $('showcap').innerHTML = '<b>' + esc(gar.name) + ': ' + shown + ' of ' + gar.slots + ' on show</b>' + (S.arrange ? 'Tap a spot to choose which bike stands there.' : 'Your ride: ' + esc(RR.BIKE[Store.data.bike].name) + '. Tap a bike to ride it. You can ride any bike you own, shown or not.');
  $('showarr').textContent = S.arrange ? 'Done' : 'Arrange';
  $('showarr').classList.toggle('go', S.arrange);
  var up = $('showup');
  if (nx) { up.style.display = ''; up.innerHTML = 'Upgrade: ' + esc(nx.name) + ' ' + UI.NUG + nx.price; up.setAttribute('aria-label', 'Upgrade to the ' + nx.name + ' for ' + nx.price + ' nuggets, ' + nx.slots + ' slots'); up.classList.toggle('poor', Store.data.nuggets < nx.price); }
  else up.style.display = 'none';
  var bs = $('showslots').children;
  for (i = 0; i < bs.length; i++) {
    var id = slots[i], b = id && RR.BIKE[id];
    bs[i].setAttribute('aria-label', b ? b.name + (Store.data.bike === id ? ', your ride' : '') + (S.arrange ? ', change' : ', ride it') : 'Empty spot, choose a bike');
  }
  S.sprites = {};
}

/* ---------------- sizes and the room ---------------- */
function layout() {
  var cv = $('showcv'); if (!cv || !cv.clientWidth) return;
  var W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, root.devicePixelRatio || 1);
  var level = Math.min(ROWS.length - 1, Math.max(0, Store.data.garage.level)), rows = ROWS[level], R = rows.length, k, i;
  S.W = W; S.H = H; S.dpr = dpr; S.level = level;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  S.ctx = cv.getContext('2d');
  refresh();
  var cr = cv.getBoundingClientRect(), hr = $('showhead').getBoundingClientRect(), fr = $('showfoot').getBoundingClientRect(), cs = root.getComputedStyle($('s-show'));
  var x0 = parseFloat(cs.paddingLeft) || 0, x1 = W - (parseFloat(cs.paddingRight) || 0);
  var top = hr.bottom - cr.top + 8, bot = fr.top - cr.top - 4, avail = Math.max(60, bot - top), AW = x1 - x0;
  var wts = PERSP[R], plan = [], bhSum = 0, fixed = 0, f;
  for (k = 0; k < R; k++) {
    var cw = AW / rows[k], s = wts[k] * cw * 0.96 / 3.4;
    plan.push({ n: rows[k], cw: cw, s: s, lab: cw >= 80 ? 15 : 0, stand: STAND[level] + 3, bh: 2.3 * s });
  }
  // the bikes shrink to fit the height there is. A name under every bike costs height, so when that would shrink the
  // bikes a lot the names go and the bike you ride is marked on its stand instead (its name is in the caption).
  function fitting() { bhSum = 0; fixed = 0; plan.forEach(function (p) { bhSum += 2.3 * p.s; fixed += p.lab + p.stand + 3; }); return Math.min(1, Math.max(0.2, (avail - fixed) / bhSum)); }
  f = fitting();
  if (f < 0.72) { plan.forEach(function (p) { p.lab = 0; }); f = fitting(); }
  var total = 0;
  plan.forEach(function (p) { p.s *= f; p.bh = 2.3 * p.s; total += p.bh + p.lab + p.stand + 3; });
  var spare = Math.max(0, avail - total), y = bot - spare * 0.3;
  var slot = 0; S.cells = [];
  for (k = R - 1; k >= 0; k--) {
    var p = plan[k], ground = y - p.lab - p.stand, rowTop = ground - p.bh;
    p.ground = ground; p.top = rowTop; p.bottom = y;
    y = rowTop - 3;
  }
  for (k = 0; k < R; k++) {
    var p2 = plan[k];
    for (i = 0; i < p2.n; i++) S.cells.push({ x: x0 + i * p2.cw, w: p2.cw, ground: p2.ground, top: p2.top, bottom: p2.bottom, s: p2.s, row: k, lab: p2.lab, stand: p2.stand });
  }
  var back = plan[0], hz = Math.max(top + 24, back.ground - back.bh * 0.2);
  S.g = { W: W, H: H, hz: hz, x0: x0, x1: x1, rows: plan.map(function (p) { return { y0: p.top, y1: p.ground, n: p.n }; }) };
  // the room, painted once
  var sc = doc.createElement('canvas'); sc.width = cv.width; sc.height = cv.height;
  var c = sc.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  A.garageScene(c, S.g, level); S.scene = sc; S.sprites = {};
  // an invisible button over every spot
  var h = '';
  S.cells.forEach(function (cl, n) { var y0 = Math.max(cl.top, top - 2); h += '<button class="slotb" data-act="slot" data-i="' + n + '" style="left:' + (cl.x + 1).toFixed(1) + 'px;top:' + y0.toFixed(1) + 'px;width:' + (cl.w - 2).toFixed(1) + 'px;height:' + (cl.bottom - y0).toFixed(1) + 'px"></button>'; });
  $('showslots').innerHTML = h;
  refresh();
}

/* ---------------- bike pictures ---------------- */
/* one bike, wearing its look, in a canvas: [bike][room for a reflection under it] */
function spriteFor(cl, b, lk, slot, redraw) {
  var anim = moving(lk), key = slot + '|' + b.id + '|' + (lk && lk.paint ? lk.paint.id : '') + '|' + (lk && lk.rider ? lk.rider.id : '');
  var sp = S.sprites[key];
  if (sp && (!anim || !redraw)) return sp;
  var dpr = S.dpr, wM = b.wb + b.rr + b.rf + 0.9, hM = b.kind === 'bumper' ? 2.7 : 2.3;
  if (!sp) {
    var s = Math.min(cl.s, cl.w * 0.96 / wM, cl.s * 2.3 / hM), px = s * dpr, refl = REFLECT[S.level] ? 0.7 : 0;
    var cv = doc.createElement('canvas'); cv.width = Math.ceil(wM * px); cv.height = Math.ceil((hM + refl) * px);
    sp = S.sprites[key] = { cv: cv, s: s, px: px, wM: wM, hM: hM, refl: refl, ox: b.rr + 0.5, anim: anim };
    if (anim) { var c0 = cv.getContext('2d'); c0.imageSmoothingEnabled = true; }
  }
  var c = sp.cv.getContext('2d'), px2 = sp.px, gy = (sp.hM - 0.06) * px2;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, sp.cv.width, sp.cv.height);
  c.setTransform(px2, 0, 0, -px2, sp.ox * px2, gy);
  A.bike(c, b, { rider: true, lp: 0, stand: 0, look: lk, t: anim ? S.t : 1 });
  if (sp.refl) {
    var rh = Math.round(sp.refl * px2), gap = Math.round(0.03 * px2);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.save(); c.globalAlpha = 0.34; c.translate(0, 2 * gy + gap); c.scale(1, -1);
    c.drawImage(sp.cv, 0, gy - rh, sp.cv.width, rh, 0, gy - rh, sp.cv.width, rh);
    c.restore();
    c.globalCompositeOperation = 'destination-out';
    var gr = c.createLinearGradient(0, gy + gap, 0, gy + gap + rh); gr.addColorStop(0, 'rgba(0,0,0,0.15)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = gr; c.fillRect(0, gy + gap, sp.cv.width, rh + 2);
    c.globalCompositeOperation = 'source-over';
  }
  return sp;
}

function pill(c, text, cx, y, mine) {
  c.font = 'italic 800 11px "Avenir Next Condensed", "Arial Narrow", "Roboto Condensed", system-ui, sans-serif';
  var w = c.measureText(text).width + 12;
  c.beginPath(); if (c.roundRect) c.roundRect(cx - w / 2, y, w, 14, 7); else c.rect(cx - w / 2, y, w, 14);
  c.fillStyle = mine ? '#f2c230' : 'rgba(20,23,30,0.74)'; c.fill();
  c.lineWidth = 1.2; c.strokeStyle = mine ? '#171a22' : 'rgba(246,242,231,0.5)'; c.stroke();
  c.fillStyle = mine ? '#171a22' : '#f6f2e7'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, cx, y + 7.5);
}

/* ---------------- a frame ---------------- */
function frame(now) {
  if (!S.on) return;
  S.raf = root.requestAnimationFrame(frame);
  var dt = S.last ? Math.min(0.05, Math.max(0.001, (now - S.last) / 1000)) : 1 / 60; S.last = now; S.t += dt;
  if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 1.6);
  if (S.pop >= 0) { S.popT += dt; if (S.popT > 0.45) S.pop = -1; }
  var t0 = root.performance.now();
  draw();
  S.cost = S.cost * 0.9 + (root.performance.now() - t0) * 0.1; S.frames++;
  // Safety valve for slow phones: every animated bike is redrawn every frame (60 or more times a second), unless the drawing
  // itself is eating most of the frame. Then the bikes other than your ride take turns, each redrawn every second frame.
  S.ring[S.rk++ % 90] = dt * 1000;
  if (S.frames % 20 === 0 && S.ring.length >= 20) {
    var r = S.ring.slice().sort(function (a, b) { return a - b; }); S.vs = Math.min(16.7, Math.max(4, r[Math.floor(r.length * 0.2)]));       // 60 Hz is assumed unless frames are seen arriving faster
    if (!S.shed && S.cost > S.vs * 0.75) S.shed = true; else if (S.shed && S.cost < S.vs * 0.4) S.shed = false;
  }
}
/* for tools/perf.js: how hard the showroom is working and whether it had to share the work out */
RR.Showroom.stats = function () { return { costMs: +S.cost.toFixed(2), frameMs: +S.vs.toFixed(2), shared: S.shed, frames: S.frames, skippedRedraws: S.skipped || 0 }; };
RR.Showroom.draw = draw;
RR.Showroom.state = S;
function draw() {
  var c = S.ctx, g = S.g, level = S.level, dpr = S.dpr; if (!c || !g || !S.scene) return;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  c.drawImage(S.scene, 0, 0);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  var slots = Store.data.garage.slots, mine = Store.data.bike, i, cl;
  var items = [];
  for (i = 0; i < S.cells.length; i++) {
    cl = S.cells[i];
    var id = slots[i], b = id && RR.BIKE[id], cx = cl.x + cl.w / 2;
    A.garageStand(c, level, cx, cl.ground, Math.min(cl.w * 0.9, (b ? (b.wb + b.rr + b.rf + 0.9) * cl.s : cl.w * 0.6)), S.t);
    if (!b) {
      // an empty spot: a dashed outline and a plus
      c.save(); c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeStyle = S.arrange ? 'rgba(242,194,48,0.95)' : 'rgba(246,242,231,0.4)';
      var bx = cl.x + cl.w * 0.12, bw = cl.w * 0.76; c.strokeRect(bx, cl.top + (cl.ground - cl.top) * 0.28, bw, (cl.ground - cl.top) * 0.64);
      c.setLineDash([]); c.lineWidth = 3; c.lineCap = 'round'; var py = cl.top + (cl.ground - cl.top) * 0.6, pr = Math.min(10, cl.w * 0.07);
      c.beginPath(); c.moveTo(cx - pr, py); c.lineTo(cx + pr, py); c.moveTo(cx, py - pr); c.lineTo(cx, py + pr); c.stroke(); c.restore();
      continue;
    }
    var again = !S.shed || id === mine || ((S.frames + i) & 1) === 0; if (!again) S.skipped = (S.skipped || 0) + 1;
    var sp = spriteFor(cl, b, look(b), i, again), sw = sp.cv.width / dpr, sh = sp.cv.height / dpr;
    var gyc = (sp.hM - 0.06) * sp.s, dx = cx - sw / 2, dy = cl.ground - gyc;
    if (S.pop === i) {
      var k = S.popT / 0.45, hop = Math.sin(k * Math.PI) * cl.s * 0.18 * (1 - k * 0.4);
      c.drawImage(sp.cv, dx, dy - hop, sw, sh);
    } else c.drawImage(sp.cv, dx, dy, sw, sh);
    if (mine === b.id) { c.save(); c.strokeStyle = '#f2c230'; c.lineWidth = 3; c.shadowColor = '#f2c230'; c.shadowBlur = 8; c.beginPath(); c.ellipse(cx, cl.ground + cl.stand * 0.45, Math.min(cl.w * 0.46, sw * 0.5), Math.max(3, cl.stand * 0.4), 0, 0, 6.2832); c.stroke(); c.restore(); }
    if (S.arrange) { c.save(); c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeStyle = 'rgba(242,194,48,0.95)'; c.strokeRect(cl.x + 3, cl.top - 1, cl.w - 6, cl.bottom - cl.top + 1); c.restore(); }
    if (cl.lab) pill(c, b.name + (S.arrange ? '' : ''), cx, cl.ground + cl.stand + 1, mine === b.id);
  }
  A.garageLive(c, g, level, S.t);
  if (S.flash > 0) { c.fillStyle = 'rgba(255,248,210,' + (S.flash * 0.7).toFixed(3) + ')'; c.fillRect(0, 0, S.W, S.H); }
}

/* ---------------- choosing who stands on a spot ---------------- */
function openPick(i) {
  S.picking = i; Au.ui('swipe');
  var slots = P.garageFill(), at = {}, h = '', n;
  slots.forEach(function (id, k) { if (id) at[id] = k + 1; });
  h += '<h3>Which bike stands in spot ' + (i + 1) + '?</h3><div class="pickgrid scroll">';
  RR.BIKES.forEach(function (b) {
    if (!P.bikeOpen(b)) return;
    h += '<button class="pk' + (slots[i] === b.id ? ' cur' : '') + '" data-act="slotPut" data-id="' + b.id + '" aria-label="' + esc(b.name) + '"><canvas data-bike="' + b.id + '"></canvas><b>' + esc(b.name) + '</b><i>' + (slots[i] === b.id ? 'Here now' : at[b.id] ? 'Spot ' + at[b.id] : 'In the garage') + '</i></button>';
  });
  h += '</div><div class="btns"><button class="btn small" data-act="slotPut" data-id="">Leave it empty</button><button class="btn small" data-act="slotCancel">Cancel</button></div>';
  $('pickbox').innerHTML = h; $('showpick').classList.add('on');
  var cvs = $('pickbox').querySelectorAll('canvas');
  for (n = 0; n < cvs.length; n++) thumb(cvs[n], RR.BIKE[cvs[n].getAttribute('data-bike')]);
}
function closePick() { S.picking = -1; $('showpick').classList.remove('on'); }
function thumb(cv, b) {
  var dpr = Math.min(2, root.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  var c = cv.getContext('2d'), span = b.wb + b.rr + b.rf + 0.3, tall = b.kind === 'bumper' ? 2.7 : 2.3, S2 = Math.min(w / span, h / tall) * dpr;
  c.setTransform(S2, 0, 0, -S2, (cv.width - span * S2) / 2 + (b.rr + 0.15) * S2, cv.height - 0.08 * S2);
  A.bike(c, b, { rider: true, lp: 0, stand: 0, look: look(b), t: 1 });
}
})(typeof window !== 'undefined' ? window : globalThis);
