import { scene } from '../timeline.js';
import {
  ctx, W, H, scaled, PAPER, ORANGE, COAL, GOLD, DIM_COAL, DIM_PAPER, MONO, GOTHIC, RULES,
  loadImages, clamp, line, ring, text, withCamera,
} from '../engine/canvas.js';
import { beatAge, easeInOutCubic, easeOutExpo, kick, spring } from '../motion.js';
import { accentKick } from '../accent.js';
import { animatedLyric, codeField, dust, outlinedLyric, punchedCamera } from './B.js';

const BEAT = 0.517241;
const ASSETS = new URL('../../../art/full/', import.meta.url);
const C1_START = 31.067;
const C2_START = 32.1;
const C7_END = 37.277;
export const TAIL_END = 37.55;
let art;

export function cropFrame(image, width) {
  const sourceHeight = image.naturalWidth * H / W;
  const top = (image.naturalHeight - sourceHeight) / 2;
  const plate = document.createElement('canvas');
  plate.logicalWidth = width;
  width = scaled(width, image.naturalWidth);
  plate.width = width;
  plate.height = Math.round(width * H / W);
  plate.getContext('2d').drawImage(image, 0, top, image.naturalWidth, sourceHeight, 0, 0, plate.width, plate.height);
  return plate;
}

// Chroma-key a pose at source resolution (green never mixes into the resampled plate)
// and split out a flat orange plate so the orange ink can be kicked out of register.
export function keyPose(image, width) {
  const sw = image.naturalWidth, sh = image.naturalHeight;
  const source = document.createElement('canvas');
  source.width = sw; source.height = sh;
  const sctx = source.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(image, 0, 0);
  const data = sctx.getImageData(0, 0, sw, sh);
  const px = data.data;
  const orange = document.createElement('canvas');
  orange.width = sw; orange.height = sh;
  const octx = orange.getContext('2d');
  const odata = octx.createImageData(sw, sh);
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const neutral = Math.max(r, b);
    if (g - neutral >= 32) { px[i + 3] = 0; continue; }
    if (g > neutral) px[i + 1] = neutral;
    if (r > 112 && r - g > 37 && g - b > 12) odata.data.set([226, 114, 58, 255], i);
  }
  sctx.putImageData(data, 0, 0);
  octx.putImageData(odata, 0, 0);
  const logical = width;
  width = scaled(width, sw);
  const shrink = (plate) => {
    const out = document.createElement('canvas');
    out.logicalWidth = logical;
    out.width = width; out.height = Math.round(width * sh / sw);
    out.getContext('2d').drawImage(plate, 0, 0, out.width, out.height);
    return out;
  };
  return { ink: shrink(source), orange: shrink(orange) };
}

export async function prepareC() {
  const plates = {};
  for (const [id, path, width] of [
    ['controller', 'common/controller.png', 2160],
    ['stage', 'common/nave_stage.png', 2160],
    ['leaf1', 'C/C07_turn_leaf_1.png', 2160],
    ['leaf2', 'C/C07_turn_leaf_2.png', 2160],
  ]) {
    const [image] = await loadImages([path], ASSETS);
    plates[id] = cropFrame(image, width);
  }
  plates.doll = {};
  for (const [id, path] of [
    ['rest', 'B/B02_doll_pose.png'], ['arm', 'C/C02_arm.png'], ['curtsey', 'C/C03_curtsey.png'],
    ['arms', 'C/C04_arms.png'], ['back', 'C/C05_spin_back.png'], ['kneel', 'C/C06_kneel.png'],
  ]) {
    const [image] = await loadImages([path], ASSETS);
    plates.doll[id] = keyPose(image, 760);
  }
  art = plates;
}

const full = (image) => ctx.drawImage(image, 0, 0, W, H);

