from pathlib import Path
from PIL import Image
import numpy as np
r=Path(__file__).resolve().parents[1]
for name in ['i5_turn','clean/i5_hand','clean/i5_plate','clean/i8_arm']:
    p=r/'art/sample'/(name+'.png')
    a=np.array(Image.open(p).convert('RGBA'))
    print(name, a.shape, 'alpha range', int(a[:,:,3].min()), int(a[:,:,3].max()))
    for x,y in [(.45,.19),(.55,.15),(.8,.15),(.8,.3),(.48,.4)]:
        print(x,y,a[int(y*a.shape[0]),int(x*a.shape[1])].tolist())
    if 'hand' in name or 'arm' in name:
        im=Image.open(p).convert('RGBA')
        bg=Image.new('RGBA',im.size,(70,90,110,255))
        bg.alpha_composite(im)
        out=r/'out/diag'/(p.stem+'_opaque.png')
        bg.convert('RGB').save(out)
        print('inspection',out)
