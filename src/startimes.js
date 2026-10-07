/* Star times: [three-star time, two-star time] per track, in seconds.
   Written by: node tools/bot.js --bikes all --write   (do not edit by hand) */
(function (root) {
var RR = root.RR || (root.RR = {});
RR.STAR_TIMES = [
  [20.2, 25.5],   //  1 First Gear: robot on starter 18.9s, 10 of 12 bikes beat three stars without a single flip
  [22.7, 28.7],   //  2 Washboard: robot on starter 21.2s, 9 of 12 bikes beat three stars without a single flip
  [23.6, 29.8],   //  3 Rolling Dunes: robot on starter 22.1s, 10 of 12 bikes beat three stars without a single flip
  [16.6, 21.0],   //  4 Hop Skip: robot on starter 15.6s, 9 of 12 bikes beat three stars without a single flip
  [18.7, 23.5],   //  5 Loop de Dust: robot on starter 17.4s, 9 of 12 bikes beat three stars without a single flip
  [21.1, 26.6],   //  6 Mesa Drop: robot on starter 19.7s, 9 of 12 bikes beat three stars without a single flip
  [21.5, 27.1],   //  7 Gulch Gap: robot on starter 20.1s, 9 of 12 bikes beat three stars without a single flip
  [32.6, 41.1],   //  8 Canyon Run: robot on starter 30.5s, 9 of 12 bikes beat three stars without a single flip
  [20.6, 26.0],   //  9 Log Jam: robot on starter 20.0s, 9 of 12 bikes beat three stars without a single flip
  [20.1, 25.4],   // 10 Mossy Loop: robot on starter 19.6s, 9 of 12 bikes beat three stars without a single flip
  [18.0, 22.7],   // 11 Timber Table: robot on starter 17.4s, 8 of 12 bikes beat three stars without a single flip
  [21.2, 26.8],   // 12 Sawmill: robot on starter 20.6s, 9 of 12 bikes beat three stars without a single flip
  [25.9, 32.7],   // 13 Root Rage: robot on starter 25.1s, 9 of 12 bikes beat three stars without a single flip
  [19.2, 24.3],   // 14 Creek Hop: robot on starter 18.7s, 8 of 12 bikes beat three stars without a single flip
  [25.1, 31.7],   // 15 Beaver Dam: robot on starter 24.4s, 9 of 12 bikes beat three stars without a single flip
  [34.1, 43.1],   // 16 Old Growth: robot on starter 33.1s, 9 of 12 bikes beat three stars without a single flip
  [19.7, 24.7],   // 17 Black Ice: robot on starter 19.7s, 8 of 12 bikes beat three stars without a single flip
  [22.5, 28.2],   // 18 Whiteout: robot on starter 22.5s, 8 of 12 bikes beat three stars without a single flip
  [22.3, 27.9],   // 19 Glacier Loop: robot on starter 22.3s, 7 of 12 bikes beat three stars without a single flip
  [19.3, 24.2],   // 20 Slip Road: robot on starter 19.3s, 8 of 12 bikes beat three stars without a single flip
  [24.4, 30.5],   // 21 Powder Keg: robot on starter 24.4s, 8 of 12 bikes beat three stars without a single flip
  [20.1, 25.2],   // 22 Avalanche: robot on starter 20.1s, 8 of 12 bikes beat three stars without a single flip
  [20.5, 25.7],   // 23 Crevasse: robot on starter 20.5s, 8 of 12 bikes beat three stars without a single flip
  [30.5, 38.1],   // 24 Aurora: robot on starter 30.5s, 8 of 12 bikes beat three stars without a single flip
  [18.8, 23.6],   // 25 Hot Start: robot on starter 19.4s, 8 of 12 bikes beat three stars without a single flip
  [28.6, 36.0],   // 26 The Chimney: robot on starter 29.5s, 5 of 12 bikes beat three stars without a single flip
  [21.9, 27.5],   // 27 Ash Loop: robot on starter 22.6s, 8 of 12 bikes beat three stars without a single flip
  [24.2, 30.5],   // 28 Caldera: robot on starter 25.0s, 8 of 12 bikes beat three stars without a single flip
  [15.5, 19.5],   // 29 Magma Hop: robot on starter 16.0s, 3 of 12 bikes beat three stars without a single flip
  [20.0, 25.1],   // 30 Fire Walk: robot on starter 20.6s, 6 of 12 bikes beat three stars without a single flip
  [21.1, 26.5],   // 31 Ember Steps: robot on starter 21.7s, 8 of 12 bikes beat three stars without a single flip
  [28.9, 36.4],   // 32 Eruption: robot on starter 29.8s, 8 of 12 bikes beat three stars without a single flip
  [21.2, 26.7],   // 33 One Small Hop: robot on starter 22.3s, 6 of 12 bikes beat three stars without a single flip
  [22.2, 28.1],   // 34 Double Loop: robot on starter 23.4s, 5 of 12 bikes beat three stars without a single flip
  [23.2, 29.3],   // 35 Crater Maker: robot on starter 24.4s, 7 of 12 bikes beat three stars without a single flip
  [26.5, 33.5],   // 36 Slow Float: robot on starter 27.9s, 6 of 12 bikes beat three stars without a single flip
  [29.5, 37.2],   // 37 Dark Side: robot on starter 31.0s, 7 of 12 bikes beat three stars without a single flip
  [26.2, 33.1],   // 38 Escape Velocity: robot on starter 27.6s, 7 of 12 bikes beat three stars without a single flip
  [27.0, 34.2],   // 39 Regolith: robot on starter 28.5s, 6 of 12 bikes beat three stars without a single flip
  [44.1, 55.7]    // 40 Riot Run: robot on starter 46.4s, 7 of 12 bikes beat three stars without a single flip
];
if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
