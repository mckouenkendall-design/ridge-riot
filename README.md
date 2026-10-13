# Ridge Riot

A side-on dirt bike game for the browser. Ride over hills, ramps and loops, lean in the air, land flips, and finish each track as fast as you can without your helmet touching anything.

Everything is earned by riding. There are no ads and nothing to buy.

**Play it:** https://mckouenkendall-design.github.io/ridge-riot/

## How to play

| | Phone (held sideways) | Keyboard |
|---|---|---|
| Gas | right thumb, outer button | W or up arrow |
| Brake | right thumb, inner button | S or down arrow |
| Lean back | left thumb, outer button | A or left arrow |
| Lean forward | left thumb, inner button | D or right arrow |
| Restart | round arrow button | R |
| Pause | pause button | P or Esc |

The throttle is yours. Nothing drives the bike unless you hold gas, and the clock starts the first time you do.

On a phone each finger is tracked on its own, so you can hold gas and lean at the same time, and slide a thumb from one button to its neighbour without lifting. The touch areas are bigger than the buttons you see: the whole left half of the screen is the two lean areas and the whole right half is brake and gas.

Tilt-to-lean is an optional setting. With it on, tilting the phone like a steering wheel leans the bike, and the lean buttons still work. Settings also has a "tilt feel" choice for how far you have to tilt.

- Your helmet or back touching anything ends the run. That includes whatever is above you.
- Full gas is not always the answer. From the middle of each world on, tracks have places that end the run if you arrive too fast (a low roof over a hump, a ledge with rock above the landing, something hanging over a jump) and places that end it if you arrive too slow (a gap or a loop straight after one of those). The first few are marked with a warning triangle. After that you learn them.
- Hold a lean through a whole jump to flip. Landing a flip gives a short boost, which is how the fastest times are set.
- Each track gives one star for finishing, two and three for beating its target times.
- Stars open new worlds and most of the bikes. The rest are earned by feats (flips landed, air time, distance ridden, top speed, even crashing a lot).
- Settings has a switch that unlocks everything straight away. Your real progress is kept underneath.

Progress is saved on the device, in the browser. Clearing the browser's site data for the page wipes it.

## What is in the game

- **48 tracks in 6 worlds:** Dustbowl, Pinewood, Raceway (tarmac, boost strips, oil, rows of buses to jump), Frostbite (ice has no grip), Cinder Peak (lava, low rock roofs) and Low Orbit (a third of the gravity, no air).
- **A skill gap.** The first two tracks of each world (five in Dustbowl) can be ridden flat out. The other 33 cannot: see "How hard it is" below.
- **15 bikes that ride differently**, not just look different: weight, wheelbase, wheel size, suspension, power, grip and how fast they can be flipped are all separate numbers in `src/bikes.js`. Three have a trick of their own: the Penny Dreadful has one huge wheel, the Marshmallow's roll hoop takes one knock on the head for you each run, and the Slingshot is a drag bike that will not wheelie.
- **A collection:** 72 paint jobs and 60 riders in five rarities, lowest to highest: common, uncommon, rare, epic, legendary. They come in 19 themed sets (Corner Shop, Workshop, Pit Lane, Cabin & Camp, Wild World, Desert Run, Deep Blue, Old Kingdoms, Far East, Big Top, Doodle Club, Retro Night, Night Sky, Big Weather, Static, Hot Stuff, Shore Leave, Spooky Hour, Jewel Box) and the garage shows how far through each set you are. Paint goes on any bike you own and each bike remembers its own paint and rider. The look climbs with the rarity: plain finishes, then metal with a sliding highlight, then glints, and at the top colours that shift, glowing wheels and a ribbon of light. Anything that moves is redrawn on every frame at the screen's own refresh rate (60, 120 or more times a second).
- **Nuggets and crates:** you earn nuggets by finishing tracks (8), earning stars (30 each, once) and landing flips (4 each, up to 10 a run). A wooden parts crate costs 80 nuggets, you pry it open with three taps, and it holds one paint job or rider. You never get something you already have. Finishing every track in a world gives a free rare crate (rare or better), and three stars on all eight a free epic crate. The full collection of 132 costs about twice what the old 44 did.
- **Trophies:** six paint jobs and riders that can never come out of a crate. Each one is earned by something the game already counts, and the garage shows the condition and a progress bar: Grand Tour (finish every track), The Champ (three stars on every track), Pinwheel (land 500 flips), Long Haul (ride 100 km), Goldie (crash 500 times) and Curator (collect all 132 crate items). The "unlock everything" switch does not open them.
- **A showroom:** your bikes standing in a garage, each wearing its own paint and rider. The garage has five levels, bought with nuggets: the Shed (3 spots, free), Workshop (6, 300), Garage (9, 700), Dealership (12, 1300) and Showroom (15, 2200), each with its own look. It is only for looking at: every bike you own is always ridden from the normal bike list. Tap a bike on show to make it your ride; Arrange lets you choose who stands where, or leave a spot empty.
- **A crash animation for every bike.** The run is over either way, so it may as well be funny.
- A ghost of your best run on each track to race against.
- All art is drawn in code and all sound is generated in code. The only picture files are the two app icons, which are also drawn by code (see below).

