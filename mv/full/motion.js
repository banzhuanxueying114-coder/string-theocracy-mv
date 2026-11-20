/*
 * Motion adapted from Nyankomint's world-execute-me-lyric-mv-main:
 * src/engine/{util,transitions,type}.js, src/scenes/{shot,climax}.js,
 * and src/components/plate.js. No reference artwork is included.
 * SPDX-License-Identifier: MIT
 *
 * MIT License
 * Copyright (c) 2026 Nyankomint
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const unit = (x) => Math.max(0, Math.min(1, x));
const TAU = 2 * Math.PI;
const EPSILON = 1e-9;

export function easeOutBack(progress, overshoot = 1.70158) {
  const x = unit(progress) - 1;
  return 1 + (overshoot + 1) * x ** 3 + overshoot * x ** 2;
}

export function easeOutExpo(progress) {
  // Normalize the curve so the result doesn't jump at 1.
  return (1 - 2 ** (-10 * unit(progress))) / (1 - 2 ** -10);
}

export function easeInOutCubic(progress) {
  const k = unit(progress);
  return k < 0.5 ? 4 * k ** 3 : 1 - 4 * (1 - k) ** 3;
}

/** Age in beats of the latest event, including a small tolerance at the beat. */
export function beatAge(localBeat, beats) {
  let last = -Infinity;
  for (const beat of beats) {
    if (beat <= localBeat + EPSILON && beat > last) last = beat;
  }
  return Math.max(0, localBeat - last);
}

/** Peak at each event and decay exponentially. localBeat/beat cues in beats, decay per beat. */
export function beatHit(localBeat, beats, decay = 5) {
  const age = beatAge(localBeat, beats);
  return Number.isFinite(age) ? Math.exp(-decay * age) : 0;
}

/** A signed, damped displacement. t in beats, freq in cycles/beat, damp per beat. */
export function spring(t, freq = 2.6, damp = 13) {
  if (t < 0 || !Number.isFinite(t)) return 0;
  return Math.exp(-damp * t) * Math.cos(TAU * freq * t);
}

/** Short attack, recoil, then exact registration. All timings are in beats. */
export function kick(age, { attack = 0.075, duration = 0.54, freq = 2.6, damp = 13 } = {}) {
  if (age < 0 || age >= duration) return 0;
  if (age < attack) return easeOutExpo(age / attack);
  const elapsed = age - attack;
  const tail = (duration - attack) * 0.25;
  const settle = 1 - easeInOutCubic((age - (duration - tail)) / tail);
  return spring(elapsed, freq, damp) * settle;
}

/** Per-glyph motion in beats. `end` is when the last glyph has left. */
export function staggeredGlyph(localBeat, index, count, {
  start = 0, end = Infinity, step = 0.034, settle = 0.32,
  exitStep = 0.007, exitDuration = 0.25, dx = -9, dy = 17,
  tilt = 0.044, tiltSign = 1,
} = {}) {
  const enterAge = localBeat - start - index * step;
  const exitAge = localBeat - (end - (count - 1 - index) * exitStep - exitDuration);
  if (enterAge < -EPSILON || exitAge >= exitDuration) return null;
  const arrival = 1 - easeOutBack(enterAge / settle, 1.35);
  const leave = unit(exitAge / exitDuration) ** 3;
  return {
    x: dx * arrival + dx * 1.7 * leave,
    y: dy * arrival - dy * 1.6 * leave,
    rotation: tilt * tiltSign * (arrival + leave),
    scale: 1 - 0.045 * arrival - 0.1 * leave,
    alpha: unit(enterAge / (settle * 0.28)) * (1 - leave),
    rested: enterAge >= settle && exitAge <= 0,
  };
}

/** Draw a new shot through a hard-edged direction mask or a staggered rectangular grille. */
export function wipe(ctx, [x, y, w, h], progress, draw, {
  direction = 'down', grid, edge, edgeWidth = 4,
} = {}) {
  if (progress <= 0) return;
  if (progress >= 1) { draw(); return; }
  const k = easeInOutCubic(progress);
  ctx.save();
  try {
    ctx.beginPath();
    let rule;
    if (grid) {
      const [columns, rows] = grid;
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const x0 = Math.round(x + w * column / columns);
          const x1 = Math.round(x + w * (column + 1) / columns);
          const y0 = Math.round(y + h * row / rows);
          const stage = (column / columns + row / rows) * 0.31;
          const height = Math.round((Math.round(y + h * (row + 1) / rows) - y0) * unit((k - stage) / 0.38));
          if (height > 0) ctx.rect(x0, y0, x1 - x0, height);
        }
      }
    } else {
      const xRun = Math.round(w * k), yRun = Math.round(h * k);
      if (direction === 'right') {
        ctx.rect(x, y, xRun, h);
        rule = [x + xRun - edgeWidth, y, edgeWidth, h];
      } else if (direction === 'left') {
        ctx.rect(x + w - xRun, y, xRun, h);
        rule = [x + w - xRun, y, edgeWidth, h];
      } else if (direction === 'up') {
        ctx.rect(x, y + h - yRun, w, yRun);
        rule = [x, y + h - yRun, w, edgeWidth];
      } else {
        ctx.rect(x, y, w, yRun);
        rule = [x, y + yRun - edgeWidth, w, edgeWidth];
      }
    }
    ctx.clip();
    draw();
    if (edge && rule) {
      ctx.fillStyle = edge;
      ctx.fillRect(...rule);
    }
  } finally {
    ctx.restore();
  }
}
