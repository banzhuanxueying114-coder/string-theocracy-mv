"""Pose-key pairs side by side (out/diag/pairs.jpg) with a changed-pixel fraction, plus an ffmpeg
motion-interpolation test between keys (out/diag/interp.jpg)."""
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
S = ROOT / 'art/sample'
D = ROOT / 'out/diag'
D.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 18)
PAIRS = [('g4_hand_seam', 'g4_hand_turn'), ('g5_hand_half', 'g5_hand_bare'), ('g6_hooded', 'g6_believer'), ('h1_scissors', 'h1_cut'),
         ('h2_curl', 'h2_burst'), ('i1_fist', 'i1_half'), ('i1_half', 'i1_open'), ('i2_lift', 'i2_foot'), ('i4_rise', 'i4_hoods'),
         ('i5_wrist', 'i5_turn'), ('i6_stand', 'i6_walk'), ('i8_faceoff', 'i8_reach'), ('i9_low', 'i9_raise'), ('i9_raise', 'i11_hit'),
         ('i11_hit', 'i11_after'), ('i11_hit', 'i11_shatter')]
w, h, G = 400, 225, 6
sheet = Image.new('RGB', (4 * w + 5 * G, 8 * h + 9 * G), (70, 70, 70))
dr = ImageDraw.Draw(sheet)
for i, (a, b) in enumerate(PAIRS):
    A, B = [Image.open(S / f'{n}.png').convert('RGB').resize((w, h), Image.LANCZOS) for n in (a, b)]
    d = np.abs(np.asarray(A, np.int16) - np.asarray(B, np.int16)).max(2)
    frac = (d > 40).mean()
    ys, xs = np.nonzero(d > 40)
    box = (xs.min() / w, ys.min() / h, xs.max() / w, ys.max() / h) if len(xs) else (0, 0, 0, 0)
    print(f'{a:13s} -> {b:13s} changed {frac * 100:5.1f}%  median {np.median(d):4.1f}  box x {box[0]:.2f}-{box[2]:.2f} y {box[1]:.2f}-{box[3]:.2f}')
    r, c = i // 2, (i % 2) * 2
    for k, (im, n) in enumerate(((A, a), (B, b))):
        x, y = G + (c + k) * (w + G), G + r * (h + G)
        sheet.paste(im, (x, y)); dr.rectangle((x, y, x + 11 * len(n) + 8, y + 22), fill=(0, 0, 0)); dr.text((x + 4, y + 2), n, fill=(255, 255, 255), font=font)
sheet.save(D / 'pairs.jpg', quality=85)

# motion-compensated in-betweens with ffmpeg minterpolate
rows = []
for keys in (('i1_fist', 'i1_half', 'i1_open'), ('g4_hand_seam', 'g4_hand_turn'), ('i8_faceoff', 'i8_reach'), ('h2_curl', 'h2_burst')):
    tmp = D / 'interp_tmp'; tmp.mkdir(exist_ok=True)
    for f in tmp.glob('*'): f.unlink()
    seq = list(keys) + [keys[-1]]
    for k, n in enumerate(seq): Image.open(S / f'{n}.png').convert('RGB').resize((836, 470), Image.LANCZOS).save(tmp / f'k{k:02d}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '1', '-i', str(tmp / 'k%02d.png'), '-vf',
                    'minterpolate=fps=4:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none', str(tmp / 'o%03d.png')], check=True)
    outs = sorted(tmp.glob('o*.png'))[: 4 * (len(keys) - 1) + 1]
    print(keys, 'frames', len(outs))
    rows.append([Image.open(o).convert('RGB').resize((320, 180)) for o in outs[:6]])
st = Image.new('RGB', (6 * 320, len(rows) * 180), (0, 0, 0))
for r, ims in enumerate(rows):
    for c, im in enumerate(ims): st.paste(im, (c * 320, r * 180))
st.save(D / 'interp.jpg', quality=85)
print('done')
