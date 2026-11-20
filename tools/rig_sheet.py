"""Sheet of the rig cut-outs (art/sample/rig) on green with image-fraction grid lines, to place pivots. usage: rig_sheet.py"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
R = ROOT / 'art/sample/rig'
meta = json.loads((R / 'rigs.json').read_text(encoding='utf-8'))
font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 16)
CW, CH, G = 480, 400, 6
cells = []
for name, m in meta.items():
    for i, part in enumerate(m['parts']):
        bxs = [s['box'] for s in (part['a'], part['b']) if s]
        x0, y0 = max(0, min(b[0] for b in bxs) - 0.04), max(0, min(b[1] for b in bxs) - 0.04)
        x1, y1 = min(1, max(b[2] for b in bxs) + 0.04), min(1, max(b[3] for b in bxs) + 0.04)
        for suf in ('a', 'b'):
            im = Image.open(R / f'{name}{i}_{suf}.png'); w, h = im.size
            pl = Image.open(R / f'{name}{i}_p.png').convert('RGB')
            dim = Image.blend(pl, Image.new('RGB', pl.size, (0, 120, 0)), 0.72); dim.paste(im, (0, 0), im)
            c = dim.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)))
            s = min(CW / c.width, CH / c.height); c = c.resize((int(c.width * s), int(c.height * s)), Image.LANCZOS)
            cell = Image.new('RGB', (CW, CH), (30, 30, 30)); cell.paste(c, (0, 0)); d = ImageDraw.Draw(cell)
            span = max(x1 - x0, y1 - y0); step = next(st for st in (0.02, 0.05, 0.1, 0.2) if span / st <= 9)
            for k in range(int(1 / step) + 1):
                v = round(k * step, 2)
                if x0 < v < x1:
                    X = (v - x0) / (x1 - x0) * c.width; d.line((X, 0, X, c.height), fill=(0, 255, 255)); d.text((X + 2, 1), f'{v:.2f}'[1:], fill=(0, 255, 255), font=font)
                if y0 < v < y1:
                    Y = (v - y0) / (y1 - y0) * c.height; d.line((0, Y, c.width, Y), fill=(0, 255, 255)); d.text((2, Y + 1), f'{v:.2f}'[1:], fill=(0, 255, 255), font=font)
            lab = f'{name}{i}_{suf}'; d.rectangle((0, CH - 22, 10 * len(lab) + 10, CH), fill=(0, 0, 0)); d.text((5, CH - 20), lab, fill=(255, 255, 255), font=font)
            cells.append(cell)
cols = 4
rows = -(-len(cells) // cols)
sh = Image.new('RGB', (cols * (CW + G) + G, rows * (CH + G) + G), (90, 90, 90))
for k, c in enumerate(cells):
    sh.paste(c, (G + (k % cols) * (CW + G), G + (k // cols) * (CH + G)))
sh.save(ROOT / 'out/diag/rig_sheet.jpg', quality=86)
print(sh.size)
