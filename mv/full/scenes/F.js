import { scene } from '../timeline.js';
import {
  ctx, W, H, SCALE, PAPER, ORANGE, COAL, GOLD, DIM_COAL, DIM_PAPER, MONO,
  loadImages, clamp, text, withCamera,
} from '../engine/canvas.js';
import { beatAge, easeInOutCubic, easeOutExpo, kick, spring } from '../motion.js';
import { accentKick } from '../accent.js';
import { codeField, punchedCamera } from './B.js';
import { cropFrame, keyPose, strings } from './C.js';
import { BEAT, bt, hash, term } from './E.js';

const ASSETS = new URL('../../../art/full/', import.meta.url);
let art;

export async function prepareF() {
  const plates = {};
  const [shaft] = await loadImages(['common/shaft_shelves.png'], ASSETS);
  plates.shaft = document.createElement('canvas');
  plates.shaft.width = 1920 * SCALE; plates.shaft.height = 2880 * SCALE;
  plates.shaft.getContext('2d').drawImage(shaft, 0, 0, plates.shaft.width, plates.shaft.height);
  for (const [id, path] of [
    ['soil', 'common/shaft_soil.png'], ['toe', 'F/F05_toe_gap.png'], ['bench1', 'F/F08_bench_arrival_1.png'],
    ['bench2', 'F/F08_bench_arrival_2.png'], ['offer1', 'F/F09_offer_wrist_1.png'], ['offer2', 'F/F09_offer_wrist_2.png'],
  ]) {
    const [image] = await loadImages([path], ASSETS);
    plates[id] = cropFrame(image, 2160);
  }
  plates.doll = {};
  for (const [id, path, width] of [
    ['leap', 'E/E08_leap.png', 760], ['slack', 'F/F04_rebound_1.png', 1000], ['taut', 'F/F04_rebound_2.png', 1000],
    ['right', 'F/F06_chest_right.png', 1000], ['left', 'F/F07_head_left.png', 1000],
    ['face1', 'F/F02_fall_face_1.png', 1920], ['face2', 'F/F02_fall_face_2.png', 1920],
  ]) {
    const [image] = await loadImages([path], ASSETS);
    plates.doll[id] = keyPose(image, width);
  }
  art = plates;
}

const F1 = bt(35), F2 = bt(36), F3 = bt(37), F4 = bt(38), F5 = bt(39), F6 = bt(39, 3), F7 = bt(40, 3), F8 = bt(41, 3), F9 = bt(43);
const ANC = {
  slack: [[0.19, 0.44], [0.38, 0.07], [0.76, 0.43]],
  taut: [[0.15, 0.04], [0.53, 0.06], [0.86, 0.04]],
  right: [[0.17, 0.43], [0.44, 0.06], [0.91, 0.33]],
  left: [[0.12, 0.41], [0.34, 0.06], [0.74, 0.43]],
  leap: [[0.08, 0.5], [0.58, 0.06], [0.92, 0.62]],
};

// ---------------------------------------------------------------- shared pieces
// The shaft is one tall plate we fall down. Offset = how far down it we have travelled.
function shaftAt(offset) {
  const o = clamp(offset, 0, 1800);
  ctx.drawImage(art.shaft, 0, -o, 1920, 2880);
}

// Dust runs the other way: it streaks downward past the camera at its own speed.
function fallDust(t, count, seed, speed) {
  for (let i = 0; i < count; i++) {
    const x = (hash(i, seed) * W + Math.sin(t * 0.7 + i) * 14) % W;
    const y = ((hash(i, seed + 1) * H) + t * speed * (0.5 + hash(i, seed + 2))) % H;
    ctx.fillStyle = i % 6 === 0 ? GOLD : i % 3 === 0 ? PAPER : DIM_COAL;
    ctx.fillRect(x, y, 2 + (i % 3), 5 + (i % 4) * 4);
  }
}

// One word in a terminal box. Sizes and positions are given per word for the staggered/stair layouts.
function termWord(word, t, at, x, y, size, end = Infinity) {
  if (t < at || t >= end) return;
  ctx.save();
  ctx.font = `${size}px ${MONO}`;
  const str = word;
  const w = ctx.measureText(str).width;
  ctx.fillStyle = COAL; ctx.fillRect(x - 12, y - size, w + 24, size * 1.45);
  ctx.fillStyle = ORANGE; ctx.fillRect(x - 12, y - size, 5, size * 1.45);
  text(str, x, y, size, ORANGE, MONO);
  ctx.restore();
}

