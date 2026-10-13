/* The stars on each track: [time target in seconds, flip target]. Three stars: finish, beat the time, land at least
   that many flips in one run. Both targets come from one robot run on the starter bike that finished, flipping where
   it could (see starRun in tools/skill.js), so all three can be had in a single run.
   ZONE_V: the speed the robot rider holds through each slow zone.
   Written by: node tools/skill.js --from <results>   (do not edit by hand) */
(function (root) {
var RR = root.RR || (root.RR = {});
RR.STAR_TIMES = [
  [21.2, 1],   //  1 First Gear: robot 19.6s with 2 flips (flips b up to 1), careful run without flips 19.8s
  [25.1, 2],   //  2 Rolling Dunes: robot 23.2s with 3 flips (flips b up to 1), careful run without flips 23.5s
  [18.6, 2],   //  3 Hop Skip: robot 17.2s with 3 flips (flips f up to 1), careful run without flips 17.5s
  [22.1, 1],   //  4 Loop de Dust: robot 20.5s with 2 flips (flips b up to 1), careful run without flips 20.8s
  [23.2, 1],   //  5 Mesa Drop: robot 21.5s with 1 flip (high road, flips f up to 1), careful run without flips 21.8s
  [36.1, 3],   //  6 Washboard: robot 33.4s with 4 flips (flips f up to 1), careful run without flips 33.6s
  [28.8, 2],   //  7 Gulch Gap: robot 26.6s with 3 flips (flips alt up to 1), careful run without flips 27.6s
  [41.2, 3],   //  8 Canyon Run: robot 38.1s with 4 flips (flips b up to 1), careful run without flips 38.6s
  [21.5, 1],   //  9 Log Jam: robot 20.3s with 0 flips (flips b up to 1), careful run without flips 20.3s
  [20.6, 1],   // 10 Mossy Loop: robot 19.4s with 1 flip (flips f up to 1), careful run without flips 19.5s
  [19.9, 1],   // 11 Timber Table: robot 18.8s with 2 flips (flips alt up to 1), careful run without flips 18.9s
  [29.3, 1],   // 12 Sawmill: robot 27.6s with 1 flip (flips f up to 1), careful run without flips 27.7s
  [36.6, 1],   // 13 Root Rage: robot 34.5s with 0 flips (flips b up to 1), careful run without flips 34.5s
  [24.2, 1],   // 14 Creek Hop: robot 22.9s with 0 flips (flips b up to 1), careful run without flips 22.9s
  [34.8, 1],   // 15 Beaver Dam: robot 32.8s with 2 flips (flips alt up to 1), careful run without flips 33.2s
  [40.8, 2],   // 16 Old Growth: robot 38.5s with 3 flips (flips alt up to 1), careful run without flips 38.7s
  [17.0, 1],   // 17 Green Flag: robot 16.2s with 0 flips (flips b up to 1), careful run without flips 16.2s
  [21.0, 1],   // 18 Rumble Strip: robot 20.0s with 1 flip (flips f up to 1), careful run without flips 20.2s
  [26.4, 1],   // 19 Oil Slick: robot 25.2s with 2 flips (flips f up to 1), careful run without flips 26.1s
  [22.8, 1],   // 20 Bus Stop: robot 21.7s with 1 flip (flips b up to 1), careful run without flips 21.8s
  [29.2, 1],   // 21 Pit Lane: robot 27.8s with 1 flip (flips b up to 1), careful run without flips 27.8s
  [28.2, 1],   // 22 Seven Buses: robot 26.9s with 2 flips (flips b up to 1), careful run without flips 27.1s
  [32.3, 1],   // 23 Stunt Show: robot 30.8s with 1 flip (flips b up to 1), careful run without flips 30.8s
  [37.6, 2],   // 24 Chequered Flag: robot 35.8s with 3 flips (flips alt up to 1), careful run without flips 36.0s
  [20.3, 1],   // 25 Black Ice: robot 19.5s with 0 flips (flips b up to 1), careful run without flips 19.5s
  [23.1, 1],   // 26 Glacier Loop: robot 22.2s with 1 flip (flips f up to 1), careful run without flips 22.3s
  [24.8, 1],   // 27 Slip Road: robot 23.8s with 1 flip (flips b up to 1), careful run without flips 24.0s
  [33.2, 1],   // 28 Whiteout: robot 31.9s with 1 flip (flips f up to 1), careful run without flips 32.3s
  [37.6, 1],   // 29 Aurora: robot 36.1s with 2 flips (flips f up to 1), careful run without flips 36.2s
  [32.9, 1],   // 30 Powder Keg: robot 31.6s with 1 flip (flips b up to 1), careful run without flips 31.8s
  [28.5, 1],   // 31 Crevasse: robot 27.4s with 2 flips (flips f up to 1), careful run without flips 27.4s
  [40.0, 2],   // 32 Avalanche: robot 38.4s with 3 flips (flips alt up to 1), careful run without flips 39.1s
  [19.2, 2],   // 33 Hot Start: robot 18.7s with 3 flips (flips b up to 1), careful run without flips 19.4s
  [25.6, 1],   // 34 Caldera: robot 24.8s with 2 flips (flips f up to 1), careful run without flips 24.9s
  [20.3, 1],   // 35 Magma Hop: robot 19.7s with 2 flips (flips f up to 1), careful run without flips 19.9s
  [30.7, 1],   // 36 The Chimney: robot 29.8s with 0 flips (flips b up to 1), careful run without flips 29.8s
  [35.8, 1],   // 37 Fire Walk: robot 34.8s with 2 flips (flips b up to 1), careful run without flips 34.8s
  [30.8, 1],   // 38 Ash Loop: robot 29.9s with 2 flips (flips alt up to 1), careful run without flips 30.0s
  [30.6, 1],   // 39 Ember Steps: robot 29.7s with 1 flip (flips b up to 1), careful run without flips 29.7s
  [40.4, 3],   // 40 Eruption: robot 39.2s with 4 flips (flips f up to 1), careful run without flips 39.4s
  [22.1, 3],   // 41 One Small Hop: robot 21.7s with 5 flips (flips alt up to 1, safe), careful run without flips 22.2s
  [23.4, 2],   // 42 Double Loop: robot 22.9s with 3 flips (flips f up to 2), careful run without flips 23.3s
  [30.6, 3],   // 43 Crater Maker: robot 30.0s with 5 flips (flips b up to 1), careful run without flips 30.1s
  [31.8, 6],   // 44 Slow Float: robot 31.2s with 9 flips (flips b up to 2), careful run without flips 31.3s
  [36.1, 4],   // 45 Regolith: robot 35.4s with 6 flips (flips alt up to 1), careful run without flips 35.6s
  [40.9, 5],   // 46 Dark Side: robot 40.1s with 7 flips (flips f up to 1), careful run without flips 40.6s
  [36.6, 9],   // 47 Escape Velocity: robot 35.9s with 12 flips (flips alt up to 2), careful run without flips 39.0s
  [50.3, 6]    // 48 Riot Run: robot 49.3s with 9 flips (flips b up to 2), careful run without flips 49.4s
];
RR.ZONE_V = [[], [], [], [], [], [9.5], [11], [8, 10.5], [], [], [10.5], [8.5, 10], [8, 11], [10, 10], [7, 10], [9, 7, 9.5, 10.5], [], [], [9.5], [10, 10], [8.5, 10], [9, 8.5], [10, 8.5, 10], [9, 8.5, 11, 10, 11], [], [], [8], [10, 8], [8, 10, 8], [9, 10.5], [9.5, 9, 9], [8, 9, 9, 8.5], [], [], [10.5], [9, 8], [9, 9, 9, 8.5], [8, 11], [8.5, 8, 9, 10.5], [7, 9, 9, 10.5], [], [], [8.5], [11, 10.5], [7.5, 8, 11], [8, 8.5, 10], [8.5, 8.5], [9, 7.5, 10, 10.5]];
if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
