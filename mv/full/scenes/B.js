import { scene } from '../timeline.js';
import { drawKeepLyric } from './A.js';
import {
  ctx, W, H, SCALE, scaled, PAPER, COAL, GOLD, DIM_COAL, MONO, GOTHIC, RULES,
  loadImages, clamp, line, strokeCurve, text, withCamera,
} from '../engine/canvas.js';
import { beatAge, beatHit, easeInOutCubic, kick, spring, staggeredGlyph, wipe } from '../motion.js';

const BEAT = 0.517241;
const BAR_BEATS = 4;
const BACKBEATS = [0, 2];
const MIRROR_HITS = [0, 1, 2, 3];
const TURN_HITS = [0, 1, 2];
const PAIR_HITS = [0, 2, 4];
const PALM_HITS = [0, 1];
const FULL_FRAME = [0, 0, W, H];
const ASSETS = new URL('../../../art/full/', import.meta.url);
let art;

function cropPlate(image, width, [sx, sy, sw, sh], { exact = false } = {}) {
  const canvas = document.createElement('canvas');
  const logical = width;
  if (!exact) width = scaled(width, sw);
  canvas.logicalWidth = logical;
  canvas.width = width;
  canvas.height = Math.round(width * sh / sw);
  canvas.getContext('2d').drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function cropFrame(image, width, top) {
  const sourceHeight = image.naturalWidth * H / W;
  return cropPlate(image, width, [0, top ?? (image.naturalHeight - sourceHeight) / 2,
    image.naturalWidth, sourceHeight]);
}

function mirrorInk(plate) {
  // Bake the unlit exposure as opaque ink. Keep the same portrait and its linework.
  const dim = cropPlate(plate, plate.width, [0, 0, plate.width, plate.height], { exact: true });
  dim.logicalWidth = plate.logicalWidth;
  const ink = dim.getContext('2d');
  ink.globalCompositeOperation = 'multiply';
  ink.fillStyle = '#92765E';
  ink.fillRect(0, 0, dim.width, dim.height);
  return { lit: plate, dim };
}

export async function prepareB() {
  const files = [
    ['eyeDrowsy', 'A/A07_eye_drowsy.png', 2304],
    ['eyeIcon', 'B/B01_eye_icon.png', 2304],
    ['nave', 'common/nave_stage.png', 2160],
    ['ledger', 'common/ledger_blank.png', 2160],
    ['mirrors', 'common/mirror_bay.png', 2160],
    ['turn1', 'B/B05_turn1.png', 2160],
    ['turn2', 'B/B05_turn2.png', 2160],
    ['pair', 'B/B06_mirror_pair.png', 2160],
    ['blink', 'B/B07_mirror_blink.png', 2160],
    ['palm', 'B/B07_mirror_palm.png', 2160],
  ];
  const plates = {};
  for (const [id, path, width] of files) {
    const [image] = await loadImages([path], ASSETS);
    plates[id] = cropFrame(image, width);
    if (id === 'turn1' || id === 'turn2') {
      plates[`${id}Mirror`] = mirrorInk(cropPlate(image, 400, [920, 105, 1120, 2350]));
    }
  }
  const [icon] = await loadImages(['common/icon_window.png'], ASSETS);
  plates.icon = cropPlate(icon, 1024, [0, 0, 2560, 3200]);
  const [crowd] = await loadImages(['common/congregation_up.png'], ASSETS);
  plates.congregation = cropPlate(crowd, 2048, [0, 1350, 3840, 1120]);
  for (const [id, path, rect] of [
    ['altServant', 'B/B04_alt_servant.png', [470, 0, 1600, 3650]],
    ['altIcon', 'B/B04_alt_icon.png', [420, 0, 1720, 3650]],
  ]) {
    const [image] = await loadImages([path], ASSETS);
    plates[id] = mirrorInk(cropPlate(image, 400, rect));
  }
  const [doll] = await loadImages(['B/B02_doll_pose.png'], ASSETS);
  // Preserve the chroma-key cutout pipeline used by the A segment.
  // B02_doll_pose: the devotional pose the congregation expects (palms up, head raised).
  const sx = 200, sy = 20, sw = 2160, sh = 3820;
  const source = document.createElement('canvas');
  source.width = sw; source.height = sh;
  const keyCtx = source.getContext('2d', { willReadFrequently: true });
  keyCtx.drawImage(doll, sx, sy, sw, sh, 0, 0, sw, sh);
  const pixels = keyCtx.getImageData(0, 0, sw, sh);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2];
    if (g - Math.max(r, b) >= 32) pixels.data[i + 3] = 0;
    else if (g > Math.max(r, b)) pixels.data[i + 1] = Math.max(r, b);
  }
  keyCtx.putImageData(pixels, 0, 0);
  const cutout = document.createElement('canvas');
  cutout.width = scaled(540, sw); cutout.height = Math.round(cutout.width * sh / sw);
  cutout.getContext('2d').drawImage(source, 0, 0, cutout.width, cutout.height);
  plates.dollCutout = cutout;
  art = plates;
}

