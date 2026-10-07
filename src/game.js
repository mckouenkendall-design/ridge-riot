/* Ridge Riot: the game itself. Saving, controls, the main loop, and turning
   what the physics reports (landings, flips, crashes) into sound and effects. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
var R = RR.Render, Au = RR.Audio, DT = RR.DT, TAU = Math.PI * 2;
var G = RR.Game = { state: 'boot', t: 0, flash: 0, boostGlow: 0, timeScale: 1 };
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

/* ------------------------------------------------------------------ */
/* Saved progress                                                       */
/* ------------------------------------------------------------------ */
var KEY = 'ridgeRiot.v1';
var DEF = {
  v: 2, best: {}, bike: 'scrapper', owned: { scrapper: 1 }, last: 0, seenHow: false,
  nuggets: 0, paints: {}, riders: {}, fit: {}, geodes: { gold: 0, diamond: 0 }, opened: 0, pity: 0, paid: {}, got: {}, fresh: {},
  settings: { sfx: 0.8, engine: 0.7, music: 0.5, tilt: false, tiltSens: 0.8, tiltFlip: false, hints: true, ghost: true, unlockAll: false, quality: 'auto', buzz: true },
  stats: { flips: 0, bestAir: 0, crashes: 0, runs: 0, finishes: 0, bestJump: 0, bestFlips: 0, dist: 0, topSpeed: 0 }
};
/* The first version filed best times by position in this running order. They are now
   filed by track name, so this list is only here to read old saves. */
var V1 = ['First Gear', 'Washboard', 'Rolling Dunes', 'Hop Skip', 'Loop de Dust', 'Mesa Drop', 'Gulch Gap', 'Canyon Run',
  'Log Jam', 'Mossy Loop', 'Timber Table', 'Sawmill', 'Root Rage', 'Creek Hop', 'Beaver Dam', 'Old Growth',
  'Black Ice', 'Whiteout', 'Glacier Loop', 'Slip Road', 'Powder Keg', 'Avalanche', 'Crevasse', 'Aurora',
  'Hot Start', 'The Chimney', 'Ash Loop', 'Caldera', 'Magma Hop', 'Fire Walk', 'Ember Steps', 'Eruption',
  'One Small Hop', 'Double Loop', 'Crater Maker', 'Slow Float', 'Dark Side', 'Escape Velocity', 'Regolith', 'Riot Run'];
