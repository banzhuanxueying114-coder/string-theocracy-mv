import { scene } from '../timeline.js';
import {
  ctx, W, H, SCALE, PAPER, ORANGE, COAL, GOLD, DIM_COAL, DIM_PAPER, MONO, loadImages, clamp, text,
} from '../engine/canvas.js';
import { easeInOutCubic, easeOutExpo, spring } from '../motion.js';
import { codeField } from './B.js';
import { floorBurst } from './C.js';
import { BEAT } from './E.js';
import {
  ASSETS, plate, pose, raw, plateCam, drawPose, hand, handWords, glassFall, bigShard, sideDust, arcText, LAYERS,
  prepareJKL, hash,
} from './JKL.js';

let art;

export async function prepareJ() {
  await prepareJKL();
  const [ie] = await loadImages(['common/icon_empty_frame.png'], ASSETS);
  const iePlate = document.createElement('canvas');
  iePlate.width = 1200 * SCALE; iePlate.height = 1800 * SCALE;
  iePlate.getContext('2d').drawImage(ie, 0, 0, iePlate.width, iePlate.height);
  art = {
    ie: iePlate,
    ns: await plate('common/nave_stage.png'),
    nr: await plate('common/nave_reverse.png'),
    dg: await plate('common/door_closed.png'),
    j3a: await plate('J/J03_reassemble_1.png'),
    j3b: await plate('J/J03_reassemble_2.png'),
    j4: await plate('J/J04_release.png'),
    snow: await pose('J/J02_librarian_snow.png', 820),
    doll: await pose('I/I07_new_doll.png', 820),
    walk: await pose('J/J05_walk.png', 820),
    back: await pose('J/J05_look_back.png', 820),
    shears: await pose('J/J04_shears.png', 900),
  };
}

const J1 = 122.102, J2 = 124.2, J3 = 128.3, J4 = 129.3, J5 = 132.5, JEND = 136.585;
const CUT3B = J3 + 0.517;

// ---------------------------------------------------------------- J1: the window is empty, the glass falls
function drawJ1(t) {
  const u = t - J1;
  ctx.fillStyle = COAL; ctx.fillRect(0, 0, W, H);
  codeField(t / BEAT, [0, 0, W, H], 3, 0);
  const z = 1.5 - 0.42 * clamp(u / 2.1);
  const h = 1080 * z, w = h * 2 / 3;
  ctx.drawImage(art.ie, W / 2 - w / 2, H / 2 - h * 0.5 - 10 * z, w, h);
  glassFall(t, { seed: 11, t0: J1, only: 0 });
  glassFall(t, { seed: 11, t0: J1, only: 1 });
  glassFall(t, { seed: 11, t0: J1, only: 2 });
  // the last frames: big flakes sweep across and cover the frame
  if (u > 1.75) {
    const p = clamp((u - 1.75) / 0.35);
    for (let i = 0; i < 6; i++) {
      const x = -250 + (W + 500) * clamp(p * 1.25 - i * 0.07);
      bigShard(i * 3 + 1, x, 140 + i * 170 + hash(i, 4) * 60, 1.5 + hash(i, 6) * 0.8, 0.5 + i + u * 1.2);
    }
  }
}

// ---------------------------------------------------------------- J2: she stands still, the new doll comes down
const QUESTION = [[['When', 125.5], ['does', 125.95]], [['it', 126.35], ['end', 126.6]], [['for', 127.0], ['me?', 127.5]]];
function drawJ2(t) {
  const u = t - J2;
  const pan = u * 14;
  plateCam(art.ns, 960 + pan, 540, 1.04, () => {});
  glassFall(t, { seed: 21, t0: J2, only: 0 });
  // librarian: still
  const lh = 880, lw = lh * 2 / 3;
  drawPose(art.snow, 330 - pan * 0.4, 1040 - lh, lw, lh);
  // controller bar steps down twice with the new doll
  const step = t >= 127.5 ? 2 : t >= 126.6 ? 1 : 0;
  const barY = [30, 105, 175][step];
  const cx = 1420 - pan * 0.6;
  const dh = 770, dw = dh * 2 / 3, dy = barY + 150;
  const sw = step ? 0 : 0;
  drawPose(art.doll, cx - dw / 2 + sw, dy, dw, dh);
  for (const [ox, ax, ay] of [[-150, -dw * 0.34, dy + dh * 0.43], [0, 0, dy + dh * 0.07], [150, dw * 0.34, dy + dh * 0.43]]) {
    for (const [wd, c] of [[8, COAL], [4, GOLD]]) {
      ctx.beginPath(); ctx.moveTo(cx + ox, barY); ctx.lineTo(cx + ax, ay);
      ctx.strokeStyle = c; ctx.lineWidth = wd; ctx.stroke();
    }
  }
  for (const [wd, c] of [[10, COAL], [4, GOLD]]) {
    ctx.beginPath(); ctx.moveTo(cx, -30); ctx.lineTo(cx, barY); ctx.strokeStyle = c; ctx.lineWidth = wd; ctx.stroke();
  }
  ctx.fillStyle = COAL; ctx.fillRect(cx - 210, barY - 12, 420, 26);
  ctx.fillStyle = GOLD; ctx.fillRect(cx - 210, barY - 12, 420, 5);
  glassFall(t, { seed: 21, t0: J2, only: 1 });
  glassFall(t, { seed: 21, t0: J2, only: 2 });
  QUESTION.forEach((words, row) => handWords(words, t, 960, 330 + row * 135, 118, { align: 'center', until: 128.25 }));
}

