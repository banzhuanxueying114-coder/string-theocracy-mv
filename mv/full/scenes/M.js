// M: the last section. Two hands clasp, the door opens, the sky is the one colour outside the palette.
import { scene } from '../timeline.js';
import { ctx, W, H, PAPER, ORANGE, COAL, GOLD, DIM_COAL, MONO, RULES, clamp, text } from '../engine/canvas.js';
import { animatedLyric } from './B.js';
import {
  plate, pose, plateCam, handWords, thread, sideDust, arcText, stepAt, hash, prepareJKL,
} from './JKL.js';
import { term } from './E.js';
import { hand } from './JKL.js';
import { electric, inkStrike } from '../fx.js';

let art;
export async function prepareM() {
  await prepareJKL();
  art = {
    clasp: await plate('M/M01_clasp.png'),
    doorClosed: await plate('common/door_closed.png'),
    doorAjar: await plate('common/door_ajar.png'),
    peek: await plate('M/M02_peek.png'),
    wall: await plate('common/puppet_theaters.png'),
    step: await pose('M/M03_step_sprite.png', 420).catch(() => null),
    bClosed: await pose('M/M03_booth_closed.png', 330),
    bAwake: await pose('M/M03_booth_awake.png', 330),
    sky: await plate('common/door_sky.png'),
    wide: await pose('M/M04_door_wide.png', 2160),
    eye: await plate('M/M05_sky_eye.png'),
    off1: await pose('M/M06_offer_end_1.png', 520),
    off2: await pose('M/M06_offer_end_2.png', 520),
    nave1: await plate('M/M07_nave_reach_1.png'),
    nave2: await plate('M/M07_nave_reach_2.png').catch(() => null),
    curtain: await plate('common/curtain.png'),
  };
}

const M1 = 144.8606, M2 = 146.41, M3 = 148.48, M4 = 151.59, M5 = 154.18, M6 = 156.25, M7 = 157.8, M8 = 163.49;
const BEAT = 0.517241;

// ---------------------------------------------------------------- M1
const STRENGTH = '(You give me strength)';
const STRENGTH_CUES = [145.37, 145.62, 145.89, 146.12]; // You, give, me, strength
const STRENGTH_CHARS = [5, 10, 13, 22];
const STRENGTH_END = 146.75;
function drawM1(t) {
  const u = t - M1;
  plateCam(art.clasp, 900, 600, 1.0 + 0.05 * clamp(u / 1.55), () => {
    // one horizontal thread leaves the porcelain wrist and runs out of frame to the right
    thread([1330, 548], [W + 260, 520], t, { sway: 3, seed: 3 });
  });
  sideDust(t, 40, 11, { dir: 1, bounds: [0, 80, W, 900], speed: 45 });
  handWords([['(You', 145.37], ['give', 145.62], ['me', 145.89], ['strength)', 146.12]], t, 960, 960, 130, { align: 'center', until: STRENGTH_END });
}

// ---------------------------------------------------------------- M2
const DOOR_A = 146.93, DOOR_P = 147.45;
const HOPE = [['Hopeful', 146.65]];
const CURIO = [['curiosity', 147.42]];
function drawM2(t) {
  const u = t - M2;
  const image = t >= DOOR_P ? art.peek : t >= DOOR_A ? art.doorAjar : art.doorClosed;
  plateCam(image, 960, 560, 1.0 + 0.08 * clamp(u / 2.07), () => {});
  sideDust(t, 30, 12, { dir: 1, bounds: [0, 120, W, 900], speed: 30 });
  handWords([['(You', 145.37], ['give', 145.62], ['me', 145.89], ['strength)', 146.12]], t, 960, 960, 130, { align: 'center', until: STRENGTH_END });
  handWords(HOPE, t, 70, 330, 150, { until: 148.48 });
  handWords(CURIO, t, 1850, 470, 150, { align: 'right', until: 148.48 });
}

