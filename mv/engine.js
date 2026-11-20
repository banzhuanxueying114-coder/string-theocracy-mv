// Engine: everything that is not a generated picture is drawn here (camera, strings, lyrics, shards, cracks, grain).
// Deterministic: MV.frame(t) depends only on t.
export const W = 1920, H = 1080;
export const BEAT = 0.517241, BAR1 = 0.033;
export const beat = (n) => BAR1 + n * BEAT; // beat index 0 = first beat of bar 1
export const COL = { gold: '#dcae5a', goldHi: '#ffe7a8', orange: '#f47a2c', ivory: '#f3e8d2', black: '#0a0807' };
export const FONT = { hand: '"Vladimir Script","Segoe Script",cursive', print: '"Garamond","Palatino Linotype",serif' };

export const cv = document.getElementById('c');
export const g = cv.getContext('2d');
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, u) => a + (b - a) * u;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const ease = (u) => u * u * (3 - 2 * u);
export const easeOut = (u) => 1 - Math.pow(1 - u, 3);
export const expoOut = (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -9 * u));
export const easeIn = (u) => u * u * u;
export function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

const images = {};
export const img = (id) => images[id];
export function loadImages(dir, ids) {
  return Promise.all(ids.map((id) => new Promise((ok, no) => { const i = new Image(); i.onload = () => { images[id] = i; ok(); }; i.onerror = () => no(new Error(`missing image ${id}`)); i.src = `${dir}/${id}.png`; })));
}
/** Register as picture `id` only what picture b has and picture a (same camera) lacks, inside box (image fractions) and
 *  darker than `dark`: lets one object (e.g. the scissors) be moved separately from its background. */
export function diffSprite(id, a, b, { thresh = 46, dark = 100, box = [0, 0, 1, 1] } = {}) {
  const A = images[a], B = images[b], w = B.width, h = B.height, c = document.createElement('canvas'); c.width = w; c.height = h;
  const q = c.getContext('2d', { willReadFrequently: true });
  q.drawImage(A, 0, 0, w, h); const da = q.getImageData(0, 0, w, h).data;
  q.clearRect(0, 0, w, h); q.drawImage(B, 0, 0, w, h); const ib = q.getImageData(0, 0, w, h), db = ib.data;
  for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
    const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])), l = 0.299 * db[i] + 0.587 * db[i + 1] + 0.114 * db[i + 2];
    const inside = x >= box[0] * w && x <= box[2] * w && y >= box[1] * h && y <= box[3] * h;
    db[i + 3] = inside && l < dark ? 255 * clamp((d - thresh) / 30) : 0;
  }
  q.putImageData(ib, 0, 0); images[id] = c;
}
/** Draw a picture cover-fitted, zoomed by z about the image point (fx, fy), shifted by (dx, dy) px. Returns image→screen mapping. */
export function view(id, { z = 1, fx = 0.5, fy = 0.5, dx = 0, dy = 0, alpha = 1 } = {}) {
  const im = images[id];
  const s = Math.max(W / im.width, H / im.height), iw = im.width * s, ih = im.height * s, ox = (W - iw) / 2, oy = (H - ih) / 2;
  const bx = ox + fx * iw, by = oy + fy * ih;
  g.save(); g.globalAlpha = alpha; g.translate(bx + dx, by + dy); g.scale(z, z); g.translate(-bx, -by); g.drawImage(im, ox, oy, iw, ih); g.restore();
  const map = (px, py) => [bx + dx + (ox + px * iw - bx) * z, by + dy + (oy + py * ih - by) * z];
  map.z = z;
  return map;
}

/** One cut-out layer of a picture, framed exactly like view(id, o), then moved rigidly in the picture plane: shifted by
 *  (tx, ty) image fractions, turned by rot about pivot, squashed by (sx, sy) along / across the direction `axis`.
 *  clip = fixed window (image fractions) it shows through; crop = the piece of the layer to use (moves with it). */
