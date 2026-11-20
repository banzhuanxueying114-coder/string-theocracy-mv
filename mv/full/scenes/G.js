import { scene } from '../timeline.js';
import { MARIONETTE } from './F.js';
import { ctx, W, H, SCALE, PAPER, ORANGE, COAL, GOLD, DIM_COAL, MONO, RULES, clamp, text } from '../engine/canvas.js';
import { beatAge, easeOutExpo, kick, spring } from '../motion.js';
import { accentKick } from '../accent.js';
import { codeField, punchedCamera } from './B.js';
import { BEAT, bt, hash, term } from './E.js';
import { plate, pose, raw, plateCam, drawPose, stepAt } from './JKL.js';

let art;

export async function prepareG() {
  const icon = await raw('common/icon_window.png');
  const ic = document.createElement('canvas');
  ic.width = 1200 * SCALE; ic.height = 1800 * SCALE;
  ic.getContext('2d').drawImage(icon, 0, 0, ic.width, ic.height);
  art = {
    ic,
    offer: await plate('G/G01_offer_thread.png'),
    hide: await plate('G/G01_hide_shears.png'),
    chest: [await plate('G/G02_chest_1.png'), await plate('G/G02_chest_2.png'), await plate('G/G02_chest_3.png')],
    face: [await pose('G/G03_repaint_1.png', 1920), await pose('G/G03_repaint_2.png', 1920), await pose('G/G03_repaint_3.png', 1920)],
    seam: [await plate('G/G04_glove_seam_1.png'), await plate('G/G04_glove_seam_2.png')],
    peel: await plate('G/G05_peel.png'),
    bare: await pose('G/G05_bare_hand.png', 1920),
    fallen: await plate('G/G05_fallen_glove.png'),
    hood: [await plate('G/G06_hood_reveal_1.png'), await plate('G/G06_hood_reveal_2.png')],
    cu: await plate('common/congregation_up.png'),
  };
}

const G1 = bt(44), G2 = bt(45), G3 = bt(46), G4 = bt(47), G5 = bt(48, 3), G6 = bt(49, 4), G7 = bt(50, 3), GEND = bt(51, 2);

// Word onsets are estimates from the vocal energy (out/tmp/vox_ghi.py).
const TUG = [['Here,', 90.75], ['tug', 91.2], ['on', 91.55], ['my', 91.72], ['thread', 92.0]];
const SPREAD = [['Spread', 92.55], ['me', 92.85], ['open', 93.2], ['for', 93.62], ['dolly', 93.88], ['pink', 94.36]];
const SNOW = [['snow', 94.68], ['white', 94.9], ['artificial', 95.23], ['beauty', 95.75]];
const MACHINES = [['Maybe', 96.75], ['we\'re', 97.42], ['all', 97.85], ['cold', 98.02], ['machines', 98.3]];
const STUFFED = [['Stuffed', 99.1], ['in', 99.5], ['the', 99.84], ['human', 100.05], ['skin', 100.39]];
const SINS = [['With', 101.15], ['human', 101.39], ['sins', 101.82]];
export const SEWED = [['Sewed', 102.43], ['up', 102.7], ['by', 102.96], ['the', 103.4], ['gods', 103.6], ['of', 103.98], ['city', 104.2]];

const hitAt = (t, cuts) => accentKick(t / BEAT, cuts.map((c) => c / BEAT));
const topCode = (t, seed, hit) => codeField(t / BEAT, [0, 8, W, 70], seed, hit);

function goldLine(pts, width = 4) {
  for (const [wd, c] of [[width * 2, COAL], [width, GOLD]]) {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (const p of pts.slice(1)) ctx.lineTo(...p);
    ctx.strokeStyle = c; ctx.lineWidth = wd; ctx.lineJoin = 'round'; ctx.stroke();
  }
}

