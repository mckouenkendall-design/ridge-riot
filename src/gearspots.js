/* Where each track's hidden gear sits. Written by: node tools/gearspot.js --write   (do not edit by hand)
   Tracks that place their gear themselves (b.gearAt in tracks.js) are not listed. */
(function (root) {
var RR = root.RR || (root.RR = {});
RR.GEAR_AT = {
  'first-gear': [217.6, -3.6],
  'rolling-dunes': [244.3, -6.2],
  'hop-skip': [153.3, -4.5],
  'loop-de-dust': [180.2, -6.6],
  'washboard': [374.6, -8.2],
  'gulch-gap': [238, -14.7],
  'canyon-run': [395.1, -20]
};
if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