### How hard it is

Two robot riders measure this, on every track and every bike (`tools/skill.js`).

- The **flat-out rider** holds full gas from the start line and only leans to stay the right way up. On the starter bike it finishes the 15 gentle tracks and none of the other 33.
- The **learned rider** knows the safe speed for each obstacle and aims for it, but judges speed like a person (about 1.5 m/s out either way) and leans a little late. On the starter bike it gets through the 33 harder tracks between 70% and 100% of the time. The last track of each world is the hardest.

There are 79 of these obstacles in the game. For each one, on each of the 15 bikes, there is a range of speeds that survives it, and the narrowest of those ranges anywhere is about 3 m/s (11 km/h) wide.

Bikes are not equal here. The Penny Dreadful's rider sits about 25 cm higher than anyone else and has the least room under everything. The Mosquito and the Slingshot sit low. Slow bikes (Billy Goat, Biscotti) arrive slower flat out, so they survive a few of the early obstacles without lifting. The Marshmallow's roll hoop takes one roof for you.

### Crate odds

Shown in the game too. For an ordinary crate: common 43%, uncommon 27%, rare 18%, epic 9%, legendary 3%. If the tier you rolled is used up you get the next tier up instead. After 8 crates in a row below rare, the next one is rare or better. A rare crate (prize for finishing a world) is always rare or better, an epic crate (prize for three-starring a world) always epic or better.

Old saves carry over: everything owned keeps its place (ruby became common, emerald uncommon, gold rare, diamond epic, opal legendary), unopened gold geodes became rare crates and diamond geodes epic crates, and nuggets, bikes, stars and best times are untouched.

## Putting it on your phone's home screen

On an iPhone, open the address in Safari, tap Share, then "Add to Home Screen". Launched from there it runs full screen with no browser bars.

If you added it before the icon was redrawn, the phone will still show the old icon. Delete the home-screen shortcut and add it again.

## Files

`index.html` is the whole game in one file. That is the only file the browser needs to play.

`apple-touch-icon.png` and `icon-512.png` are the app icon. Phones insist on reading the home-screen icon from a real picture file, so this is the one place the game uses any. They are drawn with the game's own bike art by `tools/icon.js`.

`index.html` is glued together from the files in `src/` by `tools/build.js`. Edit the files in `src/`, never `index.html` directly, then rebuild.

| File | What it does |
|---|---|
| `src/physics.js` | The bike simulation: chassis, two sprung wheels, tyres, crashes, flip counting |
| `src/builder.js` | The "pen" that draws tracks from pieces (flat, hill, kicker, gap, loop, boost strip, buses...) |
| `src/tracks.js` | The 6 worlds and 48 track recipes, and the running order |
| `src/bikes.js` | The 15 bikes and their numbers |
| `src/collect.js` | The rarities and trophy tier, the themed sets, the original 24 paint jobs and 20 riders, how the content files are joined, trophy rules, prices, the crate rules and the garage levels |
| `src/content-paints.js`, `src/content-paints2.js`, `src/content-riders.js`, `src/content-riders2.js` | The names, colours and descriptions of the 48 new paint jobs and 40 new riders (the drawing is in the `art-*` files) |
| `src/startimes.js` | Star target times and the speed the robot holds through each obstacle. Written by a tool, do not edit by hand |
| `src/revs.js` | Which tracks have changed shape since the last release, so old best times on them are dropped (the stars are kept). Written by a tool |
| `src/bot.js` | A robot rider, used for testing and for the bike riding behind the title screen |
| `src/art-bike.js` | Drawing the bikes and the stock riders |
| `src/art-skins.js` | The machinery for paint jobs and riders: fills, moving tiles, heads, the small pictures in the garage, and `A.moves` (does this item change from frame to frame) |
| `src/art-patterns.js`, `art-patterns2.js`, `art-patterns3.js` | The patterns for the paint jobs: still ones are painted once, moving ones are repainted every frame |
| `src/art-heads.js`, `art-heads2.js`, `art-heads3.js` | The heads (and the little extras) of the collectable riders |
| `src/art-crate.js` | The wooden parts crate and its three states |
| `src/art-garage.js` | The five garage looks (shed, workshop, garage, dealership, showroom), their moving lights, and what a bike stands on |
| `src/showroom.js` | The showroom screen: spots, tapping, Arrange, upgrades, and the redraw every frame |
| `src/render.js` | Drawing the worlds, ground, scenery and effects |
| `src/wipeouts.js` | The crash animations |
| `src/audio.js` | All sound |
| `src/game.js` | Saving, controls, nuggets and unlocks, the main loop |
| `src/ui.js` | Menus, the garage (bikes, paint, riders, crates, trophies), the crate opening and the on-screen display |
| `src/style.css` | How the menus look |

