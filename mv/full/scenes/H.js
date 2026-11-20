import { scene } from '../timeline.js';
import { ctx, W, H, PAPER, ORANGE, COAL, GOLD, clamp, drawBurst } from '../engine/canvas.js';
import { beatAge, kick, spring } from '../motion.js';
import { accentKick } from '../accent.js';
import { punchedCamera } from './B.js';
import { BEAT, bt, hash, term } from './E.js';
import { SEWED } from './G.js';
import { plate, raw, plateCam, handWords } from './JKL.js';

let art;

export async function prepareH() {
  art = {
    open: await plate('H/H01_blade_bundle_v2.png'),
    shut: await plate('H/H02_blade_shut_v2.png'),
    shell: await plate('H/H02_shell_break.png'),
    key: await raw('common/frag/f12.png'),
    key2: await raw('common/frag/f15.png'),
    chips: await Promise.all([1, 3, 9, 13, 20].map((i) => raw(`common/frag/f${String(i).padStart(2, '0')}.png`))),
  };
}

export const H1 = bt(51, 2), H2 = bt(51, 3);
// "Cut" lands the shears; the shell breaks on "it".
const SNIP = 104.73, BREAK = 104.99;
export const CUT_LINE = [
  [[['Cut', 104.98], ['it', 105.3], ['off,', 105.62]], 140, 330, 190],
  [[['you\'ve', 106.05], ['already', 106.28], ['lost', 106.78]], 1800, 1000, 150, 'right'],
];
// Held across the cut into I1 until I2 arrives.
export function cutLine(t, rows = [0, 1]) {
  rows.forEach((r) => {
    const [words, x, y, size, align = 'left'] = CUT_LINE[r];
    handWords(words, t, x, y, size, { align, rot: r ? 0.02 : -0.04, until: 107.2 });
  });
}

// The system's terminal line ("Sewed up by the gods of city") is carried over from G7 and is cut in half
// by the same snip: the two halves drop away, then her handwriting answers on "Cut".
function sewedLine(t) {
  if (t < SNIP) { term(SEWED, t, 960, 1010, { size: 56, align: 'center' }); return; }
  const age = t - SNIP;
  if (age > 0.7) return;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(960 + side * 520 * age, 1010 + 1900 * age * age);
    ctx.rotate(side * 0.9 * age);
    ctx.translate(-960, -1010);
    ctx.beginPath(); ctx.rect(side < 0 ? 0 : 960, 0, 960, H); ctx.clip();
    term(SEWED, 104.5, 960, 1010, { size: 56, align: 'center' });
    ctx.restore();
  }
  if (age < 0.1) { ctx.fillStyle = ORANGE; ctx.fillRect(954, 930, 12, 110); }
}

const hitAt = (t, cuts) => accentKick(t / BEAT, cuts.map((c) => c / BEAT));

// ---------------------------------------------------------------- H1: the blades bite the bundle, locked for one beat
function drawH1(t) {
  const hit = hitAt(t, [H1]);
  punchedCamera(1, hit, () => plateCam(art.open, 960, 540, 1.04), { x: 4, y: 2, push: 0.02 });
  sewedLine(t);
}

// ---------------------------------------------------------------- H2: snip, shell bursts, the living librarian
function flyer(img, t, i, x0, y0, scale) {
  const age = t - BREAK;
  const a = hash(i, 41) * 6.283;
  const v = 700 + 900 * hash(i, 42);
  const x = x0 + Math.cos(a) * v * age;
  const y = y0 + Math.sin(a) * v * age + 900 * age * age;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(hash(i, 43) * 6 + age * (6 + 8 * hash(i, 44)) * (i % 2 ? 1 : -1));
  const w = img.width * scale, h = img.height * scale;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawH2(t) {
  const hit = hitAt(t, [H2, SNIP, BREAK]);
  if (t < SNIP) {
    punchedCamera(1, hit, () => plateCam(art.open, 960, 540, 1.08), { x: 4, y: 2, push: 0.02 });
  } else if (t < BREAK) {
    // the shut blades: thread tails spring up on a spring, no tween
    const s = spring((t - SNIP) / BEAT, 3, 10);
    punchedCamera(1, hit, () => plateCam(art.shut, 960, 540 + 20 * s, 1.08), { x: 6, y: 6, push: 0.03 });
    drawBurst(t, SNIP, 880, 540, 7, [ORANGE, COAL, GOLD]);
  } else {
    const age = t - BREAK;
    const z = 1.0 + 0.05 * clamp(age / 1.2);
    punchedCamera(1, hit, () => plateCam(art.shell, 1100, 520, z), { x: 4, y: 6, push: 0.02 });
    drawBurst(t, BREAK, 1100, 420, 9, [ORANGE, COAL, PAPER]);
    if (age < 1.2) {
      flyer(art.key, t, 1, 1150, 420, 0.42);
      flyer(art.key2, t, 2, 1150, 420, 0.36);
      art.chips.forEach((c, i) => flyer(c, t, i + 5, 1100 + (i - 2) * 40, 460, 0.3));
    }
  }
  sewedLine(t);
  cutLine(t, [0]);
}

const shots = [
  ['H1', H1, '白底，剪刀的刃口咬住一整束线', drawH1],
  ['H2', H2, '线向上弹走，瓷壳和发条钥匙炸开，里面是皮肤。橙色手写字铺满画面', drawH2],
];

export default shots.map(([id, start, summary, draw]) => scene('H', id, start, summary, draw));
