"""Pictures with a 10% coordinate grid, for placing pivots and boxes. usage: grid_sheet.py <out.jpg> <cols> <id> [...]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
S = ROOT / 'art/sample'
out, cols, ids = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 18)
import os
w = int(os.environ.get("CELL", 960)); h = w * 9 // 16; G = 4
rows = -(-len(ids) // cols)
sheet = Image.new('RGB', (cols * w + (cols + 1) * G, rows * h + (rows + 1) * G), (70, 70, 70))
for i, n in enumerate(ids):
    p = S / f'{n}.png'
    im = Image.open(p).convert('RGBA')
    bg = Image.new('RGBA', im.size, (0, 90, 0, 255)); bg.alpha_composite(im)
    im = bg.convert('RGB').resize((w, h), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for k in range(1, 20):
        major = k % 2 == 0
        d.line((k * w / 20, 0, k * w / 20, h), fill=(0, 255, 255) if major else (0, 110, 110), width=1)
        d.line((0, k * h / 20, w, k * h / 20), fill=(0, 255, 255) if major else (0, 110, 110), width=1)
        if major:
            d.text((k * w / 20 + 3, 2), f'.{k // 2}', fill=(0, 255, 255), font=font)
            d.text((3, k * h / 20 + 2), f'.{k // 2}', fill=(0, 255, 255), font=font)
    d.rectangle((w - 12 * len(n) - 14, h - 26, w, h), fill=(0, 0, 0)); d.text((w - 12 * len(n) - 8, h - 23), n, fill=(255, 255, 255), font=font)
    sheet.paste(im, (G + (i % cols) * (w + G), G + (i // cols) * (h + G)))
sheet.save(ROOT / out, quality=85)
print(out, sheet.size)
