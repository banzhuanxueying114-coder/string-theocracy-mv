// Shared pieces for J (aftermath), K (lines) and L (put the book down).
import {
  ctx, W, H, PAPER, ORANGE, COAL, GOLD, DIM_COAL, DIM_PAPER, MONO, HAND, RULES,
  loadImages, clamp, text,
} from '../engine/canvas.js';
import { easeInOutCubic, easeOutExpo } from '../motion.js';
import { cropFrame, keyPose } from './C.js';
import { hash } from './E.js';

export const ASSETS = new URL('../../../art/full/', import.meta.url);
export { cropFrame, keyPose, hash };

export async function plate(path, width = 2160) {
  const [image] = await loadImages([path], ASSETS);
  return cropFrame(image, width);
}
export async function pose(path, width) {
  const [image] = await loadImages([path], ASSETS);
  return keyPose(image, width);
}
export async function raw(path) {
  const [image] = await loadImages([path], ASSETS);
  return image;
}

// Whole-layer camera on a 2160 x 1215 plate that is drawn at (-120,-67). The view is clamped to the plate.
export function plateCam(image, cx, cy, zoom, draw, { orange = null, dx = 0, dy = 0 } = {}) {
  const x = clamp(cx, -120 + 960 / zoom, 2040 - 960 / zoom);
  const y = clamp(cy, -67 + 540 / zoom, 1148 - 540 / zoom);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-x, -y);
  ctx.drawImage(image, -120 + dx, -67 + dy, 2160, 1215);
  if (draw) draw();
  ctx.restore();
}

// Orange plate kicked off register.
export function drawPose(p, x, y, w, h, off = [0, 0]) {
  ctx.drawImage(p.ink, x, y, w, h);
  if (off[0] || off[1]) ctx.drawImage(p.orange, x + off[0], y + off[1], w, h);
}

