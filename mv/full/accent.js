// Three-tier camera punch for sections C–I (A and B keep their own approved motion).
// The hard cut already marks the beat, so an ordinary cut gets no camera punch at all.
//   STRONG  - plot hits: full kick (punch + recoil), as before
//   bar downbeat cuts - a single soft push without recoil (~1/3 strength), at most one per bar
//   everything else - nothing
import { beatAge, kick } from './motion.js';

const BEAT = 0.517241;
const BAR = 4 * BEAT;
const GRID0 = 0.033;
const bt = (bar, beat = 1) => GRID0 + (bar - 1) * BAR + (beat - 1) * BEAT;

export const STRONG = [
  35.2,          // C6 strings go slack, she drops to her knees
  37.277,        // D1 the book slams shut, every string snaps taut
  53.3,          // D10 her own curtain call, strings go slack
  70.26,         // E8 she leaps into the shaft
  bt(36, 3),     // F2 the face cracks on the fall
  bt(49, 2),     // G5 the glove falls off: a bare hand
  bt(50),        // G6 the hood slips: a porcelain face
  104.73,        // H2 the shears close
  bt(57, 2),     // I7 the replacement lands
  bt(59), bt(59, 3), bt(59, 4), // I10 / I11 the window breaks
];
const SOFT = 0.35;

function lastCue(beatNow, cueBeats) {
  let last = -Infinity;
  for (const c of cueBeats) if (c <= beatNow + 1e-6 && c > last) last = c;
  return last;
}

/** Drop-in for kick(beatAge(beatNow, cueBeats)). */
export function accentKick(beatNow, cueBeats) {
  const cue = lastCue(beatNow, cueBeats);
  if (!Number.isFinite(cue)) return 0;
  const age = beatAge(beatNow, cueBeats);
  const at = cue * BEAT;
  if (STRONG.some((s) => Math.abs(s - at) < 0.06)) return kick(age);
  const inBar = (((at - GRID0) % BAR) + BAR) % BAR;
  if (inBar < 0.06 || BAR - inBar < 0.06) return SOFT * Math.max(0, kick(age));
  return 0;
}
