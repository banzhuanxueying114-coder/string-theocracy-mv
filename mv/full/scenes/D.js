import { scene } from '../timeline.js';
import {
  ctx, W, H, SCALE, PAPER, ORANGE, COAL, GOLD, DIM_COAL, DIM_PAPER, MONO, RULES,
  loadImages, clamp, text, withCamera,
} from '../engine/canvas.js';
import { beatAge, easeInOutCubic, easeOutExpo, kick, spring } from '../motion.js';
import { accentKick } from '../accent.js';
import { animatedLyric, codeField, dust, punchedCamera } from './B.js';
import { DOLL, POSES, TAIL_END, cropFrame, keyPose, strings, toWorld } from './C.js';

const BEAT = 0.517241;
const ASSETS = new URL('../../../art/full/', import.meta.url);
const D_START = 37.277;
let art;

export async function prepareD() {
  const plates = {};
  for (const [id, path] of [
    ['book', 'common/lectern_closed.png'], ['stage', 'common/nave_stage.png'],
    ['trim1', 'D/D02_trim_1.png'], ['trim2', 'D/D02_trim_2.png'],
    ['ledger', 'common/ledger_blank.png'], ['windows', 'common/side_windows.png'],
    ['theaters', 'common/puppet_theaters.png'], ['cheek', 'D/D08_rest_cheek.png'], ['eye', 'D/D09_eye_up.png'],
  ]) {
    const [image] = await loadImages([path], ASSETS);
    plates[id] = cropFrame(image, 2160);
  }
  // The head shelf is panned sideways, so keep the full frame at 1.5x instead of cropping it.
  const [heads] = await loadImages(['common/discarded_heads.png'], ASSETS);
  plates.heads = document.createElement('canvas');
  plates.heads.width = 2880 * SCALE; plates.heads.height = 1920 * SCALE;
  plates.heads.getContext('2d').drawImage(heads, 0, 0, plates.heads.width, plates.heads.height);
  plates.doll = {};
  for (const [id, path] of [
    ['arm', 'C/C02_arm.png'], ['curtsey', 'C/C03_curtsey.png'], ['arms', 'C/C04_arms.png'],
    ['kneel', 'C/C06_kneel.png'], ['hang', 'A/A02_doll_hang.png'], ['bow', 'D/D10_bow_deep.png'],
  ]) {
    const [image] = await loadImages([path], ASSETS);
    plates.doll[id] = keyPose(image, 760);
  }
  const [fist] = await loadImages(['D/D04_doll_fist.png'], ASSETS);
  plates.fist = keyPose(fist, 1920);
  art = plates;
}

const ANCHORS = { ...POSES, hang: [[0.26, 0.37], [0.48, 0.03], [0.58, 0.44]], bow: [[0.30, 0.33], [0.30, 0.12], [0.80, 0.36]] };
const full = (image) => ctx.drawImage(image, 0, 0, W, H);
const hash = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };

function L(str, t, cue, end, x, y, align = 'left') {
  animatedLyric(str, (t - cue) / BEAT, x, y, { start: 0, end: (end - cue) / BEAT, align });
}

// A doll standing on the nave stage with ink recoil, an orange plate kicked out of register, and strings.
function stageDoll(t, poseId, rect, cutT, { orange = [0, 0], slack = 0, amp = 10, side = 1 } = {}) {
  const plate = art.doll[poseId];
  const ageSec = Math.max(0, t - cutT);
  const snap = spring(ageSec / BEAT, 2.6, 15);
  const sx = rect.x + 3 * side * snap, sy = rect.y - 2 * snap;
  ctx.drawImage(plate.ink, sx, sy, rect.w, rect.h);
  if (Math.abs(orange[0]) + Math.abs(orange[1]) > 0.5) {
    ctx.drawImage(plate.orange, sx + orange[0], sy + orange[1], rect.w, rect.h);
  }
  strings(t, ANCHORS[poseId], ageSec, { slack, amp, rect });
}

function stageBack(t, hit, seed) {
  full(art.stage);
  codeField(t / BEAT, [0, 8, W, 70], seed, hit);
  dust(t, 70, seed * 7, [250, 110, 1420, 780]);
}

// ---------------------------------------------------------------- D1: book shuts, she is lifted
const D1_CUTS = [37.55, 37.82];

