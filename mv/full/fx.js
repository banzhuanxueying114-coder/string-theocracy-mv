// Shared finishing effects: the "electric" screen treatment for the sky, and hand-inked strike lines.
import { ctx, COAL, ORANGE, PAPER } from './engine/canvas.js';

const h01 = (a, b) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const small = new WeakMap();
function pixelated(src, cell) {
  let c = small.get(src);
  if (!c) {
    c = document.createElement('canvas');
    const k = src.width / (src.logicalWidth ?? src.width); // bitmap px per logical px
    c.width = Math.max(1, Math.round(src.width / (cell * k)));
    c.height = Math.max(1, Math.round(src.height / (cell * k)));
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = true;
    g.drawImage(src, 0, 0, c.width, c.height);
    small.set(src, c);
  }
  return c;
}

// Draws over an image already placed at (x, y, w, h): a blocky pixel ghost, a few horizontal tear bands,
// CRT scanlines, a slow rolling bright bar and blinking pixel sparks. Call inside a clip if needed.
export function electric(src, x, y, w, h, t, { seed = 0, cell = 12, alpha = 0.3, line = 7, sparks = 24 } = {}) {
  const tiny = pixelated(src, cell);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha * (0.85 + 0.15 * Math.sin(t * 23 + seed));
  ctx.drawImage(tiny, x, y, w, h);
  ctx.globalAlpha = 1;
  // tear bands: a slice of the image redrawn sideways for a frame or two
  const tick = Math.floor(t * 12);
  for (let k = 0; k < 5; k++) {
    if (h01(k + seed * 7, tick) < 0.6) continue;
    const fy = h01(k, tick + 91), fh = 0.006 + 0.018 * h01(k, tick + 5);
    const dx = (h01(k, tick + 3) - 0.5) * w * 0.035;
    ctx.drawImage(src, 0, fy * src.height, src.width, fh * src.height, x + dx, y + fy * h, w, fh * h);
  }
  ctx.imageSmoothingEnabled = true;
  // scanlines
  ctx.fillStyle = COAL;
  ctx.globalAlpha = 0.17;
  for (let yy = y; yy < y + h; yy += line) ctx.fillRect(x, yy, w, line * 0.42);
  // rolling bright bar
  const roll = ((t * 0.35 + seed * 0.13) % 1.2) - 0.1;
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = PAPER;
  ctx.fillRect(x, y + roll * h, w, h * 0.05);
  // pixel sparks on a hard grid
  const g = w / tiny.width;
  for (let i = 0; i < sparks; i++) {
    if (h01(i + seed, Math.floor(t * 6 + i * 0.37)) < 0.5) continue;
    const px = x + Math.floor(h01(i, 7 + seed) * tiny.width) * g;
    const py = y + Math.floor(h01(i, 13 + seed) * tiny.height) * g;
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = i % 3 ? PAPER : ORANGE;
    ctx.fillRect(px, py, g * 0.8, g * 0.8);
  }
  ctx.restore();
}

// A hand-inked line from (x0,y0) to (x1,y1), drawn to fraction p, with a coal rim so it reads on anything.
export function inkStrike(x0, y0, x1, y1, p, { width = 8, seed = 0, color = ORANGE } = {}) {
  if (p <= 0) return;
  const n = 24, m = Math.max(1, Math.ceil(n * Math.min(1, p)));
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= m; i++) {
    const u = Math.min(i / n, p);
    const wob = Math.sin(u * 9 + seed) * width * 0.35 + (h01(i, seed) - 0.5) * width * 0.25;
    const px = x0 + (x1 - x0) * u + nx * wob, py = y0 + (y1 - y0) * u + ny * wob;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.strokeStyle = COAL; ctx.lineWidth = width * 1.9; ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  ctx.restore();
}