// ---------------------------------------------------------------- J3: kneeling, putting the face back together
function drawJ3(t) {
  const u = t - J3;
  const second = t >= CUT3B;
  plateCam(second ? art.j3b : art.j3a, 980 + u * 22, 560, 1.03 + 0.03 * clamp(u), () => {});
  glassFall(t, { seed: 31, t0: J3, bounds: [0, 0, 300, H], only: 1 });
  glassFall(t, { seed: 33, t0: J3, bounds: [1620, 0, 300, H], only: 1 });
  glassFall(t, { seed: 35, t0: J3, bounds: [0, 0, 220, H], only: 2 });
  glassFall(t, { seed: 37, t0: J3, bounds: [1700, 0, 220, H], only: 2 });
  const shown = clamp(Math.floor((t - 128.28) / 0.1), 0, 8);
  arcText('Hm-mm-mm', 1350, 940, 560, -2.45, -0.75, 96, shown);
}

// ---------------------------------------------------------------- J4: she lets go, the shears fall
const SH_X = 190, SH_Y = 880, IMPACT = 130.1;
const DONE = [
  [[['I', 129.6], ['think', 129.85], ['I', 130.08], ['am', 130.37]], 90, 215],
  [[['done', 130.55], ['with', 131.14]], 130, 380],
  [[['everything', 131.6]], 170, 545],
];
function drawJ4(t) {
  const u = t - J4;
  const shake = t >= IMPACT ? spring(t - IMPACT, 5, 11) * 14 * (t - IMPACT < 0.5 ? 1 : 0) : 0;
  ctx.save();
  ctx.translate(shake * 0.4, shake);
  plateCam(art.j4, 1040, 560, 1.0 + 0.05 * clamp(u / 3));
  // the shears: separate plate, spinning, then gone off the bottom
  if (t < IMPACT) {
    const g = 1600;
    const y = SH_Y + 0.5 * g * u * u;
    if (y < H + 300) {
      ctx.save();
      ctx.translate(SH_X + 40 * u, y);
      ctx.rotate(-0.6 + u * 7.5);
      const sw = 520, sh = sw * art.shears.ink.height / art.shears.ink.width;
      drawPose(art.shears, -sw / 2, -sh / 2, sw, sh, [4, 3]);
      ctx.restore();
    }
  }
  ctx.restore();
  floorBurst(t, IMPACT, 330, 1075);
  floorBurst(t, IMPACT + 0.04, 560, 1075);
  DONE.forEach(([words, x, y], row) => {
    const start = words[0][1];
    handWords(words, t, x, y, 124, {
      until: 132.45,
      rot: -0.03 + row * 0.02,
      spacing: (tt) => Math.min(34, (tt - start) * 9),
      lift: (tt, i) => (tt - words[i][1]) * (i % 2 ? 7 : -5) + row * 0,
    });
  });
}

// ---------------------------------------------------------------- J5: walking to the door
const WALK = [
  [[['Now', 133.95], ['I\'m', 134.22], ['ready', 134.5]], 60, 340, 'left'],
  [[['to', 135.25], ['leave', 135.65]], 1860, 470, 'right'],
];
const TURN = 135.35, AT_DOOR = 134.4;
function drawJ5(t) {
  const u = t - J5;
  ctx.fillStyle = COAL; ctx.fillRect(0, 0, W, H);
  // Every figure is drawn inside the plate's own camera, so her feet stay on the carpet when the camera pushes.
  // Perspective on the nave plate: horizon ~ y 640, person height ~ 1.2 x (feet - horizon).
  if (t < AT_DOOR) {
    const q = Math.floor(u / 0.26) * 0.26;           // steps snap to the eighth note
    const p = easeInOutCubic(clamp(q / (AT_DOOR - J5)) * 0.9 + 0.05);
    plateCam(art.nr, 960, 540, 1.0, () => {
      const feet = 1000 - 112 * p;
      const h = (feet - 640) * 1.25 / 0.97;
      const w = h * 2 / 3;
      const bob = Math.abs(Math.sin(q * 12)) * 4 * (h / 430);
      drawPose(art.walk, 960 - w / 2, feet - h * 0.97 - bob, w, h);
    });
  } else {
    const k = clamp((t - AT_DOOR) / 2.2);
    const back = t >= TURN;
    plateCam(art.dg, 960, 540, 1.0 + 0.06 * k, () => {
      const feet = 962, h = 335 / 0.97, w = h * 2 / 3;
      drawPose(back ? art.back : art.walk, 960 - w / 2, feet - h * 0.97, w, h);
      // dust drifts toward the crack between the doors, close to the floor and the doors
      for (let i = 0; i < 44; i++) {
        const sx = hash(i, 90) * W;
        const ph = ((t - AT_DOOR) * (0.12 + 0.1 * hash(i, 91)) + hash(i, 92)) % 1;
        const x = sx + (960 - sx) * ph;
        const y = 450 + hash(i, 93) * 460 + Math.sin(t * 2 + i) * 6;
        ctx.fillStyle = i % 5 === 0 ? GOLD : PAPER;
        ctx.fillRect(x, y, 2 + i % 3, 2);
      }
    });
  }
  WALK.forEach(([words, x, y, align]) => handWords(words, t, x, y, 124, { align, until: 136.55 }));
}

export default [
  scene('J', 'J1', '60.1', '碎玻璃像雪一样落下，空窗框里只有白光', drawJ1),
  scene('J', 'J2', J2, '她站在落下的玻璃里；操纵架已经降向那具新人偶', drawJ2),
  scene('J', 'J3', J3, '教徒跪在地上，把碎片一块块拼回她的脸', drawJ3),
  scene('J', 'J4', J4, '她松开手，剪刀掉在地上', drawJ4),
  scene('J', 'J5', J5, '她朝中殿尽头的门走去，在门前停下，回头', drawJ5),
];
