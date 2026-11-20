// Sample clip 1:35–2:04 (bars 47–60): storyboard shots G4–G7, H1–H2, I1–I11 and the first breath of J1.
// Cuts sit on beats; lyric times come from music/String Theocracy.lrc.
// Figures move in code: the moving part of a drawing is a crisp cut-out (tools/make_rigs.py → art/sample/rig) that is turned,
// slid or dropped over a background plate. No interpolated or blended in-between frames anywhere.
import { W, H, g, beat, clamp, lerp, prog, ease, easeOut, expoOut, easeIn, rng, view, layer, diffSprite, string, write, shards, cracks, fill, glassFall, glassSnow, dust } from './engine.js';

const RIG = ['g40_p', 'g40_a', 'g40_b', 'g41_p', 'g41_a', 'g41_b', 'g50_p', 'g50_a', 'g60_p', 'g60_a', 'i20_p', 'i20_a', 'i20_b', 'i40_p', 'i40_b', 'i50_p', 'i50_a', 'i50_b', 'i80_p', 'i80_b'];
export const IMAGES = ['g4_hand_seam', 'g5_hand_half', 'g6_hooded', 'g7_sewn', 'h1_scissors', 'h1_cut', 'h2_curl', 'h2_burst', 'i1_fist', 'i1_half', 'i1_open', 'i2_lift', 'i2_foot', 'i3_blood',
  'i4_rise', 'i5_wrist', 'i6_stand', 'i6_walk', 'i7_newdoll', 'i8_reach', 'i9_low', 'i9_raise', 'i10_before', 'i10_crack', 'i11_cracked', 'i11_after', ...RIG.map((r) => `rig/${r}`)];
export const RANGE = [beat(184), beat(241)];
/** Runs once after the pictures are loaded. */
export function prepare() { diffSprite('i10_scissors', 'i10_before', 'i10_crack', { box: [0.6, 0.3, 1, 0.68] }); }

const AR = 1672 / 941;
/** Image point pt turned by angle a about pivot (image fractions): where something pinned to a turning cut-out ends up. */
const turn = ([x, y], [px, py], a) => { const dx = (x - px) * AR, dy = y - py, c = Math.cos(a), s = Math.sin(a); return [px + (dx * c - dy * s) / AR, py + dx * s + dy * c]; };
/** A part carried rigidly from pose a to pose b (p = 0..1): cut-out a turns by ang about pivot up to the half-way point,
 *  there the drawing changes once to cut-out b, which finishes the turn. Draws the background plate first. */
function carry(part, o, p, { pivot = [0.5, 0.5], ang = 0, tx = 0, ty = 0, crop, clip } = {}) {
  layer(`rig/${part}_p`, o);
  if (p < 0.5) layer(`rig/${part}_a`, o, { pivot, rot: ang * p, tx: tx * p, ty: ty * p, crop, clip });
  else layer(`rig/${part}_b`, o, { pivot, rot: -ang * (1 - p), tx: -tx * (1 - p), ty: -ty * (1 - p), crop, clip });
}
const sway = (t, i, amp = 5) => Math.sin(t * (1.1 + i * 0.23) + i * 1.7) * amp;
/** Decaying camera shake that starts at t0. */
const shake = (t, t0, amp, dur = 0.45) => { const u = (t - t0) / dur; if (u < 0 || u > 1) return [0, 0]; const k = amp * (1 - u) * (1 - u); return [Math.sin(t * 91) * k, Math.cos(t * 77) * k]; };
const IN = 0.16; // every lyric lands whole, in this many seconds
/** Her voice before the awakening: small orange handwriting tucked into the dark. */
const small = (text, x, y, t, t0, o = {}) => write(text, x, y, 62, prog(t, t0, t0 + IN), { shadow: 0.9, punch: 0.06, ...o });
/** Her voice after the awakening: it fills the frame. */
const big = (text, x, y, size, t, t0, o = {}) => write(text, x, y, size, prog(t, t0, t0 + IN), { col: '#ff8436', shadow: 1, ...o });
/** Soft dark band so handwriting stays readable over bright glass. */
function band(y, h, alpha) { const v = g.createLinearGradient(0, y - h / 2, 0, y + h / 2); v.addColorStop(0, 'rgba(6,4,3,0)'); v.addColorStop(0.5, `rgba(6,4,3,${alpha})`); v.addColorStop(1, 'rgba(6,4,3,0)'); g.fillStyle = v; g.fillRect(0, y - h / 2, W, h); }