// ---------------------------------------------------------------- M3
const COLS = [[816, 1084], [1308, 1564], [1792, 2048], [2272, 2528], [2760, 3012]];
const ROWS = [[584, 776], [1052, 1240], [1516, 1708], [1980, 2172]];
const X = (x) => -120 + x * 0.5625;
const Y = (y) => -67 + (y - 200) * 0.5625;
const CELLS = [];
ROWS.forEach(([y0, y1]) => COLS.forEach(([x0, x1]) => CELLS.push({ x0: X(x0), x1: X(x1), y0: Y(y0), y1: Y(y1) })));
const WAKE_ORDER = [...CELLS.keys()].filter((i) => i !== 7).sort((a, b) => hash(a, 4) - hash(b, 4)).concat([7]);
const STEP_OUT = 151.07;
const wakeTime = (cell) => {
  const k = WAKE_ORDER.indexOf(cell);
  return M3 + Math.floor(k / 2) * (BEAT / 2);
};
function drawBooths(t) {
  CELLS.forEach((c, i) => {
    const awake = t >= wakeTime(i);
    const sp = awake ? art.bAwake : art.bClosed;
    const w = c.x1 - c.x0, h = c.y1 - c.y0;
    ctx.save();
    ctx.beginPath(); ctx.rect(c.x0, c.y0, w, h); ctx.clip();
    const sh = h * 1.9, sw = sh * sp.ink.width / sp.ink.height;
    ctx.drawImage(sp.ink, c.x0 + w / 2 - sw / 2, c.y0 + h * 0.5 - sh * 0.3, sw, sh);
    ctx.restore();
  });
}
const MAYBE = [['Maybe', 148.49], ['there', 148.73], ['are', 148.98], ['still', 149.2]];
const HAPPY = [['happy', 149.49], ['answers', 149.75], ['left', 149.99]];
const FORMY = [['for', 150.28], ['my', 150.51], ['discovery', 150.7]];
const M3_TEXT_END = 151.99;
function drawM3(t) {
  const u = t - M3;
  const zoom = 1.04 + 0.1 * clamp(u / 3.1);
  plateCam(art.wall, 960, 595, zoom, () => {
    drawBooths(t);
    if (t >= STEP_OUT && art.step) {
      const c = CELLS[7];
      // she stands up out of her cell and steps over the sill (drawn on top of the wall, not clipped)
      const v = clamp((t - STEP_OUT) / 0.5);
      const sh = 300, sw = sh * art.step.ink.width / art.step.ink.height;
      ctx.drawImage(art.step.ink, (c.x0 + c.x1) / 2 - sw / 2, c.y1 - sh + 40 + 45 * v, sw, sh);
    }
  });
  sideDust(t, 25, 13, { dir: 1, bounds: [0, 100, W, 900], speed: 30 });
  handWords(MAYBE, t, 70, 150, 112, { until: M3_TEXT_END });
  handWords(HAPPY, t, 1850, 590, 112, { align: 'right', until: M3_TEXT_END });
  handWords(FORMY, t, 70, 1020, 112, { until: M3_TEXT_END });
}

