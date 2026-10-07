/* Ridge Riot: menus, the on-screen display during a run, and the event wiring
   (touch, keyboard, resize). Screens are plain HTML laid over the game canvas. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var G = RR.Game, R = RR.Render, Au = RR.Audio, Store = RR.Store, P = RR.Progress, A = RR.Art;
var doc = root.document;
var UI = RR.UI = { cur: '', world: 0, gi: 0 };
function $(id) { return doc.getElementById(id); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function fmt(t) { return t.toFixed(2); }
function stars(n, cls) { var s = '<span class="stars ' + (cls || '') + '">'; for (var i = 0; i < 3; i++) s += '<i class="star' + (i < n ? ' on' : '') + '"></i>'; return s + '</span>'; }

var IC = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4 7 12l8 8"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 4 8 8-8 8"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="#f6f2e7"><rect x="5" y="4" width="5" height="16" rx="1.2"/><rect x="14" y="4" width="5" height="16" rx="1.2"/></svg>',
  redo: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 3.5V8h-4.5"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="#171a22"><rect x="4" y="10" width="16" height="11" rx="2.4"/><path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10" fill="none" stroke="#171a22" stroke-width="2.6"/></svg>',
  leanB: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 17a8 8 0 1 0-11.5.3"/><path d="M3.5 13.5 6.4 17.4 10.6 15"/></svg>',
  leanF: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17a8 8 0 1 1 11.5.3"/><path d="M20.5 13.5 17.6 17.4 13.4 15"/></svg>'
};

/* ------------------------------------------------------------------ */
/* Page skeleton                                                        */
/* ------------------------------------------------------------------ */
UI.init = function () {
  var ui = $('ui');
  ui.innerHTML =
    '<section id="s-title" class="screen">' +
      '<div class="logo"><div class="slab"><b>RIDGE</b><b>RIOT</b></div><div class="tread"></div><div class="tag">Dirt, air and bad landings</div></div>' +
      '<div class="menu"><button class="btn go" data-act="tracks">Ride</button><button class="btn" data-act="garage">Garage</button><button class="btn" data-act="settings">Settings</button></div>' +
      '<div class="foot" id="foot"></div>' +
      '<button class="round fs" id="fsbtn" data-act="full" aria-label="Full screen">' + IC.full + '</button>' +
    '</section>' +
    '<section id="s-tracks" class="screen shade full"><button class="round back" data-act="title" aria-label="Back">' + IC.back + '</button>' +
      '<div class="head"><h2>Pick a track</h2><span class="fill"></span><span class="count" id="tcount"></span></div>' +
      '<div class="tabs" id="tabs"></div><div class="wsub" id="wsub"></div><div class="grid" id="grid"></div><div class="lockmsg" id="lockmsg"></div>' +
    '</section>' +
    '<section id="s-garage" class="screen shade full"><button class="round back" data-act="garageBack" aria-label="Back">' + IC.back + '</button>' +
      '<div class="head"><h2>Garage</h2><span class="fill"></span><span class="count" id="gcount"></span></div>' +
      '<div class="stageL"><canvas id="gcv"></canvas></div>' +
      '<div class="pick"><button class="round" data-act="gprev" aria-label="Previous bike">' + IC.back + '</button><div class="dots" id="dots"></div><button class="round" data-act="gnext" aria-label="Next bike">' + IC.next + '</button></div>' +
      '<div class="spec plate" id="spec"></div>' +
    '</section>' +
    '<section id="s-settings" class="screen shade full"><button class="round back" data-act="settingsBack" aria-label="Back">' + IC.back + '</button>' +
      '<div class="head"><h2>Settings</h2></div><div class="cols" id="setcols"></div>' +
    '</section>' +
    '<section id="s-hud" class="screen"><div id="touch"></div>' +
      '<div class="howto" id="howto"><div class="divide"></div>' +
        '<div class="half l">Left side<small>lean back</small></div><div class="half r">Right side<small>lean forward</small></div>' +
        '<div class="mid plate" id="howmid">Touch to start<small>Hold both sides to brake. The throttle looks after itself.</small></div></div>' +
      '<div class="pads" id="pads"><div class="pad l" id="padL">' + IC.leanB + '</div><div class="pad r" id="padR">' + IC.leanF + '</div></div>' +
      '<div class="tl"><button class="round" data-act="pause" aria-label="Pause">' + IC.pause + '</button><button class="round" data-act="retry" aria-label="Restart">' + IC.redo + '</button></div>' +
      '<div class="clock plate"><div class="t" id="clk">0.00</div><div class="goal" id="goal"></div></div>' +
      '<div class="boost" id="boost"><i id="boostI"></i></div>' +
      '<div class="tr"><div class="tn" id="hname"></div><div id="hbest"></div></div>' +
      '<div class="wipe plate" id="wipe"><b id="wipeT">Wiped out</b><span id="wipeS">Tap to go again</span></div>' +
    '</section>' +
    '<section id="s-pause" class="screen shade full"><div class="center"><h2>Paused</h2>' +
      '<button class="btn go" data-act="resume">Keep riding</button><button class="btn" data-act="retry">Restart</button><button class="btn" data-act="quit">Tracks</button></div>' +
    '</section>' +
    '<section id="s-results" class="screen"><div class="res plate" id="res"></div></section>' +
    '<div id="toast" class="plate"></div>' +
    '<div id="rotate"><div class="ph"></div><div>Turn your phone sideways</div></div>';

  ui.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b || b.disabled) return;
    Au.unlock(); afterUnlock();
    act(b.getAttribute('data-act'), b);
  });
  var touch = $('touch');
  touch.addEventListener('pointerdown', function (e) {
    Au.unlock(); afterUnlock();
    e.preventDefault();
    if (G.state === 'crash') { if (G.endT > 0.4) { Au.ui('tap'); G.retry(); } return; }
    G.input.touch[e.pointerId] = e.clientX;
    try { touch.setPointerCapture(e.pointerId); } catch (x) {}
  });
  touch.addEventListener('pointermove', function (e) { if (e.pointerId in G.input.touch) G.input.touch[e.pointerId] = e.clientX; });
  function up(e) { delete G.input.touch[e.pointerId]; }
  touch.addEventListener('pointerup', up); touch.addEventListener('pointercancel', up); touch.addEventListener('lostpointercapture', up);
  // stop the page scrolling, zooming or popping up menus. (touchstart is left alone: cancelling it would also cancel button taps.)
  ['touchmove', 'gesturestart', 'gesturechange', 'contextmenu', 'dblclick'].forEach(function (n) {
    doc.addEventListener(n, function (e) { if (!(e.target.closest && e.target.closest('.cols'))) e.preventDefault(); }, { passive: false });
  });
  root.addEventListener('keydown', onKey);
  root.addEventListener('keyup', function (e) { key(e.code, false); });
  root.addEventListener('blur', clearInput);
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) { clearInput(); if (G.state === 'run' || G.state === 'ready') G.pause(true); Au.suspend(); G.hidden = true; }
    else { G.hidden = false; Au.resume(); }
  });
  root.addEventListener('resize', UI.resize);
  if (root.visualViewport) root.visualViewport.addEventListener('resize', UI.resize);
  root.addEventListener('orientationchange', function () { setTimeout(UI.resize, 250); });
  G.onSlow = function () { if (autoScale > 0.8) { autoScale = Math.max(0.8, autoScale * 0.8); R.quality = 0.6; UI.resize(); } };
  var canFull = doc.documentElement.requestFullscreen && !/iP(hone|od)/.test(navigator.userAgent);
  if (!canFull) $('fsbtn').style.display = 'none';
  UI.resize();
};

