/* Draws the app icon with the game's own bike art and saves it as PNG files next to index.html.
   (The home-screen icon is the one thing a phone insists on reading from a real picture file.)
   usage: node tools/icon.js */
const lib = require('./lib.js'), fs = require('fs'), path = require('path');
const sharp = require('/opt/npm-tools/node_modules/sharp');
(async () => {
  const t = await lib.open({ w: 900, h: 600, dpr: 1, touch: false });
  const url = await t.ev(() => {
    const N = 1024, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d');
    // the Dustbowl sunset
    const g = c.createLinearGradient(0, 0, 0, N); g.addColorStop(0, '#4b2a7a'); g.addColorStop(0.45, '#e0605a'); g.addColorStop(0.8, '#ffb469'); g.addColorStop(1, '#ffe2a6');
    c.fillStyle = g; c.fillRect(0, 0, N, N);
    const sg = c.createRadialGradient(N * 0.74, N * 0.66, 0, N * 0.74, N * 0.66, N * 0.6); sg.addColorStop(0, 'rgba(255,240,200,0.9)'); sg.addColorStop(0.3, 'rgba(255,214,150,0.4)'); sg.addColorStop(1, 'rgba(255,190,120,0)');
    c.fillStyle = sg; c.fillRect(0, 0, N, N);
    c.beginPath(); c.arc(N * 0.74, N * 0.68, N * 0.17, 0, 7); c.fillStyle = '#fff3d0'; c.fill();
    // a ramp of red rock with the pale crust on top
    c.beginPath(); c.moveTo(-10, N * 0.9); c.quadraticCurveTo(N * 0.45, N * 0.9, N * 1.02, N * 0.6); c.lineTo(N * 1.02, N * 1.02); c.lineTo(-10, N * 1.02); c.closePath();
    c.fillStyle = '#a2452f'; c.fill();
    c.beginPath(); c.moveTo(-10, N * 0.9); c.quadraticCurveTo(N * 0.45, N * 0.9, N * 1.02, N * 0.6); c.lineWidth = N * 0.04; c.strokeStyle = '#f3bd6c'; c.stroke(); c.lineWidth = N * 0.012; c.strokeStyle = '#15171d';
    c.beginPath(); c.moveTo(-10, N * 0.88); c.quadraticCurveTo(N * 0.45, N * 0.88, N * 1.02, N * 0.58); c.stroke();
    // the starter bike, front wheel in the air
    const d = RR.BIKE.scrapper, S = N * 0.36;
    c.save(); c.translate(N * 0.3, N * 0.86 - d.rr * S); c.rotate(-0.62); c.scale(S, -S); c.translate(0, -d.rr);
    RR.Art.bike(c, d, { rider: true, lp: -0.6, stand: 0.3, spinR: 0.4, spinF: 1.1 });
    c.restore();
    // dirt off the back wheel
    c.fillStyle = '#f3bd6c'; [[0.12, 0.8, 26], [0.06, 0.74, 18], [0.17, 0.72, 14], [0.03, 0.84, 22], [0.1, 0.66, 10]].forEach(p => { c.beginPath(); c.arc(N * p[0], N * p[1], p[2], 0, 7); c.fill(); });
    return cv.toDataURL('image/png');
  });
  await t.close();
  const big = Buffer.from(url.split(',')[1], 'base64'), root = path.join(__dirname, '..');
  await sharp(big).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(root, 'apple-touch-icon.png'));
  await sharp(big).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(root, 'icon-512.png'));
  const small = await sharp(big).resize(64, 64).png({ compressionLevel: 9, palette: true }).toBuffer();
  fs.writeFileSync(path.join(root, 'src', 'favicon.txt'), 'data:image/png;base64,' + small.toString('base64'));
  console.log('wrote apple-touch-icon.png (180), icon-512.png and src/favicon.txt (' + small.length + ' bytes)');
})();
