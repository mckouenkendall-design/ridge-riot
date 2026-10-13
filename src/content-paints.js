/* Ridge Riot: paint jobs added after the first collection (the first collection lives in collect.js).
   Each entry follows the same shape as the first ones. How a pattern is drawn is in art-patterns.js and
   art-patterns2.js. The theme set a paint job belongs to is not written here: see SETS in collect.js. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
RR.MORE_PAINTS = [
  // common
  { id: 'pepperoni', name: 'Pepperoni',     tier: 'common', c: ['#f3b83b', '#c0392b', '#2f8f3a'], pat: { t: 'pizza', a: '#f3b83b', b: '#c0392b', c: '#2f8f3a', w: 0.36 }, rim: '#c0392b' },
  { id: 'blueprint', name: 'Blueprint',     tier: 'common', c: ['#1f4e9c', '#e8f1ff', '#e8f1ff'], pat: { t: 'blueprint', a: '#1f4e9c', w: 0.4 }, rim: '#e8f1ff' },
  { id: 'flannel',   name: 'Flannel',       tier: 'common', c: ['#b8232e', '#16181e', '#f4f1e8'], pat: { t: 'plaid', a: '#b8232e', w: 0.34 }, rim: '#16181e' },
  // uncommon
  { id: 'honeycomb', name: 'Honeycomb',     tier: 'uncommon', c: ['#f2a900', '#6b3e00', '#ffe08a'], pat: { t: 'hex', a: '#f2a900', b: '#6b3e00', w: 0.3 }, rim: '#6b3e00' },
  { id: 'dragon',    name: 'Dragon Scale',  tier: 'uncommon', c: ['#2f9e57', '#0e3d24', '#f2c230'], pat: { t: 'scales', a: '#0e3d24', cols: ['#2f9e57', '#3bb369', '#27884a', '#43c176'], edge: '#f2c230', w: 0.28 }, rim: '#f2c230' },
  { id: 'thunder',   name: 'Thunderhead',   tier: 'uncommon', c: ['#4b4f6b', '#1b1d2e', '#ffd93d'], pat: { t: 'bolts', a: '#4b4f6b', c: '#ffd93d', w: 0.4 }, rim: '#ffd93d' },
  // rare: metal finishes with a highlight that slides across
  { id: 'oilslick',  name: 'Oil Slick',     tier: 'rare', c: ['#2b2f4a', '#0c0e18', '#2fd6b0'], pat: { t: 'metal', stops: ['#0c1620', '#2fd6b0', '#7a4fe0', '#ff4a8a', '#ffd24a', '#12202c'] }, rim: '#2fd6b0' },
  { id: 'patina',    name: 'Copper Patina', tier: 'rare', c: ['#b8672f', '#4a2410', '#4fb99f'], pat: { t: 'patina', a: '#b8672f', b: '#4fb99f', c: '#8fe0c8', w: 0.5, slide: 0.06 }, rim: '#f0a060' },
  // epic: glints, glowing wheels and a ribbon behind
  { id: 'disco',     name: 'Disco Ball',    tier: 'epic', c: ['#cfd6e2', '#262b38', '#ffffff'], pat: { t: 'mirror', cols: ['#eef2f8', '#c8d6ee', '#dcd0f2', '#b8e4f4', '#f6d6ea', '#aeb8cc'], w: 0.42 }, rim: '#ffffff', glow: '#ffd0f6', glint: '#ffffff', trail: { cols: ['#ffffff', '#ff9ae6'], w: 0.16, spark: '#ffffff' }, wide: true },
  // legendary: the colour moves
  { id: 'aurora',    name: 'Aurora',        tier: 'legendary', c: ['#0b1433', '#3dffb0', '#9b6bff'], pat: { t: 'aurora', base: '#0b1840', cols: ['#3dffb0', '#2fd6ff', '#9b6bff', '#ff6bd6'], size: 0.7, ang: 0.25, dx: 0.02, dy: 0 }, rim: '#caffee', glow: 'aurora', glint: '#ffffff', trail: { cols: ['#caffee', '#9b6bff'], w: 0.24, spark: '#caffee' }, live: true, wide: true, suit: 'aurora' },
  // part A, common
  { id: 'zebra',     name: 'Zebra',         tier: 'common', c: ['#f1ede4', '#16161a', '#b8a48a'], pat: { t: 'zebra', a: '#f0ece2', w: 0.42 }, rim: '#16161a' },
  { id: 'denim',     name: 'Denim',         tier: 'common', c: ['#33598f', '#1d3560', '#f08a1c'], pat: { t: 'denim', a: '#33598f', w: 0.42 }, rim: '#c8742c' },
  { id: 'brick',     name: 'Brick Wall',    tier: 'common', c: ['#a8432f', '#6b2a1d', '#cfc6b4'], pat: { t: 'brick', a: '#c9c0ae', w: 0.42 }, rim: '#6b2a1d' },
  { id: 'wood',      name: 'Wood Grain',    tier: 'common', c: ['#b07a45', '#6e4524', '#d9a869'], pat: { t: 'wood', a: '#a8723e', w: 0.46 }, rim: '#5a3a1c' },
  { id: 'swiss',     name: 'Swiss Cheese',  tier: 'common', c: ['#f6d545', '#c98f12', '#fff08a'], pat: { t: 'swiss', a: '#f6d545', w: 0.44 }, rim: '#e0a81c' },
  { id: 'cardboard', name: 'Cardboard Box', tier: 'common', c: ['#b98a52', '#8a6234', '#dcc088'], pat: { t: 'cardboard', a: '#b98a52', w: 0.5 }, rim: '#8a6234' },
  { id: 'treads',    name: 'Tire Tread',    tier: 'common', c: ['#1e1f24', '#3a3b42', '#f2b01e'], pat: { t: 'treads', a: '#1b1c20', w: 0.46 }, rim: '#f2b01e' },
  { id: 'seventies', name: 'Seventies',     tier: 'common', c: ['#e0701c', '#5a2e12', '#e8b030'], pat: { t: 'seventies', a: '#f2e3c2', w: 0.5 }, rim: '#5a2e12' },
  { id: 'waves',     name: 'Great Wave',    tier: 'common', c: ['#1f4e8c', '#0c2347', '#f2f6fa'], pat: { t: 'waves', a: '#1f4e8c', w: 0.4 }, rim: '#f2f6fa' },
  { id: 'serape',    name: 'Serape',        tier: 'common', c: ['#c8281e', '#16181e', '#f2c230'], pat: { t: 'serape', a: '#c8281e', w: 0.5 }, rim: '#1fa39a' },
  { id: 'notebook',  name: 'Notebook Doodle', tier: 'common', c: ['#f4f1e6', '#4a78c0', '#e0524e'], pat: { t: 'notebook', a: '#f4f1e6', w: 0.5 }, rim: '#4a78c0' },
  // part A, uncommon
  { id: 'leopard',   name: 'Leopard',       tier: 'uncommon', c: ['#d9a441', '#2a1a0c', '#f4d58a'], pat: { t: 'leopard', a: '#dca848', w: 0.46 }, rim: '#2a1a0c' },
  { id: 'blossom',   name: 'Cherry Blossom', tier: 'uncommon', c: ['#1c2250', '#f4a0c0', '#7a4a3a'], pat: { t: 'blossom', a: '#1b2150', w: 0.5 }, rim: '#f6a8c8' },
  { id: 'aloha',     name: 'Aloha',         tier: 'uncommon', c: ['#1b9aa0', '#0e5a5e', '#ff5d73'], pat: { t: 'aloha', a: '#1a9a9e', w: 0.5 }, rim: '#ff5d73' },
  { id: 'circuit',   name: 'Circuit Board', tier: 'uncommon', c: ['#1b7a3c', '#0c3f1f', '#e0a040'], pat: { t: 'circuit', a: '#1c7a3e', w: 0.46 }, rim: '#e8b04a' },
  { id: 'memphis',   name: 'Memphis',       tier: 'uncommon', c: ['#f6e9d2', '#16181e', '#ff8fb8'], pat: { t: 'memphis', a: '#f7ecd6', w: 0.5 }, rim: '#16181e' },
  { id: 'sprinkles', name: 'Sprinkles',     tier: 'uncommon', c: ['#f48fb1', '#ffffff', '#ffd54a'], pat: { t: 'sprinkles', a: '#f58cb4', w: 0.44 }, rim: '#ffffff' },
  { id: 'snakeskin', name: 'Snakeskin',     tier: 'uncommon', c: ['#8a6a3a', '#2a1c0e', '#d8b878'], pat: { t: 'snakeskin', a: '#a07c46', w: 0.5 }, rim: '#2a1c0e' },
  { id: 'stickers',  name: 'Sticker Bomb',  tier: 'uncommon', c: ['#f2f0ea', '#16181e', '#ff4a6a'], pat: { t: 'stickers', a: '#e8e6e0', w: 0.56 }, rim: '#ffd23a' },
  { id: 'starfield', name: 'Starfield',     tier: 'uncommon', c: ['#0c1438', '#2a3a80', '#fff4b0'], pat: { t: 'starfield', a: '#0b1236', w: 0.5 }, rim: '#fff4b0' },
  { id: 'bubblewrap', name: 'Bubble Wrap',  tier: 'uncommon', c: ['#cfe6f4', '#8ab4d0', '#ffffff'], pat: { t: 'bubblewrap', a: '#c4def0', w: 0.42 }, rim: '#8ab4d0' },
  { id: 'mosaic',    name: 'Roman Mosaic',  tier: 'uncommon', c: ['#b5502e', '#2a1d16', '#e8b04a'], pat: { t: 'mosaic', a: '#7c6c58', w: 0.5 }, rim: '#2a1d16' }
];
})(typeof window !== 'undefined' ? window : globalThis);
