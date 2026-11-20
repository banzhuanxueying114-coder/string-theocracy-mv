import { scene } from '../timeline.js';
import { ctx, W, H, SCALE, PAPER, ORANGE, COAL, GOLD, clamp, drawBurst } from '../engine/canvas.js';
import { beatAge, easeOutExpo, kick, spring } from '../motion.js';
import { accentKick } from '../accent.js';
import { codeField, punchedCamera } from './B.js';
import { BEAT, bt, hash } from './E.js';
import {
  plate, pose, raw, plateCam, drawPose, handWords, glassFall, bigShard, sideDust, stepAt, prepareJKL,
} from './JKL.js';
import { cutLine } from './H.js';
import { floorBurst } from './C.js';

let art;

async function portrait(path) {
  const image = await raw(path);
  const c = document.createElement('canvas');
  c.width = 1200 * SCALE; c.height = 1800 * SCALE;
  c.getContext('2d').drawImage(image, 0, 0, c.width, c.height);
  return c;
}

export async function prepareI() {
  await prepareJKL();
  art = {
    palm: [await plate('I/I01_palm_1.png'), await plate('I/I01_palm_2.png')],
    soil: [await plate('I/I02_soil_step_1.png'), await plate('I/I02_soil_step_2.png')],
    red: await plate('I/I03_foot_red.png'),
    back: await plate('I/I04_return.png'),
    turn: await plate('I/I04_hoods_turn.png'),
    wrist: [await plate('I/I05_bare_wrist.png'), await plate('I/I05_bare_wrist_2.png')],
    aisle: await plate('I/I06_aisle_pass.png'),
    ledger: [await plate('I/I06_close_ledger_1.png'), await plate('I/I06_close_ledger_2.png')],
    ns: await plate('common/nave_stage.png'),
    doll: await pose('I/I07_new_doll.png', 820),
    pair: await plate('I/I08_double.png'),
    raise: await plate('I/I09_raise_shears.png'),
    drop1: await pose('I/I07_descend_1.png', 900),
    drop2: await pose('I/I07_descend_2.png', 900),
    impact: [await plate('I/I10_glass_impact_1.png'), await plate('I/I10_glass_impact_2.png')],
    ic: await portrait('common/icon_window.png'),
    ie: await portrait('common/icon_empty_frame.png'),
  };
}

const I1 = bt(52), I2 = bt(52, 3), I3 = bt(53), I4 = bt(54), I5 = bt(55), I6 = bt(56), I7 = bt(57), I8 = bt(57, 3),
  I9 = bt(58, 3), I10 = bt(59), I11 = bt(59, 4), J1 = 122.102;

// Word onsets: CTC forced alignment on the demucs vocal stem (out/tmp/align.py), checked on spectrogram.
const BRAVERY = [['All', 107.28], ['that', 107.55], ['precious', 107.77], ['bravery', 108.25]];
const HURT = [['is', 109.2], ['gonna', 109.43], ['get', 109.8], ['you', 110.03], ['hurt', 110.2]];
const WORLD1 = [['In', 110.55], ['a', 110.8], ['world', 111.0], ['that', 111.22]];
const WORLD2 = [['feeds', 111.39], ['on', 111.72], ['the', 111.9], ['minority', 112.15]];
const BELIEF = [['May', 113.2], ['that', 113.55], ['self-centered', 113.82], ['belief', 114.55]];
const PEACE = [['lead', 115.65], ['you', 116.6], ['to', 116.8], ['peace', 116.97]];
const REPLACE = [['If', 117.19], ['you\'re', 117.42], ['gonna', 117.69], ['replace', 117.96], ['me', 118.47]];
const AUDACITY = [['At', 118.99], ['least', 119.25], ['have', 119.5], ['the', 119.67], ['audacity', 120.01]];
const KILL = [['to', 120.44], ['kill', 120.68], ['me', 120.94], ['thoroughly', 121.25]];

const hitAt = (t, cuts) => accentKick(t / BEAT, cuts.map((c) => c / BEAT));

