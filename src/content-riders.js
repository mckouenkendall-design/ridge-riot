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
  // common (batch three, part A)
  { id: 'lumber',   name: 'Lumberjack Lou', tier: 'common', suit: ['#c4392f', '#2f4a6a', '#5a3a22'], head: 'lumber', blurb: 'Felled a forest. Now he is felling lap times.' },
  { id: 'wrench',   name: 'Wrench',        tier: 'common', suit: ['#41618f', '#34507a', '#2a2d35'], head: 'wrench', blurb: 'Fixes the bike mid-air. Billed by the hour.' },
  { id: 'guard',    name: 'Lifeguard Lee', tier: 'common', suit: ['#d93a3a', '#ffd23d', '#f4f6fa'], head: 'guard', blurb: 'Watches every landing very closely. Never gets wet.' },
  { id: 'gnome',    name: 'Gus Gnome',     tier: 'common', suit: ['#2f5fb0', '#4a3a2a', '#5a3a22'], head: 'gnome', blurb: 'Left the garden for the fast lane.' },
  { id: 'scarecrow', name: 'Scarecrow Stu', tier: 'common', suit: ['#a8793a', '#566a8a', '#6a4a2a'], head: 'scarecrow', blurb: 'Scares crows. Also landings, a bit.' },
  { id: 'quackers', name: 'Quackers',      tier: 'common', suit: ['#ffdd33', '#5bb8e8', '#ff8a1f'], head: 'quackers', blurb: 'Floats. Squeaks. Does not wobble.' },
  { id: 'clown',    name: 'Giggles',       tier: 'common', suit: ['#2f7fe0', '#ffd23d', '#d93a3a'], head: 'clown', blurb: 'Always the funniest one at the crash.' },
  { id: 'ace',      name: 'Ace',           tier: 'common', suit: ['#8a5a34', '#5a6a4a', '#3d2616'], head: 'ace', blurb: 'Swears the scarf is not for show.' },
  { id: 'mime',     name: 'Marcel',        tier: 'common', suit: ['#eef0f4', '#1c1d22', '#ffffff'], head: 'mime', blurb: 'Stuck in a box. Rides out of it anyway.' },
  // uncommon (batch three, part A)
  { id: 'wrappy',   name: 'Wrappy',        tier: 'uncommon', suit: ['#d8cba6', '#b8a97f', '#8a7a55'], head: 'wrappy', blurb: 'Three thousand years old and still has the best throttle hand.' },
  { id: 'croak',    name: 'Croak',         tier: 'uncommon', suit: ['#7fc24a', '#4a8a3a', '#f1e6a8'], head: 'croak', blurb: 'Ribbit means gas. It always means gas.' },
  { id: 'inky',     name: 'Inky',          tier: 'uncommon', suit: ['#b04a8a', '#7a2f6a', '#ffb0d0'], head: 'inky', blurb: 'Eight arms, and only two on the bars. Cocky.' },
  { id: 'mo',       name: 'Big Mo',        tier: 'uncommon', suit: ['#e3ad84', '#1f3a7a', '#e3ad84'], head: 'mo', blurb: 'Heavy hitter. Terrifying in a tuck.' },
  { id: 'slice',    name: 'Slice',         tier: 'uncommon', suit: ['#f7b733', '#c4392f', '#6bbf4a'], head: 'slice', blurb: 'Delivered in thirty minutes or the landing is free.' },
  { id: 'yeti',     name: 'Yeti Spaghetti', tier: 'uncommon', suit: ['#e6f0fb', '#b8cfe6', '#4a6a8a'], head: 'yeti', blurb: 'Big foot. Bigger grin. Brain freeze on every downhill.' },
  { id: 'spore',    name: 'Spore',         tier: 'uncommon', suit: ['#e8dcc0', '#8a6a4a', '#c4392f'], head: 'spore', live: true, blurb: 'Grows on you. Also on the bike, a bit.' },
  { id: 'buzz',     name: 'Buzz',          tier: 'uncommon', suit: ['#f4efe0', '#d9cfa8', '#e0a21f'], head: 'buzz', live: true, blurb: 'The bees came with the suit. He has stopped asking.' },
  { id: 'bandit',   name: 'Bandit',        tier: 'uncommon', suit: ['#b98d56', '#6a5236', '#4a3220'], head: 'bandit', blurb: 'Only steals the lead.' },
  // rare
  { id: 'pete',     name: 'Pharaoh Pete',  tier: 'rare', suit: ['#e8b12e', '#f4ecd8', '#1f4fa8'], head: 'pharaoh', blurb: 'Built a pyramid. Now he builds air time.' },
  { id: 'brass',    name: 'Old Brass',     tier: 'rare', suit: ['#6f7f8f', '#4d5a6a', '#b8741f'], head: 'diver', pack: '#b8741f', live: true, blurb: 'Gets the bends from jump height, not depth.' },
  // epic
  { id: 'gale',     name: 'Gale',          tier: 'epic', suit: ['#3a4256', '#2a3045', '#ffe97a'], head: 'storm', live: true, blurb: 'Thunder follows. Eventually.' },
  // legendary
  { id: 'mirage',   name: 'Mirage',        tier: 'legendary', suit: ['#0a2a33', '#0a2a33', '#3dffd2'], head: 'mirage', live: true, neon: true, blurb: 'Half signal, half rider. Never in quite the same place twice.' }
];
})(typeof window !== 'undefined' ? window : globalThis);
