/* Ridge Riot: riders added after the first collection (the first collection lives in collect.js).
   Each entry follows the same shape as the first ones. How a head is drawn is in art-heads.js and art-heads2.js.
   The theme set a rider belongs to is not written here: see SETS in collect.js. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
RR.MORE_RIDERS = [
  // common
  { id: 'crumb',    name: 'Chef Crumb',    tier: 'common', suit: ['#f7f8fb', '#4a5060', '#16181e'], head: 'chef', blurb: 'Serves every landing medium rare.' },
  { id: 'pylon',    name: 'Pylon',         tier: 'common', suit: ['#c9f31d', '#3a3f4b', '#ff7a1f'], head: 'cone', blurb: 'Fell off a truck. Got back on a bike.' },
  { id: 'flurry',   name: 'Flurry',        tier: 'common', suit: ['#f1f6fb', '#cfdceb', '#2a2d35'], head: 'flurry', blurb: 'Melts a little every race. Has never mentioned it.' },
  // uncommon
  { id: 'ronin',    name: 'Ronin',         tier: 'uncommon', suit: ['#8a1f2a', '#2a2d35', '#e8b12e'], head: 'ronin', blurb: 'Ten years without a master. Zero seconds without gas.' },
  { id: 'chomp',    name: 'Chomp',         tier: 'uncommon', suit: ['#6f8fa8', '#557894', '#e6eef5'], head: 'chomp', blurb: 'Has to keep moving or he gets cranky.' },
  { id: 'prickles', name: 'Prickles',      tier: 'uncommon', suit: ['#58b45e', '#3a8a45', '#ff7aa8'], head: 'prickles', blurb: 'Please do not hug.' },
  // rare
  { id: 'pete',     name: 'Pharaoh Pete',  tier: 'rare', suit: ['#e8b12e', '#f4ecd8', '#1f4fa8'], head: 'pharaoh', blurb: 'Built a pyramid. Now he builds air time.' },
  { id: 'brass',    name: 'Old Brass',     tier: 'rare', suit: ['#6f7f8f', '#4d5a6a', '#b8741f'], head: 'diver', pack: '#b8741f', live: true, blurb: 'Gets the bends from jump height, not depth.' },
  // epic
  { id: 'gale',     name: 'Gale',          tier: 'epic', suit: ['#3a4256', '#2a3045', '#ffe97a'], head: 'storm', live: true, blurb: 'Thunder follows. Eventually.' },
  // legendary
  { id: 'mirage',   name: 'Mirage',        tier: 'legendary', suit: ['#0a2a33', '#0a2a33', '#3dffd2'], head: 'mirage', live: true, neon: true, blurb: 'Half signal, half rider. Never in quite the same place twice.' }
];
})(typeof window !== 'undefined' ? window : globalThis);