const DOWN1 = [['Down,', 71.63], ['down,', 71.92], ['and', 72.2], ['down', 72.42], ['I', 72.61], ['go', 72.93]];
const TOUGH = [['I', 73.26], ['tell', 73.45], ['myself', 73.63], ['I\'m', 74.25], ['a', 74.4], ['tough', 74.5], ['girl', 75.01]];
const DOWN2 = [['Down,', 75.53], ['down,', 75.93], ['and', 76.05], ['down', 76.4], ['I', 76.73], ['go', 77.08]];
const NEVER = [['I', 77.33], ['could', 77.6], ['never,', 77.87], ['ever,', 78.12], ['ever', 78.38], ['touch', 79.28], ['the', 79.58], ['soil', 79.75]];
const HEART = [['My', 80.18], ['heart', 80.7], ['goes', 81.22], ['right', 81.73]];
const HEAD = [['My', 82.3], ['head', 82.76], ['goes', 83.28], ['left', 83.8]];
const BED = [['And', 84.32], ['end', 84.85], ['up', 85.35], ['on', 85.9], ['your', 86.42], ['bed', 86.67]];
export const MARIONETTE = [['Sure,', 88.7], ['I\'ll', 88.98], ['be', 89.15], ['your', 89.45], ['marionette', 89.72]];

// ---------------------------------------------------------------- F1: she is falling, the shaft scrolls up
function drawF1(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [F1 / BEAT]);
  const age = t - F1;
  punchedCamera(1, hit, () => {
    shaftAt(200 * age);
    fallDust(t, 70, 5, 520);
    const rect = { x: 690 + 8 * Math.sin(age * 3.1), y: 150 + 12 * Math.sin(age * 2.3), w: 540, h: 810 };
    ctx.drawImage(art.doll.leap.ink, rect.x, rect.y, rect.w, rect.h);
    ctx.drawImage(art.doll.leap.orange, rect.x + 8 * hit, rect.y, rect.w, rect.h);
    strings(t, ANC.leap, age, { slack: 0.3, amp: 16, rect, topY: -300 });
  }, { x: 2, y: 5, push: 0.01 });
  codeField(beat, [0, 8, W, 70], 23, hit);
  term([['So', 70.83], ['I', 71.15], ['leaped', 71.38]], t, 110, 1000, { size: 52, end: 71.85 });
  DOWN1.slice(0, 4).forEach(([word, at], i) => {
    const sink = 60 * Math.min(1, (t - at) * 2.2);
    termWord(word, t, at, 1150 + i * 70, 250 + i * 150 + sink, 64);
  });
}

// ---------------------------------------------------------------- F2: face, hairline crack widens
const F2_CRACK = bt(36, 3);

function drawF2(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [F2 / BEAT, F2_CRACK / BEAT]);
  const age = t - F2;
  const plate = t >= F2_CRACK ? art.doll.face2 : art.doll.face1;
  const cut = t >= F2_CRACK ? F2_CRACK : F2;
  const snap = spring((t - cut) / BEAT, 2.6, 15);
  punchedCamera(1.0, hit, () => {
    shaftAt(200 * (t - F1));
    fallDust(t, 60, 9, 600);
    withCamera(960, 540, 1.02 + 0.03 * clamp(age / 2), () => {
      ctx.drawImage(plate.ink, -0 + 4 * snap, -100 - 3 * snap, 1920, 1280);
      ctx.drawImage(plate.orange, 10 * hit, -100, 1920, 1280);
    });
  }, { x: 2, y: 4, push: 0.012 });
  codeField(beat, [0, 8, W, 70], 29, hit);
  term([['Down,', 71.63], ['down,', 71.92], ['and', 72.2], ['down', 72.42], ['I', 72.61], ['go', 72.93]], t, 110, 220, { size: 44, end: 73.2 });
  // The line rolls along the bottom edge and keeps rolling into F3.
  tough(t);
}

function tough(t) {
  if (t >= 75.45) return;
  term(TOUGH, t, 1700, 1036, { size: 46, align: 'right', dx: -Math.max(0, t - 73.26) * 40 });
}

// ---------------------------------------------------------------- F3: dive at the soil
function drawF3(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [F3 / BEAT]);
  const age = t - F3;
  const dive = Math.pow(clamp(age / 2.0), 2.1);
  punchedCamera(1, hit, () => {
    withCamera(960, 760, 1.0 + 0.85 * dive, () => {
      ctx.drawImage(art.soil, -120, -67, 2160, 1215);
    });
    // Foreground dust and spines race past faster than the plate.
    fallDust(t, 80, 14, 900 + 900 * dive);
  }, { x: 2, y: 4, push: 0.012 });
  codeField(beat, [0, 8, W, 70], 31, hit);
  tough(t);
  stairs(t);
}

