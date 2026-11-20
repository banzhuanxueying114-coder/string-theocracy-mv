# Usage: python tools/contact.py OUT.jpg IMG... — tiles images (each fit to 760x507) into a contact sheet with labels
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
W, H, cols = 760, 507, 2
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (W * cols, (H + 24) * rows), 'white')
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB'); im.thumbnail((W, H))
    x, y = (i % cols) * W, (i // cols) * (H + 24)
    sheet.paste(im, (x + (W - im.width) // 2, y + 24)); d.text((x + 6, y + 4), f.split('/')[-1], fill='black')
sheet.save(out, quality=88)
