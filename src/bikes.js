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
    id: 'scrapper', name: 'Scrapper 125', kind: 'mx', tag: 'The honest starter', wipe: 'stars',
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
    id: 'mosquito', name: 'Mosquito 50', kind: 'mini', tag: 'Tiny, twitchy, flips for fun', wipe: 'pop',
    blurb: 'A pit bike with wheels the size of dinner plates. Spins like a coin, hates big bumps, fits under most things.',
    mass: 126, kgyr: 0.37, wb: 1.02, rr: 0.225, rf: 0.225, com: [0.45, 0.68], wheelMass: [5.5, 5], rake: 25, swing: 8,
    sus: [{ travel: 0.13, freq: 2.7, sag: 0.3, zc: 0.45, zr: 0.9 }, { travel: 0.13, freq: 2.7, sag: 0.3, zc: 0.42, zr: 0.9 }],
    accel: 0.60, vp: 7.5, vmax: 14.4, grip: 0.96, brake: 0.8, leanAcc: 23, spin: 8.4, cda: 0.5,
    rider: { seat: [0.28, 0.73], peg: [0.40, 0.30], grip: [0.74, 0.98], scale: 1, torso: 0.26 },
    col: ['#e8483a', '#20242e', '#ffe9a8'], suit: ['#3a7be8', '#ffffff', '#20242e'],
    snd: { type: 'mini', pitch: 1.45, gears: 4 },
    unlock: { type: 'stars', n: 6 }
  },
  {
    id: 'dune', name: 'Dune Runner 450', kind: 'enduro', tag: 'More power, softer legs', wipe: 'tumble',
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
    id: 'goat', name: 'Billy Goat', kind: 'trials', tag: 'Climbs anything, slowly', wipe: 'goat',
    blurb: 'Trials bike. Glue for tyres, huge low-down pull and it turns on a coin. Runs out of puff early.',
    mass: 148, kgyr: 0.42, wb: 1.32, rr: 0.34, rf: 0.35, com: [0.61, 0.72], wheelMass: [9, 8], rake: 24, swing: 9,
    sus: [{ travel: 0.19, freq: 2.2, sag: 0.3, zc: 0.4, zr: 0.9 }, { travel: 0.20, freq: 2.2, sag: 0.3, zc: 0.4, zr: 0.9 }],
    accel: 0.86, vp: 5.5, vmax: 12.8, grip: 1.38, brake: 1.0, leanAcc: 21, spin: 7.6, cda: 0.5,
    rider: { seat: [0.36, 0.86], peg: [0.50, 0.36], grip: [0.92, 1.12], scale: 1, torso: 0.34, stand: 0.5 },
    col: ['#3fb56b', '#f5f1e6', '#20242e'], suit: ['#20242e', '#3fb56b', '#f5f1e6'],
    snd: { type: 'trial', pitch: 0.9, gears: 4 },
    unlock: { type: 'world', w: 'dust', text: 'Finish every Dustbowl track' }
  },
  {
    id: 'biscotti', name: 'Biscotti 50', kind: 'scooter', tag: 'It should not be here', wipe: 'birds',
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
    id: 'penny', name: 'Penny Dreadful', kind: 'penny', tag: 'One huge wheel, one afterthought', wipe: 'paper',
    blurb: 'A motorised penny-farthing. The big wheel rolls over anything. You sit a long way up, so mind your head.',
    mass: 150, kgyr: 0.56, wb: 1.08, rr: 0.20, rf: 0.56, com: [0.68, 1.00], wheelMass: [7.5, 13], rake: 10, swing: 8,
    sus: [{ travel: 0.08, freq: 2.7, sag: 0.3, zc: 0.45, zr: 0.9 }, { travel: 0.11, freq: 2.4, sag: 0.3, zc: 0.42, zr: 0.9 }],
    accel: 0.50, vp: 7, vmax: 13.4, grip: 0.98, brake: 0.5, leanAcc: 14.5, spin: 5.7, cda: 0.7,
    rider: { seat: [0.60, 1.21], peg: [1.00, 0.62], grip: [1.02, 1.46], scale: 0.95, torso: 0.2 },
    body: [[0.5, 0.42, 0.1], [0.2, 1.12, 0.09], [0.86, 1.3, 0.09], [0.6, 1.16, 0.1]],
    col: ['#1f3d36', '#c9a24a', '#f1e6cc'], suit: ['#5a3a2a', '#c9b98a', '#2a2118'],
    snd: { type: 'scoot', pitch: 0.72, gears: 0 },
    unlock: { type: 'dist', n: 20000, text: 'Ride 20 km in total' }
  },
  {
    id: 'mule', name: 'Iron Mule', kind: 'chopper', tag: 'Heavy metal, never in a hurry', wipe: 'tomb',
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
    id: 'bandit', name: 'Cafe Bandit', kind: 'cafe', tag: 'Fast, stiff, unforgiving', wipe: 'shatter',
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
    id: 'volt', name: 'Volt Wraith', kind: 'electric', tag: 'Silent, instant shove', wipe: 'zap',
    blurb: 'Electric. No gears, no noise, all the pull from a standstill, and it slows itself when you brake.',
    mass: 215, kgyr: 0.44, wb: 1.40, rr: 0.33, rf: 0.33, com: [0.73, 0.70], wheelMass: [11, 9], rake: 26, swing: 9,
    sus: [{ travel: 0.23, freq: 2.1, sag: 0.3, zc: 0.45, zr: 1.0 }, { travel: 0.24, freq: 2.05, sag: 0.3, zc: 0.42, zr: 0.95 }],
    accel: 0.98, vp: 11, vmax: 19.2, grip: 1.08, brake: 1.0, leanAcc: 15.5, spin: 6.3, cda: 0.48, ebrake: 0.2,
    rider: { seat: [0.42, 0.90], peg: [0.52, 0.40], grip: [0.98, 1.12], scale: 1, torso: 0.42 },
    col: ['#e9edf2', '#22e0c8', '#1b1d24'], suit: ['#1b1d24', '#22e0c8', '#e9edf2'],
    snd: { type: 'electric', pitch: 1.0, gears: 0 },
    unlock: { type: 'world', w: 'frost', text: 'Finish every Frostbite track' }
  },
  {
    id: 'hoss', name: 'Big Hoss', kind: 'fat', tag: 'Monster tyres roll over it all', wipe: 'ball',
    blurb: 'Balloon tyres nearly a metre tall. Bumps disappear, grip is silly, and it bounces like a space hopper.',
    mass: 246, kgyr: 0.56, wb: 1.64, rr: 0.47, rf: 0.47, com: [0.75, 1.0], wheelMass: [21, 19], rake: 28, swing: 9,
    sus: [{ travel: 0.22, freq: 1.7, sag: 0.3, zc: 0.3, zr: 0.55 }, { travel: 0.22, freq: 1.7, sag: 0.3, zc: 0.3, zr: 0.55 }],
    accel: 0.72, vp: 9.5, vmax: 16.8, grip: 1.28, brake: 0.9, leanAcc: 10.5, spin: 4.9, cda: 0.7,
    rider: { seat: [0.50, 1.12], peg: [0.62, 0.62], grip: [1.12, 1.40], scale: 1, torso: 0.34 },
    col: ['#f08a24', '#20242e', '#f5f1e6'], suit: ['#20242e', '#f08a24', '#f5f1e6'],
    snd: { type: 'thump', pitch: 0.66, gears: 4 },
    unlock: { type: 'air', n: 2.2, text: 'Stay in the air for 2.2 seconds' }
  },
  {
    id: 'marsh', name: 'Marshmallow', kind: 'bumper', tag: 'One free bonk on the head', wipe: 'mallows',
    blurb: 'Padded all over, with a roll hoop. The first time your helmet hits the ground each run, it bounces instead.',
    mass: 236, kgyr: 0.52, wb: 1.50, rr: 0.38, rf: 0.38, com: [0.70, 0.84], wheelMass: [14, 13], rake: 26, swing: 9,
    sus: [{ travel: 0.26, freq: 1.75, sag: 0.3, zc: 0.38, zr: 0.75 }, { travel: 0.26, freq: 1.75, sag: 0.3, zc: 0.38, zr: 0.75 }],
    accel: 0.66, vp: 9, vmax: 15.8, grip: 1.12, brake: 0.9, leanAcc: 12.5, spin: 5.4, cda: 0.65, bonk: 1,
    rider: { seat: [0.44, 1.00], peg: [0.56, 0.48], grip: [1.02, 1.24], scale: 1, torso: 0.32 },
    col: ['#ffb3d6', '#fff8ee', '#7ad3ff'], suit: ['#fff8ee', '#ffb3d6', '#7ad3ff'],
    snd: { type: 'thump', pitch: 0.9, gears: 4 },
    unlock: { type: 'crashes', n: 100, text: 'Crash 100 times' }
  },
  {
    id: 'razor', name: 'Razorback RR', kind: 'sport', tag: 'Far too fast for dirt', wipe: 'twinkle',
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
    id: 'longlegs', name: 'Longlegs 500', kind: 'climber', tag: 'Cannot be flipped by a hill', wipe: 'noodle',
    blurb: 'A hill-climb special: stretched swingarm, paddle tyre, weight way up front. Goes up walls. Lazy in the air.',
    mass: 212, kgyr: 0.60, wb: 1.98, rr: 0.36, rf: 0.36, com: [1.10, 0.84], wheelMass: [13, 9], rake: 27, swing: 6,
    sus: [{ travel: 0.34, freq: 1.6, sag: 0.3, zc: 0.45, zr: 1.0 }, { travel: 0.33, freq: 1.6, sag: 0.3, zc: 0.42, zr: 0.95 }],
    accel: 1.06, vp: 9, vmax: 19.6, grip: 1.34, brake: 0.9, leanAcc: 11, spin: 5.1, cda: 0.55,
    rider: { seat: [0.92, 0.97], peg: [1.04, 0.43], grip: [1.50, 1.22], scale: 1, torso: 0.44 },
    col: ['#8a4fd6', '#f2c230', '#1b1d24'], suit: ['#f2c230', '#8a4fd6', '#1b1d24'],
    snd: { type: 'thump', pitch: 1.0, gears: 4 },
    unlock: { type: 'world', w: 'cinder', text: 'Finish every Cinder Peak track' }
  },
  {
    id: 'sling', name: 'Slingshot', kind: 'drag', tag: 'A quarter mile of bad ideas', wipe: 'chute',
    blurb: 'A drag bike as long as a sofa. Cannot wheelie, barely flips, and leaves everything else standing.',
    mass: 300, kgyr: 0.66, wb: 2.20, rr: 0.36, rf: 0.27, com: [1.24, 0.54], wheelMass: [20, 8], rake: 37, swing: 4,
    sus: [{ travel: 0.08, freq: 2.9, sag: 0.3, zc: 0.5, zr: 1.0 }, { travel: 0.11, freq: 2.7, sag: 0.3, zc: 0.5, zr: 1.0 }],
    accel: 1.25, vp: 17, vmax: 29, grip: 1.25, brake: 1.1, leanAcc: 8.5, spin: 4.3, cda: 0.3,
    rider: { seat: [0.74, 0.70], peg: [0.50, 0.36], grip: [1.42, 0.80], scale: 1, torso: 1.0 },
    body: [[1.2, 0.33, 0.1], [-0.42, 0.14, 0.07], [1.95, 0.58, 0.09], [0.55, 0.78, 0.09], [1.5, 0.74, 0.09]],
    col: ['#16181e', '#ff2d6f', '#ffd24a'], suit: ['#16181e', '#ff2d6f', '#ffd24a'],
    snd: { type: 'drag', pitch: 1.0, gears: 3 },
    unlock: { type: 'speed', n: 25, text: 'Hit 90 km/h' }
  },
  {
    id: 'comet', name: 'Comet-9', kind: 'rocket', tag: 'A jet engine with a seat', wipe: 'firework',
    blurb: 'Turbine thrust that keeps pushing in mid-air, so where you point it is where you go. The top of the star ladder.',
    mass: 228, kgyr: 0.50, wb: 1.56, rr: 0.31, rf: 0.31, com: [0.78, 0.70], wheelMass: [10, 9], rake: 29, swing: 7,
    sus: [{ travel: 0.20, freq: 2.2, sag: 0.3, zc: 0.48, zr: 1.0 }, { travel: 0.20, freq: 2.2, sag: 0.3, zc: 0.45, zr: 1.0 }],
    accel: 0.30, vp: 14, vmax: 23.5, grip: 1.05, brake: 1.1, leanAcc: 13.5, spin: 5.8, cda: 0.4, rocket: 0.62, rocketV: 23.5, leanGround: 1.25,
    rider: { seat: [0.40, 0.80], peg: [0.50, 0.42], grip: [1.02, 0.98], scale: 1, torso: 0.66 },
    col: ['#dfe4ea', '#ff6a1f', '#2a3550'], suit: ['#dfe4ea', '#ff6a1f', '#2a3550'],
    snd: { type: 'jet', pitch: 1.0, gears: 0 },
    unlock: { type: 'stars', n: 100 }
  },

  /* ---- Phase 2: nine bikes, each with one trick no other bike has (trick: the line the garage shows) ---- */
  {
    id: 'puffin', name: 'Puffin 150', kind: 'puffer', tag: 'One extra hop in mid-air', wipe: 'puffball',
    blurb: 'A light trail bike with a tank of compressed air and a nozzle under the seat.',
    trick: 'Tap brake in the air for one puff of air out of the bottom of the bike. Landing refills it.',
    mass: 170, kgyr: 0.46, wb: 1.40, rr: 0.32, rf: 0.33, com: [0.62, 0.80], wheelMass: [10, 9], rake: 27, swing: 10,
    sus: [{ travel: 0.25, freq: 2.0, sag: 0.3, zc: 0.42, zr: 0.95 }, { travel: 0.26, freq: 1.95, sag: 0.28, zc: 0.40, zr: 0.90 }],
    accel: 0.62, vp: 9, vmax: 15.8, grip: 1.0, brake: 0.85, leanAcc: 15, spin: 6.2, cda: 0.5, hop: 3.0,
    rider: { seat: [0.41, 0.92], peg: [0.51, 0.42], grip: [0.96, 1.15], scale: 1, torso: 0.38 },
    col: ['#2bb3c0', '#f5f1e6', '#ff8a3d'], suit: ['#1d2233', '#2bb3c0', '#ff8a3d'],
    snd: { type: 'puffer', pitch: 1.1, gears: 5 },
    unlock: { type: 'gears', n: 6, text: 'Find 6 hidden gears' }
  },
  {
    id: 'turbo', name: 'Spool 600', kind: 'turbo', tag: 'Hold the gas and it keeps pulling', wipe: 'blowoff',
    blurb: 'A street tracker with a turbocharger the size of a melon bolted to the side.',
    trick: 'Turbo: the longer you hold the gas, the harder it pulls, up to half as much again after two seconds. Let off for a moment and the boost is gone.',
    mass: 205, kgyr: 0.47, wb: 1.45, rr: 0.32, rf: 0.32, com: [0.68, 0.76], wheelMass: [12, 10], rake: 26, swing: 9,
    sus: [{ travel: 0.18, freq: 2.3, sag: 0.3, zc: 0.46, zr: 1.0 }, { travel: 0.19, freq: 2.25, sag: 0.3, zc: 0.44, zr: 0.95 }],
    accel: 0.64, vp: 10, vmax: 16.6, grip: 1.04, brake: 0.95, leanAcc: 13.5, spin: 5.8, cda: 0.5, turbo: { build: 2.2, power: 0.5, top: 0.16 },
    rider: { seat: [0.40, 0.86], peg: [0.50, 0.40], grip: [0.98, 1.06], scale: 1, torso: 0.5 },
    col: ['#ff6a00', '#1b1d24', '#f2f2f2'], suit: ['#1b1d24', '#ff6a00', '#f2f2f2'],
    snd: { type: 'turbo', pitch: 1.0, gears: 5 },
    unlock: { type: 'jump', n: 25, text: 'Clear 25 m in one jump' }
  },
  {
    id: 'couple', name: 'Odd Couple', kind: 'sidecar', tag: 'Cannot flip, cannot tip', wipe: 'tandem',
    blurb: 'An old sidecar outfit with a passenger who leans for you. It will not flip, and it will not tip over either.',
    trick: 'The passenger keeps the bike near its line: no flips, so no flip boosts, but it never tips over.',
    mass: 300, kgyr: 0.55, wb: 1.56, rr: 0.32, rf: 0.33, com: [0.72, 0.72], wheelMass: [13, 10], rake: 28, swing: 8,
    sus: [{ travel: 0.18, freq: 2.0, sag: 0.3, zc: 0.48, zr: 1.0 }, { travel: 0.20, freq: 1.95, sag: 0.3, zc: 0.45, zr: 0.95 }],
    accel: 0.80, vp: 10, vmax: 18.4, grip: 1.12, brake: 0.95, leanAcc: 10, spin: 3.6, cda: 0.7, rail: 0.6,
    rider: { seat: [0.46, 0.86], peg: [0.66, 0.40], grip: [1.02, 1.12], scale: 1, torso: 0.22 },
    col: ['#c23b2e', '#ece3c8', '#2a2f3a'], suit: ['#5a4632', '#ece3c8', '#2a2f3a'],
    snd: { type: 'boxer', pitch: 0.8, gears: 4 },
    unlock: { type: 'finishes', n: 60, text: 'Finish 60 runs' }
  },
  {
    id: 'gecko', name: 'Gecko', kind: 'gecko', tag: 'Sticks to walls for a moment', wipe: 'splat',
    blurb: 'Soft, tacky tyres that suck onto whatever they touch. Lands like it is glued down.',
    trick: 'Tacky tyres hold you onto walls, steep faces and loop tops for about a second, then let go until you reach gentle ground.',
    mass: 178, kgyr: 0.45, wb: 1.36, rr: 0.30, rf: 0.31, com: [0.62, 0.72], wheelMass: [10, 9], rake: 26, swing: 9,
    sus: [{ travel: 0.22, freq: 2.1, sag: 0.3, zc: 0.45, zr: 0.95 }, { travel: 0.23, freq: 2.05, sag: 0.3, zc: 0.42, zr: 0.9 }],
    accel: 0.68, vp: 9, vmax: 16.2, grip: 1.18, brake: 0.9, leanAcc: 15.5, spin: 6.0, cda: 0.5, stick: { f: 1.2, t: 1.2 },
    rider: { seat: [0.40, 0.84], peg: [0.50, 0.38], grip: [0.92, 1.08], scale: 1, torso: 0.46 },
    col: ['#3ccf6e', '#f2c230', '#1b1d24'], suit: ['#1b1d24', '#3ccf6e', '#f2c230'],
    snd: { type: 'gecko', pitch: 1.2, gears: 0 },
    unlock: { type: 'challenges', n: 12, text: 'Pull off 12 track challenges' }
  },
  {
    id: 'sandpiper', name: 'Sandpiper', kind: 'paddle', tag: 'Flies on sand, skates on rock', wipe: 'sandstorm',
    blurb: 'A desert racer with a paddle tyre. On loose ground nothing touches it. On rock, tarmac and steel the paddles skate.',
    trick: 'Paddle tyre: big grip and little drag on sand, snow, dust and dirt. It skates on rock, wood, tarmac and steel.',
    mass: 196, kgyr: 0.48, wb: 1.54, rr: 0.36, rf: 0.345, com: [0.68, 0.84], wheelMass: [13, 10], rake: 28, swing: 10,
    sus: [{ travel: 0.30, freq: 1.8, sag: 0.3, zc: 0.44, zr: 0.98 }, { travel: 0.31, freq: 1.75, sag: 0.28, zc: 0.42, zr: 0.95 }],
    accel: 0.78, vp: 10, vmax: 18.0, grip: 1.0, brake: 0.85, leanAcc: 13.5, spin: 5.8, cda: 0.55,
    surf: { sand: [1.6, 0.35], snow: [1.5, 0.4], dust: [1.45, 0.5], dirt: [1.15, 0.8], rock: [0.6, 1], wood: [0.65, 1], steel: [0.6, 1], tarmac: [0.6, 1], kerb: [0.6, 1], rubber: [0.65, 1], boost: [0.7, 1] },
    rider: { seat: [0.44, 0.97], peg: [0.54, 0.43], grip: [1.02, 1.22], scale: 1, torso: 0.36 },
    col: ['#e8b04a', '#3a2a1e', '#2f8fd6'], suit: ['#f2e6c8', '#e8b04a', '#3a2a1e'],
    snd: { type: 'paddle', pitch: 0.9, gears: 5 },
    unlock: { type: 'worldgears', w: 'dust', n: 8, text: 'Find all 8 Dustbowl gears' }
  },
  {
    id: 'whiplash', name: 'Whiplash', kind: 'freestyle', tag: 'Hand brake for air pivots', wipe: 'spinout',
    blurb: 'A freestyle bike with a hand brake on a huge flywheel. In the air it turns where you tell it and stops where you tell it.',
    trick: 'Hold brake in the air: lean as well and it spins nearly twice as fast; lean nothing and it stops turning dead.',
    mass: 166, kgyr: 0.45, wb: 1.46, rr: 0.33, rf: 0.345, com: [0.64, 0.82], wheelMass: [10, 9], rake: 27, swing: 10,
    sus: [{ travel: 0.29, freq: 1.9, sag: 0.3, zc: 0.42, zr: 0.95 }, { travel: 0.30, freq: 1.9, sag: 0.28, zc: 0.40, zr: 0.9 }],
    accel: 0.70, vp: 9.5, vmax: 16.8, grip: 1.02, brake: 0.9, leanAcc: 16, spin: 6.6, cda: 0.5, pivot: { spin: 1.7, tq: 1.8, lock: 22 },
    rider: { seat: [0.42, 0.95], peg: [0.52, 0.43], grip: [1.00, 1.20], scale: 1, torso: 0.36 },
    col: ['#ff3d7f', '#1b1d24', '#ffffff'], suit: ['#1b1d24', '#ff3d7f', '#ffffff'],
    snd: { type: 'freestyle', pitch: 1.05, gears: 5 },
    unlock: { type: 'flipstars', n: 16, text: 'Earn 16 flip stars' }
  },
  {
    id: 'icepick', name: 'Icepick', kind: 'ice', tag: 'Spiked tyres bite into ice', wipe: 'shiver',
    blurb: 'A snow racer on tyres full of steel studs. Ice is like dirt to it. Hard ground is not, quite.',
    trick: 'Studded tyres: full grip on ice, more on snow and oil, a little less on rock, tarmac and steel.',
    mass: 195, kgyr: 0.47, wb: 1.44, rr: 0.33, rf: 0.34, com: [0.66, 0.80], wheelMass: [12, 10], rake: 27, swing: 10,
    sus: [{ travel: 0.26, freq: 1.95, sag: 0.3, zc: 0.44, zr: 0.98 }, { travel: 0.27, freq: 1.9, sag: 0.28, zc: 0.42, zr: 0.95 }],
    accel: 0.70, vp: 9.5, vmax: 17.0, grip: 1.0, brake: 1.0, leanAcc: 14.5, spin: 6.0, cda: 0.55,
    surf: { ice: [4.6, 1], snow: [1.5, 1], oil: [1.6, 1], tarmac: [0.82, 1], steel: [0.75, 1], rock: [0.85, 1], kerb: [0.8, 1], boost: [0.85, 1] },
    rider: { seat: [0.42, 0.92], peg: [0.52, 0.42], grip: [0.98, 1.16], scale: 1, torso: 0.4 },
    col: ['#e9f4ff', '#2c5ea8', '#9fe8ff'], suit: ['#2c5ea8', '#e9f4ff', '#9fe8ff'],
    snd: { type: 'ice', pitch: 1.0, gears: 5 },
    unlock: { type: 'worldgears', w: 'frost', n: 8, text: 'Find all 8 Frostbite gears' }
  },
  {
    id: 'rhino', name: 'Rhino', kind: 'ram', tag: 'Smashes straight through logs', wipe: 'stampede',
    blurb: 'A huge adventure bike with a steel bull bar. Heavy, slow to turn, and a log in its way is firewood.',
    trick: 'Bull bar: logs, rocks and tyres on the track break apart if you hit them faster than a jog.',
    mass: 330, kgyr: 0.54, wb: 1.62, rr: 0.38, rf: 0.40, com: [0.78, 0.80], wheelMass: [17, 14], rake: 28, swing: 9,
    sus: [{ travel: 0.24, freq: 1.8, sag: 0.3, zc: 0.46, zr: 1.0 }, { travel: 0.26, freq: 1.75, sag: 0.3, zc: 0.44, zr: 0.95 }],
    accel: 0.80, vp: 11, vmax: 16.8, grip: 1.08, brake: 0.9, leanAcc: 13.5, spin: 5.4, cda: 0.7, smash: 2.5,
    rider: { seat: [0.46, 1.00], peg: [0.58, 0.48], grip: [1.06, 1.26], scale: 1, torso: 0.34 },
    col: ['#5f6b4e', '#2a2d26', '#e0a43a'], suit: ['#3a3f30', '#e0a43a', '#2a2d26'],
    snd: { type: 'ram', pitch: 0.7, gears: 6 },
    unlock: { type: 'challenges', n: 30, text: 'Pull off 30 track challenges' }
  },
  {
    id: 'albatross', name: 'Albatross', kind: 'glider', tag: 'Wings that hold you up', wipe: 'nosedive',
    blurb: 'A bike with a pair of wings bolted to the frame. Pull the nose up in the air and it floats; push it down and it dives.',
    trick: 'Wings: the faster you go and the higher the nose, the more they lift. No air in Low Orbit, so no lift there.',
    mass: 182, kgyr: 0.50, wb: 1.48, rr: 0.32, rf: 0.33, com: [0.68, 0.78], wheelMass: [10, 9], rake: 27, swing: 9,
    sus: [{ travel: 0.22, freq: 2.0, sag: 0.3, zc: 0.45, zr: 0.98 }, { travel: 0.23, freq: 1.95, sag: 0.3, zc: 0.42, zr: 0.95 }],
    accel: 0.68, vp: 10, vmax: 17.0, grip: 1.0, brake: 0.9, leanAcc: 12, spin: 4.8, airDamp: 1.6, cda: 0.6, glide: { k: 5.5, inc: -0.04, cap: 0.7, drag: 0.08 },
    rider: { seat: [0.42, 0.86], peg: [0.52, 0.40], grip: [0.98, 1.08], scale: 1, torso: 0.5 },
    col: ['#f5f1e6', '#1d4e89', '#f2c230'], suit: ['#1d4e89', '#f5f1e6', '#f2c230'],
    snd: { type: 'glider', pitch: 1.0, gears: 5 },
    unlock: { type: 'gears', n: 36, text: 'Find 36 hidden gears' }
  }
];

RR.BIKE = {};
RR.BIKES.forEach(function (d, i) {
  d.index = i;
  var top = d.rider.seat[1];
  if (!d.body) d.body = body(d.com, Math.min(d.rr, 0.36), d.wb, top);
  if (!d.wipe) d.wipe = 'stars';
  RR.BIKE[d.id] = d;
});

/* 0..1 bars for the garage screen, worked out from the real numbers */
RR.bikeStats = function (d) {
  function n(v, a, b) { return Math.max(0.06, Math.min(1, (v - a) / (b - a))); }
  return {
    Speed: n(d.vmax, 11, 29),
    Launch: n(d.accel + (d.rocket || 0) * 0.8, 0.42, 1.25),
    Grip: n(d.grip, 0.85, 1.4),
    Suspension: n((d.sus[0].travel + d.sus[1].travel) / 2, 0.06, 0.34),
    Agility: n(d.leanAcc * d.spin, 35, 190),
    Weight: n(d.mass, 110, 320)
  };
};

if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
