/* The stars on each track: [time target in seconds, flip target]. Three stars: finish, beat the time, land at least
   that many flips in one run. Both targets come from one robot run on the starter bike that finished, flipping where
   it could (see starRun in tools/skill.js), so all three can be had in a single run.
   ZONE_V: the speed the robot rider holds through each slow zone.
   Written by: node tools/skill.js --from <results>   (do not edit by hand) */
(function (root) {
var RR = root.RR || (root.RR = {});
RR.STAR_TIMES = [
  [21.2, 1],   //  1 First Gear: robot 19.6s with 2 flips (flips b up to 1), careful run without flips 19.8s
  [25.0, 2],   //  2 Rolling Dunes: robot 23.1s with 3 flips (flips alt up to 1), careful run without flips 23.5s
  [22.0, 1],   //  3 Hop Skip: robot 20.4s with 2 flips (low road, flips f up to 1), careful run without flips 20.4s
  [22.1, 1],   //  4 Loop de Dust: robot 20.5s with 2 flips (flips b up to 1), careful run without flips 20.8s
  [23.2, 1],   //  5 Mesa Drop: robot 21.5s with 1 flip (high road, flips f up to 1), careful run without flips 21.8s
  [37.5, 3],   //  6 Washboard: robot 34.7s with 4 flips (flips f up to 1), careful run without flips 35.5s
  [28.8, 2],   //  7 Gulch Gap: robot 26.6s with 3 flips (flips alt up to 1), careful run without flips 27.6s
  [41.2, 3],   //  8 Canyon Run: robot 38.1s with 4 flips (flips b up to 1), careful run without flips 38.6s
  [26.0, 1],   //  9 Log Jam: robot 24.5s with 1 flip (flips f up to 1), careful run without flips 24.5s
  [27.8, 2],   // 10 Mossy Loop: robot 26.2s with 3 flips (flips alt up to 1), careful run without flips 27.1s
  [29.6, 2],   // 11 Timber Table: robot 27.9s with 3 flips (low road, flips b up to 1), careful run without flips 28.0s
  [35.2, 1],   // 12 Sawmill: robot 33.2s with 1 flip (low road, flips b up to 1), careful run without flips 33.2s
  [44.3, 1],   // 13 Root Rage: robot 41.8s with 2 flips (flips f up to 1), careful run without flips 41.9s
  [28.3, 1],   // 14 Creek Hop: robot 26.7s with 2 flips (flips f up to 1), careful run without flips 26.8s
  [45.7, 3],   // 15 Beaver Dam: robot 43.1s with 4 flips (flips alt up to 1), careful run without flips 43.8s
  [50.1, 4],   // 16 Old Growth: robot 47.3s with 6 flips (flips alt up to 1), careful run without flips 47.5s
  [27.2, 2],   // 17 Green Flag: robot 25.9s with 3 flips (flips alt up to 1), careful run without flips 26.4s
  [28.4, 2],   // 18 Rumble Strip: robot 27.1s with 3 flips (flips f up to 1), careful run without flips 27.8s
  [34.8, 1],   // 19 Oil Slick: robot 33.1s with 1 flip (low road, flips b up to 1), careful run without flips 33.2s
  [33.6, 2],   // 20 Bus Stop: robot 32.0s with 3 flips (flips f up to 1), careful run without flips 32.2s
  [35.8, 1],   // 21 Pit Lane: robot 34.1s with 2 flips (high road, flips b up to 1), careful run without flips 34.4s
  [38.8, 3],   // 22 Seven Buses: robot 36.9s with 4 flips (flips alt up to 1), careful run without flips 37.2s
  [40.9, 2],   // 23 Stunt Show: robot 38.9s with 3 flips (flips alt up to 1), careful run without flips 39.3s
  [48.3, 3],   // 24 Chequered Flag: robot 46.0s with 5 flips (flips f up to 1), careful run without flips 46.6s
  [27.8, 2],   // 25 Black Ice: robot 26.7s with 3 flips (flips alt up to 1), careful run without flips 26.8s
  [32.8, 2],   // 26 Glacier Loop: robot 31.6s with 3 flips (flips f up to 1), careful run without flips 32.1s
  [32.7, 1],   // 27 Slip Road: robot 31.4s with 2 flips (low road, flips b up to 1), careful run without flips 31.7s
  [44.3, 1],   // 28 Whiteout: robot 42.6s with 2 flips (flips f up to 1), careful run without flips 43.1s
  [46.1, 2],   // 29 Aurora: robot 44.3s with 3 flips (flips f up to 1), careful run without flips 44.3s
  [43.3, 2],   // 30 Powder Keg: robot 41.6s with 3 flips (flips f up to 1), careful run without flips 42.0s
  [36.0, 3],   // 31 Crevasse: robot 34.6s with 4 flips (low road, flips f up to 1), careful run without flips 34.8s
  [49.4, 3],   // 32 Avalanche: robot 47.5s with 5 flips (flips alt up to 1), careful run without flips 48.1s
  [29.5, 4],   // 33 Hot Start: robot 28.7s with 6 flips (flips b up to 1), careful run without flips 30.1s
  [38.0, 4],   // 34 Caldera: robot 36.9s with 6 flips (high road, flips f up to 1), careful run without flips 38.9s
  [36.0, 3],   // 35 Magma Hop: robot 35.0s with 5 flips (low road, flips f up to 1), careful run without flips 35.5s
  [38.7, 1],   // 36 The Chimney: robot 37.6s with 2 flips (flips alt up to 1), careful run without flips 37.9s
  [50.7, 3],   // 37 Fire Walk: robot 49.2s with 5 flips (flips f up to 1), careful run without flips 48.4s
  [45.3, 4],   // 38 Ash Loop: robot 43.9s with 6 flips (flips f up to 1), careful run without flips 44.2s
  [45.2, 3],   // 39 Ember Steps: robot 43.8s with 5 flips (flips f up to 1), careful run without flips 43.9s
  [55.6, 3],   // 40 Eruption: robot 54.0s with 5 flips (flips f up to 1), careful run without flips 54.4s
  [22.1, 3],   // 41 One Small Hop: robot 21.7s with 5 flips (flips alt up to 1, safe), careful run without flips 22.2s
  [23.4, 2],   // 42 Double Loop: robot 22.9s with 3 flips (flips f up to 2), careful run without flips 23.3s
  [37.7, 6],   // 43 Crater Maker: robot 37.0s with 8 flips (flips f up to 2), careful run without flips 36.5s
  [35.5, 8],   // 44 Slow Float: robot 34.8s with 11 flips (high road, flips b up to 2), careful run without flips 34.5s
  [46.5, 7],   // 45 Regolith: robot 45.6s with 10 flips (low road, flips alt up to 1), careful run without flips 45.9s
  [40.9, 5],   // 46 Dark Side: robot 40.1s with 7 flips (flips f up to 1), careful run without flips 40.6s
  [36.6, 9],   // 47 Escape Velocity: robot 35.9s with 12 flips (flips alt up to 2), careful run without flips 39.0s
  [56.6, 8]    // 48 Riot Run: robot 55.5s with 11 flips (flips b up to 2), careful run without flips 55.5s
];
RR.ZONE_V = [[], [], [], [], [], [8.5], [11], [8, 10.5], [], [], [10.5], [8.5, 10], [8, 10.5], [10, 10], [7, 10], [9, 7, 10, 10], [], [], [9.5], [10, 10], [8.5, 10], [9, 8.5], [10, 8.5, 10], [9, 8.5, 11, 10, 11], [], [], [8.5], [10, 7.5], [8, 10, 8.5], [9, 10.5], [9.5, 9, 10], [8, 9, 9.5, 8], [], [], [10.5], [9, 8], [9, 9.5, 9, 7.5], [7.5, 10.5], [8.5, 7.5, 9, 10.5], [7, 8.5, 9, 9.5], [], [], [8.5], [11, 10.5], [7.5, 8, 11], [8, 8.5, 10], [8.5, 8.5], [9, 7.5, 10, 10.5]];
if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