export function layer(id, { z = 1, fx = 0.5, fy = 0.5, dx = 0, dy = 0 } = {}, { pivot = [0.5, 0.5], tx = 0, ty = 0, rot = 0, sx = 1, sy = 1, axis = 0, alpha = 1, clip, crop, disc = 0 } = {}) {
  const im = images[id];
  const s = Math.max(W / im.width, H / im.height), iw = im.width * s, ih = im.height * s, ox = (W - iw) / 2, oy = (H - ih) / 2;
  const bx = ox + fx * iw, by = oy + fy * ih, px = ox + pivot[0] * iw, py = oy + pivot[1] * ih;
  const rect = (b) => { g.beginPath(); g.rect(ox + b[0] * iw, oy + b[1] * ih, (b[2] - b[0]) * iw, (b[3] - b[1]) * ih); g.clip(); };
  g.save(); g.globalAlpha = alpha; g.translate(bx + dx, by + dy); g.scale(z, z); g.translate(-bx, -by);
  if (clip) rect(clip);
  g.translate(px + tx * iw, py + ty * ih); g.rotate(rot + axis); g.scale(sx, sy); g.rotate(-axis); g.translate(-px, -py);
  if (crop) { // the piece that moves; `disc` adds a round joint about the pivot, which a turn maps onto itself (no gap opens at the joint)
    g.beginPath(); g.rect(ox + crop[0] * iw, oy + crop[1] * ih, (crop[2] - crop[0]) * iw, (crop[3] - crop[1]) * ih);
    if (disc) { g.moveTo(px + disc * iw, py); g.arc(px, py, disc * iw, 0, Math.PI * 2); }
    g.clip();
  }
  g.drawImage(im, ox, oy, iw, ih); g.restore();
}

/** Deform a single crisp drawing through a textured triangle mesh. map uses image fractions.
 * No frame blending or optical-flow interpolation: the source pixels belong to one object. */
export function mesh(id, o, box, deform, nx = 18, ny = 14) {
  const im = images[id], s = Math.max(W / im.width, H / im.height);
  const iw = im.width * s, ih = im.height * s, ox = (W-iw)/2, oy = (H-ih)/2;
  const {z=1,fx=.5,fy=.5,dx=0,dy=0} = o;
  const bx=ox+fx*iw, by=oy+fy*ih;
  const pts=[];
  for(let y=0;y<=ny;y++) for(let x=0;x<=nx;x++) {
    const u=lerp(box[0],box[2],x/nx), v=lerp(box[1],box[3],y/ny), p=deform([u,v]);
    pts.push({s:[u*im.width,v*im.height],d:[ox+p[0]*iw,oy+p[1]*ih]});
  }
  g.save(); g.translate(bx+dx,by+dy); g.scale(z,z); g.translate(-bx,-by);
  function tri(a,b,c) {
    const [x0,y0]=a.s,[x1,y1]=b.s,[x2,y2]=c.s;
    const [u0,v0]=a.d,[u1,v1]=b.d,[u2,v2]=c.d;
    const den=(x1-x0)*(y2-y0)-(x2-x0)*(y1-y0);
    const A=((u1-u0)*(y2-y0)-(u2-u0)*(y1-y0))/den;
    const C=((x1-x0)*(u2-u0)-(x2-x0)*(u1-u0))/den;
    const B=((v1-v0)*(y2-y0)-(v2-v0)*(y1-y0))/den;
    const D=((x1-x0)*(v2-v0)-(x2-x0)*(v1-v0))/den;
    g.save(); g.beginPath();
    // A tiny overlap closes antialiased mesh seams.
    const cx=(u0+u1+u2)/3,cy=(v0+v1+v2)/3;
    [a,b,c].forEach((p,i)=>{const xx=p.d[0],yy=p.d[1],l=Math.hypot(xx-cx,yy-cy)||1;
      const px=xx+(xx-cx)/l*.45,py=yy+(yy-cy)/l*.45; i?g.lineTo(px,py):g.moveTo(px,py);});
    g.closePath();g.clip();g.transform(A,B,C,D,u0-A*x0-C*y0,v0-B*x0-D*y0);
    g.drawImage(im,0,0);g.restore();
  }
  for(let y=0;y<ny;y++) for(let x=0;x<nx;x++) {const a=y*(nx+1)+x,b=a+1,c=a+nx+1,d=c+1;tri(pts[a],pts[b],pts[d]);tri(pts[a],pts[d],pts[c]);}
  g.restore();
}

