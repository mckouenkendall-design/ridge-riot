/* Ridge Riot: menus, the on-screen display during a run, and the event wiring
   (touch, keyboard, resize). Screens are plain HTML laid over the game canvas. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var G = RR.Game, R = RR.Render, Au = RR.Audio, Store = RR.Store, P = RR.Progress, A = RR.Art;
var doc = root.document;
var UI = RR.UI = { cur: '', world: 0, gi: 0, gtab: 'bikes', pick: null };
function $(id) { return doc.getElementById(id); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function fmt(t) { return t.toFixed(2); }
function stars(n, cls) { var s = '<span class="stars ' + (cls || '') + '">'; for (var i = 0; i < 3; i++) s += '<i class="star' + (i < n ? ' on' : '') + '"></i>'; return s + '</span>'; }
var NUG = '<i class="nug"></i>';

var IC = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4 7 12l8 8"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="#f6f2e7"><rect x="5" y="4" width="5" height="16" rx="1.2"/><rect x="14" y="4" width="5" height="16" rx="1.2"/></svg>',
  redo: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 3.5V8h-4.5"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="#171a22"><rect x="4" y="10" width="16" height="11" rx="2.4"/><path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10" fill="none" stroke="#171a22" stroke-width="2.6"/></svg>',
  gas: '<svg viewBox="0 0 24 24" fill="#f6f2e7"><path d="M5 4.5v15a1 1 0 0 0 1.5.9l13-7.5a1 1 0 0 0 0-1.8l-13-7.5A1 1 0 0 0 5 4.5z"/></svg>',
  brake: '<svg viewBox="0 0 24 24" fill="#f6f2e7"><rect x="4.5" y="4.5" width="15" height="15" rx="2.6"/></svg>',
  leanB: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 17a8 8 0 1 0-11.5.3"/><path d="M3.5 13.5 6.4 17.4 10.6 15"/></svg>',
  leanF: '<svg viewBox="0 0 24 24" fill="none" stroke="#f6f2e7" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 17a8 8 0 1 1 11.5.3"/><path d="M20.5 13.5 17.6 17.4 13.4 15"/></svg>'
};

/* The name on the title screen is drawn letter by letter rather than set in a font,
   so it looks the same on every phone and computer. */
var GLYPH = {
  R: [80, 'M0 0H52Q78 0 78 30Q78 52 60 58L80 100H50L34 62H28V100H0ZM28 22V40H46Q52 40 52 31Q52 22 46 22Z'],
  I: [28, 'M0 0H28V100H0Z'],
  D: [82, 'M0 0H44Q82 0 82 50Q82 100 44 100H0ZM28 24V76H42Q54 76 54 50Q54 24 42 24Z'],
  G: [82, 'M48 0Q80 0 82 34H54Q52 24 46 24Q28 24 28 50Q28 76 46 76Q54 76 55 66H42V46H82V100H64L61 90Q52 100 40 100Q0 100 0 50Q0 0 48 0Z'],
  E: [72, 'M0 0H70V24H28V38H62V60H28V76H72V100H0Z'],
  O: [84, 'M42 0Q84 0 84 50Q84 100 42 100Q0 100 0 50Q0 0 42 0ZM42 24Q28 24 28 50Q28 76 42 76Q56 76 56 50Q56 24 42 24Z'],
  T: [76, 'M0 0H76V24H52V100H24V24H0Z']
};
function word(text) {
  var x = 0, d = '', i;
  for (i = 0; i < text.length; i++) { var g = GLYPH[text[i]]; d += '<path transform="translate(' + x + ' 0)" d="' + g[1] + '"/>'; x += g[0] + 9; }
  x -= 9;
  return '<svg class="word" viewBox="-20 -2 ' + (x + 22) + ' 104" style="aspect-ratio:' + (x + 22) + '/104" aria-hidden="true"><g transform="skewX(-11)" fill="#171a22" fill-rule="evenodd">' + d + '</g></svg>';
}