// ---------------------------------------------------------------- hand-written lyric
// Orange hand with a coal rim so it reads on paper and on dark plates alike.
export function hand(str, x, y, size, { align = 'left', rot = 0, spacing = 0, color = ORANGE, rim = COAL, alpha = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha *= alpha;
  ctx.font = `${size}px ${HAND}`;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(8, size * 0.24);
  ctx.strokeStyle = rim;
  ctx.fillStyle = color;
  const fat = (c, x, y) => { ctx.fillText(c, x, y); ctx.save(); ctx.lineWidth = size * 0.035; ctx.strokeStyle = color; ctx.strokeText(c, x, y); ctx.restore(); };
  // printed drop plate: a coal copy knocked down-right, so orange-on-orange plates still read
  const drop = (c, x, y) => { ctx.save(); ctx.fillStyle = rim; ctx.strokeText(c, x + size * 0.05, y + size * 0.06); ctx.restore(); };
  if (spacing === 0) {
    ctx.textAlign = align;
    drop(str, 0, 0);
    ctx.strokeText(str, 0, 0);
    fat(str, 0, 0);
  } else {
    ctx.textAlign = 'left';
    const chars = Array.from(str);
    const widths = chars.map((c) => ctx.measureText(c).width + spacing);
    const total = widths.reduce((a, b) => a + b, 0) - spacing;
    let px = align === 'center' ? -total / 2 : align === 'right' ? -total : 0;
    chars.forEach((c, i) => { drop(c, px, 0); px += widths[i]; });
    px = align === 'center' ? -total / 2 : align === 'right' ? -total : 0;
    chars.forEach((c, i) => { ctx.strokeText(c, px, 0); fat(c, px, 0); px += widths[i]; });
  }
  ctx.restore();
}

// One line of words; each word lands on its own onset. Positions are fixed from the full line so
// nothing reflows when a word arrives. opts.until hides the line, opts.spreadAt(t) -> letter spacing.
export function handWords(words, t, x, y, size, { align = 'left', rot = 0, until = Infinity, spacing = () => 0, lift = () => 0 } = {}) {
  if (t < words[0][1] || t >= until) return;
  ctx.save();
  ctx.font = `${size}px ${HAND}`;
  const space = ctx.measureText(' ').width;
  const base = words.map(([w]) => ctx.measureText(w).width);
  const widths = words.map(([w], i) => base[i] + (t >= words[i][1] ? spacing(t, i) : 0) * Math.max(0, Array.from(w).length - 1));
  const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  ctx.restore();
  let px = align === 'center' ? -total / 2 : align === 'right' ? -total : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  words.forEach(([w, at], i) => {
    if (t >= at) {
      const age = t - at;
      const sp = spacing(t, i);
      // hard arrival: one frame of overshoot, no tween
      const pop = age < 0.07 ? 1.1 : 1;
      ctx.save();
      ctx.translate(px + widths[i] / 2, lift(t, i));
      ctx.scale(pop, pop);
      hand(w, -widths[i] / 2, 0, size, { spacing: sp });
      ctx.restore();
    }
    px += widths[i] + space;
  });
  ctx.restore();
}

// ---------------------------------------------------------------- falling glass
let shards = [];
const GLASS = [1, 2, 4, 7, 8, 10, 11, 14, 16, 17, 21, 23, 24, 25, 26, 28];
export const PETALS = [30, 31, 32, 33, 34];
export async function prepareJKL() {
  const names = [...GLASS, ...PETALS].map((i) => `common/frag/f${String(i).padStart(2, '0')}.png`);
  const imgs = await loadImages(names, ASSETS);
  shards = imgs;
}
const glassImg = (k) => shards[k % GLASS.length];

// Three speeds: far (slow, small), mid, near (large, fast). Everything loops vertically.
export const LAYERS = [
  { speed: 38, scale: 0.17, n: 26, spin: 0.35 },
  { speed: 92, scale: 0.28, n: 18, spin: 0.7 },
  { speed: 190, scale: 0.46, n: 9, spin: 1.1 },
];
export function glassFall(t, { layers = LAYERS, seed = 0, bounds = [0, 0, W, H], drift = 14, t0 = 0, only = null } = {}) {
  const [bx, by, bw, bh] = bounds;
  ctx.save();
  ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
  layers.forEach((layer, li) => {
    if (only != null && li !== only) return;
    for (let i = 0; i < layer.n; i++) {
      const id = i + li * 100 + seed;
      const k = Math.floor(hash(id, 1) * GLASS.length);
      const img = glassImg(k);
      const sc = layer.scale * (0.75 + 0.5 * hash(id, 2));
      const w = img.width * sc, h = img.height * sc;
      const span = bh + h * 2;
      const y = by - h + (((hash(id, 3) * span) + (t - t0) * layer.speed * (0.8 + 0.4 * hash(id, 4))) % span);
      const x = bx + hash(id, 5) * bw + Math.sin((t - t0) * 0.6 + id) * drift * (li + 1);
      const rot = hash(id, 6) * 6.28 + (t - t0) * layer.spin * (hash(id, 7) - 0.5) * 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
  });
  ctx.restore();
}

// One big sprite, used for the wipes of shards that sweep the whole frame.
export function bigShard(k, x, y, scale, rot) {
  const img = glassImg(k);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
  ctx.restore();
}

// ---------------------------------------------------------------- dust that drifts sideways
export function sideDust(t, count, seed, { dir = 1, bounds = [0, 0, W, H], speed = 60 } = {}) {
  const [bx, by, bw, bh] = bounds;
  for (let i = 0; i < count; i++) {
    const v = speed * (0.4 + hash(i, seed + 1));
    const x = bx + ((hash(i, seed) * bw + dir * t * v) % bw + bw) % bw;
    const y = by + hash(i, seed + 2) * bh + Math.sin(t * 0.8 + i) * 8;
    ctx.fillStyle = i % 7 === 0 ? GOLD : i % 3 === 0 ? PAPER : DIM_PAPER;
    ctx.fillRect(x, y, 2 + (i % 3), 2 + (i % 2));
  }
}

// ---------------------------------------------------------------- horizontal thread
// A gold line with micro-text sliding along it. Points are [x,y]; sway is a small vertical wobble that
// grows toward the free end. grow 0..1 reveals the line from a -> b.
export function thread(a, b, t, { grow = 1, sway = 0, dir = 1, seed = 0, slack = 0, textColor = PAPER } = {}) {
  const sample = (s) => {
    const x = a[0] + (b[0] - a[0]) * s;
    const y = a[1] + (b[1] - a[1]) * s + Math.sin(Math.PI * s) * slack + Math.sin(t * 5 + s * 6 + seed) * sway * s;
    return [x, y];
  };
  const n = 40;
  const pts = [];
  for (let i = 0; i <= n * grow; i++) pts.push(sample(i / n));
  if (pts.length < 2) return pts;
  for (const [w, c] of [[14, COAL], [7, GOLD]]) {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (const p of pts.slice(1)) ctx.lineTo(...p);
    ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.stroke();
  }
  // micro-text flows along the line toward the end given by dir (1: a -> b)
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const count = Math.max(3, Math.floor(len / 70));
  for (let k = 0; k < count; k++) {
    let s = ((t * 0.35 * dir + k / count + hash(k, seed) * 0.05) % 1 + 1) % 1;
    if (s > grow) continue;
    const [px, py] = sample(s);
    text(RULES[(k + seed) % RULES.length].slice(0, 3 + (k % 3)), px, py - 8, 14, textColor, MONO, 'center');
  }
  return pts;
}

// ---------------------------------------------------------------- misc
export const stepAt = (t, cues) => { let n = -1; cues.forEach((c, i) => { if (t >= c) n = i; }); return n; };
export { easeInOutCubic, easeOutExpo };

// Gold/orange text arc ("Hm-mm-mm") that sits along shards.
export function arcText(str, cx, cy, radius, a0, a1, size, shown, color = ORANGE) {
  const chars = Array.from(str);
  ctx.save();
  ctx.font = `${size}px ${HAND}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  chars.forEach((c, i) => {
    if (i >= shown) return;
    const a = a0 + (a1 - a0) * (chars.length === 1 ? 0 : i / (chars.length - 1));
    const x = cx + Math.cos(a) * radius, y = cy + Math.sin(a) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a + Math.PI / 2);
    ctx.lineWidth = Math.max(5, size * 0.1);
    ctx.strokeStyle = COAL;
    ctx.strokeText(c, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(c, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}
