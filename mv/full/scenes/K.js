import { scene } from '../timeline.js';
import { ctx, W, H, PAPER, ORANGE, COAL, GOLD, clamp, text } from '../engine/canvas.js';
import { easeInOutCubic } from '../motion.js';
import { BEAT } from './E.js';
import { plate, plateCam, handWords, thread, sideDust, prepareJKL } from './JKL.js';

let art;
export async function prepareK() {
  await prepareJKL();
  art = {
    u1: await plate('K/K01_unthread_1.png'),
    u2: await plate('K/K01_unthread_2.png'),
    k2: await plate('K/K02_hand_to_doll.png'),
    k3: await plate('K/K03_booth_hand.png'),
    k4: await plate('K/K04_jointed_reach.png'),
    k5: await plate('K/K05_linked_nave_b.png'),
  };
}

const K1 = 136.585, K1B = 137.10, K2 = 138.1, K3 = 138.7, K4 = 139.2, K5 = 139.7, KEND = 140.723;

// Lyrics ride across the cuts, each in its own place.
const DRAG = [['Dragging', 136.83], ['out', 137.2]];
const ONE = [['One', 137.99], ['line', 138.2]];
const TWO = [['Two', 138.58], ['lines', 138.85]];
const THREE = [['Three', 139.18], ['lines', 139.42]];
const CONNECT = [['Connect', 140.05], ['our', 140.4], ['hands', 140.6]];
export function drawKLyrics(t) {
  const k = clamp((t - 136.83) / 1.16);
  handWords(DRAG, t, 960 - 220 * k, 925, 130, { align: 'center', until: 137.99 });
  handWords(ONE, t, 1310, 330, 150, { align: 'center', until: 138.58 });
  handWords(TWO, t, 640, 390, 150, { align: 'center', until: 139.18 });
  handWords(THREE, t, 90, 250, 150, { until: 139.95 });
  handWords(CONNECT, t, 960, 1015, 130, { align: 'center', until: 141.1 });
}

// The long edge lines that keep running along the bottom while the next hands are reached for.
function edgeLine(t, y, seed, from = 0) {
  thread([from, y], [W + 40, y], t, { seed, sway: 3 });
}

// ring and finger positions are in plate space (the plate is drawn at -120,-67, 2160 wide)
const RING1 = [1144, 459], TIP1 = [1087, 318];
const RING2 = [1153, 454], PINCH2 = [832, 306];
function drawK1(t) {
  const u = t - K1;
  const second = t >= K1B;
  const cx = 1020 - 90 * easeInOutCubic(clamp(u / 1.5));
  plateCam(second ? art.u2 : art.u1, cx, 520, 1.1, () => {
    if (!second) {
      thread(RING1, TIP1, t, { slack: 14, sway: 3, seed: 1 });
    } else {
      const g = clamp((t - K1B) / 0.28);
      thread(RING2, PINCH2, t, { grow: g, slack: 46 * (1 - g * 0.6), sway: 5, seed: 1, dir: -1 });
    }
  });
  drawKLyrics(t);
}

const FINGER2 = [974, 459], RING_D = [1641, 445];
function drawK2(t) {
  const u = t - K2;
  plateCam(art.k2, 1000 + 30 * u, 500, 1.06, () => {
    const g = easeInOutCubic(clamp(u / 0.28));
    thread(FINGER2, RING_D, t, { grow: g, slack: 8, sway: 10, seed: 2, dir: 1 });
  });
  drawKLyrics(t);
}

const BOOTH = [1102, 505];
function drawK3(t) {
  const u = t - K3;
  const z = 1.0 + 0.3 * easeInOutCubic(clamp(u / 0.5));
  plateCam(art.k3, 1000 - 80 * (z - 1), 520, z, () => {
    const g = easeInOutCubic(clamp(u / 0.28));
    thread([-200, BOOTH[1]], BOOTH, t, { grow: g, slack: 6, sway: 6, seed: 3, dir: 1 });
  });
  edgeLine(t, 1035, 5);
  drawKLyrics(t);
}

const PALM = [818, 470];
function drawK4(t) {
  const u = t - K4;
  plateCam(art.k4, 1000, 520, 1.0 + 0.06 * clamp(u / 0.5), () => {
    const g = easeInOutCubic(clamp(u / 0.26));
    thread([-200, PALM[1] + 6], PALM, t, { grow: g, slack: 4, sway: 8, seed: 4, dir: 1 });
  });
  edgeLine(t, 1035, 5);
  edgeLine(t, 985, 6);
  drawKLyrics(t);
}

// anchors in plate space for K05_linked_nave_b: clasped hands, the booth doll's hand, the bare hand
const CLASP = [974, 447], BOOTHHAND = [1656, 178], BARE = [1528, 507];
function drawK5(t) {
  const u = t - K5;
  const z = 1.2 - 0.2 * easeInOutCubic(clamp(u / 1.0));
  plateCam(art.k5, 1000, 500, z, () => {
    // each line leaves its hand horizontally and ends in a swaying free tip, reaching toward the next hand
    thread([940, CLASP[1] + 4], [CLASP[0] + 6, CLASP[1] + 4], t, { sway: 1, seed: 7 });
    thread(BOOTHHAND, [1230, BOOTHHAND[1] + 6], t, { slack: 2, sway: 8, seed: 8, dir: -1 });
    thread(BARE, [1250, BARE[1] + 4], t, { slack: 2, sway: 8, seed: 9, dir: -1 });
  });
  drawKLyrics(t);
}

export default [
  scene('K', 'K1', '67.1', '她把线从新人偶手腕的铜环里抽出来', drawK1),
  scene('K', 'K2', K2, '第一根线横着，从她的手到新人偶的手', drawK2),
  scene('K', 'K3', K3, '第二根，连到墙上小戏台里的一个人偶', drawK3),
  scene('K', 'K4', K4, '第三根，连到那只褪了手套的手', drawK4),
  scene('K', 'K5', K5, '远景：线全是横的，手连着手，没有一根再向上', drawK5),
];