function v1id(k) { return V1[k] ? V1[k].toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''; }
var mem = {};
var Store = RR.Store = {
  data: JSON.parse(JSON.stringify(DEF)), other: {},
  get: function (k) { try { var v = root.localStorage.getItem(k); return v == null ? (mem[k] || null) : v; } catch (e) { return mem[k] || null; } },
  set: function (k, v) { mem[k] = v; try { root.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del: function (k) { delete mem[k]; try { root.localStorage.removeItem(k); } catch (e) {} },
  load: function () {
    var raw = Store.get(KEY), d = JSON.parse(JSON.stringify(DEF)), k, i, old = false;
    Store.other = {};
    if (raw) {
      try {
        var o = JSON.parse(raw);
        for (k in o) if (k !== 'settings' && k !== 'stats' && k !== 'best' && k !== 'geodes' && k !== 'v' && k in d) d[k] = o[k];
        for (k in o.settings || {}) if (k in d.settings) d.settings[k] = o.settings[k];
        for (k in o.stats || {}) if (k in d.stats) d.stats[k] = o.stats[k];
        for (k in o.geodes || {}) if (k in d.geodes) d.geodes[k] = o.geodes[k];
        if (o.times) {
          for (k in o.times) { i = RR.trackIndex(k); if (i >= 0) d.best[i] = o.times[k]; else Store.other[k] = o.times[k]; }
          i = RR.trackIndex(o.lastId || ''); d.last = i >= 0 ? i : 0;
        } else if (o.best) {
          old = true;
          for (k in o.best) { i = RR.trackIndex(v1id(k)); if (i >= 0) d.best[i] = o.best[k]; }
          i = RR.trackIndex(v1id(o.last || 0)); d.last = i >= 0 ? i : 0;
          if (!('tiltSens' in (o.settings || {})) || o.settings.tiltSens === 1) d.settings.tiltSens = 0.8;
        }
      } catch (e) {}
    }
    if (!RR.BIKE[d.bike]) d.bike = 'scrapper';
    d.owned.scrapper = 1;
    Store.data = d;
    if (old) {
      // move the ghost recordings to their new names as well
      for (k = 0; k < V1.length; k++) { var g = Store.get(KEY + '.ghost.' + k); if (g) { Store.set(KEY + '.ghost.' + v1id(k), g); Store.del(KEY + '.ghost.' + k); } }
      Store.save();
    }
  },
  save: function () {
    var d = Store.data, out = {}, k;
    for (k in d) if (k !== 'best') out[k] = d[k];
    out.times = {};
    for (k in Store.other) out.times[k] = Store.other[k];
    for (k in d.best) if (d.best[k]) out.times[RR.trackId(+k)] = d.best[k];
    out.lastId = RR.trackId(d.last || 0);
    var ok = Store.set(KEY, JSON.stringify(out));
    if (!ok && !Store.warned) { Store.warned = true; if (RR.UI && RR.UI.toast) RR.UI.toast('This browser is not letting the game save. Progress lasts until you close the page.'); }
    return ok;
  },
  reset: function () {
    var s = Store.data.settings;
    Store.data = JSON.parse(JSON.stringify(DEF)); Store.data.settings = s; Store.data.settings.unlockAll = false; Store.other = {};
    for (var i = 0; i < RR.TRACK_COUNT; i++) Store.del(KEY + '.ghost.' + RR.trackId(i));
    Store.save();
  }
};

var P = RR.Progress = {
  starsFor: function (i) {
    var b = Store.data.best[i];
    if (!b) return 0;
    var st = RR.STAR_TIMES[i];
    return b <= st[0] ? 3 : b <= st[1] ? 2 : 1;
  },
  starsForTime: function (i, t) { var st = RR.STAR_TIMES[i]; return t <= st[0] ? 3 : t <= st[1] ? 2 : 1; },
  total: function () { var n = 0; for (var i = 0; i < RR.TRACK_COUNT; i++) n += P.starsFor(i); return n; },
  worldDone: function (w) { for (var i = w * 8; i < w * 8 + 8; i++) if (!Store.data.best[i]) return false; return true; },
  worldCount: function (w) { var n = 0; for (var i = w * 8; i < w * 8 + 8; i++) if (Store.data.best[i]) n++; return n; },
  worldOpen: function (w) { return Store.data.settings.unlockAll || P.total() >= RR.WORLDS[w].need; },
  trackOpen: function (i) {
    if (Store.data.settings.unlockAll) return true;
    var w = Math.floor(i / 8);
    if (!P.worldOpen(w)) return false;
    return i % 8 === 0 || !!Store.data.best[i - 1] || !!Store.data.best[i];
  },
  worldStars: function (w) { var n = 0; for (var i = w * 8; i < w * 8 + 8; i++) n += P.starsFor(i); return n; },
  bikeMet: function (d) {
    var u = d.unlock, s = Store.data.stats;
    if (u.type === 'free') return true;
    if (u.type === 'stars') return P.total() >= u.n;
    if (u.type === 'world') return P.worldDone(RR.WORLD[u.w].index);
    if (u.type === 'flips') return s.flips >= u.n;
    if (u.type === 'air') return s.bestAir >= u.n;
    if (u.type === 'dist') return s.dist >= u.n;
    if (u.type === 'crashes') return s.crashes >= u.n;
    if (u.type === 'speed') return s.topSpeed >= u.n;
    return false;
  },
  bikeOpen: function (d) { return Store.data.settings.unlockAll || !!Store.data.owned[d.id]; },
  /* what a locked bike still needs: the rule, where you are now, and 0..1 for the bar */
  bikeNeed: function (d) {
    var u = d.unlock, s = Store.data.stats, have, need = u.n, now;
    if (u.type === 'stars') { have = P.total(); return { text: 'Earn ' + u.n + ' stars', now: have + ' of ' + need + ' stars', k: have / need }; }
    if (u.type === 'world') { have = P.worldCount(RR.WORLD[u.w].index); return { text: u.text, now: have + ' of 8 tracks', k: have / 8 }; }
    if (u.type === 'flips') { have = Math.min(s.flips, need); return { text: u.text, now: have + ' of ' + need + ' flips', k: have / need }; }
    if (u.type === 'air') { have = Math.min(s.bestAir, need); return { text: u.text, now: 'Best so far ' + have.toFixed(1), k: have / need }; }
    if (u.type === 'dist') { have = Math.min(s.dist, need); return { text: u.text, now: (have / 1000).toFixed(1) + ' of ' + (need / 1000) + ' km', k: have / need }; }
    if (u.type === 'crashes') { have = Math.min(s.crashes, need); return { text: u.text, now: have + ' of ' + need + ' crashes', k: have / need }; }
    if (u.type === 'speed') { have = Math.min(s.topSpeed, need); return { text: u.text, now: 'Fastest so far ' + Math.round(have * 3.6) + ' km/h', k: have / need }; }
    return { text: 'Yours from the start', now: '', k: 1 };
  },
  /* hand over anything newly earned; returns the list so the game can announce it */
  claim: function () {
    var out = [];
    RR.BIKES.forEach(function (d) { if (!Store.data.owned[d.id] && P.bikeMet(d)) { Store.data.owned[d.id] = 1; out.push(d); } });
    return out;
  },

  /* ---- the collection: nuggets, geodes, paint jobs and riders ---- */
  owns: function (it) { return Store.data.settings.unlockAll || !!Store.data[it.kind === 'paint' ? 'paints' : 'riders'][it.id]; },
  reallyOwns: function (it) { return !!Store.data[it.kind === 'paint' ? 'paints' : 'riders'][it.id]; },
  ownedCount: function () { var n = 0; RR.ITEMS.forEach(function (it) { if (P.reallyOwns(it)) n++; }); return n; },
  /* what a bike is wearing: { paint, rider }, either may be null for the stock look */
  look: function (bikeId) {
    var f = Store.data.fit[bikeId] || {}, p = RR.PAINT[f.p], r = RR.RIDER[f.r];
    return { paint: p && P.owns(p) ? p : null, rider: r && P.owns(r) ? r : null };
  },
  wear: function (bikeId, kind, id) {
    var f = Store.data.fit[bikeId] || (Store.data.fit[bikeId] = {});
    f[kind === 'paint' ? 'p' : 'r'] = id || '';
  },
  /* Pay out anything owed for stars and finished worlds. Stars pay once each; finishing every
     track in a world gives a gold geode, and three stars on all of them a diamond one.
     Old saves are owed for everything they already did, which this also covers. */
  settle: function () {
    var d = Store.data, out = { stars: 0, nuggets: 0, geodes: [] }, i, w;
    for (i = 0; i < RR.TRACK_COUNT; i++) {
      var id = RR.trackId(i), n = P.starsFor(i), was = d.paid[id] || 0;
      if (n > was) { out.stars += n - was; d.paid[id] = n; }
    }
    out.nuggets = out.stars * RR.ECON.star; d.nuggets += out.nuggets;
    for (w = 0; w < RR.WORLDS.length; w++) {
      var W = RR.WORLDS[w];
      if (!d.got['done:' + W.id] && P.worldDone(w)) { d.got['done:' + W.id] = 1; d.geodes.gold++; out.geodes.push({ kind: 'gold', why: 'Every ' + W.name + ' track finished' }); }
      if (!d.got['aced:' + W.id] && P.worldStars(w) >= 24) { d.got['aced:' + W.id] = 1; d.geodes.diamond++; out.geodes.push({ kind: 'diamond', why: 'Three stars on every ' + W.name + ' track' }); }
    }
    return out;
  },
  itemsLeft: function () { var n = 0; RR.ITEMS.forEach(function (it) { if (!P.reallyOwns(it)) n++; }); return n; },
  freeGeodes: function () { return Store.data.geodes.gold + Store.data.geodes.diamond; },
  canCrack: function () { return P.itemsLeft() > 0 && (P.freeGeodes() > 0 || Store.data.nuggets >= RR.ECON.geode); },
  /* open one geode: prize geodes first (best first), otherwise pay for an ordinary one */
  crack: function () {
    var d = Store.data, kind = 'any';
    if (P.itemsLeft() <= 0) return null;
    if (d.geodes.diamond > 0) kind = 'diamond'; else if (d.geodes.gold > 0) kind = 'gold'; else if (d.nuggets < RR.ECON.geode) return null;
    var pity = kind === 'any' && d.pity >= RR.ECON.pity;
    var it = RR.rollGeode(kind, P.reallyOwns, Math.random, pity);
    if (!it) return null;
    if (kind === 'any') d.nuggets -= RR.ECON.geode; else d.geodes[kind]--;
    d[it.kind === 'paint' ? 'paints' : 'riders'][it.id] = 1;
    d.fresh[it.id] = 1; d.opened++;
    d.pity = RR.TIER[it.tier].rank >= 2 ? 0 : d.pity + 1;
    Store.save();
    return { item: it, kind: kind };
  }
};

/* ------------------------------------------------------------------ */
/* Ghost recording: where the bike was, 15 times a second               */
/* ------------------------------------------------------------------ */
var Ghost = {
  rec: [], play: null,
  encode: function (arr) {
    var i16 = new Int16Array(arr.length), i; for (i = 0; i < arr.length; i++) i16[i] = arr[i];
    var u8 = new Uint8Array(i16.buffer), s = '';
    for (i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
    return root.btoa(s);
  },
  decode: function (b64) {
    var s = root.atob(b64), u8 = new Uint8Array(s.length), i; for (i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
    return new Int16Array(u8.buffer);
  },
  load: function (i) {
    Ghost.play = null;
    var raw = Store.get(KEY + '.ghost.' + RR.trackId(i));
    if (!raw) return;
    try { var k = raw.indexOf('|'); Ghost.play = { bike: raw.slice(0, k), d: Ghost.decode(raw.slice(k + 1)) }; } catch (e) { Ghost.play = null; }
  },
  store: function (i, bike) { Store.set(KEY + '.ghost.' + RR.trackId(i), bike + '|' + Ghost.encode(Ghost.rec)); },
  sample: function (s) { Ghost.rec.push(Math.round(s.x * 50), Math.round(s.y * 50), Math.round((s.a - TAU * Math.floor(s.a / TAU)) * 5000)); },
  pose: function (t, out) {
    var g = Ghost.play; if (!g) return null;
    var f = t * 15, i = Math.floor(f), n = g.d.length / 3;
    if (i >= n - 1) return null;
    var k = f - i, a0 = g.d[i * 3 + 2] / 5000, a1 = g.d[i * 3 + 5] / 5000, da = a1 - a0;
    da -= TAU * Math.round(da / TAU);
    out.x = (g.d[i * 3] + (g.d[i * 3 + 3] - g.d[i * 3]) * k) / 50; out.y = (g.d[i * 3 + 1] + (g.d[i * 3 + 4] - g.d[i * 3 + 1]) * k) / 50;
    out.a = a0 + da * k; out.bike = g.bike;
    return out;
  }
};
RR.Ghost = Ghost;

/* ------------------------------------------------------------------ */
/* Controls                                                             */
/* ------------------------------------------------------------------ */
var In = G.input = { kL: false, kR: false, kB: false, kG: false, touch: {}, tilt: 0, tiltOK: false, tiltZero: 0, tiltRaw: 0, any: false, L: false, R: false, G: false, B: false };
var inp = { lean: 0, brake: false, gas: false };
/* Where the on-screen buttons divide. Left of split.l is "lean back", between that and the
   middle is "lean forward", then "brake" up to split.r, and "gas" beyond it. Set by the UI. */
G.split = { l: 0, r: 0 };
function readInput() {
  var L = In.kL, Rt = In.kR, gas = In.kG, brk = In.kB, k, mid = R.size().w * 0.5;
  // every finger is looked at on its own, so one thumb can hold gas while the other leans
  for (k in In.touch) {
    var x = In.touch[k];
    if (x < mid) { if (x < G.split.l) L = true; else Rt = true; }
    else if (x >= G.split.r) gas = true; else brk = true;
  }
  var set = Store.data.settings, lean = L && Rt ? 0 : Rt ? 1 : L ? -1 : 0;
  if (set.tilt && In.tiltOK && !L && !Rt) {
    var a = (In.tiltRaw - In.tiltZero) * set.tiltSens / 0.33 * (set.tiltFlip ? -1 : 1);
    if (a > -0.16 && a < 0.16) a = 0;
    lean = clamp(a, -1, 1);
  }
  inp.lean = lean; inp.brake = brk; inp.gas = gas && !brk;
  In.L = L; In.R = Rt; In.G = gas; In.B = brk; In.any = gas;
  return inp;
}
G.readInput = readInput;
function onMotion(e) {
  var g = e.accelerationIncludingGravity; if (!g || g.x == null) return;
  var ang = 0;
  try { ang = (root.screen.orientation && root.screen.orientation.angle) || root.orientation || 0; } catch (x) {}
  var ax = g.x, ay = g.y;
  if (Math.sqrt(ax * ax + ay * ay) < 2.5) { In.tiltRaw *= 0.9; return; }    // lying flat: no reading
  // angle of "down" within the screen, measured from the landscape upright position
  var th = (ang === 90) ? Math.atan2(ay, -ax) : (ang === 270 || ang === -90) ? Math.atan2(-ay, ax) : Math.atan2(-ax, -ay);
  if (/iP(hone|ad|od)/.test(navigator.userAgent)) th = -th;                    // Apple reports the opposite sign
  In.tiltRaw += (th - In.tiltRaw) * 0.35;
  In.tiltOK = true;
}
G.enableTilt = function (cb) {
  function go() { root.addEventListener('devicemotion', onMotion); setTimeout(function () { In.tiltZero = In.tiltRaw; cb && cb(In.tiltOK); }, 500); }
  try {
    if (root.DeviceMotionEvent && typeof root.DeviceMotionEvent.requestPermission === 'function') {
      root.DeviceMotionEvent.requestPermission().then(function (r) { if (r === 'granted') go(); else cb && cb(false); }).catch(function () { cb && cb(false); });
    } else if (root.DeviceMotionEvent) go(); else cb && cb(false);
  } catch (e) { cb && cb(false); }
};
G.zeroTilt = function () { In.tiltZero = In.tiltRaw; };

/* ------------------------------------------------------------------ */
/* Starting, restarting, finishing                                      */
/* ------------------------------------------------------------------ */
var prev = { x: 0, y: 0, a: 0, comp: [0, 0], wa: [0, 0], lp: 0 };
var vis = G.vis = { x: 0, y: 0, a: 0, comp: [0, 0], wa: [0, 0], ww: [0, 0], lp: 0, stand: 0, crouch: 0, noRider: false, headTilt: 0 };
var gp = {}, acc = 0, emitT = 0, exT = 0, tickN = 0, botP = {}, botOut = { lean: 0, brake: false, gas: true };

G.load = function (trackIndex, bikeId, attract) {
  var tr = RR.getTrack(trackIndex), def = RR.BIKE[bikeId];
  G.track = tr; G.bikeDef = def; G.bike = RR.prepBike(def);
  G.sim = RR.createSim(G.bike, tr);
  G.props = R.makeProps(tr);
  G.cam = G.cam || R.newCamera();
  G.attract = !!attract;
  G.look = P.look(bikeId);
  Au.setWorld(tr.worldIndex);
  if (!attract) { Au.engineStart(def); Au.layersStart(); }
  G.reset(true);
};
G.reset = function (snapCam) {
  var s = G.sim;
  RR.resetSim(s);
  R.clearParts(); R.clearPopups();
  G.wipe = null; G.sunk = false; G.camHold = false; G.banked = false; G.runPay = 0; G.flipPaid = 0; G.bonked = false; G.stuckT = 0; G.stuckSaid = false; G.flash = 0; G.boostGlow = 0; G.timeScale = 1; G.endT = 0; G.resultShown = false;
  vis.noRider = false; vis.stand = 0; vis.crouch = 0;
  Ghost.rec.length = 0; tickN = 0; acc = 0; if (G.trail) G.trail.length = 0;
  if (!G.attract) Ghost.load(G.track.index);
  copyPrev();
  R.camFollow(G.cam, s, G.track, 0, R.size().w / R.size().h, true, G.attract ? 0.06 : null);
  G.state = G.attract ? 'attract' : 'ready';
  if (G.attract) { s.started = true; }
  if (!G.attract && RR.UI) RR.UI.onReset();
};
G.play = function (trackIndex) {
  Store.data.last = trackIndex; Store.data.stats.runs++; Store.save();
  Au.music(false);
  G.load(trackIndex, Store.data.bike, false);
};
/* add this run's distance and top speed to the lifetime totals (some bikes unlock on them) */
function bank() {
  var s = G.sim, st = Store.data.stats;
  if (!s || G.attract || G.banked || !s.started) return;
  G.banked = true;
  st.dist = Math.round(st.dist + Math.max(0, s.x - G.track.start[0] - G.bike.com[0]));
  if (s.maxSpeed > st.topSpeed) st.topSpeed = Math.round(s.maxSpeed * 10) / 10;
  var got = P.claim(); if (got.length && RR.UI) RR.UI.toastBikes(got);
}
G.bank = bank;
G.retry = function () {
  if (!G.sim || G.attract) return;
  bank();
  Store.data.stats.runs++;
  if (G.bikeDef.id !== Store.data.bike) { G.load(G.track.index, Store.data.bike, false); return; }
  Au.engineStart(G.bikeDef);
  G.reset(true);
};
G.menu = function () {
  bank();
  Au.engineStop(); Au.layersQuiet();
  var open = [], i; for (i = 0; i < RR.TRACK_COUNT; i++) if (P.trackOpen(i)) open.push(i);
  var pick = open[Math.floor(Math.random() * Math.min(open.length, 16))] || 0;
  G.load(pick, Store.data.bike, true);
  if (Store.data.settings.music > 0) Au.music(true);
};
G.pause = function (on) {
  if (on && (G.state === 'run' || G.state === 'ready')) { G.pausedFrom = G.state; G.state = 'pause'; Au.layersQuiet(); Au.engineUpdate({ v: 0, vmax: 20, gas: 0, dt: 0.1 }); if (RR.UI) RR.UI.show('pause'); }
  else if (!on && G.state === 'pause') { G.state = G.pausedFrom; if (RR.UI) RR.UI.show('hud'); }
};

function copyPrev() {
  var s = G.sim;
  prev.x = s.x; prev.y = s.y; prev.a = s.a; prev.comp[0] = s.comp[0]; prev.comp[1] = s.comp[1]; prev.wa[0] = s.wa[0]; prev.wa[1] = s.wa[1]; prev.lp = s.lp;
}

function finishRun() {
  var s = G.sim, i = G.track.index, t = Math.round(s.finishTime * 100) / 100, d = Store.data, E = RR.ECON;
  var old = d.best[i], isBest = !old || t < old, before = P.starsFor(i), totBefore = P.total();
  d.stats.finishes++;
  if (isBest) { d.best[i] = t; Ghost.store(i, G.bikeDef.id); }
  var st = d.stats;
  if (s.bestAir > st.bestAir) st.bestAir = Math.round(s.bestAir * 100) / 100;
  if (s.bestJump > st.bestJump) st.bestJump = Math.round(s.bestJump * 10) / 10;
  if (s.flips > st.bestFlips) st.bestFlips = s.flips;
  bank();
  var bikes = P.claim();
  var worlds = [], tot = P.total();
  for (var w = 1; w < RR.WORLDS.length; w++) { var need = RR.WORLDS[w].need; if (tot >= need && totBefore < need) worlds.push(RR.WORLDS[w]); }
  // nuggets: a little for finishing, more for each new star, a bit for beating your own time
  var pay = { finish: E.finish, best: isBest && old ? E.best : 0, flips: G.runPay, stars: 0, total: 0 };
  d.nuggets += pay.finish + pay.best;
  var owed = P.settle();
  pay.stars = owed.nuggets; pay.total = pay.finish + pay.best + pay.flips + pay.stars;
  Store.save();
  G.result = { time: t, old: old || 0, best: isBest, stars: P.starsForTime(i, t), starsBefore: before, bikes: bikes, worlds: worlds, flips: s.flips, air: s.bestAir, track: i,
    pay: pay, geodes: owed.geodes };
}

/* ------------------------------------------------------------------ */
/* Effects                                                              */
/* ------------------------------------------------------------------ */
function rnd(a, b) { return a + Math.random() * (b - a); }
function dustBurst(x, y, n, col, sp) {
  for (var i = 0; i < n; i++) R.emit(0, x + rnd(-0.3, 0.3), y + rnd(0, 0.2), rnd(-sp, sp), rnd(0.2, sp * 0.7), rnd(0.35, 0.8), rnd(0.12, 0.26), col, { gr: rnd(0.5, 1.2), a: 0.55, drag: 2.5 });
}
function sparkDraw(c, p, k) { var sz = p.r * (1 - k * 0.5); c.globalCompositeOperation = 'lighter'; RR.Art.star4(c, 0, 0, sz, p.col); c.globalCompositeOperation = 'source-over'; }
function buzz(ms) { try { if (Store.data.settings.buzz && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
var FLIPNAME = ['', '', 'DOUBLE ', 'TRIPLE ', 'QUAD '];

function onEvents() {
  var s = G.sim, ev = s.events, T = R.THEMES[G.track.worldIndex], i, e, k;
  for (i = 0; i < ev.length; i++) {
    e = ev[i];
    if (G.attract && e.t !== 'land') continue;
    if (e.t === 'land') {
      if (e.v > 1.2) dustBurst(e.x, e.y - G.bike.wh[e.w].r, Math.min(14, 2 + e.v * 1.4 | 0), T.dust, 1 + e.v * 0.35);
      if (G.attract) continue;
      Au.land(e.v, e.mat);
      if (e.v > 4.5) { G.cam.shake = Math.max(G.cam.shake, Math.min(0.9, (e.v - 3) / 9)); buzz(Math.min(40, e.v * 3 | 0)); }
    } else if (e.t === 'bottom') {
      Au.bottom(e.v);
      G.cam.shake = Math.max(G.cam.shake, 0.35);
      for (k = 0; k < 5; k++) R.emit(2, s.wx[e.w], s.wy[e.w] - G.bike.wh[e.w].r * 0.8, rnd(-5, 5), rnd(1, 5), rnd(0.15, 0.3), 0.05, '#ffd98a', { g: 1, front: 1 });
    } else if (e.t === 'flip') {
      var nm = (e.n < 5 ? FLIPNAME[e.n] : 'x' + e.n + ' ') + (e.dir > 0 ? 'BACKFLIP' : 'FRONTFLIP');
      R.popup(nm, 'BOOST!', e.n > 1 ? '#ffd24a' : '#ffffff');
      Au.flip(e.n); Au.boost(); buzz(30);
      Store.data.stats.flips += e.n;
      var fp = Math.max(0, Math.min(e.n, RR.ECON.flipCap - G.flipPaid)); G.flipPaid += fp;
      if (fp) { Store.data.nuggets += fp * RR.ECON.flip; G.runPay += fp * RR.ECON.flip; }
      if (e.air > Store.data.stats.bestAir) Store.data.stats.bestAir = Math.round(e.air * 100) / 100;
      for (k = 0; k < 3; k++) R.emit(5, s.x, s.y, 0, 0, 0.5 + k * 0.12, 0.6, '#ffe07a', { gr: 5 + k * 2, a: 0.8, front: 1, w: 0.09 });
      var got = P.claim(); if (got.length && RR.UI) RR.UI.toastBikes(got);
    } else if (e.t === 'air') {
      if (e.air >= 1.8 * Math.sqrt(9.81 / s.g)) { R.popup('BIG AIR', e.air.toFixed(1) + ' s', '#9fe8ff'); Au.air(); }
      if (e.air > Store.data.stats.bestAir) { Store.data.stats.bestAir = Math.round(e.air * 100) / 100; var g2 = P.claim(); if (g2.length && RR.UI) RR.UI.toastBikes(g2); }
    } else if (e.t === 'pad') {
      Au.pad();
      for (k = 0; k < 8; k++) R.emit(2, e.x + rnd(-0.3, 0.3), e.y - G.bike.wh[0].r + 0.05, s.vx * 0.4 + rnd(-3, 1), rnd(1, 5), rnd(0.15, 0.35), 0.05, k % 2 ? '#ffe23d' : '#ff8a1f', { g: 1, front: 1 });
    } else if (e.t === 'bonk') {
      G.bonked = true;
      Au.bonk(); buzz(40);
      R.popup('BONK!', 'The hoop saved you. That was the only one.', '#ffb3d6');
      G.cam.shake = Math.max(G.cam.shake, 0.5);
      for (k = 0; k < 9; k++) R.emit(6, e.x + rnd(-0.4, 0.4), e.y + 0.6, rnd(-4, 4) + s.vx * 0.3, rnd(2, 7), rnd(0.5, 0.9), rnd(0.1, 0.16), k % 2 ? '#ffe23d' : '#ffffff', { g: 0.6, vr: rnd(-8, 8), front: 1 });
    } else if (e.t === 'crash') {
      Store.data.stats.crashes++;
      Au.engineStop(); buzz(80);
      G.state = 'crash'; G.endT = 0; G.timeScale = 0.3;
      bank();
      if (e.cause === 'head') {
        Au.crash(e.v);
        G.wipe = RR.Wipe.start(G.bikeDef.wipe, G, e); vis.noRider = true;
        G.cam.shake = 1; G.flash = 0.35;
        dustBurst(e.x, RR.groundY(G.track, e.x) + 0.2, 16, T.dust, 3);
        for (k = 0; k < 10; k++) R.emit(1, e.x, e.y, rnd(-5, 5) + s.vx * 0.4, rnd(2, 8), rnd(0.6, 1.2), rnd(0.04, 0.08), k % 2 ? G.bikeDef.col[0] : '#ffffff', { g: 1, vr: rnd(-12, 12), front: 1 });
      } else if (e.cause === 'fall') {
        Au.fall(); G.camHold = true;
      } else if (e.cause === 'bus') {
        Au.crunch(); G.sunk = true; G.cam.shake = 1; G.flash = 0.3;
        var bz = null;
        for (k = 0; k < G.track.hazards.length; k++) if (s.x > G.track.hazards[k].x0 && s.x < G.track.hazards[k].x1) bz = G.track.hazards[k];
        var by = bz ? bz.y : s.y;
        for (k = 0; k < 26; k++) R.emit(k % 3 ? 1 : 2, s.x + rnd(-1.2, 1.2), by, rnd(-6, 6) + s.vx * 0.3, rnd(3, 10), rnd(0.6, 1.3), k % 3 ? rnd(0.05, 0.12) : 0.05, ['#ffd24a', '#cfd6de', '#9fe8ff', '#e2402f'][k % 4], { g: 1, a: 1, front: 1, vr: rnd(-12, 12) });
        for (k = 0; k < 10; k++) R.emit(0, s.x + rnd(-1, 1), by + 0.2, rnd(-1.5, 1.5), rnd(1, 3), rnd(0.8, 1.5), rnd(0.3, 0.5), '#55585f', { gr: 0.9, a: 0.45, drag: 1.2, front: 1 });
        for (k = 0; k < 2; k++) R.emit(7, s.x + rnd(-0.5, 0.5), by + 0.2, rnd(-4, 4) + s.vx * 0.3, rnd(5, 9), 2.2, G.bike.wh[k].r, '#1c1d22', { g: 1, vr: rnd(-10, 10), front: 1 });
      } else {
        Au.splash(e.cause); G.sunk = true; G.cam.shake = 0.6;
        var col = e.cause === 'lava' ? '#ff8a2a' : e.cause === 'ice' ? '#bfe6ff' : '#8fd6f5', hz = null;
        for (k = 0; k < G.track.hazards.length; k++) if (s.x > G.track.hazards[k].x0 && s.x < G.track.hazards[k].x1) hz = G.track.hazards[k];
        var ly = hz ? hz.y : s.y;
        for (k = 0; k < 34; k++) R.emit(e.cause === 'lava' ? 3 : 1, s.x + rnd(-0.9, 0.9), ly, rnd(-4, 4) + s.vx * 0.2, rnd(4, 11), rnd(0.6, 1.3), rnd(0.06, 0.16), k % 3 ? col : (e.cause === 'lava' ? '#ffd24a' : '#ffffff'), { g: 1, a: 1, front: 1, vr: rnd(-8, 8) });
        for (k = 0; k < 12; k++) R.emit(0, s.x + rnd(-1, 1), ly + 0.2, rnd(-1.5, 1.5), rnd(1, 3.5), rnd(0.8, 1.6), rnd(0.3, 0.5), e.cause === 'lava' ? '#3a2a2a' : '#ffffff', { gr: 0.9, a: 0.5, drag: 1.2, front: 1 });
      }
      var gotC = P.claim(); if (gotC.length && RR.UI) RR.UI.toastBikes(gotC);
      if (RR.UI) RR.UI.onCrash(e.cause);
    } else if (e.t === 'finish') {
      G.state = 'finish'; G.endT = 0; G.flash = 0.5;
      Au.finish(); buzz(60);
      var fx = G.track.finishX, fy = RR.groundY(G.track, fx);
      var cols = ['#ff4a5a', '#ffd24a', '#5dff7a', '#58c9f0', '#ffffff', '#c9a3ff'];
      for (k = 0; k < 70; k++) R.emit(4, fx + rnd(-1, 1), fy + 4.2, rnd(-5, 7) + s.vx * 0.3, rnd(1, 8), rnd(1.4, 2.6), rnd(0.07, 0.13), cols[k % 6], { g: 0.35, drag: 1.1, vr: rnd(-9, 9), front: 1, rot: rnd(0, 6) });
      finishRun();
      if (RR.UI) RR.UI.onFinish();
    }
  }
  ev.length = 0;
}

/* dirt off the back tyre, exhaust smoke, sparks: emitted a little every tick */
function trailFx() {
  var s = G.sim, b = G.bike, T = R.THEMES[G.track.worldIndex], def = G.bikeDef, ca = Math.cos(s.a), sa = Math.sin(s.a), k;
  var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  emitT += DT; exT += DT;
  var slip = Math.abs(s.slip[0]), mat = s.mat[0];
  if (s.gnd[0] && emitT > 0.016) {
    var amt = (slip > 0.35 ? Math.min(1, slip / 4) : 0) + (s.driveF > 0 && sp > 1 ? 0.12 : 0);
    if (amt > 0 && Math.random() < amt * 1.6) {
      var nx = s.nrmX[0], ny = s.nrmY[0], tx = ny, ty = -nx, cx = s.wx[0] - nx * b.wh[0].r, cy = s.wy[0] - ny * b.wh[0].r;
      var back = s.slip[0] < 0 ? -1 : 1, v0 = rnd(2, 4 + slip * 1.6);
      var col = mat === 2 ? '#dff4ff' : mat === 6 ? '#ffffff' : mat === 4 ? '#b47c48' : mat === 5 ? '#ffd98a' : mat === 10 ? '#20222a' : mat >= 8 ? (Math.random() < 0.5 ? '#d9dbe0' : '#8a8d96') : (Math.random() < 0.5 ? T.ground[0] : T.dust);
      if (mat === 5) R.emit(2, cx, cy, tx * back * v0 + s.vx * 0.3, ty * back * v0 + ny * 2, rnd(0.12, 0.25), 0.04, col, { g: 1 });
      else R.emit(1, cx, cy, tx * back * v0 + nx * rnd(0.5, 3) + s.vx * 0.25, ty * back * v0 + ny * rnd(0.8, 3.5) + s.vy * 0.25, rnd(0.35, 0.7), rnd(0.035, 0.075), col, { g: 1, vr: rnd(-10, 10) });
      if (Math.random() < 0.35) R.emit(0, cx, cy + 0.05, tx * back * 1.2 + rnd(-0.4, 0.4), rnd(0.3, 1.2), rnd(0.4, 0.8), rnd(0.1, 0.2), T.dust, { gr: 0.8, a: 0.4, drag: 2 });
    }
    emitT = 0;
  }
  // locked front wheel under braking
  if (s.gnd[1] && Math.abs(s.slip[1]) > 2 && Math.random() < 0.3) R.emit(0, s.wx[1], s.wy[1] - b.wh[1].r, rnd(-0.5, 0.5), rnd(0.3, 1), rnd(0.3, 0.6), rnd(0.1, 0.18), T.dust, { gr: 0.8, a: 0.4, drag: 2 });
  var ex = RR.Art.exhaust(def);
  if (ex && !s.crashed) {
    var lx = ex[0] - b.com[0], ly = ex[1] - b.com[1], wx = s.x + ca * lx - sa * ly, wy = s.y + sa * lx + ca * ly;
    if (def.rocket) {
      var pw = clamp(s.rocketF / b.rocket, 0, 1.3);
      if (pw > 0.05 && (G.attract || inp.gas)) for (k = 0; k < 2; k++) R.emit(3, wx, wy, s.vx - ca * rnd(5, 9) + rnd(-0.6, 0.6), s.vy - sa * rnd(5, 9) + rnd(-0.6, 0.6), rnd(0.1, 0.22), rnd(0.1, 0.2) * (0.6 + pw * 0.5), k ? '#ff7a1f' : '#ffe07a', { a: 0.9 });
    } else if (s.boost > 0) {
      for (k = 0; k < 2; k++) R.emit(3, wx, wy, s.vx - ca * rnd(3, 6) + rnd(-0.5, 0.5), s.vy - sa * rnd(3, 6) + rnd(-0.5, 0.5), rnd(0.12, 0.26), rnd(0.09, 0.17), k ? '#ff7a1f' : '#ffe07a', { a: 0.9 });
    } else if (exT > (s.driveF > 0 ? 0.05 : 0.14) && s.started) {
      exT = 0;
      R.emit(0, wx, wy, s.vx * 0.6 - ca * rnd(0.5, 1.5), s.vy * 0.6 - sa * rnd(0.5, 1.5) + 0.4, rnd(0.3, 0.6), rnd(0.05, 0.09), def.snd.type === 'two' ? '#cfd6e6' : '#8a8f9c', { gr: 0.5, a: def.snd.type === 'two' ? 0.4 : 0.25, drag: 1.5 });
    }
  }
  if (s.scrape > 2500 && Math.random() < 0.7) {
    for (k = 0; k < 2; k++) R.emit(2, s.x + rnd(-0.5, 0.5), RR.groundY(G.track, s.x) + 0.1, s.vx * 0.5 + rnd(-3, 3), rnd(1, 5), rnd(0.15, 0.3), 0.045, '#ffd98a', { g: 1, front: 1 });
  }
}

/* ------------------------------------------------------------------ */
/* One step of game time                                                */
/* ------------------------------------------------------------------ */
function tickOnce() {
  var s = G.sim, input;
  copyPrev();
  if (G.state === 'attract') {
    RR.botInput(s, botP, botOut); input = botOut;
    RR.tick(s, input);
    onEvents();
    if (s.crashed || s.finished || s.time > 70) { G.attractEnd = (G.attractEnd || 0) + DT; if (G.attractEnd > 1.2) { G.attractEnd = 0; G.menu(); } }
    trailFx();
    return;
  }
  input = readInput();
  if (G.state === 'ready') {
    if (input.gas) {
      s.started = true; G.state = 'run'; Au.go();
      if (Store.data.settings.tilt) G.zeroTilt();
      if (RR.UI) RR.UI.onStart();
    }
    if (G.state === 'ready') input = { lean: 0, brake: false, gas: false };
  } else if (G.state !== 'run') input = { lean: 0, brake: G.state === 'finish', gas: false };
  RR.tick(s, input);
  if (G.state === 'run' && tickN % 8 === 0) Ghost.sample(s);
  if (G.state === 'run') {
    // sitting still for a while (wedged against a wall, flat on its back wheel): point at the restart button
    if (input.gas && Math.abs(s.vx) + Math.abs(s.vy) < 0.6 && s.time > 2) G.stuckT += DT; else G.stuckT = 0;
    if (G.stuckT > 3.5 && !G.stuckSaid) { G.stuckSaid = true; if (RR.UI) RR.UI.toast('Stuck? The round arrow at the top left restarts.'); }
  }
  tickN++;
  onEvents();
  trailFx();
  if (G.wipe) G.wipe.step(DT);
  if (G.state === 'crash' || G.state === 'finish') {
    G.endT += DT;
    if (G.state === 'crash' && G.endT > 0.22) G.timeScale = Math.min(1, G.timeScale + DT * 3);
    if (G.state === 'finish' && G.endT > 1.25 && !G.resultShown) { G.resultShown = true; Au.engineStop(); Au.layersQuiet(); if (RR.UI) RR.UI.results(G.result); }
  }
}

var last = 0, fpsAcc = 0, fpsN = 0, slowT = 0, hudT = 0;
G.frame = function (ts) {
  root.requestAnimationFrame(G.frame);
  var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
  if (!G.sim || G.hidden) return;
  G.t += dt;
  var s = G.sim, n = 0;
  if (G.state !== 'pause') {
    acc += dt * G.timeScale;
    while (acc >= DT && n < 7) { tickOnce(); acc -= DT; n++; s = G.sim; }
    if (n >= 7) acc = 0;
  }
  // blend between the last two physics steps so motion is smooth on any screen
  var al = G.state === 'pause' ? 1 : clamp(acc / DT, 0, 1);
  vis.x = prev.x + (s.x - prev.x) * al; vis.y = prev.y + (s.y - prev.y) * al; vis.a = prev.a + (s.a - prev.a) * al;
  vis.comp[0] = prev.comp[0] + (s.comp[0] - prev.comp[0]) * al; vis.comp[1] = prev.comp[1] + (s.comp[1] - prev.comp[1]) * al;
  vis.wa[0] = prev.wa[0] + (s.wa[0] - prev.wa[0]) * al; vis.wa[1] = prev.wa[1] + (s.wa[1] - prev.wa[1]) * al;
  vis.ww[0] = s.ww[0]; vis.ww[1] = s.ww[1];
  vis.lp = prev.lp + (s.lp - prev.lp) * al;
  var b = G.bike, sq = (s.comp[0] / b.wh[0].travel + s.comp[1] / b.wh[1].travel) * 0.5;
  var k = 1 - Math.exp(-dt * 10);
  vis.stand += ((s.air && s.airT > 0.12 ? 0.75 : 0.1) - vis.stand) * (1 - Math.exp(-dt * 6));
  vis.crouch += (clamp((sq - 0.45) * 2.4, 0, 1) - vis.crouch) * k;
  vis.headTilt = clamp(-s.w * 0.03, -0.2, 0.2);
  if (G.state !== 'pause') {
    var fs = { x: vis.x, y: vis.y, vx: s.vx, vy: s.vy };
    if (G.wipe && G.state === 'crash') { fs.x = (vis.x + G.wipe.fx) * 0.5; fs.y = (vis.y + G.wipe.fy) * 0.5; fs.vx *= 0.3; fs.vy *= 0.3; }
    if (G.sunk) { fs.vx = 0; fs.vy = 0; fs.y = Math.max(fs.y, RR.groundY(G.track, s.x - 6)); }
    if (!G.camHold) R.camFollow(G.cam, fs, G.track, dt, R.size().w / R.size().h, false, G.attract ? 0.06 : null);
    else { G.cam.px = G.cam.x; G.cam.py = G.cam.y; }
    R.stepParts(dt * G.timeScale, s.g, G.track);
  }
  if (G.look && G.look.paint && G.look.paint.trail && G.state !== 'pause') {
    var tr0 = G.trail || (G.trail = []), ca2 = Math.cos(vis.a), sa2 = Math.sin(vis.a), lx2 = -b.com[0], ly2 = b.wh[0].r * 0.9 - b.com[1], spd2 = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    tr0.push({ x: vis.x + ca2 * lx2 - sa2 * ly2, y: vis.y + sa2 * lx2 + ca2 * ly2 });
    if (tr0.length > 22) tr0.shift();
    G.trailAmt = (G.trailAmt || 0) + ((spd2 > 5 && !s.crashed ? Math.min(1, (spd2 - 5) / 6) : 0) - (G.trailAmt || 0)) * Math.min(1, dt * 6);
    if (G.look.paint.trail.spark && spd2 > 8 && !s.crashed && Math.random() < dt * 14) R.emit(8, tr0[tr0.length - 1].x + rnd(-0.2, 0.2), tr0[tr0.length - 1].y + rnd(-0.1, 0.3), s.vx * 0.2 + rnd(-0.5, 0.5), rnd(0.2, 1.2), rnd(0.3, 0.6), rnd(0.05, 0.1), G.look.paint.trail.spark, { draw: sparkDraw, fade: 0.6 });
  } else if (G.trail) G.trail.length = 0;
  G.ghostPose = (G.state === 'run' || G.state === 'ready') && Store.data.settings.ghost && Ghost.play ? Ghost.pose(s.time, gp) : null;
  G.flash = Math.max(0, G.flash - dt * 1.6);
  G.boostGlow += ((s.boost > 0 ? 1 : 0) - G.boostGlow) * (1 - Math.exp(-dt * 8));
  if (G.sunk) { vis.y = -9999; }
  R.frame(G, dt);

  // sound that follows the bike
  if (!G.attract && G.state !== 'pause') {
    var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy), run = G.state === 'run';
    Au.engineUpdate({ v: -s.ww[0] * b.wh[0].r, vmax: G.bikeDef.vmax, gas: run && inp.gas ? 1 : 0, air: s.airW[0] > 0.12, boost: s.boost > 0, dt: dt });
    var sl = Math.abs(s.slip[0]) * (s.gnd[0] ? 1 : 0), sf = Math.abs(s.slip[1]) * (s.gnd[1] ? 1 : 0);
    var hard = s.mat[0] === 1 || s.mat[0] === 5 || s.mat[0] === 2 || s.mat[0] === 4 || s.mat[0] >= 8;
    Au.layersUpdate({
      kerb: s.gnd[0] && s.mat[0] === 9 || s.gnd[1] && s.mat[1] === 9 ? clamp(sp / 12, 0.2, 1) : 0,
      skid: clamp(((hard ? sl : sl * 0.3) + sf * 0.6 - 0.6) / 6, 0, 1), dirt: clamp((hard ? 0 : sl - 0.3) / 4, 0, 1) + (s.gnd[0] && !hard ? clamp(sp / 60, 0, 0.25) : 0),
      wind: G.track.airless ? 0 : clamp((sp - 4) / 26, 0, 1) * (s.air ? 1 : 0.55), scrape: clamp(s.scrape / 30000, 0, 1), boost: s.boost > 0 || (G.bikeDef.rocket && run && inp.gas) ? 1 : 0
    });
  }
  hudT += dt;
  if (RR.UI && hudT > 0.033) { hudT = 0; RR.UI.hud(G, In); }

  // drop the picture quality a notch if the phone cannot keep up
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 1.5) {
    var avg = fpsAcc / fpsN; fpsAcc = 0; fpsN = 0;
    if (Store.data.settings.quality === 'auto') { if (avg > 0.023) slowT++; else slowT = Math.max(0, slowT - 1); if (slowT >= 2 && G.onSlow) { slowT = 0; G.onSlow(); } }
  }
};
})(typeof window !== 'undefined' ? window : globalThis);
