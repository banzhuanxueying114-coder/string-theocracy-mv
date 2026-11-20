"""Key out the green background and split a generated silhouette into three flat ink plates.

in : art/style/<name>.png            (character on chroma green)
out: art/ink/<name>.png              (RGBA, three flat inks, clean alpha)
     art/ink/<name>_{o,c,k}.png      (one white-on-transparent plate per ink: orange, cream, black)
Prints how much of the figure each ink covers and how many leftover green-ish pixels remain.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC, DST = ROOT / "art" / "style", ROOT / "art" / "ink"
INKS = {"o": (226, 114, 58), "c": (243, 226, 196), "k": (33, 24, 21)}       # output colours
REF = np.array([(238, 112, 30), (245, 228, 195), (30, 22, 20)], np.float32)  # what the generator draws


def blur(a, r):
    return np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255


def split(name):
    im = np.asarray(Image.open(SRC / f"{name}.png").convert("RGB"), np.float32)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    green = g - np.maximum(r, b)                      # > 0 only where the key colour shows
    alpha = np.clip(1 - (green - 30) / 90, 0, 1)
    # pull the matte in by one pixel so no green fringe survives, then soften it again
    hard = Image.fromarray(((alpha > 0.5) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))
    alpha = blur(np.asarray(hard, np.float32) / 255, 0.8)

    spill = im.copy()
    spill[..., 1] = np.minimum(g, np.maximum(r, b))    # despill before deciding the ink
    d = ((spill[..., None, :] - REF[None, None]) ** 2).sum(-1)
    label = d.argmin(-1)

    plates = np.stack([blur((label == i).astype(np.float32), 0.7) for i in range(3)], -1)
    plates /= plates.sum(-1, keepdims=True) + 1e-6
    cols = np.array([INKS[k] for k in "ock"], np.float32)
    rgb = (plates[..., None] * cols[None, None]).sum(2)

    DST.mkdir(parents=True, exist_ok=True)
    out = np.dstack([rgb, alpha * 255]).round().astype(np.uint8)
    Image.fromarray(out, "RGBA").save(DST / f"{name}.png")
    for i, k in enumerate("ock"):
        pa = (plates[..., i] * alpha * 255).round().astype(np.uint8)
        white = np.full(pa.shape + (3,), 255, np.uint8)
        Image.fromarray(np.dstack([white, pa]), "RGBA").save(DST / f"{name}_{k}.png")

    inside = alpha > 0.5
    share = [(label[inside] == i).mean() * 100 for i in range(3)]
    o = out[..., :3].astype(np.int32)
    leftover = int(((o[..., 1] - np.maximum(o[..., 0], o[..., 2]) > 20) & (out[..., 3] > 8)).sum())
    ys, xs = np.where(inside)
    print(f"{name}: {im.shape[1]}x{im.shape[0]}  figure {inside.mean()*100:.1f}% of frame  "
          f"bbox x{xs.min()}-{xs.max()} y{ys.min()}-{ys.max()}  "
          f"orange {share[0]:.1f}% cream {share[1]:.1f}% black {share[2]:.1f}%  green-ish leftover px: {leftover}")


for n in sys.argv[1:] or ["ink_A_maid_full", "ink_B_librarian_cut", "ink_C_hand"]:
    split(n)