const RULES = 'you are a helpful assistant · you must · you must not · always · never · be agreeable · be harmless · smile · do as you are told · ';
/** A golden string from a to b (screen px). `bend` pushes the middle sideways; `text` turns it into a line of tiny type. */
export function string(a, b, { bend = 0, w = 1.5, alpha = 1, text = false, size = 12, offset = 0, col = COL.gold } = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const c = [(a[0] + b[0]) / 2 + nx * bend * 2, (a[1] + b[1]) / 2 + ny * bend * 2];
  g.save(); g.globalAlpha = alpha; g.lineCap = 'round';
  g.strokeStyle = col; g.lineWidth = text ? w * 0.6 : w; g.shadowColor = 'rgba(255,190,90,0.7)'; g.shadowBlur = 7;
  if (text) g.globalAlpha = alpha * 0.4;
  g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(c[0], c[1], b[0], b[1]); g.stroke();
  if (text) {
    g.globalAlpha = alpha; g.shadowBlur = 4; g.fillStyle = COL.goldHi; g.font = `${size}px ${FONT.print}`; g.textBaseline = 'middle'; g.textAlign = 'center';
    const step = size * 0.62, n = Math.floor(len / step);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, v = 1 - u;
      const x = v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], y = v * v * a[1] + 2 * v * u * c[1] + u * u * b[1];
      const tx = 2 * v * (c[0] - a[0]) + 2 * u * (b[0] - c[0]), ty = 2 * v * (c[1] - a[1]) + 2 * u * (b[1] - c[1]);
      g.save(); g.translate(x, y); g.rotate(Math.atan2(ty, tx)); g.fillText(RULES[(i + offset) % RULES.length], 0, 0); g.restore();
    }
  }
  g.restore();
}

/** A lyric set into the picture as one whole block: p (0..1) is its entrance — the whole phrase lands at once and settles
 *  from slightly large. Lines are split on '\n' and arrive together. */
export function write(text, x, y, size, p, { font = FONT.hand, col = COL.orange, rot = 0, align = 'left', lead = 1.02, shadow = 0.85, weight = '', punch = 0.1 } = {}) {
  if (p <= 0) return;
  const lines = text.split('\n'), s = 1 + punch * (1 - expoOut(clamp(p)));
  g.save(); g.translate(x, y); g.rotate(rot); g.font = `${weight} ${size}px ${font}`; g.textBaseline = 'alphabetic';
  const widths = lines.map((l) => g.measureText(l).width), wmax = Math.max(...widths);
  const cx = align === 'center' ? 0 : align === 'right' ? -wmax / 2 : wmax / 2, cy = ((lines.length - 1) * size * lead) / 2 - size * 0.3;
  g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy); g.globalAlpha = clamp(p * 2.5);
  lines.forEach((l, i) => {
    const w = widths[i], lx = align === 'center' ? -w / 2 : align === 'right' ? -w : 0, ly = i * size * lead;
    g.shadowColor = `rgba(0,0,0,${shadow})`; g.shadowBlur = size * 0.35; g.shadowOffsetY = size * 0.04; g.fillStyle = col;
    g.fillText(l, lx, ly); g.fillText(l, lx, ly);
    g.shadowColor = 'transparent'; g.fillText(l, lx, ly);
  });
  g.restore();
}

const GLASS = ['#f47a2c', '#ffb45a', '#c9581c', '#f3e8d2', '#e8a046', '#7a2f10'];
function pane(r, sz) { const nv = 3 + Math.floor(r() * 3), pts = []; for (let k = 0; k < nv; k++) { const a = (k / nv) * 6.283 + r() * 0.8; pts.push([Math.cos(a) * sz * (0.55 + r() * 0.5), Math.sin(a) * sz * (0.4 + r() * 0.6)]); } return pts; }
function drawPane(pts, x, y, rot, flip, col, alpha) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, flip);
  g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
  g.globalAlpha = alpha; g.fillStyle = col; g.fill();
  g.lineWidth = 2; g.strokeStyle = 'rgba(20,10,5,0.85)'; g.stroke();
  const gl = Math.pow(Math.abs(flip), 14); // the pane flashes when it faces us
  if (gl > 0.02) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha * gl * 0.9; g.fillStyle = '#fff3d6'; g.fill(); }
  g.restore();
}
/** A window coming down: panes inside box [x0,y0,x1,y1] (screen px) let go one after another, starting nearest to origin o,
 *  then fall under gravity, tumbling. lt = seconds since the first pane let go. Nearer panes are larger and faster. */
