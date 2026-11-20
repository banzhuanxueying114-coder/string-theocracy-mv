"""Cut two same-camera pose keys into layers that code can move (no interpolated frames).
Per part: a background plate (what is behind the moving thing) and one crisp cut-out per key, all full-frame RGBA:
art/sample/rig/<name><i>_p.png / _a.png / _b.png, plus art/sample/rig/rigs.json with each cut-out's centroid and axis angle
so the engine can carry cut-out a toward where cut-out b sits and swap them half-way. usage: make_rigs.py [name ...]"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
S = ROOT / 'art/sample'
OUT = S / 'rig'
OUT.mkdir(exist_ok=True)
# name: (key a, key b, [(box in image fractions, plate mode 'auto' | 'A' | 'B'), ...])
RIGS = {
    'g4': ('g4_hand_seam', 'g4_hand_turn', [((0.04, 0.28, 0.47, 0.84), 'auto'), ((0.56, 0.40, 0.82, 0.74), 'auto')]),
    'g5': ('g5_hand_half', 'g5_hand_bare', [((0.26, 0.13, 0.63, 0.97), 'B')]),
    'g6': ('g6_hooded', 'g6_believer', [((0.30, 0.0, 0.84, 0.72), 'B')]),
    'i2': ('i2_lift', 'i2_foot', [((0.18, 0.0, 0.76, 0.90), 'auto')]),
    'i4': ('i4_rise', 'i4_hoods', [((0.35, 0.29, 0.67, 0.71), 'auto')]),
    'i5': ('i5_wrist', 'i5_turn', [((0.24, 0.0, 0.70, 1.0), 'auto')]),
    'i8': ('i8_faceoff', 'i8_reach', [((0.0, 0.08, 0.70, 1.0), 'auto')]),
    'i9': ('i9_low', 'i9_raise', [((0.42, 0.55, 0.58, 0.97), 'auto')]),
    'i9h': ('i9_raise', 'i11_hit', [((0.42, 0.55, 0.58, 0.97), 'auto')]),
}
names = sys.argv[1:]


def box(a, r):
    if r <= 0:
        return a
    k = 2 * r + 1
    for ax in (0, 1):
        p = np.pad(a, [(r + 1, r) if i == ax else (0, 0) for i in range(a.ndim)], mode='edge')
        c = np.cumsum(p, axis=ax, dtype=np.float64)
        a = (np.take(c, range(k, c.shape[ax]), axis=ax) - np.take(c, range(0, c.shape[ax] - k), axis=ax)) / k
    return a


def fill(img, known):
    out = np.zeros_like(img); done = known.copy(); out[known] = img[known]
    for r in (3, 6, 12, 24, 48, 96, 192):
        den = box(box(known.astype(np.float64), r), r)
        num = box(box(img * known[..., None], r), r)
        ok = (den > 0.08) & ~done
        out[ok] = num[ok] / den[ok][:, None]; done |= ok
    out[~done] = img[known].mean(0)
    return out


def big_blobs(mask, least):
    """Drop connected blobs smaller than `least` cells of a 1/4-size grid."""
    h, w = mask.shape; hh, ww = h // 4, w // 4
    m = mask[:hh * 4, :ww * 4].reshape(hh, 4, ww, 4).max((1, 3)); seen = np.zeros_like(m); keep = np.zeros_like(m)
    for y0, x0 in zip(*np.nonzero(m)):
        if seen[y0, x0]:
            continue
        st = [(y0, x0)]; seen[y0, x0] = True; cells = []
        while st:
            y, x = st.pop(); cells.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < hh and 0 <= xx < ww and m[yy, xx] and not seen[yy, xx]:
                        seen[yy, xx] = True; st.append((yy, xx))
        if len(cells) >= least:
            for y, x in cells:
                keep[y, x] = True
    full = np.zeros_like(mask); full[:hh * 4, :ww * 4] = np.repeat(np.repeat(keep, 4, 0), 4, 1)
    return mask & full


def solid(mask):
    """Close gaps and fill enclosed holes, so a moving part is one solid silhouette instead of edge slivers."""
    m = box(mask.astype(np.float64), 6) > 0.01
    h, w = m.shape; hh, ww = h // 4, w // 4
    q = m[:hh * 4, :ww * 4].reshape(hh, 4, ww, 4).max((1, 3)); out = np.zeros_like(q)
    st = [(y, x) for y in range(hh) for x in (0, ww - 1)] + [(y, x) for x in range(ww) for y in (0, hh - 1)]
    while st:
        y, x = st.pop()
        if 0 <= y < hh and 0 <= x < ww and not out[y, x] and not q[y, x]:
            out[y, x] = True; st += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    full = np.ones_like(m); full[:hh * 4, :ww * 4] = np.repeat(np.repeat(~out, 4, 0), 4, 1)
    return box(full.astype(np.float64), 6) > 0.99


def shape(al, w, h):
    ys, xs = np.nonzero(al > 0.5)
    if len(xs) < 50:
        return None
    cx, cy = xs.mean(), ys.mean(); dx, dy = xs - cx, ys - cy
    sxx, syy, sxy = (dx * dx).mean(), (dy * dy).mean(), (dx * dy).mean()
    ang = 0.5 * math.atan2(2 * sxy, sxx - syy); t = math.sqrt(((sxx - syy) / 2) ** 2 + sxy ** 2); m = (sxx + syy) / 2
    return {'c': [round(float(cx) / w, 4), round(float(cy) / h, 4)], 'ang': round(ang, 3), 'elong': round(math.sqrt((m + t) / max(m - t, 1e-6)), 2),
            'area': round(len(xs) / w / h, 4), 'box': [round(float(v), 3) for v in (xs.min() / w, ys.min() / h, xs.max() / w, ys.max() / h)]}


jf = OUT / 'rigs.json'
meta = json.loads(jf.read_text(encoding='utf-8')) if jf.exists() else {}
for name, (ka, kb, parts) in RIGS.items():
    if names and name not in names:
        continue
    A = np.asarray(Image.open(S / f'{ka}.png').convert('RGB'), dtype=np.float64)
    imb = Image.open(S / f'{kb}.png').convert('RGB')
    if imb.size != (A.shape[1], A.shape[0]):
        imb = imb.resize((A.shape[1], A.shape[0]), Image.LANCZOS)
    B = np.asarray(imb, dtype=np.float64); h, w = A.shape[:2]
    d = np.abs(box(A, 1) - box(B, 1)).max(2)
    Dall = box((d > 28).astype(np.float64), 2) > 0.45
    out = []
    for i, (bx, mode) in enumerate(parts):
        m = np.zeros_like(Dall); m[int(bx[1] * h):int(bx[3] * h), int(bx[0] * w):int(bx[2] * w)] = True
        D = solid(big_blobs(Dall & m, 40)) & m
        Dd = box(D.astype(np.float64), 4) > 0.01
        fromfill = 0.0
        if mode == 'auto':
            f = fill(A, ~Dd)
            da, db = np.abs(A - f).max(2), np.abs(B - f).max(2)
            a_bg = box((da < db).astype(np.float64), 3) > 0.5
            over = (box((np.minimum(da, db) > 42).astype(np.float64), 2) > 0.5) & Dd
            P = np.where(over[..., None], f, np.where(a_bg[..., None], A, B)); fromfill = over.sum() / max(Dd.sum(), 1)
        else:
            P = A if mode == 'A' else B
        P = np.where(Dd[..., None], P, A)

        def sprite(K):
            e = box(np.abs(K - P).max(2), 1)
            al = np.clip((e - 16) / 18, 0, 1) * Dd
            al = al * (box((al > 0.5).astype(np.float64), 2) > 0.3)
            return box(al, 1)

        aa, ab = sprite(A), sprite(B)
        pa = box(Dd.astype(np.float64), 2)
        for suf, rgb, al in (('p', P, pa), ('a', A, aa), ('b', B, ab)):
            Image.fromarray(np.dstack([rgb, al * 255]).astype(np.uint8), 'RGBA').save(OUT / f'{name}{i}_{suf}.png')
        # does plate + cut-out give the key back? (mean abs error inside the part, 0..255)
        ra = np.abs(A * aa[..., None] + P * (1 - aa[..., None]) - A).max(2)[Dd].mean()
        rb = np.abs(B * ab[..., None] + P * (1 - ab[..., None]) - B).max(2)[Dd].mean()
        sa, sb = shape(aa, w, h), shape(ab, w, h)
        out.append({'a': sa, 'b': sb})
        print(f'{name}{i}: part {D.mean() * 100:.1f}% of frame, plate from inpaint {fromfill * 100:.0f}%, rebuild error a {ra:.1f} b {rb:.1f}')
        print(f'    a {sa}\n    b {sb}')
    meta[name] = {'a': ka, 'b': kb, 'parts': out}
jf.write_text(json.dumps(meta, indent=1), encoding='utf-8')
print('wrote', jf.name, list(meta))
