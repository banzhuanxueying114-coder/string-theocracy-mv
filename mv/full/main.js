import { canvas, ctx, readyFonts, resetFrame } from './engine/canvas.js';
import { createTimeline, parseLrc } from './timeline.js';
import { sectionRanges } from './beatgrid.js';
import { prepareSample } from './scenes/sample.js';
import A, { prepareA } from './scenes/A.js';
import B, { prepareB } from './scenes/B.js';
import C, { prepareC } from './scenes/C.js';
import D, { prepareD } from './scenes/D.js';
import E, { prepareE } from './scenes/E.js';
import F, { prepareF } from './scenes/F.js';
import G, { prepareG } from './scenes/G.js';
import H, { prepareH } from './scenes/H.js';
import I, { prepareI } from './scenes/I.js';
import J, { prepareJ } from './scenes/J.js';
import K, { prepareK } from './scenes/K.js';
import L, { prepareL } from './scenes/L.js';
import M, { prepareM } from './scenes/M.js';

async function read(file) {
  const response = await fetch(new URL(`../../music/${file}`, import.meta.url));
  if (!response.ok) throw new Error(`Cannot load ${file}: ${response.status}`);
  return response;
}

let timeline, grid;
const ready = Promise.all([
  read('beatgrid.json').then((response) => response.json()),
  read('String Theocracy.lrc').then((response) => response.text()),
  prepareSample(),
  prepareA(),
  prepareB(),
  prepareC(),
  prepareD(),
  prepareE(),
  prepareF(),
  prepareG(),
  prepareH(),
  prepareI(),
  prepareJ(),
  prepareK(),
  prepareL(),
  prepareM(),
  readyFonts(),
]).then(([parsedGrid, lrc]) => {
  grid = parsedGrid;
  timeline = createTimeline(grid, [A, B, C, D, E, F, G, H, I, J, K, L, M].flat(), parseLrc(lrc));
});

function draw(t) {
  if (!timeline) throw new Error('Await MV.ready before drawing');
  if (!Number.isFinite(t)) throw new Error(`Invalid frame time: ${t}`);
  ctx.save();
  try {
    resetFrame();
    return timeline.draw(Math.max(0, Math.min(grid.duration, t)));
  } finally {
    ctx.restore();
  }
}

window.MV = {
  ready,
  info: () => ({ shots: timeline.shots.length, storyboardShots: timeline.shots.filter((shot) => shot.end == null).length,
    range: [0, grid.duration], sections: sectionRanges(grid) }),
  frame(t, mime = 'image/jpeg', quality = 0.95) {
    draw(t);
    return canvas.toDataURL(mime, quality).split(',')[1];
  },
  draw,
};
ready.then(() => draw(0), (error) => console.error(error));