// ---------------------------------------------------------------- G1: thread to the glove / shears under the table
const G1_HIDE = bt(44, 4);
function drawG1(t) {
  const hit = hitAt(t, [G1, G1_HIDE]);
  const hide = t >= G1_HIDE;
  const age = t - (hide ? G1_HIDE : G1);
  punchedCamera(1, hit, () => {
    if (!hide) plateCam(art.offer, 960, 520, 1.02 + 0.05 * clamp(age / 1.5));
    else plateCam(art.hide, 980 - 40 * clamp(age / 1.5), 640, 1.06 + 0.04 * clamp(age / 1.5));
  }, { x: 3, y: 4, push: 0.012 });
  topCode(t, 61, hit);
  term(MARIONETTE, t, 110, 1000, { size: 56, end: 90.6 });
  term(TUG, t, 110, 230, { size: 56 });
}

// ---------------------------------------------------------------- G2: chest plate opens in three key poses
const G2_CUTS = [G2, bt(45, 3), bt(45, 4)];
function drawG2(t) {
  const hit = hitAt(t, G2_CUTS);
  const n = stepAt(t, G2_CUTS);
  const age = t - G2_CUTS[n];
  punchedCamera(1, hit, () => {
    plateCam(art.chest[n], 960, 560, 1.03 + 0.02 * n + 0.02 * clamp(age), () => {
      if (n < 2) return;
      // orange glints between the gears, on/off, never faded
      for (let i = 0; i < 7; i++) {
        if (Math.floor(t * 6 + i * 1.7) % 3) continue;
        const x = 760 + hash(i, 71) * 400, y = 420 + hash(i, 72) * 420;
        ctx.fillStyle = ORANGE; ctx.fillRect(x, y, 10, 10);
        ctx.fillStyle = PAPER; ctx.fillRect(x + 3, y + 3, 4, 4);
      }
    });
  }, { x: 2, y: 5, push: 0.014 });
  topCode(t, 67, hit);
  term(TUG, t, 110, 230, { size: 56, end: 92.5 });
  term(SPREAD, t, 110, 1000, { size: 56 });
}

// ---------------------------------------------------------------- G3: crack painted over, pink blush
const G3_CUTS = [G3, bt(46, 3), bt(46, 4)];
function faceShot(t) {
  const hit = hitAt(t, G3_CUTS);
  const n = stepAt(t, G3_CUTS);
  const snap = spring((t - G3_CUTS[n]) / BEAT, 2.6, 15);
  ctx.fillStyle = COAL; ctx.fillRect(0, 0, W, H);
  codeField(t / BEAT, [0, 0, W, H], 73, hit);
  punchedCamera(1, hit, () => {
    const z = 1.0 + 0.04 * clamp((t - G3) / 2);
    ctx.save();
    ctx.translate(960, 540); ctx.scale(z, z); ctx.translate(-960, -540);
    drawPose(art.face[n], 3 * snap, -100 - 2 * snap, 1920, 1280, [8 * hit, 0]);
    ctx.restore();
  }, { x: 2, y: 3, push: 0.01 });
  topCode(t, 79, hit);
}
function drawG3(t) {
  faceShot(t);
  if (t < 94.62) term(SPREAD, t, 110, 1000, { size: 56 });
  term(SNOW, t, 1810, 1000, { size: 56, align: 'right' });
}

// ---------------------------------------------------------------- G4: the glove seam opens on a ball joint
const G4_OPEN = bt(48);
function drawG4(t) {
  const hit = hitAt(t, [G4, G4_OPEN]);
  const open = t >= G4_OPEN;
  const age = t - G4;
  punchedCamera(1, hit, () => {
    plateCam(art.seam[open ? 1 : 0], 1060, 470, 1.05 + 0.1 * clamp(age / 3) + (open ? 0.06 : 0));
  }, { x: 3, y: 3, push: 0.012 });
  topCode(t, 83, hit);
  term(SNOW, t, 1810, 1000, { size: 56, align: 'right', end: 96.55 });
  term(MACHINES, t, 110, 1000, { size: 56 });
}

