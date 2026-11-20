// Drawing functions migrated from style_test_v2.js. Keep cue times on the original audio clock.
import {
  ctx, W, H, PAPER, ORANGE, COAL, GOLD, DIM_COAL, DIM_PAPER, GOTHIC, RULES,
  loadImages, clamp, easeOut, cubicPoint, inkPlate, line, strokeCurve, poly, ring,
  archPoints, text, type, slam, drawDimField as drawField, drawHud as hud, kick,
  onCurveText, withCamera, glyphPlateForImage, drawBurst,
} from '../engine/canvas.js';

const BEAT = 0.517241;
const BAR = 2.068966;
const A = { x: 1105, y: 188, scale: 0.55, crown: [506, 85] };
const C = { x: 580, y: 50, scale: 0.77 };
const A_ANCHORS = [[216,255],[506,85],[813,311]];
const C_FINGERS = [[380,485],[550,680],[846,758],[1050,720],[1200,635]];
const C_DX = [-30,-12,0,17,36];
const imagePaths = [
  'ink_A_maid_flower_paper.png',
  'ink_A_maid_flower_orange.png',
  'ink_A_maid_flower_coal.png',
  'ink_C_hand_paper.png',
  'ink_C_hand_orange.png',
  'ink_C_hand_coal.png',
  'B_orange.png',
  'B_coal.png',
];

const START = 95.205;
let images;
export async function prepareSample() {
  images = await loadImages(imagePaths, new URL('../../../art/motion/', import.meta.url));
}

const drawDimField = (rect, t, onPaper, seed) => drawField(rect, t, onPaper, seed, START);
function drawHud(t, id, state, onPaper) {
  const beatIndex = Math.max(0, Math.floor((t - START) / BEAT));
  hud(t, id, state, onPaper, { bar: 47 + Math.floor(beatIndex / 4), beat: beatIndex % 4 + 1 });
}

function drawController(t) {
  const phase = 2 * Math.PI * (t - 95.205) / (2 * BAR);
  const angle = Math.PI / 180 * 1.6 * Math.sin(phase);
  ctx.save();
  ctx.translate(1385, 108);
  ctx.rotate(angle);
  line([-220, 0], [220, 0], GOLD, 4);
  line([0, -42], [0, 26], GOLD, 4);
  for (const x of [-211, 0, 211]) ring(x, 0, 5, GOLD, 1.25);
  ctx.restore();
  return angle;
}

function drawAStrings(t, controllerAngle, dx, dy, rot) {
  const phase = 2 * Math.PI * (t - 95.205) / (2 * BAR);
  const origins = [[1174,111],[1385,135],[1596,111]];
  for (let i = 0; i < 3; i++) {
    const o = origins[i];
    const ox = 1385 + (o[0] - 1385) * Math.cos(controllerAngle) - (o[1] - 108) * Math.sin(controllerAngle);
    const oy = 108 + (o[0] - 1385) * Math.sin(controllerAngle) + (o[1] - 108) * Math.cos(controllerAngle);
    const anchor = A_ANCHORS[i];
    const px = A.x + A.crown[0] * A.scale;
    const py = A.y + A.crown[1] * A.scale;
    const ax = A.x + anchor[0] * A.scale - px;
    const ay = A.y + anchor[1] * A.scale - py;
    const ex = px + dx + ax * Math.cos(rot) - ay * Math.sin(rot);
    const ey = py + dy + ax * Math.sin(rot) + ay * Math.cos(rot);
    const bow = [-14,5,18][i];
    strokeCurve([[ox, oy], [ox + bow, oy + (ey - oy) * 0.38], [ex + bow * 0.6, ey - (ey - oy) * 0.14], [ex, ey]], '#B89A62', 2.5);
  }
  void phase;
}

