from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'art' / 'motion'
INK = ROOT / 'art' / 'ink'
ART.mkdir(parents=True, exist_ok=True)


def export(name, scale):
    with Image.open(INK / f'{name}.png') as im:
        alpha = im.getchannel('A')
        size = (round(im.width * scale), round(im.height * scale))
        alpha = alpha.resize(size, Image.Resampling.LANCZOS)
    a = np.asarray(alpha)
    for suffix, mask in [('paper', a), ('orange', a), ('coal', a)]:
        if suffix == 'orange':
            with Image.open(INK / f'{name}_o.png') as o, Image.open(INK / f'{name}_k.png') as k:
                m = np.maximum(np.asarray(o.getchannel('A')), np.asarray(k.getchannel('A')))
            mask = Image.fromarray(m).resize(size, Image.Resampling.LANCZOS)
        elif suffix == 'coal':
            with Image.open(INK / f'{name}_k.png') as k:
                mask = k.getchannel('A').resize(size, Image.Resampling.LANCZOS)
        elif suffix == 'paper':
            mask = Image.fromarray(a)
        rgba = Image.new('RGBA', size, (255, 255, 255, 0))
        rgba.putalpha(mask)
        rgba.save(ART / f'{name}_{suffix}.png')

export('ink_A_maid_flower', .55)
export('ink_C_hand', .77)

src = ROOT / 'out' / 'style' / 'gen' / 'r10_B_final_plates'
with Image.open(src / 'o.png') as o, Image.open(src / 'k.png') as k:
    orange = np.maximum(np.asarray(o.convert('L')), np.asarray(k.convert('L')))
    coal = np.asarray(k.convert('L'))
for suffix, a in [('orange', orange), ('coal', coal)]:
    rgba = Image.new('RGBA', (a.shape[1], a.shape[0]), (255, 255, 255, 0))
    rgba.putalpha(Image.fromarray(a))
    rgba.save(ART / f'B_{suffix}.png')
with Image.open(src / 'g.png') as g, Image.open(src / 'k.png') as k:
    ga = np.asarray(g.convert('L'))
    ka = np.asarray(k.convert('L'))
ys, xs = np.where(ga > 128)
print(f'gold thread x median={np.median(xs):.1f}, range={xs.min()}..{xs.max()}')
# Find the highest continuous non-coal gap in the gold thread near its top intersection.
x = int(round(np.median(xs)))
rows = np.where(ga[:, x] > 128)[0]
print(f'gold centerline x={x}; y extent={rows.min()}..{rows.max()}')
# Cut is at the lower apex where the two open scissor blades meet the thread.
# Inspect row-wise gold occupancy and report candidate contact near the scissor hub.
for y in range(400, 620):
    if ga[y, x] > 128:
        print(f'centerline gold at y={y}; coal mask={int(ka[y, x])}')
        break
print(f'Wrote motion plates to {ART}')