// Two key poses on the same locked camera; the cut lands on a beat.
function pair(t, plates, cuts, cam, opts = {}) {
  const hit = hitAt(t, cuts);
  const n = stepAt(t, cuts);
  const age = t - cuts[0];
  const [cx, cy, z0, dz = 0.04, dur = 2] = cam;
  punchedCamera(1, hit, () => plateCam(plates[n], cx, cy, z0 + dz * clamp(age / dur), opts.draw), { x: 3, y: 4, push: 0.014 });
  return { hit, n };
}

// ---------------------------------------------------------------- I1: the fist opens by itself
function drawI1(t) {
  pair(t, art.palm, [I1, bt(52, 2)], [1000, 540, 1.02, 0.04, 1]);
  cutLine(t);
}

// ---------------------------------------------------------------- I2: bare foot into soil
function drawI2(t) {
  pair(t, art.soil, [I2, bt(52, 4)], [960, 600, 1.04, 0.06, 1]);
  cutLine(t);
  handWords(BRAVERY, t, 90, 300, 120, { rot: -0.03, until: 109.9 });
}

// ---------------------------------------------------------------- I3: one red drop
function drawI3(t) {
  pair(t, [art.red], [I3], [900, 560, 1.03, 0.08, 2]);
  handWords(BRAVERY, t, 90, 300, 120, { rot: -0.03, until: 109.9 });
  handWords(HURT, t, 1830, 1000, 120, { align: 'right', rot: 0.02, until: 110.55 });
}

// ---------------------------------------------------------------- I4: back on the stage; every hood turns
function drawI4(t) {
  const turn = bt(54, 3);
  pair(t, [art.back, art.turn], [I4, turn], [960, 540, 1.0, 0.05, 2]);
  handWords(HURT, t, 1830, 1000, 120, { align: 'right', rot: 0.02, until: 110.55 });
  handWords(WORLD1, t, 960, 230, 116, { align: 'center', until: 113.1 });
  handWords(WORLD2, t, 960, 1010, 116, { align: 'center', until: 113.1 });
}

// ---------------------------------------------------------------- I5: the string slides off the bare wrist
function drawI5(t) {
  pair(t, art.wrist, [I5, bt(55, 3)], [960, 540, 1.02, 0.05, 2]);
  handWords(WORLD1, t, 960, 230, 116, { align: 'center', until: 113.1 });
  handWords(WORLD2, t, 960, 1010, 116, { align: 'center', until: 113.1 });
  handWords(BELIEF, t, 110, 980, 116, { rot: -0.02, until: 115.55 });
}

// ---------------------------------------------------------------- I6: down the aisle; closes one ledger
function drawI6(t) {
  const cuts = [I6, bt(56, 3), bt(56, 4)];
  const n = stepAt(t, cuts);
  const hit = hitAt(t, cuts);
  const age = t - I6;
  punchedCamera(1, hit, () => {
    if (n === 0) plateCam(art.aisle, 960, 600, 1.02 + 0.12 * clamp(age / 1.1));
    else plateCam(art.ledger[n - 1], 960, 600, 1.04);
  }, { x: 3, y: 4, push: 0.014 });
  handWords(BELIEF, t, 110, 980, 116, { rot: -0.02, until: 115.55 });
  handWords(PEACE, t, 960, 240, 124, { align: 'center', until: 117.4 });
}

