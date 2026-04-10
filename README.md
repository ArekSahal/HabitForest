# HabitForest

HabitForest is a small browser-based tree simulation built with [p5.js](https://p5js.org/).

It draws procedurally generated trees on a full-screen canvas and animates them with:

- branch growth
- wind movement
- falling leaves
- seasonal color changes
- simple controls for summer, fall, and winter states

## What it does

When the page loads, it creates a couple of trees near the bottom of the screen. Each tree grows its own branching structure, sways in the wind, and can spawn leaves that change color over time and eventually fall.

The UI includes buttons to:

- **Fall**, make trees shed leaves faster and shift leaf colors
- **Winter**, push trees into a snowy look with whiter leaves
- **Summer**, reset tree properties toward their default state
- **Reset Trees**, rebuild the forest using the number entered in the input box

Clicking near a tree base also speeds up its leaf color transition.

## Main files

- `index.html`, loads p5.js and the sketch
- `script.js`, the simulation logic for trees, branches, leaves, wind, and controls
- `style.css`, extra tree styling experiments, not heavily used by the canvas sketch

## Run it locally

Open `index.html` in a browser, or serve the folder with any static file server.

Example:

```bash
python3 -m http.server
```

Then open the shown local URL.

## Notes

This looks like an experimental generative art project rather than a polished app. The code is the real product here, and the README is just a guide to help new readers understand it quickly.