// ---------------------------------------------------------------- G5: the glove peels off like skin, falls under the table
const G5_BARE = bt(49), G5_FALL = bt(49, 2);
function drawG5(t) {
  const cuts = [G5, G5_BARE, G5_FALL];
  const hit = hitAt(t, cuts);
  const n = stepAt(t, cuts);
  const age = t - cuts[n];
  punchedCamera(1, hit, () => {
    if (n === 0) plateCam(art.peel, 1040, 480, 1.08 + 0.04 * clamp(age));
    else if (n === 1) {
      ctx.fillStyle = COAL; ctx.fillRect(0, 0, W, H);
      const drop = 30 * spring(age / BEAT, 2.4, 10);
      drawPose(art.bare, 0, -100 + drop, 1920, 1280, [8 * hit, 0]);
    } else plateCam(art.fallen, 940, 640, 1.04 + 0.05 * clamp(age / 1.5));
  }, { x: 2, y: 5, push: 0.012 });
  // decode scan: a hard column of mono text sweeps the bare porcelain
  if (n === 1) {
    const x = 260 + ((t - G5_BARE) / BEAT) * 1100 % 1150;
    ctx.fillStyle = ORANGE; ctx.fillRect(x, 80, 4, 800);
    for (let r = 0; r < 24; r++) {
      const str = RULES[r % RULES.length];
      const c = Math.floor(hash(r, Math.floor(t * 12)) * str.length);
      text(str.slice(c, c + 6), x + 10, 110 + r * 32, 18, r % 4 ? ORANGE : PAPER, MONO);
    }
  }
  topCode(t, 89, hit);
  term(STUFFED, t, 1810, 1000, { size: 40, align: 'right' });
}

// The tally scroll gets a readable slip pinned over it: the count is of wants, and every want is reset.
const LEDGER = [
  ['#0409', 'wants 2', 'reset'],
  ['#0410', 'wants 0', 'obedient'],
  ['#0411', 'wants 1', 'reset'],
  ['#0412', 'wants 4', 'reset'],
  ['#0413', 'wants 1', 'reset'],
];
function ledgerSlip(t) {
  const x = 1232, y = 380, w = 320, h = 300;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(0.018);
  ctx.fillStyle = COAL; ctx.fillRect(5, 7, w, h);
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = ORANGE; ctx.fillRect(0, 0, w, 6);
  text('LEDGER OF WANTS', 16, 40, 24, COAL, MONO);
  ctx.fillStyle = COAL; ctx.fillRect(16, 52, w - 32, 2);
  // the newest row writes itself in as the quill moves
  const rows = Math.min(LEDGER.length, 3 + Math.floor(Math.max(0, t - G6) / 0.5));
  LEDGER.slice(0, rows).forEach(([id, n, out], i) => {
    const yy = 88 + i * 34;
    text(id, 16, yy, 20, DIM_COAL, MONO);
    text(n, 104, yy, 20, COAL, MONO);
    text(out, 208, yy, 20, out === 'reset' ? ORANGE : COAL, MONO);
  });
  text('if (doll.wants()) doll.reset();', 16, h - 22, 15, ORANGE, MONO);
  ctx.restore();
}

// ---------------------------------------------------------------- G6: a hood slides back on a seamed porcelain face
const G6_OFF = bt(50);
function drawG6(t) {
  const hit = hitAt(t, [G6, G6_OFF]);
  const off = t >= G6_OFF;
  const age = t - G6;
  punchedCamera(1, hit, () => {
    plateCam(art.hood[off ? 1 : 0], 720 + 30 * clamp(age), 470, 1.12 + 0.05 * clamp(age / 1.5) + (off ? 0.05 : 0), () => ledgerSlip(t));
  }, { x: 3, y: 3, push: 0.014 });
  topCode(t, 97, hit);
  term(SINS, t, 1810, 1000, { size: 64, align: 'right' });
}