// Descending sizes, stepping down and right.
function stairs(t) {
  if (t >= 77.3) return;
  const sizes = [92, 78, 64, 54, 44, 38];
  let x = 150, y = 300;
  DOWN2.forEach(([word, at], i) => {
    const size = sizes[i];
    termWord(word, t, at, x, y, size);
    x += word.length * size * 0.6 + 40;
    y += size * 1.7;
    if (i === 3) { x = 640; }
  });
}

// ---------------------------------------------------------------- F4: three catches, each smaller
const EVER = [77.87, 78.12, 78.38];

function drawF4(t) {
  const beat = t / BEAT;
  const cuts = EVER.filter((c) => t >= c);
  const idx = cuts.length;
  const id = idx === 0 ? 'slack' : idx % 2 === 1 ? 'taut' : 'slack';
  const cut = idx === 0 ? F4 : EVER[idx - 1];
  const hit = accentKick(beat, [F4 / BEAT, ...EVER.map((c) => c / BEAT)]);
  const age = t - cut;
  const amp = [0, 60, 34, 14][idx];
  const bounce = amp * spring(age / BEAT, 2.4, 9);
  const rect = { x: 660, y: 90 + (idx === 0 ? 0 : -bounce * 0.0) + (idx ? -bounce : 8 * Math.sin(age * 3)), w: 600, h: 900 };
  punchedCamera(1, hit, () => {
    shaftAt(1400 + 60 * (t - F4));
    fallDust(t, 70, 17, idx ? 160 : 700);
    const plate = art.doll[id];
    ctx.drawImage(plate.ink, rect.x, rect.y, rect.w, rect.h);
    ctx.drawImage(plate.orange, rect.x + (idx ? 8 * hit : 0), rect.y, rect.w, rect.h);
    strings(t, ANC[id], age, { slack: id === 'slack' ? 1 : 0, amp: id === 'taut' ? 14 : 6, rect, topY: -200 });
  }, { x: 2, y: idx ? 8 : 3, push: 0.012 });
  codeField(beat, [0, 8, W, 70], 37, hit);
  stairs(t);
  if (t >= 76.7 && t < 77.3) { /* "I go" lands as the stairs finish */ }
  NEVER.slice(0, 5).forEach(([word, at], i) => {
    termWord(word, t, at, 130 + i * 20, 620 + i * 90, 56);
  });
  touchTail(t);
}

// "touch the soil" waits at the edge and survives into F5.
function touchTail(t) {
  term([['touch', 79.28], ['the', 79.58], ['soil', 79.75]], t, 1780, 1000, { size: 52, align: 'right', end: 80.6, prompt: '' });
}

// ---------------------------------------------------------------- F5: toe above the soil
function drawF5(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [F5 / BEAT]);
  const age = t - F5;
  punchedCamera(1, hit, () => {
    ctx.drawImage(art.toe, -120, -67, 2160, 1215);
    // The upper part hangs and sways on its strings; the soil stays put.
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, 940); ctx.clip();
    ctx.translate(960, -300);
    ctx.rotate(0.006 * Math.sin(age * 3.4) * Math.exp(-age * 0.3));
    ctx.translate(-960, 300);
    ctx.drawImage(art.toe, -120, -67, 2160, 1215);
    ctx.restore();
    fallDust(t, 40, 22, 60);
  }, { x: 2, y: 3, push: 0.008 });
  codeField(beat, [0, 8, W, 70], 41, hit);
  touchTail(t);
}

// ---------------------------------------------------------------- F6/F7: pulled right, then left
function sideShot(t, start, id, side, words, seed, endHold, lead = 'taut') {
  const beat = t / BEAT;
  const hit = accentKick(beat, [start / BEAT, (start + BEAT) / BEAT]);
  const second = t >= start + BEAT;
  const age = t - start;
  const sx = second ? side * 46 * spring((t - start - BEAT) / BEAT, 2.2, 7) : 0;
  const rect = { x: 660 + sx, y: 80 + 6 * Math.sin(age * 4), w: 600, h: 900 };
  const poseId = second ? id : lead;
  punchedCamera(1, hit, () => {
    shaftAt(1380 + 60 * age + (id === 'left' ? 140 : 0));
    fallDust(t, 70, seed, 260);
    const plate = art.doll[poseId];
    ctx.drawImage(plate.ink, rect.x, rect.y, rect.w, rect.h);
    ctx.drawImage(plate.orange, rect.x + (second ? -side * 10 * hit : 0), rect.y, rect.w, rect.h);
    strings(t, ANC[poseId], age, { slack: 0, amp: 12 + (second ? 14 : 0), rect, topY: -200, spread: 0.7 });
  }, { x: 2, y: 3, push: 0.012 });
  codeField(beat, [0, 8, W, 70], seed, hit);
  const align = side > 0 ? 'right' : 'left';
  const x = side > 0 ? 1780 : 140;
  term(words, t, x, 640, { size: 66, align, end: endHold, dx: side * -Math.max(0, 0.45 - (t - words[0][1])) * 400 });
}

