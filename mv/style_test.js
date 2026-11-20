const canvas = document.querySelector('#c');
const ctx = canvas.getContext('2d');
const W = 1920;
const H = 1080;
const PAPER = '#F3E2C4';
const ORANGE = '#E2723A';
const COAL = '#211815';
const GOLD = '#A68957';
const DARK_GOLD = 'rgb(184,154,98)';
const BAR = 2.068966;
const BEAT = 0.517241;
const A = { x: 1105, y: 188, scale: 0.55, crown: [506, 85] };
const C = { x: 580, y: 50, scale: 0.77 };
const A_ANCHORS = [[216, 255], [506, 85], [813, 311]];
const C_FINGERS = [[380,485], [550,680], [846,758], [1050,720], [1200,635]];
const C_DX = [-30, -12, 0, 17, 36];

const imagePaths = [
  '../art/motion/ink_A_maid_flower_paper.png',
  '../art/motion/ink_A_maid_flower_orange.png',
  '../art/motion/ink_A_maid_flower_coal.png',
  '../art/motion/ink_C_hand_paper.png',
  '../art/motion/ink_C_hand_orange.png',
  '../art/motion/ink_C_hand_coal.png',
  '../art/motion/B_orange.png',
  '../art/motion/B_coal.png',
];
const imagePromises = imagePaths.map((src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
}));
let images = [];
const ready = Promise.all([
  ...imagePromises,
  document.fonts.load('100px "Old English Text MT"'),
  document.fonts.load('26px Consolas'),
  document.fonts.load('19px Consolas'),
]).then((loaded) => {
  images = loaded.slice(0, imagePaths.length);
  return true;
});

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function easeOut(value) {
  return 1 - (1 - clamp01(value)) ** 3;
}

function cubicPoint(p0, p1, p2, p3, t) {
  const q = 1 - t;
  return [
    q ** 3 * p0[0] + 3 * q ** 2 * t * p1[0] + 3 * q * t ** 2 * p2[0] + t ** 3 * p3[0],
    q ** 3 * p0[1] + 3 * q ** 2 * t * p1[1] + 3 * q * t ** 2 * p2[1] + t ** 3 * p3[1],
  ];
}

function pathCurve(points) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (let index = 1; index + 2 < points.length; index += 3) {
    ctx.bezierCurveTo(...points[index], ...points[index + 1], ...points[index + 2]);
  }
}

