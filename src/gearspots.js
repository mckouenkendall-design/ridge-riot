/* Where each track's hidden gear sits. Written by: node tools/gearspot.js --write   (do not edit by hand)
   Tracks that place their gear themselves (b.gearAt in tracks.js) are not listed. */
(function (root) {
var RR = root.RR || (root.RR = {});
RR.GEAR_AT = {
  'first-gear': [217.6, -3.6],
  'rolling-dunes': [169.1, -6.8],
  'loop-de-dust': [180.2, -6.6],
  'washboard': [384.7, -8.2],
  'gulch-gap': [238, -14.7],
  'canyon-run': [395.1, -20],
  'log-jam': [152.1, -3.2],
  'mossy-loop': [268.4, -11.2],
  'root-rage': [316, -5.8],
  'creek-hop': [284.1, -11.5],
  'old-growth': [320.8, -5.5],
  'beaver-dam': [270.4, -11.4],
  'green-flag': [292.3, -4.2],
  'rumble-strip': [115.5, -1.2],
  'bus-stop': [320.9, -8],
  'chequered-flag': [442.8, -11.7],
  'seven-buses': [249.6, -3.3],
  'stunt-show': [116.2, -3.3],
  'black-ice': [170.1, -4.7],
  'whiteout': [313.2, -3.5],
  'aurora': [307.5, -13.3],
  'powder-keg': [284.4, -12.1],
  'avalanche': [336.6, -39.6],
  'glacier-loop': [233, -5.8],
  'hot-start': [210.2, -8.1],
  'fire-walk': [288.5, -17],
  'ash-loop': [276.2, -9.4],
  'eruption': [358.7, -14],
  'the-chimney': [187.6, -3.1],
  'ember-steps': [262.1, -2.7],
  'one-small-hop': [146, -1.4],
  'crater-maker': [263.8, -6.1],
  'dark-side': [196.4, 0.5],
  'riot-run': [439.5, -35.1],
  'double-loop': [136.2, -5.3],
  'escape-velocity': [105.4, -14.1]
};
if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
