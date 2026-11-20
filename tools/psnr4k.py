import sys, glob, os
import numpy as np
from PIL import Image
a, b = sys.argv[1], sys.argv[2]
for f in sorted(glob.glob(os.path.join(a, '*.png'))):
    n = os.path.basename(f)
    x = Image.open(f).convert('RGB'); y = Image.open(os.path.join(b, n)).convert('RGB')
    if y.size != (3840, 2160) and y.size != x.size: print(n, 'size', y.size); continue
    if y.size != x.size: y = y.resize(x.size, Image.LANCZOS)
    d = np.asarray(x, np.float64) - np.asarray(y, np.float64)
    mse = (d ** 2).mean()
    print(n, x.size, 'PSNR %.2f dB' % (99 if mse == 0 else 10 * np.log10(255 ** 2 / mse)))