var unlockedOnce = false;
function afterUnlock() {
  if (unlockedOnce || !Au.ready()) return;
  unlockedOnce = true;
  Au.setVolumes(Store.data.settings);
  if (G.track) Au.setWorld(G.track.worldIndex);
  if (G.attract && Store.data.settings.music > 0) Au.music(true);
  // phones only hand out tilt readings after a touch, so ask again here
  if (Store.data.settings.tilt) G.enableTilt(function (ok) { if (!ok) { Store.data.settings.tilt = false; } });
}
function clearInput() { var i = G.input; i.kL = i.kR = i.kB = false; for (var k in i.touch) delete i.touch[k]; }
function key(code, down) {
  var i = G.input;
  if (code === 'KeyA' || code === 'ArrowLeft') i.kL = down;
  else if (code === 'KeyD' || code === 'ArrowRight') i.kR = down;
  else if (code === 'KeyS' || code === 'ArrowDown' || code === 'Space') i.kB = down;
  else return false;
  return true;
}
function onKey(e) {
  if (e.repeat) { if (UI.cur === 'hud') e.preventDefault(); return; }
  Au.unlock(); afterUnlock();
  var c = e.code;
  if (UI.cur === 'hud') {
    if (G.state === 'crash') { if (G.endT > 0.4 && (c === 'Enter' || c === 'Space' || c === 'KeyR' || key(c, false) || c === 'KeyW' || c === 'ArrowUp')) G.retry(); e.preventDefault(); return; }
    if (key(c, true)) { e.preventDefault(); return; }
    if (c === 'KeyR') G.retry();
    else if (c === 'Escape' || c === 'KeyP') G.pause(true);
    return;
  }
  if (UI.cur === 'pause') { if (c === 'Escape' || c === 'KeyP' || c === 'Enter') act('resume'); else if (c === 'KeyR') act('retry'); return; }
  if (UI.cur === 'results') { if (c === 'Enter' || c === 'Space') { var b = doc.querySelector('#res .btn.go'); if (b) b.click(); e.preventDefault(); } else if (c === 'KeyR') act('retry'); else if (c === 'Escape') act('quit'); return; }
  if (UI.cur === 'garage') { if (c === 'ArrowLeft' || c === 'KeyA') act('gprev'); else if (c === 'ArrowRight' || c === 'KeyD') act('gnext'); else if (c === 'Enter') { var s = doc.querySelector('#spec .btn'); if (s && !s.disabled) s.click(); } else if (c === 'Escape') act('garageBack'); return; }
  if (UI.cur === 'tracks') { if (c === 'Escape') act('title'); else if (c === 'ArrowLeft' || c === 'ArrowRight') { UI.world = (UI.world + (c === 'ArrowLeft' ? 4 : 1)) % 5; Au.ui('swipe'); UI.tracks(); } return; }
  if (UI.cur === 'settings') { if (c === 'Escape') act('settingsBack'); return; }
  if (UI.cur === 'title') { if (c === 'Enter' || c === 'Space') act('tracks'); }
}