function strokeCurve(segments, color, width) {
  ctx.beginPath();
  ctx.moveTo(...segments[0][0]);
  for (const [p0, p1, p2, p3] of segments) {
    ctx.lineTo(...p0);
    ctx.bezierCurveTo(...p1, ...p2, ...p3);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function line(a, b, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(...a);
  ctx.lineTo(...b);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function ring(x, y, radius, color, width = 1) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function polygon(points, color) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Tint each white mask once on its own canvas; compositing on the main canvas would erase the frame.
const tintCache = new Map();
function tinted(image, ink) {
  const key = image.src + '|' + ink;
  let plate = tintCache.get(key);
  if (!plate) {
    plate = document.createElement('canvas');
    plate.width = image.naturalWidth;
    plate.height = image.naturalHeight;
    const p = plate.getContext('2d');
    p.drawImage(image, 0, 0);
    p.globalCompositeOperation = 'source-in';
    p.fillStyle = ink;
    p.fillRect(0, 0, plate.width, plate.height);
    tintCache.set(key, plate);
  }
  return plate;
}

function inkPlate(image, ink, x, y, dx = 0, dy = 0) {
  ctx.drawImage(tinted(image, ink), x + dx, y + dy);
}

function plateGroup(paper, orange, coal, x, y, pose = {}, kick = [0, 0]) {
  const { dx = 0, dy = 0, angle = 0, pivot = [0, 0] } = pose;
  ctx.save();
  ctx.translate(x + pivot[0] + dx, y + pivot[1] + dy);
  ctx.rotate(angle);
  ctx.translate(-pivot[0], -pivot[1]);
  inkPlate(paper, PAPER, 0, 0);
  inkPlate(orange, ORANGE, kick[0], kick[1]);
  inkPlate(coal, COAL, 0, 0);
  ctx.restore();
}

function drawKick(t, events, impact = false) {
  let offsetX = 0;
  const duration = impact ? 0.3 : 0.25;
  const distance = impact ? 10 : 4;
  for (const event of events) {
    const age = t - event;
    if (age >= 0 && age < duration) offsetX += distance * (1 - easeOut(age / duration));
  }
  return [offsetX, impact ? 0 : -0.6 * offsetX];
}

function archPoints(cx, apex, half, spring, base) {
  const left = [cx - half, spring];
  const tip = [cx, apex];
  const right = [cx + half, spring];
  const rise = spring - apex;
  const first = [];
  const second = [];
  for (let i = 0; i <= 64; i++) {
    first.push(cubicPoint(left,
      [cx - half, spring - rise * 0.46],
      [cx - half * 0.49, apex + rise * 0.22], tip, i / 64));
  }
  for (let i = 1; i <= 64; i++) {
    second.push(cubicPoint(tip,
      [cx + half * 0.49, apex + rise * 0.22],
      [cx + half, spring - rise * 0.46], right, i / 64));
  }
  return [[cx - half, base], ...first, ...second, [cx + half, base]];
}

function strokePolyline(points, color, width = 1) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawText(value, x, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

function rotatePoint(point, pivot, angle, dx = 0, dy = 0) {
  const x = point[0] - pivot[0];
  const y = point[1] - pivot[1];
  return [pivot[0] + dx + x * Math.cos(angle) - y * Math.sin(angle),
    pivot[1] + dy + x * Math.sin(angle) + y * Math.cos(angle)];
}

function drawController(t) {
  const phase = 2 * Math.PI * (t - 95.205) / (2 * BAR);
  const angle = 1.6 * Math.PI / 180 * Math.sin(phase);
  ctx.save();
  ctx.translate(1385, 108);
  ctx.rotate(angle);
  line([-220, 0], [220, 0], GOLD, 4);
  line([0, -42], [0, 26], GOLD, 4);
  for (const x of [-211, 0, 211]) ring(x, 0, 5, GOLD, 1.25);
  ctx.restore();
  return angle;
}

function drawStringsA(controllerAngle, figureDx, figureDy, figureAngle) {
  const controllerPivot = [1385, 108];
  const origins = [[1174, 111], [1385, 135], [1596, 111]];
  for (let i = 0; i < A_ANCHORS.length; i++) {
    const origin = rotatePoint(origins[i], controllerPivot, controllerAngle);
    const local = A_ANCHORS[i];
    const crown = A.crown;
    const anchor = [A.x + local[0] * A.scale, A.y + local[1] * A.scale];
    const pivot = [A.x + crown[0] * A.scale, A.y + crown[1] * A.scale];
    const end = rotatePoint(anchor, pivot, figureAngle, figureDx, figureDy);
    const gap = end[1] - origin[1];
    const bow = [-14, 5, 18][i];
    strokeCurve([[origin,
      [origin[0] + bow, origin[1] + gap * 0.38],
      [end[0] + bow * 0.6, end[1] - gap * 0.14],
      end]], DARK_GOLD, 2.5);
  }
}

function drawLyrics(t) {
  let lines = [];
  if (t >= 101.16) lines = ['With human sins'];
  else if (t >= 98.81) lines = ['Stuffed in the', 'human skin'];
  else if (t >= 95.98) lines = ["Maybe we're all", 'cold machines'];
  ctx.font = '100px "Old English Text MT"';
  ctx.fillStyle = PAPER;
  ctx.textBaseline = 'alphabetic';
  lines.forEach((value, index) => ctx.fillText(value, 153, 500 + index * 118));
}

function drawShot1(t) {
  ctx.fillStyle = COAL;
  ctx.fillRect(0, 0, W, H);
  polygon(archPoints(1385, 42, 325, 488, 1140), PAPER);
  strokePolyline(archPoints(1385, 22, 344, 486, 1140), PAPER);
  strokePolyline(archPoints(1385, 73, 299, 492, 1140), COAL);
  line([128, 341], [1004, 341], PAPER);
  line([128, 341], [128, 733], PAPER);
  line([128, 733], [1004, 733], PAPER);
  drawText('I / THE PUPPET', 155, 315, '23px Consolas', PAPER);

  const controllerAngle = drawController(t);
  const phase = 2 * Math.PI * (t - 95.205) / (2 * BAR);
  const figureDx = 9 * Math.sin(phase - 0.6);
  const figureAngle = 0.6 * Math.PI / 180 * Math.sin(phase - 0.6);
  let figureDy = 0;
  for (let beat = 95.205; beat < 101.42; beat += BEAT) {
    const age = t - beat;
    if (age >= 0 && age < 0.3) figureDy -= 5 * (1 - easeOut(age / 0.3));
  }
  const kick = drawKick(t, [95.205, 97.273966, 99.342932, 101.411898]);
  const pivot = [A.crown[0] * A.scale, A.crown[1] * A.scale];
  plateGroup(images[0], images[1], images[2], A.x, A.y,
    { dx: figureDx, dy: figureDy, angle: figureAngle, pivot }, kick);
  drawStringsA(controllerAngle, figureDx, figureDy, figureAngle);
  drawLyrics(t);
}

function figureCAnchors() {
  return C_FINGERS.map(([x, y]) => [C.x + x * C.scale, C.y + y * C.scale]);
}

function sampleHeldString(index, s) {
  const [x, y] = figureCAnchors()[index];
  const end = [x + C_DX[index], 1100];
  return cubicPoint([x, y], [x - 8, y + 145], [end[0] - 5, 920], end, s);
}

function drawHeldString(index, displacement = 0, alpha = 1) {
  ctx.beginPath();
  for (let step = 0; step <= 96; step++) {
    const s = step / 96;
    const point = sampleHeldString(index, s);
    const before = sampleHeldString(index, Math.max(0, s - 0.001));
    const after = sampleHeldString(index, Math.min(1, s + 0.001));
    const tangent = [after[0] - before[0], after[1] - before[1]];
    const length = Math.hypot(...tangent) || 1;
    const normal = [-tangent[1] / length, tangent[0] / length];
    const amount = displacement * Math.sin(Math.PI * s);
    const moved = [point[0] + normal[0] * amount, point[1] + normal[1] * amount];
    if (step === 0) ctx.moveTo(...moved);
    else ctx.lineTo(...moved);
  }
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawSF3Base(orangeKick = [0, 0], coalKick = [0, 0], handJolt = 0) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  polygon([[1178, 51], [1475, 51], [1501, 0], [1203, 0]], COAL);
  const hand = [C.x, C.y + handJolt];
  inkPlate(images[3], PAPER, hand[0], hand[1]);
  inkPlate(images[4], ORANGE, hand[0] + orangeKick[0], hand[1] + orangeKick[1]);
  inkPlate(images[5], COAL, hand[0] + coalKick[0], hand[1] + coalKick[1]);
}

function drawShot2(t) {
  const kick = drawKick(t, [101.412]);
  drawSF3Base(kick, [0, 0], 0);
  const pluckEvents = [101.412, 101.929241, 102.446482, 102.963723, 103.481];
  for (let i = 0; i < 5; i++) {
    const age = t - pluckEvents[i];
    const displacement = age < 0 ? 0 : 7 * Math.sin(2 * Math.PI * 9 * age) * Math.exp(-age / 0.18);
    drawHeldString(i, displacement);
  }
  const typed = 'Sewed up by the gods of city'.slice(0, Math.max(0, Math.floor((t - 102.45) * 30)));
  drawText(typed, 155, 978, '19px Consolas', COAL);
}

function drawRegistration() {
  ring(104, 560, 11, COAL);
  line([82, 560], [126, 560], COAL);
  line([104, 538], [104, 582], COAL);
  line([126, 560], [196, 560], COAL);
  line([1785, 97], [1820, 97], COAL);
  line([1820, 97], [1820, 132], COAL);
}

function drawSF2Thread(t) {
  const cutTime = 104.517;
  const x = 559;
  const vertexY = 370;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  if (t < cutTime) {
    line([x, 0], [x, H], GOLD, 2.5);
    return;
  }
  const upperProgress = easeOut((t - cutTime) / 0.35);
  const lowerProgress = easeOut((t - cutTime) / 0.6);
  const upperEnd = vertexY - 1000 * upperProgress;
  const upperHook = [x + 12, upperEnd + 36];
  const upperSegments = [[
    [x, 0], [x, Math.min(vertexY - 1, upperEnd)],
    [x - 2, upperEnd + 16], [x + 28, upperEnd + 22],
  ]];
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, Math.max(-40, upperEnd));
  ctx.bezierCurveTo(x - 2, upperEnd + 16, x + 28, upperEnd + 22, ...upperHook);
  ctx.stroke();
  const lowerEndY = vertexY + 60 * lowerProgress;
  ctx.beginPath();
  ctx.moveTo(x, vertexY);
  ctx.bezierCurveTo(x - 15, vertexY + 35, x - 30, vertexY + 48, x - 18, lowerEndY);
  ctx.bezierCurveTo(x + 16, lowerEndY + 18, x + 12, lowerEndY + 48, x + 12, H);
  ctx.stroke();
  void upperSegments;
}

function drawShotSF2(t) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  drawSF2Thread(t);
  const barKick = drawKick(t, [103.481]);
  const impact = t < 104.517 ? [0, 0] : drawKick(t, [104.517], true);
  inkPlate(images[6], ORANGE, barKick[0] + impact[0], barKick[1] + impact[1]);
  const coalImpactX = impact[0] > 0 ? -6 * (impact[0] / 10) : 0;
  inkPlate(images[7], COAL, coalImpactX, impact[1]);
  drawRegistration();
  const typed = '> cut --all'.slice(0, Math.max(0, Math.floor((t - 103.7) * 12)));
  drawText(typed, 90, 112, '26px Consolas', COAL);
  if (t >= 103.7 && t < 104.517 && Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = COAL;
    ctx.fillRect(92 + ctx.measureText(typed).width, 91, 14, 25);
  }
  if (t >= 104.517) {
    const terminal = 'severed.'.slice(0, Math.max(0, Math.floor((t - 104.517) * 30)));
    drawText(terminal, 90, 145, '26px Consolas', COAL);
  }
}

function drawBaseTaut(index, handJolt = 0) {
  const [x, y] = figureCAnchors()[index];
  const end = [x + C_DX[index], 1100];
  strokeCurve([[[x, y + handJolt], [x - 8, y + 145 + handJolt], [end[0] - 5, 920], end]], GOLD, 2.5);
}

function drawHookPiece(start, end, controls, side = 1) {
  const [x, y] = start;
  const [ex, ey] = end;
  const [c1x, c1y, c2x, c2y] = controls;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, ex, ey);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.bezierCurveTo(ex + side * 14, ey - 12, ex + side * 25, ey + 4, ex + side * 10, ey + 15);
  ctx.stroke();
}

function drawExactString3Recoil(handJolt, progress = 1) {
  const [x, y] = figureCAnchors()[2];
  const p = easeOut(progress);
  const mixPoint = (from, to) => from.map((value, axis) => value + (to[axis] - value) * p);
  const blendCurve = (from, to) => from.map((point, index) => mixPoint(point, to[index]));
  const straightUpper = [[x, y], [x - 8, y + 145], [x - 5, 920], [x, 1100]];
  const recoilUpper = [[x, y], [x - 2, y + 85], [x - 38, 735], [x - 47, 775]];
  const hook1Straight = [[x, 1100], [x - 4, 1100], [x - 8, 1100], [x - 13, 1100]];
  const hook1Recoil = [[x - 47, 775], [x - 59, 818], [x - 7, 822], [x - 13, 791]];
  const hook2Straight = [[x - 13, 1100], [x - 19, 1100], [x - 25, 1100], [x - 31, 1100]];
  const hook2Recoil = [[x - 13, 791], [x - 17, 779], [x - 30, 782], [x - 31, 791]];
  const lowerStraight = [[x, 1100], [x - 4, 1100], [x + 6, 1100], [x + 15, 1100]];
  const lowerFirst = [[x + 2, 898], [x - 17, 884], [x - 37, 910], [x - 18, 925]];
  const lowerSecondStraight = [[x, 1100], [x - 4, 1100], [x + 6, 1100], [x + 15, 1100]];
  const lowerSecondRecoil = [[x - 18, 925], [x + 20, 955], [x + 9, 1015], [x + 15, 1100]];
  const shift = (curve) => curve.map(([px, py]) => [px, py + handJolt]);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  strokeCurve([shift(blendCurve(straightUpper, recoilUpper))], GOLD, 2.5);
  strokeCurve([blendCurve(hook1Straight, hook1Recoil)], GOLD, 2.5);
  strokeCurve([blendCurve(hook2Straight, hook2Recoil)], GOLD, 2.5);
  strokeCurve([blendCurve(lowerStraight, lowerFirst)], GOLD, 2.5);
  strokeCurve([blendCurve(lowerSecondStraight, lowerSecondRecoil)], GOLD, 2.5);
}

function drawOtherRecoil(index, progress, handJolt) {
  const [x, y] = figureCAnchors()[index];
  const s = 0.45;
  const cut = sampleHeldString(index, s);
  const p = easeOut(progress);
  const mirror = index % 2 === 0 ? 1 : -1;
  const variation = (index - 2) * 5;
  const topEnd = [cut[0] + mirror * (13 + variation) * p, cut[1] - 55 * p];
  const bottomEnd = [cut[0] - mirror * (10 + variation) * p, cut[1] + 75 * p];
  const topControls = [cut[0] - 8 + (topEnd[0] - cut[0]) * 0.45, cut[1] - 26,
    topEnd[0] - mirror * 16, topEnd[1] + 10];
  const bottomControls = [cut[0] - mirror * 12, cut[1] + 28,
    bottomEnd[0] + mirror * 16, bottomEnd[1] - 18];
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  const topStart = sampleHeldString(index, 0);
  const topAtCut = cut;
  const movedTop = [topEnd[0], topEnd[1]];
  const blend = (a, b, q) => a.map((v, i) => v + (b[i] - v) * q);
  const oldTop = [topStart, [topStart[0] - 8, topStart[1] + 145], [cut[0] - 5, cut[1] - 20], cut];
  const newTop = [topStart, [topStart[0] - 8, topStart[1] + 145], [movedTop[0] - mirror * 10, movedTop[1] + 18], movedTop];
  strokeCurve([oldTop.map((point, i) => blend(point, newTop[i], p))], GOLD, 2.5);
  const oldBottom = [cut, [cut[0] - 5, cut[1] + 20], [cut[0] - 5, 920], [cut[0] + C_DX[index], 1100]];
  const newBottom = [cut, bottomControls.slice(0, 2), bottomControls.slice(2), [cut[0] + C_DX[index], 1100]];
  strokeCurve([oldBottom.map((point, i) => blend(point, newBottom[i], p))], GOLD, 2.5);
  const hookEnd = [movedTop[0] + mirror * 9, movedTop[1] + 19];
  strokeCurve([[movedTop, [movedTop[0] + mirror * 15, movedTop[1] - 8], [hookEnd[0], hookEnd[1] - 5], hookEnd]], GOLD, 2.5);
  void topAtCut;
  void handJolt;
}

function drawShot4(t) {
  const snaps = [
    { index: 2, time: 105.55 },
    { index: 1, time: 106.584 },
    { index: 3, time: 107.618 },
    { index: 0, time: 108.653 },
    { index: 4, time: 109.170 },
  ];
  const completed = snaps.filter((snap) => t >= snap.time);
  const orangeKick = drawKick(t, completed.map((snap) => snap.time), true);
  const coalKick = [-0.6 * orangeKick[0], -0.6 * orangeKick[1]];
  const jolt = -completed.reduce((sum, snap) => {
    const age = t - snap.time;
    return sum + (age < 0.3 ? 6 * (1 - easeOut(age / 0.3)) : 0);
  }, 0);
  drawSF3Base(orangeKick, coalKick, jolt);

  for (let index = 0; index < 5; index++) {
    const snap = snaps.find((item) => item.index === index);
    if (!snap || t < snap.time) {
      drawBaseTaut(index, jolt);
    } else if (index === 2) {
      drawExactString3Recoil(jolt, Math.min(1, (t - snap.time) / 0.4));
    } else {
      drawOtherRecoil(index, Math.min(1, (t - snap.time) / 0.4), jolt);
    }
  }
  drawText(`strings severed : ${completed.length} / 5`, 155, 978, '19px Consolas', COAL);
  const caption = 'All that precious bravery is gonna get you hurt'
    .slice(0, Math.max(0, Math.floor((t - 107.12) * 30)));
  drawText(caption, 155, 1012, '19px Consolas', COAL);
}

function draw(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (t < 101.412) drawShot1(t);
  else if (t < 103.481) drawShot2(t);
  else if (t < 105.55) drawShotSF2(t);
  else drawShot4(t);
  return '';
}

window.MV = {
  ready,
  info: () => ({ shots: 4, range: [95.205, 109.688], images: imagePaths.length }),
  frame(t, mime = 'image/jpeg', quality = 0.95) {
    draw(t);
    return canvas.toDataURL(mime, quality).split(',')[1];
  },
  draw,
};