const crackI10 = cracks(41, { rays: 13, maxLen: 1500 });

const shot = (id, b0, b1, draw, post) => ({ id, a: beat(b0), b: beat(b1), draw, post });
export const SHOTS = [
  // G4 1:35.2 "Maybe we're all cold machines": she turns her hand over at the wrist and looks at it; the glove's seam has split
  shot('G4', 184, 190, (t, u) => {
    const o = { z: lerp(1.05, 1.22, ease(u)), fx: 0.5, fy: 0.12 }, wrist = [0.695, 0.47], ang = -0.34, p = ease(prog(t, beat(187), beat(187) + 0.55));
    const idle = Math.sin(t * 1.7) * 0.012, m = view('g4_hand_seam', o);
    carry('g40', o, ease(prog(t, beat(187) + 0.3, beat(187) + 0.75)), { pivot: [0.33, 0.72], ang: 0.03 }); // her head follows the hand
    layer('rig/g41_p', o);
    if (p < 0.5) layer('rig/g41_a', o, { pivot: wrist, rot: ang * p + idle, crop: [0.55, 0.4, 0.705, 0.68] }); else layer('rig/g41_b', o, { pivot: wrist, rot: -ang * (1 - p) + idle, crop: [0.55, 0.4, 0.705, 0.68] });
    [[[0.445, 0.3], [0.655, 0.47]], [[0.52, 0.2], [0.69, 0.47]], [[0.37, 0.34], [0.47, 0.76]]].forEach(([a, b], i) => string(m(...a), m(...(i < 2 ? turn(b, wrist, idle) : b)), { bend: sway(t, i, 4), text: true, size: 11, offset: Math.floor(t * 9) + i * 7, alpha: 0.9 }));
    dust(4, t);
    small("Maybe we're all\ncold machines", 1330, 300, t, 95.98);
  }),
  // G5 1:38.3 "Stuffed in the human skin": the glove slides down off the hand like skin and drops; this hand hangs from strings too
  shot('G5', 190, 195, (t, u) => {
    const hit = beat(193), k = expoOut(prog(t, hit, hit + 0.5));
    const [sx, sy] = shake(t, hit, 9);
    const o = { z: lerp(1.06, 1.14, u) + 0.1 * k, fx: 0.45, fy: 0.55, dx: sx, dy: sy }, m = view('g5_hand_half', o);
    const creep = prog(t, beat(190), beat(191)), s = easeIn(prog(t, beat(191), beat(191) + 0.62));
    layer('rig/g50_p', o);
    if (s < 1) layer('rig/g50_a', o, { pivot: [0.45, 0.6], ty: 0.02 * creep + 1.05 * s, tx: -0.04 * s, rot: -0.3 * s });
    const p = prog(t, hit, hit + 0.35);
    if (p > 0) [[0.455, 0.5, 0.4], [0.5, 0.56, 0.47], [0.545, 0.58, 0.56], [0.43, 0.3, 0.36]].forEach(([x, y, tx], i) => {
      const top = m(tx, -0.2), end = m(x, y), q = easeOut(clamp(p * 1.4 - i * 0.1));
      string(top, [lerp(top[0], end[0], q), lerp(top[1], end[1], q)], { bend: sway(t, i, 3), text: true, size: 12, offset: i * 5 + Math.floor(t * 9), alpha: 0.95 });
    });
    dust(5, t);
    small('Stuffed in\nthe human skin', 1290, 520, t, 98.81);
  }),
  // G6 1:40.9 "With human sins": the hood is pulled up and back off the head; under it, a porcelain face
  shot('G6', 195, 198, (t, u) => {
    const [sx, sy] = shake(t, beat(196), 7, 0.3);
    const o = { z: lerp(1.16, 1.07, expoOut(u)), fx: 0.52, fy: 0.38, dx: sx, dy: sy }, m = view('g6_hooded', o);
    const s = easeIn(prog(t, beat(195.4), beat(195.4) + 0.5));
    layer('rig/g60_p', o);
    if (s < 1) layer('rig/g60_a', o, { pivot: [0.6, 0.1], tx: 0.1 * s, ty: -0.95 * s, rot: 0.22 * s }); // pulled up and back, off the head
    [[[0.44, -0.2], [0.47, 0.1]], [[0.6, -0.2], [0.585, 0.16]], [[0.3, -0.2], [0.41, 0.9]]].forEach(([a, b], i) => string(m(...a), m(...b), { bend: sway(t, i, 3), w: 1.3, alpha: 0.75 }));
    dust(6, t);
    small('With human sins', 1400, 250, t, 101.16);
  }),
  // G7 1:42.5 "Sewed up by the gods of city": every string runs to the icon's open hands
  shot('G7', 198, 201, (t, u) => {
    const m = view('g7_sewn', { z: lerp(1.75, 1.03, expoOut(u)), fx: 0.495, fy: 0.42 });
    const r = rng(77), hands = [[0.335, 0.4], [0.66, 0.4]];
    for (let i = 0; i < 16; i++) {
      const x = 0.03 + r() * 0.94, y = 0.82 + r() * 0.14, hnd = hands[x < 0.5 ? 0 : 1], q = easeOut(clamp(u * 2.2 - i * 0.05));
      if (q <= 0) continue;
      const a = m(x, y), b = m(...hnd);
      string(a, [lerp(a[0], b[0], q), lerp(a[1], b[1], q)], { bend: sway(t, i, 5) - 10, text: i % 2 === 0, size: 10, offset: i * 3, alpha: 0.8, w: 1.2 });
    }
    small('Sewed up by the gods of city', W / 2, 1010, t, 102.45, { align: 'center' });
  }),
  // H1 1:44.0 the music stops for one beat: the blades snap shut on the thread (two drawings, one cut on the snap)
  shot('H1', 201, 202, (t, u, lt) => {
    const snap = lt >= 0.36, [sx, sy] = shake(t, beat(201) + 0.36, 7, 0.14);
    view(snap ? 'h1_cut' : 'h1_scissors', { z: lerp(1.02, 1.06, u) + (snap ? 0.03 * (1 - expoOut(clamp((lt - 0.36) / 0.12))) : 0), fx: 0.5, fy: 0.5, dx: sx, dy: sy });
  }, { vignette: 0.12, grain: 0.07 }),
  // H2 1:44.5 "Cut it off, you've already lost": the shell bursts, a person comes out
  shot('H2', 202, 204, (t, u, lt) => {
    const [sx, sy] = shake(t, beat(202), 16, 0.5);
    const m = view(lt < 0.1 ? 'h2_curl' : 'h2_burst', { z: lt < 0.1 ? 1.3 - lt : lerp(1.4, 1.06, expoOut(u)), fx: 0.49, fy: 0.42, dx: sx, dy: sy });
    const c = m(0.49, 0.5);
    // the cut strings whip upward and away
    [[0.6, 0.83], [0.855, 0.77], [0.4, 0.3], [0.58, 0.3], [0.3, 0.6], [0.72, 0.55]].forEach(([x, y], i) => {
      const q = expoOut(clamp(u * 1.5)), a = m(x + (i % 2 ? 0.1 : -0.1) * q, -0.15), e = m(x, y), end = [lerp(e[0], a[0], q * 0.8), lerp(e[1], a[1], q * 0.8)];
      string(a, end, { bend: (i % 2 ? 1 : -1) * 90 * q, w: 1.6, alpha: 1 - q * 0.9 });
    });
    shards(9, c[0], c[1], u, { n: 34, reach: 1380, size: 34, spin: 4, toward: 1 });
    fill('#fff6e2', 0.85 * (1 - expoOut(clamp(lt / 0.42))));
    band(885, 520, 0.72 * prog(lt, 0, 0.3));
    big('Cut it off,', 150, 860, 200, t, 104.56, { rot: -0.035 });
    big("you've already lost", 420, 1030, 172, t, 105.0, { rot: -0.035 });
  }),
  // I1 1:45.6 the fist she kept clenched opens, by her own will (three drawings: fist, half open, open)
  shot('I1', 204, 206, (t, u) => {
    const mid = beat(205);
    view(t < mid - 0.07 ? 'i1_fist' : t < mid + 0.07 ? 'i1_half' : 'i1_open', { z: lerp(1.08, 1.16, u), fx: 0.5, fy: 0.6 });
    dust(7, t);
  }),
  // I2 1:46.6 "All that precious bravery": the foot comes down into the soil
  shot('I2', 206, 208, (t, u, lt) => {
    const hitT = 0.2, down = easeIn(prog(lt, 0, hitT)), [sx, sy] = shake(t, beat(206) + hitT, 12, 0.4);
    if (lt < hitT) view('i2_lift', { z: 1.2, fx: 0.5, fy: 0.72, dy: lerp(-70, 0, down) }); // two drawings: the frame drops with the foot, the cut lands on the impact
    else view('i2_foot', { z: 1.2 - 0.06 * expoOut(prog(lt, hitT, hitT + 0.3)) + 0.03 * u, fx: 0.5, fy: 0.72, dx: sx, dy: sy });
    band(985, 210, 0.62);
    big('All that precious\nbravery', 90, 900, 84, t, 107.12, { lead: 1.19 });
  }),
  // I3 1:47.6 "is gonna get you hurt": the only red in the film wells up
  shot('I3', 208, 212, (t, u) => {
    const o = { z: lerp(1.5, 1.72, u), fx: 0.47, fy: 0.69 };
    view('i2_foot', o); view('i3_blood', { ...o, alpha: ease(prog(t, beat(208.6), beat(210))) });
    band(970, 230, 0.68);
    big('is gonna get you\nhurt', 90, 938, 96, t, 108.15, { lead: 0.96 });
  }),
  // I4 1:49.7 "In a world that feeds on the minority": she rises through the trapdoor onto the stage in front of every hood
  shot('I4', 212, 216, (t, u, lt) => {
    const o = { z: lerp(1.04, 1.2, ease(u)), fx: 0.51, fy: 0.5 }, r = 1 - ease(prog(lt, 0.1, 1.25));
    view('i4_rise', o); layer('rig/i40_p', o);
    layer('rig/i40_b', o, { ty: 0.225 * r + 0.005 * Math.abs(Math.sin(lt * 10)) * (r > 0 ? 1 : 0), clip: [0.3, 0, 0.7, 0.7], crop: r > 0 ? [0.3, 0, 0.7, 0.686] : undefined });
    dust(8, t);
    band(195, 260, 0.72);
    big('In a world that feeds\non the minority', W / 2, 145, 78, t, 110.05, { align: 'center', lead: 1.15 });
  }),
  // I5 1:51.8 "May that self-centered belief": the strings come down, find nothing to hold; she turns her palm up
  shot('I5', 216, 220, (t, u, lt) => {
    const o = { z: lerp(1.05, 1.12, u), fx: 0.55, fy: 0.4 }, m = view('i5_wrist', o), wr = [0.5, 0.3], p = ease(prog(t, beat(217.4), beat(217.4) + 0.45));
    const k = p < 0.5 ? 'a' : 'b', rot = p < 0.5 ? 0.45 * p : -0.45 * (1 - p); // the hand turns at the wrist; the forearm stays
    layer('rig/i50_p', o); layer(`rig/i50_${k}`, o, { clip: [0, 0.3, 1, 1] }); layer(`rig/i50_${k}`, o, { pivot: wr, rot, crop: [0.38, 0, 0.78, 0.3] });
    [[0.5, 0.555, 0.36], [0.62, 0.535, 0.44], [0.4, 0.58, 0.27]].forEach(([tx, x, y], i) => {
      const l = lt - 0.14 - i * 0.2;
      if (l < 0) return;
      const top = m(tx, -0.2), hit = m(x, y), fall = m(x + 0.1 + i * 0.07, 1.25);
      const a = expoOut(clamp(l / 0.2)), s = easeIn(clamp((l - 0.42) / 1.0));
      const end = s > 0 ? [lerp(hit[0], fall[0], s), lerp(hit[1], fall[1], s)] : [lerp(top[0], hit[0], a), lerp(top[1], hit[1], a)];
      string(top, end, { bend: (i % 2 ? -1 : 1) * (26 * Math.sin(Math.min(l, 0.5) * 20) * (1 - clamp(l / 0.5)) + 110 * s), text: true, size: 12, offset: i * 9, alpha: 1 - s * 0.6 });
    });
    dust(9, t);
    big('May that self-centered\nbelief', 1010, 600, 84, t, 112.63, { lead: 1.12 });
  }),
  // I6 1:53.8 "lead you to peace": she bends down and closes a believer's record book
  shot('I6', 220, 224, (t, u) => {
    view(t < beat(221) ? 'i6_stand' : 'i6_walk', { z: 1.1, fx: 0.5, fy: 0.5, dx: lerp(70, -70, ease(u)) }); // two drawings, cut on the beat
    dust(10, t);
    band(320, 230, 0.48);
    big('lead you to peace', 110, 330, 112, t, 114.3);
  }),
  // I7 1:55.9 a new doll, identical to her, is lowered onto the stage
  shot('I7', 224, 226, (t, u, lt) => {
    const m = view('i7_newdoll', { z: 1.3, fx: 0.52, fy: 0.5, dy: -150 * (1 - easeOut(u)) + 10 * Math.sin(lt * 9) * Math.exp(-lt * 2.2) * prog(lt, 0.5, 0.7), dx: 7 * Math.sin(lt * 2.6) });
    [[0.5, 0.505, 0.14], [0.47, 0.475, 0.26], [0.57, 0.565, 0.26], [0.44, 0.455, 0.5], [0.6, 0.6, 0.5]].forEach(([tx, x, y], i) => string([m(tx, 0)[0], -20], m(x, y), { bend: sway(t, i, 3), text: true, size: 11, offset: i * 5 + Math.floor(t * 12), alpha: 0.9 }));
    dust(11, t);
  }),
  // I8 1:56.9 "If you're gonna replace me": face to face, framed like the mirror; she reaches for its cheek
  shot('I8', 226, 230, (t, u) => {
    const o = { z: lerp(1.04, 1.13, u), fx: 0.5, fy: 0.4 }, m = view('i8_reach', o), sh = [0.48, 0.625], ARM = [0.48, 0.34, 0.72, 0.72];
    const p = prog(t, beat(227.3), beat(227.3) + 0.6), rot = 1.2 * (1 - easeOut(p)) - 0.07 * Math.sin(p * Math.PI) * p + 0.015 * Math.sin(t * 1.9); // her arm swings up from her side to the doll's cheek
    layer('rig/i80_p', o, { clip: ARM }); layer('rig/i80_b', o, { pivot: sh, rot, crop: ARM, disc: 0.046 });
    [[0.74, 0.745, 0.1], [0.83, 0.82, 0.42], [0.79, 0.79, 0.9]].forEach(([tx, x, y], i) => string([m(tx, 0)[0], -20], m(x, y), { bend: sway(t, i, 3), text: true, size: 11, offset: i * 5, alpha: 0.85 }));
    dust(12, t);
    band(965, 210, 0.54);
    big("If you're gonna replace me", W / 2, 970, 106, t, 117.22, { align: 'center' });
  }),
  // I9 1:59.0 "At least have the audacity": she raises the scissors (two drawings) as the camera pulls back to the whole icon
  shot('I9', 230, 231.75, (t, u, lt) => {
    view(lt < 0.2 ? 'i9_low' : 'i9_raise', { z: lerp(1.9, 1.08, expoOut(prog(lt, 0.2, 0.8))), fx: 0.5, fy: 0.85 });
    band(170, 380, 0.7);
    big('At least have the\naudacity', W / 2, 135, 92, t, 118.94, { align: 'center', lead: 1.09 });
  }),
  // I10 2:00.0 "to kill me thoroughly": the blade flies in and lands on the beat; cracks run across the glass face
  shot('I10', 231.75, 234, (t, u, lt) => {
    const hit = beat(232), l = t - hit, [sx, sy] = shake(t, hit, 24, 0.5), [s2x, s2y] = shake(t, beat(233), 12, 0.4);
    const o = { z: (l < 0 ? 1.26 : lerp(1.3, 1.1, expoOut(clamp(l / 0.5)))) + 0.04 * u, fx: 0.64, fy: 0.51, dx: sx + s2x, dy: sy + s2y };
    if (l < 0) { // the glass face is still whole; the scissors fly in from the right, trailing a short smear
      view('i10_before', o);
      for (let k = 3; k >= 0; k--) { const fly = 1500 * ((-l + k * 0.012) / 0.129); view('i10_scissors', { ...o, dx: fly, dy: -fly * 0.07, alpha: k ? 0.22 : 1 }); }
    } else {
      const m = view('i10_crack', o);
      crackI10(m(0.64, 0.51), m.z, expoOut(clamp(l / 0.45)) * 0.34 + expoOut(prog(t, beat(233), beat(233) + 0.4)) * 0.3 + easeIn(prog(t, hit, beat(234))) * 0.36);
      fill('#fff6e2', 0.5 * (1 - expoOut(clamp(l / 0.22))) + 0.16 * (1 - expoOut(prog(t, beat(233), beat(233) + 0.2))) * (t >= beat(233) ? 1 : 0));
    }
    band(930, 420, 0.7);
    big('to kill me thoroughly', W / 2, 980, 150, t, 120.1, { align: 'center' });
  }),
  // I11a 2:01.1 the whole window is cracked and still holding: one held breath before the drop
  shot('I11a', 234, 235, (t, u) => {
    const k = 2 + 7 * u * u;
    view('i11_cracked', { z: lerp(1.02, 1.06, u), fx: 0.5, fy: 0.86, dx: Math.sin(t * 83) * k, dy: Math.cos(t * 71) * k });
    fill('#fff6e2', 0.1 * u * (0.5 + 0.5 * Math.sin(t * 40)));
  }),
  // I11 2:01.6 on the drop the window lets go from the face outward and comes down; what is left is an empty arch full of light, and her
  shot('I11', 235, 241, (t, u, lt) => {
    const [sx, sy] = shake(t, beat(235), 20, 0.7), wave = 0.62;
    const o = { z: 1.06 + 0.2 * ease(prog(lt, 0.4, 3.1)), fx: 0.5, fy: 0.86, dx: sx, dy: sy };
    const m = lt < 1.3 ? view('i11_cracked', o) : view('i11_after', o);
    const a = m(0.12, 0), b = m(0.88, 0.93), far = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.6, c = m(0.5, 0.19), R = far * (lt / wave) * 1.05;
    if (lt < 1.3) { // the light breaks through a jagged, growing hole
      const r = rng(5), pts = []; for (let k = 0; k < 40; k++) { const ang = (k / 40) * 6.283, rr = R * (0.72 + 0.5 * r()); pts.push([c[0] + Math.cos(ang) * rr, c[1] + Math.sin(ang) * rr]); }
      g.save(); g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.clip(); view('i11_after', o); g.restore();
    }
    glassFall(31, lt, { n: 420, box: [a[0], a[1], b[0], b[1]], o: c, wave });
    glassSnow(8, lt, { n: 60, alpha: prog(lt, 0.9, 1.9) });
    fill('#fff6e2', 0.55 * (1 - expoOut(clamp(lt / 0.25))));
    fill('#000', ease(prog(t, beat(241) - 0.7, beat(241) - 0.05)));
  }, { vignette: 0.3, grain: 0.07 }),
];