// ---------------------------------------------------------------- I7: a new doll is dropped onto the stage
// Beat 1: she falls in from above, hair and skirt lifted, strings paying out. Beat 2: hard cut to the
// landing pose, the strings snap taut and ring, the stage floor jolts, dust kicks out from her boots.
const I7_LAND = bt(57, 2);
const FEET_Y = 945;                       // stage floor, in plate coordinates
const D1 = { h: 780, hands: [[0.13, 0.38], [0.83, 0.38]], head: [0.5, 0.06] };
const D2 = { h: 740, hands: [[0.22, 0.53], [0.76, 0.53]], head: [0.5, 0.06] };
function stringTo(x0, y0, x1, y1, bow) {
  for (const [wd, c] of [[7, COAL], [3.5, GOLD]]) {
    ctx.beginPath(); ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2 + bow, (y0 + y1) / 2, x1, y1);
    ctx.strokeStyle = c; ctx.lineWidth = wd; ctx.stroke();
  }
}
function drawI7(t) {
  const landed = t >= I7_LAND;
  const hit = hitAt(t, [I7, I7_LAND]);
  const cx = 960;
  // camera: a slow tilt down while she falls, then a hard downward jolt on landing
  const jolt = landed ? 26 * spring((t - I7_LAND) / BEAT, 3.2, 7) : 0;
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(1.05, 1.05); ctx.translate(-W / 2, -H / 2 + jolt);
  plateCam(art.ns, 960, landed ? 600 : 560 + 40 * clamp((t - I7) / BEAT), 1.12, () => {
    let pose, spec, dy, bow;
    if (!landed) {
      // accelerating fall from above the frame; positions snap to 1/24 s so the drop reads as frames, not a tween
      const u = Math.floor(clamp((t - I7) / (I7_LAND - I7)) * 12) / 12;
      const fall = u * u;
      spec = D1; pose = art.drop1;
      dy = -spec.h * 0.45 + (FEET_Y - spec.h * 0.97 + spec.h * 0.45 - 120) * (0.15 + 0.85 * fall);
      bow = 30 * Math.sin(t * 9);
      // speed streaks on the strings' side
      for (let i = 0; i < 16; i++) {
        const x = cx - 360 + hash(i, 61) * 720, y = dy + hash(i, 62) * spec.h;
        ctx.fillStyle = i % 3 ? PAPER : GOLD; ctx.fillRect(x, y - 90, 3, 90 + 60 * hash(i, 63));
      }
    } else {
      spec = D2; pose = art.drop2;
      const a = (t - I7_LAND) / BEAT;
      // tiny rebound on the strings: up, then settles on the boards
      const rebound = -18 * Math.max(0, spring(a, 1.6, 6));
      dy = FEET_Y - spec.h * 0.97 + rebound;
      bow = 70 * spring(a, 4.5, 5);
      floorBurst(t, I7_LAND, cx - 60, FEET_Y);
      floorBurst(t, I7_LAND + 0.03, cx + 60, FEET_Y);
    }
    const dh = spec.h, dw = dh * 2 / 3, x0 = cx - dw / 2;
    const topY = -500;
    // flat contact shadow: grows as she nears the boards
    const near = clamp(1 - (FEET_Y - (dy + dh * 0.97)) / 600);
    ctx.fillStyle = COAL;
    ctx.beginPath(); ctx.ellipse(cx, FEET_Y + 6, 40 + 90 * near, 8 + 8 * near, 0, 0, 6.283); ctx.fill();
    [spec.hands[0], spec.head, spec.hands[1]].forEach(([fx, fy], i) => {
      const ax = x0 + fx * dw, ay = dy + fy * dh;
      stringTo(cx + (i - 1) * 150, topY, ax, ay, bow * (i - 1 || 0.5));
    });
    drawPose(pose, x0, dy, dw, dh, [8 * hit, 0]);
  });
  ctx.restore();
  codeField(t / BEAT, [0, 8, W, 70], 107, hit);
  handWords(PEACE, t, 960, 240, 124, { align: 'center', until: 117.4 });
}

// ---------------------------------------------------------------- I8: face to face, like the B6 mirror
function drawI8(t) {
  pair(t, [art.pair], [I8], [1000, 540, 1.02, 0.06, 2]);
  handWords(PEACE, t, 960, 240, 124, { align: 'center', until: 117.4 });
  handWords(REPLACE, t, 960, 1010, 120, { align: 'center', until: I9 });
}

// ---------------------------------------------------------------- I9: she raises the shears to the icon
function drawI9(t) {
  pair(t, [art.raise], [I9], [960, 620, 1.0, 0.08, 1]);
  handWords(AUDACITY, t, 960, 1010, 120, { align: 'center', until: 120.5 });
}

