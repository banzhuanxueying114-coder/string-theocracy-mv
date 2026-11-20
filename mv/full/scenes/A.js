import { scene } from '../timeline.js';
import {
  ctx, W, H, SCALE, scaled, PAPER, COAL, GOLD, DIM_COAL, DIM_PAPER, MONO, GOTHIC, RULES,
  loadImages, clamp, easeOut, cubicPoint, line, strokeCurve, poly, ring, text, withCamera,
} from '../engine/canvas.js';
import {
  beatAge, easeInOutCubic, easeOutBack, easeOutExpo, kick, spring, staggeredGlyph,
} from '../motion.js';

const BEAT = 0.517241;
const BAR = 2.068966;
const TAU = Math.PI * 2;
const GOLD_INK = '#D1B17B';
const ASSETS = new URL('../../../art/full/', import.meta.url);
const DOLL_CROP = [440, 40, 1740, 3740];
const DOLL_ANCHORS = [[706, 1455], [1190, 127], [1468, 1650]];
const KEY_CROP = [384, 840, 1792, 808];
const KEY_CENTER = [1280, 1253];
const KEYHOLE = [1928, 1153];
const KEY_TILT = 0.38; // ~22° high camera; bow foreshortens to a flat ellipse
const LASHES = [[1190, 1380], [2640, 1230]];
const AUDIENCE_TOP = 374;
const AUDIENCE_CUTS = [1558, 1858];
let art;

function surface(width, height) {
  const plate = document.createElement('canvas');
  plate.width = width;
  plate.height = height;
  return plate;
}

function cropFrame(image, width, top) {
  const srcW = image.naturalWidth;
  const srcH = srcW * H / W;
  const px = scaled(width, srcW);
  const plate = surface(px, px * H / W);
  plate.getContext('2d').drawImage(image, 0, top ?? (image.naturalHeight - srcH) / 2,
    srcW, srcH, 0, 0, plate.width, plate.height);
  plate.logicalWidth = width;
  return plate;
}

function keyPlate(image, [sx, sy, sw, sh], width, separateOrange = false) {
  // Key at source resolution so the green never mixes into the resampled plate.
  const source = surface(sw, sh);
  const ink = source.getContext('2d', { willReadFrequently: true });
  ink.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  const data = ink.getImageData(0, 0, sw, sh);
  const px = data.data;
  const orange = separateOrange ? surface(sw, sh) : null;
  const sep = orange?.getContext('2d');
  const sepData = sep?.createImageData(sw, sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const i = (y * sw + x) * 4;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const neutral = Math.max(r, b);
      if (g - neutral >= 32) {
        px[i + 3] = 0;
      } else {
        if (g > neutral) px[i + 1] = neutral;
        if (sepData && r > 112 && r - g > 37 && g - b > 12) {
          sepData.data.set([226, 114, 58, 255], i);
          // Knock this ink out of the main plate, leaving the orange plate free to misregister.
          px[i] = 243;
          px[i + 1] = 226;
          px[i + 2] = 196;
        }
      }
    }
  }
  ink.putImageData(data, 0, 0);
  if (sepData) sep.putImageData(sepData, 0, 0);
  const resize = (sourcePlate) => {
    const px = scaled(width, sw);
    const plate = surface(px, Math.round(px * sh / sw));
    plate.getContext('2d').drawImage(sourcePlate, 0, 0, plate.width, plate.height);
    return plate;
  };
  return { ink: resize(source), orange: orange ? resize(orange) : null };
}

