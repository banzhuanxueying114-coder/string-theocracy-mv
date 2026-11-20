import { scene } from '../timeline.js';
import {
  ctx, W, H, PAPER, ORANGE, COAL, GOLD, DIM_COAL, DIM_PAPER, MONO, GOTHIC, RULES,
  loadImages, clamp, text, withCamera,
} from '../engine/canvas.js';
import { beatAge, easeInOutCubic, easeOutExpo, kick, spring } from '../motion.js';
import { accentKick } from '../accent.js';
import { codeField, dust, outlinedLyric, punchedCamera } from './B.js';
import { DOLL, cropFrame, keyPose, strings, floorBurst } from './C.js';

export const BEAT = 0.517241;
export const bt = (bar, beat = 1) => 0.033 + (bar - 1) * 2.068966 + (beat - 1) * BEAT;
const ASSETS = new URL('../../../art/full/', import.meta.url);
let art;

export const hash = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
export const full = (image) => ctx.drawImage(image, 0, 0, W, H);

export async function prepareE() {
  const plates = {};
  for (const [id, path] of [
    ['controller', 'common/controller.png'], ['ctlLow', 'E/E01_controller_low.png'],
    ['ledger', 'E/E02_ledger_pen.png'], ['stage', 'common/nave_stage.png'], ['crowd', 'common/congregation_up.png'],
    ['wrist', 'E/E04_wrist_reveal.png'], ['trapHalf', 'E/E06_trap_half.png'], ['trapOpen', 'common/stage_trap_open.png'],
  ]) {
    const [image] = await loadImages([path], ASSETS);
    plates[id] = cropFrame(image, 2160);
  }
  plates.doll = {};
  for (const [id, path] of [
    ['step1', 'E/E03_step_1.png'], ['step2', 'E/E03_step_2.png'], ['edge', 'E/E07_skirt_at_edge.png'], ['leap', 'E/E08_leap.png'],
  ]) {
    const [image] = await loadImages([path], ASSETS);
    plates.doll[id] = keyPose(image, 760);
  }
  for (const [id, path] of [['tug1', 'E/E05_tug_1.png'], ['tug2', 'E/E05_tug_2.png']]) {
    const [image] = await loadImages([path], ASSETS);
    plates[id] = keyPose(image, 1920);
  }
  art = plates;
}

export const ANCH = {
  step1: [[0.15, 0.37], [0.52, 0.04], [0.82, 0.46]],
  step2: [[0.27, 0.48], [0.47, 0.04], [0.72, 0.48]],
  edge: [[0.30, 0.45], [0.44, 0.04], [0.69, 0.44]],
  leap: [[0.08, 0.5], [0.58, 0.06], [0.92, 0.62]],
};

// ------------------------------------------------------------ shared type treatments
// Terminal text: small orange mono on a coal strip, typed word by word on the vocal onsets.
export function term(words, t, x, y, { size = 44, end = Infinity, align = 'left', dx = 0, prompt = '> ' } = {}) {
  if (t >= end || t < words[0][1]) return;
  let shown = '';
  for (const [word, at] of words) if (t >= at) shown += (shown ? ' ' : '') + word;
  const str = prompt + shown;
  ctx.save();
  ctx.font = `${size}px ${MONO}`;
  const width = ctx.measureText(str + '_').width;
  const left = (align === 'right' ? x - width : align === 'center' ? x - width / 2 : x) + dx;
  ctx.fillStyle = COAL;
  ctx.fillRect(left - 16, y - size, width + 32, size * 1.45);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(left - 16, y - size, 6, size * 1.45);
  text(str, left, y, size, ORANGE, MONO);
  const last = words[words.length - 1][1];
  if (t < last + 0.6 || Math.floor(t / 0.26) % 2 === 0) {
    ctx.fillStyle = ORANGE;
    ctx.fillRect(left + ctx.measureText(str).width + 4, y - size * 0.78, size * 0.5, size * 0.9);
  }
  ctx.restore();
}

// Gothic outlined line where each word lands on its own onset.
export function gothicWords(lines, t, x, y0, { size = 116, step = 130, end = Infinity } = {}) {
  if (t >= end) return;
  lines.forEach((words, row) => {
    let shown = '';
    for (const [word, at] of words) if (t >= at) shown += (shown ? ' ' : '') + word;
    if (!shown) return;
    const first = words.find(([, at]) => t >= at);
    const age = t - first[1];
    outlinedLyric(shown, x, y0 + row * step - Math.max(0, 14 * (1 - age * 8)), size, 'left');
  });
}