/* ------------------------------------------------------------------ */
/* Page skeleton                                                        */
/* ------------------------------------------------------------------ */
UI.init = function () {
  var ui = $('ui');
  ui.innerHTML =
    '<section id="s-title" class="screen">' +
      '<div class="logo" role="img" aria-label="Ridge Riot"><div class="slab">' + word('RIDGE') + word('RIOT') + '</div><div class="tread"></div><div class="tag">Dirt, air and bad landings</div></div>' +
      '<div class="menu"><button class="btn go" data-act="tracks">Ride</button><button class="btn" data-act="garage" id="mgar">Garage</button><button class="btn" data-act="settings">Settings</button></div>' +
      '<div class="foot" id="foot"></div>' +
      '<button class="round fs" id="fsbtn" data-act="full" aria-label="Full screen">' + IC.full + '</button>' +
    '</section>' +
    '<section id="s-tracks" class="screen shade full col">' +
      '<div class="head"><button class="back" data-act="title">' + IC.back + '<span>Back</span></button><h2>Pick a track</h2><span class="fill"></span><span class="count" id="tcount"></span></div>' +
      '<div class="tabs" id="tabs"></div><div class="wsub" id="wsub"></div><div class="grid" id="grid"></div><div class="lockmsg" id="lockmsg"></div>' +
    '</section>' +
    '<section id="s-garage" class="screen shade full col">' +
      '<div class="head"><button class="back" data-act="garageBack">' + IC.back + '<span>Back</span></button><div class="gtabs" id="gtabs"></div><span class="fill"></span><span class="count" id="gnug"></span></div>' +
      '<div class="gbody"><div class="gleft"><canvas id="gcv"></canvas><div class="gcap" id="gcap"></div></div><div class="gright plate" id="gpanel"></div></div>' +
    '</section>' +
    '<section id="s-settings" class="screen shade full col">' +
      '<div class="head"><button class="back" data-act="settingsBack">' + IC.back + '<span>Back</span></button><h2>Settings</h2></div><div class="cols" id="setcols"></div>' +
    '</section>' +
    '<section id="s-hud" class="screen"><div id="touch"></div>' +
      '<div class="howto" id="howto"><div class="mid plate" id="howmid"></div></div>' +
      '<div class="pads" id="pads"><div class="pad b" id="padB">' + IC.leanB + '<span>Lean back</span></div><div class="pad f" id="padF">' + IC.leanF + '<span>Lean fwd</span></div>' +
        '<div class="pad k" id="padK">' + IC.brake + '<span>Brake</span></div><div class="pad g" id="padG">' + IC.gas + '<span>Gas</span></div></div>' +
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
    '<section id="s-geode" class="screen shade full"><canvas id="geocv"></canvas><div class="gehint" id="gehint"></div><div class="gecard plate" id="gecard"></div></section>' +
    '<div id="toast" class="plate"></div>' +
    '<div id="rotate"><div class="ph"></div><div>Turn your phone sideways</div></div>';

  wireTaps(ui);
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
    doc.addEventListener(n, function (e) { if (!(e.target.closest && e.target.closest('.cols, .scroll'))) e.preventDefault(); }, { passive: false });
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

/* Buttons answer to the finger coming up anywhere on (or just beside) them, rather than
   waiting for the browser to decide the touch was a clean "click". A thumb that rolls a
   little as it lands used to be ignored; now it counts.
   Fingers are followed with touch events (the kind every phone has had from the start, and
   the kind phones accept as "the user really did this" for sound and tilt permission);
   a mouse is followed with pointer events. */
var tap = null, lastTap = 0;
function wireTaps(ui) {
  function btn(e) { var b = e.target.closest ? e.target.closest('[data-act]') : null; return b && !b.disabled && !b.hasAttribute('data-click') ? b : null; }
  function clear() { if (tap) { tap.el.classList.remove('down'); tap = null; } }
  function begin(b, id, x, y) { clear(); if (!b) return; tap = { id: id, el: b, x: x, y: y, scroll: !!b.closest('.cols, .scroll') }; b.classList.add('down'); }
  function moved(x, y) { if (tap && tap.scroll && Math.abs(x - tap.x) + Math.abs(y - tap.y) > 12) clear(); }      // that was a scroll, not a tap
  function end(x, y) {
    var b = tap.el, r = b.getBoundingClientRect(), m = 16;
    clear();
    if (x < r.left - m || x > r.right + m || y < r.top - m || y > r.bottom + m) return;
    lastTap = Date.now();
    fire(b);
  }
  function mine(list) { for (var i = 0; tap && i < list.length; i++) if (list[i].identifier === tap.id) return list[i]; return null; }
  ui.addEventListener('touchstart', function (e) { var t = e.changedTouches[0]; begin(btn(e), t.identifier, t.clientX, t.clientY); }, { passive: true });
  ui.addEventListener('touchmove', function (e) { var t = mine(e.changedTouches); if (t) moved(t.clientX, t.clientY); }, { passive: true });
  ui.addEventListener('touchend', function (e) { var t = mine(e.changedTouches); if (t) end(t.clientX, t.clientY); });
  ui.addEventListener('touchcancel', clear);
  ui.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch' || e.button) return; begin(btn(e), 'm' + e.pointerId, e.clientX, e.clientY); });
  ui.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch' && tap && tap.id === 'm' + e.pointerId) moved(e.clientX, e.clientY); });
  ui.addEventListener('pointerup', function (e) { if (e.pointerType !== 'touch' && tap && tap.id === 'm' + e.pointerId) end(e.clientX, e.clientY); });
  ui.addEventListener('pointercancel', function (e) { if (e.pointerType !== 'touch') clear(); });
  // A click with no touch just before it is the keyboard (Enter or Space on a button), an accessibility
  // tool, or one of the few buttons left to the browser's own click (marked data-click).
  ui.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!b || b.disabled) return;
    if (!b.hasAttribute('data-click') && Date.now() - lastTap < 600) return;      // the echo of a touch already dealt with
    fire(b);
  });
  // sound can only be switched on from inside a real touch, click or key press
  ['touchend', 'click', 'keydown'].forEach(function (n) { doc.addEventListener(n, function () { Au.unlock(); afterUnlock(); }, true); });
}
function fire(b) { if (!b.isConnected || b.disabled) return; Au.unlock(); afterUnlock(); act(b.getAttribute('data-act'), b); }

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
function clearInput() { var i = G.input; i.kL = i.kR = i.kB = i.kG = false; for (var k in i.touch) delete i.touch[k]; }
function key(code, down) {
  var i = G.input;
  if (code === 'KeyA' || code === 'ArrowLeft') i.kL = down;
  else if (code === 'KeyD' || code === 'ArrowRight') i.kR = down;
  else if (code === 'KeyS' || code === 'ArrowDown') i.kB = down;
  else if (code === 'KeyW' || code === 'ArrowUp') i.kG = down;
  else return false;
  return true;
}
function onKey(e) {
  if (e.repeat) { if (UI.cur === 'hud') e.preventDefault(); return; }
  Au.unlock(); afterUnlock();
  var c = e.code, nW = RR.WORLDS.length;
  if (UI.cur === 'hud') {
    if (G.state === 'crash') { if (G.endT > 0.4 && (c === 'Enter' || c === 'Space' || c === 'KeyR' || key(c, false))) G.retry(); e.preventDefault(); return; }
    if (key(c, true)) { e.preventDefault(); return; }
    if (c === 'KeyR') G.retry();
    else if (c === 'Escape' || c === 'KeyP') G.pause(true);
    return;
  }
  if (UI.cur === 'pause') { if (c === 'Escape' || c === 'KeyP' || c === 'Enter') act('resume'); else if (c === 'KeyR') act('retry'); return; }
  if (UI.cur === 'results') { if (c === 'Enter' || c === 'Space') { var b = doc.querySelector('#res .btn.go'); if (b) fire(b); e.preventDefault(); } else if (c === 'KeyR') act('retry'); else if (c === 'Escape') act('quit'); return; }
  if (UI.cur === 'geode') { if (c === 'Enter' || c === 'Space') { geoHit(); e.preventDefault(); } else if (c === 'Escape' && geo.stage === 'show') act('geoDone'); return; }
  if (UI.cur === 'garage') {
    if (c === 'Escape') act('garageBack');
    else if (UI.gtab === 'bikes' && (c === 'ArrowLeft' || c === 'KeyA' || c === 'ArrowRight' || c === 'KeyD')) { UI.gi = (UI.gi + (c === 'ArrowLeft' || c === 'KeyA' ? RR.BIKES.length - 1 : 1)) % RR.BIKES.length; Au.ui('swipe'); UI.garage(); }
    else if (c === 'Enter') { var s = doc.querySelector('#gpanel .btn'); if (s && !s.disabled) fire(s); }
    return;
  }
  if (UI.cur === 'tracks') { if (c === 'Escape') act('title'); else if (c === 'ArrowLeft' || c === 'ArrowRight') { UI.world = (UI.world + (c === 'ArrowLeft' ? nW - 1 : 1)) % nW; Au.ui('swipe'); UI.tracks(); } return; }
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
  if (UI.cur === 'garage') { UI.garageDraw(); paintTiles(true); }
  UI.measurePads();
};
/* work out where the touch zones divide from where the buttons actually sit */
UI.measurePads = function () {
  var w = root.innerWidth, f = $('padF'), k = $('padK'), b = $('padB'), g = $('padG');
  G.split.l = w * 0.16; G.split.r = w * 0.84;
  if (f && b && f.offsetWidth) { var rb = b.getBoundingClientRect(), rf = f.getBoundingClientRect(), rk = k.getBoundingClientRect(), rg = g.getBoundingClientRect();
    if (rf.left > rb.left) G.split.l = (rb.right + rf.left) / 2; if (rg.left > rk.left) G.split.r = (rk.right + rg.left) / 2; }
};