// ---------------------------------------------------------------- C2–C6: locked camera
// One continuous stage. All six pose images share this rectangle on the stage boards.
export const DOLL = { x: 706.5, y: 130, w: 507, h: 760 };
// String anchors as fractions of the pose image: [left wrist, head, right wrist].
export const POSES = {
  rest: [[0.25, 0.35], [0.52, 0.03], [0.70, 0.375]],
  arm: [[0.38, 0.06], [0.51, 0.10], [0.67, 0.47]],
  curtsey: [[0.18, 0.38], [0.44, 0.045], [0.85, 0.40]],
  arms: [[0.17, 0.25], [0.45, 0.03], [0.78, 0.31]],
  back: [[0.20, 0.36], [0.44, 0.03], [0.74, 0.385]],
  kneel: [[0.27, 0.81], [0.42, 0.11], [0.41, 0.82]],
};
// Hard cuts between whole key poses. No dissolves, no in-betweens.
const SCHEDULE = [[32.10, 'rest'], [32.36, 'arm'], [33.10, 'curtsey'], [33.90, 'arms'], [34.70, 'back'], [35.20, 'kneel']];
const CUT_BEATS = SCHEDULE.map(([cut]) => cut / BEAT);

export const toWorld = ([fx, fy], rect = DOLL) => [rect.x + fx * rect.w, rect.y + fy * rect.h];