const drawF6 = (t) => { sideShot(t, F6, 'right', 1, HEART, 43, 82.2); touchTail(t); };
const drawF7 = (t) => { sideShot(t, F7, 'left', -1, HEAD, 47, 84.2, 'left'); };

// ---------------------------------------------------------------- F8: laid on the bench
const F8_FLAT = bt(42);

function drawF8(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [F8 / BEAT, F8_FLAT / BEAT]);
  const age = t - F8;
  const flat = t >= F8_FLAT;
  punchedCamera(1, hit, () => {
    withCamera(960, 790, 1.0 + 0.22 * easeInOutCubic(clamp(age / 3.0)), () => {
      ctx.drawImage(flat ? art.bench2 : art.bench1, -120, -67, 2160, 1215);
    });
    // Near dust drifts sideways faster than the far dust.
    for (let i = 0; i < 60; i++) {
      const near = i % 3 === 0;
      const x = (hash(i, 3) * W + t * (near ? 70 : 24)) % W;
      const y = 300 + hash(i, 4) * 700 + Math.sin(t * 0.8 + i) * 9;
      ctx.fillStyle = near ? PAPER : DIM_COAL;
      ctx.fillRect(x, y, near ? 5 : 3, 2);
    }
  }, { x: 3, y: flat ? 5 : 0, push: 0.01 });
  codeField(beat, [0, 8, W, 70], 53, hit);
  headTail(t);
  const bed = BED.filter(([, at]) => at >= 84.3);
  term(bed, t, 110, 1000, { size: 54 });
}

// "My head goes left" crosses the F7 → F8 cut.
function headTail(t) {
  if (t < 82.3 || t >= 84.25 || t < F8) return;
  term(HEAD, t, 140, 640, { size: 66, end: 84.25 });
}

// ---------------------------------------------------------------- F9: she offers her wrist
const F9_OFFER = bt(43, 3);

function drawF9(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [F9 / BEAT, F9_OFFER / BEAT]);
  const offered = t >= F9_OFFER;
  const age = t - F9;
  punchedCamera(1, hit, () => {
    withCamera(960, 620, 1.0 + 0.06 * clamp(age / 2), () => {
      ctx.drawImage(offered ? art.offer2 : art.offer1, -120, -67, 2160, 1215);
      // Even after the music thins, the thread tip and dust keep moving.
      const sway = Math.sin(t * 2.1) * 6;
      ctx.beginPath();
      ctx.moveTo(1010 + sway, -40);
      for (let s = 1; s <= 12; s++) ctx.lineTo(1010 + sway * (1 - s / 12) - s * 6, -40 + s * 48 + Math.sin(s + t * 3) * 3);
      ctx.strokeStyle = COAL; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 3.5; ctx.stroke();
    });
    for (let i = 0; i < 50; i++) {
      const x = (hash(i, 7) * W + t * 12) % W;
      const y = (hash(i, 8) * H - t * 10 * (0.5 + hash(i, 9)) + H * 4) % H;
      ctx.fillStyle = i % 5 === 0 ? PAPER : DIM_COAL;
      ctx.fillRect(x, y, 3, 3);
    }
  }, { x: 2, y: offered ? 4 : 0, push: 0.01 });
  codeField(beat, [0, 8, W, 70], 59, hit);
  term(MARIONETTE, t, 110, 1000, { size: 56 });
}

function bedTail(t) {
  if (t >= 88.6) return;
  term(BED, t, 110, 1000, { size: 54, end: 88.6 });
}

const shots = [
  ['F1', F1, '书脊上卷，尘屑相反速度掠过；线在后方越放越长', drawF1],
  ['F2', F2, '她的脸出现细裂，裂纹随一拍扩大，发束上扬', drawF2],
  ['F3', F3, '俯冲推近土斑，书脊、尘埃分不同速度', drawF3],
  ['F4', F4, '线松坠落→绷紧受力，三个 ever 对应三次回弹', drawF4],
  ['F5', F5, '鞋尖距土一掌，保留黑缝', drawF5],
  ['F6', F6, '胸向右，线张力带出小幅横踢', drawF6],
  ['F7', F7, '头向左，颈关节错位', drawF7],
  ['F8', F8, '被拖到台边，放平在工作台上', drawF8],
  ['F9', F9, '俯拍躺姿，轻笑着扣腕伸出', drawF9],
];

export default shots.map(([id, start, summary, draw]) => scene('F', id, start, summary, draw));
