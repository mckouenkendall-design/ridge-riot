/* Star times: [three-star time, two-star time] per track, in seconds.
   Written by: node tools/bot.js --bikes all --write   (do not edit by hand) */
(function (root) {
var RR = root.RR || (root.RR = {});
RR.STAR_TIMES = [
  [20.2, 25.5],   //  1 First Gear: robot on starter 18.9s, 11 of 15 bikes beat three stars without a single flip
  [23.6, 29.8],   //  2 Rolling Dunes: robot on starter 22.1s, 11 of 15 bikes beat three stars without a single flip
  [16.6, 21.0],   //  3 Hop Skip: robot on starter 15.5s, 11 of 15 bikes beat three stars without a single flip
  [18.7, 23.5],   //  4 Loop de Dust: robot on starter 17.4s, 11 of 15 bikes beat three stars without a single flip
  [21.0, 26.6],   //  5 Mesa Drop: robot on starter 19.7s, 11 of 15 bikes beat three stars without a single flip
  [22.8, 28.8],   //  6 Washboard: robot on starter 21.3s, 11 of 15 bikes beat three stars without a single flip
  [21.5, 27.1],   //  7 Gulch Gap: robot on starter 20.1s, 11 of 15 bikes beat three stars without a single flip
  [32.5, 41.1],   //  8 Canyon Run: robot on starter 30.4s, 11 of 15 bikes beat three stars without a single flip
  [20.9, 26.4],   //  9 Log Jam: robot on starter 20.3s, 11 of 15 bikes beat three stars without a single flip
  [20.1, 25.4],   // 10 Mossy Loop: robot on starter 19.5s, 11 of 15 bikes beat three stars without a single flip
  [17.9, 22.6],   // 11 Timber Table: robot on starter 17.4s, 11 of 15 bikes beat three stars without a single flip
  [21.4, 27.1],   // 12 Sawmill: robot on starter 20.8s, 11 of 15 bikes beat three stars without a single flip
  [26.6, 33.6],   // 13 Root Rage: robot on starter 25.9s, 11 of 15 bikes beat three stars without a single flip
  [18.9, 23.8],   // 14 Creek Hop: robot on starter 18.3s, 10 of 15 bikes beat three stars without a single flip
  [24.9, 31.4],   // 15 Beaver Dam: robot on starter 24.1s, 11 of 15 bikes beat three stars without a single flip
  [34.2, 43.2],   // 16 Old Growth: robot on starter 33.2s, 11 of 15 bikes beat three stars without a single flip
  [16.5, 20.7],   // 17 Green Flag: robot on starter 16.2s, 11 of 15 bikes beat three stars without a single flip
  [20.6, 25.9],   // 18 Rumble Strip: robot on starter 20.2s, 11 of 15 bikes beat three stars without a single flip
  [21.4, 26.9],   // 19 Oil Slick: robot on starter 21.0s, 11 of 15 bikes beat three stars without a single flip
  [16.4, 20.5],   // 20 Bus Stop: robot on starter 16.1s, 11 of 15 bikes beat three stars without a single flip
  [21.3, 26.7],   // 21 Pit Lane: robot on starter 20.9s, 11 of 15 bikes beat three stars without a single flip
  [20.7, 25.9],   // 22 Seven Buses: robot on starter 20.3s, 11 of 15 bikes beat three stars without a single flip
  [19.6, 24.6],   // 23 Stunt Show: robot on starter 19.2s, 11 of 15 bikes beat three stars without a single flip
  [28.9, 36.2],   // 24 Chequered Flag: robot on starter 28.3s, 11 of 15 bikes beat three stars without a single flip
  [19.5, 24.4],   // 25 Black Ice: robot on starter 19.5s, 11 of 15 bikes beat three stars without a single flip
  [22.3, 27.9],   // 26 Glacier Loop: robot on starter 22.3s, 9 of 15 bikes beat three stars without a single flip
  [19.3, 24.2],   // 27 Slip Road: robot on starter 19.3s, 9 of 15 bikes beat three stars without a single flip
  [22.5, 28.1],   // 28 Whiteout: robot on starter 22.5s, 11 of 15 bikes beat three stars without a single flip
  [24.2, 30.3],   // 29 Powder Keg: robot on starter 24.2s, 9 of 15 bikes beat three stars without a single flip
  [30.6, 38.3],   // 30 Aurora: robot on starter 30.6s, 10 of 15 bikes beat three stars without a single flip
  [20.4, 25.5],   // 31 Crevasse: robot on starter 20.4s, 10 of 15 bikes beat three stars without a single flip
  [20.2, 25.3],   // 32 Avalanche: robot on starter 20.2s, 10 of 15 bikes beat three stars without a single flip
  [18.8, 23.7],   // 33 Hot Start: robot on starter 19.4s, 9 of 15 bikes beat three stars without a single flip
  [28.5, 35.9],   // 34 The Chimney: robot on starter 29.4s, 6 of 15 bikes beat three stars without a single flip
  [24.2, 30.4],   // 35 Caldera: robot on starter 24.9s, 9 of 15 bikes beat three stars without a single flip
  [21.9, 27.5],   // 36 Ash Loop: robot on starter 22.5s, 9 of 15 bikes beat three stars without a single flip
  [15.4, 19.4],   // 37 Magma Hop: robot on starter 15.9s, 5 of 15 bikes beat three stars without a single flip
  [21.1, 26.5],   // 38 Ember Steps: robot on starter 21.7s, 8 of 15 bikes beat three stars without a single flip
  [20.1, 25.3],   // 39 Fire Walk: robot on starter 20.7s, 8 of 15 bikes beat three stars without a single flip
  [28.9, 36.3],   // 40 Eruption: robot on starter 29.8s, 9 of 15 bikes beat three stars without a single flip
  [21.1, 26.7],   // 41 One Small Hop: robot on starter 22.3s, 7 of 15 bikes beat three stars without a single flip
  [22.2, 28.0],   // 42 Double Loop: robot on starter 23.3s, 6 of 15 bikes beat three stars without a single flip
  [23.2, 29.2],   // 43 Crater Maker: robot on starter 24.4s, 8 of 15 bikes beat three stars without a single flip
  [26.4, 33.4],   // 44 Slow Float: robot on starter 27.8s, 7 of 15 bikes beat three stars without a single flip
  [25.9, 32.8],   // 45 Regolith: robot on starter 27.3s, 6 of 15 bikes beat three stars without a single flip
  [26.4, 33.4],   // 46 Escape Velocity: robot on starter 27.8s, 7 of 15 bikes beat three stars without a single flip
  [29.0, 36.6],   // 47 Dark Side: robot on starter 30.5s, 6 of 15 bikes beat three stars without a single flip
  [44.9, 56.7]    // 48 Riot Run: robot on starter 47.3s, 7 of 15 bikes beat three stars without a single flip
];
if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