/* ------------------------------------------------------------------ */
/* Sizing                                                               */
/* ------------------------------------------------------------------ */
var autoScale = 2;
UI.resize = function () {
  var w = root.innerWidth, h = root.innerHeight;
  var q = Store.data.settings.quality, dpr = root.devicePixelRatio || 1;
  var sc = q === 'low' ? 1 : q === 'high' ? Math.min(dpr, 3) : Math.min(dpr, autoScale);
  var cap = q === 'high' ? 4.2e6 : q === 'low' ? 1.0e6 : 2.4e6;
  if (w * h * sc * sc > cap) sc = Math.sqrt(cap / (w * h));
  R.quality = q === 'low' ? 0.5 : (q === 'high' ? 1 : Math.min(1, R.quality || 1));
  R.resize(w, h, sc);
  var portrait = h > w * 1.05 && w < 900;
  $('rotate').className = portrait ? 'on' : '';
  if (portrait && (G.state === 'run' || G.state === 'ready')) G.pause(true);
  if (UI.cur === 'garage') UI.garageDraw();
};

/* ------------------------------------------------------------------ */
/* Buttons                                                              */
/* ------------------------------------------------------------------ */
function act(a, el) {
  switch (a) {
    case 'tracks': Au.ui('go'); UI.world = Math.floor((Store.data.last || 0) / 8); if (!P.worldOpen(UI.world)) UI.world = 0; UI.tracks(); UI.show('tracks'); break;
    case 'garage': Au.ui('go'); UI.from = UI.cur; UI.gi = RR.BIKE[Store.data.bike].index; UI.show('garage'); UI.garage(); break;
    case 'settings': Au.ui('go'); UI.from = UI.cur; UI.settings(); UI.show('settings'); break;
    case 'title': Au.ui('back'); UI.title(); break;
    case 'garageBack': Au.ui('back'); if (UI.from === 'results') { UI.show('results'); } else UI.title(); break;
    case 'settingsBack': Au.ui('back'); Store.save(); UI.title(); break;
    case 'full': Au.ui('tap'); fullscreen(); break;
    case 'world': Au.ui('swipe'); UI.world = +el.getAttribute('data-i'); UI.tracks(); break;
    case 'track':
      var ti = +el.getAttribute('data-i');
      if (!P.trackOpen(ti)) { Au.ui('no'); break; }
      Au.ui('go'); UI.show('hud'); G.play(ti); break;
    case 'gprev': Au.ui('swipe'); UI.gi = (UI.gi + RR.BIKES.length - 1) % RR.BIKES.length; UI.garage(); break;
    case 'gnext': Au.ui('swipe'); UI.gi = (UI.gi + 1) % RR.BIKES.length; UI.garage(); break;
    case 'gdot': Au.ui('swipe'); UI.gi = +el.getAttribute('data-i'); UI.garage(); break;
    case 'gsel':
      var d = RR.BIKES[UI.gi];
      if (!P.bikeOpen(d)) { Au.ui('no'); break; }
      Store.data.bike = d.id; Store.save(); Au.ui('go'); UI.garage();
      if (G.attract) G.menu();
      break;
    case 'pause': Au.ui('tap'); G.pause(true); break;
    case 'resume': Au.ui('tap'); G.pause(false); break;
    case 'retry': Au.ui('tap'); if (G.state === 'pause') G.state = 'ready'; UI.show('hud'); G.retry(); break;
    case 'quit': Au.ui('back'); G.menu(); UI.world = G.result && UI.cur === 'results' ? Math.floor(G.result.track / 8) : Math.floor((Store.data.last || 0) / 8); UI.tracks(); UI.show('tracks'); break;
    case 'nextTrack': Au.ui('go'); UI.show('hud'); G.play(+el.getAttribute('data-i')); break;
    case 'sw': toggle(el); break;
    case 'seg': Store.data.settings.quality = el.getAttribute('data-v'); Au.ui('toggle'); Store.save(); autoScale = 2; R.quality = 1; UI.resize(); UI.settings(); break;
    case 'wipeAll':
      if (el.getAttribute('data-sure')) { Store.reset(); Au.ui('no'); UI.settings(); UI.toast('Progress wiped'); }
      else { el.setAttribute('data-sure', '1'); el.textContent = 'Tap again to wipe everything'; Au.ui('tap'); }
      break;
  }
}
function fullscreen() {
  try {
    if (doc.fullscreenElement) doc.exitFullscreen();
    else doc.documentElement.requestFullscreen().then(function () { try { root.screen.orientation.lock('landscape').catch(function () {}); } catch (e) {} }).catch(function () {});
  } catch (e) {}
}
UI.show = function (name) {
  UI.cur = name;
  ['title', 'tracks', 'garage', 'settings', 'hud', 'pause', 'results'].forEach(function (n) { $('s-' + n).className = $('s-' + n).className.replace(/ ?\bon\b/, '') + (n === name ? ' on' : ''); });
  if (name !== 'garage' && gTimer) { root.cancelAnimationFrame(gTimer); gTimer = 0; }
};
UI.title = function () {
  $('foot').textContent = 'Every bike is earned by riding. No ads, nothing to buy. ' + P.total() + ' of ' + RR.TRACK_COUNT * 3 + ' stars so far.';
  UI.show('title');
};
var toastT = 0;
UI.toast = function (text) { var t = $('toast'); t.textContent = text; t.className = 'plate on'; clearTimeout(toastT); toastT = setTimeout(function () { t.className = 'plate'; }, 2600); };
UI.toastBikes = function (list) { Au.unlocked(); UI.toast('New bike in the garage: ' + list.map(function (d) { return d.name; }).join(', ')); Store.save(); };

