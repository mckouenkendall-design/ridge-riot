/* Glues the source files into one self-contained page: index.html.
   usage: node tools/build.js [--bare <file>] */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = f => fs.readFileSync(path.join(root, 'src', f), 'utf8');
const order = ['physics.js', 'builder.js', 'bikes.js', 'content-paints.js', 'content-paints2.js', 'content-riders.js', 'content-riders2.js', 'collect.js', 'tracks.js', 'goals.js', 'legacy.js', 'startimes.js', 'gearspots.js', 'revs.js', 'bot.js', 'art-bike.js', 'art-bike2.js', 'art-skins.js', 'art-patterns.js', 'art-heads.js', 'art-patterns2.js', 'art-patterns3.js', 'art-heads2.js', 'art-heads3.js', 'art-crate.js', 'art-garage.js', 'render.js', 'wipeouts.js', 'audio.js', 'game.js', 'ui.js', 'showroom.js'];
(async () => {
  // the small tab icon is carried inside the page; the home-screen icon is a picture file beside it (see tools/icon.js)
  const fav = fs.existsSync(path.join(root, 'src', 'favicon.txt')) ? fs.readFileSync(path.join(root, 'src', 'favicon.txt'), 'utf8').trim() : '';
  const js = order.map(f => '/* ---- ' + f + ' ---- */\n' + src(f)).join('\n');
  let html = src('index.template.html');
  html = html.replace('/*ICON*/', () => fav).replace('/*CSS*/', () => src('style.css')).replace('/*JS*/', () => js);
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
