/* Ridge Riot: more paint jobs (the later batch). Same shape as content-paints.js. */
(function (root) {
'use strict';
var RR = root.RR || (root.RR = {});
RR.MORE_PAINTS2 = [
  // rare: polished and richly detailed
  { id: 'marble',     name: 'Marble',          tier: 'rare', c: ['#eceef1', '#7f93b4', '#d9a72a'], pat: { t: 'marble', a: '#eceef1', w: 0.42, slide: 0.05 }, rim: '#d9a72a', wide: true },
  { id: 'stainedglass', name: 'Stained Glass', tier: 'rare', c: ['#d3122f', '#1f55e0', '#f5a613'], pat: { t: 'stainedglass', a: '#17141f', w: 0.5 }, rim: '#f5a613', wide: true },
  { id: 'monarch',    name: 'Monarch',         tier: 'rare', c: ['#ff9a1a', '#14100f', '#fbfaf2'], pat: { t: 'monarch', a: '#ff9a1a', w: 0.5, slide: 0.04 }, rim: '#14100f', wide: true },
  { id: 'lacquer',    name: 'Samurai Lacquer', tier: 'rare', c: ['#b8121a', '#17171d', '#f2c14a'], pat: { t: 'lacquer', a: '#17171d', c: '#f4ead0', w: 0.55 }, rim: '#f2c14a', wide: true },
  { id: 'titanium',   name: 'Titanium Burn',   tier: 'rare', c: ['#8a3fe6', '#2a2f3a', '#ffc13a'], pat: { t: 'titanium', a: '#8a3fe6', w: 0.6, slide: 0.05 }, rim: '#17c3c0', wide: true },
  { id: 'lavalamp',   name: 'Lava Lamp',       tier: 'rare', c: ['#3d1470', '#1b0838', '#ff8a2e'], pat: { t: 'lavalamp', a: '#3d1470', w: 0.5, slide: 0.03 }, rim: '#ff6fa8', wide: true },
  { id: 'koi',        name: 'Koi Pond',        tier: 'rare', c: ['#0e5662', '#062832', '#ff8a22'], pat: { t: 'koi', a: '#0e5662', w: 0.5 }, rim: '#ff8a22', wide: true },
  { id: 'damask',     name: 'Royal Damask',    tier: 'rare', c: ['#6e1230', '#2e0610', '#e9b93c'], pat: { t: 'damask', a: '#6e1230', w: 0.55, slide: 0.04 }, rim: '#e9b93c', wide: true },
  // epic: glints, glowing wheels and a ribbon of light
  { id: 'peacock',    name: 'Peacock',         tier: 'epic', c: ['#13808a', '#1a3f9a', '#d9a926'], pat: { t: 'peacock', a: '#0f6f78', w: 0.6 }, rim: '#d9a926', glow: '#31e0c8', glint: '#fff6b0', trail: { cols: ['#8af5d8', '#2f6fe0'], w: 0.16, spark: '#b6ffe8' }, wide: true },
  { id: 'hologram',   name: 'Hologram Foil',   tier: 'epic', c: ['#cfd8ff', '#7a5cff', '#ffffff'], pat: { t: 'hologram', a: '#cfd8ff', w: 0.5 }, rim: '#ffffff', glow: '#a8f0ff', glint: '#ffffff', trail: { cols: ['#ffffff', '#c8a0ff'], w: 0.16, spark: '#ffffff' }, wide: true },
  { id: 'galaxy',     name: 'Galaxy',          tier: 'epic', c: ['#1a0f4a', '#8a2fc8', '#3dd8e0'], pat: { t: 'galaxy', a: '#1a0f4a', w: 0.55 }, rim: '#9a6bff', glow: '#9a6bff', glint: '#ffffff', trail: { cols: ['#c8a0ff', '#ff6bd6'], w: 0.16, spark: '#e0d0ff' }, wide: true },
  { id: 'synthwave',  name: 'Synthwave',       tier: 'epic', c: ['#2a0a5a', '#ff3f9a', '#27e0ff'], pat: { t: 'synthwave', a: '#2a0a5a', w: 0.5 }, rim: '#27e0ff', glow: '#ff3fd0', glint: '#27e0ff', trail: { cols: ['#27e0ff', '#ff3fd0'], w: 0.16, spark: '#ffd0f6' }, wide: true },
  { id: 'fireworks',  name: 'Fireworks',       tier: 'epic', c: ['#0b1030', '#ff4a8a', '#ffd24a'], pat: { t: 'fireworks', a: '#0b1030', w: 0.5 }, rim: '#ffd24a', glow: '#ffb347', glint: '#ffe9a0', trail: { cols: ['#ffd24a', '#ff4a8a'], w: 0.16, spark: '#fff0b0' }, wide: true },
  // legendary: the colour moves
  { id: 'magma',      name: 'Magma',           tier: 'legendary', c: ['#1a0e0d', '#ff5a0a', '#ffb02a'], pat: { t: 'magma', size: 0.55, ang: 0.4, dx: 0.02, dy: 0.01 }, rim: '#ff7a1a', glow: '#ff6a10', glint: '#ffd27a', trail: { cols: ['#ffd27a', '#ff4a0a'], w: 0.24, spark: '#ffb02a' }, live: true, wide: true },
  { id: 'matrix',     name: 'Digital Rain',    tier: 'legendary', c: ['#01100a', '#1fd45a', '#d8ffe4'], pat: { t: 'matrix', size: 0.6, ang: 0, dx: 0, dy: 0 }, rim: '#3dff7a', glow: '#3dff7a', glint: '#eafff0', trail: { cols: ['#d8ffe4', '#1fd45a'], w: 0.24, spark: '#9dffb8' }, live: true, wide: true },
  { id: 'abyss',      name: 'Abyss',           tier: 'legendary', c: ['#04122a', '#00c8ff', '#ff3cc8'], pat: { t: 'abyss', size: 0.6, ang: 0, dx: 0, dy: 0 }, rim: '#6af0ff', glow: '#22d8ff', glint: '#aef6ff', trail: { cols: ['#aef6ff', '#ff3cc8'], w: 0.24, spark: '#aef6ff' }, live: true, wide: true },
  // trophy: earned, never found in a crate
  { id: 'grandtour',  name: 'Grand Tour',      tier: 'trophy', c: ['#e8b12e', '#7a5210', '#fff3b0'], pat: { t: 'grandtour', size: 0.6, ang: 0, dx: 0, dy: 0 }, rim: '#ffe27a', glow: '#ffd23f', glint: '#fff7cf', trail: { cols: ['#fff7cf', '#ffc22e'], w: 0.28, spark: '#fff3b0' }, live: true, wide: true },
  { id: 'pinwheel',   name: 'Pinwheel',        tier: 'trophy', c: ['#f6d65a', '#fffaf0', '#b8841a'], pat: { t: 'pinwheel', size: 0.5, ang: 0, dx: 0, dy: 0 }, rim: '#fffaf0', glow: '#ffd23f', glint: '#ffffff', trail: { cols: ['#ffffff', '#ffc22e'], w: 0.28, spark: '#fff3b0' }, live: true, wide: true },
  { id: 'longhaul',   name: 'Long Haul',       tier: 'trophy', c: ['#14161e', '#ffc83a', '#f4e9c0'], pat: { t: 'longhaul', size: 0.9, ang: 0, dx: 0, dy: 0 }, rim: '#ffc83a', glow: '#ffd23f', glint: '#fff0b0', trail: { cols: ['#fff3b0', '#ff9a1f'], w: 0.28, spark: '#ffe9a0' }, live: true, wide: true },
  { id: 'curator',    name: 'Curator',         tier: 'trophy', c: ['#f2efe8', '#c8962a', '#7a1830'], pat: { t: 'curator', size: 0.6, ang: 0, dx: 0, dy: 0 }, rim: '#e2ae34', glow: '#ffd23f', glint: '#ffffff', trail: { cols: ['#ffffff', '#ffc22e'], w: 0.28, spark: '#fff7cf' }, live: true, wide: true },
  { id: 'gearhead',   name: 'Gearhead',        tier: 'trophy', c: ['#d9a63a', '#2b2824', '#e6ebf0'], pat: { t: 'gearhead', size: 0.7, res: 128, ang: 0, dx: 0, dy: 0 }, rim: '#e6ebf0', glow: '#ffc24a', glint: '#fff4cc', trail: { cols: ['#fff4cc', '#d99a2a'], w: 0.28, spark: '#ffe9a0' }, live: true, wide: true }
];
})(typeof window !== 'undefined' ? window : globalThis);