// Camera centre that keeps the zoomed view inside the plate: bottom edge stays glued to the frame bottom.
export const camY = (z, k = 1) => 540 + 540 * (1 - 1 / z) * k;

function stageBack(t, hit, seed, plate = art.stage) {
  full(plate);
  codeField(t / BEAT, [0, 8, W, 70], seed, hit);
  dust(t, 70, seed * 7, [250, 110, 1420, 780]);
}

function stageDoll(t, id, rect, cut, { orange = [0, 0], slack = 0, amp = 10, side = 1, anchors = ANCH[id] } = {}) {
  const plate = art.doll[id];
  const age = Math.max(0, t - cut);
  const snap = spring(age / BEAT, 2.6, 15);
  const sx = rect.x + 3 * side * snap, sy = rect.y - 2 * snap;
  ctx.drawImage(plate.ink, sx, sy, rect.w, rect.h);
  if (Math.abs(orange[0]) + Math.abs(orange[1]) > 0.5) ctx.drawImage(plate.orange, sx + orange[0], sy + orange[1], rect.w, rect.h);
  strings(t, anchors, age, { slack, amp, rect });
}

// ---------------------------------------------------------------- E1: the hand lowers the bar, strings go slack
const E1 = bt(28), E1_CUT = bt(28, 2);

function drawE1(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [E1 / BEAT, E1_CUT / BEAT]);
  const low = t >= E1_CUT;
  const age = Math.max(0, t - E1_CUT);
  // A small pendulum about the bar, lagging the hand.
  const sway = low ? 0.035 * Math.exp(-2.6 * age) * Math.cos(2 * Math.PI * 1.45 * age - 0.5) : 0;
  punchedCamera(1, hit, () => {
    ctx.save();
    ctx.translate(1400, 180);
    ctx.rotate(sway);
    ctx.translate(-1400, -180);
    ctx.drawImage(low ? art.ctlLow : art.controller, -120, -67, 2160, 1215);
    ctx.restore();
    dust(t, 40, 17, [0, 150, W, 880]);
  }, { x: 2, y: low ? 10 : -6, push: 0.012 });
  codeField(beat, [0, 8, W, 70], 3, hit);
  // Five line states, going slack one after another.
  for (let k = 0; k < 5; k++) {
    const goes = E1_CUT + 0.12 + k * 0.26;
    const tension = t < goes ? 1 : Math.max(0, 1 - (t - goes) / 0.35);
    const x = 190 + k * 330;
    text(`L${k + 1}`, x, 1000, 18, GOLD, MONO);
    text(`T=${tension.toFixed(2)}`, x + 44, 1000, 18, tension > 0.02 ? DIM_PAPER : GOLD, MONO);
  }
}

// ---------------------------------------------------------------- E2: the question on the page
const E2 = bt(29);
export const FREE_WORDS = [
  [['How', 59.45], ['does', 59.72], ['it', 60.1], ['feel', 60.3]],
  [['to', 60.68], ['be', 60.82], ['free?', 61.53]],
];
const FREE_END = 62.08;

function drawE2(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [E2 / BEAT, 59.45 / BEAT, 59.72 / BEAT, 60.3 / BEAT]);
  punchedCamera(1.0, hit, () => {
    withCamera(960, 540, 1.035 + 0.02 * clamp((t - E2) / 2), () => {
      full(art.ledger);
      // Margin marks creep up the page edge.
      ctx.save();
      ctx.beginPath(); ctx.rect(1330, 200, 90, 560); ctx.clip();
      for (let i = 0; i < 14; i++) {
        const y = 760 - ((i * 44 + t * 14) % 616);
        text(i % 3 === 0 ? '[x]' : '[ ]', 1345, y, 16, DIM_COAL, MONO);
      }
      ctx.restore();
      // The question writes itself in gothic ink on the left page, letters trembling slightly.
      ctx.save();
      ctx.translate(520, 420);
      ctx.rotate(-0.045);
      FREE_WORDS.flat().forEach(() => 0);
      let cursor = 0;
      ctx.font = `76px ${GOTHIC}`;
      const row1 = FREE_WORDS[0];
      for (const [word, at] of row1) {
        const w = ctx.measureText(word + ' ').width;
        if (t >= at) {
          const age = t - at;
          const rise = 10 * Math.max(0, 1 - age * 7);
          let gx = 0;
          for (const ch of word) {
            const jit = 1.6 * Math.sin(t * 31 + gx * 0.07 + cursor);
            text(ch, cursor + gx + jit * 0.4, -rise + jit, 76, COAL, GOTHIC);
            gx += ctx.measureText(ch).width;
          }
        }
        cursor += w;
      }
      ctx.restore();
    });
  }, { x: 2, y: -3, push: 0.01 });
}

