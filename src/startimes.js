/* Star times: [three-star time, two-star time] per track, in seconds, and the speed the robot rider
   holds through each slow zone. Written by: node tools/skill.js --bikes all --write   (do not edit by hand) */
(function (root) {
var RR = root.RR || (root.RR = {});
RR.STAR_TIMES = [
  [20.2, 25.5],   //  1 First Gear: robot on starter 18.9s, 11 of 15 bikes beat three stars riding the same careful way
  [23.6, 29.8],   //  2 Rolling Dunes: robot on starter 22.1s, 12 of 15 bikes beat three stars riding the same careful way
  [16.6, 21.0],   //  3 Hop Skip: robot on starter 15.5s, 11 of 15 bikes beat three stars riding the same careful way
  [18.7, 23.5],   //  4 Loop de Dust: robot on starter 17.4s, 11 of 15 bikes beat three stars riding the same careful way
  [21.0, 26.6],   //  5 Mesa Drop: robot on starter 19.7s, 11 of 15 bikes beat three stars riding the same careful way
  [28.1, 35.5],   //  6 Washboard: robot on starter 26.3s, 12 of 15 bikes beat three stars riding the same careful way
  [25.8, 32.6],   //  7 Gulch Gap: robot on starter 24.1s, 13 of 15 bikes beat three stars riding the same careful way
  [34.9, 44.0],   //  8 Canyon Run: robot on starter 32.6s, 14 of 15 bikes beat three stars riding the same careful way
  [20.9, 26.4],   //  9 Log Jam: robot on starter 20.3s, 11 of 15 bikes beat three stars riding the same careful way
  [20.1, 25.4],   // 10 Mossy Loop: robot on starter 19.5s, 11 of 15 bikes beat three stars riding the same careful way
  [19.5, 24.6],   // 11 Timber Table: robot on starter 18.9s, 12 of 15 bikes beat three stars riding the same careful way
  [28.5, 36.0],   // 12 Sawmill: robot on starter 27.7s, 11 of 15 bikes beat three stars riding the same careful way
  [35.5, 44.9],   // 13 Root Rage: robot on starter 34.5s, 11 of 15 bikes beat three stars riding the same careful way
  [23.5, 29.7],   // 14 Creek Hop: robot on starter 22.9s, 10 of 15 bikes beat three stars riding the same careful way
  [34.2, 43.1],   // 15 Beaver Dam: robot on starter 33.2s, 13 of 15 bikes beat three stars riding the same careful way
  [39.8, 50.3],   // 16 Old Growth: robot on starter 38.7s, 11 of 15 bikes beat three stars riding the same careful way
  [16.5, 20.7],   // 17 Green Flag: robot on starter 16.2s, 11 of 15 bikes beat three stars riding the same careful way
  [20.6, 25.9],   // 18 Rumble Strip: robot on starter 20.2s, 11 of 15 bikes beat three stars riding the same careful way
  [26.7, 33.5],   // 19 Oil Slick: robot on starter 26.1s, 11 of 15 bikes beat three stars riding the same careful way
  [22.2, 27.9],   // 20 Bus Stop: robot on starter 21.8s, 11 of 15 bikes beat three stars riding the same careful way
  [28.4, 35.6],   // 21 Pit Lane: robot on starter 27.8s, 11 of 15 bikes beat three stars riding the same careful way
  [27.6, 34.6],   // 22 Seven Buses: robot on starter 27.1s, 13 of 15 bikes beat three stars riding the same careful way
  [31.4, 39.4],   // 23 Stunt Show: robot on starter 30.8s, 11 of 15 bikes beat three stars riding the same careful way
  [36.7, 46.1],   // 24 Chequered Flag: robot on starter 36.0s, 13 of 15 bikes beat three stars riding the same careful way
  [19.5, 24.4],   // 25 Black Ice: robot on starter 19.5s, 11 of 15 bikes beat three stars riding the same careful way
  [22.3, 27.9],   // 26 Glacier Loop: robot on starter 22.3s, 11 of 15 bikes beat three stars riding the same careful way
  [24.0, 30.0],   // 27 Slip Road: robot on starter 24.0s, 11 of 15 bikes beat three stars riding the same careful way
  [32.3, 40.4],   // 28 Whiteout: robot on starter 32.3s, 10 of 15 bikes beat three stars riding the same careful way
  [36.2, 45.3],   // 29 Aurora: robot on starter 36.2s, 9 of 15 bikes beat three stars riding the same careful way
  [31.8, 39.8],   // 30 Powder Keg: robot on starter 31.8s, 9 of 15 bikes beat three stars riding the same careful way
  [27.4, 34.3],   // 31 Crevasse: robot on starter 27.4s, 9 of 15 bikes beat three stars riding the same careful way
  [39.1, 48.8],   // 32 Avalanche: robot on starter 39.1s, 10 of 15 bikes beat three stars riding the same careful way
  [18.8, 23.7],   // 33 Hot Start: robot on starter 19.4s, 9 of 15 bikes beat three stars riding the same careful way
  [24.2, 30.4],   // 34 Caldera: robot on starter 24.9s, 9 of 15 bikes beat three stars riding the same careful way
  [19.3, 24.2],   // 35 Magma Hop: robot on starter 19.9s, 8 of 15 bikes beat three stars riding the same careful way
  [28.5, 35.9],   // 36 The Chimney: robot on starter 29.8s, 9 of 15 bikes beat three stars riding the same careful way
  [33.8, 42.5],   // 37 Fire Walk: robot on starter 34.8s, 9 of 15 bikes beat three stars riding the same careful way
  [29.1, 36.6],   // 38 Ash Loop: robot on starter 30.0s, 9 of 15 bikes beat three stars riding the same careful way
  [28.8, 36.3],   // 39 Ember Steps: robot on starter 29.7s, 8 of 15 bikes beat three stars riding the same careful way
  [38.2, 48.1],   // 40 Eruption: robot on starter 39.4s, 8 of 15 bikes beat three stars riding the same careful way
  [21.1, 26.7],   // 41 One Small Hop: robot on starter 22.2s, 7 of 15 bikes beat three stars riding the same careful way
  [22.2, 28.0],   // 42 Double Loop: robot on starter 23.3s, 7 of 15 bikes beat three stars riding the same careful way
  [28.6, 36.1],   // 43 Crater Maker: robot on starter 30.1s, 9 of 15 bikes beat three stars riding the same careful way
  [29.7, 37.6],   // 44 Slow Float: robot on starter 31.3s, 6 of 15 bikes beat three stars riding the same careful way
  [33.8, 42.7],   // 45 Regolith: robot on starter 35.6s, 8 of 15 bikes beat three stars riding the same careful way
  [38.6, 48.8],   // 46 Dark Side: robot on starter 40.6s, 7 of 15 bikes beat three stars riding the same careful way
  [37.1, 46.8],   // 47 Escape Velocity: robot on starter 39.0s, 7 of 15 bikes beat three stars riding the same careful way
  [46.9, 59.3]    // 48 Riot Run: robot on starter 49.4s, 7 of 15 bikes beat three stars riding the same careful way
];
RR.ZONE_V = [[], [], [], [], [], [8.5], [10], [8, 10.5], [], [], [10.5], [8.5, 10], [8, 11], [10, 10], [7, 10], [9, 7, 9.5, 10.5], [], [], [9.5], [10, 10], [8.5, 10], [9, 8.5], [10, 8.5, 10], [9, 8.5, 11, 10, 11], [], [], [8], [10, 8], [8, 10, 8], [9, 10.5], [9.5, 9, 9], [8, 9, 9, 8.5], [], [], [10.5], [9, 8], [9, 9, 9, 8.5], [8, 11], [8.5, 8, 9, 10.5], [7, 9, 9, 10.5], [], [], [8.5], [11, 10.5], [7.5, 8, 11], [8, 8.5, 10], [8.5, 8.5], [9, 7.5, 10, 10.5]];
if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
