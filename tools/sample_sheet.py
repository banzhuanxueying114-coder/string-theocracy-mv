"""Contact sheets of art/sample/*.png (labelled), for checking the generated shots. usage: sample_sheet.py [id ...]"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
D = ROOT / 'art/sample'
ORDER = ['g4_hand_seam', 'g5_hand_bare', 'g6_believer', 'g7_sewn', 'h1_scissors', 'h2_burst', 'i1_fist', 'i1_open', 'i2_foot', 'i3_blood',
         'i4_hoods', 'i5_wrist', 'i6_walk', 'i7_newdoll', 'i8_faceoff', 'i9_raise', 'i10_crack', 'i11_shatter', 'bg_dark']
names = sys.argv[1:] or ORDER
W, H, G, COLS = 800, 450, 10, 2
font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 26)
per = 6
for page, a in enumerate(range(0, len(names), per)):
    chunk = names[a:a + per]
    rows = -(-len(chunk) // COLS)
    sheet = Image.new('RGB', (COLS * W + (COLS + 1) * G, rows * H + (rows + 1) * G), (60, 60, 60))
    dr = ImageDraw.Draw(sheet)
    for i, n in enumerate(chunk):
        p = D / f'{n}.png'
        x, y = G + (i % COLS) * (W + G), G + (i // COLS) * (H + G)
        if not p.exists():
            dr.text((x + 10, y + 10), f'{n} MISSING', fill='red', font=font)
            continue
        im = Image.open(p).convert('RGB')
        print(n, im.size)
        sheet.paste(im.resize((W, H), Image.LANCZOS), (x, y))
        dr.rectangle((x, y, x + 16 * len(n) + 16, y + 34), fill=(0, 0, 0))
        dr.text((x + 8, y + 4), n, fill=(255, 255, 255), font=font)
    out = ROOT / f'out/sample_sheet_{page + 1}.jpg'
    out.parent.mkdir(exist_ok=True)
    sheet.save(out, quality=88)
    print('wrote', out.name, sheet.size)
