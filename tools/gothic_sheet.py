from pathlib import Path
from PIL import Image, ImageOps
root = Path(__file__).resolve().parents[1] / 'art/gothic'
ids = ['g1_control','g2_alive','g3_icon']
sheet = Image.new('RGB', (1440, 3*810+4*16), '#111113')
for i, name in enumerate(ids):
    with Image.open(root / (name + '.png')) as im:
        tile = ImageOps.fit(im.convert('RGB'), (1440,810), method=Image.Resampling.LANCZOS)
        sheet.paste(tile, (0,16+i*826))
sheet.save(root / 'comparison.jpg', quality=92)
print(root / 'comparison.jpg')