## Rebuilding

You need Node.js. From the repo folder:

```
node tools/build.js
```

That rewrites `index.html`. Commit and push to `main`, and GitHub Pages picks it up within a minute or two.

## Test tools

These are what was used to check the game. The ones marked "browser" need Playwright (a tool that drives a real browser without a window).

| Command | What it checks |
|---|---|
| `node tools/skill.js --bikes all --summary --prove --json out.json` | The main check. For every track and bike: does a rider who never lifts finish (on a track with teeth it must not), what range of speeds survives each obstacle, how often a rider who knows those speeds gets through, and proof that the track can be finished at all. Slow: about 45 minutes on two processor cores |
| `node tools/skill.js --from out.json` | Writes the star times and robot speeds from that run. Run `node tools/rebuilt.js` first |
| `node tools/lab.js <piece> [world] --args ...` | Rides every bike into one obstacle at every speed and prints which speeds survive. This is how the obstacles were sized |
| `node tools/rebuilt.js` | Works out which tracks changed shape since the last release and writes `src/revs.js`. After releasing, `node tools/rebuilt.js --ship` makes the current tracks the new reference |
| `node tools/bot.js --bikes all` | The older rewind-and-retry robot: after a crash it backs up a few seconds and tries another way. Used as a fallback proof when the simple rider cannot get a bike round. `node tools/tally.js <file>` sums up the output |
| `node tools/fuzz.js` | Thousands of runs with random inputs, looking for the physics blowing up |
| `node tools/leanfeel.js` | How quickly the lean control bites, how far a tap turns the bike and how soon it stops when you let go, as numbers |
| `node tools/bikecheck.js` | Side by side numbers for how each bike accelerates, brakes, wheelies and flips |
| `node tools/crates.js` | Opens 200,000 crates to confirm the odds, and 3,000 whole collections of 132 to confirm nothing ever repeats, no trophy ever comes out, prize crates start at their tier, the bad-luck rule holds, and the full collection costs about twice what it used to |
| `node tools/layout.js <folder>` (browser) | Every menu screen at eight screen sizes, with and without a phone notch, including the crate, trophy and showroom screens at all five garage levels: every button fully on screen, not covered by anything, and no text cut off. Saves a picture of each |
| `node tools/flow.js <folder>` (browser) | Saves from both older versions carry over (owned items keep their tier, geodes become crates), nuggets are paid correctly, all 132 crates open through the real buttons with no repeats, trophies show progress and are earned and announced, the showroom at every level (spots, upgrades, tapping, Arrange, empty spots, a reload), buttons answer to a thumb that drifts, the keyboard works. Takes about 10 minutes |
| `node tools/controls.js <folder>` (browser) | The four ride buttons at three phone sizes: two fingers at once, sliding between buttons, and the keyboard |
| `node tools/wipes.js <folder>` (browser) | Crashes every bike on purpose and photographs its crash animation |
| `node tools/gallery.js <folder>` (browser) | Contact sheets of every bike, paint job and rider. `--compare` puts the new ones next to the originals, one row per rarity, `--new` shows only the added ones, `--zoom=2` draws everything twice as big, `--only=id,id` picks items |
| `node tools/swatches.js <folder> [first] [last]` (browser) | Big close-ups of a range of paint jobs and riders for checking detail |
| `node tools/ride.js <folder> '<list>'` (browser) | The robot rides chosen tracks in the real page and saves pictures along the way |
| `node tools/audiotest.js <folder>` (browser) | Renders every sound without speakers and measures loudness, pitch and clipping |
| `node tools/perf.js` (browser) | Milliseconds to draw a frame while riding with the fanciest paint jobs and riders on, which items cost the most, and a full showroom. `--old --page=<file>` runs the riding part on an older build for comparison. The test browser has no graphics card, so compare the numbers with each other rather than reading them as phone speed |
| `node tools/icon.js` (browser) | Redraws the app icon |

## What has and has not been tested

Tested by machine: every track can be finished on every bike, every speed obstacle has a workable range of speeds on every bike, a rider who never lifts cannot finish the harder tracks on the starter bike, physics stability, touch and keyboard controls, button taps with a drifting thumb, menu layout at phone sizes with a notch, saving and reloading including saves from the first version, the nugget and crate rules (all 132 crates through the real buttons), trophies, the showroom, saves from both earlier versions, and that every sound plays at a sensible level without clipping.

Not tested: how it sounds to a human ear, how the handling feels in the hand, whether the difficulty is right for a person (it was set with robot riders, which do not get surprised, bored or annoyed), and behaviour on real iPhone and Android hardware (the tests run in a desktop browser pretending to be a phone). Frame times are only measured in a test browser with no graphics card, so real phone frame rates, and how well the showroom's load sharing (it redraws animated bikes less often if a screen is struggling) behaves on a real screen, are unmeasured. Those need a person.
