from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[1]
files = sorted((root / 'out/woodcut_stills').glob('*.png'))
board = Image.new('RGB', (1440, 3*430), '#171c1b')
d = ImageDraw.Draw(board)
for i, file in enumerate(files):
    im = Image.open(file).convert('RGB')
    im.thumbnail((720,405))
    x, y = (i%2)*720, (i//2)*430
    board.paste(im, (x,y))
    d.text((x+16,y+409),file.stem,fill='#e7dfc8')
board.save(root / 'out/woodcut_contact.jpg',quality=94)