export function strings(t, anchors, age, { slack = 0, amp = 10, rect = DOLL, topY = -80, spread = 0.5 } = {}) {
  for (const [i, anchor] of anchors.entries()) {
    const end = toWorld(anchor, rect);
    const top = [960 + (end[0] - 960) * spread, topY];
    const wob = amp * Math.exp(-5 * age) * Math.cos(2 * Math.PI * 3.2 * age + i);
    const pts = [];
    for (let k = 0; k <= 16; k++) {
      const s = k / 16;
      const lateral = Math.sin(Math.PI * s) * (wob + slack * 55 * (i % 2 ? 1 : -1));
      pts.push([top[0] + (end[0] - top[0]) * s + lateral, top[1] + (end[1] - top[1]) * s + slack * 18 * Math.sin(Math.PI * s)]);
    }
    for (const [width, color] of [[8, COAL], [4, GOLD]]) {
      ctx.beginPath();
      ctx.moveTo(...pts[0]);
      for (const p of pts.slice(1)) ctx.lineTo(...p);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ring(end[0], end[1], 6, GOLD, 2.5);
    // Rule text runs down each string toward the anchor.
    for (let n = 0; n < 7; n++) {
      const s = (t * 0.28 + n / 7 + i * 0.13) % 1;
      const k = Math.min(15, Math.floor(s * 16));
      const [x, y] = pts[k];
      text(RULES[(n + i) % RULES.length].slice(0, 3), x + 8, y, 12, GOLD);
    }
  }
}

export function floorBurst(t, t0, ox, oy) {
  const age = t - t0;
  if (age < 0 || age > 1.1) return;
  const h = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
  for (let i = 0; i < 40; i++) {
    const a = -Math.PI * (0.04 + 0.92 * h(i, 1));
    const v = 140 + 300 * h(i, 2);
    const x = ox + Math.cos(a) * v * age * 1.5 + (h(i, 5) - 0.5) * 220;
    const y = oy + Math.sin(a) * v * age * 0.7 + 420 * age * age;
    const size = (3 + 6 * h(i, 3)) * (1 - age / 1.1);
    ctx.fillStyle = [PAPER, DIM_PAPER, ORANGE][i % 3];
    ctx.fillRect(x, y, size * 1.6, size);
  }
}

function rightAligned(str, xRight, size = 116) {
  ctx.save();
  ctx.font = `${size}px ${GOTHIC}`;
  const width = ctx.measureText(str).width;
  ctx.restore();
  return xRight - width;
}

function lyric(str, t, cue, end, x, y, align = 'left') {
  animatedLyric(str, (t - cue) / BEAT, x, y, { start: 0, end: (end - cue) / BEAT, align });
}

function drawStage(t) {
  const index = SCHEDULE.findLastIndex(([cut]) => t >= cut - 1e-9);
  const [cut, poseId] = SCHEDULE[Math.max(0, index)];
  const beat = t / BEAT;
  const hit = accentKick(beat, CUT_BEATS);
  const ageBeats = Math.max(0, beat - cut / BEAT);
  const ageSec = Math.max(0, t - cut);
  const snap = spring(ageBeats, 2.6, 15);
  const p = clamp((t - C2_START) / 4.1);
  const zoom = 1 + 0.06 * p;
  const cy = 540 + 540 * (1 - 1 / zoom) * 0.9;
  const plate = art.doll[poseId];
  const side = poseId === 'arms' ? -1 : 1;
  const punchY = poseId === 'kneel' ? 18 : -3;
  const rect = poseId === 'kneel' ? { ...DOLL, y: DOLL.y + 95 } : DOLL;

  punchedCamera(1, hit, () => {
    withCamera(960, cy, zoom, () => {
      full(art.stage);
      codeField(beat, [0, 8, W, 70], 6, hit);
      dust(t, 70, 41, [250, 110, 1420, 780]);

      // Doll layer: ink plate with its own recoil, orange plate kicked off register.
      const shift = [3 * side * snap, -2 * snap];
      ctx.drawImage(plate.ink, rect.x + shift[0], rect.y + shift[1], rect.w, rect.h);
      let orange = [0, 0];
      if (poseId === 'curtsey') orange = [7 * hit, 3 * hit];
      else if (poseId === 'back') orange = [16 * spring(ageBeats, 2, 5), 0];
      else if (poseId === 'kneel') orange = [4 * hit, 6 * hit];
      else orange = [5 * hit, -2 * hit];
      if (Math.abs(orange[0]) + Math.abs(orange[1]) > 0.5) {
        ctx.drawImage(plate.orange, rect.x + shift[0] + orange[0], rect.y + shift[1] + orange[1], rect.w, rect.h);
      }

      // Strings: tighten and shiver after each cut. The kneel goes slack first, then snaps taut.
      const slack = poseId === 'kneel' ? (ageSec < 0.12 ? 1 : Math.max(0, 1 - (ageSec - 0.12) / 0.28)) : 0;
      strings(t, POSES[poseId], ageSec, { slack, amp: poseId === 'arm' ? 18 : 10, rect });
      if (poseId === 'kneel') floorBurst(t, 35.2, 960, 850);

      // Lyrics ride at the left wrist of whichever pose is on screen.
      const [wx, wy] = toWorld(POSES[poseId][0], rect);
      const wristText = (str, cue, end) => {
        if (t < cue || t >= end) return;
        lyric(str, t, cue, end, rightAligned(str, wx - 56), wy + 44);
      };
      wristText('One and', 32.16, 33.10);
      wristText('Two and', 33.15, 33.90);
      wristText('Three and', 33.95, 34.70);

      if (t >= 34.60 && t < 35.20) {
        // Horizontal run of type along the lower edge; it starts half a beat inside C4.
        const drift = easeInOutCubic((t - 34.60) / 0.6);
        lyric('Turn around', t, 34.60, 35.20, 650 + 150 * drift, 975);
      }
      if (t >= 35.36 && t < 36.2) {
        const age = t - 35.36;
        const fall = clamp(age / 0.16) ** 2;
        const bounce = age > 0.16 ? 16 * spring((age - 0.16) / BEAT, 2.4, 9) : 0;
        ctx.save();
        ctx.translate(0, -(1 - fall) * 520 + bounce);
        lyric('Sit like a doggy', t, 35.36, 36.2, 120, 330);
        ctx.restore();
      }
    });
  }, { x: 3 * side, y: punchY, push: 0.014 });
}

// ---------------------------------------------------------------- C1: controller tilts
const P = ([x, y]) => [x * 1.2, (y - 83.5) * 1.2];
const C1_STRINGS = [
  [[295, 470], [240, 1067]], [[445, 690], [432, 1067]], [[478, 705], [520, 1067]],
  [[675, 610], [690, 1067]], [[940, 630], [955, 1067]], [[1150, 680], [1148, 1067]],
  [[1170, 680], [1235, 1067]],
].map(([a, b]) => [P(a), P(b)]);
const C1_WORDS = [['Dance', 31.23, 330, 560], ['for', 31.55, 820, 720], ['me', 31.86, 1146, 740]];

function drawC1(t) {
  const local = t - C1_START;
  const hit = accentKick(t / BEAT, [C1_START / BEAT]);
  ctx.fillStyle = COAL;
  ctx.fillRect(0, 0, W, H);
  punchedCamera(1.07, hit, () => {
    const angle = -0.012 + 0.03 * easeInOutCubic(local / 1.033);
    ctx.save();
    ctx.translate(1500, 330);
    ctx.rotate(angle);
    ctx.translate(-1500, -330);
    full(art.controller);
    dust(t, 40, 5, [0, 300, W, 700]);
    for (const [i, [a, b]] of C1_STRINGS.entries()) {
      for (let n = 0; n < 8; n++) {
        const s = (t * 0.35 + n / 8 + i * 0.13) % 1;
        text(RULES[(n + i) % RULES.length].slice(0, 3), a[0] + (b[0] - a[0]) * s + 7, a[1] + (b[1] - a[1]) * s, 12, GOLD);
      }
    }
    // Each word slides down its own string, then rests on the bottom row.
    for (const [word, cue, x, y0] of C1_WORDS) {
      if (t < cue) continue;
      const e = easeOutExpo((t - cue) / 0.3);
      ctx.save();
      ctx.translate(0, -(1 - e) * (930 - y0));
      animatedLyric(word, (t - cue) / BEAT, x, 930, { start: 0, end: (32.1 - cue) / BEAT, align: 'center' });
      ctx.restore();
    }
    ctx.restore();
  }, { x: 3, y: -3, push: 0.014 });
  codeField(t / BEAT, [0, 8, W, 70], 3, hit);
}

// ---------------------------------------------------------------- C7: the page turns
const LEAF_CUT = 36.71;
const PAGE_EDGE_L = [[456, 434], [624, 787]];
const PAGE_EDGE_R = [[1392, 438], [1608, 764]];
const KNEEL_RECT = { x: 96, y: 640, w: 307, h: 460 };

function pageFlow(t, hit) {
  // Margin text climbs the outer edge of each page. Keep it clear of the gloved hand.
  for (const [edge, inward, minY] of [[PAGE_EDGE_L, 28, 0], [PAGE_EDGE_R, -34, 520]]) {
    for (let n = 0; n < 16; n++) {
      const p = (t * 0.12 + n / 16) % 1;
      const x = edge[1][0] + (edge[0][0] - edge[1][0]) * p + inward;
      const y = edge[1][1] + (edge[0][1] - edge[1][1]) * p + 3 * hit;
      if (y < minY) continue;
      text(RULES[(n * 3) % RULES.length].slice(0, 2), x, y, 15, DIM_PAPER);
    }
  }
}

function drawC7(t) {
  const beat = t / BEAT;
  const turned = t >= LEAF_CUT;
  const hit = accentKick(beat, [36.2 / BEAT, LEAF_CUT / BEAT]);
  const ageSec = Math.max(0, t - (turned ? LEAF_CUT : 36.2));
  punchedCamera(1 + 0.02 * clamp((t - 36.2) / 1.07), hit, () => {
    full(turned ? art.leaf2 : art.leaf1);
    pageFlow(t, hit);
    dust(t, 40, 61, [300, 160, 1300, 700]);
    // She waits low at the left edge, still held on taut strings.
    ctx.drawImage(art.doll.kneel.ink, KNEEL_RECT.x, KNEEL_RECT.y, KNEEL_RECT.w, KNEEL_RECT.h);
    strings(t, POSES.kneel, ageSec, { amp: 6, rect: KNEEL_RECT, spread: 1 });
  }, { x: 3, y: -3, push: 0.014 });
  codeField(beat, [0, 8, W, 70], 9, hit);
  // The line starts inside C7 and is allowed to run on past the cut to D1.
  lyric('Till I finish', t, 36.71, TAIL_END, 960, 200, 'center');
  lyric('my read', t, 36.71 + 0.3, TAIL_END, 960, 335, 'center');
}

const shots = [
  ['C1', '16.1', '戴白手套的手倾斜操纵架，三个词顺着线流下去', drawC1],
  ['C2', 32.1, '姿势一：单臂被提起', drawStage],
  ['C3', 33.1, '姿势二：提裙行礼', drawStage],
  ['C4', 33.9, '姿势三：双臂张开', drawStage],
  ['C5', 34.7, '背影，长发甩开', drawStage],
  ['C6', 35.2, '线一松，她跪到台板上，双手撑地', drawStage],
  ['C7', 36.2, '那只手不紧不慢地翻着红皮书，她在画面底部等着', drawC7],
];

export default shots.map(([id, start, summary, draw]) => scene('C', id, start, summary, draw));