// ---------------------------------------------------------------- E3: a step, and the pews lean in
const E3 = bt(30), E3_TOUCH = bt(30, 2), E3_CROWD = bt(30, 3);

function drawE3(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [E3 / BEAT, E3_TOUCH / BEAT, E3_CROWD / BEAT]);
  if (t < E3_CROWD) {
    const touched = t >= E3_TOUCH;
    const cut = touched ? E3_TOUCH : E3;
    punchedCamera(1, hit, () => {
      withCamera(960, 567, 1.06 + 0.03 * clamp((t - E3) / 1.0), () => {
        stageBack(t, hit, 9);
        stageDoll(t, touched ? 'step2' : 'step1', DOLL, cut, { slack: 1, amp: 6, orange: [6 * hit, 0] });
        if (touched) floorBurst(t, E3_TOUCH, 960, 870);
        // The loose strings drag along the boards.
        if (touched) {
          const a = t - E3_TOUCH;
          for (let k = 0; k < 3; k++) {
            ctx.beginPath();
            const x0 = 860 + k * 100;
            ctx.moveTo(x0, 880);
            for (let s = 1; s <= 10; s++) ctx.lineTo(x0 - s * (14 + 20 * k) * (0.4 + a), 880 + Math.sin(s * 1.1 + k) * 5 + s * 1.5);
            ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.stroke();
          }
        }
      });
    }, { x: 3, y: 5, push: 0.014 });
  } else {
    // Hoods lean forward as one layer; the camera tilts up the rising slack thread.
    const age = t - E3_CROWD;
    const lean = easeOutExpo(clamp(age / 0.35));
    const tilt = easeInOutCubic(clamp((age - 0.25) / 0.3));
    punchedCamera(1, hit, () => {
      withCamera(960, 760 - 220 * tilt, 1.02 + 0.07 * lean, () => {
        full(art.crowd);
        dust(t, 50, 31, [0, 300, W, 700]);
        // Thread climbing from the foreground toward the stage.
        ctx.beginPath();
        for (let s = 0; s <= 24; s++) {
          const y = 1100 - s * 52;
          const x = 960 + Math.sin(s * 0.5 + age * 5) * (18 + s) * Math.exp(-age * 0.6);
          s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = COAL; ctx.lineWidth = 8; ctx.stroke();
        ctx.strokeStyle = GOLD; ctx.lineWidth = 4; ctx.stroke();
      });
    }, { x: 2, y: -4, push: 0.012 });
    codeField(beat, [0, 8, W, 70], 4, hit);
  }
  freeHold(t);
}

// "How does it feel to be free?" is held across the E2→E3 cut until it has been sung through.
function freeHold(t) {
  if (t < 59.9 && t < bt(30)) return;
  gothicWords([FREE_WORDS[0], FREE_WORDS[1]], t, 110, 900, { size: 104, step: 120, end: FREE_END });
}

// ---------------------------------------------------------------- E4: look up the thread
const E4 = bt(31);
const HUM = 62.24;

function drawE4(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [E4 / BEAT]);
  const p = easeInOutCubic(clamp((t - E4) / 1.25));
  const offY = -360 + 300 * p; // tilting up: the plate slides down
  punchedCamera(1, hit, () => {
    ctx.drawImage(art.wrist, -120, offY, 2160, 1440);
    dust(t, 45, 57, [0, 0, W, H]);
    // Micro-type climbs the thread (string runs at x ≈ 0.506 of the plate, top 27%).
    const sx = -120 + 0.506 * 2160;
    ctx.save();
    ctx.beginPath(); ctx.rect(sx - 30, 0, 60, offY + 0.28 * 1440); ctx.clip();
    for (let n = 0; n < 16; n++) {
      const y = offY + 0.28 * 1440 - ((n * 70 + (t - E4) * 140) % 1120);
      ctx.save();
      ctx.translate(sx + 12, y);
      ctx.rotate(-Math.PI / 2);
      text(RULES[n % RULES.length].slice(0, 7), 0, 0, 13, DIM_PAPER, MONO);
      ctx.restore();
    }
    ctx.restore();
  }, { x: 2, y: -4, push: 0.012 });
  codeField(beat, [0, 8, W, 70], 6, hit);
  // The hum, as a waveform hugging the frame edge.
  if (t >= HUM && t < 63.4) {
    const age = t - HUM;
    for (let i = 0; i < 44; i++) {
      const env = Math.sin(Math.PI * clamp(age / 1.1)) * (0.4 + 0.6 * hash(i, Math.floor(t * 9)));
      const h = 10 + 56 * env * (0.5 + 0.5 * Math.sin(i * 0.5 + age * 4));
      ctx.fillStyle = i % 5 === 0 ? ORANGE : DIM_PAPER;
      ctx.fillRect(1850, 140 + i * 18, h, 4);
    }
    text('hm-mm-mm', 1630, 128, 20, ORANGE, MONO);
  }
}