const frame = (image, x = 0, y = 0, w = W, h = H) => ctx.drawImage(image, x, y, w, h);
const registerCache = new WeakMap();

function registrationPlates(image) {
  if (registerCache.has(image)) return registerCache.get(image);
  // Trace only high-contrast ink edges. A full shifted copy would double the posture.
  const k = (image.logicalWidth ?? image.width) / image.width;
  const w = Math.round(image.width * k / 2), h = Math.round(image.height * k / 2);
  const layer = document.createElement('canvas');
  layer.width = w; layer.height = h;
  const ink = layer.getContext('2d', { willReadFrequently: true });
  ink.drawImage(image, 0, 0, w, h);
  const pixels = ink.getImageData(0, 0, w, h).data;
  const makePlate = (color, match) => {
    const plate = document.createElement('canvas');
    plate.width = w; plate.height = h;
    const plateCtx = plate.getContext('2d');
    const mask = plateCtx.createImageData(w, h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = (y * w + x) * 4;
        const r = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
        if (!match(r, g, b)) continue;
        if (g + 36 < Math.max(pixels[p - 3], pixels[p + 5], pixels[p - w * 4 + 1], pixels[p + w * 4 + 1])) {
          mask.data[p + 3] = 255;
        }
      }
    }
    plateCtx.putImageData(mask, 0, 0);
    plateCtx.globalCompositeOperation = 'source-in';
    plateCtx.fillStyle = color;
    plateCtx.fillRect(0, 0, w, h);
    return plate;
  };
  const plates = [
    makePlate(GOLD, (r, g, b) => r > 106 && r - g >= 20 && g - b >= 16),
    makePlate(COAL, (r, g) => r < 91 && g < 76),
  ];
  registerCache.set(image, plates);
  return plates;
}

function pressFrame(image, strike, strength = 1) {
  frame(image);
  if (Math.abs(strike) < 0.04) return;
  const [gold, coal] = registrationPlates(image);
  const offset = strike * strength;
  frame(gold, 5 * offset, -2 * offset);
  frame(coal, -3 * offset, 2 * offset);
}

export function punchedCamera(baseZoom, strike, draw, { x = 0, y = 0, push = 0.015 } = {}) {
  // Keep the opaque sheet covering the frame even during the slight negative recoil.
  const dx = x * strike, dy = y * strike;
  const fullZoom = Math.max(1 + 2 * Math.abs(dx) / W, 1 + 2 * Math.abs(dy) / H);
  withCamera(W / 2 - dx, H / 2 - dy, Math.max(fullZoom, baseZoom + push * strike), draw);
}

export function dust(t, count, seed = 0, bounds = [0, 0, W, H]) {
  const [x, y, w, h] = bounds;
  for (let i = 0; i < count; i++) {
    const px = x + ((i * 137.19 + seed + t * (11 + i % 5 * 6)) % w);
    const py = y + h - ((i * 83.71 + seed + t * (7 + i % 7 * 3)) % h);
    ctx.fillStyle = i % 7 === 0 ? GOLD : DIM_COAL;
    ctx.fillRect(px, py, 2 + i % 3, 1 + i % 2);
  }
}

export function codeField(t, rect, seed = 0, strike = 0) {
  const [x, y, w, h] = rect;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let row = 0; row < Math.floor(h / 28); row++) {
    const str = RULES[(row + seed) % RULES.length];
    const shift = (t * BEAT * (18 + row % 4 * 9) + row * 61) % (w + 280);
    const accent = row % 5 === 0;
    text(str, x + w - shift + (accent ? 5 : -2) * strike, y + row * 28 + 17 - 3 * strike, 15, accent ? GOLD : DIM_COAL);
  }
  ctx.restore();
}

