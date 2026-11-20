"""Coarse text maps of rig cut-outs (where each one has pixels), in image fractions. usage: rig_map.py g41_a g50_a ..."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

R = Path(__file__).resolve().parents[1] / 'art/sample/rig'
COLS = 46
for n in sys.argv[1:]:
    al = np.asarray(Image.open(R / f'{n}.png'))[..., 3] > 128
    h, w = al.shape; ys, xs = np.nonzero(al)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    cw = (x1 - x0) / COLS; rows = max(1, round((y1 - y0) / (cw * 2.1)))
    print(f'{n}: x {x0 / w:.3f}..{x1 / w:.3f}  y {y0 / h:.3f}..{y1 / h:.3f}  (# >60% filled, + >15%)')
    for r in range(rows):
        ya, yb = y0 + (y1 - y0) * r // rows, y0 + (y1 - y0) * (r + 1) // rows
        line = ''
        for c in range(COLS):
            xa, xb = x0 + int(c * cw), x0 + int((c + 1) * cw) + 1
            f = al[ya:max(yb, ya + 1), xa:xb].mean()
            line += '#' if f > 0.6 else '+' if f > 0.15 else '.'
        print(f'  {(ya + yb) / 2 / h:.2f} {line}')