/* ------------------------------------------------------------------ */
/* Track select                                                         */
/* ------------------------------------------------------------------ */
UI.tracks = function () {
  var w = UI.world, tot = P.total(), h = '', i;
  $('tcount').innerHTML = '<i class="star" style="color:#f2c230"></i>' + tot + ' / ' + RR.TRACK_COUNT * 3;
  RR.WORLDS.forEach(function (W, k) {
    var open = P.worldOpen(k), got = 0; for (i = k * 8; i < k * 8 + 8; i++) got += P.starsFor(i);
    h += '<button class="tab' + (k === w ? ' on' : '') + (open ? '' : ' locked') + '" data-act="world" data-i="' + k + '"><b>' + esc(W.name) + '</b><i>' + (open ? got + ' of 24 stars' : 'Opens at ' + W.need + ' stars') + '</i></button>';
  });
  $('tabs').innerHTML = h;
  var W = RR.WORLDS[w], T = R.THEMES[w], wopen = P.worldOpen(w);
  $('wsub').textContent = W.sub + '.';
  h = '';
  for (i = w * 8; i < w * 8 + 8; i++) {
    var info = RR.trackInfo(i), open = P.trackOpen(i), best = Store.data.best[i];
    h += '<button class="card' + (open ? '' : ' locked') + '" data-act="track" data-i="' + i + '" aria-label="' + esc(info.name) + (open ? '' : ', locked') + '">' +
      '<canvas data-thumb="' + i + '" width="240" height="90"></canvas><span class="num">' + (info.num + 1) + '</span><span class="nm">' + esc(info.name) + '</span>' +
      (open ? '<span class="st">' + stars(P.starsFor(i)) + '</span>' + (best ? '<span class="bt">' + fmt(best) + '</span>' : '') : '<span class="lock">' + IC.lock + '</span>') + '</button>';
  }
  $('grid').innerHTML = h;
  var cvs = $('grid').querySelectorAll('canvas');
  for (i = 0; i < cvs.length; i++) R.trackThumb(cvs[i], RR.getTrack(+cvs[i].getAttribute('data-thumb')), T.ground[0], T.crust === '#f6fbff' ? '#9db8e8' : T.crust);
  $('lockmsg').textContent = wopen ? (P.worldCount(w) < 8 ? 'Finish a track to open the next one.' : '') : W.name + ' opens at ' + W.need + ' stars. You have ' + tot + '.';
};