// ---------------------------------------------------------------- M4 / M5 / M6 (the sky)
function skyDoor(t, base, cx, cy, zoom, extra) {
  const u = t - base;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cx, -cy);
  // sky layer: the only colour outside the palette, panned slowly behind the doorway
  ctx.drawImage(art.sky, -420 + u * 34, -240, 2160 * 1.35, 1215 * 1.35);
  electric(art.sky, -420 + u * 34, -240, 2160 * 1.35, 1215 * 1.35, t, { seed: 3, cell: 14, alpha: 0.32, line: 8 });
  ctx.drawImage(art.wide.ink, -120, -67 - 112.5, 2160, 1440);
  if (extra) extra();
  ctx.restore();
}
const WHATS = [["What's", 152.55], ['the', 153.05]];
const COLOR = [['color', 153.25], ['of', 154.0]];
const ELEC = [['the', 154.15], ['electric', 154.4]];
const SHEEP = [['sheep', 155.2]];
const YOUSEE = [['you', 155.85], ['see?', 156.2]];
const Q_END = 156.75;
function drawQuestion(t) {
  handWords(WHATS, t, 70, 330, 112, { until: M5 });
  handWords(COLOR, t, 70, 460, 112, { until: M5 });
  handWords(ELEC, t, 1850, 330, 112, { align: 'right', until: M5 });
  handWords(SHEEP, t, 1850, 460, 112, { align: 'right', until: Q_END });
  handWords(YOUSEE, t, 1850, 590, 112, { align: 'right', until: Q_END });
}
function drawM4(t) {
  skyDoor(t, M4, 960, 540, 1.0 + 0.07 * clamp((t - M4) / 2.59), null);
  sideDust(t, 30, 14, { dir: -1, bounds: [0, 100, W, 950], speed: 30 });
  drawQuestion(t);
}
function drawM5(t) {
  const u = t - M5;
  plateCam(art.eye, 960, 540, 1.0 + 0.05 * clamp(u / 2.07), () => {
    // the reflection in the pupil is a screen: scanlines, pixel blocks, a tear now and then
    ctx.save();
    ctx.beginPath(); ctx.arc(950, 543, 232, 0, Math.PI * 2); ctx.clip();
    electric(art.eye, -120, -67, 2160, 1215, t, { seed: 5, cell: 10, alpha: 0.35, line: 6, sparks: 40 });
    ctx.restore();
  });
  sideDust(t, 30, 15, { dir: 1, bounds: [0, 100, W, 900], speed: 25 });
  drawQuestion(t);
}
const AND = [['And', 156.84], ['if', 157.1], ['you', 157.25], ['love', 157.45], ['me', 157.78]];
const OFFER_SPRITE = { x: 785, y: 470, h: 540 };
function drawM6(t) {
  const u = t - M6;
  const p = t >= 157.45 ? art.off2 : art.off1;
  skyDoor(t, M6, 960, 540, 1.0 + 0.04 * clamp(u / 1.55), () => {
    const s = OFFER_SPRITE;
    const w = s.h * p.ink.width / p.ink.height;
    ctx.drawImage(p.ink, s.x, s.y, w, s.h);
    ctx.drawImage(p.orange, s.x, s.y, w, s.h);
    if (t < 157.45) thread([s.x + 0.24 * w, s.y + 0.485 * s.h], [-200, s.y + 0.5 * s.h + 40], t, { sway: 4, seed: 6 });
  });
  sideDust(t, 24, 16, { dir: -1, bounds: [0, 100, W, 950], speed: 28 });
  drawQuestion(t);
  handWords(AND, t, 1850, 240, 120, { align: 'right', until: M7 + 0.5 });
}

// ---------------------------------------------------------------- M7
const CAN = [['Can', 158.72], ['you', 158.98], ['love', 159.12], ['your', 159.3]];
const EVERY = [['everything', 159.6], ['too,', 160.15]];
const FORME = [['for', 160.55], ['me', 160.95]];
const REACH = 160.16;
function drawM7(t) {
  const reach2 = t >= REACH;
  const u = t - M7;
  const zoom = reach2 ? 1.04 : 1.4 - 0.36 * clamp(u / (REACH - M7));
  plateCam(reach2 && art.nave2 ? art.nave2 : art.nave1, 1000, 520, zoom, () => {
    thread([-200, 590], [560, 520], t, { grow: clamp((t - M7) / 0.9), sway: 4, seed: 9 });
  });
  sideDust(t, 30, 17, { dir: 1, bounds: [0, 100, W, 950], speed: 20 });
  handWords(CAN, t, 70, 160, 120, { until: 162.5 });
  handWords(EVERY, t, 1850, 500, 120, { align: 'right', until: 162.5 });
  handWords(FORME, t, 70, 960, 120, { until: 162.5 });
  // her question gets no answer: the old terminal prompt comes back empty, cursor blinking, until the bars close
  if (t >= 161.55 && t < 162.5) term([['', 160.95]], t, 640, 965, { size: 64 });
  closeMask(t);
}
// stepped coal bars close the church; no fade, only hard steps
function closeMask(t) {
  const start = 162.5, n = 12, bar = H / n;
  for (let i = 0; i < n; i++) {
    const order = i % 2 ? n - 1 - Math.floor(i / 2) : Math.floor(i / 2);
    if (t < start + order * 0.08) continue;
    ctx.fillStyle = COAL;
    ctx.fillRect(0, i * bar, W, bar + 1);
    const str = RULES[i % RULES.length].slice(0, 60), x = 30 + (i * 97) % 400, y = i * bar + bar * 0.6;
    text(str, x, y, 22, DIM_COAL, MONO);
    ctx.font = `22px ${MONO}`;
    const p = clamp((t - start - order * 0.08 - 0.2) / 0.25);
    inkStrike(x - 6, y - 8, x + ctx.measureText(str).width + 6, y - 6, p, { width: 4, seed: i });
  }
}

