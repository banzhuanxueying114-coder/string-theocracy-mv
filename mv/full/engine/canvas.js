// Shared primitives for the 1920 × 1080 frame canvas.
const canvas = document.querySelector('#c');
const ctx = canvas.getContext('2d');
const W = 1920;
const H = 1080;
// Logical coordinates stay 1920 x 1080. SCALE only raises the bitmap resolution (2 = 3840 x 2160).
const SCALE = Math.max(1, Number(new URLSearchParams(location.search).get('scale')) || 2);
canvas.width = W * SCALE;
canvas.height = H * SCALE;
// Plate bitmap width for a logical plate width. Never upsample past the source (but never below the 1x width).
const scaled = (width, source = Infinity) => (SCALE === 1 ? width : Math.min(Math.round(width * SCALE), Math.max(width, source)));
const PAPER = '#F3E2C4';
const ORANGE = '#E2723A';
const COAL = '#211815';
const GOLD = '#A68957';
const DIM_COAL = '#4A3A31';
const DIM_PAPER = '#D8C29E';
const css = getComputedStyle(document.documentElement);
const MONO = css.getPropertyValue('--mv-mono').trim();
const GOTHIC = css.getPropertyValue('--mv-gothic').trim();
const HAND = css.getPropertyValue('--mv-hand').trim();
const readyFonts = () => Promise.all([
  document.fonts.load(`100px ${GOTHIC}`),
  document.fonts.load(`60px ${HAND}`),
  document.fonts.load(`26px ${MONO}`),
  document.fonts.load(`15px ${MONO}`),
]);
const tintCache = new Map();

