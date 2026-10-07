/* Glues the source files into one self-contained page: index.html.
   usage: node tools/build.js */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = f => fs.readFileSync(path.join(root, 'src', f), 'utf8');
const order = ['physics.js', 'builder.js', 'bikes.js', 'tracks.js', 'startimes.js', 'bot.js', 'art-bike.js', 'render.js', 'audio.js', 'game.js', 'ui.js'];
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" fill="#171a22"/><g transform="rotate(-8 90 90)"><rect x="22" y="38" width="136" height="104" rx="16" fill="#f2c230" stroke="#171a22" stroke-width="8"/><circle cx="62" cy="104" r="26" fill="#171a22"/><circle cx="62" cy="104" r="11" fill="#f2c230"/><circle cx="122" cy="104" r="26" fill="#171a22"/><circle cx="122" cy="104" r="11" fill="#f2c230"/><path d="M58 100 86 62l22 6 16 34" fill="none" stroke="#171a22" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M80 58h30" stroke="#e2402f" stroke-width="12" stroke-linecap="round"/></g></svg>`;
(async () => {
  let png = '';
  try {
    const sharp = require('/opt/npm-tools/node_modules/sharp');
    png = 'data:image/png;base64,' + (await sharp(Buffer.from(icon)).resize(180, 180).png({ compressionLevel: 9, palette: true }).toBuffer()).toString('base64');
  } catch (e) {
    const old = fs.existsSync(path.join(root, 'index.html')) ? fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/apple-touch-icon" href="([^"]+)"/) : null;
    png = old ? old[1] : '';
  }
  const js = order.map(f => '/* ---- ' + f + ' ---- */\n' + src(f)).join('\n');
  let html = src('index.template.html');
  html = html.replace('/*ICON_SVG*/', () => 'data:image/svg+xml,' + encodeURIComponent(icon)).replace('/*ICON_PNG*/', () => png)
             .replace('/*CSS*/', () => src('style.css')).replace('/*JS*/', () => js);
  fs.writeFileSync(path.join(root, 'index.html'), html);
  console.log('index.html', (html.length / 1024).toFixed(0) + ' KB');
  // optional second copy without the outer page tags, for hosts that add their own: node tools/build.js --bare <file>
  const i = process.argv.indexOf('--bare');
  if (i > 0) {
    const bare = '<title>Ridge Riot</title>\n<style>\n' + src('style.css') + '\n</style>\n<canvas id="stage"></canvas>\n<div id="ui"></div>\n<script>\n' + js + '\n</script>\n<script>RR.boot();</script>\n';
    fs.writeFileSync(process.argv[i + 1], bare);
    console.log(process.argv[i + 1], (bare.length / 1024).toFixed(0) + ' KB');
  }
})();
