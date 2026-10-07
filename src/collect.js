/* Ridge Riot: the collection. Paint jobs and riders, their rarity, and the
   rules for what a geode gives you. Nothing here can be bought: nuggets are
   earned by riding and geodes are cracked with nuggets.
   Rarity runs ruby, emerald, gold, diamond, opal (opal is the top). */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});

/* odds are out of 100 for an ordinary geode */
RR.TIERS = [
  { id: 'ruby',    name: 'Ruby',    odds: 43, col: '#e0314b', hi: '#ff9aa9', lo: '#7d1026' },
  { id: 'emerald', name: 'Emerald', odds: 27, col: '#19b56b', hi: '#9af3c1', lo: '#0b5f3a' },
  { id: 'gold',    name: 'Gold',    odds: 18, col: '#f2b632', hi: '#fff3b0', lo: '#9a6a10' },
  { id: 'diamond', name: 'Diamond', odds: 9,  col: '#8fdcff', hi: '#ffffff', lo: '#3a86c8' },
  { id: 'opal',    name: 'Opal',    odds: 3,  col: '#f3f0ff', hi: '#ffffff', lo: '#8a7fd6' }
];
RR.TIER = {};
RR.TIERS.forEach(function (t, i) { t.rank = i; RR.TIER[t.id] = t; });

/* Paint jobs go on any bike you own.
   c: the three plain colours (main, second, accent) used wherever a pattern cannot go.
   pat: how the main bodywork is filled (see art-skins.js). rim: wheel rim colour.
   glow: glowing ring in the wheels. trail: ribbon of light behind the bike at speed. */