export async function prepareA() {
  const frames = [
    ['curtain', 'common/curtain.png', 1920],
    ['stage', 'common/nave_stage.png', 2160],
    ['down', 'common/congregation_down.png', 1920, AUDIENCE_TOP],
    ['up', 'common/congregation_up.png', 1920, AUDIENCE_TOP],
    ['ledger', 'common/ledger_blank.png', 2160],
    ['pen', 'common/ledger_pen.png', 2560],
    ['closed', 'common/lectern_closed.png', 2160],
    ['half', 'A/A05_book_half.png', 2160],
    ['open', 'common/lectern_open.png', 2160],
    ['nape', 'A/A06_nape.png', 2304],
    ['eye', 'A/A07_eye_drowsy.png', 2304],
  ];
  const plates = {};
  // Only hold one full-resolution source at a time during preparation.
  for (const [id, path, width, top] of frames) {
    const [image] = await loadImages([path], ASSETS);
    plates[id] = cropFrame(image, width, top);
  }
  const [doll] = await loadImages(['A/A02_doll_hang.png'], ASSETS);
  plates.doll = keyPlate(doll, DOLL_CROP, 480).ink;
  const [key] = await loadImages(['A/A06_key.png'], ASSETS);
  plates.key = keyPlate(key, KEY_CROP, 896, true);
  art = plates;
}

const frame = (image) => ctx.drawImage(image, 0, 0, W, H);
const fromSource = ([x, y]) => [x / 2, (y - 200) / 2];
// Absolute source-audio cues in seconds. Keep scene cuts on the editorial grid.
const CUE = {
  curtain: 0.990, curtainPull: 1.575,
  light: 3.136,
  crowd: [4.700, 5.206, 5.723],
  pen: 6.970, experiment: 7.180, underline: 8.045,
  pages: [8.810, 9.340],
  keyStarts: [10.391, 10.900, 11.413, 11.930],
  keyStops: [10.650, 11.154, 11.682, 12.196],
  hooks: [13.000, 13.495], tug: 13.980,
};
const cueHit = (t, cues, options = { attack: 0.025 }) => kick(beatAge(t / BEAT, cues.map((cue) => cue / BEAT)), options);
const SHOT_BEATS = 4; // A2-A7 each last one bar

function punchedCamera(baseZoom, strike, draw, { x = 0, y = 0, push = 0.015 } = {}) {
  // Same helper as B.js: beat punch with a negative recoil, never exposing the frame edge.
  const dx = x * strike, dy = y * strike;
  const fullZoom = Math.max(1 + 2 * Math.abs(dx) / W, 1 + 2 * Math.abs(dy) / H);
  withCamera(W / 2 - dx, H / 2 - dy, Math.max(fullZoom, baseZoom + push * strike), draw);
}

function outlinedLyric(str, x, y, size = 116, align = 'left') {
  // Same Gothic face, paper ink and 12 px rounded coal outline as drawA3 / B.js.
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

const outlinePaint = (size) => (str, x, y, align) => outlinedLyric(str, x, y, size, align);
const inkPaint = (size, color) => (str, x, y, align) => text(str, x, y, size, color, GOTHIC, align);

// Per-glyph staggered entry (and optional exit), same scheme as B.js animatedLyric.
function glyphRun(str, localBeat, x, y, paint, { start = 0, end = Infinity, align = 'left', step = 0.034, size = 116 } = {}) {
  if (localBeat < start || localBeat >= end) return;
  const glyphs = Array.from(str);
  const timing = { start, end, step };
  const lastEntry = start + (glyphs.length - 1) * step + 0.32;
  const firstExit = end - (glyphs.length - 1) * 0.007 - 0.25;
  if (localBeat >= lastEntry && localBeat <= firstExit) {
    paint(str, x, y, align);
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
    paint(glyph, 0, 0, 'center');
    ctx.restore();
  }
  ctx.restore();
}

// Fixed word positions allow the lyric to continue across the A7/B1 picture cut.
function wordLine(words, t, center, y, size, paint, until = Infinity) {
  ctx.save();
  ctx.font = `${size}px ${GOTHIC}`;
  const full = words.map(([word]) => word).join(' ');
  const left = center - ctx.measureText(full).width / 2;
  let prefix = '';
  for (const [word, cue] of words) {
    glyphRun(word, (t - cue) / BEAT, left + ctx.measureText(prefix).width, y, paint,
      { step: 0.016, size, end: (until - cue) / BEAT });
    prefix += `${word} `;
  }
  ctx.restore();
}

const KEEP_WORDS = [['Keep', 13.98], ['your', 14.20], ['eyes', 14.43], ['buttered', 14.71],
  ['till', 14.98], ['the', 15.21], ['end', 15.58]];
export function drawKeepLyric(t, until = Infinity) {
  wordLine(KEEP_WORDS, t, W / 2, 996, 116, outlinePaint(116), until);
}

// Lyrics that the voice is still singing when the picture cuts are held across the cut (absolute seconds).
const HOLD = { lights: 4.45, dont: 6.75, book: 11.2, clockwork: 13.55 };
const LIGHTS_WORDS = [['Lights', 3.66], ['on', 3.98]];
const BOOK_WORDS = [[['Oh,', 9.74], ['the', 9.83], ['book', 9.86]], [['is', 9.99], ['strange', 10.14]]];

function clipRect(x, y, w, h) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
}

