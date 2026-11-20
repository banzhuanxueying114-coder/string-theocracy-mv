"""Stacked reference sheets for shots that need two designs at once."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
W = 1400


def stack(out, *names):
    ims = []
    for n in names:
        im = Image.open(ROOT / n).convert('RGB')
        ims.append(im.resize((W, round(im.height * W / im.width)), Image.LANCZOS))
    sheet = Image.new('RGB', (W, sum(i.height for i in ims)), 'white')
    y = 0
    for im in ims:
        sheet.paste(im, (0, y))
        y += im.height
    sheet.save(ROOT / out)
    print(out, sheet.size)


stack('art/ref/both.png', 'art/ref/maid_sheet.png', 'art/ref/librarian_sheet.png')
stack('art/ref/lib_icon.png', 'art/ref/librarian_sheet.png', 'art/gothic/g5_divine_openarms.png')