RR.PAINTS = [
  // ruby: straight colourways and simple patterns
  { id: 'hornet',   name: 'Hornet',        tier: 'ruby', c: ['#f5c518', '#16181e', '#f5c518'], pat: { t: 'stripes', a: '#f5c518', b: '#16181e', w: 0.2, ang: -0.9 }, rim: '#f5c518' },
  { id: 'gum',      name: 'Bubblegum',     tier: 'ruby', c: ['#ff7ac0', '#25d0c4', '#ffffff'], pat: { t: 'dots', a: '#ff7ac0', b: '#ffd0ea', w: 0.16 }, rim: '#25d0c4' },
  { id: 'surplus',  name: 'Army Surplus',  tier: 'ruby', c: ['#6b7a45', '#2d3320', '#c9b98a'], pat: { t: 'camo', a: '#6b7a45', b: '#3f4a2a', c: '#b8a878', w: 0.5 }, rim: '#2d3320' },
  { id: 'cream',    name: 'Creamsicle',    tier: 'ruby', c: ['#ff8a24', '#fff4dc', '#ff8a24'], pat: { t: 'split', a: '#ff8a24', b: '#fff4dc', y: 0.82 }, rim: '#fff4dc' },
  { id: 'midnight', name: 'Midnight',      tier: 'ruby', c: ['#1c2a5e', '#c8d2e8', '#5fd0ff'], pat: { t: 'fade', stops: ['#0e1533', '#27408f'], dir: 'v' }, rim: '#5fd0ff' },
  { id: 'lime',     name: 'Lime Twist',    tier: 'ruby', c: ['#a8e62e', '#15171d', '#ffffff'], pat: { t: 'stripes', a: '#a8e62e', b: '#7fc318', w: 0.12, ang: 0.5 }, rim: '#a8e62e' },
  { id: 'checkers', name: 'Checkers',      tier: 'ruby', c: ['#f4f1e8', '#16181e', '#e2402f'], pat: { t: 'checker', a: '#f4f1e8', b: '#16181e', w: 0.14 }, rim: '#e2402f' },
  { id: 'rust',     name: 'Rust Bucket',   tier: 'ruby', c: ['#a8532a', '#5e6b6e', '#d9a066'], pat: { t: 'rust', a: '#8e3f1e', b: '#c2703a', c: '#5e6b6e', w: 0.6 }, rim: '#8a8f94' },
  // emerald: loud patterns
  { id: 'hotrod',   name: 'Hot Rod',       tier: 'emerald', c: ['#16181e', '#ff7a1f', '#ffd24a'], pat: { t: 'flames', a: '#16181e', b: '#ff5a1f', c: '#ffd24a', w: 0.7 }, rim: '#ff7a1f' },
  { id: 'tiger',    name: 'Tiger',         tier: 'emerald', c: ['#ff9a1f', '#16181e', '#fff4dc'], pat: { t: 'tiger', a: '#ff9a1f', b: '#16181e', w: 0.5 }, rim: '#16181e' },
  { id: 'carbon',   name: 'Carbon',        tier: 'emerald', c: ['#2a2d35', '#e2402f', '#9aa0aa'], pat: { t: 'carbon', a: '#2f333c', b: '#1b1d23', w: 0.09 }, rim: '#e2402f' },
  { id: 'splat',    name: 'Paint Fight',   tier: 'emerald', c: ['#f4f1e8', '#2f6fd6', '#ff4a8a'], pat: { t: 'splat', a: '#f4f1e8', cols: ['#ff4a8a', '#2fd6c4', '#ffd24a', '#7a4fe0'], w: 0.7 }, rim: '#ff4a8a' },
  { id: 'moo',      name: 'Moo',           tier: 'emerald', c: ['#f6f3ea', '#16181e', '#ff9ab8'], pat: { t: 'cow', a: '#f6f3ea', b: '#16181e', w: 0.7 }, rim: '#ff9ab8' },
  { id: 'sunset',   name: 'Last Light',    tier: 'emerald', c: ['#ff6a3d', '#5a2a8a', '#ffd24a'], pat: { t: 'fade', stops: ['#5a2a8a', '#e0407a', '#ff8a3d', '#ffd24a'], dir: 'v' }, rim: '#ffd24a' },
  // gold: metal finishes with a highlight that slides across
  { id: 'chrome',   name: 'Chrome',        tier: 'gold', c: ['#cfd6de', '#5a6470', '#ffffff'], pat: { t: 'metal', stops: ['#69727e', '#eef2f6', '#8b95a1', '#f8fafc', '#5d6672'] }, rim: '#eef2f6' },
  { id: 'goldleaf', name: 'Gold Leaf',     tier: 'gold', c: ['#e8b12e', '#7a5210', '#fff3b0'], pat: { t: 'metal', stops: ['#9a6a10', '#ffe27a', '#c9901c', '#fff6c2', '#8a5c0c'] }, rim: '#ffe27a', trail: { cols: ['#fff3b0', '#f2b632'], w: 0.1, spark: '#fff3b0' } },
  { id: 'rosegold', name: 'Rose Gold',     tier: 'gold', c: ['#e8a090', '#8a4a44', '#ffe6dc'], pat: { t: 'metal', stops: ['#a85f58', '#ffd2c4', '#d98a7c', '#fff0ea', '#96524c'] }, rim: '#ffd2c4' },
  { id: 'gunmetal', name: 'Gunmetal',      tier: 'gold', c: ['#4a505c', '#1c1f26', '#ff5a3d'], pat: { t: 'metal', stops: ['#262a32', '#7c8594', '#3c424d', '#99a3b3', '#22262d'] }, rim: '#ff5a3d' },
  { id: 'candy',    name: 'Candy Apple',   tier: 'gold', c: ['#c4122e', '#4a0612', '#ffd2d8'], pat: { t: 'metal', stops: ['#5e0716', '#ff3d5c', '#a80f28', '#ff8ea0', '#560613'] }, rim: '#ffd2d8' },
  // diamond: cut-gem finishes that glint, with glowing wheels and a ribbon behind
  { id: 'ice',      name: 'Ice Diamond',   tier: 'diamond', c: ['#cfefff', '#5aa8e0', '#ffffff'], pat: { t: 'gem', cols: ['#eaf8ff', '#b4e4ff', '#8fd0f8', '#d8f2ff', '#6fb8ea'], w: 0.42 }, rim: '#ffffff', glow: '#9fe8ff', glint: '#ffffff', trail: { cols: ['#ffffff', '#8fdcff'], w: 0.16, spark: '#ffffff' } , wide: true },
  { id: 'amethyst', name: 'Amethyst',      tier: 'diamond', c: ['#a06cff', '#3d1a7a', '#f0dcff'], pat: { t: 'gem', cols: ['#c9a3ff', '#8a4fe0', '#6a30c8', '#b488ff', '#4f1fa0'], w: 0.42 }, rim: '#f0dcff', glow: '#c9a3ff', glint: '#ffffff', trail: { cols: ['#f0dcff', '#a06cff'], w: 0.16, spark: '#f0dcff' } , wide: true },
  { id: 'blackdia', name: 'Black Diamond', tier: 'diamond', c: ['#23262f', '#0d0e12', '#ffffff'], pat: { t: 'gem', cols: ['#3a3f4c', '#1c1e26', '#0f1014', '#2c303a', '#50566a'], w: 0.42 }, rim: '#ffffff', glow: '#ffffff', glint: '#ffffff', trail: { cols: ['#ffffff', '#6a7088'], w: 0.14, spark: '#ffffff' } , wide: true },
  // opal: the colour moves
  { id: 'whiteopal', name: 'White Opal',   tier: 'opal', c: ['#f6f4ff', '#c8c0f0', '#ffffff'], pat: { t: 'opal', base: '#fbfaff', fire: ['#9fe8ff', '#ffb8ea', '#fff3a8', '#aaffcf', '#c9b0ff', '#ffc9a8'] }, rim: '#ffffff', glow: 'prism', glint: '#ffffff', trail: { cols: 'prism', w: 0.24, spark: '#ffffff' }, live: true, wide: true, suit: 'prism' },
  { id: 'blackopal', name: 'Black Opal',   tier: 'opal', c: ['#12141d', '#05060a', '#3dffd2'], pat: { t: 'opal', base: '#0c0e16', fire: ['#00e5ff', '#3dff8a', '#ff3dd0', '#3d6bff', '#ffe23d', '#8a3dff'], dark: true }, rim: '#3dffd2', glow: 'prism', glint: '#9ffff0', trail: { cols: 'prism', w: 0.24, spark: '#9ffff0' }, live: true, wide: true, suit: 'prism' }
];