// Fixed particles with continuous paths and hard edges, independent of render order.
function dust(t, [x, y, w, h], count, color, seed) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const px = x + ((i * 137.19 + seed + t * (11 + i % 5 * 6)) % w);
    const py = y + h - ((i * 83.71 + seed + t * (7 + i % 7 * 3)) % h);
    const size = 1 + i % 3;
    ctx.fillRect(px, py, size * 1.6, size);
  }
}

function drawA1(t) {
  const seam = W / 2;
  const spread = seam * (0.40 * easeOutExpo((t - CUE.curtain + 0.012) / 0.50)
    + 0.57 * easeOutExpo((t - CUE.curtainPull + 0.012) / 0.48));
  const hit = cueHit(t, [0.54, CUE.curtain, CUE.curtainPull]);
  punchedCamera(1 + 0.035 * easeInOutCubic(t / BAR), hit, () => {
    frame(art.stage);
    for (const side of [-1, 1]) {
      const left = side < 0 ? 0 : seam;
      ctx.save();
      ctx.translate(side * Math.round(spread), 0);
      clipRect(left, 0, seam, H);
      frame(art.curtain);
      wordLine([['Open', 0.54], ['the', 0.82], ['curtains', 0.99]], t,
        seam, 548, 118, inkPaint(118, GOLD_INK));
      for (let i = 0; i < 36; i++) {
        const drift = t * (16 + i % 6 * 17);
        const x = seam + side * ((i * 109.7 + drift) % seam);
        const y = 225 + (i * 29.3) % 620 + 4 * Math.sin(t * 2 + i);
        text('01/|{}.'[i % 7], x, y, 13 + i % 5, i % 7 === 0 ? GOLD : DIM_COAL);
      }
      ctx.restore();
    }
  }, { push: 0.012 });
}

