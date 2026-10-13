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
  { id: 'aurora',    name: 'Aurora',        tier: 'legendary', c: ['#0b1433', '#3dffb0', '#9b6bff'], pat: { t: 'aurora', base: '#0b1840', cols: ['#3dffb0', '#2fd6ff', '#9b6bff', '#ff6bd6'], size: 0.7, ang: 0.25, dx: 0.02, dy: 0 }, rim: '#caffee', glow: 'aurora', glint: '#ffffff', trail: { cols: ['#caffee', '#9b6bff'], w: 0.24, spark: '#caffee' }, live: true, wide: true, suit: 'aurora' }
];
})(typeof window !== 'undefined' ? window : globalThis);