/* Riders can sit on any bike. suit: jacket, trousers, boots and gloves.
   head: which head is drawn (art-skins.js). */
RR.RIDERS = [
  // ruby
  { id: 'dummy',   name: 'Test Dummy',    tier: 'ruby', suit: ['#f2c230', '#f2c230', '#16181e'], head: 'dummy', blurb: 'Has done this before. Remembers none of it.' },
  { id: 'dusty',   name: 'Dusty',         tier: 'ruby', suit: ['#b5723a', '#3d5a8a', '#5a3a22'], head: 'cowboy', blurb: 'Rode in from the Dustbowl and never took the hat off.' },
  { id: 'peel',    name: 'Peel',          tier: 'ruby', suit: ['#ffd93d', '#ffd93d', '#8a5a1e'], head: 'banana', blurb: 'A banana. On a motorbike. No further questions.' },
  { id: 'cluck',   name: 'Captain Cluck', tier: 'ruby', suit: ['#fff4dc', '#fff4dc', '#ff9a1f'], head: 'chicken', blurb: 'Not afraid of anything. Certainly not jumps.' },
  { id: 'zed',     name: 'Zed',           tier: 'ruby', suit: ['#5a4a6a', '#3a3340', '#2a2530'], head: 'zombie', blurb: 'Crashed once and simply kept going.' },
  { id: 'peg',     name: 'Peg',           tier: 'ruby', suit: ['#b8232e', '#22252d', '#5a3a22'], head: 'pirate', blurb: 'Lost a ship. Found a throttle.' },
  // emerald
  { id: 'skully',  name: 'Skully',        tier: 'emerald', suit: ['#1c1d22', '#1c1d22', '#f1ecdc'], head: 'skull', bones: true, blurb: 'Nothing left to break.' },
  { id: 'hush',    name: 'Hush',          tier: 'emerald', suit: ['#1d2030', '#1d2030', '#b8232e'], head: 'ninja', blurb: 'You never hear the landing.' },
  { id: 'tincan',  name: 'Tin Can',       tier: 'emerald', suit: ['#9aa6b4', '#6c7886', '#ff5a3d'], head: 'robot', blurb: 'Runs on two-stroke and bad decisions.' },
  { id: 'rudo',    name: 'El Rudo',       tier: 'emerald', suit: ['#1f9e8a', '#f2c230', '#b8232e'], head: 'lucha', cape: '#b8232e', blurb: 'Every landing is a finishing move.' },
  { id: 'jack',    name: 'Jack',          tier: 'emerald', suit: ['#2a2530', '#3d2a4a', '#ff8a1f'], head: 'pumpkin', blurb: 'Glows when he is happy. He is always happy.' },
  // gold
  { id: 'clanks',  name: 'Sir Clanks',    tier: 'gold', suit: ['#b9c2cc', '#8792a0', '#e0b23a'], head: 'knight', blurb: 'Brought armour to a bike race. Sensible, really.' },
  { id: 'bubble',  name: 'Major Bubble',  tier: 'gold', suit: ['#f4f6fa', '#f4f6fa', '#ff6a1f'], head: 'astro', pack: '#d5dae6', blurb: 'Trained for Low Orbit. Lands like it everywhere.' },
  { id: 'glorp',   name: 'Glorp',         tier: 'gold', suit: ['#7a4fe0', '#4a2a9a', '#3dffd2'], head: 'alien', blurb: 'Came for the cows. Stayed for the loops.' },
  { id: 'bjorn',   name: 'Bjorn',         tier: 'gold', suit: ['#7a5236', '#4a5a6a', '#d9b382'], head: 'viking', blurb: 'Raids the finish line.' },
  // diamond
  { id: 'sheets',  name: 'Sheets',        tier: 'diamond', suit: ['#eef4ff', '#dfe8ff', '#c8d6ff'], head: 'ghost', ghost: true, blurb: 'You can see the track through him. He cannot see why that is odd.' },
  { id: 'ember',   name: 'Ember',         tier: 'diamond', suit: ['#2a1a1a', '#3a1f1a', '#ff7a1f'], head: 'flame', live: true, blurb: 'Head permanently on fire. Says it helps with the cold.' },
  { id: 'merl',    name: 'Merl',          tier: 'diamond', suit: ['#3d2a9a', '#2a1f6a', '#ffd24a'], head: 'wizard', cape: '#2a1f6a', live: true, blurb: 'Insists the flips are magic. Nobody has checked.' },
  // opal
  { id: 'prism',   name: 'Prism',         tier: 'opal', suit: ['#f6f4ff', '#e6e0ff', '#ffffff'], head: 'prism', live: true, shift: true, blurb: 'Every colour at once, and none of them for long.' },
  { id: 'nova',    name: 'Nova',          tier: 'opal', suit: ['#0c0e1c', '#0c0e1c', '#9fe8ff'], head: 'nova', live: true, stars: true, blurb: 'A piece of the night sky that learned to wheelie.' }
];