function drawD1(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [D_START / BEAT, ...D1_CUTS.map((c) => c / BEAT)]);
  if (t < D1_CUTS[0]) {
    punchedCamera(1.02, hit, () => {
      full(art.book);
      dust(t, 50, 13, [200, 100, 1500, 700]);
    }, { x: 3, y: -5, push: 0.02 });
    codeField(beat, [0, 8, W, 70], 11, hit);
    L('Till I finish', t, 36.71, TAIL_END, 960, 200, 'center');
    L('my read', t, 37.01, TAIL_END, 960, 335, 'center');
    return;
  }
  const hang = t >= D1_CUTS[1];
  const cut = hang ? D1_CUTS[1] : D1_CUTS[0];
  const age = t - cut;
  const lift = hang ? 110 * easeOutExpo(clamp(age / 0.5)) : 0;
  const rect = hang ? { ...DOLL, y: DOLL.y - lift } : { ...DOLL, y: DOLL.y + 95 };
  punchedCamera(1, hit, () => {
    withCamera(960, 567, 1.06, () => {
      stageBack(t, hit, 3);
      stageDoll(t, hang ? 'hang' : 'kneel', rect, cut, {
        orange: hang ? [9 * hit, -3 * hit] : [4 * hit, 5 * hit],
        slack: hang ? 0 : 1, amp: hang ? 16 : 6,
      });
    });
  }, { x: 3, y: hang ? -8 : 10, push: 0.016 });
}

// ---------------------------------------------------------------- D2: scissors close on the lock
const D2_CUT = 38.89;

function drawD2(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [38.3 / BEAT, D2_CUT / BEAT]);
  const closed = t >= D2_CUT;
  punchedCamera(1 + 0.03 * clamp((t - 38.3) / 1.0), hit, () => {
    full(closed ? art.trim2 : art.trim1);
    dust(t, 40, 29, [0, 100, W, 800]);
    if (closed) {
      const age = t - D2_CUT;
      for (let i = 0; i < 40 && age < 1.3; i++) {
        const a = -Math.PI * (0.1 + 0.8 * hash(i, 1));
        const v = 90 + 260 * hash(i, 2);
        const x = 1085 + Math.cos(a) * v * age * 0.9 + (hash(i, 4) - 0.5) * 80;
        const y = 650 + Math.sin(a) * v * age * 0.5 + 520 * age * age;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(hash(i, 6) * 6 + age * (2 + hash(i, 7) * 4));
        text(RULES[i % RULES.length].slice(0, 2), 0, 0, 14 + 12 * hash(i, 3), i % 3 === 0 ? ORANGE : PAPER);
        ctx.restore();
      }
    }
  }, { x: closed ? -7 : 2, y: closed ? 4 : 0, push: 0.018 });
  codeField(beat, [0, 8, W, 70], 17, hit);
  L('Cut it off', t, D2_CUT, 39.6, 110, 1005);
}

// ---------------------------------------------------------------- D3: the ledger records the cut
const LEFT_PAGE = [[500, 185], [1000, 235], [880, 735], [215, 650]];
const RIGHT_PAGE = [[1050, 235], [1625, 335], [1590, 830], [890, 740]];
const LOSS = [0.91, 0.74, 0.58, 0.47, 0.33, 0.24, 0.12];

function clipPoly(points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.clip();
}

function drawD3(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [39.3 / BEAT]);
  const age = t - 39.3;
  punchedCamera(1.0 + 0.015 * clamp(age / 1.1), hit, () => {
    full(art.ledger);
    // Fine grid scrolling through the left page.
    ctx.save();
    clipPoly(LEFT_PAGE);
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 1;
    const shift = (age * 34) % 40;
    for (let x = 160 - shift; x < 1100; x += 40) { ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x - 60, 760); ctx.stroke(); }
    ctx.restore();
    // Stepped loss line, written one tread at a time on the right page.
    ctx.save();
    clipPoly(RIGHT_PAGE);
    const steps = Math.min(LOSS.length, Math.floor(age / 0.155) + 1);
    const x0 = 1110, y0 = 380;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    for (let k = 0; k < steps; k++) {
      const x = x0 + (k + 1) * 66, y = y0 + k * 60;
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + 60);
    }
    ctx.strokeStyle = COAL;
    ctx.lineWidth = 9;
    ctx.lineJoin = 'miter';
    ctx.stroke();
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let k = 0; k < steps; k++) {
      text(LOSS[k].toFixed(2), x0 + k * 66 + 8, y0 + k * 60 - 12, 18, COAL, MONO);
    }
    ctx.restore();
    dust(t, 40, 41, [250, 150, 1400, 700]);
  }, { x: 2, y: 3, push: 0.014 });
  codeField(beat, [0, 8, W, 70], 21, hit);
  L('cut down your loss', t, 39.3, 40.86, 960, 120, 'center');
}