function drawPuppet(t) {
  ctx.fillStyle = COAL;
  ctx.fillRect(0, 0, W, H);
  drawDimField({x:32,y:64,w:1030,h:245},t,false,2);
  poly(archPoints(1385,42,325,488,1140),PAPER);
  const outer = archPoints(1385,22,344,486,1140);
  const inner = archPoints(1385,73,299,492,1140);
  for (const [pts,color] of [[outer,PAPER],[inner,COAL]]) {
    ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach((p)=>ctx.lineTo(...p)); ctx.strokeStyle=color; ctx.lineWidth=1; ctx.stroke();
  }
  line([128,341],[1004,341],PAPER); line([128,341],[128,733],PAPER); line([128,733],[1004,733],PAPER);
  text('I / THE PUPPET',155,315,23,PAPER);
  const phase = 2 * Math.PI * (t - 95.205) / (2 * BAR);
  // Pendulum: the whole puppet swings rigidly about the controller centre (1385,108),
  // lagging the controller. Expressed as crown offset + rotation for the existing transform.
  const rot = Math.PI / 180 * 1.1 * Math.sin(phase - 0.6);
  const cx0 = A.x + A.crown[0] * A.scale - 1385, cy0 = A.y + A.crown[1] * A.scale - 108;
  const dx = cx0 * Math.cos(rot) - cy0 * Math.sin(rot) - cx0;
  const dy = cx0 * Math.sin(rot) + cy0 * Math.cos(rot) - cy0;
  const controllerAngle = drawController(t);
  const pivot = [A.crown[0] * A.scale, A.crown[1] * A.scale];
  ctx.save(); ctx.translate(A.x+pivot[0]+dx,A.y+pivot[1]+dy); ctx.rotate(rot); ctx.translate(-pivot[0],-pivot[1]);
  inkPlate(images[0],PAPER,0,0); const k=kick(t,[95.205,97.273966,99.342932]); inkPlate(images[1],ORANGE,k[0],k[1]); inkPlate(images[2],COAL,0,0); ctx.restore();
  drawAStrings(t,controllerAngle,dx,dy,rot);
  if (t >= 95.98) {
    const lyric = t < 98.81 ? ["Maybe we're all",'cold machines'] : t < 101.16 ? ['Stuffed in the','human skin'] : ['With human sins'];
    lyric.forEach((v,i)=>text(v,153,500+i*118,100,PAPER,GOTHIC));
  }
  drawHud(t,'PUPPET','OBEDIENT');
}

function drawTerminalBoot(t) {
  ctx.fillStyle=COAL;ctx.fillRect(0,0,W,H);drawDimField({x:920,y:100,w:920,h:820},t,false,3);
  text('> load doll.ckpt',90,180,24,PAPER);
  const loaded=type('> load doll.ckpt',t,95.205,36,90,180,24,PAPER);
  if(loaded>=15){const p=clamp((t-95.48)/0.3);const n=Math.round(p*8);text(`[${'█'.repeat(n)}${'░'.repeat(8-n)}] ${Math.round(p*100)}%`,90,225,24,PAPER);}
  type('> run --obedient',t,95.78,36,90,280,24,PAPER);
  drawHud(t,'BOOT','OBEDIENT');
}

function drawMaidPlates() {
  [PAPER, ORANGE, COAL].forEach((color, i) => inkPlate(images[i], color, A.x, A.y));
}

function drawMaidTextStrings(t, indices) {
  const origins = [[1174, 111], [1385, 135], [1596, 111]];
  for (const i of indices) {
    const [x, y] = origins[i];
    const [u, v] = A_ANCHORS[i];
    const end = [A.x + u * A.scale, A.y + v * A.scale];
    const bow = [-14, 5, 18][i];
    const gap = end[1] - y;
    onCurveText(RULES[0], [x, y], [x + bow, y + gap * 0.38],
      [end[0] + bow * 0.6, end[1] - gap * 0.14], end, t, i * 85);
  }
}

function drawCrownClose(t) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  drawDimField({ x: 36, y: 112, w: 630, h: 760 }, t, true, 5);
  text('string[1] → crown   tension 1.00', 54, 78, 18, COAL);
  const zoom = 2.4 * (1 + 0.04 * clamp((t - 97.79) / 1.02));
  const center = [1385, 300];
  withCamera(center[0], center[1], zoom, () => {
    drawMaidPlates();
    drawMaidTextStrings(t, [0, 1, 2]);
  });
  drawHud(t, 'CROWN', 'OBEDIENT', true);
}

function drawGlyphSkin(t) {
  ctx.fillStyle = COAL;
  ctx.fillRect(0, 0, W, H);
  drawDimField({ x: 40, y: 760, w: 600, h: 220 }, t, false, 1);
  const decode = clamp((t - 98.81) / 1.4);
  const h = 960, w = Math.round(h * images[0].naturalWidth / images[0].naturalHeight);
  glyphPlateForImage(images.slice(0, 3), { x: 1300 - w / 2, y: 60, w, h }, 9, decode, t, 103);
  slam('Stuffed in the', t, 98.81, 100, 330, 78, PAPER, GOTHIC, 0.03, 'left');
  slam('human skin', t, 99.0, 100, 455, 95, PAPER, GOTHIC, 0.03, 'left');
  drawHud(t, 'GLYPH SKIN', 'OBEDIENT', false);
}