/* ------------------------------------------------------------------ */
/* Garage                                                               */
/* ------------------------------------------------------------------ */
var gTimer = 0, gSpin = 0, gBounce = 0;
UI.garage = function () {
  var d = RR.BIKES[UI.gi], open = P.bikeOpen(d), st = RR.bikeStats(d), h, k, own = 0;
  RR.BIKES.forEach(function (b) { if (P.bikeOpen(b)) own++; });
  $('gcount').textContent = own + ' of ' + RR.BIKES.length + ' bikes';
  h = '';
  RR.BIKES.forEach(function (b, i) { h += '<button class="dot' + (P.bikeOpen(b) ? ' own' : '') + (b.id === Store.data.bike ? ' sel' : '') + (i === UI.gi ? ' cur' : '') + '" data-act="gdot" data-i="' + i + '" aria-label="' + esc(b.name) + '"></button>'; });
  $('dots').innerHTML = h;
  h = '<h3>' + esc(d.name) + '</h3><div class="tag">' + esc(d.tag) + '</div><p>' + esc(d.blurb) + '</p><div class="bars">';
  for (k in st) h += '<span>' + k + '</span><div class="bar"><i style="width:' + Math.round(st[k] * 100) + '%"></i></div>';
  h += '</div><div class="fill"></div>';
  if (open) h += d.id === Store.data.bike ? '<button class="btn" disabled>This is your ride</button>' : '<button class="btn go" data-act="gsel">Ride this one</button>';
  else {
    var n = P.bikeNeed(d);
    h += '<div class="need">' + esc(n.text) + '. You have ' + (n.dec ? n.have.toFixed(1) : n.have) + ' of ' + n.need + (n.unit === 's' ? ' seconds' : '') + '.<div class="bar"><i style="width:' + Math.round(Math.min(1, n.have / n.need) * 100) + '%"></i></div></div><button class="btn" disabled>Locked</button>';
  }
  $('spec').innerHTML = h;
  gBounce = 1;
  if (!gTimer) gLoop();
};
function gLoop() {
  gTimer = root.requestAnimationFrame(gLoop);
  if (UI.cur !== 'garage') return;
  gSpin -= 0.035; gBounce *= 0.9;
  UI.garageDraw();
}
UI.garageDraw = function () {
  var cv = $('gcv'); if (!cv || !cv.clientWidth) return;
  var d = RR.BIKES[UI.gi], dpr = Math.min(2, root.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  var c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  var span = d.wb + d.rr + d.rf + 0.5, S = Math.min(w / span, h / 2.25), ox = (w - span * S) * 0.5 + (d.rr + 0.25) * S, oy = h - 0.2 * S;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(ox + d.wb * 0.5 * S, oy + 0.02 * S, span * 0.48 * S, 0.09 * S, 0, 0, 6.3); c.fill();
  c.setTransform(dpr * S, 0, 0, -dpr * S, dpr * ox, dpr * oy);
  var b = Math.sin(gBounce * 9) * gBounce * 0.05, open = P.bikeOpen(d);
  A.bike(c, d, { RA: [0, d.rr - b * 0.4], FA: [d.wb, d.rf - b * 0.4], spinR: gSpin, spinF: gSpin * d.rr / d.rf, lp: 0, stand: 0, crouch: b * 4, rider: true });
  if (!open) {     // locked bikes are shown as a dark shape
    c.globalCompositeOperation = 'source-atop'; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(23,26,34,0.86)'; c.fillRect(0, 0, cv.width, cv.height); c.globalCompositeOperation = 'source-over';
  }
};

/* ------------------------------------------------------------------ */
/* Settings                                                             */
/* ------------------------------------------------------------------ */
function toggle(el) {
  var k = el.getAttribute('data-k'), s = Store.data.settings;
  if (k === 'tilt' && !s.tilt) {
    G.enableTilt(function (ok) { s.tilt = !!ok; Store.save(); UI.settings(); UI.toast(ok ? 'Tilt is on. Hold the phone how you like, then start a run.' : 'This device did not give a tilt reading.'); });
    return;
  }
  s[k] = !s[k]; Au.ui('toggle'); Store.save(); UI.settings();
  if (k === 'unlockAll') UI.toast(s.unlockAll ? 'Everything is open' : 'Back to what you have earned');
}
UI.settings = function () {
  var s = Store.data.settings, st = Store.data.stats;
  function sw(k, label, sub) { return '<div class="row"><label>' + label + (sub ? '<small>' + sub + '</small>' : '') + '</label><button class="sw' + (s[k] ? ' on' : '') + '" data-act="sw" data-k="' + k + '" role="switch" aria-checked="' + !!s[k] + '" aria-label="' + label + '"></button></div>'; }
  function sl(k, label) { return '<div class="row"><label for="r-' + k + '">' + label + '</label><input id="r-' + k + '" type="range" min="0" max="100" value="' + Math.round(s[k] * 100) + '" data-k="' + k + '"></div>'; }
  function seg(v, label) { return '<button data-act="seg" data-v="' + v + '" class="' + (s.quality === v ? 'on' : '') + '">' + label + '</button>'; }
  $('setcols').innerHTML =
    sl('engine', 'Engine volume') + sw('tilt', 'Tilt to lean', 'Lean by tilting the phone. Any touch brakes.') +
    sl('sfx', 'Effects volume') + sw('hints', 'Show the lean buttons') +
    sl('music', 'Menu music') + sw('ghost', 'Race the ghost of your best run') +
    '<div class="row"><label>Picture quality</label><span class="seg">' + seg('auto', 'Auto') + seg('high', 'Sharp') + seg('low', 'Fast') + '</span></div>' + sw('buzz', 'Vibrate on hard landings', 'Android phones only.') +
    sw('unlockAll', 'Unlock everything', 'All tracks and bikes, no questions. Your real progress is kept.') +
    '<div class="row"><label>Start over<small>' + st.finishes + ' finishes, ' + st.crashes + ' crashes, ' + st.flips + ' flips landed</small></label><button class="btn small red" data-act="wipeAll">Wipe progress</button></div>' +
    '<div class="how">Touch the right side of the screen to lean forward and the left side to lean back. Hold both to brake. On a keyboard use D or the right arrow, A or the left arrow, and S or the down arrow to brake. R restarts, P pauses. ' +
    'Land a flip and you get a short boost, which is how the fastest times are set. Your helmet touching anything ends the run. No sound on an iPhone? Flip the ring switch off silent.</div>';
  var rs = $('setcols').querySelectorAll('input[type=range]');
  for (var i = 0; i < rs.length; i++) rs[i].oninput = function () {
    var k = this.getAttribute('data-k'); s[k] = this.value / 100; Au.setVolumes(s);
    if (k === 'music') Au.music(s.music > 0 && G.attract); else if (k === 'sfx') Au.ui('tap'); else Au.ui('toggle');
  };
};

/* ------------------------------------------------------------------ */
/* During a run                                                         */
/* ------------------------------------------------------------------ */
var lastClk = '', lastGoal = -1, lastPads = '';
UI.onReset = function () {
  var i = G.track.index, best = Store.data.best[i], info = RR.trackInfo(i);
  $('hname').textContent = info.name;
  $('hbest').textContent = best ? 'Best ' + fmt(best) : 'No time yet';
  $('wipe').className = 'wipe plate';
  var first = Store.data.stats.runs <= 3, tilt = Store.data.settings.tilt;
  $('howto').className = 'howto on' + (first && !tilt ? '' : ' brief');
  var hv = $('howto').querySelectorAll('.half, .divide');
  for (var k = 0; k < hv.length; k++) hv[k].style.display = first && !tilt ? '' : 'none';
  var go = 'ontouchstart' in root ? 'Touch to start' : 'Press a key to start';
  var tip = tilt ? 'Tilt to lean. Any touch brakes.' : (info.tip || (first ? 'Hold both sides to brake. The throttle looks after itself.' : ''));
  $('howmid').innerHTML = go + (tip ? '<small>' + esc(tip) + '</small>' : '');
  $('pads').className = 'pads' + (Store.data.settings.hints && !tilt ? '' : ' off');
  lastGoal = -1; lastClk = '';
};
UI.onStart = function () { $('howto').className = 'howto'; };
UI.onCrash = function (cause) {
  var words = { head: 'Wiped out', water: 'Splash', ice: 'Ice bath', lava: 'Toasted', fall: 'Long way down' };
  $('wipeT').textContent = words[cause] || 'Wiped out';
  $('wipeS').textContent = 'ontouchstart' in root ? 'Tap to go again' : 'Press R to go again';
  setTimeout(function () { if (G.state === 'crash') $('wipe').className = 'wipe plate on'; }, 420);
};
UI.onFinish = function () {};
UI.hud = function (g, In) {
  if (UI.cur !== 'hud' || !g.sim || g.attract) return;
  var s = g.sim, i = g.track.index, st = RR.STAR_TIMES[i];
  var txt = fmt(s.finished ? s.finishTime : s.time);
  if (txt !== lastClk) { $('clk').textContent = txt; lastClk = txt; }
  var tier = s.time <= st[0] ? 3 : s.time <= st[1] ? 2 : 1;
  if (tier !== lastGoal) { lastGoal = tier; $('goal').innerHTML = stars(tier) + '<span>' + (tier === 3 ? 'under ' + fmt(st[0]) : tier === 2 ? 'under ' + fmt(st[1]) : 'just finish') + '</span>'; }
  var pads = (In.L ? 'L' : '') + (In.R ? 'R' : '');
  if (pads !== lastPads) { lastPads = pads; $('padL').className = 'pad l' + (In.L ? ' on' : ''); $('padR').className = 'pad r' + (In.R ? ' on' : ''); $('pads').className = 'pads' + (Store.data.settings.hints && !Store.data.settings.tilt ? '' : ' off') + (In.L && In.R ? ' brake' : ''); }
  var bo = $('boost');
  if (s.boost > 0) { bo.style.opacity = 1; $('boostI').style.width = Math.min(100, s.boost / 3.2 * 100) + '%'; } else if (bo.style.opacity !== '0') bo.style.opacity = 0;
};

UI.results = function (r) {
  var i = r.track, info = RR.trackInfo(i), st = RR.STAR_TIMES[i], h, k;
  var next = i + 1 < RR.TRACK_COUNT && P.trackOpen(i + 1) ? i + 1 : -1;
  h = '<div class="tn">' + esc(RR.WORLDS[info.world].name) + ' ' + (info.num + 1) + ', ' + esc(info.name) + '</div><div class="time">' + fmt(r.time) + '</div>' +
      '<div class="big"><i class="star" id="rs0"></i><i class="star" id="rs1"></i><i class="star" id="rs2"></i></div>';
  var line;
  if (r.best && r.old) line = '<b>New best</b> ' + fmt(r.old - r.time) + ' quicker than before';
  else if (r.best) line = '<b>First finish</b>';
  else line = 'Your best is ' + fmt(r.old) + ', this was ' + fmt(r.time - r.old) + ' off it';
  h += '<div class="line">' + line + '</div>';
  h += '<div class="line">' + (r.stars === 3 ? 'All three stars. Nothing left to prove here.' : r.stars === 2 ? 'Three stars needs under ' + fmt(st[0]) + '.' : 'Two stars needs under ' + fmt(st[1]) + ', three needs under ' + fmt(st[0]) + '.') + '</div>';
  for (k = 0; k < r.bikes.length; k++) h += '<div class="unl">New bike in the garage: ' + esc(r.bikes[k].name) + '</div>';
  for (k = 0; k < r.worlds.length; k++) h += '<div class="unl">New world open: ' + esc(r.worlds[k].name) + '</div>';
  h += '<div class="btns">' + (next >= 0 ? '<button class="btn go" data-act="nextTrack" data-i="' + next + '">Next track</button>' : '') +
       '<button class="btn' + (next >= 0 ? '' : ' go') + '" data-act="retry">Ride it again</button><button class="btn small" data-act="garage">Garage</button><button class="btn small" data-act="quit">Tracks</button></div>';
  $('res').innerHTML = h;
  UI.show('results');
  for (k = 0; k < r.stars; k++) (function (n) { setTimeout(function () { var e = $('rs' + n); if (e && UI.cur === 'results') { e.className = 'star on'; Au.star(n); } }, 350 + n * 330); })(k);
  setTimeout(function () { if (UI.cur !== 'results') return; if (r.bikes.length || r.worlds.length) Au.unlocked(); else if (r.best && r.old) Au.newBest(); }, 350 + r.stars * 330 + 150);
};

/* ------------------------------------------------------------------ */
RR.boot = function () {
  Store.load();
  P.claim();
  R.init($('stage'));
  UI.init();
  G.menu();
  UI.title();
  root.requestAnimationFrame(G.frame);
};
})(typeof window !== 'undefined' ? window : globalThis);