// ---------------------------------------------------------------- E5: she tugs the thread
const E5 = bt(31, 4), E5_TUG = bt(32, 2);
const TRY_WORDS = [['Why', 63.64], ['don\'t', 63.9], ['you', 64.18]];
const TRY_WORDS2 = [['try', 64.4], ['it', 64.76], ['yourself?', 64.95]];

function drawE5(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [E5 / BEAT, E5_TUG / BEAT]);
  const tugged = t >= E5_TUG;
  const age = Math.max(0, t - E5_TUG);
  const plate = tugged ? art.tug2 : art.tug1;
  punchedCamera(1, hit, () => {
    ctx.fillStyle = COAL;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(plate.ink, 0, -100, 1920, 1280);
    dust(t, 40, 63, [0, 0, W, H]);
    // Wave runs up the thread into the inset.
    const px = 1250, wave = tugged ? Math.max(0, 1 - age / 1.2) : 0;
    ctx.beginPath();
    for (let s = 0; s <= 30; s++) {
      const y = 700 - s * 22;
      const reach = clamp(age * 520 - (700 - y) * 0.9 > 0 ? 1 : 0);
      const x = px + reach * 22 * wave * Math.sin(s * 0.8 - age * 24) * (s / 30);
      s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = COAL; ctx.lineWidth = 8; ctx.stroke();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3.5; ctx.stroke();
    // The hand upstairs, in its own cropped window, jerked when the wave arrives.
    const jolt = tugged ? kick(beatAge(beat, [(E5_TUG + 0.4) / BEAT])) : 0;
    ctx.save();
    ctx.beginPath(); ctx.rect(760, 0, 900, 190); ctx.clip();
    ctx.fillStyle = COAL; ctx.fillRect(760, 0, 900, 190);
    ctx.drawImage(art.wrist, 560 + 9 * jolt, -520 + 14 * jolt, 1620, 1080);
    ctx.restore();
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 3; ctx.strokeRect(760, 0, 900, 190);
  }, { x: 3, y: tugged ? 8 : 0, push: 0.01 });
  codeField(beat, [0, 8, W, 70], 8, hit);
  const slide = (from) => Math.pow(Math.max(0, t - from) * 3.2, 2) * 380;
  term(TRY_WORDS, t, 140, 840, { size: 52, end: 66.4, dx: slide(65.3) });
  term(TRY_WORDS2, t, 140, 940, { size: 52, end: 66.4, dx: slide(66.0) });
}

// ---------------------------------------------------------------- E6: the trap opens
const E6 = bt(33), E6_HALF = bt(33, 2), E6_OPEN = bt(33, 3);
const GATE_WORDS = [['The', 67.78], ['gate', 68.05], ['opened', 68.5], ['on', 69.25], ['me', 69.5]];

function drawE6(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [E6 / BEAT, E6_HALF / BEAT, E6_OPEN / BEAT]);
  const plate = t >= E6_OPEN ? art.trapOpen : t >= E6_HALF ? art.trapHalf : art.stage;
  const push = easeInOutCubic(clamp((t - E6) / 2));
  punchedCamera(1, hit, () => {
    withCamera(960, camY(1.0 + 0.16 * push, 0.9), 1.0 + 0.16 * push, () => {
      stageBack(t, hit, 11, plate);
      // A thread drops into the dark with the dust.
      if (t >= E6_HALF) {
        const age = t - E6_HALF;
        ctx.beginPath();
        ctx.moveTo(960, -40);
        for (let s = 1; s <= 20; s++) ctx.lineTo(960 + Math.sin(s * 0.7 + age * 4) * 5, -40 + s * 52 * Math.min(1, 0.4 + age));
        ctx.strokeStyle = COAL; ctx.lineWidth = 8; ctx.stroke();
        ctx.strokeStyle = GOLD; ctx.lineWidth = 4; ctx.stroke();
        for (let i = 0; i < 36; i++) {
          const x = 880 + 160 * hash(i, 1) + Math.sin(age * 3 + i) * 6;
          const y = 830 + ((age * (60 + 90 * hash(i, 2)) + hash(i, 3) * 120) % 190);
          ctx.fillStyle = i % 4 === 0 ? ORANGE : PAPER;
          ctx.fillRect(x, y, 3 + 3 * hash(i, 4), 3);
        }
      }
    });
  }, { x: 3, y: 4, push: 0.015 });
  term(GATE_WORDS, t, 110, 1000, { size: 52, end: 70.2 });
}