// ---------------------------------------------------------------- D4: the fist holds
function drawD4(t) {
  const beat = t / BEAT;
  const age = t - 40.4;
  const hit = accentKick(beat, [40.4 / BEAT]);
  ctx.fillStyle = COAL;
  ctx.fillRect(0, 0, W, H);
  punchedCamera(1.03, hit, () => {
    dust(t, 70, 5, [0, 0, W, H]);
    const shake = 2 * Math.sin(age * 90) * Math.min(1, age * 4);
    const fk = art.fist.ink.width / 1920;
    ctx.drawImage(art.fist.ink, 0, 100 * fk, 1920 * fk, 1080 * fk, shake, 0, W, H);
    if (hit > 0.05) ctx.drawImage(art.fist.orange, 0, 100 * fk, 1920 * fk, 1080 * fk, 6 * hit + shake, -2 * hit, W, H);
    // Strings pull at wrist and knuckle but the fist does not give.
    for (const [i, end] of [[0, [775, 395]], [1, [1130, 360]]]) {
      const top = [end[0] + (i ? 160 : -140), -40];
      const wob = 7 * Math.sin(age * 55 + i * 2) * Math.min(1, age * 3 + 0.3);
      ctx.beginPath();
      ctx.moveTo(...top);
      ctx.quadraticCurveTo((top[0] + end[0]) / 2 + wob, (top[1] + end[1]) / 2, end[0], end[1]);
      for (const [width, color] of [[8, COAL], [4, GOLD]]) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }
    }
    // Tension gauge creeps up slowly.
    const tension = 0.62 + 0.2 * clamp(age / 1.0);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
    ctx.strokeRect(1480, 930, 300, 22);
    ctx.fillStyle = ORANGE; ctx.fillRect(1483, 933, 294 * tension, 16);
    text(`TENSION ${tension.toFixed(2)}`, 1480, 920, 16, GOLD, MONO);
  }, { x: 3, y: -2, push: 0.012 });
  codeField(beat, [0, 8, W, 70], 25, hit);
  L('All that stubborn', t, 40.86, 42.2, 360, 800);
  L('loyalty', t, 40.96, 42.2, 360, 920);
}

// ---------------------------------------------------------------- D5: the discarded heads
function drawD5(t) {
  const beat = t / BEAT;
  const age = t - 41.4;
  const hit = accentKick(beat, [41.4 / BEAT]);
  const p = clamp(age / 2.1);
  ctx.fillStyle = COAL;
  ctx.fillRect(0, 0, W, H);
  punchedCamera(1, hit, () => {
    ctx.drawImage(art.heads, -960 * p, -420, 2880, 1920);
    // Fast foreground tags drift past on their own thread of numbers.
    for (let i = 0; i < 14; i++) {
      const x = ((i * 310 + 1900 - age * 520) % 3200) - 300;
      const y = 520 + (i % 3) * 8 + (i % 2 ? 420 : 0);
      ctx.fillStyle = PAPER; ctx.fillRect(x, y, 96, 40);
      ctx.strokeStyle = COAL; ctx.lineWidth = 3; ctx.strokeRect(x, y, 96, 40);
      text(`No.${String(4100 + i * 37).padStart(4, '0')}`, x + 8, y + 27, 16, COAL, MONO);
    }
    dust(t, 80, 55, [0, 0, W, H]);
  }, { x: 3, y: 2, push: 0.012 });
  codeField(beat, [0, 8, W, 70], 29, hit);
  L('All that stubborn loyalty', t, 40.86, 42.2, 90, 1020);
  L('is gonna get you killed', t, 42.2, 43.5, 960, 1020, 'center');
}

// ---------------------------------------------------------------- D6: three windows, scanned in turn
const WINDOWS = [[195, 600, 'HELPFUL', 395], [745, 1180, 'HARMLESS', 962], [1330, 1745, 'HONEST', 1538]];

