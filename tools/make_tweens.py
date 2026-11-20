"""In-between frames for pose-key pairs (ffmpeg motion interpolation) -> art/sample/tween/<a>__<b>_<k>.jpg, k = 1..N.
Also writes out/diag/grid.jpg: selected pictures with a 10% coordinate grid, for placing code-drawn strings."""
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
S = ROOT / 'art/sample'
T = S / 'tween'
T.mkdir(exist_ok=True)
N = 5
PAIRS = [('g4_hand_seam', 'g4_hand_turn'), ('g5_hand_half', 'g5_hand_bare'), ('g6_hooded', 'g6_believer'), ('h1_scissors', 'h1_cut'),
         ('h2_curl', 'h2_burst'), ('i1_fist', 'i1_half'), ('i1_half', 'i1_open'), ('i2_lift', 'i2_foot'), ('i2_foot', 'i3_blood'),
         ('i4_rise', 'i4_hoods'), ('i5_wrist', 'i5_turn'), ('i6_stand', 'i6_walk'), ('i8_faceoff', 'i8_reach'), ('i9_low', 'i9_raise'),
         ('i9_raise', 'i11_hit')]
tmp = ROOT / 'out/diag/tween_tmp'
tmp.mkdir(parents=True, exist_ok=True)
for a, b in PAIRS:
    if (T / f'{a}__{b}_{N}.jpg').exists() and '--force' not in sys.argv:
        continue
    for f in tmp.glob('*'):
        f.unlink()
    for k, n in enumerate((a, b, b)):
        Image.open(S / f'{n}.png').convert('RGB').save(tmp / f'k{k}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '1', '-i', str(tmp / 'k%d.png'), '-vf',
                    f'minterpolate=fps={N + 1}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none', '-q:v', '2', str(tmp / 'o%03d.jpg')], check=True)
    for k in range(1, N + 1):
        (tmp / f'o{k + 1:03d}.jpg').replace(T / f'{a}__{b}_{k}.jpg')
    print('tween', a, b)

font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 20)
ids = ['i11_hit', 'i11_after', 'i11_shatter', 'i10_crack', 'g5_hand_bare', 'i5_wrist']
w, h, G = 960, 540, 6
sheet = Image.new('RGB', (2 * w + 3 * G, 3 * h + 4 * G), (70, 70, 70))
for i, n in enumerate(ids):
    im = Image.open(S / f'{n}.png').convert('RGB').resize((w, h), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for k in range(1, 10):
        d.line((k * w / 10, 0, k * w / 10, h), fill=(0, 255, 255), width=1)
        d.line((0, k * h / 10, w, k * h / 10), fill=(0, 255, 255), width=1)
        d.text((k * w / 10 + 3, 2), f'.{k}', fill=(0, 255, 255), font=font)
        d.text((3, k * h / 10 + 2), f'.{k}', fill=(0, 255, 255), font=font)
    d.text((w - 180, h - 26), n, fill=(255, 255, 255), font=font)
    sheet.paste(im, (G + (i % 2) * (w + G), G + (i // 2) * (h + G)))
sheet.save(ROOT / 'out/diag/grid.jpg', quality=85)
print('grid done')