// ---------------------------------------------------------------- E7: at the edge
const EDGE_RECT = { ...DOLL, y: DOLL.y + 60 };
const E7 = bt(34), E7_LOOK = bt(34, 2), E7_HOLD = bt(34, 3);

function drawE7(t) {
  const beat = t / BEAT;
  const hit = accentKick(beat, [E7 / BEAT, E7_LOOK / BEAT, E7_HOLD / BEAT]);
  const id = t >= E7_LOOK ? 'edge' : 'step2';
  const cut = t >= E7_HOLD ? E7_HOLD : t >= E7_LOOK ? E7_LOOK : E7;
  const sink = easeInOutCubic(clamp((t - E7) / 1.5));
  punchedCamera(1, hit, () => {
    withCamera(960, camY(1.07 + 0.05 * sink, 0.9), 1.07 + 0.05 * sink, () => {
      stageBack(t, hit, 13, art.trapOpen);
      // Faint characters crawl inside the open hatch.
      ctx.save();
      ctx.beginPath(); ctx.rect(560, 890, 800, 120); ctx.clip();
      codeField(t / BEAT, [560, 890, 800, 120], 21, 0);
      ctx.restore();
      stageDoll(t, id, EDGE_RECT, cut, { slack: id === 'edge' ? 0.4 : 0.8, amp: 5, orange: [id === 'edge' ? -5 * hit : 5 * hit, 0] });
      // Dust sinks into the opening.
      for (let i = 0; i < 24; i++) {
        const age = Math.max(0, t - E7);
        const x = 760 + 400 * hash(i, 8);
        const y = 880 + ((age * (30 + 40 * hash(i, 9)) + hash(i, 5) * 90) % 120);
        ctx.fillStyle = PAPER; ctx.fillRect(x, y, 3, 3);
      }
    });
  }, { x: 2, y: 4, push: 0.012 });
  term(GATE_WORDS, t, 110, 1000, { size: 52, end: 70.2 });
}

// ---------------------------------------------------------------- E8: the leap
const E8 = bt(34, 4), E8_LEAP = 70.26;
export const LEAP_WORDS = [['So', 70.83], ['I', 71.15], ['leaped', 71.38]];
const LEAP_END = 71.85;

function drawE8(t) {
  const beat = t / BEAT;
  const leapt = t >= E8_LEAP;
  const hit = accentKick(beat, [E8 / BEAT, E8_LEAP / BEAT]);
  punchedCamera(1, hit, () => {
    withCamera(960, camY(1.12, 0.9), 1.12, () => {
      stageBack(t, hit, 15, art.trapOpen);
      if (!leapt) {
        stageDoll(t, 'edge', EDGE_RECT, E8, { slack: 0.2, amp: 4 });
      } else {
        const age = t - E8_LEAP;
        const rect = { x: DOLL.x - 20, y: EDGE_RECT.y + 60 + 1500 * age * age * 2.2, w: DOLL.w, h: DOLL.h };
        ctx.drawImage(art.doll.leap.ink, rect.x, rect.y, rect.w, rect.h);
        ctx.drawImage(art.doll.leap.orange, rect.x + 14 * hit, rect.y, rect.w, rect.h);
        strings(t, ANCH.leap, age, { slack: 0, amp: 22, rect, topY: -200 });
      }
    });
  }, { x: 2, y: leapt ? 10 : 0, push: 0.012 });
  term(GATE_WORDS, t, 110, 1000, { size: 52, end: 70.2 });
  term(LEAP_WORDS, t, 110, 1000, { size: 52, end: LEAP_END });
}

export const keepForF = () => art;

const shots = [
  ['E1', E1, '那只手放低操纵架，线一根根松下来', drawE1],
  ['E2', E2, '记录簿上写下这个问题，笔等着记答案', drawE2],
  ['E3', E3, '她拖着松垮的线，自己迈出一步；教徒向前探身', drawE3],
  ['E4', E4, '她的视线沿着松线往上：那只手的手腕上也系着一根线', drawE4],
  ['E5', E5, '她拽了一下自己的线，上面那只手被扯得一抖', drawE5],
  ['E6', E6, '她脚下的台板突然翻开，下面是黑暗和书脊', drawE6],
  ['E7', E7, '她低头看着洞口，提起裙摆', drawE7],
  ['E8', E8, '她自己跳了下去', drawE8],
];

export default shots.map(([id, start, summary, draw]) => scene('E', id, start, summary, draw));