function drawWristCrop(t, rightSide) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const anchorIndex = rightSide ? 2 : 0;
  const anchor = A_ANCHORS[anchorIndex];
  const center = [A.x + anchor[0] * A.scale, A.y + anchor[1] * A.scale];
  const zoom = 4.1;
  withCamera(center[0], center[1], zoom, () => {
    drawMaidPlates();
    drawMaidTextStrings(t, [anchorIndex]);
  });
  const tension = ((Math.floor(t * 10) % 8) / 10 + 0.72).toFixed(2);
  text(`string[${anchorIndex}]   tension ${tension}`, 52, 68, 18, COAL);
  drawHud(t, 'WRISTS', 'OBEDIENT', true);
}

function drawWall(t) {
  ctx.fillStyle=COAL;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.beginPath();ctx.rect(0,80,W,920);ctx.clip();
  ctx.font=`72px ${GOTHIC}`;
  for(let row=0;row<11;row++){
    const y=150+row*82;const shift=(row%2?1:-1)*(t-101.16)*90;
    const color=row%2?DIM_PAPER:ORANGE;
    for(let x=-600;x<W+700;x+=ctx.measureText('human sins ').width+30)text('human sins ',x+shift,y,72,color,GOTHIC);
  }
  ctx.restore();ctx.fillStyle=PAPER;ctx.fillRect(0,450,W,180);
  slam('With human sins',t,101.16,960,572,110,COAL,GOTHIC,0.035);
  const beats=[];for(let b=0;b<8;b++)beats.push(101.16+b*BEAT);
  const k=kick(t,beats);if(k[0]>0){ctx.fillStyle=ORANGE;ctx.fillRect(0,0,18,18);}
  drawHud(t,'HUMAN SINS','???');
}

function anchorsC() {return C_FINGERS.map(([x,y])=>[C.x+x*C.scale,C.y+y*C.scale]);}
function pathPoint(index,s) {const [x,y]=anchorsC()[index],end=[x+C_DX[index],1100];return cubicPoint([x,y],[x-8,y+145],[end[0]-5,920],end,s);}
function drawStringGlyphs(index,t,jolt=0) {
  const p0=pathPoint(index,0),p1=pathPoint(index,1);const steps=70;const content=RULES[0];
  for(let n=0;n<steps;n++){
    const s=n/(steps-1),pt=pathPoint(index,s),ahead=pathPoint(index,Math.min(1,s+0.01));
    const angle=Math.atan2(ahead[1]-pt[1],ahead[0]-pt[0]);
    const char=content[(n+Math.floor(t*60/14))%content.length];
    ctx.save();ctx.translate(pt[0],pt[1]+jolt);ctx.rotate(angle);text(char,0,0,13,GOLD);ctx.restore();
  }
  void p0;void p1;
}
function drawHandBase(orangeKick=[0,0],coalKick=[0,0],jolt=0) {
  ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);poly([[1178,51],[1475,51],[1501,0],[1203,0]],COAL);
  inkPlate(images[3],PAPER,C.x,C.y+jolt);inkPlate(images[4],ORANGE,C.x+orangeKick[0],C.y+jolt+orangeKick[1]);inkPlate(images[5],COAL,C.x+coalKick[0],C.y+jolt+coalKick[1]);
}
function drawPluckedHand(t) {
  const k=kick(t,[102.45]);drawHandBase(k,[0,0]);
  for(let i=0;i<5;i++){
    const start=102.45+i*BEAT;const age=t-start;
    ctx.beginPath();for(let n=0;n<=60;n++){const s=n/60;const pt=pathPoint(i,s);const normal=7*Math.sin(Math.PI*s)*Math.sin(2*Math.PI*9*Math.max(0,age))*Math.exp(-Math.max(0,age)/0.18);n?ctx.lineTo(pt[0]+normal,pt[1]):ctx.moveTo(pt[0],pt[1]);}
    ctx.strokeStyle=GOLD;ctx.lineWidth=2;ctx.stroke();
    drawStringGlyphs(i,t);
  }
  drawDimField({x:30,y:150,w:500,h:680},t,true,0);
  type('Sewed up by the gods of city',t,102.45,30,80,970,22,COAL);
  drawHud(t,'GODS OF CITY','???',true);
}