/* ------------------------------------------------------------------ */
/* Buttons                                                              */
/* ------------------------------------------------------------------ */
function act(a, el) {
  var it, d;
  switch (a) {
    case 'tracks': Au.ui('go'); UI.world = Math.floor((Store.data.last || 0) / 8); if (!P.worldOpen(UI.world)) UI.world = 0; UI.tracks(); UI.show('tracks'); break;
    case 'garage': Au.ui('go'); UI.from = UI.cur; UI.gi = RR.BIKE[Store.data.bike].index; UI.gtab = 'bikes'; UI.pick = null; UI.show('garage'); UI.garage(); break;
    case 'settings': Au.ui('go'); UI.from = UI.cur; UI.settings(); UI.show('settings'); break;
    case 'title': Au.ui('back'); UI.title(); break;
    case 'garageBack': Au.ui('back'); Store.save(); if (G.attract) G.menu(); if (UI.from === 'results') { UI.show('results'); } else UI.title(); break;
    case 'settingsBack': Au.ui('back'); Store.save(); UI.title(); break;
    case 'full': Au.ui('tap'); fullscreen(); break;
    case 'world': Au.ui('swipe'); UI.world = +el.getAttribute('data-i'); UI.tracks(); break;
    case 'track':
      var ti = +el.getAttribute('data-i');
      if (!P.trackOpen(ti)) { Au.ui('no'); break; }
      Au.ui('go'); UI.show('hud'); G.play(ti); break;
    case 'gtab': Au.ui('swipe'); UI.gtab = el.getAttribute('data-t'); UI.pick = null; UI.garage(); break;
    case 'gdot': Au.ui('swipe'); UI.gi = +el.getAttribute('data-i'); UI.garage(); break;
    case 'gsel':
      d = RR.BIKES[UI.gi];
      if (!P.bikeOpen(d)) { Au.ui('no'); break; }
      Store.data.bike = d.id; Store.save(); Au.ui('go'); UI.garage();
      break;
    case 'gitem': Au.ui('swipe'); UI.pick = el.getAttribute('data-id') || ''; delete Store.data.fresh[UI.pick]; UI.garage(); break;
    case 'gwear':
      it = itemOf(UI.gtab, UI.pick); d = RR.BIKES[UI.gi];
      if (it && !P.owns(it)) { Au.ui('no'); break; }
      P.wear(d.id, UI.gtab === 'paint' ? 'paint' : 'rider', it ? it.id : ''); Store.save(); Au.ui('go'); UI.garage();
      break;
    case 'crack': openGeode(); break;
    case 'geoPut':
      it = geo.item; d = RR.BIKE[Store.data.bike];
      if (it) { P.wear(d.id, it.kind, it.id); delete Store.data.fresh[it.id]; Store.save(); UI.toast(it.name + ' is on your ' + d.name); }
      Au.ui('go'); closeGeode(); break;
    case 'geoAgain': openGeode(); break;
    case 'geoDone': Au.ui('back'); closeGeode(); break;
    case 'pause': Au.ui('tap'); G.pause(true); break;
    case 'resume': Au.ui('tap'); G.pause(false); break;
    case 'retry': Au.ui('tap'); if (G.state === 'pause') G.state = 'ready'; UI.show('hud'); G.retry(); break;
    case 'quit': Au.ui('back'); UI.world = G.result && UI.cur === 'results' ? Math.floor(G.result.track / 8) : Math.floor((Store.data.last || 0) / 8); G.menu(); UI.tracks(); UI.show('tracks'); break;
    case 'nextTrack': Au.ui('go'); UI.show('hud'); G.play(+el.getAttribute('data-i')); break;
    case 'sw': toggle(el); break;
    case 'seg': Store.data.settings.quality = el.getAttribute('data-v'); Au.ui('toggle'); Store.save(); autoScale = 2; R.quality = 1; UI.resize(); UI.settings(); break;
    case 'tfeel': Store.data.settings.tiltSens = +el.getAttribute('data-v'); Au.ui('toggle'); Store.save(); UI.settings(); break;
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
var SCREENS = ['title', 'tracks', 'garage', 'settings', 'hud', 'pause', 'results', 'geode'];
UI.show = function (name) {
  UI.cur = name;
  SCREENS.forEach(function (n) { var e = $('s-' + n); e.classList.toggle('on', n === name); });
  if (name !== 'garage' && gTimer) { root.cancelAnimationFrame(gTimer); gTimer = 0; }
};
UI.title = function () {
  var left = P.itemsLeft();
  $('foot').innerHTML = 'Everything is earned by riding. No ads, nothing to buy.<br>' + P.total() + ' of ' + RR.TRACK_COUNT * 3 + ' stars. ' + Store.data.nuggets + ' nuggets. ' + P.ownedCount() + ' of ' + RR.ITEMS.length + ' collected.';
  $('mgar').innerHTML = 'Garage' + (left > 0 && P.canCrack() ? '<i class="dotb" title="A geode is ready"></i>' : '');
  UI.show('title');
};
var toastT = 0;
UI.toast = function (text) { var t = $('toast'); t.textContent = text; t.className = 'plate on'; clearTimeout(toastT); toastT = setTimeout(function () { t.className = "plate"; }, Math.max(2800, text.length * 60)); };
UI.toastBikes = function (list) { Au.unlocked(); UI.toast('New bike in the garage: ' + list.map(function (d) { return d.name; }).join(', ')); Store.save(); };

/* ------------------------------------------------------------------ */
/* Track select                                                         */
/* ------------------------------------------------------------------ */
UI.tracks = function () {
  var w = UI.world, tot = P.total(), h = '', i;
  $('tcount').innerHTML = '<i class="star" style="color:#f2c230"></i>' + tot + ' / ' + RR.TRACK_COUNT * 3;
  RR.WORLDS.forEach(function (W, k) {
    var open = P.worldOpen(k), got = P.worldStars(k);
    h += '<button class="tab' + (k === w ? ' on' : '') + (open ? '' : ' locked') + '" data-act="world" data-i="' + k + '"><b>' + esc(W.name) + '</b><i>' + (open ? got + ' of 24' : 'At ' + W.need + ' stars') + '</i></button>';
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
  for (i = 0; i < cvs.length; i++) R.trackThumb(cvs[i], RR.getTrack(+cvs[i].getAttribute('data-thumb')), T.ground[0], T.crust === '#f6fbff' ? '#9db8e8' : T.id === 'race' ? '#3a3d46' : T.crust);
  $('lockmsg').textContent = wopen ? (P.worldCount(w) < 8 ? 'Finish a track to open the next one.' : P.worldStars(w) < 24 ? 'Three stars on all eight earns a diamond geode.' : '') : W.name + ' opens at ' + W.need + ' stars. You have ' + tot + '.';
};

/* ------------------------------------------------------------------ */
/* Garage: bikes, paint, riders, geodes                                 */
/* ------------------------------------------------------------------ */
var gTimer = 0, gSpin = 0, gBounce = 0, gT = 0, gFrame = 0;
function itemOf(tab, id) { return tab === 'paint' ? RR.PAINT[id] || null : tab === 'riders' ? RR.RIDER[id] || null : null; }
function tierChip(t) { return '<span class="chip t-' + t + '">' + RR.TIER[t].name + '</span>'; }
/* what the bike on show is wearing, counting whatever is being tried on */
function previewLook() {
  var d = RR.BIKES[UI.gi], f = Store.data.fit[d.id] || {}, p = RR.PAINT[f.p] || null, r = RR.RIDER[f.r] || null;
  if (p && !P.owns(p)) p = null; if (r && !P.owns(r)) r = null;
  if (UI.pick != null) { if (UI.gtab === 'paint') p = RR.PAINT[UI.pick] || null; else if (UI.gtab === 'riders') r = RR.RIDER[UI.pick] || null; }
  return { paint: p, rider: r };
}
UI.garage = function () {
  var d = RR.BIKES[UI.gi], open = P.bikeOpen(d), tab = UI.gtab, h = '', own = 0, i, k;
  var free = P.freeGeodes(), ready = P.canCrack();
  [['bikes', 'Bikes'], ['paint', 'Paint'], ['riders', 'Riders'], ['geodes', 'Geodes']].forEach(function (t) {
    h += '<button class="gtab' + (t[0] === tab ? ' on' : '') + '" data-act="gtab" data-t="' + t[0] + '">' + t[1] + (t[0] === 'geodes' && ready ? '<i class="dotb"></i>' : '') + '</button>';
  });
  $('gtabs').innerHTML = h;
  $('gnug').innerHTML = NUG + Store.data.nuggets;
  var f = Store.data.fit[d.id] || {}, look = previewLook();
  $('gcap').innerHTML = '<b>' + esc(d.name) + '</b>' + (tab === 'bikes' ? '<i>' + esc(d.tag) + '</i>' + esc(d.blurb) : (look.paint ? esc(look.paint.name) + ' paint' : 'Stock paint') + ', ' + (look.rider ? esc(look.rider.name) : 'stock rider') + '.');
  h = '';
  if (tab === 'bikes') {
    RR.BIKES.forEach(function (b) { if (P.bikeOpen(b)) own++; });
    h += '<div class="tiles t5">';
    RR.BIKES.forEach(function (b, n) { h += '<button class="tile' + (P.bikeOpen(b) ? '' : ' locked') + (b.id === Store.data.bike ? ' sel' : '') + (n === UI.gi ? ' cur' : '') + '" data-act="gdot" data-i="' + n + '" aria-label="' + esc(b.name) + '"><canvas data-bike="' + n + '"></canvas></button>'; });
    h += '</div><div class="info"><div class="nm"><h3>' + esc(d.name) + '</h3></div><div class="bars">';
    var st = RR.bikeStats(d);
    for (k in st) h += '<span>' + k + '</span><div class="bar"><i style="width:' + Math.round(st[k] * 100) + '%"></i></div>';
    h += '</div>';
    if (open) h += '<div class="need own">You have ' + own + ' of the ' + RR.BIKES.length + ' bikes.</div>' + (d.id === Store.data.bike ? '<button class="btn" disabled>This is your ride</button>' : '<button class="btn go" data-act="gsel">Ride this one</button>');
    else { var n = P.bikeNeed(d); h += '<div class="need">' + esc(n.text) + '. ' + esc(n.now) + '.<div class="bar"><i style="width:' + Math.round(Math.min(1, n.k) * 100) + '%"></i></div></div><button class="btn" disabled>Locked</button>'; }
    h += '</div>';
  } else if (tab === 'paint' || tab === 'riders') {
    var list = tab === 'paint' ? RR.PAINTS : RR.RIDERS, key = tab === 'paint' ? 'p' : 'r', worn = f[key] || '', cur = UI.pick == null ? worn : UI.pick, it = itemOf(tab, cur);
    if (it && UI.pick == null && !P.owns(it)) { cur = ''; it = null; }
    h += '<div class="tiles ' + (tab === 'paint' ? 't9' : 't7') + '">';
    h += '<button class="tile item' + (cur === '' ? ' cur' : '') + (worn === '' ? ' sel' : '') + '" data-act="gitem" data-id="" aria-label="Stock"><canvas data-item=""></canvas></button>';
    list.forEach(function (x) { var o = P.owns(x); h += '<button class="tile item t-' + x.tier + (o ? '' : ' locked') + (x.id === cur ? ' cur' : '') + (x.id === worn && o ? ' sel' : '') + '" data-act="gitem" data-id="' + x.id + '" aria-label="' + esc(x.name) + '"><canvas data-item="' + x.id + '"></canvas>' + (Store.data.fresh[x.id] && o ? '<i class="new">New</i>' : '') + (o ? '' : '<span class="lock">' + IC.lock + '</span>') + '</button>'; });
    h += '</div><div class="info">';
    if (!it) h += '<div class="nm"><h3>Stock ' + (tab === 'paint' ? 'paint' : 'rider') + '</h3></div><p>' + (tab === 'paint' ? 'The colours the ' + esc(d.name) + ' left the factory in.' : 'The rider who comes with the ' + esc(d.name) + '.') + '</p>';
    else h += '<div class="nm"><h3>' + esc(it.name) + '</h3>' + tierChip(it.tier) + '</div><p>' + (it.blurb ? esc(it.blurb) : paintWords(it)) + '</p>';
    if (!open) h += '<button class="btn" disabled>You do not have this bike yet</button>';
    else if (it && !P.owns(it)) h += '<button class="btn" disabled>Found in geodes</button>';
    else if (cur === worn) h += '<button class="btn" disabled>On the ' + esc(d.name) + '</button>';
    else h += '<button class="btn go" data-act="gwear">Put it on the ' + esc(d.name) + '</button>';
    h += '</div>';
  } else {
    var left = P.itemsLeft(), E = RR.ECON, dd = Store.data;
    h += '<div class="geo"><div class="gl"><canvas id="georock"></canvas></div><div class="gr">';
    h += '<p><b>Crack one open for a paint job or a rider.</b> You never get the same thing twice.</p>';
    h += '<div class="odds">'; RR.TIERS.slice().reverse().forEach(function (t) { h += '<span class="chip t-' + t.id + '">' + t.name + ' ' + t.odds + '%</span>'; }); h += '</div>';
    h += '<p class="sm">' + P.ownedCount() + ' of ' + RR.ITEMS.length + ' collected. Nuggets come from finishing tracks, new stars and landed flips. Finish a whole world for a gold geode. Three stars on all of it earns a diamond one.</p>';
    h += '</div></div>';
    if (left <= 0) h += '<button class="btn" disabled>You have the lot</button>';
    else if (dd.geodes.diamond > 0) h += '<button class="btn go" data-act="crack">Crack a diamond geode (' + dd.geodes.diamond + ' waiting)</button>';
    else if (dd.geodes.gold > 0) h += '<button class="btn go" data-act="crack">Crack a gold geode (' + dd.geodes.gold + ' waiting)</button>';
    else if (dd.nuggets >= E.geode) h += '<button class="btn go" data-act="crack">Crack a geode for ' + E.geode + ' nuggets</button>';
    else h += '<button class="btn" disabled>' + (E.geode - dd.nuggets) + ' more nuggets for the next geode</button>';
  }
  $('gpanel').innerHTML = h;
  $('gpanel').className = 'gright plate tab-' + tab;
  gBounce = 1;
  paintTiles(true);
  if (!gTimer) gLoop();
};
function paintWords(p) {
  var t = p.pat ? p.pat.t : '';
  var w = t === 'metal' ? 'Polished metal. The highlight slides along it as you ride.' : t === 'gem' ? 'Cut like a gemstone. It glints, the wheels glow and it leaves a ribbon of light at speed.' :
    t === 'opal' ? 'The colour never sits still. Glowing wheels and a rainbow ribbon behind you.' : t === 'fade' ? 'One colour melting into the next.' : 'A paint job for any bike you own. Your stock rider dresses to match.';
  return w;
}
/* the little pictures in the garage grids. Ones that move are repainted as time passes. */
function paintTiles(all) {
  var cvs = $('gpanel').querySelectorAll('canvas[data-bike], canvas[data-item]'), d = RR.BIKES[UI.gi], i;
  for (i = 0; i < cvs.length; i++) {
    var cv = cvs[i];
    if (!cv.clientWidth) continue;
    if (cv.hasAttribute('data-bike')) { if (all) bikeTile(cv, RR.BIKES[+cv.getAttribute('data-bike')]); continue; }
    var id = cv.getAttribute('data-item'), it = itemOf(UI.gtab, id);
    if (!all && !(it && it.live)) continue;
    if (UI.gtab === 'paint') A.swatch(cv, it, d, gT); else A.portrait(cv, it, d, gT);
  }
  var rock = $('georock');
  if (rock && rock.clientWidth) drawRock(rock, 0, 0, gT, null);
}
function bikeTile(cv, b) {
  var dpr = Math.min(2, root.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  var c = cv.getContext('2d'), span = b.wb + b.rr + b.rf + 0.3, top = b.kind === 'bumper' ? 2.5 : b.kind === 'penny' ? 1.9 : 1.5, S = Math.min(w / span, h / top) * dpr;
  c.setTransform(S, 0, 0, -S, (cv.width - span * S) / 2 + (b.rr + 0.15) * S, cv.height - 0.06 * S);
  A.bike(c, b, { rider: false, lp: 0, stand: 0, look: P.bikeOpen(b) ? P.look(b.id) : null, t: 1 });
  if (!P.bikeOpen(b)) { c.globalCompositeOperation = 'source-atop'; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(23,26,34,0.82)'; c.fillRect(0, 0, cv.width, cv.height); c.globalCompositeOperation = 'source-over'; }
}
function gLoop() {
  gTimer = root.requestAnimationFrame(gLoop);
  if (UI.cur !== 'garage') return;
  gSpin -= 0.035; gBounce *= 0.9; gT += 1 / 60; gFrame++;
  UI.garageDraw();
  if (gFrame % 3 === 0) paintTiles(false);
}
UI.garageDraw = function () {
  var cv = $('gcv'); if (!cv || !cv.clientWidth) return;
  var d = RR.BIKES[UI.gi], dpr = Math.min(2, root.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  var c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  var span = d.wb + d.rr + d.rf + 0.5, tall = d.kind === 'bumper' ? 2.65 : 2.3, S = Math.min(w / span, h / tall), ox = (w - span * S) * 0.5 + (d.rr + 0.25) * S, oy = h - 0.2 * S;
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(ox + d.wb * 0.5 * S, oy + 0.02 * S, span * 0.48 * S, 0.09 * S, 0, 0, 6.3); c.fill();
  c.setTransform(dpr * S, 0, 0, -dpr * S, dpr * ox, dpr * oy);
  var b = Math.sin(gBounce * 9) * gBounce * 0.05, open = P.bikeOpen(d);
  A.bike(c, d, { RA: [0, d.rr - b * 0.4], FA: [d.wb, d.rf - b * 0.4], spinR: gSpin, spinF: gSpin * d.rr / d.rf, lp: 0, stand: 0, crouch: b * 4, rider: true, look: previewLook(), t: gT });
  if (!open) {     // locked bikes are shown as a dark shape
    c.globalCompositeOperation = 'source-atop'; c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(23,26,34,0.86)'; c.fillRect(0, 0, cv.width, cv.height); c.globalCompositeOperation = 'source-over';
  }
};

/* ------------------------------------------------------------------ */
/* Cracking a geode                                                     */
/* ------------------------------------------------------------------ */
var geo = { stage: '', hits: 0, t: 0, shake: 0, item: null, tier: null, raf: 0, bits: [], from: '' };
var ROCK = [-1.0, -0.2, -0.86, 0.5, -0.4, 0.92, 0.2, 0.98, 0.78, 0.62, 1.0, 0.0, 0.8, -0.62, 0.24, -0.9, -0.5, -0.82];
var CRACKS = [[0.05, 0.9, -0.1, 0.5, 0.12, 0.2, -0.08, -0.1], [-0.08, -0.1, 0.16, -0.45, 0.02, -0.88], [0.12, 0.2, 0.5, 0.3, 0.8, 0.1], [-0.1, 0.5, -0.5, 0.36, -0.86, 0.5]];
function tierGlow(t, time) { return !t ? '#f2c230' : t.id === 'opal' ? 'hsl(' + ((time * 160) % 360).toFixed(0) + ',100%,72%)' : t.col; }
/* the rock, drawn in a box 2.4 units wide centred on the canvas */
function drawRock(cv, hits, open, time, tier) {
  var dpr = Math.min(2, root.devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  var c = cv.getContext('2d'), S = Math.min(w, h) / (cv.id === 'geocv' ? 4.4 : 2.5), i, k, glow = tierGlow(tier, time);
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  var sx = geo.shake && cv.id === 'geocv' ? (Math.random() - 0.5) * geo.shake * 0.12 : 0, sy = geo.shake && cv.id === 'geocv' ? (Math.random() - 0.5) * geo.shake * 0.12 : 0;
  c.setTransform(dpr * S, 0, 0, -dpr * S, dpr * (w / 2 + sx * S), dpr * (h * (cv.id === 'geocv' ? 0.46 : 0.5) + sy * S));
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (open > 0) {
    // light pouring out
    c.save(); c.rotate(time * 0.5); c.globalCompositeOperation = 'lighter';
    for (i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.globalAlpha = 0.16 * Math.min(1, open * 2) * (i % 2 ? 1 : 0.6); c.fillStyle = glow; c.beginPath(); c.moveTo(0, 0); c.lineTo(-0.3, 4); c.lineTo(0.3, 4); c.closePath(); c.fill(); }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(0, -1.0, 1.0 + open * 0.5, 0.14, 0, 0, 6.3); c.fill();
  var gap = open * 0.9, bob = cv.id === 'geocv' && !open ? Math.sin(time * 2.4) * 0.03 : 0;
  for (var half = 0; half < (open > 0 ? 2 : 1); half++) {
    c.save(); c.translate((half ? 1 : -1) * gap, bob - open * 0.2); c.rotate((half ? -1 : 1) * open * 0.5);
    if (open > 0) { c.beginPath(); c.rect(half ? 0.02 : -3, -3, 3, 6); c.clip(); }
    A.shape(c, ROCK, '#7d7468', 0.06);
    c.beginPath(); c.moveTo(ROCK[0], ROCK[1]); for (i = 2; i < ROCK.length; i += 2) c.lineTo(ROCK[i], ROCK[i + 1]); c.closePath(); c.save(); c.clip();
    c.fillStyle = '#5f574d'; c.beginPath(); c.moveTo(-1.2, -1); c.lineTo(1.2, -1); c.lineTo(1.2, -0.3); c.quadraticCurveTo(0, -0.7, -1.2, -0.1); c.fill();
    c.fillStyle = '#978d7f'; c.beginPath(); c.ellipse(-0.3, 0.55, 0.42, 0.2, 0.3, 0, 6.3); c.fill();
    c.fillStyle = '#4f483f'; [[0.4, 0.2, 0.09], [-0.5, -0.3, 0.07], [0.1, -0.5, 0.06], [0.6, -0.3, 0.05], [-0.6, 0.2, 0.05]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], q[2], 0, 6.3); c.fill(); });
    if (open > 0) {
      // the crystal lining on the broken face
      var gx = half ? 0.02 : -0.02;
      c.fillStyle = glow; c.beginPath(); c.moveTo(gx, 0.95);
      for (k = 0; k <= 8; k++) c.lineTo(gx + (half ? 1 : -1) * (0.16 + (k % 2) * 0.16), 0.95 - k * 0.24);
      c.lineTo(gx, -0.95); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.moveTo(gx, 0.9); for (k = 0; k <= 8; k++) c.lineTo(gx + (half ? 1 : -1) * (0.05 + (k % 2) * 0.08), 0.9 - k * 0.225); c.lineTo(gx, -0.9); c.closePath(); c.fill();
    }
    c.restore();
    // cracks, with the colour of what is inside showing through
    if (!open) for (i = 0; i < Math.min(hits * 2, CRACKS.length); i++) { A.line(c, CRACKS[i], 0.1, OUTC); A.line(c, CRACKS[i], 0.045, glow); }
    c.restore();
  }
}
var OUTC = '#15171d';
function openGeode() {
  var got = P.crack();
  if (!got) { Au.ui('no'); return; }
  geo.item = got.item; geo.tier = RR.TIER[got.item.tier]; geo.kind = got.kind;
  geo.stage = 'rock'; geo.hits = 0; geo.t = 0; geo.shake = 0; geo.open = 0; geo.bits = [];
  if (UI.cur !== 'geode') geo.from = UI.cur;
  $('gecard').className = 'gecard plate'; $('gecard').innerHTML = '';
  $('gehint').textContent = ('ontouchstart' in root ? 'Tap' : 'Click') + ' the rock';
  $('gehint').className = 'gehint on';
  UI.show('geode');
  Au.ui('go');
  if (!geo.raf) geoLoop();
}
function closeGeode() {
  if (geo.raf) { root.cancelAnimationFrame(geo.raf); geo.raf = 0; }
  geo.stage = '';
  if (geo.from === 'results') UI.results(G.result, true);
  else { UI.show('garage'); UI.garage(); }
}
function geoHit() {
  if (geo.stage !== 'rock') return;
  geo.hits++; geo.shake = 1;
  if (geo.hits < 3) { Au.geode(geo.hits === 1 ? 'tap' : 'crack', geo.hits); return; }
  geo.stage = 'burst'; geo.t = 0;
  Au.geode('open', geo.tier.rank);
  $('gehint').className = 'gehint';
  for (var i = 0; i < 34; i++) { var a = Math.random() * 6.283, sp = 2 + Math.random() * 5; geo.bits.push({ x: 0, y: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp + 1.5, r: 0.04 + Math.random() * 0.09, rock: i % 3 === 0, rot: Math.random() * 6, life: 0.8 + Math.random() * 0.7 }); }
  setTimeout(showGeoCard, 620);
}
function showGeoCard() {
  if (UI.cur !== 'geode' || !geo.item) return;
  var it = geo.item, h = '', bike = RR.BIKE[Store.data.bike];
  geo.stage = 'show';
  h += '<canvas id="geoitem"></canvas><div class="gi"><div class="k">' + (it.kind === 'paint' ? 'Paint job' : 'Rider') + ' ' + tierChip(it.tier) + '</div><h3>' + esc(it.name) + '</h3><p>' + (it.blurb ? esc(it.blurb) : paintWords(it)) + '</p>' +
    '<div class="btns"><button class="btn go" data-act="geoPut">Put it on</button>' + (P.canCrack() ? '<button class="btn" data-act="geoAgain">Crack another</button>' : '') + '<button class="btn small" data-act="geoDone">Done</button></div></div>';
  var card = $('gecard'); card.innerHTML = h; card.className = 'gecard plate on t-' + it.tier;
  UI.title && ($('gnug').innerHTML = NUG + Store.data.nuggets);
}
function geoLoop() {
  geo.raf = root.requestAnimationFrame(geoLoop);
  if (UI.cur !== 'geode') return;
  var dt = 1 / 60; geo.t += dt; gT += dt;
  geo.shake = Math.max(0, geo.shake - dt * 4);
  if (geo.stage !== 'rock') geo.open = Math.min(1, geo.open + dt * 3.2);
  var cv = $('geocv');
  drawRock(cv, geo.hits, geo.open, gT, geo.tier);
  // flying chips and sparks, in the same picture
  if (geo.bits.length) {
    var c = cv.getContext('2d'), col = tierGlow(geo.tier, gT), i;
    for (i = geo.bits.length - 1; i >= 0; i--) {
      var b = geo.bits[i]; b.life -= dt; if (b.life <= 0) { geo.bits.splice(i, 1); continue; }
      b.vy -= 9 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += 6 * dt;
      c.globalAlpha = Math.min(1, b.life * 2.5);
      if (b.rock) { c.save(); c.translate(b.x, b.y); c.rotate(b.rot); c.fillStyle = '#7d7468'; c.fillRect(-b.r, -b.r, b.r * 2, b.r * 2); c.restore(); }
      else { c.globalCompositeOperation = 'lighter'; A.star4(c, b.x, b.y, b.r * 1.6, col); c.globalCompositeOperation = 'source-over'; }
    }
    c.globalAlpha = 1;
  }
  var ic = $('geoitem');
  if (ic && ic.clientWidth && geo.item) { if (geo.item.kind === 'paint') A.swatch(ic, geo.item, RR.BIKE[Store.data.bike], gT); else A.portrait(ic, geo.item, RR.BIKE[Store.data.bike], gT); }
}

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
  function sw(k, label, sub) { return '<div class="row"><label>' + label + (sub ? '<small>' + sub + '</small>' : '') + '</label><button class="sw' + (s[k] ? ' on' : '') + '" data-act="sw" data-k="' + k + '"' + (k === 'tilt' ? ' data-click="1"' : '') + ' role="switch" aria-checked="' + !!s[k] + '" aria-label="' + label + '"></button></div>'; }
  function sl(k, label) { return '<div class="row"><label for="r-' + k + '">' + label + '</label><input id="r-' + k + '" type="range" min="0" max="100" value="' + Math.round(s[k] * 100) + '" data-k="' + k + '"></div>'; }
  function seg(v, label) { return '<button data-act="seg" data-v="' + v + '" class="' + (s.quality === v ? 'on' : '') + '">' + label + '</button>'; }
  function tf(v, label) { return '<button data-act="tfeel" data-v="' + v + '" class="' + (Math.abs(s.tiltSens - v) < 0.05 ? 'on' : '') + '">' + label + '</button>'; }
  $('setcols').innerHTML =
    sl('engine', 'Engine volume') + sw('tilt', 'Tilt to lean', 'Lean by tilting the phone like a steering wheel. The lean buttons still work.') +
    (s.tilt ? '<div class="row"><label>Tilt feel<small>How far you have to tilt for a full lean.</small></label><span class="seg">' + tf(0.6, 'Gentle') + tf(0.8, 'Normal') + tf(1.1, 'Sharp') + '</span></div>' + sw('tiltFlip', 'Tilt leans the wrong way round', 'Switch this on if tilting right leans the bike back.') : '') +
    sl('sfx', 'Effects volume') + sw('hints', 'Show the on-screen buttons', 'Hidden or not, the four touch areas stay where they are.') +
    sl('music', 'Menu music') + sw('ghost', 'Race the ghost of your best run') +
    '<div class="row"><label>Picture quality</label><span class="seg">' + seg('auto', 'Auto') + seg('high', 'Sharp') + seg('low', 'Fast') + '</span></div>' + sw('buzz', 'Vibrate on hard landings', 'Android phones only.') +
    sw('unlockAll', 'Unlock everything', 'All tracks, bikes, paint jobs and riders, no questions. Your real progress is kept.') +
    '<div class="row"><label>Start over<small>' + st.finishes + ' finishes, ' + st.crashes + ' crashes, ' + st.flips + ' flips landed, ' + (st.dist / 1000).toFixed(1) + ' km ridden</small></label><button class="btn small red" data-act="wipeAll">Wipe progress</button></div>' +
    '<div class="how">On a phone the right thumb has gas (outer button) and brake, and the left thumb has lean back (outer button) and lean forward. You can hold gas and lean at the same time, and slide a thumb from one button to the other without lifting. ' +
    'On a keyboard: W or up arrow is gas, S or down arrow is brake, A or left arrow leans back, D or right arrow leans forward. R restarts, P pauses. ' +
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
  var touchy = 'ontouchstart' in root, tilt = Store.data.settings.tilt;
  $('howto').className = 'howto on';
  var go = touchy ? 'Hold gas to start' : 'Press W or the up arrow to start';
  var tip = info.tip || '';
  if (i === 0 && !touchy) tip = 'W or up: gas. S or down: brake. A and D, or left and right: lean back and forward.';
  if (tilt && i === 0) tip = 'Tilt the phone to lean. The lean buttons still work.';
  if (G.bikeDef.bonk && !tip) tip = 'The roll hoop takes one knock on the head for you. Only one.';
  $('howmid').innerHTML = go + (tip ? '<small>' + esc(tip) + '</small>' : '');
  $('pads').className = 'pads' + (Store.data.settings.hints ? '' : ' off');
  UI.measurePads();
  lastGoal = -1; lastClk = ''; lastPads = '';
};
UI.onStart = function () { $('howto').className = 'howto'; };
UI.onCrash = function (cause) {
  var words = { head: 'Wiped out', water: 'Splash', ice: 'Ice bath', lava: 'Toasted', fall: 'Long way down', bus: 'Parked it' };
  var again = 'ontouchstart' in root ? 'Tap to go again' : 'Press R to go again', why = '', title = words[cause] || 'Wiped out';
  // if it happened at one of the places where speed matters, say which way it went wrong
  var s = G.sim, f = G.track.feats, i;
  for (i = 0; i < f.length && s; i++) {
    if (cause === 'head' && (f[i].t === 'roof' || f[i].t === 'beam') && s.x > f[i].x0 - 2.5 && s.x < f[i].x1 + 2.5) { title = 'Headroom'; why = 'Too fast through there\n'; break; }
    if (cause !== 'head' && f[i].t === 'zone' && s.x > f[i].x0 && s.x < f[i].x1 + 2) { why = 'Not enough speed for that one\n'; break; }
  }
  $('wipeT').textContent = title;
  $('wipeS').textContent = why + again;
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
  var pads = (In.L ? 'L' : '') + (In.R ? 'R' : '') + (In.G ? 'G' : '') + (In.B ? 'B' : '');
  if (pads !== lastPads) { lastPads = pads; $('padB').className = 'pad b' + (In.L ? ' on' : ''); $('padF').className = 'pad f' + (In.R ? ' on' : ''); $('padG').className = 'pad g' + (In.G && !In.B ? ' on' : ''); $('padK').className = 'pad k' + (In.B ? ' on' : ''); }
  var bo = $('boost');
  if (s.boost > 0) { bo.style.opacity = 1; $('boostI').style.width = Math.min(100, s.boost / 3.2 * 100) + '%'; } else if (bo.style.opacity !== '0') bo.style.opacity = 0;
};

UI.results = function (r, again) {
  var i = r.track, info = RR.trackInfo(i), st = RR.STAR_TIMES[i], h, k;
  var next = i + 1 < RR.TRACK_COUNT && P.trackOpen(i + 1) ? i + 1 : -1;
  h = '<div class="tn">' + esc(RR.WORLDS[info.world].name) + ' ' + (info.num + 1) + ', ' + esc(info.name) + '</div><div class="time">' + fmt(r.time) + '</div>' +
      '<div class="big"><i class="star' + (again && r.stars > 0 ? ' on' : '') + '" id="rs0"></i><i class="star' + (again && r.stars > 1 ? ' on' : '') + '" id="rs1"></i><i class="star' + (again && r.stars > 2 ? ' on' : '') + '" id="rs2"></i></div>';
  var line;
  if (r.best && r.old) line = '<b>New best</b> ' + fmt(r.old - r.time) + ' quicker than before';
  else if (r.best) line = '<b>First finish</b>';
  else line = 'Your best is ' + fmt(r.old) + ', this was ' + fmt(r.time - r.old) + ' off it';
  h += '<div class="line">' + line + '</div>';
  h += '<div class="line">' + (r.stars === 3 ? 'All three stars. Nothing left to prove here.' : r.stars === 2 ? 'Three stars needs under ' + fmt(st[0]) + '.' : 'Two stars needs under ' + fmt(st[1]) + ', three needs under ' + fmt(st[0]) + '.') + '</div>';
  var pay = r.pay, bits = [];
  if (pay) {
    bits.push('finish ' + pay.finish); if (pay.stars) bits.push('new stars ' + pay.stars); if (pay.flips) bits.push('flips ' + pay.flips); if (pay.best) bits.push('new best ' + pay.best);
    h += '<div class="pay">' + NUG + '<b>+' + pay.total + '</b> nuggets <span>(' + bits.join(', ') + ')</span></div>';
  }
  for (k = 0; k < r.bikes.length; k++) h += '<div class="unl">New bike in the garage: ' + esc(r.bikes[k].name) + '</div>';
  for (k = 0; k < r.worlds.length; k++) h += '<div class="unl">New world open: ' + esc(r.worlds[k].name) + '</div>';
  for (k = 0; k < (r.geodes || []).length; k++) h += '<div class="unl">' + esc(r.geodes[k].why) + ': a ' + r.geodes[k].kind + ' geode for you</div>';
  h += '<div class="btns">' + (next >= 0 ? '<button class="btn go" data-act="nextTrack" data-i="' + next + '">Next track</button>' : '') +
       '<button class="btn' + (next >= 0 ? '' : ' go') + '" data-act="retry">Ride it again</button>' +
       (P.canCrack() ? '<button class="btn small gem" data-act="crack">Crack a geode</button>' : '') +
       '<button class="btn small" data-act="garage">Garage</button><button class="btn small" data-act="quit">Tracks</button></div>';
  $('res').innerHTML = h;
  UI.show('results');
  if (again) return;
  for (k = 0; k < r.stars; k++) (function (n) { setTimeout(function () { var e = $('rs' + n); if (e && UI.cur === 'results') { e.className = 'star on'; Au.star(n); } }, 350 + n * 330); })(k);
  setTimeout(function () { if (UI.cur !== 'results') return; if (r.bikes.length || r.worlds.length || (r.geodes || []).length) Au.unlocked(); else if (r.best && r.old) Au.newBest(); else if (pay) Au.coin(2); }, 350 + r.stars * 330 + 150);
};

/* ------------------------------------------------------------------ */
RR.boot = function () {
  Store.load();
  P.claim();
  var owed = P.settle();      // old saves are paid for the stars and worlds they already have
  if (owed.nuggets || owed.geodes.length) Store.save();
  R.init($('stage'));
  UI.init();
  // the rock on the geode screen answers to a tap anywhere
  $('geocv').addEventListener('pointerdown', function (e) { e.preventDefault(); Au.unlock(); afterUnlock(); geoHit(); });
  G.menu();
  UI.title();
  if (owed.nuggets || owed.geodes.length) setTimeout(function () { UI.toast('New: paint jobs and riders. You have ' + Store.data.nuggets + ' nuggets' + (owed.geodes.length ? ' and ' + owed.geodes.length + ' prize geode' + (owed.geodes.length > 1 ? 's' : '') : '') + ' waiting in the Garage.'); }, 900);
  if (Store.rebuilt) setTimeout(function () { UI.toast(Store.rebuilt + ' track' + (Store.rebuilt > 1 ? 's have' : ' has') + ' been rebuilt and now bite back. You keep your stars on them. Best times start again.'); }, owed.nuggets || owed.geodes.length ? 6500 : 900);
  root.requestAnimationFrame(G.frame);
};
})(typeof window !== 'undefined' ? window : globalThis);