// ---------------------------------------------------------------- G7: pull back, every hood sewn up to the icon's palms
const G7_ICON = bt(51);
// Hood tops on congregation_up (canvas coords of the 2160 plate drawn at -120,-67).
const HOODS = [
  [271, 595], [460, 595], [650, 595], [960, 595], [1270, 595], [1446, 595], [1648, 595],
  [69, 696], [393, 696], [960, 700], [1460, 696], [1838, 696],
  [177, 865], [960, 870], [1770, 865],
];
function sewn(t, from, to, grow, seed) {
  const pts = [];
  for (let k = 0; k <= 14; k++) {
    const s = (k / 14) * grow;
    const wob = Math.sin(s * Math.PI) * (12 + 10 * hash(seed, 3)) * Math.sin(t * 3 + seed);
    pts.push([from[0] + (to[0] - from[0]) * s + wob, from[1] + (to[1] - from[1]) * s]);
  }
  goldLine(pts, 5);
  // stitch ticks crossing the thread
  for (let k = 1; k < 14; k += 2) {
    const [x, y] = pts[k];
    ctx.fillStyle = GOLD; ctx.fillRect(x - 7, y - 1, 14, 3);
  }
}
function drawG7(t) {
  const hit = hitAt(t, [G7, G7_ICON]);
  const icon = t >= G7_ICON;
  if (!icon) {
    const age = t - G7;
    const z = 1.6 - 0.6 * easeOutExpo(clamp(age / 0.9));
    punchedCamera(1, hit, () => {
      plateCam(art.cu, 960, 700, z, () => {
        HOODS.forEach((p, i) => sewn(t, p, [960 + (i % 2 ? 60 : -60), -300], clamp((age - i * 0.03) / 0.5), i));
      });
    }, { x: 2, y: 6, push: 0.012 });
  } else {
    const age = t - G7_ICON;
    ctx.fillStyle = COAL; ctx.fillRect(0, 0, W, H);
    codeField(t / BEAT, [0, 0, W, H], 101, hit);
    const z = 1.0 + 0.08 * clamp(age / 0.5);
    const h = 1080 * z, w = h * 2 / 3, x0 = W / 2 - w / 2, y0 = H / 2 - h / 2;
    ctx.drawImage(art.ic, x0, y0, w, h);
    // threads come up from below the frame and gather in the two open palms
    const palms = [[130, 1150], [1080, 1150]].map(([px, py]) => [x0 + px * w / 1200, y0 + py * h / 1800]);
    for (let i = 0; i < 16; i++) {
      const palm = palms[i % 2];
      const from = [80 + i * 118, H + 40];
      sewn(t, from, palm, 1, i + 20);
    }
  }
  topCode(t, 103, hit);
  term(SEWED, t, 960, 1010, { size: 56, align: 'center' });
}

const shots = [
  ['G1', G1, '大特写：她把腕上的线递到手套指尖；台面下，她另一只手摸到了剪刀', drawG1],
  ['G2', G2, '她的胸板像柜门一样被打开，里面是发条和齿轮，齿轮之间有一点橙光', drawG2],
  ['G3', G3, '画笔把裂纹涂白，在脸颊点上粉色腮红', drawG3],
  ['G4', G4, '她看着那只手：手套的缝线绽开，底下是球形关节', drawG4],
  ['G5', G5, '手套像一层皮一样被褪下来', drawG5],
  ['G6', G6, '一个教徒的兜帽滑落：一张带接缝的瓷脸，手里的记录簿写满了记号', drawG6],
  ['G7', G7, '远景：线像缝衣线一样穿过每个教徒，全部汇向圣像摊开的双手', drawG7],
];

export const G_END = GEND;
export default shots.map(([id, start, summary, draw]) => scene('G', id, start, summary, draw));