function drawA2(t, { localTime }) {
  const lightsAt = CUE.light;
  const hit = cueHit(t, [lightsAt]);
  punchedCamera(1, hit, () => {
    withCamera(960, 540, 1 + 0.065 * easeInOutCubic(localTime / BAR), () => frame(art.stage));
    if (t >= lightsAt) {
      const beamBottom = 863;
      const beam = [[904, 0], [1016, 0], [1330, beamBottom], [590, beamBottom]];
      ctx.save();
      const reveal = easeOutExpo((t - lightsAt + 0.008) / 0.085);
      clipRect(0, 0, W, beamBottom * reveal);
      poly(beam, PAPER);
      ctx.beginPath();
      ctx.moveTo(...beam[0]);
      for (const p of beam.slice(1)) ctx.lineTo(...p);
      ctx.closePath();
      ctx.clip();
      dust(t, [590, 5, 740, 814], 140, '#BA9871', 33);
      ctx.restore();
    } else {
      dust(t, [540, 170, 840, 600], 46, DIM_PAPER, 33);
    }

    const pivot = [960, 56];
    const phase = TAU * localTime / (2 * BAR);
    const barAngle = Math.PI / 180 * 1.6 * Math.sin(phase);
    const angle = Math.PI / 180 * 1.35 * Math.sin(phase - 0.6);
    const scale = 0.147;
    const baseX = -DOLL_CROP[2] * scale / 2;
    const baseY = 175;
    const rotate = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    ctx.save();
    ctx.translate(...pivot);
    ctx.save();
    ctx.rotate(angle);
    ctx.drawImage(art.doll, baseX, baseY, DOLL_CROP[2] * scale, DOLL_CROP[3] * scale);
    ctx.restore();

    const barEnds = [[-85, 0], [0, 14], [85, 0]];
    line(rotate([-98, 0], barAngle), rotate([98, 0], barAngle), GOLD, 4);
    line([0, -56], rotate([0, 22], barAngle), GOLD, 2);
    for (let i = 0; i < DOLL_ANCHORS.length; i++) {
      const [sx, sy] = DOLL_ANCHORS[i];
      const origin = rotate(barEnds[i], barAngle);
      const end = rotate([baseX + (sx - DOLL_CROP[0]) * scale, baseY + (sy - DOLL_CROP[1]) * scale], angle);
      const bow = [-8, 4, 11][i];
      strokeCurve([origin, [origin[0] + bow, end[1] * 0.35], [end[0] + bow, end[1] * 0.82], end], GOLD, 2);
      ring(...origin, 4, GOLD, 1);
    }
    ctx.restore();
    if (t >= lightsAt) {
      ctx.fillStyle = PAPER;
      ctx.fillRect(615, 760, 690, 126);
      wordLine(LIGHTS_WORDS, t, 960, 856, 112, inkPaint(112, COAL), HOLD.lights);
    }
  }, { push: 0.012 });
}

function drawA3(t) {
  const [far, middle] = AUDIENCE_CUTS.map((y) => Math.round((y - AUDIENCE_TOP) / 2));
  const bands = [[middle, H], [far, middle], [0, far]];
  const raised = CUE.crowd.filter((cue) => t >= cue).length;
  const age = raised ? (t - CUE.crowd[raised - 1]) / BEAT : 0;
  const hit = raised ? kick((t - CUE.crowd[raised - 1] + 0.012) / BEAT, { attack: 0.025 }) : 0;
  // Each raised row steps the camera in with a back-out; the exposure swap itself stays a hard cut.
  const steps = raised ? raised - 1 + easeOutBack(age / 0.45, 1.2) : 0;
  const snap = raised ? spring(Math.max(0, age), 2.6, 15) : 0;
  punchedCamera(1 + steps * 0.014 + 0.005 * snap, hit, () => {
    frame(art.down);
    for (const [top, bottom] of bands.slice(0, raised)) {
      ctx.save();
      clipRect(0, top, W, bottom - top);
      frame(art.up);
      ctx.restore();
    }
    dust(t, [70, far - 62, W - 140, 485], 90, DIM_PAPER, 43);
  }, { x: 3, y: -3, push: 0.012 });
  if (t < HOLD.lights) wordLine(LIGHTS_WORDS, t, 960, 856, 112, outlinePaint(112), HOLD.lights);
  drawDontMiss(t);
}

function drawDontMiss(t) {
  const words = ["Don't", 'miss a', 'moment'];
  const cues = [5.34, 5.72, 5.98];
  for (const [i, word] of words.entries()) {
    if (t < cues[i] || t >= HOLD.dont) continue;
    // "moment" is still sung after the cut to A4, so the line is held there (see drawA4).
    glyphRun(word, (t - cues[i]) / BEAT, 118 + i * 12, 282 + i * 108, outlinePaint(116),
      { step: 0.04, end: (HOLD.dont - cues[i]) / BEAT });
  }
}