// ---------------------------------------------------------------- M8
// The last system line is typed once more; she strikes "do not" and writes "I" over it: "I want."
const LAST = [['do', 163.62], ['not', 163.84], ['want.', 164.06]];
const STRIKE = 164.45, SIGN = 164.85;
function lastWord(t) {
  if (t < LAST[0][1]) return;
  const size = 60, y = 330;
  ctx.save(); ctx.font = `${size}px ${MONO}`;
  const full = '> do not want.';
  const left = 960 - ctx.measureText(full + '_').width / 2;
  const a = left + ctx.measureText('> ').width - 6, b = left + ctx.measureText('> do not').width + 8;
  ctx.restore();
  term(LAST, t, left, y, { size });
  inkStrike(a, y - size * 0.32, b, y - size * 0.28, clamp((t - STRIKE) / 0.22), { width: 9, seed: 4 });
  if (t >= SIGN) {
    const pop = t - SIGN < 0.07 ? 1.12 : 1;
    ctx.save(); ctx.translate((a + b) / 2, y - 92); ctx.scale(pop, pop); ctx.rotate(-0.06);
    hand('I', 0, 0, 170, { align: 'center' });
    ctx.restore();
    // the caret under the strike, as a proofreader would mark the insertion
    inkStrike((a + b) / 2 - 26, y - size * 0.02, (a + b) / 2, y - size * 0.55, clamp((t - SIGN) / 0.12), { width: 6, seed: 8 });
    inkStrike((a + b) / 2, y - size * 0.55, (a + b) / 2 + 26, y - size * 0.02, clamp((t - SIGN - 0.12) / 0.12), { width: 6, seed: 9 });
  }
}
const TITLE_AT = 165.56;
const CREDITS = [
  ['Mili', 166.6, 44, 'text'],
  ['Fan-made music video \u2014 non-commercial', 168.0, 28],
  ['Images: GPT Image \u00b7 motion built in code', 169.1, 28],
  ['Music & lyrics: Mili', 170.2, 28],
];
const CREDIT_OUT = [171.3, 171.6, 171.9];
function drawM8(t) {
  const u = t - M8;
  plateCam(art.curtain, 960, 540 + 40 * Math.sin(u * 0.35), 1.02 + 0.03 * clamp(u / 10.7), () => {});
  ctx.fillStyle = COAL; ctx.globalAlpha = 0.74; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  sideDust(t, 36, 18, { dir: 1, bounds: [0, 0, W, H], speed: 16 });
  // sparse characters drifting up through the folds
  for (let i = 0; i < 18; i++) {
    const x = hash(i, 2) * W, y = H - (((u * 12 + hash(i, 3) * H) % H));
    text(i % 2 ? 'want.' : 'I', x, y, 16, DIM_COAL, MONO);
  }
  lastWord(t);
  animatedLyric('String Theocracy', t, 960, 500, { start: TITLE_AT, end: 175, align: 'center' });
  CREDITS.forEach(([str, at, size], i) => {
    const out = i >= 1 ? CREDIT_OUT[i - 1] : Infinity;
    if (t < at || t >= out) return;
    text(str, 960, 590 + (i === 0 ? 0 : 52 + (i - 1) * 46), size, PAPER, MONO, 'center');
  });
}

const draws = { M1: drawM1, M2: drawM2, M3: drawM3, M4: drawM4, M5: drawM5, M6: drawM6, M7: drawM7, M8: drawM8 };
const shots = [
  ['M1', '71.1', '两只手隔着一根线握在一起，一只是人，一只是瓷'],
  ['M2', M2, '大门推开一道缝，新人偶探头往外看'],
  ['M3', M3, '墙上小戏台里的人偶一个接一个睁眼，有一个跨出了格子'],
  ['M4', M4, '门外是清晨的天空，一群羊一样的云。全片第一次出现四色以外的颜色'],
  ['M5', M5, '新人偶眼睛的大特写，瞳孔里映着天空的颜色，没有线'],
  ['M6', M6, '她在门槛上回头，朝教徒和那只手递出一根线头'],
  ['M7', M7, '从门口回望整座教堂：碎玻璃、被换下的头、空瓷壳、那只手。一个教徒站起来，伸手去够线头'],
  ['M8', M8, '片名与制作信息'],
];
export default shots.map(([id, start, summary]) => scene('M', id, start, summary, draws[id]));