// ---------------------------------------------------------------- I10: the point goes in; cracks race the lead
// Impact point on the I10 plates (canvas coords of the 2160 plate drawn at -120,-67).
const HIT = [730, 513];
const I10_SPREAD = bt(59, 3);
// One paper frame on contact, then the plate slams in from a closer zoom and the frame shakes.
function shake(t, t0, amp, seed) {
  const a = t - t0;
  if (a < 0) return [0, 0];
  const k = amp * Math.exp(-a * 9);
  const f = Math.floor(a * 30);
  return [k * (hash(f, seed) * 2 - 1), k * (hash(f, seed + 1) * 2 - 1)];
}
function chips(t, t0, [ox, oy], n, seed, speed = 1) {
  const a = t - t0;
  if (a < 0 || a > 1.4) return;
  for (let i = 0; i < n; i++) {
    const ang = hash(i, seed) * 6.283, v = (500 + 1500 * hash(i, seed + 1)) * speed;
    const x = ox + Math.cos(ang) * v * a, y = oy + Math.sin(ang) * v * a + 1200 * a * a;
    bigShard(i + seed, x, y, (0.12 + 0.3 * hash(i, seed + 2)) * (1 + a * 1.5), ang + a * (5 + 6 * hash(i, seed + 3)));
  }
}
function drawI10(t) {
  const spread = t >= I10_SPREAD;
  const cut = spread ? I10_SPREAD : I10;
  const a = t - cut;
  const hit = hitAt(t, [I10, I10_SPREAD]);
  if (!spread && a < 1 / 30) { ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H); return; }
  const [sx, sy] = shake(t, cut, spread ? 22 : 34, spread ? 81 : 77);
  const punch = 0.22 * Math.max(0, spring(a / BEAT, 1.2, 9));
  ctx.save();
  ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(1.06, 1.06); ctx.translate(-W / 2, -H / 2);
  plateCam(art.impact[spread ? 1 : 0], HIT[0], HIT[1], 1.06 + punch + 0.03 * clamp(a), () => {
    if (!spread) {
      // extra cracks run out from the point in hard 1/15 s steps
      const steps = Math.min(6, Math.floor(a * 15) + 1);
      ctx.strokeStyle = PAPER; ctx.lineWidth = 4;
      for (let i = 0; i < 14; i++) {
        const ang = hash(i, 91) * 6.283, len = (160 + 520 * hash(i, 92)) * steps / 6;
        ctx.beginPath(); ctx.moveTo(...HIT);
        ctx.lineTo(HIT[0] + Math.cos(ang) * len * 0.55 + 18 * (hash(i, 93) - 0.5), HIT[1] + Math.sin(ang) * len * 0.55);
        ctx.lineTo(HIT[0] + Math.cos(ang) * len, HIT[1] + Math.sin(ang) * len);
        ctx.stroke();
      }
    }
    chips(t, cut, HIT, spread ? 26 : 16, spread ? 300 : 200, spread ? 1.3 : 1);
  });
  ctx.restore();
  drawBurst(t, I10, 960, 540, 13, [PAPER, ORANGE, COAL]);
  if (t < 120.5) handWords(AUDACITY, t, 960, 1010, 120, { align: 'center' });
  handWords(KILL, t, 960, spread ? 1010 : 240, 128, { align: 'center', until: 122.0 });
}