function drawA4(t, { localTime }) {
  const shotStart = t - localTime;
  const { pen: writeAt, experiment: wordAt, underline: markAt } = CUE;
  const returnAt = 7.90;
  const hit = cueHit(t, [writeAt, markAt]);
  if (t < writeAt) {
    const k = easeInOutCubic(localTime / (writeAt - shotStart));
    punchedCamera(1 + 0.06 * k, hit, () => {
      frame(art.ledger);
      dust(t, [535, 325, 560, 280], 28, DIM_PAPER, 111);
    }, { push: 0.012 });
    drawDontMiss(t);
    return;
  }

  // Keep the text fixed on the paper while translating the entire pen exposure around the nib.
  const prefix = 'Of this';
  const word = 'experiment';
  const x = 112, y = 924, size = 118;
  const lineGap = 110;
  const prefixTravel = clamp((t - writeAt + 0.025) / 0.20) * prefix.length;
  const wordTravel = clamp((t - wordAt + 0.03) / 0.65) * word.length;
  const mark = clamp((t - markAt + 0.014) / 0.20);
  ctx.font = `${size}px ${GOTHIC}`;
  const wordWidth = ctx.measureText(word).width;
  const widthAt = (value, count) => {
    ctx.save();
    ctx.font = `${size}px ${GOTHIC}`; // text() calls elsewhere change ctx.font; measure at the lyric size
    try { return widthAtRaw(value, count); } finally { ctx.restore(); }
  };
  const widthAtRaw = (value, count) => {
    const first = ctx.measureText(value.slice(0, Math.floor(count))).width;
    const next = ctx.measureText(value.slice(0, Math.floor(count) + 1)).width;
    return first + (next - first) * (count % 1);
  };
  const underline = [[x + 13, y + 30], [x + 65, y + 36], [x + wordWidth - 35, y + 19],
    [x + wordWidth + 4, y + 21]];
  let nibX = x + widthAt(word, wordTravel);
  let nibY = y + Math.sin(wordTravel * 1.6) * 3;
  if (t < wordAt) {
    const reset = easeOut((t - (wordAt - 0.085)) / 0.085);
    nibX = x + widthAt(prefix, prefixTravel) * (1 - reset);
    nibY = y - lineGap * (1 - reset);
  } else if (t >= markAt) {
    [nibX, nibY] = cubicPoint(...underline, easeInOutCubic(mark));
  } else if (t >= returnAt) {
    const reset = easeInOutCubic((t - returnAt) / (markAt - returnAt));
    nibX = x + wordWidth * (1 - reset) + 13 * reset;
    nibY = y + 30 * reset;
  }
  const zoom = 1.63;
  // Source tip near (313, 1780); the overscan keeps the moving exposure full-frame.
  const shotX = nibX - 313 / 2560 * W * zoom;
  const shotY = nibY - (1780 - 560) / 2560 * W * zoom;
  // Whole pen layer punches in on the cut to the writing exposure and on each pen event.
  const punch = 1 + 0.012 * Math.max(0, hit);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(punch, punch);
  ctx.translate(-W / 2, -H / 2);
  ctx.fillStyle = '#F4DBB3';
  ctx.fillRect(0, 0, W, H);
  if (shotX > 0) {
    // Extend the blank left paper edge, rather than exposing the moving plate's boundary.
    ctx.drawImage(art.pen, 0, 0, 1, art.pen.height, 0, shotY, shotX + 1, H * zoom);
  }
  ctx.drawImage(art.pen, shotX, shotY, W * zoom, H * zoom);
  for (let i = 0; i < 8; i++) {
    const str = '. : / ·';
    text(str, 100 + i * 12 + t * 11, 418 + i * 29, 12, DIM_PAPER);
  }
  for (const [value, count, baseline] of [[prefix, prefixTravel, y - lineGap], [word, wordTravel, y]]) {
    if (count <= 0) continue;
    ctx.save();
    clipRect(x - 5, baseline - size, widthAt(value, count) + 5, size * 1.25);
    text(value, x, baseline, size, COAL, GOTHIC);
    ctx.restore();
  }
  if (t >= markAt) {
    ctx.save();
    clipRect(x, y + 17, nibX - x + 2, 27);
    strokeCurve(underline, COAL, 3.5);
    ctx.restore();
  }
  ctx.restore();
}