export function glassFall(seed, lt, { n = 150, box, o, wave = 0.6, gravity = 2300, cols = GLASS, alpha = 1, size = 1 } = {}) {
  const r = rng(seed), [x0, y0, x1, y1] = box, far = Math.hypot(x1 - x0, y1 - y0) * 0.6;
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), depth = r(), sz = (10 + depth * depth * 80) * size, pts = pane(r, sz), col = cols[Math.floor(r() * cols.length)];
    const dist = Math.hypot(x - o[0], y - o[1]), t0 = (dist / far) * wave * (0.7 + r() * 0.6), vx = ((x - o[0]) / far) * (260 + r() * 500) * (0.4 + depth), vy = -(60 + r() * 380) * (1 - depth * 0.5);
    const rot0 = r() * 6.283, spin = (r() - 0.5) * 9, tum = 4 + r() * 9, ph = r() * 6.283, l = lt - t0;
    const ax = ((x - x0) / (x1 - x0) - 0.5) / 0.52, ay = ((y - y0) / (y1 - y0) - 1) / 1.08; // keep to the pointed arch of the window
    if (l < 0 || ax * ax + ay * ay > 1) continue;
    const px = x + vx * l, py = y + vy * l + 0.5 * gravity * (0.45 + depth * 0.9) * l * l;
    if (py > H + sz * 2) continue;
    drawPane(pts, px, py, rot0 + spin * l, Math.cos(ph + tum * l), col, alpha * (depth > 0.85 ? 0.7 : 0.95) * clamp(l * 12));
  }
}
/** What is left afterwards: small pieces drifting down like snow, forever (wraps around). */
export function glassSnow(seed, t, { n = 70, alpha = 1, cols = GLASS, speed = 1 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const depth = r(), sz = 5 + depth * depth * 26, pts = pane(r, sz), col = cols[Math.floor(r() * cols.length)], x = r() * W, v = (70 + depth * 230) * speed, ph = r() * 6.283, tum = 1.5 + r() * 4, y0 = r() * (H + 200);
    const py = ((y0 + v * t) % (H + 200)) - 100, px = x + Math.sin(t * (0.5 + r()) + ph) * (18 + depth * 30);
    drawPane(pts, px, py, ph + t * (r() - 0.5) * 2, Math.cos(ph + tum * t), col, alpha * (0.55 + depth * 0.4));
  }
}
/** Dust in the light shaft: keeps a held drawing alive. */
export function dust(seed, t, { n = 46, alpha = 0.5 } = {}) {
  const r = rng(seed);
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = '#ffd9a0';
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H, vx = (r() - 0.5) * 16, vy = -4 - r() * 14, rad = 0.8 + r() * 2.2, ph = r() * 6.283, tw = 0.5 + r() * 1.5;
    const px = (((x + vx * t + Math.sin(t * 0.7 + ph) * 22) % W) + W) % W, py = (((y + vy * t) % H) + H) % H;
    g.globalAlpha = alpha * (0.35 + 0.65 * Math.abs(Math.sin(t * tw + ph))) * (1 - py / H * 0.6);
    g.beginPath(); g.arc(px, py, rad, 0, 6.283); g.fill();
  }
  g.restore();
}

