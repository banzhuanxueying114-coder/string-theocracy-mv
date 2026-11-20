import { barBeatToSeconds, beatAt } from './beatgrid.js';
import { ctx, W, H, PAPER, ORANGE, COAL, text, drawHud } from './engine/canvas.js';

export function scene(section, id, start, summary, draw = drawPlaceholder) {
  return { id, section, start, summary, draw };
}

function resolveStart(grid, start) {
  if (typeof start === 'number' && Number.isFinite(start)) return start;
  const cue = /^(\d+)\.(\d+)$/.exec(start);
  if (!cue) throw new Error(`Invalid scene cue: ${start}`);
  const [, bar, beat] = cue.map(Number);
  if (bar < 1 || beat < 1 || beat > grid.meter) throw new Error(`Invalid bar.beat: ${start}`);
  return barBeatToSeconds(grid, bar, beat);
}

export function parseLrc(source) {
  const offset = Number(/^\[offset:([+-]?\d+)\]/m.exec(source)?.[1] ?? 0) / 1000;
  const lyrics = [];
  for (const line of source.split(/\r?\n/)) {
    const cues = [...line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    if (!cues.length) continue;
    const lyric = line.slice(cues.at(-1).index + cues.at(-1)[0].length).trim();
    for (const [, minutes, seconds] of cues) lyrics.push({ time: Number(minutes) * 60 + Number(seconds) + offset, lyric });
  }
  return lyrics.sort((a, b) => a.time - b.time);
}

export function createTimeline(grid, entries, lyrics) {
  const shots = entries.map((entry) => ({ ...entry, start: resolveStart(grid, entry.start) }))
    .sort((a, b) => a.start - b.start);
  const planned = shots.filter((shot) => shot.end == null);
  const timed = shots.filter((shot) => shot.end != null);
  return {
    shots,
    draw(t) {
      // Bounded shots temporarily replace the editorial storyboard, then yield back to it.
      const shot = timed.findLast((entry) => t >= entry.start && t < entry.end)
        ?? planned.findLast((entry) => t >= entry.start) ?? planned[0];
      const lyric = lyrics.findLast((cue) => t >= cue.time)?.lyric ?? '';
      shot.draw(t, { shot, lyric, localTime: t - shot.start, ...beatAt(grid, t) });
      return shot.id;
    },
  };
}

const CJK = '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
function wrappedText(value, x, y, size, width, color) {
  ctx.font = `${size}px ${CJK}`;
  let row = '';
  for (const glyph of value) {
    const next = row + glyph;
    if (row && ctx.measureText(next).width > width) {
      text(row, x, y, size, color, CJK);
      y += size * 1.4;
      row = glyph;
    } else row = next;
  }
  text(row, x, y, size, color, CJK);
}

function drawPlaceholder(t, { shot, lyric, bar, beat }) {
  ctx.fillStyle = COAL;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAPER;
  ctx.fillRect(36, 80, 1848, 920);
  ctx.fillStyle = ORANGE;
  ctx.fillRect(36, 80, 24, 920);
  text(shot.id, 116, 408, 182, COAL);
  wrappedText(shot.summary, 133, 557, 48, 1610, COAL);
  wrappedText(lyric, 133, 893, 40, 1610, COAL);
  drawHud(t, shot.id, 'STORYBOARD', false, { bar, beat });
}
