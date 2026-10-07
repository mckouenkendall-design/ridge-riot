# Ridge Riot

A side-on dirt bike game for the browser. Ride over hills, ramps and loops, lean in the air, land flips, and finish each track as fast as you can without your helmet touching anything.

Every bike is earned by riding. There are no ads and nothing to buy.

**Play it:** https://mckouenkendall-design.github.io/ridge-riot/
(works once GitHub Pages is switched on for this repo, see below)

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

Tilt-to-lean is an optional setting. With it on, tilting the phone like a steering wheel leans the bike, and the lean buttons still work.

- Your helmet or back touching the ground ends the run.
- Hold a lean through a whole jump to flip. Landing a flip gives a short boost, which is how the fastest times are set.
- Each track gives one star for finishing, two and three for beating its target times.
- Stars open new worlds and most of the bikes. A few bikes are earned by feats instead (flips landed, air time, finishing a whole world).
- Settings has a switch that unlocks everything straight away. Your real progress is kept underneath.

Progress is saved on the device, in the browser. Clearing the browser's site data for the page wipes it.

## What is in the game

- 40 tracks in 5 worlds: Dustbowl, Pinewood, Frostbite (ice has no grip), Cinder Peak (lava, low rock roofs) and Low Orbit (a third of the gravity, no air).
- 12 bikes that ride differently, not just look different: weight, wheelbase, wheel size, suspension, power, grip and how fast they can be flipped are all separate numbers in `src/bikes.js`.
- A ghost of your best run on each track to race against.
- All art is drawn in code and all sound is generated in code. There are no image or audio files.

## Switching on GitHub Pages

1. Open this repo on github.com.
2. Settings, then Pages (left-hand menu).
3. Under "Build and deployment", set Source to "Deploy from a branch".
4. Branch: `main`, folder: `/ (root)`. Save.
5. Wait a minute or two. The game is then at the address at the top of this page.

On an iPhone, open that address in Safari, tap Share, then "Add to Home Screen". Launched from the home screen it runs full screen with no address bar.

## Files

`index.html` is the whole game in one file. That is the only file the browser needs.

It is glued together from the files in `src/` by `tools/build.js`. Edit the files in `src/`, never `index.html` directly, then rebuild.

| File | What it does |
|---|---|
| `src/physics.js` | The bike simulation: chassis, two sprung wheels, tyres, crashes, flip counting |
| `src/builder.js` | The "pen" that draws tracks from pieces (flat, hill, kicker, gap, loop...) |
| `src/tracks.js` | The 5 worlds and 40 track recipes |
| `src/bikes.js` | The 12 bikes and their numbers |
| `src/startimes.js` | Star target times. Written by a tool, do not edit by hand |
| `src/bot.js` | A robot rider, used for testing and for the bike riding behind the title screen |
| `src/art-bike.js` | Drawing the bikes and the rider |
| `src/render.js` | Drawing the worlds, ground, scenery and effects |
| `src/audio.js` | All sound |
| `src/game.js` | Saving, controls, the main loop |
| `src/ui.js` | Menus and the on-screen display |
| `src/style.css` | How the menus look |

## Rebuilding

You need Node.js. From the repo folder:

```
node tools/build.js
```

That rewrites `index.html`. Commit and push, and Pages picks it up.

## Test tools

These are what was used to check the game. The last three need Playwright (a tool that drives a real browser without a window).

| Command | What it checks |
|---|---|
| `node tools/bot.js --bikes all` | A robot rider, using only the player's four controls (gas, brake, lean back, lean forward), finishes every track on every bike |
| `node tools/bot.js --human 40` | A deliberately clumsy robot and a careful one ride each track 40 times. Their crash rates are the difficulty score used to order the tracks |
| `node tools/bot.js --bikes all --write` | Regenerates the star times from the robot's runs. Run this after changing tracks, bikes or physics |
| `node tools/fuzz.js` | Thousands of runs with random inputs, looking for the physics blowing up |
| `node tools/bikecheck.js` | Side by side numbers for how each bike accelerates, brakes, wheelies and flips |
| `node tools/controls.js <folder>` | Opens the built page at three phone sizes and checks every button, two fingers at once, sliding between buttons, and the keyboard |
| `node tools/play.js tour <folder>` | Opens the built page at phone size, plays it with real touch events and saves screenshots |
| `node tools/audiotest.js <folder>` | Renders every sound without speakers and measures loudness, pitch and clipping |
| `node tools/perf.js` | Time spent per frame |

## What has and has not been tested

Tested by machine: every track can be finished on every bike, physics stability, touch and keyboard controls, saving and reloading, unlocks, the menus at phone and desktop sizes, and that every sound plays at a sensible level without clipping.

Not tested: how it sounds to a human ear, how the handling feels in the hand, tilt control on a real phone, and behaviour on real iPhone and Android hardware. Those need a person.