function drawA5(t, { localTime }) {
  const beat = localTime / BEAT;
  const [halfAt, openAt] = CUE.pages;
  const exposure = t < halfAt ? art.closed : t < openAt ? art.half : art.open;
  const hit = cueHit(t, CUE.pages);
  const lastCut = t >= openAt ? openAt : halfAt;
  const snap = spring((t - lastCut) / BEAT, 2.6, 15);
  punchedCamera(1 + 0.025 * easeInOutCubic(beat / SHOT_BEATS) + 0.005 * snap, hit, () => {
    frame(exposure);
    dust(t, [525, 45, 870, 770], 56, DIM_PAPER, 67);
    if (t < openAt) return;

    const age = t - openAt;
    const rows = [
      { x: 494, y: 512, skew: -0.049 }, { x: 518, y: 543, skew: -0.049 },
      { x: 1035, y: 500, skew: 0.085 }, { x: 1055, y: 529, skew: 0.085 },
      { x: 1071, y: 558, skew: 0.085 },
    ];
    for (const [i, { x, y, skew }] of rows.entries()) {
      const time = Math.max(0, age - i * 0.08);
      const height = Math.max(0.11, 1 - time * 2.8);
      const str = [RULES[1], RULES[2], RULES[3], RULES[5], RULES[6]][i];
      const rise = time * (380 + i * 39);
      const shift = time * (i < 2 ? 74 + i * 33 : -103 + i * 45);
      ctx.save();
      ctx.translate(x + shift, y - rise);
      ctx.rotate(skew * height);
      if (height > 0.13) {
        ctx.scale(1, height);
        text(str, 0, 0, 15, time === 0 ? COAL : GOLD, MONO);
      } else {
        line([0, 0], [str.length * 9, 0], GOLD, 1.7);
      }
      ctx.restore();
    }
    if (t >= 9.74) {
      ctx.save();
      ctx.translate(483, 547);
      ctx.rotate(-0.045);
      ctx.font = `108px ${GOTHIC}`;
      // Lines keep the old fillText maxWidth squeeze (438 / 440 px) as a horizontal scale.
      const squeeze = (str, max) => Math.min(1, max / ctx.measureText(str).width);
      ctx.save();
      ctx.scale(squeeze('Oh, the book', 438), 1);
      wordLine([['Oh,', 9.74], ['the', 9.83], ['book', 9.86]], t,
        ctx.measureText('Oh, the book').width / 2, 0, 108, inkPaint(108, COAL));
      ctx.restore();
      ctx.save();
      ctx.translate(33, 113);
      ctx.scale(squeeze('is strange', 440), 1);
      wordLine([['is', 9.99], ['strange', 10.14]], t,
        ctx.measureText('is strange').width / 2, 0, 108, inkPaint(108, COAL));
      ctx.restore();
      ctx.restore();
    }
  }, { x: 3, y: -3, push: 0.014 });
}

function drawBookHold(t) {
  if (t >= HOLD.book) return;
  const paint = outlinePaint(108);
  wordLine(BOOK_WORDS[0], t, 400, 262, 108, paint, HOLD.book);
  wordLine(BOOK_WORDS[1], t, 390, 372, 108, paint, HOLD.book);
}

