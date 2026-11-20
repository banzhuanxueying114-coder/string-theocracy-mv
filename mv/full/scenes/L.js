import { scene } from '../timeline.js';
import { ctx, W, H, PAPER, ORANGE, COAL, MONO, clamp, text } from '../engine/canvas.js';
import { RULES } from '../engine/canvas.js';
import { plate, plateCam, handWords, sideDust, prepareJKL } from './JKL.js';
import { drawKLyrics } from './K.js';

let art;
export async function prepareL() {
  await prepareJKL();
  art = {
    b1: await plate('L/L01_close_book_1.png'),
    b2: await plate('L/L01_close_book_2.png'),
    e1: await plate('L/L02_doll_eye_1.png'),
    e2: await plate('L/L02_doll_eye_2.png'),
  };
}

const L1 = 140.723, SHUT = 141.757, L2 = 143.8, OPEN = 144.32;

// "Connect our hands" is still sung over the first beat of L1, then the knowledge line starts.
const KNOW1 = [['When', 141.22], ['I', 141.5], ['no', 141.75], ['longer', 141.99], ['can', 142.51]];
const KNOW2 = [['live', 142.76], ['on', 143.03], ['knowledge', 143.3], ['alone', 143.7]];
const KNOW_END = 144.35;
function drawL1(t) {
  const u = t - L1;
  const shut = t >= SHUT;
  plateCam(shut ? art.b2 : art.b1, 960, 540, 1.0 + 0.05 * clamp(u / 3), () => {});
  // horizontal dust keeps moving: the old rising direction is gone
  sideDust(t, 60, 5, { dir: 1, bounds: [0, 150, W, 760], speed: 70 });
  drawKLyrics(t);
  const widen = (tt) => clamp((tt - 141.2) * 7, 0, 26);
  handWords(KNOW1, t, 960, 925, 100, { align: 'center', until: KNOW_END, spacing: widen });
  handWords(KNOW2, t, 960, 1040, 100, { align: 'center', until: KNOW_END, spacing: widen });
}

const IRIS = [889, 562, 108];
function drawL2(t) {
  const u = t - L2;
  const open = t >= OPEN;
  plateCam(open ? art.e2 : art.e1, 960, 540, 1.0 + 0.03 * clamp(u / 1.06), () => {});
  if (open) {
    // paper-white characters, reflected in the eye, sweep slowly across it
    ctx.save();
    ctx.beginPath();
    ctx.arc(IRIS[0], IRIS[1], IRIS[2], 0, Math.PI * 2);
    ctx.clip();
    const a = t - OPEN;
    for (let row = 0; row < 8; row++) {
      const str = RULES[row % RULES.length];
      const x = IRIS[0] - IRIS[2] - 140 + ((a * 38 + row * 53) % 420);
      text(str.slice(0, 7), x, IRIS[1] - IRIS[2] + 26 + row * 28, 22, PAPER, MONO);
    }
    ctx.restore();
  }
  sideDust(t, 30, 8, { dir: 1, bounds: [0, 100, W, 800], speed: 40 });
}

export default [
  scene('L', 'L1', '69.1', '她走到讲经台前，合上那本红皮书；书页里不再有线升起来', drawL1),
  scene('L', 'L2', L2, '新人偶睁开眼睛', drawL2),
];
