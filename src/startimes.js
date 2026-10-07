/* Star times: [three-star time, two-star time] per track, in seconds.
   Written by: node tools/bot.js --bikes all --write   (do not edit by hand) */
(function (root) {
var RR = root.RR || (root.RR = {});
RR.STAR_TIMES = [
  [20.2, 25.5],   //  1 First Gear: robot on starter 18.9s, 10 of 12 bikes beat three stars without a single flip
  [22.7, 28.6],   //  2 Washboard: robot on starter 21.2s, 9 of 12 bikes beat three stars without a single flip
  [23.6, 29.8],   //  3 Rolling Dunes: robot on starter 22.1s, 10 of 12 bikes beat three stars without a single flip
  [16.6, 21.0],   //  4 Hop Skip: robot on starter 15.6s, 9 of 12 bikes beat three stars without a single flip
  [18.7, 23.6],   //  5 Loop de Dust: robot on starter 17.5s, 9 of 12 bikes beat three stars without a single flip
  [21.1, 26.6],   //  6 Mesa Drop: robot on starter 19.7s, 9 of 12 bikes beat three stars without a single flip
  [21.5, 27.1],   //  7 Gulch Gap: robot on starter 20.1s, 9 of 12 bikes beat three stars without a single flip
  [32.6, 41.2],   //  8 Canyon Run: robot on starter 30.5s, 9 of 12 bikes beat three stars without a single flip
  [20.8, 26.3],   //  9 Log Jam: robot on starter 20.2s, 9 of 12 bikes beat three stars without a single flip
  [20.3, 25.6],   // 10 Mossy Loop: robot on starter 19.7s, 9 of 12 bikes beat three stars without a single flip
  [18.0, 22.7],   // 11 Timber Table: robot on starter 17.4s, 9 of 12 bikes beat three stars without a single flip
  [20.8, 26.3],   // 12 Sawmill: robot on starter 20.2s, 9 of 12 bikes beat three stars without a single flip
  [25.8, 32.6],   // 13 Root Rage: robot on starter 25.1s, 9 of 12 bikes beat three stars without a single flip
  [19.2, 24.2],   // 14 Creek Hop: robot on starter 18.6s, 9 of 12 bikes beat three stars without a single flip
  [24.9, 31.5],   // 15 Beaver Dam: robot on starter 24.2s, 9 of 12 bikes beat three stars without a single flip
  [34.1, 43.0],   // 16 Old Growth: robot on starter 33.1s, 9 of 12 bikes beat three stars without a single flip
  [19.7, 24.7],   // 17 Black Ice: robot on starter 19.7s, 8 of 12 bikes beat three stars without a single flip
  [22.6, 28.2],   // 18 Whiteout: robot on starter 22.6s, 9 of 12 bikes beat three stars without a single flip
  [24.3, 30.4],   // 19 Powder Keg: robot on starter 24.3s, 8 of 12 bikes beat three stars without a single flip
  [22.4, 28.0],   // 20 Glacier Loop: robot on starter 22.4s, 9 of 12 bikes beat three stars without a single flip
  [19.3, 24.2],   // 21 Slip Road: robot on starter 19.3s, 8 of 12 bikes beat three stars without a single flip
  [20.1, 25.2],   // 22 Avalanche: robot on starter 20.1s, 8 of 12 bikes beat three stars without a single flip
  [20.4, 25.5],   // 23 Crevasse: robot on starter 20.4s, 9 of 12 bikes beat three stars without a single flip
  [30.5, 38.2],   // 24 Aurora: robot on starter 30.5s, 8 of 12 bikes beat three stars without a single flip
  [18.0, 22.6],   // 25 Hot Start: robot on starter 18.5s, 7 of 12 bikes beat three stars without a single flip
  [28.5, 35.9],   // 26 The Chimney: robot on starter 29.4s, 5 of 12 bikes beat three stars without a single flip
  [19.4, 24.4],   // 27 Ember Steps: robot on starter 20.0s, 8 of 12 bikes beat three stars without a single flip
  [24.2, 30.5],   // 28 Caldera: robot on starter 25.0s, 7 of 12 bikes beat three stars without a single flip
  [15.5, 19.5],   // 29 Magma Hop: robot on starter 16.0s, 3 of 12 bikes beat three stars without a single flip
  [19.9, 25.1],   // 30 Fire Walk: robot on starter 20.5s, 8 of 12 bikes beat three stars without a single flip
  [22.0, 27.7],   // 31 Ash Loop: robot on starter 22.7s, 8 of 12 bikes beat three stars without a single flip
  [29.1, 36.6],   // 32 Eruption: robot on starter 30.0s, 8 of 12 bikes beat three stars without a single flip
  [22.0, 27.8],   // 33 One Small Hop: robot on starter 23.2s, 6 of 12 bikes beat three stars without a single flip
  [23.0, 29.1],   // 34 Double Loop: robot on starter 24.2s, 4 of 12 bikes beat three stars without a single flip
  [23.8, 30.0],   // 35 Crater Maker: robot on starter 25.0s, 7 of 12 bikes beat three stars without a single flip
  [26.3, 33.2],   // 36 Slow Float: robot on starter 27.7s, 6 of 12 bikes beat three stars without a single flip
  [30.6, 38.7],   // 37 Dark Side: robot on starter 32.3s, 8 of 12 bikes beat three stars without a single flip
  [26.9, 34.0],   // 38 Regolith: robot on starter 28.4s, 7 of 12 bikes beat three stars without a single flip
  [26.4, 33.4],   // 39 Escape Velocity: robot on starter 27.8s, 6 of 12 bikes beat three stars without a single flip
  [44.1, 55.6]    // 40 Riot Run: robot on starter 46.4s, 7 of 12 bikes beat three stars without a single flip
];
if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
