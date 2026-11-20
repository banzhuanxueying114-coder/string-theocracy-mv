export function barBeatToSeconds(grid, bar, beat = 1) {
  return grid.bar1 + (bar - 1) * grid.barSec + (beat - 1) * grid.beatSec;
}

export function beatAt(grid, t) {
  const elapsed = Math.max(0, t - grid.bar1);
  const index = Math.floor(elapsed / grid.barSec);
  const beat = Math.floor((elapsed - index * grid.barSec + 1e-9) / grid.beatSec) + 1;
  return { bar: index + 1, beat: Math.min(grid.meter, beat) };
}

export function sectionRanges(grid) {
  return grid.sections.map((section, index, sections) => ({
    ...section,
    start: index === 0 ? 0 : barBeatToSeconds(grid, section.bars[0]),
    end: index + 1 < sections.length ? barBeatToSeconds(grid, sections[index + 1].bars[0]) : grid.duration,
  }));
}