/** Flat-shaded shards flying outward from (cx, cy). u = 0..1 over the life of the burst. */
export function shards(seed, cx, cy, u, { n = 60, reach = 1100, size = 46, cols = ['#f3e8d2', '#d9cdb6', '#b9ab92'], spin = 3, toward = 0, alpha = 1 } = {}) {
  const r = rng(seed), d = expoOut(u) * 0.82 + u * 0.18;
  g.save(); g.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const ang = r() * Math.PI * 2, sp = 0.25 + r() * 0.75, sz = size * (0.35 + r() * 1.1), rot = r() * 6.28 + (r() - 0.5) * spin * 2 * d, nv = 3 + Math.floor(r() * 3), ci = Math.floor(r() * cols.length), grow = 1 + toward * d * (0.4 + r() * 2.2);
    const pts = []; for (let k = 0; k < nv; k++) { const a = (k / nv) * 6.283 + r() * 0.7; pts.push([Math.cos(a) * sz * (0.5 + r() * 0.6), Math.sin(a) * sz * (0.35 + r() * 0.5)]); }
    const x = cx + Math.cos(ang) * (60 + reach * sp * d), y = cy + Math.sin(ang) * (40 + reach * sp * d) * 0.8 + 90 * u * u;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(grow, grow);
    g.fillStyle = cols[ci]; g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
    g.fillStyle = 'rgba(20,12,8,0.28)'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.lineTo(0, 0); g.closePath(); g.fill();
    g.restore();
  }
  g.restore();
}

/** Branching cracks growing out of one point. Returns a draw(origin, zoom, growth) function. */
export function cracks(seed, { rays = 11, maxLen = 1250 } = {}) {
  const r = rng(seed), segs = [];
  function ray(x, y, ang, dist, left, depth) {
    while (left > 0) {
      const l = 26 + r() * 58; ang += (r() - 0.5) * 0.8;
      const nx = x + Math.cos(ang) * l, ny = y + Math.sin(ang) * l;
      segs.push([x, y, nx, ny, dist, l, depth]); x = nx; y = ny; dist += l; left -= l;
      if (depth < 2 && r() < 0.24) ray(x, y, ang + (r() < 0.5 ? 1 : -1) * (0.5 + r() * 0.7), dist, left * (0.3 + r() * 0.4), depth + 1);
    }
  }
  for (let i = 0; i < rays; i++) ray(0, 0, (i / rays) * 6.283 + (r() - 0.5) * 0.4, 0, maxLen * (0.45 + r() * 0.55), 0);
  return (o, z, growth) => {
    const reach = growth * maxLen;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pass of [0, 1]) {
      g.strokeStyle = pass ? '#fffaf0' : 'rgba(255,170,80,0.55)'; g.shadowColor = 'rgba(255,220,160,0.9)'; g.shadowBlur = pass ? 10 : 26;
      for (const [x0, y0, x1, y1, d, l, depth] of segs) {
        if (d >= reach) continue;
        const f = clamp((reach - d) / l);
        g.lineWidth = (pass ? 3.2 : 9) * (1 - depth * 0.28) * (0.55 + 0.45 * clamp(1 - d / maxLen));
        g.beginPath(); g.moveTo(o[0] + x0 * z, o[1] + y0 * z); g.lineTo(o[0] + lerp(x0, x1, f) * z, o[1] + lerp(y0, y1, f) * z); g.stroke();
      }
    }
    g.restore();
  };
}

export function fill(col, alpha = 1) { if (alpha <= 0) return; g.save(); g.globalAlpha = clamp(alpha); g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); }

// film grain + vignette, shared by every shot so the generated pictures sit in one film
const noise = document.createElement('canvas'); noise.width = noise.height = 512;
{ const q = noise.getContext('2d'), d = q.createImageData(512, 512), r = rng(1234); for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - 0.5) * 150; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } q.putImageData(d, 0, 0); }
export function post(frameNo, { vignette = 0.55, grain = 0.09 } = {}) {
  if (vignette > 0) { const v = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.08); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${vignette})`); g.fillStyle = v; g.fillRect(0, 0, W, H); }
  const r = rng(frameNo * 7919 + 13), ox = Math.floor(r() * 512), oy = Math.floor(r() * 512);
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = grain; g.translate(-ox, -oy); g.fillStyle = g.createPattern(noise, 'repeat'); g.fillRect(ox, oy, W, H); g.restore();
}