// ---------------------------------------------------------------- I11: the window goes; ivory floods; hands over to J1
// The I10 plate itself is cut into radial pieces around the impact point; every piece flies at the
// camera (grows), spins and falls, and the frame behind is plain ivory.
const PIECES = (() => {
  const out = [];
  const rings = [0, 90, 230, 420, 700, 1400];
  for (let r = 0; r < rings.length - 1; r++) {
    const n = 6 + r * 3;
    for (let k = 0; k < n; k++) {
      const j = (q) => (hash(r * 40 + k, q) - 0.5) * 0.35 / n * 6.283;
      const a0 = (k / n) * 6.283 + j(1), a1 = ((k + 1) / n) * 6.283 + j(2);
      const r0 = rings[r], r1 = rings[r + 1];
      const poly = [[a0, r0], [a1, r0], [a1, r1], [(a0 + a1) / 2, r1 * (1.05 + 0.1 * hash(k, r + 7))], [a0, r1]]
        .map(([a, rr]) => [Math.cos(a) * rr, Math.sin(a) * rr]);
      const mid = (a0 + a1) / 2, mr = (r0 + r1) / 2;
      out.push({ poly, c: [Math.cos(mid) * mr, Math.sin(mid) * mr], ring: r, seed: r * 40 + k });
    }
  }
  return out;
})();
function drawI11(t) {
  const a = t - I11;
  const hit = hitAt(t, [I11]);
  // behind the glass is J1's opening frame (empty window at zoom 1.5), so the pieces fly off to reveal
  // the very picture J1 starts on and the I->J cut becomes a continuation
  ctx.fillStyle = COAL; ctx.fillRect(0, 0, W, H);
  codeField(t / BEAT, [0, 0, W, H], 3, 0);
  { const ih = 1080 * 1.5, iw = ih * 2 / 3; ctx.drawImage(art.ie, W / 2 - iw / 2, H / 2 - ih * 0.5 - 15, iw, ih); }
  const [sx, sy] = shake(t, I11, 30, 97);
  // the plate is drawn with the same camera I10 ended on, so the cut is invisible until the pieces move
  // I10 ends at outer scale 1.06 x plateCam zoom 1.09, whose centre plateCam clamps to the plate edge
  const pz = 1.09, z = 1.06 * pz;
  const camX = clamp(HIT[0], -120 + 960 / pz, 2040 - 960 / pz), camY = clamp(HIT[1], -67 + 540 / pz, 1148 - 540 / pz);
  const ox = W / 2 - camX * z + sx, oy = H / 2 - camY * z + sy;
  const order = PIECES.slice().sort((p, q) => p.ring - q.ring);
  for (const p of order) {
    const delay = p.ring * 0.025;
    const u = Math.max(0, a - delay);
    const dir = Math.hypot(...p.c) || 1;
    const v = 260 + 900 * hash(p.seed, 3) + (4 - p.ring) * 120;
    // outward speed accelerates so every piece has left the frame by the J1 cut (~0.52 s)
    const out = v * u + 2600 * u * u;
    const dx = p.c[0] / dir * out, dy = p.c[1] / dir * out + 900 * u * u;
    const grow = 1 + u * (1.4 + 1.2 * hash(p.seed, 4));
    const rot = u * (hash(p.seed, 5) - 0.5) * 7;
    ctx.save();
    ctx.translate(ox + (HIT[0] + p.c[0] + dx) * z, oy + (HIT[1] + p.c[1] + dy) * z);
    ctx.rotate(rot); ctx.scale(grow * z, grow * z);
    ctx.beginPath();
    p.poly.forEach(([x, y], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x - p.c[0], y - p.c[1]));
    ctx.closePath();
    ctx.save(); ctx.clip();
    ctx.drawImage(art.impact[1], -120 - HIT[0] - p.c[0], -67 - HIT[1] - p.c[1], 2160, 1215);
    ctx.restore();
    ctx.strokeStyle = COAL; ctx.lineWidth = 5 / (grow * z); ctx.stroke();
    ctx.restore();
  }
  // a last wave of near shards whips past the lens
  chips(t, I11 + 0.08, [960, 540], 18, 400, 1.8);
  drawBurst(t, I11, 960, 540, 17, [COAL, ORANGE, GOLD]);
  handWords(KILL, t, 960, 1010, 128, { align: 'center', until: 122.0 });
}

const shots = [
  ['I1', I1, '一直攥着的拳头，她自己张开了', drawI1],
  ['I2', I2, '赤脚踩进泥土', drawI2],
  ['I3', I3, '碎瓷划破脚背，一滴红；她看着它', drawI3],
  ['I4', I4, '她从活门回到台上；所有兜帽同时转向她一个人', drawI4],
  ['I5', I5, '线抽下来，在她手腕上找不到铜环，滑开了', drawI5],
  ['I6', I6, '她走下台，穿过跪着的教徒，替其中一个合上记录簿', drawI6],
  ['I7', I7, '台上降下一具新的人偶，和她一模一样，闭着眼', drawI7],
  ['I8', I8, '她和替代品面对面，构图和 B6 的镜子一样', drawI8],
  ['I9', I9, '她转向圣像，举起剪刀', drawI9],
  ['I10', I10, '剪刀钉进圣像的玻璃脸，裂纹沿着铅条爬满整扇窗', drawI10],
  ['I11', I11, '整面圣像碎裂，白光涌进来', drawI11],
];

export default shots.map(([id, start, summary, draw]) => scene('I', id, start, summary, draw));