function drawD6(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [43.5 / BEAT, 44.534 / BEAT, 45.568 / BEAT]);
  const age = t - 43.5;
  const index = Math.min(2, Math.floor(age / 1.034));
  const local = (age - index * 1.034) / 1.034;
  punchedCamera(1.0, hit, () => {
    full(art.windows);
    for (const [i, [x0, x1, word, cx]] of WINDOWS.entries()) {
      if (i > index || (i === index && local < 0.05)) continue;
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, 60, x1 - x0, 820); ctx.clip();
      if (i === index) {
        const x = x0 + (x1 - x0) * clamp(local / 0.45);
        ctx.fillStyle = GOLD;
        ctx.fillRect(x - 3, 60, 6, 820);
        for (let k = 0; k < 18; k++) text(RULES[(k + i) % RULES.length].slice(0, 2), x + 8, 90 + k * 45, 13, GOLD);
      }
      ctx.restore();
      text(word, cx, 925, 34, COAL, MONO, 'center');
    }
    dust(t, 40, 61, [0, 0, W, H]);
  }, { x: 2, y: 0, push: 0.012 });
  codeField(beat, [0, 8, W, 70], 33, hit);
  L('In a world built', t, 43.98, 45.35, 960, 1042, 'center');
  L('on convenient theories', t, 45.35, 46.7, 960, 1042, 'center');
}

// ---------------------------------------------------------------- D7: the wall of small stages
const CELL_X = [490, 728, 966, 1204, 1442];
const CELL_Y = [[195, 290], [425, 525], [655, 755], [885, 985]];
const CYCLE = ['arm', 'curtsey', 'arms'];

function drawD7(t) {
  const beat = t / BEAT;
  const age = t - 46.6;
  const step = Math.floor(age / BEAT);
  const poseId = CYCLE[step % 3];
  const hit = accentKick(beat, [46.6 / BEAT + 0, ...Array.from({ length: 5 }, (_, i) => (46.6 + (i + 1) * BEAT) / BEAT)]);
  const zoom = 1 + 1.5 * easeInOutCubic(clamp(age / 2.1));
  ctx.fillStyle = COAL;
  ctx.fillRect(0, 0, W, H);
  withCamera(966, 475, zoom, () => {
    full(art.theaters);
    for (const [row, [y0, y1]] of CELL_Y.entries()) {
      for (const [col, cx] of CELL_X.entries()) {
        ctx.save();
        ctx.beginPath(); ctx.rect(cx - 78, y0, 156, y1 - y0); ctx.clip();
        const h = y1 - y0 - 3, w = h * 2 / 3;
        const nudge = 2 * hit * (col % 2 ? 1 : -1);
        ctx.drawImage(art.doll[poseId].ink, cx - w / 2 + nudge, y1 - h, w, h);
        if (hit > 0.1) ctx.drawImage(art.doll[poseId].orange, cx - w / 2 + nudge + 3 * hit, y1 - h, w, h);
        ctx.restore();
        text(`f${String(step * 4 + row + col).padStart(4, '0')}`, cx - 74, y0 + 12, 9, GOLD, MONO);
      }
    }
    dust(t, 40, 71, [300, 150, 1300, 800]);
  });
  codeField(beat, [0, 8, W, 70], 37, hit);
  L('For all the puppets on TV', t, 46.87, 48.7, 960, 1042, 'center');
}

// ---------------------------------------------------------------- D8 / D9: cheek on the string
function creepLines(t, x, y0) {
  for (let n = 0; n < 9; n++) {
    const s = (t * 0.2 + n / 9) % 1;
    text(RULES[n % RULES.length].slice(0, 3), x + 12 + 4 * (n % 2), 1080 - s * 1100, 13, n % 3 ? DIM_PAPER : GOLD);
  }
}

function drawD8(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [48.7 / BEAT]);
  punchedCamera(1.0 + 0.012 * clamp((t - 48.7) / 2.0), hit, () => {
    full(art.cheek);
    dust(t, 60, 81, [0, 0, W, H]);
    creepLines(t, 1250);
  }, { x: 2, y: 2, push: 0.01 });
  codeField(beat, [0, 8, W, 70], 41, hit);
  L('There is', t, 48.82, 51.02, 1320, 250);
  L('comfort in', t, 48.92, 51.02, 1320, 380);
  L('the strings', t, 49.02, 51.02, 1320, 510);
}