RR.PAINT = {}; RR.RIDER = {};
RR.PAINTS.forEach(function (p, i) { p.index = i; p.kind = 'paint'; RR.PAINT[p.id] = p; });
RR.RIDERS.forEach(function (r, i) { r.index = i; r.kind = 'rider'; RR.RIDER[r.id] = r; });
RR.ITEMS = RR.PAINTS.concat(RR.RIDERS);

/* what things cost and pay */
RR.ECON = { geode: 150, finish: 8, star: 30, flip: 4, flipCap: 10, best: 10, pity: 8 };

/* Pick what a geode holds. owned(item) says whether the player has it already.
   kind: 'any' for a bought geode, 'gold' or 'diamond' for a prize geode that starts at that tier.
   rnd: a 0..1 random number source. You never get something you already have. */
RR.rollGeode = function (kind, owned, rnd, pity) {
  var minRank = kind === 'diamond' ? 3 : kind === 'gold' || pity ? 2 : 0;
  var tot = 0, i, r, rank = minRank;
  for (i = minRank; i < RR.TIERS.length; i++) tot += RR.TIERS[i].odds;
  r = rnd() * tot;
  for (i = minRank; i < RR.TIERS.length; i++) { r -= RR.TIERS[i].odds; if (r < 0) { rank = i; break; } }
  function pool(k) { return RR.ITEMS.filter(function (it) { return RR.TIER[it.tier].rank === k && !owned(it); }); }
  // if that tier is used up, look upward first, then downward
  var order = [rank], d;
  for (d = 1; d < RR.TIERS.length; d++) { if (rank + d < RR.TIERS.length) order.push(rank + d); }
  for (d = 1; d < RR.TIERS.length; d++) { if (rank - d >= 0) order.push(rank - d); }
  for (i = 0; i < order.length; i++) { var p = pool(order[i]); if (p.length) return p[Math.floor(rnd() * p.length)]; }
  return null;
};

if (typeof module !== 'undefined' && module.exports) module.exports = RR;
})(typeof window !== 'undefined' ? window : globalThis);