export function outlinedLyric(str, x, y, size = 116, align = 'left') {
  // Same Gothic face, paper ink and 12 px rounded coal outline as drawA3.
  ctx.save();
  ctx.font = `${size}px ${GOTHIC}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = 12;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = COAL;
  ctx.strokeText(str, x, y);
  text(str, x, y, size, PAPER, GOTHIC, align);
  ctx.restore();
}

export function animatedLyric(str, localBeat, x, y, { start = 0, end, align = 'left', step = 0.034 } = {}) {
  const size = 116;
  if (localBeat < start || localBeat >= end) return;
  const glyphs = Array.from(str);
  const timing = { start, end, step };
  const lastEntry = start + (glyphs.length - 1) * step + 0.32;
  const firstExit = end - (glyphs.length - 1) * 0.007 - 0.25;
  if (localBeat >= lastEntry && localBeat <= firstExit) {
    outlinedLyric(str, x, y, size, align);
    return;
  }
  ctx.save();
  ctx.font = `${size}px ${GOTHIC}`;
  const left = align === 'center' ? x - ctx.measureText(str).width / 2 : x;
  let prefix = '';
  for (const [i, glyph] of glyphs.entries()) {
    prefix += glyph;
    if (glyph === ' ') continue;
    const m = staggeredGlyph(localBeat, i, glyphs.length, { ...timing, tiltSign: i % 2 ? 1 : -1 });
    if (!m || m.alpha <= 0) continue;
    const center = left + ctx.measureText(prefix).width - ctx.measureText(glyph).width / 2;
    ctx.save();
    ctx.translate(center + m.x, y + m.y);
    ctx.rotate(m.rotation);
    ctx.scale(m.scale, m.scale);
    ctx.globalAlpha *= m.alpha;
    outlinedLyric(glyph, 0, 0, size, 'center');
    ctx.restore();
  }
  ctx.restore();
}

function slamTitle(str, age, baseline, end) {
  const size = 154, spacing = 5;
  ctx.save();
  ctx.font = `${size}px ${GOTHIC}`;
  const glyphs = Array.from(str);
  const advance = ctx.measureText(str).width + spacing * (glyphs.length - 1);
  ctx.translate(W / 2, baseline);
  ctx.scale(Math.min(1, (W - 212) / advance), 1);
  let prefix = '';
  for (const [i, glyph] of glyphs.entries()) {
    prefix += glyph;
    const ageFromStart = age - i / 12;
    if (glyph === ' ' || ageFromStart < 0) continue;
    const exit = clamp((age - (end - 0.23 - (glyphs.length - 1 - i) * 0.008)) / 0.23) ** 3;
    if (exit >= 1) continue;
    const fall = clamp(ageFromStart / 0.18) ** 2;
    const squash = kick(ageFromStart - 0.18, { attack: 0.035, duration: 0.39, freq: 3.3, damp: 8 });
    const rebound = Math.max(0, -squash);
    const center = -advance / 2 + ctx.measureText(prefix).width + i * spacing - ctx.measureText(glyph).width / 2;
    ctx.save();
    ctx.translate(center, -74 * (1 - fall) - 19 * rebound - 30 * exit);
    ctx.scale(1 + 0.072 * squash, 1 - 0.15 * squash);
    ctx.globalAlpha *= 1 - exit;
    text(glyph, 0, 0, size, PAPER, GOTHIC, 'center');
    ctx.restore();
  }
  ctx.restore();
}

function drawB1(beat, end) {
  // B1 cuts directly to the open eye at A7's ending magnification.
  const hit = kick(beatAge(beat, PALM_HITS));
  const zoom = 1.06 + 0.075 * easeInOutCubic(beat / end);
  punchedCamera(zoom, hit, () => {
    pressFrame(art.eyeIcon, hit, 0.75);
    codeField(beat, [170, 115, 1580, 130], 0, hit);
    dust(beat * BEAT, 62, 17, [250, 110, 1420, 830]);
    const eyeline = 466;
    for (const [i, startX] of [552, 1320].entries()) {
      const endX = startX + (i ? -60 : 45);
      line([startX, -8], [endX, eyeline], GOLD, 2.5);
      for (let n = 0; n < 8; n++) {
        const p = (beat * 0.26 * BEAT + n / 8 + i * 0.1) % 1;
        const x = startX + (endX - startX) * p;
        text(RULES[(n + i) % RULES.length].slice(0, 3), x, eyeline * p - 12, 11, GOLD);
      }
    }
  }, { x: 3, y: -3, push: 0.017 });
}

function drawB2(beat, end) {
  const retreat = easeInOutCubic(beat / end);
  const hit = kick(beatAge(beat, BACKBEATS));
  punchedCamera(1, hit, () => {
    withCamera(W / 2, H / 2, 1.2 - 0.2 * retreat, () => pressFrame(art.nave, hit, 0.65));

    // Architectural surround and glass form the rear plane. Doll and congregation
    // recede at separate rates, revealing more of the stage and foreground rows.
    const glassW = 960 - 220 * retreat;
    const glassH = glassW * art.icon.height / art.icon.width;
    frame(art.icon, 850 - glassW / 2, -104 + 88 * retreat, glassW, glassH);

    const dollH = 740 - 165 * retreat;
    const dollW = dollH * art.dollCutout.width / art.dollCutout.height;
    const dollX = 1150 + 100 * retreat;
    const dollTop = 840 - dollH;
    // Gold strings hold the pose: head and both upturned palms (anchors normalised in the cutout).
    frame(art.dollCutout, dollX - dollW / 2, dollTop, dollW, dollH);
    for (const [ax, ay] of [[0.49, 0.03], [0.105, 0.405], [0.85, 0.425]]) {
      const px = dollX - dollW / 2 + ax * dollW, py = dollTop + ay * dollH;
      const top = [px + (ax - 0.5) * 40, -200];
      // Coal under-stroke keeps the gold string legible over the busy nave.
      line(top, [px, py], COAL, 8);
      line(top, [px, py], GOLD, 4);
    }

    const audienceW = W * (1.1 - 0.1 * retreat);
    const audienceH = audienceW * art.congregation.height / art.congregation.width;
    frame(art.congregation, (W - audienceW) / 2, 864 - 134 * retreat, audienceW, audienceH);
  });
  codeField(beat, [0, 8, W, 92], 2, hit);
  dust(beat * BEAT, 90, 33, [0, 110, W, 850]);
  ctx.fillStyle = COAL;
  ctx.fillRect(68, 32, W - 136, 176);
  line([68, 32], [W - 68, 32], GOLD, 3);
  line([68, 208], [W - 68, 208], GOLD, 3);
  slamTitle('STRING THEOCRACY', beat, 166, end);
}

function drawB3(beat, end, lyricBeat) {
  const hit = kick(beatAge(beat, BACKBEATS));
  punchedCamera(1, hit, () => pressFrame(art.ledger, hit, 0.6), { push: 0.012 });
  codeField(beat, [80, 80, 1760, 180], 1, hit);
  dust(beat * BEAT, 35, 71, [360, 250, 1220, 600]);
  for (let i = 0; i < 5; i++) {
    const y = 472 + i * 106;
    ctx.strokeStyle = COAL; ctx.lineWidth = 4; ctx.strokeRect(340, y, 1220, 74);
    line([350, y + 71], [1552, y + 71], GOLD, 1.5);
  }
  const time = beat * BEAT;
  const penX = 1492 + Math.sin(time * 3.1) * 12;
  ctx.save(); ctx.translate(penX, 420 + Math.sin(time * 4) * 8 - 4 * hit); ctx.rotate(-0.5 + 0.045 * hit);
  ctx.fillStyle = COAL; ctx.fillRect(-12, -118, 24, 165);
  ctx.fillStyle = GOLD; ctx.fillRect(-6, -125, 12, 18);
  ctx.restore();
  const index = Math.min(3, Math.floor(beat + 1e-9));
  const slide = easeInOutCubic((beat - index) / 0.22);
  const row = index === 0 ? 0 : index - 1 + slide;
  const cursorY = 482 + row * 106;
  const accent = beatHit(beat, MIRROR_HITS, 8);
  line([300 - 4 * accent, cursorY], [326, cursorY], '#E2723A', 7 + 2 * accent);
  text('SELECT / WAIT', 1585, 1030 - 3 * hit, 20, COAL, MONO, 'right');
}

// Interior contours traced on the 1920 × 1080 center crop of mirror_bay.
// The last two skew toward the vanishing point. The stool occludes the first.
const MIRROR_PANELS = [
  { id: 'altServant', glass: [960, 140, 240, 276, 937, 923], foreground: true },
  { id: 'altIcon', glass: [1349, 349, 101, 438, 913, 906] },
  { id: 'turn1Mirror', glass: [1548, 460, 62, 520, 897, 892] },
  { id: 'turn2Mirror', glass: [1669, 532, 35, 576, 883, 879] },
];

function mirrorPath([x, top, w, spring, leftBase, rightBase], foreground) {
  const right = x + w, center = x + w / 2, rise = spring - top;
  ctx.beginPath();
  ctx.moveTo(x, leftBase);
  ctx.lineTo(x, spring);
  ctx.bezierCurveTo(x, top + rise * 0.63, center - w * 0.16, top + rise * 0.12, center, top);
  ctx.bezierCurveTo(center + w * 0.18, top + rise * 0.13, right, top + rise * 0.62, right, spring);
  if (foreground) {
    ctx.lineTo(right, 903);
    ctx.bezierCurveTo(1142, 903, 1088, 911, 1083, 931);
  } else {
    ctx.lineTo(right, rightBase);
  }
  ctx.closePath();
}

function drawB4(beat) {
  const active = Math.min(MIRROR_PANELS.length - 1, Math.floor(beat + 1e-9));
  const hit = kick(beatAge(beat, MIRROR_HITS));
  const swap = active === 0 ? 0 : spring(Math.max(0, beat - active), 2.6, 15);
  punchedCamera(1 + 0.014 * easeInOutCubic(beat / BAR_BEATS), hit, () => {
    pressFrame(art.mirrors, hit, 0.65);
    drawMirrorPanels(active, swap);
  }, { push: 0.011 });
  codeField(beat, [35, 40, 1850, 108], 3, hit);
  dust(beat * BEAT, 52, 81, [80, 150, 1760, 820]);
  text(`SELECTION / ${String(active + 1).padStart(2, '0')}`, 960 + 2 * hit, 1005 - 4 * hit, 23, GOLD, MONO, 'center');
}

function drawMirrorPanels(active, swap) {
  for (const [i, panel] of MIRROR_PANELS.entries()) {
    const { id, glass, foreground } = panel;
    const [x, top, w, spring, bottom] = glass;
    const image = art[id][i === active ? 'lit' : 'dim'];
    // Place the forehead below the apex and compress the more oblique reflections.
    const portraitTop = top + (spring - top) * 0.2;
    ctx.save();
    mirrorPath(glass, foreground);
    ctx.clip();
    ctx.fillStyle = i === active ? PAPER : '#8B6A50';
    ctx.fillRect(x, top, w, bottom - top);
    const offset = i === active ? swap : 0;
    const spread = w * 0.018 * Math.abs(offset);
    frame(image, x - spread + 1.6 * offset, portraitTop - 3 * offset, w + 2 * spread, bottom - portraitTop + 5 * Math.abs(offset));
    ctx.strokeStyle = i === active ? GOLD : DIM_COAL;
    ctx.lineWidth = 4 + Math.max(0, offset);
    ctx.stroke();
    ctx.restore();
  }
}

function drawB5(beat, end) {
  const index = Math.min(2, Math.floor(beat + 1e-9));
  const state = index % 2 ? art.turn2 : art.turn1;
  const hit = kick(beatAge(beat, TURN_HITS));
  const snap = index ? spring(Math.max(0, beat - index), 2.6, 15) : 0;
  const side = index === 1 ? -1 : 1;
  punchedCamera(1 + 0.01 * easeInOutCubic(beat / end) + 0.004 * snap, hit, () => {
    const x = 2 * side * snap;
    const y = -2 * snap;
    ctx.save();
    ctx.translate(x, y);
    pressFrame(state, hit, 0.72);
    strokeCurve([[680, 0], [700, 165], [730, 228], [785, 370]], GOLD, 3);
    ctx.restore();
  }, { x: 3 * side, y: -3, push: 0.014 });
  codeField(beat, [0, 20, W, 116], 4, hit);
  dust(beat * BEAT, 45, 101, [0, 130, W, 850]);
  for (let i = 0; i < 7; i++) {
    const p = (beat * 0.2 * BEAT + i / 7) % 1;
    text('TENSION / 1.0', 680 + 105 * p + 3 * side * hit, 70 + 300 * p - 3 * hit, 13, GOLD);
  }
  text('HUM / MIRROR 03', 1820, 1030 - 3 * hit, 20, PAPER, MONO, 'right');
}

function drawPair(beat, image, push, hit, snap = 0) {
  const scale = 1 + push + 0.006 * snap;
  punchedCamera(scale, hit, () => {
    ctx.save();
    ctx.translate(2 * snap, -2 * snap);
    pressFrame(image, hit);
    ctx.restore();
  }, { x: -3, y: -3, push: 0.014 });
  codeField(beat, [12, 20, 400, 1040], 1, hit);
  dust(beat * BEAT, 76, 131, FULL_FRAME);
  for (let i = 0; i < 5; i++) {
    const x = 1174 + i * 118;
    const drift = (beat * BEAT * (22 + i * 4)) % 980;
    const driftX = Math.sin(beat * BEAT + i) * 12 + 2 * hit;
    line([x + driftX, 0], [x + driftX, H], GOLD, 1.2);
    text(RULES[(i + 2) % RULES.length].slice(0, 8), x + 8 + 3 * hit, drift + 35 - 3 * hit, 12, GOLD);
  }
}

function drawB6(beat, end, lyricBeat) {
  const hit = kick(beatAge(beat, PAIR_HITS));
  drawPair(beat, art.pair, 0.045 * easeInOutCubic(beat / BAR_BEATS), hit);
}

function drawB7(beat, end, lyricBeat) {
  const palm = beat + 1e-9 >= 1;
  const hit = kick(beatAge(beat, PALM_HITS));
  const snap = palm ? spring(Math.max(0, beat - 1), 2.6, 15) : 0;
  drawPair(beat, palm ? art.palm : art.blink, 0.035 + 0.025 * easeInOutCubic(beat / end), hit, snap);
  // Keep both lines on the room side, clear of the reflected face and palm.
  animatedLyric('Someone else', beat, 72, 202, { start: lyricBeat, end });
  animatedLyric('in that body?', beat, 72, 327, { start: lyricBeat + 0.4, end });
}

// Lines the voice is still singing when the picture cuts are drawn in absolute time over the following shot.
const HOLDS = [
  { start: 19.49, end: 22.8, lines: [['Which "you"', W / 2, 243, 'center', 0],
    ['are you going to be?', W / 2, 369, 'center', 0.37]] },
  { start: 24.24, end: 27.55, lines: [['Inside the mirror', 72, 760, 'left', 0],
    ['do you see', 72, 885, 'left', 0.48]] },
];
const KEEP_END = 17.3;

function drawHolds(t) {
  for (const { start, end, lines } of HOLDS) {
    if (t < start || t >= end) continue;
    for (const [str, x, y, align, delay] of lines) {
      animatedLyric(str, (t - start) / BEAT, x, y, { start: delay, end: (end - start) / BEAT, align });
    }
  }
}

const shots = [
  { id: 'B1', start: '8.1', summary: '睁眼的瞳孔里映出圣像', draw: drawB1 },
  { id: 'B2', start: '9.1', summary: '圣像前的舞台人偶与教徒群像', draw: drawB2 },
  { id: 'B3', start: '10.1', summary: '记录簿上的空白选择框', draw: drawB3, lyricAt: 19.49,
    enter: { beats: 0.44, direction: 'right', edge: GOLD } },
  { id: 'B4', start: '11.1', summary: '镜列逐面亮起三种人偶形象', draw: drawB4,
    enter: { beats: 0.48, grid: [8, 5] } },
  { id: 'B5', start: '12.1', summary: '牵线控制人偶转向最高的镜子', draw: drawB5 },
  { id: 'B6', start: '12.4', summary: '人偶与镜中的另一个自己', draw: drawB6, lyricAt: 24.24 },
  { id: 'B7', start: '14.1', summary: '镜中人眨眼并贴掌，镜外人被线吊着', draw: drawB7, lyricAt: 28.11 },
];

function cueBeat(cue) {
  const [bar, beat] = cue.split('.').map(Number);
  return (bar - 1) * BAR_BEATS + beat - 1;
}

const durations = shots.map(({ start }, i) => cueBeat(shots[i + 1]?.start ?? '16.1') - cueBeat(start));

export default shots.map(({ id, start, summary, draw, enter, lyricAt }, i) =>
  scene('B', id, start, summary, (t, { localTime, shot }) => {
    const beat = Math.max(0, localTime / BEAT);
    // If the LRC cue precedes this shot, use its opening beat.
    const lyricBeat = lyricAt === undefined ? 0 : Math.max(0, (lyricAt - shot.start) / BEAT);
    const incoming = () => {
      draw(beat, durations[i], lyricBeat);
    };
    if (enter && beat < enter.beats) {
      // Only the two shot boundaries use a mask. Each outgoing frame is derived from its final pose.
      const previousEnd = durations[i - 1];
      shots[i - 1].draw(previousEnd, previousEnd, 0);
      wipe(ctx, FULL_FRAME, beat / enter.beats, incoming, enter);
    } else {
      incoming();
    }
    if (id === 'B1' || id === 'B2') drawKeepLyric(t, KEEP_END);
    drawHolds(t);
  }));