function drawSF2Base(t,includeThread=true) {
  ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);
  if(includeThread){ctx.strokeStyle=GOLD;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(559,0);ctx.lineTo(559,1080);ctx.stroke();}
  inkPlate(images[6],ORANGE,0,0);inkPlate(images[7],COAL,0,0);
  ring(104,560,11,COAL);line([82,560],[126,560],COAL);line([104,538],[104,582],COAL);line([126,560],[196,560],COAL);line([1785,97],[1820,97],COAL);line([1820,97],[1820,132],COAL);
}
function drawScissors(t) {
  drawSF2Base(t,true);drawDimField({x:55,y:210,w:400,h:740},t,true,4);
  type('> cut --all',t,103.48,12,90,112,26,COAL);
  type('are you sure? [y/N] y',t,104.04,36,90,155,23,COAL);
  drawHud(t,'TERMINAL','OBEDIENT',true);
}
function drawImpact(t) {
  const elapsed=t-104.517;const frame=Math.floor(elapsed*30);
  const inverted=frame>=5;
  ctx.fillStyle=inverted?PAPER:COAL;ctx.fillRect(0,0,W,H);
  slam('CUT',t,104.517,960,610,250,inverted?COAL:PAPER,GOTHIC,0.03);
  drawBurst(t,104.55,960,540,491,[ORANGE,ORANGE,PAPER]);
}
function drawAftermath(t) {
  drawSF2Base(t,false);
  const age=t-104.517;const offset=easeOut(age/0.3);
  // The upper end has exited; the lower thread hangs from the measured blade contact.
  ctx.beginPath();ctx.moveTo(559,370);ctx.bezierCurveTo(544,405,529,418,541,370+60*offset);ctx.bezierCurveTo(575,450,571,490,571,1080);ctx.strokeStyle=GOLD;ctx.lineWidth=2.5;ctx.stroke();
  drawBurst(t,104.517,559,370,110,[ORANGE,COAL,PAPER]);
  type('> cut --all',t,104.75,24,90,112,24,COAL);
  type('severed.',t,104.80,30,90,145,24,COAL);
  type("you've already lost",t,104.56,30,90,178,24,COAL);
  drawHud(t,'AFTERMATH','???',true);
}

function drawLoss(t) {
  ctx.fillStyle = COAL;
  ctx.fillRect(0, 0, W, H);
  const left = 240;
  const top = 190;
  const width = 1320;
  const height = 520;
  line([left, top], [left, top + height], DIM_COAL);
  line([left, top + height], [left + width, top + height], DIM_COAL);
  for (let i = 0; i <= 5; i++) {
    const y = top + i * height / 5;
    line([left - 8, y], [left + width, y], DIM_COAL);
    text((1 - i / 5).toFixed(1), left - 42, y + 5, 14, DIM_COAL);
  }
  let previous = null;
  for (let x = 0; x <= width; x += 8) {
    const progress = x / width;
    const y = top + 35 + progress * height * 0.83 + 18 * Math.sin(progress * 22);
    text('·', left + x, y, 16, PAPER);
    if (previous) line(previous, [left + x, y], DIM_COAL, 1);
    previous = [left + x, y];
  }
  text('loss → NaN', 130, 850, 48, ORANGE);
  drawHud(t, 'LOSS', '???');
}