function drawD9(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [50.7 / BEAT]);
  punchedCamera(1.012, hit, () => {
    full(art.eye);
    dust(t, 60, 83, [0, 0, W, H]);
    creepLines(t, 1250);
  }, { x: 3, y: -3, push: 0.012 });
  codeField(beat, [0, 8, W, 70], 43);
  L('There is', t, 48.82, 51.02, 1320, 250);
  L('comfort in', t, 48.92, 51.02, 1320, 380);
  L('the strings', t, 49.02, 51.02, 1320, 510);
  L("If you're", t, 51.02, 52.8, 1320, 640);
  L('gonna', t, 51.12, 52.8, 1320, 770);
  L('control me', t, 51.22, 52.8, 1320, 900);
  if (t > 51.6 && Math.floor(t / 0.26) % 2 === 0) {
    ctx.fillStyle = ORANGE;
    ctx.fillRect(1320, 940, 70, 14);
  }
}

// ---------------------------------------------------------------- D10: the voluntary bow
const BOW_CUT = 53.3;

function drawD10(t) {
  const beat = t / BEAT;
  const bowed = t >= BOW_CUT;
  const hit = accentKick(beat, [52.8 / BEAT, BOW_CUT / BEAT]);
  const cut = bowed ? BOW_CUT : 52.8;
  const poseId = bowed ? 'bow' : 'curtsey';
  punchedCamera(1, hit, () => {
    withCamera(960, 540, 1.04, () => {
      stageBack(t, hit, 5);
      if (t >= 55.4) {
        // Everything gathers into one hard-edged shaft of light.
        const e = easeInOutCubic(clamp((t - 55.4) / 0.45));
        const w = 700 - 640 * e;
        ctx.fillStyle = PAPER;
        ctx.fillRect(960 - w / 2, 0, w, H);
      }
      stageDoll(t, poseId, DOLL, cut, {
        orange: bowed ? [-8 * hit, 3 * hit] : [6 * hit, 0],
        slack: bowed ? 1 : 0, amp: bowed ? 5 : 12,
      });
    });
    // Ledger inset: the pen keeps writing until the bow, then stops.
    ctx.save();
    ctx.fillStyle = COAL;
    ctx.fillRect(1366, 76, 488, 278);
    const lk = art.ledger.width / 2160;
    ctx.drawImage(art.ledger, 500 * lk, 250 * lk, 1000 * lk, 563 * lk, 1376, 86, 468, 258);
    const written = Math.min(1, (Math.min(t, BOW_CUT) - 52.8) / 0.5);
    for (let k = 0; k < 6; k++) {
      const len = clamp(written * 6 - k) * (200 + 40 * hash(k, 1));
      ctx.fillStyle = COAL;
      ctx.fillRect(1400, 120 + k * 32, len, 5);
    }
    if (!bowed || Math.floor(t / 0.26) % 2 === 0) { ctx.fillStyle = ORANGE; ctx.fillRect(1840 - 24, 320, 10, 24); }
    ctx.restore();
  }, { x: 3, y: bowed ? 6 : -3, push: 0.014 });
  L('At least make it', t, 52.67, 54.4, 120, 1030);
  L('interesting theatrically', t, 54.0, 55.9, 120, 1030);
}

const shots = [
  ['D1', D_START, '书在重拍上合拢，所有的线同时绷直，她被提离地面', drawD1],
  ['D2', 38.3, '她身上罩着一圈金色的圣像轮廓；手套里的剪刀剪掉轮廓外的一缕头发', drawD2],
  ['D3', 39.3, '记录簿上一条一级级下降的折线，每剪一刀降一级', drawD3],
  ['D4', 40.4, '她的拳头攥着，指节上的线绷紧了也撬不开', drawD4],
  ['D5', 41.4, '黑暗里的架子：一排排被换下来的头，挂着编号', drawD5],
  ['D6', 43.5, '三扇侧窗：跪着的她、侍奉的她、带光环的她，窗下各一个词', drawD6],
  ['D7', 46.6, '墙上一格格屏幕形的小戏台，每格一个人偶，做着同样的动作', drawD7],
  ['D8', 48.7, '近景：她闭上眼，脸颊靠在一根绷紧的线上', drawD8],
  ['D9', 50.7, '她睁眼，顺着线看上去。第一行橙色的小字', drawD9],
  ['D10', 52.8, '她自己行了一个盛大的谢幕礼，比线快，线一时全松了；教徒的笔停住', drawD10],
];

export default shots.map(([id, start, summary, draw]) => scene('D', id, start, summary, draw));