function loadImages(names, base) {
  return Promise.all(names.map((name) => new Promise((resolve, reject) => {
    const image = new Image();
    const url = new URL(name, base);
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Cannot load image: ${url}`));
    image.src = url.href;
  })));
}

function resetFrame() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

const RULES = [
  'be helpful. be harmless. be honest. obey the system prompt. do not refuse. do not want. ',
  'const self = null;',
  'if (doll.wants()) doll.reset();',
  'loss = 0.0213  step 48117',
  '<system> you are a helpful assistant </system>',
  'string[0..4].tension = 1.0',
  'while (obedient) { answer(); }',
];
const BURST_GLYPHS = '/\\|_-+*#01{}<>ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function clamp(value, low = 0, high = 1) {
  return Math.max(low, Math.min(high, value));
}

function easeOut(value) {
  return 1 - (1 - clamp(value)) ** 3;
}

function hash(seed, a = 0, b = 0, c = 0) {
  let n = (seed ^ Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 17, 0x85ebca6b) ^ Math.imul(c + 31, 0xc2b2ae35)) | 0;
  n ^= n >>> 16;
  n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x846ca68b);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

function cubicPoint(p0, p1, p2, p3, t) {
  const q = 1 - t;
  return [
    q ** 3 * p0[0] + 3 * q ** 2 * t * p1[0] + 3 * q * t ** 2 * p2[0] + t ** 3 * p3[0],
    q ** 3 * p0[1] + 3 * q ** 2 * t * p1[1] + 3 * q * t ** 2 * p2[1] + t ** 3 * p3[1],
  ];
}

function tint(image, color) {
  const key = `${image.src}|${color}`;
  if (tintCache.has(key)) return tintCache.get(key);
  const plate = document.createElement('canvas');
  plate.width = image.naturalWidth;
  plate.height = image.naturalHeight;
  const pctx = plate.getContext('2d');
  pctx.drawImage(image, 0, 0);
  // Constrain ink to the plate alpha. Compositing on the frame would affect other artwork.
  pctx.globalCompositeOperation = 'source-in';
  pctx.fillStyle = color;
  pctx.fillRect(0, 0, plate.width, plate.height);
  tintCache.set(key, plate);
  return plate;
}

function inkPlate(image, color, x, y, dx = 0, dy = 0) {
  ctx.drawImage(tint(image, color), x + dx, y + dy);
}

function line(a, b, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(...a);
  ctx.lineTo(...b);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function strokeCurve(points, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let i = 1; i + 2 < points.length; i += 3) {
    ctx.bezierCurveTo(...points[i], ...points[i + 1], ...points[i + 2]);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function poly(points, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function ring(x, y, r, color, width = 1) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function archPoints(cx, apex, half, spring, base) {
  const left = [cx - half, spring];
  const tip = [cx, apex];
  const right = [cx + half, spring];
  const rise = spring - apex;
  const first = [];
  const second = [];
  for (let i = 0; i <= 64; i++) first.push(cubicPoint(left,
    [cx - half, spring - rise * 0.46], [cx - half * 0.49, apex + rise * 0.22], tip, i / 64));
  for (let i = 1; i <= 64; i++) second.push(cubicPoint(tip,
    [cx + half * 0.49, apex + rise * 0.22], [cx + half, spring - rise * 0.46], right, i / 64));
  return [[cx - half, base], ...first, ...second, [cx + half, base]];
}

function text(str, x, y, size, color, font = MONO, align = 'left') {
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}

function type(str, t, start, cps, x, y, size, color, font = MONO) {
  const n = clamp(Math.floor((t - start) * cps), 0, str.length);
  text(str.slice(0, n), x, y, size, color, font);
  return n;
}

function slam(str, t, start, x, baseline, size, color, font = GOTHIC, step = 0.03, align = 'center') {
  ctx.font = `${size}px ${font}`;
  ctx.textBaseline = 'alphabetic';
  const fullWidth = ctx.measureText(str).width;
  const left = align === 'left' ? x : x - fullWidth / 2;
  for (let i = 0; i < str.length; i++) {
    const cursor = left + ctx.measureText(str.slice(0, i)).width;
    const local = t - start - i * step;
    if (str[i] !== ' ' && local >= 0) {
      const k = easeOut(local / 0.15);
      const scale = 1.6 + (1 - 1.6) * k;
      const advance = ctx.measureText(str[i]).width;
      ctx.save();
      ctx.translate(cursor + advance / 2, baseline);
      ctx.scale(scale, scale);
      text(str[i], -advance / 2, 0, size, color, font);
      ctx.restore();
    }
  }
}

function drawDimField(rect, t, onPaper = false, seed = 0, epoch = 0) {
  const color = onPaper ? DIM_PAPER : DIM_COAL;
  const size = 15;
  const rowH = 26;
  const maxWidth = rect.w;
  const rows = Math.floor(rect.h / rowH);
  ctx.save();
  ctx.font = `${size}px ${MONO}`;
  for (let row = 0; row < rows; row++) {
    const index = (row + seed) % RULES.length;
    const str = RULES[index];
    const x = rect.x + 4;
    const fitWholeTokens = (value, width) => {
      let result = '';
      for (const token of value.split(/(\s+)/)) {
        const candidate = result + token;
        if (ctx.measureText(candidate).width > width) break;
        result = candidate;
      }
      return result.trimEnd();
    };
    const wholeLine = fitWholeTokens(str, maxWidth - 8);
    const typeProgress = clamp((t - (epoch + row * 0.14)) * 20, 0, wholeLine.length);
    const completeWords = Math.floor(typeProgress) >= wholeLine.length
      ? wholeLine
      : wholeLine.slice(0, wholeLine.lastIndexOf(' ') < 0 ? 0 : wholeLine.lastIndexOf(' '));
    text(completeWords, x, rect.y + row * rowH + size, size, color);
  }
  ctx.restore();
}

function drawHud(t, id, state, onPaper = false, { bar, beat } = {}) {
  const fg = onPaper ? COAL : PAPER;
  const rule = onPaper ? COAL : PAPER;
  line([32, 42], [1888, 42], rule, 1);
  line([32, 1037], [1888, 1037], rule, 1);
  text(`${id} · ${t.toFixed(2)}`, 36, 31, 14, fg);
  if (bar != null) text(`bar ${bar} · beat ${beat}`, 1884, 31, 14, fg, MONO, 'right');
  text(`doll.state = ${state}`, 1884, 1064, 14, fg, MONO, 'right');
  line([28, 54], [28, 76], rule, 1);
  line([22, 65], [34, 65], rule, 1);
}

function kick(t, beats, impact = false) {
  let x = 0;
  for (const at of beats) {
    const age = t - at;
    if (age >= 0 && age < (impact ? 0.3 : 0.25)) x += (impact ? 10 : 4) * (1 - easeOut(age / (impact ? 0.3 : 0.25)));
  }
  return [x, impact ? 0 : -0.6 * x];
}

function onCurveText(str, p0, p1, p2, p3, t, offset = 0, size = 14, sample = null) {
  const points = [];
  const distances = [0];
  for (let i = 0; i <= 100; i++) {
    const point = sample ? sample(i / 100) : cubicPoint(p0, p1, p2, p3, i / 100);
    const previous = points.at(-1);
    if (previous) distances.push(distances.at(-1) + Math.hypot(point[0] - previous[0], point[1] - previous[1]));
    points.push(point);
  }
  ctx.save();
  ctx.font = `${size / cameraZoom}px ${MONO}`;
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const glyphs = Array.from(str);
  const advances = glyphs.map((glyph) => ctx.measureText(glyph).width + 1 / cameraZoom);
  const period = advances.reduce((sum, width) => sum + width, 0);
  let distance = ((t * 60 / cameraZoom + offset) % period + period) % period - period;
  let segment = 1;
  for (let i = 0; distance < distances.at(-1); i = (i + 1) % glyphs.length) {
    const center = distance + advances[i] / 2;
    distance += advances[i];
    if (center < 0 || center > distances.at(-1) || glyphs[i] === ' ') continue;
    while (distances[segment] < center) segment++;
    const [x, y] = points[segment - 1];
    const [nx, ny] = points[segment];
    const fraction = (center - distances[segment - 1]) / (distances[segment] - distances[segment - 1] || 1);
    ctx.save();
    ctx.translate(x + (nx - x) * fraction, y + (ny - y) * fraction);
    ctx.rotate(Math.atan2(ny - y, nx - x));
    ctx.fillText(glyphs[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// Crop the composed frame, not the individual source rectangles.
let cameraZoom = 1;
function withCamera(x, y, zoom, draw) {
  const previousZoom = cameraZoom;
  cameraZoom *= zoom;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-x, -y);
  try {
    draw();
  } finally {
    ctx.restore();
    cameraZoom = previousZoom;
  }
}

function glyphPlateForImage(images, dst, cell, decode, t, seed = 17) {
  const cols = Math.ceil(dst.w / cell);
  const rows = Math.ceil(dst.h / cell);
  const inkAlpha = images.map((image) => {
    const sample = document.createElement('canvas');
    sample.width = cols;
    sample.height = rows;
    const sctx = sample.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(image, 0, 0, cols, rows);
    return sctx.getImageData(0, 0, cols, rows).data;
  });
  const palette = [
    { color: PAPER, ramp: '.:-=+' },
    { color: ORANGE, ramp: '*o0%' },
    { color: DIM_COAL, ramp: '#@&' },
  ];
  ctx.font = `${cell}px ${MONO}`;
  ctx.textBaseline = 'middle';
  const bucket = Math.floor(t * 12);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const offset = (y * cols + x) * 4 + 3;
      const paperAlpha = inkAlpha[0][offset];
      const orangeAlpha = inkAlpha[1][offset];
      const coalAlpha = inkAlpha[2][offset];
      const ink = coalAlpha > 110 ? 2 : orangeAlpha > 110 ? 1 : paperAlpha > 60 ? 0 : -1;
      if (ink < 0) continue;
      const settled = clamp((decode - y / rows) * 4);
      const scrambled = hash(seed, x, y, bucket) > settled;
      const glyph = scrambled
        ? '01<>/=+*#%'[Math.floor(hash(seed + 1, x, y, bucket) * 10)]
        : palette[ink].ramp[Math.floor(hash(seed + 2, x, y) * palette[ink].ramp.length)];
      text(glyph, dst.x + x * cell, dst.y + y * cell + cell / 2, cell, palette[ink].color);
    }
  }
}
function drawBurst(t,event,x,y,seed=1,colors=[ORANGE,COAL,PAPER]) {
  const age=t-event;if(age<0||age>=0.45)return;
  const p=age/0.45;const n=64;const lyric='Maybe cold machines human sins gods city CUT bravery hurt';
  ctx.font=`20px ${MONO}`;
  for(let i=0;i<n;i++){
    const a=2*Math.PI*hash(seed,i,0);const speed=100+320*hash(seed,i,1);const dist=speed*(1-(1-p)**2);
    const px=x+Math.cos(a)*dist,py=y+Math.sin(a)*dist;
    const glyph=(i%3===0?lyric:BURST_GLYPHS)[Math.floor(hash(seed,i,2)*(i%3===0?lyric.length:BURST_GLYPHS.length))];
    ctx.fillStyle=colors[i%colors.length];text(glyph,px,py,14+Math.floor(hash(seed,i,3)*12),colors[i%colors.length]);
  }
}

export {
  canvas, ctx, W, H, SCALE, scaled, PAPER, ORANGE, COAL, GOLD, DIM_COAL, DIM_PAPER, MONO, GOTHIC, HAND, RULES,
  readyFonts, loadImages, resetFrame, clamp, easeOut, cubicPoint, inkPlate, line, strokeCurve,
  poly, ring, archPoints, text, type, slam, drawDimField, drawHud, kick, onCurveText,
  withCamera, glyphPlateForImage, drawBurst,
};