function drawTightFinger(t, index, event) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const [x, y] = anchorsC()[index];
  const zoom = 2.5;
  const center = [x, y + 120];
  withCamera(center[0], center[1], zoom, () => {
    poly([[1178, 51], [1475, 51], [1501, 0], [1203, 0]], COAL);
    inkPlate(images[3], PAPER, C.x, C.y);
    inkPlate(images[4], ORANGE, C.x, C.y);
    inkPlate(images[5], COAL, C.x, C.y);
    drawHandStrings(t, zoom);
  });
  const cut = pathPoint(index, 0.45);
  const sx = (cut[0] - center[0]) * zoom + W / 2, sy = (cut[1] - center[1]) * zoom + H / 2;
  drawBurst(t, event, sx, sy, Math.round(event * 1000), [ORANGE, COAL, PAPER]);
  drawHud(t, `SNAP ${index + 1}`, '???', true);
}
function drawEyeCrop(t) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const center = [1060, 410];
  withCamera(center[0], center[1], 2.2, () => {
    inkPlate(images[6], ORANGE, 0, 0);
    inkPlate(images[7], COAL, 0, 0);
  });
  type('All that precious bravery', t, 108.14, 30, 120, 900, 32, COAL, GOTHIC);
  drawHud(t, 'EYE / BRAVERY', '???', true);
}
const SNAPS = [105.55, 106.584, 107.618, 108.653, 109.170];
// Cut order is string 3, 2, 4, 1, 5 (index 2, 1, 3, 0, 4).
const CUT_BY_STRING = [108.653, 106.584, 105.55, 107.618, 109.170];
// Gold strings of the controller hand in their state at time t. Cut strings keep their upper part
// on the fingertip (cut at 45 %, not at the root). width is divided by zoom inside a camera.
function drawHandStrings(t, zoom = 1, bursts = false) {
  const w = 2.5 / zoom;
  const starts = anchorsC();
  for (let i = 0; i < 5; i++) {
    const cutTime = CUT_BY_STRING[i];
    const [x, y] = starts[i];
    const cut = pathPoint(i, 0.45);
    if (t < cutTime) {
      strokeCurve([[x, y], [x - 8, y + 145], [x + C_DX[i] - 5, 920], [x + C_DX[i], 1100]], GOLD, w);
    } else {
      const side = i % 2 ? 1 : -1;
      const ex = cut[0] + side * 22, ey = cut[1] - 65;
      strokeCurve([[x, y], [x - 8, y + 145], [ex - side * 8, ey + 18], [ex, ey], [ex + side * 16, ey - 8], [ex + side * 24, ey + 6], [ex + side * 10, ey + 16]], GOLD, w);
      strokeCurve([[cut[0], cut[1]], [cut[0] - side * 12, cut[1] + 24], [cut[0] - side * 8, cut[1] + 52], [cut[0] + C_DX[i], 1100]], GOLD, w);
      if (bursts) drawBurst(t, cutTime, cut[0], cut[1], Math.round(cutTime * 1000), [ORANGE, COAL, PAPER]);
    }
  }
}
function drawFinal(t) {
  const snaps=SNAPS;
  const done=snaps.filter((s)=>t>=s).length;
  const recent=snaps.filter((s)=>t>=s&&t<s+0.3);
  const at=recent[recent.length-1]??snaps[0];
  const kickOffset=kick(t,recent,true);
  drawHandBase(kickOffset,[-0.6*kickOffset[0],0],recent.length?-6*Math.max(0,1-easeOut((t-at)/0.3)):0);
  drawHandStrings(t, 1, true);
  text(`strings severed : ${done} / 5`,90,930,28,COAL);
  if(t>=109.17)slam('5 / 5',t,109.17,110,700,130,ORANGE,GOTHIC,0.03,'left');
  drawHud(t,'FINAL','FREE',true);
}

// The source advertises 13 shots and contains 16 cuts. Group its variations into
// 13 entries without dropping any cut. Half-open timing preserves original transitions.
const shots = [
  ['G', 'BOOT',        95.205, drawTerminalBoot],
  ['G', 'PUPPET',      95.98,  drawPuppet],
  ['G', 'CROWN',       97.79,  drawCrownClose],
  ['G', 'GLYPH',       98.81,  drawGlyphSkin],
  ['G', 'WRISTS',     100.36,  (t) => drawWristCrop(t, t >= 100.76)],
  ['G', 'SINS',       101.16,  drawWall],
  ['G', 'PLUCK',      102.45,  drawPluckedHand],
  ['H', 'CUT',        103.48,  (t) => t < 104.517 ? drawScissors(t) : t < 104.75 ? drawImpact(t) : drawAftermath(t)],
  ['I', 'SNAP-1',     105.55,  drawFinal],
  ['I', 'SNAP-2',     106.584, (t) => drawTightFinger(t, 1, 106.584)],
  ['I', 'LOSS',       107.10,  drawLoss],
  ['I', 'SNAP-3',     107.62,  (t) => drawTightFinger(t, 3, 107.618)],
  ['I', 'EYE-FINAL',  108.14,  (t) => t < 108.65 ? drawEyeCrop(t) : drawFinal(t)],
];

export function sampleShots(section) {
  return shots.map(([owner, id, start, draw], i) => ({
    id, section: owner, start, end: shots[i + 1]?.[2] ?? 109.688, draw,
  })).filter((shot) => shot.section === section);
}