function drawA6(t, { localTime }) {
  const beatF = localTime / BEAT;
  const hit = cueHit(t, CUE.keyStops);
  const z = 1 + 0.02 * easeInOutCubic(beatF / SHOT_BEATS) + 0.011 * Math.max(0, hit);
  const cam = ([px, py]) => [W / 2 + (px - W / 2) * z, H / 2 + (py - H / 2) * z];
  ctx.drawImage(art.nape, W / 2 * (1 - z), H / 2 * (1 - z), W * z, H * z);
  const [x, y] = cam(fromSource(KEYHOLE));
  const plateWidth = W * 0.40625 * z;
  const scale = plateWidth / KEY_CROP[2];
  const left = -(KEY_CENTER[0] - KEY_CROP[0]) * scale;
  const top = -(KEY_CENTER[1] - KEY_CROP[1]) * scale;
  const height = KEY_CROP[3] * scale;
  const turns = CUE.keyStarts.reduce((sum, start, i) => sum + easeInOutCubic(
    (t - start) / (CUE.keyStops[i] - start)), 0);
  const recent = CUE.keyStops.findLast((stop) => stop <= t);
  const sinceStop = recent === undefined ? Infinity : (t - recent) / BEAT;
  const shift = Math.max(0, hit);
  // The key sticks straight out of her back, so the bow plane contains the view axis.
  // Project it physically: bow width axis u turns about the shaft; sprite y runs along
  // the shaft (depth). A slight high camera (KEY_TILT) makes the bow read as a flat
  // ellipse that thins to an edge-on bar every half turn.
  // Same 60 degree stop per beat; a short damped wobble is added only after the stop lands.
  const settle = Number.isFinite(sinceStop) ? Math.exp(-13 * sinceStop) * Math.sin(TAU * 2.2 * sinceStop) : 0;
  const phi = (turns + 0.12 * settle) * Math.PI / 3;
  const cosT = Math.cos(KEY_TILT), sinT = Math.sin(KEY_TILT);
  const ux = Math.cos(phi), uy = Math.sin(phi) * cosT;
  const shaft = plateWidth * 0.16 * sinT;
  const hx = x, hy = y + shaft;
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.strokeStyle = COAL;
  ctx.lineWidth = plateWidth * 0.045;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.lineWidth = plateWidth * 0.022;
  const half = plateWidth * 0.5;
  ctx.beginPath(); ctx.moveTo(hx - ux * half, hy - uy * half); ctx.lineTo(hx + ux * half, hy + uy * half); ctx.stroke();
  ctx.setTransform(SCALE * ux, SCALE * uy, 0, SCALE * sinT, SCALE * hx, SCALE * hy);
  ctx.drawImage(art.key.ink, left, top, plateWidth, height);
  ctx.drawImage(art.key.orange, left + 2.6 * shift, top - 1.4 * shift, plateWidth, height);
  ctx.restore();

  if (t >= 11.74) {
    ctx.save();
    ctx.font = `${72 * z}px ${GOTHIC}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 9 * z;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COAL;
    ctx.fillStyle = PAPER;
    const glyphs = Array.from('Like clockwork orange');
    const advances = glyphs.map((glyph) => ctx.measureText(glyph).width + 1.6 * z);
    const radius = 360 * z;
    const length = advances.reduce((sum, advance) => sum + advance, 0);
    const lyricCues = [11.74, 11.93, 12.19];
    let angle = -Math.PI / 2 - length / (2 * radius) + 0.055 * (t - 11.74);
    for (const [i, glyph] of glyphs.entries()) {
      const da = advances[i] / radius;
      const a = angle + da / 2;
      angle += da;
      const group = i < 5 ? 0 : i < 15 ? 1 : 2;
      const index = i - [0, 5, 15][group];
      const m = staggeredGlyph((t - lyricCues[group]) / BEAT, index, glyphs.length, {
        step: 0.017, tiltSign: i % 2 ? 1 : -1,
      });
      if (!m || m.alpha <= 0) continue;
      ctx.save();
      ctx.translate(x + radius * Math.cos(a), y + radius * Math.sin(a));
      ctx.rotate(a + Math.PI / 2);
      ctx.translate(m.x * z, m.y * z);
      ctx.rotate(m.rotation);
      ctx.scale(m.scale, m.scale);
      ctx.globalAlpha *= m.alpha;
      ctx.strokeText(glyph, 0, 0);
      ctx.fillText(glyph, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
  drawBookHold(t);
}

function drawA7(t, { localTime }) {
  const hit = cueHit(t, [...CUE.hooks, CUE.tug]);
  const contact = Math.max(...CUE.hooks.map((cue) => kick((t - cue + 0.012) / BEAT, { attack: 0.025 })));
  punchedCamera(1 + 0.06 * easeInOutCubic(localTime / BAR), Math.max(hit, contact), () => {
    frame(art.eye);
    for (const [i, anchor] of LASHES.entries()) {
      const end = fromSource(anchor);
      const origin = [end[0] + (i ? 72 : -51), -55];
      const landing = CUE.hooks[i];
      const drop = easeOutExpo((t - landing + 0.012) / 0.09);
      const settleBeats = Math.max(0, (t - landing) / BEAT);
      if (drop <= 0) continue;
      // Cord drops on the transient, then the slack rings out before a separate tug.
      const taut = t >= CUE.tug;
      const slack = (i ? -143 : 138) * (taut ? spring((t - CUE.tug) / BEAT, 2.2, 11) * 0.12
        : drop >= 0.999 ? 0.32 + 0.68 * spring(settleBeats, 1.6, 5) : 1);
      const dx = end[0] - origin[0], dy = end[1] - origin[1];
      const handles = [[origin[0] + dx / 3 + slack, origin[1] + dy / 3],
        [origin[0] + dx * 2 / 3 - slack * 0.58, origin[1] + dy * 2 / 3]];
      const cord = (s) => cubicPoint(origin, ...handles, end, s);
      ctx.beginPath();
      ctx.moveTo(...origin);
      for (let n = 1; n <= 36; n++) ctx.lineTo(...cord(drop * n / 36));
      ctx.lineWidth = 9;
      ctx.strokeStyle = COAL;
      ctx.stroke();
      ctx.lineWidth = 5.5;
      ctx.strokeStyle = GOLD;
      ctx.stroke();
      if (drop === 1) ring(...end, 7 + 6 * Math.max(0, kick(settleBeats)), GOLD, 2.5);
    }

    const scan = 470 + (localTime * 385) % 940;
    const y = 803 + Math.sin(localTime * 3.7) * 24;
    line([460, y], [1448, y], DIM_COAL, 2);
    line([scan, y - 57], [scan, y + 19], COAL, 2.5);
    text('LASH / TRACK', 477, y + 25, 24, COAL);
    text(`TENSION ${(t >= CUE.tug ? 1 : t >= CUE.hooks[1] ? 0.68 : t >= CUE.hooks[0] ? 0.44 : 0.22).toFixed(2)}`, 1434,
      y + 25, 22, COAL, MONO, 'right');
    text('01: //', scan + 8, y - 53, 21, COAL);
  }, { push: 0.018 });
  // "orange" is still sung after the cut from the key shot; hold the line here until the voice stops.
  if (t < HOLD.clockwork) {
    wordLine([['Like', 11.74], ['clockwork', 11.93], ['orange', 12.19]], t, W / 2, 996, 108,
      outlinePaint(108), HOLD.clockwork);
  }
  drawKeepLyric(t);
}

const shots = [
  { id: 'A1', start: 0, summary: '金字印在幕布上，幕布从字中间裂开', draw: drawA1 },
  { id: 'A2', start: '2.1', summary: '顶光照亮舞台中央悬吊的人偶', draw: drawA2 },
  { id: 'A3', start: '3.1', summary: '教徒的兜帽背影一排排抬头', draw: drawA3 },
  { id: 'A4', start: '4.1', summary: '记录簿特写，笔写下 experiment，划下第一道记号', draw: drawA4 },
  { id: 'A5', start: '5.1', summary: '讲经台上的书打开，书页上的字行升起变成线', draw: drawA5 },
  { id: 'A6', start: '6.1', summary: '背部发条钥匙转动', draw: drawA6 },
  { id: 'A7', start: '7.1', summary: '两根线垂下来钩住她半闭的睫毛', draw: drawA7 },
];

export default shots.map(({ id, start, summary, draw }) => scene('A', id, start, summary, draw));
