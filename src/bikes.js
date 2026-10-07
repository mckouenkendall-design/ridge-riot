/* Ridge Riot: the bikes.
   Every number here changes how the bike rides. Lengths are metres measured
   from the ground under the rear axle (x forward, y up) with the bike at rest.
   mass      bike + rider, kg            kgyr     how "spread out" the weight is (bigger = slower to flip)
   wb        wheelbase                   rr / rf  rear / front wheel radius
   com       centre of mass              rake     fork angle from vertical, degrees
   sus       [rear, front]: travel (m), freq (Hz, lower = softer), zc / zr = damping squashing / rebounding
   accel     peak push in g              vp       speed where the push starts fading (m/s)
   vmax      top speed (m/s)             grip     tyre grip multiplier
   leanAcc   how hard the rider can rotate the bike (rad/s^2)
   spin      fastest flip rate (rad/s)                                        */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});

function body(com, rr, wb, top) {
  return [[com[0], rr * 1.02, 0.12], [-0.22, top - 0.08, 0.09], [wb - 0.22, top + 0.05, 0.09], [wb - 0.45, top + 0.2, 0.07], [0.3, top - 0.02, 0.1]];
}

RR.BIKES = [
  {
    id: 'scrapper', name: 'Scrapper 125', kind: 'mx', tag: 'The honest starter',
    blurb: 'Light two-stroke dirt bike. Does everything well enough and nothing badly.',
    mass: 172, kgyr: 0.46, wb: 1.44, rr: 0.33, rf: 0.345, com: [0.63, 0.80], wheelMass: [11, 9], rake: 27, swing: 10,
    sus: [{ travel: 0.27, freq: 2.0, sag: 0.3, zc: 0.42, zr: 0.95 }, { travel: 0.28, freq: 1.95, sag: 0.28, zc: 0.40, zr: 0.90 }],
    accel: 0.62, vp: 9, vmax: 15.5, grip: 1.0, brake: 0.85, leanAcc: 15, spin: 6.4, cda: 0.5,
    rider: { seat: [0.42, 0.93], peg: [0.52, 0.42], grip: [0.98, 1.17], scale: 1, torso: 0.38 },
    col: ['#f2c230', '#1d2233', '#ffffff'], suit: ['#f2c230', '#1d2233', '#e8483a'],
    snd: { type: 'two', pitch: 1.0, gears: 5 },
    unlock: { type: 'free' }
  },
  {
    id: 'mosquito', name: 'Mosquito 50', kind: 'mini', tag: 'Tiny, twitchy, flips for fun',
    blurb: 'A pit bike with wheels the size of dinner plates. Spins like a coin, hates big bumps.',
    mass: 126, kgyr: 0.37, wb: 1.02, rr: 0.225, rf: 0.225, com: [0.45, 0.68], wheelMass: [5.5, 5], rake: 25, swing: 8,
    sus: [{ travel: 0.13, freq: 2.7, sag: 0.3, zc: 0.45, zr: 0.9 }, { travel: 0.13, freq: 2.7, sag: 0.3, zc: 0.42, zr: 0.9 }],
    accel: 0.60, vp: 7.5, vmax: 13.6, grip: 0.96, brake: 0.8, leanAcc: 23, spin: 8.4, cda: 0.5,
    rider: { seat: [0.28, 0.70], peg: [0.40, 0.30], grip: [0.74, 0.96], scale: 0.96, torso: 0.30 },
    col: ['#e8483a', '#20242e', '#ffe9a8'], suit: ['#3a7be8', '#ffffff', '#20242e'],
    snd: { type: 'mini', pitch: 1.45, gears: 4 },
    unlock: { type: 'stars', n: 6 }
  },
  {
    id: 'dune', name: 'Dune Runner 450', kind: 'enduro', tag: 'More power, softer legs',
    blurb: 'A big single-cylinder thumper with long, forgiving suspension. Soaks up bad landings.',
    mass: 200, kgyr: 0.48, wb: 1.50, rr: 0.34, rf: 0.36, com: [0.66, 0.84], wheelMass: [12, 10], rake: 27.5, swing: 10,
    sus: [{ travel: 0.31, freq: 1.75, sag: 0.3, zc: 0.45, zr: 1.0 }, { travel: 0.32, freq: 1.7, sag: 0.28, zc: 0.42, zr: 0.95 }],
    accel: 0.76, vp: 10, vmax: 18.2, grip: 1.03, brake: 0.9, leanAcc: 13.5, spin: 5.9, cda: 0.55,
    rider: { seat: [0.44, 0.97], peg: [0.54, 0.43], grip: [1.02, 1.22], scale: 1, torso: 0.36 },
    col: ['#2f6fd6', '#f5f1e6', '#f08a24'], suit: ['#f5f1e6', '#2f6fd6', '#f08a24'],
    snd: { type: 'thump', pitch: 0.82, gears: 5 },
    unlock: { type: 'stars', n: 14 }
  },
  {
    id: 'goat', name: 'Billy Goat', kind: 'trials', tag: 'Climbs anything, slowly',
    blurb: 'Trials bike. Glue for tyres, huge low-down pull and it turns on a coin. Runs out of puff early.',
    mass: 148, kgyr: 0.42, wb: 1.32, rr: 0.34, rf: 0.35, com: [0.57, 0.72], wheelMass: [9, 8], rake: 24, swing: 9,
    sus: [{ travel: 0.19, freq: 2.2, sag: 0.3, zc: 0.4, zr: 0.9 }, { travel: 0.20, freq: 2.2, sag: 0.3, zc: 0.4, zr: 0.9 }],
    accel: 0.88, vp: 5.5, vmax: 12.8, grip: 1.38, brake: 1.0, leanAcc: 21, spin: 7.6, cda: 0.5,
    rider: { seat: [0.36, 0.86], peg: [0.50, 0.36], grip: [0.92, 1.12], scale: 1, torso: 0.34, stand: 0.5 },
    col: ['#3fb56b', '#f5f1e6', '#20242e'], suit: ['#20242e', '#3fb56b', '#f5f1e6'],
    snd: { type: 'trial', pitch: 0.9, gears: 4 },
    unlock: { type: 'world', n: 1, text: 'Finish every Dustbowl track' }
  },
  {
    id: 'biscotti', name: 'Biscotti 50', kind: 'scooter', tag: 'It should not be here',
    blurb: 'A town scooter. Tiny wheels, all the weight at the back, wheelies if you look at it. Surprisingly fun.',
    mass: 176, kgyr: 0.44, wb: 1.27, rr: 0.215, rf: 0.215, com: [0.50, 0.62], wheelMass: [6.5, 5.5], rake: 26, swing: 5,
    sus: [{ travel: 0.10, freq: 2.6, sag: 0.3, zc: 0.45, zr: 0.9 }, { travel: 0.10, freq: 2.5, sag: 0.3, zc: 0.45, zr: 0.9 }],
    accel: 0.55, vp: 8, vmax: 14.6, grip: 0.95, brake: 0.8, leanAcc: 14.5, spin: 6.1, cda: 0.6,
    rider: { seat: [0.33, 0.80], peg: [0.74, 0.34], grip: [1.02, 1.08], scale: 1, torso: 0.12 },
    col: ['#59c7c2', '#f5f1e6', '#7a4a2a'], suit: ['#f5f1e6', '#c9412f', '#7a4a2a'],
    snd: { type: 'scoot', pitch: 1.2, gears: 0 },
    unlock: { type: 'flips', n: 15, text: 'Land 15 flips in total' }
  },
  {
    id: 'mule', name: 'Iron Mule', kind: 'chopper', tag: 'Heavy metal, never in a hurry',
    blurb: 'A long, low chopper. Rock steady and nearly impossible to tip over. Flipping it takes commitment.',
    mass: 318, kgyr: 0.62, wb: 1.86, rr: 0.33, rf: 0.37, com: [0.80, 0.66], wheelMass: [16, 11], rake: 40, swing: 6,
    sus: [{ travel: 0.11, freq: 2.2, sag: 0.3, zc: 0.5, zr: 1.0 }, { travel: 0.17, freq: 2.0, sag: 0.3, zc: 0.45, zr: 0.95 }],
    accel: 0.72, vp: 9, vmax: 17.6, grip: 1.05, brake: 0.8, leanAcc: 9.5, spin: 4.4, groundSpin: 1.6, cda: 0.65,
    rider: { seat: [0.40, 0.72], peg: [1.02, 0.42], grip: [0.92, 1.30], scale: 1, torso: -0.10 },
    col: ['#1b1d24', '#c9412f', '#d9dde3'], suit: ['#1b1d24', '#1b1d24', '#d9dde3'],
    snd: { type: 'vtwin', pitch: 0.62, gears: 5 },
    unlock: { type: 'stars', n: 30 }
  },
  {
    id: 'bandit', name: 'Cafe Bandit', kind: 'cafe', tag: 'Fast, stiff, unforgiving',
    blurb: 'A road-going twin with clip-on bars. Quick in a straight line. Lands like a dropped toolbox.',
    mass: 262, kgyr: 0.50, wb: 1.42, rr: 0.32, rf: 0.32, com: [0.69, 0.74], wheelMass: [14, 11], rake: 25, swing: 8,
    sus: [{ travel: 0.12, freq: 2.6, sag: 0.3, zc: 0.5, zr: 1.0 }, { travel: 0.13, freq: 2.5, sag: 0.3, zc: 0.5, zr: 1.0 }],
    accel: 0.84, vp: 13, vmax: 21.5, grip: 1.0, brake: 1.0, leanAcc: 12.5, spin: 5.6, cda: 0.45,
    rider: { seat: [0.40, 0.84], peg: [0.46, 0.44], grip: [0.98, 0.98], scale: 1, torso: 0.62 },
    col: ['#7d1f2b', '#d8c9a0', '#1b1d24'], suit: ['#3b2a20', '#d8c9a0', '#1b1d24'],
    snd: { type: 'twin', pitch: 0.9, gears: 5 },
    unlock: { type: 'stars', n: 42 }
  },
  {
    id: 'volt', name: 'Volt Wraith', kind: 'electric', tag: 'Silent, instant shove',
    blurb: 'Electric. No gears, no noise, all the pull from a standstill, and it slows itself when you brake.',
    mass: 215, kgyr: 0.44, wb: 1.40, rr: 0.33, rf: 0.33, com: [0.68, 0.70], wheelMass: [11, 9], rake: 26, swing: 9,
    sus: [{ travel: 0.23, freq: 2.1, sag: 0.3, zc: 0.45, zr: 1.0 }, { travel: 0.24, freq: 2.05, sag: 0.3, zc: 0.42, zr: 0.95 }],
    accel: 0.98, vp: 11, vmax: 19.2, grip: 1.08, brake: 1.0, leanAcc: 15.5, spin: 6.3, cda: 0.48, ebrake: 0.2,
    rider: { seat: [0.42, 0.90], peg: [0.52, 0.40], grip: [0.98, 1.12], scale: 1, torso: 0.42 },
    col: ['#e9edf2', '#22e0c8', '#1b1d24'], suit: ['#1b1d24', '#22e0c8', '#e9edf2'],
    snd: { type: 'electric', pitch: 1.0, gears: 0 },
    unlock: { type: 'world', n: 3, text: 'Finish every Frostbite track' }
  },
  {
    id: 'hoss', name: 'Big Hoss', kind: 'fat', tag: 'Monster tyres roll over it all',
    blurb: 'Balloon tyres nearly a metre tall. Bumps disappear, grip is silly, and it bounces like a space hopper.',
    mass: 246, kgyr: 0.56, wb: 1.64, rr: 0.47, rf: 0.47, com: [0.75, 1.0], wheelMass: [21, 19], rake: 28, swing: 9,
    sus: [{ travel: 0.22, freq: 1.7, sag: 0.3, zc: 0.3, zr: 0.55 }, { travel: 0.22, freq: 1.7, sag: 0.3, zc: 0.3, zr: 0.55 }],
    accel: 0.72, vp: 9.5, vmax: 16.8, grip: 1.28, brake: 0.9, leanAcc: 10.5, spin: 4.9, cda: 0.7,
    rider: { seat: [0.50, 1.12], peg: [0.62, 0.62], grip: [1.12, 1.40], scale: 1, torso: 0.34 },
    col: ['#f08a24', '#20242e', '#f5f1e6'], suit: ['#20242e', '#f08a24', '#f5f1e6'],
    snd: { type: 'thump', pitch: 0.66, gears: 4 },
    unlock: { type: 'air', n: 2.2, text: 'Stay airborne for 2.2 seconds in one jump' }
  },
  {
    id: 'razor', name: 'Razorback RR', kind: 'sport', tag: 'Far too fast for dirt',
    blurb: 'A four-cylinder superbike. Nothing else gets near its top speed. Braking is not optional.',
    mass: 276, kgyr: 0.48, wb: 1.42, rr: 0.33, rf: 0.31, com: [0.74, 0.72], wheelMass: [14, 11], rake: 24, swing: 8,
    sus: [{ travel: 0.13, freq: 2.7, sag: 0.3, zc: 0.5, zr: 1.0 }, { travel: 0.12, freq: 2.7, sag: 0.3, zc: 0.5, zr: 1.0 }],
    accel: 1.02, vp: 15, vmax: 26, grip: 1.02, brake: 1.15, leanAcc: 12, spin: 5.5, cda: 0.34,
    rider: { seat: [0.36, 0.86], peg: [0.40, 0.48], grip: [0.96, 0.92], scale: 1, torso: 0.78 },
    col: ['#d91e36', '#f5f1e6', '#1b1d24'], suit: ['#d91e36', '#f5f1e6', '#1b1d24'],
    snd: { type: 'four', pitch: 1.0, gears: 6 },
    unlock: { type: 'stars', n: 72 }
  },
  {
    id: 'longlegs', name: 'Longlegs 500', kind: 'climber', tag: 'Cannot be flipped by a hill',
    blurb: 'A hill-climb special: stretched swingarm, paddle tyre, weight way up front. Goes up walls. Lazy in the air.',
    mass: 212, kgyr: 0.60, wb: 1.98, rr: 0.36, rf: 0.36, com: [1.10, 0.84], wheelMass: [13, 9], rake: 27, swing: 6,
    sus: [{ travel: 0.34, freq: 1.6, sag: 0.3, zc: 0.45, zr: 1.0 }, { travel: 0.33, freq: 1.6, sag: 0.3, zc: 0.42, zr: 0.95 }],
    accel: 1.06, vp: 9, vmax: 19.6, grip: 1.34, brake: 0.9, leanAcc: 11, spin: 5.1, cda: 0.55,
    rider: { seat: [0.92, 0.97], peg: [1.04, 0.43], grip: [1.50, 1.22], scale: 1, torso: 0.44 },
    col: ['#8a4fd6', '#f2c230', '#1b1d24'], suit: ['#f2c230', '#8a4fd6', '#1b1d24'],
    snd: { type: 'thump', pitch: 1.0, gears: 4 },
    unlock: { type: 'world', n: 4, text: 'Finish every Cinder Peak track' }
  },
  {
    id: 'comet', name: 'Comet-9', kind: 'rocket', tag: 'A jet engine with a seat',
    blurb: 'Turbine thrust that keeps pushing in mid-air, so where you point it is where you go. The last prize.',
    mass: 228, kgyr: 0.50, wb: 1.56, rr: 0.31, rf: 0.31, com: [0.78, 0.70], wheelMass: [10, 9], rake: 29, swing: 7,
    sus: [{ travel: 0.20, freq: 2.2, sag: 0.3, zc: 0.48, zr: 1.0 }, { travel: 0.20, freq: 2.2, sag: 0.3, zc: 0.45, zr: 1.0 }],
    accel: 0.30, vp: 14, vmax: 23.5, grip: 1.05, brake: 1.1, leanAcc: 13.5, spin: 5.8, cda: 0.4, rocket: 0.62, rocketV: 23.5, leanGround: 1.25,
    rider: { seat: [0.40, 0.80], peg: [0.50, 0.42], grip: [1.02, 0.98], scale: 1, torso: 0.66 },
    col: ['#dfe4ea', '#ff6a1f', '#2a3550'], suit: ['#dfe4ea', '#ff6a1f', '#2a3550'],
    snd: { type: 'jet', pitch: 1.0, gears: 0 },
    unlock: { type: 'stars', n: 100 }
  }
];

RR.BIKE = {};
RR.BIKES.forEach(function (d, i) {
  d.index = i;
  var top = d.rider.seat[1];
  if (!d.body) d.body = body(d.com, Math.min(d.rr, 0.36), d.wb, top);
  RR.BIKE[d.id] = d;
});

/* 0..1 bars for the garage screen, worked out from the real numbers */
RR.bikeStats = function (d) {
  function n(v, a, b) { return Math.max(0.06, Math.min(1, (v - a) / (b - a))); }
  return {
    Speed: n(d.vmax, 11, 26),
    Launch: n(d.accel + (d.rocket || 0) * 0.8, 0.45, 1.1),
    Grip: n(d.grip, 0.85, 1.4),
    Suspension: n((d.sus[0].travel + d.sus[1].travel) / 2, 0.06, 0.34),
    Agility: n(d.leanAcc * d.spin, 35, 190),
    Weight: n(d.mass, 110, 320)
  };
};

if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
