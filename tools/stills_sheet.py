"""Contact sheet of rendered stills. usage: stills_sheet.py <out.jpg> <cols> <still.png> [...]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
W, H, G = 960, 540, 8
font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 24)
rows = -(-len(files) // cols)
sheet = Image.new('RGB', (cols * W + (cols + 1) * G, rows * H + (rows + 1) * G), (70, 70, 70))
dr = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    p = ROOT / f
    x, y = G + (i % cols) * (W + G), G + (i // cols) * (H + G)
    sheet.paste(Image.open(p).convert('RGB').resize((W, H), Image.LANCZOS), (x, y))
    label = p.stem
    dr.rectangle((x, y, x + 15 * len(label) + 14, y + 32), fill=(0, 0, 0))
    dr.text((x + 7, y + 4), label, fill=(255, 255, 255), font=font)
sheet.save(ROOT / out, quality=88)
print(out, sheet.size)
