import sys
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
w, h = im.size
sh = round(w * 1080 / 1920)
top = (h - sh) // 2
im = im.crop((0, top, w, top + sh)).resize((1920, 1080))
d = ImageDraw.Draw(im)
for x in range(0, 1920, 100):
    d.line([(x, 0), (x, 1080)], fill=(0, 255, 255) if x % 500 == 0 else (0, 120, 120), width=1)
    d.text((x + 2, 2), str(x), fill=(255, 255, 0))
for y in range(0, 1080, 100):
    d.line([(0, y), (1920, y)], fill=(0, 255, 255) if y % 500 == 0 else (0, 120, 120), width=1)
    d.text((2, y + 2), str(y), fill=(255, 255, 0))
im.save(out)
