"""Numeric checks for the revised sample: where things are in the ending pictures (coarse maps), lyric widths, still stats."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFont

ROOT = Path(__file__).resolve().parents[1]
S = ROOT / 'art/sample'
GW, GH = 40, 18


def load(n, size=(GW * 8, GH * 8)):
    return np.asarray(Image.open(S / f'{n}.png').convert('RGB').resize(size, Image.LANCZOS), np.int16)


def amap(mask, title):
    print(title)
    print('     ' + ''.join(str(i % 10) if i % 4 == 0 else ' ' for i in range(GW)) + '   (x: column/40)')
    m = mask.reshape(GH, 8, GW, 8).mean((1, 3))
    for r in range(GH):
        print(f'{r / GH:4.2f} ' + ''.join('#' if v > 0.5 else '+' if v > 0.2 else '.' if v > 0.05 else ' ' for v in m[r]))


luma = lambda a: a @ np.array([0.299, 0.587, 0.114])
b, c = load('i10_before'), load('i10_crack')
amap((np.abs(b - c).max(2) > 60) & (luma(c) < 70), 'i10: dark pixels that are new in i10_crack (the scissors)')
amap(np.abs(b - c).max(2) > 60, 'i10: everything that changed between i10_before and i10_crack')
af, ck, rz, ht = load('i11_after'), load('i11_cracked'), load('i9_raise'), load('i11_hit')
amap(luma(af) > 215, 'i11_after: near-white area (the empty window)')
amap(luma(af) < 40, 'i11_after: near-black area (stone, her silhouette)')
amap(np.abs(ck - rz).max(2) > 60, 'i11_cracked vs i9_raise: changed')
amap((np.abs(ht - rz).max(2) > 60) & (luma(ht) < 60), 'i11_hit: dark pixels new vs i9_raise (thrown scissors, her arm)')
for a, bb in (('i11_cracked', 'i9_raise'), ('i11_cracked', 'i11_after'), ('i10_before', 'i10_crack')):
    d = np.abs(load(a) - load(bb)).max(2)
    print(f'{a} vs {bb}: changed {(d > 40).mean() * 100:.1f}%  median {np.median(d):.0f}')

print('lyric extents at 1920 wide (x0..x1), punch 1.1 included:')
for font, size, x, align, text in [
    ('VLADIMIR.TTF', 62, 1330, 'l', "Maybe we're all"), ('VLADIMIR.TTF', 62, 1290, 'l', 'the human skin'), ('VLADIMIR.TTF', 62, 1400, 'l', 'With human sins'),
    ('VLADIMIR.TTF', 62, 960, 'c', 'Sewed up by the gods of city'), ('VLADIMIR.TTF', 200, 150, 'l', 'Cut it off,'), ('VLADIMIR.TTF', 172, 420, 'l', "you've already lost"),
    ('VLADIMIR.TTF', 84, 90, 'l', 'All that precious'), ('VLADIMIR.TTF', 96, 90, 'l', 'is gonna get you'), ('VLADIMIR.TTF', 78, 960, 'c', 'In a world that feeds'),
    ('VLADIMIR.TTF', 84, 1010, 'l', 'May that self-centered'), ('VLADIMIR.TTF', 112, 110, 'l', 'lead you to peace'), ('VLADIMIR.TTF', 106, 960, 'c', "If you're gonna replace me"),
    ('VLADIMIR.TTF', 92, 960, 'c', 'At least have the'), ('VLADIMIR.TTF', 150, 960, 'c', 'to kill me thoroughly')]:
    w = ImageFont.truetype(f'C:/Windows/Fonts/{font}', size).getlength(text)
    x0 = x - w / 2 if align == 'c' else x
    grow = w * 0.05
    print(f'  {text:30s} w {w:6.0f}  {x0 - grow:6.0f}..{x0 + w + grow:6.0f}  {"OK" if x0 - grow > 20 and x0 + w + grow < 1900 else "OUT OF FRAME"}')

print('stills (mean luma, %white, %black):')
for p in sorted((ROOT / 'out/v2').glob('*.png')):
    L = luma(np.asarray(Image.open(p).convert('RGB').resize((480, 270)), np.int16))
    print(f'  {p.stem}  {L.mean():5.1f}  {(L > 235).mean() * 100:5.1f}  {(L < 12).mean() * 100:5.1f}')
